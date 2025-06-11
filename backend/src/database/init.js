import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import logger from '../utils/logger.js';

const dbPath = process.env.DB_PATH || './data/arp_monitoring.db';
let db;

export function getDatabase() {
  if (!db) {
    db = new sqlite3.Database(dbPath);
    db.run = promisify(db.run.bind(db));
    db.get = promisify(db.get.bind(db));
    db.all = promisify(db.all.bind(db));
  }
  return db;
}

export async function initializeDatabase() {
  const database = getDatabase();
  
  try {
    // Jobs table
    await database.run(`
      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        interfaces TEXT NOT NULL,
        subnets TEXT NOT NULL,
        authorized_macs TEXT,
        frequency INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        alert_config TEXT NOT NULL,
        grafana_webhook TEXT,
        last_run DATETIME,
        next_run DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Devices table
    await database.run(`
      CREATE TABLE IF NOT EXISTS devices (
        id TEXT PRIMARY KEY,
        mac TEXT UNIQUE NOT NULL,
        ip TEXT NOT NULL,
        vendor TEXT,
        hostname TEXT,
        first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_authorized BOOLEAN DEFAULT 0,
        previous_ips TEXT DEFAULT '[]'
      )
    `);

    // Alerts table
    await database.run(`
      CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        job_id TEXT NOT NULL,
        job_name TEXT NOT NULL,
        type TEXT NOT NULL,
        level TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        device_data TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        acknowledged BOOLEAN DEFAULT 0,
        FOREIGN KEY (job_id) REFERENCES jobs (id) ON DELETE CASCADE
      )
    `);

    // Scan results table
    await database.run(`
      CREATE TABLE IF NOT EXISTS scan_results (
        id TEXT PRIMARY KEY,
        job_id TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        devices_found INTEGER NOT NULL,
        new_devices INTEGER NOT NULL,
        execution_time INTEGER NOT NULL,
        status TEXT NOT NULL,
        error_message TEXT,
        FOREIGN KEY (job_id) REFERENCES jobs (id) ON DELETE CASCADE
      )
    `);

    // Settings table
    await database.run(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await database.run('CREATE INDEX IF NOT EXISTS idx_devices_mac ON devices(mac)');
    await database.run('CREATE INDEX IF NOT EXISTS idx_devices_ip ON devices(ip)');
    await database.run('CREATE INDEX IF NOT EXISTS idx_alerts_job_id ON alerts(job_id)');
    await database.run('CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp)');
    await database.run('CREATE INDEX IF NOT EXISTS idx_scan_results_job_id ON scan_results(job_id)');
    await database.run('CREATE INDEX IF NOT EXISTS idx_scan_results_timestamp ON scan_results(timestamp)');

    logger.info('Database tables created successfully');
  } catch (error) {
    logger.error('Error initializing database:', error);
    throw error;
  }
}