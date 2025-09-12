/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // permite qualquer domínio HTTPS
      },
      {
        protocol: 'http',
        hostname: '**', // opcional, permite também HTTP (menos seguro)
      },
    ],
  },
};

export default nextConfig;
