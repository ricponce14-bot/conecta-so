import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { formatMoney, formatNumber, getDaysRemaining, getSmartAlerts, FINANCIAL } from '../lib/utils'
import { Icons } from '../components/Icons'

export default function Dashboard() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => { fetchAll() }, [])

    async function fetchAll() {
        try {
            // Verify Supabase Connection
            if (!supabase.supabaseUrl) throw new Error("Supabase URL missing")

            const results = await Promise.allSettled([
                supabase.from('expo_leads').select('*'),
                supabase.from('sponsor_leads').select('*'),
                supabase.from('tickets').select('*'),
                supabase.from('costs').select('*'),
            ])

            const [expoRes, sponsorRes, ticketRes, costRes] = results

            const getData = (res, name) => {
                if (res.status === 'fulfilled' && !res.value.error) {
                    return res.value.data || []
                }
                const msg = `Error fetching ${name}: ${res.reason || res.value?.error?.message}`
                console.warn(msg)
                if (!error) setError(msg) // Capture first error
                return []
            }

            setData({
                expo: getData(expoRes, 'expo'),
                sponsors: getData(sponsorRes, 'sponsors'),
                tickets: getData(ticketRes, 'tickets'),
                costs: getData(costRes, 'costs'),
            })
        } catch (err) {
            console.error('Critical dashboard error:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="loading-spinner">Cargando datos...</div>
    if (error) return (
        <div className="alert alert-warning" style={{ margin: '20px' }}>
            <Icons.AlertTriangle width={24} height={24} />
            <div>
                <strong>Error de Conexión:</strong> {error}
                <br />
                <small>Revise las variables de entorno en Vercel (VITE_SUPABASE_URL).</small>
            </div>
        </div>
    )
    if (!data) return null

    // Calculations
    const expoCerrados = data.expo.filter(l => l.estado === 'CERRADO')
    const ingresoExpo = expoCerrados.reduce((s, l) => s + Number(l.precio_stand || 0), 0)
    const expoAnticipoPagado = data.expo.reduce((s, l) => s + Number(l.monto_pagado || 0), 0)

    const sponsorCerrados = data.sponsors.filter(l => l.estado === 'CERRADO')
    const ingresoSponsors = sponsorCerrados.reduce((s, l) => s + Number(l.valor_total || 0), 0)
    const sponsorPagado = data.sponsors.reduce((s, l) => s + Number(l.monto_pagado || 0), 0)

    const totalGen = data.tickets.reduce((s, t) => s + Number(t.generales_vendidos), 0)
    const totalVip = data.tickets.reduce((s, t) => s + Number(t.vip_vendidos), 0)
    const ingresoGeneral = totalGen * FINANCIAL.PRECIO_GENERAL
    const ingresoVip = totalVip * FINANCIAL.PRECIO_VIP
    const ingresoConsumo = data.tickets.reduce((s, t) => s + Number(t.consumo_estimado), 0)
    const ingresoTickets = ingresoGeneral + ingresoVip + ingresoConsumo

    const totalCosts = data.costs.reduce((s, c) => s + Number(c.total), 0)
    const totalPagado = data.costs.reduce((s, c) => s + Number(c.pagado), 0)

    const ingresoConfirmado = ingresoExpo + ingresoSponsors + ingresoTickets
    const utilidadProyectada = ingresoConfirmado - totalCosts
    const cajaReal = expoAnticipoPagado + sponsorPagado + ingresoTickets - totalPagado
    const progress = FINANCIAL.META_INGRESOS > 0 ? ingresoConfirmado / FINANCIAL.META_INGRESOS : 0
    const daysRemaining = getDaysRemaining()
    const alerts = getSmartAlerts(progress, daysRemaining)

    const progressColor = utilidadProyectada >= FINANCIAL.META_UTILIDAD ? 'green' : utilidadProyectada > 0 ? 'yellow' : 'red'

    // Revenue breakdown
    const breakdown = [
        { label: 'Expo', value: ingresoExpo },
        { label: 'Patrocinios', value: ingresoSponsors },
        { label: 'Boletos', value: ingresoTickets },
        { label: 'Consumo', value: ingresoConsumo },
    ]

    // Chart data — revenue by date
    const ticketsByDate = {}
    data.tickets.forEach(t => {
        const key = t.fecha
        const revenue = t.generales_vendidos * FINANCIAL.PRECIO_GENERAL + t.vip_vendidos * FINANCIAL.PRECIO_VIP + Number(t.consumo_estimado)
        ticketsByDate[key] = (ticketsByDate[key] || 0) + revenue
    })
    const chartDates = Object.keys(ticketsByDate).sort()
    const chartValues = chartDates.map(d => ticketsByDate[d])
    const chartMax = Math.max(...chartValues, 1)

    return (
        <div>
            {/* Welcome Banner */}
            <div className="welcome-banner card" style={{
                marginBottom: '32px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
                color: 'white',
                padding: '40px',
                position: 'relative',
                overflow: 'hidden',
                border: 'none',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
                <div style={{ position: 'relative', zIndex: 10 }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.02em' }}>Conecta 2026 Admin</h2>
                    <p style={{ fontSize: '1.25rem', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Icons.Calendar width={20} height={20} />
                        {daysRemaining} días restantes — Meta: 18 de abril
                    </p>
                </div>
                <div style={{ position: 'absolute', right: '-20px', bottom: '-40px', opacity: 0.2, transform: 'rotate(-10deg) scale(2)' }}>
                    <Icons.TrendingUp width={200} height={200} />
                </div>
            </div>

            {/* Smart Alerts */}
            {alerts.map((a, i) => (
                <div key={i} className={`alert alert-${a.type}`} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icons.AlertTriangle width={18} height={18} />
                    {a.message}
                </div>
            ))}

            {/* Revenue Progress */}
            <div className="progress-section card" style={{ padding: '24px 32px' }}>
                <div className="progress-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ padding: '8px', borderRadius: '50%', background: 'var(--status-success-bg)', color: 'var(--status-success)' }}>
                            <Icons.TrendingUp width={20} height={20} />
                        </div>
                        <div>
                            <span className="label" style={{ display: 'block', marginBottom: '2px' }}>Meta de Ingresos</span>
                            <span className="value money" style={{ fontSize: '1.25rem' }}>{formatMoney(ingresoConfirmado)} / {formatMoney(FINANCIAL.META_INGRESOS)}</span>
                        </div>
                    </div>
                    <span className="value" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>
                        {(progress * 100).toFixed(1)}%
                    </span>
                </div>
                <div className="progress-bar" style={{ height: '12px', marginTop: '16px' }}>
                    <div className={`progress-fill ${progressColor}`} style={{ width: `${Math.min(100, progress * 100)}%`, transition: 'width 1s ease' }} />
                </div>
            </div>

            {/* KPI Grid */}
            <div className="kpi-grid">
                <div className="kpi-card blue">
                    <div className="kpi-label">Prospectos Expo</div>
                    <div className="kpi-value">{data.expo.length}</div>
                    <div className="kpi-sub">{expoCerrados.length} cerrados</div>
                    <div className="kpi-icon-bg"><Icons.Briefcase /></div>
                </div>
                <div className="kpi-card purple">
                    <div className="kpi-label">Prospectos Sponsors</div>
                    <div className="kpi-value">{data.sponsors.length}</div>
                    <div className="kpi-sub">{sponsorCerrados.length} cerrados</div>
                    <div className="kpi-icon-bg"><Icons.Handshake /></div>
                </div>
                <div className="kpi-card green">
                    <div className="kpi-label">Boletos Vendidos</div>
                    <div className="kpi-value">{formatNumber(totalGen + totalVip)}</div>
                    <div className="kpi-sub">{formatMoney(ingresoTickets)}</div>
                    <div className="kpi-icon-bg"><Icons.Ticket /></div>
                </div>
                <div className={`kpi-card ${utilidadProyectada >= 0 ? 'green' : 'red'}`}>
                    <div className="kpi-label">Utilidad Proyectada</div>
                    <div className="kpi-value money">{formatMoney(utilidadProyectada)}</div>
                    <div className="kpi-sub">vs. Costos: {formatMoney(totalCosts)}</div>
                    <div className="kpi-icon-bg"><Icons.DollarSign /></div>
                </div>
            </div>

            {/* Revenue Breakdown */}
            <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                <div className="card">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Icons.BarChart width={20} height={20} /> Desglose de Ingresos
                    </h3>
                    <div className="table-container">
                        <table>
                            <tbody>
                                {breakdown.map(b => (
                                    <tr key={b.label}>
                                        <td style={{ fontWeight: 500 }}>{b.label}</td>
                                        <td className="money" style={{ textAlign: 'right' }}>{formatMoney(b.value)}</td>
                                        <td style={{ textAlign: 'right', width: '60px' }}>
                                            <div style={{ background: 'var(--bg-body)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>
                                                {ingresoConfirmado > 0 ? ((b.value / ingresoConfirmado) * 100).toFixed(0) : 0}%
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                <tr style={{ fontWeight: 700, borderTop: '2px solid var(--border)' }}>
                                    <td>Total</td>
                                    <td className="money" style={{ textAlign: 'right' }}>{formatMoney(ingresoConfirmado)}</td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Revenue Accumulation Chart */}
                <div className="card chart-container">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Icons.TrendingUp width={20} height={20} /> Tendencia de Ventas
                    </h3>
                    {chartDates.length > 0 ? (
                        <>
                            <div className="chart-bars">
                                {chartValues.map((v, i) => (
                                    <div key={i} className="chart-bar" style={{ height: `${(v / chartMax) * 100}%` }} title={`${chartDates[i]}: ${formatMoney(v)}`} />
                                ))}
                            </div>
                            <div className="chart-labels">
                                {chartDates.map((d, i) => (
                                    <span key={i}>{d.substring(5)}</span>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Sin datos suficientes</div>
                    )}
                </div>
            </div>
        </div>
    )
}
