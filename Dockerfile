# =========================
# Next.js 14 Standalone Dockerfile
# =========================

# 1) deps: install node_modules with cache-friendly layer
FROM node:20-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# 2) builder: build Next.js (standalone)
FROM node:20-slim AS builder
WORKDIR /app

ARG ENV_FILE=.env.production
# env 파일이 존재하면 복사
RUN if [ -f "$ENV_FILE" ]; then cp "$ENV_FILE" .env; fi

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 3) runner: minimal runtime image
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3300

# standalone 산출물만 복사 → 이미지 경량화
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3300
CMD ["node", "server.js"]
