'use client'

import { FaUserGraduate } from 'react-icons/fa'
import ExamSchoolTable from '../schools/components/schools/ExamSchoolTable'
import ExamStatsCards from '../schools/components/schools/ExamStatsCards'
import { useGetApplicationsQuery } from '@/app/admin/schools/store/api/schoolsApi'

export default function UbegptPage() {
  const { data: applicationsResponse } = useGetApplicationsQuery({
    examType: 'UBEGPT',
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
          <FaUserGraduate className="text-green-600" />
          UBEGPT Management
        </h1>
        <p className="text-gray-600 mt-2">
          UBE General Proficiency Test - Manage proficiency assessments and certifications
        </p>
      </div>

      <ExamStatsCards
        totalApplications={applications.length}
        totalStudents={totalStudents}
        approvedApplications={approvedApplications}
        pendingApplications={pendingApplications}
        icon={FaUserGraduate}
      />

      <ExamSchoolTable examType="UBEGPT" />
    </div>
  )
}
