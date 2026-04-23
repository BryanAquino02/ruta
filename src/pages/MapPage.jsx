import { useEffect, useRef, useState, useMemo } from 'react'
import { useGeocoding } from '../hooks/useGeocoding'

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

// ── OPTIMIZACIÓN DE RUTA ──
// Calcula distancia en km entre dos coordenadas (Haversine)
function distKm(a, b) {
  const R  = 6371
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLng = (b.lng - a.lng) * Math.PI / 180
  const x = Math.sin(dLat/2) ** 2 +
    Math.cos(a.lat * Math.PI/180) * Math.cos(b.lat * Math.PI/180) * Math.sin(dLng/2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x))
}

// Algoritmo nearest-neighbor para orden óptimo de recogidas
function optimizarRuta(points) {
  const origenes = points.filter(p => p.type === 'origen')
  if (origenes.length <= 1) return points

  const visitados = new Set()
  const orden     = []
  let actual      = origenes[0]
  visitados.add(actual.pedido.id)
  orden.push(actual)

  while (orden.length < origenes.length) {
    let nearest = null
    let minDist = Infinity
    for (const p of origenes) {
      if (visitados.has(p.pedido.id)) continue
      const d = distKm({ lat: actual.lat, lng: actual.lng }, { lat: p.lat, lng: p.lng })
      if (d < minDist) { minDist = d; nearest = p }
    }
    if (!nearest) break
    visitados.add(nearest.pedido.id)
    orden.push(nearest)
    actual = nearest
  }

  // Añadir destinos después de cada recogida en el orden optimizado
  const result = []
  orden.forEach(o => {
    result.push(o)
    const dest = points.find(p => p.pedido.id === o.pedido.id && p.type === 'destino')
    if (dest) result.push(dest)
  })
  return result
}

// Detectar puntos muy cercanos (< 400m) para sugerir agrupación
function detectarCercanos(points) {
  const origenes = points.filter(p => p.type === 'origen')
  const grupos   = []

  for (let i = 0; i < origenes.length; i++) {
    for (let j = i + 1; j < origenes.length; j++) {
      const d = distKm(origenes[i], origenes[j])
      if (d < 0.4) { // 400 metros
        grupos.push({
          a:    origenes[i].pedido,
          b:    origenes[j].pedido,
          dist: Math.round(d * 1000),
        })
      }
    }
  }
  return grupos
}

function ZonaBadge({ zona }) {
  const color = ZONA_COLORS[zona] || ZONA_COLORS['Otros']
  return (
    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: color + '18', color, border: `1px solid ${color}30`, flexShrink: 0 }}>
      {zona}
    </span>
  )
}

function PedidoRow({ pedido, onSelect, selected, orden }) {
  const zonaO = detectZona(pedido.origen)
  const zonaD = detectZona(pedido.destino)
  return (
    <div
      className={`map-pedido-row${selected ? ' map-pedido-row--active' : ''}`}
      onClick={() => onSelect(pedido)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        {orden && (
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--ink)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {orden}
          </div>
        )}
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', flex: 1 }}>{pedido.cliente}</span>
        <span style={{
          fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
          background: pedido.done ? 'var(--green-bg)' : pedido.prioridad === 'urgente' ? 'var(--red-bg)' : 'var(--blue-bg)',
          color: pedido.done ? 'var(--green)' : pedido.prioridad === 'urgente' ? 'var(--red)' : 'var(--blue)',
        }}>
          {pedido.done ? 'Entregado' : pedido.prioridad}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <ZonaBadge zona={zonaO} />
        <span style={{ fontSize: 11, color: 'var(--ink3)', alignSelf: 'center' }}>→</span>
        <ZonaBadge zona={zonaD} />
      </div>
      <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {pedido.origen.split(',')[0]}
      </div>
    </div>
  )
}

export default function MapPage({ pedidos, contactos = [], MAPBOX_TOKEN }) {
  const mapContainer = useRef(null)
  const mapRef       = useRef(null)
  const markersRef   = useRef([])
  const contactMarkersRef = useRef([])
  const [selected, setSelected]   = useState(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError]   = useState(false)
  const [activeFilter, setFilter] = useState('all')
  const [showOptima, setShowOptima] = useState(false)

  const filtered = pedidos.filter(p => {
    if (activeFilter === 'pending') return !p.done
    if (activeFilter === 'urgent')  return !p.done && p.prioridad === 'urgente'
    return true
  })

  const { points, loading: geocoding } = useGeocoding(filtered, MAPBOX_TOKEN)

  // Ruta optimizada
  const optimizedPoints = useMemo(() => optimizarRuta(points), [points])
  const rutaPoints      = showOptima ? optimizedPoints : points

  // Orden de pedidos optimizado
  const ordenOptimo = useMemo(() => {
    const origen = optimizedPoints.filter(p => p.type === 'origen')
    const map    = {}
    origen.forEach((p, i) => { map[p.pedido.id] = i + 1 })
    return map
  }, [optimizedPoints])

  // Sugerencias de agrupación
  const cercanos = useMemo(() => detectarCercanos(points), [points])

  // Contactos relevantes (los que tienen pedido activo)
  const contactosActivos = useMemo(() => {
    const pedidosActivos = pedidos.filter(p => !p.done)
    return contactos.filter(c =>
      c.coords && pedidosActivos.some(p =>
        p.origen.toLowerCase().includes(c.nombre.toLowerCase()) ||
        p.destino.toLowerCase().includes(c.nombre.toLowerCase())
      )
    )
  }, [pedidos, contactos])

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

  // ── RENDER MARKERS DE PEDIDOS ──
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !window.mapboxgl) return
    const map = mapRef.current

    markersRef.current.forEach(m => m.remove())
    markersRef.current = []
    if (map.getLayer('route'))  map.removeLayer('route')
    if (map.getSource('route')) map.removeSource('route')

    if (rutaPoints.length === 0) return

    const bounds = new window.mapboxgl.LngLatBounds()

    rutaPoints.forEach((pt, idx) => {
      const zona  = detectZona(pt.address || pt.pedido.origen)
      const color = pt.type === 'origen' ? (ZONA_COLORS[zona] || '#2563EB') : '#16A34A'

      const el = document.createElement('div')
      el.style.cssText = `
        width: 28px; height: 28px; border-radius: 50%;
        background: ${color}; border: 2.5px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.25);
        display: flex; align-items: center; justify-content: center;
        font-size: 11px; font-weight: 700; color: white;
        cursor: pointer; font-family: Inter, sans-serif;
      `
      // Número de orden en modo óptimo
      if (showOptima && pt.type === 'origen') {
        el.textContent = ordenOptimo[pt.pedido.id] || ''
      } else {
        el.innerHTML = pt.type === 'origen' ? '📦' : '🏢'
        el.style.fontSize = '12px'
      }

      el.addEventListener('click', () => setSelected(pt.pedido))

      const marker = new window.mapboxgl.Marker({ element: el })
        .setLngLat([pt.lng, pt.lat])
        .setPopup(
          new window.mapboxgl.Popup({ offset: 20, closeButton: false, maxWidth: '200px' })
            .setHTML(`
              <div style="font-family:Inter,sans-serif">
                <div style="font-size:12px;font-weight:700;color:#0F1117;margin-bottom:2px">${pt.pedido.cliente}</div>
                <div style="font-size:11px;color:#5A6478">${pt.type === 'origen' ? '📦 Recojo' : '🏢 Entrega'}</div>
                <div style="font-size:11px;color:#9AA3B5;margin-top:2px">${pt.address || ''}</div>
              </div>
            `)
        )
        .addTo(map)

      markersRef.current.push(marker)
      bounds.extend([pt.lng, pt.lat])
    })

    // Línea de ruta
    const coords = rutaPoints.map(p => [p.lng, p.lat])
    map.addSource('route', {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'LineString', coordinates: coords } },
    })
    map.addLayer({
      id: 'route', type: 'line', source: 'route',
      paint: {
        'line-color': showOptima ? '#16A34A' : '#2563EB',
        'line-width': showOptima ? 3 : 2,
        'line-dasharray': showOptima ? [1, 0] : [2, 3],
        'line-opacity': 0.6,
      },
    })

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: { top: 60, bottom: 60, left: 40, right: 40 }, maxZoom: 14, duration: 800 })
    }
  }, [rutaPoints, mapLoaded, showOptima, ordenOptimo])

  // ── MARKERS DE CONTACTOS ACTIVOS ──
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !window.mapboxgl) return

    contactMarkersRef.current.forEach(m => m.remove())
    contactMarkersRef.current = []

    contactosActivos.forEach(c => {
      const el = document.createElement('div')
      el.style.cssText = `
        width: 24px; height: 24px; border-radius: 6px;
        background: #F59E0B; border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        display: flex; align-items: center; justify-content: center;
        font-size: 12px; cursor: pointer;
      `
      el.innerHTML = '⭐'
      el.title = c.nombre

      const marker = new window.mapboxgl.Marker({ element: el })
        .setLngLat([c.coords.lng, c.coords.lat])
        .setPopup(
          new window.mapboxgl.Popup({ offset: 18, closeButton: false })
            .setHTML(`
              <div style="font-family:Inter,sans-serif">
                <div style="font-size:12px;font-weight:700;color:#0F1117">${c.nombre}</div>
                <div style="font-size:11px;color:#5A6478">${c.categoria}</div>
                ${c.telefono ? `<div style="font-size:11px;color:#9AA3B5">${c.telefono}</div>` : ''}
              </div>
            `)
        )
        .addTo(mapRef.current)

      contactMarkersRef.current.push(marker)
    })
  }, [contactosActivos, mapLoaded])

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

  const pendientes = filtered.filter(p => !p.done)

  return (
    <div className="page">
      {/* Filtros + toggle ruta óptima */}
      <div className="map-filterbar">
        {[['all','Todos'],['pending','Pendientes'],['urgent','Urgentes']].map(([val, label]) => (
          <button key={val} className={`map-filter-btn${activeFilter === val ? ' map-filter-btn--active' : ''}`} onClick={() => setFilter(val)}>
            {label}
          </button>
        ))}
        {geocoding && <span style={{ fontSize: 11, color: 'var(--ink3)', marginLeft: 'auto' }}>Buscando…</span>}
        {!geocoding && pendientes.length > 1 && (
          <button
            onClick={() => setShowOptima(v => !v)}
            style={{
              marginLeft: 'auto', padding: '5px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
              border: `1px solid ${showOptima ? 'var(--green)' : 'var(--border)'}`,
              background: showOptima ? 'var(--green-bg)' : 'var(--bg)',
              color: showOptima ? 'var(--green)' : 'var(--ink2)', cursor: 'pointer',
            }}
          >
            {showOptima ? '✓ Ruta óptima' : '⚡ Optimizar'}
          </button>
        )}
      </div>

      {/* Sugerencias de agrupación */}
      {cercanos.length > 0 && (
        <div style={{ background: '#FFFBEB', borderBottom: '1px solid #FDE68A', padding: '10px 14px', flexShrink: 0 }}>
          {cercanos.map((g, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ fontSize: 14 }}>💡</span>
              <div style={{ fontSize: 12, color: '#92400E', lineHeight: 1.4 }}>
                <strong>{g.a.cliente}</strong> y <strong>{g.b.cliente}</strong> tienen recogidas a solo <strong>{g.dist}m</strong> de distancia — aprovecha el viaje.
              </div>
            </div>
          ))}
        </div>
      )}

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
            {Object.entries(zonas).map(([zona, ps]) => (
              <div key={zona} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: ZONA_COLORS[zona] || '#6B7280', flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'var(--ink2)', fontWeight: 500 }}>{zona}</span>
                <span style={{ fontSize: 11, color: 'var(--ink3)', marginLeft: 4 }}>{ps.length}</span>
              </div>
            ))}
            {contactosActivos.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, borderTop: '1px solid var(--border)', paddingTop: 4, marginTop: 2 }}>
                <span style={{ fontSize: 10 }}>⭐</span>
                <span style={{ fontSize: 11, color: 'var(--ink2)', fontWeight: 500 }}>Contactos activos</span>
                <span style={{ fontSize: 11, color: 'var(--ink3)', marginLeft: 4 }}>{contactosActivos.length}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lista de pedidos */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '10px 16px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {showOptima ? '⚡ Orden óptimo' : 'Pedidos del día'}
          </span>
          <span style={{ fontSize: 11, color: 'var(--ink3)' }}>📦 Recojo · 🏢 Entrega</span>
        </div>
        <div style={{ padding: '0 12px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.length === 0
            ? <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--ink3)', fontSize: 13 }}>No hay pedidos</div>
            : (showOptima
                ? optimizedPoints.filter(p => p.type === 'origen').map(p => (
                    <PedidoRow key={p.pedido.id} pedido={p.pedido} selected={selected?.id === p.pedido.id} onSelect={setSelected} orden={ordenOptimo[p.pedido.id]} />
                  ))
                : filtered.map(p => (
                    <PedidoRow key={p.id} pedido={p} selected={selected?.id === p.id} onSelect={setSelected} />
                  ))
              )
          }
        </div>
      </div>
    </div>
  )
}
