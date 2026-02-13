'use client';

import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Users, Star, Loader2, FileText, RefreshCw, TrendingUp, AlertCircle, Clock } from 'lucide-react';
import api from '@/utils/api';
import type { EventFeedbackRead } from '@/types/api';

interface SummaryTabProps {
  eventId: string;
}

// Design tokens matching dashboard
const t = {
  bg: '#f6f5f2',
  surface: '#ffffff',
  surfaceTint: '#fafaf8',
  border: '#e8e5df',
  borderSoft: '#f0ede8',
  text: '#1a1917',
  textMuted: '#9e9a93',
  textSecondary: '#6b6760',
  green: '#2d7a3a',
  greenBg: '#edf7ef',
  amber: '#b45309',
  amberBg: '#fef7ed',
  blue: '#1d4ed8',
  blueBg: '#eff6ff',
  purple: '#7c3aed',
  purpleBg: '#f5f3ff',
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
              color: t.textSecondary, 
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }} 
          />
          <p style={{ fontSize: 13, color: t.textMuted, fontWeight: 400 }}>Loading summary...</p>
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
              width: 72,
              height: 72,
              background: t.surfaceTint,
              border: `1px solid ${t.border}`,
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <FileText style={{ width: 32, height: 32, color: t.textSecondary }} />
          </div>
          <h3
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: 28,
              fontWeight: 400,
              color: t.text,
              letterSpacing: '-0.01em',
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
              fontFamily: "'Instrument Serif', serif",
              fontSize: 30,
              fontWeight: 500,
              color: t.text,
              letterSpacing: '-0.02em',
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
            border: `1px solid ${t.border}`,
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
              (e.currentTarget as HTMLButtonElement).style.background = t.text;
              (e.currentTarget as HTMLButtonElement).style.color = t.surface;
              (e.currentTarget as HTMLButtonElement).style.borderColor = t.text;
            }
          }}
          onMouseLeave={e => {
            if (!generating) {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = t.textSecondary;
              (e.currentTarget as HTMLButtonElement).style.borderColor = t.border;
            }
          }}
        >
          <RefreshCw
            style={{
              width: 13,
              height: 13,
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
              background: t.greenBg,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}
          >
            <ThumbsUp style={{ width: 18, height: 18, color: t.green }} />
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
              background: t.amberBg,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}
          >
            <ThumbsDown style={{ width: 18, height: 18, color: t.amber }} />
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
              background: t.blueBg,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}
          >
            <Users style={{ width: 18, height: 18, color: t.blue }} />
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
              background: t.purpleBg,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}
          >
            <Star style={{ width: 18, height: 18, color: t.purple }} />
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
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: 14,
          padding: 24,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            paddingBottom: 18,
            marginBottom: 18,
            background: '#fafafa',
            margin: '-24px -24px 18px -24px',
            padding: '18px 24px',
            borderRadius: '14px 14px 0 0',
            borderLeft: `4px solid ${t.text}`,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              background: t.text,
              border: `1px solid ${t.text}`,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FileText style={{ width: 18, height: 18, color: t.surface }} />
          </div>
          <h3
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: 24,
              fontWeight: 600,
              color: t.text,
              letterSpacing: '-0.015em',
            }}
          >
            Overall Summary
          </h3>
        </div>
        <div
          style={{
            background: t.surfaceTint,
            border: `1px solid ${t.borderSoft}`,
            borderRadius: 12,
            padding: 20,
          }}
        >
          <p
            style={{
              fontSize: 14,
              color: t.text,
              lineHeight: 1.7,
              letterSpacing: '0.01em',
            }}
          >
            {report?.summary?.main_summary || report?.report?.executive_summary || 'No summary available'}
          </p>
        </div>
      </div>

      {/* Report Metadata */}
      <div
        style={{
          background: t.surfaceTint,
          border: `1px solid ${t.borderSoft}`,
          borderRadius: 14,
          padding: '18px 22px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 28,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock style={{ width: 14, height: 14, color: t.textSecondary }} />
          <div>
            <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 2, fontWeight: 500 }}>
              GENERATED
            </div>
            <div style={{ fontSize: 12.5, color: t.text, fontWeight: 500 }}>
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
            <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 2, fontWeight: 500 }}>
              PROCESSING TIME
            </div>
            <div style={{ fontSize: 12.5, color: t.text, fontWeight: 500 }}>
              {typeof report.generation_time === 'number' ? report.generation_time.toFixed(1) : report.generation_time}s
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users style={{ width: 14, height: 14, color: t.textSecondary }} />
          <div>
            <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 2, fontWeight: 500 }}>
              RESPONSES
            </div>
            <div style={{ fontSize: 12.5, color: t.text, fontWeight: 500 }}>
              {report.feedback_count || feedbacks.length} responses
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
