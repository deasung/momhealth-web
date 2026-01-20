#!/bin/bash
PROJECT_ROOT="/home/ec2-user/app"

# 1. NVM 환경 로드
export NVM_DIR="/home/ec2-user/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 2. PM2 바이너리 경로 확인
PM2_BIN=$(which pm2)
if [ -z "$PM2_BIN" ]; then
    PM2_BIN="/home/ec2-user/.nvm/versions/node/$(node -v)/bin/pm2"
fi

# 3. 프로젝트 루트로 이동 및 권한 확인
cd $PROJECT_ROOT
sudo chown -R ec2-user:ec2-user $PROJECT_ROOT

# 4. PM2 명령 실행
# --cwd 옵션을 추가하여 실행 위치를 강제 고정합니다.
$PM2_BIN delete nextjs || true

echo "Starting Next.js server with CWD: $PROJECT_ROOT"
NODE_ENV=production PORT=3300 HOSTNAME=0.0.0.0 $PM2_BIN start "node .next/standalone/server.js" --name "nextjs" \
    --cwd "$PROJECT_ROOT" \
    --update-env

$PM2_BIN save