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
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchQRData();
    }
  }, [isOpen, event.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all duration-300"
      onClick={onClose}
    >
      <div
        className="relative bg-card-bg rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-card-border animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[20px] font-bold text-fg tracking-tight">
            Event QR Code
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-hover-overlay transition-colors text-fg-secondary hover:text-fg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-accent border-t-transparent"></div>
          </div>
        ) : qrData ? (
          <div className="space-y-5">
            {/* Event Title */}
            <div className="text-center px-2">
              <h3 className="text-[16px] font-semibold text-fg mb-1 line-clamp-1">
                {event.title}
              </h3>
              <p className="text-[13px] text-fg-secondary">
                Scan to submit feedback
              </p>
            </div>

            {/* QR Code Canvas */}
            <div className="flex justify-center" ref={qrRef}>
              <div className="p-4 rounded-[18px] bg-white border border-gray-100 shadow-sm relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <QRCodeSVG
                  value={qrData.feedback_url}
                  size={200}
                  level="H"
                  includeMargin={false}
                  className="relative z-10"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <button
              onClick={handleDownloadQR}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-accent text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98]"
            >
              <Download className="w-[18px] h-[18px]" />
              Download QR
            </button>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-fg-secondary">Failed to load QR code</p>
            <button
              onClick={fetchQRData}
              className="mt-4 px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-xl font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
