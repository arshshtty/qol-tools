import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

let cachedPorts = [];
let isScanning = false;

export async function scanPorts() {
  if (isScanning) {
    return cachedPorts;
  }

  isScanning = true;

  try {
    const ports = await getPorts();
    cachedPorts = ports;
    return ports;
  } catch (error) {
    console.error('Error scanning ports:', error.message);
    return cachedPorts;
  } finally {
    isScanning = false;
  }
}

async function getPorts() {
  const platform = process.platform;

  if (platform === 'linux' || platform === 'darwin') {
    return getPortsUnix();
  } else if (platform === 'win32') {
    return getPortsWindows();
  } else {
    throw new Error(`Unsupported platform: ${platform}`);
  }
}

async function getPortsUnix() {
  try {
    // Try lsof first (more detailed)
    const { stdout } = await execAsync('lsof -iTCP -sTCP:LISTEN -n -P 2>/dev/null || netstat -tlnp 2>/dev/null || ss -tlnp 2>/dev/null');
    return parseUnixOutput(stdout);
  } catch (error) {
    console.error('Error running lsof/netstat:', error.message);
    return [];
  }
}

function parseUnixOutput(output) {
  const lines = output.split('\n');
  const ports = [];
  const seen = new Set();

  for (const line of lines) {
    if (!line || line.startsWith('COMMAND') || line.startsWith('Proto')) continue;

    // Parse lsof output
    const lsofMatch = line.match(/^(\S+)\s+(\d+)\s+(\S+).*:(\d+)\s+\(LISTEN\)/);
    if (lsofMatch) {
      const [, command, pid, user, port] = lsofMatch;
      const key = `${port}-${pid}`;

      if (!seen.has(key)) {
        seen.add(key);
        ports.push({
          port: parseInt(port),
          pid: parseInt(pid),
          process: command,
          user,
          protocol: 'TCP',
          state: 'LISTEN'
        });
      }
      continue;
    }

    // Parse netstat output
    const netstatMatch = line.match(/tcp\s+\d+\s+\d+\s+[\d.]+:(\d+)\s+.*LISTEN\s+(\d+)\/(\S+)/);
    if (netstatMatch) {
      const [, port, pid, process] = netstatMatch;
      const key = `${port}-${pid}`;

      if (!seen.has(key)) {
        seen.add(key);
        ports.push({
          port: parseInt(port),
          pid: parseInt(pid),
          process,
          protocol: 'TCP',
          state: 'LISTEN'
        });
      }
      continue;
    }

    // Parse ss output
    const ssMatch = line.match(/LISTEN\s+\d+\s+\d+\s+[\d.*]+:(\d+)\s+.*users:\(\("([^"]+)",pid=(\d+)/);
    if (ssMatch) {
      const [, port, process, pid] = ssMatch;
      const key = `${port}-${pid}`;

      if (!seen.has(key)) {
        seen.add(key);
        ports.push({
          port: parseInt(port),
          pid: parseInt(pid),
          process,
          protocol: 'TCP',
          state: 'LISTEN'
        });
      }
    }
  }

  return ports.sort((a, b) => a.port - b.port);
}

async function getPortsWindows() {
  try {
    const { stdout } = await execAsync('netstat -ano | findstr LISTENING');
    return parseWindowsOutput(stdout);
  } catch (error) {
    console.error('Error running netstat:', error.message);
    return [];
  }
}

function parseWindowsOutput(output) {
  const lines = output.split('\n');
  const ports = [];
  const seen = new Set();

  for (const line of lines) {
    const match = line.match(/TCP\s+[\d.]+:(\d+)\s+.*LISTENING\s+(\d+)/);
    if (match) {
      const [, port, pid] = match;
      const key = `${port}-${pid}`;

      if (!seen.has(key)) {
        seen.add(key);
        ports.push({
          port: parseInt(port),
          pid: parseInt(pid),
          process: 'Unknown',
          protocol: 'TCP',
          state: 'LISTENING'
        });
      }
    }
  }

  return ports.sort((a, b) => a.port - b.port);
}

export async function killProcess(pid) {
  const platform = process.platform;

  try {
    if (platform === 'win32') {
      await execAsync(`taskkill /PID ${pid} /F`);
    } else {
      await execAsync(`kill -9 ${pid}`);
    }
    return { success: true, message: `Process ${pid} killed` };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export function getCachedPorts() {
  return cachedPorts;
}

export function startScanner(config) {
  // Initial scan
  scanPorts();

  // Periodic scans
  setInterval(() => {
    scanPorts();
  }, config.refreshInterval);

  console.log('🔄 Port scanner started');
}
