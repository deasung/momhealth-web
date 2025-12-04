// app/types/dto.ts
// Data Transfer Object - 클라이언트로 전달되는 최소한의 데이터만 정의
// RSC Payload 최적화를 위한 타입 정의

/**
 * 질문 카드 표시에 필요한 최소 필드만 추출
 * 전체 PopularQuestion 객체 대신 이 DTO만 전달하여 직렬화 비용 감소
 */
export type QuestionCardDTO = {
  id: number;
  title: string;
  description: string;
  thumbnailUrl: string;
  durationMinutes: number | null;
  createdAt: string;
  // readTime은 RecommendedQuestion에만 필요
  readTime?: string;
};

/**
 * 질문 목록 카드에 필요한 최소 필드
 * HealthQuestionDetail의 모든 필드 대신 필요한 것만
 */
export type QuestionListItemDTO = {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  primaryCategory: {
    id: string;
    name: string;
  } | null;
  secondaryCategory: {
    id: string;
    name: string;
  } | null;
  questionCount: number;
  durationSeconds: number;
  viewCount: number;
};

/**
 * 커뮤니티 게시글 목록 카드에 필요한 최소 필드
 */
export type CommunityPostCardDTO = {
  id: string;
  title: string;
  content: string;
  type: string;
  createdAt: string;
  author: {
    id: string;
    nickname: string;
    userThumbnailUrl: string | null;
  };
  commentCount: number;
  timeAgo: string;
};
