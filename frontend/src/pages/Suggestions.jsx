import { useState } from 'react'
import {
  Lightbulb,
  ChevronRight,
  Send,
  Star,
  MessageSquare,
  CheckCircle2,
  Trash2,
} from 'lucide-react'

/* ═══════════════════════════════════════════════════
   SUGGESTIONS PAGE
   ═══════════════════════════════════════════════════ */

export default function Suggestions() {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('General')
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [feedbacks, setFeedbacks] = useState([])

  function handleSubmit(e) {
    e.preventDefault()
    if (!message.trim()) return

    const entry = {
      id: Date.now(),
      name: name.trim() || 'Anonymous',
      category,
      rating,
      message: message.trim(),
      time: new Date().toLocaleString([], {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }),
    }

    setFeedbacks((prev) => [entry, ...prev])
    setSubmitted(true)

    // Reset form after a brief delay
    setTimeout(() => {
      setName('')
      setCategory('General')
      setRating(0)
      setMessage('')
      setSubmitted(false)
    }, 2000)
  }

  return (
    <div className="p-8 max-w-[1000px] mx-auto">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-1.5 text-xs text-tejas-muted mb-3">
          <span>Admin</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-tejas-gold font-medium">Suggestions</span>
        </div>
        <h1 className="text-2xl font-bold text-tejas-text tracking-tight">
          Feedback & Suggestions
        </h1>
        <p className="text-sm text-tejas-muted mt-1">
          Help us improve Tejas! Share your feedback, report issues, or suggest new features.
        </p>
      </div>

      <div className="grid grid-cols-[1fr_1fr] gap-6">
        {/* ── Left: Feedback Form ── */}
        <form
          onSubmit={handleSubmit}
          className="bg-tejas-card border border-tejas-border rounded-xl p-6 h-fit animate-slide-in"
        >
          <div className="flex items-center gap-2 mb-6">
            <MessageSquare className="w-5 h-5 text-tejas-gold" />
            <h2 className="text-base font-semibold text-tejas-text">Submit Feedback</h2>
          </div>

          {/* Name */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-tejas-muted mb-1.5">
              Your Name <span className="text-tejas-muted-dark">(optional)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full bg-tejas-bg border border-tejas-border rounded-lg py-2.5 px-3 text-sm text-tejas-text placeholder-tejas-muted-dark focus:outline-none focus:border-tejas-gold/50 focus:ring-1 focus:ring-tejas-gold/20 transition-all"
            />
          </div>

          {/* Category */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-tejas-muted mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-tejas-bg border border-tejas-border rounded-lg py-2.5 px-3 text-sm text-tejas-text focus:outline-none focus:border-tejas-gold/50 focus:ring-1 focus:ring-tejas-gold/20 transition-all appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238b8fa3' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
              }}
            >
              {['General', 'Bug Report', 'Feature Request', 'UI/UX', 'ML Model', 'Documentation'].map(
                (opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                )
              )}
            </select>
          </div>

          {/* Star Rating */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-tejas-muted mb-2">
              Rate Your Experience
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-0.5 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-6 h-6 transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'text-tejas-gold fill-tejas-gold'
                        : 'text-tejas-muted-dark'
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="text-xs text-tejas-muted ml-2">
                  {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
                </span>
              )}
            </div>
          </div>

          {/* Message */}
          <div className="mb-5">
            <label className="block text-xs font-medium text-tejas-muted mb-1.5">
              Your Feedback <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share your thoughts, report a bug, or suggest a feature..."
              required
              className="w-full bg-tejas-bg border border-tejas-border rounded-lg py-2.5 px-3 text-sm text-tejas-text placeholder-tejas-muted-dark focus:outline-none focus:border-tejas-gold/50 focus:ring-1 focus:ring-tejas-gold/20 transition-all resize-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!message.trim() || submitted}
            className={`w-full py-3 font-bold text-sm rounded-lg flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] ${
              submitted
                ? 'bg-green-500/20 text-green-400 border border-green-500/20'
                : 'bg-gold-gradient text-tejas-sidebar hover:shadow-lg hover:shadow-tejas-gold/25'
            } disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {submitted ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Thank You!
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Submit Feedback
              </>
            )}
          </button>
        </form>

        {/* ── Right: Feedback List ── */}
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-tejas-gold" />
              <h3 className="text-sm font-semibold text-tejas-text">
                Recent Feedback{feedbacks.length > 0 && ` (${feedbacks.length})`}
              </h3>
            </div>
            {feedbacks.length > 0 && (
              <button
                onClick={() => setFeedbacks([])}
                className="flex items-center gap-1.5 text-xs text-tejas-muted hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>

          {feedbacks.length === 0 ? (
            <div className="bg-tejas-card border border-dashed border-tejas-border rounded-xl p-10 flex flex-col items-center justify-center text-center">
              <MessageSquare className="w-8 h-8 text-tejas-muted-dark mb-3" />
              <p className="text-sm text-tejas-muted mb-1">No feedback yet</p>
              <p className="text-xs text-tejas-muted-dark">
                Submitted feedback will appear here.
              </p>
            </div>
          ) : (
            feedbacks.map((fb) => {
              const catColors = {
                General: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                'Bug Report': 'bg-red-500/10 text-red-400 border-red-500/20',
                'Feature Request': 'bg-green-500/10 text-green-400 border-green-500/20',
                'UI/UX': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                'ML Model': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                Documentation: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
              }

              return (
                <div
                  key={fb.id}
                  className="bg-tejas-card border border-tejas-border rounded-xl p-4 animate-fade-in"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-tejas-gold/15 flex items-center justify-center text-[11px] font-bold text-tejas-gold">
                        {fb.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-tejas-text">{fb.name}</p>
                        <p className="text-[10px] text-tejas-muted-dark">{fb.time}</p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        catColors[fb.category] || catColors.General
                      }`}
                    >
                      {fb.category}
                    </span>
                  </div>

                  {fb.rating > 0 && (
                    <div className="flex items-center gap-0.5 mb-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= fb.rating ? 'text-tejas-gold fill-tejas-gold' : 'text-tejas-muted-dark'
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  <p className="text-sm text-tejas-muted leading-relaxed">{fb.message}</p>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
