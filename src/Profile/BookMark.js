'use client';
import React, { useState } from "react";
import { Typography, Input, Card } from "antd";
import {
  FiBookmark,
  FiMapPin,
  FiBriefcase,
  FiDollarSign,
} from "react-icons/fi";
const { Title, Text } = Typography;
const bookMarkJobs = [
  {
    id: 1,
    title: "Customer Service Representative",
    company: "Neelam",
    salary: "₹2.4L - 2.6L LPA",
    location: "Bangalore",
    experience: "0-2 years",
    saved: true,
  },
  {
    id: 2,
    title: "Customer Service Representative",
    company: "Neelam",
    salary: "₹2.4L - 2.6L LPA",
    location: "Bangalore",
    experience: "0-2 years",
    saved: true,
  },
  {
    id: 3,
    title: "Customer Service Representative",
    company: "Neelam",
    salary: "₹2.4L - 2.6L LPA",
    location: "Bangalore",
    experience: "0-2 years",
    saved: true,
  },
  {
    id: 4,
    title: "Customer Service Representative",
    company: "Neelam",
    salary: "₹2.4L - 2.6L LPA",
    location: "Bangalore",
    experience: "0-2 years",
    saved: true,
  },
  {
    id: 5,
    title: "Customer Service Representative",
    company: "Amazon",
    salary: "₹2.4L - 2.6L LPA",
    location: "Bangalore",
    experience: "0-2 years",
    saved: true,
  },
  {
    id: 6,
    title: "Customer Service Representative",
    company: "Neelam",
    salary: "₹2.4L - 2.6L LPA",
    location: "Bangalore",
    experience: "0-2 years",
    saved: true,
  },
];

export default function BookMark() {
  return (
    <div
      style={{
        padding: "24px 32px",
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
      }}
      className="compact-jobs-container"
    >
      <div
        style={{
          textAlign: "left",
          marginBottom: 34,
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          Bookmarked Jobs
        </Title>
        <hr style={{ color: "rgb(151 151 151)" }}></hr>
      </div>

      <div className="compact-jobs-list">
        {bookMarkJobs.length > 0 ? (
          bookMarkJobs.map((job) => (
            <div className="compact-job-card" key={job.id}>
              <div className="compact-job-header">
                <div
                  className="compact-company-badge"
                  style={{ background: job.bgColor }}
                >
                  {job.company.substring(0, 2).toUpperCase()}
                </div>

                <div className="compact-job-info">
                  <h3>{job.title}</h3>
                  <p>{job.company}</p>
                </div>

                <button
                  className={`compact-save-btn ${job.saved ? "saved" : ""}`}
                >
                  <FiBookmark />
                </button>
              </div>

              <div className="compact-job-details">
                <div className="detail-item">
                  <FiMapPin />
                  <span>{job.location}</span>
                </div>

                <div className="detail-item">
                  <FiBriefcase />
                  <span>{job.experience}</span>
                </div>

                <div className="detail-item">
                  <FiDollarSign />
                  <span>{job.salary}</span>
                </div>
              </div>

              <button className="compact-view-btn">View Details</button>
            </div>
          ))
        ) : (
          <Card style={{ textAlign: "center", padding: 40 }}>
            <Title level={4} style={{ color: "#bfbfbf" }}>
              No opportunities found
            </Title>
            <Text type="secondary">
              Try adjusting your filters or search query
            </Text>
          </Card>
        )}
      </div>
    </div>
  );
}

