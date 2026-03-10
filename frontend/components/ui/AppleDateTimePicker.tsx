import React, { useRef } from 'react';
import { Calendar, Clock, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface DateTimeProps {
    label: string;
    value: Date | null;
    onChange: (d: Date | null) => void;
    minDate?: Date | null;
    disabled?: boolean;
}

export function AppleDateTimePicker({ label, value, onChange, minDate, disabled }: DateTimeProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    // Use Europe timezone
    const userTimeZone = 'Europe/Berlin';
    let tzAbbr = 'CET';
    try {
        tzAbbr = new Intl.DateTimeFormat('en-US', { timeZone: userTimeZone, timeZoneName: 'short' }).formatToParts().find(p => p.type === 'timeZoneName')?.value || 'CET';
    } catch (e) { }
    const tzCity = 'Berlin';

    const localValue = value ? format(value, "yyyy-MM-dd'T'HH:mm") : '';
    const minLocalValue = minDate ? format(minDate, "yyyy-MM-dd'T'HH:mm") : undefined;

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent accidental double-clicks from cascading
        if (disabled) return;
        const input = inputRef.current as any;
        if (input) {
            if (typeof input.showPicker === 'function') {
                try {
                    input.showPicker();
                } catch (err) {
                    input.focus();
                }
            } else {
                input.focus();
            }
        }
    };

    return (
        <div
            onClick={handleClick}
            className={`group relative flex items-center justify-between p-4 bg-card-bg border border-card-border rounded-[18px] transition-all duration-300 shadow-sm cursor-pointer ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md hover:border-accent/50'}`}
        >
            {/* Hidden Native Input */}
            <input
                ref={inputRef}
                type="datetime-local"
                value={localValue}
                min={minLocalValue}
                onChange={(e) => {
                    if (!e.target.value) onChange(null);
                    else onChange(new Date(e.target.value));
                }}
                disabled={disabled}
                className="absolute w-2 h-2 opacity-0 -z-10" // invisible but remains in DOM for the picker to attach to
                style={{ left: '50%', top: '50%' }}
            />

            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[14px] bg-accent/10 flex items-center justify-center text-accent shadow-sm group-hover:scale-105 transition-transform duration-300 ease-out">
                    <Clock className="w-[22px] h-[22px]" />
                </div>
                <div className="flex flex-col items-start gap-1">
                    <h4 className="text-[16px] font-semibold text-fg tracking-tight leading-none">{label}</h4>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 mt-0.5 rounded-md bg-bg-secondary text-fg-secondary text-[11px] font-bold uppercase tracking-widest border border-card-border/50">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                        <span>{tzAbbr} ({tzCity})</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {value ? (
                    <div className="flex flex-col items-end">
                        <span className="text-[15px] font-semibold text-fg">
                            {format(value, 'MMM d, yyyy')}
                        </span>
                        <span className="text-[14px] font-bold text-accent">
                            {format(value, 'h:mm a')}
                        </span>
                    </div>
                ) : (
                    <span className="text-[14px] font-medium text-fg-secondary/70 bg-bg-secondary px-3 py-1.5 rounded-[10px]">
                        Set Time
                    </span>
                )}
                <ChevronRight className="w-5 h-5 text-fg-secondary/40 group-hover:text-accent transition-colors duration-300 group-hover:translate-x-0.5" />
            </div>
        </div>
    );
}

export function AppleDatePicker({ label, value, onChange, disabled }: Omit<DateTimeProps, 'minDate'>) {
    const inputRef = useRef<HTMLInputElement>(null);

    const localValue = value ? format(value, "yyyy-MM-dd") : '';

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (disabled) return;
        const input = inputRef.current as any;
        if (input) {
            if (typeof input.showPicker === 'function') {
                try {
                    input.showPicker();
                } catch (err) {
                    input.focus();
                }
            } else {
                input.focus();
            }
        }
    };

    return (
        <div
            onClick={handleClick}
            className={`group relative flex items-center justify-between p-4 bg-card-bg border border-card-border rounded-[18px] transition-all duration-300 shadow-sm cursor-pointer ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md hover:border-accent/50'}`}
        >
            {/* Hidden Native Input */}
            <input
                ref={inputRef}
                type="date"
                value={localValue}
                onChange={(e) => {
                    if (!e.target.value) onChange(null);
                    else {
                        const [year, month, day] = e.target.value.split('-').map(Number);
                        onChange(new Date(year, month - 1, day));
                    }
                }}
                disabled={disabled}
                className="absolute w-2 h-2 opacity-0 -z-10"
                style={{ left: '50%', top: '50%' }}
            />

            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[14px] bg-accent/10 flex items-center justify-center text-accent shadow-sm group-hover:scale-105 transition-transform duration-300 ease-out">
                    <Calendar className="w-[22px] h-[22px]" />
                </div>
                <div className="flex flex-col items-start gap-1">
                    <h4 className="text-[16px] font-semibold text-fg tracking-tight leading-none">{label}</h4>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {value ? (
                    <span className="text-[15px] font-semibold text-fg">
                        {format(value, 'MMMM d, yyyy')}
                    </span>
                ) : (
                    <span className="text-[14px] font-medium text-fg-secondary/70 bg-bg-secondary px-3 py-1.5 rounded-[10px]">
                        Set Date
                    </span>
                )}
                <ChevronRight className="w-5 h-5 text-fg-secondary/40 group-hover:text-accent transition-colors duration-300 group-hover:translate-x-0.5" />
            </div>
        </div>
    );
}
