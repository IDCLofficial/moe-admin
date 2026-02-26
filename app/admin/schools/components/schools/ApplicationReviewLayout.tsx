"use client";
import { useRouter } from "next/navigation";
import { Application } from '../../store/api/schoolsApi';

interface ApplicationReviewLayoutProps {
  application: Application;
  applicationId: string | null;
  onApprove: () => void;
  onReject: () => void;
  onReapprove?: () => void;
}

export default function ApplicationReviewLayout({
  application,
  onApprove,
  onReject,
  onReapprove
}: ApplicationReviewLayoutProps) {
  const router = useRouter();
  
  const formatPhone = (phone: string | number | undefined) => {
    if (!phone) return 'N/A';
    const phoneStr = phone.toString();
    // Format as Nigerian phone number
    if (phoneStr.startsWith('0')) {
      return phoneStr.replace(/^0/, '+234 ');
    }
    return `+234 ${phoneStr}`;
  };

  return (
    <div className="bg-white">
      {/* Back button */}
      <div className="p-6 pb-0">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 active:scale-95 transition-all duration-200 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg active:shadow-sm"
        >
          ← Back to Schools
        </button>
      </div>

      {/* Header with buttons */}
      <div className="flex items-center justify-between p-6 pt-0 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          {application.applicationStatus === 'declined' || application.applicationStatus === 'rejected' ? 'Rejected Application Review' : 'Application Review'}
        </h2>
        <div className="flex space-x-3">
          {application.applicationStatus === 'declined' || application.applicationStatus === 'rejected' ? (
            /* Rejected Application - Show Reapprove Button */
            <button
              onClick={onReapprove}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
            >
              Reapprove Application
            </button>
          ) : (
            /* Applied Application - Show Approve/Deny Buttons */
            <>
              <button
                onClick={onReject}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                Deny Application
              </button>
              <button
                onClick={onApprove}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Approve Application
              </button>
            </>
          )}
        </div>
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
        {/* Left Column - Submitted Data */}
        <div className="p-6 border-r border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Submitted Data</h3>
          
          <div className="space-y-6">
            {/* School Name */}
            <div className="border-b border-gray-100 pb-4">
              <div className="text-base font-medium text-gray-900">
                {application.schoolName || 'N/A'}
              </div>
              <div className="text-sm text-gray-500 mt-1">School Name</div>
            </div>

            {/* Address */}
            <div className="border-b border-gray-100 pb-4">
              <div className="text-base font-medium text-gray-900">
                {application.address || 'N/A'}
              </div>
              <div className="text-sm text-gray-500 mt-1">Address</div>
            </div>

            {/* School Code */}
            <div className="border-b border-gray-100 pb-4">
              <div className="text-base font-medium text-gray-900">
                {application.schoolCode || 'N/A'}
              </div>
              <div className="text-sm text-gray-500 mt-1">Unique Code</div>
            </div>

            {/* Principal */}
            <div className="border-b border-gray-100 pb-4">
              <div className="text-base font-medium text-gray-900">
                {application.principal || 'N/A'}
              </div>
              <div className="text-sm text-gray-500 mt-1">Principal</div>
            </div>

            {/* Contact Email */}
            <div className="border-b border-gray-100 pb-4">
              <div className="text-base font-medium text-gray-900">
                {application.email || 'N/A'}
              </div>
              <div className="text-sm text-gray-500 mt-1">Contact Email</div>
            </div>

            {/* Contact Phone */}
            <div className="border-b border-gray-100 pb-4">
              <div className="text-base font-medium text-gray-900">
                {formatPhone(application.phone)}
              </div>
              <div className="text-sm text-gray-500 mt-1">Contact Phone</div>
            </div>

            {/* Students Declared */}
            <div className="pb-4">
              <div className="text-base font-medium text-gray-900">
                {application.numberOfStudents || 0}
              </div>
              <div className="text-sm text-gray-500 mt-1">Students Declared</div>
            </div>
          </div>
        </div>

        {/* Right Column - System School Data */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">System School Data</h3>
          
          <div className="space-y-6">
            {/* Unique Code */}
            <div className="border-b border-gray-100 pb-4">
              <div className="text-base font-medium text-gray-900">
                {application.school?.schoolName || 'N/A'}
              </div>
              <div className="text-sm text-gray-500 mt-1">Unique Code</div>
            </div>

            {/* Registered Name */}
            <div className="border-b border-gray-100 pb-4">
              <div className="text-base font-medium text-gray-900">
                {application.school?.schoolName || 'N/A'}
              </div>
              <div className="text-sm text-gray-500 mt-1">Registered Name</div>
            </div>

            {/* Official Contact */}
            <div className="border-b border-gray-100 pb-4">
              <div className="text-base font-medium text-gray-900">
                {application.school?.email || 'N/A'}
              </div>
              <div className="text-sm text-gray-500 mt-1">Official Contact</div>
            </div>

            {/* Students In Our Database */}
            <div className="pb-4">
              <div className="text-base font-medium text-gray-900">
                {application.school?.students?.length || 0}
              </div>
              <div className="text-sm text-gray-500 mt-1">Students In Our Database</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
