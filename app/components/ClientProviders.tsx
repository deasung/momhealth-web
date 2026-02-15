"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import {
  registerServiceWorker,
  getCurrentSubscription,
  subscribeToPush,
  requestNotificationPermission,
} from "../../lib/webPush";
import { registerWebPushToken } from "../../lib/api";
import { logger } from "@/lib/logger";
import { useTokenSync } from "@/lib/hooks/useTokenSync";

function TokenSyncBridge() {
  useTokenSync();
  return null;
}

// 알림 데이터 타입
interface NotificationData {
  title?: string;
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    questionId?: string | number;
    url?: string;
    icon?: string;
    badge?: string;
    [key: string]: unknown;
  };
}

// 알림 URL 생성 헬퍼 함수
const getNotificationUrl = (notificationData?: NotificationData): string => {
  if (notificationData?.data?.questionId) {
    return `/health-questions/${notificationData.data.questionId}`;
  }
  return notificationData?.data?.url || "/";
};

// 페이지 내 알림 표시 함수
const showInPageNotification = (
  title: string,
  body: string,
  onClick?: () => void,
  icon?: string,
  _badge?: string
) => {
  // 기존 알림이 있으면 제거
  const existing = document.getElementById("in-page-notification");
  if (existing) {
    existing.remove();
  }

  // 아이콘 이미지 태그 생성
  const iconHtml = icon
    ? `<img src="${icon}" alt="알림 아이콘" style="width: 48px; height: 48px; border-radius: 8px; object-fit: cover; flex-shrink: 0;" />`
    : "";

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
      ${iconHtml}
      <div style="flex: 1; min-width: 0;">
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
        flex-shrink: 0;
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
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    </style>
  `;

  document.body.appendChild(notification);

  // 15초 후 자동 제거 (사용자가 직접 닫지 않으면)
  let autoRemoveTimeout: NodeJS.Timeout | null = setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = "slideOut 0.3s ease-out";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }
  }, 15000);

  // 알림 제거 헬퍼 함수
  const removeNotification = () => {
    if (autoRemoveTimeout) {
      clearTimeout(autoRemoveTimeout);
      autoRemoveTimeout = null;
    }
    if (notification.parentNode) {
      notification.style.animation = "slideOut 0.3s ease-out";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }
  };

  // 클릭 이벤트
  if (onClick) {
    notification.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).id !== "close-notification") {
        if (autoRemoveTimeout) {
          clearTimeout(autoRemoveTimeout);
          autoRemoveTimeout = null;
        }
        onClick();
        removeNotification();
      }
    });
  }

  // 닫기 버튼
  const closeBtn = notification.querySelector("#close-notification");
  if (closeBtn) {
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (autoRemoveTimeout) {
        clearTimeout(autoRemoveTimeout);
        autoRemoveTimeout = null;
      }
      removeNotification();
    });
  }
};

export default function ClientProviders({
  session,
  children,
}: {
  session: Session | null;
  children: ReactNode;
}) {
  useEffect(() => {
    // Service Worker 등록 및 푸시 구독 초기화
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const initializeWebPush = async () => {
        try {
          await registerServiceWorker("/sw.js");
          await navigator.serviceWorker.ready;

          const existingSubscription = await getCurrentSubscription();

          if (existingSubscription) {
            try {
              const { getWebPushTokenStatus } = await import("../../lib/api");
              const status = await getWebPushTokenStatus(
                existingSubscription.endpoint
              );

              if (!status.success || !status.pushToken) {
                await registerWebPushToken(existingSubscription);
              }
            } catch (err) {
              try {
                await registerWebPushToken(existingSubscription);
              } catch (registerErr) {
                logger.error("❌ [웹 푸시] 백엔드 등록 실패:", registerErr);
              }
            }
          } else {
            const currentPermission = Notification.permission;
            let permission = currentPermission;

            if (permission === "default") {
              try {
                permission = await requestNotificationPermission();
              } catch (err) {
                permission = "denied";
              }
            }

            if (permission === "granted") {
              const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
              if (vapidKey) {
                try {
                  const subscriptionData = await subscribeToPush(vapidKey);
                  if (subscriptionData) {
                    await registerWebPushToken(subscriptionData);
                  }
                } catch (err) {
                  logger.error("❌ [웹 푸시] 구독 실패:", err);
                }
              }
            }
          }
        } catch (error) {
          logger.error("❌ [웹 푸시] 초기화 실패:", error);
        }
      };

      initializeWebPush();

      // Service Worker 메시지 리스너 등록
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data.type === "NOTIFICATION_SHOWN") {
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

                  if (notifications.length === 0) {
                    // 클라이언트에서 직접 브라우저 알림 표시 (포그라운드 대응)
                    try {
                      if (Notification.permission !== "granted") {
                        showInPageNotification(
                          notificationData.title || "새로운 알림",
                          notificationData.body || "",
                          () => {
                            const url = getNotificationUrl(notificationData);
                            window.location.href = url;
                          },
                          notificationData.icon || notificationData.data?.icon,
                          notificationData.badge || notificationData.data?.badge
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
                          requireInteraction: true,
                        }
                      );

                      // 알림 클릭 이벤트 처리
                      clientNotification.onclick = (event) => {
                        event.preventDefault();
                        clientNotification.close();
                        const url = getNotificationUrl(notificationData);
                        window.focus();
                        window.location.href = url;
                      };

                      clientNotification.onerror = () => {
                        showInPageNotification(
                          notificationData.title || "새로운 알림",
                          notificationData.body || "",
                          () => {
                            const url = getNotificationUrl(notificationData);
                            window.location.href = url;
                          },
                          notificationData.icon || notificationData.data?.icon,
                          notificationData.badge || notificationData.data?.badge
                        );
                      };
                    } catch (clientNotifError: unknown) {
                      showInPageNotification(
                        notificationData.title || "새로운 알림",
                        notificationData.body || "",
                        () => {
                          const url = getNotificationUrl(notificationData);
                          window.location.href = url;
                        },
                        notificationData.icon || notificationData.data?.icon,
                        notificationData.badge || notificationData.data?.badge
                      );
                    }
                  }
                } catch (error) {
                  // 알림 확인 실패 시 무시
                }
              }, 200);
            }
          } else if (event.data.type === "SHOW_NOTIFICATION") {
            const notificationData = event.data.data;

            showInPageNotification(
              notificationData.title || "새로운 알림",
              notificationData.body || "",
              () => {
                const url = getNotificationUrl(notificationData);
                window.location.href = url;
              },
              notificationData.icon || notificationData.data?.icon,
              notificationData.badge || notificationData.data?.badge
            );
          } else if (event.data.type === "NOTIFICATION_ERROR") {
            logger.error("❌ [웹 푸시] 알림 표시 실패:", event.data.error);
          }
        });

        navigator.serviceWorker.ready.then((registration) => {
          registration.active?.postMessage({
            type: "NOTIFICATION_PERMISSION_STATUS",
            permission: Notification.permission,
          });
        });
      }
    }
  }, []);

  return (
    <SessionProvider session={session}>
      <TokenSyncBridge />
      {children}
    </SessionProvider>
  );
}
