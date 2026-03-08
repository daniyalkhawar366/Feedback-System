'use client';

import { useState, useEffect } from 'react';
import {
  Check,
  TrendingUp,
  Loader2,
  FileText,
  AlertTriangle,
  Quote,
  RefreshCw,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import PageLoader from '@/components/PageLoader';
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
  generation_time?: number;
  generated_at?: string;
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

  useEffect(() => { fetchData(); }, [eventId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reportRes, feedbackRes] = await Promise.all([
        api.get(`/api/reports/events/${eventId}/latest`).catch(() => ({ data: null })),
        api.get(`/events/${eventId}/feedback`).catch(() => ({ data: [] })),
      ]);
      setReport(reportRes.data);
      setFeedbacks(feedbackRes.data || []);
    } catch { }
    finally { setLoading(false); }
  };

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      await api.post(`/api/reports/events/${eventId}/generate`);
      await fetchData();
    } catch (error: any) {
      console.error(error);
    } finally { setGenerating(false); }
  };

  const topPoints = report?.summary?.top_weighted_points?.slice(0, 5) || [];

  if (loading) {
    return <PageLoader fullScreen={false} message="Loading insights…" />;
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center py-32 animate-fade-up">
        <div className="w-14 h-14 bg-accent/10 text-accent rounded-2xl flex items-center justify-center mb-6">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-[22px] font-bold text-fg mb-2 tracking-tight">No Insights Yet</h2>
        <p className="text-[14px] text-fg-secondary max-w-[380px] text-center mb-8 leading-relaxed">
          {feedbacks.length === 0
            ? 'Waiting for feedback responses.'
            : `Generate a report to extract insights from ${feedbacks.length} responses.`}
        </p>
        <button
          onClick={handleGenerateReport}
          disabled={generating || feedbacks.length === 0}
          className={`inline-flex items-center gap-2 px-7 py-3.5 rounded-[14px] font-semibold text-[14px] transition-all
            ${feedbacks.length === 0 || generating
              ? 'bg-hover-overlay text-fg-secondary cursor-not-allowed'
              : 'bg-fg text-bg hover:opacity-90 active:scale-[0.98] shadow-md'}`}
        >
          {generating
            ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</>
            : <><FileText className="w-4 h-4" />Generate AI Report</>}
        </button>
      </div>
    );
  }

  const hasHighlights = (report.highlights?.length ?? 0) > 0;
  const hasConcerns = (report.concerns?.length ?? 0) > 0;
  const hasTopPoints = topPoints.length > 0;
  const hasNextSteps = (report.next_steps?.length ?? 0) > 0;
  const hasAny = hasHighlights || hasConcerns || hasTopPoints || hasNextSteps;

  return (
    <div className="animate-fade-up flex flex-col gap-6">

      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-fg tracking-tight">Key Insights</h2>
          <p className="text-[13px] text-fg-secondary mt-0.5">AI-extracted patterns from your feedback data.</p>
        </div>
        <button
          onClick={handleGenerateReport}
          disabled={generating}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-card-border bg-card-bg text-[12.5px] font-semibold text-fg-secondary hover:text-accent hover:border-accent/40 transition-all shadow-sm disabled:opacity-40"
        >
          <RefreshCw size={12} className={generating ? 'animate-spin' : ''} />
          {generating ? 'Regenerating…' : 'Regenerate'}
        </button>
      </div>

      {!hasAny && (
        <p className="text-[14px] text-fg-secondary text-center py-12">No findings in this report.</p>
      )}

      {hasAny && (
        <div className="bg-card-bg border border-card-border rounded-[24px] overflow-hidden divide-y divide-card-border/40">

          {/* ── WHAT WENT GREAT ── */}
          {hasHighlights && (
            <section className="px-8 pt-8 pb-7">
              {/* Big heading */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-1 h-8 rounded-full bg-success shrink-0" />
                <div className="flex-1">
                  <p className="text-[18px] font-bold text-fg tracking-tight leading-none mb-0.5">
                    What Went Great
                  </p>
                  <p className="text-[12px] text-fg-secondary font-medium">
                    {report.highlights!.length} strengths identified
                  </p>
                </div>
                <Check size={18} className="text-success opacity-60" />
              </div>
              {/* Items */}
              <div className="flex flex-col pl-5 border-l border-success/20">
                {report.highlights!.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3.5 py-3.5 border-b border-card-border/30 last:border-0 group -ml-5 pl-5 hover:bg-success/[0.03] transition-colors rounded-r-lg"
                  >
                    <div className="w-5 h-5 rounded-full bg-success/15 flex items-center justify-center mt-0.5 shrink-0 group-hover:bg-success/25 transition-colors">
                      <Check size={10} strokeWidth={3} className="text-success" />
                    </div>
                    <p className="text-[14px] text-fg/80 leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── AREAS TO IMPROVE ── */}
          {hasConcerns && (
            <section className="px-8 pt-8 pb-7">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-1 h-8 rounded-full bg-amber-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-[18px] font-bold text-fg tracking-tight leading-none mb-0.5">
                    Areas to Improve
                  </p>
                  <p className="text-[12px] text-fg-secondary font-medium">
                    {report.concerns!.length} concerns flagged
                  </p>
                </div>
                <AlertTriangle size={17} className="text-amber-500 opacity-60" />
              </div>
              <div className="flex flex-col pl-5 border-l border-amber-500/20">
                {report.concerns!.map((item, i) => {
                  const [issue, action] = item.split('→').map(s => s.trim());
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-3.5 py-3.5 border-b border-card-border/30 last:border-0 group -ml-5 pl-5 hover:bg-amber-500/[0.03] transition-colors rounded-r-lg"
                    >
                      <div className="w-5 h-5 rounded-full bg-amber-500/15 flex items-center justify-center mt-0.5 shrink-0 group-hover:bg-amber-500/25 transition-colors">
                        <AlertTriangle size={9} strokeWidth={2.5} className="text-amber-500" />
                      </div>
                      <div className="flex flex-col gap-1.5 flex-1">
                        <p className="text-[14px] text-fg/80 leading-relaxed">{issue}</p>
                        {action && (
                          <p className="text-[12px] text-success font-medium flex items-center gap-1">
                            <ArrowRight size={10} />{action}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── TOP FEEDBACK POINTS ── */}
          {hasTopPoints && (
            <section className="px-8 pt-8 pb-7">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-1 h-8 rounded-full bg-accent shrink-0" />
                <div className="flex-1">
                  <p className="text-[18px] font-bold text-fg tracking-tight leading-none mb-0.5">
                    Top Feedback Points
                  </p>
                  <p className="text-[12px] text-fg-secondary font-medium">
                    Highest-weight responses from attendees
                  </p>
                </div>
                <Quote size={18} className="text-accent opacity-60" />
              </div>
              <div className="flex flex-col pl-5 border-l border-accent/20">
                {topPoints.map((point, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3.5 py-3.5 border-b border-card-border/30 last:border-0 group -ml-5 pl-5 hover:bg-accent/[0.03] transition-colors rounded-r-lg"
                  >
                    <div className="w-5 h-5 rounded-full bg-accent/15 flex items-center justify-center mt-0.5 shrink-0">
                      <Quote size={8} strokeWidth={2.5} className="text-accent" />
                    </div>
                    <p className="text-[14px] text-fg/75 leading-relaxed italic">"{point}"</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── RECOMMENDED NEXT STEPS ── */}
          {hasNextSteps && (
            <section className="px-8 pt-8 pb-7">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-1 h-8 rounded-full bg-fg/30 shrink-0" />
                <div className="flex-1">
                  <p className="text-[18px] font-bold text-fg tracking-tight leading-none mb-0.5">
                    Recommended Next Steps
                  </p>
                  <p className="text-[12px] text-fg-secondary font-medium">
                    {report.next_steps!.length} action items
                  </p>
                </div>
                <TrendingUp size={17} className="text-fg-secondary opacity-60" />
              </div>
              <div className="flex flex-col pl-5 border-l border-card-border">
                {report.next_steps!.map((step, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3.5 py-3.5 border-b border-card-border/30 last:border-0 group -ml-5 pl-5 hover:bg-hover-overlay transition-colors rounded-r-lg"
                  >
                    <div className="w-5 h-5 rounded-full bg-fg/8 flex items-center justify-center mt-0.5 shrink-0">
                      <TrendingUp size={9} strokeWidth={2.5} className="text-fg-secondary" />
                    </div>
                    <p className="text-[14px] text-fg/80 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      )}
    </div>
  );
}
