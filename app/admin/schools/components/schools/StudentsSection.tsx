"use client";

import { useState, useMemo } from "react";
import PaginationControls from './PaginationControls';
import { useGetStudentsBySchoolIdQuery } from '@/app/admin/schools/store/api/schoolsApi';
import { useStudentExport } from '@/hooks/useStudentExport';
import { Student } from '@/services/schoolService';

// Define possible response structures for students API
interface StudentsDataResponse {
  data: Student[];
}

interface StudentsNestedResponse {
  students: Student[];
}



interface StudentsSectionProps {
  schoolId: string;
  schoolName: string;
  onExport?: () => void; // Made optional since we handle export internally now
}

export default function StudentsSection({
  schoolId,
  schoolName
}: StudentsSectionProps) {
  // Fetch students using RTK Query
  const {
    data: studentsResponse,
    isLoading,
    error
  } = useGetStudentsBySchoolIdQuery(schoolId);



  // Initialize export hook
  const { exportStudentList } = useStudentExport();

  
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Extract students array from response
  const students = useMemo(() => {
  
    
    // Handle different possible response structures
    if (Array.isArray(studentsResponse)) {
      return studentsResponse;
    }
    
    // If response has a data property
    if (studentsResponse && typeof studentsResponse === 'object' && 'data' in studentsResponse) {
      const data = (studentsResponse as StudentsDataResponse).data;
      return Array.isArray(data) ? data : [];
    }
    
    // If response has students property
    if (studentsResponse && typeof studentsResponse === 'object' && 'students' in studentsResponse) {
      const students = (studentsResponse as StudentsNestedResponse).students;
      return Array.isArray(students) ? students : [];
    }
    
    return [];
  }, [studentsResponse]);

  // Filter students based on search
  const filteredStudents = useMemo(() => {
    if (!students || !Array.isArray(students) || students.length === 0) {
      return [];
    }
    return students.filter((student: Student) =>
      student.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student._id?.includes(searchTerm) ||
      student.class?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  // Handle export functionality
  const handleExportStudents = () => {
    if (!students || students.length === 0) {
   
      return;
    }
    exportStudentList(students, schoolName);
  };

  // Handle loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Students</h2>
        </div>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Students</h2>
        </div>
        <div className="p-8 text-center">
          <div className="text-red-600">
            Failed to load students. Please try again.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Students ({students.length})</h2>
          <div className="flex space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page when searching
                }}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={12}>12 per page</option>
              <option value={24}>24 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
            
            <button
              onClick={handleExportStudents}
              disabled={!students || students.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {filteredStudents.length === 0 ? (
        <div className="p-8 text-center">
          <div className="text-gray-500">
            {searchTerm ? 'No students found matching your search.' : 'No students found for this school.'}
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Exam Year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Onboarding Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedStudents.map((student) => (
                  console.log(student),
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {student.studentId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.studentName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.gender}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.class}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.examYear}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        student.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {student.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        student.onboardingStatus === 'Onboarded' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {student.onboardingStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-700 text-center mb-4">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredStudents.length)} of {filteredStudents.length} students
            </div>
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              hasNextPage={currentPage < totalPages}
              hasPrevPage={currentPage > 1}
              isLoading={false}
              onPageChange={setCurrentPage}
            />
          </div>
        </>
      )}
    </div>
  );
}
