'use client'

import { FaGraduationCap } from 'react-icons/fa'
import ExamSchoolTable from '../schools/components/schools/ExamSchoolTable'
import ExamStatsCards from '../schools/components/schools/ExamStatsCards'
import { useGetApplicationsQuery } from '@/app/admin/schools/store/api/schoolsApi'

export default function WaecPage() {
  const { data: applicationsResponse } = useGetApplicationsQuery({
    examType: 'WAEC',
    limit: 100
  })

  const applications = applicationsResponse?.data || []
  const totalStudents = applications.reduce((sum, app) => sum + app.numberOfStudents, 0)
  const approvedApplications = applications.filter(app => app.applicationStatus === 'approved').length
  const pendingApplications = applications.filter(app => app.applicationStatus === 'pending').length
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FaGraduationCap className="text-green-600" />
          WAEC Management
        </h1>
        <p className="text-gray-600 mt-2">
          West African Examinations Council - Manage WAEC examinations, registrations, and results
        </p>
      </div>

      <ExamStatsCards
        totalApplications={applications.length}
        totalStudents={totalStudents}
        approvedApplications={approvedApplications}
        pendingApplications={pendingApplications}
        icon={FaGraduationCap}
      />

      <ExamSchoolTable examType="WAEC" />
    </div>
  )
}
