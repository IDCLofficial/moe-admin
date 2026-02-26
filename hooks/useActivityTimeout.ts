import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Swal from 'sweetalert2';

interface UseActivityTimeoutProps {
  timeoutMinutes?: number;
  warningMinutes?: number;
  redirectPath?: string;
}

export function useActivityTimeout({
  timeoutMinutes = 5,
  warningMinutes = 1,
  redirectPath = '/admin'
}: UseActivityTimeoutProps = {}) {
  const router = useRouter();
  const { logout, isAuthenticated } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningShownRef = useRef(false);

  const timeoutMs = timeoutMinutes * 60 * 1000; // Convert minutes to milliseconds
  const warningMs = (timeoutMinutes - warningMinutes) * 60 * 1000;

  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
    warningShownRef.current = false;
  }, []);

  const handleLogout = useCallback(async () => {
    clearTimeouts();
    await logout();
    
    Swal.fire({
      title: 'Session Expired',
      text: 'You have been logged out due to inactivity.',
      icon: 'warning',
      confirmButtonText: 'OK',
      allowOutsideClick: false,
      allowEscapeKey: false
    }).then(() => {
      router.push(redirectPath);
    });
  }, [logout, router, redirectPath, clearTimeouts]);

  const showWarning = useCallback(() => {
    if (warningShownRef.current) return;
    warningShownRef.current = true;

    Swal.fire({
      title: 'Session Warning',
      text: `Your session will expire in ${warningMinutes} minute${warningMinutes > 1 ? 's' : ''} due to inactivity. Click "Stay Logged In" to continue.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Stay Logged In',
      cancelButtonText: 'Logout Now',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      allowOutsideClick: false,
      allowEscapeKey: false
    }).then((result) => {
      if (result.isConfirmed) {
        // User chose to stay logged in - reset the timer
        warningShownRef.current = false;
        resetTimer();
      } else {
        // User chose to logout or dismissed - logout immediately
        handleLogout();
      }
    });
  }, [warningMinutes, handleLogout]);

  const resetTimer = useCallback(() => {
    if (!isAuthenticated) return;

    clearTimeouts();

    // Set warning timer
    warningTimeoutRef.current = setTimeout(() => {
      showWarning();
    }, warningMs);

    // Set logout timer
    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, timeoutMs);
  }, [isAuthenticated, warningMs, timeoutMs, showWarning, handleLogout, clearTimeouts]);

  const handleActivity = useCallback(() => {
    if (!isAuthenticated) return;
    
    // Only reset if no warning is currently shown
    if (!warningShownRef.current) {
      resetTimer();
    }
  }, [isAuthenticated, resetTimer]);

  useEffect(() => {
    if (!isAuthenticated) {
      clearTimeouts();
      return;
    }

    // List of events that constitute user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Start the initial timer
    resetTimer();

    // Cleanup function
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      clearTimeouts();
    };
  }, [isAuthenticated, handleActivity, resetTimer, clearTimeouts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeouts();
    };
  }, [clearTimeouts]);

  return {
    resetTimer,
    clearTimeouts
  };
}
