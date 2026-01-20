#!/bin/bash

# 프로젝트 경로 설정
PROJECT_ROOT="/home/ec2-user/app"
cd $PROJECT_ROOT

# 1. 기존 PM2 프로세스 정리
# 동일한 이름의 프로세스가 있으면 종료하고 없으면 무시합니다.
echo "Cleaning up existing PM2 process..."
pm2 delete nextjs || true

# 2. Next.js 서버 실행
# package.json의 "start": "next start -p 3300" 명령을 실행합니다.
# --update-env 옵션으로 새 배포 시 환경 변수를 갱신합니다.
echo "Starting Next.js server with PM2..."
pm2 start npm --name "nextjs" --update-env -- start

# 3. PM2 상태 저장 (인스턴스 재시작 시 자동 실행 설정)
pm2 save

echo "Deployment finished successfully."