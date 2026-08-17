import { useState, useEffect } from 'react'
import { useAuthStore, useLeadsStore } from './store'
import Auth from './components/Auth'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Dashboard from './components/Dashboard'
import LeadsPage from './components/LeadsPage'
import PipelinePage from './components/PipelinePage'
import TasksPage from './components/TasksPage'
import ComingSoon from './components/ComingSoon'
import LeadDrawer from './components/LeadDrawer'
import AddLeadForm from './components/AddLeadForm'
import './App.css'

export default function App() {
  const { user, login, logout } = useAuthStore()
  const { initializeSync, callLeads, emailLeads } = useLeadsStore()
  const [activePage, setActivePage] = useState('dashboard')
  const [drawerLead, setDrawerLead] = useState(null)
  const [showQuickAdd, setShowQuickAdd] = useState(false)

  useEffect(() => {
    if (user) {
      initializeSync(user.id)
    }
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
      />

      <div className="app-main">
        <TopBar onOpenLead={openLead} onQuickAdd={() => setShowQuickAdd(true)} />

        <main className="app-content">
          {activePage === 'dashboard' && <Dashboard onNavigate={setActivePage} onOpenLead={openLead} />}
          {activePage === 'leads' && <LeadsPage onOpenLead={openLead} />}
          {activePage === 'pipeline' && <PipelinePage onOpenLead={openLead} />}
          {activePage === 'tasks' && <TasksPage onOpenLead={openLead} />}
          {['calendar', 'automations', 'inbox', 'reports', 'settings'].includes(activePage) && (
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
    </div>
  )
}
