'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getJobPostByUserId, getJobCategoryData, deleteJobPost, getSavedCandidatesHR } from '../ApiService/action';
import {
    User,
    Briefcase,
    CheckCircle,
    XCircle,
    Users,
    BarChart2,
    PieChart as PieChartIcon,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import Link from 'next/link';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

const HrJobs = () => {
    const [recruiterDetails, setRecruiterDetails] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const [overallStats, setOverallStats] = useState({ openJobs: 0, closedJobs: 0, totalApplications: 0 });
    const [savedCandidatesCount, setSavedCandidatesCount] = useState(0);

    // Filter states
    const [availableCategories, setAvailableCategories] = useState([]);

    // Fetch categories on mount
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
    const [selectedStatuses, setSelectedStatuses] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);

    // Infinite Scroll States
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const observer = useRef();

    // Delete Job State
    const [jobToDelete, setJobToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteJob = async (jobId) => {
        try {
            console.log("Attempting to delete job with ID:", jobId);
            setIsDeleting(true);
            const res = await deleteJobPost({ job_id: jobId });
            console.log("Delete response:", res);
            if (res?.data?.status) {
                setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
            } else {
                alert("Delete failed on backend: " + JSON.stringify(res?.data));
            }
        } catch (error) {
            console.error("Error deleting job", error);
            alert("Error deleting job: " + (error?.response?.data?.message || error.message));
        } finally {
            setIsDeleting(false);
            setJobToDelete(null);
        }
    };

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Reset page when search or filters change
    useEffect(() => {
        setPage(1);
    }, [debouncedSearchQuery, selectedStatuses, selectedCategories]);

    useEffect(() => {
        const details = localStorage.getItem('loginDetails');
        if (details) {
            try {
                setRecruiterDetails(JSON.parse(details));
            } catch (e) {
                console.error("Error parsing login details:", e);
            }
        }
    }, []);

    useEffect(() => {
        const fetchSavedCandidates = async () => {
            try {
                const res = await getSavedCandidatesHR();
                if (res?.data?.success) {
                    setSavedCandidatesCount(res.data.data.length);
                }
            } catch (error) {
                console.error("Error fetching saved candidates:", error);
            }
        };
        fetchSavedCandidates();
    }, []);

    const lastJobElementRef = useCallback(node => {
        if (loading || isFetchingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, isFetchingMore, hasMore]);

    useEffect(() => {
        const fetchJobs = async () => {
            if (!recruiterDetails?.id) return;
            try {
                if (page === 1) setLoading(true);
                else setIsFetchingMore(true);

                const res = await getJobPostByUserId({
                    user_id: recruiterDetails.id,
                    limit: 10,
                    page: page,
                    search: debouncedSearchQuery,
                    statuses: JSON.stringify(selectedStatuses),
                    categories: JSON.stringify(selectedCategories)
                });

                if (res?.data?.data) {
                    const newJobs = res.data.data;
                    setJobs(prevJobs => {
                        if (page === 1) return newJobs;

                        // Prevent duplicates
                        const existingIds = new Set(prevJobs.map(j => j.id));
                        const filteredNew = newJobs.filter(j => !existingIds.has(j.id));
                        return [...prevJobs, ...filteredNew];
                    });
                    setHasMore(false);

                    if (res.data.stats) {
                        setOverallStats({
                            openJobs: parseInt(res.data.stats.openJobs || 0),
                            closedJobs: parseInt(res.data.stats.closedJobs || 0),
                            totalApplications: parseInt(res.data.stats.totalApplications || 0)
                        });
                    }
                } else {
                    setHasMore(false);
                }
            } catch (error) {
                console.error("Error fetching HR jobs", error);
            } finally {
                setLoading(false);
                setIsFetchingMore(false);
            }
        };
        fetchJobs();
    }, [recruiterDetails, page, debouncedSearchQuery, selectedStatuses, selectedCategories]);

    // We fetch jobs from API, so no frontend filtering needed
    const filteredJobs = jobs;

    const openJobsCount = overallStats.openJobs;
    const closedJobsCount = overallStats.closedJobs;
    const totalApplicationsCount = overallStats.totalApplications;

    // Chart Data Preparation
    const barChartData = filteredJobs.slice(0, 6).map(job => ({
        name: job.job_title.length > 15 ? job.job_title.substring(0, 15) + '...' : job.job_title,
        applications: parseInt(job.candidates_count) || 0
    }));

    const pieChartData = [
        { name: 'Open Jobs', value: openJobsCount, color: '#0A66C2' },
        { name: 'Closed Jobs', value: closedJobsCount, color: '#C5221F' }
    ];

    if (loading && page === 1 && jobs.length === 0 && overallStats.totalApplications === 0) {
        return (
            <div className="min-h-screen bg-white font-sans overflow-x-clip pb-12 text-gray-800 relative z-0">
                <div className="px-8 lg:px-12 relative z-20 max-w-[1440px] mx-auto pt-10">
                    {/* Header Area Skeleton */}
                    <div className="mb-6">
                        <div className="h-8 bg-gray-200 rounded-md w-64 mb-3 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded-md w-96 animate-pulse"></div>
                    </div>

                    {/* Stats Cards Skeleton */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-gray-50 rounded-2xl p-6 flex items-center justify-between border border-gray-100 animate-pulse">
                                <div className="space-y-3">
                                    <div className="h-8 bg-gray-200 rounded-md w-16"></div>
                                    <div className="h-3 bg-gray-200 rounded-md w-24"></div>
                                </div>
                                <div className="w-14 h-14 bg-gray-200 rounded-xl"></div>
                            </div>
                        ))}
                    </div>

                    {/* Charts Skeleton */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                        <div className="bg-white border border-gray-100 rounded-2xl p-6 lg:col-span-2 h-[380px] animate-pulse flex flex-col">
                            <div className="h-5 bg-gray-200 rounded-md w-1/3 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded-md w-1/2 mb-6"></div>
                            <div className="flex-grow bg-gray-50 rounded-lg w-full"></div>
                        </div>
                        <div className="bg-white border border-gray-100 rounded-2xl p-6 lg:col-span-1 h-[380px] animate-pulse flex flex-col">
                            <div className="h-5 bg-gray-200 rounded-md w-1/2 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded-md w-2/3 mb-6"></div>
                            <div className="flex-grow flex items-center justify-center">
                                <div className="w-48 h-48 bg-gray-100 rounded-full"></div>
                            </div>
                        </div>
                    </div>

                    {/* Jobs List Header Skeleton */}
                    <div className="flex items-center justify-between mb-3 mt-8">
                        <div className="h-5 bg-gray-200 rounded-md w-48 animate-pulse"></div>
                    </div>

                    {/* Jobs List Skeleton */}
                    <div className="bg-white">
                        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-[#F8FAFC] rounded-lg mb-4 hidden md:grid animate-pulse">
                            <div className="col-span-5 h-4 bg-gray-200 rounded-md"></div>
                            <div className="col-span-2 h-4 bg-gray-200 rounded-md"></div>
                            <div className="col-span-3 h-4 bg-gray-200 rounded-md"></div>
                            <div className="col-span-2 h-4 bg-gray-200 rounded-md text-right"></div>
                        </div>
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-4 px-4 py-4 border border-gray-100 rounded-lg items-center animate-pulse">
                                    <div className="md:col-span-5 flex flex-col justify-center space-y-2">
                                        <div className="h-4 bg-gray-200 rounded-md w-3/4"></div>
                                        <div className="h-3 bg-gray-200 rounded-md w-1/2"></div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <div className="h-4 bg-gray-200 rounded-md w-20"></div>
                                    </div>
                                    <div className="md:col-span-3">
                                        <div className="h-4 bg-gray-200 rounded-md w-24"></div>
                                    </div>
                                    <div className="md:col-span-2 flex justify-end">
                                        <div className="h-8 bg-gray-200 rounded-lg w-32"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white font-sans overflow-x-clip pb-12 text-gray-800 relative z-0">
            <div className="px-8 lg:px-8 relative z-20 max-w-[1440px] mx-auto pt-8">
                {/* Header Area */}
                <div className="mb-6">
                    <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight mb-0">
                        Hello, {recruiterDetails?.first_name || 'Santhosh'}
                    </h1>
                    <p className="text-gray-500 text-[14px] font-medium mt-1">Here is your daily activities and applications</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
                    {/* Card 1 */}
                    <div className="bg-[#EBF3FF] rounded-2xl p-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-[32px] font-bold text-gray-900 leading-tight">{openJobsCount}</h2>
                            <p className="text-[14px] text-gray-600 font-medium mt-1 mb-0">Open Jobs</p>
                        </div>
                        <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            <Briefcase size={24} className="text-[#0A66C2]" />
                        </div>
                    </div>

                    {/* Card 2 */}
                    <div className="bg-[#FFF4E5] rounded-2xl p-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-[32px] font-bold text-gray-900 leading-tight">{savedCandidatesCount}</h2>
                            <p className="text-[14px] text-gray-600 font-medium mt-1 mb-0">Saved Candidates</p>
                        </div>
                        <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            <User size={24} className="text-[#FF9800]" />
                        </div>
                    </div>

                    {/* Card 3 */}
                    <div className="bg-[#E6F4EA] rounded-2xl p-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-[32px] font-bold text-gray-900 leading-tight">{totalApplicationsCount}</h2>
                            <p className="text-[14px] text-gray-600 font-medium mt-1 mb-0">Total Applications</p>
                        </div>
                        <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            <Users size={24} className="text-[#137333]" />
                        </div>
                    </div>

                    {/* Card 4 */}
                    <div className="bg-[#FCE8E6] rounded-2xl p-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-[32px] font-bold text-gray-900 leading-tight">{closedJobsCount}</h2>
                            <p className="text-[14px] text-gray-600 font-medium mt-1 mb-0">Closed Jobs</p>
                        </div>
                        <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            <XCircle size={24} className="text-[#C5221F]" />
                        </div>
                    </div>
                </div>

                {/* Analytics Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                    {/* Bar Chart - Applications per job */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-6 lg:col-span-2">
                        <div className="mb-4">
                            <h3 className="text-[16px] font-semibold text-gray-800 mb-0">Applications per Job (Recent)</h3>
                            <p className="text-[13px] text-gray-500">Number of applications received for your latest job postings</p>
                        </div>
                        <div className="h-[300px] w-full">
                            {barChartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 12, fill: '#6b7280' }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 12, fill: '#6b7280' }}
                                            allowDecimals={false}
                                        />
                                        <Tooltip
                                            cursor={{ fill: '#f8fafc' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Bar dataKey="applications" fill="#0A66C2" radius={[4, 4, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center pb-8">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                                        <BarChart2 size={28} className="text-gray-300" />
                                    </div>
                                    <p className="text-[14px] text-gray-500 font-medium mb-0">Not enough data to display chart</p>
                                    <p className="text-[12px] text-gray-400 mt-1">Wait for applications to see insights</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pie Chart - Job Status Overview */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-6 lg:col-span-1 flex flex-col">
                        <div className="mb-4">
                            <h3 className="text-[16px] font-semibold text-gray-800 mb-0">Job Status Overview</h3>
                            <p className="text-[13px] text-gray-500">Active vs Expired Jobs</p>
                        </div>
                        <div className="h-[250px] w-full flex-grow flex items-center justify-center">
                            {(openJobsCount > 0 || closedJobsCount > 0) ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieChartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {pieChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center pb-4">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                                        <PieChartIcon size={28} className="text-gray-300" />
                                    </div>
                                    <p className="text-[14px] text-gray-500 font-medium">No jobs posted yet</p>
                                </div>
                            )}
                        </div>
                        {/* Legend */}
                        <div className="flex justify-center gap-6 mt-auto pt-2">
                            {pieChartData.map((item, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                    <span className="text-[13px] text-gray-600 font-medium">{item.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recently Posted Jobs Header */}
                <div className="flex items-center justify-between mb-3 mt-8">
                    <h3 className="text-[16px] font-semibold text-gray-800 mb-0">Recently Posted Jobs</h3>
                    <Link href="/my-jobs" className="text-[14px] cursor-pointer font-medium text-gray-500 hover:text-[#FB6202] flex items-center gap-1 transition-colors">
                        View all <span className="text-lg">→</span>
                    </Link>
                </div>

                {/* Jobs Table */}
                <div className="bg-white">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-[#F8FAFC] rounded-lg mb-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider items-center hidden md:grid">
                        <div className="col-span-5">JOBS</div>
                        <div className="col-span-2">STATUS</div>
                        <div className="col-span-3">APPLICATIONS</div>
                        <div className="col-span-2 text-right pr-12">ACTIONS</div>
                    </div>

                    {/* Table Body */}
                    <div className="space-y-0">
                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-4 px-4 py-4 border border-gray-100 rounded-lg items-center animate-pulse">
                                        <div className="md:col-span-5 flex flex-col justify-center space-y-2">
                                            <div className="h-4 bg-gray-200 rounded-md w-3/4"></div>
                                            <div className="h-3 bg-gray-200 rounded-md w-1/2"></div>
                                        </div>
                                        <div className="md:col-span-2">
                                            <div className="h-4 bg-gray-200 rounded-md w-20"></div>
                                        </div>
                                        <div className="md:col-span-3">
                                            <div className="h-4 bg-gray-200 rounded-md w-24"></div>
                                        </div>
                                        <div className="md:col-span-2 flex justify-end">
                                            <div className="h-8 bg-gray-200 rounded-lg w-32"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredJobs.length > 0 ? (
                            filteredJobs.map((job, idx) => {
                                const isActive = job.is_closed === 0;
                                const isLastItem = idx === filteredJobs.length - 1;

                                return (
                                    <div
                                        key={job.id || idx}
                                        ref={isLastItem ? lastJobElementRef : null}
                                        className={`grid grid-cols-1 md:grid-cols-12 gap-4 px-4 py-4 border border-gray-100 hover:bg-gray-50/50 transition-colors items-center relative group mb-3 rounded-lg ${openDropdownId === job.id ? 'bg-[#F8FAFC] border-[#0A66C2] shadow-[0_0_0_1px_#0A66C2]' : ''}`}
                                    >
                                        {/* Jobs Col */}
                                        <div className="md:col-span-5 flex flex-col justify-center">
                                            <h4 className="text-[15px] font-bold text-gray-900 mb-1 truncate">{job.job_title}</h4>
                                            <p className="text-[13px] text-gray-500 font-medium mb-0">
                                                {job.job_type || 'Full Time'} •
                                                {job.created_at ? ` Posted on ${format(new Date(job.created_at), 'MMM dd, yyyy')} (${formatDistanceToNow(new Date(job.created_at), { addSuffix: true })})` : ' Recently'}
                                            </p>
                                        </div>

                                        {/* Status Col */}
                                        <div className="md:col-span-2 flex items-center">
                                            {isActive ? (
                                                <div className="flex items-center gap-1.5 text-[#00e654] font-bold text-[13px]">
                                                    <CheckCircle size={16} /> Active
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-red-500 font-bold text-[13px]">
                                                    <XCircle size={16} /> Expire
                                                </div>
                                            )}
                                        </div>

                                        {/* Applications Col */}
                                        <div className="md:col-span-3 flex items-center text-gray-500 font-medium text-[14px] gap-2">
                                            <Users size={16} className="text-gray-400" />
                                            {job.candidates_count || 0} Applications
                                        </div>

                                        {/* Actions Col */}
                                        <div className="md:col-span-2 flex items-center justify-end gap-3 relative">
                                            <a target='_blank' rel="noopener noreferrer" href={`https://careerfast.in/job-details/${job.id}?preview=true`}>
                                                <button className="text-[#FB6202] border border-[#FB6202] hover:bg-[#FB6202] hover:text-white text-[13px] font-medium px-3 py-1.5 rounded-lg transition-colors">
                                                    View Applications
                                                </button>
                                            </a>
                                        </div>
                                    </div>
                                )
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-b-lg border-b border-gray-100">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-5 border border-gray-100">
                                    <Briefcase size={32} className="text-gray-300" />
                                </div>
                                <h3 className="text-[18px] font-semibold text-gray-900 mb-2">No jobs posted yet</h3>
                                <p className="text-[14px] text-gray-500 max-w-md mx-auto mb-6 leading-relaxed">
                                    You haven't posted any jobs yet. Create your first job posting to start receiving applications from great candidates.
                                </p>
                                <Link href="/post-jobs" className="no-underline hover:no-underline">
                                    <button className="bg-[#0A66C2] hover:bg-[#004182] text-white px-6 py-2.5 rounded-md text-[14px] font-medium transition-all shadow-sm flex items-center gap-2">
                                        <span>Post a Job</span>
                                    </button>
                                </Link>
                            </div>
                        )}
                        {isFetchingMore && (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A66C2]"></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {jobToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                    <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4 animate-fade-in-up">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Job Post</h3>
                        <p className="text-gray-600 mb-6 text-sm">Are you sure you want to permanently delete this job post? This action cannot be undone.</p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setJobToDelete(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition">Cancel</button>
                            <button onClick={() => handleDeleteJob(jobToDelete)} disabled={isDeleting} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center min-w-[80px]">
                                {isDeleting ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                    "Delete"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HrJobs;
