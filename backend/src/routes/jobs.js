import express from 'express';
import { body, validationResult } from 'express-validator';
import { getDatabase } from '../database/init.js';
import { scheduleJob, unscheduleJob, executeJobManually } from '../services/scheduler.js';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';

const router = express.Router();

// Get all jobs
router.get('/', async (req, res) => {
  try {
    const db = getDatabase();
    const jobs = await db.all('SELECT * FROM jobs ORDER BY created_at DESC');
    
    const formattedJobs = jobs.map(job => ({
      id: job.id,
      name: job.name,
      description: job.description,
      interfaces: JSON.parse(job.interfaces),
      subnets: JSON.parse(job.subnets),
      authorizedMacs: JSON.parse(job.authorized_macs || '[]'),
      frequency: job.frequency,
      isActive: Boolean(job.is_active),
      alertConfig: JSON.parse(job.alert_config),
      grafanaWebhook: job.grafana_webhook,
      lastRun: job.last_run,
      nextRun: job.next_run,
      createdAt: job.created_at,
      schedule: {
        type: 'interval',
        value: `${job.frequency}m`,
        timezone: 'UTC'
      }
    }));
    
    res.json(formattedJobs);
  } catch (error) {
    logger.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Get job by ID
router.get('/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const job = await db.get('SELECT * FROM jobs WHERE id = ?', [req.params.id]);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    const formattedJob = {
      id: job.id,
      name: job.name,
      description: job.description,
      interfaces: JSON.parse(job.interfaces),
      subnets: JSON.parse(job.subnets),
      authorizedMacs: JSON.parse(job.authorized_macs || '[]'),
      frequency: job.frequency,
      isActive: Boolean(job.is_active),
      alertConfig: JSON.parse(job.alert_config),
      grafanaWebhook: job.grafana_webhook,
      lastRun: job.last_run,
      nextRun: job.next_run,
      createdAt: job.created_at,
      schedule: {
        type: 'interval',
        value: `${job.frequency}m`,
        timezone: 'UTC'
      }
    };
    
    res.json(formattedJob);
  } catch (error) {
    logger.error('Error fetching job:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// Create job
router.post('/', [
  body('name').notEmpty().withMessage('Name is required'),
  body('interfaces').isArray().withMessage('Interfaces must be an array'),
  body('subnets').isArray().withMessage('Subnets must be an array'),
  body('frequency').isInt({ min: 1 }).withMessage('Frequency must be a positive integer'),
  body('alertConfig').isObject().withMessage('Alert config must be an object')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const db = getDatabase();
    const jobId = uuidv4();
    const {
      name,
      description = '',
      interfaces,
      subnets,
      authorizedMacs = [],
      frequency,
      isActive = true,
      alertConfig,
      grafanaWebhook
    } = req.body;
    
    await db.run(
      'INSERT INTO jobs (id, name, description, interfaces, subnets, authorized_macs, frequency, is_active, alert_config, grafana_webhook) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        jobId,
        name,
        description,
        JSON.stringify(interfaces),
        JSON.stringify(subnets),
        JSON.stringify(authorizedMacs),
        frequency,
        isActive,
        JSON.stringify(alertConfig),
        grafanaWebhook || null
      ]
    );
    
    const job = await db.get('SELECT * FROM jobs WHERE id = ?', [jobId]);
    
    if (isActive) {
      scheduleJob({
        ...job,
        interfaces: JSON.parse(job.interfaces),
        subnets: JSON.parse(job.subnets),
        authorized_macs: JSON.parse(job.authorized_macs || '[]'),
        alert_config: JSON.parse(job.alert_config)
      });
    }
    
    logger.info(`Job created: ${name}`);
    res.status(201).json({ id: jobId, message: 'Job created successfully' });
  } catch (error) {
    logger.error('Error creating job:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
});

// Update job
router.put('/:id', [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('interfaces').optional().isArray().withMessage('Interfaces must be an array'),
  body('subnets').optional().isArray().withMessage('Subnets must be an array'),
  body('frequency').optional().isInt({ min: 1 }).withMessage('Frequency must be a positive integer'),
  body('alertConfig').optional().isObject().withMessage('Alert config must be an object')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const db = getDatabase();
    const jobId = req.params.id;
    
    const existingJob = await db.get('SELECT * FROM jobs WHERE id = ?', [jobId]);
    if (!existingJob) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    const updates = {};
    const values = [];
    const allowedFields = [
      'name', 'description', 'interfaces', 'subnets', 'authorized_macs',
      'frequency', 'is_active', 'alert_config', 'grafana_webhook'
    ];
    
    for (const [key, value] of Object.entries(req.body)) {
      const dbKey = key === 'authorizedMacs' ? 'authorized_macs' :
                   key === 'isActive' ? 'is_active' :
                   key === 'alertConfig' ? 'alert_config' :
                   key === 'grafanaWebhook' ? 'grafana_webhook' : key;
      
      if (allowedFields.includes(dbKey)) {
        updates[dbKey] = '?';
        if (Array.isArray(value) || typeof value === 'object') {
          values.push(JSON.stringify(value));
        } else {
          values.push(value);
        }
      }
    }
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    values.push(jobId);
    
    await db.run(`UPDATE jobs SET ${setClause} WHERE id = ?`, values);
    
    // Reschedule job if it's active
    const updatedJob = await db.get('SELECT * FROM jobs WHERE id = ?', [jobId]);
    unscheduleJob(jobId);
    
    if (updatedJob.is_active) {
      scheduleJob({
        ...updatedJob,
        interfaces: JSON.parse(updatedJob.interfaces),
        subnets: JSON.parse(updatedJob.subnets),
        authorized_macs: JSON.parse(updatedJob.authorized_macs || '[]'),
        alert_config: JSON.parse(updatedJob.alert_config)
      });
    }
    
    logger.info(`Job updated: ${jobId}`);
    res.json({ message: 'Job updated successfully' });
  } catch (error) {
    logger.error('Error updating job:', error);
    res.status(500).json({ error: 'Failed to update job' });
  }
});

// Delete job
router.delete('/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const jobId = req.params.id;
    
    const job = await db.get('SELECT * FROM jobs WHERE id = ?', [jobId]);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    await db.run('DELETE FROM jobs WHERE id = ?', [jobId]);
    unscheduleJob(jobId);
    
    logger.info(`Job deleted: ${jobId}`);
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    logger.error('Error deleting job:', error);
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

// Execute job manually
router.post('/:id/execute', async (req, res) => {
  try {
    const jobId = req.params.id;
    await executeJobManually(jobId);
    res.json({ message: 'Job executed successfully' });
  } catch (error) {
    logger.error('Error executing job manually:', error);
    res.status(500).json({ error: 'Failed to execute job' });
  }
});

export default router;