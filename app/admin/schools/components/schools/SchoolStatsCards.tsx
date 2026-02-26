"use client";

import { School } from '@/services/schoolService';

interface Transaction {
  _id: string;
  totalAmount: number;
  numberOfStudents: number;
  reference: string;
  paymentStatus: string;
  paidAt?: string;
  createdAt: string;
}

interface SchoolStatsCardsProps {
  school: School;
  transactions: Transaction[];
  transactionsLoading: boolean;
  totalStudents: number;
  onboardedStudents: number;
  totalPaid: number;
  totalTransactionStudents: number;
  latestTransaction: Transaction | null;
}

export default function SchoolStatsCards({
  school,
  transactions,
  transactionsLoading,
  totalStudents,
  onboardedStudents,
  totalPaid,
  totalTransactionStudents,
  latestTransaction
}: SchoolStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {school.status === 'not applied' ? (
      
        // Cards for Not Applied Schools
        <>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-lg font-bold text-gray-900">
              {totalStudents}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total Students</div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-lg font-bold text-gray-900 truncate">
              {school.email || 'N/A'}
            </div>
            <div className="text-sm text-gray-600 mt-1">Email Address</div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-lg font-bold text-gray-900">
              {school.phone ? `+234${school.phone.toString().replace(/^0/, '')}` : 'N/A'}
            </div>
            <div className="text-sm text-gray-600 mt-1">Phone Number</div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-lg font-bold text-gray-900">
              {new Date(school._id ? new Date(parseInt(school._id.substring(0, 8), 16) * 1000) : new Date()).toLocaleDateString()}
            </div>
            <div className="text-sm text-gray-600 mt-1">Registration Date</div>
          </div>
        </>
      ) : (
        // Cards for Applied/Approved Schools
        <>
          {/* Payment-related cards (only for onboarded and completed schools) */}
          {(school.status === 'onboarded' || school.status === 'completed') && (
            <>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="text-lg font-bold text-black">
                  {transactionsLoading ? (
                    <div className="animate-pulse h-6 bg-gray-200 rounded w-16"></div>
                  ) : (
                    `₦${totalPaid.toLocaleString()}`
                  )}
                </div>
                <div className="text-sm text-gray-600 mt-1">Total Paid</div>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="text-lg font-bold text-black">
                  {transactionsLoading ? (
                    <div className="animate-pulse h-6 bg-gray-200 rounded w-12"></div>
                  ) : (
                    totalTransactionStudents
                  )}
                </div>
                <div className="text-sm text-gray-600 mt-1">No. of Students Paid For</div>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="text-lg font-bold text-black truncate">
                  {transactionsLoading ? (
                    <div className="animate-pulse h-6 bg-gray-200 rounded w-20"></div>
                  ) : (
                    latestTransaction?.reference || 'N/A'
                  )}
                </div>
                <div className="text-sm text-gray-600 mt-1">Transaction Reference</div>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="text-lg font-bold text-black">
                  {transactionsLoading ? (
                    <div className="animate-pulse h-6 bg-gray-200 rounded w-24"></div>
                  ) : (
                    latestTransaction ? new Date(latestTransaction.paidAt || latestTransaction.createdAt).toLocaleDateString() : 'N/A'
                  )}
                </div>
                <div className="text-sm text-gray-600 mt-1">Last Payment Date</div>
              </div>
            </>
          )}
          
          {/* School Information cards */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-lg font-bold text-gray-900 truncate">
              {school.principal || 'N/A'}
            </div>
            <div className="text-sm text-gray-600 mt-1">Principal Name</div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-lg font-bold text-gray-900 truncate">
              {school.email || 'N/A'}
            </div>
            <div className="text-sm text-gray-600 mt-1">Email Address</div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-lg font-bold text-gray-900">
              {school.phone ? `+234${school.phone.toString().replace(/^0/, '')}` : 'N/A'}
            </div>
            <div className="text-sm text-gray-600 mt-1">Phone Number</div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-lg font-bold text-gray-900 truncate overflow-hidden">
              {school.address || 'N/A'}
            </div>
            <div className="text-sm text-gray-600 mt-1">School Address</div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-lg font-bold text-gray-900">
              {school.numberOfStudents || 0}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total Students Declared</div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-lg font-bold text-black">
              {totalStudents}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total Students In Database</div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-lg font-bold text-black">
              {onboardedStudents}
            </div>
            <div className="text-sm text-gray-600 mt-1">Onboarded Students</div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-lg font-bold text-black">
              {school.totalPoints || 0}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total Points</div>
          </div>
          
          {/* Additional Transaction Information Cards (only for onboarded and completed schools) */}
          {transactions.length > 0 && (school.status === 'onboarded' || school.status === 'completed') && (
            <>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="text-lg font-bold text-black">
                  {transactions.length}
                </div>
                <div className="text-sm text-gray-600 mt-1">Total Transactions</div>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="text-lg font-bold text-black">
                  ₦{transactions.length > 0 ? Math.round(totalPaid / transactions.length).toLocaleString() : 0}
                </div>
                <div className="text-sm text-gray-600 mt-1">Average Payment</div>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="text-lg font-bold text-black">
                  {transactions.filter(t => t.paymentStatus === 'successful').length}
                </div>
                <div className="text-sm text-gray-600 mt-1">Successful Payments</div>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="text-lg font-bold text-black">
                  {school.availablePoints || 0}
                </div>
                <div className="text-sm text-gray-600 mt-1">Available Points</div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
