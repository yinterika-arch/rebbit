'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/tribe',      label: 'Племя',      icon: '🐇' },
  { href: '/litters',    label: 'Окролы',     icon: '🥕' },
  { href: '/weighings',  label: 'Веса',       icon: '⚖️' },
  { href: '/stats',      label: 'Статистика', icon: '📊' },
  { href: '/settings',   label: 'Настройки',  icon: '⚙️' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50 safe-area-pb">
      <div className="flex">
        {NAV_ITEMS.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[64px] transition-colors
                ${active ? 'text-primary' : 'text-muted'}`}
            >
              <span className="text-2xl leading-none">{item.icon}</span>
              <span className={`text-xs font-medium ${active ? 'text-primary' : 'text-muted'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
