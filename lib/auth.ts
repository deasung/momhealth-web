// lib/auth.ts
import jwt from "jsonwebtoken";
import { TOKEN_KEYS } from "./constants";

const JWT_SECRET = process.env.JWT_SECRET!;
const EXPIRES_IN = "7d"; // 토큰 유효기간: 7일

export interface TokenPayload {
  id: string;
  email: string;
}

// ✅ 토큰 발급 함수
export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: EXPIRES_IN });
}

// ✅ 토큰 검증 함수
export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

// JWT 토큰 관련 유틸리티 함수들

// JWT 토큰을 디코딩하는 함수 (서명 검증 없이)
export function decodeJWT(token: string): any {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("JWT 디코딩 실패:", error);
    return null;
  }
}

// 토큰이 만료되었는지 확인하는 함수
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp) {
      return true; // 토큰이 유효하지 않으면 만료된 것으로 간주
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const expirationTime = decoded.exp;

    // 만료 5분 전부터는 만료된 것으로 간주 (여유 시간)
    const bufferTime = 5 * 60; // 5분
    return currentTime >= expirationTime - bufferTime;
  } catch (error) {
    console.error("토큰 만료 확인 실패:", error);
    return true; // 에러 발생 시 만료된 것으로 간주
  }
}

// 토큰의 만료 시간을 가져오는 함수
export function getTokenExpirationTime(token: string): Date | null {
  try {
    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp) {
      return null;
    }
    return new Date(decoded.exp * 1000);
  } catch (error) {
    console.error("토큰 만료 시간 확인 실패:", error);
    return null;
  }
}

// 토큰의 남은 시간을 초 단위로 가져오는 함수
export function getTokenRemainingTime(token: string): number {
  try {
    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp) {
      return 0;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const expirationTime = decoded.exp;

    return Math.max(0, expirationTime - currentTime);
  } catch (error) {
    console.error("토큰 남은 시간 확인 실패:", error);
    return 0;
  }
}

// 토큰 정보를 로깅하는 함수 (개발용)
export function logTokenInfo(token: string): void {
  if (process.env.NODE_ENV !== "development") return;

  try {
    const decoded = decodeJWT(token);
    if (!decoded) {
      console.log("토큰 정보: 유효하지 않은 토큰");
      return;
    }

    const expTime = getTokenExpirationTime(token);
    const remainingTime = getTokenRemainingTime(token);
    const isExpired = isTokenExpired(token);

    console.log("토큰 정보:", {
      issuedAt: decoded.iat
        ? new Date(decoded.iat * 1000).toLocaleString()
        : "N/A",
      expiresAt: expTime ? expTime.toLocaleString() : "N/A",
      remainingTime: `${Math.floor(remainingTime / 60)}분 ${
        remainingTime % 60
      }초`,
      isExpired,
      subject: decoded.sub || "N/A",
      issuer: decoded.iss || "N/A",
    });
  } catch (error) {
    console.error("토큰 정보 로깅 실패:", error);
  }
}
