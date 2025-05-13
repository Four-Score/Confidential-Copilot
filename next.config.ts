import type { NextConfig } from "next";


const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Configure experimental features
  experimental: {
    // Turbopack disabled by default 
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Provide fallbacks for Node.js core modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        http: false,
        https: false,
        url: false,
        util: false,
        zlib: false,
        path: false,
        stream: false,
        crypto: false,
        // Add Node protocol modules
        "node:fs": false,
        "node:fs/promises": false,
        "node:http": false,
        "node:https": false,
        "node:url": false,
        "node:util": false,
        "node:zlib": false,
        "node:path": false,
        "node:stream": false,
        "node:crypto": false,
      };
    }
    return config;
  },
};

export default nextConfig;