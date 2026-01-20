#!/bin/bash
PROJECT_ROOT="/home/ec2-user/app"

# 1. 소유권 강제 변경
sudo chown -R ec2-user:ec2-user $PROJECT_ROOT

cd $PROJECT_ROOT

# 2. 불필요한 파일 제거
rm -f .env.local .env.dev .env.development

# 3. 의존성 설치 최적화
# 이미 node_modules가 배포 패키지에 포함되어 있다면 npm install을 생략할 수 있습니다.
# 만약 필요하다면 --production 옵션으로 속도를 높이십시오.
echo "Checking dependencies..."
# npm install --production --no-audit --no-fund