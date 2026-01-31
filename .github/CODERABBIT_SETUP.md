# CodeRabbit Setup Guide

This guide will walk you through setting up CodeRabbit for AI-powered PR reviews on your repository.

## What is CodeRabbit?

CodeRabbit is an AI-powered code review tool that:
- Automatically reviews every pull request
- Comments directly on code lines with suggestions
- Catches bugs, security issues, and code quality problems
- Provides explanations for its suggestions
- Learns your codebase patterns over time

## Step-by-Step Setup

### 1. Install CodeRabbit GitHub App

1. **Visit CodeRabbit**
   - Go to: https://coderabbit.ai/
   - Click "Get Started" or "Sign in with GitHub"

2. **Authorize CodeRabbit**
   - Sign in with your GitHub account
   - Grant CodeRabbit access to your repositories

3. **Select Repository Access**
   - Choose "Only select repositories"
   - Select `news-journal-app` (or your repository name)
   - Or choose "All repositories" if you want it everywhere

4. **Review Permissions**
   CodeRabbit needs these permissions:
   - ✅ **Read access** to code, pull requests, and issues
   - ✅ **Write access** to pull request comments
   - ✅ **Metadata access** (read-only)
   
   These are standard permissions for code review tools.

5. **Complete Installation**
   - Click "Install" or "Authorize"
   - You'll be redirected back to CodeRabbit dashboard

### 2. Verify Configuration File

The repository already includes a `.coderabbit.yaml` configuration file that:
- ✅ Focuses on TypeScript/React/Next.js best practices
- ✅ Checks for security issues (especially Supabase)
- ✅ Reviews performance and code quality
- ✅ Aligns with your project's coding standards

**No action needed** - the config file is already in place!

### 3. Test CodeRabbit

1. **Create a Test Pull Request**
   - Create a new branch: `git checkout -b test-coderabbit`
   - Make a small change (add a comment, fix formatting)
   - Commit and push: `git push origin test-coderabbit`
   - Open a PR on GitHub

2. **Wait for Review**
   - CodeRabbit will automatically review your PR
   - Usually takes 1-3 minutes
   - You'll see comments appear on the PR

3. **Review the Comments**
   - CodeRabbit comments directly on code lines
   - Each comment explains the issue and suggests fixes
   - You can reply to comments or ask questions

### 4. Customize Settings (Optional)

You can customize CodeRabbit behavior:

**Via GitHub:**
- Go to your repository → Settings → CodeRabbit
- Adjust review settings, notification preferences

**Via Configuration File:**
- Edit `.coderabbit.yaml` in your repository
- See configuration options at: https://docs.coderabbit.ai/guides/configuration-overview

## What CodeRabbit Will Check

Based on your configuration, CodeRabbit will focus on:

### TypeScript & Code Quality
- Type safety issues
- Proper use of interfaces vs types
- Common TypeScript pitfalls
- Code style alignment with your conventions

### Next.js Best Practices
- Server vs Client Component usage
- App Router patterns
- API route structure
- Proper data fetching patterns

### Security
- Exposed secrets or API keys
- Supabase RLS policy usage
- SQL injection risks
- Authentication patterns

### React Patterns
- Hooks usage and rules
- Component structure
- Performance optimizations
- Unnecessary re-renders

### Error Handling
- Proper error handling in API routes
- Async operation error handling
- User-friendly error messages

## Using CodeRabbit Comments

### Responding to Reviews
- **Approve suggestions**: Reply with "LGTM" or "Good catch"
- **Ask questions**: Reply to any comment to ask for clarification
- **Request changes**: CodeRabbit can update its suggestions based on your feedback

### Chat Feature
You can ask CodeRabbit questions in PR comments:
- `@coderabbit explain this code`
- `@coderabbit suggest improvements`
- `@coderabbit is this secure?`

## Pricing

CodeRabbit offers:
- **Free tier**: Limited reviews per month (usually sufficient for small projects)
- **Pro tier**: Unlimited reviews, faster responses, more features

Check current pricing at: https://coderabbit.ai/pricing

## Troubleshooting

### CodeRabbit isn't reviewing PRs
1. Check that the GitHub app is installed
2. Verify repository access in GitHub Settings → Applications → CodeRabbit
3. Ensure `.coderabbit.yaml` exists in your repository root
4. Check CodeRabbit dashboard for any error messages

### Too many comments / Too noisy
- Edit `.coderabbit.yaml` to adjust `ignore` settings
- Disable specific checks you don't need
- Use `review_only_changed_files: true` (already enabled)

### Want different review focus
- Edit `.coderabbit.yaml` to enable/disable specific checks
- Adjust language-specific settings
- Customize quality checks

## Next Steps

1. ✅ Install CodeRabbit GitHub App (follow steps above)
2. ✅ Configuration file is already in place
3. ✅ Create a test PR to verify it's working
4. ✅ Review CodeRabbit's suggestions and provide feedback
5. ✅ Adjust configuration as needed based on your preferences

## Resources

- **CodeRabbit Docs**: https://docs.coderabbit.ai/
- **Configuration Reference**: https://docs.coderabbit.ai/guides/configuration-overview
- **GitHub Integration**: https://docs.coderabbit.ai/platforms/github-com
- **Support**: Check CodeRabbit dashboard or GitHub discussions

---

**Note**: CodeRabbit reviews are suggestions, not requirements. Use your judgment to decide which suggestions to implement. The goal is to catch bugs and improve code quality, not to enforce strict rules.
