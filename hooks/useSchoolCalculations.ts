import { useMemo } from 'react';
import { Student, School } from '@/services/schoolService';

interface Transaction {
  _id: string;
  totalAmount: number;
  numberOfStudents: number;
  reference: string;
  paymentStatus: string;
  paidAt?: string;
  createdAt: string;
}

export function useSchoolCalculations(school: School | undefined, transactions: Transaction[]) {
  const calculations = useMemo(() => {
    const totalStudents = school?.students?.length || 0;
    const onboardedStudents = school?.students?.filter((student: Student) => 
      student.onboardingStatus === 'Onboarded'
    ).length || 0;
    
    const totalPaid = transactions.length > 0 
      ? transactions.reduce((sum, transaction) => sum + (transaction.totalAmount || 0), 0)
      : 0;
    
    const totalTransactionStudents = transactions.length > 0
      ? transactions.reduce((sum, transaction) => sum + (transaction.numberOfStudents || 0), 0)
      : 0;
    
    const latestTransaction = transactions.length > 0 
      ? [...transactions].sort((a, b) => {
          const dateA = new Date(a.paidAt || a.createdAt).getTime();
          const dateB = new Date(b.paidAt || b.createdAt).getTime();
          return dateB - dateA;
        })[0]
      : null;

    return {
      totalStudents,
      onboardedStudents,
      totalPaid,
      totalTransactionStudents,
      latestTransaction
    };
  }, [school?.students, transactions]);

  return calculations;
}
