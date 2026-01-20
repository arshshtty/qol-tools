# Tools We Won't Build (Alternatives Exist)

This document tracks tool ideas that have excellent existing alternatives. Before implementing any new tool, check this list to avoid reinventing the wheel.

## Git Commit Browser
**Why not build:** Existing tools are mature and feature-rich.

**Alternatives:**
- **GitKraken** - Full-featured Git GUI with cross-repo search
- **Tower** - Clean Git client for Mac/Windows
- **git log with aliases** - `git log --all --graph --decorate --oneline`
- **tig** - Text-mode interface for Git
- **LazyGit** - Terminal UI for Git commands

**What would make this worth building:**
- Significantly faster cross-repo search than existing tools
- Unique insight features (like commit pattern analysis)

---

## Docker Container Dashboard
**Why not build:** Several excellent alternatives exist.

**Alternatives:**
- **Lazydocker** - Terminal UI for Docker, very fast and clean
- **Dockge** - Clean web UI alternative to Portainer
- **Portainer** - Full-featured Docker management
- **ctop** - Top-like interface for containers

**What would make this worth building:**
- Faster than Lazydocker with better UX than Dockge
- Specific workflow optimizations for your use case

---

## Local API Testing Tool
**Why not build:** Extremely crowded space with mature options.

**Alternatives:**
- **Postman** - Industry standard, feature-rich
- **Insomnia** - Cleaner, simpler alternative to Postman
- **Bruno** - Offline-first, Git-friendly API client
- **HTTPie Desktop** - Beautiful API testing with CLI integration
- **Hoppscotch** - Open-source, web-based alternative
- **curl with aliases** - For simple use cases

**What would make this worth building:**
- Project-aware auto-discovery of endpoints
- Tighter IDE integration than existing tools

---

## Dotfiles Sync Manager
**Why not build:** Well-solved problem with battle-tested tools.

**Alternatives:**
- **Chezmoi** - Powerful dotfile manager with templating
- **yadm** - Yet Another Dotfiles Manager
- **GNU Stow** - Symlink farm manager
- **Bare Git repo method** - Simple and effective
- **Mackup** - Backup and sync tool for application settings

**What would make this worth building:**
- Visual diff UI significantly better than `chezmoi diff`
- Machine-specific configuration management beyond templating

---

## Network Device Monitor
**Status:** ✅ **BUILT** - See `tools/network-monitor/`

**Why we built it:**
- Fing's best features are behind a paywall
- Privacy-focused: 100% local, no data sent to external servers
- Open-source alternative to commercial tools
- Simple device discovery without the complexity of Wireshark
- Cross-platform support (Linux, macOS, Windows)

**Alternatives (if you need more features):**
- **Fing** - Comprehensive network scanner (many features paid)
- **Angry IP Scanner** - Fast network scanner
- **Wireshark** - Deep packet inspection (complex)
- **nethogs** - Per-process bandwidth monitor (Linux only)
- **Little Snitch** - Network monitor (macOS only, expensive)

**Our implementation focuses on:**
- Device discovery and tracking
- New device alerts
- Custom device naming
- Clean web interface
- Zero cost, full features

**Note:** We intentionally skipped bandwidth tracking as it requires deep packet inspection and elevated permissions. Use nethogs, iftop, or router-based solutions for bandwidth monitoring.

---

## Bookmark Manager
**Why not build:** Many excellent options with strong communities.

**Alternatives:**
- **Raindrop.io** - Beautiful, feature-rich bookmarking
- **Linkding** - Self-hosted, minimalist bookmark manager
- **Wallabag** - Read-it-later with local archiving
- **Shiori** - Simple self-hosted bookmark manager
- **Pocket** - Popular read-it-later service

**What would make this worth building:**
- Unique search/discovery features
- Integration with your specific workflow not available elsewhere

---

## Server Health Monitor
**Why not build:** Monitoring is a solved problem with excellent tools.

**Alternatives:**
- **Netdata** - Real-time performance monitoring, beautiful UI
- **Glances** - Cross-platform system monitoring tool
- **htop** / **btop** - Enhanced top alternatives
- **Prometheus + Grafana** - Industry-standard monitoring stack
- **Cockpit** - Web-based server administration

**What would make this worth building:**
- Simpler than Netdata for basic home server use
- Specific alerts/actions not available in existing tools

---

## General Principle

Before building any tool, ask:
1. What existing alternatives exist?
2. What specific problem do they not solve?
3. Is the gap big enough to justify a new tool?

Build when you have a unique insight or specific need, not just because you can.
