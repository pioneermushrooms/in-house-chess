#!/bin/bash

# In-House Chess Club - Local Network Quick Start
# This script helps you quickly start the chess server for your local network

echo "🏁 In-House Chess Club - Local Network Setup"
echo "============================================"
echo ""

# Get local IP address
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    LOCAL_IP=$(hostname -I | awk '{print $1}')
else
    echo "⚠️  Could not detect OS. Please find your local IP manually."
    LOCAL_IP="YOUR_LOCAL_IP"
fi

echo "📍 Your local IP address: $LOCAL_IP"
echo ""

# Check if dependencies are installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install it first:"
    echo "   npm install -g pnpm"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
fi

# Build the application
echo "🔨 Building application..."
pnpm run build

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi

echo ""
echo "✅ Build successful!"
echo ""
echo "🚀 Starting server..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🎮 In-House Chess Club is now running!"
echo ""
echo "  📱 Share this URL with your coworkers:"
echo "     http://$LOCAL_IP:3000"
echo ""
echo "  💻 Or access locally at:"
echo "     http://localhost:3000"
echo ""
echo "  ⚠️  Keep this terminal window open!"
echo "     Press Ctrl+C to stop the server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start the server
NODE_ENV=production pnpm start
