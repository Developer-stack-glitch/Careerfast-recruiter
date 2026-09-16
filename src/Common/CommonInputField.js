'use client';
import React from "react";
import { Input } from "antd";
import "./commonstyles.css";

export default function CommonInputField({
  label,
  mandatory,
  onChange,
  error,
  placeholder,
  type,
  pattern,
  value,
  name,
  onPressEnter,
  errorMessage,
  prefix,
  readOnly,
  disabled,
}) {
  return (
    <div className="commoninputfield">
      <div className="input-label-row">
        <p className="input-label">
          {mandatory === true && <span className="required-mark">*</span>}
          {label}
        </p>
      </div>
      <Input
        name={name}
        placeholder={placeholder}
        className={"premium-input"}
        onChange={onChange}
        type={type}
        pattern={pattern}
        value={value}
        readOnly={readOnly}
        disabled={disabled}
        prefix={prefix}
        onPressEnter={onPressEnter}
      />
      <div className={error ? "show-premium-input-error" : "hide-premium-input-error"}>
        {error && <p className="premium-error-text">{error}</p>}
      </div>
    </div>
  );
}
