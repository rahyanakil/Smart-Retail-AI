import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
