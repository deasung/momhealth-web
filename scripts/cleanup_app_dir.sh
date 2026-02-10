#!/bin/bash
set -euo pipefail

APP_DIR="/home/ec2-user/app"

echo "[cleanup_app_dir] start"
date

# 기존 배포 파일 제거 (디렉터리 자체는 유지)
rm -rf "${APP_DIR:?}/"*

# 혹시 숨김파일(.next 등)도 제거
rm -rf "${APP_DIR:?}/".[^.]* "${APP_DIR:?}/"..?* 2>/dev/null || true

# 권한 보정
chown -R ec2-user:ec2-user "$APP_DIR"

echo "[cleanup_app_dir] done"
date
