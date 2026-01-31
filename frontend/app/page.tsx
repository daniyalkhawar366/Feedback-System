'use client';

import { useState } from 'react';
import { LoginForm } from '@/components/LoginForm';
import { RegisterForm } from '@/components/RegisterForm';

type ViewMode = 'login' | 'register';

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>('login');

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 sm:py-12 px-4">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-purple-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl">
        {/* Logo/Branding */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold bg-gradient-to-r from-blue-600 via-cyan-500 to-purple-600 bg-clip-text text-transparent mb-2 px-4">
            Intelligent Feedback System
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 px-4">
            Share your voice, shape the future
          </p>
        </div>

        {/* Form Container with Animation */}
        <div className="transition-all duration-500 ease-in-out">
          {viewMode === 'login' ? (
            <LoginForm onSwitchToRegister={() => setViewMode('register')} />
          ) : (
            <RegisterForm onSwitchToLogin={() => setViewMode('login')} />
          )}
        </div>
      </div>
    </main>
  );
}
