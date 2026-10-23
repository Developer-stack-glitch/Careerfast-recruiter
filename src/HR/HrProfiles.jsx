'use client';
import React, { useEffect, useState } from 'react';
import { message, Modal, Form, Input, Select, Button, Dropdown } from 'antd';
import {
    CheckCircleFilled,
    MoreOutlined
} from '@ant-design/icons';
import {
    Target,
    Trophy,
    GitFork,
    Code2,
    Building2,
    Globe,
    Calendar,
    MapPin,
    Mail,
    Phone,
    Briefcase,
    FileText,
    Pencil,
    BadgeCheck,
    Check,
    ExternalLink
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getHrProfileData, insertHrProfileData } from '../ApiService/action';
import CommonLoader from '../Common/CommonLoader';
import '../css/HrProfiles.css';

const cleanHtml = (htmlString) => {
    if (!htmlString) return '';
    return htmlString
        .replace(/(word-break|overflow-wrap|word-wrap|white-space)\s*:[^;"]+;?/gi, '')
        .replace(/class="[^"]*break-all[^"]*"/gi, '')
        .replace(/class="[^"]*break-words[^"]*"/gi, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/\u00A0/g, ' ')
        .replace(/[\u00AD\u200B\u200C\u200D]/g, '');
};

const parseList = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) return parsed;
            } catch (e) { }
        }
        return trimmed.split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    }
    return [];
};

const HrProfiles = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [modalSection, setModalSection] = useState('all'); // all | company | hiring | experience | contact | about
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const stored = localStorage.getItem("loginDetails");
            if (stored) {
                const loginDetails = JSON.parse(stored);
                const res = await getHrProfileData(loginDetails.id);
                if (res?.data?.data) {
                    setProfile(res.data.data);
                } else {
                    setProfile(null);
                }
            } else {
                setLoading(false);
            }
        } catch (error) {
            console.error("Error fetching profile", error);
            if (error?.response?.status !== 404) {
                message.error("Failed to load HR profile.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleOpenEditModal = (section = 'all') => {
        setModalSection(section);
        setIsEditModalOpen(true);
    };

    const handleSaveProfile = async (values) => {
        setIsSaving(true);
        try {
            const stored = localStorage.getItem("loginDetails");
            if (!stored) {
                message.error("User not logged in");
                return;
            }
            const loginDetails = JSON.parse(stored);
            const payload = {
                user_id: loginDetails.id,
                profile_image: profile?.profile_image || '',
                banner_image: profile?.banner_image || '',
                company_name: values.company_name,
                about_us: values.about_us,
                organization_type: values.organization_type,
                industry_type: values.industry_type,
                team_size: values.team_size,
                year_established: values.year_established,
                website_url: values.website_url,
                vision: values.vision,
                map_location: values.map_location || [values.address1, values.city, values.state].filter(Boolean).join(', '),
                contact_phone: values.contact_phone,
                contact_email: values.contact_email,
                social_links: {
                    facebook: values.facebook,
                    twitter: values.twitter,
                    instagram: values.instagram,
                    youtube: values.youtube,
                }
            };

            await insertHrProfileData(payload);
            message.success("Profile updated successfully!");
            setIsEditModalOpen(false);
            fetchProfile();
        } catch (error) {
            console.error("Error saving profile", error);
            message.error(error?.response?.data?.message || "Failed to update profile.");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return <CommonLoader fullScreen={false} text="Loading Recruiter Profile..." />;
    }

    if (!profile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center animate-in fade-in zoom-in-95 duration-300">
                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 shadow-sm border border-blue-100">
                    <Building2 className="text-4xl text-[#0A66C2]" size={36} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">No profile found</h2>
                <p className="text-gray-500 max-w-md mb-8 text-[15px] leading-relaxed">
                    Your recruiter profile is empty. You can set it up now to showcase your company and hiring preferences.
                </p>
                <button
                    onClick={() => handleOpenEditModal('all')}
                    className="px-6 py-3 bg-[#0A66C2] text-white rounded-lg font-semibold hover:bg-blue-700 hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-sm flex items-center gap-2"
                >
                    <Pencil size={16} /> Set Up Profile Details
                </button>
            </div>
        );
    }

    // Parse dynamic registered recruiter data
    let extra = {};
    try {
        extra = typeof profile.additional_info === 'string'
            ? JSON.parse(profile.additional_info)
            : (profile.additional_info || {});
    } catch (e) {
        extra = {};
    }

    const {
        company_name, about_us, organization_type, industry_type, team_size, year_established,
        website_url, vision, map_location, contact_phone, contact_email, profile_image,
        first_name, last_name, headline, location, skills, total_years, preferred_roles, career_level,
        address1, address2, city, state, country, pincode, previous_companies
    } = profile;

    // Display Fields
    const companyDisplayName = company_name || extra.company_name || 'N/A';
    const recruiterFullName = [first_name, last_name].filter(Boolean).join(' ') || (extra.first_name ? [extra.first_name, extra.last_name].filter(Boolean).join(' ') : 'N/A');
    const headerTitle = companyDisplayName || recruiterFullName || 'N/A';
    const designationRole = headline || extra.designation || 'N/A';
    const activeWebsite = website_url || extra.website_url || '';
    const activeEstablished = year_established || extra.year_established || 'N/A';
    const activeLocation = (city && state) ? `${city}, ${state}` : (location || map_location || 'N/A');
    const activeIndustry = industry_type || organization_type || extra.industry_type || 'N/A';
    const hiringExpYears = total_years || extra.hiring_experience || 'N/A';
    const activeEmail = contact_email || extra.email || 'N/A';
    const activePhone = contact_phone || extra.phone || 'N/A';

    // Formatted Address Block
    const formattedAddressLines = [
        address1 || extra.address1 || '8H Venkateshwara Nagar',
        address2 || extra.address2 || 'Velachery, Chennai,',
        `${state || extra.state || 'Tamil Nadu'}, ${pincode || extra.pincode || '600042'}, ${country || extra.country || 'India'}`
    ].filter(Boolean);

    // Lists
    const parsedLevels = parseList(career_level).length ? parseList(career_level) : (parseList(extra.hiring_levels).length ? parseList(extra.hiring_levels) : ['Entry Level / Freshers (0-2 yrs)']);
    const parsedFunctions = parseList(preferred_roles).length ? parseList(preferred_roles) : (parseList(extra.functions).length ? parseList(extra.functions) : ['Front End Developer', 'Full Stack Developer']);
    const parsedSkills = parseList(skills).length ? parseList(skills) : (parseList(extra.skills).length ? parseList(extra.skills) : ['React.js', 'Node.js', 'Talent Acquisition']);

    const pastCompaniesList = (previous_companies && previous_companies.length > 0)
        ? previous_companies
        : (extra.previous_companies && extra.previous_companies.length > 0 ? extra.previous_companies : []);

    const defaultAbout = `N/A`;

    const moreMenuItems = [
        { key: '1', label: 'View Public Profile' },
        { key: '2', label: 'Copy Profile Link', onClick: () => { navigator.clipboard?.writeText(window.location.href); message.success('Profile link copied!'); } },
        { key: '3', label: 'Account Settings', onClick: () => router.push('/settings') },
    ];

    return (
        <div className="recruiter-profile-page">

            {/* Top Primary Profile Card */}
            <div className="recruiter-main-header-card">
                <div className="recruiter-header-top-row">

                    {/* Left: Logo/Avatar Container */}
                    <div className="recruiter-avatar-box">
                        {profile_image ? (
                            <img src={profile_image} alt={headerTitle} />
                        ) : (
                            <div className="recruiter-logo-placeholder">
                                <span className="logo-text-bold">{headerTitle.slice(0, 5)}</span>
                                <span className="logo-text-sub">{headerTitle.slice(5, 9) || 'Nutp'}</span>
                            </div>
                        )}
                    </div>

                    {/* Middle: Details */}
                    <div className="recruiter-header-info-col">
                        <div className="recruiter-title-badge-row">
                            <h1 className="recruiter-profile-name">{headerTitle}</h1>
                            {(profile?.is_email_verified === 1 || profile?.is_email_verified == true) && (
                                <CheckCircleFilled className="recruiter-verified-tick" title="Verified Work Email & Recruiter" />
                            )}
                            <span className="recruiter-active-status-badge">
                                <Check size={12} strokeWidth={3} /> Active
                            </span>
                        </div>

                        <p className="recruiter-designation-sub">
                            {designationRole} at {companyDisplayName}
                        </p>

                        <div className="recruiter-meta-items-row">
                            <div className="recruiter-meta-item">
                                <MapPin size={15} className="meta-icon" />
                                <span>{activeLocation}</span>
                            </div>
                            <div className="recruiter-meta-item">
                                <Building2 size={15} className="meta-icon" />
                                <span>{activeIndustry}</span>
                            </div>
                            <div className="recruiter-meta-item">
                                <Calendar size={15} className="meta-icon" />
                                <span>{hiringExpYears.includes('Exp') ? hiringExpYears : `${hiringExpYears} Experience`}</span>
                            </div>
                            <div className="recruiter-meta-item">
                                <Mail size={15} className="meta-icon" />
                                <a href={`mailto:${activeEmail}`}>{activeEmail}</a>
                            </div>
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="recruiter-header-actions-col">
                        <button
                            className="recruiter-primary-edit-btn"
                            onClick={() => handleOpenEditModal('all')}
                        >
                            <Pencil size={15} /> Edit Profile
                        </button>
                        <Dropdown menu={{ items: moreMenuItems }} trigger={['click']}>
                            <button className="recruiter-more-btn">
                                <MoreOutlined />
                            </button>
                        </Dropdown>
                    </div>
                </div>
            </div>

            {/* Main Content 2-Column Grid */}
            <div className="recruiter-profile-grid">

                {/* Row 1 Left: Hiring Specialization & Candidate Preferences */}
                <div className="recruiter-content-card">
                    <div className="recruiter-card-header">
                        <div className="card-header-title">
                            <Target size={20} className="header-icon-blue" />
                            <h3>Hiring Specialization & Candidate Preferences</h3>
                        </div>
                        <button
                            className="card-mini-edit-btn"
                            onClick={() => handleOpenEditModal('hiring')}
                        >
                            <Pencil size={12} /> Edit
                        </button>
                    </div>

                    {/* Target Seniority / Levels */}
                    <div className="recruiter-spec-section">
                        <div className="recruiter-spec-label">
                            <Trophy size={16} className="spec-label-icon" />
                            <span>Target Candidate Seniority / Levels</span>
                        </div>
                        <div className="recruiter-pill-container">
                            {parsedLevels.map((lvl, i) => (
                                <span key={i} className="recruiter-pill-green">
                                    {lvl}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Functional Domains & Roles */}
                    <div className="recruiter-spec-section">
                        <div className="recruiter-spec-label">
                            <GitFork size={16} className="spec-label-icon" />
                            <span>Functional Domains & Roles Hired For</span>
                        </div>
                        <div className="recruiter-pill-container">
                            {parsedFunctions.map((fn, i) => (
                                <span key={i} className="recruiter-pill-grey">
                                    {fn}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Key Skills & Tech Stack Evaluated */}
                    <div className="recruiter-spec-section" style={{ marginBottom: 0 }}>
                        <div className="recruiter-spec-label">
                            <Code2 size={16} className="spec-label-icon" />
                            <span>Key Skills & Tech Stack Evaluated</span>
                        </div>
                        <div className="recruiter-pill-container">
                            {parsedSkills.map((sk, i) => (
                                <span key={i} className="recruiter-pill-blue">
                                    {sk}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Row 1 Right: Company Details */}
                <div className="recruiter-content-card">
                    <div className="recruiter-card-header">
                        <div className="card-header-title">
                            <Building2 size={20} className="header-icon-blue" />
                            <h3>Company Details</h3>
                        </div>
                        <button
                            className="card-mini-edit-btn"
                            onClick={() => handleOpenEditModal('company')}
                        >
                            <Pencil size={12} /> Edit
                        </button>
                    </div>

                    <div className="recruiter-key-value-list">
                        <div className="recruiter-kv-row">
                            <div className="recruiter-kv-label">
                                <Building2 size={16} className="kv-icon" />
                                <span>Employer / Company</span>
                            </div>
                            <div className="recruiter-kv-value bold">
                                {companyDisplayName}
                            </div>
                        </div>

                        <div className="recruiter-kv-row">
                            <div className="recruiter-kv-label">
                                <Globe size={16} className="kv-icon" />
                                <span>Company Website</span>
                            </div>
                            <div className="recruiter-kv-value">
                                {activeWebsite ? (
                                    <a
                                        href={activeWebsite.startsWith('http') ? activeWebsite : `https://${activeWebsite}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="recruiter-link-blue"
                                    >
                                        {activeWebsite} <ExternalLink size={12} style={{ display: 'inline', marginLeft: '3px' }} />
                                    </a>
                                ) : (
                                    <span className="text-muted">Not provided</span>
                                )}
                            </div>
                        </div>

                        <div className="recruiter-kv-row">
                            <div className="recruiter-kv-label">
                                <Calendar size={16} className="kv-icon" />
                                <span>Established Date / Year</span>
                            </div>
                            <div className="recruiter-kv-value">
                                {activeEstablished || <span className="text-muted">Not specified</span>}
                            </div>
                        </div>

                        <div className="recruiter-kv-row">
                            <div className="recruiter-kv-label">
                                <BadgeCheck size={16} className="kv-icon" />
                                <span>Organization Type</span>
                            </div>
                            <div className="recruiter-kv-value bold">
                                {organization_type || activeIndustry}
                            </div>
                        </div>

                        <div className="recruiter-kv-row" style={{ alignItems: 'flex-start' }}>
                            <div className="recruiter-kv-label" style={{ paddingTop: '2px' }}>
                                <MapPin size={16} className="kv-icon" />
                                <span>Office Address</span>
                            </div>
                            <div className="recruiter-kv-value address-block bold">
                                {formattedAddressLines.map((line, idx) => (
                                    <div key={idx}>{line}</div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Row 2 Left: Professional Career Experience */}
                <div className="recruiter-content-card">
                    <div className="recruiter-card-header">
                        <div className="card-header-title">
                            <Briefcase size={20} className="header-icon-blue" />
                            <h3>Professional Career Experience</h3>
                        </div>
                        <button
                            className="card-mini-edit-btn"
                            onClick={() => handleOpenEditModal('experience')}
                        >
                            <Pencil size={12} /> Edit
                        </button>
                    </div>

                    <div className="recruiter-experience-box">
                        <div className="exp-radio-indicator">
                            <div className="exp-radio-inner" />
                        </div>
                        <div className="exp-main-body">
                            <div className="exp-top-heading-row">
                                <h4 className="exp-role-title">{designationRole}</h4>
                                <span className="exp-current-pill">Current Role</span>
                            </div>
                            <div className="exp-company-row">
                                <Building2 size={15} className="exp-icon" />
                                <span>{companyDisplayName}</span>
                            </div>
                            <div className="exp-dates-loc-row">
                                <div className="exp-meta-sub">
                                    <Calendar size={14} className="exp-icon-sub" />
                                    <span>Present</span>
                                </div>
                                <div className="exp-meta-sub">
                                    <MapPin size={14} className="exp-icon-sub" />
                                    <span>{city || (location ? location.split(',')[0] : 'Chennai')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Past Companies if any */}
                    {pastCompaniesList.map((comp, idx) => (
                        <div key={idx} className="recruiter-experience-box past" style={{ marginTop: '12px' }}>
                            <div className="exp-radio-indicator past">
                                <div className="exp-radio-inner past" />
                            </div>
                            <div className="exp-main-body">
                                <div className="exp-top-heading-row">
                                    <h4 className="exp-role-title">{comp.designation || 'Technical Recruiter'}</h4>
                                </div>
                                <div className="exp-company-row">
                                    <Building2 size={15} className="exp-icon" />
                                    <span>{comp.company_name}</span>
                                </div>
                                <div className="exp-dates-loc-row">
                                    <div className="exp-meta-sub">
                                        <Calendar size={14} className="exp-icon-sub" />
                                        <span>{comp.from_year || comp.start_date || 'Past'} - {comp.to_year || comp.end_date || 'Past'}</span>
                                    </div>
                                    {comp.location && (
                                        <div className="exp-meta-sub">
                                            <MapPin size={14} className="exp-icon-sub" />
                                            <span>{comp.location}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Row 2 Right: Contact Information */}
                <div className="recruiter-content-card">
                    <div className="recruiter-card-header">
                        <div className="card-header-title">
                            <Mail size={20} className="header-icon-blue" />
                            <h3>Contact Information</h3>
                        </div>
                        <button
                            className="card-mini-edit-btn"
                            onClick={() => handleOpenEditModal('contact')}
                        >
                            <Pencil size={12} /> Edit
                        </button>
                    </div>

                    <div className="recruiter-key-value-list">
                        <div className="recruiter-kv-row">
                            <div className="recruiter-kv-label">
                                <Mail size={16} className="kv-icon" />
                                <span>Email Address</span>
                            </div>
                            <div className="recruiter-kv-value">
                                <a href={`mailto:${activeEmail}`} className="recruiter-link-blue bold">
                                    {activeEmail}
                                </a>
                            </div>
                        </div>

                        <div className="recruiter-kv-row" style={{ marginBottom: 0 }}>
                            <div className="recruiter-kv-label">
                                <Phone size={16} className="kv-icon" />
                                <span>Mobile Number</span>
                            </div>
                            <div className="recruiter-kv-value">
                                <a href={`tel:${activePhone}`} className="recruiter-link-blue bold">
                                    {activePhone}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Row 3 (Full Width Card): About Company */}
            <div className="recruiter-full-card">
                <div className="recruiter-card-header">
                    <div className="card-header-title">
                        <FileText size={20} className="header-icon-blue" />
                        <h3>About {companyDisplayName}</h3>
                    </div>
                    <button
                        className="card-mini-edit-btn"
                        onClick={() => handleOpenEditModal('about')}
                    >
                        <Pencil size={12} /> Edit
                    </button>
                </div>

                <div className="recruiter-about-content">
                    {about_us ? (
                        <div
                            dangerouslySetInnerHTML={{ __html: cleanHtml(about_us) }}
                            className="recruiter-about-text"
                        />
                    ) : (
                        <p className="recruiter-about-text">
                            {defaultAbout}
                        </p>
                    )}
                </div>
            </div>

            {/* In-Page Edit Profile Modal */}
            {isEditModalOpen && (
                <EditProfileModal
                    open={isEditModalOpen}
                    onCancel={() => setIsEditModalOpen(false)}
                    profile={profile}
                    onSave={handleSaveProfile}
                    isSaving={isSaving}
                />
            )}
        </div>
    );
};

const EditProfileModal = ({ open, onCancel, profile, onSave, isSaving }) => {
    const [form] = Form.useForm();

    const getInitialValues = () => {
        let extra = {};
        try {
            extra = typeof profile?.additional_info === 'string'
                ? JSON.parse(profile.additional_info)
                : (profile?.additional_info || {});
        } catch (e) {
            extra = {};
        }

        return {
            first_name: profile?.first_name || extra.first_name || '',
            last_name: profile?.last_name || extra.last_name || '',
            headline: profile?.headline || extra.designation || '',
            company_name: profile?.company_name || extra.company_name || '',
            about_us: profile?.about_us || extra.about_us || '',
            organization_type: profile?.organization_type || extra.organization_type || '',
            industry_type: profile?.industry_type || extra.industry_type || '',
            team_size: profile?.team_size || extra.team_size || '',
            year_established: profile?.year_established || extra.year_established || '',
            website_url: profile?.website_url || extra.website_url || '',
            vision: profile?.vision || extra.vision || '',
            map_location: profile?.map_location || profile?.location || '',
            address1: profile?.address1 || extra.address1 || '',
            address2: profile?.address2 || extra.address2 || '',
            city: profile?.city || extra.city || '',
            state: profile?.state || extra.state || '',
            country: profile?.country || extra.country || 'India',
            pincode: profile?.pincode || extra.pincode || '',
            contact_phone: profile?.contact_phone || extra.phone || '',
            contact_email: profile?.contact_email || extra.email || '',
        };
    };

    return (
        <Modal
            title={<span style={{ fontSize: '18px', fontWeight: 700 }}>Edit Recruiter Profile Details</span>}
            open={open}
            onCancel={onCancel}
            footer={null}
            width={720}
            destroyOnHidden
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={getInitialValues()}
                onFinish={onSave}
                style={{ marginTop: '16px' }}
            >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <Form.Item name="first_name" label="First Name">
                        <Input placeholder="First Name" />
                    </Form.Item>
                    <Form.Item name="last_name" label="Last Name">
                        <Input placeholder="Last Name" />
                    </Form.Item>
                </div>

                <Form.Item name="headline" label="Current Designation / Headline">
                    <Input placeholder="e.g. HR Manager" />
                </Form.Item>

                <Form.Item
                    name="company_name"
                    label="Employer / Company Name"
                    rules={[{ required: true, message: 'Please enter company name' }]}
                >
                    <Input placeholder="e.g. ACTE Technologies" />
                </Form.Item>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <Form.Item name="website_url" label="Company Website Link">
                        <Input placeholder="https://example.com" />
                    </Form.Item>
                    <Form.Item name="year_established" label="Established Date / Year">
                        <Input placeholder="e.g. 2018 or 15-08-2015" />
                    </Form.Item>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <Form.Item name="organization_type" label="Organization Type">
                        <Input placeholder="e.g. Software Development" />
                    </Form.Item>
                    <Form.Item name="industry_type" label="Industry Type">
                        <Input placeholder="e.g. IT & Software Services" />
                    </Form.Item>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <Form.Item name="address1" label="Office Address Line 1">
                        <Input placeholder="e.g. 8H Venkateshwara Nagar" />
                    </Form.Item>
                    <Form.Item name="address2" label="Address Line 2">
                        <Input placeholder="e.g. Velachery, Chennai" />
                    </Form.Item>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                    <Form.Item name="city" label="City">
                        <Input placeholder="Chennai" />
                    </Form.Item>
                    <Form.Item name="state" label="State">
                        <Input placeholder="Tamil Nadu" />
                    </Form.Item>
                    <Form.Item name="pincode" label="Pin Code">
                        <Input placeholder="600042" />
                    </Form.Item>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <Form.Item name="contact_email" label="Contact Email">
                        <Input placeholder="karthikeyan.m@actetechnologies.com" />
                    </Form.Item>
                    <Form.Item name="contact_phone" label="Contact Phone">
                        <Input placeholder="6328963872" />
                    </Form.Item>
                </div>

                <Form.Item name="about_us" label="About Company">
                    <Input.TextArea rows={4} placeholder="Describe your company, hiring mission, and culture..." />
                </Form.Item>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                    <Button onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button type="primary" htmlType="submit" loading={isSaving} style={{ backgroundColor: '#2563eb' }}>
                        Save Profile Changes
                    </Button>
                </div>
            </Form>
        </Modal>
    );
};

export default HrProfiles;
