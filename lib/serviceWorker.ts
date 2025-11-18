/**
 * Service Worker 등록 및 관리
 */

export const registerServiceWorker =
  async (): Promise<ServiceWorkerRegistration | null> => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      console.warn("⚠️ Service Worker를 지원하지 않는 브라우저입니다.");
      return null;
    }

    try {
      // Service Worker 등록 (동적으로 생성된 파일 사용)
      const registration = await navigator.serviceWorker.register(
        "/api/firebase-messaging-sw.js",
        {
          scope: "/",
        }
      );

      console.log("✅ Service Worker 등록 완료:", registration.scope);

      // 업데이트 확인
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              console.log(
                "새로운 Service Worker가 설치되었습니다. 페이지를 새로고침하세요."
              );
            }
          });
        }
      });

      return registration;
    } catch (error) {
      console.error("❌ Service Worker 등록 실패:", error);
      return null;
    }
  };

/**
 * Service Worker가 활성화될 때까지 대기
 */
export const waitForServiceWorker =
  async (): Promise<ServiceWorkerRegistration | null> => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return null;
    }

    if (navigator.serviceWorker.controller) {
      // 이미 활성화된 경우
      return navigator.serviceWorker.ready;
    }

    // 활성화 대기
    return new Promise((resolve) => {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        resolve(navigator.serviceWorker.ready);
      });

      // 타임아웃 (5초)
      setTimeout(() => {
        resolve(navigator.serviceWorker.ready);
      }, 5000);
    });
  };
