'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '@/utils/api';
import type { SentimentTrends } from '@/types/api';

interface TrendsTabProps {
  eventId: number;
}

export default function TrendsTab({ eventId }: TrendsTabProps) {
  const [trends, setTrends] = useState<SentimentTrends | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrends();
  }, [eventId]);

  const fetchTrends = async () => {
    try {
      setLoading(true);
      const response = await api.get<SentimentTrends>(`/analytics/events/${eventId}/trends`);
      setTrends(response.data);
    } catch (error) {
      console.error('Failed to fetch trends:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!trends || trends.trends.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <p className="text-gray-600">No trend data available yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Total Responses</p>
          <p className="text-2xl font-bold text-gray-900">{trends.total_feedback}</p>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-200 p-4">
          <p className="text-sm text-green-700 mb-1">Positive</p>
          <p className="text-2xl font-bold text-green-600">
            {trends.trends.reduce((sum, t) => sum + t.positive, 0)}
          </p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-4">
          <p className="text-sm text-red-700 mb-1">Negative</p>
          <p className="text-2xl font-bold text-red-600">
            {trends.trends.reduce((sum, t) => sum + t.negative, 0)}
          </p>
        </div>
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-700 mb-1">Neutral</p>
          <p className="text-2xl font-bold text-gray-600">
            {trends.trends.reduce((sum, t) => sum + t.neutral, 0)}
          </p>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Sentiment Over Time
        </h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends.trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                stroke="#888888"
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis stroke="#888888" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.75rem',
                }}
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="positive"
                stroke="#4CAF50"
                strokeWidth={2}
                name="Positive"
                dot={{ fill: '#4CAF50', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="negative"
                stroke="#F44336"
                strokeWidth={2}
                name="Negative"
                dot={{ fill: '#F44336', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="neutral"
                stroke="#757575"
                strokeWidth={2}
                name="Neutral"
                dot={{ fill: '#757575', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Breakdown Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Daily Breakdown
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Positive
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Negative
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Neutral
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {trends.trends.map((trend, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {new Date(trend.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <span className="text-green-600 font-semibold">
                      {trend.positive} ({trend.positive_pct.toFixed(0)}%)
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <span className="text-red-600 font-semibold">
                      {trend.negative} ({trend.negative_pct.toFixed(0)}%)
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <span className="text-gray-600 font-semibold">
                      {trend.neutral} ({trend.neutral_pct.toFixed(0)}%)
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                    {trend.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
