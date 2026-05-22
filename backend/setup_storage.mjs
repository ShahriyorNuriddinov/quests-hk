import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
)

const { data, error } = await supabase.storage.createBucket('uploads', {
  public: true,
  fileSizeLimit: 10485760,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
})

if (error && error.message !== 'The resource already exists') {
  console.error('❌ Bucket error:', error.message)
} else {
  console.log('✅ Storage bucket "uploads" ready!')
}
