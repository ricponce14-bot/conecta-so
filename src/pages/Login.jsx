import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { signIn } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await signIn(email, password)
            navigate('/')
        } catch (err) {
            setError(err.message === 'Invalid login credentials'
                ? 'Credenciales incorrectas. Verifica tu correo y contrasena.'
                : err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-page">
            {/* Abstract neural pattern background */}
            <svg className="login-bg-pattern" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
                {/* Nodes */}
                <circle cx="120" cy="80" r="3" fill="#94a3b8" opacity="0.08" />
                <circle cx="300" cy="160" r="2.5" fill="#94a3b8" opacity="0.06" />
                <circle cx="480" cy="60" r="3" fill="#94a3b8" opacity="0.07" />
                <circle cx="660" cy="140" r="2" fill="#94a3b8" opacity="0.08" />
                <circle cx="840" cy="80" r="3" fill="#94a3b8" opacity="0.06" />
                <circle cx="1020" cy="120" r="2.5" fill="#94a3b8" opacity="0.07" />
                <circle cx="200" cy="300" r="2" fill="#94a3b8" opacity="0.07" />
                <circle cx="400" cy="260" r="3" fill="#94a3b8" opacity="0.06" />
                <circle cx="600" cy="320" r="2.5" fill="#94a3b8" opacity="0.08" />
                <circle cx="800" cy="280" r="2" fill="#94a3b8" opacity="0.07" />
                <circle cx="1000" cy="340" r="3" fill="#94a3b8" opacity="0.06" />
                <circle cx="150" cy="500" r="2.5" fill="#94a3b8" opacity="0.06" />
                <circle cx="350" cy="460" r="2" fill="#94a3b8" opacity="0.08" />
                <circle cx="550" cy="520" r="3" fill="#94a3b8" opacity="0.07" />
                <circle cx="750" cy="480" r="2.5" fill="#94a3b8" opacity="0.06" />
                <circle cx="950" cy="540" r="2" fill="#94a3b8" opacity="0.07" />
                <circle cx="1100" cy="460" r="3" fill="#94a3b8" opacity="0.06" />
                <circle cx="100" cy="680" r="2" fill="#94a3b8" opacity="0.07" />
                <circle cx="320" cy="640" r="3" fill="#94a3b8" opacity="0.06" />
                <circle cx="520" cy="700" r="2.5" fill="#94a3b8" opacity="0.08" />
                <circle cx="720" cy="660" r="2" fill="#94a3b8" opacity="0.07" />
                <circle cx="920" cy="720" r="3" fill="#94a3b8" opacity="0.06" />
                <circle cx="1080" cy="680" r="2.5" fill="#94a3b8" opacity="0.07" />

                {/* Connections */}
                <line x1="120" y1="80" x2="300" y2="160" stroke="#94a3b8" strokeWidth="0.6" opacity="0.05" />
                <line x1="300" y1="160" x2="480" y2="60" stroke="#94a3b8" strokeWidth="0.6" opacity="0.05" />
                <line x1="480" y1="60" x2="660" y2="140" stroke="#94a3b8" strokeWidth="0.6" opacity="0.05" />
                <line x1="660" y1="140" x2="840" y2="80" stroke="#94a3b8" strokeWidth="0.6" opacity="0.05" />
                <line x1="840" y1="80" x2="1020" y2="120" stroke="#94a3b8" strokeWidth="0.6" opacity="0.05" />
                <line x1="120" y1="80" x2="200" y2="300" stroke="#94a3b8" strokeWidth="0.6" opacity="0.05" />
                <line x1="300" y1="160" x2="400" y2="260" stroke="#94a3b8" strokeWidth="0.6" opacity="0.04" />
                <line x1="480" y1="60" x2="600" y2="320" stroke="#94a3b8" strokeWidth="0.6" opacity="0.05" />
                <line x1="660" y1="140" x2="800" y2="280" stroke="#94a3b8" strokeWidth="0.6" opacity="0.04" />
                <line x1="840" y1="80" x2="1000" y2="340" stroke="#94a3b8" strokeWidth="0.6" opacity="0.05" />
                <line x1="200" y1="300" x2="400" y2="260" stroke="#94a3b8" strokeWidth="0.6" opacity="0.05" />
                <line x1="400" y1="260" x2="600" y2="320" stroke="#94a3b8" strokeWidth="0.6" opacity="0.04" />
                <line x1="600" y1="320" x2="800" y2="280" stroke="#94a3b8" strokeWidth="0.6" opacity="0.05" />
                <line x1="800" y1="280" x2="1000" y2="340" stroke="#94a3b8" strokeWidth="0.6" opacity="0.04" />
                <line x1="200" y1="300" x2="150" y2="500" stroke="#94a3b8" strokeWidth="0.6" opacity="0.05" />
                <line x1="400" y1="260" x2="350" y2="460" stroke="#94a3b8" strokeWidth="0.6" opacity="0.04" />
                <line x1="600" y1="320" x2="550" y2="520" stroke="#94a3b8" strokeWidth="0.6" opacity="0.05" />
                <line x1="800" y1="280" x2="750" y2="480" stroke="#94a3b8" strokeWidth="0.6" opacity="0.04" />
                <line x1="1000" y1="340" x2="950" y2="540" stroke="#94a3b8" strokeWidth="0.6" opacity="0.05" />
                <line x1="150" y1="500" x2="350" y2="460" stroke="#94a3b8" strokeWidth="0.6" opacity="0.04" />
                <line x1="350" y1="460" x2="550" y2="520" stroke="#94a3b8" strokeWidth="0.6" opacity="0.05" />
                <line x1="550" y1="520" x2="750" y2="480" stroke="#94a3b8" strokeWidth="0.6" opacity="0.04" />
                <line x1="750" y1="480" x2="950" y2="540" stroke="#94a3b8" strokeWidth="0.6" opacity="0.05" />
                <line x1="950" y1="540" x2="1100" y2="460" stroke="#94a3b8" strokeWidth="0.6" opacity="0.04" />
                <line x1="150" y1="500" x2="100" y2="680" stroke="#94a3b8" strokeWidth="0.6" opacity="0.05" />
                <line x1="350" y1="460" x2="320" y2="640" stroke="#94a3b8" strokeWidth="0.6" opacity="0.04" />
                <line x1="550" y1="520" x2="520" y2="700" stroke="#94a3b8" strokeWidth="0.6" opacity="0.05" />
                <line x1="750" y1="480" x2="720" y2="660" stroke="#94a3b8" strokeWidth="0.6" opacity="0.04" />
                <line x1="950" y1="540" x2="920" y2="720" stroke="#94a3b8" strokeWidth="0.6" opacity="0.05" />
                <line x1="1100" y1="460" x2="1080" y2="680" stroke="#94a3b8" strokeWidth="0.6" opacity="0.04" />
                <line x1="100" y1="680" x2="320" y2="640" stroke="#94a3b8" strokeWidth="0.6" opacity="0.05" />
                <line x1="320" y1="640" x2="520" y2="700" stroke="#94a3b8" strokeWidth="0.6" opacity="0.04" />
                <line x1="520" y1="700" x2="720" y2="660" stroke="#94a3b8" strokeWidth="0.6" opacity="0.05" />
                <line x1="720" y1="660" x2="920" y2="720" stroke="#94a3b8" strokeWidth="0.6" opacity="0.04" />
                <line x1="920" y1="720" x2="1080" y2="680" stroke="#94a3b8" strokeWidth="0.6" opacity="0.05" />

                {/* Cross connections for depth */}
                <line x1="120" y1="80" x2="400" y2="260" stroke="#94a3b8" strokeWidth="0.4" opacity="0.03" />
                <line x1="480" y1="60" x2="350" y2="460" stroke="#94a3b8" strokeWidth="0.4" opacity="0.03" />
                <line x1="660" y1="140" x2="550" y2="520" stroke="#94a3b8" strokeWidth="0.4" opacity="0.03" />
                <line x1="1020" y1="120" x2="1100" y2="460" stroke="#94a3b8" strokeWidth="0.4" opacity="0.03" />
                <line x1="200" y1="300" x2="320" y2="640" stroke="#94a3b8" strokeWidth="0.4" opacity="0.03" />
                <line x1="800" y1="280" x2="920" y2="720" stroke="#94a3b8" strokeWidth="0.4" opacity="0.03" />
            </svg>

            <div className="login-card">
                <div className="login-brand">
                    <img src="/logo.png" alt="Conecta 2026" className="login-logo" />
                    <h1 className="login-title">Conecta 2026</h1>
                    <p className="login-tagline">Transforma tu mente</p>
                </div>

                {error && <div className="login-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="login-field">
                        <label>Correo electronico</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="correo@empresa.com"
                            required
                        />
                    </div>
                    <div className="login-field">
                        <label>Contrasena</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="login-submit" disabled={loading}>
                        {loading ? 'Ingresando...' : 'Iniciar sesion'}
                    </button>
                </form>
            </div>
        </div>
    )
}
