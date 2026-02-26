"use client";

import { useRouter } from "next/navigation";

interface School {
  _id: string;
  schoolName: string;
  address: string;
  status: string;
  applicationStatus?: string; // For when this is an Application object
}

interface SchoolDetailsHeaderProps {
  school: School;
  applicationId: string | null;
  onApprove: () => void;
  onReject: () => void;
  onSendConfirmation: () => void;
}

export default function SchoolDetailsHeader({
  school,
  applicationId,
  onApprove,
  onReject,
  onSendConfirmation
}: SchoolDetailsHeaderProps) {
  const router = useRouter();
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 active:scale-95 transition-all duration-200 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg active:shadow-sm"
        >
          ← Back to Schools
        </button>
        <h1 className="text-3xl font-bold text-gray-900">{school.schoolName}</h1>
        <p className="text-gray-600">{school.address}</p>
      </div>
      
      {/* Action buttons based on application status */}
      {applicationId && (
        <div className="flex space-x-2">
          {/* Show Approve/Reject buttons only for 'applied' status */}
          {(applicationId ? school.applicationStatus === 'pending' : school.status === 'applied') && (
            <>
              <button
                onClick={onApprove}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Approve
              </button>
              <button
                onClick={onReject}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Reject
              </button>
            </>
          )}
          
            {/* Show Send Confirmation button only for 'onboarded' status */}
            {school.status === 'onboarded' && (
              <button
                onClick={onSendConfirmation}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Send Confirmation
              </button>
            )}
        </div>
      )}
    </div>
  );
}
