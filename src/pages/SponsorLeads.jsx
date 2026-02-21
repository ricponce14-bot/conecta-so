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

export default function SponsorLeads() {
    const [leads, setLeads] = useState([])
    const [vendedores, setVendedores] = useState([])
    const [loading, setLoading] = useState(true)
    const [filtroEstado, setFiltroEstado] = useState('')
    const [filtroZona, setFiltroZona] = useState('')
    const { isAdmin } = useAuth()

    useEffect(() => { fetchData() }, [])

    async function fetchData() {
        const [leadsRes, vendRes] = await Promise.all([
            supabase.from('sponsor_leads')
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

        const { error } = await supabase.from('sponsor_leads').delete().eq('id', id)
        if (error) {
            alert('Error eliminando: ' + error.message)
            setLeads(prev)
        }
    }

    const filtered = leads.filter(l => {
        if (filtroEstado && l.estado !== filtroEstado) return false
        if (filtroZona && l.zona !== filtroZona) return false
        return true
    })

    const cerrados = leads.filter(l => l.estado === 'Cerrado Pagado').length
    const ingresoConfirmado = leads
        .filter(l => l.estado === 'Cerrado Pagado')
        .reduce((s, l) => s + Number(l.valor_total || 0), 0)

    if (loading) return <div className="loading-spinner">Cargando datos...</div>

    return (
        <div>
            <div className="page-header">
                <h2>CRM Patrocinios</h2>
                <p>Gestion de sponsors para Conecta 2026</p>
            </div>

            <div className="kpi-grid">
                <div className="kpi-card blue">
                    <div className="kpi-label">Total prospectos</div>
                    <div className="kpi-value">{leads.length}</div>
                </div>
                <div className="kpi-card green">
                    <div className="kpi-label">Cerrados</div>
                    <div className="kpi-value">{cerrados}</div>
                </div>
                <div className="kpi-card purple">
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
                </div>
                <Link to="/sponsors/new" className="btn btn-primary">Nuevo Patrocinio</Link>
            </div>

            <div className="card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Empresa</th>
                                <th>Contacto</th>
                                <th>Zona</th>
                                <th>Tipo Patrocinio</th>
                                <th>Estado</th>
                                <th>Valor Total</th>
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
                                    <td data-label="Contacto">{lead.contacto}</td>
                                    <td data-label="Zona">{lead.zona || '—'}</td>
                                    <td data-label="Tipo Patrocinio">{lead.tipo_patrocinio || '—'}</td>
                                    <td data-label="Estado"><span className={`badge badge-${slugify(lead.estado)}`}>{lead.estado}</span></td>
                                    <td data-label="Valor Total" className="money">{formatMoney(lead.valor_total)}</td>
                                    <td data-label="Pagado" className="money">{formatMoney(lead.monto_pagado)}</td>
                                    <td data-label="Vendedor">{lead.vendedor?.name || '—'}</td>
                                    <td data-label="Seguimiento">{formatDate(lead.fecha_seguimiento)}</td>
                                    <td data-label="Acciones">
                                        <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                                            <Link to={`/sponsors/${lead.id}`} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>Editar</Link>
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
