import express from 'express';
import { getDatabase } from '../database/init.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Get all settings
router.get('/', async (req, res) => {
  try {
    const db = getDatabase();
    const settings = await db.all('SELECT * FROM settings');
    
    const settingsObj = {};
    settings.forEach(setting => {
      try {
        settingsObj[setting.key] = JSON.parse(setting.value);
      } catch {
        settingsObj[setting.key] = setting.value;
      }
    });
    
    res.json(settingsObj);
  } catch (error) {
    logger.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update settings
router.put('/', async (req, res) => {
  try {
    const db = getDatabase();
    
    for (const [key, value] of Object.entries(req.body)) {
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      
      await db.run(
        'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
        [key, stringValue]
      );
    }
    
    logger.info('Settings updated');
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    logger.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;