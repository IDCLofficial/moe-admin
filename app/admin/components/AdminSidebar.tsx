'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { 
  FaGraduationCap, 
  FaChartBar, 
  FaClipboardList,
  FaBook,
  FaUserGraduate,
  FaSchool,
  FaFileAlt,
  FaPencilAlt,
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
    name: 'WAEC', 
    href: '/admin/schools', 
    icon: FaGraduationCap,
    description: 'West African Examinations Council'
  },
  { 
    id: '2',
    name: 'BECE', 
    href: '/admin/bece', 
    icon: FaClipboardList,
    description: 'Basic Education Certificate Examination'
  },
  { 
    id: '3',
    name: 'BECE RESIT', 
    href: '/admin/bece-resit', 
    icon: FaFileAlt,
    description: 'BECE Resit Examinations'
  },
  { 
    id: '4',
    name: 'JSCBE', 
    href: '/admin/jscbe', 
    icon: FaPencilAlt,
    description: 'Junior Secondary Certificate Basic Education'
  },
  { 
    id: '5',
    name: 'COMMON ENTRANCE', 
    href: '/admin/common-entrance', 
    icon: FaBook,
    description: 'Common Entrance Examination'
  },
  { 
    id: '6',
    name: 'UBEAT', 
    href: '/admin/ubeat', 
    icon: FaChartBar,
    description: 'Universal Basic Education Achievement Test'
  },
  { 
    id: '7',
    name: 'UBEGPT', 
    href: '/admin/ubegpt', 
    icon: FaUserGraduate,
    description: 'UBE General Proficiency Test'
  },
  { 
    id: '8',
    name: 'UBETMS', 
    href: '/admin/ubetms', 
    icon: FaClipboardList,
    description: 'UBE Teacher Management System'
  },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Map exam types to their corresponding routes
  const examTypeToRoute: Record<string, string> = {
    'WAEC': '/admin/schools',
    'BECE': '/admin/bece',
    'BECE-RESIT': '/admin/bece-resit',
    'JSCBE': '/admin/jscbe',
    'Common-entrance': '/admin/common-entrance',
    'UBEAT': '/admin/ubeat',
    'UBEGPT': '/admin/ubegpt',
    'UBETMS': '/admin/ubetms',
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
