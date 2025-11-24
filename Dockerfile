# Dockerfile

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

# arm64 플랫폼에서 SWC 바이너리 로드를 위한 패키지 설치 (유지)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# 💡 수정: 빌드 시점에 런타임 환경 변수 (MOMHEALTH, NEXTAUTH 등) ARG/ENV 모두 제거
# 이 변수들은 런타임에 docker run -e로 주입됩니다.

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
# arm64에서 SWC 바이너리 문제를 피하기 위해 환경변수 설정 (유지)
ENV NEXT_SWC_BINARY_PATH=""
RUN npm run build

# 3) runner
FROM node:20-slim AS runner
WORKDIR /app
ENV PORT=3300

# 💡 수정: 런타임에 주입될 변수는 ENV로 선언만 하거나 (선택), 생략하고
# docker run -e 에만 의존하는 것이 가장 안전합니다. 여기서는 생략하겠습니다.
# Next.js Standalone은 process.env에 의존합니다.

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3300
CMD ["node", "server.js"]