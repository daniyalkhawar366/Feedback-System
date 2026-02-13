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
  eventId: number;
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
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [audioPlaying, setAudioPlaying] = useState<number | null>(null);

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
        return 'text-[#2d7a3a] bg-[#edf7ef] border-[#2d7a3a]';
      case 'negative':
        return 'text-[#b91c1c] bg-[#fef2f2] border-[#b91c1c]';
      case 'neutral':
        return 'text-[#6b6760] bg-[#fafaf8] border-[#e8e5df]';
      case 'pending':
        return 'text-[#1a1917] bg-[#fafaf8] border-[#e8e5df]';
      default:
        return 'text-[#6b6760] bg-[#fafaf8] border-[#e8e5df]';
    }
  };

  const getQualityIcon = (decision: string) => {
    switch (decision?.toUpperCase()) {
      case 'ACCEPT':
        return <CheckCircle2 className="w-4 h-4 text-[#2d7a3a]" />;
      case 'FLAG':
        return <AlertTriangle className="w-4 h-4 text-[#b45309]" />;
      case 'REJECT':
        return <XCircle className="w-4 h-4 text-[#b91c1c]" />;
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
      <div className="bg-white rounded-2xl border border-[#e8e5df] p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-5 h-5 text-[#1a1917]" />
          <h3
            className="text-lg font-medium text-[#1a1917]"
            style={{ fontFamily: "'Instrument Serif', serif", letterSpacing: '-0.01em' }}
          >
            Filters
          </h3>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9e9a93]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search feedback text..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#e8e5df] bg-white text-[#1a1917] placeholder-[#9e9a93] focus:outline-none focus:ring-2 focus:ring-[#1a1917]"
          />
        </div>

        {/* Filter Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Sentiment Filter */}
          <div>
            <label className="block text-sm font-medium text-[#1a1917] mb-2">
              Sentiment
            </label>
            <div className="flex flex-wrap gap-2">
              {(['all', 'positive', 'negative', 'neutral'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSentimentFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    sentimentFilter === filter
                      ? 'bg-[#1a1917] text-white'
                      : 'bg-[#fafaf8] text-[#1a1917] hover:bg-[#f0ede8] border border-[#e8e5df]'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Quality Filter */}
          <div>
            <label className="block text-sm font-medium text-[#1a1917] mb-2">
              Quality
            </label>
            <div className="flex flex-wrap gap-2">
              {(['all', 'ACCEPT', 'FLAG', 'REJECT'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setQualityFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    qualityFilter === filter
                      ? 'bg-[#1a1917] text-white'
                      : 'bg-[#fafaf8] text-[#1a1917] hover:bg-[#f0ede8] border border-[#e8e5df]'
                  }`}
                >
                  {filter === 'all' ? 'All' : filter === 'ACCEPT' ? 'Accepted' : filter === 'FLAG' ? 'Flagged' : 'Rejected'}
                </button>
              ))}
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-[#1a1917] mb-2">
              Type
            </label>
            <div className="flex flex-wrap gap-2">
              {(['all', 'text', 'audio'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTypeFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    typeFilter === filter
                      ? 'bg-[#1a1917] text-white'
                      : 'bg-[#fafaf8] text-[#1a1917] hover:bg-[#f0ede8] border border-[#e8e5df]'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="pt-4 border-t border-[#e8e5df]">
          <p className="text-sm text-[#6b6760]">
            Showing <span className="font-semibold text-[#1a1917]">{filteredFeedbacks.length}</span> of{' '}
            <span className="font-semibold text-[#1a1917]">{feedbacks.length}</span> feedbacks
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#1a1917]" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-12 text-center">
          <MessageSquare className="w-16 h-16 text-[#9e9a93] mx-auto mb-4" />
          <p
            className="text-lg font-medium text-[#1a1917] mb-2"
            style={{ fontFamily: "'Instrument Serif', serif", letterSpacing: '-0.01em' }}
          >
            {feedbacks.length === 0 ? 'No Feedback Yet' : 'No feedbacks match your filters'}
          </p>
          <p className="text-[#6b6760]">
            {feedbacks.length === 0 ? 'No feedback has been submitted for this event yet.' : 'Try adjusting your search or filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFeedbacks.map((feedback) => (
            <div
              key={feedback.id}
              className="bg-white rounded-xl border border-[#e8e5df] overflow-hidden hover:border-[#1a1917] transition-all"
            >
              {/* Header */}
              <div
                className="p-4 cursor-pointer hover:bg-[#fafaf8] transition-colors"
                onClick={() => toggleExpanded(feedback.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      {feedback.input_type === 'text' ? (
                        <MessageSquare className="w-5 h-5 text-[#1a1917] shrink-0" />
                      ) : (
                        <Mic className="w-5 h-5 text-[#1a1917] shrink-0" />
                      )}
                    </div>
                    <p className="text-base text-[#1a1917] leading-relaxed mb-3">
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
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium border ${getSentimentColor(
                            feedback.sentiment || 'pending'
                          )}`}
                        >
                          {feedback.sentiment ? feedback.sentiment.charAt(0).toUpperCase() + feedback.sentiment.slice(1) : 'Pending'}
                        </span>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-[#6b6760]">
                        {getQualityIcon(feedback.quality_decision || 'ACCEPT')}
                        <span className="capitalize">{feedback.quality_decision?.toLowerCase() || 'accepted'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[#6b6760]">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(feedback.created_at).toLocaleDateString()}
                      </div>
                      <span className="text-xs text-[#6b6760]">
                        Confidence: {((feedback.confidence || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <button className="text-[#9e9a93] hover:text-[#1a1917] transition-colors">
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
                <div className="p-4 border-t border-[#e8e5df] bg-[#fafaf8] space-y-4">
                  {/* Full Text */}
                  <div>
                    <h4 className="text-sm font-medium text-[#1a1917] mb-2">
                      Feedback Text
                    </h4>
                    <p className="text-sm text-[#1a1917] whitespace-pre-wrap">
                      {/* Show censored text for flagged feedbacks */}
                      {feedback.quality_decision === 'FLAG' && feedback.normalized_text
                        ? feedback.normalized_text
                        : feedback.raw_text}
                    </p>
                  </div>

                  {/* Audio Player */}
                  {feedback.input_type === 'audio' && feedback.audio_path && (
                    <div>
                      <h4 className="text-sm font-medium text-[#1a1917] mb-2">
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
                      <h4 className="text-sm font-medium text-[#1a1917] mb-2">
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
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#fef7ed] text-[#92400e] border border-[#f0c8a0]"
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                                {flag.replace(/_/g, ' ')}
                              </span>
                            ));
                          } catch {
                            return (
                              <span className="text-xs text-[#6b6760]">
                                {feedback.quality_flags}
                              </span>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                    {/* Hide sentiment for flagged feedbacks */}
                    {feedback.quality_decision !== 'FLAG' && (
                      <>
                        <div className="bg-white rounded-lg p-3 border border-[#e8e5df]">
                          <p className="text-xs text-[#6b6760] mb-1">Sentiment</p>
                          <p className="text-sm font-semibold text-[#1a1917] capitalize">
                            {feedback.sentiment || 'Pending'}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-[#e8e5df]">
                          <p className="text-xs text-[#6b6760] mb-1">Confidence</p>
                          <p className="text-sm font-semibold text-[#1a1917]">
                            {feedback.confidence ? `${(feedback.confidence * 100).toFixed(1)}%` : 'Pending'}
                          </p>
                        </div>
                      </>
                    )}
                    <div className="bg-white rounded-lg p-3 border border-[#e8e5df]">
                      <p className="text-xs text-[#6b6760] mb-1">Quality</p>
                      <p className="text-sm font-semibold text-[#1a1917] capitalize">
                        {feedback.quality_decision?.toLowerCase() || 'accepted'}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-[#e8e5df]">
                      <p className="text-xs text-[#6b6760] mb-1">Type</p>
                      <p className="text-sm font-semibold text-[#1a1917] capitalize">
                        {feedback.input_type}
                      </p>
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
