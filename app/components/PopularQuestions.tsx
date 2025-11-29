"use client";

import { PopularQuestion } from "../types/home";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface PopularQuestionsProps {
  questions: PopularQuestion[];
}

const PopularQuestions = ({ questions }: PopularQuestionsProps) => {
  const router = useRouter();

  const handleQuestionClick = (questionId: string | number) => {
    router.push(`/health-questions/${questionId}`);
  };
  return (
    <section className="mb-12 md:mb-16">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
          인기 건강질문
        </h2>
        <Link
          href="/health-questions/list"
          className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white px-4 sm:px-5 py-2.5 rounded-lg transition-colors text-sm sm:text-base font-medium min-h-[44px] shadow-sm hover:shadow-md"
          aria-label="인기 건강질문 전체보기"
        >
          <span>전체보기</span>
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
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
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
        {questions.map((question) => (
          <article
            key={question.id}
            onClick={() => handleQuestionClick(question.id)}
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer border border-gray-100 group"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleQuestionClick(question.id);
              }
            }}
            aria-label={`${question.title} 질문 보기`}
          >
            <div className="relative w-full h-48 sm:h-52 overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50">
              <Image
                src={question.thumbnailUrl}
                alt={question.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>

            <div className="p-4 sm:p-5">
              <h3 className="font-bold text-gray-900 text-base sm:text-lg mb-2 line-clamp-2 leading-tight group-hover:text-orange-600 transition-colors">
                {question.title}
              </h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                {question.description}
              </p>

              <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 pt-3 border-t border-gray-100">
                <span className="flex items-center gap-1.5">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>
                    {question.durationMinutes
                      ? `${question.durationMinutes}분`
                      : "시간 미정"}
                  </span>
                </span>
                <time
                  dateTime={question.createdAt}
                  className="flex items-center gap-1.5"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>
                    {new Date(question.createdAt).toLocaleDateString("ko-KR")}
                  </span>
                </time>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default PopularQuestions;
