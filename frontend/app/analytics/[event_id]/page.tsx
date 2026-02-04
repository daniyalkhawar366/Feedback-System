'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, MessageSquare, Sparkles } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import FeedbacksTab from '@/components/analytics/FeedbacksTab';
import ConsensusTab from '@/components/analytics/ConsensusTab';
import { useAuth } from '@/hooks/useAuth';
import api from '@/utils/api';
import type { EventRead } from '@/types/api';

type TabType = 'consensus' | 'feedbacks';

export default function AnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const { speaker } = useAuth();
  const eventId = Number(params.event_id);

  const [activeTab, setActiveTab] = useState<TabType>('consensus');
  const [event, setEvent] = useState<EventRead | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const eventRes = await api.get<EventRead>(`/events/${eventId}`);
      setEvent(eventRes.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'consensus', label: 'Overview', icon: Sparkles },
    { id: 'feedbacks', label: 'Feedbacks', icon: MessageSquare },
  ] as const;

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300">Loading analytics...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <header className="bg-white/90 border-b border-gray-200 sticky top-0 z-10 backdrop-blur-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <ArrowLeft className="w-6 h-6 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {event?.title || 'Event Analytics'}
                  </h1>
                  <p className="text-sm text-gray-600">
                    {event?.event_date
                      ? new Date(event.event_date).toLocaleDateString()
                      : 'Analyze feedback and insights'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'consensus' && <ConsensusTab eventId={eventId} />}
          {activeTab === 'feedbacks' && <FeedbacksTab eventId={eventId} />}
        </main>
      </div>
    </ProtectedRoute>
  );
}
