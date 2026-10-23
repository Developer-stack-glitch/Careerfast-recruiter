'use client';
import React from 'react';
import { Select } from 'antd';
import './commonstyles.css';

export default function CommonSelectField({
  label,
  name,
  placeholder,
  mandatory,
  onChange,
  options = [],
  value,
  error,
  errorMessage,
  disabled,
  showSearch,
  optionFilterProp = 'children',
  prefix,
  className = 'premium-input',
  popupClassName,
  classNames: classNamesProp,
  containerClassName = '',
  containerStyle,
  asteriskPlacement = 'right',
  filterOption,
  ...rest
}) {
  return (
    <div className={`commonselectfield ${containerClassName}`} style={containerStyle}>
      {label && (
        <div className="input-label-row">
          <p className="input-label">
            {asteriskPlacement === 'left' && mandatory && <span className="required-mark">* </span>}
            {label}
            {asteriskPlacement === 'right' && mandatory && <span className="required-mark"> *</span>}
          </p>
        </div>
      )}
      <div className="select-input-wrapper" style={{ position: 'relative' }}>
        {prefix && (
          <div
            className="select-prefix-icon"
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
              color: '#94a3b8',
              fontSize: '16px',
            }}
          >
            {prefix}
          </div>
        )}
        <Select
          showSearch={showSearch}
          placeholder={placeholder}
          optionFilterProp={optionFilterProp}
          className={`${className} ${prefix ? 'with-prefix' : ''} ${error ? 'err-border' : ''}`}
          onChange={onChange}
          value={value || undefined}
          disabled={disabled}
          classNames={{
            popup: { root: popupClassName ?? 'cf-search-select-dropdown', ...(classNamesProp?.popup || {}) },
            ...classNamesProp,
          }}
          filterOption={
            filterOption !== undefined
              ? filterOption
              : (input, option) => {
                  const q = (input || '').toLowerCase().trim();
                  if (!q) return true;
                  const labelStr = typeof option?.label === 'string' ? option.label.toLowerCase() : '';
                  const triggerStr = String(option?.triggerLabel || '').toLowerCase();
                  const valStr = String(option?.value || '').toLowerCase();
                  const searchStr = String(option?.search || option?.searchtext || option?.title || '').toLowerCase();
                  return (
                    labelStr.includes(q) ||
                    triggerStr.includes(q) ||
                    valStr.includes(q) ||
                    searchStr.includes(q)
                  );
                }
          }
          options={(() => {
            const mapped = (options || []).map((item) => ({
              ...item,
              label: item.label ?? item.name ?? String(item.value ?? item.id ?? ''),
              value: item.value ?? item.isoCode ?? item.id ?? item.name,
            }));
            if (
              value !== undefined &&
              value !== null &&
              value !== '' &&
              !mapped.some(
                (opt) =>
                  String(opt.value) === String(value) ||
                  String(opt.label).trim().toLowerCase() === String(value).trim().toLowerCase()
              )
            ) {
              mapped.unshift({ label: String(value), value: value });
            }
            return mapped;
          })()}
          {...rest}
        />
      </div>

      <div className={error || errorMessage ? 'show-premium-input-error' : 'hide-premium-input-error'}>
        {(error || errorMessage) && (
          <p className="premium-error-text">{error || errorMessage}</p>
        )}
      </div>
    </div>
  );
}
