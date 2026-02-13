'use client';

import { useState } from 'react';
import { LoginForm } from '@/components/LoginForm';
import { RegisterForm } from '@/components/RegisterForm';

type ViewMode = 'login' | 'register';

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>('login');

  return (
    <>
      {viewMode === 'login' ? (
        <LoginForm onSwitchToRegister={() => setViewMode('register')} />
      ) : (
        <RegisterForm onSwitchToLogin={() => setViewMode('login')} />
      )}
    </>
  );
}
