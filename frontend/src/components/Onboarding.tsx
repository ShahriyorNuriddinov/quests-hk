import { useState } from 'react'

const SLIDES = [
  {
    emoji: '🗺️',
    title: 'Живая экскурсия\nпо Гонконгу',
    text: 'Никакого гида — только ваш телефон, город и интерес к приключениям.',
    accent: 'from-yellow-50 to-amber-100',
    dot: 'bg-amber-400',
  },
  {
    emoji: '📍',
    title: 'Идите по маршруту\nи открывайте секреты',
    text: 'Навигация, интересные факты и загадки прямо на месте событий.',
    accent: 'from-sky-50 to-blue-100',
    dot: 'bg-blue-400',
  },
  {
    emoji: '🏆',
    title: 'Завершите квест\nи поделитесь впечатлениями',
    text: 'Отличный способ провести время с семьёй, друзьями или в одиночку.',
    accent: 'from-emerald-50 to-green-100',
    dot: 'bg-emerald-400',
  },
]

export default function Onboarding({ onDone }: { onDone: () => void }) {
  const [slide, setSlide] = useState(0)
  const s = SLIDES[slide]
  const isLast = slide === SLIDES.length - 1

  function next() {
    if (isLast) { onDone(); return }
    setSlide(i => i + 1)
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${s.accent} flex flex-col px-6 py-10 transition-colors duration-500`}>
      <button onClick={onDone} className="self-end text-sm text-gray-400 font-medium py-1">
        Пропустить
      </button>

      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
        <div className="text-8xl mb-8 animate-bounce" style={{ animationDuration: '2s' }}>
          {s.emoji}
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 leading-tight whitespace-pre-line mb-4">
          {s.title}
        </h1>
        <p className="text-gray-500 text-sm leading-relaxed">{s.text}</p>
      </div>

      <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto">
        <div className="flex gap-2 items-center">
          {SLIDES.map((sl, i) => (
            <button key={i} onClick={() => setSlide(i)}
              className={`rounded-full transition-all duration-300 ${i === slide ? `w-6 h-1.5 ${sl.dot}` : 'w-1.5 h-1.5 bg-gray-300'}`}
            />
          ))}
        </div>
        <button onClick={next}
          className="w-full bg-[#FFD600] text-black font-bold rounded-2xl py-4 text-base active:scale-[0.98] transition-transform">
          {isLast ? 'Начать приключение →' : 'Далее'}
        </button>
      </div>
    </div>
  )
}
