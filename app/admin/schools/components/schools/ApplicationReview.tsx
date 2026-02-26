
import { Student } from '@/services/schoolService'


// Application interface to match the data structure
interface Application {
  _id: string;
  school: {
    _id: string;
    schoolName: string;
    address: string;
    principal: string;
    email: string;
    students: Student[];
    status: string;
    isFirstLogin: boolean;
    totalPoints: number;
    availablePoints: number;
    usedPoints: number;
    __v: number;
    createdAt: string;
    updatedAt: string;
  };
  schoolName: string;
  address: string;
  schoolCode: string;
  principal: string;
  email: string;
  phone: number;
  numberOfStudents: number;
  applicationStatus: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  reviewNotes?: string;
  reviewedAt?: string;
}

interface ApplicationReviewProps {
  application: Application
  onBack: () => void
  onApprove?: (appId: string) => void
  onDeny?: (appId: string) => void
}

export default function ApplicationReview({ application, onBack, onApprove, onDeny }: ApplicationReviewProps) {
  const handleDenyApplication = async () => {
    if (onDeny) {
      onDeny(application._id)
    }
    
  }

  const handleApproveApplication = async () => {
    if (onApprove) {
      onApprove(application._id)
    }
    
  }

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 overflow-y-auto">
    {/* Header */}
    <div className="bg-white shadow-sm border-b border-b-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Application Review
              </button>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={handleDenyApplication}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Deny Application
              </button>
              <button 
                onClick={handleApproveApplication}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Approve Application
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Submitted Data */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Submitted Data</h3>
            
            <div className="space-y-6">
              <div>
                <div className="text-lg font-medium text-gray-900">{application.schoolName}</div>
                <div className="text-sm text-gray-500">School Name</div>
              </div>

              <div>
                <div className="text-sm text-gray-900">{application.address}</div>
                <div className="text-sm text-gray-500">Address</div>
              </div>

              <div>
                <div className="text-sm text-gray-900">{application.school?._id }</div>
                <div className="text-sm text-gray-500">Unique Code</div>
              </div>

              <div>
                <div className="text-sm text-gray-900">{application.principal}</div>
                <div className="text-sm text-gray-500">Principal</div>
              </div>

              <div>
                <div className="text-sm text-gray-900">{application.email}</div>
                <div className="text-sm text-gray-500">Contact Email</div>
              </div>

              <div>
                <div className="text-sm text-gray-900">{application.phone}</div>
                <div className="text-sm text-gray-500">Contact Phone</div>
              </div>

              <div>
                <div className="text-sm text-gray-900">{application.numberOfStudents}</div>
                <div className="text-sm text-gray-500">Students Declared</div>
              </div>
            </div>
          </div>

          {/* System School Data */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">System School Data</h3>
            
            <div className="space-y-6">
              <div>
                <div className="text-sm text-gray-900">{application.school?._id || 'SCH-3421'}</div>
                <div className="text-sm text-gray-500">Unique Code</div>
              </div>

              <div>
                <div className="text-sm text-gray-900">{application.school?.schoolName || application.schoolName}</div>
                <div className="text-sm text-gray-500">Registered Name</div>
              </div>

              <div>
                <div className="text-sm text-gray-900">{application.school?.email || application.email.replace('@schoolmail.com', '@edu.ng')}</div>
                <div className="text-sm text-gray-500">Official Contact</div>
              </div>

              <div>
                <div className="text-sm text-gray-900">{application.school?.students?.length}</div>
                <div className="text-sm text-gray-500">Students In Our Database</div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
