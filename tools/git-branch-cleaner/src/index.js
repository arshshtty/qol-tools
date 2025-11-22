import { loadConfig } from './config.js';
import { startAPI } from './api.js';
import { scanRepositories } from './git.js';

async function main() {
  console.log('🌿 Starting Git Branch Cleaner...\n');

  // Load configuration
  const config = loadConfig();

  console.log('⚙️  Configuration loaded');
  console.log(`📂 Scan path: ${config.scanPath}`);
  console.log(`🔒 Protected branches: ${config.protectedBranches.join(', ')}`);
  console.log(`🎯 Base branches: ${config.baseBranches.join(', ')}\n`);

  // Initial repository scan
  console.log('🔍 Scanning for git repositories...');
  const repos = await scanRepositories(config.scanPath);
  console.log(`✓ Found ${repos.length} git repositories\n`);

  // Start API server
  startAPI(config);

  console.log(`✅ Git Branch Cleaner is running!`);
  console.log(`🌐 Web UI: http://localhost:${config.port}\n`);
}

main().catch(console.error);
