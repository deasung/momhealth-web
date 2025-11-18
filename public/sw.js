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
  console.log("[SW] 푸시 알림 수신:", event);

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

      // PushMessageData의 다양한 메서드 시도
      if (typeof event.data.json === "function") {
        const jsonResult = event.data.json();
        // Promise인지 확인
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
          title: data.title || notificationData.title,
          body: data.body || notificationData.body,
          icon: data.icon || notificationData.icon,
          badge: data.badge || notificationData.badge,
          tag: data.tag || notificationData.tag,
          data: data.data || notificationData.data,
        };
      }
    } catch (e) {
      console.error("[SW] 푸시 데이터 파싱 실패:", e);
      // JSON 파싱 실패 시 텍스트로 처리
      try {
        if (typeof event.data.text === "function") {
          const textResult = event.data.text();
          notificationData.body =
            textResult instanceof Promise ? await textResult : textResult;
        }
      } catch (textError) {
        console.error("[SW] 텍스트 파싱도 실패:", textError);
      }
    }
  }

  // 알림 표시 (에러 핸들링 포함)
  event.waitUntil(
    (async () => {
      try {
        console.log("[SW] 알림 표시 시도:", notificationData);

        // Service Worker registration 확인
        if (!self.registration) {
          console.error("[SW] Service Worker registration이 없습니다");
          return;
        }

        // 알림 표시 옵션 준비
        const notificationOptions = {
          body: notificationData.body,
          icon: notificationData.icon,
          badge: notificationData.badge,
          tag: notificationData.tag,
          data: notificationData.data,
          requireInteraction: false,
          silent: false,
          vibrate: [200, 100, 200], // 진동 추가 (지원되는 경우)
          renotify: true, // 같은 tag의 알림이 있어도 다시 표시
        };

        console.log("[SW] 알림 옵션:", notificationOptions);

        // 알림 표시
        const notificationPromise = self.registration.showNotification(
          notificationData.title,
          notificationOptions
        );

        // Promise 완료 대기
        await notificationPromise;
        console.log("[SW] showNotification Promise 완료");

        // 약간의 지연 후 알림이 실제로 표시되었는지 확인
        await new Promise((resolve) => setTimeout(resolve, 100));

        // 활성 알림 목록 확인 (가능한 경우)
        try {
          const notifications = await self.registration.getNotifications({
            tag: notificationData.tag,
          });
          console.log("[SW] 현재 활성 알림 수:", notifications.length);
          if (notifications.length > 0) {
            console.log(
              "[SW] 알림이 성공적으로 표시되었습니다:",
              notifications[0].title
            );
          } else {
            console.warn(
              "[SW] ⚠️ 알림이 표시되지 않았을 수 있습니다. 브라우저 설정을 확인하세요."
            );
          }
        } catch (getNotifError) {
          console.warn("[SW] 알림 목록 확인 실패:", getNotifError);
        }

        // 클라이언트에게 알림 표시 성공 메시지 전송
        const clients = await self.clients.matchAll();
        if (clients.length > 0) {
          clients.forEach((client) => {
            client.postMessage({
              type: "NOTIFICATION_SHOWN",
              data: notificationData,
            });
          });
          console.log("[SW] 클라이언트에 알림 표시 메시지 전송 완료");
        } else {
          console.log("[SW] 활성 클라이언트가 없음 (백그라운드 모드)");
        }
      } catch (error) {
        console.error("[SW] 알림 표시 실패:", error);
        console.error("[SW] 에러 상세:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });

        // 클라이언트에게 에러 메시지 전송
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
  console.log("[SW] 알림 클릭:", event);

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
self.addEventListener("notificationclose", (event) => {
  console.log("[SW] 알림 닫힘:", event);
});

// 클라이언트로부터 메시지 수신
self.addEventListener("message", (event) => {
  console.log("[SW] 클라이언트로부터 메시지 수신:", event.data);

  if (event.data.type === "NOTIFICATION_PERMISSION_STATUS") {
    console.log("[SW] 알림 권한 상태:", event.data.permission);
    // 권한 상태를 저장하거나 로깅
  }
});
