import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabaseInstance = null

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Supabase credentials missing. Check .env.local')
  // Prevent crash, but app won't work. We'll show an error in UI later.
  supabaseInstance = {
    auth: {
      getSession: () => Promise.reject('Supabase not initialized'),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
      signInWithPassword: () => Promise.reject('Supabase not initialized'),
      signOut: () => Promise.resolve(),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.reject('Supabase not initialized'),
        }),
      }),
    }),
  }
} else {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
  } catch (err) {
    console.error('Supabase init error:', err)
  }
}

export const supabase = supabaseInstance
