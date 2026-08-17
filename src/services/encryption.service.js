/**
 * Encryption Service
 * Handles password hashing and AES-256 encryption
 */

const bcrypt = require('bcrypt');
const crypto = require('crypto');
require('dotenv').config();

class EncryptionService {
  /**
   * Hash a password (for user authentication)
   */
  static async hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare password with hash
   */
  static async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Get encryption key from environment or generate default
   */
  static getEncryptionKey() {
    const key = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-this-in-production-32chars';
    // Ensure key is exactly 32 bytes for AES-256
    return crypto.createHash('sha256').update(key).digest();
  }

  /**
   * Encrypt sensitive data using AES-256-CBC
   * @param {string} data - Data to encrypt
   * @returns {string} - Encrypted data in format: iv:encryptedData
   */
  static encryptData(data) {
    try {
      const algorithm = 'aes-256-cbc';
      const key = this.getEncryptionKey();

      // Generate random IV (Initialization Vector)
      const iv = crypto.randomBytes(16);

      // Create cipher
      const cipher = crypto.createCipheriv(algorithm, key, iv);

      // Encrypt data
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Return IV + encrypted data (we need IV for decryption)
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data using AES-256-CBC
   * @param {string} encryptedData - Encrypted data in format: iv:encryptedData
   * @returns {string} - Decrypted data
   */
  static decryptData(encryptedData) {
    try {
      const algorithm = 'aes-256-cbc';
      const key = this.getEncryptionKey();

      // Split IV and encrypted data
      const parts = encryptedData.split(':');
      if (parts.length !== 2) {
        throw new Error('Invalid encrypted data format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];

      // Create decipher
      const decipher = crypto.createDecipheriv(algorithm, key, iv);

      // Decrypt data
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }
}

module.exports = EncryptionService;
