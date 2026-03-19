import { useEffect, useState } from 'react'
import {
  Activity,
  Settings,
  Server,
  Clock,
  GitBranch,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Box,
  Loader2,
  Database,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { apiFetch } from '../lib/api'

function StatusBadge({ status }) {
  const colors = {
    Active: 'bg-green-500/15 text-green-400 border border-green-500/20',
    Ready: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
    Archived: 'bg-tejas-grid text-tejas-muted border border-tejas-border',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${colors[status] || colors.Ready}`}>
      {status}
    </span>
  )
}

function formatMetric(value) {
  if (value == null) return '—'
  return Number(value).toFixed(4)
}

function ComparisonTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-tejas-card border border-tejas-border rounded-lg px-4 py-3 shadow-xl">
      <p className="text-tejas-text text-sm font-semibold mb-2">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-sm flex justify-between gap-4" style={{ color: entry.color }}>
          <span>{entry.name}</span>
          <span className="font-bold">{Number(entry.value).toFixed(4)}</span>
        </p>
      ))}
    </div>
  )
}

export default function MLOps() {
  const [data, setData] = useState({
    active_model: null,
    evaluation_snapshot: [],
    models: [],
    artifacts: [],
    dataset: null,
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  async function loadSummary(forceRefresh = false) {
    if (forceRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError('')

    try {
      const suffix = forceRefresh ? '?refresh=true' : ''
      const res = await apiFetch(`/api/mlops/summary${suffix}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Could not load MLOps summary.')
      }

      const payload = await res.json()
      setData(payload)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadSummary(false)
  }, [])

  const chartData = data.evaluation_snapshot.flatMap((item) => [
    {
      metric: `${item.model} R²`,
      value: item.r2,
      fill: '#d4a843',
    },
    {
      metric: `${item.model} MAE`,
      value: item.mae,
      fill: '#3b82f6',
    },
  ])

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-tejas-text tracking-tight flex items-center gap-2">
            <Server className="w-6 h-6 text-tejas-gold" />
            Automated MLOps & Model Registry
          </h1>
          <p className="text-sm text-tejas-muted mt-1">
            Live artifact metadata and benchmark evaluation from the saved training outputs.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-tejas-border text-tejas-text font-medium text-sm rounded-lg hover:bg-white/10 transition-colors">
            <Settings className="w-4 h-4" />
            Pipeline Config
          </button>
          <button
            onClick={() => loadSummary(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-gold-gradient text-tejas-sidebar font-semibold text-sm rounded-lg hover:shadow-lg hover:shadow-tejas-gold/20 transition-all disabled:opacity-70"
          >
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh Metrics
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-tejas-card border border-tejas-border rounded-xl p-12 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-tejas-gold" />
        </div>
      ) : (
        <>
          <div className="grid lg:grid-cols-3 gap-8 mb-8 stagger-children">
            <div className="lg:col-span-1 bg-tejas-card border border-tejas-border rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-bl-full pointer-events-none" />
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-green-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Production Champion
                </span>
                <span className="text-xs text-tejas-muted bg-tejas-grid px-2 py-1 rounded">
                  {data.active_model?.version || 'production'}
                </span>
              </div>
              <h2 className="text-3xl font-bold text-tejas-text mb-1">{data.active_model?.name || 'Unavailable'}</h2>
              <p className="text-sm text-tejas-muted mb-6">
                Deployed from artifact: {data.active_model?.deployed_at || 'Unavailable'}
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <span className="text-sm text-tejas-muted">R² Score</span>
                  <span className="text-sm font-bold text-tejas-text flex items-center gap-1">
                    {formatMetric(data.active_model?.r2)}
                    <ArrowUpRight className="w-3 h-3 text-green-400" />
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <span className="text-sm text-tejas-muted">Mean Absolute Error</span>
                  <span className="text-sm font-bold text-tejas-text flex items-center gap-1">
                    {formatMetric(data.active_model?.mae)}
                    <ArrowDownRight className="w-3 h-3 text-green-400" />
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <span className="text-sm text-tejas-muted flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    Per-sample Latency
                  </span>
                  <span className="text-sm font-medium text-tejas-text">{data.active_model?.inference_latency || 'Unavailable'}</span>
                </div>
                <div className="flex items-center justify-between pb-1">
                  <span className="text-sm text-tejas-muted flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Next Retrain
                  </span>
                  <span className="text-sm font-medium text-tejas-text">{data.active_model?.next_retrain || 'Unavailable'}</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 bg-tejas-card border border-tejas-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-semibold text-tejas-text flex items-center gap-2">
                    <Activity className="w-4 h-4 text-tejas-gold" />
                    Current Evaluation Snapshot
                  </h3>
                  <p className="text-xs text-tejas-muted mt-1">
                    Real benchmark metrics recomputed from the saved train/test arrays.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-tejas-muted">
                  <span className="w-3 h-3 rounded bg-tejas-gold/20 border border-tejas-gold" />
                  R² / MAE
                </div>
              </div>

              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2d37" vertical={false} />
                    <XAxis dataKey="metric" tick={{ fill: '#8b8fa3', fontSize: 12 }} angle={-15} textAnchor="end" height={60} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#8b8fa3', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ComparisonTooltip />} cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48}>
                      {chartData.map((entry) => (
                        <Cell key={entry.metric} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-2">
              <h3 className="text-lg font-bold text-tejas-text tracking-tight mb-4 flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-tejas-gold" />
                Model Registry & Benchmarks
              </h3>

              <div className="bg-tejas-card border border-tejas-border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-tejas-border bg-white/[0.02]">
                        <th className="text-left py-4 px-6 text-xs font-semibold text-tejas-muted uppercase tracking-wider">Algorithm</th>
                        <th className="text-left py-4 px-6 text-xs font-semibold text-tejas-muted uppercase tracking-wider">Type</th>
                        <th className="text-left py-4 px-6 text-xs font-semibold text-tejas-muted uppercase tracking-wider">Status</th>
                        <th className="text-left py-4 px-6 text-xs font-semibold text-tejas-muted uppercase tracking-wider">R²</th>
                        <th className="text-left py-4 px-6 text-xs font-semibold text-tejas-muted uppercase tracking-wider">MAE</th>
                        <th className="text-left py-4 px-6 text-xs font-semibold text-tejas-muted uppercase tracking-wider">Train Time</th>
                        <th className="text-left py-4 px-6 text-xs font-semibold text-tejas-muted uppercase tracking-wider">Latency</th>
                      </tr>
                    </thead>
                    <tbody className="stagger-children">
                      {data.models.map((model) => (
                        <tr key={model.id} className="border-b border-tejas-border/50 hover:bg-white/[0.02] transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <Box className="w-4 h-4" style={{ color: model.color }} />
                              <div>
                                <p className="text-sm font-bold text-tejas-text">{model.name}</p>
                                <p className="text-xs text-tejas-muted font-mono">{model.version}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-sm text-tejas-muted">{model.type}</td>
                          <td className="py-4 px-6"><StatusBadge status={model.status} /></td>
                          <td className="py-4 px-6 text-sm font-medium text-tejas-text">{formatMetric(model.r2)}</td>
                          <td className="py-4 px-6 text-sm font-medium text-tejas-text">{formatMetric(model.mae)}</td>
                          <td className="py-4 px-6 text-sm text-tejas-muted">{model.trainTime}</td>
                          <td className="py-4 px-6 text-sm text-tejas-muted">{model.infTime}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-tejas-text tracking-tight mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-tejas-gold" />
                Artifact Inventory
              </h3>

              <div className="bg-tejas-card border border-tejas-border rounded-xl p-6 space-y-4">
                {data.artifacts.map((artifact) => (
                  <div key={artifact.name} className="rounded-lg border border-tejas-border bg-white/[0.02] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-tejas-text">{artifact.name}</p>
                        <p className="text-xs text-tejas-muted mt-1">Updated {artifact.updated_at}</p>
                      </div>
                      <span className="text-xs font-medium text-tejas-gold">{artifact.size_kb} KB</span>
                    </div>
                  </div>
                ))}

                <div className="rounded-lg border border-tejas-border bg-white/[0.02] p-4">
                  <p className="text-sm font-semibold text-tejas-text mb-2">Dataset Snapshot</p>
                  <div className="space-y-2 text-xs text-tejas-muted">
                    <div className="flex justify-between gap-3">
                      <span>X_train shape</span>
                      <span className="text-tejas-text">{data.dataset?.x_train_shape?.join(' × ') || '—'}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span>X_test shape</span>
                      <span className="text-tejas-text">{data.dataset?.x_test_shape?.join(' × ') || '—'}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span>Train rows</span>
                      <span className="text-tejas-text">{data.dataset?.y_train_count || '—'}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span>Test rows</span>
                      <span className="text-tejas-text">{data.dataset?.y_test_count || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
