import { useState } from "react";
import Link from "next/link";
import SEO from "../components/SEO";
import { requestPasswordReset } from "../lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!email.trim()) {
      setError("이메일을 입력해주세요.");
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("올바른 이메일 형식을 입력해주세요.");
      return;
    }

    setSending(true);
    setError(null);

    try {
      await requestPasswordReset(email.trim());
      setSuccess(true);
    } catch (e: unknown) {
      const err = e as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
      };
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "이메일 발송에 실패했습니다. 다시 시도해주세요.";
      setError(errorMessage);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <SEO
        title="비밀번호 찾기"
        description="비밀번호를 잊으셨나요? 가입하신 이메일로 비밀번호 재설정 링크를 보내드립니다."
      />
      <Head>
        <title>비밀번호 찾기 | 오늘의 건강</title>
      </Head>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              비밀번호 찾기
            </h1>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            {success ? (
              // 성공 상태
              <div className="text-center">
                <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-green-500"
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
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  이메일이 발송되었습니다
                </h2>
                <p className="text-gray-600 mb-6">
                  <span className="font-medium text-gray-900">{email}</span>
                  <br />
                  로 비밀번호 재설정 이메일을 보냈습니다.
                  <br />
                  이메일을 확인하여 비밀번호를 재설정해주세요.
                </p>
                <Link
                  href="/login"
                  className="inline-block w-full px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold"
                >
                  로그인 페이지로 돌아가기
                </Link>
              </div>
            ) : (
              // 입력 폼
              <div>
                <p className="text-gray-600 mb-6 text-center">
                  비밀번호를 잊으셨나요?
                  <br />
                  가입하신 이메일을 입력해주세요.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이메일
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError(null);
                      }}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleSend();
                        }
                      }}
                      placeholder="이메일을 입력해주세요"
                      className={`w-full h-12 px-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        error ? "border-red-500" : "border-gray-200"
                      }`}
                      disabled={sending}
                    />
                    {error && (
                      <div className="mt-2 flex items-center gap-1">
                        <span className="text-red-500 text-xs">⚠️</span>
                        <span className="text-red-500 text-xs">{error}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!email.trim() || sending}
                    className={`w-full h-12 rounded-lg font-semibold transition-colors ${
                      email.trim() && !sending
                        ? "bg-orange-500 hover:bg-orange-600 text-white"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {sending ? "발송 중..." : "비밀번호 재설정 이메일 보내기"}
                  </button>
                </div>

                <div className="mt-6 text-center">
                  <Link
                    href="/login"
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    로그인 페이지로 돌아가기
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
