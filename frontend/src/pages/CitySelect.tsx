import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

interface City {
  _id: string
  code: string
  name: string
  flag: string
  active: boolean
}

export default function CitySelect() {
  const navigate = useNavigate()
  const [cities, setCities] = useState<City[]>([])

  useEffect(() => {
    api.get('/quests/cities').then(r => setCities(r.data)).catch(() => {
      setCities([
        { _id: '1', code: 'hk', name: 'Hong Kong', flag: 'HK', active: true },
        { _id: '2', code: 'macau', name: 'Macau', flag: 'MO', active: false },
        { _id: '3', code: 'guangzhou', name: 'Guangzhou', flag: 'CN', active: false },
      ])
    })
  }, [])

  function pick(city: City) {
    localStorage.setItem('city', city.code)
    navigate('/quests')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-white px-6 py-10">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm gap-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight">QUESTS HK</h1>
          <p className="text-sm text-gray-400 mt-1">Select city</p>
        </div>

        <div className="w-full rounded-2xl overflow-hidden shadow-lg aspect-video bg-gray-100 relative">
          <img
            src="/hero.jpg"
            alt="Quest"
            className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center -z-10">
            <span className="text-6xl">🗺️</span>
          </div>
        </div>

        <div className="w-full flex flex-col gap-3">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-400 self-start mb-1"
          >
            ← Back to language
          </button>

          {cities.map(city => (
            <button
              key={city._id}
              onClick={() => city.active && pick(city)}
              disabled={!city.active}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-full text-left font-bold text-base transition-colors ${
                city.active
                  ? 'bg-[#FFD600] text-black shadow-sm active:scale-[0.98]'
                  : 'bg-[#FFD600]/30 text-gray-400 cursor-not-allowed'
              }`}
            >
              <span className="font-extrabold text-sm uppercase tracking-wider min-w-[2rem]">{city.code.toUpperCase().slice(0, 2)}</span>
              <span>{city.name}{!city.active ? ' (coming soon)' : ''}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center mt-8">
        DENIS IVANOV LIMITED · No.:79643900<br />
        18/F 299 QRC, 287-299 Queen's Road Central, Sheung Wan, Hong Kong.
      </p>
    </div>
  )
}
