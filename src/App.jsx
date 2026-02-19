import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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
import './index.css'

function AppRoutes() {
    const { user, loading } = useAuth()

    if (loading) return <div className="loading-spinner">Cargando sistema...</div>

    return (
        <Routes>
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
