'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, MessageSquare, BarChart3, FileText, Lightbulb } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import OverviewTab from '@/components/analytics/OverviewTab';
import SummaryTab from '@/components/analytics/SummaryTab';
import InsightsTab from '@/components/analytics/InsightsTab';
import FeedbacksTab from '@/components/analytics/FeedbacksTab';
import { useAuth } from '@/hooks/useAuth';
import api from '@/utils/api';
import type { EventRead, EventStats } from '@/types/api';

type TabType = 'overview' | 'summary' | 'insights' | 'feedbacks';

export default function AnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const { speaker } = useAuth();
  const eventId = Number(params.event_id);

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [event, setEvent] = useState<EventRead | null>(null);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eventRes, statsRes] = await Promise.all([
        api.get<EventRead>(`/events/${eventId}`),
        api.get<EventStats>(`/analytics/events/${eventId}/stats`),
      ]);
      setEvent(eventRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'summary', label: 'Summary', icon: FileText },
    { id: 'insights', label: 'Insights', icon: Lightbulb },
    { id: 'feedbacks', label: 'Feedbacks', icon: MessageSquare },
  ] as const;

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-[#f6f5f2] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-[#1a1917] mx-auto mb-4" style={{ animation: 'spin 1s linear infinite' }} />
            <p className="text-[#6b6760] font-medium">Loading analytics...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#f6f5f2]">
        {/* Header */}
        <header className="bg-white border-b border-[#e8e5df] sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="p-2 hover:bg-[#fafaf8] rounded-xl transition-colors"
                >
                  <ArrowLeft className="w-6 h-6 text-[#1a1917]" />
                </button>
                <div>
                  <h1
                    className="text-xl font-medium text-[#1a1917]"
                    style={{ fontFamily: "'Instrument Serif', serif", letterSpacing: '-0.01em' }}
                  >
                    {event?.title || 'Event Analytics'}
                  </h1>
                  <div className="flex items-center gap-3 text-sm text-[#6b6760]">
                    {event?.event_date && (
                      <span>
                        {new Date(event.event_date).toLocaleDateString()}
                      </span>
                    )}
                    {event?.feedback_open_at && event?.feedback_close_at && (
                      <>
                        <span className="text-[#9e9a93]">•</span>
                        <span className="flex items-center gap-1">
                          Feedback: {new Date(event.feedback_open_at).toLocaleString('en-US', { 
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                          })} - {new Date(event.feedback_close_at).toLocaleString('en-US', { 
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                          })}
                        </span>
                        <span className="text-gray-400">•</span>
                        {(() => {
                          const now = new Date();
                          const openAt = new Date(event.feedback_open_at);
                          const closeAt = new Date(event.feedback_close_at);
                          
                          if (now < openAt) {
                            return (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                                Upcoming
                              </span>
                            );
                          } else if (now >= openAt && now <= closeAt) {
                            return (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                                Open
                              </span>
                            );
                          } else {
                            return (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                                Closed
                              </span>
                            );
                          }
                        })()}
                      </>
                    )}
                    {!event?.feedback_open_at && !event?.feedback_close_at && (
                      <span>Analyze feedback and insights</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="bg-white border-b border-[#e8e5df]">
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
                        ? 'border-[#1a1917] text-[#1a1917]'
                        : 'border-transparent text-[#6b6760] hover:text-[#1a1917]'
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
          {activeTab === 'overview' && stats && <OverviewTab eventId={eventId} stats={stats} />}
          {activeTab === 'summary' && <SummaryTab eventId={eventId} />}
          {activeTab === 'insights' && <InsightsTab eventId={eventId} />}
          {activeTab === 'feedbacks' && <FeedbacksTab eventId={eventId} />}
        </main>
      </div>
    </ProtectedRoute>
  );
}
