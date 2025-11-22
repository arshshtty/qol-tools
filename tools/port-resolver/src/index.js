import { loadConfig } from './config.js';
import { startAPI } from './api.js';
import { startScanner } from './scanner.js';

async function main() {
  console.log('🔍 Starting Port Resolver...\n');

  // Load configuration
  const config = loadConfig();

  console.log('⚙️  Configuration loaded');
  console.log(`📡 Scan ranges: ${config.scanRanges.length} configured`);
  console.log(`🔄 Refresh interval: ${config.refreshInterval}ms\n`);

  // Start background scanner
  startScanner(config);

  // Start API server
  startAPI(config);

  console.log(`✅ Port Resolver is running!`);
  console.log(`🌐 Web UI: http://localhost:${config.port}\n`);
}

main().catch(console.error);
