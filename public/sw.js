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
  console.log("[SW] 🔔 푸시 알림 수신 이벤트 발생!");
  console.log("[SW] 이벤트 타입:", event.type);
  console.log("[SW] 이벤트 데이터 존재 여부:", !!event.data);
  console.log("[SW] 이벤트 타임스탬프:", new Date().toISOString());

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
      console.log("[SW] 푸시 데이터 파싱 시도 중...");

      // PushMessageData의 다양한 메서드 시도
      if (typeof event.data.json === "function") {
        console.log("[SW] event.data.json() 메서드 사용");
        const jsonResult = event.data.json();
        // Promise인지 확인
        data = jsonResult instanceof Promise ? await jsonResult : jsonResult;
        console.log("[SW] JSON 파싱 결과:", data);
      } else if (typeof event.data.text === "function") {
        console.log("[SW] event.data.text() 메서드 사용");
        const textResult = event.data.text();
        const text =
          textResult instanceof Promise ? await textResult : textResult;
        console.log("[SW] 텍스트 데이터:", text);
        data = JSON.parse(text);
        console.log("[SW] 텍스트 파싱 결과:", data);
      } else if (typeof event.data.arrayBuffer === "function") {
        console.log("[SW] event.data.arrayBuffer() 메서드 사용");
        const arrayBufferResult = event.data.arrayBuffer();
        const arrayBuffer =
          arrayBufferResult instanceof Promise
            ? await arrayBufferResult
            : arrayBufferResult;
        const text = new TextDecoder().decode(arrayBuffer);
        console.log("[SW] ArrayBuffer 디코딩 결과:", text);
        data = JSON.parse(text);
        console.log("[SW] ArrayBuffer 파싱 결과:", data);
      } else {
        console.warn("[SW] ⚠️ 알 수 없는 데이터 형식:", typeof event.data);
      }

      if (data) {
        console.log("[SW] ✅ 파싱된 데이터:", data);
        notificationData = {
          title:
            data.title || data.notification?.title || notificationData.title,
          body: data.body || data.notification?.body || notificationData.body,
          icon: data.icon || data.notification?.icon || notificationData.icon,
          badge: data.badge || notificationData.badge,
          tag: data.tag || data.data?.tag || notificationData.tag,
          data: data.data || data || {},
        };
        console.log("[SW] 최종 알림 데이터:", notificationData);
      } else {
        console.warn("[SW] ⚠️ 파싱된 데이터가 없습니다");
      }
    } catch (e) {
      console.error("[SW] ❌ 푸시 데이터 파싱 실패:", e);
      console.error("[SW] 에러 상세:", {
        name: e.name,
        message: e.message,
        stack: e.stack,
      });
      // JSON 파싱 실패 시 텍스트로 처리
      try {
        if (typeof event.data.text === "function") {
          const textResult = event.data.text();
          const text =
            textResult instanceof Promise ? await textResult : textResult;
          notificationData.body = text || notificationData.body;
          console.log("[SW] 텍스트로 처리된 본문:", notificationData.body);
        }
      } catch (textError) {
        console.error("[SW] 텍스트 파싱도 실패:", textError);
      }
    }
  } else {
    console.warn(
      "[SW] ⚠️ 푸시 이벤트에 데이터가 없습니다. 기본 알림을 표시합니다."
    );
  }

  // 알림 표시 (에러 핸들링 포함)
  event.waitUntil(
    (async () => {
      try {
        console.log("[SW] 📢 알림 표시 시도 시작");
        console.log(
          "[SW] 알림 데이터:",
          JSON.stringify(notificationData, null, 2)
        );

        // Service Worker registration 확인
        if (!self.registration) {
          console.error("[SW] ❌ Service Worker registration이 없습니다");
          return;
        }
        console.log("[SW] ✅ Service Worker registration 확인됨");

        // 알림 권한 확인 (Service Worker에서는 직접 확인 불가하지만 로그만)
        console.log("[SW] 알림 표시 권한 확인 중...");

        // 알림 표시 옵션 준비
        const notificationOptions = {
          body: notificationData.body,
          icon: notificationData.icon,
          badge: notificationData.badge,
          tag: notificationData.tag,
          data: notificationData.data,
          requireInteraction: true, // ⚠️ true로 변경: 사용자가 클릭할 때까지 알림 유지
          silent: false,
          vibrate: [200, 100, 200], // 진동 추가 (지원되는 경우)
          renotify: true, // 같은 tag의 알림이 있어도 다시 표시
        };

        console.log(
          "[SW] 알림 옵션:",
          JSON.stringify(notificationOptions, null, 2)
        );

        // 알림 표시
        console.log("[SW] showNotification 호출 전...");
        try {
        const notificationPromise = self.registration.showNotification(
          notificationData.title,
          notificationOptions
        );

        // Promise 완료 대기
        await notificationPromise;
          console.log("[SW] ✅ showNotification Promise 완료");

          // 알림이 실제로 표시되었는지 확인
          const notification = await notificationPromise;
          console.log("[SW] 알림 객체:", notification);
        } catch (showError) {
          console.error("[SW] ❌ showNotification 호출 실패:", showError);
          console.error("[SW] 에러 상세:", {
            name: showError.name,
            message: showError.message,
            stack: showError.stack,
          });
          throw showError; // 에러를 다시 던져서 클라이언트에 알림
        }

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
        const clients = await self.clients.matchAll({
          includeUncontrolled: true,
          type: "window",
        });
        console.log("[SW] 활성 클라이언트 수:", clients.length);

        if (clients.length > 0) {
          clients.forEach((client) => {
            client.postMessage({
              type: "NOTIFICATION_SHOWN",
              data: notificationData,
              timestamp: Date.now(),
            });
          });
          console.log("[SW] 클라이언트에 알림 표시 메시지 전송 완료");
        } else {
          console.log("[SW] 활성 클라이언트가 없음 (백그라운드 모드)");
        }

        // 포그라운드에서도 알림을 표시하도록 클라이언트에 요청
        if (clients.length > 0) {
          clients.forEach((client) => {
            client.postMessage({
              type: "SHOW_NOTIFICATION",
              data: notificationData,
              timestamp: Date.now(),
            });
          });
          console.log("[SW] 클라이언트에 포그라운드 알림 표시 요청 전송");
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
