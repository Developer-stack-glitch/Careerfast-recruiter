'use client';
import React, { useEffect, useState } from "react";
import {
    Form,
    message,
    Input,
    Select,
    Upload,
    DatePicker,
    Space,
    Button,
} from "antd";
import {
    UserOutlined,
    GlobalOutlined,
    ContactsOutlined,
    CloudUploadOutlined,
    CloseOutlined,
    PlusOutlined,
    ArrowRightOutlined,
    CheckOutlined,
    LinkOutlined,
    LogoutOutlined,
} from "@ant-design/icons";
import logoImg from "../images/hrportal_logo1.png";
import { motion, AnimatePresence } from "framer-motion";
import { insertHrProfileData, getHrProfileData, verifyEmail, verifyOtp, isProfileUpdated, getIndustryTypes } from "../ApiService/action";
import { WORLDWIDE_COUNTRY_CODES } from "../Common/countryPhoneCodes";
import dayjs from "dayjs";
import { useNavigate } from "@/routing-shim";
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';
import "../css/CreateHrProfile.css";

const { Option } = Select;

const normalizePhoneCode = (val) => {
    if (!val) return "IN +91";
    const stripped = val.replace(/[\uD83C-\uDBFF\uDC00-\uDFFF]+/g, '').trim();
    const found = WORLDWIDE_COUNTRY_CODES.find(c => 
        `${c.code} ${c.dial_code}` === stripped || 
        c.dial_code === stripped || 
        c.code === stripped ||
        val.includes(c.code) ||
        val.includes(c.dial_code)
    );
    return found ? `${found.code} ${found.dial_code}` : val;
};

const DEFAULT_INDUSTRIES = [
    "IT & Software",
    "Information Technology & Services",
    "Software Product & SaaS",
    "Artificial Intelligence & Machine Learning",
    "Banking, Financial Services & Insurance (BFSI)",
    "FinTech & Digital Payments",
    "Investment Banking & Venture Capital",
    "Healthcare & Hospitals",
    "Pharmaceuticals & Biotechnology",
    "Medical Devices & Diagnostics",
    "E-Commerce & Digital Marketplaces",
    "Retail & Wholesale Trade",
    "Consumer Goods & FMCG",
    "Automotive & Electric Vehicles",
    "Aerospace & Aviation",
    "Manufacturing, Industrial & Heavy Machinery",
    "Civil Engineering & Construction",
    "Real Estate & Property Management",
    "Architecture & Interior Design",
    "Telecommunications & Networking",
    "Electronics & Semiconductor Manufacturing",
    "Education, EdTech & Academia",
    "Higher Education & Research Institutes",
    "Energy, Power & Utilities",
    "Oil, Gas & Petroleum Exploration",
    "Renewable Energy & CleanTech",
    "Logistics, Supply Chain & Warehousing",
    "Freight Forwarding & Maritime Shipping",
    "Media, Entertainment & Publishing",
    "Gaming, Animation & VFX",
    "Advertising, Marketing & Public Relations",
    "Hospitality, Travel & Tourism",
    "Restaurants & Food Services",
    "Food Production & Processing",
    "Agriculture, Farming & AgriTech",
    "Management Consulting & Strategy",
    "Legal Services & Law Practice",
    "Accounting, Auditing & Taxation",
    "Human Resources & Staffing Services",
    "Non-Profit, NGO & Social Impact",
    "Government Administration & Public Policy",
    "Defense & Military Technology",
    "Security & Surveillance Systems",
    "Chemicals & Petrochemicals",
    "Mining, Metals & Metallurgy",
    "Textiles, Apparel & Fashion",
    "Environmental Services & Waste Management"
];

const CreateHrProfile = () => {
    const [form] = Form.useForm();
    const navigate = useNavigate();

    const [currentStep, setCurrentStep] = useState(0);
    const [progress, setProgress] = useState(25);
    const [loading, setLoading] = useState(false);
    const [loginUserId, setLoginUserId] = useState(null);

    const [logoImage, setLogoImage] = useState("");
    const [bannerImage, setBannerImage] = useState("");

    const [showOtpInput, setShowOtpInput] = useState(false);
    const [otpValue, setOtpValue] = useState("");
    const [otpError, setOtpError] = useState("");
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [verifyingEmail, setVerifyingEmail] = useState(false);

    const [industryList, setIndustryList] = useState(DEFAULT_INDUSTRIES);
    const [loadingIndustries, setLoadingIndustries] = useState(false);

    useEffect(() => {
        const fetchIndustries = async () => {
            try {
                setLoadingIndustries(true);
                const res = await getIndustryTypes();
                const list = res?.data?.data || res?.data || [];
                if (Array.isArray(list) && list.length > 0) {
                    const names = list.map(item => (typeof item === 'string' ? item : item.name)).filter(Boolean);
                    setIndustryList(names);
                }
            } catch (err) {
                console.warn("Could not fetch industry types from API, using defaults:", err);
            } finally {
                setLoadingIndustries(false);
            }
        };
        fetchIndustries();
    }, []);

    useEffect(() => {
        const init = async () => {
            try {
                const stored = localStorage.getItem("loginDetails");
                if (stored) {
                    const loginDetails = JSON.parse(stored);
                    const userId = loginDetails.id;
                    setLoginUserId(userId);

                    const res = await getHrProfileData(userId);
                    if (res?.data?.data) {
                        const profile = res.data.data;

                        const socials = [];
                        if (profile.facebook) socials.push({ platform: 'Facebook', url: profile.facebook });
                        if (profile.twitter) socials.push({ platform: 'Twitter', url: profile.twitter });
                        if (profile.instagram) socials.push({ platform: 'Instagram', url: profile.instagram });
                        if (profile.youtube) socials.push({ platform: 'Youtube', url: profile.youtube });

                        const indType = profile.industry_type === 'IT' ? 'IT & Software' : profile.industry_type;

                        form.setFieldsValue({
                            company_name: profile.company_name,
                            about_us: profile.about_us,
                            organization_type: profile.organization_type,
                            industry_type: indType,
                            team_size: profile.team_size,
                            year_established: profile.year_established ? dayjs(profile.year_established) : null,
                            website_url: profile.website_url,
                            vision: profile.vision,
                            map_location: profile.map_location,
                            contact_phone: profile.contact_phone,
                            contact_email: profile.contact_email,
                            socialLinks: socials.length > 0 ? socials : undefined
                        });

                        if (profile.profile_image) setLogoImage(profile.profile_image);
                        if (profile.banner_image) setBannerImage(profile.banner_image);

                        const currentPhoneCode = form.getFieldValue("phone_code");
                        if (currentPhoneCode) {
                            form.setFieldsValue({ phone_code: normalizePhoneCode(currentPhoneCode) });
                        } else if (loginDetails.phone_code) {
                            form.setFieldsValue({ phone_code: normalizePhoneCode(loginDetails.phone_code) });
                        }

                        // Check if email is already verified
                        const emailToCheck = profile.contact_email || loginDetails.email;
                        if (profile.is_email_verified === 1 || loginDetails.is_email_verified === 1) {
                            setIsEmailVerified(true);
                        } else if (emailToCheck) {
                            try {
                                const isUpdatedRes = await isProfileUpdated({ email: emailToCheck });
                                if (isUpdatedRes?.data?.data) {
                                    setIsEmailVerified(true);
                                    loginDetails.is_email_verified = 1;
                                    localStorage.setItem("loginDetails", JSON.stringify(loginDetails));
                                }
                            } catch (e) { }
                        }
                    } else {
                        // For fresh profile creation, prefill login email if available
                        if (loginDetails.email) {
                            form.setFieldsValue({ contact_email: loginDetails.email });
                        }
                        if (loginDetails.is_email_verified === 1) {
                            setIsEmailVerified(true);
                        }
                    }
                }
            } catch (error) {
                console.error("Error loading existing profile", error);
            }
        };
        init();
    }, [form]);

    const handleVerifyEmail = async () => {
        const email = form.getFieldValue("contact_email");
        if (!email) {
            message.error("Please enter an email address first.");
            return;
        }

        setVerifyingEmail(true);
        try {
            const isUpdatedRes = await isProfileUpdated({ email });
            // API returns { message: "...", data: true/false } inside axios response data
            if (isUpdatedRes?.data?.data) {
                setIsEmailVerified(true);
                message.success("Email is already verified!");
                try {
                    const stored = localStorage.getItem("loginDetails");
                    if (stored) {
                        const loginDetails = JSON.parse(stored);
                        loginDetails.is_email_verified = 1;
                        localStorage.setItem("loginDetails", JSON.stringify(loginDetails));
                    }
                } catch (e) { }
                await submitProfile(true);
                return;
            }
        } catch (e) {
            // Ignore error if email not found in users table
        }

        try {
            const res = await verifyEmail({ email });
            if (res.status === 200 || res.status === 201) {
                message.success("OTP sent to your email.");
                setShowOtpInput(true);
            }
        } catch (error) {
            message.error("Failed to send OTP.");
        } finally {
            setVerifyingEmail(false);
        }
    };

    const handleConfirmOtp = async () => {
        const email = form.getFieldValue("contact_email");
        if (!otpValue) {
            setOtpError("Please enter the OTP.");
            return;
        }
        setVerifyingEmail(true);
        setOtpError("");
        try {
            const res = await verifyOtp({ email, otp: otpValue });
            if (res.status === 200 || res.status === 201) {
                message.success("Email verified successfully!");
                setIsEmailVerified(true);
                setShowOtpInput(false);
                try {
                    const stored = localStorage.getItem("loginDetails");
                    if (stored) {
                        const loginDetails = JSON.parse(stored);
                        loginDetails.is_email_verified = 1;
                        localStorage.setItem("loginDetails", JSON.stringify(loginDetails));
                    }
                } catch (e) { }
                await submitProfile(true);
            }
        } catch (error) {
            setOtpError("Invalid OTP. Please try again.");
            message.error("Invalid OTP. Please try again.");
        } finally {
            setVerifyingEmail(false);
        }
    };

    const handleImageChange = (info, type) => {
        const file = info.file.originFileObj || info.file;
        if (file) {
            // Validate file size (limit to 1MB)
            const isLt1M = file.size / 1024 / 1024 < 1;
            if (!isLt1M) {
                message.error('Image must be smaller than 1MB!');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                if (type === "logo") setLogoImage(reader.result);
                if (type === "banner") setBannerImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const nextStep = async () => {
        try {
            await form.validateFields();

            if (currentStep === 0) {
                if ((logoImage && logoImage.length > 1500000) || (bannerImage && bannerImage.length > 1500000)) {
                    toast.error("The uploaded image is too large. Please use an image under 1MB.");
                    return;
                }
            }

            setCurrentStep(currentStep + 1);
            setProgress(progress + 25);
        } catch (error) {
            message.error("Please fill all required fields correctly.");
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
            setProgress(progress - 25);
        }
    };

    const submitProfile = async (isAutoSubmit = false) => {
        try {
            await form.validateFields(); // Validate the current step
            if (!isEmailVerified && isAutoSubmit !== true) {
                form.setFields([
                    {
                        name: 'contact_email',
                        errors: ['Please verify your email before finishing.'],
                    },
                ]);
                message.error("Please verify your email before finishing.");
                return;
            }
            const values = form.getFieldsValue(true); // Retrieve all values including unmounted steps
            setLoading(true);

            if ((logoImage && logoImage.length > 1500000) || (bannerImage && bannerImage.length > 1500000)) {
                toast.error("The uploaded image is too large. Please use an image under 1MB.");
                setLoading(false);
                return;
            }

            const social_links = {};
            if (values.socialLinks) {
                values.socialLinks.forEach((link) => {
                    if (link && link.platform && link.url) {
                        social_links[link.platform.toLowerCase()] = link.url;
                    }
                });
            }

            const payload = {
                user_id: loginUserId,
                profile_image: logoImage,
                banner_image: bannerImage,
                company_name: values.company_name,
                about_us: values.about_us,
                organization_type: values.organization_type,
                industry_type: values.industry_type,
                team_size: values.team_size,
                year_established: values.year_established,
                website_url: values.website_url,
                vision: values.vision,
                social_links: social_links,
                map_location: values.map_location,
                contact_phone: values.contact_phone,
                contact_email: values.contact_email,
            };

            const res = await insertHrProfileData(payload);
            if (res.status === 200 || res.status === 201) {
                message.success("HR Profile created successfully!");
                setCurrentStep(4);
                setProgress(100);
            }
        } catch (error) {
            console.error(error);
            const backendDetails = String(error.response?.data?.details || error.message || "");
            const backendMessage = String(error.response?.data?.message || "");
            let displayMessage = "An error occurred while saving the profile.";

            if (backendDetails.includes("max_allowed_packet") || backendDetails.includes("ECONNRESET")) {
                displayMessage = "The uploaded image is too large. Please use an image under 1MB.";
            } else if (backendDetails || backendMessage) {
                displayMessage = backendDetails || backendMessage;
            }

            toast.error(displayMessage);
            message.error(displayMessage); // Fallback to antd message as well
        } finally {
            setLoading(false);
        }
    };
    const handleLogOut = () => {
        localStorage.removeItem("loginDetails");
        localStorage.removeItem("AccessToken");
        localStorage.removeItem("profileProgress");

        document.cookie = "AccessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "loginDetails=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

        navigate("/login");
        message.info("You are logged out");
    };

    const pageTransition = {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 },
        transition: { duration: 0.3 },
    };

    const steps = [
        { title: "Company Info", icon: <UserOutlined /> },
        { title: "Founding Info", icon: <UserOutlined style={{ fontSize: '16px' }} /> },
        { title: "Social Media Profile", icon: <GlobalOutlined /> },
        { title: "Contact", icon: <ContactsOutlined /> },
    ];

    return (
        <div className="hr-profile-container">
            <div className="hr-header">
                <div className="hr-logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
                    <img
                        src={logoImg?.src || logoImg}
                        alt="Careerfast Logo"
                        style={{ height: '45px' }}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div className="hr-progress-container">
                        <div className="hr-progress-text">
                            <span>Setup Progress</span>
                            <motion.span
                                className="percentage"
                                animate={{ color: progress === 100 ? '#10B981' : '#0A65CC' }}
                                transition={{ duration: 0.3 }}
                            >
                                {progress}% Completed
                            </motion.span>
                        </div>
                        <div className="hr-progress-bar-bg">
                            <motion.div
                                className="hr-progress-bar-fill"
                                initial={{ width: 0, backgroundColor: '#0A65CC' }}
                                animate={{
                                    width: `${progress}%`,
                                    backgroundColor: progress === 100 ? '#10B981' : '#0A65CC'
                                }}
                                transition={{
                                    width: { type: "spring", stiffness: 60, damping: 12 },
                                    backgroundColor: { duration: 0.3 }
                                }}
                            />
                        </div>
                    </div>
                    <Button type="text" danger onClick={handleLogOut} icon={<LogoutOutlined />} style={{ fontWeight: 600 }}>
                        Logout
                    </Button>
                </div>
            </div>

            {currentStep < 4 && (
                <div className="hr-stepper">
                    {steps.map((step, index) => (
                        <div
                            key={index}
                            className={`hr-step-item ${currentStep === index ? 'active' : ''}`}
                        >
                            <span className="hr-step-icon">{step.icon}</span>
                            {step.title}
                        </div>
                    ))}
                </div>
            )}

            <Form
                form={form}
                layout="vertical"
                initialValues={{
                    company_name: "",
                    about_us: "",
                    organization_type: "",
                    industry_type: "",
                    team_size: "",
                    year_established: "",
                    website_url: "",
                    vision: "",
                    map_location: "",
                    contact_phone: "",
                    contact_email: "",
                    phone_code: "IN +91"
                }}
            >
                <AnimatePresence mode="wait">
                    {currentStep === 0 && (
                        <motion.div key="step1" {...pageTransition}>
                            <h2 className="hr-form-title">Logo & Banner Image</h2>
                            <div className="hr-upload-row">
                                <div className="hr-upload-box hr-upload-box-logo text-center">
                                    <Upload.Dragger
                                        accept="image/*"
                                        showUploadList={false}
                                        onChange={(info) => handleImageChange(info, "logo")}
                                    >
                                        {logoImage ? (
                                            <img src={logoImage} alt="logo" style={{ maxHeight: "140px", maxWidth: "100%", objectFit: "contain", padding: '10px' }} />
                                        ) : (
                                            <>
                                                <CloudUploadOutlined className="hr-upload-icon" />
                                                <div className="hr-upload-text"><span>Browse photo</span> or drop here</div>
                                                <div className="hr-upload-hint">A photo larger than 400 pixels<br />work best. Max photo size 5 MB.</div>
                                            </>
                                        )}
                                    </Upload.Dragger>
                                </div>
                                <div className="hr-upload-box hr-upload-box-banner">
                                    <Upload.Dragger
                                        accept="image/*"
                                        showUploadList={false}
                                        onChange={(info) => handleImageChange(info, "banner")}
                                    >
                                        {bannerImage ? (
                                            <img src={bannerImage} alt="banner" style={{ height: "100%", width: "100%", maxHeight: '160px', objectFit: "cover", borderRadius: "6px" }} />
                                        ) : (
                                            <>
                                                <CloudUploadOutlined className="hr-upload-icon" />
                                                <div className="hr-upload-text"><span>Browse photo</span> or drop here</div>
                                                <div className="hr-upload-hint">Banner images optical dimension 1520x400. Supported<br />format JPEG, PNG. Max photo size 5 MB.</div>
                                            </>
                                        )}
                                    </Upload.Dragger>
                                </div>
                            </div>

                            <Form.Item
                                name="company_name"
                                label={<span className="hr-form-label">Company name</span>}
                                rules={[{ required: true, message: "Company name is required" }]}
                            >
                                <Input size="large" placeholder="Enter company name" />
                            </Form.Item>

                            <Form.Item
                                name="about_us"
                                label={<span className="hr-form-label">About Us</span>}
                                rules={[{ required: true, message: "Please tell us about your company" }]}
                            >
                                <ReactQuill
                                    theme="snow"
                                    placeholder="Write down about your company here. Let the candidate know who we are..."
                                    style={{ height: '160px', marginBottom: '60px' }}
                                    modules={{
                                        toolbar: [
                                            ['bold', 'italic', 'underline', 'strike'],
                                            ['link'],
                                            [{ 'list': 'ordered' }, { 'list': 'bullet' }]
                                        ]
                                    }}
                                />
                            </Form.Item>
                        </motion.div>
                    )}

                    {currentStep === 1 && (
                        <motion.div key="step2" {...pageTransition}>
                            <div className="hr-grid-3">
                                <Form.Item name="organization_type" label={<span className="hr-form-label">Organization Type</span>} rules={[{ required: true }]}>
                                    <Select size="large" placeholder="Select...">
                                        <Option value="Private">Private</Option>
                                        <Option value="Public">Public</Option>
                                        <Option value="NGO">NGO</Option>
                                        <Option value="Startup">Startup</Option>
                                    </Select>
                                </Form.Item>

                                <Form.Item 
                                    name="industry_type" 
                                    label={<span className="hr-form-label">Industry Types</span>} 
                                    rules={[{ required: true, message: "Please select an industry type" }]}
                                >
                                    <Select 
                                        size="large" 
                                        placeholder="Select industry type..." 
                                        showSearch
                                        loading={loadingIndustries}
                                        optionFilterProp="children"
                                        filterOption={(input, option) =>
                                            (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                                        }
                                    >
                                        {industryList.map((ind) => (
                                            <Option key={ind} value={ind}>
                                                {ind}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>

                                <Form.Item name="team_size" label={<span className="hr-form-label">Team Size</span>} rules={[{ required: true }]}>
                                    <Select size="large" placeholder="Select...">
                                        <Option value="1-10">1-10</Option>
                                        <Option value="11-50">11-50</Option>
                                        <Option value="51-200">51-200</Option>
                                        <Option value="200+">200+</Option>
                                    </Select>
                                </Form.Item>
                            </div>

                            <div className="hr-grid-2">
                                <Form.Item name="year_established" label={<span className="hr-form-label">Year of Establishment</span>} rules={[{ required: true }]}>
                                    <DatePicker size="large" format="DD/MM/YYYY" placeholder="dd/mm/yyyy" style={{ width: '100%' }} />
                                </Form.Item>

                                <Form.Item name="website_url" label={<span className="hr-form-label">Company Website</span>}>
                                    <Input prefix={<LinkOutlined style={{ color: '#bfbfbf', marginRight: '4px' }} />} size="large" placeholder="Website url..." />
                                </Form.Item>
                            </div>

                            <Form.Item name="vision" label={<span className="hr-form-label">Company Vision</span>} rules={[{ required: true }]}>
                                <ReactQuill
                                    theme="snow"
                                    placeholder="Tell us about your company vision..."
                                    style={{ height: '160px', marginBottom: '60px' }}
                                    modules={{
                                        toolbar: [
                                            ['bold', 'italic', 'underline', 'strike'],
                                            ['link'],
                                            [{ 'list': 'ordered' }, { 'list': 'bullet' }]
                                        ]
                                    }}
                                />
                            </Form.Item>
                        </motion.div>
                    )}

                    {currentStep === 2 && (
                        <motion.div key="step3" {...pageTransition}>
                            <Form.List name="socialLinks" initialValue={[{ platform: 'Facebook', url: '' }, { platform: 'Twitter', url: '' }, { platform: 'Instagram', url: '' }, { platform: 'Youtube', url: '' }]}>
                                {(fields, { add, remove }) => (
                                    <>
                                        {fields.map(({ key, name, ...restField }, index) => {
                                            return (
                                                <div key={key} style={{ marginBottom: '24px' }}>
                                                    <div className="hr-form-label">{`Social Link ${index + 1}`}</div>
                                                    <div className="hr-social-row" style={{ display: 'flex', gap: '16px' }}>
                                                        <Form.Item
                                                            {...restField}
                                                            name={[name, 'platform']}
                                                            rules={[{ required: true, message: 'Missing platform' }]}
                                                            style={{ margin: 0, width: '250px' }}
                                                        >
                                                            <Select size="large">
                                                                <Option value="Facebook">Facebook</Option>
                                                                <Option value="Twitter">Twitter</Option>
                                                                <Option value="Instagram">Instagram</Option>
                                                                <Option value="Youtube">Youtube</Option>
                                                            </Select>
                                                        </Form.Item>

                                                        <Form.Item
                                                            {...restField}
                                                            name={[name, 'url']}
                                                            rules={[{ required: true, message: 'Missing URL' }]}
                                                            style={{ margin: 0, flex: 1 }}
                                                        >
                                                            <Input size="large" placeholder="Profile link/url..." />
                                                        </Form.Item>

                                                        <button type="button" className="hr-remove-btn" onClick={() => remove(name)}>
                                                            <CloseOutlined style={{ fontSize: '14px' }} />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div className="hr-add-social-btn" onClick={() => add()}>
                                            <PlusOutlined /> Add New Social Link
                                        </div>
                                    </>
                                )}
                            </Form.List>
                        </motion.div>
                    )}

                    {currentStep === 3 && (
                        <motion.div key="step4" {...pageTransition}>
                            <Form.Item name="map_location" label={<span className="hr-form-label">Map Location</span>} rules={[{ required: true }]}>
                                <Input size="large" />
                            </Form.Item>

                            <Form.Item label={<span className="hr-form-label">Phone</span>} required style={{ marginBottom: '24px' }}>
                                <Space.Compact style={{ width: '100%' }}>
                                    <Form.Item name="phone_code" noStyle>
                                        <Select 
                                            size="large" 
                                            showSearch
                                            optionLabelProp="label"
                                            popupMatchSelectWidth={320}
                                            style={{ width: '140px' }}
                                            filterOption={(input, option) => {
                                                const searchStr = (option?.searchtext || '').toLowerCase();
                                                return searchStr.includes(input.toLowerCase().trim());
                                            }}
                                        >
                                            {WORLDWIDE_COUNTRY_CODES.map((c) => (
                                                <Option 
                                                    key={c.code} 
                                                    value={`${c.code} ${c.dial_code}`}
                                                    label={`${c.code} ${c.dial_code}`}
                                                    searchtext={`${c.name} ${c.code} ${c.dial_code}`}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                                        <span style={{ color: '#333' }}>{c.name}</span>
                                                        <span style={{ color: '#0A65CC', fontWeight: 600 }}>{c.code} {c.dial_code}</span>
                                                    </div>
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                    <Form.Item name="contact_phone" noStyle rules={[{ required: true, message: "Phone number is required" }]}>
                                        <Input size="large" style={{ width: 'calc(100% - 140px)' }} placeholder="Phone number.." />
                                    </Form.Item>
                                </Space.Compact>
                            </Form.Item>

                            <Form.Item label={<span className="hr-form-label">Email</span>} required>
                                <Space.Compact style={{ width: '100%' }}>
                                    <Form.Item name="contact_email" noStyle rules={[{ required: true, type: 'email', message: 'Valid email is required' }]}>
                                        <Input
                                            size="large"
                                            prefix={<span style={{ color: '#0A65CC', marginRight: '4px' }}>✉️</span>}
                                            placeholder="Email address"
                                            style={{ width: 'calc(100% - 120px)' }}
                                            disabled={isEmailVerified}
                                            onChange={() => {
                                                setIsEmailVerified(false);
                                                setShowOtpInput(false);
                                            }}
                                            onBlur={async (e) => {
                                                const val = e.target.value?.trim();
                                                if (val && !isEmailVerified) {
                                                    try {
                                                        const check = await isProfileUpdated({ email: val });
                                                        if (check?.data?.data) {
                                                            setIsEmailVerified(true);
                                                        }
                                                    } catch (err) { }
                                                }
                                            }}
                                        />
                                    </Form.Item>
                                    {!isEmailVerified && (
                                        <button
                                            type="button"
                                            onClick={handleVerifyEmail}
                                            disabled={verifyingEmail}
                                            style={{
                                                width: '120px',
                                                backgroundColor: '#0A65CC',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '0 6px 6px 0',
                                                cursor: verifyingEmail ? 'not-allowed' : 'pointer'
                                            }}
                                        >
                                            {verifyingEmail ? "Sending..." : "Verify"}
                                        </button>
                                    )}
                                    {isEmailVerified && (
                                        <div style={{
                                            width: '120px',
                                            backgroundColor: '#10B981',
                                            color: '#fff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: '0 6px 6px 0',
                                            fontWeight: 600,
                                            fontSize: '14px',
                                            gap: '6px'
                                        }}>
                                            <CheckOutlined /> Verified
                                        </div>
                                    )}
                                </Space.Compact>
                                {isEmailVerified && (
                                    <div style={{ marginTop: '4px', textAlign: 'right' }}>
                                        <button
                                            type="button"
                                            onClick={() => setIsEmailVerified(false)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#0A65CC',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                padding: 0,
                                                textDecoration: 'underline'
                                            }}
                                        >
                                            Change email
                                        </button>
                                    </div>
                                )}
                            </Form.Item>

                            {showOtpInput && (
                                <Form.Item
                                    label={<span className="hr-form-label">Enter OTP</span>}
                                    validateStatus={otpError ? "error" : ""}
                                    help={otpError}
                                >
                                    <Space.Compact style={{ width: '100%' }}>
                                        <Input
                                            size="large"
                                            placeholder="Enter 6-digit OTP"
                                            value={otpValue}
                                            onChange={(e) => {
                                                setOtpValue(e.target.value);
                                                setOtpError("");
                                            }}
                                            style={{ width: 'calc(100% - 120px)' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleConfirmOtp}
                                            disabled={verifyingEmail}
                                            style={{
                                                width: '120px',
                                                backgroundColor: '#0A65CC',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '0 6px 6px 0',
                                                cursor: verifyingEmail ? 'not-allowed' : 'pointer'
                                            }}
                                        >
                                            {verifyingEmail ? "Verifying..." : "Confirm OTP"}
                                        </button>
                                    </Space.Compact>
                                </Form.Item>
                            )}
                        </motion.div>
                    )}

                    {currentStep === 4 && (
                        <motion.div key="step5" {...pageTransition} className="hr-success-container">
                            <div className="hr-success-icon-wrap">
                                <CheckOutlined className="hr-success-icon" />
                            </div>
                            <h1 className="hr-success-title">🎉 Congratulations, You profile is 100% complete!</h1>
                            <p className="hr-success-desc">
                                Donec hendrerit, ante mattis pellentesque eleifend, tortor urna malesuada ante, eget aliquam nulla augue hendrerit ligula. Nunc mauris arcu, mattis sed sem vitae.
                            </p>
                            <div className="hr-success-actions">
                                <button type="button" className="hr-btn-secondary" onClick={() => navigate('/profile')}>View Dashboard</button>
                                <button type="button" className="hr-btn-next" onClick={() => navigate('/post-job')}>
                                    Post Job <ArrowRightOutlined />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {currentStep < 4 && (
                    <div className="hr-actions">
                        {currentStep > 0 && (
                            <button type="button" className="hr-btn-prev" onClick={prevStep}>
                                Previous
                            </button>
                        )}
                        {currentStep < 3 ? (
                            <button type="button" className="hr-btn-next" onClick={nextStep}>
                                Save & Next <ArrowRightOutlined />
                            </button>
                        ) : (
                            <button type="button" className="hr-btn-next" onClick={() => submitProfile(false)} disabled={loading}>
                                {loading ? "Saving..." : "Finish Editing"} <ArrowRightOutlined />
                            </button>
                        )}
                    </div>
                )}
            </Form>
        </div>
    );
};

export default CreateHrProfile;
