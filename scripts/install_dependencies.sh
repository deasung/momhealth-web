#!/bin/bash
PROJECT_ROOT="/home/ec2-user/app"

# 1. NVM 및 Node 환경 로드
export NVM_DIR="/home/ec2-user/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 2. 소유권 및 권한 강제 설정
sudo chown -R ec2-user:ec2-user $PROJECT_ROOT
cd $PROJECT_ROOT

# 3. 환경 파일 설정
if [ -f ".env.production" ]; then
    cp .env.production .env
    echo "✅ .env.production copied to .env"
fi

# 4. 의존성 재설치 (아키텍처 불일치 해결 핵심)
# 기존 node_modules가 있다면 제거하여 꼬임 방지
echo "Cleaning and installing dependencies for ARM64 architecture..."
rm -rf node_modules
npm install --production --no-audit

# 5. .next 디렉토리 및 BUILD_ID 확인
echo "Checking .next directory..."
if [ ! -d ".next" ]; then
    echo "ERROR: .next directory is missing. Check CodeBuild artifacts."
    exit 1
fi

if [ ! -f ".next/BUILD_ID" ]; then
    echo "ERROR: .next/BUILD_ID is missing. Running emergency build..."
    npm run build
fi

# 6. 최종 검증
if [ -d "node_modules" ] && [ -f ".next/BUILD_ID" ]; then
    echo "✅ Dependencies and Build artifacts verified."
else
    echo "❌ Verification failed."
    exit 1
fi