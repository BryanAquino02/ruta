import { useState, useRef, useEffect, useCallback } from 'react'
import { localAnswer } from '../utils/chatUtils'
import { greeting } from '../utils/dateUtils'

const QUICK_PROMPTS = [
  'Pendientes',
  'Ruta óptima',
  'Vence pronto',
  'Agrupar viajes',
  'Mi progreso',
]

const QUICK_FULL = {
  'Pendientes':    '¿Qué pedidos tengo pendientes?',
  'Ruta óptima':  '¿Cuál es la ruta más eficiente hoy?',
  'Vence pronto': '¿Qué vence hoy o mañana?',
  'Agrupar viajes': '¿Qué puedo agrupar en un solo viaje?',
  'Mi progreso':  '¿Cuánto he completado hoy?',
}

/**
 * Renders a single chat message.
 * Supports **bold** and newlines in AI responses.
 */
function Message({ role, text }) {
  if (role === 'typing') {
    return <div className="msg msg--typing">Analizando…</div>
  }

  if (role === 'user') {
    return <div className="msg msg--user">{text}</div>
  }

  // AI: parse **bold** and newlines
  const formatted = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br />')

  return (
    <div className="msg msg--ai">
      <div className="msg__from">MiRuta</div>
      {/* eslint-disable-next-line react/no-danger */}
      <div dangerouslySetInnerHTML={{ __html: formatted }} />
    </div>
  )
}

/**
 * @param {{ pedidos: object[] }} props
 */
export default function ChatPage({ pedidos }) {
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [busy, setBusy]         = useState(false)
  const feedRef = useRef(null)

  // Greeting message on mount
  useEffect(() => {
    const p = pedidos.filter((x) => !x.done).length
    const u = pedidos.filter((x) => !x.done && x.prioridad === 'urgente').length
    let text = `${greeting()}. Tienes **${p}** pedido${p !== 1 ? 's' : ''} pendiente${p !== 1 ? 's' : ''}`
    if (u > 0) text += `, ${u} urgente${u > 1 ? 's' : ''}`
    text += '. ¿En qué te ayudo?'
    setMessages([{ id: 0, role: 'ai', text }])
  // Run once on mount — pedidos intentionally not in deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }, [messages])

  const send = useCallback(
    async (txt) => {
      const trimmed = txt.trim()
      if (!trimmed || busy) return

      setInput('')
      setBusy(true)
      setMessages((prev) => [
        ...prev,
        { id: Date.now(),     role: 'user',   text: trimmed },
        { id: Date.now() + 1, role: 'typing', text: '' },
      ])

      // Simulate slight delay (replaces network latency when using real API)
      await new Promise((r) => setTimeout(r, 500))

      const reply = localAnswer(trimmed, pedidos)

      setMessages((prev) => {
        const withoutTyping = prev.filter((m) => m.role !== 'typing')
        return [...withoutTyping, { id: Date.now() + 2, role: 'ai', text: reply }]
      })
      setBusy(false)
    },
    [busy, pedidos],
  )

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header__title">
          <div className="status-dot" />
          Asistente IA
        </div>
        <div className="chat-header__sub">Consulta sobre tus pedidos en tiempo real</div>
      </div>

      {/* Quick prompts */}
      <div className="chips-row">
        {QUICK_PROMPTS.map((label) => (
          <button
            key={label}
            className="chip"
            onClick={() => send(QUICK_FULL[label])}
            disabled={busy}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="chat-feed" ref={feedRef}>
        {messages.map((m) => (
          <Message key={m.id} role={m.role} text={m.text} />
        ))}
      </div>

      {/* Input bar */}
      <div className="chat-inputbar">
        <textarea
          className="chat-ta"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Pregunta sobre tus pedidos…"
          rows={1}
          disabled={busy}
        />
        <button
          className="send-btn"
          onClick={() => send(input)}
          disabled={busy || !input.trim()}
          title="Enviar"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1.5 7L12.5 2L8 12.5L6.5 7.5L1.5 7Z" stroke="white" strokeWidth="1.4" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
