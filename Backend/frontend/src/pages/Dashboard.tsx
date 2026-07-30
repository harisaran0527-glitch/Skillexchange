import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import MainLayout from '../layouts/main/MainLayout'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { usersApi } from '../services/api'
import { GraduationCap, BookOpen, Users, Award } from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    usersApi.getPublicStats().then(setStats).catch(() => {})
  }, [])

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Welcome header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/60 p-8 rounded-3xl border border-blue-500/20 shadow-2xl backdrop-blur-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-extrabold text-white">
                Welcome back, <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">{user?.name || 'Student'}</span>
              </h1>
              <p className="text-slate-400 text-sm mt-2 flex flex-wrap items-center gap-2">
                {user?.department && <span className="px-2.5 py-1 bg-slate-800/80 rounded-lg text-slate-300 font-medium">{user.department}</span>}
                {user?.section && <span className="px-2.5 py-1 bg-slate-800/80 rounded-lg text-slate-300 font-medium">Section {user.section}</span>}
                {user?.year && <span className="px-2.5 py-1 bg-slate-800/80 rounded-lg text-slate-300 font-medium">Year {user.year}</span>}
                {user?.college && <span className="px-2.5 py-1 bg-slate-800/80 rounded-lg text-slate-300 font-medium">{user.college}</span>}
                {!user?.department && !user?.college && 'SkillExchange Student Portal'}
              </p>
            </div>
            <div className="flex gap-3">
              <Link to="/best-students" className="px-5 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2 active:scale-98">
                <Award size={18} /> Best Students
              </Link>
              <Link to="/settings" className="px-5 py-3 bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-bold rounded-2xl text-sm transition-all border border-white/10 hover:border-blue-500/30">
                View Profile
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Global Statistics — ONLY Total Students & Total Skills */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className="bg-slate-900/60 p-7 rounded-3xl flex items-center gap-5 border border-blue-500/20 shadow-xl backdrop-blur-xl hover:border-blue-500/40 transition-all group">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-2xl group-hover:scale-105 transition-transform">
                <Users size={30} />
              </div>
              <div>
                <div className="text-4xl font-black text-white">{stats.totalStudents || 0}</div>
                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Total Registered Students</div>
              </div>
            </div>

            <div className="bg-slate-900/60 p-7 rounded-3xl flex items-center gap-5 border border-purple-500/20 shadow-xl backdrop-blur-xl hover:border-purple-500/40 transition-all group">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-2xl group-hover:scale-105 transition-transform">
                <BookOpen size={30} />
              </div>
              <div>
                <div className="text-4xl font-black text-white">{stats.totalSkills || 0}</div>
                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Master Courses & Skills</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Completed Courses Summary */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900/60 p-8 rounded-3xl border border-white/10 shadow-xl backdrop-blur-xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-white flex items-center gap-2.5">
                <GraduationCap size={22} className="text-blue-400" />
                <span>My Enrolled & Completed Courses</span>
              </h3>
              <Link to="/search" className="text-xs text-blue-400 hover:text-blue-300 hover:underline font-bold transition-colors">
                Explore All Courses & Resources →
              </Link>
            </div>

            {user.completedCourses && user.completedCourses.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {user.completedCourses.map(c => (
                  <span key={c} className="px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-300 text-sm font-semibold rounded-2xl border border-blue-500/20 shadow-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    {c}
                  </span>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-slate-950/40 border border-slate-800 text-center">
                <p className="text-sm text-slate-400">
                  No courses selected yet.{' '}
                  <Link to="/settings" className="text-blue-400 font-bold hover:underline">Select Courses in Profile Settings →</Link>
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </MainLayout>
  )
}
