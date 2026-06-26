import { useState } from 'react'
import { ShieldCheck, ChevronDown, KeyRound, LogOut, User, Sun, Moon } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useRole } from '../../context/RoleContext'

export default function TopBar({ operator, breadcrumb }) {
  const [profileOpen, setProfileOpen] = useState(false)
  const { theme, toggle } = useTheme()
  const { role, setRole } = useRole()

  return (
    <header className="h-13 flex items-center justify-between px-4 border-b border-noc-border bg-noc-surface shrink-0 z-50" style={{ height: '52px' }}>
      {/* Left — Logo + breadcrumb */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-noc-info flex items-center justify-center">
            <span className="font-code text-xs font-bold text-white">O</span>
          </div>
          <span className="font-code text-sm font-bold text-noc-fg tracking-wide">optim</span>
          <span className="text-2xs font-medium text-noc-info/70 border border-noc-info/30 rounded px-1 py-0.5 font-code">CLOUD</span>
        </div>

        {breadcrumb && (
          <>
            <span className="text-noc-border text-base select-none">/</span>
            <span className="text-noc-muted text-sm">{breadcrumb}</span>
          </>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Session logged */}
        <div className="hidden sm:flex items-center gap-1.5 text-noc-muted text-xs">
          <ShieldCheck size={12} className="text-noc-accent" />
          <span>Session Logged</span>
        </div>

        <div className="w-px h-4 bg-noc-border hidden sm:block" />

        {/* Demo role switcher */}
        <div className="hidden md:flex items-center gap-2">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            title="Demo: Switch between Engineer, ISP Admin, and Operator roles"
            className="text-2xs font-semibold px-2 py-0.5 rounded border bg-noc-surface border-noc-border text-noc-info hover:border-noc-info cursor-pointer transition-colors"
          >
            <option value="engineer">Engineer Mode</option>
            <option value="isp-admin">ISP Admin Mode</option>
            <option value="operator">Operator Mode</option>
          </select>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="w-7 h-7 flex items-center justify-center rounded-md text-noc-muted hover:text-noc-fg hover:bg-noc-raised transition-colors cursor-pointer"
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        {/* Operator profile */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(o => !o)}
            className="flex items-center gap-2 hover:bg-noc-raised rounded-md px-2 py-1.5 transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-noc-info flex items-center justify-center text-white font-semibold text-xs select-none">
              {operator.id}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-noc-fg text-xs font-medium leading-none">{operator.name}</p>
              <p className="text-noc-muted text-2xs leading-none mt-0.5">{operator.org}</p>
            </div>
            <ChevronDown size={13} className={`text-noc-muted transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
          </button>

          {profileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
              <div className="absolute right-0 top-10 w-44 bg-noc-raised border border-noc-border rounded-lg shadow-xl z-50 py-1">
                <div className="px-3 py-2 border-b border-noc-border">
                  <p className="text-noc-fg text-xs font-semibold">{operator.name}</p>
                  <p className="text-noc-muted text-2xs">{operator.org}</p>
                </div>
                <button className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-noc-muted hover:bg-noc-surface hover:text-noc-fg transition-colors cursor-pointer">
                  <KeyRound size={13} /> Change Password
                </button>
                <button className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-noc-muted hover:bg-noc-surface hover:text-noc-fg transition-colors cursor-pointer">
                  <User size={13} /> My Profile
                </button>
                <div className="border-t border-noc-border mt-1 pt-1">
                  <button className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-noc-danger hover:bg-noc-surface transition-colors cursor-pointer">
                    <LogOut size={13} /> Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
