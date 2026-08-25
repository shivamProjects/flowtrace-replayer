const mysql = require('mysql2/promise');
require('dotenv').config({ silent: true });

// Determine which environment we're in
const isProduction = process.env.NODE_ENV === 'production';

// Database configuration based on environment
const dbConfig = {
  host: isProduction ? process.env.PROD_DB_HOST : process.env.DEV_DB_HOST,
  port: isProduction ? process.env.PROD_DB_PORT : process.env.DEV_DB_PORT,
  user: isProduction ? process.env.PROD_DB_USER : process.env.DEV_DB_USER,
  password: isProduction ? process.env.PROD_DB_PASSWORD : process.env.DEV_DB_PASSWORD,
  database: isProduction ? process.env.PROD_DB_NAME : process.env.DEV_DB_NAME,
  timezone: 'Z', // UTC timezone
  waitForConnections: true,
  // Was 10. dev-gcp-server's MySQL has max_connections=30, shared with
  // pg-final-master/Back's two pools (15 main + 5 ETL = 20) while DEV_DB_HOST
  // points here over an SSH tunnel. 5 leaves headroom instead of the three
  // pools summing to exactly 30 with zero margin. Revert to 10 once back on
  // local/LAN MySQL.
  connectionLimit: 5,
  queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log(`✓ Database connected successfully in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);
    console.log(`✓ Connected to: ${dbConfig.host}/${dbConfig.database}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    return false;
  }
};

// Execute query helper function
const query = async (sql, params) => {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

module.exports = {
  pool,
  query,
  testConnection
};
