import { useRouter } from 'next/navigation';
import { School } from '@/services/schoolService';

interface SchoolSearchDropdownProps {
  schools: School[];
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSchoolSelect: (school: School) => void;
}

export default function SchoolSearchDropdown({
  schools,
  isOpen,
  isLoading,
  onClose,
  onSchoolSelect
}: SchoolSearchDropdownProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleSchoolClick = (school: School) => {
    onSchoolSelect(school);
    onClose();
    // Navigate to school detail page
    router.push(`/admin/schools/${school._id}`);
  };

  return (
    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
      {isLoading ? (
        <div className="p-4 text-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading schools...</p>
        </div>
      ) : schools.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          <p className="text-sm">No schools found</p>
        </div>
      ) : (
        <div className="py-2">
          {schools.map((school) => (
            <button
              key={school._id}
              onClick={() => handleSchoolClick(school)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="font-medium text-gray-900 text-sm capitalize">
                  {school.schoolName}
                </div>
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
