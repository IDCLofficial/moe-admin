"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAdminLoginMutation } from '@/app/admin/schools/store/api/schoolsApi';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, password: string) => void;
  logout: () => void;
  token: string | null;
  loading: boolean;
  isTokenLoaded: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isTokenLoaded, setIsTokenLoaded] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  const [adminLogin] = useAdminLoginMutation()

  useEffect(() => {
    setLoading(true);
    // Check if user is already logged in (from localStorage)
    const token = localStorage.getItem('admin_token') || "n/a";
    if (token) {
      setToken(token);
    }
    setLoading(false);
  }, []);

  useEffect(()=>{
    if (token === null) return;
    if (token !== "n/a") {
      setIsTokenLoaded(true);
      setIsAuthenticated(true);
      return;
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      // Use the adminLogin function from schoolService
      const success = await adminLogin({
        email, password
      });

      if (!success.error) {
        // Set token and auth state BEFORE showing success message and navigating
        const accessToken = success.data.accessToken;
        localStorage.setItem('admin_token', accessToken);
        localStorage.setItem('admin_email', email);
        localStorage.setItem('admin_user', JSON.stringify(success.data.admin));
        
        // Update state synchronously
        setToken(accessToken);
        setIsAuthenticated(true);
        setIsTokenLoaded(true);
        
        Swal.fire({
          title: 'Success!', 
          text: 'Login successful!',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
        
        // Small delay to ensure state updates propagate
        setTimeout(() => {
          setLoading(false);
          router.push('/admin/schools');
        }, 100);
      } else {
        throw new Error('Login failed - no token received');
      }
    } catch (error) {
      Swal.fire({
        title: 'Error!',
        text: 'Invalid credentials. Please try again.',
        icon: 'error'
      });
      console.error('Login error:', error);

      // Handle specific error messages
      if (error instanceof Error) {
        if (error.message === 'Failed to login') {
          console.error('Invalid credentials or server error');
        } else {
          console.error('Unexpected error:', error.message);
        }
      }

      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_email');
    localStorage.removeItem('admin_user');
    setIsAuthenticated(false);
    setToken(null);
    router.replace('/');
    setIsTokenLoaded(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, loading, token, isTokenLoaded }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}