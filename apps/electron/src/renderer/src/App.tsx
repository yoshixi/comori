import React, { useEffect, useState } from 'react'
import { Home, CalendarDays, MessageSquare, ListTodo, StickyNote, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { NotesView } from './components/NotesView'
import { TodoView } from './components/TodoView'
import { PostsView } from './components/PostsView'
import { TodayView } from './components/TodayView'
import { CalendarView } from './components/CalendarView'
import { AccountView } from './components/AccountView'

type View = 'today' | 'calendar' | 'posts' | 'todo' | 'notes' | 'account'

const tabs: { id: View; label: string; icon: LucideIcon }[] = [
  { id: 'today', label: 'Today', icon: Home },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'posts', label: 'Posts', icon: MessageSquare },
  { id: 'todo', label: 'ToDo', icon: ListTodo },
  { id: 'notes', label: 'Notes', icon: StickyNote },
  { id: 'account', label: 'Account', icon: User }
]

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function App(): React.JSX.Element {
  const [currentView, setCurrentView] = useState<View>('today')
  const [todayStr, setTodayStr] = useState(() => formatDate(new Date()))
  useEffect(() => {
    const tick = (): void => setTodayStr(formatDate(new Date()))
    tick()
    const id = setInterval(tick, 60_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Topbar */}
      <header
        className="flex items-center justify-between px-5 shrink-0"
        style={{
          height: 44,
          background: 'var(--panel)',
          borderBottom: '0.5px solid var(--border-l)'
        }}
      >
        <span className="font-title text-lg tracking-wide" style={{ color: 'var(--text-dark)' }}>
          Techo
        </span>
        <span
          className="text-xs px-3 py-1 rounded-full"
          style={{ background: 'var(--amber-light)', color: 'var(--amber-dark)', fontSize: 11 }}
        >
          {todayStr}
        </span>
      </header>

      {/* Tab row */}
      <nav
        className="flex items-end px-5 gap-1 shrink-0"
        style={{
          height: 36,
          background: 'var(--panel)',
          borderBottom: '0.5px solid var(--border-l)'
        }}
      >
        {tabs.map((tab) => {
          const isActive = currentView === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentView(tab.id)}
              className="flex items-center gap-1.5 px-3 pb-2 text-xs transition-colors"
              style={{
                fontWeight: isActive ? 500 : 400,
                color: isActive ? 'var(--text-dark)' : 'var(--text-muted-custom)',
                borderBottom: isActive ? '2px solid var(--amber)' : '2px solid transparent'
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          )
        })}
      </nav>

      {/* Screen content */}
      <main className="flex flex-col flex-1 min-h-0">
        {currentView === 'today' && <TodayView />}
        {currentView === 'calendar' && <CalendarView />}
        {currentView === 'posts' && <PostsView />}
        {currentView === 'todo' && <TodoView />}
        {currentView === 'notes' && <NotesView />}
        {currentView === 'account' && <AccountView />}
      </main>
    </div>
  )
}

export default App
