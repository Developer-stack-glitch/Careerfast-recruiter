'use client';
import React from "react";
import TextArea from "antd/es/input/TextArea";

import { message, Form } from "antd";
export default function CommonTextArea({
  placeholder,
  name,
  mandatory,
  value,
  label,
  error,
  onChange,
  clasname = "premium-input1",
  text,
  style = { height: "auto" },
}) {
  return (
    <div className="commontextarea">
      <Form.Item
        layout="vertical"
        label={
          <span>
            {mandatory ? <span style={{ color: "red" }}>* </span> : ""}
            {label}
          </span>
        }
      >
        <TextArea
          style={style}
          name={name}
          onChange={onChange}
          placeholder={placeholder}
          value={value}
          className={clasname}
          rows={4}
        />
      </Form.Item>
      <div
        className={
          error ? "show-premium-input-error" : "hide-premium-input-error"
        }
      >
        <p style={{ color: "red" }}>{label + error}</p>
      </div>
    </div>
  );
}

