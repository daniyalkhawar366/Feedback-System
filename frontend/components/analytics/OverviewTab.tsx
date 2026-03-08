'use client';

import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Mic,
  Loader2,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Activity,
  ArrowRight,
  ThumbsUp,
  BarChart2,
  Flag
} from 'lucide-react';
import PageLoader from '@/components/PageLoader';
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
  LabelList,
} from 'recharts';
import api from '@/utils/api';
import type { EventStats, ConsensusReport } from '@/types/api';

interface OverviewTabProps {
  eventId: string;
  feedbackOpenAt?: string | null;
  feedbackCloseAt?: string | null;
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function OverviewTab({ eventId, feedbackOpenAt, feedbackCloseAt }: OverviewTabProps) {
  const [stats, setStats] = useState<EventStats | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [hasReport, setHasReport] = useState<boolean | null>(null);
  const [loadingReport, setLoadingReport] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchStats();
    checkForReport();
  }, [eventId]);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const response = await api.get<EventStats>(`/analytics/events/${eventId}/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const checkForReport = async () => {
    try {
      setLoadingReport(true);
      const response = await api.get(`/api/reports/events/${eventId}/latest`);
      setHasReport(!!response.data);
      setReportData(response.data);
    } catch {
      setHasReport(false);
      setReportData(null);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      await api.post(`/api/reports/events/${eventId}/generate`);
      await checkForReport();
      setShowSuccessModal(true);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.detail || 'Failed to generate report. Please try again.');
      setShowErrorModal(true);
    } finally {
      setGenerating(false);
    }
  };

  // ── Loading State ───────────────────────────────────────────────────────
  if (loadingStats || loadingReport) {
    return <PageLoader fullScreen={false} message="Analyzing feedback data…" />;
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-32 animate-fade-up">
        <p className="text-[14px] text-fg-secondary font-medium tracking-wide">
          No statistics available.
        </p>
      </div>
    );
  }

  const noFeedback = (stats.total_feedback || 0) === 0;

  // ── Empty / Pre-Report State ─────────────────────────────────────────────
  if (!hasReport) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col pt-4 animate-fade-up">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card-bg border border-card-border p-6 rounded-[20px] shadow-sm flex flex-col items-center justify-center text-center">
            <h3 className="text-[13px] font-bold text-fg-secondary uppercase tracking-widest mb-2">Total Responses</h3>
            <span className="text-5xl font-bold font-mono text-fg">{stats.total_feedback || 0}</span>
          </div>
          <div className="bg-card-bg border border-card-border p-6 rounded-[20px] shadow-sm flex flex-col items-center justify-center text-center">
            <h3 className="text-[13px] font-bold text-fg-secondary uppercase tracking-widest mb-2">Text Inputs</h3>
            <span className="text-5xl font-bold font-mono text-fg">{stats.input_type_breakdown?.text || 0}</span>
          </div>
          <div className="bg-card-bg border border-card-border p-6 rounded-[20px] shadow-sm flex flex-col items-center justify-center text-center">
            <h3 className="text-[13px] font-bold text-fg-secondary uppercase tracking-widest mb-2">Audio Clips</h3>
            <span className="text-5xl font-bold font-mono text-fg">{stats.input_type_breakdown?.audio || 0}</span>
          </div>
        </div>

        {/* Generate Action Area */}
        <div className="relative overflow-hidden flex flex-col items-center justify-center py-20 px-6 border border-card-border rounded-[24px] bg-card-bg shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none" />

          <div className="w-16 h-16 bg-accent text-bg rounded-[20px] flex items-center justify-center mb-6 shadow-lg shadow-accent/20">
            <Activity className="w-7 h-7" />
          </div>

          <h2 className="text-[22px] font-bold text-fg mb-3 tracking-tight">
            {noFeedback ? 'Awaiting Feedback' : 'Analysis Dashboard Ready'}
          </h2>
          <p className="text-[15px] text-fg-secondary max-w-[420px] text-center mb-10 leading-relaxed">
            {noFeedback
              ? 'Your dashboard visuals will populate once attendees begin submitting their feedback responses.'
              : `You have ${stats.total_feedback} entries. Generate an AI intelligence report to extract sentiment, quality, and insights.`}
          </p>

          <button
            onClick={handleGenerateReport}
            disabled={generating || noFeedback}
            className={`
              inline-flex items-center gap-2.5 px-8 py-4 rounded-[16px] font-semibold text-[15px] transition-all
              ${noFeedback || generating
                ? 'bg-hover-overlay text-fg-secondary cursor-not-allowed'
                : 'bg-fg text-bg hover:opacity-90 active:scale-[0.98] shadow-md hover:shadow-lg'
              }
            `}
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing Report...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                Generate Visual Report
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ── Full Analytics View ──────────────────────────────────────────────────

  // Calculations
  const flagged = stats.quality_breakdown?.flagged || 0;

  const posCount = stats.sentiment_distribution?.positive?.count || 0;
  const neuCount = stats.sentiment_distribution?.neutral?.count || 0;
  const negCount = stats.sentiment_distribution?.negative?.count || 0;

  const posPct = stats.sentiment_distribution?.positive?.percentage || 0;
  const confidence = ((stats.avg_confidence || 0) * 100).toFixed(1);

  const sentimentData = [
    { name: 'Positive', value: posCount, color: 'var(--success)' },
    { name: 'Neutral', value: neuCount, color: 'var(--fg-secondary)' },
    { name: 'Negative', value: negCount, color: 'var(--danger)' },
  ].filter(d => d.value > 0);

  const qualityTotal = (stats.quality_breakdown?.accepted || 0) + flagged + (stats.quality_breakdown?.rejected || 0) || 1;
  const qualityData = [
    { name: 'Accepted', value: parseFloat((((stats.quality_breakdown?.accepted || 0) / qualityTotal) * 100).toFixed(1)), color: 'var(--success)' },
    { name: 'Flagged', value: parseFloat(((flagged / qualityTotal) * 100).toFixed(1)), color: '#f59e0b' },
    { name: 'Rejected', value: parseFloat((((stats.quality_breakdown?.rejected || 0) / qualityTotal) * 100).toFixed(1)), color: 'var(--danger)' },
  ];

  const tooltipStyle = {
    backgroundColor: 'var(--card-bg)',
    border: '1px solid var(--card-border)',
    borderRadius: '12px',
    boxShadow: '0 8px 24px -6px rgba(0,0,0,0.1)',
    color: 'var(--fg)',
    fontWeight: 500,
    fontSize: '13px',
    padding: '10px 14px'
  };

  return (
    <div className="animate-fade-up flex flex-col gap-6">

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <div className="bg-card-bg border border-card-border p-6 rounded-[20px] shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-all duration-300 group-hover:scale-125 group-hover:rotate-12 text-fg-secondary group-hover:text-fg">
            <MessageSquare size={48} />
          </div>
          <h3 className="text-[13px] font-semibold text-fg-secondary mb-6 relative z-10">Total Responses</h3>
          <div className="text-[40px] font-bold font-mono text-fg leading-none tracking-tight relative z-10">
            {stats.total_feedback || 0}
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-card-bg border border-card-border p-6 rounded-[20px] shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-all duration-300 group-hover:scale-125 group-hover:-rotate-12 text-fg-secondary group-hover:text-accent">
            <BarChart2 size={48} />
          </div>
          <h3 className="text-[13px] font-semibold text-fg-secondary mb-6 relative z-10">Confidence Score</h3>
          <div className="text-[40px] font-bold font-mono text-fg leading-none tracking-tight relative z-10">
            {confidence}%
          </div>
        </div>

        {/* Metric 3 */}
        <div className={`border p-6 rounded-[20px] shadow-sm flex flex-col justify-between relative overflow-hidden group ${flagged > 0 ? 'bg-danger/5 border-danger/20' : 'bg-card-bg border-card-border'}`}>
          <div className={`absolute top-0 right-0 p-6 transition-all duration-300 group-hover:scale-125 group-hover:rotate-12 ${flagged > 0 ? 'opacity-10 group-hover:opacity-40 text-danger' : 'opacity-20 group-hover:opacity-40 text-fg-secondary group-hover:text-danger'}`}>
            <Flag size={48} />
          </div>
          <h3 className={`text-[13px] font-semibold mb-6 relative z-10 ${flagged > 0 ? 'text-danger/80' : 'text-fg-secondary'}`}>Flagged Issues</h3>
          <div className={`text-[40px] font-bold font-mono leading-none tracking-tight relative z-10 ${flagged > 0 ? 'text-danger' : 'text-fg'}`}>
            {flagged}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* ── Sentiment Visual ── */}
        <div className="bg-card-bg border border-card-border rounded-[20px] shadow-sm p-6 flex flex-col h-[380px]">
          <h3 className="text-[16px] font-bold text-fg mb-2">Sentiment Breakdown</h3>
          <p className="text-[13px] text-fg-secondary mb-6">Visual volume distribution of analyzed feedback sentiments.</p>

          <div className="flex-1 w-full relative">
            {sentimentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={75}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {sentimentData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} cursor={false} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-[13px] font-medium text-fg-secondary bg-bg-secondary/30 rounded-full mx-10">No sentiment data available</div>
            )}

            {/* Center Label inside Donut */}
            {sentimentData.length > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[32px] font-bold font-mono text-fg leading-none">{posPct.toFixed(0)}%</span>
                <span className="text-[12px] font-semibold text-success uppercase tracking-wider mt-1">Positive</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Quality Visual ── */}
        <div className="bg-card-bg border border-card-border rounded-[20px] shadow-sm p-6 flex flex-col h-[380px]">
          <h3 className="text-[16px] font-bold text-fg mb-2">Quality & Moderation</h3>
          <p className="text-[13px] text-fg-secondary mb-6">Automated filtering outcomes from the intelligence engine.</p>

          <div className="flex-1 w-full p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={qualityData} layout="vertical" margin={{ top: 0, right: 45, left: 10, bottom: 0 }} barSize={32}>
                <XAxis type="number" hide domain={[0, 100]} />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 13, fill: 'var(--fg)', fontWeight: 600 }}
                  width={80}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: 'var(--bg-secondary)', opacity: 0.5 }}
                  formatter={(val: any) => [`${val}%`, '']}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {qualityData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                  <LabelList
                    dataKey="value"
                    position="right"
                    fill="var(--fg)"
                    fontSize={13}
                    fontWeight={700}
                    // @ts-ignore
                    formatter={(val: any) => `${val}%`}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>


      {/* -- Intelligence Summary Card -- */}
      {reportData && (
        <div className="bg-card-bg border border-card-border rounded-[20px] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-card-border/50">
            <div className="flex items-center gap-2.5">
              <FileText size={15} className="text-accent" />
              <span className="text-[14px] font-bold text-fg tracking-tight">Intelligence Summary</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-hover-overlay text-[11px] font-semibold text-fg-secondary font-mono">
                {reportData.generated_at ? new Date(reportData.generated_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Just now"}
              </span>
              {typeof reportData.generation_time === "number" && (
                <span className="px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-[11px] font-semibold text-accent font-mono">
                  {reportData.generation_time.toFixed(1)}s
                </span>
              )}
            </div>
          </div>
          <div className="px-6 py-6">
            <p className="text-[14px] leading-[1.8] text-fg/75">
              {reportData.summary?.main_summary || reportData.report?.executive_summary || "No summary available."}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ── Collection Status ── */}
        <div className="bg-card-bg border border-card-border p-6 rounded-[20px] shadow-sm flex flex-col justify-center">
          <h3 className="text-[16px] font-bold text-fg mb-6">Collection Timeline</h3>
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-card-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-bg-secondary flex items-center justify-center text-fg-secondary">
                <Clock size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-semibold text-fg-secondary uppercase tracking-widest mb-0.5">Opened</span>
                <span className="text-[14px] font-semibold text-fg">
                  {feedbackOpenAt
                    ? new Date(feedbackOpenAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                    : '-'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                <Activity size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-semibold text-fg-secondary uppercase tracking-widest mb-0.5">Status / Closed</span>
                <span className="text-[14px] font-semibold text-fg">
                  {feedbackCloseAt
                    ? new Date(feedbackCloseAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                    : <span className="text-accent flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-accent animate-pulse" /> Active Collection</span>}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Input Medium ── */}
        <div className="bg-card-bg border border-card-border p-6 rounded-[20px] shadow-sm grid grid-cols-2 gap-4">
          <div className="flex flex-col col-span-2">
            <h3 className="text-[16px] font-bold text-fg mb-2">Feedback Mediums</h3>
            <p className="text-[13px] text-fg-secondary mb-4">Formats of submitted items.</p>
          </div>
          <div className="bg-bg-secondary/50 rounded-[16px] border border-card-border/50 p-5 flex flex-col items-center justify-center text-center transition-colors">
            <span className="text-[32px] font-bold font-mono text-fg leading-none mb-1">{stats.input_type_breakdown?.text || 0}</span>
            <span className="text-[13px] font-bold text-fg-secondary uppercase tracking-widest">Text</span>
          </div>
          <div className="bg-bg-secondary/50 rounded-[16px] border border-card-border/50 p-5 flex flex-col items-center justify-center text-center transition-colors">
            <span className="text-[32px] font-bold font-mono text-fg leading-none mb-1">{stats.input_type_breakdown?.audio || 0}</span>
            <span className="text-[13px] font-bold text-fg-secondary uppercase tracking-widest">Audio</span>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card-bg border border-card-border rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in duration-300">
            <div className="flex items-center gap-3 mb-4 text-success">
              <CheckCircle2 className="w-5 h-5" />
              <h3 className="text-[16px] font-bold tracking-tight text-fg">Report Available</h3>
            </div>
            <p className="text-[14px] text-fg-secondary leading-relaxed mb-6">
              The intelligence engine has finished computing. Your dashboard has been updated.
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-2.5 rounded-lg text-[13px] font-bold bg-fg text-bg hover:opacity-90 transition-opacity"
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}

      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card-bg border border-card-border rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in duration-300">
            <div className="flex items-center gap-3 mb-4 text-danger">
              <AlertCircle className="w-5 h-5" />
              <h3 className="text-[16px] font-bold tracking-tight text-fg">Generation Failed</h3>
            </div>
            <p className="text-[14px] text-fg-secondary leading-relaxed mb-6">
              {errorMessage}
            </p>
            <button
              onClick={() => setShowErrorModal(false)}
              className="w-full py-2.5 rounded-lg text-[13px] font-bold bg-danger text-white hover:bg-danger/90 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
