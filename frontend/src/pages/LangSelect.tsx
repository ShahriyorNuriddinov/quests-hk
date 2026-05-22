import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Onboarding from '../components/Onboarding'

const LANGS = [
  { code: 'ru', label: 'Русский язык' },
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
]

export default function LangSelect() {
  const navigate = useNavigate()
  const { i18n } = useTranslation()
  const [showOnboarding, setShowOnboarding] = useState(false)

  function pick(code: string) {
    i18n.changeLanguage(code)
    localStorage.setItem('lang', code)
    if (!localStorage.getItem('onboarded')) {
      setShowOnboarding(true)
    } else {
      navigate('/quests')
    }
  }

  function doneOnboarding() {
    localStorage.setItem('onboarded', '1')
    navigate('/quests')
  }

  if (showOnboarding) return <Onboarding onDone={doneOnboarding} />

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-white px-6 py-10">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm gap-8">
        <div className="text-center">
          <div className="text-3xl mb-1">🇨🇳 🇭🇰 🇲🇴</div>
          <h1 className="text-3xl font-extrabold tracking-tight">QUESTS HK</h1>
        </div>

        <div className="w-full rounded-2xl overflow-hidden shadow-lg aspect-video bg-gray-100">
          <img
            src="/hero.jpg"
            alt="Quest"
            className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <div className="w-full h-full bg-gradient-to-br from-yellow-200 to-yellow-400 flex items-center justify-center -mt-[100%]">
            <span className="text-6xl">🗺️</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full">
          {LANGS.map(l => (
            <button key={l.code} onClick={() => pick(l.code)} className="btn-yellow">
              {l.label}
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
