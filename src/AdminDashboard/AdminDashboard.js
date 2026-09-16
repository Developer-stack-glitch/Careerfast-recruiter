'use client';
import { getImageUrl } from "../utils/getImageUrl";
import { useEffect, useState, useCallback } from "react";
import React from "react";
import { useParams } from "@/routing-shim";
import {
  IoQrCode,
  IoNotifications,
  IoSettingsSharp,
  IoLogOutOutline,
  IoPersonCircleOutline,
} from "react-icons/io5";
import { ArrowRightOutlined, PieChartOutlined, BarChartOutlined } from "@ant-design/icons";
import { FaInstagram, FaTwitter } from "react-icons/fa";
import {
  FaClipboardUser,
  FaFacebook,
  FaBehance,
  FaDribbble,
} from "react-icons/fa6";
import { MdOutlineModeEdit, MdDashboard } from "react-icons/md";
import { FaChevronDown } from "react-icons/fa";
import { VscGraph } from "react-icons/vsc";
import "../css/AdminDashboard.css";
import { useNavigate } from "@/routing-shim";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Bar,
  Tooltip as ChartTooltip,
} from "recharts";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  MailOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  LinkedinOutlined,
  PhoneOutlined,
  UserOutlined,
  CalendarOutlined,
  FileTextOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import "../css/AllRegisteredCandidates.css";
import {
  Avatar,
  Badge,
  Button,
  Dropdown,
  Layout,
  Menu,
  Space,
  theme,
  Typography,
  Card,
  Col,
  Row,
  Statistic,
  Tag,
  List,
  Timeline,
  Drawer,
  message,
  Skeleton,
  Tooltip,
} from "antd";
import dynamic from "next/dynamic";
const ManageCandidate = dynamic(() => import("./ManageCandidate"));
const EditOpportunity = dynamic(() => import("./EditOpportunity"));
const JobDetails = dynamic(() => import("../JobPortal/JobDetails"));
const RegistrationChart = dynamic(() => import("./RegistrationChart"));
const ManageNotification = dynamic(() => import("./ManageNotification"));

import {
  getAllCandidateByRecruiter,
  getAppliedCandidatesCount,
  getJobAppliedCandidates,
  getJobPosts,
  getUserProfile,
} from "../ApiService/action";
import { requestForToken } from "../firebase/fireBase";

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;


export default function AdminDashboard() {
  const [collapsed, setCollapsed] = useState(false);
  const { id } = useParams();
  const {
    token: { colorPrimary },
  } = theme.useToken();
  const [loginUserId, setLoginUserId] = useState(null);
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [role_name, setRoleName] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("1");
  const [drawerActiveTab, setDrawerActiveTab] = useState("overview");
  const [selectedUser, setSelectedUser] = useState(null);
  const navigate = useNavigate();
  const [postDetails, setPostDetails] = useState([]);
  const [maleCount, setMaleCount] = useState(null);
  const [femaleCount, setFemaleCount] = useState(null);
  const [othersCount, setOthersCount] = useState(null);
  const [totalAppliedCandidates, setTotalAppliedCandidates] = useState(null);
  const [domainCount, setDomainCount] = useState([]);
  const [allAppliedUsers, setAllAppliedUsers] = useState([])

  const handleLogout = () => {
    localStorage.removeItem("loginDetails");
    setLoginUserId(null);
    navigate("/login");
    message.error("Your'e logged out");
  };

  const getUserProfileData = useCallback(async () => {
    const payload = {
      user_id: loginUserId,
    };

    try {
      const response = await getUserProfile(payload);
      const image = response?.data?.data?.profile_image || "";
      setProfileImage(image);
    } catch (error) {
      console.log("getuserprofile erroxxr", error);
    }
  }, [loginUserId]);

  const getJobPostsData = useCallback(async () => {
    const payload = {};
    try {
      const response = await getJobPosts(payload);
      const jobs = response?.data?.data?.data || [];
      console.log("jobsss", jobs);
      setPostDetails(jobs);
      console.log("job post", response);
    } catch (error) {
      console.log("applied candidate", error);
    }
  }, []);

  const getAllCandidateByRecruiterData = useCallback(async () => {
    const payload = {
      user_id: loginUserId
    }

    try {
      const response = await getAllCandidateByRecruiter(payload);
      setAllAppliedUsers(response?.data?.data || [])
      console.log("getAllCandidateByRecruiter", response)
    } catch (error) {
      console.log("getAllCandidateByRecruiter", error)
    }
  }, [loginUserId]);

  const getJobAppliedCandidatesData = useCallback(async () => {
    setLoading(true);

    if (!id) {
      console.warn("Post ID is missing");
      setLoading(false);
      return;
    }

    const payload = { post_id: id };
    try {
      const response = await getJobAppliedCandidates(payload);
      console.log("getJobAppliedCandidates", response)
    } catch (error) {
      console.error("Error fetching applied candidates:", error);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 700);
    }
  }, [id]);

  const getAppliedCandidatesCountData = useCallback(async () => {
    const payload = {
      user_id: loginUserId,
      id: id,
    };

    try {
      const response = await getAppliedCandidatesCount(payload);
      setTotalAppliedCandidates(response?.data?.data?.candidatesCount || 0);
      setMaleCount(response?.data?.data?.males || null);
      setFemaleCount(response?.data?.data?.females || null);
      setOthersCount(response?.data?.data?.others || null);
      setDomainCount(
        (response?.data?.data?.domain_stats || []).map((item) => ({
          domain: item.job_categories,
          value: item.candidates_count,
        }))
      );

      console.log("getAppliedCandidatesCount", response);
    } catch (error) {
      console.log("getAppliedCandidatesCount", error);
    }
  }, [loginUserId, id]);

  const handleGetUserProfile = async (userId) => {
    const payload = {
      user_id: userId,
    };

    try {
      const response = await getUserProfile(payload);
      setOpen(true);
      setDrawerLoading(true);
      setSelectedUser(response?.data?.data || null);
      console.log("User Profile data", response);
      setTimeout(() => {
        setDrawerLoading(false);
      }, 2000);
    } catch (error) {
      console.log("User Profile data", error);
      setSelectedUser(null);
    }
  };

  useEffect(() => {
    console.log("Post ID from URL:", id);
  }, [id]);

  useEffect(() => {
    // handled by Helmet
    getJobPostsData();
  }, [getJobPostsData]);

  useEffect(() => {
    // 🔹 Save/update recruiter FCM token when dashboard loads
    requestForToken();
  }, []);

  useEffect(() => {
    if (loginUserId) {
      getAppliedCandidatesCountData();
    }
  }, [loginUserId, getAppliedCandidatesCountData]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("loginDetails");
      console.log("login details", stored);
      if (stored) {
        const loginDetails = JSON.parse(stored);
        setLoginUserId(loginDetails.id);
        setFname(loginDetails.first_name);
        setLname(loginDetails.last_name);
        setRoleName(loginDetails.role_name);

        if (loginDetails.role_id === 2) {
          navigate("/");
          return;
        }
      }
    } catch (error) {
      console.error("Invalid JSON in localStorage", error);
    }
  }, [navigate]);

  useEffect(() => {
    if (loginUserId) {
      getUserProfileData();
    }
  }, [loginUserId, getUserProfileData]);

  useEffect(() => {
    if (loginUserId) {
      getAllCandidateByRecruiterData()
    }
  }, [loginUserId, getAllCandidateByRecruiterData]);

  useEffect(() => {
    if (activeTab === "1" && id) {
      getJobAppliedCandidatesData();
    }
  }, [activeTab, id, getJobAppliedCandidatesData]);

  const menuItems = [
    {
      key: "1",
      icon: <MdDashboard size={18} />,
      label: "Dashboard (Overall)",
    },
    {
      key: "2",
      icon: <FaClipboardUser size={16} />,
      label: "Manage Candidates",
    },
    {
      key: "3",
      icon: <MdOutlineModeEdit size={18} />,
      label: "Edit Opportunity",
    },
    {
      key: "5",
      icon: <VscGraph size={17} />,
      label: "Opportunity Stats",
    },
    {
      key: "6",
      icon: <IoNotifications size={18} />,
      label: "Manage Notifications",
    },
  ];

  const userMenuItems = [


    {
      key: "1",
      label: (
        <div onClick={() => navigate("/candidate-profile")}>
          <IoPersonCircleOutline size={16} style={{ marginRight: 8 }} />
          Profile
        </div>
      ),
    },
    {
      key: "2",
      label: (
        <div onClick={() => navigate("/settings")}>
          <IoSettingsSharp size={16} style={{ marginRight: 8 }} />
          Settings
        </div>
      ),
    },
    {
      type: "divider",
    },
    {
      key: "3",
      label: (
        <div onClick={handleLogout}>
          <IoLogOutOutline size={16} style={{ marginRight: 8 }} />
          Logout
        </div>
      ),
      danger: true,
    },
  ];



  const ChartCard = ({ children, ...props }) => (
    <Card
      styles={{ header: { borderBottom: "1px solid #f0f0f0" } }}
      style={{
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
        marginBottom: "24px",
        border: "none",
        ...(props.style || {}),
      }}
      {...props}
    >
      {children}
    </Card>
  );

  const genderData = [
    { name: "Female", value: femaleCount || 0 },
    { name: "Male", value: maleCount || 0 },
    { name: "Other", value: othersCount || 0 },
  ];

  const COLORS = ["#EC4899", "#6366F1", "#94A3B8"];
  const COLORS1 = ["#6366F1", "#EC4899", "#94A3B8"];
  const renderCustomizedLabel = ({ percent, x, y }) => (
    <text
      x={x}
      y={y}
      fill="#334155"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={500}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="premium-recharts-tooltip">
          {label && <div className="tooltip-title">{label}</div>}
          {payload.map((entry, index) => (
            <div key={index} className="tooltip-row">
              <div
                className="tooltip-dot"
                style={{ backgroundColor: entry.color || entry.payload.fill || "var(--primary)" }}
              />
              <span>{entry.name}:</span>
              <span className="tooltip-val">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const recentJobs = postDetails.filter((job) => {
    const createdDate = new Date(job.created_at);
    const currentDate = new Date();
    const diffDays = Math.floor(
      (currentDate - createdDate) / (1000 * 60 * 60 * 24)
    );
    return diffDays <= 355;
  });

  const expiredJobs = postDetails.filter((job) => {
    const createdDate = new Date(job.created_at);
    const currentDate = new Date();
    const diffDays = Math.floor(
      (currentDate - createdDate) / (1000 * 60 * 60 * 24)
    );
    return diffDays >= 355;
  });

  return (
    <Layout className="admin-dashboard" style={{ minHeight: "100vh" }}>

      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={280}
        style={{
          background: "#0f172a",
          boxShadow: "4px 0 24px rgba(0,0,0,0.15)",
          position: "fixed",
          height: "100vh",
          zIndex: 100,
        }}
      >
        <div
          className="logo-container"
          style={{
            height: 72,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          {collapsed ? (
            <div
              style={{
                width: 40,
                height: 40,
                background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
              }}
            >
              <Title level={3} style={{ color: "#fff", margin: 0 }}>
                C
              </Title>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "0 16px",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
                }}
              >
                <Title level={3} style={{ color: "#fff", margin: 0 }}>
                  C
                </Title>
              </div>
              <Title level={3} style={{ color: "#fff", margin: 0, fontWeight: 700, letterSpacing: "-0.5px" }}>
                Career<span style={{ color: "#6366f1" }}>Fast</span>
              </Title>
            </div>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={["1"]}
          defaultOpenKeys={["5"]}
          items={menuItems}
          style={{
            background: "transparent",
            padding: "24px 0",
            borderRight: "none",
          }}
          onClick={({ key }) => setActiveTab(key)}
          inlineIndent={16}
        />

        {!collapsed && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              width: "100%",
              padding: "20px 24px",
              background: "rgba(255,255,255,0.02)",
              borderTop: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
              }}
            >
              <Avatar
                size={44}
                src={getImageUrl(profileImage)}
                style={{ marginRight: 12, border: "2px solid rgba(255,255,255,0.1)" }}
              />
              <div>
                <Text strong style={{ color: "#fff", display: "block", fontSize: 14 }}>
                  {fname} {lname}
                </Text>
                <Text
                  type="secondary"
                  style={{ color: "#94a3b8", fontSize: 12 }}
                >
                  {role_name}
                </Text>
              </div>
            </div>
          </div>
        )}
      </Sider>

      <Layout
        style={{
          marginLeft: collapsed ? 80 : 280,
          transition: "all 0.2s",
          background: "#f5f7fa",
        }}
      >
        <Header
          style={{
            padding: "10px 24px",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 1px 10px 0 rgba(0,0,0,0.05)",
            position: "sticky",
            top: 0,
            zIndex: 10,
            height: "73px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: "16px",
                width: 48,
                height: 48,
              }}
            />
          </div>

          <Space size="middle">
            <Badge count={12} size="small" color={colorPrimary} offset={[-3, 3]}>
              <Button
                type="text"
                icon={<BellOutlined style={{ fontSize: 20, color: "var(--text-muted)" }} />}
                shape="circle"
                style={{
                  width: 40,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#f8fafc",
                  border: "1px solid var(--border)",
                }}
              />
            </Badge>
            <Badge count={12} size="small" color="#10b981" offset={[-3, 3]}>
              <Button
                type="text"
                icon={<MailOutlined style={{ fontSize: 20, color: "var(--text-muted)" }} />}
                shape="circle"
                style={{
                  width: 40,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#f8fafc",
                  border: "1px solid var(--border)",
                }}
              />
            </Badge>

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="user-profile-dropdown">
                <Avatar
                  size={32}
                  src={getImageUrl(profileImage)}
                  style={{ marginRight: 8 }}
                />
                <Text strong style={{ color: "var(--text-main)", fontSize: 14 }}>
                  {fname} {lname}
                </Text>
                <FaChevronDown
                  style={{ marginLeft: 8, fontSize: 12, color: "var(--text-muted)" }}
                />
              </div>
            </Dropdown>
          </Space>
        </Header>
        {String(activeTab) === "1" && (
          <Content
            style={{
              margin: "24px 16px",
              padding: "14px 15px",
              minHeight: 280,
              background: "transparent",
            }}
          >
            <>
              <div
                style={{
                  marginBottom: 24,
                }}
              >
                <Title level={2} style={{ margin: 0, fontWeight: 600, color: "var(--text-main)" }}>
                  Hello {fname} {lname}! 👋
                </Title>
                <Text type="secondary" style={{ fontSize: 14, display: "block", marginTop: 4 }}>
                  Here is the summary of overall performance
                </Text>
              </div>

              <Row gutter={[24, 24]} style={{ marginBottom: 44 }}>
                <Col xs={24} sm={12} md={6}>
                  <Tooltip
                    color="#f6faff"
                    key="#000"
                    title={
                      <span style={{ color: "#1677ff" }}>
                        View all applied candidates
                      </span>
                    }
                  >
                    <Card
                      onClick={() => navigate("/applied-candidates-all")}
                      hoverable
                      className="metric-card metric-card-total"
                    >
                      {loading ? (
                        <>
                          <Skeleton.Input
                            active
                            style={{ width: 120, height: 32, marginBottom: 12 }}
                          />
                          <Skeleton
                            paragraph={{ rows: 1, width: "60%" }}
                            active
                          />
                        </>
                      ) : (
                        <>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 16,
                            }}
                          >
                            <div
                              style={{
                                background: "rgba(99, 102, 241, 0.1)",
                                color: "var(--primary)",
                                padding: 12,
                                borderRadius: 12,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <IoQrCode
                                style={{ fontSize: 24 }}
                              />
                            </div>
                            <Statistic
                              title={
                                <span style={{ color: "var(--text-muted)", fontWeight: 500, fontSize: 14 }}>Total Candidates</span>
                              }
                              value={totalAppliedCandidates}
                              valueStyle={{
                                color: "var(--text-main)",
                                fontWeight: 500,
                                fontSize: 28,
                              }}
                            />
                          </div>
                          <div style={{ marginTop: 12 }}>
                            <Text type="secondary" style={{ fontSize: 13 }}>
                              <span
                                style={{ color: "var(--success)", fontWeight: "bold" }}
                              >
                                +12.5%
                              </span>{" "}
                              from last month
                            </Text>
                          </div>
                        </>
                      )}
                    </Card>
                  </Tooltip>
                </Col>

                {/* Active Jobs */}
                <Col xs={24} sm={12} md={6}>
                  <Tooltip
                    color="#f6ffed  "
                    key="#000"
                    title={
                      <span style={{ color: "#52c41a" }}>
                        View all active jobs
                      </span>
                    }
                  >
                    <Card
                      onClick={() => {
                        localStorage.setItem("activeAdminTab", "listing");
                        localStorage.setItem("listingOrder", "topBottom");
                        navigate("/candidate-profile/mainprofile");
                      }}
                      hoverable
                      className="metric-card metric-card-active"
                    >
                      {loading ? (
                        <>
                          <Skeleton.Input
                            active
                            style={{ width: 100, height: 32, marginBottom: 12 }}
                          />
                          <Skeleton
                            paragraph={{ rows: 1, width: "50%" }}
                            active
                          />
                        </>
                      ) : (
                        <>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 16,
                            }}
                          >
                            <div
                              style={{
                                background: "rgba(16, 185, 129, 0.1)",
                                color: "var(--success)",
                                padding: 12,
                                borderRadius: 12,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <FaClipboardUser
                                style={{ fontSize: 24 }}
                              />
                            </div>
                            <Statistic
                              title={<span style={{ color: "var(--text-muted)", fontWeight: 500, fontSize: 14 }}>Active Jobs</span>}
                              value={recentJobs.length}
                              valueStyle={{
                                color: "var(--text-main)",
                                fontWeight: 500,
                                fontSize: 28,
                              }}
                            />
                          </div>
                          <div style={{ marginTop: 12 }}>
                            <Text type="secondary" style={{ fontSize: 13 }}>
                              <span
                                style={{ color: "var(--success)", fontWeight: "bold" }}
                              >
                                +3
                              </span>{" "}
                              new this week
                            </Text>
                          </div>
                        </>
                      )}
                    </Card>
                  </Tooltip>
                </Col>

                {/* Interviews */}
                <Col xs={24} sm={12} md={6}>
                  <Tooltip
                    color="#fffbe6"
                    key="#000"
                    title={
                      <span style={{ color: "#faad14" }}>
                        View all interviews candidates
                      </span>
                    }
                  >
                    <Card
                      hoverable
                      className="metric-card metric-card-interviews"
                    >
                      {loading ? (
                        <>
                          <Skeleton.Input
                            active
                            style={{ width: 100, height: 32, marginBottom: 12 }}
                          />
                          <Skeleton
                            paragraph={{ rows: 1, width: "50%" }}
                            active
                          />
                        </>
                      ) : (
                        <>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 16,
                            }}
                          >
                            <div
                              style={{
                                background: "rgba(245, 158, 11, 0.1)",
                                color: "var(--warning)",
                                padding: 12,
                                borderRadius: 12,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <VscGraph
                                style={{ fontSize: 24 }}
                              />
                            </div>
                            <Statistic
                              title={<span style={{ color: "var(--text-muted)", fontWeight: 500, fontSize: 14 }}>Interviews</span>}
                              value={156}
                              valueStyle={{
                                color: "var(--text-main)",
                                fontWeight: 500,
                                fontSize: 28,
                              }}
                            />
                          </div>
                          <div style={{ marginTop: 12 }}>
                            <Text type="secondary" style={{ fontSize: 13 }}>
                              <span
                                style={{ color: "var(--danger)", fontWeight: "bold" }}
                              >
                                -8
                              </span>{" "}
                              from last week
                            </Text>
                          </div>
                        </>
                      )}
                    </Card>
                  </Tooltip>
                </Col>

                {/* Pending Actions */}
                <Col xs={24} sm={12} md={6}>
                  <Tooltip
                    color="#fff2f0"
                    key="#000"
                    title={
                      <span style={{ color: "#ff4d4f" }}>
                        View all expired candidates
                      </span>
                    }
                  >
                    <Card
                      onClick={() => {
                        localStorage.setItem("activeAdminTab", "listing");
                        localStorage.setItem("listingOrder", "bottomTop");
                        navigate("/candidate-profile");
                      }}
                      hoverable
                      className="metric-card metric-card-expired"
                    >
                      {loading ? (
                        <>
                          <Skeleton.Input
                            active
                            style={{ width: 100, height: 32, marginBottom: 12 }}
                          />
                          <Skeleton
                            paragraph={{ rows: 1, width: "50%" }}
                            active
                          />
                        </>
                      ) : (
                        <>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 16,
                            }}
                          >
                            <div
                              style={{
                                background: "rgba(239, 68, 68, 0.1)",
                                color: "var(--danger)",
                                padding: 12,
                                borderRadius: 12,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <IoNotifications
                                style={{ fontSize: 24 }}
                              />
                            </div>
                            <Statistic
                              title={<span style={{ color: "var(--text-muted)", fontWeight: 500, fontSize: 14 }}>Expired Jobs</span>}
                              value={expiredJobs.length}
                              valueStyle={{
                                color: "var(--text-main)",
                                fontWeight: 500,
                                fontSize: 28,
                              }}
                            />
                          </div>
                          <div style={{ marginTop: 12 }}>
                            <Text type="secondary" style={{ fontSize: 13 }}>
                              <span
                                style={{ color: "var(--danger)", fontWeight: "bold" }}
                              >
                                +5
                              </span>{" "}
                              urgent
                            </Text>
                          </div>
                        </>
                      )}
                    </Card>
                  </Tooltip>
                </Col>
              </Row>

              <Row gutter={[24, 24]}>
                <Col xs={24} lg={16}>
                  <Row gutter={[24, 24]}>
                    <Col xs={24}>
                      <Card
                        className="recent-candidates"
                        title={
                          <div className="premium-card-header">
                            <span className="card-title">
                              Applied Candidates
                            </span>
                            {allAppliedUsers.length > 0 && (
                              <Tag color="blue" style={{ borderRadius: 12, fontWeight: 500, padding: "2px 10px" }}>
                                {allAppliedUsers.length} Candidates
                              </Tag>
                            )}
                          </div>
                        }
                        style={{
                          borderRadius: "16px",
                          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.05)",
                          border: "none",
                          overflow: "hidden",
                        }}
                        styles={{
                          header: {
                            border: "none",
                            padding: "20px 24px 8px",
                          }
                        }}
                      >


                        {allAppliedUsers.length > 0 ? (
                          <div
                            style={{ maxHeight: "500px", overflowY: "auto" }}
                          >
                            <List
                              itemLayout="horizontal"
                              dataSource={allAppliedUsers.slice(0, 5)}
                              renderItem={(item, index) => (
                                <List.Item
                                  className="candidate-item"
                                  style={{
                                    padding: "16px 24px",
                                    transition: "all 0.3s ease",
                                    borderBottom:
                                      "1px solid rgba(0, 0, 0, 0.03)",
                                  }}
                                  actions={[
                                    <Button
                                      onClick={() =>
                                        handleGetUserProfile(item.user_id)
                                      }
                                      type="text"
                                      className="view-btn"
                                      style={{
                                        color: "#6a5cff",
                                        background: "rgba(106, 92, 255, 0.1)",
                                        borderRadius: "8px",
                                        fontWeight: 500,
                                        padding: "4px 12px",
                                        transition: "all 0.2s ease",
                                      }}
                                      onMouseEnter={(e) =>
                                      (e.currentTarget.style.transform =
                                        "translateX(2px)")
                                      }
                                      onMouseLeave={(e) =>
                                      (e.currentTarget.style.transform =
                                        "translateX(0)")
                                      }
                                    >
                                      View{" "}
                                      <ArrowRightOutlined
                                        style={{ fontSize: "12px" }}
                                      />
                                    </Button>,
                                  ]}
                                >
                                  
                                  {loading ? (
                                    <Skeleton
                                      avatar={{
                                        size: "large",
                                        shape: "circle",
                                      }}
                                      active
                                      paragraph={{ rows: 5 }}
                                      title={false}
                                      style={{ padding: "24px 0" }}
                                    />
                                  ) : (
                                    <List.Item.Meta
                                      avatar={
                                        <Badge
                                          dot
                                          color="#52c41a"
                                          offset={[-4, 40]}
                                          className="online-badge"
                                        >
                                          <Avatar
                                            className="profile_image"
                                            size={48}
                                            src={
                                              item.profile_image ||
                                              "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                                            }
                                            style={{
                                              border: "2px solid #fff",
                                              boxShadow:
                                                "0 2px 8px rgba(0, 0, 0, 0.1)",
                                            }}
                                          />
                                        </Badge>
                                      }
                                      title={
                                        <span className="candidate-name">{`${item.first_name} ${item.last_name}`}</span>
                                      }
                                      description={
                                        <div className="candidate-info">
                                          <span>
                                            {item.email || item.phone}
                                          </span>
                                        </div>
                                      }
                                      style={{
                                        alignItems: "center",
                                        display: "flex",
                                      }}
                                    />
                                  )}
                                </List.Item>
                              )}
                            />
                            <div style={{ textAlign: "center", marginTop: 20, marginBottom: 10 }}>
                              <button className="see-more-btn" onClick={() => navigate("/applied-candidates-all")} style={{ cursor: "pointer", background: "none", border: "none" }}>View All</button>
                            </div>

                          </div>
                        ) : (
                          <Card style={{ textAlign: "center", padding: 40 }}>
                            <Title level={4} style={{ color: "#bfbfbf" }}>
                              No Candidates found
                            </Title>
                          </Card>
                        )}
                      </Card>
                    </Col>
                  </Row>
                </Col>

                <Col xs={24} lg={8}>
                  <Row gutter={[24, 24]}>
                    <Col xs={24}>
                      <Card
                        title={
                          <Text
                            style={{
                              fontSize: 16,
                              fontWeight: 600,
                              color: "var(--text-main)",
                            }}
                          >
                            Recent Listings
                          </Text>
                        }
                        style={{
                          borderRadius: 16,
                          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)",
                          border: "1px solid var(--border)",
                        }}
                        styles={{
                          header: { borderBottom: "1px solid var(--border)", padding: "16px 24px" },
                          body: { padding: "24px" }
                        }}
                        extra={
                          postDetails.length > 0 && (
                            <Button
                              onClick={() => {
                                localStorage.setItem(
                                  "activeAdminTab",
                                  "listing"
                                );
                                navigate("/candidate-profile");
                              }}
                              type="text"
                              style={{ color: "var(--primary)", fontWeight: 600 }}
                            >
                              See All
                            </Button>
                          )
                        }
                      >
                        {loading ? (
                          <Skeleton active />
                        ) : postDetails.length > 0 ? (
                          <Timeline
                            style={{ marginTop: 8 }}
                            items={postDetails.slice(0, 4).map((job) => {
                              const createdDate = new Date(job.created_at);
                              const currentDate = new Date();
                              const diffDays =
                                (currentDate - createdDate) /
                                (1000 * 60 * 60 * 24);
                              const isActive = diffDays <= 15;

                              return {
                                color: "transparent",
                                dot: (
                                  <div
                                    style={{
                                      width: 14,
                                      height: 14,
                                      borderRadius: "50%",
                                      background:
                                        "linear-gradient(135deg, var(--primary), var(--primary-hover))",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      boxShadow:
                                        "0 2px 6px rgba(99,102,241,0.4)",
                                    }}
                                  >
                                    <CheckCircleOutlined
                                      style={{ fontSize: 12, color: "#fff" }}
                                    />
                                  </div>
                                ),
                                children: (
                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: 4,
                                      paddingBottom: 8,
                                    }}
                                  >
                                    <Text
                                      strong
                                      style={{ fontSize: 15, color: "var(--text-main)" }}
                                    >
                                      {job.job_title}
                                    </Text>
                                    <Text
                                      type="secondary"
                                      style={{ fontSize: 12, color: "var(--text-muted)" }}
                                    >
                                      📅 Posted on:{" "}
                                      {createdDate.toLocaleDateString("en-GB")}
                                    </Text>
                                    <div
                                      style={{
                                        marginTop: 4,
                                        display: "flex",
                                        gap: 6,
                                        flexWrap: "wrap",
                                      }}
                                    >
                                      <Tag
                                        style={{
                                          borderRadius: 20,
                                          background: "rgba(99, 102, 241, 0.08)",
                                          border: "none",
                                          color: "var(--primary)",
                                          fontWeight: 500,
                                        }}
                                      >
                                        {job.job_nature}
                                      </Tag>
                                      <Tag
                                        style={{
                                          borderRadius: 20,
                                          background: "rgba(16, 185, 129, 0.08)",
                                          border: "none",
                                          color: "var(--success)",
                                          fontWeight: 500,
                                        }}
                                      >
                                        {job.workplace_type}
                                      </Tag>
                                      {isActive ? (
                                        <Tag
                                          style={{
                                            borderRadius: 20,
                                            background: "rgba(16, 185, 129, 0.12)",
                                            border: "none",
                                            color: "var(--success)",
                                            fontWeight: 600,
                                          }}
                                        >
                                          Active
                                        </Tag>
                                      ) : (
                                        <Tag
                                          style={{
                                            borderRadius: 20,
                                            background: "rgba(239, 68, 68, 0.12)",
                                            border: "none",
                                            color: "var(--danger)",
                                            fontWeight: 600,
                                          }}
                                        >
                                          Closed
                                        </Tag>
                                      )}
                                    </div>
                                  </div>
                                ),
                              };
                            })}
                          />
                        ) : (
                          <Card style={{ textAlign: "center", padding: 40 }}>
                            <Title level={4} style={{ color: "#bfbfbf" }}>
                              No listings available
                            </Title>
                          </Card>
                        )}
                      </Card>
                    </Col>
                  </Row>
                </Col>
              </Row>

              {/* Charts Row - matching admin-profile/dashboard layout */}
              <div className="charts-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "24px" }}>
                {/* Gender Distribution */}
                <div className="chart-card">
                  <div className="chart-header">
                    <span className="chart-title">
                      <PieChartOutlined style={{ color: "#6366f1" }} /> Gender Distribution
                    </span>
                    <Text type="secondary" style={{ fontSize: "12px" }}>Gender distribution for overall job posts</Text>
                  </div>
                  <div className="chart-body" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    {genderData.some((item) => item.value > 0) ? (
                      <>
                        <ResponsiveContainer width="100%" height="80%">
                          <PieChart>
                            <Pie
                              data={genderData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={85}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {genderData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <ChartTooltip
                              content={<CustomTooltip />}
                              wrapperStyle={{ zIndex: 1000 }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        {/* Custom Legend */}
                        <div style={{ display: "flex", gap: "16px", justifyContent: "center", marginTop: "10px", flexWrap: "wrap" }}>
                          {genderData.map((item, idx) => (
                            <div key={idx} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600 }}>
                              <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: COLORS[idx % COLORS.length], display: "inline-block" }}></span>
                              <span style={{ color: "#475569" }}>{item.name}: {item.value}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div style={{ textAlign: "center", color: "#64748b", padding: "100px 0" }}>No gender data available</div>
                    )}
                  </div>
                </div>

                {/* Domain Distribution */}
                <div className="chart-card">
                  <div className="chart-header">
                    <span className="chart-title">
                      <BarChartOutlined style={{ color: "#6366f1" }} /> Domain Distribution
                    </span>
                    <Text type="secondary" style={{ fontSize: "12px" }}>Domain distribution for overall job posts</Text>
                  </div>
                  <div className="chart-body">
                    {domainCount.length > 0 &&
                      domainCount.some((item) => item.value > 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={domainCount}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis
                            dataKey="domain"
                            tickFormatter={(tick) => {
                              if (!tick) return "";
                              return tick.length > 12 ? `${tick.substring(0, 10)}...` : tick;
                            }}
                            tick={{ fill: "#64748b", fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            tick={{ fill: "#64748b", fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <ChartTooltip
                            content={<CustomTooltip />}
                            wrapperStyle={{ zIndex: 1000 }}
                          />
                          <Bar
                            dataKey="value"
                            name="Registrations"
                            fill="#6366f1"
                            radius={[6, 6, 0, 0]}
                            barSize={24}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ textAlign: "center", color: "#64748b", padding: "100px 0" }}>No domain data available</div>
                    )}
                  </div>
                </div>
              </div>
            </>
          </Content>
        )}

        {String(activeTab) === "2" && (
          <Content
            style={{
              margin: "0px",
              padding: 0,
              background: "transparent",
            }}
          >
            <ManageCandidate /> {/* Tab 2 content */}
          </Content>
        )}

        {String(activeTab) === "3" && (
          <Content
            style={{
              margin: "0px",
              padding: 0,
              background: "transparent",
            }}
          >
            <EditOpportunity /> {/* Tab 2 content */}
          </Content>
        )}


        {String(activeTab) === "4" && <JobDetails />}
        {String(activeTab) === "5" && <RegistrationChart />}
        {String(activeTab) === "6" && <ManageNotification />}
      {selectedUser && (
                                    <Drawer
                                      className="userDetails_drawer"
                                      closable
                                      width={window.innerWidth < 992 ? "100%" : 850}
                                      zIndex={99999}
                                      title={
                                        <Space size={12}>
                                          <Avatar
                                            size={36}
                                            src={getImageUrl(selectedUser?.profile_image)}
                                            style={{
                                              marginLeft: "20px",
                                              border: "2px solid #6366f1",
                                              background: selectedUser?.role_name === "RECRUITER" ? "#10b981" : "#6366f1"
                                            }}
                                          />
                                          <span style={{ fontWeight: 600, color: "#0f172a", fontSize: 16 }}>
                                            {selectedUser?.role_name === "RECRUITER" ? "Employer Profile" : "Candidate Profile"}
                                          </span>
                                        </Space>
                                      }
                                      placement="right"
                                      open={open}
                                      loading={drawerLoading}
                                      onClose={() => setOpen(false)}
                                    >
                                      {selectedUser && (
                                        <div style={{ position: "relative" }}>
                                          {/* Banner Area */}
                                          <div className="drawer-banner-container" />

                                          {/* Avatar & Summary section */}
                                          <div className="drawer-profile-summary">
                                            <Avatar
                                              size={110}
                                              src={getImageUrl(selectedUser.profile_image)}
                                              className="drawer-avatar-glow"
                                              icon={<UserOutlined />}
                                            />
                                            <div className="drawer-full-name">
                                              {selectedUser.first_name} {selectedUser.last_name}
                                            </div>
                                            <div className="drawer-user-role">
                                              {selectedUser.role_name === "RECRUITER"
                                                ? `Recruiter at ${selectedUser.organization || "Independent"}`
                                                : (selectedUser.user_type || "Candidate")}
                                            </div>
                                            <div className="drawer-location-badge">
                                              <EnvironmentOutlined style={{ color: "#ef4444" }} />
                                              <span>{selectedUser.location || "Location not provided"}</span>
                                            </div>

                                            {/* Social Connect Link icons */}
                                            {selectedUser.social_links && (
                                              <div className="social-glow-icons">
                                                {[
                                                  { key: "linkedin", icon: <LinkedinOutlined /> },
                                                  { key: "facebook", icon: <FaFacebook /> },
                                                  { key: "instagram", icon: <FaInstagram /> },
                                                  { key: "behance", icon: <FaBehance /> },
                                                  { key: "twitter", icon: <FaTwitter /> },
                                                  { key: "dribble", icon: <FaDribbble /> },
                                                ].map(({ key, icon }) => {
                                                  const value = selectedUser.social_links[key];
                                                  return (
                                                    <a
                                                      key={key}
                                                      href={value || "#"}
                                                      target="_blank"
                                                      rel="noreferrer"
                                                      className={`social-glow-btn ${key}`}
                                                      style={{
                                                        opacity: value ? 1 : 0.25,
                                                        pointerEvents: value ? "auto" : "none",
                                                      }}
                                                    >
                                                      {icon}
                                                    </a>
                                                  );
                                                })}
                                              </div>
                                            )}
                                          </div>

                                          {/* Drawer Tabs navigation (Internal tabs) */}
                                          {selectedUser.role_name !== "RECRUITER" && (
                                            <div className="drawer-tabs-track">
                                              {[
                                                { key: "overview", label: "Overview" },
                                                { key: "edu_exp", label: "Experience & Education" },
                                                { key: "projects", label: "Projects & Resume" }
                                              ].map(t => (
                                                <button
                                                  key={t.key}
                                                  className={`drawer-tab-btn ${drawerActiveTab === t.key ? 'active' : ''}`}
                                                  onClick={() => setDrawerActiveTab(t.key)}
                                                >
                                                  {t.label}
                                                </button>
                                              ))}
                                            </div>
                                          )}

                                          {/* Drawer Main Content Cards */}
                                          <div className="drawer-content-sections">
                                            {/* CANDIDATE SHOWCASE VIEW */}
                                            {selectedUser.role_name !== "RECRUITER" ? (
                                              <>
                                                {drawerActiveTab === "overview" && (
                                                  <>
                                                    <Card className="profile-card-premium" title="Basic Contact Information">
                                                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px 24px" }}>
                                                        <div className="info-item-box">
                                                          <div className="info-item-icon-wrapper"><MailOutlined /></div>
                                                          <div>
                                                            <div className="info-item-label">Email</div>
                                                            <div className="info-item-value">{selectedUser.email}</div>
                                                          </div>
                                                        </div>
                                                        <div className="info-item-box">
                                                          <div className="info-item-icon-wrapper"><PhoneOutlined /></div>
                                                          <div>
                                                            <div className="info-item-label">Phone</div>
                                                            <div className="info-item-value">{selectedUser.phone_code ? `${selectedUser.phone_code} ` : ""}{selectedUser.phone || "N/A"}</div>
                                                          </div>
                                                        </div>
                                                        <div className="info-item-box">
                                                          <div className="info-item-icon-wrapper"><UserOutlined /></div>
                                                          <div>
                                                            <div className="info-item-label">Gender</div>
                                                            <div className="info-item-value">{selectedUser.gender || "N/A"}</div>
                                                          </div>
                                                        </div>
                                                        <div className="info-item-box">
                                                          <div className="info-item-icon-wrapper"><CalendarOutlined /></div>
                                                          <div>
                                                            <div className="info-item-label">Joined On</div>
                                                            <div className="info-item-value">{new Date(selectedUser.created_date).toLocaleDateString()}</div>
                                                          </div>
                                                        </div>
                                                      </div>
                                                    </Card>

                                                    {selectedUser.about && (
                                                      <Card className="profile-card-premium" title="About Candidate">
                                                        <p style={{ color: "#475569", fontSize: 14, lineHeight: "1.6", margin: 0 }}>
                                                          {selectedUser.about}
                                                        </p>
                                                      </Card>
                                                    )}

                                                    {selectedUser.skills?.length > 0 && (
                                                      <Card className="profile-card-premium" title="Key Professional Skills">
                                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                                          {selectedUser.skills.map((skill, idx) => (
                                                            <Tag key={idx} style={{
                                                              background: "#f6efffff",
                                                              color: "#6025ebff",
                                                              border: "1px solid #e0bffeff",
                                                              borderRadius: 50,
                                                              padding: "4px 14px",
                                                              fontSize: 13,
                                                              fontWeight: 600,
                                                              margin: 0
                                                            }}>{skill}</Tag>
                                                          ))}
                                                        </div>
                                                      </Card>
                                                    )}
                                                  </>
                                                )}

                                                {drawerActiveTab === "edu_exp" && (
                                                  <>
                                                    <Card className="profile-card-premium" title="Professional Experience">
                                                      {selectedUser.professional && selectedUser.professional.length > 0 ? (
                                                        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                                                          {selectedUser.professional.map((exp, idx) => (
                                                            <div key={idx} className="timeline-card-node">
                                                              <div className="timeline-bullet-active" />
                                                              <div className="timeline-card-time">
                                                                {exp.start_date} – {exp.currently_working ? "Present" : exp.end_date}
                                                              </div>
                                                              <div className="timeline-card-title">{exp.designation || exp.job_title}</div>
                                                              <div className="timeline-card-subtitle">{exp.company_name}</div>
                                                              {exp.skills && exp.skills.length > 0 && (
                                                                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                                                                  {exp.skills.map((s, i) => (
                                                                    <Tag key={i} size="small" style={{ borderRadius: 6, fontSize: 11, background: "#f1f5f9", border: "none" }}>{s}</Tag>
                                                                  ))}
                                                                </div>
                                                              )}
                                                            </div>
                                                          ))}
                                                        </div>
                                                      ) : (
                                                        <span style={{ color: "#64748b", fontStyle: "italic" }}>No professional experience registered.</span>
                                                      )}
                                                    </Card>

                                                    <Card className="profile-card-premium" title="Education Details">
                                                      {selectedUser.education && selectedUser.education.length > 0 ? (
                                                        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                                                          {selectedUser.education.map((edu, idx) => (
                                                            <div key={idx} className="timeline-card-node">
                                                              <div className="timeline-bullet-active" style={{ background: "#10b981", boxShadow: "0 0 0 3px rgba(16, 185, 129, 0.2)" }} />
                                                              <div className="timeline-card-time" style={{ color: "#10b981" }}>
                                                                {edu.start_date} – {edu.end_date}
                                                              </div>
                                                              <div className="timeline-card-title">{edu.course}</div>
                                                              <div className="timeline-card-subtitle">{edu.college}</div>
                                                              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                                                                {edu.qualification && <span className="timeline-card-score" style={{ background: "#f5f3ff", color: "#6d28d9" }}>{edu.qualification}</span>}
                                                                {edu.specialization && <span className="timeline-card-score" style={{ background: "#eff6ff", color: "#1d4ed8" }}>{edu.specialization}</span>}
                                                                {edu.cgpa && <span className="timeline-card-score">CGPA: {edu.cgpa}</span>}
                                                                {edu.percentage && <span className="timeline-card-score">Percentage: {edu.percentage}%</span>}
                                                              </div>
                                                            </div>
                                                          ))}
                                                        </div>
                                                      ) : (
                                                        <span style={{ color: "#64748b", fontStyle: "italic" }}>No education credentials provided.</span>
                                                      )}
                                                    </Card>
                                                  </>
                                                )}

                                                {drawerActiveTab === "projects" && (
                                                  <>
                                                    <Card className="profile-card-premium" title="Academic & Personal Projects">
                                                      {selectedUser.projects && selectedUser.projects.length > 0 ? (
                                                        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                                                          {selectedUser.projects.map((proj, idx) => (
                                                            <div key={idx} style={{ paddingBottom: 16, borderBottom: idx !== selectedUser.projects.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                                                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap" }}>
                                                                <span style={{ fontWeight: 700, fontSize: 16, color: "#1e293b" }}>{proj.project_title}</span>
                                                                <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{proj.start_date} – {proj.end_date}</span>
                                                              </div>
                                                              <div style={{ fontSize: 13, color: "#4f46e5", fontWeight: 600, marginTop: 2 }}>{proj.project_type || "Personal"}</div>
                                                              <p style={{ fontSize: 13, color: "#475569", lineHeight: "1.6", marginTop: 8, marginBottom: 0 }}>{proj.description}</p>
                                                            </div>
                                                          ))}
                                                        </div>
                                                      ) : (
                                                        <span style={{ color: "#64748b", fontStyle: "italic" }}>No projects listed.</span>
                                                      )}
                                                    </Card>

                                                    <Card className="profile-card-premium" title="Resume Document">
                                                      {selectedUser.resume ? (
                                                        <div>
                                                          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                                                            <Button
                                                              type="primary"
                                                              icon={<DownloadOutlined />}
                                                              onClick={() => window.open(getImageUrl(selectedUser.resume))}
                                                              style={{ borderRadius: 10, fontWeight: 700 }}
                                                            >
                                                              Download Resume
                                                            </Button>
                                                          </div>
                                                          <iframe
                                                            src={getImageUrl(selectedUser.resume)}
                                                            title="Candidate Resume"
                                                            width="100%"
                                                            height="550px"
                                                            style={{
                                                              border: "1px solid #cbd5e1",
                                                              borderRadius: "16px",
                                                              boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                                                            }}
                                                          />
                                                        </div>
                                                      ) : (
                                                        <div style={{ textAlign: "center", padding: "40px 0" }}>
                                                          <FileTextOutlined style={{ fontSize: 40, color: "#94a3b8" }} />
                                                          <div style={{ color: "#64748b", marginTop: 12, fontSize: 14 }}>No resume uploaded.</div>
                                                        </div>
                                                      )}
                                                    </Card>
                                                  </>
                                                )}
                                              </>
                                            ) : (
                                              /* RECRUITER SHOWCASE VIEW */
                                              <>
                                                <Card className="profile-card-premium" title="Recruiter Basic Profile">
                                                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px 24px" }}>
                                                    <div className="info-item-box">
                                                      <div className="info-item-icon-wrapper" style={{ background: "rgba(16, 185, 129, 0.08)", color: "#10b981" }}><MailOutlined /></div>
                                                      <div>
                                                        <div className="info-item-label">Corporate Email</div>
                                                        <div className="info-item-value">{selectedUser.email}</div>
                                                      </div>
                                                    </div>
                                                    <div className="info-item-box">
                                                      <div className="info-item-icon-wrapper" style={{ background: "rgba(16, 185, 129, 0.08)", color: "#10b981" }}><PhoneOutlined /></div>
                                                      <div>
                                                        <div className="info-item-label">Contact Phone</div>
                                                        <div className="info-item-value">{selectedUser.phone || "N/A"}</div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </Card>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </Drawer>
                                  )}
      </Layout>
    </Layout>
  );
}


