/**
 * Environment Variable Encryption Utility
 * Generic encryption for any environment variables listed in config
 * Completely separate from existing encryption systems
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Algorithm configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 12 bytes for GCM
const AUTH_TAG_LENGTH = 16; // 16 bytes authentication tag
const SALT_LENGTH = 32; // 32 bytes salt for key derivation
const KEY_LENGTH = 32; // 32 bytes for AES-256

class EnvEncryption {
  /**
   * Get the configuration file path
   */
  static getConfigPath() {
    return path.join(__dirname, '..', 'config', 'encrypted-vars.json');
  }

  /**
   * Load the config file to get list of encrypted variables
   */
  static loadConfig() {
    try {
      const configPath = this.getConfigPath();
      if (!fs.existsSync(configPath)) {
        console.warn('[EnvEncryption] Config file not found, using empty config');
        return { variables: [], encryptedPrefix: 'ENC:' };
      }
      const configData = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      console.error('[EnvEncryption] Error loading config:', error.message);
      return { variables: [], encryptedPrefix: 'ENC:' };
    }
  }

  /**
   * Get list of variables that should be encrypted
   */
  static getEncryptedVarsList() {
    const config = this.loadConfig();
    return config.variables || [];
  }

  /**
   * Get the encrypted prefix
   */
  static getEncryptedPrefix() {
    const config = this.loadConfig();
    return config.encryptedPrefix || 'ENC:';
  }

  /**
   * Check if a variable name should be encrypted (based on config)
   */
  static shouldBeEncrypted(varName) {
    const encryptedVars = this.getEncryptedVarsList();
    return encryptedVars.includes(varName);
  }

  /**
   * Derive a 256-bit key from the encryption key using PBKDF2
   */
  static deriveKey(password, salt) {
    return crypto.pbkdf2Sync(
      password,
      salt,
      100000, // iterations
      KEY_LENGTH,
      'sha256'
    );
  }

  /**
   * Encrypt data using AES-256-GCM
   * @param {string} data - Data to encrypt
   * @returns {string} Encrypted data with format: ENC:salt:iv:authTag:encryptedData
   */
  static encrypt(data) {
    try {
      // Get encryption key from environment
      const encryptionKey = process.env.ENCRYPTION_KEY;
      if (!encryptionKey) {
        throw new Error('ENCRYPTION_KEY not found in environment variables');
      }

      // Convert data to string if needed
      const dataString = typeof data === 'string' ? data : String(data);

      // Generate random salt and IV
      const salt = crypto.randomBytes(SALT_LENGTH);
      const iv = crypto.randomBytes(IV_LENGTH);

      // Derive key from password and salt
      const key = this.deriveKey(encryptionKey, salt);

      // Create cipher
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

      // Encrypt the data
      let encrypted = cipher.update(dataString, 'utf8', 'base64');
      encrypted += cipher.final('base64');

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      // Get prefix
      const prefix = this.getEncryptedPrefix();

      // Combine prefix, salt, iv, authTag, and encrypted data
      const result = [
        prefix + salt.toString('base64'),
        iv.toString('base64'),
        authTag.toString('base64'),
        encrypted
      ].join(':');

      return result;

    } catch (error) {
      console.error('[EnvEncryption] Encryption error:', error.message);
      throw new Error('Failed to encrypt data: ' + error.message);
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   * @param {string} encryptedData - Encrypted data with format: ENC:salt:iv:authTag:encryptedData
   * @returns {string} Decrypted data
   */
  static decrypt(encryptedData) {
    try {
      // Get encryption key from environment
      const encryptionKey = process.env.ENCRYPTION_KEY;
      if (!encryptionKey) {
        throw new Error('ENCRYPTION_KEY not found in environment variables');
      }

      const prefix = this.getEncryptedPrefix();

      // Remove prefix if present
      let dataWithoutPrefix = encryptedData;
      if (encryptedData.startsWith(prefix)) {
        dataWithoutPrefix = encryptedData.substring(prefix.length);
      }

      // Split the encrypted data
      const parts = dataWithoutPrefix.split(':');
      if (parts.length !== 4) {
        throw new Error('Invalid encrypted data format. Expected: ENC:salt:iv:authTag:data');
      }

      const [saltBase64, ivBase64, authTagBase64, encrypted] = parts;

      // Convert from base64
      const salt = Buffer.from(saltBase64, 'base64');
      const iv = Buffer.from(ivBase64, 'base64');
      const authTag = Buffer.from(authTagBase64, 'base64');

      // Derive key from password and salt
      const key = this.deriveKey(encryptionKey, salt);

      // Create decipher
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      // Decrypt the data
      let decrypted = decipher.update(encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;

    } catch (error) {
      console.error('[EnvEncryption] Decryption error:', error.message);
      throw new Error('Failed to decrypt data: ' + error.message);
    }
  }

  /**
   * Check if data is encrypted (has the expected format)
   * @param {string} data - Data to check
   * @returns {boolean} True if data appears to be encrypted
   */
  static isEncrypted(data) {
    if (typeof data !== 'string') return false;
    const prefix = this.getEncryptedPrefix();
    if (!data.startsWith(prefix)) return false;

    // Remove prefix and check format
    const dataWithoutPrefix = data.substring(prefix.length);
    const parts = dataWithoutPrefix.split(':');
    return parts.length === 4;
  }

  /**
   * Get environment variable and auto-decrypt if needed
   * @param {string} varName - Environment variable name
   * @returns {string} Decrypted value or original value if not encrypted
   */
  static getEnv(varName) {
    const value = process.env[varName];

    if (!value) {
      return value;
    }

    // If the value is encrypted, decrypt it
    if (this.isEncrypted(value)) {
      try {
        return this.decrypt(value);
      } catch (error) {
        console.error(`[EnvEncryption] Error decrypting ${varName}:`, error.message);
        throw new Error(`Failed to decrypt environment variable: ${varName}`);
      }
    }

    // Return as-is if not encrypted
    return value;
  }

  /**
   * Add a variable to the encrypted variables list
   * @param {string} varName - Variable name to add
   */
  static addToEncryptedList(varName) {
    try {
      const config = this.loadConfig();
      if (!config.variables.includes(varName)) {
        config.variables.push(varName);
        const configPath = this.getConfigPath();
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log(`[EnvEncryption] Added ${varName} to encrypted variables list`);
      }
    } catch (error) {
      console.error('[EnvEncryption] Error updating config:', error.message);
    }
  }

  /**
   * Remove a variable from the encrypted variables list
   * @param {string} varName - Variable name to remove
   */
  static removeFromEncryptedList(varName) {
    try {
      const config = this.loadConfig();
      config.variables = config.variables.filter(v => v !== varName);
      const configPath = this.getConfigPath();
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      console.log(`[EnvEncryption] Removed ${varName} from encrypted variables list`);
    } catch (error) {
      console.error('[EnvEncryption] Error updating config:', error.message);
    }
  }
}

module.exports = EnvEncryption;
