# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

"Understood." is a personal journal/newsroom app built with Next.js 15 (App Router), TypeScript, Supabase (remote hosted), and Anthropic Claude API. See `README.md` for full tech stack and project structure.

### Running the dev server

```
npm run dev
```

Starts on `http://localhost:3000`. The middleware redirects unauthenticated users to `/login`.

### Linting

```
npm run lint
```

Uses `next lint` with ESLint 9 flat config (`eslint.config.mjs`). There are pre-existing lint errors in the codebase (mostly `react-hooks/set-state-in-effect` and `react/no-unescaped-entities`). These also cause `npm run build` to fail at the lint-during-build step, even though TypeScript compilation succeeds.

### Build

`npm run build` currently fails at the lint step due to pre-existing ESLint errors. TypeScript compilation succeeds ("Compiled successfully"). To verify compilation without lint blocking, run the dev server instead.

### Testing

No automated test framework is configured. There are no test files or test runner dependencies. Validation is done via manual testing with the dev server.

### Environment variables

Copy `.env.example` to `.env.local`. The Supabase URL and anon key in `.env.example` are the project's actual values. The following secrets must be provided separately:

- `SUPABASE_SERVICE_ROLE_KEY` — required for storage uploads, push notifications, cron jobs
- `ANTHROPIC_API_KEY` — required for AI content generation (core feature)
- `CRON_SECRET` — required for cron job authentication

Without these, the app still loads and auth works, but AI features and cron endpoints will fail.

### Key gotchas

- **No Docker, no local database.** The app connects to a remote Supabase instance. There is no local Supabase CLI setup or `docker-compose`.
- **ESLint was not previously configured.** The `eslint.config.mjs`, `eslint`, `eslint-config-next`, and `@eslint/compat` dev dependencies were added during environment setup to make `npm run lint` work non-interactively.
- **Database migrations are manual.** SQL files in the repo root (e.g., `database-migrations.sql`) must be run via the Supabase Dashboard SQL Editor. The `npm run setup` command is interactive and not suitable for CI.
- **The `.env.localsb_publishable_*` file** in the repo root is a stale/malformed file — it only contains a placeholder service role key and can be ignored.
