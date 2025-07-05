# Supabase Setup for Yup.RSVP

## 🚨 **URGENT: Environment Variables Required**

The app is currently using mock data because Supabase environment variables are missing.

## 1. Create Environment File

# Environment variables now live in ONE file: the repository-root `.env`.

> Copy `env.template` → `.env` in the repo root and populate the values below.
> Every workspace (Express server, Next.js, scripts) loads from that single file; you do **not** need any `.env.local` inside `apps/web/`.

## 2. Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Click "Settings" → "API"
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
