#!/usr/bin/env node

/**
 * Database Migrations Helper Script
 * Provides SQL and instructions for running migrations
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function checkSupabaseCLI() {
  try {
    execSync('which supabase', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

async function runMigrations() {
  log('📊 Database Migrations Setup\n', 'cyan')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl) {
    log('❌ NEXT_PUBLIC_SUPABASE_URL is not set', 'red')
    process.exit(1)
  }
  
  // Check if migrations already ran
  if (serviceRoleKey) {
    const supabase = createClient(supabaseUrl, serviceRoleKey)
    const { error: checkError } = await supabase
      .from('weekly_themes')
      .select('id')
      .limit(1)
    
    if (!checkError) {
      log('✅ weekly_themes table already exists!', 'green')
      log('   Migrations appear to have already run.', 'blue')
      
      // Verify entries table columns
      const { error: entriesError } = await supabase
        .from('entries')
        .select('photo_url, photo_processed, week_theme_id')
        .limit(1)
      
      if (!entriesError) {
        log('✅ entries table has new columns', 'green')
        log('\n🎉 All migrations are complete!', 'green')
        process.exit(0)
      }
    }
  }
  
  // Read SQL file
  const sqlPath = path.join(process.cwd(), 'COPY_PASTE_MIGRATIONS.sql')
  let sqlContent
  
  try {
    sqlContent = fs.readFileSync(sqlPath, 'utf8')
  } catch (error) {
    log(`❌ Failed to read SQL file: ${error.message}`, 'red')
    process.exit(1)
  }
  
  // Extract just the SQL (remove comment lines that start with --)
  const sqlStatements = sqlContent
    .split('\n')
    .filter(line => {
      const trimmed = line.trim()
      return trimmed && !trimmed.startsWith('--') && trimmed !== ''
    })
    .join('\n')
  
  // Check for Supabase CLI
  const hasCLI = await checkSupabaseCLI()
  
  if (hasCLI) {
    log('✅ Supabase CLI detected\n', 'green')
    log('Option 1: Use Supabase CLI', 'cyan')
    log('=' .repeat(50), 'cyan')
    log('\nRun this command:', 'blue')
    log(`supabase db push --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.${supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]}.supabase.co:5432/postgres"`, 'yellow')
    log('\nOr create a migration file and push:', 'blue')
    log('1. supabase migration new v3_migrations', 'yellow')
    log('2. Copy SQL into the migration file', 'yellow')
    log('3. supabase db push\n', 'yellow')
  }
  
  log('Option 2: Manual via Supabase Dashboard (Recommended)', 'cyan')
  log('=' .repeat(50), 'cyan')
  log('\n📋 Steps:', 'blue')
  log('1. Open: https://supabase.com/dashboard', 'yellow')
  log('2. Select your project', 'yellow')
  log('3. Click "SQL Editor" in left sidebar', 'yellow')
  log('4. Click "New Query"', 'yellow')
  log('5. Copy the SQL below and paste into editor', 'yellow')
  log('6. Click "Run" button (or Cmd/Ctrl + Enter)\n', 'yellow')
  
  log('📄 SQL to Copy:', 'cyan')
  log('=' .repeat(50), 'cyan')
  log('\n' + sqlStatements + '\n', 'reset')
  log('=' .repeat(50), 'cyan')
  
  log('\n💡 Tip: The SQL file is also available at:', 'blue')
  log('   COPY_PASTE_MIGRATIONS.sql\n', 'yellow')
  
  log('After running, verify with:', 'blue')
  log('   npm run setup:verify\n', 'yellow')
}

runMigrations().catch((error) => {
  log(`\n❌ Error: ${error.message}`, 'red')
  process.exit(1)
})
