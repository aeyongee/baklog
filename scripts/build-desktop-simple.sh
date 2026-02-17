#!/bin/bash
set -e

echo "Building Baklog Desktop for macOS (Apple Silicon)..."

# 클린업
echo "Cleaning up..."
rm -rf src-tauri/target/release
rm -rf .next

# Prisma 클라이언트 생성
echo "Generating Prisma client..."
npx prisma generate

# Next.js 빌드 (standalone)
echo "Building Next.js (standalone)..."
npm run build:tauri

# standalone에 static/public 파일 복사 (Next.js standalone 배포 필수)
echo "Copying static files to standalone..."
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

# Tauri 빌드 (Apple Silicon)
echo "Building Tauri app..."
npm run tauri:build -- --target aarch64-apple-darwin

echo ""
echo "Build complete!"
echo "DMG: src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/"
