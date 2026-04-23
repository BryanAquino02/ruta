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

export default function App() {
  const [activePage, setActivePage] = useState('tasks')
  const { pedidos, addPedido, completePaso, uncompletePaso, completePedido, deletePedido } = usePedidos()
  const { contactos, addContacto, updateContacto, deleteContacto } = useContactos()

  return (
    <div className="app-shell">
      <Header />

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
