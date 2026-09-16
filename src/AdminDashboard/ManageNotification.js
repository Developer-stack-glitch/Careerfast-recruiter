'use client';
import React, { useState } from "react";
import { Divider, Tooltip, Card, Typography, Space, Switch } from "antd";
import { BellOutlined, ClockCircleOutlined } from "@ant-design/icons";

import {
  MdOutlineSend,
  MdOutlineCancel,
  MdOutlinePendingActions,
} from "react-icons/md";
import { BiMessageDetail } from "react-icons/bi";
import { FaClipboardCheck } from "react-icons/fa";
import { AiOutlineClockCircle } from "react-icons/ai";
const { Title, Text } = Typography;

const PremiumContainer = ({ children, style, ...props }) => (
  <Card
    styles={{ body: { padding: "32px" } }}
    style={{
      borderRadius: "16px",
      boxShadow: "0 4px 24px rgba(0, 0, 0, 0.08)",
      border: "none",
      overflow: "hidden",
      ...style,
    }}
    {...props}
  >
    {children}
  </Card>
);

const SectionHeader = ({ children, style, ...props }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      marginBottom: "24px",
      ...style,
    }}
    {...props}
  >
    {children}
  </div>
);

const NotificationItem = ({ children, style, ...props }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "16px 0",
      borderBottom: "1px solid #f0f0f0",
      ...style,
    }}
    {...props}
  >
    {children}
  </div>
);

const NotificationLabel = ({ children, style, ...props }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      ...style,
    }}
    {...props}
  >
    {children}
  </div>
);

const ManageNotification = () => {
  const [notificationSettings, setNotificationSettings] = useState({
    applicationAlert: true,
    registrationCancel: true,
    discussionPost: true,
    submission: false,
    dailyDigest: false,
    incompleteReminder: true,
  });

  const handleChange = (key) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <PremiumContainer style={{ margin: 30 }}>
      <Title level={3} style={{ marginBottom: 8 }}>
        Notification Preferences
      </Title>
      <Text type="secondary" style={{ marginBottom: 32, display: "block" }}>
        Customize how and when you receive notifications for this opportunity
      </Text>

      <SectionHeader>
        <BellOutlined style={{ fontSize: 20, marginRight: 12, color: "#722ed1" }} />
        <Title level={5} style={{ margin: 0 }}>
          Activity Notifications
        </Title>
      </SectionHeader>

      <Space direction="vertical" style={{ width: "100%", marginBottom: 32 }}>
        <NotificationItem>
          <NotificationLabel>
            <MdOutlineSend style={{ color: "#8c8c8c", marginRight: 8, fontSize: 18 }} />
            <Text>Application Submission Alert</Text>
          </NotificationLabel>
          <Switch
            checked={notificationSettings.applicationAlert}
            onChange={() => handleChange("applicationAlert")}
          />
        </NotificationItem>

        <NotificationItem>
          <NotificationLabel>
            <MdOutlineCancel style={{ color: "#8c8c8c", marginRight: 8, fontSize: 18 }} />
            <Text>Registration Cancellations</Text>
          </NotificationLabel>
          <Switch
            checked={notificationSettings.registrationCancel}
            onChange={() => handleChange("registrationCancel")}
          />
        </NotificationItem>

        <NotificationItem>
          <NotificationLabel>
            <BiMessageDetail style={{ color: "#8c8c8c", marginRight: 8, fontSize: 18 }} />
            <Text>Discussions Post</Text>
          </NotificationLabel>
          <Switch
            checked={notificationSettings.discussionPost}
            onChange={() => handleChange("discussionPost")}
          />
        </NotificationItem>

        <NotificationItem>
          <NotificationLabel>
            <FaClipboardCheck style={{ color: "#8c8c8c", marginRight: 8, fontSize: 18 }} />
            <Text>Submission Notifications</Text>
          </NotificationLabel>
          <Switch
            checked={notificationSettings.submission}
            onChange={() => handleChange("submission")}
          />
        </NotificationItem>

        <NotificationItem>
          <NotificationLabel>
            <AiOutlineClockCircle style={{ color: "#8c8c8c", marginRight: 8, fontSize: 18 }} />
            <Text>Daily Digest</Text>
          </NotificationLabel>
          <Switch
            checked={notificationSettings.dailyDigest}
            onChange={() => handleChange("dailyDigest")}
          />
        </NotificationItem>
      </Space>

      <Divider style={{ margin: "24px 0" }} />

      <SectionHeader>
        <ClockCircleOutlined style={{ fontSize: 20, marginRight: 12, color: "#722ed1" }} />
        <Title level={5} style={{ margin: 0 }}>
          Automated Reminders
        </Title>
      </SectionHeader>

      <Space direction="vertical" style={{ width: "100%" }}>
        <NotificationItem style={{ borderBottom: "none" }}>
          <NotificationLabel>
            <Tooltip title="Reminder emails for users who have started but not completed registration">
              <MdOutlinePendingActions style={{ cursor: "pointer", color: "#8c8c8c", marginRight: 8, fontSize: 18 }} />
            </Tooltip>
            <Text style={{ marginLeft: 8 }}>
              Incomplete Registrations Reminder
            </Text>
          </NotificationLabel>
          <Switch
            checked={notificationSettings.incompleteReminder}
            onChange={() => handleChange("incompleteReminder")}
          />
        </NotificationItem>
      </Space>
    </PremiumContainer>
  );
};

export default ManageNotification;

