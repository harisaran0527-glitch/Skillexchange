import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import MainLayout from '../layouts/main/MainLayout'
import { motion } from 'framer-motion'
import { usersApi, AuthUser } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const { id } = useParams()
  const { user: me } = useAuth()
  const [profile, setProfile] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const isOwnProfile = !id || id === (me as any)?._id || id === me?.id

  useEffect(() => {
    setLoading(true)
    const fetchUser = isOwnProfile
      ? usersApi.getProfile()
      : usersApi.getUserById(id!)

    fetchUser
      .then(data => setProfile(data))
      .catch(err => setError(err.message || 'Failed to load profile'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <div className="glass-card p-8 rounded-2xl animate-pulse">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-700" />
                <div className="space-y-3 mt-4 sm:mt-0 w-full">
                  <div className="h-6 bg-slate-800 rounded w-48" />
                  <div className="h-4 bg-slate-800 rounded w-64" />
                </div>
              </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error || !profile) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">😕</p>
          <p>{error || 'Profile not found.'}</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header card */}
          <div className="glass-card p-8 rounded-2xl shadow-xl mb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {profile.profileImage ? (
                <img src={profile.profileImage} alt={profile.name} className="w-24 h-24 rounded-2xl object-cover border-2 border-indigo-500/20 shadow-lg flex-shrink-0" />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-white text-4xl font-bold flex-shrink-0 shadow-lg">
                  {profile.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="text-center sm:text-left mt-2 sm:mt-0">
                <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
                <p className="text-slate-400 mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-sm">
                  {profile.department && <span className="bg-slate-800 px-2 py-1 rounded-md">{profile.department}</span>}
                  {profile.section && <span className="bg-slate-800 px-2 py-1 rounded-md">Sec {profile.section}</span>}
                  {profile.year && <span className="bg-slate-800 px-2 py-1 rounded-md">{profile.year}</span>}
                  {profile.college && <span className="bg-slate-800 px-2 py-1 rounded-md">{profile.college}</span>}
                </p>
                <p className="text-sm text-slate-500 mt-3 flex items-center justify-center sm:justify-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  {profile.email}
                </p>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 rounded-2xl">
              <h3 className="font-semibold text-sm text-slate-500 uppercase tracking-wide mb-3">Skills Offered</h3>
              {profile.skillsOffered && profile.skillsOffered.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.skillsOffered.map(s => (
                    <span key={s} className="skill-tag-offered">{s}</span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No skills listed yet.</p>
              )}
            </div>

            <div className="glass-card p-6 rounded-2xl">
              <h3 className="font-semibold text-sm text-slate-500 uppercase tracking-wide mb-3">Completed Courses</h3>
              {profile.completedCourses && profile.completedCourses.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.completedCourses.map(c => (
                    <span key={c} className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium rounded-lg border border-emerald-500/20">{c}</span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No courses completed yet.</p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  )
}
