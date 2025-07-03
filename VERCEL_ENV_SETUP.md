# Vercel Environment Variables Setup

## Required Environment Variables

When deploying to Vercel, you need to set these environment variables in your Vercel project dashboard:

### Supabase Configuration
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_PROJECT_ID=your_project_id
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
```

### Tempo Configuration (for development)
```
VITE_TEMPO=false
```

## How to Set Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable with the appropriate value
5. Make sure to set them for all environments (Production, Preview, Development)

## Important Notes

- `VITE_` prefixed variables are exposed to the client-side code
- Non-prefixed variables are server-side only
- Your Supabase keys can be found in your Supabase project dashboard under Settings → API
- Set `VITE_TEMPO=false` for production to disable development tools

## Verification

After deployment, check that:
- Images can be uploaded successfully
- Real-time updates work
- Admin dashboard functions properly
- All API calls to Supabase work
