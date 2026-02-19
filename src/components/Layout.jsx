import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Icons } from './Icons'

export default function Layout() {
    const { profile, signOut, isAdmin } = useAuth()
    const navigate = useNavigate()
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    const handleLogout = async () => {
        await signOut()
        navigate('/login')
    }

    // Force branding for Admin
    const displayName = (profile?.email === 'admin@conecta.com')
        ? 'Ricardo Ponce'
        : (profile?.name || 'Usuario')

    const initials = displayName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()

    const closeSidebar = () => setIsSidebarOpen(false)

    return (
        <div className="app-layout">
            {/* Mobile Header */}
            <header className="mobile-header">
                <img src="/logo.png" alt="Conecta" className="mobile-logo" />
                <button className="menu-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                    {isSidebarOpen ? <Icons.X /> : <Icons.Menu />}
                </button>
            </header>

            {/* Mobile Overlay */}
            <div
                className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
                onClick={closeSidebar}
            />

            {/* Sidebar */}
            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <img src="/logo.png" alt="Conecta 2026" className="brand-logo" />
                </div>

                <nav className="sidebar-nav">
                    <NavLink
                        to="/"
                        end
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        onClick={closeSidebar}
                    >
                        <Icons.LayoutDashboard className="nav-icon" />
                        <span>Dashboard</span>
                    </NavLink>

                    <NavLink
                        to="/expo"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        onClick={closeSidebar}
                    >
                        <Icons.Briefcase className="nav-icon" />
                        <span>Expo</span>
                    </NavLink>

                    <NavLink
                        to="/sponsors"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        onClick={closeSidebar}
                    >
                        <Icons.Handshake className="nav-icon" />
                        <span>Patrocinios</span>
                    </NavLink>

                    {isAdmin && (
                        <>
                            <NavLink
                                to="/tickets"
                                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                                onClick={closeSidebar}
                            >
                                <Icons.Ticket className="nav-icon" />
                                <span>Boletos</span>
                            </NavLink>

                            <NavLink
                                to="/costs"
                                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                                onClick={closeSidebar}
                            >
                                <Icons.DollarSign className="nav-icon" />
                                <span>Costos</span>
                            </NavLink>
                        </>
                    )}

                    <NavLink
                        to="/kpis"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        onClick={closeSidebar}
                    >
                        <Icons.BarChart className="nav-icon" />
                        <span>KPIs</span>
                    </NavLink>
                </nav>

                <div className="sidebar-footer">
                    <div className="user-profile">
                        <div className="avatar">{initials}</div>
                        <div className="user-info">
                            <div className="user-name">{displayName}</div>
                            <div className="user-role">{isAdmin ? 'Director' : 'Vendedor'}</div>
                        </div>
                        <button className="logout-btn" onClick={handleLogout} title="Cerrar sesión">
                            <Icons.LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    )
}
