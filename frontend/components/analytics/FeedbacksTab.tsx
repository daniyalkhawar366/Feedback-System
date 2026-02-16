'use client';

import { useState, useEffect } from 'react';
import {
  Loader2,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Mic,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
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
      console.log('Fetched feedbacks:', response.data);
      setFeedbacks(response.data || []);
    } catch (error) {
      console.error('Failed to fetch feedbacks:', error);
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredFeedbacks = feedbacks.filter((fb) => {
    // Text search
    const matchesSearch = (fb.raw_text || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    // Sentiment filter
    const matchesSentiment = sentimentFilter === 'all' || (fb.sentiment || '').toLowerCase() === sentimentFilter.toLowerCase();
    
    // Quality filter
    const matchesQuality = qualityFilter === 'all' || (fb.quality_decision || '').toLowerCase() === qualityFilter.toLowerCase();
    
    // Type filter
    const matchesType = typeFilter === 'all' || (fb.input_type || '').toLowerCase() === typeFilter.toLowerCase();
    
    return matchesSearch && matchesSentiment && matchesQuality && matchesType;
  });

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-[#059669] bg-[#D1FAE5] border-[#6EE7B7]';
      case 'negative':
        return 'text-[#DC2626] bg-[#FEE2E2] border-[#FCA5A5]';
      case 'neutral':
        return 'text-[#6B7280] bg-[#F3F4F6] border-[#D1D5DB]';
      case 'pending':
        return 'text-blue-600 bg-blue-50 border-blue-400';
      default:
        return 'text-[#6B7280] bg-[#F3F4F6] border-[#D1D5DB]';
    }
  };

  const getQualityIcon = (decision: string) => {
    switch (decision?.toUpperCase()) {
      case 'ACCEPT':
        return <CheckCircle2 className="w-4 h-4" style={{ color: '#10B981' }} />;
      case 'FLAG':
        return <AlertTriangle className="w-4 h-4" style={{ color: '#F59E0B' }} />;
      case 'REJECT':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const toggleExpanded = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleAudioPlay = (id: number) => {
    setAudioPlaying(id);
  };

  const handleAudioPause = (id: number) => {
    if (audioPlaying === id) {
      setAudioPlaying(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4" style={{ backgroundColor: '#F9FAFB' }}>
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-5 h-5 text-gray-900" />
          <h3
            className="text-lg font-bold text-gray-900"
            style={{ letterSpacing: '-0.02em' }}
          >
            Filters
          </h3>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-5 h-5" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search feedback text..."
            className="w-full rounded-xl bg-white"
            style={{
              paddingLeft: '40px',
              paddingRight: '16px',
              paddingTop: '12px',
              paddingBottom: '12px',
              border: '1px solid #E5E7EB',
              color: '#111827',
              fontSize: '15px',
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = 'none';
              e.currentTarget.style.border = '1px solid #6366F1';
            }}
            onBlur={(e) => {
              e.currentTarget.style.border = '1px solid #E5E7EB';
            }}
          />
        </div>

        {/* Filter Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Sentiment Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Sentiment
            </label>
            <div className="flex flex-wrap gap-2">
              {(['all', 'positive', 'negative', 'neutral'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSentimentFilter(filter)}
                  className="transition-all"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 500,
                    backgroundColor: sentimentFilter === filter ? '#6366F1' : '#FFFFFF',
                    color: sentimentFilter === filter ? '#FFFFFF' : '#6B7280',
                    border: sentimentFilter === filter ? 'none' : '1px solid #E5E7EB',
                  }}
                  onMouseEnter={(e) => {
                    if (sentimentFilter !== filter) {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F9FAFB';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (sentimentFilter !== filter) {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FFFFFF';
                    }
                  }}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Quality Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Quality
            </label>
            <div className="flex flex-wrap gap-2">
              {(['all', 'ACCEPT', 'FLAG', 'REJECT'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setQualityFilter(filter)}
                  className="transition-all"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 500,
                    backgroundColor: qualityFilter === filter ? '#6366F1' : '#FFFFFF',
                    color: qualityFilter === filter ? '#FFFFFF' : '#6B7280',
                    border: qualityFilter === filter ? 'none' : '1px solid #E5E7EB',
                  }}
                  onMouseEnter={(e) => {
                    if (qualityFilter !== filter) {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F9FAFB';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (qualityFilter !== filter) {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FFFFFF';
                    }
                  }}
                >
                  {filter === 'all' ? 'All' : filter === 'ACCEPT' ? 'Accepted' : filter === 'FLAG' ? 'Flagged' : 'Rejected'}
                </button>
              ))}
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Type
            </label>
            <div className="flex flex-wrap gap-2">
              {(['all', 'text', 'audio'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTypeFilter(filter)}
                  className="transition-all"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 500,
                    backgroundColor: typeFilter === filter ? '#6366F1' : '#FFFFFF',
                    color: typeFilter === filter ? '#FFFFFF' : '#6B7280',
                    border: typeFilter === filter ? 'none' : '1px solid #E5E7EB',
                  }}
                  onMouseEnter={(e) => {
                    if (typeFilter !== filter) {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F9FAFB';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (typeFilter !== filter) {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FFFFFF';
                    }
                  }}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredFeedbacks.length}</span> of{' '}
            <span className="font-semibold text-gray-900">{feedbacks.length}</span> feedbacks
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-indigo-600" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p
            className="text-lg font-bold text-gray-900 mb-2"
            style={{ letterSpacing: '-0.02em' }}
          >
            {feedbacks.length === 0 ? 'No Feedback Yet' : 'No feedbacks match your filters'}
          </p>
          <p className="text-gray-600">
            {feedbacks.length === 0 ? 'No feedback has been submitted for this event yet.' : 'Try adjusting your search or filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFeedbacks.map((feedback) => (
            <div
              key={feedback.id}
              className="bg-white overflow-hidden transition-all"
              style={{
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
              }}
            >
              {/* Header */}
              <div
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ padding: '16px' }}
                onClick={() => toggleExpanded(feedback.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      {feedback.input_type === 'text' ? (
                        <MessageSquare className="w-5 h-5 text-gray-900 shrink-0" />
                      ) : (
                        <Mic className="w-5 h-5 text-gray-900 shrink-0" />
                      )}
                    </div>
                    <p className="leading-relaxed mb-3" style={{ fontSize: '15px', color: '#111827', lineHeight: 1.6, fontWeight: 400 }}>
                      {(() => {
                        // Show censored text for flagged feedbacks, otherwise raw text
                        const displayText = feedback.quality_decision === 'FLAG' && feedback.normalized_text
                          ? feedback.normalized_text
                          : feedback.raw_text || '';
                        return displayText.substring(0, 200) + (displayText.length > 200 ? '...' : '');
                      })()}
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Hide sentiment for flagged feedbacks */}
                      {feedback.quality_decision !== 'FLAG' && (
                        <span
                          style={{
                            padding: '4px 12px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: 600,
                          }}
                          className={`inline-flex items-center border ${getSentimentColor(
                            feedback.sentiment || 'pending'
                          )}`}
                        >
                          {feedback.sentiment ? feedback.sentiment.charAt(0).toUpperCase() + feedback.sentiment.slice(1) : 'Pending'}
                        </span>
                      )}
                      <div className="flex items-center gap-1.5" style={{ fontSize: '13px', color: '#6B7280' }}>
                        {getQualityIcon(feedback.quality_decision || 'ACCEPT')}
                        <span className="capitalize">{feedback.quality_decision?.toLowerCase() || 'accepted'}</span>
                      </div>
                      <div className="flex items-center gap-1.5" style={{ fontSize: '13px', color: '#9CA3AF' }}>
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(feedback.created_at).toLocaleDateString()}
                      </div>
                      <span style={{ fontSize: '13px', color: '#6B7280' }}>
                        Confidence: {((feedback.confidence || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <button className="transition-colors" style={{ color: '#9CA3AF' }} onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.color = '#6B7280'} onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF'}>
                    {expandedId === feedback.id ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedId === feedback.id && (
                <div className="border-t space-y-4" style={{ padding: '16px', borderTopColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
                  {/* Full Text */}
                  <div>
                    <h4 className="mb-2" style={{ fontSize: '13px', fontWeight: 600, color: '#6B7280', marginBottom: '8px' }}>
                      Feedback Text
                    </h4>
                    <p className="whitespace-pre-wrap" style={{ fontSize: '15px', color: '#111827', lineHeight: 1.6 }}>
                      {/* Show censored text for flagged feedbacks */}
                      {feedback.quality_decision === 'FLAG' && feedback.normalized_text
                        ? feedback.normalized_text
                        : feedback.raw_text}
                    </p>
                  </div>

                  {/* Audio Player */}
                  {feedback.input_type === 'audio' && feedback.audio_path && (
                    <div>
                      <h4 className="mb-2" style={{ fontSize: '13px', fontWeight: 600, color: '#6B7280', marginBottom: '8px' }}>
                        Audio Recording
                      </h4>
                      <audio
                        controls
                        className="w-full"
                        onPlay={() => handleAudioPlay(feedback.id)}
                        onPause={() => handleAudioPause(feedback.id)}
                      >
                        <source src={feedback.audio_path} type="audio/webm" />
                        Your browser does not support audio playback.
                      </audio>
                    </div>
                  )}

                  {/* Quality Flags */}
                  {feedback.quality_flags && (
                    <div>
                      <h4 className="mb-2" style={{ fontSize: '13px', fontWeight: 600, color: '#6B7280', marginBottom: '8px' }}>
                        Quality Flags
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          try {
                            const flags = typeof feedback.quality_flags === 'string' 
                              ? JSON.parse(feedback.quality_flags)
                              : feedback.quality_flags;
                            return (Array.isArray(flags) ? flags : []).map((flag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200"
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                                {flag.replace(/_/g, ' ')}
                              </span>
                            ));
                          } catch {
                            return (
                              <span className="text-xs text-gray-600">
                                {feedback.quality_flags}
                              </span>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Metadata Grid */}
                  <div className="rounded-lg" style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '16px' }}>
                    <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: '16px' }}>
                    {/* Hide sentiment for flagged feedbacks */}
                    {feedback.quality_decision !== 'FLAG' && (
                      <>
                        <div className="bg-white rounded-lg" style={{ padding: '12px', border: '1px solid #E5E7EB' }}>
                          <p className="mb-1" style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sentiment</p>
                          <p className="capitalize" style={{ fontSize: '14px', color: '#111827', fontWeight: 500 }}>
                            {feedback.sentiment || 'Pending'}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg" style={{ padding: '12px', border: '1px solid #E5E7EB' }}>
                          <p className="mb-1" style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confidence</p>
                          <p style={{ fontSize: '14px', color: '#111827', fontWeight: 500 }}>
                            {feedback.confidence ? `${(feedback.confidence * 100).toFixed(1)}%` : 'Pending'}
                          </p>
                        </div>
                      </>
                    )}
                    <div className="bg-white rounded-lg" style={{ padding: '12px', border: '1px solid #E5E7EB' }}>
                      <p className="mb-1" style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quality</p>
                      <p className="capitalize" style={{ fontSize: '14px', color: '#111827', fontWeight: 500 }}>
                        {feedback.quality_decision?.toLowerCase() || 'accepted'}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg" style={{ padding: '12px', border: '1px solid #E5E7EB' }}>
                      <p className="mb-1" style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</p>
                      <p className="capitalize" style={{ fontSize: '14px', color: '#111827', fontWeight: 500 }}>
                        {feedback.input_type}
                      </p>
                    </div>
                  </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
