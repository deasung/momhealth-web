"use client";

import dynamic from "next/dynamic";

// MyPageClient 컴포넌트를 동적으로, SSR 없이 불러옵니다.
// 로딩 중에는 간단한 스피너를 보여줍니다.
const MyPageClient = dynamic(
  () => import("./MyPageClient"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    ),
  }
);

export default function Page() {
  return <MyPageClient />;
}
