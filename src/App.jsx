import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ExpoLeads from './pages/ExpoLeads'
import ExpoLeadForm from './pages/ExpoLeadForm'
import SponsorLeads from './pages/SponsorLeads'
import SponsorLeadForm from './pages/SponsorLeadForm'
import Tickets from './pages/Tickets'
import Costs from './pages/Costs'
import SalesKPIs from './pages/SalesKPIs'
import Equipo from './pages/Equipo'
import Debug from './pages/Debug'
import './index.css'

function AppRoutes() {
    const { user, loading } = useAuth()
    const [showLongLoading, setShowLongLoading] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => setShowLongLoading(true), 3000)
        return () => clearTimeout(timer)
    }, [])

    if (loading) {
        return (
            <div className="loading-spinner" style={{ flexDirection: 'column', gap: '15px' }}>
                <div className="spinner-ring"></div>
                <div>Cargando sistema...</div>
                {showLongLoading && (
                    <div style={{ fontSize: '0.8rem', color: '#ffc107', maxWidth: '300px', textAlign: 'center' }}>
                        Tarda más de lo esperado. Verifica tu conexión o recarga la página.
                        <br /><br />
                        <a href="/debug" style={{ color: '#ffc107', textDecoration: 'underline' }}>Ir a Diagnóstico</a>
                    </div>
                )}
            </div>
        )
    }

    return (
        <Routes>
            <Route path="/debug" element={<Debug />} />
            <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/expo" element={<ExpoLeads />} />
                <Route path="/expo/new" element={<ExpoLeadForm />} />
                <Route path="/expo/:id" element={<ExpoLeadForm />} />
                <Route path="/sponsors" element={<SponsorLeads />} />
                <Route path="/sponsors/new" element={<SponsorLeadForm />} />
                <Route path="/sponsors/:id" element={<SponsorLeadForm />} />
                <Route path="/tickets" element={<ProtectedRoute adminOnly><Tickets /></ProtectedRoute>} />
                <Route path="/costs" element={<ProtectedRoute adminOnly><Costs /></ProtectedRoute>} />
                <Route path="/kpis" element={<SalesKPIs />} />
                <Route path="/equipo" element={<ProtectedRoute adminOnly><Equipo /></ProtectedRoute>} />
            </Route>
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    )
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    )
}
