import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Users, Briefcase, FileCheck, Building, TrendingUp, Download } from 'lucide-react';
import { getSuperAdminDashboardStats } from '../ApiService/action';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const StatCard = ({ title, value, icon: Icon, color, bg, accent }) => (
    <div className="bg-white rounded-2xl p-4 relative overflow-hidden group">
        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full ${bg} opacity-50 -translate-y-10 translate-x-10 group-hover:scale-110 transition-transform duration-500`}></div>
        <div className="flex items-center justify-between mb-3 relative z-10">
            <div className={`p-2.5 rounded-lg ${bg} ${color} ring-1 ring-inset ${accent}`}>
                <Icon className="w-5 h-5" strokeWidth={2} />
            </div>
            <div className="flex items-center text-[13px] font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                <TrendingUp className="w-3 h-3 mr-1" />
                <span>+12%</span>
            </div>
        </div>
        <div className="relative z-10">
            <h4 className="text-gray-500 text-[15px] font-medium mb-1">{title}</h4>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{value}</h2>
        </div>
    </div>
);

export default function AnalyticsReport() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        summary: { totalUsers: 0, activeJobs: 0, totalApplications: 0, totalEmployers: 0 },
        userGrowth: [],
        applicationTrends: [],
        jobsByCategory: []
    });

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await getSuperAdminDashboardStats();

                if (response.data && response.data.data) {
                    setData(response.data.data);
                } else if (response.data) {
                    setData(response.data);
                }
            } catch (error) {
                console.error("Error fetching analytics data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    const handleExport = () => {
        if (!data || !data.summary) return;
        
        const csvRows = [];
        csvRows.push(['Metric', 'Count']);
        csvRows.push(['Total Users', data.summary.totalUsers || 0]);
        csvRows.push(['Active Jobs', data.summary.activeJobs || 0]);
        csvRows.push(['Total Applications', data.summary.totalApplications || 0]);
        csvRows.push(['Total Employers', data.summary.totalEmployers || 0]);
        
        // Add User Growth Trends
        if (data.userGrowth && data.userGrowth.length > 0) {
            csvRows.push([]);
            csvRows.push(['User Growth Month', 'New Users']);
            data.userGrowth.forEach(item => {
                csvRows.push([item.name, item.uv]);
            });
        }

        const csvContent = csvRows.map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "analytics_report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="w-full animate-pulse">
                {/* Header Skeleton */}
                <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-72"></div>
                    </div>
                    <div className="h-10 bg-gray-200 rounded w-36"></div>
                </div>

                {/* Stats Cards Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-lg bg-gray-200"></div>
                                <div className="w-16 h-6 rounded-full bg-gray-200"></div>
                            </div>
                            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                            <div className="h-8 bg-gray-200 rounded w-16"></div>
                        </div>
                    ))}
                </div>

                {/* Charts Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {[...Array(2)].map((_, i) => (
                        <div key={i} className="bg-white p-6 rounded-2xl">
                            <div className="flex items-center mb-6">
                                <div className="w-4 h-4 rounded-full bg-gray-200 mr-2"></div>
                                <div className="h-5 bg-gray-200 rounded w-48"></div>
                            </div>
                            <div className="h-[300px] w-full bg-gray-100 rounded-lg"></div>
                        </div>
                    ))}
                </div>

                {/* Bottom Row Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl lg:col-span-1">
                        <div className="flex items-center mb-6">
                            <div className="w-4 h-4 rounded-full bg-gray-200 mr-2"></div>
                            <div className="h-5 bg-gray-200 rounded w-32"></div>
                        </div>
                        <div className="h-[250px] w-full flex items-center justify-center">
                            <div className="w-48 h-48 rounded-full bg-gray-100 border-8 border-gray-50"></div>
                        </div>
                    </div>
                    <div className="bg-gray-200 p-8 rounded-2xl lg:col-span-2 flex flex-col justify-center">
                        <div className="h-6 bg-gray-300 rounded-full w-24 mb-4"></div>
                        <div className="h-10 bg-gray-300 rounded w-64 mb-4"></div>
                        <div className="h-4 bg-gray-300 rounded w-full max-w-md mb-2"></div>
                        <div className="h-4 bg-gray-300 rounded w-3/4 max-w-sm mb-6"></div>
                        <div className="h-10 bg-gray-300 rounded-full w-32"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full animate-in fade-in duration-500">
            <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-0">Platform Analytics</h1>
                    <p className="text-gray-500 text-[14px] mt-1 mb-0">Comprehensive overview of platform growth and activity.</p>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 px-4 py-2 rounded-lg font-medium text-[14px] transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
                >
                    <Download className="w-4 h-4" />
                    Download Report
                </button>
            </div>

            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total Users"
                    value={data.summary.totalUsers.toLocaleString()}
                    icon={Users}
                    color="text-blue-600"
                    bg="bg-blue-50"
                    accent="ring-blue-100"
                />
                <StatCard
                    title="Active Jobs"
                    value={data.summary.activeJobs.toLocaleString()}
                    icon={Briefcase}
                    color="text-emerald-600"
                    bg="bg-emerald-50"
                    accent="ring-emerald-100"
                />
                <StatCard
                    title="Total Applications"
                    value={data.summary.totalApplications.toLocaleString()}
                    icon={FileCheck}
                    color="text-amber-600"
                    bg="bg-amber-50"
                    accent="ring-amber-100"
                />
                <StatCard
                    title="Total Employers"
                    value={data.summary.totalEmployers.toLocaleString()}
                    icon={Building}
                    color="text-purple-600"
                    bg="bg-purple-50"
                    accent="ring-purple-100"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* User Growth Line Chart */}
                <div className="bg-white p-6 rounded-2xl">
                    <h3 className="text-[15px] font-semibold text-gray-900 mb-6 flex items-center">
                        <Users className="w-4 h-4 mr-2 text-blue-500" />
                        User Registration Trends
                    </h3>
                    <div className="h-[300px] w-full">
                        {data.userGrowth.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data.userGrowth}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                                    <RechartsTooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Line type="monotone" dataKey="uv" name="New Users" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 text-sm">No user growth data available</div>
                        )}
                    </div>
                </div>

                {/* Applications Bar Chart */}
                <div className="bg-white p-6 rounded-2xl">
                    <h3 className="text-[15px] font-semibold text-gray-900 mb-6 flex items-center">
                        <FileCheck className="w-4 h-4 mr-2 text-amber-500" />
                        Applications Received
                    </h3>
                    <div className="h-[300px] w-full">
                        {data.applicationTrends.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.applicationTrends}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                                    <RechartsTooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="pv" name="Applications" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={32} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 text-sm">No application data available</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Jobs by Category Pie Chart */}
                <div className="bg-white p-6 rounded-2xl lg:col-span-1">
                    <h3 className="text-[15px] font-semibold text-gray-900 mb-6 flex items-center">
                        <Briefcase className="w-4 h-4 mr-2 text-purple-500" />
                        Jobs by Nature
                    </h3>
                    <div className="h-[250px] w-full flex items-center justify-center">
                        {data.jobsByCategory.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.jobsByCategory}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {data.jobsByCategory.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend
                                        layout="horizontal"
                                        verticalAlign="bottom"
                                        align="center"
                                        iconType="circle"
                                        wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-gray-400 text-sm">No job distribution data</div>
                        )}
                    </div>
                </div>

                {/* Additional Widget (Placeholder for Future) */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-2xl shadow-md lg:col-span-2 text-white relative overflow-hidden flex flex-col justify-center">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-20 translate-x-20"></div>
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-white opacity-10 rounded-full translate-y-16 -translate-x-10"></div>

                    <div className="relative z-10 max-w-md">
                        <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">Pro Feature</span>
                        <h2 className="text-3xl font-bold mb-3">Unlock Advanced Reports</h2>
                        <p className="text-blue-100 text-[15px] mb-6 leading-relaxed">
                            Upgrade to Premium to access predictive analytics, automated PDF reporting, and deeper insights into applicant demographics.
                        </p>
                        <button className="bg-white text-blue-700 px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-blue-50 transition-colors shadow-sm">
                            Upgrade Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
