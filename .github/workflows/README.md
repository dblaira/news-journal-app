# GitHub Actions Workflows

## Code Quality Checks (`code-quality.yml`)

Automated code quality checks that run on every push and pull request.

### What it checks:

1. **TypeScript Type Check** (`type-check` job)
   - Runs `tsc --noEmit` to catch type errors without building
   - Ensures all TypeScript code is type-safe

2. **ESLint & Next.js Lint** (`lint` job)
   - Runs `npm run lint` (Next.js ESLint)
   - Catches code style issues and common errors

3. **Build Verification** (`build` job)
   - Runs `npm run build` to ensure the app compiles
   - Catches build-time errors and configuration issues

### When it runs:

- On every push to `main` or `develop` branches
- On every pull request targeting `main` or `develop`

### Viewing results:

- Check the "Actions" tab in your GitHub repository
- Failed checks will show up as red X marks on commits/PRs
- Click through to see detailed error messages

### Required secrets (for build job):

If your build requires environment variables, add them as GitHub Secrets:
- `NEXT_PUBLIC_SUPABASE_URL` (if needed)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (if needed)

To add secrets: Repository Settings → Secrets and variables → Actions → New repository secret

### Next steps:

1. ✅ This workflow is now active
2. Consider adding CodeRabbit for AI-powered PR reviews
3. Add pre-commit hooks for faster local feedback
4. Set up test framework (Vitest/Jest) for unit tests
