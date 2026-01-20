import { loadConfig } from './config.js';
import { startAPI } from './api.js';
import { startScanner } from './scanner.js';
import { loadDevices } from './devices.js';

async function main() {
  console.log('📡 Starting Network Device Monitor...\n');

  // Load configuration
  const config = loadConfig();

  console.log('⚙️  Configuration loaded');
  console.log(`🔄 Scan interval: ${config.scanInterval}ms`);
  console.log(`🔔 Alerts: ${config.enableAlerts ? 'enabled' : 'disabled'}\n`);

  // Load known devices
  loadDevices();

  // Start network scanner
  if (config.autoScan) {
    console.log('🔍 Starting network scanner...');
    startScanner(config);
  }

  // Start API server
  startAPI(config);

  console.log(`✅ Network Device Monitor is running!`);
  console.log(`🌐 Web UI: http://localhost:${config.port}\n`);

  if (process.platform !== 'win32') {
    console.log('💡 Tip: For best results, run with sudo for full ARP access');
  }
}

main().catch(console.error);
