'use client';
import React, { useState, useEffect } from 'react';
import { register, login, getOrganizationType } from '../ApiService/action';
import { officialEmailValidator } from '../Common/Validation';

export default function HrRecruiter({ onRegisterSuccess, onNavigateLogin }) {
  // Form states
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    workEmail: '',
    phone: '',
    companyName: '',
    orgTypeId: '',
    password: '',
    confirmPassword: '',
    agreeTerms: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [orgTypes, setOrgTypes] = useState([]);
  const [loadingOrgTypes, setLoadingOrgTypes] = useState(false);

  // Fetch dynamic organization types on mount
  useEffect(() => {
    fetchOrgTypes();
  }, []);

  const fetchOrgTypes = async () => {
    try {
      setLoadingOrgTypes(true);
      const res = await getOrganizationType();
      const list = res?.data?.data || res?.data || [];
      if (Array.isArray(list) && list.length > 0) {
        setOrgTypes(list);
      } else {
        // Fallback default list if API array is empty
        setOrgTypes([
          { id: 1, name: 'IT / Software Services' },
          { id: 2, name: 'Banking & Financial Services (BFSI)' },
          { id: 3, name: 'Healthcare & Pharmaceuticals' },
          { id: 4, name: 'E-Commerce & Retail' },
          { id: 5, name: 'Manufacturing & Engineering' },
          { id: 6, name: 'Education & EdTech' },
          { id: 7, name: 'Consulting & Professional Services' },
        ]);
      }
    } catch (err) {
      console.warn('Organization types fetch warning:', err);
      setOrgTypes([
        { id: 1, name: 'IT / Software Services' },
        { id: 2, name: 'Banking & Financial Services (BFSI)' },
        { id: 3, name: 'Healthcare & Pharmaceuticals' },
        { id: 4, name: 'E-Commerce & Retail' },
        { id: 5, name: 'Manufacturing & Engineering' },
        { id: 6, name: 'Education & EdTech' },
        { id: 7, name: 'Consulting & Professional Services' },
      ]);
    } finally {
      setLoadingOrgTypes(false);
    }
  };

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const validate = () => {
    const errs = {};

    if (!formData.firstName.trim()) {
      errs.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      errs.firstName = 'Minimum 2 characters';
    }

    if (!formData.lastName.trim()) {
      errs.lastName = 'Last name is required';
    }

    const emailErr = officialEmailValidator(formData.workEmail);
    if (emailErr) {
      errs.workEmail = emailErr;
    }

    if (!formData.phone.trim()) {
      errs.phone = 'Phone number is required';
    } else if (!/^[0-9]{10}$/.test(formData.phone.trim().replace(/\D/g, ''))) {
      errs.phone = 'Enter a valid 10-digit phone number';
    }

    if (!formData.companyName.trim()) {
      errs.companyName = 'Company name is required';
    }

    if (!formData.orgTypeId) {
      errs.orgTypeId = 'Please select your industry type';
    }

    if (!formData.password) {
      errs.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      errs.confirmPassword = 'Confirm your password';
    } else if (formData.confirmPassword !== formData.password) {
      errs.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreeTerms) {
      errs.agreeTerms = 'You must accept the terms & conditions';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validate()) return;

    setIsLoading(true);

    const cleanPhone = formData.phone.trim().replace(/\D/g, '').slice(-10);
    const payload = {
      first_name: formData.firstName.trim(),
      last_name: formData.lastName.trim(),
      phone_code: '+91',
      phone: cleanPhone,
      email: formData.workEmail.trim().toLowerCase(),
      password: formData.password,
      organization: formData.companyName.trim(),
      organization_type_id: Number(formData.orgTypeId) || 1,
      role_id: 3, // Role 3 is explicitly RECRUITER in database
    };

    try {
      if (typeof onRegisterSuccess === 'function') {
        await onRegisterSuccess(payload);
      } else {
        const response = await register(payload);

        if (!response?.data?.success && response?.status !== 200 && response?.status !== 201) {
          throw new Error(response?.data?.message || 'Registration failed. Please check your information.');
        }

        showToast('Recruiter account created successfully! Logging you in...', 'success');

        // Auto-login to streamline onboarding directly into recruiter portal
        try {
          const fcm_token = typeof window !== 'undefined' ? localStorage.getItem('fcm_token') : null;
          const loginRes = await login({
            email: payload.email,
            password: payload.password,
            role_id: 3,
            fcm_token: fcm_token || null,
          });

          if (loginRes?.data?.token) {
            const token = loginRes.data.token;
            const recruiterDetails = loginRes.data.data?.[0];

            localStorage.setItem('AccessToken', token);
            localStorage.setItem('loginDetails', JSON.stringify(recruiterDetails));
            document.cookie = `AccessToken=${token}; path=/; max-age=86400`;
            document.cookie = `loginDetails=${encodeURIComponent(JSON.stringify(recruiterDetails))}; path=/; max-age=86400`;

            setTimeout(() => {
              window.location.href = '/create-profile';
            }, 900);
            return;
          }
        } catch (loginErr) {
          console.warn('Auto-login notice:', loginErr);
        }

        // Fallback redirect to recruiter login
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }, 1200);
      }
    } catch (error) {
      console.error('Recruiter registration error:', error);
      const backendError =
        error?.response?.data?.details ||
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        '';

      if (backendError.toLowerCase().includes('email already')) {
        showToast('This work email is already registered. Please sign in instead.', 'error');
      } else if (backendError.toLowerCase().includes('phone')) {
        showToast('This phone number is already associated with an account.', 'error');
      } else if (backendError) {
        showToast(backendError, 'error');
      } else {
        showToast('Unable to complete registration. Please check your details.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    showToast(`Redirecting to ${provider} recruiter registration...`, 'info');
  };

  return (
    <div className="hl-screen">
      {/* Styles matching HrLogin */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .hl-screen {
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          min-height: 100vh;
          width: 100%;
          display: flex;
          background-color: #f8fafc;
          color: #0f172a;
          box-sizing: border-box;
          overflow-x: hidden;
        }

        .hl-screen * {
          box-sizing: border-box;
        }

        .cursive-font {
          font-family: 'Caveat', cursive, sans-serif !important;
        }

        /* LEFT PANE: 64% width with background image */
        .hl-left-pane {
          flex: 1.68;
          min-height: 100vh;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 38px 45px 32px 90px;
          background-image: url('/recruiter_bg.jpg');
          background-size: cover;
          background-position: 55% center;
          background-repeat: no-repeat;
          overflow: hidden;
        }

        .hl-left-content {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          height: 100%;
          justify-content: space-between;
        }

        /* Top Header & Headlines */
        .hl-tag-recruiter {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.16em;
          color: #64748b;
          text-transform: uppercase;
          margin-bottom: 10px;
          display: inline-block;
        }

        .hl-title-main {
          font-size: 42px;
          font-weight: 800;
          line-height: 1.12;
          letter-spacing: -0.03em;
          color: #0f172a;
          margin: 0 0 12px 0;
        }

        .hl-title-main .hl-blue {
          color: #2563eb;
        }

        .hl-sub-desc {
          font-size: 18px;
          line-height: 1.5;
          color: #475569;
          max-width: 420px;
          margin: 0 0 24px 0;
        }

        /* Middle Area: 4 Bullets on left, ATS Card on right */
        .hl-middle-section {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 20px;
        }

        /* 4 Key Features */
        .hl-features-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-width: 360px;
        }

        .hl-feature-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .hl-feature-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: #eff6ff;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 2px 5px rgba(37, 99, 235, 0.08);
        }

        .hl-feature-details h4 {
          margin: 0 0 2px 0;
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.25;
        }

        .hl-feature-details p {
          margin: 0;
          font-size: 14px;
          color: #64748b;
          line-height: 1.35;
        }

        /* Floating ATS Candidate Pipeline Card */
        .hl-ats-float-card {
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(226, 232, 240, 0.9);
          border-radius: 16px;
          padding: 12px 14px;
          width: 225px;
          box-shadow: 0 16px 36px -6px rgba(15, 23, 42, 0.16);
          flex-shrink: 0;
          margin-bottom: 12px;
          margin-right: 12px;
          transition: transform 0.2s ease;
        }

        .hl-ats-float-card:hover {
          transform: translateY(-2px);
        }

        .hl-ats-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 0;
          border-bottom: 1px solid #f1f5f9;
        }

        .hl-ats-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .hl-ats-user {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .hl-ats-avatar-wrap {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          overflow: hidden;
          background: #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
          color: #334155;
          flex-shrink: 0;
        }

        .hl-ats-avatar-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .hl-ats-meta h5 {
          margin: 0;
          font-size: 11px;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.2;
        }

        .hl-ats-meta span {
          font-size: 9px;
          color: #64748b;
          display: block;
        }

        .hl-status-pill {
          font-size: 8.5px;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 999px;
        }

        .hl-status-pill.shortlisted {
          background-color: #ecfdf5;
          color: #059669;
          border: 1px solid #a7f3d0;
        }

        .hl-status-pill.interview {
          background-color: #eff6ff;
          color: #2563eb;
          border: 1px solid #bfdbfe;
        }

        .hl-status-pill.applied {
          background-color: #f1f5f9;
          color: #475569;
          border: 1px solid #e2e8f0;
        }

        /* Bottom Row: Handwritten Script + 3 Metrics Cards */
        .hl-bottom-section {
          display: flex;
          align-items: center;
          gap: 24px;
          margin-top: 8px;
        }

        .hl-script-possibilities {
          font-size: 32px;
          line-height: 1.05;
          font-weight: 700;
          color: #1d4ed8;
          transform: rotate(-3deg);
          flex-shrink: 0;
          display: inline-block;
        }

        .hl-script-possibilities svg {
          display: block;
          width: 86px;
          height: 12px;
          margin-top: 3px;
        }

        /* 3 Metrics Cards */
        .hl-metrics-stack {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .hl-metric-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(226, 232, 240, 0.9);
          border-radius: 12px;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
        }

        .hl-metric-icon-box {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: #eff6ff;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .hl-metric-text strong {
          display: block;
          font-size: 15px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.1;
        }

        .hl-metric-text span {
          font-size: 10px;
          font-weight: 600;
          color: #64748b;
          white-space: nowrap;
        }

        /* RIGHT PANE: Clean, Modern SaaS Auth Panel */
        .hl-right-pane {
          flex: 1.25;
          min-height: 100vh;
          background-color: #f8fafc;
          border-left: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
          padding: 24px 36px 20px;
          position: relative;
          overflow-y: auto;
        }

        /* Soft Aurora Mesh Glow */
        .hl-aurora-bg {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 1;
        }

        .hl-aurora-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(85px);
          opacity: 0.7;
          will-change: transform, opacity;
          pointer-events: none;
        }

        .hl-aurora-1 {
          width: 480px;
          height: 480px;
          top: -120px;
          right: -90px;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.16) 0%, rgba(96, 165, 250, 0.08) 50%, transparent 70%);
          animation: hlAuroraDrift1 22s ease-in-out infinite alternate;
        }

        .hl-aurora-2 {
          width: 450px;
          height: 450px;
          bottom: -100px;
          left: -100px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(167, 139, 250, 0.07) 50%, transparent 70%);
          animation: hlAuroraDrift2 25s ease-in-out infinite alternate;
        }

        .hl-aurora-3 {
          width: 400px;
          height: 400px;
          top: 30%;
          left: 45%;
          background: radial-gradient(circle, rgba(14, 165, 233, 0.11) 0%, rgba(224, 231, 255, 0.05) 55%, transparent 70%);
          animation: hlAuroraDrift3 20s ease-in-out infinite alternate;
        }

        .hl-aurora-4 {
          width: 350px;
          height: 350px;
          top: 65%;
          right: -50px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, transparent 70%);
          animation: hlAuroraDrift4 24s ease-in-out infinite alternate;
        }

        @keyframes hlAuroraDrift1 {
          0% { transform: translate(0px, 0px) scale(1); opacity: 0.6; }
          50% { transform: translate(-35px, 45px) scale(1.12); opacity: 0.82; }
          100% { transform: translate(25px, 25px) scale(0.95); opacity: 0.55; }
        }

        @keyframes hlAuroraDrift2 {
          0% { transform: translate(0px, 0px) scale(1); opacity: 0.55; }
          50% { transform: translate(45px, -40px) scale(1.1); opacity: 0.78; }
          100% { transform: translate(-25px, -20px) scale(0.92); opacity: 0.5; }
        }

        @keyframes hlAuroraDrift3 {
          0% { transform: translate(0px, 0px) scale(0.95); opacity: 0.5; }
          50% { transform: translate(-30px, -30px) scale(1.14); opacity: 0.72; }
          100% { transform: translate(30px, 20px) scale(1); opacity: 0.45; }
        }

        @keyframes hlAuroraDrift4 {
          0% { transform: translate(0px, 0px) scale(1); opacity: 0.45; }
          50% { transform: translate(-30px, -35px) scale(1.12); opacity: 0.68; }
          100% { transform: translate(20px, 20px) scale(0.92); opacity: 0.45; }
        }

        /* Top Right: Need Help */
        .hl-top-help-row {
          width: 100%;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          position: relative;
          z-index: 2;
          margin-bottom: 12px;
        }

        .hl-help-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13.5px;
          font-weight: 600;
          color: #64748b;
          text-decoration: none;
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px 12px;
          border-radius: 8px;
          transition: all 0.15s ease;
        }

        .hl-help-link:hover {
          color: #1e293b;
          background-color: #f1f5f9;
        }

        .hl-help-icon {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 1.5px solid currentColor;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
        }

        /* Crisp White Sign Up Card */
        .hl-signup-box {
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-radius: 20px;
          width: 100%;
          max-width: 480px;
          padding: 24px 30px 22px;
          color: #0f172a;
          border: 1px solid rgba(226, 232, 240, 0.9);
          box-shadow: 0 20px 45px -12px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.03);
          position: relative;
          z-index: 2;
          margin-bottom: 16px;
        }

        .hl-form-title {
          font-size: 27px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 5px 0;
          letter-spacing: -0.025em;
        }

        .hl-form-subtitle {
          font-size: 13px;
          color: #64748b;
          margin: 0 0 20px 0;
          line-height: 1.45;
        }

        .hl-form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .hl-form-item {
          margin-bottom: 14px;
        }

        .hl-input-lbl {
          display: block;
          font-size: 12.5px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 5px;
        }

        .hl-input-lbl .hl-req {
          color: #ef4444;
          margin-left: 2px;
        }

        .hl-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .hl-prefix-icon {
          position: absolute;
          left: 13px;
          color: #94a3b8;
          display: flex;
          align-items: center;
          pointer-events: none;
        }

        .hl-custom-input,
        .hl-custom-select {
          width: 100%;
          height: 44px;
          padding: 0 14px 0 38px;
          font-size: 13.5px;
          font-family: inherit;
          color: #0f172a;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          outline: none;
          transition: all 0.2s ease;
        }

        .hl-custom-select {
          appearance: none;
          background-image: url("data:image/svg2+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 12px center;
          background-size: 16px;
          cursor: pointer;
        }

        .hl-custom-input::placeholder {
          color: #94a3b8;
          font-size: 13px;
        }

        .hl-custom-input:hover,
        .hl-custom-select:hover {
          border-color: #cbd5e1;
        }

        .hl-custom-input:focus,
        .hl-custom-select:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3.5px rgba(37, 99, 235, 0.12);
        }

        .hl-custom-input.err-border,
        .hl-custom-select.err-border {
          border-color: #ef4444;
          background-color: #fffafa;
        }

        .hl-password-toggle {
          position: absolute;
          right: 10px;
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 5px;
          border-radius: 6px;
          transition: color 0.15s;
        }

        .hl-password-toggle:hover {
          color: #1e293b;
        }

        .hl-error-caption {
          font-size: 11px;
          color: #ef4444;
          margin-top: 4px;
        }

        /* Checkbox row */
        .hl-terms-row {
          margin: 12px 0 18px;
        }

        .hl-checkbox-container {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 12.5px;
          color: #475569;
          cursor: pointer;
          user-select: none;
          line-height: 1.4;
        }

        .hl-checkbox-container input {
          width: 16px;
          height: 16px;
          margin-top: 2px;
          border: 1.5px solid #cbd5e1;
          border-radius: 4px;
          cursor: pointer;
          accent-color: #2563eb;
          flex-shrink: 0;
        }

        .hl-terms-link {
          color: #2563eb;
          text-decoration: none;
          font-weight: 600;
        }

        .hl-terms-link:hover {
          text-decoration: underline;
        }

        /* Register Button */
        .hl-submit-btn {
          width: 100%;
          height: 48px;
          background: #2563eb;
          color: #ffffff;
          border: none;
          border-radius: 12px;
          font-size: 14.5px;
          font-weight: 600;
          font-family: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
        }

        .hl-submit-btn:hover:not(:disabled) {
          background-color: #1d4ed8;
          box-shadow: 0 6px 18px rgba(37, 99, 235, 0.35);
          transform: translateY(-1px);
        }

        .hl-submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .hl-submit-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          box-shadow: none;
        }

        /* OR Divider */
        .hl-divider-bar {
          display: flex;
          align-items: center;
          margin: 18px 0 14px;
          gap: 12px;
        }

        .hl-divider-segment {
          flex: 1;
          height: 1px;
          background-color: #e2e8f0;
        }

        .hl-divider-caption {
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          letter-spacing: 0.05em;
        }

        /* Social SSO Buttons */
        .hl-social-pair {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 18px;
        }

        .hl-social-tile {
          height: 42px;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 0 10px;
          font-size: 12.5px;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .hl-social-tile:hover {
          background-color: #f8fafc;
          border-color: #cbd5e1;
          transform: translateY(-1px);
          box-shadow: 0 3px 8px rgba(15, 23, 42, 0.04);
        }

        .hl-registration-prompt {
          text-align: center;
          font-size: 13px;
          color: #64748b;
        }

        .hl-signup-action {
          font-weight: 700;
          color: #2563eb;
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
          margin-left: 4px;
          font-size: inherit;
          transition: color 0.15s;
        }

        .hl-signup-action:hover {
          color: #1d4ed8;
          text-decoration: underline;
        }

        /* Bottom Security Footnote */
        .hl-right-footnote {
          font-size: 11.5px;
          color: #94a3b8;
          display: flex;
          align-items: center;
          gap: 6px;
          position: relative;
          z-index: 2;
          margin-top: auto;
          padding-top: 10px;
        }

        /* Toast Popup */
        .hl-toast {
          position: fixed;
          top: 24px;
          right: 24px;
          padding: 12px 20px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          z-index: 1000;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .hl-toast.success { background-color: #10b981; }
        .hl-toast.error { background-color: #ef4444; }
        .hl-toast.info { background-color: #2563eb; }

        /* Responsive */
        @media (max-width: 1180px) {
          .hl-screen {
            flex-direction: column;
          }
          .hl-left-pane {
            min-height: auto;
            padding: 36px 28px;
          }
          .hl-right-pane {
            min-height: auto;
            padding: 36px 20px;
          }
          .hl-middle-section {
            flex-direction: column;
            align-items: flex-start;
          }
          .hl-ats-float-card {
            margin: 16px 0;
          }
          .hl-bottom-section {
            flex-wrap: wrap;
          }
        }

        @media (max-width: 640px) {
          .hl-form-grid-2 {
            grid-template-columns: 1fr;
          }
          .hl-social-pair {
            grid-template-columns: 1fr;
          }
          .hl-signup-box {
            padding: 24px 18px;
          }
        }
      `}</style>

      {/* Toast Alert */}
      {toastMessage && (
        <div className={`hl-toast ${toastMessage.type}`}>
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* LEFT PANE: Full-Bleed Background + Content Overlay (Same as HrLogin) */}
      <section className="hl-left-pane">
        <div className="hl-left-content">
          {/* Top Section: Category & Headline */}
          <div>
            <span className="hl-tag-recruiter">FOR RECRUITERS</span>
            <h1 className="hl-title-main">
              Hire Smarter.<br />
              Build <span className="hl-blue">Stronger Teams.</span>
            </h1>
            <p className="hl-sub-desc">
              Connect with top talent, manage your hiring process and grow your organization — all in one place.
            </p>

            {/* Middle Section: 4 Bullets on left, ATS Card on right */}
            <div className="hl-middle-section">
              {/* 4 Feature Bullets */}
              <div className="hl-features-list">
                <div className="hl-feature-row">
                  <div className="hl-feature-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <div className="hl-feature-details">
                    <h4>Access Top Talent</h4>
                    <p>Find and connect with qualified candidates faster.</p>
                  </div>
                </div>

                <div className="hl-feature-row">
                  <div className="hl-feature-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  </div>
                  <div className="hl-feature-details">
                    <h4>Streamline Hiring</h4>
                    <p>Manage jobs, applications and interviews in one place.</p>
                  </div>
                </div>

                <div className="hl-feature-row">
                  <div className="hl-feature-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                  </div>
                  <div className="hl-feature-details">
                    <h4>Data-Driven Decisions</h4>
                    <p>Get insights that help you hire smarter.</p>
                  </div>
                </div>

                <div className="hl-feature-row">
                  <div className="hl-feature-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                  </div>
                  <div className="hl-feature-details">
                    <h4>Secure & Reliable</h4>
                    <p>Your data and hiring process are always safe with us.</p>
                  </div>
                </div>
              </div>

              {/* Floating ATS Candidate Pipeline Card */}
              <div className="hl-ats-float-card">
                <div className="hl-ats-row">
                  <div className="hl-ats-user">
                    <div className="hl-ats-avatar-wrap">
                      <img
                        src="/images/priya.jpg"
                        alt="Priya Nair"
                        onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerText = 'PN'; }}
                      />
                    </div>
                    <div className="hl-ats-meta">
                      <h5>Priya Nair</h5>
                      <span>Software Engineer</span>
                    </div>
                  </div>
                  <span className="hl-status-pill shortlisted">Shortlisted</span>
                </div>

                <div className="hl-ats-row">
                  <div className="hl-ats-user">
                    <div className="hl-ats-avatar-wrap">
                      <img
                        src="/images/arjun.jpg"
                        alt="Arjun Menon"
                        onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerText = 'AM'; }}
                      />
                    </div>
                    <div className="hl-ats-meta">
                      <h5>Arjun Menon</h5>
                      <span>Product Designer</span>
                    </div>
                  </div>
                  <span className="hl-status-pill interview">Interview</span>
                </div>

                <div className="hl-ats-row">
                  <div className="hl-ats-user">
                    <div className="hl-ats-avatar-wrap">
                      <img
                        src="/images/sneha.jpg"
                        alt="Sneha Varghese"
                        onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerText = 'SV'; }}
                      />
                    </div>
                    <div className="hl-ats-meta">
                      <h5>Sneha Varghese</h5>
                      <span>Data Analyst</span>
                    </div>
                  </div>
                  <span className="hl-status-pill applied">Applied</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section: Handwritten Script + 3 Metrics Cards */}
          <div className="hl-bottom-section">
            <div className="hl-script-possibilities cursive-font">
              People<br />Build Possibilities
              <svg viewBox="0 0 86 12" fill="none">
                <path d="M2 5 C 28 12, 58 10, 84 3" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>

            <div className="hl-metrics-stack">
              <div className="hl-metric-card">
                <div className="hl-metric-icon-box">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div className="hl-metric-text">
                  <strong>10K+</strong>
                  <span>Active Candidates</span>
                </div>
              </div>

              <div className="hl-metric-card">
                <div className="hl-metric-icon-box">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="2" width="16" height="20" rx="2" />
                    <line x1="9" y1="22" x2="9" y2="2" />
                    <path d="M14 6h2" /><path d="M14 10h2" /><path d="M14 14h2" /><path d="M14 18h2" />
                  </svg>
                </div>
                <div className="hl-metric-text">
                  <strong>500+</strong>
                  <span>Hiring Companies</span>
                </div>
              </div>

              <div className="hl-metric-card">
                <div className="hl-metric-icon-box">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                <div className="hl-metric-text">
                  <strong>3x</strong>
                  <span>Faster Hiring</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RIGHT PANE: Clean, Modern SaaS Recruiter Sign Up Panel */}
      <section className="hl-right-pane">
        {/* Soft Aurora Mesh Glow Background */}
        <div className="hl-aurora-bg" aria-hidden="true">
          <div className="hl-aurora-blob hl-aurora-1"></div>
          <div className="hl-aurora-blob hl-aurora-2"></div>
          <div className="hl-aurora-blob hl-aurora-3"></div>
          <div className="hl-aurora-blob hl-aurora-4"></div>
        </div>

        {/* Top Right: Need Help */}
        <div className="hl-top-help-row">
          <button
            type="button"
            className="hl-help-link"
            onClick={() => showToast('For assistance, email support@careerfast.com', 'info')}
          >
            <span>Need help?</span>
            <span className="hl-help-icon">?</span>
          </button>
        </div>

        {/* Crisp White Sign Up Card */}
        <div className="hl-signup-box">
          <h2 className="hl-form-title">Join as a Recruiter</h2>
          <p className="hl-form-subtitle">
            Create your organization account to post jobs and discover top talent.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            {/* First & Last Name (Grid 2 cols) */}
            <div className="hl-form-grid-2">
              <div className="hl-form-item">
                <label className="hl-input-lbl" htmlFor="firstName">
                  First Name<span className="hl-req">*</span>
                </label>
                <div className="hl-input-wrapper">
                  <span className="hl-prefix-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <input
                    id="firstName"
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={(e) => {
                      setFormData({ ...formData, firstName: e.target.value });
                      if (errors.firstName) setErrors({ ...errors, firstName: null });
                    }}
                    placeholder="Jane"
                    className={`hl-custom-input ${errors.firstName ? 'err-border' : ''}`}
                    autoComplete="given-name"
                  />
                </div>
                {errors.firstName && <div className="hl-error-caption">{errors.firstName}</div>}
              </div>

              <div className="hl-form-item">
                <label className="hl-input-lbl" htmlFor="lastName">
                  Last Name<span className="hl-req">*</span>
                </label>
                <div className="hl-input-wrapper">
                  <span className="hl-prefix-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <input
                    id="lastName"
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={(e) => {
                      setFormData({ ...formData, lastName: e.target.value });
                      if (errors.lastName) setErrors({ ...errors, lastName: null });
                    }}
                    placeholder="Doe"
                    className={`hl-custom-input ${errors.lastName ? 'err-border' : ''}`}
                    autoComplete="family-name"
                  />
                </div>
                {errors.lastName && <div className="hl-error-caption">{errors.lastName}</div>}
              </div>
            </div>

            {/* Official Work Email */}
            <div className="hl-form-item">
              <label className="hl-input-lbl" htmlFor="workEmail">
                Official Work Email<span className="hl-req">*</span>
              </label>
              <div className="hl-input-wrapper">
                <span className="hl-prefix-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </span>
                <input
                  id="workEmail"
                  type="email"
                  name="workEmail"
                  value={formData.workEmail}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ ...formData, workEmail: val });
                    const err = officialEmailValidator(val);
                    setErrors({ ...errors, workEmail: err || null });
                  }}
                  onBlur={() => {
                    const err = officialEmailValidator(formData.workEmail);
                    if (err) setErrors({ ...errors, workEmail: err });
                  }}
                  placeholder="name@company.com"
                  className={`hl-custom-input ${errors.workEmail ? 'err-border' : ''}`}
                  autoComplete="email"
                />
              </div>
              {errors.workEmail && <div className="hl-error-caption">{errors.workEmail}</div>}
            </div>

            {/* Phone & Company Name (Grid 2 cols) */}
            <div className="hl-form-grid-2">
              <div className="hl-form-item">
                <label className="hl-input-lbl" htmlFor="phone">
                  Phone Number<span className="hl-req">*</span>
                </label>
                <div className="hl-input-wrapper">
                  <span className="hl-prefix-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </span>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value });
                      if (errors.phone) setErrors({ ...errors, phone: null });
                    }}
                    placeholder="9876543210"
                    className={`hl-custom-input ${errors.phone ? 'err-border' : ''}`}
                    autoComplete="tel"
                  />
                </div>
                {errors.phone && <div className="hl-error-caption">{errors.phone}</div>}
              </div>

              <div className="hl-form-item">
                <label className="hl-input-lbl" htmlFor="companyName">
                  Company / Organization<span className="hl-req">*</span>
                </label>
                <div className="hl-input-wrapper">
                  <span className="hl-prefix-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
                      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
                      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
                      <path d="M10 6h4" /><path d="M10 10h4" /><path d="M10 14h4" /><path d="M10 18h4" />
                    </svg>
                  </span>
                  <input
                    id="companyName"
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={(e) => {
                      setFormData({ ...formData, companyName: e.target.value });
                      if (errors.companyName) setErrors({ ...errors, companyName: null });
                    }}
                    placeholder="Acme Corp"
                    className={`hl-custom-input ${errors.companyName ? 'err-border' : ''}`}
                    autoComplete="organization"
                  />
                </div>
                {errors.companyName && <div className="hl-error-caption">{errors.companyName}</div>}
              </div>
            </div>

            {/* Dynamic Organization Type / Industry */}
            <div className="hl-form-item">
              <label className="hl-input-lbl" htmlFor="orgTypeId">
                Industry / Organization Type<span className="hl-req">*</span>
              </label>
              <div className="hl-input-wrapper">
                <span className="hl-prefix-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                </span>
                <select
                  id="orgTypeId"
                  name="orgTypeId"
                  value={formData.orgTypeId}
                  onChange={(e) => {
                    setFormData({ ...formData, orgTypeId: e.target.value });
                    if (errors.orgTypeId) setErrors({ ...errors, orgTypeId: null });
                  }}
                  className={`hl-custom-select ${errors.orgTypeId ? 'err-border' : ''}`}
                  disabled={loadingOrgTypes}
                >
                  <option value="">Select Industry / Type</option>
                  {orgTypes.map((ot) => (
                    <option key={ot.id} value={ot.id}>
                      {ot.name}
                    </option>
                  ))}
                </select>
              </div>
              {errors.orgTypeId && <div className="hl-error-caption">{errors.orgTypeId}</div>}
            </div>

            {/* Password & Confirm Password (Grid 2 cols) */}
            <div className="hl-form-grid-2">
              <div className="hl-form-item">
                <label className="hl-input-lbl" htmlFor="password">
                  Password<span className="hl-req">*</span>
                </label>
                <div className="hl-input-wrapper">
                  <span className="hl-prefix-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      if (errors.password) setErrors({ ...errors, password: null });
                    }}
                    placeholder="Min 6 chars"
                    className={`hl-custom-input ${errors.password ? 'err-border' : ''}`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="hl-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && <div className="hl-error-caption">{errors.password}</div>}
              </div>

              <div className="hl-form-item">
                <label className="hl-input-lbl" htmlFor="confirmPassword">
                  Confirm Password<span className="hl-req">*</span>
                </label>
                <div className="hl-input-wrapper">
                  <span className="hl-prefix-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={(e) => {
                      setFormData({ ...formData, confirmPassword: e.target.value });
                      if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null });
                    }}
                    placeholder="Repeat password"
                    className={`hl-custom-input ${errors.confirmPassword ? 'err-border' : ''}`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="hl-password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <div className="hl-error-caption">{errors.confirmPassword}</div>
                )}
              </div>
            </div>

            {/* Terms checkbox */}
            <div className="hl-terms-row">
              <label className="hl-checkbox-container">
                <input
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={(e) => {
                    setFormData({ ...formData, agreeTerms: e.target.checked });
                    if (errors.agreeTerms) setErrors({ ...errors, agreeTerms: null });
                  }}
                />
                <span>
                  I agree to CareerFast's{' '}
                  <a href="/terms" className="hl-terms-link" target="_blank" rel="noreferrer">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="hl-terms-link" target="_blank" rel="noreferrer">
                    Privacy Policy
                  </a>
                </span>
              </label>
              {errors.agreeTerms && <div className="hl-error-caption">{errors.agreeTerms}</div>}
            </div>

            {/* Register Button */}
            <button type="submit" className="hl-submit-btn" disabled={isLoading}>
              {isLoading ? (
                <span>Creating Account...</span>
              ) : (
                <>
                  <span>Create Recruiter Account</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* OR Divider */}
          <div className="hl-divider-bar">
            <span className="hl-divider-segment"></span>
            <span className="hl-divider-caption">OR</span>
            <span className="hl-divider-segment"></span>
          </div>

          {/* Social SSO Buttons */}
          <div className="hl-social-pair">
            <button
              type="button"
              className="hl-social-tile"
              onClick={() => handleSocialLogin('Google')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Google SSO</span>
            </button>

            <button
              type="button"
              className="hl-social-tile"
              onClick={() => handleSocialLogin('LinkedIn')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
              </svg>
              <span>LinkedIn SSO</span>
            </button>
          </div>

          {/* Already registered prompt */}
          <div className="hl-registration-prompt">
            Already have a recruiter account?
            <button
              type="button"
              className="hl-signup-action"
              onClick={() => {
                if (typeof onNavigateLogin === 'function') {
                  onNavigateLogin();
                } else if (typeof window !== 'undefined') {
                  window.location.href = '/login';
                }
              }}
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Security Footnote */}
        <div className="hl-right-footnote">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>Encrypted 256-bit SSL verified recruiter onboarding</span>
        </div>
      </section>
    </div>
  );
}
