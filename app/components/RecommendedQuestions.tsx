"use client";

import { RecommendedQuestion } from "../types/home";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface RecommendedQuestionsProps {
  questions: RecommendedQuestion[];
}

const RecommendedQuestions = ({ questions }: RecommendedQuestionsProps) => {
  const router = useRouter();

  const handleQuestionClick = (questionId: string | number) => {
    router.push(`/health-questions/${questionId}`);
  };

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">추천 건강질문</h2>
        <Link
          href="/health-questions/list"
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
        >
          전체보기 →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {questions.map((question) => (
          <div
            key={question.id}
            onClick={() => handleQuestionClick(question.id)}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden cursor-pointer"
          >
            <div className="relative">
              <img
                src={question.thumbnailUrl}
                alt={question.title}
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-3 right-3">
                <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                  추천
                </span>
              </div>
            </div>

            <div className="p-4">
              <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">
                {question.title}
              </h3>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {question.description}
              </p>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span className="text-blue-600 font-medium">
                  {question.readTime}
                </span>
                <span>
                  {new Date(question.createdAt).toLocaleDateString("ko-KR")}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RecommendedQuestions;
