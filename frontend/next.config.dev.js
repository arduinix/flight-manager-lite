/** @type {import('next').NextConfig} */
const nextConfig = {
  // No static export for dev mode - allows hot-reload
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig

