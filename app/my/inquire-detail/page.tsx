"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

// InquireDetailPageClient 컴포넌트를 동적으로, SSR 없이 불러옵니다.
const InquireDetailPageClient = dynamic(
  () => import("./InquireDetailPageClient"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    ),
  }
);

// 이 페이지는 URL 쿼리 파라미터를 사용하므로 Suspense로 감싸줍니다.
export default function Page() {
  return (
    <Suspense>
      <InquireDetailPageClient />
    </Suspense>
  );
}
