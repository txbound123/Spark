/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // pdfjs-dist optionally requires canvas; alias to false to avoid bundling errors
    config.resolve.alias.canvas = false;
    return config;
  },
};

module.exports = nextConfig;
