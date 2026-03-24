import { useState } from 'react'
import {
  ShieldAlert,
  Sliders,
  LineChart,
  Scale,
  DollarSign,
  ChevronRight,
  ChevronDown,
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
          <span className="text-tejas-gold font-medium">Policy & Rules</span>
        </div>
        <h1 className="text-3xl font-bold text-tejas-text tracking-tight">
          Scholarship Allocation Policy
        </h1>
        <p className="text-sm text-tejas-muted mt-2 max-w-2xl">
          Tejas uses an <strong className="text-tejas-text">intelligent multi-track scoring system</strong> with clear eligibility requirements, fair scoring methods, and diversity checks to ensure an equitable and transparent scholarship distribution.
        </p>
      </div>

      {/* SECTION 1: BASIC ELIGIBILITY CRITERIA */}
      <div
        onClick={() => toggleSection(0)}
        className="mb-6 bg-[#1a1d27] border border-red-500/20 hover:bg-red-500/5 rounded-xl overflow-hidden cursor-pointer transition-all hover:border-red-500/40"
      >
        <div className="flex items-center gap-3 px-6 py-5">
          <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div className="flex-1">
            <h2 className="text-base font-bold text-tejas-text">1. Basic Eligibility Criteria</h2>
            <p className="text-xs text-tejas-muted mt-1">Essential requirements that all applicants must meet to be considered</p>
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
                <p className="text-sm font-semibold text-red-300 mb-2">Important Requirements (Failure to meet assigns Tier 4: Ineligible)</p>
                <ul className="space-y-2 text-sm text-tejas-muted">
                  <li className="flex gap-2">
                    <span className="text-red-400 font-bold">•</span>
                    <span><strong className="text-tejas-text">12th Grade Marks Minimum</strong>: You must have scored at least 60% to demonstrate a foundational academic standard.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-400 font-bold">•</span>
                    <span><strong className="text-tejas-text">Annual Family Income Limit</strong>: Your total family income cannot exceed ₹25,00,000 to ensure funds are available for those in need.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-400 font-bold">•</span>
                    <span><strong className="text-tejas-text">Merit-Based Track Specific</strong>: You must have taken an entrance exam (JEE, NEET, MH-CET) and scored in the 50th percentile or above.</span>
                  </li>
                </ul>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <p className="text-sm font-semibold text-green-300 mb-2">Eligible for Scoring</p>
                <p className="text-sm text-tejas-muted">Students passing all basic filters proceed to our multi-track evaluation where Merit, Need, and Policy scores determine the final award tier.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: APPLICATION EVALUATION TRACKS */}
      <div
        onClick={() => toggleSection(1)}
        className="mb-6 bg-[#1a1d27] border border-cyan-500/20 hover:bg-cyan-500/5 rounded-xl overflow-hidden cursor-pointer transition-all hover:border-cyan-500/40"
      >
        <div className="flex items-center gap-3 px-6 py-5">
          <Sliders className="w-5 h-5 text-cyan-400 flex-shrink-0" />
          <div className="flex-1">
            <h2 className="text-base font-bold text-tejas-text">2. How We Evaluate Applications</h2>
            <p className="text-xs text-tejas-muted mt-1">Our system dynamically shifts scoring priorities based on your application track</p>
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
                <p className="text-sm font-semibold text-blue-300 mb-3">Merit-Based Track</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-tejas-muted"><strong className="text-tejas-text">Academics</strong></span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-tejas-border rounded-full h-2">
                        <div className="bg-blue-400 h-2 rounded-full" style={{ width: '70%' }}></div>
                      </div>
                      <span className="text-sm font-bold text-blue-400">70%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-tejas-muted"><strong className="text-tejas-text">Financial Need</strong></span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-tejas-border rounded-full h-2">
                        <div className="bg-cyan-400 h-2 rounded-full" style={{ width: '15%' }}></div>
                      </div>
                      <span className="text-sm font-bold text-cyan-400">15%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-tejas-muted"><strong className="text-tejas-text">Diversity & Extracurriculars</strong></span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-tejas-border rounded-full h-2">
                        <div className="bg-purple-400 h-2 rounded-full" style={{ width: '15%' }}></div>
                      </div>
                      <span className="text-sm font-bold text-purple-400">15%</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-tejas-muted mt-3">Designed for students with strong academic achievements and competitive exam scores.</p>
              </div>

              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                <p className="text-sm font-semibold text-orange-300 mb-3">Need-Based Track</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-tejas-muted"><strong className="text-tejas-text">Financial Need</strong></span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-tejas-border rounded-full h-2">
                        <div className="bg-orange-400 h-2 rounded-full" style={{ width: '70%' }}></div>
                      </div>
                      <span className="text-sm font-bold text-orange-400">70%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-tejas-muted"><strong className="text-tejas-text">Academics</strong></span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-tejas-border rounded-full h-2">
                        <div className="bg-blue-400 h-2 rounded-full" style={{ width: '15%' }}></div>
                      </div>
                      <span className="text-sm font-bold text-blue-400">15%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-tejas-muted"><strong className="text-tejas-text">Diversity & Extracurriculars</strong></span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-tejas-border rounded-full h-2">
                        <div className="bg-purple-400 h-2 rounded-full" style={{ width: '15%' }}></div>
                      </div>
                      <span className="text-sm font-bold text-purple-400">15%</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-tejas-muted mt-3">Designed to prioritize support for students from lower-income backgrounds with good academic standing.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: FAIR SCORING METHODS */}
      <div
        onClick={() => toggleSection(2)}
        className="mb-6 bg-[#1a1d27] border border-purple-500/20 hover:bg-purple-500/5 rounded-xl overflow-hidden cursor-pointer transition-all hover:border-purple-500/40"
      >
        <div className="flex items-center gap-3 px-6 py-5">
          <LineChart className="w-5 h-5 text-purple-400 flex-shrink-0" />
          <div className="flex-1">
            <h2 className="text-base font-bold text-tejas-text">3. Fair Scoring Methods</h2>
            <p className="text-xs text-tejas-muted mt-1">Our system uses thoughtful logic to ensure a fair evaluation for everyone</p>
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
                <h3 className="text-sm font-bold text-amber-300 mb-3">Financial Need Assessment</h3>
                <div className="space-y-3 text-sm text-tejas-muted">
                  <p className="flex gap-2">
                    <span className="text-amber-400 font-mono">1.</span>
                    <span><strong className="text-tejas-text">Family Size Context:</strong> We first understand your total family income in the context of your family size by looking at the per-capita income.</span>
                  </p>
                  <p className="flex gap-2">
                    <span className="text-amber-400 font-mono">2.</span>
                    <span><strong className="text-tejas-text">Progressive Scoring:</strong> Lower incomes receive appropriately higher scores. For instance, an income around ₹1 Lakh might score nearly fully, while an income closer to ₹20 Lakhs will score less. We make sure small variations in lower incomes reflect greater real-world impact.</span>
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-pink-500/10 to-rose-500/10 border border-pink-500/20 rounded-lg p-4">
                <h3 className="text-sm font-bold text-pink-300 mb-3">Academic Merit Evaluation</h3>
                <div className="space-y-3 text-sm text-tejas-muted">
                  <p className="flex gap-2">
                    <span className="text-pink-400 font-mono">1.</span>
                    <span><strong className="text-tejas-text">Balanced Averages:</strong> We look at the average of all your submitted exam percentiles, rather than relying on a single test.</span>
                  </p>
                  <p className="flex gap-2">
                    <span className="text-pink-400 font-mono">2.</span>
                    <span><strong className="text-tejas-text">Rewarding Improvement:</strong> A jump from an average of 60% to 75% is highly rewarded in points. As you near perfection, points increase steadily to acknowledge your hard work, without strictly punishing near-perfect scores.</span>
                  </p>
                </div>
              </div>

              <div className="bg-teal-500/10 border border-teal-500/20 rounded-lg p-4">
                <h3 className="text-sm font-bold text-teal-300 mb-3">Competitive Exams Integration</h3>
                <p className="text-sm text-tejas-muted mb-2">If you have taken a major exam such as JEE, NEET, or MH-CET:</p>
                <ul className="space-y-2 text-sm text-tejas-muted">
                  <li className="flex gap-2">
                    <span className="text-teal-400">•</span>
                    <span>Your merit score calculation will include your competitive exam percentiles.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-teal-400">•</span>
                    <span>This exam score will only count if it is in the 50th percentile or above.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-teal-400">•</span>
                    <span>All qualifying marks are fairly averaged into an overall academic score.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 4: EQUAL OPPORTUNITY */}
      <div
        onClick={() => toggleSection(3)}
        className="mb-6 bg-[#1a1d27] border border-emerald-500/20 hover:bg-emerald-500/5 rounded-xl overflow-hidden cursor-pointer transition-all hover:border-emerald-500/40"
      >
        <div className="flex items-center gap-3 px-6 py-5">
          <Scale className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div className="flex-1">
            <h2 className="text-base font-bold text-tejas-text">4. Equal Opportunity & Fairness Checks</h2>
            <p className="text-xs text-tejas-muted mt-1">Monitoring and promoting a diverse community</p>
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
                <p className="text-sm font-semibold text-emerald-300 mb-3">Diversity Bonuses (Capped at 20 points total)</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-[#1a1d27] border border-tejas-border rounded p-3">
                    <p className="text-tejas-muted"><strong className="text-tejas-text">Community Category</strong></p>
                    <p className="text-xs text-tejas-muted mt-1">General: 0 | OBC: +5 | SC: +10 | ST: +15</p>
                  </div>
                  <div className="bg-[#1a1d27] border border-tejas-border rounded p-3">
                    <p className="text-tejas-muted"><strong className="text-tejas-text">Maharashtra Domicile</strong></p>
                    <p className="text-xs text-tejas-muted mt-1">Providing state priority points where applicable</p>
                  </div>
                  <div className="bg-[#1a1d27] border border-tejas-border rounded p-3">
                    <p className="text-tejas-muted"><strong className="text-tejas-text">Gender Affirmation</strong></p>
                    <p className="text-xs text-tejas-muted mt-1">Female and Other: +5 | Male: 0</p>
                  </div>
                  <div className="bg-[#1a1d27] border border-tejas-border rounded p-3">
                    <p className="text-tejas-muted"><strong className="text-tejas-text">Disability Consideration</strong></p>
                    <p className="text-xs text-tejas-muted mt-1">Yes: +10 | No: 0</p>
                  </div>
                  <div className="col-span-2 bg-[#1a1d27] border border-tejas-border rounded p-3">
                    <p className="text-tejas-muted"><strong className="text-tejas-text">Extracurricular Activity Score (0-10)</strong></p>
                    <p className="text-xs text-tejas-muted mt-1">Awards between 0 and 10 bonus points based on participation</p>
                  </div>
                </div>
                <div className="border-t border-emerald-500/20 mt-3 pt-3">
                  <p className="text-xs text-emerald-300 font-semibold">Important Policy Limit</p>
                  <p className="text-xs text-emerald-300 mt-1">To ensure academics and financial need remain the most critical factors, all diversity bonuses combined will not exceed a maximum of 20 total points.</p>
                </div>
              </div>

              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4">
                <p className="text-sm font-semibold text-indigo-300 mb-3">Group Fairness Monitoring</p>
                <p className="text-sm text-tejas-muted mb-3">Our system regularly monitors and verifies that scholarship allocations are fair across all groups:</p>
                <ul className="space-y-2 text-xs text-tejas-muted">
                  <li className="flex gap-2">
                    <span className="text-indigo-400 font-bold">-</span>
                    <span>Monitoring the percentage of eligible applicants receiving aid.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-indigo-400 font-bold">-</span>
                    <span>Ensuring equitable selection rates across gender boundaries.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-indigo-400 font-bold">-</span>
                    <span>Confirming that targeted communities receive appropriate attention and allocation proportional to representation.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 5: ALLOCATION PROCESS */}
      <div
        onClick={() => toggleSection(4)}
        className="mb-8 bg-[#1a1d27] border border-yellow-500/20 hover:bg-yellow-500/5 rounded-xl overflow-hidden cursor-pointer transition-all hover:border-yellow-500/40"
      >
        <div className="flex items-center gap-3 px-6 py-5">
          <DollarSign className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <div className="flex-1">
            <h2 className="text-base font-bold text-tejas-text">5. The Final Allocation Process</h2>
            <p className="text-xs text-tejas-muted mt-1">How final scholarships and tiers are awarded</p>
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
                <h3 className="text-sm font-bold text-green-300 mb-3">Mode 1: Fixed Budget Allocation</h3>
                <div className="space-y-2 text-sm text-tejas-muted">
                  <p className="flex gap-2">
                    <span className="text-green-400 font-mono">1.</span>
                    <span>All eligible students are sorted by their final score.</span>
                  </p>
                  <p className="flex gap-2">
                    <span className="text-green-400 font-mono">2.</span>
                    <span>Working from the highest score downwards, students receive their respective scholarship waivers (Tier 1 or Tier 2) until the allocated administrative budget is consumed.</span>
                  </p>
                  <p className="flex gap-2">
                    <span className="text-green-400 font-mono">3.</span>
                    <span>Students ranking beyond the current budget cutoff are placed on a waitlist.</span>
                  </p>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h3 className="text-sm font-bold text-blue-300 mb-3">Mode 2: Merit Ranking Allocation</h3>
                <div className="space-y-2 text-sm text-tejas-muted">
                  <p className="flex gap-2">
                    <span className="text-blue-400 font-mono">1.</span>
                    <span>In scenarios where there is no hard initial budget, students are ranked solely by percentile.</span>
                  </p>
                  <p className="flex gap-2">
                    <span className="text-blue-400 font-mono">2.</span>
                    <span>The top performing percentile bracket receives Tier 1 scholarships.</span>
                  </p>
                  <p className="flex gap-2">
                    <span className="text-blue-400 font-mono">3.</span>
                    <span>The subsequent percentile bracket receives Tier 2 aid, and remaining students are placed in the review cycle.</span>
                  </p>
                </div>
              </div>

              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                <h3 className="text-sm font-bold text-purple-300 mb-3">Scholarship Tiers Explained</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between p-2 bg-[#1a1d27] rounded border border-green-500/20">
                    <div>
                      <p className="font-semibold text-green-400">Tier 1</p>
                      <p className="text-xs text-tejas-muted">Score: 80 - 100</p>
                    </div>
                    <p className="text-sm text-green-400 text-right"><strong>Full Scholarship<br />100% Waiver</strong></p>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-[#1a1d27] rounded border border-amber-500/20">
                    <div>
                      <p className="font-semibold text-amber-400">Tier 2</p>
                      <p className="text-xs text-tejas-muted">Score: 50 - 79</p>
                    </div>
                    <p className="text-sm text-amber-400 text-right"><strong>Partial Scholarship<br />60% Aid</strong></p>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-[#1a1d27] rounded border border-blue-500/20">
                    <div>
                      <p className="font-semibold text-blue-400">Tier 3</p>
                      <p className="text-xs text-tejas-muted">Score: 0 - 49</p>
                    </div>
                    <p className="text-sm text-blue-400 text-right"><strong>Waitlist<br />Appeal Eligible</strong></p>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-[#1a1d27] rounded border border-red-500/20">
                    <div>
                      <p className="font-semibold text-red-400">Tier 4</p>
                      <p className="text-xs text-tejas-muted">Does not meet basic eligibility</p>
                    </div>
                    <p className="text-sm text-red-400 text-right"><strong>Ineligible<br />Review Needed</strong></p>
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
          <p className="text-xs text-tejas-muted">Each student decision is clearly explained through detailed, transparent impact charts and logs.</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <p className="text-xs font-semibold text-emerald-300">Fairness</p>
          </div>
          <p className="text-xs text-tejas-muted">Real-time demographic tracking protects against disparities and ensures policies provide equal access to all groups.</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-purple-400" />
            <p className="text-xs font-semibold text-purple-300">Standardization</p>
          </div>
          <p className="text-xs text-tejas-muted">Consistent rules are applied across all application groups to guarantee reliable and predictable outcomes.</p>
        </div>
      </div>
    </div>
  )
}
