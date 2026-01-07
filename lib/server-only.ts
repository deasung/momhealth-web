// lib/server-only.ts
// 서버 전용 코드임을 명시적으로 표시
// 클라이언트 번들에 포함되지 않도록 보장

if (typeof window !== "undefined") {
  throw new Error("This module can only be imported in a Server Component");
}

export {};
