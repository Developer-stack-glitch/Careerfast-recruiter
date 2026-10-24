'use client';
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Select } from 'antd';
import {
  register,
  login,
  getOrganizationType,
  getIndustryTypes,
  getJobCategories,
  verifyEmail,
  verifyOtp,
} from '../ApiService/action';
import {
  fetchWorldwideLocations,
  getInitialLocations,
  TOP_INDIAN_LOCATIONS,
} from '../Common/worldwideDataService';
import { officialEmailValidator } from '../Common/Validation';
import { WORLDWIDE_COUNTRY_CODES } from '../Common/countryPhoneCodes';
import CommonSelectField from '../Common/CommonSelectField';
import logo from '../images/hrportal_logo1.png';
import '../css/HrRecruiter.css';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Phone,
  MapPin,
  Building,
  Briefcase,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Camera,
  X,
  Check,
  Award,
  Globe,
  Search,
  Calendar,
} from 'lucide-react';

// 50+ Master Industries from database & recruiter standards (including all from reference)
const ALL_MASTER_INDUSTRIES = [
  'Accounting, Auditing & Taxation',
  'Advertising, Marketing & Public Relations',
  'Aerospace & Aviation',
  'Agriculture, Farming & AgriTech',
  'Architecture & Interior Design',
  'Artificial Intelligence & Machine Learning',
  'Automobile & Electric Vehicles',
  'Automotive & Electric Vehicles',
  'Banking & Financial Services (BFSI)',
  'Banking, Financial Services & Insurance (BFSI)',
  'Chemicals & Petrochemicals',
  'Civil Engineering & Construction',
  'Consulting & Professional Services',
  'Consumer Goods & FMCG',
  'Defense & Military Technology',
  'E-Commerce & Digital Marketplaces',
  'E-Commerce & Retail',
  'Education & EdTech',
  'Education, EdTech & Academia',
  'Electronics & Semiconductor Manufacturing',
  'Energy, Power & Utilities',
  'Environmental Services & Waste Management',
  'FinTech & Digital Payments',
  'Food Production & Processing',
  'Freight Forwarding & Maritime Shipping',
  'Gaming, Animation & VFX',
  'Government Administration & Public Policy',
  'Healthcare & Hospitals',
  'Healthcare & Pharmaceuticals',
  'Higher Education & Research Institutes',
  'Hospitality, Travel & Tourism',
  'Human Resources & Staffing Services',
  'Information Technology & Services',
  'Investment Banking & Venture Capital',
  'IT / Software Services',
  'IT & Software',
  'Legal Services & Law Practice',
  'Logistics & Supply Chain',
  'Logistics, Supply Chain & Warehousing',
  'Management Consulting & Strategy',
  'Manufacturing & Engineering',
  'Manufacturing, Industrial & Heavy Machinery',
  'Media, Entertainment & Gaming',
  'Media, Entertainment & Publishing',
  'Medical Devices & Diagnostics',
  'Mining, Metals & Metallurgy',
  'Non-Profit, NGO & Social Impact',
  'Oil, Gas & Petroleum Exploration',
  'Pharmaceuticals & Biotechnology',
  'Real Estate & Construction',
  'Real Estate & Property Management',
  'Renewable Energy & CleanTech',
  'Restaurants & Food Services',
  'Retail & Wholesale Trade',
  'Security & Surveillance Systems',
  'Software Product & SaaS',
  'Telecom & Networking',
  'Telecommunications & Networking',
  'Textiles, Apparel & Fashion',
];

// Master Functional Areas / Domains from job categories database
const ALL_MASTER_FUNCTIONS = [
  'Software Development & Engineering',
  'Software Development',
  'Frontend Development',
  'Backend Development',
  'Full Stack Development',
  'Mobile App Development',
  'DevOps & Cloud Computing',
  'Data Science, Analytics & AI/ML',
  'Data Science & Analytics',
  'Data Science & Machine Learning',
  'Cybersecurity',
  'AI Data & Prompt Engineering',
  'Ai Ml Engineer',
  'AR/VR Development',
  'Blockchain Development',
  'Game Development',
  'Embedded Systems',
  'Quality Assurance & Testing',
  'Software Testing',
  'Database Administration',
  'IT Consulting',
  'IT Infrastructure Services',
  'IT Support & Helpdesk',
  'Product Management',
  'Product Management - Technology',
  'UI / UX & Product Design',
  'UI / UX',
  'UI/UX Design',
  'Web Design',
  'Graphic Design',
  'Animation',
  'Human Resources & Talent Acquisition',
  'Human Resources - Other',
  'Recruitment & Talent Acquisition',
  'HR Analytics',
  'HR Operations',
  'Compensation & Benefits',
  'Employee Relations',
  'Corporate Training',
  'Sales & Business Development',
  'Sales Support & Operations',
  'Enterprise & B2B Sales',
  'Retail & B2C Sales',
  'Business Development',
  'BD / Pre Sales',
  'Client Relations',
  'Marketing, Content & Growth',
  'Marketing',
  'Digital Marketing',
  'Content Marketing',
  'Social Media Marketing',
  'Brand Management',
  'SEO/SEM',
  'Market Research & Insights',
  'Finance, Accounting & Tax',
  'Finance & Accounting',
  'Accounting & Auditing',
  'Accounting & Taxation',
  'Financial Analysis',
  'Investment Banking, Private Equity & VC',
  'Banking',
  'Risk Management & Compliance',
  'Operations & Customer Success',
  'Customer Success, Service & Operations',
  'Operations Manager',
  'Supply Chain Management',
  'SCM & Logistics',
  'Procurement & Sourcing',
  'Warehouse Operations',
  'Public Relations',
  'Corporate Communication',
  'Legal Consulting',
  'Corporate Law',
  'Compliance',
  'Civil Engineering',
  'Mechanical Engineering',
  'Electrical Engineering',
  'Robotics Engineering',
  'Biotechnology',
  'Pharmaceutical & Biotechnology',
  'Medical Research',
  'Healthcare Administration',
  'Higher Education',
  'K-12 Education',
];

const HIRING_LEVELS_OPTIONS = [
  'Entry Level / Freshers (0-2 yrs)',
  'Mid-Level Professionals (2-5 yrs)',
  'Senior Engineers / Specialists (5-8 yrs)',
  'Lead / Engineering Manager (8-12 yrs)',
  'Director / CXO / Executive Leadership',
  'All Experience Levels',
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => String(CURRENT_YEAR - i));

const HIRING_EXPERIENCE_OPTIONS = [
  { label: '0 - 1 Years', value: '0-1 Years' },
  { label: '1 - 3 Years', value: '1-3 Years' },
  { label: '3 - 5 Years', value: '3-5 Years' },
  { label: '5 - 8 Years', value: '5-8 Years' },
  { label: '8 - 12 Years', value: '8-12 Years' },
  { label: '12+ Years', value: '12+ Years' },
];

const POPULAR_PHONE_CODES = [
  { name: 'India', code: 'IN', dial_code: '+91', flag: '🇮🇳' },
  { name: 'United States', code: 'US', dial_code: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: 'GB', dial_code: '+44', flag: '🇬🇧' },
  { name: 'United Arab Emirates', code: 'AE', dial_code: '+971', flag: '🇦🇪' },
  { name: 'Singapore', code: 'SG', dial_code: '+65', flag: '🇸🇬' },
  { name: 'Australia', code: 'AU', dial_code: '+61', flag: '🇦🇺' },
  { name: 'Germany', code: 'DE', dial_code: '+49', flag: '🇩🇪' },
  { name: 'France', code: 'FR', dial_code: '+33', flag: '🇫🇷' },
  { name: 'Japan', code: 'JP', dial_code: '+81', flag: '🇯🇵' },
  { name: 'Canada', code: 'CA', dial_code: '+1', flag: '🇨🇦' },
];

const PHONE_CODE_OPTIONS = (() => {
  const seenCodes = new Set();
  const list = [];

  const addCode = (c) => {
    if (!c || !c.code || seenCodes.has(c.code)) return;
    seenCodes.add(c.code);
    const triggerLabel = `${c.code} ${c.dial_code}`;
    list.push({
      value: c.dial_code,
      key: `${c.code}-${c.dial_code}`,
      triggerLabel: triggerLabel,
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <span style={{ fontWeight: 600, color: '#0f172a' }}>{triggerLabel}</span>
          <span style={{ color: '#64748b', fontSize: '12px' }}>{c.name}</span>
        </div>
      ),
      search: `${c.name} ${c.code} ${c.dial_code}`,
    });
  };

  POPULAR_PHONE_CODES.forEach(addCode);
  WORLDWIDE_COUNTRY_CODES.forEach(addCode);

  return list;
})();

export default function HrRecruiter({ onRegisterSuccess, onNavigateLogin }) {
  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    workEmail: '',
    phoneCode: '+91',
    phone: '',
    location: '',
    password: '',
    confirmPassword: '',
    // Professional Details
    companyName: '',
    designation: '',
    websiteUrl: '',
    establishedDate: '',
    fromMonth: 'January',
    fromYear: '2023',
    toMonth: 'Present',
    toYear: 'Present',
    isCurrentlyWorking: true,
    // Company Address
    address1: '',
    address2: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    // Preferences
    hiringExperience: '3-5 Years',
    referralCode: '',
    agreeTerms: true,
  });

  const [avatarImage, setAvatarImage] = useState(null);
  const [selectedIndustries, setSelectedIndustries] = useState([]);
  const [selectedFunctions, setSelectedFunctions] = useState([]);
  const [selectedHiringLevels, setSelectedHiringLevels] = useState(['Entry Level / Freshers (0-2 yrs)']);
  const [skillsList, setSkillsList] = useState(['React.js', 'Node.js', 'Talent Acquisition']);
  const [skillInput, setSkillInput] = useState('');
  const [previousCompanies, setPreviousCompanies] = useState([]);

  // Dynamic API Datasets
  const [allIndustries, setAllIndustries] = useState(ALL_MASTER_INDUSTRIES);
  const [allFunctions, setAllFunctions] = useState(ALL_MASTER_FUNCTIONS);
  const [loadingIndustries, setLoadingIndustries] = useState(false);
  const [loadingFunctions, setLoadingFunctions] = useState(false);

  // Work Email Verification State
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verifiedEmailAddress, setVerifiedEmailAddress] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  // OTP Resend Countdown Timer
  useEffect(() => {
    let interval = null;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const handleWorkEmailChange = (e) => {
    const val = e.target.value;
    setFormData({ ...formData, workEmail: val });
    if (errors.workEmail) setErrors({ ...errors, workEmail: null });
    if (isEmailVerified && val.toLowerCase().trim() !== verifiedEmailAddress) {
      setIsEmailVerified(false);
      setOtpSent(false);
      setOtpInput('');
    }
  };

  const handleSendEmailOtp = async () => {
    const email = formData.workEmail.trim().toLowerCase();
    if (!email) {
      setErrors((prev) => ({ ...prev, workEmail: 'Official work email is required' }));
      showToast('Please enter an official work email address first', 'error');
      return;
    }

    const emailErr = officialEmailValidator(email);
    if (emailErr) {
      setErrors((prev) => ({ ...prev, workEmail: emailErr }));
      showToast(emailErr, 'error');
      return;
    }

    setSendingOtp(true);
    try {
      const res = await verifyEmail({ email });
      setOtpSent(true);
      setOtpTimer(60);
      showToast(res?.data?.message || `Verification code sent to ${email}`, 'success');
    } catch (err) {
      console.error('Send OTP error:', err);
      const errMsg =
        err?.response?.data?.details ||
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to send verification code. Please try again.';
      showToast(errMsg, 'error');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    const email = formData.workEmail.trim().toLowerCase();
    const cleanOtp = otpInput.trim();
    if (!cleanOtp || cleanOtp.length < 4) {
      showToast('Please enter the verification code received', 'error');
      return;
    }

    setVerifyingOtp(true);
    try {
      const res = await verifyOtp({ email, otp: cleanOtp });
      if (res?.data?.message || res?.status === 200) {
        setIsEmailVerified(true);
        setVerifiedEmailAddress(email);
        setOtpSent(false);
        setOtpInput('');
        if (errors.workEmail) setErrors((prev) => ({ ...prev, workEmail: null }));
        showToast('Work email verified successfully! Verified recruiter badge granted.', 'success');
      }
    } catch (err) {
      console.error('Verify OTP error:', err);
      const errMsg =
        err?.response?.data?.details ||
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Invalid or expired OTP. Please check the code and try again.';
      showToast(errMsg, 'error');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Worldwide Location API State
  const [locationOptions, setLocationOptions] = useState(getInitialLocations());
  const [loadingLocations, setLoadingLocations] = useState(false);
  const locationSearchTimer = useRef(null);

  const handleSearchLocation = (searchText) => {
    if (locationSearchTimer.current) clearTimeout(locationSearchTimer.current);

    if (!searchText || !searchText.trim()) {
      setLocationOptions(getInitialLocations());
      setLoadingLocations(false);
      return;
    }

    setLoadingLocations(true);
    locationSearchTimer.current = setTimeout(async () => {
      try {
        const results = await fetchWorldwideLocations(searchText);
        const currentLoc = formData.location ? [formData.location] : [];
        setLocationOptions([...new Set([...currentLoc, ...results])]);
      } catch (err) {
        console.error('Error fetching locations:', err);
      } finally {
        setLoadingLocations(false);
      }
    }, 250);
  };

  // Visibility & UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [orgTypes, setOrgTypes] = useState([]);

  const fileInputRef = useRef(null);

  // Load Organization Types, All Industries, and All Job Categories/Functions from API
  useEffect(() => {
    const fetchMasterData = async () => {
      // 1. Organization Types
      try {
        const res = await getOrganizationType();
        const list = res?.data?.data || res?.data || [];
        if (Array.isArray(list) && list.length > 0) {
          setOrgTypes(list);
        }
      } catch (e) {
        // Fallback in place
      }

      // 2. All Industry Types from backend API
      try {
        setLoadingIndustries(true);
        const indRes = await getIndustryTypes();
        const indList = indRes?.data?.data || indRes?.data || [];
        if (Array.isArray(indList) && indList.length > 0) {
          const mapped = indList
            .map((item) => (typeof item === 'string' ? item : item.name))
            .filter(Boolean);
          const combined = Array.from(new Set([...mapped, ...ALL_MASTER_INDUSTRIES])).sort((a, b) =>
            a.localeCompare(b)
          );
          setAllIndustries(combined);
        }
      } catch (e) {
        console.warn('Industry fetch notice:', e);
      } finally {
        setLoadingIndustries(false);
      }

      // 3. All Function / Domain Categories from backend API
      try {
        setLoadingFunctions(true);
        const catRes = await getJobCategories();
        const catList = catRes?.data?.data || catRes?.data || [];
        if (Array.isArray(catList) && catList.length > 0) {
          const mapped = catList
            .map((item) => (typeof item === 'string' ? item : item.category_name || item.name))
            .filter(Boolean)
            .filter((name) => !/^(bangalore|chenna|gurugram|kochi|pune|vadodara|thirussur|x|css|ui)$/i.test(name.trim()));
          const combined = Array.from(new Set([...mapped, ...ALL_MASTER_FUNCTIONS])).sort((a, b) =>
            a.localeCompare(b)
          );
          setAllFunctions(combined);
        }
      } catch (e) {
        console.warn('Job categories fetch notice:', e);
      } finally {
        setLoadingFunctions(false);
      }
    };

    fetchMasterData();
  }, []);

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Image Upload Handler
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please upload a valid image file (JPG, PNG, WebP)', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast('Image size should be less than 2MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarImage(event.target?.result);
      showToast('Profile photo updated!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    setAvatarImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Hiring Level Toggles
  const toggleHiringLevel = (lvl) => {
    if (selectedHiringLevels.includes(lvl)) {
      if (selectedHiringLevels.length === 1) return;
      setSelectedHiringLevels(selectedHiringLevels.filter((l) => l !== lvl));
    } else {
      setSelectedHiringLevels([...selectedHiringLevels, lvl]);
    }
  };

  // Skills handlers
  const handleAddSkill = (skillToAdd) => {
    const trimmed = (skillToAdd || skillInput).trim();
    if (!trimmed) return;
    if (skillsList.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setSkillInput('');
      return;
    }
    setSkillsList([...skillsList, trimmed]);
    setSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkillsList(skillsList.filter((s) => s !== skillToRemove));
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  // Previous Companies Handlers
  const addPreviousCompany = () => {
    setPreviousCompanies([
      ...previousCompanies,
      {
        id: Date.now(),
        company_name: '',
        designation: '',
        from_year: '2020',
        to_year: '2022',
        location: '',
      },
    ]);
  };

  const updatePreviousCompany = (id, field, value) => {
    setPreviousCompanies(
      previousCompanies.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const removePreviousCompany = (id) => {
    setPreviousCompanies(previousCompanies.filter((c) => c.id !== id));
  };

  // Form Validation
  const validate = () => {
    const errs = {};

    if (!formData.firstName.trim()) {
      errs.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      errs.firstName = 'Minimum 2 characters';
    }

    const emailErr = officialEmailValidator(formData.workEmail);
    if (emailErr) {
      errs.workEmail = emailErr;
    } else if (!isEmailVerified) {
      errs.workEmail = 'Please verify your work email with OTP before registering';
    }

    if (!formData.phone.trim()) {
      errs.phone = 'Phone number is required';
    } else if (!/^[0-9]{10}$/.test(formData.phone.trim().replace(/\D/g, ''))) {
      errs.phone = 'Enter a valid 10-digit mobile number';
    }

    if (!formData.location.trim()) {
      errs.location = 'Please select or enter your current location';
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

    if (!formData.companyName.trim()) {
      errs.companyName = 'Current company name is required';
    }

    if (!formData.designation.trim()) {
      errs.designation = 'Current designation is required';
    }

    if (!formData.address1.trim()) {
      errs.address1 = 'Street address line 1 is required';
    }

    if (!formData.city.trim()) {
      errs.city = 'City is required';
    }

    if (!formData.state.trim()) {
      errs.state = 'State / Region is required';
    }

    if (!formData.pincode.trim()) {
      errs.pincode = 'Zip / Pin code is required';
    }

    if (selectedIndustries.length === 0) {
      errs.industries = 'Please select at least 1 industry';
    }

    if (selectedFunctions.length === 0) {
      errs.functions = 'Please select at least 1 function/domain';
    }

    if (skillsList.length === 0) {
      errs.skills = 'Please add at least 1 hiring skill';
    }

    if (!formData.agreeTerms) {
      errs.agreeTerms = 'You must agree to the Terms of Service to continue';
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      const firstKey = Object.keys(errs)[0];
      showToast(errs[firstKey] || 'Please complete all required fields (*)', 'error');
    }
    return Object.keys(errs).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validate()) return;

    setIsLoading(true);

    const cleanPhone = formData.phone.trim().replace(/\D/g, '').slice(-10);

    // Map selected industry to orgTypeId if matched
    let matchedOrgId = 1;
    if (orgTypes.length > 0 && selectedIndustries.length > 0) {
      const found = orgTypes.find((ot) =>
        selectedIndustries.some(
          (ind) =>
            ind.toLowerCase().includes(ot.name.toLowerCase()) ||
            ot.name.toLowerCase().includes(ind.toLowerCase())
        )
      );
      if (found) matchedOrgId = found.id;
    }

    const payload = {
      first_name: formData.firstName.trim(),
      last_name: formData.lastName.trim(),
      phone_code: formData.phoneCode,
      phone: cleanPhone,
      email: formData.workEmail.trim().toLowerCase(),
      password: formData.password,
      organization: formData.companyName.trim(),
      organization_type_id: matchedOrgId,
      role_id: 3, // Role 3 is explicitly RECRUITER
      is_email_verified: 1,
      // Comprehensive Recruiter Profile fields
      profile_image: avatarImage || null,
      designation: formData.designation.trim(),
      website_url: formData.websiteUrl.trim(),
      year_established: formData.establishedDate.trim(),
      location: formData.location.trim(),
      address1: formData.address1.trim(),
      address2: formData.address2.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      country: formData.country.trim(),
      pincode: formData.pincode.trim(),
      experience_from: `${formData.fromMonth} ${formData.fromYear}`,
      experience_to: formData.isCurrentlyWorking ? 'Present' : `${formData.toMonth} ${formData.toYear}`,
      hiring_experience: formData.hiringExperience,
      hiring_levels: selectedHiringLevels,
      referral_code: formData.referralCode.trim(),
      industries: selectedIndustries,
      functions: selectedFunctions,
      skills: skillsList,
      previous_companies: previousCompanies
        .filter((c) => c.company_name && c.company_name.trim())
        .map((c) => ({
          company_name: c.company_name.trim(),
          designation: (c.designation || '').trim(),
          from_year: c.from_year || '',
          to_year: c.to_year || '',
          start_date: c.from_year || '',
          end_date: c.to_year || '',
          location: c.location || '',
        })),
    };

    try {
      if (typeof onRegisterSuccess === 'function') {
        await onRegisterSuccess(payload);
      } else {
        const response = await register(payload);

        if (!response?.data?.success && response?.status !== 200 && response?.status !== 201) {
          throw new Error(response?.data?.message || 'Registration failed. Please check your information.');
        }

        showToast('Recruiter profile created successfully! Logging you into TalentHub...', 'success');

        // Automatic Login to streamline onboarding directly into recruiter dashboard
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
            const recruiterDetails = loginRes.data.data?.[0] || {};
            recruiterDetails.is_email_verified = 1;

            localStorage.setItem('AccessToken', token);
            localStorage.setItem('loginDetails', JSON.stringify(recruiterDetails));
            document.cookie = `AccessToken=${token}; path=/; max-age=2592000; SameSite=Lax`;
            document.cookie = `loginDetails=${encodeURIComponent(JSON.stringify(recruiterDetails))}; path=/; max-age=2592000; SameSite=Lax`;

            // Directly navigate to Recruiter Overview (NO separate create profile page!)
            setTimeout(() => {
              window.location.href = '/overview';
            }, 600);
            return;
          }
        } catch (loginErr) {
          console.warn('Auto-login notice:', loginErr);
        }

        // Fallback to login
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }, 1000);
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

  return (
    <div className="cf-recruiter-page">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 9999,
            padding: '12px 20px',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
            color: '#fff',
            backgroundColor: toastMessage.type === 'error' ? '#ef4444' : '#10b981',
            animation: 'fadeIn 0.2s ease-in-out',
          }}
        >
          {toastMessage.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Navigation */}
      <nav className="cf-recruiter-nav">
        <div className="cf-recruiter-nav-inner">
          <div className="cf-brand-link">
            <Image src={logo} alt="CareerFast TalentHub" className="cf-brand-logo" priority />
            <span className="cf-brand-badge">
              <Sparkles size={13} /> Recruiter Onboarding
            </span>
          </div>

          <div className="cf-login-redirect">
            <span>Existing Employers/Recruiters?</span>
            <button
              type="button"
              className="cf-login-btn"
              onClick={() => {
                if (typeof onNavigateLogin === 'function') {
                  onNavigateLogin();
                } else if (typeof window !== 'undefined') {
                  window.location.href = '/login';
                }
              }}
            >
              Sign In <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* Header Intro */}
      <header className="cf-header-section">
        <div className="cf-header-badge">
          <ShieldCheck size={14} color="#2563eb" /> Verified Employer Portal
        </div>
        <h1 className="cf-page-title">Create Recruiter Profile</h1>
        <p className="cf-page-subtitle">
          Complete your registration, company details, and hiring preferences in one single step. Once submitted, your recruiter account and verified profile will be active instantly with zero waiting.
        </p>
      </header>

      {/* Main Registration Form */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="cf-grid-layout">
          {/* ===================== LEFT COLUMN: Personal Details ===================== */}
          <div className="cf-column-left">
            <div className="cf-card">
              <div className="cf-card-header">
                <div className="cf-card-icon blue">
                  <User />
                </div>
                <div>
                  <h2 className="cf-card-title">Personal Details</h2>
                  <p className="cf-card-subtitle">Your recruiter identity & login credentials</p>
                </div>
              </div>

              {/* Profile Photo Uploader */}
              <div className="cf-avatar-section">
                <div className="cf-avatar-circle">
                  {avatarImage ? (
                    <img src={avatarImage} alt="Recruiter Avatar" className="cf-avatar-img" />
                  ) : (
                    <div className="cf-avatar-placeholder">
                      <Camera size={26} />
                    </div>
                  )}
                </div>
                <div className="cf-avatar-controls">
                  <h4 className="cf-avatar-title">Profile Picture</h4>
                  <p className="cf-avatar-hint">PNG, JPG, WebP up to 2MB</p>
                  <div className="cf-avatar-btn-group">
                    <button
                      type="button"
                      className="cf-upload-btn"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera size={13} /> {avatarImage ? 'Change Photo' : 'Upload Photo'}
                    </button>
                    {avatarImage && (
                      <button type="button" className="cf-remove-btn" onClick={removeAvatar}>
                        <X size={13} /> Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                </div>
              </div>

              {/* Name Fields */}
              <div className="cf-row-2">
                <div className="cf-form-group">
                  <label className="cf-label">
                    First Name <span className="cf-req">*</span>
                  </label>
                  <div className="cf-input-wrapper">
                    <span className="cf-input-icon">
                      <User size={16} />
                    </span>
                    <input
                      type="text"
                      className={`cf-input ${errors.firstName ? 'err-border' : ''}`}
                      placeholder="e.g. John"
                      value={formData.firstName}
                      onChange={(e) => {
                        setFormData({ ...formData, firstName: e.target.value });
                        if (errors.firstName) setErrors({ ...errors, firstName: null });
                      }}
                    />
                  </div>
                  {errors.firstName && <div className="cf-error-text">{errors.firstName}</div>}
                </div>

                <div className="cf-form-group">
                  <label className="cf-label">Last Name</label>
                  <div className="cf-input-wrapper">
                    <input
                      type="text"
                      className="cf-input no-icon"
                      placeholder="e.g. Doe"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Official Work Email with OTP Verification */}
              <div className="cf-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="cf-label" style={{ marginBottom: 0 }}>
                    Official Work Email <span className="cf-req">*</span>
                  </label>
                  {isEmailVerified && (
                    <span className="cf-verified-badge-pill">
                      <CheckCircle2 size={13} strokeWidth={2.5} /> Verified
                    </span>
                  )}
                </div>

                <div className="cf-input-wrapper">
                  <span className="cf-input-icon">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    className={`cf-input ${errors.workEmail ? 'err-border' : ''} ${isEmailVerified ? 'is-verified-input' : ''}`}
                    placeholder="name@company.com"
                    value={formData.workEmail}
                    onChange={handleWorkEmailChange}
                    disabled={isEmailVerified}
                    style={{ paddingRight: isEmailVerified ? '90px' : (formData.workEmail.trim() ? '130px' : '14px') }}
                  />

                  {/* Action inside input: Verify OTP or Change Email */}
                  {isEmailVerified ? (
                    <button
                      type="button"
                      className="cf-email-change-btn"
                      onClick={() => {
                        setIsEmailVerified(false);
                        setOtpSent(false);
                      }}
                      title="Click to edit and re-verify email"
                    >
                      Change
                    </button>
                  ) : (
                    formData.workEmail.trim() && (
                      <button
                        type="button"
                        className="cf-verify-otp-action-btn"
                        onClick={handleSendEmailOtp}
                        disabled={sendingOtp}
                      >
                        {sendingOtp ? 'Sending...' : (otpSent ? 'Resend OTP' : 'Verify with OTP')}
                      </button>
                    )
                  )}
                </div>

                {errors.workEmail && <div className="cf-error-text">{errors.workEmail}</div>}

                {/* Inline OTP Verification Card */}
                {otpSent && !isEmailVerified && (
                  <div className="cf-otp-verify-card">
                    <div className="cf-otp-card-header">
                      <span>Enter the 6-digit OTP sent to <strong>{formData.workEmail}</strong></span>
                    </div>

                    <div className="cf-otp-input-action-row">
                      <input
                        type="text"
                        maxLength={6}
                        className="cf-otp-code-input"
                        placeholder="• • • • • •"
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        autoFocus
                      />
                      <button
                        type="button"
                        className="cf-otp-confirm-btn"
                        onClick={handleVerifyEmailOtp}
                        disabled={verifyingOtp || otpInput.trim().length < 4}
                      >
                        {verifyingOtp ? 'Verifying...' : 'Verify OTP'}
                      </button>
                    </div>

                    <div className="cf-otp-card-footer">
                      <button
                        type="button"
                        className="cf-otp-resend-btn"
                        onClick={handleSendEmailOtp}
                        disabled={otpTimer > 0 || sendingOtp}
                      >
                        {otpTimer > 0 ? `Resend OTP in ${otpTimer}s` : 'Resend OTP'}
                      </button>
                      <button
                        type="button"
                        className="cf-otp-cancel-btn"
                        onClick={() => {
                          setOtpSent(false);
                          setOtpInput('');
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Number with Country Code */}
              <div className="cf-form-group">
                <label className="cf-label">
                  Mobile Number <span className="cf-req">*</span>
                </label>
                <div className="cf-phone-combo">
                  <CommonSelectField
                    value={formData.phoneCode}
                    onChange={(val) => setFormData({ ...formData, phoneCode: val })}
                    options={PHONE_CODE_OPTIONS}
                    showSearch
                    optionLabelProp="triggerLabel"
                    classNames={{
                      popup: { root: 'cf-search-select-dropdown cf-country-dropdown' },
                    }}
                    popupMatchSelectWidth={260}
                    className="premium-input cf-country-code-select"
                  />
                  <div className="cf-input-wrapper">
                    <span className="cf-input-icon">
                      <Phone size={16} />
                    </span>
                    <input
                      type="tel"
                      maxLength={14}
                      className={`cf-input ${errors.phone ? 'err-border' : ''}`}
                      placeholder="10-digit number"
                      value={formData.phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setFormData({ ...formData, phone: val });
                        if (errors.phone) setErrors({ ...errors, phone: null });
                      }}
                    />
                  </div>
                </div>
                {errors.phone && <div className="cf-error-text">{errors.phone}</div>}
              </div>

              {/* Current Location */}
              <div className="cf-form-group">
                <label className="cf-label">
                  Current Location <span className="cf-req">*</span>
                </label>
                <Select
                  showSearch
                  allowClear
                  prefix={<MapPin size={16} />}
                  placeholder="e.g. Chennai"
                  value={formData.location || undefined}
                  onSearch={handleSearchLocation}
                  onChange={(val) => {
                    setFormData({ ...formData, location: val || '' });
                    if (errors.location) setErrors({ ...errors, location: null });
                  }}
                  filterOption={false}
                  loading={loadingLocations}
                  className={`cf-location-select ${errors.location ? 'err-border' : ''}`}
                  classNames={{
                    popup: { root: 'cf-search-select-dropdown' },
                  }}
                  notFoundContent={
                    loadingLocations ? (
                      <div style={{ padding: '8px 12px', color: '#64748b', fontSize: '13px' }}>
                        Searching cities...
                      </div>
                    ) : (
                      <div style={{ padding: '8px 12px', color: '#94a3b8', fontSize: '13px' }}>
                        No matching city found
                      </div>
                    )
                  }
                  options={locationOptions.map((loc) => ({
                    label: loc,
                    value: loc,
                  }))}
                />
                {errors.location && <div className="cf-error-text">{errors.location}</div>}
              </div>

              {/* Password Fields */}
              <div className="cf-form-group">
                <label className="cf-label">
                  Create Password <span className="cf-req">*</span>
                </label>
                <div className="cf-input-wrapper">
                  <span className="cf-input-icon">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={`cf-input ${errors.password ? 'err-border' : ''}`}
                    placeholder="At least 6 characters"
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      if (errors.password) setErrors({ ...errors, password: null });
                    }}
                  />
                  <button
                    type="button"
                    className="cf-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <div className="cf-error-text">{errors.password}</div>}
              </div>

              <div className="cf-form-group" style={{ marginBottom: 0 }}>
                <label className="cf-label">
                  Confirm Password <span className="cf-req">*</span>
                </label>
                <div className="cf-input-wrapper">
                  <span className="cf-input-icon">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className={`cf-input ${errors.confirmPassword ? 'err-border' : ''}`}
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={(e) => {
                      setFormData({ ...formData, confirmPassword: e.target.value });
                      if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null });
                    }}
                  />
                  <button
                    type="button"
                    className="cf-password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <div className="cf-error-text">{errors.confirmPassword}</div>
                )}
              </div>
            </div>
          </div>

          {/* ===================== RIGHT COLUMN: Professional & Preferences ===================== */}
          <div className="cf-column-right">
            {/* Card 2: Professional Details */}
            <div className="cf-card">
              <div className="cf-card-header">
                <div className="cf-card-icon indigo">
                  <Briefcase />
                </div>
                <div>
                  <h2 className="cf-card-title">Professional Details</h2>
                  <p className="cf-card-subtitle">Your current company role, tenure, and headquarters</p>
                </div>
              </div>

              {/* Current Company & Designation */}
              <div className="cf-row-2">
                <div className="cf-form-group">
                  <label className="cf-label">
                    Current Company Name <span className="cf-req">*</span>
                  </label>
                  <div className="cf-input-wrapper">
                    <span className="cf-input-icon">
                      <Building size={16} />
                    </span>
                    <input
                      type="text"
                      className={`cf-input ${errors.companyName ? 'err-border' : ''}`}
                      placeholder="e.g. Acme Technologies Pvt Ltd"
                      value={formData.companyName}
                      onChange={(e) => {
                        setFormData({ ...formData, companyName: e.target.value });
                        if (errors.companyName) setErrors({ ...errors, companyName: null });
                      }}
                    />
                  </div>
                  {errors.companyName && <div className="cf-error-text">{errors.companyName}</div>}
                </div>

                <div className="cf-form-group">
                  <label className="cf-label">
                    Current Designation <span className="cf-req">*</span>
                  </label>
                  <div className="cf-input-wrapper">
                    <span className="cf-input-icon">
                      <Briefcase size={16} />
                    </span>
                    <input
                      type="text"
                      className={`cf-input ${errors.designation ? 'err-border' : ''}`}
                      placeholder="e.g. Talent Acquisition Lead"
                      value={formData.designation}
                      onChange={(e) => {
                        setFormData({ ...formData, designation: e.target.value });
                        if (errors.designation) setErrors({ ...errors, designation: null });
                      }}
                    />
                  </div>
                  {errors.designation && <div className="cf-error-text">{errors.designation}</div>}
                </div>
              </div>

              <div className="cf-row-2">
                <div className="cf-form-group">
                  <label className="cf-label">Company Website Link</label>
                  <div className="cf-input-wrapper">
                    <span className="cf-input-icon">
                      <Globe size={16} />
                    </span>
                    <input
                      type="url"
                      className="cf-input"
                      placeholder="e.g. https://www.company.com"
                      value={formData.websiteUrl}
                      onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                    />
                  </div>
                </div>

                <div className="cf-form-group">
                  <label className="cf-label">Established Date</label>
                  <div className="cf-input-wrapper">
                    <span className="cf-input-icon">
                      <Calendar size={16} />
                    </span>
                    <input
                      type="text"
                      className="cf-input"
                      placeholder="e.g. 2018 or 15-08-2015"
                      value={formData.establishedDate}
                      onChange={(e) => setFormData({ ...formData, establishedDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Sub-card: Company Address */}
              <div className="cf-subcard">
                <h4 className="cf-subcard-title">
                  <MapPin size={16} color="#2563eb" /> Company Office Address
                </h4>

                <div className="cf-row-2">
                  <div className="cf-form-group">
                    <label className="cf-label">
                      Address Line 1 <span className="cf-req">*</span>
                    </label>
                    <input
                      type="text"
                      className={`cf-input no-icon ${errors.address1 ? 'err-border' : ''}`}
                      placeholder="e.g. Tower 3, Prestige Tech Cloud"
                      value={formData.address1}
                      onChange={(e) => {
                        setFormData({ ...formData, address1: e.target.value });
                        if (errors.address1) setErrors({ ...errors, address1: null });
                      }}
                    />
                    {errors.address1 && <div className="cf-error-text">{errors.address1}</div>}
                  </div>

                  <div className="cf-form-group">
                    <label className="cf-label">Address Line 2 (Optional)</label>
                    <input
                      type="text"
                      className="cf-input no-icon"
                      placeholder="e.g. 5th Floor, Suite 502"
                      value={formData.address2}
                      onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
                    />
                  </div>
                </div>

                <div className="cf-row-3">
                  <div className="cf-form-group" style={{ marginBottom: 0 }}>
                    <label className="cf-label">
                      City <span className="cf-req">*</span>
                    </label>
                    <input
                      type="text"
                      className={`cf-input no-icon ${errors.city ? 'err-border' : ''}`}
                      placeholder="e.g. Bengaluru"
                      value={formData.city}
                      onChange={(e) => {
                        setFormData({ ...formData, city: e.target.value });
                        if (errors.city) setErrors({ ...errors, city: null });
                      }}
                    />
                    {errors.city && <div className="cf-error-text">{errors.city}</div>}
                  </div>

                  <div className="cf-form-group" style={{ marginBottom: 0 }}>
                    <label className="cf-label">
                      State / Region <span className="cf-req">*</span>
                    </label>
                    <input
                      type="text"
                      className={`cf-input no-icon ${errors.state ? 'err-border' : ''}`}
                      placeholder="e.g. Karnataka"
                      value={formData.state}
                      onChange={(e) => {
                        setFormData({ ...formData, state: e.target.value });
                        if (errors.state) setErrors({ ...errors, state: null });
                      }}
                    />
                    {errors.state && <div className="cf-error-text">{errors.state}</div>}
                  </div>

                  <div className="cf-form-group" style={{ marginBottom: 0 }}>
                    <label className="cf-label">
                      Zip / PIN Code <span className="cf-req">*</span>
                    </label>
                    <input
                      type="text"
                      className={`cf-input no-icon ${errors.pincode ? 'err-border' : ''}`}
                      placeholder="e.g. 560100"
                      value={formData.pincode}
                      onChange={(e) => {
                        setFormData({ ...formData, pincode: e.target.value });
                        if (errors.pincode) setErrors({ ...errors, pincode: null });
                      }}
                    />
                    {errors.pincode && <div className="cf-error-text">{errors.pincode}</div>}
                  </div>
                </div>
              </div>

              {/* Add Previous Company Expander */}
              <div className="cf-prev-companies-container">
                <button
                  type="button"
                  className="cf-add-prev-btn"
                  onClick={addPreviousCompany}
                >
                  <Plus size={15} /> Add Previous Company Experience
                </button>

                {previousCompanies.map((prev, idx) => (
                  <div key={prev.id} className="cf-prev-company-item">
                    <div className="cf-prev-item-header">
                      <span className="cf-prev-item-badge">Previous Role #{idx + 1}</span>
                      <button
                        type="button"
                        className="cf-prev-delete-btn"
                        onClick={() => removePreviousCompany(prev.id)}
                        title="Remove Company"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="cf-row-2">
                      <div className="cf-form-group">
                        <label className="cf-label">Company Name</label>
                        <input
                          type="text"
                          className="cf-input no-icon"
                          placeholder="Previous Company"
                          value={prev.company_name}
                          onChange={(e) => updatePreviousCompany(prev.id, 'company_name', e.target.value)}
                        />
                      </div>
                      <div className="cf-form-group">
                        <label className="cf-label">Designation</label>
                        <input
                          type="text"
                          className="cf-input no-icon"
                          placeholder="e.g. Recruiter"
                          value={prev.designation}
                          onChange={(e) => updatePreviousCompany(prev.id, 'designation', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="cf-row-2" style={{ marginBottom: 0 }}>
                      <div className="cf-form-group" style={{ marginBottom: 0 }}>
                        <CommonSelectField
                          label="Start Year"
                          value={prev.from_year}
                          onChange={(val) => updatePreviousCompany(prev.id, 'from_year', val)}
                          options={YEARS.map((y) => ({ label: y, value: y }))}
                          placeholder="Select Year"
                        />
                      </div>
                      <div className="cf-form-group" style={{ marginBottom: 0 }}>
                        <CommonSelectField
                          label="End Year"
                          value={prev.to_year}
                          onChange={(val) => updatePreviousCompany(prev.id, 'to_year', val)}
                          options={YEARS.map((y) => ({ label: y, value: y }))}
                          placeholder="Select Year"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 3: Hiring Preferences */}
            <div className="cf-card">
              <div className="cf-card-header">
                <div className="cf-card-icon emerald">
                  <Award />
                </div>
                <div>
                  <h2 className="cf-card-title">Hiring Preferences</h2>
                  <p className="cf-card-subtitle">Define candidate levels, industries, functions, and key skills you recruit for</p>
                </div>
              </div>

              {/* Total Experience in Hiring & Referral Code */}
              <div className="cf-row-2">
                <div className="cf-form-group">
                  <CommonSelectField
                    label="Total Experience in Hiring"
                    mandatory
                    value={formData.hiringExperience}
                    onChange={(val) => setFormData({ ...formData, hiringExperience: val })}
                    options={HIRING_EXPERIENCE_OPTIONS}
                    placeholder="Select Experience"
                  />
                </div>

                <div className="cf-form-group">
                  <label className="cf-label">Referral Code (Optional)</label>
                  <div className="cf-input-wrapper">
                    <input
                      type="text"
                      className="cf-input no-icon"
                      placeholder="e.g. FASTHIRING2026"
                      value={formData.referralCode}
                      onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Level I Hire For (Selectable Chips) */}
              <div className="cf-form-group">
                <label className="cf-label">
                  Level I Hire For <span className="cf-req">*</span>
                </label>
                <div className="cf-chips-grid">
                  {HIRING_LEVELS_OPTIONS.map((lvl) => {
                    const isSelected = selectedHiringLevels.includes(lvl);
                    return (
                      <div
                        key={lvl}
                        className={`cf-chip ${isSelected ? 'active' : ''}`}
                        onClick={() => toggleHiringLevel(lvl)}
                      >
                        {isSelected && <Check size={13} className="cf-chip-check" />}
                        <span>{lvl}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ==================== 1. SEARCHABLE SELECT: Industry (Max 4) ==================== */}
              <div className="cf-form-group">
                <div className="cf-chips-header">
                  <label className="cf-label" style={{ margin: 0 }}>
                    Industry <span className="cf-req">*</span>
                  </label>
                  <span
                    className={`cf-counter-badge ${selectedIndustries.length >= 4 ? 'limit-reached' : ''
                      }`}
                  >
                    {selectedIndustries.length} / 4 Selected
                  </span>
                </div>

                <Select
                  mode="multiple"
                  showSearch
                  allowClear
                  maxTagCount={4}
                  placeholder="Type to search and select industries (Max 4)..."
                  value={selectedIndustries}
                  loading={loadingIndustries}
                  onChange={(vals) => {
                    if (vals.length > 4) {
                      showToast('You can select a maximum of 4 industries.', 'error');
                      return;
                    }
                    setSelectedIndustries(vals);
                    if (errors.industries) setErrors({ ...errors, industries: null });
                  }}
                  filterOption={(input, option) =>
                    (option?.label || option?.value || '')
                      .toLowerCase()
                      .includes(input.toLowerCase().trim())
                  }
                  options={allIndustries.map((name) => ({
                    label: name,
                    value: name,
                    disabled:
                      selectedIndustries.length >= 4 && !selectedIndustries.includes(name),
                  }))}
                  className={`cf-search-select ${errors.industries ? 'err-border' : ''}`}
                  classNames={{
                    popup: { root: 'cf-search-select-dropdown' },
                  }}
                  notFoundContent={
                    <div style={{ padding: '8px', color: '#94a3b8', fontSize: '13px' }}>
                      No matching industry found
                    </div>
                  }
                />
                {errors.industries && <div className="cf-error-text">{errors.industries}</div>}
              </div>

              {/* ==================== 2. SEARCHABLE SELECT: Function / Domain (Max 4) ==================== */}
              <div className="cf-form-group">
                <div className="cf-chips-header">
                  <label className="cf-label" style={{ margin: 0 }}>
                    Function / Domain <span className="cf-req">*</span>
                  </label>
                  <span
                    className={`cf-counter-badge ${selectedFunctions.length >= 4 ? 'limit-reached' : ''
                      }`}
                  >
                    {selectedFunctions.length} / 4 Selected
                  </span>
                </div>

                <Select
                  mode="multiple"
                  showSearch
                  allowClear
                  maxTagCount={4}
                  placeholder="Type to search and select functional areas or domains (Max 4)..."
                  value={selectedFunctions}
                  loading={loadingFunctions}
                  onChange={(vals) => {
                    if (vals.length > 4) {
                      showToast('You can select a maximum of 4 functions.', 'error');
                      return;
                    }
                    setSelectedFunctions(vals);
                    if (errors.functions) setErrors({ ...errors, functions: null });
                  }}
                  filterOption={(input, option) =>
                    (option?.label || option?.value || '')
                      .toLowerCase()
                      .includes(input.toLowerCase().trim())
                  }
                  options={allFunctions.map((name) => ({
                    label: name,
                    value: name,
                    disabled:
                      selectedFunctions.length >= 4 && !selectedFunctions.includes(name),
                  }))}
                  className={`cf-search-select ${errors.functions ? 'err-border' : ''}`}
                  classNames={{
                    popup: { root: 'cf-search-select-dropdown' },
                  }}
                  notFoundContent={
                    <div style={{ padding: '8px', color: '#94a3b8', fontSize: '13px' }}>
                      No matching function/domain found
                    </div>
                  }
                />
                {errors.functions && <div className="cf-error-text">{errors.functions}</div>}
              </div>

              {/* Skills I Hire For */}
              <div className="cf-form-group">
                <label className="cf-label">
                  Skills I Hire For <span className="cf-req">*</span>
                </label>
                <div className="cf-skills-box">
                  {skillsList.map((skill) => (
                    <span key={skill} className="cf-skill-tag">
                      {skill}
                      <button
                        type="button"
                        className="cf-skill-tag-remove"
                        onClick={() => handleRemoveSkill(skill)}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    className="cf-skills-input"
                    placeholder="Type skill & press Enter..."
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleSkillKeyDown}
                    onBlur={() => handleAddSkill()}
                  />
                </div>
                {errors.skills && <div className="cf-error-text">{errors.skills}</div>}
              </div>

              {/* Terms & Agreement Checkbox */}
              <div className="cf-terms-container">
                <input
                  type="checkbox"
                  id="cf-terms-cb"
                  className="cf-terms-checkbox"
                  checked={formData.agreeTerms}
                  onChange={(e) => {
                    setFormData({ ...formData, agreeTerms: e.target.checked });
                    if (errors.agreeTerms) setErrors({ ...errors, agreeTerms: null });
                  }}
                />
                <label htmlFor="cf-terms-cb" className="cf-terms-text">
                  I agree to use the aforesaid details to create my Recruiter Profile & display it on the CareerFast platform, and also agree to be bound by the{' '}
                  <a href="/terms" target="_blank" rel="noreferrer" className="cf-terms-link">
                    Terms of Use
                  </a>{' '}
                  &{' '}
                  <a href="/privacy" target="_blank" rel="noreferrer" className="cf-terms-link">
                    Privacy Policy
                  </a>{' '}
                  of CareerFast.
                </label>
              </div>
              {errors.agreeTerms && <div className="cf-error-text">{errors.agreeTerms}</div>}

              {/* Submit CTA Button */}
              <div className="cf-submit-container">
                <button type="submit" className="cf-submit-btn" disabled={isLoading}>
                  {isLoading ? (
                    <span>Creating Recruiter Profile...</span>
                  ) : (
                    <>
                      <span>Complete Registration & Go to Dashboard</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Trust & Assurance Footnote */}
      <footer className="cf-trust-footer">
        <div className="cf-trust-grid">
          <div className="cf-trust-item">
            <div className="cf-trust-icon">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h5 className="cf-trust-title">100% Verified Profiles</h5>
              <p className="cf-trust-desc">Screened candidates and genuine portfolios</p>
            </div>
          </div>

          <div className="cf-trust-item">
            <div className="cf-trust-icon">
              <Sparkles size={20} />
            </div>
            <div>
              <h5 className="cf-trust-title">Zero Hidden Fees</h5>
              <p className="cf-trust-desc">40 free job postings on onboarding</p>
            </div>
          </div>

          <div className="cf-trust-item">
            <div className="cf-trust-icon">
              <Lock size={20} />
            </div>
            <div>
              <h5 className="cf-trust-title">256-Bit SSL Security</h5>
              <p className="cf-trust-desc">Enterprise data confidentiality & privacy</p>
            </div>
          </div>

          <div className="cf-trust-item">
            <div className="cf-trust-icon">
              <Globe size={20} />
            </div>
            <div>
              <h5 className="cf-trust-title">Direct HR Hiring</h5>
              <p className="cf-trust-desc">Connect directly with applicants via chat & email</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
