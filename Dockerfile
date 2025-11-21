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

# 빌드 시점 환경 변수 (--build-arg로 전달)
# 주의: 빌드 시점에 전달하면 이미지에 포함되므로 보안상 위험할 수 있습니다.
# 런타임 환경 변수는 runner 단계에서 ENV로 선언하고 docker run -e로 전달하는 것이 더 안전합니다.
ARG MOMHEALTH_API_URL=""
ARG MOMHEALTH_API_KEY=""
ARG NEXTAUTH_URL=""
ARG NEXTAUTH_SECRET=""
ARG JWT_SECRET=""
ARG CDN_URL=""
ARG KAKAO_CLIENT_ID=""
ARG KAKAO_CLIENT_SECRET=""
ARG GOOGLE_CLIENT_ID=""
ARG GOOGLE_CLIENT_SECRET=""
ARG NODE_ENV="production"

# ARG를 ENV로 변환 (빌드 시점에 사용)
ENV MOMHEALTH_API_URL=${MOMHEALTH_API_URL}
ENV MOMHEALTH_API_KEY=${MOMHEALTH_API_KEY}
ENV NEXTAUTH_URL=${NEXTAUTH_URL}
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
ENV JWT_SECRET=${JWT_SECRET}
ENV CDN_URL=${CDN_URL}
ENV KAKAO_CLIENT_ID=${KAKAO_CLIENT_ID}
ENV KAKAO_CLIENT_SECRET=${KAKAO_CLIENT_SECRET}
ENV GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
ENV GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
ENV NODE_ENV=${NODE_ENV}

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
# ENV로 선언만 하면 런타임에 docker run -e로 전달된 값이 덮어씁니다.
# Next.js standalone 모드에서 런타임 환경 변수를 읽기 위해 ENV 선언이 필요합니다.
ENV MOMHEALTH_API_URL=""
ENV MOMHEALTH_API_KEY=""
ENV NEXTAUTH_URL=""
ENV NEXTAUTH_SECRET=""
ENV JWT_SECRET=""
ENV CDN_URL=""
ENV KAKAO_CLIENT_ID=""
ENV KAKAO_CLIENT_SECRET=""
ENV GOOGLE_CLIENT_ID=""
ENV GOOGLE_CLIENT_SECRET=""
ENV NODE_ENV="dev"
ENV HOST="0.0.0.0"

# standalone 산출물만 복사 → 경량
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3300
CMD ["node", "server.js"]
