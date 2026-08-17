/**
 * Logger Service
 * Centralized logging to application_logs table
 */

const { query } = require('../config/database');
const { LOG_STATUS } = require('../utils/constants');

class LoggerService {
  /**
   * Log an activity to database
   */
  static async log({
    userId = null,
    username = null,
    method = null,
    endpoint = null,
    ipAddress = null,
    location = null,
    userAgent = null,
    action,
    entityType = null,
    entityId = null,
    status = LOG_STATUS.INFO,
    statusCode = null,
    message = null,
    errorMessage = null,
    requestBody = null,
    responseBody = null,
    metadata = null,
    executionTime = null
  }) {
    try {
      const sql = `
        INSERT INTO application_logs (
          user_id, username, method, endpoint, ip_address, location, user_agent,
          action, entity_type, entity_id, status, status_code,
          message, error_message, request_body, response_body,
          metadata, execution_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        userId,
        username,
        method,
        endpoint,
        ipAddress,
        location,
        userAgent,
        action,
        entityType,
        entityId,
        status,
        statusCode,
        message,
        errorMessage,
        requestBody ? JSON.stringify(requestBody) : null,
        responseBody ? JSON.stringify(responseBody) : null,
        metadata ? JSON.stringify(metadata) : null,
        executionTime
      ];

      await query(sql, params);
    } catch (error) {
      // Don't throw error, just log to console to prevent infinite loop
      console.error('Failed to write to application_logs:', error.message);
    }
  }

  /**
   * Log success activity
   */
  static async logSuccess(data) {
    return this.log({ ...data, status: LOG_STATUS.SUCCESS });
  }

  /**
   * Log failure activity
   */
  static async logFailure(data) {
    return this.log({ ...data, status: LOG_STATUS.FAILURE });
  }

  /**
   * Log warning
   */
  static async logWarning(data) {
    return this.log({ ...data, status: LOG_STATUS.WARNING });
  }

  /**
   * Log info
   */
  static async logInfo(data) {
    return this.log({ ...data, status: LOG_STATUS.INFO });
  }

  /**
   * Get logs with filters
   */
  static async getLogs(filters = {}) {
    try {
      let sql = 'SELECT * FROM application_logs WHERE 1=1';
      const params = [];

      if (filters.userId) {
        sql += ' AND user_id = ?';
        params.push(filters.userId);
      }

      if (filters.action) {
        sql += ' AND action = ?';
        params.push(filters.action);
      }

      if (filters.status) {
        sql += ' AND status = ?';
        params.push(filters.status);
      }

      if (filters.startDate) {
        sql += ' AND created_at >= ?';
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        sql += ' AND created_at <= ?';
        params.push(filters.endDate);
      }

      sql += ' ORDER BY created_at DESC';

      if (filters.limit) {
        sql += ' LIMIT ?';
        params.push(parseInt(filters.limit));
      }

      const logs = await query(sql, params);
      return logs;
    } catch (error) {
      console.error('Failed to fetch logs:', error.message);
      throw error;
    }
  }
}

module.exports = LoggerService;
