import { PopularQuestion } from "@/types/home";

interface PopularQuestionsProps {
  questions: PopularQuestion[];
}

const PopularQuestions = ({ questions }: PopularQuestionsProps) => {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">인기 건강질문</h2>
        <button className="text-blue-600 hover:text-blue-800 font-medium">
          전체보기 →
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {questions.map((question) => (
          <div
            key={question.id}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
          >
            <div className="relative">
              <img
                src={question.thumbnailUrl}
                alt={question.title}
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-3 left-3">
                <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                  {question.type}
                </span>
              </div>
              <div className="absolute top-3 right-3">
                <span className="bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs">
                  👁️ {question.viewCount}
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
                <span>
                  {question.durationMinutes
                    ? `${question.durationMinutes}분`
                    : "시간 미정"}
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

export default PopularQuestions;
