'use client'

import { usePathname } from 'next/navigation'
import DashboardLayout from '../schools/components/DashboardLayout'
import ProtectedRoute from '../schools/components/ProtectedRoute'
import { useActivityTimeout } from '@/hooks/useActivityTimeout'

interface ConditionalLayoutProps {
  children: React.ReactNode
}

function ProtectedContent({ children }: { children: React.ReactNode }) {
  // Initialize activity timeout (5 minutes of inactivity)
  useActivityTimeout({
    timeoutMinutes: 5,
    warningMinutes: 1,
    redirectPath: '/admin'
  });

  return <>{children}</>;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  
  // Don't show DashboardLayout on login page
  if (pathname === '/admin') {
    return <>{children}</>
  }
  
  // Show DashboardLayout with ProtectedRoute and activity timeout for all other admin pages
  return (
    <ProtectedRoute>
      <ProtectedContent>
        <DashboardLayout>
          {children}
        </DashboardLayout>
      </ProtectedContent>
    </ProtectedRoute>
  )
}