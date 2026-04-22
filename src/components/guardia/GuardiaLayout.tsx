import type { ReactNode } from 'react'
import BottomNav from './BottomNav'

interface GuardiaLayoutProps {
  children: ReactNode
  guardiaName: string
  onSignOut: () => void
  activeTab: string
  onTabChange: (tab: string) => void
  alertCount?: number
}

export default function GuardiaLayout({
  children,
  guardiaName,
  onSignOut,
  activeTab,
  onTabChange,
  alertCount,
}: GuardiaLayoutProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F4F7F5',
        fontFamily: "'Inter', sans-serif",
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <header
        style={{
          backgroundColor: '#0D1B2A',
          padding: '0 16px',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: 20,
              fontWeight: 800,
              color: '#FFFFFF',
              letterSpacing: 0.5,
            }}
          >
            DOM<span style={{ color: '#1A7A4A' }}>IA</span>
          </span>
          <span
            style={{
              width: 1,
              height: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
            }}
          />
          <span
            style={{
              fontSize: 14,
              color: 'rgba(255, 255, 255, 0.85)',
              fontWeight: 500,
            }}
          >
            {guardiaName}
          </span>
        </div>

        <button
          onClick={onSignOut}
          style={{
            background: 'none',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 8,
            padding: '6px 12px',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: "'Inter', sans-serif",
            minHeight: 36,
          }}
        >
          Salir
        </button>
      </header>

      {/* Scrollable content */}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 16px 80px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {children}
      </main>

      {/* Bottom navigation */}
      <BottomNav activeTab={activeTab} onTabChange={onTabChange} alertCount={alertCount} />
    </div>
  )
}
