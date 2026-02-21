"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, getSession, signOut } from "next-auth/react";
import SEO from "../components/SEO";
import { useAuth } from "../../lib/hooks/useAuth";
import { useLogout } from "../../lib/hooks/useLogout";
import { useEnsureAuth } from "../../lib/hooks/useEnsureAuth";
import { clearToken, getGuestToken, setToken } from "../../lib/api";
import { TOKEN_KEYS } from "../../lib/constants";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState(""); // ✅ UX: 성공 메시지 상태

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

  const { isLoading } = useAuth();
  const { logout } = useLogout();
  const { ensureAuth } = useEnsureAuth();
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isRealAuthenticated, setIsRealAuthenticated] = useState(false);

  useEffect(() => {
    const check = async () => {
      const result = await ensureAuth({
        redirectToLogin: false,
        verifyWithServer: true,
      });

      if (result.ok) {
        setIsRealAuthenticated(true);
        setIsAuthChecked(true);
        return;
      }

      // 세션만 살아있고 토큰이 무효/만료인 케이스 정리: 로그인 화면이 보이게 강제
      try {
        await signOut({ redirect: false });
      } catch (e) {
        // ignore
      }

      try {
        localStorage.removeItem(TOKEN_KEYS.TOKEN);
        localStorage.removeItem(TOKEN_KEYS.IS_GUEST);
        localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
        clearToken();
      } catch (e) {
        // ignore
      }

      setIsRealAuthenticated(false);
      setIsAuthChecked(true);
    };

    check();
  }, [ensureAuth]);

  // session_expired 쿼리 파라미터 확인 및 처리
  useEffect(() => {
    const sessionExpired = searchParams?.get("session_expired");
    if (sessionExpired === "true") {
      // 세션 초기화, localStorage 초기화, 게스트 토큰 발급 후 홈으로
      const handleSessionExpired = async () => {
        try {
          // NextAuth 세션 초기화
          await signOut({ redirect: false });

          // localStorage 초기화
          localStorage.removeItem(TOKEN_KEYS.TOKEN);
          localStorage.removeItem(TOKEN_KEYS.IS_GUEST);
          localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
          clearToken();

          // 게스트 토큰 발급
          const guestTokens = await getGuestToken();
          if (guestTokens) {
            setToken(guestTokens.accessToken, true, guestTokens.refreshToken);
          }

          // 홈으로 리다이렉트
          router.replace("/");
        } catch (error) {
          // 에러 발생해도 홈으로 리다이렉트
          router.replace("/");
        }
      };

      handleSessionExpired();
    }
  }, [searchParams, router]);

  // ✅ 성능: 유효성 검사 규칙을 상수로 정의 (컴포넌트 외부로 이동 가능하지만 현재 위치 유지)
  const EMAIL_RULE = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/, []);
  const PW_RULE = useMemo(() => /^(?=.*[a-z])(?=.*\d).{8,}$/, []);

  // 유효성 검사 에러 표시
  const emailErrorDisplay = useMemo(() => {
    if (!touched.email) return "";
    if (!email.trim()) return "이메일을 입력하지 않았습니다.";
    if (!EMAIL_RULE.test(email.trim()))
      return "올바른 이메일 형식을 입력해주세요.";
    return "";
  }, [touched.email, email, EMAIL_RULE]);

  const passwordErrorDisplay = useMemo(() => {
    if (!touched.password) return "";
    if (!password) return "비밀번호를 입력하지 않았습니다.";
    if (!PW_RULE.test(password))
      return "숫자·특수문자를 포함해 8자 이상 입력해주세요.";
    return "";
  }, [touched.password, password, PW_RULE]);

  // ✅ UX: 성공 메시지 자동 숨김
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // ✅ 성능: 에러 모달 표시 함수 메모이제이션
  const showError = useCallback((title: string, message: string) => {
    setErrorModalData({ title, message });
    setShowErrorModal(true);
  }, []);

  // NextAuth error 쿼리 파라미터 처리 (소셜 로그인 콜백 에러 등)
  useEffect(() => {
    if (!searchParams) return;
    const errorParam = searchParams.get("error");
    if (!errorParam) return;

    if (errorParam === "WITHDRAWN_USER") {
      showError(
        "로그인 실패",
        "탈퇴된 계정입니다.\n다른 계정으로 로그인해주세요."
      );
    } else if (errorParam === "ACCESS_DENIED") {
      showError("로그인 실패", "로그인이 거부되었습니다.\n다시 시도해주세요.");
    } else if (errorParam === "EMAIL_IN_USE") {
      showError("로그인 실패", "이미 사용 중인 이메일입니다.");
    } else if (errorParam === "SOCIAL_LOGIN_FAILED") {
      showError(
        "로그인 실패",
        "소셜 로그인에 실패했습니다.\n다시 시도해주세요."
      );
    } else if (errorParam === "ENV_NOT_CONFIGURED") {
      showError(
        "로그인 실패",
        "서버 설정 오류가 발생했습니다.\n잠시 후 다시 시도해주세요."
      );
    }

    // 동일 에러로 모달이 반복 노출되지 않도록 URL에서 error 파라미터 제거
    const params = new URLSearchParams(searchParams.toString());
    params.delete("error");
    const qs = params.toString();
    try {
      window.history.replaceState(null, "", qs ? `/login?${qs}` : "/login");
    } catch (e) {
      router.replace(qs ? `/login?${qs}` : "/login");
    }
  }, [searchParams, router, showError]);

  // 제출 가능 여부 확인
  const canSubmit = useMemo(
    () => email.trim().length > 0 && password.length > 0,
    [email, password]
  );

  // ✅ 성능: 입력 핸들러 메모이제이션
  const handleEmailChange = useCallback((text: string) => {
    setEmail(text);
    setEmailError("");
    setSuccessMessage(""); // ✅ UX: 입력 시 성공 메시지 초기화
  }, []);

  const handlePasswordChange = useCallback((text: string) => {
    setPassword(text);
    setPasswordError("");
    setSuccessMessage(""); // ✅ UX: 입력 시 성공 메시지 초기화
  }, []);

  // 이메일/비밀번호 로그인
  const handleLogin = useCallback(async () => {
    setEmailError("");
    setPasswordError("");
    setSuccessMessage("");

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
          // ✅ UX: alert 제거, 성공 메시지 표시
          setSuccessMessage("로그인 성공! 환영합니다!");
          // 로그인 성공 후 리다이렉트 (선택적)
          setTimeout(() => {
            router.push("/");
          }, 1500);
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
  }, [email, password, router, showError, EMAIL_RULE]);

  // ✅ UX: Enter 키로 로그인 제출
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && canSubmit && !loading) {
        handleLogin();
      }
    },
    [canSubmit, loading, handleLogin]
  );

  const handleSignUp = useCallback(() => router.push("/signup"), [router]);
  const handleForgotPassword = useCallback(
    () => router.push("/forgot-password"),
    [router]
  );

  // ✅ UX: 비밀번호 표시/숨기기 SVG 아이콘 컴포넌트
  const EyeIcon = ({ show }: { show: boolean }) => (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      {show ? (
        <>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
          />
        </>
      ) : (
        <>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </>
      )}
    </svg>
  );

  // 로딩 중이거나 이미 인증된 경우 로딩 표시
  if (isLoading || !isAuthChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <SEO
          title="로그인"
          description="오늘의 건강에 로그인하여 건강 관리 서비스를 이용해보세요."
          noindex={true}
        />
        <div className="text-center">
          {/* ✅ UX: 로딩 상태 개선 */}
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-200 border-t-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title="로그인"
        description="오늘의 건강에 로그인하여 건강 관리 서비스를 이용해보세요."
        noindex={true}
      />
      <div className="flex items-center justify-center min-h-screen px-4 py-12">
        <div className="w-full max-w-md">
          {/* ✅ 디자인: 헤더 섹션 개선 */}
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              쉽게 가입하고,
              <br />
              모든 서비스를 이용할 수 있어요
            </h1>
            <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
              오늘의 건강
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
            {isRealAuthenticated && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700 font-medium">
                  이미 로그인되어 있습니다. 다른 계정으로 로그인하거나 로그아웃할 수 있어요.
                </p>
              </div>
            )}
            {/* ✅ UX: 성공 메시지 표시 */}
            {successMessage && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-green-500 flex-shrink-0"
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
                  <p className="text-sm text-green-700 font-medium">
                    {successMessage}
                  </p>
              </div>
            )}
            {/* 소셜 로그인 섹션 */}
            <div className="space-y-3 mb-6">
              <button
                type="button"
                onClick={() => signIn("kakao", { callbackUrl: "/" })}
                className="w-full h-14 rounded-xl bg-[#FEE500] text-black font-semibold hover:brightness-95 active:brightness-90 transition-all flex items-center justify-center gap-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
                aria-label="카카오 계정으로 로그인"
              >
                <img
                  src="/kakao.svg"
                  alt=""
                  className="w-5 h-5"
                  aria-hidden="true"
                />
                카카오 계정으로 시작하기
              </button>

              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl: "/" })}
                className="w-full h-14 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 active:bg-gray-100 transition-all flex items-center justify-center gap-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                aria-label="구글 계정으로 로그인"
              >
                <img
                  src="/google.svg"
                  alt=""
                  className="w-5 h-5"
                  aria-hidden="true"
                />
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
                  className="w-full h-14 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 active:bg-gray-100 transition-all flex items-center justify-center gap-3 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                >
                  이메일로 시작하기
                </button>
              )}

              {/* 이메일 로그인 폼 */}
              {showEmailForm && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-semibold text-gray-900">
                      이메일로 로그인
                    </h2>
                    <button
                      type="button"
                      onClick={() => {
                        setShowEmailForm(false);
                        setEmail("");
                        setPassword("");
                        setEmailError("");
                        setPasswordError("");
                        setSuccessMessage("");
                      }}
                      className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded p-1"
                      aria-label="이메일 로그인 폼 닫기"
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (canSubmit && !loading) {
                        handleLogin();
                      }
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        이메일
                      </label>
                      <div className="relative">
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => handleEmailChange(e.target.value)}
                          onBlur={() =>
                            setTouched((prev) => ({ ...prev, email: true }))
                          }
                          onFocus={() => setFocusKey("email")}
                          onKeyPress={handleKeyPress}
                          placeholder="이메일을 입력해주세요"
                          autoComplete="email"
                          className={`w-full h-12 px-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors ${
                            focusKey === "email"
                              ? "border-orange-300"
                              : emailError || emailErrorDisplay
                              ? "border-red-500"
                              : "border-gray-200"
                          }`}
                          aria-invalid={!!(emailError || emailErrorDisplay)}
                          aria-describedby={
                            emailError || emailErrorDisplay
                              ? "email-error"
                              : undefined
                          }
                        />
                        {email && (
                          <button
                            type="button"
                            onClick={() => {
                              setEmail("");
                              setEmailError("");
                            }}
                            className="absolute inset-y-0 right-0 px-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                            aria-label="이메일 지우기"
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
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                      {(emailError || emailErrorDisplay) && (
                        <div
                          id="email-error"
                          className="mt-1 flex items-center gap-1"
                          role="alert"
                        >
                          <svg
                            className="w-4 h-4 text-red-500 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-red-500 text-xs">
                            {emailError || emailErrorDisplay}
                          </span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="password"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        비밀번호
                      </label>
                      <div className="relative">
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => handlePasswordChange(e.target.value)}
                          onBlur={() =>
                            setTouched((prev) => ({ ...prev, password: true }))
                          }
                          onFocus={() => setFocusKey("password")}
                          onKeyPress={handleKeyPress}
                          placeholder="비밀번호를 입력해주세요"
                          autoComplete="current-password"
                          className={`w-full h-12 px-4 pr-20 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors ${
                            focusKey === "password"
                              ? "border-orange-300"
                              : passwordError || passwordErrorDisplay
                              ? "border-red-500"
                              : "border-gray-200"
                          }`}
                          aria-invalid={
                            !!(passwordError || passwordErrorDisplay)
                          }
                          aria-describedby={
                            passwordError || passwordErrorDisplay
                              ? "password-error"
                              : undefined
                          }
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center gap-2 pr-3">
                          {password && (
                            <button
                              type="button"
                              onClick={() => {
                                setPassword("");
                                setPasswordError("");
                              }}
                              className="text-gray-400 hover:text-gray-600 focus:outline-none"
                              aria-label="비밀번호 지우기"
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
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-gray-400 hover:text-gray-600 focus:outline-none"
                            aria-label={
                              showPassword
                                ? "비밀번호 숨기기"
                                : "비밀번호 보이기"
                            }
                          >
                            <EyeIcon show={showPassword} />
                          </button>
                        </div>
                      </div>
                      {(passwordError || passwordErrorDisplay) && (
                        <div
                          id="password-error"
                          className="mt-1 flex items-center gap-1"
                          role="alert"
                        >
                          <svg
                            className="w-4 h-4 text-red-500 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-red-500 text-xs">
                            {passwordError || passwordErrorDisplay}
                          </span>
                        </div>
                      )}
                    </div>

                    {canSubmit ? (
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 active:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                      >
                        {loading ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg
                              className="animate-spin h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            로그인 중...
                          </span>
                        ) : (
                          "로그인"
                        )}
                      </button>
                    ) : (
                      <div className="w-full h-12 rounded-lg bg-gray-200 text-gray-500 font-semibold flex items-center justify-center cursor-not-allowed">
                        로그인
                      </div>
                    )}
                  </form>
                </div>
              )}
          </div>

          <div className="mt-6 text-center text-sm text-gray-600">
            <button
              type="button"
              onClick={handleSignUp}
              className="hover:underline text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 rounded px-1"
            >
              이메일로 회원가입
            </button>
            <span className="mx-2 text-gray-400" aria-hidden="true">
              ·
            </span>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="hover:underline text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 rounded px-1"
            >
              비밀번호 찾기
            </button>
          </div>

          {isRealAuthenticated && (
            <div className="mt-6 bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="w-full h-12 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 active:bg-orange-700 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
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
                  className="w-full h-12 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 active:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                >
                  로그아웃
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ✅ UX: 에러 모달 개선 */}
      {showErrorModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowErrorModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="error-modal-title"
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3
                id="error-modal-title"
                className="text-lg font-semibold text-gray-800 mb-2"
              >
                {errorModalData.title}
              </h3>
              <p className="text-sm text-gray-600 mb-6 whitespace-pre-line">
                {errorModalData.message}
              </p>
              <button
                onClick={() => setShowErrorModal(false)}
                className="w-full h-10 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 active:bg-orange-700 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
