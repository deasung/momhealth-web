// 동적 메타데이터 생성을 위한 유틸리티 함수들

export interface PageMetadata {
  title: string;
  description: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  canonical?: string;
  noindex?: boolean;
}

// 기본 메타데이터 설정
export const defaultMetadata: PageMetadata = {
  title: "오늘의 건강",
  description: "건강한 하루를 위한 맞춤형 건강 관리 서비스",
  keywords: "건강, 의료, 질문, 커뮤니티, 건강관리",
  ogImage: "/og-image.jpg",
};

// 페이지별 메타데이터 설정
export const pageMetadata: Record<string, PageMetadata> = {
  home: {
    title: "홈",
    description:
      "건강한 하루를 위한 맞춤형 건강 관리 서비스입니다. 건강 질문, 커뮤니티, 친구와의 건강 공유를 통해 더 나은 건강을 만들어보세요.",
    keywords: "건강 관리, 건강 질문, 건강 커뮤니티, 건강 공유",
  },
  community: {
    title: "커뮤니티",
    description:
      "건강에 대한 다양한 이야기와 경험을 공유하는 커뮤니티입니다. 건강 질문과 리뷰를 확인하고 참여해보세요.",
    keywords: "건강 커뮤니티, 건강 질문, 건강 리뷰, 건강 경험 공유",
  },
  "community-detail": {
    title: "커뮤니티 게시글",
    description: "건강 커뮤니티 게시글을 확인하고 댓글을 남겨보세요.",
    keywords: "건강 커뮤니티, 건강 질문, 건강 리뷰",
  },
  "health-questions": {
    title: "건강 질문",
    description: "다양한 건강 질문을 통해 나의 건강 상태를 확인해보세요.",
    keywords: "건강 질문, 건강 체크, 건강 상태 확인",
  },
  friends: {
    title: "친구",
    description: "친구와 함께 건강을 관리하고 서로의 건강 상태를 공유해보세요.",
    keywords: "건강 친구, 건강 공유, 건강 관리",
  },
  my: {
    title: "마이페이지",
    description: "나의 건강 정보와 활동 내역을 확인하고 관리해보세요.",
    keywords: "마이페이지, 건강 정보, 활동 내역",
  },
  login: {
    title: "로그인",
    description: "오늘의 건강에 로그인하여 건강 관리 서비스를 이용해보세요.",
    keywords: "로그인, 회원가입, 건강 서비스",
    noindex: true,
  },
};

// 동적 메타데이터 생성 함수
export function generatePageMetadata(
  pageKey: string,
  dynamicData?: {
    title?: string;
    description?: string;
    author?: string;
    publishedTime?: string;
    modifiedTime?: string;
  }
): PageMetadata {
  const baseMetadata = pageMetadata[pageKey] || defaultMetadata;

  if (!dynamicData) {
    return baseMetadata;
  }

  return {
    ...baseMetadata,
    title: dynamicData.title || baseMetadata.title,
    description: dynamicData.description || baseMetadata.description,
    ogTitle: dynamicData.title || baseMetadata.ogTitle || baseMetadata.title,
    ogDescription:
      dynamicData.description ||
      baseMetadata.ogDescription ||
      baseMetadata.description,
  };
}

// 커뮤니티 게시글 상세 페이지용 메타데이터 생성
export function generateCommunityPostMetadata(post: {
  title: string;
  content: string;
  author: { nickname: string };
  type: string;
  createdAt: string;
}) {
  const truncatedContent =
    post.content.length > 150
      ? post.content.substring(0, 150) + "..."
      : post.content;

  return {
    title: post.title,
    description: `${post.type} - ${truncatedContent}`,
    keywords: `건강 커뮤니티, ${post.type}, ${post.author.nickname}`,
    ogTitle: post.title,
    ogDescription: truncatedContent,
    ogUrl: `${
      process.env.NEXT_PUBLIC_SITE_URL || "https://medigen.ai.kr"
    }/community/${post.id}`,
  };
}

// 건강 질문 상세 페이지용 메타데이터 생성
export function generateHealthQuestionMetadata(question: {
  title: string;
  description: string;
  category: string;
}) {
  const truncatedDescription =
    question.description.length > 150
      ? question.description.substring(0, 150) + "..."
      : question.description;

  return {
    title: question.title,
    description: truncatedDescription || question.title,
    keywords: `건강 질문, ${question.category}, 건강 체크`,
    ogTitle: question.title,
    ogDescription: truncatedDescription || question.title,
  };
}
