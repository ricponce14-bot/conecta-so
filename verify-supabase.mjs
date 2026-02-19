import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://issafvpckjbeblakfhrb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlzc2FmdnBja2piZWJsYWtmaHJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NzU1NjYsImV4cCI6MjA4NzA1MTU2Nn0.YDw4r4o8rMXD4L60xQktAqRld4fdnnKjgV5pvnpNvEA'

console.log('🔌 Connecting to Supabase...')
console.log('URL:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function verify() {
    try {
        // Test 1: Basic connectivity
        const { data, error } = await supabase.from('_test_ping').select('*').limit(1)

        if (error && (error.code === '42P01' || error.message.includes('does not exist'))) {
            console.log('✅ Connection successful! (Server responded, table not found as expected)')
        } else if (error && error.message.includes('fetch')) {
            console.error('❌ Connection FAILED (Network/URL error):', error.message)
            process.exit(1)
        } else if (error) {
            // Any response from the server means we are connected
            console.log('✅ Connection successful! (Server responded with:', error.code, '-', error.message, ')')
        } else {
            console.log('✅ Connection successful! Data:', data)
        }

        console.log('\n🎉 Supabase project "conecta-so" is connected and ready!')
    } catch (err) {
        console.error('❌ Unexpected error:', err.message)
        process.exit(1)
    }
}

verify()
