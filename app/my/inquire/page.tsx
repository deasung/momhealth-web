"use client";

import dynamic from "next/dynamic";

// InquirePageClient 컴포넌트를 동적으로, SSR 없이 불러옵니다.
const InquirePageClient = dynamic(
  () => import("./InquirePageClient"),
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
  return <InquirePageClient />;
}
