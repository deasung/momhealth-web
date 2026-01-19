import Image from "next/image";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import SEO from "../components/SEO";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../lib/auth";
import {
  getFriendRequestCountsServer,
  getMappedUsersServer,
  getServerToken,
  getServerRefreshToken,
} from "../../lib/api-server";

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

// 동적 렌더링 강제 (headers 사용)
export const dynamic = "force-dynamic";

export default async function FriendsPage() {
  const session = await getServerSession(authOptions);

  // 로그인 확인
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SEO
          title="친구"
          description="친구와 함께 건강을 관리하고 서로의 건강 상태를 공유해보세요."
          noindex={true}
        />
        <Header />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
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

  const token = await getServerToken();
  const refreshToken = await getServerRefreshToken();
  let friends: Friend[] = [];
  let friendRequestCounts: FriendRequestCounts = {
    receivedCount: 0,
    sentCount: 0,
    totalCount: 0,
  };

  try {
    const [friendsResponse, countsResponse] = await Promise.all([
      getMappedUsersServer(token, refreshToken),
      getFriendRequestCountsServer(token, refreshToken),
    ]);

    friends = friendsResponse.data?.friends || [];
    friendRequestCounts = {
      receivedCount: countsResponse.receivedCount ?? 0,
      sentCount: countsResponse.sentCount ?? 0,
      totalCount:
        (countsResponse.receivedCount ?? 0) + (countsResponse.sentCount ?? 0),
    };
  } catch {
    friends = [];
    friendRequestCounts = {
      receivedCount: 0,
      sentCount: 0,
      totalCount: 0,
    };
  }

  const totalRequestCount =
    friendRequestCounts.receivedCount + friendRequestCounts.sentCount;

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title="친구"
        description="친구와 함께 건강을 관리하고 서로의 건강 상태를 공유해보세요."
        noindex={true}
      />

      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* ✅ SEO & 디자인: 헤더 섹션 (건강 질문 리스트와 통일감 있게) */}
        <section className="mb-8 md:mb-12">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                친구
              </h1>
              <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                친구와 함께 건강을 관리해보세요.
              </p>
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
                  aria-hidden="true"
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
        </section>

        {/* 친구 요청 섹션 */}
        {totalRequestCount > 0 && (
          <section className="mb-8" aria-label="친구 요청">
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
                  aria-hidden="true"
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
          </section>
        )}

        {/* 친구 목록 */}
        <section aria-label="친구 목록">
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
              <p className="text-gray-600 mb-6 text-sm md:text-base">
                친구를 추가하여 건강 질문에 답하고 함께 건강을 챙겨요
              </p>
              <p className="text-sm text-gray-500 mb-6">
                가족, 친구를 초대하여 건강 설문을 풀고 서로 공유해보아요!
              </p>
              <Link
                href="/friends/add-friend"
                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                친구 초대하기
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {friends.map((friend) => (
                <Link
                  key={friend.mappingId}
                  href={`/friends/${friend.friend.id}`}
                  className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:border-gray-300 transition-colors"
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
                      <div className="flex flex-wrap items-center gap-2 text-sm">
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
                      aria-hidden="true"
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
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
