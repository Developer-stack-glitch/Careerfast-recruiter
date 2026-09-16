"use client";
import React, { useState, useEffect } from 'react';
import {
    FileCheck, Search, Calendar, ChevronsUpDown, ChevronLeft, ChevronRight, Briefcase, MoreVertical, Eye, Trash2, X, Mail, Phone, MapPin, User
} from 'lucide-react';
import { getAllAppliedCandidates, getUserProfile } from '../ApiService/action';
import toast from 'react-hot-toast';

// ── Actions Dropdown ──
const ActionsDropdown = ({ app, onClose, onViewProfile, isBottom }) => {
    const ref = React.useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) onClose();
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onClose]);

    return (
        <div ref={ref} className={`absolute right-0 ${isBottom ? 'bottom-full mb-1' : 'top-full mt-1'} w-48 bg-white rounded-xl shadow-lg border border-gray-200/80 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150`}>
            <button onClick={() => { onViewProfile(app.user_id); onClose(); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                <Eye className="w-3.5 h-3.5" /> View Profile
            </button>
            <button onClick={() => { window.open(`https://careerfast.in/job-details/${app.job_post_id}`, '_blank'); onClose(); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                <Briefcase className="w-3.5 h-3.5" /> View Applied Job
            </button>
        </div>
    );
};

// ── Profile Modal Component ──
const ProfileModal = ({ userId, onClose }) => {
    const [profile, setProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);

    useEffect(() => {
        if (!userId) return;
        const fetchProfile = async () => {
            try {
                setLoadingProfile(true);
                const res = await getUserProfile({ user_id: userId });
                setProfile(res?.data?.data || null);
            } catch (err) {
                console.error(err);
                toast.error("Failed to load profile details");
            } finally {
                setLoadingProfile(false);
            }
        };
        fetchProfile();
    }, [userId]);

    if (!userId) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 ring-1 ring-slate-900/5">
                {/* Header */}
                <div className="relative flex items-center justify-between px-4 py-4 border-b border-slate-100 bg-white z-10">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-0">Candidate Profile</h2>
                        <p className="text-xs text-slate-500 font-medium mt-1 mb-0">Detailed overview of the applicant</p>
                    </div>
                    <button onClick={onClose} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/20">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-0 overflow-y-auto flex-1 custom-scrollbar bg-slate-50/50">
                    {loadingProfile ? (
                        <div className="flex flex-col items-center justify-center py-24 space-y-4">
                            <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                            <p className="text-slate-500 text-sm font-medium animate-pulse">Loading profile data...</p>
                        </div>
                    ) : profile ? (
                        <div className="p-6 space-y-10">
                            {/* Profile Header */}
                            <div className="flex flex-col sm:flex-row gap-8 items-start bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                <div className="relative shrink-0">
                                    <div className="absolute inset-0 rounded-full blur opacity-20 transform scale-110"></div>
                                    {profile.profile_image ? (
                                        <img src={profile.profile_image} className="relative w-28 h-28 rounded-full object-cover border-4 border-white shadow-md z-10" alt="Profile" />
                                    ) : (
                                        <div className="relative w-28 h-28 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-4xl font-bold border-4 border-white shadow-md z-10">
                                            {(profile.first_name || 'C')[0].toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 w-full">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-0">
                                        <h3 className="text-2xl font-bold text-slate-900 mb-0">{profile.first_name} {profile.last_name}</h3>
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-blue-50 text-blue-700 border border-blue-100/50 w-fit">
                                            {profile.role_name || 'Candidate'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-sm text-slate-600 mt-4">
                                        <div className="flex items-center gap-3 bg-slate-50 px-3 py-2 rounded-lg">
                                            <div className="p-1.5 bg-white rounded-md shadow-sm"><Mail className="w-4 h-4 text-blue-500" /></div>
                                            <span className="font-medium truncate">{profile.email}</span>
                                        </div>
                                        {profile.phone && (
                                            <div className="flex items-center gap-3 bg-slate-50 px-3 py-2 rounded-lg">
                                                <div className="p-1.5 bg-white rounded-md shadow-sm"><Phone className="w-4 h-4 text-emerald-500" /></div>
                                                <span className="font-medium">{profile.phone_code} {profile.phone}</span>
                                            </div>
                                        )}
                                        {profile.location && (
                                            <div className="flex items-center gap-3 bg-slate-50 px-3 py-2 rounded-lg">
                                                <div className="p-1.5 bg-white rounded-md shadow-sm"><MapPin className="w-4 h-4 text-rose-500" /></div>
                                                <span className="font-medium truncate">{profile.location}</span>
                                            </div>
                                        )}
                                        {profile.experince_type && (
                                            <div className="flex items-center gap-3 bg-slate-50 px-3 py-2 rounded-lg">
                                                <div className="p-1.5 bg-white rounded-md shadow-sm"><Briefcase className="w-4 h-4 text-purple-500" /></div>
                                                <span className="font-medium truncate">{profile.experince_type} {profile.total_years ? `(${profile.total_years} Y)` : ''}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* About Section */}
                            {profile.about && (
                                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-400 to-indigo-500"></div>
                                    <h4 className="text-sm font-bold tracking-wider text-slate-400 uppercase mb-3 ml-2">About</h4>
                                    <p className="text-slate-700 leading-relaxed text-[15px] ml-2">{profile.about}</p>
                                </div>
                            )}

                            {/* Skills Section */}
                            {profile.skills && profile.skills.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-bold tracking-wider text-slate-400 uppercase mb-4 pl-1">Skills & Expertise</h4>
                                    <div className="flex flex-wrap gap-2.5">
                                        {profile.skills
                                            .flatMap(s => typeof s === 'string' ? s.split(',').map(skill => skill.trim()).filter(Boolean) : s)
                                            .map((skill, idx) => (
                                                <span key={idx} className="px-4 py-2 bg-white text-slate-700 rounded-xl text-sm font-semibold border border-slate-200/60 hover:border-blue-300 hover:text-blue-700 hover:-translate-y-0.5 transition-all cursor-default">
                                                    {skill}
                                                </span>
                                            ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Education */}
                                {profile.education && profile.education.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-bold tracking-wider text-slate-400 uppercase mb-4 pl-1">Education</h4>
                                        <div className="space-y-4">
                                            {profile.education.map((edu, idx) => (
                                                <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-4 hover:shadow-md transition-shadow relative overflow-hidden group">
                                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                        <FileCheck className="w-16 h-16 text-emerald-500" />
                                                    </div>
                                                    <div className="relative z-10">
                                                        <h5 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1">{edu.qualification} - {edu.course}</h5>
                                                        <p className="text-sm font-medium text-slate-600 mt-1 line-clamp-1 mb-0">{edu.college}</p>
                                                        <div className="mt-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 text-xs font-semibold text-slate-500 border border-slate-100">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            {edu.start_date ? new Date(edu.start_date).getFullYear() : ''} - {edu.end_date ? new Date(edu.end_date).getFullYear() : 'Present'}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Professional Experience */}
                                {profile.professional && profile.professional.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-bold tracking-wider text-slate-400 uppercase mb-4 pl-1">Experience</h4>
                                        <div className="space-y-4">
                                            {profile.professional.map((exp, idx) => (
                                                <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-4 hover:shadow-md transition-shadow relative overflow-hidden group">
                                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                        <Briefcase className="w-16 h-16 text-blue-500" />
                                                    </div>
                                                    <div className="relative z-10">
                                                        <h5 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{exp.job_title}</h5>
                                                        <p className="text-sm font-medium text-slate-600 mt-1 line-clamp-1 mb-0">{exp.company_name}</p>
                                                        <div className="mt-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 text-xs font-semibold text-slate-500 border border-slate-100">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            {exp.start_date ? new Date(exp.start_date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : ''} - {exp.currently_working ? 'Present' : (exp.end_date ? new Date(exp.end_date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '')}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24 text-center px-4">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <User className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">Profile Not Found</h3>
                            <p className="text-slate-500 text-sm max-w-sm">We couldn't load the profile information for this candidate. They may not have completed their profile setup.</p>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #cbd5e1;
                    border-radius: 20px;
                }
                .custom-scrollbar:hover::-webkit-scrollbar-thumb {
                    background-color: #94a3b8;
                }
            `}</style>
        </div>
    );
};

export default function Applications() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            return params.get('search') || '';
        }
        return '';
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalApplications, setTotalApplications] = useState(0);
    const [openDropdown, setOpenDropdown] = useState(null);
    const [selectedProfileId, setSelectedProfileId] = useState(null);
    const itemsPerPage = 10;

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchApplications();
        }, 500);
        return () => clearTimeout(timeout);
    }, [currentPage, searchTerm]);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            const payload = {
                page: currentPage,
                limit: itemsPerPage,
                search: searchTerm,
            };
            const response = await getAllAppliedCandidates(payload);
            const data = response?.data?.data || [];
            const total = response?.data?.total || data.length;

            // Apply client-side search if API doesn't support it directly
            let filteredData = data;
            if (searchTerm) {
                const lowerSearch = searchTerm.toLowerCase();
                filteredData = data.filter(app =>
                    (app.first_name?.toLowerCase() || '').includes(lowerSearch) ||
                    (app.last_name?.toLowerCase() || '').includes(lowerSearch) ||
                    (app.job_title?.toLowerCase() || '').includes(lowerSearch) ||
                    (app.company_name?.toLowerCase() || '').includes(lowerSearch) ||
                    (app.email?.toLowerCase() || '').includes(lowerSearch)
                );
            }

            setApplications(filteredData);
            setTotalApplications(total);
        } catch (error) {
            console.error("Error fetching applications:", error);
            toast.error("Failed to load applications");
        } finally {
            setLoading(false);
        }
    };

    const totalPages = Math.ceil(totalApplications / itemsPerPage) || 1;

    return (
        <div className="animate-in fade-in duration-500 max-w-[1600px] mx-auto w-full">
            {/* Header Section */}
            <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Applications</h1>
                    <p className="text-[14px] text-gray-500 mt-0 mb-0">Monitor all candidate applications across jobs.</p>
                </div>
            </div>

            {/* Filters and Search Bar Row */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                {/* Left: Stats/Tabs */}
                <div className="flex items-center gap-3 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar">
                    <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-semibold transition-all bg-indigo-50 text-indigo-700 border border-indigo-100">
                        <FileCheck className="w-4 h-4" />
                        <span>All Applications</span>
                        <span className="px-2 py-0.5 rounded-md text-[12px] font-bold bg-indigo-100 text-indigo-800">
                            {totalApplications.toLocaleString()}
                        </span>
                    </button>
                </div>

                {/* Right: Search */}
                <div className="flex items-center gap-3">
                    <div className="relative group w-full sm:w-[280px]">
                        <input
                            type="text"
                            placeholder="Search applicant or job..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="pl-4 pr-9 py-2.5 w-full bg-white border border-gray-200 rounded-xl text-[13px] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-400"
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className={`bg-white rounded-2xl ${openDropdown !== null ? '' : 'overflow-hidden'}`}>
                <div className={`pb-1 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-gray-50 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400 ${openDropdown !== null ? '' : 'overflow-x-auto'}`}>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="px-3 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-white w-1/3">
                                    <div className="flex items-center gap-2">APPLICANT <ChevronsUpDown className="w-3.5 h-3.5 opacity-50" /></div>
                                </th>
                                <th className="px-3 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-white">
                                    <div className="flex items-center gap-2">JOB POSTING <ChevronsUpDown className="w-3.5 h-3.5 opacity-50" /></div>
                                </th>
                                <th className="px-3 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-white">
                                    <div className="flex items-center gap-2">RECRUITER <ChevronsUpDown className="w-3.5 h-3.5 opacity-50" /></div>
                                </th>
                                <th className="px-3 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-white">
                                    <div className="flex items-center gap-2">APPLIED ON <ChevronsUpDown className="w-3.5 h-3.5 opacity-50" /></div>
                                </th>
                                <th className="px-3 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-white">
                                    <div className="flex items-center gap-2">STATUS <ChevronsUpDown className="w-3.5 h-3.5 opacity-50" /></div>
                                </th>
                                <th className="px-3 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-white text-center">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                                                <div className="space-y-2"><div className="h-4 w-32 bg-gray-200 rounded"></div><div className="h-3 w-24 bg-gray-200 rounded"></div></div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 space-y-2"><div className="h-4 w-40 bg-gray-200 rounded"></div><div className="h-3 w-32 bg-gray-200 rounded"></div></td>
                                        <td className="px-4 py-4 space-y-2"><div className="h-4 w-32 bg-gray-200 rounded"></div><div className="h-3 w-40 bg-gray-200 rounded"></div></td>
                                        <td className="px-4 py-4"><div className="h-6 w-24 bg-gray-200 rounded-lg"></div></td>
                                        <td className="px-4 py-4"><div className="h-6 w-20 bg-gray-200 rounded-full"></div></td>
                                        <td className="px-4 py-4 text-center"><div className="h-8 w-8 bg-gray-200 rounded-lg mx-auto"></div></td>
                                    </tr>
                                ))
                            ) : applications.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
                                            <FileCheck className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <h3 className="text-gray-900 font-medium text-base">No applications found</h3>
                                        <p className="text-gray-500 text-sm mt-1">Wait for candidates to apply or adjust your filters.</p>
                                    </td>
                                </tr>
                            ) : (
                                applications.map((app, idx) => {
                                    const name = `${app.first_name || ''} ${app.last_name || ''}`.trim() || 'Unknown Candidate';
                                    return (
                                        <tr key={app.applied_jobs_id || idx} className="hover:bg-gray-50/80 transition-colors group">
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    {app.profile_image ? (
                                                        <img src={app.profile_image} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-100" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm border border-blue-100">
                                                            {name.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-semibold text-gray-900 text-[14px]">{name}</div>
                                                        <div className="text-[12px] text-gray-500 flex items-center gap-2">
                                                            <span>{app.email}</span>
                                                            {app.phone && (
                                                                <>
                                                                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                                    <span>{app.phone}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="font-semibold text-gray-800 text-[13px]">{app.job_title || 'N/A'}</div>
                                                    <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
                                                        <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                                                        <span>{app.company_name || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="font-semibold text-gray-800 text-[13px]">{app.recruiter_name || (app.recruiter_first_name ? `${app.recruiter_first_name} ${app.recruiter_last_name || ''}`.trim() : 'N/A')}</div>
                                                    <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
                                                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                                                        <span>{app.recruiter_email || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="flex items-center gap-2 text-[13px] text-gray-600">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    {app.created_at ? new Date(app.created_at).toLocaleDateString('en-US', {
                                                        month: 'short', day: 'numeric', year: 'numeric'
                                                    }) : 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-semibold ${app.applied_status === 'Approved' ? 'bg-emerald-50 text-emerald-700' :
                                                    app.applied_status === 'Rejected' ? 'bg-rose-50 text-rose-700' :
                                                        'bg-amber-50 text-amber-700'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${app.applied_status === 'Approved' ? 'bg-emerald-500' :
                                                        app.applied_status === 'Rejected' ? 'bg-rose-500' :
                                                            'bg-amber-500'
                                                        }`}></span>
                                                    {app.applied_status || 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                <div className="relative inline-block text-left">
                                                    <button
                                                        onClick={() => setOpenDropdown(openDropdown === (app.applied_jobs_id || idx) ? null : (app.applied_jobs_id || idx))}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 bg-white border border-gray-200 hover:border-gray-300 transition-all"
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                    {openDropdown === (app.applied_jobs_id || idx) && (
                                                        <ActionsDropdown
                                                            app={app}
                                                            onClose={() => setOpenDropdown(null)}
                                                            onViewProfile={setSelectedProfileId}
                                                            isBottom={idx === applications.length - 1 && applications.length > 1}
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
                {!loading && totalApplications > 0 && (
                    <div className="px-4 py-4 border-t border-gray-100 flex items-center justify-between bg-white">
                        <div className="text-[13px] text-gray-500 w-1/3">
                            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalApplications)} to {Math.min(currentPage * itemsPerPage, totalApplications)} of {totalApplications.toLocaleString()} applications
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
                                            ? 'text-white border border-indigo-600 bg-indigo-600 shadow-sm'
                                            : 'text-gray-600 hover:bg-gray-50 bg-white border border-transparent hover:border-gray-200'
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

            {/* Profile Modal */}
            <ProfileModal
                userId={selectedProfileId}
                onClose={() => setSelectedProfileId(null)}
            />
        </div>
    );
}
