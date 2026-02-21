import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { formatMoney, formatDate, slugify } from '../lib/utils'

const ESTADOS = [
    'Prospecto Nuevo',
    'Contactado',
    'Cita Agendada',
    'Negociación',
    'Cerrado Pagado',
    'Perdido',
]

const ZONAS = [
    'Arandas / San Ignacio',
    'Lagos de Moreno / San Juan',
    'Jalostotitlán / San Miguel',
    'Tepatitlán',
]

export default function ExpoLeads() {
    const [leads, setLeads] = useState([])
    const [vendedores, setVendedores] = useState([])
    const [loading, setLoading] = useState(true)
    const [filtroEstado, setFiltroEstado] = useState('')
    const [filtroVendedor, setFiltroVendedor] = useState('')
    const [filtroZona, setFiltroZona] = useState('')
    const { isAdmin } = useAuth()

    useEffect(() => { fetchData() }, [])

    async function fetchData() {
        const [leadsRes, vendRes] = await Promise.all([
            supabase.from('expo_leads')
                .select('*, vendedor:profiles!vendedor_id(name)')
                .order('created_at', { ascending: false }),
            supabase.from('profiles').select('id, name').eq('role', 'VENDEDOR'),
        ])
        setLeads(leadsRes.data || [])
        setVendedores(vendRes.data || [])
        setLoading(false)
    }

    async function handleDelete(id) {
        if (!confirm('Confirmar eliminacion del registro.')) return

        const prev = [...leads]
        setLeads(leads.filter(l => l.id !== id))

        const { error } = await supabase.from('expo_leads').delete().eq('id', id)
        if (error) {
            alert('Error eliminando: ' + error.message)
            setLeads(prev)
        }
    }

    const filtered = leads.filter(l => {
        if (filtroEstado && l.estado !== filtroEstado) return false
        if (filtroVendedor && l.vendedor_id !== filtroVendedor) return false
        if (filtroZona && l.zona !== filtroZona) return false
        return true
    })

    const cerrados = leads.filter(l => l.estado === 'Cerrado Pagado').length
    const conversion = leads.length > 0 ? ((cerrados / leads.length) * 100).toFixed(1) : '0.0'
    const ingresoConfirmado = leads
        .filter(l => l.estado === 'Cerrado Pagado')
        .reduce((s, l) => s + Number(l.precio_stand || 0), 0)

    if (loading) return <div className="loading-spinner">Cargando datos...</div>

    return (
        <div>
            <div className="page-header">
                <h2>CRM Expo</h2>
                <p>Gestion de leads para stands de exposicion</p>
            </div>

            <div className="kpi-grid">
                <div className="kpi-card blue">
                    <div className="kpi-label">Total leads</div>
                    <div className="kpi-value">{leads.length}</div>
                </div>
                <div className="kpi-card green">
                    <div className="kpi-label">Cerrados</div>
                    <div className="kpi-value">{cerrados}</div>
                </div>
                <div className="kpi-card purple">
                    <div className="kpi-label">Tasa de conversion</div>
                    <div className="kpi-value">{conversion}%</div>
                </div>
                <div className="kpi-card green">
                    <div className="kpi-label">Ingreso confirmado</div>
                    <div className="kpi-value money">{formatMoney(ingresoConfirmado)}</div>
                </div>
            </div>

            <div className="toolbar">
                <div className="toolbar-filters">
                    <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className="modern-select">
                        <option value="">Todos los estados</option>
                        {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                    <select value={filtroZona} onChange={e => setFiltroZona(e.target.value)} className="modern-select">
                        <option value="">Todas las zonas</option>
                        {ZONAS.map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                    {isAdmin && (
                        <select value={filtroVendedor} onChange={e => setFiltroVendedor(e.target.value)} className="modern-select">
                            <option value="">Todos los vendedores</option>
                            {vendedores.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                    )}
                </div>
                <Link to="/expo/new" className="btn btn-primary">Nuevo Lead</Link>
            </div>

            <div className="card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Empresa</th>
                                <th>Contacto</th>
                                <th>Zona</th>
                                <th>Tipo Stand</th>
                                <th>Estado</th>
                                <th>Precio Stand</th>
                                <th>Pagado</th>
                                <th>Vendedor</th>
                                <th>Seguimiento</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan="10" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Sin registros</td></tr>
                            ) : filtered.map(lead => (
                                <tr key={lead.id}>
                                    <td data-label="Empresa" style={{ fontWeight: 600 }}>{lead.empresa}</td>
                                    <td data-label="Contacto">{lead.contacto_nombre}</td>
                                    <td data-label="Zona">{lead.zona || '—'}</td>
                                    <td data-label="Tipo Stand">{lead.tipo_stand || '—'}</td>
                                    <td data-label="Estado"><span className={`badge badge-${slugify(lead.estado)}`}>{lead.estado}</span></td>
                                    <td data-label="Precio Stand" className="money">{formatMoney(lead.precio_stand)}</td>
                                    <td data-label="Pagado" className="money">{formatMoney(lead.monto_pagado)}</td>
                                    <td data-label="Vendedor">{lead.vendedor?.name || '—'}</td>
                                    <td data-label="Seguimiento">{formatDate(lead.fecha_proxima_accion)}</td>
                                    <td data-label="Acciones">
                                        <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                                            <Link to={`/expo/${lead.id}`} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>Editar</Link>
                                            {isAdmin && (
                                                <button onClick={() => handleDelete(lead.id)} className="btn btn-danger btn-sm" style={{ flex: 1, justifyContent: 'center' }}>Eliminar</button>
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
