import { useEffect, useRef, useState } from 'react'
import { useGeocoding } from '../hooks/useGeocoding'

function detectZona(address) {
  const a = address.toLowerCase()
  if (/jr\. ica|polvos azules|sheraton|centro|wilson|abancay|quilca|gamarra/.test(a)) return 'Centro'
  if (/san isidro|isidro/.test(a))    return 'San Isidro'
  if (/miraflores/.test(a))           return 'Miraflores'
  if (/la molina|molina/.test(a))     return 'La Molina'
  if (/lince/.test(a))                return 'Lince'
  if (/san borja|borja/.test(a))      return 'San Borja'
  if (/surco|santiago/.test(a))       return 'Surco'
  if (/pueblo libre/.test(a))         return 'Pueblo Libre'
  if (/barranco/.test(a))             return 'Barranco'
  if (/jesus maria|jesús maría/.test(a)) return 'Jesús María'
  if (/magdalena/.test(a))            return 'Magdalena'
  if (/surquillo/.test(a))            return 'Surquillo'
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
  'Barranco':     '#0D9488',
  'Jesús María':  '#7C3AED',
  'Magdalena':    '#B45309',
  'Surquillo':    '#6D28D9',
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
    if (!MAPBOX_TOKEN || MAPBOX_TOKEN === 'TU_TOKEN_AQUI') { setMapError(true); return }
    if (!window.mapboxgl) { setMapError(true); return }

    try {
      window.mapboxgl.accessToken = MAPBOX_TOKEN
      const map = new window.mapboxgl.Map({
        container: mapContainer.current,
        style:     'mapbox://styles/mapbox/light-v11',
        center:    [-77.0428, -12.0464],
        zoom:      11,
        attributionControl: false,
        // Mejora el rendimiento en móvil
        fadeDuration: 0,
      })
      map.addControl(new window.mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right')
      map.on('load',  () => setMapLoaded(true))
      map.on('error', () => setMapError(true))
      mapRef.current = map
    } catch { setMapError(true) }

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; setMapLoaded(false) }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── RENDER MARKERS (nativos Mapbox — no se desprenden al mover) ──
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !window.mapboxgl) return
    const map = mapRef.current

    // Limpiar markers anteriores
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    // Limpiar ruta anterior
    if (map.getLayer('route'))  map.removeLayer('route')
    if (map.getSource('route')) map.removeSource('route')

    if (points.length === 0) return

    const bounds = new window.mapboxgl.LngLatBounds()

    points.forEach((pt) => {
      const zona  = detectZona(pt.address || pt.pedido.origen)
      const color = pt.type === 'origen' ? (ZONA_COLORS[zona] || '#2563EB') : '#16A34A'

      // Usar marcador nativo con color — no se desprende al hacer scroll/zoom
      const marker = new window.mapboxgl.Marker({ color, scale: 0.85 })
        .setLngLat([pt.lng, pt.lat])
        .setPopup(
          new window.mapboxgl.Popup({ offset: 25, closeButton: false, maxWidth: '200px' })
            .setHTML(`
              <div style="font-family:Inter,sans-serif">
                <div style="font-size:12px;font-weight:700;color:#0F1117;margin-bottom:2px">${pt.pedido.cliente}</div>
                <div style="font-size:11px;color:#5A6478">${pt.type === 'origen' ? '📦 Recojo' : '🏢 Entrega'}</div>
                <div style="font-size:11px;color:#9AA3B5;margin-top:2px">${pt.address || ''}</div>
              </div>
            `)
        )
        .addTo(map)

      marker.getElement().addEventListener('click', () => setSelected(pt.pedido))
      markersRef.current.push(marker)
      bounds.extend([pt.lng, pt.lat])
    })

    // Línea de ruta punteada
    const coords = points.map(p => [p.lng, p.lat])
    map.addSource('route', {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'LineString', coordinates: coords } },
    })
    map.addLayer({
      id: 'route', type: 'line', source: 'route',
      paint: { 'line-color': '#2563EB', 'line-width': 2, 'line-dasharray': [2, 3], 'line-opacity': 0.5 },
    })

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: { top: 60, bottom: 60, left: 40, right: 40 }, maxZoom: 14, duration: 800 })
    }
  }, [points, mapLoaded])

  // ── FLY TO SELECTED ──
  useEffect(() => {
    if (!selected || !mapRef.current) return
    const pt = points.find(p => p.pedido.id === selected.id && p.type === 'origen')
    if (pt) mapRef.current.flyTo({ center: [pt.lng, pt.lat], zoom: 14, duration: 600 })
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
        {[['all','Todos'],['pending','Pendientes'],['urgent','Urgentes']].map(([val, label]) => (
          <button
            key={val}
            className={`map-filter-btn${activeFilter === val ? ' map-filter-btn--active' : ''}`}
            onClick={() => setFilter(val)}
          >
            {label}
          </button>
        ))}
        {geocoding && (
          <span style={{ fontSize: 11, color: 'var(--ink3)', marginLeft: 'auto' }}>
            Buscando…
          </span>
        )}
      </div>

      {/* Mapa */}
      <div style={{ position: 'relative', height: 280, flexShrink: 0, background: 'var(--bg)' }}>
        <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

        {mapError && (
          <div style={{ position: 'absolute', inset: 0, background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>Token de Mapbox inválido</div>
            <div style={{ fontSize: 12, color: 'var(--ink3)', textAlign: 'center', padding: '0 32px' }}>
              Revisa <code>VITE_MAPBOX_TOKEN</code> en Vercel
            </div>
          </div>
        )}

        {!mapLoaded && !mapError && (
          <div style={{ position: 'absolute', inset: 0, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--ink3)' }}>Cargando mapa…</span>
          </div>
        )}

        {/* Leyenda */}
        {mapLoaded && Object.keys(zonas).length > 0 && (
          <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(255,255,255,0.93)', borderRadius: 8, padding: '8px 10px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 5 }}>
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
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pedidos del día</span>
          <span style={{ fontSize: 11, color: 'var(--ink3)' }}>📦 Recojo · 🏢 Entrega</span>
        </div>
        <div style={{ padding: '0 12px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.length === 0
            ? <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--ink3)', fontSize: 13 }}>No hay pedidos</div>
            : filtered.map(p => (
                <PedidoRow key={p.id} pedido={p} selected={selected?.id === p.id} onSelect={setSelected} />
              ))
          }
        </div>
      </div>
    </div>
  )
}
