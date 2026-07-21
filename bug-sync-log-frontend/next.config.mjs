/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
    allowedDevOrigins: ['192.168.8.123:3000'],
}

export default nextConfig
