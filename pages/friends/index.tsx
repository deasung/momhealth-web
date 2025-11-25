import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import SEO from "../../components/SEO";
import { useAuth } from "../../lib/hooks/useAuth";
import { getMappedUsers, getFriendRequestCounts } from "../../lib/api";

interface Friend {
  mappingId: number;
  lastActivityAt: string | null;
  questionCount: number;
  friend: {
    id: number;
    email: string;
    nickname: string;
    userThumbnailUrl: string | null;
    createdAt: string;
  };
  mappingCreatedAt: string;
}

interface FriendRequestCounts {
  receivedCount: number;
  sentCount: number;
  totalCount: number;
}

export default function FriendsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequestCounts, setFriendRequestCounts] =
    useState<FriendRequestCounts>({
      receivedCount: 0,
      sentCount: 0,
      totalCount: 0,
    });
  const [loading, setLoading] = useState(true);

  // 친구 목록 가져오기
  const fetchFriends = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await getMappedUsers();
      setFriends(response.data.friends || []);
    } catch (error) {
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  // 친구 요청 카운트 가져오기
  const fetchFriendRequestCounts = async () => {
    if (!isAuthenticated) return;
    try {
      const response = await getFriendRequestCounts();
      setFriendRequestCounts(response);
    } catch (error) {
      setFriendRequestCounts({ receivedCount: 0, sentCount: 0, totalCount: 0 });
    }
  };

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      fetchFriends();
      fetchFriendRequestCounts();
    } else if (!isAuthenticated && !isLoading) {
      setFriends([]);
      setFriendRequestCounts({ receivedCount: 0, sentCount: 0, totalCount: 0 });
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isLoading]);

  // 로그인 확인
  if (!isLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-white">
        <SEO
          title="친구"
          description="친구와 함께 건강을 관리하고 서로의 건강 상태를 공유해보세요."
          noindex={true}
        />
        <Header />
        <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
          <div className="text-center py-16">
            <div className="text-gray-400 text-6xl mb-4">👥</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              로그인이 필요합니다
            </h2>
            <p className="text-gray-600 mb-8">
              친구 목록을 보려면 로그인해주세요.
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              로그인하기
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <SEO
          title="친구"
          description="친구 목록을 불러오는 중입니다."
          noindex={true}
        />
        <Header />
        <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">친구 목록을 불러오는 중...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const totalRequestCount =
    friendRequestCounts.receivedCount + friendRequestCounts.sentCount;

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="친구"
        description="친구와 함께 건강을 관리하고 서로의 건강 상태를 공유해보세요."
        noindex={true}
      />

      <Header />

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">친구</h1>
              <p className="text-gray-600">친구와 함께 건강을 관리해보세요.</p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/friends/edit-friends"
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                편집
              </Link>
              <Link
                href="/friends/add-friend"
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium inline-flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                추가
              </Link>
            </div>
          </div>
        </div>

        {/* 친구 요청 섹션 */}
        {totalRequestCount > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-gray-400">친구 요청</h2>
            </div>
            <Link
              href="/friends/requests"
              className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:border-orange-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📧</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    요청한 친구를 확인하세요!
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {totalRequestCount}개의 친구 요청이 있습니다
                  </p>
                </div>
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </Link>
          </div>
        )}

        {/* 친구 목록 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-400">
              친구 ({friends.length})
            </h2>
          </div>

          {friends.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">👥</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                친구가 없습니다
              </h3>
              <p className="text-gray-600 mb-6">
                친구를 추가하여 건강 질문에 답하고 함께 건강을 챙겨요
              </p>
              <p className="text-sm text-gray-500 mb-6">
                가족, 친구를 초대하여 건강 설문을 풀고 서로 공유해보아요!
              </p>
              <button className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors inline-flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                친구 초대하기
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {friends.map((friend) => (
                <div
                  key={friend.mappingId}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:border-gray-300 transition-colors cursor-pointer"
                  onClick={() => {
                    // TODO: 친구의 건강 질문 화면으로 이동
                  }}
                >
                  <div className="flex items-center gap-4">
                    {/* 프로필 이미지 */}
                    <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {friend.friend.userThumbnailUrl ? (
                        <Image
                          src={`${friend.friend.userThumbnailUrl}`}
                          alt={friend.friend.nickname}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl">👤</span>
                      )}
                    </div>

                    {/* 친구 정보 */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-lg mb-1">
                        {friend.friend.nickname}
                      </h3>
                      <div className="flex items-center gap-2 text-sm">
                        {friend.questionCount > 0 && (
                          <>
                            <span className="text-orange-500 font-medium">
                              건강질문 {friend.questionCount}개
                            </span>
                            {friend.lastActivityAt && (
                              <span className="text-gray-400">•</span>
                            )}
                          </>
                        )}
                        {friend.lastActivityAt && (
                          <span className="text-gray-400">
                            {new Date(friend.lastActivityAt).toLocaleDateString(
                              "ko-KR"
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 화살표 */}
                    <svg
                      className="w-5 h-5 text-gray-400 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
