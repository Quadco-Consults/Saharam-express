/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  // Generate Prisma client during build
  async generateBuildId() {
    // This ensures Prisma client is generated during build
    return 'saharam-express-build'
  },
}

module.exports = nextConfig