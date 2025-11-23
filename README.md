# QOL Tools

> Quality of Life tools for day-to-day development

A collection of lightweight, practical tools that solve common developer pain points. Each tool runs independently with its own web UI.

## 🛠️ Available Tools

### 1. Download Manager/Sorter
Automatically watches your Downloads folder and categorizes files by type.

**Features:**
- 📁 Auto-categorization by file type
- 🔍 Duplicate detection using SHA-256 hashing
- 🌐 Web UI to view sorted files
- 👀 Quick preview and delete interface
- 📊 Sorting history tracking

[**Documentation**](./tools/download-manager/README.md) • **Port:** 3001

---

### 2. Port Conflict Resolver
Scans for port conflicts and manages running services.

**Features:**
- 🔍 Real-time port scanning
- 📊 Process identification (what's using each port)
- ⚡ One-click kill process
- 💾 Save port preferences
- 🎯 Conflict detection and alerts
- 🌐 Clean dashboard interface

[**Documentation**](./tools/port-resolver/README.md) • **Port:** 3002

---

### 3. Git Branch Cleaner
Identify and clean up merged git branches across all your repositories.

**Features:**
- 🔍 Scan all local branches across multiple repos
- ✅ Detect which branches are fully merged
- 📅 Show last commit info (date, author, message)
- 🗑️ Bulk delete merged branches
- 🔒 Protect current branch and main/master
- ⚠️ Clear warnings for unmerged branches
- 🔄 Real-time refresh

[**Documentation**](./tools/git-branch-cleaner/README.md) • **Port:** 3003

---

### 4. Network Device Monitor
Monitor all devices on your local network with alerts for new devices.

**Features:**
- 🔍 Automatic device discovery (ARP scanning)
- 📱 Device tracking (IP, MAC, hostname, vendor)
- 🔔 New device alerts
- 🏷️ Custom device naming
- 📊 Online/offline status tracking
- 🎨 Clean visual dashboard
- 🔒 100% local and private

[**Documentation**](./tools/network-monitor/README.md) • **Port:** 3004

---

## 🚀 Quick Start

### Install Dependencies

```bash
# Install root dependencies
npm install

# Install all tool dependencies
cd tools/download-manager && npm install
cd ../port-resolver && npm install
cd ../git-branch-cleaner && npm install
cd ../network-monitor && npm install
```

### Run a Tool

**Download Manager:**
```bash
cd tools/download-manager
npm run dev
# Open http://localhost:3001
```

**Port Resolver:**
```bash
cd tools/port-resolver
npm run dev
# Open http://localhost:3002
```

**Git Branch Cleaner:**
```bash
cd tools/git-branch-cleaner
npm run dev
# Open http://localhost:3003
```

**Network Device Monitor:**
```bash
cd tools/network-monitor
npm run dev
# Open http://localhost:3004
# Note: May require sudo on Linux/Mac for ARP access
```

### Run Multiple Tools

Open separate terminals for each tool, or use a process manager like [PM2](https://pm2.keymetrics.io/):

```bash
# Install PM2 globally
npm install -g pm2

# Start all tools
pm2 start tools/download-manager/src/index.js --name download-manager
pm2 start tools/port-resolver/src/index.js --name port-resolver
pm2 start tools/git-branch-cleaner/src/index.js --name git-branch-cleaner
pm2 start tools/network-monitor/src/index.js --name network-monitor

# View logs
pm2 logs

# Stop all
pm2 stop all
```

## 📋 Project Structure

```
qol-tools/
├── tools/
│   ├── download-manager/     # File sorting and organization
│   │   ├── src/              # Backend logic
│   │   ├── public/           # Web UI
│   │   └── package.json
│   │
│   ├── port-resolver/        # Port conflict management
│   │   ├── src/              # Backend logic
│   │   ├── public/           # Web UI
│   │   └── package.json
│   │
│   ├── git-branch-cleaner/   # Git branch cleanup
│   │   ├── src/              # Backend logic
│   │   ├── public/           # Web UI
│   │   └── package.json
│   │
│   └── network-monitor/      # Network device monitoring
│       ├── src/              # Backend logic
│       ├── public/           # Web UI
│       └── package.json
│
├── ALTERNATIVES.md           # Tools we won't build (existing alternatives)
├── package.json             # Root package configuration
└── README.md
```

## 🎯 Philosophy

These tools are built on three principles:

1. **Solve Real Problems** - Each tool addresses an actual pain point
2. **Keep It Simple** - No over-engineering, just focused solutions
3. **Avoid Reinventing** - Don't build what already exists (see [ALTERNATIVES.md](./ALTERNATIVES.md))

## 🔧 Tech Stack

- **Backend:** Node.js with ES modules
- **Frontend:** Vanilla JavaScript (no framework overhead)
- **File Watching:** chokidar
- **APIs:** Express with CORS
- **Styling:** Modern CSS (no preprocessors)

## 🤝 Contributing

Got an idea for a new QOL tool? Great! But first:

1. **Check [ALTERNATIVES.md](./ALTERNATIVES.md)** - Make sure there isn't already a great solution
2. **Solve your own pain point** - Best tools come from real needs
3. **Keep it focused** - One tool, one job
4. **Follow the structure** - Use the existing tools as templates

### Adding a New Tool

1. Create a new directory in `tools/`
2. Follow the structure of existing tools
3. Include a detailed README
4. Add configuration examples
5. Build a simple web UI
6. Update this README

## 📝 Configuration

Each tool has its own configuration file:

- **Download Manager:** `tools/download-manager/config.json`
- **Port Resolver:** `tools/port-resolver/config.json`
- **Git Branch Cleaner:** `tools/git-branch-cleaner/config.json`
- **Network Device Monitor:** `tools/network-monitor/config.json`

Copy `config.default.json` to `config.json` and customize.

## 🐛 Troubleshooting

### Download Manager

**Files aren't being sorted:**
- Check that the watch path exists and is readable
- Ensure the sorted path has write permissions
- Check the file extension is in your categories configuration

**Duplicate detection not working:**
- Ensure `duplicateCheckEnabled: true` in config
- Large files may take time to hash

### Port Resolver

**No ports showing up:**
- On Linux/Mac: ensure you have `lsof` or `netstat` installed
- On Windows: `netstat` should be available by default
- You may need elevated permissions to see all processes

**Can't kill process:**
- You may need elevated permissions (run as admin/sudo)
- Some system processes can't be killed

**Port scanning is slow:**
- Increase `refreshInterval` in config
- Reduce scan ranges to only ports you care about

### Git Branch Cleaner

**No repositories found:**
- Check that `scanPath` points to a directory containing git repos
- The tool scans up to 3 levels deep
- Ensure directories are readable

**Can't delete branches:**
- Ensure you're not on the branch you're trying to delete
- Check if the branch is protected in config
- You may need to force delete unmerged branches

**Branch status incorrect:**
- Click Refresh to update branch information
- Ensure your base branches (main/master) are configured correctly
- Check that the repository is in a clean state

### Network Device Monitor

**No devices showing up:**
- Run with sudo on Linux/Mac for full ARP access
- Ensure you're on the same network as the devices
- Check firewall settings aren't blocking network scans
- Some devices may not respond to ARP requests

**Devices showing as offline:**
- Devices are marked offline after 5 minutes of inactivity
- Some devices sleep and may not respond immediately
- Click "Scan Network" to force a refresh

**New device alerts not working:**
- Check that `enableAlerts` is true in config
- Browser notifications may need permission
- Clear alerts to reset new device flags

## 📜 License

MIT

## 🙏 Acknowledgments

Built out of frustration with scattered tools and cluttered workflows. Sometimes the best tool is the one you build yourself.

---

**Need help?** Open an issue or check the individual tool READMEs for more details.
