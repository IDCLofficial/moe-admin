'use client'

import ExamStatsCards from '@/app/admin/schools/components/schools/ExamStatsCards'
import NotificationBanner from '@/app/admin/schools/components/NotificationBanner'
import { useSchoolManagement } from '@/hooks/useSchoolManagement'
import ExamSchoolTable from '@/app/admin/schools/components/schools/ExamSchoolTable'
import { useGetApplicationsQuery } from '@/app/admin/schools/store/api/schoolsApi'
import { FaSchool } from 'react-icons/fa'

export default function AdminDashboard() {
  const {
    notification,
    clearNotification
  } = useSchoolManagement()

  const { data: applicationsResponse } = useGetApplicationsQuery({
    examType: 'WAEC',
    limit: 20
  })

  const applications = applicationsResponse?.data || []
  const totalStudents = applications.reduce((sum, app) => sum + app.numberOfStudents, 0)
  const approvedApplications = applications.filter(app => app.applicationStatus === 'approved').length
  const pendingApplications = applications.filter(app => app.applicationStatus === 'pending').length


  return (
      <div>
      <div className="min-h-screen bg-gray-50">
        <NotificationBanner 
          notification={notification} 
          onClose={clearNotification} 
        />
       
      

        {/* Main Content */}
        <div className="p-6">
          {/* Statistics Cards */}
          <ExamStatsCards
            totalApplications={applications.length}
            totalStudents={totalStudents}
            approvedApplications={approvedApplications}
            pendingApplications={pendingApplications}
            icon={FaSchool}
          />

          {/* Schools Section */}
          <div className="mt-8">
       

            {/* Schools Table */}
            <div className="mb-10">
              <ExamSchoolTable examType="WAEC" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

