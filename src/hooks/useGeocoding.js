import { useState, useEffect, useRef } from 'react'

const geoCache = {}

function cleanAddress(raw) {
  const parts = raw.split('—')
  const addr  = (parts[1] || parts[0]).trim()
  return `${addr}, Lima, Perú`
}

async function geocode(address, token) {
  if (geoCache[address]) return geoCache[address]
  try {
    const query = encodeURIComponent(address)
    const url   = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json`
                + `?access_token=${token}&country=pe&limit=1&language=es`
    const res   = await fetch(url)
    const data  = await res.json()
    const feat  = data.features?.[0]
    if (!feat) return null
    const [lng, lat] = feat.center
    const result = { lat, lng }
    geoCache[address] = result
    return result
  } catch {
    return null
  }
}

export function useGeocoding(pedidos, token) {
  const [points,  setPoints]  = useState([])
  const [loading, setLoading] = useState(false)

  // Usar una key estable basada en los IDs para evitar re-renders infinitos
  const pedidosKey = pedidos.map(p => p.id).join(',')
  const prevKey    = useRef(null)

  useEffect(() => {
    // Solo re-geocodificar si los pedidos cambiaron realmente
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
        { pedido, type: 'origen',  address: cleanAddress(pedido.origen)  },
        { pedido, type: 'destino', address: cleanAddress(pedido.destino) },
      ])

      const results = []
      for (let i = 0; i < tasks.length; i += 10) {
        const batch  = tasks.slice(i, i + 10)
        const coords = await Promise.all(batch.map(t => geocode(t.address, token)))
        coords.forEach((coord, j) => {
          if (coord) results.push({ ...batch[j], ...coord })
        })
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
