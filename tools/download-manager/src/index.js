import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { startWatcher } from './watcher.js';
import { startAPI } from './api.js';
import { loadConfig } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('🚀 Starting Download Manager...\n');

  // Load configuration
  const config = loadConfig();

  // Ensure directories exist
  if (!fs.existsSync(config.watchPath)) {
    fs.mkdirSync(config.watchPath, { recursive: true });
    console.log(`📁 Created watch directory: ${config.watchPath}`);
  }

  if (!fs.existsSync(config.sortedPath)) {
    fs.mkdirSync(config.sortedPath, { recursive: true });
    console.log(`📁 Created sorted directory: ${config.sortedPath}`);
  }

  // Create category directories
  for (const category of Object.keys(config.categories)) {
    const categoryPath = path.join(config.sortedPath, category);
    if (!fs.existsSync(categoryPath)) {
      fs.mkdirSync(categoryPath, { recursive: true });
    }
  }

  // Start file watcher
  console.log(`\n👀 Watching: ${config.watchPath}`);
  console.log(`📦 Sorting to: ${config.sortedPath}\n`);
  startWatcher(config);

  // Start API server
  startAPI(config);

  console.log(`✅ Download Manager is running!`);
  console.log(`🌐 Web UI: http://localhost:${config.port}\n`);
}

main().catch(console.error);
