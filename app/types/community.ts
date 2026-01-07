// 커뮤니티 게시글 타입 정의
export interface CommunityAuthor {
  id: string;
  nickname: string;
  userThumbnailUrl: string | null;
}

export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  author: CommunityAuthor;
  commentCount: number;
  timeAgo: string;
}

export interface CommunityResponse {
  posts: CommunityPost[];
  nextCursor: string | null;
}

// 커뮤니티 댓글 타입
export interface CommunityComment {
  id: string;
  content: string;
  authorId: string;
  postId: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  author: CommunityAuthor;
}

// 커뮤니티 상세 게시글 타입
export interface CommunityPostDetail {
  id: string;
  type: string;
  status: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  author: CommunityAuthor;
  comments: CommunityComment[];
  timeAgo: string;
  viewCount: number;
}
