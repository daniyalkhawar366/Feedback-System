'use client';

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';

/**
 * RegisterForm Component Props
 */
interface RegisterFormProps {
  /** Callback when switching to login */
  onSwitchToLogin?: () => void;
  /** Callback on successful registration */
  onSuccess?: () => void;
}

/**
 * Register Form Component
 * 
 * A modern, mobile-first registration form with comprehensive validation.
 * Includes name, email, password, and password confirmation fields.
 * 
 * Features:
 * - Mobile-optimized with large touch targets
 * - Real-time validation
 * - Password strength indicator
 * - Loading states
 * - Error feedback
 * - Dark mode support
 * - Auto-login after registration
 * 
 * @example
 * ```tsx
 * <RegisterForm onSwitchToLogin={() => setView('login')} />
 * ```
 */
export const RegisterForm: React.FC<RegisterFormProps> = ({ 
  onSwitchToLogin, 
  onSuccess 
}) => {
  const router = useRouter();
  const { register, login, isLoading, error, clearError } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Field-specific errors
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  /**
   * Calculate password strength
   */
  const getPasswordStrength = (password: string): { 
    strength: number; 
    label: string; 
    color: string 
  } => {
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    const colors = [
      'bg-red-500',
      'bg-orange-500',
      'bg-yellow-500',
      'bg-blue-500',
      'bg-green-500'
    ];

    return {
      strength: Math.min(strength, 5),
      label: labels[Math.min(strength, 4)] || 'Weak',
      color: colors[Math.min(strength, 4)] || 'bg-red-500'
    };
  };

  const passwordStrength = formData.password ? getPasswordStrength(formData.password) : null;

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

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])/.test(formData.password)) {
      errors.password = 'Password must contain uppercase and lowercase letters';
    } else if (!/(?=.*\d)/.test(formData.password)) {
      errors.password = 'Password must contain at least one number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
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
      await register({
        name: formData.name.trim(),
        email: formData.email,
        password: formData.password,
      });

      // Auto-login after registration
      await login({
        identifier: formData.email,
        password: formData.password,
      });
      
      // Call success callback or redirect
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      // Error is already handled by useAuth hook
      console.error('Registration failed:', err);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 sm:px-6">
      {/* Card with Modern Light Design */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8 md:p-10">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-400 mb-4 shadow-lg shadow-purple-500/30">
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
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" 
              />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
            Create Account
          </h1>
          <p className="text-sm sm:text-base text-gray-500">
            Join us as a speaker and share your voice
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

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name Field */}
          <Input
            label="Full Name"
            type="text"
            name="name"
            placeholder="John Doe"
            value={formData.name}
            onChange={handleChange}
            error={fieldErrors.name}
            fullWidth
            required
            autoComplete="name"
            leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          />

          {/* Email Field */}
          <Input
            label="Email Address"
            type="email"
            name="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            error={fieldErrors.email}
            fullWidth
            required
            autoComplete="email"
            leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
          />

          {/* Password Field */}
          <div>
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
              autoComplete="new-password"
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
            />
            
            {/* Password Strength Indicator */}
            {formData.password && passwordStrength && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-600">
                    Password Strength:
                  </span>
                  <span className="text-xs font-semibold text-gray-700">
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${passwordStrength.color} transition-all duration-300`}
                    style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <Input
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={fieldErrors.confirmPassword}
            fullWidth
            required
            autoComplete="new-password"
            leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />

          {/* Submit Button */}
          <Button
            type="submit"
            variant="secondary"
            size="lg"
            fullWidth
            isLoading={isLoading}
          >
            Create Account
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">
              Already have an account?
            </span>
          </div>
        </div>

        {/* Switch to Login */}
        <Button
          type="button"
          variant="outline"
          size="lg"
          fullWidth
          onClick={onSwitchToLogin}
        >
          Sign In
        </Button>
      </div>

      {/* Footer */}
      <p className="text-center text-xs sm:text-sm text-gray-500 mt-6 sm:mt-8 px-4">
        By creating an account, you agree to our{' '}
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
