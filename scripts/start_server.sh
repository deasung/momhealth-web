#!/bin/bash
PROJECT_ROOT="/home/ec2-user/app"
PM2_BIN=$(which pm2)

cd $PROJECT_ROOT

# 기존 프로세스 삭제
$PM2_BIN delete nextjs || true

# 불필요한 환경 파일 삭제 (혼선 방지)
rm -f .env.local .env.dev .env.development

# 표준 npm start 실행
NODE_ENV=production $PM2_BIN start npm --name "nextjs" --update-env -- start -- -p 3300

$PM2_BIN save