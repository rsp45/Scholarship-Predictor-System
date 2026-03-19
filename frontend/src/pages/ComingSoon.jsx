import { Construction, ArrowLeft } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

const pageTitles = {
  '/applicant-database': 'Applicant Database',
  '/fairness-audit': 'Fairness & Bias Audit',
  '/mlops': 'Automated MLOps',
  '/security': 'Security & Audit Logs',
  '/suggestions': 'Suggestions',
}

export default function ComingSoon() {
  const navigate = useNavigate()
  const location = useLocation()
  const title = pageTitles[location.pathname] || 'This Feature'

  return (
    <div className="flex-1 flex items-center justify-center p-8 min-h-[70vh]">
      <div className="text-center max-w-md animate-fade-in">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-tejas-gold/10 border border-tejas-gold/20 flex items-center justify-center mb-6">
          <Construction className="w-9 h-9 text-tejas-gold" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-tejas-text mb-2">{title}</h1>
        <p className="text-sm text-tejas-muted mb-8 leading-relaxed">
          This module is currently under development and will be available in a future release.
          Stay tuned for updates!
        </p>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-8">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Coming Soon</span>
        </div>

        {/* Back Button */}
        <div>
          <button
            onClick={() => navigate('/admin-overview')}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-tejas-muted hover:text-tejas-text border border-tejas-border rounded-lg hover:bg-white/[0.03] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
