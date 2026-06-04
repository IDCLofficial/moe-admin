'use client'

import { useState } from 'react';
import { useGetAllComplaintsQuery, useResolveComplaintMutation, Complaint } from '@/app/admin/store/api/schoolsApi';
import { FaHeadset, FaEnvelope, FaPhone, FaCalendar, FaCheckCircle, FaClock, FaChevronLeft, FaChevronRight, FaTimes, FaEye } from 'react-icons/fa';

const REASON_TABS = [
  { key: '', label: 'All' },
  { key: 'result_not_found', label: 'Result Not Found' },
  { key: 'wrong_result', label: 'Wrong Result' },
  { key: 'payment_issue', label: 'Payment Issue' },
  { key: 'account_issue', label: 'Account Issue' },
  { key: 'other', label: 'Other' },
];

export default function CustomerSupportDashboard() {
  const [currentPage, setCurrentPage] = useState(1);
  const [activeReason, setActiveReason] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [resolveComplaint, { isLoading: isResolvingComplaint }] = useResolveComplaintMutation();
  const limit = 10;

  const { data: complaintsResponse, isLoading, error } = useGetAllComplaintsQuery(
    { page: currentPage, limit, reasonForContact: activeReason || undefined },
    {
      refetchOnMountOrArgChange: true
    }
  );

  const complaints = complaintsResponse?.data || [];
  const pagination = complaintsResponse?.pagination;
  const totalComplaints = pagination?.totalItems || 0;
  const totalPages = pagination?.totalPages || 1;

  const handleTabChange = (reason: string) => {
    setActiveReason(reason);
    setCurrentPage(1);
  };

  const handleResolveComplaint = async (reference: string) => {
    try {
      await resolveComplaint({ reference }).unwrap();
      setSelectedComplaint(null);
    } catch (err) {
      console.error('Failed to resolve complaint:', err);
    }
  };

  const getStatus = (complaint: Complaint) => complaint.resolved ? 'resolved' : 'pending';

  const getRowClassName = (complaint: Complaint) => {
    const status = getStatus(complaint);
    switch (status) {
      case 'resolved':
        return 'bg-green-50 hover:bg-green-100 cursor-pointer';
      default:
        return 'hover:bg-gray-50 cursor-pointer';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading complaints...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>Error loading complaints. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FaHeadset className="h-8 w-8 text-green-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Customer Support Dashboard</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Complaints</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalComplaints}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FaHeadset className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Page</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{currentPage} / {totalPages}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <FaClock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Items Per Page</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{limit}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <FaCheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Reason Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
          <div className="flex flex-wrap border-b border-gray-200">
            {REASON_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`px-5 py-3 text-sm font-medium transition-colors duration-200 border-b-2 ${
                  activeReason === tab.key
                    ? 'border-green-600 text-green-600 bg-green-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Complaints Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {activeReason ? REASON_TABS.find(t => t.key === activeReason)?.label : 'All'} Complaints
            </h2>
          </div>
          
          {complaints.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FaHeadset className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No complaints found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Full Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      School / LGA
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Exam
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reference
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {complaints.map((complaint) => (
                    <tr key={complaint._id} className={getRowClassName(complaint)} onClick={() => setSelectedComplaint(complaint)}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{complaint.fullName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <FaEnvelope className="h-3 w-3 mr-1 text-gray-400" />
                            {complaint.email}
                          </div>
                          {complaint.phone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <FaPhone className="h-3 w-3 mr-1 text-gray-400" />
                              {complaint.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{complaint.schoolName}</div>
                        <div className="text-xs text-gray-500">{complaint.lga}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{complaint.exam}</div>
                        <div className="text-xs text-gray-500">Year: {complaint.year}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {complaint.reasonForContact.replace(/_/g, ' ')}
                        </span>
                        {complaint.other && (
                          <p className="text-xs text-gray-500 mt-1 max-w-xs truncate">{complaint.other}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-600 font-mono">{complaint.reference}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-600">
                          <FaCalendar className="h-3 w-3 mr-1 text-gray-400" />
                          {new Date(complaint.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Complaint Detail Modal */}
          {selectedComplaint && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelectedComplaint(null)}>
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-green-50">
                  <h3 className="text-lg font-semibold text-gray-900">Complaint Details</h3>
                  <button onClick={() => setSelectedComplaint(null)} className="p-1 rounded-full hover:bg-gray-200">
                    <FaTimes className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
                <div className="px-6 py-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Full Name</p>
                      <p className="text-sm text-gray-900 mt-1">{selectedComplaint.fullName}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Reference</p>
                      <p className="text-sm text-gray-900 mt-1 font-mono">{selectedComplaint.reference}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Email</p>
                      <p className="text-sm text-gray-900 mt-1">{selectedComplaint.email}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Phone</p>
                      <p className="text-sm text-gray-900 mt-1">{selectedComplaint.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">School</p>
                      <p className="text-sm text-gray-900 mt-1">{selectedComplaint.schoolName}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">LGA</p>
                      <p className="text-sm text-gray-900 mt-1">{selectedComplaint.lga}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Exam</p>
                      <p className="text-sm text-gray-900 mt-1">{selectedComplaint.exam}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Exam No</p>
                      <p className="text-sm text-gray-900 mt-1">{selectedComplaint.examNo || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Year</p>
                      <p className="text-sm text-gray-900 mt-1">{selectedComplaint.year}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Date Submitted</p>
                      <p className="text-sm text-gray-900 mt-1">{new Date(selectedComplaint.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Reason for Contact</p>
                    <span className="inline-flex px-2 py-1 mt-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {selectedComplaint.reasonForContact.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {selectedComplaint.other && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Additional Details</p>
                      <p className="text-sm text-gray-900 mt-1 bg-gray-50 p-3 rounded-md border border-gray-200">{selectedComplaint.other}</p>
                    </div>
                  )}

                  {/* Status Display */}
                  {getStatus(selectedComplaint) && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Current Status</p>
                      <span className={`inline-flex px-3 py-1 mt-1 text-xs font-semibold rounded-full ${
                        getStatus(selectedComplaint) === 'resolved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {(getStatus(selectedComplaint) || '').charAt(0).toUpperCase() + (getStatus(selectedComplaint) || '').slice(1)}
                      </span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleResolveComplaint(selectedComplaint.reference)}
                      disabled={isResolvingComplaint || getStatus(selectedComplaint) === 'resolved'}
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isResolvingComplaint ? 'Resolving...' : 'Mark as Resolved'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages} ({totalComplaints} total items)
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={!pagination?.hasPreviousPage}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaChevronLeft className="h-3 w-3 mr-1" />
                  Previous
                </button>

                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md border ${
                        currentPage === pageNum
                          ? 'bg-green-600 text-white border-green-600'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={!pagination?.hasNextPage}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <FaChevronRight className="h-3 w-3 ml-1" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


