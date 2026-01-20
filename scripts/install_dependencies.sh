#!/bin/bash

# 프로젝트 경로 설정
PROJECT_ROOT="/home/ec2-user/app"

# 디렉토리가 없으면 생성
if [ ! -d "$PROJECT_ROOT" ]; then
    mkdir -p "$PROJECT_ROOT"
fi

# 해당 경로로 이동
cd $PROJECT_ROOT

# 빌드 결과물 실행을 위해 production 의존성만 설치
# (이미 빌드된 결과물을 가져오더라도 package.json의 라이브러리 연결이 필요할 수 있음)
echo "Installing production dependencies..."
npm install --production

# 빌드 결과물 및 스크립트 파일들에 대한 권한 설정
sudo chown -R ec2-user:ec2-user $PROJECT_ROOT
chmod +x $PROJECT_ROOT/scripts/*.sh