'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Home',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
        <path d="M9 21V12h6v9"/>
      </svg>
    )
  },
  {
    href: '/interview/setup',
    label: 'Practice',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="9"/>
        <path d="M12 8v4l3 3"/>
        {active && <circle cx="12" cy="12" r="3" fill="currentColor"/>}
      </svg>
    )
  },
  {
    href: '/jobs',
    label: 'Jobs',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="7" width="20" height="14" rx="2"/>
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
        {active && <path d="M12 12v4M10 14h4" stroke="white" strokeWidth="1.5"/>}
      </svg>
    )
  },
  {
    href: '/growth',
    label: 'Growth',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
        <polyline points="16 7 22 7 22 13"/>
        {active && <circle cx="13.5" cy="15.5" r="2" fill="currentColor" stroke="none"/>}
      </svg>
    )
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    )
  },
]

export default function BottomNav() {
  const pathname = usePathname()

  const hideOn = ['/login', '/onboarding', '/interview/session', '/interview/report']
  if (hideOn.some(p => pathname.startsWith(p))) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center px-2 py-2 pb-safe"
      style={{
        background: 'rgba(9, 9, 11, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href ||
          (item.href !== '/dashboard' && pathname.startsWith(item.href))
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-1 px-3 py-1 rounded-2xl transition-all duration-200"
            style={{ color: isActive ? '#3b82f6' : '#52525b' }}
          >
            <div className="transition-transform duration-200"
              style={{ transform: isActive ? 'scale(1.1)' : 'scale(1)' }}>
              {item.icon(isActive)}
            </div>
            <span className="text-[10px] font-medium tracking-wide">
              {item.label}
            </span>
            {isActive && (
              <div className="w-1 h-1 rounded-full bg-blue-500 absolute -bottom-0.5" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}