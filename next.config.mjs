/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Allow build with ESLint warnings (img tags, etc.)
    ignoreDuringBuilds: true,
  },
  images: {
    // Allow external images from Supabase Storage
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
};

export default nextConfig;
