'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import api from '@/utils/api';
import type { EventCreate } from '@/types/api';
import { AppleDateTimePicker, AppleDatePicker } from '@/components/ui/AppleDateTimePicker';
import { format, formatISO } from 'date-fns';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateEventModal({ isOpen, onClose, onSuccess }: CreateEventModalProps) {
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    event_date: Date | null;
    feedback_open_at: Date | null;
    feedback_close_at: Date | null;
  }>({
    title: '',
    description: '',
    event_date: null,
    feedback_open_at: null,
    feedback_close_at: null,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof EventCreate, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Listen for Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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

    if (!formData.event_date) {
      newErrors.event_date = 'Event date is required';
    }

    if (!formData.feedback_open_at) {
      newErrors.feedback_open_at = 'Opening time is required';
    }

    if (!formData.feedback_close_at) {
      newErrors.feedback_close_at = 'Closing time is required';
    }

    if (formData.event_date && formData.feedback_open_at) {
      // Compare ignoring time for the event date if we want
      const eventStart = new Date(formData.event_date);
      eventStart.setHours(0, 0, 0, 0);
      if (formData.feedback_open_at < eventStart) {
        newErrors.feedback_open_at = 'Feedback cannot open before the event date';
      }
    }

    if (formData.feedback_open_at && formData.feedback_close_at) {
      if (formData.feedback_close_at <= formData.feedback_open_at) {
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
        event_date: formData.event_date ? format(formData.event_date, 'yyyy-MM-dd') : undefined,
        feedback_open_at: formData.feedback_open_at ? format(formData.feedback_open_at, "yyyy-MM-dd'T'HH:mm:ss") : undefined,
        feedback_close_at: formData.feedback_close_at ? format(formData.feedback_close_at, "yyyy-MM-dd'T'HH:mm:ss") : undefined,
      };

      await api.post('/events/', payload);

      // Reset form
      setFormData({ title: '', description: '', event_date: null, feedback_open_at: null, feedback_close_at: null });
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
      setFormData({ title: '', description: '', event_date: null, feedback_open_at: null, feedback_close_at: null });
      setErrors({});
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300"
      onClick={handleClose}
    >
      <div
        className="bg-card-bg border border-card-border rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-card-border/50">
          <div className="flex items-center gap-3">
            <h2 className="text-[24px] font-bold text-fg tracking-tight">Create New Event</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg transition-colors text-fg-secondary hover:text-fg hover:bg-hover-overlay"
            disabled={isSubmitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Title */}
          <div>
            <label className="block mb-2 text-[14px] font-semibold text-fg-secondary">
              Event Title <span className="text-danger">*</span>
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
              className={`w-full px-4 py-3 rounded-lg transition-colors bg-bg text-fg text-[15px] outline-none border ${errors.title ? 'border-danger' : 'border-card-border/50 hover:border-accent/50 focus:border-accent'}`}
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="mt-1 text-[13px] text-danger">{errors.title}</p>
            )}
            <p className="mt-1 text-[12px] text-fg-secondary/70">
              {formData.title.length}/100 characters
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block mb-2 text-[14px] font-semibold text-fg-secondary">
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
              rows={3}
              className={`w-full px-4 py-3 rounded-lg transition-colors resize-none bg-bg text-fg text-[15px] outline-none border ${errors.description ? 'border-danger' : 'border-card-border/50 hover:border-accent/50 focus:border-accent'}`}
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="mt-1 text-[13px] text-danger">{errors.description}</p>
            )}
            <p className="mt-1 text-[12px] text-fg-secondary/70">
              {formData.description?.length || 0}/500 characters
            </p>
          </div>

          {/* Event Date */}
          <div className="flex flex-col gap-1.5">
            <AppleDatePicker
              label="Event Date"
              value={formData.event_date}
              onChange={(date: Date | null) => {
                setFormData({ ...formData, event_date: date });
                setErrors({ ...errors, event_date: undefined });
              }}
              disabled={isSubmitting}
            />
            {errors.event_date && (
              <p className="px-1 text-[13px] text-danger">{errors.event_date}</p>
            )}
          </div>

          {/* Feedback Collection Period */}
          <div className="p-5 rounded-lg bg-bg-secondary border border-card-border/50">
            <h3 className="mb-2 text-[14px] font-semibold text-fg">
              Feedback Collection Period
            </h3>
            <p className="mb-5 text-[13px] text-fg-secondary">
              Set when attendees can submit feedback.
            </p>

            <div className="flex flex-col gap-3">
              {/* Feedback Open At */}
              <div className="flex flex-col gap-1.5">
                <AppleDateTimePicker
                  label="Opens At"
                  value={formData.feedback_open_at}
                  onChange={(date: Date | null) => {
                    setFormData({ ...formData, feedback_open_at: date });
                    setErrors({ ...errors, feedback_open_at: undefined });
                  }}
                  disabled={isSubmitting}
                />
                {errors.feedback_open_at && (
                  <p className="px-1 text-[12px] text-danger">{errors.feedback_open_at}</p>
                )}
              </div>

              {/* Feedback Close At */}
              <div className="flex flex-col gap-1.5">
                <AppleDateTimePicker
                  label="Closes At"
                  value={formData.feedback_close_at}
                  onChange={(date: Date | null) => {
                    setFormData({ ...formData, feedback_close_at: date });
                    setErrors({ ...errors, feedback_close_at: undefined });
                  }}
                  minDate={formData.feedback_open_at || undefined}
                  disabled={isSubmitting}
                />
                {errors.feedback_close_at && (
                  <p className="px-1 text-[12px] text-danger">{errors.feedback_close_at}</p>
                )}
              </div>
            </div>
          </div>

        </form>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-card-border/50 bg-bg-secondary/50">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-3 rounded-xl font-semibold transition-colors bg-bg border border-card-border hover:bg-hover-overlay text-fg-secondary hover:text-fg disabled:opacity-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.title.trim()}
            className="flex-1 px-4 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2 bg-accent text-white hover:bg-accent/90"
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
      </div>
    </div>
  );
}
