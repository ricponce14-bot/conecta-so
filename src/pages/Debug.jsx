import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Debug() {
    const [logs, setLogs] = useState([])
    const [envCheck, setEnvCheck] = useState({})
    const [session, setSession] = useState(null)

    const addLog = (msg, type = 'info') => {
        setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg, type }])
    }

    useEffect(() => {
        runDiagnostics()
    }, [])

    async function runDiagnostics() {
        addLog('Iniciando diagnóstico...', 'info')

        // 1. Env Vars
        const url = import.meta.env.VITE_SUPABASE_URL
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY
        setEnvCheck({
            url: url ? '✅ Configurado' : '❌ Faltante',
            key: key ? '✅ Configurado' : '❌ Faltante'
        })
        addLog(`Env URL: ${url ? 'OK' : 'MISSING'}`, url ? 'success' : 'error')

        if (!url || !key) return

        // 2. Ping Supabase
        try {
            const start = performance.now()
            const { data, error } = await supabase.from('costs').select('count', { count: 'exact', head: true })
            const time = Math.round(performance.now() - start)

            if (error) throw error
            addLog(`Ping Supabase: OK (${time}ms)`, 'success')
        } catch (err) {
            addLog(`Ping Supabase Falló: ${err.message}`, 'error')
        }

        // 3. Auth Session
        try {
            const { data: { session }, error } = await supabase.auth.getSession()
            if (error) throw error

            setSession(session)
            if (session) {
                addLog(`Sesión activa: ${session.user.email}`, 'success')

                // 4. Test Profile Access
                await checkProfile(session.user.id)
            } else {
                addLog('No hay sesión activa (Usuario no logueado)', 'warning')
            }
        } catch (err) {
            addLog(`Error verificando sesión: ${err.message}`, 'error')
        }
    }

    async function checkProfile(userId) {
        addLog(`Verificando perfil para ID: ${userId}...`, 'info')
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (error) {
                addLog(`Error leyendo perfil: ${error.message} (Code: ${error.code})`, 'error')
                if (error.code === '42501') addLog('⚠️ Error de Permisos (RLS) - Probablemente falta la política SELECT', 'error')
                if (error.code === 'PGRST116') addLog('⚠️ Perfil no encontrado (Row missing)', 'warning')
            } else {
                addLog(`Perfil encontrado: ${data.name} (${data.role})`, 'success')
            }
        } catch (err) {
            addLog(`Excepción al leer perfil: ${err.message}`, 'error')
        }
    }

    async function manualProfileCreate() {
        if (!session) return alert('No hay sesión activa')

        try {
            addLog('Intentando crear perfil manualmente...', 'info')
            const { data, error } = await supabase
                .from('profiles')
                .insert([{
                    id: session.user.id,
                    name: 'Admin Debug',
                    email: session.user.email,
                    role: 'ADMIN'
                }])
                .select()
                .single()

            if (error) {
                addLog(`Error creando perfil: ${error.message}`, 'error')
                if (error.code === '42501') addLog('⚠️ BLOQUEADO POR RLS (Falta política INSERT)', 'error')
            } else {
                addLog('✅ Perfil creado exitosamente!', 'success')
            }
        } catch (err) {
            addLog(`Excepción creando perfil: ${err.message}`, 'error')
        }
    }

    return (
        <div style={{ padding: '20px', background: '#111', color: '#fff', minHeight: '100vh', fontFamily: 'monospace' }}>
            <h1>🛠️ Diagnóstico de Conexión</h1>

            <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #333' }}>
                <h3>Variables de Entorno</h3>
                <pre>{JSON.stringify(envCheck, null, 2)}</pre>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <button onClick={runDiagnostics} style={{ padding: '8px 16px', marginRight: '10px', cursor: 'pointer' }}>Re-ejecutar Diagnóstico</button>
                {session && (
                    <button onClick={manualProfileCreate} style={{ padding: '8px 16px', background: '#d00', color: 'white', border: 'none', cursor: 'pointer' }}>
                        Forzar Creación de Perfil
                    </button>
                )}
                <button onClick={() => window.location.href = '/'} style={{ padding: '8px 16px', marginLeft: '10px', cursor: 'pointer' }}>
                    Ir al Inicio
                </button>
            </div>

            <div style={{ background: '#000', padding: '10px', borderRadius: '4px' }}>
                {logs.map((L, i) => (
                    <div key={i} style={{
                        color: L.type === 'error' ? '#ff6b6b' : L.type === 'success' ? '#51cf66' : L.type === 'warning' ? '#fcc419' : '#fff',
                        marginBottom: '4px'
                    }}>
                        [{L.time}] {L.msg}
                    </div>
                ))}
            </div>
        </div>
    )
}
