'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import api from '@/utils/api';
import type { EventCreate } from '@/types/api';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateEventModal({ isOpen, onClose, onSuccess }: CreateEventModalProps) {
  const [formData, setFormData] = useState<EventCreate>({
    title: '',
    description: '',
    event_date: '',
    feedback_open_at: '',
    feedback_close_at: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof EventCreate, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof EventCreate, string>> = {};

    if (!formData.title.trim()) {
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
      const payload: EventCreate = {
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        event_date: formData.event_date || undefined,
        feedback_open_at: formData.feedback_open_at || undefined,
        feedback_close_at: formData.feedback_close_at || undefined,
      };

      await api.post('/events/', payload);
      
      // Reset form
      setFormData({ title: '', description: '', event_date: '', feedback_open_at: '', feedback_close_at: '' });
      setErrors({});
      onSuccess();
    } catch (error: any) {
      setErrors({
        title: error.response?.data?.detail || 'Failed to create event',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({ title: '', description: '', event_date: '', feedback_open_at: '', feedback_close_at: '' });
      setErrors({});
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-gray-200 max-w-lg w-full p-8 animate-in zoom-in duration-300 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2
            style={{ fontSize: '24px', fontWeight: 700, color: '#111827', letterSpacing: '-0.02em' }}
          >
            Create New Event
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 rounded-xl transition-colors disabled:opacity-50"
            style={{ color: '#9CA3AF' }}
            onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.color = '#6B7280')}
            onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block mb-2"
              style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}
            >
              Event Title <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                setErrors({ ...errors, title: undefined });
              }}
              placeholder="Annual Conference 2026"
              className="w-full px-4 py-3 rounded-xl transition-colors"
              style={{
                background: '#FFFFFF',
                border: errors.title ? '2px solid #EF4444' : '1px solid #D1D5DB',
                color: '#111827',
                fontSize: '15px'
              }}
              onFocus={(e) => !errors.title && (e.target.style.border = '2px solid #6366F1')}
              onBlur={(e) => !errors.title && (e.target.style.border = '1px solid #D1D5DB')}
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="mt-1" style={{ fontSize: '13px', color: '#EF4444' }}>{errors.title}</p>
            )}
            <p className="mt-1" style={{ fontSize: '12px', color: '#9CA3AF' }}>
              {formData.title.length}/100 characters
            </p>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block mb-2"
              style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}
            >
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                setErrors({ ...errors, description: undefined });
              }}
              placeholder="Brief description of your event..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl transition-colors resize-none"
              style={{
                background: '#FFFFFF',
                border: errors.description ? '2px solid #EF4444' : '1px solid #D1D5DB',
                color: '#111827',
                fontSize: '15px'
              }}
              onFocus={(e) => !errors.description && (e.target.style.border = '2px solid #6366F1')}
              onBlur={(e) => !errors.description && (e.target.style.border = '1px solid #D1D5DB')}
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
            <label
              htmlFor="event_date"
              className="block mb-2"
              style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}
            >
              Event Date (Optional)
            </label>
            <input
              id="event_date"
              type="date"
              value={formData.event_date}
              onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
              className="w-full px-4 py-3 rounded-xl transition-colors"
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

          {/* Feedback Collection Period */}
          <div className="space-y-4 p-4 rounded-xl" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
              Feedback Collection Period (Optional)
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Feedback Open At */}
              <div>
                <label
                  htmlFor="feedback_open_at"
                  className="block mb-2"
                  style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}
                >
                  Opens At
                </label>
                <input
                  id="feedback_open_at"
                  type="datetime-local"
                  value={formData.feedback_open_at}
                  onChange={(e) => {
                    setFormData({ ...formData, feedback_open_at: e.target.value });
                    setErrors({ ...errors, feedback_close_at: undefined });
                  }}
                  className="w-full px-4 py-3 rounded-xl transition-colors"
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

              {/* Feedback Close At */}
              <div>
                <label
                  htmlFor="feedback_close_at"
                  className="block mb-2"
                  style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}
                >
                  Closes At
                </label>
                <input
                  id="feedback_close_at"
                  type="datetime-local"
                  value={formData.feedback_close_at}
                  onChange={(e) => {
                    setFormData({ ...formData, feedback_close_at: e.target.value });
                    setErrors({ ...errors, feedback_close_at: undefined });
                  }}
                  className="w-full px-4 py-3 rounded-xl transition-colors"
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
                  <p className="mt-1" style={{ fontSize: '13px', color: '#EF4444' }}>{errors.feedback_close_at}</p>
                )}
              </div>
            </div>
            
            <p style={{ fontSize: '13px', color: '#6B7280' }}>
              Set when attendees can submit feedback. If not set, feedback will be open indefinitely.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl font-semibold transition-colors disabled:opacity-50"
              style={{
                background: '#FFFFFF',
                border: '1px solid #D1D5DB',
                color: '#374151'
              }}
              onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.background = '#F9FAFB')}
              onMouseLeave={(e) => e.currentTarget.style.background = '#FFFFFF'}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.title.trim()}
              className="flex-1 py-3 px-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
              style={{
                background: (isSubmitting || !formData.title.trim()) ? '#9CA3AF' : '#6366F1',
                color: '#FFFFFF'
              }}
              onMouseEnter={(e) => !(isSubmitting || !formData.title.trim()) && (e.currentTarget.style.background = '#4F46E5')}
              onMouseLeave={(e) => !(isSubmitting || !formData.title.trim()) && (e.currentTarget.style.background = '#6366F1')}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                  Creating...
                </>
              ) : (
                'Create Event'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
