import fs from 'fs';
import crypto from 'crypto';
import path from 'path';

export function calculateFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('data', data => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

export async function findDuplicates(sortedPath) {
  const fileMap = new Map(); // hash -> [file paths]
  const duplicates = [];

  async function scanDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await scanDirectory(fullPath);
      } else if (entry.isFile()) {
        try {
          const hash = await calculateFileHash(fullPath);

          if (fileMap.has(hash)) {
            fileMap.get(hash).push(fullPath);
          } else {
            fileMap.set(hash, [fullPath]);
          }
        } catch (error) {
          console.error(`Error hashing ${fullPath}:`, error.message);
        }
      }
    }
  }

  await scanDirectory(sortedPath);

  // Find duplicates (hashes with multiple files)
  for (const [hash, files] of fileMap.entries()) {
    if (files.length > 1) {
      const stats = fs.statSync(files[0]);
      duplicates.push({
        hash,
        files,
        size: stats.size,
        count: files.length
      });
    }
  }

  return duplicates;
}
