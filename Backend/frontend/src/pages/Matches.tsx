import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import MainLayout from '../layouts/main/MainLayout'
import { motion } from 'framer-motion'
import { matchApi, MatchResult } from '../services/api'

export default function Matches() {
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    matchApi.getMatches()
      .then(data => setMatches(data))
      .catch(err => setError(err.message || 'Failed to load matches'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold mb-6">Your Skill Matches</h1>

          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="glass-card rounded-2xl p-6 animate-pulse h-28" />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="glass-card p-8 rounded-2xl text-center text-red-500">{error}</div>
          )}

          {!loading && !error && matches.length === 0 && (
            <div className="glass-card p-10 rounded-2xl text-center text-slate-400">
              <p className="text-4xl mb-3">🤝</p>
              <p className="font-medium">No matches yet!</p>
              <p className="text-sm mt-1">
                Add skills in{' '}
                <Link to="/settings" className="text-indigo-600 hover:underline">Settings</Link>{' '}
                to start getting matched with other students.
              </p>
            </div>
          )}

          <div className="space-y-4">
            {matches.map((m, i) => (
              <motion.div
                key={m.user.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 * i }}
                className="glass-card p-6 rounded-2xl hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                    {m.user.name?.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{m.user.name}</h3>
                      <span className="text-xs text-slate-500">{m.user.department}</span>
                    </div>
                    {/* Removed short bio */}
                  </div>

                  {/* Match score */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-2xl font-bold text-indigo-600">{m.matchPercentage}%</div>
                    <div className="text-xs text-slate-400">match</div>
                  </div>
                </div>

                {/* Score bar */}
                <div className="mt-4 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                    style={{ width: `${m.matchPercentage}%` }}
                  />
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {m.details.theyOfferMe.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-400 mb-1">They can teach you:</p>
                      <div className="flex gap-1 flex-wrap">
                        {m.details.theyOfferMe.map(s => (
                          <span key={s} className="skill-tag-offered text-xs">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {m.details.iOfferThem.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-400 mb-1">You can teach them:</p>
                      <div className="flex gap-1 flex-wrap">
                        {m.details.iOfferThem.map(s => (
                          <span key={s} className="skill-tag-needed text-xs">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <Link
                    to={`/profile/${m.user.id}`}
                    className="btn-primary text-sm"
                  >
                    View Profile
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </MainLayout>
  )
}
