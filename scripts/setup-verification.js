#!/usr/bin/env node

/**
 * V3 Setup Verification Script
 * Checks if all required setup steps have been completed
 */

const { createClient } = require('@supabase/supabase-js')

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function checkEnvVar(name, required = true) {
  const value = process.env[name]
  if (!value && required) {
    log(`❌ ${name} is not set`, 'red')
    return false
  } else if (!value) {
    log(`⚠️  ${name} is not set (optional)`, 'yellow')
    return true
  } else {
    log(`✅ ${name} is set`, 'green')
    return true
  }
}

async function checkDatabase(supabase) {
  log('\n📊 Checking database tables...', 'blue')
  
  try {
    // Check weekly_themes table
    const { error: themesError } = await supabase
      .from('weekly_themes')
      .select('id')
      .limit(1)
    
    if (themesError) {
      log('❌ weekly_themes table does not exist. Run database-migrations.sql', 'red')
      return false
    }
    log('✅ weekly_themes table exists', 'green')
    
    // Check entries table has new columns
    const { error: entriesError } = await supabase
      .from('entries')
      .select('photo_url, photo_processed, week_theme_id')
      .limit(1)
    
    if (entriesError && entriesError.message.includes('column')) {
      log('❌ entries table missing new columns. Run database-migrations.sql', 'red')
      return false
    }
    log('✅ entries table has new columns', 'green')
    
    return true
  } catch (error) {
    log(`❌ Database check failed: ${error.message}`, 'red')
    return false
  }
}

async function checkStorage(supabase) {
  log('\n📦 Checking storage bucket...', 'blue')
  
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets()
    
    if (error) {
      log(`❌ Storage check failed: ${error.message}`, 'red')
      log('   Make sure SUPABASE_SERVICE_ROLE_KEY is set for admin operations', 'yellow')
      return false
    }
    
    const entryPhotosBucket = buckets?.find(b => b.name === 'entry-photos')
    
    if (!entryPhotosBucket) {
      log('❌ entry-photos bucket does not exist', 'red')
      log('   Create it in Supabase Dashboard → Storage', 'yellow')
      return false
    }
    
    log('✅ entry-photos bucket exists', 'green')
    return true
  } catch (error) {
    log(`⚠️  Storage check failed: ${error.message}`, 'yellow')
    log('   You may need to create the bucket manually in Supabase Dashboard', 'yellow')
    return false
  }
}

async function main() {
  log('🔍 V3 Setup Verification\n', 'blue')
  
  // Check environment variables
  log('🔐 Checking environment variables...', 'blue')
  const envVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'ANTHROPIC_API_KEY',
    'CRON_SECRET',
  ]
  
  const envOk = envVars.every(checkEnvVar)
  
  if (!envOk) {
    log('\n❌ Some required environment variables are missing', 'red')
    log('   Set them in .env.local or your deployment environment', 'yellow')
    process.exit(1)
  }
  
  // Check database
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    log('\n❌ Cannot check database without Supabase credentials', 'red')
    process.exit(1)
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  const dbOk = await checkDatabase(supabase)
  const storageOk = await checkStorage(supabase)
  
  // Summary
  log('\n📋 Setup Summary:', 'blue')
  log(`   Environment Variables: ${envOk ? '✅' : '❌'}`, envOk ? 'green' : 'red')
  log(`   Database Tables: ${dbOk ? '✅' : '❌'}`, dbOk ? 'green' : 'red')
  log(`   Storage Bucket: ${storageOk ? '✅' : '❌'}`, storageOk ? 'green' : 'red')
  
  if (envOk && dbOk && storageOk) {
    log('\n🎉 All setup steps completed! V3 features are ready to use.', 'green')
    process.exit(0)
  } else {
    log('\n⚠️  Some setup steps are incomplete. See V3_IMPLEMENTATION.md for details.', 'yellow')
    process.exit(1)
  }
}

main().catch((error) => {
  log(`\n❌ Verification failed: ${error.message}`, 'red')
  process.exit(1)
})

