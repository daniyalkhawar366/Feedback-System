'use client';

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';

/**
 * LoginForm Component Props
 */
interface LoginFormProps {
  /** Callback when switching to register */
  onSwitchToRegister?: () => void;
  /** Callback on successful login */
  onSuccess?: () => void;
}

/**
 * Login Form Component
 * 
 * A modern, mobile-first login form with glassmorphism effects.
 * Includes email and password fields with validation and error handling.
 * 
 * Features:
 * - Mobile-optimized with large touch targets
 * - Real-time validation
 * - Loading states
 * - Error feedback
 * - Dark mode support
 * 
 * @example
 * ```tsx
 * <LoginForm onSwitchToRegister={() => setView('register')} />
 * ```
 */
export const LoginForm: React.FC<LoginFormProps> = ({ 
  onSwitchToRegister, 
  onSuccess 
}) => {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });

  // Field-specific errors
  const [fieldErrors, setFieldErrors] = useState<{
    identifier?: string;
    password?: string;
  }>({});

  /**
   * Handle form field changes
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field error when user starts typing
    if (fieldErrors[name as keyof typeof fieldErrors]) {
      setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    }
    
    // Clear general error
    if (error) {
      clearError();
    }
  };

  /**
   * Validate form fields
   */
  const validateForm = (): boolean => {
    const errors: typeof fieldErrors = {};

    // Identifier validation (email or username)
    if (!formData.identifier || !formData.identifier.trim()) {
      errors.identifier = 'Email or username is required';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const tokenResponse = await login({
        identifier: formData.identifier,
        password: formData.password,
      });

      // Store token
      localStorage.setItem('token', tokenResponse.access_token);
      
      // Call success callback or redirect
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      // Error is already handled by useAuth hook
      console.error('Login failed:', err);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 sm:px-6">
      {/* Card with Modern Light Design */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8 md:p-10">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 mb-4 shadow-lg shadow-blue-500/30">
            <svg 
              className="w-8 h-8 sm:w-10 sm:h-10 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
              />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
            Welcome Back
          </h1>
          <p className="text-sm sm:text-base text-gray-500">
            Sign in to continue to your account
          </p>
        </div>

        {/* General Error Message */}
        {error && !error.field && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100">
            <div className="flex items-start gap-3">
              <svg 
                className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                  clipRule="evenodd" 
                />
              </svg>
              <p className="text-sm text-red-700 font-medium">
                {error.message}
              </p>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email or Username Field */}
          <Input
            label="Email or Username"
            type="text"
            name="identifier"
            placeholder="you@example.com or username"
            value={formData.identifier}
            onChange={handleChange}
            error={fieldErrors.identifier}
            fullWidth
            required
            autoComplete="username"
            leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          />

          {/* Password Field */}
          <Input
            label="Password"
            type="password"
            name="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            error={fieldErrors.password}
            fullWidth
            required
            autoComplete="current-password"
            leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            }
          />

          {/* Forgot Password Link */}
          <div className="text-right">
            <button
              type="button"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Forgot password?
            </button>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isLoading}
          >
            Sign In
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">
              Don&apos;t have an account?
            </span>
          </div>
        </div>

        {/* Switch to Register */}
        <Button
          type="button"
          variant="outline"
          size="lg"
          fullWidth
          onClick={onSwitchToRegister}
        >
          Create an Account
        </Button>
      </div>

      {/* Footer */}
      <p className="text-center text-xs sm:text-sm text-gray-500 mt-6 sm:mt-8 px-4">
        By signing in, you agree to our{' '}
        <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
          Terms of Service
        </a>
        {' '}and{' '}
        <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
          Privacy Policy
        </a>
      </p>
    </div>
  );
};
