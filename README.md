# MiRuta — React + Vite

Aplicación de gestión de pedidos de entrega. Migrada desde HTML/JS vanilla a React modular.

## Requisitos

- **Node.js 18+** — [descargar aquí](https://nodejs.org)

## Instalación y ejecución

```bash
# Desde la raíz del proyecto
cd miruta
npm install
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) en el navegador.

## Estructura

```
src/
├── App.jsx                  # Raíz: navegación + estado global
├── main.jsx                 # Entry point React
├── index.css                # Design tokens + estilos globales
│
├── components/
│   ├── Header.jsx           # Barra superior con marca y fecha
│   ├── BottomNav.jsx        # Navegación inferior (3 tabs)
│   ├── TaskCard.jsx         # Card individual de pedido
│   └── TaskList.jsx         # Lista de cards + empty state
│
├── pages/
│   ├── TasksPage.jsx        # Dashboard con KPIs y lista
│   ├── NewPedidoPage.jsx    # Formulario controlado con validación
│   └── ChatPage.jsx         # Chat con asistente IA
│
├── hooks/
│   └── usePedidos.js        # Estado central + sync localStorage
│
└── utils/
    ├── dateUtils.js         # Funciones puras de fecha
    └── chatUtils.js         # Lógica del asistente + stub para Claude API
```

## Conectar backend en el futuro

### 1. Reemplazar localStorage → API REST

En `hooks/usePedidos.js`, las tres funciones están preparadas:

```js
// Actualmente:
setPedidos(prev => [...prev, newPedido])

// Reemplazar por:
const res = await fetch('/api/pedidos', {
  method: 'POST',
  body: JSON.stringify(fields),
})
const newPedido = await res.json()
setPedidos(prev => [...prev, newPedido])
```

### 2. Conectar Claude AI

En `utils/chatUtils.js` hay un stub comentado listo para descomentar:

```js
export async function askClaude(txt, pedidos, history, apiKey) { ... }
```

Y en `pages/ChatPage.jsx`, reemplazar `localAnswer(txt, pedidos)` por `await askClaude(...)`.

## Scripts

| Comando | Acción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run preview` | Preview del build |
