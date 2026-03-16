import { ShieldAlert, Users, KeyRound, Edit3, Monitor, Search, Filter } from 'lucide-react'

/* ───────── Mock Data ───────── */

const securityKpis = [
  {
    label: 'Active Admin Sessions',
    value: '4',
    change: 'Live',
    statusColor: 'green',
    icon: Users,
  },
  {
    label: 'Failed Access Attempts',
    value: '2',
    change: 'Past 24h',
    statusColor: 'amber',
    icon: KeyRound,
  },
  {
    label: 'Score Overrides',
    value: '18',
    change: 'This Week',
    statusColor: 'amber',
    icon: Edit3,
  },
]

const auditLogs = [
  {
    id: 'LOG-8821',
    timestamp: '2026-03-16 14:32:11',
    admin: 'Jane Doe (Director)',
    action: 'Manual Score Override (+15 pts) for APP-8492',
    reason: 'Policy exception: Medical emergency documented.',
    ip: '192.168.1.45',
    status: 'Success'
  },
  {
    id: 'LOG-8820',
    timestamp: '2026-03-16 12:15:44',
    admin: 'System',
    action: 'Automated ML Pipeline Retrain Completed',
    reason: '-',
    ip: 'localhost',
    status: 'Success'
  },
  {
    id: 'LOG-8819',
    timestamp: '2026-03-16 09:05:22',
    admin: 'Unknown User',
    action: 'Failed Login Attempt',
    reason: 'Invalid Credentials',
    ip: '103.45.12.9',
    status: 'Failed'
  },
  {
    id: 'LOG-8818',
    timestamp: '2026-03-15 16:44:09',
    admin: 'Bob Smith (Reviewer)',
    action: 'Accessed PII Data for APP-9102',
    reason: 'Routine verification of income certificate.',
    ip: '192.168.1.112',
    status: 'Success'
  },
  {
    id: 'LOG-8817',
    timestamp: '2026-03-15 14:20:00',
    admin: 'System',
    action: 'Database Backup Completed',
    reason: 'Scheduled Daily Backup',
    ip: 'localhost',
    status: 'Success'
  },
]

/* ───────── Custom Components ───────── */

function EventBadge({ status }) {
  const colors = {
    Success: 'bg-green-500/15 text-green-400 border border-green-500/20',
    Failed: 'bg-red-500/15 text-red-400 border border-red-500/20',
    Warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${colors[status]}`}>
      {status}
    </span>
  )
}

/* ═══════════════════════════════════════════════════
   SECURITY & AUDIT LOGS PAGE
   ═══════════════════════════════════════════════════ */

export default function SecurityAudit() {
  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-tejas-text tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-tejas-gold" />
            Security & Audit Logs
          </h1>
          <p className="text-sm text-tejas-muted mt-1">
            Immutable ledger of all administrative actions, data access, and system events.
          </p>
        </div>
        <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-tejas-border text-tejas-text font-medium text-sm rounded-lg hover:bg-white/10 transition-colors">
                <Monitor className="w-4 h-4" />
                Active Sessions
            </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-3 gap-5 mb-8 stagger-children">
        {securityKpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="bg-tejas-card border border-tejas-border rounded-xl p-6 card-hover flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-tejas-muted uppercase tracking-wider mb-2">{kpi.label}</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-tejas-text">{kpi.value}</span>
                  <span className="text-xs font-medium text-tejas-muted">{kpi.change}</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-tejas-grid flex items-center justify-center">
                <Icon className={`w-5 h-5 ${kpi.statusColor === 'green' ? 'text-green-400' : 'text-amber-400'}`} />
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Audit Ledger Table ── */}
      <div className="bg-tejas-card border border-tejas-border rounded-xl p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-semibold text-tejas-text">System Event Ledger</h3>
          
          <div className="flex gap-3">
            <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-tejas-muted" />
                <input 
                    type="text" 
                    placeholder="Search logs..." 
                    className="bg-tejas-bg border border-tejas-border text-sm text-tejas-text rounded-lg pl-9 pr-4 py-1.5 focus:outline-none focus:border-tejas-gold transition-colors w-64"
                />
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-tejas-bg border border-tejas-border text-tejas-muted hover:text-tejas-text text-sm rounded-lg transition-colors">
                <Filter className="w-4 h-4" />
                Filters
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr>
                <th className="px-4 py-2 text-xs font-semibold text-tejas-muted uppercase tracking-wider">Timestamp</th>
                <th className="px-4 py-2 text-xs font-semibold text-tejas-muted uppercase tracking-wider">User / Admin</th>
                <th className="px-4 py-2 text-xs font-semibold text-tejas-muted uppercase tracking-wider">Action Taken</th>
                <th className="px-4 py-2 text-xs font-semibold text-tejas-muted uppercase tracking-wider">IP Address</th>
                <th className="px-4 py-2 text-xs font-semibold text-tejas-muted uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="stagger-children">
              {auditLogs.map((log) => (
                <tr key={log.id} className="bg-tejas-bg/50 hover:bg-tejas-border/30 transition-colors group">
                  <td className="px-4 py-3 rounded-l-lg">
                    <p className="text-sm text-tejas-text">{log.timestamp.split(' ')[1]}</p>
                    <p className="text-xs text-tejas-muted">{log.timestamp.split(' ')[0]}</p>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-tejas-text">{log.admin}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-tejas-gold">{log.action}</p>
                    <p className="text-xs text-tejas-muted mt-0.5 max-w-sm truncate" title={log.reason}>{log.reason}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-tejas-muted font-mono">{log.ip}</td>
                  <td className="px-4 py-3 rounded-r-lg">
                    <EventBadge status={log.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
