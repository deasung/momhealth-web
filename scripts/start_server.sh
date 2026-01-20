#!/bin/bash
PROJECT_ROOT="/home/ec2-user/app"
PM2_BIN=$(which pm2)

cd $PROJECT_ROOT

# 프로세스 정리
$PM2_BIN delete nextjs || true

# Next.js 표준 실행
echo "Starting Next.js server..."
NODE_ENV=production $PM2_BIN start npm --name "nextjs" --update-env -- start -- -p 3300

$PM2_BIN save