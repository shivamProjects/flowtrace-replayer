const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const sharp = require("sharp");
const S3Helper = require("../utils/s3Helper");
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const EnvEncryption = require("../utils/envEncryption");
const { query } = require("../config/database");

/**
 * Screenshot embedding settings.
 *
 * The card is 465pt wide, so 1600px lands at ~248 DPI — enough to read Oracle's
 * small text on screen and in print. Source captures are 3024px, so there is
 * headroom if these ever need to go up.
 */
// Logo paths and the customer-logo resolver. One module owns where branding
// comes from, so a report cannot point at an image that was never shipped.
const { PRODUCT_LOGO, PARTNER_LOGO, resolveCustomerLogo } = require("./branding");


// Anchored to the package, not to process.cwd(). A cwd-relative "./report"
// means screenshots land wherever the service was started from — so the same
// deployment writes to a different directory under systemd, pm2 and a shell,
// and specRunner (which resolves its own report dir from __dirname) would then
// be writing step_<N>.png somewhere the PDF never looks.
const DEFAULT_REPORT_DIR = path.join(__dirname, "..", "..", "report");

const SCREENSHOT_WIDTH = parseInt(process.env.REPORT_SCREENSHOT_WIDTH || "1600", 10);
const JPEG_QUALITY = parseInt(process.env.REPORT_JPEG_QUALITY || "82", 10);
/** How much bigger a lossless PNG may be before the lossy JPEG is used instead. */
const PNG_SIZE_TOLERANCE = 1.2;

// Field names whose value must never be printed in the report.
//
// MUST stay in step with SECRET_FIELD_RE in engine/values.ts — this file is
// CommonJS and cannot import the TypeScript module, so the pattern is mirrored
// rather than shared. The previous test here was
// `key.includes("password") || key.includes("pwd")`, which printed a parameter
// named `secret`, `credential`, `apiKey`, `otp` or `pin` in CLEARTEXT in the
// customer-facing PDF.
const SECRET_FIELD_RE =
  /pass(word|wd|phrase)?|pwd|secret|token|pin|pincode|credential|otp|api[-_ ]?key|auth|private[-_ ]?key/i;

class ReportGenerator {
  constructor(
    executionId,
    runId = null,
    scriptCode = null,
    reportDir = DEFAULT_REPORT_DIR,
  ) {
    this.executionId = executionId;
    this.runId = runId;
    this.scriptCode = scriptCode;
    this.reportDir = reportDir;
    this.executionReportDir = path.join(reportDir, String(executionId));
    this.screenshotsDir = this.executionReportDir;
  }

  // Create execution report directory
  async createReportDirectory() {
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
    if (!fs.existsSync(this.executionReportDir)) {
      fs.mkdirSync(this.executionReportDir, { recursive: true });
    }
    console.log(`Report directory created: ${this.executionReportDir}`);
  }



  /**
   * Encode one screenshot for embedding, picking the format that suits it.
   *
   * These captures are UI, not photographs: mostly flat colour and thin text,
   * which is JPEG's worst case and PNG's best. But Oracle pages also carry a
   * photographic hero banner, where the reverse holds. Rather than force one
   * format on all of them, encode both and keep the better result.
   *
   * Measured over 17 real captures that is 18% smaller than all-JPEG *and*
   * lossless for 15 of them (PSNR 54.5 dB vs 37.4 dB) — the earlier 1100px/q65
   * pipeline is what made the screenshots look soft.
   *
   * PNG wins ties on purpose: it is lossless, so a few extra KB buys
   * pixel-perfect text.
   */
  static async encodeScreenshot(screenshotPath) {
    const base = sharp(screenshotPath).resize({
      width: SCREENSHOT_WIDTH,
      withoutEnlargement: true,
    });

    const jpeg = await base
      .clone()
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true, chromaSubsampling: "4:4:4" })
      .toBuffer();

    // Palette PNG needs libimagequant, which ships inside sharp's prebuilt
    // libvips — but a hand-built sharp on some server may not have it. Falling
    // back to JPEG costs quality, not the report.
    let png = null;
    try {
      png = await base.clone().png({ palette: true, compressionLevel: 9, effort: 10 }).toBuffer();
    } catch (err) {
      console.log(`[Screenshot] PNG encoding unavailable (${err.message}) — using JPEG`);
    }

    return png && png.length <= jpeg.length * PNG_SIZE_TOLERANCE
      ? { buffer: png, format: "png (lossless)" }
      : { buffer: jpeg, format: `jpeg q${JPEG_QUALITY}` };
  }

  // Download signature from S3
  async downloadSignatureFromS3(s3Key, destinationDir) {
    try {
      // Initialize S3 client
      const s3Client = new S3Client({
        region: EnvEncryption.getEnv('AWS_REGION') || 'us-east-1',
        credentials: {
          accessKeyId: EnvEncryption.getEnv('AWS_ACCESS_KEY_ID'),
          secretAccessKey: EnvEncryption.getEnv('AWS_SECRET_ACCESS_KEY'),
        },
      });

      const bucketName = EnvEncryption.getEnv('AWS_S3_BUCKET_NAME');

      console.log(`[ReportGenerator] Downloading signature from S3: ${s3Key}`);

      // Get object from S3
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
      });

      const s3Response = await s3Client.send(getCommand);

      // Save to local file
      const fileName = `signature_${Date.now()}.png`;
      const localPath = path.join(destinationDir, fileName);

      // Convert stream to buffer and save
      const chunks = [];
      for await (const chunk of s3Response.Body) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);
      fs.writeFileSync(localPath, buffer);

      console.log(`[ReportGenerator] Signature saved locally: ${localPath}`);
      return localPath;

    } catch (error) {
      console.error('[ReportGenerator] Error downloading signature from S3:', error.message);
      throw error;
    }
  }

  // Download a customer logo from S3 into destinationDir. Customer logos are stored on S3 under
  // `customer_logos/<filename>` by the uploader; `logo_path` in the DB is just the filename.
  // Returns the local path on success, or null on any failure (so the header simply omits it).
  async downloadCustomerLogoFromS3(logoFilename, destinationDir) {
    try {
      const s3Client = new S3Client({
        region: EnvEncryption.getEnv('AWS_REGION') || 'us-east-1',
        credentials: {
          accessKeyId: EnvEncryption.getEnv('AWS_ACCESS_KEY_ID'),
          secretAccessKey: EnvEncryption.getEnv('AWS_SECRET_ACCESS_KEY'),
        },
      });
      const bucketName = EnvEncryption.getEnv('AWS_S3_BUCKET_NAME');
      const s3Key = `customer_logos/${logoFilename}`;

      console.log(`[ReportGenerator] Downloading customer logo from S3: ${s3Key}`);
      const s3Response = await s3Client.send(new GetObjectCommand({ Bucket: bucketName, Key: s3Key }));

      const localPath = path.join(destinationDir, `customer_logo_${path.basename(logoFilename)}`);
      const chunks = [];
      for await (const chunk of s3Response.Body) chunks.push(chunk);
      fs.writeFileSync(localPath, Buffer.concat(chunks));

      console.log(`[ReportGenerator] Customer logo saved locally: ${localPath}`);
      return localPath;
    } catch (error) {
      console.error(`[ReportGenerator] Could not download customer logo from S3: ${error.message}`);
      return null;
    }
  }

  // Fetch script audit logs from database
  async fetchScriptAuditLogs(scriptId) {
    try {
      console.log(`[ReportGenerator] ========================================`);
      console.log(`[ReportGenerator] Fetching audit logs for script ID: ${scriptId}`);

      const sql = `
        SELECT
          id,
          user_id,
          username,
          action,
          entity_type,
          status,
          message,
          metadata,
          created_at
        FROM application_logs
        WHERE entity_id = ?
          AND (
            entity_type = 'script' AND action = 'CREATE_SCRIPT_FROM_RECORDING'
            OR entity_type = 'script_step' AND action IN ('ADD_STEP', 'UPDATE_STEP', 'DELETE_STEP')
          )
        ORDER BY created_at ASC
      `;

      console.log(`[ReportGenerator] Executing SQL query:`, sql);
      console.log(`[ReportGenerator] With scriptId parameter:`, scriptId);

      const logs = await query(sql, [scriptId]);

      console.log(`[ReportGenerator] Query executed successfully`);
      console.log(`[ReportGenerator] Fetched ${logs.length} audit logs for script ${scriptId}`);

      if (logs.length > 0) {
        console.log(`[ReportGenerator] Audit logs summary:`);
        logs.forEach((log, index) => {
          console.log(`[ReportGenerator]   ${index + 1}. ${log.action} by ${log.username || 'System'} at ${log.created_at}`);
        });
      } else {
        console.log(`[ReportGenerator] ⚠️ No audit logs found for script ${scriptId}`);
      }

      console.log(`[ReportGenerator] ========================================`);
      return logs;
    } catch (error) {
      console.error('[ReportGenerator] ❌ Error fetching script audit logs:', error.message);
      console.error('[ReportGenerator] Error stack:', error.stack);
      return [];
    }
  }

  // Generate PDF report from execution results
  /**
   * Prepare the Script Parameters table rows.
   *
   * Row heights vary because long values wrap onto extra lines, so the page
   * pre-calculation and the renderer have to agree on them exactly — otherwise
   * the footer's "Page X of Y" drifts. Both call this.
   */
  static prepareParameterRows(raw, col2Width = 295, minRowHeight = 30) {
    let params;
    try {
      params = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch (e) {
      console.log("[Report] Error parsing script parameters:", e.message);
      return [];
    }

    // Recordings store parameters as an array; older ones as a plain object.
    if (Array.isArray(params)) {
      const obj = {};
      params.forEach((item) => {
        if (!item || typeof item !== "object") return;
        const key = item.key ?? item.name ?? item.parameter;
        if (key !== undefined && item.value !== undefined) obj[key] = item.value;
      });
      params = obj;
    }
    if (!params || typeof params !== "object") return [];

    const approxCharsPerLine = Math.floor((col2Width - 20) / 5);

    return Object.entries(params).map(([key, value]) => {
      let displayValue = String(value);
      if (SECRET_FIELD_RE.test(key)) {
        displayValue = "********";
      }
      displayValue = displayValue.replace(/\s+/g, " ").trim();
      if (displayValue.length > 150) displayValue = displayValue.substring(0, 147) + "...";

      const lines = Math.max(1, Math.ceil(displayValue.length / approxCharsPerLine));
      return {
        displayKey: key.charAt(0).toUpperCase() + key.slice(1),
        displayValue,
        rowH: Math.max(minRowHeight, 12 + lines * 14),
      };
    });
  }

  async generatePDFReport(executionData) {
    return new Promise(async (resolve, reject) => {
      try {
        // Generate filename in format: RUNID-EXECID-SCRIPTCODE-TIMESTAMP.pdf
        const timestamp = new Date()
          .toISOString()
          .replace(/[-:]/g, "")
          .replace(/\..+/, "")
          .replace("T", "");
        const runId = this.runId || executionData.runId || "UNKNOWN";
        const scriptCode =
          this.scriptCode || executionData.scriptCode || "UNKNOWN";
        const fileName = `${runId}-${this.executionId}-${scriptCode}-${timestamp}.pdf`;
        const pdfPath = path.join(this.executionReportDir, fileName);

        // bufferPages holds every page open until the end, so "Page X of Y" can
        // be stamped once the real count is known (see the loop before doc.end()).
        // The old approach predicted the count up front from row-per-page guesses,
        // which silently desynced the moment any section changed how it breaks.
        const doc = new PDFDocument({ margin: 30, size: "A4", bufferPages: true });
        const stream = fs.createWriteStream(pdfPath);

        doc.pipe(stream);

        // Customer logo (top left), or null and the header omits it. The shared
        // resolver in branding.js rather than a copy of its logic: it is the
        // tested one, and it additionally verifies the S3 download actually
        // landed on disk and swallows a rejected download — both of which this
        // call site used to get wrong.
        let logoPathLeft = null;
        if (executionData.customerLogoPath) {
          await this.createReportDirectory();
          logoPathLeft = await resolveCustomerLogo(
            executionData.customerLogoPath,
            this.executionReportDir,
            (key, dir) => this.downloadCustomerLogoFromS3(key, dir),
          );
        }
        const logoPathRight = PRODUCT_LOGO; // product mark for top right

        // Fetch script audit logs
        console.log(`[ReportGenerator] 📊 Preparing to fetch script audit logs...`);
        console.log(`[ReportGenerator] ExecutionData received:`, {
          scriptId: executionData.scriptId,
          runId: executionData.runId,
          executionId: executionData.executionId,
          scriptCode: executionData.scriptCode,
          scriptName: executionData.scriptName
        });

        const scriptId = executionData.scriptId;
        console.log(`[ReportGenerator] Using scriptId for audit logs: ${scriptId}`);

        let auditLogs = [];
        if (scriptId) {
          console.log(`[ReportGenerator] ✅ Script ID found, fetching audit logs...`);
          auditLogs = await this.fetchScriptAuditLogs(scriptId);
          console.log(`[ReportGenerator] ✅ Audit logs fetch completed. Total logs: ${auditLogs.length}`);
        } else {
          console.log(`[ReportGenerator] ⚠️ No scriptId in executionData — skipping audit logs`);
        }

        // Fallback: when a run has no normalized (grouped) steps — e.g. new
        // structured recordings / chaining scripts — build the Step Execution
        // Details table straight from the raw step results. Each executed step
        // becomes a row (skipping report-skipped + browser-launch wrapper steps).
        // Same shape (description + original_step_indices) so the existing table
        // code renders it, pulling Start Time / Duration / Result from results[].
        if (
          (!executionData.normalizedSteps || executionData.normalizedSteps.length === 0) &&
          Array.isArray(executionData.results) && executionData.results.length > 0
        ) {
          executionData.normalizedSteps = executionData.results
            .filter((r) => {
              if (r.skipInReport) return false;
              const txt = `${r.code || ""} ${r.description || r.action || ""}`;
              if (txt.includes("chromium.launch")) return false;
              return true;
            })
            .map((r) => ({
              description: r.description || r.action || "Step",
              original_step_indices: [r.index],
            }));
          console.log(
            `[ReportGenerator] No normalized steps — built ${executionData.normalizedSteps.length} step row(s) from results[]`,
          );
        }

        // Lowest y a block may END at before it has to move to a new page.
        // Everything below is the footer band. One threshold for every section,
        // so tables, the audit trail and the step pages all break consistently.
        const PAGE_BOTTOM = 762;

        // Every page gets its logos as it is created; footers are stamped at the
        // end, once the real page count is known.
        this.drawPageHeader(doc, logoPathLeft, logoPathRight);

        /** Start a new page and put the logos on it. */
        const newPage = () => {
          doc.addPage();
          this.drawPageHeader(doc, logoPathLeft, logoPathRight);
        };

        // Header
        doc.y = 60; // Start content below header
        doc
          .fontSize(20)
          .font("Helvetica-Bold")
          .fillColor("#212529")
          .text("Execution Report", 0, doc.y, { width: 595, align: "center" });
        doc.moveDown(1);

        // Execution Summary Table - New 4-column format
        const tableX = 50;
        const tableY = doc.y;
        const tableWidth = 495;
        const rowHeight = 35;
        const col1Width = 100; // Label column 1
        const col2Width = 147.5; // Value column 1
        const col3Width = 85; // Label column 2
        const col4Width = 162.5; // Value column 2
        const cellPadding = 10;
        const borderColor = "#000000";
        const whiteColor = "#FFFFFF";
        const labelBgColor = "#F8F9FA";

        // Format date/time as mm/dd/yyyy HH:MM:SS AM
        const executedDate = new Date(executionData.executedAt);
        const month = String(executedDate.getMonth() + 1).padStart(2, '0');
        const day = String(executedDate.getDate()).padStart(2, '0');
        const year = executedDate.getFullYear();

        let hours = executedDate.getHours();
        const minutes = String(executedDate.getMinutes()).padStart(2, '0');
        const seconds = String(executedDate.getSeconds()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const formattedHours = String(hours).padStart(2, '0');

        const formattedDate = `${month}/${day}/${year} ${formattedHours}:${minutes}:${seconds} ${ampm}`;

        // Capitalize username
        const rawUsername = executionData.userName || "-";
        const capitalizedUserName = rawUsername !== "-"
          ? rawUsername.charAt(0).toUpperCase() + rawUsername.slice(1).toLowerCase()
          : "-";

        // Draw table shadow
        doc.save();
        doc
          .rect(tableX + 3, tableY + 3, tableWidth, rowHeight * 4)
          .fillOpacity(0.1)
          .fill("#000000");
        doc.restore();

        // Helper function to draw a row
        const drawRow = (
          y,
          label1,
          value1,
          label2,
          value2,
          value1BgColor = whiteColor,
          value1Bold = false,
        ) => {
          // Draw row background and borders
          doc
            .rect(tableX, y, tableWidth, rowHeight)
            .fillAndStroke(whiteColor, borderColor);

          // Vertical lines
          doc
            .moveTo(tableX + col1Width, y)
            .lineTo(tableX + col1Width, y + rowHeight)
            .stroke(borderColor);
          doc
            .moveTo(tableX + col1Width + col2Width, y)
            .lineTo(tableX + col1Width + col2Width, y + rowHeight)
            .stroke(borderColor);
          doc
            .moveTo(tableX + col1Width + col2Width + col3Width, y)
            .lineTo(tableX + col1Width + col2Width + col3Width, y + rowHeight)
            .stroke(borderColor);

          // Label 1 (with gray background)
          doc
            .rect(tableX, y, col1Width, rowHeight)
            .fillAndStroke(labelBgColor, borderColor);
          doc
            .fontSize(9)
            .font("Helvetica-Bold")
            .fillColor("#212529")
            .text(label1, tableX + cellPadding, y + 12, {
              width: col1Width - cellPadding * 2,
            });

          // Value 1 (with custom background color if provided)
          doc
            .rect(tableX + col1Width, y, col2Width, rowHeight)
            .fillAndStroke(value1BgColor, borderColor);
          const value1Font = value1Bold ? "Helvetica-Bold" : "Helvetica";
          doc
            .fontSize(9)
            .font(value1Font)
            .fillColor("#495057")
            .text(value1, tableX + col1Width + cellPadding, y + 12, {
              width: col2Width - cellPadding * 2,
              ellipsis: true,
            });

          // Label 2 (with gray background)
          if (label2) {
            doc
              .rect(tableX + col1Width + col2Width, y, col3Width, rowHeight)
              .fillAndStroke(labelBgColor, borderColor);
            doc
              .fontSize(9)
              .font("Helvetica-Bold")
              .fillColor("#212529")
              .text(
                label2,
                tableX + col1Width + col2Width + cellPadding,
                y + 12,
                { width: col3Width - cellPadding * 2 },
              );
          }

          // Value 2
          if (value2) {
            doc
              .fontSize(9)
              .font("Helvetica")
              .fillColor("#495057")
              .text(
                value2,
                tableX + col1Width + col2Width + col3Width + cellPadding,
                y + 12,
                { width: col4Width - cellPadding * 2, ellipsis: true },
              );
          }
        };

        let currentY = tableY;

        // Row 1: Execution ID | Date/User
        drawRow(
          currentY,
          "Execution ID",
          executionData.executionId.toString(),
          "Date/User",
          `${formattedDate} by ${capitalizedUserName}`,
        );
        currentY += rowHeight;

        // Row 2: Status | Customer (Instance)
        const statusBgColor =
          executionData.status === "success" ? "#d4edda" : "#f8d7da";
        drawRow(
          currentY,
          "Status",
          executionData.status.charAt(0).toUpperCase() +
            executionData.status.slice(1),
          "Customer (Instance)",
          `${executionData.customerName || "-"} (${executionData.instanceName || "-"})`,
          statusBgColor,
          true,
        );
        currentY += rowHeight;

        // Row 3: Module/Business Process | Base URL
        const moduleBusinessProcess =
          executionData.processName && executionData.processName !== "-"
            ? `${executionData.moduleCode}/${executionData.processName}`
            : executionData.moduleCode || "-";
        drawRow(
          currentY,
          "Module/Business Process",
          moduleBusinessProcess,
          "Base URL",
          executionData.baseUrl || "-",
        );
        currentY += rowHeight;

        // Row 4: Script Name | Script Code/ID
        const scriptCodeText = `${executionData.scriptCode || "-"} (${executionData.scriptId || "-"})`;
        drawRow(
          currentY,
          "Script Name",
          executionData.scriptName || "-",
          "Script Code/ID",
          scriptCodeText,
        );
        currentY += rowHeight;

        // Move cursor below the table
        doc.fillColor("black");
        doc.y = tableY + rowHeight * 4 + 20;

        // Add Script Parameters Section (if parameters exist)
        if (executionData.scriptParameters) {
          let params;
          try {
            params =
              typeof executionData.scriptParameters === "string"
                ? JSON.parse(executionData.scriptParameters)
                : executionData.scriptParameters;
          } catch (e) {
            console.log("[Report] Error parsing script parameters:", e.message);
            params = null;
          }

          // Check if params is an array and convert to object
          if (params && Array.isArray(params) && params.length > 0) {
            // Convert array to object format
            const paramsObj = {};
            params.forEach((item) => {
              if (item && typeof item === "object") {
                if (item.key && item.value !== undefined) {
                  paramsObj[item.key] = item.value;
                } else if (item.name && item.value !== undefined) {
                  paramsObj[item.name] = item.value;
                } else if (item.parameter && item.value !== undefined) {
                  paramsObj[item.parameter] = item.value;
                }
              }
            });
            params = paramsObj;
          }

          if (
            params &&
            typeof params === "object" &&
            Object.keys(params).length > 0
          ) {
            doc.moveDown(5);
            doc
              .fontSize(20)
              .font("Helvetica-Bold")
              .fillColor("#212529")
              .text("Script Parameters", tableX, doc.y);
            doc.moveDown(1);

            // Draw parameters table
            const paramTableX = tableX;
            let paramY = doc.y;
            const paramTableWidth = tableWidth;
            const paramRowHeight = 30;
            const paramCol1Width = 200; // Parameter name
            const paramCol2Width = 295; // Parameter value

            // Header row, redrawn at the top of every page the table spills onto.
            const drawParamTableHeader = () => {
              doc
                .rect(paramTableX, paramY, paramTableWidth, paramRowHeight)
                .fillAndStroke("#F8F9FA", "#000000");

              doc
                .moveTo(paramTableX + paramCol1Width, paramY)
                .lineTo(paramTableX + paramCol1Width, paramY + paramRowHeight)
                .stroke("#000000");

              doc
                .fontSize(10)
                .font("Helvetica-Bold")
                .fillColor("#212529")
                .text("Parameter", paramTableX + 10, paramY + 10, {
                  width: paramCol1Width - 20,
                })
                .text("Value", paramTableX + paramCol1Width + 10, paramY + 10, {
                  width: paramCol2Width - 20,
                });

              paramY += paramRowHeight;
            };

            drawParamTableHeader();

            // Parameter rows. Without an explicit break the table used to run off
            // the bottom of the page and PDFKit would paginate mid-row, stranding
            // a single parameter on a page of its own.
            const paramRows = ReportGenerator.prepareParameterRows(
              executionData.scriptParameters,
              paramCol2Width,
              paramRowHeight,
            );

            paramRows.forEach(({ displayKey, displayValue, rowH }) => {
              if (paramY + rowH > PAGE_BOTTOM) {
                newPage();
                paramY = 70;
                drawParamTableHeader();
              }

              doc
                .rect(paramTableX, paramY, paramTableWidth, rowH)
                .fillAndStroke("#FFFFFF", "#000000");

              // Vertical line between columns
              doc
                .moveTo(paramTableX + paramCol1Width, paramY)
                .lineTo(paramTableX + paramCol1Width, paramY + rowH)
                .stroke("#000000");

              doc
                .fontSize(9)
                .font("Helvetica-Bold")
                .fillColor("#212529")
                .text(displayKey, paramTableX + 10, paramY + 10, {
                  width: paramCol1Width - 20,
                });

              doc
                .fontSize(9)
                .font("Helvetica")
                .fillColor("#495057")
                .text(
                  displayValue,
                  paramTableX + paramCol1Width + 10,
                  paramY + 10,
                  {
                    width: paramCol2Width - 20,
                    ellipsis: true,
                  },
                );

              paramY += rowH;
            });

            doc.y = paramY + 20;
            console.log(
              `[Report] Added ${Object.keys(params).length} script parameters to report`,
            );
          }
        }

        // Add Script Audit Trail Section (if audit logs exist)
        if (auditLogs.length > 0) {
          console.log(`[ReportGenerator] 📝 Starting to render Script Audit Trail section...`);
          console.log(`[ReportGenerator] Total audit logs to render: ${auditLogs.length}`);

          const auditRowHeight = 35;
          const AUDIT_TITLE_H = 45;   // 20pt title + moveDown(1)
          const AUDIT_HEADER_H = 25;  // column header strip

          // The audit trail is usually a handful of rows. Giving it a page of
          // its own left most of that page blank, so continue on the Execution
          // Report page whenever the title, the column header and at least one
          // row still fit; only spill onto a new page when they genuinely don't.
          const auditNeeds = AUDIT_TITLE_H + AUDIT_HEADER_H + auditRowHeight;
          if (doc.y + auditNeeds > PAGE_BOTTOM) {
            newPage();
            doc.y = 70;
          } else {
            doc.moveDown(1.5);
          }

          doc
            .fontSize(20)
            .font("Helvetica-Bold")
            .fillColor("#212529")
            .text("Script Audit Trail", tableX, doc.y);
          doc.moveDown(1);

          // Audit table configuration
          const auditTableX = tableX;
          let auditY = doc.y;
          const auditTableWidth = tableWidth;

          // Table column widths
          const colDateTime = 125;  // Date/Time column (increased for new format)
          const colAction = 90;     // Action column
          const colUser = 70;       // User column
          const colDetails = 210;   // Details column

          console.log(`[ReportGenerator] Audit log breakdown:`);
          console.log(`[ReportGenerator]   - Total logs: ${auditLogs.length}`);

          // Draw table header
          doc
            .rect(auditTableX, auditY, auditTableWidth, 25)
            .fillAndStroke("#F8F9FA", "#000000");

          // Vertical lines for header
          doc
            .moveTo(auditTableX + colDateTime, auditY)
            .lineTo(auditTableX + colDateTime, auditY + 25)
            .stroke("#000000");
          doc
            .moveTo(auditTableX + colDateTime + colAction, auditY)
            .lineTo(auditTableX + colDateTime + colAction, auditY + 25)
            .stroke("#000000");
          doc
            .moveTo(auditTableX + colDateTime + colAction + colUser, auditY)
            .lineTo(auditTableX + colDateTime + colAction + colUser, auditY + 25)
            .stroke("#000000");

          // Header text - LEFT ALIGNED
          doc
            .fontSize(9)
            .font("Helvetica-Bold")
            .fillColor("#212529")
            .text("Date/Time", auditTableX + 5, auditY + 8, {
              width: colDateTime - 10,
              align: "left",
            })
            .text("Action", auditTableX + colDateTime + 5, auditY + 8, {
              width: colAction - 10,
              align: "left",
            })
            .text("User", auditTableX + colDateTime + colAction + 5, auditY + 8, {
              width: colUser - 10,
              align: "left",
            })
            .text("Details", auditTableX + colDateTime + colAction + colUser + 5, auditY + 8, {
              width: colDetails - 10,
              align: "left",
            });

          auditY += 25;

          // Display all audit logs in chronological order
          auditLogs.forEach((log, index) => {
            console.log(`[ReportGenerator] ${index + 1}/${auditLogs.length} - Rendering ${log.action} by ${log.username}`);

            // Check if we need a new page
            if (auditY + auditRowHeight > PAGE_BOTTOM) {
              console.log(`[ReportGenerator]    ⚠️ Page overflow, adding new page...`);
              newPage();
              auditY = 70;

              // Redraw table header on new page - LEFT ALIGNED
              doc
                .rect(auditTableX, auditY, auditTableWidth, 25)
                .fillAndStroke("#F8F9FA", "#000000");

              doc
                .moveTo(auditTableX + colDateTime, auditY)
                .lineTo(auditTableX + colDateTime, auditY + 25)
                .stroke("#000000");
              doc
                .moveTo(auditTableX + colDateTime + colAction, auditY)
                .lineTo(auditTableX + colDateTime + colAction, auditY + 25)
                .stroke("#000000");
              doc
                .moveTo(auditTableX + colDateTime + colAction + colUser, auditY)
                .lineTo(auditTableX + colDateTime + colAction + colUser, auditY + 25)
                .stroke("#000000");

              doc
                .fontSize(9)
                .font("Helvetica-Bold")
                .fillColor("#212529")
                .text("Date/Time", auditTableX + 5, auditY + 8, {
                  width: colDateTime - 10,
                  align: "left",
                })
                .text("Action", auditTableX + colDateTime + 5, auditY + 8, {
                  width: colAction - 10,
                  align: "left",
                })
                .text("User", auditTableX + colDateTime + colAction + 5, auditY + 8, {
                  width: colUser - 10,
                  align: "left",
                })
                .text("Details", auditTableX + colDateTime + colAction + colUser + 5, auditY + 8, {
                  width: colDetails - 10,
                  align: "left",
                });

              auditY += 25;
            }

            // Parse metadata
            let metadata = {};
            try {
              metadata = typeof log.metadata === 'string'
                ? JSON.parse(log.metadata)
                : log.metadata || {};
            } catch (e) {
              console.error('[ReportGenerator] ❌ Error parsing log metadata:', e);
            }

            // Determine action label (NO COLORS)
            let actionLabel = "";
            let rowBgColor = index % 2 === 0 ? "#FFFFFF" : "#F8F9FA";

            if (log.action === 'CREATE_SCRIPT_FROM_RECORDING') {
              actionLabel = "Script Created";
            } else if (log.action === 'ADD_STEP') {
              actionLabel = "Step Added";
            } else if (log.action === 'UPDATE_STEP') {
              actionLabel = "Step Updated";
            } else if (log.action === 'DELETE_STEP') {
              actionLabel = "Step Deleted";
            }

            // Format date as mm/dd/yyyy HH:MM:SS AM
            const logDate = new Date(log.created_at);
            const month = String(logDate.getMonth() + 1).padStart(2, '0');
            const day = String(logDate.getDate()).padStart(2, '0');
            const year = logDate.getFullYear();

            let hours = logDate.getHours();
            const minutes = String(logDate.getMinutes()).padStart(2, '0');
            const seconds = String(logDate.getSeconds()).padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // 0 should be 12
            const formattedHours = String(hours).padStart(2, '0');

            const formattedDateTime = `${month}/${day}/${year} ${formattedHours}:${minutes}:${seconds} ${ampm}`;

            // Capitalize user name
            const username = log.username || 'System';
            const capitalizedUsername = username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();

            // Build details text based on action
            let detailsText = "";
            if (log.action === 'CREATE_SCRIPT_FROM_RECORDING') {
              detailsText = `Script: ${metadata.script_name || '-'}\nCode: ${metadata.script_code || '-'}\nSteps: ${metadata.totalSteps || 0}`;
            } else if (log.action === 'ADD_STEP') {
              detailsText = `Type: ${metadata.stepType || '-'}\nPosition: ${metadata.position !== undefined ? metadata.position : '-'}\nTotal Steps: ${metadata.totalSteps || '-'}`;
            } else if (log.action === 'UPDATE_STEP') {
              const oldCode = (metadata.oldCode || '-').substring(0, 30);
              const newCode = (metadata.newCode || '-').substring(0, 30);
              detailsText = `Step Index: ${metadata.stepIndex !== undefined ? metadata.stepIndex : '-'}\nOld: ${oldCode}...\nNew: ${newCode}...`;
            } else if (log.action === 'DELETE_STEP') {
              const deletedCode = (metadata.deletedStepCode || '-').substring(0, 40);
              detailsText = `Deleted Index: ${metadata.deletedIndex !== undefined ? metadata.deletedIndex : '-'}\nRemaining: ${metadata.remainingSteps || '-'} steps\nCode: ${deletedCode}...`;
            }

            // Draw row
            doc
              .rect(auditTableX, auditY, auditTableWidth, auditRowHeight)
              .fillAndStroke(rowBgColor, "#000000");

            // Vertical lines
            doc
              .moveTo(auditTableX + colDateTime, auditY)
              .lineTo(auditTableX + colDateTime, auditY + auditRowHeight)
              .stroke("#000000");
            doc
              .moveTo(auditTableX + colDateTime + colAction, auditY)
              .lineTo(auditTableX + colDateTime + colAction, auditY + auditRowHeight)
              .stroke("#000000");
            doc
              .moveTo(auditTableX + colDateTime + colAction + colUser, auditY)
              .lineTo(auditTableX + colDateTime + colAction + colUser, auditY + auditRowHeight)
              .stroke("#000000");

            // Date/Time column - single line with new format
            doc
              .fontSize(7.5)
              .font("Helvetica")
              .fillColor("#495057")
              .text(formattedDateTime, auditTableX + 5, auditY + 13, {
                width: colDateTime - 10,
                align: "left",
              });

            // Action column - NO COLOR
            doc
              .fontSize(8)
              .font("Helvetica")
              .fillColor("#212529")
              .text(actionLabel, auditTableX + colDateTime + 5, auditY + 13, {
                width: colAction - 10,
                align: "left",
              });

            // User column - CAPITALIZED
            doc
              .fontSize(8)
              .font("Helvetica")
              .fillColor("#212529")
              .text(capitalizedUsername, auditTableX + colDateTime + colAction + 5, auditY + 13, {
                width: colUser - 10,
                align: "left",
                ellipsis: true,
              });

            // Details column
            doc
              .fontSize(6.5)
              .font("Helvetica")
              .fillColor("#495057")
              .text(detailsText, auditTableX + colDateTime + colAction + colUser + 5, auditY + 5, {
                width: colDetails - 10,
                height: auditRowHeight - 10,
                ellipsis: true,
              });

            auditY += auditRowHeight;
          });

          doc.y = auditY + 20;
          console.log(`[ReportGenerator] ✅ Successfully added Script Audit Trail table to report`);
          console.log(`[ReportGenerator] ✅ Total audit logs rendered: ${auditLogs.length}`);
        } else {
          console.log(`[ReportGenerator] ⏭️ Skipping Script Audit Trail section (no audit logs found)`);
        }

        // Add Normalized Steps Table (if available) - Start on new page
        if (
          executionData.normalizedSteps &&
          executionData.normalizedSteps.length > 0
        ) {
          newPage();
          doc.y = 70;
          doc
            .fontSize(14)
            .font("Helvetica-Bold")
            .fillColor("#212529")
            .text("Step Execution Details", tableX);
          doc.moveDown(0.8);

          const normTableY = doc.y;
          const normRowHeight = 25; // Single line height
          const colStepNo = 35; // Step No.
          const col1W = 180; // Step Description
          const col2W = 60; // Step Result
          const col3W = 55; // Start Time
          const col4W = 50; // Duration
          const col5W = 115; // Date

          // Table Header
          doc
            .rect(tableX, normTableY, colStepNo, 22)
            .fillAndStroke("#F8F9FA", "#DEE2E6");
          doc
            .rect(tableX + colStepNo, normTableY, col1W, 22)
            .fillAndStroke("#F8F9FA", "#DEE2E6");
          doc
            .rect(tableX + colStepNo + col1W, normTableY, col2W, 22)
            .fillAndStroke("#F8F9FA", "#DEE2E6");
          doc
            .rect(tableX + colStepNo + col1W + col2W, normTableY, col3W, 22)
            .fillAndStroke("#F8F9FA", "#DEE2E6");
          doc
            .rect(
              tableX + colStepNo + col1W + col2W + col3W,
              normTableY,
              col4W,
              22,
            )
            .fillAndStroke("#F8F9FA", "#DEE2E6");
          doc
            .rect(
              tableX + colStepNo + col1W + col2W + col3W + col4W,
              normTableY,
              col5W,
              22,
            )
            .fillAndStroke("#F8F9FA", "#DEE2E6");

          doc
            .fontSize(8)
            .font("Helvetica-Bold")
            .fillColor("#212529")
            .text("Step No.", tableX, normTableY + 7, {
              width: colStepNo,
              align: "center",
            })
            .text("Step Description", tableX + colStepNo, normTableY + 7, {
              width: col1W,
              align: "center",
            })
            .text("Result", tableX + colStepNo + col1W, normTableY + 7, {
              width: col2W,
              align: "center",
            })
            .text(
              "Start Time",
              tableX + colStepNo + col1W + col2W,
              normTableY + 7,
              { width: col3W, align: "center" },
            )
            .text(
              "Duration",
              tableX + colStepNo + col1W + col2W + col3W,
              normTableY + 7,
              { width: col4W, align: "center" },
            )
            .text(
              "Date",
              tableX + colStepNo + col1W + col2W + col3W + col4W,
              normTableY + 7,
              { width: col5W, align: "center" },
            );

          // Table Rows
          let currentNormY = normTableY + 22;
          executionData.normalizedSteps.forEach((step, index) => {
            // Check if we need a new page
            if (currentNormY + normRowHeight > PAGE_BOTTOM) {
              newPage();
              currentNormY = 70;

              // Redraw table headers on new page
              doc
                .rect(tableX, currentNormY, colStepNo, 22)
                .fillAndStroke("#F8F9FA", "#DEE2E6");
              doc
                .rect(tableX + colStepNo, currentNormY, col1W, 22)
                .fillAndStroke("#F8F9FA", "#DEE2E6");
              doc
                .rect(tableX + colStepNo + col1W, currentNormY, col2W, 22)
                .fillAndStroke("#F8F9FA", "#DEE2E6");
              doc
                .rect(
                  tableX + colStepNo + col1W + col2W,
                  currentNormY,
                  col3W,
                  22,
                )
                .fillAndStroke("#F8F9FA", "#DEE2E6");
              doc
                .rect(
                  tableX + colStepNo + col1W + col2W + col3W,
                  currentNormY,
                  col4W,
                  22,
                )
                .fillAndStroke("#F8F9FA", "#DEE2E6");
              doc
                .rect(
                  tableX + colStepNo + col1W + col2W + col3W + col4W,
                  currentNormY,
                  col5W,
                  22,
                )
                .fillAndStroke("#F8F9FA", "#DEE2E6");

              doc
                .fontSize(8)
                .font("Helvetica-Bold")
                .fillColor("#212529")
                .text("Step No.", tableX, currentNormY + 7, {
                  width: colStepNo,
                  align: "center",
                })
                .text(
                  "Step Description",
                  tableX + colStepNo,
                  currentNormY + 7,
                  { width: col1W, align: "center" },
                )
                .text("Result", tableX + colStepNo + col1W, currentNormY + 7, {
                  width: col2W,
                  align: "center",
                })
                .text(
                  "Start Time",
                  tableX + colStepNo + col1W + col2W,
                  currentNormY + 7,
                  { width: col3W, align: "center" },
                )
                .text(
                  "Duration",
                  tableX + colStepNo + col1W + col2W + col3W,
                  currentNormY + 7,
                  { width: col4W, align: "center" },
                )
                .text(
                  "Date",
                  tableX + colStepNo + col1W + col2W + col3W + col4W,
                  currentNormY + 7,
                  { width: col5W, align: "center" },
                );

              currentNormY += 22;
            }

            const bgColor = index % 2 === 0 ? "#FFFFFF" : "#F8F9FA";

            // Calculate timing and status for this normalized step
            let stepStartTime = null;
            let stepEndTime = null;
            let stepDuration = 0;
            let stepStatus = "Pass";

            if (
              step.original_step_indices &&
              step.original_step_indices.length > 0 &&
              executionData.results
            ) {
              // Get results for all sub-steps
              const subStepResults = step.original_step_indices
                .map((idx) =>
                  executionData.results.find((r) => r.index === idx),
                )
                .filter((r) => r); // Remove undefined

              if (subStepResults.length > 0) {
                const first = subStepResults[0];
                const last = subStepResults[subStepResults.length - 1];

                // The spec writes `duration` + `timestamp` (the moment the step
                // ENDED); the old in-process replayer wrote startTime/endTime.
                // Read either, so runs from both engines fill these columns
                // instead of falling through to "-".
                stepStartTime =
                  first.startTime ??
                  (first.timestamp ? first.timestamp - (first.duration || 0) : null);
                stepEndTime = last.endTime ?? last.timestamp ?? null;

                if (stepStartTime && stepEndTime && stepEndTime > stepStartTime) {
                  stepDuration = stepEndTime - stepStartTime;
                } else {
                  // Grouped steps whose sub-steps aren't contiguous — summing the
                  // per-step durations beats a span that includes the gaps.
                  stepDuration = subStepResults.reduce(
                    (total, r) => total + (r.duration || 0),
                    0,
                  );
                }
                // Check if any sub-step failed, skipped, or warned
                if (subStepResults.some((r) => r.status === "failed")) {
                  stepStatus = "Fail";
                } else if (subStepResults.some((r) => r.status === "skipped")) {
                  stepStatus = "Skipped";
                } else if (subStepResults.some((r) => r.status === "warn")) {
                  stepStatus = "Warn";
                }
              }
            }

            // Draw row cells - Step No.
            doc
              .rect(tableX, currentNormY, colStepNo, normRowHeight)
              .fillAndStroke(bgColor, "#DEE2E6");

            // Step Description
            doc
              .rect(tableX + colStepNo, currentNormY, col1W, normRowHeight)
              .fillAndStroke(bgColor, "#DEE2E6");

            // Step Result cell with colored background
            const stepResultBgColor =
              stepStatus === "Pass" ? "#d4edda" : stepStatus === "Warn" ? "#fff3cd" : stepStatus === "Skipped" ? "#fff3cd" : "#f8d7da";
            doc
              .rect(
                tableX + colStepNo + col1W,
                currentNormY,
                col2W,
                normRowHeight,
              )
              .fillAndStroke(stepResultBgColor, "#DEE2E6");

            // Other cells
            doc
              .rect(
                tableX + colStepNo + col1W + col2W,
                currentNormY,
                col3W,
                normRowHeight,
              )
              .fillAndStroke(bgColor, "#DEE2E6");
            doc
              .rect(
                tableX + colStepNo + col1W + col2W + col3W,
                currentNormY,
                col4W,
                normRowHeight,
              )
              .fillAndStroke(bgColor, "#DEE2E6");
            doc
              .rect(
                tableX + colStepNo + col1W + col2W + col3W + col4W,
                currentNormY,
                col5W,
                normRowHeight,
              )
              .fillAndStroke(bgColor, "#DEE2E6");

            // Step No.
            doc
              .fontSize(9)
              .font("Helvetica-Bold")
              .fillColor("#212529")
              .text(String(index + 1), tableX + 3, currentNormY + 7, {
                width: colStepNo - 6,
                align: "center",
              });

            // Main description - centered vertically in row
            const mainDescription = step.description || "N/A";
            doc
              .fontSize(9)
              .font("Helvetica")
              .fillColor("#212529")
              .text(mainDescription, tableX + colStepNo + 5, currentNormY + 7, {
                width: col1W - 10,
                ellipsis: true,
              });

            // Step Result
            const statusColorNorm =
              stepStatus === "Pass" ? "#28a745" : stepStatus === "Warn" ? "#856404" : stepStatus === "Skipped" ? "#856404" : "#dc3545";
            doc
              .fontSize(8)
              .font("Helvetica-Bold")
              .fillColor(statusColorNorm)
              .text(
                stepStatus,
                tableX + colStepNo + col1W + 3,
                currentNormY + 7,
                { width: col2W - 6, align: "center" },
              );

            // Start Time
            const startTimeText = stepStartTime
              ? new Date(stepStartTime).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })
              : "-";
            doc
              .fontSize(8)
              .font("Helvetica")
              .fillColor("#495057")
              .text(
                startTimeText,
                tableX + colStepNo + col1W + col2W + 2,
                currentNormY + 7,
                { width: col3W - 4, align: "center" },
              );

            // Duration
            const durationText =
              stepDuration > 0 ? (stepDuration / 1000).toFixed(2) + "s" : "-";
            doc
              .fontSize(8)
              .font("Helvetica")
              .fillColor("#495057")
              .text(
                durationText,
                tableX + colStepNo + col1W + col2W + col3W + 3,
                currentNormY + 7,
                { width: col4W - 6, align: "center" },
              );

            // Date — day + short month + year ("08 Aug 2026"). No time here: the
            // Start Time column two cells over already carries it, and repeating
            // it made this column the widest thing in the table.
            const dateText = stepStartTime
              ? new Date(stepStartTime).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "-";
            doc
              .fontSize(8)
              .font("Helvetica")
              .fillColor("#495057")
              .text(
                dateText,
                tableX + colStepNo + col1W + col2W + col3W + col4W + 3,
                currentNormY + 7,
                { width: col5W - 6, align: "center" },
              );

            currentNormY += normRowHeight;
          });

          doc.y = currentNormY + 20;
          console.log(
            `[Report] Added ${executionData.normalizedSteps.length} normalized steps to report`,
          );
        }

        // Start screenshot steps on a new page
        newPage();
        doc.y = 70;

        // Get all screenshot files
        // Accept both legacy `step_<N>.png` and new `step_<N>_<slug>.png`
        // (the slug helps when inspecting the directory by hand).
        const STEP_FILE_RE = /^step_(\d+)(?:_[^.]*)?\.png$/;
        const screenshots = fs
          .readdirSync(this.screenshotsDir)
          .filter((f) => STEP_FILE_RE.test(f))
          .sort((a, b) => parseInt(a.match(STEP_FILE_RE)[1]) - parseInt(b.match(STEP_FILE_RE)[1]));

        // Map step number → filename. Sparse-key lookup against a sparse
        // map matches even when programmatic-nav skips intermediate writes.
        const screenshotByStep = {};
        for (const f of screenshots) {
          const m = f.match(STEP_FILE_RE);
          if (m) screenshotByStep[parseInt(m[1], 10)] = f;
        }

        console.log(`Found ${screenshots.length} screenshots to add to PDF`);

        // Filter results to exclude:
        // 1. Steps with skipInReport flag
        // 2. Browser launch steps (chromium.launch)
        const filteredResults = executionData.results.filter(
          (result, index) => {
            // Skip if explicitly marked
            if (result.skipInReport) {
              console.log(
                `Skipping step ${index} from report (skipInReport flag)`,
              );
              return false;
            }

            // Skip browser launch code
            const code = result.code || "";
            const description = result.description || result.action || "";
            if (
              code.includes("chromium.launch") ||
              description.includes("chromium.launch")
            ) {
              console.log(
                `Skipping step ${index} from report (browser launch)`,
              );
              return false;
            }

            return true;
          },
        );

        console.log(
          `${filteredResults.length} steps will be shown in report (${executionData.results.length - filteredResults.length} skipped)`,
        );

        // Height of the screenshot card: image box + padding top/bottom + the
        // gap left under it. Kept next to the drawing code below, which uses the
        // same numbers.
        const CARD_HEIGHT = 480 + 15 * 2 + 10;
        const STEP_HEADER_H = 35;
        // Badge column. Right edge stays at 535 (10pt inside the 495pt header
        // bar), so widening it moves only the left edge and every badge stays
        // aligned where it always was.
        const BADGE_X = 400;
        const BADGE_W = 135;
        const ERROR_BOX_H = 33;        // minimum; grows to fit a wrapped message
        const ERROR_BOX_PAD = 8;       // gap above and below the text
        const ERROR_TEXT_W = 440;      // 60pt label gutter + right margin inside a 495pt box
        const BULLET_INDENT = 10;      // gap between the bullet glyph and its text
        const BULLET_GAP = 2;          // breathing room between bulleted messages

        // Distinct screenshot content -> the image embedded for it, so repeated
        // captures are stored once. Keyed on the source bytes, not the filename.
        const imageCache = new Map();

        // Render each step. A step only claims a fresh page when its block will
        // not fit on the current one — a step whose screenshot was never
        // captured is just a 35pt header strip, and giving that its own page
        // left ~660pt blank. Those now pack one after another.
        for (let displayIndex = 0; displayIndex < filteredResults.length; displayIndex++) {
          const result = filteredResults[displayIndex];
          // Look up screenshot by recorded step number (the sparse index that
          // matches the file name `step_<N>.png`), not by the dense array
          // position. Misalignment here was making post-skip steps show a
          // later step's screenshot.
          const originalIndex = result.index;
          const screenshotFile = screenshotByStep[originalIndex];

          const showsError =
            Boolean(result.error) && result.status !== "warn" && result.status !== "skipped";

          // Oracle rejected the page — the step's mechanics were fine. Flagged
          // by the replayer; the prefix test carries reports generated before
          // that flag existed, and both message wordings this has shipped with.
          const isOracleIssue =
            result.oracleError === true ||
            /^(Failed due to Oracle errors|Oracle rejected the data)/.test(result.error || "");

          // With the badge already naming the problem, repeating the prefix in
          // the box wastes a line of a box that was overflowing. Show what
          // Oracle actually said.
          const errorText = showsError
            ? String(result.error).replace(
                /^(Failed due to Oracle errors|Oracle rejected the data)\s*[—-]\s*/,
                "",
              )
            : "";

          // One bullet per message when the replayer captured them separately.
          // Oracle lists a message per field, and running them into one
          // paragraph gives a sentence nobody reads to the end.
          const errorBullets =
            showsError && Array.isArray(result.errorMessages)
              ? result.errorMessages.map((m) => String(m).trim()).filter(Boolean)
              : [];

          // Measure before drawing. The box used to be a fixed 33pt whatever the
          // message was, so anything that wrapped to a second line ran out
          // through the bottom border.
          let errorBoxH = 0;
          if (showsError) {
            doc.fontSize(8).font("Helvetica");
            const bodyH = errorBullets.length
              ? errorBullets.reduce(
                  (sum, line) =>
                    sum +
                    doc.heightOfString(line, { width: ERROR_TEXT_W - BULLET_INDENT }) +
                    BULLET_GAP,
                  0,
                ) - BULLET_GAP
              : doc.heightOfString(errorText, { width: ERROR_TEXT_W });
            errorBoxH = Math.max(ERROR_BOX_H, bodyH + ERROR_BOX_PAD * 2);
          }

          const blockHeight =
            STEP_HEADER_H + errorBoxH + (screenshotFile ? CARD_HEIGHT : 0);

          if (displayIndex > 0 && doc.y + blockHeight > PAGE_BOTTOM) {
            newPage();
            doc.y = 60; // Start content below header
          }

          // Step header bar
          const headerY = doc.y;
          const statusColorStep =
            result.status === "success" ? "#28a745" : result.status === "warn" ? "#856404" : result.status === "skipped" ? "#856404" : "#dc3545";

          // Draw header background
          doc.rect(50, headerY, 495, 35).fillAndStroke("#F8F9FA", "#DEE2E6");

          // Step number and description on left
          const stepText = `Step ${displayIndex + 1}: ${result.description || result.action}`;
          doc
            .fontSize(11)
            .font("Helvetica-Bold")
            .fillColor("#212529")
            .text(stepText, 60, headerY + 11, { width: BADGE_X - 65, ellipsis: true });

          // Status badge on right, at the same 10pt as every other status.
          // "FAILED (ORACLE ERROR)" needs 125pt, so the column was widened from
          // 115 to 135 rather than shrinking the type — the right edge is
          // unchanged, so every badge still lines up exactly where it did, and
          // the 20pt comes off the step title, which already ellipsises.
          //
          // The classifier's label is preferred when it fits. It is model-written
          // and therefore not length-guaranteed, so it is MEASURED rather than
          // trusted: anything too wide falls back to the generic label instead of
          // running through the edge of the header bar.
          let badgeText = isOracleIssue ? "FAILED (ORACLE ERROR)" : result.status.toUpperCase();
          if (isOracleIssue && result.errorType) {
            const candidate = `FAILED (${String(result.errorType).toUpperCase()})`;
            const fits =
              doc.fontSize(10).font("Helvetica-Bold").widthOfString(candidate) <= BADGE_W;
            if (fits) badgeText = candidate;
          }
          doc
            .fontSize(10)
            .font("Helvetica-Bold")
            .fillColor(statusColorStep)
            .text(badgeText, BADGE_X, headerY + 11, {
              width: BADGE_W,
              align: "right",
              lineBreak: false,
            });

          doc.fillColor("black");
          doc.y = headerY + 35;

          // Error message — only show for failed steps, not for self-healed warns or skipped steps
          if (showsError) {
            doc.moveDown(0.3);

            // doc.y is captured ONCE. Every doc.text() advances it, so the old
            // code drew the label at boxTop+8, then read the already-moved doc.y
            // for the message and put it at roughly boxTop+26 — on the bottom
            // border of a 30pt box. That, not the message length, is why it
            // rendered outside the box.
            const boxTop = doc.y;
            doc.rect(50, boxTop, 495, errorBoxH).fillAndStroke("#FFF3CD", "#FFC107");

            doc
              .fontSize(8)
              .font("Helvetica-Bold")
              .fillColor("#856404")
              .text("Error: ", 60, boxTop + ERROR_BOX_PAD, { lineBreak: false });
            doc.fontSize(8).font("Helvetica").fillColor("#856404");

            if (errorBullets.length) {
              // One line per message Oracle listed, each with its own bullet.
              let lineY = boxTop + ERROR_BOX_PAD;
              for (const bullet of errorBullets) {
                doc.text("•", 95, lineY, { lineBreak: false });
                doc.text(bullet, 95 + BULLET_INDENT, lineY, {
                  width: ERROR_TEXT_W - BULLET_INDENT,
                });
                lineY +=
                  doc.heightOfString(bullet, { width: ERROR_TEXT_W - BULLET_INDENT }) + BULLET_GAP;
              }
            } else {
              doc.text(errorText, 95, boxTop + ERROR_BOX_PAD, { width: ERROR_TEXT_W });
            }

            doc.fillColor("black");
            doc.y = boxTop + errorBoxH;
          }

          doc.moveDown(0.5);

          // Add screenshot in card format
          if (screenshotFile) {
            const screenshotPath = path.join(
              this.screenshotsDir,
              screenshotFile,
            );

            try {
              const cardPadding = 15;
              const cardX = 50;
              const cardY = doc.y;
              const cardWidth = 495;

              // Calculate image dimensions
              const maxImageWidth = cardWidth - cardPadding * 2;
              const maxImageHeight = 480;

              // Draw card background with shadow effect
              doc.save();

              // Shadow
              doc
                .rect(
                  cardX + 3,
                  cardY + 3,
                  cardWidth,
                  maxImageHeight + cardPadding * 2,
                )
                .fillOpacity(0.1)
                .fill("#000000");

              // Card background
              doc.fillOpacity(1);
              doc
                .rect(cardX, cardY, cardWidth, maxImageHeight + cardPadding * 2)
                .fillAndStroke("#FFFFFF", "#DEE2E6");

              doc.restore();

              // Oracle often leaves the page untouched between steps, so the same
              // capture can appear on several pages — execution 2158 had 25
              // screenshots but only 22 distinct ones. Embed each distinct image
              // once and reference it from every page that shows it, rather than
              // carrying the same bytes two or three times.
              const cacheKey = crypto
                .createHash("md5")
                .update(fs.readFileSync(screenshotPath))
                .digest("hex");

              let embeddedImage = imageCache.get(cacheKey);
              if (embeddedImage) {
                console.log(
                  `[Screenshot] ${path.basename(screenshotPath)}: identical to an earlier step — reusing the embedded image`,
                );
              } else {
                const encoded = await ReportGenerator.encodeScreenshot(screenshotPath);
                // openImage returns a reusable handle; doc.image() embeds it on
                // first use and only references it thereafter.
                embeddedImage = doc.openImage(encoded.buffer);
                imageCache.set(cacheKey, embeddedImage);
                console.log(
                  `[Screenshot] ${path.basename(screenshotPath)}: ` +
                  `${(fs.statSync(screenshotPath).size / 1024).toFixed(0)}KB -> ` +
                  `${(encoded.buffer.length / 1024).toFixed(0)}KB as ${encoded.format}`,
                );
              }

              // Add image inside card with padding
              doc.image(
                embeddedImage,
                cardX + cardPadding,
                cardY + cardPadding,
                {
                  fit: [maxImageWidth, maxImageHeight],
                  align: "center",
                },
              );

              doc.y = cardY + maxImageHeight + cardPadding * 2 + 10;
            } catch (imgError) {
              console.error(
                `Error adding screenshot ${screenshotFile}:`,
                imgError.message,
              );
              doc
                .fontSize(8)
                .fillColor("gray")
                .text("Screenshot unavailable", 60, doc.y + 5);
              doc.fillColor("black");
              doc.moveDown(1);
            }
          } else {
            // No screenshot for this step — leave a small gap so the next step's
            // header bar doesn't butt straight up against this one.
            doc.y += 6;
          }
        }

        // Summary Footer
        newPage();
        doc.y = 60;
        doc.moveDown(5);

        const successRate = (
          (executionData.successfulActions / executionData.totalActions) *
          100
        ).toFixed(2);

        doc
          .fontSize(20)
          .font("Helvetica-Bold")
          .fillColor("#212529")
          .text("Report Summary", 0, doc.y, { width: 595, align: "center" });
        doc.moveDown(1);

        // Download and store signature path for later use
        let signaturePath = null;
        if (executionData.userSignatureUrl) {
          try {
            signaturePath = await this.downloadSignatureFromS3(executionData.userSignatureUrl, this.executionReportDir);
            console.log(`[Report] Signature downloaded: ${signaturePath}`);
          } catch (sigError) {
            console.error('[Report] Failed to download signature:', sigError.message);
          }
        }

        // Summary stats table (matching style of execution summary)
        const summaryTableX = 50;
        const summaryTableY = doc.y;
        const summaryTableWidth = 495;
        const summaryRowHeight = 28;
        const summaryCol1Width = 150;
        const summaryCellPadding = 10;
        const summaryBorderColor = "#000000";
        const summaryWhiteColor = "#FFFFFF";

        // Resolve transaction info up-front so the shadow rect can size
        // for the optional 4th row.
        let transactionInfoForReport = executionData && executionData.transactionInfo;
        if (!transactionInfoForReport && Array.isArray(executionData && executionData.results)) {
          const sentinel = executionData.results.find(
            (r) => r && r.metaType === 'transaction-info' && r.transactionInfo
          );
          if (sentinel) transactionInfoForReport = sentinel.transactionInfo;
        }
        const summaryRowCount = (transactionInfoForReport && transactionInfoForReport.transactionNumber) ? 4 : 3;

        // Draw table shadow
        doc.save();
        doc
          .rect(
            summaryTableX + 3,
            summaryTableY + 3,
            summaryTableWidth,
            summaryRowHeight * summaryRowCount,
          )
          .fillOpacity(0.1)
          .fill("#000000");
        doc.restore();

        // Row 0: Success Rate
        doc
          .rect(
            summaryTableX,
            summaryTableY,
            summaryTableWidth,
            summaryRowHeight,
          )
          .fillAndStroke(summaryWhiteColor, summaryBorderColor);
        doc
          .moveTo(summaryTableX + summaryCol1Width, summaryTableY)
          .lineTo(
            summaryTableX + summaryCol1Width,
            summaryTableY + summaryRowHeight,
          )
          .stroke(summaryBorderColor);

        doc
          .fontSize(11)
          .font("Helvetica-Bold")
          .fillColor("#212529")
          .text(
            "Success Rate:",
            summaryTableX + summaryCellPadding,
            summaryTableY + 9,
          );
        doc
          .fontSize(14)
          .font("Helvetica-Bold")
          .fillColor("#28a745")
          .text(
            `${successRate}%`,
            summaryTableX + summaryCol1Width + summaryCellPadding,
            summaryTableY + 7,
          );

        // Row 1: Total Steps
        let currentSummaryY = summaryTableY + summaryRowHeight;
        doc
          .rect(
            summaryTableX,
            currentSummaryY,
            summaryTableWidth,
            summaryRowHeight,
          )
          .fillAndStroke(summaryWhiteColor, summaryBorderColor);
        doc
          .moveTo(summaryTableX + summaryCol1Width, currentSummaryY)
          .lineTo(
            summaryTableX + summaryCol1Width,
            currentSummaryY + summaryRowHeight,
          )
          .stroke(summaryBorderColor);

        doc
          .fontSize(11)
          .font("Helvetica-Bold")
          .fillColor("#212529")
          .text(
            "Total Steps:",
            summaryTableX + summaryCellPadding,
            currentSummaryY + 9,
          );
        doc
          .fontSize(10)
          .font("Helvetica")
          .fillColor("#495057")
          .text(
            String(filteredResults.length),
            summaryTableX + summaryCol1Width + summaryCellPadding,
            currentSummaryY + 9,
          );

        // Row 2 (optional): Transaction Number — only when parsed.
        if (transactionInfoForReport && transactionInfoForReport.transactionNumber) {
          currentSummaryY += summaryRowHeight;
          doc
            .rect(
              summaryTableX,
              currentSummaryY,
              summaryTableWidth,
              summaryRowHeight,
            )
            .fillAndStroke(summaryWhiteColor, summaryBorderColor);
          doc
            .moveTo(summaryTableX + summaryCol1Width, currentSummaryY)
            .lineTo(
              summaryTableX + summaryCol1Width,
              currentSummaryY + summaryRowHeight,
            )
            .stroke(summaryBorderColor);

          doc
            .fontSize(9)
            .font("Helvetica-Bold")
            .fillColor("#212529")
            .text(
              "Transaction Number:",
              summaryTableX + summaryCellPadding,
              currentSummaryY + 9,
            );
          const txnDisplay = transactionInfoForReport.transactionNumber;
          doc
            .fontSize(9)
            .font("Helvetica")
            .fillColor("#495057")
            .text(
              txnDisplay,
              summaryTableX + summaryCol1Width + summaryCellPadding,
              currentSummaryY + 9,
            );
        }

        // Row 3: Report Generated
        currentSummaryY += summaryRowHeight;
        doc
          .rect(
            summaryTableX,
            currentSummaryY,
            summaryTableWidth,
            summaryRowHeight,
          )
          .fillAndStroke(summaryWhiteColor, summaryBorderColor);
        doc
          .moveTo(summaryTableX + summaryCol1Width, currentSummaryY)
          .lineTo(
            summaryTableX + summaryCol1Width,
            currentSummaryY + summaryRowHeight,
          )
          .stroke(summaryBorderColor);

        doc
          .fontSize(9)
          .font("Helvetica-Bold")
          .fillColor("#212529")
          .text(
            "Report Generated:",
            summaryTableX + summaryCellPadding,
            currentSummaryY + 9,
          );
        doc
          .fontSize(9)
          .font("Helvetica")
          .fillColor("#495057")
          .text(
            new Date().toLocaleString(),
            summaryTableX + summaryCol1Width + summaryCellPadding,
            currentSummaryY + 9,
          );

        doc.fillColor("black");

        // Add signature section if available
        if (signaturePath && fs.existsSync(signaturePath)) {
          try {
            doc.moveDown(2);

            // Signature table configuration
            const sigTableX = summaryTableX;
            const sigTableY = doc.y;
            const sigTableWidth = summaryTableWidth;
            const sigRowHeight = 80; // Taller row for signature
            const sigCol1Width = summaryCol1Width;
            const sigCellPadding = summaryCellPadding;
            const sigBorderColor = summaryBorderColor;
            const sigWhiteColor = summaryWhiteColor;

            // Draw signature table shadow
            doc.save();
            doc
              .rect(
                sigTableX + 3,
                sigTableY + 3,
                sigTableWidth,
                sigRowHeight,
              )
              .fillOpacity(0.1)
              .fill("#000000");
            doc.restore();

            // Draw signature table row
            doc
              .rect(
                sigTableX,
                sigTableY,
                sigTableWidth,
                sigRowHeight,
              )
              .fillAndStroke(sigWhiteColor, sigBorderColor);

            // Draw vertical separator
            doc
              .moveTo(sigTableX + sigCol1Width, sigTableY)
              .lineTo(sigTableX + sigCol1Width, sigTableY + sigRowHeight)
              .stroke(sigBorderColor);

            // Left column: "Executed By:" label + user name
            doc
              .fontSize(11)
              .font("Helvetica-Bold")
              .fillColor("#212529")
              .text(
                "Executed By:",
                sigTableX + sigCellPadding,
                sigTableY + 15,
              );

            // Add user name below "Executed By:"
            doc
              .fontSize(10)
              .font("Helvetica")
              .fillColor("#212529")
              .text(
                executionData.userName || '-',
                sigTableX + sigCellPadding,
                sigTableY + 35,
              );

            // Right column: Signature image centered
            const signatureWidth = 120;
            const rightColumnWidth = sigTableWidth - sigCol1Width;
            const signatureX = sigTableX + sigCol1Width + (rightColumnWidth / 2) - (signatureWidth / 2);
            const signatureY = sigTableY + 20;

            // Add signature image
            doc.image(signaturePath, signatureX, signatureY, {
              width: signatureWidth,
              height: 40,
              fit: [signatureWidth, 40]
            });

            console.log('[Report] Signature added to PDF in table format');
          } catch (sigError) {
            console.error('[Report] Error adding signature to PDF:', sigError.message);
          }
        }

        // Stamp the footers last, now that the page count is a fact rather than
        // a prediction. Every section above decides its own page breaks, so the
        // only way "Page X of Y" can stay correct is to count afterwards.
        const pageRange = doc.bufferedPageRange();
        for (let p = 0; p < pageRange.count; p++) {
          doc.switchToPage(pageRange.start + p);
          this.drawPageFooter(doc, p + 1, pageRange.count, logoPathRight);
        }
        console.log(`[Report] Final page count: ${pageRange.count}`);

        doc.flushPages();
        doc.end();

        stream.on("finish", async () => {
          console.log(`PDF report generated: ${pdfPath}`);

          // Skip S3 when USE_LOCAL_STORAGE=true — keep report on disk for manual cleanup
          if (process.env.USE_LOCAL_STORAGE === 'true') {
            console.log('[ReportGenerator] USE_LOCAL_STORAGE=true — keeping report on server');
            return resolve(pdfPath);
          }

          try {
            // Upload to S3
            console.log('[ReportGenerator] Uploading PDF to S3...');
            const s3 = new S3Helper();

            // Generate S3 key: executionId/filename
            const s3Key = `${this.executionId}/${fileName}`;
            const uploadResult = await s3.uploadFile(pdfPath, s3Key);

            console.log(`[ReportGenerator] PDF uploaded to S3: ${uploadResult.url}`);

            // Delete local PDF file
            s3.deleteLocalFile(pdfPath);

            // Delete entire execution directory (includes screenshots)
            s3.deleteLocalDirectory(this.executionReportDir);

            console.log('[ReportGenerator] Local files cleaned up');

            // Resolve with S3 metadata
            resolve({
              s3Url: uploadResult.url,
              s3Key: uploadResult.key,
              bucket: uploadResult.bucket,
              region: uploadResult.region,
              fileName: uploadResult.fileName,
              fileSize: uploadResult.fileSize,
              fileSizeMB: uploadResult.fileSizeMB,
              contentType: uploadResult.contentType,
              etag: uploadResult.etag,
              uploadedAt: uploadResult.uploadedAt
            });

          } catch (s3Error) {
            console.error('[ReportGenerator] S3 upload failed:', s3Error.message);
            console.log('[ReportGenerator] Falling back to local path');
            // If S3 upload fails, return local path
            resolve(pdfPath);
          }
        });

        stream.on("error", (err) => {
          reject(err);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  // Helper function to draw page header with logo
  drawPageHeader(doc, logoPathLeft = null, logoPathRight = null) {
    const headerY = 15;

    // Try to add logo at top left (Customer Logo)
    // Constrained to max 100x30 (same as the product logo)
    if (logoPathLeft && fs.existsSync(logoPathLeft)) {
      try {
        doc.image(logoPathLeft, 50, headerY, {
          fit: [100, 30],  // Max width 100pt, max height 30pt - maintains aspect ratio
          align: 'left',
          valign: 'top'
        });
      } catch (err) {
        console.log("Could not add left logo:", err.message);
      }
    }

    // Add the product logo at top right - Smaller size
    if (logoPathRight && fs.existsSync(logoPathRight)) {
      try {
        // Position to align with table right edge
        // Logo dimensions: 100x30
        const logoWidth = 100;
        const logoHeight = 30;
        const logoX = 545 - logoWidth; // Right-align with table edge (50 + 495 = 545)
        doc.image(logoPathRight, logoX, headerY, { width: logoWidth, height: logoHeight });
      } catch (err) {
        console.log("Could not add right logo:", err.message);
      }
    }
  }

  // Helper function to draw page footer with page number and branding
  drawPageFooter(doc, pageNumber, totalPages, logoPathRight = null) {
    const footerY = 792 - 30; // A4 height is 792pt, footer at bottom

    // Left - Oracle Partner Logo
    const oraclePartnerLogoPath = PARTNER_LOGO;
    try {
      if (fs.existsSync(oraclePartnerLogoPath)) {
        doc.image(oraclePartnerLogoPath, 50, footerY - 8, {
          height: 23  // Width auto-calculated to maintain original aspect ratio
        });
      }
    } catch (e) {
      console.log("Oracle Partner logo not found, skipping...");
    }

    // Center text — product name, omitted in the unbranded build.
    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#666666")
      .text("", 0, footerY, { width: 595, align: "center" });

    // Right text - Page number with total
    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#666666")
      .text(`Page ${pageNumber} of ${totalPages}`, 470, footerY, {
        width: 75,
        align: "right",
      });
  }


  // Delete screenshot images after PDF generation
  async deleteScreenshots() {
    try {
      const files = fs.readdirSync(this.screenshotsDir);
      // `live_<N>.png` are the highlighted preview frames streamed to live
      // viewers. They never reach the PDF, so nothing else would ever clear
      // them — they have to go out with the rest or they accumulate on disk.
      const screenshots = files.filter(
        (f) => (f.startsWith("step_") || f.startsWith("live_")) && f.endsWith(".png"),
      );

      for (const file of screenshots) {
        const filePath = path.join(this.screenshotsDir, file);
        fs.unlinkSync(filePath);
        console.log(`Deleted screenshot: ${file}`);
      }

      console.log(`Deleted ${screenshots.length} screenshot(s)`);
      return screenshots.length;
    } catch (error) {
      console.error("Error deleting screenshots:", error.message);
      throw error;
    }
  }



}

module.exports = ReportGenerator;
