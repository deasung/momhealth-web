"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import SEO from "../../components/SEO";
import { useAuth } from "../../../lib/hooks/useAuth";
import { getMappedUsers } from "../../../lib/api";

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

export default function EditFriendsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const fetchFriends = async () => {
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

      fetchFriends();
    }
  }, [isAuthenticated, isLoading]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white">
        <SEO
          title="친구 관리"
          description="친구를 관리하고 삭제할 수 있습니다."
          noindex={true}
        />
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

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="친구 관리"
        description="친구를 관리하고 삭제할 수 있습니다."
        noindex={true}
      />

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
          <h1 className="text-3xl font-bold text-gray-900">친구 관리</h1>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">친구 목록을 불러오는 중...</p>
          </div>
        ) : friends.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">👥</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              친구가 없습니다
            </h3>
            <p className="text-gray-600 mb-6">삭제할 친구가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {friends.map((friend) => (
              <div
                key={friend.mappingId}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
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
                    <p className="text-sm text-gray-500">
                      {friend.friend.email}
                    </p>
                  </div>

                  {/* 삭제 버튼 */}
                  <button
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                    onClick={() => {
                      // TODO: 친구 삭제 API 호출
                      alert("친구 삭제 기능은 준비 중입니다.");
                    }}
                  >
                    삭제
                  </button>
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
