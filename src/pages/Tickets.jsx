import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { formatMoney, formatDate, FINANCIAL } from '../lib/utils'
import { Icons } from '../components/Icons'

export default function Tickets() {
    const [tickets, setTickets] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ fecha: new Date().toISOString().split('T')[0], generales_vendidos: 0, vip_vendidos: 0, consumo_estimado: 0 })
    const [editId, setEditId] = useState(null)

    useEffect(() => { fetchTickets() }, [])

    async function fetchTickets() {
        const { data } = await supabase.from('tickets').select('*').order('fecha', { ascending: false })
        setTickets(data || [])
        setLoading(false)
    }

    function handleChange(e) {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    async function handleSubmit(e) {
        e.preventDefault()
        const payload = {
            fecha: form.fecha,
            generales_vendidos: Number(form.generales_vendidos) || 0,
            vip_vendidos: Number(form.vip_vendidos) || 0,
            consumo_estimado: Number(form.consumo_estimado) || 0,
        }

        if (editId) {
            await supabase.from('tickets').update(payload).eq('id', editId)
        } else {
            await supabase.from('tickets').insert(payload)
        }

        setShowForm(false)
        setEditId(null)
        setForm({ fecha: new Date().toISOString().split('T')[0], generales_vendidos: 0, vip_vendidos: 0, consumo_estimado: 0 })
        fetchTickets()
    }

    function startEdit(ticket) {
        setForm({
            fecha: ticket.fecha,
            generales_vendidos: ticket.generales_vendidos,
            vip_vendidos: ticket.vip_vendidos,
            consumo_estimado: ticket.consumo_estimado,
        })
        setEditId(ticket.id)
        setShowForm(true)
    }

    async function handleDelete(id) {
        if (!confirm('Confirmar eliminacion del registro.')) return

        const prev = [...tickets]
        setTickets(tickets.filter(t => t.id !== id))

        const { error } = await supabase.from('tickets').delete().eq('id', id)
        if (error) {
            alert('Error eliminando: ' + error.message)
            setTickets(prev)
        } else {
            fetchTickets() // Refresh to ensure totals are exact
        }
    }

    const totalGen = tickets.reduce((s, t) => s + Number(t.generales_vendidos), 0)
    const totalVip = tickets.reduce((s, t) => s + Number(t.vip_vendidos), 0)
    const totalConsumo = tickets.reduce((s, t) => s + Number(t.consumo_estimado), 0)
    const ingresoGen = totalGen * FINANCIAL.PRECIO_GENERAL
    const ingresoVip = totalVip * FINANCIAL.PRECIO_VIP
    const ingresoTotal = ingresoGen + ingresoVip + totalConsumo

    if (loading) return <div className="loading-spinner">Cargando datos...</div>

    return (
        <div>
            <div className="page-header">
                <h2>Control de Boletos</h2>
                <p>Registro y seguimiento de venta de boletos</p>
            </div>

            <div className="kpi-grid">
                <div className="kpi-card orange">
                    <div className="kpi-label">Generales vendidos</div>
                    <div className="kpi-value">{totalGen}</div>
                    <div className="kpi-sub">{formatMoney(ingresoGen)} ({formatMoney(FINANCIAL.PRECIO_GENERAL)}/boleto)</div>
                </div>
                <div className="kpi-card purple">
                    <div className="kpi-label">VIP vendidos</div>
                    <div className="kpi-value">{totalVip}</div>
                    <div className="kpi-sub">{formatMoney(ingresoVip)} ({formatMoney(FINANCIAL.PRECIO_VIP)}/boleto)</div>
                </div>
                <div className="kpi-card blue">
                    <div className="kpi-label">Consumo estimado</div>
                    <div className="kpi-value money">{formatMoney(totalConsumo)}</div>
                </div>
                <div className="kpi-card green">
                    <div className="kpi-label">Ingreso total boletos</div>
                    <div className="kpi-value money">{formatMoney(ingresoTotal)}</div>
                </div>
            </div>

            <div className="toolbar">
                <div></div>
                <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ fecha: new Date().toISOString().split('T')[0], generales_vendidos: 0, vip_vendidos: 0, consumo_estimado: 0 }); }}>
                    {showForm ? 'Cancelar' : 'Registrar Venta'}
                </button>
            </div>

            {showForm && (
                <div className="card" style={{ maxWidth: '800px', margin: '0 auto 40px auto' }}>
                    <form onSubmit={handleSubmit}>
                        <div className="form-section-title">
                            <Icons.Ticket width={18} height={18} /> Registro de Venta Diaria
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Fecha del Reporte</label>
                                <div style={{ position: 'relative' }}>
                                    <input className="form-input" name="fecha" type="date" value={form.fecha} onChange={handleChange} required />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Boletos Generales ({formatMoney(FINANCIAL.PRECIO_GENERAL)})</label>
                                <input className="form-input" name="generales_vendidos" type="number" value={form.generales_vendidos} onChange={handleChange} min="0" placeholder="0" />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Boletos VIP ({formatMoney(FINANCIAL.PRECIO_VIP)})</label>
                                <input className="form-input" name="vip_vendidos" type="number" value={form.vip_vendidos} onChange={handleChange} min="0" placeholder="0" />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Consumo Estimado (MXN)</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }}>$</span>
                                    <input className="form-input" style={{ paddingLeft: '28px' }} name="consumo_estimado" type="number" step="0.01" value={form.consumo_estimado} onChange={handleChange} min="0" placeholder="0.00" />
                                </div>
                            </div>
                        </div>

                        <div className="form-actions" style={{ marginTop: '32px', display: 'flex', gap: '16px', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
                            <button type="button" className="btn" style={{ color: '#64748b' }} onClick={() => { setShowForm(false); setEditId(null); }}>
                                Cancelar
                            </button>
                            <button type="submit" className="btn btn-primary">
                                {editId ? 'Actualizar Registro' : 'Registrar Venta'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Generales</th>
                                <th>VIP</th>
                                <th>Ingreso Generales</th>
                                <th>Ingreso VIP</th>
                                <th>Consumo</th>
                                <th>Ingreso Total</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tickets.length === 0 ? (
                                <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Sin registros</td></tr>
                            ) : tickets.map(t => {
                                const ig = t.generales_vendidos * FINANCIAL.PRECIO_GENERAL
                                const iv = t.vip_vendidos * FINANCIAL.PRECIO_VIP
                                return (
                                    <tr key={t.id}>
                                        <td data-label="Fecha" style={{ fontWeight: 600 }}>{formatDate(t.fecha)}</td>
                                        <td data-label="Generales">{t.generales_vendidos}</td>
                                        <td data-label="VIP">{t.vip_vendidos}</td>
                                        <td data-label="Ingreso Gral." className="money">{formatMoney(ig)}</td>
                                        <td data-label="Ingreso VIP" className="money">{formatMoney(iv)}</td>
                                        <td data-label="Consumo" className="money">{formatMoney(t.consumo_estimado)}</td>
                                        <td data-label="TOTAL" className="money" style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatMoney(ig + iv + Number(t.consumo_estimado))}</td>
                                        <td data-label="Acciones">
                                            <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                                                <button onClick={() => startEdit(t)} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>Editar</button>
                                                <button onClick={() => handleDelete(t.id)} className="btn btn-danger btn-sm" style={{ flex: 1 }}>Eliminar</button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
