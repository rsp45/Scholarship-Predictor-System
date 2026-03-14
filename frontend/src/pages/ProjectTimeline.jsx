import { ChevronRight, CheckCircle2, Clock, RefreshCw } from 'lucide-react'

/* ───────── Timeline Data ───────── */
const phases = [
  {
    num: 1, phase: 'Phase 1', title: 'Project Initiation & Base Setup',
    dates: 'Feb 2 – Feb 13, 2026', icon: '🚀',
    desc: 'Requirement analysis, defining the applicant schema, and building the initial synthetic data generator.',
    status: 'done',
  },
  {
    num: 2, phase: '🔄 Retraining', title: 'Base Model Training',
    dates: 'Feb 15, 2026', icon: '🔄',
    desc: 'Train the initial Base ML Model on static synthetic data.',
    isRetrain: true, status: 'done',
  },
  {
    num: 3, phase: 'Phase 2', title: 'Database Architecture & UI Setup',
    dates: 'Feb 16 – Feb 24, 2026', icon: '🗄️',
    desc: 'Initialize SQLite database and construct the Streamlit interface for viewing records.',
    status: 'done',
  },
  {
    num: 4, phase: '🔄 Retraining', title: 'Manual Retraining',
    dates: 'Feb 22, 2026', icon: '🔄',
    desc: 'Model fine-tuning and initial integration tests with Streamlit.',
    isRetrain: true, status: 'done',
  },
  {
    num: 5, phase: 'Phase 3', title: 'Data Seeding & Schema Mapping',
    dates: 'Feb 25 – Feb 28, 2026', icon: '🌱',
    desc: 'Update generator.py to seed the SQLite database directly with 2,000 synthetic applicant records.',
    status: 'done',
  },
  {
    num: 6, phase: '⚙️ Retraining', title: 'First Automated Pipeline Test',
    dates: 'Mar 1, 2026', icon: '⚙️',
    desc: 'Train model on newly seeded database records.',
    isRetrain: true, status: 'done',
  },
  {
    num: 7, phase: 'Phase 4', title: 'Pipeline Automation',
    dates: 'Mar 2 – Mar 7, 2026', icon: '🔧',
    desc: 'Script the data_pipeline.py extraction process. Automate preprocessing and model retraining.',
    status: 'done',
  },
  {
    num: 8, phase: '⚙️ Retraining', title: 'Weekly Automated Retraining',
    dates: 'Mar 8, 2026', icon: '⚙️',
    desc: 'Weekly Model Retraining triggered via automated scheduler.',
    isRetrain: true, status: 'done',
  },
  {
    num: 9, phase: 'Phase 5', title: 'Dashboard Migration to React',
    dates: 'Mar 9 – Mar 14, 2026', icon: '📊',
    desc: 'Migrate Streamlit dashboard to enterprise React app with FastAPI backend. Build Decision Center and Admin Overview.',
    status: 'current',
  },
  {
    num: 10, phase: '⚙️ Retraining', title: 'Retraining on Expanded Data',
    dates: 'Mar 15, 2026', icon: '⚙️',
    desc: 'Weekly Model Retraining on dataset expanded by manual UI entries.',
    isRetrain: true, status: 'upcoming',
  },
  {
    num: 11, phase: 'Phase 6', title: 'Optimization & Testing',
    dates: 'Mar 16 – Mar 21, 2026', icon: '🧪',
    desc: 'End-to-end testing of the ingestion-to-prediction loop. Optimize SQL queries and final UI/UX fixes.',
    status: 'upcoming',
  },
  {
    num: 12, phase: '⚙️ Final Retraining', title: 'Pre-Submission Model Retraining',
    dates: 'Mar 22, 2026', icon: '⚙️',
    desc: 'Final Pre-Submission Model Retraining for maximum accuracy.',
    isRetrain: true, status: 'upcoming',
  },
  {
    num: 13, phase: 'Phase 7', title: 'Submission',
    dates: 'Mar 23 – Mar 25, 2026', icon: '🏁',
    desc: 'Compile the final project report, detail the pipeline architecture, and prepare for the Viva.',
    status: 'upcoming',
  },
]

const techStack = [
  { name: 'Python 3.12', desc: 'Core language', icon: '🐍' },
  { name: 'React + Vite', desc: 'Frontend dashboard', icon: '⚛️' },
  { name: 'FastAPI', desc: 'API server', icon: '⚡' },
  { name: 'Scikit-Learn', desc: 'ML model training', icon: '🧠' },
  { name: 'SQLite', desc: 'Persistent storage', icon: '💾' },
  { name: 'SHAP', desc: 'Explainability', icon: '📊' },
]

/* ═══════════════════════════════════════════════════
   PROJECT TIMELINE PAGE
   ═══════════════════════════════════════════════════ */

export default function ProjectTimeline() {
  return (
    <div className="p-8 max-w-[1000px] mx-auto">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-1.5 text-xs text-tejas-muted mb-3">
          <span>Admin</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-tejas-gold font-medium">Project Timeline</span>
        </div>
        <h1 className="text-2xl font-bold text-tejas-text tracking-tight">
          Project Timeline & Retraining Schedule
        </h1>
        <p className="text-sm text-tejas-muted mt-1">
          7-phase development plan with weekly model retraining milestones.
        </p>
      </div>

      {/* Timeline */}
      <div className="relative pl-8 mb-12">
        {/* Vertical Line */}
        <div className="absolute left-[14px] top-0 bottom-0 w-px bg-gradient-to-b from-tejas-gold/40 via-tejas-border to-tejas-border" />

        <div className="space-y-4">
          {phases.map((p) => {
            const isDone = p.status === 'done'
            const isCurrent = p.status === 'current'
            const isRetrain = p.isRetrain

            return (
              <div
                key={p.num}
                className={`relative animate-fade-in ${
                  isCurrent ? 'gold-glow' : ''
                }`}
              >
                {/* Dot on timeline */}
                <div
                  className={`absolute -left-8 top-5 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold z-10 ${
                    isDone
                      ? 'bg-green-500/20 border border-green-500/40'
                      : isCurrent
                      ? 'bg-tejas-gold/20 border-2 border-tejas-gold animate-pulse-gold'
                      : 'bg-tejas-border border border-tejas-muted-dark'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                  ) : isCurrent ? (
                    <RefreshCw className="w-3.5 h-3.5 text-tejas-gold" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-tejas-muted-dark" />
                  )}
                </div>

                {/* Card */}
                <div
                  className={`ml-4 rounded-xl p-4 border transition-all ${
                    isRetrain
                      ? 'bg-amber-500/[0.04] border-amber-500/15'
                      : isCurrent
                      ? 'bg-tejas-gold/[0.06] border-tejas-gold/25'
                      : isDone
                      ? 'bg-tejas-card border-tejas-border opacity-80'
                      : 'bg-tejas-card border-tejas-border opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{p.icon}</span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isRetrain
                          ? 'bg-amber-500/15 text-amber-400'
                          : isCurrent
                          ? 'bg-tejas-gold/15 text-tejas-gold'
                          : isDone
                          ? 'bg-green-500/15 text-green-400'
                          : 'bg-tejas-border text-tejas-muted'
                      }`}
                    >
                      {p.phase}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-tejas-gold/15 text-tejas-gold animate-pulse">
                        IN PROGRESS
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-tejas-text">{p.title}</h4>
                  <p className="text-xs text-tejas-gold font-medium mt-0.5">{p.dates}</p>
                  <p className="text-xs text-tejas-muted mt-1">{p.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tech Stack */}
      <h3 className="text-sm font-semibold text-tejas-text mb-4">🛠️ Technology Stack</h3>
      <div className="grid grid-cols-3 gap-3 stagger-children">
        {techStack.map((t) => (
          <div key={t.name} className="bg-tejas-card border border-tejas-border rounded-lg p-4 text-center card-hover">
            <span className="text-2xl">{t.icon}</span>
            <p className="text-sm font-semibold text-tejas-text mt-2">{t.name}</p>
            <p className="text-xs text-tejas-muted">{t.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
