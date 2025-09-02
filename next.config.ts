import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        domains: ["firebasestorage.googleapis.com"],
    },
    experimental: {
        serverComponentsExternalPackages: ['@opennextjs/cloudflare'],
    },
    typescript: {
        // !! WARN !!
        // Dangerously allow production builds to successfully complete even if
        // your project has type errors.
        // !! WARN !!
        ignoreBuildErrors: true,
      },
};

export default nextConfig;
