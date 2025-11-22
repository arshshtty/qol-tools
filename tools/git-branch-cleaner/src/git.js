import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

// Find all git repositories in a directory
export async function scanRepositories(scanPath) {
  const repos = [];

  async function findGitRepos(dir, depth = 0) {
    if (depth > 3) return; // Limit recursion depth

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      // Check if current directory is a git repo
      if (entries.some(e => e.isDirectory() && e.name === '.git')) {
        repos.push(dir);
        return; // Don't search inside git repos
      }

      // Search subdirectories
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
          const fullPath = path.join(dir, entry.name);
          await findGitRepos(fullPath, depth + 1);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }

  await findGitRepos(scanPath);
  return repos;
}

// Get all branches for a repository
export async function getBranches(repoPath, config) {
  try {
    const { stdout: currentBranch } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: repoPath });
    const current = currentBranch.trim();

    // Get all local branches
    const { stdout } = await execAsync('git branch --format="%(refname:short)|%(committerdate:iso8601)|%(committername)|%(subject)"', { cwd: repoPath });

    const branches = [];
    const lines = stdout.trim().split('\n');

    for (const line of lines) {
      const [name, date, author, subject] = line.split('|');

      if (!name) continue;

      // Check if branch is merged
      const isMerged = await checkIfMerged(repoPath, name, config.baseBranches);

      // Check if protected
      const isProtected = config.protectedBranches.includes(name) || name === current;

      // Get commit count ahead/behind
      const { ahead, behind } = await getAheadBehind(repoPath, name, config.baseBranches);

      branches.push({
        name,
        current: name === current,
        merged: isMerged,
        protected: isProtected,
        lastCommit: {
          date,
          author,
          subject
        },
        ahead,
        behind
      });
    }

    return {
      repoPath,
      repoName: path.basename(repoPath),
      currentBranch: current,
      branches
    };
  } catch (error) {
    console.error(`Error getting branches for ${repoPath}:`, error.message);
    return {
      repoPath,
      repoName: path.basename(repoPath),
      currentBranch: 'unknown',
      branches: [],
      error: error.message
    };
  }
}

// Check if a branch is merged into any base branch
async function checkIfMerged(repoPath, branchName, baseBranches) {
  for (const baseBranch of baseBranches) {
    try {
      // Check if base branch exists
      await execAsync(`git rev-parse --verify ${baseBranch}`, { cwd: repoPath });

      // Check if branch is merged
      const { stdout } = await execAsync(`git branch --merged ${baseBranch}`, { cwd: repoPath });
      const mergedBranches = stdout.split('\n').map(b => b.trim().replace(/^\* /, ''));

      if (mergedBranches.includes(branchName)) {
        return true;
      }
    } catch (error) {
      // Base branch doesn't exist or other error, continue
      continue;
    }
  }

  return false;
}

// Get how many commits ahead/behind a branch is
async function getAheadBehind(repoPath, branchName, baseBranches) {
  for (const baseBranch of baseBranches) {
    try {
      await execAsync(`git rev-parse --verify ${baseBranch}`, { cwd: repoPath });

      const { stdout } = await execAsync(
        `git rev-list --left-right --count ${baseBranch}...${branchName}`,
        { cwd: repoPath }
      );

      const [behind, ahead] = stdout.trim().split('\t').map(Number);
      return { ahead, behind };
    } catch (error) {
      continue;
    }
  }

  return { ahead: 0, behind: 0 };
}

// Delete branches
export async function deleteBranches(repoPath, branchNames, force = false) {
  const results = [];

  for (const branchName of branchNames) {
    try {
      const flag = force ? '-D' : '-d';
      await execAsync(`git branch ${flag} "${branchName}"`, { cwd: repoPath });

      results.push({
        branch: branchName,
        success: true,
        message: 'Deleted successfully'
      });
    } catch (error) {
      results.push({
        branch: branchName,
        success: false,
        message: error.message
      });
    }
  }

  return results;
}

// Get repository status
export async function getRepoStatus(repoPath) {
  try {
    const { stdout: statusOut } = await execAsync('git status --porcelain', { cwd: repoPath });
    const { stdout: currentBranch } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: repoPath });

    const hasChanges = statusOut.trim().length > 0;

    return {
      repoPath,
      repoName: path.basename(repoPath),
      currentBranch: currentBranch.trim(),
      hasUncommittedChanges: hasChanges,
      clean: !hasChanges
    };
  } catch (error) {
    return {
      repoPath,
      repoName: path.basename(repoPath),
      error: error.message
    };
  }
}
