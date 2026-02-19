import { createClient } from '@supabase/supabase-js'

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
