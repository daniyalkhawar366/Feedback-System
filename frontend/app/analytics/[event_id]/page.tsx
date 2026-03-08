'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MessageSquare, BarChart3, FileText, Lightbulb } from 'lucide-react';
import PageLoader from '@/components/PageLoader';
import ProtectedRoute from '@/components/ProtectedRoute';
import OverviewTab from '@/components/analytics/OverviewTab';
import InsightsTab from '@/components/analytics/InsightsTab';
import FeedbacksTab from '@/components/analytics/FeedbacksTab';
import { useAuth } from '@/hooks/useAuth';
import ThemeToggle from '@/components/ThemeToggle';
import api from '@/utils/api';
import type { EventRead } from '@/types/api';

type TabType = 'overview' | 'insights' | 'feedbacks';

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
    { id: 'insights', label: 'Insights', icon: Lightbulb },
    { id: 'feedbacks', label: 'Feedbacks', icon: MessageSquare },
  ] as const;

  if (loading) {
    return (
      <ProtectedRoute>
        <PageLoader message="Loading analytics…" />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-bg text-fg overflow-hidden relative selection:bg-accent-glow">
        {/* Ambient Effects */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="bg-noise" />
          <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-accent/5 blur-[120px] transition-transform duration-1000 ease-out" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-accent-light/10 blur-[150px] transition-transform duration-1000 ease-out" />
        </div>

        {/* --- Sidebar Navigation --- */}
        <aside className="relative z-20 w-[260px] flex-shrink-0 flex flex-col border-r border-card-border/50 bg-nav-bg backdrop-blur-xl animate-fade-up">
          {/* Top Info section */}
          <div className="flex flex-col p-6 border-b border-card-border/50">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-card-bg border border-card-border rounded-lg text-[13px] font-bold text-fg shadow-sm hover:border-accent/40 hover:text-accent transition-all mb-6 w-full"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>
            <h1 className="text-[18px] font-bold text-fg tracking-tight leading-tight">
              {event?.title || 'Event Analytics'}
            </h1>

            {/* Status / Date logic */}
            <div className="flex flex-col mt-4 gap-2">
              {event?.event_date && (
                <div className="text-[12px] font-semibold text-fg-secondary tracking-wide uppercase">
                  {new Date(event.event_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              )}
              {event?.feedback_open_at && event?.feedback_close_at && (
                <div>
                  {(() => {
                    const now = new Date();
                    const openAt = new Date(event.feedback_open_at);
                    const closeAt = new Date(event.feedback_close_at);
                    if (now < openAt) {
                      return (
                        <span className="inline-flex items-center px-2 py-1 bg-accent/10 border border-accent/20 text-accent text-[11px] font-bold uppercase tracking-widest rounded-md shadow-sm">
                          Upcoming
                        </span>
                      );
                    } else if (now >= openAt && now <= closeAt) {
                      return (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-card-bg border border-card-border rounded-md text-[11px] font-bold uppercase tracking-widest text-fg shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" /> Active
                        </span>
                      );
                    } else {
                      return (
                        <span className="inline-flex items-center px-2 py-1 bg-hover-overlay text-fg-secondary text-[11px] font-bold uppercase tracking-widest rounded-md shadow-sm border border-card-border">
                          Closed
                        </span>
                      );
                    }
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Nav List */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1.5">
            <div className="text-[11px] font-bold uppercase tracking-widest text-fg-secondary/50 px-3 mb-2 mt-2">
              Analytics Menu
            </div>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-[14px] font-semibold transition-all ${isActive
                    ? 'bg-accent/10 text-accent border border-accent/20'
                    : 'text-fg-secondary hover:text-fg hover:bg-bg-secondary border border-transparent'
                    }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-accent' : 'text-fg-secondary'}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="p-4 border-t border-card-border/50 flex justify-between items-center">
            <span className="text-[12px] font-medium text-fg-secondary">Theme Preference</span>
            <ThemeToggle />
          </div>
        </aside>

        {/* --- Main Content Area --- */}
        <main className="relative z-10 flex-1 h-screen overflow-y-auto p-8 animate-fade-up stagger-2">
          <div className="max-w-5xl mx-auto w-full pb-32">
            {activeTab === 'overview' && <OverviewTab eventId={eventId} feedbackOpenAt={event?.feedback_open_at} feedbackCloseAt={event?.feedback_close_at} />}
            {activeTab === 'insights' && <InsightsTab eventId={eventId} />}
            {activeTab === 'feedbacks' && <FeedbacksTab eventId={eventId} />}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
