'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Crown,
    CheckCircle2,
    Zap,
    ArrowRight,
    Clock,
    Lock,
    ShieldCheck,
    Star,
    RotateCcw,
    Check,
    X,
    Calendar,
    Search,
    Briefcase,
    Megaphone,
    CreditCard,
    Download,
    Eye,
    Users,
    Sparkles,
    Building2,
    RefreshCw,
    Plus,
    AlertTriangle,
    BarChart3,
    Layers,
    TrendingUp,
    FileSpreadsheet,
    FileText,
    Percent,
    Sliders,
    Award,
    CheckCheck,
    ChevronRight,
    ExternalLink,
    HelpCircle,
    Info,
    Mail,
    MessageCircle,
    Smartphone,
    Share2,
    UserCheck,
    Send
} from 'lucide-react';
import { getHrDashboardSummary, getMySubscription, getBillingPlans } from '../ApiService/action';
import { CommonToaster } from '../Common/CommonToaster';

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

export default function HrReports() {
    const router = useRouter();

    // State management
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);
    const [mySubscription, setMySubscription] = useState(null);
    const [recruiterName, setRecruiterName] = useState('Recruiter');
    const [recruiterIdState, setRecruiterIdState] = useState(2);
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'jobs' | 'resumes' | 'outreach' | 'team' | 'features'

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

    // Load actual user searches
    const [recentSearches, setRecentSearches] = useState([]);
    const [savedSearches, setSavedSearches] = useState([]);

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
        } catch (e) { }
        return { localRecent, localSaved };
    };

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

    // Fetch dynamic report & subscription data
    const fetchReportData = async () => {
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

            syncSearches(null, recruiterId);

            // Fetch live subscription and dashboard summary in parallel
            const [summaryRes, subRes] = await Promise.allSettled([
                recruiterId ? getHrDashboardSummary(recruiterId) : Promise.resolve(null),
                getMySubscription()
            ]);

            if (summaryRes.status === 'fulfilled' && summaryRes.value) {
                const res = summaryRes.value;
                const summaryData = res?.data?.searches ? res.data : (res?.data?.data?.searches ? res.data.data : res?.data);
                if (summaryData) {
                    setDashboardData(summaryData);
                    syncSearches(summaryData.searches, recruiterId);
                    if (summaryData.company) {
                        setCompanyInfo(summaryData.company);
                    } else if (summaryData.subscription?.company) {
                        setCompanyInfo(summaryData.subscription.company);
                    }

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

            if (subRes.status === 'fulfilled' && subRes.value?.data) {
                setMySubscription(subRes.value.data);
            }
        } catch (error) {
            console.warn('Notice: Could not load full report data:', error?.message || error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReportData();
    }, []);

    // Derived counts
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

    // Credits breakdown from dashboard API or defaults
    const credits = dashboardData?.credits || {
        profile_usage_used: 45300,
        profile_usage_total: 750000,
        profile_usage_percent: 6,
        email_count: 12,
        email_limit: 100,
        whatsapp_count: 8,
        whatsapp_limit: 50,
        excel_downloads: 3,
        excel_limit: 25
    };

    // Limits & Usage Resolution from mySubscription and dashboardData
    const subLimits = mySubscription?.limits || {};
    const subUsage = mySubscription?.usage || {};

    const planName = mySubscription?.plan?.name || mySubscription?.plan_name || dashboardData?.subscription?.plan_name || 'Custom Plan';
    const planStatus = mySubscription?.status || dashboardData?.subscription?.status || 'Active';
    const billingCycle = mySubscription?.billing_cycle || dashboardData?.subscription?.billing_cycle || 'monthly';
    const daysRemaining = mySubscription?.days_remaining !== undefined ? mySubscription.days_remaining : 28;

    // 1. Active Job Slots
    const activeSlotLimit = Number(subLimits?.active_job_limit ?? dashboardData?.subscription?.active_job_limit ?? 2500);
    const activeSlotUsed = activeJobs;
    const activeSlotRemaining = Math.max(0, activeSlotLimit - activeSlotUsed);
    const activeSlotPercent = activeSlotLimit > 0 ? Math.min(100, Math.round((activeSlotUsed / activeSlotLimit) * 100)) : 0;

    // 2. Monthly Job Posts
    const postLimit = Number(subLimits?.job_post_limit ?? dashboardData?.subscription?.job_post_limit ?? 2000);
    const postsUsed = Number(subUsage?.job_posts_used ?? dashboardData?.subscription?.job_posts_used ?? totalJobs);
    const postsRemaining = Math.max(0, postLimit - postsUsed);
    const postLimitPercent = postLimit > 0 ? Math.min(100, Math.round((postsUsed / postLimit) * 100)) : 0;

    // 3. Resume / Profile Views
    const viewLimit = Number(subLimits?.resume_view_limit ?? dashboardData?.subscription?.resume_view_limit ?? 500);
    const viewsUsed = Number(subUsage?.resume_views_used ?? dashboardData?.subscription?.resume_views_used ?? userAccess.quota.used_resume_views ?? 0);
    const viewsRemaining = Math.max(0, viewLimit - viewsUsed);
    const viewsPercent = viewLimit > 0 ? Math.min(100, Math.round((viewsUsed / viewLimit) * 100)) : 0;

    // 4. Resume Downloads
    const downloadLimit = Number(subLimits?.resume_download_limit ?? dashboardData?.subscription?.resume_download_limit ?? 250);
    const downloadsUsed = Number(subUsage?.resume_downloads_used ?? dashboardData?.subscription?.resume_downloads_used ?? userAccess.quota.used_resume_downloads ?? 0);
    const downloadsRemaining = Math.max(0, downloadLimit - downloadsUsed);
    const downloadsPercent = downloadLimit > 0 ? Math.min(100, Math.round((downloadsUsed / downloadLimit) * 100)) : 0;

    // 5. Email Outreach Quota
    const emailLimit = Number(subLimits?.email_limit ?? credits?.email_limit ?? 500);
    const emailsUsed = Number(subUsage?.emails_sent ?? subUsage?.emails_used ?? credits?.email_count ?? 12);
    const emailsRemaining = Math.max(0, emailLimit - emailsUsed);
    const emailsPercent = emailLimit > 0 ? Math.min(100, Math.round((emailsUsed / emailLimit) * 100)) : 0;

    // 6. WhatsApp Outreach Quota
    const whatsappLimit = Number(subLimits?.whatsapp_limit ?? credits?.whatsapp_limit ?? 200);
    const whatsappUsed = Number(subUsage?.whatsapp_messages_sent ?? subUsage?.whatsapp_used ?? credits?.whatsapp_count ?? 8);
    const whatsappRemaining = Math.max(0, whatsappLimit - whatsappUsed);
    const whatsappPercent = whatsappLimit > 0 ? Math.min(100, Math.round((whatsappUsed / whatsappLimit) * 100)) : 0;

    // 7. Sub-Recruiter Subseats (Team Licenses)
    const subseatLimit = Number(subLimits?.sub_recruiter_limit ?? subLimits?.subseats_limit ?? 10);
    const subseatsUsed = Number(subUsage?.sub_recruiters_count ?? subUsage?.subseats_used ?? (companyInfo?.sub_recruiters_count || 1));
    const subseatsRemaining = Math.max(0, subseatLimit - subseatsUsed);
    const subseatsPercent = subseatLimit > 0 ? Math.min(100, Math.round((subseatsUsed / subseatLimit) * 100)) : 0;

    // 8. Excel Candidate Export Quota
    const excelLimit = Number(subLimits?.excel_download_limit ?? credits?.excel_limit ?? 100);
    const excelUsed = Number(subUsage?.excel_downloads_used ?? credits?.excel_downloads ?? 3);
    const excelRemaining = Math.max(0, excelLimit - excelUsed);
    const excelPercent = excelLimit > 0 ? Math.min(100, Math.round((excelUsed / excelLimit) * 100)) : 0;

    // 9. Profile Credits
    const profilePercent = credits.profile_usage_total > 0
        ? Math.round((credits.profile_usage_used / credits.profile_usage_total) * 100)
        : credits.profile_usage_percent || 6;

    const recruiterInitials = recruiterName ? recruiterName.charAt(0).toUpperCase() : 'S';

    const isCompanyLimitReached = Boolean(
        userAccess.isSubRecruiter && (
            activeSlotUsed >= activeSlotLimit ||
            postsUsed >= postLimit
        )
    );

    const isPostingRestricted = Boolean(
        activeSlotUsed >= activeSlotLimit ||
        postsUsed >= postLimit ||
        isCompanyLimitReached
    );

    // Export Comprehensive CSV Report
    const handleExportReport = () => {
        const csvContent = "data:text/csv;charset=utf-8," +
            "Metric,Allocated Quota,Used,Remaining,Utilization (%)\n" +
            `Active Job Slots,${activeSlotLimit},${activeSlotUsed},${activeSlotRemaining},${activeSlotPercent}%\n` +
            `Monthly Job Posts,${postLimit},${postsUsed},${postsRemaining},${postLimitPercent}%\n` +
            `Resume Profile Views,${viewLimit},${viewsUsed},${viewsRemaining},${viewsPercent}%\n` +
            `Resume CV Downloads,${downloadLimit},${downloadsUsed},${downloadsRemaining},${downloadsPercent}%\n` +
            `Direct Email Outreach,${emailLimit},${emailsUsed},${emailsRemaining},${emailsPercent}%\n` +
            `WhatsApp Messages,${whatsappLimit},${whatsappUsed},${whatsappRemaining},${whatsappPercent}%\n` +
            `Team Subseats (Sub-Recruiters),${subseatLimit},${subseatsUsed},${subseatsRemaining},${subseatsPercent}%\n` +
            `Excel Candidate Exports,${excelLimit},${excelUsed},${excelRemaining},${excelPercent}%\n` +
            `Profile Credits Pool,${credits.profile_usage_total},${credits.profile_usage_used},${credits.profile_usage_total - credits.profile_usage_used},${profilePercent}%\n`;

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `CareerFast_Complete_Plan_Report_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        CommonToaster("Complete plan usage report downloaded successfully!", "success");
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] py-7 text-slate-800 antialiased font-sans overflow-x-hidden w-full [&_a]:no-underline [&_a:hover]:no-underline">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-7">

                {/* Section Header with Title & Action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h2 className="text-2xl font-semibold text-slate-900 tracking-tight mb-0">
                                Complete Plan Resource Quotas & Analytics
                            </h2>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100/80 text-[#0A66C2] border border-blue-200">
                                Real-Time Allocation
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1 mb-0">
                            Monitor full breakdown of Email, WhatsApp, Subseats, Job Slots, Profile Views, and Candidate Export allowances.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                        {/* Export CSV Button */}
                        <button
                            type="button"
                            onClick={handleExportReport}
                            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-[#0A66C2] hover:border-blue-200 font-semibold text-xs transition-all shadow-2xs inline-flex items-center gap-2 cursor-pointer"
                        >
                            <Download size={14} className="text-slate-500" />
                            <span>Export Full CSV</span>
                        </button>
                    </div>
                </div>

                {/* Tab Filter Bar */}
                <div className="flex items-center overflow-x-auto pb-1 -mt-1 scrollbar-none">
                    <div className="inline-flex items-center p-1 bg-slate-100 border border-slate-200/80 rounded-xl gap-1">
                        {[
                            { id: 'all', label: 'All Plan Details' },
                            { id: 'outreach', label: 'Email & WhatsApp' },
                            { id: 'team', label: 'Subseats & Team' },
                            { id: 'jobs', label: 'Job Slots' },
                            { id: 'resumes', label: 'Resumes & CVs' },
                            { id: 'features', label: 'Plan Features' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${activeTab === tab.id
                                    ? 'bg-white text-[#0A66C2] shadow-2xs font-semibold'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Plan Highlights Hero Banner */}
                <div className="bg-gradient-to-r from-[#0A66C2] via-indigo-700 to-[#084e96] rounded-3xl p-6 sm:p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex items-start sm:items-center gap-5">
                            <div className="w-12 h-12 rounded-xl bg-white/10 border-2 border-white/20 flex items-center justify-center shrink-0 backdrop-blur-xs shadow-inner">
                                <Crown className="w-6 h-6 text-amber-300" strokeWidth={2.3} />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h3 className="text-2xl sm:text-2xl font-semibold tracking-tight mb-0 text-white">
                                        {planName}
                                    </h3>
                                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-400 text-emerald-950 shadow-2xs">
                                        ● {planStatus}
                                    </span>
                                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-white backdrop-blur-xs border border-white/20">
                                        Billing: <span className="capitalize text-amber-200">{billingCycle}</span>
                                    </span>
                                </div>
                                <p className="text-blue-100 text-sm mt-0 mb-0 max-w-2xl leading-relaxed">
                                    Enterprise recruiter package with {activeSlotLimit} concurrent job slots, {emailLimit} email credits, {whatsappLimit} WhatsApp messages, and {subseatLimit} sub-recruiter team seats.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                            <div className="p-2 px-3 text-center">
                                <span className="text-[11px] text-blue-200 uppercase font-semibold tracking-wider block">Cycle Health</span>
                                <span className="text-lg font-semibold text-amber-300">
                                    {daysRemaining} Days Left
                                </span>
                            </div>
                            {!userAccess.isSubRecruiter && (
                                <Link
                                    href="/billing"
                                    className="px-3 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-[#0A66C2] font-semibold text-sm transition-all shadow-md inline-flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <span>Manage / Upgrade</span>
                                    <ArrowRight size={16} />
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* 2. TOP HERO / EXECUTIVE HEADER SECTION WITH ALL PLAN DETAILS              */}
                {/* ========================================================================= */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6">
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
                                    <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-0 tracking-tight">
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
                                                <span>{planName}</span>
                                                <span className="text-amber-700 font-semibold">• {activeSlotUsed}/{activeSlotLimit} Active Slots</span>
                                            </Link>
                                        </>
                                    )}
                                </div>
                                <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium mb-0">
                                    Real-time intelligence on your active job searches, postings, email/WhatsApp outreach, and subseat quotas.
                                </p>
                            </div>
                        </div>

                        {/* Quick Action CTAs */}
                        <div className="flex items-center gap-2 flex-nowrap shrink-0">
                            <button
                                onClick={fetchReportData}
                                title="Refresh report & plan data"
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
                                            alert("Job posting is locked because the company's plan limits are reached. All active job slots or monthly posts are in use.");
                                        }}
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

                    {/* ========================================================================= */}
                    {/* ALL PLAN DETAILS KPI CARDS GRID (EMAIL, WHATSAPP, SUBSEAT, SLOTS, ETC.)  */}
                    {/* ========================================================================= */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3 sm:gap-4 pt-4">

                        {/* 1. Candidate Searches */}
                        <Link
                            href="/overview"
                            className="p-3.5 sm:p-4 rounded-xl bg-slate-50/70 hover:bg-blue-50/50 border border-slate-200/70 hover:border-blue-200 transition-all cursor-pointer group block"
                        >
                            <div className="flex items-center justify-between text-slate-500 mb-2">
                                <span className="text-[12.5px] font-semibold">Candidate Searches</span>
                                <div className="w-7 h-7 rounded-lg bg-blue-100/70 text-[#0A66C2] flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <Search size={14} strokeWidth={2.3} />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
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
                        </Link>

                        {/* 2. Active Job Slots */}
                        <Link
                            href="/my-jobs"
                            className={`p-3.5 sm:p-4 rounded-xl transition-all cursor-pointer group border block ${activeSlotUsed >= activeSlotLimit
                                ? 'bg-amber-50/40 border-amber-200/90 hover:bg-amber-50/80'
                                : 'bg-slate-50/70 hover:bg-emerald-50/50 border-slate-200/70 hover:border-emerald-200'
                                }`}
                        >
                            <div className="flex items-center justify-between text-slate-500 mb-2">
                                <span className="text-[12.5px] font-semibold">Active Job Slots</span>
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform ${activeSlotUsed >= activeSlotLimit
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100/80 text-emerald-700'
                                    }`}>
                                    <Briefcase size={14} strokeWidth={2.3} />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
                                    {activeSlotUsed} <span className="text-sm font-semibold text-slate-400">/ {activeSlotLimit}</span>
                                </span>
                                <span className={`text-[11px] font-bold ${activeSlotUsed >= activeSlotLimit ? 'text-amber-700' : 'text-emerald-700'}`}>
                                    {activeSlotRemaining} Available
                                </span>
                            </div>
                            <div className="text-[11px] font-semibold text-emerald-700 mt-1.5 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                <span>{activeSlotUsed} Live on Portal</span>
                                <ArrowRight size={11} />
                            </div>
                        </Link>

                        {/* 3. Pending Approval */}
                        <Link
                            href="/my-jobs"
                            className={`p-3.5 sm:p-4 rounded-xl transition-all cursor-pointer group border block ${pendingJobs > 0
                                ? 'bg-amber-50/80 hover:bg-amber-100/70 border-amber-300 shadow-2xs ring-1 ring-amber-200/60'
                                : 'bg-slate-50/70 hover:bg-blue-50/50 border-slate-200/70 hover:border-blue-200'
                                }`}
                        >
                            <div className="flex items-center justify-between text-slate-500 mb-2">
                                <span className="text-[12.5px] font-semibold">Pending Approval</span>
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform ${pendingJobs > 0
                                    ? 'bg-amber-200/90 text-amber-800'
                                    : 'bg-slate-100 text-slate-500'
                                    }`}>
                                    <Clock size={14} strokeWidth={2.3} />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className={`text-xl sm:text-2xl font-bold tracking-tight ${pendingJobs > 0 ? 'text-amber-900' : 'text-slate-900'}`}>
                                    {pendingJobs}
                                </span>
                                <span className={`text-[11px] font-bold ${pendingJobs > 0 ? 'text-amber-800' : 'text-slate-400'}`}>
                                    {pendingJobs > 0 ? 'In Review' : '0 in queue'}
                                </span>
                            </div>
                            <div className={`text-[11px] font-bold mt-1.5 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform ${pendingJobs > 0 ? 'text-amber-800' : 'text-slate-400'}`}>
                                <span>View pending jobs</span>
                                <ArrowRight size={11} />
                            </div>
                        </Link>

                        {/* 4. Monthly Post Quota */}
                        <Link
                            href="/billing"
                            className="p-3.5 sm:p-4 rounded-xl bg-slate-50/70 hover:bg-blue-50/50 border border-slate-200/70 hover:border-blue-200 transition-all cursor-pointer group block"
                        >
                            <div className="flex items-center justify-between text-slate-500 mb-2">
                                <span className="text-[12.5px] font-semibold">Monthly Post Quota</span>
                                <div className="w-7 h-7 rounded-lg bg-indigo-100/70 text-indigo-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <Crown size={14} strokeWidth={2.3} />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
                                    {postsUsed} <span className="text-sm font-semibold text-slate-400">/ {postLimit}</span>
                                </span>
                                <span className={`text-[11px] font-bold ${postsUsed >= postLimit ? 'text-rose-600' : 'text-slate-500'}`}>
                                    {postsRemaining} left
                                </span>
                            </div>
                            <div className="text-[11px] font-semibold text-[#0A66C2] mt-1.5 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                <span className="truncate">{planName}</span>
                                <ArrowRight size={11} />
                            </div>
                        </Link>

                        {/* 5. Credits Usage */}
                        <div
                            onClick={() => router.push('/billing')}
                            className="p-3.5 sm:p-4 rounded-xl bg-slate-50/70 hover:bg-blue-50/50 border border-slate-200/70 hover:border-blue-200 transition-all cursor-pointer group"
                        >
                            <div className="flex items-center justify-between text-slate-500 mb-2">
                                <span className="text-[12.5px] font-semibold">Credits Usage</span>
                                <div className="w-7 h-7 rounded-lg bg-blue-100/70 text-[#0A66C2] flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <CreditCard size={14} strokeWidth={2.3} />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
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

                        {/* 6. Email Outreach Quota */}
                        <div
                            onClick={() => setActiveTab('outreach')}
                            className="p-3.5 sm:p-4 rounded-xl bg-slate-50/70 hover:bg-sky-50/50 border border-slate-200/70 hover:border-sky-200 transition-all cursor-pointer group"
                        >
                            <div className="flex items-center justify-between text-slate-500 mb-2">
                                <span className="text-[12.5px] font-semibold">Email Outreach</span>
                                <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <Mail size={14} strokeWidth={2.3} />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
                                    {emailsUsed} <span className="text-sm font-semibold text-slate-400">/ {emailLimit}</span>
                                </span>
                                <span className="text-[11px] font-bold text-sky-700">
                                    {emailsRemaining} left
                                </span>
                            </div>
                            <div className="text-[11px] font-semibold text-sky-700 mt-1.5 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                <span>Direct Email Quota</span>
                                <ArrowRight size={11} />
                            </div>
                        </div>

                        {/* 7. WhatsApp Outreach Quota */}
                        <div
                            onClick={() => setActiveTab('outreach')}
                            className="p-3.5 sm:p-4 rounded-xl bg-slate-50/70 hover:bg-emerald-50/50 border border-slate-200/70 hover:border-emerald-200 transition-all cursor-pointer group"
                        >
                            <div className="flex items-center justify-between text-slate-500 mb-2">
                                <span className="text-[12.5px] font-semibold">WhatsApp Messages</span>
                                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <MessageCircle size={14} strokeWidth={2.3} />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
                                    {whatsappUsed} <span className="text-sm font-semibold text-slate-400">/ {whatsappLimit}</span>
                                </span>
                                <span className="text-[11px] font-bold text-emerald-700">
                                    {whatsappRemaining} left
                                </span>
                            </div>
                            <div className="text-[11px] font-semibold text-emerald-700 mt-1.5 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                <span>WhatsApp Quota</span>
                                <ArrowRight size={11} />
                            </div>
                        </div>

                        {/* 8. Sub-Recruiter Subseats (Team Licenses) */}
                        <Link
                            href="/team"
                            className="p-3.5 sm:p-4 rounded-xl bg-slate-50/70 hover:bg-purple-50/50 border border-slate-200/70 hover:border-purple-200 transition-all cursor-pointer group block"
                        >
                            <div className="flex items-center justify-between text-slate-500 mb-2">
                                <span className="text-[12.5px] font-semibold">Subseats (Team)</span>
                                <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <Users size={14} strokeWidth={2.3} />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
                                    {subseatsUsed} <span className="text-sm font-semibold text-slate-400">/ {subseatLimit}</span>
                                </span>
                                <span className="text-[11px] font-bold text-purple-700">
                                    {subseatsRemaining} Seats Free
                                </span>
                            </div>
                            <div className="text-[11px] font-semibold text-purple-700 mt-1.5 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                <span>Manage Team Seats</span>
                                <ArrowRight size={11} />
                            </div>
                        </Link>

                        {/* 9. Resume / CV Views */}
                        <Link
                            href="/candidate-search"
                            className="p-3.5 sm:p-4 rounded-xl bg-slate-50/70 hover:bg-cyan-50/50 border border-slate-200/70 hover:border-cyan-200 transition-all cursor-pointer group block"
                        >
                            <div className="flex items-center justify-between text-slate-500 mb-2">
                                <span className="text-[12.5px] font-semibold">Resume Views</span>
                                <div className="w-7 h-7 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <Eye size={14} strokeWidth={2.3} />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
                                    {viewsUsed} <span className="text-sm font-semibold text-slate-400">/ {viewLimit}</span>
                                </span>
                                <span className="text-[11px] font-bold text-cyan-700">
                                    {viewsRemaining} left
                                </span>
                            </div>
                            <div className="text-[11px] font-semibold text-cyan-700 mt-1.5 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                <span>Profile Unlocks</span>
                                <ArrowRight size={11} />
                            </div>
                        </Link>

                        {/* 10. Resume / CV Downloads */}
                        <Link
                            href="/manage-folder"
                            className="p-3.5 sm:p-4 rounded-xl bg-slate-50/70 hover:bg-amber-50/50 border border-slate-200/70 hover:border-amber-200 transition-all cursor-pointer group block"
                        >
                            <div className="flex items-center justify-between text-slate-500 mb-2">
                                <span className="text-[12.5px] font-semibold">CV Downloads</span>
                                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <Download size={14} strokeWidth={2.3} />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
                                    {downloadsUsed} <span className="text-sm font-semibold text-slate-400">/ {downloadLimit}</span>
                                </span>
                                <span className="text-[11px] font-bold text-amber-700">
                                    {downloadsRemaining} left
                                </span>
                            </div>
                            <div className="text-[11px] font-semibold text-amber-700 mt-1.5 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                <span>CV Download Quota</span>
                                <ArrowRight size={11} />
                            </div>
                        </Link>

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
                                            {activeSlotUsed}/{activeSlotLimit} Active Slots Full
                                        </span>
                                    </div>
                                    <p className="text-xs text-amber-900/90 mt-1 mb-0 leading-relaxed font-medium">
                                        Your company's subscription plan has reached its limit ({activeSlotUsed} active jobs currently live).
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Plan Entitlements & Features Breakdown Table */}
                {(activeTab === 'all' || activeTab === 'features') && (
                    <div className="bg-white rounded-3xl shadow-xs overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4">
                            <div>
                                <h3 className="text-xl font-semibold text-slate-900 mb-1">
                                    Plan Feature Matrix & Entitlements
                                </h3>
                                <p className="text-xs text-slate-500 mb-0">
                                    Detailed feature breakdown included with your current subscription package.
                                </p>
                            </div>
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#0A66C2] border border-blue-200">
                                {planName} Included
                            </span>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {[
                                {
                                    category: 'Outreach & Messaging (Email & WhatsApp)',
                                    items: [
                                        { title: 'Direct Candidate Email Outreach', value: `${emailLimit} Emails / Month`, desc: 'Send customized email interview requests and direct invitations to top talent.' },
                                        { title: 'Direct WhatsApp Messaging', value: `${whatsappLimit} Messages / Month`, desc: '1-click WhatsApp candidate outreach with pre-filled message templates.' },
                                        { title: 'Bulk Outreach Campaigns', value: 'Active', desc: 'Launch multi-channel candidate sourcing campaigns with deliverability tracking.' },
                                        { title: 'Candidate Response Management', value: 'Real-time Analytics', desc: 'Track opened rates, replies, and interview acceptance velocity.' }
                                    ]
                                },
                                {
                                    category: 'Job Sourcing & Postings',
                                    items: [
                                        { title: 'Concurrent Active Job Slots', value: `${activeSlotLimit} Concurrent`, desc: 'Max number of job openings live on CareerFast portal simultaneously.' },
                                        { title: 'Monthly Job Creation Quota', value: `${postLimit} Jobs / Month`, desc: 'Total new jobs and internship positions allowed to be published each cycle.' },
                                        { title: 'Screening Questionnaires', value: 'Unlimited', desc: 'Custom pre-screening quiz and eligibility questions per post.' },
                                        { title: 'Superadmin Verification', value: 'Standard & Priority', desc: 'Quality review workflow before public indexing.' }
                                    ]
                                },
                                {
                                    category: 'Candidate Discovery & Resume Database',
                                    items: [
                                        { title: 'Candidate Database Search', value: 'Unlimited Keywords', desc: 'Instant search across skills, designations, cities, experience, and salary.' },
                                        { title: 'Profile Contact Views', value: `${viewLimit} Unlocks / Month`, desc: 'Reveal verified email addresses and candidate contact numbers.' },
                                        { title: 'Resume / CV Downloads', value: `${downloadLimit} Downloads / Month`, desc: 'Download verified candidate PDF/Word resumes.' },
                                        { title: 'Excel / CSV Candidate Export', value: `${excelLimit} Sheets / Month`, desc: 'Export full candidate contact lists and applicant spreadsheets.' }
                                    ]
                                },
                                {
                                    category: 'Team Collaboration & Subseat Governance',
                                    items: [
                                        { title: 'Team Sub-Recruiter Subseats', value: `${subseatLimit} Seats Allocated`, desc: 'Delegate sub-accounts with customized role and permission controls.' },
                                        { title: 'Quota Mode Distribution', value: 'Split & Shared Modes', desc: 'Partition job posting and resume view quotas among team members.' },
                                        { title: 'Custom Pipeline Folders', value: 'Unlimited Folders', desc: 'Organize candidates into custom recruiting categories.' },
                                        { title: 'Analytics & Reporting Export', value: 'Full CSV & PDF Export', desc: 'Download end-to-end recruitment velocity and quota reports.' }
                                    ]
                                }
                            ].map((group, gIdx) => (
                                <div key={gIdx} className="p-6">
                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                                        {group.category}
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {group.items.map((feat, fIdx) => (
                                            <div key={fIdx} className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 flex items-start gap-3 hover:bg-blue-50/40 hover:border-blue-200 transition-all">
                                                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                                                    <CheckCircle2 size={15} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <h5 className="text-sm font-semibold text-slate-900 mb-0 truncate">
                                                            {feat.title}
                                                        </h5>
                                                        <span className="text-xs font-semibold text-[#0A66C2] shrink-0 bg-white px-2 py-0.5 rounded border border-blue-200/60 shadow-2xs">
                                                            {feat.value}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-0 mb-0 leading-relaxed font-normal">
                                                        {feat.desc}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Plan Upgrade Banner CTA */}
                {!userAccess.isSubRecruiter && (
                    <div className="p-6 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-start sm:items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0 shadow-inner">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl sm:text-xl font-semibold mb-1 text-white">
                                    Need More Email, WhatsApp, or Subseat Allowances?
                                </h3>
                                <p className="text-white/90 text-xs sm:text-sm mb-0 max-w-2xl leading-relaxed">
                                    Scale your hiring pipeline instantly. Upgrade your plan for higher concurrent job slots, unlimited resume views, bulk WhatsApp messaging, and additional team subseats.
                                </p>
                            </div>
                        </div>

                        <Link
                            href="/billing"
                            className="px-6 py-3 rounded-xl bg-white hover:bg-slate-100 text-amber-900 font-semibold text-sm transition-all inline-flex items-center justify-center gap-2 cursor-pointer shrink-0 whitespace-nowrap"
                        >
                            <Crown size={16} className="text-amber-600" />
                            <span>Explore Higher Plans</span>
                        </Link>
                    </div>
                )}

            </div>
        </div>
    );
}
