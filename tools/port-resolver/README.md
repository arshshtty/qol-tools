# Port Conflict Resolver

Scans for port conflicts, shows what's using each port, and provides quick management actions.

## Features

- 🔍 **Port scanning** - See all ports in use on your machine
- 📊 **Process details** - View which process is using each port
- ⚡ **Quick actions** - Kill or restart processes with one click
- 💾 **Port preferences** - Save and track your preferred port allocations
- 🎯 **Conflict detection** - Get alerted when ports conflict with your preferences
- 🌐 **Clean web UI** - Simple dashboard to manage everything

## How It Works

1. Scans your system for active network connections
2. Identifies processes and their port usage
3. Compares against your saved preferences
4. Provides quick actions to resolve conflicts

## Configuration

Edit `config.json` to customize:

```json
{
  "scanRanges": [
    { "start": 3000, "end": 9000 },
    { "start": 8080, "end": 8090 }
  ],
  "port": 3002,
  "refreshInterval": 5000
}
```

## Usage

```bash
cd tools/port-resolver
npm install
npm run dev
```

Then open the web UI at http://localhost:3002

## Port Preferences

Save your preferred port allocations:

```json
{
  "3000": {
    "name": "React Dev Server",
    "description": "Main frontend app",
    "command": "npm run dev"
  },
  "8080": {
    "name": "Backend API",
    "description": "Express API server"
  }
}
```

The tool will alert you if something else is using these ports.

## API Endpoints

- `GET /api/ports` - List all active ports and their processes
- `GET /api/scan` - Scan a specific port range
- `GET /api/conflicts` - Find ports conflicting with preferences
- `POST /api/kill/:pid` - Kill a process by PID
- `GET /api/preferences` - Get port preferences
- `POST /api/preferences` - Save port preferences

## Config Validation

- Configuration and port preferences are validated at load time with a schema (`zod`).
- If `config.json`, `preferences.json`, or `preferences.default.json` is invalid, the tool prints a human-readable error with file path + failing field path.
- On validation failure, the process exits with a non-zero status code.
- Validation includes:
  - all ports/range values are constrained to `1`-`65535`
  - `refreshInterval` must be greater than `0`
  - `scanRanges` must contain valid range objects with `end >= start`
  - preference keys must be numeric ports, and each preference object is validated field-by-field
