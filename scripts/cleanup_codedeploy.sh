#!/bin/bash
set -euo pipefail

BASE="/opt/codedeploy-agent/deployment-root"

echo "[codedeploy-cleanup] start"
date

# deployments 디렉터리들만 찾아서, 그 안에서 오래된 배포만 삭제
mapfile -t DEPLOY_DIRS < <(find "$BASE" -type d -name "deployments" 2>/dev/null || true)

for d in "${DEPLOY_DIRS[@]}"; do
  echo "[codedeploy-cleanup] scanning: $d"
  ls -1dt "$d"/* 2>/dev/null | tail -n +4 | xargs -r rm -rf || true
done

echo "[codedeploy-cleanup] done"
date
