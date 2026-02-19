import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Layout() {
    const { profile, signOut, isAdmin } = useAuth()
    const navigate = useNavigate()

    const handleLogout = async () => {
        await signOut()
        navigate('/login')
    }

    const initials = profile?.name
        ? profile.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
        : '—'

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <h1>Conecta 2026</h1>
                    <div className="subtitle">Transforma tu mente</div>
                </div>

                <nav className="sidebar-nav">
                    <NavLink to="/" end>
                        <span className="nav-icon">—</span> Dashboard
                    </NavLink>
                    <NavLink to="/expo">
                        <span className="nav-icon">—</span> Expo
                    </NavLink>
                    <NavLink to="/sponsors">
                        <span className="nav-icon">—</span> Patrocinios
                    </NavLink>
                    {isAdmin && (
                        <NavLink to="/tickets">
                            <span className="nav-icon">—</span> Boletos
                        </NavLink>
                    )}
                    {isAdmin && (
                        <NavLink to="/costs">
                            <span className="nav-icon">—</span> Costos
                        </NavLink>
                    )}
                    <NavLink to="/kpis">
                        <span className="nav-icon">—</span> KPIs
                    </NavLink>
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="user-avatar">{initials}</div>
                        <div className="user-info">
                            <div className="user-name">{profile?.name || 'Usuario'}</div>
                            <div className="user-role">{profile?.role || ''}</div>
                        </div>
                        <button className="btn-logout" onClick={handleLogout} title="Cerrar sesión">
                            Salir
                        </button>
                    </div>
                </div>
            </aside>

            <main className="main-content">
                <Outlet />
            </main>
        </div>
    )
}
