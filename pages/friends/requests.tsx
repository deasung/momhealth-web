import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Image from "next/image";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useAuth } from "../../lib/hooks/useAuth";
import {
  getSentRequests,
  getReceivedRequests,
  acceptFriendRequest,
  cancelFriendRequest,
} from "../../lib/api";

interface FriendRequest {
  id: number;
  type: "sent" | "received";
  user: {
    id: number;
    nickname: string;
    email: string;
    userThumbnailUrl: string | null;
  };
  createdAt: string;
}

export default function FriendRequestsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"sent" | "received">("sent");
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelTargetRequest, setCancelTargetRequest] =
    useState<FriendRequest | null>(null);
  const [processing, setProcessing] = useState(false);

  // 보낸 요청 가져오기
  const fetchSentRequests = async () => {
    try {
      const response = await getSentRequests();
      const formattedRequests: FriendRequest[] = (response.items || []).map(
        (item: {
          id: number;
          createdAt: string;
          toUser: {
            id: number;
            email: string;
            nickname: string;
            userThumbnailUrl: string | null;
          };
        }) => ({
          id: item.id,
          type: "sent",
          user: {
            id: item.toUser.id,
            email: item.toUser.email,
            nickname: item.toUser.nickname,
            userThumbnailUrl: item.toUser.userThumbnailUrl,
          },
          createdAt: item.createdAt,
        })
      );
      setSentRequests(formattedRequests);
    } catch (error) {
      setSentRequests([]);
    }
  };

  // 받은 요청 가져오기
  const fetchReceivedRequests = async () => {
    try {
      const response = await getReceivedRequests();
      const formattedRequests: FriendRequest[] = (response.items || []).map(
        (item: {
          id: number;
          createdAt: string;
          fromUser: {
            id: number;
            email: string;
            nickname: string;
            userThumbnailUrl: string | null;
          };
        }) => ({
          id: item.id,
          type: "received",
          user: {
            id: item.fromUser.id,
            email: item.fromUser.email,
            nickname: item.fromUser.nickname,
            userThumbnailUrl: item.fromUser.userThumbnailUrl,
          },
          createdAt: item.createdAt,
        })
      );
      setReceivedRequests(formattedRequests);
    } catch (error) {
      setReceivedRequests([]);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const initializeData = async () => {
        try {
          setLoading(true);
          await Promise.all([fetchSentRequests(), fetchReceivedRequests()]);
        } catch (error) {
          // 에러 처리
        } finally {
          setLoading(false);
        }
      };
      initializeData();
    }
  }, [isAuthenticated, isLoading]);

  // 탭 변경 시 데이터 로드
  const handleTabChange = async (tab: "sent" | "received") => {
    setActiveTab(tab);
    if (tab === "sent") {
      await fetchSentRequests();
    } else {
      await fetchReceivedRequests();
    }
  };

  // 요청 수락
  const handleAcceptRequest = async (requestId: number) => {
    try {
      setProcessing(true);
      await acceptFriendRequest(requestId);

      // 성공 시 목록에서 제거
      setReceivedRequests((prev) => prev.filter((req) => req.id !== requestId));

      // 성공 모달 표시
      setSuccessMessage("친구가 추가되었습니다.");
      setShowSuccessModal(true);
    } catch (error: unknown) {
      let errorMessage = "친구 요청 수락 중 오류가 발생했습니다.";

      if (error && typeof error === "object" && "response" in error) {
        const apiError = error as {
          response?: { status?: number; data?: { message?: string } };
        };

        if (apiError.response?.data?.message) {
          errorMessage = apiError.response.data.message;
        } else if (apiError.response?.status === 404) {
          errorMessage = "매핑을 찾을 수 없습니다.";
        } else if (apiError.response?.status === 403) {
          errorMessage = "매핑 응답 권한이 없습니다.";
        } else if (apiError.response?.status === 409) {
          errorMessage = "이미 처리된 매핑 요청입니다.";
        } else if (apiError.response?.status === 401) {
          errorMessage = "사용자 정보가 없습니다.";
        }
      }

      alert(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  // 요청 취소
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCancelRequest = (requestId: number) => {
    const request = sentRequests.find((req) => req.id === requestId);
    if (request) {
      setCancelTargetRequest(request);
      setShowCancelModal(true);
    }
  };

  const confirmCancelRequest = async () => {
    if (!cancelTargetRequest) return;

    try {
      setProcessing(true);
      await cancelFriendRequest(cancelTargetRequest.id);

      // 성공 시 목록에서 제거
      setSentRequests((prev) =>
        prev.filter((req) => req.id !== cancelTargetRequest.id)
      );

      // 모달 닫기
      setShowCancelModal(false);
      setCancelTargetRequest(null);
    } catch (error: unknown) {
      let errorMessage = "친구 요청 취소 중 오류가 발생했습니다.";

      if (error && typeof error === "object" && "response" in error) {
        const apiError = error as {
          response?: { status?: number; data?: { message?: string } };
        };

        if (apiError.response?.data?.message) {
          errorMessage = apiError.response.data.message;
        } else if (apiError.response?.status === 404) {
          errorMessage = "매핑을 찾을 수 없습니다.";
        } else if (apiError.response?.status === 409) {
          errorMessage = "취소할 수 없는 매핑 상태입니다.";
        } else if (apiError.response?.status === 403) {
          errorMessage = "매핑 요청 취소 권한이 없습니다.";
        } else if (apiError.response?.status === 401) {
          errorMessage = "사용자 정보가 없습니다.";
        }
      }

      alert(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white">
        <Head>
          <title>친구 요청 - 오늘의 건강</title>
        </Head>
        <Header />
        <main className="max-w-6xl mx-auto px-4 md:px-6 py-16 text-center">
          <div className="text-gray-400 text-6xl mb-4">👥</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            로그인이 필요합니다
          </h2>
        </main>
        <Footer />
      </div>
    );
  }

  const currentRequests =
    activeTab === "sent" ? sentRequests : receivedRequests;

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>친구 요청 - 오늘의 건강</title>
      </Head>

      <Header />

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-4 text-gray-600 hover:text-gray-900"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">친구 요청</h1>
        </div>

        {/* 세그먼트 컨트롤 */}
        <div className="mb-6">
          <div className="bg-gray-100 rounded-xl p-1.5 flex gap-2">
            <button
              onClick={() => handleTabChange("sent")}
              className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all ${
                activeTab === "sent"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600"
              }`}
            >
              친구 요청 ({sentRequests.length})
            </button>
            <button
              onClick={() => handleTabChange("received")}
              className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all ${
                activeTab === "received"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600"
              }`}
            >
              받은 요청 ({receivedRequests.length})
            </button>
          </div>
        </div>

        {/* 요청 목록 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">친구 요청을 불러오는 중...</p>
          </div>
        ) : currentRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">👥</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {activeTab === "sent"
                ? "요청한 친구가 없습니다"
                : "받은 친구 요청이 없습니다"}
            </h3>
          </div>
        ) : (
          <div className="space-y-3">
            {currentRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center gap-4">
                  {/* 프로필 이미지 */}
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {request.user.userThumbnailUrl ? (
                      <Image
                        src={`${request.user.userThumbnailUrl}`}
                        alt={request.user.nickname}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xl">👤</span>
                    )}
                  </div>

                  {/* 사용자 정보 */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {request.user.nickname}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-orange-500 font-medium">
                        요청됨
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-gray-500">
                        {request.user.email}
                      </span>
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  {request.type === "sent" ? (
                    <button
                      onClick={() => handleCancelRequest(request.id)}
                      disabled={processing}
                      className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      취소
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAcceptRequest(request.id)}
                      disabled={processing}
                      className="px-4 py-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      추가
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 성공 모달 */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                친구 추가 완료
              </h3>
              <p className="text-gray-600">{successMessage}</p>
            </div>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 취소 확인 모달 */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                친구 요청 취소
              </h3>
              <p className="text-gray-600">친구 요청을 취소하시겠습니까?</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-6 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                아니오
              </button>
              <button
                onClick={confirmCancelRequest}
                disabled={processing}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
              >
                {processing ? "처리 중..." : "확인"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
