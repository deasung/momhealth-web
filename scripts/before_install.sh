#!/bin/bash

PROJECT_ROOT="/home/ec2-user/app"

echo "BeforeInstall: 기존 빌드 산출물 정리 시작"
echo "TARGET ROOT: ${PROJECT_ROOT}"

cd "${PROJECT_ROOT}" 2>/dev/null || {
  echo "WARN: ${PROJECT_ROOT} 로 이동할 수 없습니다. (최초 배포일 수 있음)"
  exit 0
}

echo "기존 .next 디렉토리 삭제..."
rm -rf .next

echo "기존 public 디렉토리 삭제..."
rm -rf public

echo "기존 node_modules 디렉토리 삭제..."
rm -rf node_modules

echo "BeforeInstall: 정리 완료"

