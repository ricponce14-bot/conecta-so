import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Icons } from '../components/Icons'
import logo from '../assets/logo1.png'

function NeuralBackground() {
    const canvasRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        let animId

        const nodes = []
        const NODE_COUNT = 40

        function resize() {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }
        resize()
        window.addEventListener('resize', resize)

        for (let i = 0; i < NODE_COUNT; i++) {
            nodes.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                r: Math.random() * 1.5 + 1,
            })
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            // Draw connections
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const dx = nodes[i].x - nodes[j].x
                    const dy = nodes[i].y - nodes[j].y
                    const dist = Math.sqrt(dx * dx + dy * dy)
                    if (dist < 200) {
                        const opacity = (1 - dist / 200) * 0.12
                        ctx.beginPath()
                        ctx.moveTo(nodes[i].x, nodes[i].y)
                        ctx.lineTo(nodes[j].x, nodes[j].y)
                        ctx.strokeStyle = `rgba(180, 200, 230, ${opacity})`
                        ctx.lineWidth = 0.6
                        ctx.stroke()
                    }
                }
            }

            // Draw nodes
            for (const node of nodes) {
                ctx.beginPath()
                ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2)
                ctx.fillStyle = 'rgba(180, 200, 230, 0.15)'
                ctx.fill()

                // Move
                node.x += node.vx
                node.y += node.vy

                // Bounds
                if (node.x < 0 || node.x > canvas.width) node.vx *= -1
                if (node.y < 0 || node.y > canvas.height) node.vy *= -1
            }

            animId = requestAnimationFrame(draw)
        }

        draw()

        return () => {
            cancelAnimationFrame(animId)
            window.removeEventListener('resize', resize)
        }
    }, [])

    return <canvas ref={canvasRef} className="login-canvas" />
}

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
            <NeuralBackground />

            {/* import logo from '../assets/logo1.png' */}

            {/* // ... (existing imports) */}

            {/* // ... inside component */}
            <div className="login-card">
                <div className="login-brand">
                    <img src={logo} alt="Conecta 2026" className="login-logo" />
                    <h1 className="login-title">Conecta 2026</h1>
                    <p className="login-tagline">Sistema de Gestión de Eventos</p>
                    <p style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '4px' }}>v2.1 LATEST</p>
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

                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <button
                        onClick={(e) => {
                            e.preventDefault()
                            const pwd = prompt('Ingrese clave de acceso al sistema:')
                            if (pwd === '130303') {
                                navigate('/debug')
                            } else if (pwd !== null) {
                                alert('Clave incorrecta')
                            }
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontFamily: 'inherit',
                            opacity: 0.7,
                            transition: 'opacity 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.opacity = '1'}
                        onMouseLeave={(e) => e.target.style.opacity = '0.7'}
                    >
                        <Icons.Settings width={14} height={14} /> Diagnóstico de Sistema
                    </button>
                </div>
            </div>
        </div>
    )
}
