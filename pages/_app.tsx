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

// 페이지 내 알림 표시 함수
const showInPageNotification = (
  title: string,
  body: string,
  onClick?: () => void
) => {
  // 기존 알림이 있으면 제거
  const existing = document.getElementById("in-page-notification");
  if (existing) {
    existing.remove();
  }

  // 알림 요소 생성
  const notification = document.createElement("div");
  notification.id = "in-page-notification";
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #fff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    padding: 16px 20px;
    min-width: 300px;
    max-width: 400px;
    z-index: 9999;
    cursor: pointer;
    animation: slideIn 0.3s ease-out;
  `;

  notification.innerHTML = `
    <div style="display: flex; align-items: flex-start; gap: 12px;">
      <div style="flex: 1;">
        <div style="font-weight: 600; font-size: 16px; margin-bottom: 4px; color: #333;">
          ${title}
        </div>
        <div style="font-size: 14px; color: #666; line-height: 1.4;">
          ${body}
        </div>
      </div>
      <button id="close-notification" style="
        background: none;
        border: none;
        font-size: 20px;
        color: #999;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">×</button>
    </div>
    <style>
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    </style>
  `;

  // 클릭 이벤트
  if (onClick) {
    notification.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).id !== "close-notification") {
        onClick();
        notification.remove();
      }
    });
  }

  // 닫기 버튼
  const closeBtn = notification.querySelector("#close-notification");
  if (closeBtn) {
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      notification.remove();
    });
  }

  document.body.appendChild(notification);

  // 5초 후 자동 제거
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = "slideOut 0.3s ease-out";
      setTimeout(() => {
        notification.remove();
      }, 300);
    }
  }, 5000);
};

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  const [mounted, setMounted] = useState(false);

  // 서버 사이드에서는 항상 렌더링 (SEO를 위해)
  const isServer = typeof window === "undefined";

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

            // 포그라운드에서도 알림을 표시하도록 클라이언트에서 처리
            if (
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              const notificationData = event.data.data;

              // 약간의 지연 후 알림이 실제로 표시되었는지 확인
              setTimeout(async () => {
                try {
                  // Service Worker의 활성 알림 확인
                  const registration = await navigator.serviceWorker.ready;
                  const notifications = await registration.getNotifications({
                    tag: notificationData?.tag || "default",
                  });
                  console.log(
                    "📊 [클라이언트] 현재 활성 알림 수:",
                    notifications.length
                  );

                  if (notifications.length === 0) {
                    console.warn(
                      "⚠️ [클라이언트] Service Worker 알림이 표시되지 않았습니다. 클라이언트에서 직접 표시 시도..."
                    );

                    // 클라이언트에서 직접 알림 표시 (포그라운드 대응)
                    try {
                      // 알림 권한 재확인
                      if (Notification.permission !== "granted") {
                        console.error(
                          "❌ [클라이언트] 알림 권한이 없습니다:",
                          Notification.permission
                        );
                        // 권한이 없어도 페이지 내 알림은 표시
                        showInPageNotification(
                          notificationData.title || "새로운 알림",
                          notificationData.body || "",
                          () => {
                            const url = notificationData.data?.url || "/";
                            window.location.href = url;
                          }
                        );
                        return;
                      }

                      const clientNotification = new Notification(
                        notificationData.title || "새로운 알림",
                        {
                          body: notificationData.body || "",
                          icon: notificationData.icon || "/icon-192x192.png",
                          badge: notificationData.badge || "/badge-72x72.png",
                          tag: notificationData.tag || "default",
                          data: notificationData.data || {},
                          requireInteraction: true, // 사용자가 클릭할 때까지 유지
                        }
                      );

                      console.log(
                        "✅ [클라이언트] 클라이언트 알림 객체 생성 성공:",
                        clientNotification.title
                      );

                      // 알림이 실제로 표시되었는지 확인
                      let notificationClosed = false;
                      clientNotification.onclose = () => {
                        console.log("📱 [클라이언트] 알림이 닫혔습니다.");
                        notificationClosed = true;
                      };

                      // 알림 에러 이벤트
                      clientNotification.onerror = (error) => {
                        console.error("❌ [클라이언트] 알림 에러 발생:", error);
                        // 에러 발생 시 페이지 내 알림 표시
                        showInPageNotification(
                          notificationData.title || "새로운 알림",
                          notificationData.body || "",
                          () => {
                            const url = notificationData.data?.url || "/";
                            window.location.href = url;
                          }
                        );
                      };

                      // 알림 클릭 이벤트 처리
                      clientNotification.onclick = (event) => {
                        event.preventDefault();
                        clientNotification.close();
                        const url = notificationData.data?.url || "/";
                        window.focus();
                        window.location.href = url;
                      };

                      // 1초 후에도 알림이 닫히지 않았다면 표시된 것으로 간주
                      // 하지만 브라우저가 알림을 차단했을 수 있으므로 페이지 내 알림도 함께 표시
                      setTimeout(() => {
                        if (!notificationClosed) {
                          // 브라우저 알림이 표시되었을 수도 있지만, 확실하게 하기 위해 페이지 내 알림도 표시
                          showInPageNotification(
                            notificationData.title || "새로운 알림",
                            notificationData.body || "",
                            () => {
                              const url = notificationData.data?.url || "/";
                              window.location.href = url;
                            }
                          );
                        }
                      }, 1000);
                    } catch (clientNotifError: any) {
                      console.error(
                        "❌ [클라이언트] 클라이언트 알림 표시 실패:",
                        clientNotifError
                      );
                      console.error("에러 상세:", {
                        name: clientNotifError.name,
                        message: clientNotifError.message,
                        stack: clientNotifError.stack,
                      });

                      // 에러 발생 시 페이지 내 알림 표시
                      showInPageNotification(
                        notificationData.title || "새로운 알림",
                        notificationData.body || "",
                        () => {
                          const url = notificationData.data?.url || "/";
                          window.location.href = url;
                        }
                      );
                    }
                  } else {
                    console.log(
                      "✅ [클라이언트] Service Worker 알림이 성공적으로 표시되었습니다:",
                      notifications[0].title
                    );
                    // Service Worker 알림이 표시되었어도 페이지 내 알림도 함께 표시 (확실하게)
                    showInPageNotification(
                      notificationData.title || "새로운 알림",
                      notificationData.body || "",
                      () => {
                        const url = notificationData.data?.url || "/";
                        window.location.href = url;
                      }
                    );
                  }
                } catch (error) {
                  console.error("❌ [클라이언트] 알림 확인 실패:", error);
                }
              }, 200);
            }
          } else if (event.data.type === "SHOW_NOTIFICATION") {
            // Service Worker에서 포그라운드 알림 표시 요청
            console.log(
              "📢 [클라이언트] 포그라운드 알림 표시 요청:",
              event.data.data
            );

            if (
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              const notificationData = event.data.data;

              // 포그라운드 알림은 항상 페이지 내 알림으로 표시 (브라우저 알림이 차단될 수 있으므로)
              showInPageNotification(
                notificationData.title || "새로운 알림",
                notificationData.body || "",
                () => {
                  const url = notificationData.data?.url || "/";
                  window.location.href = url;
                }
              );

              // 브라우저 알림도 시도 (선택적)
              if (
                "Notification" in window &&
                Notification.permission === "granted"
              ) {
                try {
                  const clientNotification = new Notification(
                    notificationData.title || "새로운 알림",
                    {
                      body: notificationData.body || "",
                      icon: notificationData.icon || "/icon-192x192.png",
                      badge: notificationData.badge || "/badge-72x72.png",
                      tag: notificationData.tag || "default",
                      data: notificationData.data || {},
                      requireInteraction: true,
                    }
                  );

                  console.log(
                    "✅ [클라이언트] 포그라운드 알림 객체 생성 성공:",
                    clientNotification.title
                  );

                  // 알림 클릭 이벤트 처리
                  clientNotification.onclick = (event) => {
                    event.preventDefault();
                    clientNotification.close();
                    const url = notificationData.data?.url || "/";
                    window.focus();
                    window.location.href = url;
                  };

                  // 알림 닫기 이벤트 (디버깅용)
                  clientNotification.onclose = () => {
                    console.log(
                      "📱 [클라이언트] 포그라운드 알림이 닫혔습니다."
                    );
                  };

                  // 알림 에러 이벤트
                  clientNotification.onerror = (error) => {
                    console.error(
                      "❌ [클라이언트] 포그라운드 알림 에러 발생:",
                      error
                    );
                  };
                } catch (error: any) {
                  console.error(
                    "❌ [클라이언트] 포그라운드 알림 표시 실패:",
                    error
                  );
                  // 에러가 발생해도 페이지 내 알림은 이미 표시되었으므로 문제없음
                }
              }
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

  // 서버 사이드에서는 항상 렌더링 (SEO를 위해)
  // 클라이언트 사이드에서는 mounted 체크로 하이드레이션 문제 방지
  if (!isServer && !mounted) {
    return null;
  }

  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}
