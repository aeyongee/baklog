#!/bin/bash
set -e

echo "🚀 Building Baklog Desktop for macOS (Apple Silicon)..."

# 클린업
echo "🧹 Cleaning up..."
rm -rf src-tauri/target
rm -rf .next
rm -rf src-tauri/binaries
mkdir -p src-tauri/binaries

# Prisma 클라이언트 생성
echo "📦 Generating Prisma client..."
npx prisma generate

# Next.js 빌드
echo "📦 Building Next.js..."
npm run build:tauri

# 서버 바이너리 번들링
echo "📦 Bundling Next.js server..."
./scripts/bundle-server.sh

# Tauri 빌드 (Apple Silicon)
echo "📦 Building Tauri app..."
npm run tauri:build -- --target aarch64-apple-darwin

echo "✅ Build complete!"
echo "📍 Location: src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/"
