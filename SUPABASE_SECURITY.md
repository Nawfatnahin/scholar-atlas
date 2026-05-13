# Supabase Security & RLS Guide

To ensure your database is secure for production, please run the following SQL commands in your Supabase SQL Editor.

## 1. Enable Row Level Security (RLS)

First, enable RLS on all your tables:

```sql
ALTER TABLE usage_stats ENABLE ROW LEVEL SECURITY;
-- Add other tables here if you have them, e.g.:
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

## 2. Usage Stats Policies

Allow users to only see and insert their own usage stats.

```sql
-- Allow users to view their own stats
CREATE POLICY "Users can view own stats" ON usage_stats
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert their own stats
CREATE POLICY "Users can insert own stats" ON usage_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## 3. Storage Security (PDF Uploads)

Go to **Storage** -> **Policies** in your Supabase dashboard and set these for the `pdf_uploads` bucket:

### Select Policy:
- **Policy Name:** "Users can view own uploads"
- **Allowed Operations:** `SELECT`
- **Target Roles:** `authenticated`
- **Definition:** `(role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text)`

### Insert Policy:
- **Policy Name:** "Users can upload to own folder"
- **Allowed Operations:** `INSERT`
- **Target Roles:** `authenticated`
- **Definition:** `(role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text)`

### Delete Policy:
- **Policy Name:** "Users can delete own uploads"
- **Allowed Operations:** `DELETE`
- **Target Roles:** `authenticated`
- **Definition:** `(role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text)`

## 4. Database Hardening

Restrict access to the `public` schema for the `anon` role (unauthenticated users) unless strictly necessary.

```sql
-- Revoke all on public schema from anon
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

-- Explicitly allow what's needed (if anything)
-- GRANT SELECT ON TABLE public.some_public_info TO anon;
```

## 5. Security Checklist

- [ ] JWT Secret is strong and unique.
- [ ] Site URL is set correctly in Supabase Auth settings.
- [ ] Email confirmations are enabled for production.
- [ ] Turnstile Secret Key is NOT exposed in the frontend.
