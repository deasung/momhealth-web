# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"오늘의 건강" (Today's Health) - A Korean health management platform for pregnancy and childcare with community features, health questions, and friend interactions.

**Tech Stack**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS

**Port**: 3300 (dev and production)

## Development Commands

```bash
# Development
npm run dev                # Start dev server on port 3300

# Build & Production
npm run build              # Build for production (standalone mode)
npm run start              # Start production server
npm run start:standalone   # Start standalone production build

# Code Quality
npm run lint               # Run ESLint with zero warnings tolerance
```

## Architecture Overview

### Router Configuration

The project uses **App Router** (not Pages Router) with one exception:
- Main application: `/app` directory (App Router)
- NextAuth only: `/pages/api/auth/[...nextauth].ts` (Pages Router for NextAuth compatibility)

### Directory Structure

```
/app
  /components          # Reusable UI components (Header, Footer, SEO, etc.)
  /types              # TypeScript type definitions (community, health-questions, user, dto, home)
  /utils              # Client-side utilities (browserInfo, deviceInfo, timeFormat)
  /api/proxy          # Proxy route handler for backend API
  layout.tsx          # Root layout with ClientProviders and metadata
  page.tsx            # Home page

/lib
  api.ts              # Client-side axios instance with token management
  api-server.ts       # Server-side API client (for Server Components)
  auth.ts             # NextAuth configuration (JWT strategy)
  firebase.ts         # Firebase client initialization
  webPush.ts          # Web Push notification utilities
  /hooks              # React hooks (useAuth, useLogout, useTokenSync, useWebPush)
  /utils              # Shared utilities

/pages
  /api/auth/[...nextauth].ts  # NextAuth endpoint (only Pages Router usage)

/public                # Static assets
/styles                # Global CSS
```

### Authentication System

**NextAuth with JWT Strategy**
- Providers: Credentials, Kakao, Google
- Configuration: `/lib/auth.ts` (authOptions export)
- API Route: `/pages/api/auth/[...nextauth].ts`
- Session access:
  - Server: `getServerSession(authOptions)` from `next-auth/next`
  - Client: `useSession()` hook from ClientProviders
- Token storage: localStorage with keys from `TOKEN_KEYS` constant
- Refresh token support with automatic renewal on 401 responses
- Guest mode support (isGuest flag)

**Token Management**
- Client: `lib/api.ts` exports `setToken()`, `getToken()`, `clearToken()`
- Server: Session via NextAuth
- Tokens stored in localStorage: `TOKEN_KEYS.TOKEN`, `TOKEN_KEYS.REFRESH_TOKEN`, `TOKEN_KEYS.IS_GUEST`
- Auto-refresh on 401 with concurrent request queuing

### Data Fetching Pattern

**Client-side**:
- Use axios from `/lib/api.ts`
- Base URL: `/api/proxy` (proxies to backend)
- Automatic token injection via interceptors
- All calls wrapped in try/catch

**Server-side**:
- Use `/lib/api-server.ts` for Server Components/Actions
- Use `getServerSideProps`/`getStaticProps` if needed (rare)
- Direct backend API calls with server environment variables

### API Integration

Backend API is proxied through Next.js:
- Client requests: `/api/proxy/*` → Backend API
- API configuration: `lib/constants.ts` (API_CONFIG, TOKEN_KEYS)
- Backend base URL: `MOMHEALTH_API_URL` env var
- API Key: `MOMHEALTH_API_KEY` env var (server-only)

### Build Configuration

`next.config.js`:
- `output: "standalone"` - Optimized production deployment
- Remote image patterns for CloudFront CDNs
- `eslint.ignoreDuringBuilds: true` and `typescript.ignoreBuildErrors: true`

### Environment Variables

**Client (NEXT_PUBLIC_*)**:
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_FIREBASE_*` (Firebase config)

**Server-only**:
- `MOMHEALTH_API_URL` - Backend API base URL
- `MOMHEALTH_API_KEY` - Backend API key
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- OAuth provider keys (KAKAO_*, GOOGLE_*)

## Important Constraints

1. **Do not modify existing code formatting or indentation** - Follow the current style exactly
2. **Do not auto-reorder imports or rewrap lines** unless explicitly asked
3. **Do not introduce or change ESLint/Prettier configs**
4. **Do not add new libraries** without being asked
5. **Do not migrate to different patterns** (state libs, etc.) unless requested
6. **Avoid the 'any' type** - Use explicit, narrow TypeScript types
7. **Keep environment variables namespaced** - NEXT_PUBLIC_* for client, others server-only
8. **All async calls must use try/catch** - No silent failures

## Key Features

- SEO optimization with structured metadata (layout.tsx and app/components/SEO.tsx)
- Firebase Cloud Messaging for push notifications
- Web Push API support
- Analytics tracking (AnalyticsListener component)
- Kakao sharing integration
- Health questions with AI responses
- Community posts with comments
- Friend system with health data sharing
- Guest mode for unauthenticated users

## TypeScript Path Aliases

Use `@/*` to import from project root:
```typescript
import { api } from '@/lib/api';
import { useAuth } from '@/lib/hooks/useAuth';
```
