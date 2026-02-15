// lib/firebaseClient.ts 같은 곳

import { logger } from "@/lib/logger";
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  Messaging,
  onMessage,
} from "firebase/messaging";
import {
  getAnalytics,
  isSupported,
  Analytics,
  logEvent,
} from "firebase/analytics";

// Firebase 설정 타입
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

// 환경 변수에서 Firebase 설정 가져오기
const getFirebaseConfig = (): FirebaseConfig | null => {
  if (typeof window === "undefined") return null;

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId =
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  // 필수 값 확인 (빈 문자열도 체크)
  if (
    !apiKey ||
    !authDomain ||
    !projectId ||
    !storageBucket ||
    !messagingSenderId ||
    !appId
  ) {
    // 환경 변수가 없을 때만 조용히 반환 (콘솔 에러 방지)
    return null;
  }

  const config: FirebaseConfig = {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  return config;
};

// Firebase 앱 / Messaging / Analytics 인스턴스
let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;
let analytics: Analytics | null = null;

// Firebase 앱 초기화
export const initializeFirebase = (): FirebaseApp | null => {
  if (typeof window === "undefined") return null;

  // 이미 초기화된 경우 기존 인스턴스 반환
  const existingApps = getApps();
  if (existingApps.length > 0) {
    app = existingApps[0];
    return app;
  }

  const config = getFirebaseConfig();
  if (!config) {
    // 환경 변수가 없으면 조용히 반환 (에러 로그 방지)
    return null;
  }

  try {
    app = initializeApp(config);
    return app;
  } catch (error) {
    // 초기화 실패 시 조용히 반환 (에러 로그 방지)
    return null;
  }
};

// Firebase Messaging 초기화
export const initializeMessaging = (): Messaging | null => {
  if (typeof window === "undefined") return null;
  if (messaging) return messaging;

  if (!app) {
    app = initializeFirebase();
    if (!app) return null;
  }

  try {
    messaging = getMessaging(app);
    return messaging;
  } catch (error) {
    // 초기화 실패 시 조용히 반환 (에러 로그 방지)
    return null;
  }
};

// Firebase Analytics 초기화
export const initializeAnalytics = async (): Promise<Analytics | null> => {
  if (typeof window === "undefined") return null;
  if (analytics) return analytics;

  if (!app) {
    app = initializeFirebase();
    if (!app) return null;
  }

  try {
    const supported = await isSupported();
    if (!supported) {
      return null;
    }

    analytics = getAnalytics(app);
    return analytics;
  } catch (error) {
    // 초기화 실패 시 조용히 반환 (에러 로그 방지)
    return null;
  }
};

// 푸시 토큰 가져오기
export const getFCMToken = async (): Promise<string | null> => {
  if (typeof window === "undefined") return null;

  const messagingInstance = initializeMessaging();
  if (!messagingInstance) {
    logger.warn("⚠️ Messaging이 초기화되지 않았습니다.");
    return null;
  }

  try {
    // VAPID 키는 Service Worker에서 사용됩니다
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      logger.warn("⚠️ VAPID 키가 설정되지 않았습니다.");
      return null;
    }

    const token = await getToken(messagingInstance, {
      vapidKey,
    });

    if (token) {
      logger.info("✅ FCM 토큰 발급 성공:", token.substring(0, 20) + "...");
      return token;
    } else {
      logger.warn("⚠️ FCM 토큰을 가져올 수 없습니다. 알림 권한을 확인하세요.");
      return null;
    }
  } catch (error) {
    logger.error("❌ FCM 토큰 발급 실패:", error);
    return null;
  }
};

// 포그라운드 메시지 수신 처리
export const onForegroundMessage = (
  callback: (payload: any) => void
): (() => void) | null => {
  if (typeof window === "undefined") return null;

  const messagingInstance = initializeMessaging();
  if (!messagingInstance) return null;

  try {
    return onMessage(messagingInstance, callback);
  } catch (error) {
    logger.error("❌ 포그라운드 메시지 리스너 등록 실패:", error);
    return null;
  }
};

// 알림 권한 확인
export const requestNotificationPermission =
  async (): Promise<NotificationPermission> => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "denied";
    }

    if (Notification.permission === "granted") {
      return "granted";
    }

    if (Notification.permission === "denied") {
      logger.warn("⚠️ 알림 권한이 거부되었습니다.");
      return "denied";
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      logger.error("❌ 알림 권한 요청 실패:", error);
      return "denied";
    }
  };

// Analytics용 래퍼 (이벤트 로깅)
export const logAnalyticsEvent = async (
  eventName: string,
  params?: Record<string, any>
) => {
  const analyticsInstance = await initializeAnalytics();
  if (!analyticsInstance) return;

  try {
    logEvent(analyticsInstance, eventName, params);
  } catch (error) {
    // Analytics 이벤트 로깅 실패는 조용히 무시 (에러 로그 방지)
  }
};

export { app, messaging, analytics };
