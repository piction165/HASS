'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { t, type Lang } from '@/lib/i18n'

const LINKS = [
  { href: '/home', key: 'navHome', icon: '🏠' },
  { href: '/records', key: 'navRecords', icon: '📋' },
  { href: '/settings', key: 'navSettings', icon: '⚙️' },
] as const

function isHomeSection(path: string) {
  return path === '/home' || path === '/survey' || path === '/equipment'
}

export function MainNav({ lang }: { lang: Lang }) {
  const pathname = usePathname()

  return (
    <nav className="main-nav" aria-label="Main">
      {LINKS.map(({ href, key, icon }) => {
        const active =
          href === '/home'
            ? isHomeSection(pathname)
            : pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link key={href} href={href} className={active ? 'active' : ''} prefetch>
            <span className="icon" aria-hidden>{icon}</span>
            {t(key, lang)}
          </Link>
        )
      })}
    </nav>
  )
}
