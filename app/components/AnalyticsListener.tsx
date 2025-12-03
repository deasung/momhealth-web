// app/components/AnalyticsListener.tsx
"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { logAnalyticsEvent } from "../../lib/firebase"; // 경로는 실제 파일 위치에 맞게

const AnalyticsListener = () => {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        const trackPageView = async () => {
            const query = searchParams?.toString();
            const url = pathname + (query ? `?${query}` : "");

            await logAnalyticsEvent("page_view", {
                page_path: url,
                page_location:
                    typeof window !== "undefined" ? window.location.href : undefined,
            });
        };

        trackPageView();
    }, [pathname, searchParams]);

    return null;
};

export default AnalyticsListener;
