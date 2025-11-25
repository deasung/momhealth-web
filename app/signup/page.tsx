"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SEO from "../../components/SEO";
import api from "../../lib/api";

// 간단한 유효성 규칙
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validatePassword = (pw: string) => {
  // 8자 이상, 영문 소문자 + 숫자 1개 이상
  const ok = /^(?=.*[a-z])(?=.*\d).{8,}$/.test(pw);
  return {
    isValid: ok,
    errorMessage: ok ? "" : "숫자를 포함해 8자 이상 입력해주세요.",
  };
};

type SignupStep = "email" | "password" | "profile";

export default function SignupPage() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<SignupStep>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [age, setAge] = useState("");

  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [ageError, setAgeError] = useState<string | null>(null);

  const canSubmitEmail = useMemo(() => emailRegex.test(email), [email]);
  const passwordValidation = useMemo(
    () => validatePassword(password),
    [password]
  );

  // 이메일 중복 체크
  const handleEmailCheck = async () => {
    if (!canSubmitEmail) {
      setEmailError("올바른 이메일 형식을 입력해주세요.");
      return;
    }
    setLoading(true);
    setEmailError(null);
    try {
      const res = await api.post("/public/auth/email/check", { email });
      if (res?.data?.available) {
        setCurrentStep("password");
      } else {
        setEmailError("이미 등록된 이메일입니다. 다른 이메일을 입력해주세요.");
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setEmailError(
        err?.response?.data?.message || "이메일 확인 중 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  // 비밀번호 다음 단계
  const handlePasswordNext = () => {
    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.errorMessage);
      return;
    }
    setPasswordError(null);
    setCurrentStep("profile");
  };

  // 회원가입 제출
  const handleSignup = async () => {
    if (!nickname.trim()) {
      setNicknameError("닉네임을 입력해주세요.");
      return;
    }
    if (nickname.trim().length < 2) {
      setNicknameError("닉네임은 2자 이상 입력해주세요.");
      return;
    }
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum)) {
      setAgeError("나이는 숫자로만 입력해주세요.");
      return;
    }
    if (ageNum < 14 || ageNum > 100) {
      setAgeError("나이는 14~100세 사이로 입력해주세요.");
      return;
    }

    setLoading(true);
    setNicknameError(null);
    setAgeError(null);

    try {
      const res = await api.post("/public/auth/register", {
        email,
        password,
        nickname: nickname.trim(),
        age: ageNum,
      });
      if (res.status === 201 || res?.data?.success) {
        alert("회원가입이 완료되었습니다. 로그인해 주세요.");
        router.replace("/login");
      } else {
        throw new Error(res?.data?.message || "회원가입에 실패했습니다.");
      }
    } catch (e: unknown) {
      const err = e as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      alert(
        err?.response?.data?.message ||
          err?.message ||
          "회원가입에 실패했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="회원가입" description="오늘의 건강 회원가입" />

      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">회원가입</h1>
            <p className="text-gray-600">간단한 3단계로 가입을 완료하세요.</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            {/* 단계 표시 */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <div
                className={`w-3 h-3 rounded-full ${
                  currentStep === "email" ? "bg-orange-500" : "bg-gray-300"
                }`}
              />
              <div
                className={`w-10 h-0.5 ${
                  currentStep !== "email" ? "bg-orange-500" : "bg-gray-300"
                }`}
              />
              <div
                className={`w-3 h-3 rounded-full ${
                  currentStep === "password" ? "bg-orange-500" : "bg-gray-300"
                }`}
              />
              <div
                className={`w-10 h-0.5 ${
                  currentStep === "profile" ? "bg-orange-500" : "bg-gray-300"
                }`}
              />
              <div
                className={`w-3 h-3 rounded-full ${
                  currentStep === "profile" ? "bg-orange-500" : "bg-gray-300"
                }`}
              />
            </div>

            {currentStep === "email" && (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  이메일
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError(null);
                  }}
                  placeholder="email@account.co.kr"
                  className={`w-full h-12 px-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    emailError ? "border-red-500" : "border-gray-200"
                  }`}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") handleEmailCheck();
                  }}
                />
                {emailError && (
                  <p className="text-xs text-red-500">{emailError}</p>
                )}
                <button
                  type="button"
                  onClick={handleEmailCheck}
                  disabled={!canSubmitEmail || loading}
                  className={`w-full h-12 rounded-lg font-semibold transition-colors ${
                    canSubmitEmail && !loading
                      ? "bg-orange-500 hover:bg-orange-600 text-white"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {loading ? "확인 중..." : "이메일 확인"}
                </button>

                <div className="text-center text-sm text-gray-600 mt-2">
                  이미 계정이 있으신가요?{" "}
                  <Link href="/login" className="hover:underline">
                    로그인
                  </Link>
                </div>
              </div>
            )}

            {currentStep === "password" && (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  비밀번호
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError(null);
                  }}
                  placeholder="숫자를 포함해 8자 이상"
                  className={`w-full h-12 px-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    passwordError ? "border-red-500" : "border-gray-200"
                  }`}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") handlePasswordNext();
                  }}
                />
                {(passwordError || !passwordValidation.isValid) && password && (
                  <p className="text-xs text-red-500">
                    {passwordError || passwordValidation.errorMessage}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep("email")}
                    className="flex-1 h-12 rounded-lg border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                  >
                    이전
                  </button>
                  <button
                    type="button"
                    onClick={handlePasswordNext}
                    disabled={
                      !password || !passwordValidation.isValid || loading
                    }
                    className={`flex-1 h-12 rounded-lg font-semibold transition-colors ${
                      password && passwordValidation.isValid && !loading
                        ? "bg-orange-500 hover:bg-orange-600 text-white"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    다음
                  </button>
                </div>
              </div>
            )}

            {currentStep === "profile" && (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  닉네임
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => {
                    setNickname(e.target.value);
                    setNicknameError(null);
                  }}
                  placeholder="닉네임을 입력해주세요"
                  className={`w-full h-12 px-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    nicknameError ? "border-red-500" : "border-gray-200"
                  }`}
                />
                {nicknameError && (
                  <p className="text-xs text-red-500">{nicknameError}</p>
                )}

                <label className="block text-sm font-medium text-gray-700">
                  나이 (14-100)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={14}
                  max={100}
                  value={age}
                  onChange={(e) => {
                    setAge(e.target.value);
                    setAgeError(null);
                  }}
                  placeholder="나이를 입력해주세요"
                  className={`w-full h-12 px-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    ageError ? "border-red-500" : "border-gray-200"
                  }`}
                />
                {ageError && <p className="text-xs text-red-500">{ageError}</p>}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep("password")}
                    className="flex-1 h-12 rounded-lg border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                  >
                    이전
                  </button>
                  <button
                    type="button"
                    onClick={handleSignup}
                    disabled={
                      !nickname.trim() ||
                      !age ||
                      !!nicknameError ||
                      !!ageError ||
                      loading
                    }
                    className={`flex-1 h-12 rounded-lg font-semibold transition-colors ${
                      nickname.trim() &&
                      age &&
                      !nicknameError &&
                      !ageError &&
                      !loading
                        ? "bg-orange-500 hover:bg-orange-600 text-white"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    가입 완료
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
