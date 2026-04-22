import { greeting } from '../utils/dateUtils'
import TaskList from '../components/TaskList'

/**
 * @param {{
 *   pedidos: object[],
 *   onComplete: (id: number) => void,
 *   onDelete: (id: number) => void,
 * }} props
 */
export default function TasksPage({ pedidos, onComplete, onDelete }) {
  const pending = pedidos.filter((p) => !p.done)
  const done    = pedidos.filter((p) =>  p.done)
  const urgent  = pending.filter((p) => p.prioridad === 'urgente')
  const allDone = pedidos.length > 0 && pending.length === 0

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
              <div className="done-banner__sub">Buen trabajo hoy</div>
            </div>
          </div>
        )}

        {/* List header */}
        <div className="list-meta">
          <span className="list-meta__heading">Pedidos</span>
          <span className="list-meta__count">{pedidos.length} total</span>
        </div>

        <TaskList pedidos={pedidos} onComplete={onComplete} onDelete={onDelete} />
      </div>
    </div>
  )
}
