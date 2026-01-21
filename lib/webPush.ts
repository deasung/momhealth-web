/**
 * Web Push API를 사용한 웹 푸시 알림 관리
 * 백엔드 API와 연동하여 endpoint, p256dh, auth를 사용
 */

import { logger } from "@/lib/logger";

/**
 * VAPID 공개 키를 Uint8Array로 변환
 */
export const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
};

/**
 * Service Worker 등록
 */
export const registerServiceWorker = async (
  swPath: string = "/sw.js"
): Promise<ServiceWorkerRegistration | null> => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    logger.warn("⚠️ Service Worker를 지원하지 않는 브라우저입니다.");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(swPath, {
      scope: "/",
    });
    logger.info("✅ Service Worker 등록 완료:", registration.scope);
    return registration;
  } catch (error) {
    logger.error("❌ Service Worker 등록 실패:", error);
    return null;
  }
};

/**
 * 푸시 알림 권한 요청
 */
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

/**
 * 푸시 구독 정보 타입
 */
export interface PushSubscriptionData {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * 푸시 알림 구독
 */
export const subscribeToPush = async (
  vapidPublicKey: string
): Promise<PushSubscriptionData | null> => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    // Service Worker 등록
    const registration = await registerServiceWorker();
    if (!registration) {
      throw new Error("Service Worker 등록 실패");
    }

    // Service Worker가 활성화될 때까지 대기
    await navigator.serviceWorker.ready;

    // 푸시 알림 권한 확인
    const permission = await requestNotificationPermission();
    if (permission !== "granted") {
      throw new Error("푸시 알림 권한이 거부되었습니다.");
    }

    // 기존 구독 확인
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // 새 구독 생성
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource,
      });
    }

    // 구독 정보 추출
    const subscriptionData = subscription.toJSON();
    const keys = subscriptionData.keys;

    if (!subscriptionData.endpoint || !keys?.p256dh || !keys?.auth) {
      throw new Error("구독 정보가 불완전합니다.");
    }

    return {
      endpoint: subscriptionData.endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    };
  } catch (error) {
    logger.error("❌ 푸시 구독 실패:", error);
    return null;
  }
};

/**
 * 푸시 구독 해제
 */
export const unsubscribeFromPush = async (): Promise<boolean> => {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      logger.info("✅ 푸시 구독 해제 완료");
      return true;
    }

    return false;
  } catch (error) {
    logger.error("❌ 푸시 구독 해제 실패:", error);
    return false;
  }
};

/**
 * 현재 푸시 구독 정보 가져오기
 */
export const getCurrentSubscription =
  async (): Promise<PushSubscriptionData | null> => {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        return null;
      }

      const subscriptionData = subscription.toJSON();
      const keys = subscriptionData.keys;

      if (!subscriptionData.endpoint || !keys?.p256dh || !keys?.auth) {
        return null;
      }

      return {
        endpoint: subscriptionData.endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      };
    } catch (error) {
      logger.error("❌ 구독 정보 조회 실패:", error);
      return null;
    }
  };
