'use client';
import React, { useEffect, useState } from "react";
import {
  Form,
  Button,
  Checkbox,
  Typography,
  Col,
  Row,
  Modal,
  Divider,
  Input,
} from "antd";
import { CommonToaster } from "../Common/CommonToaster";
import {
  MailOutlined,
  ThunderboltFilled,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import "../css/LoginPage.css";
import loginImage from "../images/hire-fresher.png";
import { useNavigate } from "@/routing-shim";
import {
  emailValidator,
  passwordValidator,
  confirmPasswordValidation,
} from "../Common/Validation";
import CommonInputField from "../Common/CommonInputField";
import CommonPasswordField from "../Common/CommonPasswordField";
import { getImageUrl } from "../utils/getImageUrl";
import {
  googleLogin,
  isProfileUpdated,
  login,
  verifyOtp,
  forgotPassword,
  sendOtp,
  getRoles
} from "../ApiService/action";
import { GoogleLogin } from "@react-oauth/google";
import { requestForToken } from "../firebase/fireBase";

const { Title, Text, Link } = Typography;

const LoginPage = () => {
  const navigate = useNavigate();

  // States
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [roleOptions, setRoleOptions] = useState([]);
  const [roleId, setRoleId] = useState(null);

  // Forgot Password Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [modalData, setModalData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchRoles();
    const storedEmail = localStorage.getItem("rememberedEmail");
    if (storedEmail) {
      setFormData(prev => ({ ...prev, email: storedEmail }));
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    updateRoleId();
  }, [roleOptions]);

  const fetchRoles = async () => {
    try {
      const response = await getRoles();
      setRoleOptions(response.data.data || []);
    } catch (error) {
      console.error("Roles fetch error", error);
    }
  };

  const updateRoleId = () => {
    if (roleOptions.length) {
      const role = roleOptions.find(r => r.name === "CANDIDATE");
      if (role) setRoleId(role.id);
    }
  };

  const handleInputChange = (field, value, validator) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validator) {
      setErrors(prev => ({ ...prev, [field]: validator(value) }));
    }
  };

  const handleSubmit = async (values) => {
    if (values && typeof values.preventDefault === 'function') {
      values.preventDefault();
    }

    const emailVal = emailValidator(formData.email);
    const passVal = passwordValidator(formData.password);

    if (emailVal || passVal) {
      setErrors({ email: emailVal, password: passVal });
      return;
    }

    if (rememberMe) {
      localStorage.setItem("rememberedEmail", formData.email);
    } else {
      localStorage.removeItem("rememberedEmail");
    }

    try {
      setIsLoading(true);
      const fcm_token = await requestForToken();
      if (fcm_token) localStorage.setItem("fcm_token", fcm_token);

      const candidateRoleId = roleId || roleOptions.find(r => r.name === "CANDIDATE")?.id || 2;

      const payload = {
        email: formData.email,
        password: formData.password,
        role_id: candidateRoleId,
        fcm_token: fcm_token || localStorage.getItem("fcm_token"),
      };

      const response = await login(payload);
      const token = response.data.token;
      const loginDetails = response.data.data[0];

      localStorage.setItem("AccessToken", token);
      localStorage.setItem("loginDetails", JSON.stringify(loginDetails));

      // Set cookies for cross-app synchronization (shared across ports on localhost)
      document.cookie = `AccessToken=${token}; path=/; max-age=86400`; // 24 hours
      document.cookie = `loginDetails=${encodeURIComponent(JSON.stringify(loginDetails))}; path=/; max-age=86400`;

      CommonToaster("Logged in successfully!", "success");

      if (loginDetails?.role_id === 1) {
        navigate("/admin");
      } else {
        const profileCheck = await isProfileUpdated({ email: payload.email });
        navigate(profileCheck?.data?.data === true ? "/" : "/profiledetails");
      }
    } catch (error) {
      console.error("Login error", error);
      const msg = error?.response?.data?.details || error?.response?.data?.message || "Login failed.";
      CommonToaster(msg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async (res) => {
    try {
      const response = await googleLogin({ token: res.credential });

      const token = response.data.token;
      const userDetails = response.data.user;

      localStorage.setItem("AccessToken", token);
      localStorage.setItem("loginDetails", JSON.stringify(userDetails));

      // Set cookies for cross-app synchronization
      document.cookie = `AccessToken=${token}; path=/; max-age=86400`;
      document.cookie = `loginDetails=${encodeURIComponent(JSON.stringify(userDetails))}; path=/; max-age=86400`;

      CommonToaster("Google login successful!", "success");

      if (userDetails?.role_id === 1) {
        navigate("/admin");
      } else {
        const profileCheck = await isProfileUpdated({ email: response.data.user.email });
        navigate(profileCheck?.data?.data === true ? "/" : "/profiledetails");
      }
    } catch (error) {
      console.error("Google Login Error", error);
      CommonToaster("Google login failed.", "error");
    }
  };

  return (
    <div className="loginpage_container">
      <div className="floating_circle1"></div>
      <div className="floating_circle2"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="login_main_container"
      >
        <Row>
          <Col xs={24} lg={13}>
            <div className="login_form_side">
              <div className="login_header">
                <Title level={1} className="premium-title">Welcome Back</Title>
                <Text className="premium-subtitle">Enter your credentials to access your account</Text>
              </div>

              <Form layout="vertical" className="login_form" onFinish={handleSubmit}>
                <CommonInputField
                  label="Email Address"
                  mandatory={true}
                  placeholder="john@example.com"
                  prefix={<MailOutlined />}
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value, emailValidator)}
                  error={errors.email}
                />

                <CommonPasswordField
                  label="Password"
                  mandatory={true}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value, passwordValidator)}
                  error={errors.password}
                />

                <div className="login-options-row">
                  <Checkbox checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}>
                    Remember me
                  </Checkbox>
                  <Link className="forgot-link" onClick={() => setIsModalOpen(true)}>Forgot password?</Link>
                </div>

                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  className="premium-login-btn"
                  loading={isLoading}
                >
                  {isLoading ? "Authenticating..." : "Sign In"} <ArrowRightOutlined />
                </Button>

                <Divider className="social-divider">or continue with</Divider>

                <div className="social-btns-container">
                  <GoogleLogin
                    onSuccess={handleGoogleLogin}
                    onError={() => CommonToaster("Google login failed", "error")}
                    theme="outline"
                    shape="pill"
                  />
                </div>
              </Form>
            </div>
          </Col>

          <Col xs={0} lg={11}>
            <div className="login_visual_side">
              <div className="visual-overlay"></div>
              <div className="visual-header">
                <div className="mini-badge">
                  <ThunderboltFilled /> <span>The Future of Hiring</span>
                </div>
                <h2 className="visual-title">Accelerate Your Career with AI-Powered Matching</h2>
                <p className="visual-desc">Connect with over 10,000+ top companies and find your dream role today.</p>
              </div>

              <div className="illustration-box">
                <img src={getImageUrl(loginImage)} alt="Login" />
              </div>

              <div className="login-stats-card">
                <div className="stat-item">
                  <span className="stat-val">25k+</span>
                  <span className="stat-lab">Users</span>
                </div>
                <div className="stat-item">
                  <span className="stat-val">500+</span>
                  <span className="stat-lab">Hiring Partners</span>
                </div>
                <div className="stat-item">
                  <span className="stat-val">98%</span>
                  <span className="stat-lab">Success Rate</span>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </motion.div>

      <Modal
        title="Reset Password"
        open={isModalOpen}
        onCancel={() => { setIsModalOpen(false); setModalStep(1); }}
        footer={null}
        className="premium-modal"
        centered
        width={500}
        maskClosable={false}
      >
        <div style={{ padding: '10px 0' }}>
          <AnimatePresence mode="wait">
            {modalStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 25, fontSize: 15 }}>Enter your email to receive a verification code.</Text>
                <CommonInputField
                  label="Registered Email"
                  mandatory={true}
                  placeholder="Enter your registered email"
                  value={modalData.email}
                  onChange={(e) => setModalData({ ...modalData, email: e.target.value })}
                  error={errors.modalEmail}
                />
                <button
                  className="modal-action-btn"
                  disabled={modalLoading}
                  onClick={async () => {
                    const err = emailValidator(modalData.email);
                    if (err) { setErrors({ modalEmail: err }); return; }
                    try {
                      setModalLoading(true);
                      await sendOtp({ email: modalData.email });
                      CommonToaster("OTP sent successfully", "success");
                      setModalStep(2);
                    } catch (e) {
                      CommonToaster("Failed to send OTP", "error");
                    } finally { setModalLoading(false); }
                  }}
                >
                  {modalLoading ? "Sending Code..." : "Send Verification Code"}
                </button>
              </motion.div>
            )}

            {modalStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="otp-display-container">
                  <Text type="secondary" style={{ textAlign: 'center', fontSize: 15 }}>Enter the 6-digit code sent to <b>{modalData.email}</b></Text>
                  <Input.OTP size="large" value={modalData.otp} onChange={(val) => setModalData({ ...modalData, otp: val })} />
                </div>
                <button
                  className="modal-action-btn"
                  disabled={modalLoading}
                  onClick={async () => {
                    if (modalData.otp.length < 6) { CommonToaster("Enter full OTP", "error"); return; }
                    try {
                      setModalLoading(true);
                      await verifyOtp({ email: modalData.email, otp: modalData.otp });
                      setModalStep(3);
                    } catch (e) {
                      CommonToaster("Invalid OTP", "error");
                    } finally { setModalLoading(false); }
                  }}
                >
                  {modalLoading ? "Verifying..." : "Verify Code"}
                </button>
                <div style={{ textAlign: 'center', marginTop: 20 }}>
                  <Link style={{ fontSize: 14, fontWeight: 500 }} onClick={() => setModalStep(1)}>Back to Email</Link>
                </div>
              </motion.div>
            )}

            {modalStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 15, fontSize: 15 }}>Create a strong new password for your account.</Text>
                <CommonPasswordField
                  label="New Password"
                  mandatory={true}
                  placeholder="••••••••"
                  value={modalData.newPassword}
                  onChange={(e) => setModalData({ ...modalData, newPassword: e.target.value })}
                />
                <CommonPasswordField
                  label="Confirm Password"
                  mandatory={true}
                  placeholder="••••••••"
                  value={modalData.confirmPassword}
                  onChange={(e) => setModalData({ ...modalData, confirmPassword: e.target.value })}
                />
                <button
                  className="modal-action-btn"
                  disabled={modalLoading}
                  onClick={async () => {
                    const passErr = passwordValidator(modalData.newPassword);
                    const confErr = confirmPasswordValidation(modalData.newPassword, modalData.confirmPassword);
                    if (passErr || confErr) { CommonToaster(passErr || confErr, "error"); return; }
                    try {
                      setModalLoading(true);
                      await forgotPassword({ email: modalData.email, password: modalData.newPassword });
                      CommonToaster("Password reset successful", "success");
                      setIsModalOpen(false);
                      setModalStep(1);
                    } catch (e) {
                      CommonToaster("Failed to reset password", "error");
                    } finally { setModalLoading(false); }
                  }}
                >
                  {modalLoading ? "Updating..." : "Reset Password"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Modal>
    </div>
  );
};

export default LoginPage;
