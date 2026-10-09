'use client';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

/**
 * NeatSelect - Modern, neat, customizable dropdown select component.
 * Replaces native browser <select> with a sleek, polished UI.
 * 
 * @param {any} value - Currently selected value
 * @param {function} onChange - Callback receiving new value: (value) => void
 * @param {Array<string|number|{value: any, label: any, icon?: any, badge?: any}>} options - Select options
 * @param {string} placeholder - Placeholder when no value selected
 * @param {string} size - 'sm' | 'md' | 'lg' | 'inline' (default: 'md')
 * @param {string} className - Additional CSS classes for outer container
 * @param {string} buttonClassName - Additional CSS classes for trigger button
 * @param {string} menuClassName - Additional CSS classes for dropdown panel
 * @param {boolean} disabled - Whether the select is disabled
 * @param {boolean} searchable - Force enable/disable search filter inside dropdown
 * @param {string} align - 'left' | 'right' dropdown alignment (default: 'left')
 * @param {React.ReactNode} prefix - Left icon or text inside trigger button
 */
export default function NeatSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select option',
  size = 'md',
  className = '',
  buttonClassName = '',
  menuClassName = '',
  disabled = false,
  searchable,
  align = 'left',
  prefix,
  minWidth = 'auto',
  ...rest
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openUpwards, setOpenUpwards] = useState(false);
  const wrapperRef = useRef(null);
  const searchInputRef = useRef(null);

  // Normalize options to [{ value, label, icon, badge }]
  const normalizedOptions = useMemo(() => {
    return (options || []).map((opt) => {
      if (opt !== null && typeof opt === 'object' && 'value' in opt) {
        return {
          value: opt.value,
          label: opt.label !== undefined ? opt.label : String(opt.value),
          icon: opt.icon,
          badge: opt.badge,
        };
      }
      return {
        value: opt,
        label: String(opt),
      };
    });
  }, [options]);

  // Find currently selected option
  const selectedOption = useMemo(() => {
    return normalizedOptions.find((opt) => String(opt.value) === String(value));
  }, [normalizedOptions, value]);

  // Check viewport position on open to determine upward/downward flip
  useEffect(() => {
    if (isOpen && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      if (spaceBelow < 280 && spaceAbove > 220) {
        setOpenUpwards(true);
      } else {
        setOpenUpwards(false);
      }
    }
  }, [isOpen]);

  // Click outside and ESC listener
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Filter options if searchable
  const isSearchEnabled = searchable !== undefined ? searchable : normalizedOptions.length > 8;
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions;
    const q = searchQuery.toLowerCase().trim();
    return normalizedOptions.filter((opt) =>
      String(opt.label).toLowerCase().includes(q)
    );
  }, [normalizedOptions, searchQuery]);

  const handleSelect = (optVal) => {
    if (disabled) return;
    if (onChange) {
      onChange(optVal);
    }
    setIsOpen(false);
    setSearchQuery('');
  };

  // Base size styles
  const sizeStyles = {
    sm: 'px-2.5 py-1 text-[12px] rounded-lg font-bold min-h-[30px]',
    md: 'px-3.5 py-2.5 text-[13.5px] rounded-xl font-medium min-h-[42px]',
    lg: 'px-4 py-3 text-[14px] rounded-xl font-medium min-h-[48px]',
    inline: 'px-2 py-0.5 text-[13px] rounded-md font-medium min-h-[26px] bg-transparent border-transparent hover:bg-slate-100',
  };

  const isInline = size === 'inline';

  return (
    <div
      ref={wrapperRef}
      className={`relative inline-block ${className}`}
      style={{ minWidth: minWidth !== 'auto' ? minWidth : undefined }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen((prev) => !prev);
            setSearchQuery('');
          }
        }}
        className={`w-full flex items-center justify-between gap-2 transition-all cursor-pointer select-none text-left ${
          isInline
            ? `${sizeStyles.inline} text-slate-700 hover:text-[#0A66C2]`
            : `bg-white border text-slate-800 shadow-2xs ${
                isOpen
                  ? 'border-[#0A66C2] ring-2 ring-blue-500/15'
                  : 'border-slate-200 hover:border-slate-300'
              } ${sizeStyles[size] || sizeStyles.md}`
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''} ${buttonClassName}`}
      >
        <div className="flex items-center gap-2 truncate flex-1 min-w-0">
          {prefix && <span className="shrink-0 text-slate-400">{prefix}</span>}
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <span className={`truncate ${selectedOption ? 'text-slate-800' : 'text-slate-400 font-normal'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          size={size === 'sm' || isInline ? 13 : 15}
          className={`text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#0A66C2]' : ''
          }`}
        />
      </button>

      {/* Floating Dropdown Panel */}
      {isOpen && (
        <div
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${
            openUpwards ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          } z-[100] bg-white border border-slate-200/90 rounded-2xl shadow-xl p-1.5 min-w-[170px] max-w-[340px] w-max max-h-[280px] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 ${menuClassName}`}
        >
          {/* Search Box */}
          {isSearchEnabled && (
            <div className="p-1.5 border-b border-slate-100 mb-1">
              <div className="relative flex items-center">
                <Search size={13} className="absolute left-2.5 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-7 pr-7 py-1.5 text-[12px] bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0A66C2] focus:bg-white"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="overflow-y-auto flex-1 p-0.5 space-y-0.5 scrollbar-thin">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={`${opt.value}-${idx}`}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left text-[12.5px] transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-blue-50 text-[#0A66C2] font-bold shadow-2xs'
                        : 'text-slate-700 hover:bg-slate-50 font-medium hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                      <span className="truncate">{opt.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {opt.badge && (
                        <span className="text-[10.5px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold">
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && (
                        <Check size={14} className="text-[#0A66C2] stroke-[2.5]" />
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-[12px] text-slate-400 text-center py-3">
                No matching options
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export { NeatSelect };
