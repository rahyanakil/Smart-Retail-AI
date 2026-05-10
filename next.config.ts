import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Silence the multi-lockfile workspace root warning
  outputFileTracingRoot: path.join(__dirname, '../'),
  images: {
    remotePatterns: [
      // Neon-hosted assets
      { protocol: 'https', hostname: '**.neon.tech' },
      // Common image CDNs used for product photos
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**.cloudinary.com' },
      { protocol: 'https', hostname: '**.supabase.co' },
      // Localhost only in development (env-gated to avoid Vercel warnings)
      ...(process.env.NODE_ENV === 'development'
        ? [{ protocol: 'http' as const, hostname: 'localhost' }]
        : []),
    ],
  },
};

export default nextConfig;
