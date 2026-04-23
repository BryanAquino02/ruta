import { useState } from 'react'
import { getTodayStr } from '../utils/dateUtils'
import AddressInput from '../components/AddressInput'

const CATEGORIA_ICONS = {
  'Imprenta': '🖨️', 'Troqueladora': '✂️',
  'Proveedor': '📦', 'Cliente': '🏢', 'Otro': '📋',
}

// ── ContactoPicker (modal bottom sheet) ──
function ContactoPicker({ contactos, onSelect, onClose }) {
  const [search, setSearch] = useState('')
  const filtered = contactos.filter(c =>
    !search ||
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    c.categoria.toLowerCase().includes(search.toLowerCase())
  )
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
        <div style={{ padding: '0 12px 10px', flexShrink: 0 }}>
          <div style={{ background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px' }}>
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar…" autoFocus
              style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font)', fontSize: 13, color: 'var(--ink)', flex: 1 }}
            />
          </div>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: '0 12px 24px' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--ink3)', fontSize: 13 }}>Sin resultados</div>
          ) : (
            Object.entries(grupos).map(([cat, items]) => (
              <div key={cat} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                  {CATEGORIA_ICONS[cat]} {cat}
                </div>
                {items.map(c => (
                  <div key={c.id} onClick={() => onSelect(c)}
                    style={{ padding: '11px 12px', borderRadius: 'var(--r)', border: '1px solid var(--border)', marginBottom: 6, cursor: 'pointer', background: 'var(--surface)' }}>
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

// ── PasoEditor — fila editable de un paso ──
function PasoEditor({ paso, index, total, contactos, MAPBOX_TOKEN, onChange, onRemove, onMoveUp, onMoveDown }) {
  const [showPicker, setShowPicker] = useState(false)

  const set = (field) => (val) => onChange({ ...paso, [field]: val })

  const selectContacto = (c) => {
    onChange({ ...paso, contactoId: c.id, contactoNombre: c.nombre, direccion: c.direccion, coords: c.coords || null })
    setShowPicker(false)
  }

  const clearContacto = () => onChange({ ...paso, contactoId: null, contactoNombre: '', direccion: '', coords: null })

  return (
    <div style={{
      background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)',
      padding: '12px 12px 10px', position: 'relative', overflow: 'visible',
    }}>
      {/* Cabecera del paso */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        {/* Número */}
        <div style={{
          width: 22, height: 22, borderRadius: '50%', background: 'var(--ink)', color: '#fff',
          fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {index + 1}
        </div>

        {/* Nombre del paso */}
        <input
          type="text"
          value={paso.nombre}
          onChange={e => set('nombre')(e.target.value)}
          placeholder="Nombre del paso (ej. Imprimir)"
          style={{
            flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--ink)', border: 'none',
            background: 'transparent', outline: 'none', fontFamily: 'var(--font)',
          }}
        />

        {/* Controles orden + eliminar */}
        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          <button
            onClick={onMoveUp} disabled={index === 0}
            style={{ width: 24, height: 24, border: 'none', background: 'none', cursor: index === 0 ? 'default' : 'pointer', color: index === 0 ? 'var(--border)' : 'var(--ink3)', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Subir"
          >▲</button>
          <button
            onClick={onMoveDown} disabled={index === total - 1}
            style={{ width: 24, height: 24, border: 'none', background: 'none', cursor: index === total - 1 ? 'default' : 'pointer', color: index === total - 1 ? 'var(--border)' : 'var(--ink3)', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Bajar"
          >▼</button>
          {total > 1 && (
            <button
              onClick={onRemove}
              style={{ width: 24, height: 24, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Eliminar paso"
            >×</button>
          )}
        </div>
      </div>

      {/* Contacto */}
      <div style={{ marginBottom: 8 }}>
        {paso.contactoNombre ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--blue-bg)', border: '1px solid #93C5FD', borderRadius: 6, padding: '6px 10px' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--blue)', flex: 1 }}>📋 {paso.contactoNombre}</span>
            <button onClick={clearContacto} style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: 16, cursor: 'pointer', padding: 0, lineHeight: 1 }}>×</button>
          </div>
        ) : (
          contactos.length > 0 && (
            <button
              onClick={() => setShowPicker(true)}
              style={{ fontSize: 11, fontWeight: 600, color: 'var(--blue)', background: 'var(--blue-bg)', border: '1px solid #93C5FD', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', width: '100%', textAlign: 'left' }}
            >
              + Asignar contacto de la agenda
            </button>
          )
        )}
      </div>

      {/* Dirección */}
      <div style={{ overflow: 'visible' }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink3)', marginBottom: 4 }}>
          📍 Dirección {paso.coords && <span style={{ color: 'var(--green)' }}>✓</span>}
        </div>
        <AddressInput
          value={paso.direccion}
          onChange={(text, coords) => onChange({ ...paso, direccion: text, coords: coords || null })}
          placeholder="Busca o escribe la dirección"
          token={MAPBOX_TOKEN}
        />
      </div>

      {showPicker && (
        <ContactoPicker
          contactos={contactos}
          onSelect={selectContacto}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}

// ── Página principal ──
const INITIAL_FORM = {
  cliente: '', producto: '',
  fecha: getTodayStr(), prioridad: 'normal',
}

function newPaso(nombre = '') {
  return { _tempId: Date.now() + Math.random(), nombre, direccion: '', coords: null, contactoId: null, contactoNombre: '' }
}

export default function NewPedidoPage({ onAdd, onNavigate, MAPBOX_TOKEN, contactos = [] }) {
  const [form, setForm]   = useState(INITIAL_FORM)
  const [pasos, setPasos] = useState([newPaso('Recoger'), newPaso('Entregar')])
  const [errors, setErrors] = useState({})

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const updatePaso = (index, data) => setPasos(prev => prev.map((p, i) => i === index ? data : p))
  const removePaso = (index) => setPasos(prev => prev.filter((_, i) => i !== index))
  const addPasoAfter = () => setPasos(prev => [...prev, newPaso()])

  const movePaso = (index, dir) => {
    setPasos(prev => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const validate = () => {
    const next = {}
    if (!form.cliente.trim()) next.cliente = true
    if (!form.producto.trim()) next.producto = true
    if (pasos.length < 1) next.pasos = true
    pasos.forEach((p, i) => { if (!p.nombre.trim()) next[`paso_${i}`] = true })
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    onAdd({ ...form, pasos })
    setForm({ ...INITIAL_FORM, fecha: getTodayStr() })
    setPasos([newPaso('Recoger'), newPaso('Entregar')])
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

          {/* Pasos */}
          <div className="form-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Pasos del pedido</span>
            <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--ink3)' }}>{pasos.length} paso{pasos.length !== 1 ? 's' : ''}</span>
          </div>

          {errors.pasos && (
            <p style={{ color: 'var(--red)', fontSize: 12, marginBottom: 8, paddingLeft: 2 }}>Agrega al menos un paso.</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pasos.map((paso, i) => (
              <PasoEditor
                key={paso._tempId || i}
                paso={paso}
                index={i}
                total={pasos.length}
                contactos={contactos}
                MAPBOX_TOKEN={MAPBOX_TOKEN}
                onChange={(data) => updatePaso(i, data)}
                onRemove={() => removePaso(i)}
                onMoveUp={() => movePaso(i, -1)}
                onMoveDown={() => movePaso(i, 1)}
              />
            ))}
          </div>

          {/* Agregar paso */}
          <button
            onClick={addPasoAfter}
            style={{
              width: '100%', marginTop: 8, padding: '10px', borderRadius: 10, fontSize: 13,
              fontWeight: 600, color: 'var(--blue)', background: 'var(--blue-bg)',
              border: '1.5px dashed #93C5FD', cursor: 'pointer',
            }}
          >
            + Agregar paso
          </button>

          {/* Detalles */}
          <div className="form-section" style={{ marginTop: 16 }}>Detalles</div>
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
    </div>
  )
}
