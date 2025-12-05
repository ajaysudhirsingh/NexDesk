#!/bin/bash

echo "🚀 NEXDESK PWA Test Script"
echo "=========================="
echo ""

# Check if build exists
if [ ! -d "build" ]; then
    echo "📦 Building production version..."
    npm run build
    echo ""
fi

# Check if serve is installed
if ! command -v serve &> /dev/null; then
    echo "⚠️  'serve' is not installed. Installing globally..."
    npm install -g serve
    echo ""
fi

echo "✅ Starting PWA server..."
echo ""
echo "📱 Test your PWA at: http://localhost:3000"
echo ""
echo "🔍 Testing checklist:"
echo "  1. Open Chrome DevTools → Application → Manifest"
echo "  2. Check Service Worker is registered"
echo "  3. Test offline mode (DevTools → Network → Offline)"
echo "  4. Look for install prompt in address bar"
echo "  5. Run Lighthouse audit for PWA score"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

serve -s build -l 3000
