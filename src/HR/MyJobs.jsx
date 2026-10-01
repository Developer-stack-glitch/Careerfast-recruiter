'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Dropdown, Tooltip } from 'antd';
import {
    getJobPostByUserId,
    expireJobPost,
    makeJobActive,
    getJobCategoryData,
    deleteJobPost,
    getMySubscription
} from '../ApiService/action';
import {
    Briefcase,
    Users,
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
    Search,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Edit3,
    Eye,
    MoreVertical,
    Plus,
    MapPin,
    Building2,
    Calendar,
    Copy,
    Trash2,
    ExternalLink,
    RotateCcw,
    X,
    Check,
    ArrowUpRight,
    DollarSign,
    Sparkles,
    UserCheck,
    Filter,
    Lock
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const MyJobs = () => {
    const [recruiterDetails, setRecruiterDetails] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const [overallStats, setOverallStats] = useState({
        totalJobs: 0,
        openJobs: 0,
        pendingJobs: 0,
        rejectedJobs: 0,
        closedJobs: 0,
        jobsCount: 0,
        internshipsCount: 0,
        totalApplications: 0
    });

    // Filters
    const [statusFilter, setStatusFilter] = useState('All Jobs');
    const [sortFilter, setSortFilter] = useState('Newest First');
    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

    const [jobTypeFilter, setJobTypeFilter] = useState('All Types');
    const [isJobTypeDropdownOpen, setIsJobTypeDropdownOpen] = useState(false);

    const [availableCategories, setAvailableCategories] = useState([]);
    const [categoryFilter, setCategoryFilter] = useState('All Categories');
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

    // Pagination
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Delete Modal
    const [deleteModalJob, setDeleteModalJob] = useState(null);
    const [isActionLoading, setIsActionLoading] = useState(false);

    // Fetch Categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await getJobCategoryData();
                if (res?.data?.data) {
                    setAvailableCategories(res.data.data);
                } else if (res?.data) {
                    setAvailableCategories(res.data);
                }
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };
        fetchCategories();
    }, []);

    // Get Logged In User & Subscription Limits
    const [subscription, setSubscription] = useState(null);
    useEffect(() => {
        const details = localStorage.getItem('loginDetails');
        if (details) {
            try {
                setRecruiterDetails(JSON.parse(details));
            } catch (e) {
                console.error("Error parsing login details:", e);
            }
        }
        getMySubscription().then(res => {
            if (res?.success && res?.data) {
                setSubscription(res.data);
            }
        }).catch(() => {});
    }, []);

    const isSubRecruiter = Boolean(subscription?.is_sub_recruiter || recruiterDetails?.is_sub_recruiter);
    const isCompanyLimitReached = Boolean(subscription?.company_limit_reached || subscription?.can_post_jobs === false);
    const isPostingRestricted = isSubRecruiter && isCompanyLimitReached;

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 350);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Close open dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = () => {
            setOpenDropdownId(null);
            setIsSortDropdownOpen(false);
            setIsJobTypeDropdownOpen(false);
            setIsCategoryDropdownOpen(false);
        };
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    // Reset pagination on filter changes
    useEffect(() => {
        setPage(1);
    }, [debouncedSearchQuery, statusFilter, sortFilter, jobTypeFilter, categoryFilter]);

    // Fetch Jobs List
    const fetchJobs = useCallback(async () => {
        if (!recruiterDetails?.id) return;
        try {
            setLoading(true);

            let selectedStatuses = [];
            if (statusFilter === 'Active') selectedStatuses = ['active'];
            else if (statusFilter === 'Pending') selectedStatuses = ['pending'];
            else if (statusFilter === 'Expired' || statusFilter === 'Closed') selectedStatuses = ['closed'];

            let selectedCategories = [];
            if (categoryFilter !== 'All Categories') selectedCategories = [categoryFilter];

            let selectedJobNature = '';
            if (jobTypeFilter !== 'All Types') selectedJobNature = jobTypeFilter;

            const res = await getJobPostByUserId({
                user_id: recruiterDetails.id,
                limit: limit,
                page: page,
                search: debouncedSearchQuery,
                statuses: selectedStatuses.length > 0 ? JSON.stringify(selectedStatuses) : undefined,
                categories: selectedCategories.length > 0 ? JSON.stringify(selectedCategories) : undefined,
                job_nature: selectedJobNature || undefined,
                sort: sortFilter === 'Oldest First' ? 'ASC' : 'DESC'
            });

            if (res?.data?.data) {
                setJobs(res.data.data);
                const total = res.data.total || 0;
                setTotalCount(total);
                setTotalPages(Math.ceil(total / limit) || 1);

                if (res.data.stats) {
                    setOverallStats({
                        totalJobs: total,
                        openJobs: Number(res.data.stats.openJobs) || 0,
                        pendingJobs: Number(res.data.stats.pendingJobs) || 0,
                        rejectedJobs: Number(res.data.stats.rejectedJobs) || 0,
                        closedJobs: Number(res.data.stats.closedJobs) || 0,
                        jobsCount: Number(res.data.stats.jobsCount) || 0,
                        internshipsCount: Number(res.data.stats.internshipsCount) || 0,
                        totalApplications: Number(res.data.stats.totalApplications) || 0,
                    });
                }
            } else {
                setJobs([]);
                setTotalCount(0);
                setTotalPages(1);
            }
        } catch (error) {
            console.error("Error fetching jobs", error);
            toast.error("Failed to load jobs");
        } finally {
            setLoading(false);
        }
    }, [recruiterDetails, page, limit, statusFilter, sortFilter, jobTypeFilter, categoryFilter, debouncedSearchQuery]);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    // Handle Expire Job
    const handleExpireJob = async (jobId) => {
        try {
            setIsActionLoading(true);
            const res = await expireJobPost({ id: jobId });
            if (res?.data) {
                setJobs(prevJobs => prevJobs.map(job =>
                    job.id === jobId ? { ...job, is_closed: 1 } : job
                ));
                setOverallStats(prev => ({
                    ...prev,
                    openJobs: Math.max(0, prev.openJobs - 1),
                    closedJobs: prev.closedJobs + 1
                }));
                toast.success('Job marked as expired successfully!');
            } else {
                toast.error('Failed to update job status.');
            }
        } catch (error) {
            console.error("Error expiring job", error);
            const errMsg = error.response?.data?.details || error.response?.data?.message || 'An error occurred while expiring the job.';
            toast.error(errMsg, { duration: 6000 });
        } finally {
            setIsActionLoading(false);
            setOpenDropdownId(null);
        }
    };

    // Handle Make Active
    const handleMakeActive = async (jobId) => {
        try {
            setIsActionLoading(true);
            const res = await makeJobActive({ id: jobId });
            if (res?.data) {
                setJobs(prevJobs => prevJobs.map(job =>
                    job.id === jobId ? { ...job, is_closed: 0 } : job
                ));
                setOverallStats(prev => ({
                    ...prev,
                    openJobs: prev.openJobs + 1,
                    closedJobs: Math.max(0, prev.closedJobs - 1)
                }));
                toast.success('Job marked as active successfully!');
            } else {
                toast.error('Failed to activate job.');
            }
        } catch (error) {
            console.error("Error making job active", error);
            const errMsg = error.response?.data?.details || error.response?.data?.message || 'An error occurred while activating the job.';
            toast.error(errMsg, { duration: 6000 });
        } finally {
            setIsActionLoading(false);
            setOpenDropdownId(null);
        }
    };

    // Handle Delete Job Post
    const handleDeleteJob = async () => {
        if (!deleteModalJob) return;
        try {
            setIsActionLoading(true);
            await deleteJobPost({ id: deleteModalJob.id });
            setJobs(prev => prev.filter(j => j.id !== deleteModalJob.id));
            setTotalCount(prev => Math.max(0, prev - 1));
            setOverallStats(prev => ({
                ...prev,
                totalJobs: Math.max(0, prev.totalJobs - 1),
                openJobs: (deleteModalJob.is_closed === 0 && deleteModalJob.approval_status === 'approved') ? Math.max(0, prev.openJobs - 1) : prev.openJobs,
                pendingJobs: (deleteModalJob.is_closed === 0 && (deleteModalJob.approval_status === 'pending' || !deleteModalJob.approval_status)) ? Math.max(0, prev.pendingJobs - 1) : prev.pendingJobs,
                closedJobs: deleteModalJob.is_closed === 1 ? Math.max(0, prev.closedJobs - 1) : prev.closedJobs,
            }));
            toast.success('Job posting deleted successfully');
            setDeleteModalJob(null);
        } catch (error) {
            console.error("Error deleting job", error);
            const errMsg = error.response?.data?.details || error.response?.data?.message || 'Failed to delete job posting';
            toast.error(errMsg, { duration: 6000 });
        } finally {
            setIsActionLoading(false);
            setOpenDropdownId(null);
        }
    };

    // Copy Job URL
    const handleCopyLink = (jobId) => {
        if (typeof window === 'undefined') return;
        const url = `https://careerfast.in/job-details/${jobId}`;
        navigator.clipboard.writeText(url);
        toast.success('Job link copied to clipboard!');
        setOpenDropdownId(null);
    };

    // Helper: format currency / salary
    const formatSalary = (min, max, type) => {
        if (!min && !max) return 'Best in Industry';
        const formatAmount = (num) => {
            if (!num) return '';
            const n = Number(num);
            if (isNaN(n)) return num;
            if (n >= 100000) return `${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)} LPA`;
            if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
            return `${n}`;
        };
        if (min && max) return `₹${formatAmount(min)} - ₹${formatAmount(max)}`;
        if (min) return `From ₹${formatAmount(min)}`;
        if (max) return `Up to ₹${formatAmount(max)}`;
        return 'Competitive';
    };

    // Helper: format location
    const formatLocation = (loc) => {
        if (!loc) return 'Remote / Pan India';
        if (Array.isArray(loc)) {
            if (loc.length === 0) return 'Remote / Pan India';
            const names = loc.map(l => typeof l === 'object' ? (l.city || l.name || JSON.stringify(l)) : l).filter(Boolean);
            return names.length > 0 ? names.join(', ') : 'Remote / Pan India';
        }
        if (typeof loc === 'string') {
            try {
                const parsed = JSON.parse(loc);
                if (Array.isArray(parsed)) return parsed.join(', ');
                return parsed;
            } catch {
                return loc;
            }
        }
        return String(loc);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
            window.scrollTo({ top: 120, behavior: 'smooth' });
        }
    };

    const hasActiveFilters = searchQuery !== '' || statusFilter !== 'All Jobs' || jobTypeFilter !== 'All Types' || categoryFilter !== 'All Categories';

    const clearAllFilters = () => {
        setSearchQuery('');
        setStatusFilter('All Jobs');
        setJobTypeFilter('All Types');
        setCategoryFilter('All Categories');
        setSortFilter('Newest First');
        setPage(1);
    };

    return (
        <div
            className="min-h-screen bg-[#F8FAFC] font-sans pb-20 text-slate-800 relative select-none"
            onClick={() => {
                setOpenDropdownId(null);
                setIsSortDropdownOpen(false);
                setIsJobTypeDropdownOpen(false);
                setIsCategoryDropdownOpen(false);
            }}
        >
            {/* Top Glow Accent */}
            <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-blue-50/60 to-transparent pointer-events-none" />

            <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-4 pt-8 relative z-10">

                {/* 1. Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-7">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#0A66C2] border-1 border-blue-100">
                                <Sparkles size={13} className="text-[#0A66C2]" />
                                Recruiter Workspace
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-xs font-medium text-slate-500">
                                {totalCount} Job Listings
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight mb-0">
                            My Posted Jobs
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl mb-0">
                            Manage your job requisitions, track active candidate applications, and control posting visibility in real time.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {isPostingRestricted ? (
                            <button
                                type="button"
                                onClick={() => alert(subscription?.limit_reason || "Job posting is locked because the company's plan limits are reached. All active job slots or monthly posts are in use.")}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed shadow-2xs"
                                title={subscription?.limit_reason || "Company plan limit reached"}
                            >
                                <Lock size={15} />
                                <span>Post a New Job (Quota Full)</span>
                            </button>
                        ) : (
                            <Link
                                href="/post-job"
                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-white bg-[#0A66C2] hover:bg-[#004182] shadow-sm shadow-blue-600/20 hover:shadow-md hover:shadow-blue-600/30 transition-all active:scale-[0.98] no-underline hover:no-underline"
                            >
                                <Plus size={16} strokeWidth={2.5} />
                                <span>Post a New Job</span>
                            </Link>
                        )}
                    </div>
                </div>

                {/* 2. Interactive KPI Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                    {/* Card 1: Total Jobs */}
                    <div
                        onClick={() => { setStatusFilter('All Jobs'); setPage(1); }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer bg-white ${statusFilter === 'All Jobs'
                            ? 'border-[#0A66C2] ring-2 ring-[#0A66C2]/15 shadow-sm'
                            : 'border-slate-200/80 hover:border-slate-300'
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[14px] font-semibold text-slate-600">Total Jobs</span>
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#0A66C2]">
                                <Briefcase size={16} />
                            </div>
                        </div>
                        <div className="mt-1 flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-slate-900">
                                {overallStats.totalJobs || totalCount || 0}
                            </span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                            <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-medium">{overallStats.jobsCount || 0} Jobs</span>
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-medium">{overallStats.internshipsCount || 0} Internships</span>
                            </div>
                            <ChevronRight size={13} className="text-slate-400" />
                        </div>
                    </div>

                    {/* Card 2: Active Jobs */}
                    <div
                        onClick={() => { setStatusFilter('Active'); setPage(1); }}
                        className={`p-4 rounded-xl border transition-all cursor-pointer bg-white ${statusFilter === 'Active'
                            ? 'border-emerald-500 ring-2 ring-emerald-500/10 shadow-sm'
                            : 'border-slate-200/80 hover:border-slate-300'
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[14px] font-semibold text-slate-600">Active</span>
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 relative">
                                <CheckCircle2 size={16} />
                                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                            </div>
                        </div>
                        <div className="mt-1 flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-emerald-600">
                                {overallStats.openJobs || 0}
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">Live</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                            <span>Accepting resumes</span>
                            <ChevronRight size={13} className="text-slate-400" />
                        </div>
                    </div>

                    {/* Card 3: Pending Approval */}
                    <div
                        onClick={() => { setStatusFilter('Pending'); setPage(1); }}
                        className={`p-4 rounded-xl border transition-all cursor-pointer bg-white ${statusFilter === 'Pending'
                            ? 'border-amber-500 ring-2 ring-amber-500/10 shadow-sm'
                            : 'border-slate-200/80 hover:border-slate-300'
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[14px] font-semibold text-slate-600">Pending</span>
                            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 relative">
                                <Clock size={16} />
                                {overallStats.pendingJobs > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="mt-1 flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-amber-600">
                                {overallStats.pendingJobs || 0}
                            </span>
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">Under Review</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                            <span>Awaiting admin</span>
                            <ChevronRight size={13} className="text-slate-400" />
                        </div>
                    </div>

                    {/* Card 4: Expired / Closed */}
                    <div
                        onClick={() => { setStatusFilter('Expired'); setPage(1); }}
                        className={`p-4 rounded-xl border transition-all cursor-pointer bg-white ${statusFilter === 'Expired'
                            ? 'border-amber-500 ring-2 ring-amber-500/10 shadow-sm'
                            : 'border-slate-200/80 hover:border-slate-300'
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[14px] font-semibold text-slate-600">Expired</span>
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                                <Clock size={16} />
                            </div>
                        </div>
                        <div className="mt-1 flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-slate-700">
                                {overallStats.closedJobs || 0}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">Archived</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                            <span>Can re-open anytime</span>
                            <ChevronRight size={13} className="text-slate-400" />
                        </div>
                    </div>
                </div>

                {/* 3. Filter Bar & Search Controls */}
                <div className="p-3.5 mb-4">
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">

                        {/* Search Input */}
                        <div className="relative flex-1 min-w-[260px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search by job title, location, or keywords..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2] transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                                >
                                    <X size={13} />
                                </button>
                            )}
                        </div>

                        {/* Status Tabs */}
                        <div className="flex items-center bg-slate-200 p-1 rounded-lg gap-1 overflow-x-auto">
                            {['All Jobs', 'Active', 'Pending', 'Expired'].map((status) => {
                                const isSelected = statusFilter === status;
                                return (
                                    <button
                                        key={status}
                                        onClick={() => {
                                            setStatusFilter(status);
                                            setPage(1);
                                        }}
                                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap ${isSelected
                                            ? 'bg-white text-[#0A66C2] shadow-xs font-semibold'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                                            }`}
                                    >
                                        {status === 'Pending' ? 'Pending Approval' : status}
                                        {status === 'Active' && overallStats.openJobs > 0 && (
                                            <span className="ml-1.5 px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                                                {overallStats.openJobs}
                                            </span>
                                        )}
                                        {status === 'Pending' && overallStats.pendingJobs > 0 && (
                                            <span className="ml-1.5 px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold">
                                                {overallStats.pendingJobs}
                                            </span>
                                        )}
                                        {status === 'Expired' && overallStats.closedJobs > 0 && (
                                            <span className="ml-1.5 px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[10px] font-bold">
                                                {overallStats.closedJobs}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Dropdown Filters */}
                        <div className="flex flex-wrap items-center gap-2">

                            {/* Job Type Dropdown */}
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsJobTypeDropdownOpen(!isJobTypeDropdownOpen);
                                        setIsCategoryDropdownOpen(false);
                                        setIsSortDropdownOpen(false);
                                    }}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-medium transition-all ${jobTypeFilter !== 'All Types'
                                        ? 'border-blue-300 bg-blue-50/60 text-[#0A66C2] font-semibold'
                                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                        }`}
                                >
                                    <span className="text-slate-400 font-normal">Type:</span>
                                    <span>{jobTypeFilter}</span>
                                    <ChevronDown size={13} className="text-slate-400" />
                                </button>

                                <AnimatePresence>
                                    {isJobTypeDropdownOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 6 }}
                                            transition={{ duration: 0.1 }}
                                            className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-100 rounded-xl shadow-xl z-50 py-1 overflow-hidden"
                                        >
                                            {['All Types', 'Full Time', 'Part Time', 'Internship', 'Contract'].map((type) => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => {
                                                        setJobTypeFilter(type);
                                                        setIsJobTypeDropdownOpen(false);
                                                    }}
                                                    className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium text-left transition-colors ${jobTypeFilter === type
                                                        ? 'bg-blue-50 text-[#0A66C2] font-semibold'
                                                        : 'text-slate-700 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    <span>{type}</span>
                                                    {jobTypeFilter === type && <Check size={13} className="text-[#0A66C2]" />}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Category Dropdown */}
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                                        setIsJobTypeDropdownOpen(false);
                                        setIsSortDropdownOpen(false);
                                    }}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-medium transition-all ${categoryFilter !== 'All Categories'
                                        ? 'border-blue-300 bg-blue-50/60 text-[#0A66C2] font-semibold'
                                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                        }`}
                                >
                                    <span className="text-slate-400 font-normal">Category:</span>
                                    <span className="truncate max-w-[80px]">{categoryFilter}</span>
                                    <ChevronDown size={13} className="text-slate-400" />
                                </button>

                                <AnimatePresence>
                                    {isCategoryDropdownOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 6 }}
                                            transition={{ duration: 0.1 }}
                                            className="absolute right-0 top-full mt-1 w-52 max-h-60 overflow-y-auto bg-white border border-slate-100 rounded-xl shadow-xl z-50 py-1"
                                        >
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setCategoryFilter('All Categories');
                                                    setIsCategoryDropdownOpen(false);
                                                }}
                                                className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium text-left transition-colors ${categoryFilter === 'All Categories'
                                                    ? 'bg-blue-50 text-[#0A66C2] font-semibold'
                                                    : 'text-slate-700 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <span>All Categories</span>
                                                {categoryFilter === 'All Categories' && <Check size={13} className="text-[#0A66C2]" />}
                                            </button>
                                            {availableCategories.map((cat) => {
                                                const catName = typeof cat === 'object' ? (cat.category_name || cat.name) : cat;
                                                return (
                                                    <button
                                                        key={cat.id || catName}
                                                        type="button"
                                                        onClick={() => {
                                                            setCategoryFilter(catName);
                                                            setIsCategoryDropdownOpen(false);
                                                        }}
                                                        className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium text-left transition-colors truncate ${categoryFilter === catName
                                                            ? 'bg-blue-50 text-[#0A66C2] font-semibold'
                                                            : 'text-slate-700 hover:bg-slate-50'
                                                            }`}
                                                    >
                                                        <span className="truncate">{catName}</span>
                                                        {categoryFilter === catName && <Check size={13} className="text-[#0A66C2] flex-shrink-0" />}
                                                    </button>
                                                );
                                            })}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Sort Dropdown */}
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsSortDropdownOpen(!isSortDropdownOpen);
                                        setIsJobTypeDropdownOpen(false);
                                        setIsCategoryDropdownOpen(false);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium bg-white text-slate-700 hover:border-slate-300 transition-all"
                                >
                                    <span className="text-slate-400 font-normal">Sort:</span>
                                    <span>{sortFilter}</span>
                                    <ChevronDown size={13} className="text-slate-400" />
                                </button>

                                <AnimatePresence>
                                    {isSortDropdownOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 6 }}
                                            transition={{ duration: 0.1 }}
                                            className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-100 rounded-xl shadow-xl z-50 py-1 overflow-hidden"
                                        >
                                            {['Newest First', 'Oldest First'].map((sort) => (
                                                <button
                                                    key={sort}
                                                    type="button"
                                                    onClick={() => {
                                                        setSortFilter(sort);
                                                        setIsSortDropdownOpen(false);
                                                    }}
                                                    className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium text-left transition-colors ${sortFilter === sort
                                                        ? 'bg-blue-50 text-[#0A66C2] font-semibold'
                                                        : 'text-slate-700 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    <span>{sort}</span>
                                                    {sortFilter === sort && <Check size={13} className="text-[#0A66C2]" />}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                        </div>
                    </div>

                    {/* Active Filter Tags */}
                    {hasActiveFilters && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-2.5 mt-2.5 border-t border-slate-100 text-xs">
                            <span className="text-slate-400 text-[11px]">Filters:</span>
                            {searchQuery && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px]">
                                    &quot;{searchQuery}&quot;
                                    <X size={11} className="cursor-pointer hover:text-red-500" onClick={() => setSearchQuery('')} />
                                </span>
                            )}
                            {statusFilter !== 'All Jobs' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-[#0A66C2] rounded text-[11px]">
                                    {statusFilter}
                                    <X size={11} className="cursor-pointer hover:text-red-500" onClick={() => setStatusFilter('All Jobs')} />
                                </span>
                            )}
                            {jobTypeFilter !== 'All Types' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-[#0A66C2] rounded text-[11px]">
                                    {jobTypeFilter}
                                    <X size={11} className="cursor-pointer hover:text-red-500" onClick={() => setJobTypeFilter('All Types')} />
                                </span>
                            )}
                            {categoryFilter !== 'All Categories' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-[#0A66C2] rounded text-[11px]">
                                    {categoryFilter}
                                    <X size={11} className="cursor-pointer hover:text-red-500" onClick={() => setCategoryFilter('All Categories')} />
                                </span>
                            )}
                            <button
                                onClick={clearAllFilters}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0A66C2] hover:text-[#004182] ml-auto"
                            >
                                <RotateCcw size={11} />
                                Reset
                            </button>
                        </div>
                    )}
                </div>

                {/* 4. Professional Enterprise Table */}
                <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto min-h-[380px]">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#F8FAFC] border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider select-none">
                                    <th className="py-3 px-4">Job Details</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4">Type & Compensation</th>
                                    <th className="py-3 px-4 text-center">Applicants</th>
                                    <th className="py-3 px-4">Posted Date</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {loading ? (
                                    // Table Skeletons
                                    [1, 2, 3, 4, 5, 6].map((idx) => (
                                        <tr key={idx} className="animate-pulse">
                                            <td className="py-4 px-4">
                                                <div className="h-4 w-48 bg-slate-200 rounded mb-1.5"></div>
                                                <div className="h-3 w-32 bg-slate-100 rounded"></div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="h-6 w-20 bg-slate-200 rounded-full"></div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="h-4 w-24 bg-slate-200 rounded mb-1"></div>
                                                <div className="h-3 w-28 bg-slate-100 rounded"></div>
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <div className="h-6 w-14 bg-slate-100 rounded-lg mx-auto"></div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="h-3.5 w-24 bg-slate-100 rounded"></div>
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <div className="h-8 w-28 bg-slate-200 rounded-lg ml-auto"></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : jobs.length > 0 ? (
                                    jobs.map((job, index) => {
                                        const isExpired = job.is_closed === 1;
                                        const candidateCount = Number(job.candidates_count) || 0;

                                        return (
                                            <tr
                                                key={job.id}
                                                className={`transition-colors duration-150 group ${openDropdownId === job.id ? 'bg-blue-50/30' : 'hover:bg-slate-50/80'
                                                    }`}
                                            >
                                                {/* 1. Job Details */}
                                                <td className="py-4 px-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-9 h-9 rounded-lg bg-blue-50/80 border border-blue-100 flex items-center justify-center text-[#0A66C2] flex-shrink-0 mt-0.5 group-hover:bg-[#0A66C2] group-hover:text-white transition-colors">
                                                            <Briefcase size={16} />
                                                        </div>
                                                        <div className="max-w-md">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <Link
                                                                    href={`/applicants/${job.id}`}
                                                                    className="font-bold text-slate-900 text-sm hover:text-[#0A66C2] transition-colors no-underline line-clamp-1"
                                                                >
                                                                    {job.job_title}
                                                                </Link>
                                                                {job.workplace_type && (
                                                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200/60">
                                                                        {job.workplace_type}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-slate-500 text-[11px] mt-1 flex-wrap">
                                                                <span className="flex items-center gap-1 font-medium text-slate-600">
                                                                    <Building2 size={12} className="text-slate-400" />
                                                                    {job.company_name || 'Careerfast'}
                                                                </span>
                                                                <span>•</span>
                                                                <span className="flex items-center gap-1">
                                                                    <MapPin size={12} className="text-slate-400" />
                                                                    {formatLocation(job.work_location)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* 2. Status Badge */}
                                                <td className="py-4 px-4 whitespace-nowrap">
                                                    {isExpired ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200/60">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                                            Expired / Closed
                                                        </span>
                                                    ) : job.approval_status === 'rejected' ? (
                                                        <Tooltip title={job.rejection_reason ? `Rejected: ${job.rejection_reason}` : "Job posting was rejected by admin."}>
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60 cursor-help">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                                                Rejected
                                                            </span>
                                                        </Tooltip>
                                                    ) : (job.approval_status === 'pending' || !job.approval_status) ? (
                                                        <Tooltip title="Under review by Careerfast admin. Usually approved within a few hours.">
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border-1 border-amber-200/60 cursor-help">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                                                Pending Approval
                                                            </span>
                                                        </Tooltip>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border-1 border-emerald-200/60">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                            Active Listing
                                                        </span>
                                                    )}
                                                </td>

                                                {/* 3. Type & Compensation */}
                                                <td className="py-4 px-4 whitespace-nowrap">
                                                    <div className="font-semibold text-slate-800 text-xs">
                                                        {job.job_nature || job.job_type || 'Full Time'}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-slate-500 text-[11px] mt-0.5">
                                                        <DollarSign size={12} className="text-slate-400" />
                                                        <span>{formatSalary(job.min_salary, job.max_salary, job.salary_type)}</span>
                                                    </div>
                                                </td>

                                                {/* 4. Applications */}
                                                <td className="py-4 px-4 whitespace-nowrap text-center">
                                                    <Link
                                                        href={`/recruiter/applicants/${job.id}`}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50/80 hover:bg-blue-100 text-[#0A66C2] font-bold transition-colors no-underline group/btn"
                                                    >
                                                        <Users size={13} className="text-[#0A66C2]" />
                                                        <span>{candidateCount}</span>
                                                        <span className="text-[10px] font-medium text-[#0A66C2] group-hover/btn:underline">
                                                            {candidateCount === 1 ? 'applicant' : 'applicants'}
                                                        </span>
                                                    </Link>
                                                </td>

                                                {/* 5. Posted Date */}
                                                <td className="py-4 px-4 whitespace-nowrap">
                                                    <div className="text-slate-800 font-medium text-xs">
                                                        {job.created_at ? format(new Date(job.created_at), 'MMM dd, yyyy') : 'Recently'}
                                                    </div>
                                                    <div className="text-slate-400 text-[10px] mt-0.5">
                                                        {job.created_at ? formatDistanceToNow(new Date(job.created_at), { addSuffix: true }) : ''}
                                                    </div>
                                                </td>

                                                {/* 6. Actions */}
                                                <td className="py-4 px-4 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link
                                                            href={`/recruiter/applicants/${job.id}`}
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#0A66C2] hover:bg-[#004182] shadow-xs hover:shadow-blue-600/20 transition-all no-underline active:scale-[0.98]"
                                                        >
                                                            <span>Candidates</span>
                                                            <ArrowUpRight size={13} />
                                                        </Link>

                                                        {/* More Dropdown */}
                                                        <Dropdown
                                                            menu={{
                                                                className: "w-44 p-1 rounded-xl shadow-lg border border-slate-100",
                                                                items: [
                                                                    {
                                                                        key: 'edit',
                                                                        label: (
                                                                            <Link href={`/edit-job/${job.id}`} className="flex items-center gap-2.5 py-0.5 text-xs font-medium text-slate-700 hover:text-[#0A66C2] no-underline">
                                                                                <Edit3 size={14} className="text-slate-400" />
                                                                                <span>Edit Job</span>
                                                                            </Link>
                                                                        ),
                                                                    },
                                                                    {
                                                                        key: 'preview',
                                                                        label: (
                                                                            <a
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                href={`https://careerfast.in/job-details/${job.id}?preview=true`}
                                                                                className="flex items-center gap-2.5 py-0.5 text-xs font-medium text-slate-700 hover:text-slate-900 no-underline"
                                                                            >
                                                                                <Eye size={14} className="text-slate-400" />
                                                                                <span>Preview</span>
                                                                            </a>
                                                                        ),
                                                                    },
                                                                    {
                                                                        key: 'copy',
                                                                        label: (
                                                                            <div className="flex items-center gap-2.5 py-0.5 text-xs font-medium text-slate-700 hover:text-slate-900">
                                                                                <Copy size={14} className="text-slate-400" />
                                                                                <span>Copy Link</span>
                                                                            </div>
                                                                        ),
                                                                        onClick: () => handleCopyLink(job.id),
                                                                    },
                                                                    {
                                                                        type: 'divider',
                                                                    },
                                                                    ...(isExpired ? [{
                                                                        key: 'active',
                                                                        label: (
                                                                            <div className="flex items-center gap-2.5 py-0.5 text-xs font-medium text-emerald-600 hover:text-emerald-700">
                                                                                <CheckCircle2 size={14} className="text-emerald-500" />
                                                                                <span>Mark Active</span>
                                                                            </div>
                                                                        ),
                                                                        disabled: isActionLoading,
                                                                        onClick: () => handleMakeActive(job.id),
                                                                    }] : (job.approval_status === 'pending' || !job.approval_status || job.approval_status === 'rejected') ? [] : [{
                                                                        key: 'expire',
                                                                        label: (
                                                                            <div className="flex items-center gap-2.5 py-0.5 text-xs font-medium text-amber-600 hover:text-amber-700">
                                                                                <Clock size={14} className="text-amber-500" />
                                                                                <span>Mark Expired</span>
                                                                            </div>
                                                                        ),
                                                                        disabled: isActionLoading,
                                                                        onClick: () => handleExpireJob(job.id),
                                                                    }]),
                                                                    {
                                                                        key: 'delete',
                                                                        label: (
                                                                            <div className="flex items-center gap-2.5 py-0.5 text-xs font-medium text-rose-600 hover:text-rose-700">
                                                                                <Trash2 size={14} className="text-rose-500" />
                                                                                <span>Delete Job</span>
                                                                            </div>
                                                                        ),
                                                                        onClick: () => setDeleteModalJob(job),
                                                                    },
                                                                ],
                                                            }}
                                                            trigger={['click']}
                                                            placement="bottomRight"
                                                        >
                                                            <button
                                                                type="button"
                                                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:bg-blue-50 active:text-[#0A66C2]"
                                                                title="More Options"
                                                            >
                                                                <MoreVertical size={16} />
                                                            </button>
                                                        </Dropdown>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    // Empty state row
                                    <tr>
                                        <td colSpan={6} className="py-16 text-center">
                                            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-3 text-[#0A66C2]">
                                                <Briefcase size={24} />
                                            </div>
                                            <h3 className="text-base font-bold text-slate-900 mb-1">
                                                {hasActiveFilters ? "No matching jobs found" : "No job postings yet"}
                                            </h3>
                                            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                                                {hasActiveFilters
                                                    ? "We couldn't find any job postings matching your current criteria. Try adjusting your filters or search terms."
                                                    : "Create your first job listing to begin receiving candidates."}
                                            </p>
                                            {hasActiveFilters ? (
                                                <button
                                                    onClick={clearAllFilters}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#0A66C2] bg-blue-50 hover:bg-blue-100 transition-colors"
                                                >
                                                    <RotateCcw size={12} />
                                                    Reset Filters
                                                </button>
                                            ) : isPostingRestricted ? (
                                                <button
                                                    type="button"
                                                    onClick={() => alert(subscription?.limit_reason || "Job posting is locked because the company's plan limits are reached. All active job slots or monthly posts are in use.")}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed"
                                                >
                                                    <Lock size={14} />
                                                    Post a Job (Quota Full)
                                                </button>
                                            ) : (
                                                <Link
                                                    href="/post-job"
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white bg-[#0A66C2] hover:bg-[#004182] shadow-sm transition-all no-underline"
                                                >
                                                    <Plus size={14} />
                                                    Post a Job Now
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 5. Table Footer with Pagination */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3.5 bg-slate-50/80 border-t border-slate-200/80 text-xs">
                        <span className="text-slate-500">
                            Showing <span className="font-semibold text-slate-800">{totalCount === 0 ? 0 : (page - 1) * limit + 1}</span> to{' '}
                            <span className="font-semibold text-slate-800">{Math.min(page * limit, totalCount)}</span> of{' '}
                            <span className="font-semibold text-slate-800">{totalCount}</span> jobs
                        </span>

                        {totalPages > 1 && (
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page === 1}
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                                >
                                    <ChevronLeft size={13} />
                                    Prev
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1))
                                    .map((pageNum, idx, array) => {
                                        const isGap = idx > 0 && pageNum - array[idx - 1] > 1;
                                        return (
                                            <React.Fragment key={pageNum}>
                                                {isGap && <span className="text-slate-400 px-1 text-xs">...</span>}
                                                <button
                                                    type="button"
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${page === pageNum
                                                        ? 'bg-[#0A66C2] text-white shadow-xs'
                                                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            </React.Fragment>
                                        );
                                    })}

                                <button
                                    type="button"
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={page === totalPages}
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                                >
                                    Next
                                    <ChevronRight size={13} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* 6. Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteModalJob && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full p-6 text-slate-800"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-4">
                                <Trash2 size={22} />
                            </div>

                            <h3 className="text-lg font-bold text-slate-900 mb-2">
                                Delete Job Posting?
                            </h3>
                            <p className="text-xs text-slate-500 leading-relaxed mb-4">
                                Are you sure you want to permanently delete{' '}
                                <span className="font-semibold text-slate-800">&quot;{deleteModalJob.job_title}&quot;</span>?
                                This action cannot be undone and will remove candidate access to this posting.
                            </p>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setDeleteModalJob(null)}
                                    disabled={isActionLoading}
                                    className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeleteJob}
                                    disabled={isActionLoading}
                                    className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 shadow-sm shadow-rose-500/20 transition-all flex items-center gap-2"
                                >
                                    {isActionLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                    <span>{isActionLoading ? 'Deleting...' : 'Confirm Delete'}</span>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MyJobs;
