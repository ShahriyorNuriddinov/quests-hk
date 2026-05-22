import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
})

interface Props {
  lat: number
  lng: number
  address: string
  onChange: (lat: number, lng: number) => void
  onAddressChange: (address: string) => void
}

const HK_CENTER: [number, number] = [22.3193, 114.1694]

export default function MapPicker({ lat, lng, address, onChange, onAddressChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const initial: [number, number] = lat && lng ? [lat, lng] : HK_CENTER
    const map = L.map(containerRef.current, { zoomControl: true }).setView(initial, 14)
    mapRef.current = map

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      maxZoom: 20,
    }).addTo(map)

    if (lat && lng) {
      const m = L.marker([lat, lng], { draggable: true }).addTo(map)
      markerRef.current = m
      m.on('dragend', () => {
        const pos = m.getLatLng()
        onChange(+pos.lat.toFixed(6), +pos.lng.toFixed(6))
      })
    }

    map.on('click', (e) => {
      const { lat: la, lng: lo } = e.latlng
      if (markerRef.current) {
        markerRef.current.setLatLng([la, lo])
      } else {
        const m = L.marker([la, lo], { draggable: true }).addTo(map)
        markerRef.current = m
        m.on('dragend', () => {
          const pos = m.getLatLng()
          onChange(+pos.lat.toFixed(6), +pos.lng.toFixed(6))
        })
      }
      onChange(+la.toFixed(6), +lo.toFixed(6))
    })

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current) return
    if (!lat || !lng) return
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng])
    } else {
      const m = L.marker([lat, lng], { draggable: true }).addTo(mapRef.current)
      markerRef.current = m
      m.on('dragend', () => {
        const pos = m.getLatLng()
        onChange(+pos.lat.toFixed(6), +pos.lng.toFixed(6))
      })
    }
    mapRef.current.setView([lat, lng], mapRef.current.getZoom())
  }, [lat, lng])

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 mt-1">
      <input
        type="text"
        value={address}
        onChange={e => onAddressChange(e.target.value)}
        placeholder="Введите адрес или место..."
        className="w-full text-sm text-gray-800 px-3 py-2.5 border-b border-gray-200 focus:outline-none focus:bg-yellow-50 transition-colors"
      />
      <div ref={containerRef} style={{ height: 220 }} />
      <div className="bg-gray-50 px-3 py-1.5 text-[11px] text-gray-400 flex items-center gap-3">
        <span>Нажмите на карту, чтобы выбрать точку</span>
        {lat && lng ? (
          <a
            href={`https://maps.google.com/?q=${lat},${lng}`}
            target="_blank"
            rel="noreferrer"
            className="ml-auto text-[#FFD600] font-semibold hover:underline whitespace-nowrap"
          >
            Открыть в Google Maps →
          </a>
        ) : null}
      </div>
    </div>
  )
}
