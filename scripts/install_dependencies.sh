#!/bin/bash

# 프로젝트 경로 설정
PROJECT_ROOT="/home/ec2-user/app"

# 해당 경로로 이동 (폴더는 CodeDeploy가 자동으로 생성함)
cd $PROJECT_ROOT

# 기존 node_modules 삭제 (충돌 방지용 - 선택 사항)
# rm -rf node_modules

# 의존성 설치
echo "Installing dependencies..."
# --production을 제거하여 전체 패키지 설치 시도
npm install

# 권한 설정 (ec2-user가 실행할 수 있도록)
sudo chown -R ec2-user:ec2-user $PROJECT_ROOT
chmod +x $PROJECT_ROOT/scripts/*.sh