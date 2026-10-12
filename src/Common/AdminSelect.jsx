'use client';
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function AdminSelect({
    value,
    onChange,
    options = [],
    placeholder = 'Select option',
    className = '',
    menuClassName = '',
    size = 'md',
    align = 'left',
    direction = 'auto',
    disabled = false
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [openUpward, setOpenUpward] = useState(false);
    const containerRef = useRef(null);

    // Calculate position when opening
    useEffect(() => {
        if (!isOpen || !containerRef.current) return;

        if (direction === 'up') {
            setOpenUpward(true);
            return;
        }
        if (direction === 'down') {
            setOpenUpward(false);
            return;
        }

        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;

        // If there's less than 180px below and more room above, flip upward
        if (spaceBelow < 180 && spaceAbove > 200) {
            setOpenUpward(true);
        } else {
            setOpenUpward(false);
        }
    }, [isOpen, direction]);

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    const selectedOption = options.find(opt => String(opt.value) === String(value));
    const isFiltered = Boolean(value) && String(value).toLowerCase() !== 'all' && String(value).trim() !== '';
    const isFullWidth = className.includes('w-full');

    // Size variants
    const sizeClasses = {
        sm: 'px-3 py-2 text-xs',
        md: 'px-3.5 py-2.5 text-sm',
        lg: 'px-4 py-3 text-base'
    }[size] || 'px-3.5 py-2.5 text-sm';

    return (
        <div ref={containerRef} className={`relative inline-block text-left ${isOpen ? 'z-[60]' : 'z-10'} ${className}`}>
            {/* Trigger Button */}
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between gap-2.5 min-w-[130px] w-full rounded-xl border text-left font-medium transition-all outline-none select-none ${sizeClasses} ${disabled
                        ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                        : isFiltered
                            ? 'bg-blue-50/80 border-blue-200 text-blue-700 hover:bg-blue-100/70 hover:border-blue-300 cursor-pointer'
                            : 'bg-slate-50 border-slate-200/90 text-slate-700 hover:bg-white hover:border-blue-500 cursor-pointer'
                    } ${isOpen ? 'ring-2 ring-blue-500/20 border-blue-500 bg-white' : ''}`}
            >
                <span className="truncate flex-1">
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isFiltered ? 'text-blue-600' : 'text-gray-400'
                    } ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    className={`absolute z-[70] ${isFullWidth ? 'w-full min-w-full' : 'min-w-[180px] w-max max-w-[calc(100vw-2rem)] sm:max-w-xs md:max-w-md'} bg-white rounded-xl shadow-2xl border border-slate-200/90 py-1.5 animate-in fade-in zoom-in-95 duration-150 ${menuClassName} ${align === 'right' ? 'right-0' : 'left-0'
                        } ${openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
                        }`}
                >
                    <div className="max-h-56 overflow-y-auto hide-scrollbar">
                        {options.map((option) => {
                            const isSelected = String(value) === String(option.value);
                            const isDisabled = Boolean(option.disabled);
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    disabled={isDisabled}
                                    onClick={() => {
                                        if (isDisabled) return;
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-[13px] text-left transition-colors ${
                                        isDisabled
                                            ? 'opacity-40 cursor-not-allowed bg-slate-50/50 text-slate-400'
                                            : isSelected
                                                ? 'bg-blue-50/80 text-blue-700 font-semibold cursor-pointer'
                                                : 'text-gray-700 hover:bg-gray-50 cursor-pointer'
                                    }`}
                                >
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <span className="whitespace-normal leading-snug">{option.label}</span>
                                        {option.subLabel && (
                                            <span className="text-[11px] text-slate-400 mt-0.5">{option.subLabel}</span>
                                        )}
                                    </div>
                                    {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0 ml-2" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
