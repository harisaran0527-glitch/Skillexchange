import React from 'react'
import Navbar from '../../components/ui/Navbar'

type Props = { children: React.ReactNode }

export default function MainLayout({ children }: Props) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100 relative overflow-x-hidden selection:bg-blue-500 selection:text-white">
      {/* Ambient Radial Background Glows */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed bottom-10 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none z-0" />

      <header className="px-4 py-3 sticky top-0 z-50 backdrop-blur-xl bg-[#0b0f19]/75 border-b border-white/5">
        <Navbar />
      </header>

      <main className="flex-1 px-4 py-8 container mx-auto max-w-6xl relative z-10">
        {children}
      </main>

      <footer className="py-8 text-center text-xs text-slate-500 border-t border-white/5 relative z-10">
        © {new Date().getFullYear()} SkillExchange Student Portal • Premium Learning Environment
      </footer>
    </div>
  )
}
