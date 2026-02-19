import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true

        // Safety timeout in case getSession hangs
        const timeout = setTimeout(() => {
            if (mounted) setLoading(false)
        }, 3000)

        // Initial session check
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!mounted) return
            setUser(session?.user ?? null)
            if (session?.user) {
                // Pass email for self-healing profile creation
                fetchProfile(session.user.id, session.user.email).catch(err => {
                    console.error('Initial profile fetch failed', err)
                    if (mounted) setLoading(false)
                })
            } else {
                setLoading(false)
            }
        }).catch(err => {
            console.error('Auth check failed:', err)
            if (mounted) setLoading(false)
        }).finally(() => {
            clearTimeout(timeout)
        })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!mounted) return
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchProfile(session.user.id, session.user.email).catch(() => setLoading(false))
            } else {
                setProfile(null)
                setLoading(false)
            }
        })

        return () => {
            mounted = false
            clearTimeout(timeout)
            subscription.unsubscribe()
        }
    }, [])

    async function fetchProfile(userId, email) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching profile:', error)
                return
            }

            if (data) {
                setProfile(data)
            } else {
                // Profile missing? Create it now (Self-healing)
                console.warn('Profile missing for user, creating default...')
                const { data: newProfile, error: createError } = await supabase
                    .from('profiles')
                    .insert([{
                        id: userId,
                        name: email?.split('@')[0] || 'Usuario',
                        email: email,
                        role: 'VENDEDOR' // Default role
                    }])
                    .select()
                    .single()

                if (createError) {
                    console.error('Failed to create missing profile:', createError)
                } else {
                    setProfile(newProfile)
                }
            }
        } catch (err) {
            console.error('Profile fetch exception:', err)
        } finally {
            setLoading(false)
        }
    }

    async function signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
    }

    async function signOut() {
        await supabase.auth.signOut()
        setUser(null)
        setProfile(null)
    }

    const isAdmin = profile?.role === 'ADMIN'

    return (
        <AuthContext.Provider value={{ user, profile, loading, signIn, signOut, isAdmin }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
