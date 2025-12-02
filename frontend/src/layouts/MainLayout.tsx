/**
 * Main Layout - For Shop pages
 * Scandinavian/Minimal Design
 */
import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ChatWidget from '@/components/ChatWidget'

export default function MainLayout() {
  const location = useLocation()
  const [authModalState, setAuthModalState] = useState<{ isOpen: boolean; tab: 'login' | 'register' }>({
    isOpen: false,
    tab: 'login'
  })

  useEffect(() => {
    // Check if navigation state wants to open auth modal
    const state = location.state as any
    if (state?.openAuthModal) {
      setAuthModalState({
        isOpen: true,
        tab: state.authTab || 'login'
      })
      // Clear the state to prevent reopening on refresh
      window.history.replaceState({}, document.title)
    }
  }, [location])

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        externalAuthModalState={authModalState}
        onAuthModalClose={() => setAuthModalState({ ...authModalState, isOpen: false })}
      />
      
      <main className="flex-1">
        <Outlet />
      </main>
      
      <Footer />
      
      {/* Floating Chat Widget */}
      <ChatWidget />
    </div>
  )
}
