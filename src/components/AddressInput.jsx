import { useState, useRef, useEffect, useCallback } from 'react'

/**
 * Campo de dirección con autocomplete de Mapbox.
 * Muestra sugerencias en tiempo real mientras el usuario escribe.
 * Al seleccionar, guarda texto + coordenadas.
 *
 * @param {{
 *   value: string,
 *   onChange: (text: string, coords?: {lat, lng}) => void,
 *   placeholder: string,
 *   token: string,
 *   hasError: boolean,
 * }} props
 */
export default function AddressInput({ value, onChange, placeholder, token, hasError }) {
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen]               = useState(false)
  const [loading, setLoading]         = useState(false)
  const debounceRef = useRef(null)
  const wrapperRef  = useRef(null)

  // Cerrar sugerencias al tocar fuera
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('touchstart', handleClick)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('touchstart', handleClick)
    }
  }, [])

  const search = useCallback(async (query) => {
    if (!query || query.length < 3 || !token) {
      setSuggestions([])
      setOpen(false)
      return
    }

    setLoading(true)
    try {
      const encoded = encodeURIComponent(query)
      // bbox de Lima para resultados locales
      const bbox    = '-77.2,-12.3,-76.7,-11.8'
      const url     = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json`
                    + `?access_token=${token}&country=pe&bbox=${bbox}&limit=5&language=es`
                    + `&types=address,poi,place,neighborhood,locality`

      const res  = await fetch(url)
      const data = await res.json()

      const results = (data.features || []).map(f => ({
        id:          f.id,
        text:        f.place_name,
        shortText:   f.text,
        lat:         f.center[1],
        lng:         f.center[0],
      }))

      setSuggestions(results)
      setOpen(results.length > 0)
    } catch {
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [token])

  const handleChange = (e) => {
    const val = e.target.value
    onChange(val, null) // actualiza texto sin coordenadas aún

    // Debounce 300ms para no spamear la API
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 300)
  }

  const handleSelect = (suggestion) => {
    onChange(suggestion.text, { lat: suggestion.lat, lng: suggestion.lng })
    setSuggestions([])
    setOpen(false)
  }

  const handleFocus = () => {
    if (suggestions.length > 0) setOpen(true)
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative', flex: 1, minWidth: 0 }}>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        placeholder={placeholder}
        autoComplete="off"
        style={{
          width: '100%', border: 'none', outline: 'none',
          fontFamily: 'var(--font)', fontSize: 14, fontWeight: 400,
          color: 'var(--ink)', background: 'transparent', padding: 0,
        }}
      />

      {/* Dropdown de sugerencias */}
      {open && suggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: -14, // alinear con el borde del fcard
          right: -14,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r)',
          boxShadow: 'var(--shadow-md)',
          zIndex: 100,
          overflow: 'hidden',
        }}>
          {loading && (
            <div style={{ padding: '10px 14px', fontSize: 12, color: 'var(--ink3)' }}>
              Buscando…
            </div>
          )}
          {suggestions.map((s, i) => (
            <div
              key={s.id}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(s) }}
              onTouchEnd={(e)  => { e.preventDefault(); handleSelect(s) }}
              style={{
                padding: '10px 14px',
                borderBottom: i < suggestions.length - 1 ? '1px solid var(--border)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
              }}
            >
              {/* Pin icon */}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                <path d="M7 1C4.79 1 3 2.79 3 5c0 3 4 8 4 8s4-5 4-8c0-2.21-1.79-4-4-4z"
                  stroke="var(--ink3)" strokeWidth="1.2" fill="none"/>
                <circle cx="7" cy="5" r="1.2" fill="var(--ink3)"/>
              </svg>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.shortText}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.text.replace(s.shortText + ', ', '')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
