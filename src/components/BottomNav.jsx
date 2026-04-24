// src/components/BottomNav.jsx
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
function IconMap() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 2C6.24 2 4 4.24 4 7c0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5z" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="9" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}
function IconContacts() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 15c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}
function IconAnalytics() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="10" width="3" height="6" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="7.5" y="6" width="3" height="10" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="13" y="2" width="3" height="14" rx="1" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}

const TABS = [
  { id: 'tasks',     label: 'Tareas',    Icon: IconTasks     },
  { id: 'nuevo',     label: 'Nuevo',     Icon: IconAdd       },
  { id: 'mapa',      label: 'Mapa',      Icon: IconMap       },
  { id: 'contactos', label: 'Agenda',    Icon: IconContacts  },
  { id: 'analytics', label: 'Stats',     Icon: IconAnalytics },
]

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
