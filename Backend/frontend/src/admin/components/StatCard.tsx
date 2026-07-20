import React from 'react'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  gradient: string
  change?: string
  changeUp?: boolean
  delay?: number
}

export default function StatCard({ title, value, icon: Icon, gradient, change, changeUp, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="admin-card rounded-2xl p-5 relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-default"
    >
      {/* Subtle glow */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity rounded-2xl ${gradient}`} />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">{title}</p>
          <p className="text-3xl font-extrabold text-white">{typeof value === 'number' ? value.toLocaleString() : value}</p>
          {change && (
            <p className={`text-xs mt-1 font-medium ${changeUp ? 'text-emerald-400' : 'text-rose-400'}`}>
              {changeUp ? '↑' : '↓'} {change}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${gradient} shadow-lg flex-shrink-0`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>

      {/* Bottom accent line */}
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${gradient} opacity-40`} />
    </motion.div>
  )
}
