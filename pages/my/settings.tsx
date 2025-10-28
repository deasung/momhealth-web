import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useAuth } from "../../lib/hooks/useAuth";
import {
  getUserProfile,
  updateUserProfile,
  uploadThumbnail,
} from "../../lib/api";
import type { UserProfile } from "../../types/user";

export default function MySettingsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [nickname, setNickname] = useState("");
  const [age, setAge] = useState("");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [thumbnailPath, setThumbnailPath] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 사용자 프로필 정보 가져오기
  useEffect(() => {
    if (isAuthenticated) {
      const fetchProfile = async () => {
        try {
          setLoading(true);
          const response = await getUserProfile();
          setUserProfile(response.user);
          setNickname(response.user.nickname);
          setAge(response.user.age.toString());
        } catch (error) {
          // 프로필 정보 로딩 실패 시 기본값 유지
        } finally {
          setLoading(false);
        }
      };

      fetchProfile();
    }
  }, [isAuthenticated]);

  const handleSelectFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 간단한 검증 (이미지 타입/파일 크기 제한: 5MB)
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("파일 크기가 5MB를 초과할 수 없습니다.");
      return;
    }

    try {
      setUploading(true);
      const { thumbnailUrl } = await uploadThumbnail(file, "profile");
      setThumbnailPath(thumbnailUrl);
    } catch (err: unknown) {
      const error = err as { message?: string };
      alert(
        `프로필 이미지 업로드에 실패했습니다: ${
          error?.message || "알 수 없는 오류"
        }`
      );
    } finally {
      setUploading(false);
      // 동일 파일 재업로드 허용 위해 리셋
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!nickname.trim()) {
      alert("닉네임을 입력해주세요.");
      return;
    }

    try {
      setSubmitting(true);
      await updateUserProfile({
        nickname: nickname.trim(),
        age: parseInt(age) || undefined,
        userThumbnailUrl: thumbnailPath || undefined,
      });
      alert("정보가 수정되었습니다.");
      router.back();
    } catch (error: unknown) {
      // 프로필 수정 실패 처리
      let errorMessage = "정보 수정 중 오류가 발생했습니다.";

      if (error && typeof error === "object" && "response" in error) {
        const apiError = error as {
          response?: { status?: number; data?: { error?: string } };
        };
        if (apiError.response?.status === 400) {
          errorMessage =
            apiError.response.data?.error || "입력 정보를 확인해주세요.";
        } else if (apiError.response?.status === 401) {
          errorMessage = "로그인이 필요합니다.";
        }
      }

      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // 로그인 확인
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white">
        <Head>
          <title>내 정보 설정 - 오늘의 건강</title>
        </Head>
        <Header />
        <main className="max-w-6xl mx-auto px-4 md:px-6 py-16 text-center">
          <div className="mb-8">
            <div className="text-gray-400 text-6xl mb-4">👤</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              로그인이 필요합니다
            </h2>
            <p className="text-gray-600 mb-8">
              설정을 변경하려면 로그인해주세요.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              로그인하기
            </button>
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
          <title>내 정보 설정 - 오늘의 건강</title>
        </Head>
        <Header />
        <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">프로필 정보를 불러오는 중...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const cdn =
    process.env.NEXT_PUBLIC_CDN_URL || "https://di7imxmn4pwuq.cloudfront.net";
  const currentImagePath = thumbnailPath || userProfile?.userThumbnailUrl || "";

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>내 정보 설정 - 오늘의 건강</title>
      </Head>

      <Header />

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {/* 페이지 타이틀 */}
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
          <h1 className="text-3xl font-bold text-gray-900">내 정보 설정</h1>
        </div>

        {/* 프로필 사진 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex flex-col items-center">
            {/* 아바타 래퍼: 오버플로우 없음 */}
            <div className="relative w-32 h-32 mb-4">
              {/* 실제 아바타: 동그라미 내부 잘림 */}
              <div className="w-32 h-32 rounded-full overflow-hidden bg-orange-100 flex items-center justify-center">
                {currentImagePath ? (
                  <Image
                    src={`${cdn}/${currentImagePath}`}
                    alt={userProfile?.nickname || "profile"}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-5xl">👤</span>
                )}
              </div>

              {/* 카메라 버튼: 원 밖으로 살짝 겹치도록 위치 */}
              <button
                type="button"
                onClick={handleSelectFile}
                disabled={uploading}
                className="absolute -bottom-2 -right-2 w-11 h-11 bg-orange-500 rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors disabled:opacity-50 shadow-md ring-4 ring-white"
                aria-label="프로필 이미지 변경"
              >
                {uploading ? (
                  <span className="w-4 h-4 border-b-2 border-white rounded-full animate-spin" />
                ) : (
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            <p className="text-sm text-gray-500">
              이미지를 업로드하여 프로필 사진을 변경할 수 있습니다.
            </p>
          </div>
        </div>

        {/* 사용자 정보 입력 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
          <div className="space-y-6">
            {/* 닉네임 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                닉네임<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value.slice(0, 20))}
                  maxLength={20}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                  placeholder="닉네임을 입력해주세요."
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  {nickname.length}/20
                </span>
              </div>
            </div>

            {/* 나이 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                나이
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                placeholder="나이를 입력해주세요."
              />
            </div>
          </div>
        </div>

        {/* 변경하기 버튼 */}
        <div className="flex gap-4">
          <button
            onClick={() => router.back()}
            disabled={submitting}
            className="flex-1 px-6 py-4 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 px-6 py-4 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                수정 중...
              </div>
            ) : (
              "변경하기"
            )}
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
