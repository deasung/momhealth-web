#!/bin/bash
PROJECT_ROOT="/home/ec2-user/app"

# 1. NVM 및 Node 환경 로드 (핵심)
export NVM_DIR="/home/ec2-user/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 2. 소유권 변경
sudo chown -R ec2-user:ec2-user $PROJECT_ROOT

cd $PROJECT_ROOT

# 3. 환경 파일 및 기존 모듈 정리
rm -f .env.local .env.dev .env.development
cp .env.production .env

echo "Removing old node_modules..."
rm -rf node_modules
rm -f package-lock.json

# 4. 의존성 설치
echo "Installing dependencies..."
npm install --production --no-audit

# 5. 설치 결과 확인
if [ -d "node_modules" ]; then
    echo "node_modules installed successfully."
else
    echo "node_modules installation failed."
    exit 1
fi