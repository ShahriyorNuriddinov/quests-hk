import { useState } from 'react'

const LANGS = [
  { code: 'ru', gtCode: null,    flag: '🇷🇺', label: 'RU' },
  { code: 'en', gtCode: 'en',    flag: '🇬🇧', label: 'EN' },
  { code: 'zh', gtCode: 'zh-CN', flag: '🇨🇳', label: '中文' },
]

function setGoogleTranslate(gtCode: string | null) {
  const domain = window.location.hostname
  if (!gtCode) {
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/'
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${domain}`
  } else {
    document.cookie = `googtrans=/ru/${gtCode}; path=/`
    document.cookie = `googtrans=/ru/${gtCode}; path=/; domain=.${domain}`
    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement | null
    if (select) { select.value = gtCode; select.dispatchEvent(new Event('change')) }
  }
}

function currentLang() {
  const saved = localStorage.getItem('lang') || 'ru'
  return LANGS.find(l => l.code === saved) || LANGS[0]
}

export default function LangSwitcher() {
  const [open, setOpen] = useState(false)
  const cur = currentLang()

  function pick(lang: typeof LANGS[0]) {
    localStorage.setItem('lang', lang.code)
    setGoogleTranslate(lang.gtCode)
    setOpen(false)
    if (lang.gtCode !== cur.gtCode) {
      window.location.reload()
    }
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
