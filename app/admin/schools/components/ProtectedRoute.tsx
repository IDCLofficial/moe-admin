"use client";
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading, isTokenLoaded } = useAuth();
  const router = useRouter();
  const [isValidAdmin, setIsValidAdmin] = useState<boolean | null>(null);

  // Check adminType from localStorage
  useEffect(() => {
    if (!isTokenLoaded) return;
    
    const adminUserStr = localStorage.getItem('admin_user');
    if (adminUserStr) {
      try {
        const adminUser = JSON.parse(adminUserStr);
        if (adminUser.adminType !== 'exam_admin') {
          // Invalid admin type - clear storage and redirect
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_email');
          localStorage.removeItem('admin_user');
          
          Swal.fire({
            title: 'Access Denied',
            text: 'You do not have permission to access this area.',
            icon: 'error'
          }).then(() => {
            router.push('/admin');
          });
          setIsValidAdmin(false);
          return;
        }
        setIsValidAdmin(true);
      } catch (error) {
        console.error('Error parsing admin user:', error);
        setIsValidAdmin(false);
        router.push('/admin');
      }
    } else {
      setIsValidAdmin(false);
    }
  }, [isTokenLoaded, router]);

  // Redirect to login if not authenticated (after loading is complete)
  useEffect(() => {
    if (!isTokenLoaded) return;
    if (!loading && !isAuthenticated) {
      router.push('/admin');
    }
  }, [isAuthenticated, loading, router, isTokenLoaded]);

  if (!isTokenLoaded || isValidAdmin === null) return null;

  // Block access if adminType is invalid
  if (isValidAdmin === false) {
    return null;
  }

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
        <span className="loaderAnimation"></span>
        </div>
      </div>
    );
  }

  // Show loading while redirecting if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Show protected content if authenticated
  return <>{children}</>;
}
