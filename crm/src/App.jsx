import { useState, useEffect } from 'react'
import { useAuthStore, useLeadsStore } from './store'
import Auth from './components/Auth'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Dashboard from './components/Dashboard'
import LeadsPage from './components/LeadsPage'
import PipelinePage from './components/PipelinePage'
import TasksPage from './components/TasksPage'
import CalendarPage, { CreateEventModal } from './components/CalendarPage'
import CallDayPage from './components/CallDayPage'
import VisualPage from './components/VisualPage'
import StackPage from './components/StackPage'
import OffersPage from './components/OffersPage'
import ComingSoon from './components/ComingSoon'
import LeadDrawer from './components/LeadDrawer'
import AddLeadForm from './components/AddLeadForm'
import './App.css'

export default function App() {
  const { user, login, logout } = useAuthStore()
  const { initializeSync, callLeads, emailLeads, pendingSchedule, clearPendingSchedule } = useLeadsStore()
  const [activePage, setActivePage] = useState('dashboard')
  const [drawerLead, setDrawerLead] = useState(null)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (user) {
      initializeSync(user.id)
    }
  }, [user])

  // Polls the backend every 2 minutes so replies coming in via the Instantly
  // webhook (which writes repliedAt server-side, not through this browser)
  // show up in the Replied panel without a manual page reload.
  useEffect(() => {
    if (!user) return
    const id = setInterval(() => {
      useLeadsStore.getState().syncFromServer().catch(() => {})
    }, 120000)
    return () => clearInterval(id)
  }, [user])

  if (!user) {
    return <Auth onLogin={login} />
  }

  const openLead = (lead) => setDrawerLead(lead)

  // Always render the live version of the drawer lead from the store,
  // so status/notes changes made inside the drawer show immediately.
  const liveDrawerLead = drawerLead
    ? (drawerLead._type === 'calls' ? callLeads : emailLeads).find(l => l.id === drawerLead.id) || drawerLead
    : null

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        user={user}
        onLogout={logout}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="app-main">
        <TopBar
          onOpenLead={openLead}
          onQuickAdd={() => setShowQuickAdd(true)}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="app-content">
          {activePage === 'dashboard' && <Dashboard onNavigate={setActivePage} onOpenLead={openLead} />}
          {activePage === 'leads' && <LeadsPage onOpenLead={openLead} />}
          {activePage === 'pipeline' && <PipelinePage onOpenLead={openLead} />}
          {activePage === 'tasks' && <TasksPage onOpenLead={openLead} />}
          {activePage === 'calendar' && <CalendarPage onOpenLead={openLead} />}
          {activePage === 'callday' && <CallDayPage />}
          {activePage === 'visual' && <VisualPage />}
          {activePage === 'stack' && <StackPage />}
          {activePage === 'offers' && <OffersPage />}
          {['automations', 'inbox', 'reports', 'settings'].includes(activePage) && (
            <ComingSoon pageId={activePage} />
          )}
        </main>
      </div>

      {drawerLead && (
        <LeadDrawer
          lead={liveDrawerLead}
          type={drawerLead._type}
          onClose={() => setDrawerLead(null)}
        />
      )}

      {showQuickAdd && (
        <AddLeadForm type="calls" onClose={() => setShowQuickAdd(false)} />
      )}

      {pendingSchedule && (
        <CreateEventModal
          leads={[{ ...pendingSchedule.lead, _type: pendingSchedule.leadType }]}
          prefill={{ type: 'meeting', leadId: pendingSchedule.lead.id }}
          onClose={clearPendingSchedule}
        />
      )}
    </div>
  )
}
