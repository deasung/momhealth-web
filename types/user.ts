// 사용자 프로필 관련 타입 정의

export interface UserProfile {
  id: number;
  email: string;
  nickname: string;
  age: number;
  userThumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
  provider: string | null;
  socialProvider: string | null;
  isSocial: boolean;
  loginType: string;
  socialAccounts: any[];
}

export interface UserProfileResponse {
  user: UserProfile;
}
