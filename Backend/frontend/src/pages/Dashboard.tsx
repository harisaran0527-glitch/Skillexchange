import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import MainLayout from '../layouts/main/MainLayout'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { usersApi, matchApi, AuthUser, MatchResult } from '../services/api'

export default function Dashboard() {
  const { user } = useAuth()
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [loadingMatches, setLoadingMatches] = useState(true)

  useEffect(() => {
    matchApi.getMatches()
      .then(data => setMatches(data.slice(0, 6)))
      .catch(() => setMatches([]))
      .finally(() => setLoadingMatches(false))
  }, [])

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Welcome header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 rounded-2xl"
        >
          <h1 className="text-2xl font-bold">
            Welcome back, <span className="text-indigo-600">{user?.name || 'Student'}</span> 👋
          </h1>
          <p className="text-slate-500 mt-1">
            {user?.department && `${user.department}`}
            {user?.section && ` - ${user.section}`}
            {user?.year && ` • ${user.year}`}
            {user?.college && ` • ${user.college}`}
            {!user?.department && !user?.college && 'SkillSwap Platform'}
          </p>
          <div className="mt-4 flex gap-3">
            <Link to="/discovery" className="btn-primary text-sm">Discover Students</Link>
            <Link to="/settings" className="btn-secondary text-sm">Edit Profile</Link>
          </div>
        </motion.div>

        {/* Skills summary */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="glass-card p-5 rounded-2xl">
              <h3 className="font-semibold text-sm text-slate-500 uppercase tracking-wide mb-3">Skills I Offer</h3>
              {user.skillsOffered && user.skillsOffered.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.skillsOffered.map(s => (
                    <span key={s} className="skill-tag-offered">{s}</span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  No skills added yet.{' '}
                  <Link to="/settings" className="text-indigo-600 hover:underline">Add skills →</Link>
                </p>
              )}
            </div>
            <div className="glass-card p-5 rounded-2xl">
              <h3 className="font-semibold text-sm text-slate-500 uppercase tracking-wide mb-3">Completed Courses</h3>
              {user.completedCourses && user.completedCourses.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.completedCourses.map(c => (
                    <span key={c} className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium rounded-lg border border-emerald-500/20">{c}</span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  No courses completed yet.{' '}
                  <Link to="/settings" className="text-indigo-600 hover:underline">Add courses →</Link>
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Recommended matches */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Recommended Matches</h2>
            <Link to="/matches" className="text-sm text-indigo-600 hover:underline">See all →</Link>
          </div>

          {loadingMatches ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="glass-card p-5 rounded-2xl animate-pulse h-32" />
              ))}
            </div>
          ) : matches.length === 0 ? (
            <div className="glass-card p-8 rounded-2xl text-center text-slate-500">
              <p>No matches yet. Add your skills in <Link to="/settings" className="text-indigo-600 hover:underline">Settings</Link> to find matches!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {matches.map((m, i) => (
                <motion.div
                  key={m.user.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="glass-card p-5 rounded-2xl hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                      {m.user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{m.user.name}</div>
                      <div className="text-xs text-slate-500">{m.user.department}</div>
                    </div>
                    <div className="ml-auto">
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                        {m.matchPercentage}%
                      </span>
                    </div>
                  </div>
                  {m.commonSkills && m.commonSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {m.commonSkills.slice(0, 3).map(s => (
                        <span key={s} className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full">{s}</span>
                      ))}
                    </div>
                  )}
                  <Link
                    to={`/profile/${m.user.id}`}
                    className="mt-3 block text-center text-xs btn-secondary"
                  >
                    View Profile
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </MainLayout>
  )
}
