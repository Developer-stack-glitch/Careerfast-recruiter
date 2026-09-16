'use client';
import React from "react";
import { Form, Input } from "antd";

export default function CommonPasswordField({
  label,
  mandatory,
  name,
  placeholder,
  value,
  error,
  errorMessage,
  message,
  onChange,
  prefix,
  size,
  min,
}) {
  return (
    <div className="commonpassfield">
      <Form.Item
        layout="vertical"
        label={<span className="input-label">{mandatory && <span className="required-mark">*</span>}{label}</span>}
        name={name}
        // Removed rules and help to prevent duplicate error UI
        style={{ marginBottom: 0 }}
      >
        <Input.Password
          prefix={prefix}
          placeholder={placeholder}
          size={size}
          value={value}
          className="premium-input"
          onChange={onChange}
        />
      </Form.Item>
      <div className={error ? "show-premium-input-error" : "hide-premium-input-error"}>
        {error && <p className="premium-error-text">{error}</p>}
      </div>
    </div>
  );
}
