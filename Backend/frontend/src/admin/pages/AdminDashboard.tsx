import React, { useEffect, useState } from 'react'
import AdminLayout from '../layouts/AdminLayout'
import StatCard from '../components/StatCard'
import {
  RegistrationChart, DepartmentChart, PopularSkillsChart,
  SkillsDistributionChart, RequestStatusChart, ActiveStudentsChart
} from '../components/Charts'
import { Users, UserCheck, UserX, BookOpen, MessageSquare, Clock, CheckCircle, XCircle, Building2, Activity } from 'lucide-react'
import { adminStatsApi, AdminStats, ChartData, Student, adminStudentsApi } from '../services/adminApi'
import { motion } from 'framer-motion'

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [charts, setCharts] = useState<ChartData | null>(null)
  const [recentStudents, setRecentStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      adminStatsApi.getStats(),
      adminStatsApi.getChartData(),
      adminStudentsApi.getAll({ page: 1, limit: 5 })
    ]).then(([s, c, st]) => {
      setStats(s)
      setCharts(c)
      setRecentStudents(st.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
          {[1,2,3,4,5,6,7,8,9,10].map(i => <div key={i} className="h-28 rounded-2xl admin-skeleton" />)}
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Dashboard">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        {/* Top Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
          <StatCard title="Total Students" value={stats?.totalStudents || 0} icon={Users} gradient="bg-gradient-to-br from-indigo-500 to-indigo-600" delay={0.05} />
          <StatCard title="Active Students" value={stats?.activeStudents || 0} icon={UserCheck} gradient="bg-gradient-to-br from-emerald-500 to-emerald-600" delay={0.1} />
          <StatCard title="Inactive Students" value={stats?.inactiveStudents || 0} icon={UserX} gradient="bg-gradient-to-br from-rose-500 to-rose-600" delay={0.15} />
          <StatCard title="Total Skills" value={stats?.totalSkills || 0} icon={BookOpen} gradient="bg-gradient-to-br from-cyan-500 to-cyan-600" delay={0.2} />
          <StatCard title="Departments" value={stats?.totalDepartments || 0} icon={Building2} gradient="bg-gradient-to-br from-purple-500 to-purple-600" delay={0.25} />
          
          <StatCard title="Total Requests" value={stats?.totalRequests || 0} icon={MessageSquare} gradient="bg-gradient-to-br from-amber-500 to-amber-600" delay={0.3} />
          <StatCard title="Pending Requests" value={stats?.pendingRequests || 0} icon={Clock} gradient="bg-gradient-to-br from-orange-400 to-orange-500" delay={0.35} />
          <StatCard title="Approved Requests" value={stats?.approvedRequests || 0} icon={CheckCircle} gradient="bg-gradient-to-br from-teal-500 to-teal-600" delay={0.4} />
          <StatCard title="Rejected Requests" value={stats?.rejectedRequests || 0} icon={XCircle} gradient="bg-gradient-to-br from-red-500 to-red-600" delay={0.45} />
          <StatCard title="Total Activity" value={stats?.totalMessages || 0} icon={Activity} gradient="bg-gradient-to-br from-blue-500 to-blue-600" delay={0.5} />
        </div>

        {/* Charts Grid */}
        {charts && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2"><RegistrationChart data={charts.registrationsByMonth} /></div>
            <div><DepartmentChart data={charts.departmentDistribution} /></div>
            <div className="lg:col-span-2"><PopularSkillsChart data={charts.popularSkills} /></div>
            <div><SkillsDistributionChart data={charts.skillsDistribution} /></div>
            <div className="lg:col-span-2"><RequestStatusChart data={charts.requestStatus} /></div>
            <div><ActiveStudentsChart data={charts.activeVsInactive} /></div>
          </div>
        )}

        {/* Recent Students Table */}
        <div className="admin-card rounded-2xl p-5 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Recent Registrations</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-white/5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 px-2">Student</th>
                  <th className="pb-3 px-2">Department</th>
                  <th className="pb-3 px-2">Status</th>
                  <th className="pb-3 px-2 text-right">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentStudents.map(student => (
                  <tr key={student._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-200">{student.name}</p>
                          <p className="text-xs text-slate-500">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-slate-400">{student.department || '—'}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        student.isSuspended ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {student.isSuspended ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right text-slate-500 text-xs">
                      {new Date(student.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </AdminLayout>
  )
}
