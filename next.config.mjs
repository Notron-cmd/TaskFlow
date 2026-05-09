/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    unoptimized: false,
  },
  // Server actions
  serverActions: {
    bodySizeLimit: '5mb',
  },
  // Compression
  compress: true,
  // Generate ETags for caching
  generateEtags: true,
  // PoweredBy header for security
  poweredByHeader: false,
  // Production source maps optimization
  productionBrowserSourceMaps: false,
  // Optimize packages
  optimizeFonts: true,
};

export default nextConfig;
