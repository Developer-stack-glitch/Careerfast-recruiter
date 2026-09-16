'use client';

import { getImageUrl } from "../utils/getImageUrl";
import React, { useEffect, useState } from "react";
import {
    Layout,
    Table,
    Tag,
    Avatar,
    Input,
    Space,
    Typography,
    Card,
    Dropdown,
    Button,
    Skeleton,
    Select,
    Drawer,
    message,
    Badge,
    Statistic,
    Slider,
} from "antd";
import {
    UserOutlined,
    EyeOutlined,
    MailOutlined,
    MoreOutlined,
    CalendarOutlined,
    BankOutlined,
    FieldTimeOutlined,
    TrophyOutlined,
    DownloadOutlined,
    PhoneOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    EnvironmentOutlined,
    FileTextOutlined,
    TagsOutlined,
    LinkedinOutlined,
    ApartmentOutlined,
    ExperimentOutlined,
    SwapOutlined,
    SearchOutlined,
    TeamOutlined,
    DownOutlined,
    ReloadOutlined,
    GlobalOutlined
} from "@ant-design/icons";

// ✅ Import APIs
import { getUsers, getUserProfile } from "../ApiService/action";
import { FaBehance, FaDribbble, FaFacebook, FaInstagram, FaTwitter } from "react-icons/fa6";
import Footer from "../Footer/Footer";
import Header from "../Header/Header";
import "../css/AllRegisteredCandidates.css";
import "../css/AdminDashboard.css";

const { Content } = Layout;
const { Title, Text } = Typography;

export default function AllRegisteredCandidates() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeRole, setActiveRole] = useState("candidate"); // "candidate" or "recruiter"

    // Search and Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [userTypeFilter, setUserTypeFilter] = useState("all");
    const [experienceRange, setExperienceRange] = useState([0, 10]);
    const [orgTypeFilter, setOrgTypeFilter] = useState("all");
    const [verificationFilter, setVerificationFilter] = useState("all");

    // Profile Drawer States
    const [open, setOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [viewProfileLoading, setViewProfileLoading] = useState(false);
    const [drawerActiveTab, setDrawerActiveTab] = useState("overview"); // "overview", "edu_exp", "projects"

    useEffect(() => {
        getUserData();
    }, []);

    // ✅ Fetch real users and format them
    const getUserData = async () => {
        setLoading(true);
        try {
            const response = await getUsers();
            console.log("getusers response:", response);
            const data = response?.data?.data || response?.data || [];

            const formattedUsers = data.map((user, index) => ({
                ...user,
                key: user.id || index,
                name: `${user.first_name || ""} ${user.last_name || ""}`,
                email: user.email,
                college: user.college_name || "N/A",
                status: user.status || "Pending",
                score: user.score || 0,
                joinDate: user.created_at || "2024-01-01",
            }));

            setUsers(formattedUsers);
        } catch (error) {
            console.error("getUsers error:", error);
            message.error("Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };

    // ✅ Fetch single profile details for the drawer
    const handleGetUserProfile = async (userId) => {
        try {
            setViewProfileLoading(true);
            setDrawerActiveTab("overview");
            const response = await getUserProfile({ user_id: userId });
            setSelectedUser(response?.data?.data || response?.data || null);
            setOpen(true);
        } catch (error) {
            console.error("User Profile error:", error);
            message.error("Failed to load profile");
            setSelectedUser(null);
        } finally {
            setViewProfileLoading(false);
        }
    };

    // Reset filters
    const handleResetFilters = () => {
        setSearchTerm("");
        setStatusFilter("all");
        setUserTypeFilter("all");
        setExperienceRange([0, 10]);
        setOrgTypeFilter("all");
        setVerificationFilter("all");
    };

    // Separate Candidates and Recruiters
    const candidates = users.filter(u => u.role_name === "CANDIDATE" || !u.role_name);
    const recruiters = users.filter(u => u.role_name === "RECRUITER");

    // Dynamic list of recruiter organization types
    const orgTypes = Array.from(new Set(recruiters.map(r => r.organization_type).filter(Boolean)));

    // Filter Logic
    const filteredCandidates = candidates.filter((user) => {
        const matchesSearch =
            !searchTerm ||
            (user.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.phone?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.skills?.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase())));

        const matchesStatus =
            statusFilter === "all" ||
            user.status?.toLowerCase() === statusFilter.toLowerCase();

        const matchesUserType =
            userTypeFilter === "all" ||
            (user.user_type && user.user_type.toLowerCase() === userTypeFilter.toLowerCase());

        const matchesExperience = (() => {
            const yearMatch = String(user.total_years || "0").match(/\d+/);
            const monthMatch = String(user.total_months || "0").match(/\d+/);

            const years = yearMatch ? parseInt(yearMatch[0], 10) : 0;
            const months = monthMatch ? parseInt(monthMatch[0], 10) : 0;
            const totalExperience = years + months / 12;

            return totalExperience >= experienceRange[0] && totalExperience <= experienceRange[1];
        })();

        const matchesVerification =
            verificationFilter === "all" ||
            (verificationFilter === "verified" && (user.is_email_verified === 1 || user.is_email_verified === true)) ||
            (verificationFilter === "unverified" && (user.is_email_verified === 0 || user.is_email_verified === false));

        return matchesSearch && matchesStatus && matchesUserType && matchesExperience && matchesVerification;
    });

    const filteredRecruiters = recruiters.filter((user) => {
        const matchesSearch =
            !searchTerm ||
            (user.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.phone?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.organization?.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesOrgType =
            orgTypeFilter === "all" ||
            user.organization_type === orgTypeFilter;

        const matchesVerification =
            verificationFilter === "all" ||
            (verificationFilter === "verified" && (user.is_email_verified === 1 || user.is_email_verified === true)) ||
            (verificationFilter === "unverified" && (user.is_email_verified === 0 || user.is_email_verified === false));

        return matchesSearch && matchesOrgType && matchesVerification;
    });

    // Dynamic Statistics calculation
    const candidateStats = {
        total: candidates.length,
        verified: candidates.filter(u => u.is_email_verified === 1 || u.is_email_verified === true).length,
        professionals: candidates.filter(u => u.user_type === "Professional").length,
        students: candidates.filter(u => u.user_type === "College Student" || u.user_type === "School Student" || u.user_type === "Fresher").length
    };

    const recruiterStats = {
        total: recruiters.length,
        verified: recruiters.filter(u => u.is_email_verified === 1 || u.is_email_verified === true).length,
        companies: new Set(recruiters.map(r => r.organization).filter(Boolean)).size,
        corporates: recruiters.filter(u => u.organization_type?.toLowerCase() === "corporate" || u.organization_type?.toLowerCase() === "company").length
    };

    // Columns Configuration
    const candidateColumns = [
        {
            title: "#",
            key: "index",
            width: 60,
            render: (_, __, index) => <span style={{ color: "#64748b", fontWeight: 600 }}>{index + 1}</span>,
        },
        {
            title: "CANDIDATE DETAILS",
            key: "candidate",
            render: (_, record) => {
                const initials = record.first_name && record.last_name
                    ? `${record.first_name[0]}${record.last_name[0]}`.toUpperCase()
                    : "C";
                return (
                    <Space size={16} align="center">
                        <Badge
                            dot
                            color={record.is_email_verified === 1 || record.is_email_verified === true ? "#10b981" : "#f59e0b"}
                            offset={[-4, 42]}
                        >
                            <Avatar
                                size={52}
                                src={getImageUrl(record.profile_image)}
                                style={{
                                    border: "3px solid rgb(241, 245, 249)",
                                    boxShadow: "rgba(0, 0, 0, 0.06) 0px 4px 10px",
                                    fontWeight: 700,
                                }}
                            >
                                {initials}
                            </Avatar>
                        </Badge>
                        <div>
                            <div className="candidate-name-cell" style={{ cursor: "pointer" }} onClick={() => handleGetUserProfile(record.id)}>
                                {record.name}
                            </div>
                            <div style={{ fontSize: 13, color: "#64748b", display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                                <MailOutlined style={{ fontSize: 11 }} />
                                <span>{record.email}</span>
                            </div>
                            <div style={{ fontSize: 12, color: "#94a3b8", display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                                <PhoneOutlined style={{ fontSize: 10 }} />
                                <span>{record.phone_code ? `${record.phone_code} ` : ""}{record.phone}</span>
                            </div>
                        </div>
                    </Space >
                );
            },
        },
        {
            title: "PROFILE & TYPE",
            key: "user_type",
            render: (_, record) => {
                const userTypeClass = {
                    "Professional": "badge-professional",
                    "Fresher": "badge-fresher",
                    "College Student": "badge-college",
                    "School Student": "badge-school",
                }[record.user_type] || "badge-generic";

                const displayType = {
                    "Professional": "Professional",
                    "Fresher": "Graduated Fresher",
                    "College Student": "College Student",
                    "School Student": "School Student",
                }[record.user_type] || record.user_type || "N/A";

                return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <div>
                            <span className={`badge-type-pill ${userTypeClass}`}>
                                {displayType}
                            </span>
                        </div>
                        {record.user_type !== "Professional" && (
                            <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500, paddingLeft: 6 }}>
                                {record.course || record.class || "N/A"}
                            </span>
                        )}
                    </div>
                );
            }
        },
        {
            title: "KEY SKILLS",
            dataIndex: "skills",
            key: "skills",
            render: (skills) => {
                if (!skills || skills.length === 0) {
                    return <span style={{ color: "#94a3b8", fontStyle: "italic", fontSize: 13 }}>No skills listed</span>;
                }
                const displaySkills = skills.slice(0, 3);
                const extraCount = skills.length - 3;
                return (
                    <div className="skills-pill-container" style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {displaySkills.map((skill, idx) => {
                            const isLong = skill.length > 25;
                            const displayVal = isLong ? skill.substring(0, 22) + "..." : skill;
                            return (
                                <Tag
                                    key={idx}
                                    className="skill-tag-light"
                                    title={skill}
                                    style={{
                                        maxWidth: 180,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        verticalAlign: "middle",
                                        margin: 0
                                    }}
                                >
                                    {displayVal}
                                </Tag>
                            );
                        })}
                        {extraCount > 0 && (
                            <Tag className="skill-tag-light" style={{ background: "#e2e8f0", color: "#4f46e5", verticalAlign: "middle", margin: 0 }}>+{extraCount} more</Tag>
                        )}
                    </div>
                );
            }
        },
        {
            title: "EXPERIENCE LEVEL",
            key: "experience",
            render: (_, record) => {
                const isExperienced = record.experince_type === "Experience";
                return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontWeight: 700, color: "#334155", fontSize: 14 }}>
                            {isExperienced ? "Experienced" : "Fresher"}
                        </span>
                        {isExperienced && (
                            <span style={{ fontSize: 12, color: "#64748b" }}>
                                {record.total_years || "0 Years"} {record.total_months || "0 Months"}
                            </span>
                        )}
                    </div>
                );
            }
        },
        {
            title: "VERIFICATION",
            key: "verification",
            render: (_, record) => {
                const isVerified = record.is_email_verified === 1 || record.is_email_verified === true;
                return (
                    <Tag
                        icon={isVerified ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
                        color={isVerified ? "success" : "warning"}
                        style={{ borderRadius: 20, fontWeight: 600, padding: "2px 10px" }}
                    >
                        {isVerified ? "Email Verified" : "Unverified"}
                    </Tag>
                );
            }
        },
        {
            title: "",
            key: "action",
            width: 80,
            render: (_, record) => (
                <Dropdown
                    menu={{
                        items: [
                            {
                                key: "view",
                                icon: <EyeOutlined />,
                                label: "View Full Profile",
                                onClick: () => handleGetUserProfile(record.id),
                            },
                            {
                                key: "email",
                                icon: <MailOutlined />,
                                label: "Send Direct Email",
                                onClick: () => window.location.href = `mailto:${record.email}`,
                            },
                            {
                                key: "download",
                                icon: <DownloadOutlined />,
                                label: "Download CV",
                                disabled: !record.resume,
                                onClick: () => record.resume && window.open(getImageUrl(record.resume)),
                            },
                        ],
                    }}
                    placement="bottomRight"
                >
                    <Button
                        shape="circle"
                        icon={<MoreOutlined />}
                        style={{
                            border: "1px solid #e2e8f0",
                            background: "#fff",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                        }}
                    />
                </Dropdown>
            ),
        },
    ];

    const recruiterColumns = [
        {
            title: "#",
            key: "index",
            width: 60,
            render: (_, __, index) => <span style={{ color: "#64748b", fontWeight: 600 }}>{index + 1}</span>,
        },
        {
            title: "RECRUITER DETAILS",
            key: "recruiter",
            render: (_, record) => {
                const initials = record.first_name && record.last_name
                    ? `${record.first_name[0]}${record.last_name[0]}`.toUpperCase()
                    : "R";
                return (
                    <Space size={16} align="center">
                        <Badge
                            dot
                            color={record.is_email_verified === 1 || record.is_email_verified === true ? "#10b981" : "#f59e0b"}
                            offset={[-4, 42]}
                        >
                            <Avatar
                                size={52}
                                src={getImageUrl(record.profile_image)}
                                style={{
                                    border: "3px solid #f1f5f9",
                                    boxShadow: "0 4px 10px rgba(0,0,0,0.06)",
                                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                    fontWeight: 700,
                                }}
                            >
                                {initials}
                            </Avatar>
                        </Badge>
                        <div>
                            <div className="candidate-name-cell" style={{ cursor: "pointer" }} onClick={() => handleGetUserProfile(record.id)}>
                                {record.name}
                            </div>
                            <div style={{ fontSize: 13, color: "#64748b", display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                                <MailOutlined style={{ fontSize: 11 }} />
                                <span>{record.email}</span>
                            </div>
                            <div style={{ fontSize: 12, color: "#94a3b8", display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                                <PhoneOutlined style={{ fontSize: 10 }} />
                                <span>{record.phone_code ? `${record.phone_code} ` : ""}{record.phone}</span>
                            </div>
                        </div>
                    </Space>
                );
            },
        },
        {
            title: "COMPANY / ORGANIZATION",
            key: "organization",
            render: (_, record) => (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontWeight: 700, color: "#1e293b", fontSize: 15 }}>
                        {record.organization || "Independent Recruiter"}
                    </span>
                    {record.organization_type && (
                        <div>
                            <Tag color="cyan" style={{ borderRadius: 10, fontWeight: 600, border: "none", padding: "1px 8px" }}>
                                {record.organization_type}
                            </Tag>
                        </div>
                    )}
                </div>
            ),
        },
        {
            title: "SIGNUP DATE",
            key: "created_date",
            render: (_, record) => {
                const date = new Date(record.joinDate);
                const formatted = !isNaN(date.getTime())
                    ? date.toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })
                    : "N/A";
                return (
                    <Space style={{ color: "#475569", fontWeight: 500 }}>
                        <CalendarOutlined style={{ color: "#6366f1" }} />
                        <span>{formatted}</span>
                    </Space>
                );
            }
        },
        {
            title: "VERIFICATION",
            key: "verification",
            render: (_, record) => {
                const isVerified = record.is_email_verified === 1 || record.is_email_verified === true;
                return (
                    <Tag
                        icon={isVerified ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
                        color={isVerified ? "success" : "warning"}
                        style={{ borderRadius: 20, fontWeight: 600, padding: "2px 10px" }}
                    >
                        {isVerified ? "Email Verified" : "Unverified"}
                    </Tag>
                );
            }
        },
        {
            title: "",
            key: "action",
            width: 80,
            render: (_, record) => (
                <Dropdown
                    menu={{
                        items: [
                            {
                                key: "view",
                                icon: <EyeOutlined />,
                                label: "View Recruiter Details",
                                onClick: () => handleGetUserProfile(record.id),
                            },
                            {
                                key: "email",
                                icon: <MailOutlined />,
                                label: "Send Corporate Email",
                                onClick: () => window.location.href = `mailto:${record.email}`,
                            },
                        ],
                    }}
                    placement="bottomRight"
                >
                    <Button
                        shape="circle"
                        icon={<MoreOutlined />}
                        style={{
                            border: "1px solid #e2e8f0",
                            background: "#fff",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                        }}
                    />
                </Dropdown>
            ),
        },
    ];

    return (
        <>
            <Header />
            <Layout style={{ minHeight: "100vh", background: "#f8fafc" }}>
                <Layout className="candidates-main-layout">
                    {/* Glassmorphic Header Card */}
                    <div className="candidates-header-container">
                        <div style={{ display: "grid" }}>
                            <div>
                                <span className="directory-badge">Directory Portal</span>
                            </div>
                            <Title level={2} style={{ margin: 0, color: "#0f172a", fontWeight: 600, letterSpacing: "-0.5px" }}>
                                Directory Network
                            </Title>
                            <Text style={{ fontSize: 15, color: "#64748b", marginTop: 4, display: "block" }}>
                                View, filter, and inspect registered candidates and hiring employers in real-time.
                            </Text>
                        </div>

                        {/* Interactive Slide Control Tab Switcher */}
                        <div className="directory-tabs-wrapper">
                            <button
                                className={`directory-tab ${activeRole === "candidate" ? "active" : ""}`}
                                onClick={() => {
                                    setActiveRole("candidate");
                                    handleResetFilters();
                                }}
                            >
                                <TeamOutlined /> Candidates
                            </button>
                            <button
                                className={`directory-tab ${activeRole === "recruiter" ? "active" : ""}`}
                                onClick={() => {
                                    setActiveRole("recruiter");
                                    handleResetFilters();
                                }}
                            >
                                <BankOutlined /> Recruiters
                            </button>
                            <div
                                className="directory-tab-indicator"
                                style={{
                                    left: activeRole === "candidate" ? "6px" : "138px",
                                    width: activeRole === "candidate" ? "126px" : "122px",
                                }}
                            />
                        </div>
                    </div>

                    {/* Animated Statistics Grid */}
                    {activeRole === "candidate" ? (
                        <div className="candidates-stats-grid">
                            <Card className="stat-card-glass">
                                <div className="stat-card-icon" style={{ background: "rgba(99, 102, 241, 0.08)", color: "#6366f1" }}>
                                    <TeamOutlined />
                                </div>
                                <div className="stat-card-label">Total Candidates</div>
                                <div className="stat-card-value">{candidateStats.total}</div>
                            </Card>
                            <Card className="stat-card-glass">
                                <div className="stat-card-icon" style={{ background: "rgba(16, 185, 129, 0.08)", color: "#10b981" }}>
                                    <CheckCircleOutlined />
                                </div>
                                <div className="stat-card-label">Verified Candidates</div>
                                <div className="stat-card-value">{candidateStats.verified}</div>
                            </Card>
                            <Card className="stat-card-glass">
                                <div className="stat-card-icon" style={{ background: "rgba(59, 130, 246, 0.08)", color: "#3b82f6" }}>
                                    <ExperimentOutlined />
                                </div>
                                <div className="stat-card-label">Professionals</div>
                                <div className="stat-card-value">{candidateStats.professionals}</div>
                            </Card>
                            <Card className="stat-card-glass">
                                <div className="stat-card-icon" style={{ background: "rgba(139, 92, 246, 0.08)", color: "#8b5cf6" }}>
                                    <TrophyOutlined />
                                </div>
                                <div className="stat-card-label">Freshers & Students</div>
                                <div className="stat-card-value">{candidateStats.students}</div>
                            </Card>
                        </div>
                    ) : (
                        <div className="candidates-stats-grid">
                            <Card className="stat-card-glass">
                                <div className="stat-card-icon" style={{ background: "rgba(16, 185, 129, 0.08)", color: "#10b981" }}>
                                    <BankOutlined />
                                </div>
                                <div className="stat-card-label">Total Recruiters</div>
                                <div className="stat-card-value">{recruiterStats.total}</div>
                            </Card>
                            <Card className="stat-card-glass">
                                <div className="stat-card-icon" style={{ background: "rgba(99, 102, 241, 0.08)", color: "#6366f1" }}>
                                    <GlobalOutlined />
                                </div>
                                <div className="stat-card-label">Hiring Companies</div>
                                <div className="stat-card-value">{recruiterStats.companies}</div>
                            </Card>
                            <Card className="stat-card-glass">
                                <div className="stat-card-icon" style={{ background: "rgba(245, 158, 11, 0.08)", color: "#f59e0b" }}>
                                    <CheckCircleOutlined />
                                </div>
                                <div className="stat-card-label">Verified Partners</div>
                                <div className="stat-card-value">{recruiterStats.verified}</div>
                            </Card>
                            <Card className="stat-card-glass">
                                <div className="stat-card-icon" style={{ background: "rgba(139, 92, 246, 0.08)", color: "#8b5cf6" }}>
                                    <ApartmentOutlined />
                                </div>
                                <div className="stat-card-label">Corporate Partners</div>
                                <div className="stat-card-value">{recruiterStats.corporates}</div>
                            </Card>
                        </div>
                    )}

                    <Content>
                        {/* Glassmorphic Filtering Bar */}
                        <div className="candidates-filter-premium">
                            <div className="candidates-search-container">
                                <Input
                                    className="candidates-search-input"
                                    prefix={<SearchOutlined style={{ color: "#6366f1", fontSize: 16 }} />}
                                    placeholder={
                                        activeRole === "candidate"
                                            ? "Search candidates by name, email, phone, skills..."
                                            : "Search recruiters by name, email, phone, company..."
                                    }
                                    allowClear
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="filter-controls-group">
                                {/* Conditional Filtering Controls based on Active Tab */}
                                {activeRole === "candidate" ? (
                                    <>
                                        {/* Slider experience card */}
                                        <div className="premium-slider-card">
                                            <span className="slider-label">
                                                Exp: <b>{experienceRange[0]}–{experienceRange[1]} yrs</b>
                                            </span>
                                            <Slider
                                                range
                                                step={0.5}
                                                min={0}
                                                max={10}
                                                value={experienceRange}
                                                onChange={setExperienceRange}
                                                style={{ flex: 1, margin: "0 0 0 14px" }}
                                                trackStyle={[{ backgroundColor: "#6366f1", height: 5 }]}
                                                handleStyle={[
                                                    { borderColor: "#6366f1", backgroundColor: "#fff", boxShadow: "none" },
                                                    { borderColor: "#6366f1", backgroundColor: "#fff", boxShadow: "none" },
                                                ]}
                                            />
                                        </div>

                                        {/* User Type select */}
                                        <Select
                                            value={userTypeFilter}
                                            onChange={setUserTypeFilter}
                                            className="filter-select-box"
                                            style={{ width: 180 }}
                                            options={[
                                                { value: "all", label: "All User Types" },
                                                { value: "College Student", label: "🎓 College Student" },
                                                { value: "Fresher", label: "📚 Graduated Fresher" },
                                                { value: "Professional", label: "💼 Professional" },
                                                { value: "School Student", label: "📖 School Student" },
                                            ]}
                                        />
                                    </>
                                ) : (
                                    <>
                                        {/* Organization Type Select for Recruiters */}
                                        <Select
                                            value={orgTypeFilter}
                                            onChange={setOrgTypeFilter}
                                            className="filter-select-box"
                                            style={{ width: 220 }}
                                            placeholder="Organization Type"
                                            options={[
                                                { value: "all", label: "All Organizations" },
                                                ...orgTypes.map(type => ({ value: type, label: `🏢 ${type}` }))
                                            ]}
                                        />
                                    </>
                                )}

                                {/* Verification filter */}
                                <Select
                                    value={verificationFilter}
                                    onChange={setVerificationFilter}
                                    className="filter-select-box"
                                    style={{ width: 170 }}
                                    options={[
                                        { value: "all", label: "All Verifications" },
                                        { value: "verified", label: "Verified Only" },
                                        { value: "unverified", label: "Unverified" },
                                    ]}
                                />

                                {/* Modern Reset button */}
                                <Button
                                    className="premium-reset-btn"
                                    onClick={handleResetFilters}
                                    icon={<ReloadOutlined />}
                                >
                                    Reset Filters
                                </Button>
                            </div>
                        </div>

                        {/* Directory Listing Table Card */}
                        <Card
                            style={{
                                borderRadius: 24,
                                background: "#ffffff",
                                border: "1px solid #e2e8f0",
                                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.02)",
                                padding: "8px",
                            }}
                        >
                            {loading ? (
                                <div style={{ padding: "40px" }}>
                                    <Skeleton active avatar paragraph={{ rows: 8 }} />
                                </div>
                            ) : (
                                <Table
                                    columns={activeRole === "candidate" ? candidateColumns : recruiterColumns}
                                    dataSource={activeRole === "candidate" ? filteredCandidates : filteredRecruiters}
                                    scroll={{ x: 'max-content' }}
                                    pagination={{
                                        position: ["bottomRight"],
                                        showSizeChanger: true,
                                        pageSizeOptions: ["10", "20", "50"],
                                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} results`,
                                        style: { marginTop: 24, paddingRight: 16 },
                                    }}
                                    rowSelection={{ type: "checkbox", columnWidth: 48 }}
                                />
                            )}
                        </Card>
                    </Content>

                    {/* Premium Sliding Glassmorphism Profile Drawer */}
                    {selectedUser && (
                        <Drawer
                            className="userDetails_drawer"
                            closable
                            width={window.innerWidth < 992 ? "100%" : 850}
                            title={
                                <Space size={12}>
                                    <Avatar
                                        size={36}
                                        src={getImageUrl(selectedUser.profile_image)}
                                        style={{
                                            marginLeft: "20px",
                                            border: "2px solid #6366f1",
                                            background: selectedUser.role_name === "RECRUITER" ? "#10b981" : "#6366f1"
                                        }}
                                    />
                                    <span style={{ fontWeight: 600, color: "#0f172a", fontSize: 16 }}>
                                        {selectedUser.role_name === "RECRUITER" ? "Employer Profile" : "Candidate Profile"}
                                    </span>
                                </Space>
                            }
                            placement="right"
                            open={open}
                            loading={viewProfileLoading}
                            onClose={() => setOpen(false)}
                        >
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
                                                            <div className="info-item-label">Telephone</div>
                                                            <div className="info-item-value">{selectedUser.phone_code ? `${selectedUser.phone_code} ` : ""}{selectedUser.phone || "N/A"}</div>
                                                        </div>
                                                    </div>
                                                    <div className="info-item-box">
                                                        <div className="info-item-icon-wrapper" style={{ background: "rgba(16, 185, 129, 0.08)", color: "#10b981" }}><UserOutlined /></div>
                                                        <div>
                                                            <div className="info-item-label">Gender</div>
                                                            <div className="info-item-value">{selectedUser.gender || "N/A"}</div>
                                                        </div>
                                                    </div>
                                                    <div className="info-item-box">
                                                        <div className="info-item-icon-wrapper" style={{ background: "rgba(16, 185, 129, 0.08)", color: "#10b981" }}><CalendarOutlined /></div>
                                                        <div>
                                                            <div className="info-item-label">Registered Date</div>
                                                            <div className="info-item-value">{new Date(selectedUser.created_date).toLocaleDateString()}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>

                                            <Card className="profile-card-premium" title="Employer & Company Details">
                                                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px 24px" }}>
                                                    <div className="info-item-box">
                                                        <div className="info-item-icon-wrapper" style={{ background: "rgba(139, 92, 246, 0.08)", color: "#8b5cf6" }}><BankOutlined /></div>
                                                        <div>
                                                            <div className="info-item-label">Company Name</div>
                                                            <div className="info-item-value">{selectedUser.organization || "Independent Recruiter"}</div>
                                                        </div>
                                                    </div>
                                                    <div className="info-item-box">
                                                        <div className="info-item-icon-wrapper" style={{ background: "rgba(139, 92, 246, 0.08)", color: "#8b5cf6" }}><ApartmentOutlined /></div>
                                                        <div>
                                                            <div className="info-item-label">Organization Type</div>
                                                            <div className="info-item-value">{selectedUser.organization_type || "Not Specified"}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>

                                            {selectedUser.about && (
                                                <Card className="profile-card-premium" title="Recruiter Statement / Bio">
                                                    <p style={{ color: "#475569", fontSize: 14, lineHeight: "1.6", margin: 0 }}>
                                                        {selectedUser.about}
                                                    </p>
                                                </Card>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </Drawer>
                    )}
                </Layout>
            </Layout>
            <Footer />
        </>
    );
}
