import { useState } from 'react'
import { fmtDate, dateClass } from '../utils/dateUtils'

function IconDelete() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2 3h8M5 3V2h2v1M4.5 9.5l-.5-5M7.5 9.5l.5-5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <path d="M2 5.5l2.5 2.5L9 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconChevron({ open }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
      <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PasoItem({ paso, pedidoId, index, total, onComplete, onUncomplete }) {
  const isFirst = index === 0
  const isLast  = index === total - 1

  // Determina si este paso está bloqueado (el anterior no está done)
  // Los pasos no son estrictamente secuenciales — el usuario puede marcar cualquiera
  // pero mostramos un indicador visual de progreso

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 0,
      position: 'relative',
      paddingBottom: isLast ? 0 : 0,
    }}>
      {/* Línea vertical + dot */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24, flexShrink: 0, paddingTop: 2 }}>
        {/* Dot */}
        <button
          onClick={() => paso.done ? onUncomplete(pedidoId, paso.id) : onComplete(pedidoId, paso.id)}
          style={{
            width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
            background: paso.done ? 'var(--green)' : 'var(--bg)',
            border: `2px solid ${paso.done ? 'var(--green)' : 'var(--border)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', padding: 0, transition: 'all 0.15s',
          }}
          title={paso.done ? 'Marcar pendiente' : 'Marcar completado'}
        >
          {paso.done && <IconCheck />}
        </button>
        {/* Línea */}
        {!isLast && (
          <div style={{ width: 2, flex: 1, minHeight: 14, background: paso.done ? 'var(--green)' : 'var(--border)', marginTop: 2 }} />
        )}
      </div>

      {/* Contenido del paso */}
      <div style={{ flex: 1, paddingBottom: isLast ? 0 : 12, paddingLeft: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 12, fontWeight: 600,
            color: paso.done ? 'var(--ink3)' : 'var(--ink)',
            textDecoration: paso.done ? 'line-through' : 'none',
          }}>
            {paso.nombre}
          </span>
          {paso.contactoNombre && (
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--blue)', background: 'var(--blue-bg)', border: '1px solid #93C5FD', borderRadius: 4, padding: '1px 5px' }}>
              {paso.contactoNombre}
            </span>
          )}
        </div>
        {paso.direccion && (
          <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            📍 {paso.direccion}
          </div>
        )}
      </div>
    </div>
  )
}

export default function TaskCard({ pedido, onComplete, onDelete, onCompletePaso, onUncompletePaso }) {
  const { id, cliente, producto, fecha, prioridad, done, pasos = [] } = pedido
  const [expanded, setExpanded] = useState(!done)

  const completedCount = pasos.filter(s => s.done).length
  const progress = pasos.length > 0 ? completedCount / pasos.length : 0

  const handleDelete = () => {
    if (window.confirm('¿Eliminar este pedido?')) onDelete(id)
  }

  // Primer paso pendiente
  const nextPaso = pasos.find(s => !s.done)

  return (
    <div className={`ocard${done ? ' ocard--done' : ''}`}>

      {/* Top: cliente + producto + badge */}
      <div className="ocard__top">
        <div className="ocard__left">
          <div className="ocard__client">{cliente}</div>
          <div className="ocard__product">{producto}</div>
        </div>
        <span className={`badge badge--${prioridad}`}>{prioridad}</span>
      </div>

      {/* Barra de progreso */}
      {pasos.length > 0 && (
        <div style={{ margin: '8px 0 6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: 'var(--ink3)', fontWeight: 500 }}>
              {completedCount}/{pasos.length} pasos
            </span>
            {!done && nextPaso && (
              <span style={{ fontSize: 10, color: 'var(--ink2)', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Siguiente: {nextPaso.nombre}
              </span>
            )}
            {done && <span style={{ fontSize: 10, color: 'var(--green)', fontWeight: 600 }}>Completado ✓</span>}
          </div>
          <div style={{ height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 2,
              background: done ? 'var(--green)' : progress > 0 ? 'var(--blue)' : 'var(--border)',
              width: `${progress * 100}%`,
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
      )}

      {/* Toggle pasos */}
      <button
        onClick={() => setExpanded(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
          padding: '4px 0', cursor: 'pointer', color: 'var(--ink3)', fontSize: 11, fontWeight: 500,
          width: '100%', textAlign: 'left',
        }}
      >
        <IconChevron open={expanded} />
        {expanded ? 'Ocultar pasos' : `Ver ${pasos.length} pasos`}
      </button>

      {/* Lista de pasos */}
      {expanded && pasos.length > 0 && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
          {pasos.map((paso, i) => (
            <PasoItem
              key={paso.id}
              paso={paso}
              pedidoId={id}
              index={i}
              total={pasos.length}
              onComplete={onCompletePaso}
              onUncomplete={onUncompletePaso}
            />
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="ocard__foot" style={{ marginTop: 10 }}>
        <span className={`foot-date ${dateClass(fecha)}`}>{fmtDate(fecha)}</span>

        {!done ? (
          <>
            <button className="icon-btn" onClick={handleDelete} title="Eliminar">
              <IconDelete />
            </button>
            <button className="complete-btn" onClick={() => onComplete(id)}>
              Completar todo
            </button>
          </>
        ) : (
          <>
            <div className="done-chip">
              <IconCheck />
              Entregado
            </div>
            <button className="icon-btn" onClick={handleDelete} title="Eliminar">
              <IconDelete />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
