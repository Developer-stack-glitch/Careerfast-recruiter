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
} from 'lucide-react';
import { getBillingPlans, getMySubscription } from '../ApiService/action';
import { Spin } from 'antd';
import toast from 'react-hot-toast';
import CommonLoader from '../Common/CommonLoader';

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
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const hasActiveSub = mySubscription && mySubscription.status === 'Active' && !mySubscription.is_expired;
    const planName = mySubscription?.plan?.name || mySubscription?.plan_name || 'Recruiter';
    const planId = mySubscription?.plan?.id || mySubscription?.plan_id;
    const limits = mySubscription?.limits || {};
    const usage = mySubscription?.usage || {};

    const jobPostLimit = limits?.job_post_limit ?? limits?.job_posts_limit ?? usage?.job_posts_limit ?? 0;
    const jobPostsUsed = usage?.job_posts_used ?? 0;
    const jobPostsRemaining = usage?.job_posts_remaining ?? Math.max(0, jobPostLimit - jobPostsUsed);

    const activeJobLimit = limits?.active_job_limit ?? usage?.active_job_limit ?? 0;
    const activeJobsCount = usage?.active_jobs_count ?? 0;
    const pendingJobsCount = usage?.pending_jobs_count ?? 0;
    const activeJobsRemaining = usage?.active_jobs_remaining ?? Math.max(0, activeJobLimit - activeJobsCount);

    const formattedPlanTitle = planName.toLowerCase().endsWith('plan') ? planName : `${planName} Plan`;

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
                        <h1 className="text-[24px] font-bold text-gray-900 tracking-tight leading-tight mb-0.5">Job Posting Plans & Quota</h1>
                        <p className="text-gray-500 text-[14px] mb-0">Manage your subscription, real-time job posting quota, and plan status.</p>
                    </div>
                </div>

                {hasActiveSub && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border-1 border-emerald-200 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Plan Active
                    </span>
                )}
            </motion.div>

            {/* Dynamic Status Banner */}
            <motion.div variants={itemVariants} className="mb-8 relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

                {loadingSubscription ? (
                    <div className="py-6 flex items-center justify-center">
                        <Spin size="default" />
                    </div>
                ) : hasActiveSub ? (
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-white/10 border-[1.5px] border-white/30 rounded-2xl flex items-center justify-center relative shrink-0">
                                <Crown className="w-8 h-8 text-amber-300 z-10" strokeWidth={2} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h2 className="text-2xl font-semibold tracking-wide mb-0">{formattedPlanTitle}</h2>
                                    <span className="bg-emerald-400 text-emerald-950 font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                        Active
                                    </span>
                                </div>
                                <p className="text-white/80 text-[14px] mb-3">
                                    Assigned by Super Admin • Billing Cycle: <span className="capitalize font-medium text-white">{mySubscription.billing_cycle || 'monthly'}</span>
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-lg text-xs font-medium border border-white/10">
                                        <Clock className="w-3.5 h-3.5 text-amber-300" />
                                        <span>{mySubscription.days_remaining} Days Remaining</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-lg text-xs font-medium border border-white/10">
                                        <Calendar className="w-3.5 h-3.5 text-blue-200" />
                                        <span>Expires {mySubscription.expiry_date ? new Date(mySubscription.expiry_date).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            <button
                                onClick={() => document.getElementById("billing-plans-section")?.scrollIntoView({ behavior: 'smooth' })}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-blue-700 px-4 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition-all shadow-md text-sm whitespace-nowrap"
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
                <motion.div variants={itemVariants} className="mb-10 bg-white p-6 rounded-2xl border border-gray-100 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-bold text-gray-900 mb-0">Your Real-time Job Posting Quota</h3>
                            <p className="text-xs text-gray-500 mb-0">Limits update in real-time as you create and manage your job listings</p>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                            Enforced by {formattedPlanTitle}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                        {/* Monthly Job Posts */}
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-gray-700">Monthly Job Posts</span>
                                <span className="font-bold text-gray-900">
                                    {jobPostsUsed} / {jobPostLimit}
                                </span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${jobPostLimit > 0 && jobPostsUsed >= jobPostLimit ? 'bg-rose-500' : 'bg-blue-600'
                                        }`}
                                    style={{
                                        width: `${jobPostLimit > 0 ? Math.min((jobPostsUsed / jobPostLimit) * 100, 100) : 0}%`
                                    }}
                                />
                            </div>
                            <span className="text-[11px] text-gray-400 block">
                                {jobPostsRemaining} posts remaining this cycle
                            </span>
                        </div>

                        {/* Active Jobs */}
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-gray-700">Active Jobs on Portal</span>
                                <span className="font-bold text-gray-900">
                                    {activeJobsCount} / {activeJobLimit}
                                </span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${activeJobLimit > 0 && activeJobsCount >= activeJobLimit ? 'bg-rose-500' : 'bg-emerald-600'
                                        }`}
                                    style={{
                                        width: `${activeJobLimit > 0 ? Math.min((activeJobsCount / activeJobLimit) * 100, 100) : 0}%`
                                    }}
                                />
                            </div>
                            <span className="text-[11px] text-gray-400 block">
                                {activeJobsRemaining} live slots available{pendingJobsCount > 0 ? ` (${pendingJobsCount} pending review)` : ''}
                            </span>
                        </div>

                        {/* Team Seats */}
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-gray-700">Team / Recruiter Seats</span>
                                <span className="font-bold text-gray-900">
                                    {limits?.sub_recruiter_limit || 1} Seat{(limits?.sub_recruiter_limit || 1) > 1 ? 's' : ''}
                                </span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-violet-600"
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <span className="text-[11px] text-gray-400 block">
                                Sub-recruiter user access enabled
                            </span>
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
                    <CommonLoader fullScreen={false} text="Loading Subscription Plans..." />
                ) : billingPlans.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                        {billingPlans.map((p) => {
                            const isCurrent = hasActiveSub && (
                                (planId && (p.id === planId || p.plan_id === planId)) ||
                                (planName && (p.name?.toLowerCase() === planName.toLowerCase() || `${p.name?.toLowerCase()} plan` === planName.toLowerCase()))
                            );
                            const isPro = p.name?.toLowerCase().includes("pro") || p.name?.toLowerCase().includes("premium");

                            return (
                                <motion.div
                                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                                    key={p.id}
                                    className={`relative bg-white rounded-3xl ${isCurrent
                                        ? 'border-2 border-emerald-500'
                                        : isPro
                                            ? 'border-2 border-blue-500'
                                            : 'border border-gray-200'
                                        } p-8 flex flex-col justify-between`}
                                >
                                    {isCurrent ? (
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-600 text-white text-[10px] font-bold tracking-widest px-6 py-1.5 rounded-full uppercase">
                                            Current Active Plan
                                        </div>
                                    ) : isPro ? (
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-[10px] font-bold tracking-widest px-6 py-1.5 rounded-full uppercase">
                                            Most Popular
                                        </div>
                                    ) : null}

                                    <div>
                                        <div className="mb-4">
                                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                                                <Star className="w-6 h-6" />
                                            </div>
                                            <h4 className="text-[20px] font-bold text-gray-900 mb-1">{p.name}</h4>
                                            <p className="text-gray-500 text-[13px] leading-relaxed mb-0">
                                                {p.description || "Job posting package with portal management."}
                                            </p>
                                        </div>

                                        <div className="mb-6 flex items-baseline gap-1">
                                            <span className="text-[32px] font-bold text-gray-900 tracking-tight">
                                                ₹{Number(p.price || p.monthly_price || 0).toLocaleString()}
                                            </span>
                                            <span className="text-gray-500 text-[13px] font-medium">/{p.plan_type || 'month'}</span>
                                        </div>

                                        <div className="mb-6 space-y-2 text-xs text-gray-600 border-t border-gray-100 pt-4">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                                                <span className="font-semibold text-gray-800">{p.job_post_limit || 10} Job Postings / month</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                                                <span className="font-semibold text-gray-800">{p.active_job_limit || 5} Active Job Slots</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                                                <span>{p.sub_recruiter_limit || 1} Team Seat{(p.sub_recruiter_limit || 1) > 1 ? 's' : ''} Included</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                                <span>Applications & Applicant Tracking</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                                <span>Recruiter Dashboard & Interview Management</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        {isCurrent ? (
                                            <button
                                                disabled
                                                className="w-full py-3 rounded-xl font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs flex items-center justify-center gap-2 cursor-default"
                                            >
                                                <Check className="w-4 h-4" />
                                                Current Plan Active
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => toast.success("Upgrade request sent to Super Admin. Our account team will contact you shortly.")}
                                                className={`w-full py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-sm ${isPro
                                                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                                                    : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-800'
                                                    }`}
                                            >
                                                Request Upgrade to {p.name} <ArrowRight className="w-3.5 h-3.5" />
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
