import cron from 'node-cron';
import { getDatabase } from '../database/init.js';
import arpScanner from './arpScanner.js';
import { createAlert } from './alertService.js';
import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

const scheduledJobs = new Map();

export function startScheduler() {
  logger.info('Starting job scheduler');
  
  // Load and schedule all active jobs
  loadAndScheduleJobs();
  
  // Check for jobs every minute
  cron.schedule('* * * * *', () => {
    loadAndScheduleJobs();
  });
}

async function loadAndScheduleJobs() {
  try {
    const db = getDatabase();
    const jobs = await db.all('SELECT * FROM jobs WHERE is_active = 1');
    
    for (const job of jobs) {
      const jobData = {
        ...job,
        interfaces: JSON.parse(job.interfaces),
        subnets: JSON.parse(job.subnets),
        authorized_macs: JSON.parse(job.authorized_macs || '[]'),
        alert_config: JSON.parse(job.alert_config)
      };
      
      scheduleJob(jobData);
    }
  } catch (error) {
    logger.error('Error loading jobs for scheduling:', error);
  }
}

function scheduleJob(job) {
  const cronExpression = `*/${job.frequency} * * * *`; // Every N minutes
  
  if (scheduledJobs.has(job.id)) {
    // Job already scheduled, check if it needs updating
    const existingJob = scheduledJobs.get(job.id);
    if (existingJob.cronExpression === cronExpression) {
      return; // No change needed
    }
    
    // Destroy existing job and create new one
    existingJob.task.destroy();
    scheduledJobs.delete(job.id);
  }
  
  const task = cron.schedule(cronExpression, async () => {
    await executeJob(job);
  }, {
    scheduled: true
  });
  
  scheduledJobs.set(job.id, { task, cronExpression });
  logger.info(`Scheduled job ${job.name} with frequency ${job.frequency} minutes`);
}

export function unscheduleJob(jobId) {
  if (scheduledJobs.has(jobId)) {
    const { task } = scheduledJobs.get(jobId);
    task.destroy();
    scheduledJobs.delete(jobId);
    logger.info(`Unscheduled job ${jobId}`);
  }
}

async function executeJob(job) {
  const startTime = Date.now();
  logger.info(`Executing job: ${job.name}`);
  
  try {
    const db = getDatabase();
    
    // Update last run time
    await db.run(
      'UPDATE jobs SET last_run = CURRENT_TIMESTAMP WHERE id = ?',
      [job.id]
    );
    
    // Execute scan
    const scanResult = await arpScanner.scanNetwork(
      job.interfaces,
      job.subnets,
      parseInt(process.env.SCAN_TIMEOUT) || 30
    );
    
    const executionTime = Date.now() - startTime;
    let newDevicesCount = 0;
    const alerts = [];
    
    if (scanResult.status === 'success') {
      // Process discovered devices
      for (const scannedDevice of scanResult.devices) {
        const existingDevice = await db.get(
          'SELECT * FROM devices WHERE mac = ?',
          [scannedDevice.mac]
        );
        
        if (existingDevice) {
          // Update existing device
          const previousIps = JSON.parse(existingDevice.previous_ips || '[]');
          if (existingDevice.ip !== scannedDevice.ip) {
            // IP changed
            if (!previousIps.includes(existingDevice.ip)) {
              previousIps.push(existingDevice.ip);
            }
            
            await db.run(
              'UPDATE devices SET ip = ?, last_seen = CURRENT_TIMESTAMP, previous_ips = ? WHERE mac = ?',
              [scannedDevice.ip, JSON.stringify(previousIps), scannedDevice.mac]
            );
            
            if (job.alert_config.ipChangeAlert) {
              alerts.push(await createAlert({
                jobId: job.id,
                jobName: job.name,
                type: 'ip_change',
                level: job.alert_config.alertLevel || 'warning',
                title: 'Device IP Changed',
                message: `Device ${scannedDevice.vendor} (${scannedDevice.mac}) changed IP from ${existingDevice.ip} to ${scannedDevice.ip}`,
                device: scannedDevice
              }));
            }
          } else {
            // Just update last seen
            await db.run(
              'UPDATE devices SET last_seen = CURRENT_TIMESTAMP WHERE mac = ?',
              [scannedDevice.mac]
            );
          }
        } else {
          // New device
          newDevicesCount++;
          const isAuthorized = job.authorized_macs.includes(scannedDevice.mac);
          
          await db.run(
            'INSERT INTO devices (id, mac, ip, vendor, is_authorized) VALUES (?, ?, ?, ?, ?)',
            [uuidv4(), scannedDevice.mac, scannedDevice.ip, scannedDevice.vendor, isAuthorized]
          );
          
          if (job.alert_config.newDeviceAlert) {
            alerts.push(await createAlert({
              jobId: job.id,
              jobName: job.name,
              type: 'new_device',
              level: isAuthorized ? 'info' : 'warning',
              title: 'New Device Detected',
              message: `New device ${scannedDevice.vendor} (${scannedDevice.mac}) found at ${scannedDevice.ip}`,
              device: scannedDevice
            }));
          }
          
          if (!isAuthorized && job.alert_config.unauthorizedDeviceAlert) {
            alerts.push(await createAlert({
              jobId: job.id,
              jobName: job.name,
              type: 'unauthorized_device',
              level: 'critical',
              title: 'Unauthorized Device',
              message: `Unauthorized device ${scannedDevice.vendor} (${scannedDevice.mac}) detected at ${scannedDevice.ip}`,
              device: scannedDevice
            }));
          }
        }
      }
    }
    
    // Save scan result
    await db.run(
      'INSERT INTO scan_results (id, job_id, devices_found, new_devices, execution_time, status, error_message) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        uuidv4(),
        job.id,
        scanResult.devices.length,
        newDevicesCount,
        executionTime,
        scanResult.status,
        scanResult.error || null
      ]
    );
    
    logger.info(`Job ${job.name} completed: ${scanResult.devices.length} devices found, ${newDevicesCount} new, ${alerts.length} alerts generated`);
    
  } catch (error) {
    logger.error(`Job ${job.name} failed:`, error);
    
    // Save failed scan result
    const db = getDatabase();
    await db.run(
      'INSERT INTO scan_results (id, job_id, devices_found, new_devices, execution_time, status, error_message) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        uuidv4(),
        job.id,
        0,
        0,
        Date.now() - startTime,
        'error',
        error.message
      ]
    );
  }
}

export async function executeJobManually(jobId) {
  try {
    const db = getDatabase();
    const job = await db.get('SELECT * FROM jobs WHERE id = ?', [jobId]);
    
    if (!job) {
      throw new Error('Job not found');
    }
    
    const jobData = {
      ...job,
      interfaces: JSON.parse(job.interfaces),
      subnets: JSON.parse(job.subnets),
      authorized_macs: JSON.parse(job.authorized_macs || '[]'),
      alert_config: JSON.parse(job.alert_config)
    };
    
    await executeJob(jobData);
    return { success: true };
  } catch (error) {
    logger.error('Manual job execution failed:', error);
    throw error;
  }
}

export { scheduleJob }