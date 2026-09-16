'use client';
import React, { useState, useEffect } from "react";
import { Typography, Button, Collapse, Card, Tag, Divider, Spin } from "antd";
import {
  CrownOutlined,
  ArrowRightOutlined,
  CheckOutlined,
  ThunderboltOutlined,
  StarOutlined
} from "@ant-design/icons";
import Header from "../Header/Header";
import { getBillingPlans } from "../ApiService/action";

const { Title, Text } = Typography;
const { Panel } = Collapse;

const ProSubscription = () => {
  const [activePanel, setActivePanel] = useState(null);
  const [billingPlans, setBillingPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await getBillingPlans(token);
        // Assuming response.data.plans or response.data contains the array
        const plansData = response.data?.plans || response.data || [];
        setBillingPlans(Array.isArray(plansData) ? plansData : []);
      } catch (error) {
        console.error("Error fetching billing plans:", error);
      } finally {
        setLoadingPlans(false);
      }
    };
    fetchPlans();
  }, []);

  const features = [
    "Priority support",
    "Advanced analytics",
    "Exclusive templates",
    "Early access to features",
    "Custom branding",
  ];

  // Animation styles
  const fadeIn = {
    animation: "fadeIn 0.5s ease-out",
    "@keyframes fadeIn": {
      from: { opacity: 0, transform: "translateY(10px)" },
      to: { opacity: 1, transform: "translateY(0)" },
    },
  };

  const pulse = {
    animation: "pulse 2s infinite",
    "@keyframes pulse": {
      "0%": { boxShadow: "0 0 0 0 rgba(108, 62, 245, 0.4)" },
      "70%": { boxShadow: "0 0 0 10px rgba(108, 62, 245, 0)" },
      "100%": { boxShadow: "0 0 0 0 rgba(108, 62, 245, 0)" },
    },
  };

  return (
    <>
      <Header />
      <Card
        style={{
          borderRadius: "0px 0px 16px 16px",
          overflow: "hidden",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          transition: "all 0.3s ease",
          ...fadeIn,
          border: "none",
          ":hover": {
            transform: "translateY(-3px)",
            boxShadow: "0 8px 25px rgba(0, 0, 0, 0.12)",
          },
        }}
      >
        {/* Section Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <CrownOutlined style={{ fontSize: 24, color: "#6c3ef5" }} />
            <Title level={4} style={{ margin: 0, fontWeight: 600 }}>
              Careerfast Pro Subscription
            </Title>
          </div>
          <Divider style={{ margin: "16px 0", borderColor: "#f0f0f0" }} />
        </div>

        {/* Subscription Status Card */}
        <div
          style={{
            background: "linear-gradient(135deg, #f9f5ff, #f0ebff)",
            borderRadius: 12,
            padding: 20,
            marginBottom: 24,
            border: "1px solid #e9e0ff",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -20,
              right: -20,
              width: 100,
              height: 100,
              background:
                "radial-gradient(circle, rgba(108,62,245,0.1) 0%, rgba(108,62,245,0) 70%)",
              borderRadius: "50%",
            }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #6c3ef5, #8a5ff7)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: 24,
                  fontWeight: 600,
                }}
              >
                <CrownOutlined />
              </div>
              <div style={{ textAlign: "left" }}>
                <Text strong style={{ display: "block", fontSize: 16 }}>
                  No Active Subscription
                </Text>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Upgrade to unlock premium features and tools
                </Text>
              </div>
            </div>

            <Button
              type="primary"
              shape="round"
              icon={<ThunderboltOutlined />}
              style={{
                height: 44,
                padding: "0 24px",
                fontWeight: 600,
                letterSpacing: "0.5px",
                transition: "all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1)",
                background: "linear-gradient(135deg, #6c3ef5, #8a5ff7)",
                border: "none",
              }}
              onClick={() => {
                 // Scroll to plans section
                 document.getElementById("billing-plans-section")?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Go Pro Now <ArrowRightOutlined style={{ marginLeft: 8 }} />
            </Button>
          </div>
        </div>

        {/* Dynamic Billing Plans Section */}
        <div id="billing-plans-section" style={{ marginBottom: 32 }}>
          <Title level={5} style={{ marginBottom: 16 }}>Available Plans</Title>
          {loadingPlans ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <Spin size="large" />
            </div>
          ) : billingPlans.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
              {billingPlans.map((plan) => (
                <Card 
                  key={plan.id}
                  hoverable
                  style={{
                    borderRadius: 16,
                    border: "1px solid #f0f0f0",
                    transition: "all 0.3s ease",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    position: "relative",
                    overflow: "hidden"
                  }}
                  bodyStyle={{ padding: 24 }}
                >
                  {plan.name.toLowerCase().includes("pro") && (
                    <div style={{
                      position: "absolute",
                      top: 12,
                      right: -30,
                      background: "#6c3ef5",
                      color: "#fff",
                      padding: "4px 40px",
                      transform: "rotate(45deg)",
                      fontSize: 10,
                      fontWeight: "bold",
                      letterSpacing: 1
                    }}>
                      RECOMMENDED
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <div style={{ 
                      background: plan.color || "#e9e0ff", 
                      width: 48, 
                      height: 48, 
                      borderRadius: 12, 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      color: "#6c3ef5",
                      fontSize: 20
                    }}>
                      {plan.icon ? <i className={plan.icon} /> : <StarOutlined />}
                    </div>
                    <div>
                      <Title level={4} style={{ margin: 0 }}>{plan.name}</Title>
                    </div>
                  </div>
                  
                  <Text type="secondary" style={{ display: "block", marginBottom: 24, minHeight: 44 }}>
                    {plan.description}
                  </Text>
                  
                  <div style={{ marginBottom: 24 }}>
                    <span style={{ fontSize: 32, fontWeight: 700, color: "#1f1f1f" }}>
                      ${plan.monthly_price}
                    </span>
                    <span style={{ color: "#8c8c8c", fontSize: 14 }}>/month</span>
                  </div>
                  
                  <Button 
                    type={plan.name.toLowerCase().includes("pro") ? "primary" : "default"}
                    block
                    size="large"
                    style={{
                      borderRadius: 8,
                      fontWeight: 600,
                      height: 44,
                      background: plan.name.toLowerCase().includes("pro") ? "#6c3ef5" : undefined,
                      borderColor: plan.name.toLowerCase().includes("pro") ? "#6c3ef5" : "#d9d9d9",
                    }}
                  >
                    Select {plan.name}
                  </Button>
                </Card>
              ))}
            </div>
          ) : (
            <div style={{ padding: 24, background: "#fafafa", borderRadius: 12, textAlign: "center" }}>
              <Text type="secondary">No billing plans found.</Text>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div style={{ marginBottom: 24 }}>
          <Text
            strong
            style={{ display: "block", marginBottom: 12, textAlign: "left" }}
          >
            Pro Features:
          </Text>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {features.map((feature, index) => (
              <Tag
                key={index}
                icon={<CheckOutlined style={{ color: "#6c3ef5" }} />}
                style={{
                  margin: 4,
                  borderRadius: 20,
                  padding: "0 12px",
                  height: 28,
                  lineHeight: "28px",
                  fontSize: 12,
                  background: "rgba(108, 62, 245, 0.1)",
                  color: "#6c3ef5",
                  border: "none",
                }}
              >
                {feature}
              </Tag>
            ))}
          </div>
        </div>

        {/* Payment History Dropdown */}
        <Collapse
          bordered={false}
          expandIconPosition="end"
          activeKey={activePanel}
          onChange={(key) => setActivePanel(key.length > 0 ? key : null)}
          style={{
            background: "#faf9ff",
            borderRadius: 12,
            border: "1px solid #f0ebff",
          }}
          items={[
            {
              key: "1",
              label: (
                <Text strong style={{ color: activePanel ? "#fff" : "inherit" }}>
                  View Payment History
                </Text>
              ),
              children: (
                <div
                  style={{
                    padding: 16,
                    background: "#fff",
                    borderRadius: 8,
                    border: "1px dashed #f0f0f0",
                  }}
                >
                  <Text type="secondary">No payment history available</Text>
                </div>
              ),
              style: {
                border: "none",
                borderRadius: 12,
                padding: "0px 0px 0px 0",
              },
            },
          ]}
        />

      </Card>
    </>
  );
};

export default ProSubscription;

