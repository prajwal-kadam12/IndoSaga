/**
 * MySQL Database Connection for IndoSaga
 * Uses environment variables for secure database connection
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

class Database {
  constructor() {
    this.pool = null;
    this.init();
  }

  async init() {
    try {
      if (!process.env.DBHOST || !process.env.DBUSER) {
        console.log('⚠️ MySQL credentials missing, skipping connection.');
        return;
      }
      // Create connection pool for better performance
      this.pool = mysql.createPool({
        host: process.env.DBHOST,
        user: process.env.DBUSER,
        password: process.env.DBPASSWORD,
        database: process.env.DBDATABASE,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        acquireTimeout: 10000, // Reduced for serverless
        timeout: 10000,
        reconnect: true,
        charset: 'utf8mb4'
      });

      // Test the connection with a short timeout
      const connection = await this.pool.getConnection();
      console.log(`✅ MySQL connected successfully to ${process.env.DBHOST}/${process.env.DBDATABASE}`);
      connection.release();
    } catch (error) {
      console.warn('⚠️ MySQL connection failed (graceful):', error.message);
      // We don't throw here to avoid crashing the server/lambda
      this.pool = null;
    }
  }

  async query(sql, params = []) {
    try {
      const [rows] = await this.pool.execute(sql, params);
      return rows;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  async getConnection() {
    return await this.pool.getConnection();
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
    }
  }
}

// Create and export a single instance
const db = new Database();
export default db;