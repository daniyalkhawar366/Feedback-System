'use client';

import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Users, Star, Loader2, FileText, RefreshCw, TrendingUp, AlertCircle, Clock } from 'lucide-react';
import api from '@/utils/api';
import type { EventFeedbackRead } from '@/types/api';

interface SummaryTabProps {
  eventId: string;
}

// Design tokens matching modern theme
const t = {
  bg: '#F9FAFB',
  surface: '#ffffff',
  surfaceTint: '#f9fafb',
  border: '#e5e7eb',
  borderSoft: '#f3f4f6',
  text: '#1f2937',
  textMuted: '#9ca3af',
  textSecondary: '#6b7280',
  primary: '#3b82f6',
  primaryBg: '#dbeafe',
  green: '#10b981',
  greenBg: '#d1fae5',
  amber: '#f59e0b',
  amberBg: '#fef3c7',
  blue: '#3b82f6',
  blueBg: '#dbeafe',
  purple: '#8b5cf6',
  purpleBg: '#ede9fe',
  indigo: '#6366f1',
  indigoBg: '#e0e7ff',
};

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
        api.get(`/api/reports/events/${eventId}/latest`).catch(() => ({ data: null })),
        api.get(`/events/${eventId}/feedback`).catch(() => ({ data: [] })),
      ]);
      console.log('Report data:', reportRes.data);
      console.log('Feedbacks data:', feedbackRes.data);
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
      const response = await api.post(`/api/reports/events/${eventId}/generate`);
      console.log('Report generation response:', response.data);
      await fetchData();
    } catch (error: any) {
      console.error('Failed to generate report:', error);
      alert(error.response?.data?.detail || 'Failed to generate report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const getSentimentData = () => {
    if (report?.analytics?.sentiment_distribution) {
      const { positive, negative, neutral } = report.analytics.sentiment_distribution;
      return [
        { name: 'Positive', value: positive.count, color: t.green, percentage: positive.percentage },
        { name: 'Negative', value: negative.count, color: t.amber, percentage: negative.percentage },
        { name: 'Neutral', value: neutral.count, color: t.textMuted, percentage: neutral.percentage },
      ].filter(item => item.value > 0);
    }
    return [];
  };

  const sentimentData = getSentimentData();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 
            style={{ 
              width: 40, 
              height: 40, 
              color: t.primary, 
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }} 
          />
          <p style={{ fontSize: 15, color: t.textSecondary, fontWeight: 500 }}>Loading summary...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 24px' }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <div
            style={{
              width: 80,
              height: 80,
              background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
              border: `1px solid ${t.border}`,
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
            }}
          >
            <FileText style={{ width: 36, height: 36, color: t.primary }} />
          </div>
          <h3
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: t.text,
              letterSpacing: '-0.03em',
              marginBottom: 10,
            }}
          >
            No AI Report Yet
          </h3>
          <p style={{ fontSize: 13.5, color: t.textMuted, marginBottom: 28, lineHeight: 1.6 }}>
            Generate an AI-powered summary to analyze {feedbacks.length} feedback responses
          </p>
          <button
            onClick={handleGenerateReport}
            disabled={generating || feedbacks.length === 0}
            style={{
              padding: '11px 22px',
              background: generating || feedbacks.length === 0 ? t.borderSoft : t.text,
              color: t.surface,
              border: 'none',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 500,
              cursor: generating || feedbacks.length === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
            onMouseEnter={e => {
              if (!generating && feedbacks.length > 0) {
                (e.currentTarget as HTMLButtonElement).style.background = '#333';
              }
            }}
            onMouseLeave={e => {
              if (!generating && feedbacks.length > 0) {
                (e.currentTarget as HTMLButtonElement).style.background = t.text;
              }
            }}
          >
            {generating ? (
              <>
                <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                Generating Report...
              </>
            ) : (
              <>
                <FileText style={{ width: 14, height: 14 }} />
                Generate AI Report
              </>
            )}
          </button>
          {feedbacks.length === 0 && (
            <p style={{ fontSize: 12, color: t.textMuted, marginTop: 16 }}>
              Waiting for feedback responses...
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header with Regenerate Button */}
      <div
        style={{
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: 14,
          padding: '20px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 34,
              fontWeight: 700,
              color: t.text,
              letterSpacing: '-0.03em',
              marginBottom: 4,
            }}
          >
            Executive Summary
          </h2>
          <p style={{ fontSize: 13.5, color: t.textSecondary, fontWeight: 500 }}>
            Analysis of {feedbacks.length} feedback responses
          </p>
        </div>

        <button
          onClick={handleGenerateReport}
          disabled={generating}
          style={{
            padding: '9px 16px',
            background: generating ? t.borderSoft : 'transparent',
            color: t.textSecondary,
            border: '1px solid #E5E7EB',
            borderRadius: 9,
            fontSize: 12.5,
            fontWeight: 500,
            cursor: generating ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
            display: 'flex',
            alignItems: 'center',
            gap: 7,
          }}
          onMouseEnter={e => {
            if (!generating) {
              (e.currentTarget as HTMLButtonElement).style.background = '#F9FAFB';
              (e.currentTarget as HTMLButtonElement).style.color = t.textSecondary;
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB';
            }
          }}
          onMouseLeave={e => {
            if (!generating) {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = t.textSecondary;
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB';
            }
          }}
        >
          <RefreshCw
            style={{
              width: 13,
              height: 13,
              color: '#6366F1',
              animation: generating ? 'spin 1s linear infinite' : 'none',
            }}
          />
          {generating ? 'Regenerating...' : 'Regenerate'}
        </button>
      </div>

      {/* Key Metrics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 16,
        }}
      >
        {/* Strengths */}
        <div
          style={{
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: 14,
            padding: '20px 18px',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              background: '#D1FAE5',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}
          >
            <ThumbsUp style={{ width: 18, height: 18, color: '#10B981' }} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 600, color: t.text, marginBottom: 2 }}>
            {report?.highlights?.length || 0}
          </div>
          <div style={{ fontSize: 12, color: t.textMuted, fontWeight: 500 }}>Strengths</div>
        </div>

        {/* Areas to Improve */}
        <div
          style={{
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: 14,
            padding: '20px 18px',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              background: '#FEF3C7',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}
          >
            <ThumbsDown style={{ width: 18, height: 18, color: '#F59E0B' }} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 600, color: t.text, marginBottom: 2 }}>
            {report?.concerns?.length || 0}
          </div>
          <div style={{ fontSize: 12, color: t.textMuted, fontWeight: 500 }}>To Improve</div>
        </div>

        {/* Total Responses */}
        <div
          style={{
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: 14,
            padding: '20px 18px',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              background: '#DBEAFE',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}
          >
            <Users style={{ width: 18, height: 18, color: '#6366F1' }} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 600, color: t.text, marginBottom: 2 }}>
            {feedbacks.length}
          </div>
          <div style={{ fontSize: 12, color: t.textMuted, fontWeight: 500 }}>Responses</div>
        </div>

        {/* Satisfaction Score */}
        <div
          style={{
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: 14,
            padding: '20px 18px',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              background: '#F3E8FF',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}
          >
            <Star style={{ width: 18, height: 18, color: '#A855F7' }} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 600, color: t.text, marginBottom: 2 }}>
            {Math.round(report?.analytics?.satisfaction_score || 0)}%
          </div>
          <div style={{ fontSize: 12, color: t.textMuted, fontWeight: 500 }}>Satisfaction</div>
        </div>
      </div>

      {/* Main Summary */}
      <div
        style={{
          background: '#F9FAFB',
          border: `1px solid ${t.border}`,
          borderRadius: 14,
          padding: 32,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            paddingBottom: 18,
            marginBottom: 18,
            borderLeft: `4px solid #6366F1`,
            paddingLeft: 16,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              background: '#EEF2FF',
              border: `1px solid #E0E7FF`,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FileText style={{ width: 18, height: 18, color: '#6366F1' }} />
          </div>
          <h3
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: t.text,
              letterSpacing: '-0.02em',
            }}
          >
            Overall Summary
          </h3>
        </div>
        <div
          style={{
            background: t.surface,
            border: `1px solid ${t.borderSoft}`,
            borderRadius: 12,
            padding: 20,
          }}
        >
          <p
            style={{
              fontSize: 15,
              color: '#4B5563',
              lineHeight: 1.7,
              letterSpacing: '0.01em',
              marginBottom: 16,
            }}
          >
            {report?.summary?.main_summary || report?.report?.executive_summary || 'No summary available'}
          </p>
        </div>
      </div>

      {/* Report Metadata */}
      <div
        style={{
          background: '#F9FAFB',
          padding: '16px 24px',
          borderRadius: 8,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock style={{ width: 14, height: 14, color: t.textSecondary }} />
          <div>
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              GENERATED
            </div>
            <div style={{ fontSize: 14, color: '#111827', fontWeight: 500 }}>
              {report.generated_at ? new Date(report.generated_at).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              }) : 'Just now'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock style={{ width: 14, height: 14, color: t.textSecondary }} />
          <div>
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              PROCESSING TIME
            </div>
            <div style={{ fontSize: 14, color: '#111827', fontWeight: 500 }}>
              {typeof report.generation_time === 'number' ? report.generation_time.toFixed(1) : report.generation_time}s
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users style={{ width: 14, height: 14, color: t.textSecondary }} />
          <div>
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              RESPONSES
            </div>
            <div style={{ fontSize: 14, color: '#111827', fontWeight: 500 }}>
              {report.feedback_count || feedbacks.length} responses
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
