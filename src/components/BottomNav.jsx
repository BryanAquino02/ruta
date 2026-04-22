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

function IconMap() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M9 2C6.24 2 4 4.24 4 7c0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle cx="9" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}

const TABS = [
  { id: 'tasks',  label: 'Tareas',    Icon: IconTasks },
  { id: 'nuevo',  label: 'Nuevo',     Icon: IconAdd   },
  { id: 'mapa',   label: 'Mapa',      Icon: IconMap   },
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
