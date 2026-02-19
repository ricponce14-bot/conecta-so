import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

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
        const vendRes = await supabase.from('profiles').select('id, name')
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
                <h2>{isNew ? '➕ Nuevo Patrocinio' : '✏️ Editar Patrocinio'}</h2>
                <p>{isNew ? 'Registrar nuevo prospecto de patrocinio' : `Editando: ${form.empresa}`}</p>
            </div>

            <div className="card">
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Empresa *</label>
                            <input name="empresa" value={form.empresa} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Contacto *</label>
                            <input name="contacto" value={form.contacto} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Nivel</label>
                            <select name="nivel" value={form.nivel} onChange={handleChange}>
                                {NIVELES.map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Estado</label>
                            <select name="estado" value={form.estado} onChange={handleChange}>
                                {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Valor Total (MXN)</label>
                            <input name="valor_total" type="number" step="0.01" value={form.valor_total} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Monto Pagado (MXN)</label>
                            <input name="monto_pagado" type="number" step="0.01" value={form.monto_pagado} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Vendedor</label>
                            <select name="vendedor_id" value={form.vendedor_id} onChange={handleChange} disabled={!isAdmin}>
                                <option value="">Sin asignar</option>
                                {vendedores.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px', paddingTop: '24px' }}>
                            <input name="anticipo_pagado" type="checkbox" checked={form.anticipo_pagado} onChange={handleChange} />
                            <label style={{ textTransform: 'none', margin: 0 }}>Anticipo pagado</label>
                        </div>
                        <div className="form-group">
                            <label>Fecha de Seguimiento</label>
                            <input name="fecha_seguimiento" type="date" value={form.fecha_seguimiento} onChange={handleChange} />
                        </div>
                        <div className="form-group full-width">
                            <label>Notas</label>
                            <textarea name="notas" value={form.notas} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Guardando...' : (isNew ? 'Crear Patrocinio' : 'Guardar Cambios')}
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={() => navigate('/sponsors')}>
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
