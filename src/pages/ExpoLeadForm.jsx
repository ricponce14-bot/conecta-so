import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Icons } from '../components/Icons'

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

    useEffect(() => { loadData() }, [id])

    async function loadData() {
        setLoading(true)
        const vendRes = await supabase.from('profiles').select('id, name').eq('role', 'VENDEDOR')
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

    const anticipoReq = (Number(form.precio_stand) || 0) * 0.5

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
        delete payload.id
        delete payload.created_at
        delete payload.anticipo_requerido

        if (isNew) {
            await supabase.from('expo_leads').insert(payload)
        } else {
            await supabase.from('expo_leads').update(payload).eq('id', id)
        }
        setSaving(false)
        navigate('/expo')
    }

    if (loading) return <div className="loading-spinner">Cargando...</div>

    return (
        <div>
            <div className="page-header">
                <h2>{isNew ? 'Nuevo Lead Expo' : 'Editar Lead Expo'}</h2>
                <p>{isNew ? 'Registrar nuevo prospecto de stand' : `Editando: ${form.empresa}`}</p>
            </div>

            <div className="card" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <form onSubmit={handleSubmit}>

                    {/* Sección 1: Información de Contacto */}
                    <div className="form-section-title">
                        <Icons.Briefcase width={18} height={18} /> Información del Cliente
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Empresa / Razón Social</label>
                            <input className="form-input" name="empresa" value={form.empresa} onChange={handleChange} required placeholder="Ej. Tech Solutions S.A." />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Nombre de Contacto</label>
                            <input className="form-input" name="contacto_nombre" value={form.contacto_nombre} onChange={handleChange} required placeholder="Ej. Juan Pérez" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Teléfono</label>
                            <input className="form-input" name="telefono" value={form.telefono} onChange={handleChange} placeholder="+52..." />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Correo Electrónico</label>
                            <input className="form-input" name="email" type="email" value={form.email} onChange={handleChange} placeholder="correo@empresa.com" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Ciudad</label>
                            <input className="form-input" name="ciudad" value={form.ciudad} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Giro / Industria</label>
                            <input className="form-input" name="giro" value={form.giro} onChange={handleChange} />
                        </div>
                    </div>

                    {/* Sección 2: Detalles del Negocio */}
                    <div className="form-section-title" style={{ marginTop: '32px' }}>
                        <Icons.DollarSign width={18} height={18} /> Negociación
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Estado del Lead</label>
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
                            {!isAdmin && <small style={{ color: 'var(--text-muted)' }}>Asignado automáticamente</small>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Precio Stand (MXN)</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }}>$</span>
                                <input className="form-input" style={{ paddingLeft: '28px' }} name="precio_stand" type="number" step="0.01" value={form.precio_stand} onChange={handleChange} placeholder="0.00" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Monto Pagado (MXN)</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--success)' }}>$</span>
                                <input className="form-input" style={{ paddingLeft: '28px', color: 'var(--success)', fontWeight: 600 }} name="monto_pagado" type="number" step="0.01" value={form.monto_pagado} onChange={handleChange} placeholder="0.00" />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Anticipo Requerido (50%)</label>
                            <input className="form-input" type="text" value={`$${anticipoReq.toLocaleString('es-MX')}`} disabled style={{ background: '#f1f5f9', color: '#64748b' }} />
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
                            <label className="form-label">Último Contacto</label>
                            <input className="form-input" name="fecha_ultimo_contacto" type="date" value={form.fecha_ultimo_contacto} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Próxima Acción / Cierre</label>
                            <input className="form-input" name="fecha_proxima_accion" type="date" value={form.fecha_proxima_accion} onChange={handleChange} />
                        </div>
                        <div className="form-group full-width" style={{ gridColumn: '1/-1' }}>
                            <label className="form-label">Notas y Observaciones</label>
                            <textarea className="form-textarea" name="notas" value={form.notas} onChange={handleChange} placeholder="Escribe aquí los detalles importantes de la negociación..." />
                        </div>
                    </div>

                    <div className="form-actions" style={{ marginTop: '32px', display: 'flex', gap: '16px', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
                        <button type="button" className="btn" style={{ color: '#64748b' }} onClick={() => navigate('/expo')}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? <><span className="loading-spinner small"></span> Guardando...</> : (isNew ? 'Registrar Lead' : 'Guardar Cambios')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
