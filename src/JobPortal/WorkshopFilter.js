'use client';
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import SEO from "../Components/SEO/SEO";
import {
  getAllWorkshops,
  getUserProfile,
  registerForWorkshop,
  checkIsRegisteredWorkshop,
} from "../ApiService/action";
import "../css/RegisterPage.css";
import {
  Card,
  Row,
  Col,
  Select,
  Tag,
  Space,
  Button,
  Empty,
  Divider,
  Typography,
  message,
  Spin,
  DatePicker,
} from "antd";
import {
  EnvironmentOutlined,
  CheckCircleFilled,
  UserOutlined,
  LoadingOutlined,
  GlobalOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
  DownOutlined,
} from "@ant-design/icons";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import { FaRegBuilding } from "react-icons/fa6";
import { FcCancel } from "react-icons/fc";

const { Option } = Select;
const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

export default function WorkshopFilter() {
  const [workshops, setWorkshops] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState([]);
  const [modeFilter, setModeFilter] = useState("");
  const [loadingRegister, setLoadingRegister] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [locationFilter, setLocationFilter] = useState("");
  const [dateFilter, setDateFilter] = useState(null);
  const [sortBy, setSortBy] = useState("");
  const [teamSizeFilter, setTeamSizeFilter] = useState("");

  // ✅ Fetch all workshops
  useEffect(() => {
    fetchWorkshops();
  }, []);

  const fetchWorkshops = async () => {
    try {
      setLoading(true);
      const response = await getAllWorkshops();
      const data = response?.data?.data || [];

      // Add calculated "daysLeft" property
      const withDays = data.map((w) => {
        const now = new Date();
        const end = w.endDate ? new Date(w.endDate) : now;
        const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
        return {
          ...w,
          daysLeft: diff > 0 ? diff : 0,
        };
      });

      setWorkshops(withDays);
      setFiltered(withDays);
      if (withDays.length) setSelectedWorkshop(withDays[0]);
    } catch (err) {
      console.error("❌ Error fetching workshops:", err);
      message.error("Failed to load workshops.");
    }
    finally {
      setLoading(false)
    }
  };

  // ✅ Check if user is already registered
  useEffect(() => {
    const checkRegistration = async () => {
      try {
        const stored = localStorage.getItem("loginDetails");
        if (!stored || !selectedWorkshop) return;
        const user = JSON.parse(stored);

        const res = await checkIsRegisteredWorkshop(user.id, selectedWorkshop.id);
        setIsRegistered(res?.data?.registered || false);
      } catch (err) {
        console.error("Error checking registration:", err);
      }
    };

    checkRegistration();
  }, [selectedWorkshop]);

  // ✅ Filter by category & mode
  useEffect(() => {
    let result = [...workshops];

    // ✅ Category filter
    if (categoryFilter.length > 0) {
      result = result.filter((w) => {
        const cats = Array.isArray(w.category)
          ? w.category
          : w.category?.split(",").map((c) => c.trim().toLowerCase());
        return cats?.some((c) =>
          categoryFilter.map((f) => f.toLowerCase()).includes(c)
        );
      });
    }

    // ✅ Mode filter
    if (modeFilter)
      result = result.filter(
        (w) => w.mode?.toLowerCase() === modeFilter.toLowerCase()
      );

    // ✅ Team size filter
    if (teamSizeFilter) {
      result = result.filter((w) => {
        if (teamSizeFilter === "Individual") return w.participationType === "Individual";
        if (teamSizeFilter === "Team-2") return w.memberLimit === 2;
        if (teamSizeFilter === "Team-2plus") return w.memberLimit > 2;
        return true;
      });
    }

    // ✅ Location filter
    if (locationFilter)
      result = result.filter((w) =>
        w.venue?.toLowerCase().includes(locationFilter.toLowerCase())
      );

    // ✅ Date range filter (overlap logic)
    if (dateFilter) {
      result = result.filter((w) => {
        const start = w.startDate ? new Date(w.startDate) : null;
        const end = w.endDate ? new Date(w.endDate) : null;
        if (!start || !end) return false;
        return start <= dateFilter.end && end >= dateFilter.start;
      });
    }

    // ✅ Sorting
    if (sortBy === "daysAsc") {
      result.sort((a, b) => {
        const aDays = parseInt(a.daysLeft) || Infinity;
        const bDays = parseInt(b.daysLeft) || Infinity;
        return aDays - bDays;
      });
    } else if (sortBy === "daysDesc") {
      result.sort((a, b) => {
        const aDays = parseInt(a.daysLeft) || -Infinity;
        const bDays = parseInt(b.daysLeft) || -Infinity;
        return bDays - aDays;
      });
    }

    setFiltered(result);
  }, [categoryFilter, modeFilter, teamSizeFilter, locationFilter, dateFilter, sortBy, workshops]);


  // ✅ Register for workshop
  const handleRegister = async () => {
    try {
      const stored = localStorage.getItem("loginDetails");
      if (!stored) return message.warning("Please log in to register.");

      const user = JSON.parse(stored);
      if (!selectedWorkshop) return message.warning("Select a workshop first!");

      setLoadingRegister(true);

      const profile = await getUserProfile({ user_id: user.id });
      const userDetails = profile?.data?.data || {};

      const payload = {
        userId: user.id,
        workshopId: selectedWorkshop.id,
        userDetails,
      };

      const res = await registerForWorkshop(payload);
      if (res.data.success) {
        message.success("Successfully registered for this workshop 🎉");
        setIsRegistered(true);
      } else {
        message.warning(res.data.message || "Already registered.");
      }
    } catch (err) {
      console.error("❌ Registration failed:", err);
      message.error("Failed to register for this workshop.");
    } finally {
      setLoadingRegister(false);
    }
  };

  return (
    <>
      <SEO
        title="Professional Workshops - Skill Building & Hands-on Training"
        description="Discover and register for professional development workshops, skill-building sessions, and hands-on training programs. Learn from industry experts and enhance your career."
        keywords="workshops, professional workshops, skill development, training programs, career workshops, hands-on training, professional development, upskilling workshops, CareerFast workshops"
        ogImage="https://careerfast.in/og-image-workshops.jpg"
        twitterImage="https://careerfast.in/twitter-image-workshops.jpg"
        breadcrumbSchema={[
          { name: "Home", item: "/" },
          { name: "Workshops", item: "/workshop-filter" }
        ]}
        structuredData={[
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Professional Workshops - CareerFast",
            "url": "https://careerfast.in/workshop-filter",
            "description": "Discover and register for professional development workshops, skill-building sessions, and hands-on training programs."
          },
          ...(filtered.length > 0 ? [{
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "Available Workshops",
            "numberOfItems": filtered.length,
            "itemListElement": filtered.map((workshop, index) => ({
              "@type": "Event",
              "position": index + 1,
              "name": workshop.title,
              "description": workshop.about,
              "eventAttendanceMode": workshop.mode === "Online" ? "https://schema.org/OnlineEventAttendanceMode" : "https://schema.org/OfflineEventAttendanceMode",
              "location": workshop.venue ? {
                "@type": "Place",
                "name": workshop.venue
              } : undefined,
              "organizer": workshop.organizer ? {
                "@type": "Organization",
                "name": workshop.organizer
              } : undefined
            }))
          }] : [])
        ]}
      />
      <Header />

      {loading ? (
        <>
          {[1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              style={{
                padding: "20px 80px",
                marginBottom: 12,
                borderRadius: 10,
                background: "#f6f7f8",
                border: "1px solid #eee",
              }}
            >
              <div style={{ display: "flex", gap: 12 }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    background: "#e0e0e0",
                    borderRadius: 8,
                  }}
                ></div>
                <div style={{ flexGrow: 1 }}>
                  <div
                    style={{
                      height: 18,
                      width: "100%",
                      background: "#e0e0e0",
                      marginBottom: 8,
                      borderRadius: 4,
                    }}
                  ></div>
                  <div
                    style={{
                      height: 12,
                      width: "70%",
                      background: "#e0e0e0",
                      marginBottom: 8,
                      borderRadius: 4,
                    }}
                  ></div>
                  <div
                    style={{
                      height: 14,
                      width: "50%",
                      background: "#e0e0e0",
                      borderRadius: 4,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </>
      ) : (
        <div
          style={{
            padding: "0px 24px 40px 24px",
            background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
            minHeight: "100vh",
          }}
        >
          <div style={{ maxWidth: 1400, margin: "0 auto" }}>
            {/* Filters */}
            <div
              className="workshop_filter"
              style={{
                background: "#fff",
                position: "sticky",
                borderRadius: "50px",
                padding: "12px 20px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "20px",
                top: 78,
                zIndex: 20,
              }}
            >
              {/* 🔸 Filter Group - Use compact pill style */}
              <Select
                placeholder="Sort By"
                value={sortBy || undefined}
                allowClear
                onChange={(value) => setSortBy(value)}
                size="large"
                suffixIcon={<DownOutlined style={{ color: "#000" }} />}
                style={{
                  minWidth: 180,
                  borderRadius: 30,
                  background: "#f9fafc",
                  // border: "1px solid #d9d9d9",
                }}
              >
                <Option value="daysAsc">Days Left (Low → High)</Option>
                <Option value="daysDesc">Days Left (High → Low)</Option>
              </Select>

              <Select
                mode="multiple"
                placeholder="Category"
                value={categoryFilter}
                allowClear
                onChange={(values) => setCategoryFilter(values)}
                size="large"
                suffixIcon={<DownOutlined style={{ color: "#000" }} />}
                style={{
                  minWidth: 180,
                  borderRadius: 30,
                  background: "#f9fafc",
                  // border: "1px solid #d9d9d9",
                }}
              >
                {[...new Set(workshops.flatMap((w) =>
                  Array.isArray(w.category)
                    ? w.category
                    : w.category?.split(",").map((c) => c.trim())
                ))]
                  .filter(Boolean)
                  .map((cat, i) => (
                    <Option key={i} value={cat}>
                      {cat}
                    </Option>
                  ))}
              </Select>

              <Select
                placeholder="Mode"
                value={modeFilter || undefined}
                allowClear
                onChange={(value) => setModeFilter(value)}
                size="large"
                suffixIcon={<DownOutlined style={{ color: "#000" }} />}
                style={{
                  minWidth: 150,
                  borderRadius: 30,
                  background: "#f9fafc",
                  // border: "1px solid #d9d9d9",
                }}
              >
                <Option value="Online">Online</Option>
                <Option value="Offline">Offline</Option>
                <Option value="Hybrid">Hybrid</Option>
              </Select>

              <Select
                placeholder="Team Size"
                value={teamSizeFilter || undefined}
                allowClear
                onChange={(value) => setTeamSizeFilter(value)}
                size="large"
                suffixIcon={<DownOutlined style={{ color: "#000" }} />}
                style={{
                  minWidth: 150,
                  borderRadius: 30,
                  background: "#f9fafc",
                  // border: "1px solid #d9d9d9",
                }}
              >
                <Option value="Individual">Individual (1)</Option>
                <Option value="Team-2">Team (2)</Option>
                <Option value="Team-2plus">Team (2+)</Option>
              </Select>

              <Select
                placeholder="Location"
                value={locationFilter || undefined}
                allowClear
                onChange={(value) => setLocationFilter(value)}
                size="large"
                suffixIcon={<DownOutlined style={{ color: "#000" }} />}
                style={{
                  minWidth: 160,
                  borderRadius: 30,
                  background: "#f9fafc",
                  // border: "1px solid #d9d9d9",
                }}
              >
                {[...new Set(workshops.map((w) => w.venue))].filter(Boolean).map((loc, i) => (
                  <Option key={i} value={loc}>
                    {loc}
                  </Option>
                ))}
              </Select>

              <RangePicker
                size="large"
                onChange={(dates) => {
                  if (dates && dates.length === 2) {
                    setDateFilter({
                      start: dates[0].startOf("day").toDate(),
                      end: dates[1].endOf("day").toDate(),
                    });
                  } else {
                    setDateFilter(null);
                  }
                }}
                style={{
                  borderRadius: 30,
                  background: "#f9fafc",
                  // border: "1px solid #d9d9d9",
                }}
                suffixIcon={<CalendarOutlined style={{ color: "#5f2eea" }} />}
              />

              <Button
                size="large"
                onClick={() => {
                  setCategoryFilter([]);
                  setModeFilter("");
                  setTeamSizeFilter("");
                  setLocationFilter("");
                  setDateFilter(null);
                  setSortBy("");
                  message.info("Filters cleared");
                }}
                icon={<FcCancel />}
                style={{
                  borderRadius: 30,
                  height: 36,
                  padding: "0 20px",
                  border: "1px solid #ff2e2eff",
                  background: "#fdedecff",
                  color: "#ff2e2eff",
                  fontWeight: 600,
                }}
              >
                Clear
              </Button>
            </div>


            <Row gutter={[32, 32]}>
              {/* Workshops List */}
              <Col
                xs={24}
                lg={8}
                style={{
                  position: "sticky",
                  top: 170,
                  alignSelf: "flex-start",
                  zIndex: 5,
                }}
              >
                <Card
                  style={{
                    borderRadius: 16,
                    border: "1px solid rgba(229, 231, 235, 0.6)",
                    background: "linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)",
                    boxShadow:
                      "0 4px 12px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.08)",
                    overflow: "hidden",
                  }}
                  styles={{ body: { padding: 0 } }}
                >
                  <div
                    style={{
                      padding: "24px 28px",
                      borderBottom: "1px solid #f1f5f9",
                      background:
                        "linear-gradient(90deg, rgba(95,46,234,0.1) 0%, rgba(255,255,255,0) 100%)",
                    }}
                  >
                    <Title
                      level={4}
                      style={{
                        margin: 0,
                        color: "#1f2937",
                        fontWeight: 700,
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>Available Workshops</span>
                      <Text
                        style={{
                          background: "#5f2eea",
                          color: "#fff",
                          padding: "2px 10px",
                          borderRadius: 8,
                          fontSize: 14,
                        }}
                      >
                        {filtered.length}
                      </Text>
                    </Title>
                  </div>

                  <div style={{ maxHeight: "100vh", overflowY: "auto", padding: 16 }}>
                    {filtered.length > 0 ? (
                      filtered.map((w, i) => (
                        <div
                          key={i}
                          onClick={() => setSelectedWorkshop(w)}
                          style={{
                            padding: 16,
                            marginBottom: 12,
                            borderRadius: 10,
                            background:
                              selectedWorkshop?.id === w.id
                                ? "rgba(95,46,234,0.08)"
                                : "#fff",
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                            border:
                              selectedWorkshop?.id === w.id
                                ? "1px solid #5f2eea"
                                : "1px solid #eee",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <img
                              src={w.logo}
                              alt={w.title}
                              style={{
                                width: 64,
                                height: 64,
                                borderRadius: 8,
                                objectFit: "cover",
                              }}
                            />
                            <div>
                              <Title level={5} style={{ margin: 0, fontWeight: 600 }}>
                                {w.title}
                              </Title>
                              <Text type="secondary">{w.category}</Text>
                              <div>
                                <Tag color="purple" style={{ borderRadius: 6, marginTop: 8 }}>
                                  {w.mode}
                                </Tag>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <Empty description="No workshops found" />
                    )}
                  </div>
                </Card>
              </Col>

              {/* Workshop Details */}
              <Col xs={24} lg={16}>
                <Card
                  className="workshop_details"
                  style={{
                    borderRadius: 18,
                    border: "1px solid rgba(229, 231, 235, 0.6)",
                    background: "linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)",
                    boxShadow: "0 6px 18px rgba(0, 0, 0, 0.06)",
                  }}
                  styles={{ body: { padding: 30 } }}
                >
                  {selectedWorkshop ? (
                    <>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 28,
                          marginBottom: 20,
                          borderBottom: "1px solid #f1f5f9",
                          paddingBottom: 10,
                        }}
                      >
                        <img
                          src={selectedWorkshop.logo}
                          alt={selectedWorkshop.title}
                          style={{
                            width: 80,
                            height: 80,
                            borderRadius: 16,
                            objectFit: "cover",
                          }}
                        />
                        <div>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              marginBottom: 8,
                            }}
                          >
                            <Title level={2} style={{ margin: 0, color: "#111827" }}>
                              {selectedWorkshop.title}
                            </Title>
                            <Tag
                              color="success"
                              icon={<CheckCircleFilled />}
                              style={{
                                marginLeft: 12,
                                borderRadius: 8,
                                fontWeight: 500,
                                background: "rgba(16,185,129,0.1)",
                                color: "#065f46",
                              }}
                            >
                              Verified
                            </Tag>
                          </div>
                          <Paragraph
                            style={{
                              color: "#5f2eea",
                              fontWeight: 600,
                              fontSize: 16,
                              marginBottom: 10,
                            }}
                          >
                            {selectedWorkshop.category}
                          </Paragraph>

                          <Space size={[24, 12]} wrap>
                            <Text style={{ fontSize: 15, color: "#4b5563" }}>
                              <GlobalOutlined
                                style={{
                                  marginRight: 8,
                                  color: "#6a5cff",
                                  fontSize: 16,
                                  verticalAlign: "middle",
                                }}
                              />
                              {selectedWorkshop.mode}
                            </Text>
                            <Text style={{ fontSize: 15, color: "#4b5563" }}>
                              <EnvironmentOutlined
                                style={{
                                  marginRight: 8,
                                  color: "#6a5cff",
                                  fontSize: 16,
                                  verticalAlign: "middle",
                                }}
                              />
                              {selectedWorkshop.venue || "Venue not specified"}
                            </Text>
                          </Space>
                          <div className="job-meta-item">
                            <FaRegBuilding className="meta-icon premium-icon" />
                            <span className="meta-text">
                              {selectedWorkshop.created_at
                                ? new Date(selectedWorkshop.created_at).toLocaleDateString("en-GB")
                                : "—"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button
                        type="primary"
                        block
                        size="large"
                        disabled={isRegistered || loadingRegister}
                        onClick={handleRegister}
                        style={{
                          background: isRegistered
                            ? "linear-gradient(135deg,rgba(220,252,231,0.7) 0%,rgba(187,247,208,0.5) 100%)"
                            : "linear-gradient(135deg,#5f2eea,#7c3aed)",
                          color: isRegistered ? "#15803d" : "#fff",
                          fontWeight: 600,
                          height: 52,
                          fontSize: 17,
                          borderRadius: 10,
                          border: "none",
                        }}
                      >
                        {loadingRegister ? (
                          <Spin
                            indicator={
                              <LoadingOutlined style={{ fontSize: 20, color: "#fff" }} spin />
                            }
                          />
                        ) : isRegistered ? (
                          "Registered ✅"
                        ) : (
                          "Register Now 🚀"
                        )}
                      </Button>

                      <Divider style={{ margin: "40px 0" }} />

                      <Title
                        level={4}
                        style={{
                          color: "#1f2937",
                          marginBottom: 16,
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            width: 4,
                            height: 24,
                            background: "linear-gradient(180deg,#5f2eea,#9d4edd)",
                            borderRadius: 4,
                          }}
                        ></span>
                        About This Workshop
                      </Title>
                      <div
                        className="workshop_des"
                        style={{
                          color: "#4b5563",
                          fontSize: 15.5,
                          background: "#fafafa",
                          padding: 5,
                          borderRadius: 12,
                          border: "1px solid #f3f4f6",
                          whiteSpace: "pre-wrap",
                        }}
                        dangerouslySetInnerHTML={{
                          __html:
                            selectedWorkshop.about ||
                            "<p>No description available.</p>",
                        }}
                      />

                      <Divider style={{ margin: "20px 0" }} />

                      <Title
                        level={4}
                        style={{
                          color: "#1f2937",
                          marginBottom: 16,
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            width: 4,
                            height: 24,
                            background: "linear-gradient(180deg,#5f2eea,#9d4edd)",
                            borderRadius: 4,
                          }}
                        ></span>
                        Eligibility
                      </Title>
                      <Space wrap>
                        {Array.isArray(selectedWorkshop.eligibility)
                          ? selectedWorkshop.eligibility.map((e, i) => (
                            <Tag key={i} color="purple">
                              {e}
                            </Tag>
                          ))
                          : selectedWorkshop.eligibility && (
                            <Tag color="purple">{selectedWorkshop.eligibility}</Tag>
                          )}
                      </Space>

                      <Divider style={{ margin: "20px 0" }} />

                      <Title
                        level={4}
                        style={{
                          color: "#1f2937",
                          marginBottom: 16,
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            width: 4,
                            height: 24,
                            background: "linear-gradient(180deg,#5f2eea,#9d4edd)",
                            borderRadius: 4,
                          }}
                        ></span>
                        Organizer & Contact
                      </Title>
                      <Paragraph style={{ color: "#000" }}>
                        <UserOutlined style={{ marginRight: 6, color: "#5f2eea" }} />
                        {selectedWorkshop.organizer || "N/A"}
                      </Paragraph>
                      <Paragraph>
                        <MailOutlined style={{ marginRight: 6, color: "#5f2eea" }} />
                        {selectedWorkshop.contactEmail ? (
                          <a
                            href={`mailto:${selectedWorkshop.contactEmail}`}
                            style={{ color: "#000", textDecoration: "none" }}
                          >
                            {selectedWorkshop.contactEmail}
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </Paragraph>

                      <Paragraph>
                        <PhoneOutlined style={{ marginRight: 6, color: "#5f2eea" }} />
                        {selectedWorkshop.contactNumber ? (
                          <a
                            href={`tel:${selectedWorkshop.contactNumber}`}
                            style={{ color: "#000", textDecoration: "none" }}
                          >
                            {selectedWorkshop.contactNumber}
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </Paragraph>
                    </>
                  ) : (
                    <div
                      style={{
                        padding: 100,
                        textAlign: "center",
                        background:
                          "linear-gradient(180deg, #fafafa 0%, #f3f4f6 100%)",
                      }}
                    >
                      <Empty
                        description={
                          <span style={{ color: "#6b7280", fontWeight: 500 }}>
                            Select a workshop from the list to view details
                          </span>
                        }
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    </div>
                  )}
                </Card>
              </Col>
            </Row>
          </div>
        </div>
      )}
      <Footer />
    </>
  );
}

