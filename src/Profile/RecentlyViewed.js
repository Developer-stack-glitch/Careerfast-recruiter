'use client';
import React, { useState } from "react";
import { FiCalendar, FiChevronRight } from "react-icons/fi";
import { FaRegBookmark, FaBookmark } from "react-icons/fa";
import { CiLocationOn } from "react-icons/ci";
import { CommonToaster } from "../Common/CommonToaster";
import Header from "../Header/Header";
const RecentlyViewed = () => {
  const [recentlyViewed, setRecentlyViewed] = useState([
    {
      id: 1,
      title: "Sales Officer",
      company: "Supro Info Solutions Limited",
      logo: "/logos/supro.png",
      daysLeft: "13 days left",
      tags: ["Experienced Professionals"],
      salary: "₹3.5L - ₹4.5L LPA",
      location: "Bangalore",
      status: "saved",
    },
    {
      id: 2,
      title: "HR Analyst",
      company: "Markerz Global Solution",
      logo: "/logos/hr.png",
      daysLeft: "Ended",
      tags: ["Fresher"],
      salary: "₹2.8L - ₹3.2L LPA",
      location: "Hyderabad",
      status: "unsaved",
    },
    {
      id: 3,
      title: "Market Research Challenge",
      company: "Textify AI",
      logo: "/logos/textify.png",
      daysLeft: "3 days left",
      tags: ["All", "Marketing"],
      salary: "Prize: ₹50,000",
      location: "Remote",
      status: "unsaved",
    },
    {
      id: 4,
      title: "Data Engineer",
      company: "Komodo Health",
      logo: "/logos/komodo.png",
      daysLeft: "6 days left",
      tags: ["Experienced Professionals"],
      salary: "₹8L - ₹12L LPA",
      location: "Mumbai",
      status: "unsaved",
    },
    {
      id: 5,
      title: "Senior Executive",
      company: "HCL Technologies Limited",
      logo: "/logos/hcl.png",
      daysLeft: "6 days left",
      tags: ["Fresher", "Engineering"],
      salary: "₹4L - ₹5.5L LPA",
      location: "Chennai",
      status: "unsaved",
    },
  ]);

  const toggleSaveJob = (status, index) => {
    let data = [...recentlyViewed];
    if (status === "saved") {
      data[index].status = "unsaved";
      CommonToaster("Removed from bookmark", "error");
    } else {
      data[index].status = "saved";
      CommonToaster("Added to bookmark", "success");
    }
    setRecentlyViewed(data);
  };

  return (
    <section className="recently-viewed-container">
      <div className="recently-viewed-header">
        <h2 className="section-title">Recently Viewed Opportunities</h2>
      </div>

      <div className="recently-viewed-list">
        {recentlyViewed.map((job, index) => (
          <div className="recently-viewed-card" key={job.id}>
            <div className="card-header">
              <div className="company-logo-container">
                <img
                  src={job.logo}
                  alt={job.company}
                  className="company-logo"
                />
              </div>
              <div className="job-meta-header">
                <div>
                  <h3 className="job-title">{job.title}</h3>
                  <p className="company-name">{job.company}</p>
                </div>
                <button
                  className="save-btn"
                  onClick={() => toggleSaveJob(job.status, index)}
                >
                  {job.status === "saved" ? (
                    <FaBookmark className="saved" />
                  ) : (
                    <FaRegBookmark />
                  )}
                </button>
              </div>
            </div>

            <div className="job-details">
              <div className="detail-item">
                <FiCalendar className="detail-icon" />
                <span className={job.daysLeft === "Ended" ? "ended" : ""}>
                  {job.daysLeft}
                </span>
              </div>
              <div className="detail-item">
                <span className="salary">{job.salary}</span>
              </div>
              <div className="detail-item">
                <span className="location">
                  <CiLocationOn /> {job.location}
                </span>
              </div>
            </div>

            <div className="job-tags">
              {job.tags.map((tag, idx) => (
                <span className="tag" key={idx}>
                  {tag}
                </span>
              ))}
            </div>

            <button className="view-details-btn">
              View Details <FiChevronRight />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RecentlyViewed;

