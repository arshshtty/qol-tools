import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { scanRepositories, getBranches, deleteBranches, getRepoStatus } from './git.js';
import {
  createCorsMiddleware,
  createApiTokenMiddleware,
  createRateLimitMiddleware,
  sendError
} from '../../shared/security.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let cachedRepos = [];
let branchCache = new Map();

export function startAPI(config) {
  const app = express();
  const destructiveRateLimit = createRateLimitMiddleware();

  app.use(createCorsMiddleware(config.port));
  app.use(createApiTokenMiddleware());
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
      sendError(res, 500, 'repo_scan_failed', error.message);
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
      sendError(res, 500, 'branch_scan_failed', error.message);
    }
  });

  // Get branches for a specific repository
  app.get('/api/branches/:repoIndex', async (req, res) => {
    try {
      const repoIndex = Number.parseInt(req.params.repoIndex, 10);
      const repos = cachedRepos.length > 0 ? cachedRepos : await scanRepositories(config.scanPath);

      if (!Number.isInteger(repoIndex) || repoIndex < 0 || repoIndex >= repos.length) {
        return sendError(res, 404, 'repository_not_found', 'Repository not found');
      }

      const repo = repos[repoIndex];
      const branchData = await getBranches(repo, config);
      branchCache.set(repo, branchData);

      res.json(branchData);
    } catch (error) {
      sendError(res, 500, 'branch_scan_failed', error.message);
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
      sendError(res, 500, 'merged_branch_scan_failed', error.message);
    }
  });

  // Delete branches
  app.post('/api/delete', destructiveRateLimit, async (req, res) => {
    try {
      const { repoIndex, branches, force = false } = req.body;
      const repoIndexInt = Number.isInteger(repoIndex) ? repoIndex : Number.parseInt(repoIndex, 10);

      if (!Number.isInteger(repoIndexInt) || repoIndexInt < 0 || !branches || !Array.isArray(branches)) {
        return sendError(res, 400, 'invalid_request_body', 'repoIndex and branches[] are required');
      }

      const repos = cachedRepos.length > 0 ? cachedRepos : await scanRepositories(config.scanPath);

      if (repoIndexInt >= repos.length) {
        return sendError(res, 404, 'repository_not_found', 'Repository not found');
      }

      const repo = repos[repoIndexInt];

      // Check for protected branches
      const protectedAttempt = branches.filter(b => config.protectedBranches.includes(b));
      if (protectedAttempt.length > 0) {
        return sendError(
          res,
          400,
          'protected_branch_delete_denied',
          `Cannot delete protected branches: ${protectedAttempt.join(', ')}`
        );
      }

      const results = await deleteBranches(repo, branches, force);

      // Refresh branch cache
      const branchData = await getBranches(repo, config);
      branchCache.set(repo, branchData);

      res.json({ results });
    } catch (error) {
      sendError(res, 500, 'branch_delete_failed', error.message);
    }
  });

  // Get repository status
  app.get('/api/status/:repoIndex', async (req, res) => {
    try {
      const repoIndex = Number.parseInt(req.params.repoIndex, 10);
      const repos = cachedRepos.length > 0 ? cachedRepos : await scanRepositories(config.scanPath);

      if (!Number.isInteger(repoIndex) || repoIndex < 0 || repoIndex >= repos.length) {
        return sendError(res, 404, 'repository_not_found', 'Repository not found');
      }

      const repo = repos[repoIndex];
      const status = await getRepoStatus(repo);

      res.json(status);
    } catch (error) {
      sendError(res, 500, 'repo_status_failed', error.message);
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
      sendError(res, 500, 'refresh_failed', error.message);
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
