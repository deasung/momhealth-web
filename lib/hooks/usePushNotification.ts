import { useState, useEffect, useCallback } from "react";
import {
  initializeFirebase,
  initializeMessaging,
  getFCMToken,
  requestNotificationPermission,
  onForegroundMessage,
} from "../firebase";
import {
  getCurrentToken,
  registerPushToken,
  unregisterPushToken,
} from "../api";

interface UsePushNotificationReturn {
  token: string | null;
  permission: NotificationPermission;
  isSupported: boolean;
  isLoading: boolean;
  error: string | null;
  requestPermission: () => Promise<void>;
  registerToken: () => Promise<string | null>;
  unregisterToken: () => Promise<void>;
}

/**
 * 웹 푸시 알림을 관리하는 훅
 */
export function usePushNotification(): UsePushNotificationReturn {
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 브라우저 지원 여부 확인
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkSupport = () => {
      const supported =
        "Notification" in window &&
        "serviceWorker" in navigator &&
        "PushManager" in window;

      setIsSupported(supported);

      if (supported && "Notification" in window) {
        setPermission(Notification.permission);
      }

      setIsLoading(false);
    };

    checkSupport();
  }, []);

  // Firebase 초기화
  useEffect(() => {
    if (!isSupported || isLoading) return;

    try {
      initializeFirebase();
      initializeMessaging();
    } catch (err) {
      console.error("Firebase 초기화 실패:", err);
      setError("Firebase 초기화에 실패했습니다.");
    }
  }, [isSupported, isLoading]);

  // 포그라운드 메시지 수신 처리
  useEffect(() => {
    if (!isSupported || permission !== "granted") return;

    const unsubscribe = onForegroundMessage((payload) => {
      console.log("포그라운드 메시지 수신:", payload);

      // 브라우저 알림 표시
      if ("Notification" in window && Notification.permission === "granted") {
        const notificationTitle = payload.notification?.title || "새로운 알림";
        const notificationOptions: NotificationOptions = {
          body: payload.notification?.body || "",
          icon: payload.notification?.icon || "/icon-192x192.png",
          badge: "/badge-72x72.png",
          tag: payload.data?.tag || "default",
          data: payload.data || {},
        };

        new Notification(notificationTitle, notificationOptions);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isSupported, permission]);

  // 알림 권한 요청
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      setError("이 브라우저는 푸시 알림을 지원하지 않습니다.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const permissionResult = await requestNotificationPermission();
      setPermission(permissionResult);

      if (permissionResult === "granted") {
        // 권한이 승인되면 토큰 자동 발급
        await registerToken();
      } else if (permissionResult === "denied") {
        setError(
          "알림 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요."
        );
      }
    } catch (err: any) {
      console.error("알림 권한 요청 실패:", err);
      setError(err.message || "알림 권한 요청에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // 푸시 토큰 등록
  const registerToken = useCallback(async (): Promise<string | null> => {
    if (!isSupported || permission !== "granted") {
      setError("알림 권한이 필요합니다.");
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      const fcmToken = await getFCMToken();
      if (!fcmToken) {
        setError("FCM 토큰을 가져올 수 없습니다.");
        return null;
      }

      setToken(fcmToken);

      // 백엔드에 토큰 등록
      const userToken = getCurrentToken();
      if (userToken) {
        try {
          await registerPushToken(fcmToken);
          console.log("✅ 푸시 토큰 등록 완료");
        } catch (err) {
          console.error("백엔드 토큰 등록 실패:", err);
          // 토큰은 저장했지만 백엔드 등록 실패는 경고만
        }
      }

      return fcmToken;
    } catch (err: any) {
      console.error("푸시 토큰 등록 실패:", err);
      setError(err.message || "푸시 토큰 등록에 실패했습니다.");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, permission]);

  // 푸시 토큰 해제
  const unregisterToken = useCallback(async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      setError(null);

      const userToken = getCurrentToken();
      if (userToken) {
        try {
          await unregisterPushToken(token);
        } catch (err) {
          console.error("백엔드 토큰 해제 실패:", err);
        }
      }

      setToken(null);
      console.log("✅ 푸시 토큰 해제 완료");
    } catch (err: any) {
      console.error("푸시 토큰 해제 실패:", err);
      setError(err.message || "푸시 토큰 해제에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  return {
    token,
    permission,
    isSupported,
    isLoading,
    error,
    requestPermission,
    registerToken,
    unregisterToken,
  };
}
