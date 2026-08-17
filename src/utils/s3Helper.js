/**
 * AWS S3 Helper Utility
 * Upload and manage files in S3 bucket
 * Uses encrypted credentials from .env
 */

const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const fs = require('fs');
const path = require('path');
const EnvEncryption = require('./envEncryption');

class S3Helper {
  constructor() {
    // Get and decrypt AWS credentials from environment
    this.region = EnvEncryption.getEnv('AWS_REGION') || 'us-east-1';
    this.accessKeyId = EnvEncryption.getEnv('AWS_ACCESS_KEY_ID');
    this.secretAccessKey = EnvEncryption.getEnv('AWS_SECRET_ACCESS_KEY');
    this.bucketName = EnvEncryption.getEnv('AWS_S3_BUCKET_NAME');
    this.s3Folder = EnvEncryption.getEnv('AWS_S3_FOLDER') || 'reports';

    // Validate required credentials
    if (!this.accessKeyId || !this.secretAccessKey || !this.bucketName) {
      throw new Error('Missing AWS S3 configuration. Please check your .env file and encrypt credentials.');
    }

    // Initialize S3 client
    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey,
      },
    });

    console.log(`[S3Helper] Initialized - Bucket: ${this.bucketName}, Region: ${this.region}`);
  }

  /**
   * Upload a file to S3
   * @param {string} filePath - Local file path to upload
   * @param {string} s3Key - S3 object key (path in bucket). If not provided, uses filename
   * @param {object} options - Additional options
   * @returns {Promise<object>} Upload result with S3 URL
   */
  async uploadFile(filePath, s3Key = null, options = {}) {
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Generate S3 key if not provided
      if (!s3Key) {
        const fileName = path.basename(filePath);
        s3Key = `${this.s3Folder}/${fileName}`;
      } else if (this.s3Folder && !s3Key.startsWith(this.s3Folder) && !options.skipFolderPrefix) {
        s3Key = `${this.s3Folder}/${s3Key}`;
      }

      // Read file and get metadata
      const fileStream = fs.createReadStream(filePath);
      const fileStats = fs.statSync(filePath);
      const fileSize = fileStats.size;
      const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);

      console.log(`[S3Helper] Uploading ${filePath} (${this.formatBytes(fileSize)}) to s3://${this.bucketName}/${s3Key}`);

      // Determine content type
      const contentType = options.contentType || this.getContentType(filePath);
      const uploadedAt = new Date().toISOString();

      // Upload to S3 using Upload class for better handling of large files
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucketName,
          Key: s3Key,
          Body: fileStream,
          ContentType: contentType,
          ...options.s3Params,
        },
      });

      // Track upload progress
      upload.on('httpUploadProgress', (progress) => {
        if (progress.loaded && progress.total) {
          const percent = ((progress.loaded / progress.total) * 100).toFixed(1);
          console.log(`[S3Helper] Upload progress: ${percent}%`);
        }
      });

      // Execute upload
      const result = await upload.done();

      const s3Url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${s3Key}`;

      console.log(`[S3Helper] Upload successful: ${s3Url}`);

      return {
        success: true,
        bucket: this.bucketName,
        region: this.region,
        key: s3Key,
        url: s3Url,
        fileName: path.basename(filePath),
        fileSize: fileSize,
        fileSizeMB: fileSizeMB,
        contentType: contentType,
        etag: result.ETag,
        location: result.Location,
        uploadedAt: uploadedAt
      };

    } catch (error) {
      console.error('[S3Helper] Upload failed:', error.message);
      throw new Error(`S3 upload failed: ${error.message}`);
    }
  }

  /**
   * Upload a buffer to S3
   * @param {Buffer} buffer - Buffer to upload
   * @param {string} s3Key - S3 object key
   * @param {object} options - Additional options
   * @returns {Promise<object>} Upload result
   */
  async uploadBuffer(buffer, s3Key, options = {}) {
    try {
      // Only prepend folder if skipFolderPrefix is not true
      if (this.s3Folder && !s3Key.startsWith(this.s3Folder) && !options.skipFolderPrefix) {
        s3Key = `${this.s3Folder}/${s3Key}`;
      }

      console.log(`[S3Helper] Uploading buffer (${this.formatBytes(buffer.length)}) to s3://${this.bucketName}/${s3Key}`);

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
        Body: buffer,
        ContentType: options.contentType || 'application/octet-stream',
        ...options.s3Params,
      });

      const result = await this.s3Client.send(command);

      const s3Url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${s3Key}`;

      console.log(`[S3Helper] Upload successful: ${s3Url}`);

      return {
        success: true,
        bucket: this.bucketName,
        key: s3Key,
        url: s3Url,
        etag: result.ETag,
      };

    } catch (error) {
      console.error('[S3Helper] Buffer upload failed:', error.message);
      throw new Error(`S3 buffer upload failed: ${error.message}`);
    }
  }

  /**
   * Download an object from S3 into a Buffer.
   * @param {string} s3Key - S3 object key to fetch
   * @returns {Promise<Buffer>} The object's bytes
   */
  async downloadBuffer(s3Key) {
    try {
      console.log(`[S3Helper] Downloading s3://${this.bucketName}/${s3Key}`);
      const command = new GetObjectCommand({ Bucket: this.bucketName, Key: s3Key });
      const result = await this.s3Client.send(command);
      // AWS SDK v3 (Node) exposes a helper to collect the stream into bytes.
      const bytes = await result.Body.transformToByteArray();
      return Buffer.from(bytes);
    } catch (error) {
      console.error('[S3Helper] Download failed:', error.message);
      throw new Error(`S3 download failed: ${error.message}`);
    }
  }

  /**
   * Delete a file from S3
   * @param {string} s3Key - S3 object key to delete
   * @returns {Promise<object>} Delete result
   */
  async deleteFile(s3Key) {
    try {
      console.log(`[S3Helper] Deleting s3://${this.bucketName}/${s3Key}`);

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });

      await this.s3Client.send(command);

      console.log(`[S3Helper] Delete successful`);

      return {
        success: true,
        bucket: this.bucketName,
        key: s3Key,
      };

    } catch (error) {
      console.error('[S3Helper] Delete failed:', error.message);
      throw new Error(`S3 delete failed: ${error.message}`);
    }
  }

  /**
   * Delete local file
   * @param {string} filePath - Local file path to delete
   */
  deleteLocalFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`[S3Helper] Deleted local file: ${filePath}`);
      }
    } catch (error) {
      console.error(`[S3Helper] Error deleting local file: ${error.message}`);
      // Don't throw - local cleanup is not critical
    }
  }

  /**
   * Delete local directory recursively
   * @param {string} dirPath - Directory path to delete
   */
  deleteLocalDirectory(dirPath) {
    try {
      if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
        console.log(`[S3Helper] Deleted local directory: ${dirPath}`);
      }
    } catch (error) {
      console.error(`[S3Helper] Error deleting local directory: ${error.message}`);
      // Don't throw - local cleanup is not critical
    }
  }

  /**
   * Get content type based on file extension
   * @param {string} filePath - File path
   * @returns {string} Content type
   */
  getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes = {
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.json': 'application/json',
      '.txt': 'text/plain',
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.xls': 'application/vnd.ms-excel',
    };

    return contentTypes[ext] || 'application/octet-stream';
  }

  /**
   * Get S3 URL for a given key
   * @param {string} s3Key - S3 object key
   * @returns {string} S3 URL
   */
  getS3Url(s3Key) {
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${s3Key}`;
  }

  /**
   * Format bytes to human readable format
   * @param {number} bytes - Bytes
   * @returns {string} Formatted string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

module.exports = S3Helper;
