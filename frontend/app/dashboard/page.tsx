'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, LogOut, ClipboardList, Users, Settings } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { BrandLogo } from '@/components/BrandLogo';
import EventCard from '@/components/dashboard/EventCard';
import CreateEventModal from '@/components/dashboard/CreateEventModal';
import ThemeToggle from '@/components/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import api from '@/utils/api';
import type { EventRead } from '@/types/api';

export default function DashboardPage() {
  const { speaker, logout } = useAuth();
  const router = useRouter();

  const [events, setEvents] = useState<EventRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Parallax state
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    fetchEvents();

    // Ambient parallax effect tracking
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 40,
        y: (e.clientY / window.innerHeight - 0.5) * 40,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get<EventRead[]>('/events/');
      setEvents(response.data);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventCreated = () => {
    fetchEvents();
    setShowCreateModal(false);
  };

  const activeEventsCount = events.filter(e => {
    if (!e.is_active) return false;
    if (!e.feedback_open_at || !e.feedback_close_at) return false;

    const now = new Date();
    const openAt = new Date(e.feedback_open_at);
    const closeAt = new Date(e.feedback_close_at);

    return now >= openAt && now <= closeAt;
  }).length;

  return (
    <ProtectedRoute>
      <div className="relative min-h-screen bg-bg text-fg overflow-x-hidden selection:bg-accent-glow">

        {/* Ambient Effects */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="bg-noise" />
          <div
            className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-accent/5 blur-[120px] transition-transform duration-1000 ease-out"
            style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }}
          />
          <div
            className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-accent-light/10 blur-[150px] transition-transform duration-1000 ease-out"
            style={{ transform: `translate(${-mousePos.x * 1.5}px, ${-mousePos.y * 1.5}px)` }}
          />
        </div>

        <div className="relative z-10">
          {/* Header */}
          <header className="sticky top-0 z-40 glass-panel animate-fade-up stagger-1">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                {/* Logo & User Info */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center p-0.5 rounded-lg bg-white/5 drop-shadow">
                    <BrandLogo size={32} showText={false} />
                  </div>
                  <div>
                    <h1 className="text-[15px] font-semibold tracking-wide leading-tight">
                      Dashboard
                    </h1>
                    <p className="text-[13px] text-fg-secondary">
                      {speaker?.name}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4">
                  <ThemeToggle />

                  <div className="w-px h-6 bg-glass-border" />

                  {speaker?.role === 'admin' && (
                    <button
                      onClick={() => router.push('/monitoring')}
                      className="p-2 text-fg-secondary hover:text-accent hover:bg-hover-overlay rounded-lg transition-colors"
                      title="Monitoring"
                    >
                      <Settings className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={logout}
                    className="p-2 text-fg-secondary hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                    title="Sign out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
            {/* Header Section */}
            <div className="mb-10 animate-fade-up stagger-2">
              <h2 className="text-[40px] leading-[1.1] tracking-[-0.03em] font-bold mb-3">
                Your Events
              </h2>

              <div className="flex flex-wrap items-center gap-3 mt-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-card-bg border border-card-border rounded-full text-[13px] font-medium text-fg shadow-sm">
                  <ClipboardList className="w-4 h-4 text-fg-secondary" />
                  <span>{events.length} Total</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-card-bg border border-card-border rounded-full text-[13px] font-medium text-fg shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span>{activeEventsCount} Active</span>
                </div>
              </div>
            </div>

            {/* Events Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-card-bg border border-card-border rounded-[16px] shadow-sm p-6 animate-pulse"
                  >
                    <div className="h-6 bg-bg-secondary rounded-md w-3/4 mb-4"></div>
                    <div className="h-4 bg-bg-secondary rounded-sm w-full mb-2.5"></div>
                    <div className="h-4 bg-bg-secondary rounded-sm w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="bg-card-bg rounded-[16px] shadow-sm border border-card-border p-12 text-center animate-fade-up">
                <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ClipboardList className="w-10 h-10 text-accent" />
                </div>
                <h3 className="text-[22px] font-semibold text-fg mb-2 tracking-tight">
                  No Events Yet
                </h3>
                <p className="text-fg-secondary mb-8 max-w-md mx-auto text-[15px] leading-relaxed">
                  Create your first event to start collecting feedback from attendees.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-fg text-bg hover:opacity-90 active:scale-[0.98] rounded-xl font-semibold transition-all shadow-md"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Event
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onUpdate={fetchEvents}
                  />
                ))}

                {/* New Event Placeholder */}
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="group relative flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-card-border rounded-[14px] bg-card-bg/50 hover:bg-card-hover transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-accent/0 group-hover:bg-accent/5 transition-colors duration-500" />

                  {/* Pulse Glow Ring Component */}
                  <div className="relative w-14 h-14 mb-4 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border border-accent/30 scale-90 opacity-0 group-hover:opacity-100 group-hover:animate-[pulse-ring_1.5s_cubic-bezier(0.2,0,0,1)_infinite]" />
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent shadow-sm">
                      <Plus className="w-6 h-6 transition-transform duration-500 group-hover:rotate-90 stroke-[2.5px]" />
                    </div>
                  </div>

                  <span className="text-[15px] font-semibold text-fg tracking-wide z-10 group-hover:text-accent transition-colors duration-300">
                    New Event
                  </span>

                  {/* Micro shimmer effect on hover */}
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent group-hover:animate-[shimmer_1.5s_ease-in-out_infinite]" />
                </button>
              </div>
            )}
          </main>

          {/* Create Event Modal */}
          <CreateEventModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleEventCreated}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}
