'use client';

import { useState, useEffect } from 'react';
import { Loader2, Search } from 'lucide-react';
import api from '@/utils/api';
import type { TopKeywords } from '@/types/api';

interface KeywordsTabProps {
  eventId: number;
}

type SentimentFilter = 'all' | 'positive' | 'negative' | 'neutral';

export default function KeywordsTab({ eventId }: KeywordsTabProps) {
  const [keywords, setKeywords] = useState<TopKeywords | null>(null);
  const [loading, setLoading] = useState(true);
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchKeywords();
  }, [eventId, sentimentFilter]);

  const fetchKeywords = async () => {
    try {
      setLoading(true);
      const params = sentimentFilter !== 'all' ? { sentiment: sentimentFilter } : {};
      const response = await api.get<TopKeywords>(`/analytics/events/${eventId}/keywords`, { params });
      setKeywords(response.data);
    } catch (error) {
      console.error('Failed to fetch keywords:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredKeywords = keywords?.keywords.filter((kw) =>
    kw.word.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Sentiment Filter */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Sentiment
          </label>
          <div className="flex gap-2">
            {(['all', 'positive', 'negative', 'neutral'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setSentimentFilter(filter)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  sentimentFilter === filter
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Keywords
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : !keywords || keywords.keywords.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <p className="text-gray-600">No keywords found</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-600 mb-1">Total Keywords</p>
              <p className="text-2xl font-bold text-gray-900">
                {keywords.total_keywords_extracted}
              </p>
            </div>
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
              <p className="text-sm text-blue-700 mb-1">Showing</p>
              <p className="text-2xl font-bold text-blue-600">
                Top {filteredKeywords.length}
              </p>
            </div>
          </div>

          {/* Keywords Table */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Top Keywords {sentimentFilter !== 'all' && `(${sentimentFilter.charAt(0).toUpperCase() + sentimentFilter.slice(1)})`}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Keyword
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Count
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredKeywords.slice(0, 30).map((keyword, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        #{index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {keyword.word}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {keyword.count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${keyword.percentage}%` }}
                            />
                          </div>
                          <span className="text-gray-900 font-medium">
                            {keyword.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
