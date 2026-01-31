'use client';

import { TrendingUp, TrendingDown, MessageSquare, Mic, ThumbsUp, Flag } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import type { EventStats } from '@/types/api';

interface OverviewTabProps {
  eventId: number;
  stats: EventStats;
}

export default function OverviewTab({ stats }: OverviewTabProps) {
  const sentimentData = [
    { name: 'Positive', value: stats.sentiment_distribution.positive.count, color: '#4CAF50' },
    { name: 'Negative', value: stats.sentiment_distribution.negative.count, color: '#F44336' },
    { name: 'Neutral', value: stats.sentiment_distribution.neutral.count, color: '#757575' },
  ].filter(item => item.value > 0);

  const qualityData = [
    { name: 'Accepted', value: stats.quality_breakdown.accepted, color: '#4CAF50' },
    { name: 'Flagged', value: stats.quality_breakdown.flagged, color: '#FFA726' },
    { name: 'Rejected', value: stats.quality_breakdown.rejected, color: '#F44336' },
  ];

  const inputTypeData = [
    { name: 'Text', value: stats.input_type_breakdown.text, color: '#0066FF' },
    { name: 'Audio', value: stats.input_type_breakdown.audio, color: '#E91E63' },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Feedback */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">
            {stats.total_feedback}
          </h3>
          <p className="text-sm text-gray-600">Total Feedback</p>
        </div>

        {/* Positive Percentage */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <ThumbsUp className="w-6 h-6 text-green-600" />
            </div>
            {stats.sentiment_distribution.positive.percentage > 50 ? (
              <TrendingUp className="w-5 h-5 text-green-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600" />
            )}
          </div>
          <h3 className="text-3xl font-bold text-green-600 mb-1">
            {stats.sentiment_distribution.positive.percentage.toFixed(1)}%
          </h3>
          <p className="text-sm text-gray-600">
            Positive ({stats.sentiment_distribution.positive.count})
          </p>
        </div>

        {/* Avg Confidence */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">
            {(stats.avg_confidence * 100).toFixed(1)}%
          </h3>
          <p className="text-sm text-gray-600">Avg Confidence</p>
        </div>

        {/* Flagged Count */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Flag className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">
            {stats.quality_breakdown.flagged}
          </h3>
          <p className="text-sm text-gray-600">Flagged Issues</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Distribution */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Sentiment Distribution
          </h3>
          {sentimentData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-12">No feedback data yet</p>
          )}
        </div>

        {/* Quality Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Quality Breakdown
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={qualityData}>
                <XAxis dataKey="name" stroke="#888888" />
                <YAxis stroke="#888888" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.75rem',
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {qualityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Input Type & Collection Period */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Type Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Input Types
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-medium text-gray-900">Text Feedback</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {stats.input_type_breakdown.text}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                  <Mic className="w-5 h-5 text-pink-600" />
                </div>
                <span className="font-medium text-gray-900">Audio Feedback</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {stats.input_type_breakdown.audio}
              </span>
            </div>
          </div>
        </div>

        {/* Collection Period */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Collection Period
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Started</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(stats.feedback_collection_period.start_date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            {stats.feedback_collection_period.end_date && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Latest</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(stats.feedback_collection_period.end_date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sentiment Details */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Detailed Sentiment Analysis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-900">Positive</span>
              <span className="text-2xl font-bold text-green-600">
                {stats.sentiment_distribution.positive.percentage.toFixed(1)}%
              </span>
            </div>
            <p className="text-sm text-green-700">
              {stats.sentiment_distribution.positive.count} responses
            </p>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-red-900">Negative</span>
              <span className="text-2xl font-bold text-red-600">
                {stats.sentiment_distribution.negative.percentage.toFixed(1)}%
              </span>
            </div>
            <p className="text-sm text-red-700">
              {stats.sentiment_distribution.negative.count} responses
            </p>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900">Neutral</span>
              <span className="text-2xl font-bold text-gray-600">
                {stats.sentiment_distribution.neutral.percentage.toFixed(1)}%
              </span>
            </div>
            <p className="text-sm text-gray-700">
              {stats.sentiment_distribution.neutral.count} responses
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
