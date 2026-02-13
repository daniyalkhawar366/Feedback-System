'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Mic,
  ThumbsUp,
  Flag,
  Loader2,
  FileText,
  BarChart2,
  Clock,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import api from '@/utils/api';
import type { EventStats } from '@/types/api';

interface OverviewTabProps {
  eventId: string;
  stats: EventStats;
}

// ── Design tokens (mirror dashboard) ────────────────────────────────────────
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
  red: '#b91c1c',
  redBg: '#fef2f2',
};

// ── Shared micro-components ──────────────────────────────────────────────────

function MetricCard({
  icon,
  label,
  value,
  trend,
  valueColor = t.text,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | null;
  valueColor?: string;
}) {
  return (
    <div
      style={{
        background: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: 14,
        padding: '20px 22px',
        transition: 'box-shadow 0.2s, transform 0.2s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 24px rgba(0,0,0,0.07)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div
          style={{
            width: 38,
            height: 38,
            background: t.surfaceTint,
            border: `1px solid ${t.borderSoft}`,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: t.textSecondary,
          }}
        >
          {icon}
        </div>
        {trend === 'up' && <TrendingUp size={15} color={t.green} />}
        {trend === 'down' && <TrendingDown size={15} color={t.red} />}
      </div>
      <div style={{ fontSize: 28, fontWeight: 600, color: valueColor, letterSpacing: '-0.02em', lineHeight: 1.1, fontFamily: "'Instrument Serif', serif" }}>
        {value}
      </div>
      <div style={{ marginTop: 4, fontSize: 12.5, color: t.textMuted, fontWeight: 400 }}>{label}</div>
    </div>
  );
}

function SectionCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: 14,
        padding: '0',
        overflow: 'hidden',
      }}
    >
      {title && (
        <div
          style={{
            background: '#fafafa',
            borderLeft: `4px solid ${t.text}`,
            padding: '16px 24px',
            marginBottom: 0,
          }}
        >
          <h3
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: 20,
              fontWeight: 600,
              color: t.text,
              letterSpacing: '-0.01em',
              margin: 0,
            }}
          >
            {title}
          </h3>
        </div>
      )}
      <div style={{ padding: title ? '22px 24px' : '22px 24px' }}>
        {children}
      </div>
    </div>
  );
}

const customTooltipStyle = {
  backgroundColor: t.surface,
  border: `1px solid ${t.border}`,
  borderRadius: 10,
  fontSize: 12.5,
  color: t.text,
  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
};

// ── Main component ───────────────────────────────────────────────────────────

export default function OverviewTab({ eventId, stats }: OverviewTabProps) {
  const [hasReport, setHasReport] = useState<boolean | null>(null);
  const [loadingReport, setLoadingReport] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    checkForReport();
  }, [eventId]);

  const checkForReport = async () => {
    try {
      setLoadingReport(true);
      const response = await api.get(`/api/reports/events/${eventId}/latest`);
      setHasReport(!!response.data);
    } catch {
      setHasReport(false);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      await api.post(`/api/reports/events/${eventId}/generate`);
      await checkForReport();
      alert('Report generated successfully! Check the Summary and Insights tabs.');
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to generate report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (!stats) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0' }}>
        <p style={{ fontSize: 13.5, color: t.textMuted }}>No statistics available</p>
      </div>
    );
  }

  if (loadingReport) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={28} color={t.textMuted} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 13, color: t.textMuted }}>Loading…</p>
        </div>
      </div>
    );
  }

  // ── No report yet ────────────────────────────────────────────────────────
  if (!hasReport) {
    const noFeedback = (stats.total_feedback || 0) === 0;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Simple count card */}
        <SectionCard>
          <div style={{ textAlign: 'center', padding: '12px 0 8px' }}>
            <div
              style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: 52,
                fontWeight: 400,
                color: t.text,
                letterSpacing: '-0.03em',
                lineHeight: 1,
              }}
            >
              {stats.total_feedback || 0}
            </div>
            <div style={{ marginTop: 6, fontSize: 13.5, color: t.textMuted }}>Total Feedback Received</div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                maxWidth: 320,
                margin: '24px auto 0',
              }}
            >
              {[
                { icon: <MessageSquare size={14} />, label: 'Text', val: stats.input_type_breakdown?.text || 0 },
                { icon: <Mic size={14} />, label: 'Audio', val: stats.input_type_breakdown?.audio || 0 },
              ].map(item => (
                <div
                  key={item.label}
                  style={{
                    background: t.surfaceTint,
                    border: `1px solid ${t.borderSoft}`,
                    borderRadius: 10,
                    padding: '14px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    color: t.textSecondary,
                  }}
                >
                  {item.icon}
                  <span style={{ fontSize: 22, fontWeight: 600, color: t.text, fontFamily: "'Instrument Serif', serif" }}>{item.val}</span>
                  <span style={{ fontSize: 11.5, color: t.textMuted }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* Generate report CTA */}
        <div
          style={{
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: 14,
            padding: '28px 28px 24px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              background: t.text,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <FileText size={20} color="#fff" />
          </div>

          <div
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: 22,
              fontWeight: 400,
              color: t.text,
              marginBottom: 8,
              letterSpacing: '-0.01em',
            }}
          >
            Generate an AI Report
          </div>
          <p style={{ fontSize: 13.5, color: t.textMuted, maxWidth: 380, margin: '0 auto 22px', lineHeight: 1.6 }}>
            Unlock detailed analytics, sentiment analysis, and actionable recommendations from your feedback.
          </p>

          <button
            onClick={handleGenerateReport}
            disabled={generating || noFeedback}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '10px 20px',
              background: noFeedback || generating ? t.borderSoft : t.text,
              color: noFeedback || generating ? t.textMuted : '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 500,
              fontFamily: "'DM Sans', sans-serif",
              cursor: noFeedback || generating ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {generating ? (
              <>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                Generating…
              </>
            ) : (
              <>
                <FileText size={14} />
                Generate Report
              </>
            )}
          </button>

          {noFeedback && (
            <p style={{ marginTop: 12, fontSize: 12, color: t.textMuted }}>
              Waiting for feedback responses…
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Full analytics view ──────────────────────────────────────────────────
  const sentimentData = [
    { name: 'Positive', value: stats.sentiment_distribution?.positive?.count || 0, color: t.green },
    { name: 'Negative', value: stats.sentiment_distribution?.negative?.count || 0, color: t.red },
    { name: 'Neutral', value: stats.sentiment_distribution?.neutral?.count || 0, color: t.textMuted },
  ].filter(d => d.value > 0);

  const qualityData = [
    { name: 'Accepted', value: stats.quality_breakdown?.accepted || 0, color: t.green },
    { name: 'Flagged', value: stats.quality_breakdown?.flagged || 0, color: t.amber },
    { name: 'Rejected', value: stats.quality_breakdown?.rejected || 0, color: t.red },
  ];

  const positivePct = stats.sentiment_distribution?.positive?.percentage || 0;
  const overallLabel =
    positivePct > 60 ? 'highly positive' : positivePct > 40 ? 'moderately positive' :
    (stats.sentiment_distribution?.negative?.percentage || 0) > 40 ? 'mixed' : 'neutral';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Key metrics ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <MetricCard
          icon={<MessageSquare size={15} />}
          label="Valid Feedback (Non-Flagged)"
          value={stats.valid_feedback || 0}
        />
        <MetricCard
          icon={<ThumbsUp size={15} />}
          label={`Positive (${stats.sentiment_distribution?.positive?.count || 0})`}
          value={`${positivePct.toFixed(1)}%`}
          valueColor={t.green}
          trend={positivePct > 50 ? 'up' : 'down'}
        />
        <MetricCard
          icon={<BarChart2 size={15} />}
          label="Avg Confidence"
          value={`${((stats.avg_confidence || 0) * 100).toFixed(1)}%`}
        />
        <MetricCard
          icon={<Flag size={15} />}
          label="Flagged Issues"
          value={stats.quality_breakdown?.flagged || 0}
          valueColor={stats.quality_breakdown?.flagged ? t.amber : t.text}
        />
      </div>

      {/* ── Charts row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Sentiment pie */}
        <SectionCard title="Sentiment Distribution">
          {sentimentData.length > 0 ? (
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {sentimentData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={customTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: t.textMuted, padding: '40px 0', fontSize: 13 }}>
              No feedback data yet
            </p>
          )}
        </SectionCard>

        {/* Quality bar */}
        <SectionCard title="Quality Breakdown">
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={qualityData} barSize={28}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11.5, fill: t.textMuted, fontFamily: "'DM Sans', sans-serif" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11.5, fill: t.textMuted, fontFamily: "'DM Sans', sans-serif" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={customTooltipStyle} cursor={{ fill: t.borderSoft }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {qualityData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      {/* ── Input types + Collection period ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Input types */}
        <SectionCard title="Input Types">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: <MessageSquare size={14} />, label: 'Text Feedback', val: stats.input_type_breakdown?.text || 0 },
              { icon: <Mic size={14} />, label: 'Audio Feedback', val: stats.input_type_breakdown?.audio || 0 },
            ].map(item => (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: t.surfaceTint,
                  border: `1px solid ${t.borderSoft}`,
                  borderRadius: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: t.textSecondary }}>
                  {item.icon}
                  <span style={{ fontSize: 13, fontWeight: 500, color: t.text }}>{item.label}</span>
                </div>
                <span
                  style={{
                    fontFamily: "'Instrument Serif', serif",
                    fontSize: 22,
                    fontWeight: 400,
                    color: t.text,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {item.val}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Collection period */}
        <SectionCard title="Collection Period">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Started', date: stats.feedback_collection_period?.start_date },
              { label: 'Latest', date: stats.feedback_collection_period?.end_date },
            ]
              .filter(d => d.date)
              .map(d => (
                <div
                  key={d.label}
                  style={{
                    padding: '12px 14px',
                    background: t.surfaceTint,
                    border: `1px solid ${t.borderSoft}`,
                    borderRadius: 10,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginBottom: 4,
                      fontSize: 10.5,
                      fontWeight: 600,
                      textTransform: 'uppercase' as const,
                      letterSpacing: '0.07em',
                      color: t.textMuted,
                    }}
                  >
                    <Clock size={11} />
                    {d.label}
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: t.text }}>
                    {new Date(d.date!).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              ))}
          </div>
        </SectionCard>
      </div>

      {/* ── Detailed sentiment ── */}
      <SectionCard title="Detailed Sentiment">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            {
              label: 'Positive',
              pct: stats.sentiment_distribution?.positive?.percentage || 0,
              count: stats.sentiment_distribution?.positive?.count || 0,
              color: t.green,
              bg: t.greenBg,
            },
            {
              label: 'Negative',
              pct: stats.sentiment_distribution?.negative?.percentage || 0,
              count: stats.sentiment_distribution?.negative?.count || 0,
              color: t.red,
              bg: t.redBg,
            },
            {
              label: 'Neutral',
              pct: stats.sentiment_distribution?.neutral?.percentage || 0,
              count: stats.sentiment_distribution?.neutral?.count || 0,
              color: t.textSecondary,
              bg: t.surfaceTint,
            },
          ].map(s => (
            <div
              key={s.label}
              style={{
                background: s.bg,
                border: `1px solid ${t.borderSoft}`,
                borderRadius: 10,
                padding: '14px 16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: s.color }}>
                  {s.label}
                </span>
                <span
                  style={{
                    fontFamily: "'Instrument Serif', serif",
                    fontSize: 22,
                    fontWeight: 400,
                    color: s.color,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {s.pct.toFixed(1)}%
                </span>
              </div>
              <p style={{ fontSize: 12, color: t.textMuted }}>{s.count} responses</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── Event summary ── */}
      <SectionCard title="Event Summary">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            `This event received ${stats.total_feedback || 0} feedback responses. The overall sentiment was ${overallLabel}, with ${stats.sentiment_distribution?.positive?.count || 0} positive and ${stats.sentiment_distribution?.negative?.count || 0} negative responses.`,
            `Feedback included ${stats.input_type_breakdown?.text || 0} text responses and ${stats.input_type_breakdown?.audio || 0} audio recordings. The average confidence score of ${((stats.avg_confidence || 0) * 100).toFixed(1)}% indicates ${(stats.avg_confidence || 0) > 0.8 ? 'high-quality, detailed' : (stats.avg_confidence || 0) > 0.6 ? 'good quality' : 'varied'} feedback.`,
            `Quality control flagged ${stats.quality_breakdown?.flagged || 0} items for review and rejected ${stats.quality_breakdown?.rejected || 0} low-quality submissions, while accepting ${stats.quality_breakdown?.accepted || 0} responses for analysis.`,
          ].map((text, i) => (
            <div
              key={i}
              style={{
                padding: '14px 16px',
                background: t.surfaceTint,
                border: `1px solid ${t.borderSoft}`,
                borderRadius: 10,
                fontSize: 13.5,
                color: t.textSecondary,
                lineHeight: 1.65,
              }}
            >
              {text}
            </div>
          ))}
        </div>
      </SectionCard>

    </div>
  );
}
