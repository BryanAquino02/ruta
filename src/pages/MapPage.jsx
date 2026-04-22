import { useEffect, useRef, useState } from 'react'
import { useGeocoding } from '../hooks/useGeocoding'

// ── ZONA DETECTION ──
function detectZona(address) {
  const a = address.toLowerCase()
  if (/jr\. ica|polvos azules|sheraton|centro|wilson|abancay|quilca/.test(a)) return 'Centro'
  if (/san isidro|isidro/.test(a))    return 'San Isidro'
  if (/miraflores/.test(a))           return 'Miraflores'
  if (/la molina|molina/.test(a))     return 'La Molina'
  if (/lince/.test(a))                return 'Lince'
  if (/san borja|borja/.test(a))      return 'San Borja'
  if (/surco/.test(a))                return 'Surco'
  if (/pueblo libre/.test(a))         return 'Pueblo Libre'
  return 'Otros'
}

const ZONA_COLORS = {
  'Centro':       '#2563EB',
  'San Isidro':   '#7C3AED',
  'Miraflores':   '#0891B2',
  'La Molina':    '#059669',
  'Lince':        '#D97706',
  'San Borja':    '#DC2626',
  'Surco':        '#DB2777',
  'Pueblo Libre': '#65A30D',
  'Otros':        '#6B7280',
}

function ZonaBadge({ zona }) {
  const color = ZONA_COLORS[zona] || ZONA_COLORS['Otros']
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '2px 7px',
      borderRadius: 4, background: color + '18', color,
      border: `1px solid ${color}30`, flexShrink: 0,
    }}>
      {zona}
    </span>
  )
}

function PedidoRow({ pedido, onSelect, selected }) {
  const zonaOrigen  = detectZona(pedido.origen)
  const zonaDestino = detectZona(pedido.destino)
  return (
    <div
      className={`map-pedido-row${selected ? ' map-pedido-row--active' : ''}`}
      onClick={() => onSelect(pedido)}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{pedido.cliente}</span>
        <span style={{
          fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
          background: pedido.done ? 'var(--green-bg)' : pedido.prioridad === 'urgente' ? 'var(--red-bg)' : 'var(--blue-bg)',
          color: pedido.done ? 'var(--green)' : pedido.prioridad === 'urgente' ? 'var(--red)' : 'var(--blue)',
        }}>
          {pedido.done ? 'Entregado' : pedido.prioridad}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <ZonaBadge zona={zonaOrigen} />
        <span style={{ fontSize: 11, color: 'var(--ink3)', alignSelf: 'center' }}>→</span>
        <ZonaBadge zona={zonaDestino} />
      </div>
      <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {pedido.origen.split('—')[0].trim()}
      </div>
    </div>
  )
}

/**
 * @param {{ pedidos: object[], MAPBOX_TOKEN: string }} props
 */
export default function MapPage({ pedidos, MAPBOX_TOKEN }) {
  const mapContainer = useRef(null)
  const mapRef       = useRef(null)
  const markersRef   = useRef([])
  const [selected, setSelected]   = useState(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError]   = useState(false)
  const [activeFilter, setFilter] = useState('all')

  const filtered = pedidos.filter(p => {
    if (activeFilter === 'pending') return !p.done
    if (activeFilter === 'urgent')  return !p.done && p.prioridad === 'urgente'
    return true
  })

  const { points, loading: geocoding } = useGeocoding(filtered, MAPBOX_TOKEN)

  // ── INIT MAP ──
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    if (!MAPBOX_TOKEN || MAPBOX_TOKEN === 'TU_TOKEN_AQUI') {
      setMapError(true)
      return
    }

    if (!window.mapboxgl) {
      setMapError(true)
      return
    }

    try {
      window.mapboxgl.accessToken = MAPBOX_TOKEN

      const map = new window.mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-77.0428, -12.0464], // Lima
        zoom: 11,
        attributionControl: false,
      })

      map.addControl(new window.mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right')
      map.on('load', () => setMapLoaded(true))
      map.on('error', () => setMapError(true))
      mapRef.current = map
    } catch {
      setMapError(true)
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        setMapLoaded(false)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── RENDER MARKERS ──
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !window.mapboxgl) return
    const map = mapRef.current

    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    if (map.getLayer('route'))  map.removeLayer('route')
    if (map.getSource('route')) map.removeSource('route')

    if (points.length === 0) return

    const bounds = new window.mapboxgl.LngLatBounds()

    points.forEach((pt) => {
      const zona  = detectZona(pt.address)
      const color = pt.type === 'origen' ? (ZONA_COLORS[zona] || '#2563EB') : '#16A34A'

      const el = document.createElement('div')
      el.style.cssText = `
        width: 32px; height: 32px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; font-size: 14px;
        transition: transform 0.15s;
      `
      el.innerHTML = pt.type === 'origen' ? '📦' : '🏢'
      el.title     = `${pt.type === 'origen' ? 'Recojo' : 'Entrega'}: ${pt.pedido.cliente}`

      el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.25)' })
      el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)' })
      el.addEventListener('click',      () => setSelected(pt.pedido))

      const popup = new window.mapboxgl.Popup({ offset: 20, closeButton: false, maxWidth: '220px' })
        .setHTML(`
          <div style="font-family:Inter,sans-serif;padding:2px">
            <div style="font-size:13px;font-weight:700;color:#0F1117;margin-bottom:3px">${pt.pedido.cliente}</div>
            <div style="font-size:11px;color:#5A6478">${pt.type === 'origen' ? '📦 Recojo' : '🏢 Entrega'}</div>
            <div style="font-size:11px;color:#9AA3B5;margin-top:2px">${pt.address}</div>
          </div>
        `)

      const marker = new window.mapboxgl.Marker({ element: el })
        .setLngLat([pt.lng, pt.lat])
        .setPopup(popup)
        .addTo(map)

      markersRef.current.push(marker)
      bounds.extend([pt.lng, pt.lat])
    })

    const coords = points.map(p => [p.lng, p.lat])
    map.addSource('route', {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'LineString', coordinates: coords } },
    })
    map.addLayer({
      id: 'route', type: 'line', source: 'route',
      paint: { 'line-color': '#2563EB', 'line-width': 2.5, 'line-dasharray': [2, 3], 'line-opacity': 0.55 },
    })

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: { top: 60, bottom: 60, left: 40, right: 40 }, maxZoom: 14, duration: 900 })
    }
  }, [points, mapLoaded])

  // ── FLY TO SELECTED ──
  useEffect(() => {
    if (!selected || !mapRef.current) return
    const pt = points.find(p => p.pedido.id === selected.id && p.type === 'origen')
    if (pt) mapRef.current.flyTo({ center: [pt.lng, pt.lat], zoom: 14, duration: 700 })
  }, [selected, points])

  const zonas = {}
  filtered.forEach(p => {
    const z = detectZona(p.origen)
    if (!zonas[z]) zonas[z] = []
    zonas[z].push(p)
  })

  return (
    <div className="page">

      {/* Filtros */}
      <div className="map-filterbar">
        {[['all', 'Todos'], ['pending', 'Pendientes'], ['urgent', 'Urgentes']].map(([val, label]) => (
          <button
            key={val}
            className={`map-filter-btn${activeFilter === val ? ' map-filter-btn--active' : ''}`}
            onClick={() => setFilter(val)}
          >
            {label}
          </button>
        ))}
        {geocoding && (
          <span style={{ fontSize: 11, color: 'var(--ink3)', marginLeft: 'auto', alignSelf: 'center' }}>
            Buscando ubicaciones…
          </span>
        )}
      </div>

      {/* Mapa */}
      <div style={{ position: 'relative', height: 280, flexShrink: 0, background: 'var(--bg)' }}>
        <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

        {mapError && (
          <div style={{
            position: 'absolute', inset: 0, background: 'var(--bg)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 4C10.48 4 6 8.48 6 14c0 7.5 10 18 10 18s10-10.5 10-18c0-5.52-4.48-10-10-10z"
                stroke="#9AA3B5" strokeWidth="1.8" fill="none"/>
              <circle cx="16" cy="14" r="3" stroke="#9AA3B5" strokeWidth="1.6"/>
            </svg>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>Token de Mapbox inválido</div>
            <div style={{ fontSize: 12, color: 'var(--ink3)', textAlign: 'center', padding: '0 32px', lineHeight: 1.5 }}>
              Reemplaza <code style={{ background: 'var(--border)', padding: '1px 5px', borderRadius: 4 }}>TU_TOKEN_AQUI</code> en <code style={{ background: 'var(--border)', padding: '1px 5px', borderRadius: 4 }}>App.jsx</code>
            </div>
          </div>
        )}

        {!mapLoaded && !mapError && (
          <div style={{
            position: 'absolute', inset: 0, background: 'var(--bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 13, color: 'var(--ink3)' }}>Cargando mapa…</span>
          </div>
        )}

        {mapLoaded && Object.keys(zonas).length > 0 && (
          <div style={{
            position: 'absolute', top: 10, left: 10,
            background: 'rgba(255,255,255,0.93)', borderRadius: 8,
            padding: '8px 10px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            display: 'flex', flexDirection: 'column', gap: 5,
          }}>
            {Object.entries(zonas).map(([zona, ps]) => (
              <div key={zona} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: ZONA_COLORS[zona] || '#6B7280', flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'var(--ink2)', fontWeight: 500 }}>{zona}</span>
                <span style={{ fontSize: 11, color: 'var(--ink3)', marginLeft: 4 }}>{ps.length}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lista */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '12px 16px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Pedidos del día
          </span>
          <span style={{ fontSize: 11, color: 'var(--ink3)' }}>📦 Recojo · 🏢 Entrega</span>
        </div>

        <div style={{ padding: '0 12px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--ink3)', fontSize: 13 }}>
              No hay pedidos para mostrar
            </div>
          ) : (
            filtered.map(p => (
              <PedidoRow
                key={p.id}
                pedido={p}
                selected={selected?.id === p.id}
                onSelect={setSelected}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
