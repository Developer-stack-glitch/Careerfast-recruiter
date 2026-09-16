'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
    ChevronDown,
    Bell,
    Lightbulb,
    Search,
    Briefcase,
    User,
    CreditCard,
    Settings,
    LogOut,
    X,
    PlusCircle,
    CheckCircle2,
    FileText,
    MapPin,
    Sparkles,
    ArrowRight,
    Check,
    RotateCcw,
    BookOpen
} from 'lucide-react';
import logo from '../images/hrportal_logo1.png';

const TOP_CITIES = [
    'Bengaluru',
    'Chennai',
    'Hyderabad',
    'Mumbai',
    'Delhi / NCR',
    'Pune',
    'Kolkata',
    'Ahmedabad',
    'Gurugram',
    'Noida',
    'Kochi',
    'Jaipur'
];

const EXPERIENCE_YEARS = Array.from({ length: 31 }, (_, i) => i);

const POPULAR_SEARCH_ROLES = [
    'Full Stack Developer',
    'React Developer',
    'Java Developer',
    'Product Manager',
    'Data Scientist',
    'DevOps Engineer'
];

const HrHeader = () => {
    const pathname = usePathname();
    const router = useRouter();
    const [recruiterDetails, setRecruiterDetails] = useState(null);
    const [jobDropdownOpen, setJobDropdownOpen] = useState(false);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const [guideModalOpen, setGuideModalOpen] = useState(false);

    // Quick Search Drawer / Bar State
    const [quickSearchOpen, setQuickSearchOpen] = useState(false);
    const [quickKeywords, setQuickKeywords] = useState('');
    const [selectedLocations, setSelectedLocations] = useState([]);
    const [includeRelocating, setIncludeRelocating] = useState(false);
    const [expMin, setExpMin] = useState('');
    const [expMax, setExpMax] = useState('');
    const [locationPickerOpen, setLocationPickerOpen] = useState(false);
    const [expPickerOpen, setExpPickerOpen] = useState(false);
    const [locationSearchQuery, setLocationSearchQuery] = useState('');

    const jobDropdownRef = useRef(null);
    const profileDropdownRef = useRef(null);
    const quickSearchInputRef = useRef(null);
    const locationPickerRef = useRef(null);
    const expPickerRef = useRef(null);

    // Focus quick search input when modal opens
    useEffect(() => {
        if (quickSearchOpen) {
            const timer = setTimeout(() => {
                quickSearchInputRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        } else {
            setLocationPickerOpen(false);
            setExpPickerOpen(false);
        }
    }, [quickSearchOpen]);

    // Keyboard shortcuts: Ctrl+K / Cmd+K to toggle, Escape to close
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setQuickSearchOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                if (locationPickerOpen) {
                    setLocationPickerOpen(false);
                } else if (expPickerOpen) {
                    setExpPickerOpen(false);
                } else if (quickSearchOpen) {
                    setQuickSearchOpen(false);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [quickSearchOpen, locationPickerOpen, expPickerOpen]);

    useEffect(() => {
        const stored = localStorage.getItem("loginDetails");
        if (stored) {
            try {
                setRecruiterDetails(JSON.parse(stored));
            } catch (e) {
                console.error("Error parsing loginDetails", e);
            }
        }
    }, []);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (jobDropdownRef.current && !jobDropdownRef.current.contains(e.target)) {
                setJobDropdownOpen(false);
            }
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
                setProfileDropdownOpen(false);
            }
            if (locationPickerRef.current && !locationPickerRef.current.contains(e.target)) {
                setLocationPickerOpen(false);
            }
            if (expPickerRef.current && !expPickerRef.current.contains(e.target)) {
                setExpPickerOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close dropdowns on route change
    useEffect(() => {
        setJobDropdownOpen(false);
        setProfileDropdownOpen(false);
        setQuickSearchOpen(false);
    }, [pathname]);

    const filteredCities = TOP_CITIES.filter(c =>
        c.toLowerCase().includes(locationSearchQuery.toLowerCase())
    );

    const toggleLocation = (city) => {
        setSelectedLocations(prev =>
            prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
        );
    };

    const handleClearQuickFilters = () => {
        setQuickKeywords('');
        setSelectedLocations([]);
        setIncludeRelocating(false);
        setExpMin('');
        setExpMax('');
    };

    const handleQuickSearchSubmit = (e) => {
        if (e) e.preventDefault();
        const query = new URLSearchParams();
        if (quickKeywords.trim()) query.set('keywords', quickKeywords.trim());
        if (selectedLocations.length > 0) query.set('location', selectedLocations.join(','));
        if (includeRelocating) query.set('includeRelocating', 'true');
        if (expMin !== '' && expMin !== 'Any') query.set('expMin', String(expMin));
        if (expMax !== '' && expMax !== 'Any') query.set('expMax', String(expMax));

        setQuickSearchOpen(false);
        router.push(`/candidate-search/results?${query.toString()}`);
    };

    const handleLogout = () => {
        localStorage.removeItem("AccessToken");
        localStorage.removeItem("loginDetails");
        document.cookie = "AccessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "loginDetails=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        window.location.href = "/login";
    };

    const displayName = recruiterDetails?.first_name
        ? `${recruiterDetails.first_name} ${recruiterDetails.last_name || ''}`.trim()
        : 'SANDIYA MS';

    const isSearchActive = pathname?.startsWith('/candidate-search');
    const isJobActive = pathname?.startsWith('/post-job') ||
        pathname?.startsWith('/my-jobs') ||
        pathname?.startsWith('/post-internship') ||
        pathname?.startsWith('/post-course');
    const isFoldersActive = pathname?.startsWith('/manage-folder') ||
        pathname?.startsWith('/folders') ||
        pathname?.startsWith('/saved-candidates');
    const isReportsActive = pathname?.startsWith('/overview');

    return (
        <>
            {/* Top subtle brand gradient line */}
            <div className="h-[3px] w-full bg-gradient-to-r from-[#0A66C2] via-blue-500 to-amber-500 sticky top-0 z-50" />

            <header className="h-[64px] bg-white border-b border-slate-200/80 px-6 sm:px-8 flex items-center justify-between sticky top-[3px] z-50 shadow-xs [&_a]:no-underline [&_a:hover]:no-underline">

                {/* Left Side: Logo & Main Navigation */}
                <div className="flex items-center gap-8 lg:gap-10">
                    {/* Brand Logo */}
                    <Link href="/candidate-search" className="flex items-center gap-2 group select-none no-underline hover:no-underline" style={{ textDecoration: 'none' }}>
                        {logo ? (
                            <Image
                                src={logo}
                                alt="CareerFast Logo"
                                priority
                                className="h-10 w-auto object-contain transition-transform group-hover:scale-[1.02]"
                            />
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="text-[20px] font-black tracking-tight text-slate-900">
                                    CAREER<span className="text-[#FB6202]">FAST</span>
                                </span>
                            </div>
                        )}
                    </Link>

                    {/* Horizontal Navigation Menu */}
                    <nav className="hidden md:flex items-center gap-1 sm:gap-2">

                        {/* 1. Search */}
                        <Link
                            href="/candidate-search"
                            style={{ textDecoration: 'none' }}
                            className={`px-3 py-2 text-[14px] font-semibold transition-colors duration-150 rounded-lg flex items-center gap-1.5 no-underline hover:no-underline ${isSearchActive
                                ? 'text-slate-900 font-bold bg-slate-100/70'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                        >
                            <span>Search</span>
                        </Link>

                        {/* 2. Job Dropdown */}
                        <div className="relative" ref={jobDropdownRef}>
                            <button
                                type="button"
                                onClick={() => setJobDropdownOpen(prev => !prev)}
                                className={`px-3 py-2 text-[14px] font-semibold transition-colors duration-150 rounded-lg flex items-center gap-1 cursor-pointer ${isJobActive || jobDropdownOpen
                                    ? 'text-slate-900 font-bold bg-slate-100/70'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                    }`}
                            >
                                <span>Job</span>
                                <ChevronDown
                                    size={15}
                                    className={`transition-transform duration-200 text-slate-500 ${jobDropdownOpen ? 'rotate-180 text-slate-900' : ''
                                        }`}
                                />
                            </button>

                            {/* Job Dropdown Menu */}
                            {jobDropdownOpen && (
                                <div className="absolute left-0 top-full mt-2 w-56 bg-white rounded-xl shadow-[0_12px_40px_-8px_rgba(0,0,0,0.16)] border border-slate-200/90 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                                    <Link
                                        href="/post-job"
                                        onClick={() => setJobDropdownOpen(false)}
                                        style={{ textDecoration: 'none' }}
                                        className="flex items-center gap-2.5 px-4 py-2.5 text-[13.5px] font-medium text-slate-700 hover:bg-blue-50/70 hover:text-[#0A66C2] transition-colors no-underline hover:no-underline"
                                    >
                                        <PlusCircle size={16} className="text-slate-500" />
                                        <span>Post a job</span>
                                    </Link>
                                    <Link
                                        href="/my-jobs"
                                        onClick={() => setJobDropdownOpen(false)}
                                        style={{ textDecoration: 'none' }}
                                        className="flex items-center gap-2.5 px-4 py-2.5 text-[13.5px] font-medium text-slate-700 hover:bg-blue-50/70 hover:text-[#0A66C2] transition-colors no-underline hover:no-underline"
                                    >
                                        <Briefcase size={16} className="text-slate-500" />
                                        <span>Manage jobs</span>
                                    </Link>
                                    <Link
                                        href="/post-internship"
                                        onClick={() => setJobDropdownOpen(false)}
                                        style={{ textDecoration: 'none' }}
                                        className="flex items-center gap-2.5 px-4 py-2.5 text-[13.5px] font-medium text-slate-700 hover:bg-blue-50/70 hover:text-[#0A66C2] transition-colors no-underline hover:no-underline"
                                    >
                                        <FileText size={16} className="text-slate-500" />
                                        <span>Post Internship</span>
                                    </Link>
                                    <Link
                                        href="/post-course"
                                        onClick={() => setJobDropdownOpen(false)}
                                        style={{ textDecoration: 'none' }}
                                        className="flex items-center gap-2.5 px-4 py-2.5 text-[13.5px] font-medium text-slate-700 hover:bg-blue-50/70 hover:text-[#0A66C2] transition-colors no-underline hover:no-underline"
                                    >
                                        <BookOpen size={16} className="text-slate-500" />
                                        <span>Post course</span>
                                    </Link>
                                    <Link
                                        href="/my-jobs"
                                        onClick={() => setJobDropdownOpen(false)}
                                        style={{ textDecoration: 'none' }}
                                        className="flex items-center gap-2.5 px-4 py-2.5 text-[13.5px] font-medium text-slate-700 hover:bg-blue-50/70 hover:text-[#0A66C2] transition-colors no-underline hover:no-underline"
                                    >
                                        <CheckCircle2 size={16} className="text-slate-500" />
                                        <span>Manage questionnaire</span>
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* 3. Folders */}
                        <Link
                            href="/manage-folder"
                            style={{ textDecoration: 'none' }}
                            className={`px-3 py-2 text-[14px] font-semibold transition-colors duration-150 rounded-lg flex items-center gap-1.5 no-underline hover:no-underline ${isFoldersActive
                                ? 'text-slate-900 font-bold bg-slate-100/70'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                        >
                            <span>Folders</span>
                        </Link>

                        {/* 4. Reports */}
                        <Link
                            href="/overview"
                            style={{ textDecoration: 'none' }}
                            className={`px-3 py-2 text-[14px] font-semibold transition-colors duration-150 rounded-lg no-underline hover:no-underline ${isReportsActive
                                ? 'text-slate-900 font-bold bg-slate-100/70'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                        >
                            <span>Reports</span>
                        </Link>
                    </nav>
                </div>

                {/* Middle: Professional Search Bar Trigger */}
                <div className="hidden md:flex items-center flex-1 max-w-xs lg:max-w-sm xl:max-w-md mx-3 lg:mx-6">
                    <button
                        type="button"
                        onClick={() => setQuickSearchOpen(true)}
                        className="w-full flex items-center justify-between gap-3 px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100/90 text-slate-500 hover:text-slate-700 border border-slate-200/90 hover:border-slate-300 rounded-full transition-all duration-150 cursor-pointer group shadow-2xs"
                    >
                        <div className="flex items-center gap-2.5 truncate">
                            <Search size={15} className="text-slate-400 group-hover:text-[#0A66C2] transition-colors shrink-0" />
                            <span className="text-[13px] font-normal text-slate-500 truncate">
                                {quickKeywords ? quickKeywords : "Search candidates by skill, title, location..."}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <span className="hidden xl:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded-md shadow-2xs">
                                Ctrl K
                            </span>
                            <div className="w-6 h-6 rounded-full bg-[#0A66C2] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                                <Search size={11} className="stroke-[2.5]" />
                            </div>
                        </div>
                    </button>
                </div>

                {/* Right Side: Platform Guide, Bell, Profile Chip */}
                <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                    {/* Mobile Quick Search Button */}
                    <button
                        type="button"
                        onClick={() => setQuickSearchOpen(true)}
                        className="md:hidden text-slate-600 hover:text-slate-900 transition-colors p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
                        title="Search Candidates"
                    >
                        <Search size={19} />
                    </button>

                    {/* Platform Guide Pill Button */}
                    <button
                        type="button"
                        onClick={() => setGuideModalOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-blue-200 bg-blue-50/50 hover:bg-blue-100/70 text-[#0A66C2] font-semibold text-[13px] transition-all cursor-pointer shadow-2xs group"
                    >
                        <Lightbulb size={15} className="text-[#0A66C2] group-hover:scale-110 transition-transform" />
                        <span className="whitespace-nowrap">Platform Guide</span>
                    </button>

                    {/* Notification Bell */}
                    <button
                        type="button"
                        className="text-slate-600 hover:text-slate-900 transition-colors relative p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                        title="Notifications"
                    >
                        <Bell size={19} />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-[#FB6202] rounded-full ring-2 ring-white"></span>
                    </button>

                    {/* Recruiter Profile Widget */}
                    <div className="relative" ref={profileDropdownRef}>
                        <button
                            type="button"
                            onClick={() => setProfileDropdownOpen(prev => !prev)}
                            className="flex items-center gap-2.5 p-1 pl-1.5 pr-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer text-left group"
                        >
                            {/* Avatar */}
                            <div className="w-9 h-9 rounded-full overflow-hidden border border-amber-300 flex items-center justify-center flex-shrink-0 shadow-2xs">
                                {recruiterDetails?.profile_image ? (
                                    <img
                                        src={recruiterDetails.profile_image}
                                        alt={displayName}
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-amber-800 font-bold text-[14px]">
                                        {displayName.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>

                            {/* Text Info */}
                            <div className="hidden sm:flex flex-col text-left leading-none">
                                <span className="text-[11px] text-slate-400 font-normal mb-0.5">
                                    Hello,
                                </span>
                                <span className="text-[13px] font-bold text-slate-800 tracking-tight truncate max-w-[130px] group-hover:text-[#0A66C2] transition-colors">
                                    {displayName}
                                </span>
                            </div>

                            <ChevronDown
                                size={14}
                                className={`text-slate-400 hidden sm:block transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180 text-slate-700' : ''
                                    }`}
                            />
                        </button>

                        {/* Profile Dropdown Menu */}
                        {profileDropdownOpen && (
                            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-[0_16px_48px_-12px_rgba(0,0,0,0.18)] border border-slate-200/90 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">

                                {/* Header in Dropdown */}
                                <div className="px-4 py-3 border-b border-slate-100">
                                    <p className="text-[13.5px] font-bold text-slate-900 truncate mb-0.5">
                                        {displayName}
                                    </p>
                                    <p className="text-[12px] text-slate-500 truncate mb-0">
                                        {recruiterDetails?.email || 'recruiter@careerfast.com'}
                                    </p>
                                    <span className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#0A66C2] border border-blue-200/60">
                                        Employer Portal
                                    </span>
                                </div>

                                {/* Menu Items */}
                                <div className="py-1">
                                    <Link
                                        href="/profile"
                                        onClick={() => setProfileDropdownOpen(false)}
                                        style={{ textDecoration: 'none' }}
                                        className="flex items-center gap-3 px-4 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0A66C2] transition-colors no-underline hover:no-underline"
                                    >
                                        <User size={16} className="text-slate-400" />
                                        <span>Employers Profile</span>
                                    </Link>
                                    <Link
                                        href="/billing"
                                        onClick={() => setProfileDropdownOpen(false)}
                                        style={{ textDecoration: 'none' }}
                                        className="flex items-center gap-3 px-4 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0A66C2] transition-colors no-underline hover:no-underline"
                                    >
                                        <CreditCard size={16} className="text-slate-400" />
                                        <span>Plans & Billing</span>
                                    </Link>
                                    <Link
                                        href="/settings"
                                        onClick={() => setProfileDropdownOpen(false)}
                                        style={{ textDecoration: 'none' }}
                                        className="flex items-center gap-3 px-4 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0A66C2] transition-colors no-underline hover:no-underline"
                                    >
                                        <Settings size={16} className="text-slate-400" />
                                        <span>Settings</span>
                                    </Link>
                                </div>

                                <div className="border-t border-slate-100 mt-1 pt-1">
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-[13px] font-medium text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                                    >
                                        <LogOut size={16} className="text-red-500" />
                                        <span>Log-out</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Quick Candidate Search Modal / Command Palette */}
            {quickSearchOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-start justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150 pt-12 sm:pt-16"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setQuickSearchOpen(false);
                        }
                    }}
                >
                    <div className="bg-white rounded-3xl shadow-[0_25px_60px_-15px_rgba(15,23,42,0.25)] border border-slate-200/90 max-w-4xl w-full p-5 sm:p-7 space-y-5 animate-in zoom-in-95 duration-150 relative">

                        {/* Modal Header */}
                        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-[#0A66C2] text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                                    <Sparkles size={18} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-[18px] font-bold text-slate-900 tracking-tight mb-0">
                                            Quick Candidate Search
                                        </h3>
                                        <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#0A66C2] border border-blue-200/60">
                                            Instant Lookup
                                        </span>
                                    </div>
                                    <p className="text-[12.5px] text-slate-500 mb-0">
                                        Find top candidate resumes by skills, designations, preferred cities, and experience
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="hidden sm:inline-flex items-center px-2 py-1 text-[11px] font-medium text-slate-400 bg-slate-100 rounded-md">
                                    Esc to close
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setQuickSearchOpen(false)}
                                    className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                                    title="Close"
                                >
                                    <X size={19} />
                                </button>
                            </div>
                        </div>

                        {/* Search Form with Segmented Bar */}
                        <form onSubmit={handleQuickSearchSubmit} className="space-y-4">
                            <div className="bg-slate-50/80 hover:bg-slate-50 border-2 border-slate-200/90 focus-within:border-[#0A66C2] focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100/60 rounded-2xl p-2 flex flex-col md:flex-row items-stretch md:items-center gap-2 shadow-xs transition-all">

                                {/* 1. Keywords & Skills */}
                                <div className="flex-1 flex items-center gap-2.5 px-3 py-1.5">
                                    <Search size={18} className="text-[#0A66C2] shrink-0" />
                                    <input
                                        ref={quickSearchInputRef}
                                        type="text"
                                        value={quickKeywords}
                                        onChange={(e) => setQuickKeywords(e.target.value)}
                                        placeholder="Enter keywords like skills, job titles (e.g. React, Node, Product Manager)..."
                                        className="w-full text-[14px] text-slate-900 placeholder:text-slate-400 font-medium bg-transparent border-none outline-none focus:outline-none"
                                    />
                                    {quickKeywords && (
                                        <button
                                            type="button"
                                            onClick={() => setQuickKeywords('')}
                                            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>

                                {/* Divider */}
                                <div className="hidden md:block w-px h-8 bg-slate-200" />

                                {/* 2. Location Picker */}
                                <div className="relative" ref={locationPickerRef}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setLocationPickerOpen(prev => !prev);
                                            setExpPickerOpen(false);
                                        }}
                                        className={`w-full md:w-auto flex items-center justify-between md:justify-start gap-2.5 px-3.5 py-2 rounded-xl text-left transition-all cursor-pointer ${locationPickerOpen || selectedLocations.length > 0
                                            ? 'bg-blue-50/90 text-blue-950 font-semibold ring-1 ring-blue-200'
                                            : 'hover:bg-slate-200/60 text-slate-700 font-medium'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <MapPin size={16} className={selectedLocations.length > 0 ? 'text-[#0A66C2]' : 'text-slate-400'} />
                                            <div className="flex flex-col">
                                                <span className="text-[13px] leading-tight truncate max-w-[130px]">
                                                    {selectedLocations.length === 0
                                                        ? 'Location'
                                                        : selectedLocations.length === 1
                                                            ? selectedLocations[0]
                                                            : `${selectedLocations[0]} +${selectedLocations.length - 1}`}
                                                </span>
                                                <span className="text-[10.5px] text-slate-400 leading-none mt-0.5 font-normal">
                                                    {selectedLocations.length === 0 ? 'Top cities' : `${selectedLocations.length} selected`}
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-150 ${locationPickerOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {/* Location Dropdown Flyout */}
                                    {locationPickerOpen && (
                                        <div className="absolute left-0 md:left-auto md:right-0 top-full mt-2.5 w-80 sm:w-88 bg-white rounded-2xl shadow-[0_16px_48px_-8px_rgba(0,0,0,0.2)] border border-slate-200/90 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                                            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-3">
                                                <span className="text-[13px] font-bold text-slate-900">Select Target Cities</span>
                                                {selectedLocations.length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedLocations([])}
                                                        className="text-[11px] font-bold text-[#0A66C2] hover:text-[#004182] cursor-pointer"
                                                    >
                                                        Clear ({selectedLocations.length})
                                                    </button>
                                                )}
                                            </div>

                                            {/* Search input for cities */}
                                            <div className="relative mb-3">
                                                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    value={locationSearchQuery}
                                                    onChange={(e) => setLocationSearchQuery(e.target.value)}
                                                    placeholder="Filter cities..."
                                                    className="w-full pl-8 pr-3 py-1.5 text-[12.5px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0A66C2] focus:bg-white font-medium"
                                                />
                                            </div>

                                            {/* Cities List */}
                                            <div className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                                Popular Tech Hubs
                                            </div>
                                            <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
                                                {filteredCities.map((city) => {
                                                    const isSelected = selectedLocations.includes(city);
                                                    return (
                                                        <button
                                                            key={city}
                                                            type="button"
                                                            onClick={() => toggleLocation(city)}
                                                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[13px] transition-colors text-left cursor-pointer ${isSelected ? 'bg-blue-50 text-[#0A66C2] font-bold' : 'text-slate-700 hover:bg-slate-50 font-medium'
                                                                }`}
                                                        >
                                                            <span className="flex items-center gap-2">
                                                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-[#0A66C2] border-[#0A66C2] text-white' : 'border-slate-300 bg-white'
                                                                    }`}>
                                                                    {isSelected && <Check size={11} className="stroke-[3]" />}
                                                                </div>
                                                                <span>{city}</span>
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {/* Include Relocating Switch */}
                                            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-[12.5px] font-bold text-slate-800">Include Relocating</span>
                                                    <span className="text-[10.5px] text-slate-400">Candidates open to relocation</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setIncludeRelocating(prev => !prev)}
                                                    className={`w-10 h-5.5 flex items-center rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${includeRelocating ? 'bg-[#0A66C2] justify-end' : 'bg-slate-300 justify-start'
                                                        }`}
                                                >
                                                    <div className="bg-white w-4.5 h-4.5 rounded-full shadow-md" />
                                                </button>
                                            </div>

                                            <div className="pt-3 mt-2 flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => setLocationPickerOpen(false)}
                                                    className="px-4 py-1.5 bg-[#0A66C2] hover:bg-[#004182] text-white text-[12px] font-bold rounded-lg shadow-xs cursor-pointer"
                                                >
                                                    Done
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Divider */}
                                <div className="hidden md:block w-px h-8 bg-slate-200" />

                                {/* 3. Experience Picker */}
                                <div className="relative" ref={expPickerRef}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setExpPickerOpen(prev => !prev);
                                            setLocationPickerOpen(false);
                                        }}
                                        className={`w-full md:w-auto flex items-center justify-between md:justify-start gap-2.5 px-3.5 py-2 rounded-xl text-left transition-all cursor-pointer ${expPickerOpen || (expMin !== '' || expMax !== '')
                                            ? 'bg-blue-50/90 text-blue-950 font-semibold ring-1 ring-blue-200'
                                            : 'hover:bg-slate-200/60 text-slate-700 font-medium'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Briefcase size={16} className={(expMin !== '' || expMax !== '') ? 'text-[#0A66C2]' : 'text-slate-400'} />
                                            <div className="flex flex-col">
                                                <span className="text-[13px] leading-tight truncate max-w-[120px]">
                                                    {expMin === '' && expMax === ''
                                                        ? 'Experience'
                                                        : `${expMin || '0'} - ${expMax || '30+'} yrs`}
                                                </span>
                                                <span className="text-[10.5px] text-slate-400 leading-none mt-0.5 font-normal">
                                                    {expMin === '' && expMax === '' ? 'Any exp' : 'Range set'}
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-150 ${expPickerOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {/* Experience Dropdown Flyout */}
                                    {expPickerOpen && (
                                        <div className="absolute left-0 md:left-auto md:right-0 top-full mt-2.5 w-80 bg-white rounded-2xl shadow-[0_16px_48px_-8px_rgba(0,0,0,0.2)] border border-slate-200/90 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                                            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-3">
                                                <span className="text-[13px] font-bold text-slate-900">Experience Range</span>
                                                {(expMin !== '' || expMax !== '') && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setExpMin('');
                                                            setExpMax('');
                                                        }}
                                                        className="text-[11px] font-bold text-[#0A66C2] hover:text-[#004182] cursor-pointer"
                                                    >
                                                        Reset
                                                    </button>
                                                )}
                                            </div>

                                            {/* Preset Pills */}
                                            <div className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                                Quick Presets
                                            </div>
                                            <div className="flex flex-wrap gap-1.5 mb-4">
                                                {[
                                                    { label: 'Any', min: '', max: '' },
                                                    { label: '0-2 yrs', min: '0', max: '2' },
                                                    { label: '3-5 yrs', min: '3', max: '5' },
                                                    { label: '5-8 yrs', min: '5', max: '8' },
                                                    { label: '8+ yrs', min: '8', max: '30' }
                                                ].map((preset) => {
                                                    const isMatch = expMin === preset.min && expMax === preset.max;
                                                    return (
                                                        <button
                                                            key={preset.label}
                                                            type="button"
                                                            onClick={() => {
                                                                setExpMin(preset.min);
                                                                setExpMax(preset.max);
                                                            }}
                                                            className={`px-2.5 py-1 text-[11.5px] font-bold rounded-lg border transition-all cursor-pointer ${isMatch
                                                                ? 'bg-[#0A66C2] text-white border-[#0A66C2] shadow-2xs'
                                                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300'
                                                                }`}
                                                        >
                                                            {preset.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {/* Dual Dropdowns */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                                        Minimum
                                                    </label>
                                                    <select
                                                        value={expMin}
                                                        onChange={(e) => setExpMin(e.target.value)}
                                                        className="w-full px-2.5 py-2 text-[13px] font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0A66C2] focus:bg-white text-slate-800"
                                                    >
                                                        <option value="">0 yr (Min)</option>
                                                        {EXPERIENCE_YEARS.map((y) => (
                                                            <option key={`min-${y}`} value={y}>{y} {y === 1 ? 'yr' : 'yrs'}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                                        Maximum
                                                    </label>
                                                    <select
                                                        value={expMax}
                                                        onChange={(e) => setExpMax(e.target.value)}
                                                        className="w-full px-2.5 py-2 text-[13px] font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0A66C2] focus:bg-white text-slate-800"
                                                    >
                                                        <option value="">Max (Any)</option>
                                                        {EXPERIENCE_YEARS.filter(y => expMin === '' || y >= Number(expMin)).map((y) => (
                                                            <option key={`max-${y}`} value={y}>{y} {y === 1 ? 'yr' : 'yrs'}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="pt-3 mt-3 flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => setExpPickerOpen(false)}
                                                    className="px-4 py-1.5 bg-[#0A66C2] hover:bg-[#004182] text-white text-[12px] font-bold rounded-lg shadow-xs cursor-pointer"
                                                >
                                                    Done
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 4. Primary Search Button */}
                                <button
                                    type="submit"
                                    className="w-full md:w-auto px-6 py-2.5 bg-[#0A66C2] hover:bg-[#004182] text-white font-medium text-[14px] rounded-xl shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/35 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 active:scale-[0.98]"
                                >
                                    <span>Search</span>
                                    <ArrowRight size={16} />
                                </button>
                            </div>

                            {/* Popular Searches / Trend Chips */}
                            <div className="flex items-center gap-2 pt-0.5 overflow-x-auto text-[12px]">
                                <span className="text-slate-400 font-semibold shrink-0">Popular:</span>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    {POPULAR_SEARCH_ROLES.map((role) => (
                                        <button
                                            key={role}
                                            type="button"
                                            onClick={() => setQuickKeywords(role)}
                                            className="px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-[#0A66C2] text-slate-600 font-semibold transition-colors cursor-pointer text-[11.5px] border border-slate-200/60 hover:border-blue-200"
                                        >
                                            + {role}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </form>

                        {/* Modal Footer: Advanced Search & Reset */}
                        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                            <div className="text-[12.5px] text-slate-500 font-medium">
                                Need more precise filters? Use{' '}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setQuickSearchOpen(false);
                                        router.push('/candidate-search');
                                    }}
                                    className="font-bold text-[#0A66C2] hover:text-[#004182] hover:underline inline-flex items-center gap-1 cursor-pointer"
                                >
                                    <span>Advanced Search</span>
                                    <ArrowRight size={13} />
                                </button>
                                {' '}for boolean queries, salary brackets, and education.
                            </div>

                            {(quickKeywords || selectedLocations.length > 0 || expMin !== '' || expMax !== '') && (
                                <button
                                    type="button"
                                    onClick={handleClearQuickFilters}
                                    className="text-[12px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                    <RotateCcw size={12} />
                                    <span>Reset filters</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Platform Guide Modal */}
            {guideModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-slate-50/50">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-[#0A66C2] text-white flex items-center justify-center shadow-xs">
                                    <Lightbulb size={18} />
                                </div>
                                <div>
                                    <h3 className="text-[17px] font-bold text-slate-900 mb-0">Platform Guide</h3>
                                    <p className="text-[12px] text-slate-500 mb-0">Quick walkthrough for CareerFast Recruiter Portal</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setGuideModalOpen(false)}
                                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-white/80 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#0A66C2] flex items-center justify-center flex-shrink-0 font-bold text-xs mt-0.5">
                                    1
                                </div>
                                <div>
                                    <h4 className="text-[14px] font-bold text-slate-900 mb-1">Candidate Search & Smart Filters</h4>
                                    <p className="text-[12.5px] text-slate-600 mb-0 leading-relaxed">
                                        Use keyword queries, boolean search, experience sliders, and multi-degree filters to find exact talent matches with instant previews.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#0A66C2] flex items-center justify-center flex-shrink-0 font-bold text-xs mt-0.5">
                                    2
                                </div>
                                <div>
                                    <h4 className="text-[14px] font-bold text-slate-900 mb-1">Job Postings & Questionnaire</h4>
                                    <p className="text-[12.5px] text-slate-600 mb-0 leading-relaxed">
                                        Post full-time jobs or internships from the <strong>Job</strong> dropdown menu and manage screening questionnaires for applicants.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 font-bold text-xs mt-0.5">
                                    3
                                </div>
                                <div>
                                    <h4 className="text-[14px] font-bold text-slate-900 mb-1">Folders & Bulk Pipeline</h4>
                                    <p className="text-[12.5px] text-slate-600 mb-0 leading-relaxed">
                                        Organize prospective hires by clicking <strong>Add to Folder</strong> in search results or view your saved candidate lists from the <strong>Folders</strong> tab.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setGuideModalOpen(false)}
                                className="px-5 py-2 bg-[#0A66C2] hover:bg-[#004182] text-white font-semibold text-[13px] rounded-xl transition-all shadow-xs"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default HrHeader;
