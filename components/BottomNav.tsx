'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { useTheme } from '@/components/ThemeProvider'

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Home',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
        <path d="M9 21V12h6v9"/>
      </svg>
    ),
  },
  {
    href: '/practice',
    label: 'Practice',
    isPractice: true,
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="9"/>
        <path d="M12 8v4l3 3"/>
        {active && <circle cx="12" cy="12" r="3" fill="currentColor"/>}
      </svg>
    ),
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
    ),
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
    ),
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    ),
  },
]

const PRACTICE_OPTIONS = [
  {
    href: '/interview/setup',
    icon: '🎤',
    title: 'AI Interview Simulator',
    desc: 'Camera · Voice · Live feedback',
    color: 'var(--blue)',
    bg: 'var(--blue-bg)',
    badge: 'HOT',
    badgeColor: 'var(--coral)',
    badgeBg: 'var(--coral-bg)',
  },
  {
    href: '/interview/mock-setup',
    icon: '🧠',
    title: 'Mock Interview Bank',
    desc: 'Questions · Model answers · No camera',
    color: 'var(--indigo)',
    bg: 'var(--indigo-bg)',
    badge: 'NEW',
    badgeColor: 'var(--indigo)',
    badgeBg: 'var(--indigo-bg)',
  },
]

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [showPracticeSheet, setShowPracticeSheet] = useState(false)
  const { theme } = useTheme()

  const hideOn = ['/login', '/onboarding', '/interview/session', '/interview/report']
  if (hideOn.some(p => pathname.startsWith(p))) return null

  const isPracticeActive = pathname.startsWith('/interview')

  // Nav background: dark = glass blur, light = solid white with shadow
  const navBg = theme === 'dark'
    ? 'rgba(9,9,11,0.88)'
    : 'rgba(255,255,255,0.92)'

  const navBorder = theme === 'dark'
    ? '1px solid rgba(255,255,255,0.07)'
    : '1px solid rgba(0,0,0,0.08)'

  const sheetBg = theme === 'dark' ? '#111113' : '#ffffff'
  const sheetBorder = theme === 'dark'
    ? '1px solid rgba(255,255,255,0.08)'
    : '1px solid rgba(0,0,0,0.08)'
  const handleBg = theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'

  return (
    <>
      {/* ── Bottom Nav ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center px-2 py-2 pb-safe"
        style={{
          background: navBg,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: navBorder,
          transition: 'background 0.25s ease, border-color 0.25s ease',
        }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = (item as any).isPractice
            ? isPracticeActive
            : pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

          const activeColor = 'var(--blue)'
          const inactiveColor = 'var(--text-muted)'

          if ((item as any).isPractice) {
            return (
              <button
                key="practice"
                onClick={() => setShowPracticeSheet(true)}
                className="flex flex-col items-center gap-1 px-3 py-1 rounded-2xl transition-all duration-200 border-0 bg-transparent cursor-pointer"
                style={{ color: isActive ? activeColor : inactiveColor }}
              >
                <div style={{ transform: isActive ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.2s' }}>
                  {item.icon(isActive)}
                </div>
                <span className="text-[10px] font-medium tracking-wide">
                  {item.label}
                </span>
                {isActive && (
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: activeColor }} />
                )}
              </button>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 px-3 py-1 rounded-2xl transition-all duration-200"
              style={{ color: isActive ? activeColor : inactiveColor }}
            >
              <div style={{ transform: isActive ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.2s' }}>
                {item.icon(isActive)}
              </div>
              <span className="text-[10px] font-medium tracking-wide">
                {item.label}
              </span>
              {isActive && (
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: activeColor }} />
              )}
            </Link>
          )
        })}
      </nav>

      {/* ── Practice Sheet ── */}
      {showPracticeSheet && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowPracticeSheet(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 60,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
          />

          {/* Sheet */}
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 70,
            background: sheetBg,
            borderTop: sheetBorder,
            borderRadius: '20px 20px 0 0',
            padding: '20px 20px 40px',
            transition: 'background 0.25s ease',
          }}>

            {/* Handle */}
            <div style={{
              width: 36, height: 4, borderRadius: 99,
              background: handleBg,
              margin: '0 auto 20px',
            }} />

            {/* Title */}
            <p style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.15em',
              textTransform: 'uppercase', color: 'var(--text-muted)',
              marginBottom: 16, textAlign: 'center',
            }}>
              Choose practice mode
            </p>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {PRACTICE_OPTIONS.map(opt => (
                <button
                  key={opt.href}
                  onClick={() => { setShowPracticeSheet(false); router.push(opt.href) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '16px 18px', borderRadius: 16,
                    background: opt.bg,
                    border: `1px solid var(--border)`,
                    cursor: 'pointer', textAlign: 'left', width: '100%',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = opt.color
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                    background: opt.bg,
                    border: `1px solid var(--border-strong)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22,
                  }}>
                    {opt.icon}
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {opt.title}
                      </span>
                      <span style={{
                        fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 99,
                        letterSpacing: '0.06em',
                        color: opt.badgeColor,
                        background: opt.badgeBg,
                        border: `1px solid var(--border)`,
                      }}>
                        {opt.badge}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                      {opt.desc}
                    </p>
                  </div>

                  {/* Arrow */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke={opt.color} strokeWidth="2" style={{ flexShrink: 0, opacity: 0.5 }}>
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
              ))}
            </div>

            {/* Cancel */}
            <button
              onClick={() => setShowPracticeSheet(false)}
              style={{
                width: '100%', marginTop: 12, padding: '13px',
                borderRadius: 14,
                border: '1px solid var(--border-strong)',
                background: 'var(--bg-subtle)',
                color: 'var(--text-muted)',
                fontSize: 14, fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'
              }}
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </>
  )
}