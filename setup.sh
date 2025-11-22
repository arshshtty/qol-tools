#!/bin/bash

echo "🛠️  QOL Tools Setup"
echo "=================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✓ Node.js version: $(node --version)"
echo "✓ npm version: $(npm --version)"
echo ""

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install Download Manager
echo ""
echo "📦 Installing Download Manager..."
cd tools/download-manager
npm install
cd ../..

# Install Port Resolver
echo ""
echo "📦 Installing Port Resolver..."
cd tools/port-resolver
npm install
cd ../..

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 Quick Start:"
echo ""
echo "  Download Manager:"
echo "    cd tools/download-manager && npm run dev"
echo "    Open http://localhost:3001"
echo ""
echo "  Port Resolver:"
echo "    cd tools/port-resolver && npm run dev"
echo "    Open http://localhost:3002"
echo ""
echo "📖 See README.md for more details"
