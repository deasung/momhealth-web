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

ARG ENV_FILE=.env.production
# env 파일이 있으면 .env로 복사 (없어도 빌드 가능)
RUN if [ -f "$ENV_FILE" ]; then cp "$ENV_FILE" .env; fi

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 3) runner
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3300

# 기본값(런타임에서 -e로 덮어쓰기 가능)
ENV NEXTAUTH_URL=https://medigen.ai.kr
ENV NEXTAUTH_SECRET=92nkzVApA5J9Fne9s8XeQAGdEkOiTK+v+1cztN/eTok=
ENV MOMHEALTH_API_URL=https://895txa0nrk.execute-api.ap-northeast-2.amazonaws.com/production
ENV MOMHEALTH_API_KEY=f5e60c40-5eb4-11ea-b4d7-0d9c1606f185
ENV JWT_SECRET=e4f5d620-bb7a-4f56-90c7-5a9e6b7b2d10$momhealth2025!
ENV CDN_URL=https://di7imxmn4pwuq.cloudfront.net
ENV KAKAO_CLIENT_ID=f8ac4eae134f37ea481b65f4e43ce54e
ENV KAKAO_CLIENT_SECRET=asdfasdfsafasfasfsdfsfsa121231231
ENV GOOGLE_CLIENT_ID=575173374427-t09ul9r8c0ckr2lp2r6bhfatksuru9ve.apps.googleusercontent.com
ENV GOOGLE_CLIENT_SECRET=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

# standalone 산출물만 복사 → 경량
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3300
CMD ["node", "server.js"]
