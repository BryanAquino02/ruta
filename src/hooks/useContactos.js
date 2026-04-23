import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const CATEGORIAS = ['Imprenta', 'Troqueladora', 'Proveedor', 'Cliente', 'Otro']

function dbToApp(row) {
  return {
    id:        row.id,
    nombre:    row.nombre,
    categoria: row.categoria,
    direccion: row.direccion,
    coords:    row.coords || null,
    telefono:  row.telefono  || '',
    notas:     row.notas     || '',
  }
}

function buildDemoContactos() {
  return [
    { nombre: 'Imprenta El Centro',  categoria: 'Imprenta',    direccion: 'Jr. Ica 346, Lima',        coords: { lat: -12.0516, lng: -77.0311 }, telefono: '01 427-1234',  notas: 'Preguntar por Don Carlos' },
    { nombre: 'Troqueladora Rápida', categoria: 'Troqueladora', direccion: 'Sheraton, Lima Centro',    coords: { lat: -12.0531, lng: -77.0353 }, telefono: '987 654 321',  notas: 'Solo efectivo' },
    { nombre: 'Don Carlos Pintura',  categoria: 'Proveedor',    direccion: 'Polvos Azules, Lima',      coords: { lat: -12.0544, lng: -77.0297 }, telefono: '999 111 222',  notas: '' },
  ]
}

export { CATEGORIAS }

export function useContactos() {
  const [contactos, setContactos] = useState([])
  const [loading,   setLoading]   = useState(true)
  const seeded = { current: false }

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('contactos')
        .select('*')
        .order('nombre', { ascending: true })
      if (error) throw error

      if (data.length === 0 && !seeded.current) {
        seeded.current = true
        await seedDemo()
        return
      }
      setContactos(data.map(dbToApp))
    } catch (err) {
      console.error('[useContactos] loadAll error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  async function seedDemo() {
    const demos = buildDemoContactos()
    await supabase.from('contactos').insert(demos)
    await loadAll()
  }

  const addContacto = useCallback(async (fields) => {
    // Optimistic
    const temp = { id: `temp-${Date.now()}`, ...fields }
    setContactos(prev => [...prev, temp])
    try {
      const { data, error } = await supabase
        .from('contactos')
        .insert({
          nombre:    fields.nombre,
          categoria: fields.categoria,
          direccion: fields.direccion || '',
          coords:    fields.coords    || null,
          telefono:  fields.telefono  || '',
          notas:     fields.notas     || '',
        })
        .select()
        .single()
      if (error) throw error
      setContactos(prev => prev.map(c => c.id === temp.id ? dbToApp(data) : c))
    } catch (err) {
      console.error('[useContactos] addContacto error:', err)
      await loadAll()
    }
  }, [loadAll])

  const updateContacto = useCallback(async (id, fields) => {
    setContactos(prev => prev.map(c => c.id === id ? { ...c, ...fields } : c))
    try {
      const { error } = await supabase
        .from('contactos')
        .update({
          nombre:    fields.nombre,
          categoria: fields.categoria,
          direccion: fields.direccion || '',
          coords:    fields.coords    || null,
          telefono:  fields.telefono  || '',
          notas:     fields.notas     || '',
        })
        .eq('id', id)
      if (error) throw error
    } catch (err) {
      console.error('[useContactos] updateContacto error:', err)
      await loadAll()
    }
  }, [loadAll])

  const deleteContacto = useCallback(async (id) => {
    setContactos(prev => prev.filter(c => c.id !== id))
    try {
      const { error } = await supabase.from('contactos').delete().eq('id', id)
      if (error) throw error
    } catch (err) {
      console.error('[useContactos] deleteContacto error:', err)
      await loadAll()
    }
  }, [loadAll])

  return { contactos, loading, addContacto, updateContacto, deleteContacto }
}
