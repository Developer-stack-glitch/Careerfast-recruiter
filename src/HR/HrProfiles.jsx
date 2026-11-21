'use client';
import React, { useEffect, useState, useRef } from 'react';
import { message, Modal, Form, Input, Select, Button, Dropdown, Tabs, Spin, Tooltip } from 'antd';
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
    ExternalLink,
    Camera,
    Trash2,
    User,
    Share2,
    Sparkles
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getHrProfileData, insertHrProfileData, updateProfileImage } from '../ApiService/action';
import { compressImage } from '../utils/imageCompressor';
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

const cleanEstablishedYear = (val) => {
    if (!val) return '';
    if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed.includes('T')) {
            const dt = new Date(trimmed);
            if (!isNaN(dt.getTime())) {
                return String(dt.getFullYear());
            }
        }
        if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
            return trimmed.slice(0, 4);
        }
        return trimmed;
    }
    if (typeof val === 'number') return String(val);
    return '';
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
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const directAvatarInputRef = useRef(null);

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

    const handleDirectAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            message.error('Please upload an image file (PNG, JPG, or WEBP)');
            return;
        }

        setIsUploadingAvatar(true);
        try {
            const base64 = await compressImage(file, 200);
            const stored = localStorage.getItem("loginDetails");
            const loginDetails = stored ? JSON.parse(stored) : null;
            if (!loginDetails?.id) {
                message.error("User not logged in");
                return;
            }

            await updateProfileImage({
                user_id: loginDetails.id,
                profile_image: base64
            });

            setProfile(prev => ({ ...prev, profile_image: base64 }));

            // Update loginDetails in localStorage so header shows it
            loginDetails.profile_image = base64;
            localStorage.setItem("loginDetails", JSON.stringify(loginDetails));
            window.dispatchEvent(new Event("storage"));

            message.success("Profile photo updated successfully!");
        } catch (err) {
            console.error("Failed to upload avatar", err);
            message.error("Failed to update profile photo");
        } finally {
            setIsUploadingAvatar(false);
            if (e.target) e.target.value = '';
        }
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
                profile_image: values.profile_image !== undefined ? values.profile_image : (profile?.profile_image || ''),
                banner_image: profile?.banner_image || '',
                company_name: values.company_name,
                about_us: values.about_us,
                organization_type: values.organization_type,
                industry_type: values.industry_type,
                team_size: values.team_size,
                year_established: cleanEstablishedYear(values.year_established),
                website_url: values.website_url,
                vision: values.vision,
                map_location: [values.address1, values.city, values.state].filter(Boolean).join(', ') || values.map_location,
                contact_phone: values.contact_phone,
                contact_email: values.contact_email,
                first_name: values.first_name,
                last_name: values.last_name,
                headline: values.headline,
                address1: values.address1,
                address2: values.address2,
                city: values.city,
                state: values.state,
                country: values.country || 'India',
                pincode: values.pincode,
                career_level: values.career_level,
                preferred_roles: values.preferred_roles,
                skills: values.skills,
                total_years: values.total_years,
                social_links: {
                    facebook: values.facebook,
                    twitter: values.twitter,
                    instagram: values.instagram,
                    youtube: values.youtube || values.linkedin,
                }
            };

            await insertHrProfileData(payload);

            // Update loginDetails in localStorage
            try {
                const parsed = JSON.parse(stored);
                if (payload.first_name) parsed.first_name = payload.first_name;
                if (payload.last_name) parsed.last_name = payload.last_name;
                if (payload.company_name) parsed.organization = payload.company_name;
                if (payload.profile_image) parsed.profile_image = payload.profile_image;
                localStorage.setItem("loginDetails", JSON.stringify(parsed));
                window.dispatchEvent(new Event("storage"));
            } catch (e) { }

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
    const recruiterFullName = [first_name, last_name].filter(Boolean).join(' ') || (extra.first_name ? [extra.first_name, extra.last_name].filter(Boolean).join(' ') : '');
    const headerTitle = companyDisplayName !== 'N/A' ? companyDisplayName : (recruiterFullName || 'Recruiter Profile');
    const designationRole = headline || extra.designation || 'Technical Recruiter';
    const activeWebsite = website_url || extra.website_url || '';
    const activeEstablished = cleanEstablishedYear(year_established || extra.year_established);
    const activeLocation = (city && state) ? `${city}, ${state}` : (location || map_location || 'N/A');
    const activeIndustry = industry_type || organization_type || extra.industry_type || 'N/A';
    const hiringExpYears = total_years || extra.hiring_experience || '';
    const activeEmail = contact_email || extra.email || '';
    const activePhone = contact_phone || extra.phone || '';

    // Formatted Address Block
    const formattedAddressLines = [
        address1 || extra.address1,
        address2 || extra.address2,
        [city || extra.city, state || extra.state].filter(Boolean).join(', '),
        [pincode || extra.pincode, country || extra.country || 'India'].filter(Boolean).join(', ')
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

                    {/* Left: Logo/Avatar Container with Camera Upload Button */}
                    <div className="recruiter-avatar-wrapper">
                        <div className="recruiter-avatar-box">
                            {profile_image ? (
                                <img src={profile_image} alt={headerTitle} />
                            ) : (
                                <div className="recruiter-logo-placeholder">
                                    <span className="logo-text-bold">{headerTitle.slice(0, 5)}</span>
                                    <span className="logo-text-sub">{headerTitle.slice(5, 9) || 'Nutp'}</span>
                                </div>
                            )}
                            {isUploadingAvatar && (
                                <div className="avatar-uploading-spinner">
                                    <Spin size="small" />
                                </div>
                            )}
                        </div>
                        <Tooltip title="Upload / Change Profile Photo">
                            <button
                                type="button"
                                className="recruiter-avatar-edit-badge"
                                onClick={() => directAvatarInputRef.current?.click()}
                                disabled={isUploadingAvatar}
                            >
                                <Camera size={14} />
                            </button>
                        </Tooltip>
                        <input
                            ref={directAvatarInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleDirectAvatarUpload}
                        />
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
                            {recruiterFullName && recruiterFullName !== companyDisplayName ? ` • ${recruiterFullName}` : ''}
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
                            {hiringExpYears && (
                                <div className="recruiter-meta-item">
                                    <Calendar size={15} className="meta-icon" />
                                    <span>{hiringExpYears.toLowerCase().includes('exp') || hiringExpYears.toLowerCase().includes('year') ? hiringExpYears : `${hiringExpYears} Experience`}</span>
                                </div>
                            )}
                            {activeEmail && (
                                <div className="recruiter-meta-item">
                                    <Mail size={15} className="meta-icon" />
                                    <a href={`mailto:${activeEmail}`}>{activeEmail}</a>
                                </div>
                            )}
                            {activePhone && (
                                <div className="recruiter-meta-item">
                                    <Phone size={15} className="meta-icon" />
                                    <a href={`tel:${activePhone}`}>{activePhone}</a>
                                </div>
                            )}
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
                                {formattedAddressLines.length > 0 ? (
                                    formattedAddressLines.map((line, idx) => (
                                        <div key={idx}>{line}</div>
                                    ))
                                ) : (
                                    <span className="text-muted font-normal">Not specified</span>
                                )}
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
                                {activeEmail ? (
                                    <a href={`mailto:${activeEmail}`} className="recruiter-link-blue bold">
                                        {activeEmail}
                                    </a>
                                ) : (
                                    <span className="text-muted font-normal">Not provided</span>
                                )}
                            </div>
                        </div>

                        <div className="recruiter-kv-row" style={{ marginBottom: 0 }}>
                            <div className="recruiter-kv-label">
                                <Phone size={16} className="kv-icon" />
                                <span>Mobile Number</span>
                            </div>
                            <div className="recruiter-kv-value">
                                {activePhone ? (
                                    <a href={`tel:${activePhone}`} className="recruiter-link-blue bold">
                                        {activePhone}
                                    </a>
                                ) : (
                                    <span className="text-muted font-normal">Not provided</span>
                                )}
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
                    section={modalSection}
                    onSave={handleSaveProfile}
                    isSaving={isSaving}
                />
            )}
        </div>
    );
};

const EditProfileModal = ({ open, onCancel, profile, section = 'all', onSave, isSaving }) => {
    const [form] = Form.useForm();
    const [activeTab, setActiveTab] = useState('company');
    const [modalImage, setModalImage] = useState(profile?.profile_image || '');
    const [isProcessingImage, setIsProcessingImage] = useState(false);

    useEffect(() => {
        if (section === 'hiring') setActiveTab('hiring');
        else if (section === 'experience') setActiveTab('recruiter');
        else if (section === 'contact') setActiveTab('contact');
        else if (section === 'about') setActiveTab('about');
        else if (section === 'address') setActiveTab('address');
        else setActiveTab('company');
    }, [section, open]);

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
            profile_image: profile?.profile_image || '',
            first_name: profile?.first_name || extra.first_name || '',
            last_name: profile?.last_name || extra.last_name || '',
            headline: profile?.headline || extra.designation || '',
            company_name: profile?.company_name || extra.company_name || '',
            about_us: profile?.about_us || extra.about_us || '',
            organization_type: profile?.organization_type || extra.organization_type || 'Public',
            industry_type: profile?.industry_type || extra.industry_type || 'IT & Software',
            team_size: profile?.team_size || extra.team_size || '',
            year_established: cleanEstablishedYear(profile?.year_established || extra.year_established || ''),
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
            career_level: parseList(profile?.career_level).length ? parseList(profile.career_level) : (parseList(extra.hiring_levels).length ? parseList(extra.hiring_levels) : ['Entry Level / Freshers (0-2 yrs)']),
            preferred_roles: parseList(profile?.preferred_roles).length ? parseList(profile.preferred_roles) : (parseList(extra.functions).length ? parseList(extra.functions) : ['Front End Developer', 'Full Stack Developer']),
            skills: parseList(profile?.skills).length ? parseList(profile.skills) : (parseList(extra.skills).length ? parseList(extra.skills) : ['React.js', 'Node.js', 'Talent Acquisition']),
            total_years: profile?.total_years || extra.hiring_experience || '',
            facebook: profile?.facebook || '',
            twitter: profile?.twitter || '',
            instagram: profile?.instagram || '',
            youtube: profile?.youtube || profile?.linkedin || '',
        };
    };

    const handleImageChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            message.error('Please select an image file (PNG, JPG, or WEBP)');
            return;
        }

        setIsProcessingImage(true);
        try {
            const base64 = await compressImage(file, 200);
            setModalImage(base64);
            form.setFieldsValue({ profile_image: base64 });
        } catch (err) {
            console.error('Image compression failed', err);
            message.error('Could not process image');
        } finally {
            setIsProcessingImage(false);
            if (e.target) e.target.value = '';
        }
    };

    const tabItems = [
        {
            key: 'company',
            label: (
                <span className="flex items-center gap-1.5">
                    <Building2 size={15} /> Company Details
                </span>
            ),
            forceRender: true,
            children: (
                <div className="modal-tab-pane-content">
                    {/* Logo / Avatar Section */}
                    <div className="modal-logo-uploader-card">
                        <div className="modal-logo-preview">
                            {isProcessingImage ? (
                                <Spin size="small" />
                            ) : modalImage ? (
                                <img src={modalImage} alt="Company Logo" />
                            ) : (
                                <Building2 size={32} className="text-gray-400" />
                            )}
                        </div>
                        <div className="modal-logo-actions">
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <label className="modal-upload-btn-label">
                                    <Camera size={14} /> Upload Company Logo / Photo
                                    <input
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={handleImageChange}
                                        disabled={isProcessingImage}
                                    />
                                </label>
                                {modalImage && (
                                    <Button
                                        size="small"
                                        danger
                                        icon={<Trash2 size={13} />}
                                        onClick={() => {
                                            setModalImage('');
                                            form.setFieldsValue({ profile_image: '' });
                                        }}
                                    >
                                        Remove Photo
                                    </Button>
                                )}
                            </div>
                            <span className="modal-upload-hint">Recommended: PNG, JPG, or WEBP under 5MB (auto-compressed).</span>
                        </div>
                    </div>

                    <Form.Item
                        name="company_name"
                        label="Employer / Company Name"
                        rules={[{ required: true, message: 'Please enter company name' }]}
                    >
                        <Input placeholder="e.g. Markerz Global" />
                    </Form.Item>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <Form.Item name="website_url" label="Company Website Link">
                            <Input placeholder="https://example.com" />
                        </Form.Item>
                        <Form.Item
                            name="year_established"
                            label="Established Date / Year"
                            tooltip="Enter established year (e.g. 2016)"
                        >
                            <Input placeholder="e.g. 2016" />
                        </Form.Item>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <Form.Item name="organization_type" label="Organization Type">
                            <Select
                                placeholder="Select organization type"
                                options={[
                                    { value: 'Public', label: 'Public' },
                                    { value: 'Private', label: 'Private Limited' },
                                    { value: 'Startup', label: 'Startup' },
                                    { value: 'Sole Proprietorship', label: 'Sole Proprietorship' },
                                    { value: 'Partnership', label: 'Partnership' },
                                    { value: 'NGO / Non-Profit', label: 'NGO / Non-Profit' },
                                    { value: 'Government / PSU', label: 'Government / PSU' },
                                ]}
                            />
                        </Form.Item>
                        <Form.Item name="industry_type" label="Industry Type">
                            <Select
                                placeholder="Select industry type"
                                options={[
                                    { value: 'IT & Software', label: 'IT & Software' },
                                    { value: 'Financial Services & Banking', label: 'Financial Services & Banking' },
                                    { value: 'Healthcare & Lifesciences', label: 'Healthcare & Lifesciences' },
                                    { value: 'E-Commerce & Retail', label: 'E-Commerce & Retail' },
                                    { value: 'Education & EdTech', label: 'Education & EdTech' },
                                    { value: 'Manufacturing & Industrial', label: 'Manufacturing & Industrial' },
                                    { value: 'Telecommunications', label: 'Telecommunications' },
                                    { value: 'Staffing & Recruiting', label: 'Staffing & Recruiting' },
                                    { value: 'Media & Entertainment', label: 'Media & Entertainment' },
                                ]}
                            />
                        </Form.Item>
                    </div>

                    <Form.Item name="team_size" label="Company Team Size">
                        <Select
                            placeholder="Select team size"
                            options={[
                                { value: '1-10 Employees', label: '1-10 Employees' },
                                { value: '11-50 Employees', label: '11-50 Employees' },
                                { value: '51-200 Employees', label: '51-200 Employees' },
                                { value: '201-500 Employees', label: '201-500 Employees' },
                                { value: '501-1000 Employees', label: '501-1000 Employees' },
                                { value: '1000+ Employees', label: '1000+ Employees' },
                            ]}
                        />
                    </Form.Item>
                </div>
            )
        },
        {
            key: 'recruiter',
            label: (
                <span className="flex items-center gap-1.5">
                    <User size={15} /> Recruiter Details
                </span>
            ),
            forceRender: true,
            children: (
                <div className="modal-tab-pane-content">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <Form.Item name="first_name" label="First Name" rules={[{ required: true, message: 'Please enter first name' }]}>
                            <Input placeholder="First Name" />
                        </Form.Item>
                        <Form.Item name="last_name" label="Last Name">
                            <Input placeholder="Last Name" />
                        </Form.Item>
                    </div>

                    <Form.Item name="headline" label="Current Designation / Headline">
                        <Input placeholder="e.g. Senior Technical Recruiter / HR Manager" />
                    </Form.Item>

                    <Form.Item name="total_years" label="Total Recruiting Experience">
                        <Input placeholder="e.g. 5 Years or 3-5 Years" />
                    </Form.Item>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <Form.Item name="contact_email" label="Contact Email">
                            <Input placeholder="recruiter@company.com" />
                        </Form.Item>
                        <Form.Item name="contact_phone" label="Contact Phone">
                            <Input placeholder="+91 9876543210" />
                        </Form.Item>
                    </div>
                </div>
            )
        },
        {
            key: 'hiring',
            label: (
                <span className="flex items-center gap-1.5">
                    <Target size={15} /> Hiring Specialization
                </span>
            ),
            forceRender: true,
            children: (
                <div className="modal-tab-pane-content">
                    <Form.Item
                        name="career_level"
                        label="Target Candidate Seniority / Levels"
                        tooltip="Select preset levels or type custom ones and press Enter"
                    >
                        <Select
                            mode="tags"
                            placeholder="Select or enter seniority levels"
                            options={[
                                { value: 'Entry Level / Freshers (0-2 yrs)', label: 'Entry Level / Freshers (0-2 yrs)' },
                                { value: 'Mid Level (2-5 yrs)', label: 'Mid Level (2-5 yrs)' },
                                { value: 'Senior Level (5-8 yrs)', label: 'Senior Level (5-8 yrs)' },
                                { value: 'Lead / Staff (8-12 yrs)', label: 'Lead / Staff (8-12 yrs)' },
                                { value: 'Manager / Director (12+ yrs)', label: 'Manager / Director (12+ yrs)' },
                                { value: 'Executive / Leadership', label: 'Executive / Leadership' },
                            ]}
                        />
                    </Form.Item>

                    <Form.Item
                        name="preferred_roles"
                        label="Functional Domains & Roles Hired For"
                        tooltip="Roles and positions your team frequently evaluates and hires"
                    >
                        <Select
                            mode="tags"
                            placeholder="Select or type functional roles"
                            options={[
                                { value: 'Front End Developer', label: 'Front End Developer' },
                                { value: 'Full Stack Developer', label: 'Full Stack Developer' },
                                { value: 'Backend Developer', label: 'Backend Developer' },
                                { value: 'Mobile App Developer', label: 'Mobile App Developer' },
                                { value: 'DevOps / Cloud Engineer', label: 'DevOps / Cloud Engineer' },
                                { value: 'UI/UX Designer', label: 'UI/UX Designer' },
                                { value: 'Product Manager', label: 'Product Manager' },
                                { value: 'QA / Automation Engineer', label: 'QA / Automation Engineer' },
                                { value: 'Data Scientist / ML Engineer', label: 'Data Scientist / ML Engineer' },
                                { value: 'Technical Recruiter', label: 'Technical Recruiter' },
                            ]}
                        />
                    </Form.Item>

                    <Form.Item
                        name="skills"
                        label="Key Skills & Tech Stack Evaluated"
                        tooltip="Primary tech stack and core competencies evaluated"
                    >
                        <Select
                            mode="tags"
                            placeholder="Select or enter technical skills"
                            options={[
                                { value: 'React.js', label: 'React.js' },
                                { value: 'Node.js', label: 'Node.js' },
                                { value: 'JavaScript', label: 'JavaScript' },
                                { value: 'TypeScript', label: 'TypeScript' },
                                { value: 'Python', label: 'Python' },
                                { value: 'Java', label: 'Java' },
                                { value: 'AWS', label: 'AWS' },
                                { value: 'Docker', label: 'Docker' },
                                { value: 'SQL', label: 'SQL' },
                                { value: 'MongoDB', label: 'MongoDB' },
                                { value: 'Talent Acquisition', label: 'Talent Acquisition' },
                                { value: 'Technical Recruiting', label: 'Technical Recruiting' },
                            ]}
                        />
                    </Form.Item>
                </div>
            )
        },
        {
            key: 'address',
            label: (
                <span className="flex items-center gap-1.5">
                    <MapPin size={15} /> Office Address
                </span>
            ),
            forceRender: true,
            children: (
                <div className="modal-tab-pane-content">
                    <Form.Item name="address1" label="Office Address Line 1">
                        <Input placeholder="e.g. 8H Venkateshwara Nagar" />
                    </Form.Item>

                    <Form.Item name="address2" label="Address Line 2">
                        <Input placeholder="e.g. Velachery, Chennai" />
                    </Form.Item>

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

                    <Form.Item name="country" label="Country">
                        <Input placeholder="India" />
                    </Form.Item>
                </div>
            )
        },
        {
            key: 'about',
            label: (
                <span className="flex items-center gap-1.5">
                    <FileText size={15} /> About & Vision
                </span>
            ),
            forceRender: true,
            children: (
                <div className="modal-tab-pane-content">
                    <Form.Item name="about_us" label="About Company">
                        <Input.TextArea rows={5} placeholder="Describe your company, hiring mission, and culture..." />
                    </Form.Item>

                    <Form.Item name="vision" label="Company Vision & Mission">
                        <Input.TextArea rows={3} placeholder="Describe company vision, core principles, and goals..." />
                    </Form.Item>
                </div>
            )
        },
        {
            key: 'contact',
            label: (
                <span className="flex items-center gap-1.5">
                    <Share2 size={15} /> Social Links
                </span>
            ),
            forceRender: true,
            children: (
                <div className="modal-tab-pane-content">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <Form.Item name="youtube" label="LinkedIn Company Page / Profile">
                            <Input placeholder="https://linkedin.com/company/example" />
                        </Form.Item>
                        <Form.Item name="twitter" label="Twitter / X URL">
                            <Input placeholder="https://twitter.com/example" />
                        </Form.Item>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <Form.Item name="facebook" label="Facebook URL">
                            <Input placeholder="https://facebook.com/example" />
                        </Form.Item>
                        <Form.Item name="instagram" label="Instagram URL">
                            <Input placeholder="https://instagram.com/example" />
                        </Form.Item>
                    </div>
                </div>
            )
        }
    ];

    return (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                        <Building2 size={20} />
                    </div>
                    <div>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>Edit Recruiter Profile</div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: 400 }}>Update corporate branding, recruiter headline, and hiring specialization</div>
                    </div>
                </div>
            }
            open={open}
            onCancel={onCancel}
            footer={null}
            width={760}
            destroyOnHidden={false}
            className="recruiter-edit-modal"
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={getInitialValues()}
                onFinish={(values) => {
                    onSave({
                        ...values,
                        profile_image: modalImage
                    });
                }}
                style={{ marginTop: '16px' }}
            >
                <Form.Item name="profile_image" hidden>
                    <Input />
                </Form.Item>

                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={tabItems}
                    className="recruiter-edit-modal-tabs"
                />

                <div className="modal-custom-footer">
                    <Button onClick={onCancel} style={{ borderRadius: '8px', fontWeight: 500 }}>
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={isSaving}
                        style={{
                            backgroundColor: '#2563eb',
                            borderColor: '#2563eb',
                            borderRadius: '8px',
                            fontWeight: 600,
                            padding: '0 22px',
                            height: '38px'
                        }}
                    >
                        Save Profile Changes
                    </Button>
                </div>
            </Form>
        </Modal>
    );
};

export default HrProfiles;
