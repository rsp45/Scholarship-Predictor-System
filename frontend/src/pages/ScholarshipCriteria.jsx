import { useState } from 'react'
import {
  ShieldAlert,
  Sliders,
  LineChart,
  Scale,
  DollarSign,
  BookOpenText,
  BadgeCheck,
  AlertTriangle,
  CircleDashed,
  ChevronRight,
  ChevronDown,
  Trophy,
  TrendingUp,
  BarChart3,
} from 'lucide-react'

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

export default function ScholarshipCriteria() {
  const [expandedSection, setExpandedSection] = useState(0)

  const toggleSection = (idx) => {
    setExpandedSection(expandedSection === idx ? -1 : idx)
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="mb-12 animate-fade-in">
        <div className="flex items-center gap-1.5 text-xs text-tejas-muted mb-3">
          <span>Admin</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-tejas-gold font-medium">Policy & Rules Engine</span>
        </div>
        <h1 className="text-3xl font-bold text-tejas-text tracking-tight">
          Scholarship Allocation Policy & Rules
        </h1>
        <p className="text-sm text-tejas-muted mt-2 max-w-2xl">
          Tejas v2026.1 uses an <strong className="text-tejas-text">intelligent multi-track scoring engine</strong> with hard eligibility filters, non-linear scoring mathematics, and fairness audits to ensure equitable and transparent scholarship allocation.
        </p>
      </div>

      {/* SECTION 1: HARD ELIGIBILITY FILTERS */}
      <div
        onClick={() => toggleSection(0)}
        className="mb-6 bg-[#1a1d27] border border-red-500/20 hover:bg-red-500/5 rounded-xl overflow-hidden cursor-pointer transition-all hover:border-red-500/40"
      >
        <div className="flex items-center gap-3 px-6 py-5">
          <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div className="flex-1">
            <h2 className="text-base font-bold text-tejas-text">1. Hard Eligibility Filters (The Guardrails)</h2>
            <p className="text-xs text-tejas-muted mt-1">Universal mandates that instantly classify students as Tier 4: Ineligible</p>
          </div>
          {expandedSection === 0 ? (
            <ChevronDown className="w-5 h-5 text-tejas-muted" />
          ) : (
            <ChevronRight className="w-5 h-5 text-tejas-muted" />
          )}
        </div>
        {expandedSection === 0 && (
          <div className="px-6 pb-6 border-t border-tejas-border bg-[#0f1117]">
            <div className="space-y-4 mt-4">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-sm font-semibold text-red-300 mb-2">❌ Automatic Tier 4 (Ineligible)</p>
                <ul className="space-y-2 text-sm text-tejas-muted">
                  <li className="flex gap-2">
                    <span className="text-red-400 font-bold">•</span>
                    <span><strong className="text-tejas-text">12th Grade Marks {'<'} 60%</strong> — Below foundational academic standard</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-400 font-bold">•</span>
                    <span><strong className="text-tejas-text">Annual Family Income {'>'} ₹25,00,000</strong> — Financial need threshold exceeded (applies to all tracks)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-400 font-bold">•</span>
                    <span><strong className="text-tejas-text">Merit-Based Track Special</strong>: Missing entrance exam (JEE/NEET/MH-CET) OR exam score {'<'} 50th percentile</span>
                  </li>
                </ul>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <p className="text-sm font-semibold text-green-300 mb-2">✅ Eligible for Scoring</p>
                <p className="text-sm text-tejas-muted">Students passing all hard filters proceed to the multi-track scoring engine, where their Merit, Need, and Policy scores determine final tier.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: MULTI-TRACK WEIGHTING */}
      <div
        onClick={() => toggleSection(1)}
        className="mb-6 bg-[#1a1d27] border border-cyan-500/20 hover:bg-cyan-500/5 rounded-xl overflow-hidden cursor-pointer transition-all hover:border-cyan-500/40"
      >
        <div className="flex items-center gap-3 px-6 py-5">
          <Sliders className="w-5 h-5 text-cyan-400 flex-shrink-0" />
          <div className="flex-1">
            <h2 className="text-base font-bold text-tejas-text">2. Multi-Track Weighting System</h2>
            <p className="text-xs text-tejas-muted mt-1">Engine dynamically shifts scoring weights based on application track</p>
          </div>
          {expandedSection === 1 ? (
            <ChevronDown className="w-5 h-5 text-tejas-muted" />
          ) : (
            <ChevronRight className="w-5 h-5 text-tejas-muted" />
          )}
        </div>
        {expandedSection === 1 && (
          <div className="px-6 pb-6 border-t border-tejas-border bg-[#0f1117]">
            <div className="space-y-4 mt-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-300 mb-3">🎓 Merit-Based Track</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-tejas-muted"><strong className="text-tejas-text">Merit Score</strong></span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-tejas-border rounded-full h-2">
                        <div className="bg-blue-400 h-2 rounded-full" style={{ width: '70%' }}></div>
                      </div>
                      <span className="text-sm font-bold text-blue-400">70%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-tejas-muted"><strong className="text-tejas-text">Income Score</strong></span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-tejas-border rounded-full h-2">
                        <div className="bg-cyan-400 h-2 rounded-full" style={{ width: '15%' }}></div>
                      </div>
                      <span className="text-sm font-bold text-cyan-400">15%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-tejas-muted"><strong className="text-tejas-text">Policy Bonuses</strong></span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-tejas-border rounded-full h-2">
                        <div className="bg-purple-400 h-2 rounded-full" style={{ width: '15%' }}></div>
                      </div>
                      <span className="text-sm font-bold text-purple-400">15%</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-tejas-muted mt-3">For students with high academic scores and entrance exam performance.</p>
              </div>

              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                <p className="text-sm font-semibold text-orange-300 mb-3">💰 Need-Based Track</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-tejas-muted"><strong className="text-tejas-text">Income Score</strong></span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-tejas-border rounded-full h-2">
                        <div className="bg-orange-400 h-2 rounded-full" style={{ width: '70%' }}></div>
                      </div>
                      <span className="text-sm font-bold text-orange-400">70%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-tejas-muted"><strong className="text-tejas-text">Merit Score</strong></span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-tejas-border rounded-full h-2">
                        <div className="bg-blue-400 h-2 rounded-full" style={{ width: '15%' }}></div>
                      </div>
                      <span className="text-sm font-bold text-blue-400">15%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-tejas-muted"><strong className="text-tejas-text">Policy Bonuses</strong></span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-tejas-border rounded-full h-2">
                        <div className="bg-purple-400 h-2 rounded-full" style={{ width: '15%' }}></div>
                      </div>
                      <span className="text-sm font-bold text-purple-400">15%</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-tejas-muted mt-3">For students from lower-income backgrounds with reasonable academics.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: NON-LINEAR SCORING MATHEMATICS */}
      <div
        onClick={() => toggleSection(2)}
        className="mb-6 bg-[#1a1d27] border border-purple-500/20 hover:bg-purple-500/5 rounded-xl overflow-hidden cursor-pointer transition-all hover:border-purple-500/40"
      >
        <div className="flex items-center gap-3 px-6 py-5">
          <LineChart className="w-5 h-5 text-purple-400 flex-shrink-0" />
          <div className="flex-1">
            <h2 className="text-base font-bold text-tejas-text">3. Non-Linear Scoring Mathematics</h2>
            <p className="text-xs text-tejas-muted mt-1">Advanced formulas ensure fairness and capture real-world impact</p>
          </div>
          {expandedSection === 2 ? (
            <ChevronDown className="w-5 h-5 text-tejas-muted" />
          ) : (
            <ChevronRight className="w-5 h-5 text-tejas-muted" />
          )}
        </div>
        {expandedSection === 2 && (
          <div className="px-6 pb-6 border-t border-tejas-border bg-[#0f1117]">
            <div className="space-y-5 mt-4">
              <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-lg p-4">
                <h3 className="text-sm font-bold text-amber-300 mb-3">💰 True Financial Need (Logarithmic Decay)</h3>
                <div className="space-y-3 text-sm text-tejas-muted">
                  <p className="flex gap-2">
                    <span className="text-amber-400 font-mono">①</span>
                    <span><strong className="text-tejas-text">Step 1:</strong> Adjust income for dependents: <code className="text-amber-300 bg-[#1a1d27] px-1.5 py-0.5 rounded text-xs">Per-Capita Income = Annual Income ÷ (Dependents + 1)</code></span>
                  </p>
                  <p className="flex gap-2">
                    <span className="text-amber-400 font-mono">②</span>
                    <span><strong className="text-tejas-text">Step 2:</strong> Apply logarithmic decay: <code className="text-amber-300 bg-[#1a1d27] px-1.5 py-0.5 rounded text-xs">Score = log(₹20L ÷ Income) / log(100) × 100</code></span>
                  </p>
                  <p className="flex gap-2">
                    <span className="text-amber-400 font-mono">③</span>
                    <span><strong className="text-tejas-text">Effect:</strong> ₹1L income {'→'} <span className="text-green-400 font-semibold">95 pts</span> | ₹3L {'→'} <span className="text-green-400 font-semibold">81 pts</span> | ₹20L {'→'} <span className="text-red-400 font-semibold">0 pts</span></span>
                  </p>
                  <p className="text-xs italic text-tejas-muted border-t border-amber-500/20 pt-2 mt-2">The gap between ₹1L-₹3L (14 pts) is much larger than ₹18L-₹20L (2 pts), reflecting real-world impact.</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-pink-500/10 to-rose-500/10 border border-pink-500/20 rounded-lg p-4">
                <h3 className="text-sm font-bold text-pink-300 mb-3">🎓 Academic Merit (Sigmoid Curve)</h3>
                <div className="space-y-3 text-sm text-tejas-muted">
                  <p className="flex gap-2">
                    <span className="text-pink-400 font-mono">①</span>
                    <span><strong className="text-tejas-text">Step 1:</strong> Average exam percentiles: <code className="text-pink-300 bg-[#1a1d27] px-1.5 py-0.5 rounded text-xs">Avg = (12th% + Exam₁% + Exam₂% + ...) ÷ N</code></span>
                  </p>
                  <p className="flex gap-2">
                    <span className="text-pink-400 font-mono">②</span>
                    <span><strong className="text-tejas-text">Step 2:</strong> Pass through sigmoid: <code className="text-pink-300 bg-[#1a1d27] px-1.5 py-0.5 rounded text-xs">Score = 100 ÷ (1 + e^(-k(x-50)))</code></span>
                  </p>
                  <p className="flex gap-2">
                    <span className="text-pink-400 font-mono">③</span>
                    <span><strong className="text-tejas-text">Effect:</strong> 60% {'→'} <span className="text-green-400 font-semibold">55 pts</span> | 75% {'→'} <span className="text-green-400 font-semibold">73 pts</span> | 95% {'→'} <span className="text-green-400 font-semibold">95 pts</span></span>
                  </p>
                  <p className="text-xs italic text-tejas-muted border-t border-pink-500/20 pt-2 mt-2">Emphasizes the jump from 60→75% (18 pts gain), while 95→97% yields only 1 pt. Diminishing returns model.</p>
                </div>
              </div>

              <div className="bg-teal-500/10 border border-teal-500/20 rounded-lg p-4">
                <h3 className="text-sm font-bold text-teal-300 mb-3">📊 Competitive Exam Integration</h3>
                <p className="text-sm text-tejas-muted mb-2">If student took <strong className="text-tejas-text">JEE / NEET / MH-CET</strong>:</p>
                <ul className="space-y-2 text-sm text-tejas-muted">
                  <li className="flex gap-2">
                    <span className="text-teal-400">•</span>
                    <span>Merit average becomes <strong className="text-tejas-text">5-exam average</strong> (includes competitive exam percentile)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-teal-400">•</span>
                    <span>Competitive exam must score <strong className="text-tejas-text">≥50th percentile</strong> to count (otherwise ignored)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-teal-400">•</span>
                    <span>Example: 12th 80% + JEE 88th percentile + MH-CET 76% = <strong className="text-tejas-text">(80+88+76+50+50)÷5 = 68.8% merit</strong></span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 4: POLICY CONSTRAINTS & FAIRNESS AUDITS */}
      <div
        onClick={() => toggleSection(3)}
        className="mb-6 bg-[#1a1d27] border border-emerald-500/20 hover:bg-emerald-500/5 rounded-xl overflow-hidden cursor-pointer transition-all hover:border-emerald-500/40"
      >
        <div className="flex items-center gap-3 px-6 py-5">
          <Scale className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div className="flex-1">
            <h2 className="text-base font-bold text-tejas-text">4. Policy Constraints & Fairness Audits</h2>
            <p className="text-xs text-tejas-muted mt-1">Real-time bias detection and affirmative action compliance</p>
          </div>
          {expandedSection === 3 ? (
            <ChevronDown className="w-5 h-5 text-tejas-muted" />
          ) : (
            <ChevronRight className="w-5 h-5 text-tejas-muted" />
          )}
        </div>
        {expandedSection === 3 && (
          <div className="px-6 pb-6 border-t border-tejas-border bg-[#0f1117]">
            <div className="space-y-4 mt-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                <p className="text-sm font-semibold text-emerald-300 mb-3">🎁 Policy Bonuses (Hard-Capped at 20 pts)</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-[#1a1d27] border border-tejas-border rounded p-3">
                    <p className="text-tejas-muted"><strong className="text-tejas-text">Caste Category</strong></p>
                    <p className="text-xs text-tejas-muted mt-1">General: 0 | OBC: +5 | SC: +10 | ST: +15</p>
                  </div>
                  <div className="bg-[#1a1d27] border border-tejas-border rounded p-3">
                    <p className="text-tejas-muted"><strong className="text-tejas-text">Domicile (Maharashtra)</strong></p>
                    <p className="text-xs text-tejas-muted mt-1">Yes: +5 | No: 0</p>
                  </div>
                  <div className="bg-[#1a1d27] border border-tejas-border rounded p-3">
                    <p className="text-tejas-muted"><strong className="text-tejas-text">Gender Bonus</strong></p>
                    <p className="text-xs text-tejas-muted mt-1">Female/Other: +5 | Male: 0</p>
                  </div>
                  <div className="bg-[#1a1d27] border border-tejas-border rounded p-3">
                    <p className="text-tejas-muted"><strong className="text-tejas-text">Disability (PwD)</strong></p>
                    <p className="text-xs text-tejas-muted mt-1">Yes: +10 | No: 0</p>
                  </div>
                  <div className="col-span-2 bg-[#1a1d27] border border-tejas-border rounded p-3">
                    <p className="text-tejas-muted"><strong className="text-tejas-text">Extracurricular (Score 0-10)</strong></p>
                    <p className="text-xs text-tejas-muted mt-1">0-4: 0 | 5-6: +2 | 7-8: +5 | 9-10: +10</p>
                  </div>
                </div>
                <div className="border-t border-emerald-500/20 mt-3 pt-3">
                  <p className="text-xs text-emerald-300 font-semibold">⚠️ HARD CAP: Maximum 20 Policy Points</p>
                  <p className="text-xs text-emerald-300 mt-1">Even if ST + Female + PwD + 10/10 Extracurricular = 40 pts naturally, system caps at <strong>20 pts</strong>. This prevents "bonus stacking" and ensures Merit & Income remain primary factors.</p>
                </div>
              </div>

              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4">
                <p className="text-sm font-semibold text-indigo-300 mb-3">🔍 Real-Time Demographic Parity Audit</p>
                <p className="text-sm text-tejas-muted mb-3">System monitors:</p>
                <ul className="space-y-2 text-xs text-tejas-muted">
                  <li className="flex gap-2">
                    <span className="text-indigo-400 font-bold">→</span>
                    <span><strong className="text-tejas-text">Overall Selection Rate:</strong> % of eligible applicants receiving aid (alert if {'<'} 30%)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-indigo-400 font-bold">→</span>
                    <span><strong className="text-tejas-text">Gender Distribution:</strong> % Female vs Male selected (alert if disparity {'>'} 15%)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-indigo-400 font-bold">→</span>
                    <span><strong className="text-tejas-text">Caste Distribution:</strong> % SC/ST vs General selected (alert if disparity {'>'} 20%)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-indigo-400 font-bold">→</span>
                    <span><strong className="text-tejas-text">SC/ST Target Multiplier:</strong> SC/ST selection rate should be ≥ 1.5× General rate</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 5: ALLOCATION ENGINE */}
      <div
        onClick={() => toggleSection(4)}
        className="mb-8 bg-[#1a1d27] border border-yellow-500/20 hover:bg-yellow-500/5 rounded-xl overflow-hidden cursor-pointer transition-all hover:border-yellow-500/40"
      >
        <div className="flex items-center gap-3 px-6 py-5">
          <DollarSign className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <div className="flex-1">
            <h2 className="text-base font-bold text-tejas-text">5. The Allocation Engine (Budget vs. Ranking)</h2>
            <p className="text-xs text-tejas-muted mt-1">Final step: How scholarships are awarded based on configuration</p>
          </div>
          {expandedSection === 4 ? (
            <ChevronDown className="w-5 h-5 text-tejas-muted" />
          ) : (
            <ChevronRight className="w-5 h-5 text-tejas-muted" />
          )}
        </div>
        {expandedSection === 4 && (
          <div className="px-6 pb-6 border-t border-tejas-border bg-[#0f1117]">
            <div className="space-y-4 mt-4">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <h3 className="text-sm font-bold text-green-300 mb-3">💰 Mode 1: Strict Budget Allocation</h3>
                <div className="space-y-2 text-sm text-tejas-muted">
                  <p className="flex gap-2">
                    <span className="text-green-400 font-mono">①</span>
                    <span><strong className="text-tejas-text">Setup:</strong> Admin sets a master budget (e.g., ₹1 Crore)</span>
                  </p>
                  <p className="flex gap-2">
                    <span className="text-green-400 font-mono">②</span>
                    <span><strong className="text-tejas-text">Algorithm:</strong> Sort all eligible students by final score (descending)</span>
                  </p>
                  <p className="flex gap-2">
                    <span className="text-green-400 font-mono">③</span>
                    <span><strong className="text-tejas-text">Loop:</strong> For each student top-to-bottom, allocate 100% waiver (for Tier 1) or 60% (for Tier 2) until budget remaining = ₹0</span>
                  </p>
                  <p className="flex gap-2">
                    <span className="text-green-400 font-mono">④</span>
                    <span><strong className="text-tejas-text">Result:</strong> Tier 3 students placed on waitlist; Tier 4 marked ineligible</span>
                  </p>
                </div>
                <div className="bg-[#1a1d27] border border-green-500/20 rounded p-3 mt-3">
                  <p className="text-xs text-green-300"><strong>Example:</strong> Budget ₹1Cr, Top 120 students need ₹95L (Tiers 1-2). Ranked 121-145 go to waitlist.</p>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h3 className="text-sm font-bold text-blue-300 mb-3">🏆 Mode 2: Percentile Ranking (No Budget)</h3>
                <div className="space-y-2 text-sm text-tejas-muted">
                  <p className="flex gap-2">
                    <span className="text-blue-400 font-mono">①</span>
                    <span><strong className="text-tejas-text">Setup:</strong> No fixed budget; only percentile thresholds set</span>
                  </p>
                  <p className="flex gap-2">
                    <span className="text-blue-400 font-mono">②</span>
                    <span><strong className="text-tejas-text">Algorithm:</strong> Divide eligible students into percentile buckets</span>
                  </p>
                  <p className="flex gap-2">
                    <span className="text-blue-400 font-mono">③</span>
                    <span><strong className="text-tejas-text">Allocation:</strong> Top 10% = <strong className="text-blue-300">Tier 1 (100% waiver)</strong> | Next 20% = <strong className="text-blue-300">Tier 2 (60% aid)</strong> | Remaining = <strong className="text-blue-300">Tier 3</strong></span>
                  </p>
                  <p className="flex gap-2">
                    <span className="text-blue-400 font-mono">④</span>
                    <span><strong className="text-tejas-text">Advantage:</strong> Guarantees fairness across cohorts; predictable outcomes</span>
                  </p>
                </div>
                <div className="bg-[#1a1d27] border border-blue-500/20 rounded p-3 mt-3">
                  <p className="text-xs text-blue-300"><strong>Example:</strong> 1000 eligible students. Top 100 = Tier 1, Next 200 = Tier 2, Remaining 700 = Tier 3 (appeal eligible).</p>
                </div>
              </div>

              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                <h3 className="text-sm font-bold text-purple-300 mb-3">⚙️ Tier Classification & Awards</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between p-2 bg-[#1a1d27] rounded border border-green-500/20">
                    <div>
                      <p className="font-semibold text-green-400">Tier 1</p>
                      <p className="text-xs text-tejas-muted">Score: 80-100</p>
                    </div>
                    <p className="text-sm text-green-400 text-right"><strong>100% Waiver<br />Full Scholarship</strong></p>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-[#1a1d27] rounded border border-amber-500/20">
                    <div>
                      <p className="font-semibold text-amber-400">Tier 2</p>
                      <p className="text-xs text-tejas-muted">Score: 50-79</p>
                    </div>
                    <p className="text-sm text-amber-400 text-right"><strong>60% Aid<br />Partial Scholarship</strong></p>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-[#1a1d27] rounded border border-blue-500/20">
                    <div>
                      <p className="font-semibold text-blue-400">Tier 3</p>
                      <p className="text-xs text-tejas-muted">Score: 0-49</p>
                    </div>
                    <p className="text-sm text-blue-400 text-right"><strong>Appeal Eligible<br />Waitlist</strong></p>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-[#1a1d27] rounded border border-red-500/20">
                    <div>
                      <p className="font-semibold text-red-400">Tier 4</p>
                      <p className="text-xs text-tejas-muted">Hard filters violated</p>
                    </div>
                    <p className="text-sm text-red-400 text-right"><strong>Ineligible<br />Automatically</strong></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <p className="text-xs font-semibold text-blue-300">Transparency</p>
          </div>
          <p className="text-xs text-tejas-muted">Every student decision is explainable through SHAP waterfall charts and audit logs.</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <p className="text-xs font-semibold text-emerald-300">Fairness</p>
          </div>
          <p className="text-xs text-tejas-muted">Real-time audits flag demographic disparities and ensure compliance with affirmative action policies.</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-purple-400" />
            <p className="text-xs font-semibold text-purple-300">Standardization</p>
          </div>
          <p className="text-xs text-tejas-muted">Identical rules across all cohorts ensure consistent, predictable scholarship awards.</p>
        </div>
      </div>
    </div>
  )
}
