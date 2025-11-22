import chokidar from 'chokidar';
import fs from 'fs';
import path from 'path';
import { categorizeFile, shouldIgnoreFile } from './categorizer.js';
import { addHistoryEntry } from './history.js';
import { calculateFileHash } from './duplicateDetector.js';

let fileStats = {
  totalSorted: 0,
  byCategory: {}
};

export function startWatcher(config) {
  const watcher = chokidar.watch(config.watchPath, {
    ignored: /(^|[\/\\])\../,  // ignore dotfiles
    persistent: true,
    ignoreInitial: false,
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100
    }
  });

  watcher.on('add', async (filePath) => {
    const filename = path.basename(filePath);

    // Skip if file is in the sorted directory
    if (filePath.startsWith(config.sortedPath)) {
      return;
    }

    // Skip ignored extensions
    if (shouldIgnoreFile(filename, config.ignoredExtensions)) {
      return;
    }

    // Categorize and move
    const category = categorizeFile(filename, config.categories);
    const destDir = path.join(config.sortedPath, category);
    const destPath = path.join(destDir, filename);

    try {
      // Ensure destination directory exists
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      // Handle duplicate filenames
      let finalDestPath = destPath;
      let counter = 1;
      while (fs.existsSync(finalDestPath)) {
        const ext = path.extname(filename);
        const base = path.basename(filename, ext);
        finalDestPath = path.join(destDir, `${base}_${counter}${ext}`);
        counter++;
      }

      // Calculate hash if duplicate detection is enabled
      let fileHash = null;
      if (config.duplicateCheckEnabled) {
        try {
          fileHash = await calculateFileHash(filePath);
        } catch (error) {
          console.error(`Error hashing file: ${error.message}`);
        }
      }

      // Move file
      fs.renameSync(filePath, finalDestPath);

      // Update stats
      fileStats.totalSorted++;
      fileStats.byCategory[category] = (fileStats.byCategory[category] || 0) + 1;

      // Add to history
      const stats = fs.statSync(finalDestPath);
      addHistoryEntry({
        filename,
        originalPath: filePath,
        sortedPath: finalDestPath,
        category,
        size: stats.size,
        hash: fileHash
      });

      console.log(`✓ ${filename} → ${category}/`);
    } catch (error) {
      console.error(`✗ Error sorting ${filename}:`, error.message);
    }
  });

  watcher.on('error', error => {
    console.error('Watcher error:', error);
  });

  return watcher;
}

export function getStats() {
  return fileStats;
}
