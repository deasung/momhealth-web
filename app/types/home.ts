export interface PopularQuestion {
  id: number;
  title: string;
  description: string;
  thumbnailUrl: string;
  durationMinutes: number | null;
  createdAt: string;
  viewCount: number;
  type: string;
}

export interface RecommendedQuestion {
  id: number;
  title: string;
  description: string;
  thumbnailUrl: string;
  durationMinutes: number | null;
  createdAt: string;
}

export interface CommunityPost {
  id: number;
  title: string;
  content: string;
  authorName: string;
  commentCount: number;
  createdAt: string;
  type: string;
  timeAgo: string;
}

export interface HomeData {
  popularQuestions: PopularQuestion[];
  recommendedQuestions: RecommendedQuestion[];
  communityPosts: CommunityPost[];
}
