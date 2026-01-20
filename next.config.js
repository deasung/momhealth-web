/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: false,
    poweredByHeader: false,
    output: "standalone",
    images: {
        remotePatterns: [
            { protocol: "https", hostname: "d2n4p0bysgra0c.cloudfront.net" },
            { protocol: "https", hostname: "di7imxmn4pwuq.cloudfront.net" },
        ],
    },
    eslint: { ignoreDuringBuilds: true },
    typescript: { ignoreBuildErrors: true },
};

module.exports = nextConfig;