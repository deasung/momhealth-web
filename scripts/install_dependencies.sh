#!/bin/bash
PROJECT_ROOT="/home/ec2-user/app"

# 1. NVM 및 Node 환경 로드 (핵심)
export NVM_DIR="/home/ec2-user/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 2. 소유권 변경
sudo chown -R ec2-user:ec2-user $PROJECT_ROOT

cd $PROJECT_ROOT

echo "AfterInstall: standalone 산출물 사용 (npm install / build 생략)"

# NOTE:
# - 빌드는 CodeBuild에서 수행합니다.
# - Next.js standalone 모드에서는 .next/standalone 안에 필요한 node_modules가 포함됩니다.

if [ ! -d ".next/standalone" ]; then
    echo "ERROR: .next/standalone 이 없습니다. CodeBuild 산출물에 standalone이 포함됐는지 확인하세요."
    exit 1
fi