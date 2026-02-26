'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import AdminSidebar from '../../components/AdminSidebar'
import MobileSidebar from './MobileSidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
}

const navigationItems = [
  { name: 'BECE', href: '/exam-portal' },
  { name: 'Schools', href: '/admin/schools' },
  { name: 'WAEC', href: '/admin/waec' },
  { name: 'BECE', href: '/admin/bece' },
  { name: 'BECE RESIT', href: '/admin/bece-resit' },
  { name: 'JSCBE', href: '/admin/jscbe' },
  { name: 'COMMON ENTRANCE', href: '/admin/common-entrance' },
  { name: 'UBEAT', href: '/admin/ubeat' },
  { name: 'UBEGPT', href: '/admin/ubegpt' },
  { name: 'UBETMS', href: '/admin/ubetms' },
]

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
    setUserMenuOpen(false)
    router.push('/admin')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar */}
      <MobileSidebar 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)}
        navigationItems={navigationItems}
      />

      {/* Top Navigation - Fixed */}
      <nav className="fixed top-0 left-0 right-0 admin-nav bg-white shadow-sm border-b border-gray-200 z-50">
        <div className="px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-3">
              <Image src="/images/IMSG-Logo.svg" alt="MOPSE Logo" width={32} height={32} className="object-contain" />
              <div>
                <span className="font-semibold text-lg text-gray-900">MOPSE Admin</span>
                <p className='text-[8px] text-gray-600'>Ministry of Primary and Secondary Education</p>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="block md:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Desktop User Menu */}
              <div className="relative hidden md:block">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-3 text-sm focus:outline-none"
                >
                  <div className="w-8 h-8 bg-green-700 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">AD</span>
                  </div>
                  <span className="text-gray-700 font-medium">Admin</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <div className="border-t border-gray-100"></div>
                    <button 
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar - Desktop only */}
      <div className="hidden md:block">
        <AdminSidebar />
      </div>

      {/* Main Content - with proper spacing for fixed header and sidebar */}
      <main className="pt-16 md:ml-64">
        {children}
      </main>
    </div>
  )
}