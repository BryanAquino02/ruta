import { useState, useEffect } from 'react'

// Cache en memoria para no re-geocodificar la misma dirección
const geoCache = {}

/**
 * Extrae la dirección "limpia" de un campo origen/destino.
 * Ej: "Imprenta El Centro — Jr. Ica 346" → "Jr. Ica 346, Lima, Perú"
 * Ej: "Oficina Mitsui — San Isidro"       → "San Isidro, Lima, Perú"
 */
function cleanAddress(raw) {
  // Toma la parte después del "—" si existe, si no usa todo
  const parts = raw.split('—')
  const addr  = (parts[1] || parts[0]).trim()
  return `${addr}, Lima, Perú`
}

/**
 * Geocodifica una dirección usando Mapbox Geocoding API.
 * Retorna { lat, lng } o null si falla.
 *
 * @param {string} address
 * @param {string} token - Mapbox access token
 * @returns {Promise<{lat: number, lng: number} | null>}
 */
async function geocode(address, token) {
  if (geoCache[address]) return geoCache[address]

  try {
    const query    = encodeURIComponent(address)
    const url      = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json`
                   + `?access_token=${token}&country=pe&limit=1&language=es`
    const res      = await fetch(url)
    const data     = await res.json()
    const feature  = data.features?.[0]

    if (!feature) return null

    const [lng, lat] = feature.center
    const result = { lat, lng }
    geoCache[address] = result
    return result
  } catch {
    return null
  }
}

/**
 * Hook que geocodifica los orígenes y destinos de todos los pedidos.
 * Retorna una lista de puntos con coordenadas, listos para pintar en el mapa.
 *
 * @param {Array}  pedidos
 * @param {string} token - Mapbox access token
 * @returns {{ points: Array, loading: boolean }}
 */
export function useGeocoding(pedidos, token) {
  const [points,  setPoints]  = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token || token === 'TU_TOKEN_AQUI' || pedidos.length === 0) {
      setPoints([])
      return
    }

    let cancelled = false

    async function run() {
      setLoading(true)

      const tasks = pedidos.flatMap((pedido) => [
        { pedido, type: 'origen',  address: cleanAddress(pedido.origen)  },
        { pedido, type: 'destino', address: cleanAddress(pedido.destino) },
      ])

      // Geocodificar en paralelo (máx 10 a la vez para no sobrecargar)
      const results = []
      for (let i = 0; i < tasks.length; i += 10) {
        const batch = tasks.slice(i, i + 10)
        const coords = await Promise.all(batch.map(t => geocode(t.address, token)))
        coords.forEach((coord, j) => {
          if (coord) {
            results.push({ ...batch[j], ...coord })
          }
        })
      }

      if (!cancelled) {
        setPoints(results)
        setLoading(false)
      }
    }

    run()
    return () => { cancelled = true }
  }, [pedidos, token])

  return { points, loading }
}
