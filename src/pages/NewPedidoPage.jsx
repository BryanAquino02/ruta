import { useState } from 'react'
import { getTodayStr } from '../utils/dateUtils'

const INITIAL_FORM = {
  cliente:   '',
  producto:  '',
  origen:    '',
  destino:   '',
  fecha:     getTodayStr(),
  prioridad: 'normal',
}

/**
 * @param {{
 *   onAdd: (fields: object) => void,
 *   onNavigate: (page: string) => void,
 * }} props
 */
export default function NewPedidoPage({ onAdd, onNavigate }) {
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const validate = () => {
    const required = ['cliente', 'producto', 'origen', 'destino']
    const next = {}
    required.forEach((k) => { if (!form[k].trim()) next[k] = true })
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

  const fieldClass = (name) =>
    `frow${errors[name] ? ' frow--error' : ''}`

  return (
    <div className="page">
      <div className="form-scroll">
        <div className="form-inner">

          {/* Pedido info */}
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
                <input
                  type="text"
                  value={form.cliente}
                  onChange={set('cliente')}
                  placeholder="Nombre de la empresa"
                />
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
                <textarea
                  value={form.producto}
                  onChange={set('producto')}
                  placeholder="Ej. 300 folders con plastificado"
                />
              </div>
            </div>
          </div>

          {/* Route */}
          <div className="form-section">Ruta</div>
          <div className="fcard">
            <div className={fieldClass('origen')}>
              <div className="fi" style={{ color: 'var(--blue)' }}>
                <svg width="10" height="10" viewBox="0 0 10 10">
                  <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  <circle cx="5" cy="5" r="2" fill="currentColor" />
                </svg>
              </div>
              <div className="fcol">
                <div className="flabel">Recoger en *</div>
                <input
                  type="text"
                  value={form.origen}
                  onChange={set('origen')}
                  placeholder="Dirección de recojo"
                />
              </div>
            </div>

            <div className={fieldClass('destino')}>
              <div className="fi" style={{ color: 'var(--green)' }}>
                <svg width="10" height="10" viewBox="0 0 10 10">
                  <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  <circle cx="5" cy="5" r="2" fill="currentColor" />
                </svg>
              </div>
              <div className="fcol">
                <div className="flabel">Entregar en *</div>
                <input
                  type="text"
                  value={form.destino}
                  onChange={set('destino')}
                  placeholder="Dirección de entrega"
                />
              </div>
            </div>
          </div>

          {/* Details */}
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
    </div>
  )
}
