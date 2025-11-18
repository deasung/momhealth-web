import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import { useEffect, useState } from "react";
import { registerServiceWorker } from "../lib/webPush";
import "../styles/globals.css";

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Service Worker 등록 (Web Push API용)
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      registerServiceWorker("/sw.js").catch((error) => {
        console.error("Service Worker 등록 실패:", error);
      });
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
