import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, X, Check } from 'lucide-react';

export const formatDateYYYYMMDD = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const getPresetDateRange = (preset) => {
    const now = new Date();
    const todayStr = formatDateYYYYMMDD(now);

    switch (preset) {
        case 'Today':
            return { startDate: todayStr, endDate: todayStr, label: 'Today' };

        case 'Yesterday': {
            const y = new Date();
            y.setDate(y.getDate() - 1);
            const yStr = formatDateYYYYMMDD(y);
            return { startDate: yStr, endDate: yStr, label: 'Yesterday' };
        }

        case 'Last 7 Days': {
            const start = new Date();
            start.setDate(start.getDate() - 6);
            return { startDate: formatDateYYYYMMDD(start), endDate: todayStr, label: 'Last 7 Days' };
        }

        case 'Last 30 Days': {
            const start = new Date();
            start.setDate(start.getDate() - 29);
            return { startDate: formatDateYYYYMMDD(start), endDate: todayStr, label: 'Last 30 Days' };
        }

        case 'This Month': {
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            return { startDate: formatDateYYYYMMDD(start), endDate: todayStr, label: 'This Month' };
        }

        case 'Last Month': {
            const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const end = new Date(now.getFullYear(), now.getMonth(), 0);
            return { startDate: formatDateYYYYMMDD(start), endDate: formatDateYYYYMMDD(end), label: 'Last Month' };
        }

        case 'This Year': {
            const start = new Date(now.getFullYear(), 0, 1);
            return { startDate: formatDateYYYYMMDD(start), endDate: todayStr, label: 'This Year' };
        }

        case 'All Time':
        default:
            return { startDate: '', endDate: '', label: 'All Time' };
    }
};

export default function AdminDateFilter({
    value = { preset: 'All Time', startDate: '', endDate: '', label: 'All Time' },
    onChange,
    presets = ['All Time', 'Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Last Month'],
    className = ''
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [isCustom, setIsCustom] = useState(value.preset === 'Custom Range');
    const [customStart, setCustomStart] = useState(value.startDate || '');
    const [customEnd, setCustomEnd] = useState(value.endDate || '');
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectPreset = (preset) => {
        setIsCustom(false);
        const range = getPresetDateRange(preset);
        onChange?.({
            preset,
            startDate: range.startDate,
            endDate: range.endDate,
            label: range.label
        });
        setIsOpen(false);
    };

    const handleApplyCustom = () => {
        if (!customStart && !customEnd) return;
        setIsCustom(true);
        const formatDisplay = (d) => {
            if (!d) return '';
            const [y, m, day] = d.split('-');
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${months[parseInt(m, 10) - 1]} ${parseInt(day, 10)}`;
        };

        const label = customStart && customEnd
            ? `${formatDisplay(customStart)} – ${formatDisplay(customEnd)}`
            : customStart
                ? `From ${formatDisplay(customStart)}`
                : `Until ${formatDisplay(customEnd)}`;

        onChange?.({
            preset: 'Custom Range',
            startDate: customStart,
            endDate: customEnd,
            label
        });
        setIsOpen(false);
    };

    const handleClear = (e) => {
        e.stopPropagation();
        setCustomStart('');
        setCustomEnd('');
        setIsCustom(false);
        onChange?.({
            preset: 'All Time',
            startDate: '',
            endDate: '',
            label: 'All Time'
        });
    };

    const isFiltered = value.preset && value.preset !== 'All Time';

    return (
        <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-[13px] font-medium transition-all shadow-xs outline-none select-none ${
                    isFiltered
                        ? 'bg-blue-50/80 border-blue-200 text-blue-700 hover:bg-blue-100/70 hover:border-blue-300'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                }`}
            >
                <Calendar className={`w-4 h-4 shrink-0 ${isFiltered ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className="truncate max-w-[170px]">{value.label || 'Date Filter'}</span>
                
                {isFiltered ? (
                    <span
                        onClick={handleClear}
                        title="Clear date filter"
                        className="p-0.5 rounded-full hover:bg-blue-200/70 text-blue-600 transition-colors ml-0.5"
                    >
                        <X className="w-3.5 h-3.5" />
                    </span>
                ) : (
                    <ChevronDown className={`w-3.5 h-3.5 shrink-0 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 sm:right-auto sm:left-0 mt-1.5 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3.5 py-1.5 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        Filter by Date
                    </div>

                    <div className="py-1 max-h-56 overflow-y-auto hide-scrollbar">
                        {presets.map((preset) => {
                            const isSelected = !isCustom && value.preset === preset;
                            return (
                                <button
                                    key={preset}
                                    type="button"
                                    onClick={() => handleSelectPreset(preset)}
                                    className={`w-full flex items-center justify-between px-3.5 py-2 text-[13px] text-left transition-colors ${
                                        isSelected
                                            ? 'bg-blue-50/80 text-blue-700 font-semibold'
                                            : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <span>{preset}</span>
                                    {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                                </button>
                            );
                        })}
                    </div>

                    {/* Custom Date Range Section */}
                    <div className="border-t border-gray-100 px-3.5 pt-2.5 pb-1">
                        <div className="text-[12px] font-semibold text-gray-700 mb-2">Custom Range</div>
                        <div className="grid grid-cols-2 gap-2 mb-2.5">
                            <div>
                                <label className="block text-[10px] text-gray-400 uppercase font-medium mb-1">From</label>
                                <input
                                    type="date"
                                    value={customStart}
                                    onChange={(e) => setCustomStart(e.target.value)}
                                    className="w-full px-2 py-1.5 text-[12px] bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] text-gray-400 uppercase font-medium mb-1">To</label>
                                <input
                                    type="date"
                                    value={customEnd}
                                    onChange={(e) => setCustomEnd(e.target.value)}
                                    className="w-full px-2 py-1.5 text-[12px] bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleApplyCustom}
                                disabled={!customStart && !customEnd}
                                className="flex-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-[12px] font-medium transition-colors shadow-xs"
                            >
                                Apply
                            </button>
                            {(customStart || customEnd || isCustom) && (
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-[12px] font-medium transition-colors"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
