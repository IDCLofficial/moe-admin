import { useCallback } from 'react';
import { Student } from '@/services/schoolService';

export function useStudentExport() {
  const exportStudentList = useCallback((students: Student[], schoolName: string) => {
    if (!students || students.length === 0) return;
    
    const studentData = students.map((student, index) => ({
      'S/N': index + 1,
      'Student ID': student._id || 'N/A',
      'Name': student.studentName || 'N/A',
      'Gender': student.gender || 'N/A',
      'Class': student.class || 'N/A',
      'Exam Year': student.examYear || 'N/A',
      'Payment Status': student.paymentStatus || 'Pending',
      'Onboarding Status': student.onboardingStatus || 'Not Onboarded'
    }));

    const headers = Object.keys(studentData[0] || {});
    const csvContent = [
      headers.join(','),
      ...studentData.map(row => 
        headers.map(header => `"${row[header as keyof typeof row]}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${schoolName.replace(/\s+/g, '_')}_Students.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  return { exportStudentList };
}
