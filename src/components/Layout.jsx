import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Icons } from './Icons'
import logo from '../assets/logo1.png'

export default function Layout() {
    // ... existing code ...
    return (
        <div className="app-layout">
            {/* Mobile Header */}
            <header className="mobile-header">
                <img src={logo} alt="Conecta" className="mobile-logo" />
                <button className="menu-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
// ...
                    {/* Sidebar */}
                    <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                        <div className="sidebar-header">
                            <img src={logo} alt="Conecta 2026" className="brand-logo" />
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
