import { useState } from 'react'
import { usePedidos }   from './hooks/usePedidos'
import { useContactos } from './hooks/useContactos'
import Header           from './components/Header'
import BottomNav        from './components/BottomNav'
import TasksPage        from './pages/TasksPage'
import NewPedidoPage    from './pages/NewPedidoPage'
import ChatPage         from './pages/ChatPage'
import MapPage          from './pages/MapPage'
import ContactosPage    from './pages/ContactosPage'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', gap: 12,
    }}>
      <div style={{ fontSize: 28 }}>📦</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>Cargando MiRuta…</div>
      <div style={{ fontSize: 12, color: 'var(--ink3)' }}>Sincronizando con la nube</div>
    </div>
  )
}

function ErrorBanner({ message }) {
  return (
    <div style={{
      background: 'var(--red-bg)', borderBottom: '1px solid var(--red)', padding: '10px 16px',
      fontSize: 12, color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
    }}>
      ⚠️ Error de conexión con Supabase — {message}
    </div>
  )
}

export default function App() {
  const [activePage, setActivePage] = useState('tasks')
  const {
    pedidos, loading: loadingPedidos, error: errorPedidos,
    addPedido, completePaso, uncompletePaso, completePedido, deletePedido,
  } = usePedidos()
  const {
    contactos, loading: loadingContactos,
    addContacto, updateContacto, deleteContacto,
  } = useContactos()

  const loading = loadingPedidos || loadingContactos

  if (loading) return <LoadingScreen />

  return (
    <div className="app-shell">
      <Header />

      {errorPedidos && <ErrorBanner message={errorPedidos} />}

      {activePage === 'tasks' && (
        <TasksPage
          pedidos={pedidos}
          onComplete={completePedido}
          onDelete={deletePedido}
          onCompletePaso={completePaso}
          onUncompletePaso={uncompletePaso}
        />
      )}

      {activePage === 'nuevo' && (
        <NewPedidoPage
          onAdd={addPedido}
          onNavigate={setActivePage}
          MAPBOX_TOKEN={MAPBOX_TOKEN}
          contactos={contactos}
        />
      )}

      {activePage === 'mapa' && (
        <MapPage
          pedidos={pedidos}
          contactos={contactos}
          MAPBOX_TOKEN={MAPBOX_TOKEN}
        />
      )}

      {activePage === 'contactos' && (
        <ContactosPage
          contactos={contactos}
          onAdd={addContacto}
          onUpdate={updateContacto}
          onDelete={deleteContacto}
          MAPBOX_TOKEN={MAPBOX_TOKEN}
        />
      )}

      {activePage === 'chat' && (
        <ChatPage pedidos={pedidos} />
      )}

      <BottomNav activePage={activePage} onNavigate={setActivePage} />
    </div>
  )
}
