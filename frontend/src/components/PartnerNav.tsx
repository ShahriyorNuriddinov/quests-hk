import { Link, useLocation } from 'react-router-dom'
import { BarChart2, Map, Wallet } from 'lucide-react'

const navItems = [
  { to: '/partner',          Icon: BarChart2, label: 'Главная' },
  { to: '/partner/quests',   Icon: Map,       label: 'Мои квесты' },
  { to: '/partner/earnings', Icon: Wallet,    label: 'Заработок' },
]

export default function PartnerNav() {
  const { pathname } = useLocation()
  return (
    <div className="fixed bottom-4 left-0 right-0 flex justify-center z-50 px-4 pointer-events-none">
      <nav className="pointer-events-auto bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl shadow-black/15 flex items-center gap-1 px-2 py-2 w-full max-w-xs border border-gray-100">
        {navItems.map(({ to, Icon, label }) => {
          const active = pathname === to || (to !== '/partner' && pathname.startsWith(to))
          return (
            <Link key={to} to={to}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl transition-all active:scale-95 ${active ? 'bg-[#FFD600]' : 'hover:bg-gray-50'}`}>
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} className={active ? 'text-black' : 'text-gray-400'} />
              <span className={`text-[9px] font-semibold leading-none ${active ? 'text-black' : 'text-gray-400'}`}>{label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
