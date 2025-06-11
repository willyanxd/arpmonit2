import express from 'express';
import { getDatabase } from '../database/init.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Get scan results
router.get('/', async (req, res) => {
  try {
    const db = getDatabase();
    const { jobId, limit = 50 } = req.query;
    
    let query = 'SELECT * FROM scan_results';
    const params = [];
    
    if (jobId) {
      query += ' WHERE job_id = ?';
      params.push(jobId);
    }
    
    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const results = await db.all(query, params);
    
    const formattedResults = results.map(result => ({
      id: result.id,
      jobId: result.job_id,
      timestamp: result.timestamp,
      devicesFound: result.devices_found,
      newDevices: result.new_devices,
      executionTime: result.execution_time,
      status: result.status,
      errorMessage: result.error_message,
      alerts: [] // Alerts are stored separately
    }));
    
    res.json(formattedResults);
  } catch (error) {
    logger.error('Error fetching scan results:', error);
    res.status(500).json({ error: 'Failed to fetch scan results' });
  }
});

export default router;