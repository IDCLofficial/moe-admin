"use client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { 
  useGetSchoolByIdQuery, 
  useGetSchoolTransactionsQuery,
  useGetApplicationsBySchoolIdQuery
} from "@/app/admin/schools/store/api/schoolsApi";
import { useSchoolStatusActions } from '@/app/admin/schools/components/schools/SchoolStatusActions';
import { Application } from '@/app/admin/schools/store/api/schoolsApi';
import SchoolDetailsHeader from '@/app/admin/schools/components/schools/SchoolDetailsHeader';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/app/admin/schools/components/ProtectedRoute';
import SchoolStatsCards from '@/app/admin/schools/components/schools/SchoolStatsCards';
import StudentsSection from '@/app/admin/schools/components/schools/StudentsSection';
import ApplicationReviewLayout from '@/app/admin/schools/components/schools/ApplicationReviewLayout';
import { useSchoolCalculations } from '@/hooks/useSchoolCalculations';
import { useStudentExport } from '@/hooks/useStudentExport';

function SchoolDetailsPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const schoolId = params.id as string;
  const examTypeParam = searchParams.get('examType'); // Get exam type from URL
  const appIdParam = searchParams.get('appId'); // Get application ID from URL

  function isApplication(obj: unknown): obj is Application {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "applicationStatus" in obj
  );
}

  // RTK Query hooks
  const { 
    data: school, 
    isLoading: schoolLoading, 
    error: schoolError 
  } = useGetSchoolByIdQuery({
    id: schoolId,
    examType: examTypeParam || undefined
  }, {
    skip: !schoolId
  });

  const { 
    data: transactionsData, 
    isLoading: transactionsLoading 
  } = useGetSchoolTransactionsQuery(schoolId, {
    skip: !schoolId || school?.status === 'not applied'
  });

  // Initialize SchoolStatusActions hook
  const {
    handleApproveOne,
    handleRejectOne,
    handleSendConfirmationSingle,
    handleReapproveOne
  } = useSchoolStatusActions({
    onSuccess: () => {
      // RTK Query will automatically refetch due to cache invalidation
      // The cache invalidation tags ['Application', 'School'] will trigger refetch
      console.log('Status change successful - RTK Query will automatically update the UI');
    }
  });

  const transactions = transactionsData?.data || [];

  // The school object from useGetSchoolByIdQuery is actually the full application object
  // It contains _id, applicationStatus, reviewNotes, etc.
  const applicationId = school?._id || null;
 const hasApplication = isApplication(school);
const applicationForReview: Application | null = hasApplication ? school : null;


  // Use school data directly
  const enhancedSchool = school!;

  // Use custom hooks for calculations and export
  const {
    totalStudents,
    onboardedStudents,
    totalPaid,
    totalTransactionStudents,
    latestTransaction
  } = useSchoolCalculations(enhancedSchool, transactions);

  const { exportStudentList } = useStudentExport();

  const handleExportStudentList = () => {
    if (!enhancedSchool?.students) return;
    exportStudentList(enhancedSchool.students, enhancedSchool.schoolName);
  };

  // Handle status actions using the SchoolStatusActions hook
  const handleApproveSchool = async () => {
    if (!applicationId) {
      console.error('No application ID available.');
      return;
    }
    
    await handleApproveOne(applicationId, examTypeParam || undefined);
  };

  const handleRejectSchool = async () => {
    if (!applicationId) {
      console.error('No application ID available.');
      return;
    }
    
    await handleRejectOne(applicationId, examTypeParam || undefined);
  };

  const handleSendConfirmation = async () => {
    if (!applicationId) {
      console.error('No application ID available.');
      return;
    }
    
    await handleSendConfirmationSingle(applicationId, examTypeParam || undefined);
  };

  const handleReapproveSchool = async () => {
    if (!applicationId) {
      console.error('No application ID available.');
      return;
    }
    
    await handleReapproveOne(applicationId, examTypeParam || undefined);
  };

  if (schoolLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
         <span className="loaderAnimation"></span>
        </div>
      </div>
    );
  }

  if (schoolError || !school) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Failed to load school details</p>
          <button 
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Check if this is a pending or rejected application (show ApplicationReviewLayout)
  const showApplicationReview = applicationForReview?.applicationStatus === 'pending' || applicationForReview?.applicationStatus === 'rejected';
  console.log('Show Application Review:', showApplicationReview);
  console.log('Application For Review:', applicationForReview);
  console.log('Application Status:', applicationForReview?.applicationStatus);
  console.log('Has Application:', hasApplication);

  return (
    
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {showApplicationReview && applicationForReview ? (
            /* Application Review Layout for Pending/Rejected Applications */
            <ApplicationReviewLayout
              application={applicationForReview as Application}
              applicationId={applicationId}
              onApprove={handleApproveSchool}
              onReject={handleRejectSchool}
              onReapprove={handleReapproveSchool}
            />
          ) : (
            /* Standard Layout for Other Schools */
            <>
              {/* Page Header */}
              <SchoolDetailsHeader
                school={school}
                applicationId={applicationId}
                onApprove={handleApproveSchool}
                onReject={handleRejectSchool}
                onSendConfirmation={handleSendConfirmation}
              />

              {/* Statistics Cards */}
              <SchoolStatsCards
                school={enhancedSchool}
                transactions={transactions}
                transactionsLoading={transactionsLoading}
                totalStudents={totalStudents}
                onboardedStudents={onboardedStudents}
                totalPaid={totalPaid}
                totalTransactionStudents={totalTransactionStudents}
                latestTransaction={latestTransaction}
              />

              {/* Students Section */}
              <StudentsSection
                schoolId={schoolId}
                schoolName={school?.schoolName || ''}
                onExport={handleExportStudentList}
              />
            </>
          )}
        </div>
      </div>
    
  );
}

export default function SchoolDetailsPageRTK() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <SchoolDetailsPageContent />
      </ProtectedRoute>
    </AuthProvider>
  );
}
