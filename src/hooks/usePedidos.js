import { useState, useEffect, useCallback } from 'react'
import { getTodayStr } from '../utils/dateUtils'

// ── MIGRACIÓN: formato viejo (origen/destino) → pasos[] ──
function migrarPedido(p) {
  if (p.pasos) return p
  return {
    ...p,
    pasos: [
      { id: `${p.id}-1`, nombre: 'Recoger', direccion: p.origen || '', coords: p.origenCoords || null, contactoId: null, contactoNombre: '', done: p.done || false },
      { id: `${p.id}-2`, nombre: 'Entregar', direccion: p.destino || '', coords: p.destinoCoords || null, contactoId: null, contactoNombre: '', done: p.done || false },
    ],
    done: p.done || false,
  }
}

function buildDemoData() {
  const hoy = getTodayStr()
  return [
    {
      id: 1, cliente: 'Mitsui Automotriz', producto: '300 folders full color plastificado',
      fecha: hoy, prioridad: 'urgente', done: false,
      pasos: [
        { id: '1-1', nombre: 'Comprar papel', direccion: 'Papelería Lima — Av. Abancay 123', coords: null, contactoId: null, contactoNombre: '', done: false },
        { id: '1-2', nombre: 'Imprimir', direccion: 'Jr. Ica 346, Lima', coords: { lat: -12.0516, lng: -77.0311 }, contactoId: 1, contactoNombre: 'Imprenta El Centro', done: true },
        { id: '1-3', nombre: 'Troquelar', direccion: 'Sheraton, Lima Centro', coords: { lat: -12.0531, lng: -77.0353 }, contactoId: 2, contactoNombre: 'Troqueladora Rápida', done: false },
        { id: '1-4', nombre: 'Entregar al cliente', direccion: 'Oficina Mitsui — San Isidro', coords: null, contactoId: null, contactoNombre: '', done: false },
      ],
    },
    {
      id: 2, cliente: 'Toyota del Perú', producto: '150 afiches A3 barniz UV',
      fecha: hoy, prioridad: 'normal', done: false,
      pasos: [
        { id: '2-1', nombre: 'Recoger en proveedor', direccion: 'Polvos Azules, Lima', coords: { lat: -12.0544, lng: -77.0297 }, contactoId: 3, contactoNombre: 'Don Carlos Pintura', done: false },
        { id: '2-2', nombre: 'Entregar', direccion: 'Sala ventas Toyota — La Molina', coords: null, contactoId: null, contactoNombre: '', done: false },
      ],
    },
    {
      id: 3, cliente: 'Santa Marta SAC', producto: '500 tarjetas troqueladas',
      fecha: hoy, prioridad: 'baja', done: true,
      pasos: [
        { id: '3-1', nombre: 'Recoger', direccion: 'Sheraton, Lima Centro', coords: { lat: -12.0531, lng: -77.0353 }, contactoId: 2, contactoNombre: 'Troqueladora Rápida', done: true },
        { id: '3-2', nombre: 'Entregar', direccion: 'Santa Marta — Lince', coords: null, contactoId: null, contactoNombre: '', done: true },
      ],
    },
  ]
}

const STORAGE_KEY = 'miruta_v4'

export function usePedidos() {
  const [pedidos, setPedidos] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(migrarPedido)
      }
      const v3 = localStorage.getItem('miruta_v3')
      if (v3) {
        const parsed = JSON.parse(v3)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(migrarPedido)
      }
    } catch {}
    return buildDemoData()
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pedidos))
  }, [pedidos])

  function recalcDone(pasos) {
    return pasos.length > 0 && pasos.every(s => s.done)
  }

  const addPedido = useCallback((fields) => {
    const id = Date.now()
    const pasos = (fields.pasos || []).map((p, i) => ({ ...p, id: `${id}-${i + 1}`, done: false }))
    setPedidos(prev => [...prev, { id, cliente: fields.cliente, producto: fields.producto, fecha: fields.fecha, prioridad: fields.prioridad, pasos, done: false }])
  }, [])

  const completePaso = useCallback((pedidoId, pasoId) => {
    setPedidos(prev => prev.map(p => {
      if (p.id !== pedidoId) return p
      const pasos = p.pasos.map(s => s.id === pasoId ? { ...s, done: true } : s)
      return { ...p, pasos, done: recalcDone(pasos) }
    }))
  }, [])

  const uncompletePaso = useCallback((pedidoId, pasoId) => {
    setPedidos(prev => prev.map(p => {
      if (p.id !== pedidoId) return p
      const pasos = p.pasos.map(s => s.id === pasoId ? { ...s, done: false } : s)
      return { ...p, pasos, done: false }
    }))
  }, [])

  const completePedido = useCallback((id) => {
    setPedidos(prev => prev.map(p => {
      if (p.id !== id) return p
      const pasos = p.pasos.map(s => ({ ...s, done: true }))
      return { ...p, pasos, done: true }
    }))
  }, [])

  const deletePedido = useCallback((id) => {
    setPedidos(prev => prev.filter(p => p.id !== id))
  }, [])

  return { pedidos, addPedido, completePaso, uncompletePaso, completePedido, deletePedido }
}
