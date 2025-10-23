// 질문 아이템 타입
export interface QuestionItem {
  id: number;
  content: string;
  order: number;
}

// 카테고리 타입
export interface Category {
  id: string;
  name: string;
}

// 질문 타입
export interface HealthQuestion {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  isVisible: boolean;
  viewCount: number;
  durationMinutes: number | null;
  durationSeconds: number | null;
  detailDescription: string | null;
  detailThumbnailUrl: string | null;
  createdAt: string;
  primaryCategory: Category | null;
  secondaryCategory: Category | null;
  tertiaryCategory: Category | null;
  items: QuestionItem[];
  questionCount: number;
}

// 질문목록 응답 타입
export interface HealthQuestionsResponse {
  questions: HealthQuestion[];
  nextCursor: string | null;
}

// 질문목록 페이지 Props 타입
export interface HealthQuestionsPageProps {
  initialData: HealthQuestionsResponse;
}
