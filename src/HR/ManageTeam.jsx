'use client';
import React, { useState, useEffect } from 'react';
import {
    Users, UserPlus, Shield, Check, X, Mail, Lock,
    Trash2, CheckCircle2, Search, RefreshCw,
    Sliders, Eye, Download, Sparkles,
    Briefcase, AlertTriangle, Crown, ArrowRight,
    ShieldCheck, UserCheck, Layers, FileSpreadsheet
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
import AdminSelect from '../Common/AdminSelect';

// Role presets definition
const ROLE_PRESETS = [
    {
        id: 'team_admin',
        title: 'Team Admin',
        tag: 'Full Access',
        badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
        desc: 'Full operational access. Can post jobs, manage pipeline, email candidates, export Excel, and edit profile.',
        icon: ShieldCheck,
        permissions: {
            can_post_jobs: true,
            can_view_resumes: true,
            can_download_resumes: true,
            can_contact_candidates: true,
            can_export_excel: true,
            can_manage_applications: true,
            can_edit_company_profile: true
        }
    },
    {
        id: 'recruiter',
        title: 'Standard Recruiter',
        tag: 'Core Hiring',
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        desc: 'Primary hiring role. Can publish vacancies, review applicants, download CVs, contact candidates, and export Excel.',
        icon: Briefcase,
        permissions: {
            can_post_jobs: true,
            can_view_resumes: true,
            can_download_resumes: true,
            can_contact_candidates: true,
            can_export_excel: true,
            can_manage_applications: true,
            can_edit_company_profile: false
        }
    },
    {
        id: 'sourcer',
        title: 'Sourcer / Reviewer',
        tag: 'Talent Sourcing',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        desc: 'Candidate search and review only. Can search and review candidate profiles without job posting.',
        icon: UserCheck,
        permissions: {
            can_post_jobs: false,
            can_view_resumes: true,
            can_download_resumes: true,
            can_contact_candidates: true,
            can_export_excel: false,
            can_manage_applications: true,
            can_edit_company_profile: false
        }
    }
];

const ALL_ROLE_PRESET_CARDS = [
    ...ROLE_PRESETS,
    {
        id: 'custom',
        title: 'Custom Access',
        tag: 'Granular',
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
        desc: 'Manually select granular feature permissions and quota splits.',
        icon: Sliders
    }
];

const PERMISSION_FIELDS = [
    {
        key: 'can_post_jobs',
        label: 'Publish & Manage Jobs',
        desc: 'Post new vacancies and manage live listings',
        icon: Briefcase
    },
    {
        key: 'can_view_resumes',
        label: 'View Candidate Resumes',
        desc: 'Search candidates and inspect profile details',
        icon: Eye
    },
    {
        key: 'can_download_resumes',
        label: 'Download Resumes / CVs',
        desc: 'Export candidate resume and CV files',
        icon: Download
    },
    {
        key: 'can_contact_candidates',
        label: 'Candidate Direct Messaging & Mail',
        desc: 'Send outreach emails and contact candidates directly',
        icon: Mail
    },
    {
        key: 'can_export_excel',
        label: 'Export Candidate Data to Excel',
        desc: 'Export candidate lists and applicant spreadsheets to Excel / CSV',
        icon: FileSpreadsheet
    },
    {
        key: 'can_manage_applications',
        label: 'Shortlist & Reject Candidates',
        desc: 'Review applicants and update pipeline stage',
        icon: CheckCircle2
    },
    {
        key: 'can_edit_company_profile',
        label: 'Edit Company Profile',
        desc: 'Modify employer branding and profile settings',
        icon: Shield
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
            resume_downloads: { total: 0, used: 0, remaining_pool: 0, allocated_to_team: 0, unallocated: 0 },
            emails: { total: 0, used: 0, remaining_pool: 0, allocated_to_team: 0, unallocated: 0 },
            excel_downloads: { total: 0, used: 0, remaining_pool: 0, allocated_to_team: 0, unallocated: 0 }
        }
    });

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [deleteModalMember, setDeleteModalMember] = useState(null);
    const [statusModalMember, setStatusModalMember] = useState(null);

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
            quota_mode: 'shared',
            allocated_job_posts: 0,
            allocated_resume_views: 0,
            allocated_resume_downloads: 0,
            allocated_emails: 0,
            allocated_excel_downloads: 0
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
                const isOnlyJobPost = /only job post/i.test(subRes.value.data.plan_name || '') ||
                    /only job post/i.test(subRes.value.data.plan?.name || '') ||
                    (Number(subRes.value.data.limits?.resume_view_limit || 0) === 0 && Number(subRes.value.data.limits?.resume_download_limit || 0) === 0 && Number(subRes.value.data.limits?.email_limit || 0) === 0 && Number(subRes.value.data.limits?.whatsapp_limit || 0) === 0 && Number(subRes.value.data.limits?.excel_download_limit || 0) === 0);

                isCustom = Boolean(
                    (subRes.value.data.is_custom ||
                        subRes.value.data.plan?.plan_type === 'custom' ||
                        subRes.value.data.plan?.plan_type === 'Custom' ||
                        subRes.value.data.plan?.slug?.startsWith('custom') ||
                        subRes.value.data.plan_slug?.startsWith('custom') ||
                        subRes.value.data.plan_name?.toLowerCase().includes('custom')) &&
                    !isOnlyJobPost
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
        if (presetId === 'custom') {
            setFormData(prev => ({
                ...prev,
                role_preset: 'custom'
            }));
            return;
        }
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
        setFormData(prev => {
            const nextPerms = {
                ...prev.permissions,
                [key]: !prev.permissions[key]
            };
            const matched = ROLE_PRESETS.find(p =>
                Boolean(p.permissions.can_post_jobs) === Boolean(nextPerms.can_post_jobs) &&
                Boolean(p.permissions.can_view_resumes) === Boolean(nextPerms.can_view_resumes) &&
                Boolean(p.permissions.can_download_resumes) === Boolean(nextPerms.can_download_resumes) &&
                Boolean(p.permissions.can_contact_candidates) === Boolean(nextPerms.can_contact_candidates) &&
                Boolean(p.permissions.can_manage_applications) === Boolean(nextPerms.can_manage_applications) &&
                Boolean(p.permissions.can_edit_company_profile) === Boolean(nextPerms.can_edit_company_profile) &&
                Boolean(p.permissions.can_export_excel) === Boolean(nextPerms.can_export_excel)
            );
            return {
                ...prev,
                role_preset: matched ? matched.id : 'custom',
                permissions: nextPerms
            };
        });
    };

    const handleEditRolePresetSelect = (presetId) => {
        if (presetId === 'custom') {
            setEditingMember(prev => ({
                ...prev,
                role_preset: 'custom'
            }));
            return;
        }
        const selected = ROLE_PRESETS.find(r => r.id === presetId);
        if (selected && editingMember) {
            setEditingMember(prev => ({
                ...prev,
                role_preset: presetId,
                permissions: {
                    ...prev.permissions,
                    ...selected.permissions
                }
            }));
        }
    };

    const handleEditPermissionToggle = (key) => {
        setEditingMember(prev => {
            if (!prev) return prev;
            const nextPerms = {
                ...prev.permissions,
                [key]: !prev.permissions?.[key]
            };
            const matched = ROLE_PRESETS.find(p =>
                Boolean(p.permissions.can_post_jobs) === Boolean(nextPerms.can_post_jobs) &&
                Boolean(p.permissions.can_view_resumes) === Boolean(nextPerms.can_view_resumes) &&
                Boolean(p.permissions.can_download_resumes) === Boolean(nextPerms.can_download_resumes) &&
                Boolean(p.permissions.can_contact_candidates) === Boolean(nextPerms.can_contact_candidates) &&
                Boolean(p.permissions.can_manage_applications) === Boolean(nextPerms.can_manage_applications) &&
                Boolean(p.permissions.can_edit_company_profile) === Boolean(nextPerms.can_edit_company_profile) &&
                Boolean(p.permissions.can_export_excel) === Boolean(nextPerms.can_export_excel)
            );
            return {
                ...prev,
                role_preset: matched ? matched.id : 'custom',
                permissions: nextPerms
            };
        });
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
        } else if (field === 'allocated_emails') {
            const max = stats.pool?.emails?.available_to_allocate ?? stats.pool?.emails?.unallocated ?? 0;
            num = Math.min(num, max);
        } else if (field === 'allocated_excel_downloads') {
            const max = stats.pool?.excel_downloads?.available_to_allocate ?? stats.pool?.excel_downloads?.unallocated ?? 0;
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

            // Restrict allocating emails if pool is exhausted or exceeded
            if (formData.permissions.allocated_emails > 0) {
                const avail = stats.pool?.emails?.available_to_allocate ?? stats.pool?.emails?.unallocated ?? 0;
                if (avail <= 0) {
                    toast.error(`Cannot allocate emails: Company plan candidate mail quota is completely exhausted. Upgrade plan to allocate emails.`);
                    return;
                }
                if (formData.permissions.allocated_emails > avail) {
                    toast.error(`Cannot allocate ${formData.permissions.allocated_emails} emails. Only ${avail} available to allocate in your plan pool.`);
                    return;
                }
            }

            // Restrict allocating excel downloads if pool is exhausted or exceeded
            if (formData.permissions.allocated_excel_downloads > 0) {
                const avail = stats.pool?.excel_downloads?.available_to_allocate ?? stats.pool?.excel_downloads?.unallocated ?? 0;
                if (avail <= 0) {
                    toast.error(`Cannot allocate Excel exports: Company plan export quota is completely exhausted. Upgrade plan to allocate exports.`);
                    return;
                }
                if (formData.permissions.allocated_excel_downloads > avail) {
                    toast.error(`Cannot allocate ${formData.permissions.allocated_excel_downloads} Excel exports. Only ${avail} available to allocate in your plan pool.`);
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
        const perms = member.permissions || {};
        const curPerms = {
            can_post_jobs: Boolean(perms.can_post_jobs),
            can_view_resumes: Boolean(perms.can_view_resumes),
            can_download_resumes: Boolean(perms.can_download_resumes),
            can_contact_candidates: Boolean(perms.can_contact_candidates),
            can_manage_applications: Boolean(perms.can_manage_applications),
            can_edit_company_profile: Boolean(perms.can_edit_company_profile),
            can_export_excel: Boolean(perms.can_export_excel)
        };
        const matched = ROLE_PRESETS.find(p =>
            Boolean(p.permissions.can_post_jobs) === curPerms.can_post_jobs &&
            Boolean(p.permissions.can_view_resumes) === curPerms.can_view_resumes &&
            Boolean(p.permissions.can_download_resumes) === curPerms.can_download_resumes &&
            Boolean(p.permissions.can_contact_candidates) === curPerms.can_contact_candidates &&
            Boolean(p.permissions.can_manage_applications) === curPerms.can_manage_applications &&
            Boolean(p.permissions.can_edit_company_profile) === curPerms.can_edit_company_profile &&
            Boolean(p.permissions.can_export_excel) === curPerms.can_export_excel
        );
        setEditingMember({
            id: member.id,
            full_name: member.full_name,
            email: member.email,
            designation: member.designation || 'Recruiter',
            role_preset: matched ? matched.id : (member.role_preset || 'custom'),
            permissions: {
                ...curPerms,
                quota_mode: perms.quota_mode || 'shared',
                allocated_job_posts: perms.allocated_job_posts ?? 0,
                allocated_resume_views: perms.allocated_resume_views ?? 0,
                allocated_resume_downloads: perms.allocated_resume_downloads ?? 0,
                allocated_emails: perms.allocated_emails ?? 0,
                allocated_excel_downloads: perms.allocated_excel_downloads ?? 0,
                used_job_posts: perms.used_job_posts || 0,
                used_resume_views: perms.used_resume_views || 0,
                used_resume_downloads: perms.used_resume_downloads || 0,
                used_emails: perms.used_emails || 0,
                used_excel_downloads: perms.used_excel_downloads || 0
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

            // Restrict allocating emails if exceeding available capacity
            if (editingMember.permissions.allocated_emails !== undefined) {
                const poolAvail = stats.pool?.emails?.available_to_allocate ?? stats.pool?.emails?.unallocated ?? 0;
                const currentSub = team.find(t => t.id === editingMember.id);
                const currentAllocated = currentSub?.permissions?.allocated_emails || 0;
                const maxAllowed = poolAvail + currentAllocated;

                if (editingMember.permissions.allocated_emails > maxAllowed) {
                    toast.error(`Cannot allocate ${editingMember.permissions.allocated_emails} emails. Only ${maxAllowed} emails are available in your plan pool.`);
                    return;
                }
            }

            // Restrict allocating excel downloads if exceeding available capacity
            if (editingMember.permissions.allocated_excel_downloads !== undefined) {
                const poolAvail = stats.pool?.excel_downloads?.available_to_allocate ?? stats.pool?.excel_downloads?.unallocated ?? 0;
                const currentSub = team.find(t => t.id === editingMember.id);
                const currentAllocated = currentSub?.permissions?.allocated_excel_downloads || 0;
                const maxAllowed = poolAvail + currentAllocated;

                if (editingMember.permissions.allocated_excel_downloads > maxAllowed) {
                    toast.error(`Cannot allocate ${editingMember.permissions.allocated_excel_downloads} Excel exports. Only ${maxAllowed} Excel exports are available in your plan pool.`);
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

    const handleToggleStatus = (member) => {
        setStatusModalMember(member);
    };

    const confirmToggleStatus = async () => {
        if (!statusModalMember) return;
        const nextStatus = statusModalMember.status === 'active' ? 'suspended' : 'active';
        const actionLabel = nextStatus === 'active' ? 'activate' : 'suspend';
        try {
            setSubmitting(true);
            const res = await toggleSubRecruiterStatus(statusModalMember.id, nextStatus);
            if (res?.data?.success) {
                toast.success(`Sub-recruiter account ${nextStatus === 'active' ? 'activated' : 'suspended'}.`);
                setStatusModalMember(null);
                loadTeamData();
            }
        } catch (err) {
            console.error(err);
            toast.error(err?.response?.data?.message || `Failed to ${actionLabel} sub-recruiter.`);
        } finally {
            setSubmitting(false);
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
                                Your recruiter account is currently on the <span className="text-slate-900 font-bold">{planTitle} Plan</span>, which is configured exclusively for <span className="text-[#0A66C2]">Job Posting</span>. Adding sub-recruiter team seats, delegating hiring workflows, and splitting resume/job quotas require a <span className="text-purple-700">Custom Plan</span> assigned by the Super Admin.
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
                                    onClick={() => router.push('/billing')}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-3.5">
                    {/* Card 1: Seats Allocation */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-slate-600">Allotted Seats</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isSeatFull ? 'bg-amber-50 text-amber-700 border-1 border-amber-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                                    {stats.plan_name}
                                </span>
                            </div>
                            <div className="flex items-baseline gap-1.5 mb-2">
                                <span className="text-2xl font-bold text-slate-900">{stats.total_members}</span>
                                <span className="text-xs font-semibold text-slate-400">/ {stats.sub_recruiter_limit} Seats</span>
                            </div>
                        </div>
                        <div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${isSeatFull ? 'bg-amber-500' : 'bg-[#0A66C2]'}`}
                                    style={{ width: `${Math.min(100, Math.round((stats.total_members / Math.max(1, stats.sub_recruiter_limit)) * 100))}%` }}
                                />
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-500 font-medium">{stats.remaining_seats} remaining</span>
                                <span className="text-slate-400">{stats.active_members} active</span>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Job Posts Pool */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-slate-600">Job Posts</span>
                                <div className="w-6 h-6 rounded-lg bg-blue-50 text-[#0A66C2] flex items-center justify-center">
                                    <Briefcase size={13} />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-1.5 mb-2">
                                <span className="text-2xl font-bold text-slate-900">{stats.pool?.job_posts?.used || 0}</span>
                                <span className="text-xs font-semibold text-slate-400">/ {stats.pool?.job_posts?.total || 0} Total</span>
                            </div>
                        </div>
                        <div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-blue-500 transition-all duration-500"
                                    style={{ width: `${Math.min(100, Math.round(((stats.pool?.job_posts?.used || 0) / Math.max(1, stats.pool?.job_posts?.total || 1)) * 100))}%` }}
                                />
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                                <span className="text-blue-700 font-medium">{stats.pool?.job_posts?.allocated_to_team || 0} to team</span>
                                <span className="text-slate-400">{stats.pool?.job_posts?.unallocated || 0} free</span>
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Resume Views Pool */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-slate-600">Resume Views</span>
                                <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                    <Eye size={13} />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-1.5 mb-2">
                                <span className="text-2xl font-bold text-slate-900">{stats.pool?.resume_views?.used || 0}</span>
                                <span className="text-xs font-semibold text-slate-400">/ {stats.pool?.resume_views?.total || 0} Total</span>
                            </div>
                        </div>
                        <div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                                    style={{ width: `${Math.min(100, Math.round(((stats.pool?.resume_views?.used || 0) / Math.max(1, stats.pool?.resume_views?.total || 1)) * 100))}%` }}
                                />
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                                <span className="text-indigo-700 font-medium">{stats.pool?.resume_views?.allocated_to_team || 0} to team</span>
                                <span className="text-slate-400">{stats.pool?.resume_views?.unallocated || 0} free</span>
                            </div>
                        </div>
                    </div>

                    {/* Card 4: Resume Downloads Pool */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-slate-600">Downloads</span>
                                <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                                    <Download size={13} />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-1.5 mb-2">
                                <span className="text-2xl font-bold text-slate-900">{stats.pool?.resume_downloads?.used || 0}</span>
                                <span className="text-xs font-semibold text-slate-400">/ {stats.pool?.resume_downloads?.total || 0} Total</span>
                            </div>
                        </div>
                        <div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-purple-500 transition-all duration-500"
                                    style={{ width: `${Math.min(100, Math.round(((stats.pool?.resume_downloads?.used || 0) / Math.max(1, stats.pool?.resume_downloads?.total || 1)) * 100))}%` }}
                                />
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                                <span className="text-purple-700 font-medium">{stats.pool?.resume_downloads?.allocated_to_team || 0} to team</span>
                                <span className="text-slate-400">{stats.pool?.resume_downloads?.unallocated || 0} free</span>
                            </div>
                        </div>
                    </div>

                    {/* Card 5: Mail / Email Pool */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-slate-600">Mail Outreach</span>
                                <div className="w-6 h-6 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                                    <Mail size={13} />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-1.5 mb-2">
                                <span className="text-2xl font-bold text-slate-900">{stats.pool?.emails?.used || 0}</span>
                                <span className="text-xs font-semibold text-slate-400">/ {stats.pool?.emails?.total || 0} Total</span>
                            </div>
                        </div>
                        <div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-sky-500 transition-all duration-500"
                                    style={{ width: `${Math.min(100, Math.round(((stats.pool?.emails?.used || 0) / Math.max(1, stats.pool?.emails?.total || 1)) * 100))}%` }}
                                />
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                                <span className="text-sky-700 font-medium">{stats.pool?.emails?.allocated_to_team || 0} to team</span>
                                <span className="text-slate-400">{stats.pool?.emails?.unallocated || 0} free</span>
                            </div>
                        </div>
                    </div>

                    {/* Card 6: Excel Candidate Exports Pool */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-slate-600">Excel Exports</span>
                                <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                    <FileSpreadsheet size={13} />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-1.5 mb-2">
                                <span className="text-2xl font-bold text-slate-900">{stats.pool?.excel_downloads?.used || 0}</span>
                                <span className="text-xs font-semibold text-slate-400">/ {stats.pool?.excel_downloads?.total || 0} Total</span>
                            </div>
                        </div>
                        <div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                    style={{ width: `${Math.min(100, Math.round(((stats.pool?.excel_downloads?.used || 0) / Math.max(1, stats.pool?.excel_downloads?.total || 1)) * 100))}%` }}
                                />
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                                <span className="text-emerald-700 font-medium">{stats.pool?.excel_downloads?.allocated_to_team || 0} to team</span>
                                <span className="text-slate-400">{stats.pool?.excel_downloads?.unallocated || 0} free</span>
                            </div>
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
                <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 relative z-30">
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

                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Role Filter */}
                        <AdminSelect
                            value={roleFilter}
                            onChange={(val) => setRoleFilter(val)}
                            options={[
                                { value: 'all', label: 'All Roles' },
                                { value: 'team_admin', label: 'Team Admin', subLabel: 'Full Access' },
                                { value: 'recruiter', label: 'Standard Recruiter', subLabel: 'Core Hiring' },
                                { value: 'sourcer', label: 'Sourcer / Reviewer', subLabel: 'Talent Sourcing' },
                                { value: 'custom', label: 'Custom Access', subLabel: 'Granular Privileges' }
                            ]}
                            placeholder="All Roles"
                            size="sm"
                        />

                        {/* Status Filter */}
                        <AdminSelect
                            value={statusFilter}
                            onChange={(val) => setStatusFilter(val)}
                            options={[
                                { value: 'all', label: 'All Status' },
                                { value: 'active', label: 'Active Only' },
                                { value: 'suspended', label: 'Suspended Only' }
                            ]}
                            placeholder="All Status"
                            size="sm"
                            align="right"
                        />

                        {(roleFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery('');
                                    setRoleFilter('all');
                                    setStatusFilter('all');
                                }}
                                className="px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </div>

                {/* Team Members List / Table */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                                    <th className="py-3.5 px-4 text-left min-w-[220px]">Sub-Recruiter</th>
                                    <th className="py-3.5 px-3 text-left w-[140px] whitespace-nowrap">Role & Title</th>
                                    <th className="py-3.5 px-3 text-left w-[220px] whitespace-nowrap">Access Privileges</th>
                                    <th className="py-3.5 px-2 text-center w-[76px] whitespace-nowrap">
                                        <div className="flex items-center justify-center gap-1"><Briefcase size={11} className="text-blue-500" /> Jobs</div>
                                    </th>
                                    <th className="py-3.5 px-2 text-center w-[76px] whitespace-nowrap">
                                        <div className="flex items-center justify-center gap-1"><Eye size={11} className="text-indigo-500" /> Views</div>
                                    </th>
                                    <th className="py-3.5 px-2 text-center w-[76px] whitespace-nowrap">
                                        <div className="flex items-center justify-center gap-1"><Download size={11} className="text-purple-500" /> CVs</div>
                                    </th>
                                    <th className="py-3.5 px-2 text-center w-[76px] whitespace-nowrap">
                                        <div className="flex items-center justify-center gap-1"><Mail size={11} className="text-sky-500" /> Mail</div>
                                    </th>
                                    <th className="py-3.5 px-2 text-center w-[76px] whitespace-nowrap">
                                        <div className="flex items-center justify-center gap-1"><FileSpreadsheet size={11} className="text-emerald-500" /> Excel</div>
                                    </th>
                                    <th className="py-3.5 px-3 text-center w-[88px] whitespace-nowrap">Status</th>
                                    <th className="py-3.5 px-4 text-right w-[80px] whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {loading ? (
                                    <tr>
                                        <td colSpan={10} className="py-12 text-center text-slate-400">
                                            <RefreshCw size={24} className="animate-spin text-blue-600 mx-auto mb-2" />
                                            <span>Loading team seats and quotas...</span>
                                        </td>
                                    </tr>
                                ) : filteredTeam.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="py-12 text-center">
                                            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0A66C2] flex items-center justify-center mx-auto mb-3">
                                                <Users size={24} />
                                            </div>
                                            <h3 className="text-base font-semibold text-slate-800 mb-1">
                                                {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
                                                    ? 'No sub-recruiters match your filters'
                                                    : 'No sub-recruiters created yet'}
                                            </h3>
                                            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                                                Create sub-recruiter seats to delegate hiring, split monthly job posts, email outreach, and assign resume download quotas.
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

                                        // Emails / Mail
                                        const emailsAllocated = member.permissions?.allocated_emails;
                                        const emailsUsed = member.permissions?.used_emails || 0;

                                        // Excel Exports
                                        const excelAllocated = member.permissions?.allocated_excel_downloads;
                                        const excelUsed = member.permissions?.used_excel_downloads || 0;

                                        return (
                                            <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                                                {/* Member Details */}
                                                <td className="py-3 px-4 align-middle min-w-[220px]">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                                            {member.first_name ? member.first_name.charAt(0).toUpperCase() : 'R'}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold text-slate-900 truncate mb-0.5" title={member.full_name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.email}>
                                                                {member.full_name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.email}
                                                            </p>
                                                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                                                <span className="truncate max-w-[150px]" title={member.email}>{member.email}</span>
                                                                {member.phone && <span className="shrink-0">• {member.phone}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Role & Designation */}
                                                <td className="py-3 px-3 align-middle w-[140px]">
                                                    <div>
                                                        <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full border mb-0.5 ${role.badgeColor}`}>
                                                            {role.title}
                                                        </span>
                                                        <p className="text-xs text-slate-500 font-medium mb-0 truncate max-w-[130px]" title={member.designation || 'Recruiter'}>
                                                            {member.designation || 'Recruiter'}
                                                        </p>
                                                    </div>
                                                </td>

                                                {/* Access Privileges Badges (Clean 3x2 Matrix) */}
                                                <td className="py-3 px-3 align-middle w-[220px]">
                                                    <div className="grid grid-cols-3 gap-1 w-[215px]">
                                                        {/* Mail */}
                                                        {member.permissions?.can_contact_candidates !== false ? (
                                                            <span className="inline-flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/80" title="Direct Email Allowed">
                                                                <Mail size={10} className="text-sky-600 shrink-0" /> Mail
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-slate-100/70 text-slate-400 border border-slate-200/60 line-through opacity-60" title="Mail Disabled">
                                                                <Mail size={10} className="shrink-0" /> Mail
                                                            </span>
                                                        )}

                                                        {/* Excel */}
                                                        {member.permissions?.can_export_excel !== false ? (
                                                            <span className="inline-flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80" title="Excel Export Allowed">
                                                                <FileSpreadsheet size={10} className="text-emerald-600 shrink-0" /> Excel
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-slate-100/70 text-slate-400 border border-slate-200/60 line-through opacity-60" title="Excel Disabled">
                                                                <FileSpreadsheet size={10} className="shrink-0" /> Excel
                                                            </span>
                                                        )}

                                                        {/* Jobs */}
                                                        {member.permissions?.can_post_jobs !== false ? (
                                                            <span className="inline-flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80" title="Job Posting Allowed">
                                                                <Briefcase size={10} className="text-blue-600 shrink-0" /> Jobs
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-slate-100/70 text-slate-400 border border-slate-200/60 line-through opacity-60" title="Job Posting Disabled">
                                                                <Briefcase size={10} className="shrink-0" /> Jobs
                                                            </span>
                                                        )}

                                                        {/* Resume Views */}
                                                        {member.permissions?.can_view_resumes !== false ? (
                                                            <span className="inline-flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80" title="Resume Views Allowed">
                                                                <Eye size={10} className="text-indigo-600 shrink-0" /> Views
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-slate-100/70 text-slate-400 border border-slate-200/60 line-through opacity-60" title="Resume Views Disabled">
                                                                <Eye size={10} className="shrink-0" /> Views
                                                            </span>
                                                        )}

                                                        {/* CV Downloads */}
                                                        {member.permissions?.can_download_resumes !== false ? (
                                                            <span className="inline-flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/80" title="Resume Downloads Allowed">
                                                                <Download size={10} className="text-purple-600 shrink-0" /> CVs
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-slate-100/70 text-slate-400 border border-slate-200/60 line-through opacity-60" title="Resume Downloads Disabled">
                                                                <Download size={10} className="shrink-0" /> CVs
                                                            </span>
                                                        )}

                                                        {/* Pipeline */}
                                                        {member.permissions?.can_manage_applications !== false ? (
                                                            <span className="inline-flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200/80" title="Application Review Allowed">
                                                                <CheckCircle2 size={10} className="text-teal-600 shrink-0" /> Pipeline
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-slate-100/70 text-slate-400 border border-slate-200/60 line-through opacity-60" title="Application Review Disabled">
                                                                <CheckCircle2 size={10} className="shrink-0" /> Pipeline
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Job Posts Quota */}
                                                <td className="py-3 px-2 text-center align-middle w-[76px] whitespace-nowrap">
                                                    {isSplit && jobsAllocated !== null ? (
                                                        <div className="inline-flex flex-col items-center">
                                                            <span className="text-xs font-semibold text-slate-800 tabular-nums">
                                                                {jobsUsed} <span className="text-slate-400 font-normal">/ {jobsAllocated}</span>
                                                            </span>
                                                            <div className="w-11 bg-slate-100 rounded-full h-1 mt-1 overflow-hidden">
                                                                <div
                                                                    className="bg-blue-600 h-full rounded-full transition-all"
                                                                    style={{ width: `${Math.min(100, Math.round((jobsUsed / Math.max(1, jobsAllocated)) * 100))}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="inline-block text-[10px] font-medium text-slate-500 bg-slate-100/80 border border-slate-200/60 px-2 py-0.5 rounded-md">
                                                            Shared
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Resume Views Quota */}
                                                <td className="py-3 px-2 text-center align-middle w-[76px] whitespace-nowrap">
                                                    {isSplit && viewsAllocated !== null ? (
                                                        <div className="inline-flex flex-col items-center">
                                                            <span className="text-xs font-semibold text-slate-800 tabular-nums">
                                                                {viewsUsed} <span className="text-slate-400 font-normal">/ {viewsAllocated}</span>
                                                            </span>
                                                            <div className="w-11 bg-slate-100 rounded-full h-1 mt-1 overflow-hidden">
                                                                <div
                                                                    className="bg-indigo-600 h-full rounded-full transition-all"
                                                                    style={{ width: `${Math.min(100, Math.round((viewsUsed / Math.max(1, viewsAllocated)) * 100))}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="inline-block text-[10px] font-medium text-slate-500 bg-slate-100/80 border border-slate-200/60 px-2 py-0.5 rounded-md">
                                                            Shared
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Resume Downloads Quota */}
                                                <td className="py-3 px-2 text-center align-middle w-[76px] whitespace-nowrap">
                                                    {isSplit && downloadsAllocated !== null ? (
                                                        <div className="inline-flex flex-col items-center">
                                                            <span className="text-xs font-semibold text-slate-800 tabular-nums">
                                                                {downloadsUsed} <span className="text-slate-400 font-normal">/ {downloadsAllocated}</span>
                                                            </span>
                                                            <div className="w-11 bg-slate-100 rounded-full h-1 mt-1 overflow-hidden">
                                                                <div
                                                                    className="bg-purple-600 h-full rounded-full transition-all"
                                                                    style={{ width: `${Math.min(100, Math.round((downloadsUsed / Math.max(1, downloadsAllocated)) * 100))}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="inline-block text-[10px] font-medium text-slate-500 bg-slate-100/80 border border-slate-200/60 px-2 py-0.5 rounded-md">
                                                            Shared
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Mail Outreach Quota */}
                                                <td className="py-3 px-2 text-center align-middle w-[76px] whitespace-nowrap">
                                                    {isSplit && emailsAllocated !== null ? (
                                                        <div className="inline-flex flex-col items-center">
                                                            <span className="text-xs font-semibold text-slate-800 tabular-nums">
                                                                {emailsUsed} <span className="text-slate-400 font-normal">/ {emailsAllocated}</span>
                                                            </span>
                                                            <div className="w-11 bg-slate-100 rounded-full h-1 mt-1 overflow-hidden">
                                                                <div
                                                                    className="bg-sky-600 h-full rounded-full transition-all"
                                                                    style={{ width: `${Math.min(100, Math.round((emailsUsed / Math.max(1, emailsAllocated)) * 100))}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="inline-block text-[10px] font-medium text-slate-500 bg-slate-100/80 border border-slate-200/60 px-2 py-0.5 rounded-md">
                                                            Shared
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Excel Export Quota */}
                                                <td className="py-3 px-2 text-center align-middle w-[76px] whitespace-nowrap">
                                                    {isSplit && excelAllocated !== null ? (
                                                        <div className="inline-flex flex-col items-center">
                                                            <span className="text-xs font-semibold text-slate-800 tabular-nums">
                                                                {excelUsed} <span className="text-slate-400 font-normal">/ {excelAllocated}</span>
                                                            </span>
                                                            <div className="w-11 bg-slate-100 rounded-full h-1 mt-1 overflow-hidden">
                                                                <div
                                                                    className="bg-emerald-600 h-full rounded-full transition-all"
                                                                    style={{ width: `${Math.min(100, Math.round((excelUsed / Math.max(1, excelAllocated)) * 100))}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="inline-block text-[10px] font-medium text-slate-500 bg-slate-100/80 border border-slate-200/60 px-2 py-0.5 rounded-md">
                                                            Shared
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Status Toggle */}
                                                <td className="py-3 px-3 text-center align-middle w-[88px] whitespace-nowrap">
                                                    <button
                                                        onClick={() => handleToggleStatus(member)}
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${member.status === 'active'
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100'
                                                            : 'bg-amber-50 text-amber-700 border border-amber-200/80 hover:bg-amber-100'
                                                            }`}
                                                        title="Click to toggle status"
                                                    >
                                                        <span className={`w-1.5 h-1.5 rounded-full ${member.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                        <span>{member.status === 'active' ? 'Active' : 'Suspended'}</span>
                                                    </button>
                                                </td>

                                                {/* Actions */}
                                                <td className="py-3 px-4 text-right align-middle w-[80px] whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            onClick={() => handleOpenEdit(member)}
                                                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50/70 transition-colors cursor-pointer"
                                                            title="Edit Quota & Permissions"
                                                        >
                                                            <Sliders size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteModalMember(member)}
                                                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50/70 transition-colors cursor-pointer"
                                                            title="Revoke Seat & Delete"
                                                        >
                                                            <Trash2 size={14} />
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
                    <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
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

                            {/* 1. Role Preset & Access Level */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-blue-100/80 text-blue-700 flex items-center justify-center shrink-0">
                                            <Shield className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold mb-0 text-slate-900 leading-tight">
                                                Role Preset & Access Level
                                            </h4>
                                            <p className="text-xs text-slate-500 mt-0.5 mb-0">
                                                Choose a predefined role or tailor granular privileges below.
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        {formData.role_preset === 'custom' ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
                                                <Sliders className="w-3 h-3 text-amber-600" /> Custom Access
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border-1 border-blue-200/80">
                                                <Sparkles className="w-3 h-3 text-blue-600" /> Preset Applied
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
                                    {ALL_ROLE_PRESET_CARDS.map((preset) => {
                                        const isSelected = formData.role_preset === preset.id;
                                        const PresetIcon = preset.icon || ShieldCheck;
                                        return (
                                            <div
                                                key={preset.id}
                                                onClick={() => handleRolePresetSelect(preset.id)}
                                                className={`group p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between select-none ${isSelected
                                                    ? 'border-2 border-blue-600 bg-gradient-to-b from-blue-50/70 to-white shadow-xs ring-2 ring-blue-500/10'
                                                    : 'border border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50 bg-white shadow-2xs'
                                                    }`}
                                            >
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${isSelected
                                                            ? 'bg-blue-600 text-white shadow-xs'
                                                            : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200/70'
                                                            }`}>
                                                            <PresetIcon className="w-4 h-4" />
                                                        </div>
                                                        {isSelected ? (
                                                            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                                                                <Check className="w-3 h-3" strokeWidth={3} />
                                                            </div>
                                                        ) : (
                                                            <div className="w-5 h-5 rounded-full border-2 border-slate-200 group-hover:border-slate-300" />
                                                        )}
                                                    </div>
                                                    <span className="text-sm font-semibold text-slate-900 block leading-tight">
                                                        {preset.title}
                                                    </span>
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${preset.badgeColor} border inline-block mt-1.5`}>
                                                        {preset.tag}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 leading-snug line-clamp-2 mt-2 mb-0">
                                                    {preset.desc}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 2. Operational Permissions */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-indigo-100/80 text-indigo-700 flex items-center justify-center shrink-0">
                                            <Sliders className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold mb-0 text-slate-900 leading-tight">
                                                Operational Permissions
                                            </h4>
                                            <p className="text-xs text-slate-500 mt-0.5 mb-0">
                                                Granular privileges granted to this sub-recruiter profile.
                                            </p>
                                        </div>
                                    </div>
                                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 border border-slate-200 text-slate-700">
                                        {Object.keys(formData.permissions || {}).filter(k => k.startsWith('can_') && formData.permissions[k]).length} of 7 Enabled
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {PERMISSION_FIELDS.map((perm) => {
                                        const isChecked = Boolean(formData.permissions[perm.key]);
                                        const PermIcon = perm.icon || Briefcase;
                                        return (
                                            <div
                                                key={perm.key}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handlePermissionToggle(perm.key);
                                                }}
                                                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group select-none ${isChecked
                                                    ? 'border-blue-300 bg-blue-50/40 shadow-xs ring-1 ring-blue-500/10'
                                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3 min-w-0 pr-2">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isChecked ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200/70'
                                                        }`}>
                                                        <PermIcon className="w-4 h-4" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h5 className="text-xs font-semibold text-slate-900 truncate leading-snug mb-0">
                                                            {perm.label}
                                                        </h5>
                                                        <p className="text-[11px] text-slate-500 truncate leading-tight mt-0.5 mb-0">
                                                            {perm.desc}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className={`w-5 h-5 rounded-[6px] flex items-center justify-center transition-all shrink-0 ${isChecked
                                                    ? 'bg-[#0A66C2] border border-[#0A66C2] text-white shadow-2xs'
                                                    : 'bg-white border-2 border-slate-300 group-hover:border-slate-400'
                                                    }`}>
                                                    {isChecked && (
                                                        <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 3. Quota Splitting & Allocation (Dedicated Split vs Shared Pool) */}
                            <div className="bg-slate-50/80 p-3 sm:p-4 rounded-2xl border border-slate-200/80 space-y-3.5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-blue-100/80 text-blue-700 flex items-center justify-center shrink-0">
                                            <Layers className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold mb-0 text-slate-900 leading-tight">
                                                Quota Allocation & Drawing Mode
                                            </h4>
                                            <p className="text-xs text-slate-500 mt-0.5 mb-0">
                                                Assign dedicated allowances from company pool or draw from shared pool.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="inline-flex p-1 bg-slate-200/70 rounded-xl border border-slate-300/40 shrink-0 self-start sm:self-auto">
                                        <button
                                            type="button"
                                            onClick={() => handleQuotaModeToggle('shared')}
                                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${formData.permissions.quota_mode === 'shared'
                                                ? 'bg-blue-600 text-white shadow-xs'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                                                }`}
                                        >
                                            Shared Pool
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleQuotaModeToggle('split')}
                                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${formData.permissions.quota_mode === 'split'
                                                ? 'bg-blue-600 text-white shadow-xs'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                                                }`}
                                        >
                                            Dedicated Split
                                        </button>
                                    </div>
                                </div>

                                {formData.permissions.quota_mode === 'split' ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                                        {/* Job Posts Limit */}
                                        <div className={`p-3.5 bg-white rounded-xl border transition-all ${(stats.pool?.job_posts?.available_to_allocate ?? stats.pool?.job_posts?.unallocated ?? 0) <= 0
                                            ? 'bg-amber-50/40 border-amber-200'
                                            : 'border-slate-200 hover:border-slate-300'
                                            }`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-1.5">
                                                    <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                                                    <span className="text-xs font-bold text-slate-800">Job Posts</span>
                                                </div>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${(stats.pool?.job_posts?.available_to_allocate ?? stats.pool?.job_posts?.unallocated ?? 0) <= 0
                                                    ? 'bg-amber-100 text-amber-800'
                                                    : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {(stats.pool?.job_posts?.available_to_allocate ?? stats.pool?.job_posts?.unallocated ?? 0) <= 0
                                                        ? 'Full (0 Avail)'
                                                        : `Avail: ${stats.pool?.job_posts?.available_to_allocate ?? stats.pool?.job_posts?.unallocated ?? 0}`}
                                                </span>
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={stats.pool?.job_posts?.available_to_allocate ?? stats.pool?.job_posts?.unallocated ?? 0}
                                                    value={formData.permissions.allocated_job_posts || 0}
                                                    onChange={(e) => handleQuotaNumberChange('allocated_job_posts', e.target.value)}
                                                    disabled={(stats.pool?.job_posts?.available_to_allocate ?? stats.pool?.job_posts?.unallocated ?? 0) <= 0}
                                                    className={`w-full px-3 py-2 text-sm font-bold border rounded-lg outline-none transition-all ${(stats.pool?.job_posts?.available_to_allocate ?? stats.pool?.job_posts?.unallocated ?? 0) <= 0
                                                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                                                        : 'bg-white text-slate-900 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                                                        }`}
                                                />
                                                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium pointer-events-none">
                                                    posts
                                                </span>
                                            </div>
                                            <span className="text-[11px] text-slate-500 mt-1.5 block">
                                                Max vacancies they can post
                                            </span>
                                        </div>

                                        {/* Resume Views Limit */}
                                        {(() => {
                                            const viewsAvail = stats.pool?.resume_views?.available_to_allocate ?? stats.pool?.resume_views?.unallocated ?? 0;
                                            const isViewsFull = viewsAvail <= 0;
                                            return (
                                                <div className={`p-3.5 bg-white rounded-xl border transition-all ${isViewsFull ? 'bg-amber-50/40 border-amber-200' : 'border-slate-200 hover:border-slate-300'
                                                    }`}>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-1.5">
                                                            <Eye className="w-3.5 h-3.5 text-indigo-600" />
                                                            <span className="text-xs font-bold text-slate-800">Resume Views</span>
                                                        </div>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isViewsFull ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                                                            }`}>
                                                            {isViewsFull ? 'Full (0 Avail)' : `Avail: ${viewsAvail}`}
                                                        </span>
                                                    </div>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            max={viewsAvail}
                                                            value={formData.permissions.allocated_resume_views || 0}
                                                            onChange={(e) => handleQuotaNumberChange('allocated_resume_views', e.target.value)}
                                                            disabled={isViewsFull}
                                                            className={`w-full px-3 py-2 text-sm font-bold border rounded-lg outline-none transition-all ${isViewsFull
                                                                ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                                                                : 'bg-white text-slate-900 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                                                                }`}
                                                        />
                                                        <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium pointer-events-none">
                                                            views
                                                        </span>
                                                    </div>
                                                    <span className="text-[11px] text-slate-500 mt-1.5 block">
                                                        Candidate profiles unlock quota
                                                    </span>
                                                </div>
                                            );
                                        })()}

                                        {/* CV Downloads Limit */}
                                        {(() => {
                                            const downloadsAvail = stats.pool?.resume_downloads?.available_to_allocate ?? stats.pool?.resume_downloads?.unallocated ?? 0;
                                            const isDownloadsFull = downloadsAvail <= 0;
                                            return (
                                                <div className={`p-3.5 bg-white rounded-xl border transition-all ${isDownloadsFull ? 'bg-amber-50/40 border-amber-200' : 'border-slate-200 hover:border-slate-300'
                                                    }`}>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-1.5">
                                                            <Download className="w-3.5 h-3.5 text-purple-600" />
                                                            <span className="text-xs font-bold text-slate-800">CV Downloads</span>
                                                        </div>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDownloadsFull ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                                                            }`}>
                                                            {isDownloadsFull ? 'Full (0 Avail)' : `Avail: ${downloadsAvail}`}
                                                        </span>
                                                    </div>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            max={downloadsAvail}
                                                            value={formData.permissions.allocated_resume_downloads || 0}
                                                            onChange={(e) => handleQuotaNumberChange('allocated_resume_downloads', e.target.value)}
                                                            disabled={isDownloadsFull}
                                                            className={`w-full px-3 py-2 text-sm font-bold border rounded-lg outline-none transition-all ${isDownloadsFull
                                                                ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                                                                : 'bg-white text-slate-900 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                                                                }`}
                                                        />
                                                        <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium pointer-events-none">
                                                            files
                                                        </span>
                                                    </div>
                                                    <span className="text-[11px] text-slate-500 mt-1.5 block">
                                                        Resume PDF downloads quota
                                                    </span>
                                                </div>
                                            );
                                        })()}

                                        {/* Mail / Email Limit */}
                                        {(() => {
                                            const emailsAvail = stats.pool?.emails?.available_to_allocate ?? stats.pool?.emails?.unallocated ?? 0;
                                            const isEmailsFull = emailsAvail <= 0;
                                            return (
                                                <div className={`p-3.5 bg-white rounded-xl border transition-all ${isEmailsFull ? 'bg-amber-50/40 border-amber-200' : 'border-slate-200 hover:border-slate-300'
                                                    }`}>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-1.5">
                                                            <Mail className="w-3.5 h-3.5 text-sky-600" />
                                                            <span className="text-xs font-bold text-slate-800">Mail Outreach</span>
                                                        </div>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isEmailsFull ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                                                            }`}>
                                                            {isEmailsFull ? 'Full (0 Avail)' : `Avail: ${emailsAvail}`}
                                                        </span>
                                                    </div>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            max={emailsAvail}
                                                            value={formData.permissions.allocated_emails || 0}
                                                            onChange={(e) => handleQuotaNumberChange('allocated_emails', e.target.value)}
                                                            disabled={isEmailsFull}
                                                            className={`w-full px-3 py-2 text-sm font-bold border rounded-lg outline-none transition-all ${isEmailsFull
                                                                ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                                                                : 'bg-white text-slate-900 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                                                                }`}
                                                        />
                                                        <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium pointer-events-none">
                                                            mails
                                                        </span>
                                                    </div>
                                                    <span className="text-[11px] text-slate-500 mt-1.5 block">
                                                        Candidate outreach emails quota
                                                    </span>
                                                </div>
                                            );
                                        })()}

                                        {/* Excel Candidate Exports Limit */}
                                        {(() => {
                                            const excelAvail = stats.pool?.excel_downloads?.available_to_allocate ?? stats.pool?.excel_downloads?.unallocated ?? 0;
                                            const isExcelFull = excelAvail <= 0;
                                            return (
                                                <div className={`p-3.5 bg-white rounded-xl border transition-all ${isExcelFull ? 'bg-amber-50/40 border-amber-200' : 'border-slate-200 hover:border-slate-300'
                                                    }`}>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-1.5">
                                                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                                                            <span className="text-xs font-bold text-slate-800">Excel Exports</span>
                                                        </div>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isExcelFull ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                                                            }`}>
                                                            {isExcelFull ? 'Full (0 Avail)' : `Avail: ${excelAvail}`}
                                                        </span>
                                                    </div>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            max={excelAvail}
                                                            value={formData.permissions.allocated_excel_downloads || 0}
                                                            onChange={(e) => handleQuotaNumberChange('allocated_excel_downloads', e.target.value)}
                                                            disabled={isExcelFull}
                                                            className={`w-full px-3 py-2 text-sm font-bold border rounded-lg outline-none transition-all ${isExcelFull
                                                                ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                                                                : 'bg-white text-slate-900 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                                                                }`}
                                                        />
                                                        <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium pointer-events-none">
                                                            sheets
                                                        </span>
                                                    </div>
                                                    <span className="text-[11px] text-slate-500 mt-1.5 block">
                                                        Candidate spreadsheet export quota
                                                    </span>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                ) : (
                                    <div className="p-3 bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-white border-1 border-blue-100 rounded-xl space-y-2.5">
                                        <div className="flex items-start gap-2.5">
                                            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                                <Sparkles className="w-3.5 h-3.5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-900 mb-0.5">
                                                    Dynamic Shared Pool Mode
                                                </p>
                                                <p className="text-xs text-slate-600 leading-relaxed mb-0">
                                                    This team member draws directly from your company's shared subscription balance without individual seat limits until total plan quotas are reached.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="pt-2 border-t border-blue-100/70 flex flex-wrap items-center gap-2 text-[11px]">
                                            <span className="text-slate-500 font-medium">Company Pool Balance:</span>
                                            <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 font-semibold text-slate-700 flex items-center gap-1">
                                                <Briefcase className="w-3 h-3 text-blue-600" />
                                                Jobs: <span>{stats.pool?.job_posts?.available_to_allocate ?? stats.pool?.job_posts?.unallocated ?? 0} avail</span>
                                            </span>
                                            <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 font-semibold text-slate-700 flex items-center gap-1">
                                                <Eye className="w-3 h-3 text-indigo-600" />
                                                Views: <span>{stats.pool?.resume_views?.available_to_allocate ?? stats.pool?.resume_views?.unallocated ?? 0} avail</span>
                                            </span>
                                            <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 font-semibold text-slate-700 flex items-center gap-1">
                                                <Download className="w-3 h-3 text-purple-600" />
                                                Downloads: <span>{stats.pool?.resume_downloads?.available_to_allocate ?? stats.pool?.resume_downloads?.unallocated ?? 0} avail</span>
                                            </span>
                                            <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 font-semibold text-slate-700 flex items-center gap-1">
                                                <Mail className="w-3 h-3 text-sky-600" />
                                                Mail: <span>{stats.pool?.emails?.available_to_allocate ?? stats.pool?.emails?.unallocated ?? 0} avail</span>
                                            </span>
                                            <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 font-semibold text-slate-700 flex items-center gap-1">
                                                <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                                                Excel: <span>{stats.pool?.excel_downloads?.available_to_allocate ?? stats.pool?.excel_downloads?.unallocated ?? 0} avail</span>
                                            </span>
                                        </div>
                                    </div>
                                )}
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

                            {/* 1. Role Preset & Access Level */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-blue-100/80 text-blue-700 flex items-center justify-center shrink-0">
                                            <Shield className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold mb-0 text-slate-900 leading-tight">
                                                Role Preset & Access Level
                                            </h4>
                                            <p className="text-xs text-slate-500 mt-0.5 mb-0">
                                                Choose a predefined role or tailor granular privileges below.
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        {editingMember.role_preset === 'custom' ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
                                                <Sliders className="w-3 h-3 text-amber-600" /> Custom Access
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border-1 border-blue-200/80">
                                                <Sparkles className="w-3 h-3 text-blue-600" /> Preset Applied
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
                                    {ALL_ROLE_PRESET_CARDS.map((preset) => {
                                        const isSelected = editingMember.role_preset === preset.id;
                                        const PresetIcon = preset.icon || ShieldCheck;
                                        return (
                                            <div
                                                key={preset.id}
                                                onClick={() => handleEditRolePresetSelect(preset.id)}
                                                className={`group p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between select-none ${isSelected
                                                    ? 'border-2 border-blue-600 bg-gradient-to-b from-blue-50/70 to-white shadow-xs ring-2 ring-blue-500/10'
                                                    : 'border border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50 bg-white shadow-2xs'
                                                    }`}
                                            >
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${isSelected
                                                            ? 'bg-blue-600 text-white shadow-xs'
                                                            : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200/70'
                                                            }`}>
                                                            <PresetIcon className="w-4 h-4" />
                                                        </div>
                                                        {isSelected ? (
                                                            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                                                                <Check className="w-3 h-3" strokeWidth={3} />
                                                            </div>
                                                        ) : (
                                                            <div className="w-5 h-5 rounded-full border-2 border-slate-200 group-hover:border-slate-300" />
                                                        )}
                                                    </div>
                                                    <span className="text-sm font-semibold text-slate-900 block leading-tight">
                                                        {preset.title}
                                                    </span>
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${preset.badgeColor} border inline-block mt-1.5`}>
                                                        {preset.tag}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 leading-snug line-clamp-2 mt-2 mb-0">
                                                    {preset.desc}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 2. Operational Permissions */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-indigo-100/80 text-indigo-700 flex items-center justify-center shrink-0">
                                            <Sliders className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold mb-0 text-slate-900 leading-tight">
                                                Operational Permissions
                                            </h4>
                                            <p className="text-xs text-slate-500 mt-0.5 mb-0">
                                                Granular privileges granted to this sub-recruiter profile.
                                            </p>
                                        </div>
                                    </div>
                                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 border border-slate-200 text-slate-700">
                                        {Object.keys(editingMember.permissions || {}).filter(k => k.startsWith('can_') && editingMember.permissions[k]).length} of 7 Enabled
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {PERMISSION_FIELDS.map((perm) => {
                                        const isChecked = Boolean(editingMember.permissions?.[perm.key]);
                                        const PermIcon = perm.icon || Briefcase;
                                        return (
                                            <div
                                                key={perm.key}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleEditPermissionToggle(perm.key);
                                                }}
                                                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group select-none ${isChecked
                                                    ? 'border-blue-300 bg-blue-50/40 shadow-xs ring-1 ring-blue-500/10'
                                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3 min-w-0 pr-2">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isChecked ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200/70'
                                                        }`}>
                                                        <PermIcon className="w-4 h-4" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h5 className="text-xs font-semibold text-slate-900 truncate leading-snug mb-0">
                                                            {perm.label}
                                                        </h5>
                                                        <p className="text-[11px] text-slate-500 truncate leading-tight mt-0.5 mb-0">
                                                            {perm.desc}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className={`w-5 h-5 rounded-[6px] flex items-center justify-center transition-all shrink-0 ${isChecked
                                                    ? 'bg-[#0A66C2] border border-[#0A66C2] text-white shadow-2xs'
                                                    : 'bg-white border-2 border-slate-300 group-hover:border-slate-400'
                                                    }`}>
                                                    {isChecked && (
                                                        <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 3. Quota Splitting & Allocation */}
                            <div className="bg-slate-50/80 p-3 sm:p-4 rounded-2xl border border-slate-200/80 space-y-3.5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-blue-100/80 text-blue-700 flex items-center justify-center shrink-0">
                                            <Layers className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold mb-0 text-slate-900 leading-tight">
                                                Quota Allocation & Drawing Mode
                                            </h4>
                                            <p className="text-xs text-slate-500 mt-0.5 mb-0">
                                                Dedicated sub-recruiter allowance vs company shared pool.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="inline-flex p-1 bg-slate-200/70 rounded-xl border border-slate-300/40 shrink-0 self-start sm:self-auto">
                                        <button
                                            type="button"
                                            onClick={() => setEditingMember({
                                                ...editingMember,
                                                permissions: {
                                                    ...editingMember.permissions,
                                                    quota_mode: 'shared'
                                                }
                                            })}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${editingMember.permissions?.quota_mode === 'shared'
                                                ? 'bg-blue-600 text-white shadow-xs'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                                                }`}
                                        >
                                            Shared Pool
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditingMember({
                                                ...editingMember,
                                                permissions: {
                                                    ...editingMember.permissions,
                                                    quota_mode: 'split'
                                                }
                                            })}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${editingMember.permissions?.quota_mode === 'split'
                                                ? 'bg-blue-600 text-white shadow-xs'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                                                }`}
                                        >
                                            Dedicated Split
                                        </button>
                                    </div>
                                </div>

                                {editingMember.permissions?.quota_mode === 'split' ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                                        {/* Job Posts Limit */}
                                        <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-1.5">
                                                    <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                                                    <span className="text-xs font-bold text-slate-800">Job Posts</span>
                                                </div>
                                                {(() => {
                                                    const poolAvail = stats.pool?.job_posts?.available_to_allocate ?? stats.pool?.job_posts?.unallocated ?? 0;
                                                    const curAlloc = team.find(t => t.id === editingMember.id)?.permissions?.allocated_job_posts || 0;
                                                    const maxAlloc = poolAvail + curAlloc;
                                                    return (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                                            Max: {maxAlloc}
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min={editingMember.permissions?.used_job_posts || 0}
                                                    max={(() => {
                                                        const poolAvail = stats.pool?.job_posts?.available_to_allocate ?? stats.pool?.job_posts?.unallocated ?? 0;
                                                        const curAlloc = team.find(t => t.id === editingMember.id)?.permissions?.allocated_job_posts || 0;
                                                        return poolAvail + curAlloc;
                                                    })()}
                                                    value={editingMember.permissions?.allocated_job_posts || 0}
                                                    onChange={(e) => setEditingMember({
                                                        ...editingMember,
                                                        permissions: {
                                                            ...editingMember.permissions,
                                                            allocated_job_posts: Math.max(0, parseInt(e.target.value) || 0)
                                                        }
                                                    })}
                                                    className="w-full px-3 py-2 text-sm font-bold border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                />
                                                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium pointer-events-none">
                                                    posts
                                                </span>
                                            </div>
                                            <span className="text-[11px] text-slate-500 mt-1.5 block">
                                                Already consumed: <span>{editingMember.permissions?.used_job_posts || 0}</span> jobs
                                            </span>
                                        </div>

                                        {/* Resume Views */}
                                        <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-1.5">
                                                    <Eye className="w-3.5 h-3.5 text-indigo-600" />
                                                    <span className="text-xs font-bold text-slate-800">Resume Views</span>
                                                </div>
                                                {(() => {
                                                    const poolAvail = stats.pool?.resume_views?.available_to_allocate ?? stats.pool?.resume_views?.unallocated ?? 0;
                                                    const curAlloc = team.find(t => t.id === editingMember.id)?.permissions?.allocated_resume_views || 0;
                                                    const maxAlloc = poolAvail + curAlloc;
                                                    return (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                                            Max: {maxAlloc}
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min={editingMember.permissions?.used_resume_views || 0}
                                                    value={editingMember.permissions?.allocated_resume_views || 0}
                                                    onChange={(e) => setEditingMember({
                                                        ...editingMember,
                                                        permissions: {
                                                            ...editingMember.permissions,
                                                            allocated_resume_views: Math.max(0, parseInt(e.target.value) || 0)
                                                        }
                                                    })}
                                                    className="w-full px-3 py-2 text-sm font-bold border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                />
                                                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium pointer-events-none">
                                                    views
                                                </span>
                                            </div>
                                            <span className="text-[11px] text-slate-500 mt-1.5 block">
                                                Already consumed: <span>{editingMember.permissions?.used_resume_views || 0}</span> views
                                            </span>
                                        </div>

                                        {/* CV Downloads */}
                                        <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-1.5">
                                                    <Download className="w-3.5 h-3.5 text-purple-600" />
                                                    <span className="text-xs font-bold text-slate-800">CV Downloads</span>
                                                </div>
                                                {(() => {
                                                    const poolAvail = stats.pool?.resume_downloads?.available_to_allocate ?? stats.pool?.resume_downloads?.unallocated ?? 0;
                                                    const curAlloc = team.find(t => t.id === editingMember.id)?.permissions?.allocated_resume_downloads || 0;
                                                    const maxAlloc = poolAvail + curAlloc;
                                                    return (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                                            Max: {maxAlloc}
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min={editingMember.permissions?.used_resume_downloads || 0}
                                                    value={editingMember.permissions?.allocated_resume_downloads || 0}
                                                    onChange={(e) => setEditingMember({
                                                        ...editingMember,
                                                        permissions: {
                                                            ...editingMember.permissions,
                                                            allocated_resume_downloads: Math.max(0, parseInt(e.target.value) || 0)
                                                        }
                                                    })}
                                                    className="w-full px-3 py-2 text-sm font-bold border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                />
                                                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium pointer-events-none">
                                                    files
                                                </span>
                                            </div>
                                            <span className="text-[11px] text-slate-500 mt-1.5 block">
                                                Already consumed: <span>{editingMember.permissions?.used_resume_downloads || 0}</span> files
                                            </span>
                                        </div>

                                        {/* Mail Outreach */}
                                        <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-1.5">
                                                    <Mail className="w-3.5 h-3.5 text-sky-600" />
                                                    <span className="text-xs font-bold text-slate-800">Mail Outreach</span>
                                                </div>
                                                {(() => {
                                                    const poolAvail = stats.pool?.emails?.available_to_allocate ?? stats.pool?.emails?.unallocated ?? 0;
                                                    const curAlloc = team.find(t => t.id === editingMember.id)?.permissions?.allocated_emails || 0;
                                                    const maxAlloc = poolAvail + curAlloc;
                                                    return (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                                            Max: {maxAlloc}
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min={editingMember.permissions?.used_emails || 0}
                                                    value={editingMember.permissions?.allocated_emails || 0}
                                                    onChange={(e) => setEditingMember({
                                                        ...editingMember,
                                                        permissions: {
                                                            ...editingMember.permissions,
                                                            allocated_emails: Math.max(0, parseInt(e.target.value) || 0)
                                                        }
                                                    })}
                                                    className="w-full px-3 py-2 text-sm font-bold border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                />
                                                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium pointer-events-none">
                                                    mails
                                                </span>
                                            </div>
                                            <span className="text-[11px] text-slate-500 mt-1.5 block">
                                                Already consumed: <span>{editingMember.permissions?.used_emails || 0}</span> mails
                                            </span>
                                        </div>

                                        {/* Excel Exports */}
                                        <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-1.5">
                                                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                                                    <span className="text-xs font-bold text-slate-800">Excel Exports</span>
                                                </div>
                                                {(() => {
                                                    const poolAvail = stats.pool?.excel_downloads?.available_to_allocate ?? stats.pool?.excel_downloads?.unallocated ?? 0;
                                                    const curAlloc = team.find(t => t.id === editingMember.id)?.permissions?.allocated_excel_downloads || 0;
                                                    const maxAlloc = poolAvail + curAlloc;
                                                    return (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                                            Max: {maxAlloc}
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min={editingMember.permissions?.used_excel_downloads || 0}
                                                    value={editingMember.permissions?.allocated_excel_downloads || 0}
                                                    onChange={(e) => setEditingMember({
                                                        ...editingMember,
                                                        permissions: {
                                                            ...editingMember.permissions,
                                                            allocated_excel_downloads: Math.max(0, parseInt(e.target.value) || 0)
                                                        }
                                                    })}
                                                    className="w-full px-3 py-2 text-sm font-bold border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                />
                                                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium pointer-events-none">
                                                    exports
                                                </span>
                                            </div>
                                            <span className="text-[11px] text-slate-500 mt-1.5 block">
                                                Already consumed: <span>{editingMember.permissions?.used_excel_downloads || 0}</span> exports
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-3 bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-white border-1 border-blue-100 rounded-xl space-y-2.5">
                                        <div className="flex items-start gap-2.5">
                                            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                                <Sparkles className="w-3.5 h-3.5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-900 mb-0.5">
                                                    Dynamic Shared Pool Mode
                                                </p>
                                                <p className="text-xs text-slate-600 leading-relaxed mb-0">
                                                    This team member draws directly from your company's shared subscription balance without individual seat limits until total plan quotas are reached.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="pt-2 border-t border-blue-100/70 flex flex-wrap items-center gap-2 text-[11px]">
                                            <span className="text-slate-500 font-medium">Company Pool Balance:</span>
                                            <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 font-semibold text-slate-700 flex items-center gap-1">
                                                <Briefcase className="w-3 h-3 text-blue-600" />
                                                Jobs: <span>{stats.pool?.job_posts?.available_to_allocate ?? stats.pool?.job_posts?.unallocated ?? 0} avail</span>
                                            </span>
                                            <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 font-semibold text-slate-700 flex items-center gap-1">
                                                <Eye className="w-3 h-3 text-indigo-600" />
                                                Views: <span>{stats.pool?.resume_views?.available_to_allocate ?? stats.pool?.resume_views?.unallocated ?? 0} avail</span>
                                            </span>
                                            <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 font-semibold text-slate-700 flex items-center gap-1">
                                                <Download className="w-3 h-3 text-purple-600" />
                                                Downloads: <span>{stats.pool?.resume_downloads?.available_to_allocate ?? stats.pool?.resume_downloads?.unallocated ?? 0} avail</span>
                                            </span>
                                            <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 font-semibold text-slate-700 flex items-center gap-1">
                                                <Mail className="w-3 h-3 text-sky-600" />
                                                Mail: <span>{stats.pool?.emails?.available_to_allocate ?? stats.pool?.emails?.unallocated ?? 0} avail</span>
                                            </span>
                                            <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 font-semibold text-slate-700 flex items-center gap-1">
                                                <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                                                Excel: <span>{stats.pool?.excel_downloads?.available_to_allocate ?? stats.pool?.excel_downloads?.unallocated ?? 0} avail</span>
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 py-3 px-3 border-t border-slate-100">
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
                        <h3 className="text-lg font-semibold text-slate-900 mb-0">
                            Revoke Seat & Delete Account?
                        </h3>
                        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                            Are you sure you want to remove <span>{deleteModalMember.full_name}</span>? Their login will be deactivated, their allocated quota will be returned to your company pool, and 1 seat will be freed up.
                        </p>
                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={() => setDeleteModalMember(null)}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteMember}
                                disabled={submitting}
                                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                            >
                                {submitting && <RefreshCw size={14} className="animate-spin" />}
                                <span>Yes, Revoke Seat</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* 🔄 Modal: Suspend / Activate Account Confirmation             */}
            {/* ============================================================ */}
            {statusModalMember && (() => {
                const isSuspending = statusModalMember.status === 'active';
                const memberName = statusModalMember.full_name || `${statusModalMember.first_name || ''} ${statusModalMember.last_name || ''}`.trim() || statusModalMember.email;
                return (
                    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
                        <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 p-6 shadow-2xl text-center">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 border shadow-2xs ${isSuspending
                                ? 'bg-amber-50 text-amber-600 border-amber-100'
                                : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                }`}>
                                {isSuspending ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-1">
                                {isSuspending ? 'Suspend Sub-Recruiter Access?' : 'Activate Sub-Recruiter Access?'}
                            </h3>
                            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                                {isSuspending ? (
                                    <>
                                        Are you sure you want to suspend <span className="text-slate-800">{memberName}</span>? This will temporarily revoke their login access and pause their recruitment activities.
                                    </>
                                ) : (
                                    <>
                                        Are you sure you want to activate <span className="text-slate-800">{memberName}</span>? Their login access will be immediately restored with their assigned permissions and quotas.
                                    </>
                                )}
                            </p>
                            <div className="flex items-center justify-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setStatusModalMember(null)}
                                    className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmToggleStatus}
                                    disabled={submitting}
                                    className={`px-5 py-2.5 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer shadow-xs inline-flex items-center gap-2 ${isSuspending
                                        ? 'bg-amber-600 hover:bg-amber-700'
                                        : 'bg-emerald-600 hover:bg-emerald-700'
                                        }`}
                                >
                                    {submitting && <RefreshCw size={14} className="animate-spin" />}
                                    <span>{isSuspending ? 'Yes, Suspend Account' : 'Yes, Activate Account'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
