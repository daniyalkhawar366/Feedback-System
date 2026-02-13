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
      <div className="min-h-screen bg-[#f5f5f5]">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              {/* Logo & User Info */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-[13px] font-semibold text-gray-900 tracking-[0.01em] leading-tight">
                    Dashboard
                  </h1>
                  <p className="text-[11px] text-gray-500 font-normal">
                    Welcome back, {speaker?.name}
                  </p>
                </div>
              </div>

              {/* Sign out Button */}
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 text-[13px] text-gray-600 hover:text-gray-900 font-medium transition-colors"
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
              <h2 className="text-[38px] leading-[1.1] tracking-[-0.02em] font-normal mb-1" style={{ fontFamily: "'Instrument Serif', serif" }}>
                Your Events
              </h2>
              <p className="text-[13.5px] text-gray-500 font-normal">
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
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <ClipboardList className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Events Yet
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Create your first event to start collecting feedback from attendees
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-black hover:bg-gray-800 text-white rounded-lg font-medium transition-colors"
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
                className="bg-transparent rounded-xl border-[1.5px] border-dashed border-gray-300 hover:border-gray-900 hover:bg-white transition-all flex flex-col items-center justify-center min-h-[400px] group"
              >
                <div className="w-9 h-9 rounded-[10px] border-[1.5px] border-gray-400 group-hover:bg-gray-900 group-hover:border-gray-900 flex items-center justify-center mb-2.5 transition-all text-gray-400 group-hover:text-white">
                  <Plus className="w-4 h-4" strokeWidth={2.5} />
                </div>
                <span className="text-[13px] text-gray-400 group-hover:text-gray-900 font-medium">New event</span>
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
