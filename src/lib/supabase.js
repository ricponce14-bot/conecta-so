import { createClient } from '@supabase/supabase-js'

// Hardcoded credentials to bypass Vercel environment variable issues
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://issafvpckjbeblakfhrb.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlzc2FmdnBja2piZWJsYWtmaHJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NzU1NjYsImV4cCI6MjA4NzA1MTU2Nn0.YDw4r4o8rMXD4L60xQktAqRld4fdnnKjgV5pvnpNvEA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
