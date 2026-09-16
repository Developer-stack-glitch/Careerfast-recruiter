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
    { name: 'Plans & Billing', href: '/billing', icon: FileText },
    { name: 'Settings', href: '/settings', icon: Settings },
];

const HrSidebar = () => {
    const pathname = usePathname();

    const handleLogout = () => {
        localStorage.removeItem("AccessToken");
        localStorage.removeItem("loginDetails");
        document.cookie = "AccessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "loginDetails=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        window.location.href = "/login";
    };

    return (
        <aside className="w-[260px] flex-shrink-0 bg-white border-r border-gray-100 h-full flex flex-col pt-8 pb-8 overflow-y-auto">
            <div className="px-8 mb-6">
                <h2 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">
                    Employers Dashboard
                </h2>
            </div>

            <nav className="flex-1 flex flex-col space-y-1">
                {sidebarNav.map((item) => {
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

            <div className="px-8 mt-8">
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
