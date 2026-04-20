# Understood.

Understood is a personal reflection and presence app. It lets you capture stories, notes, and actions, then uses AI to surface connections, alternate rewrites, and patterns across your life.

## What The App Does

- Capture entries as stories, notes, or actions
- Organize entries by life area and timeline
- Generate four AI rewrite voices for story entries
- Surface connections, themes, and search results across past entries
- Export entries as shareable documents and images
- Support push notifications and installable app behavior

## Stack

- **Frontend**: Next.js App Router with TypeScript
- **Backend**: Route handlers and server actions
- **Database & Auth**: Supabase
- **AI**: Anthropic API
- **Deployment**: Vercel
- **Styling**: Tailwind CSS plus custom editorial styles

## Main Entry Points

- `app/page.tsx` - authenticated home page
- `components/journal-page-client.tsx` - main app shell and state flow
- `app/layout.tsx` - global metadata, fonts, and app chrome

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Supabase project
- Anthropic API key

### Local Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env.local` and add the required environment variables
4. Run setup helpers if needed:
   ```bash
   npm run setup:verify
   npm run setup:migrations
   npm run setup:storage
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```
6. Open [http://localhost:3000](http://localhost:3000)

### Core Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key
CRON_SECRET=your_cron_secret
```

For the fuller environment setup and deployment details, see `ENV_CONFIGURATION.md` and `VERCEL_DEPLOYMENT.md`.

## Project Structure

```text
app/                    Next.js routes, API handlers, layouts
components/             UI, editorial layouts, capture flows
lib/                    Supabase, AI, PDF, utility helpers
public/                 PWA assets, icons, service worker
scripts/                setup and migration helpers
types/                  shared TypeScript types
```

## Scripts

- `npm run dev` - start the local dev server
- `npm run build` - build for production
- `npm run start` - run the production build
- `npm run lint` - run lint checks
- `npm run setup` - run the full setup helper
- `npm run setup:verify` - verify local setup
- `npm run setup:migrations` - run database migrations
- `npm run setup:storage` - create storage bucket helpers

## Deployment

Understood is configured for Vercel deployment. Add the required environment variables in Vercel project settings, then deploy the repo. Scheduled routes are configured through `vercel.json`.

## License

MIT
