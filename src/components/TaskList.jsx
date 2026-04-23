import TaskCard from './TaskCard'

export default function TaskList({ pedidos, onComplete, onDelete, onCompletePaso, onUncompletePaso }) {
  const pending = pedidos.filter(p => !p.done)
  const done    = pedidos.filter(p =>  p.done)

  if (pedidos.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">📭</div>
        <div className="empty-state__title">Sin pedidos hoy</div>
        <div className="empty-state__sub">Toca + para registrar uno</div>
      </div>
    )
  }

  return (
    <div className="task-list">
      {pending.map(p => (
        <TaskCard
          key={p.id} pedido={p}
          onComplete={onComplete} onDelete={onDelete}
          onCompletePaso={onCompletePaso} onUncompletePaso={onUncompletePaso}
        />
      ))}
      {done.length > 0 && (
        <>
          <div className="section-label" style={{ marginTop: 8 }}>Completados</div>
          {done.map(p => (
            <TaskCard
              key={p.id} pedido={p}
              onComplete={onComplete} onDelete={onDelete}
              onCompletePaso={onCompletePaso} onUncompletePaso={onUncompletePaso}
            />
          ))}
        </>
      )}
    </div>
  )
}
