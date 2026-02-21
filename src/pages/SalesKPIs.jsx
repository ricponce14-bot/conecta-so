import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { formatMoney, FINANCIAL } from '../lib/utils'
import { useAuth } from '../contexts/AuthContext'

const ZONAS = [
    'Arandas / San Ignacio',
    'Lagos de Moreno / San Juan',
    'Jalostotitlán / San Miguel',
    'Tepatitlán',
]

export default function SalesKPIs() {
    const [vendedores, setVendedores] = useState([])
    const [zoneStats, setZoneStats] = useState([])
    const [loading, setLoading] = useState(true)
    const { isAdmin, user } = useAuth()

    useEffect(() => { fetchKPIs() }, [])

    async function fetchKPIs() {
        try {
            const [profilesRes, expoRes, sponsorRes] = await Promise.all([
                supabase.from('profiles').select('id, name, role'),
                supabase.from('expo_leads').select('vendedor_id, estado, precio_stand, zona'),
                supabase.from('sponsor_leads').select('vendedor_id, estado, valor_total, zona'),
            ])

            const profiles = (profilesRes.data || []).filter(p => p.role === 'VENDEDOR')
            const expoLeads = expoRes.data || []
            const sponsorLeads = sponsorRes.data || []

            // --- KPIs por vendedor ---
            const kpis = profiles.map(p => {
                const expoAssigned = expoLeads.filter(l => l.vendedor_id === p.id)
                // Comisión solo sobre 'Cerrado Pagado'
                const expoClosed = expoAssigned.filter(l => l.estado === 'Cerrado Pagado')
                const expoRevenue = expoClosed.reduce((s, l) => s + Number(l.precio_stand || 0), 0)
                const expoCommission = expoRevenue * FINANCIAL.COMISION_EXPO

                const sponsorAssigned = sponsorLeads.filter(l => l.vendedor_id === p.id)
                const sponsorClosed = sponsorAssigned.filter(l => l.estado === 'Cerrado Pagado')
                const sponsorRevenue = sponsorClosed.reduce((s, l) => s + Number(l.valor_total || 0), 0)
                const sponsorCommission = sponsorRevenue * FINANCIAL.COMISION_SPONSOR

                const totalAssigned = expoAssigned.length + sponsorAssigned.length
                const totalClosed = expoClosed.length + sponsorClosed.length
                const totalRevenue = expoRevenue + sponsorRevenue
                const totalCommission = expoCommission + sponsorCommission
                const conversionRate = totalAssigned > 0 ? (totalClosed / totalAssigned) * 100 : 0

                return {
                    id: p.id, name: p.name,
                    expoAssigned: expoAssigned.length, expoClosed: expoClosed.length,
                    expoRevenue, expoCommission,
                    sponsorAssigned: sponsorAssigned.length, sponsorClosed: sponsorClosed.length,
                    sponsorRevenue, sponsorCommission,
                    totalAssigned, totalClosed, totalRevenue, totalCommission, conversionRate,
                }
            })

            kpis.sort((a, b) => b.totalRevenue - a.totalRevenue)

            // --- KPIs por zona (agrupación en memoria) ---
            const statsMap = {}
            ZONAS.forEach(z => {
                statsMap[z] = { zona: z, totalExpo: 0, cerradosExpo: 0, revenueExpo: 0, totalSponsors: 0, cerradosSponsors: 0, revenueSponsors: 0 }
            })

            expoLeads.forEach(l => {
                if (l.zona && statsMap[l.zona]) {
                    statsMap[l.zona].totalExpo++
                    if (l.estado === 'Cerrado Pagado') {
                        statsMap[l.zona].cerradosExpo++
                        statsMap[l.zona].revenueExpo += Number(l.precio_stand || 0)
                    }
                }
            })
            sponsorLeads.forEach(l => {
                if (l.zona && statsMap[l.zona]) {
                    statsMap[l.zona].totalSponsors++
                    if (l.estado === 'Cerrado Pagado') {
                        statsMap[l.zona].cerradosSponsors++
                        statsMap[l.zona].revenueSponsors += Number(l.valor_total || 0)
                    }
                }
            })

            setZoneStats(Object.values(statsMap))

            if (!isAdmin) {
                setVendedores(kpis.filter(k => k.id === user.id))
            } else {
                setVendedores(kpis)
            }
        } catch (err) {
            console.error('Error fetching KPIs:', err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="loading-spinner">Cargando datos...</div>

    const totalRevenue = vendedores.reduce((s, v) => s + v.totalRevenue, 0)
    const totalCommission = vendedores.reduce((s, v) => s + v.totalCommission, 0)
    const totalClosed = vendedores.reduce((s, v) => s + v.totalClosed, 0)

    return (
        <div>
            <div className="page-header">
                <h2>KPIs de Ventas</h2>
                <p>Rendimiento comercial por vendedor — Comision Expo: {FINANCIAL.COMISION_EXPO * 100}% | Patrocinios: {FINANCIAL.COMISION_SPONSOR * 100}% (solo Cerrado Pagado)</p>
            </div>

            <div className="kpi-grid">
                <div className="kpi-card green">
                    <div className="kpi-label">Ingreso total generado</div>
                    <div className="kpi-value money">{formatMoney(totalRevenue)}</div>
                </div>
                <div className="kpi-card purple">
                    <div className="kpi-label">Comisiones totales</div>
                    <div className="kpi-value money">{formatMoney(totalCommission)}</div>
                </div>
                <div className="kpi-card blue">
                    <div className="kpi-label">Deals cerrados</div>
                    <div className="kpi-value">{totalClosed}</div>
                </div>
            </div>

            {/* Tabla por Vendedor */}
            <div className="card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Pos.</th>
                                <th>Vendedor</th>
                                <th>Leads</th>
                                <th>Cerrados</th>
                                <th>Conversion</th>
                                <th>Ingreso Expo</th>
                                <th>Ingreso Patrocinios</th>
                                <th>Ingreso Total</th>
                                <th>Com. Expo</th>
                                <th>Com. Patrocinios</th>
                                <th>Comision Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vendedores.length === 0 ? (
                                <tr><td colSpan="11" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Sin vendedores registrados</td></tr>
                            ) : vendedores.map((v, i) => (
                                <tr key={v.id}>
                                    <td style={{ fontWeight: 600 }}>{i + 1}</td>
                                    <td style={{ fontWeight: 600 }}>{v.name}</td>
                                    <td>{v.totalAssigned}</td>
                                    <td>{v.totalClosed}</td>
                                    <td>{v.conversionRate.toFixed(1)}%</td>
                                    <td className="money">{formatMoney(v.expoRevenue)}</td>
                                    <td className="money">{formatMoney(v.sponsorRevenue)}</td>
                                    <td className="money" style={{ fontWeight: 700, color: 'var(--positive)' }}>{formatMoney(v.totalRevenue)}</td>
                                    <td className="money">{formatMoney(v.expoCommission)}</td>
                                    <td className="money">{formatMoney(v.sponsorCommission)}</td>
                                    <td className="money" style={{ fontWeight: 700 }}>{formatMoney(v.totalCommission)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Rendimiento por Zona — solo Admin */}
            {isAdmin && (
                <div className="card" style={{ marginTop: '24px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '20px' }}>
                        📍 Rendimiento por Zona Territorial
                    </h3>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Zona</th>
                                    <th>Leads Expo</th>
                                    <th>Cerrados Expo</th>
                                    <th>Revenue Expo</th>
                                    <th>Leads Sponsors</th>
                                    <th>Cerrados Sponsors</th>
                                    <th>Revenue Sponsors</th>
                                    <th>Revenue Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {zoneStats.map(z => (
                                    <tr key={z.zona}>
                                        <td style={{ fontWeight: 600 }}>{z.zona}</td>
                                        <td>{z.totalExpo}</td>
                                        <td>{z.cerradosExpo}</td>
                                        <td className="money">{formatMoney(z.revenueExpo)}</td>
                                        <td>{z.totalSponsors}</td>
                                        <td>{z.cerradosSponsors}</td>
                                        <td className="money">{formatMoney(z.revenueSponsors)}</td>
                                        <td className="money" style={{ fontWeight: 700, color: 'var(--positive)' }}>
                                            {formatMoney(z.revenueExpo + z.revenueSponsors)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
