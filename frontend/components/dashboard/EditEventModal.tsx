'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Edit } from 'lucide-react';
import api from '@/utils/api';
import type { EventRead } from '@/types/api';

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  event: EventRead;
}

interface EventUpdate {
  title?: string;
  description?: string;
  event_date?: string;
  feedback_open_at?: string | null;
  feedback_close_at?: string | null;
}

export default function EditEventModal({ isOpen, onClose, onSuccess, event }: EditEventModalProps) {
  // Helper to format datetime for datetime-local input
  const formatDateTime = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

  const [formData, setFormData] = useState<EventUpdate>({
    title: event.title,
    description: event.description || '',
    event_date: event.event_date || '',
    feedback_open_at: formatDateTime(event.feedback_open_at),
    feedback_close_at: formatDateTime(event.feedback_close_at),
  });
  const [errors, setErrors] = useState<Partial<Record<keyof EventUpdate, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form when event changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: event.title,
        description: event.description || '',
        event_date: event.event_date || '',
        feedback_open_at: formatDateTime(event.feedback_open_at),
        feedback_close_at: formatDateTime(event.feedback_close_at),
      });
      setErrors({});
    }
  }, [isOpen, event]);

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof EventUpdate, string>> = {};

    if (!formData.title?.trim()) {
      newErrors.title = 'Event title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must not exceed 100 characters';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must not exceed 500 characters';
    }

    if (formData.feedback_open_at && formData.feedback_close_at) {
      const openAt = new Date(formData.feedback_open_at);
      const closeAt = new Date(formData.feedback_close_at);
      
      if (closeAt <= openAt) {
        newErrors.feedback_close_at = 'Closing time must be after opening time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Clean up form data - convert empty strings to null for optional fields
      const cleanedData: any = {};
      
      if (formData.title !== undefined) cleanedData.title = formData.title;
      if (formData.description !== undefined) {
        cleanedData.description = formData.description || null;
      }
      if (formData.event_date !== undefined) {
        cleanedData.event_date = formData.event_date || null;
      }
      if (formData.feedback_open_at !== undefined) {
        cleanedData.feedback_open_at = formData.feedback_open_at || null;
      }
      if (formData.feedback_close_at !== undefined) {
        cleanedData.feedback_close_at = formData.feedback_close_at || null;
      }

      await api.patch(`/events/${event.id}`, cleanedData);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to update event:', error);
      console.error('Error response:', error.response?.data);
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (typeof detail === 'string') {
          setErrors({ title: detail });
        } else if (Array.isArray(detail)) {
          // Handle validation errors array
          setErrors({ title: detail.map((e: any) => e.msg).join(', ') });
        }
      } else {
        setErrors({ title: 'Failed to update event. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setErrors({});
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: '#E5E7EB' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: '#EEF2FF' }}>
              <Edit className="w-6 h-6" style={{ color: '#6366F1' }} />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#111827' }}>Edit Event</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg transition-colors"
            disabled={isSubmitting}
            style={{ color: '#9CA3AF' }}
            onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.color = '#6B7280')}
            onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Event Title */}
          <div>
            <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>
              Event Title <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 rounded-lg transition-colors"
              style={{
                background: '#FFFFFF',
                border: errors.title ? '2px solid #EF4444' : '1px solid #D1D5DB',
                color: '#111827',
                fontSize: '15px'
              }}
              onFocus={(e) => !errors.title && (e.target.style.border = '2px solid #6366F1')}
              onBlur={(e) => !errors.title && (e.target.style.border = '1px solid #D1D5DB')}
              placeholder="Enter event title"
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="mt-1" style={{ fontSize: '13px', color: '#EF4444' }}>{errors.title}</p>
            )}
          </div>

          {/* Event Description */}
          <div>
            <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 rounded-lg transition-colors resize-none"
              style={{
                background: '#FFFFFF',
                border: errors.description ? '2px solid #EF4444' : '1px solid #D1D5DB',
                color: '#111827',
                fontSize: '15px'
              }}
              onFocus={(e) => !errors.description && (e.target.style.border = '2px solid #6366F1')}
              onBlur={(e) => !errors.description && (e.target.style.border = '1px solid #D1D5DB')}
              placeholder="Enter event description (optional)"
              rows={4}
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="mt-1" style={{ fontSize: '13px', color: '#EF4444' }}>{errors.description}</p>
            )}
            <p className="mt-1" style={{ fontSize: '12px', color: '#9CA3AF' }}>
              {formData.description?.length || 0}/500 characters
            </p>
          </div>

          {/* Event Date */}
          <div>
            <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>
              Event Date
            </label>
            <input
              type="date"
              value={formData.event_date}
              onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
              className="w-full px-4 py-3 rounded-lg transition-colors"
              style={{
                background: '#FFFFFF',
                border: '1px solid #D1D5DB',
                color: '#111827',
                fontSize: '15px'
              }}
              onFocus={(e) => e.target.style.border = '2px solid #6366F1'}
              onBlur={(e) => e.target.style.border = '1px solid #D1D5DB'}
              disabled={isSubmitting}
            />
          </div>

          {/* Feedback Window */}
          <div className="p-4 rounded-lg" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
            <h3 className="mb-3" style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>
              Feedback Collection Window
            </h3>
            <p className="mb-4" style={{ fontSize: '13px', color: '#6B7280' }}>
              Define when participants can submit feedback for this event
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Open At */}
              <div>
                <label className="block mb-2" style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                  Opens At
                </label>
                <input
                  type="datetime-local"
                  value={formData.feedback_open_at || ''}
                  onChange={(e) => setFormData({ ...formData, feedback_open_at: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg transition-colors"
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #D1D5DB',
                    color: '#111827',
                    fontSize: '14px'
                  }}
                  onFocus={(e) => e.target.style.border = '2px solid #6366F1'}
                  onBlur={(e) => e.target.style.border = '1px solid #D1D5DB'}
                  disabled={isSubmitting}
                />
              </div>

              {/* Close At */}
              <div>
                <label className="block mb-2" style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                  Closes At
                </label>
                <input
                  type="datetime-local"
                  value={formData.feedback_close_at || ''}
                  onChange={(e) => setFormData({ ...formData, feedback_close_at: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg transition-colors"
                  style={{
                    background: '#FFFFFF',
                    border: errors.feedback_close_at ? '2px solid #EF4444' : '1px solid #D1D5DB',
                    color: '#111827',
                    fontSize: '14px'
                  }}
                  onFocus={(e) => !errors.feedback_close_at && (e.target.style.border = '2px solid #6366F1')}
                  onBlur={(e) => !errors.feedback_close_at && (e.target.style.border = '1px solid #D1D5DB')}
                  disabled={isSubmitting}
                />
                {errors.feedback_close_at && (
                  <p className="mt-1" style={{ fontSize: '12px', color: '#EF4444' }}>{errors.feedback_close_at}</p>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t" style={{ borderColor: '#E5E7EB', background: '#F9FAFB' }}>
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-3 rounded-lg font-medium transition-colors"
            style={{
              background: '#FFFFFF',
              border: '1px solid #D1D5DB',
              color: '#374151'
            }}
            onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.background = '#F9FAFB')}
            onMouseLeave={(e) => e.currentTarget.style.background = '#FFFFFF'}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="flex-1 px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              background: isSubmitting ? '#9CA3AF' : '#6366F1',
              color: '#FFFFFF'
            }}
            onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.background = '#4F46E5')}
            onMouseLeave={(e) => !isSubmitting && (e.currentTarget.style.background = '#6366F1')}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
