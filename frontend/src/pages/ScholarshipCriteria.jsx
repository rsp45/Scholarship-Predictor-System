import {
  Scale,
  Wallet,
  GraduationCap,
  Landmark,
  ChevronRight,
  ChevronDown,
} from 'lucide-react'
import { useState } from 'react'

/* ───────── Expandable Section ───────── */
function Accordion({ title, icon: Icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-tejas-card border border-tejas-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        {Icon && <Icon className="w-4 h-4 text-tejas-gold flex-shrink-0" />}
        <span className="flex-1 text-sm font-semibold text-tejas-text">{title}</span>
        {open ? (
          <ChevronDown className="w-4 h-4 text-tejas-muted" />
        ) : (
          <ChevronRight className="w-4 h-4 text-tejas-muted" />
        )}
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm text-tejas-muted leading-relaxed animate-fade-in">
          {children}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   SCHOLARSHIP CRITERIA PAGE
   ═══════════════════════════════════════════════════ */

export default function ScholarshipCriteria() {
  return (
    <div className="p-8 max-w-[1100px] mx-auto">
      {/* ── Breadcrumb + Header ── */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-1.5 text-xs text-tejas-muted mb-3">
          <span>Admin</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-tejas-gold font-medium">Policy & Rules Engine</span>
        </div>
        <h1 className="text-2xl font-bold text-tejas-text tracking-tight">
          Scholarship Criteria & Scoring Logic
        </h1>
        <p className="text-sm text-tejas-muted mt-1">
          Tejas uses an <strong className="text-tejas-text">ML ensemble model (RandomForest + XGBoost)</strong> trained
          on historical applicant data to predict a Priority Score (0–100). Below are the key factors the model considers.
        </p>
      </div>


      {/* ── Weight Cards ── */}
      <div className="grid grid-cols-3 gap-4 mb-8 stagger-children">
        <div className="bg-gradient-to-br from-cyan-500/15 to-cyan-500/5 border border-cyan-500/20 rounded-xl p-5 card-hover text-center">
          <Wallet className="w-7 h-7 text-cyan-400 mx-auto mb-3" />
          <p className="text-3xl font-bold text-cyan-400 mb-1">40%</p>
          <p className="text-sm font-semibold text-tejas-text mb-1">Financial Need</p>
          <p className="text-xs text-tejas-muted">Inverse log-normal decay on family income</p>
        </div>
        <div className="bg-gradient-to-br from-pink-500/15 to-pink-500/5 border border-pink-500/20 rounded-xl p-5 card-hover text-center">
          <GraduationCap className="w-7 h-7 text-pink-400 mx-auto mb-3" />
          <p className="text-3xl font-bold text-pink-400 mb-1">40%</p>
          <p className="text-sm font-semibold text-tejas-text mb-1">Academic Merit</p>
          <p className="text-xs text-tejas-muted">Average of 12th %, MH-CET & JEE percentiles</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500/15 to-purple-500/5 border border-purple-500/20 rounded-xl p-5 card-hover text-center">
          <Landmark className="w-7 h-7 text-purple-400 mx-auto mb-3" />
          <p className="text-3xl font-bold text-purple-400 mb-1">20%</p>
          <p className="text-sm font-semibold text-tejas-text mb-1">Social Policy</p>
          <p className="text-xs text-tejas-muted">Caste, domicile & extracurricular bonuses</p>
        </div>
      </div>

      {/* ── Component Breakdown ── */}
      <h3 className="text-sm font-semibold text-tejas-text mb-4">📖 Component Breakdown</h3>
      <div className="space-y-3 mb-8">
        <Accordion title="💰 Financial Need (40%)" icon={Wallet} defaultOpen>
          <p className="mb-2"><strong className="text-tejas-text">Objective:</strong> Prioritize students from lower-income backgrounds.</p>
          <p className="mb-2"><strong className="text-tejas-text">Logic:</strong> We use a Log-Normal Decay function:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Income &lt; ₹2 Lakhs → <span className="text-green-400">Maximum score (~100 points)</span></li>
            <li>Income &gt; ₹20 Lakhs → <span className="text-red-400">Minimum score (~0 points)</span></li>
          </ul>
          <p className="mt-2 text-xs italic">This ensures that the difference between ₹3L and ₹4L carries more weight than ₹25L vs ₹26L — reflecting real-world impact.</p>
        </Accordion>

        <Accordion title="📚 Academic Merit (40%)" icon={GraduationCap}>
          <p className="mb-2"><strong className="text-tejas-text">Objective:</strong> Reward hard work and talent.</p>
          <p className="mb-2"><strong className="text-tejas-text">Logic:</strong> Average percentile across three key exams:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>12th Grade Percentage</li>
            <li>MH-CET Percentile</li>
            <li>JEE Mains Percentile</li>
          </ol>
          <p className="mt-2 text-xs italic">Each exam is weighted equally to prevent over-reliance on a single assessment.</p>
        </Accordion>

        <Accordion title="🏛️ Social Policy & Bonuses (20%)" icon={Landmark}>
          <p className="mb-3"><strong className="text-tejas-text">Objective:</strong> Adhere to government Affirmative Action mandates.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-tejas-border">
                  <th className="text-left py-2 px-3 text-tejas-muted font-semibold">Criterion</th>
                  <th className="text-left py-2 px-3 text-tejas-muted font-semibold">Category</th>
                  <th className="text-center py-2 px-3 text-tejas-muted font-semibold">Bonus</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Caste Category', 'General', '+0'],
                  ['', 'OBC', '+5'],
                  ['', 'SC', '+10'],
                  ['', 'ST', '+15'],
                  ['Domicile', 'Maharashtra', '+5'],
                  ['Extracurriculars', 'Score (0-10)', '+1 to +10'],
                  ['Disability', 'PwD', '+10'],
                  ['Gender', 'Female', '+5'],
                  ['Gap Year', '> 0 years', '−5'],
                ].map(([crit, cat, bonus], i) => (
                  <tr key={i} className="border-b border-tejas-border/30">
                    <td className="py-2 px-3 text-tejas-text font-medium">{crit}</td>
                    <td className="py-2 px-3">{cat}</td>
                    <td className="py-2 px-3 text-center text-tejas-gold font-semibold">{bonus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Accordion>
      </div>

      {/* ── Tier Classification ── */}
      <h3 className="text-sm font-semibold text-tejas-text mb-4">🎯 Score Interpretation — Tier Classification</h3>
      <div className="grid grid-cols-3 gap-4 stagger-children">
        <div className="bg-gradient-to-br from-green-500/15 to-green-500/5 border border-green-500/20 rounded-xl p-5 text-center card-hover">
          <p className="text-3xl font-bold text-green-400 mb-1">80 – 100</p>
          <p className="text-sm font-semibold text-green-400 mb-2">🟢 High Priority</p>
          <p className="text-xs text-tejas-muted"><strong className="text-tejas-text">Full Scholarship (100% Waiver)</strong><br />Highly recommended for immediate funding.</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500/15 to-amber-500/5 border border-amber-500/20 rounded-xl p-5 text-center card-hover">
          <p className="text-3xl font-bold text-amber-400 mb-1">50 – 79</p>
          <p className="text-sm font-semibold text-amber-400 mb-2">🟠 Medium Priority</p>
          <p className="text-xs text-tejas-muted"><strong className="text-tejas-text">Partial Aid (50% Waiver)</strong><br />Recommended if funds are available.</p>
        </div>
        <div className="bg-gradient-to-br from-red-500/15 to-red-500/5 border border-red-500/20 rounded-xl p-5 text-center card-hover">
          <p className="text-3xl font-bold text-red-400 mb-1">0 – 49</p>
          <p className="text-sm font-semibold text-red-400 mb-2">🔴 Low Priority</p>
          <p className="text-xs text-tejas-muted"><strong className="text-tejas-text">No Aid</strong><br />Does not meet the current threshold.</p>
        </div>
      </div>
    </div>
  )
}
