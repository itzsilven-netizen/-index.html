import { useState, useEffect } from 'react'
import { useAuthStore, useLeadsStore } from './store'
import Auth from './components/Auth'
import CRM from './components/CRM'
import LeadGen from './components/LeadGen'
import Nurture from './components/Nurture'
import Pipeline from './components/Pipeline'
import './App.css'

export default function App() {
  const { user, login, logout } = useAuthStore()
  const { initializeSync } = useLeadsStore()
  const [activeTab, setActiveTab] = useState('crm')

  useEffect(() => {
    if (user) {
      initializeSync(user.id)
    }
  }, [user])

  if (!user) {
    return <Auth onLogin={login} />
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Lead CRM</h1>
        <button onClick={logout} className="logout-btn">Logout</button>
      </header>

      <nav className="tabs">
        <button
          className={`tab ${activeTab === 'crm' ? 'active' : ''}`}
          onClick={() => setActiveTab('crm')}
        >
          CRM
        </button>
        <button
          className={`tab ${activeTab === 'leadgen' ? 'active' : ''}`}
          onClick={() => setActiveTab('leadgen')}
        >
          Lead Gen
        </button>
        <button
          className={`tab ${activeTab === 'nurture' ? 'active' : ''}`}
          onClick={() => setActiveTab('nurture')}
        >
          Nurture
        </button>
        <button
          className={`tab ${activeTab === 'pipeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('pipeline')}
        >
          Pipeline
        </button>
      </nav>

      <main className="app-content">
        {activeTab === 'crm' && <CRM />}
        {activeTab === 'leadgen' && <LeadGen />}
        {activeTab === 'nurture' && <Nurture />}
        {activeTab === 'pipeline' && <Pipeline />}
      </main>
    </div>
  )
}
