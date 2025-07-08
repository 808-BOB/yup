const path = require('path');
// Load env from repo root (three levels up)
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    externalDir: true,
  },
  // Allow cross-origin requests for OAuth
  allowedDevOrigins: [
    'accounts.google.com',
    'googleapis.com',
    '*.supabase.co',
    '*.google.com'
  ],
  // Expose the supabase vars to the browser bundle
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PROJECT_URL: process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
};

module.exports = nextConfig;
