# News Journal App

Personal journal/newsroom application with AI enhancement, built with Next.js 14, TypeScript, Supabase, and Vercel.

## Tech Stack

- **Frontend**: Next.js 14 App Router with TypeScript
- **Backend**: Next.js API Routes
- **Database & Auth**: Supabase (PostgreSQL, Authentication)
- **AI**: Anthropic Claude API (Claude Sonnet 4)
- **Deployment**: Vercel (with Cron, Edge Functions)
- **Styling**: Tailwind CSS + Custom CSS

## Features

- Personal journal entries with categories (Business, Finance, Health, Spiritual, Fun, Social, Romance)
- AI-powered content generation (4 different styles: poetic, news feature, humorous, literary)
- Beautiful news-style card layouts
- Search and filter functionality
- Authentication with Supabase
- Scheduled nightly generation (Vercel Cron) - Coming in V3

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Anthropic Claude API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ANTHROPIC_API_KEY=your_anthropic_api_key
   CRON_SECRET=your_cron_secret
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Database Setup

Make sure your Supabase database has an `entries` table with the following structure:

```sql
CREATE TABLE entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  headline TEXT NOT NULL,
  category TEXT NOT NULL,
  subheading TEXT,
  content TEXT NOT NULL,
  mood TEXT,
  versions JSONB,
  generating_versions BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- Create policy for users to only see their own entries
CREATE POLICY "Users can view their own entries"
  ON entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own entries"
  ON entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own entries"
  ON entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own entries"
  ON entries FOR DELETE
  USING (auth.uid() = user_id);
```

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── actions/           # Server Actions
│   ├── login/             # Login page
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Main journal page
├── components/             # React components
├── lib/                    # Utility functions
│   ├── supabase/          # Supabase clients
│   └── utils.ts           # Helper functions
├── types/                  # TypeScript types
└── style.css              # Custom styles
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Deployment

This project is configured for deployment on Vercel:

1. Push your code to GitHub
2. Import your repository in Vercel
3. **Add environment variables in Vercel dashboard** (see below)
4. Deploy!

The `vercel.json` file configures cron jobs for scheduled tasks.

### Required Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `ANTHROPIC_API_KEY` - Your Anthropic Claude API key
- `CRON_SECRET` - Random secret for cron authentication (optional for now)

**Important**: After adding environment variables, you must redeploy for them to take effect.

See `VERCEL_DEPLOYMENT.md` for detailed deployment instructions and troubleshooting.

## Future Features (V3/V4)

- **V3**: Weekly theme generation, scheduled content drops, rich media (photos, PDF export)
- **V4**: Multi-tenant SaaS platform with Stripe subscriptions, admin dashboard, analytics

## License

MIT
