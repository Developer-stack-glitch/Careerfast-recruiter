'use client';
import React, { useEffect, useState } from "react";
import Header from "../Header/Header";
import {
  Switch,
  Typography,
  Input,
  Form,
  Button,
  Select,
  message,
  Card,
  Divider,
  Space,
  Tabs,
} from "antd";
import {
  EyeInvisibleOutlined,
  EyeTwoTone,
  BellOutlined,
  LockOutlined,
  UserOutlined,
  SafetyOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import { changePassword } from "../ApiService/action";
import { confirmPasswordValidation, passwordValidator } from "../Common/Validation";

const { Title, Text } = Typography;

/* ---------- Premium Styled Components Equivalents ---------- */
const SettingsContainer = ({ children, ...props }) => (
  <motion.div
    style={{
      padding: '40px',
      background: '#f8fafc',
      borderRadius: '0 0 24px 24px',
      boxShadow: '0 10px 35px rgba(0, 0, 0, 0.08)',
    }}
    {...props}
  >
    {children}
  </motion.div>
);

const SectionTitle = ({ children, ...props }) => (
  <Title
    style={{
      fontWeight: 700,
      marginBottom: '8px',
      fontSize: '26px',
    }}
    {...props}
  >
    {children}
  </Title>
);

const SectionDescription = ({ children, ...props }) => (
  <Text
    style={{
      color: '#6c6f85',
      fontSize: '15px',
      display: 'block',
      marginBottom: '28px',
    }}
    {...props}
  >
    {children}
  </Text>
);

const SettingCard = ({ children, ...props }) => (
  <motion.div {...props}>
    <Card
      styles={{ body: { padding: '28px' } }}
      style={{
        borderRadius: '16px',
        marginBottom: '20px',
        border: 'none',
        backdropFilter: 'blur(10px)',
        background: 'rgba(255, 255, 255, 0.75)',
        boxShadow: '0 8px 24px rgba(95, 46, 234, 0.08)',
      }}
    >
      {children}
    </Card>
  </motion.div>
);

const SettingItem = ({ children, ...props }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      padding: '18px 0',
      borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
    }}
    {...props}
  >
    {children}
  </div>
);

const SettingContent = ({ children, ...props }) => (
  <div style={{ flex: 1, marginRight: '24px' }} {...props}>
    {children}
  </div>
);

const SettingTitle = ({ children, ...props }) => (
  <h4
    style={{
      fontWeight: 600,
      marginBottom: '6px',
      color: '#1a1a1a',
      fontSize: '18px',
    }}
    {...props}
  >
    {children}
  </h4>
);

const SettingDescription = ({ children, ...props }) => (
  <p style={{ color: '#777', margin: 0, fontSize: '14px' }} {...props}>
    {children}
  </p>
);

const PremiumButton = ({ children, ...props }) => (
  <Button
    style={{
      background: 'linear-gradient(135deg, #7f5af0 0%, #5f2eea 100%)',
      border: 'none',
      fontWeight: 600,
      height: '42px',
      padding: '0 26px',
      borderRadius: '8px',
      color: '#fff',
    }}
    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.opacity = '0.95'; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.opacity = '1'; }}
    {...props}
  >
    {children}
  </Button>
);

const PasswordInput = (props) => (
  <Input.Password
    style={{
      borderRadius: '8px',
      padding: '10px 16px',
      marginBottom: '16px',
    }}
    {...props}
  />
);

/* ---------- Component ---------- */
export default function Settings() {
  const [loginUserId, setLoginUserId] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [activeTab, setActiveTab] = useState("notifications");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

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

  const handleChangePassword = async () => {
    if (!currentPassword || currentPassword.trim() === "") {
      message.error("Current password is required");
      return;
    }

    const newPassErr = passwordValidator(newPassword);
    const confirmErr = confirmPasswordValidation(newPassword, confirmPassword);

    setNewPasswordError(newPassErr);
    setConfirmPasswordError(confirmErr);

    if (newPassErr || confirmErr) {
      message.error("Please fix password errors");
      return;
    }

    try {
      const payload = {
        user_id: loginUserId,
        currentPassword,
        newPassword,
      };

      const res = await changePassword(payload);

      message.success("Password changed successfully!");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setNewPasswordError("");
      setConfirmPasswordError("");

    } catch (err) {
      message.error("Invalid current password!");
    }
  };



  return (
    <div>
      <Header />
      <SettingsContainer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <SectionTitle level={2}>Account Settings</SectionTitle>
        <SectionDescription>
          Manage your account preferences and security settings
        </SectionDescription>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          tabPosition="left"
          style={{ minHeight: 500 }}
          tabBarStyle={{ fontWeight: "600" }}
          items={[
            {
              key: "notifications",
              label: (
                <span>
                  <BellOutlined style={{ marginRight: 6 }} />
                  Notifications
                </span>
              ),
              children: (
                <SettingCard>
                  {[
                    {
                      title: "Newsletter Preference",
                      desc: "Access the latest updates on jobs, internships, and competitions.",
                    },
                    {
                      title: "Email Notification Preferences",
                      desc: "Get reminders for quizzes, hackathons, and incomplete registrations.",
                    },
                    {
                      title: "Competition Updates",
                      desc: "Turn on emails for specific competitions from My Registration page.",
                    },
                    {
                      title: "Relevant Jobs Notifications",
                      desc: "Receive job notifications that match your profile.",
                    },
                  ].map((item, i) => (
                    <SettingItem key={i}>
                      <SettingContent>
                        <SettingTitle>{item.title}</SettingTitle>
                        <SettingDescription>{item.desc}</SettingDescription>
                      </SettingContent>
                      <Switch />
                    </SettingItem>
                  ))}
                </SettingCard>
              ),
            },
            {
              key: "password",
              label: (
                <span>
                  <LockOutlined style={{ marginRight: 6 }} />
                  Password
                </span>
              ),
              children: (
                <SettingCard>
                  <SettingContent>
                    <SettingTitle>Change Password</SettingTitle>
                    <SettingDescription>
                      Use a strong, unique password for better security.
                    </SettingDescription>
                  </SettingContent>

                  <Divider />

                  <Form layout="vertical" style={{ maxWidth: 500 }}>

                    {/* ✅ CURRENT PASSWORD */}
                    <Form.Item label="Current Password">
                      <PasswordInput
                        placeholder="Enter current password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        iconRender={(visible) =>
                          visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                        }
                      />
                    </Form.Item>

                    {/* ✅ NEW PASSWORD */}
                    <Form.Item label="New Password">
                      <PasswordInput
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => {
                          const value = e.target.value;
                          setNewPassword(value);
                          setNewPasswordError(passwordValidator(value));
                        }}
                        status={newPasswordError ? "error" : ""}
                        iconRender={(visible) =>
                          visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                        }
                      />
                      {newPasswordError && (
                        <div style={{ color: "red", marginTop: -10, marginBottom: 10 }}>
                          {newPasswordError}
                        </div>
                      )}
                    </Form.Item>

                    {/* ✅ CONFIRM PASSWORD */}
                    <Form.Item label="Confirm New Password">
                      <PasswordInput
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => {
                          const value = e.target.value;
                          setConfirmPassword(value);
                          setConfirmPasswordError(
                            confirmPasswordValidation(newPassword, value)
                          );
                        }}
                        status={confirmPasswordError ? "error" : ""}
                        iconRender={(visible) =>
                          visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                        }
                      />
                      {confirmPasswordError && (
                        <div style={{ color: "red", marginTop: -10, marginBottom: 10 }}>
                          {confirmPasswordError}
                        </div>
                      )}
                    </Form.Item>

                    <Space>
                      <PremiumButton
                        type="primary"
                        onClick={handleChangePassword}
                        disabled={!currentPassword || !newPassword || !confirmPassword}
                      >
                        Update Password
                      </PremiumButton>

                      <Button
                        onClick={() => {
                          setCurrentPassword("");
                          setNewPassword("");
                          setConfirmPassword("");
                          setNewPasswordError("");
                          setConfirmPasswordError("");
                        }}
                      >
                        Cancel
                      </Button>
                    </Space>
                  </Form>
                </SettingCard>
              ),
            },
            {
              key: "profile",
              label: (
                <span>
                  <UserOutlined style={{ marginRight: 6 }} />
                  Profile
                </span>
              ),
              children: (
                <SettingCard>
                  <SettingItem style={{ borderBottom: 'none' }}>
                    <SettingContent>
                      <SettingTitle>Profile Visibility</SettingTitle>
                      <SettingDescription>
                        Choose whether your profile is visible to search engines.
                      </SettingDescription>
                    </SettingContent>
                    <Select
                      defaultValue="Public"
                      style={{ width: 140 }}
                      options={[
                        { value: "Public", label: "Public" },
                        { value: "Private", label: "Private" },
                      ]}
                    />
                  </SettingItem>
                </SettingCard>
              ),
            },
            {
              key: "security",
              label: (
                <span>
                  <SafetyOutlined style={{ marginRight: 6 }} />
                  Security
                </span>
              ),
              children: (
                <SettingCard>
                  <SettingItem>
                    <SettingContent>
                      <SettingTitle>Two-Factor Authentication</SettingTitle>
                      <SettingDescription>
                        Add an extra layer of protection to your account.
                      </SettingDescription>
                    </SettingContent>
                    <Switch checked={false} />
                  </SettingItem>
                  <SettingItem style={{ borderBottom: 'none' }}>
                    <SettingContent>
                      <SettingTitle>Login Activity</SettingTitle>
                      <SettingDescription>
                        View recent login history and sessions.
                      </SettingDescription>
                    </SettingContent>
                    <Button style={{ color: "#5f2eea" }} type="link">
                      View Activity
                    </Button>
                  </SettingItem>
                </SettingCard>
              ),
            },
          ]}
        />

      </SettingsContainer>
    </div>
  );
}

