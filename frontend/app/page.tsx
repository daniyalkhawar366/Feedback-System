'use client';

import { useState } from 'react';
import { LoginForm } from '@/components/LoginForm';
import { RegisterForm } from '@/components/RegisterForm';

type ViewMode = 'login' | 'register';

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>('login');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleSwitchMode = (mode: ViewMode) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setViewMode(mode);
      setIsTransitioning(false);
    }, 300); // match transition duration
  };

  return (
    <main
      className="relative flex items-center justify-center min-h-screen w-full overflow-hidden bg-white p-4"
    >

      <div
        className={`w-full max-w-md transition-all duration-300 transform z-10 ${isTransitioning ? 'opacity-0 scale-95 translate-y-4' : 'opacity-100 scale-100 translate-y-0'
          }`}
      >
        {viewMode === 'login' ? (
          <LoginForm onSwitchToRegister={() => handleSwitchMode('register')} />
        ) : (
          <RegisterForm onSwitchToLogin={() => handleSwitchMode('login')} />
        )}
      </div>
    </main>
  );
}
