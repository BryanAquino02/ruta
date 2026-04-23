import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.warn('[MiRuta] Supabase no configurado — revisa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.local')
}

export const supabase = createClient(url || '', key || '')
