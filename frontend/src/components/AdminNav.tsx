import { Link, useLocation } from 'react-router-dom'
import { BarChart2, Map, MessageSquare, Tag } from 'lucide-react'

const items = [
  { to: '/admin',          Icon: BarChart2,    label: 'Статистика' },
  { to: '/admin/quests',   Icon: Map,          label: 'Квесты'     },
  { to: '/admin/reviews',  Icon: MessageSquare, label: 'Отзывы'    },
  { to: '/admin/promo',    Icon: Tag,          label: 'Промо'      },
]

export default function AdminNav() {
  const { pathname } = useLocation()
  return (
    <div className="fixed bottom-4 left-0 right-0 flex justify-center z-50 px-4 pointer-events-none">
      <nav className="pointer-events-auto bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl shadow-black/15 flex items-center gap-1 px-2 py-2 w-full max-w-sm border border-gray-100">
        {items.map(({ to, Icon, label }) => {
          const active = pathname === to
          return (
            <Link
              key={to}
              to={to}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl transition-all duration-200 active:scale-95 ${
                active ? 'bg-[#FFD600]' : 'hover:bg-gray-50'
              }`}
            >
              <Icon
                size={20}
                strokeWidth={active ? 2.5 : 1.8}
                className={active ? 'text-black' : 'text-gray-400'}
              />
              <span className={`text-[10px] font-semibold leading-none ${active ? 'text-black' : 'text-gray-400'}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
