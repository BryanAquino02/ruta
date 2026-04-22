// ── CHAT UTILITIES ──
// Isolated here so they can be replaced with real API calls later.

import { verboseDate, getTodayStr } from './dateUtils'

/**
 * Builds the system prompt for the AI assistant, injecting real pedido data.
 * When connecting to Claude or OpenAI later, pass this string as the `system` param.
 *
 * @param {Array} pedidos - Full pedidos array from state
 * @returns {string}
 */
export function buildContext(pedidos) {
  const pending = pedidos.filter((p) => !p.done)
  const done    = pedidos.filter((p) => p.done)

  const pendingLines =
    pending.length === 0
      ? 'Ninguno'
      : pending
          .map(
            (p, i) =>
              `${i + 1}. ${p.cliente} | ${p.producto} | ` +
              `Recojo: ${p.origen} | Entrega: ${p.destino} | ` +
              `Vence: ${p.fecha || '—'} | ${p.prioridad}`,
          )
          .join('\n')

  const doneLines =
    done.length === 0
      ? 'Ninguno'
      : done.map((p) => `• ${p.cliente}: ${p.producto}`).join('\n')

  return `Eres MiRuta, asistente de un broker de impresión en Lima, Perú.
El usuario coordina pedidos entre empresas e imprentas: recoge en proveedores y entrega a clientes.
Imprentas frecuentes: centro de Lima (Jr. Ica, Polvos Azules, zona Sheraton).
Hoy: ${verboseDate()}.

PENDIENTES (${pending.length}):
${pendingLines}

COMPLETADOS (${done.length}):
${doneLines}

Responde en español. Sé conciso y directo. Agrupa pedidos por zona cuando sugieras rutas.`
}

/**
 * Generates a smart local response based on pedidos state.
 * This function replaces the AI API while offline or without a key.
 * To connect to Claude: call fetch('https://api.anthropic.com/v1/messages', ...)
 * using buildContext(pedidos) as the system prompt.
 *
 * @param {string} txt  - User's message
 * @param {Array} pedidos - Full pedidos array from state
 * @returns {string} - Response text (supports **bold** and \n)
 */
export function localAnswer(txt, pedidos) {
  const t       = txt.toLowerCase()
  const pending = pedidos.filter((p) => !p.done)
  const done    = pedidos.filter((p) => p.done)
  const urgent  = pending.filter((p) => p.prioridad === 'urgente')
  const hoy     = getTodayStr()
  const venceHoy = pending.filter((p) => p.fecha === hoy)

  // Pendientes
  if (/pendiente|falta|queda|sin completar/.test(t)) {
    if (!pending.length) return 'No tienes pedidos pendientes.'
    return (
      `**${pending.length} pendiente${pending.length > 1 ? 's' : ''}:**\n\n` +
      pending
        .map(
          (p, i) =>
            `${i + 1}. **${p.cliente}** — ${p.producto}\n` +
            `   Recojo: ${p.origen}\n` +
            `   Entrega: ${p.destino}\n` +
            `   Prioridad: ${p.prioridad}`,
        )
        .join('\n\n')
    )
  }

  // Ruta / agrupación
  if (/ruta|eficiente|viaje|agrupar/.test(t)) {
    if (!pending.length) return 'No hay pedidos pendientes. Nada que rutear.'
    if (pending.length === 1) {
      const p = pending[0]
      return (
        `Un solo pedido pendiente:\n\n` +
        `**${p.cliente}**\nRecojo → ${p.origen}\nEntrega → ${p.destino}`
      )
    }
    return (
      `Orden sugerido para ${pending.length} pedidos:\n\n` +
      pending
        .map(
          (p, i) =>
            `**${i + 1}. ${p.cliente}**${p.prioridad === 'urgente' ? ' ⚠️' : ''}\n` +
            `   ${p.origen} → ${p.destino}`,
        )
        .join('\n\n') +
      '\n\nAgrupa los del centro primero, luego los distritos alejados.'
    )
  }

  // Vencimientos / urgentes
  if (/vence|hoy|mañana|pronto|urgente/.test(t)) {
    let resp = ''
    if (venceHoy.length)
      resp +=
        `**Vencen hoy (${venceHoy.length}):**\n` +
        venceHoy.map((p) => `• ${p.cliente}: ${p.producto}`).join('\n') +
        '\n\n'
    if (urgent.length)
      resp +=
        `**Urgentes (${urgent.length}):**\n` +
        urgent.map((p) => `• ${p.cliente}: ${p.producto}`).join('\n')
    return resp.trim() || 'No tienes entregas urgentes ni que venzan hoy.'
  }

  // Progreso
  if (/progres|complet|avance|cuánto/.test(t)) {
    const total = pedidos.length
    const pct   = total > 0 ? Math.round((done.length / total) * 100) : 0
    return (
      `**Progreso del día: ${pct}%**\n\n` +
      `✓ Completados: ${done.length}\n` +
      `○ Pendientes: ${pending.length}\n` +
      `  Total: ${total}`
    )
  }

  // Fallback genérico
  const p = pending.length, d = done.length, u = urgent.length
  return (
    `Resumen actual:\n` +
    `• Pendientes: ${p}\n` +
    `• Completados: ${d}\n` +
    `• Urgentes: ${u}\n\n` +
    `Puedo ayudarte con rutas, prioridades o seguimiento. ¿Qué necesitas?`
  )
}

// ── FUTURE BACKEND CONNECTION ──
// Uncomment and configure when ready to connect Claude:
//
// export async function askClaude(txt, pedidos, history, apiKey) {
//   const res = await fetch('https://api.anthropic.com/v1/messages', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'x-api-key': apiKey,
//       'anthropic-version': '2023-06-01',
//       'anthropic-dangerous-direct-browser-access': 'true',
//     },
//     body: JSON.stringify({
//       model: 'claude-opus-4-5',
//       max_tokens: 800,
//       system: buildContext(pedidos),
//       messages: history,
//     }),
//   })
//   const data = await res.json()
//   return data.content?.[0]?.text ?? 'Sin respuesta.'
// }
