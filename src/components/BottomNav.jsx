import { useState } from 'react'
import { getTodayStr } from '../utils/dateUtils'
import AddressInput from '../components/AddressInput'

const INITIAL_FORM = {
  cliente: '', producto: '',
  origen: '', origenCoords: null,
  destino: '', destinoCoords: null,
  fecha: getTodayStr(), prioridad: 'normal',
}

const CATEGORIA_ICONS = {
  'Imprenta': '🖨️', 'Troqueladora': '✂️',
  'Proveedor': '📦', 'Cliente': '🏢', 'Otro': '📋',
}

function ContactoPicker({ contactos, onSelect, onClose }) {
  const [search, setSearch] = useState('')

  const filtered = contactos.filter(c =>
    !search || c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    c.categoria.toLowerCase().includes(search.toLowerCase())
  )

  // Agrupar por categoría
  const grupos = {}
  filtered.forEach(c => {
    if (!grupos[c.categoria]) grupos[c.categoria] = []
    grupos[c.categoria].push(c)
  })

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300, display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ background: 'var(--surface)', borderRadius: '16px 16px 0 0', width: '100%', maxHeight: '75vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>Seleccionar contacto</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, color: 'var(--ink3)', cursor: 'pointer' }}>×</button>
        </div>

        {/* Search */}
        <div style={{ padding: '0 12px 10px', flexShrink: 0 }}>
          <div style={{ background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px' }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="var(--ink3)" strokeWidth="1.3"/>
              <path d="M10 10l2.5 2.5" stroke="var(--ink3)" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar…" autoFocus
              style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font)', fontSize: 13, color: 'var(--ink)', flex: 1 }}
            />
          </div>
        </div>

        {/* Lista */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '0 12px 24px' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--ink3)', fontSize: 13 }}>Sin resultados</div>
          ) : (
            Object.entries(grupos).map(([cat, items]) => (
              <div key={cat} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6, padding: '0 2px' }}>
                  {CATEGORIA_ICONS[cat]} {cat}
                </div>
                {items.map(c => (
                  <div
                    key={c.id}
                    onClick={() => onSelect(c)}
                    style={{
                      padding: '11px 12px', borderRadius: 'var(--r)', border: '1px solid var(--border)',
                      marginBottom: 6, cursor: 'pointer', background: 'var(--surface)',
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{c.nombre}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      📍 {c.direccion}
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default function NewPedidoPage({ onAdd, onNavigate, MAPBOX_TOKEN, contactos = [] }) {
  const [form, setForm]         = useState(INITIAL_FORM)
  const [errors, setErrors]     = useState({})
  const [picker, setPicker]     = useState(null) // 'origen' | 'destino' | null

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const setAddress = (field, coordsField) => (text, coords) =>
    setForm(prev => ({ ...prev, [field]: text, [coordsField]: coords || null }))

  const selectContacto = (contacto) => {
    if (picker === 'origen') {
      setForm(prev => ({ ...prev, origen: contacto.direccion, origenCoords: contacto.coords }))
    } else {
      setForm(prev => ({ ...prev, destino: contacto.direccion, destinoCoords: contacto.coords }))
    }
    setPicker(null)
  }

  const validate = () => {
    const required = ['cliente', 'producto', 'origen', 'destino']
    const next = {}
    required.forEach(k => { if (!form[k].trim()) next[k] = true })
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    onAdd({ ...form })
    setForm({ ...INITIAL_FORM, fecha: getTodayStr() })
    setErrors({})
    onNavigate('tasks')
  }

  const fieldClass = name => `frow${errors[name] ? ' frow--error' : ''}`

  return (
    <div className="page">
      <div className="form-scroll">
        <div className="form-inner">

          {/* Info */}
          <div className="form-section">Información del pedido</div>
          <div className="fcard">
            <div className={fieldClass('cliente')}>
              <div className="fi">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="3" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M5 3V2a2 2 0 014 0v1" stroke="currentColor" strokeWidth="1.3" />
                </svg>
              </div>
              <div className="fcol">
                <div className="flabel">Cliente *</div>
                <input type="text" value={form.cliente} onChange={set('cliente')} placeholder="Nombre de la empresa" />
              </div>
            </div>
            <div className={fieldClass('producto')}>
              <div className="fi">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 4h10M2 7h7M2 10h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              </div>
              <div className="fcol">
                <div className="flabel">Producto / Descripción *</div>
                <textarea value={form.producto} onChange={set('producto')} placeholder="Ej. 300 folders con plastificado" />
              </div>
            </div>
          </div>

          {/* Ruta */}
          <div className="form-section">Ruta</div>
          <div className="fcard">
            {/* Origen */}
            <div className={fieldClass('origen')} style={{ overflow: 'visible' }}>
              <div className="fi" style={{ color: 'var(--blue)' }}>
                <svg width="10" height="10" viewBox="0 0 10 10">
                  <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  <circle cx="5" cy="5" r="2" fill="currentColor" />
                </svg>
              </div>
              <div className="fcol" style={{ overflow: 'visible' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="flabel">
                    Recoger en *
                    {form.origenCoords && <span style={{ color: 'var(--green)', marginLeft: 6 }}>✓</span>}
                  </div>
                  {contactos.length > 0 && (
                    <button
                      onClick={() => setPicker('origen')}
                      style={{ fontSize: 10, fontWeight: 600, color: 'var(--blue)', background: 'var(--blue-bg)', border: '1px solid #93C5FD', borderRadius: 4, padding: '2px 7px', cursor: 'pointer' }}
                    >
                      📋 Agenda
                    </button>
                  )}
                </div>
                <AddressInput value={form.origen} onChange={setAddress('origen', 'origenCoords')} placeholder="Busca o escribe la dirección" token={MAPBOX_TOKEN} />
              </div>
            </div>

            {/* Destino */}
            <div className={fieldClass('destino')} style={{ overflow: 'visible' }}>
              <div className="fi" style={{ color: 'var(--green)' }}>
                <svg width="10" height="10" viewBox="0 0 10 10">
                  <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  <circle cx="5" cy="5" r="2" fill="currentColor" />
                </svg>
              </div>
              <div className="fcol" style={{ overflow: 'visible' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="flabel">
                    Entregar en *
                    {form.destinoCoords && <span style={{ color: 'var(--green)', marginLeft: 6 }}>✓</span>}
                  </div>
                  {contactos.length > 0 && (
                    <button
                      onClick={() => setPicker('destino')}
                      style={{ fontSize: 10, fontWeight: 600, color: 'var(--blue)', background: 'var(--blue-bg)', border: '1px solid #93C5FD', borderRadius: 4, padding: '2px 7px', cursor: 'pointer' }}
                    >
                      📋 Agenda
                    </button>
                  )}
                </div>
                <AddressInput value={form.destino} onChange={setAddress('destino', 'destinoCoords')} placeholder="Busca o escribe la dirección" token={MAPBOX_TOKEN} />
              </div>
            </div>
          </div>

          {/* Detalles */}
          <div className="form-section">Detalles</div>
          <div className="grid2">
            <div className="fcard">
              <div className="frow">
                <div className="fi">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="1.5" y="2.5" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M4 1.5V3.5M10 1.5V3.5M1.5 5.5h11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="fcol">
                  <div className="flabel">Fecha límite</div>
                  <input type="date" value={form.fecha} onChange={set('fecha')} />
                </div>
              </div>
            </div>
            <div className="fcard">
              <div className="frow">
                <div className="fi">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M7 4v3.5l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="fcol">
                  <div className="flabel">Prioridad</div>
                  <select value={form.prioridad} onChange={set('prioridad')}>
                    <option value="normal">Normal</option>
                    <option value="urgente">Urgente</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {Object.keys(errors).length > 0 && (
            <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 12, paddingLeft: 2 }}>
              Completa los campos requeridos (*) para continuar.
            </p>
          )}

          <button className="submit-btn" onClick={handleSubmit}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1.5v11M1.5 7h11" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Registrar pedido
          </button>
        </div>
      </div>

      {/* Picker de contactos */}
      {picker && (
        <ContactoPicker
          contactos={contactos}
          onSelect={selectContacto}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  )
}
