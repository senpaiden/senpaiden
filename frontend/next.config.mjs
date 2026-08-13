/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allow all image hosts for now, to support dynamic cover art from any provider
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/manga-images/**',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787',
    NEXT_PUBLIC_R2_URL: process.env.NEXT_PUBLIC_R2_URL || 'https://lsdnqbfiytyonvmzurxj.supabase.co/storage/v1/object/public/manga-images',
  }
};

export default nextConfig;
