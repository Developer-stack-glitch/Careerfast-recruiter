'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Layers,
    User,
    PlusCircle,
    Briefcase,
    Bookmark,
    FileText,
    Users,
    Settings,
    LogOut
} from 'lucide-react';

const sidebarNav = [
    { name: 'Overview', href: '/overview', icon: Layers },
    { name: 'Employers Profile', href: '/profile', icon: User },
    { name: 'Post a Job', href: '/post-job', icon: PlusCircle },
    { name: 'Post Internship', href: '/post-internship', icon: PlusCircle },
    { name: 'My Jobs', href: '/my-jobs', icon: Briefcase },
    { name: 'Saved Candidate', href: '/saved-candidates', icon: Bookmark },
    { name: 'Candidate Search', href: '/candidate-search', icon: Users },
    { name: 'Team & Seats', href: '/team', icon: Users },
    { name: 'Plans & Billing', href: '/billing', icon: FileText },
    { name: 'Settings', href: '/settings', icon: Settings },
];

const HrSidebar = () => {
    const pathname = usePathname();
    const [activePlanName, setActivePlanName] = React.useState(null);
    const [daysLeft, setDaysLeft] = React.useState(null);
    const [userAccess, setUserAccess] = React.useState({
        isSubRecruiter: false,
        designation: 'Recruiter',
        permissions: {
            can_post_jobs: true,
            can_view_resumes: true,
            can_download_resumes: true,
            can_contact_candidates: true,
            can_manage_applications: true,
            can_edit_company_profile: true,
            can_manage_team: true,
            can_manage_billing: true
        }
    });

    React.useEffect(() => {
        try {
            const stored = localStorage.getItem("loginDetails");
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.is_sub_recruiter || parsed.sub_recruiter_info) {
                    const subInfo = parsed.sub_recruiter_info || {};
                    const perms = subInfo.permissions || {};
                    setUserAccess({
                        isSubRecruiter: true,
                        designation: subInfo.designation || 'Recruiter',
                        permissions: {
                            can_post_jobs: perms.can_post_jobs !== false,
                            can_view_resumes: perms.can_view_resumes !== false,
                            can_download_resumes: perms.can_download_resumes !== false,
                            can_contact_candidates: perms.can_contact_candidates !== false,
                            can_manage_applications: perms.can_manage_applications !== false,
                            can_edit_company_profile: perms.can_edit_company_profile === true,
                            can_manage_team: false,
                            can_manage_billing: false,
                            ...perms
                        }
                    });
                }
            }
        } catch (e) { }

        const fetchPlanBadge = async () => {
            try {
                const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006';
                const token = typeof window !== 'undefined' ? localStorage.getItem("AccessToken") : '';
                if (!token) return;

                const res = await fetch(`${apiBase}/api/recruiter/my-subscription`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                const data = await res.json();
                if (data?.success && data?.data) {
                    if (data.data.plan) {
                        setActivePlanName(data.data.plan.name);
                        setDaysLeft(data.data.days_remaining);
                    }
                    if (data.data.is_sub_recruiter) {
                        const subInfo = data.data.sub_recruiter_info;
                        const perms = data.data.permissions || {};
                        setUserAccess({
                            isSubRecruiter: true,
                            designation: subInfo?.designation || 'Recruiter',
                            permissions: {
                                can_post_jobs: perms.can_post_jobs !== false && data.data.can_post_jobs !== false && !data.data.company_limit_reached,
                                can_view_resumes: perms.can_view_resumes !== false,
                                can_download_resumes: perms.can_download_resumes !== false,
                                can_contact_candidates: perms.can_contact_candidates !== false,
                                can_manage_applications: perms.can_manage_applications !== false,
                                can_edit_company_profile: perms.can_edit_company_profile === true,
                                can_manage_team: false,
                                can_manage_billing: false
                            }
                        });
                    }
                }
            } catch (e) {
                // Ignore silent failure
            }
        };
        fetchPlanBadge();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("AccessToken");
        localStorage.removeItem("loginDetails");
        document.cookie = "AccessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "loginDetails=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        window.location.href = "/login";
    };

    const filteredNav = sidebarNav.filter(item => {
        if (item.href === '/team') return !userAccess.isSubRecruiter && userAccess.permissions.can_manage_team !== false;
        if (item.href === '/billing') return !userAccess.isSubRecruiter && userAccess.permissions.can_manage_billing !== false;
        if (item.href === '/post-job' || item.href === '/post-internship') return userAccess.permissions.can_post_jobs !== false;
        if (item.href === '/profile') return userAccess.permissions.can_edit_company_profile !== false;
        if (item.href === '/candidate-search' || item.href === '/saved-candidates') return userAccess.permissions.can_view_resumes !== false;
        return true;
    });

    return (
        <aside className="w-[260px] flex-shrink-0 bg-white border-r border-gray-100 h-full flex flex-col pt-8 pb-8 overflow-y-auto">
            <div className="px-8 mb-6">
                <h2 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">
                    {userAccess.isSubRecruiter ? 'Sub-Recruiter Portal' : 'Employers Dashboard'}
                </h2>
            </div>

            <nav className="flex-1 flex flex-col space-y-1">
                {filteredNav.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link key={item.name} href={item.href} className="no-underline hover:no-underline">
                            <div className={`flex items-center gap-2 pl-8 pr-4 py-3 transition-colors duration-200 cursor-pointer ${isActive
                                ? 'bg-[#F0F6FF] text-[#1967D2] font-semibold border-l-[3px] border-[#1967D2]'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 border-l-[3px] border-transparent'
                                }`}>
                                <Icon size={20} className={isActive ? 'text-[#1967D2]' : 'text-gray-400'} strokeWidth={isActive ? 2.5 : 2} />
                                <span className={`text-[14px] ${isActive ? 'font-semibold' : 'font-medium'}`}>
                                    {item.name}
                                </span>
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {/* Active Plan or Role Widget */}
            {userAccess.isSubRecruiter ? (
                <div className="px-6 my-4">
                    <div className="block p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">Role</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                                Sub-Recruiter
                            </span>
                        </div>
                        <p className="text-xs font-bold text-indigo-950 mb-0 truncate">{userAccess.designation || 'Team Member'}</p>
                    </div>
                </div>
            ) : activePlanName ? (
                <div className="px-6 my-4">
                    <Link href="/billing" className="block p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 hover:border-blue-200 transition-all no-underline">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">Plan Active</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                                {daysLeft !== null ? `${daysLeft}d left` : 'Active'}
                            </span>
                        </div>
                        <p className="text-xs font-bold text-blue-950 mb-0 truncate">{activePlanName} Plan</p>
                    </Link>
                </div>
            ) : null}

            <div className="px-8 mt-auto">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-4 py-3 text-gray-500 hover:text-gray-900 transition-colors duration-200 font-medium group"
                >
                    <LogOut size={20} className="text-red-500 group-hover:text-red-600" />
                    <span className="text-[14px] text-red-500">Log-out</span>
                </button>
            </div>
        </aside>
    );
};

export default HrSidebar;
