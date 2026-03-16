import { Activity, Play, Settings, Server, Clock, GitBranch, ArrowUpRight, ArrowDownRight, RefreshCw, Box } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  Cell
} from 'recharts'

/* ───────── Mock Data ───────── */

const driftData = [
  { month: 'Oct', r2: 0.942, mae: 1.34 },
  { month: 'Nov', r2: 0.945, mae: 1.32 },
  { month: 'Dec', r2: 0.938, mae: 1.36 },
  { month: 'Jan', r2: 0.951, mae: 1.28 },
  { month: 'Feb', r2: 0.958, mae: 1.15 }, /* Retrain happened */
  { month: 'Mar', r2: 0.961, mae: 1.12 },
]

const models = [
  { 
    id: 'rf-v1', 
    name: 'Random Forest', 
    version: 'v1.0.0',
    type: 'Baseline', 
    r2: '0.948', 
    mae: '1.29', 
    trainTime: '45s', 
    infTime: '22ms',
    status: 'Archived',
    color: '#8b8fa3'
  },
  { 
    id: 'xgb-v1', 
    name: 'XGBoost', 
    version: 'v1.2.1',
    type: 'Production Champion', 
    r2: '0.961', 
    mae: '1.12', 
    trainTime: '12s', 
    infTime: '14ms',
    status: 'Active',
    color: '#22c55e'
  },
  { 
    id: 'lgb-v1', 
    name: 'LightGBM', 
    version: 'exp-0.1',
    type: 'Experimental', 
    r2: '0.964', 
    mae: '1.08', 
    trainTime: '3s', 
    infTime: '8ms',
    status: 'Testing',
    color: '#3b82f6'
  },
]

const comparisonChartData = [
  { metric: 'R² Score (Higher is Better)', RF: 0.948, XGB: 0.961, LGBM: 0.964, Domain: [0.93, 0.97] },
  { metric: 'MAE (Lower is Better)', RF: 1.29, XGB: 1.12, LGBM: 1.08, Domain: [0, 1.5] },
]


/* ───────── Custom Components ───────── */

function StatusBadge({ status }) {
  const colors = {
    Active: 'bg-green-500/15 text-green-400 border border-green-500/20',
    Testing: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
    Archived: 'bg-tejas-grid text-tejas-muted border border-tejas-border',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${colors[status]}`}>
      {status}
    </span>
  )
}

/* ═══════════════════════════════════════════════════
   MLOPS & MODEL COMPARISON PAGE
   ═══════════════════════════════════════════════════ */

export default function MLOps() {
  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-tejas-text tracking-tight flex items-center gap-2">
            <Server className="w-6 h-6 text-tejas-gold" />
            Automated MLOps & Model Registry
          </h1>
          <p className="text-sm text-tejas-muted mt-1">
            Monitor model drift, compare algorithms, and manage automated retraining pipelines.
          </p>
        </div>
        <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-tejas-border text-tejas-text font-medium text-sm rounded-lg hover:bg-white/10 transition-colors">
                <Settings className="w-4 h-4" />
                Pipeline Config
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gold-gradient text-tejas-sidebar font-semibold text-sm rounded-lg hover:shadow-lg hover:shadow-tejas-gold/20 transition-all">
                <Play className="w-4 h-4" />
                Trigger Retrain
            </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mb-8 stagger-children">
        {/* Current Production Active Model */}
        <div className="lg:col-span-1 bg-tejas-card border border-tejas-border rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-bl-full pointer-events-none" />
            <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-green-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    Production Champion
                </span>
                <span className="text-xs text-tejas-muted bg-tejas-grid px-2 py-1 rounded">v1.2.1</span>
            </div>
            <h2 className="text-3xl font-bold text-tejas-text mb-1">XGBoost Regressor</h2>
            <p className="text-sm text-tejas-muted mb-6">Deployed on: March 8, 2026</p>

            <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <span className="text-sm text-tejas-muted">R² Score (Accuracy)</span>
                    <span className="text-sm font-bold text-tejas-text flex items-center gap-1">0.961 <ArrowUpRight className="w-3 h-3 text-green-400" /></span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <span className="text-sm text-tejas-muted">Mean Absolute Error</span>
                    <span className="text-sm font-bold text-tejas-text flex items-center gap-1">1.12 <ArrowDownRight className="w-3 h-3 text-green-400" /></span>
                </div>
                <div className="flex items-center justify-between pb-1">
                    <span className="text-sm text-tejas-muted flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Next Auto-Retrain</span>
                    <span className="text-sm font-medium text-tejas-text">Sun, Mar 22, 02:00</span>
                </div>
            </div>
        </div>

        {/* Drift Monitoring Chart */}
        <div className="lg:col-span-2 bg-tejas-card border border-tejas-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-sm font-semibold text-tejas-text flex items-center gap-2">
                        <Activity className="w-4 h-4 text-tejas-gold" />
                        Model Drift Monitoring
                    </h3>
                    <p className="text-xs text-tejas-muted mt-1">Tracking production R² score on unseen data over time.</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-tejas-muted">
                    <span className="w-3 h-3 rounded bg-tejas-gold/20 border border-tejas-gold" />
                    R² Score
                </div>
            </div>

            <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={driftData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d4a843" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#d4a843" stopOpacity={0}/>
                    </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2d37" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: '#8b8fa3', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0.92, 0.98]} tick={{ fill: '#8b8fa3', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#13151a', border: '1px solid #2a2d37', borderRadius: '8px' }}
                        itemStyle={{ color: '#d4a843' }}
                    />
                    <Area type="monotone" dataKey="r2" stroke="#d4a843" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* ── Benchmarks matrix ── */}
      <h3 className="text-lg font-bold text-tejas-text tracking-tight mb-4 flex items-center gap-2">
        <GitBranch className="w-5 h-5 text-tejas-gold" />
        Model Registry & Benchmarks
      </h3>
      
      <div className="bg-tejas-card border border-tejas-border rounded-xl overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-tejas-border bg-white/[0.02]">
                <th className="text-left py-4 px-6 text-xs font-semibold text-tejas-muted uppercase tracking-wider">Algorithm</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-tejas-muted uppercase tracking-wider">Type</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-tejas-muted uppercase tracking-wider">Status</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-tejas-muted uppercase tracking-wider">R² Score</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-tejas-muted uppercase tracking-wider">MAE</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-tejas-muted uppercase tracking-wider">Train Time</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-tejas-muted uppercase tracking-wider">Latency</th>
                <th className="text-right py-4 px-6 text-xs font-semibold text-tejas-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="stagger-children">
              {models.map((model) => (
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
                  <td className="py-4 px-6 text-sm font-medium text-tejas-text">{model.r2}</td>
                  <td className="py-4 px-6 text-sm font-medium text-tejas-text">{model.mae}</td>
                  <td className="py-4 px-6 text-sm text-tejas-muted">{model.trainTime}</td>
                  <td className="py-4 px-6 text-sm text-tejas-muted">{model.infTime}</td>
                  <td className="py-4 px-6 text-right space-x-2">
                    {model.status !== 'Active' && (
                        <button className="text-xs font-medium text-green-400 hover:text-green-300 transition-colors px-3 py-1.5 rounded-md border border-green-500/20 hover:bg-green-500/10">
                            Promote to Prod
                        </button>
                    )}
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
