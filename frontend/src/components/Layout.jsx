import { Link, NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Gavel,
  Users,
  Scale,
  ShieldCheck,
  BrainCircuit,
  Lock,
  Lightbulb,
  Zap,
  ChevronRight,
  Settings,
  CalendarDays,
  Terminal,
} from 'lucide-react'

const navItems = [
  { to: '/admin-overview', icon: LayoutDashboard, label: 'Admin Overview' },
  { to: '/decision-center', icon: Gavel, label: 'Decision Center' },
  { to: '/applicant-database', icon: Users, label: 'Applicant Database' },
  { to: '/policy-rules', icon: Scale, label: 'Policy & Rules Engine' },
  { to: '/timeline', icon: CalendarDays, label: 'Project Timeline' },
  { to: '/fairness-audit', icon: ShieldCheck, label: 'Fairness & Bias Audit' },
  { to: '/mlops', icon: BrainCircuit, label: 'Automated MLOps', badge: 'BETA' },
  { to: '/security', icon: Lock, label: 'Security & Audit Logs', locked: true },
  { to: '/command-center', icon: Terminal, label: 'Command Center', badge: 'BETA' },
  { to: '/suggestions', icon: Lightbulb, label: 'Suggestions' },
]

export default function Layout() {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <aside className="w-[260px] min-w-[260px] bg-tejas-sidebar flex flex-col border-r border-tejas-border h-full">
        <div className="px-6 py-6 border-b border-tejas-border">
          <Link to="/" className="flex items-center gap-3 w-fit group">
            <div className="w-10 h-10 rounded-lg bg-gold-gradient flex items-center justify-center shadow-lg">
              <Zap className="w-5 h-5 text-tejas-sidebar transition-transform group-hover:scale-110" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-tejas-gold tracking-tight">Tejas</h1>
              <p className="text-[10px] text-tejas-muted font-medium tracking-wider uppercase">
                Scholarship Allocator
              </p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto stagger-children">
          {navItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative
                  ${isActive
                    ? 'bg-tejas-gold/10 text-tejas-gold border-l-[3px] border-tejas-gold pl-[9px]'
                    : 'text-tejas-muted hover:text-tejas-text hover:bg-white/[0.03] border-l-[3px] border-transparent pl-[9px]'
                  }`
                }
              >
                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>

                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-tejas-amber/20 text-tejas-amber uppercase tracking-wider">
                    {item.badge}
                  </span>
                )}

                {item.locked && <Lock className="w-3.5 h-3.5 text-tejas-muted-dark" />}

                {!item.badge && !item.locked && (
                  <ChevronRight className="w-3.5 h-3.5 text-tejas-muted-dark opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </NavLink>
            )
          })}
        </nav>

        <div className="px-4 py-4 border-t border-tejas-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-tejas-gold to-tejas-gold-dark flex items-center justify-center text-tejas-sidebar font-bold text-sm">
              DA
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-tejas-text truncate">Dr. Admin</p>
              <p className="text-[11px] text-tejas-muted truncate">System Principal</p>
            </div>
            <Settings className="w-4 h-4 text-tejas-muted-dark hover:text-tejas-muted cursor-pointer transition-colors" />
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-tejas-bg">
        <Outlet />
      </main>
    </div>
  )
}
