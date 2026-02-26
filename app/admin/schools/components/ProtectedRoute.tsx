"use client";
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading, isTokenLoaded } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated (after loading is complete)
  useEffect(() => {
    if (!isTokenLoaded) return;
    if (!loading && !isAuthenticated) {
      router.push('/admin');
    }
  }, [isAuthenticated, loading, router, isTokenLoaded]);

  if (!isTokenLoaded) return null;

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
