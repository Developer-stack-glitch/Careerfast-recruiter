import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
    Search, Settings,
    Plug, LineChart, Sparkles, Users, CreditCard,
    Rocket, ChevronRight, Bell, PanelLeftClose, PanelLeftOpen, X, Command,
    Building, Briefcase, FileCheck, MessageSquare,
    TimerReset, LogOut
} from 'lucide-react';
import Overview from './Overview';
import JobPost from './JobPost';
import AnalyticsReport from './AnalyticsReport';
import JobSeekers from './JobSeekers';
import Employers from './Employers';
import Applications from './Applications';
import PendingJobs from './PendingJobs';
import BillingPlan from './BillingPlan';
import SupportTicket from './SupportTicket';
import SettingsPage from './Settings';
import IntegrationPage from './Integration';

const mockNavGroups = [
    {
        heading: 'Overview',
        items: [
            { id: 'dashboard', title: 'Dashboard', icon: LineChart },
            { id: 'analytics', title: 'Analytics & Reports', icon: Sparkles },
        ]
    },
    {
        heading: 'User Management',
        items: [
            { id: 'job-seekers', title: 'Job Seekers', icon: Users },
        ]
    },
    {
        heading: 'Recruiter Management',
        items: [
            { id: 'employers', title: 'Employers', icon: Building },
            { id: 'job-post', title: 'Job Postings', icon: Briefcase },
            { id: 'applications', title: 'Applications', icon: FileCheck },
            { id: 'pending-jobs', title: 'Approval Pending Jobs', icon: TimerReset },
        ]
    },
    {
        heading: 'Platform',
        items: [
            { id: 'billing', title: 'Billing & Plans', icon: CreditCard },
            { id: 'support', title: 'Support Tickets', icon: MessageSquare },
        ]
    },
    {
        heading: 'Configuration',
        items: [
            { id: 'general', title: 'General Settings', icon: Settings },
            { id: 'integrations', title: 'Integrations', icon: Plug },
        ]
    }
];

const mockBottomItems = [
    { id: 'logout', title: 'Logout', icon: LogOut },
];

function WorkspaceSwitcher() {
    return (
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-center w-full cursor-pointer group">
                <div className="flex items-center gap-2">
                    <img src="https://careerfast.in/_next/static/media/careerfastlogofinal.0nplzw.k4hsr8.png" alt="" className='w-[180px]' />
                </div>
            </div>
        </div>
    );
}

function NavItem({ item, activeId, onSelect }) {
    const isActive = activeId === item.id;

    return (
        <div
            className={`flex items-center gap-3 px-3 py-2 text-[13px] cursor-pointer transition-colors mx-3
                ${isActive
                    ? 'bg-gray-100/80 text-gray-900 font-medium rounded-lg'
                    : item.id === 'logout'
                        ? 'text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg'}`}
            onClick={() => onSelect(item.id)}
        >
            <item.icon className={`w-[16px] h-[16px] ${isActive ? 'text-gray-700' : item.id === 'logout' ? 'text-red-500' : 'text-gray-400'}`} strokeWidth={isActive ? 2 : 1.5} />
            <span className="truncate">{item.title}</span>
        </div>
    );
}

export function SidebarNav({ className = '', activeId, onSelect }) {
    return (
        <div className={`flex flex-col w-[260px] h-full bg-white border-r border-gray-100 font-sans ${className}`}>
            <WorkspaceSwitcher />

            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col gap-1 mt-3">
                {mockNavGroups.map((group, idx) => (
                    <div key={idx} className="flex flex-col gap-1 mb-4">
                        {group.heading && (
                            <span className="px-6 mb-3 text-[11px] font-semibold tracking-widest text-gray-500/80 uppercase">
                                {group.heading}
                            </span>
                        )}
                        {group.items.map(item => (
                            <NavItem
                                key={item.id}
                                item={item}
                                activeId={activeId}
                                onSelect={onSelect}
                            />
                        ))}
                    </div>
                ))}
            </div>

            <div className="mt-auto pb-2 flex flex-col gap-1 bg-white pt-2">
                {/* <div className="px-3 mb-2">
                    <div
                        onClick={() => onSelect('getting-started')}
                        className={`border rounded-xl p-3.5 flex flex-col gap-3 cursor-pointer transition-colors mx-1 ${activeId === 'getting-started'
                            ? 'bg-[#f5fbff] border-blue-200/80 hover:bg-blue-50/80'
                            : 'bg-white border-gray-100 hover:bg-gray-50'
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <div className={`flex items-center gap-2 font-medium text-[13px] ${activeId === 'getting-started' ? 'text-blue-600' : 'text-gray-700'
                                }`}>
                                <Rocket className={`w-4 h-4 ${activeId === 'getting-started' ? 'text-blue-600' : 'text-gray-400'
                                    }`} />
                                <span>Getting started</span>
                            </div>
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${activeId === 'getting-started' ? 'text-blue-700 bg-blue-100/50' : 'text-gray-500 bg-gray-100'
                                }`}>2/3</span>
                        </div>
                        <div className={`h-1 rounded-full overflow-hidden ${activeId === 'getting-started' ? 'bg-blue-100' : 'bg-gray-100'
                            }`}>
                            <div className={`h-full w-2/3 rounded-full ${activeId === 'getting-started' ? 'bg-blue-600' : 'bg-gray-400'
                                }`} />
                        </div>
                    </div>
                </div> */}
                <div className="h-px bg-gray-100/80 w-full mb-2 mt-1" />
                {mockBottomItems.map(item => (
                    <NavItem
                        key={item.id}
                        item={item}
                        activeId={activeId}
                        onSelect={onSelect}
                    />
                ))}
            </div>
        </div>
    );
}

const allItems = [
    ...mockNavGroups.flatMap(g => g.items),
    ...mockBottomItems,
    { id: 'getting-started', title: 'Getting started', icon: Rocket }
];

export default function AdminLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const activeId = pathname === '/admin' ? 'dashboard' : pathname.split('/').pop();

    const [isOpen, setIsOpen] = useState(true);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    useEffect(() => {
        const checkAccess = () => {
            const stored = localStorage.getItem("loginDetails");
            if (!stored) {
                if (typeof window !== 'undefined') window.location.href = "/superadmin/login";
                return;
            }
            try {
                const loginDetails = JSON.parse(stored);
                if (loginDetails.role_id !== 1) {
                    if (typeof window !== 'undefined') window.location.href = "/superadmin/login";
                }
            } catch (e) {
                if (typeof window !== 'undefined') window.location.href = "/superadmin/login";
            }
        };
        checkAccess();
    }, []);

    const activeItem = allItems.find(i => i.id === activeId);
    const activeTitle = activeItem ? activeItem.title : 'Dashboard';

    const handleSelect = (id) => {
        if (id === 'dashboard') {
            router.push('/admin');
        } else if (id === 'logout') {
            localStorage.removeItem("AccessToken");
            localStorage.removeItem("loginDetails");
            document.cookie = "AccessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            document.cookie = "loginDetails=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            window.location.href = "/superadmin/login";
        } else if (id === 'back') {
            router.push('/');
        } else {
            router.push(`/admin/${id}`);
        }
    };

    return (
        <div className="flex h-screen w-full bg-white font-sans overflow-hidden text-gray-900">
            <div
                className={`h-full transition-all duration-300 ease-in-out shrink-0 overflow-hidden bg-white ${isOpen ? 'w-[260px] opacity-100' : 'w-0 opacity-0 border-none'
                    }`}
            >
                <SidebarNav
                    className="w-[260px] border-none"
                    activeId={activeId}
                    onSelect={handleSelect}
                />
            </div>

            <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 bg-white border-l border-gray-100">
                <div className="h-[72px] flex items-center px-6 justify-between bg-white shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                        >
                            {isOpen ? <PanelLeftClose className="w-[18px] h-[18px]" /> : <PanelLeftOpen className="w-[18px] h-[18px]" />}
                        </button>
                        <div className="flex items-center text-[13px] text-gray-500">
                            <span className="cursor-pointer hover:text-gray-900">Dashboard</span>
                            <ChevronRight className="w-3.5 h-3.5 mx-2 text-gray-300" />
                            <span className="font-medium text-gray-900">{activeTitle}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-5">
                        <div className="relative hidden md:flex items-center group">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 group-hover:text-gray-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search"
                                className="pl-9 pr-4 py-2 bg-gray-50 hover:bg-gray-100/80 border border-transparent hover:border-gray-200 transition-all rounded-full text-[13px] focus:outline-none focus:bg-white focus:border-gray-300 focus:ring-4 focus:ring-gray-100/50 w-64 cursor-text"
                                onClick={() => setIsSearchOpen(true)}
                                readOnly
                            />
                        </div>

                        <div className="flex items-center gap-4 ml-2">

                            <button className="text-gray-400 hover:text-gray-600 transition-colors">
                                <Bell className="w-5 h-5" />
                            </button>

                            <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center text-[12px] font-bold cursor-pointer shadow-sm tracking-wide ml-1">
                                AS
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 md:p-8 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex-1 bg-[#f5f5f5]">
                    {children ? children : (
                        <div>
                            {activeId === 'analytics' ? <AnalyticsReport /> : activeId === 'job-post' ? <JobPost /> : activeId === 'job-seekers' ? <JobSeekers /> : activeId === 'employers' ? <Employers /> : activeId === 'applications' ? <Applications /> : activeId === 'pending-jobs' ? <PendingJobs /> : activeId === 'billing' ? <BillingPlan /> : activeId === 'support' ? <SupportTicket /> : activeId === 'general' ? <SettingsPage /> : activeId === 'integrations' ? <IntegrationPage /> : <Overview />}
                        </div>
                    )}
                </div>

                {isSearchOpen && (
                    <div className="absolute inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/20 backdrop-blur-sm px-4">
                        <div className="absolute inset-0" onClick={() => setIsSearchOpen(false)} />
                        <div className="relative w-full max-w-xl bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center px-4 border-b border-gray-100">
                                <Search className="w-5 h-5 text-gray-400 mr-3 shrink-0" />
                                <input
                                    autoFocus
                                    className="flex-1 bg-transparent py-4 outline-none text-[15px] text-gray-900 placeholder:text-gray-400"
                                    placeholder="Search..."
                                />
                                <kbd
                                    onClick={() => setIsSearchOpen(false)}
                                    className="hidden sm:inline-flex items-center justify-center h-6 px-2 ml-2 text-[11px] font-medium font-mono text-gray-500 bg-gray-100 border border-gray-200 rounded-md cursor-pointer hover:text-gray-900 hover:bg-gray-200 transition-colors"
                                >
                                    ESC
                                </kbd>
                            </div>
                            <div className="p-4 py-12 flex flex-col items-center justify-center">
                                <Command className="w-8 h-8 text-gray-200 mb-3" />
                                <p className="text-[14px] text-gray-500">No recent searches</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
