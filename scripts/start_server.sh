#!/bin/bash
PROJECT_ROOT="/home/ec2-user/app"
cd $PROJECT_ROOT

# 1. 환경 변수 로드 (nvm 또는 전역 npm 경로 인식용)
export PM2_HOME="/home/ec2-user/.pm2"
# pm2 명령어를 찾기 위해 경로 추가 (일반적인 위치)
export PATH=$PATH:/usr/local/bin:/usr/bin

# 2. 기존 프로세스 정리
echo "Cleaning up existing PM2 process..."
pm2 delete nextjs || true

# 3. Next.js 서버 실행
echo "Starting Next.js server with PM2 in production mode..."
NODE_ENV=production pm2 start npm --name "nextjs" --update-env -- start -- -p 3300

# 4. PM2 상태 저장
pm2 save