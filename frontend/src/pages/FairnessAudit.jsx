import { Scale, AlertTriangle, ShieldCheck, CheckCircle2, Eye, FileText, Download } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'

/* ───────── Mock Data ───────── */

const kpis = [
  {
    label: 'Demographic Parity',
    value: '0.94',
    status: 'Within Limit',
    statusColor: 'green',
    icon: Scale,
  },
  {
    label: 'Disparate Impact Score',
    value: '0.88',
    status: 'Borderline',
    statusColor: 'amber',
    icon: ShieldCheck,
  },
  {
    label: 'Flagged Decisions',
    value: '14',
    status: 'Requires Review',
    statusColor: 'red',
    icon: AlertTriangle,
  },
]

const parityData = [
  { category: 'General', maleScore: 68, femaleScore: 70 },
  { category: 'OBC', maleScore: 72, femaleScore: 71 },
  { category: 'SC', maleScore: 78, femaleScore: 79 },
  { category: 'ST', maleScore: 81, femaleScore: 80 },
]

const recentFlags = [
  { id: 'APP-8492', name: 'Rohan Kapoor', issue: 'High Financial Variance', confidence: '42%', severity: 'High' },
  { id: 'APP-9102', name: 'Ananya Mishra', issue: 'Caste Bonus Anomaly', confidence: '55%', severity: 'Medium' },
  { id: 'APP-7731', name: 'Vikram Patel', issue: 'Unusual Merit Scaling', confidence: '38%', severity: 'High' },
  { id: 'APP-6522', name: 'Priya Sharma', issue: 'Borderline Tier Drop', confidence: '61%', severity: 'Low' },
]

/* ───────── Custom Components ───────── */

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-tejas-card border border-tejas-border rounded-lg px-4 py-3 shadow-xl">
      <p className="text-tejas-text text-sm font-semibold mb-2">{label} Category</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm flex justify-between gap-4" style={{ color: entry.color }}>
          <span>{entry.name}:</span>
          <span className="font-bold">{entry.value} pts</span>
        </p>
      ))}
    </div>
  )
}

function SeverityBadge({ severity }) {
  const colors = {
    High: 'bg-red-500/15 text-red-400 border border-red-500/20',
    Medium: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
    Low: 'bg-green-500/15 text-green-400 border border-green-500/20',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${colors[severity]}`}>
      {severity}
    </span>
  )
}

/* ═══════════════════════════════════════════════════
   FAIRNESS & BIAS AUDIT PAGE
   ═══════════════════════════════════════════════════ */

export default function FairnessAudit() {
  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-tejas-text tracking-tight flex items-center gap-2">
            <Scale className="w-6 h-6 text-tejas-gold" />
            Fairness & Bias Audit
          </h1>
          <p className="text-sm text-tejas-muted mt-1">
            Real-time monitoring of Model Parity and Disparate Impact.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-tejas-border text-tejas-text font-medium text-sm rounded-lg hover:bg-white/10 transition-colors">
          <Download className="w-4 h-4" />
          Export Audit Log
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-3 gap-5 mb-8 stagger-children">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          const colorClass = 
            kpi.statusColor === 'green' ? 'text-green-400' :
            kpi.statusColor === 'amber' ? 'text-amber-400' : 'text-red-400'
            
          return (
            <div key={kpi.label} className="bg-tejas-card border border-tejas-border rounded-xl p-6 card-hover flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-tejas-grid border border-tejas-border flex items-center justify-center shrink-0">
                <Icon className={`w-6 h-6 ${kpi.statusColor === 'green' ? 'text-green-400' : 'text-tejas-gold'}`} />
              </div>
              <div>
                <p className="text-xs font-medium text-tejas-muted uppercase tracking-wider mb-1">{kpi.label}</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-bold text-tejas-text">{kpi.value}</span>
                  <span className={`text-xs font-medium ${colorClass} flex items-center gap-1`}>
                    {kpi.statusColor === 'green' && <CheckCircle2 className="w-3 h-3" />}
                    {kpi.statusColor === 'amber' && <AlertTriangle className="w-3 h-3" />}
                    {kpi.statusColor === 'red' && <ShieldCheck className="w-3 h-3" />}
                    {kpi.status}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Parity Chart */}
        <div className="bg-tejas-card border border-tejas-border rounded-xl p-6 animate-fade-in">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-tejas-text">Gender & Caste Parity</h3>
            <p className="text-xs text-tejas-muted mt-1">Average predicted Priority Score across demographics to ensure equal treatment.</p>
          </div>
          
          <div className="h-[300px] w-full mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={parityData} barGap={8} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d37" vertical={false} />
                <XAxis dataKey="category" tick={{ fill: '#8b8fa3', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8b8fa3', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#8b8fa3', paddingTop: '10px' }} iconType="circle" />
                <ReferenceLine y={50} stroke="#d4a843" strokeDasharray="3 3" opacity={0.5} label={{ position: 'right', value: 'Approval Threshold', fill: '#d4a843', fontSize: 10 }} />
                <Bar dataKey="maleScore" name="Male Applicants" fill="#2a2d37" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="femaleScore" name="Female Applicants" fill="#d4a843" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Explainability / Flagged Info */}
        <div className="bg-tejas-card border border-tejas-border rounded-xl p-6 animate-fade-in flex flex-col">
            <div className="mb-4">
                <h3 className="text-sm font-semibold text-tejas-text">Recent Decision Flags</h3>
                <p className="text-xs text-tejas-muted mt-1">Applications flagged by the fairness monitor for manual human review.</p>
            </div>

            <div className="flex-1 overflow-x-auto">
                <table className="w-full">
                <thead>
                    <tr className="border-b border-tejas-border">
                    <th className="text-left py-3 px-2 text-xs font-semibold text-tejas-muted uppercase tracking-wider">ID</th>
                    <th className="text-left py-3 px-2 text-xs font-semibold text-tejas-muted uppercase tracking-wider">Applicant</th>
                    <th className="text-left py-3 px-2 text-xs font-semibold text-tejas-muted uppercase tracking-wider">Bias Flag Reason</th>
                    <th className="text-left py-3 px-2 text-xs font-semibold text-tejas-muted uppercase tracking-wider">System Confidence</th>
                    <th className="text-right py-3 px-2 text-xs font-semibold text-tejas-muted uppercase tracking-wider">Severity</th>
                    <th className="text-right py-3 px-2 text-xs font-semibold text-tejas-muted uppercase tracking-wider">Action</th>
                    </tr>
                </thead>
                <tbody className="stagger-children">
                    {recentFlags.map((row) => (
                    <tr key={row.id} className="border-b border-tejas-border/50 hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-2 text-sm text-tejas-muted">{row.id}</td>
                        <td className="py-3 px-2 text-sm font-medium text-tejas-text">{row.name}</td>
                        <td className="py-3 px-2 text-sm text-tejas-muted">{row.issue}</td>
                        <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-tejas-grid rounded-full overflow-hidden">
                                    <div className={`h-full ${parseInt(row.confidence) < 50 ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: row.confidence }} />
                                </div>
                                <span className="text-xs text-tejas-muted font-mono">{row.confidence}</span>
                            </div>
                        </td>
                        <td className="py-3 px-2 text-right">
                        <SeverityBadge severity={row.severity} />
                        </td>
                        <td className="py-3 px-2 text-right">
                        <button className="text-xs font-medium text-tejas-gold hover:text-tejas-amber transition-colors flex items-center justify-end gap-1 w-full">
                            <Eye className="w-3.5 h-3.5" />
                            Audit
                        </button>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
                <div className="mt-4 flex justify-center">
                    <button className="text-xs text-tejas-muted hover:text-tejas-text flex items-center gap-1 transition-colors">
                        <FileText className="w-3 h-3" />
                        View Full Bias Audit Report
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}
