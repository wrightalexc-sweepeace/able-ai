import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        domains: ["firebasestorage.googleapis.com"],
    },
    experimental: {
        serverComponentsExternalPackages: ['@opennextjs/cloudflare'],
    },
};

export default nextConfig;
