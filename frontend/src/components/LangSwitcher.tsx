import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const LANGS = [
  { code: 'ru', flag: '🇷🇺', label: 'RU' },
  { code: 'en', flag: '🇬🇧', label: 'EN' },
  { code: 'zh', flag: '🇨🇳', label: '中文' },
]

export default function LangSwitcher() {
  const [open, setOpen] = useState(false)
  const { i18n } = useTranslation()
  const cur = LANGS.find(l => l.code === i18n.language) || LANGS[0]

  function pick(lang: typeof LANGS[0]) {
    i18n.changeLanguage(lang.code)
    localStorage.setItem('lang', lang.code)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 text-sm font-semibold text-gray-500 px-2 py-1 rounded-xl hover:bg-gray-100 transition-colors"
      >
        <span>{cur.flag}</span>
        <span className="text-xs">{cur.label}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden min-w-[120px]">
            {LANGS.map(l => (
              <button
                key={l.code}
                onClick={() => pick(l)}
                className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold transition-colors ${
                  l.code === cur.code ? 'bg-[#FFD600]/20 text-black' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span className="text-base">{l.flag}</span>
                <span>{l.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
