import type { NextPage } from "next";
import Head from "next/head";
import { useState, useMemo } from "react";
import { useRouter } from "next/router";
import { signIn, getSession } from "next-auth/react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useLogout } from "@/lib/hooks/useLogout";

const LoginPage: NextPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  // 터치/포커스 상태
  const [touched, setTouched] = useState({ email: false, password: false });
  const [focusKey, setFocusKey] = useState<"email" | "password" | null>(null);

  // 에러 상태
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // 에러 모달
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalData, setErrorModalData] = useState({
    title: "",
    message: "",
  });

  const router = useRouter();
  const { isAuthenticated, isGuest, isLoading } = useAuth();
  const { logout } = useLogout();

  // 유효성 검사 규칙
  const EMAIL_RULE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PW_RULE = /^(?=.*[a-z])(?=.*\d).{8,}$/;

  // 유효성 검사 에러 표시
  const emailErrorDisplay = useMemo(() => {
    if (!touched.email) return "";
    if (!email.trim()) return "이메일을 입력하지 않았습니다.";
    if (!EMAIL_RULE.test(email.trim()))
      return "올바른 이메일 형식을 입력해주세요.";
    return "";
  }, [touched.email, email]);

  const passwordErrorDisplay = useMemo(() => {
    if (!touched.password) return "";
    if (!password) return "비밀번호를 입력하지 않았습니다.";
    if (!PW_RULE.test(password))
      return "숫자·특수문자를 포함해 8자 이상 입력해주세요.";
    return "";
  }, [touched.password, password]);

  // 에러 모달 표시 함수
  const showError = (title: string, message: string) => {
    setErrorModalData({ title, message });
    setShowErrorModal(true);
  };

  // 제출 가능 여부 확인
  const canSubmit = email.trim().length > 0 && password.length > 0;

  // 입력 핸들러
  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) setEmailError("");
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (passwordError) setPasswordError("");
  };

  // 이미 로그인된 사용자 리다이렉트 (선택적)
  // useEffect(() => {
  //   if (!isLoading && isAuthenticated) {
  //     router.push("/");
  //   }
  // }, [isAuthenticated, isLoading, router]);

  // 이메일/비밀번호 로그인
  const handleLogin = async () => {
    setEmailError("");
    setPasswordError("");

    let hasError = false;
    if (!email) {
      setEmailError("이메일을 입력하지 않았습니다.");
      hasError = true;
    } else if (!EMAIL_RULE.test(email)) {
      setEmailError("올바른 이메일 형식을 입력해주세요.");
      hasError = true;
    }
    if (!password) {
      setPasswordError("비밀번호를 입력하지 않았습니다.");
      hasError = true;
    }
    if (hasError) return;

    setLoading(true);
    try {
      // NextAuth를 사용한 로그인
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
      }

      if (result?.ok) {
        // 로그인 성공 시 세션 확인
        const session = await getSession();
        if (session) {
          alert("로그인 성공! 환영합니다!");
          // 로그인 성공 후 리다이렉트 (선택적)
          router.push("/");
        }
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "로그인 중 오류가 발생했습니다.";
      showError("로그인 실패", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => router.push("/signup");
  const handleForgotPassword = () => router.push("/forgot-password");

  // 로딩 중이거나 이미 인증된 경우 로딩 표시
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>로그인 | 오늘의 건강</title>
      </Head>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* 헤더 섹션 */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              쉽게 가입하고,
              <br />
              모든 서비스를 이용할 수 있어요
            </h1>
            <p className="text-gray-600 text-base leading-relaxed">
              오늘의 건강
            </p>
          </div>

          {!isAuthenticated && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              {/* 소셜 로그인 섹션 */}
              <div className="space-y-3 mb-6">
                <button
                  type="button"
                  onClick={() => signIn("kakao", { callbackUrl: "/" })}
                  className="w-full h-14 rounded-xl bg-[#FEE500] text-black font-semibold hover:brightness-95 transition-all flex items-center justify-center gap-3 shadow-sm"
                >
                  <img src="/kakao.svg" alt="카카오" className="w-5 h-5" />
                  카카오 계정으로 시작하기
                </button>

                <button
                  type="button"
                  onClick={() => signIn("google", { callbackUrl: "/" })}
                  className="w-full h-14 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-3 shadow-sm"
                >
                  <img src="/google.svg" alt="구글" className="w-5 h-5" />
                  구글 계정으로 시작하기
                </button>
              </div>

              {/* 구분선 */}
              <div className="flex items-center gap-3 my-6">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-sm text-gray-400">또는</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              {/* 이메일 로그인 섹션 */}
              {!showEmailForm && (
                <button
                  type="button"
                  onClick={() => setShowEmailForm(true)}
                  className="w-full h-14 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-3"
                >
                  이메일로 시작하기
                </button>
              )}

              {/* 이메일 로그인 폼 */}
              {showEmailForm && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      이메일로 로그인
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowEmailForm(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      이메일
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => handleEmailChange(e.target.value)}
                        onBlur={() =>
                          setTouched((prev) => ({ ...prev, email: true }))
                        }
                        onFocus={() => setFocusKey("email")}
                        placeholder="이메일을 입력해주세요"
                        className={`w-full h-12 px-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                          focusKey === "email"
                            ? "border-orange-300"
                            : emailError || emailErrorDisplay
                            ? "border-red-500"
                            : "border-gray-200"
                        }`}
                      />
                      {email && (
                        <button
                          type="button"
                          onClick={() => {
                            setEmail("");
                            setEmailError("");
                          }}
                          className="absolute inset-y-0 right-0 px-3 text-gray-400 hover:text-gray-600"
                          aria-label="이메일 지우기"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    {(emailError || emailErrorDisplay) && (
                      <div className="mt-1 flex items-center gap-1">
                        <span className="text-red-500 text-xs">⚠️</span>
                        <span className="text-red-500 text-xs">
                          {emailError || emailErrorDisplay}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      비밀번호
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => handlePasswordChange(e.target.value)}
                        onBlur={() =>
                          setTouched((prev) => ({ ...prev, password: true }))
                        }
                        onFocus={() => setFocusKey("password")}
                        placeholder="비밀번호를 입력해주세요"
                        className={`w-full h-12 px-4 pr-20 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                          focusKey === "password"
                            ? "border-orange-300"
                            : passwordError || passwordErrorDisplay
                            ? "border-red-500"
                            : "border-gray-200"
                        }`}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center gap-2 pr-3">
                        {password && (
                          <button
                            type="button"
                            onClick={() => {
                              setPassword("");
                              setPasswordError("");
                            }}
                            className="text-gray-400 hover:text-gray-600"
                            aria-label="비밀번호 지우기"
                          >
                            ✕
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-gray-400 hover:text-gray-600"
                          aria-label="비밀번호 표시 전환"
                        >
                          <img
                            src="/eyes_off_illust.svg"
                            alt={
                              showPassword
                                ? "비밀번호 숨기기"
                                : "비밀번호 보이기"
                            }
                            className="w-5 h-5"
                          />
                        </button>
                      </div>
                    </div>
                    {(passwordError || passwordErrorDisplay) && (
                      <div className="mt-1 flex items-center gap-1">
                        <span className="text-red-500 text-xs">⚠️</span>
                        <span className="text-red-500 text-xs">
                          {passwordError || passwordErrorDisplay}
                        </span>
                      </div>
                    )}
                  </div>

                  {canSubmit ? (
                    <button
                      type="button"
                      onClick={handleLogin}
                      disabled={loading}
                      className="w-full h-12 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "로그인 중..." : "로그인"}
                    </button>
                  ) : (
                    <div className="w-full h-12 rounded-lg bg-gray-200 text-gray-500 font-semibold flex items-center justify-center">
                      로그인
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {!isAuthenticated && (
            <div className="mt-6 text-center text-sm text-gray-600">
              <button
                type="button"
                onClick={handleSignUp}
                className="hover:underline text-gray-600"
              >
                이메일로 회원가입
              </button>
              <span className="mx-2 text-gray-400">·</span>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="hover:underline text-gray-600"
              >
                비밀번호 찾기
              </button>
            </div>
          )}

          {isAuthenticated && (
            <div className="mt-6 bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="w-full h-12 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors"
                >
                  홈으로 이동
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("로그아웃하시겠습니까?")) {
                      logout();
                    }
                  }}
                  className="w-full h-12 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                >
                  로그아웃
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 에러 모달 */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full">
            <div className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-red-500 text-2xl">⚠️</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {errorModalData.title}
              </h3>
              <p className="text-sm text-gray-600 mb-6 whitespace-pre-line">
                {errorModalData.message}
              </p>
              <button
                onClick={() => setShowErrorModal(false)}
                className="w-full h-10 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
              >
                다시 입력하기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LoginPage;
