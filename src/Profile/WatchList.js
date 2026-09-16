'use client';
import React, { useEffect, useState, useMemo } from "react";
import {
  Input,
  Button,
  Card,
  Tag,
  Typography,
  Badge,
  Skeleton,
  Tooltip,
} from "antd";
import {
  SearchOutlined,
  HeartFilled,
} from "@ant-design/icons";
import { debounce } from "lodash";
import { CommonToaster } from "../Common/CommonToaster";
import { getSavedJobs, removeSavedJobs } from "../ApiService/action";
import { useNavigate } from "@/routing-shim";
import Header from "../Header/Header";
import { FaRegEye } from "react-icons/fa";
import moment from "moment";

const { Title, Text } = Typography;
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

const OpportunityCard = ({ opportunity, onSave }) => {
  const [saved, setSaved] = useState(() => opportunity.saved);
  const [loginUserId, setLoginUserId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("loginDetails");
      if (stored) {
        const loginDetails = JSON.parse(stored);
        setLoginUserId(loginDetails.id);
      }
    } catch (error) {
      console.error("Invalid JSON in localStorage", error);
    }
  }, []);

  const handleRemove = async () => {
    if (!loginUserId) {
      CommonToaster("Please log in.", "error");
      return;
    }

    // remove immediately from UI
    setSaved(false);
    onSave(opportunity.id, false);

    try {
      await removeSavedJobs({ id: opportunity.id });
      CommonToaster("Removed from favourites ❤️", "error");
    } catch (error) {
      console.error("Remove saved jobs error", error);
      CommonToaster("Failed to remove job", "error");
      setSaved(true); // rollback if API fails
    }
  };

  const generateSlug = (text = "") => {
    return String(text)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const isClosed =
    moment().diff(moment(opportunity.created_date), "days") >= 355;

  return (
    <>
      <Card
        style={{
          marginBottom: 16,
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
          border: "none",
        }}
      >
        <div
          style={{
            paddingTop: "10px",
            paddingBottom: 6,
            position: "absolute",
            left: 0,
            top: 0,
          }}
          className="activeClosed"
        >
          <button className={isClosed ? "clo" : "act"}>
            {isClosed ? "Closed" : "Active"}
          </button>
        </div>
        <div style={{ display: "flex", gap: 20, paddingTop: 20 }}>
          <div style={{ flexShrink: 0 }}>
            <img
              src={opportunity.company_logo}
              alt={`${opportunity.company_name || opportunity.company} logo`}
              style={{
                borderRadius: 8,
                width: 65,
                height: 65,
                objectFit: "contain",
              }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 0,
              }}
            >
              <Title level={5} style={{ margin: 0 }}>
                {opportunity.job_title}
              </Title>
              <div>
                <Tooltip title={"Remove from wishlist"}>
                  <Button
                    type="text"
                    style={{ background: "rgba(255, 0, 0, 0.1)" }}
                    icon={<HeartFilled style={{ color: "red" }} />}
                    onClick={handleRemove}
                    aria-label="Remove from wishlist"
                  />
                </Tooltip>
                <Tooltip title={"View job post"}>
                  <Button
                    type="text"
                    style={{ background: "#e9e0fe", marginLeft: 10 }}
                    icon={<FaRegEye color="#5f2eea" />}
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

                      const jobNature = generateSlug(opportunity.job_nature || "");
                      const jobTitle = generateSlug(opportunity.job_title || "");
                      const companyName = generateSlug(opportunity.company_name || "");
                      const locationSlug = safeSlug(opportunity.work_location);
                      const workplaceType = generateSlug(opportunity.workplace_type || "");
                      const experienceType = generateSlug(opportunity.experience_type || "");
                      const experienceRequired = safeSlug(opportunity.experience_required);

                      let basePath = "/job-details";
                      if (opportunity.job_nature === "Internship") basePath = "/internship-details";
                      if (opportunity.job_nature === "Scholarship") basePath = "/scholarship-details";

                      const jobId = opportunity.job_post_id || opportunity.id;

                      const finalUrl = `${basePath}/${jobNature}-${jobTitle}-${companyName}-${locationSlug}-${workplaceType}-${experienceType}-${experienceRequired}-${jobId}`;
                      window.open(finalUrl, "_blank");
                    }}

                    aria-label="Toggle favourite"
                  />
                </Tooltip>
              </div>
            </div>

            <Text strong style={{ display: "block", marginBottom: 8 }}>
              {opportunity.company_name}
            </Text>

            <div
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 8,
                flexWrap: "wrap",
              }}
            >
              <Tag color="green">
                {opportunity.work_location
                  ? opportunity.work_location
                  : "Work From Home"}
              </Tag>
              <Tag color="blue">
                {opportunity.salary_type === "Fixed"
                  ? (!opportunity.min_salary || String(opportunity.min_salary) === "0") ? "Not Disclosed" : `${getCurrencySymbol(opportunity.currency)}${opportunity.min_salary} ${opportunity.salary_duration?.toLowerCase() === "monthly" ? "Per Month" : "LPA"}`
                  : opportunity.salary_type === "Range"
                    ? ((!opportunity.min_salary || String(opportunity.min_salary) === "0") && (!opportunity.max_salary || String(opportunity.max_salary) === "0")) ? "Not Disclosed" : `${getCurrencySymbol(opportunity.currency)}${opportunity.min_salary || 0} - ${getCurrencySymbol(opportunity.currency)}${opportunity.max_salary || 0} ${opportunity.salary_duration?.toLowerCase() === "monthly" ? "Per Month" : "LPA"}`
                    : "-"}
              </Tag>
            </div>

            <div style={{ paddingTop: 6 }} className="listing-meta">
              <span>
                <span
                  style={{
                    color: isClosed ? "red" : "green",
                  }}
                >
                  Posted:{" "}
                </span>
                <b>{opportunity.date_posted}</b>
              </span>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
};

export default function WatchList() {
  const [opportunities, setOpportunities] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loginUserId, setLoginUserId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("loginDetails");
    if (stored) {
      try {
        const loginDetails = JSON.parse(stored);
        setLoginUserId(loginDetails.id);
      } catch (error) {
        console.error("Invalid JSON in localStorage", error);
      }
    }
  }, []);

  useEffect(() => {
    if (loginUserId) {
      getSavedJobsData();
    }
  }, [loginUserId]);

  const getSavedJobsData = async () => {
    try {
      const response = await getSavedJobs({ user_id: loginUserId });
      setOpportunities(response?.data?.data || []);
    } catch (error) {
      console.error("Error fetching jobs", error);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  };

  const handleSave = (id, saved) => {
    if (!saved) {
      setOpportunities((prev) => prev.filter((opp) => opp.id !== id));
    }
  };

  const debouncedSearch = useMemo(
    () =>
      debounce((value) => {
        setSearchQuery(value);
      }, 300),
    []
  );

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      const target = `${opp.job_title} ${opp.company_name || opp.company
        }`.toLowerCase();
      return searchQuery ? target.includes(searchQuery.toLowerCase()) : true;
    });
  }, [opportunities, searchQuery]);

  return (
    <>
      <Header />
      <section
        className="watchlist-container"
        style={{
          padding: "24px 32px",
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <Title level={3} style={{ margin: 0 }}>
            My Opportunity Wishlist
          </Title>
          <Badge
            count={opportunities.length}
            style={{ backgroundColor: "#5f2eea" }}
          />
        </div>

        <Input
          placeholder="Search by role or company..."
          prefix={<SearchOutlined />}
          style={{
            borderRadius: 8,
            padding: "10px 16px",
            maxWidth: 400,
            marginBottom: 24,
          }}
          onChange={(e) => debouncedSearch(e.target.value)}
          allowClear
        />

        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Skeleton active />
          </div>
        ) : filteredOpportunities.length > 0 ? (
          filteredOpportunities
            .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
            .map((opp) => (
              <OpportunityCard
                key={opp.id}
                opportunity={opp}
                onSave={handleSave}
              />
            ))
        ) : (
          <Card style={{ textAlign: "center", padding: 40 }}>
            <Title level={4} style={{ color: "#bfbfbf" }}>
              No wishlist opportunities found
            </Title>
            <Text
              style={{
                cursor: "pointer",
                textDecoration: "underline",
                color: "#5f2eea",
              }}
              onClick={() => navigate("/job-filter")}
              type="secondary"
            >
              Try to add your wishlist
            </Text>
          </Card>
        )}
      </section>
    </>
  );
}


