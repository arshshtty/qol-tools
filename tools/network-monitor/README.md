# Network Device Monitor

Monitor all devices on your local network with alerts for new devices.

## Features

- 🔍 **Device discovery** - Automatically scan your network for devices
- 📱 **Device tracking** - Track devices by IP, MAC, hostname
- 🏷️ **Vendor identification** - Identify device manufacturers from MAC addresses
- 🔔 **New device alerts** - Get notified when unknown devices join
- 📊 **Device history** - See first seen and last seen timestamps
- 🏠 **Device naming** - Give friendly names to your devices
- 🎨 **Clean dashboard** - Beautiful web interface to view all devices
- 📈 **Network statistics** - Total devices, online/offline status

## How It Works

1. Scans your local network using ARP and ping
2. Identifies devices by IP and MAC address
3. Looks up manufacturer info from MAC address
4. Tracks when devices first appeared and last seen
5. Alerts you when new devices join the network
6. Displays everything in a clean web dashboard

## Configuration

Edit `config.json` to customize:

```json
{
  "scanInterval": 30000,
  "scanTimeout": 5000,
  "port": 3004,
  "enableAlerts": true,
  "alertSound": true,
  "knownDevices": {}
}
```

## Usage

```bash
cd tools/network-monitor
npm install
npm run dev
```

Then open the web UI at http://localhost:3004

**Note:** On Linux/Mac, you may need to run with sudo for ARP scanning:
```bash
sudo npm run dev
```

## Device Management

**Name your devices:**
- Click on any device to give it a friendly name
- Names are saved and persist across scans

**Track device history:**
- See when devices first appeared
- Monitor when they were last seen online
- Identify devices that are currently active

**Get alerts:**
- Desktop notifications for new devices (if enabled)
- Visual indicators in the dashboard
- Sound alerts for new devices (configurable)

## API Endpoints

- `GET /api/devices` - List all discovered devices
- `GET /api/devices/online` - List only online devices
- `GET /api/scan` - Trigger a network scan
- `POST /api/devices/:mac/name` - Set device name
- `GET /api/stats` - Get network statistics
- `GET /api/alerts` - Get recent alerts

## Technical Details

**Device Discovery:**
- Uses ARP tables for local network devices
- Ping sweep for active devices
- DNS reverse lookup for hostnames
- MAC address vendor lookup (offline database)

**Supported Platforms:**
- Linux (arp, ping, ip commands)
- macOS (arp, ping commands)
- Windows (arp, ping commands)

## Privacy & Security

- **100% local** - No data sent to external servers
- **Network-only** - Stays within your local network
- **Read-only** - Only monitors, doesn't modify network
- **Secure** - All data stored locally

## Limitations

- Requires network access to scan devices
- May need elevated permissions (sudo/admin)
- Only scans local network (not internet)
- Bandwidth tracking not included (see alternatives for this)

## Use Cases

- **Home network monitoring** - See what's connected to your WiFi
- **Security** - Detect unknown devices
- **IoT management** - Track all your smart devices
- **Network troubleshooting** - Identify devices causing issues
- **Parental control** - See when kids' devices are online

## Future Features

- [ ] Bandwidth usage per device (requires packet capture)
- [ ] Port scanning per device
- [ ] Device grouping/categories
- [ ] Historical graphs
- [ ] Export device list
- [ ] Integration with router APIs
