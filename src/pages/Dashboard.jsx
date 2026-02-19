import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { formatMoney, formatNumber, getDaysRemaining, getSmartAlerts, FINANCIAL } from '../lib/utils'

export default function Dashboard() {
    const [metrics, setMetrics] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchMetrics()
    }, [])

    async function fetchMetrics() {
        try {
            const [expoRes, sponsorRes, ticketsRes, costsRes] = await Promise.all([
                supabase.from('expo_leads').select('precio_stand, estado, monto_pagado'),
                supabase.from('sponsor_leads').select('valor_total, estado, monto_pagado'),
                supabase.from('tickets').select('generales_vendidos, vip_vendidos, consumo_estimado, fecha'),
                supabase.from('costs').select('total, pagado'),
            ])

            const expoLeads = expoRes.data || []
            const sponsorLeads = sponsorRes.data || []
            const tickets = ticketsRes.data || []
            const costs = costsRes.data || []

            // Revenue calculations
            const ingresoExpo = expoLeads
                .filter(l => l.estado === 'CERRADO')
                .reduce((sum, l) => sum + Number(l.precio_stand || 0), 0)

            const ingresoSponsors = sponsorLeads
                .filter(l => l.estado === 'CERRADO')
                .reduce((sum, l) => sum + Number(l.valor_total || 0), 0)

            const totalGenerales = tickets.reduce((sum, t) => sum + Number(t.generales_vendidos || 0), 0)
            const totalVip = tickets.reduce((sum, t) => sum + Number(t.vip_vendidos || 0), 0)
            const ingresoBoletos = (totalGenerales * FINANCIAL.PRECIO_GENERAL) + (totalVip * FINANCIAL.PRECIO_VIP)
            const ingresoConsumo = tickets.reduce((sum, t) => sum + Number(t.consumo_estimado || 0), 0)

            const ingresoTotal = ingresoExpo + ingresoSponsors + ingresoBoletos + ingresoConsumo

            // Cost calculations
            const costosTotales = costs.reduce((sum, c) => sum + Number(c.total || 0), 0)
            const costosPagados = costs.reduce((sum, c) => sum + Number(c.pagado || 0), 0)
            const cajaReal = ingresoTotal - costosPagados
            const utilidadProyectada = ingresoTotal - costosTotales

            // Counts
            const standsCerrados = expoLeads.filter(l => l.estado === 'CERRADO').length
            const standsTotal = expoLeads.length
            const sponsorsCerrados = sponsorLeads.filter(l => l.estado === 'CERRADO').length
            const sponsorsTotal = sponsorLeads.length

            // Progress
            const progress = ingresoTotal / FINANCIAL.META_INGRESOS
            const puntoEquilibrio = ingresoTotal >= FINANCIAL.COSTO_BASE

            // Revenue by date for chart
            const revenueByDate = {}
            tickets.forEach(t => {
                const d = t.fecha
                if (!revenueByDate[d]) revenueByDate[d] = 0
                revenueByDate[d] += (t.generales_vendidos * FINANCIAL.PRECIO_GENERAL) +
                    (t.vip_vendidos * FINANCIAL.PRECIO_VIP) +
                    Number(t.consumo_estimado || 0)
            })

            setMetrics({
                ingresoExpo, ingresoSponsors, ingresoBoletos, ingresoConsumo,
                ingresoTotal, costosTotales, costosPagados, cajaReal, utilidadProyectada,
                standsCerrados, standsTotal, sponsorsCerrados, sponsorsTotal,
                totalGenerales, totalVip, progress, puntoEquilibrio,
                revenueByDate,
            })
        } catch (err) {
            console.error('Error fetching metrics:', err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="loading-spinner">Cargando dashboard...</div>
    if (!metrics) return <div className="loading-spinner">Error al cargar datos</div>

    const daysRemaining = getDaysRemaining()
    const alerts = getSmartAlerts(metrics.progress, daysRemaining)
    const progressPercent = Math.min(metrics.progress * 100, 100)

    // Color logic for utilidad
    let utilColor = 'red'
    if (metrics.utilidadProyectada > FINANCIAL.META_UTILIDAD) utilColor = 'green'
    else if (metrics.utilidadProyectada > 0) utilColor = 'yellow'

    // Chart data
    const chartEntries = Object.entries(metrics.revenueByDate).sort((a, b) => a[0].localeCompare(b[0]))
    const maxChartVal = Math.max(...chartEntries.map(e => e[1]), 1)

    return (
        <div>
            <div className="page-header">
                <h2>📊 Dashboard Ejecutivo</h2>
                <p>CONNECTA 2026 — Faltan {daysRemaining} días para el evento (18-19 Abril)</p>
            </div>

            {/* Smart Alerts */}
            {alerts.map((a, i) => (
                <div key={i} className={`alert alert-${a.type}`}>{a.message}</div>
            ))}

            {/* Revenue Progress */}
            <div className="progress-section">
                <div className="progress-header">
                    <span className="label">Progreso de Ingreso vs Meta ({formatMoney(FINANCIAL.META_INGRESOS)})</span>
                    <span className="value">{progressPercent.toFixed(1)}%</span>
                </div>
                <div className="progress-bar">
                    <div
                        className={`progress-fill ${utilColor}`}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* KPI Cards */}
            <div className="kpi-grid">
                <div className="kpi-card blue">
                    <div className="kpi-label">Stands Vendidos / Total</div>
                    <div className="kpi-value">{metrics.standsCerrados} / {metrics.standsTotal}</div>
                    <div className="kpi-sub">{formatMoney(metrics.ingresoExpo)} confirmado</div>
                </div>

                <div className="kpi-card purple">
                    <div className="kpi-label">Patrocinios Cerrados / Total</div>
                    <div className="kpi-value">{metrics.sponsorsCerrados} / {metrics.sponsorsTotal}</div>
                    <div className="kpi-sub">{formatMoney(metrics.ingresoSponsors)} confirmado</div>
                </div>

                <div className="kpi-card orange">
                    <div className="kpi-label">Boletos Generales</div>
                    <div className="kpi-value">{formatNumber(metrics.totalGenerales)}</div>
                    <div className="kpi-sub">{formatMoney(metrics.totalGenerales * FINANCIAL.PRECIO_GENERAL)}</div>
                </div>

                <div className="kpi-card orange">
                    <div className="kpi-label">Boletos VIP</div>
                    <div className="kpi-value">{formatNumber(metrics.totalVip)}</div>
                    <div className="kpi-sub">{formatMoney(metrics.totalVip * FINANCIAL.PRECIO_VIP)}</div>
                </div>

                <div className="kpi-card green">
                    <div className="kpi-label">Ingreso Total Confirmado</div>
                    <div className="kpi-value money">{formatMoney(metrics.ingresoTotal)}</div>
                    <div className="kpi-sub">Expo + Patrocinios + Boletos + Consumo</div>
                </div>

                <div className={`kpi-card ${utilColor}`}>
                    <div className="kpi-label">Utilidad Proyectada</div>
                    <div className={`kpi-value money ${metrics.utilidadProyectada >= 0 ? 'money-positive' : 'money-negative'}`}>
                        {formatMoney(metrics.utilidadProyectada)}
                    </div>
                    <div className="kpi-sub">Ingreso - Costos totales</div>
                </div>

                <div className="kpi-card blue">
                    <div className="kpi-label">Caja Real Disponible</div>
                    <div className={`kpi-value money ${metrics.cajaReal >= 0 ? 'money-positive' : 'money-negative'}`}>
                        {formatMoney(metrics.cajaReal)}
                    </div>
                    <div className="kpi-sub">Ingreso - Costos pagados</div>
                </div>

                <div className={`kpi-card ${metrics.puntoEquilibrio ? 'green' : 'red'}`}>
                    <div className="kpi-label">Punto de Equilibrio</div>
                    <div className="kpi-value">{metrics.puntoEquilibrio ? '✅ ALCANZADO' : '❌ PENDIENTE'}</div>
                    <div className="kpi-sub">Meta: {formatMoney(FINANCIAL.COSTO_BASE)}</div>
                </div>
            </div>

            {/* Revenue Breakdown */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '16px', fontSize: '1rem', fontWeight: 700 }}>Desglose de Ingresos</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Concepto</th>
                            <th style={{ textAlign: 'right' }}>Monto</th>
                            <th style={{ textAlign: 'right' }}>% del Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[
                            ['Expo (Stands)', metrics.ingresoExpo],
                            ['Patrocinios', metrics.ingresoSponsors],
                            ['Boletos', metrics.ingresoBoletos],
                            ['Consumo Estimado', metrics.ingresoConsumo],
                        ].map(([label, val]) => (
                            <tr key={label}>
                                <td>{label}</td>
                                <td style={{ textAlign: 'right' }} className="money">{formatMoney(val)}</td>
                                <td style={{ textAlign: 'right' }}>
                                    {metrics.ingresoTotal > 0 ? ((val / metrics.ingresoTotal) * 100).toFixed(1) : '0.0'}%
                                </td>
                            </tr>
                        ))}
                        <tr style={{ fontWeight: 700 }}>
                            <td>TOTAL</td>
                            <td style={{ textAlign: 'right' }} className="money">{formatMoney(metrics.ingresoTotal)}</td>
                            <td style={{ textAlign: 'right' }}>100%</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Revenue Chart */}
            {chartEntries.length > 0 && (
                <div className="card chart-container">
                    <h3 style={{ marginBottom: '16px', fontSize: '1rem', fontWeight: 700 }}>
                        Ingresos Acumulados por Fecha
                    </h3>
                    <div className="chart-bars">
                        {chartEntries.map(([date, val]) => (
                            <div
                                key={date}
                                className="chart-bar"
                                style={{ height: `${(val / maxChartVal) * 100}%` }}
                                title={`${date}: ${formatMoney(val)}`}
                            />
                        ))}
                    </div>
                    <div className="chart-labels">
                        {chartEntries.map(([date]) => (
                            <span key={date}>{date.substring(5)}</span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
