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

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!mounted) return
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchProfile(session.user.id).catch(() => setLoading(false))
            } else {
                setLoading(false)
            }
        }).catch(err => {
            console.error('Auth check failed:', err)
            if (mounted) setLoading(false)
        }).finally(() => {
            clearTimeout(timeout)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!mounted) return
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchProfile(session.user.id).catch(() => setLoading(false))
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

    async function fetchProfile(userId) {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()
        setProfile(data)
        setLoading(false)
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
