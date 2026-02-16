'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, TrendingUp, Loader2, FileText, Star, MessageCircle } from 'lucide-react';
import api from '@/utils/api';
import type { EventFeedbackRead } from '@/types/api';

interface InsightsTabProps {
  eventId: string;
}

interface Report {
  report_id: string;
  event_id: string;
  event_title: string;
  feedback_count: number;
  summary?: {
    top_weighted_points?: string[];
  };
  highlights?: string[];
  concerns?: string[];
  next_steps?: string[];
}

export default function InsightsTab({ eventId }: InsightsTabProps) {
  const [report, setReport] = useState<Report | null>(null);
  const [feedbacks, setFeedbacks] = useState<EventFeedbackRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reportRes, feedbackRes] = await Promise.all([
        api.get(`/api/reports/events/${eventId}/latest`).catch(() => ({ data: null })),
        api.get(`/events/${eventId}/feedback`).catch(() => ({ data: [] })),
      ]);
      console.log('Insights - Report data:', reportRes.data);
      console.log('Insights - Feedbacks data:', feedbackRes.data);
      setReport(reportRes.data);
      setFeedbacks(feedbackRes.data || []);
    } catch (error) {
      console.error('Failed to fetch insights data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      const response = await api.post(`/api/reports/events/${eventId}/generate`);
      console.log('Insights - Report generation response:', response.data);
      await fetchData();
    } catch (error: any) {
      console.error('Failed to generate report:', error);
      alert(error.response?.data?.detail || 'Failed to generate report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const getMeaningfulReviews = () => {
    if (!report?.summary?.top_weighted_points) return [];
    return report.summary.top_weighted_points.slice(0, 5);
  };

  const meaningfulReviews = getMeaningfulReviews();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-4" style={{ animation: 'spin 1s linear infinite' }} />
          <p className="text-gray-600 font-semibold text-base">Loading insights...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md">
            <FileText className="w-10 h-10 text-blue-500" />
          </div>
          <h3
            className="text-2xl font-bold text-gray-900 mb-3"
            style={{ letterSpacing: '-0.02em' }}
          >
            No AI Report Yet
          </h3>
          <p className="text-gray-600 mb-8 text-[15px]">
            Generate an AI-powered report to extract insights from {feedbacks.length} feedback responses
          </p>
          <button
            onClick={handleGenerateReport}
            disabled={generating || feedbacks.length === 0}
            className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {generating ? 'Generating...' : 'Generate AI Report'}
          </button>
          {feedbacks.length === 0 && (
            <p className="text-sm text-gray-500 mt-4">
              Waiting for feedback responses...
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', padding: '24px 32px', borderRadius: '12px' }}>
        <div className="flex items-center justify-between">
          <div>
            <h2
              className="text-2xl font-bold mb-2"
              style={{ letterSpacing: '-0.02em' }}
            >
              Key Insights & Recommendations
            </h2>
            <p className="text-indigo-100">
              Actionable insights from your feedback
            </p>
          </div>
          
          <button
            onClick={handleGenerateReport}
            disabled={generating}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
            style={{ background: generating ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.1)' }}
            onMouseEnter={(e) => {
              if (!generating) {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(139, 92, 246, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!generating) {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.1)';
              }
            }}
          >
            <Loader2 className={`w-5 h-5 ${generating ? 'animate-spin' : ''}`} style={generating ? { animation: 'spin 1s linear infinite' } : {}} />
            Regenerate
          </button>
        </div>
      </div>

      {/* Strengths */}
      {report?.highlights && report.highlights.length > 0 && (
        <div className="bg-white border-2 border-green-200 rounded-2xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-green-200">
            <div className="p-3 rounded-xl shadow-sm" style={{ backgroundColor: '#10B981' }}>
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <h3
              className="text-lg font-semibold text-gray-900"
              style={{ letterSpacing: '-0.02em', fontWeight: 600, color: '#111827', fontSize: '18px' }}
            >
              What Went Great
            </h3>
          </div>
          <div className="space-y-4">
            {report.highlights.map((item, index) => (
              <div key={index} className="rounded-xl p-6 border-l-4 shadow-sm" style={{ backgroundColor: '#F0FDF4', borderLeftColor: '#10B981' }}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-bold shrink-0 shadow-md" style={{ backgroundColor: '#10B981' }}>
                    {index + 1}
                  </div>
                  <p className="flex-1 pt-1" style={{ color: '#374151', lineHeight: 1.6, fontSize: '15px' }}>{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Areas to Improve */}
      {report?.concerns && report.concerns.length > 0 && (
        <div className="bg-white border-2 border-orange-200 rounded-2xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-orange-200">
            <div className="p-3 rounded-xl shadow-sm" style={{ backgroundColor: '#F59E0B' }}>
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <h3
              className="text-lg font-semibold text-gray-900"
              style={{ letterSpacing: '-0.02em', fontWeight: 600, color: '#111827', fontSize: '18px' }}
            >
              Action Items for Improvement
            </h3>
          </div>
          <div className="space-y-5">
            {report.concerns.map((item, index) => {
              // Parse format: "Issue → Suggestion"
              const parts = item.split('→').map(s => s.trim());
              const issue = parts[0] || item;
              const suggestion = parts[1];
              
              return (
                <div key={index} className="rounded-xl p-6 border-l-4 shadow-sm" style={{ backgroundColor: '#FFFBEB', borderLeftColor: '#F59E0B' }}>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 text-white rounded-full flex items-center justify-center font-bold shrink-0 shadow-md" style={{ backgroundColor: '#F59E0B' }}>
                      {index + 1}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="bg-white rounded-lg p-4 border-2 border-orange-200">
                        <p className="mb-2" style={{ fontSize: '11px', color: '#F59E0B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Issue</p>
                        <p className="text-base font-medium" style={{ color: '#374151', lineHeight: 1.6, fontSize: '15px' }}>{issue}</p>
                      </div>
                      {suggestion && (
                        <div className="bg-white rounded-lg p-4 border-2 border-green-200">
                          <p className="text-xs text-green-600 font-semibold mb-2 uppercase tracking-wide">Action to Take</p>
                          <p className="text-base font-medium" style={{ color: '#374151', lineHeight: 1.6, fontSize: '15px' }}>{suggestion}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detailed Reviews */}
      {meaningfulReviews.length > 0 && (
        <div className="bg-white border-2 border-blue-200 rounded-2xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-blue-200">
            <div className="p-3 bg-blue-500 rounded-xl shadow-sm">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <h3
              className="text-lg font-semibold text-gray-900"
              style={{ letterSpacing: '-0.02em', fontWeight: 600, color: '#111827', fontSize: '18px' }}
            >
              Top-Rated Feedback
            </h3>
          </div>
          <div className="space-y-6">
            {meaningfulReviews.map((review, index) => (
              <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-l-4 border-blue-500 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold shrink-0 shadow-md">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="italic" style={{ color: '#374151', lineHeight: 1.6, fontSize: '15px' }}>
                      "{review}"
                    </p>
                    <div className="flex items-center gap-2 mt-3 text-sm text-blue-600">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-medium">High-impact feedback</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Items */}
      {report?.next_steps && report.next_steps.length > 0 && (
        <div className="bg-white border-2 border-indigo-200 rounded-2xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-indigo-200">
            <div className="p-3 rounded-xl shadow-sm" style={{ backgroundColor: '#6366F1' }}>
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3
              className="text-lg font-semibold text-gray-900"
              style={{ letterSpacing: '-0.02em', fontWeight: 600, color: '#111827', fontSize: '18px' }}
            >
              Recommended Next Steps
            </h3>
          </div>
          <div className="grid gap-4">
            {report.next_steps.map((item, index) => (
              <div key={index} className="flex items-start gap-4 rounded-xl p-5 border-l-4 shadow-sm" style={{ backgroundColor: '#EEF2FF', borderLeftColor: '#6366F1' }}>
                <div className="w-8 h-8 text-white rounded-lg flex items-center justify-center font-bold shrink-0 shadow-sm" style={{ backgroundColor: '#6366F1' }}>
                  {index + 1}
                </div>
                <p className="flex-1" style={{ color: '#374151', lineHeight: 1.6, fontSize: '15px' }}>{item}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
