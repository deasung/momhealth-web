#!/bin/bash

# 프로젝트 경로 설정
PROJECT_ROOT="/home/ec2-user/app"
cd $PROJECT_ROOT

# 1. 기존 PM2 프로세스 정리
echo "Cleaning up existing PM2 process..."
pm2 delete nextjs || true

# 2. Next.js 서버 실행
# NODE_ENV를 production으로 명시하여 .env.production 파일을 강제로 읽게 합니다.
echo "Starting Next.js server with PM2 in production mode..."
NODE_ENV=production pm2 start npm --name "nextjs" --update-env -- start -- -p 3300

# 3. PM2 상태 저장
pm2 save

echo "Deployment finished successfully."