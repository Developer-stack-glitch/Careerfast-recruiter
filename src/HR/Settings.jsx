import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell,
    Shield,
    Users,
    Save,
    CheckCircle2,
    Trash2,
    Plus,
    Mail,
    Eye,
    EyeOff
} from 'lucide-react';
import {
    sendOtp,
    verifyOtp,
    forgotPassword,
    getTeamMembers,
    addTeamMember,
    deleteTeamMember
} from '../ApiService/action';
import { Spin } from 'antd';
import toast from 'react-hot-toast';
import { officialEmailValidator } from '../Common/Validation';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('recruiters');
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // User details from localStorage
    const [userId, setUserId] = useState(null);
    const [userEmail, setUserEmail] = useState('');

    // Security Form state
    const [securityData, setSecurityData] = useState({
        newPassword: '',
        otp: ''
    });
    const [otpSent, setOtpSent] = useState(false);
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Team members state
    const [teamMembers, setTeamMembers] = useState([]);
    const [newRecruiter, setNewRecruiter] = useState({ name: '', email: '', role: 'Recruiter' });
    const [isAddingRecruiter, setIsAddingRecruiter] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState(null);

    // Notification settings state
    const [notifications, setNotifications] = useState({
        emailAlerts: true,
        newApplicants: true,
        marketingEmails: false,
        pushNotifications: true
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const stored = localStorage.getItem("loginDetails");
                if (stored) {
                    const loginDetails = JSON.parse(stored);
                    setUserId(loginDetails.id);
                    setUserEmail(loginDetails.email);

                    fetchTeamMembers();
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const fetchTeamMembers = async () => {
        try {
            const res = await getTeamMembers();
            if (res?.data?.data) {
                setTeamMembers(res.data.data);
            }
        } catch (error) {
            console.error("Error fetching team:", error);
        }
    };

    const tabs = [
        { id: 'recruiters', label: 'Manage Recruiters', icon: Users, description: 'Add or remove sub-recruiters from your team' },
        { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Configure how you receive alerts and updates' },
        { id: 'security', label: 'Security', icon: Shield, description: 'Manage your password and security preferences' }
    ];

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            if (activeTab === 'notifications') {
                // Just simulate saving for notifications as there's no backend API in action.js
                setTimeout(() => {
                    setShowSuccess(true);
                    setTimeout(() => setShowSuccess(false), 3000);
                }, 800);
            }
        } catch (error) {
            toast.error("Failed to save changes.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSendOtp = async () => {
        setIsSendingOtp(true);
        try {
            await sendOtp({ email: userEmail });
            toast.success("OTP sent to your email!");
            setOtpSent(true);
        } catch (error) {
            const errorMsg = error?.response?.data?.error || error?.response?.data?.message || "Failed to send OTP.";
            toast.error(errorMsg);
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (!securityData.otp || !securityData.newPassword) {
            toast.error("Please enter both OTP and new password.");
            return;
        }
        setIsSaving(true);
        try {
            // First verify OTP
            await verifyOtp({ email: userEmail, otp: securityData.otp });
            // Then change password
            await forgotPassword({ email: userEmail, password: securityData.newPassword });

            toast.success("Password changed successfully!");
            setSecurityData({ newPassword: '', otp: '' });
            setOtpSent(false);
        } catch (error) {
            const errorMsg = error?.response?.data?.error || error?.response?.data?.message || "Failed to verify OTP or change password.";
            toast.error(errorMsg);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddRecruiter = async (e) => {
        e.preventDefault();
        if (!newRecruiter.name || !newRecruiter.email) return;

        const emailError = officialEmailValidator(newRecruiter.email);
        if (emailError) {
            toast.error(emailError);
            return;
        }

        setIsAddingRecruiter(true);
        try {
            await addTeamMember(newRecruiter);
            toast.success("Recruiter added successfully!");
            setNewRecruiter({ name: '', email: '', role: 'Recruiter' });
            fetchTeamMembers(); // refresh list
        } catch (error) {
            const errorMsg = error?.response?.data?.message || "Failed to add team member.";
            toast.error(errorMsg);
        } finally {
            setIsAddingRecruiter(false);
        }
    };

    const handleRemoveRecruiter = async (id) => {
        try {
            await deleteTeamMember(id);
            setTeamMembers(teamMembers.filter(member => member.id !== id));
            toast.success("Recruiter removed successfully.");
            setMemberToDelete(null);
        } catch (error) {
            const errorMsg = error?.response?.data?.message || "Failed to remove team member.";
            toast.error(errorMsg);
        }
    };

    const renderSecuritySettings = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6 max-w-lg"
        >
            <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-orange-800 flex items-center text-sm">
                    <Shield className="w-4 h-4 mr-2" />
                    Change Password
                </h4>
                <p className="text-xs text-orange-700 mt-1 mb-0">
                    To change your password, we'll send a one-time password (OTP) to your registered email address ({userEmail}).
                </p>
            </div>

            {!otpSent ? (
                <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isSendingOtp}
                    className="flex items-center px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors disabled:opacity-70"
                >
                    {isSendingOtp ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                        <Mail className="w-4 h-4 mr-2" />
                    )}
                    {isSendingOtp ? 'Sending OTP...' : 'Send OTP to Email'}
                </button>
            ) : (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP</label>
                        <input
                            type="text"
                            placeholder="6-digit code"
                            value={securityData.otp}
                            onChange={(e) => setSecurityData({ ...securityData, otp: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter new password"
                                value={securityData.newPassword}
                                onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );

    const renderManageRecruiters = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
        >
            {/* Add new recruiter form */}
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                    <Plus className="w-4 h-4 mr-2 text-blue-600" /> Add Team Member
                </h3>
                <div className="flex flex-col md:flex-row gap-4">
                    <input
                        type="text"
                        placeholder="Full Name"
                        value={newRecruiter.name}
                        onChange={(e) => setNewRecruiter({ ...newRecruiter, name: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={newRecruiter.email}
                        onChange={(e) => setNewRecruiter({ ...newRecruiter, email: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                    <button
                        type="button"
                        onClick={handleAddRecruiter}
                        disabled={isAddingRecruiter || !newRecruiter.name || !newRecruiter.email}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-70 whitespace-nowrap"
                    >
                        {isAddingRecruiter ? 'Adding...' : 'Invite Member'}
                    </button>
                </div>
            </div>

            {/* Recruiter List */}
            <div>
                <h3 className="text-base font-semibold text-gray-900 mb-4">Active Team Members</h3>
                {teamMembers.length === 0 ? (
                    <div className="text-center py-10 bg-white border border-gray-200 border-dashed rounded-xl">
                        <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">No team members added yet.</p>
                    </div>
                ) : (
                    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="py-3 px-5 text-xs font-semibold text-gray-600 uppercase">Name</th>
                                    <th className="py-3 px-5 text-xs font-semibold text-gray-600 uppercase">Email</th>
                                    <th className="py-3 px-5 text-xs font-semibold text-gray-600 uppercase">Role</th>
                                    <th className="py-3 px-5 text-xs font-semibold text-gray-600 uppercase text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teamMembers.map((member, index) => (
                                    <tr key={member.id || index} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-5 text-sm text-gray-900 font-medium capitalize">
                                            {member.name || (member.first_name && member.last_name ? `${member.first_name} ${member.last_name}` : member.email.split('@')[0])}
                                        </td>
                                        <td className="py-3 px-5 text-sm text-gray-600">{member.email}</td>
                                        <td className="py-3 px-5 text-sm">
                                            <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-medium">
                                                {member.role || 'Recruiter'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-5 text-right">
                                            <button
                                                type="button"
                                                onClick={() => setMemberToDelete(member)}
                                                className="text-gray-400 hover:text-red-600 transition-colors"
                                                title="Remove Member"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </motion.div>
    );

    const renderNotifications = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
        >
            <div className="max-w-2xl border border-gray-100 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-white">
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900">Email Alerts</h4>
                        <p className="text-xs text-gray-500 mt-1 mb-0">Receive daily summary of platform activities.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={notifications.emailAlerts}
                            onChange={() => setNotifications({ ...notifications, emailAlerts: !notifications.emailAlerts })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-white">
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900">New Applicants</h4>
                        <p className="text-xs text-gray-500 mt-1 mb-0">Get instantly notified when someone applies to your job.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={notifications.newApplicants}
                            onChange={() => setNotifications({ ...notifications, newApplicants: !notifications.newApplicants })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-white">
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900">Push Notifications</h4>
                        <p className="text-xs text-gray-500 mt-1 mb-0 mb-0">Show browser push notifications for important updates.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={notifications.pushNotifications}
                            onChange={() => setNotifications({ ...notifications, pushNotifications: !notifications.pushNotifications })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                <div className="flex items-center justify-between p-3 bg-white">
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900">Marketing & Promos</h4>
                        <p className="text-xs text-gray-500 mt-1 mb-0">Receive offers, product updates, and newsletters.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={notifications.marketingEmails}
                            onChange={() => setNotifications({ ...notifications, marketingEmails: !notifications.marketingEmails })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>
            </div>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-gray-50/50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                    <p className="text-gray-500 mt-2">Manage your account preferences and settings.</p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <Spin size="large" />
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Sidebar Navigation */}
                        <div className="w-full lg:w-72 flex-shrink-0">
                            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    const isActive = activeTab === tab.id;

                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`w-full flex items-start p-4 text-left transition-all ${isActive
                                                ? 'bg-blue-50 border-l-4 border-blue-600'
                                                : 'border-l-4 border-transparent hover:bg-gray-50'
                                                }`}
                                        >
                                            <Icon className={`w-5 h-5 mt-0.5 mr-3 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                                            <div>
                                                <span className={`block font-medium ${isActive ? 'text-blue-900' : 'text-gray-700'}`}>
                                                    {tab.label}
                                                </span>
                                                <span className="text-xs text-gray-500 mt-1 mb-0 hidden md:block">
                                                    {tab.description}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <div className="flex-1">
                            <div className="bg-white rounded-xl border border-gray-100 p-6 md:p-8">
                                <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-6">
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-900">
                                            {tabs.find(t => t.id === activeTab)?.label}
                                        </h2>
                                        <p className="text-sm text-gray-500 mt-1 mb-0">
                                            {tabs.find(t => t.id === activeTab)?.description}
                                        </p>
                                    </div>

                                    <AnimatePresence>
                                        {showSuccess && (
                                            <motion.div
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                className="flex items-center text-green-600 bg-green-50 px-4 py-2 rounded-lg"
                                            >
                                                <CheckCircle2 className="w-5 h-5 mr-2" />
                                                <span className="text-sm font-medium">Saved successfully!</span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <form onSubmit={
                                    activeTab === 'security'
                                        ? handleChangePassword
                                        : activeTab === 'recruiters'
                                            ? (e) => e.preventDefault() // Form logic handled internally
                                            : handleSaveSettings
                                }>
                                    <AnimatePresence mode="wait">
                                        <div key={activeTab}>
                                            {activeTab === 'recruiters' && renderManageRecruiters()}
                                            {activeTab === 'notifications' && renderNotifications()}
                                            {activeTab === 'security' && renderSecuritySettings()}
                                        </div>
                                    </AnimatePresence>

                                    {(activeTab === 'notifications' || (activeTab === 'security' && otpSent)) && (
                                        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={isSaving}
                                                className="flex items-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                                            >
                                                {isSaving ? (
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                                ) : (
                                                    <Save className="w-5 h-5 mr-2" />
                                                )}
                                                {isSaving
                                                    ? 'Saving...'
                                                    : activeTab === 'security'
                                                        ? 'Change Password'
                                                        : 'Save Changes'
                                                }
                                            </button>
                                        </div>
                                    )}
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {memberToDelete && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-100"
                        >
                            <div className="flex items-start mb-4">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mr-4">
                                    <Trash2 className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Remove Team Member</h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Are you sure you want to remove <span className="font-semibold text-gray-700">{memberToDelete.name || (memberToDelete.first_name && memberToDelete.last_name ? `${memberToDelete.first_name} ${memberToDelete.last_name}` : memberToDelete.email?.split('@')[0])}</span> from your team? This action cannot be undone.
                                    </p>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setMemberToDelete(null)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveRecruiter(memberToDelete.id)}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                                >
                                    Remove Member
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Settings;
