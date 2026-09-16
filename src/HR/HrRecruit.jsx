'use client';
import React, { useState, useEffect } from 'react';
import { getAppliedCandidatesCount, StatsOfPost, getAllCandidateByRecruiter } from '../ApiService/action';
import {
  Search,
  Mail,
  Bell,
  MessageSquare,
  ChevronDown,
  Calendar,
  MoreVertical,
  LogOut,
  User,
  Briefcase,
  Users,
  CheckCircle,
  Award,
  TrendingUp,
  TrendingDown,
  Filter,
  ArrowRight,
  ChevronRight,
  List,
  Grid,
  Paperclip,
  Clock,
  ChevronsUpDown,
  FileText,
  Link2,
  Trash2,
  ChevronLeft,
  ChevronUp
} from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';

const ParticlesBg = dynamic(() => import('particles-bg'), { ssr: false });

// Animation Variants
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const fadeScale = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const dropDown = {
  hidden: { opacity: 0, y: -30 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } }
};

const HrRecruitSkeleton = () => (
  <div className="px-8 lg:px-12 relative z-20 max-w-[1440px] mx-auto space-y-6 pt-2">
    {/* Stats Grid Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-white rounded-[1.25rem] p-4 h-[150px] border border-[#f1f5f9] flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-[14px] bg-[#f1f5f9] animate-pulse flex items-center justify-center"><span className="sr-only">Loading</span></div>
          </div>
          <div>
            <div className="w-24 h-4 bg-[#f1f5f9] rounded animate-pulse mb-2"><span className="sr-only">Loading</span></div>
            <div className="w-16 h-8 bg-[#e2e8f0] rounded animate-pulse"><span className="sr-only">Loading</span></div>
          </div>
        </div>
      ))}
    </div>

    {/* Charts Row Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-[1.25rem] p-7 border border-[#f1f5f9] lg:col-span-4 h-[320px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div className="w-32 h-5 bg-[#f1f5f9] rounded animate-pulse"><span className="sr-only">Loading</span></div>
            <div className="w-20 h-8 bg-[#f8fafc] rounded-lg animate-pulse"><span className="sr-only">Loading</span></div>
          </div>
          <div className="flex-1 bg-[#f8fafc] rounded-xl animate-pulse"><span className="sr-only">Loading</span></div>
        </div>
      ))}
    </div>

    {/* Candidates Skeleton */}
    <div className="bg-white rounded-[1rem] p-8 border border-[#f1f5f9] mb-12">
      <div className="flex flex-col lg:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <div className="w-40 h-6 bg-[#f1f5f9] rounded animate-pulse mb-2"><span className="sr-only">Loading</span></div>
          <div className="w-24 h-4 bg-[#f8fafc] rounded animate-pulse"><span className="sr-only">Loading</span></div>
        </div>
        <div className="w-64 h-10 bg-[#f8fafc] rounded-xl animate-pulse"><span className="sr-only">Loading</span></div>
      </div>
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-[#f8fafc] rounded-lg animate-pulse"><span className="sr-only">Loading</span></div>
        ))}
      </div>
    </div>
  </div>
);


const HrRecruit = () => {
  const [activeNav, setActiveNav] = useState('Overview');
  const [showWelcome, setShowWelcome] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [recruiterDetails, setRecruiterDetails] = useState(null);

  // Table interactive states
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [viewMode, setViewMode] = useState('list');

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

  const handleLogout = () => {
    localStorage.removeItem("AccessToken");
    localStorage.removeItem("loginDetails");
    document.cookie = "AccessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "loginDetails=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = "/login";
  };

  useEffect(() => {
    if (!sessionStorage.getItem('hasSeenHrWelcome')) {
      const timer = setTimeout(() => {
        setShowWelcome(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!recruiterDetails?.id) return;
      try {
        setLoading(true);
        // Fetch APIs concurrently
        const [countsRes, statsRes, candidatesRes] = await Promise.all([
          getAppliedCandidatesCount({ user_id: recruiterDetails.id }),
          StatsOfPost(),
          getAllCandidateByRecruiter({ user_id: recruiterDetails.id, limit: 10, page: 1 })
        ]);

        setDashboardData({
          counts: countsRes?.data?.data || {},
          stats: statsRes?.data?.data || {}
        });

        if (candidatesRes?.data?.data?.candidates) {
          setCandidates(candidatesRes.data.data.candidates);
        } else if (candidatesRes?.data?.data) {
          setCandidates(candidatesRes.data.data);
        }
      } catch (error) {
        console.error("Error fetching HR dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [recruiterDetails]);

  const handleCloseWelcome = () => {
    setShowWelcome(false);
    sessionStorage.setItem('hasSeenHrWelcome', 'true');
  };

  // Safe extractors for counts
  const totalApps = dashboardData?.counts?.candidatesCount ?? 491;
  const shortlisted = dashboardData?.counts?.shortlisted ?? 5;
  const interviews = dashboardData?.counts?.interviews ?? 0;
  const hired = dashboardData?.counts?.hired ?? 0;
  const postedJobsCount = dashboardData?.counts?.postedJobsCount ?? 1042;

  // Chart Extractors
  const malesCount = dashboardData?.counts?.males ?? 24;
  const femalesCount = dashboardData?.counts?.females ?? 13;
  const othersCount = dashboardData?.counts?.others ?? 1;
  const totalGender = (malesCount + femalesCount + othersCount) || 38;

  const jobStatusStats = dashboardData?.counts?.job_status_stats || [];
  const activeJobs = jobStatusStats.find(s => s.is_closed === 0)?.count ?? 36;
  const closedJobs = jobStatusStats.find(s => s.is_closed === 1)?.count ?? 6;
  const totalJobsStatus = (activeJobs + closedJobs) || 42;

  const monthlyData = [
    { month: 'Dec', count: 18 },
    { month: 'Jan', count: 24 },
    { month: 'Feb', count: 28 },
    { month: 'Mar', count: 40 },
    { month: 'Apr', count: 34 },
    { month: 'May', count: 60 },
    { month: 'Jun', count: 44 },
  ];

  const maxAppCount = Math.max(...monthlyData.map(d => d.count), 75);
  const pathData = monthlyData.map((d, i) => {
    const x = (i / (monthlyData.length - 1 || 1)) * 400;
    const y = 200 - ((d.count / maxAppCount) * 180);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // --- Table Logic ---
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredCandidates = candidates.filter(cand => {
    const fullName = `${cand.first_name || ''} ${cand.last_name || ''}`.toLowerCase();
    const searchLower = searchQuery.toLowerCase();
    return fullName.includes(searchLower) || (cand.email && cand.email.toLowerCase().includes(searchLower));
  });

  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    let valA = a[sortConfig.key] || '';
    let valB = b[sortConfig.key] || '';
    if (sortConfig.key === 'date') {
      valA = new Date(a.created_at || a.date || 0).getTime();
      valB = new Date(b.created_at || b.date || 0).getTime();
    } else if (sortConfig.key === 'name') {
      valA = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
      valB = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase();
    }

    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedCandidates.length / itemsPerPage) || 1;
  const paginatedCandidates = sortedCandidates.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  // --- End Table Logic ---

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans overflow-x-hidden pb-12 text-gray-800 relative z-0">
      <div className="absolute inset-0 pointer-events-none opacity-50">
        <ParticlesBg type="cobweb" bg={true} color="#0A66C2" num={150} />
      </div>

      {/* Welcome Section */}
      <motion.div variants={fadeInUp} initial="hidden" animate="show" className="max-w-[1440px] mx-auto px-8 lg:px-12 pt-10 pb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-[32px] font-semibold mb-2 tracking-tight text-gray-900">
            Welcome back, <span className="text-[#0A66C2]">{recruiterDetails?.first_name || 'Santhosh'}</span> 👋
          </h1>
          <p className="text-gray-500 text-[14px] font-medium">Here's your hiring overview and latest updates.</p>
        </div>

        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-[13px] font-semibold shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:bg-gray-50 transition-colors">
          <Calendar size={16} className="text-gray-400" />
          May 12 – May 18, 2024
          <ChevronDown size={16} className="text-gray-400 ml-1" />
        </motion.button>
      </motion.div>

      {/* Main Content Area */}
      {loading ? <HrRecruitSkeleton /> : (
        <div className="px-8 lg:px-12 relative z-20 max-w-[1440px] mx-auto space-y-6">

          {/* Stats Grid */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3"
          >

            {/* Card 1: Posted Jobs */}
            <motion.div
              variants={fadeScale}
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white rounded-[1.25rem] p-4 shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 relative overflow-hidden flex flex-col justify-between"
            >
              <div className="absolute bottom-0 right-0 w-full h-16 opacity-30 text-blue-100">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full fill-current" >
                  <path d="M50,100 Q75,50 100,50 L100,100 Z" />
                </svg>
              </div>
              <div className="relative z-10">
                <div className="mb-3">
                  <div className="w-12 h-12 flex items-center justify-center bg-blue-50 text-[#0A66C2] rounded-[14px]">
                    <Briefcase size={22} strokeWidth={2.5} />
                  </div>
                </div>
                <h3 className="text-gray-500 font-semibold text-[13px] mb-1">Posted Jobs</h3>
                <div className="text-[32px] font-semibold text-gray-900 mt-1 mb-2 tracking-tight">
                  {loading ? <span className="animate-pulse bg-gray-200 h-8 w-20 block rounded"></span> : postedJobsCount.toLocaleString()}
                </div>
              </div>
              <div className="flex items-center gap-2 text-[12px] font-bold text-gray-500 mt-auto relative z-10">
                <span className="w-2 h-2 rounded-full bg-[#0A66C2]"></span>
                Active open roles
              </div>
            </motion.div>

            {/* Card 2: Total Apps */}
            <motion.div
              variants={fadeScale}
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white rounded-[1.25rem] p-4 shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 relative overflow-hidden flex flex-col justify-between"
            >
              <div className="absolute bottom-0 right-0 w-full h-16 opacity-30 text-emerald-100">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full fill-current" >
                  <path d="M50,100 Q75,50 100,50 L100,100 Z" />
                </svg>
              </div>
              <div className="relative z-10">
                <div className="mb-3">
                  <div className="w-12 h-12 flex items-center justify-center bg-emerald-50 text-emerald-500 rounded-[14px]">
                    <Users size={22} strokeWidth={2.5} />
                  </div>
                </div>
                <h3 className="text-gray-500 font-semibold text-[13px] mb-1">Total Applications</h3>
                <div className="text-[32px] font-semibold text-gray-900 mt-1 mb-2 tracking-tight">
                  {loading ? <span className="animate-pulse bg-gray-200 h-8 w-20 block rounded"></span> : totalApps.toLocaleString()}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[12px] font-bold text-emerald-600 mt-auto relative z-10">
                <TrendingUp size={16} strokeWidth={3} />
                +5.14% <span className="text-gray-400 font-medium ml-1">vs last month</span>
              </div>
            </motion.div>

            {/* Card 3: Shortlisted */}
            <motion.div
              variants={fadeScale}
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white rounded-[1.25rem] p-4 shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 relative overflow-hidden flex flex-col justify-between"
            >
              <div className="absolute bottom-0 right-0 w-full h-16 opacity-30 text-blue-100">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full fill-current" >
                  <path d="M50,100 Q75,50 100,50 L100,100 Z" />
                </svg>
              </div>
              <div className="relative z-10">
                <div className="mb-3">
                  <div className="w-12 h-12 flex items-center justify-center bg-blue-50 text-[#0A66C2] rounded-[14px]">
                    <CheckCircle size={22} strokeWidth={2.5} />
                  </div>
                </div>
                <h3 className="text-gray-500 font-semibold text-[13px] mb-1">Shortlisted</h3>
                <div className="text-[32px] font-semibold text-gray-900 mt-1 mb-2 tracking-tight">
                  {loading ? <span className="animate-pulse bg-gray-200 h-8 w-20 block rounded"></span> : shortlisted.toLocaleString()}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#ff7a00] mt-auto relative z-10">
                <TrendingDown size={16} strokeWidth={3} />
                -12.2% <span className="text-gray-400 font-medium ml-1">vs last month</span>
              </div>
            </motion.div>

            {/* Card 4: Interviews */}
            <motion.div
              variants={fadeScale}
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white rounded-[1.25rem] p-4 shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 relative overflow-hidden flex flex-col justify-between"
            >
              <div className="absolute bottom-0 right-0 w-full h-16 opacity-30 text-orange-100">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full fill-current" >
                  <path d="M50,100 Q75,50 100,50 L100,100 Z" />
                </svg>
              </div>
              <div className="relative z-10">
                <div className="mb-3">
                  <div className="w-12 h-12 flex items-center justify-center bg-orange-50 text-orange-500 rounded-[14px]">
                    <Calendar size={22} strokeWidth={2.5} />
                  </div>
                </div>
                <h3 className="text-gray-500 font-semibold text-[13px] mb-1">Interviews</h3>
                <div className="text-[32px] font-semibold text-gray-900 mt-1 mb-2 tracking-tight">
                  {loading ? <span className="animate-pulse bg-gray-200 h-8 w-20 block rounded"></span> : interviews.toLocaleString()}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[12px] font-bold text-emerald-600 mt-auto relative z-10">
                <TrendingUp size={16} strokeWidth={3} />
                +2.4% <span className="text-gray-400 font-medium ml-1">vs last month</span>
              </div>
            </motion.div>

            {/* Card 5: Hired */}
            <motion.div
              variants={fadeScale}
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white rounded-[1.25rem] p-4 shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 relative overflow-hidden flex flex-col justify-between"
            >
              <div className="absolute bottom-0 right-0 w-full h-16 opacity-30 text-orange-100">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full fill-current" >
                  <path d="M50,100 Q75,50 100,50 L100,100 Z" />
                </svg>
              </div>
              <div className="relative z-10">
                <div className="mb-3">
                  <div className="w-12 h-12 flex items-center justify-center bg-orange-50 text-[#ff7a00] rounded-[14px]">
                    <Award size={22} strokeWidth={2.5} />
                  </div>
                </div>
                <h3 className="text-gray-500 font-semibold text-[13px] mb-1">Hired Candidates</h3>
                <div className="text-[32px] font-semibold text-gray-900 mt-1 mb-2 tracking-tight">
                  {loading ? <span className="animate-pulse bg-gray-200 h-8 w-20 block rounded"></span> : hired.toLocaleString()}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[12px] font-bold text-emerald-600 mt-auto relative z-10">
                <TrendingUp size={16} strokeWidth={3} />
                +8.1% <span className="text-gray-400 font-medium ml-1">vs last month</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Charts Row */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-5"
          >

            {/* Chart 1: Gender */}
            <motion.div variants={fadeInUp} className="bg-white rounded-[1.25rem] p-7 shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 flex flex-col lg:col-span-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[15px] font-bold text-gray-900">Gender Diversity</h2>
                <button className="text-gray-600 text-[12px] font-semibold flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                  All Time <ChevronDown size={14} />
                </button>
              </div>

              <div className="flex-1 flex items-center justify-between mt-2">
                <div className="relative w-36 h-36 rounded-full flex-shrink-0" style={{ background: `conic-gradient(#2563eb 0% ${(malesCount / totalGender) * 100}%, #ff7a00 ${(malesCount / totalGender) * 100}% ${((malesCount + femalesCount) / totalGender) * 100}%, #f3f4f6 ${((malesCount + femalesCount) / totalGender) * 100}% 100%)` }}>
                  <div className="absolute inset-0 m-[22px] bg-white rounded-full flex flex-col items-center justify-center">
                    <span className="text-[28px] font-bold text-gray-900 leading-none mb-1">{totalGender}</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">TOTAL</span>
                  </div>
                </div>

                <div className="flex-1 space-y-4 pl-8">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3 text-gray-700 font-semibold text-[13px]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0A66C2]"></span> Male
                    </div>
                    <div className="font-bold text-gray-900 text-[13px]">{malesCount} <span className="text-gray-400 ml-1 font-medium">({Math.round((malesCount / totalGender) * 100)}%)</span></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3 text-gray-700 font-semibold text-[13px]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ff7a00]"></span> Female
                    </div>
                    <div className="font-bold text-gray-900 text-[13px]">{femalesCount} <span className="text-gray-400 ml-1 font-medium">({Math.round((femalesCount / totalGender) * 100)}%)</span></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3 text-gray-700 font-semibold text-[13px]">
                      <span className="w-2.5 h-2.5 rounded-full bg-gray-200"></span> Other
                    </div>
                    <div className="font-bold text-gray-900 text-[13px]">{othersCount} <span className="text-gray-400 ml-1 font-medium">({Math.round((othersCount / totalGender) * 100)}%)</span></div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-start gap-2.5 px-3 py-3 bg-blue-50/50 rounded-xl text-[12px] text-gray-500 font-medium border border-blue-100/50">
                <div className="text-[#0A66C2] mt-0.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></div>
                Promoting diversity and inclusion in our hiring process.
              </div>
            </motion.div>

            {/* Chart 2: Job Summary */}
            <motion.div variants={fadeInUp} className="bg-white rounded-[1.25rem] p-7 shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 flex flex-col lg:col-span-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[15px] font-bold text-gray-900">Job Summary</h2>
                <button className="text-gray-600 text-[12px] font-semibold flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                  All Time <ChevronDown size={14} />
                </button>
              </div>

              <div className="flex-1 flex items-center justify-between mt-2">
                <div className="relative w-36 h-36 rounded-full flex-shrink-0" style={{ background: `conic-gradient(#0A66C2 0% ${(activeJobs / totalJobsStatus) * 100}%, #f97316 ${(activeJobs / totalJobsStatus) * 100}% 100%)` }}>
                  <div className="absolute inset-0 m-[22px] bg-white rounded-full flex flex-col items-center justify-center">
                    <span className="text-[28px] font-bold text-gray-900 leading-none mb-1">{totalJobsStatus}</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">JOBS</span>
                  </div>
                </div>

                <div className="flex-1 space-y-4 pl-8">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3 text-gray-700 font-semibold text-[13px]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0A66C2]"></span> Active
                    </div>
                    <div className="font-bold text-gray-900 text-[13px]">{activeJobs} <span className="text-gray-400 ml-1 font-medium">({Math.round((activeJobs / totalJobsStatus) * 100)}%)</span></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3 text-gray-700 font-semibold text-[13px]">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> Closed
                    </div>
                    <div className="font-bold text-gray-900 text-[13px]">{closedJobs} <span className="text-gray-400 ml-1 font-medium">({Math.round((closedJobs / totalJobsStatus) * 100)}%)</span></div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-start gap-2.5 px-3 py-3 bg-gray-50/80 rounded-xl text-[12px] text-gray-500 font-medium border border-gray-100/50">
                <div className="text-[#0A66C2] mt-0.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></div>
                Total jobs created across all departments.
              </div>
            </motion.div>

            {/* Chart 3: Hiring Performance */}
            <motion.div variants={fadeInUp} className="bg-white rounded-[1.25rem] p-7 shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 flex flex-col lg:col-span-4">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-[15px] font-bold text-gray-900">Hiring Performance</h2>
                <button className="text-gray-600 text-[12px] font-semibold flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                  Last 7 months <ChevronDown size={14} />
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0A66C2]"></span> Applications Trend
              </div>

              <div className="flex-1 flex relative w-full h-full min-h-[160px] pb-6">
                {/* Y Axis */}
                <div className="flex flex-col justify-between text-[10px] text-gray-400 font-bold pr-4 h-full">
                  <span>{Math.round(maxAppCount)}</span>
                  <span>{Math.round(maxAppCount * 0.66)}</span>
                  <span>{Math.round(maxAppCount * 0.33)}</span>
                  <span>0</span>
                </div>

                {/* Chart Area */}
                <div className="flex-1 relative h-full">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between">
                    <div className="w-full border-t border-gray-100/60"></div>
                    <div className="w-full border-t border-gray-100/60"></div>
                    <div className="w-full border-t border-gray-100/60"></div>
                    <div className="w-full border-t border-gray-100/60"></div>
                  </div>

                  {/* SVG Area Fill */}
                  <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 400 200">
                    <defs>
                      <linearGradient id="gradientAreaBlue" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#0A66C2" stopOpacity="0.1" />
                        <stop offset="100%" stopColor="#0A66C2" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d={`${pathData} L 400 200 L 0 200 Z`} fill="url(#gradientAreaBlue)" className="animate-fade-in" style={{ animationDelay: '0.5s' }} />
                    <path d={pathData} fill="none" stroke="#0A66C2" strokeWidth="2.5" className="animate-draw-line" strokeLinecap="round" strokeLinejoin="round" />

                    {/* Data Points */}
                    {monthlyData.map((d, i) => {
                      const x = (i / (monthlyData.length - 1 || 1)) * 400;
                      const y = 200 - ((d.count / maxAppCount) * 180);
                      return (
                        <circle key={i} cx={x} cy={y} r="4" fill="white" stroke="#0A66C2" strokeWidth="2.5" className="animate-fade-in" style={{ animationDelay: `${0.5 + (i * 0.1)}s` }} />
                      )
                    })}
                  </svg>

                  {/* X Axis */}
                  <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-[10px] font-bold text-gray-400">
                    {monthlyData.map((d, i) => (
                      <span key={i} className="transform -translate-x-1/2" style={{ left: `${(i / (monthlyData.length - 1 || 1)) * 100}%`, position: 'absolute' }}>{d.month}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-start gap-2.5 px-3 py-3 bg-blue-50/50 rounded-xl text-[12px] text-gray-500 font-medium border border-blue-100/50">
                <div className="text-[#0A66C2] mt-0.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></div>
                Track applications received over the selected period.
              </div>
              Track applications received over the selected period.
              {/* </div> */}
            </motion.div>

          </motion.div>

          {/* Candidates Section */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="bg-white rounded-[1rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/80"
          >

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-2">
              <div>
                <h2 className="text-[22px] font-bold text-gray-900 mb-1">Recruitment</h2>
                <p className="text-sm font-medium text-gray-400 flex items-center gap-1.5">
                  List Job <ChevronRight size={14} className="text-gray-300" /> <span className="text-gray-700">3D Designer</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search what you need"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="pl-4 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-300 w-64 placeholder:text-gray-400 font-medium text-gray-700 transition-all duration-300"
                  />
                  <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${viewMode === 'list'
                      ? 'bg-[#0A66C2] text-white'
                      : 'text-gray-400 hover:bg-gray-100'
                      }`}
                  >
                    <List size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${viewMode === 'grid'
                      ? 'bg-[#0A66C2] text-white'
                      : 'text-gray-400 hover:bg-gray-100'
                      }`}
                  >
                    <Grid size={16} />
                  </button>
                  <div className="w-px h-6 bg-gray-200 mx-1"></div>
                  <button className="w-9 h-9 rounded-full text-gray-400 hover:bg-gray-100 flex items-center justify-center transition-colors">
                    <Paperclip size={16} />
                  </button>
                  <button className="w-9 h-9 rounded-full text-gray-400 hover:bg-gray-100 flex items-center justify-center transition-colors">
                    <Clock size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content Area (List or Grid) */}
            {viewMode === 'list' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-[13px] font-bold text-gray-400">
                      <th className="py-4 px-4 font-semibold whitespace-nowrap group cursor-pointer" onClick={() => handleSort('name')}>
                        <div className="flex items-center gap-4">Name <ChevronsUpDown size={14} className={`transition-opacity ${sortConfig.key === 'name' ? 'opacity-100 text-[#0A66C2]' : 'opacity-40 group-hover:opacity-100'}`} /></div>
                      </th>
                      <th className="py-4 px-4 font-semibold whitespace-nowrap group cursor-pointer" onClick={() => handleSort('phone')}>
                        <div className="flex items-center gap-4">Phone Number <ChevronsUpDown size={14} className={`transition-opacity ${sortConfig.key === 'phone' ? 'opacity-100 text-[#0A66C2]' : 'opacity-40 group-hover:opacity-100'}`} /></div>
                      </th>
                      <th className="py-4 px-4 font-semibold whitespace-nowrap group cursor-pointer">
                        <div className="flex items-center gap-4">CV</div>
                      </th>
                      <th className="py-4 px-4 font-semibold whitespace-nowrap group cursor-pointer" onClick={() => handleSort('date')}>
                        <div className="flex items-center gap-4">Created Date <ChevronsUpDown size={14} className={`transition-opacity ${sortConfig.key === 'date' ? 'opacity-100 text-[#0A66C2]' : 'opacity-40 group-hover:opacity-100'}`} /></div>
                      </th>
                      <th className="py-4 px-4 font-semibold whitespace-nowrap group cursor-pointer" onClick={() => handleSort('status')}>
                        <div className="flex items-center gap-4">Stages <ChevronsUpDown size={14} className={`transition-opacity ${sortConfig.key === 'status' ? 'opacity-100 text-[#0A66C2]' : 'opacity-40 group-hover:opacity-100'}`} /></div>
                      </th>
                      <th className="py-4 px-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <motion.tbody
                    variants={staggerContainer}
                    initial="hidden"
                    animate="show"
                    className="text-sm divide-y divide-gray-50/50"
                  >
                    {loading ? (
                      <motion.tr variants={fadeInUp}>
                        <td colSpan="6" className="text-center py-16">
                          <div className="inline-flex items-center gap-3">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0A66C2]"></div>
                            <p className="text-gray-500 font-medium">Loading candidates...</p>
                          </div>
                        </td>
                      </motion.tr>
                    ) : paginatedCandidates.length > 0 ? (
                      paginatedCandidates.map((cand, idx) => (
                        <motion.tr
                          variants={fadeInUp}
                          key={idx}
                          className="hover:bg-gray-50/50 transition-colors group"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-4">
                              {cand.profile_image ? (
                                <img src={cand.profile_image} className="w-10 h-10 rounded-full object-cover shadow-sm border border-gray-100" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-50 text-gray-500 flex items-center justify-center font-bold text-sm border border-gray-100">
                                  {(cand.first_name && cand.last_name) ? `${cand.first_name[0]}${cand.last_name[0]}` : cand.first_name ? cand.first_name[0] : 'U'}
                                </div>
                              )}
                              <div className="flex flex-col">
                                <span className="font-bold text-gray-900 group-hover:text-[#0A66C2] transition-colors">{cand.first_name || cand.last_name ? `${cand.first_name || ''} ${cand.last_name || ''}`.trim() : 'Unknown Name'}</span>
                                <span className="text-xs text-gray-400 font-medium mt-0.5">{cand.email || 'No email provided'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-gray-600 font-semibold text-[13px]">
                            {cand.phone || '08092139441'}
                          </td>
                          <td className="py-4 px-4">
                            {cand.resume_url || idx % 2 === 0 ? (
                              <div className="flex items-center gap-2 text-gray-700 font-semibold text-[13px]">
                                CV.pdf <div className="p-1 bg-gray-100 rounded text-gray-400"><FileText size={14} /></div>
                              </div>
                            ) : (
                              <span className="text-gray-400 font-bold">-</span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-gray-600 font-semibold text-[13px]">
                            {cand.date || (cand.created_at ? new Date(cand.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '01 Mar 2023')}
                          </td>
                          <td className="py-4 px-4">
                            <div className="inline-flex items-center justify-between w-[120px] text-gray-600 font-semibold text-[13px] cursor-pointer hover:text-[#0A66C2] transition-colors">
                              {cand.status || cand.application_status || 'Applied'} <ChevronDown size={14} className="text-gray-400" />
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button className="w-8 h-8 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-[10px] flex items-center justify-center transition-colors shadow-sm">
                                <Link2 size={14} />
                              </button>
                              <button className="w-8 h-8 bg-[#ff7a00] hover:bg-orange-600 text-white rounded-[10px] flex items-center justify-center transition-colors shadow-sm">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <motion.tr variants={fadeInUp}>
                        <td colSpan="6" className="text-center py-16 text-gray-500 font-medium">No recent candidates found.</td>
                      </motion.tr>
                    )}
                  </motion.tbody>
                </table>
              </div>
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {loading ? (
                  <motion.div variants={fadeInUp} className="col-span-full flex flex-col items-center justify-center py-16 gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A66C2]"></div>
                    <p className="text-gray-500 font-medium">Loading candidates...</p>
                  </motion.div>
                ) : paginatedCandidates.length > 0 ? (
                  paginatedCandidates.map((cand, idx) => (
                    <motion.div
                      variants={fadeScale}
                      whileHover={{ y: -5, scale: 1.02 }}
                      key={idx}
                      className="bg-white border border-gray-100 rounded-[1rem] p-6 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-300 group"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          {cand.profile_image ? (
                            <img src={cand.profile_image} className="w-12 h-12 rounded-full object-cover shadow-sm border border-gray-100" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-50 text-gray-500 flex items-center justify-center font-bold text-base border border-gray-100">
                              {(cand.first_name && cand.last_name) ? `${cand.first_name[0]}${cand.last_name[0]}` : cand.first_name ? cand.first_name[0] : 'U'}
                            </div>
                          )}
                          <div>
                            <h3 className="font-bold text-sm text-gray-900 mb-0 group-hover:text-[#0A66C2] transition-colors">{cand.first_name || cand.last_name ? `${cand.first_name || ''} ${cand.last_name || ''}`.trim() : 'Unknown Name'}</h3>
                            <p className="text-xs text-gray-400 font-medium truncate max-w-[120px]">{cand.email || 'No email provided'}</p>
                          </div>
                        </div>
                        <div className="p-1.5 bg-gray-50 rounded-lg text-gray-400 hover:text-[#0A66C2] cursor-pointer transition-colors">
                          <MoreVertical size={16} />
                        </div>
                      </div>

                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400">Phone:</span>
                          <span className="font-semibold text-gray-700">{cand.phone || '08092139441'}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400">Applied:</span>
                          <span className="font-semibold text-gray-700">{cand.date || (cand.created_at ? new Date(cand.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '01 Mar 2023')}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400">Status:</span>
                          <span className="px-2.5 py-1 bg-gray-50 text-gray-700 font-bold text-xs rounded-md border border-gray-100">{cand.status || cand.application_status || 'Applied'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                        <button className="flex-1 py-2 bg-blue-50 hover:bg-[#0A66C2] hover:text-white text-[#0A66C2] rounded-lg font-bold text-[13px] transition-colors flex items-center justify-center gap-2">
                          <Link2 size={16} /> View
                        </button>
                        <button className="flex-1 py-2 bg-orange-50 hover:bg-[#ff7a00] hover:text-white text-[#ff7a00] rounded-lg font-bold text-[13px] transition-colors flex items-center justify-center gap-2">
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <motion.div variants={fadeInUp} className="col-span-full text-center py-16 text-gray-500 font-medium">No recent candidates found.</motion.div>
                )}
              </motion.div>
            )}

            <div className="mt-6 flex flex-col md:flex-row justify-between items-center text-[13px] font-semibold text-gray-400 border-t border-gray-100 pt-6 gap-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-400 disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>

                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold transition-colors ${currentPage === i + 1
                      ? 'bg-gray-100 text-gray-900 shadow-sm'
                      : 'border border-transparent hover:bg-gray-50 text-gray-500'
                      }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-400 disabled:opacity-50 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="flex items-center gap-6">
                <span>
                  Showing {sortedCandidates.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, sortedCandidates.length)} of {sortedCandidates.length} entries
                </span>
                <div className="relative group">
                  <select
                    value={itemsPerPage}
                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="appearance-none bg-transparent font-bold text-gray-700 hover:text-gray-900 transition-colors cursor-pointer pr-6 focus:outline-none"
                  >
                    <option value={8}>Show 8</option>
                    <option value={15}>Show 15</option>
                    <option value={25}>Show 25</option>
                  </select>
                  <ChevronUp size={14} className="text-gray-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-gray-600" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Welcome Modal Overlay */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
              className="bg-white rounded-[2rem] p-10 max-w-md w-full flex flex-col items-center text-center shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] relative overflow-hidden"
            >
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50 rounded-bl-full -z-10"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#00e699]/10 rounded-tr-full -z-10"></div>

              <motion.div
                initial={{ rotate: 0, scale: 0.5 }}
                animate={{ rotate: 12, scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-24 h-24 bg-gradient-to-br from-[#00e699] to-emerald-500 rounded-3xl flex items-center justify-center shadow-xl shadow-[#00e699]/30 mb-8"
              >
                <div className="transform -rotate-12">
                  <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
              </motion.div>

              <h2 className="text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">Ready to hire?</h2>
              <p className="text-gray-500 font-medium leading-relaxed mb-8">
                Welcome to your new HR Dashboard. Track candidates, analyze performance, and make data-driven hiring decisions.
              </p>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCloseWelcome}
                className="w-full bg-gray-900 text-white text-base font-bold py-3 rounded-xl hover:bg-gray-800 transition-all duration-300 hover:shadow-lg flex items-center justify-center gap-2"
              >
                Get Started <ArrowRight size={18} />
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.1, y: -5 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-8 right-8 bg-[#00e699] text-white p-4 rounded-full shadow-[0_8px_20px_rgba(0,230,153,0.4)] hover:shadow-[0_12px_25px_rgba(0,230,153,0.5)] transition-all duration-300 z-50 flex items-center justify-center"
      >
        <MessageSquare size={24} />
      </motion.button>

      {/* Simple inline styles for remaining animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes drawLine {
          to { stroke-dashoffset: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-draw-line { stroke-dasharray: 1500; stroke-dashoffset: 1500; animation: drawLine 2.5s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
        .animate-fade-in { animation: fadeIn 0.6s ease-out forwards; opacity: 0; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

    </div>
  );
};

export default HrRecruit;
