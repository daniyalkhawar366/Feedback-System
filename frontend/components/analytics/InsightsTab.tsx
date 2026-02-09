'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, TrendingUp, Loader2, FileText, Star, MessageCircle } from 'lucide-react';
import api from '@/utils/api';
import type { EventFeedbackRead } from '@/types/api';

interface InsightsTabProps {
  eventId: number;
}

interface Report {
  report_id: number;
  event_id: number;
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
        api.get(`/api/reports/events/${eventId}/latest`),
        api.get(`/events/${eventId}/feedback`),
      ]);
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
      await api.post(`/api/reports/events/${eventId}/generate`);
      await fetchData();
    } catch (error) {
      console.error('Failed to generate report:', error);
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
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading insights...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No AI Report Yet</h3>
          <p className="text-gray-600 mb-8">
            Generate an AI-powered report to extract insights from {feedbacks.length} feedback responses
          </p>
          <button
            onClick={handleGenerateReport}
            disabled={generating || feedbacks.length === 0}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Key Insights & Recommendations</h2>
            <p className="text-indigo-100">
              Actionable insights from your feedback
            </p>
          </div>
          
          <button
            onClick={handleGenerateReport}
            disabled={generating}
            className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <Loader2 className={`w-5 h-5 ${generating ? 'animate-spin' : ''}`} />
            Regenerate
          </button>
        </div>
      </div>

      {/* Strengths */}
      {report?.highlights && report.highlights.length > 0 && (
        <div className="bg-white border border-green-200 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-green-200">
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-green-800">
              What Went Great
            </h3>
          </div>
          <div className="space-y-4">
            {report.highlights.map((item, index) => (
              <div key={index} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-l-4 border-green-500">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <p className="text-gray-800 text-lg leading-relaxed flex-1 pt-1">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Areas to Improve */}
      {report?.concerns && report.concerns.length > 0 && (
        <div className="bg-white border border-orange-200 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-orange-200">
            <div className="p-3 bg-orange-100 rounded-xl">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold text-orange-800">
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
                <div key={index} className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border-l-4 border-orange-500">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="bg-white rounded-lg p-4 border border-orange-200">
                        <p className="text-xs text-orange-600 font-semibold mb-2 uppercase tracking-wide">Issue</p>
                        <p className="text-gray-900 text-base leading-relaxed">{issue}</p>
                      </div>
                      {suggestion && (
                        <div className="bg-white rounded-lg p-4 border border-green-200">
                          <p className="text-xs text-green-600 font-semibold mb-2 uppercase tracking-wide">Action to Take</p>
                          <p className="text-gray-800 text-base leading-relaxed">{suggestion}</p>
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
        <div className="bg-white border border-purple-200 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-purple-200">
            <div className="p-3 bg-purple-100 rounded-xl">
              <MessageCircle className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-purple-800">
              Top-Rated Feedback
            </h3>
          </div>
          <div className="space-y-6">
            {meaningfulReviews.map((review, index) => (
              <div key={index} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-l-4 border-purple-500">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-800 text-lg leading-relaxed italic">
                      "{review}"
                    </p>
                    <div className="flex items-center gap-2 mt-3 text-sm text-purple-600">
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
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-indigo-200">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-2xl font-bold text-indigo-800">
              Recommended Next Steps
            </h3>
          </div>
          <div className="grid gap-4">
            {report.next_steps.map((item, index) => (
              <div key={index} className="flex items-start gap-4 bg-white rounded-xl p-5 border-l-4 border-indigo-500">
                <div className="w-8 h-8 bg-indigo-500 text-white rounded-lg flex items-center justify-center font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <p className="text-gray-800 text-base flex-1">{item}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
