import express from 'express';
import cors from 'cors';
import chokidar from 'chokidar';
import fs from 'fs';
import path from 'path';
import { getHistory } from './history.js';
import { getStats } from './watcher.js';
import { findDuplicates } from './duplicateDetector.js';

const SLOW_ENDPOINT_THRESHOLD_MS = 250;
const MAX_PAGE_SIZE = 200;
const DEFAULT_PAGE_SIZE = 50;
const DUPLICATE_CACHE_TTL_MS = 5 * 60 * 1000;

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeSortBy(sortBy) {
  const normalized = (sortBy || 'modified').toString().toLowerCase();
  return ['name', 'size', 'modified', 'category'].includes(normalized) ? normalized : 'modified';
}

function normalizeOrder(order) {
  const normalized = (order || 'desc').toString().toLowerCase();
  return normalized === 'asc' ? 'asc' : 'desc';
}

function compareFiles(a, b, sortBy, order) {
  let comparison = 0;

  switch (sortBy) {
    case 'name':
      comparison = a.name.localeCompare(b.name);
      break;
    case 'size':
      comparison = a.size - b.size;
      break;
    case 'category':
      comparison = a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
      break;
    case 'modified':
    default:
      comparison = new Date(a.modified).getTime() - new Date(b.modified).getTime();
      break;
  }

  return order === 'asc' ? comparison : -comparison;
}

export function startAPI(config) {
  const app = express();
  const sortedIndex = new Map();
  let indexInitialized = false;

  const duplicateCache = {
    value: null,
    expiresAt: 0
  };

  const sortedWatcher = chokidar.watch(config.sortedPath, {
    ignored: /(^|[\/\\])\../,
    ignoreInitial: true,
    persistent: true,
    awaitWriteFinish: {
      stabilityThreshold: 500,
      pollInterval: 50
    }
  });

  async function addToIndex(filePath) {
    try {
      const stats = await fs.promises.stat(filePath);
      if (!stats.isFile()) {
        return;
      }

      const relativePath = path.relative(config.sortedPath, filePath);
      const [category = 'other'] = relativePath.split(path.sep);
      const normalizedCategory = category || 'other';

      sortedIndex.set(filePath, {
        name: path.basename(filePath),
        path: filePath,
        category: normalizedCategory,
        size: stats.size,
        modified: stats.mtime
      });
    } catch {
      // File may not exist by the time we stat it.
    }
  }

  function removeFromIndex(filePath) {
    sortedIndex.delete(filePath);
  }

  async function rebuildIndex() {
    sortedIndex.clear();

    const categories = [...Object.keys(config.categories), 'other'];

    for (const category of categories) {
      const categoryPath = path.join(config.sortedPath, category);

      try {
        const entries = await fs.promises.readdir(categoryPath, { withFileTypes: true });

        for (const entry of entries) {
          if (!entry.isFile()) {
            continue;
          }

          const fullPath = path.join(categoryPath, entry.name);
          await addToIndex(fullPath);
        }
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.error(`Failed to index category ${category}:`, error.message);
        }
      }
    }

    indexInitialized = true;
  }

  function invalidateDuplicateCache() {
    duplicateCache.value = null;
    duplicateCache.expiresAt = 0;
  }

  function getIndexedFiles(category) {
    const allFiles = Array.from(sortedIndex.values());
    if (category && category !== 'all') {
      return allFiles.filter((file) => file.category === category);
    }
    return allFiles;
  }

  sortedWatcher.on('add', async (filePath) => {
    await addToIndex(filePath);
    invalidateDuplicateCache();
  });

  sortedWatcher.on('change', async (filePath) => {
    await addToIndex(filePath);
    invalidateDuplicateCache();
  });

  sortedWatcher.on('unlink', (filePath) => {
    removeFromIndex(filePath);
    invalidateDuplicateCache();
  });

  sortedWatcher.on('unlinkDir', () => {
    // Directory structure changed; easiest safe path is a rebuild.
    void rebuildIndex();
    invalidateDuplicateCache();
  });

  sortedWatcher.on('error', (error) => {
    console.error('Sorted directory watcher error:', error);
  });

  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(path.dirname(import.meta.url.replace('file://', '')), '..', 'public')));

  app.use((req, res, next) => {
    const startedAt = process.hrtime.bigint();

    res.on('finish', () => {
      const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      if (elapsedMs >= SLOW_ENDPOINT_THRESHOLD_MS) {
        console.log(`[slow-endpoint] ${req.method} ${req.originalUrl} - ${elapsedMs.toFixed(1)}ms`);
      }
    });

    next();
  });

  void rebuildIndex();

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

  // List sorted files (indexed + paginated)
  app.get('/api/files', async (req, res) => {
    try {
      if (!indexInitialized) {
        await rebuildIndex();
      }

      const category = req.query.category;
      const page = parsePositiveInt(req.query.page, 1);
      const requestedPageSize = parsePositiveInt(req.query.pageSize, DEFAULT_PAGE_SIZE);
      const pageSize = Math.min(requestedPageSize, MAX_PAGE_SIZE);
      const sortBy = normalizeSortBy(req.query.sortBy);
      const order = normalizeOrder(req.query.order);

      const files = getIndexedFiles(category)
        .sort((a, b) => compareFiles(a, b, sortBy, order));

      const total = files.length;
      const totalPages = Math.max(Math.ceil(total / pageSize), 1);
      const safePage = Math.min(page, totalPages);
      const start = (safePage - 1) * pageSize;
      const pagedFiles = files.slice(start, start + pageSize);

      res.json({
        files: pagedFiles,
        pagination: {
          page: safePage,
          pageSize,
          total,
          totalPages,
          sortBy,
          order
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Find duplicates (cached)
  app.get('/api/duplicates', async (req, res) => {
    try {
      const refresh = req.query.refresh === '1' || req.query.refresh === 'true';
      const now = Date.now();

      if (!refresh && duplicateCache.value && duplicateCache.expiresAt > now) {
        res.json({ duplicates: duplicateCache.value, cached: true, cachedUntil: duplicateCache.expiresAt });
        return;
      }

      const duplicates = await findDuplicates(config.sortedPath);
      duplicateCache.value = duplicates;
      duplicateCache.expiresAt = now + DUPLICATE_CACHE_TTL_MS;

      res.json({ duplicates, cached: false, cachedUntil: duplicateCache.expiresAt });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete a file
  app.delete('/api/files/:category/:filename', async (req, res) => {
    const { category, filename } = req.params;
    const filePath = path.join(config.sortedPath, category, filename);

    try {
      await fs.promises.unlink(filePath);
      removeFromIndex(filePath);
      invalidateDuplicateCache();
      res.json({ success: true, message: 'File deleted' });
    } catch (error) {
      if (error.code === 'ENOENT') {
        res.status(404).json({ error: 'File not found' });
        return;
      }

      res.status(500).json({ error: error.message });
    }
  });

  // Get history
  app.get('/api/history', (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 100;
    const history = getHistory(limit);
    res.json({ history });
  });

  // Get categories
  app.get('/api/categories', (req, res) => {
    res.json({ categories: Object.keys(config.categories) });
  });

  // Serve index.html for all other routes
  app.get('*', async (req, res) => {
    const indexPath = path.join(path.dirname(import.meta.url.replace('file://', '')), '..', 'public', 'index.html');

    try {
      await fs.promises.access(indexPath);
      res.sendFile(indexPath);
    } catch {
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

  app.listen(config.port, () => {
    console.log(`📡 API server running on http://localhost:${config.port}`);
  });

  return app;
}
