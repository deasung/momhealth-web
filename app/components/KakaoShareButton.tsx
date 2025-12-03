"use client";

import { useState, useEffect } from "react";

declare global {
  interface Window {
    Kakao?: {
      isInitialized: () => boolean;
      init: (key: string) => void;
      Share: {
        sendDefault: (options: {
          objectType: "feed";
          content: {
            title: string;
            description: string;
            imageUrl?: string;
            link: {
              webUrl: string;
              mobileWebUrl: string;
            };
          };
        }) => void;
      };
    };
  }
}

interface KakaoShareButtonProps {
  title: string;
  description: string;
  imageUrl?: string;
  shareUrl: string;
  onError?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export default function KakaoShareButton({
  title,
  description,
  imageUrl,
  shareUrl,
  onError,
  className = "",
  children,
}: KakaoShareButtonProps) {
  const [kakaoReady, setKakaoReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 카카오 SDK 로드 및 초기화
  useEffect(() => {
    if (typeof window === "undefined") return;

    const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
    if (!kakaoKey) {
      return;
    }

    const w = window as Window;

    // 이미 초기화된 경우
    if (w.Kakao && w.Kakao.isInitialized()) {
      setKakaoReady(true);
      return;
    }

    const onReady = () => {
      if (!w.Kakao) return;
      if (!w.Kakao.isInitialized()) {
        w.Kakao.init(kakaoKey);
      }
      setKakaoReady(true);
    };

    // 이미 스크립트가 로드 중이면 이벤트 리스너만 추가
    const existing = document.getElementById("kakao-js-sdk");
    if (existing) {
      existing.addEventListener("load", onReady, { once: true });
      // 이미 로드되었을 수도 있으니 체크
      if (w.Kakao) {
        onReady();
      }
      return;
    }

    // 스크립트 동적 로드
    const script = document.createElement("script");
    script.id = "kakao-js-sdk";
    script.src = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.7/kakao.min.js";
    script.async = true;
    script.integrity =
      "sha384-tJkjbtDbvoxO+diRuDtwRO9JXR7pjWnfjfRn5ePUpl7e7RJCxKCwwnfqUAdXh53p";
    script.crossOrigin = "anonymous";
    script.onload = onReady;
    script.onerror = () => {
      // SDK 로드 실패 시 처리
      if (onError) onError();
    };
    document.head.appendChild(script);
  }, [onError]);

  const handleKakaoShare = async () => {
    if (!kakaoReady || typeof window === "undefined" || !window.Kakao) {
      if (onError) {
        onError();
      }
      return;
    }

    setIsLoading(true);
    try {
      window.Kakao.Share.sendDefault({
        objectType: "feed",
        content: {
          title,
          description,
          imageUrl:
            imageUrl ||
            `${process.env.NEXT_PUBLIC_SITE_URL || ""}/og-image.png`,
          link: {
            webUrl: shareUrl,
            mobileWebUrl: shareUrl,
          },
        },
      });
    } catch (error) {
      // 카카오 공유 실패 시 에러 콜백 호출
      if (onError) {
        onError();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // children이 있으면 children을 렌더링, 없으면 기본 버튼 스타일
  if (children) {
    return (
      <button
        type="button"
        onClick={handleKakaoShare}
        disabled={!kakaoReady || isLoading}
        className={className}
        aria-label="카카오톡으로 공유하기"
      >
        {children}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleKakaoShare}
      disabled={!kakaoReady || isLoading}
      className={`inline-flex items-center justify-center gap-2 font-semibold py-3 sm:py-3.5 px-6 sm:px-8 rounded-xl text-base sm:text-lg transition-all duration-200 shadow-md hover:shadow-lg bg-[#FEE500] hover:bg-[#FDE74B] text-[#381E1F] disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] sm:min-h-[52px] ${className}`}
      aria-label="카카오톡으로 공유하기"
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#381E1F]"></div>
          <span>공유 중...</span>
        </>
      ) : (
        <>
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#381E1F] text-[#FEE500] text-xs">
            K
          </span>
          <span>카카오톡 공유</span>
        </>
      )}
    </button>
  );
}
