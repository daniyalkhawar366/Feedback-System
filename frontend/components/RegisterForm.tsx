'use client';

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';

interface RegisterFormProps {
  onSwitchToLogin?: () => void;
  onSuccess?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSwitchToLogin,
  onSuccess,
}) => {
  const router = useRouter();
  const { register, login, isLoading, error, clearError } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const getPasswordStrength = (password: string): {
    strength: number;
    label: string;
  } => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    return {
      strength: Math.min(strength, 5),
      label: labels[Math.min(strength, 4)] || 'Weak',
    };
  };

  const passwordStrength = formData.password
    ? getPasswordStrength(formData.password)
    : null;

  // Strength bar: 5 segments, fills from left using blue gradient
  const strengthColors = [
    '#e5e7eb', // 0 – empty
    '#ef4444', // 1 – weak (red)
    '#f59e0b', // 2 – fair (amber)
    '#3b82f6', // 3 – good (blue)
    '#10b981', // 4 – strong (green)
    '#059669', // 5 – very strong (dark green)
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name as keyof typeof fieldErrors]) {
      setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    }
    if (error) clearError();
  };

  const validateForm = (): boolean => {
    const errors: typeof fieldErrors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    else if (formData.name.trim().length < 2) errors.name = 'Name must be at least 2 characters';

    if (!formData.email) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errors.email = 'Please enter a valid email address';

    if (!formData.password) errors.password = 'Password is required';
    else if (formData.password.length < 8)
      errors.password = 'Password must be at least 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])/.test(formData.password))
      errors.password = 'Password must contain uppercase and lowercase letters';
    else if (!/(?=.*\d)/.test(formData.password))
      errors.password = 'Password must contain at least one number';

    if (!formData.confirmPassword) errors.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword)
      errors.confirmPassword = 'Passwords do not match';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      await register({
        name: formData.name.trim(),
        email: formData.email,
        password: formData.password,
      });
      await login({ identifier: formData.email, password: formData.password });
      if (onSuccess) onSuccess();
      else router.push('/dashboard');
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  return (
    /*
     * Page shell — warm gradient background, full viewport, centered
     * Fonts: Plus Jakarta Sans (display) + Inter (UI)
     * Import both in your layout or _document:
     *   https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap
     */
    <div
      style={{
        minHeight: '100vh',
        background: '#F9FAFB',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 16px',
      }}
    >
      {/* ── Brand mark ── */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div
          style={{
            width: 40,
            height: 40,
            background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
            borderRadius: 10,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
          }}
        >
          {/* calendar icon */}
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: '#111827',
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
          }}
        >
          Intelligent Feedback
        </div>
        <div style={{ fontSize: 15, color: '#6B7280', marginTop: 6, fontWeight: 400 }}>
          Share your voice, shape the future
        </div>
      </div>

      {/* ── Card ── */}
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: 16,
          padding: '40px 32px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* Card header */}
        <div style={{ marginBottom: 24 }}>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: '#111827',
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              marginBottom: 8,
            }}
          >
            Create account
          </h1>
          <p style={{ fontSize: 15, color: '#6B7280', fontWeight: 400 }}>
            Join as a speaker and share your voice
          </p>
        </div>

        {/* General error */}
        {error && !error.field && (
          <div
            style={{
              marginBottom: 20,
              padding: '12px 16px',
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="#dc2626" style={{ flexShrink: 0, marginTop: 1 }}>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p style={{ fontSize: 14, color: '#991b1b', fontWeight: 500 }}>{error.message}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Full Name */}
          <FieldGroup label="Full Name" error={fieldErrors.name}>
            <FieldInput
              type="text"
              name="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              autoComplete="name"
              hasError={!!fieldErrors.name}
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              }
            />
          </FieldGroup>

          {/* Email */}
          <FieldGroup label="Email Address" error={fieldErrors.email}>
            <FieldInput
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              hasError={!!fieldErrors.email}
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              }
            />
          </FieldGroup>

          {/* Password */}
          <FieldGroup label="Password" error={fieldErrors.password}>
            <FieldInput
              type="password"
              name="password"
              placeholder="Min. 8 characters"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              hasError={!!fieldErrors.password}
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              }
            />
            {/* Strength meter */}
            {formData.password && passwordStrength && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: 3,
                        borderRadius: 99,
                        background: i <= passwordStrength.strength
                          ? strengthColors[passwordStrength.strength]
                          : '#E5E7EB',
                        transition: 'background 0.25s',
                      }}
                    />
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>
                    {passwordStrength.label}
                  </span>
                </div>
              </div>
            )}
          </FieldGroup>

          {/* Confirm Password */}
          <FieldGroup label="Confirm Password" error={fieldErrors.confirmPassword}>
            <FieldInput
              type="password"
              name="confirmPassword"
              placeholder="Repeat your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              hasError={!!fieldErrors.confirmPassword}
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              }
            />
          </FieldGroup>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: 4,
              width: '100%',
              padding: '12px 24px',
              background: isLoading ? '#9CA3AF' : '#6366F1',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s ease',
              boxShadow: isLoading ? 'none' : '0 1px 2px rgba(0, 0, 0, 0.05)',
            }}
            onMouseEnter={e => {
              if (!isLoading) {
                (e.currentTarget as HTMLButtonElement).style.background = '#4F46E5';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
              }
            }}
            onMouseLeave={e => {
              if (!isLoading) {
                (e.currentTarget as HTMLButtonElement).style.background = '#6366F1';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
              }
            }}
            onMouseDown={e => {
              if (!isLoading) (e.currentTarget as HTMLButtonElement).style.background = '#4338CA';
            }}
            onMouseUp={e => {
              if (!isLoading) (e.currentTarget as HTMLButtonElement).style.background = '#4F46E5';
            }}
          >
            {isLoading ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Creating account…
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Divider */}
        <div style={{ position: 'relative', margin: '24px 0' }}>
          <div style={{ height: 1, background: '#E5E7EB' }} />
          <span
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: '#FFFFFF',
              padding: '0 12px',
              fontSize: 14,
              color: '#9CA3AF',
              fontWeight: 400,
              whiteSpace: 'nowrap',
            }}
          >
            Already have an account?
          </span>
        </div>

        {/* Sign in button */}
        <button
          type="button"
          onClick={onSwitchToLogin}
          style={{
            width: '100%',
            padding: '12px 24px',
            background: '#FFFFFF',
            color: '#374151',
            border: '1px solid #D1D5DB',
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#9CA3AF';
            (e.currentTarget as HTMLButtonElement).style.background = '#F9FAFB';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#D1D5DB';
            (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF';
          }}
        >
          Sign In
        </button>
      </div>

      {/* Footer */}
      <p style={{ marginTop: 24, fontSize: 12, color: '#9CA3AF', textAlign: 'center', lineHeight: 1.6 }}>
        By creating an account, you agree to our{' '}
        <a href="#" style={{ color: '#6366F1', fontWeight: 500, textDecoration: 'underline' }}>
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="#" style={{ color: '#6366F1', fontWeight: 500, textDecoration: 'underline' }}>
          Privacy Policy
        </a>
      </p>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #9CA3AF; }
      `}</style>
    </div>
  );
};

// ── Internal sub-components ──────────────────────────────────────────────────

function FieldGroup({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: 12,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: '#6B7280',
          marginBottom: 8,
        }}
      >
        {label}
      </label>
      {children}
      {error && (
        <p style={{ marginTop: 5, fontSize: 12, color: '#EF4444', fontWeight: 400 }}>
          {error}
        </p>
      )}
    </div>
  );
}

function FieldInput({
  icon,
  hasError,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon?: React.ReactNode;
  hasError?: boolean;
}) {
  const [focused, setFocused] = React.useState(false);

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {icon && (
        <span
          style={{
            position: 'absolute',
            left: 12,
            color: '#9CA3AF',
            flexShrink: 0,
            display: 'flex',
            zIndex: 1,
          }}
        >
          {icon}
        </span>
      )}
      <input
        {...props}
        onFocus={e => { setFocused(true); props.onFocus?.(e); }}
        onBlur={e => { setFocused(false); props.onBlur?.(e); }}
        style={{
          width: '100%',
          paddingLeft: icon ? 40 : 14,
          paddingRight: 14,
          paddingTop: 12,
          paddingBottom: 12,
          background: '#FFFFFF',
          border: hasError ? '2px solid #EF4444' : focused ? '2px solid #6366F1' : '1px solid #D1D5DB',
          borderRadius: 8,
          outline: 'none',
          fontSize: 15,
          color: '#111827',
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 400,
          transition: 'all 0.2s ease',
          boxShadow: focused ? '0 0 0 3px rgba(99, 102, 241, 0.1)' : 'none',
        }}
      />
    </div>
  );
}