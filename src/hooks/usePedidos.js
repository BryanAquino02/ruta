import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { getTodayStr } from '../utils/dateUtils'

// ─────────────────────────────────────────────────────────────
//  Helpers: convertir entre formato DB (snake_case) y app (camelCase)
// ─────────────────────────────────────────────────────────────

function dbPasoToApp(row) {
  return {
    id:             String(row.id),
    dbId:           row.id,           // bigint de Supabase
    nombre:         row.nombre,
    direccion:      row.direccion,
    coords:         row.coords || null,
    contactoId:     row.contacto_id   || null,
    contactoNombre: row.contacto_nombre || '',
    done:           row.done,
    orden:          row.orden,
  }
}

function dbPedidoToApp(row, pasoRows = []) {
  const pasos = [...pasoRows]
    .sort((a, b) => a.orden - b.orden)
    .map(dbPasoToApp)
  return {
    id:        row.id,
    cliente:   row.cliente,
    producto:  row.producto,
    fecha:     row.fecha,
    prioridad: row.prioridad,
    done:      row.done,
    pasos,
  }
}

// ─────────────────────────────────────────────────────────────
//  Demo data (sólo si Supabase está vacío)
// ─────────────────────────────────────────────────────────────
function buildDemoData() {
  const hoy = getTodayStr()
  return [
    {
      cliente: 'Mitsui Automotriz', producto: '300 folders full color plastificado',
      fecha: hoy, prioridad: 'urgente',
      pasos: [
        { nombre: 'Comprar papel',      direccion: 'Papelería Lima — Av. Abancay 123', coords: null,                                    contactoId: null, contactoNombre: '' },
        { nombre: 'Imprimir',           direccion: 'Jr. Ica 346, Lima',                coords: { lat: -12.0516, lng: -77.0311 },        contactoId: null, contactoNombre: 'Imprenta El Centro' },
        { nombre: 'Troquelar',          direccion: 'Sheraton, Lima Centro',             coords: { lat: -12.0531, lng: -77.0353 },        contactoId: null, contactoNombre: 'Troqueladora Rápida' },
        { nombre: 'Entregar al cliente',direccion: 'Oficina Mitsui — San Isidro',       coords: null,                                    contactoId: null, contactoNombre: '' },
      ],
    },
    {
      cliente: 'Toyota del Perú', producto: '150 afiches A3 barniz UV',
      fecha: hoy, prioridad: 'normal',
      pasos: [
        { nombre: 'Recoger en proveedor', direccion: 'Polvos Azules, Lima', coords: { lat: -12.0544, lng: -77.0297 }, contactoId: null, contactoNombre: 'Don Carlos Pintura' },
        { nombre: 'Entregar',             direccion: 'Sala ventas Toyota — La Molina',  coords: null,                  contactoId: null, contactoNombre: '' },
      ],
    },
  ]
}

// ─────────────────────────────────────────────────────────────
//  Hook principal
// ─────────────────────────────────────────────────────────────
export function usePedidos() {
  const [pedidos,  setPedidos]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const seeded = useRef(false)

  // ── LOAD ──────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: pedidosRows, error: e1 } = await supabase
        .from('pedidos')
        .select('*')
        .order('created_at', { ascending: false })
      if (e1) throw e1

      const { data: pasosRows, error: e2 } = await supabase
        .from('pasos')
        .select('*')
        .order('orden', { ascending: true })
      if (e2) throw e2

      if (pedidosRows.length === 0 && !seeded.current) {
        // Supabase vacío — insertar demo data una sola vez
        seeded.current = true
        await seedDemoData()
        return // seedDemoData llama loadAll al final
      }

      const pasosByPedido = {}
      pasosRows.forEach(p => {
        if (!pasosByPedido[p.pedido_id]) pasosByPedido[p.pedido_id] = []
        pasosByPedido[p.pedido_id].push(p)
      })

      setPedidos(pedidosRows.map(p => dbPedidoToApp(p, pasosByPedido[p.id] || [])))
    } catch (err) {
      console.error('[usePedidos] loadAll error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  // ── SEED DEMO DATA ────────────────────────────────────────
  async function seedDemoData() {
    const demos = buildDemoData()
    for (const d of demos) {
      const { data: pedRow, error: e } = await supabase
        .from('pedidos')
        .insert({ cliente: d.cliente, producto: d.producto, fecha: d.fecha, prioridad: d.prioridad, done: false })
        .select()
        .single()
      if (e || !pedRow) continue
      const pasosInsert = d.pasos.map((p, i) => ({
        pedido_id: pedRow.id, orden: i, nombre: p.nombre, direccion: p.direccion,
        coords: p.coords, contacto_id: null, contacto_nombre: p.contactoNombre, done: false,
      }))
      await supabase.from('pasos').insert(pasosInsert)
    }
    await loadAll()
  }

  // ── ADD PEDIDO ────────────────────────────────────────────
  const addPedido = useCallback(async (fields) => {
    try {
      const { data: pedRow, error: e } = await supabase
        .from('pedidos')
        .insert({
          cliente:   fields.cliente,
          producto:  fields.producto,
          fecha:     fields.fecha,
          prioridad: fields.prioridad,
          done:      false,
        })
        .select()
        .single()
      if (e) throw e

      const pasosInsert = (fields.pasos || []).map((p, i) => ({
        pedido_id:       pedRow.id,
        orden:           i,
        nombre:          p.nombre,
        direccion:       p.direccion      || '',
        coords:          p.coords         || null,
        contacto_id:     p.contactoId     || null,
        contacto_nombre: p.contactoNombre || '',
        done:            false,
      }))

      if (pasosInsert.length > 0) {
        const { error: e2 } = await supabase.from('pasos').insert(pasosInsert)
        if (e2) throw e2
      }

      await loadAll()
    } catch (err) {
      console.error('[usePedidos] addPedido error:', err)
      setError(err.message)
    }
  }, [loadAll])

  // ── COMPLETE PASO ─────────────────────────────────────────
  const completePaso = useCallback(async (pedidoId, pasoId) => {
    // Optimistic update
    setPedidos(prev => prev.map(p => {
      if (p.id !== pedidoId) return p
      const pasos = p.pasos.map(s => s.id === pasoId ? { ...s, done: true } : s)
      return { ...p, pasos, done: pasos.every(s => s.done) }
    }))

    try {
      // pasoId es string "dbId" — buscar el dbId numérico
      const pedido = pedidos.find(p => p.id === pedidoId)
      const paso   = pedido?.pasos.find(s => s.id === pasoId)
      if (!paso) return

      const { error: e } = await supabase
        .from('pasos')
        .update({ done: true })
        .eq('id', paso.dbId)
      if (e) throw e

      // Si todos los pasos del pedido están done, marcar pedido done también
      const allDone = pedido.pasos.map(s => s.id === pasoId ? true : s.done).every(Boolean)
      if (allDone) {
        await supabase.from('pedidos').update({ done: true }).eq('id', pedidoId)
        setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, done: true } : p))
      }
    } catch (err) {
      console.error('[usePedidos] completePaso error:', err)
      await loadAll() // revert
    }
  }, [pedidos, loadAll])

  // ── UNCOMPLETE PASO ───────────────────────────────────────
  const uncompletePaso = useCallback(async (pedidoId, pasoId) => {
    setPedidos(prev => prev.map(p => {
      if (p.id !== pedidoId) return p
      const pasos = p.pasos.map(s => s.id === pasoId ? { ...s, done: false } : s)
      return { ...p, pasos, done: false }
    }))

    try {
      const pedido = pedidos.find(p => p.id === pedidoId)
      const paso   = pedido?.pasos.find(s => s.id === pasoId)
      if (!paso) return

      await supabase.from('pasos').update({ done: false }).eq('id', paso.dbId)
      await supabase.from('pedidos').update({ done: false }).eq('id', pedidoId)
    } catch (err) {
      console.error('[usePedidos] uncompletePaso error:', err)
      await loadAll()
    }
  }, [pedidos, loadAll])

  // ── COMPLETE PEDIDO (todos los pasos) ─────────────────────
  const completePedido = useCallback(async (id) => {
    setPedidos(prev => prev.map(p => {
      if (p.id !== id) return p
      return { ...p, done: true, pasos: p.pasos.map(s => ({ ...s, done: true })) }
    }))

    try {
      await supabase.from('pedidos').update({ done: true }).eq('id', id)
      await supabase.from('pasos').update({ done: true }).eq('pedido_id', id)
    } catch (err) {
      console.error('[usePedidos] completePedido error:', err)
      await loadAll()
    }
  }, [loadAll])

  // ── DELETE PEDIDO ─────────────────────────────────────────
  const deletePedido = useCallback(async (id) => {
    setPedidos(prev => prev.filter(p => p.id !== id))
    try {
      // pasos se eliminan en cascada (on delete cascade)
      const { error: e } = await supabase.from('pedidos').delete().eq('id', id)
      if (e) throw e
    } catch (err) {
      console.error('[usePedidos] deletePedido error:', err)
      await loadAll()
    }
  }, [loadAll])

  return { pedidos, loading, error, addPedido, completePaso, uncompletePaso, completePedido, deletePedido }
}
