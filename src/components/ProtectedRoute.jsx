import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children, adminOnly = false }) {
    const { user, profile, loading, isAdmin } = useAuth()

    if (loading) return <div className="loading-spinner">Cargando...</div>
    if (!user) return <Navigate to="/login" />
    if (adminOnly && !isAdmin) return <Navigate to="/" />

    return children
}
