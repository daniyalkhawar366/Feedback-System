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
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Edit className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Edit Event</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Event Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Event Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter event title"
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Event Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter event description (optional)"
              rows={4}
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.description?.length || 0}/500 characters
            </p>
          </div>

          {/* Event Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Event Date
            </label>
            <input
              type="date"
              value={formData.event_date}
              onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              disabled={isSubmitting}
            />
          </div>

          {/* Feedback Window */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Feedback Collection Window
            </h3>
            <p className="text-xs text-gray-600 mb-4">
              Define when participants can submit feedback for this event
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Open At */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Opens At
                </label>
                <input
                  type="datetime-local"
                  value={formData.feedback_open_at || ''}
                  onChange={(e) => setFormData({ ...formData, feedback_open_at: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  disabled={isSubmitting}
                />
              </div>

              {/* Close At */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Closes At
                </label>
                <input
                  type="datetime-local"
                  value={formData.feedback_close_at || ''}
                  onChange={(e) => setFormData({ ...formData, feedback_close_at: e.target.value })}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.feedback_close_at ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isSubmitting}
                />
                {errors.feedback_close_at && (
                  <p className="mt-1 text-xs text-red-600">{errors.feedback_close_at}</p>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
