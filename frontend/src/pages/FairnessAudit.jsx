import { useEffect, useState } from 'react'
import {
  Scale,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Eye,
  FileText,
  Download,
  Loader2,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { apiFetch, buildApiUrl } from '../lib/api'

const iconMap = {
  scale: Scale,
  shield: ShieldCheck,
  alert: AlertTriangle,
}

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
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${colors[severity] || colors.Low}`}>
      {severity}
    </span>
  )
}

export default function FairnessAudit() {
  const [data, setData] = useState({
    kpis: [],
    parity_data: [],
    recent_flags: [],
    summary: { approval_threshold: 70, total_scored_applicants: 0 },
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadFairnessAudit() {
      setLoading(true)
      setError('')

      try {
        const res = await apiFetch('/api/fairness-audit')
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.detail || 'Could not load fairness audit data.')
        }

        const payload = await res.json()
        setData(payload)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadFairnessAudit()
  }, [])

  const exportUrl = buildApiUrl('/api/fairness-audit/export')
  const parityInsights = (() => {
    if (!data.parity_data.length) {
      return {
        averageGap: '0.0',
        widestGapCategory: 'N/A',
        widestGap: '0.0',
        groupsAboveThreshold: 0,
      }
    }

    const rowsWithGap = data.parity_data.map((row) => ({
      ...row,
      gap: Math.abs((row.femaleScore || 0) - (row.maleScore || 0)),
    }))

    const widestGapRow = rowsWithGap.reduce((current, row) => (
      row.gap > current.gap ? row : current
    ), rowsWithGap[0])

    const averageGap =
      rowsWithGap.reduce((sum, row) => sum + row.gap, 0) / rowsWithGap.length

    const groupsAboveThreshold = data.parity_data.reduce((count, row) => {
      let total = count
      if ((row.maleScore || 0) >= data.summary.approval_threshold) total += 1
      if ((row.femaleScore || 0) >= data.summary.approval_threshold) total += 1
      return total
    }, 0)

    return {
      averageGap: averageGap.toFixed(1),
      widestGapCategory: widestGapRow.category,
      widestGap: widestGapRow.gap.toFixed(1),
      groupsAboveThreshold,
    }
  })()

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-tejas-text tracking-tight flex items-center gap-2">
            <Scale className="w-6 h-6 text-tejas-gold" />
            Fairness & Bias Audit
          </h1>
          <p className="text-sm text-tejas-muted mt-1">
            Real-time fairness monitoring computed from live scholarship records.
          </p>
        </div>
        <a
          href={exportUrl}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-tejas-border text-tejas-text font-medium text-sm rounded-lg hover:bg-white/10 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export Audit Log
        </a>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-5 mb-8 stagger-children">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-tejas-card border border-tejas-border rounded-xl p-6 flex items-center justify-center min-h-[112px]">
              <Loader2 className="w-5 h-5 animate-spin text-tejas-gold" />
            </div>
          ))
        ) : (
          data.kpis.map((kpi) => {
            const Icon = iconMap[kpi.icon] || Scale
            const colorClass =
              kpi.statusColor === 'green'
                ? 'text-green-400'
                : kpi.statusColor === 'amber'
                  ? 'text-amber-400'
                  : 'text-red-400'

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
          })
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-tejas-card border border-tejas-border rounded-xl p-6 animate-fade-in">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-tejas-text">Gender & Caste Parity</h3>
            <p className="text-xs text-tejas-muted mt-1">
              Average predicted priority score across demographics using live applicant data.
            </p>
          </div>

          <div className="h-[300px] w-full mt-6">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-tejas-gold" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.parity_data} barGap={8} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2d37" vertical={false} />
                  <XAxis dataKey="category" tick={{ fill: '#8b8fa3', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#8b8fa3', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                  <Legend wrapperStyle={{ fontSize: '12px', color: '#8b8fa3', paddingTop: '10px' }} iconType="circle" />
                  <ReferenceLine
                    y={data.summary.approval_threshold}
                    stroke="#d4a843"
                    strokeDasharray="3 3"
                    opacity={0.5}
                    label={{
                      position: 'right',
                      value: `Aid Threshold (${data.summary.approval_threshold})`,
                      fill: '#d4a843',
                      fontSize: 10,
                    }}
                  />
                  <Bar dataKey="maleScore" name="Male Applicants" fill="#2a2d37" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="femaleScore" name="Female Applicants" fill="#d4a843" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="rounded-xl border border-tejas-border bg-tejas-grid/40 px-4 py-3">
              <p className="text-[11px] uppercase tracking-wider text-tejas-muted mb-1">Average Gap</p>
              <p className="text-lg font-semibold text-tejas-text">{parityInsights.averageGap} pts</p>
              <p className="text-xs text-tejas-muted mt-1">Mean male vs female score spread across categories</p>
            </div>
            <div className="rounded-xl border border-tejas-border bg-tejas-grid/40 px-4 py-3">
              <p className="text-[11px] uppercase tracking-wider text-tejas-muted mb-1">Widest Gap</p>
              <p className="text-lg font-semibold text-tejas-text">{parityInsights.widestGap} pts</p>
              <p className="text-xs text-tejas-muted mt-1">{parityInsights.widestGapCategory} shows the largest variance</p>
            </div>
            <div className="rounded-xl border border-tejas-border bg-tejas-grid/40 px-4 py-3">
              <p className="text-[11px] uppercase tracking-wider text-tejas-muted mb-1">Groups Above Aid Line</p>
              <p className="text-lg font-semibold text-tejas-text">{parityInsights.groupsAboveThreshold}</p>
              <p className="text-xs text-tejas-muted mt-1">Male or female group averages above the threshold</p>
            </div>
          </div>
        </div>

        <div className="bg-tejas-card border border-tejas-border rounded-xl p-6 animate-fade-in flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-tejas-text">Recent Decision Flags</h3>
            <p className="text-xs text-tejas-muted mt-1">
              Heuristic review flags generated from the current applicant dataset.
            </p>
          </div>

          <div className="flex-1 overflow-x-auto">
            {loading ? (
              <div className="h-full min-h-[220px] flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-tejas-gold" />
              </div>
            ) : (
              <>
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
                    {data.recent_flags.length > 0 ? (
                      data.recent_flags.map((row) => (
                        <tr key={row.id} className="border-b border-tejas-border/50 hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-2 text-sm text-tejas-muted">{row.id}</td>
                          <td className="py-3 px-2 text-sm font-medium text-tejas-text">{row.name}</td>
                          <td className="py-3 px-2 text-sm text-tejas-muted">{row.issue}</td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-tejas-grid rounded-full overflow-hidden">
                                <div
                                  className={`${parseInt(row.confidence, 10) < 50 ? 'bg-red-500' : 'bg-amber-500'} h-full`}
                                  style={{ width: row.confidence }}
                                />
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
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-sm text-tejas-muted">
                          No fairness review flags were generated from the current data.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div className="mt-4 flex justify-center">
                  <div className="text-xs text-tejas-muted flex items-center gap-1 transition-colors">
                    <FileText className="w-3 h-3" />
                    Based on {data.summary.total_scored_applicants} scored applicants
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
