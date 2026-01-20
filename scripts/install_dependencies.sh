#!/bin/bash
PROJECT_ROOT="/home/ec2-user/app"

# 1. 소유권 강제 변경 (mkdir 권한 문제 해결)
sudo chown -R ec2-user:ec2-user $PROJECT_ROOT

cd $PROJECT_ROOT

pm2 delete nextjs || true
rm -rf .next
rm -rf node_modules
rm -f .env.local .env.dev .env.development

# 2. 의존성 설치
echo "Installing dependencies..."
npm install