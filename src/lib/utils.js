// Format number as Mexican Pesos
export function formatMoney(amount) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount || 0)
}

export function formatNumber(num) {
    return new Intl.NumberFormat('es-MX').format(num || 0)
}

export function formatDate(dateStr) {
    if (!dateStr) return '—'
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

export function getDaysRemaining() {
    const eventDate = new Date('2026-04-18')
    const now = new Date()
    const diff = eventDate - now
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export const FINANCIAL = {
    PRECIO_GENERAL: 300,
    PRECIO_VIP: 700,
    COSTO_BASE: 525100,
    META_INGRESOS: 676000,
    META_UTILIDAD: 140000,
    COMISION_EXPO: 0.12,
    COMISION_SPONSOR: 0.15,
    EVENT_DATE: '2026-04-18',
}

export function getSmartAlerts(progress, daysRemaining) {
    const alerts = []
    const progressPercent = progress * 100

    if (progress >= 1) {
        alerts.push({ type: 'success', message: 'Punto de equilibrio alcanzado. El evento es rentable.' })
    }

    if (daysRemaining < 30 && progressPercent < 60) {
        alerts.push({ type: 'danger', message: `ALERTA CRITICA: Faltan ${daysRemaining} dias y el avance es ${progressPercent.toFixed(0)}%. Se requiere accion inmediata.` })
    } else if (daysRemaining < 60 && progressPercent < 30) {
        alerts.push({ type: 'warning', message: `ALERTA: Faltan ${daysRemaining} dias y el avance es ${progressPercent.toFixed(0)}%. Acelerar esfuerzos comerciales.` })
    }

    return alerts
}
