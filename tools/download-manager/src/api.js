import express from 'express';
import fs from 'fs';
import path from 'path';
import { getHistory } from './history.js';
import { getStats } from './watcher.js';
import { findDuplicates } from './duplicateDetector.js';
import {
  createCorsMiddleware,
  createApiTokenMiddleware,
  createRateLimitMiddleware,
  sanitizePathSegment,
  sendError
} from '../../shared/security.js';

export function startAPI(config) {
  const app = express();
  const destructiveRateLimit = createRateLimitMiddleware();

  app.use(createCorsMiddleware(config.port));
  app.use(createApiTokenMiddleware());
  app.use(express.json());
  app.use(express.static(path.join(path.dirname(import.meta.url.replace('file://', '')), '..', 'public')));

  // Get status and statistics
  app.get('/api/status', (req, res) => {
    const stats = getStats();
    res.json({
      running: true,
      watchPath: config.watchPath,
      sortedPath: config.sortedPath,
      stats
    });
  });

  // List all sorted files
  app.get('/api/files', (req, res) => {
    const requestedCategory = req.query.category;
    const category = requestedCategory && requestedCategory !== 'all'
      ? sanitizePathSegment(requestedCategory)
      : null;

    if (requestedCategory && requestedCategory !== 'all' && !category) {
      return sendError(res, 400, 'invalid_category', 'Invalid category');
    }

    const files = [];

    function scanDir(dir, categoryName) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isFile()) {
          const stats = fs.statSync(fullPath);
          files.push({
            name: entry.name,
            path: fullPath,
            category: categoryName,
            size: stats.size,
            modified: stats.mtime
          });
        }
      }
    }

    if (category) {
      const categoryPath = path.join(config.sortedPath, category);
      if (fs.existsSync(categoryPath)) {
        scanDir(categoryPath, category);
      }
    } else {
      // Scan all categories
      for (const cat of Object.keys(config.categories)) {
        const categoryPath = path.join(config.sortedPath, cat);
        if (fs.existsSync(categoryPath)) {
          scanDir(categoryPath, cat);
        }
      }

      // Also scan 'other'
      const otherPath = path.join(config.sortedPath, 'other');
      if (fs.existsSync(otherPath)) {
        scanDir(otherPath, 'other');
      }
    }

    res.json({ files });
  });

  // Find duplicates
  app.get('/api/duplicates', async (req, res) => {
    try {
      const duplicates = await findDuplicates(config.sortedPath);
      res.json({ duplicates });
    } catch (error) {
      sendError(res, 500, 'duplicate_scan_failed', error.message);
    }
  });

  // Delete a file
  app.delete('/api/files/:category/:filename', destructiveRateLimit, (req, res) => {
    const category = sanitizePathSegment(req.params.category);
    const filename = sanitizePathSegment(req.params.filename);

    if (!category || !filename) {
      return sendError(res, 400, 'invalid_path_params', 'Invalid category or filename');
    }

    const filePath = path.join(config.sortedPath, category, filename);

    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        res.json({ success: true, message: 'File deleted' });
      } else {
        sendError(res, 404, 'file_not_found', 'File not found');
      }
    } catch (error) {
      sendError(res, 500, 'delete_failed', error.message);
    }
  });

  // Get history
  app.get('/api/history', (req, res) => {
    const limit = parseInt(req.query.limit) || 100;
    const history = getHistory(limit);
    res.json({ history });
  });

  // Get categories
  app.get('/api/categories', (req, res) => {
    res.json({ categories: Object.keys(config.categories) });
  });

  // Serve index.html for all other routes
  app.get('*', (req, res) => {
    const indexPath = path.join(path.dirname(import.meta.url.replace('file://', '')), '..', 'public', 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Download Manager</title>
          </head>
          <body>
            <h1>Download Manager API</h1>
            <p>Web UI coming soon. API is running at port ${config.port}</p>
            <h2>Endpoints:</h2>
            <ul>
              <li>GET /api/status</li>
              <li>GET /api/files?category=images</li>
              <li>GET /api/duplicates</li>
              <li>GET /api/history</li>
              <li>GET /api/categories</li>
              <li>DELETE /api/files/:category/:filename</li>
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
