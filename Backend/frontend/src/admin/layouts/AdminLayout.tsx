import React, { useState } from 'react'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'

interface AdminLayoutProps {
  children: React.ReactNode
  title: string
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen" style={{ background: '#0b0d1a', color: '#e2e8f0' }}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar title={title} />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
