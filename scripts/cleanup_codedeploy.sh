#!/bin/bash

set -euo pipefail

BASE="/opt/codedeploy-agent/deployment-root"

echo "[codedeploy-cleanup] start"
date

# 진행 중 배포 디렉터리 제외하고 전부 삭제
find "$BASE" -maxdepth 1 -mindepth 1 \
  ! -name "ongoing-deployment" \
  ! -name "deployment-instructions" \
  -exec rm -rf {} \;

echo "[codedeploy-cleanup] done"
date
