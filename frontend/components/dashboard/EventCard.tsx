'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, QrCode, BarChart3, Copy, Check, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import QRCodeModal from './QRCodeModal';
import EditEventModal from './EditEventModal';
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
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleCopyToken = async () => {
    await navigator.clipboard.writeText(event.public_token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    try {
      const response = await api.delete(`/events/${event.id}`);
      console.log('Delete response:', response);
      onUpdate();
    } catch (error: any) {
      console.error('Failed to delete event:', error);
      console.error('Error response:', error.response?.data);
      const errorMsg = error.response?.data?.detail || 'Failed to delete event. Please try again.';
      alert(errorMsg);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close delete dialog on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showDeleteDialog) {
        setShowDeleteDialog(false);
      }
    };
    if (showDeleteDialog) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDeleteDialog]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No date set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getFeedbackStatus = () => {
    if (!event.feedback_open_at || !event.feedback_close_at) {
      return event.is_active ? { label: 'Active', color: 'green' } : { label: 'Inactive', color: 'gray' };
    }

    const now = new Date();
    const openAt = new Date(event.feedback_open_at);
    const closeAt = new Date(event.feedback_close_at);

    if (now < openAt) {
      return { label: 'Upcoming', color: 'blue' };
    } else if (now >= openAt && now <= closeAt) {
      return { label: 'Open', color: 'green' };
    } else {
      return { label: 'Closed', color: 'gray' };
    }
  };

  const status = getFeedbackStatus();
  const showActiveIndicator = status.color === 'green';

  return (
    <>
      <div
        className="group relative rounded-xl flex flex-col min-h-[400px] bg-card-bg border border-card-border p-6 shadow-sm card-hover-fx overflow-hidden"
      >
        {/* Top Accent Gradient Reveal */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Shimmer Overlay */}
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-hover-overlay to-transparent group-hover:animate-[shimmer_2s_ease-in-out_infinite] z-0 pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full">
          {/* Header with Title and Menu */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1 pr-4">
              <h3 className="leading-tight mb-2 text-[20px] font-semibold text-fg tracking-[-0.02em]">
                {event.title}
              </h3>
              {event.description && (
                <p className="line-clamp-2 leading-relaxed text-[14px] text-fg-secondary">
                  {event.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Active Badge */}
              {showActiveIndicator && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-success/10 text-success text-[12px] font-semibold rounded-full whitespace-nowrap shadow-sm border border-success/20">
                  <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse"></span>
                  Active
                </span>
              )}

              {/* Dropdown Menu */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 hover:bg-hover-overlay rounded-md transition-colors"
                >
                  <MoreVertical className="w-5 h-5 text-fg-secondary" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-card-bg border border-glass-border rounded-lg shadow-xl py-1 z-50 min-w-[140px] backdrop-blur-md">
                    <button
                      onClick={() => {
                        setShowEditModal(true);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-fg hover:bg-hover-overlay transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteDialog(true);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-danger/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Event Date */}
          <div className="flex items-center gap-2 font-medium mb-6 px-3 py-2 rounded-lg text-[14px] text-fg-secondary bg-bg-secondary border border-card-border/50">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(event.event_date)}</span>
          </div>

          {/* Feedback Collection Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12px] font-semibold text-fg-secondary uppercase tracking-wider">
                Feedback Collection
              </p>
              <span className="inline-flex items-center gap-1.5 shadow-sm px-3 py-1 rounded-md text-[12px] font-semibold"
                style={{
                  background: status.color === 'green' ? 'var(--accent-light)' : status.color === 'blue' ? 'var(--bg-secondary)' : 'var(--bg)',
                  color: status.color === 'green' ? 'var(--accent)' : status.color === 'blue' ? 'var(--fg-secondary)' : 'var(--fg-secondary)',
                  border: status.color === 'gray' ? '1px solid var(--card-border)' : undefined,
                }}>
                {status.color === 'green' && <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></span>}
                {status.color === 'blue' && <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>}
                {status.label}
              </span>
            </div>

            {event.feedback_open_at && event.feedback_close_at ? (
              <p className="text-[13px] text-fg-secondary font-medium">
                {formatDateTime(event.feedback_open_at)} — {formatDateTime(event.feedback_close_at)}
              </p>
            ) : (
              <p className="text-[13px] text-fg-secondary opacity-70">No feedback window set</p>
            )}
          </div>

          {/* Event Token Section */}
          <div className="mb-6 relative">
            <p className="mb-2 text-[12px] font-semibold text-fg-secondary uppercase tracking-wider">
              Event Token
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-[13px] font-mono font-medium text-fg bg-bg-secondary px-3 py-2 rounded-md tracking-widest border border-card-border shadow-inner">
                {event.public_token}
              </code>
              <button
                onClick={handleCopyToken}
                className="relative p-2 hover:bg-hover-overlay rounded-md transition-all active:scale-95 flex-shrink-0 group/copy bg-bg-secondary border border-card-border"
                title="Copy token"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4 text-fg-secondary group-hover/copy:text-fg transition-colors" />
                )}

                {/* Toast micro-interaction */}
                <div className={`absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-fg text-bg text-[10px] font-bold rounded shadow-lg transition-all duration-300 pointer-events-none ${copied ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                  Copied!
                </div>
              </button>
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1"></div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-4 mt-auto">
            <button
              onClick={() => setShowQRModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-bg-secondary text-fg hover:text-accent border border-card-border hover:border-accent/40 rounded-lg font-semibold transition-all shadow-sm hover:shadow-md active:scale-[0.98] text-[13px]"
            >
              <QrCode className="w-[14px] h-[14px]" />
              QR Code
            </button>

            <button
              onClick={() => router.push(`/analytics/${event.id}`)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-white hover:bg-accent/90 rounded-lg font-semibold transition-all shadow-sm hover:shadow-md hover:shadow-accent/20 active:scale-[0.98] text-[13px]"
            >
              <BarChart3 className="w-[14px] h-[14px]" />
              Analytics
            </button>
          </div>

          {/* Created Date */}
          <p className="text-[12px] text-fg-secondary/70 font-medium">
            Created {formatDate(event.created_at)}
          </p>
        </div>
      </div>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        event={event}
      />

      {/* Edit Event Modal */}
      <EditEventModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={onUpdate}
        event={event}
      />

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300"
          onClick={() => setShowDeleteDialog(false)}
        >
          <div
            className="bg-card-bg border border-card-border rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-accent/10 rounded-xl">
                <Trash2 className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-fg">Delete Event</h3>
            </div>

            <p className="text-fg-secondary mb-6 text-[15px] leading-relaxed">
              Are you sure you want to delete <strong className="text-fg">{event.title}</strong>? This action cannot be undone and will delete all associated feedback.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="flex-1 px-4 py-3 bg-bg border border-card-border hover:bg-hover-overlay text-fg-secondary hover:text-fg rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDelete();
                  setShowDeleteDialog(false);
                }}
                className="flex-1 px-4 py-3 bg-accent hover:bg-accent/90 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
