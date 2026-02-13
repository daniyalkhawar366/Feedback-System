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
      <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col min-h-[400px]">
        {/* Header with Title and Menu */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1 pr-4">
            <h3 className="text-xl leading-tight tracking-[-0.01em] font-normal text-gray-900 mb-2" style={{ fontFamily: "'Instrument Serif', serif" }}>
              {event.title}
            </h3>
            {event.description && (
              <p className="text-[13px] text-gray-500 line-clamp-2 leading-relaxed">
                {event.description}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Active Badge */}
            {showActiveIndicator && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#edf7ef] text-[#2d7a3a] text-[11.5px] font-medium rounded-full whitespace-nowrap">
                <span className="w-1.5 h-1.5 bg-[#2d7a3a] rounded-full"></span>
                Active
              </span>
            )}
            
            {/* Dropdown Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              >
                <MoreVertical className="w-5 h-5 text-gray-400" />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[140px]">
                  <button
                    onClick={() => {
                      setShowEditModal(true);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteDialog(true);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
        <div className="flex items-center gap-2 text-[12.5px] text-gray-600 font-normal mb-6">
          <Calendar className="w-[13px] h-[13px] text-gray-500" />
          <span>{formatDate(event.event_date)}</span>
        </div>

        {/* Feedback Collection Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11.5px] font-semibold text-gray-500 uppercase tracking-wider">
              Feedback Collection
            </p>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11.5px] font-medium rounded-full ${
              status.color === 'green' ? 'bg-[#edf7ef] text-[#2d7a3a]' :
              status.color === 'blue' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {status.color === 'green' && <span className="w-1.5 h-1.5 bg-[#2d7a3a] rounded-full"></span>}
              {status.label}
            </span>
          </div>
          
          {event.feedback_open_at && event.feedback_close_at ? (
            <p className="text-[12px] text-gray-500">
              {formatDateTime(event.feedback_open_at)} — {formatDateTime(event.feedback_close_at)}
            </p>
          ) : (
            <p className="text-[12px] text-gray-400">No feedback window set</p>
          )}
        </div>

        {/* Event Token Section */}
        <div className="mb-6">
          <p className="text-[11.5px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Event Token
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[12.5px] font-mono text-gray-600 bg-gray-50 px-3 py-2 rounded-md tracking-wide">
              {event.public_token}
            </code>
            <button
              onClick={handleCopyToken}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors flex-shrink-0"
              title="Copy token"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => setShowQRModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-900 hover:text-white hover:border-gray-900 text-gray-700 text-[12.5px] rounded-lg font-medium transition-all"
          >
            <QrCode className="w-[13px] h-[13px]" />
            QR Code
          </button>
          
          <button
            onClick={() => router.push(`/analytics/${event.id}`)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-900 hover:text-white hover:border-gray-900 text-gray-700 text-[12.5px] rounded-lg font-medium transition-all"
          >
            <BarChart3 className="w-[13px] h-[13px]" />
            Analytics
          </button>
        </div>

        {/* Created Date */}
        <p className="text-[11px] text-gray-500 font-normal">
          Created {formatDate(event.created_at)}
        </p>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Delete Event</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{event.title}</strong>? This action cannot be undone and will delete all associated feedback.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDelete();
                  setShowDeleteDialog(false);
                }}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
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
