import { useState } from 'react'
import { greeting } from '../utils/dateUtils'
import TaskList from '../components/TaskList'

export default function TasksPage({ pedidos, onComplete, onDelete, onCompletePaso, onUncompletePaso }) {
  const [viewMode, setViewMode] = useState('pedidos') // 'pedidos' | 'pasos'

  const pending = pedidos.filter(p => !p.done)
  const done    = pedidos.filter(p =>  p.done)
  const urgent  = pending.filter(p => p.prioridad === 'urgente')
  const allDone = pedidos.length > 0 && pending.length === 0

  // Vista por pasos sueltos: aplanar todos los pasos pendientes
  const pasosSueltos = pedidos
    .filter(p => !p.done)
    .flatMap(p => (p.pasos || []).filter(s => !s.done).map(s => ({ ...s, pedido: p })))

  return (
    <div className="page">
      <div className="tasks-scroll">

        {/* KPI hero */}
        <div className="summary">
          <div className="summary__label">{greeting()}</div>
          <div className="summary__title">
            Tienes <em>{pedidos.length}</em> pedido{pedidos.length !== 1 ? 's' : ''} activo{pedidos.length !== 1 ? 's' : ''}
          </div>
          <div className="kpi-row">
            <div className="kpi">
              <div className="kpi__n kpi__n--pending">{pending.length}</div>
              <div className="kpi__l">Pendientes</div>
            </div>
            <div className="kpi">
              <div className="kpi__n kpi__n--done">{done.length}</div>
              <div className="kpi__l">Completados</div>
            </div>
            <div className="kpi">
              <div className="kpi__n kpi__n--urgent">{urgent.length}</div>
              <div className="kpi__l">Urgentes</div>
            </div>
          </div>
        </div>

        {/* All-done banner */}
        {allDone && (
          <div className="done-banner">
            <div>
              <div className="done-banner__title">Todos los pedidos completados</div>
              <div className="done-banner__sub">Buen trabajo hoy 🎉</div>
            </div>
          </div>
        )}

        {/* Toggle vista */}
        <div style={{ display: 'flex', gap: 6, padding: '0 16px 10px' }}>
          <button
            onClick={() => setViewMode('pedidos')}
            style={{
              flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: `1.5px solid ${viewMode === 'pedidos' ? 'var(--blue)' : 'var(--border)'}`,
              background: viewMode === 'pedidos' ? 'var(--blue-bg)' : 'var(--surface)',
              color: viewMode === 'pedidos' ? 'var(--blue)' : 'var(--ink2)',
            }}
          >
            📦 Por pedido
          </button>
          <button
            onClick={() => setViewMode('pasos')}
            style={{
              flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: `1.5px solid ${viewMode === 'pasos' ? 'var(--blue)' : 'var(--border)'}`,
              background: viewMode === 'pasos' ? 'var(--blue-bg)' : 'var(--surface)',
              color: viewMode === 'pasos' ? 'var(--blue)' : 'var(--ink2)',
            }}
          >
            📋 Por pasos
          </button>
        </div>

        {/* Vista por pedido */}
        {viewMode === 'pedidos' && (
          <>
            <div className="list-meta">
              <span className="list-meta__heading">Pedidos</span>
              <span className="list-meta__count">{pedidos.length} total</span>
            </div>
            <TaskList
              pedidos={pedidos}
              onComplete={onComplete} onDelete={onDelete}
              onCompletePaso={onCompletePaso} onUncompletePaso={onUncompletePaso}
            />
          </>
        )}

        {/* Vista por pasos sueltos */}
        {viewMode === 'pasos' && (
          <div style={{ padding: '0 14px 24px' }}>
            <div className="list-meta">
              <span className="list-meta__heading">Pasos pendientes</span>
              <span className="list-meta__count">{pasosSueltos.length} paso{pasosSueltos.length !== 1 ? 's' : ''}</span>
            </div>

            {pasosSueltos.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__icon">✅</div>
                <div className="empty-state__title">No hay pasos pendientes</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pasosSueltos.map(paso => (
                  <div key={paso.id} style={{
                    background: 'var(--surface)', borderRadius: 'var(--r)',
                    border: '1px solid var(--border)', padding: '12px 14px',
                  }}>
                    {/* Cabecera del pedido */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.4px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {paso.pedido.cliente}
                      </span>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                        background: paso.pedido.prioridad === 'urgente' ? 'var(--red-bg)' : 'var(--blue-bg)',
                        color: paso.pedido.prioridad === 'urgente' ? 'var(--red)' : 'var(--blue)',
                      }}>
                        {paso.pedido.prioridad}
                      </span>
                    </div>

                    {/* Paso */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button
                        onClick={() => onCompletePaso(paso.pedido.id, paso.id)}
                        style={{
                          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                          background: 'var(--bg)', border: '2px solid var(--border)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', padding: 0,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{paso.nombre}</div>
                        {paso.contactoNombre && (
                          <div style={{ fontSize: 11, color: 'var(--blue)', marginTop: 1 }}>{paso.contactoNombre}</div>
                        )}
                        {paso.direccion && (
                          <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            📍 {paso.direccion}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
