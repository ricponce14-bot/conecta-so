import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { formatMoney, slugify } from '../lib/utils'
import { sellerZScores } from '../lib/analytics'

const ZONAS = [
    'Arandas / San Ignacio',
    'Lagos de Moreno / San Juan',
    'Jalostotitlán / San Miguel',
    'Tepatitlán',
]

export default function Equipo() {
    const [vendedores, setVendedores] = useState([])
    const [expoLeads, setExpoLeads] = useState([])
    const [sponsorLeads, setSponsorLeads] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(null)
    const [editZona, setEditZona] = useState({})

    useEffect(() => { fetchData() }, [])

    async function fetchData() {
        const [profilesRes, expoRes, sponsorRes] = await Promise.all([
            supabase.from('profiles').select('*').eq('role', 'VENDEDOR').order('name'),
            supabase.from('expo_leads').select('vendedor_id, estado, precio_stand, zona'),
            supabase.from('sponsor_leads').select('vendedor_id, estado, valor_total, zona'),
        ])
        const profiles = profilesRes.data || []
        const expo = expoRes.data || []
        const sponsors = sponsorRes.data || []

        // Enrich profiles with KPIs
        const enriched = profiles.map(p => {
            const myExpo = expo.filter(l => l.vendedor_id === p.id)
            const mySponsors = sponsors.filter(l => l.vendedor_id === p.id)
            const closedExpo = myExpo.filter(l => l.estado === 'Cerrado Pagado')
            const closedSponsors = mySponsors.filter(l => l.estado === 'Cerrado Pagado')
            const expoRevenue = closedExpo.reduce((s, l) => s + Number(l.precio_stand || 0), 0)
            const sponsorRevenue = closedSponsors.reduce((s, l) => s + Number(l.valor_total || 0), 0)
            const totalRevenue = expoRevenue + sponsorRevenue
            const totalAssigned = myExpo.length + mySponsors.length
            const totalClosed = closedExpo.length + closedSponsors.length
            const conversionRate = totalAssigned > 0 ? (totalClosed / totalAssigned) * 100 : 0
            return { ...p, totalRevenue, totalAssigned, totalClosed, conversionRate, expoRevenue, sponsorRevenue }
        })

        const withZ = sellerZScores(enriched)
        setVendedores(withZ)
        setExpoLeads(expo)
        setSponsorLeads(sponsors)

        // Pre-fill editZona
        const zonaMap = {}
        profiles.forEach(p => { zonaMap[p.id] = p.zona_asignada || '' })
        setEditZona(zonaMap)
        setLoading(false)
    }

    async function saveZona(vendedorId) {
        setSaving(vendedorId)
        const { error } = await supabase
            .from('profiles')
            .update({ zona_asignada: editZona[vendedorId] || null })
            .eq('id', vendedorId)

        if (error) alert('Error: ' + error.message)
        else {
            setVendedores(prev =>
                prev.map(v => v.id === vendedorId ? { ...v, zona_asignada: editZona[vendedorId] } : v)
            )
        }
        setSaving(null)
    }

    // Group by zone
    const byZone = {}
    ZONAS.forEach(z => { byZone[z] = [] })
    byZone['Sin zona asignada'] = []
    vendedores.forEach(v => {
        const z = v.zona_asignada || 'Sin zona asignada'
        if (byZone[z]) byZone[z].push(v)
        else byZone['Sin zona asignada'].push(v)
    })

    const zScoreColor = (z) => {
        if (z >= 1) return '#10b981'
        if (z >= 0) return '#f59e0b'
        return '#ef4444'
    }

    if (loading) return <div className="loading-spinner">Cargando equipo...</div>

    return (
        <div>
            <div className="page-header">
                <h2>Gestión de Equipo</h2>
                <p>Asignación de zonas, rendimiento y análisis estadístico por vendedor</p>
            </div>

            {/* KPIs del equipo */}
            <div className="kpi-grid">
                <div className="kpi-card blue">
                    <div className="kpi-label">Vendedores activos</div>
                    <div className="kpi-value">{vendedores.length}</div>
                </div>
                <div className="kpi-card green">
                    <div className="kpi-label">Ingreso total generado</div>
                    <div className="kpi-value money">{formatMoney(vendedores.reduce((s, v) => s + v.totalRevenue, 0))}</div>
                </div>
                <div className="kpi-card purple">
                    <div className="kpi-label">Leads asignados</div>
                    <div className="kpi-value">{vendedores.reduce((s, v) => s + v.totalAssigned, 0)}</div>
                </div>
                <div className="kpi-card orange">
                    <div className="kpi-label">Tasa global</div>
                    <div className="kpi-value">
                        {(() => {
                            const total = vendedores.reduce((s, v) => s + v.totalAssigned, 0)
                            const closed = vendedores.reduce((s, v) => s + v.totalClosed, 0)
                            return total > 0 ? ((closed / total) * 100).toFixed(1) + '%' : '0%'
                        })()}
                    </div>
                </div>
            </div>

            {/* Tabla de vendedores con asignación de zona */}
            <div className="card" style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    👥 Vendedores — Asignación de Zona Territorial
                </h3>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Vendedor</th>
                                <th>Zona Asignada</th>
                                <th>Prospectos</th>
                                <th>Cerrados</th>
                                <th>Conversión</th>
                                <th>Revenue Expo</th>
                                <th>Revenue Sponsors</th>
                                <th>Total</th>
                                <th>Z-Score</th>
                                <th>Percentil</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vendedores.length === 0 ? (
                                <tr><td colSpan="11" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Sin vendedores</td></tr>
                            ) : vendedores.map(v => (
                                <tr key={v.id}>
                                    <td style={{ fontWeight: 700 }}>{v.name}</td>
                                    <td>
                                        <select
                                            value={editZona[v.id] || ''}
                                            onChange={e => setEditZona(prev => ({ ...prev, [v.id]: e.target.value }))}
                                            className="modern-select"
                                            style={{ minWidth: '200px' }}
                                        >
                                            <option value="">Sin zona</option>
                                            {ZONAS.map(z => <option key={z} value={z}>{z}</option>)}
                                        </select>
                                    </td>
                                    <td>{v.totalAssigned}</td>
                                    <td>{v.totalClosed}</td>
                                    <td>{v.conversionRate.toFixed(1)}%</td>
                                    <td className="money">{formatMoney(v.expoRevenue)}</td>
                                    <td className="money">{formatMoney(v.sponsorRevenue)}</td>
                                    <td className="money" style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatMoney(v.totalRevenue)}</td>
                                    <td>
                                        <span style={{
                                            fontWeight: 700, fontSize: '0.9rem',
                                            color: zScoreColor(v.zScore)
                                        }}>
                                            {v.zScore >= 0 ? '+' : ''}{v.zScore.toFixed(2)}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{
                                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                            width: '48px', height: '24px', borderRadius: '99px', fontSize: '0.75rem',
                                            fontWeight: 700, background: zScoreColor(v.zScore) + '20',
                                            color: zScoreColor(v.zScore)
                                        }}>
                                            {v.percentile}%
                                        </div>
                                    </td>
                                    <td>
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => saveZona(v.id)}
                                            disabled={saving === v.id}
                                        >
                                            {saving === v.id ? '...' : 'Guardar'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Vista por zona */}
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>📍 Distribución por Zona</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                {Object.entries(byZone).map(([zona, sellers]) => (
                    <div key={zona} className="card" style={{ padding: '20px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '12px', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px' }}>
                            {zona}
                        </div>
                        {sellers.length === 0 ? (
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sin vendedores asignados</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {sellers.map(v => (
                                    <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{v.name}</div>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{v.totalAssigned} prospectos · {v.totalClosed} cerrados</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem' }}>{formatMoney(v.totalRevenue)}</div>
                                            <div style={{ fontSize: '0.75rem', color: zScoreColor(v.zScore), fontWeight: 600 }}>Z: {v.zScore >= 0 ? '+' : ''}{v.zScore.toFixed(2)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Quick-assign: admin can reassign a prospect to any seller */}
            <div className="card" style={{ marginTop: '32px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>💡 Reasignación de Prospectos</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0' }}>
                    Para reasignar un prospecto específico, entra a <strong>CRM Expo</strong> o <strong>CRM Patrocinios</strong>, edita el lead y cambia el campo "Vendedor Asignado". El admin tiene acceso completo de edición en ambas vistas.
                </p>
            </div>
        </div>
    )
}
