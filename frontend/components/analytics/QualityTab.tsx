'use client';

import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, AlertTriangle, XCircle, Flag } from 'lucide-react';
import api from '@/utils/api';
import type { QualityMetrics } from '@/types/api';

interface QualityTabProps {
  eventId: number;
}

export default function QualityTab({ eventId }: QualityTabProps) {
  const [quality, setQuality] = useState<QualityMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuality();
  }, [eventId]);

  const fetchQuality = async () => {
    try {
      setLoading(true);
      const response = await api.get<QualityMetrics>(`/analytics/events/${eventId}/quality`);
      setQuality(response.data);
    } catch (error) {
      console.error('Failed to fetch quality metrics:', error);
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

  if (!quality) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <p className="text-gray-600">No quality data available</p>
      </div>
    );
  }

  const total = quality.quality_decision_breakdown.accepted + quality.quality_decision_breakdown.flagged + quality.quality_decision_breakdown.rejected;
  const acceptanceRate = total > 0 ? ((quality.quality_decision_breakdown.accepted / total) * 100).toFixed(1) : '0.0';
  const flaggedRate = total > 0 ? ((quality.quality_decision_breakdown.flagged / total) * 100).toFixed(1) : '0.0';
  const rejectedRate = total > 0 ? ((quality.quality_decision_breakdown.rejected / total) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* Quality Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Accepted */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-500 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-green-800">Accepted</h3>
          </div>
          <p className="text-4xl font-bold text-green-600 mb-2">
            {quality.quality_decision_breakdown.accepted}
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-green-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${acceptanceRate}%` }}
              />
            </div>
            <span className="text-sm font-medium text-green-700">
              {acceptanceRate}%
            </span>
          </div>
        </div>

        {/* Flagged */}
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl border border-yellow-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-yellow-500 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-yellow-800">Flagged</h3>
          </div>
          <p className="text-4xl font-bold text-yellow-600 mb-2">
            {quality.quality_decision_breakdown.flagged}
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-yellow-200 rounded-full h-2">
              <div
                className="bg-yellow-500 h-2 rounded-full"
                style={{ width: `${flaggedRate}%` }}
              />
            </div>
            <span className="text-sm font-medium text-yellow-700">
              {flaggedRate}%
            </span>
          </div>
        </div>

        {/* Rejected */}
        <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl border border-red-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-500 rounded-xl">
              <XCircle className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-red-800">Rejected</h3>
          </div>
          <p className="text-4xl font-bold text-red-600 mb-2">
            {quality.quality_decision_breakdown.rejected}
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-red-200 rounded-full h-2">
              <div
                className="bg-red-500 h-2 rounded-full"
                style={{ width: `${rejectedRate}%` }}
              />
            </div>
            <span className="text-sm font-medium text-red-700">
              {rejectedRate}%
            </span>
          </div>
        </div>
      </div>

      {/* Acceptance Rate Summary */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Overall Acceptance Rate
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="bg-gray-200 rounded-full h-6 overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-500 to-green-600 h-6 flex items-center justify-end pr-3"
                style={{ width: `${acceptanceRate}%` }}
              >
                <span className="text-sm font-bold text-white">{acceptanceRate}%</span>
              </div>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {quality.quality_decision_breakdown.accepted} / {total}
          </p>
        </div>
      </div>

      {/* Common Quality Flags */}
      {quality.common_flags && quality.common_flags.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Flag className="w-5 h-5 text-yellow-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Common Quality Flags
              </h3>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quality.common_flags.map((flag, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-200"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <span className="font-medium text-gray-900">{flag.flag}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-yellow-600">
                      {flag.count}
                    </span>
                    <span className="text-sm text-gray-600">occurrences</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quality Distribution Chart */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Quality Distribution
        </h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-32 text-sm font-medium text-gray-700">
              Accepted
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-8 overflow-hidden">
              <div
                className="bg-green-500 h-8 flex items-center justify-end pr-3 transition-all"
                style={{ width: `${acceptanceRate}%` }}
              >
                <span className="text-sm font-bold text-white">{quality.quality_decision_breakdown.accepted}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-32 text-sm font-medium text-gray-700">
              Flagged
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-8 overflow-hidden">
              <div
                className="bg-yellow-500 h-8 flex items-center justify-end pr-3 transition-all"
                style={{ width: `${flaggedRate}%` }}
              >
                <span className="text-sm font-bold text-white">{quality.quality_decision_breakdown.flagged}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-32 text-sm font-medium text-gray-700">
              Rejected
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-8 overflow-hidden">
              <div
                className="bg-red-500 h-8 flex items-center justify-end pr-3 transition-all"
                style={{ width: `${rejectedRate}%` }}
              >
                <span className="text-sm font-bold text-white">{quality.quality_decision_breakdown.rejected}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
