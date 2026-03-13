'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { 
  FaGraduationCap, 
  FaMoneyBillWave,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa'

interface NavItem {
  id: string
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description?: string
}

const navigationItems: NavItem[] = [
 
  { 
    id: '1',
    name: 'EXAMS', 
    href: '/systemadmin/exams', 
    icon: FaGraduationCap,
    description: 'Set exam registration dates, fees'
  },
    { 
    id: '2',
    name: 'AEE MANAGEMENT', 
    href: '/systemadmin/aee', 
    icon: FaGraduationCap,
    description: 'Manage AEE accounts'
  },
    {
    id: '3',
    name: 'WALLET',
    href: '/systemadmin/wallet',
    icon: FaMoneyBillWave,
    description: 'View registration transactions'
  },
  
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Map exam types to their corresponding routes
  const examTypeToRoute: Record<string, string> = {
    'EXAMS': '/systemadmin/exams',
  }

  return (
    <aside 
      className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-linear-to-b from-green-700 to-green-800 shadow-xl transition-all duration-300 z-50 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 bg-white border border-green-300 rounded-full p-1.5 shadow-md hover:bg-green-50 transition-colors"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? (
          <FaChevronRight className="w-3 h-3 text-green-700" />
        ) : (
          <FaChevronLeft className="w-3 h-3 text-green-700" />
        )}
      </button>

      {/* Navigation Items */}
   
      <div className="h-full overflow-y-auto py-6 px-3">
        <div className="space-y-1">
          
          {navigationItems.map((item) => {
            // Check if we're on a school details page with examType query param
            const examType = searchParams.get('examType')
            const isSchoolDetailsPage = pathname.startsWith('/admin/schools/')
            
            let isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            
            // If on school details page with examType, match based on examType
            if (isSchoolDetailsPage && examType) {
              const expectedRoute = examTypeToRoute[examType]
              isActive = item.href === expectedRoute
            }
            
            const Icon = item.icon

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-3 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-white text-green-700 font-semibold shadow-sm'
                    : 'text-white hover:bg-green-600 hover:text-white'
                }`}
                title={isCollapsed ? item.name : ''}
              >
                <Icon 
                  className={`shrink-0 ${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} ${
                    isActive ? 'text-green-700' : 'text-green-100 group-hover:text-white'
                  }`} 
                />
                {!isCollapsed && (
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    {item.description && (
                      <p className={`text-xs truncate mt-0.5 ${
                        isActive ? 'text-green-600' : 'text-green-200'
                      }`}>
                        {item.description}
                      </p>
                    )}
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Footer Info */}
      {!isCollapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-green-600 bg-green-900">
          <p className="text-xs text-green-200 text-center">
            MOPSE Admin Dashboard
          </p>
          <p className="text-xs text-green-300 text-center mt-1">
            v1.0.0
          </p>
        </div>
      )}
    </aside>
  )
}
