'use client';

import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Mic,
  Calendar,
  AlertTriangle,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import PageLoader from '@/components/PageLoader';
import api from '@/utils/api';
import type { EventFeedbackRead } from '@/types/api';

interface FeedbacksTabProps {
  eventId: string;
}

type SentimentFilter = 'all' | 'positive' | 'negative' | 'neutral';
type QualityFilter = 'all' | 'ACCEPT' | 'FLAG' | 'REJECT';
type TypeFilter = 'all' | 'text' | 'audio';

export default function FeedbacksTab({ eventId }: FeedbacksTabProps) {
  const [feedbacks, setFeedbacks] = useState<EventFeedbackRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>('all');
  const [qualityFilter, setQualityFilter] = useState<QualityFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [audioPlaying, setAudioPlaying] = useState<string | null>(null);

  useEffect(() => {
    fetchFeedbacks();
  }, [eventId]);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const response = await api.get<EventFeedbackRead[]>(`/events/${eventId}/feedback`);
      setFeedbacks(response.data || []);
    } catch (error) {
      console.error('Failed to fetch feedbacks:', error);
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredFeedbacks = feedbacks.filter((fb) => {
    const matchesSearch = (fb.raw_text || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSentiment = sentimentFilter === 'all' || (fb.sentiment || '').toLowerCase() === sentimentFilter.toLowerCase();
    const matchesQuality = qualityFilter === 'all' || (fb.quality_decision || '').toLowerCase() === qualityFilter.toLowerCase();
    const matchesType = typeFilter === 'all' || (fb.input_type || '').toLowerCase() === typeFilter.toLowerCase();
    return matchesSearch && matchesSentiment && matchesQuality && matchesType;
  });

  const getSentimentClasses = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-success bg-success/10 border-success/25';
      case 'negative': return 'text-danger bg-danger/10 border-danger/25';
      case 'neutral': return 'text-fg-secondary bg-hover-overlay border-card-border';
      default: return 'text-fg-secondary bg-hover-overlay border-card-border';
    }
  };

  const getSentimentDot = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-success';
      case 'negative': return 'bg-danger';
      default: return 'bg-fg-secondary/50';
    }
  };

  const getQualityIcon = (decision: string) => {
    switch (decision?.toUpperCase()) {
      case 'ACCEPT': return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'FLAG': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'REJECT': return <XCircle className="w-4 h-4 text-danger" />;
      default: return null;
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleAudioPlay = (id: string) => setAudioPlaying(id);
  const handleAudioPause = (id: string) => { if (audioPlaying === id) setAudioPlaying(null); };

  /* ── Filter pill component ──────────────────────────────────────────────── */
  const FilterPill = ({
    label, active, onClick,
  }: { label: string; active: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold transition-all active:scale-95
        ${active
          ? 'bg-fg text-bg shadow-sm'
          : 'bg-hover-overlay text-fg-secondary hover:text-fg hover:bg-card-border/40'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-5 animate-fade-up">

      {/* ── Filter panel ──────────────────────────────────────────────────────── */}
      <div className="bg-card-bg border border-card-border rounded-[20px] p-5 flex flex-col gap-4">
        {/* Header + search row */}
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-fg-secondary shrink-0" />
          <span className="text-[14px] font-bold text-fg tracking-tight">Filters</span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-secondary pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search feedback text…"
            className="w-full pl-10 pr-4 py-2.5 rounded-[12px] bg-bg-secondary border border-card-border text-[13.5px] text-fg placeholder:text-fg-secondary/50 focus:outline-none focus:border-accent/60 transition-colors"
          />
        </div>

        {/* Pill filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-[11px] font-bold text-fg-secondary uppercase tracking-widest mb-2">Sentiment</p>
            <div className="flex flex-wrap gap-1.5">
              {(['all', 'positive', 'negative', 'neutral'] as const).map(f => (
                <FilterPill key={f} label={f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)} active={sentimentFilter === f} onClick={() => setSentimentFilter(f)} />
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold text-fg-secondary uppercase tracking-widest mb-2">Quality</p>
            <div className="flex flex-wrap gap-1.5">
              {(['all', 'ACCEPT', 'FLAG', 'REJECT'] as const).map(f => (
                <FilterPill key={f} label={f === 'all' ? 'All' : f === 'ACCEPT' ? 'Accepted' : f === 'FLAG' ? 'Flagged' : 'Rejected'} active={qualityFilter === f} onClick={() => setQualityFilter(f)} />
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold text-fg-secondary uppercase tracking-widest mb-2">Type</p>
            <div className="flex flex-wrap gap-1.5">
              {(['all', 'text', 'audio'] as const).map(f => (
                <FilterPill key={f} label={f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)} active={typeFilter === f} onClick={() => setTypeFilter(f)} />
              ))}
            </div>
          </div>
        </div>

        {/* Result count */}
        <div className="pt-3 border-t border-card-border/50">
          <p className="text-[13px] text-fg-secondary">
            Showing <span className="font-bold text-fg">{filteredFeedbacks.length}</span> of{' '}
            <span className="font-bold text-fg">{feedbacks.length}</span> responses
          </p>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <PageLoader fullScreen={false} message="Loading feedback…" />
      ) : filteredFeedbacks.length === 0 ? (
        <div className="bg-card-bg border border-card-border rounded-[20px] p-14 text-center animate-fade-up">
          <MessageSquare className="w-10 h-10 text-fg-secondary/30 mx-auto mb-4" />
          <p className="text-[16px] font-bold text-fg mb-1.5 tracking-tight">
            {feedbacks.length === 0 ? 'No Feedback Yet' : 'No Results'}
          </p>
          <p className="text-[13px] text-fg-secondary">
            {feedbacks.length === 0
              ? 'No feedback has been submitted for this event yet.'
              : 'Try adjusting your search or filters.'}
          </p>
        </div>

      ) : (
        <div className="flex flex-col gap-3">
          {filteredFeedbacks.map((feedback, index) => {
            const isExpanded = expandedId === feedback.id;
            const isFlag = feedback.quality_decision === 'FLAG';
            const displayText = isFlag && feedback.normalized_text
              ? feedback.normalized_text
              : feedback.raw_text || '';

            return (
              <div
                key={feedback.id}
                className="bg-card-bg border border-card-border rounded-[16px] overflow-hidden transition-all duration-200 hover:border-accent/30 hover:shadow-md"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                {/* Card header — clickable */}
                <div
                  className="cursor-pointer px-5 py-4 hover:bg-hover-overlay transition-colors"
                  onClick={() => toggleExpanded(feedback.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">

                      {/* Top meta row */}
                      <div className="flex flex-wrap items-center gap-2.5 mb-3">
                        {/* Input type */}
                        {feedback.input_type === 'text'
                          ? <MessageSquare className="w-4 h-4 text-fg-secondary shrink-0" />
                          : <Mic className="w-4 h-4 text-fg-secondary shrink-0" />}

                        {/* Sentiment pill */}
                        {!isFlag && (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11.5px] font-bold border ${getSentimentClasses(feedback.sentiment || 'pending')}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${getSentimentDot(feedback.sentiment || '')}`} />
                            {feedback.sentiment
                              ? feedback.sentiment.charAt(0).toUpperCase() + feedback.sentiment.slice(1)
                              : 'Pending'}
                          </span>
                        )}

                        {/* Quality */}
                        <span className="inline-flex items-center gap-1 text-[12px] text-fg-secondary">
                          {getQualityIcon(feedback.quality_decision || 'ACCEPT')}
                          <span className="capitalize">{feedback.quality_decision?.toLowerCase() || 'accepted'}</span>
                        </span>

                        {/* Date */}
                        <span className="flex items-center gap-1 text-[12px] text-fg-secondary/60 ml-auto">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(feedback.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>

                      {/* Preview text */}
                      <p className="text-[14px] text-fg/80 leading-relaxed">
                        {displayText.substring(0, 200)}{displayText.length > 200 ? '…' : ''}
                      </p>

                      {/* Confidence */}
                      {feedback.confidence != null && !isFlag && (
                        <p className="text-[12px] text-fg-secondary mt-2">
                          Confidence: <span className="font-semibold text-fg">{(feedback.confidence * 100).toFixed(0)}%</span>
                        </p>
                      )}
                    </div>

                    {/* Chevron */}
                    <div className="text-fg-secondary/50 hover:text-fg-secondary transition-colors shrink-0 mt-0.5">
                      {isExpanded
                        ? <ChevronUp className="w-5 h-5" />
                        : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded panel — smooth height transition via max-height */}
                <div
                  className="overflow-hidden transition-all duration-300 ease-in-out"
                  style={{ maxHeight: isExpanded ? '9999px' : '0px' }}
                >
                  <div className="border-t border-card-border/50 bg-bg-secondary/40 px-5 py-5 flex flex-col gap-5">

                    {/* Full text */}
                    <div>
                      <p className="text-[11px] font-bold text-fg-secondary uppercase tracking-widest mb-2">Full Response</p>
                      <p className="text-[14px] text-fg/85 leading-[1.8] whitespace-pre-wrap">
                        {isFlag && feedback.normalized_text ? feedback.normalized_text : feedback.raw_text}
                      </p>
                    </div>

                    {/* Audio */}
                    {feedback.input_type === 'audio' && feedback.audio_path && (
                      <div>
                        <p className="text-[11px] font-bold text-fg-secondary uppercase tracking-widest mb-2">Audio Recording</p>
                        <audio
                          controls
                          className="w-full rounded-lg"
                          onPlay={() => handleAudioPlay(feedback.id)}
                          onPause={() => handleAudioPause(feedback.id)}
                        >
                          <source src={feedback.audio_path} type="audio/webm" />
                        </audio>
                      </div>
                    )}

                    {/* Quality flags */}
                    {feedback.quality_flags && (
                      <div>
                        <p className="text-[11px] font-bold text-amber-500 uppercase tracking-widest mb-2">Quality Flags</p>
                        <div className="flex flex-wrap gap-2">
                          {(() => {
                            try {
                              const flags = typeof feedback.quality_flags === 'string'
                                ? JSON.parse(feedback.quality_flags)
                                : feedback.quality_flags;
                              return (Array.isArray(flags) ? flags : []).map((flag: string, i: number) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-500"
                                >
                                  <AlertTriangle className="w-3 h-3" />
                                  {flag.replace(/_/g, ' ')}
                                </span>
                              ));
                            } catch {
                              return <span className="text-[12px] text-fg-secondary">{feedback.quality_flags}</span>;
                            }
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Metadata grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {feedback.quality_decision !== 'FLAG' && (
                        <>
                          <div className="bg-card-bg border border-card-border rounded-[12px] p-3">
                            <p className="text-[11px] font-bold text-fg-secondary uppercase tracking-widest mb-1">Sentiment</p>
                            <p className="text-[13px] font-semibold text-fg capitalize">{feedback.sentiment || 'Pending'}</p>
                          </div>
                          <div className="bg-card-bg border border-card-border rounded-[12px] p-3">
                            <p className="text-[11px] font-bold text-fg-secondary uppercase tracking-widest mb-1">Confidence</p>
                            <p className="text-[13px] font-semibold text-fg">
                              {feedback.confidence ? `${(feedback.confidence * 100).toFixed(1)}%` : 'Pending'}
                            </p>
                          </div>
                        </>
                      )}
                      <div className="bg-card-bg border border-card-border rounded-[12px] p-3">
                        <p className="text-[11px] font-bold text-fg-secondary uppercase tracking-widest mb-1">Quality</p>
                        <p className="text-[13px] font-semibold text-fg capitalize">{feedback.quality_decision?.toLowerCase() || 'accepted'}</p>
                      </div>
                      <div className="bg-card-bg border border-card-border rounded-[12px] p-3">
                        <p className="text-[11px] font-bold text-fg-secondary uppercase tracking-widest mb-1">Type</p>
                        <p className="text-[13px] font-semibold text-fg capitalize">{feedback.input_type}</p>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
