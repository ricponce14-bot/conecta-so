import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { formatMoney } from '../lib/utils'

export default function Costs() {
    const [costs, setCosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [editId, setEditId] = useState(null)
    const [editPagado, setEditPagado] = useState(0)

    useEffect(() => { fetchCosts() }, [])

    async function fetchCosts() {
        const { data } = await supabase.from('costs').select('*').order('created_at')
        setCosts(data || [])
        setLoading(false)
    }

    function startEdit(cost) {
        setEditId(cost.id)
        setEditPagado(cost.pagado)
    }

    async function saveEdit(id) {
        if (Number(editPagado) < 0) return alert('El monto no puede ser negativo')

        const { error } = await supabase.from('costs').update({ pagado: Number(editPagado) }).eq('id', id)

        if (error) {
            alert('Error actualizando: ' + error.message)
        } else {
            setEditId(null)
            fetchCosts()
        }
    }

    const totalCostos = costs.reduce((s, c) => s + Number(c.total), 0)
    const totalPagado = costs.reduce((s, c) => s + Number(c.pagado), 0)
    const totalPendiente = totalCostos - totalPagado

    if (loading) return <div className="loading-spinner">Cargando datos...</div>

    return (
        <div>
            <div className="page-header">
                <h2>Control de Costos</h2>
                <p>Seguimiento de gastos fijos del evento</p>
            </div>

            <div className="kpi-grid">
                <div className="kpi-card red">
                    <div className="kpi-label">Costos totales</div>
                    <div className="kpi-value money">{formatMoney(totalCostos)}</div>
                </div>
                <div className="kpi-card yellow">
                    <div className="kpi-label">Pagado</div>
                    <div className="kpi-value money">{formatMoney(totalPagado)}</div>
                    <div className="kpi-sub">{totalCostos > 0 ? ((totalPagado / totalCostos) * 100).toFixed(1) : 0}% del total</div>
                </div>
                <div className="kpi-card orange">
                    <div className="kpi-label">Pendiente</div>
                    <div className="kpi-value money">{formatMoney(totalPendiente)}</div>
                </div>
            </div>

            <div className="progress-section">
                <div className="progress-header">
                    <span className="label">Avance de pagos</span>
                    <span className="value">{totalCostos > 0 ? ((totalPagado / totalCostos) * 100).toFixed(1) : 0}%</span>
                </div>
                <div className="progress-bar">
                    <div
                        className="progress-fill yellow"
                        style={{ width: `${totalCostos > 0 ? (totalPagado / totalCostos) * 100 : 0}%` }}
                    />
                </div>
            </div>

            <div className="card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Concepto</th>
                                <th style={{ textAlign: 'right' }}>Total</th>
                                <th style={{ textAlign: 'right' }}>Pagado</th>
                                <th style={{ textAlign: 'right' }}>Pendiente</th>
                                <th style={{ textAlign: 'right' }}>Avance</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {costs.map(c => {
                                const pendiente = Number(c.total) - Number(c.pagado)
                                const pctPagado = c.total > 0 ? (c.pagado / c.total) * 100 : 0
                                return (
                                    <tr key={c.id}>
                                        <td style={{ fontWeight: 600 }}>{c.concepto}</td>
                                        <td className="money" style={{ textAlign: 'right' }}>{formatMoney(c.total)}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            {editId === c.id ? (
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={editPagado}
                                                    onChange={e => setEditPagado(e.target.value)}
                                                    style={{ width: '120px', background: 'var(--bg-input)', border: '1px solid var(--border-light)', borderRadius: '4px', padding: '6px 10px', color: 'var(--text-primary)', fontFamily: 'var(--font)', fontSize: 'var(--text-sm)' }}
                                                />
                                            ) : (
                                                <span className="money">{formatMoney(c.pagado)}</span>
                                            )}
                                        </td>
                                        <td className="money" style={{ textAlign: 'right', color: pendiente > 0 ? 'var(--status-warning)' : 'var(--positive)' }}>
                                            {formatMoney(pendiente)}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>{pctPagado.toFixed(0)}%</td>
                                        <td>
                                            {editId === c.id ? (
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <button onClick={() => saveEdit(c.id)} className="btn btn-primary btn-sm">Guardar</button>
                                                    <button onClick={() => setEditId(null)} className="btn btn-secondary btn-sm">Cancelar</button>
                                                </div>
                                            ) : (
                                                <button onClick={() => startEdit(c)} className="btn btn-secondary btn-sm">Editar Pago</button>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                            <tr style={{ fontWeight: 700, borderTop: '2px solid var(--border)' }}>
                                <td>TOTALES</td>
                                <td className="money" style={{ textAlign: 'right' }}>{formatMoney(totalCostos)}</td>
                                <td className="money" style={{ textAlign: 'right' }}>{formatMoney(totalPagado)}</td>
                                <td className="money" style={{ textAlign: 'right' }}>{formatMoney(totalPendiente)}</td>
                                <td style={{ textAlign: 'right' }}>{totalCostos > 0 ? ((totalPagado / totalCostos) * 100).toFixed(0) : 0}%</td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
