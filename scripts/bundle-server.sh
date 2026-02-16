#!/bin/bash
set -e

echo "Building Next.js standalone..."
npm run build:tauri

echo "Creating server binary..."
mkdir -p src-tauri/binaries

npx pkg scripts/server-wrapper.mjs \
  --targets node18-macos-arm64 \
  --output src-tauri/binaries/next-server \
  --compress GZip

chmod +x src-tauri/binaries/next-server
echo "✓ Server binary created at src-tauri/binaries/next-server"
