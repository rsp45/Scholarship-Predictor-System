import { useNavigate } from 'react-router-dom'
import ParticleField from '../components/ParticleField'
import {
  Zap,
  ArrowRight,
  BrainCircuit,
  Scale,
  BarChart3,
  ShieldCheck,
  Users,
  Target,
  Gavel,
  Banknote,
  Play,
  ChevronRight,
  Sparkles,
  Github,
  Mail,
} from 'lucide-react'

/* ───────── Feature Cards Data ───────── */
const features = [
  {
    icon: BrainCircuit,
    title: 'ML-Powered Scoring',
    description:
      'Random Forest + XGBoost ensemble models predict priority scores with SHAP explainability for every decision.',
    color: 'from-yellow-500/20 to-amber-500/10',
    borderColor: 'border-yellow-500/20',
  },
  {
    icon: Scale,
    title: 'Fair Allocation Engine',
    description:
      '40% Need + 40% Merit + 20% Policy weighted formula ensures equitable and transparent distribution.',
    color: 'from-emerald-500/20 to-green-500/10',
    borderColor: 'border-emerald-500/20',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Analytics',
    description:
      'Interactive dashboards with demographic breakdowns, tier distributions, and live budget tracking.',
    color: 'from-blue-500/20 to-cyan-500/10',
    borderColor: 'border-blue-500/20',
  },
  {
    icon: ShieldCheck,
    title: 'Audit & Compliance',
    description:
      'Every decision is logged. Admin overrides require justification and are permanently recorded for review.',
    color: 'from-purple-500/20 to-pink-500/10',
    borderColor: 'border-purple-500/20',
  },
]

/* ───────── Process Steps ───────── */
const steps = [
  {
    num: '01',
    icon: Users,
    title: 'Data Collection',
    description: 'Student applications with academic, financial, and demographic data',
  },
  {
    num: '02',
    icon: Target,
    title: 'ML Processing',
    description: 'Ensemble model predicts priority score (0-100) per applicant',
  },
  {
    num: '03',
    icon: Gavel,
    title: 'Admin Review',
    description: 'Decision Center for expert override & SHAP analysis',
  },
  {
    num: '04',
    icon: Banknote,
    title: 'Fund Allocation',
    description: 'Automated tier assignment: Full, Partial, or No Aid',
  },
]

/* ───────── Stats ───────── */
const stats = [
  { value: '2,000+', label: 'Applications Processed' },
  { value: '94%', label: 'Model Accuracy' },
  { value: '₹50L', label: 'Budget Managed' },
]

/* ═══════════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════════ */

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#080a10] text-white overflow-x-hidden">
      {/* ────────────── NAVBAR ────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[#080a10]/70 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gold-gradient flex items-center justify-center">
              <Zap className="w-4 h-4 text-[#080a10]" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold text-tejas-gold tracking-tight">Tejas</span>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {['Home', 'Features', 'How It Works'].map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase().replace(/ /g, '-')}`}
                className="text-sm text-tejas-muted hover:text-white transition-colors duration-200"
              >
                {link}
              </a>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={() => navigate('/admin-overview')}
            className="flex items-center gap-2 px-5 py-2 bg-gold-gradient text-[#080a10] font-semibold text-sm rounded-full hover:shadow-lg hover:shadow-tejas-gold/25 transition-all duration-300 active:scale-[0.97]"
          >
            Launch Dashboard
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* ────────────── HERO SECTION ────────────── */}
      <section id="home" className="relative min-h-screen flex items-center justify-center pt-16">
        {/* Particle Simulation Background */}
        <div className="absolute inset-0 overflow-hidden">
          <ParticleField />
          {/* Gold aurora glow accents */}
          <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-tejas-gold/[0.06] blur-[120px]" />
          <div className="absolute bottom-[20%] right-[15%] w-[300px] h-[300px] rounded-full bg-amber-500/[0.04] blur-[80px]" />
          {/* Bottom fade to blend into features section */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#080a10] to-transparent" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center px-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-tejas-gold/10 border border-tejas-gold/20 mb-8 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-tejas-gold" />
            <span className="text-xs font-medium text-tejas-gold">ML-Powered Scholarship Platform</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.08] tracking-tight mb-6 animate-fade-in">
            Intelligent Scholarship
            <br />
            Allocation.{' '}
            <span className="bg-gradient-to-r from-tejas-gold to-tejas-amber bg-clip-text text-transparent">
              Powered by ML.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-tejas-muted max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in">
            Tejas uses advanced ensemble models to fairly predict scholarship priority scores,
            ensuring transparent and equitable fund distribution across 2,000+ applicants.
          </p>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-4 mb-12 animate-fade-in">
            <button
              onClick={() => navigate('/admin-overview')}
              className="flex items-center gap-2 px-7 py-3.5 bg-gold-gradient text-[#080a10] font-bold text-sm rounded-full hover:shadow-xl hover:shadow-tejas-gold/30 transition-all duration-300 active:scale-[0.97]"
            >
              Launch Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
            <button className="flex items-center gap-2 px-7 py-3.5 border border-tejas-muted-dark text-tejas-muted font-semibold text-sm rounded-full hover:border-tejas-gold/40 hover:text-white transition-all duration-300">
              <Play className="w-4 h-4" />
              View Demo
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 md:gap-12 animate-fade-in">
            {stats.map((s, i) => (
              <div key={s.label} className="flex items-center gap-3">
                {i > 0 && <div className="w-px h-8 bg-tejas-border hidden md:block" />}
                <div className={i > 0 ? 'pl-3 md:pl-0' : ''}>
                  <p className="text-2xl font-bold text-tejas-gold">{s.value}</p>
                  <p className="text-xs text-tejas-muted">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-[10px] text-tejas-muted-dark uppercase tracking-widest">Scroll</span>
          <div className="w-5 h-8 rounded-full border border-tejas-muted-dark flex items-start justify-center p-1">
            <div className="w-1 h-2 rounded-full bg-tejas-gold animate-pulse" />
          </div>
        </div>
      </section>

      {/* ────────────── FEATURES SECTION ────────────── */}
      <section id="features" className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#080a10] via-[#0c0e16] to-[#080a10]" />
        <div className="relative z-10 max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-tejas-gold uppercase tracking-[0.2em] mb-3">
              Capabilities
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Enterprise-Grade Features
            </h2>
            <p className="text-tejas-muted max-w-lg mx-auto text-sm">
              Built for university scholarship committees who demand transparency,
              accuracy, and compliance.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid md:grid-cols-2 gap-5">
            {features.map((f) => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className={`group relative bg-gradient-to-br ${f.color} backdrop-blur-sm border ${f.borderColor} rounded-2xl p-7 card-hover`}
                >
                  <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-6 h-6 text-tejas-gold" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-tejas-muted leading-relaxed">{f.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ────────────── HOW IT WORKS ────────────── */}
      <section id="how-it-works" className="py-24 px-6 bg-[#0d0f17]">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-tejas-gold uppercase tracking-[0.2em] mb-3">
              Process
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              How Tejas Works
            </h2>
            <p className="text-tejas-muted max-w-lg mx-auto text-sm">
              From application intake to fund disbursement — a fully automated,
              ML-driven pipeline.
            </p>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-4 gap-6 relative">
            {/* Connecting Line (desktop only) */}
            <div className="hidden md:block absolute top-16 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-tejas-gold/30 to-transparent" />

            {steps.map((step) => {
              const Icon = step.icon
              return (
                <div key={step.num} className="relative text-center group">
                  {/* Number Circle */}
                  <div className="relative mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-tejas-gold/20 to-tejas-gold/5 border border-tejas-gold/30 flex items-center justify-center mb-6 group-hover:shadow-lg group-hover:shadow-tejas-gold/20 transition-all duration-300">
                    <Icon className="w-6 h-6 text-tejas-gold" />
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gold-gradient flex items-center justify-center text-[10px] font-bold text-[#080a10]">
                      {step.num}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-2">{step.title}</h4>
                  <p className="text-xs text-tejas-muted leading-relaxed">{step.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ────────────── CTA SECTION ────────────── */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-tejas-gold/[0.05] blur-[100px]" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Ready to Transform Your Scholarship Process?
          </h2>
          <p className="text-tejas-muted mb-8 text-sm">
            Join universities leveraging ML-powered allocation for fair, transparent,
            and efficient scholarship distribution.
          </p>
          <button
            onClick={() => navigate('/admin-overview')}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gold-gradient text-[#080a10] font-bold text-sm rounded-full hover:shadow-xl hover:shadow-tejas-gold/30 transition-all duration-300 active:scale-[0.97]"
          >
            Launch Dashboard
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ────────────── FOOTER ────────────── */}
      <footer className="border-t border-white/[0.06] py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-gold-gradient flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-[#080a10]" strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-sm font-bold text-tejas-gold">Tejas</span>
              <p className="text-[10px] text-tejas-muted-dark">Built for university scholarship committees</p>
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            {['Features', 'Process', 'Dashboard', 'Documentation'].map((link) => (
              <a
                key={link}
                href="#"
                className="text-xs text-tejas-muted hover:text-white transition-colors"
              >
                {link}
              </a>
            ))}
          </div>

          {/* Right */}
          <div className="flex items-center gap-4">
            <a href="#" className="text-tejas-muted-dark hover:text-tejas-gold transition-colors">
              <Github className="w-4 h-4" />
            </a>
            <a href="#" className="text-tejas-muted-dark hover:text-tejas-gold transition-colors">
              <Mail className="w-4 h-4" />
            </a>
            <span className="text-[11px] text-tejas-muted-dark">© 2026 Tejas. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
