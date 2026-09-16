'use client';
import React, { useEffect, useState } from 'react';
import { Spin, message, Skeleton } from 'antd';
import { 
    EnvironmentOutlined, 
    GlobalOutlined, 
    MailOutlined, 
    PhoneOutlined, 
    TeamOutlined, 
    BankOutlined, 
    CheckCircleFilled,
    EditOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { getHrProfileData } from '../ApiService/action';
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

const HrProfiles = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);

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
                    message.error("Could not load HR profile.");
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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A66C2]"></div>
                <p className="text-gray-500 font-medium">Loading profile...</p>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center animate-in fade-in zoom-in-95 duration-300">
                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 shadow-sm border border-blue-100">
                    <BankOutlined className="text-4xl text-[#0A66C2]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">No profile found</h2>
                <p className="text-gray-500 max-w-md mb-8 text-[15px] leading-relaxed">
                    Your employer profile is empty. Please create one to showcase your company to candidates.
                </p>
                <button 
                    onClick={() => router.push('/create-profile')}
                    className="px-6 py-3 bg-[#0A66C2] text-white rounded-lg font-semibold hover:bg-blue-700 hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-sm flex items-center gap-2"
                >
                    <EditOutlined /> Create Profile Now
                </button>
            </div>
        );
    }

    const {
        company_name, about_us, organization_type, industry_type, team_size, year_established,
        website_url, vision, map_location, contact_phone, contact_email, profile_image, banner_image,
        facebook, twitter, instagram, youtube
    } = profile;

    // Default images
    const defaultBanner = "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1500&q=80";
    const defaultLogo = "https://via.placeholder.com/150";

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };
    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div className="hr-view-container" initial="hidden" animate="visible" variants={containerVariants}>
            
            {/* Hero Section */}
            <motion.div className="hr-view-hero" variants={itemVariants}>
                <div className="hr-view-banner">
                    <img src={banner_image || defaultBanner} alt="Banner" />
                </div>
                <div className="hr-view-logo-container">
                    <div className="hr-view-logo">
                        <img src={profile_image || defaultLogo} alt="Company Logo" />
                    </div>
                </div>
            </motion.div>

            <motion.div className="hr-view-header-info" variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1>
                        {company_name || 'Company Name'} 
                        <CheckCircleFilled className="hr-verified-icon" />
                    </h1>
                    <p className="hr-view-subtitle">
                        {industry_type} • {organization_type} • Established {year_established ? new Date(year_established).getFullYear() || year_established : 'N/A'}
                    </p>
                </div>
                <button 
                    className="hr-edit-profile-btn" 
                    onClick={() => router.push('/create-profile')}
                >
                    <EditOutlined /> Edit Profile
                </button>
            </motion.div>

            <div className="hr-view-grid">
                {/* Left Column */}
                <div className="hr-view-main">
                    <motion.div className="hr-view-card" variants={itemVariants}>
                        <h3>About Us</h3>
                        {about_us ? (
                            <div 
                                dangerouslySetInnerHTML={{ __html: cleanHtml(about_us) }} 
                                className="hr-rich-text-content" 
                                style={{ wordBreak: 'normal', overflowWrap: 'break-word' }}
                            />
                        ) : (
                            <p>No details provided.</p>
                        )}
                    </motion.div>

                    <motion.div className="hr-view-card" variants={itemVariants}>
                        <h3>Company Vision</h3>
                        {vision ? (
                            <div 
                                dangerouslySetInnerHTML={{ __html: cleanHtml(vision) }} 
                                className="hr-rich-text-content" 
                                style={{ wordBreak: 'normal', overflowWrap: 'break-word' }}
                            />
                        ) : (
                            <p>No details provided.</p>
                        )}
                    </motion.div>
                </div>

                {/* Right Column (Sidebar) */}
                <div className="hr-view-sidebar">
                    <motion.div className="hr-view-card hr-sidebar-card" variants={itemVariants}>
                        <h3>Company Overview</h3>
                        <ul className="hr-overview-list">
                            <li>
                                <TeamOutlined className="hr-overview-icon" />
                                <div>
                                    <span>Team Size</span>
                                    <strong>{team_size || 'N/A'}</strong>
                                </div>
                            </li>
                            <li>
                                <BankOutlined className="hr-overview-icon" />
                                <div>
                                    <span>Organization Type</span>
                                    <strong>{organization_type || 'N/A'}</strong>
                                </div>
                            </li>
                            <li>
                                <EnvironmentOutlined className="hr-overview-icon" />
                                <div>
                                    <span>Location</span>
                                    <strong>{map_location || 'N/A'}</strong>
                                </div>
                            </li>
                        </ul>
                    </motion.div>

                    <motion.div className="hr-view-card hr-sidebar-card" variants={itemVariants}>
                        <h3>Contact Info</h3>
                        <ul className="hr-contact-list">
                            {contact_phone && (
                                <li><PhoneOutlined /> {contact_phone}</li>
                            )}
                            {contact_email && (
                                <li><MailOutlined /> {contact_email}</li>
                            )}
                            {website_url && (
                                <li><GlobalOutlined /> <a href={website_url} target="_blank" rel="noreferrer">{website_url}</a></li>
                            )}
                        </ul>
                    </motion.div>

                    {(facebook || twitter || instagram || youtube) && (
                        <motion.div className="hr-view-card hr-sidebar-card" variants={itemVariants}>
                            <h3>Social Profiles</h3>
                            <div className="hr-social-badges">
                                {facebook && <a href={facebook} target="_blank" rel="noreferrer" className="social-badge fb">Facebook</a>}
                                {twitter && <a href={twitter} target="_blank" rel="noreferrer" className="social-badge tw">Twitter</a>}
                                {instagram && <a href={instagram} target="_blank" rel="noreferrer" className="social-badge ig">Instagram</a>}
                                {youtube && <a href={youtube} target="_blank" rel="noreferrer" className="social-badge yt">YouTube</a>}
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default HrProfiles;
