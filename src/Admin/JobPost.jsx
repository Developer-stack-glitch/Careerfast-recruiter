import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Briefcase, Building2, MapPin, Search,
    MoreVertical, CheckCircle2, XCircle, FileText, Download,
    Eye, Trash2, ExternalLink, ChevronLeft, ChevronRight, SlidersHorizontal, Clock,
    ChevronsUpDown, Folder, GraduationCap, ClipboardList, Users
} from 'lucide-react';
import { getJobPosts, deleteJobPost, expireJobPost, makeJobActive } from '../ApiService/action';
import toast from 'react-hot-toast';

// ── Stat Card Component ──
const StatCard = ({ title, value, icon: Icon, color, bg, accent }) => (
    <div className="bg-white rounded-xl p-4 group transition-all duration-300 relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full ${bg} opacity-60 -translate-y-8 translate-x-8 group-hover:scale-125 transition-transform duration-500`}></div>
        <div className="flex items-start justify-between mb-3 relative z-10">
            <div className={`p-2.5 rounded-xl ${bg} ${color} ring-1 ring-inset ${accent}`}>
                <Icon className="w-[18px] h-[18px]" strokeWidth={1.8} />
            </div>
        </div>
        <div className="relative z-10">
            <h4 className="text-gray-500 text-[14px] font-medium mb-1">{title}</h4>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-0">{value}</h2>
        </div>
    </div>
);

// ── Actions Dropdown ──
const ActionsDropdown = ({ job, onClose, onDelete, onToggleStatus, isBottom }) => {
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) onClose();
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onClose]);

    const isActive = job.is_closed === 0;

    return (
        <div ref={ref} className={`absolute right-0 ${isBottom ? 'bottom-full mb-1' : 'top-full mt-1'} w-44 bg-white rounded-xl shadow-lg border border-gray-200/80 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150`}>
            <button onClick={() => { window.open(`https://careerfast.in/job-details/${job.id}`, '_blank'); onClose(); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                <Eye className="w-3.5 h-3.5" /> View Details
            </button>
            <button onClick={() => { window.location.href = `/admin/applications?search=${encodeURIComponent(job.job_title || '')}`; onClose(); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                <Users className="w-3.5 h-3.5 text-indigo-500" /> View Applied ({job.applicants_count || 0})
            </button>
            <button onClick={() => { window.open(job.apply_link || `https://careerfast.in/job-details/${job.id}`, '_blank'); onClose(); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                <ExternalLink className="w-3.5 h-3.5" /> Open Link
            </button>
            <div className="my-1 border-t border-gray-100"></div>
            <button onClick={() => { onToggleStatus(job.id, isActive); onClose(); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-gray-700 hover:bg-gray-100 transition-colors">
                {isActive ? <XCircle className="w-3.5 h-3.5 text-gray-500" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                {isActive ? 'Make Inactive' : 'Make Active'}
            </button>
            <div className="my-1 border-t border-gray-100"></div>
            <button onClick={() => { onDelete(job.id); onClose(); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Remove Post
            </button>
        </div>
    );
};

export default function JobPost() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [openDropdown, setOpenDropdown] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [matchedJobs, setMatchedJobs] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [globalStats, setGlobalStats] = useState({ total: 0, active: 0, closed: 0, companies: 0 });
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [jobToDelete, setJobToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const itemsPerPage = 10;

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchJobs();
        }, 500);
        return () => clearTimeout(timeout);
    }, [currentPage, searchTerm, activeFilter]);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const payload = {
                limit: itemsPerPage,
                page: currentPage,
            };
            if (searchTerm) payload.searchTerm = searchTerm;
            if (activeFilter === 'Active') payload.is_closed = 0;
            if (activeFilter === 'Closed') payload.is_closed = 1;

            const response = await getJobPosts(payload);
            const responseData = response?.data?.data || response?.data || {};
            const jobsArray = responseData.data || [];
            setJobs(Array.isArray(jobsArray) ? jobsArray : []);

            const meta = responseData.meta;
            if (meta) {
                setTotalPages(meta.totalPages || 1);
                setMatchedJobs(meta.total || 0);
                if (meta.stats) {
                    setGlobalStats({
                        total: meta.stats.totalJobs || 0,
                        active: meta.stats.activeJobs || 0,
                        closed: meta.stats.closedJobs || 0,
                        companies: meta.stats.uniqueCompanies || 0
                    });
                }
            }
        } catch (error) {
            console.error("Failed to fetch jobs:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteJob = (jobId) => {
        setJobToDelete(jobId);
        setDeleteModalOpen(true);
    };

    const confirmDeleteJob = async () => {
        if (!jobToDelete) return;
        try {
            setIsDeleting(true);
            await deleteJobPost({ id: jobToDelete });
            setJobs(jobs.filter(j => j.id !== jobToDelete));
            fetchJobs();
            setDeleteModalOpen(false);
            setJobToDelete(null);
            toast.success("Job post deleted successfully!");
        } catch (error) {
            console.error("Failed to delete job post", error);
            toast.error("Failed to delete job post.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleExport = async () => {
        try {
            const toastId = toast.loading('Generating export...');
            const payload = {
                limit: 10000,
                page: 1,
            };
            if (searchTerm) payload.searchTerm = searchTerm;
            if (activeFilter === 'Active') payload.is_closed = 0;
            if (activeFilter === 'Closed') payload.is_closed = 1;

            const response = await getJobPosts(payload);
            const responseData = response?.data?.data || response?.data || {};
            const exportJobs = responseData.data || [];

            if (exportJobs.length === 0) {
                toast.error('No data to export', { id: toastId });
                return;
            }

            const csvRows = [];
            csvRows.push(['Job Title', 'Company', 'Type', 'Location', 'Date Posted', 'Status']);

            exportJobs.forEach(job => {
                const title = `"${(job.job_title || '').replace(/"/g, '""')}"`;
                const company = `"${(job.company_name || '').replace(/"/g, '""')}"`;
                const type = `"${Array.isArray(job.job_category) ? job.job_category.join(', ') : (job.job_category || 'General')}"`;
                const location = `"${Array.isArray(job.work_location) ? job.work_location.join(', ') : (job.work_location || 'Remote')}"`;
                const date = `"${new Date(job.created_at || new Date()).toLocaleDateString()}"`;
                const status = job.is_closed === 0 ? 'Active' : 'Closed';
                csvRows.push([title, company, type, location, date, status]);
            });

            const csvContent = csvRows.map(e => e.join(",")).join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `job_postings_${activeFilter.toLowerCase()}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            toast.success('Export completed', { id: toastId });
        } catch (error) {
            console.error("Export error:", error);
            toast.dismiss();
            toast.error('Failed to generate export');
        }
    };

    const handleToggleStatus = async (jobId, currentIsActive) => {
        try {
            if (currentIsActive) {
                // If currently active (is_closed=0), make it inactive (closed)
                await expireJobPost({ id: jobId });
                toast.success("Job post marked as inactive.");
            } else {
                // If currently inactive (is_closed=1), make it active
                await makeJobActive({ id: jobId });
                toast.success("Job post marked as active.");
            }
            fetchJobs();
        } catch (error) {
            console.error("Failed to change job status", error);
            toast.error("Failed to update job status.");
        }
    };

    const [sortApplied, setSortApplied] = useState(null); // null | 'desc' | 'asc'

    const displayedJobs = useMemo(() => {
        if (!sortApplied) return jobs;
        return [...jobs].sort((a, b) => {
            const countA = Number(a.applicants_count) || 0;
            const countB = Number(b.applicants_count) || 0;
            return sortApplied === 'asc' ? countA - countB : countB - countA;
        });
    }, [jobs, sortApplied]);

    const paginatedJobs = displayedJobs;

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, activeFilter]);

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getRelativeTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
        return `${Math.floor(diffDays / 30)}mo ago`;
    };

    // Stats
    const filterTabs = [
        {
            label: 'All',
            count: globalStats.total,
            color: { text: 'text-blue-600', border: 'border-blue-600', badgeBg: 'bg-blue-100', badgeText: 'text-blue-700' }
        },
        {
            label: 'Active',
            count: globalStats.active,
            color: { text: 'text-emerald-600', border: 'border-emerald-600', badgeBg: 'bg-emerald-100', badgeText: 'text-emerald-700' }
        },
        {
            label: 'Closed',
            count: globalStats.closed,
            color: { text: 'text-rose-600', border: 'border-rose-600', badgeBg: 'bg-rose-100', badgeText: 'text-rose-700' }
        },
    ];

    const getJobNatureBadge = (nature) => {
        const normalized = (nature || '').toLowerCase();
        if (normalized.includes('intern'))
            return { bg: 'bg-orange-50', text: 'text-orange-600', icon: GraduationCap };
        if (normalized.includes('full') || normalized === 'job')
            return { bg: 'bg-indigo-50', text: 'text-indigo-600', icon: Briefcase };
        if (normalized.includes('part'))
            return { bg: 'bg-violet-50', text: 'text-violet-600', icon: Clock };
        if (normalized.includes('contract'))
            return { bg: 'bg-cyan-50', text: 'text-cyan-600', icon: ClipboardList };
        return { bg: 'bg-indigo-50', text: 'text-indigo-600', icon: Briefcase };
    };

    // Get company initials with a deterministic color
    const getCompanyColor = (name) => {
        const colors = [
            { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100/50' },
            { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100/50' },
            { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100/50' },
            { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100/50' },
            { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-100/50' },
            { bg: 'bg-fuchsia-50', text: 'text-fuchsia-600', border: 'border-fuchsia-100/50' },
            { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100/50' },
        ];
        const hash = (name || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        return colors[hash % colors.length];
    };

    return (
        <div className="max-w-[1400px] mx-auto w-full animate-in fade-in duration-300">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight mb-0">Job Postings</h1>
                    <p className="text-[13px] text-gray-500 mt-0.5 mb-0">Manage all jobs posted by recruiters across the platform.</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-72">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search jobs, companies, locations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-[13px] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white outline-none transition-all placeholder:text-gray-400"
                        />
                    </div>
                    <button 
                        onClick={handleExport}
                        className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all flex items-center gap-2 shrink-0 active:scale-[0.98]"
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                </div>
            </div>

            {/* KPI Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                    title="Total Postings"
                    value={globalStats.total.toLocaleString()}
                    icon={Briefcase}
                    color="text-blue-600"
                    bg="bg-blue-50"
                    accent="ring-blue-100"
                />
                <StatCard
                    title="Active Jobs"
                    value={globalStats.active.toLocaleString()}
                    icon={CheckCircle2}
                    color="text-emerald-600"
                    bg="bg-emerald-50"
                    accent="ring-emerald-100"
                />
                <StatCard
                    title="Closed Jobs"
                    value={globalStats.closed.toLocaleString()}
                    icon={XCircle}
                    color="text-rose-600"
                    bg="bg-rose-50"
                    accent="ring-rose-100"
                />
                <StatCard
                    title="Companies"
                    value={globalStats.companies.toLocaleString()}
                    icon={Building2}
                    color="text-violet-600"
                    bg="bg-violet-50"
                    accent="ring-violet-100"
                />
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-xl">
                {/* Filter Tabs */}
                <div className="px-6 pt-2 border-b border-gray-100 flex items-center justify-between mb-0">
                    <div className="flex gap-12 -mb-px">
                        {filterTabs.map((tab) => (
                            <button
                                key={tab.label}
                                onClick={() => setActiveFilter(tab.label)}
                                className={`py-4 text-[14px] font-semibold transition-all border-b-2 group ${activeFilter === tab.label
                                    ? `${tab.color.border} ${tab.color.text}`
                                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                                    }`}
                            >
                                <span className="flex items-center gap-2.5">
                                    {tab.label}
                                    <span className={`text-[12px] font-bold px-2.5 py-0.5 rounded-full transition-colors ${activeFilter === tab.label
                                        ? `${tab.color.badgeBg} ${tab.color.badgeText}`
                                        : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-gray-700'
                                        }`}>
                                        {tab.count}
                                    </span>
                                </span>
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 py-2">
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <SlidersHorizontal className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto pb-1 min-h-[280px] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-gray-50 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="px-4 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-white">
                                    <div className="flex items-center gap-2">JOB TITLE <ChevronsUpDown className="w-3.5 h-3.5 opacity-50" /></div>
                                </th>
                                <th className="px-4 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-white">
                                    <div className="flex items-center gap-2">COMPANY <ChevronsUpDown className="w-3.5 h-3.5 opacity-50" /></div>
                                </th>
                                <th className="px-4 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-white">
                                    <div className="flex items-center gap-2">TYPE <ChevronsUpDown className="w-3.5 h-3.5 opacity-50" /></div>
                                </th>
                                <th className="px-4 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-white">
                                    <div className="flex items-center gap-2">LOCATION <ChevronsUpDown className="w-3.5 h-3.5 opacity-50" /></div>
                                </th>
                                <th className="px-4 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-white">
                                    <div className="flex items-center gap-2">DATE POSTED <ChevronsUpDown className="w-3.5 h-3.5 opacity-50" /></div>
                                </th>
                                <th 
                                    onClick={() => setSortApplied(prev => prev === 'desc' ? 'asc' : prev === 'asc' ? null : 'desc')}
                                    className="px-4 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-white cursor-pointer hover:text-gray-900 select-none transition-colors"
                                    title="Click to sort by applied candidates count"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span>APPLIED CANDIDATES</span>
                                        <ChevronsUpDown className={`w-3.5 h-3.5 ${sortApplied ? 'text-indigo-600 font-bold' : 'opacity-50'}`} />
                                    </div>
                                </th>
                                <th className="px-4 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-white">
                                    <div className="flex items-center gap-2">STATUS <ChevronsUpDown className="w-3.5 h-3.5 opacity-50" /></div>
                                </th>
                                <th className="px-4 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-white text-center">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                // Loading Skeleton
                                [...Array(6)].map((_, i) => (
                                    <tr key={i} className="animate-pulse bg-white">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gray-100"></div>
                                                <div>
                                                    <div className="h-4 bg-gray-100 rounded-lg w-36 mb-2"></div>
                                                    <div className="h-3 bg-gray-50 rounded-lg w-24"></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded-lg w-28"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 bg-gray-100 rounded-full w-20"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded-lg w-24"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded-lg w-20"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 bg-gray-100 rounded-full w-20"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 bg-gray-100 rounded-full w-16"></div></td>
                                        <td className="px-6 py-4 text-center"><div className="h-8 w-8 bg-gray-100 rounded-lg inline-block"></div></td>
                                    </tr>
                                ))
                            ) : paginatedJobs.length === 0 ? (
                                // Empty State
                                <tr>
                                    <td colSpan="8" className="px-6 py-16 text-center bg-white">
                                        <div className="flex flex-col items-center justify-center text-gray-500">
                                            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 border border-gray-100">
                                                <Briefcase className="w-7 h-7 text-gray-300" />
                                            </div>
                                            <h3 className="text-sm font-semibold text-gray-900 mb-1">No job postings found</h3>
                                            <p className="text-[13px] text-gray-500 max-w-sm">
                                                {searchTerm
                                                    ? `No results for "${searchTerm}". Try adjusting your search or filters.`
                                                    : 'There are currently no jobs matching your criteria.'
                                                }
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                // Data Rows
                                paginatedJobs.map((job, index) => {
                                    const badgeStyle = getJobNatureBadge(job.job_nature);
                                    const companyColor = getCompanyColor(job.company_name);
                                    const isActive = job.is_closed === 0;

                                    const jobTitleText = job.job_title || 'Untitled Role';
                                    const companyNameText = job.company_name || '-';
                                    const jobCategoryText = Array.isArray(job.job_category) && job.job_category.length > 0 ? job.job_category.join(', ') : (job.job_category || 'General');
                                    const workLocationText = Array.isArray(job.work_location) && job.work_location.length > 0 ? job.work_location.join(', ') : (job.work_location || 'Remote');

                                    return (
                                        <tr
                                            key={job.id || job._id}
                                            className="hover:bg-gray-50/50 transition-all duration-200 group bg-white"
                                        >
                                            {/* Job Role */}
                                            <td className="px-4 py-3 max-w-[280px]">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-2xl ${companyColor.bg} border ${companyColor.border} flex items-center justify-center shrink-0`}>
                                                        {job.company_logo ? (
                                                            <img src={job.company_logo} alt={job.company_name} className="w-6 h-6 object-contain" />
                                                        ) : (
                                                            <span className={`text-xl font-medium ${companyColor.text}`}>
                                                                {(job.company_name || 'C').charAt(0).toUpperCase()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex flex-col justify-center">
                                                        <div className="relative group/title inline-block min-w-0">
                                                            <h3 className="text-[14px] font-bold text-blue-950 group-hover:text-blue-600 transition-colors truncate mb-0">
                                                                {jobTitleText}
                                                            </h3>
                                                            <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover/title:block bg-gray-900 text-white text-[11px] font-medium rounded-lg py-1.5 px-2.5 z-[100] whitespace-nowrap shadow-xl">
                                                                {jobTitleText}
                                                                <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                                                            </div>
                                                        </div>
                                                        <div className="text-[13px] text-gray-500 mt-1 flex items-center gap-1.5 relative group/cat min-w-0">
                                                            <Folder className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                                                            <span className="truncate">{jobCategoryText}</span>
                                                            <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover/cat:block bg-gray-900 text-white text-[11px] font-medium rounded-lg py-1.5 px-2.5 z-[100] whitespace-nowrap shadow-xl">
                                                                {jobCategoryText}
                                                                <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Company */}
                                            <td className="px-4 py-3 max-w-[200px]">
                                                <div className="flex items-center gap-2 text-[13px] text-gray-600 font-medium relative group/comp min-w-0">
                                                    <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                                                    <span className="truncate">{companyNameText}</span>
                                                    <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover/comp:block bg-gray-900 text-white text-[11px] font-medium rounded-lg py-1.5 px-2.5 z-[100] whitespace-nowrap shadow-xl">
                                                        {companyNameText}
                                                        <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Type Badge */}
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-full ${badgeStyle.bg} ${badgeStyle.text}`}>
                                                    <badgeStyle.icon className="w-3.5 h-3.5" />
                                                    {job.job_nature || 'Job'}
                                                </span>
                                            </td>

                                            {/* Location */}
                                            <td className="px-4 py-3 max-w-[200px]">
                                                <div className="flex items-center gap-2 text-[13px] text-gray-600 relative group/loc min-w-0">
                                                    <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                                                    <span className="truncate">{workLocationText}</span>
                                                    <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover/loc:block bg-gray-900 text-white text-[11px] font-medium rounded-lg py-1.5 px-2.5 z-[100] whitespace-nowrap shadow-xl">
                                                        {workLocationText}
                                                        <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Date Posted */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex flex-col justify-center">
                                                    <span className="text-[13px] text-gray-900 font-bold">
                                                        {formatDate(job.created_at || job.createdAt)}
                                                    </span>
                                                    <span className="text-[13px] text-gray-500 mt-1 flex items-center gap-1.5">
                                                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                        {getRelativeTime(job.created_at || job.createdAt)}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Applied Candidates Count */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <a
                                                    href={`/admin/applications?search=${encodeURIComponent(jobTitleText)}`}
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold transition-all ${
                                                        (Number(job.applicants_count) > 0)
                                                            ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 border border-indigo-200/80 shadow-2xs'
                                                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200/60'
                                                    }`}
                                                    title={`View ${job.applicants_count || 0} applied candidates`}
                                                >
                                                    <Users className={`w-3.5 h-3.5 ${Number(job.applicants_count) > 0 ? 'text-indigo-600' : 'text-gray-400'}`} />
                                                    <span>{job.applicants_count || 0}</span>
                                                    <span className="text-[11px] font-medium opacity-80">
                                                        {Number(job.applicants_count) === 1 ? 'Applied' : 'Applied'}
                                                    </span>
                                                </a>
                                            </td>

                                            {/* Status */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold rounded-full ${isActive
                                                    ? 'bg-emerald-50 text-emerald-600'
                                                    : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                                                    {isActive ? 'Active' : 'Closed'}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3 whitespace-nowrap text-center">
                                                <div className="relative inline-block text-left">
                                                    <button
                                                        onClick={() => setOpenDropdown(openDropdown === (job.id || job._id) ? null : (job.id || job._id))}
                                                        className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all focus:outline-none"
                                                    >
                                                        <MoreVertical className="w-5 h-5" />
                                                    </button>
                                                    {openDropdown === (job.id || job._id) && (
                                                        <ActionsDropdown
                                                            job={job}
                                                            onClose={() => setOpenDropdown(null)}
                                                            onDelete={handleDeleteJob}
                                                            onToggleStatus={handleToggleStatus}
                                                            isBottom={index >= paginatedJobs.length - 2 && paginatedJobs.length > 2}
                                                        />
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && matchedJobs > 0 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white">
                        <div className="text-[13px] text-gray-500 w-1/3">
                            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, matchedJobs)} to {Math.min(currentPage * itemsPerPage, matchedJobs)} of {matchedJobs.toLocaleString()} jobs
                        </div>
                        <div className="flex items-center justify-center gap-1.5 w-1/3">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all disabled:opacity-40 disabled:hover:bg-transparent"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-8 h-8 flex items-center justify-center text-[13px] font-medium rounded-lg transition-all ${currentPage === pageNum
                                            ? 'text-indigo-600 border border-indigo-200 bg-indigo-50'
                                            : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            {totalPages > 5 && currentPage < totalPages - 2 && (
                                <span className="text-gray-400 px-1">...</span>
                            )}
                            {totalPages > 5 && currentPage < totalPages - 2 && (
                                <button
                                    onClick={() => setCurrentPage(totalPages)}
                                    className={`w-8 h-8 flex items-center justify-center text-[13px] font-medium rounded-lg transition-all text-gray-600 hover:bg-gray-50`}
                                >
                                    {totalPages}
                                </button>
                            )}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all disabled:opacity-40 disabled:hover:bg-transparent"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex items-center justify-end gap-2 text-[13px] text-gray-500 w-1/3">
                            <span>Rows per page:</span>
                            <div className="relative">
                                <select className="appearance-none border-none bg-transparent pr-4 font-medium text-gray-700 outline-none cursor-pointer">
                                    <option value="10">10</option>
                                    <option value="20">20</option>
                                    <option value="50">50</option>
                                </select>
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <ChevronRight className="w-3.5 h-3.5 rotate-90 text-gray-500" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {/* Delete Confirmation Modal */}
            {deleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 grid place-items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Job Post</h3>
                            <p className="text-gray-500 text-sm mb-0">
                                Are you sure you want to remove this job post? This action cannot be undone.
                            </p>
                        </div>
                        <div className="p-4 bg-gray-50 flex justify-between gap-3 rounded-b-2xl">
                            <button
                                onClick={() => {
                                    setDeleteModalOpen(false);
                                    setJobToDelete(null);
                                }}
                                disabled={isDeleting}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteJob}
                                disabled={isDeleting}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {isDeleting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    'Delete Post'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}