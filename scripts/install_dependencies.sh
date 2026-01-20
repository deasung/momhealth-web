#!/bin/bash
PROJECT_ROOT="/home/ec2-user/app"

# 1. 소유권 및 권한 강제 설정 (root가 아닌 ec2-user 권한으로 실행 보장)
sudo chown -R ec2-user:ec2-user $PROJECT_ROOT
sudo chmod -R 755 $PROJECT_ROOT

cd $PROJECT_ROOT

# 2. 기존 파일 정리 및 환경 변수 설정
rm -f .env.local .env.dev .env.development
cp .env.production .env

# 3. 의존성 설치 (캐시 삭제 및 클린 설치)
echo "Removing old node_modules..."
rm -rf node_modules
rm -f package-lock.json

echo "Installing dependencies..."
# ARM64 환경에서 npm install 시 메모리 부족 방지를 위해 --no-audit 권장
npm install --production --no-audit

# 4. 설치 결과 확인 (로그 확인용)
if [ -d "node_modules" ]; then
    echo "node_modules installed successfully."
else
    echo "node_modules installation failed."
    exit 1
fi