'use client';
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import SEO from "../Components/SEO/SEO";
import { checkIsRegistered, getAllEvents, getUserProfile, registerForEvent } from "../ApiService/action";
import {
  Card,
  Row,
  Col,
  Select,
  InputNumber,
  Tag,
  Space,
  Button,
  Empty,
  Divider,
  Typography,
  message,
  Spin,
} from "antd";
import {
  CalendarOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  CheckCircleFilled,
  TeamOutlined,
  UserOutlined,
  LoadingOutlined,
  DownOutlined,
  FilterFilled
} from "@ant-design/icons";
import { Drawer } from "antd";
import "../css/EventFilter.css";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import { MdWorkOutline } from "react-icons/md";
import { FcCancel } from "react-icons/fc";

const { Option } = Select;
const { Title, Text, Paragraph } = Typography;

// 🔹 Filter Fields Component (Reusable for Desktop & Mobile)
const FilterFields = ({
  allEvents,
  categoryFilter,
  setCategoryFilter,
  modeFilter,
  setModeFilter,
  teamSizeFilter,
  setTeamSizeFilter,
  sortBy,
  setSortBy,
  minPrize,
  setMinPrize,
  maxPrize,
  setMaxPrize,
  isMobile = false,
}) => {
  const filterContent = (
    <>
      <div className={isMobile ? "filter-field-item" : ""}>
        {isMobile && <label>Category</label>}
        <Select
          mode="multiple"
          placeholder="Select Category"
          value={categoryFilter}
          onChange={(values) => setCategoryFilter(values)}
          size="large"
          suffixIcon={<DownOutlined style={{ color: "#000" }} />}
          style={{
            minWidth: isMobile ? "100%" : 180,
            borderRadius: 30,
            background: "#f9fafc",
            // border: "1px solid #d9d9d9",
          }}
        >
          {[
            ...new Set(
              allEvents.flatMap((e) =>
                e.category ? e.category.split(",").map((c) => c.trim()) : []
              )
            ),
          ]
            .filter(Boolean)
            .map((cat, i) => (
              <Option key={i} value={cat}>
                {cat}
              </Option>
            ))}
        </Select>
      </div>

      <div className={isMobile ? "filter-field-item" : ""}>
        {isMobile && <label>Mode</label>}
        <Select
          placeholder="Mode"
          value={modeFilter || undefined}
          allowClear
          onChange={(value) => setModeFilter(value)}
          size="large"
          suffixIcon={<DownOutlined style={{ color: "#000" }} />}
          style={{
            minWidth: isMobile ? "100%" : 140,
            borderRadius: 30,
            background: "#f9fafc",
            // border: "1px solid #d9d9d9",
          }}
        >
          <Option value="Online">Online</Option>
          <Option value="Offline">Offline</Option>
          <Option value="Hybrid">Hybrid</Option>
        </Select>
      </div>

      <div className={isMobile ? "filter-field-item" : ""}>
        {isMobile && <label>Team Size</label>}
        <Select
          placeholder="Team Size"
          value={teamSizeFilter || undefined}
          allowClear
          onChange={(value) => setTeamSizeFilter(value)}
          size="large"
          suffixIcon={<DownOutlined style={{ color: "#000" }} />}
          style={{
            minWidth: isMobile ? "100%" : 150,
            borderRadius: 30,
            background: "#f9fafc",
            // border: "1px solid #d9d9d9",
          }}
        >
          <Option value="1">Individual (1)</Option>
          <Option value="2">Team (2)</Option>
          <Option value="2+">Team (2+)</Option>
        </Select>
      </div>

      <div className={isMobile ? "filter-field-item" : ""}>
        {isMobile && <label>Sort By</label>}
        <Select
          placeholder="Sort By"
          value={sortBy || undefined}
          allowClear
          onChange={(value) => setSortBy(value)}
          size="large"
          suffixIcon={<DownOutlined style={{ color: "#000" }} />}
          style={{
            minWidth: isMobile ? "100%" : 200,
            borderRadius: 30,
            background: "#f9fafc",
           // border: "1px solid #d9d9d9",
          }}
        >
          <Option value="daysAsc">Days Left (Low → High)</Option>
          <Option value="daysDesc">Days Left (High → Low)</Option>
        </Select>
      </div>

      <div className={isMobile ? "filter-field-item" : ""}>
        {isMobile && <label>Min Prize</label>}
        <InputNumber
          placeholder="Min Prize"
          value={minPrize}
          onChange={(val) => setMinPrize(val)}
          prefix={<DollarOutlined style={{ color: "#5f2eea" }} />}
          size="large"
          style={{
            borderRadius: 30,
            background: "#f9fafc",
           //border: "1px solid #d9d9d9",
            width: isMobile ? "100%" : 140,
          }}
        />
      </div>

      <div className={isMobile ? "filter-field-item" : ""}>
        {isMobile && <label>Max Prize</label>}
        <InputNumber
          placeholder="Max Prize"
          value={maxPrize}
          onChange={(val) => setMaxPrize(val)}
          prefix={<DollarOutlined style={{ color: "#5f2eea" }} />}
          size="large"
          style={{
            borderRadius: 30,
            background: "#f9fafc",
            //border: "1px solid #d9d9d9",
            width: isMobile ? "100%" : 140,
          }}
        />
      </div>

      <Button
        size="large"
        onClick={() => {
          setCategoryFilter([]);
          setModeFilter("");
          setTeamSizeFilter("");
          setSortBy("");
          setMinPrize(null);
          setMaxPrize(null);
          message.info("Filters cleared");
        }}
        icon={<FcCancel />}
        style={{
          borderRadius: 30,
          height: 40,
          padding: "0 20px",
          border: "1px solid #ff2e2eff",
          background: "#fdedecff",
          color: "#ff2e2eff",
          fontWeight: 600,
          width: isMobile ? "100%" : "auto",
        }}
      >
        Clear
      </Button>
    </>
  );

  return isMobile ? <div className="mobile-filter-fields">{filterContent}</div> : filterContent;
};

export default function EventFilter() {
  const [allEvents, setAllEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState([]);
  const [modeFilter, setModeFilter] = useState("");
  const [minPrize, setMinPrize] = useState(null);
  const [maxPrize, setMaxPrize] = useState(null);
  const [loadingRegister, setLoadingRegister] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [sortBy, setSortBy] = useState("");
  const [teamSizeFilter, setTeamSizeFilter] = useState("");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    getAllEventsData();
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("loginDetails");
    if (stored) {
      try {
        const loginDetails = JSON.parse(stored);
        getUserProfileData(loginDetails.id);
      } catch (error) {
        console.error("Invalid JSON in localStorage", error);
      }
    }
  }, []);

  useEffect(() => {
    const checkRegistrationStatus = async () => {
      try {
        const stored = localStorage.getItem("loginDetails");
        if (!stored || !selectedEvent) return;

        const user = JSON.parse(stored);

        // ✅ Check backend
        const res = await checkIsRegistered(user.id, selectedEvent.id);

        // ✅ Backend returns: { success: true, registered: true/false }
        if (res.data?.registered) {
          setIsRegistered(true);
          // Store locally so it persists after reload
          const key = `event_registered_${selectedEvent.id}_${user.id}`;
          localStorage.setItem(key, "true");
        } else {
          setIsRegistered(false);
        }
      } catch (error) {
        console.error("Error checking registration:", error);
        setIsRegistered(false);
      }
    };

    checkRegistrationStatus();
  }, [selectedEvent]);


  const getUserProfileData = async (userId) => {
    const payload = {
      user_id: userId,
    };

    try {
      const response = await getUserProfile(payload);
      console.log("getuserprofile", response);
    } catch (error) {
      // silent
    }
  };

  const getAllEventsData = async () => {
    try {
      setLoading(true)
      const response = await getAllEvents();
      let events = response?.data?.data || [];

      // Calculate days left based on posted date (assuming expires in 15 days)
      events = events.map((event) => {
        const postedDate = new Date(event.postedTime || event.createdAt || event.date || Date.now());
        const now = new Date();
        const diffInDays = Math.floor((now - postedDate) / (1000 * 60 * 60 * 24));
        const remainingDays = 15 - diffInDays;

        return {
          ...event,
          daysLeft: remainingDays > 0 ? `${remainingDays} days left` : "Expired",
        };
      });

      setAllEvents(events);
      setFilteredEvents(events);
      if (events.length) setSelectedEvent(events[0]);
    } catch (error) {
      console.log("get all events error", error);
    }
    finally {
      setLoading(false)
    }
  };

  useEffect(() => {
    let result = [...allEvents];

    // ✅ Category filter (supports multi-select)
    if (categoryFilter.length > 0) {
      result = result.filter((e) => {
        const eventCats = e.category
          ? e.category.split(",").map((c) => c.trim().toLowerCase())
          : [];
        return eventCats.some((cat) =>
          categoryFilter.map((c) => c.toLowerCase()).includes(cat)
        );
      });
    }

    // ✅ Mode
    if (modeFilter)
      result = result.filter(
        (e) => e.mode?.toLowerCase() === modeFilter.toLowerCase()
      );

    // ✅ Team size
    if (teamSizeFilter === "1") {
      result = result.filter((e) => e.participationType === "Individual");
    } else if (teamSizeFilter === "2") {
      result = result.filter(
        (e) => e.memberLimit && parseInt(e.memberLimit) === 2
      );
    } else if (teamSizeFilter === "2+") {
      result = result.filter(
        (e) => e.memberLimit && parseInt(e.memberLimit) > 2
      );
    }

    // ✅ Prize range
    if (minPrize !== null)
      result = result.filter((e) => parseInt(e.winnerPrize || 0) >= minPrize);
    if (maxPrize !== null)
      result = result.filter((e) => parseInt(e.winnerPrize || 0) <= maxPrize);

    // ✅ Sort by days left
    if (sortBy) {
      result.sort((a, b) => {
        const daysA =
          typeof a.daysLeft === "string" && a.daysLeft.includes("day")
            ? parseInt(a.daysLeft)
            : 0;
        const daysB =
          typeof b.daysLeft === "string" && b.daysLeft.includes("day")
            ? parseInt(b.daysLeft)
            : 0;

        return sortBy === "daysAsc" ? daysA - daysB : daysB - daysA;
      });
    }

    setFilteredEvents(result);
  }, [
    categoryFilter,
    modeFilter,
    teamSizeFilter,
    minPrize,
    maxPrize,
    sortBy,
    allEvents,
  ]);


  // ✅ Handle registration
  const handleRegister = async () => {
    try {
      const stored = localStorage.getItem("loginDetails");
      if (!stored) return message.warning("Please log in to register.");

      const user = JSON.parse(stored);
      if (!selectedEvent) return message.warning("Select an event first!");

      setLoadingRegister(true);

      // ✅ Fetch user profile details
      const profileResponse = await getUserProfile({ user_id: user.id });
      const userDetails = profileResponse?.data?.data || {};

      // ✅ Register payload
      const payload = {
        userId: user.id,
        eventId: selectedEvent.id,
        userDetails,
      };

      const res = await registerForEvent(payload);

      if (res.data.success) {
        message.success("Successfully registered for this event 🎉");

        setIsRegistered(true);

        // ✅ Save registration locally
        const key = `event_registered_${selectedEvent.id}_${user.id}`;
        localStorage.setItem(key, "true");
      } else {
        message.warning(res.data.message || "You may already be registered.");
      }
    } catch (error) {
      console.error("Error registering:", error);
      message.error(error.response?.data?.message || "Failed to register for event");
    } finally {
      setLoadingRegister(false);
    }
  };

  return (
    <>
      <SEO
        title="Career Events - Discover Tech Competitions & Workshops"
        description="Browse and register for career development events, tech competitions, and professional networking opportunities. Connect with industry leaders and win exciting prizes."
        keywords="career events, tech events, professional events, networking events, competitions, hackathons, career development, tech competitions, industry events, CareerFast events"
        ogImage="https://careerfast.in/og-image-events.jpg"
        twitterImage="https://careerfast.in/twitter-image-events.jpg"
        breadcrumbSchema={[
          { name: "Home", item: "/" },
          { name: "Events", item: "/event-filter" }
        ]}
        structuredData={[
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Career Events - CareerFast",
            "url": "https://careerfast.in/event-filter",
            "description": "Browse and register for career development events, tech competitions, and professional networking opportunities."
          },
          ...(filteredEvents.length > 0 ? [{
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "Available Events",
            "numberOfItems": filteredEvents.length,
            "itemListElement": filteredEvents.map((event, index) => ({
              "@type": "Event",
              "position": index + 1,
              "name": event.title,
              "description": event.description,
              "eventAttendanceMode": event.mode === "Online" ? "https://schema.org/OnlineEventAttendanceMode" : "https://schema.org/OfflineEventAttendanceMode",
              "offers": {
                "@type": "Offer",
                "price": event.winnerPrize || "0",
                "priceCurrency": "INR"
              }
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
          className="event-filter-page-container"
          style={{
            padding: "0px 24px 40px 24px",
            background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
            minHeight: "100vh",
          }}
        >

          {/* Main Content Container */}
          <div style={{ maxWidth: 1400, margin: "0 auto" }}>
            {/* 🔹 Modern Filter Bar */}
            <div className="workshop-filter-container">
              {/* Desktop View */}
              <div className="desktop-filter-bar">
                <FilterFields
                  allEvents={allEvents}
                  categoryFilter={categoryFilter}
                  setCategoryFilter={setCategoryFilter}
                  modeFilter={modeFilter}
                  setModeFilter={setModeFilter}
                  teamSizeFilter={teamSizeFilter}
                  setTeamSizeFilter={setTeamSizeFilter}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  minPrize={minPrize}
                  setMinPrize={setMinPrize}
                  maxPrize={maxPrize}
                  setMaxPrize={setMaxPrize}
                />
              </div>

              {/* Mobile View Toggle */}
              <div className="mobile-filter-trigger">
                <Button
                  type="primary"
                  icon={<FilterFilled />}
                  onClick={() => setMobileFilterOpen(true)}
                  block
                  size="large"
                  style={{
                    background: "linear-gradient(135deg, #5f2eea 0%, #7c3aed 100%)",
                    borderRadius: "12px",
                    height: "50px",
                    fontWeight: "600"
                  }}
                >
                  Filter Events ({categoryFilter.length + (modeFilter ? 1 : 0) + (teamSizeFilter ? 1 : 0) + (minPrize ? 1 : 0) + (maxPrize ? 1 : 0)})
                </Button>
              </div>
            </div>

            {/* Mobile Filter Drawer */}
            <Drawer
              title="Filters"
              placement="right"
              onClose={() => setMobileFilterOpen(false)}
              open={mobileFilterOpen}
              width={320}
              className="filter-drawer"
            >
              <div className="mobile-filter-content">
                <FilterFields
                  isMobile={true}
                  allEvents={allEvents}
                  categoryFilter={categoryFilter}
                  setCategoryFilter={setCategoryFilter}
                  modeFilter={modeFilter}
                  setModeFilter={setModeFilter}
                  teamSizeFilter={teamSizeFilter}
                  setTeamSizeFilter={setTeamSizeFilter}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  minPrize={minPrize}
                  setMinPrize={setMinPrize}
                  maxPrize={maxPrize}
                  setMaxPrize={setMaxPrize}
                />
              </div>
            </Drawer>



            {/* Results Section */}
            <Row style={{ marginTop: 0 }} gutter={[32, 32]}>
              {/* Events List Column */}
              <Col
                className="event-list-col"
                style={{
                  position: "sticky",
                  top: 170,
                  alignSelf: "flex-start",
                  height: "fit-content",
                  zIndex: 5,
                }} xs={24} lg={8}>
                <Card
                  style={{
                    borderRadius: 16,
                    border: "1px solid rgba(229, 231, 235, 0.6)",
                    background: "linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)",
                    height: "100%",
                    boxShadow:
                      "0 4px 12px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.08)",
                    overflow: "hidden",
                    backdropFilter: "blur(4px)",
                  }}
                  styles={{ body: { padding: 0 } }}
                >
                  {/* Header */}
                  <div
                    style={{
                      padding: "24px 28px",
                      marginBottom: 20,
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
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>Available Events</span>
                      <Text
                        style={{
                          color: "#ffffffff",
                          fontWeight: 500,
                          fontSize: 14,
                          background: "#149603ff",
                          padding: "2px 10px",
                          borderRadius: 8,
                        }}
                      >
                        {filteredEvents.length}
                      </Text>
                    </Title>
                  </div>

                  {/* List */}
                  <div
                    style={{
                      maxHeight: "100vh",
                      overflowY: "auto",
                      padding: "12px 20px",
                    }}
                  >
                    <style>
                      {`
          ::-webkit-scrollbar {
            width: 3px;
          }
          ::-webkit-scrollbar-thumb {
            background: rgba(95, 46, 234, 0.4);
            border-radius: 3px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: rgba(95, 46, 234, 0.7);
          }
        `}
                    </style>

                    {filteredEvents.length > 0 ? (
                      filteredEvents.map((event, i) => (
                        <div
                          key={i}
                          onClick={() => setSelectedEvent(event)}
                          style={{
                            padding: "20px 18px",
                            marginBottom: 18,
                            borderRadius: 12,
                            cursor: "pointer",
                            transition: "all 0.25s ease",
                            background:
                              selectedEvent?.id === event.id
                                ? "linear-gradient(135deg, #f3e8ff 0%, #faf5ff 100%)"
                                : "#ffffff",
                            border:
                              selectedEvent?.id === event.id
                                ? "2px solid #7c3aed"
                                : "1px solid #d1d1d1ff",
                            transform: selectedEvent?.id === event.id ? "scale(1.02)" : "scale(1)",
                            boxShadow:
                              selectedEvent?.id === event.id
                                ? "0 6px 16px rgba(124,58,237,0.25)"
                                : "0 2px 6px rgba(0,0,0,0.05)",
                            position: "relative",
                          }}
                        >

                          <div className="event-filter-mob-card" style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                            <img
                              src={event.logo}
                              alt={event.title}
                              style={{
                                width: 64,
                                height: 64,
                                borderRadius: 10,
                                objectFit: "cover",
                                border: "1px solid #e5e7eb",
                                boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                              }}
                            />

                            <div style={{ flex: 1 }}>
                              <Title
                                level={5}
                                style={{
                                  margin: "0 0 8px 0",
                                  color: "#111827",
                                  fontWeight: 600,
                                }}
                              >
                                {event.title}
                              </Title>

                              <Tag className="event-filter-mob-card-tag"
                                color="geekblue"
                                style={{
                                  borderRadius: 6,
                                  marginBottom: 12,
                                  fontWeight: 500,
                                  padding: "2px 10px",
                                }}
                              >
                                {event.category || "General"}
                              </Tag>

                              <Space size={[12, 6]} wrap>
                                <Text type="secondary" style={{ fontSize: 13 }}>
                                  <CalendarOutlined style={{ marginRight: 4 }} />
                                  {event.daysLeft || "15 days"}
                                </Text>
                                <Text type="secondary" style={{ fontSize: 13 }}>
                                  <CalendarOutlined style={{ marginRight: 4 }} />
                                  {event.type || "N/A"}
                                </Text>
                                <Text type="secondary" style={{ fontSize: 13 }}>
                                  <EnvironmentOutlined style={{ marginRight: 4 }} />
                                  {event.mode || "Online"}
                                </Text>
                                <Text
                                  style={{
                                    fontSize: 13,
                                    borderRadius: 6,
                                    backgroundColor: "#FFF6D1",
                                    color: "#513C06",
                                    padding: "3px 8px",
                                    fontWeight: 600,
                                  }}
                                >
                                  🏆 ₹{event.winnerPrize}
                                </Text>
                              </Space>

                              <div style={{ marginTop: 12 }}>
                                {event.skills?.slice(0, 2).map((s, i) => (
                                  <Tag className="event-skill"
                                    key={i}
                                    style={{
                                      background: "#f3f4f6",
                                      color: "#4b5563",
                                      borderRadius: 4,
                                      fontSize: 11,
                                      marginBottom: 4,
                                      border: "none",
                                    }}
                                  >
                                    {s}
                                  </Tag>
                                ))}
                                {event.skills?.length > 2 && (
                                  <Tag
                                    style={{
                                      background: "#f3f4f6",
                                      color: "#4b5563",
                                      borderRadius: 4,
                                      fontSize: 11,
                                    }}
                                  >
                                    +{event.skills.length - 2}
                                  </Tag>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: 60, textAlign: "center" }}>
                        <Empty
                          description={
                            <span style={{ color: "#6b7280", fontWeight: 500 }}>
                              No events match your filters
                            </span>
                          }
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                      </div>
                    )}
                  </div>
                </Card>
              </Col>


              {/* Event Details Column */}
              <Col
                className="event-details-col"
                xs={24} lg={16}>
                <Card
                  className="workshop_details"
                  style={{
                    borderRadius: 18,
                    border: "1px solid rgba(229, 231, 235, 0.6)",
                    background: "linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)",
                    boxShadow:
                      "0 6px 18px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.04)",
                    overflow: "hidden",
                    transition: "all 0.3s ease",
                  }}
                  styles={{ body: { padding: 0 } }}
                >
                  {selectedEvent ? (
                    <div className="event-details-card-main" style={{ padding: 30 }}>
                      {/* Header Section */}
                      <div className="event-details-card"
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 28,
                          marginBottom: 0,
                          borderBottom: "1px solid #f1f5f9",
                          paddingBottom: 28,
                        }}
                      >
                        <div
                          style={{
                            position: "relative",
                            width: 80,
                            height: 80,
                            borderRadius: 16,
                            padding: 5,
                            overflow: "hidden",
                          }}
                        >
                          <img
                            src={selectedEvent.logo}
                            alt={selectedEvent.title}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              borderRadius: 16,
                            }}
                          />
                        </div>

                        <div style={{ flex: 1 }}>
                          <div className="event-details-card-text" 
                            style={{
                              display: "flex",
                              alignItems: "center",
                              marginBottom: 8,
                            }}
                          >
                            <Title
                              level={2}
                              style={{
                                margin: 0,
                                color: "#111827",
                                fontWeight: 700,
                                letterSpacing: "-0.02em",
                              }}
                            >
                              {selectedEvent.title}
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
                              marginBottom: 20,
                            }}
                          >
                            {selectedEvent.category || "Event Category"}
                          </Paragraph>

                          <Space size={[24, 12]} wrap>
                            <Text style={{ fontSize: 15, color: "#4b5563" }}>
                              <TeamOutlined
                                style={{
                                  marginRight: 8,
                                  color: "#7c3aed",
                                  fontSize: 16,
                                  verticalAlign: "middle",
                                }}
                              />
                              {selectedEvent.participationType}{" "}
                              {selectedEvent.memberLimit ? `(${selectedEvent.memberLimit})` : ""}
                            </Text>
                            <Text style={{ fontSize: 15, color: "#4b5563" }}>
                              <MdWorkOutline
                                style={{
                                  marginRight: 8,
                                  color: "#7c3aed",
                                  fontSize: 16,
                                  verticalAlign: "middle",
                                }}
                              />
                              {selectedEvent.mode || "Online"}
                            </Text>
                          </Space>
                        </div>
                      </div>

                      {/* Premium Register Button */}
                      <Button
                        type="primary"
                        size="large"
                        block
                        disabled={
                          selectedEvent.daysLeft === "Expired" || isRegistered || loadingRegister
                        }
                        onClick={handleRegister}
                        style={{
                          background:
                            selectedEvent.daysLeft === "Expired"
                              ? "linear-gradient(135deg, #9ca3af 0%, #d1d5db 100%)"
                              : isRegistered
                                ? "linear-gradient(135deg,rgba(220, 252, 231, 0.7) 0%,rgba(187, 247, 208, 0.5) 100%)"
                                : "linear-gradient(135deg, #5f2eea 0%, #7c3aed 50%, #9d4edd 100%)",
                          border: "none",
                          borderRadius: 10,
                          fontWeight: 600,
                          height: 52,
                          fontSize: 17,
                          color: isRegistered ? "#15803d" : "#fff",
                          letterSpacing: 0.2,
                          boxShadow:
                            selectedEvent.daysLeft === "Expired"
                              ? "none"
                              : "0 0px 0px -0px rgba(95,46,234,0.3)",
                          opacity:
                            selectedEvent.daysLeft === "Expired" || loadingRegister ? 0.6 : 1,
                          cursor:
                            selectedEvent.daysLeft === "Expired" || isRegistered
                              ? "not-allowed"
                              : "pointer",
                          transition: "all 0.3s ease",
                        }}
                      >
                        {loadingRegister ? (
                          <Spin
                            indicator={<LoadingOutlined style={{ fontSize: 20, color: "#fff" }} spin />}
                          />
                        ) : selectedEvent.daysLeft === "Expired" ? (
                          "Registration Closed 🔒"
                        ) : isRegistered ? (
                          "Registered ✅"
                        ) : (
                          "Register Now 🚀"
                        )}
                      </Button>

                      <Divider style={{ margin: "40px 0", background: "#ebebebff" }} />

                      {/* Eligibility Section */}
                      <div style={{ marginBottom: 40 }}>
                        <Title
                          level={4}
                          style={{
                            color: "#1f2937",
                            marginBottom: 16,
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <UserOutlined style={{ color: "#5f2eea", fontSize: 20 }} />
                          Eligibility Criteria
                        </Title>

                        <div>
                          {Array.isArray(selectedEvent.eligibility) ? (
                            <Space wrap>
                              {selectedEvent.eligibility.map((item, i) => (
                                <Tag
                                  key={i}
                                  style={{
                                    background: "linear-gradient(135deg,#ede9fe 0%,#e0e7ff 100%)",
                                    color: "#5f2eea",
                                    fontWeight: 500,
                                    borderRadius: 20,
                                    padding: "6px 14px",
                                    fontSize: 14,
                                    border: "none",
                                    boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                                  }}
                                >
                                  {item}
                                </Tag>
                              ))}
                            </Space>
                          ) : (
                            <Tag
                              style={{
                                background: "#f3f4f6",
                                color: "#374151",
                                fontWeight: 500,
                                borderRadius: 8,
                                padding: "6px 14px",
                                fontSize: 14,
                                border: "1px solid #e5e7eb",
                              }}
                            >
                              {selectedEvent.eligibility || "Open to all participants"}
                            </Tag>
                          )}
                        </div>
                      </div>

                      <Divider style={{ background: "#ebebebff" }} />

                      {/* About Section */}
                      <div>
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
                          About This Opportunity
                        </Title>

                        <div
                          className="workshop_des"
                          style={{
                            color: "#4b5563",
                            fontSize: 15.5,
                            background: "#fafafa",
                            padding: 20,
                            borderRadius: 12,
                            border: "1px solid #f3f4f6",
                            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)",
                            whiteSpace: "pre-wrap",
                            transition: "all 0.3s ease",
                          }}
                          dangerouslySetInnerHTML={{
                            __html: selectedEvent.about,
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: 100,
                        textAlign: "center",
                        background: "linear-gradient(180deg, #fafafa 0%, #f3f4f6 100%)",
                      }}
                    >
                      <Empty
                        description={
                          <span style={{ color: "#6b7280", fontWeight: 500 }}>
                            Select an event from the list to view details
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
