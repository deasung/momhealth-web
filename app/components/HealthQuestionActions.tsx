"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resetQuizProgress } from "../../lib/api";
import { useAuth } from "../../lib/hooks/useAuth";

interface HealthQuestionActionsProps {
  questionId: string;
  isCompleted: boolean;
}

export default function HealthQuestionActions({
  questionId,
  isCompleted,
}: HealthQuestionActionsProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [resetting, setResetting] = useState(false);

  const handleStartQuestion = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    router.push(`/health-questions/${questionId}/quiz`);
  };

  const handleResetQuestion = async () => {
    if (!isAuthenticated) return;

    try {
      setResetting(true);
      await resetQuizProgress(questionId);
      router.push(`/health-questions/${questionId}/quiz`);
    } catch (error) {
      console.error("퀴즈 리셋 실패:", error);
      alert("퀴즈 리셋에 실패했습니다.");
    } finally {
      setResetting(false);
    }
  };

  if (isAuthenticated && isCompleted) {
    return (
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={handleResetQuestion}
          disabled={resetting}
          className="font-semibold py-4 px-8 rounded-lg text-lg transition-colors duration-200 shadow-lg bg-gray-500 hover:bg-gray-600 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {resetting ? "리셋 중..." : "다시 풀기"}
        </button>
        <button
          onClick={() => router.push(`/health-questions/${questionId}/result`)}
          className="font-semibold py-4 px-8 rounded-lg text-lg transition-colors duration-200 shadow-lg bg-orange-500 hover:bg-orange-600 text-white"
        >
          결과 보기
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleStartQuestion}
      className={`font-semibold py-4 px-8 rounded-lg text-lg transition-colors duration-200 shadow-lg ${
        isAuthenticated
          ? "bg-orange-500 hover:bg-orange-600 text-white"
          : "bg-blue-500 hover:bg-blue-600 text-white"
      }`}
    >
      {isAuthenticated ? "질문 시작하기" : "로그인 후 시작하기"}
    </button>
  );
}
