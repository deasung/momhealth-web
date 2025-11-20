import { useState } from "react";
import { useWebPush } from "../lib/hooks/useWebPush";

interface WebPushButtonProps {
  className?: string;
}

/**
 * Web Push API를 사용한 푸시 알림 버튼 컴포넌트
 */
export default function WebPushButton({ className = "" }: WebPushButtonProps) {
  const {
    subscription,
    permission,
    isSupported,
    isLoading,
    error,
    isRegistered,
    requestPermission,
    subscribe,
    unsubscribe,
  } = useWebPush();

  const [isProcessing, setIsProcessing] = useState(false);

  if (!isSupported) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        이 브라우저는 푸시 알림을 지원하지 않습니다.
      </div>
    );
  }

  const handleClick = async () => {
    if (permission === "granted" && subscription && isRegistered) {
      // 이미 등록된 경우 해제
      setIsProcessing(true);
      await unsubscribe();
      setIsProcessing(false);
    } else if (permission === "granted") {
      // 권한은 있지만 구독이 없는 경우 구독
      setIsProcessing(true);
      await subscribe();
      setIsProcessing(false);
    } else {
      // 권한 요청
      await requestPermission();
      // 권한이 승인되면 자동으로 구독 (requestPermission 내부에서 처리됨)
    }
  };

  const getButtonText = () => {
    if (isLoading || isProcessing) return "처리 중...";
    if (permission === "granted" && subscription && isRegistered)
      return "푸시 알림 해제";
    if (permission === "granted") return "푸시 알림 등록";
    if (permission === "denied") return "알림 권한 필요 (설정에서 허용)";
    return "푸시 알림 활성화";
  };

  return (
    <div className={className}>
      <button
        onClick={handleClick}
        disabled={isLoading || isProcessing || permission === "denied"}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          permission === "granted" && subscription && isRegistered
            ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
            : "bg-blue-500 text-white hover:bg-blue-600"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {getButtonText()}
      </button>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      {permission === "granted" && subscription && isRegistered && (
        <p className="mt-2 text-sm text-green-600">
          ✅ 푸시 알림이 활성화되어 있습니다.
        </p>
      )}
    </div>
  );
}
