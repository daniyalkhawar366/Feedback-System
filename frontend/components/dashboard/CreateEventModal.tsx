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
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 animate-in zoom-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Create New Event
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Event Title <span className="text-red-500">*</span>
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
              className={`w-full px-4 py-3 rounded-xl border ${
                errors.title
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              } bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors`}
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="text-sm text-red-600 mt-1">{errors.title}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {formData.title.length}/100 characters
            </p>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-2"
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
              className={`w-full px-4 py-3 rounded-xl border ${
                errors.description
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              } bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors resize-none`}
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="text-sm text-red-600 mt-1">{errors.description}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {formData.description?.length || 0}/500 characters
            </p>
          </div>

          {/* Event Date */}
          <div>
            <label
              htmlFor="event_date"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Event Date (Optional)
            </label>
            <input
              id="event_date"
              type="date"
              value={formData.event_date}
              onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              disabled={isSubmitting}
            />
          </div>

          {/* Feedback Collection Period */}
          <div className="space-y-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
            <p className="text-sm font-semibold text-purple-900 mb-2">
              ⏰ Feedback Collection Period (Optional)
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Feedback Open At */}
              <div>
                <label
                  htmlFor="feedback_open_at"
                  className="block text-sm font-medium text-gray-700 mb-2"
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                  disabled={isSubmitting}
                />
              </div>

              {/* Feedback Close At */}
              <div>
                <label
                  htmlFor="feedback_close_at"
                  className="block text-sm font-medium text-gray-700 mb-2"
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
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.feedback_close_at
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-purple-500'
                  } bg-white text-gray-900 focus:outline-none focus:ring-2 transition-colors`}
                  disabled={isSubmitting}
                />
                {errors.feedback_close_at && (
                  <p className="text-sm text-red-600 mt-1">{errors.feedback_close_at}</p>
                )}
              </div>
            </div>
            
            <p className="text-xs text-gray-600">
              Set when attendees can submit feedback. If not set, feedback will be open indefinitely.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-xl font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.title.trim()}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
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
