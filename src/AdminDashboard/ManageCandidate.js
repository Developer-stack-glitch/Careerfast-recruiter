import React, { useEffect, useState } from "react";
import { getImageUrl } from "../utils/getImageUrl";
import {
  Layout,
  Button,
  Table,
  Tag,
  Avatar,
  Input,
  Space,
  Typography,
  Card,
  Select,
  Skeleton,
  Tooltip,
  Drawer,
  message,
} from "antd";
import {
  EnvironmentOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LinkedinOutlined,
  PhoneOutlined,
  UserOutlined,
  CalendarOutlined,
  BankOutlined,
  ApartmentOutlined,
  ExperimentOutlined,
  FieldTimeOutlined,
  FileTextOutlined,
  TrophyOutlined,
  SwapOutlined,
  TagsOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { FaInstagram, FaTwitter } from "react-icons/fa";
import { FaFacebook, FaBehance, FaDribbble } from "react-icons/fa6";
import {
  EyeOutlined,
  MailOutlined,
  SearchOutlined,
  FilterOutlined,
  CheckOutlined,
  StopOutlined,
} from "@ant-design/icons";
import {
  getJobAppliedCandidates,
  getJobPosts,
  getUserJobPostStatus,
  getUserProfile,
  updateUserAppliedJobStatus,
} from "../ApiService/action";
import "../css/AdminDashboard.css";
import "../css/AllRegisteredCandidates.css";
import { useParams } from "@/routing-shim";


const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

export default function ManageCandidate() {
  const [open, setOpen] = useState(false);
  const [drawerActiveTab, setDrawerActiveTab] = useState("overview");
  const [selectedUser, setSelectedUser] = useState(null);
  const [appliedUser, setAppliedUser] = useState([]);
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [viewProfileLoading, setViewProfileLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [jobTitle, setJobTitle] = useState("");
  const [appliedUserId, setAppliedUserId] = useState(null);


  const statusColors = {
    Shortlisted: {
      background: "#f6ffed",
      borderColor: "#b7eb8f",
      color: "#52c41a",
    },
    Rejected: {
      background: "#fff1f0",
      borderColor: "#ffa39e",
      color: "#f5222d",
    },
    "Mail Sent": {
      background: "#e6f4ff",
      borderColor: "#91caff",
      color: "#0958d9",
    },
    Pending: {
      background: "#fffbe6",
      borderColor: "#ffe58f",
      color: "#faad14",
    },
  };


  useEffect(() => {
    const stored = localStorage.getItem("loginDetails");
    if (stored) {
      try {
        const loginDetails = JSON.parse(stored);
        getUserProfileData(loginDetails.id);
      } catch (error) {
        console.error("Invalid JSON in localStorage", error);
      } finally {
        setTimeout(() => {
          getJobPostsData();
        }, 300);
      }
    }
  }, []);

  const getUserProfileData = async (userId) => {
    const payload = {
      user_id: userId,
    };

    try {
      const response = await getUserProfile(payload);
      console.log("getuserprofile", response);
    } catch (error) {
      console.log("getuserprofile error", error);
    }
  };

  useEffect(() => {
    if (id) {
      getJobAppliedCandidatesData();
    }
  }, [id]);

  const getJobAppliedCandidatesData = async () => {
    if (!id) return;
    setLoading(true);

    try {
      const response = await getJobAppliedCandidates({ post_id: id });
      const users = response?.data?.data[0]?.users;

      if (!Array.isArray(users)) {
        setAppliedUser([]);
        setLoading(false);
        return;
      }

      const formattedUsers = await Promise.all(
        users.map(async (user, index) => {
          let latestStatus = "Pending";
          let latestUpdatedAt = null;

          try {
            const statusRes = await getUserJobPostStatus({
              applied_job_id: user.applied_jobs_id,
            });

            const statusList = statusRes?.data?.data;
            if (Array.isArray(statusList) && statusList.length > 0) {
              statusList.sort(
                (a, b) => new Date(b.changed_at) - new Date(a.changed_at)
              );
              latestStatus = statusList[0]?.status || "Pending";
              latestUpdatedAt = statusList[0]?.changed_at || null;
            }
          } catch (err) {
            console.error(`Status fetch failed for user ${user.id}`, err);
          }

          return {
            ...user,
            key: user.id || index,
            name: `${user.first_name} ${user.last_name}`,
            email: user.email,
            college: user.college_name,
            avatarColor: "#1890ff",
            profile_image: user.image || null,
            status: latestStatus, // ✅ correct
            status_updated_at: latestUpdatedAt, // ✅ include updated time
            score: user.score || 0,
          };
        })
      );

      setTimeout(() => {
        setAppliedUser(formattedUsers);
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error("Error fetching applied candidates:", error);
      setTimeout(() => {
        setAppliedUser([]);
        setLoading(false);
      }, 800);
    }
  };

  const handleGetUserProfile = async (userId) => {
    const payload = {
      user_id: userId,
    };


    try {
      const response = await getUserProfile(payload);
      setOpen(true);
      setViewProfileLoading(true);
      setSelectedUser(response?.data?.data || null);
      console.log("User Profile data", response);
      setTimeout(() => {
        setViewProfileLoading(false);
      }, 2000);
    } catch (error) {
      console.log("User Profile data", error);
      setSelectedUser(null);
    }
  };

  const getJobPostsData = async () => {
    const payload = {};
    try {
      const response = await getJobPosts(payload);
      const jobs = response?.data?.data?.data || [];
      if (id) {
        const matchedJob = jobs.find((job) => String(job.id) === String(id));
        setJobTitle(matchedJob ? matchedJob.job_title : "");
      }
    } catch (error) {
      console.log("applied candidate", error);
    } finally {
      getUserJobPostStatusData();
    }
  };

  const getUserJobPostStatusData = async () => {
    const payload = {
      applied_job_id: appliedUserId,
    };
    try {
      const response = await getUserJobPostStatus(payload);
      console.log("getUserJobPostStatus", response);
    } catch (error) {
      console.log("getUserJobPostStatus", error);
    }
  };

  const handleJobStatus = async (status, userId) => {
    // ✅ Map frontend button values to backend values
    const backendStatusMap = {
      Shortlist: "Shortlisted",
      Rejected: "Rejected",
      "Sent Mail": "Mail Sent",
    };

    const finalStatus = backendStatusMap[status] || status;

    const payload = {
      post_id: id,
      user_id: userId,
      status: finalStatus, // ✅ send mapped value to backend
    };

    try {
      const response = await updateUserAppliedJobStatus(payload);
      console.log("updateUserAppliedJobStatus", response);

      const lower = finalStatus.toLowerCase();

      if (lower === "shortlisted") {
        message.success("Candidate Shortlisted Successfully");
      }
      if (lower === "rejected") {
        message.error("Candidate Rejected Successfully");
      }
      if (lower === "mail sent") {
        message.info("Mail Sent Successfully");
      }

      setAppliedUser((prev) =>
        prev.map((user) =>
          user.id === userId
            ? {
              ...user,
              status: finalStatus,
              status_updated_at: new Date().toISOString(),
            }
            : user
        )
      );
    } catch (error) {
      console.log("updateUserAppliedJobStatus", error);
    }
  };


  const filteredUsers = appliedUser.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      user.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      title: <Text type="secondary">#</Text>,
      key: "index",
      width: 50,
      render: (text, record, index) => <Text>{index + 1}</Text>,
    },

    {
      title: <Text type="secondary">CANDIDATE</Text>,
      dataIndex: "name",
      render: (_, record) => (
        <Space>
          <Avatar
            size={48}
            src={record.image}
            style={{ marginRight: 12, border: "none" }}
            icon={!record.profile_image && <UserOutlined />}
          />

          <div>
            <div style={{ fontWeight: 600 }}>{record.name}</div>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {record.email}
            </Text>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.college}
              </Text>
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: <Text type="secondary">CANDIDATE STATUS</Text>,
      dataIndex: "status",
      render: (status, record) => {
        const currentStatus = status || "Pending";
        const colors = statusColors[currentStatus] || statusColors["Pending"];

        const updatedAt = record.status_updated_at
          ? new Date(record.status_updated_at).toLocaleString()
          : "Status not updated yet";

        return (
          <Tooltip title={`Last updated: ${updatedAt}`}>
            <Tag
              style={{
                fontWeight: 500,
                borderRadius: 6,
                background: colors.background,
                borderColor: colors.borderColor,
                color: colors.color,
              }}
            >
              {currentStatus}
            </Tag>
          </Tooltip>
        );
      },
    }

    ,

    {
      title: <Text type="secondary">REG STATUS</Text>,
      key: "regStatus",
      render: (text, record) => {
        const lowerStatus = record.status?.toLowerCase();

        return (
          <Space>
            {/* Shortlist */}
            <Tooltip title="Shortlist">
              <Button
                onClick={() => handleJobStatus("Shortlisted", record.id)}
                shape="circle"
                icon={<CheckOutlined />}
                disabled={lowerStatus === "rejected" || lowerStatus === "mail sent"}
                style={{
                  border: "none",
                  background:
                    record.status === "Shortlisted"
                      ? statusColors["Shortlisted"].color
                      : "#f0f0f0",
                  color:
                    record.status === "Shortlisted"
                      ? "#fff"
                      : statusColors["Shortlisted"].color,
                }}
              />
            </Tooltip>

            {/* Reject */}
            <Tooltip title="Reject">
              <Button
                onClick={() => handleJobStatus("Rejected", record.id)}
                shape="circle"
                icon={<StopOutlined />}
                disabled={lowerStatus === "shortlisted" || lowerStatus === "mail sent"}
                style={{
                  border: "none",
                  background:
                    record.status === "Rejected"
                      ? statusColors["Rejected"].color
                      : "#f0f0f0",
                  color:
                    record.status === "Rejected"
                      ? "#fff"
                      : statusColors["Rejected"].color,
                }}
              />
            </Tooltip>

            {/* Send Email */}
            <Tooltip title="Send Email">
              <Button
                onClick={() => handleJobStatus("Mail Sent", record.id)}
                shape="circle"
                icon={<MailOutlined />}
                disabled={lowerStatus === "rejected" || lowerStatus === "shortlisted"}
                style={{
                  border: "none",
                  background:
                    record.status === "Mail Sent"
                      ? statusColors["Mail Sent"].color
                      : "#f0f0f0",
                  color:
                    record.status === "Mail Sent"
                      ? "#fff"
                      : statusColors["Mail Sent"].color,
                }}
              />
            </Tooltip>
          </Space>
        );
      },

    }
    ,
    {
      title: <Text type="secondary">ACTION</Text>,
      dataIndex: "score",
      render: (_, record) => (
        <div style={{ position: "relative" }}>
          <Text style={{ cursor: "pointer" }} onClick={() => handleGetUserProfile(record.id)} strong><EyeOutlined /> View Profile</Text>
        </div>
      ),
    },
  ];

  return (
    <Layout
      className="manage-can"
      style={{
        minHeight: "100vh",
        margin: 0,
        padding: 0,
        background: "#f5f7fa",
      }}
    >
      {/* Main Content */}
      <Layout style={{ padding: 20 }}>
        {loading ? (
          <Skeleton paragraph={{ rows: 1 }} />
        ) : (
          <Header
            style={{
              borderRadius: 12,
              background: "#fff",
              padding: "0 32px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
              zIndex: 1,
            }}
          >
            <Title level={4} style={{ margin: 0 }}>
              <b style={{ color: "#5f2eea", fontWeight: 700 }}>{jobTitle}</b> |
              All Registrations
            </Title>
          </Header>
        )}

        <Content style={{ margin: "24px", padding: 0 }}>
          <Card
            style={{ borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 24,
              }}
            >
              <Space>
                <Input
                  size="large"
                  placeholder="Search candidates..."
                  prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                  style={{ width: 320 }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Select
                  size="large"
                  placeholder="Filter Status"
                  suffixIcon={<FilterOutlined style={{ color: "#706f6fff" }} />}
                  style={{
                    width: 160,
                    background: "#E9E0FE",
                    color: "#5f2eea",
                    padding: "0px 5px 0px 10px",
                    borderRadius: "6px",
                  }}
                  value={statusFilter}
                  onChange={(value) => setStatusFilter(value)}
                >
                  <Option value="all">All Status</Option>
                  <Option value="pending">Pending</Option>
                  <Option value="shortlisted">Shortlisted</Option>
                  <Option value="rejected">Rejected</Option>
                  <Option value="mail sent">Sent Mail</Option>
                </Select>
              </Space>
            </div>

            {loading ? (
              <Skeleton
                avatar={{ size: "large", shape: "circle" }}
                active
                paragraph={{ rows: 5 }}
                title={false}
                style={{ padding: "24px 0" }}
              />
            ) : (
              <Table
                columns={columns}
                dataSource={filteredUsers}
                pagination={{
                  position: ["bottomRight"],
                  showSizeChanger: true,
                  pageSizeOptions: ["10", "20", "50"],
                }}
                rowSelection={{
                  type: "checkbox",
                  columnWidth: 48,
                }}
                style={{
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              />
            )}
          </Card>
        </Content>
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
                    border: "1px solid #fff",
                    background: selectedUser?.role_name === "RECRUITER" ? "#10b981" : "#fff"
                  }}
                />
                <span style={{ fontWeight: 600, color: "#0f172a", fontSize: 16 }}>
                  {selectedUser?.role_name === "RECRUITER" ? "Employer Profile" : "Candidate Profile"}
                </span>
              </Space>
            }
            placement="right"
            open={open}
            loading={viewProfileLoading}
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
