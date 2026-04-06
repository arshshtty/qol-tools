#!/bin/bash

set -euo pipefail

echo "🛠️  QOL Tools Setup"
echo "=================="
echo ""

# Check Node.js
if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js is not installed. Please install Node.js first."
  exit 1
fi

echo "✓ Node.js version: $(node --version)"

# Check Corepack
if ! command -v corepack >/dev/null 2>&1; then
  echo "❌ Corepack is not available."
  echo "   Please install Node.js 16.10+ (Corepack included) or reinstall your Node distribution with Corepack."
  exit 1
fi

echo "✓ Corepack version: $(corepack --version)"
echo ""

echo "🔧 Enabling Corepack..."
corepack enable

echo "📦 Installing pnpm via Corepack..."
corepack prepare pnpm@latest --activate

echo "📦 Installing workspace dependencies (all tools)..."
pnpm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 Quick Start:"
echo ""
echo "  Run all tools in parallel:"
echo "    pnpm -r run dev"
echo ""
echo "  Run a specific tool:"
echo "    pnpm --filter download-manager run dev  # http://localhost:3001"
echo "    pnpm --filter port-resolver run dev     # http://localhost:3002"
echo "    pnpm --filter git-branch-cleaner run dev # http://localhost:3003"
echo "    pnpm --filter network-monitor run dev   # http://localhost:3004"
echo ""
echo "📖 See README.md for more details"
