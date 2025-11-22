import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { scanRepositories, getBranches, deleteBranches, getRepoStatus } from './git.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let cachedRepos = [];
let branchCache = new Map();

export function startAPI(config) {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // Get all repositories
  app.get('/api/repos', async (req, res) => {
    try {
      const repos = await scanRepositories(config.scanPath);
      cachedRepos = repos;

      res.json({
        repos: repos.map(r => ({
          path: r,
          name: path.basename(r)
        }))
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all branches across all repos
  app.get('/api/branches', async (req, res) => {
    try {
      const repos = cachedRepos.length > 0 ? cachedRepos : await scanRepositories(config.scanPath);
      const allBranches = [];

      for (const repo of repos) {
        const branchData = await getBranches(repo, config);
        allBranches.push(branchData);
        branchCache.set(repo, branchData);
      }

      res.json({ repositories: allBranches });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get branches for a specific repository
  app.get('/api/branches/:repoIndex', async (req, res) => {
    try {
      const repoIndex = parseInt(req.params.repoIndex);
      const repos = cachedRepos.length > 0 ? cachedRepos : await scanRepositories(config.scanPath);

      if (repoIndex < 0 || repoIndex >= repos.length) {
        return res.status(404).json({ error: 'Repository not found' });
      }

      const repo = repos[repoIndex];
      const branchData = await getBranches(repo, config);
      branchCache.set(repo, branchData);

      res.json(branchData);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get only merged branches
  app.get('/api/branches/merged', async (req, res) => {
    try {
      const repos = cachedRepos.length > 0 ? cachedRepos : await scanRepositories(config.scanPath);
      const mergedBranches = [];

      for (const repo of repos) {
        const branchData = await getBranches(repo, config);
        const merged = branchData.branches.filter(b => b.merged && !b.protected);

        if (merged.length > 0) {
          mergedBranches.push({
            ...branchData,
            branches: merged
          });
        }
      }

      res.json({ repositories: mergedBranches });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete branches
  app.post('/api/delete', async (req, res) => {
    try {
      const { repoIndex, branches, force = false } = req.body;

      if (repoIndex === undefined || !branches || !Array.isArray(branches)) {
        return res.status(400).json({ error: 'Invalid request body' });
      }

      const repos = cachedRepos.length > 0 ? cachedRepos : await scanRepositories(config.scanPath);

      if (repoIndex < 0 || repoIndex >= repos.length) {
        return res.status(404).json({ error: 'Repository not found' });
      }

      const repo = repos[repoIndex];

      // Check for protected branches
      const protectedAttempt = branches.filter(b => config.protectedBranches.includes(b));
      if (protectedAttempt.length > 0) {
        return res.status(400).json({
          error: `Cannot delete protected branches: ${protectedAttempt.join(', ')}`
        });
      }

      const results = await deleteBranches(repo, branches, force);

      // Refresh branch cache
      const branchData = await getBranches(repo, config);
      branchCache.set(repo, branchData);

      res.json({ results });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get repository status
  app.get('/api/status/:repoIndex', async (req, res) => {
    try {
      const repoIndex = parseInt(req.params.repoIndex);
      const repos = cachedRepos.length > 0 ? cachedRepos : await scanRepositories(config.scanPath);

      if (repoIndex < 0 || repoIndex >= repos.length) {
        return res.status(404).json({ error: 'Repository not found' });
      }

      const repo = repos[repoIndex];
      const status = await getRepoStatus(repo);

      res.json(status);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Force refresh
  app.post('/api/refresh', async (req, res) => {
    try {
      branchCache.clear();
      cachedRepos = [];

      const repos = await scanRepositories(config.scanPath);
      cachedRepos = repos;

      res.json({ success: true, message: 'Cache refreshed', repoCount: repos.length });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get configuration
  app.get('/api/config', (req, res) => {
    res.json({
      scanPath: config.scanPath,
      baseBranches: config.baseBranches,
      protectedBranches: config.protectedBranches,
      showUnmerged: config.showUnmerged
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
            <title>Git Branch Cleaner</title>
          </head>
          <body>
            <h1>Git Branch Cleaner API</h1>
            <p>Web UI coming soon. API is running at port ${config.port}</p>
            <h2>Endpoints:</h2>
            <ul>
              <li>GET /api/repos</li>
              <li>GET /api/branches</li>
              <li>GET /api/branches/:repoIndex</li>
              <li>GET /api/branches/merged</li>
              <li>POST /api/delete</li>
              <li>GET /api/status/:repoIndex</li>
              <li>POST /api/refresh</li>
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
