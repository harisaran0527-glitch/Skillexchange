import React from 'react'
import Navbar from '../../components/ui/Navbar'

type Props = { children: React.ReactNode }

export default function MainLayout({ children }: Props) {
  return (
    <div className="app-container min-h-screen flex flex-col bg-[linear-gradient(180deg,#f8fafc,rgba(255,255,255,0))] dark:bg-gradient-to-b dark:from-slate-900 dark:to-gray-900">
      <header className="px-4">
        <Navbar />
      </header>
      <main className="flex-1 px-4 py-6 container mx-auto max-w-6xl">{children}</main>
      <footer className="py-8 text-center text-sm text-slate-500">© {new Date().getFullYear()} SkillSwap</footer>
    </div>
  )
}
