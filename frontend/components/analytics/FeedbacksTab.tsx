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
      setFeedbacks(response.data);
    } catch (error) {
      console.error('Failed to fetch feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFeedbacks = feedbacks.filter((fb) => {
    // Text search
    const matchesSearch = (fb.text_feedback || '').toLowerCase().includes(searchQuery.toLowerCase());
    
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
        return 'text-green-600 bg-green-50 border-green-200';
      case 'negative':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'neutral':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getQualityIcon = (decision: string) => {
    switch (decision?.toUpperCase()) {
      case 'ACCEPT':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'FLAG':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
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
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search feedback text..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filter Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Sentiment Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sentiment
            </label>
            <div className="flex flex-wrap gap-2">
              {(['all', 'positive', 'negative', 'neutral'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSentimentFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    sentimentFilter === filter
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Quality Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quality
            </label>
            <div className="flex flex-wrap gap-2">
              {(['all', 'ACCEPT', 'FLAG', 'REJECT'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setQualityFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    qualityFilter === filter
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter === 'all' ? 'All' : filter === 'ACCEPT' ? 'Accepted' : filter === 'FLAG' ? 'Flagged' : 'Rejected'}
                </button>
              ))}
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <div className="flex flex-wrap gap-2">
              {(['all', 'text', 'audio'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTypeFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    typeFilter === filter
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
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
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <p className="text-gray-600">No feedbacks match your filters</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFeedbacks.map((feedback) => (
            <div
              key={feedback.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleExpanded(feedback.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      {feedback.input_type === 'text' ? (
                        <MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      ) : (
                        <Mic className="w-5 h-5 text-pink-600 flex-shrink-0" />
                      )}
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {(feedback.text_feedback || '').substring(0, 100)}
                        {(feedback.text_feedback || '').length > 100 && '...'}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium border ${getSentimentColor(
                          feedback.sentiment || 'neutral'
                        )}`}
                      >
                        {feedback.sentiment}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        {getQualityIcon(feedback.quality_decision || 'accepted')}
                        <span className="capitalize">{feedback.quality_decision || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(feedback.created_at).toLocaleDateString()}
                      </div>
                      <span className="text-xs text-gray-600">
                        Confidence: {((feedback.confidence || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600 transition-colors">
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
                <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-4">
                  {/* Full Text */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Feedback Text
                    </h4>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {feedback.text_feedback}
                    </p>
                  </div>

                  {/* Audio Player */}
                  {feedback.input_type === 'audio' && feedback.audio_path && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
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
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Quality Flags
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {feedback.quality_flags.split(',').map((flag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {flag.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Sentiment</p>
                      <p className="text-sm font-semibold text-gray-900 capitalize">
                        {feedback.sentiment || 'N/A'}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Confidence</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {((feedback.confidence || 0) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Quality</p>
                      <p className="text-sm font-semibold text-gray-900 capitalize">
                        {feedback.quality_decision || 'N/A'}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Type</p>
                      <p className="text-sm font-semibold text-gray-900 capitalize">
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
