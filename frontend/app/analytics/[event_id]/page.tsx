'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, Loader2, BarChart3, TrendingUp, Hash, Shield, MessageSquare } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import OverviewTab from '@/components/analytics/OverviewTab';
import TrendsTab from '@/components/analytics/TrendsTab';
import KeywordsTab from '@/components/analytics/KeywordsTab';
import QualityTab from '@/components/analytics/QualityTab';
import FeedbacksTab from '@/components/analytics/FeedbacksTab';
import { useAuth } from '@/hooks/useAuth';
import { generatePDF } from '@/utils/report';
import api from '@/utils/api';
import type { EventStats, TopKeywords, EventRead } from '@/types/api';

type TabType = 'overview' | 'trends' | 'keywords' | 'quality' | 'feedbacks';

export default function AnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const { speaker } = useAuth();
  const eventId = Number(params.event_id);

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [event, setEvent] = useState<EventRead | null>(null);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

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

  const handleExportPDF = async () => {
    if (!stats || !speaker) return;

    try {
      setExporting(true);
      const keywordsRes = await api.get<TopKeywords>(`/analytics/events/${eventId}/keywords`);
      await generatePDF(stats, keywordsRes.data, speaker.name);
    } catch (error) {
      console.error('Failed to export PDF:', error);
    } finally {
      setExporting(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'trends', label: 'Trends', icon: TrendingUp },
    { id: 'keywords', label: 'Keywords', icon: Hash },
    { id: 'quality', label: 'Quality', icon: Shield },
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

              <button
                onClick={handleExportPDF}
                disabled={exporting || !stats}
                className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {exporting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="hidden sm:inline">Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span className="hidden sm:inline">Download Report</span>
                  </>
                )}
              </button>
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
          {activeTab === 'overview' && stats && <OverviewTab eventId={eventId} stats={stats} />}
          {activeTab === 'trends' && <TrendsTab eventId={eventId} />}
          {activeTab === 'keywords' && <KeywordsTab eventId={eventId} />}
          {activeTab === 'quality' && <QualityTab eventId={eventId} />}
          {activeTab === 'feedbacks' && <FeedbacksTab eventId={eventId} />}
        </main>
      </div>
    </ProtectedRoute>
  );
}
