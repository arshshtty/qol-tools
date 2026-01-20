import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEVICES_FILE = path.join(__dirname, '..', 'devices.json');

let knownDevices = {};
let recentAlerts = [];

export function loadDevices() {
  try {
    if (fs.existsSync(DEVICES_FILE)) {
      const data = JSON.parse(fs.readFileSync(DEVICES_FILE, 'utf8'));
      knownDevices = data.devices || {};
      console.log(`📋 Loaded ${Object.keys(knownDevices).length} known devices`);
    }
  } catch (error) {
    console.error('Error loading devices:', error.message);
    knownDevices = {};
  }
}

export function saveDevices() {
  try {
    fs.writeFileSync(DEVICES_FILE, JSON.stringify({
      devices: knownDevices,
      lastSaved: new Date().toISOString()
    }, null, 2));
  } catch (error) {
    console.error('Error saving devices:', error.message);
  }
}

export function updateDevice(mac, deviceInfo) {
  const now = new Date().toISOString();

  if (!knownDevices[mac]) {
    // New device discovered
    knownDevices[mac] = {
      mac,
      ...deviceInfo,
      firstSeen: now,
      lastSeen: now,
      isNew: true
    };

    // Add to alerts
    recentAlerts.unshift({
      type: 'new_device',
      device: knownDevices[mac],
      timestamp: now
    });

    // Keep only last 50 alerts
    if (recentAlerts.length > 50) {
      recentAlerts = recentAlerts.slice(0, 50);
    }

    console.log(`🆕 New device detected: ${deviceInfo.ip} (${mac})`);
  } else {
    // Update existing device
    knownDevices[mac] = {
      ...knownDevices[mac],
      ...deviceInfo,
      lastSeen: now,
      isNew: false
    };
  }

  saveDevices();
  return knownDevices[mac];
}

export function getDevice(mac) {
  return knownDevices[mac];
}

export function getAllDevices() {
  return Object.values(knownDevices);
}

export function getOnlineDevices(timeoutMinutes = 5) {
  const cutoff = Date.now() - (timeoutMinutes * 60 * 1000);

  return Object.values(knownDevices).filter(device => {
    const lastSeen = new Date(device.lastSeen).getTime();
    return lastSeen > cutoff;
  });
}

export function setDeviceName(mac, name) {
  if (knownDevices[mac]) {
    knownDevices[mac].customName = name;
    saveDevices();
    return true;
  }
  return false;
}

export function getAlerts(limit = 20) {
  return recentAlerts.slice(0, limit);
}

export function clearNewFlags() {
  Object.values(knownDevices).forEach(device => {
    device.isNew = false;
  });
  saveDevices();
}

export function getStats() {
  const total = Object.keys(knownDevices).length;
  const online = getOnlineDevices().length;
  const offline = total - online;
  const newDevices = Object.values(knownDevices).filter(d => d.isNew).length;

  return {
    total,
    online,
    offline,
    new: newDevices,
    recentAlerts: recentAlerts.length
  };
}
