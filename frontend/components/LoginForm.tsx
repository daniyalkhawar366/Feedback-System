'use client';

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface LoginFormProps {
  onSwitchToRegister?: () => void;
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSwitchToRegister,
  onSuccess,
}) => {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuth();

  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<{
    identifier?: string;
    password?: string;
  }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name as keyof typeof fieldErrors])
      setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    if (error) clearError();
  };

  const validateForm = (): boolean => {
    const errors: typeof fieldErrors = {};
    if (!formData.identifier?.trim()) errors.identifier = 'Email or username is required';
    if (!formData.password) errors.password = 'Password is required';
    else if (formData.password.length < 6) errors.password = 'Password must be at least 6 characters';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const tokenResponse = await login({
        identifier: formData.identifier,
        password: formData.password,
      });
      localStorage.setItem('token', tokenResponse.access_token);
      if (onSuccess) onSuccess();
      else router.push('/dashboard');
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    /*
     * Requires in layout/document:
     * https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap
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
            Welcome back
          </h1>
          <p style={{ fontSize: 15, color: '#6B7280', fontWeight: 400 }}>
            Sign in to continue to your account
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
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Email / Username */}
          <FieldGroup label="Email or Username" error={fieldErrors.identifier}>
            <FieldInput
              type="text"
              name="identifier"
              placeholder="you@example.com"
              value={formData.identifier}
              onChange={handleChange}
              autoComplete="username"
              hasError={!!fieldErrors.identifier}
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              }
            />
          </FieldGroup>

          {/* Password */}
          <FieldGroup label="Password" error={fieldErrors.password}>
            <FieldInput
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              hasError={!!fieldErrors.password}
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              }
            />
          </FieldGroup>

          {/* Forgot password */}
          <div style={{ textAlign: 'right', marginTop: -8 }}>
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: 14,
                color: '#6366F1',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'color 0.15s',
                textDecoration: 'none',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.color = '#4F46E5';
                (e.currentTarget as HTMLButtonElement).style.textDecoration = 'underline';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.color = '#6366F1';
                (e.currentTarget as HTMLButtonElement).style.textDecoration = 'none';
              }}
            >
              Forgot password?
            </button>
          </div>

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
                Signing in…
              </>
            ) : (
              'Sign In'
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
            Don&apos;t have an account?
          </span>
        </div>

        {/* Create account */}
        <button
          type="button"
          onClick={onSwitchToRegister}
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
          Create an Account
        </button>
      </div>

      {/* Footer */}
      <p style={{ marginTop: 24, fontSize: 12, color: '#9CA3AF', textAlign: 'center', lineHeight: 1.6 }}>
        By signing in, you agree to our{' '}
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