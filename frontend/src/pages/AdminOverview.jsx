import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Award,
  IndianRupee,
  FileDown,
  Eye,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

/* ───────── Mock Data ───────── */

const kpis = [
  {
    label: 'Total Applications',
    value: '2,000',
    change: '+12%',
    trend: 'up',
    icon: TrendingUp,
  },
  {
    label: 'Avg Priority Score',
    value: '65.4',
    change: 'Stable',
    trend: 'neutral',
    icon: Award,
  },
  {
    label: 'High Priority Candidates',
    value: '142',
    change: '+5%',
    trend: 'up',
    icon: Award,
  },
  {
    label: 'Remaining Budget',
    value: '₹42L / ₹50L',
    change: 'Estimated',
    trend: 'warning',
    icon: IndianRupee,
  },
]

const pieData = [
  { name: 'Tier 1 — High Need', value: 142, color: '#22c55e' },
  { name: 'Tier 2 — Merit Based', value: 520, color: '#f5a623' },
  { name: 'Tier 3 — Standard', value: 1338, color: '#ef4444' },
]

const barData = [
  { category: 'General', allocated: 680, total: 800 },
  { category: 'OBC', allocated: 520, total: 600 },
  { category: 'SC', allocated: 420, total: 400 },
  { category: 'ST', allocated: 380, total: 350 },
]

const pendingReviews = [
  { name: 'Rohan Kapoor', score: 92.4, tier: 'Tier 1', status: 'Awaiting Audit', statusColor: 'amber' },
  { name: 'Ananya Mishra', score: 88.1, tier: 'Tier 1', status: 'Flagged for Bias', statusColor: 'red' },
  { name: 'Vikram Patel', score: 74.5, tier: 'Tier 2', status: 'Processing', statusColor: 'blue' },
  { name: 'Priya Sharma', score: 68.9, tier: 'Tier 2', status: 'Pending Review', statusColor: 'amber' },
  { name: 'Arjun Reddy', score: 56.2, tier: 'Tier 3', status: 'Reviewed', statusColor: 'green' },
]

/* ───────── Custom Tooltip ───────── */
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-tejas-card border border-tejas-border rounded-lg px-3 py-2 shadow-xl">
      <p className="text-tejas-text text-sm font-semibold">{payload[0].name || payload[0].payload?.category}</p>
      <p className="text-tejas-gold text-sm">{payload[0].value} applicants</p>
    </div>
  )
}

/* ───────── Status Pill ───────── */
function StatusPill({ label, color }) {
  const colorMap = {
    amber: 'bg-amber-500/15 text-amber-400',
    red: 'bg-red-500/15 text-red-400',
    blue: 'bg-blue-500/15 text-blue-400',
    green: 'bg-green-500/15 text-green-400',
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colorMap[color]}`}>
      {color === 'green' && <CheckCircle2 className="w-3 h-3" />}
      {color === 'amber' && <Clock className="w-3 h-3" />}
      {color === 'red' && <AlertTriangle className="w-3 h-3" />}
      {color === 'blue' && <Eye className="w-3 h-3" />}
      {label}
    </span>
  )
}

/* ───────── Tier Badge ───────── */
function TierBadge({ tier }) {
  const colors = {
    'Tier 1': 'bg-green-500/15 text-green-400 border-green-500/20',
    'Tier 2': 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    'Tier 3': 'bg-red-500/15 text-red-400 border-red-500/20',
  }

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${colors[tier]}`}>
      {tier}
    </span>
  )
}

/* ═══════════════════════════════════════════════════
   ADMIN OVERVIEW PAGE
   ═══════════════════════════════════════════════════ */

export default function AdminOverview() {
  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-tejas-text tracking-tight">
            Scholarship Cycle Overview
          </h1>
          <p className="text-sm text-tejas-muted mt-1">
            FY 2025-26 · Cycle 3 of 4
          </p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-gold-gradient text-tejas-sidebar font-semibold text-sm rounded-lg hover:shadow-lg hover:shadow-tejas-gold/20 transition-all duration-300 active:scale-[0.97]">
          <FileDown className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-4 gap-5 mb-8 stagger-children">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div
              key={kpi.label}
              className="bg-tejas-card border border-tejas-border rounded-xl p-5 card-hover"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-tejas-muted uppercase tracking-wider">
                  {kpi.label}
                </span>
                <div className="w-8 h-8 rounded-lg bg-tejas-gold/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-tejas-gold" />
                </div>
              </div>
              <p className="text-2xl font-bold text-tejas-text tracking-tight">{kpi.value}</p>
              <div className="flex items-center gap-1 mt-2">
                {kpi.trend === 'up' && <ArrowUpRight className="w-3.5 h-3.5 text-green-400" />}
                {kpi.trend === 'warning' && <ArrowDownRight className="w-3.5 h-3.5 text-amber-400" />}
                <span
                  className={`text-xs font-medium ${
                    kpi.trend === 'up'
                      ? 'text-green-400'
                      : kpi.trend === 'warning'
                      ? 'text-amber-400'
                      : 'text-tejas-muted'
                  }`}
                >
                  {kpi.change}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-2 gap-5 mb-8">
        {/* Doughnut / Pie Chart */}
        <div className="bg-tejas-card border border-tejas-border rounded-xl p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-tejas-text">Priority Distribution</h3>
            <span className="text-xs text-tejas-muted">Tiers 1-3</span>
          </div>
          <p className="text-xs text-tejas-muted mb-4">Applicant breakdown by priority tier</p>

          <div className="flex items-center">
            <div className="w-[55%]">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <p className="text-center -mt-2">
                <span className="text-2xl font-bold text-tejas-gold">84%</span>
                <span className="text-xs text-tejas-muted block">Target Reach</span>
              </p>
            </div>
            <div className="w-[45%] space-y-3 pl-4">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-tejas-text truncate">{item.name}</p>
                    <p className="text-xs text-tejas-muted">{item.value} applicants</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-tejas-card border border-tejas-border rounded-xl p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-tejas-text">Demographic Allocation</h3>
            <span className="text-xs text-tejas-muted">By Category</span>
          </div>
          <p className="text-xs text-tejas-muted mb-4">Allocated vs total applicants per category</p>

          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d37" vertical={false} />
              <XAxis
                dataKey="category"
                tick={{ fill: '#8b8fa3', fontSize: 12 }}
                axisLine={{ stroke: '#2a2d37' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#8b8fa3', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '12px', color: '#8b8fa3' }}
              />
              <Bar
                dataKey="allocated"
                name="Allocated"
                fill="#d4a843"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="total"
                name="Total Pool"
                fill="#2a2d37"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Pending Reviews Table ── */}
      <div className="bg-tejas-card border border-tejas-border rounded-xl p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-tejas-text">Pending Reviews</h3>
            <p className="text-xs text-tejas-muted mt-0.5">Applicants awaiting admin action</p>
          </div>
          <button className="text-xs font-medium text-tejas-gold hover:text-tejas-amber transition-colors flex items-center gap-1">
            View All Applications
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-tejas-border">
                <th className="text-left py-3 px-4 text-xs font-semibold text-tejas-muted uppercase tracking-wider">
                  Applicant
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-tejas-muted uppercase tracking-wider">
                  ML Score
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-tejas-muted uppercase tracking-wider">
                  Tier
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-tejas-muted uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-tejas-muted uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="stagger-children">
              {pendingReviews.map((row) => (
                <tr
                  key={row.name}
                  className="border-b border-tejas-border/50 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-3.5 px-4">
                    <p className="text-sm font-medium text-tejas-text">{row.name}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-sm font-semibold text-tejas-gold">{row.score}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <TierBadge tier={row.tier} />
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusPill label={row.status} color={row.statusColor} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button className="text-xs font-medium text-tejas-gold hover:text-tejas-amber transition-colors flex items-center gap-1 ml-auto">
                      <Eye className="w-3.5 h-3.5" />
                      Review
                    </button>
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
