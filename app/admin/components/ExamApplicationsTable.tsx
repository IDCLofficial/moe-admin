'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGetApplicationsQuery } from '@/app/admin/schools/store/api/schoolsApi'
import { Application } from '@/app/admin/schools/store/api/schoolsApi'
import { FaSearch, FaEye } from 'react-icons/fa'

interface ExamApplicationsTableProps {
  examType: 'UBEGPT' | 'UBETMS' | 'Common-entrance' | 'BECE' | 'BECE-resit' | 'UBEAT' | 'JSCBE' | 'WAEC'
}

export default function ExamApplicationsTable({ examType }: ExamApplicationsTableProps) {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')

  const { 
    data: applicationsResponse, 
    isLoading, 
    isFetching,
    error 
  } = useGetApplicationsQuery({
    page,
    limit: 20,
    examType,
    searchTerm: searchTerm || undefined
  })

  const applications = applicationsResponse?.data || []
  const meta = applicationsResponse?.meta || {
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 20,
    hasNextPage: false,
    hasPrevPage: false
  }

  const handleViewDetails = (schoolId: string, applicationId: string, examType: string) => {
    router.push(`/admin/schools/${schoolId}?examType=${examType}&appId=${applicationId}`)
  }

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
      onboarded: 'bg-purple-100 text-purple-800'
    }
    return statusColors[status] || 'bg-gray-100 text-gray-800'
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading applications. Please try again.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by school name, principal, or email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setPage(1)
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading || isFetching ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No applications found for {examType}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      School Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Principal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Students
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {applications.map((application) => (
                    <tr key={application._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {application.schoolName || application.school?.schoolName || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {application.address || application.school?.address || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {application.principal || application.school?.principal || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {application.email || application.school?.email || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {application.phone || application.school?.phone || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {application.numberOfStudents || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(application.applicationStatus)}`}>
                          {application.applicationStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewDetails(
                            application.school?._id || '', 
                            application._id, 
                            application.examType
                          )}
                          className="text-green-600 hover:text-green-900 flex items-center gap-1"
                        >
                          <FaEye /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={!meta.hasPrevPage}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={!meta.hasNextPage}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{((page - 1) * meta.limit) + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(page * meta.limit, meta.total)}
                    </span>{' '}
                    of <span className="font-medium">{meta.total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={!meta.hasPrevPage}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      Page {page} of {meta.totalPages}
                    </span>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={!meta.hasNextPage}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
