import { exec } from 'child_process';
import { promisify } from 'util';
import { updateDevice } from './devices.js';
import { getVendor } from './mac-vendors.js';

const execAsync = promisify(exec);

let isScanning = false;
let lastScanTime = null;

export function startScanner(config) {
  // Initial scan
  scanNetwork(config);

  // Periodic scans
  setInterval(() => {
    scanNetwork(config);
  }, config.scanInterval);

  console.log('✅ Network scanner started');
}

export async function scanNetwork(config) {
  if (isScanning) {
    console.log('⏭️  Scan already in progress, skipping...');
    return [];
  }

  isScanning = true;
  console.log('🔍 Scanning network...');

  try {
    const devices = await getNetworkDevices(config);
    lastScanTime = new Date().toISOString();

    // Update device database
    devices.forEach(device => {
      updateDevice(device.mac, device);
    });

    console.log(`✓ Scan complete: Found ${devices.length} devices`);
    return devices;
  } catch (error) {
    console.error('Scan error:', error.message);
    return [];
  } finally {
    isScanning = false;
  }
}

async function getNetworkDevices(config) {
  const platform = process.platform;

  if (platform === 'linux') {
    return getDevicesLinux(config);
  } else if (platform === 'darwin') {
    return getDevicesMac(config);
  } else if (platform === 'win32') {
    return getDevicesWindows(config);
  } else {
    throw new Error(`Unsupported platform: ${platform}`);
  }
}

async function getDevicesLinux(config) {
  const devices = [];
  const seen = new Set();

  try {
    // Get devices from ARP table
    const { stdout: arpOutput } = await execAsync('arp -a 2>/dev/null || ip neigh show 2>/dev/null');
    const arpDevices = parseArpOutput(arpOutput);

    for (const device of arpDevices) {
      if (!seen.has(device.mac)) {
        seen.add(device.mac);

        // Try to get hostname
        try {
          const { stdout: hostname } = await execAsync(`host ${device.ip} 2>/dev/null || echo ""`);
          const hostnameMatch = hostname.match(/domain name pointer (.+)\./);
          if (hostnameMatch) {
            device.hostname = hostnameMatch[1];
          }
        } catch (e) {
          // Hostname lookup failed, continue
        }

        // Get vendor info
        device.vendor = getVendor(device.mac);

        devices.push(device);
      }
    }
  } catch (error) {
    console.error('Error scanning on Linux:', error.message);
  }

  return devices;
}

async function getDevicesMac(config) {
  const devices = [];
  const seen = new Set();

  try {
    // Get devices from ARP table
    const { stdout: arpOutput } = await execAsync('arp -a');
    const lines = arpOutput.split('\n');

    for (const line of lines) {
      // Parse: hostname (192.168.1.1) at aa:bb:cc:dd:ee:ff on en0 ifscope [ethernet]
      const match = line.match(/(\S+)\s+\(([0-9.]+)\)\s+at\s+([0-9a-f:]+)/i);

      if (match) {
        const [, hostname, ip, mac] = match;

        if (!seen.has(mac) && mac !== '(incomplete)') {
          seen.add(mac);

          devices.push({
            ip,
            mac: mac.toLowerCase(),
            hostname: hostname !== '?' ? hostname : null,
            vendor: getVendor(mac)
          });
        }
      }
    }
  } catch (error) {
    console.error('Error scanning on macOS:', error.message);
  }

  return devices;
}

async function getDevicesWindows(config) {
  const devices = [];
  const seen = new Set();

  try {
    // Get devices from ARP table
    const { stdout: arpOutput } = await execAsync('arp -a');
    const lines = arpOutput.split('\n');

    for (const line of lines) {
      // Parse: 192.168.1.1           aa-bb-cc-dd-ee-ff     dynamic
      const match = line.match(/([0-9.]+)\s+([0-9a-f-]+)\s+\w+/i);

      if (match) {
        const [, ip, mac] = match;
        const normalizedMac = mac.replace(/-/g, ':').toLowerCase();

        if (!seen.has(normalizedMac)) {
          seen.add(normalizedMac);

          // Try to get hostname
          let hostname = null;
          try {
            const { stdout } = await execAsync(`nslookup ${ip} 2>nul`);
            const hostnameMatch = stdout.match(/Name:\s+(.+)/);
            if (hostnameMatch) {
              hostname = hostnameMatch[1].trim();
            }
          } catch (e) {
            // Hostname lookup failed
          }

          devices.push({
            ip,
            mac: normalizedMac,
            hostname,
            vendor: getVendor(normalizedMac)
          });
        }
      }
    }
  } catch (error) {
    console.error('Error scanning on Windows:', error.message);
  }

  return devices;
}

function parseArpOutput(output) {
  const devices = [];
  const lines = output.split('\n');

  for (const line of lines) {
    // Try different ARP output formats

    // Format: hostname (192.168.1.1) at aa:bb:cc:dd:ee:ff [ether] on eth0
    let match = line.match(/(\S+)\s+\(([0-9.]+)\)\s+at\s+([0-9a-f:]+)/i);

    if (match) {
      const [, hostname, ip, mac] = match;
      devices.push({
        ip,
        mac: mac.toLowerCase(),
        hostname: hostname !== '?' ? hostname : null
      });
      continue;
    }

    // Format: 192.168.1.1 dev eth0 lladdr aa:bb:cc:dd:ee:ff REACHABLE
    match = line.match(/([0-9.]+)\s+dev\s+\S+\s+lladdr\s+([0-9a-f:]+)/i);

    if (match) {
      const [, ip, mac] = match;
      devices.push({
        ip,
        mac: mac.toLowerCase(),
        hostname: null
      });
    }
  }

  return devices;
}

export function getLastScanTime() {
  return lastScanTime;
}

export function isCurrentlyScanning() {
  return isScanning;
}
