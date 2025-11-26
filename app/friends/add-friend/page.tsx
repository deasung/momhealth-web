"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import SEO from "../../components/SEO";
import { useAuth } from "../../../lib/hooks/useAuth";
import Image from "next/image";
import {
  searchUsers,
  sendFriendRequest,
  cancelFriendRequestByMappingId,
  inviteFriendByEmail,
  type SearchUsersResponse,
} from "../../../lib/api";

export default function AddFriendPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<
    SearchUsersResponse["users"]
  >([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [sendingRequests, setSendingRequests] = useState<Set<number>>(
    new Set()
  );
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [canSendEmail, setCanSendEmail] = useState(false);

  const handleSearch = useCallback(
    async (isLoadMore = false, cursor?: string) => {
      const q = (query ?? "").trim();
      if (!q) {
        setSearchResults([]);
        setNextCursor(null);
        setHasSearched(false);
        return;
      }

      if (isLoadMore) setLoadingMore(true);
      else {
        setSearching(true);
        setSearchResults([]);
        setNextCursor(null);
        setHasSearched(true);
      }

      try {
        const res = await searchUsers({ query: q, cursor });
        setSearchResults((prev) =>
          isLoadMore ? [...prev, ...(res.users || [])] : res.users || []
        );
        setNextCursor(res.nextCursor ?? null);
        setCanSendEmail(!!res.canSendEmail);
      } catch (e: unknown) {
        const error = e as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        alert(
          error?.response?.data?.message ||
            error?.message ||
            "사용자 검색 중 오류가 발생했습니다."
        );
      } finally {
        setSearching(false);
        setLoadingMore(false);
      }
    },
    [query]
  );

  const handleLoadMore = useCallback(() => {
    if (nextCursor && !loadingMore && !searching) {
      handleSearch(true, nextCursor);
    }
  }, [nextCursor, loadingMore, searching, handleSearch]);

  const handleSendRequest = useCallback(async (userId: number) => {
    setSendingRequests((prev) => new Set(prev).add(userId));
    try {
      const res = await sendFriendRequest(userId);
      const mappingId = res?.mappingId || res?.id;
      setSearchResults((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, mappingStatus: "PENDING", mappingId } : u
        )
      );
      alert("친구 요청을 보냈습니다.");
    } catch (e: unknown) {
      const error = e as { response?: { data?: { message?: string } } };
      alert(
        error?.response?.data?.message ||
          "친구 요청 전송 중 오류가 발생했습니다."
      );
    } finally {
      setSendingRequests((prev) => {
        const n = new Set(prev);
        n.delete(userId);
        return n;
      });
    }
  }, []);

  const handleCancelRequest = useCallback(
    async (mappingId?: string, userId?: number) => {
      if (!mappingId || !userId) {
        alert("매핑 정보를 찾을 수 없습니다.");
        return;
      }
      setSendingRequests((prev) => new Set(prev).add(userId));
      try {
        await cancelFriendRequestByMappingId(mappingId);
        setSearchResults((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, mappingStatus: "NONE" } : u
          )
        );
        alert("요청을 취소했습니다.");
      } catch (e: unknown) {
        const error = e as {
          response?: {
            data?: { message?: string };
            status?: number;
          };
        };
        alert(
          error?.response?.data?.message ||
            (error?.response?.status === 404 && "매핑을 찾을 수 없습니다.") ||
            (error?.response?.status === 409 &&
              "취소할 수 없는 매핑 상태입니다.") ||
            (error?.response?.status === 403 &&
              "매핑 요청 취소 권한이 없습니다.") ||
            (error?.response?.status === 401 && "로그인이 필요합니다.") ||
            "친구 요청 취소 중 오류가 발생했습니다."
        );
      } finally {
        setSendingRequests((prev) => {
          const n = new Set(prev);
          n.delete(userId);
          return n;
        });
      }
    },
    []
  );

  const handleEmailInvite = useCallback(async () => {
    const email = query.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("유효한 이메일 형식이 아닙니다.");
      return;
    }
    try {
      await inviteFriendByEmail(email);
      alert("초대 이메일을 보냈습니다.");
    } catch (e: unknown) {
      const error = e as {
        response?: {
          data?: { message?: string };
          status?: number;
        };
      };
      alert(
        error?.response?.data?.message ||
          (error?.response?.status === 400 &&
            "이메일 형식이 올바르지 않습니다.") ||
          (error?.response?.status === 401 && "로그인이 필요합니다.") ||
          (error?.response?.status === 409 && "이미 가입된 사용자입니다.") ||
          "이메일 초대 중 오류가 발생했습니다."
      );
    }
  }, [query]);

  const resultsCountLabel = useMemo(
    () => `검색결과 (${searchResults.length})`,
    [searchResults.length]
  );

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="친구 추가"
        description="새로운 친구를 추가하고 함께 건강을 관리해보세요."
        noindex={true}
      />

      <Header />

      {!isAuthenticated ? (
        <main className="max-w-6xl mx-auto px-4 md:px-6 py-16 text-center">
          <div className="text-gray-400 text-6xl mb-4">👥</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            로그인이 필요합니다
          </h2>
          <button
            onClick={() => router.push("/login")}
            className="px-5 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            로그인하기
          </button>
        </main>
      ) : (
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
            <h1 className="text-3xl font-bold text-gray-900">친구 추가</h1>
            <p className="text-gray-600 mt-2">
              이메일 또는 닉네임으로 친구를 검색하고 요청을 보내세요.
            </p>
          </div>

          {/* 검색 폼 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex gap-4">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="친구 닉네임 또는 이메일"
                className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                onKeyDown={(e) => e.key === "Enter" && handleSearch(false)}
              />
              <button
                onClick={() => handleSearch(false)}
                disabled={searching || !query.trim()}
                className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {searching ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    검색 중
                  </span>
                ) : (
                  "검색"
                )}
              </button>
            </div>
          </div>

          {/* 검색 결과 */}
          {hasSearched ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-500">{resultsCountLabel}</p>
                {canSendEmail && query.trim() && (
                  <button
                    onClick={handleEmailInvite}
                    className="text-sm text-orange-600 hover:text-orange-700"
                  >
                    이메일 초대하기
                  </button>
                )}
              </div>

              {searchResults.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {searchResults.map((user) => (
                    <div key={user.id} className="flex items-center gap-4 py-4">
                      {user.userThumbnailUrl ? (
                        <Image
                          src={user.userThumbnailUrl}
                          alt={user.nickname}
                          width={48}
                          height={48}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-100" />
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 font-medium truncate">
                          {user.nickname}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>

                      {user.mappingStatus === "ACCEPTED" ? (
                        <span className="px-4 py-2 rounded-full bg-green-100 text-green-700 text-xs">
                          친구
                        </span>
                      ) : user.mappingStatus === "PENDING" ? (
                        <button
                          onClick={() =>
                            handleCancelRequest(
                              user.mappingId as string,
                              user.id
                            )
                          }
                          className="px-4 py-2 rounded-lg bg-red-50 text-red-600 text-sm hover:bg-red-100"
                        >
                          취소
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSendRequest(user.id)}
                          disabled={sendingRequests.has(user.id)}
                          className="px-4 py-2 rounded-lg bg-orange-50 text-orange-600 text-sm hover:bg-orange-100 disabled:opacity-50"
                        >
                          {sendingRequests.has(user.id) ? "전송 중..." : "추가"}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">🔍</div>
                  <p className="text-gray-600">검색 결과가 없습니다.</p>
                </div>
              )}

              {nextCursor && (
                <div className="text-center pt-4">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="px-6 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                  >
                    {loadingMore ? "로딩 중..." : "더 불러오기"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                친구를 검색하세요
              </h3>
              <p className="text-gray-600">
                닉네임 또는 이메일을 입력하고 검색 버튼을 눌러주세요.
              </p>
            </div>
          )}
        </main>
      )}

      <Footer />
    </div>
  );
}
