import sqlite3 from 'sqlite3';
import path from 'path';
import { Log } from '../logging_middleware/logger';

export class Database {
  private static instance: Database;
  private db: sqlite3.Database;

  private constructor() {
    const dbPath = path.join(__dirname, '../../data/urls.db');
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        Log('backend', 'error', 'db', `Failed to connect to database: ${err.message}`);
        throw err;
      }
      Log('backend', 'info', 'db', 'Connected to SQLite database');
    });
    
    this.initializeTables();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private async initializeTables(): Promise<void> {
    const createUrlsTable = `
      CREATE TABLE IF NOT EXISTS urls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        original_url TEXT NOT NULL,
        short_code TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        access_count INTEGER DEFAULT 0,
        last_accessed DATETIME NULL
      )
    `;

    const createAnalyticsTable = `
      CREATE TABLE IF NOT EXISTS analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        short_code TEXT NOT NULL,
        accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        ip_address TEXT,
        user_agent TEXT,
        referrer TEXT,
        location TEXT DEFAULT 'Unknown',
        FOREIGN KEY (short_code) REFERENCES urls (short_code)
      )
    `;

    try {
      await this.run(createUrlsTable);
      await this.run(createAnalyticsTable);
      Log('backend', 'info', 'db', 'Database tables initialized successfully');
    } catch (error) {
      Log('backend', 'error', 'db', `Failed to initialize tables: ${error}`);
      throw error;
    }
  }

  public run(sql: string, params: any[] = []): Promise<sqlite3.RunResult> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          Log('backend', 'error', 'db', `SQL execution failed: ${err.message}`);
          reject(err);
        } else {
          resolve(this);
        }
      });
    });
  }

  public get(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          Log('backend', 'error', 'db', `SQL query failed: ${err.message}`);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  public all(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          Log('backend', 'error', 'db', `SQL query failed: ${err.message}`);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  public close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          Log('backend', 'error', 'db', `Failed to close database: ${err.message}`);
          reject(err);
        } else {
          Log('backend', 'info', 'db', 'Database connection closed');
          resolve();
        }
      });
    });
  }
}
