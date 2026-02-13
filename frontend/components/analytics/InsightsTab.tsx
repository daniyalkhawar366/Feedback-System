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
          <Loader2 className="w-12 h-12 text-[#1a1917] mx-auto mb-4" style={{ animation: 'spin 1s linear infinite' }} />
          <p className="text-[#6b6760] font-medium">Loading insights...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-[#fafaf8] border-2 border-[#e8e5df] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10 text-[#1a1917]" />
          </div>
          <h3
            className="text-2xl font-medium text-[#1a1917] mb-3"
            style={{ fontFamily: "'Instrument Serif', serif", letterSpacing: '-0.01em' }}
          >
            No AI Report Yet
          </h3>
          <p className="text-[#6b6760] mb-8">
            Generate an AI-powered report to extract insights from {feedbacks.length} feedback responses
          </p>
          <button
            onClick={handleGenerateReport}
            disabled={generating || feedbacks.length === 0}
            className="px-8 py-4 bg-[#1a1917] hover:bg-[#333] text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? 'Generating...' : 'Generate AI Report'}
          </button>
          {feedbacks.length === 0 && (
            <p className="text-sm text-[#9e9a93] mt-4">
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
      <div className="bg-[#1a1917] rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2
              className="text-2xl font-medium mb-2"
              style={{ fontFamily: "'Instrument Serif', serif", letterSpacing: '-0.01em' }}
            >
              Key Insights & Recommendations
            </h2>
            <p className="text-[#d1d0cc]">
              Actionable insights from your feedback
            </p>
          </div>
          
          <button
            onClick={handleGenerateReport}
            disabled={generating}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <Loader2 className={`w-5 h-5 ${generating ? 'animate-spin' : ''}`} style={generating ? { animation: 'spin 1s linear infinite' } : {}} />
            Regenerate
          </button>
        </div>
      </div>

      {/* Strengths */}
      {report?.highlights && report.highlights.length > 0 && (
        <div className="bg-white border-2 border-[#1a1917] rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-[#1a1917]">
            <div className="p-3 bg-[#1a1917] rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <h3
              className="text-2xl font-medium text-[#1a1917]"
              style={{ fontFamily: "'Instrument Serif', serif", letterSpacing: '-0.01em' }}
            >
              What Went Great
            </h3>
          </div>
          <div className="space-y-4">
            {report.highlights.map((item, index) => (
              <div key={index} className="bg-[#fafaf8] rounded-xl p-6 border-l-4 border-[#1a1917]">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#1a1917] text-white rounded-full flex items-center justify-center font-bold shrink-0">
                    {index + 1}
                  </div>
                  <p className="text-[#1a1917] text-lg leading-relaxed flex-1 pt-1">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Areas to Improve */}
      {report?.concerns && report.concerns.length > 0 && (
        <div className="bg-white border-2 border-[#1a1917] rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-[#1a1917]">
            <div className="p-3 bg-[#1a1917] rounded-xl">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <h3
              className="text-2xl font-medium text-[#1a1917]"
              style={{ fontFamily: "'Instrument Serif', serif", letterSpacing: '-0.01em' }}
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
                <div key={index} className="bg-[#fafaf8] rounded-xl p-6 border-l-4 border-[#1a1917]">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-[#1a1917] text-white rounded-full flex items-center justify-center font-bold shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="bg-white rounded-lg p-4 border-2 border-[#e8e5df]">
                        <p className="text-xs text-[#6b6760] font-semibold mb-2 uppercase tracking-wide">Issue</p>
                        <p className="text-[#1a1917] text-base leading-relaxed font-medium">{issue}</p>
                      </div>
                      {suggestion && (
                        <div className="bg-white rounded-lg p-4 border-2 border-[#1a1917]">
                          <p className="text-xs text-[#1a1917] font-semibold mb-2 uppercase tracking-wide">Action to Take</p>
                          <p className="text-[#1a1917] text-base leading-relaxed font-medium">{suggestion}</p>
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
        <div className="bg-white border border-[#e8e5df] rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#e8e5df]">
            <div className="p-3 bg-[#fafaf8] rounded-xl">
              <MessageCircle className="w-6 h-6 text-[#1a1917]" />
            </div>
            <h3
              className="text-2xl font-medium text-[#1a1917]"
              style={{ fontFamily: "'Instrument Serif', serif", letterSpacing: '-0.01em' }}
            >
              Top-Rated Feedback
            </h3>
          </div>
          <div className="space-y-6">
            {meaningfulReviews.map((review, index) => (
              <div key={index} className="bg-[#fafaf8] rounded-xl p-6 border-l-4 border-[#1a1917]">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#1a1917] text-white rounded-full flex items-center justify-center font-bold shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-[#1a1917] text-lg leading-relaxed italic">
                      "{review}"
                    </p>
                    <div className="flex items-center gap-2 mt-3 text-sm text-[#6b6760]">
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
        <div className="bg-[#fafaf8] border border-[#e8e5df] rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#e8e5df]">
            <div className="p-3 bg-white rounded-xl border border-[#e8e5df]">
              <TrendingUp className="w-6 h-6 text-[#1a1917]" />
            </div>
            <h3
              className="text-2xl font-medium text-[#1a1917]"
              style={{ fontFamily: "'Instrument Serif', serif", letterSpacing: '-0.01em' }}
            >
              Recommended Next Steps
            </h3>
          </div>
          <div className="grid gap-4">
            {report.next_steps.map((item, index) => (
              <div key={index} className="flex items-start gap-4 bg-white rounded-xl p-5 border-l-4 border-[#1a1917]">
                <div className="w-8 h-8 bg-[#1a1917] text-white rounded-lg flex items-center justify-center font-bold shrink-0">
                  {index + 1}
                </div>
                <p className="text-[#1a1917] text-base flex-1">{item}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
