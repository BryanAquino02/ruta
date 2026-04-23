import { useEffect, useRef, useState, useMemo } from 'react'

function detectZona(address) {
  const a = (address || '').toLowerCase()
  if (/jr\. ica|polvos azules|sheraton|centro|wilson|abancay|quilca|gamarra/.test(a)) return 'Centro'
  if (/san isidro|isidro/.test(a))    return 'San Isidro'
  if (/miraflores/.test(a))           return 'Miraflores'
  if (/la molina|molina/.test(a))     return 'La Molina'
  if (/lince/.test(a))                return 'Lince'
  if (/san borja|borja/.test(a))      return 'San Borja'
  if (/surco|santiago/.test(a))       return 'Surco'
  if (/pueblo libre/.test(a))         return 'Pueblo Libre'
  if (/barranco/.test(a))             return 'Barranco'
  return 'Otros'
}

const ZONA_COLORS = {
  'Centro': '#2563EB', 'San Isidro': '#7C3AED', 'Miraflores': '#0891B2',
  'La Molina': '#059669', 'Lince': '#D97706', 'San Borja': '#DC2626',
  'Surco': '#DB2777', 'Pueblo Libre': '#65A30D', 'Barranco': '#0D9488',
  'Otros': '#6B7280',
}

const PASO_ICONS = ['①','②','③','④','⑤','⑥','⑦','⑧']

function distKm(a, b) {
  const R = 6371, dLat = (b.lat - a.lat) * Math.PI / 180, dLng = (b.lng - a.lng) * Math.PI / 180
  const x = Math.sin(dLat/2) ** 2 + Math.cos(a.lat * Math.PI/180) * Math.cos(b.lat * Math.PI/180) * Math.sin(dLng/2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x))
}

// Extrae todos los puntos mapeables de un pedido (pasos con coords)
function getPuntosFromPedido(pedido) {
  if (!pedido.pasos) return []
  return pedido.pasos
    .map((paso, i) => paso.coords ? {
      lat: paso.coords.lat, lng: paso.coords.lng,
      address: paso.direccion,
      pedido, paso, pasoIndex: i,
      type: i === pedido.pasos.length - 1 ? 'destino' : 'paso',
    } : null)
    .filter(Boolean)
}

function PedidoRow({ pedido, onSelect, selected }) {
  const pasosPendientes = (pedido.pasos || []).filter(s => !s.done)
  const pasosTotal = (pedido.pasos || []).length
  const completedCount = pasosTotal - pasosPendientes.length

  return (
    <div
      className={`map-pedido-row${selected ? ' map-pedido-row--active' : ''}`}
      onClick={() => onSelect(pedido)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', flex: 1 }}>{pedido.cliente}</span>
        <span style={{
          fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
          background: pedido.done ? 'var(--green-bg)' : pedido.prioridad === 'urgente' ? 'var(--red-bg)' : 'var(--blue-bg)',
          color: pedido.done ? 'var(--green)' : pedido.prioridad === 'urgente' ? 'var(--red)' : 'var(--blue)',
        }}>
          {pedido.done ? 'Entregado' : pedido.prioridad}
        </span>
      </div>
      {/* Progreso de pasos */}
      <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 4 }}>
        {completedCount}/{pasosTotal} pasos · {pedido.producto}
      </div>
      {/* Pasos resumidos */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {(pedido.pasos || []).map((paso, i) => (
          <span key={paso.id || i} style={{
            fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 500,
            background: paso.done ? 'var(--green-bg)' : 'var(--bg)',
            color: paso.done ? 'var(--green)' : 'var(--ink3)',
            border: `1px solid ${paso.done ? 'var(--green)' : 'var(--border)'}`,
            textDecoration: paso.done ? 'line-through' : 'none',
          }}>
            {paso.nombre}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function MapPage({ pedidos, contactos = [], MAPBOX_TOKEN }) {
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

  // Todos los puntos mapeables (pasos con coords)
  const allPoints = useMemo(() => filtered.flatMap(getPuntosFromPedido), [filtered])

  // ── INIT MAP ──
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return
    if (!MAPBOX_TOKEN || MAPBOX_TOKEN === 'TU_TOKEN_AQUI') { setMapError(true); return }
    if (!window.mapboxgl) { setMapError(true); return }

    try {
      window.mapboxgl.accessToken = MAPBOX_TOKEN
      const map = new window.mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-77.0428, -12.0464],
        zoom: 11, attributionControl: false, fadeDuration: 0,
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

  // ── RENDER MARKERS ──
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !window.mapboxgl) return
    const map = mapRef.current

    markersRef.current.forEach(m => m.remove())
    markersRef.current = []
    if (map.getLayer('route'))  map.removeLayer('route')
    if (map.getSource('route')) map.removeSource('route')

    if (allPoints.length === 0) return

    const bounds = new window.mapboxgl.LngLatBounds()

    allPoints.forEach((pt) => {
      const { pedido, paso, pasoIndex } = pt
      const isLast = pasoIndex === (pedido.pasos.length - 1)
      const zona   = detectZona(pt.address || '')
      const color  = paso.done ? '#9CA3AF' : (isLast ? '#16A34A' : (ZONA_COLORS[zona] || '#2563EB'))

      const el = document.createElement('div')
      el.style.cssText = `
        width: 30px; height: 30px; border-radius: 50%;
        background: ${color}; border: 2.5px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.25);
        display: flex; align-items: center; justify-content: center;
        font-size: 13px; font-weight: 700; color: white;
        cursor: pointer; font-family: Inter, sans-serif;
        opacity: ${paso.done ? '0.5' : '1'};
      `
      el.textContent = PASO_ICONS[pasoIndex] || `${pasoIndex + 1}`

      el.addEventListener('click', () => setSelected(pedido))

      const marker = new window.mapboxgl.Marker({ element: el })
        .setLngLat([pt.lng, pt.lat])
        .setPopup(
          new window.mapboxgl.Popup({ offset: 20, closeButton: false, maxWidth: '200px' })
            .setHTML(`
              <div style="font-family:Inter,sans-serif">
                <div style="font-size:11px;color:#9AA3B5;margin-bottom:2px">${pedido.cliente}</div>
                <div style="font-size:12px;font-weight:700;color:#0F1117;margin-bottom:2px">${paso.nombre}</div>
                ${paso.contactoNombre ? `<div style="font-size:11px;color:#2563EB">${paso.contactoNombre}</div>` : ''}
                <div style="font-size:11px;color:#9AA3B5;margin-top:2px">${pt.address || ''}</div>
              </div>
            `)
        )
        .addTo(map)

      markersRef.current.push(marker)
      bounds.extend([pt.lng, pt.lat])
    })

    // Línea de ruta por pedido (conecta pasos de cada pedido)
    const pedidosConPuntos = filtered.filter(p => getPuntosFromPedido(p).length > 1)
    const allCoords = []
    pedidosConPuntos.forEach(p => {
      const pts = getPuntosFromPedido(p)
      pts.forEach(pt => allCoords.push([pt.lng, pt.lat]))
    })

    if (allCoords.length > 1) {
      map.addSource('route', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'LineString', coordinates: allCoords } },
      })
      map.addLayer({
        id: 'route', type: 'line', source: 'route',
        paint: { 'line-color': '#2563EB', 'line-width': 2, 'line-dasharray': [2, 3], 'line-opacity': 0.5 },
      })
    }

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: { top: 60, bottom: 60, left: 40, right: 40 }, maxZoom: 14, duration: 800 })
    }
  }, [allPoints, mapLoaded, filtered])

  // ── FLY TO SELECTED ──
  useEffect(() => {
    if (!selected || !mapRef.current) return
    const pts = getPuntosFromPedido(selected)
    if (pts.length > 0) mapRef.current.flyTo({ center: [pts[0].lng, pts[0].lat], zoom: 14, duration: 600 })
  }, [selected])

  const zonas = {}
  allPoints.forEach(pt => {
    const z = detectZona(pt.address || '')
    if (!zonas[z]) zonas[z] = 0
    zonas[z]++
  })

  return (
    <div className="page">
      {/* Filtros */}
      <div className="map-filterbar">
        {[['all','Todos'],['pending','Pendientes'],['urgent','Urgentes']].map(([val, label]) => (
          <button key={val} className={`map-filter-btn${activeFilter === val ? ' map-filter-btn--active' : ''}`} onClick={() => setFilter(val)}>
            {label}
          </button>
        ))}
      </div>

      {/* Mapa */}
      <div style={{ position: 'relative', height: 260, flexShrink: 0, background: 'var(--bg)' }}>
        <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

        {mapError && (
          <div style={{ position: 'absolute', inset: 0, background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>Token de Mapbox inválido</div>
            <div style={{ fontSize: 12, color: 'var(--ink3)', textAlign: 'center', padding: '0 32px' }}>Revisa <code>VITE_MAPBOX_TOKEN</code> en Vercel</div>
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
            {Object.entries(zonas).map(([zona, count]) => (
              <div key={zona} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: ZONA_COLORS[zona] || '#6B7280', flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'var(--ink2)', fontWeight: 500 }}>{zona}</span>
                <span style={{ fontSize: 11, color: 'var(--ink3)', marginLeft: 4 }}>{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lista de pedidos con pasos */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '10px 16px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Pedidos del día
          </span>
          <span style={{ fontSize: 11, color: 'var(--ink3)' }}>{PASO_ICONS[0]}…{PASO_ICONS[3]} pasos en mapa</span>
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
