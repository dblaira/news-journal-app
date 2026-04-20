# 🚀 Run Setup Now - Quick Instructions

Follow these steps to complete V3 setup:

## Option 1: Interactive Setup Script (Recommended)

Run the interactive setup script that will guide you through everything:

```bash
npm run setup
```

This will:
1. Check/create .env.local
2. Guide you through database migrations
3. Create storage bucket (if you have service role key)
4. Verify everything is set up

## Option 2: Manual Setup

### Step 1: Database Migrations (2 minutes)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Click **SQL Editor** in the left sidebar

2. **Run Migrations**
   - Click **New Query**
   - Open `database-migrations.sql` in this project
   - Copy **ALL** the SQL (lines 1-62)
   - Paste into the SQL Editor
   - Click **Run** (or press Cmd/Ctrl + Enter)

3. **Verify**
   - You should see "Success. No rows returned"
   - Check that `weekly_themes` table appears in Table Editor

### Step 2: Storage Bucket (2 minutes)

**Option A: Via Dashboard (Easiest)**
1. In Supabase Dashboard, click **Storage** in left sidebar
2. Click **New bucket**
3. Fill in:
   - **Name**: `entry-photos`
   - **Public bucket**: ✅ Check this box
   - **File size limit**: `10485760` (10MB)
   - **Allowed MIME types**: Add these one by one:
     - `image/jpeg`
     - `image/png`
     - `image/webp`
4. Click **Create bucket**

**Option B: Via Script**
```bash
# First, add to .env.local:
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Then run:
npm run setup:storage
```

### Step 3: Verify Setup (30 seconds)

```bash
npm run setup:verify
```

You should see all green checkmarks ✅

## ✅ Success Checklist

After completing all steps, you should see:
- ✅ All environment variables are set
- ✅ weekly_themes table exists
- ✅ entries table has new columns
- ✅ entry-photos bucket exists

## 🎯 Test It Out

Once setup is complete:

1. **Start dev server**: `npm run dev`
2. **Create 7+ entries** to test weekly theme generation
3. **Upload a photo** with a new entry
4. **Export a PDF** from an entry modal

## 🆘 Need Help?

- Run `npm run setup` for interactive guidance
- Check `V3_SETUP_GUIDE.md` for detailed instructions
- Check Supabase Dashboard → Logs for any errors

