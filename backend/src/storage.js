import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
)

const BUCKET = 'uploads'

export async function uploadFile(buffer, mimetype, folder = 'images') {
  const ext = mimetype.split('/')[1] || 'jpg'
  const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(filename, buffer, {
    contentType: mimetype,
    upsert: false,
  })
  if (error) throw error
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename)
  return data.publicUrl
}
