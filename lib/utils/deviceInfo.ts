/**
 * 웹 환경에서 디바이스 정보를 수집하는 유틸리티
 */

/**
 * 브라우저 고유 ID 생성 및 관리 (installationId 대체)
 * localStorage에 저장하여 브라우저별로 고유한 ID 유지
 */
export const getBrowserId = (): string => {
  if (typeof window === "undefined") {
    return "";
  }

  const STORAGE_KEY = "momhealth_browser_id";

  try {
    let browserId = localStorage.getItem(STORAGE_KEY);

    if (!browserId) {
      // UUID v4 생성 (간단한 버전)
      browserId = generateUUID();
      localStorage.setItem(STORAGE_KEY, browserId);
    }

    return browserId;
  } catch (error) {
    console.error("브라우저 ID 생성 실패:", error);
    // localStorage 접근 실패 시 임시 ID 생성
    return generateUUID();
  }
};

/**
 * 간단한 UUID v4 생성
 */
const generateUUID = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * User-Agent에서 브라우저 정보 추출
 */
export const getBrowserInfo = () => {
  if (typeof window === "undefined" || !navigator.userAgent) {
    return {
      osName: "Unknown",
      osVersion: "Unknown",
      deviceName: "Unknown",
      modelName: "Unknown",
      brand: "Unknown",
      manufacturer: "Unknown",
    };
  }

  const ua = navigator.userAgent;
  let osName = "Unknown";
  let osVersion = "Unknown";
  let deviceName = "Desktop";
  let modelName = "Unknown";
  let brand = "Unknown";
  let manufacturer = "Unknown";

  // OS 감지
  if (ua.includes("Windows")) {
    osName = "Windows";
    if (ua.includes("Windows NT 10.0")) osVersion = "10";
    else if (ua.includes("Windows NT 6.3")) osVersion = "8.1";
    else if (ua.includes("Windows NT 6.2")) osVersion = "8";
    else if (ua.includes("Windows NT 6.1")) osVersion = "7";
  } else if (ua.includes("Mac OS X")) {
    osName = "macOS";
    const match = ua.match(/Mac OS X (\d+)[._](\d+)/);
    if (match) {
      osVersion = `${match[1]}.${match[2]}`;
    }
  } else if (ua.includes("Linux")) {
    osName = "Linux";
    osVersion = "Unknown";
  } else if (ua.includes("Android")) {
    osName = "Android";
    const match = ua.match(/Android (\d+(?:\.\d+)?)/);
    if (match) {
      osVersion = match[1];
    }
    deviceName = "Mobile";
    brand = "Android";
    manufacturer = "Android";
  } else if (ua.includes("iPhone") || ua.includes("iPad")) {
    osName = "iOS";
    const match = ua.match(/OS (\d+)[._](\d+)/);
    if (match) {
      osVersion = `${match[1]}.${match[2]}`;
    }
    deviceName = ua.includes("iPad") ? "Tablet" : "Mobile";
    brand = "Apple";
    manufacturer = "Apple";
  }

  // 브라우저 감지
  if (ua.includes("Chrome") && !ua.includes("Edg")) {
    brand = "Google";
    manufacturer = "Google";
    const match = ua.match(/Chrome\/(\d+)/);
    if (match) {
      modelName = `Chrome ${match[1]}`;
    }
  } else if (ua.includes("Firefox")) {
    brand = "Mozilla";
    manufacturer = "Mozilla";
    const match = ua.match(/Firefox\/(\d+)/);
    if (match) {
      modelName = `Firefox ${match[1]}`;
    }
  } else if (ua.includes("Safari") && !ua.includes("Chrome")) {
    brand = "Apple";
    manufacturer = "Apple";
    modelName = "Safari";
  } else if (ua.includes("Edg")) {
    brand = "Microsoft";
    manufacturer = "Microsoft";
    const match = ua.match(/Edg\/(\d+)/);
    if (match) {
      modelName = `Edge ${match[1]}`;
    }
  }

  return {
    osName,
    osVersion,
    deviceName,
    modelName,
    brand,
    manufacturer,
  };
};

/**
 * 웹 푸시 토큰 등록에 필요한 모든 디바이스 정보 수집
 */
export const getWebDeviceInfo = () => {
  const browserId = getBrowserId();
  const browserInfo = getBrowserInfo();

  return {
    installationId: browserId, // 웹에서는 브라우저 ID를 installationId로 사용
    ...browserInfo,
    platform: "web",
  };
};
