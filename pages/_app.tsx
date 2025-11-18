import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  registerServiceWorker,
  getCurrentSubscription,
  subscribeToPush,
  requestNotificationPermission,
} from "../lib/webPush";
import { registerWebPushToken } from "../lib/api";
import "../styles/globals.css";

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Service Worker 등록 및 푸시 구독 초기화
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const initializeWebPush = async () => {
        console.log("🚀 [웹 푸시 초기화] 시작");
        try {
          // Service Worker 등록
          console.log("📝 [웹 푸시 초기화] Service Worker 등록 시작");
          await registerServiceWorker("/sw.js");
          console.log("✅ [웹 푸시 초기화] Service Worker 등록 완료");

          // Service Worker가 준비될 때까지 대기
          console.log("⏳ [웹 푸시 초기화] Service Worker 준비 대기 중...");
          await navigator.serviceWorker.ready;
          console.log("✅ [웹 푸시 초기화] Service Worker 준비 완료");

          // 기존 구독 확인
          console.log("🔍 [웹 푸시 초기화] 기존 구독 확인 중...");
          const existingSubscription = await getCurrentSubscription();
          console.log("📊 [웹 푸시 초기화] 기존 구독 상태:", {
            hasSubscription: !!existingSubscription,
            endpoint: existingSubscription?.endpoint?.substring(0, 50) + "...",
          });

          if (existingSubscription) {
            // 기존 구독이 있으면 백엔드에 등록되어 있는지 확인 및 등록
            console.log("🔍 [웹 푸시 초기화] 백엔드 등록 상태 확인 중...");
            try {
              const { getWebPushTokenStatus } = await import("../lib/api");
              const status = await getWebPushTokenStatus(
                existingSubscription.endpoint
              );
              console.log("📊 [웹 푸시 초기화] 백엔드 상태:", {
                success: status.success,
                hasPushToken: !!status.pushToken,
              });

              if (!status.success || !status.pushToken) {
                // 백엔드에 등록되지 않은 경우 자동 등록
                console.log("📝 [웹 푸시 초기화] 백엔드 자동 등록 시작");
                await registerWebPushToken(existingSubscription);
                console.log(
                  "✅ [웹 푸시 초기화] 기존 구독 백엔드 자동 등록 완료"
                );
              } else {
                console.log("✅ [웹 푸시 초기화] 이미 백엔드에 등록됨");
              }
            } catch (err) {
              // 백엔드 조회 실패 시 자동 등록 시도
              console.warn(
                "⚠️ [웹 푸시 초기화] 백엔드 조회 실패, 자동 등록 시도:",
                err
              );
              try {
                await registerWebPushToken(existingSubscription);
                console.log("✅ [웹 푸시 초기화] 구독 백엔드 자동 등록 완료");
              } catch (registerErr) {
                console.error(
                  "❌ [웹 푸시 초기화] 백엔드 자동 등록 실패:",
                  registerErr
                );
              }
            }
          } else {
            // 구독이 없으면 권한 확인 및 요청
            const currentPermission = Notification.permission;
            console.log(
              "📊 [웹 푸시 초기화] 알림 권한 상태:",
              currentPermission
            );

            let permission = currentPermission;

            // 권한이 default 상태면 자동으로 요청 시도
            if (permission === "default") {
              console.log("📝 [웹 푸시 초기화] 알림 권한 요청 시작");
              try {
                permission = await requestNotificationPermission();
                console.log("📊 [웹 푸시 초기화] 권한 요청 결과:", permission);
              } catch (err) {
                console.error("❌ [웹 푸시 초기화] 권한 요청 실패:", err);
                permission = "denied";
              }
            }

            if (permission === "granted") {
              const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
              console.log("🔑 [웹 푸시 초기화] VAPID 키 확인:", {
                hasVapidKey: !!vapidKey,
                keyPreview: vapidKey
                  ? vapidKey.substring(0, 20) + "..."
                  : "없음",
              });

              if (vapidKey) {
                try {
                  console.log("📝 [웹 푸시 초기화] 자동 구독 시작");
                  const subscriptionData = await subscribeToPush(vapidKey);
                  if (subscriptionData) {
                    console.log(
                      "✅ [웹 푸시 초기화] 구독 성공, 백엔드 등록 시작"
                    );
                    await registerWebPushToken(subscriptionData);
                    console.log(
                      "✅ [웹 푸시 초기화] 자동 푸시 구독 및 등록 완료"
                    );
                  } else {
                    console.warn("⚠️ [웹 푸시 초기화] 구독 데이터가 없음");
                  }
                } catch (err) {
                  console.error("❌ [웹 푸시 초기화] 자동 구독 실패:", err);
                }
              } else {
                console.warn("⚠️ [웹 푸시 초기화] VAPID 키가 설정되지 않음");
              }
            } else if (permission === "denied") {
              console.log(
                "ℹ️ [웹 푸시 초기화] 알림 권한이 거부되어 자동 구독 건너뜀"
              );
            } else {
              console.log(
                "ℹ️ [웹 푸시 초기화] 알림 권한이 없어 자동 구독 건너뜀:",
                permission
              );
            }
          }

          console.log("✅ [웹 푸시 초기화] 완료");
        } catch (error) {
          console.error("❌ [웹 푸시 초기화] 실패:", error);
        }
      };

      initializeWebPush();

      // Service Worker 메시지 리스너 등록
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.addEventListener("message", (event) => {
          console.log(
            "📨 [클라이언트] Service Worker 메시지 수신:",
            event.data
          );

          if (event.data.type === "NOTIFICATION_SHOWN") {
            console.log(
              "✅ [클라이언트] Service Worker가 알림 표시를 시도했습니다:",
              event.data.data
            );

            // 실제로 알림이 표시되었는지 확인
            // Service Worker가 알림을 표시했다고 해도 브라우저가 차단할 수 있음
            if (
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              // 약간의 지연 후 알림이 실제로 표시되었는지 확인
              setTimeout(() => {
                // Service Worker의 활성 알림 확인
                navigator.serviceWorker.ready.then(async (registration) => {
                  try {
                    const notifications = await registration.getNotifications({
                      tag: event.data.data?.tag || "default",
                    });
                    console.log(
                      "📊 [클라이언트] 현재 활성 알림 수:",
                      notifications.length
                    );

                    if (notifications.length === 0) {
                      console.warn(
                        "⚠️ [클라이언트] 알림이 표시되지 않았습니다. 브라우저 설정을 확인하세요."
                      );
                      console.warn("⚠️ [클라이언트] 가능한 원인:");
                      console.warn(
                        "  1. 브라우저가 알림을 차단하고 있을 수 있습니다"
                      );
                      console.warn(
                        "  2. '방해 금지' 모드가 활성화되어 있을 수 있습니다"
                      );
                      console.warn(
                        "  3. 브라우저 설정에서 알림이 비활성화되어 있을 수 있습니다"
                      );

                      // 사용자에게 안내
                      if (
                        window.location.hostname === "localhost" ||
                        window.location.hostname === "127.0.0.1"
                      ) {
                        console.warn(
                          "⚠️ [클라이언트] localhost에서는 일부 브라우저가 알림을 제한할 수 있습니다"
                        );
                      }
                    } else {
                      console.log(
                        "✅ [클라이언트] 알림이 성공적으로 표시되었습니다:",
                        notifications[0].title
                      );
                    }
                  } catch (error) {
                    console.error("❌ [클라이언트] 알림 확인 실패:", error);
                  }
                });
              }, 200);
            }
          } else if (event.data.type === "NOTIFICATION_ERROR") {
            console.error("❌ [클라이언트] 알림 표시 실패:", event.data.error);

            // 알림 권한 상태 확인
            const permission = Notification.permission;
            console.log("📊 [클라이언트] 현재 알림 권한 상태:", permission);

            if (permission !== "granted") {
              const message = `알림 권한이 필요합니다.\n현재 상태: ${permission}\n브라우저 설정에서 알림 권한을 허용해주세요.`;
              console.warn("⚠️ [클라이언트]", message);
              // 사용자에게 알림 권한 요청 안내
              if (confirm(message + "\n\n지금 권한을 요청하시겠습니까?")) {
                requestNotificationPermission().then((result) => {
                  console.log("📊 [클라이언트] 권한 요청 결과:", result);
                  if (result === "granted") {
                    alert(
                      "알림 권한이 허용되었습니다. 이제 알림을 받을 수 있습니다."
                    );
                  } else {
                    alert(
                      "알림 권한이 거부되었습니다. 브라우저 설정에서 수동으로 권한을 허용해주세요."
                    );
                  }
                });
              }
            } else {
              alert(
                `알림 표시 실패: ${event.data.error}\n브라우저 설정에서 알림 권한을 확인해주세요.`
              );
            }
          }
        });

        // Service Worker에 알림 권한 상태 전달
        navigator.serviceWorker.ready.then((registration) => {
          const permission = Notification.permission;
          console.log(
            "📤 [클라이언트] Service Worker에 권한 상태 전달:",
            permission
          );
          registration.active?.postMessage({
            type: "NOTIFICATION_PERMISSION_STATUS",
            permission: permission,
          });
        });
      }
    } else {
      console.log("ℹ️ [웹 푸시 초기화] Service Worker를 지원하지 않는 환경");
    }
  }, []);

  // 클라이언트 사이드 하이드레이션 문제 방지
  if (!mounted) {
    return null;
  }

  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}
