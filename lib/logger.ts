/**
 * 통합 로거 유틸리티
 * 환경별로 로깅 레벨을 제어하고 민감한 정보를 자동으로 필터링
 */

enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment: boolean;
  private isProduction: boolean;
  private sensitiveKeys = [
    "token",
    "accessToken",
    "refreshToken",
    "password",
    "apiKey",
    "secret",
    "authorization",
    "x-api-key",
  ];

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === "development";
    this.isProduction = process.env.NODE_ENV === "production";
  }

  /**
   * 민감한 정보 마스킹
   */
  private sanitize(data: any): any {
    if (!data) return data;

    if (typeof data === "string") {
      // Bearer 토큰 마스킹
      if (data.startsWith("Bearer ")) {
        const token = data.substring(7);
        return `Bearer ${this.maskToken(token)}`;
      }
      // JWT 토큰 마스킹
      if (data.includes(".") && data.length > 20) {
        return this.maskToken(data);
      }
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitize(item));
    }

    if (typeof data === "object" && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase();
        const isSensitive = this.sensitiveKeys.some((sensitiveKey) =>
          lowerKey.includes(sensitiveKey.toLowerCase())
        );

        if (isSensitive && typeof value === "string") {
          sanitized[key] = this.maskToken(value);
        } else {
          sanitized[key] = this.sanitize(value);
        }
      }
      return sanitized;
    }

    return data;
  }

  /**
   * 토큰 마스킹 (앞 6자, 뒤 4자만 표시)
   */
  private maskToken(token: string): string {
    if (!token || token.length < 10) return "***";
    const start = token.substring(0, 6);
    const end = token.substring(token.length - 4);
    return `${start}...${end}`;
  }

  /**
   * 로그 포맷팅
   */
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}]`;
    return context ? `${prefix} ${message}` : `${prefix} ${message}`;
  }

  /**
   * DEBUG 레벨 로그 (개발 환경에서만)
   */
  debug(message: string, context?: LogContext): void {
    if (!this.isDevelopment) return;

    const sanitizedContext = context ? this.sanitize(context) : undefined;
    if (sanitizedContext) {
      console.log(this.formatMessage(LogLevel.DEBUG, message), sanitizedContext);
    } else {
      console.log(this.formatMessage(LogLevel.DEBUG, message));
    }
  }

  /**
   * INFO 레벨 로그 (개발 환경에서만)
   */
  info(message: string, context?: LogContext): void {
    if (!this.isDevelopment) return;

    const sanitizedContext = context ? this.sanitize(context) : undefined;
    if (sanitizedContext) {
      console.log(this.formatMessage(LogLevel.INFO, message), sanitizedContext);
    } else {
      console.log(this.formatMessage(LogLevel.INFO, message));
    }
  }

  /**
   * WARN 레벨 로그 (모든 환경)
   */
  warn(message: string, context?: LogContext): void {
    const sanitizedContext = context ? this.sanitize(context) : undefined;
    if (sanitizedContext) {
      console.warn(this.formatMessage(LogLevel.WARN, message), sanitizedContext);
    } else {
      console.warn(this.formatMessage(LogLevel.WARN, message));
    }
  }

  /**
   * ERROR 레벨 로그 (모든 환경)
   */
  error(message: string, error?: unknown, context?: LogContext): void {
    const errorInfo = this.extractErrorInfo(error);
    const sanitizedContext = context ? this.sanitize(context) : undefined;

    const fullContext = {
      ...sanitizedContext,
      ...errorInfo,
    };

    console.error(this.formatMessage(LogLevel.ERROR, message), fullContext);
  }

  /**
   * 에러 정보 추출
   */
  private extractErrorInfo(error: unknown): LogContext {
    if (!error) return {};

    if (error instanceof Error) {
      return {
        errorName: error.name,
        errorMessage: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
      };
    }

    if (typeof error === "object" && error !== null) {
      const err = error as any;

      // Axios 에러
      if (err.isAxiosError || err.response) {
        return {
          status: err.response?.status,
          statusText: err.response?.statusText,
          errorMessage: err.message,
          data: this.sanitize(err.response?.data),
        };
      }

      // 일반 객체
      return this.sanitize(error);
    }

    return { error: String(error) };
  }

  /**
   * API 요청 로그 (개발 환경에서만)
   */
  apiRequest(method: string, url: string, context?: LogContext): void {
    this.debug(`API Request: ${method} ${url}`, context);
  }

  /**
   * API 응답 로그 (개발 환경에서만)
   */
  apiResponse(method: string, url: string, status: number, context?: LogContext): void {
    this.debug(`API Response: ${method} ${url} - ${status}`, context);
  }

  /**
   * API 에러 로그
   */
  apiError(method: string, url: string, error: unknown, context?: LogContext): void {
    this.error(`API Error: ${method} ${url}`, error, context);
  }

  /**
   * 토큰 관련 로그 (개발 환경에서만, 민감 정보 필터링)
   */
  token(message: string, context?: LogContext): void {
    if (!this.isDevelopment) return;
    this.debug(`[Token] ${message}`, context);
  }

  /**
   * 인증 관련 로그
   */
  auth(message: string, context?: LogContext): void {
    if (!this.isDevelopment) return;
    this.debug(`[Auth] ${message}`, context);
  }
}

// 싱글톤 인스턴스 export
export const logger = new Logger();

// 기본 export도 제공
export default logger;
