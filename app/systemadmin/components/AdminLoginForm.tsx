"use client";
import { useState } from "react";
import Image from "next/image";
import { useAuth } from '@/contexts/AuthContext';
import Swal from 'sweetalert2';
import { FaBookOpen, FaPencilAlt, FaUniversity } from "react-icons/fa";

export default function AdminLoginForm() {
  const { loginSystemAdmin, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      Swal.fire({
        title: 'Error!',
        text: 'Please fill in all fields.',
        icon: 'error'
      });
      return;
    }
    loginSystemAdmin(formData.email, formData.password);
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT SIDE */}
      <div className="hidden lg:flex w-1/2 bg-linear-to-br from-green-500 via-green-600 to-green-700 relative overflow-hidden items-center justify-center text-white">
        {/* Multiple Flowing Wave Layers */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Flowing Particles */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full opacity-40 animate-float" style={{ animationDelay: '0s' }}></div>
            <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-white rounded-full opacity-30 animate-float" style={{ animationDelay: '1s' }}></div>
            <div className="absolute bottom-2/3 left-1/3 w-3 h-3 bg-white rounded-full opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
            <div className="absolute top-2/3 right-1/4 w-1.5 h-1.5 bg-white rounded-full opacity-35 animate-float" style={{ animationDelay: '3s' }}></div>
            <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-white rounded-full opacity-40 animate-float" style={{ animationDelay: '0s' }}></div>
            <div className="absolute top-1/4 right-1/3 w-1 h-1 bg-white rounded-full opacity-30 animate-float" style={{ animationDelay: '1s' }}></div>
            <div className="absolute bottom-1/2 left-1/3 w-3 h-3 bg-white rounded-full opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
            <div className="absolute top-2/3 right-1/4 w-1.5 h-1.5 bg-white rounded-full opacity-35 animate-float" style={{ animationDelay: '3s' }}></div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center px-6 text-center animate-fadeIn">
          <Image
            src="/images/IMSG-Logo.svg"
            alt="Nigeria Coat of Arms"
            width={96}
            height={96}
            className="w-24 h-24 mb-6"
          />
          <h1
            className="text-xl md:text-2xl font-extrabold tracking-wide text-white drop-shadow-lg leading-snug text-center animate-fadeIn-y"
            style={{
              animationDelay: '1s',
              textShadow: '0 2px 8px rgba(0,0,0,0.4)',
              letterSpacing: '0.5px',
            }}
          >
            Imo State Ministry of <br />
            <span>
              Primary and Secondary Education
            </span>
          </h1>

          <p className="mt-4 text-sm opacity-80 max-w-sm animate-fadeIn-y" style={{ animationDelay: '1.5s' }}>
            Empowering Education Through Digital Transformation
          </p>

        </div>
        {/* Subtle faded icons at bottom */}
        <div className="absolute bottom-5 flex gap-6 opacity-20 text-white">
          <FaBookOpen size={30} className="animate-pulse" style={{ animationDelay: '0s' }} />
          <FaUniversity size={30} className="animate-pulse" style={{ animationDelay: '1s' }} />
          <FaPencilAlt size={30} className="animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-linear-to-br from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 shadow-lg rounded-2xl p-8 bg-white">
          <div>
            <h2 className="mt-2 text-center text-2xl font-bold text-gray-900">
              Admin Login
            </h2>
            <p className="mt-1 text-center text-sm text-gray-600">
              Sign in to access your dashboard
            </p>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-700 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  <>
                    <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                      <svg className="h-5 w-5 text-green-500 group-hover:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                    </span>
                    Sign in
                  </>
                )}
              </button>
            </div>

          </form>
          {/* Footer */}
          <div className="border-t border-gray-200 text-center py-3 text-xs text-gray-500">
            Copyright © {new Date().getFullYear()} Imo State Ministry of Primary and Secondary Education. All rights reserved. Powered by{' '}
            <a
              href="http://imodigitalcity.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:underline"
            >
              Imo Digital City
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
