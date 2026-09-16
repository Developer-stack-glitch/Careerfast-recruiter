import React, { useState, useEffect } from 'react';
import {
    Users, Briefcase, FileText, TrendingUp, TrendingDown,
    Activity, Building2, UserPlus, Download, Loader2, FileCheck2,
    X, Mail, Phone
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { getSuperAdminDashboardStats } from '../ApiService/action';
import { useRouter } from 'next/navigation';

const StatCard = ({ title, value, change, isPositive, icon: Icon, color, bg }) => (
    <div className="bg-white rounded-xl shadow-xs p-4 transition-shadow">
        <div className="flex items-start justify-between mb-3">
            <div className={`p-2 rounded-lg ${bg} ${color}`}>
                <Icon className="w-[18px] h-[18px]" strokeWidth={1.5} />
            </div>
            {change && (
                <div className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${isPositive ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}>
                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {change}
                </div>
            )}
        </div>
        <div>
            <h4 className="text-gray-500 text-[12px] font-medium mb-0.5">{title}</h4>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-0">{value}</h2>
        </div>
    </div>
);

const UserDetailsModal = ({ isOpen, onClose, userDetails }) => {
    if (!isOpen || !userDetails) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>

                {/* Banner / Cover */}
                <div className="relative h-20 bg-gradient-to-r from-blue-600 to-indigo-700">
                    <button onClick={onClose} className="absolute top-4 right-4 p-1.5 bg-black/20 text-white hover:bg-black/40 rounded-full transition-colors focus:outline-none backdrop-blur-md">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-8 pb-8 relative">
                    {/* Avatar Overlapping Banner */}
                    <div className="absolute -top-12 left-8 border-4 border-white rounded-full bg-white shadow-md">
                        {userDetails.profileImage ? (
                            <img src={userDetails.profileImage} alt={userDetails.user} className="w-20 h-20 rounded-full object-contain bg-white" />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-2xl">
                                {userDetails.user ? userDetails.user.charAt(0).toUpperCase() : 'U'}
                            </div>
                        )}
                    </div>

                    {/* Status Badge */}
                    <div className="flex justify-end pt-4 mb-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase ${userDetails.status === 'Active' || userDetails.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                            }`}>
                            {userDetails.status}
                        </span>
                    </div>

                    {/* Name & Role */}
                    <div className="mt-2 mb-8">
                        <h3 className="text-xl font-bold text-gray-900">{userDetails.user || 'Unknown User'}</h3>
                        <p className="text-[13px] text-gray-500 font-medium mt-0.5">
                            {userDetails.action.includes('Candidate') ? 'Candidate Account' : userDetails.action.includes('Recruiter') ? 'Recruiter Account' : 'Company Account'}
                        </p>
                    </div>

                    {/* Info Grid */}
                    <div className="space-y-5">
                        <div className="flex items-start gap-3.5 group">
                            <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                                <Mail className="w-4 h-4 text-gray-500 group-hover:text-blue-600" />
                            </div>
                            <div className="flex flex-col pt-0.5">
                                <span className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">Email Address</span>
                                <span className="text-sm font-medium text-gray-900 mt-0.5">
                                    {userDetails.email !== '-' ? userDetails.email : <span className="text-gray-400 font-normal italic">Not provided</span>}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-start gap-3.5 group">
                            <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                                <Phone className="w-4 h-4 text-gray-500 group-hover:text-blue-600" />
                            </div>
                            <div className="flex flex-col pt-0.5">
                                <span className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">Phone Number</span>
                                <span className="text-sm font-medium text-gray-900 mt-0.5">
                                    {userDetails.phone !== '-' ? userDetails.phone : <span className="text-gray-400 font-normal italic">Not provided</span>}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-start gap-3.5 group">
                            <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                                <Building2 className="w-4 h-4 text-gray-500 group-hover:text-blue-600" />
                            </div>
                            <div className="flex flex-col pt-0.5">
                                <span className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">Organization</span>
                                <span className="text-sm font-medium text-gray-900 mt-0.5">
                                    {userDetails.companyName !== '-' ? userDetails.companyName : <span className="text-gray-400 font-normal italic">Not specified</span>}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-start gap-3.5 group">
                            <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                                <Activity className="w-4 h-4 text-gray-500 group-hover:text-blue-600" />
                            </div>
                            <div className="flex flex-col pt-0.5">
                                <span className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">Recent Activity</span>
                                <span className="text-sm font-medium text-gray-900 mt-0.5">
                                    {userDetails.action}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function Overview() {
    const router = useRouter();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeFilter, setTimeFilter] = useState('This Quarter');
    const [userDetails, setUserDetails] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleUserClick = (user) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const response = await getSuperAdminDashboardStats(timeFilter);
                setData(response.data?.data || response.data);
            } catch (err) {
                console.error("Failed to fetch dashboard stats", err);
                setError("Failed to load dashboard data. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [timeFilter]);

    const handleExport = () => {
        if (!data || !data.counts) return;
        
        const csvRows = [];
        csvRows.push(['Metric', 'Count']);
        csvRows.push(['Total Users', (data.counts.candidates || 0) + (data.counts.recruiters || 0)]);
        csvRows.push(['Active Recruiters', data.counts.recruiters || 0]);
        csvRows.push(['Live Job Postings', data.counts.jobs || 0]);
        csvRows.push(['Total Applications', data.counts.applications || 0]);
        
        const csvContent = csvRows.map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `dashboard_stats_${timeFilter.replace(/\s+/g, '_').toLowerCase()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="max-w-[1400px] mx-auto w-full animate-in fade-in duration-300">
                {/* Header Skeleton */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div className="space-y-2">
                        <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-72 animate-pulse"></div>
                    </div>
                    <div className="flex gap-3">
                        <div className="h-9 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
                        <div className="h-9 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
                    </div>
                </div>

                {/* KPI Cards Skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="bg-white rounded-xl shadow-xs p-4 h-[140px]">
                            <div className="flex justify-between items-start mb-3">
                                <div className="w-8 h-8 rounded-lg bg-gray-200 animate-pulse"></div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                                <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Charts Area Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-xs p-4 h-[360px]">
                        <div className="h-5 bg-gray-200 rounded w-40 animate-pulse mb-6"></div>
                        <div className="w-full h-[280px] bg-gray-100 rounded-lg animate-pulse"></div>
                    </div>
                    <div className="bg-white rounded-xl shadow-xs p-4 h-[360px] flex flex-col">
                        <div className="h-5 bg-gray-200 rounded w-36 animate-pulse mb-6"></div>
                        <div className="flex-1 flex flex-col items-center justify-center gap-6">
                            <div className="w-48 h-48 rounded-full border-[20px] border-gray-100 animate-pulse"></div>
                        </div>
                    </div>
                </div>

                {/* Additional Details Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-xl shadow-xs p-4 h-[340px] flex flex-col">
                            <div className="h-5 bg-gray-200 rounded w-40 animate-pulse mb-6"></div>
                            <div className="flex-1 flex flex-col items-center justify-center gap-6">
                                <div className="w-40 h-40 rounded-full border-[16px] border-gray-100 animate-pulse"></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Table Skeleton */}
                <div className="bg-white rounded-xl shadow-xs overflow-hidden">
                    <div className="px-5 py-4 flex justify-between items-center">
                        <div className="h-5 bg-gray-200 rounded w-48 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </div>
                    <div className="p-5 space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="flex gap-4 items-center">
                                <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
                                <div className="h-4 bg-gray-200 rounded flex-1 animate-pulse"></div>
                                <div className="h-4 bg-gray-200 rounded flex-1 animate-pulse"></div>
                                <div className="h-4 bg-gray-200 rounded flex-1 animate-pulse"></div>
                                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-[1400px] mx-auto w-full h-[600px] flex flex-col items-center justify-center animate-in fade-in duration-300">
                <div className="p-4 bg-red-50 text-red-600 rounded-xl font-medium border border-red-100">
                    {error}
                </div>
            </div>
        );
    }

    const { counts, lists, monthlyData, distributions } = data;

    // Format Stat Cards
    const totalUsers = (counts?.candidates || 0) + (counts?.recruiters || 0);
    const activeRecruiters = counts?.recruiters || 0;
    const liveJobs = counts?.jobs || 0;
    const totalApplications = counts?.applications || 0;

    // Process Chart Data: Merge candidates and jobs by month
    const processedMonthlyData = [];
    const allMonths = new Set([
        ...(monthlyData?.candidates || []).map(item => item.month),
        ...(monthlyData?.jobs || []).map(item => item.month)
    ]);

    Array.from(allMonths).sort().forEach(month => {
        const cand = (monthlyData?.candidates || []).find(item => item.month === month);
        const job = (monthlyData?.jobs || []).find(item => item.month === month);

        // Format month for display e.g., '2023-01' -> 'Jan 23'
        const dateObj = new Date(month + '-01');
        const monthName = dateObj.toLocaleString('default', { month: 'short' });
        const yearNum = dateObj.getFullYear().toString().slice(-2);

        processedMonthlyData.push({
            name: `${monthName} ${yearNum}`,
            candidates: cand ? cand.count : 0,
            jobs: job ? job.count : 0
        });
    });

    // Process Pie Chart Data
    const total = totalUsers;
    const candidatesPercent = total > 0 ? Math.round(((counts?.candidates || 0) / total) * 100) : 0;
    const recruitersPercent = total > 0 ? Math.round(((counts?.recruiters || 0) / total) * 100) : 0;

    const demographicsData = [
        { name: 'Candidates', value: candidatesPercent, color: '#3b82f6' },
        { name: 'Recruiters', value: recruitersPercent, color: '#10b981' },
    ];

    // Parse Categories for BarChart
    const getCategoryData = () => {
        if (!distributions?.categories) return [];
        const countsMap = {};
        distributions.categories.forEach(item => {
            try {
                const cats = typeof item.job_category === 'string' ? JSON.parse(item.job_category) : item.job_category;
                if (Array.isArray(cats)) {
                    cats.forEach(cat => { if (cat) countsMap[cat] = (countsMap[cat] || 0) + 1; });
                }
            } catch (e) {
                if (item.job_category) countsMap[item.job_category] = (countsMap[item.job_category] || 0) + 1;
            }
        });
        return Object.entries(countsMap)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5); // top 5
    };

    // Parse Workplace stats for Donut Chart
    const getWorkplaceData = () => {
        if (!distributions?.workplace) return [];
        const colors = ["#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#ef4444"];
        return distributions.workplace.map((item, idx) => ({
            name: item.workplace_type || "Unknown",
            value: item.count,
            color: colors[idx % colors.length]
        }));
    };

    // Parse Status distribution for Status Donut Chart
    const getStatusDistribution = () => {
        if (!distributions?.status) return [];
        const colors = {
            Shortlisted: "#10b981",
            Rejected: "#ef4444",
            "Mail Sent": "#0ea5e9",
            Pending: "#f59e0b",
        };
        return distributions.status.map(item => ({
            name: item.status || "Pending",
            value: item.count,
            color: colors[item.status] || "#6366f1"
        }));
    };

    // Process Activity Feed
    const combinedActivity = [
        ...(lists?.candidates || []).map(c => ({
            id: `cand_${c.id}`,
            user: `${c.first_name || ''} ${c.last_name || ''}`.trim(),
            email: c.email || '-',
            phone: c.mobile || c.phone || '-',
            companyName: '-',
            profileImage: c.profile_image || c.profile_picture || c.photo || c.avatar || null,
            action: 'Registered as Candidate',
            company: '-',
            time: c.created_date,
            status: c.is_active ? 'Active' : 'Pending'
        })),
        ...(lists?.recruiters || []).map(r => ({
            id: `rec_${r.id}`,
            user: `${r.first_name || ''} ${r.last_name || ''}`.trim(),
            email: r.email || '-',
            phone: r.mobile_no || r.mobile || r.phone || '-',
            companyName: r.organization || '-',
            profileImage: r.profile_image || r.profile_picture || r.photo || r.avatar || null,
            action: 'Registered as Recruiter',
            company: r.organization || '-',
            time: r.created_date,
            status: r.is_active ? 'Active' : 'Pending'
        })),
        ...(lists?.jobs || []).map(j => ({
            id: `job_${j.id}`,
            user: j.company_name || 'Company',
            email: j.hr_email || j.email || j.contact_email || '-',
            phone: j.contact_number || j.mobile || j.phone || '-',
            companyName: j.company_name || '-',
            profileImage: j.company_logo || j.logo || null,
            action: 'Posted New Job',
            company: j.job_title || 'Position',
            time: j.created_at,
            status: 'Active'
        }))
    ];

    // Sort by time descending and take top 5
    const recentActivity = combinedActivity
        .filter(item => item.time) // Ensure time exists
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(0, 5)
        .map(item => {
            // Format time string
            const date = new Date(item.time);
            const now = new Date();
            const diffInHours = Math.abs(now - date) / 36e5;

            let timeStr;
            if (diffInHours < 1) {
                timeStr = 'Just now';
            } else if (diffInHours < 24) {
                timeStr = `${Math.floor(diffInHours)} hours ago`;
            } else {
                timeStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }

            return { ...item, time: timeStr };
        });

    return (
        <div className="max-w-[1400px] mx-auto w-full animate-in fade-in duration-300">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight mb-0">Super Admin Overview</h1>
                    <p className="text-[13px] text-gray-500 mt-0.5 mb-0">Monitor platform metrics, user growth, and system health.</p>
                </div>
                <div className="flex items-center gap-3">
                    <select 
                        value={timeFilter} 
                        onChange={(e) => setTimeFilter(e.target.value)}
                        className="bg-white border border-gray-200 text-gray-700 text-[13px] rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-3 py-1.5 outline-none cursor-pointer"
                    >
                        <option value="Last 7 Days">Last 7 Days</option>
                        <option value="Last 30 Days">Last 30 Days</option>
                        <option value="This Quarter">This Quarter</option>
                        <option value="This Year">This Year</option>
                        <option value="All Time">All Time</option>
                    </select>
                    <button 
                        onClick={handleExport}
                        className="bg-[#3b82f6] hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors shadow-sm flex items-center gap-1.5"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Export
                    </button>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
                <StatCard
                    title="Total Users"
                    value={totalUsers.toLocaleString()}
                    icon={Users}
                    color="text-blue-600"
                    bg="bg-blue-50"
                />
                <StatCard
                    title="Active Recruiters"
                    value={activeRecruiters.toLocaleString()}
                    icon={Briefcase}
                    color="text-emerald-600"
                    bg="bg-emerald-50"
                />
                <StatCard
                    title="Live Job Postings"
                    value={liveJobs.toLocaleString()}
                    icon={FileText}
                    color="text-purple-600"
                    bg="bg-purple-50"
                />
                <StatCard
                    title="Total Applications"
                    value={totalApplications.toLocaleString()}
                    icon={FileCheck2}
                    color="text-rose-600"
                    bg="bg-rose-50"
                />
                <StatCard
                    title="System Health"
                    value="99.9%"
                    isPositive={true}
                    icon={Activity}
                    color="text-amber-600"
                    bg="bg-amber-50"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                {/* Main Area Chart */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-xs p-4">
                    <div className="flex justify-between items-center mb-5">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-red-500" />
                            <h3 className="text-[15px] font-semibold text-gray-900 mb-0">Platform Growth Trends</h3>
                        </div>
                        <div className="flex gap-4 items-center">
                            <div className="flex items-center gap-1.5 text-[12px] text-gray-600">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Candidates
                            </div>
                            <div className="flex items-center gap-1.5 text-[12px] text-gray-600">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Jobs
                            </div>
                        </div>
                    </div>
                    <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={processedMonthlyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorCandidates" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorJobs" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8f9fa" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', fontSize: '12px' }}
                                />
                                <Area type="monotone" dataKey="candidates" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCandidates)" />
                                <Area type="monotone" dataKey="jobs" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorJobs)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart */}
                <div className="bg-white rounded-xl shadow-xs p-4 flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                        <Users className="w-4 h-4 text-red-500" />
                        <h3 className="text-[15px] font-semibold text-gray-900 mb-0">User Demographics</h3>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center relative">
                        <div className="h-[200px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={demographicsData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={95}
                                        paddingAngle={6}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {demographicsData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value) => `${value}%`}
                                        contentStyle={{ borderRadius: '8px', backgroundColor: "white", border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', fontSize: '12px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Inner label */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                                <span className="text-xl font-bold text-gray-900 leading-none">{candidatesPercent}%</span>
                                <span className="text-[9px] text-gray-500 font-medium uppercase tracking-widest mt-0.5">Candidates</span>
                            </div>
                        </div>
                        {/* Custom Legend */}
                        <div className="w-full mt-4 space-y-2.5">
                            {demographicsData.map((item, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                                        <span className="text-[13px] text-gray-600">{item.name}</span>
                                    </div>
                                    <span className="text-[13px] font-semibold text-gray-900">{item.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                {/* Application Statuses */}
                <div className="bg-white rounded-xl shadow-xs p-4 flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                        <FileCheck2 className="w-4 h-4 text-red-500" />
                        <h3 className="text-[15px] font-semibold text-gray-900 mb-0">Application Statuses</h3>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center relative">
                        {getStatusDistribution().length > 0 ? (
                            <>
                                <div className="h-[200px] w-full relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={getStatusDistribution()}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={85}
                                                paddingAngle={4}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {getStatusDistribution().map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value) => [`${value} applications`]}
                                                contentStyle={{ borderRadius: '8px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', fontSize: '12px' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="w-full mt-4 space-y-2.5">
                                    {getStatusDistribution().map((item, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                                                <span className="text-[13px] text-gray-600">{item.name}</span>
                                            </div>
                                            <span className="text-[13px] font-semibold text-gray-900">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="text-gray-400 text-sm py-10">No data available</div>
                        )}
                    </div>
                </div>

                {/* Top Job Categories */}
                <div className="bg-white rounded-xl shadow-xs p-4 flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                        <Briefcase className="w-4 h-4 text-red-500" />
                        <h3 className="text-[15px] font-semibold text-gray-900 mb-0">Top Job Categories</h3>
                    </div>
                    <div className="flex-1">
                        {getCategoryData().length > 0 ? (
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={getCategoryData()} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f8f9fa" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 11 }} width={100} />
                                    <Tooltip
                                        cursor={{ fill: '#f8f9fa' }}
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', fontSize: '12px' }}
                                    />
                                    <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-gray-400 text-sm text-center py-10">No data available</div>
                        )}
                    </div>
                </div>

                {/* Workplace Distribution */}
                <div className="bg-white rounded-xl shadow-xs p-4 flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                        <Building2 className="w-4 h-4 text-red-500" />
                        <h3 className="text-[15px] font-semibold text-gray-900 mb-0">Workplace Distribution</h3>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center relative">
                        {getWorkplaceData().length > 0 ? (
                            <>
                                <div className="h-[200px] w-full relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={getWorkplaceData()}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={85}
                                                paddingAngle={4}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {getWorkplaceData().map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value) => [`${value} jobs`]}
                                                contentStyle={{ borderRadius: '8px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', fontSize: '12px' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="w-full mt-4 space-y-2.5">
                                    {getWorkplaceData().map((item, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                                                <span className="text-[13px] text-gray-600">{item.name}</span>
                                            </div>
                                            <span className="text-[13px] font-semibold text-gray-900">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="text-gray-400 text-sm py-10">No data available</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Activity Table */}
            <div className="bg-white rounded-xl shadow-xs overflow-hidden mb-6">
                <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
                    <h3 className="text-[15px] font-semibold text-gray-900 mb-0">Recent Platform Activity</h3>
                    <button onClick={() => router.push('/admin/employers')} className="text-[13px] text-blue-600 font-medium hover:text-blue-700 transition-colors">
                        View All
                    </button>
                </div>
                <div className="overflow-x-auto pb-1 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-gray-50 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">User / Entity</th>
                                <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Company Name</th>
                                <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Phone.no</th>
                                <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Action Details</th>
                                <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Target / Subject</th>
                                <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                                <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {recentActivity.map((activity) => (
                                <tr key={activity.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-5 py-3 whitespace-nowrap">
                                        <div className="flex items-center gap-2.5">
                                            {activity.profileImage ? (
                                                <img src={activity.profileImage} alt={activity.user} className="w-7 h-7 rounded-full object-contain border border-gray-200" />
                                            ) : (
                                                <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-[11px] border border-blue-100">
                                                    {activity.user ? activity.user.charAt(0).toUpperCase() : 'U'}
                                                </div>
                                            )}
                                            <button
                                                onClick={() => handleUserClick(activity)}
                                                className="text-[13px] font-medium text-gray-900 hover:text-blue-600 transition-colors focus:outline-none focus:underline"
                                            >
                                                {activity.user || 'Unknown User'}
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 whitespace-nowrap text-[13px] text-gray-600">
                                        {activity.email}
                                    </td>
                                    <td className="px-5 py-3 whitespace-nowrap text-[13px] text-gray-600">
                                        {activity.companyName}
                                    </td>
                                    <td className="px-5 py-3 whitespace-nowrap text-[13px] text-gray-600">
                                        {activity.phone}
                                    </td>
                                    <td className="px-5 py-3 whitespace-nowrap">
                                        <span className="text-[13px] text-gray-600 flex items-center gap-2">
                                            {activity.action.includes('Registered') && <UserPlus className="w-3.5 h-3.5 text-gray-400" />}
                                            {activity.action.includes('Job') && <Briefcase className="w-3.5 h-3.5 text-gray-400" />}
                                            {activity.action}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 whitespace-nowrap">
                                        <span className="text-[13px] text-gray-500 flex items-center gap-1.5">
                                            {activity.company !== '-' && <Building2 className="w-3.5 h-3.5 text-gray-400" />}
                                            {activity.company}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 whitespace-nowrap">
                                        <span className="text-[12px] text-gray-500">{activity.time}</span>
                                    </td>
                                    <td className="px-5 py-3 whitespace-nowrap">
                                        <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${activity.status === 'Approved' || activity.status === 'Active' || activity.status === 'Verified'
                                            ? 'bg-emerald-50 text-emerald-700'
                                            : 'bg-amber-50 text-amber-700'
                                            }`}>
                                            {activity.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}

                            {recentActivity.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="px-5 py-8 text-center text-gray-500 text-[13px]">
                                        No recent activity to display
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <UserDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                userDetails={selectedUser}
            />
        </div>
    );
}
