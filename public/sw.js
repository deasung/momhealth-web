// Service Worker for Web Push Notifications
// Web Push API를 사용한 푸시 알림 처리

// 설치 이벤트
self.addEventListener("install", (event) => {
  console.log("[SW] Service Worker 설치됨");
  self.skipWaiting(); // 즉시 활성화
});

// 활성화 이벤트
self.addEventListener("activate", (event) => {
  console.log("[SW] Service Worker 활성화됨");
  event.waitUntil(self.clients.claim()); // 모든 클라이언트 제어
});

// 푸시 알림 수신 이벤트
self.addEventListener("push", async (event) => {
  let notificationData = {
    title: "새로운 알림",
    body: "알림 내용이 없습니다.",
    icon: "/icon-192x192.png",
    badge: "/badge-72x72.png",
    tag: "default",
    data: {},
  };

  // 푸시 데이터 파싱
  if (event.data) {
    try {
      let data;

      if (typeof event.data.json === "function") {
        const jsonResult = event.data.json();
        data = jsonResult instanceof Promise ? await jsonResult : jsonResult;
      } else if (typeof event.data.text === "function") {
        const textResult = event.data.text();
        const text =
          textResult instanceof Promise ? await textResult : textResult;
        data = JSON.parse(text);
      } else if (typeof event.data.arrayBuffer === "function") {
        const arrayBufferResult = event.data.arrayBuffer();
        const arrayBuffer =
          arrayBufferResult instanceof Promise
            ? await arrayBufferResult
            : arrayBufferResult;
        const text = new TextDecoder().decode(arrayBuffer);
        data = JSON.parse(text);
      }

      if (data) {
        notificationData = {
          title:
            data.title || data.notification?.title || notificationData.title,
          body: data.body || data.notification?.body || notificationData.body,
          icon: data.icon || data.notification?.icon || notificationData.icon,
          badge: data.badge || notificationData.badge,
          tag: data.tag || data.data?.tag || notificationData.tag,
          data: data.data || data || {},
        };
      }
    } catch (e) {
      console.error("[SW] 푸시 데이터 파싱 실패:", e);
      try {
        if (typeof event.data.text === "function") {
          const textResult = event.data.text();
          const text =
            textResult instanceof Promise ? await textResult : textResult;
          notificationData.body = text || notificationData.body;
        }
      } catch (textError) {
        // 파싱 실패 시 기본 알림 사용
      }
    }
  }

  // 알림 표시
  event.waitUntil(
    (async () => {
      try {
        if (!self.registration) {
          console.error("[SW] Service Worker registration이 없습니다");
          return;
        }

        const notificationOptions = {
          body: notificationData.body,
          icon: notificationData.icon,
          badge: notificationData.badge,
          tag: notificationData.tag,
          data: notificationData.data,
          requireInteraction: true,
          silent: false,
          vibrate: [200, 100, 200],
          renotify: true,
        };

        await self.registration.showNotification(
          notificationData.title,
          notificationOptions
        );

        // 클라이언트에게 알림 표시 메시지 전송
        const clients = await self.clients.matchAll({
          includeUncontrolled: true,
          type: "window",
        });

        if (clients.length > 0) {
          clients.forEach((client) => {
            client.postMessage({
              type: "NOTIFICATION_SHOWN",
              data: notificationData,
              timestamp: Date.now(),
            });
            client.postMessage({
              type: "SHOW_NOTIFICATION",
              data: notificationData,
              timestamp: Date.now(),
            });
          });
        }
      } catch (error) {
        console.error("[SW] 알림 표시 실패:", error);
        const clients = await self.clients.matchAll();
        clients.forEach((client) => {
          client.postMessage({
            type: "NOTIFICATION_ERROR",
            error: error.message || String(error),
          });
        });
      }
    })()
  );
});

// 알림 클릭 이벤트
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // 알림 데이터에서 URL 가져오기
  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // 이미 열려있는 탭이 있으면 포커스
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        // 새 탭 열기
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// 알림 닫기 이벤트
self.addEventListener("notificationclose", () => {
  // 알림 닫힘 처리
});

// 클라이언트로부터 메시지 수신
self.addEventListener("message", () => {
  // 메시지 처리
});
