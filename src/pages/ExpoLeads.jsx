import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { formatMoney, formatDate } from '../lib/utils'

const ESTADOS = ['LEAD', 'CONTACTADO', 'PROPUESTA', 'NEGOCIACION', 'CERRADO', 'PERDIDO']

export default function ExpoLeads() {
    const [leads, setLeads] = useState([])
    const [vendedores, setVendedores] = useState([])
    const [loading, setLoading] = useState(true)
    const [filtroEstado, setFiltroEstado] = useState('')
    const [filtroVendedor, setFiltroVendedor] = useState('')
    const { isAdmin, user } = useAuth()

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        const [leadsRes, vendedoresRes] = await Promise.all([
            supabase.from('expo_leads')
                .select('*, vendedor:profiles!vendedor_id(name)')
                .order('created_at', { ascending: false }),
            supabase.from('profiles').select('id, name').eq('role', 'VENDEDOR'),
        ])
        setLeads(leadsRes.data || [])
        setVendedores(vendedoresRes.data || [])
        setLoading(false)
    }

    async function handleDelete(id) {
        if (!confirm('¿Eliminar este lead?')) return
        await supabase.from('expo_leads').delete().eq('id', id)
        setLeads(leads.filter(l => l.id !== id))
    }

    const filtered = leads.filter(l => {
        if (filtroEstado && l.estado !== filtroEstado) return false
        if (filtroVendedor && l.vendedor_id !== filtroVendedor) return false
        return true
    })

    // Summary stats
    const totalLeads = leads.length
    const cerrados = leads.filter(l => l.estado === 'CERRADO').length
    const ingresoConfirmado = leads
        .filter(l => l.estado === 'CERRADO')
        .reduce((s, l) => s + Number(l.precio_stand || 0), 0)

    if (loading) return <div className="loading-spinner">Cargando leads de expo...</div>

    return (
        <div>
            <div className="page-header">
                <h2>🏢 CRM — Expo Stands</h2>
                <p>Gestión de leads y exhibidores para CONNECTA 2026</p>
            </div>

            {/* Mini KPIs */}
            <div className="kpi-grid">
                <div className="kpi-card blue">
                    <div className="kpi-label">Total Leads</div>
                    <div className="kpi-value">{totalLeads}</div>
                </div>
                <div className="kpi-card green">
                    <div className="kpi-label">Cerrados</div>
                    <div className="kpi-value">{cerrados}</div>
                    <div className="kpi-sub">Conversión: {totalLeads ? ((cerrados / totalLeads) * 100).toFixed(1) : 0}%</div>
                </div>
                <div className="kpi-card purple">
                    <div className="kpi-label">Ingreso Confirmado</div>
                    <div className="kpi-value money">{formatMoney(ingresoConfirmado)}</div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="toolbar">
                <div className="toolbar-filters">
                    <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
                        <option value="">Todos los estados</option>
                        {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                    {isAdmin && (
                        <select value={filtroVendedor} onChange={e => setFiltroVendedor(e.target.value)}>
                            <option value="">Todos los vendedores</option>
                            {vendedores.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                    )}
                </div>
                <Link to="/expo/new" className="btn btn-primary">+ Nuevo Lead</Link>
            </div>

            {/* Table */}
            <div className="card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Empresa</th>
                                <th>Contacto</th>
                                <th>Estado</th>
                                <th>Precio Stand</th>
                                <th>Pagado</th>
                                <th>Vendedor</th>
                                <th>Próxima Acción</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No hay leads registrados</td></tr>
                            ) : filtered.map(lead => (
                                <tr key={lead.id}>
                                    <td style={{ fontWeight: 600 }}>{lead.empresa}</td>
                                    <td>{lead.contacto_nombre}</td>
                                    <td><span className={`badge badge-${lead.estado.toLowerCase()}`}>{lead.estado}</span></td>
                                    <td className="money">{formatMoney(lead.precio_stand)}</td>
                                    <td className="money">{formatMoney(lead.monto_pagado)}</td>
                                    <td>{lead.vendedor?.name || '—'}</td>
                                    <td>{formatDate(lead.fecha_proxima_accion)}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <Link to={`/expo/${lead.id}`} className="btn btn-secondary btn-sm">Editar</Link>
                                            {isAdmin && (
                                                <button onClick={() => handleDelete(lead.id)} className="btn btn-danger btn-sm">✕</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
