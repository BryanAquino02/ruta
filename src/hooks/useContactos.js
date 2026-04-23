import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'miruta_contactos_v1'

const CATEGORIAS = ['Imprenta', 'Troqueladora', 'Proveedor', 'Cliente', 'Otro']

function buildDemoContactos() {
  return [
    {
      id: 1,
      nombre: 'Imprenta El Centro',
      categoria: 'Imprenta',
      direccion: 'Jr. Ica 346, Lima',
      coords: { lat: -12.0516, lng: -77.0311 },
      telefono: '01 427-1234',
      notas: 'Preguntar por Don Carlos',
    },
    {
      id: 2,
      nombre: 'Troqueladora Rápida',
      categoria: 'Troqueladora',
      direccion: 'Sheraton, Lima Centro',
      coords: { lat: -12.0531, lng: -77.0353 },
      telefono: '987 654 321',
      notas: 'Solo efectivo',
    },
    {
      id: 3,
      nombre: 'Don Carlos Pintura',
      categoria: 'Proveedor',
      direccion: 'Polvos Azules, Lima',
      coords: { lat: -12.0544, lng: -77.0297 },
      telefono: '999 111 222',
      notas: '',
    },
  ]
}

export { CATEGORIAS }

export function useContactos() {
  const [contactos, setContactos] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {}
    return buildDemoContactos()
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contactos))
  }, [contactos])

  const addContacto = useCallback((fields) => {
    setContactos(prev => [...prev, { id: Date.now(), ...fields }])
  }, [])

  const updateContacto = useCallback((id, fields) => {
    setContactos(prev => prev.map(c => c.id === id ? { ...c, ...fields } : c))
  }, [])

  const deleteContacto = useCallback((id) => {
    setContactos(prev => prev.filter(c => c.id !== id))
  }, [])

  return { contactos, addContacto, updateContacto, deleteContacto }
}
