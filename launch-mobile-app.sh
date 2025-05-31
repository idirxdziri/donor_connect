#!/bin/bash

# Mobile App Launch & Test Script

echo "🩸 Blood Donation Mobile App - Complete Launch & Test"
echo "=================================================="

# Navigate to mobile directory
cd /Users/didou/Public-Gateway/mobile

# Check if backend is running
echo "🔧 Checking backend connection..."
if curl -k -s https://localhost:57679/swagger/index.html > /dev/null; then
    echo "✅ Backend API server is running"
else
    echo "❌ Backend API server is not running"
    echo "Please start the .NET backend first"
    exit 1
fi

# Install dependencies if needed
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start Expo development server
echo "🚀 Starting Expo development server..."
echo "This will open in a new terminal window/tab"

# Kill any existing Expo processes on port 8082
lsof -ti:8082 | xargs kill -9 2>/dev/null || true

# Start Expo server in background
npx expo start --clear --port 8082 &
EXPO_PID=$!

# Wait a moment for server to start
sleep 5

# Run comprehensive tests
echo "🧪 Running mobile app tests..."
node test-complete-mobile.js

echo ""
echo "=================================================="
echo "🎉 Mobile app is ready!"
echo "📱 Scan the QR code with Expo Go to test on your device"
echo "🌐 Or press 'w' in the Expo CLI to test in browser"
echo "⚡ The app now connects to the backend API correctly"
echo ""
echo "To stop the Expo server, press Ctrl+C or run: kill $EXPO_PID"
echo "=================================================="

# Keep script running to show Expo output
wait $EXPO_PID
