#!/usr/bin/env node

/**
 * Helper script to create the entry-photos storage bucket
 * Note: This requires SUPABASE_SERVICE_ROLE_KEY to be set
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

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

async function main() {
  log('📦 Creating entry-photos storage bucket...\n', 'blue')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl) {
    log('❌ NEXT_PUBLIC_SUPABASE_URL is not set', 'red')
    process.exit(1)
  }
  
  if (!serviceRoleKey) {
    log('❌ SUPABASE_SERVICE_ROLE_KEY is not set', 'red')
    log('   This script requires the service role key for admin operations', 'yellow')
    log('   You can create the bucket manually in Supabase Dashboard → Storage', 'yellow')
    process.exit(1)
  }
  
  const supabase = createClient(supabaseUrl, serviceRoleKey)
  
  try {
    // Check if bucket already exists
    const { data: buckets } = await supabase.storage.listBuckets()
    const existingBucket = buckets?.find(b => b.name === 'entry-photos')
    
    if (existingBucket) {
      log('✅ entry-photos bucket already exists', 'green')
      process.exit(0)
    }
    
    // Create bucket
    const { data, error } = await supabase.storage.createBucket('entry-photos', {
      public: true, // Set to false if you want to use RLS policies instead
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    })
    
    if (error) {
      log(`❌ Failed to create bucket: ${error.message}`, 'red')
      process.exit(1)
    }
    
    log('✅ Successfully created entry-photos bucket', 'green')
    log('\n📝 Next steps:', 'blue')
    log('   1. Configure bucket policies in Supabase Dashboard → Storage → Policies', 'yellow')
    log('   2. Set up RLS policies if bucket is not public', 'yellow')
    log('   3. Test photo upload in the app', 'yellow')
    
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red')
    process.exit(1)
  }
}

main()

