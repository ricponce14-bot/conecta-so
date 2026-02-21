/**
 * CONECTA 2026 — Analytics Engine
 * Advanced math & statistics for strategic recommendations
 */

import { FINANCIAL } from './utils'

// ─── Constants ─────────────────────────────────────────
const EVENT_START = new Date('2026-01-15')   // approximate campaign start
const EVENT_DATE = new Date('2026-04-18')
const TOTAL_DAYS = Math.ceil((EVENT_DATE - EVENT_START) / 86400000)

// Pipeline stage → close probability (P(win|stage))
const STAGE_PROBABILITY = {
    'Prospecto Nuevo': 0.05,
    'Contactado': 0.15,
    'Cita Agendada': 0.30,
    'Negociación': 0.65,
    'Cerrado Pagado': 1.00,
    'Perdido': 0.00,
}

// ─── Core helpers ──────────────────────────────────────
export function daysElapsed() {
    return Math.max(1, Math.ceil((new Date() - EVENT_START) / 86400000))
}

export function daysRemaining() {
    return Math.max(0, Math.ceil((EVENT_DATE - new Date()) / 86400000))
}

/**
 * Expected pipeline value (EPV)
 * = Σ deal_value × P(close | stage)  for all OPEN deals
 */
export function expectedPipelineValue(expoLeads, sponsorLeads) {
    const open = [
        ...expoLeads.map(l => ({ value: Number(l.precio_stand || 0), estado: l.estado })),
        ...sponsorLeads.map(l => ({ value: Number(l.valor_total || 0), estado: l.estado })),
    ].filter(l => l.estado !== 'Cerrado Pagado' && l.estado !== 'Perdido')

    return open.reduce((s, l) => s + l.value * (STAGE_PROBABILITY[l.estado] || 0), 0)
}

/**
 * Revenue velocity ($ / day based on confirmed revenue so far)
 */
export function revenueVelocity(confirmedRevenue) {
    return confirmedRevenue / daysElapsed()
}

/**
 * Projected total revenue assuming current velocity holds
 */
export function projectedRevenue(confirmedRevenue) {
    return revenueVelocity(confirmedRevenue) * TOTAL_DAYS
}

/**
 * Days needed to close the revenue gap at current velocity
 */
export function daysToGoal(confirmedRevenue) {
    const velocity = revenueVelocity(confirmedRevenue)
    if (velocity <= 0) return Infinity
    const gap = FINANCIAL.META_INGRESOS - confirmedRevenue
    return Math.ceil(gap / velocity)
}

/**
 * Break-even probability score [0..1]
 * Combines confirmed + expected pipeline vs. fixed costs
 */
export function breakEvenProbability(confirmedRevenue, expoLeads, sponsorLeads) {
    const epv = expectedPipelineValue(expoLeads, sponsorLeads)
    const best = confirmedRevenue + epv
    const needed = FINANCIAL.COSTOS_FIJOS

    if (confirmedRevenue >= needed) return 1.0
    if (best <= 0) return 0.0

    // Logistic-inspired score
    const ratio = best / needed
    return Math.min(1, Math.max(0, ratio * 0.85))  // cap at 0.85 if not yet confirmed
}

/**
 * Pipeline health: stage distribution
 * Returns % of pipeline value in each stage
 */
export function pipelineDistribution(expoLeads, sponsorLeads) {
    const buckets = {}
    Object.keys(STAGE_PROBABILITY).forEach(s => { buckets[s] = 0 })

        ;[...expoLeads, ...sponsorLeads].forEach(l => {
            const val = Number(l.precio_stand || l.valor_total || 0)
            if (buckets[l.estado] !== undefined) buckets[l.estado] += val
        })

    const total = Object.values(buckets).reduce((a, b) => a + b, 0) || 1
    return Object.entries(buckets).map(([estado, value]) => ({
        estado,
        value,
        pct: value / total,
        probability: STAGE_PROBABILITY[estado],
    }))
}

/**
 * Seller performance Z-scores
 * Z = (seller_revenue - μ) / σ
 */
export function sellerZScores(vendedores) {
    const revenues = vendedores.map(v => v.totalRevenue)
    if (revenues.length < 2) return vendedores.map(v => ({ ...v, zScore: 0, percentile: 50 }))

    const mean = revenues.reduce((a, b) => a + b, 0) / revenues.length
    const variance = revenues.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / revenues.length
    const std = Math.sqrt(variance) || 1

    return vendedores.map((v, i) => {
        const z = (v.totalRevenue - mean) / std
        // Approximate percentile from z-score (Abramowitz & Stegun)
        const percentile = zToPercentile(z)
        return { ...v, zScore: z, percentile, mean, std }
    })
}

/** Approximate cumulative normal distribution */
function zToPercentile(z) {
    const t = 1 / (1 + 0.2316419 * Math.abs(z))
    const poly = t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))))
    const pdf = Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI)
    const cdf = 1 - pdf * poly
    return Math.round((z >= 0 ? cdf : 1 - cdf) * 100)
}

/**
 * Conversion bottleneck detector
 * Where is pipeline VALUE stalling (high value, low probability)?
 */
export function conversionBottleneck(expoLeads, sponsorLeads) {
    const dist = pipelineDistribution(expoLeads, sponsorLeads)
    // Bottleneck score = high % in stage, low probability of close
    return dist
        .filter(d => d.estado !== 'Cerrado Pagado' && d.estado !== 'Perdido')
        .map(d => ({ ...d, bottleneckScore: d.pct * (1 - d.probability) }))
        .sort((a, b) => b.bottleneckScore - a.bottleneckScore)
}

/**
 * Required daily revenue to hit META from today
 */
export function requiredDailyVelocity(confirmedRevenue) {
    const gap = FINANCIAL.META_INGRESOS - confirmedRevenue
    const rem = daysRemaining()
    return rem > 0 ? gap / rem : Infinity
}

/**
 * Zone opportunity index
 * = unclosed pipeline value / total closed (higher = more untapped potential)
 */
export function zoneOpportunityIndex(expoLeads, sponsorLeads, zonas) {
    return zonas.map(zona => {
        const expoInZone = expoLeads.filter(l => l.zona === zona)
        const sponsorInZone = sponsorLeads.filter(l => l.zona === zona)
        const all = [...expoInZone, ...sponsorInZone]

        const closed = all.filter(l => l.estado === 'Cerrado Pagado')
            .reduce((s, l) => s + Number(l.precio_stand || l.valor_total || 0), 0)
        const pipeline = all.filter(l => l.estado !== 'Cerrado Pagado' && l.estado !== 'Perdido')
            .reduce((s, l) => s + Number(l.precio_stand || l.valor_total || 0) * (STAGE_PROBABILITY[l.estado] || 0), 0)

        const total = all.length
        const closedCount = closed > 0 ? all.filter(l => l.estado === 'Cerrado Pagado').length : 0
        const convRate = total > 0 ? closedCount / total : 0
        const opportunityIndex = pipeline / (closed + 1) // avoid div by 0

        return { zona, closed, pipeline, total, convRate, opportunityIndex }
    }).sort((a, b) => b.opportunityIndex - a.opportunityIndex)
}

/**
 * Main: generate strategic recommendations
 * Returns array of { priority, type, title, body, metric }
 */
export function generateRecommendations({
    confirmedRevenue, expoLeads, sponsorLeads, vendedores,
}) {
    const recs = []
    const rem = daysRemaining()
    const velocity = revenueVelocity(confirmedRevenue)
    const reqVelocity = requiredDailyVelocity(confirmedRevenue)
    const gap = FINANCIAL.META_INGRESOS - confirmedRevenue
    const projected = projectedRevenue(confirmedRevenue)
    const epv = expectedPipelineValue(expoLeads, sponsorLeads)
    const bep = breakEvenProbability(confirmedRevenue, expoLeads, sponsorLeads)
    const bottlenecks = conversionBottleneck(expoLeads, sponsorLeads)
    const zScores = sellerZScores(vendedores)

    const ZONAS = ['Arandas / San Ignacio', 'Lagos de Moreno / San Juan', 'Jalostotitlán / San Miguel', 'Tepatitlán']
    const zoneOpp = zoneOpportunityIndex(expoLeads, sponsorLeads, ZONAS)

    const fmt = (n) => `$${Math.round(n).toLocaleString('es-MX')}`
    const pct = (n) => `${(n * 100).toFixed(1)}%`

    // ── 1. Velocity vs. Required ──────────────────────
    if (velocity < reqVelocity * 0.5) {
        recs.push({
            priority: 'CRÍTICO', color: '#ef4444',
            title: '⚠️ Velocidad de ventas insuficiente',
            body: `Generas ${fmt(velocity)}/día pero necesitas ${fmt(reqVelocity)}/día para alcanzar la meta. El ritmo actual solo llegaría a ${fmt(projected)} al cierre del evento.`,
            action: `Intensifica contactos en etapa "Negociación" — son los deals de mayor probabilidad. Necesitas cerrar ${fmt(gap)} en ${rem} días.`,
            metric: `${pct(velocity / reqVelocity)} de la velocidad requerida`,
        })
    } else if (velocity < reqVelocity) {
        recs.push({
            priority: 'ALERTA', color: '#f59e0b',
            title: '📈 Velocidad por debajo de la meta',
            body: `Velocidad actual ${fmt(velocity)}/día vs. necesaria ${fmt(reqVelocity)}/día. Con el pipeline esperado (${fmt(epv)} adicionales) podrías llegar al ${pct((confirmedRevenue + epv) / FINANCIAL.META_INGRESOS)} de la meta.`,
            action: `Prioriza los ${bottlenecks[0]?.estado || 'leads en Negociación'} — mayor concentración de valor atascado.`,
            metric: `Proyección: ${fmt(projected)}`,
        })
    } else {
        recs.push({
            priority: 'BUENO', color: '#10b981',
            title: '✅ Ritmo de ventas en carretera',
            body: `Velocidad ${fmt(velocity)}/día supera el mínimo requerido de ${fmt(reqVelocity)}/día. Proyección al cierre: ${fmt(projected)}.`,
            action: 'Mantén el ritmo. Considera convertir leads Contactados a Cita Agendada para engrosar el pipeline.',
            metric: `${pct(velocity / reqVelocity)} sobre la velocidad necesaria`,
        })
    }

    // ── 2. Break-even probability ──────────────────────
    if (bep < 0.40) {
        recs.push({
            priority: 'CRÍTICO', color: '#ef4444',
            title: '🔴 Riesgo alto de no cubrir punto de equilibrio',
            body: `Probabilidad estimada de break-even: ${pct(bep)}. El pipeline esperado (${fmt(confirmedRevenue + epv)}) no cubre los costos fijos de ${fmt(FINANCIAL.COSTOS_FIJOS)}.`,
            action: `Se requieren ${fmt(FINANCIAL.COSTOS_FIJOS - confirmedRevenue)} adicionales confirmados. Activa urgentemente seguimiento en zonas con pipeline alto (ver índice de oportunidad).`,
            metric: `Gap: ${fmt(FINANCIAL.COSTOS_FIJOS - confirmedRevenue)}`,
        })
    } else if (bep < 0.70) {
        recs.push({
            priority: 'ALERTA', color: '#f59e0b',
            title: '🟡 Break-even posible pero requiere acción',
            body: `Probabilidad de cubrir costos fijos: ${pct(bep)}. Con pipeline actual tienes ${fmt(confirmedRevenue + epv)} de ${fmt(FINANCIAL.COSTOS_FIJOS)} necesarios.`,
            action: 'Convierte al menos 2 deals de Negociación a Cerrado Pagado para superar break-even.',
            metric: `EPV: ${fmt(epv)}`,
        })
    } else {
        recs.push({
            priority: 'BUENO', color: '#10b981',
            title: '🟢 Break-even altamente probable',
            body: `Con ${fmt(confirmedRevenue)} confirmados y ${fmt(epv)} esperados del pipeline, el punto de equilibrio (${fmt(FINANCIAL.COSTOS_FIJOS)}) está cubierto con ${pct(bep)} de probabilidad.`,
            action: 'Enfócate en maximizar utilidad: cierra deals de Pabellon Municipal y Regional Plus Stand.',
            metric: `Superávit esperado: ${fmt(confirmedRevenue + epv - FINANCIAL.COSTOS_FIJOS)}`,
        })
    }

    // ── 3. Pipeline bottleneck ──────────────────────────
    if (bottlenecks.length > 0 && bottlenecks[0].value > 0) {
        const top = bottlenecks[0]
        recs.push({
            priority: 'TÁCTICA', color: '#6366f1',
            title: `🔀 Cuello de botella: "${top.estado}"`,
            body: `${pct(top.pct)} del valor del pipeline (${top.probability * 100}% prob. de cierre) está atascado en "${top.estado}". Cada deal en esta etapa pierde ${pct(1 - top.probability)} de su valor potencial.`,
            action: `Programa revisiones 1:1 con vendedores que tengan deals en "${top.estado}". Una mejora del 10% en tasa de avance generaría ~${fmt(top.value * 0.10 * top.probability)} adicionales.`,
            metric: `Valor atascado: ${fmt(top.value)}`,
        })
    }

    // ── 4. Underperforming sellers (Z-score) ───────────
    const underperformers = zScores.filter(v => v.zScore < -0.5 && v.totalAssigned > 0)
    if (underperformers.length > 0) {
        const names = underperformers.map(v => v.name).join(', ')
        recs.push({
            priority: 'EQUIPO', color: '#8b5cf6',
            title: `👤 Vendedores bajo la media: ${names}`,
            body: `Z-score ${underperformers.map(v => `${v.name}=${v.zScore.toFixed(2)}`).join(', ')}. Percentil de desempeño: ${underperformers.map(v => `${v.name}=${v.percentile}%`).join(', ')}.`,
            action: 'Asigna mentoring directo o reasigna prospectos de zonas con alto índice de oportunidad hacia estos vendedores. Considera coaching en cierre.',
            metric: `Media del equipo: ${fmt(zScores[0]?.mean || 0)}`,
        })
    }

    // ── 5. Zone opportunity ────────────────────────────
    if (zoneOpp.length > 0 && zoneOpp[0].pipeline > 0) {
        const topZone = zoneOpp[0]
        recs.push({
            priority: 'ZONA', color: '#0ea5e9',
            title: `📍 Zona con mayor potencial: "${topZone.zona}"`,
            body: `Índice de oportunidad ${topZone.opportunityIndex.toFixed(2)}. Tiene ${fmt(topZone.pipeline)} en pipeline esperado vs. ${fmt(topZone.closed)} confirmado. Tasa de conversión actual: ${pct(topZone.convRate)}.`,
            action: `Refuerza la cobertura en "${topZone.zona}". Asigna vendedores con mejor Z-score a esta zona para maximizar conversión.`,
            metric: `${topZone.total} prospectos activos`,
        })
    }

    // ── 6. Days remaining urgency ─────────────────────
    if (rem <= 30) {
        recs.push({
            priority: 'URGENTE', color: '#dc2626',
            title: `⏱️ ${rem} días para el evento — Fase de cierre`,
            body: `En la etapa final, la probabilidad de convertir nuevos leads cae dramáticamente. Concentra el 100% del esfuerzo en deals ya avanzados (Negociación y Cita Agendada).`,
            action: `No abras nuevos prospectos. Cierra los ${[...expoLeads, ...sponsorLeads].filter(l => l.estado === 'Negociación').length} deals en Negociación. Cada día perdido = ${fmt(reqVelocity)} de ingreso no generado.`,
            metric: `${rem} días restantes`,
        })
    } else if (rem <= 60) {
        recs.push({
            priority: 'TIEMPO', color: '#f59e0b',
            title: `📅 ${rem} días restantes — Acelerar pipeline`,
            body: `Estás en la fase crítica de ventas. Los leads en etapa temprana tienen baja probabilidad de cerrar antes del evento.`,
            action: `Prioriza "Cita Agendada" y "Negociación". Cualquier lead en "Prospecto Nuevo" necesita avanzar en los próximos 7 días o marcar como Perdido para mantener el pipeline limpio.`,
            metric: `${rem} días`,
        })
    }

    // Sort: CRÍTICO > URGENTE > ALERTA > TÁCTICA > ZONA > EQUIPO > BUENO
    const ORDER = { 'CRÍTICO': 0, 'URGENTE': 1, 'ALERTA': 2, 'TÁCTICA': 3, 'ZONA': 4, 'EQUIPO': 5, 'TIEMPO': 6, 'BUENO': 7 }
    recs.sort((a, b) => (ORDER[a.priority] ?? 9) - (ORDER[b.priority] ?? 9))

    return recs
}
