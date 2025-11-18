// Service Worker for Firebase Cloud Messaging
// 이 파일은 public 폴더에 있어야 하며, Next.js가 자동으로 서비스 워커로 등록합니다.

// Firebase SDK import (ES6 모듈 방식)
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js"
);

// Firebase 설정
// 환경 변수는 Service Worker에서 직접 접근할 수 없으므로,
// 빌드 시점에 주입되거나 별도 설정 파일이 필요합니다.
// 여기서는 self.__FIREBASE_CONFIG__를 통해 설정을 받는다고 가정합니다.

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);

// Messaging 인스턴스 가져오기
const messaging = firebase.messaging();

// 백그라운드 메시지 수신 처리
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] 백그라운드 메시지 수신:", payload);

  const notificationTitle = payload.notification?.title || "새로운 알림";
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: payload.notification?.icon || "/icon-192x192.png",
    badge: "/badge-72x72.png",
    tag: payload.data?.tag || "default",
    data: payload.data || {},
    requireInteraction: false,
    silent: false,
  };

  return self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});

// 알림 클릭 처리
self.addEventListener("notificationclick", (event) => {
  console.log("[firebase-messaging-sw.js] 알림 클릭:", event);

  event.notification.close();

  // 알림 데이터에서 URL 가져오기
  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients
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
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
