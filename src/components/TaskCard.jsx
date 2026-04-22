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

/**
 * @param {{
 *   pedido: object,
 *   onComplete: (id: number) => void,
 *   onDelete: (id: number) => void,
 * }} props
 */
export default function TaskCard({ pedido, onComplete, onDelete }) {
  const { id, cliente, producto, origen, destino, fecha, prioridad, done } = pedido

  const handleDelete = () => {
    if (window.confirm('¿Eliminar este pedido?')) {
      onDelete(id)
    }
  }

  return (
    <div className={`ocard${done ? ' ocard--done' : ''}`}>

      {/* Top: client + product + priority badge */}
      <div className="ocard__top">
        <div className="ocard__left">
          <div className="ocard__client">{cliente}</div>
          <div className="ocard__product">{producto}</div>
        </div>
        <span className={`badge badge--${prioridad}`}>{prioridad}</span>
      </div>

      {/* Route: pickup → delivery */}
      <div className="ocard__route">
        <div className="rrow">
          <div className="rdots">
            <div className="rd rd--pick" />
            <div className="rl" />
          </div>
          <span className="rlabel rlabel--pick">Recojo</span>
          <span className="rtext">{origen}</span>
        </div>
        <div className="rrow">
          <div className="rdots">
            <div className="rd rd--drop" />
          </div>
          <span className="rlabel rlabel--drop">Entrega</span>
          <span className="rtext">{destino}</span>
        </div>
      </div>

      {/* Footer: date + actions */}
      <div className="ocard__foot">
        <span className={`foot-date ${dateClass(fecha)}`}>{fmtDate(fecha)}</span>

        {!done ? (
          <>
            <button className="icon-btn" onClick={handleDelete} title="Eliminar">
              <IconDelete />
            </button>
            <button className="complete-btn" onClick={() => onComplete(id)}>
              Completar
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
