'use client';

import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Users, Star, Loader2, FileText, Download } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import api from '@/utils/api';
import type { EventFeedbackRead } from '@/types/api';

interface SummaryTabProps {
  eventId: number;
}

interface Report {
  report_id: number;
  event_id: number;
  event_title: string;
  feedback_count: number;
  generation_time: number | string;
  generated_at: string;
  summary?: {
    main_summary?: string;
  };
  analytics?: {
    satisfaction_score?: number;
    sentiment_distribution?: {
      positive: { count: number; percentage: number };
      negative: { count: number; percentage: number };
      neutral: { count: number; percentage: number };
    };
  };
  highlights?: string[];
  concerns?: string[];
  next_steps?: string[];
}

export default function SummaryTab({ eventId }: SummaryTabProps) {
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
      console.error('Failed to fetch summary data:', error);
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

  const getSentimentData = () => {
    if (report?.analytics?.sentiment_distribution) {
      const { positive, negative, neutral } = report.analytics.sentiment_distribution;
      return [
        { name: 'Positive', value: positive.count, color: '#22C55E', percentage: positive.percentage },
        { name: 'Negative', value: negative.count, color: '#EF4444', percentage: negative.percentage },
        { name: 'Neutral', value: neutral.count, color: '#94A3B8', percentage: neutral.percentage },
      ].filter(item => item.value > 0);
    }
    return [];
  };

  const sentimentData = getSentimentData();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading summary...</p>
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
            Generate an AI-powered summary to analyze {feedbacks.length} feedback responses
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
      {/* Header with Actions */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Executive Summary</h2>
            <p className="text-blue-100">
              Analysis of {feedbacks.length} feedback responses
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

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-5">
          <ThumbsUp className="w-8 h-8 text-green-600 mb-3" />
          <div className="text-3xl font-bold text-green-700 mb-1">{report?.highlights?.length || 0}</div>
          <div className="text-sm text-green-700 font-medium">Strengths</div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-5">
          <ThumbsDown className="w-8 h-8 text-orange-600 mb-3" />
          <div className="text-3xl font-bold text-orange-700 mb-1">{report?.concerns?.length || 0}</div>
          <div className="text-sm text-orange-700 font-medium">To Improve</div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5">
          <Users className="w-8 h-8 text-blue-600 mb-3" />
          <div className="text-3xl font-bold text-blue-700 mb-1">{feedbacks.length}</div>
          <div className="text-sm text-blue-700 font-medium">Responses</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-5">
          <Star className="w-8 h-8 text-purple-600 mb-3" />
          <div className="text-3xl font-bold text-purple-700 mb-1">
            {Math.round(report?.analytics?.satisfaction_score || 0)}%
          </div>
          <div className="text-sm text-purple-700 font-medium">Satisfaction</div>
        </div>
      </div>

      {/* Main Summary */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
          <div className="p-3 bg-blue-100 rounded-xl">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            Overall Summary
          </h3>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6">
          <p className="text-gray-800 leading-relaxed text-lg">
            {report?.summary?.main_summary || 'No summary available'}
          </p>
        </div>
      </div>

      {/* Sentiment Distribution */}
      {sentimentData.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            Sentiment Distribution
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex flex-col justify-center space-y-4">
              {sentimentData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="font-medium text-gray-900">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{item.value}</div>
                    <div className="text-sm text-gray-600">{item.percentage.toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Report Metadata */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-center gap-8 flex-wrap text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Generated:</span>
            <span className="font-semibold text-gray-900">
              {report.generated_at ? new Date(report.generated_at).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              }) : 'Just now'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Processing time:</span>
            <span className="font-semibold text-gray-900">
              {typeof report.generation_time === 'number' ? report.generation_time.toFixed(1) : report.generation_time}s
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Based on:</span>
            <span className="font-semibold text-gray-900">
              {report.feedback_count} responses
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
