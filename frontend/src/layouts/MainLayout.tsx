/**
 * Main Layout - For Shop pages
 * Scandinavian/Minimal Design
 */
import { Outlet } from 'react-router-dom'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ChatWidget from '@/components/ChatWidget'

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <Outlet />
      </main>
      
      <Footer />
      
      {/* Floating Chat Widget */}
      <ChatWidget />
    </div>
  )
}
