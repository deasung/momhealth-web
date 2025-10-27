import { useState, useEffect } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useAuth } from "../../lib/hooks/useAuth";

interface Friend {
  id: number;
  nickname: string;
  email: string;
  userThumbnailUrl: string | null;
}

export default function FriendsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      // TODO: 친구 목록 API 호출
      // setFriends를 사용하여 친구 목록을 설정해야 함
      setLoading(false);
    }
  }, [isAuthenticated, isLoading, setFriends]);

  // 로그인 확인
  if (!isLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-white">
        <Head>
          <title>친구 - 오늘의 건강</title>
        </Head>
        <Header />
        <main className="max-w-6xl mx-auto px-4 md:px-6 py-16 text-center">
          <div className="mb-8">
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
        <Head>
          <title>친구 - 오늘의 건강</title>
        </Head>
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

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>친구 - 오늘의 건강</title>
        <meta name="description" content="친구 목록을 확인하세요" />
      </Head>

      <Header />

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {/* 페이지 타이틀 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">친구</h1>
          <p className="text-gray-600">친구들과 함께 건강을 공유하세요.</p>
        </div>

        {/* 친구 목록이 없을 때 */}
        {friends.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">👥</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              친구가 없습니다
            </h3>
            <p className="text-gray-600 mb-6">
              아직 추가한 친구가 없습니다. 친구를 추가해보세요.
            </p>
            <button className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
              친구 추가하기
            </button>
          </div>
        )}

        {/* 친구 목록 */}
        {friends.length > 0 && (
          <div className="space-y-3">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* 프로필 이미지 */}
                  <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {friend.userThumbnailUrl ? (
                      <Image
                        src={`${
                          process.env.NEXT_PUBLIC_CDN_URL ||
                          "https://di7imxmn4pwuq.cloudfront.net"
                        }/${friend.userThumbnailUrl}`}
                        alt={friend.nickname}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">👤</span>
                    )}
                  </div>

                  {/* 친구 정보 */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg mb-1">
                      {friend.nickname}
                    </h3>
                    <p className="text-sm text-gray-500">{friend.email}</p>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                      채팅
                    </button>
                    <button className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium">
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
