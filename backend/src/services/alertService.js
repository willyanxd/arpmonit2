import { getDatabase } from '../database/init.js';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';

export async function createAlert(alertData) {
  try {
    const db = getDatabase();
    const alert = {
      id: uuidv4(),
      job_id: alertData.jobId,
      job_name: alertData.jobName,
      type: alertData.type,
      level: alertData.level,
      title: alertData.title,
      message: alertData.message,
      device_data: JSON.stringify(alertData.device || {}),
      timestamp: new Date().toISOString(),
      acknowledged: false
    };
    
    await db.run(
      'INSERT INTO alerts (id, job_id, job_name, type, level, title, message, device_data, acknowledged) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        alert.id,
        alert.job_id,
        alert.job_name,
        alert.type,
        alert.level,
        alert.title,
        alert.message,
        alert.device_data,
        alert.acknowledged
      ]
    );
    
    logger.info(`Alert created: ${alert.title}`);
    return alert;
  } catch (error) {
    logger.error('Error creating alert:', error);
    throw error;
  }
}

export async function acknowledgeAlert(alertId) {
  try {
    const db = getDatabase();
    await db.run(
      'UPDATE alerts SET acknowledged = 1 WHERE id = ?',
      [alertId]
    );
    logger.info(`Alert ${alertId} acknowledged`);
  } catch (error) {
    logger.error('Error acknowledging alert:', error);
    throw error;
  }
}

export async function clearAllAlerts() {
  try {
    const db = getDatabase();
    await db.run('DELETE FROM alerts');
    logger.info('All alerts cleared');
  } catch (error) {
    logger.error('Error clearing alerts:', error);
    throw error;
  }
}