'use client';
import React, { useState, useEffect } from 'react';
import {
    Users, UserPlus, Shield, Check, X, Mail, Phone, Lock,
    Trash2, Edit3, CheckCircle2, XCircle, AlertCircle,
    ChevronRight, ArrowUpRight, Search, Filter, RefreshCw,
    Sliders, FileText, Eye, Download, PieChart, Sparkles,
    Briefcase, Info, Key, Award, AlertTriangle, Crown, ArrowRight, Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
    getRecruiterTeam,
    createSubRecruiter,
    updateSubRecruiterPermissions,
    toggleSubRecruiterStatus,
    deleteSubRecruiter,
    getMySubscription
} from '../ApiService/action';
import toast from 'react-hot-toast';

// Role presets definition
const ROLE_PRESETS = [
    {
        id: 'team_admin',
        title: 'Team Admin',
        badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
        desc: 'Full operational access. Can post jobs, view and download resumes, contact candidates, and manage all applicants.',
        permissions: {
            can_post_jobs: true,
            can_view_resumes: true,
            can_download_resumes: true,
            can_contact_candidates: true,
            can_manage_applications: true,
            can_edit_company_profile: true
        }
    },
    {
        id: 'recruiter',
        title: 'Standard Recruiter',
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        desc: 'Core hiring role. Can publish jobs, review and download candidate CVs, and shortlist talent.',
        permissions: {
            can_post_jobs: true,
            can_view_resumes: true,
            can_download_resumes: true,
            can_contact_candidates: true,
            can_manage_applications: true,
            can_edit_company_profile: false
        }
    },
    {
        id: 'sourcer',
        title: 'Sourcer / Reviewer',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        desc: 'Candidate search and profile review only. Cannot publish paid jobs.',
        permissions: {
            can_post_jobs: false,
            can_view_resumes: true,
            can_download_resumes: true,
            can_contact_candidates: true,
            can_manage_applications: true,
            can_edit_company_profile: false
        }
    },
    {
        id: 'custom',
        title: 'Custom Access',
        badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
        desc: 'Manually select granular feature permissions and quota splits.',
        permissions: {
            can_post_jobs: false,
            can_view_resumes: true,
            can_download_resumes: false,
            can_contact_candidates: false,
            can_manage_applications: false,
            can_edit_company_profile: false
        }
    }
];

export default function ManageTeam() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [team, setTeam] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const [subscription, setSubscription] = useState(null);
    const [hasTeamAccess, setHasTeamAccess] = useState(false);

    const [stats, setStats] = useState({
        sub_recruiter_limit: 0,
        total_members: 0,
        active_members: 0,
        remaining_seats: 0,
        company_name: 'Company',
        plan_name: 'Current Plan',
        pool: {
            job_posts: { total: 0, used: 0, remaining_pool: 0, allocated_to_team: 0, unallocated: 0 },
            resume_views: { total: 0, used: 0, remaining_pool: 0, allocated_to_team: 0, unallocated: 0 },
            resume_downloads: { total: 0, used: 0, remaining_pool: 0, allocated_to_team: 0, unallocated: 0 }
        }
    });

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [deleteModalMember, setDeleteModalMember] = useState(null);

    // Add Form state
    const initialFormState = {
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        designation: 'Recruiter',
        role_preset: 'recruiter',
        permissions: {
            ...ROLE_PRESETS.find(r => r.id === 'recruiter').permissions,
            quota_mode: 'split',
            allocated_job_posts: 0,
            allocated_resume_views: 0,
            allocated_resume_downloads: 0
        }
    };
    const [formData, setFormData] = useState(initialFormState);
    const [isSubRecruiterDenied, setIsSubRecruiterDenied] = useState(false);

    useEffect(() => {
        loadTeamData();
    }, []);

    const loadTeamData = async () => {
        try {
            setLoading(true);
            const stored = localStorage.getItem("loginDetails");
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    if (parsed.is_sub_recruiter || parsed.sub_recruiter_info) {
                        setIsSubRecruiterDenied(true);
                        setLoading(false);
                        return;
                    }
                } catch (e) { }
            }

            const [subRes, teamRes] = await Promise.allSettled([
                getMySubscription(),
                getRecruiterTeam()
            ]);

            let isCustom = false;
            if (subRes.status === 'fulfilled' && subRes.value?.success && subRes.value.data) {
                setSubscription(subRes.value.data);
                isCustom = Boolean(
                    subRes.value.data.is_custom ||
                    subRes.value.data.plan?.plan_type === 'custom' ||
                    subRes.value.data.plan?.plan_type === 'Custom' ||
                    subRes.value.data.plan?.slug?.startsWith('custom') ||
                    subRes.value.data.plan_slug?.startsWith('custom') ||
                    subRes.value.data.plan_name?.toLowerCase().includes('custom')
                );
            }

            if (isCustom && teamRes.status === 'fulfilled' && teamRes.value?.data?.success && teamRes.value.data.data) {
                setTeam(teamRes.value.data.data.team || []);
                if (teamRes.value.data.data.stats) {
                    setStats(teamRes.value.data.data.stats);
                }
            }

            setHasTeamAccess(isCustom);
        } catch (err) {
            console.error("Failed to load recruiter team:", err);
            if (err?.response?.status === 403 || err?.response?.data?.is_sub_recruiter) {
                setIsSubRecruiterDenied(true);
            }
            setHasTeamAccess(false);
        } finally {
            setLoading(false);
        }
    };

    const handleRolePresetSelect = (presetId) => {
        const selected = ROLE_PRESETS.find(r => r.id === presetId);
        if (selected) {
            setFormData(prev => ({
                ...prev,
                role_preset: presetId,
                permissions: {
                    ...prev.permissions,
                    ...selected.permissions
                }
            }));
        }
    };

    const handlePermissionToggle = (key) => {
        setFormData(prev => ({
            ...prev,
            role_preset: 'custom',
            permissions: {
                ...prev.permissions,
                [key]: !prev.permissions[key]
            }
        }));
    };

    const handleQuotaModeToggle = (mode) => {
        setFormData(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                quota_mode: mode
            }
        }));
    };

    const handleQuotaNumberChange = (field, val) => {
        let num = Math.max(0, parseInt(val) || 0);
        if (field === 'allocated_job_posts') {
            const max = stats.pool?.job_posts?.available_to_allocate ?? stats.pool?.job_posts?.unallocated ?? 0;
            num = Math.min(num, max);
        } else if (field === 'allocated_resume_views') {
            const max = stats.pool?.resume_views?.available_to_allocate ?? stats.pool?.resume_views?.unallocated ?? 0;
            num = Math.min(num, max);
        } else if (field === 'allocated_resume_downloads') {
            const max = stats.pool?.resume_downloads?.available_to_allocate ?? stats.pool?.resume_downloads?.unallocated ?? 0;
            num = Math.min(num, max);
        }
        setFormData(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [field]: num
            }
        }));
    };

    const handleCreateSubRecruiter = async (e) => {
        e.preventDefault();
        if (!formData.first_name.trim() || !formData.email.trim() || !formData.password.trim()) {
            toast.error("Please enter first name, email, and a secure password.");
            return;
        }

        if (stats.remaining_seats <= 0) {
            toast.error(`Team seat limit reached (${stats.sub_recruiter_limit} seats). Upgrade your subscription plan to add more sub-recruiters.`);
            return;
        }

        if (formData.permissions.quota_mode === 'split') {
            // Restrict allocating jobs if company plan limit is already filled
            if (formData.permissions.allocated_job_posts > 0) {
                const avail = stats.pool?.job_posts?.available_to_allocate ?? stats.pool?.job_posts?.unallocated ?? 0;
                if (avail <= 0) {
                    toast.error(`Cannot allocate job posts: Company plan job limit is completely filled (${stats.pool?.job_posts?.used || 0}/${stats.pool?.job_posts?.total || 5} used). Upgrade plan to allocate job posts.`);
                    return;
                }
                if (formData.permissions.allocated_job_posts > avail) {
                    toast.error(`Cannot allocate ${formData.permissions.allocated_job_posts} jobs. Only ${avail} jobs available to allocate in your plan pool.`);
                    return;
                }
            }

            // Restrict allocating resume views if pool is exhausted or exceeded
            if (formData.permissions.allocated_resume_views > 0) {
                const avail = stats.pool?.resume_views?.available_to_allocate ?? stats.pool?.resume_views?.unallocated ?? 0;
                if (avail <= 0) {
                    toast.error(`Cannot allocate resume views: Company plan resume view quota is completely exhausted. Upgrade plan to allocate views.`);
                    return;
                }
                if (formData.permissions.allocated_resume_views > avail) {
                    toast.error(`Cannot allocate ${formData.permissions.allocated_resume_views} resume views. Only ${avail} available to allocate in your plan pool.`);
                    return;
                }
            }

            // Restrict allocating downloads if pool is exhausted or exceeded
            if (formData.permissions.allocated_resume_downloads > 0) {
                const avail = stats.pool?.resume_downloads?.available_to_allocate ?? stats.pool?.resume_downloads?.unallocated ?? 0;
                if (avail <= 0) {
                    toast.error(`Cannot allocate CV downloads: Company plan download quota is completely exhausted. Upgrade plan to allocate downloads.`);
                    return;
                }
                if (formData.permissions.allocated_resume_downloads > avail) {
                    toast.error(`Cannot allocate ${formData.permissions.allocated_resume_downloads} CV downloads. Only ${avail} available to allocate in your plan pool.`);
                    return;
                }
            }
        }

        try {
            setSubmitting(true);
            const res = await createSubRecruiter(formData);
            if (res?.data?.success) {
                toast.success("Sub-recruiter account created and seats allocated!");
                setIsAddModalOpen(false);
                setFormData(initialFormState);
                loadTeamData();
            }
        } catch (err) {
            console.error(err);
            toast.error(err?.response?.data?.message || err.message || "Failed to create sub-recruiter.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenEdit = (member) => {
        setEditingMember({
            id: member.id,
            full_name: member.full_name,
            email: member.email,
            designation: member.designation || 'Recruiter',
            role_preset: member.role_preset || 'recruiter',
            permissions: {
                can_post_jobs: Boolean(member.permissions?.can_post_jobs),
                can_view_resumes: Boolean(member.permissions?.can_view_resumes),
                can_download_resumes: Boolean(member.permissions?.can_download_resumes),
                can_contact_candidates: Boolean(member.permissions?.can_contact_candidates),
                can_manage_applications: Boolean(member.permissions?.can_manage_applications),
                can_edit_company_profile: Boolean(member.permissions?.can_edit_company_profile),
                quota_mode: member.permissions?.quota_mode || 'shared',
                allocated_job_posts: member.permissions?.allocated_job_posts ?? 0,
                allocated_resume_views: member.permissions?.allocated_resume_views ?? 0,
                allocated_resume_downloads: member.permissions?.allocated_resume_downloads ?? 0,
                used_job_posts: member.permissions?.used_job_posts || 0,
                used_resume_views: member.permissions?.used_resume_views || 0,
                used_resume_downloads: member.permissions?.used_resume_downloads || 0
            }
        });
    };

    const handleSavePermissions = async () => {
        if (!editingMember) return;

        if (editingMember.permissions?.quota_mode === 'split') {
            // Restrict allocating jobs if exceeding available capacity
            if (editingMember.permissions.allocated_job_posts !== undefined) {
                const poolAvail = stats.pool?.job_posts?.available_to_allocate ?? stats.pool?.job_posts?.unallocated ?? 0;
                const currentSub = team.find(t => t.id === editingMember.id);
                const currentAllocated = currentSub?.permissions?.allocated_job_posts || 0;
                const maxAllowed = poolAvail + currentAllocated;

                if (editingMember.permissions.allocated_job_posts > maxAllowed) {
                    toast.error(`Cannot allocate ${editingMember.permissions.allocated_job_posts} jobs. Only ${maxAllowed} jobs are available in your plan pool (Plan: ${stats.pool?.job_posts?.total || 5}, Used: ${stats.pool?.job_posts?.used || 0}).`);
                    return;
                }
            }

            // Restrict allocating views if exceeding available capacity
            if (editingMember.permissions.allocated_resume_views !== undefined) {
                const poolAvail = stats.pool?.resume_views?.available_to_allocate ?? stats.pool?.resume_views?.unallocated ?? 0;
                const currentSub = team.find(t => t.id === editingMember.id);
                const currentAllocated = currentSub?.permissions?.allocated_resume_views || 0;
                const maxAllowed = poolAvail + currentAllocated;

                if (editingMember.permissions.allocated_resume_views > maxAllowed) {
                    toast.error(`Cannot allocate ${editingMember.permissions.allocated_resume_views} views. Only ${maxAllowed} views are available in your plan pool.`);
                    return;
                }
            }

            // Restrict allocating downloads if exceeding available capacity
            if (editingMember.permissions.allocated_resume_downloads !== undefined) {
                const poolAvail = stats.pool?.resume_downloads?.available_to_allocate ?? stats.pool?.resume_downloads?.unallocated ?? 0;
                const currentSub = team.find(t => t.id === editingMember.id);
                const currentAllocated = currentSub?.permissions?.allocated_resume_downloads || 0;
                const maxAllowed = poolAvail + currentAllocated;

                if (editingMember.permissions.allocated_resume_downloads > maxAllowed) {
                    toast.error(`Cannot allocate ${editingMember.permissions.allocated_resume_downloads} downloads. Only ${maxAllowed} downloads are available in your plan pool.`);
                    return;
                }
            }
        }

        try {
            setSubmitting(true);
            const res = await updateSubRecruiterPermissions(editingMember.id, {
                designation: editingMember.designation,
                role_preset: editingMember.role_preset,
                permissions: editingMember.permissions
            });
            if (res?.data?.success) {
                toast.success("Permissions and quotas updated successfully.");
                setEditingMember(null);
                loadTeamData();
            }
        } catch (err) {
            console.error(err);
            toast.error(err?.response?.data?.message || "Failed to update permissions.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async (member) => {
        const nextStatus = member.status === 'active' ? 'suspended' : 'active';
        const actionLabel = nextStatus === 'active' ? 'activate' : 'suspend';
        try {
            const res = await toggleSubRecruiterStatus(member.id, nextStatus);
            if (res?.data?.success) {
                toast.success(`Sub-recruiter account ${nextStatus === 'active' ? 'activated' : 'suspended'}.`);
                loadTeamData();
            }
        } catch (err) {
            console.error(err);
            toast.error(`Failed to ${actionLabel} sub-recruiter.`);
        }
    };

    const handleDeleteMember = async () => {
        if (!deleteModalMember) return;
        try {
            setSubmitting(true);
            const res = await deleteSubRecruiter(deleteModalMember.id);
            if (res?.data?.success) {
                toast.success("Seat revoked and sub-recruiter removed successfully.");
                setDeleteModalMember(null);
                loadTeamData();
            }
        } catch (err) {
            console.error(err);
            toast.error(err?.response?.data?.message || "Failed to remove sub-recruiter.");
        } finally {
            setSubmitting(false);
        }
    };

    // Filter members
    const filteredTeam = team.filter(m => {
        const matchesSearch = !searchQuery.trim() ||
            m.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.designation?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesRole = roleFilter === 'all' || m.role_preset === roleFilter;
        const matchesStatus = statusFilter === 'all' || m.status === statusFilter;

        return matchesSearch && matchesRole && matchesStatus;
    });

    const isSeatFull = stats.remaining_seats <= 0;

    if (isSubRecruiterDenied) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center p-6 bg-[#F8FAFC]">
                <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/90 shadow-sm p-8 text-center">
                    <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
                        <Shield size={28} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Access Restricted</h2>
                    <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                        Team & Seat Management is restricted to the primary recruiter account. Sub-recruiters cannot manage or allocate team seats.
                    </p>
                    <button
                        onClick={() => window.location.href = '/overview'}
                        className="w-full py-2.5 px-4 bg-[#0A66C2] hover:bg-[#004182] text-white font-semibold text-sm rounded-xl transition-all shadow-xs cursor-pointer"
                    >
                        Return to Workspace
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] pb-24 pt-6 px-4 sm:px-6 lg:px-8 antialiased">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header Skeleton */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-blue-100/70 animate-pulse" />
                            <div>
                                <div className="w-56 h-6 bg-slate-200 rounded-lg animate-pulse mb-1" />
                                <div className="w-80 h-3.5 bg-slate-100 rounded animate-pulse" />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <div className="w-10 h-10 bg-slate-100 rounded-xl animate-pulse" />
                            <div className="w-36 h-10 bg-blue-600/60 rounded-xl animate-pulse" />
                        </div>
                    </div>

                    {/* Stats Cards Skeleton */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 animate-pulse">
                                <div className="flex justify-between items-center">
                                    <div className="w-24 h-4 bg-slate-200 rounded" />
                                    <div className="w-8 h-8 rounded-xl bg-slate-100" />
                                </div>
                                <div className="w-28 h-7 bg-slate-300 rounded-lg" />
                                <div className="w-full h-3 bg-slate-100 rounded" />
                            </div>
                        ))}
                    </div>

                    {/* Table Skeleton */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                            <div className="w-64 h-10 bg-slate-50 rounded-xl border border-slate-100 animate-pulse" />
                            <div className="flex gap-2">
                                <div className="w-28 h-10 bg-slate-100 rounded-xl animate-pulse" />
                                <div className="w-28 h-10 bg-slate-100 rounded-xl animate-pulse" />
                            </div>
                        </div>
                        {[1, 2, 3].map(i => (
                            <div key={i} className="p-4 bg-slate-50/60 rounded-xl border border-slate-100 flex items-center justify-between animate-pulse">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-200" />
                                    <div className="space-y-1.5">
                                        <div className="w-40 h-4 bg-slate-200 rounded" />
                                        <div className="w-32 h-3 bg-slate-100 rounded" />
                                    </div>
                                </div>
                                <div className="w-20 h-7 bg-slate-100 rounded-lg" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!hasTeamAccess) {
        const planTitle = subscription?.plan?.name || subscription?.plan_name || 'Basic';
        return (
            <div className="min-h-screen bg-[#F8FAFC] pb-24 pt-6 px-4 sm:px-6 lg:px-8 antialiased">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#0A66C2] flex items-center justify-center shadow-xs">
                                <Users size={22} className="stroke-[2.2]" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-0">
                                        Sub-Recruiter Seat & Team Management
                                    </h1>
                                    <span className="bg-amber-50 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
                                        Custom Plan Exclusive
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500 mt-0.5 mb-0">
                                    Allot team seats, split job postings, resume views, and downloads with granular permission control.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-3xl mx-auto pt-6">
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 sm:p-10 text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 mb-6 shadow-xs">
                                <Lock className="w-10 h-10" />
                            </div>

                            <h2 className="text-2xl font-bold text-slate-900 mb-2">
                                Team & Seat Management Restricted
                            </h2>
                            <p className="text-sm text-slate-600 max-w-xl mx-auto mb-8 leading-relaxed">
                                Your recruiter account is currently on the <strong className="text-slate-900 font-bold">{planTitle} Plan</strong>, which is configured exclusively for <strong className="text-[#0A66C2]">Job Posting</strong>. Adding sub-recruiter team seats, delegating hiring workflows, and splitting resume/job quotas require a <strong className="text-purple-700">Custom Plan</strong> assigned by the Super Admin.
                            </p>

                            {/* Comparison Matrix */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left mb-8">
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                                    <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-500 mb-3">
                                        <span>Your Active {planTitle} Plan</span>
                                    </div>
                                    <ul className="space-y-2.5 text-xs text-slate-700">
                                        <li className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                            <span>Primary Recruiter Job Posting</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                            <span>Applicant Management & Tracking</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                            <span>Company Profile & Branding</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/80">
                                    <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-purple-700 mb-3">
                                        <Crown className="w-3.5 h-3.5" />
                                        <span>Custom Plan Unlocks</span>
                                    </div>
                                    <ul className="space-y-2.5 text-xs text-slate-700">
                                        <li className="flex items-center gap-2">
                                            <Lock className="w-4 h-4 text-purple-600 shrink-0" />
                                            <span>Sub-Recruiter Seat Allocation</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Lock className="w-4 h-4 text-purple-600 shrink-0" />
                                            <span>Job & Resume Quota Splitting</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Lock className="w-4 h-4 text-purple-600 shrink-0" />
                                            <span>Role Presets (Admin, Sourcer, Custom)</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* CTAs */}
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => router.push('/subscription')}
                                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <Crown className="w-4 h-4" />
                                    <span>Upgrade to Custom Plan</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => router.push('/my-jobs')}
                                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-sm transition-all cursor-pointer"
                                >
                                    <span>Go to Job Postings</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 pt-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Top Header / Title Bar */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#0A66C2] flex items-center justify-center shadow-xs">
                                <Users size={22} className="stroke-[2.2]" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight mb-0">
                                    Sub-Recruiter Seat & Team Management
                                </h1>
                                <p className="text-sm text-slate-500 mt-0.5 mb-0">
                                    Allot team seats, split job postings, resume views, and downloads with granular permission control.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={loadTeamData}
                            disabled={loading}
                            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                            title="Refresh team metrics"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin text-blue-600' : ''} />
                        </button>

                        <button
                            onClick={() => {
                                const availJobs = stats.pool?.job_posts?.available_to_allocate ?? stats.pool?.job_posts?.unallocated ?? 0;
                                const availViews = stats.pool?.resume_views?.available_to_allocate ?? stats.pool?.resume_views?.unallocated ?? 0;
                                const availDownloads = stats.pool?.resume_downloads?.available_to_allocate ?? stats.pool?.resume_downloads?.unallocated ?? 0;
                                setFormData({
                                    ...initialFormState,
                                    permissions: {
                                        ...initialFormState.permissions,
                                        allocated_job_posts: Math.min(2, Math.max(0, availJobs)),
                                        allocated_resume_views: Math.min(20, Math.max(0, availViews)),
                                        allocated_resume_downloads: Math.min(10, Math.max(0, availDownloads))
                                    }
                                });
                                setIsAddModalOpen(true);
                            }}
                            disabled={isSeatFull}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 cursor-pointer shadow-xs ${isSeatFull
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-[#0A66C2] hover:bg-[#084e96] text-white hover:shadow-md'
                                }`}
                        >
                            <UserPlus size={18} />
                            <span>Add Sub-Recruiter</span>
                        </button>
                    </div>
                </div>

                {/* Seat Quota & Quota Splitting Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Seats Allocation */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold text-slate-600 ">Allotted Seats</span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isSeatFull ? 'bg-amber-50 text-amber-700 border-1 border-amber-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                                {stats.plan_name}
                            </span>
                        </div>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-2xl font-semibold text-slate-900">{stats.total_members}</span>
                            <span className="text-sm font-semibold text-slate-400">/ {stats.sub_recruiter_limit} Seats</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 mb-2 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${isSeatFull ? 'bg-amber-500' : 'bg-[#0A66C2]'}`}
                                style={{ width: `${Math.min(100, Math.round((stats.total_members / Math.max(1, stats.sub_recruiter_limit)) * 100))}%` }}
                            />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-medium">{stats.remaining_seats} seats remaining</span>
                            <span className="text-slate-400">{stats.active_members} active</span>
                        </div>
                    </div>

                    {/* Card 2: Job Posts Pool */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold text-slate-600 ">Job Posts Pool</span>
                            <div className="w-6 h-6 rounded-lg bg-blue-50 text-[#0A66C2] flex items-center justify-center">
                                <Briefcase size={14} />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-2xl font-semibold text-slate-900">{stats.pool?.job_posts?.used || 0}</span>
                            <span className="text-sm font-semibold text-slate-400">/ {stats.pool?.job_posts?.total || 0} Total</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 mb-2 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-blue-500 transition-all duration-500"
                                style={{ width: `${Math.min(100, Math.round(((stats.pool?.job_posts?.used || 0) / Math.max(1, stats.pool?.job_posts?.total || 1)) * 100))}%` }}
                            />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-blue-700 font-medium">{stats.pool?.job_posts?.allocated_to_team || 0} split to team</span>
                            <span className="text-slate-400">{stats.pool?.job_posts?.unallocated || 0} unallocated</span>
                        </div>
                    </div>

                    {/* Card 3: Resume Views Pool */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold text-slate-600 ">Resume Views Pool</span>
                            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <Eye size={14} />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-2xl font-semibold text-slate-900">{stats.pool?.resume_views?.used || 0}</span>
                            <span className="text-sm font-semibold text-slate-400">/ {stats.pool?.resume_views?.total || 0} Total</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 mb-2 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                style={{ width: `${Math.min(100, Math.round(((stats.pool?.resume_views?.used || 0) / Math.max(1, stats.pool?.resume_views?.total || 1)) * 100))}%` }}
                            />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-emerald-700 font-medium">{stats.pool?.resume_views?.allocated_to_team || 0} split to team</span>
                            <span className="text-slate-400">{stats.pool?.resume_views?.unallocated || 0} unallocated</span>
                        </div>
                    </div>

                    {/* Card 4: Resume Downloads Pool */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold text-slate-600 ">Downloads Pool</span>
                            <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                                <Download size={14} />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-2xl font-semibold text-slate-900">{stats.pool?.resume_downloads?.used || 0}</span>
                            <span className="text-sm font-semibold text-slate-400">/ {stats.pool?.resume_downloads?.total || 0} Total</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 mb-2 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-purple-500 transition-all duration-500"
                                style={{ width: `${Math.min(100, Math.round(((stats.pool?.resume_downloads?.used || 0) / Math.max(1, stats.pool?.resume_downloads?.total || 1)) * 100))}%` }}
                            />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-purple-700 font-medium">{stats.pool?.resume_downloads?.allocated_to_team || 0} split to team</span>
                            <span className="text-slate-400">{stats.pool?.resume_downloads?.unallocated || 0} unallocated</span>
                        </div>
                    </div>
                </div>

                {/* Seat Limit Warning Banner if Full */}
                {isSeatFull && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <AlertTriangle size={22} className="text-amber-600 shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-amber-900 mb-0.5">
                                    All Allotted Seats Reached ({stats.total_members} / {stats.sub_recruiter_limit})
                                </p>
                                <p className="text-xs text-amber-700 mb-0">
                                    You have utilized all sub-recruiter seats available under your {stats.plan_name} plan. Upgrade your plan to add more team members.
                                </p>
                            </div>
                        </div>
                        <a
                            href="/billing"
                            className="shrink-0 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors no-underline"
                        >
                            Upgrade Plan
                        </a>
                    </div>
                )}

                {/* Filter & Search Bar */}
                <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1 max-w-md bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                        <Search size={16} className="text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search sub-recruiters by name, email, or designation..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none outline-none text-xs sm:text-sm text-slate-800 w-full placeholder:text-slate-400"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-3 overflow-x-auto pb-1 md:pb-0">
                        {/* Role Filter */}
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
                        >
                            <option value="all">All Roles</option>
                            <option value="team_admin">Team Admin</option>
                            <option value="recruiter">Recruiter</option>
                            <option value="sourcer">Sourcer</option>
                            <option value="custom">Custom</option>
                        </select>

                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active Only</option>
                            <option value="suspended">Suspended Only</option>
                        </select>
                    </div>
                </div>

                {/* Team Members List / Table */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    <th className="py-3.5 px-6">Sub-Recruiter</th>
                                    <th className="py-3.5 px-4">Role & Designation</th>
                                    <th className="py-3.5 px-4 text-center">Job Posts Split</th>
                                    <th className="py-3.5 px-4 text-center">Resume Views Split</th>
                                    <th className="py-3.5 px-4 text-center">Downloads Split</th>
                                    <th className="py-3.5 px-4 text-center">Status</th>
                                    <th className="py-3.5 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-slate-400">
                                            <RefreshCw size={24} className="animate-spin text-blue-600 mx-auto mb-2" />
                                            <span>Loading team seats and quotas...</span>
                                        </td>
                                    </tr>
                                ) : filteredTeam.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center">
                                            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0A66C2] flex items-center justify-center mx-auto mb-3">
                                                <Users size={24} />
                                            </div>
                                            <h3 className="text-base font-bold text-slate-800 mb-1">
                                                {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
                                                    ? 'No sub-recruiters match your filters'
                                                    : 'No sub-recruiters created yet'}
                                            </h3>
                                            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                                                Create sub-recruiter seats to delegate hiring, split monthly job posts, and assign resume download quotas.
                                            </p>
                                            {!isSeatFull && (
                                                <button
                                                    onClick={() => {
                                                        setFormData(initialFormState);
                                                        setIsAddModalOpen(true);
                                                    }}
                                                    className="px-4 py-2 bg-[#0A66C2] hover:bg-[#084e96] text-white text-sm font-medium rounded-xl transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                                                >
                                                    <UserPlus size={15} />
                                                    <span>Add First Sub-Recruiter</span>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTeam.map((member) => {
                                        const role = ROLE_PRESETS.find(r => r.id === member.role_preset) || ROLE_PRESETS[1];
                                        const isSplit = member.permissions?.quota_mode === 'split';

                                        // Jobs
                                        const jobsAllocated = member.permissions?.allocated_job_posts;
                                        const jobsUsed = member.permissions?.used_job_posts || member.jobs_posted_count || 0;

                                        // Views
                                        const viewsAllocated = member.permissions?.allocated_resume_views;
                                        const viewsUsed = member.permissions?.used_resume_views || 0;

                                        // Downloads
                                        const downloadsAllocated = member.permissions?.allocated_resume_downloads;
                                        const downloadsUsed = member.permissions?.used_resume_downloads || 0;

                                        return (
                                            <tr key={member.id} className="hover:bg-slate-50/60 transition-colors">
                                                {/* Member Details */}
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                                                            {member.first_name ? member.first_name.charAt(0).toUpperCase() : 'R'}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold text-slate-900 truncate mb-0.5">
                                                                {member.full_name || `${member.first_name} ${member.last_name}`}
                                                            </p>
                                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                                <span className="truncate">{member.email}</span>
                                                                {member.phone && <span>• {member.phone}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Role & Designation */}
                                                <td className="py-4 px-4">
                                                    <div>
                                                        <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full border mb-1 ${role.badgeColor}`}>
                                                            {role.title}
                                                        </span>
                                                        <p className="text-xs text-slate-500 font-medium mb-0 truncate max-w-[140px]">
                                                            {member.designation || 'Recruiter'}
                                                        </p>
                                                    </div>
                                                </td>

                                                {/* Job Posts Quota */}
                                                <td className="py-4 px-4 text-center">
                                                    {isSplit && jobsAllocated !== null ? (
                                                        <div className="inline-flex flex-col items-center">
                                                            <span className="text-xs font-bold text-slate-800">
                                                                {jobsUsed} / {jobsAllocated}
                                                            </span>
                                                            <div className="w-16 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                                                                <div
                                                                    className="bg-blue-600 h-full rounded-full"
                                                                    style={{ width: `${Math.min(100, Math.round((jobsUsed / Math.max(1, jobsAllocated)) * 100))}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                                            Shared Pool
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Resume Views Quota */}
                                                <td className="py-4 px-4 text-center">
                                                    {isSplit && viewsAllocated !== null ? (
                                                        <div className="inline-flex flex-col items-center">
                                                            <span className="text-xs font-bold text-slate-800">
                                                                {viewsUsed} / {viewsAllocated}
                                                            </span>
                                                            <div className="w-16 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                                                                <div
                                                                    className="bg-emerald-600 h-full rounded-full"
                                                                    style={{ width: `${Math.min(100, Math.round((viewsUsed / Math.max(1, viewsAllocated)) * 100))}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                                            Shared Pool
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Resume Downloads Quota */}
                                                <td className="py-4 px-4 text-center">
                                                    {isSplit && downloadsAllocated !== null ? (
                                                        <div className="inline-flex flex-col items-center">
                                                            <span className="text-xs font-bold text-slate-800">
                                                                {downloadsUsed} / {downloadsAllocated}
                                                            </span>
                                                            <div className="w-16 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                                                                <div
                                                                    className="bg-purple-600 h-full rounded-full"
                                                                    style={{ width: `${Math.min(100, Math.round((downloadsUsed / Math.max(1, downloadsAllocated)) * 100))}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                                            Shared Pool
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Status Toggle */}
                                                <td className="py-4 px-4 text-center">
                                                    <button
                                                        onClick={() => handleToggleStatus(member)}
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${member.status === 'active'
                                                            ? 'bg-emerald-50 text-emerald-700 border-1 border-emerald-200 hover:bg-emerald-100'
                                                            : 'bg-amber-50 text-amber-700 border-1 border-amber-200 hover:bg-amber-100'
                                                            }`}
                                                        title="Click to toggle status"
                                                    >
                                                        <span className={`w-1.5 h-1.5 rounded-full ${member.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                        <span>{member.status === 'active' ? 'Active' : 'Suspended'}</span>
                                                    </button>
                                                </td>

                                                {/* Actions */}
                                                <td className="py-4 px-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleOpenEdit(member)}
                                                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50/50 transition-colors cursor-pointer"
                                                            title="Edit Quota & Permissions"
                                                        >
                                                            <Sliders size={15} />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteModalMember(member)}
                                                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50/50 transition-colors cursor-pointer"
                                                            title="Revoke Seat & Delete"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* ============================================================ */}
            {/* ➕ Modal: Add Sub-Recruiter & Split Quotas                    */}
            {/* ============================================================ */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-0">
                                    Allot Sub-Recruiter Seat & Quotas
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5 mb-0">
                                    Remaining Seats: <span className="font-bold text-blue-600">{stats.remaining_seats} of {stats.sub_recruiter_limit}</span>
                                </p>
                            </div>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Modal Body / Form */}
                        <form onSubmit={handleCreateSubRecruiter} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                            {/* Section 1: Personal Credentials */}
                            <div>
                                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">
                                    1. Sub-Recruiter Credentials
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">First Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.first_name}
                                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                            placeholder="e.g. John"
                                            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Last Name</label>
                                        <input
                                            type="text"
                                            value={formData.last_name}
                                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                            placeholder="e.g. Doe"
                                            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Work Email *</label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="john.doe@company.com"
                                            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="e.g. 9876543210"
                                            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Login Password *</label>
                                        <input
                                            type="password"
                                            required
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            placeholder="Minimum 6 characters"
                                            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
                                        <input
                                            type="text"
                                            value={formData.designation}
                                            onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                            placeholder="e.g. Technical Recruiter"
                                            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Role Template Preset */}
                            <div>
                                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">
                                    2. Role Preset Template
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {ROLE_PRESETS.map((preset) => {
                                        const isSelected = formData.role_preset === preset.id;
                                        return (
                                            <div
                                                key={preset.id}
                                                onClick={() => handleRolePresetSelect(preset.id)}
                                                className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${isSelected
                                                    ? 'border-blue-600 bg-blue-50/40 shadow-xs'
                                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-bold text-slate-900">{preset.title}</span>
                                                    {isSelected && <Check size={16} className="text-blue-600" />}
                                                </div>
                                                <p className="text-[11px] text-slate-500 leading-relaxed mb-0">
                                                    {preset.desc}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Section 3: Split Quotas (Job Posts, Resume Views, Downloads) */}
                            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div>
                                        <h4 className="text-xs font-bold uppercase text-slate-800 tracking-wider mb-0.5">
                                            3. Quota Splitting & Allocation
                                        </h4>
                                        <p className="text-xs text-slate-500 mb-0">
                                            Assign dedicated allowances from company pool or let them draw from shared pool.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                                        <button
                                            type="button"
                                            onClick={() => handleQuotaModeToggle('split')}
                                            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${formData.permissions.quota_mode === 'split'
                                                ? 'bg-[#0A66C2] text-white shadow-2xs'
                                                : 'text-slate-600 hover:bg-slate-100'
                                                }`}
                                        >
                                            Dedicated Split
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleQuotaModeToggle('shared')}
                                            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${formData.permissions.quota_mode === 'shared'
                                                ? 'bg-[#0A66C2] text-white shadow-2xs'
                                                : 'text-slate-600 hover:bg-slate-100'
                                                }`}
                                        >
                                            Shared Pool
                                        </button>
                                    </div>
                                </div>

                                {formData.permissions.quota_mode === 'split' ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                                        {/* Job Posts Limit */}
                                        <div className={`p-3 rounded-xl border ${(stats.pool?.job_posts?.available_to_allocate ?? stats.pool?.job_posts?.unallocated ?? 0) <= 0 ? 'bg-amber-50/50 border-amber-200' : 'bg-white border-slate-200'}`}>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-xs font-bold text-slate-700">Job Posts Limit</span>
                                                <span className={`text-[10px] font-semibold ${(stats.pool?.job_posts?.available_to_allocate ?? stats.pool?.job_posts?.unallocated ?? 0) <= 0 ? 'text-amber-700 font-bold' : 'text-slate-400'}`}>
                                                    {(stats.pool?.job_posts?.available_to_allocate ?? stats.pool?.job_posts?.unallocated ?? 0) <= 0 ? 'Quota Full (0 Avail)' : `Avail: ${stats.pool?.job_posts?.available_to_allocate ?? stats.pool?.job_posts?.unallocated ?? 0}`}
                                                </span>
                                            </div>
                                            <input
                                                type="number"
                                                min={0}
                                                max={stats.pool?.job_posts?.available_to_allocate ?? stats.pool?.job_posts?.unallocated ?? 0}
                                                value={formData.permissions.allocated_job_posts}
                                                onChange={(e) => handleQuotaNumberChange('allocated_job_posts', e.target.value)}
                                                disabled={(stats.pool?.job_posts?.available_to_allocate ?? stats.pool?.job_posts?.unallocated ?? 0) <= 0}
                                                className={`w-full px-2.5 py-1.5 text-sm font-bold border rounded-lg outline-none transition-all ${(stats.pool?.job_posts?.available_to_allocate ?? stats.pool?.job_posts?.unallocated ?? 0) <= 0 ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-900 border-slate-200 focus:border-blue-500'}`}
                                            />
                                            <span className="text-[10px] text-slate-400 mt-1 block">
                                                {(stats.pool?.job_posts?.available_to_allocate ?? stats.pool?.job_posts?.unallocated ?? 0) <= 0
                                                    ? `Plan limit reached (${stats.pool?.job_posts?.used || 0}/${stats.pool?.job_posts?.total || 5} used). Upgrade plan to allocate jobs.`
                                                    : 'Max jobs this recruiter can publish'}
                                            </span>
                                        </div>

                                        {/* Resume Views Limit */}
                                        {(() => {
                                            const viewsAvail = stats.pool?.resume_views?.available_to_allocate ?? stats.pool?.resume_views?.unallocated ?? 0;
                                            const isViewsFull = viewsAvail <= 0;
                                            return (
                                                <div className={`p-3 rounded-xl border ${isViewsFull ? 'bg-amber-50/50 border-amber-200' : 'bg-white border-slate-200'}`}>
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-xs font-bold text-slate-700">Resume Views</span>
                                                        <span className={`text-[10px] font-semibold ${isViewsFull ? 'text-amber-700 font-bold' : 'text-slate-400'}`}>
                                                            {isViewsFull ? 'Quota Full (0 Avail)' : `Avail: ${viewsAvail}`}
                                                        </span>
                                                    </div>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={viewsAvail}
                                                        value={formData.permissions.allocated_resume_views}
                                                        onChange={(e) => handleQuotaNumberChange('allocated_resume_views', e.target.value)}
                                                        disabled={isViewsFull}
                                                        className={`w-full px-2.5 py-1.5 text-sm font-bold border rounded-lg outline-none transition-all ${isViewsFull ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-900 border-slate-200 focus:border-blue-500'}`}
                                                    />
                                                    <span className="text-[10px] text-slate-400 mt-1 block">
                                                        {isViewsFull
                                                            ? `Plan limit reached (${stats.pool?.resume_views?.used || 0}/${stats.pool?.resume_views?.total || 50} used). Upgrade plan to allocate views.`
                                                            : 'Candidate profiles they can unlock'}
                                                    </span>
                                                </div>
                                            );
                                        })()}

                                        {/* Downloads Limit */}
                                        {(() => {
                                            const downloadsAvail = stats.pool?.resume_downloads?.available_to_allocate ?? stats.pool?.resume_downloads?.unallocated ?? 0;
                                            const isDownloadsFull = downloadsAvail <= 0;
                                            return (
                                                <div className={`p-3 rounded-xl border ${isDownloadsFull ? 'bg-amber-50/50 border-amber-200' : 'bg-white border-slate-200'}`}>
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-xs font-bold text-slate-700">CV Downloads</span>
                                                        <span className={`text-[10px] font-semibold ${isDownloadsFull ? 'text-amber-700 font-bold' : 'text-slate-400'}`}>
                                                            {isDownloadsFull ? 'Quota Full (0 Avail)' : `Avail: ${downloadsAvail}`}
                                                        </span>
                                                    </div>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={downloadsAvail}
                                                        value={formData.permissions.allocated_resume_downloads}
                                                        onChange={(e) => handleQuotaNumberChange('allocated_resume_downloads', e.target.value)}
                                                        disabled={isDownloadsFull}
                                                        className={`w-full px-2.5 py-1.5 text-sm font-bold border rounded-lg outline-none transition-all ${isDownloadsFull ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-900 border-slate-200 focus:border-blue-500'}`}
                                                    />
                                                    <span className="text-[10px] text-slate-400 mt-1 block">
                                                        {isDownloadsFull
                                                            ? `Plan limit reached (${stats.pool?.resume_downloads?.used || 0}/${stats.pool?.resume_downloads?.total || 10} used). Upgrade plan to allocate downloads.`
                                                            : 'Resumes they can download to disk'}
                                                    </span>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                ) : (
                                    <div className="p-3 bg-blue-50/60 border-1 border-blue-100 rounded-xl text-xs text-blue-900">
                                        ℹ️ In <strong>Shared Pool</strong> mode, this sub-recruiter draws directly from your company subscription pool without individual caps until the company plan limits are consumed.
                                    </div>
                                )}
                            </div>

                            {/* Section 4: Granular Permissions Checklist */}
                            <div>
                                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                                    4. Operational Permissions
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                    {[
                                        { key: 'can_post_jobs', label: 'Post and publish job openings' },
                                        { key: 'can_view_resumes', label: 'View candidate search profiles' },
                                        { key: 'can_download_resumes', label: 'Download candidate resumes' },
                                        { key: 'can_contact_candidates', label: 'Send direct emails / contact candidates' },
                                        { key: 'can_manage_applications', label: 'Review and manage applicant pipeline' },
                                        { key: 'can_edit_company_profile', label: 'Modify company branding and profile' }
                                    ].map((perm) => (
                                        <label
                                            key={perm.key}
                                            className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-200/80 hover:bg-slate-50 cursor-pointer select-none transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={Boolean(formData.permissions[perm.key])}
                                                onChange={() => handlePermissionToggle(perm.key)}
                                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="font-semibold text-slate-700">{perm.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Submit & Cancel */}
                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2.5 bg-[#0A66C2] hover:bg-[#084e96] text-white text-sm font-medium rounded-xl transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                                >
                                    {submitting && <RefreshCw size={14} className="animate-spin" />}
                                    <span>Create Sub-Recruiter Account</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* ✏️ Modal: Edit Permissions & Rebalance Quota                   */}
            {/* ============================================================ */}
            {editingMember && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-0">
                                    Edit Permissions & Quotas
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5 mb-0">
                                    {editingMember.full_name} ({editingMember.email})
                                </p>
                            </div>
                            <button
                                onClick={() => setEditingMember(null)}
                                className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
                                <input
                                    type="text"
                                    value={editingMember.designation}
                                    onChange={(e) => setEditingMember({ ...editingMember, designation: e.target.value })}
                                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                                />
                            </div>

                            {/* Quota Splitting Adjustment */}
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase text-slate-700">Split Quotas</span>
                                    <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
                                        <button
                                            type="button"
                                            onClick={() => setEditingMember({
                                                ...editingMember,
                                                permissions: { ...editingMember.permissions, quota_mode: 'split' }
                                            })}
                                            className={`px-2.5 py-1 text-xs font-medium rounded-md ${editingMember.permissions.quota_mode === 'split' ? 'bg-[#0A66C2] text-white' : 'text-slate-600'}`}
                                        >
                                            Split Mode
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditingMember({
                                                ...editingMember,
                                                permissions: { ...editingMember.permissions, quota_mode: 'shared' }
                                            })}
                                            className={`px-2.5 py-1 text-xs font-bold rounded-md ${editingMember.permissions.quota_mode === 'shared' ? 'bg-[#0A66C2] text-white' : 'text-slate-600'}`}
                                        >
                                            Shared
                                        </button>
                                    </div>
                                </div>

                                {editingMember.permissions.quota_mode === 'split' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="block text-[11px] font-bold text-slate-600">
                                                    Jobs (Used: {editingMember.permissions.used_job_posts})
                                                </label>
                                                {(() => {
                                                    const poolAvail = stats.pool?.job_posts?.available_to_allocate ?? stats.pool?.job_posts?.unallocated ?? 0;
                                                    const curAlloc = team.find(t => t.id === editingMember.id)?.permissions?.allocated_job_posts || 0;
                                                    const maxAlloc = poolAvail + curAlloc;
                                                    return (
                                                        <span className={`text-[10px] font-semibold ${maxAlloc <= 0 ? 'text-amber-700 font-bold' : 'text-slate-400'}`}>
                                                            {maxAlloc <= 0 ? 'Pool Full (0)' : `Max: ${maxAlloc}`}
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                            <input
                                                type="number"
                                                min={editingMember.permissions.used_job_posts || 0}
                                                max={(() => {
                                                    const poolAvail = stats.pool?.job_posts?.available_to_allocate ?? stats.pool?.job_posts?.unallocated ?? 0;
                                                    const curAlloc = team.find(t => t.id === editingMember.id)?.permissions?.allocated_job_posts || 0;
                                                    return poolAvail + curAlloc;
                                                })()}
                                                value={editingMember.permissions.allocated_job_posts}
                                                onChange={(e) => setEditingMember({
                                                    ...editingMember,
                                                    permissions: {
                                                        ...editingMember.permissions,
                                                        allocated_job_posts: Math.max(0, parseInt(e.target.value) || 0)
                                                    }
                                                })}
                                                className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                                            />
                                            {(() => {
                                                const poolAvail = stats.pool?.job_posts?.available_to_allocate ?? stats.pool?.job_posts?.unallocated ?? 0;
                                                const curAlloc = team.find(t => t.id === editingMember.id)?.permissions?.allocated_job_posts || 0;
                                                if (poolAvail + curAlloc <= 0) {
                                                    return <span className="text-[10px] text-amber-700 font-semibold block mt-0.5">Plan limit full ({stats.pool?.job_posts?.used || 0}/{stats.pool?.job_posts?.total || 5} used)</span>;
                                                }
                                                return null;
                                            })()}
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="block text-[11px] font-bold text-slate-600">
                                                    Views (Used: {editingMember.permissions.used_resume_views})
                                                </label>
                                                {(() => {
                                                    const poolAvail = stats.pool?.resume_views?.available_to_allocate ?? stats.pool?.resume_views?.unallocated ?? 0;
                                                    const curAlloc = team.find(t => t.id === editingMember.id)?.permissions?.allocated_resume_views || 0;
                                                    const maxAlloc = poolAvail + curAlloc;
                                                    return (
                                                        <span className={`text-[10px] font-semibold ${maxAlloc <= 0 ? 'text-amber-700 font-bold' : 'text-slate-400'}`}>
                                                            {maxAlloc <= 0 ? 'Pool Full (0)' : `Max: ${maxAlloc}`}
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                            <input
                                                type="number"
                                                min={editingMember.permissions.used_resume_views || 0}
                                                max={(() => {
                                                    const poolAvail = stats.pool?.resume_views?.available_to_allocate ?? stats.pool?.resume_views?.unallocated ?? 0;
                                                    const curAlloc = team.find(t => t.id === editingMember.id)?.permissions?.allocated_resume_views || 0;
                                                    return poolAvail + curAlloc;
                                                })()}
                                                value={editingMember.permissions.allocated_resume_views}
                                                onChange={(e) => {
                                                    const poolAvail = stats.pool?.resume_views?.available_to_allocate ?? stats.pool?.resume_views?.unallocated ?? 0;
                                                    const curAlloc = team.find(t => t.id === editingMember.id)?.permissions?.allocated_resume_views || 0;
                                                    const maxAlloc = poolAvail + curAlloc;
                                                    const val = Math.min(maxAlloc, Math.max(0, parseInt(e.target.value) || 0));
                                                    setEditingMember({
                                                        ...editingMember,
                                                        permissions: {
                                                            ...editingMember.permissions,
                                                            allocated_resume_views: val
                                                        }
                                                    });
                                                }}
                                                className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="block text-[11px] font-bold text-slate-600">
                                                    Downloads (Used: {editingMember.permissions.used_resume_downloads})
                                                </label>
                                                {(() => {
                                                    const poolAvail = stats.pool?.resume_downloads?.available_to_allocate ?? stats.pool?.resume_downloads?.unallocated ?? 0;
                                                    const curAlloc = team.find(t => t.id === editingMember.id)?.permissions?.allocated_resume_downloads || 0;
                                                    const maxAlloc = poolAvail + curAlloc;
                                                    return (
                                                        <span className={`text-[10px] font-semibold ${maxAlloc <= 0 ? 'text-amber-700 font-bold' : 'text-slate-400'}`}>
                                                            {maxAlloc <= 0 ? 'Pool Full (0)' : `Max: ${maxAlloc}`}
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                            <input
                                                type="number"
                                                min={editingMember.permissions.used_resume_downloads || 0}
                                                max={(() => {
                                                    const poolAvail = stats.pool?.resume_downloads?.available_to_allocate ?? stats.pool?.resume_downloads?.unallocated ?? 0;
                                                    const curAlloc = team.find(t => t.id === editingMember.id)?.permissions?.allocated_resume_downloads || 0;
                                                    return poolAvail + curAlloc;
                                                })()}
                                                value={editingMember.permissions.allocated_resume_downloads}
                                                onChange={(e) => {
                                                    const poolAvail = stats.pool?.resume_downloads?.available_to_allocate ?? stats.pool?.resume_downloads?.unallocated ?? 0;
                                                    const curAlloc = team.find(t => t.id === editingMember.id)?.permissions?.allocated_resume_downloads || 0;
                                                    const maxAlloc = poolAvail + curAlloc;
                                                    const val = Math.min(maxAlloc, Math.max(0, parseInt(e.target.value) || 0));
                                                    setEditingMember({
                                                        ...editingMember,
                                                        permissions: {
                                                            ...editingMember.permissions,
                                                            allocated_resume_downloads: val
                                                        }
                                                    });
                                                }}
                                                className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Permissions */}
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Access Rights</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                    {[
                                        { key: 'can_post_jobs', label: 'Post Jobs' },
                                        { key: 'can_view_resumes', label: 'View Candidate Profiles' },
                                        { key: 'can_download_resumes', label: 'Download Resumes' },
                                        { key: 'can_contact_candidates', label: 'Contact Candidates' },
                                        { key: 'can_manage_applications', label: 'Manage Applications' },
                                        { key: 'can_edit_company_profile', label: 'Edit Profile' }
                                    ].map((perm) => (
                                        <label
                                            key={perm.key}
                                            className="flex items-center gap-2 p-2 rounded-xl border border-slate-200/80 hover:bg-slate-50 cursor-pointer select-none"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={Boolean(editingMember.permissions[perm.key])}
                                                onChange={() => setEditingMember({
                                                    ...editingMember,
                                                    permissions: {
                                                        ...editingMember.permissions,
                                                        [perm.key]: !editingMember.permissions[perm.key]
                                                    }
                                                })}
                                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="font-semibold text-slate-700">{perm.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setEditingMember(null)}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={submitting}
                                    onClick={handleSavePermissions}
                                    className="px-4 py-2.5 bg-[#0A66C2] hover:bg-[#084e96] text-white text-sm font-medium rounded-xl transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                                >
                                    {submitting && <RefreshCw size={14} className="animate-spin" />}
                                    <span>Save Changes</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* 🗑️ Modal: Revoke Seat Confirmation                           */}
            {/* ============================================================ */}
            {deleteModalMember && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 p-6 shadow-2xl text-center">
                        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
                            <Trash2 size={22} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-0">
                            Revoke Seat & Delete Account?
                        </h3>
                        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                            Are you sure you want to remove <strong>{deleteModalMember.full_name}</strong>? Their login will be deactivated, their allocated quota will be returned to your company pool, and 1 seat will be freed up.
                        </p>
                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={() => setDeleteModalMember(null)}
                                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteMember}
                                disabled={submitting}
                                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                            >
                                {submitting && <RefreshCw size={14} className="animate-spin" />}
                                <span>Yes, Revoke Seat</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
