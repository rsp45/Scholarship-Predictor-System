import { useState } from 'react'
import { Search, Filter, Download, ChevronLeft, ChevronRight, Eye, Edit3, ShieldAlert } from 'lucide-react'

/* ───────── Mock Data ───────── */

const applicants = [
  { id: 'APP-1042', name: 'Aarav Patel', category: 'General', income: '₹6.5L', score12: '88%', cet: '92', jee: '85', finalScore: '78.4', tier: 'Tier 2', status: 'Reviewed' },
  { id: 'APP-1043', name: 'Diya Sharma', category: 'OBC', income: '₹3.2L', score12: '94%', cet: '96', jee: '91', finalScore: '92.1', tier: 'Tier 1', status: 'Approved' },
  { id: 'APP-1044', name: 'Vihaan Singh', category: 'SC', income: '₹1.8L', score12: '76%', cet: '81', jee: '74', finalScore: '84.5', tier: 'Tier 1', status: 'Pending' },
  { id: 'APP-1045', name: 'Myra Gupta', category: 'General', income: '₹12.0L', score12: '91%', cet: '89', jee: '88', finalScore: '65.2', tier: 'Tier 3', status: 'Reviewed' },
  { id: 'APP-1046', name: 'Reyansh Kumar', category: 'ST', income: '₹2.5L', score12: '82%', cet: '85', jee: '80', finalScore: '89.0', tier: 'Tier 1', status: 'Flagged' },
  { id: 'APP-1047', name: 'Pari Verma', category: 'OBC', income: '₹8.0L', score12: '85%', cet: '88', jee: '82', finalScore: '72.8', tier: 'Tier 2', status: 'Pending' },
  { id: 'APP-1048', name: 'Shaurya Das', category: 'General', income: '₹4.5L', score12: '79%', cet: '84', jee: '78', finalScore: '68.9', tier: 'Tier 3', status: 'Reviewed' },
  { id: 'APP-1049', name: 'Aadhya Reddy', category: 'General', income: '₹1.2L', score12: '96%', cet: '98', jee: '95', finalScore: '98.5', tier: 'Tier 1', status: 'Approved' },
  { id: 'APP-1050', name: 'Kabir Joshi', category: 'SC', income: '₹5.0L', score12: '72%', cet: '75', jee: '70', finalScore: '61.4', tier: 'Tier 3', status: 'Flagged' },
  { id: 'APP-1051', name: 'Fatima Khan', category: 'OBC', income: '₹2.8L', score12: '89%', cet: '91', jee: '86', finalScore: '87.2', tier: 'Tier 1', status: 'Pending' },
]

/* ───────── Custom Components ───────── */

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

function StatusBadge({ status }) {
  const colors = {
    'Approved': 'text-green-400 bg-green-500/10',
    'Pending': 'text-amber-400 bg-amber-500/10',
    'Reviewed': 'text-blue-400 bg-blue-500/10',
    'Flagged': 'text-red-400 bg-red-500/10',
  }
  return (
    <span className={`px-2 py-1 rounded-md text-xs font-medium ${colors[status]}`}>
      {status}
    </span>
  )
}

/* ═══════════════════════════════════════════════════
   APPLICANT DATABASE PAGE
   ═══════════════════════════════════════════════════ */

export default function ApplicantDatabase() {
  const [searchTerm, setSearchTerm] = useState('')

  // Filter functionality (basic mock)
  const filteredApplicants = applicants.filter(app => 
    app.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    app.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-8 max-w-[1400px] mx-auto h-full flex flex-col">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between mb-8 animate-fade-in shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-tejas-text tracking-tight">
            Applicant Database
          </h1>
          <p className="text-sm text-tejas-muted mt-1">
            Browse, search, and manage all student scholarship records.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-tejas-border text-tejas-text font-medium text-sm rounded-lg hover:bg-white/10 transition-colors">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-tejas-muted" />
            <input 
                type="text" 
                placeholder="Search by name or App ID..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-tejas-card border border-tejas-border text-sm text-tejas-text rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-tejas-gold transition-colors w-80 shadow-sm"
            />
        </div>
        <div className="flex gap-3">
            <select className="bg-tejas-card border border-tejas-border text-sm text-tejas-text rounded-lg px-3 py-2 focus:outline-none focus:border-tejas-gold appearance-none custom-select">
                <option value="">All Tiers</option>
                <option value="Tier 1">Tier 1</option>
                <option value="Tier 2">Tier 2</option>
                <option value="Tier 3">Tier 3</option>
            </select>
            <select className="bg-tejas-card border border-tejas-border text-sm text-tejas-text rounded-lg px-3 py-2 focus:outline-none focus:border-tejas-gold appearance-none custom-select">
                <option value="">All Statuses</option>
                <option value="Approved">Approved</option>
                <option value="Pending">Pending</option>
                <option value="Reviewed">Reviewed</option>
                <option value="Flagged">Flagged</option>
            </select>
            <button className="flex items-center gap-1.5 px-3 py-2 bg-tejas-card border border-tejas-border text-tejas-text hover:text-tejas-gold text-sm rounded-lg transition-colors shadow-sm">
                <Filter className="w-4 h-4" />
                More Filters
            </button>
        </div>
      </div>

      {/* ── Data Table ── */}
      <div className="bg-tejas-card border border-tejas-border rounded-xl flex-1 flex flex-col overflow-hidden shadow-sm animate-fade-in">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="sticky top-0 bg-tejas-card border-b border-tejas-border z-10 shadow-sm">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-tejas-muted uppercase tracking-wider">App ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-tejas-muted uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-tejas-muted uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-semibold text-tejas-muted uppercase tracking-wider">Income</th>
                <th className="px-6 py-4 text-xs font-semibold text-tejas-muted uppercase tracking-wider text-center" colSpan={3}>Merit Scores (12th / CET / JEE)</th>
                <th className="px-6 py-4 text-xs font-semibold text-tejas-muted uppercase tracking-wider">A.I. Score</th>
                <th className="px-6 py-4 text-xs font-semibold text-tejas-muted uppercase tracking-wider">Tier</th>
                <th className="px-6 py-4 text-xs font-semibold text-tejas-muted uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-tejas-muted uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tejas-border/50">
              {filteredApplicants.map((app) => (
                <tr key={app.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4 text-sm font-mono text-tejas-muted">{app.id}</td>
                  <td className="px-6 py-4 text-sm font-medium text-tejas-text">{app.name}</td>
                  <td className="px-6 py-4 text-sm text-tejas-muted">{app.category}</td>
                  <td className="px-6 py-4 text-sm text-tejas-muted">{app.income}</td>
                  <td className="px-2 py-4 text-sm text-tejas-muted text-right">{app.score12}</td>
                  <td className="px-2 py-4 text-sm text-tejas-muted text-center text-tejas-border">/</td>
                  <td className="px-2 py-4 text-sm text-tejas-muted text-left">{app.cet}</td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-tejas-gold">{app.finalScore}</span>
                  </td>
                  <td className="px-6 py-4">
                    <TierBadge tier={app.tier} />
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 rounded-md text-tejas-muted hover:text-blue-400 hover:bg-blue-500/10 transition-colors" title="View Profile">
                            <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 rounded-md text-tejas-muted hover:text-amber-400 hover:bg-amber-500/10 transition-colors" title="Manual Override">
                            <Edit3 className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 rounded-md text-tejas-muted hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Flag for Audit">
                            <ShieldAlert className="w-4 h-4" />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredApplicants.length === 0 && (
                <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-sm text-tejas-muted">
                        No applicants found matching "{searchTerm}"
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        <div className="bg-tejas-card border-t border-tejas-border p-4 flex items-center justify-between shrink-0">
            <span className="text-sm text-tejas-muted">Showing <span className="text-tejas-text font-medium">1</span> to <span className="text-tejas-text font-medium">{filteredApplicants.length}</span> of <span className="text-tejas-text font-medium">1,000</span> entries</span>
            <div className="flex gap-1">
                <button className="p-1 rounded text-tejas-muted hover:text-tejas-text hover:bg-white/5 disabled:opacity-50">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex gap-1 px-2">
                    <button className="w-8 h-8 rounded bg-tejas-gold/10 text-tejas-gold font-medium text-sm flex items-center justify-center">1</button>
                    <button className="w-8 h-8 rounded text-tejas-muted hover:bg-white/5 font-medium text-sm flex items-center justify-center transition-colors">2</button>
                    <button className="w-8 h-8 rounded text-tejas-muted hover:bg-white/5 font-medium text-sm flex items-center justify-center transition-colors">3</button>
                    <span className="w-8 h-8 flex items-center justify-center text-tejas-muted">...</span>
                    <button className="w-8 h-8 rounded text-tejas-muted hover:bg-white/5 font-medium text-sm flex items-center justify-center transition-colors">100</button>
                </div>
                <button className="p-1 rounded text-tejas-muted hover:text-tejas-text hover:bg-white/5 disabled:opacity-50">
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
      </div>
      
      {/* CSS for custom select arrow */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-select {
            background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%238b8fa3' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
            background-position: right 0.5rem center;
            background-repeat: no-repeat;
            background-size: 1.5em 1.5em;
            padding-right: 2.5rem;
        }
      `}} />
    </div>
  )
}
