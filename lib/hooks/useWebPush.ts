import { useState, useEffect, useCallback, useRef } from "react";
import {
  subscribeToPush,
  unsubscribeFromPush,
  getCurrentSubscription,
  requestNotificationPermission,
} from "../webPush";
import {
  registerWebPushToken,
  unregisterWebPushToken,
  getWebPushTokenStatus,
  toggleWebPushStatus,
} from "../api";

export interface PushSubscriptionData {
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface UseWebPushReturn {
  subscription: PushSubscriptionData | null;
  permission: NotificationPermission;
  isSupported: boolean;
  isLoading: boolean;
  error: string | null;
  isRegistered: boolean;
  requestPermission: () => Promise<void>;
  subscribe: () => Promise<PushSubscriptionData | null>;
  unsubscribe: () => Promise<void>;
  togglePushStatus: (isPush: boolean) => Promise<void>;
}

/**
 * Web Push API를 사용한 웹 푸시 알림 관리 훅
 */
export function useWebPush(): UseWebPushReturn {
  const [subscription, setSubscription] = useState<PushSubscriptionData | null>(
    null
  );
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

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

  // 기존 구독 정보 확인 및 자동 구독 (메모리 최적화: 한 번만 실행)
  const hasInitializedRef = useRef(false);
  useEffect(() => {
    if (!isSupported || isLoading || hasInitializedRef.current) return;

    const checkAndSubscribe = async () => {
      hasInitializedRef.current = true;
      try {
        const currentSubscription = await getCurrentSubscription();
        if (currentSubscription) {
          setSubscription(currentSubscription);

          // 백엔드에 등록되어 있는지 확인
          try {
            const status = await getWebPushTokenStatus(
              currentSubscription.endpoint
            );
            if (status.success && status.pushToken) {
              setIsRegistered(true);
            } else {
              // 구독은 있지만 백엔드에 등록되지 않은 경우 자동 등록
              console.log("구독은 있지만 백엔드에 미등록, 자동 등록 시도");
              try {
                await registerWebPushToken(currentSubscription);
                setIsRegistered(true);
                console.log("✅ 기존 구독 백엔드 자동 등록 완료");
              } catch (err) {
                console.error("백엔드 자동 등록 실패:", err);
              }
            }
          } catch (err) {
            // 등록되지 않은 경우 자동 등록 시도
            console.log("백엔드에 등록되지 않은 구독, 자동 등록 시도");
            try {
              await registerWebPushToken(currentSubscription);
              setIsRegistered(true);
              console.log("✅ 구독 백엔드 자동 등록 완료");
            } catch (err) {
              console.error("백엔드 자동 등록 실패:", err);
            }
          }
        } else if (permission === "granted") {
          // 구독이 없지만 권한이 있는 경우 자동 구독 시도
          console.log("권한은 있지만 구독이 없음, 자동 구독 시도");
          const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
          if (vapidKey) {
            try {
              const subscriptionData = await subscribeToPush(vapidKey);
              if (subscriptionData) {
                setSubscription(subscriptionData);
                await registerWebPushToken(subscriptionData);
                setIsRegistered(true);
                console.log("✅ 자동 푸시 구독 및 등록 완료");
              }
            } catch (err) {
              console.error("자동 구독 실패:", err);
            }
          }
        }
      } catch (err) {
        console.error("구독 정보 확인 실패:", err);
        hasInitializedRef.current = false; // 실패 시 재시도 가능하도록
      }
    };

    checkAndSubscribe();
  }, [isSupported, isLoading, permission]);

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

      if (permissionResult === "denied") {
        setError(
          "알림 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요."
        );
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.error("알림 권한 요청 실패:", err);
      setError(error.message || "알림 권한 요청에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // 푸시 구독 및 백엔드 등록
  const subscribe =
    useCallback(async (): Promise<PushSubscriptionData | null> => {
      if (!isSupported || permission !== "granted") {
        setError("알림 권한이 필요합니다.");
        return null;
      }

      try {
        setIsLoading(true);
        setError(null);

        // VAPID 공개 키 가져오기
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) {
          throw new Error("VAPID 공개 키가 설정되지 않았습니다.");
        }

        // 푸시 구독
        const subscriptionData = await subscribeToPush(vapidKey);
        if (!subscriptionData) {
          throw new Error("푸시 구독에 실패했습니다.");
        }

        setSubscription(subscriptionData);

        // 백엔드에 토큰 등록
        try {
          await registerWebPushToken(subscriptionData);
          setIsRegistered(true);
          console.log("✅ 웹 푸시 토큰 등록 완료");
        } catch (err) {
          console.error("백엔드 토큰 등록 실패:", err);
          // 구독은 성공했지만 백엔드 등록 실패는 경고만
          setError("푸시 구독은 완료되었지만 서버 등록에 실패했습니다.");
        }

        return subscriptionData;
      } catch (err: unknown) {
        const error = err as { message?: string };
        console.error("푸시 구독 실패:", err);
        setError(error.message || "푸시 구독에 실패했습니다.");
        return null;
      } finally {
        setIsLoading(false);
      }
    }, [isSupported, permission]);

  // 푸시 구독 해제 및 백엔드 삭제
  const unsubscribe = useCallback(async () => {
    if (!subscription) return;

    try {
      setIsLoading(true);
      setError(null);

      // 백엔드에서 토큰 삭제
      try {
        await unregisterWebPushToken(subscription.endpoint);
      } catch (err) {
        console.error("백엔드 토큰 삭제 실패:", err);
      }

      // 브라우저에서 구독 해제
      await unsubscribeFromPush();

      setSubscription(null);
      setIsRegistered(false);
      console.log("✅ 푸시 구독 해제 완료");
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.error("푸시 구독 해제 실패:", err);
      setError(error.message || "푸시 구독 해제에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [subscription]);

  // 푸시 알림 상태 토글
  const togglePushStatus = useCallback(
    async (isPush: boolean) => {
      if (!subscription) {
        setError("푸시 구독이 필요합니다.");
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        await toggleWebPushStatus(subscription.endpoint, isPush);
        console.log(`✅ 푸시 알림 ${isPush ? "활성화" : "비활성화"} 완료`);
      } catch (err: unknown) {
        const error = err as { message?: string };
        console.error("푸시 상태 변경 실패:", err);
        setError(error.message || "푸시 상태 변경에 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    },
    [subscription]
  );

  return {
    subscription,
    permission,
    isSupported,
    isLoading,
    error,
    isRegistered,
    requestPermission,
    subscribe,
    unsubscribe,
    togglePushStatus,
  };
}
