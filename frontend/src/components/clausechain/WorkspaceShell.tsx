'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Table2, BookOpen, Globe, ChevronRight,
  Search, Bell, Settings, LogOut, Command,
  Wifi, Layers, FileText, Cpu, GitBranch,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const NAV_ITEMS = [
  { href: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard',    count: null },
  { href: '/matrix',        icon: Table2,          label: 'RDTII Matrix', count: null },
  { href: '/ledger',        icon: BookOpen,        label: 'Ledger',       count: null },
  { href: '/jurisdictions', icon: Globe,           label: 'Jurisdictions', count: 3 },
]

const PIPELINE_ITEMS = [
  { href: '/pipeline/crawl',    icon: Wifi,       label: 'Crawl Console' },
  { href: '/pipeline/harvest',  icon: Layers,     label: 'Harvest Review' },
  { href: '/pipeline/extract',  icon: FileText,   label: 'Extraction' },
  { href: '/pipeline/map',      icon: Cpu,        label: 'Mapping Run' },
  { href: '/pipeline/trace',    icon: GitBranch,  label: 'Source Trace' },
]

interface Crumb { label: string; href?: string }

interface WorkspaceShellProps {
  children: React.ReactNode
  breadcrumbs?: Crumb[]
}

export default function WorkspaceShell({ children, breadcrumbs = [] }: WorkspaceShellProps) {
  const pathname = usePathname() ?? ''
  const { user, logout } = useAuth()
  const [cmdOpen, setCmdOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'CC'

  return (
    <div className="flex h-screen overflow-hidden bg-cc-ink-50" style={{ fontFamily: 'var(--cc-font-display)' }}>
      {/* Sidebar */}
      <aside
        className="flex flex-col shrink-0 w-60 border-r border-cc-ink-200 bg-white overflow-y-auto"
        style={{ height: '100vh', position: 'sticky', top: 0 }}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-4 pt-6 pb-6">
          <div
            className="w-7 h-7 rounded-lg grid place-items-center text-white text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)' }}
          >
            CC
          </div>
          <span
            className="font-bold text-[17px] tracking-tight"
            style={{ background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}
          >
            ClauseChain
          </span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 px-3">
          <span className="px-2.5 pb-1.5 text-[11px] font-medium tracking-widest uppercase text-cc-ink-500">
            Workspace
          </span>
          {NAV_ITEMS.map(({ href, icon: Icon, label, count }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-sm font-medium transition-colors ${
                  active
                    ? 'bg-cc-teal-50 text-cc-teal-600'
                    : 'text-cc-ink-700 hover:bg-cc-ink-100 hover:text-cc-ink-900'
                }`}
              >
                <Icon size={16} />
                <span className="flex-1">{label}</span>
                {count != null && (
                  <span className={`text-xs tabular-nums ${active ? 'text-cc-teal-600' : 'text-cc-ink-500'}`}>
                    {count}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Pipeline section */}
        <nav className="flex flex-col gap-1 px-3 mt-2">
          <span className="px-2.5 pt-3 pb-1.5 text-[11px] font-medium tracking-widest uppercase text-cc-ink-500">
            Pipeline
          </span>
          {PIPELINE_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-sm font-medium transition-colors ${
                  active
                    ? 'bg-cc-teal-50 text-cc-teal-600'
                    : 'text-cc-ink-700 hover:bg-cc-ink-100 hover:text-cc-ink-900'
                }`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto px-3 py-4 border-t border-cc-ink-200">
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            <div
              className="w-7 h-7 rounded-full grid place-items-center text-white text-xs font-semibold shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--cc-teal-500), #2563EB)' }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-cc-ink-900 truncate">{user?.email ?? 'analyst'}</p>
              <p className="text-xs text-cc-ink-500 font-mono">UN Hackathon 2026</p>
            </div>
            <button
              onClick={() => logout?.()}
              className="p-1.5 rounded-lg text-cc-ink-500 hover:text-cc-ink-900 hover:bg-cc-ink-100 transition-colors"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Topbar */}
        <header
          className="flex items-center gap-4 px-8 h-14 border-b border-cc-ink-200 shrink-0 sticky top-0 z-10"
          style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'saturate(180%) blur(12px)' }}
        >
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-[13px] text-cc-ink-500 min-w-0 flex-1">
            <Link href="/dashboard" className="hover:text-cc-ink-900 transition-colors whitespace-nowrap">
              ClauseChain
            </Link>
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <ChevronRight size={12} className="text-cc-ink-300 shrink-0" />
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-cc-ink-900 transition-colors whitespace-nowrap">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-cc-ink-900 font-medium truncate">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>

          {/* Search trigger */}
          <button
            onClick={() => setCmdOpen(true)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-[10px] bg-cc-ink-100 text-cc-ink-500 text-[13px] border border-transparent hover:bg-cc-ink-50 hover:border-cc-ink-200 transition-colors min-w-[200px]"
          >
            <Search size={13} />
            <span className="flex-1 text-left">Search clauses, docs…</span>
            <span className="flex items-center gap-0.5 text-[11px] font-mono text-cc-ink-600 bg-white border border-cc-ink-200 px-1.5 py-0.5 rounded">
              <Command size={10} />K
            </span>
          </button>

          <button className="p-2 rounded-lg text-cc-ink-600 hover:bg-cc-ink-100 hover:text-cc-ink-900 transition-colors">
            <Bell size={16} />
          </button>
          <Link href="/profile" className="p-2 rounded-lg text-cc-ink-600 hover:bg-cc-ink-100 hover:text-cc-ink-900 transition-colors">
            <Settings size={16} />
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Command palette */}
      {cmdOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]"
          style={{ background: 'rgba(10,10,11,0.32)', backdropFilter: 'blur(4px)' }}
          onClick={() => setCmdOpen(false)}
        >
          <div
            className="w-full max-w-[640px] bg-white rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b border-cc-ink-200">
              <Search size={18} className="text-cc-ink-500" />
              <input
                autoFocus
                placeholder="Search clauses, jurisdictions, documents…"
                className="flex-1 border-none outline-none text-[17px] text-cc-ink-900 bg-transparent placeholder:text-cc-ink-400"
                onKeyDown={(e) => e.key === 'Escape' && setCmdOpen(false)}
              />
              <kbd className="text-[11px] font-mono text-cc-ink-600 bg-cc-ink-100 px-2 py-1 rounded">ESC</kbd>
            </div>
            <div className="p-2 max-h-[50vh] overflow-y-auto">
              <p className="px-3 py-2.5 text-[11px] font-medium tracking-widest uppercase text-cc-ink-500">Quick Navigation</p>
              {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setCmdOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] cursor-pointer hover:bg-cc-teal-50 transition-colors"
                >
                  <Icon size={16} className="text-cc-ink-500" />
                  <span className="text-sm text-cc-ink-900">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
