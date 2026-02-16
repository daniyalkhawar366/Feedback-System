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
import type { EventRead } from '@/types/api';

type TabType = 'overview' | 'summary' | 'insights' | 'feedbacks';

export default function AnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const { speaker } = useAuth();
  const eventId = params.event_id as string;

  const [activeTab, setActiveTab] = useState<TabType>('overview');
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
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'summary', label: 'Summary', icon: FileText },
    { id: 'insights', label: 'Insights', icon: Lightbulb },
    { id: 'feedbacks', label: 'Feedbacks', icon: MessageSquare },
  ] as const;

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-4" style={{ animation: 'spin 1s linear infinite' }} />
            <p className="text-gray-600 font-semibold text-base">Loading analytics...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="p-2 hover:bg-blue-50 rounded-xl transition-all hover:scale-105"
                >
                  <ArrowLeft className="w-6 h-6 text-gray-700" />
                </button>
                <div>
                  <h1
                    className="text-2xl font-bold text-gray-900"
                    style={{ letterSpacing: '-0.02em' }}
                  >
                    {event?.title || 'Event Analytics'}
                  </h1>
                  <div className="flex items-center gap-3 text-[15px] text-gray-600">
                    {event?.event_date && (
                      <span>
                        {new Date(event.event_date).toLocaleDateString()}
                      </span>
                    )}
                    {event?.feedback_open_at && event?.feedback_close_at && (
                      <>
                        <span className="text-gray-400">•</span>
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
                              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[13px] font-semibold rounded-full shadow-sm">
                                Upcoming
                              </span>
                            );
                          } else if (now >= openAt && now <= closeAt) {
                            return (
                              <span className="px-2.5 py-1 bg-green-50 text-green-700 text-[13px] font-semibold rounded-full shadow-sm">
                                Open
                              </span>
                            );
                          } else {
                            return (
                              <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-[13px] font-semibold rounded-full shadow-sm">
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
        <div className="bg-white/80 backdrop-blur-md border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all border-b-2 whitespace-nowrap text-[15px] ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                        : 'border-transparent text-gray-600 hover:text-blue-600 hover:bg-gray-50'
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
          {activeTab === 'overview' && <OverviewTab eventId={eventId} />}
          {activeTab === 'summary' && <SummaryTab eventId={eventId} />}
          {activeTab === 'insights' && <InsightsTab eventId={eventId} />}
          {activeTab === 'feedbacks' && <FeedbacksTab eventId={eventId} />}
        </main>
      </div>
    </ProtectedRoute>
  );
}
