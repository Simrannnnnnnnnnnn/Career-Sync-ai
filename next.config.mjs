/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: '/job-tracker', destination: '/jobs', permanent: true },
      { source: '/cover-letter', destination: '/cover', permanent: true },
      { source: '/growth-hub', destination: '/growth', permanent: true },
    ]
  },
}

export default nextConfig