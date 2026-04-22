import { useState } from 'react'
import { usePedidos } from './hooks/usePedidos'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import TasksPage from './pages/TasksPage'
import NewPedidoPage from './pages/NewPedidoPage'
import ChatPage from './pages/ChatPage'
import MapPage from './pages/MapPage'

// ─────────────────────────────────────────
//  🗺️  Token de Mapbox (variable de entorno)
// ─────────────────────────────────────────
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

export default function App() {
  const [activePage, setActivePage] = useState('tasks')
  const { pedidos, addPedido, completePedido, deletePedido } = usePedidos()

  return (
    <div className="app-shell">
      <Header />

      {activePage === 'tasks' && (
        <TasksPage
          pedidos={pedidos}
          onComplete={completePedido}
          onDelete={deletePedido}
        />
      )}

      {activePage === 'nuevo' && (
        <NewPedidoPage
          onAdd={addPedido}
          onNavigate={setActivePage}
          MAPBOX_TOKEN={MAPBOX_TOKEN}
        />
      )}

      {activePage === 'chat' && (
        <ChatPage pedidos={pedidos} />
      )}

      {activePage === 'mapa' && (
        <MapPage pedidos={pedidos} MAPBOX_TOKEN={MAPBOX_TOKEN} />
      )}

      <BottomNav activePage={activePage} onNavigate={setActivePage} />
    </div>
  )
}
