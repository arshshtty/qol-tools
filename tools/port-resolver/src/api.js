import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { scanPorts, killProcess, getCachedPorts } from './scanner.js';
import { loadPreferences, savePreferences } from './config.js';
import {
  createCorsMiddleware,
  createApiTokenMiddleware,
  createRateLimitMiddleware,
  parseBoundedPort,
  parsePositiveInt,
  sendError
} from '../../shared/security.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function startAPI(config) {
  const app = express();
  const destructiveRateLimit = createRateLimitMiddleware();

  app.use(createCorsMiddleware(config.port));
  app.use(createApiTokenMiddleware());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // Get all active ports
  app.get('/api/ports', async (req, res) => {
    try {
      const ports = await scanPorts();
      res.json({ ports });
    } catch (error) {
      sendError(res, 500, 'port_scan_failed', error.message);
    }
  });

  // Get cached ports (faster)
  app.get('/api/ports/cached', (req, res) => {
    const ports = getCachedPorts();
    res.json({ ports });
  });

  // Scan specific port range
  app.get('/api/scan', async (req, res) => {
    try {
      const allPorts = await scanPorts();
      const start = req.query.start ? parseBoundedPort(req.query.start) : 1;
      const end = req.query.end ? parseBoundedPort(req.query.end) : 65535;

      if (!start || !end) {
        return sendError(res, 400, 'invalid_scan_range', 'start and end must be between 1 and 65535');
      }

      if (start > end) {
        return sendError(res, 400, 'invalid_scan_range', 'start must be less than or equal to end');
      }

      const filtered = allPorts.filter(p => p.port >= start && p.port <= end);
      res.json({ ports: filtered });
    } catch (error) {
      sendError(res, 500, 'port_scan_failed', error.message);
    }
  });

  // Get port preferences
  app.get('/api/preferences', (req, res) => {
    try {
      const preferences = loadPreferences();
      res.json({ preferences });
    } catch (error) {
      sendError(res, 500, 'preferences_load_failed', error.message);
    }
  });

  // Save port preferences
  app.post('/api/preferences', (req, res) => {
    try {
      const preferences = req.body;
      savePreferences(preferences);
      res.json({ success: true, message: 'Preferences saved' });
    } catch (error) {
      sendError(res, 500, 'preferences_save_failed', error.message);
    }
  });

  // Add a preference
  app.post('/api/preferences/:port', (req, res) => {
    try {
      const port = parseBoundedPort(req.params.port);
      if (!port) {
        return sendError(res, 400, 'invalid_port', 'Port must be an integer between 1 and 65535');
      }

      const preferences = loadPreferences();
      preferences[port] = req.body;
      savePreferences(preferences);
      res.json({ success: true, message: 'Preference added' });
    } catch (error) {
      sendError(res, 500, 'preferences_save_failed', error.message);
    }
  });

  // Delete a preference
  app.delete('/api/preferences/:port', (req, res) => {
    try {
      const port = parseBoundedPort(req.params.port);
      if (!port) {
        return sendError(res, 400, 'invalid_port', 'Port must be an integer between 1 and 65535');
      }

      const preferences = loadPreferences();
      delete preferences[port];
      savePreferences(preferences);
      res.json({ success: true, message: 'Preference deleted' });
    } catch (error) {
      sendError(res, 500, 'preferences_delete_failed', error.message);
    }
  });

  // Find conflicts
  app.get('/api/conflicts', async (req, res) => {
    try {
      const ports = await scanPorts();
      const preferences = loadPreferences();
      const conflicts = [];

      for (const port of ports) {
        if (preferences[port.port]) {
          conflicts.push({
            port: port.port,
            expected: preferences[port.port],
            actual: port
          });
        }
      }

      res.json({ conflicts });
    } catch (error) {
      sendError(res, 500, 'conflict_scan_failed', error.message);
    }
  });

  // Kill a process
  app.post('/api/kill/:pid', destructiveRateLimit, async (req, res) => {
    try {
      const pid = parsePositiveInt(req.params.pid);
      if (!pid) {
        return sendError(res, 400, 'invalid_pid', 'PID must be a positive integer');
      }

      const result = await killProcess(pid);
      res.json(result);
    } catch (error) {
      sendError(res, 500, 'kill_failed', error.message);
    }
  });

  // Get scan ranges
  app.get('/api/scan-ranges', (req, res) => {
    const invalidRange = (config.scanRanges || []).find(range => {
      const start = parseBoundedPort(range.start);
      const end = parseBoundedPort(range.end);
      return !start || !end || start > end;
    });

    if (invalidRange) {
      return sendError(res, 500, 'invalid_config_scan_range', 'Configured scan ranges must be ordered and bounded (1-65535)');
    }

    res.json({ ranges: config.scanRanges });
  });

  // Get status
  app.get('/api/status', async (req, res) => {
    const ports = getCachedPorts();
    res.json({
      running: true,
      totalPorts: ports.length,
      platform: process.platform,
      refreshInterval: config.refreshInterval
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
            <title>Port Resolver</title>
          </head>
          <body>
            <h1>Port Resolver API</h1>
            <p>Web UI coming soon. API is running at port ${config.port}</p>
            <h2>Endpoints:</h2>
            <ul>
              <li>GET /api/ports</li>
              <li>GET /api/scan?start=3000&end=9000</li>
              <li>GET /api/preferences</li>
              <li>POST /api/preferences</li>
              <li>GET /api/conflicts</li>
              <li>POST /api/kill/:pid</li>
            </ul>
          </body>
        </html>
      `);
    }
  });


  app.use((err, req, res, next) => {
    if (err) {
      sendError(res, 500, 'internal_error', err.message);
      return;
    }

    next();
  });

  app.listen(config.port, () => {
    console.log(`📡 API server running on http://localhost:${config.port}`);
  });

  return app;
}
