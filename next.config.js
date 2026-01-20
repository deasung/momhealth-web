/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true, // 표준 성능 최적화 활성화
    poweredByHeader: false,

    // 이미지는 필요에 따라 유지
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "d2n4p0bysgra0c.cloudfront.net",
            },
            {
                protocol: "https",
                hostname: "di7imxmn4pwuq.cloudfront.net",
            },
        ],
    },

    // 불필요한 빌드 무시 설정은 제거하거나 필요시에만 유지
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
};

module.exports = nextConfig;