/**
 * Where the logos drawn into a report come from.
 *
 * This exists because the two report builders disagreed. The execution report
 * resolved the customer logo properly — S3, then a local uploads/ copy, then
 * nothing — while the API report pointed at an `assets/logo.png` that has never
 * existed in this repository. `drawPageHeader` guards with `fs.existsSync`, so
 * the result was not a crash but a silent one: API reports simply never carried
 * customer branding, and nothing said why.
 *
 * One resolver, used by both.
 */

const fs = require("fs");
const path = require("path");

const ASSETS_DIR = path.join(__dirname, "assets");

/** Shipped with the code — the product mark, always drawn top-right. */
const PRODUCT_LOGO = path.join(ASSETS_DIR, "product_logo.png");

/** Drawn in the footer of every page. */
const PARTNER_LOGO = path.join(ASSETS_DIR, "oracle_partner_logo.png");

/** Uploaded customer logos, when this host happens to share a disk with the uploader. */
const UPLOADS_DIR = path.join(__dirname, "..", "..", "uploads", "customer_logos");

/**
 * Resolve the customer logo for the top-left of a report.
 *
 * @param {string|null|undefined} customerLogoPath  as stored on the execution row
 * @param {string} downloadDir                      where an S3 copy should land
 * @param {(key: string, dir: string) => Promise<string|null>} downloadFromS3
 * @returns {Promise<string|null>} a path that exists, or null to omit the logo
 */
async function resolveCustomerLogo(customerLogoPath, downloadDir, downloadFromS3) {
  if (!customerLogoPath) return null;

  // Logos live on S3 because this service shares no filesystem with the
  // uploader; the local copy below is only a same-host convenience.
  const downloaded = await downloadFromS3(customerLogoPath, downloadDir).catch(() => null);
  if (downloaded && fs.existsSync(downloaded)) return downloaded;

  const localCopy = path.join(UPLOADS_DIR, customerLogoPath);
  if (fs.existsSync(localCopy)) return localCopy;

  // Neither source had it. The header omits the logo rather than failing the
  // report — a missing logo is not worth losing the evidence of a run over.
  return null;
}

module.exports = { ASSETS_DIR, PRODUCT_LOGO, PARTNER_LOGO, resolveCustomerLogo };
