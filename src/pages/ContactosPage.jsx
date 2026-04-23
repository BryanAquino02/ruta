import { useState } from 'react'
import { CATEGORIAS } from '../hooks/useContactos'
import AddressInput from '../components/AddressInput'

const CATEGORIA_COLORS = {
  'Imprenta':     '#2563EB',
  'Troqueladora': '#7C3AED',
  'Proveedor':    '#D97706',
  'Cliente':      '#059669',
  'Otro':         '#6B7280',
}

const CATEGORIA_ICONS = {
  'Imprenta':     '🖨️',
  'Troqueladora': '✂️',
  'Proveedor':    '📦',
  'Cliente':      '🏢',
  'Otro':         '📋',
}

function ContactoCard({ contacto, onEdit, onDelete }) {
  const color = CATEGORIA_COLORS[contacto.categoria] || '#6B7280'
  const icon  = CATEGORIA_ICONS[contacto.categoria]  || '📋'

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--r)', padding: '13px 14px',
      boxShadow: 'var(--shadow-sm)', display: 'flex', gap: 12, alignItems: 'flex-start',
    }}>
      {/* Avatar */}
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: color + '15', border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
      }}>
        {icon}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{contacto.nombre}</span>
          <span style={{
            fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
            background: color + '15', color, border: `1px solid ${color}25`,
          }}>
            {contacto.categoria}
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: contacto.telefono ? 2 : 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          📍 {contacto.direccion}
        </div>
        {contacto.telefono && (
          <div style={{ fontSize: 12, color: 'var(--ink2)' }}>📞 {contacto.telefono}</div>
        )}
        {contacto.notas && (
          <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 3, fontStyle: 'italic' }}>{contacto.notas}</div>
        )}
      </div>

      {/* Acciones */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <button
          onClick={() => onEdit(contacto)}
          style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink3)', cursor: 'pointer' }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M8.5 1.5l2 2L4 10H2v-2L8.5 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
          </svg>
        </button>
        <button
          onClick={() => { if (window.confirm('¿Eliminar contacto?')) onDelete(contacto.id) }}
          style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink3)', cursor: 'pointer' }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 3h8M5 3V2h2v1M4.5 9.5l-.5-5M7.5 9.5l.5-5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

const EMPTY_FORM = { nombre: '', categoria: 'Imprenta', direccion: '', coords: null, telefono: '', notas: '' }

function ContactoForm({ initial, onSave, onCancel, MAPBOX_TOKEN }) {
  const [form, setForm] = useState(initial || EMPTY_FORM)

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const setDireccion = (text, coords) =>
    setForm(prev => ({ ...prev, direccion: text, coords: coords || prev.coords }))

  const valid = form.nombre.trim() && form.direccion.trim()

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      zIndex: 200, display: 'flex', alignItems: 'flex-end',
    }}>
      <div style={{
        background: 'var(--surface)', borderRadius: '16px 16px 0 0',
        width: '100%', padding: '20px 16px 32px',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>
            {initial ? 'Editar contacto' : 'Nuevo contacto'}
          </span>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--ink3)', cursor: 'pointer' }}>×</button>
        </div>

        {/* Categoría */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Categoría</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATEGORIAS.map(cat => (
              <button
                key={cat}
                onClick={() => setForm(prev => ({ ...prev, categoria: cat }))}
                style={{
                  padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  border: `1px solid ${form.categoria === cat ? CATEGORIA_COLORS[cat] : 'var(--border)'}`,
                  background: form.categoria === cat ? CATEGORIA_COLORS[cat] + '15' : 'var(--bg)',
                  color: form.categoria === cat ? CATEGORIA_COLORS[cat] : 'var(--ink2)',
                }}
              >
                {CATEGORIA_ICONS[cat]} {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Campos */}
        <div className="fcard" style={{ marginBottom: 12 }}>
          <div className="frow">
            <div className="fcol">
              <div className="flabel">Nombre *</div>
              <input type="text" value={form.nombre} onChange={set('nombre')} placeholder="Ej. Imprenta El Centro" style={{ width: '100%', border: 'none', outline: 'none', fontFamily: 'var(--font)', fontSize: 14, color: 'var(--ink)', background: 'transparent' }} />
            </div>
          </div>
          <div className="frow" style={{ overflow: 'visible' }}>
            <div className="fcol" style={{ overflow: 'visible' }}>
              <div className="flabel">
                Dirección *
                {form.coords && <span style={{ color: 'var(--green)', marginLeft: 6 }}>✓</span>}
              </div>
              <AddressInput
                value={form.direccion}
                onChange={setDireccion}
                placeholder="Busca la dirección"
                token={MAPBOX_TOKEN}
              />
            </div>
          </div>
          <div className="frow">
            <div className="fcol">
              <div className="flabel">Teléfono</div>
              <input type="tel" value={form.telefono} onChange={set('telefono')} placeholder="Opcional" style={{ width: '100%', border: 'none', outline: 'none', fontFamily: 'var(--font)', fontSize: 14, color: 'var(--ink)', background: 'transparent' }} />
            </div>
          </div>
          <div className="frow">
            <div className="fcol">
              <div className="flabel">Notas</div>
              <input type="text" value={form.notas} onChange={set('notas')} placeholder="Ej. Solo efectivo, preguntar por..." style={{ width: '100%', border: 'none', outline: 'none', fontFamily: 'var(--font)', fontSize: 14, color: 'var(--ink)', background: 'transparent' }} />
            </div>
          </div>
        </div>

        <button
          onClick={() => valid && onSave(form)}
          style={{
            width: '100%', padding: 14, borderRadius: 'var(--r)', border: 'none',
            background: valid ? 'var(--ink)' : 'var(--border)',
            color: valid ? '#fff' : 'var(--ink3)',
            fontSize: 14, fontWeight: 600, cursor: valid ? 'pointer' : 'default',
          }}
        >
          {initial ? 'Guardar cambios' : 'Agregar contacto'}
        </button>
      </div>
    </div>
  )
}

export default function ContactosPage({ contactos, onAdd, onUpdate, onDelete, MAPBOX_TOKEN }) {
  const [filtro, setFiltro]       = useState('Todos')
  const [showForm, setShowForm]   = useState(false)
  const [editing, setEditing]     = useState(null)
  const [search, setSearch]       = useState('')

  const categorias = ['Todos', ...CATEGORIAS]

  const filtered = contactos.filter(c => {
    const matchCat    = filtro === 'Todos' || c.categoria === filtro
    const matchSearch = !search || c.nombre.toLowerCase().includes(search.toLowerCase()) || c.direccion.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  // Agrupar por categoría
  const grupos = {}
  filtered.forEach(c => {
    if (!grupos[c.categoria]) grupos[c.categoria] = []
    grupos[c.categoria].push(c)
  })

  const handleSave = (form) => {
    if (editing) {
      onUpdate(editing.id, form)
      setEditing(null)
    } else {
      onAdd(form)
      setShowForm(false)
    }
  }

  return (
    <div className="page">
      {/* Search bar */}
      <div style={{ padding: '10px 14px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="var(--ink3)" strokeWidth="1.3"/>
            <path d="M10 10l2.5 2.5" stroke="var(--ink3)" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar contacto…"
            style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font)', fontSize: 13, color: 'var(--ink)', flex: 1 }}
          />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--ink3)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>}
        </div>
      </div>

      {/* Filtro por categoría */}
      <div style={{ display: 'flex', gap: 6, padding: '8px 14px', overflowX: 'auto', flexShrink: 0, background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
        {categorias.map(cat => (
          <button
            key={cat}
            onClick={() => setFiltro(cat)}
            style={{
              flexShrink: 0, padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer',
              border: `1px solid ${filtro === cat ? 'var(--blue)' : 'var(--border)'}`,
              background: filtro === cat ? 'var(--blue-bg)' : 'var(--surface)',
              color: filtro === cat ? 'var(--blue)' : 'var(--ink2)',
            }}
          >
            {cat === 'Todos' ? `Todos (${contactos.length})` : `${CATEGORIA_ICONS[cat]} ${cat}`}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 30px' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>
              {search ? 'Sin resultados' : 'No hay contactos'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink2)' }}>
              {search ? 'Intenta con otro término' : 'Agrega tu primer contacto con el botón +'}
            </div>
          </div>
        ) : (
          <div style={{ padding: '12px 12px 100px' }}>
            {Object.entries(grupos).map(([cat, items]) => (
              <div key={cat} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '0 2px', marginBottom: 8 }}>
                  {CATEGORIA_ICONS[cat]} {cat} · {items.length}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {items.map(c => (
                    <ContactoCard key={c.id} contacto={c} onEdit={c => { setEditing(c); setShowForm(false) }} onDelete={onDelete} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB agregar */}
      <button
        onClick={() => { setShowForm(true); setEditing(null) }}
        style={{
          position: 'fixed', bottom: 72, right: 16,
          width: 52, height: 52, borderRadius: '50%',
          background: 'var(--ink)', border: 'none',
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 50,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 4v12M4 10h12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Modal form */}
      {(showForm || editing) && (
        <ContactoForm
          initial={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null) }}
          MAPBOX_TOKEN={MAPBOX_TOKEN}
        />
      )}
    </div>
  )
}
