import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Icons } from '../components/Icons'

const ESTADOS = ['PROSPECTO', 'NEGOCIACION', 'CERRADO', 'PERDIDO']
const NIVELES = ['ORO', 'PLATA', 'ALIADO']

const emptySponsor = {
    empresa: '', contacto: '', nivel: 'ALIADO', valor_total: '',
    vendedor_id: '', estado: 'PROSPECTO', monto_pagado: 0,
    anticipo_pagado: false, fecha_seguimiento: '', notas: '',
}

export default function SponsorLeadForm() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user, isAdmin } = useAuth()
    const [form, setForm] = useState(emptySponsor)
    const [vendedores, setVendedores] = useState([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const isNew = !id || id === 'new'

    useEffect(() => { loadData() }, [id])

    async function loadData() {
        setLoading(true)
        const vendRes = await supabase.from('profiles').select('id, name').eq('role', 'VENDEDOR')
        setVendedores(vendRes.data || [])

        if (!isNew) {
            const { data } = await supabase.from('sponsor_leads').select('*').eq('id', id).single()
            if (data) setForm({
                ...data,
                valor_total: data.valor_total || '',
                monto_pagado: data.monto_pagado || 0,
                fecha_seguimiento: data.fecha_seguimiento || '',
                notas: data.notas || '',
            })
        } else {
            setForm({ ...emptySponsor, vendedor_id: isAdmin ? '' : user.id })
        }
        setLoading(false)
    }

    function handleChange(e) {
        const { name, value, type, checked } = e.target
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setSaving(true)
        const payload = {
            ...form,
            valor_total: Number(form.valor_total) || 0,
            monto_pagado: Number(form.monto_pagado) || 0,
            vendedor_id: form.vendedor_id || null,
            fecha_seguimiento: form.fecha_seguimiento || null,
        }
        delete payload.id
        delete payload.created_at

        if (isNew) {
            await supabase.from('sponsor_leads').insert(payload)
        } else {
            await supabase.from('sponsor_leads').update(payload).eq('id', id)
        }
        setSaving(false)
        navigate('/sponsors')
    }

    if (loading) return <div className="loading-spinner">Cargando...</div>

    return (
        <div>
            <div className="page-header">
                <h2>{isNew ? 'Nuevo Patrocinio' : 'Editar Patrocinio'}</h2>
                <p>{isNew ? 'Registrar nuevo prospecto de patrocinio' : `Editando: ${form.empresa}`}</p>
            </div>

            <div className="card" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <form onSubmit={handleSubmit}>

                    {/* Sección 1: Información de Contacto */}
                    <div className="form-section-title">
                        <Icons.Briefcase width={18} height={18} /> Información del Patrocinador
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Empresa / Patrocinador</label>
                            <input className="form-input" name="empresa" value={form.empresa} onChange={handleChange} required placeholder="Ej. Coca-Cola" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Contacto Clave</label>
                            <input className="form-input" name="contacto" value={form.contacto} onChange={handleChange} required placeholder="Ej. Director de Marketing" />
                        </div>
                    </div>

                    {/* Sección 2: Detalles del Negocio */}
                    <div className="form-section-title" style={{ marginTop: '32px' }}>
                        <Icons.DollarSign width={18} height={18} /> Acuerdo Comercial
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Nivel de Patrocinio</label>
                            <select name="nivel" value={form.nivel} onChange={handleChange} className="modern-select" style={{ width: '100%' }}>
                                {NIVELES.map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Estado</label>
                            <select name="estado" value={form.estado} onChange={handleChange} className="modern-select" style={{ width: '100%' }}>
                                {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Vendedor Asignado</label>
                            <select name="vendedor_id" value={form.vendedor_id} onChange={handleChange} disabled={!isAdmin} className="modern-select" style={{ width: '100%' }}>
                                <option value="">Seleccionar Vendedor...</option>
                                {vendedores.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Valor Total (MXN)</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }}>$</span>
                                <input className="form-input" style={{ paddingLeft: '28px' }} name="valor_total" type="number" step="0.01" value={form.valor_total} onChange={handleChange} placeholder="0.00" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Monto Pagado (MXN)</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--success)' }}>$</span>
                                <input className="form-input" style={{ paddingLeft: '28px', color: 'var(--success)', fontWeight: 600 }} name="monto_pagado" type="number" step="0.01" value={form.monto_pagado} onChange={handleChange} placeholder="0.00" />
                            </div>
                        </div>

                        <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <label className="form-checkbox-wrapper" style={{ width: '100%' }}>
                                <input className="checkbox-custom" name="anticipo_pagado" type="checkbox" checked={form.anticipo_pagado} onChange={handleChange} />
                                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Anticipo cubierto</span>
                            </label>
                        </div>
                    </div>

                    {/* Sección 3: Seguimiento */}
                    <div className="form-section-title" style={{ marginTop: '32px' }}>
                        <Icons.Calendar width={18} height={18} /> Seguimiento
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Fecha de Seguimiento</label>
                            <input className="form-input" name="fecha_seguimiento" type="date" value={form.fecha_seguimiento} onChange={handleChange} />
                        </div>

                        <div className="form-group full-width" style={{ gridColumn: '1/-1' }}>
                            <label className="form-label">Notas y Observaciones</label>
                            <textarea className="form-textarea" name="notas" value={form.notas} onChange={handleChange} placeholder="Detalles sobre beneficios, stands o acuerdos especiales..." />
                        </div>
                    </div>

                    <div className="form-actions" style={{ marginTop: '32px', display: 'flex', gap: '16px', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
                        <button type="button" className="btn" style={{ color: '#64748b' }} onClick={() => navigate('/sponsors')}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? <><span className="loading-spinner small"></span> Guardando...</> : (isNew ? 'Registrar Patrocinio' : 'Guardar Cambios')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
