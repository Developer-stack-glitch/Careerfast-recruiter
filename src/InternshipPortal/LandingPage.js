'use client';
import React, { useState, useEffect, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { Typography, Card, message, Col, Row, Empty, Spin } from "antd";
import Footer from "../Footer/Footer";
import SEO from "../Components/SEO/SEO";

import {
  EnvironmentOutlined,
  TeamOutlined,
  StarOutlined,
  ArrowRightOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import "../css/LandingPage.css";
import { motion } from "framer-motion";
import ParticlesBg from "particles-bg";
import Header from "../Header/Header";
import { useNavigate } from "@/routing-shim";


import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";
import {
  getJobPostByUserId,
  getJobPosts,
  StatsOfPost,
  getJobCategoryData,
  getBlogs
} from "../ApiService/action";
import logo1 from "../images/logo1.svg";
import logo2 from "../images/logo2.svg";
import logo3 from "../images/logo3.svg";
import logo4 from "../images/logo4.svg";
import logo5 from "../images/flipcart.webp";
import logo6 from "../images/samsung-8.svg";
import logo7 from "../images/tata-1.svg";
import logo8 from "../images/tesla-pure.svg";
import logo9 from "../images/amazon.svg";
import logo10 from "../images/hundai.png";
import logo11 from "../images/apple.png";
import logo12 from "../images/hp.webp";
import logo13 from "../images/facebook.webp";
import bannerImg from "../images/internship_banner.jpg";
import need_content_img from "../images/need_guidence.webp";
import company_logos1 from "../images/counter_box2.png";
import company_logos2 from "../images/verified.png";
import company_logos3 from "../images/applied.png";
import need_guidence1 from "../images/need_guidence1.png";
import post_jobs from "../images/post_jobs.jpg";
import { getImageUrl } from "../utils/getImageUrl";
import {
  FaLaptopCode,
  FaBullhorn,
  FaChartBar,
  FaPalette,
  FaHospitalAlt,
  FaPlaneDeparture,
  FaBookOpen,
  FaTools,
  FaBriefcase,
  FaMicrochip
} from "react-icons/fa";


const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// Helper function to convert currency code to symbol
const getCurrencySymbol = (currencyCode) => {
  const currencyMap = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'AUD': 'A$',
    'CAD': 'C$',
  };
  return currencyMap[currencyCode] || currencyCode;
};

const { Title, Text } = Typography;

const gradientColors = [
  "linear-gradient(to right, #0f3443, #34e89e)",
  "linear-gradient(to right, #666600, #999966)",
  "linear-gradient(90deg, #0575E6 0%, #021B79 100%)",
  "linear-gradient(90deg, #20002c 0%, #cbb4d4 100%)",
  "linear-gradient(to right, #000000, #434343)",
  "linear-gradient(to right, #4b79a1, #283e51)",
  "linear-gradient(90deg, #16222A 0%, #3A6073 100%)",
  "linear-gradient(to right, #1e3c72, #2a5298)",
  "linear-gradient(to right, #0f2027, #203a43, #2c5364)",
  "linear-gradient(to right, #141e30, #243b55)",
];

const PrevArrow = ({ onClick }) => (
  <div className="custom-arrow custom-prev" onClick={onClick}>
    <LeftOutlined />
  </div>
);

const NextArrow = ({ onClick }) => (
  <div className="custom-arrow custom-next" onClick={onClick}>
    <RightOutlined />
  </div>
);

const companiesSettings = {
  dots: false,
  infinite: true,
  arrows: false,
  autoplay: true,
  speed: 6000,
  autoplaySpeed: 0,
  cssEase: "linear",
  slidesToShow: 9,
  slidesToScroll: 1,
  swipeToSlide: true,
  responsive: [
    { breakpoint: 1200, settings: { slidesToShow: 4 } },
    { breakpoint: 768, settings: { slidesToShow: 2 } },
    { breakpoint: 480, settings: { slidesToShow: 1 } },
  ],
};

const companies = [
  { id: 1, logo: logo1 },
  { id: 2, logo: logo2 },
  { id: 3, logo: logo3 },
  { id: 4, logo: logo4 },
  { id: 5, logo: logo5 },
  { id: 6, logo: logo6 },
  { id: 7, logo: logo7 },
  { id: 8, logo: logo8 },
  { id: 9, logo: logo9 },
  { id: 10, logo: logo10 },
  { id: 11, logo: logo11 },
  { id: 12, logo: logo12 },
  { id: 13, logo: logo13 },
];
const loopedCompanies = [...companies, ...companies];

export default function InternshipLandingPage() {
  const [backendJobs, setBackendJobs] = useState([]);
  const [myOpportunities, setMyOpportunities] = useState([]); // User's posted internships
  const [roleId, setRoleId] = useState(null);
  const [loginUserId, setLoginUserId] = useState(null);
  const navigate = useNavigate();
  const [category, setCategory] = useState([]);
  const [appliedCounts, setAppliedCounts] = useState({});
  const [isVisible, setIsVisible] = useState(false);
  // 🔹 Loader state
  const [blogTips, setBlogTips] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    setIsVisible(true);
    loadBlogsForTips();
  }, []);

  const loadBlogsForTips = async () => {
    try {
      const res = await getBlogs();
      const blogs = res.data || [];
      setBlogTips(blogs.slice(0, 10));
    } catch (error) {
      console.error("Error fetching blog tips:", error);
    }
  };


  const settings = {
    dots: true,
    infinite: backendJobs.length > 3,
    arrows: true,
    autoplay: true,
    autoplaySpeed: 4000,
    slidesToShow: 3.8,
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />,
    responsive: [
      { breakpoint: 1200, settings: { slidesToShow: 2 } },
      { breakpoint: 768, settings: { slidesToShow: 1 } },
    ],
  };

  const sliderSettings = {
    dots: false,
    infinite: true,
    autoplay: true,
    autoplaySpeed: 4000,
    slidesToShow: 6,
    slidesToScroll: 1,
    arrows: true,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 3 } },
      { breakpoint: 768, settings: { slidesToShow: 2 } },
      { breakpoint: 480, settings: { slidesToShow: 1 } },
    ],
  };

  const icons = [
    <FaLaptopCode />,
    <FaChartBar />,
    <FaPalette />,
    <FaBullhorn />,
    <FaHospitalAlt />,
    <FaTools />,
    <FaPlaneDeparture />,
    <FaBookOpen />,
    <FaBriefcase />,
    <FaMicrochip />
  ];

  const fetchCategories = useCallback(async () => {
    try {
      const response = await getJobCategoryData({ min_jobs: 4, job_nature: "Internship" });

      const backendCategories =
        response?.data?.data?.map(cat => cat.category_name) || [];

      setCategory(backendCategories);

      const counts = {};
      backendJobs.forEach(job => {
        if (Array.isArray(job.job_category)) {
          job.job_category.forEach(cat => {
            counts[cat] = (counts[cat] || 0) + 1;
          });
        }
      });

    } catch (err) {
      console.error("Category fetch failed:", err);
    }
  }, [backendJobs]);

  const getJobPostsData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getJobPosts({ limit: 15, job_nature: "Internship" });
      const jobs = response?.data?.data?.data || [];
      setBackendJobs(jobs.slice(0, 15));
    } catch (error) {
      message.error("Please Login");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // handled by Helmet
    getJobPostsData();
  }, [getJobPostsData]);

  useEffect(() => {
    // Fetch categories after backendJobs is updated
    if (backendJobs.length > 0) {
      fetchCategories();
    }
  }, [backendJobs, fetchCategories]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("loginDetails");
      if (stored) {
        const loginDetails = JSON.parse(stored);
        setRoleId(loginDetails.role_id);
        setLoginUserId(loginDetails.id);
      }
    } catch (error) {
      console.error("Invalid JSON in localStorage", error);
    }
  }, []);


  useEffect(() => {
    getJobPostByUserIdData();
  }, [loginUserId]);

  const getJobPostByUserIdData = async () => {
    const getUserDetails = JSON.parse(localStorage.getItem("loginDetails"));
    if (!getUserDetails || !getUserDetails.id) return;

    const payload = { user_id: getUserDetails.id, limit: 6 };
    try {
      const response = await getJobPostByUserId(payload);
      const jobs = response?.data?.data || [];

      // Store user's jobs in myOpportunities state
      setMyOpportunities(jobs);

      const counts = {};
      for (let job of jobs) {
        try {
          const statPayload = { user_id: getUserDetails.id, job_post_id: job.id };
          const res = await StatsOfPost(statPayload);
          counts[job.id] = res?.data?.data?.candidatesCount || 0;
        } catch {
          counts[job.id] = 0;
        }
      }
      setAppliedCounts(counts);
    } catch (error) {
      console.error("Error fetching job posts:", error);
    }
  };

  // ✅ Loader overlay
  if (loading) {
    return null;
  }

  return (
    <div className="">
      <SEO
        title="CareerFast | Find Internships - Launch Your Career with Top Companies"
        description="Discover premium internship opportunities with top-tier companies. Connect with 25K+ verified recruiters, explore 100K+ internship listings, and kickstart your professional journey with CareerFast."
        keywords="internships, internship opportunities, student internships, career internships, internship portal, summer internships, paid internships, top companies, internship listings, career development, professional training, CareerFast"
        ogUrl="https://careerfast.in/internship-portal"
        ogImage="https://careerfast.in/og-image-internships.png"
        twitterImage="https://careerfast.in/og-image-internships.png"
        structuredData={[
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "CareerFast - Internships",
            "url": "https://careerfast.in/internship-portal",
            "description": "Discover premium internship opportunities with top-tier companies.",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://careerfast.in/internship-filter?search={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          },
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "Internship Categories",
            "description": "Browse internships by category on CareerFast",
            "numberOfItems": category.length,
            "itemListElement": category.map((cat, index) => ({
              "@type": "ListItem",
              "position": index + 1,
              "name": cat,
              "url": `https://careerfast.in/internships/${generateSlug(cat)}`
            }))
          }
        ]}
      />

      <Header />
      <Row className="job-portal">
        <ParticlesBg type="cobweb" bg={true} color="#7f5af0" num={50} />
        <Col
          style={{ placeContent: "center" }}
          lg={12}
          sm={24}
          md={24}
          xs={24}
        >
          <motion.div
            className="left-content"
          >
            <div className="header-content">
              <motion.h1
              >
                Elevate Your Career <br /> Journey
              </motion.h1>

              <motion.p
                className="subtitle"
              >
                Discover premium opportunities with top-tier companies <br />
                and unlock your professional potential.
              </motion.p>

              <motion.div
                className="button-group"
              >
                <motion.button
                  onClick={() => navigate("/internship")}
                  className="primary-btn"
                >
                  <span>Find Internships</span>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5 12H19M19 12L12 5M19 12L12 19"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.button>
                <motion.button
                  onClick={() => {
                    if (!loginUserId) {
                      message.warning("Please login to post a job");
                      navigate("/login");
                    } else if (roleId === 3) {
                      navigate("/post-jobs");
                    } else {
                      message.error(
                        "Access restricted! Only employers can post jobs."
                      );
                    }
                  }}
                  className="secondary-btn"
                >
                  <span>Post Internships</span>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 5V19M5 12H19"
                      stroke="#5f2eea"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </Col>
        <Col lg={12} sm={24} md={24} xs={24}>
          <motion.div
            className="right-content"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          > <div className="image-container"> <div className="gradient-overlay"></div>  <motion.img
            src={getImageUrl(bannerImg)}
            alt="Professional woman"
            className="main-image"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />               {/* Floating tags */}
              <motion.div
                className="floating-tag top-left"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <div className="tag-icon">
                  <i className="fa fa-clock"></i>
                </div>
                <span>Latest Jobs</span>
              </motion.div>
              <motion.div
                className="floating-tag top-right"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                <div className="tag-icon">
                  <i className="fa-solid fa-briefcase"></i>
                </div>
                <span>Internships</span>
              </motion.div>              <motion.div
                className="floating-tag mid-right"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                <div className="tag-icon">
                  <i className="fa-solid fa-building-circle-check"></i>
                </div>
                <span>Top Companies</span>
              </motion.div>
              <motion.div
                className="stats-card"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.8 }}
              >
                <div className="stats-content">
                  <h3>21M+</h3>
                  <p>Professionals hired through our platform</p>
                </div>
                <div className="stats-icon">
                  <i className="fa-solid fa-circle-check"></i>
                </div>
              </motion.div></div></motion.div>
        </Col>
      </Row>

      <Col>
        <div className="job-categories">
          <motion.div
            className="section-header"
            initial="hidden"
            animate="visible"

          >
            <h4>Explore Categories</h4>
            <button onClick={() => navigate("/internship-filter")} className="view-all" style={{ background: "none", border: "none", cursor: "pointer" }}>
              View all
            </button>
          </motion.div>

        </div>
      </Col>

      {/* Recommended Jobs */}
      <div className="elite-carousel-container">
        <div className="elite-carousel-header">
          <div className="elite-title-wrapper">
            <Title level={2} className="elite-title">
              <motion.span
                className="elite-title-text"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                Recommended Jobs
              </motion.span>
              <motion.span
                className="elite-badge"
                animate={{
                  background: [
                    "linear-gradient(135deg, #7f5af0 0%, #5f2eea 100%)",
                  ],
                  boxShadow: [
                    "0 4px 15px rgba(200, 210, 230, 0.7)",
                    "0 4px 15px rgba(200, 210, 250, 0.7)",
                    "0 4px 15px rgba(230, 210, 200, 0.7)",
                  ],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                for you
              </motion.span>
            </Title>

            <motion.div
              className="elite-subtitle-wrapper"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <Text className="elite-subtitle">
                Looking for the best of the best? Here're the top-rated Jobs by the learners' community.
              </Text>
              <div className="elite-decoration-line"></div>
            </motion.div>
          </div>
        </div>
        {backendJobs.length > 0 ? (
          <Slider {...settings} className="elite-job-carousel">
            {backendJobs.map((jobs, index) => {
              const randomGradient =
                gradientColors[
                Math.floor(Math.random() * gradientColors.length)
                ];
              return (
                <motion.div
                  key={jobs.id}
                  className="elite-job-slide"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}

                >
                  <Card
                    className="elite-job-card"
                    style={{ background: randomGradient }}
                  >
                    <div className="elite-job-tag">{jobs.job_nature}</div>

                    <div className="elite-logo-wrapper">
                      <img
                        src={getImageUrl(jobs.company_logo)}
                        alt={jobs.company_name}
                        className="elite-company-logo"
                      />
                      <div className="elite-logo-backdrop"></div>
                    </div>

                    <div className="elite-job-content">
                      <Title level={4} className="elite-job-title">
                        {jobs.job_title}
                      </Title>
                      <Text className="elite-company-name">
                        {jobs.company_name}
                      </Text>

                      <div className="elite-job-details">
                        <div className="elite-detail-item">
                          <EnvironmentOutlined className="elite-detail-icon" />
                          <div>
                            <span className="elite-detail-label">
                              Location
                            </span>
                            <span>
                              {(() => {
                                let locations = [];

                                if (jobs.work_location) {
                                  try {
                                    const parsed = Array.isArray(jobs.work_location)
                                      ? jobs.work_location
                                      : JSON.parse(jobs.work_location);

                                    if (Array.isArray(parsed) && parsed.length > 0) {
                                      locations = parsed;
                                    }
                                  } catch {
                                    // ignore parse error
                                  }
                                }

                                // 👉 Filter out empty strings from locations
                                const validLocations = locations.filter(loc => loc && typeof loc === 'string' && loc.trim() !== "");

                                // 👉 If valid locations exist, show them
                                if (validLocations.length > 0) {
                                  const firstTwo = validLocations.slice(0, 2).join(", ");
                                  return validLocations.length > 2 ? `${firstTwo}, ...` : firstTwo;
                                }

                                // 👉 Fallback to workplace_type if no valid locations
                                return jobs.workplace_type || "Not specified";
                              })()}
                            </span>
                          </div>
                        </div>
                        <div className="elite-detail-item">
                          <StarOutlined className="elite-detail-icon" />
                          <div>
                            <span className="elite-detail-label">
                              Level
                            </span>
                            <span>{jobs.experience_type}</span>
                          </div>
                        </div>
                      </div>

                      <div className="elite-job-meta">
                        <div className="elite-meta-item">
                          <TeamOutlined />
                          <span>
                            {" "}
                            {appliedCounts[jobs.id] || 0} applicants
                          </span>
                        </div>
                        <div className="elite-meta-item elite-salary">
                          <span>
                            {jobs.salary_type === "Range"
                              ? ((!jobs.min_salary || String(jobs.min_salary) === "0") && (!jobs.max_salary || String(jobs.max_salary) === "0")) ? "Not Disclosed" : `${getCurrencySymbol(jobs.currency)} ${jobs.min_salary || 0} - ${jobs.max_salary || 0} ${jobs.salary_duration?.toLowerCase() === "monthly" ? "Per Month" : "LPA"}`
                              : jobs.salary_type === "Fixed"
                                ? (!jobs.min_salary || String(jobs.min_salary) === "0") ? "Not Disclosed" : `${getCurrencySymbol(jobs.currency)} ${jobs.min_salary} ${jobs.salary_duration?.toLowerCase() === "monthly" ? "Per Month" : "LPA"}`
                                : ""}
                          </span>
                        </div>
                      </div>
                    </div>

                    <motion.div
                      onClick={() => {
                        const safeSlug = (val) => {
                          if (!val) return "";
                          if (Array.isArray(val)) return generateSlug(val.join(" "));
                          try {
                            const parsed = JSON.parse(val);
                            if (Array.isArray(parsed)) return generateSlug(parsed.join(" "));
                            return generateSlug(parsed);
                          } catch {
                            return generateSlug(val);
                          }
                        };

                        const jobNature = generateSlug(jobs.job_nature || "");
                        const jobTitle = generateSlug(jobs.job_title || "");
                        const companyName = generateSlug(jobs.company_name || "");
                        const locationSlug = safeSlug(jobs.work_location);
                        const workplaceType = generateSlug(jobs.workplace_type || "");
                        const experienceType = generateSlug(jobs.experience_type || "");
                        const experienceRequired = safeSlug(jobs.experience_required);

                        const finalUrl = `/internship-details/${jobNature}-${jobTitle}-${companyName}-${locationSlug}-${workplaceType}-${experienceType}-${experienceRequired}-${jobs.id}`;
                        window.open(finalUrl, "_blank");
                      }}
                      className="elite-job-cta"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ArrowRightOutlined
                        style={{ color: "#5f2eea" }}
                        className="elite-cta-icon"
                      />

                      <span style={{ color: "#5f2eea" }}>
                        View Details
                      </span>
                    </motion.div>
                  </Card>
                </motion.div>
              );
            })}
          </Slider>
        ) : (
          <div className="no-jobs-found">
            <Empty />
          </div>
        )}
      </div>
      {/*  */}
      {/* ✅ My Opportunities Section */}
      <div className="my-opportunities">
        <div className="opportunities-header">
          <div className="header-text">
            <h2>My Opportunities <span>( Recently Published )</span></h2>
            <p className="subtitle">
              Keep track of your recent and in-progress listings to stay on top of what you've posted.
            </p>
          </div>
          <button onClick={() => navigate("/internship-filter")} className="view-all-link" style={{ background: "none", border: "none", cursor: "pointer" }}>
            View all opportunities →
          </button>
        </div>

        {/* Opportunities Grid */}
        <div className="opportunities-grid">
          {myOpportunities
            .sort((a, b) => new Date(b.posted_date) - new Date(a.posted_date))
            .slice(0, 4)
            .map((job) => (
              <motion.div
                key={job.id}
                className="classical-opportunity-card"
                onClick={() => {
                  const safeSlug = (val) => {
                    if (!val) return "";
                    if (Array.isArray(val)) return generateSlug(val.join(" "));
                    try {
                      const parsed = JSON.parse(val);
                      if (Array.isArray(parsed)) return generateSlug(parsed.join(" "));
                      return generateSlug(parsed);
                    } catch {
                      return generateSlug(val);
                    }
                  };

                  const jobNature = generateSlug(job.job_nature || "");
                  const jobTitle = generateSlug(job.job_title || "");
                  const companyName = generateSlug(job.company_name || "");
                  const locationSlug = safeSlug(job.work_location);
                  const workplaceType = generateSlug(job.workplace_type || "");
                  const experienceType = generateSlug(job.experience_type || "");
                  const experienceRequired = safeSlug(job.experience_required);

                  const finalUrl = `/job-details/${jobNature}-${jobTitle}-${companyName}-${locationSlug}-${workplaceType}-${experienceType}-${experienceRequired}-${job.id}`;
                  window.open(finalUrl, "_blank");
                }}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}

                whileHover={{ scale: 1.03 }}
              >
                <div className="card-header">
                  <div className="company-logos">
                    <img
                      src={getImageUrl(job.company_logo || logo1)}
                      alt={job.company_name}
                    />
                  </div>
                  <div className="company-info">
                    <h3 className="job-title">{job.job_title}</h3>
                    <p className="company-name">{job.company_name}</p>
                  </div>
                </div>

                <div className="card-details">
                  <div className="detail-item">
                    <span className="label">Location:</span>
                    <span>
                      {(() => {
                        try {
                          const arr = JSON.parse(job.work_location);
                          if (Array.isArray(arr)) {
                            // Filter out empty strings
                            const validLocations = arr.filter(loc => loc && typeof loc === 'string' && loc.trim() !== "");

                            // If no valid locations, show workplace_type
                            if (validLocations.length === 0) {
                              return job.workplace_type || "Not specified";
                            }

                            const firstTwo = validLocations.slice(0, 2).join(", ");
                            return validLocations.length > 2 ? `${firstTwo}, ...` : firstTwo;
                          }

                          // If work_location is empty string, show workplace_type
                          return typeof job.work_location === 'string' && job.work_location.trim() !== ""
                            ? job.work_location
                            : job.workplace_type || "Not specified";
                        } catch {
                          // If work_location is empty string, show workplace_type
                          return typeof job.work_location === 'string' && job.work_location.trim() !== ""
                            ? job.work_location
                            : job.workplace_type || "Not specified";
                        }
                      })()}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Posted:</span>
                    <span>{job.date_posted || "Recently"}</span>
                  </div>
                </div>

                <div className="card-footer">
                  <span className="status-badges published">Published</span>
                  <span className="applicants">{appliedCounts[job.id] || 0} applicants</span>
                </div>

              </motion.div>
            ))}
        </div>

        {myOpportunities.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>No opportunities found</p>
            <button onClick={() => navigate("/post-jobs")} className="create-opportunity-btn">Create Your First Opportunity</button>
          </div>
        )}
      </div>

      {/* Need Guidence */}
      <motion.div
        className="need_guidence"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}

      >
        <Row
          className="need_guidence_row"
          style={{
            background:
              "linear-gradient(90deg, rgb(217 186 255) 0%, rgb(255, 255, 255) 100%)",
            borderRadius: "30px",
            cursor: "pointer",
          }}
          onClick={() => navigate("/mentors")}
        >
          <Col
            style={{
              overflow: "hidden",
              borderRadius: "30px 0 0 30px",
              border: "1px solid #ddd",
              borderRight: "none",
            }}
            lg={10}
            md={12}
            xs={24}
            sm={24}
          >
            <div className="need_content_img"><img src={getImageUrl(need_content_img)} alt="Need guidance illustration"></img></div>
          </Col>
          <Col
            style={{
              textAlign: "left",
              borderRadius: "0px 30px 30px 0px",
              border: "1px solid #ddd",
              borderLeft: "none",
              placeContent: "center",
            }}
            lg={14}
            md={12}
            xs={24}
            sm={24}
          >
            <div> <Text className="need_guidence_text">Need Guidence?</Text> <h1 className="need_guidence_title"> Get Winning Tips From <span style={{ cursor: "pointer" }}>Top Mentors</span></h1> </div>
          </Col>
        </Row>
      </motion.div>
      {/*  */}

      {/* top companies */}
      <div className="top_companies">
        <motion.div
          className="elite-title-wrapper"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h2 className="elite-title">
            <span className="elite-title-text">
              Top Companies Listing on Career Fast
            </span>
          </h2>
        </motion.div>

        <Slider {...companiesSettings} className="elite-job-carousel">
          {loopedCompanies.map((company, index) => (
            <motion.div
              key={`${company.id}-${index}`}
              className="elite-job-slide"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={index}
            >
              <motion.div whileHover={{ scale: 1.05 }}>
                <img
                  src={getImageUrl(company.logo)}
                  alt={`Company ${company.id}`}
                  className="elite-compay_icons-company-logo"
                />
              </motion.div>
            </motion.div>
          ))}
        </Slider>
      </div>
      {/*  */}

      {/* counting */}
      <div className="counter">
        <Row>
          <Col md={8}>
            <motion.div
              className="counter-card pink-bg"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}

            ><h2>100K+</h2><p>Listed Jobs & Internships</p><div className="company-logos1"><img src={getImageUrl(company_logos1)} alt="Jobs Counter" /></div></motion.div>
          </Col>
          <Col md={8}>
            <motion.div
              className="counter-card blue-bg"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}

            ><h2>25K+</h2><p>Verified Recruiters</p><div className="company-logos2"><img src={getImageUrl(company_logos2)} alt="Jobs Counter" /></div></motion.div>
          </Col>
          <Col md={8}>
            <motion.div
              className="counter-card yellow-bg"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}

            ><h2>5.5M+</h2><p>Applications</p><div className="company-logos3"><img src={getImageUrl(company_logos3)} alt="Jobs Counter" /></div></motion.div>
          </Col>
        </Row>
      </div>
      {/*  */}

      {/* Top Course */}
      <div className="need_guidence">
        <Row className="need_guidence_row">
          <Col
            style={{
              textAlign: "left",
              borderRadius: "30px 0px 0px 30px",
              border: "1px solid #ddd",
              borderRight: "none",
              placeContent: "center",
              paddingLeft: "30px",
            }}
            lg={14}
            md={12}
            xs={24}
            sm={24}
          >
            <div><Text className="need_guidence_text">Stuck Somewhere?</Text><h1 className="need_guidence_title">Learn From <span>Top Courses</span></h1><Text>Upskill, get certified, and stay ahead of the competition with our 50+ trending courses.</Text></div>
          </Col>

          <Col
            style={{
              overflow: "hidden",
              borderRadius: "0px 30px 30px 0px",
              border: "1px solid #ddd",
              borderLeft: "none",
            }}
            lg={10}
            md={12}
            xs={24}
            sm={24}
          >
            <div><img src={getImageUrl(need_guidence1)} alt="Career guidance illustration"></img> </div>
          </Col>
        </Row>
      </div>
      {/*  */}

      {/* Career Tips Section */}
      <div className={`career-tips ${isVisible ? 'visible' : ''}`}>
        <div className="premium-decoration">
          <div className="decoration-circle circle-1"></div>
          <div className="decoration-circle circle-2"></div>
          <div className="decoration-circle circle-3"></div>
        </div>

        <div className="section-headers">
          <motion.div
            className="elite-title-wrapper"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="elite-title">
              <span className="elite-title-text">
                Career Fast Blogs
              </span>
            </h2>
          </motion.div>
          <p>Stay updated with the latest blog trends & interview hacks</p>
        </div>

        <Row gutter={[30, 30]}>
          {blogTips.length === 0 ? (
            <Col span={24} style={{ textAlign: "center" }}>
              <h3>No Blogs Found</h3>
              <p style={{ color: "#666" }}>Check back later for new blog updates.</p>
            </Col>
          ) : (
            blogTips.slice(0, 6).map((tip, index) => (
              <Col
                xs={24}
                sm={12}
                lg={8}
                key={index}
                className="tip-col"
              >
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}

                  custom={index}
                  whileHover={{ y: -2, scale: 1.01 }}
                >
                  <Card
                    onClick={() => navigate(`/blog/${generateSlug(tip.blogTitle)}`)}
                    className="premium-tip-card"
                    cover={
                      <div className="card-image-container">
                        <img alt={tip.blogTitle} src={getImageUrl(tip.blogImage)} />
                        <div className="image-overlay"></div>
                        <div className="read-time">{tip.readingTime || "3 min read"}</div>
                      </div>
                    }
                    hoverable
                  >
                    <div className="card-contents">
                      <h3>{tip.blogTitle?.slice(0, 60) + "..."}</h3>
                      <p>{tip.overview?.slice(0, 100) + "..."}</p>
                      <a
                        href={`/blog/${generateSlug(tip.blogTitle)}`}
                        className="premium-read-more"
                      >
                        Read More <i className="fas fa-arrow-right"></i>
                      </a>
                    </div>
                  </Card>
                </motion.div>
              </Col>
            ))
          )}
        </Row>
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button
            onClick={() => navigate("/blogs")}
            className="premium-load-more"
            style={{
              padding: "7px 15px",
              background: "linear-gradient(135deg, #7f5af0 0%, #5f2eea 100%)",
              color: "#fff",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            View All Blogs <i className="fas fa-arrow-right" style={{ marginLeft: "5px" }}></i>
          </button>
        </div>
        <div className="section-footer">
          <p>Explore more career resources in our <a href="/">Careerfast</a></p>
        </div>
      </div>


      {/* Post Your Jobs & Internships - CLEAN UI */}
      <motion.div
        className="postJobsContainer"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <Row className="postJobsWrapper">

          {/* Left Content */}
          <Col lg={12} md={24} xs={24} className="postJobsLeft">
            <h2 className="pjTitle">
              Post Your <span>Jobs & Internships</span>
            </h2>

            <p className="pjSubtitle">
              Reach thousands of active job seekers — from fresh graduates to experienced professionals.
              Post your openings and connect with the right talent instantly.
            </p>

            <button
              className="pjPrimaryBtn"
              onClick={() => {
                if (!loginUserId) {
                  message.warning("Please login to post a job");
                  navigate("/login");
                } else if (roleId === 3) {
                  navigate("/post-jobs");
                } else {
                  message.error("Access restricted! Only employers can post jobs.");
                }
              }}
            >
              Get Started
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </Col>

          {/* Right Image */}
          <Col lg={12} md={24} xs={24} className="postJobsRight">
            <div className="pjImageWrapper">
              <img src={getImageUrl(post_jobs)} alt="Post Jobs" className="pjImage" />
            </div>
          </Col>

        </Row>
      </motion.div>
      {/*  */}
      <Footer />
    </div>
  );
}


