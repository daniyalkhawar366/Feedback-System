'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Download, Copy, Check, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '@/utils/api';
import { API_BASE_URL } from '@/utils/api';
import type { EventRead, EventQRResponse } from '@/types/api';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventRead;
}

export default function QRCodeModal({ isOpen, onClose, event }: QRCodeModalProps) {
  const [qrData, setQrData] = useState<EventQRResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchQRData();
    }
  }, [isOpen, event.id]);

  const fetchQRData = async () => {
    try {
      setLoading(true);
      const response = await api.get<EventQRResponse>(`/events/${event.id}/qr`);
      setQrData(response.data);
    } catch (error) {
      console.error('Failed to fetch QR code:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = async () => {
    if (!qrData) return;
    await navigator.clipboard.writeText(qrData.feedback_url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    canvas.width = 300;
    canvas.height = 300;
    
    img.onload = () => {
      ctx?.drawImage(img, 0, 0);
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `${event.title.replace(/\s+/g, '-')}-qr-code.png`;
      link.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleOpenUrl = () => {
    if (!qrData) return;
    window.open(qrData.feedback_url, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 animate-in zoom-in duration-300 border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#111827' }}>
            QR Code
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-colors"
            style={{ color: '#9CA3AF' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#6B7280'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : qrData ? (
          <div className="space-y-6">
            {/* Event Info */}
            <div className="text-center">
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
                {event.title}
              </h3>
              <p style={{ fontSize: '14px', color: '#6B7280' }}>
                Scan to submit feedback
              </p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center" ref={qrRef}>
              <div style={{ background: '#F9FAFB', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)' }}>
                <QRCodeSVG
                  value={qrData.feedback_url}
                  size={256}
                  level="H"
                  includeMargin={true}
                />
              </div>
            </div>

            {/* Feedback URL */}
            <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: '16px', border: '1px solid #E5E7EB' }}>
              <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Feedback URL</p>
              <div className="flex items-center gap-2">
                <code style={{ flex: 1, fontSize: '13px', fontFamily: 'monospace', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {qrData.feedback_url}
                </code>
                <button
                  onClick={handleCopyUrl}
                  className="p-2 rounded-lg transition-colors flex-shrink-0"
                  style={{ background: copiedUrl ? '#D1FAE5' : '#F3F4F6' }}
                  onMouseEnter={(e) => !copiedUrl && (e.currentTarget.style.background = '#E5E7EB')}
                  onMouseLeave={(e) => !copiedUrl && (e.currentTarget.style.background = '#F3F4F6')}
                  title="Copy URL"
                >
                  {copiedUrl ? (
                    <Check className="w-4 h-4" style={{ color: '#059669' }} />
                  ) : (
                    <Copy className="w-4 h-4" style={{ color: '#6B7280' }} />
                  )}
                </button>
                <button
                  onClick={handleOpenUrl}
                  className="p-2 rounded-lg transition-colors flex-shrink-0"
                  style={{ background: '#F3F4F6' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#E5E7EB'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#F3F4F6'}
                  title="Open URL"
                >
                  <ExternalLink className="w-4 h-4" style={{ color: '#6B7280' }} />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleCopyUrl}
                className="flex-1 py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                style={{ background: copiedUrl ? '#D1FAE5' : '#F3F4F6', color: copiedUrl ? '#059669' : '#111827' }}
                onMouseEnter={(e) => !copiedUrl && (e.currentTarget.style.background = '#E5E7EB')}
                onMouseLeave={(e) => !copiedUrl && (e.currentTarget.style.background = '#F3F4F6')}
              >
                {copiedUrl ? (
                  <>
                    <Check className="w-5 h-5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Copy Link
                  </>
                )}
              </button>
              <button
                onClick={handleDownloadQR}
                className="flex-1 py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-md"
                style={{ background: '#6366F1', color: '#FFFFFF' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#4F46E5'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#6366F1'}
              >
                <Download className="w-5 h-5" />
                Download QR
              </button>
            </div>

            {/* Instructions */}
            <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: '12px', padding: '16px' }}>
              <p style={{ fontSize: '14px', color: '#4338CA', lineHeight: 1.6 }}>
                <strong>How to use:</strong> Download and display this QR code at your event. 
                Attendees can scan it to submit feedback instantly!
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">Failed to load QR code</p>
            <button
              onClick={fetchQRData}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
