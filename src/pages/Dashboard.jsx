import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { formatMoney, formatNumber, getDaysRemaining, getSmartAlerts, FINANCIAL } from '../lib/utils'

export default function Dashboard() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => { fetchAll() }, [])

    async function fetchAll() {
        const [expoRes, sponsorRes, ticketRes, costRes] = await Promise.all([
            supabase.from('expo_leads').select('*'),
            supabase.from('sponsor_leads').select('*'),
            supabase.from('tickets').select('*'),
            supabase.from('costs').select('*'),
        ])
        setData({
            expo: expoRes.data || [],
            sponsors: sponsorRes.data || [],
            tickets: ticketRes.data || [],
            costs: costRes.data || [],
        })
        setLoading(false)
    }

    if (loading || !data) return <div className="loading-spinner">Cargando datos...</div>

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
            <div className="page-header">
                <h2>Panel de Control</h2>
                <p>{daysRemaining} dias restantes para el evento — Fecha objetivo: 18 de abril de 2026</p>
            </div>

            {/* Smart Alerts */}
            {alerts.map((a, i) => (
                <div key={i} className={`alert alert-${a.type}`}>{a.message}</div>
            ))}

            {/* Revenue Progress */}
            <div className="progress-section">
                <div className="progress-header">
                    <span className="label">Ingreso confirmado vs. meta ({formatMoney(FINANCIAL.META_INGRESOS)})</span>
                    <span className="value">{(progress * 100).toFixed(1)}%</span>
                </div>
                <div className="progress-bar">
                    <div className={`progress-fill ${progressColor}`} style={{ width: `${Math.min(100, progress * 100)}%` }} />
                </div>
            </div>

            {/* KPI Grid */}
            <div className="kpi-grid">
                <div className="kpi-card blue">
                    <div className="kpi-label">Stands cerrados</div>
                    <div className="kpi-value">{expoCerrados.length}</div>
                    <div className="kpi-sub">{data.expo.length} prospectos totales</div>
                </div>
                <div className="kpi-card blue">
                    <div className="kpi-label">Sponsors cerrados</div>
                    <div className="kpi-value">{sponsorCerrados.length}</div>
                    <div className="kpi-sub">{data.sponsors.length} prospectos totales</div>
                </div>
                <div className="kpi-card green">
                    <div className="kpi-label">Generales vendidos</div>
                    <div className="kpi-value">{formatNumber(totalGen)}</div>
                </div>
                <div className="kpi-card green">
                    <div className="kpi-label">VIP vendidos</div>
                    <div className="kpi-value">{formatNumber(totalVip)}</div>
                </div>
                <div className="kpi-card green">
                    <div className="kpi-label">Ingreso confirmado</div>
                    <div className="kpi-value money">{formatMoney(ingresoConfirmado)}</div>
                </div>
                <div className={`kpi-card ${utilidadProyectada >= 0 ? 'green' : 'red'}`}>
                    <div className="kpi-label">Utilidad proyectada</div>
                    <div className="kpi-value money">{formatMoney(utilidadProyectada)}</div>
                </div>
                <div className={`kpi-card ${cajaReal >= 0 ? 'green' : 'red'}`}>
                    <div className="kpi-label">Caja real disponible</div>
                    <div className="kpi-value money">{formatMoney(cajaReal)}</div>
                </div>
                <div className={`kpi-card ${utilidadProyectada >= 0 ? 'green' : 'red'}`}>
                    <div className="kpi-label">Punto de equilibrio</div>
                    <div className="kpi-value">{utilidadProyectada >= 0 ? 'CUBIERTO' : 'DEFICIT'}</div>
                </div>
            </div>

            {/* Revenue Breakdown */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-heading)' }}>Desglose de ingresos</h3>
                </div>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Fuente</th>
                                <th style={{ textAlign: 'right' }}>Monto</th>
                                <th style={{ textAlign: 'right' }}>Porcentaje</th>
                            </tr>
                        </thead>
                        <tbody>
                            {breakdown.map(b => (
                                <tr key={b.label}>
                                    <td style={{ fontWeight: 500 }}>{b.label}</td>
                                    <td className="money" style={{ textAlign: 'right' }}>{formatMoney(b.value)}</td>
                                    <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                                        {ingresoConfirmado > 0 ? ((b.value / ingresoConfirmado) * 100).toFixed(1) : 0}%
                                    </td>
                                </tr>
                            ))}
                            <tr style={{ fontWeight: 700, borderTop: '2px solid var(--border)' }}>
                                <td>Total</td>
                                <td className="money" style={{ textAlign: 'right' }}>{formatMoney(ingresoConfirmado)}</td>
                                <td style={{ textAlign: 'right' }}>100%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Revenue Accumulation Chart */}
            {chartDates.length > 0 && (
                <div className="card chart-container">
                    <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-heading)', marginBottom: '16px' }}>Acumulacion de ingresos por fecha</h3>
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
                </div>
            )}
        </div>
    )
}
