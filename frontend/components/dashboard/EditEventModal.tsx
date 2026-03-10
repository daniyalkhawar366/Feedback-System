'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Edit } from 'lucide-react';
import api from '@/utils/api';
import type { EventRead } from '@/types/api';
import { AppleDateTimePicker, AppleDatePicker } from '@/components/ui/AppleDateTimePicker';
import { format, formatISO, parseISO } from 'date-fns';

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
  const parseDate = (dateStr: string | null | undefined): Date | null => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  };

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    event_date: Date | null;
    feedback_open_at: Date | null;
    feedback_close_at: Date | null;
  }>({
    title: event.title,
    description: event.description || '',
    event_date: parseDate(event.event_date),
    feedback_open_at: parseDate(event.feedback_open_at),
    feedback_close_at: parseDate(event.feedback_close_at),
  });
  const [errors, setErrors] = useState<Partial<Record<keyof EventUpdate, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form when event changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: event.title,
        description: event.description || '',
        event_date: parseDate(event.event_date),
        feedback_open_at: parseDate(event.feedback_open_at),
        feedback_close_at: parseDate(event.feedback_close_at),
      });
      setErrors({});
    }
  }, [isOpen, event]);

  // Calculate if the event has started to disable feedback_open_at field
  const hasEventStarted = event.feedback_open_at
    ? new Date(event.feedback_open_at).getTime() <= Date.now()
    : event.event_date ? new Date(event.event_date).getTime() <= Date.now() : false;

  // Listen for Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

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
      if (formData.feedback_close_at <= formData.feedback_open_at) {
        newErrors.feedback_close_at = 'Closing time must be after opening time';
      }
    }

    if (formData.event_date && formData.feedback_open_at) {
      const eventStart = new Date(formData.event_date);
      eventStart.setHours(0, 0, 0, 0);
      if (formData.feedback_open_at < eventStart) {
        newErrors.feedback_open_at = 'Feedback cannot open before the event date';
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
        cleanedData.event_date = formData.event_date ? format(formData.event_date, 'yyyy-MM-dd') : null;
      }
      if (formData.feedback_open_at !== undefined) {
        cleanedData.feedback_open_at = formData.feedback_open_at ? format(formData.feedback_open_at, "yyyy-MM-dd'T'HH:mm:ss") : null;
      }
      if (formData.feedback_close_at !== undefined) {
        cleanedData.feedback_close_at = formData.feedback_close_at ? format(formData.feedback_close_at, "yyyy-MM-dd'T'HH:mm:ss") : null;
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
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300"
      onClick={handleClose}
    >
      <div
        className="bg-card-bg border border-card-border rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-card-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <Edit className="w-6 h-6 text-accent" />
            </div>
            <h2 className="text-[24px] font-bold text-fg tracking-tight">Edit Event</h2>
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
          {/* Event Title */}
          <div>
            <label className="block mb-2 text-[14px] font-semibold text-fg-secondary">
              Event Title <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`w-full px-4 py-3 rounded-lg transition-colors bg-bg text-fg text-[15px] outline-none border ${errors.title ? 'border-danger' : 'border-card-border/50 hover:border-accent/50 focus:border-accent'}`}
              placeholder="Enter event title"
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="mt-1 text-[13px] text-danger">{errors.title}</p>
            )}
          </div>

          {/* Event Description */}
          <div>
            <label className="block mb-2 text-[14px] font-semibold text-fg-secondary">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`w-full px-4 py-3 rounded-lg transition-colors resize-none bg-bg text-fg text-[15px] outline-none border ${errors.description ? 'border-danger' : 'border-card-border/50 hover:border-accent/50 focus:border-accent'}`}
              placeholder="Enter event description (optional)"
              rows={4}
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
          </div>

          {/* Feedback Window */}
          <div className="p-5 rounded-lg bg-bg-secondary border border-card-border/50">
            <h3 className="mb-2 text-[14px] font-semibold text-fg">
              Feedback Collection Window
            </h3>
            <p className="mb-5 text-[13px] text-fg-secondary">
              Define when participants can submit feedback for this event
            </p>

            <div className="flex flex-col gap-3">
              {/* Open At */}
              <div className="flex flex-col gap-1.5">
                <AppleDateTimePicker
                  label="Opens At"
                  value={formData.feedback_open_at}
                  onChange={(date: Date | null) => {
                    setFormData({ ...formData, feedback_open_at: date });
                    setErrors({ ...errors, feedback_open_at: undefined });
                  }}
                  disabled={isSubmitting || hasEventStarted}
                />
                {errors.feedback_open_at && (
                  <p className="px-1 text-[12px] text-danger">{errors.feedback_open_at}</p>
                )}
              </div>

              {/* Close At */}
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
            className="flex-1 px-4 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2 bg-accent text-white hover:bg-accent/90"
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
