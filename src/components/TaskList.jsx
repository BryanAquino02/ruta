import TaskCard from './TaskCard'

function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect x="3" y="4" width="16" height="14" rx="2.5" stroke="#9AA3B5" strokeWidth="1.5" />
          <path d="M7 9h8M7 13h5" stroke="#9AA3B5" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </div>
      <div className="empty-state__title">Sin pedidos registrados</div>
      <div className="empty-state__sub">
        Usa la pestaña <strong>Nuevo</strong> para agregar tu primer pedido del día.
      </div>
    </div>
  )
}

/**
 * @param {{
 *   pedidos: object[],
 *   onComplete: (id: number) => void,
 *   onDelete: (id: number) => void,
 * }} props
 */
export default function TaskList({ pedidos, onComplete, onDelete }) {
  if (pedidos.length === 0) return <EmptyState />

  // Pending first, completed at the end
  const sorted = [
    ...pedidos.filter((p) => !p.done),
    ...pedidos.filter((p) =>  p.done),
  ]

  return (
    <div className="task-list">
      {sorted.map((pedido) => (
        <TaskCard
          key={pedido.id}
          pedido={pedido}
          onComplete={onComplete}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
