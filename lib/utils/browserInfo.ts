/**
 * 브라우저 정보 수집 유틸리티
 * 백엔드 API 요구사항에 맞춘 브라우저 정보 수집
 */

export interface BrowserInfo {
  userAgent: string;
  browserName: string;
  browserVersion: string;
  deviceType: string;
  screenWidth: number;
  screenHeight: number;
  language: string;
  timezone: string;
}

/**
 * 브라우저 정보 수집
 */
export const getBrowserInfo = (): BrowserInfo => {
  if (typeof window === "undefined") {
    return {
      userAgent: "Unknown",
      browserName: "Unknown",
      browserVersion: "Unknown",
      deviceType: "desktop",
      screenWidth: 0,
      screenHeight: 0,
      language: "ko-KR",
      timezone: "Asia/Seoul",
    };
  }

  const ua = navigator.userAgent;
  const screen = window.screen;

  // 브라우저 감지
  let browserName = "Unknown";
  let browserVersion = "Unknown";

  if (ua.includes("Chrome") && !ua.includes("Edg")) {
    browserName = "Chrome";
    const match = ua.match(/Chrome\/(\d+)/);
    browserVersion = match ? match[1] : "Unknown";
  } else if (ua.includes("Firefox")) {
    browserName = "Firefox";
    const match = ua.match(/Firefox\/(\d+)/);
    browserVersion = match ? match[1] : "Unknown";
  } else if (ua.includes("Safari") && !ua.includes("Chrome")) {
    browserName = "Safari";
    const match = ua.match(/Version\/(\d+)/);
    browserVersion = match ? match[1] : "Unknown";
  } else if (ua.includes("Edg")) {
    browserName = "Edge";
    const match = ua.match(/Edg\/(\d+)/);
    browserVersion = match ? match[1] : "Unknown";
  }

  // 디바이스 타입 감지
  let deviceType = "desktop";
  if (/mobile/i.test(ua)) {
    deviceType = "mobile";
  } else if (/tablet/i.test(ua)) {
    deviceType = "tablet";
  }

  return {
    userAgent: ua,
    browserName,
    browserVersion,
    deviceType,
    screenWidth: screen.width,
    screenHeight: screen.height,
    language: navigator.language || (navigator as any).userLanguage || "ko-KR",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
};

/**
 * installationId 생성 및 관리
 */
export const getInstallationId = (): string => {
  if (typeof window === "undefined") {
    return "";
  }

  const STORAGE_KEY = "web_push_installation_id";

  try {
    let installationId = localStorage.getItem(STORAGE_KEY);

    if (!installationId) {
      installationId = `web_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 11)}`;
      localStorage.setItem(STORAGE_KEY, installationId);
    }

    return installationId;
  } catch (error) {
    console.error("브라우저 ID 생성 실패:", error);
    // localStorage 접근 실패 시 임시 ID 생성
    return `web_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
};
