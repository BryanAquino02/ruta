import { useState, useEffect, useCallback } from 'react'
import { getTodayStr } from '../utils/dateUtils'

// ── DEMO DATA ──
function buildDemoData() {
  const hoy = getTodayStr()
  return [
    {
      id: 1,
      cliente: 'Mitsui Automotriz',
      producto: '300 folders full color plastificado',
      origen: 'Imprenta El Centro — Jr. Ica 346',
      destino: 'Oficina Mitsui — San Isidro',
      fecha: hoy,
      prioridad: 'urgente',
      done: false,
    },
    {
      id: 2,
      cliente: 'Toyota del Perú',
      producto: '150 afiches A3 barniz UV',
      origen: 'Don Carlos Pintura — Polvos Azules',
      destino: 'Sala ventas Toyota — La Molina',
      fecha: hoy,
      prioridad: 'normal',
      done: false,
    },
    {
      id: 3,
      cliente: 'Santa Marta SAC',
      producto: '500 tarjetas troqueladas',
      origen: 'Troqueladora Rápida — Sheraton',
      destino: 'Santa Marta — Lince',
      fecha: hoy,
      prioridad: 'baja',
      done: true,
    },
  ]
}

const STORAGE_KEY = 'miruta_v3'

/**
 * Central state hook for all pedido data.
 *
 * Exposes:
 *   - pedidos: Pedido[]
 *   - addPedido(fields): void
 *   - completePedido(id): void
 *   - deletePedido(id): void
 *
 * Architecture note:
 *   The three mutating functions (add/complete/delete) are isolated here.
 *   To connect a backend, replace the localStorage writes inside each
 *   function with API calls, keeping the same function signatures.
 *
 * @returns {{ pedidos, addPedido, completePedido, deletePedido }}
 */
export function usePedidos() {
  const [pedidos, setPedidos] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {
      // Corrupt storage — fall through to demo data
    }
    return buildDemoData()
  })

  // Sync to localStorage on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pedidos))
  }, [pedidos])

  /**
   * Add a new pedido.
   * Backend: POST /api/pedidos
   *
   * @param {{ cliente, producto, origen, destino, fecha, prioridad }} fields
   */
  const addPedido = useCallback((fields) => {
    const newPedido = {
      id: Date.now(),
      ...fields,
      done: false,
    }
    setPedidos((prev) => [...prev, newPedido])
  }, [])

  /**
   * Mark a pedido as completed.
   * Backend: PATCH /api/pedidos/:id  { done: true }
   *
   * @param {number} id
   */
  const completePedido = useCallback((id) => {
    setPedidos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, done: true } : p)),
    )
  }, [])

  /**
   * Remove a pedido permanently.
   * Backend: DELETE /api/pedidos/:id
   *
   * @param {number} id
   */
  const deletePedido = useCallback((id) => {
    setPedidos((prev) => prev.filter((p) => p.id !== id))
  }, [])

  return { pedidos, addPedido, completePedido, deletePedido }
}
