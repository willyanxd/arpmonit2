import express from 'express';
import { getDatabase } from '../database/init.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Get all devices
router.get('/', async (req, res) => {
  try {
    const db = getDatabase();
    const { authorized, search } = req.query;
    
    let query = 'SELECT * FROM devices';
    const params = [];
    const conditions = [];
    
    if (authorized !== undefined) {
      conditions.push('is_authorized = ?');
      params.push(authorized === 'true' ? 1 : 0);
    }
    
    if (search) {
      conditions.push('(mac LIKE ? OR ip LIKE ? OR vendor LIKE ? OR hostname LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY last_seen DESC';
    
    const devices = await db.all(query, params);
    
    const formattedDevices = devices.map(device => ({
      id: device.id,
      mac: device.mac,
      ip: device.ip,
      vendor: device.vendor,
      hostname: device.hostname,
      firstSeen: device.first_seen,
      lastSeen: device.last_seen,
      isAuthorized: Boolean(device.is_authorized),
      previousIps: JSON.parse(device.previous_ips || '[]')
    }));
    
    res.json(formattedDevices);
  } catch (error) {
    logger.error('Error fetching devices:', error);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

// Get device by ID
router.get('/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const device = await db.get('SELECT * FROM devices WHERE id = ?', [req.params.id]);
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    const formattedDevice = {
      id: device.id,
      mac: device.mac,
      ip: device.ip,
      vendor: device.vendor,
      hostname: device.hostname,
      firstSeen: device.first_seen,
      lastSeen: device.last_seen,
      isAuthorized: Boolean(device.is_authorized),
      previousIps: JSON.parse(device.previous_ips || '[]')
    };
    
    res.json(formattedDevice);
  } catch (error) {
    logger.error('Error fetching device:', error);
    res.status(500).json({ error: 'Failed to fetch device' });
  }
});

// Update device authorization
router.patch('/:id/authorize', async (req, res) => {
  try {
    const db = getDatabase();
    const { authorized } = req.body;
    
    if (typeof authorized !== 'boolean') {
      return res.status(400).json({ error: 'Authorized must be a boolean' });
    }
    
    const result = await db.run(
      'UPDATE devices SET is_authorized = ? WHERE id = ?',
      [authorized, req.params.id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    logger.info(`Device ${req.params.id} authorization updated to ${authorized}`);
    res.json({ message: 'Device authorization updated successfully' });
  } catch (error) {
    logger.error('Error updating device authorization:', error);
    res.status(500).json({ error: 'Failed to update device authorization' });
  }
});

// Delete device
router.delete('/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const result = await db.run('DELETE FROM devices WHERE id = ?', [req.params.id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    logger.info(`Device deleted: ${req.params.id}`);
    res.json({ message: 'Device deleted successfully' });
  } catch (error) {
    logger.error('Error deleting device:', error);
    res.status(500).json({ error: 'Failed to delete device' });
  }
});

export default router;