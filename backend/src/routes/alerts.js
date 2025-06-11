import express from 'express';
import { getDatabase } from '../database/init.js';
import { acknowledgeAlert, clearAllAlerts } from '../services/alertService.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Get all alerts
router.get('/', async (req, res) => {
  try {
    const db = getDatabase();
    const { level, acknowledged, limit = 100 } = req.query;
    
    let query = 'SELECT * FROM alerts';
    const params = [];
    const conditions = [];
    
    if (level && level !== 'all') {
      conditions.push('level = ?');
      params.push(level);
    }
    
    if (acknowledged !== undefined && acknowledged !== 'all') {
      conditions.push('acknowledged = ?');
      params.push(acknowledged === 'true' ? 1 : 0);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const alerts = await db.all(query, params);
    
    const formattedAlerts = alerts.map(alert => ({
      id: alert.id,
      jobId: alert.job_id,
      jobName: alert.job_name,
      type: alert.type,
      level: alert.level,
      title: alert.title,
      message: alert.message,
      device: JSON.parse(alert.device_data || '{}'),
      timestamp: alert.timestamp,
      acknowledged: Boolean(alert.acknowledged)
    }));
    
    res.json(formattedAlerts);
  } catch (error) {
    logger.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Acknowledge alert
router.patch('/:id/acknowledge', async (req, res) => {
  try {
    await acknowledgeAlert(req.params.id);
    res.json({ message: 'Alert acknowledged successfully' });
  } catch (error) {
    logger.error('Error acknowledging alert:', error);
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

// Clear all alerts
router.delete('/', async (req, res) => {
  try {
    await clearAllAlerts();
    res.json({ message: 'All alerts cleared successfully' });
  } catch (error) {
    logger.error('Error clearing alerts:', error);
    res.status(500).json({ error: 'Failed to clear alerts' });
  }
});

export default router;