import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  Messaging,
  onMessage,
} from "firebase/messaging";

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

  const config: FirebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  // 필수 값 확인
  if (
    !config.apiKey ||
    !config.authDomain ||
    !config.projectId ||
    !config.storageBucket ||
    !config.messagingSenderId ||
    !config.appId
  ) {
    console.warn(
      "⚠️ Firebase 설정이 완전하지 않습니다. 환경 변수를 확인하세요."
    );
    return null;
  }

  return config;
};

// Firebase 앱 초기화
let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

export const initializeFirebase = (): FirebaseApp | null => {
  if (typeof window === "undefined") return null;

  // 이미 초기화된 경우 기존 인스턴스 반환
  const existingApps = getApps();
  if (existingApps.length > 0) {
    app = existingApps[0];
    return app;
  }

  const config = getFirebaseConfig();
  if (!config) return null;

  try {
    app = initializeApp(config);
    console.log("✅ Firebase 초기화 완료");
    return app;
  } catch (error) {
    console.error("❌ Firebase 초기화 실패:", error);
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
    console.log("✅ Firebase Messaging 초기화 완료");
    return messaging;
  } catch (error) {
    console.error("❌ Firebase Messaging 초기화 실패:", error);
    return null;
  }
};

// 푸시 토큰 가져오기
export const getFCMToken = async (): Promise<string | null> => {
  if (typeof window === "undefined") return null;

  const messagingInstance = initializeMessaging();
  if (!messagingInstance) {
    console.warn("⚠️ Messaging이 초기화되지 않았습니다.");
    return null;
  }

  try {
    // VAPID 키는 Service Worker에서 사용됩니다
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn("⚠️ VAPID 키가 설정되지 않았습니다.");
      return null;
    }

    const token = await getToken(messagingInstance, {
      vapidKey,
    });

    if (token) {
      console.log("✅ FCM 토큰 발급 성공:", token.substring(0, 20) + "...");
      return token;
    } else {
      console.warn("⚠️ FCM 토큰을 가져올 수 없습니다. 알림 권한을 확인하세요.");
      return null;
    }
  } catch (error) {
    console.error("❌ FCM 토큰 발급 실패:", error);
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
    console.error("❌ 포그라운드 메시지 리스너 등록 실패:", error);
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
      console.warn("⚠️ 알림 권한이 거부되었습니다.");
      return "denied";
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      console.error("❌ 알림 권한 요청 실패:", error);
      return "denied";
    }
  };

export { app, messaging };
