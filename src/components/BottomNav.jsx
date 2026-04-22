// Icons as isolated components for reuse
function IconTasks() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 7h8M5 10.5h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function IconAdd() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9 6v6M6 9h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function IconChat() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M3 4a2 2 0 012-2h8a2 2 0 012 2v7a2 2 0 01-2 2H8l-3 2v-2H5a2 2 0 01-2-2V4Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path d="M6 7h6M6 10h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

const TABS = [
  { id: 'tasks',  label: 'Tareas',    Icon: IconTasks },
  { id: 'nuevo',  label: 'Nuevo',     Icon: IconAdd   },
  { id: 'chat',   label: 'Asistente', Icon: IconChat  },
]

/**
 * @param {{ activePage: string, onNavigate: (page: string) => void }} props
 */
export default function BottomNav({ activePage, onNavigate }) {
  return (
    <nav className="tabbar">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          className={`tabbar__btn${activePage === id ? ' tabbar__btn--active' : ''}`}
          onClick={() => onNavigate(id)}
          aria-current={activePage === id ? 'page' : undefined}
        >
          <Icon />
          {label}
        </button>
      ))}
    </nav>
  )
}
