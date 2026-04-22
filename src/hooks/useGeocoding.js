import { useState, useEffect, useRef } from 'react'

const geoCache = {}

/**
 * Construye una query de geocodificación inteligente.
 * Prioriza el nombre del lugar si es reconocible, si no usa la dirección.
 * Ej: "Jockey Plaza — Surco"        → "Jockey Plaza Lima Perú"
 *     "Imprenta El Centro — Jr. Ica" → "Jr. Ica Lima Perú"
 *     "Oficina Mitsui — San Isidro"  → "San Isidro Lima Perú"
 */
function buildQuery(raw) {
  const parts  = raw.split('—').map(s => s.trim())
  const nombre = parts[0] || ''
  const dir    = parts[1] || ''

  // Lista de lugares conocidos de Lima que Mapbox reconoce bien por nombre
  const lugaresConocidos = [
    'jockey plaza', 'larcomar', 'real plaza', 'plaza san miguel',
    'mega plaza', 'plaza norte', 'open plaza', 'boulevard',
    'wong', 'metro', 'plaza vea', 'tottus', 'ripley', 'saga',
    'sheraton', 'marriott', 'hilton', 'westin', 'swissotel',
    'hospital', 'clinica', 'universidad', 'pucp', 'ulima', 'upc',
    'aeropuerto', 'jorge chavez', 'miraflores', 'barranco',
    'san isidro', 'surco', 'la molina', 'lince', 'pueblo libre',
    'jesus maria', 'magdalena', 'san borja', 'surquillo',
  ]

  const nombreLower = nombre.toLowerCase()
  const esLugarConocido = lugaresConocidos.some(l => nombreLower.includes(l))

  // Si el nombre es un lugar conocido, usarlo directamente
  if (esLugarConocido) {
    return `${nombre}, Lima, Perú`
  }

  // Si hay dirección específica (Jr., Av., Calle, número), usarla
  if (dir && /jr\.|av\.|calle|psje|\d{3,}/.test(dir.toLowerCase())) {
    return `${dir}, Lima, Perú`
  }

  // Si la dirección es un distrito o zona, usarla
  if (dir) {
    return `${dir}, Lima, Perú`
  }

  // Fallback: usar el nombre completo
  return `${nombre}, Lima, Perú`
}

async function geocode(raw, token) {
  const query = buildQuery(raw)
  const cacheKey = query.toLowerCase()

  if (geoCache[cacheKey]) return { ...geoCache[cacheKey], query }

  try {
    const encoded = encodeURIComponent(query)
    // bbox de Lima para forzar resultados dentro de la ciudad
    const bbox    = '-77.2,-12.3,-76.7,-11.8'
    const url     = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json`
                  + `?access_token=${token}&country=pe&bbox=${bbox}&limit=1&language=es`

    const res  = await fetch(url)
    const data = await res.json()
    const feat = data.features?.[0]
    if (!feat) return null

    const [lng, lat] = feat.center
    const result = { lat, lng, query }
    geoCache[cacheKey] = { lat, lng }
    return result
  } catch {
    return null
  }
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

      const tasks = pedidos.flatMap((pedido) => [
        { pedido, type: 'origen',  raw: pedido.origen  },
        { pedido, type: 'destino', raw: pedido.destino },
      ])

      const results = []
      for (let i = 0; i < tasks.length; i += 6) {
        const batch  = tasks.slice(i, i + 6)
        const coords = await Promise.all(batch.map(t => geocode(t.raw, token)))
        coords.forEach((coord, j) => {
          if (coord) {
            results.push({
              ...batch[j],
              lat:     coord.lat,
              lng:     coord.lng,
              address: coord.query,
            })
          }
        })
        // Pequeña pausa para no saturar la API
        if (i + 6 < tasks.length) await new Promise(r => setTimeout(r, 100))
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
