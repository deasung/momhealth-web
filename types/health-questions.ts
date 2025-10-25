export interface QuestionItem {
  id: number;
  content: string;
  order: number;
}

export interface Category {
  id: string;
  name: string;
}

export interface UserProgress {
  isCompleted: boolean;
  score: number | null;
  completedAt: string | null;
  result: any;
}

export interface HealthQuestionDetail {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  isVisible: boolean;
  viewCount: number;
  durationMinutes: number | null;
  durationSeconds: number;
  detailDescription: string | null;
  detailThumbnailUrl: string;
  createdAt: string;
  primaryCategory: Category;
  secondaryCategory: Category;
  tertiaryCategory: Category | null;
  items: QuestionItem[];
  questionResults: any[];
  questionCount: number;
  userProgress?: UserProgress;
}
