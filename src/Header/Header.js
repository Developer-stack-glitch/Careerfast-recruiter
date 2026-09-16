'use client';
import React, { useEffect, useState } from "react";
import logo from "../images/careerfastlogofinal.png";
import { useNavigate } from "@/routing-shim";
import GlobalSearch from "./GlobalSearch";
import { getImageUrl, getPlaceholderSvg } from "../utils/getImageUrl";
// Header.css already in layout.jsx
import { useDispatch, useSelector } from "react-redux";
import { storeLoginStatus } from "../Redux/Slice";
import {
  Input,
  Avatar,
  Dropdown,
  Drawer,
  Space,
  List,
  Typography,
  Progress,
  Tooltip,
  Popover,
  message,
  Button as AntButton,
} from "antd";
import { usePathname } from "@/routing-shim";

import {
  UserOutlined,
  PlusOutlined,
  SearchOutlined,
  BookOutlined,
  SettingOutlined,
  AppstoreOutlined,
  UserAddOutlined,
  CloseOutlined,
  ArrowRightOutlined,
  LogoutOutlined,
  RightOutlined,
  HeartOutlined,
  TrophyOutlined,
  ShoppingOutlined,
  ProfileOutlined,
  LockOutlined,
  ReadOutlined,
  CodeOutlined,
  MailOutlined,
  PhoneOutlined,
} from "@ant-design/icons";

import { Tag } from "antd";
import {
  CrownFilled,
  StarFilled,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { getUserProfile, searchByKeyword } from "../ApiService/action";
import { IoChevronDownOutline } from "react-icons/io5";
import { FcApproval } from "react-icons/fc";
import { FaBookOpen, FaCalendarAlt, FaChalkboardTeacher, FaGraduationCap } from "react-icons/fa";
import { Blocks, Book, BookAlert, LayoutDashboard, Briefcase, GraduationCap as LucideGraduationCap, Users, Menu } from "lucide-react";

const { Title, Text } = Typography;

export default function Header() {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();
  const isLoggedIn = useSelector((state) => state.loginstatus);
  const showDrawer = () => setOpen(true);
  const onClose = () => setOpen(false);
  const [loginUserId, setLoginUserId] = useState(null);
  const [roleId, setRoleId] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [email, setEmail] = useState("");
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [headerProgress, setHeaderProgress] = useState(0);
  const [megaTab, setMegaTab] = useState("locations");
  const COURSE_URL = process.env.NEXT_PUBLIC_COURSE_URL || "";

  const smartNavigate = (path) => {
    const externalPrefixes = [];
    const isExternal = externalPrefixes.some(p => path.startsWith(p));

    if (!isExternal || !COURSE_URL) {
      navigate(path);
    } else {
      // Redirect to the Course project
      window.location.href = `${COURSE_URL}${path}`;
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("profileProgress");
    if (saved) {
      setHeaderProgress(parseInt(saved));
    }
  }, []);

  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };


  useEffect(() => {
    const getCookie = (name) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
      return null;
    };

    let stored = localStorage.getItem("loginDetails");
    let token = localStorage.getItem("AccessToken");

    // Sync from cookies if localStorage is empty (in case logged in via course app)
    if (!token) {
      const cookieToken = getCookie("AccessToken");
      const cookieDetails = getCookie("loginDetails");
      if (cookieToken && cookieDetails) {
        localStorage.setItem("AccessToken", cookieToken);
        localStorage.setItem("loginDetails", decodeURIComponent(cookieDetails));
        token = cookieToken;
        stored = decodeURIComponent(cookieDetails);
        dispatch(storeLoginStatus(true));
      }
    }

    if (stored && token) {
      try {
        const loginDetails = JSON.parse(stored);
        setLoginUserId(loginDetails.id);
        setRoleId(loginDetails.role_id);
      } catch (err) {
        console.error("Invalid loginDetails", err);
      }
    } else {
      setLoginUserId(null);
      setRoleId(null);
    }
  }, [dispatch]);

  const handleLogOut = () => {
    localStorage.removeItem("loginDetails");
    localStorage.removeItem("AccessToken");
    localStorage.removeItem("profileProgress");

    // Clear sync cookies
    document.cookie = "AccessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "loginDetails=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    dispatch(storeLoginStatus(false));
    setRoleId(null);
    smartNavigate("/login");
    message.error("Your'e logged out");
  };

  useEffect(() => {
    console.log("loginUserId updated", loginUserId);
    if (loginUserId) {
      getUserProfileData();
    }
  }, [loginUserId]);

  const getUserProfileData = async () => {
    const payload = {
      user_id: loginUserId,
    };

    try {
      const response = await getUserProfile(payload);
      console.log("getUserProfile", response);
      const image = response?.data?.data?.profile_image;
      const profile = response?.data?.data;
      setProfileImage(image);
      setFname(response?.data?.data?.first_name || "");
      setLname(response?.data?.data?.last_name || "");
      setEmail(response?.data?.data?.email || "");
      calculateCompletion(profile);
    } catch (error) {
      console.log("getuserprofile errorddd", error);
    }
  };

  const handleSearch = async (value) => {
    setSearchText(value);
    if (!value) {
      setSuggestions([]);
      return;
    }

    try {
      setLoading(true);
      const payload = { searchTerm: value };
      const response = await searchByKeyword(payload);
      const data = response?.data?.data || [];

      const formattedSuggestions = data.map((item) => ({
        value: item.id,
        jobData: item,
        label: (
          <div className={`elite-suggestion-item ${item.isPremium ? "elite-premium" : ""}`}>
            <div className="elite-content-wrapper">
              <div className="elite-logo-container">
                <div className="elite-logo-frame">
                  <img
                    src={getImageUrl(item.company_logo)}
                    alt={item.company_name}
                    className="elite-company-logo"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = getPlaceholderSvg("Logo", 48, 48);
                    }}
                  />
                </div>
                {item.isPremium && (
                  <div className="elite-premium-badge">
                    <CrownFilled className="elite-premium-icon" />
                    <span>Elite</span>
                  </div>
                )}
              </div>
              <div className="elite-suggestion-content">
                <div className="elite-job-title-header">
                  {item.job_title}
                  {item.isFeatured && <StarFilled className="elite-featured-icon" />}
                </div>
                <div className="elite-company-name-header">{item.company_name}</div>
                <div className="elite-job-meta-header">
                  <Tag
                    icon={<EnvironmentOutlined />}
                    className="elite-location-tag"
                  >
                    {item.work_location}
                  </Tag>
                  <Tag
                    className={`elite-workplace-tag ${item.workplace_type === "Remote" ? "elite-remote" : "elite-onsite"}`}
                  >
                    {item.workplace_type}
                  </Tag>
                </div>
              </div>
            </div>
            <div className="elite-view-btn">
              <RightOutlined />
            </div>
          </div>
        ),
      }));

      setSuggestions(formattedSuggestions);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCompletion = (profile) => {
    let score = 0;
    let total = 8;

    if (profile.about) score++;
    if (profile.skills?.length > 0) score++;
    if (profile.education?.length > 0) score++;
    if (profile.projects?.length > 0) score++;
    if (profile.experience?.length > 0) score++;
    if (profile.social_links) score++;
    if (profile.resume) score++;
    if (profile.profile_image) score++;

    const percentage = Math.round((score / total) * 100);

    localStorage.setItem("profileProgress", percentage);
    setHeaderProgress(percentage);
  };

  const handleSelect = (value, option) => {
    const job = option.jobData; // full job object

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

    let basePath = "/job-details";
    if (job.job_nature === "Internship") basePath = "/internship-details";
    if (job.job_nature === "Scholarship") basePath = "/scholarship-details";

    const finalUrl = `${basePath}/${jobNature}-${jobTitle}-${companyName}-${locationSlug}-${workplaceType}-${experienceType}-${experienceRequired}-${job.id}`;

    smartNavigate(finalUrl);
  };

  const jobsMenuContent = (
    <div className="jobs-mega-menu">
      <div className="mega-sidebar">
        <div
          className={`sidebar-item ${megaTab === "locations" ? "active" : ""}`}
          onMouseEnter={() => setMegaTab("locations")}
        >
          Top Locations
        </div>
        <div
          className={`sidebar-item ${megaTab === "categories" ? "active" : ""}`}
          onMouseEnter={() => setMegaTab("categories")}
        >
          Top Categories
        </div>
        <div
          className={`sidebar-item ${megaTab === "fresher" ? "active" : ""}`}
          onMouseEnter={() => setMegaTab("fresher")}
        >
          Fresher Jobs
        </div>
      </div>
      <div className="mega-content">
        {megaTab === "locations" && (
          <ul className="mega-list">
            <li onClick={() => { smartNavigate("/jobs/jobs-in-chennai"); setOpen(false); }}>Jobs in Chennai</li>
            <li onClick={() => { smartNavigate("/jobs/work-from-home"); setOpen(false); }}>Work from home</li>
            <li onClick={() => { smartNavigate("/jobs/jobs-in-bangalore"); setOpen(false); }}>Jobs in Bangalore</li>
            <li onClick={() => { smartNavigate("/jobs/jobs-in-delhi"); setOpen(false); }}>Jobs in Delhi</li>
            <li onClick={() => { smartNavigate("/jobs/jobs-in-hyderabad"); setOpen(false); }}>Jobs in Hyderabad</li>
            <li onClick={() => { smartNavigate("/jobs/jobs-in-gurgaon"); setOpen(false); }}>Jobs in Gurgaon</li>
            <li onClick={() => { smartNavigate("/jobs/jobs-in-kolkata"); setOpen(false); }}>Jobs in Kolkata</li>
            <li onClick={() => { smartNavigate("/jobs/jobs-in-mumbai"); setOpen(false); }}>Jobs in Mumbai</li>
            <li onClick={() => { smartNavigate("/jobs/jobs-in-pune"); setOpen(false); }}>Jobs in Pune</li>
            <li onClick={() => { smartNavigate("/jobs/jobs-in-noida"); setOpen(false); }}>Jobs in Noida</li>
            <li onClick={() => { smartNavigate("/jobs/jobs-in-jaipur"); setOpen(false); }}>Jobs in Jaipur</li>
            <li onClick={() => { smartNavigate("/jobs/jobs-in-coimbatore"); setOpen(false); }}>Jobs in Coimbatore</li>
            <li onClick={() => { smartNavigate("/jobs/jobs-in-lucknow"); setOpen(false); }}>Jobs in Lucknow</li>
          </ul>
        )}
        {megaTab === "categories" && (
          <ul className="mega-list">
            <li onClick={() => { smartNavigate("/jobs/full-stack-development-jobs"); setOpen(false); }}>Full Stack Development</li>
            <li onClick={() => { smartNavigate("/jobs/devops-cloud-computing-jobs"); setOpen(false); }}>DevOps & Cloud Computing</li>
            <li onClick={() => { smartNavigate("/jobs/data-science-analytics-jobs"); setOpen(false); }}>Data Science & Analytics</li>
            <li onClick={() => { smartNavigate("/jobs/frontend-development-jobs"); setOpen(false); }}>Frontend Development</li>
            <li onClick={() => { smartNavigate("/jobs/hr-analytics-jobs"); setOpen(false); }}>HR Analytics</li>
            <li onClick={() => { smartNavigate("/jobs/software-development-jobs"); setOpen(false); }}>Software Development</li>
            <li onClick={() => { smartNavigate("/jobs/ui-ux-design-jobs"); setOpen(false); }}>UI/UX Design</li>
          </ul>
        )}
        {megaTab === "fresher" && (
          <ul className="mega-list">
            <li onClick={() => { smartNavigate("/jobs/fresher-work-from-home-jobs"); setOpen(false); }}>Work from home</li>
            <li onClick={() => { smartNavigate("/jobs/fresher-jobs-in-chennai"); setOpen(false); }}>Freshers job in Chennai</li>
            <li onClick={() => { smartNavigate("/jobs/fresher-jobs-in-bangalore"); setOpen(false); }}>Freshers job in Bangalore</li>
          </ul>
        )}
      </div>
    </div>
  );

  const internshipsMenuContent = (
    <div className="jobs-mega-menu">
      <div className="mega-sidebar">
        <div
          className={`sidebar-item ${megaTab === "locations" ? "active" : ""}`}
          onMouseEnter={() => setMegaTab("locations")}
        >
          Top Locations
        </div>
        <div
          className={`sidebar-item ${megaTab === "categories" ? "active" : ""}`}
          onMouseEnter={() => setMegaTab("categories")}
        >
          Top Categories
        </div>
        <div
          className={`sidebar-item ${megaTab === "fresher" ? "active" : ""}`}
          onMouseEnter={() => setMegaTab("fresher")}
        >
          Fresher Internships
        </div>
      </div>
      <div className="mega-content">
        {megaTab === "locations" && (
          <ul className="mega-list">
            <li onClick={() => { smartNavigate("/internships/internships-in-chennai"); setOpen(false); }}>Internships in Chennai</li>
            <li onClick={() => { smartNavigate("/internships/work-from-home"); setOpen(false); }}>Work from home</li>
            <li onClick={() => { smartNavigate("/internships/internships-in-bangalore"); setOpen(false); }}>Internships in Bangalore</li>
            <li onClick={() => { smartNavigate("/internships/internships-in-delhi"); setOpen(false); }}>Internships in Delhi</li>
            <li onClick={() => { smartNavigate("/internships/internships-in-hyderabad"); setOpen(false); }}>Internships in Hyderabad</li>
            <li onClick={() => { smartNavigate("/internships/internships-in-gurgaon"); setOpen(false); }}>Internships in Gurgaon</li>
            <li onClick={() => { smartNavigate("/internships/internships-in-kolkata"); setOpen(false); }}>Internships in Kolkata</li>
            <li onClick={() => { smartNavigate("/internships/internships-in-mumbai"); setOpen(false); }}>Internships in Mumbai</li>
            <li onClick={() => { smartNavigate("/internships/internships-in-pune"); setOpen(false); }}>Internships in Pune</li>
            <li onClick={() => { smartNavigate("/internships/internships-in-noida"); setOpen(false); }}>Internships in Noida</li>
            <li onClick={() => { smartNavigate("/internships/internships-in-jaipur"); setOpen(false); }}>Internships in Jaipur</li>
            <li onClick={() => { smartNavigate("/internships/internships-in-coimbatore"); setOpen(false); }}>Internships in Coimbatore</li>
            <li onClick={() => { smartNavigate("/internships/internships-in-lucknow"); setOpen(false); }}>Internships in Lucknow</li>
          </ul>
        )}
        {megaTab === "categories" && (
          <ul className="mega-list">
            <li onClick={() => { smartNavigate("/internships/full-stack-development-jobs"); setOpen(false); }}>Full Stack Development</li>
            <li onClick={() => { smartNavigate("/internships/devops-cloud-computing-jobs"); setOpen(false); }}>DevOps & Cloud Computing</li>
            <li onClick={() => { smartNavigate("/internships/data-science-analytics-jobs"); setOpen(false); }}>Data Science & Analytics</li>
            <li onClick={() => { smartNavigate("/internships/frontend-development-jobs"); setOpen(false); }}>Frontend Development</li>
            <li onClick={() => { smartNavigate("/internships/hr-analytics-jobs"); setOpen(false); }}>HR Analytics</li>
            <li onClick={() => { smartNavigate("/internships/software-development-jobs"); setOpen(false); }}>Software Development</li>
            <li onClick={() => { smartNavigate("/internships/ui-ux-design-jobs"); setOpen(false); }}>UI/UX Design</li>
          </ul>
        )}
        {megaTab === "fresher" && (
          <ul className="mega-list">
            <li onClick={() => { smartNavigate("/internships/fresher-work-from-home-jobs"); setOpen(false); }}>Work from home</li>
            <li onClick={() => { smartNavigate("/internships/fresher-jobs-in-chennai"); setOpen(false); }}>Freshers internship in Chennai</li>
            <li onClick={() => { smartNavigate("/internships/fresher-jobs-in-bangalore"); setOpen(false); }}>Freshers internship in Bangalore</li>
          </ul>
        )}
      </div>
    </div>
  );

  const menuItems = [
    { key: "jobs", label: "Jobs", icon: <Briefcase size={16} style={{ color: "#64748b" }} />, path: "/job-filter?job_nature=Job", isDropdown: true },
    {
      key: "internships",
      label: "Internships",
      icon: <LucideGraduationCap size={18} style={{ color: "#64748b" }} />,
      path: "/job-filter?job_nature=Internship",
      isDropdown: true
    },
    { key: "mentorships", label: "Mentorships", icon: <Users size={18} style={{ color: "#64748b" }} />, path: "/mentors" },
  ];

  const moreMenuItems = [
    {
      key: "scholarships",
      path: "/scholarship",
      label: (
        <div className="menu-item">
          <FaGraduationCap className="menu-icon" />
          <span>Scholarships</span>
        </div>
      ),
      onClick: () => smartNavigate("/scholarship"),
    },
    {
      key: "events",
      path: "/event-filter",
      label: (
        <div className="menu-item">
          <FaCalendarAlt className="menu-icon" />
          <span>Events</span>
        </div>
      ),
      onClick: () => smartNavigate("/event-filter"),
    },
    {
      key: "workshop",
      path: "/workshop-filter",
      label: (
        <div className="menu-item">
          <FaChalkboardTeacher className="menu-icon" />
          <span>Workshop</span>
        </div>
      ),
      onClick: () => smartNavigate("/workshop-filter"),
    },
    {
      key: "courses",
      path: "/courses",
      label: (
        <div className="menu-item">
          <FaBookOpen className="menu-icon" />
          <span>Courses</span>
        </div>
      ),
      onClick: () => smartNavigate("/courses"),
    },
    {
      key: "Blogs",
      path: "/blogs",
      label: (
        <div className="menu-item">
          <Blocks size={18} className="menu-icon" />
          <span>Blogs</span>
        </div>
      ),
      onClick: () => smartNavigate("/blogs"),
    },
  ];

  const moreMenuContent = (
    <div className="more-dropdown-menu">
      {moreMenuItems.map((item) => (
        <div
          key={item.key}
          className="more-menu-item"
          onClick={() => {
            item.onClick();
            onClose();
          }}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
  const employerItems = [
    { 
      key: '1', 
      label: <div className="employer-menu-item">Buy online</div>,
      onClick: () => smartNavigate("/employers")
    },
    { 
      key: '2', 
      label: <div className="employer-menu-item">Employer Login</div>,
      onClick: () => smartNavigate("/login")
    }
  ];

  const currentPath = usePathname();

  return (
    <>
      <div className="top-bar-custom d-none d-md-block">
        <div className="container-fluid" style={{ paddingLeft: 35, paddingRight: 35 }}>
          <div className="d-flex justify-content-between align-items-center w-100 top-bar-inner">
            <div className="d-flex align-items-center gap-3">
              <div className="top-bar-item"><MailOutlined /> careerfastcontact@gmail.com</div>
              <div className="top-bar-divider">|</div>
              <div className="top-bar-item"><PhoneOutlined /> +91 81227 38034</div>
            </div>

            <div className="d-none d-lg-flex align-items-center justify-content-center" style={{ flex: 1, overflow: 'hidden', padding: '0px 20px 0px 0px' }}>
              <div style={{
                fontSize: '13px',
                color: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                maxWidth: '750px',
                width: '100%',
                overflow: 'hidden'
              }}>
                <div className="trust-marquee-wrapper">
                  <div className="trust-marquee-content">
                    <span style={{ color: '#facc15', fontSize: '14px', marginRight: '6px' }}>★</span>
                    <span style={{ marginRight: '40px' }}>Trusted by <strong style={{ color: '#ff7b00', fontWeight: '600' }}>10,000+</strong> Top Companies worldwide</span>

                    <span style={{ fontSize: '14px', marginRight: '6px' }}>🚀</span>
                    <span style={{ marginRight: '40px' }}><strong style={{ color: '#ff7b00', fontWeight: '600' }}>500,000+</strong> Students Placed</span>

                    <span style={{ fontSize: '14px', marginRight: '6px' }}>💼</span>
                    <span style={{ marginRight: '40px' }}><strong style={{ color: '#ff7b00', fontWeight: '600' }}>#1</strong> Job Platform in India</span>

                    <span style={{ fontSize: '14px', marginRight: '6px' }}>🎓</span>
                    <span style={{ marginRight: '40px' }}>Top Rated <strong style={{ color: '#ff7b00', fontWeight: '600' }}>Internship</strong> Programs</span>
                  </div>
                  <div className="trust-marquee-content" aria-hidden="true">
                    <span style={{ color: '#facc15', fontSize: '14px', marginRight: '6px' }}>★</span>
                    <span style={{ marginRight: '40px' }}>Trusted by <strong style={{ color: '#ff7b00', fontWeight: '600' }}>10,000+</strong> Top Companies worldwide</span>

                    <span style={{ fontSize: '14px', marginRight: '6px' }}>🚀</span>
                    <span style={{ marginRight: '40px' }}><strong style={{ color: '#ff7b00', fontWeight: '600' }}>500,000+</strong> Students Placed</span>

                    <span style={{ fontSize: '14px', marginRight: '6px' }}>💼</span>
                    <span style={{ marginRight: '40px' }}><strong style={{ color: '#ff7b00', fontWeight: '600' }}>#1</strong> Job Platform in India</span>

                    <span style={{ fontSize: '14px', marginRight: '6px' }}>🎓</span>
                    <span style={{ marginRight: '40px' }}>Top Rated <strong style={{ color: '#ff7b00', fontWeight: '600' }}>Internship</strong> Programs</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="d-flex align-items-center gap-4">
              <div className="top-bar-item" style={{ cursor: 'pointer' }}>Career Advice</div>
              <div className="top-bar-divider">|</div>
              <div className="top-bar-item" style={{ cursor: 'pointer' }}><AppstoreOutlined /> EN <IoChevronDownOutline /></div>
            </div>
          </div>
        </div>
      </div>
      <header className="bg-white py-2 elite-header sticky-top">
        <div className="container-fluid" style={{ paddingLeft: 35, paddingRight: 35 }}>
          <div className="d-flex justify-content-between align-items-center w-100">
            <div className="d-flex align-items-center gap-4 global_search">
              <div className="m-0 p-0 navbar-brand">
                <img
                  onClick={() => smartNavigate("/")}
                  src={typeof logo === 'string' ? logo : logo?.src}
                  style={{ cursor: "pointer", width: "180px", height: "auto", objectFit: "contain" }}
                  alt="CareerFast Logo"
                  className="main-logo"
                />
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="d-none d-md-flex align-items-center flex-grow-1 justify-content-center">
              <nav className="nav justify-content-center align-items-center gap-0">
                {menuItems.map((item) => (
                  item.isDropdown ? (
                    <Dropdown
                      key={item.key}
                      popupRender={() => item.key === "jobs" ? jobsMenuContent : internshipsMenuContent}
                      trigger={["hover"]}
                      placement="bottomLeft"
                    >
                      <div
                        className={`nav-link nav-item ${currentPath === item.path ? "active" : ""}`}
                        style={{ cursor: "pointer" }}
                        onClick={() => smartNavigate(item.path)}
                      >
                        {item.icon} {item.label} <IoChevronDownOutline />
                      </div>
                    </Dropdown>
                  ) : (
                    <div
                      className={`nav-link nav-item ${currentPath === item.path ? "active" : ""}`}
                      style={{ cursor: item.key === "practice" ? "not-allowed" : "pointer" }}
                      key={item.key}
                      onClick={() => {
                        if (item.key !== "practice") {
                          onClose();
                          smartNavigate(item.path);
                        }
                      }}
                    >
                      {item.icon} {item.label}
                    </div>
                  )
                ))}
                <Dropdown
                  popupRender={() => moreMenuContent}
                  trigger={["hover"]}
                  placement="bottomLeft"
                >
                  <div
                    className={`nav-link nav-item ${moreMenuItems.some((menu) => currentPath === menu.path) ? "active" : ""}`}
                    style={{ cursor: "pointer" }}
                  >
                    <Menu size={18} style={{ color: "#64748b" }} /> More <IoChevronDownOutline />
                  </div>
                </Dropdown>
              </nav>
            </div>

            {/* User Actions */}
            <div className="d-flex align-items-center gap-4">
              {isLoggedIn === true ? (
                <>
                  <div
                    className="d-flex rounded-circle border-2 border-[#22c55e] align-items-center gap-1 user-dropdown"
                    style={{ cursor: "pointer" }}
                  >
                    <Avatar
                      onClick={showDrawer}
                      style={{ objectFit: "contain", backgroundColor: !profileImage ? "#f3f4f6" : "transparent", color: "#64748b" }}
                      size="large"
                      src={profileImage ? getImageUrl(profileImage) : undefined}
                      icon={!profileImage ? <UserOutlined /> : undefined}
                    />
                  </div>
                  {!currentPath.includes("/candidate-profile") && (
                    roleId === 2 ? (
                      <Tooltip title="You don't have permission to post jobs">
                        <span>
                          <AntButton className="host-button">
                            <PlusOutlined /> Post a Job
                          </AntButton>
                        </span>
                      </Tooltip>
                    ) : (
                      <Popover
                        placement="bottomRight"
                        trigger="click"
                        content={
                          <div className="host-popup-container">
                            <div
                              onClick={() => smartNavigate("/post-jobs")}
                              className="host-popup-item"
                            >
                              <div className="host-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                                <ShoppingOutlined />
                              </div>
                              <div className="host-popup-text">
                                <div className="host-popup-title">Jobs, Internships</div>
                                <div className="host-popup-sub">Hire the Right Talent</div>
                              </div>
                            </div>

                            <div
                              onClick={() => smartNavigate("/post-course")}
                              className="host-popup-item"
                            >
                              <div className="host-icon-wrapper" style={{ background: 'rgba(198, 11, 245, 0.1)', color: '#c60bf5' }}>
                                <ReadOutlined />
                              </div>
                              <div className="host-popup-text">
                                <div className="host-popup-title">Post a New Course</div>
                                <div className="host-popup-sub">
                                  Share your knowledge and attract eager learners
                                </div>
                              </div>
                            </div>
                            <div
                              onClick={() => smartNavigate("/add-blog")}
                              className="host-popup-item"
                            >
                              <div className="host-icon-wrapper" style={{ background: 'rgba(0, 86, 3, 0.1)', color: '#005603' }}>
                                <BookAlert size={18} />
                              </div>
                              <div className="host-popup-text">
                                <div className="host-popup-title">Post a Blog</div>
                                <div className="host-popup-sub">
                                  Insights & community stories
                                </div>
                              </div>
                            </div>
                            <div className="host-popup-item" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                              <div className="host-icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                                <ProfileOutlined />
                              </div>
                              <div className="host-popup-text">
                                <div className="host-popup-title">Assessments</div>
                                <div className="host-popup-sub">Evaluate candidates</div>
                                <div className="host-popup-upgrade">
                                  <LockOutlined /> Upgrade
                                </div>
                              </div>
                            </div>
                          </div>
                        }
                      >
                        <AntButton className="host-button">
                          <PlusOutlined /> Post a Job
                        </AntButton>
                      </Popover>
                    )
                  )}
                </>
              ) : (
                <div className="d-flex align-items-center gap-3">
                  <AntButton
                    onClick={() => smartNavigate("/login")}
                    className="naukri-login-btn"
                  >
                    Login
                  </AntButton>
                  <AntButton
                    type="primary"
                    onClick={() => smartNavigate("/register")}
                    className="naukri-register-btn"
                  >
                    Register
                  </AntButton>
                  <div style={{ width: '1px', height: '20px', backgroundColor: '#cbd5e1', margin: '0 4px' }}></div>
                  <Dropdown menu={{ items: employerItems }} trigger={['hover']} placement="bottomRight">
                    <div className="for-employers-dropdown" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: '#1e293b', fontWeight: 500, fontSize: '15px' }}>
                      For employers <IoChevronDownOutline size={14} style={{ color: '#64748b' }} />
                    </div>
                  </Dropdown>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <Drawer
        className="header-drawer"
        title={null}
        placement="right"
        width={380}
        onClose={onClose}
        open={open}
        closable={false}
        zIndex={2000}
      >
        {/* Premium Header */}
        <div className="premium-profile-header">
          <button onClick={onClose} className="close-drawer-btn">
            <CloseOutlined />
          </button>

          <Space align="center" size={16} style={{ width: "100%" }}>
            <div className="profile-avatar-container">
              <Avatar
                size={72}
                src={profileImage ? getImageUrl(profileImage) : undefined}
                icon={!profileImage ? <UserOutlined /> : undefined}
                className="profile-avatar"
                style={{ backgroundColor: !profileImage ? "#f3f4f6" : "transparent", color: "#64748b" }}
              />
              <Progress
                type="circle"
                percent={headerProgress}
                size={80}
                strokeColor="#22c55e"
                trailColor="rgba(255,255,255,0.2)"
                strokeWidth={4}
                showInfo={false}
                className="profile-progress-ring"
              />
              <div style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                background: '#22c55e',
                color: 'white',
                fontSize: '10px',
                fontWeight: 'bold',
                padding: '2px 6px',
                borderRadius: '10px',
                border: '2px solid #6366f1',
                zIndex: 2
              }}>
                {headerProgress}%
              </div>
            </div>

            <div className="profile-info-content">
              <Title level={4} style={{ color: "white", margin: 0, fontFamily: 'Outfit', fontWeight: 600 }}>
                {fname} {lname}
              </Title>
              <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, display: 'block', marginBottom: 4 }}>
                {email}
              </Text>
              <button
                onClick={() => {
                  onClose();
                  if (roleId === 1) {
                    smartNavigate("/admin");
                  } else {
                    smartNavigate("/candidate-profile/mainprofile");
                  }
                }}
                className="view-profile-link"
              >
                View Profile <ArrowRightOutlined style={{ fontSize: 12 }} />
              </button>
            </div>
          </Space>
        </div>

        {/* Premium Content */}
        <div className="drawer-content-scroll">
          <div className="premium-menu-section">
            <Text className="menu-section-title">
              {roleId === 1
                ? "Super Admin Dashboard"
                : roleId === 2
                  ? "Candidate Dashboard"
                  : "Organizer Dashboard"}
            </Text>

            <List
              split={false}
              dataSource={
                roleId === 1
                  ? [
                    { title: "Dashboard", path: "/admin", icon: <LayoutDashboard size={18} /> },
                    { title: "Manage Listings", path: "/admin/job-post", icon: <AppstoreOutlined /> },
                    { title: "Employers", path: "/admin/employers", icon: <UserOutlined /> },
                    { title: "Account Settings", path: "/admin/general", icon: <SettingOutlined /> },
                  ]
                  : roleId === 2
                    ? [
                      { title: "Dashboard", path: "/candidate-profile/dashboard", icon: <LayoutDashboard size={18} /> },
                      { title: "Wishlist", path: "/candidate-profile/wishlist", icon: <HeartOutlined /> },
                      { title: "Account Settings", path: "/candidate-profile/accountsettings", icon: <SettingOutlined /> },
                      { title: "Pro Subscription", path: "/candidate-profile/prosubscription", icon: <FcApproval /> },
                      { title: "Applied Jobs", path: "/candidate-profile/applied", icon: <UserAddOutlined />, showArrow: true },
                    ]
                    : [
                      { title: "Dashboard", path: "/candidate-profile/dashboard", icon: <LayoutDashboard size={18} /> },
                      { title: "Manage Listings", path: "/candidate-profile/listing", icon: <AppstoreOutlined />, onClick: () => localStorage.setItem("listingOrder", "topBottom") },
                      { title: "Account Settings", path: "/candidate-profile/accountsettings", icon: <SettingOutlined /> },
                    ]
              }
              renderItem={(item) => (
                <List.Item
                  className="premium-menu-item"
                  onClick={() => {
                    if (item.onClick) item.onClick();
                    onClose();
                    smartNavigate(item.path);
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
                    <div className="menu-icon-wrapper">
                      {item.icon}
                    </div>
                    <Text className="menu-item-text">{item.title}</Text>
                    {item.showArrow && <RightOutlined style={{ marginLeft: 'auto', fontSize: '12px', color: '#94a3b8' }} />}
                  </div>
                </List.Item>
              )}
            />
          </div>
        </div>

        {/* Premium Footer */}
        <div className="drawer-footer">
          <AntButton
            onClick={handleLogOut}
            className="logout-btn"
            icon={<LogoutOutlined />}
          >
            Log Out
          </AntButton>
        </div>
      </Drawer>

      {/* Add CSS for elite search dropdown */}
      <style>
        {`
          /* Elite Search Dropdown Styles */
          .elite-search-dropdown {
            border-radius: 16px;
            box-shadow: 0 15px 50px rgba(0, 0, 0, 0.15);
            border: 1px solid rgba(255, 255, 255, 0.2);
            padding: 16px;
            margin-top: 10px;
            max-height: 600px;
            overflow-y: auto;
            scroll-behavior: smooth;
            background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
            backdrop-filter: blur(20px);
          }
          
          .elite-search-dropdown .ant-select-item {
            padding: 0;
            border-radius: 12px;
            margin-bottom: 8px;
            transition: all 0.3s ease;
            background: transparent;
          }
            
          .rc-virtual-list-holder{
          max-height: 340px !important;
          }
          
          .elite-search-dropdown .ant-select-item-option-active {
            background-color: rgba(79, 70, 229, 0.05);
          }
          
          .elite-search-dropdown .ant-select-item-option-selected {
            background: linear-gradient(90deg, rgba(79, 70, 229, 0.1) 0%, rgba(79, 70, 229, 0.05) 100%);
          }
          
          .elite-suggestion-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px;
            border-radius: 12px;
            transition: all 0.3s ease;
            border: 1px solid rgba(79, 70, 229, 0.1);
            background: white;
            position: relative;
            overflow: hidden;
          }
          
          .elite-suggestion-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 4px;
            height: 0;
            background: linear-gradient(180deg, #8b5cf6 0%, #4f46e5 100%);
            transition: height 0.3s ease;
          }
          
          .elite-suggestion-item:hover::before {
            height: 100%;
          }
          
          .elite-suggestion-item:hover {
            background-color: #fafbff;
            border-color: rgba(79, 70, 229, 0.3);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(79, 70, 229, 0.15);
          }
          
          .elite-content-wrapper {
            display: flex;
            align-items: flex-start;
            flex: 1;
          }
          
          .elite-logo-container {
            position: relative;
            margin-right: 16px;
          }
          
          .elite-logo-frame {
            width: 56px;
            height: 56px;
            border-radius: 12px;
            padding: 3px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #e3e3e3;
          }
          
          .elite-company-logo {
            width: 100%;
            height: 100%;
            border-radius: 10px;
            object-fit: contain;
            background: white;
            padding: 5px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          
          .elite-premium-badge {
            position: absolute;
            top: -6px;
            right: -6px;
            background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
            color: #7c5a1a;
            font-size: 10px;
            font-weight: 700;
            padding: 3px 8px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
            z-index: 2;
          }
          
          .elite-premium-icon {
            font-size: 10px;
            margin-right: 3px;
          }
          
          .elite-suggestion-content {
            flex: 1;
            position: relative;
          }
          
          .elite-suggestion-item .elite-job-title-header {
            font-weight: 700;
            font-size: 16px;
            color: #1a1a1a !important;
            margin-bottom: 0px;
            display: flex;
            align-items: center;
          }
          
          .elite-featured-icon {
            color: #ffc53d;
            margin-left: 8px;
            font-size: 14px;
          }
          
          .elite-company-name-header {
            font-size: 13px;
            color: #595959;
            margin-bottom: 10px;
            font-weight: 600;
          }
          
          .elite-job-meta-header {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin-bottom: 10px;
          }
          
          .elite-location-tag, .elite-workplace-tag {
            font-size: 11px;
            padding: 4px 10px;
            border-radius: 6px;
            margin: 0;
            border: none;
          }
          
          .elite-location-tag {
            background: rgba(59, 130, 246, 0.1);
            color: #3b82f6;
          }
          
          .elite-remote {
            background: rgba(16, 185, 129, 0.1);
            color: #10b981;
          }
          
          .elite-onsite {
            background: rgba(139, 92, 246, 0.1);
            color: #8b5cf6;
          }
          
          .elite-salary-badge {
            display: inline-block;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            font-size: 11px;
            font-weight: 700;
            padding: 3px 8px;
            border-radius: 6px;
          }
          
          .elite-view-btn {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            background: rgba(79, 70, 229, 0.1);
            color: #4f46e5;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            transition: all 0.3s ease;
          }
          
          .elite-suggestion-item:hover .elite-view-btn {
            background: #4f46e5;
            color: white;
            transform: translateX(3px);
          }
          
          .elite-no-results-container {
            text-align: center;
            padding: 10px 20px;
          }
          
          .elite-no-results-icon {
            font-size: 38px;
            color: #d9d9d9;
            margin-bottom: 16px;
          }
          
          .elite-no-results-title {
            font-weight: 700;
            color: #595959;
            margin-bottom: 8px;
            font-size: 16px;
          }
          
          .elite-no-results-subtitle {
            font-size: 14px;
            color: #8c8c8c;
            margin-bottom: 20px;
          }
          
          .elite-explore-btn {
            background: linear-gradient(135deg, #4f46e5 0%, #8b5cf6 100%);
            border: none;
            border-radius: 8px;
            padding: 8px 20px;
            height: auto;
            font-weight: 600;
          }
          
          .elite-loading-container {
            text-align: center;
            padding: 30px 20px;
          }
          
          .elite-loading-animation {
            display: flex;
            justify-content: center;
            margin-bottom: 16px;
          }
          
          .elite-loading-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: linear-gradient(135deg, #4f46e5 0%, #8b5cf6 100%);
            margin: 0 4px;
            animation: elite-loading 1.4s infinite ease-in-out both;
          }
          
          .elite-loading-dot:nth-child(1) {
            animation-delay: -0.32s;
          }
          
          .elite-loading-dot:nth-child(2) {
            animation-delay: -0.16s;
          }
          
          @keyframes elite-loading {
            0%, 80%, 100% { 
              transform: scale(0.8);
              opacity: 0.5;
            }
            40% { 
              transform: scale(1);
              opacity: 1;
            }
          }
          
          .elite-loading-text {
            font-size: 14px;
            color: #8c8c8c;
            font-weight: 500;
          }
          
          /* Elite search input */
          .elite-search-input {
            border-radius: 12px;
            width: 230px !important;
            border: 1px solid #b6b1ff;
            padding: 12px 18px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            transition: all 0.3s ease;
            background: white;
          }
          
          /* Elite search input on admin-profile pages */
          .profile-layout .elite-search-input {
            width: 150px !important;
          }
          
          .elite-search-input:hover, .elite-search-input:focus {
            border-color: #8b5cf6;
            box-shadow: 0 6px 20px rgba(79, 70, 229, 0.2);
          }
          
          .elite-search-icon {
            color: #8b5cf6;
          }
          
            .elite-header {
            border-bottom: 1px solid rgba(79, 70, 229, 0.1);
          }

          /* --- Mobile Responsive Header Styles --- */
          @media (max-width: 991px) {
            .elite-search-input {
              width: 180px !important;
            }
          }

          @media (max-width: 768px) {
            .elite-header .container-fluid {
              display: flex !important;
              flex-wrap: wrap !important;
              align-items: center !important;
              justify-content: space-between !important;
              padding-left: 15px !important;
              padding-right: 15px !important;
            }

            .global_search {
              display: contents !important;
            }

            .navbar-brand {
              order: 1 !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            .navbar-toggler {
              order: 2 !important;
              margin-left: auto !important;
              padding: 4px 8px !important;
              font-size: 1.1rem !important;
            }

            /* Targeting the AutoComplete wrapper */
            .elite-header .ant-select { 
              order: 3 !important;
              width: 100% !important;
              margin-top: 15px !important;
              margin-bottom: 5px !important;
            }

            .elite-search-input {
              width: 100% !important;
              height: 42px !important;
              padding: 10px 15px !important;
              font-size: 14px !important;
            }

            .main-logo {
              height: 30px !important;
              width: auto;
            }

            .elite-search-dropdown {
              width: calc(100vw - 30px) !important;
              left: 15px !important;
              max-width: none !important;
            }

            .mobile_sidebar {
              width: 100%;
              display: flex !important;
              flex-direction: column;
              align-items: stretch !important;
              gap: 15px !important;
              margin-top: 20px !important;
            }

            .host-button {
              width: 100%;
              justify-content: center;
              height: 45px !important;
            }
          }

          @media (max-width: 480px) {
            .elite-search-input {
              min-width: 100px;
            }
            
            .main-logo {
              height: 28px !important;
            }
            
            .elite-search-input::placeholder {
              font-size: 11px;
            }
          }

          /* Jobs Mega Menu Styles */
          .jobs-mega-menu {
            display: flex;
            background: white;
            border-radius: 12px;
            box-shadow: 0 15px 45px rgba(0, 0, 0, 0.12);
            overflow: hidden;
            width: 480px;
            border: 1px solid rgba(0, 0, 0, 0.05);
            animation: megaMenuFade 0.3s ease-out;
            z-index: 1050;
          }

          @keyframes megaMenuFade {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .mega-sidebar {
            width: 190px;
            background: rgba(141, 63, 251, 0.05);
            border-right: 1px solid rgba(0, 0, 0, 0.05);
            padding: 12px 0;
          }

          .sidebar-item {
            padding: 14px 20px;
            cursor: pointer;
            font-size: 14px;
            color: #555;
            transition: all 0.25s ease;
            position: relative;
            font-weight: 500;
            font-family: "Outfit", sans-serif !important;
          }

          .sidebar-item.active {
            background: rgba(141, 63, 251, 0.05);
            color: #8d3ffb;
            font-weight: 600;
          }

          .sidebar-item.active::after {
            content: '';
            position: absolute;
            right: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 3px;
            height: 100%;
            background: #8d3ffb;
          }

          .mega-content {
            flex: 1;
            padding: 15px 0px 0px 25px;
            background: white;
            min-height: 300px;
          }

          .mega-list {
            list-style: none;
            padding: 0;
            margin: 0;
            max-height: 300px;
            overflow-y: auto;
            padding-right: 5px;
          }

          .mega-list::-webkit-scrollbar {
            width: 4px;
          }

              .navbar-expand-md .offcanvas .offcanvas-body {
        align-items: center;
    }

          .mega-list::-webkit-scrollbar-thumb {
            background: rgba(141, 63, 251, 0.2);
            border-radius: 10px;
          }

          .mega-list li {
            padding: 10px 0;
            cursor: pointer;
            font-size: 14px;
            color: #666;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            font-family: "Outfit", sans-serif !important;
          }

          .mega-list li:hover {
            color: #8d3ffb;
            padding-left: 5px;
          }

          .mega-list li::before {
            content: '';
            width: 0;
            height: 1px;
            background: #8d3ffb;
            margin-right: 0;
            transition: all 0.2s ease;
          }

          .mega-list li:hover::before {
            width: 10px;
            margin-right: 8px;
          }

          .mega-new-badge {
            background: #ff6f00;
            color: white;
            border-radius: 4px;
            padding: 1px 5px;
            font-size: 9px;
            margin-left: 5px;
            font-weight: 700;
            display: inline-block;
            vertical-align: middle;
            line-height: normal;
          }

          /* More Dropdown Styles */
          .more-dropdown-menu {
            background: white;
            border-radius: 12px;
            box-shadow: 0 15px 45px rgba(0, 0, 0, 0.12);
            overflow: hidden;
            width: 220px;
            border: 1px solid rgba(0, 0, 0, 0.05);
            padding: 0px 0;
            animation: megaMenuFade 0.3s ease-out;
            z-index: 1050;
          }

          .more-menu-item {
            padding: 12px 20px;
            cursor: pointer;
            transition: all 0.25s ease;
            display: flex;
            align-items: center;
          }

          .more-menu-item:hover {
            background: rgba(141, 63, 251, 0.05);
          }

          .more-menu-item .menu-item {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
          }

          .more-menu-item .menu-icon {
            font-size: 18px;
            color: #475569;
            transition: all 0.25s ease;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .more-menu-item span {
            font-size: 14px;
            color: #475569;
            font-weight: 500;
            font-family: "Outfit", sans-serif !important;
            transition: all 0.25s ease;
          }

          .more-menu-item:hover span {
            color: #8d3ffb;
            transform: translateX(4px);
          }

          .more-menu-item:hover .menu-icon {
            color: #8d3ffb;
            transform: scale(1.1);
          }

          .nav-item.active {
             background: rgba(99, 102, 241, 0.1) !important;
             border-radius: 8px;
             color: #6366f1 !important;
          }
          
          .nav-item:hover {
             background: rgba(99, 102, 241, 0.05);
             border-radius: 8px;
             color: #6366f1 !important;
          }

          .nav-item {
            transition: all 0.3s ease;
            padding: 8px 12px !important;
          }

          /* --- Premium Header Drawer Styles --- */
          .header-drawer .ant-drawer-content {
            background-color: #ffffff;
            border-radius: 24px 0 0 24px;
            overflow: hidden;
          }

          .header-drawer .ant-drawer-body {
            padding: 0 !important;
            display: flex;
            flex-direction: column;
            height: 100%;
          }

          .premium-profile-header {
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    padding: 24px 12px;
    position: relative;
    color: white;
    box-shadow: 0 4px 20px rgba(79, 70, 229, 0.2);
          }

          .close-drawer-btn {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.2);
            border: none;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            cursor: pointer;
            transition: all 0.3s ease;
            z-index: 10;
          }

          .close-drawer-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: rotate(90deg);
          }

          .profile-avatar-container {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 80px;
            height: 80px;
            flex-shrink: 0;
          }

          .profile-avatar {
            border: 2px solid rgba(255, 255, 255, 0.3) !important;
            background: white;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            position: relative;
            z-index: 1;
          }

          .profile-progress-ring {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
            z-index: 2;
          }

          .view-profile-link {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: rgba(255, 255, 255, 0.15);
            border: 1px solid rgba(255, 255, 255, 0.3);
            padding: 6px 14px;
            border-radius: 50px;
            color: white;
            font-size: 13px;
            font-weight: 600;
            margin-top: 10px;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            border: none;
            outline: none;
          }

          .view-profile-link:hover {
            background: white;
            color: #6366f1;
            transform: translateX(4px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }

          .drawer-content-scroll {
            flex: 1;
            overflow-y: auto;
            padding: 24px;
          }

          .premium-menu-section {
            margin-bottom: 30px;
          }

          .menu-section-title {
            display: block;
            font-size: 12px;
            font-weight: 700;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-bottom: 16px;
            padding-left: 12px;
          }

          .premium-menu-item {
            padding: 12px !important;
            border-radius: 12px !important;
            cursor: pointer;
            transition: all 0.2s ease !important;
            border: 1px solid transparent !important;
            margin-bottom: 4px;
            background: transparent !important;
          }

          .premium-menu-item:hover {
            background: #f8fafc !important;
            border-color: #e2e8f0 !important;
            transform: translateX(4px);
          }

          .menu-icon-wrapper {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            background: #f1f5f9;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6366f1;
            font-size: 18px;
            transition: all 0.3s ease;
          }

          .premium-menu-item:hover .menu-icon-wrapper {
            background: #6366f1;
            color: white;
          }

          .menu-item-text {
            font-size: 15px;
            font-weight: 500;
            color: #334155;
            font-family: 'Outfit', sans-serif;
          }

          .drawer-footer {
            padding: 24px;
            border-top: 1px solid #f1f5f9;
            background: #fff;
          }

          .logout-btn {
            width: 100%;
            height: 48px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 8px !important;
            background: #ffffff !important;
            color: #ef4444 !important;
            border: 1px solid #fee2e2 !important;
            border-radius: 12px !important;
            font-weight: 600 !important;
            font-size: 15px !important;
            transition: all 0.3s ease !important;
          }

          .logout-btn:hover {
            background: #ef4444 !important;
            color: white !important;
            border-color: #ef4444 !important;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
          }

          /* --- Premium Host Popover Styles --- */
          .host-popup-container {
            width: 280px;
            padding: 4px;
          }

          .host-popup-item {
            display: flex;
            align-items: flex-start;
            gap: 16px;
            padding: 10px;
            border-radius: 14px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            margin-bottom: 6px;
            border: 1px solid transparent;
            background: transparent;
          }

          .host-popup-item:hover {
            background: #f8fafc;
            border-color: rgba(99, 102, 241, 0.1);
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.04);
          }

          .host-icon-wrapper {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            flex-shrink: 0;
            transition: all 0.3s ease;
          }

          .host-popup-item:hover .host-icon-wrapper {
            transform: scale(1.1);
          }

          .host-popup-text {
            flex: 1;
            padding-top: 2px;
          }

          .host-popup-title {
            font-size: 15px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 2px;
            font-family: 'Outfit', sans-serif;
            letter-spacing: -0.01em;
          }

          .host-popup-sub {
            font-size: 12px;
            color: #64748b;
            line-height: 1.5;
            font-weight: 400;
          }

          .host-popup-upgrade {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            background: #f1f5f9;
            color: #64748b;
            font-size: 10px;
            font-weight: 800;
            padding: 2px 8px;
            border-radius: 6px;
            text-transform: uppercase;
            margin-top: 8px;
          }
        `}
      </style>
    </>
  );
}
