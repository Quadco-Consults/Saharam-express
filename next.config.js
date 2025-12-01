/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  env: {
    // Make sure environment variables are available during build
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  // Disable static generation for pages that require environment variables
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
}

module.exports = nextConfig