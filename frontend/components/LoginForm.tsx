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
        background: '#f6f5f2',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 16px',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* ── Brand mark ── */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div
          style={{
            width: 36,
            height: 36,
            background: '#1a1917',
            borderRadius: 9,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 14,
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
            fontFamily: "'Instrument Serif', serif",
            fontSize: 26,
            fontWeight: 400,
            color: '#1a1917',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          Intelligent Feedback
        </div>
        <div style={{ fontSize: 12.5, color: '#9e9a93', marginTop: 4, fontWeight: 400 }}>
          Share your voice, shape the future
        </div>
      </div>

      {/* ── Card ── */}
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          background: '#ffffff',
          border: '1px solid #e8e5df',
          borderRadius: 16,
          padding: '32px 32px 28px',
        }}
      >
        {/* Card header */}
        <div style={{ marginBottom: 24 }}>
          <h1
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: 28,
              fontWeight: 400,
              color: '#1a1917',
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              marginBottom: 5,
            }}
          >
            Welcome back
          </h1>
          <p style={{ fontSize: 13.5, color: '#9e9a93', fontWeight: 400 }}>
            Sign in to continue to your account
          </p>
        </div>

        {/* General error */}
        {error && !error.field && (
          <div
            style={{
              marginBottom: 20,
              padding: '11px 14px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
            }}
          >
            <svg width="15" height="15" viewBox="0 0 20 20" fill="#b91c1c" style={{ flexShrink: 0, marginTop: 1 }}>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p style={{ fontSize: 12.5, color: '#991b1b', fontWeight: 500 }}>{error.message}</p>
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
                fontSize: 12.5,
                color: '#9e9a93',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#1a1917')}
              onMouseLeave={e => (e.currentTarget.style.color = '#9e9a93')}
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
              padding: '11px 0',
              background: isLoading ? '#e8e5df' : '#1a1917',
              color: isLoading ? '#9e9a93' : '#ffffff',
              border: 'none',
              borderRadius: 10,
              fontSize: 13.5,
              fontWeight: 500,
              fontFamily: "'DM Sans', sans-serif",
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'background 0.15s',
              letterSpacing: '0.01em',
            }}
            onMouseEnter={e => { if (!isLoading) (e.currentTarget as HTMLButtonElement).style.background = '#333'; }}
            onMouseLeave={e => { if (!isLoading) (e.currentTarget as HTMLButtonElement).style.background = '#1a1917'; }}
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
          <div style={{ height: 1, background: '#f0ede8' }} />
          <span
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: '#ffffff',
              padding: '0 12px',
              fontSize: 11.5,
              color: '#9e9a93',
              fontWeight: 500,
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
            padding: '10px 0',
            background: 'transparent',
            color: '#6b6760',
            border: '1px solid #e8e5df',
            borderRadius: 10,
            fontSize: 13.5,
            fontWeight: 500,
            fontFamily: "'DM Sans', sans-serif",
            cursor: 'pointer',
            transition: 'all 0.15s',
            letterSpacing: '0.01em',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#1a1917';
            (e.currentTarget as HTMLButtonElement).style.color = '#1a1917';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#e8e5df';
            (e.currentTarget as HTMLButtonElement).style.color = '#6b6760';
          }}
        >
          Create an Account
        </button>
      </div>

      {/* Footer */}
      <p style={{ marginTop: 20, fontSize: 12, color: '#9e9a93', textAlign: 'center', lineHeight: 1.6 }}>
        By signing in, you agree to our{' '}
        <a href="#" style={{ color: '#1a1917', fontWeight: 500, textDecoration: 'underline', textUnderlineOffset: 2 }}>
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="#" style={{ color: '#1a1917', fontWeight: 500, textDecoration: 'underline', textUnderlineOffset: 2 }}>
          Privacy Policy
        </a>
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
          fontSize: 11.5,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          color: '#9e9a93',
          marginBottom: 7,
        }}
      >
        {label}
      </label>
      {children}
      {error && (
        <p style={{ marginTop: 5, fontSize: 12, color: '#b91c1c', fontWeight: 400 }}>
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
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 13px',
        background: '#fafaf8',
        border: `1px solid ${hasError ? '#fca5a5' : focused ? '#1a1917' : '#e8e5df'}`,
        borderRadius: 10,
        transition: 'border-color 0.15s',
      }}
    >
      {icon && (
        <span
          style={{
            color: focused ? '#1a1917' : '#9e9a93',
            flexShrink: 0,
            transition: 'color 0.15s',
            display: 'flex',
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
          flex: 1,
          padding: '11px 0',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          fontSize: 13.5,
          color: '#1a1917',
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 400,
        }}
      />
    </div>
  );
}