import type { Metadata, Viewport } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../lib/auth";
import ClientProviders from "./components/ClientProviders";
import AnalyticsListener from "./components/AnalyticsListener";
import "../styles/globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://medigen.ai.kr";
const ogImage = `${siteUrl}/og-image.png`;
const defaultTitle = "오늘의 건강";
const defaultDescription =
    "건강한 하루를 위한 맞춤형 건강 관리 서비스입니다. 건강 질문, 커뮤니티, 친구와의 건강 공유를 통해 더 나은 건강을 만들어보세요.";

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
        default: defaultTitle,
        template: `%s | ${defaultTitle}`,
    },
    description: defaultDescription,
    keywords: ["건강", "의료", "질문", "커뮤니티", "건강관리"],
    authors: [{ name: "오늘의 건강" }],
    creator: "오늘의 건강",
    publisher: "오늘의 건강",
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
    alternates: {
        canonical: siteUrl,
    },
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    openGraph: {
        type: "website",
        locale: "ko_KR",
        url: siteUrl,
        siteName: "오늘의 건강",
        title: defaultTitle,
        description: defaultDescription,
        images: [
            {
                url: ogImage,
                width: 1200,
                height: 630,
                type: "image/png",
                alt: "오늘의 건강 - 건강한 하루를 위한 맞춤형 건강 관리 서비스",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: defaultTitle,
        description: defaultDescription,
        images: [ogImage],
    },
    icons: {
        icon: [{ url: "/favicon_32x32.png", sizes: "32x32", type: "image/png" }],
        apple: [{ url: "/favicon_32x32.png", sizes: "32x32", type: "image/png" }],
        shortcut: "/favicon_32x32.png",
    },
    verification: {
        // google: "your-google-verification-code",
        // naver: "your-naver-verification-code",
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    themeColor: "#ff5b24",
};

export default async function RootLayout({
                                             children,
                                         }: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    return (
        <html lang="ko">
        <body className="antialiased">
        <ClientProviders session={session}>
            <AnalyticsListener />
            {children}
        </ClientProviders>
        </body>
        </html>
    );
}
