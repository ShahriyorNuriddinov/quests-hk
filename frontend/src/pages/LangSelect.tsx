import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Onboarding from '../components/Onboarding'

// Google Translate lang codes
const LANGS = [
  { code: 'ru', gtCode: null,    label: 'Русский язык', flag: '🇷🇺' },
  { code: 'en', gtCode: 'en',    label: 'English',      flag: '🇬🇧' },
  { code: 'zh', gtCode: 'zh-CN', label: '中文',          flag: '🇨🇳' },
]

function setGoogleTranslate(gtCode: string | null) {
  const domain = window.location.hostname
  if (!gtCode || gtCode === 'ru') {
    // Clear translation
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/'
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${domain}`
  } else {
    document.cookie = `/ru/${gtCode}; path=/; domain=${domain}`
    document.cookie = `googtrans=/ru/${gtCode}; path=/`
    document.cookie = `googtrans=/ru/${gtCode}; path=/; domain=.${domain}`
    // Also try triggering the widget select if loaded
    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement | null
    if (select) {
      select.value = gtCode
      select.dispatchEvent(new Event('change'))
    }
  }
}

export default function LangSelect() {
  const navigate = useNavigate()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [pending, setPending] = useState<string | null>(null)

  function pick(lang: typeof LANGS[0]) {
    setPending(lang.code)
    localStorage.setItem('lang', lang.code)
    setGoogleTranslate(lang.gtCode)

    if (!localStorage.getItem('onboarded')) {
      setShowOnboarding(true)
      setPending(null)
    } else {
      // Reload so Google Translate activates on the new page
      if (lang.gtCode) {
        window.location.href = '/quests'
      } else {
        navigate('/quests')
      }
    }
  }

  function doneOnboarding() {
    localStorage.setItem('onboarded', '1')
    const lang = localStorage.getItem('lang') || 'ru'
    const l = LANGS.find(x => x.code === lang)
    if (l?.gtCode) {
      window.location.href = '/quests'
    } else {
      navigate('/quests')
    }
  }

  if (showOnboarding) return <Onboarding onDone={doneOnboarding} />

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-white px-6 py-10">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm gap-8">
        <div className="text-center">
          <div className="text-3xl mb-1">🇨🇳 🇭🇰 🇲🇴</div>
          <h1 className="text-3xl font-extrabold tracking-tight">QUESTS HK</h1>
          <p className="text-sm text-gray-400 mt-1">Выберите язык / Select language</p>
        </div>

        <div className="w-full rounded-2xl overflow-hidden shadow-lg aspect-video bg-gray-100 relative">
          <img
            src="/hero.jpg"
            alt="Quest"
            className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-200 to-yellow-400 flex items-center justify-center -z-10">
            <span className="text-6xl">🗺️</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full">
          {LANGS.map(l => (
            <button
              key={l.code}
              onClick={() => pick(l)}
              disabled={pending === l.code}
              className="btn-yellow flex items-center justify-center gap-3 disabled:opacity-60"
            >
              <span className="text-xl">{l.flag}</span>
              <span>{l.label}</span>
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
