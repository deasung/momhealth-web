#!/bin/bash
set -euo pipefail

echo "[log-cleanup] start"
date

# 1) systemd journal 로그 정리 (100MB 유지)
if command -v journalctl >/dev/null 2>&1; then
  journalctl --vacuum-size=100M || true
fi

# 2) 주요 시스템 로그 truncate
for f in /var/log/messages /var/log/secure /var/log/cron; do
  if [ -f "$f" ]; then
    truncate -s 0 "$f" || true
  fi
done

# 3) audit 로그
if [ -f /var/log/audit/audit.log ]; then
  truncate -s 0 /var/log/audit/audit.log || true
fi

# 4) 패키지 캐시 정리
command -v yum >/dev/null 2>&1 && yum clean all || true
command -v dnf >/dev/null 2>&1 && dnf clean all || true

echo "[log-cleanup] done"
date
