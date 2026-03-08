'use client';

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';

interface LoginFormProps {
  onSwitchToRegister?: () => void;
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSwitchToRegister,
  onSuccess,
}) => {
  const router = useRouter();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<{
    identifier?: string;
    password?: string;
  }>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name as keyof typeof fieldErrors])
      setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    if (error) setError(null);
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
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await login({
        identifier: formData.identifier,
        password: formData.password,
      });
      localStorage.setItem('token', result.access_token);

      // Redirect admin users to monitoring dashboard
      if (result.speaker?.role === 'admin') {
        router.push('/monitoring');
      } else if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response) {
        const detail = err.response.data?.detail;
        setError(typeof detail === 'string' ? detail : 'Invalid email/username or password');
      } else {
        setError('Invalid email/username or password');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    /*
     * Requires in layout/document:
     * https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap
     */
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
      }}
    >
      {/* ── Brand mark ── */}
      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <div
          style={{
            width: 48,
            height: 48,
            background: 'linear-gradient(135deg, #44bea9 0%, #2b8c7c 100%)',
            borderRadius: 12,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
            boxShadow: '0 4px 12px rgba(68, 190, 169, 0.3)',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12c-2.66 0-4-3-4-3s-1.34 3-4 3-4-3-4-3-1.34 3-4 3" />
          </svg>
        </div>
        <div
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: '#111827',
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
          }}
        >
          Ripple
        </div>
      </div>

      {/* ── Card ── */}
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          borderRadius: 20,
          padding: '32px 28px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)',
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
        {error && (
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
            <p style={{ fontSize: 14, color: '#991b1b', fontWeight: 500 }}>{error}</p>
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
              type={showPassword ? 'text' : 'password'}
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
              suffix={
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', color: '#9CA3AF' }}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
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
                fontSize: 13,
                color: '#44bea9',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'color 0.15s',
                textDecoration: 'none',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.color = '#2b8c7c';
                (e.currentTarget as HTMLButtonElement).style.textDecoration = 'underline';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.color = '#44bea9';
                (e.currentTarget as HTMLButtonElement).style.textDecoration = 'none';
              }}
            >
              Forgot password?
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              marginTop: 4,
              width: '100%',
              padding: '12px 24px',
              background: isSubmitting ? '#9CA3AF' : '#44bea9',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s ease',
              boxShadow: isSubmitting ? 'none' : '0 4px 6px -1px rgba(68, 190, 169, 0.4), 0 2px 4px -1px rgba(68, 190, 169, 0.2)',
            }}
            onMouseEnter={e => {
              if (!isSubmitting) {
                (e.currentTarget as HTMLButtonElement).style.background = '#32a893';
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 8px -1px rgba(68, 190, 169, 0.5), 0 4px 6px -1px rgba(68, 190, 169, 0.3)';
              }
            }}
            onMouseLeave={e => {
              if (!isSubmitting) {
                (e.currentTarget as HTMLButtonElement).style.background = '#44bea9';
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 6px -1px rgba(68, 190, 169, 0.4), 0 2px 4px -1px rgba(68, 190, 169, 0.2)';
              }
            }}
            onMouseDown={e => {
              if (!isSubmitting) {
                (e.currentTarget as HTMLButtonElement).style.background = '#2b8c7c';
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(1px)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 2px -1px rgba(68, 190, 169, 0.5)';
              }
            }}
            onMouseUp={e => {
              if (!isSubmitting) {
                (e.currentTarget as HTMLButtonElement).style.background = '#32a893';
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 8px -1px rgba(68, 190, 169, 0.5), 0 4px 6px -1px rgba(68, 190, 169, 0.3)';
              }
            }}
          >
            {isSubmitting ? (
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
  suffix,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon?: React.ReactNode;
  hasError?: boolean;
  suffix?: React.ReactNode;
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
          paddingRight: suffix ? 42 : 14,
          paddingTop: 12,
          paddingBottom: 12,
          background: '#FFFFFF',
          border: hasError ? '2px solid #EF4444' : focused ? '2px solid #44bea9' : '1px solid #D1D5DB',
          borderRadius: 8,
          outline: 'none',
          fontSize: 15,
          color: '#111827',
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 400,
          transition: 'all 0.2s ease',
          boxShadow: focused ? '0 0 0 3px rgba(68, 190, 169, 0.2)' : 'none',
        }}
      />
      {suffix && (
        <span
          style={{
            position: 'absolute',
            right: 10,
            display: 'flex',
            zIndex: 1,
          }}
        >
          {suffix}
        </span>
      )}
    </div>
  );
}