'use client';
import React, { useState, useRef, useEffect } from 'react';
import { BsBookmarkFill, BsThreeDotsVertical, BsStar, BsGenderMale, BsGenderFemale, BsEnvelope, BsTelephone, BsDownload } from 'react-icons/bs';
import { FiInfo, FiArrowRight, FiDownload as FiDownloadIcon, FiMapPin, FiBriefcase, FiPhone, FiBook, FiX, FiBookmark, FiSearch, FiChevronDown } from 'react-icons/fi';
import { FaLinkedinIn, FaTwitter, FaInstagram, FaFacebookF, FaDribbble } from "react-icons/fa";
import { MdOutlineDateRange, MdPublic } from "react-icons/md";
import { BiLayer } from "react-icons/bi";
import { HiOutlineMail } from 'react-icons/hi';
import { getSavedCandidatesHR, removeSavedCandidateHR } from '../ApiService/action';
import CommonLoader from '../Common/CommonLoader';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function SavedCandidates() {
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedApplicant, setSelectedApplicant] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [locationFilter, setLocationFilter] = useState('All Locations');
    const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
    const [experienceFilter, setExperienceFilter] = useState('All Experience');
    const [isExperienceDropdownOpen, setIsExperienceDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const router = useRouter();

    useEffect(() => {
        const fetchSaved = async () => {
            try {
                const response = await getSavedCandidatesHR();
                if (response?.data?.success) {
                    setCandidates(response.data.data);
                }
            } catch (error) {
                console.error("Error fetching saved candidates", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSaved();
    }, []);

    // Handle click outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setActiveDropdown(null);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDownload = async (url, name) => {
        if (!url || url === '#') {
            toast.error("No resume available for this candidate.");
            return;
        }
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = blobUrl;
            a.download = `Resume_${name.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(blobUrl);
            document.body.removeChild(a);
            toast.success("Resume downloaded successfully.");
        } catch (error) {
            console.error('Download failed, opening in new tab instead.', error);
            window.open(url, '_blank');
        }
    };

    const toggleDropdown = (id, e) => {
        e.stopPropagation();
        setActiveDropdown(activeDropdown === id ? null : id);
    };

    const uniqueLocations = ['All Locations', ...new Set(candidates.map(c => c.location).filter(Boolean))];
    const uniqueExperiences = ['All Experience', ...new Set(candidates.map(c => c.experience).filter(Boolean))];

    const filteredCandidates = candidates.filter(candidate => {
        const matchesSearch = searchQuery === '' ||
            candidate.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            candidate.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            candidate.email?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesLocation = locationFilter === 'All Locations' || candidate.location === locationFilter;

        const matchesExperience = experienceFilter === 'All Experience' || candidate.experience === experienceFilter;

        return matchesSearch && matchesLocation && matchesExperience;
    });

    return (
        <div
            className="min-h-screen bg-white font-sans p-6 md:p-10"
            onClick={() => {
                setIsLocationDropdownOpen(false);
                setIsExperienceDropdownOpen(false);
            }}
        >
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-gray-100">
                    <h1 className="text-[22px] font-semibold text-gray-900 mb-0">Saved Candidates <span className="text-gray-400 font-medium text-[16px]">({filteredCandidates.length})</span></h1>
                    <div className="flex items-center gap-2 text-[13px] text-gray-500 mt-2 md:mt-0 font-medium">
                        <FiInfo className="text-[16px] text-gray-400" />
                        <span>All of the candidates are visible until {new Date(new Date().setDate(new Date().getDate() + 30)).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                </div>

                {/* Filters */}
                {candidates.length > 0 && (
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 relative z-10">
                        {/* Search Bar */}
                        <div className="relative w-full md:w-80">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[16px]" />
                            <input
                                type="text"
                                placeholder="Search by name, role or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2] transition-colors w-full"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            {/* Location Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsLocationDropdownOpen(!isLocationDropdownOpen);
                                        setIsExperienceDropdownOpen(false);
                                    }}
                                    className="flex items-center justify-between gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-[14px] text-gray-700 hover:border-gray-300 transition-colors w-full md:w-auto min-w-[160px]"
                                >
                                    <span className="text-gray-500">Location:</span>
                                    <span className="font-medium truncate max-w-[100px]">{locationFilter === 'All Locations' ? 'All' : locationFilter}</span>
                                    <FiChevronDown className="text-gray-400 text-[16px]" />
                                </button>

                                {isLocationDropdownOpen && (
                                    <div className="absolute top-full right-0 mt-1.5 bg-white border border-gray-100 rounded-lg shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] z-50 overflow-y-auto max-h-[250px] min-w-[200px] animate-in fade-in zoom-in-95 duration-200">
                                        {uniqueLocations.map((loc, i) => (
                                            <div
                                                key={i}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setLocationFilter(loc);
                                                    setIsLocationDropdownOpen(false);
                                                }}
                                                className="px-4 py-1.5 text-[14px] font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                                            >
                                                {loc}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Experience Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsExperienceDropdownOpen(!isExperienceDropdownOpen);
                                        setIsLocationDropdownOpen(false);
                                    }}
                                    className="flex items-center justify-between gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-[14px] text-gray-700 hover:border-gray-300 transition-colors w-full md:w-auto min-w-[180px]"
                                >
                                    <span className="text-gray-500">Experience:</span>
                                    <span className="font-medium truncate max-w-[120px]">{experienceFilter === 'All Experience' ? 'All' : experienceFilter}</span>
                                    <FiChevronDown className="text-gray-400 text-[16px]" />
                                </button>

                                {isExperienceDropdownOpen && (
                                    <div className="absolute top-full right-0 mt-1.5 bg-white border border-gray-100 rounded-lg shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] z-50 overflow-y-auto max-h-[250px] min-w-[200px] animate-in fade-in zoom-in-95 duration-200">
                                        {uniqueExperiences.map((exp, i) => (
                                            <div
                                                key={i}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setExperienceFilter(exp);
                                                    setIsExperienceDropdownOpen(false);
                                                }}
                                                className="px-4 py-1.5 text-[14px] font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                                            >
                                                {exp}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Candidate List */}
                <div className="flex flex-col gap-3">
                    {loading ? (
                        <CommonLoader fullScreen={false} text="Loading Saved Candidates..." />
                    ) : candidates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center bg-white rounded-xl border border-gray-100 p-8">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-5 border border-gray-100">
                                <FiBookmark className="text-[32px] text-gray-300" />
                            </div>
                            <h3 className="text-[18px] font-semibold text-gray-900 mb-2">No saved candidates found</h3>
                            <p className="text-[14px] text-gray-500 max-w-md mx-auto mb-6 leading-relaxed">
                                You haven't saved any candidates yet. When you review applications, you can save candidates to easily find them later.
                            </p>
                            <button
                                onClick={() => router.push('/overview')}
                                className="bg-[#0A66C2] hover:bg-[#004182] text-white px-6 py-2.5 rounded-md text-[14px] font-medium transition-all shadow-sm flex items-center gap-2"
                            >
                                <span>View Job Postings</span>
                            </button>
                        </div>
                    ) : filteredCandidates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center bg-white rounded-xl border border-gray-100 p-8">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                                <FiSearch className="text-[24px] text-gray-300" />
                            </div>
                            <h3 className="text-[16px] font-semibold text-gray-900 mb-2">No candidates match your filters</h3>
                            <p className="text-[14px] text-gray-500 max-w-md mx-auto mb-6 leading-relaxed">
                                Try adjusting your search query, location, or experience filters.
                            </p>
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setLocationFilter('All Locations');
                                    setExperienceFilter('All Experience');
                                }}
                                className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-6 py-2.5 rounded-md text-[14px] font-medium transition-all shadow-sm"
                            >
                                Clear Filters
                            </button>
                        </div>
                    ) : (
                        filteredCandidates.map((candidate, index) => {
                            const isDropdownOpen = activeDropdown === candidate.id;

                            return (
                                <div
                                    key={`${candidate.id}-${index}`}
                                    className={`group flex items-center justify-between p-3 rounded-xl transition-all duration-200 border-1 ${isDropdownOpen
                                        ? 'border-[#0381ff] bg-[#fff] shadow-[0_2px_8px_rgba(3,129,255,0.15)]'
                                        : 'border-gray-100 hover:bg-[#fff]'
                                        }`}
                                >
                                    {/* Left: Avatar & Info */}
                                    <div className="flex items-center gap-4">
                                        <img
                                            src={candidate.avatar}
                                            alt={candidate.name}
                                            className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                                        />
                                        <div>
                                            <h3 className="text-[16px] font-semibold text-gray-900 leading-tight mb-0">{candidate.name}</h3>
                                            <p className="text-[13px] text-gray-500 font-medium mt-0.5 mb-2">{candidate.role}</p>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-gray-500">
                                                {candidate.experience && (
                                                    <span className="flex items-center gap-1">
                                                        <FiBriefcase className="text-gray-400" /> {candidate.experience}
                                                    </span>
                                                )}
                                                {candidate.location && (
                                                    <span className="flex items-center gap-1">
                                                        <FiMapPin className="text-gray-400" /> {candidate.location}
                                                    </span>
                                                )}
                                                {candidate.email && (
                                                    <span className="flex items-center gap-1">
                                                        <HiOutlineMail className="text-[14px] text-gray-400" /> {candidate.email}
                                                    </span>
                                                )}
                                                {candidate.phone && (
                                                    <span className="flex items-center gap-1">
                                                        <FiPhone className="text-gray-400" /> {candidate.phone}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex items-center gap-4 relative">
                                        <button
                                            className="text-emerald-600 hover:text-emerald-700 transition-colors p-2"
                                            onClick={async () => {
                                                try {
                                                    const res = await removeSavedCandidateHR(candidate.id);
                                                    if (res?.data?.success) {
                                                        setCandidates(candidates.filter(c => c.id !== candidate.id));
                                                    }
                                                } catch (error) {
                                                    console.error("Error removing candidate", error);
                                                }
                                            }}
                                            title="Remove candidate"
                                        >
                                            <BsBookmarkFill className="text-[18px]" />
                                        </button>

                                        <button
                                            onClick={() => {
                                                let parsedSkills = [];
                                                try {
                                                    parsedSkills = Array.isArray(candidate.skills) ? candidate.skills : JSON.parse(candidate.skills || '[]');
                                                } catch (e) { }

                                                setSelectedApplicant({
                                                    ...candidate,
                                                    applied: `Saved on: ${new Date(candidate.saved_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
                                                    emailStr: candidate.email,
                                                    phoneStr: candidate.phone,
                                                    education: candidate.education ? `Education: ${candidate.education}` : 'Education: Not specified',
                                                    experience: candidate.experience || 'Not specified',
                                                    about: candidate.about || 'I have not provided a biography.',
                                                    skills: parsedSkills,
                                                    social_links: typeof candidate.social_links === 'string' ? JSON.parse(candidate.social_links || '{}') : (candidate.social_links || {}),
                                                    gender: candidate.gender || 'Not specified',
                                                    resume: candidate.resume || null,
                                                });
                                                setIsModalOpen(true);
                                            }}
                                            className={`px-5 py-2.5 flex items-center gap-2 rounded-lg font-semibold text-[14px] transition-all ${isDropdownOpen
                                                ? 'bg-[#0A66C2] text-white'
                                                : 'bg-[#F0F5FF] text-[#0A66C2] hover:bg-blue-100'
                                                }`}
                                        >
                                            View Profile <FiArrowRight className="text-[16px]" />
                                        </button>

                                        <div className="relative" ref={isDropdownOpen ? dropdownRef : null}>
                                            <button
                                                onClick={(e) => toggleDropdown(candidate.id, e)}
                                                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${isDropdownOpen
                                                    ? 'bg-gray-200 text-gray-700'
                                                    : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
                                                    }`}
                                            >
                                                <BsThreeDotsVertical className="text-[18px]" />
                                            </button>

                                            {/* Dropdown Menu */}
                                            {isDropdownOpen && (
                                                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 py-2 z-50 animate-in fade-in zoom-in duration-200">
                                                    <a href={`mailto:${candidate.email || ''}`} className="w-full px-4 py-2.5 flex items-center gap-3 text-left text-[14px] text-gray-600 font-medium hover:bg-gray-50 hover:text-gray-900 transition-colors">
                                                        <HiOutlineMail className="text-[18px] text-gray-400" /> Send Email
                                                    </a>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDownload(candidate.resume, candidate.name);
                                                            setActiveDropdown(null);
                                                        }}
                                                        className="w-full px-4 py-2.5 flex items-center gap-3 text-left text-[14px] text-gray-600 font-medium hover:bg-gray-50 hover:text-gray-900 transition-colors"
                                                    >
                                                        <FiDownloadIcon className="text-[18px] text-gray-400" /> Download Cv
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        }))}
                </div>

            </div>

            {/* Modal */}
            {isModalOpen && selectedApplicant && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[20px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-6 sm:p-8 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white relative z-10">
                            <div className="flex items-center gap-5">
                                <div className="relative">
                                    <img src={selectedApplicant.avatar} alt="avatar" className="w-20 h-20 rounded-2xl object-cover ring-1 ring-gray-200 shadow-md" />
                                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
                                        <BsStar className="text-yellow-400 text-[14px]" />
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-[24px] sm:text-[28px] font-semibold text-gray-900 tracking-tight mb-1">{selectedApplicant.name}</h2>
                                    <div className="flex items-center gap-3">
                                        <p className="text-[15px] mb-0 text-blue-600 font-semibold">{selectedApplicant.role}</p>
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                        <span className="text-[14px] text-gray-500 font-medium">{selectedApplicant.applied}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <button
                                    className={`px-3 py-2 rounded-lg border-1 border-emerald-500 font-semibold text-[14px] flex items-center gap-2 transition-all duration-300 shadow-sm bg-emerald-50 text-emerald-700`}
                                    disabled={true}
                                >
                                    <BsBookmarkFill className="text-[16px] text-emerald-600" /> Saved
                                </button>
                                <button onClick={() => setIsModalOpen(false)} className="ml-2 w-10 h-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 hover:text-gray-700 transition-colors">
                                    <FiX className="text-xl" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto bg-slate-50 flex flex-col lg:flex-row custom-scrollbar">
                            {/* Left Content */}
                            <div className="flex-1 p-6 sm:p-8 space-y-8">
                                {/* About Section */}
                                <div className="bg-white p-6 rounded-[15px] shadow-md">
                                    <h3 className="text-[16px] font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <FiBook className="text-blue-600" /> Professional Summary
                                    </h3>
                                    <p className="text-[15px] leading-relaxed text-gray-600 font-medium mb-0">
                                        {selectedApplicant.about}
                                    </p>
                                </div>

                                {/* Skills Section */}
                                {selectedApplicant.skills && selectedApplicant.skills.length > 0 && (
                                    <div className="bg-white p-6 rounded-[15px] shadow-md">
                                        <h3 className="text-[16px] font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <BiLayer className="text-blue-600" /> Core Skills
                                        </h3>
                                        <div className="flex flex-wrap gap-2.5">
                                            {selectedApplicant.skills.map((skill, i) => (
                                                <span key={i} className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 text-[14px] font-semibold rounded-xl hover:bg-slate-100 transition-colors cursor-default">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Social Links */}
                                <div className="bg-white p-6 rounded-[15px] shadow-md">
                                    <h3 className="text-[16px] font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <MdPublic className="text-blue-600" /> Online Presence
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <a href={selectedApplicant.social_links?.linkedin || '#'} className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-300 text-[18px]">
                                            <FaLinkedinIn />
                                        </a>
                                        <a href={selectedApplicant.social_links?.twitter || '#'} className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 text-blue-400 flex items-center justify-center hover:bg-blue-400 hover:text-white hover:border-blue-400 transition-all duration-300 text-[18px]">
                                            <FaTwitter />
                                        </a>
                                        <a href={selectedApplicant.social_links?.dribble || '#'} className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 text-pink-500 flex items-center justify-center hover:bg-pink-500 hover:text-white hover:border-pink-500 transition-all duration-300 text-[18px]">
                                            <FaDribbble />
                                        </a>
                                        <a href={selectedApplicant.social_links?.facebook || '#'} className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 text-blue-700 flex items-center justify-center hover:bg-blue-700 hover:text-white hover:border-blue-700 transition-all duration-300 text-[18px]">
                                            <FaFacebookF />
                                        </a>
                                        <a href={selectedApplicant.social_links?.instagram || '#'} className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 text-rose-500 flex items-center justify-center hover:bg-gradient-to-tr hover:from-yellow-400 hover:via-rose-500 hover:to-purple-600 hover:text-white hover:border-transparent transition-all duration-300 text-[18px]">
                                            <FaInstagram />
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Right Sidebar */}
                            <div className="w-full lg:w-[380px] p-4 sm:p-8 lg:border-l border-gray-200/60 space-y-6 bg-white/50">
                                {/* Details Grid */}
                                <div className="bg-white p-4 rounded-[15px] shadow-md">
                                    <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                                        <div>
                                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                                                {selectedApplicant.gender === 'Female' ? <BsGenderFemale className="text-[18px]" /> : <BsGenderMale className="text-[18px]" />}
                                            </div>
                                            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Gender</div>
                                            <div className="text-[14px] font-semibold text-gray-900">{selectedApplicant.gender}</div>
                                        </div>
                                        <div>
                                            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                                                <FiBriefcase className="text-[18px]" />
                                            </div>
                                            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Experience</div>
                                            <div className="text-[14px] font-semibold text-gray-900">{selectedApplicant.experience}</div>
                                        </div>
                                        <div className="col-span-2">
                                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0A66C2] flex items-center justify-center mb-3">
                                                <FiBook className="text-[18px]" />
                                            </div>
                                            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Education</div>
                                            <div className="text-[14px] font-semibold text-gray-900" title={selectedApplicant.education}>{selectedApplicant.education?.replace('Education: ', '')}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Info */}
                                <div className="bg-white p-4 rounded-[15px] shadow-md">
                                    <h3 className="text-[14px] font-bold text-gray-900 mb-3">Contact Details</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors mt-0">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                                                <BsEnvelope className="text-[16px]" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Email</div>
                                                <div className="text-[14px] font-semibold text-gray-900 truncate" title={selectedApplicant.emailStr}>{selectedApplicant.emailStr}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors mt-0">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                                                <BsTelephone className="text-[16px]" />
                                            </div>
                                            <div>
                                                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Phone</div>
                                                <div className="text-[14px] font-semibold text-gray-900 mb-1">{selectedApplicant.phoneStr}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors mt-0">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                                                <FiMapPin className="text-[16px]" />
                                            </div>
                                            <div>
                                                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Location</div>
                                                <div className="text-[14px] font-semibold text-gray-900">{selectedApplicant.location}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Resume Download */}
                                <div className="bg-gradient-to-br from-[#0A66C2] to-[#004182] p-6 rounded-[15px] shadow-lg text-white relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                                    <div className="relative z-10">
                                        <h3 className="text-[16px] font-bold mb-1">Resume & CV</h3>
                                        <p className="text-blue-100 text-[13px] font-medium mb-3">Download candidate's full profile</p>
                                        <button
                                            onClick={() => handleDownload(selectedApplicant.resume, selectedApplicant.name)}
                                            className="w-full py-3.5 rounded-xl bg-white text-blue-600 font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors shadow-sm"
                                        >
                                            <BsDownload className="text-[16px]" /> Download PDF
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
