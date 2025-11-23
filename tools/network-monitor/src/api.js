import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { scanNetwork, getLastScanTime, isCurrentlyScanning } from './scanner.js';
import {
  getAllDevices,
  getOnlineDevices,
  getDevice,
  setDeviceName,
  getAlerts,
  clearNewFlags,
  getStats
} from './devices.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function startAPI(config) {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // Get all devices
  app.get('/api/devices', (req, res) => {
    try {
      const devices = getAllDevices();
      res.json({
        devices,
        lastScan: getLastScanTime(),
        scanning: isCurrentlyScanning()
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get only online devices
  app.get('/api/devices/online', (req, res) => {
    try {
      const timeoutMinutes = parseInt(req.query.timeout) || 5;
      const devices = getOnlineDevices(timeoutMinutes);

      res.json({
        devices,
        count: devices.length,
        lastScan: getLastScanTime()
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get specific device
  app.get('/api/devices/:mac', (req, res) => {
    try {
      const mac = req.params.mac.toLowerCase();
      const device = getDevice(mac);

      if (device) {
        res.json({ device });
      } else {
        res.status(404).json({ error: 'Device not found' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Set device name
  app.post('/api/devices/:mac/name', (req, res) => {
    try {
      const mac = req.params.mac.toLowerCase();
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }

      const success = setDeviceName(mac, name);

      if (success) {
        res.json({ success: true, message: 'Device name updated' });
      } else {
        res.status(404).json({ error: 'Device not found' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Trigger network scan
  app.post('/api/scan', async (req, res) => {
    try {
      if (isCurrentlyScanning()) {
        return res.status(409).json({ error: 'Scan already in progress' });
      }

      // Start scan asynchronously
      scanNetwork(config).then(() => {
        console.log('Manual scan completed');
      });

      res.json({ success: true, message: 'Scan started' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get network statistics
  app.get('/api/stats', (req, res) => {
    try {
      const stats = getStats();

      res.json({
        ...stats,
        lastScan: getLastScanTime(),
        scanning: isCurrentlyScanning()
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get recent alerts
  app.get('/api/alerts', (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const alerts = getAlerts(limit);

      res.json({ alerts, count: alerts.length });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Clear new device flags
  app.post('/api/alerts/clear', (req, res) => {
    try {
      clearNewFlags();
      res.json({ success: true, message: 'New device flags cleared' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get configuration
  app.get('/api/config', (req, res) => {
    res.json({
      scanInterval: config.scanInterval,
      enableAlerts: config.enableAlerts,
      alertSound: config.alertSound,
      autoScan: config.autoScan
    });
  });

  // Serve index.html for all other routes
  app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, '..', 'public', 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Network Device Monitor</title>
          </head>
          <body>
            <h1>Network Device Monitor API</h1>
            <p>Web UI coming soon. API is running at port ${config.port}</p>
            <h2>Endpoints:</h2>
            <ul>
              <li>GET /api/devices</li>
              <li>GET /api/devices/online</li>
              <li>GET /api/devices/:mac</li>
              <li>POST /api/devices/:mac/name</li>
              <li>POST /api/scan</li>
              <li>GET /api/stats</li>
              <li>GET /api/alerts</li>
              <li>POST /api/alerts/clear</li>
            </ul>
          </body>
        </html>
      `);
    }
  });

  app.listen(config.port, () => {
    console.log(`📡 API server running on http://localhost:${config.port}`);
  });

  return app;
}
