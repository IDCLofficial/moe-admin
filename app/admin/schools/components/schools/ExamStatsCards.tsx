import { FaClipboardCheck, FaUsers, FaChartLine } from 'react-icons/fa';

interface ExamStatsCardsProps {
  totalApplications: number;
  totalStudents: number;
  approvedApplications: number;
  pendingApplications: number;
  icon: React.ComponentType<{ className?: string }>;
}

export default function ExamStatsCards({
  totalApplications,
  totalStudents,
  approvedApplications,
  pendingApplications,
  icon: Icon
}: ExamStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Applications</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalApplications}</p>
          </div>
          <FaClipboardCheck className="text-3xl text-blue-500" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Students</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalStudents}</p>
          </div>
          <FaUsers className="text-3xl text-green-500" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Approved Applications</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{approvedApplications}</p>
          </div>
          <FaChartLine className="text-3xl text-green-500" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Pending Review</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{pendingApplications}</p>
          </div>
          <Icon className="text-3xl text-yellow-500" />
        </div>
      </div>
    </div>
  );
}
