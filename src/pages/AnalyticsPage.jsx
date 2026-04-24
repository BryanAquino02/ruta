// src/pages/AnalyticsPage.jsx
import { useMemo } from 'react'

// ─── helpers ────────────────────────────────────────────────
function getLast7Days() {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

function shortDate(iso) {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

// ─── sub-components ─────────────────────────────────────────

function KpiCard({ value, label, color = 'var(--blue)' }) {
  return (
    <div style={{
      flex: 1, minWidth: 0,
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r)',
      padding: '12px 10px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 4, lineHeight: 1.3 }}>{label}</div>
    </div>
  )
}

function BarChart({ data, color = 'var(--blue)' }) {
  const max = Math.max(...data.map(d => d.value), 1)
  const W = 280, H = 90, PAD = 24, barW = Math.floor((W - PAD * 2) / data.length) - 4

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + 20}`} style={{ overflow: 'visible' }}>
      {data.map((d, i) => {
        const barH = Math.max(2, ((d.value / max) * H))
        const x = PAD + i * ((W - PAD * 2) / data.length)
        const y = H - barH
        return (
          <g key={d.label}>
            <rect
              x={x} y={y} width={barW} height={barH}
              rx={3}
              fill={color}
              opacity={0.85}
            />
            {d.value > 0 && (
              <text
                x={x + barW / 2} y={y - 4}
                textAnchor="middle"
                fontSize={9}
                fill="var(--ink2)"
                fontWeight={600}
              >
                {d.value}
              </text>
            )}
            <text
              x={x + barW / 2} y={H + 14}
              textAnchor="middle"
              fontSize={9}
              fill="var(--ink3)"
            >
              {d.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function DonutChart({ done, pending }) {
  const total = done + pending
  if (total === 0) return (
    <div style={{ textAlign: 'center', color: 'var(--ink3)', fontSize: 12, padding: 20 }}>
      Sin datos aún
    </div>
  )
  const pct = Math.round((done / total) * 100)
  const r = 36, cx = 50, cy = 50, stroke = 10
  const circ = 2 * Math.PI * r
  const donePct = (done / total) * circ

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <svg width={100} height={100} viewBox="0 0 100 100">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke="var(--blue)" strokeWidth={stroke}
          strokeDasharray={`${donePct} ${circ}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
          fontSize={14} fontWeight={700} fill="var(--ink)">{pct}%</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--blue)', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'var(--ink2)' }}>{done} completado{done !== 1 ? 's' : ''}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--border)', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'var(--ink2)' }}>{pending} pendiente{pending !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  )
}

function HorizontalBars({ data }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {data.map(d => (
        <div key={d.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 11, color: 'var(--ink2)', fontWeight: 500,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>
              {d.label}
            </span>
            <span style={{ fontSize: 11, color: 'var(--blue)', fontWeight: 700 }}>{d.value}</span>
          </div>
          <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${(d.value / max) * 100}%`,
              background: 'var(--blue)',
              borderRadius: 3,
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function SectionCard({ title, children }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r)',
      padding: '14px 14px 16px',
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink3)',
        textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

// ─── main page ───────────────────────────────────────────────
export default function AnalyticsPage({ pedidos }) {
  const stats = useMemo(() => {
    const total     = pedidos.length
    const done      = pedidos.filter(p => p.done).length
    const pending   = total - done
    const urgentes  = pedidos.filter(p => p.prioridad === 'urgente').length
    const pctDone   = total > 0 ? Math.round((done / total) * 100) : 0

    const totalPasos     = pedidos.reduce((s, p) => s + (p.pasos?.length || 0), 0)
    const pasosCompletos = pedidos.reduce((s, p) => s + (p.pasos?.filter(s2 => s2.done).length || 0), 0)

    // Pedidos por día (últimos 7 días) — usando created_at
    const last7 = getLast7Days()
    const porDia = last7.map(day => ({
      label: shortDate(day),
      value: pedidos.filter(p => {
        const d = p.created_at ? p.created_at.split('T')[0] : p.fecha
        return d === day
      }).length,
    }))

    // Top clientes
    const clienteCount = {}
    pedidos.forEach(p => {
      clienteCount[p.cliente] = (clienteCount[p.cliente] || 0) + 1
    })
    const topClientes = Object.entries(clienteCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, value]) => ({ label, value }))

    return { total, done, pending, urgentes, pctDone, totalPasos, pasosCompletos, porDia, topClientes }
  }, [pedidos])

  return (
    <div className="page">
      <div style={{ padding: '16px 14px 80px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* título */}
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Analytics</div>

        {/* KPIs */}
        <div style={{ display: 'flex', gap: 8 }}>
          <KpiCard value={stats.total}    label="Total pedidos"  color="var(--ink)" />
          <KpiCard value={`${stats.pctDone}%`} label="Completados"  color="var(--blue)" />
          <KpiCard value={stats.urgentes} label="Urgentes"       color="var(--red)" />
          <KpiCard value={stats.pasosCompletos} label="Pasos hechos" color="var(--ink2)" />
        </div>

        {/* Actividad 7 días */}
        <SectionCard title="Pedidos — últimos 7 días">
          <BarChart data={stats.porDia} />
        </SectionCard>

        {/* Donut completado */}
        <SectionCard title="Estado de pedidos">
          <DonutChart done={stats.done} pending={stats.pending} />
        </SectionCard>

        {/* Top clientes */}
        {stats.topClientes.length > 0 && (
          <SectionCard title="Top clientes">
            <HorizontalBars data={stats.topClientes} />
          </SectionCard>
        )}

        {/* Prioridad breakdown */}
        <SectionCard title="Por prioridad">
          <HorizontalBars data={[
            { label: 'Normal',  value: stats.total - stats.urgentes },
            { label: 'Urgente', value: stats.urgentes },
          ]} />
        </SectionCard>

      </div>
    </div>
  )
}
