'use client';
import React from "react";
import { DatePicker, Space } from "antd";
import dayjs from "dayjs";
import "./commonstyles.css";
export default function CommonDatePicker({
  onChange,
  value,
  defaultValue,
  month,
  placeholder,
  label,
  error,
  mandatory,
  style,
  disabled,
}) {
  const handleChange = (date) => {
    const dates = new Date(date.$d);

    // Format the date using toString method
    const formattedDate = dates.toString();
    onChange(formattedDate);
  };

  // Disable future dates
  const disableFutureDates = (current) => {
    return current && current > dayjs().endOf("day"); // Disable dates greater than today
  };

  return (
    <div style={style}>
      <div style={{ display: "flex", marginBottom: 8 }}>
        {label && (
          <label className="commonfield_label">
            <span style={{ color: "red" }}>* </span>
            {label}
          </label>
        )}
        {mandatory === true ? <p style={{ color: "red" }}>*</p> : ""}
      </div>
      <Space direction="vertical" style={{ width: "100%" }}>
        <DatePicker
          getPopupContainer={(trigger) => trigger.parentNode}
          className={"premium-input"}
          picker={month === "true" ? "month" : "date"}
          onChange={handleChange}
          value={value ? dayjs(value) : null}
          defaultValue={defaultValue}
          format="DD-MM-YYYY"
          placeholder={placeholder}
          status={error ? "error" : ""}
          style={{ width: "100%" }}
          allowClear={false}
          disabledDate={disableFutureDates}
          disabled={disabled}
        />
      </Space>
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

