#!/bin/bash
PROJECT_ROOT="/home/ec2-user/app"

# 1. NVM 환경 로드 (PM2 경로 인식을 위해 필수)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 2. PM2 바이너리 경로 확인
PM2_BIN=$(which pm2)

# 만약 위에서 못 찾을 경우를 대비한 직접 경로 설정 (NVM 기본 경로)
if [ -z "$PM2_BIN" ]; then
    PM2_BIN="/home/ec2-user/.nvm/versions/node/$(node -v)/bin/pm2"
fi

cd $PROJECT_ROOT

# 3. PM2 명령 실행 (명확한 경로 사용)
$PM2_BIN delete nextjs || true

echo "Starting Next.js server..."
NODE_ENV=production $PM2_BIN start npm --name "nextjs" --update-env -- start -- -p 3300

$PM2_BIN save