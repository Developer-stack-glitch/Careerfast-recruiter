'use client';
import React, { useState, useEffect } from 'react';
import { login, sendOtp, verifyOtp, forgotPassword, getUsers } from '../ApiService/action';

export default function HrLogin({ onLoginSuccess, onNavigateRegister, onForgotPassword }) {
  // Form states
  const [formData, setFormData] = useState({
    workEmail: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Modals
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  // Load remembered email or auto-login with token
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const incomingToken = urlParams.get('token') || urlParams.get('impersonate_token');
        const incomingData = urlParams.get('data') || urlParams.get('impersonate_data');

        if (incomingToken) {
          setIsLoading(true);
          localStorage.setItem('AccessToken', incomingToken);
          document.cookie = `AccessToken=${incomingToken}; path=/; max-age=86400`;

          let parsedDetails = null;
          if (incomingData) {
            try {
              parsedDetails = JSON.parse(decodeURIComponent(incomingData));
            } catch (e) {
              try {
                parsedDetails = JSON.parse(incomingData);
              } catch (e2) {}
            }
          }

          if (!parsedDetails) {
            try {
              const base64Url = incomingToken.split('.')[1];
              if (base64Url) {
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                  return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                const jwtPayload = JSON.parse(jsonPayload);
                parsedDetails = {
                  id: jwtPayload.id,
                  email: jwtPayload.email,
                  role_id: jwtPayload.role_id || 3,
                  role_name: 'recruiter',
                  first_name: jwtPayload.first_name || 'Recruiter',
                  is_email_verified: 1,
                  impersonated_by_admin: true
                };
              }
            } catch (e) {}
          }

          if (parsedDetails) {
            const safeObj = { ...parsedDetails };
            if (safeObj.profile_image && (safeObj.profile_image.startsWith('data:') || safeObj.profile_image.length > 500)) {
              delete safeObj.profile_image;
            }
            safeObj.is_email_verified = 1;
            localStorage.setItem('loginDetails', JSON.stringify(safeObj));
            document.cookie = `loginDetails=${encodeURIComponent(JSON.stringify(safeObj))}; path=/; max-age=86400`;
          }

          const greetingName = parsedDetails?.first_name ? `, ${parsedDetails.first_name}` : '';
          showToast(`Logged in successfully${greetingName}! Redirecting to Recruiter Portal...`, 'success');

          const target = urlParams.get('target') || '/overview';
          setTimeout(() => {
            window.location.href = target;
          }, 350);
          return;
        }
      }

      const savedEmail = localStorage.getItem('careerfast_hr_email');
      if (savedEmail) {
        setFormData((prev) => ({ ...prev, workEmail: savedEmail, rememberMe: true }));
      }
    } catch (e) {
      // Ignore
    }
  }, []);

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const validate = () => {
    const errs = {};
    if (!formData.workEmail.trim()) {
      errs.workEmail = 'Work email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.workEmail.trim())) {
      errs.workEmail = 'Please enter a valid work email address';
    }

    if (!formData.password) {
      errs.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validate()) return;

    setIsLoading(true);

    if (formData.rememberMe) {
      try {
        localStorage.setItem('careerfast_hr_email', formData.workEmail.trim());
      } catch (err) { }
    } else {
      try {
        localStorage.removeItem('careerfast_hr_email');
      } catch (err) { }
    }

    try {
      if (typeof onLoginSuccess === 'function') {
        await onLoginSuccess({
          email: formData.workEmail.trim(),
          password: formData.password,
          role_id: 3, // Specifically Recruiter role
        });
      } else {
        // Dynamic Recruiter Login via API with strict role_id: 3
        const fcm_token = typeof window !== 'undefined' ? localStorage.getItem('fcm_token') : null;
        const payload = {
          email: formData.workEmail.trim(),
          password: formData.password,
          role_id: 3, // Role 3 is RECRUITER in database
          fcm_token: fcm_token || null,
        };

        const response = await login(payload);

        if (!response?.data?.token) {
          throw new Error(response?.data?.message || 'Authentication failed. Please verify credentials.');
        }

        const token = response.data.token;
        const recruiterDetails = response.data.data?.[0];

        // Strict validation: Only recruiters (role_id: 3) are allowed. Superadmins (role_id: 1) or candidates are rejected.
        if (recruiterDetails?.role_id !== 3 && recruiterDetails?.role_name !== 'RECRUITER') {
          throw new Error('Invalid email and password');
        }

        // Store auth tokens and user profile in localStorage
        localStorage.setItem('AccessToken', token);
        localStorage.setItem('loginDetails', JSON.stringify(recruiterDetails));

        // Store cookies for cross-route session synchronization
        document.cookie = `AccessToken=${token}; path=/; max-age=86400`;
        document.cookie = `loginDetails=${encodeURIComponent(JSON.stringify(recruiterDetails))}; path=/; max-age=86400`;

        const greetingName = recruiterDetails?.first_name ? `, ${recruiterDetails.first_name}` : '';
        showToast(`Welcome back${greetingName}! Redirecting to Recruiter Portal...`, 'success');

        if (typeof window !== 'undefined') {
          setTimeout(() => {
            window.location.href = '/overview';
          }, 700);
        }
      }
    } catch (error) {
      console.error('Recruiter login error:', error);
      const backendError = error?.response?.data?.details || error?.response?.data?.message || error?.message || '';
      const isSuspended =
        error?.response?.data?.account_suspended === true ||
        backendError.toLowerCase().includes('suspended');

      if (isSuspended) {
        showToast('Your recruiter account has been suspended. Please contact the administrator.', 'error');
      } else if (
        backendError.toLowerCase().includes('invalid email and password') ||
        backendError.toLowerCase().includes('invalid email or password') ||
        backendError.toLowerCase().includes('not allowed') ||
        backendError.toLowerCase().includes('invalid password') ||
        backendError.toLowerCase().includes('invalid email')
      ) {
        showToast('Invalid email and password', 'error');
      } else if (backendError) {
        showToast(backendError, 'error');
      } else {
        showToast('Invalid email and password', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    showToast(`Redirecting to ${provider} recruiter authentication...`, 'info');
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = forgotEmail.trim().toLowerCase();
    if (!cleanEmail) {
      showToast('Please enter your registered recruiter work email', 'error');
      return;
    }

    setForgotLoading(true);
    try {
      if (forgotStep === 1) {
        // Step 1: Pre-verify that this email belongs specifically to a RECRUITER (role_id: 3)
        try {
          const userCheckRes = await getUsers({ search: cleanEmail });
          const userList = userCheckRes?.data?.data?.users || userCheckRes?.data?.data || [];
          const matchedUser = Array.isArray(userList)
            ? userList.find((u) => u.email?.toLowerCase() === cleanEmail)
            : null;

          if (!matchedUser || (matchedUser.role_id !== 3 && matchedUser.role_name !== 'RECRUITER')) {
            showToast('No recruiter account found with this work email.', 'error');
            setForgotLoading(false);
            return;
          }
        } catch (checkErr) {
          console.warn('Recruiter pre-check notice:', checkErr);
        }

        // Send OTP to recruiter email with role_id: 3 strictly
        const res = await sendOtp({ email: cleanEmail, role_id: 3 });
        setForgotStep(2);
        showToast(res?.data?.message || 'Verification OTP has been sent to your recruiter email', 'success');
      } else {
        // Step 2 & 3: Verify OTP and reset password
        if (!forgotOtp.trim()) {
          showToast('Please enter the 6-digit verification code', 'error');
          setForgotLoading(false);
          return;
        }
        if (!newPassword || newPassword.length < 6) {
          showToast('Password must be at least 6 characters long', 'error');
          setForgotLoading(false);
          return;
        }

        await verifyOtp({ email: cleanEmail, otp: forgotOtp.trim() });
        const updateRes = await forgotPassword({ email: cleanEmail, password: newPassword, role_id: 3 });

        setIsForgotModalOpen(false);
        setForgotStep(1);
        setForgotOtp('');
        setNewPassword('');
        showToast(updateRes?.data?.message || 'Password reset successfully! You can now log in.', 'success');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      const errMsg = error?.response?.data?.details || error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Password reset failed. Please try again.';
      if (errMsg.toLowerCase().includes('recruiter') || errMsg.toLowerCase().includes('candidate') || errMsg.toLowerCase().includes('not belong')) {
        showToast('Access Denied: Only verified recruiter accounts can reset passwords here.', 'error');
      } else {
        showToast(errMsg, 'error');
      }
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="hl-screen">
      {/* Styles & Cursive Font Import */}
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

        /* Floating ATS Candidate Pipeline Card - Cleanly at desk level */
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

        /* Handwritten: People Build Possibilities */
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

        /* RIGHT PANE: Crisp, Neat Modern SaaS Layout */
        .hl-right-pane {
          flex: 1.1;
          min-height: 100vh;
          background-color: #f8fafc;
          border-left: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
          padding: 28px 40px 24px;
          position: relative;
          overflow: hidden;
        }

        /* Soft Aurora Mesh Glow: Subtle, smooth ambient lighting without lines or symbols */
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

        /* Top-Right Ambient Royal Blue Glow */
        .hl-aurora-1 {
          width: 480px;
          height: 480px;
          top: -120px;
          right: -90px;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.16) 0%, rgba(96, 165, 250, 0.08) 50%, transparent 70%);
          animation: hlAuroraDrift1 22s ease-in-out infinite alternate;
        }

        /* Bottom-Left Soft Indigo / Violet Aura */
        .hl-aurora-2 {
          width: 450px;
          height: 450px;
          bottom: -100px;
          left: -100px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(167, 139, 250, 0.07) 50%, transparent 70%);
          animation: hlAuroraDrift2 25s ease-in-out infinite alternate;
        }

        /* Center Fluid Sky Aura */
        .hl-aurora-3 {
          width: 400px;
          height: 400px;
          top: 30%;
          left: 45%;
          background: radial-gradient(circle, rgba(14, 165, 233, 0.11) 0%, rgba(224, 231, 255, 0.05) 55%, transparent 70%);
          animation: hlAuroraDrift3 20s ease-in-out infinite alternate;
        }

        /* Gentle Side Accent Aura */
        .hl-aurora-4 {
          width: 350px;
          height: 350px;
          top: 65%;
          right: -50px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, transparent 70%);
          animation: hlAuroraDrift4 24s ease-in-out infinite alternate;
        }

        /* Slow, Buttery Smooth Aurora Breathing & Drift Animations */
        @keyframes hlAuroraDrift1 {
          0% {
            transform: translate(0px, 0px) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: translate(-35px, 45px) scale(1.12);
            opacity: 0.82;
          }
          100% {
            transform: translate(25px, 25px) scale(0.95);
            opacity: 0.55;
          }
        }

        @keyframes hlAuroraDrift2 {
          0% {
            transform: translate(0px, 0px) scale(1);
            opacity: 0.55;
          }
          50% {
            transform: translate(45px, -40px) scale(1.1);
            opacity: 0.78;
          }
          100% {
            transform: translate(-25px, -20px) scale(0.92);
            opacity: 0.5;
          }
        }

        @keyframes hlAuroraDrift3 {
          0% {
            transform: translate(0px, 0px) scale(0.95);
            opacity: 0.5;
          }
          50% {
            transform: translate(-30px, -30px) scale(1.14);
            opacity: 0.72;
          }
          100% {
            transform: translate(30px, 20px) scale(1);
            opacity: 0.45;
          }
        }

        @keyframes hlAuroraDrift4 {
          0% {
            transform: translate(0px, 0px) scale(1);
            opacity: 0.45;
          }
          50% {
            transform: translate(-30px, -35px) scale(1.12);
            opacity: 0.68;
          }
          100% {
            transform: translate(20px, 20px) scale(0.92);
            opacity: 0.45;
          }
        }

        /* Top Right: Need Help */
        .hl-top-help-row {
          width: 100%;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          position: relative;
          z-index: 2;
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

        /* Crisp White Sign In Card */
        .hl-signin-box {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-radius: 18px;
          width: 100%;
          max-width: 440px;
          padding: 24px 30px 24px;
          color: #0f172a;
          border: 1px solid rgba(226, 232, 240, 0.9);
          box-shadow: 0 20px 45px -12px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.03);
          margin: auto 0;
          position: relative;
          z-index: 2;
        }

        .hl-form-title {
          font-size: 30px;
          font-weight: 600;
          color: #0f172a;
          margin: 0 0 6px 0;
          letter-spacing: -0.025em;
        }

        .hl-form-subtitle {
          font-size: 13.5px;
          color: #64748b;
          margin: 0 0 26px 0;
          line-height: 1.5;
        }

        .hl-form-item {
          margin-bottom: 18px;
        }

        .hl-input-lbl {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 7px;
        }

        .hl-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .hl-prefix-icon {
          position: absolute;
          left: 14px;
          color: #94a3b8;
          display: flex;
          align-items: center;
          pointer-events: none;
        }

        .hl-custom-input {
          width: 100%;
          height: 46px;
          padding: 0 40px 0 42px;
          font-size: 14px;
          font-family: inherit;
          color: #0f172a;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 11px;
          outline: none;
          transition: all 0.2s ease;
        }

        .hl-custom-input::placeholder {
          color: #94a3b8;
          font-size: 13.5px;
        }

        .hl-custom-input:hover {
          border-color: #cbd5e1;
        }

        .hl-custom-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3.5px rgba(37, 99, 235, 0.12);
        }

        .hl-custom-input.err-border {
          border-color: #ef4444;
          background: #fffafa;
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
          padding: 6px;
          border-radius: 6px;
          transition: color 0.15s;
        }

        .hl-password-toggle:hover {
          color: #1e293b;
        }

        .hl-error-caption {
          font-size: 11.5px;
          color: #ef4444;
          margin-top: 5px;
        }

        /* Checkbox & Forgot Password */
        .hl-actions-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 22px;
        }

        .hl-checkbox-container {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #475569;
          cursor: pointer;
          user-select: none;
        }

        .hl-checkbox-container input {
          width: 16px;
          height: 16px;
          border: 1.5px solid #cbd5e1;
          border-radius: 4px;
          cursor: pointer;
          accent-color: #2563eb;
        }

        .hl-forgot-link {
          font-size: 13px;
          font-weight: 600;
          color: #2563eb;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          transition: color 0.15s;
        }

        .hl-forgot-link:hover {
          color: #1d4ed8;
          text-decoration: underline;
        }

        /* Sign In Button */
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
          margin: 22px 0 18px;
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
          margin-bottom: 22px;
        }

        .hl-social-tile {
          height: 44px;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 11px;
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
          font-size: 12px;
          color: #94a3b8;
          display: flex;
          align-items: center;
          gap: 6px;
          position: relative;
          z-index: 2;
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

        /* Forgot Password Modal */
        .hl-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999;
          padding: 20px;
        }

        .hl-modal-dialog {
          background: #ffffff;
          border-radius: 20px;
          padding: 30px;
          width: 100%;
          max-width: 420px;
          position: relative;
          box-shadow: 0 20px 40px -10px rgba(0,0,0,0.25);
        }

        .hl-modal-dismiss {
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          font-size: 20px;
          color: #94a3b8;
          cursor: pointer;
        }

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
            padding: 40px 24px;
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
          .hl-title-main {
            font-size: 32px;
          }
          .hl-metrics-stack {
            flex-direction: column;
            width: 100%;
          }
          .hl-metric-card {
            width: 100%;
          }
          .hl-social-pair {
            grid-template-columns: 1fr;
          }
          .hl-signin-box {
            padding: 28px 20px;
          }
        }
      `}</style>

      {/* Toast Alert */}
      {toastMessage && (
        <div className={`hl-toast ${toastMessage.type}`}>
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* LEFT PANE: Full-Bleed Background + Content Overlay */}
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
                {/* 1 */}
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

                {/* 2 */}
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

                {/* 3 */}
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

                {/* 4 */}
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
                {/* Candidate 1: Priya Nair */}
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

                {/* Candidate 2: Arjun Menon */}
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

                {/* Candidate 3: Sneha Varghese */}
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
            {/* Handwritten: People Build Possibilities */}
            <div className="hl-script-possibilities cursive-font">
              People<br />Build Possibilities
              <svg viewBox="0 0 86 12" fill="none">
                <path d="M2 5 C 28 12, 58 10, 84 3" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>

            {/* 3 Metrics Cards */}
            <div className="hl-metrics-stack">
              {/* Metric 1 */}
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

              {/* Metric 2 */}
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

              {/* Metric 3 */}
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

      {/* RIGHT PANE: Clean, Modern SaaS Auth Panel */}
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

        {/* Crisp White Login Card */}
        <div className="hl-signin-box">
          <h2 className="hl-form-title">Welcome Back!</h2>
          <p className="hl-form-subtitle">
            Sign in to manage your recruitment and hiring activities.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            {/* Work Email */}
            <div className="hl-form-item">
              <label className="hl-input-lbl" htmlFor="workEmail">Work Email</label>
              <div className="hl-input-wrapper">
                <span className="hl-prefix-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                    setFormData({ ...formData, workEmail: e.target.value });
                    if (errors.workEmail) setErrors({ ...errors, workEmail: null });
                  }}
                  placeholder="you@company.com"
                  className={`hl-custom-input ${errors.workEmail ? 'err-border' : ''}`}
                  autoComplete="email"
                />
              </div>
              {errors.workEmail && (
                <div className="hl-error-caption">{errors.workEmail}</div>
              )}
            </div>

            {/* Password */}
            <div className="hl-form-item">
              <label className="hl-input-lbl" htmlFor="password">Password</label>
              <div className="hl-input-wrapper">
                <span className="hl-prefix-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  placeholder="Enter your password"
                  className={`hl-custom-input ${errors.password ? 'err-border' : ''}`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="hl-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <div className="hl-error-caption">{errors.password}</div>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="hl-actions-row">
              <label className="hl-checkbox-container">
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                className="hl-forgot-link"
                onClick={() => {
                  setForgotEmail(formData.workEmail || '');
                  setIsForgotModalOpen(true);
                }}
              >
                Forgot Password?
              </button>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              className="hl-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
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
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.34 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              className="hl-social-tile"
              onClick={() => handleSocialLogin('Microsoft')}
            >
              <svg width="17" height="17" viewBox="0 0 23 23">
                <path fill="#f35325" d="M1 1h10v10H1z" />
                <path fill="#81bc06" d="M12 1h10v10H12z" />
                <path fill="#05a6f0" d="M1 12h10v10H1z" />
                <path fill="#ffba08" d="M12 12h10v10H12z" />
              </svg>
              <span>Continue with Microsoft</span>
            </button>
          </div>

          {/* Registration link */}
          <div className="hl-registration-prompt">
            New to the platform?{' '}
            <button
              type="button"
              className="hl-signup-action"
              onClick={() => {
                if (typeof onNavigateRegister === 'function') {
                  onNavigateRegister();
                } else if (typeof window !== 'undefined') {
                  window.location.href = '/register';
                }
              }}
            >
              Create a Recruiter Account
            </button>
          </div>
        </div>

        {/* Bottom Security Footnote */}
        <div className="hl-right-footnote">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <span>Enterprise-grade security &amp; SOC2 Compliant</span>
        </div>
      </section>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="hl-modal-backdrop" onClick={() => setIsForgotModalOpen(false)}>
          <div className="hl-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="hl-modal-dismiss"
              onClick={() => setIsForgotModalOpen(false)}
            >
              ✕
            </button>

            <h3 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
              {forgotStep === 1 ? 'Reset Recruiter Password' : 'Enter Verification Code'}
            </h3>
            <p style={{ margin: '0 0 18px', fontSize: '13.5px', color: '#64748b' }}>
              {forgotStep === 1
                ? 'Enter your registered recruiter work email. Only authorized recruiter accounts can reset passwords here.'
                : `We sent a 6-digit code to ${forgotEmail}. Please enter it below.`}
            </p>

            <form onSubmit={handleForgotSubmit}>
              {forgotStep === 1 ? (
                <div className="hl-form-item">
                  <label className="hl-input-lbl">Recruiter Work Email</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="recruiter@company.com"
                    className="hl-custom-input"
                    required
                    style={{ paddingLeft: '14px' }}
                  />
                </div>
              ) : (
                <>
                  <div className="hl-form-item">
                    <label className="hl-input-lbl">6-Digit Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value)}
                      placeholder="123456"
                      className="hl-custom-input"
                      required
                      style={{ paddingLeft: '14px', letterSpacing: '4px', textAlign: 'center' }}
                    />
                  </div>
                  <div className="hl-form-item">
                    <label className="hl-input-lbl">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="hl-custom-input"
                      required
                      style={{ paddingLeft: '14px' }}
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                className="hl-submit-btn"
                disabled={forgotLoading}
                style={{ marginTop: '10px' }}
              >
                {forgotLoading ? 'Processing...' : forgotStep === 1 ? 'Send Code' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
