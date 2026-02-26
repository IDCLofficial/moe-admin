'use client'

import { FaRedo, FaFileAlt } from 'react-icons/fa'
import ExamSchoolTable from '../schools/components/schools/ExamSchoolTable'
import ExamStatsCards from '../schools/components/schools/ExamStatsCards'
import { useGetApplicationsQuery } from '@/app/admin/schools/store/api/schoolsApi'

export default function BeceResitPage() {
  const { data: applicationsResponse } = useGetApplicationsQuery({
    examType: 'BECE-resit',
    limit: 20
  })

  const applications = applicationsResponse?.data || []
  const totalStudents = applications.reduce((sum, app) => sum + app.numberOfStudents, 0)
  const approvedApplications = applications.filter(app => app.applicationStatus === 'approved').length
  const pendingApplications = applications.filter(app => app.applicationStatus === 'pending').length
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FaFileAlt className="text-green-600" />
          BECE RESIT Management
        </h1>
        <p className="text-gray-600 mt-2">
          BECE Resit Examinations - Manage resit registrations, examinations, and results
        </p>
      </div>

      <ExamStatsCards
        totalApplications={applications.length}
        totalStudents={totalStudents}
        approvedApplications={approvedApplications}
        pendingApplications={pendingApplications}
        icon={FaRedo}
      />

      <ExamSchoolTable examType="BECE-resit" />
    </div>
  )
}
