"use client";
import React, { useState, useEffect, useRef } from 'react';
import {
    Ticket, Search, MoreVertical, Eye, Trash2, ChevronLeft, ChevronRight,
    MessageSquare, AlertCircle, CheckCircle2, Clock, X, Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Mock Data Generator ──
const generateMockTickets = (count) => {
    const statuses = ['Open', 'In Progress', 'Closed'];
    const priorities = ['Low', 'Medium', 'High', 'Urgent'];
    const subjects = [
        'Cannot access my account',
        'Payment failed for premium plan',
        'How to update my profile?',
        'Bug in the application submission',
        'Feature request: Dark mode',
        'Need help with employer verification',
        'Job posting rejected',
        'Email notifications not working'
    ];
    const names = ['Alice Johnson', 'Bob Smith', 'Charlie Brown', 'Diana Prince', 'Evan Wright', 'Fiona Gallagher'];

    return Array.from({ length: count }, (_, i) => ({
        id: `TKT-${1000 + i}`,
        _id: `mongo_id_${i}`,
        subject: subjects[Math.floor(Math.random() * subjects.length)],
        user: {
            name: names[Math.floor(Math.random() * names.length)],
            email: `user${i}@example.com`,
            avatar: null
        },
        status: statuses[Math.floor(Math.random() * statuses.length)],
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
        description: 'This is a detailed description of the issue faced by the user. It contains various information that the admin needs to review and act upon. Please resolve this as soon as possible.',
        messages: [
            { sender: 'User', time: new Date(Date.now() - 5000000).toISOString(), text: 'Hello, I need help with this issue.' },
            { sender: 'Admin', time: new Date(Date.now() - 3000000).toISOString(), text: 'Sure, we are looking into it.' }
        ]
    })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

// ── Stat Card Component ──
const StatCard = ({ title, value, icon: Icon, color, bg, accent }) => (
    <div className="bg-white rounded-xl p-4 group transition-all duration-300 relative overflow-hidden flex items-center gap-4">
        <div className={`p-3 rounded-xl ${bg} ${color} ring-1 ring-inset ${accent}`}>
            <Icon className="w-6 h-6" strokeWidth={1.8} />
        </div>
        <div>
            <h4 className="text-gray-500 text-sm font-medium mb-1">{title}</h4>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight leading-none">{value}</h2>
        </div>
        <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full ${bg} opacity-50 group-hover:scale-125 transition-transform duration-500 pointer-events-none`}></div>
    </div>
);

// ── Badge Components ──
const StatusBadge = ({ status }) => {
    const styles = {
        'Open': 'bg-blue-50 text-blue-700 border-blue-100',
        'In Progress': 'bg-amber-50 text-amber-700 border-amber-100',
        'Closed': 'bg-emerald-50 text-emerald-700 border-emerald-100'
    };
    const icons = {
        'Open': <AlertCircle className="w-3.5 h-3.5" />,
        'In Progress': <Clock className="w-3.5 h-3.5" />,
        'Closed': <CheckCircle2 className="w-3.5 h-3.5" />
    };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>
            {icons[status]} {status}
        </span>
    );
};

const PriorityBadge = ({ priority }) => {
    const styles = {
        'Low': 'bg-gray-100 text-gray-700',
        'Medium': 'bg-blue-100 text-blue-700',
        'High': 'bg-orange-100 text-orange-700',
        'Urgent': 'bg-red-100 text-red-700'
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${styles[priority]}`}>
            {priority}
        </span>
    );
};

// ── Actions Dropdown ──
const ActionsDropdown = ({ ticket, onClose, onDelete, onViewDetails, onUpdateStatus, isBottom }) => {
    const ref = useRef(null);
    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onClose]);

    return (
        <div ref={ref} className={`absolute right-0 ${isBottom ? 'bottom-full mb-1' : 'top-full mt-1'} w-48 bg-white rounded-xl shadow-lg border border-gray-200/80 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150`}>
            <button onClick={() => { onViewDetails(ticket); onClose(); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                <Eye className="w-4 h-4" /> View Details
            </button>
            <div className="my-1 border-t border-gray-100"></div>
            <div className="px-3.5 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Update Status</div>
            {['Open', 'In Progress', 'Closed'].map(status => (
                <button key={status} onClick={() => { onUpdateStatus(ticket.id, status); onClose(); }} className="w-full flex items-center gap-2.5 px-3.5 py-1.5 text-[13px] text-gray-600 hover:bg-gray-50 transition-colors">
                    <div className={`w-2 h-2 rounded-full ${status === 'Open' ? 'bg-blue-500' : status === 'In Progress' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                    Mark as {status}
                </button>
            ))}
            <div className="my-1 border-t border-gray-100"></div>
            <button onClick={() => { onDelete(ticket); onClose(); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors">
                <Trash2 className="w-4 h-4" /> Delete Ticket
            </button>
        </div>
    );
};

// ── Ticket Details Modal Component ──
const TicketModal = ({ ticket, onClose, onUpdateStatus }) => {
    if (!ticket) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-0">
                            {ticket.id}
                            <PriorityBadge priority={ticket.priority} />
                        </h2>
                        <p className="text-sm text-gray-500 mt-0.5 mb-0">Created on {new Date(ticket.createdAt).toLocaleString()}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 bg-gray-50/30 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
                    <div className="space-y-6">

                        {/* Subject & Status */}
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3 className="text-xl font-semibold mb-0 text-gray-900">{ticket.subject}</h3>
                            </div>
                            <select
                                value={ticket.status}
                                onChange={(e) => onUpdateStatus(ticket.id, e.target.value)}
                                className={`text-sm font-semibold rounded-lg px-3 py-1.5 outline-none cursor-pointer
                                    ${ticket.status === 'Open' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                        ticket.status === 'In Progress' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                            'bg-emerald-50 text-emerald-700 border-emerald-200'}`}
                            >
                                <option value="Open">Open</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Closed">Closed</option>
                            </select>
                        </div>

                        {/* User Info */}
                        <div className="bg-white p-3 rounded-xl shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg">
                                {ticket.user.name.charAt(0)}
                            </div>
                            <div>
                                <div className="font-semibold text-gray-900">{ticket.user.name}</div>
                                <div className="text-sm text-gray-500">{ticket.user.email}</div>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">Description</h4>
                            <div className="bg-white p-3 rounded-xl text-sm text-gray-700 leading-relaxed shadow-sm">
                                {ticket.description}
                            </div>
                        </div>

                        {/* Conversation */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" /> Discussion
                            </h4>
                            <div className="space-y-4">
                                {ticket.messages.map((msg, idx) => (
                                    <div key={idx} className={`flex flex-col ${msg.sender === 'Admin' ? 'items-end' : 'items-start'}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-semibold text-gray-600">{msg.sender}</span>
                                            <span className="text-[10px] text-gray-400">{new Date(msg.time).toLocaleTimeString()}</span>
                                        </div>
                                        <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm ${msg.sender === 'Admin' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'}`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer Reply Box */}
                <div className="p-4 border-t border-gray-100 bg-white">
                    <div className="flex items-center gap-3">
                        <input type="text" placeholder="Type a reply..." className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
                        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function SupportTicket() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeStatusFilter, setActiveStatusFilter] = useState('All');
    const [activePriorityFilter, setActivePriorityFilter] = useState('All');

    const [openDropdown, setOpenDropdown] = useState(null);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    const itemsPerPage = 10;

    useEffect(() => {
        // Simulate API fetch
        const fetchTickets = async () => {
            setLoading(true);
            setTimeout(() => {
                const mockData = generateMockTickets(45); // Generate 45 dummy tickets
                setTickets(mockData);
                setLoading(false);
            }, 800);
        };
        fetchTickets();
    }, []);

    const handleDeleteTicket = (ticket) => {
        setTickets(prev => prev.filter(t => t.id !== ticket.id));
        toast.success(`Ticket ${ticket.id} deleted successfully`);
    };

    const handleUpdateStatus = (ticketId, newStatus) => {
        setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
        if (selectedTicket && selectedTicket.id === ticketId) {
            setSelectedTicket(prev => ({ ...prev, status: newStatus }));
        }
        toast.success(`Ticket status updated to ${newStatus}`);
    };

    // Filter Logic
    const filteredTickets = tickets.filter(ticket => {
        const matchSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.user.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = activeStatusFilter === 'All' || ticket.status === activeStatusFilter;
        const matchPriority = activePriorityFilter === 'All' || ticket.priority === activePriorityFilter;
        return matchSearch && matchStatus && matchPriority;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredTickets.length / itemsPerPage) || 1;
    const paginatedTickets = filteredTickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, activeStatusFilter, activePriorityFilter]);

    // Stats
    const stats = {
        total: tickets.length,
        open: tickets.filter(t => t.status === 'Open').length,
        inprogress: tickets.filter(t => t.status === 'In Progress').length,
        closed: tickets.filter(t => t.status === 'Closed').length
    };

    return (
        <div className="animate-in fade-in duration-500 max-w-[1600px] mx-auto w-full p-2 md:p-4 lg:p-4">
            {/* Header Section */}
            <div className="mb-8">
                <h1 className="text-2xl md:text-2xl font-bold text-gray-900 mb-2">Support Tickets</h1>
                <p className="text-sm text-gray-500 mb-0">Manage user inquiries, issues, and support requests efficiently.</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                <StatCard title="Total Tickets" value={stats.total} icon={Ticket} color="text-indigo-600" bg="bg-indigo-50" accent="ring-indigo-100" />
                <StatCard title="Open" value={stats.open} icon={AlertCircle} color="text-blue-600" bg="bg-blue-50" accent="ring-blue-100" />
                <StatCard title="In Progress" value={stats.inprogress} icon={Clock} color="text-amber-600" bg="bg-amber-50" accent="ring-amber-100" />
                <StatCard title="Closed" value={stats.closed} icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-50" accent="ring-emerald-100" />
            </div>

            {/* Filters and Search Bar Row */}
            <div className="bg-white p-4 rounded-2xl mb-6 flex flex-col lg:flex-row gap-4 justify-between lg:items-center">

                {/* Status Filters */}
                <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
                    {['All', 'Open', 'In Progress', 'Closed'].map(status => (
                        <button
                            key={status}
                            onClick={() => setActiveStatusFilter(status)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${activeStatusFilter === status
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                                }`}
                        >
                            {status} {status !== 'All' && `(${stats[status.toLowerCase().replace(' ', '')]})`}
                        </button>
                    ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Priority Filter */}
                    <div className="relative">
                        <select
                            value={activePriorityFilter}
                            onChange={(e) => setActivePriorityFilter(e.target.value)}
                            className="w-full sm:w-auto appearance-none bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium cursor-pointer"
                        >
                            <option value="All">All Priorities</option>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Urgent">Urgent</option>
                        </select>
                    </div>

                    {/* Search */}
                    <div className="relative group w-full sm:w-[260px]">
                        <input
                            type="text"
                            placeholder="Search by ID, subject or user..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-4 pr-10 py-2.5 w-full bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-400"
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className={`bg-white rounded-2xl ${openDropdown !== null ? '' : 'overflow-hidden'}`}>
                <div className={`min-h-[300px] ${openDropdown !== null ? '' : 'overflow-x-auto'}`}>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Ticket Details
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Priority
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4">
                                            <div className="space-y-2"><div className="h-4 w-40 bg-gray-200 rounded"></div><div className="h-3 w-24 bg-gray-200 rounded"></div></div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                                                <div className="space-y-2"><div className="h-4 w-24 bg-gray-200 rounded"></div><div className="h-3 w-32 bg-gray-200 rounded"></div></div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4"><div className="h-5 w-16 bg-gray-200 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 w-24 bg-gray-200 rounded-full"></div></td>
                                        <td className="px-6 py-4 text-center"><div className="h-8 w-8 bg-gray-200 rounded-lg mx-auto"></div></td>
                                    </tr>
                                ))
                            ) : paginatedTickets.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4 border border-gray-100">
                                            <Ticket className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <h3 className="text-gray-900 font-semibold text-lg">No tickets found</h3>
                                        <p className="text-gray-500 text-sm mt-1">Try adjusting your filters or search criteria.</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedTickets.map((ticket, idx) => {
                                    const isBottom = idx >= paginatedTickets.length - 2 && paginatedTickets.length > 3;

                                    return (
                                        <tr key={ticket.id} className="hover:bg-gray-50/80 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1 cursor-pointer hover:text-indigo-600" onClick={() => setSelectedTicket(ticket)}>
                                                    {ticket.subject}
                                                </div>
                                                <div className="text-xs text-gray-500 font-medium flex items-center gap-2">
                                                    <span className="text-gray-400">#{ticket.id}</span>
                                                    •
                                                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs border border-indigo-100">
                                                        {ticket.user.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-gray-900 text-sm">{ticket.user.name}</div>
                                                        <div className="text-xs text-gray-500">{ticket.user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <PriorityBadge priority={ticket.priority} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={ticket.status} />
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="relative inline-block text-left">
                                                    <button
                                                        onClick={() => setOpenDropdown(openDropdown === ticket.id ? null : ticket.id)}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all focus:outline-none"
                                                    >
                                                        <MoreVertical className="w-5 h-5" />
                                                    </button>
                                                    {openDropdown === ticket.id && (
                                                        <ActionsDropdown
                                                            ticket={ticket}
                                                            onClose={() => setOpenDropdown(null)}
                                                            onDelete={handleDeleteTicket}
                                                            onViewDetails={setSelectedTicket}
                                                            onUpdateStatus={handleUpdateStatus}
                                                            isBottom={isBottom}
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
                {!loading && filteredTickets.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white">
                        <div className="text-sm text-gray-500">
                            Showing <span className="font-medium text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-gray-900">{Math.min(currentPage * itemsPerPage, filteredTickets.length)}</span> of <span className="font-medium text-gray-900">{filteredTickets.length}</span> tickets
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-40 disabled:hover:bg-transparent border border-transparent hover:border-gray-200"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) pageNum = i + 1;
                                    else if (currentPage <= 3) pageNum = i + 1;
                                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                    else pageNum = currentPage - 2 + i;

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`w-8 h-8 flex items-center justify-center text-sm font-semibold rounded-lg transition-all ${currentPage === pageNum
                                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                                {totalPages > 5 && currentPage < totalPages - 2 && (
                                    <>
                                        <span className="text-gray-400 px-1">...</span>
                                        <button
                                            onClick={() => setCurrentPage(totalPages)}
                                            className="w-8 h-8 flex items-center justify-center text-sm font-semibold rounded-lg text-gray-600 hover:bg-gray-100 transition-all"
                                        >
                                            {totalPages}
                                        </button>
                                    </>
                                )}
                            </div>

                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-40 disabled:hover:bg-transparent border border-transparent hover:border-gray-200"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Ticket Details Modal */}
            <TicketModal
                ticket={selectedTicket}
                onClose={() => setSelectedTicket(null)}
                onUpdateStatus={handleUpdateStatus}
            />
        </div>
    );
}
