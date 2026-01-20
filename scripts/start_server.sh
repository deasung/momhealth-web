#!/bin/bash

PROJECT_ROOT="/home/ec2-user/app"
# 1. which로 찾지 못할 경우를 대비해 절대 경로 병행 사용 권장
PM2_BIN=$(which pm2)
if [ -z "$PM2_BIN" ]; then
    PM2_BIN="/usr/bin/pm2"
fi

cd $PROJECT_ROOT

echo "Cleaning up existing PM2 process..."
$PM2_BIN delete nextjs || true

# 2. 캐시된 덤프 파일 삭제
rm -f ~/.pm2/dump.pm2

echo "Starting Next.js server with PM2 in production mode..."
# 3. NODE_ENV를 명시하고 --update-env 옵션을 추가하여 환경 변수 갱신 보장
NODE_ENV=production $PM2_BIN start npm --name "nextjs" --update-env -- start -- -p 3300

# 4. 상태 저장
$PM2_BIN save

# 5. 적용된 변수 확인 (grep 결과가 없어도 스크립트가 멈추지 않도록 설정)
$PM2_BIN env 0 | grep NODE_ENV || true