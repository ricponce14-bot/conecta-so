import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Icons } from './Icons'
import logo from '../assets/logo1.png'

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
            {/* Mobile Header (Compact) */}
            <header className="mobile-header">
                <img src={logo} alt="Conecta" className="mobile-logo" />
                <div className="user-profile-small">
                    <div className="avatar small">{initials}</div>
                </div>
            </header>

            {/* Mobile Top Navigation (Scrollable) */}
            <nav className="mobile-top-nav">
                <NavLink to="/" end className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                    <Icons.LayoutDashboard size={20} />
                    <span>Dash</span>
                </NavLink>
                <NavLink to="/expo" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                    <Icons.Briefcase size={20} />
                    <span>Expo</span>
                </NavLink>
                <NavLink to="/sponsors" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                    <Icons.Handshake size={20} />
                    <span>Sponsors</span>
                </NavLink>
                {isAdmin && (
                    <>
                        <NavLink to="/tickets" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                            <Icons.Ticket size={20} />
                            <span>Boletos</span>
                        </NavLink>
                        <NavLink to="/costs" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                            <Icons.DollarSign size={20} />
                            <span>Costos</span>
                        </NavLink>
                    </>
                )}
                <NavLink to="/kpis" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                    <Icons.BarChart size={20} />
                    <span>KPIs</span>
                </NavLink>
                {isAdmin && (
                    <NavLink to="/equipo" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                        <Icons.Users size={20} />
                        <span>Equipo</span>
                    </NavLink>
                )}
            </nav>

            {/* Desktop Sidebar (Hidden on Mobile) */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <img src={logo} alt="Conecta 2026" className="brand-logo" />
                </div>

                <nav className="sidebar-nav">
                    <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Icons.LayoutDashboard className="nav-icon" />
                        <span>Dashboard</span>
                    </NavLink>
                    <NavLink to="/expo" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Icons.Briefcase className="nav-icon" />
                        <span>Expo</span>
                    </NavLink>
                    <NavLink to="/sponsors" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Icons.Handshake className="nav-icon" />
                        <span>Patrocinios</span>
                    </NavLink>
                    {isAdmin && (
                        <>
                            <NavLink to="/tickets" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <Icons.Ticket className="nav-icon" />
                                <span>Boletos</span>
                            </NavLink>
                            <NavLink to="/costs" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <Icons.DollarSign className="nav-icon" />
                                <span>Costos</span>
                            </NavLink>
                        </>
                    )}
                    <NavLink to="/kpis" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Icons.BarChart className="nav-icon" />
                        <span>KPIs</span>
                    </NavLink>
                    {isAdmin && (
                        <NavLink to="/equipo" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <Icons.Users className="nav-icon" />
                            <span>Equipo</span>
                        </NavLink>
                    )}
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
