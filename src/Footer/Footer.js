'use client';
import React, { useState, useEffect } from "react";
import logo from "../images/careerfastlogofinal.png";
import { useNavigate } from "@/routing-shim";
// Footer.css already in layout.jsx
import { getImageUrl } from "../utils/getImageUrl";
import { getJobPosts, getAllCourses } from "../ApiService/action";

export default function Footer() {
  const navigate = useNavigate();

  const [internshipLocations, setInternshipLocations] = useState([]);
  const [internshipStreams, setInternshipStreams] = useState([]);
  const [jobLocations, setJobLocations] = useState([]);
  const [jobStreams, setJobStreams] = useState([]);
  const [coursesList, setCoursesList] = useState([]);

  // Generate URL slugs
  const generateSlug = (text = "") => {
    return String(text)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsRes, coursesRes] = await Promise.all([
          getJobPosts({ limit: 150 }).catch(() => null),
          getAllCourses({ limit: 8 }).catch(() => null)
        ]);

        const jobs = jobsRes?.data?.data?.data || [];
        const courses = coursesRes?.data || coursesRes || [];

        const intLocs = new Set();
        const intStreams = new Set();
        const jLocs = new Set();
        const jStreams = new Set();

        jobs.forEach(job => {
          // Parse work_location
          let locations = [];
          if (job.work_location) {
            try {
              const parsed = Array.isArray(job.work_location)
                ? job.work_location
                : JSON.parse(job.work_location);
              if (Array.isArray(parsed)) {
                locations = parsed;
              } else if (typeof parsed === "string") {
                locations = [parsed];
              }
            } catch {
              if (typeof job.work_location === "string") {
                locations = [job.work_location];
              }
            }
          }
          locations = locations.map(l => l.trim()).filter(Boolean);

          // Parse job_category
          let categories = [];
          if (job.job_category) {
            try {
              const parsed = Array.isArray(job.job_category)
                ? job.job_category
                : JSON.parse(job.job_category);
              if (Array.isArray(parsed)) {
                categories = parsed;
              } else if (typeof parsed === "string") {
                categories = [parsed];
              }
            } catch {
              if (typeof job.job_category === "string") {
                categories = [job.job_category];
              }
            }
          }
          categories = categories.map(c => c.trim()).filter(Boolean);

          const isInternship = String(job.job_nature).toLowerCase().includes("intern");
          const isJob = String(job.job_nature).toLowerCase() === "job";

          if (isInternship) {
            locations.forEach(l => intLocs.add(l));
            categories.forEach(c => intStreams.add(c));
          } else if (isJob) {
            locations.forEach(l => jLocs.add(l));
            categories.forEach(c => jStreams.add(c));
          }
        });

        setInternshipLocations(Array.from(intLocs).slice(0, 8));
        setInternshipStreams(Array.from(intStreams).slice(0, 8));
        setJobLocations(Array.from(jLocs).slice(0, 8));
        setJobStreams(Array.from(jStreams).slice(0, 8));

        const formattedCourses = Array.isArray(courses) ? courses : (courses.data || []);
        setCoursesList(formattedCourses.slice(0, 8));
      } catch (err) {
        console.error("Error fetching footer categorization data:", err);
      }
    };

    fetchData();
  }, []);

  const fallbackInternshipLocations = ["Bangalore", "Delhi", "Hyderabad", "Mumbai", "Chennai", "Pune", "Kolkata", "Gurgaon"];
  const fallbackInternshipStreams = ["Full Stack Development", "DevOps & Cloud Computing", "Data Science & Analytics", "Frontend Development", "Software Development", "UI/UX Design"];
  const fallbackJobLocations = ["Bangalore", "Delhi", "Hyderabad", "Gurgaon", "Kolkata", "Mumbai", "Pune", "Noida", "Chennai"];
  const fallbackJobStreams = ["Full Stack Development", "DevOps & Cloud Computing", "Data Science & Analytics", "Frontend Development", "HR Analytics", "Software Development", "UI/UX Design"];
  const fallbackCourses = [
    { title: "Full Stack Web Development", slug: "full-stack-web-development" },
    { title: "Data Science & Machine Learning", slug: "data-science-machine-learning" },
    { title: "Digital Marketing Masterclass", slug: "digital-marketing-masterclass" },
    { title: "UI/UX Design Professional", slug: "ui-ux-design-professional" },
    { title: "Product Management 101", slug: "product-management-101" },
    { title: "Artificial Intelligence for Business", slug: "ai-for-business" }
  ];

  const displayIntLocations = internshipLocations.length > 0 ? internshipLocations : fallbackInternshipLocations;
  const displayIntStreams = internshipStreams.length > 0 ? internshipStreams : fallbackInternshipStreams;
  const displayJobLocations = jobLocations.length > 0 ? jobLocations : fallbackJobLocations;
  const displayJobStreams = jobStreams.length > 0 ? jobStreams : fallbackJobStreams;
  const displayCourses = coursesList.length > 0 ? coursesList : fallbackCourses;

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Dynamic Footer Links Categorization Section */}
        <div className="footer-categorization">
          <div className="footer-cat-grid">
            {/* Column 1: Internship by Places */}
            <div className="footer-cat-col">
              <h4 className="footer-cat-title">Internship by Places</h4>
              <ul className="footer-cat-list">
                {displayIntLocations.map((loc, idx) => (
                  <li key={idx}>
                    <a
                      onClick={() => navigate(loc.toLowerCase() === "work from home" ? "/internships/work-from-home" : `/internships/internships-in-${generateSlug(loc)}`)}
                      className="footer-cat-link"
                    >
                      Internship in {loc}
                    </a>
                  </li>
                ))}
                <li>
                  <a onClick={() => navigate("/job-filter?job_nature=Internship")} className="footer-cat-view-all">
                    View all internships &gt;
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 2: Internship by Stream */}
            <div className="footer-cat-col">
              <h4 className="footer-cat-title">Internship by Stream</h4>
              <ul className="footer-cat-list">
                {displayIntStreams.map((stream, idx) => (
                  <li key={idx}>
                    <a
                      onClick={() => navigate(`/internships/${generateSlug(stream)}-jobs`)}
                      className="footer-cat-link"
                    >
                      {stream} Internship
                    </a>
                  </li>
                ))}
                <li>
                  <a onClick={() => navigate("/job-filter?job_nature=Internship")} className="footer-cat-view-all">
                    View all internships &gt;
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Jobs by Places */}
            <div className="footer-cat-col">
              <h4 className="footer-cat-title">Jobs by Places</h4>
              <ul className="footer-cat-list">
                {displayJobLocations.map((loc, idx) => (
                  <li key={idx}>
                    <a
                      onClick={() => navigate(loc.toLowerCase() === "work from home" ? "/jobs/work-from-home" : `/jobs/jobs-in-${generateSlug(loc)}`)}
                      className="footer-cat-link"
                    >
                      Jobs in {loc}
                    </a>
                  </li>
                ))}
                <li>
                  <a onClick={() => navigate("/jobs")} className="footer-cat-view-all">
                    View all jobs &gt;
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4: Jobs by Stream */}
            <div className="footer-cat-col">
              <h4 className="footer-cat-title">Jobs by Stream</h4>
              <ul className="footer-cat-list">
                {displayJobStreams.map((stream, idx) => (
                  <li key={idx}>
                    <a
                      onClick={() => navigate(`/jobs/${generateSlug(stream)}-jobs`)}
                      className="footer-cat-link"
                    >
                      {stream} Jobs
                    </a>
                  </li>
                ))}
                <li>
                  <a onClick={() => navigate("/jobs")} className="footer-cat-view-all">
                    View all jobs &gt;
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 5: Explore Courses */}
            <div className="footer-cat-col">
              <h4 className="footer-cat-title">Explore Courses</h4>
              <ul className="footer-cat-list">
                {displayCourses.map((course, idx) => (
                  <li key={idx}>
                    <a
                      onClick={() => navigate(`/courses/${course.slug}`)}
                      className="footer-cat-link"
                    >
                      {course.title}
                    </a>
                  </li>
                ))}
                <li>
                  <a onClick={() => navigate("/courses")} className="footer-cat-view-all">
                    View all courses &gt;
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-grid">
          {/* Brand Section */}
          <div className="footer-brand">
            <div className="footer-logo">
              <img
                style={{ cursor: "pointer" }}
                onClick={() => navigate("/")}
                src={getImageUrl(logo)}
                alt="CareerFast Logo"
                className="main-logo"
              />
            </div>
            <p className="footer-description">
              Crafting digital excellence for tomorrow's visionaries.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="footer-nav-col">
            <h4 className="footer-menu-title">Company</h4>
            <ul className="footer-menu-list">
              <li><a style={{ cursor: "pointer" }} onClick={() => navigate("/about")} className="footer-menu-link">About Us</a></li>
              <li><a style={{ cursor: "pointer" }} onClick={() => navigate("/jobs")} className="footer-menu-link">Careers</a></li>
              <li><a style={{ cursor: "pointer" }} onClick={() => navigate("/blogs")} className="footer-menu-link">Blog</a></li>
            </ul>
          </div>

          <div className="footer-nav-col">
            <h4 className="footer-menu-title">Apply</h4>
            <ul className="footer-menu-list">
              <li><a style={{ cursor: "pointer" }} onClick={() => navigate("/jobs")} className="footer-menu-link">Jobs</a></li>
              <li><a style={{ cursor: "pointer" }} onClick={() => navigate("/internships")} className="footer-menu-link">Internship</a></li>
              <li><a style={{ cursor: "pointer" }} onClick={() => navigate("/scholarship")} className="footer-menu-link">Scholarship</a></li>
            </ul>
          </div>

          <div className="footer-nav-col">
            <h4 className="footer-menu-title">Resources</h4>
            <ul className="footer-menu-list">
              <li><a style={{ cursor: "pointer" }} onClick={() => navigate("/help")} className="footer-menu-link">Help Center</a></li>
              <li><a style={{ cursor: "pointer" }} onClick={() => navigate("/docs")} className="footer-menu-link">API Docs</a></li>
              <li><a style={{ cursor: "pointer" }} onClick={() => navigate("/community")} className="footer-menu-link">Community</a></li>
            </ul>
          </div>

          {/* Newsletter Section */}
          <div className="footer-newsletter">
            <h4 className="newsletter-title">Stay Updated</h4>
            <p className="newsletter-description">
              Subscribe to our newsletter for the latest updates.
            </p>
            <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Your email"
                className="newsletter-input"
                required
              />
              <button type="submit" className="newsletter-button">
                Join
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            © 2026 All rights reserved by <a href="https://careerfast.in" style={{ color: "#818cf8", cursor: "pointer" }} target="_blank" rel="noopener noreferrer">Careerfast.in</a>.
          </p>

          <div className="footer-legal">
            <a style={{ cursor: "pointer" }} onClick={() => navigate("/privacy")} className="footer-legal-link">Privacy Policy</a>
            <a style={{ cursor: "pointer" }} onClick={() => navigate("/terms")} className="footer-legal-link">Terms of Service</a>
            <a style={{ cursor: "pointer" }} onClick={() => navigate("/cookies")} className="footer-legal-link">Cookies</a>
          </div>

          <div className="footer-social">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="footer-social-link">Twitter</a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="footer-social-link">LinkedIn</a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="footer-social-link">GitHub</a>
            <a href="https://dribbble.com" target="_blank" rel="noopener noreferrer" className="footer-social-link">Dribbble</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
