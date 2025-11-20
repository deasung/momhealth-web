import { useState } from "react";
import { usePushNotification } from "../lib/hooks/usePushNotification";

interface PushNotificationButtonProps {
  className?: string;
}

/**
 * 푸시 알림 권한 요청 및 토큰 등록 버튼 컴포넌트
 */
export default function PushNotificationButton({
  className = "",
}: PushNotificationButtonProps) {
  const {
    permission,
    isSupported,
    isLoading,
    error,
    requestPermission,
    registerToken,
    unregisterToken,
    token,
  } = usePushNotification();

  const [isRegistering, setIsRegistering] = useState(false);

  if (!isSupported) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        이 브라우저는 푸시 알림을 지원하지 않습니다.
      </div>
    );
  }

  const handleClick = async () => {
    if (permission === "granted" && token) {
      // 이미 등록된 경우 해제
      await unregisterToken();
    } else if (permission === "granted") {
      // 권한은 있지만 토큰이 없는 경우 등록
      setIsRegistering(true);
      await registerToken();
      setIsRegistering(false);
    } else {
      // 권한 요청
      await requestPermission();
    }
  };

  const getButtonText = () => {
    if (isLoading || isRegistering) return "처리 중...";
    if (permission === "granted" && token) return "푸시 알림 해제";
    if (permission === "granted") return "푸시 알림 등록";
    if (permission === "denied") return "알림 권한 필요 (설정에서 허용)";
    return "푸시 알림 활성화";
  };

  return (
    <div className={className}>
      <button
        onClick={handleClick}
        disabled={isLoading || isRegistering || permission === "denied"}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          permission === "granted" && token
            ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
            : "bg-blue-500 text-white hover:bg-blue-600"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {getButtonText()}
      </button>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      {permission === "granted" && token && (
        <p className="mt-2 text-sm text-green-600">
          ✅ 푸시 알림이 활성화되어 있습니다.
        </p>
      )}
    </div>
  );
}
