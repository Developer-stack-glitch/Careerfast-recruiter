'use client';
import React, { useEffect, useState, useMemo } from "react";
import { Input, Card, Tag, Typography, Badge, Skeleton, Button } from "antd";
import { SearchOutlined, CalendarOutlined } from "@ant-design/icons";
import { debounce } from "lodash";
import { useNavigate } from "@/routing-shim";
import {
  getUserAppliedJobs,
  getUserJobPostStatus,
} from "../ApiService/action";
import Header from "../Header/Header";
import { FiClock } from "react-icons/fi";

const { Title, Text } = Typography;
const generateSlug = (text) => {
  return text
    ?.toLowerCase()
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

const OpportunityCard = ({ opportunity, status }) => {
  const navigate = useNavigate();
  const getStatusColor = (status) => {
    switch (status) {
      case "Shortlisted":
        return "green";
      case "Rejected":
        return "red";
      case "Mail Sent":
        return "blue";
      default:
        return "orange";
    }
  };

  return (
    <Card
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

        const finalUrl = `${basePath}/${jobNature}-${jobTitle}-${companyName}-${locationSlug}-${workplaceType}-${experienceType}-${experienceRequired}-${opportunity.post_id}`;
        window.open(finalUrl, "_blank");
      }}

      style={{
        marginBottom: 16,
        borderRadius: 12,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
        border: "none",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", gap: 20 }}>
        <div style={{ flexShrink: 0 }}>
          <img
            src={opportunity.company_logo}
            alt={`${opportunity.company_name || opportunity.company} logo`}
            style={{
              borderRadius: 8,
              width: 63,
              height: 70,
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
            <Tag
              style={{
                fontWeight: 500,
                borderRadius: 6,
              }}
              color={getStatusColor(status)}
            >
              {status ? (
                status
              ) : (
                <>
                  <FiClock style={{ marginRight: 4 }} />
                  Pending
                </>
              )}
            </Tag>
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
              {(() => {
                let location = opportunity.work_location;
                if (!location || location === "[]" || location === '[""]' || location === '[""]') {
                  return opportunity.workplace_type;
                }
                if (location === "Work From Home") return "WFH";
                return location;
              })()}
            </Tag>
            <Tag color="blue">
              {opportunity.salary_type === "Fixed"
                ? (!opportunity.min_salary || String(opportunity.min_salary) === "0") ? "Not Disclosed" : `${getCurrencySymbol(opportunity.currency)}${opportunity.min_salary} ${opportunity.salary_duration?.toLowerCase() === "monthly" ? "Per Month" : "LPA"}`
                : opportunity.salary_type === "Range"
                  ? ((!opportunity.min_salary || String(opportunity.min_salary) === "0") && (!opportunity.max_salary || String(opportunity.max_salary) === "0")) ? "Not Disclosed" : `${getCurrencySymbol(opportunity.currency)}${opportunity.min_salary || 0} - ${getCurrencySymbol(opportunity.currency)}${opportunity.max_salary || 0} ${opportunity.salary_duration?.toLowerCase() === "monthly" ? "Per Month" : "LPA"}`
                  : ""}
            </Tag>
          </div>

          <Text
            type="secondary"
            style={{ display: "flex", alignItems: "center", gap: 4 }}
          >
            <CalendarOutlined /> Applied on:{" "}
            {new Date(opportunity.created_at).toLocaleDateString("en-GB")}
          </Text>
        </div>
      </div>
    </Card>
  );
};

// AppliedJobs.js

export default function AppliedJobs() {
  const [opportunities, setOpportunities] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loginUserId, setLoginUserId] = useState(null);
  const [appliedJobIds, setAppliedJobIds] = useState([]);
  const [jobStatusMap, setJobStatusMap] = useState({});
  const [appliedOn, setAppliedOn] = useState({});

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
      fetchAppliedJobs();
    }
  }, [loginUserId]);

  useEffect(() => {
    if (appliedJobIds.length > 0) {
      getUserJobPostStatusData();
    }
  }, [appliedJobIds]);

  const fetchAppliedJobs = async () => {
    try {
      const response = await getUserAppliedJobs({ userId: loginUserId });
      const jobs = response?.data?.data || [];

      const sortedJobs = jobs.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      setOpportunities(sortedJobs);
      setAppliedJobIds(sortedJobs.map((job) => job.id));
    } catch (error) {
      console.error("Error fetching applied jobs:", error);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  const getUserJobPostStatusData = async () => {
    try {
      const promises = appliedJobIds.map((id) =>
        getUserJobPostStatus({ applied_job_id: id })
      );

      const responses = await Promise.all(promises);

      const statusMap = {};
      responses.forEach((res) => {
        const jobStatuses = res?.data?.data || [];
        if (jobStatuses.length > 0) {
          const latestStatus = jobStatuses.reduce((latest, current) =>
            new Date(current.changed_at) > new Date(latest.changed_at)
              ? current
              : latest
          );
          statusMap[latestStatus.applied_job_id] = latestStatus.status;
        }
      });

      setJobStatusMap(statusMap); // ✅ keep map separate
    } catch (error) {
      console.log("getUserJobPostStatus error", error);
    }
  };

  const debouncedSearch = useMemo(
    () => debounce((value) => setSearchQuery(value), 300),
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
            Applied Jobs & Internships
          </Title>
          <Badge
            count={filteredOpportunities.length}
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
          filteredOpportunities.map((opp) => (
            <OpportunityCard
              key={opp.applied_job_id || opp.id}
              opportunity={opp}
              status={jobStatusMap[opp.id]} // ✅ now properly mapped
            />
          ))
        ) : (
          <Card style={{ textAlign: "center", padding: 40 }}>
            <Title level={4} style={{ color: "#bfbfbf" }}>
              No opportunities found
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
              Apply some jobs
            </Text>
          </Card>
        )}
      </section>
    </>
  );
}


