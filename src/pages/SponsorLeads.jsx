import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { formatMoney, formatDate } from '../lib/utils'

const ESTADOS = ['PROSPECTO', 'NEGOCIACION', 'CERRADO', 'PERDIDO']
const NIVELES = ['ORO', 'PLATA', 'ALIADO']

export default function SponsorLeads() {
    const [leads, setLeads] = useState([])
    const [vendedores, setVendedores] = useState([])
    const [loading, setLoading] = useState(true)
    const [filtroEstado, setFiltroEstado] = useState('')
    const [filtroNivel, setFiltroNivel] = useState('')
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
        if (filtroNivel && l.nivel !== filtroNivel) return false
        return true
    })

    const cerrados = leads.filter(l => l.estado === 'CERRADO').length
    const ingresoConfirmado = leads
        .filter(l => l.estado === 'CERRADO')
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
                    <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
                        <option value="">Todos los estados</option>
                        {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                    <select value={filtroNivel} onChange={e => setFiltroNivel(e.target.value)}>
                        <option value="">Todos los niveles</option>
                        {NIVELES.map(n => <option key={n} value={n}>{n}</option>)}
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
                                <th>Nivel</th>
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
                                <tr><td colSpan="9" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Sin registros</td></tr>
                            ) : filtered.map(lead => (
                                <tr key={lead.id}>
                                    <td style={{ fontWeight: 600 }}>{lead.empresa}</td>
                                    <td>{lead.contacto}</td>
                                    <td><span className={`badge badge-${lead.nivel.toLowerCase()}`}>{lead.nivel}</span></td>
                                    <td><span className={`badge badge-${lead.estado.toLowerCase()}`}>{lead.estado}</span></td>
                                    <td className="money">{formatMoney(lead.valor_total)}</td>
                                    <td className="money">{formatMoney(lead.monto_pagado)}</td>
                                    <td>{lead.vendedor?.name || '—'}</td>
                                    <td>{formatDate(lead.fecha_seguimiento)}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <Link to={`/sponsors/${lead.id}`} className="btn btn-secondary btn-sm">Editar</Link>
                                            {isAdmin && (
                                                <button onClick={() => handleDelete(lead.id)} className="btn btn-danger btn-sm">Eliminar</button>
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
