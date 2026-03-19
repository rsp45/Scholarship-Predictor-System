import { useState } from 'react'
import {
  Zap,
  ChevronRight,
  AlertTriangle,
  ShieldAlert,
  User,
  Loader2,
  Trash2,
  History,
} from 'lucide-react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'
import { apiFetch } from '../lib/api'

/* ───────── Validation Helpers ───────── */
function validateNumberInput(value, min, max) {
  if (value === '' || value === null) return true
  const num = parseFloat(value)
  return !isNaN(num) && num >= min && num <= max
}

/* ───────── Reusable Input Components ───────── */
function NumberInput({ label, placeholder, prefix, min = 0, max = 100, step = 1, value, onChange }) {
  const isInvalid = !validateNumberInput(value, min, max) && value !== ''

  const handleChange = (e) => {
    const val = e.target.value
    // Allow empty string for user to clear and re-type
    if (val === '') {
      onChange?.(val)
      return
    }

    const num = parseFloat(val)
    if (isNaN(num)) return

    // Clamp value to bounds
    const clamped = Math.max(min, Math.min(max, num))
    onChange?.(String(clamped))
  }

  return (
    <div>
      <label className="block text-xs font-medium text-tejas-muted mb-1.5">
        {label}
        {!isInvalid && value !== '' && (
          <span className="ml-1 text-tejas-gold text-[10px]">✓</span>
        )}
        {isInvalid && (
          <span className="ml-1 text-red-400 text-[10px]">({min}-{max})</span>
        )}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-tejas-muted text-sm">
            {prefix}
          </span>
        )}
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          className={`w-full bg-tejas-bg border-2 rounded-lg py-2.5 text-sm text-tejas-text placeholder-tejas-muted-dark focus:outline-none transition-all ${
            isInvalid
              ? 'border-red-500/60 focus:border-red-500/80 focus:ring-1 focus:ring-red-500/30'
              : 'border-tejas-border focus:border-tejas-gold/50 focus:ring-1 focus:ring-tejas-gold/20'
          } ${prefix ? 'pl-7 pr-3' : 'px-3'}`}
        />
      </div>
    </div>
  )
}

function SelectInput({ label, options, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-tejas-muted mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full bg-tejas-bg border border-tejas-border rounded-lg py-2.5 px-3 text-sm text-tejas-text focus:outline-none focus:border-tejas-gold/50 focus:ring-1 focus:ring-tejas-gold/20 transition-all appearance-none cursor-pointer"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238b8fa3' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center',
        }}
      >
        {options.map((opt) => (
          <option
            key={typeof opt === 'string' ? opt : opt.value}
            value={typeof opt === 'string' ? opt : opt.value}
          >
            {typeof opt === 'string' ? opt : opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

/* ───────── Section Header ───────── */
function SectionHeader({ title }) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-tejas-border/50">
      <h4 className="text-xs font-semibold text-tejas-muted uppercase tracking-wider">{title}</h4>
    </div>
  )
}

/* ───────── Build Radar Data from Form Values ───────── */
function buildRadarData(form, score) {
  const academic = Math.min(100, ((parseFloat(form.tenth) || 0) + (parseFloat(form.twelfth) || 0) + (parseFloat(form.cet) || 0) + (parseFloat(form.jee) || 0) + (parseFloat(form.university) || 0)) / 5)
  const financial = Math.min(100, Math.max(0, 100 - (parseFloat(form.income) || 0) / 50000))
  const extra = (parseFloat(form.extracurricular) || 0) * 10

  return [
    { axis: 'Financial Need', applicant: Math.round(financial), average: 55 },
    { axis: 'Academic Merit', applicant: Math.round(academic), average: 65 },
    { axis: 'Social Disadv.', applicant: form.caste === 'SC' || form.caste === 'ST' ? 85 : form.caste === 'OBC' ? 65 : 40, average: 45 },
    { axis: 'Extracurricular', applicant: Math.round(extra), average: 50 },
    { axis: 'Overall', applicant: Math.round(score), average: 58 },
  ]
}

/* ───────── Tier Badge Colors ───────── */
function getTierStyle(tier) {
  if (!tier) return { bg: 'bg-gray-500/15', border: 'border-gray-500/25', text: 'text-gray-400', dot: 'bg-gray-400' }
  if (tier.includes('Tier 4')) return { bg: 'bg-red-600/20', border: 'border-red-600/40', text: 'text-red-500', dot: 'bg-red-500' }
  if (tier.includes('Tier 1')) return { bg: 'bg-green-500/15', border: 'border-green-500/25', text: 'text-green-400', dot: 'bg-green-400' }
  if (tier.includes('Tier 2')) return { bg: 'bg-amber-500/15', border: 'border-amber-500/25', text: 'text-amber-400', dot: 'bg-amber-400' }
  return { bg: 'bg-red-500/15', border: 'border-red-500/25', text: 'text-red-400', dot: 'bg-red-400' }
}

/* ═══════════════════════════════════════════════════
   DECISION CENTER PAGE
   ═══════════════════════════════════════════════════ */

export default function DecisionCenter() {
  const [overrideActive, setOverrideActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [overrideScore, setOverrideScore] = useState('')
  const [overrideReason, setOverrideReason] = useState('')

  // API response state
  const [result, setResult] = useState(null)

  // Prediction history table
  const [history, setHistory] = useState([])

  /* ── Form State (all 16 features) ── */
  const [form, setForm] = useState({
    applicantName: '',
    scholarshipTrack: 'Need Based',
    tenth: '82',
    twelfth: '78',
    cet: '85',
    jee: '72',
    university: '68',
    income: '350000',
    extracurricular: '7',
    gapYear: '0',
    tookCompetitiveExam: 'false',
    competitiveExamType: 'JEE',
    competitiveExamScore: '75',
    caste: 'OBC',
    gender: 'Male',
    parentOccupation: 'Private Sector',
    pwd: 'No',
    collegeBranch: 'Engineering',
    domicile: '1',
  })

  const updateForm = (key) => (val) => setForm((prev) => ({ ...prev, [key]: val }))

  /* ── Validation Helpers ── */
  const hasInvalidInputs = () => {
    const validationRules = {
      tenth: { min: 0, max: 100 },
      twelfth: { min: 0, max: 100 },
      cet: { min: 0, max: 100 },
      jee: { min: 0, max: 100 },
      university: { min: 0, max: 100 },
      income: { min: 0, max: 1000000000 },
      extracurricular: { min: 0, max: 10 },
      gapYear: { min: 0, max: 10 },
      competitiveExamScore: { min: 0, max: 100 },
    }

    return Object.entries(validationRules).some(([key, { min, max }]) => {
      const val = form[key]
      if (val === '' || val === null) return false
      const num = parseFloat(val)
      return isNaN(num) || num < min || num > max
    })
  }

  /* ── Call the /api/predict endpoint ── */
  async function handleAnalyze() {
    setLoading(true)
    setError(null)
    setResult(null)

    const payload = {
      applicant_name: form.applicantName.trim() || null,
      scholarship_track: form.scholarshipTrack,
      family_income: parseFloat(form.income) || 0,
      tenth_percentage: parseFloat(form.tenth) || 0,
      twelfth_percentage: parseFloat(form.twelfth) || 0,
      mh_cet_percentile: parseFloat(form.cet) || 0,
      jee_percentile: parseFloat(form.jee) || 0,
      university_test_score: parseFloat(form.university) || 0,
      extracurricular_score: parseFloat(form.extracurricular) || 0,
      gap_year: parseInt(form.gapYear) || 0,
      took_competitive_exam: form.tookCompetitiveExam === 'true',
      competitive_exam_type: form.tookCompetitiveExam === 'true' ? form.competitiveExamType : null,
      competitive_exam_score: form.tookCompetitiveExam === 'true' ? parseFloat(form.competitiveExamScore) || 0 : null,
      caste_category: form.caste,
      gender: form.gender,
      parent_occupation: form.parentOccupation,
      disability_status: form.pwd,
      college_branch: form.collegeBranch,
      domicile_maharashtra: parseInt(form.domicile),
    }

    try {
      const res = await apiFetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `Server error: ${res.status}`)
      }

      const data = await res.json()
      setResult(data)

      // Save to history
      setHistory((prev) => [
        {
          name: form.applicantName || 'Unnamed',
          score: data.final_score,
          tier: data.tier,
          overridden: data.is_overridden,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev,
      ])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  /* ── Submit with Admin Override ── */
  async function handleOverrideSubmit() {
    if (!overrideScore) return
    setLoading(true)
    setError(null)

    const payload = {
      applicant_name: form.applicantName.trim() || null,
      scholarship_track: form.scholarshipTrack,
      family_income: parseFloat(form.income) || 0,
      tenth_percentage: parseFloat(form.tenth) || 0,
      twelfth_percentage: parseFloat(form.twelfth) || 0,
      mh_cet_percentile: parseFloat(form.cet) || 0,
      jee_percentile: parseFloat(form.jee) || 0,
      university_test_score: parseFloat(form.university) || 0,
      extracurricular_score: parseFloat(form.extracurricular) || 0,
      gap_year: parseInt(form.gapYear) || 0,
      took_competitive_exam: form.tookCompetitiveExam === 'true',
      competitive_exam_type: form.tookCompetitiveExam === 'true' ? form.competitiveExamType : null,
      competitive_exam_score: form.tookCompetitiveExam === 'true' ? parseFloat(form.competitiveExamScore) || 0 : null,
      caste_category: form.caste,
      gender: form.gender,
      parent_occupation: form.parentOccupation,
      disability_status: form.pwd,
      college_branch: form.collegeBranch,
      domicile_maharashtra: parseInt(form.domicile),
      override_user: 'Dr. Admin',
      override_score: parseFloat(overrideScore),
      override_reason: overrideReason || null,
    }

    try {
      const res = await apiFetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `Server error: ${res.status}`)
      }

      const data = await res.json()
      setResult(data)

      // Save to history
      setHistory((prev) => [
        {
          name: form.applicantName || 'Unnamed',
          score: data.final_score,
          tier: data.tier,
          overridden: data.is_overridden,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev,
      ])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const tierStyle = result ? getTierStyle(result.tier) : null
  const radarData = result ? buildRadarData(form, result.final_score) : []

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      {/* ── Breadcrumb + Header ── */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-1.5 text-xs text-tejas-muted mb-3">
          <span>Admin</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-tejas-gold font-medium">Decision Center</span>
        </div>
        <h1 className="text-2xl font-bold text-tejas-text tracking-tight">
          Decision Support: Single Applicant
        </h1>
        <p className="text-sm text-tejas-muted mt-1">
          Use ML-powered analysis to evaluate scholarship priority
        </p>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 animate-fade-in">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* ── Two-Column Layout ── */}
      <div className="grid grid-cols-[45fr_55fr] gap-6">
        {/* ════════ LEFT: Input Panel ════════ */}
        <div className="bg-tejas-card border border-tejas-border rounded-xl p-6 animate-slide-in h-fit">
          <div className="flex items-center gap-2 mb-6">
            <User className="w-5 h-5 text-tejas-gold" />
            <h2 className="text-base font-semibold text-tejas-text">Applicant Profile</h2>
          </div>

          {/* Applicant Name */}
          <div className="mb-6">
            <label className="block text-xs font-medium text-tejas-muted mb-1.5">Applicant Name</label>
            <input
              type="text"
              placeholder="Enter applicant's full name"
              value={form.applicantName}
              onChange={(e) => updateForm('applicantName')(e.target.value)}
              className="w-full bg-tejas-bg border border-tejas-border rounded-lg py-2.5 px-3 text-sm text-tejas-text placeholder-tejas-muted-dark focus:outline-none focus:border-tejas-gold/50 focus:ring-1 focus:ring-tejas-gold/20 transition-all"
            />
          </div>

          {/* Scholarship Track Toggle */}
          <div className="mb-6">
            <label className="block text-xs font-medium text-tejas-muted mb-2">Scholarship Track</label>
            <div className="flex gap-2">
              {['Need Based', 'Merit Based'].map((track) => (
                <button
                  key={track}
                  onClick={() => updateForm('scholarshipTrack')(track)}
                  className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all border ${
                    form.scholarshipTrack === track
                      ? 'bg-tejas-gold/15 border-tejas-gold text-tejas-gold'
                      : 'bg-tejas-bg border-tejas-border text-tejas-muted hover:border-tejas-gold/30'
                  }`}
                >
                  {track}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-tejas-muted mt-1.5">
              {form.scholarshipTrack === 'Need Based' 
                ? 'Prioritizes financial need (70%) with academic merit as secondary.'
                : 'Prioritizes academic excellence (70%) for high-achieving students.'}
            </p>
          </div>

          {/* Academic Profile */}
          <SectionHeader title="Academic Profile" />
          <div className="grid grid-cols-2 gap-4 mb-6">
            <NumberInput 
              label="10th Percentage" 
              placeholder="0-100" 
              min={0}
              max={100}
              step={0.1}
              value={form.tenth} 
              onChange={updateForm('tenth')} 
            />
            <NumberInput 
              label="12th Percentage" 
              placeholder="0-100" 
              min={0}
              max={100}
              step={0.1}
              value={form.twelfth} 
              onChange={updateForm('twelfth')} 
            />
            <NumberInput 
              label="University Test Score" 
              placeholder="0-100" 
              min={0}
              max={100}
              step={1}
              value={form.university} 
              onChange={updateForm('university')} 
            />
          </div>

          {/* Financial Profile */}
          <SectionHeader title="Financial & Activity Profile" />
          <div className="grid grid-cols-2 gap-4 mb-6">
            <NumberInput
              label="Annual Family Income"
              placeholder="e.g. 450000"
              prefix="₹"
              min={0}
              max={1000000000}
              step={1000}
              value={form.income}
              onChange={updateForm('income')}
            />
            <NumberInput
              label="Extracurricular Score"
              placeholder="0-10"
              min={0}
              max={10}
              step={1}
              value={form.extracurricular}
              onChange={updateForm('extracurricular')}
            />
          </div>

          {/* Competitive Exams */}
          <SectionHeader title="Competitive Exams" />
          <div className="grid grid-cols-2 gap-4 mb-6">
            <NumberInput 
              label="MH-CET Percentile" 
              placeholder="0-100" 
              min={0}
              max={100}
              step={0.01}
              value={form.cet} 
              onChange={updateForm('cet')} 
            />
            <NumberInput 
              label="JEE Mains Percentile" 
              placeholder="0-100" 
              min={0}
              max={100}
              step={0.01}
              value={form.jee} 
              onChange={updateForm('jee')} 
            />
          </div>

          {/* Demographics */}
          <SectionHeader title="Demographics" />
          <div className="grid grid-cols-2 gap-4 mb-6">
            <SelectInput
              label="Caste Category"
              options={['General', 'OBC', 'SC', 'ST']}
              value={form.caste}
              onChange={updateForm('caste')}
            />
            <SelectInput
              label="Gender"
              options={['Male', 'Female', 'Other']}
              value={form.gender}
              onChange={updateForm('gender')}
            />
            <SelectInput
              label="Parent Occupation"
              options={['Private Sector', 'Government', 'APL', 'BPL']}
              value={form.parentOccupation}
              onChange={updateForm('parentOccupation')}
            />
            <SelectInput
              label="College Branch"
              options={['Engineering', 'Arts', 'Commerce', 'Science', 'Medical']}
              value={form.collegeBranch}
              onChange={updateForm('collegeBranch')}
            />
            <SelectInput
              label="PwD Status"
              options={['No', 'Yes']}
              value={form.pwd}
              onChange={updateForm('pwd')}
            />
            <SelectInput
              label="Domicile Maharashtra"
              options={[
                { value: '1', label: 'Yes' },
                { value: '0', label: 'No' },
              ]}
              value={form.domicile}
              onChange={updateForm('domicile')}
            />
            <NumberInput
              label="Gap Year(s)"
              placeholder="0-5"
              min={0}
              max={10}
              step={1}
              value={form.gapYear}
              onChange={updateForm('gapYear')}
            />
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={loading || hasInvalidInputs()}
            title={hasInvalidInputs() ? 'Please fix invalid inputs (shown in red) before analyzing' : ''}
            className="w-full py-3.5 bg-gold-gradient text-tejas-sidebar font-bold text-sm rounded-lg flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-tejas-gold/25 transition-all duration-300 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Analyze Applicant
              </>
            )}
          </button>
        </div>

        {/* ════════ RIGHT: Output Panel ════════ */}
        <div className="space-y-5">
          {/* Score & Tier */}
          {result && (
            <div className="bg-tejas-card border border-tejas-border rounded-xl p-6 animate-fade-in">
              <h3 className="text-xs font-semibold text-tejas-muted uppercase tracking-wider mb-1">
                Tejas ML Prediction
              </h3>
              {result.scholarship_track && (
                <p className="text-xs text-tejas-gold mb-4">
                  <span className="text-tejas-muted">Track:</span> {result.scholarship_track}
                  {result.weights_used && (
                    <span className="text-tejas-muted-dark ml-2">
                      (M:{result.weights_used.merit} I:{result.weights_used.income} P:{result.weights_used.policy})
                    </span>
                  )}
                </p>
              )}

              <div className="text-center py-4">
                {/* Large Score */}
                <div className="inline-flex items-baseline gap-1">
                  <span className="text-7xl font-extrabold text-tejas-gold tracking-tighter">
                    {Math.round(result.final_score)}
                  </span>
                  <span className="text-2xl font-medium text-tejas-muted-dark">/100</span>
                </div>

                {/* Tier Badge */}
                <div className="mt-4 mb-3">
                  <span className={`inline-flex items-center gap-2 px-5 py-2 ${tierStyle.bg} border ${tierStyle.border} ${tierStyle.text} rounded-full text-sm font-semibold`}>
                    <span className={`w-2.5 h-2.5 rounded-full ${tierStyle.dot} animate-pulse`} />
                    {result.tier}
                  </span>
                </div>

                {/* ML Score (show if overridden) */}
                {result.is_overridden && (
                  <p className="text-xs text-tejas-muted mt-2">
                    Original ML Score: <span className="text-tejas-gold font-semibold">{result.ml_score}</span>
                  </p>
                )}

                <p className="text-xs text-tejas-muted mt-1">
                  {result.message}
                </p>
              </div>

              {/* Score Breakdown (XAI) */}
              {result.breakdown && (
                <div className="mt-6 pt-6 border-t border-tejas-border">
                  <h4 className="text-xs font-semibold text-tejas-muted uppercase tracking-wider mb-4 text-center">
                    Score Breakdown
                  </h4>
                  
                  {/* Stacked Progress Bar */}
                  <div className="h-4 w-full rounded-full overflow-hidden flex mb-4">
                    <div 
                      className="bg-blue-500/80 h-full"
                      style={{ width: `${(result.breakdown.merit_contribution / result.final_score) * 100}%` }}
                    />
                    <div 
                      className="bg-green-500/80 h-full"
                      style={{ width: `${(result.breakdown.income_contribution / result.final_score) * 100}%` }}
                    />
                    <div 
                      className="bg-purple-500/80 h-full"
                      style={{ width: `${(result.breakdown.policy_contribution / result.final_score) * 100}%` }}
                    />
                  </div>

                  {/* Component Cards */}
                  <div className="grid grid-cols-3 gap-3">
                    {/* Merit */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <span className="text-sm">📚</span>
                        <span className="text-[10px] font-medium text-blue-400 uppercase">Merit</span>
                      </div>
                      <p className="text-lg font-bold text-blue-400">{result.breakdown.merit_contribution}</p>
                      <p className="text-[10px] text-tejas-muted-dark">pts</p>
                    </div>

                    {/* Financial Need */}
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <span className="text-sm">💰</span>
                        <span className="text-[10px] font-medium text-green-400 uppercase">Need</span>
                      </div>
                      <p className="text-lg font-bold text-green-400">{result.breakdown.income_contribution}</p>
                      <p className="text-[10px] text-tejas-muted-dark">pts</p>
                    </div>

                    {/* Policy Bonuses */}
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <span className="text-sm">⚖️</span>
                        <span className="text-[10px] font-medium text-purple-400 uppercase">Policy</span>
                      </div>
                      <p className="text-lg font-bold text-purple-400">{result.breakdown.policy_contribution}</p>
                      <p className="text-[10px] text-tejas-muted-dark">pts</p>
                    </div>
                  </div>

                  <p className="text-[10px] text-tejas-muted text-center mt-3">
                    Sum: {result.breakdown.merit_contribution} + {result.breakdown.income_contribution} + {result.breakdown.policy_contribution} = {result.final_score}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Radar Chart */}
          {result && (
            <div className="bg-tejas-card border border-tejas-border rounded-xl p-6 animate-fade-in">
              <h3 className="text-xs font-semibold text-tejas-muted uppercase tracking-wider mb-2">
                Comparative Analysis
              </h3>
              <p className="text-xs text-tejas-muted mb-4">Applicant vs University Average</p>

              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData} outerRadius="75%">
                  <PolarGrid stroke="#2a2d37" />
                  <PolarAngleAxis
                    dataKey="axis"
                    tick={{ fill: '#8b8fa3', fontSize: 11 }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fill: '#5a5d6a', fontSize: 10 }}
                    axisLine={false}
                  />
                  <Radar
                    name="This Applicant"
                    dataKey="applicant"
                    stroke="#d4a843"
                    fill="#d4a843"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <Radar
                    name="University Average"
                    dataKey="average"
                    stroke="#5a5d6a"
                    fill="#5a5d6a"
                    fillOpacity={0.1}
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '12px', color: '#8b8fa3', paddingTop: '12px' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1d27',
                      border: '1px solid #2a2d37',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    itemStyle={{ color: '#f0f0f0' }}
                  />
                </RadarChart>
              </ResponsiveContainer>

              <p className="text-xs text-tejas-muted italic mt-2 px-2">
                <span className="text-tejas-gold">*</span> Radar axes are derived from form
                inputs. Overall score is from the ML prediction.
              </p>
            </div>
          )}

          {/* Admin Override */}
          {result && (
            <div className="bg-tejas-card border border-amber-500/20 rounded-xl p-6 animate-fade-in">
              <div className="flex items-center gap-2 mb-5">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-semibold text-tejas-text">Administrative Override</h3>
              </div>

              {/* Toggle */}
              <div className="flex items-center justify-between mb-5">
                <span className="text-sm text-tejas-muted">Override Tejas Recommendation?</span>
                <button
                  onClick={() => setOverrideActive(!overrideActive)}
                  className={`toggle-switch ${overrideActive ? 'active' : ''}`}
                  role="switch"
                  aria-checked={overrideActive}
                />
              </div>

              {/* Override Fields (shown when active) */}
              {overrideActive && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-xs font-medium text-tejas-muted mb-1.5">
                      Override Reason
                    </label>
                    <textarea
                      rows={3}
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="Explain rationale for overriding ML decision..."
                      className="w-full bg-tejas-bg border border-tejas-border rounded-lg py-2.5 px-3 text-sm text-tejas-text placeholder-tejas-muted-dark focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all resize-none"
                    />
                  </div>

                  <NumberInput
                    label="Manual Score (0-100)"
                    placeholder="Enter manual priority score"
                    min={0}
                    max={100}
                    value={overrideScore}
                    onChange={setOverrideScore}
                  />

                  <button
                    onClick={handleOverrideSubmit}
                    disabled={loading || !overrideScore}
                    className="w-full py-3 bg-amber-gradient text-tejas-sidebar font-bold text-sm rounded-lg flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-amber-500/25 transition-all duration-300 active:scale-[0.98] mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ShieldAlert className="w-4 h-4" />
                    )}
                    Submit Final Decision
                  </button>

                  <p className="text-[11px] text-tejas-muted-dark flex items-start gap-1.5 mt-2">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-500/60" />
                    <span>
                      <strong className="text-tejas-muted">Important:</strong> Manual decisions are permanently
                      recorded in the audit log for compliance. All overrides must follow the
                      Scholarship Review Policy v2.4.
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!result && !loading && (
            <div className="bg-tejas-card border border-dashed border-tejas-border rounded-xl p-12 flex flex-col items-center justify-center text-center animate-fade-in">
              <Zap className="w-10 h-10 text-tejas-muted-dark mb-4" />
              <h3 className="text-sm font-semibold text-tejas-muted mb-1">No Analysis Yet</h3>
              <p className="text-xs text-tejas-muted-dark max-w-[240px]">
                Fill in the applicant profile and click "Analyze Applicant" to get ML-powered predictions.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ════════ PREDICTION HISTORY TABLE ════════ */}
      {history.length > 0 && (
        <div className="mt-8 bg-tejas-card border border-tejas-border rounded-xl p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-tejas-gold" />
              <h3 className="text-sm font-semibold text-tejas-text">Prediction History</h3>
              <span className="text-xs text-tejas-muted">({history.length} records)</span>
            </div>
            <button
              onClick={() => setHistory([])}
              className="flex items-center gap-1.5 text-xs text-tejas-muted hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-tejas-border">
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-tejas-muted uppercase tracking-wider">#</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-tejas-muted uppercase tracking-wider">Applicant</th>
                  <th className="text-center py-2.5 px-3 text-xs font-semibold text-tejas-muted uppercase tracking-wider">Score</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-tejas-muted uppercase tracking-wider">Tier</th>
                  <th className="text-center py-2.5 px-3 text-xs font-semibold text-tejas-muted uppercase tracking-wider">Override</th>
                  <th className="text-right py-2.5 px-3 text-xs font-semibold text-tejas-muted uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => {
                  const ts = getTierStyle(h.tier)
                  return (
                    <tr key={i} className="border-b border-tejas-border/40 hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 px-3 text-tejas-muted-dark text-xs">{i + 1}</td>
                      <td className="py-2.5 px-3 text-tejas-text font-medium">{h.name}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="text-tejas-gold font-bold">{Math.round(h.score)}</span>
                        <span className="text-tejas-muted-dark">/100</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${ts.bg} ${ts.border} ${ts.text} border`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${ts.dot}`} />
                          {h.tier.replace(' [OVERRIDE]', '')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {h.overridden ? (
                          <span className="text-xs text-amber-400 font-semibold">Yes</span>
                        ) : (
                          <span className="text-xs text-tejas-muted-dark">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right text-xs text-tejas-muted">{h.time}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
