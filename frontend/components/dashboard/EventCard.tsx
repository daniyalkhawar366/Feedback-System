'use client';

import { useState } from 'react';
import { Calendar, QrCode, BarChart3, Copy, Download, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import QRCodeModal from './QRCodeModal';
import api from '@/utils/api';
import type { EventRead } from '@/types/api';

interface EventCardProps {
  event: EventRead;
  onUpdate: () => void;
}

export default function EventCard({ event, onUpdate }: EventCardProps) {
  const router = useRouter();
  const [showQRModal, setShowQRModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyToken = async () => {
    await navigator.clipboard.writeText(event.public_token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No date set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 group shadow-sm flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-h-[80px]">
            <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
              {event.title}
            </h3>
            {event.description && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {event.description}
              </p>
            )}
          </div>
          
          {/* Active Badge - Only show if feedback is currently open */}
          {(() => {
            // If no feedback window is set, use is_active field (backward compatibility)
            if (!event.feedback_open_at || !event.feedback_close_at) {
              return event.is_active ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full ml-2 h-fit">
                  <span className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse"></span>
                  Active
                </span>
              ) : null;
            }
            
            // If feedback window is set, only show Active if currently open
            const now = new Date();
            const openAt = new Date(event.feedback_open_at);
            const closeAt = new Date(event.feedback_close_at);
            
            if (now >= openAt && now <= closeAt) {
              return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full ml-2 h-fit">
                  <span className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse"></span>
                  Active
                </span>
              );
            }
            
            return null;
          })()}
        </div>

        {/* Event Date */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span>{formatDate(event.event_date)}</span>
        </div>

        {/* Feedback Collection Period - Fixed Height Container */}
        <div className="mb-4 min-h-[88px]">
          {event.feedback_open_at && event.feedback_close_at ? (
            <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 h-full">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-purple-700">Feedback Collection</p>
                {(() => {
                  const now = new Date();
                  const openAt = new Date(event.feedback_open_at);
                  const closeAt = new Date(event.feedback_close_at);
                  
                  if (now < openAt) {
                    return (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                        Upcoming
                      </span>
                    );
                  } else if (now >= openAt && now <= closeAt) {
                    return (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                        🟢 Open
                      </span>
                    );
                  } else {
                    return (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                        Closed
                      </span>
                    );
                  }
                })()}
              </div>
              <p className="text-xs text-gray-600">
                {new Date(event.feedback_open_at).toLocaleString('en-US', { 
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                })} - {new Date(event.feedback_close_at).toLocaleString('en-US', { 
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                })}
              </p>
            </div>
          ) : (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 h-full flex items-center justify-center">
              <p className="text-xs text-gray-500 text-center">No feedback window set</p>
            </div>
          )}
        </div>

        {/* Token Display */}
        <div className="bg-gray-50 rounded-xl p-3 mb-4">
          <p className="text-xs text-gray-500 mb-1">Event Token</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm font-mono text-gray-900 truncate">
              {event.public_token}
            </code>
            <button
              onClick={handleCopyToken}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
              title="Copy token"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Spacer to push buttons to bottom */}
        <div className="flex-1"></div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setShowQRModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-600/20"
          >
            <QrCode className="w-5 h-5" />
            Generate QR Code
          </button>
          
          <button
            onClick={() => router.push(`/analytics/${event.id}`)}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white rounded-xl font-medium transition-colors shadow-lg shadow-pink-600/20"
          >
            <BarChart3 className="w-5 h-5" />
            View Analytics
          </button>
        </div>

        {/* Created Date */}
        <p className="text-xs text-gray-400 mt-3 text-center">
          Created {new Date(event.created_at).toLocaleDateString()}
        </p>
      </div>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        event={event}
      />
    </>
  );
}
