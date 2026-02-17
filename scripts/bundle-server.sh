#!/bin/bash
set -e

TARGET_TRIPLE="aarch64-apple-darwin"
BINARY_NAME="next-server-${TARGET_TRIPLE}"

echo "📦 Creating Next.js server binary..."
mkdir -p src-tauri/binaries

# pkg로 standalone 서버 번들링
# Tauri sidecar 바이너리 이름 규칙: {name}-{target-triple}
npx pkg .next/standalone/server.js \
  --targets node18-macos-arm64 \
  --output "src-tauri/binaries/${BINARY_NAME}" \
  --compress GZip

chmod +x "src-tauri/binaries/${BINARY_NAME}"
echo "✓ Server binary created: src-tauri/binaries/${BINARY_NAME}"
