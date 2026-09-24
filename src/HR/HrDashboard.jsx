'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Search,
    Briefcase,
    Megaphone,
    CreditCard,
    Download,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Sparkles,
    ArrowRight,
    Folder,
    Users,
    Eye,
    FileSpreadsheet,
    Mail,
    MessageCircle,
    Smartphone,
    Plus,
    Loader2,
    RefreshCw,
    ShieldCheck,
    Trash2,
    Clock,
    Bookmark,
    MapPin,
    FileText,
    FolderPlus,
    ExternalLink,
    Filter,
    X,
    AlertTriangle,
    AlertCircle,
    Crown,
    Lock,
    Building2
} from 'lucide-react';
import { getHrDashboardSummary, deleteHrSearch, clearHrSearches } from '../ApiService/action';
import { downloadResumeFile } from '../utils/downloadResume';

// Helper to format numbers into clean compact strings (e.g., 45.3k, 1.4M)
const formatCompactNumber = (number) => {
    if (number === null || number === undefined) return '0';
    const num = Number(number);
    if (isNaN(num)) return '0';
    if (num >= 1000000) {
        const formatted = (num / 1000000).toFixed(1);
        return formatted.endsWith('.0') ? `${Math.floor(num / 1000000)}M` : `${formatted}M`;
    }
    if (num >= 1000) {
        const formatted = (num / 1000).toFixed(1);
        return formatted.endsWith('.0') ? `${Math.floor(num / 1000)}k` : `${formatted}k`;
    }
    return num.toLocaleString();
};

const POPULAR_QUICK_SEARCHES = [
    'Full Stack Developer',
    'React Developer',
    'Java Developer',
    'DevOps Engineer',
    'Data Scientist',
    'Product Manager'
];


const formatJobCreatedDate = (dateStr) => {
    if (!dateStr) return 'Created: 13 Mar, 2026 2:28 PM';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return `Created: ${dateStr}`;
        const datePart = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        return `Created: ${datePart} ${timePart}`;
    } catch (e) {
        return `Created: ${dateStr}`;
    }
};

const getCandidateInitials = (name) => {
    if (!name) return 'C';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function HrDashboard() {
    const router = useRouter();

    // State management
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);
    const [activeNav, setActiveNav] = useState('your-searches');
    const [searchTab, setSearchTab] = useState('recent'); // 'recent' | 'saved'
    const [expandedCampaigns, setExpandedCampaigns] = useState({});
    const [expandedJobId, setExpandedJobId] = useState(null);
    const [demoModalOpen, setDemoModalOpen] = useState(false);
    const [recruiterName, setRecruiterName] = useState('Recruiter');
    const [recruiterIdState, setRecruiterIdState] = useState(2);

    // Sub-recruiter role and permissions state
    const [userAccess, setUserAccess] = useState({
        isSubRecruiter: false,
        rolePreset: 'admin',
        designation: 'Primary Recruiter',
        permissions: {
            can_post_jobs: true,
            can_view_resumes: true,
            can_download_resumes: true,
            can_contact_candidates: true,
            can_manage_applications: true,
            can_edit_company_profile: true,
            can_manage_team: true,
            can_manage_billing: true
        },
        quota: {
            mode: 'shared',
            allocated_job_posts: null,
            allocated_resume_views: null,
            allocated_resume_downloads: null,
            used_job_posts: 0,
            used_resume_views: 0,
            used_resume_downloads: 0
        }
    });

    // Parent company and main recruiter info
    const [companyInfo, setCompanyInfo] = useState({
        company_name: '',
        company_logo: null,
        main_recruiter_name: '',
        main_recruiter_email: '',
        is_sub_recruiter: false
    });

    // Downloads & Folders interactive filters
    const [selectedFolderFilter, setSelectedFolderFilter] = useState('all');
    const [resumeFilterTab, setResumeFilterTab] = useState('all'); // 'all' | 'with_resume'
    const [resumeSearchTerm, setResumeSearchTerm] = useState('');

    // Actual user searches (scoped per recruiter login, synced with database)
    const [recentSearches, setRecentSearches] = useState([]);
    const [savedSearches, setSavedSearches] = useState([]);

    // Helper to get logged-in recruiter ID
    const getRecruiterId = () => {
        try {
            if (typeof window === 'undefined') return null;
            const stored = localStorage.getItem('loginDetails');
            if (stored) {
                const parsed = JSON.parse(stored);
                return parsed?.id || parsed?.user_id || null;
            }
        } catch (e) { }
        return null;
    };

    // Load actual searches from localStorage scoped to the logged-in recruiter
    const loadLocalSearches = (recId) => {
        let localRecent = [];
        let localSaved = [];
        const targetId = recId || getRecruiterId();
        if (!targetId) return { localRecent, localSaved };
        try {
            const r = localStorage.getItem(`careerfast_recent_searches_${targetId}`);
            if (r) localRecent = JSON.parse(r);
            const s = localStorage.getItem(`careerfast_saved_searches_${targetId}`);
            if (s) localSaved = JSON.parse(s);
        } catch (e) {
            console.warn('Notice: Reading searches from localStorage:', e);
        }
        return { localRecent, localSaved };
    };

    // Merge actual user searches from recruiter-scoped localStorage & database
    const syncSearches = (dbSearches, recId) => {
        const targetId = recId || getRecruiterId();
        const { localRecent, localSaved } = loadLocalSearches(targetId);

        const dbRecent = (dbSearches?.recent || []).map((item) => ({
            id: item.id,
            title: item.query_title,
            timestamp: item.updated_at
                ? new Date(item.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : 'Recent',
            params: typeof item.query_params === 'string'
                ? JSON.parse(item.query_params || '{}')
                : item.query_params || {},
            fromDb: true
        }));

        const dbSaved = (dbSearches?.saved || []).map((item) => ({
            id: item.id,
            title: item.query_title,
            name: item.query_title,
            timestamp: item.updated_at
                ? new Date(item.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : 'Saved',
            params: typeof item.query_params === 'string'
                ? JSON.parse(item.query_params || '{}')
                : item.query_params || {},
            fromDb: true
        }));

        // Recruiter-specific local searches take precedence, then unique database searches for this recruiter
        const mergedRecent = [...localRecent];
        dbRecent.forEach((dbItem) => {
            const exists = mergedRecent.some(
                (m) => (m.title || '').trim().toLowerCase() === (dbItem.title || '').trim().toLowerCase()
            );
            if (!exists) mergedRecent.push(dbItem);
        });

        const mergedSaved = [...localSaved];
        dbSaved.forEach((dbItem) => {
            const exists = mergedSaved.some(
                (m) =>
                    (m.name || m.title || '').trim().toLowerCase() ===
                    (dbItem.name || dbItem.title || '').trim().toLowerCase()
            );
            if (!exists) mergedSaved.push(dbItem);
        });

        setRecentSearches(mergedRecent);
        setSavedSearches(mergedSaved);
    };

    // Fetch dynamic data from database
    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            let recruiterId = null;
            try {
                const stored = localStorage.getItem('loginDetails');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    const rid = parsed?.id || parsed?.user_id;
                    if (rid) {
                        recruiterId = rid;
                        setRecruiterIdState(rid);
                    }
                    if (parsed?.first_name) {
                        setRecruiterName(parsed.first_name);
                    } else if (parsed?.name) {
                        setRecruiterName(parsed.name);
                    }

                    // Check sub-recruiter info in login details
                    if (parsed?.is_sub_recruiter || parsed?.sub_recruiter_info) {
                        const subInfo = parsed?.sub_recruiter_info || {};
                        setUserAccess((prev) => ({
                            ...prev,
                            isSubRecruiter: true,
                            rolePreset: subInfo.role_preset || prev.rolePreset,
                            designation: subInfo.designation || prev.designation,
                            permissions: subInfo.permissions || prev.permissions,
                            quota: {
                                mode: subInfo.quota_mode || 'split',
                                allocated_job_posts: subInfo.allocated_job_posts ?? null,
                                allocated_resume_views: subInfo.allocated_resume_views ?? null,
                                allocated_resume_downloads: subInfo.allocated_resume_downloads ?? null,
                                used_job_posts: subInfo.used_job_posts || 0,
                                used_resume_views: subInfo.used_resume_views || 0,
                                used_resume_downloads: subInfo.used_resume_downloads || 0
                            }
                        }));
                    }
                }
            } catch (e) { }

            // Clear legacy un-scoped global search keys to prevent cross-account pollution
            try {
                localStorage.removeItem('careerfast_recent_searches');
                localStorage.removeItem('careerfast_saved_searches');
            } catch (e) { }

            // Immediately load recruiter-scoped searches from localStorage
            syncSearches(null, recruiterId);

            if (recruiterId) {
                const res = await getHrDashboardSummary(recruiterId);
                const summaryData = res?.data?.searches ? res.data : (res?.data?.data?.searches ? res.data.data : res?.data);
                if (res?.success || res?.data?.success) {
                    if (summaryData) {
                        setDashboardData(summaryData);
                        syncSearches(summaryData.searches, recruiterId);

                        // Sync company branding and main recruiter details
                        if (summaryData.company) {
                            setCompanyInfo(summaryData.company);
                        } else if (summaryData.subscription?.company) {
                            setCompanyInfo(summaryData.subscription.company);
                        }

                        // If API indicates sub-recruiter, sync live limits and usage
                        if (summaryData.subscription?.is_sub_recruiter || summaryData.company?.is_sub_recruiter) {
                            const sub = summaryData.subscription;
                            setUserAccess({
                                isSubRecruiter: true,
                                rolePreset: sub.role_preset || 'custom',
                                designation: sub.designation || 'Recruiter',
                                permissions: sub.permissions || {},
                                quota: {
                                    mode: sub.quota_mode || 'split',
                                    allocated_job_posts: sub.allocated_job_posts ?? sub.job_post_limit ?? 2,
                                    allocated_resume_views: sub.allocated_resume_views ?? sub.resume_view_limit ?? 20,
                                    allocated_resume_downloads: sub.allocated_resume_downloads ?? sub.resume_download_limit ?? 10,
                                    used_job_posts: sub.used_job_posts || sub.job_posts_used || 0,
                                    used_resume_views: sub.used_resume_views || sub.resume_views_used || 0,
                                    used_resume_downloads: sub.used_resume_downloads || sub.resume_downloads_used || 0
                                }
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('Notice: Could not load full dashboard data:', error?.message || error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    // Smooth scroll to section when clicking left anchor nav
    const scrollToSection = (id) => {
        setActiveNav(id);
        const element = document.getElementById(id);
        if (element) {
            const yOffset = -90; // offset for sticky header
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    // Scrollspy to update active left nav item on scroll
    useEffect(() => {
        const handleScroll = () => {
            const sections = ['your-searches', 'my-jobs', 'my-campaigns', 'credits-breakdown', 'downloads'];
            const scrollPosition = window.scrollY + 140;

            for (const sectionId of sections) {
                const el = document.getElementById(sectionId);
                if (el) {
                    const top = el.offsetTop;
                    const height = el.offsetHeight;
                    if (scrollPosition >= top && scrollPosition < top + height) {
                        setActiveNav(sectionId);
                        break;
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleCampaignAccordion = (id) => {
        setExpandedCampaigns((prev) => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    // Execute actual candidate search from recent/saved card
    const handleExecuteSearch = (searchItem) => {
        const rawParams = searchItem.params || searchItem.query_params || {};
        let params = typeof rawParams === 'string' ? JSON.parse(rawParams || '{}') : rawParams;

        const urlParams = new URLSearchParams();
        const keywords = Array.isArray(params.keywords)
            ? params.keywords.join(', ')
            : (params.keywords || params.search || searchItem.title || searchItem.name || '');

        if (keywords) {
            urlParams.set('keywords', keywords);
            urlParams.set('search', keywords);
        }
        if (params.location) {
            const loc = Array.isArray(params.location) ? params.location.join(',') : params.location;
            if (loc) urlParams.set('location', loc);
        }
        if (params.expMin && params.expMin !== 'Years') urlParams.set('expMin', params.expMin);
        if (params.expMax && params.expMax !== 'Years') urlParams.set('expMax', params.expMax);
        if (params.salaryMin && params.salaryMin !== 'Lacs') urlParams.set('salaryMin', params.salaryMin);
        if (params.salaryMax && params.salaryMax !== 'Lacs') urlParams.set('salaryMax', params.salaryMax);
        if (params.noticePeriod) {
            const np = Array.isArray(params.noticePeriod) ? params.noticePeriod.join(',') : params.noticePeriod;
            if (np) urlParams.set('noticePeriod', np);
        }

        router.push(`/candidate-search/results?${urlParams.toString()}`);
    };

    const handleQuickKeywordClick = (keyword) => {
        router.push(`/candidate-search?keywords=${encodeURIComponent(keyword)}`);
    };

    // Delete single search item from recent or saved
    const handleDeleteSearchItem = async (item, searchType, e) => {
        if (e) e.stopPropagation();
        const recId = recruiterIdState || getRecruiterId();
        if (searchType === 'recent') {
            const updated = recentSearches.filter((s) => s.id !== item.id && s.title !== item.title);
            setRecentSearches(updated);
            try {
                if (recId) {
                    localStorage.setItem(
                        `careerfast_recent_searches_${recId}`,
                        JSON.stringify(updated.filter((u) => !u.fromDb))
                    );
                }
            } catch (err) { }
            try {
                if (recId) {
                    await deleteHrSearch(item.id, recId);
                }
            } catch (err) { }
        } else {
            const updated = savedSearches.filter(
                (s) => s.id !== item.id && (s.name || s.title) !== (item.name || item.title)
            );
            setSavedSearches(updated);
            try {
                if (recId) {
                    localStorage.setItem(
                        `careerfast_saved_searches_${recId}`,
                        JSON.stringify(updated.filter((u) => !u.fromDb))
                    );
                }
            } catch (err) { }
            try {
                if (recId) {
                    await deleteHrSearch(item.id, recId);
                }
            } catch (err) { }
        }
    };

    // Clear all recent searches
    const handleClearAllRecent = async (e) => {
        if (e) e.stopPropagation();
        const recId = recruiterIdState || getRecruiterId();
        setRecentSearches([]);
        try {
            if (recId) {
                localStorage.removeItem(`careerfast_recent_searches_${recId}`);
            }
            localStorage.removeItem('careerfast_recent_searches');
        } catch (err) { }
        try {
            if (recId) {
                await clearHrSearches(recId, 'recent');
            }
        } catch (err) { }
    };

    const activeSearchesList = searchTab === 'recent' ? recentSearches : savedSearches;

    const jobsData = dashboardData?.jobs || {};
    const jobsList = jobsData.list || [];
    const totalJobs = jobsData.total !== undefined ? jobsData.total : jobsList.length;
    const activeJobs = jobsData.active !== undefined ? jobsData.active : jobsList.filter(j => {
        const isClosed = j.is_closed?.data ? j.is_closed.data[0] === 1 : j.is_closed === 1;
        return !isClosed && j.approval_status === 'approved';
    }).length;
    const pendingJobs = jobsData.pending !== undefined ? jobsData.pending : jobsList.filter(j => {
        const isClosed = j.is_closed?.data ? j.is_closed.data[0] === 1 : j.is_closed === 1;
        return !isClosed && (j.approval_status === 'pending' || !j.approval_status);
    }).length;
    const rejectedJobs = jobsData.rejected !== undefined ? jobsData.rejected : jobsList.filter(j => j.approval_status === 'rejected').length;
    const closedJobs = jobsData.closed !== undefined ? jobsData.closed : jobsList.filter(j => (j.is_closed?.data ? j.is_closed.data[0] === 1 : j.is_closed === 1)).length;

    const subscription = dashboardData?.subscription || {
        plan_name: 'Basic',
        status: 'Active',
        expiry_date: null,
        billing_cycle: 'monthly',
        active_job_limit: 3,
        active_jobs_count: activeJobs,
        active_jobs_remaining: Math.max(0, 3 - activeJobs),
        active_limit_reached: activeJobs >= 3,
        job_post_limit: 5,
        job_posts_used: totalJobs,
        job_posts_remaining: Math.max(0, 5 - totalJobs),
        post_limit_reached: totalJobs >= 5,
        pending_jobs_count: pendingJobs
    };

    const [jobStatusFilter, setJobStatusFilter] = useState('all'); // 'all' | 'active' | 'pending' | 'closed'

    const filteredJobsList = useMemo(() => {
        if (jobStatusFilter === 'all') return jobsList;
        if (jobStatusFilter === 'active') {
            return jobsList.filter(j => {
                const isClosed = j.is_closed?.data ? j.is_closed.data[0] === 1 : j.is_closed === 1;
                return !isClosed && j.approval_status === 'approved';
            });
        }
        if (jobStatusFilter === 'pending') {
            return jobsList.filter(j => {
                const isClosed = j.is_closed?.data ? j.is_closed.data[0] === 1 : j.is_closed === 1;
                return !isClosed && (j.approval_status === 'pending' || !j.approval_status);
            });
        }
        if (jobStatusFilter === 'closed') {
            return jobsList.filter(j => {
                const isClosed = j.is_closed?.data ? j.is_closed.data[0] === 1 : j.is_closed === 1;
                return isClosed;
            });
        }
        return jobsList;
    }, [jobsList, jobStatusFilter]);

    const campaignsList = dashboardData?.campaigns || [];
    const credits = dashboardData?.credits || {
        profile_usage_used: 45300,
        profile_usage_total: 720000,
        profile_views: 1300,
        excel_downloads: 10,
        job_posting_used: subscription.job_posts_used || totalJobs,
        job_posting_total: subscription.job_post_limit || 5,
        jobs_posted: totalJobs || 0,
        outreach_used: 1400000,
        outreach_total: 10800000,
        email_count: 0,
        whatsapp_count: 0,
        sms_count: 0
    };

    const downloads = dashboardData?.downloads || {
        folders: [],
        candidates: [],
        totalFolders: 0,
        totalDownloads: 0,
        totalResumes: 0
    };

    const foldersList = Array.isArray(downloads.folders) ? downloads.folders : [];
    const candidatesList = Array.isArray(downloads.candidates) ? downloads.candidates : [];

    const filteredCandidates = useMemo(() => {
        return candidatesList.filter((cand) => {
            const matchesFolder = selectedFolderFilter === 'all' || !selectedFolderFilter || String(cand.folder_id) === String(selectedFolderFilter);
            const matchesResume = resumeFilterTab === 'all' || (resumeFilterTab === 'with_resume' && cand.has_resume);
            const term = resumeSearchTerm.trim().toLowerCase();
            const matchesSearch = !term ||
                (cand.name && cand.name.toLowerCase().includes(term)) ||
                (cand.designation && cand.designation.toLowerCase().includes(term)) ||
                (cand.company && cand.company.toLowerCase().includes(term)) ||
                (cand.location && cand.location.toLowerCase().includes(term)) ||
                (cand.folder_name && cand.folder_name.toLowerCase().includes(term)) ||
                (cand.stage && cand.stage.toLowerCase().includes(term));
            return matchesFolder && matchesResume && matchesSearch;
        });
    }, [candidatesList, selectedFolderFilter, resumeFilterTab, resumeSearchTerm]);

    // Circular gauge percentage calculation
    const profilePercent = credits.profile_usage_total > 0
        ? Math.min(100, Math.round((credits.profile_usage_used / credits.profile_usage_total) * 100))
        : 6;

    const jobPostPercent = credits.job_posting_total > 0
        ? Math.min(100, Math.round((credits.job_posting_used / credits.job_posting_total) * 100))
        : 5;

    const outreachPercent = credits.outreach_total > 0
        ? Math.min(100, Math.round((credits.outreach_used / credits.outreach_total) * 100))
        : 13;

    const recruiterInitials = (recruiterName || 'HR')
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'HR';

    const isCompanyLimitReached = Boolean(
        subscription.active_limit_reached ||
        subscription.company_active_limit_reached ||
        subscription.company_post_limit_reached
    );

    const isPostingRestricted = Boolean(
        userAccess?.permissions?.can_post_jobs === false ||
        subscription.can_post_jobs === false ||
        isCompanyLimitReached
    );

    // ─── Skeleton Loader ─────────────────────────────────────────────────
    if (loading) {
        const shimmerClass = 'relative overflow-hidden bg-slate-200/70 rounded-lg before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent';

        return (
            <div className="min-h-screen bg-[#F8FAFC] py-7 text-slate-800 antialiased font-sans">
                {/* Shimmer keyframe */}
                <style>{`@keyframes shimmer{100%{transform:translateX(100%)}}`}</style>
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">

                    {/* ── Hero Header Skeleton ── */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6 mb-6">
                        {/* Greeting row */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${shimmerClass}`} />
                                <div className="space-y-2 flex-1 max-w-sm">
                                    <div className={`h-6 w-52 ${shimmerClass}`} />
                                    <div className={`h-3.5 w-80 rounded ${shimmerClass}`} />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <div className={`w-10 h-10 rounded-xl ${shimmerClass}`} />
                                <div className={`w-36 h-10 rounded-xl ${shimmerClass}`} />
                                <div className={`w-28 h-10 rounded-xl ${shimmerClass}`} />
                            </div>
                        </div>

                        {/* KPI Row */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 pt-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="p-3.5 sm:p-4 rounded-xl bg-slate-50/70 border border-slate-200/70">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className={`h-3.5 w-24 ${shimmerClass}`} />
                                        <div className={`w-7 h-7 rounded-lg ${shimmerClass}`} />
                                    </div>
                                    <div className={`h-7 w-20 mb-2 ${shimmerClass}`} />
                                    <div className={`h-3 w-16 ${shimmerClass}`} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Main Layout: Sidebar + Content ── */}
                    <div className="flex flex-col lg:flex-row gap-7 items-start">

                        {/* Sidebar Skeleton */}
                        <aside className="w-full lg:w-[270px] flex-shrink-0 lg:sticky lg:top-24 space-y-5">
                            <nav className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-2.5 space-y-2">
                                <div className={`h-3 w-32 mx-3 mt-2 mb-3 ${shimmerClass}`} />
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-xl">
                                        <div className={`w-5 h-5 rounded ${shimmerClass}`} />
                                        <div className={`h-4 flex-1 ${shimmerClass}`} />
                                    </div>
                                ))}
                            </nav>
                            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-3">
                                <div className={`h-3.5 w-24 ${shimmerClass}`} />
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="flex items-center justify-between p-2 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-4 h-4 rounded ${shimmerClass}`} />
                                            <div className={`h-3.5 w-28 ${shimmerClass}`} />
                                        </div>
                                        <div className={`w-3 h-3 rounded ${shimmerClass}`} />
                                    </div>
                                ))}
                            </div>
                        </aside>

                        {/* Right Content Skeleton */}
                        <main className="flex-1 w-full space-y-6">

                            {/* Section 1: Searches Skeleton */}
                            <section className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
                                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                    <div className="flex items-center gap-2.5">
                                        <div className={`w-8 h-8 rounded-xl ${shimmerClass}`} />
                                        <div className={`h-5 w-40 ${shimmerClass}`} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`h-8 w-20 rounded-xl ${shimmerClass}`} />
                                        <div className={`h-8 w-20 rounded-xl ${shimmerClass}`} />
                                    </div>
                                </div>
                                <div className="mt-4 space-y-3">
                                    <div className={`h-3 w-56 mb-4 ${shimmerClass}`} />
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="flex items-center gap-3.5 py-3 px-3 rounded-xl border border-slate-100/80">
                                            <div className={`w-9 h-9 rounded-xl shrink-0 ${shimmerClass}`} />
                                            <div className="flex-1 space-y-1.5">
                                                <div className={`h-4 w-48 ${shimmerClass}`} />
                                                <div className={`h-3 w-20 ${shimmerClass}`} />
                                            </div>
                                            <div className={`w-7 h-7 rounded-lg shrink-0 ${shimmerClass}`} />
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Section 2: Jobs Skeleton */}
                            <section className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                                    <div className="flex items-center gap-2.5">
                                        <div className={`w-8 h-8 rounded-xl ${shimmerClass}`} />
                                        <div className={`h-5 w-24 ${shimmerClass}`} />
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <div className={`h-8 w-56 rounded-xl ${shimmerClass}`} />
                                        <div className={`h-8 w-24 rounded-xl ${shimmerClass}`} />
                                    </div>
                                </div>
                                {/* Quota bar skeleton */}
                                <div className="mt-4">
                                    <div className={`h-10 w-full rounded-xl mb-3.5 ${shimmerClass}`} />
                                    {/* Job cards */}
                                    <div className="rounded-2xl border border-slate-200/90 overflow-hidden divide-y divide-slate-100">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className="flex items-center justify-between px-4 py-4">
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${shimmerClass}`} />
                                                    <div className="space-y-1.5 flex-1">
                                                        <div className={`h-4 w-64 ${shimmerClass}`} />
                                                        <div className="flex items-center gap-2">
                                                            <div className={`h-3 w-20 ${shimmerClass}`} />
                                                            <div className={`h-3 w-24 ${shimmerClass}`} />
                                                            <div className={`h-3 w-16 ${shimmerClass}`} />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 shrink-0">
                                                    <div className={`h-6 w-16 rounded-full ${shimmerClass}`} />
                                                    <div className={`w-5 h-5 rounded ${shimmerClass}`} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>

                            {/* Section 3: Campaigns Skeleton */}
                            <section className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
                                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                    <div className="flex items-center gap-2.5">
                                        <div className={`w-8 h-8 rounded-xl ${shimmerClass}`} />
                                        <div className={`h-5 w-36 ${shimmerClass}`} />
                                    </div>
                                </div>
                                <div className="mt-4 space-y-3">
                                    {[...Array(2)].map((_, i) => (
                                        <div key={i} className="p-4 rounded-xl border border-slate-200/80 space-y-2.5">
                                            <div className="flex items-center justify-between">
                                                <div className={`h-4 w-44 ${shimmerClass}`} />
                                                <div className={`h-5 w-16 rounded-full ${shimmerClass}`} />
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className={`h-3 w-24 ${shimmerClass}`} />
                                                <div className={`h-3 w-20 ${shimmerClass}`} />
                                                <div className={`h-3 w-28 ${shimmerClass}`} />
                                            </div>
                                            <div className={`h-2 w-full rounded-full bg-slate-100 ${shimmerClass}`} />
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Section 4: Credits Skeleton */}
                            <section className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
                                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                    <div className="flex items-center gap-2.5">
                                        <div className={`w-8 h-8 rounded-xl ${shimmerClass}`} />
                                        <div className={`h-5 w-40 ${shimmerClass}`} />
                                    </div>
                                </div>
                                <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-5">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="p-5 rounded-xl border border-slate-200/80 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className={`h-3.5 w-28 ${shimmerClass}`} />
                                                <div className={`w-6 h-6 rounded-lg ${shimmerClass}`} />
                                            </div>
                                            {/* Circular gauge placeholder */}
                                            <div className="flex items-center justify-center py-2">
                                                <div className={`w-24 h-24 rounded-full border-8 border-slate-200/60 ${shimmerClass}`} style={{ borderRadius: '50%' }} />
                                            </div>
                                            <div className="space-y-2">
                                                <div className={`h-3 w-full ${shimmerClass}`} />
                                                <div className={`h-3 w-3/4 ${shimmerClass}`} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Section 5: Downloads Skeleton */}
                            <section className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
                                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                    <div className="flex items-center gap-2.5">
                                        <div className={`w-8 h-8 rounded-xl ${shimmerClass}`} />
                                        <div className={`h-5 w-44 ${shimmerClass}`} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`h-8 w-32 rounded-xl ${shimmerClass}`} />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    {/* Folder pills */}
                                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                                        {[...Array(4)].map((_, i) => (
                                            <div key={i} className={`h-8 rounded-xl ${shimmerClass}`} style={{ width: `${60 + i * 20}px` }} />
                                        ))}
                                    </div>
                                    {/* Candidate rows */}
                                    <div className="space-y-2.5">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100/80">
                                                <div className={`w-10 h-10 rounded-full shrink-0 ${shimmerClass}`} />
                                                <div className="flex-1 space-y-1.5">
                                                    <div className={`h-4 w-40 ${shimmerClass}`} />
                                                    <div className="flex items-center gap-2">
                                                        <div className={`h-3 w-28 ${shimmerClass}`} />
                                                        <div className={`h-3 w-20 ${shimmerClass}`} />
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <div className={`h-7 w-7 rounded-lg ${shimmerClass}`} />
                                                    <div className={`h-7 w-7 rounded-lg ${shimmerClass}`} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        </main>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] py-7 text-slate-800 antialiased font-sans [&_a]:no-underline [&_a:hover]:no-underline">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">

                {/* ================= TOP HERO / EXECUTIVE HEADER ================= */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 pb-4 border-b border-slate-100">

                        {/* Recruiter Avatar & Greeting */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="relative">
                                {companyInfo.company_logo ? (
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white border border-slate-200/90 shadow-md p-1.5 flex items-center justify-center ring-4 ring-blue-50/70 overflow-hidden">
                                        <img
                                            src={companyInfo.company_logo}
                                            alt={companyInfo.company_name || 'Company'}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#0A66C2] via-[#0855a5] to-[#004182] text-white flex items-center justify-center font-bold text-lg sm:text-xl shadow-md shadow-blue-500/20 ring-4 ring-blue-50">
                                        {recruiterInitials}
                                    </div>
                                )}
                                <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 bg-emerald-500 rounded-full ring-2 ring-white flex items-center justify-center shadow-2xs" title="Online Workspace">
                                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-0 tracking-tight">
                                        Welcome, {recruiterName}
                                    </h1>
                                    {userAccess.isSubRecruiter ? (
                                        <>
                                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                                                <ShieldCheck size={13} className="text-indigo-600" />
                                                Sub-Recruiter • {userAccess.rolePreset === 'team_admin' ? 'Team Admin' : userAccess.designation || 'Recruiter'}
                                            </span>
                                            {(companyInfo.company_name || companyInfo.main_recruiter_name) && (
                                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200/90 shadow-2xs" title="Parent Organization & Main Recruiter">
                                                    <Building2 size={12} className="text-[#0A66C2]" />
                                                    <span className="font-semibold text-slate-900">{companyInfo.company_name || 'Organization'}</span>
                                                    {companyInfo.main_recruiter_name && (
                                                        <>
                                                            <span className="text-slate-300">•</span>
                                                            <span className="text-slate-600 font-medium">Under: <strong className="text-slate-900 font-semibold">{companyInfo.main_recruiter_name}</strong></span>
                                                        </>
                                                    )}
                                                </span>
                                            )}
                                            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full text-slate-700">
                                                <Sparkles size={12} className="text-blue-600" />
                                                <span>Assigned Quota:</span>
                                                {userAccess.permissions.can_post_jobs !== false && (
                                                    isCompanyLimitReached ? (
                                                        <span className="text-amber-800 font-semibold bg-amber-100/90 px-1.5 py-0.5 rounded-full border-1 border-amber-200">
                                                            {userAccess.quota.used_job_posts || 0}/{userAccess.quota.allocated_job_posts ?? subscription.job_post_limit ?? 2} Jobs (Plan Quota Full)
                                                        </span>
                                                    ) : (
                                                        <span className="text-blue-700 font-semibold">{userAccess.quota.used_job_posts || subscription.job_posts_used || 0}/{userAccess.quota.allocated_job_posts ?? subscription.job_post_limit ?? 2} Jobs</span>
                                                    )
                                                )}
                                                <span className="text-emerald-700 font-semibold">• {userAccess.quota.used_resume_views || subscription.resume_views_used || 0}/{userAccess.quota.allocated_resume_views ?? subscription.resume_view_limit ?? 20} Views</span>
                                                <span className="text-purple-700 font-semibold">• {userAccess.quota.used_resume_downloads || subscription.resume_downloads_used || 0}/{userAccess.quota.allocated_resume_downloads ?? subscription.resume_download_limit ?? 10} Downloads</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0A66C2] border-1 border-blue-200/70">
                                                <ShieldCheck size={13} className="text-[#0A66C2]" />
                                                Recruiter Workspace
                                            </span>
                                            <Link
                                                href="/billing"
                                                className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 text-amber-900 border-1 border-amber-200/80 transition-all cursor-pointer shadow-2xs"
                                                title="View subscription plan and slot quota"
                                            >
                                                <Crown size={12} className="text-amber-600" />
                                                <span>{subscription.plan_name} Plan</span>
                                                <span className="text-amber-700 font-semibold">• {activeJobs}/{subscription.active_job_limit} Active Slots</span>
                                            </Link>
                                        </>
                                    )}
                                </div>
                                <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium mb-0">
                                    {userAccess.isSubRecruiter
                                        ? `Assigned workspace under ${companyInfo.main_recruiter_name ? `${companyInfo.main_recruiter_name} (${companyInfo.company_name || 'Organization'})` : 'Primary Recruiter'}. Access tailored to your permissions and quotas.`
                                        : 'Real-time intelligence on your active job searches, postings, and outreach pipelines.'}
                                </p>
                            </div>
                        </div>

                        {/* Quick Action CTAs - Always on one line */}
                        <div className="flex items-center gap-2 flex-nowrap shrink-0">
                            <button
                                onClick={fetchDashboardData}
                                title="Refresh dashboard data"
                                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-slate-600 hover:text-[#0A66C2] hover:border-blue-200 transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0"
                            >
                                <RefreshCw size={17} className={loading ? 'animate-spin text-[#0A66C2]' : ''} />
                            </button>

                            {userAccess.permissions.can_view_resumes !== false && (
                                <Link
                                    href="/candidate-search"
                                    className="px-3.5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100/70 text-[#0A66C2] border-1 border-blue-200/80 font-semibold text-xs sm:text-[13.5px] transition-all inline-flex items-center gap-2 shadow-2xs hover:shadow-xs cursor-pointer whitespace-nowrap shrink-0"
                                >
                                    <Search size={15} className="text-[#0A66C2] stroke-[2.3]" />
                                    <span>Search Candidates</span>
                                </Link>
                            )}

                            {userAccess.permissions.can_post_jobs !== false && (
                                isPostingRestricted ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            alert(subscription.limit_reason || "Job posting is locked because the company's plan limits are reached. All active job slots or monthly posts are in use.");
                                        }}
                                        title={subscription.limit_reason || "Company job posting limit reached"}
                                        className="px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200/90 text-slate-400 font-semibold text-xs sm:text-[13.5px] inline-flex items-center gap-2 cursor-not-allowed shadow-2xs whitespace-nowrap shrink-0"
                                    >
                                        <Lock size={15} className="text-slate-400" />
                                        <span>Post a Job (Quota Full)</span>
                                    </button>
                                ) : (
                                    <Link
                                        href="/post-job"
                                        className="px-4 py-2.5 rounded-xl bg-[#0A66C2] hover:bg-[#004182] text-white font-medium text-xs sm:text-[13.5px] shadow-sm shadow-blue-500/25 hover:shadow-md hover:shadow-blue-500/35 transition-all inline-flex items-center gap-2 cursor-pointer active:scale-98 whitespace-nowrap shrink-0"
                                    >
                                        <Plus size={16} strokeWidth={2.5} />
                                        <span>Post a Job</span>
                                    </Link>
                                )
                            )}
                        </div>
                    </div>

                    {/* KPI Summary Ribbon */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 pt-4">

                        {/* KPI 1: Active Searches */}
                        {userAccess.permissions.can_view_resumes !== false ? (
                            <div
                                onClick={() => scrollToSection('your-searches')}
                                className="p-3.5 sm:p-4 rounded-xl bg-slate-50/70 hover:bg-blue-50/50 border border-slate-200/70 hover:border-blue-200 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center justify-between text-slate-500 mb-2">
                                    <span className="text-[13px] font-semibold">Candidate Searches</span>
                                    <div className="w-7 h-7 rounded-lg bg-blue-100/70 text-[#0A66C2] flex items-center justify-center group-hover:scale-105 transition-transform">
                                        <Search size={14} strokeWidth={2.3} />
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                                        {recentSearches.length + savedSearches.length}
                                    </span>
                                    <span className="text-[11px] font-medium text-slate-500">
                                        ({recentSearches.length} recent)
                                    </span>
                                </div>
                                <div className="text-[11px] font-semibold text-[#0A66C2] mt-1.5 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                    <span>View searches</span>
                                    <ArrowRight size={11} />
                                </div>
                            </div>
                        ) : (
                            <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/40 border border-slate-200/60 opacity-60">
                                <div className="flex items-center justify-between text-slate-400 mb-2">
                                    <span className="text-[13px] font-semibold">Candidate Search</span>
                                </div>
                                <span className="text-xs text-slate-400 font-medium">Restricted by Admin</span>
                            </div>
                        )}

                        {/* KPI 2: Active Job Slots or Resume Views Split */}
                        {userAccess.permissions.can_post_jobs !== false ? (
                            <div
                                onClick={() => {
                                    setJobStatusFilter('active');
                                    scrollToSection('my-jobs');
                                }}
                                className={`p-3.5 sm:p-4 rounded-xl transition-all cursor-pointer group border ${subscription.active_limit_reached
                                    ? 'bg-amber-50/40 border-amber-200/90 hover:bg-amber-50/80'
                                    : 'bg-slate-50/70 hover:bg-emerald-50/50 border-slate-200/70 hover:border-emerald-200'
                                    }`}
                            >
                                <div className="flex items-center justify-between text-slate-500 mb-2">
                                    <span className="text-[13px] font-semibold">Active Job Slots</span>
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform ${subscription.active_limit_reached
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-emerald-100/80 text-emerald-700'
                                        }`}>
                                        <Briefcase size={14} strokeWidth={2.3} />
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                                        {activeJobs} <span className="text-sm font-semibold text-slate-400">/ {userAccess.quota.allocated_job_posts ?? subscription.active_job_limit}</span>
                                    </span>
                                    <span className={`text-[11px] font-bold ${isCompanyLimitReached ? 'text-amber-700' : 'text-emerald-700'}`}>
                                        {isCompanyLimitReached ? 'Quota Full' : `${subscription.active_jobs_remaining ?? 0} Available`}
                                    </span>
                                </div>
                                <div className="text-[11px] font-semibold text-emerald-700 mt-1.5 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                    <span>
                                        {activeJobs} Live on Portal {isCompanyLimitReached && subscription.company_active_jobs ? `(${subscription.company_active_jobs}/${subscription.company_active_limit} Co. Slots Full)` : ''}
                                    </span>
                                    <ArrowRight size={11} />
                                </div>
                            </div>
                        ) : (
                            <div
                                onClick={() => router.push('/candidate-search')}
                                className="p-3.5 sm:p-4 rounded-xl bg-slate-50/70 hover:bg-emerald-50/50 border border-slate-200/70 hover:border-emerald-200 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center justify-between text-slate-500 mb-2">
                                    <span className="text-[13px] font-semibold">Resume Views Pool</span>
                                    <div className="w-7 h-7 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                                        <Eye size={14} strokeWidth={2.3} />
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                                        {userAccess.quota.used_resume_views || 0} <span className="text-sm font-semibold text-slate-400">/ {userAccess.quota.allocated_resume_views ?? 20}</span>
                                    </span>
                                    <span className="text-[11px] font-bold text-emerald-700">
                                        {Math.max(0, (userAccess.quota.allocated_resume_views ?? 20) - (userAccess.quota.used_resume_views || 0))} left
                                    </span>
                                </div>
                                <div className="text-[11px] font-semibold text-emerald-700 mt-1.5 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                    <span>Assigned Views Quota</span>
                                    <ArrowRight size={11} />
                                </div>
                            </div>
                        )}

                        {/* KPI 3: Pending Approval or Downloads Allotted */}
                        {userAccess.permissions.can_post_jobs !== false ? (
                            <div
                                onClick={() => {
                                    setJobStatusFilter('pending');
                                    scrollToSection('my-jobs');
                                }}
                                className={`p-3.5 sm:p-4 rounded-xl transition-all cursor-pointer group border ${pendingJobs > 0
                                    ? 'bg-amber-50/80 hover:bg-amber-100/70 border-amber-300 shadow-2xs ring-1 ring-amber-200/60'
                                    : 'bg-slate-50/70 hover:bg-blue-50/50 border-slate-200/70 hover:border-blue-200'
                                    }`}
                            >
                                <div className="flex items-center justify-between text-slate-500 mb-2">
                                    <span className="text-[13px] font-semibold">Pending Approval</span>
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform ${pendingJobs > 0
                                        ? 'bg-amber-200/90 text-amber-800'
                                        : 'bg-slate-100 text-slate-500'
                                        }`}>
                                        <Clock size={14} strokeWidth={2.3} />
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className={`text-xl sm:text-2xl font-bold tracking-tight ${pendingJobs > 0 ? 'text-amber-900' : 'text-slate-900'
                                        }`}>
                                        {pendingJobs}
                                    </span>
                                    <span className={`text-[11px] font-bold ${pendingJobs > 0 ? 'text-amber-800' : 'text-slate-400'
                                        }`}>
                                        {pendingJobs > 0 ? 'In Review' : '0 in queue'}
                                    </span>
                                </div>
                                <div className={`text-[11px] font-bold mt-1.5 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform ${pendingJobs > 0 ? 'text-amber-800' : 'text-slate-400'
                                    }`}>
                                    <span>{subscription.active_limit_reached && pendingJobs > 0 ? 'Slot full: Review blocked' : 'View pending jobs'}</span>
                                    <ArrowRight size={11} />
                                </div>
                            </div>
                        ) : (
                            <div
                                onClick={() => scrollToSection('downloads')}
                                className="p-3.5 sm:p-4 rounded-xl bg-slate-50/70 hover:bg-purple-50/50 border border-slate-200/70 hover:border-purple-200 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center justify-between text-slate-500 mb-2">
                                    <span className="text-[13px] font-semibold">Downloads Pool</span>
                                    <div className="w-7 h-7 rounded-lg bg-purple-100/70 text-purple-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                                        <Download size={14} strokeWidth={2.3} />
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                                        {userAccess.quota.used_resume_downloads || 0} <span className="text-sm font-semibold text-slate-400">/ {userAccess.quota.allocated_resume_downloads ?? 10}</span>
                                    </span>
                                    <span className="text-[11px] font-bold text-purple-700">
                                        {Math.max(0, (userAccess.quota.allocated_resume_downloads ?? 10) - (userAccess.quota.used_resume_downloads || 0))} left
                                    </span>
                                </div>
                                <div className="text-[11px] font-semibold text-purple-700 mt-1.5 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                    <span>Assigned CV Downloads</span>
                                    <ArrowRight size={11} />
                                </div>
                            </div>
                        )}

                        {/* KPI 4: Monthly Post Quota (Sub-Recruiter: No Billing Link, shows split quota) */}
                        {userAccess.isSubRecruiter ? (
                            <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/70 border border-slate-200/70 transition-all">
                                <div className="flex items-center justify-between text-slate-500 mb-2">
                                    <span className="text-[13px] font-semibold">
                                        {userAccess.permissions.can_post_jobs !== false ? 'Job Posts Split' : 'Candidate Contact'}
                                    </span>
                                    <div className="w-7 h-7 rounded-lg bg-indigo-100/70 text-indigo-700 flex items-center justify-center">
                                        <Crown size={14} strokeWidth={2.3} />
                                    </div>
                                </div>
                                {userAccess.permissions.can_post_jobs !== false ? (
                                    <>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                                                {userAccess.quota.used_job_posts || subscription.job_posts_used || 0} <span className="text-sm font-semibold text-slate-400">/ {userAccess.quota.allocated_job_posts ?? subscription.job_post_limit ?? 2}</span>
                                            </span>
                                            <span className={`text-[11px] font-bold ${isCompanyLimitReached ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                                                {isCompanyLimitReached ? '0 left (Plan Full)' : `${Math.max(0, (userAccess.quota.allocated_job_posts ?? subscription.job_post_limit ?? 2) - (userAccess.quota.used_job_posts || subscription.job_posts_used || 0))} left`}
                                            </span>
                                        </div>
                                        <div className={`text-[11px] font-semibold mt-1.5 flex items-center gap-1 ${isCompanyLimitReached ? 'text-rose-600' : 'text-indigo-700'}`}>
                                            <span>{isCompanyLimitReached ? `Company Plan Full (${subscription.company_posts_used || 5}/${subscription.company_post_limit || 5})` : 'Allocated Split Quota'}</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-xl sm:text-2xl font-bold text-emerald-700 tracking-tight">
                                                Active
                                            </span>
                                            <span className="text-[11px] font-bold text-emerald-600">
                                                Enabled
                                            </span>
                                        </div>
                                        <div className="text-[11px] font-semibold text-emerald-700 mt-1.5 flex items-center gap-1">
                                            <span>Direct Candidate Outreach</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <Link
                                href="/billing"
                                className="p-3.5 sm:p-4 rounded-xl bg-slate-50/70 hover:bg-blue-50/50 border border-slate-200/70 hover:border-blue-200 transition-all cursor-pointer group block"
                            >
                                <div className="flex items-center justify-between text-slate-500 mb-2">
                                    <span className="text-[13px] font-semibold">Monthly Post Quota</span>
                                    <div className="w-7 h-7 rounded-lg bg-indigo-100/70 text-indigo-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                                        <Crown size={14} strokeWidth={2.3} />
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                                        {subscription.job_posts_used} <span className="text-sm font-semibold text-slate-400">/ {subscription.job_post_limit}</span>
                                    </span>
                                    <span className={`text-[11px] font-bold ${subscription.post_limit_reached ? 'text-rose-600' : 'text-slate-500'
                                        }`}>
                                        {subscription.post_limit_reached ? 'Quota full' : `${subscription.job_posts_remaining} left`}
                                    </span>
                                </div>
                                <div className="text-[11px] font-semibold text-[#0A66C2] mt-1.5 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                    <span>{subscription.plan_name} Plan</span>
                                    <ArrowRight size={11} />
                                </div>
                            </Link>
                        )}

                        {/* KPI 5: Profile Credits or Sub-Recruiter Resume Views Split */}
                        {userAccess.isSubRecruiter ? (
                            <div
                                onClick={() => router.push('/candidate-search')}
                                className="p-3.5 sm:p-4 rounded-xl bg-slate-50/70 hover:bg-blue-50/50 border border-slate-200/70 hover:border-blue-200 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center justify-between text-slate-500 mb-2">
                                    <span className="text-[13px] font-semibold">Resume Views Split</span>
                                    <div className="w-7 h-7 rounded-lg bg-blue-100/70 text-[#0A66C2] flex items-center justify-center group-hover:scale-105 transition-transform">
                                        <Eye size={14} strokeWidth={2.3} />
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                                        {userAccess.quota.used_resume_views || subscription.resume_views_used || 0} <span className="text-sm font-semibold text-slate-400">/ {userAccess.quota.allocated_resume_views ?? subscription.resume_view_limit ?? 20}</span>
                                    </span>
                                    <span className="text-[11px] font-medium text-slate-500">
                                        {Math.max(0, (userAccess.quota.allocated_resume_views ?? subscription.resume_view_limit ?? 20) - (userAccess.quota.used_resume_views || subscription.resume_views_used || 0))} left
                                    </span>
                                </div>
                                <div className="text-[11px] font-semibold text-[#0A66C2] mt-1.5 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                    <span>Search & unlock CVs</span>
                                    <ArrowRight size={11} />
                                </div>
                            </div>
                        ) : (
                            <div
                                onClick={() => scrollToSection('credits-breakdown')}
                                className="p-3.5 sm:p-4 rounded-xl bg-slate-50/70 hover:bg-blue-50/50 border border-slate-200/70 hover:border-blue-200 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center justify-between text-slate-500 mb-2">
                                    <span className="text-[13px] font-semibold">Credits Usage</span>
                                    <div className="w-7 h-7 rounded-lg bg-blue-100/70 text-[#0A66C2] flex items-center justify-center group-hover:scale-105 transition-transform">
                                        <CreditCard size={14} strokeWidth={2.3} />
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                                        {profilePercent}%
                                    </span>
                                    <span className="text-[11px] font-medium text-slate-500">
                                        used ({formatCompactNumber(credits.profile_usage_used)})
                                    </span>
                                </div>
                                <div className="text-[11px] font-semibold text-[#0A66C2] mt-1.5 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                    <span>View credit quota</span>
                                    <ArrowRight size={11} />
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Sub-Recruiter Company Limit Warning Banner */}
                    {userAccess.isSubRecruiter && isCompanyLimitReached && (
                        <div className="mt-4 p-4 rounded-2xl border-1 border-amber-300 bg-amber-50/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3.5">
                            <div className="flex items-start sm:items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border-1 border-amber-200">
                                    <AlertTriangle size={20} className="text-amber-700" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h4 className="font-bold text-sm text-amber-950 mb-0">
                                            Company Plan Limit Reached
                                        </h4>
                                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-200/80 text-amber-900 border-1 border-amber-300">
                                            {subscription.company_active_jobs ?? 3}/{subscription.company_active_limit ?? 3} Active Slots Full
                                        </span>
                                        {subscription.company_post_limit_reached && (
                                            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border-1 border-rose-200">
                                                Monthly Quota Full ({subscription.company_posts_used ?? 5}/{subscription.company_post_limit ?? 5})
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-amber-900/90 mt-1 mb-0 leading-relaxed font-medium">
                                        {subscription.limit_reason || `Your company's subscription plan has reached its limit (${subscription.company_active_jobs || 3} active jobs currently live). Job posting is temporarily restricted for all sub-recruiters until an active job is closed or the primary recruiter upgrades the plan.`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-amber-200 text-xs font-bold text-amber-800 shadow-2xs">
                                    <Lock size={13} className="text-amber-600" />
                                    Job Posting Locked
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Subscription & Pending Posts Smart Alert Banner (Primary Recruiter) */}
                    {!userAccess.isSubRecruiter && pendingJobs > 0 && (
                        <div className={`mt-4 p-4 rounded-2xl border-1 transition-all shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3.5 ${subscription.active_limit_reached
                            ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                            : 'bg-blue-50/80 border-blue-200 text-blue-950'
                            }`}>
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${subscription.active_limit_reached ? 'bg-amber-200/90 text-amber-800' : 'bg-blue-100 text-[#0A66C2]'
                                    }`}>
                                    {subscription.active_limit_reached ? <AlertTriangle size={19} /> : <Clock size={19} />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h4 className="font-bold text-sm text-slate-900 mb-0">
                                            {pendingJobs} Job Post{pendingJobs > 1 ? 's' : ''} Pending Superadmin Approval
                                        </h4>
                                        <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${subscription.active_limit_reached ? 'bg-amber-200 text-amber-900' : 'bg-blue-100 text-[#0A66C2]'
                                            }`}>
                                            {subscription.plan_name} Plan ({activeJobs}/{subscription.active_job_limit} Active Slots)
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-600 mt-1 mb-0 leading-relaxed font-medium">
                                        {subscription.active_limit_reached
                                            ? `Your plan active limit (${subscription.active_job_limit} slots) is reached. The Superadmin cannot approve your pending job until an active job is closed/expired or your plan is upgraded.`
                                            : `Your pending job post is undergoing Superadmin quality review. You have ${subscription.active_jobs_remaining} active job slot(s) available for immediate activation upon approval.`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                                {subscription.active_limit_reached && (
                                    <Link
                                        href="/billing"
                                        className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium transition-all shadow-2xs"
                                    >
                                        Upgrade Plan
                                    </Link>
                                )}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setJobStatusFilter('pending');
                                        scrollToSection('my-jobs');
                                    }}
                                    className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all shadow-2xs border cursor-pointer ${subscription.active_limit_reached
                                        ? 'bg-white hover:bg-amber-100/70 border-amber-300 text-amber-900'
                                        : 'bg-[#0A66C2] hover:bg-[#004182] text-white border-transparent'
                                        }`}
                                >
                                    Filter Pending Jobs
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ================= MAIN LAYOUT: SIDEBAR + CONTENT ================= */}
                <div className="flex flex-col lg:flex-row gap-7 items-start">

                    {/* ================= LEFT SIDEBAR (STICKY ANCHOR NAV) ================= */}
                    <aside className="w-full lg:w-[270px] flex-shrink-0 lg:sticky lg:top-24 space-y-5">

                        {/* Quick Navigation Menu */}
                        <nav className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-2.5 space-y-1">
                            <div className="px-3 pt-2 pb-1.5 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                Workspace Sections
                            </div>

                            {[
                                { id: 'your-searches', label: 'Your Searches', icon: Search, badge: recentSearches.length + savedSearches.length, show: userAccess.permissions.can_view_resumes !== false },
                                {
                                    id: 'my-jobs',
                                    label: 'My Jobs',
                                    icon: Briefcase,
                                    badge: totalJobs,
                                    activeCount: activeJobs,
                                    pendingCount: pendingJobs,
                                    show: userAccess.permissions.can_post_jobs !== false
                                },
                                { id: 'my-campaigns', label: 'My Campaigns', icon: Megaphone, badge: campaignsList.length, show: !userAccess.isSubRecruiter || userAccess.permissions.can_contact_candidates !== false },
                                { id: 'credits-breakdown', label: userAccess.isSubRecruiter ? 'Assigned Quota' : 'Credits Breakdown', icon: CreditCard, badge: userAccess.isSubRecruiter ? 'Split' : `${profilePercent}%`, show: true },
                                { id: 'downloads', label: 'Downloads & Folders', icon: Download, badge: downloads.totalFolders || null, show: userAccess.permissions.can_download_resumes !== false },
                            ].filter(item => item.show !== false).map((item) => {
                                const Icon = item.icon;
                                const isActive = activeNav === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => scrollToSection(item.id)}
                                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13.5px] font-semibold transition-all text-left cursor-pointer ${isActive
                                            ? 'bg-blue-50 text-[#0A66C2] border-l-4 border-[#0A66C2] shadow-2xs'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon
                                                size={17}
                                                className={isActive ? 'text-[#0A66C2] stroke-[2.3]' : 'text-slate-400'}
                                            />
                                            <span>{item.label}</span>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            {item.id === 'my-jobs' && item.pendingCount > 0 && (
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-850 border border-amber-300">
                                                    {item.pendingCount} pend
                                                </span>
                                            )}
                                            {item.badge !== null && item.badge !== undefined && (
                                                <span
                                                    className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${isActive
                                                        ? 'bg-[#0A66C2] text-white'
                                                        : 'bg-slate-100 text-slate-600'
                                                        }`}
                                                >
                                                    {item.badge}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </nav>

                        {/* AI Voice Search Promo Banner (CareerFast Corporate Navy & Orange Theme) */}
                        <div className="rounded-2xl p-4 bg-gradient-to-b from-[#0A2540] via-[#081F36] to-[#001428] text-white shadow-md relative overflow-hidden border border-slate-700/60">
                            {/* Glowing decorative background aura */}
                            <div className="absolute -top-10 -right-10 w-28 h-28 bg-[#0A66C2]/25 rounded-full blur-2xl pointer-events-none" />
                            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-[#FB6202]/20 rounded-full blur-2xl pointer-events-none" />

                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-white text-[10px] font-semibold tracking-wide uppercase backdrop-blur-xs mb-3 border border-white/10">
                                <Sparkles size={11} className="text-[#FB6202] fill-[#FB6202]" />
                                <span>Now in 20 Languages</span>
                            </div>

                            <div className="text-[10px] uppercase font-bold tracking-widest text-blue-300 mb-1">
                                CAREERFAST AI • VOICE SEARCH
                            </div>

                            <h2 className="text-[16px] font-semibold leading-snug tracking-tight mb-2 text-white">
                                Think Naturally.<br />Search Intelligently.
                            </h2>

                            <p className="text-[11px] text-slate-300 leading-relaxed mb-3.5">
                                Speak your requirements in Hindi, Tamil, Telugu, or English. AI automatically extracts job titles, skills, and experience.
                            </p>

                            {/* Animated Audio Waveform Graphic in brand blue & orange */}
                            <div className="flex items-center justify-between gap-1 h-8 px-3 py-1 bg-white/5 rounded-xl border border-white/10 mb-4">
                                {[10, 22, 16, 28, 14, 24, 30, 12, 26, 18, 28, 20, 14, 26, 12, 22, 16].map((h, i) => (
                                    <span
                                        key={i}
                                        className="w-1 bg-gradient-to-t from-[#0A66C2] via-blue-400 to-[#FB6202] rounded-full animate-pulse"
                                        style={{
                                            height: `${h}px`,
                                            animationDelay: `${(i % 5) * 0.16}s`,
                                            animationDuration: '1.2s'
                                        }}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={() => setDemoModalOpen(true)}
                                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium border border-white/15 transition-all cursor-pointer group shadow-2xs active:scale-98"
                            >
                                <span>Watch interactive demo</span>
                                <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        </div>

                        {/* Fast Quick Links Card */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3">
                            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
                                Recruiter Quick Links
                            </span>
                            <div className="space-y-2 text-xs">
                                <Link
                                    href="/candidate-search"
                                    className="flex items-center justify-between text-slate-700 hover:text-[#0A66C2] font-semibold p-2 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    <span className="flex items-center gap-2">
                                        <Search size={14} className="text-[#0A66C2]" /> Advanced Search
                                    </span>
                                    <ArrowRight size={12} className="text-slate-400" />
                                </Link>
                                <Link
                                    href="/my-jobs"
                                    className="flex items-center justify-between text-slate-700 hover:text-[#0A66C2] font-semibold p-2 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    <span className="flex items-center gap-2">
                                        <Briefcase size={14} className="text-[#0A66C2]" /> Job Management
                                    </span>
                                    <ArrowRight size={12} className="text-slate-400" />
                                </Link>
                                <Link
                                    href="/manage-folder"
                                    className="flex items-center justify-between text-slate-700 hover:text-[#0A66C2] font-semibold p-2 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    <span className="flex items-center gap-2">
                                        <Folder size={14} className="text-[#0A66C2]" /> Saved Resumes
                                    </span>
                                    <ArrowRight size={12} className="text-slate-400" />
                                </Link>
                            </div>
                        </div>

                    </aside>

                    {/* ================= RIGHT MAIN CONTENT SECTIONS ================= */}
                    <main className="flex-1 w-full space-y-6">

                        {/* ================= SECTION 1: YOUR SEARCHES ================= */}
                        <section
                            id="your-searches"
                            className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 transition-shadow hover:shadow-sm"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0A66C2] flex items-center justify-center border border-blue-200/60 shadow-2xs">
                                        <Search size={17} strokeWidth={2.4} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg mb-0 font-semibold text-slate-900">
                                            Your Searches
                                        </h2>
                                    </div>
                                </div>

                                {/* Segmented Recent / Saved Toggle */}
                                <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200/70 text-xs font-semibold">
                                    <button
                                        onClick={() => setSearchTab('recent')}
                                        className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${searchTab === 'recent'
                                            ? 'bg-white text-[#0A66C2] font-bold shadow-2xs border border-slate-200/50'
                                            : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                    >
                                        Recent ({recentSearches.length})
                                    </button>
                                    <button
                                        onClick={() => setSearchTab('saved')}
                                        className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${searchTab === 'saved'
                                            ? 'bg-white text-[#0A66C2] font-bold shadow-2xs border border-slate-200/50'
                                            : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                    >
                                        Saved ({savedSearches.length})
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0">
                                        {searchTab === 'recent' ? 'Continue Your Recent Candidate Searches' : 'Your Saved Search Queries'}
                                    </p>
                                    <div className="flex items-center gap-3">
                                        {searchTab === 'recent' && recentSearches.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={handleClearAllRecent}
                                                className="text-[11.5px] font-semibold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                                title="Clear all recent searches"
                                            >
                                                Clear all
                                            </button>
                                        )}
                                        <Link
                                            href="/candidate-search"
                                            className="text-xs font-bold text-[#0A66C2] hover:text-[#004182] flex items-center gap-1 cursor-pointer"
                                        >
                                            <span>New Search</span>
                                            <Plus size={13} />
                                        </Link>
                                    </div>
                                </div>

                                {loading ? (
                                    <div className="py-9 flex items-center justify-center gap-2.5 text-slate-400 text-sm">
                                        <Loader2 size={20} className="animate-spin text-[#0A66C2]" />
                                        <span className="font-medium">Loading searches...</span>
                                    </div>
                                ) : activeSearchesList.length === 0 ? (
                                    <div className="py-8 px-4 text-center rounded-xl bg-slate-50/70 border border-dashed border-slate-200">
                                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0A66C2] flex items-center justify-center mx-auto mb-2.5 border border-blue-100">
                                            {searchTab === 'recent' ? (
                                                <Clock size={22} strokeWidth={2.2} />
                                            ) : (
                                                <Bookmark size={22} strokeWidth={2.2} />
                                            )}
                                        </div>
                                        <p className="text-sm font-bold text-slate-800">No {searchTab} searches found</p>
                                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                                            {searchTab === 'recent'
                                                ? 'Searches you perform in Candidate Search will appear here automatically.'
                                                : 'Saved presets and searches from Candidate Search will appear here for 1-click re-runs.'}
                                        </p>

                                        <div className="mt-3">
                                            <Link
                                                href="/candidate-search"
                                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0A66C2] hover:bg-[#004182] text-white text-sm font-medium rounded-xl transition-all shadow-xs cursor-pointer"
                                            >
                                                <Search size={13} />
                                                <span>Go to Candidate Search</span>
                                            </Link>
                                        </div>

                                        {/* Quick Query Starter Pills */}
                                        <div className="mt-4 pt-3 border-t border-slate-200/70">
                                            <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                                                Or start with popular talent searches:
                                            </span>
                                            <div className="flex flex-wrap items-center justify-center gap-2">
                                                {POPULAR_QUICK_SEARCHES.map((keyword) => (
                                                    <button
                                                        key={keyword}
                                                        onClick={() => handleQuickKeywordClick(keyword)}
                                                        className="px-3 py-1 rounded-full bg-white hover:bg-blue-50 text-slate-700 hover:text-[#0A66C2] text-xs font-semibold border border-slate-200/80 hover:border-blue-200 transition-all cursor-pointer shadow-2xs"
                                                    >
                                                        + {keyword}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100 max-h-[320px] overflow-y-auto pr-1">
                                        {activeSearchesList.map((item) => (
                                            <div
                                                key={item.id}
                                                onClick={() => handleExecuteSearch(item)}
                                                className="group flex items-center justify-between py-3 px-3 rounded-xl hover:bg-blue-50/50 cursor-pointer transition-all border border-transparent hover:border-blue-100/80 mb-2"
                                            >
                                                <div className="flex items-center gap-3.5 min-w-0 pr-3">
                                                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-[#0A66C2] flex items-center justify-center flex-shrink-0 transition-colors">
                                                        {searchTab === 'recent' ? <Search size={16} /> : <Bookmark size={16} />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="text-sm text-slate-800 font-semibold group-hover:text-[#0A66C2] transition-colors truncate block">
                                                            {item.title || item.name || item.query_title}
                                                        </span>
                                                        <span className="text-[11px] text-slate-400 block mt-0.5 font-medium">
                                                            {item.timestamp ||
                                                                (item.created_at
                                                                    ? new Date(item.created_at).toLocaleDateString('en-US', {
                                                                        month: 'short',
                                                                        day: 'numeric'
                                                                    })
                                                                    : 'Recent')}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleDeleteSearchItem(item, searchTab, e)}
                                                        className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                        title="Delete search"
                                                        aria-label="Delete"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                    <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-[#0A66C2] text-xs font-bold transition-colors">
                                                        <span className="hidden sm:inline text-[11px] text-slate-400 group-hover:text-[#0A66C2]">
                                                            Search again
                                                        </span>
                                                        <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-[#0A66C2] group-hover:text-white flex items-center justify-center transition-all shadow-2xs">
                                                            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* ================= SECTION 2: MY JOBS ================= */}
                        <section
                            id="my-jobs"
                            className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 transition-shadow hover:shadow-sm"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0A66C2] flex items-center justify-center border border-blue-200/60 shadow-2xs">
                                        <Briefcase size={17} strokeWidth={2.4} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-900 mb-0">
                                            My Jobs
                                        </h2>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2.5 flex-wrap">
                                    {/* Status Filter Segmented Tabs */}
                                    <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200/70 text-xs font-semibold">
                                        <button
                                            type="button"
                                            onClick={() => setJobStatusFilter('all')}
                                            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${jobStatusFilter === 'all'
                                                ? 'bg-white text-[#0A66C2] font-bold shadow-2xs border border-slate-200/50'
                                                : 'text-slate-600 hover:text-slate-900'
                                                }`}
                                        >
                                            All ({totalJobs})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setJobStatusFilter('active')}
                                            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${jobStatusFilter === 'active'
                                                ? 'bg-white text-emerald-700 font-bold shadow-2xs border border-slate-200/50'
                                                : 'text-slate-600 hover:text-slate-900'
                                                }`}
                                        >
                                            Active ({activeJobs})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setJobStatusFilter('pending')}
                                            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${jobStatusFilter === 'pending'
                                                ? 'bg-amber-100 text-amber-900 font-bold shadow-2xs border border-amber-300'
                                                : 'text-slate-600 hover:text-amber-800'
                                                }`}
                                        >
                                            Pending ({pendingJobs})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setJobStatusFilter('closed')}
                                            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${jobStatusFilter === 'closed'
                                                ? 'bg-white text-slate-800 font-bold shadow-2xs border border-slate-200/50'
                                                : 'text-slate-600 hover:text-slate-900'
                                                }`}
                                        >
                                            Closed ({closedJobs})
                                        </button>
                                    </div>

                                    {totalJobs > 0 && (
                                        <Link
                                            href="/my-jobs"
                                            className="text-xs font-bold text-[#0A66C2] hover:text-[#004182] hover:underline flex items-center gap-1 cursor-pointer ml-1"
                                        >
                                            Full List <ArrowRight size={12} />
                                        </Link>
                                    )}

                                    {userAccess.permissions.can_post_jobs !== false && (
                                        isPostingRestricted ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    alert(subscription.limit_reason || "Job posting is locked because the company's plan limits are reached. All active job slots or monthly posts are in use.");
                                                }}
                                                title={subscription.limit_reason || "Company job posting limit reached"}
                                                className="px-3.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200/90 text-slate-400 font-semibold text-xs inline-flex items-center gap-1.5 cursor-not-allowed shadow-2xs ml-auto sm:ml-0"
                                            >
                                                <Lock size={13} className="text-slate-400" />
                                                <span>Post a Job (Quota Full)</span>
                                            </button>
                                        ) : (
                                            <Link
                                                href="/post-job"
                                                className="px-3.5 py-1.5 rounded-xl bg-[#0A66C2] hover:bg-[#004182] text-white text-xs font-medium shadow-2xs hover:shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer ml-auto sm:ml-0"
                                            >
                                                <Plus size={14} />
                                                Post a Job
                                            </Link>
                                        )
                                    )}
                                </div>
                            </div>

                            <div className="mt-4">
                                {/* Subscription & Quota Status Bar */}
                                <div className="p-3 rounded-xl bg-gradient-to-r from-slate-50 via-blue-50/20 to-slate-50 border border-slate-200/80 mb-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                                    <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                                        <span className="flex items-center gap-1.5 font-bold text-slate-800">
                                            <Crown size={14} className="text-amber-600" />
                                            <span>{userAccess.isSubRecruiter ? `Assigned Role: ${userAccess.designation || 'Recruiter'}` : `${subscription.plan_name} Plan`}</span>
                                        </span>
                                        <span className="text-slate-300 hidden sm:inline">•</span>
                                        <span className="flex items-center gap-1.5">
                                            <span className="text-slate-500 font-medium">Active Slots:</span>
                                            <strong className={`font-bold ${isPostingRestricted || subscription.active_limit_reached ? 'text-amber-700' : 'text-emerald-700'}`}>
                                                {activeJobs} / {userAccess.quota.allocated_job_posts ?? subscription.active_job_limit}
                                            </strong>
                                            <span className="text-[11px] text-slate-500 font-medium">
                                                ({isPostingRestricted || subscription.active_limit_reached ? (userAccess.isSubRecruiter ? '0 available (Plan Full)' : '0 available') : `${subscription.active_jobs_remaining} free`})
                                            </span>
                                        </span>
                                        <span className="text-slate-300 hidden sm:inline">•</span>
                                        <span className="flex items-center gap-1.5">
                                            <span className="text-slate-500 font-medium">Pending Review:</span>
                                            <strong className={`font-bold ${pendingJobs > 0 ? 'text-amber-700' : 'text-slate-700'}`}>
                                                {pendingJobs}
                                            </strong>
                                        </span>
                                        <span className="text-slate-300 hidden sm:inline">•</span>
                                        <span className="flex items-center gap-1.5">
                                            <span className="text-slate-500 font-medium">Job Posts Limit:</span>
                                            <strong className="font-bold text-slate-700">
                                                {userAccess.quota.used_job_posts || subscription.job_posts_used || 0} / {userAccess.quota.allocated_job_posts ?? subscription.job_post_limit}
                                            </strong>
                                        </span>
                                    </div>
                                    {!userAccess.isSubRecruiter && (
                                        <Link href="/billing" className="text-xs font-bold text-[#0A66C2] hover:underline flex items-center gap-1 cursor-pointer">
                                            Manage Quota & Limits <ArrowRight size={12} />
                                        </Link>
                                    )}
                                </div>

                                {filteredJobsList.length > 0 ? (
                                    <div>
                                        {/* Unified Neat Accordion Container */}
                                        <div className="rounded-2xl border border-slate-200/90 overflow-hidden divide-y divide-slate-100 bg-white shadow-2xs">
                                            {filteredJobsList.map((job, index) => {
                                                const isExpanded = expandedJobId === job.id;
                                                const candidates = Array.isArray(job.applicants) ? job.applicants : [];
                                                const viewsCount = Number(job.views_count || 0);
                                                const applicationsCount = Number(job.applications_count !== undefined ? job.applications_count : candidates.length);
                                                const viewsBarPercent = viewsCount > 0 ? Math.min(100, Math.round((viewsCount / 100) * 100)) : 0;
                                                const appsBarPercent = applicationsCount > 0 ? Math.min(100, Math.round((applicationsCount / Math.max(1, viewsCount)) * 100)) : 0;
                                                const isClosed = job.is_closed?.data ? job.is_closed.data[0] === 1 : job.is_closed === 1;
                                                const isPending = !isClosed && (job.approval_status === 'pending' || !job.approval_status);
                                                const isRejected = !isClosed && job.approval_status === 'rejected';
                                                const isApproved = !isClosed && job.approval_status === 'approved';

                                                return (
                                                    <div key={job.id} className="transition-colors">
                                                        {/* Accordion Row Header */}
                                                        <div
                                                            onClick={() => setExpandedJobId(prev => (prev === job.id ? null : job.id))}
                                                            className={`flex items-center justify-between px-3 sm:px-4 py-3 cursor-pointer select-none transition-all ${isExpanded ? 'bg-blue-50/25' : 'hover:bg-slate-50/70'
                                                                }`}
                                                        >
                                                            {/* Left: Indicator, Title, Badge, Date */}
                                                            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-3">
                                                                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isClosed
                                                                    ? 'bg-slate-300'
                                                                    : isPending
                                                                        ? 'bg-amber-500 animate-pulse'
                                                                        : isRejected
                                                                            ? 'bg-rose-500'
                                                                            : 'bg-emerald-500 animate-pulse'
                                                                    }`} />
                                                                <h3 className="text-sm sm:text-[15px] font-semibold text-slate-900 truncate mb-0 hover:text-[#0A66C2] transition-colors">
                                                                    {job.job_title}
                                                                </h3>

                                                                {/* Status Badge */}
                                                                {isClosed && (
                                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center shrink-0 bg-slate-100 text-slate-600">
                                                                        Closed
                                                                    </span>
                                                                )}
                                                                {isPending && (
                                                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0 bg-amber-100 text-amber-900 border-1 border-amber-300">
                                                                        <Clock size={10} /> Pending Approval
                                                                    </span>
                                                                )}
                                                                {isRejected && (
                                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center shrink-0 bg-rose-100 text-rose-800 border-1 border-rose-300">
                                                                        Rejected
                                                                    </span>
                                                                )}
                                                                {isApproved && (
                                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center shrink-0 bg-emerald-50 text-emerald-700">
                                                                        Active
                                                                    </span>
                                                                )}

                                                                {isPending && (
                                                                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md border-1 hidden md:inline-flex items-center gap-1 ${subscription.active_limit_reached
                                                                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                                                                        : 'bg-amber-50 text-amber-800 border-amber-200'
                                                                        }`}>
                                                                        {subscription.active_limit_reached ? 'Quota full: Needs active slot' : 'Awaiting admin review'}
                                                                    </span>
                                                                )}

                                                                <span className="text-xs text-slate-400 font-normal shrink-0 hidden md:inline">
                                                                    {formatJobCreatedDate(job.created_at)}
                                                                </span>
                                                            </div>

                                                            {/* Right: Applicants badge, Action Links, Chevron */}
                                                            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                                                                <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100/90 text-slate-600">
                                                                    <Users size={13} className="text-[#0A66C2]" />
                                                                    <span>{applicationsCount} {applicationsCount === 1 ? 'Applicant' : 'Applicants'}</span>
                                                                </span>
                                                                <Link
                                                                    href={`/applicants/${job.id}`}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="text-xs font-bold text-[#0A66C2] hover:text-[#004182] flex items-center gap-1.5 transition-colors cursor-pointer"
                                                                >
                                                                    <Eye size={14} />
                                                                    <span className="hidden sm:inline">View applications</span>
                                                                    <span className="sm:hidden">View</span>
                                                                </Link>
                                                                <Link
                                                                    href={`/edit-job/${job.id}`}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="text-xs font-semibold text-slate-600 hover:text-[#0A66C2] transition-colors cursor-pointer hidden sm:inline"
                                                                >
                                                                    Manage job
                                                                </Link>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setExpandedJobId(prev => (prev === job.id ? null : job.id));
                                                                    }}
                                                                    className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-blue-100 hover:text-[#0A66C2] text-slate-500 flex items-center justify-center transition-all cursor-pointer"
                                                                    aria-label={isExpanded ? 'Collapse job' : 'Expand job'}
                                                                >
                                                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Expanded Accordion Body */}
                                                        {isExpanded && (
                                                            <div className="px-4 pb-5 pt-2 sm:px-5 bg-[#FAFBFD] border-t border-slate-100/80">
                                                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 mt-2">

                                                                    {/* Left Column: Candidate Applicants */}
                                                                    <div className="lg:col-span-7">
                                                                        {candidates.length > 0 ? (
                                                                            <div className="max-h-[290px] overflow-y-auto space-y-2.5 pr-1.5 custom-scrollbar">
                                                                                {candidates.map((cand, cIdx) => (
                                                                                    <div
                                                                                        key={cand.id || cIdx}
                                                                                        className="bg-white rounded-xl p-3.5 border border-slate-200/80 hover:border-blue-300 hover:shadow-xs transition-all"
                                                                                    >
                                                                                        <div className="flex items-start justify-between gap-3">
                                                                                            <div className="min-w-0 flex-1">
                                                                                                <h4 className="text-sm font-bold text-slate-900 truncate mb-0">
                                                                                                    {cand.name}
                                                                                                </h4>
                                                                                                <p className="text-xs font-semibold text-slate-500 mt-0.5 mb-0 truncate flex items-center gap-1.5">
                                                                                                    <span>{cand.designation || cand.tag?.split('|')[0]?.trim() || 'Applicant'}</span>
                                                                                                    <span className="text-slate-300">|</span>
                                                                                                    <span className="font-bold text-[#0A66C2] tracking-wide uppercase">
                                                                                                        {cand.company || cand.tag?.split('|')[1]?.trim() || 'ORGANIC'}
                                                                                                    </span>
                                                                                                </p>
                                                                                            </div>

                                                                                            {/* Candidate Avatar */}
                                                                                            <div className="shrink-0">
                                                                                                {cand.profile_image ? (
                                                                                                    <img
                                                                                                        src={cand.profile_image}
                                                                                                        alt={cand.name}
                                                                                                        className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                                                                                                        onError={(e) => {
                                                                                                            e.target.style.display = 'none';
                                                                                                            if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                                                                                                        }}
                                                                                                    />
                                                                                                ) : null}
                                                                                                <div
                                                                                                    className="w-10 h-10 rounded-lg bg-blue-50 text-[#0A66C2] font-bold text-xs flex items-center justify-center border border-blue-200/60"
                                                                                                    style={{ display: cand.profile_image ? 'none' : 'flex' }}
                                                                                                >
                                                                                                    {getCandidateInitials(cand.name)}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>

                                                                                        {/* Metadata line */}
                                                                                        <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 font-medium">
                                                                                            <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-slate-600">
                                                                                                {cand.salary && (
                                                                                                    <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                                                                                                        <CreditCard size={12} className="text-[#0A66C2]" />
                                                                                                        <span>{cand.salary}</span>
                                                                                                    </span>
                                                                                                )}
                                                                                                {cand.experience && (
                                                                                                    <span className="inline-flex items-center gap-1">
                                                                                                        <Briefcase size={12} className="text-slate-400" />
                                                                                                        <span>{cand.experience}</span>
                                                                                                    </span>
                                                                                                )}
                                                                                                {cand.location && (
                                                                                                    <span className="inline-flex items-center gap-1 truncate max-w-[140px]">
                                                                                                        <MapPin size={12} className="text-slate-400 shrink-0" />
                                                                                                        <span className="truncate">{cand.location}</span>
                                                                                                    </span>
                                                                                                )}
                                                                                            </div>

                                                                                            <span className="text-[11px] text-slate-400 font-medium shrink-0 ml-2">
                                                                                                {cand.applied_date ? (
                                                                                                    cand.applied_date.startsWith('Applied:')
                                                                                                        ? cand.applied_date
                                                                                                        : `Applied: ${new Date(cand.applied_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`
                                                                                                ) : 'Applied: Recently'}
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        ) : (
                                                                            <div className="h-full min-h-[240px] flex flex-col items-center justify-center p-6 text-center bg-white rounded-xl border border-dashed border-slate-200">
                                                                                <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#0A66C2] flex items-center justify-center mb-2.5 border border-blue-100">
                                                                                    <Users size={20} />
                                                                                </div>
                                                                                <p className="text-sm font-bold text-slate-800 mb-0.5">0 Applications</p>
                                                                                <p className="text-xs text-slate-500 max-w-xs mb-3">
                                                                                    No candidate applications received yet for this role. Real-time applicant submissions will appear here.
                                                                                </p>
                                                                                <Link
                                                                                    href="/candidate-search"
                                                                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0A66C2] hover:bg-[#004182] text-white text-xs font-medium transition-all shadow-xs cursor-pointer"
                                                                                >
                                                                                    <Search size={13} />
                                                                                    <span>Search Matching Candidates</span>
                                                                                </Link>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Right Column: Two Sleek Metric Cards */}
                                                                    <div className="lg:col-span-5 grid grid-cols-2 gap-3.5 h-[240px]">
                                                                        {/* 1. Job viewed Card */}
                                                                        <div className="rounded-2xl bg-white border border-slate-200/80 p-3 flex flex-col justify-between shadow-2xs relative overflow-hidden">
                                                                            <div>
                                                                                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0A66C2] flex items-center justify-center border border-blue-100 mb-2">
                                                                                    <Eye size={16} strokeWidth={2.4} />
                                                                                </div>
                                                                                <span className="text-xs font-semibold text-slate-500 block">
                                                                                    Job viewed
                                                                                </span>
                                                                                <span className="text-3xl font-semibold text-slate-900 tracking-tight block mt-0.5">
                                                                                    {viewsCount}
                                                                                </span>
                                                                            </div>

                                                                            <div className="pt-3 border-t border-slate-100">
                                                                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                                                                    <div
                                                                                        className="h-full bg-gradient-to-r from-blue-400 to-[#0A66C2] rounded-full transition-all duration-500"
                                                                                        style={{ width: `${Math.max(viewsCount > 0 ? 20 : 0, Math.min(100, viewsBarPercent))}%` }}
                                                                                    />
                                                                                </div>
                                                                                <span className="text-[10.5px] font-medium text-slate-400 mt-1.5 block">
                                                                                    {viewsCount > 0 ? `${viewsCount} total impressions` : 'Awaiting views'}
                                                                                </span>
                                                                            </div>
                                                                        </div>

                                                                        {/* 2. Total applications Card */}
                                                                        <div className="rounded-2xl bg-white border border-slate-200/80 p-4 flex flex-col justify-between shadow-2xs relative overflow-hidden">
                                                                            <div>
                                                                                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 mb-2">
                                                                                    <Users size={16} strokeWidth={2.4} />
                                                                                </div>
                                                                                <span className="text-xs font-semibold text-slate-500 block">
                                                                                    Total applications
                                                                                </span>
                                                                                <span className="text-3xl font-black text-slate-900 tracking-tight block mt-0.5">
                                                                                    {applicationsCount}
                                                                                </span>
                                                                            </div>

                                                                            <div className="pt-3 border-t border-slate-100">
                                                                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                                                                    <div
                                                                                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
                                                                                        style={{ width: `${Math.max(applicationsCount > 0 ? 25 : 0, Math.min(100, appsBarPercent))}%` }}
                                                                                    />
                                                                                </div>
                                                                                <span className="text-[10.5px] font-medium text-slate-400 mt-1.5 block">
                                                                                    {applicationsCount > 0
                                                                                        ? `${applicationsCount} submitted (${Math.round((applicationsCount / (viewsCount || 1)) * 100)}% rate)`
                                                                                        : '0% applicant rate'}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Footer */}
                                        <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-100">
                                            <span className="text-xs text-slate-400 font-medium">
                                                Showing {filteredJobsList.length} of {totalJobs} total jobs {jobStatusFilter !== 'all' ? `(${jobStatusFilter})` : ''}
                                            </span>
                                            <div className="flex items-center gap-3">
                                                <Link
                                                    href="/my-jobs"
                                                    className="text-xs font-bold text-[#0A66C2] hover:text-[#004182] hover:underline cursor-pointer"
                                                >
                                                    View all jobs
                                                </Link>
                                                {isPostingRestricted ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            alert(subscription.limit_reason || "Job posting is locked because the company's plan limits are reached. All active job slots or monthly posts are in use.");
                                                        }}
                                                        title={subscription.limit_reason || "Company job posting limit reached"}
                                                        className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200/90 text-slate-400 font-semibold text-xs inline-flex items-center gap-1.5 cursor-not-allowed shadow-2xs"
                                                    >
                                                        <Lock size={13} className="text-slate-400" />
                                                        <span>Post a Job (Quota Full)</span>
                                                    </button>
                                                ) : (
                                                    <Link
                                                        href="/post-job"
                                                        className="px-4 py-2 rounded-xl bg-[#0A66C2] hover:bg-[#004182] text-white text-xs font-medium shadow-2xs hover:shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                                                    >
                                                        <Plus size={14} />
                                                        Post a Job
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : totalJobs > 0 ? (
                                    /* Filtered empty state */
                                    <div className="py-8 px-4 text-center rounded-xl bg-slate-50/70 border border-dashed border-slate-200">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-2">
                                            <Briefcase size={20} />
                                        </div>
                                        <p className="text-sm font-bold text-slate-800">No {jobStatusFilter} jobs found</p>
                                        <p className="text-xs text-slate-500 mt-0.5">There are no job postings currently under the &apos;{jobStatusFilter}&apos; filter.</p>
                                        <button
                                            type="button"
                                            onClick={() => setJobStatusFilter('all')}
                                            className="mt-3 px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-300 text-xs font-semibold text-[#0A66C2] transition-all cursor-pointer shadow-2xs"
                                        >
                                            Show All Jobs ({totalJobs})
                                        </button>
                                    </div>
                                ) : (
                                    /* Zero-job state: Start Hiring Smarter Today */
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center p-2">
                                        <div className="lg:col-span-6 space-y-4">
                                            <div>
                                                <span className="text-[11px] font-bold text-[#FB6202] uppercase tracking-wider">Fast-track hiring</span>
                                                <h3 className="text-xl font-semibold mb-0 text-slate-900 tracking-tight mt-0.5">
                                                    Start Hiring Smarter Today
                                                </h3>
                                            </div>

                                            <ul className="space-y-2.5">
                                                <li className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700">
                                                    <CheckCircle2 size={17} className="text-[#0A66C2] flex-shrink-0" />
                                                    <span>Attract the right talent quickly for your requirements</span>
                                                </li>
                                                <li className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700">
                                                    <CheckCircle2 size={17} className="text-[#0A66C2] flex-shrink-0" />
                                                    <span>Unlock Candidate Insights & Automated Match Analytics</span>
                                                </li>
                                                <li className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700">
                                                    <CheckCircle2 size={17} className="text-[#0A66C2] flex-shrink-0" />
                                                    <span>Manage Your Entire Hiring Pipeline from One Unified Dashboard</span>
                                                </li>
                                            </ul>

                                            <div className="pt-2">
                                                {isPostingRestricted ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            alert(subscription.limit_reason || "Job posting is locked because the company's plan limits are reached. All active job slots or monthly posts are in use.");
                                                        }}
                                                        title={subscription.limit_reason || "Company job posting limit reached"}
                                                        className="px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200/90 text-slate-400 text-xs sm:text-sm font-semibold transition-all inline-flex items-center gap-2 cursor-not-allowed shadow-2xs"
                                                    >
                                                        <Lock size={15} strokeWidth={2.4} />
                                                        Post Job (Plan Quota Full)
                                                    </button>
                                                ) : (
                                                    <Link
                                                        href="/post-job"
                                                        className="px-4 py-2.5 rounded-xl bg-[#6b21a8] hover:bg-[#581c87] text-white text-xs sm:text-sm font-medium shadow-md shadow-purple-500/25 transition-all inline-flex items-center gap-2 cursor-pointer active:scale-98"
                                                    >
                                                        <Plus size={15} strokeWidth={2.4} />
                                                        Post Your First Job
                                                    </Link>
                                                )}
                                            </div>
                                        </div>

                                        {/* Preview Candidate Mockup Card */}
                                        <div className="lg:col-span-6 flex justify-center">
                                            <div className="w-full max-w-sm p-3 rounded-2xl bg-white border border-slate-200/ relative overflow-hidden">
                                                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-extrabold flex items-center justify-center text-sm shadow-2xs">
                                                            AS
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-1.5">
                                                                <h5 className="text-xs font-bold text-slate-900">Arpit Singh</h5>
                                                                <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">94% Match</span>
                                                            </div>
                                                            <p className="text-[11px] text-slate-500">Senior Solution Architect • TIS Global</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 font-medium">2 days ago</span>
                                                </div>
                                                <div className="flex items-center justify-between text-[11.5px] text-slate-600 pt-2.5 font-medium">
                                                    <span>₹18 Lac</span>
                                                    <span>Bangalore</span>
                                                    <span className="text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">Shortlisted</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* ================= SECTION 3: MY CAMPAIGNS ================= */}
                        <section
                            id="my-campaigns"
                            className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 transition-shadow hover:shadow-sm"
                        >
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0A66C2] flex items-center justify-center border border-blue-200/60 shadow-2xs">
                                        <Megaphone size={17} strokeWidth={2.4} />
                                    </div>
                                    <h2 className="text-lg font-semibold text-slate-900 mb-0">
                                        My Campaigns
                                    </h2>
                                </div>

                                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                                    {campaignsList.length} Total Tracks
                                </span>
                            </div>

                            <div className="mt-4 space-y-2.5">
                                {campaignsList.map((campaign) => {
                                    const isExpanded = expandedCampaigns[campaign.id];
                                    const isWhatsApp = campaign.channel === 'whatsapp';
                                    const isFinished = campaign.status === 'Finished';
                                    const isLive = campaign.status === 'Live';
                                    const hasResponses = campaign.responded_count > 0 || campaign.opened_count > 0;
                                    const responseRate = campaign.total_sent > 0
                                        ? Math.round((campaign.responded_count / campaign.total_sent) * 100)
                                        : 0;

                                    return (
                                        <div
                                            key={campaign.id}
                                            className="rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-white transition-all overflow-hidden"
                                        >
                                            <div
                                                onClick={() => toggleCampaignAccordion(campaign.id)}
                                                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-2xs ${isWhatsApp
                                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                                                            : 'bg-blue-50 text-[#0A66C2] border border-blue-200/60'
                                                            }`}
                                                    >
                                                        {isWhatsApp ? <MessageCircle size={16} /> : <Mail size={16} />}
                                                    </div>

                                                    <div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-sm font-bold text-slate-900 tracking-tight">
                                                                {campaign.title}
                                                            </span>

                                                            <span className="text-[11px] text-slate-400 font-normal">
                                                                Updated: {new Date(campaign.updated_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </span>

                                                            <span
                                                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${isLive
                                                                    ? 'bg-emerald-100/80 text-emerald-800'
                                                                    : isFinished
                                                                        ? 'bg-slate-100 text-slate-700'
                                                                        : 'bg-orange-50 text-[#FB6202] border border-orange-200/60'
                                                                    }`}
                                                            >
                                                                {isLive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                                                                {campaign.status}
                                                            </span>
                                                        </div>

                                                        <p className="text-xs text-slate-500 mt-1 font-medium mb-0">
                                                            {hasResponses ? (
                                                                <span>
                                                                    <strong className="text-slate-800 font-bold">{campaign.opened_count}</strong> Opened &nbsp;•&nbsp;{' '}
                                                                    <strong className="text-[#0A66C2] font-bold">{campaign.responded_count}</strong> Responded &nbsp;•&nbsp;{' '}
                                                                    <span className="text-emerald-700 font-bold">{responseRate}% Response Rate</span>
                                                                </span>
                                                            ) : (
                                                                'No responses received yet'
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 self-end sm:self-center">
                                                    {hasResponses && (
                                                        <span className="text-xs font-bold text-[#0A66C2] hover:text-[#004182] flex items-center gap-1">
                                                            <Eye size={13} />
                                                            View responses
                                                        </span>
                                                    )}
                                                    <div className="text-slate-400">
                                                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Accordion expanded details */}
                                            {isExpanded && (
                                                <div className="px-4 pb-4 pt-1 border-t border-slate-100 bg-white text-xs text-slate-600">
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                                                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Channel</span>
                                                            <span className="font-bold text-slate-900 capitalize mt-0.5 block">{campaign.channel}</span>
                                                        </div>
                                                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Total Sent</span>
                                                            <span className="font-bold text-slate-900 mt-0.5 block">{campaign.total_sent || 0}</span>
                                                        </div>
                                                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Opened</span>
                                                            <span className="font-bold text-slate-900 mt-0.5 block">{campaign.opened_count || 0}</span>
                                                        </div>
                                                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Response Rate</span>
                                                            <span className="font-bold text-[#0A66C2] mt-0.5 block">
                                                                {responseRate}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                <div className="pt-3 flex justify-end">
                                    <Link
                                        href="/billing"
                                        className="px-4 py-2.5 rounded-xl bg-[#0A66C2] hover:bg-[#004182] text-white text-xs font-medium shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                                    >
                                        View all Campaigns
                                    </Link>
                                </div>
                            </div>
                        </section>

                        {/* ================= SECTION 4: CREDITS BREAKDOWN ================= */}
                        <section
                            id="credits-breakdown"
                            className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 transition-shadow hover:shadow-sm"
                        >
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0A66C2] flex items-center justify-center border border-blue-200/60 shadow-2xs">
                                        <CreditCard size={17} strokeWidth={2.4} />
                                    </div>
                                    <h2 className="text-lg font-semibold text-slate-900 mb-0">
                                        {userAccess.isSubRecruiter ? 'Assigned Quotas & Usage' : 'Credits Breakdown'}
                                    </h2>
                                </div>

                                {!userAccess.isSubRecruiter && userAccess.permissions.can_manage_billing !== false && (
                                    <Link
                                        href="/billing"
                                        className="text-xs font-bold text-[#FB6202] hover:text-[#e05500] hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                        <Plus size={13} />
                                        Buy credits
                                    </Link>
                                )}
                            </div>

                            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">

                                {/* CARD 1: Profile Usage (Primary Blue) */}
                                <div className="rounded-xl border border-slate-200 p-4.5 bg-slate-50/40 hover:bg-white transition-all flex flex-col justify-between shadow-2xs p-3">
                                    <div>
                                        <div className="flex items-center gap-3.5">
                                            {/* Circular percentage indicator */}
                                            <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
                                                <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                                                    <path
                                                        className="text-slate-200"
                                                        strokeWidth="3.2"
                                                        stroke="currentColor"
                                                        fill="none"
                                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                    />
                                                    <path
                                                        className="text-[#0A66C2]"
                                                        strokeDasharray={`${profilePercent}, 100`}
                                                        strokeWidth="3.2"
                                                        strokeLinecap="round"
                                                        stroke="currentColor"
                                                        fill="none"
                                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                    />
                                                </svg>
                                                <span className="absolute text-[11px] font-bold text-slate-900">
                                                    {profilePercent}%
                                                </span>
                                            </div>

                                            <div>
                                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
                                                    {userAccess.isSubRecruiter ? 'Assigned Account Pool' : 'Account Profile Usage'}
                                                </span>
                                                <span className="text-base font-semibold text-slate-900 tracking-tight">
                                                    {formatCompactNumber(credits.profile_usage_used)} / {formatCompactNumber(credits.profile_usage_total)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="pt-3 mt-3.5 border-t border-slate-200/70">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[11px] font-bold text-slate-500 uppercase">Recruiter Activity</span>
                                                {!userAccess.isSubRecruiter && (
                                                    <Link href="/billing" className="text-[11px] text-[#0A66C2] font-bold hover:underline cursor-pointer">
                                                        View Report
                                                    </Link>
                                                )}
                                            </div>

                                            <div className="space-y-2 text-xs text-slate-600">
                                                <div className="flex items-center justify-between">
                                                    <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                                                        <Users size={13} className="text-[#0A66C2]" />
                                                        Profile views
                                                    </span>
                                                    <span className="font-bold text-slate-900">
                                                        {formatCompactNumber(credits.profile_views)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                                                        <FileSpreadsheet size={13} className="text-[#0A66C2]" />
                                                        Excel downloads
                                                    </span>
                                                    <span className="font-bold text-slate-900">
                                                        {credits.excel_downloads || 0}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* CARD 2: Job Posting Usage (CareerFast Orange Accent) */}
                                <div className="rounded-xl border border-slate-200 p-4.5 bg-slate-50/40 hover:bg-white transition-all flex flex-col justify-between shadow-2xs p-3">
                                    <div>
                                        <div className="flex items-center gap-3.5">
                                            <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
                                                <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                                                    <path
                                                        className="text-slate-200"
                                                        strokeWidth="3.2"
                                                        stroke="currentColor"
                                                        fill="none"
                                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                    />
                                                    <path
                                                        className="text-[#FB6202]"
                                                        strokeDasharray={`${jobPostPercent}, 100`}
                                                        strokeWidth="3.2"
                                                        strokeLinecap="round"
                                                        stroke="currentColor"
                                                        fill="none"
                                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                    />
                                                </svg>
                                                <span className="absolute text-[11px] font-bold text-slate-900">
                                                    {jobPostPercent}%
                                                </span>
                                            </div>

                                            <div>
                                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
                                                    Job Posting Usage
                                                </span>
                                                <span className="text-base font-semibold text-slate-900 tracking-tight">
                                                    {credits.job_posting_used} / {credits.job_posting_total}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="pt-3 mt-3.5 border-t border-slate-200/70">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[11px] font-bold text-slate-500 uppercase">Recruiter Activity</span>
                                                <Link href="/my-jobs" className="text-[11px] text-[#0A66C2] font-bold hover:underline cursor-pointer">
                                                    View Report
                                                </Link>
                                            </div>

                                            <div className="space-y-2 text-xs text-slate-600">
                                                <div className="flex items-center justify-between">
                                                    <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                                                        <Briefcase size={13} className="text-emerald-600" />
                                                        Active Slots
                                                    </span>
                                                    <span className="font-bold text-slate-900">
                                                        {activeJobs} / {subscription.active_job_limit}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                                                        <Clock size={13} className="text-amber-600" />
                                                        Pending Approval
                                                    </span>
                                                    <span className={`font-bold ${pendingJobs > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
                                                        {pendingJobs}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                                                        <Crown size={13} className="text-[#FB6202]" />
                                                        Total Posts Used
                                                    </span>
                                                    <span className="font-bold text-slate-900">
                                                        {credits.job_posting_used || totalJobs} / {credits.job_posting_total || subscription.job_post_limit}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* CARD 3: Outreach Usage (Primary Blue) */}
                                <div className="rounded-xl border border-slate-200 p-4.5 bg-slate-50/40 hover:bg-white transition-all flex flex-col justify-between shadow-2xs p-3">
                                    <div>
                                        <div className="flex items-center gap-3.5">
                                            <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
                                                <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                                                    <path
                                                        className="text-slate-200"
                                                        strokeWidth="3.2"
                                                        stroke="currentColor"
                                                        fill="none"
                                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                    />
                                                    <path
                                                        className="text-[#0A66C2]"
                                                        strokeDasharray={`${outreachPercent}, 100`}
                                                        strokeWidth="3.2"
                                                        strokeLinecap="round"
                                                        stroke="currentColor"
                                                        fill="none"
                                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                    />
                                                </svg>
                                                <span className="absolute text-[11px] font-bold text-slate-900">
                                                    {outreachPercent}%
                                                </span>
                                            </div>

                                            <div>
                                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
                                                    Outreach Usage
                                                </span>
                                                <span className="text-base font-semibold text-slate-900 tracking-tight">
                                                    {formatCompactNumber(credits.outreach_used)} / {formatCompactNumber(credits.outreach_total)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="pt-3 mt-3.5 border-t border-slate-200/70">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[11px] font-bold text-slate-500 uppercase">Channels Dispatched</span>
                                                <Link href="/billing" className="text-[11px] text-[#0A66C2] font-bold hover:underline cursor-pointer">
                                                    View Report
                                                </Link>
                                            </div>

                                            <div className="space-y-1.5 text-xs text-slate-600">
                                                <div className="flex items-center justify-between">
                                                    <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                                                        <Mail size={13} className="text-[#0A66C2]" />
                                                        Email
                                                    </span>
                                                    <span className="font-bold text-slate-900">
                                                        {credits.email_count || 0}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                                                        <MessageCircle size={13} className="text-emerald-600" />
                                                        WhatsApp
                                                    </span>
                                                    <span className="font-bold text-slate-900">
                                                        {credits.whatsapp_count || 0}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                                                        <Smartphone size={13} className="text-blue-500" />
                                                        SMS
                                                    </span>
                                                    <span className="font-bold text-slate-900">
                                                        {credits.sms_count || 0}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </section>

                        {/* ================= SECTION 5: DOWNLOADS & FOLDERS ================= */}
                        <section
                            id="downloads"
                            className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 transition-shadow hover:shadow-sm"
                        >
                            {/* Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0A66C2] flex items-center justify-center border border-blue-200/60 shadow-2xs">
                                        <Download size={17} strokeWidth={2.4} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-900 mb-0">
                                            Downloads & Folders
                                        </h2>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2.5 flex-wrap">
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-[#0A66C2] border border-blue-200/60">
                                        {foldersList.length} Folders • {candidatesList.length} Candidates • {candidatesList.filter(c => c.has_resume).length} Resumes
                                    </span>
                                    <Link
                                        href="/manage-folder"
                                        className="px-3 py-1.5 rounded-xl bg-[#0A66C2] hover:bg-[#004182] text-white text-xs font-medium shadow-2xs hover:shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer active:scale-98"
                                    >
                                        <Folder size={13} />
                                        <span>Manage All</span>
                                    </Link>
                                </div>
                            </div>

                            <div className="mt-4 space-y-6">
                                {/* SUB-SECTION 1: FOLDERS OVERVIEW */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                                Your Folders ({foldersList.length})
                                            </span>
                                            {selectedFolderFilter !== 'all' && (
                                                <button
                                                    onClick={() => setSelectedFolderFilter('all')}
                                                    className="text-[11px] font-bold text-[#0A66C2] hover:underline inline-flex items-center gap-1 cursor-pointer"
                                                >
                                                    Show All
                                                </button>
                                            )}
                                        </div>
                                        <span className="text-xs text-slate-400">Click folder to filter resumes</span>
                                    </div>

                                    {foldersList.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                                            {foldersList.map((f) => {
                                                const isSelected = String(selectedFolderFilter) === String(f.id);
                                                return (
                                                    <div
                                                        key={f.id}
                                                        onClick={() => setSelectedFolderFilter(prev => String(prev) === String(f.id) ? 'all' : f.id)}
                                                        className={`p-3 rounded-xl border transition-all cursor-pointer select-none relative group ${isSelected
                                                            ? 'bg-blue-50/70 border-[#0A66C2] ring-2 ring-blue-500/20 shadow-xs'
                                                            : 'bg-slate-50/60 hover:bg-white border-slate-200/80 hover:border-blue-200 hover:shadow-xs'
                                                            }`}
                                                    >
                                                        <div className="flex items-start justify-between gap-2.5">
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${isSelected
                                                                    ? 'bg-[#0A66C2] text-white shadow-2xs'
                                                                    : 'bg-blue-100/70 text-[#0A66C2]'
                                                                    }`}>
                                                                    <Folder size={17} strokeWidth={2.3} />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <h4 className="text-sm font-bold text-slate-900 truncate mb-0 group-hover:text-[#0A66C2] transition-colors">
                                                                        {f.name}
                                                                    </h4>
                                                                    <p className="text-[11px] text-slate-400 font-medium mb-0 mt-0.5 truncate">
                                                                        {f.linked_job_title ? `Linked: ${f.linked_job_title}` : 'Personal Folder'}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200/80 shrink-0">
                                                                {f.candidate_count || 0}
                                                            </span>
                                                        </div>

                                                        {/* Folder stats bar */}
                                                        <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-200/60 mt-3 font-medium">
                                                            <div className="flex items-center gap-1.5 text-slate-600 text-[11.5px]">
                                                                <FileText size={12} className="text-emerald-600" />
                                                                <span className="font-semibold text-slate-800">{f.resume_count || 0}</span> Resumes
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-[11px] font-semibold transition-colors ${isSelected ? 'text-[#0A66C2]' : 'text-slate-400 group-hover:text-[#0A66C2]'
                                                                    }`}>
                                                                    {isSelected ? 'Filtered ✓' : 'Filter'}
                                                                </span>
                                                                <Link
                                                                    href={`/manage-folder?folderId=${f.id}`}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="text-slate-400 hover:text-[#0A66C2] transition-colors p-0.5"
                                                                    title="Open in Folder Management"
                                                                >
                                                                    <ExternalLink size={12} />
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* Quick Add Folder Card */}
                                            <Link
                                                href="/manage-folder"
                                                className="p-4 rounded-xl border border-dashed border-slate-300 hover:border-blue-400 bg-slate-50/40 hover:bg-blue-50/30 transition-all flex items-center justify-center text-center group cursor-pointer"
                                            >
                                                <div className="flex items-center gap-2 text-slate-600 group-hover:text-[#0A66C2] font-semibold text-xs transition-colors">
                                                    <FolderPlus size={16} />
                                                    <span>Create New Folder</span>
                                                </div>
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                                            No candidate folders created yet.
                                        </div>
                                    )}
                                </div>

                                {/* SUB-SECTION 2: DOWNLOADED RESUMES & CANDIDATES */}
                                <div className="pt-4 border-t border-slate-100">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3.5">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                                    Downloaded Resumes & Candidates ({filteredCandidates.length})
                                                </span>
                                                {selectedFolderFilter !== 'all' && (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#0A66C2]">
                                                        <span>In: {foldersList.find(f => String(f.id) === String(selectedFolderFilter))?.name || 'Selected Folder'}</span>
                                                        <button
                                                            onClick={() => setSelectedFolderFilter('all')}
                                                            className="hover:text-red-500 cursor-pointer ml-0.5"
                                                            title="Clear filter"
                                                        >
                                                            <X size={11} />
                                                        </button>
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 font-medium mb-0 mt-0.5">
                                                Instant access to resumes and candidate profiles saved in your recruitment pipeline.
                                            </p>
                                        </div>

                                        {/* Filter controls */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {/* Search input */}
                                            <div className="relative min-w-[180px] sm:min-w-[210px]">
                                                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    value={resumeSearchTerm}
                                                    onChange={(e) => setResumeSearchTerm(e.target.value)}
                                                    placeholder="Search candidates, roles..."
                                                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#0A66C2] transition-colors"
                                                />
                                                {resumeSearchTerm && (
                                                    <button
                                                        onClick={() => setResumeSearchTerm('')}
                                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Tab: All vs With Resume */}
                                            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/70">
                                                <button
                                                    type="button"
                                                    onClick={() => setResumeFilterTab('all')}
                                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${resumeFilterTab === 'all'
                                                        ? 'bg-white text-slate-900 shadow-2xs'
                                                        : 'text-slate-600 hover:text-slate-900'
                                                        }`}
                                                >
                                                    All ({candidatesList.length})
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setResumeFilterTab('with_resume')}
                                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1 ${resumeFilterTab === 'with_resume'
                                                        ? 'bg-white text-[#0A66C2] shadow-2xs'
                                                        : 'text-slate-600 hover:text-slate-900'
                                                        }`}
                                                >
                                                    <FileText size={12} />
                                                    Resumes ({candidatesList.filter(c => c.has_resume).length})
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Candidates list */}
                                    {filteredCandidates.length > 0 ? (
                                        <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-2xs">
                                            {filteredCandidates.map((cand) => {
                                                const isHired = cand.stage === 'hired';
                                                const isInterviewed = cand.stage === 'interviewed';
                                                const isApplicant = cand.stage === 'applicant';

                                                return (
                                                    <div
                                                        key={cand.item_id || `${cand.folder_id}-${cand.id}`}
                                                        className="p-3.5 sm:p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                                    >
                                                        {/* Candidate details */}
                                                        <div className="flex items-start gap-3 min-w-0">
                                                            {/* Avatar */}
                                                            <div className="shrink-0 mt-0.5">
                                                                {cand.profile_image ? (
                                                                    <img
                                                                        src={cand.profile_image}
                                                                        alt={cand.name}
                                                                        className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                                                                        onError={(e) => {
                                                                            e.target.style.display = 'none';
                                                                            if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                                                                        }}
                                                                    />
                                                                ) : null}
                                                                <div
                                                                    className="w-10 h-10 rounded-xl bg-blue-50 text-[#0A66C2] font-bold text-xs flex items-center justify-center border border-blue-200/60"
                                                                    style={{ display: cand.profile_image ? 'none' : 'flex' }}
                                                                >
                                                                    {getCandidateInitials(cand.name)}
                                                                </div>
                                                            </div>

                                                            {/* Info */}
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <h4 className="text-sm font-semibold text-slate-900 mb-0 hover:text-[#0A66C2] transition-colors truncate">
                                                                        {cand.name}
                                                                    </h4>
                                                                    <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                                                        <Folder size={10} className="text-slate-400" />
                                                                        <span>{cand.folder_name}</span>
                                                                    </span>
                                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${isHired ? 'bg-emerald-100 text-emerald-800' :
                                                                        isInterviewed ? 'bg-purple-100 text-purple-800' :
                                                                            isApplicant ? 'bg-blue-100 text-[#0A66C2]' :
                                                                                'bg-slate-100 text-slate-600'
                                                                        }`}>
                                                                        {cand.stage}
                                                                    </span>
                                                                </div>

                                                                <div className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-2 flex-wrap">
                                                                    <span className="font-semibold text-slate-700">{cand.designation}</span>
                                                                    {cand.company && cand.company !== 'Individual' && (
                                                                        <>
                                                                            <span className="text-slate-300">•</span>
                                                                            <span>{cand.company}</span>
                                                                        </>
                                                                    )}
                                                                    {cand.experience && (
                                                                        <>
                                                                            <span className="text-slate-300">•</span>
                                                                            <span className="inline-flex items-center gap-1">
                                                                                <Briefcase size={11} className="text-slate-400" />
                                                                                <span>{cand.experience}</span>
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                    {cand.location && (
                                                                        <>
                                                                            <span className="text-slate-300">•</span>
                                                                            <span className="inline-flex items-center gap-1">
                                                                                <MapPin size={11} className="text-slate-400" />
                                                                                <span>{cand.location}</span>
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Actions: Download Resume & View */}
                                                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                                            {cand.has_resume ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => downloadResumeFile(cand.resume, cand.name)}
                                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0A66C2] border border-blue-200/80 text-xs font-semibold transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-95"
                                                                    title="Download Resume PDF"
                                                                >
                                                                    <Download size={13} strokeWidth={2.4} />
                                                                    <span>Resume PDF</span>
                                                                </button>
                                                            ) : (
                                                                <span className="text-[11px] font-medium text-slate-400 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/60">
                                                                    Profile Saved
                                                                </span>
                                                            )}

                                                            <Link
                                                                href={`/manage-folder?folderId=${cand.folder_id}`}
                                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-medium transition-all shadow-2xs cursor-pointer"
                                                                title="View in folder"
                                                            >
                                                                <span>View</span>
                                                                <ExternalLink size={12} />
                                                            </Link>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="p-8 rounded-xl border border-dashed border-slate-200 text-center bg-slate-50/50">
                                            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#0A66C2] flex items-center justify-center mx-auto mb-2 border border-blue-100">
                                                <FileText size={18} />
                                            </div>
                                            <h4 className="text-sm font-semibold text-slate-800 mb-1">
                                                No candidates found
                                            </h4>
                                            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-3">
                                                {resumeSearchTerm
                                                    ? `No profiles matching "${resumeSearchTerm}". Try clearing your search.`
                                                    : 'No candidate profiles saved in this folder yet.'}
                                            </p>
                                            {(resumeSearchTerm || selectedFolderFilter !== 'all' || resumeFilterTab !== 'all') && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setResumeSearchTerm('');
                                                        setSelectedFolderFilter('all');
                                                        setResumeFilterTab('all');
                                                    }}
                                                    className="px-3.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                                                >
                                                    Reset All Filters
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* Footer */}
                                    <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-100">
                                        <span className="text-xs text-slate-400 font-medium">
                                            Showing {filteredCandidates.length} of {candidatesList.length} downloaded candidates
                                        </span>
                                        <Link
                                            href="/manage-folder"
                                            className="text-xs font-bold text-[#0A66C2] hover:text-[#004182] hover:underline inline-flex items-center gap-1 cursor-pointer"
                                        >
                                            <span>Open Folder Management</span>
                                            <ArrowRight size={13} />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </section>

                    </main>
                </div>

            </div>

            {/* ================= INTERACTIVE AI VOICE SEARCH DEMO MODAL ================= */}
            {demoModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0A66C2] border border-blue-200/60 flex items-center justify-center shadow-2xs">
                                    <Sparkles size={16} className="text-[#FB6202] fill-[#FB6202]" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-sm">CareerFast AI Voice Search</h4>
                                    <span className="text-[10.5px] text-slate-500 font-medium">Multilingual Talent Discovery</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setDemoModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer text-lg font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="py-6 text-center space-y-3.5">
                            <div className="w-18 h-18 rounded-3xl bg-gradient-to-tr from-[#0A66C2] via-blue-600 to-[#FB6202] text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30 animate-pulse">
                                <Smartphone size={32} />
                            </div>
                            <h5 className="font-extrabold text-slate-900 text-base max-w-sm mx-auto leading-snug">
                                “Find React developers with 3+ years experience in Bengaluru”
                            </h5>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                                Speak naturally in any of 20 regional and international languages. The AI parser extracts job title, skills, experience, and location filters instantaneously.
                            </p>
                        </div>

                        <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-100">
                            <button
                                onClick={() => setDemoModalOpen(false)}
                                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    setDemoModalOpen(false);
                                    router.push('/candidate-search?keywords=React+developer');
                                }}
                                className="px-4.5 py-2 text-xs font-bold rounded-xl bg-[#0A66C2] hover:bg-[#004182] text-white cursor-pointer transition-colors shadow-sm shadow-blue-500/20"
                            >
                                Try Voice Search Now
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
