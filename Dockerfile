# =========================
# Next.js 14 Standalone
# =========================

# 1) deps
FROM node:20-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# 2) builder
FROM node:20-slim AS builder
WORKDIR /app

# arm64 플랫폼에서 SWC 바이너리 로드를 위한 패키지 설치
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# NEXT_PUBLIC_ 환경변수들은 코드에 fallback 값이 있으므로
# 빌드 시점에 전달하지 않아도 됩니다 (fallback 값이 번들에 포함됨)
# 필요시 .env 파일을 복사하거나 빌드 시점에 환경변수를 전달할 수 있습니다

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
# arm64에서 SWC 바이너리 문제를 피하기 위해 환경변수 설정
ENV NEXT_SWC_BINARY_PATH=""
RUN npm run build

# 3) runner
FROM node:20-slim AS runner
WORKDIR /app
ENV PORT=3300

# 환경변수는 런타임에 docker run -e 옵션으로 전달됩니다.
# NODE_ENV는 CodeBuild 환경변수에서 전달됩니다.
# 기본값은 설정하지 않아 런타임 환경변수가 반드시 전달되도록 합니다.

# standalone 산출물만 복사 → 경량
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3300
CMD ["node", "server.js"]
