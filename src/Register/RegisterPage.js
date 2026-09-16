'use client';
import React, { useState } from "react";
import {
  Button,
  Typography,
  Col,
  Row,
} from "antd";
import { CommonToaster } from "../Common/CommonToaster";
import {
  MailOutlined,
  UserOutlined,
  PhoneOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  LockOutlined,
  CheckCircleFilled,
  ThunderboltFilled,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import "../css/RegisterPage.css";
import loginImage from "../images/hire-fresher.png";
import { useNavigate } from "@/routing-shim";
import {
  nameValidator,
  emailValidator,
  passwordValidator,
  phoneValidation,
  confirmPasswordValidation,
} from "../Common/Validation";
import { getImageUrl } from "../utils/getImageUrl";
import CommonInputField from "../Common/CommonInputField";
import CommonPasswordField from "../Common/CommonPasswordField";
import { register } from "../ApiService/action";

const { Title, Text } = Typography;

const RegisterPage = () => {
  const navigate = useNavigate();

  // Form States
  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field, value, validator) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validator) {
      setErrors(prev => ({ ...prev, [field]: validator(value) }));
    }
  };

  const validateStep = (step) => {
    let stepErrors = {};
    if (step === 1) {
      stepErrors.fname = nameValidator(formData.fname);
      stepErrors.lname = nameValidator(formData.lname);
      stepErrors.phone = phoneValidation(formData.phone);
    } else if (step === 2) {
      stepErrors.email = emailValidator(formData.email);
    } else if (step === 3) {
      stepErrors.password = passwordValidator(formData.password);
      stepErrors.confirmPassword = confirmPasswordValidation(formData.password, formData.confirmPassword);
    }

    setErrors(prev => ({ ...prev, ...stepErrors }));
    return !Object.values(stepErrors).some(error => error !== "");
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => setCurrentStep(prev => prev - 1);

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    const registerload = {
      first_name: formData.fname,
      last_name: formData.lname,
      phone_code: "+91",
      phone: formData.phone,
      email: formData.email,
      password: formData.password,
      organization: null,
      organization_type_id: null,
      role_id: 2,
    };

    try {
      setIsLoading(true);
      await register(registerload);

      setTimeout(() => {
        setIsLoading(false);
        CommonToaster("Candidate registered successfully!", "success");
        navigate("/login");
      }, 1000);
    } catch (error) {
      setIsLoading(false);
      const errorMsg = error.response?.data?.details || error.response?.data?.message || error.message || "Registration failed.";
      CommonToaster(errorMsg, "error");
    }
  };

  const steps = [
    { title: "Basic Info", icon: <UserOutlined /> },
    { title: "Account", icon: <MailOutlined /> },
    { title: "Security", icon: <LockOutlined /> },
  ];

  return (
    <div className="register-page-wrapper">
      <div className="background-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="register-main-container"
      >
        <Row>
          <Col xs={24} lg={13}>
            <div className="register-form-side">
              {/* Header */}
              <div className="register-header">
                <Title level={1} className="premium-title">Join CareerFast</Title>
                <Text className="premium-subtitle">Experience a smarter way to get hired.</Text>
              </div>

              {/* Step Progress */}
              <div className="step-progress-bar">
                {steps.map((step, idx) => (
                  <React.Fragment key={idx}>
                    <div className={`step-item ${currentStep > idx + 1 ? "completed" : currentStep === idx + 1 ? "active" : ""}`}>
                      <div className="step-icon-circle">
                        {currentStep > idx + 1 ? <CheckCircleFilled /> : step.icon}
                      </div>
                      <span className="step-label">{step.title}</span>
                    </div>
                    {idx < steps.length - 1 && <div className={`step-line ${currentStep > idx + 1 ? "filled" : ""}`}></div>}
                  </React.Fragment>
                ))}
              </div>

              <div className="form-content-area">
                <AnimatePresence mode="wait">
                  {currentStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="form-step-container"
                    >
                      <div className="form-grid">
                        <CommonInputField
                          label="First Name"
                          mandatory={true}
                          placeholder="John"
                          prefix={<UserOutlined />}
                          value={formData.fname}
                          onChange={(e) => handleInputChange("fname", e.target.value, nameValidator)}
                          error={errors.fname}
                        />
                        <CommonInputField
                          label="Last Name"
                          mandatory={true}
                          placeholder="Doe"
                          prefix={<UserOutlined />}
                          value={formData.lname}
                          onChange={(e) => handleInputChange("lname", e.target.value, nameValidator)}
                          error={errors.lname}
                        />
                        <div className="full-width">
                          <CommonInputField
                            label="Phone Number"
                            mandatory={true}
                            placeholder="9876543210"
                            prefix={<PhoneOutlined />}
                            value={formData.phone}
                            onChange={(e) => handleInputChange("phone", e.target.value, phoneValidation)}
                            error={errors.phone}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="form-step-container"
                    >
                      <div className="full-width">
                        <CommonInputField
                          label="Email Address"
                          mandatory={true}
                          placeholder="john@example.com"
                          prefix={<MailOutlined />}
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value, emailValidator)}
                          error={errors.email}
                        />
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="form-step-container"
                    >
                      <div className="form-grid">
                        <div className="full-width">
                          <CommonPasswordField
                            label="Password"
                            mandatory={true}
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => handleInputChange("password", e.target.value, passwordValidator)}
                            error={errors.password}
                          />
                        </div>
                        <div className="full-width">
                          <CommonPasswordField
                            label="Confirm Password"
                            mandatory={true}
                            placeholder="••••••••"
                            value={formData.confirmPassword}
                            onChange={(e) => handleInputChange("confirmPassword", e.target.value, (val) => confirmPasswordValidation(formData.password, val))}
                            error={errors.confirmPassword}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Navigation Buttons */}
              <div className="register-footer-btns">
                {currentStep > 1 && (
                  <Button
                    className="prev-btn"
                    icon={<ArrowLeftOutlined />}
                    onClick={prevStep}
                  >
                    Back
                  </Button>
                )}

                {currentStep < 3 ? (
                  <Button
                    type="primary"
                    className="next-btn"
                    onClick={nextStep}
                  >
                    Continue <ArrowRightOutlined />
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    className="submit-btn"
                    loading={isLoading}
                    onClick={handleSubmit}
                  >
                    {isLoading ? "Creating Account..." : "Complete Registration"}
                  </Button>
                )}
              </div>
            </div>
          </Col>

          <Col xs={0} lg={11}>
            <div className="register-visual-side">
              <div className="visual-overlay"></div>

              <div className="visual-content-new">
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="visual-header"
                >
                  <div className="mini-badge">
                    <ThunderboltFilled /> <span>The Future of Hiring</span>
                  </div>
                  <Title level={2} style={{ color: 'white', margin: '12px 0 10px', fontSize: '32px', fontWeight: '600' }}>
                    Join the Elite Network of Professionals
                  </Title>
                  <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px', display: 'block', maxWidth: '380px', lineHeight: '1.6' }}>
                    Connect with top companies and accelerate your career growth with our AI-driven job platform.
                  </Text>
                </motion.div>

                <div className="illustration-wrapper">
                  <img src={getImageUrl(loginImage)} alt="Illustration" className="main-illustration" />
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="visual-footer-stats"
                >
                  <div className="stat-item">
                    <span className="stat-value">10k+</span>
                    <span className="stat-label">Jobs Posted</span>
                  </div>
                  <div className="stat-divider"></div>
                  <div className="stat-item">
                    <span className="stat-value">500+</span>
                    <span className="stat-label">Companies</span>
                  </div>
                  <div className="stat-divider"></div>
                  <div className="stat-item">
                    <div className="avatar-group-small">
                      <img src="https://i.pravatar.cc/150?u=1" alt="u1" />
                      <img src="https://i.pravatar.cc/150?u=2" alt="u2" />
                      <div className="avatar-more-small">+5k</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </Col>
        </Row>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
