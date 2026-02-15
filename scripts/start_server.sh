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

# standalone 모드 확인 (Dockerfile 구조와 동일하게)
if [ -f ".next/standalone/server.js" ]; then
    echo "Using standalone mode (Dockerfile 구조)"
    # Dockerfile처럼: .next/standalone 안에 server.js, 밖에 .next/static과 public
    # server.js는 프로젝트 루트에서 실행하되, .next/standalone/server.js를 실행
    NODE_ENV=production PORT=3300 HOSTNAME=0.0.0.0 $PM2_BIN start "node .next/standalone/server.js" --name "nextjs" \
        --cwd "$PROJECT_ROOT" \
        --update-env
else
    echo "Using standard next start mode"
    NODE_ENV=production PORT=3300 HOSTNAME=0.0.0.0 $PM2_BIN start npm --name "nextjs" \
        --cwd "$PROJECT_ROOT" \
        --update-env \
        -- start -- -p 3300
fi

$PM2_BIN save