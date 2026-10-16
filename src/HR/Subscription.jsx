import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Crown,
    CheckCircle2,
    Zap,
    ArrowRight,
    Clock,
    Lock,
    ShieldCheck,
    Star,
    Headphones,
    RotateCcw,
    Check,
    X,
    Calendar,
    Mail,
    MessageCircle,
    Eye,
    Download,
    FileSpreadsheet,
    Users,
    Briefcase,
    FileText,
    Sparkles,
    Search,
    BadgeCheck,
    CheckCircle,
    XCircle,
    Layers,
    Share2,
} from 'lucide-react';
import { getBillingPlans, getMySubscription } from '../ApiService/action';
import toast from 'react-hot-toast';
import BillingSkeleton, { PlansSkeletonGrid } from './BillingSkeleton';

const Subscription = () => {
    const [billingPlans, setBillingPlans] = useState([]);
    const [loadingPlans, setLoadingPlans] = useState(true);
    const [mySubscription, setMySubscription] = useState(null);
    const [loadingSubscription, setLoadingSubscription] = useState(true);

    useEffect(() => {
        const fetchSubscriptionData = async () => {
            try {
                setLoadingSubscription(true);
                const subRes = await getMySubscription();
                if (subRes && subRes.success && subRes.data) {
                    setMySubscription(subRes.data);
                }
            } catch (err) {
                // Not an error if recruiter doesn't have an active subscription yet
                console.log("No active subscription or error fetching:", err?.message);
            } finally {
                setLoadingSubscription(false);
            }
        };

        const fetchPlans = async () => {
            try {
                setLoadingPlans(true);
                const token = localStorage.getItem("token");
                const response = await getBillingPlans(token);
                const plansData = response.data?.data || response.data?.plans || response.data || [];
                setBillingPlans(Array.isArray(plansData) ? plansData : []);
            } catch (error) {
                console.error("Error fetching billing plans:", error);
            } finally {
                setLoadingPlans(false);
            }
        };

        fetchSubscriptionData();
        fetchPlans();
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0 }
    };

    const hasActiveSub = mySubscription && mySubscription.status === 'Active' && !mySubscription.is_expired;
    const planName = mySubscription?.plan?.name || mySubscription?.plan_name || 'Recruiter';
    const planId = mySubscription?.plan?.id || mySubscription?.plan_id;
    const limits = mySubscription?.limits || {};
    const usage = mySubscription?.usage || {};
    const plan = mySubscription?.plan || {};
    const permissions = mySubscription?.permissions || mySubscription?.features || {};

    // 1. Monthly Job Posts
    const jobPostLimit = Number(limits?.job_post_limit ?? limits?.job_posts_limit ?? plan?.job_post_limit ?? 0);
    const jobPostsUsed = Number(usage?.job_posts_used ?? 0);
    const jobPostsRemaining = usage?.job_posts_remaining !== undefined
        ? Number(usage.job_posts_remaining)
        : Math.max(0, jobPostLimit - jobPostsUsed);

    // 2. Active Jobs on Portal
    const activeJobLimit = Number(limits?.active_job_limit ?? plan?.active_job_limit ?? 0);
    const activeJobsCount = Number(usage?.active_jobs_count ?? 0);
    const pendingJobsCount = Number(usage?.pending_jobs_count ?? 0);
    const activeJobsRemaining = usage?.active_jobs_remaining !== undefined
        ? Number(usage.active_jobs_remaining)
        : Math.max(0, activeJobLimit - activeJobsCount);

    // 3. Email Outreach Quota
    const emailLimit = Number(limits?.email_limit ?? plan?.email_limit ?? 0);
    const emailsUsed = Number(usage?.emails_sent ?? usage?.emails_used ?? 0);
    const emailsRemaining = usage?.emails_remaining !== undefined
        ? Number(usage.emails_remaining)
        : Math.max(0, emailLimit - emailsUsed);

    // 4. WhatsApp Outreach Quota
    const whatsappLimit = Number(limits?.whatsapp_limit ?? plan?.whatsapp_limit ?? 0);
    const whatsappUsed = Number(usage?.whatsapp_messages_sent ?? usage?.whatsapp_used ?? 0);
    const whatsappRemaining = usage?.whatsapp_remaining !== undefined
        ? Number(usage.whatsapp_remaining)
        : Math.max(0, whatsappLimit - whatsappUsed);

    // 5. Resume & CV Views
    const resumeViewLimit = Number(limits?.resume_view_limit ?? limits?.resume_views_limit ?? plan?.resume_view_limit ?? 0);
    const resumeViewsUsed = Number(usage?.resume_views_used ?? 0);
    const resumeViewsRemaining = usage?.resume_views_remaining !== undefined
        ? Number(usage.resume_views_remaining)
        : Math.max(0, resumeViewLimit - resumeViewsUsed);

    // 6. Resume Downloads
    const resumeDownloadLimit = Number(limits?.resume_download_limit ?? limits?.resume_downloads_limit ?? plan?.resume_download_limit ?? 0);
    const resumeDownloadsUsed = Number(usage?.resume_downloads_used ?? 0);
    const resumeDownloadsRemaining = usage?.resume_downloads_remaining !== undefined
        ? Number(usage.resume_downloads_remaining)
        : Math.max(0, resumeDownloadLimit - resumeDownloadsUsed);

    // 7. Excel Candidate Exports
    const excelDownloadLimit = Number(limits?.excel_download_limit ?? limits?.excel_downloads_limit ?? plan?.excel_download_limit ?? 0);
    const excelDownloadsUsed = Number(usage?.excel_downloads_used ?? 0);
    const excelDownloadsRemaining = usage?.excel_downloads_remaining !== undefined
        ? Number(usage.excel_downloads_remaining)
        : Math.max(0, excelDownloadLimit - excelDownloadsUsed);

    // 8. Team / Recruiter Seats
    const subRecruiterLimit = Number(limits?.sub_recruiter_limit ?? plan?.sub_recruiter_limit ?? 1);
    const subRecruitersUsed = Number(usage?.sub_recruiters_count ?? usage?.sub_recruiters_used ?? 0);
    const subRecruitersRemaining = usage?.sub_recruiters_remaining !== undefined
        ? Number(usage.sub_recruiters_remaining)
        : Math.max(0, subRecruiterLimit - subRecruitersUsed);

    let cleanPlanTitle = planName;
    if (/custom/i.test(cleanPlanTitle) || mySubscription?.is_custom) {
        cleanPlanTitle = "Custom Plan";
    } else {
        cleanPlanTitle = cleanPlanTitle.replace(/\s*-\s*user\s*\d+/gi, '').trim();
        cleanPlanTitle = cleanPlanTitle.toLowerCase().endsWith('plan') ? cleanPlanTitle : `${cleanPlanTitle} Plan`;
    }
    const formattedPlanTitle = cleanPlanTitle;

    // Quota cards configuration
    const quotaCards = [
        {
            id: 'job_posts',
            title: 'Monthly Job Posts',
            icon: FileText,
            color: 'blue',
            badgeBg: 'bg-blue-50 text-blue-600',
            barColor: 'bg-blue-600',
            used: jobPostsUsed,
            limit: jobPostLimit,
            remaining: jobPostsRemaining,
            remainingText: `${jobPostsRemaining.toLocaleString()} posts remaining this cycle`,
            unit: 'posts',
            hasLimit: jobPostLimit > 0,
        },
        {
            id: 'active_jobs',
            title: 'Active Jobs on Portal',
            icon: Briefcase,
            color: 'emerald',
            badgeBg: 'bg-emerald-50 text-emerald-600',
            barColor: 'bg-emerald-600',
            used: activeJobsCount,
            limit: activeJobLimit,
            remaining: activeJobsRemaining,
            remainingText: `${activeJobsRemaining.toLocaleString()} live slots available${pendingJobsCount > 0 ? ` (${pendingJobsCount} pending)` : ''}`,
            unit: 'slots',
            hasLimit: activeJobLimit > 0,
        },
        {
            id: 'emails',
            title: 'Email Outreach',
            icon: Mail,
            color: 'sky',
            badgeBg: 'bg-sky-50 text-sky-600',
            barColor: 'bg-sky-500',
            used: emailsUsed,
            limit: emailLimit,
            remaining: emailsRemaining,
            remainingText: emailLimit > 0 ? `${emailsRemaining.toLocaleString()} emails remaining` : 'Not included in this plan',
            unit: 'emails',
            hasLimit: emailLimit > 0,
        },
        {
            id: 'whatsapp',
            title: 'WhatsApp Outreach',
            icon: MessageCircle,
            color: 'green',
            badgeBg: 'bg-green-50 text-green-600',
            barColor: 'bg-green-600',
            used: whatsappUsed,
            limit: whatsappLimit,
            remaining: whatsappRemaining,
            remainingText: whatsappLimit > 0 ? `${whatsappRemaining.toLocaleString()} messages remaining` : 'Not included in this plan',
            unit: 'messages',
            hasLimit: whatsappLimit > 0,
        },
        {
            id: 'resume_views',
            title: 'Resume & Profile Views',
            icon: Eye,
            color: 'purple',
            badgeBg: 'bg-purple-50 text-purple-600',
            barColor: 'bg-purple-600',
            used: resumeViewsUsed,
            limit: resumeViewLimit,
            remaining: resumeViewsRemaining,
            remainingText: resumeViewLimit > 0 ? `${resumeViewsRemaining.toLocaleString()} profile views remaining` : 'Not included in this plan',
            unit: 'views',
            hasLimit: resumeViewLimit > 0,
        },
        {
            id: 'resume_downloads',
            title: 'Resume & CV Downloads',
            icon: Download,
            color: 'rose',
            badgeBg: 'bg-rose-50 text-rose-600',
            barColor: 'bg-rose-500',
            used: resumeDownloadsUsed,
            limit: resumeDownloadLimit,
            remaining: resumeDownloadsRemaining,
            remainingText: resumeDownloadLimit > 0 ? `${resumeDownloadsRemaining.toLocaleString()} downloads remaining` : 'Not included in this plan',
            unit: 'downloads',
            hasLimit: resumeDownloadLimit > 0,
        },
        {
            id: 'excel_downloads',
            title: 'Excel Candidate Exports',
            icon: FileSpreadsheet,
            color: 'indigo',
            badgeBg: 'bg-indigo-50 text-indigo-600',
            barColor: 'bg-indigo-600',
            used: excelDownloadsUsed,
            limit: excelDownloadLimit,
            remaining: excelDownloadsRemaining,
            remainingText: excelDownloadLimit > 0 ? `${excelDownloadsRemaining.toLocaleString()} exports remaining` : 'Not included in this plan',
            unit: 'exports',
            hasLimit: excelDownloadLimit > 0,
        },
        {
            id: 'team_seats',
            title: 'Team / Recruiter Seats',
            icon: Users,
            color: 'amber',
            badgeBg: 'bg-amber-50 text-amber-600',
            barColor: 'bg-amber-500',
            used: subRecruitersUsed,
            limit: subRecruiterLimit,
            remaining: subRecruitersRemaining,
            remainingText: `${subRecruitersRemaining.toLocaleString()} seat slots available`,
            unit: 'seats',
            hasLimit: subRecruiterLimit > 0,
        },
    ];

    // Plan features list
    const planFeatures = [
        {
            label: 'Candidate Database Search',
            enabled: permissions?.candidate_search !== false && (resumeViewLimit > 0 || mySubscription?.is_custom),
            desc: 'Search & filter verified candidates'
        },
        {
            label: 'Direct Candidate Outreach (Email)',
            enabled: emailLimit > 0,
            desc: `${emailLimit.toLocaleString()} direct emails per cycle`
        },
        {
            label: 'WhatsApp Candidate Outreach',
            enabled: whatsappLimit > 0,
            desc: `${whatsappLimit.toLocaleString()} direct WhatsApp messages`
        },
        {
            label: 'Resume & CV Downloads',
            enabled: resumeDownloadLimit > 0,
            desc: `${resumeDownloadLimit.toLocaleString()} complete CV downloads`
        },
        {
            label: 'Bulk Excel Candidate Export',
            enabled: excelDownloadLimit > 0,
            desc: `${excelDownloadLimit.toLocaleString()} candidate data exports`
        },
        {
            label: 'Sub-Recruiter Seats',
            enabled: subRecruiterLimit > 1 || permissions?.can_manage_team,
            desc: `${subRecruiterLimit.toLocaleString()} multi-recruiter team seats`
        },
        {
            label: 'Application & Pipeline Tracking',
            enabled: permissions?.application_management !== false,
            desc: 'Stage-by-stage hiring tracker'
        },
        {
            label: 'Interview Scheduling & Notes',
            enabled: permissions?.interview_management !== false,
            desc: 'Candidate interview workflow'
        },
        {
            label: 'Company Branding & Custom Profile',
            enabled: permissions?.company_branding !== false,
            desc: 'Showcase branded employer profile'
        },
        {
            label: 'Automated Email Notifications',
            enabled: permissions?.email_notifications !== false,
            desc: 'Real-time candidate alert emails'
        },
    ];

    if (loadingSubscription) {
        return <BillingSkeleton />;
    }

    return (
        <motion.div
            className="p-6 md:p-10 mx-auto font-sans max-w-7xl"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            {/* Header Section */}
            <motion.div variants={itemVariants} className="mb-6 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                        <Crown className="w-6 h-6" strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-[24px] font-semibold text-gray-900 tracking-tight leading-tight mb-0.5">
                            Job Posting Plans & Quota
                        </h1>
                        <p className="text-gray-500 text-[14px] mb-0">
                            Manage your subscription, real-time job posting quota, outreach credits, and plan status.
                        </p>
                    </div>
                </div>

                {hasActiveSub && (
                    <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shadow-xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Plan Active
                    </span>
                )}
            </motion.div>

            {/* Dynamic Status Banner */}
            <motion.div variants={itemVariants} className="mb-8 relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

                {hasActiveSub ? (
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-3">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-white/10 border-[1.5px] border-white/30 rounded-2xl flex items-center justify-center relative shrink-0 shadow-inner">
                                    <Crown className="w-8 h-8 text-amber-300 z-10" strokeWidth={2} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <h2 className="text-2xl font-bold tracking-wide mb-0">{formattedPlanTitle}</h2>
                                        <span className="bg-emerald-400 text-emerald-950 font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                            Active
                                        </span>
                                    </div>
                                    <p className="text-white/85 text-[14px] mb-2">
                                        Assigned by Super Admin • Billing Cycle: <span className="capitalize font-semibold text-white">{mySubscription.billing_cycle || 'monthly'}</span>
                                    </p>
                                    <div className="flex flex-wrap gap-2.5">
                                        <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg text-xs font-medium border border-white/10 backdrop-blur-xs">
                                            <Clock className="w-3.5 h-3.5 text-amber-300" />
                                            <span>{mySubscription.days_remaining} Days Remaining</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg text-xs font-medium border border-white/10 backdrop-blur-xs">
                                            <Calendar className="w-3.5 h-3.5 text-blue-200" />
                                            <span>Expires {mySubscription.expiry_date ? new Date(mySubscription.expiry_date).toLocaleDateString() : 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                            <button
                                onClick={() => document.getElementById("billing-plans-section")?.scrollIntoView({ behavior: 'smooth' })}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-blue-700 px-5 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition-all shadow-md text-sm whitespace-nowrap cursor-pointer"
                            >
                                <Zap className="w-4 h-4 fill-current text-amber-500" />
                                <span>Request Plan Upgrade</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-transparent border-[1.5px] border-white/30 rounded-full flex items-center justify-center relative shrink-0">
                                <div className="absolute inset-2 bg-white/10 rounded-full"></div>
                                <ShieldCheck className="w-8 h-8 text-white z-10" strokeWidth={1.5} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold mb-1 tracking-wide">No Active Subscription Assigned</h2>
                                <p className="text-white/80 text-[14px] mb-3">Please contact your Super Admin to assign a subscription plan.</p>
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full text-xs font-medium border border-white/10">
                                        <Lock className="w-3.5 h-3.5" /> Plan Controls Enforced
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => document.getElementById("billing-plans-section")?.scrollIntoView({ behavior: 'smooth' })}
                            className="flex items-center justify-center gap-2 bg-white text-blue-600 px-6 py-2.5 rounded-full font-bold hover:bg-gray-50 transition-all shadow-md whitespace-nowrap text-xs"
                        >
                            <Zap className="w-4 h-4 fill-current" /> Browse Plans
                        </button>
                    </div>
                )}
            </motion.div>

            {/* Active Quota & Real-time Usage Section */}
            {hasActiveSub && (
                <motion.div variants={itemVariants} className="mb-10 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-100">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-0.5">Your Real-time Quota & Resource Balances</h3>
                            <p className="text-xs text-gray-500 mb-0">
                                Comprehensive breakdown of job postings, candidate outreach (Email & WhatsApp), CV access, and team seats.
                            </p>
                        </div>
                        <span className="self-start sm:self-auto text-xs font-semibold px-3 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                            Enforced by {formattedPlanTitle}
                        </span>
                    </div>

                    {/* 8-Card Quota Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {quotaCards.map((card) => {
                            const IconComponent = card.icon;
                            const isExhausted = card.hasLimit && card.limit > 0 && card.used >= card.limit;
                            const percentage = card.limit > 0 ? Math.min(100, Math.round((card.used / card.limit) * 100)) : (card.hasLimit ? 100 : 0);

                            return (
                                <div
                                    key={card.id}
                                    className={`p-4 rounded-xl border transition-all ${!card.hasLimit
                                        ? 'bg-gray-50/70 border-gray-100 opacity-70'
                                        : isExhausted
                                            ? 'bg-rose-50/30 border-rose-200'
                                            : 'bg-white border-gray-200/80 hover:border-gray-300 hover:shadow-xs'
                                        } space-y-3`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-2 rounded-lg ${card.badgeBg}`}>
                                                <IconComponent className="w-4 h-4" />
                                            </div>
                                            <span className="font-semibold text-gray-800 text-xs">{card.title}</span>
                                        </div>
                                        <span className="text-xs font-bold text-gray-900">
                                            {card.hasLimit ? (
                                                <>
                                                    {card.used.toLocaleString()}
                                                    <span className="text-gray-400 font-normal"> / {card.limit.toLocaleString()}</span>
                                                </>
                                            ) : (
                                                <span className="text-gray-400 text-[11px] font-normal">Disabled</span>
                                            )}
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${!card.hasLimit
                                                ? 'bg-gray-300'
                                                : isExhausted
                                                    ? 'bg-rose-500'
                                                    : card.barColor
                                                }`}
                                            style={{ width: `${card.hasLimit ? percentage : 0}%` }}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className={`${isExhausted ? 'text-rose-600 font-medium' : 'text-gray-500'}`}>
                                            {card.remainingText}
                                        </span>
                                        {card.hasLimit && card.limit > 0 && (
                                            <span className="font-semibold text-gray-400">
                                                {percentage}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Included Plan Privileges & Permissions */}
                    <div className="pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            <h4 className="text-sm font-bold text-gray-900 mb-0">Included Plan Capabilities & Privileges</h4>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
                            {planFeatures.map((feat, idx) => (
                                <div
                                    key={idx}
                                    className={`p-2.5 rounded-xl border flex items-start gap-2 text-xs transition-colors ${feat.enabled
                                        ? 'bg-emerald-50/40 border-emerald-100 text-gray-800'
                                        : 'bg-gray-50/50 border-gray-100 text-gray-400 opacity-60'
                                        }`}
                                >
                                    {feat.enabled ? (
                                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    ) : (
                                        <XCircle className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                                    )}
                                    <div className="min-w-0">
                                        <div className={`font-semibold truncate ${feat.enabled ? 'text-gray-800' : 'text-gray-500'}`}>
                                            {feat.label}
                                        </div>
                                        <div className="text-[10px] text-gray-400 truncate">
                                            {feat.desc}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Dynamic Plans Section */}
            <motion.div variants={itemVariants} id="billing-plans-section" className="mb-12">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h3 className="text-[22px] font-bold text-gray-900 mb-1">CareerFast Subscription Plans</h3>
                        <p className="text-xs text-gray-500">Choose the job posting plan that fits your organization's hiring volume</p>
                    </div>
                    <div className="flex items-center gap-2 text-[13px] text-gray-500 font-medium">
                        <ShieldCheck className="w-4 h-4 text-green-500" />
                        Dedicated account assistance included
                    </div>
                </div>

                {loadingPlans ? (
                    <PlansSkeletonGrid />
                ) : billingPlans.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                        {billingPlans.map((p) => {
                            const isCurrent = hasActiveSub && (
                                (planId && (p.id === planId || p.plan_id === planId)) ||
                                (planName && (p.name?.toLowerCase() === planName.toLowerCase() || `${p.name?.toLowerCase()} plan` === planName.toLowerCase()))
                            );
                            const isFree = p.slug === 'free' || p.price == 0 || p.name?.toLowerCase().includes('free');
                            const isPro = p.name?.toLowerCase().includes("pro") || p.name?.toLowerCase().includes("premium");

                            return (
                                <motion.div
                                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                                    key={p.id}
                                    className={`relative bg-white rounded-3xl ${isCurrent
                                        ? 'border-2 border-emerald-500 shadow-md ring-1 ring-emerald-400/20'
                                        : isFree
                                            ? 'border-2 border-cyan-400'
                                            : isPro
                                                ? 'border-2 border-blue-500 shadow-sm'
                                                : 'border border-gray-200'
                                        } p-6 flex flex-col justify-between`}
                                >
                                    {isCurrent ? (
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-600 text-white text-[10px] font-bold tracking-widest px-4 py-1.5 rounded-full uppercase shadow-sm">
                                            Current Active Plan
                                        </div>
                                    ) : isFree ? (
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-cyan-600 text-white text-[10px] font-bold tracking-widest px-4 py-1.5 rounded-full uppercase shadow-sm">
                                            Starter Free
                                        </div>
                                    ) : isPro ? (
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-[10px] font-bold tracking-widest px-4 py-1.5 rounded-full uppercase shadow-sm">
                                            Most Popular
                                        </div>
                                    ) : null}

                                    <div>
                                        <div className="mb-4">
                                            <div className={`w-11 h-11 rounded-2xl ${isFree ? 'bg-cyan-50 text-cyan-600' : 'bg-blue-50 text-blue-600'} flex items-center justify-center mb-3`}>
                                                {isFree ? <Zap className="w-5 h-5" /> : <Star className="w-5 h-5" />}
                                            </div>
                                            <h4 className="text-[18px] font-bold text-gray-900 mb-1">{p.name}</h4>
                                            <p className="text-gray-500 text-[12px] leading-relaxed mb-0 min-h-[36px]">
                                                {p.description || "Comprehensive recruitment package with portal management."}
                                            </p>
                                        </div>

                                        <div className="mb-5 flex items-baseline gap-1">
                                            <span className="text-[28px] font-bold text-gray-900 tracking-tight">
                                                {Number(p.price || 0) === 0 ? "Free" : `₹${Number(p.price || p.monthly_price || 0).toLocaleString()}`}
                                            </span>
                                            <span className="text-gray-500 text-[12px] font-medium">
                                                {Number(p.price || 0) === 0 ? ` (${p.validity_days || 60} days)` : `/${p.plan_type || 'month'}`}
                                            </span>
                                        </div>

                                        <div className="mb-6 space-y-2 text-xs text-gray-600 border-t border-gray-100 pt-4">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                                                <span className="font-semibold text-gray-800">
                                                    {isFree ? "20 Job Postings / month" : `${p.job_post_limit || 10} Job Postings / month`}
                                                </span>
                                            </div>
                                            {isFree && (
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                                    <span className="font-semibold text-emerald-700">40 Total Job Postings</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                                                <span className="font-semibold text-gray-800">{p.active_job_limit || 20} Active Job Slots</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                                                <span>{p.sub_recruiter_limit || 1} Team Seat{(p.sub_recruiter_limit || 1) > 1 ? 's' : ''}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                                                <span>{Number(p.email_limit || 0) > 0 ? `${Number(p.email_limit).toLocaleString()} Email Messages` : 'Email Outreach'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                                                <span>{Number(p.whatsapp_limit || 0) > 0 ? `${Number(p.whatsapp_limit).toLocaleString()} WhatsApp Messages` : 'WhatsApp Messaging'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                                                <span>{Number(p.resume_view_limit || 0) > 0 ? `${Number(p.resume_view_limit).toLocaleString()} Resume Views` : 'Resume Database Access'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0" />
                                                <span>{Number(p.resume_download_limit || 0) > 0 ? `${Number(p.resume_download_limit).toLocaleString()} Resume Downloads` : 'Resume Downloads'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                                <span>Applications & Tracking</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                                <span>Recruiter Dashboard</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        {isCurrent ? (
                                            <button
                                                disabled
                                                className="w-full py-2.5 rounded-xl font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs flex items-center justify-center gap-2 cursor-default"
                                            >
                                                <Check className="w-4 h-4" />
                                                Current Plan Active
                                            </button>
                                        ) : isFree ? (
                                            <button
                                                disabled
                                                className="w-full py-2.5 rounded-xl font-medium bg-gray-100 text-gray-600 text-xs flex items-center justify-center gap-2 cursor-default"
                                            >
                                                Default Signup Plan
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => toast.success(`Upgrade request sent for ${p.name}. Super Admin will contact you shortly.`)}
                                                className={`w-full py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-1.5 text-xs ${isPro
                                                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                                                    : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-800'
                                                    }`}
                                            >
                                                Upgrade to {p.name} <ArrowRight className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-gray-50 rounded-2xl p-12 text-center border border-gray-100 border-dashed">
                        <p className="text-gray-500 text-xs">No billing plans currently configured.</p>
                    </div>
                )}
            </motion.div>

            {/* Footer Trust Markers */}
            <motion.div variants={itemVariants} className="mt-12 flex flex-col md:flex-row items-center justify-center gap-8 text-[13px] text-gray-500 font-medium border-t border-gray-100 pt-8 pb-4">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    Strict Plan Bounds Enforcement
                </div>
                <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-blue-500" />
                    Flexible Upgrades & Extensions
                </div>
                <div className="flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-violet-500" />
                    Super Admin Direct Support
                </div>
            </motion.div>
        </motion.div>
    );
};

export default Subscription;
