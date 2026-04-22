import { useState, useEffect, useRef } from 'react'

const geoCache = {}

function buildQuery(raw) {
  const parts  = raw.split('—').map(s => s.trim())
  const nombre = parts[0] || ''
  const dir    = parts[1] || ''

  const lugaresConocidos = [
    'jockey plaza', 'larcomar', 'real plaza', 'plaza san miguel',
    'mega plaza', 'plaza norte', 'open plaza', 'wong', 'metro',
    'plaza vea', 'tottus', 'ripley', 'saga', 'sheraton', 'marriott',
    'hospital', 'clinica', 'universidad', 'pucp', 'ulima', 'upc',
    'aeropuerto', 'jorge chavez',
  ]

  const nombreLower = nombre.toLowerCase()
  const esConocido  = lugaresConocidos.some(l => nombreLower.includes(l))

  if (esConocido) return `${nombre}, Lima, Perú`
  if (dir && /jr\.|av\.|calle|psje|\d{3,}/.test(dir.toLowerCase())) return `${dir}, Lima, Perú`
  if (dir) return `${dir}, Lima, Perú`
  return `${nombre}, Lima, Perú`
}

async function geocode(raw, token) {
  const query    = buildQuery(raw)
  const cacheKey = query.toLowerCase()
  if (geoCache[cacheKey]) return { ...geoCache[cacheKey], query }

  try {
    const encoded = encodeURIComponent(query)
    const bbox    = '-77.2,-12.3,-76.7,-11.8'
    const url     = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json`
                  + `?access_token=${token}&country=pe&bbox=${bbox}&limit=1&language=es`
    const res     = await fetch(url)
    const data    = await res.json()
    const feat    = data.features?.[0]
    if (!feat) return null
    const [lng, lat] = feat.center
    const result = { lat, lng, query }
    geoCache[cacheKey] = { lat, lng }
    return result
  } catch { return null }
}

export function useGeocoding(pedidos, token) {
  const [points,  setPoints]  = useState([])
  const [loading, setLoading] = useState(false)

  const pedidosKey = pedidos.map(p => `${p.id}-${p.origen}-${p.destino}`).join('|')
  const prevKey    = useRef(null)

  useEffect(() => {
    if (pedidosKey === prevKey.current) return
    prevKey.current = pedidosKey

    if (!token || token === 'TU_TOKEN_AQUI' || pedidos.length === 0) {
      setPoints([])
      return
    }

    let cancelled = false

    async function run() {
      setLoading(true)
      const results = []

      for (const pedido of pedidos) {
        // Si el pedido tiene coordenadas guardadas (del autocomplete), usarlas directamente
        if (pedido.origenCoords) {
          results.push({
            pedido, type: 'origen',
            lat: pedido.origenCoords.lat,
            lng: pedido.origenCoords.lng,
            address: pedido.origen,
          })
        } else {
          const coord = await geocode(pedido.origen, token)
          if (coord) results.push({ pedido, type: 'origen', lat: coord.lat, lng: coord.lng, address: coord.query })
        }

        if (pedido.destinoCoords) {
          results.push({
            pedido, type: 'destino',
            lat: pedido.destinoCoords.lat,
            lng: pedido.destinoCoords.lng,
            address: pedido.destino,
          })
        } else {
          const coord = await geocode(pedido.destino, token)
          if (coord) results.push({ pedido, type: 'destino', lat: coord.lat, lng: coord.lng, address: coord.query })
        }

        if (cancelled) return
      }

      if (!cancelled) {
        setPoints(results)
        setLoading(false)
      }
    }

    run()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedidosKey, token])

  return { points, loading }
}
