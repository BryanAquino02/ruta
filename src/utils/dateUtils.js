// ── DATE UTILITIES ──
// Pure functions — no side effects, easy to test

/**
 * Returns today's date string in YYYY-MM-DD format (local time).
 */
export function getTodayStr() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Returns tomorrow's date string in YYYY-MM-DD format.
 */
export function getTomorrowStr() {
  return new Date(Date.now() + 86_400_000).toISOString().split('T')[0]
}

/**
 * Returns true if the given date string is today.
 * @param {string} d - YYYY-MM-DD
 */
export function isToday(d) {
  return !!d && d === getTodayStr()
}

/**
 * Returns true if the given date string is before today (overdue).
 * @param {string} d - YYYY-MM-DD
 */
export function isLate(d) {
  return !!d && d < getTodayStr()
}

/**
 * Returns a human-readable label for a deadline date.
 * @param {string} d - YYYY-MM-DD
 * @returns {string}
 */
export function fmtDate(d) {
  if (!d) return 'Sin fecha'
  const hoy = getTodayStr()
  const man = getTomorrowStr()
  if (d === hoy) return 'Vence hoy'
  if (d === man) return 'Vence mañana'
  if (d < hoy)  return 'Vencido'
  return (
    'Vence ' +
    new Date(d + 'T12:00:00').toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'short',
    })
  )
}

/**
 * Returns the CSS modifier class for a date string.
 * @param {string} d - YYYY-MM-DD
 * @returns {string} BEM modifier
 */
export function dateClass(d) {
  if (isLate(d))  return 'foot-date--late'
  if (isToday(d)) return 'foot-date--today'
  return ''
}

/**
 * Returns a formatted human greeting based on current hour.
 * @returns {string}
 */
export function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

/**
 * Returns a short formatted date string for the header.
 * @returns {string}
 */
export function headerDateStr() {
  return new Date()
    .toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' })
    .toUpperCase()
}

/**
 * Returns a verbose date string for the chat context.
 * @returns {string}
 */
export function verboseDate() {
  return new Date().toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}
