import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar
} from 'recharts'
import { ChartData } from '../services/adminApi'

const COLORS = ['#6366f1','#06b6d4','#10b981','#f59e0b','#f43f5e','#a855f7','#ec4899','#14b8a6']
const CHART_STYLE = { background: 'transparent' }
const AXIS_STYLE = { fill: '#94a3b8', fontSize: 11 }
const GRID_STYLE = { stroke: 'rgba(255,255,255,0.05)' }

const customTooltip = {
  contentStyle: { background: '#1e2035', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e2e8f0', fontSize: 12 },
  itemStyle: { color: '#e2e8f0' },
  labelStyle: { color: '#94a3b8' }
}

// Chart wrapper card
function ChartCard({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`admin-card rounded-2xl p-5 ${className}`}>
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-5">{title}</h3>
      {children}
    </div>
  )
}

// 1. Registration Trend Line Chart
export function RegistrationChart({ data }: { data: ChartData['registrationsByMonth'] }) {
  return (
    <ChartCard title="Student Registrations (Last 6 Months)">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} style={CHART_STYLE}>
          <CartesianGrid strokeDasharray="3 3" {...GRID_STYLE} />
          <XAxis dataKey="month" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip {...customTooltip} />
          <Line
            type="monotone" dataKey="count" name="Registrations"
            stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', strokeWidth: 0, r: 4 }}
            activeDot={{ r: 6, fill: '#818cf8' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// 2. Department Distribution Pie
const RADIAN = Math.PI / 180
const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.06) return null
  const r = innerRadius + (outerRadius - innerRadius) * 0.5
  return (
    <text x={cx + r * Math.cos(-midAngle * RADIAN)} y={cy + r * Math.sin(-midAngle * RADIAN)}
      fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function DepartmentChart({ data }: { data: ChartData['departmentDistribution'] }) {
  return (
    <ChartCard title="Department Distribution">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%"
            outerRadius={80} labelLine={false} label={renderLabel}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip {...customTooltip} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingTop: 8 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// 3. Popular Skills Bar Chart
export function PopularSkillsChart({ data }: { data: ChartData['popularSkills'] }) {
  return (
    <ChartCard title="Top 8 Most Popular Skills">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" style={CHART_STYLE} margin={{ left: 40 }}>
          <CartesianGrid strokeDasharray="3 3" {...GRID_STYLE} horizontal={false} />
          <XAxis type="number" tick={AXIS_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="skill" tick={AXIS_STYLE} axisLine={false} tickLine={false} width={80} />
          <Tooltip {...customTooltip} />
          <Bar dataKey="count" name="Usage" radius={[0, 6, 6, 0]}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// 4. Skills Distribution Donut
export function SkillsDistributionChart({ data }: { data: ChartData['skillsDistribution'] }) {
  return (
    <ChartCard title="Skills Distribution">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%"
            innerRadius={55} outerRadius={80} labelLine={false} label={renderLabel}>
            <Cell fill="#6366f1" />
            <Cell fill="#06b6d4" />
          </Pie>
          <Tooltip {...customTooltip} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingTop: 8 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// 5. Request Status Bar Chart
export function RequestStatusChart({ data }: { data: ChartData['requestStatus'] }) {
  const statusColors: Record<string, string> = { Pending: '#f59e0b', Approved: '#10b981', Rejected: '#f43f5e' }
  return (
    <ChartCard title="Learning Request Status">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} style={CHART_STYLE}>
          <CartesianGrid strokeDasharray="3 3" {...GRID_STYLE} />
          <XAxis dataKey="status" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip {...customTooltip} />
          <Bar dataKey="count" name="Requests" radius={[6, 6, 0, 0]}>
            {data.map((entry, i) => <Cell key={i} fill={statusColors[entry.status] || COLORS[i]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// 6. Active vs Inactive Donut
export function ActiveStudentsChart({ data }: { data: ChartData['activeVsInactive'] }) {
  return (
    <ChartCard title="Active vs Suspended Students">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%"
            innerRadius={55} outerRadius={80} labelLine={false} label={renderLabel}>
            <Cell fill="#10b981" />
            <Cell fill="#f43f5e" />
          </Pie>
          <Tooltip {...customTooltip} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingTop: 8 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
