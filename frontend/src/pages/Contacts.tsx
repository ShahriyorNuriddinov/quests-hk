import { Phone, Mail, Clock, CreditCard, Building2, Shield, MessageCircle } from 'lucide-react'
import BottomNav from '../components/BottomNav'

export default function Contacts() {
  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-gray-100">
        <h1 className="text-xl font-extrabold">Контакты</h1>
      </div>

      <div className="px-4 py-5 flex flex-col gap-3 max-w-lg mx-auto">

        {/* WhatsApp CTA */}
        <a
          href="https://wa.me/85251741164"
          target="_blank"
          rel="noreferrer"
          className="bg-[#FFD600] rounded-2xl px-5 py-4 flex items-center justify-center gap-3 font-bold text-[15px] text-black shadow-sm active:scale-[0.98] transition-transform"
        >
          <MessageCircle size={20} strokeWidth={2} />
          Написать в WhatsApp
        </a>

        {/* Contact info */}
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
          <ContactRow
            icon={<Phone size={17} className="text-gray-500" />}
            label="WhatsApp"
            value="+852 5174 1164"
            href="https://wa.me/85251741164"
          />
          <ContactRow
            icon={<Mail size={17} className="text-gray-500" />}
            label="Email"
            value="Info@questshk.com"
            href="mailto:Info@questshk.com"
          />
          <ContactRow
            icon={<Clock size={17} className="text-gray-500" />}
            label="Время работы"
            value="11:00–16:00 ежедневно"
            last
          />
        </div>

        {/* Payment */}
        <div className="bg-white rounded-2xl px-4 py-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard size={16} className="text-gray-400" />
            <span className="text-sm font-semibold text-gray-800">Оплата</span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Принимаем Visa, Mastercard (в том числе российские карты), Alipay, WeChat Pay, Alipay HK.
            Платежи обрабатываются через Airwallex с SSL-шифрованием и 3D Secure.
          </p>
        </div>

        {/* Company */}
        <div className="bg-white rounded-2xl px-4 py-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Building2 size={16} className="text-gray-400" />
            <span className="text-sm font-semibold text-gray-800">Компания</span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            DENIS IVANOV LIMITED · Reg. No. 79643900<br />
            18/F 299 QRC, 287-299 Queen's Road Central,<br />
            Sheung Wan, Hong Kong
          </p>
        </div>

        {/* Privacy */}
        <div className="bg-white rounded-2xl px-4 py-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={16} className="text-gray-400" />
            <span className="text-sm font-semibold text-gray-800">Конфиденциальность</span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Мы соблюдаем Personal Data (Privacy) Ordinance Гонконга. По вопросам доступа к данным:{' '}
            <a href="mailto:Info@questshk.com" className="text-[#b89e00] font-medium">Info@questshk.com</a>{' '}
            (тема: «Personal Data Access/Correction Request»).
          </p>
        </div>

      </div>

      <BottomNav />
    </div>
  )
}

function ContactRow({ icon, label, value, href, last }: {
  icon: React.ReactNode
  label: string
  value: string
  href?: string
  last?: boolean
}) {
  const inner = (
    <div className={`flex items-center gap-4 px-4 py-3.5 ${!last ? 'border-b border-gray-50' : ''}`}>
      <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-[11px] text-gray-400 mb-0.5">{label}</div>
        <div className="text-sm font-semibold text-gray-800">{value}</div>
      </div>
    </div>
  )
  return href ? <a href={href} target="_blank" rel="noreferrer">{inner}</a> : <div>{inner}</div>
}
