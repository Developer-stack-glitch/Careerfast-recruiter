"use client";
import React, { useState, useEffect } from 'react';
import {
    Briefcase, Search, Calendar, ChevronLeft, ChevronRight, CheckCircle, XCircle, Eye, Loader, MapPin, ArrowUpDown, User, Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getPendingJobs, approveJobPost, rejectJobPost, approveAllPendingJobs } from '../ApiService/action';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Modal } from 'antd';
import AdminDateFilter from './AdminDateFilter';

const PendingJobs = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);
    const [actionModal, setActionModal] = useState({ isOpen: false, type: '', id: null, title: '' });
    const [rejectReason, setRejectReason] = useState('');
    const [dateFilter, setDateFilter] = useState({ preset: 'All Time', startDate: '', endDate: '', label: 'All Time' });

    const fetchPendingJobs = async () => {
        try {
            setLoading(true);
            const extraParams = {
                search: searchTerm || undefined,
                start_date: dateFilter.startDate || undefined,
                end_date: dateFilter.endDate || undefined
            };
            const res = await getPendingJobs(limit, page, extraParams);

            // JobsModel.getJobPosts returns { data, meta } inside the res.data.data object
            const jobsData = res.data?.data?.data || res.data?.data || [];
            const meta = res.data?.data?.meta || {};

            setJobs(jobsData);
            setTotal(meta.total || jobsData.length || 0);
        } catch (error) {
            console.error("Error fetching pending jobs:", error);
            toast.error("Failed to load pending jobs");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPendingJobs();
        }, 300);
        return () => clearTimeout(timer);
    }, [page, limit, dateFilter, searchTerm]);

    const openModal = (type, id, title) => {
        setActionModal({ isOpen: true, type, id, title });
    };

    const handleConfirmAction = async () => {
        const { type, id } = actionModal;
        if (type === 'reject' && !rejectReason.trim()) {
            toast.error("Please provide a reason for rejection.");
            return;
        }
        try {
            if (type === 'approve') {
                const res = await approveJobPost(id);
                toast.success(res?.data?.message || "Job approved successfully!");
            } else if (type === 'reject') {
                const res = await rejectJobPost(id, rejectReason);
                toast.success(res?.data?.message || "Job rejected.");
            } else if (type === 'approveAll') {
                const res = await approveAllPendingJobs();
                toast.success(res?.data?.message || "All pending jobs approved successfully!", { duration: 5000 });
            }
            fetchPendingJobs();
        } catch (error) {
            console.error(`${type} error:`, error);
            const errMsg = error.response?.data?.details || error.response?.data?.message || `Failed to ${type} job.`;
            toast.error(errMsg, { duration: 6000 });
        } finally {
            setActionModal({ isOpen: false, type: '', id: null, title: '' });
            setRejectReason('');
        }
    };

    const totalPages = Math.ceil(total / limit) || 1;

    // Filter by search term locally if backend doesn't support search on this endpoint yet
    const filteredJobs = jobs.filter(job =>
        job.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen">
            {/* Header Section */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3 mb-0">
                        <div className="p-2.5 bg-blue-100 rounded-xl text-blue-600">
                            <Briefcase className="w-6 h-6" />
                        </div>
                        Approval Pending Jobs
                    </h1>
                    <p className="text-sm text-slate-500 mt-2 font-medium mb-0">
                        Review and approve job postings submitted by recruiters.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                    {jobs.length > 0 && (
                        <button
                            onClick={() => openModal('approveAll')}
                            className="w-full sm:w-auto px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium transition-all shadow-sm shadow-green-500/20 flex items-center justify-center gap-2 shrink-0"
                        >
                            <CheckCircle className="w-4 h-4" />
                            Approve All
                        </button>
                    )}
                    <AdminDateFilter
                        value={dateFilter}
                        onChange={(newFilter) => {
                            setDateFilter(newFilter);
                            setPage(1);
                        }}
                    />
                    <div className="relative group w-full sm:w-72">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search jobs or companies..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Jobs List */}
            <div className="bg-white rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="border-b border-slate-100 bg-gray-50">
                                    <th className="py-3 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">JOB DETAILS</th>
                                    <th className="py-3 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">TYPE / LOCATION</th>
                                    <th className="py-3 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">POSTED DATE</th>
                                    <th className="py-3 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 animate-pulse">
                                {[...Array(5)].map((_, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-slate-200 shrink-0"></div>
                                                <div className="flex flex-col gap-2 w-full mt-1">
                                                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                                                    <div className="h-3 bg-slate-200 rounded w-1/2 mt-0.5"></div>
                                                    <div className="h-3 bg-slate-200 rounded w-1/3 mt-1.5"></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col gap-2.5 mt-1">
                                                <div className="h-6 w-20 bg-slate-200 rounded-md"></div>
                                                <div className="h-3.5 w-32 bg-slate-200 rounded mt-0.5"></div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col gap-2.5 mt-1">
                                                <div className="h-4 w-24 bg-slate-200 rounded"></div>
                                                <div className="h-3.5 w-20 bg-slate-200 rounded mt-0.5"></div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-right align-middle">
                                            <div className="flex items-center justify-end gap-3 mt-1">
                                                <div className="h-8 w-24 bg-slate-200 rounded-lg"></div>
                                                <div className="h-8 w-24 bg-slate-200 rounded-lg"></div>
                                                <div className="h-8 w-24 bg-slate-200 rounded-lg"></div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : filteredJobs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                        <div className="w-24 h-24 mb-6 rounded-full bg-emerald-50 flex items-center justify-center relative shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                            <div className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping" style={{ animationDuration: '2s' }}></div>
                            <CheckCircle className="w-12 h-12 text-emerald-500 relative z-10 drop-shadow-sm" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-2 mt-3">No pending jobs</h3>
                        <p className="text-slate-500 text-sm max-w-[250px] leading-relaxed">
                            You're all caught up! There are currently no job postings waiting for approval.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="border-b border-slate-100 bg-gray-50">
                                    <th className="py-3 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                        <div className="flex items-center gap-1.5 cursor-pointer hover:text-slate-700 w-fit">
                                            JOB DETAILS <ArrowUpDown className="w-3.5 h-3.5" />
                                        </div>
                                    </th>
                                    <th className="py-3 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                        <div className="flex items-center gap-1.5 cursor-pointer hover:text-slate-700 w-fit">
                                            TYPE / LOCATION <ArrowUpDown className="w-3.5 h-3.5" />
                                        </div>
                                    </th>
                                    <th className="py-3 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                        <div className="flex items-center gap-1.5 cursor-pointer hover:text-slate-700 w-fit">
                                            POSTED DATE <ArrowUpDown className="w-3.5 h-3.5" />
                                        </div>
                                    </th>
                                    <th className="py-3 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredJobs.map((job) => (
                                    <tr key={job.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="py-4 px-6">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 p-0">
                                                    {job.company_logo ? (
                                                        <img src={job.company_logo} alt={job.company_name} className="w-full h-full object-contain" />
                                                    ) : (
                                                        <Briefcase className="w-6 h-6 text-slate-400" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    <h3 className="text-[15px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 mb-0">{job.job_title}</h3>
                                                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                                        <p className="text-sm font-semibold text-slate-700 mb-0">{job.company_name}</p>
                                                        {job.recruiter_plan_name && (
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${job.recruiter_can_approve === false
                                                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                                    : 'bg-blue-50 text-blue-700 border border-blue-100'
                                                                }`}>
                                                                {job.recruiter_can_approve === false ? '⚠️ Limit Reached: ' : ''}
                                                                {job.recruiter_plan_name} Plan ({job.recruiter_active_count ?? 0}/{job.recruiter_active_limit ?? 3} Active)
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1 font-medium">
                                                        <User className="w-3.5 h-3.5" />
                                                        <span>{job.recruiter_name ? `Posted by ${job.recruiter_name}` : 'Posted by Recruiter'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col gap-2">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[13px] font-semibold bg-indigo-50 text-indigo-600 w-fit">
                                                    <Briefcase className="w-3.5 h-3.5" />
                                                    {job.job_nature || job.employment_type || 'Job'}
                                                </span>
                                                <div className="flex items-center gap-1.5 text-[13px] text-slate-500 font-medium">
                                                    <MapPin className="w-3.5 h-3.5" />
                                                    <span className="truncate max-w-[200px]">
                                                        {(() => {
                                                            try {
                                                                const locs = typeof job.work_location === 'string' ? JSON.parse(job.work_location) : job.work_location;
                                                                return Array.isArray(locs) ? locs.join(', ') : (locs || 'Not Specified');
                                                            } catch (e) {
                                                                return 'Not Specified';
                                                            }
                                                        })()}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col gap-2 text-[14px] text-slate-700 font-semibold">
                                                <div className="flex items-center gap-2.5">
                                                    <Calendar className="w-4 h-4 text-slate-400" />
                                                    {new Date(job.created_at).toLocaleDateString('en-US', {
                                                        month: 'short', day: 'numeric', year: 'numeric'
                                                    })}
                                                </div>
                                                <div className="flex items-center gap-2.5 text-slate-400 text-[13px] font-medium">
                                                    <Clock className="w-4 h-4" />
                                                    {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-right align-middle">
                                            <div className="flex items-center justify-end gap-3">
                                                <a target='_blank' rel="noopener noreferrer" href={`https://careerfast.in/job-details/${job.id}?preview=true`} className="no-underline hover:no-underline">
                                                    <button
                                                        className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                                    >
                                                        <Eye className="w-4 h-4" /> Preview
                                                    </button>
                                                </a>
                                                <button
                                                    onClick={() => {
                                                        if (job.recruiter_can_approve === false) {
                                                            toast.error(
                                                                `Cannot approve: Recruiter "${job.company_name || 'Recruiter'}" has reached their ${job.recruiter_plan_name || 'plan'} active limit (${job.recruiter_active_count}/${job.recruiter_active_limit} slots used). The recruiter must upgrade their plan or close an active job first.`,
                                                                { duration: 6000 }
                                                            );
                                                            return;
                                                        }
                                                        openModal('approve', job.id, job.job_title);
                                                    }}
                                                    className={`flex items-center gap-1.5 px-3 py-2 text-[13px] font-semibold rounded-lg transition-colors ${job.recruiter_can_approve === false
                                                            ? 'text-slate-400 bg-slate-100 hover:bg-slate-200 cursor-not-allowed'
                                                            : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                                                        }`}
                                                    title={job.recruiter_can_approve === false ? `Active limit reached (${job.recruiter_active_count}/${job.recruiter_active_limit})` : "Approve job post"}
                                                >
                                                    <CheckCircle className="w-4 h-4" /> Approve
                                                </button>
                                                <button
                                                    onClick={() => openModal('reject', job.id, job.job_title)}
                                                    className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-semibold text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                                >
                                                    <XCircle className="w-4 h-4" /> Reject
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {!loading && total > 0 && (
                    <div className="px-6 py-3 flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 gap-4">
                        <span className="text-sm text-slate-500 font-medium">
                            Showing {total === 0 ? 0 : ((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} pending job{total !== 1 ? 's' : ''}
                        </span>
                        <div className="flex items-center gap-5">
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                                    .map((p, idx, arr) => {
                                        return (
                                            <React.Fragment key={p}>
                                                {idx > 0 && arr[idx - 1] !== p - 1 && (
                                                    <span className="text-slate-400 px-1">...</span>
                                                )}
                                                <button
                                                    onClick={() => setPage(p)}
                                                    className={`w-8 h-8 rounded-md flex items-center justify-center text-sm font-semibold transition-colors border ${page === p
                                                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                                            : 'border-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-200'
                                                        }`}
                                                >
                                                    {p}
                                                </button>
                                            </React.Fragment>
                                        );
                                    })}

                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                                Rows per page:
                                <select
                                    className="px-2 py-1.5 border border-slate-200 rounded-md text-slate-700 text-[13px] bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                    value={limit}
                                    onChange={(e) => {
                                        setLimit(Number(e.target.value));
                                        setPage(1);
                                    }}
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            <Modal
                title={actionModal.type === 'approveAll' ? 'Approve All Pending Jobs' : (actionModal.type === 'approve' ? 'Approve Job Post' : 'Reject Job Post')}
                open={actionModal.isOpen}
                centered
                onOk={handleConfirmAction}
                onCancel={() => {
                    setActionModal({ isOpen: false, type: '', id: null, title: '' });
                    setRejectReason('');
                }}
                okText={actionModal.type === 'approveAll' ? 'Yes, Approve All' : (actionModal.type === 'approve' ? 'Yes, Approve' : 'Yes, Reject')}
                okButtonProps={{
                    className: (actionModal.type === 'approve' || actionModal.type === 'approveAll')
                        ? '!bg-emerald-500 hover:!bg-emerald-600 !border-emerald-500 hover:!border-emerald-600 !text-white'
                        : '!bg-red-500 hover:!bg-red-600 !border-red-500 hover:!border-red-600 !text-white',
                    style: { boxShadow: 'none' }
                }}
                cancelButtonProps={{
                    className: 'hover:!border-slate-400 hover:!text-slate-700 !text-slate-600 !border-slate-300',
                    style: { boxShadow: 'none' }
                }}
            >
                <div className="py-2">
                    <p className="mb-4 text-slate-600">
                        {actionModal.type === 'approveAll'
                            ? `Are you sure you want to approve all ${total} pending jobs? They will become public immediately.`
                            : (actionModal.type === 'approve'
                                ? `Are you sure you want to approve "${actionModal.title}"? It will become public immediately.`
                                : `Are you sure you want to reject "${actionModal.title}"? Please provide a reason.`)}
                    </p>

                    {actionModal.type === 'reject' && (
                        <textarea
                            className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm resize-none"
                            rows={3}
                            placeholder="Enter rejection reason here... (Required)"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            required
                        ></textarea>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default PendingJobs;
