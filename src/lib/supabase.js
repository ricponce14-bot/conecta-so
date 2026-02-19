import { createClient } from '@supabase/supabase-js'

// FALLBACKS FOR DEPLOYMENT EMERGENCIES
const FALLBACK_URL = 'https://issafvpckjbeblakfhrb.supabase.co'
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlzc2FmdnBja2piZWJsYWtmaHJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NzU1NjYsImV4cCI6MjA4NzA1MTU2Nn0.YDw4r4o8rMXD4L60xQktAqRld4fdnnKjgV5pvnpNvEA'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_KEY

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
