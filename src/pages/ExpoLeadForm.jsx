import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const ESTADOS = ['LEAD', 'CONTACTADO', 'PROPUESTA', 'NEGOCIACION', 'CERRADO', 'PERDIDO']

const emptyLead = {
    empresa: '', contacto_nombre: '', telefono: '', email: '', ciudad: '', giro: '',
    vendedor_id: '', estado: 'LEAD', precio_stand: '', monto_pagado: 0,
    anticipo_pagado: false, fecha_ultimo_contacto: '', fecha_proxima_accion: '', notas: '',
}

export default function ExpoLeadForm() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user, isAdmin } = useAuth()
    const [form, setForm] = useState(emptyLead)
    const [vendedores, setVendedores] = useState([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const isNew = !id || id === 'new'

    useEffect(() => {
        loadData()
    }, [id])

    async function loadData() {
        setLoading(true)
        const vendRes = await supabase.from('profiles').select('id, name')
        setVendedores(vendRes.data || [])

        if (!isNew) {
            const { data } = await supabase.from('expo_leads').select('*').eq('id', id).single()
            if (data) setForm({
                ...data,
                precio_stand: data.precio_stand || '',
                monto_pagado: data.monto_pagado || 0,
                fecha_ultimo_contacto: data.fecha_ultimo_contacto || '',
                fecha_proxima_accion: data.fecha_proxima_accion || '',
                notas: data.notas || '',
            })
        } else {
            setForm({ ...emptyLead, vendedor_id: isAdmin ? '' : user.id })
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
            precio_stand: Number(form.precio_stand) || 0,
            monto_pagado: Number(form.monto_pagado) || 0,
            vendedor_id: form.vendedor_id || null,
            fecha_ultimo_contacto: form.fecha_ultimo_contacto || null,
            fecha_proxima_accion: form.fecha_proxima_accion || null,
        }
        delete payload.anticipo_requerido // computed column
        delete payload.id
        delete payload.created_at

        if (isNew) {
            await supabase.from('expo_leads').insert(payload)
        } else {
            await supabase.from('expo_leads').update(payload).eq('id', id)
        }

        setSaving(false)
        navigate('/expo')
    }

    if (loading) return <div className="loading-spinner">Cargando...</div>

    const anticipoCalc = (Number(form.precio_stand) || 0) * 0.5

    return (
        <div>
            <div className="page-header">
                <h2>{isNew ? '➕ Nuevo Lead Expo' : '✏️ Editar Lead Expo'}</h2>
                <p>{isNew ? 'Registrar nuevo exhibidor potencial' : `Editando: ${form.empresa}`}</p>
            </div>

            <div className="card">
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Empresa *</label>
                            <input name="empresa" value={form.empresa} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Nombre de Contacto *</label>
                            <input name="contacto_nombre" value={form.contacto_nombre} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Teléfono</label>
                            <input name="telefono" value={form.telefono} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input name="email" type="email" value={form.email} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Ciudad</label>
                            <input name="ciudad" value={form.ciudad} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Giro</label>
                            <input name="giro" value={form.giro} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Estado</label>
                            <select name="estado" value={form.estado} onChange={handleChange}>
                                {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Vendedor</label>
                            <select name="vendedor_id" value={form.vendedor_id} onChange={handleChange} disabled={!isAdmin}>
                                <option value="">Sin asignar</option>
                                {vendedores.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Precio Stand (MXN)</label>
                            <input name="precio_stand" type="number" step="0.01" value={form.precio_stand} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Anticipo Requerido (50%)</label>
                            <input value={`$${anticipoCalc.toLocaleString('es-MX')}`} disabled />
                        </div>
                        <div className="form-group">
                            <label>Monto Pagado (MXN)</label>
                            <input name="monto_pagado" type="number" step="0.01" value={form.monto_pagado} onChange={handleChange} />
                        </div>
                        <div className="form-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px', paddingTop: '24px' }}>
                            <input name="anticipo_pagado" type="checkbox" checked={form.anticipo_pagado} onChange={handleChange} />
                            <label style={{ textTransform: 'none', margin: 0 }}>Anticipo pagado</label>
                        </div>
                        <div className="form-group">
                            <label>Fecha último contacto</label>
                            <input name="fecha_ultimo_contacto" type="date" value={form.fecha_ultimo_contacto} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Fecha próxima acción</label>
                            <input name="fecha_proxima_accion" type="date" value={form.fecha_proxima_accion} onChange={handleChange} />
                        </div>
                        <div className="form-group full-width">
                            <label>Notas</label>
                            <textarea name="notas" value={form.notas} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Guardando...' : (isNew ? 'Crear Lead' : 'Guardar Cambios')}
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={() => navigate('/expo')}>
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
