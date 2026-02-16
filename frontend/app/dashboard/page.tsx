'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, LogOut, ClipboardList } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import EventCard from '@/components/dashboard/EventCard';
import CreateEventModal from '@/components/dashboard/CreateEventModal';
import { useAuth } from '@/hooks/useAuth';
import api from '@/utils/api';
import type { EventRead } from '@/types/api';

export default function DashboardPage() {
  const { speaker, logout } = useAuth();
  const router = useRouter();

  const [events, setEvents] = useState<EventRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchEvents();
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen" style={{ backgroundColor: '#F9FAFB' }}>
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-blue-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              {/* Logo & User Info */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                  <ClipboardList className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-[15px] font-semibold text-gray-900 tracking-[0.01em] leading-tight">
                    Dashboard
                  </h1>
                  <p className="text-[13px] text-gray-600 font-normal">
                    Welcome back, {speaker?.name}
                  </p>
                </div>
              </div>

              {/* Sign out Button */}
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 text-[14px] text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg font-medium transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          {/* Header Section */}
          <div className="mb-10">
            <div>
              <h2 className="text-[44px] leading-[1.1] tracking-[-0.03em] font-bold mb-2 text-gray-900">
                Your Events
              </h2>
              <p className="text-[16px] text-gray-600 font-medium">
                Manage events and collect audience feedback
              </p>
            </div>
          </div>

          {/* Events Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow-sm p-6 animate-pulse"
                >
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ClipboardList className="w-10 h-10 text-blue-500" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                No Events Yet
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto text-[15px]">
                Create your first event to start collecting feedback from attendees
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
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
                className="transition-all flex flex-col items-center justify-center min-h-[400px] group"
                style={{
                  background: 'transparent',
                  border: '2px dashed #CBD5E1',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#EEF2FF';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#6366F1';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-4px)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.15)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#CBD5E1';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                }}
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all" style={{ background: '#EEF2FF', color: '#6366F1' }}>
                  <Plus className="w-5 h-5" strokeWidth={2.5} />
                </div>
                <span className="text-[15px] font-semibold" style={{ color: '#6366F1', fontWeight: 600 }}>New event</span>
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
    </ProtectedRoute>
  );
}
