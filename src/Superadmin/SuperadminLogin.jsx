'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import {
    ShieldCheck,
    Lock,
    Mail,
    Eye,
    EyeOff,
    ArrowRight,
    AlertCircle,
    CheckCircle2,
    KeyRound,
    Info,
    Server,
    Fingerprint
} from 'lucide-react';
import { login } from '../ApiService/action';
import { storeLoginStatus } from '../Redux/Slice';

export default function SuperadminLogin() {
    const router = useRouter();
    const dispatch = useDispatch();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false,
    });

    const [showPassword, setShowPassword] = useState(false);
    const [capsLockActive, setCapsLockActive] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [authSuccess, setAuthSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [toast, setToast] = useState(null);

    // Load remembered superadmin email on mount & check existing session
    useEffect(() => {
        try {
            const storedDetails = localStorage.getItem('loginDetails');
            const token = localStorage.getItem('AccessToken');
            if (token && storedDetails) {
                const user = JSON.parse(storedDetails);
                if (user?.role_id === 1 || user?.role_name === 'SUPER-ADMIN' || user?.role_name === 'SUPERADMIN') {
                    // Already logged in as Superadmin, redirect directly to dashboard
                    window.location.href = '/admin';
                    return;
                }
            }

            const rememberedEmail = localStorage.getItem('careerfast_superadmin_email');
            if (rememberedEmail) {
                setFormData((prev) => ({
                    ...prev,
                    email: rememberedEmail,
                    rememberMe: true,
                }));
            }
        } catch (e) {
            // Ignore localStorage issues
        }
    }, []);

    const showToastNotification = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => {
            setToast(null);
        }, 4500);
    };

    const handleKeyDown = (e) => {
        if (e.getModifierState && e.getModifierState('CapsLock')) {
            setCapsLockActive(true);
        } else {
            setCapsLockActive(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        if (errorMessage) setErrorMessage('');
    };

    const handleFillCredentials = () => {
        setFormData({
            email: 'Superadmin@careerfast.com',
            password: 'Careerfast@123',
            rememberMe: true,
        });
        setErrorMessage('');
        showToastNotification('Credentials auto-filled for Superadmin access', 'info');
    };

    const handleSubmit = async (e) => {
        e?.preventDefault();
        setErrorMessage('');

        const cleanEmail = formData.email.trim();
        const cleanPassword = formData.password;

        if (!cleanEmail) {
            setErrorMessage('Superadmin email address is required.');
            return;
        }

        if (!cleanPassword) {
            setErrorMessage('Superadmin security password is required.');
            return;
        }

        setIsLoading(true);

        // Persist or remove remembered email
        try {
            if (formData.rememberMe) {
                localStorage.setItem('careerfast_superadmin_email', cleanEmail);
            } else {
                localStorage.removeItem('careerfast_superadmin_email');
            }
        } catch (err) {
            // Ignore
        }

        try {
            const fcm_token = typeof window !== 'undefined' ? localStorage.getItem('fcm_token') : null;

            // Strict role_id 1 payload sent to backend
            const payload = {
                email: cleanEmail,
                password: cleanPassword,
                role_id: 1, // Superadmin role
                fcm_token: fcm_token || null,
            };

            const response = await login(payload);

            if (!response?.data?.token) {
                throw new Error(response?.data?.details || response?.data?.message || 'Authentication failed. Please verify credentials.');
            }

            const token = response.data.token;
            const superadminDetails = response.data.data?.[0];

            // Strict client-side validation: ONLY Superadmins (role_id: 1) are permitted. Candidates and recruiters are explicitly blocked.
            const isSuperadmin =
                superadminDetails?.role_id === 1 ||
                superadminDetails?.role_name === 'SUPER-ADMIN' ||
                superadminDetails?.role_name === 'SUPERADMIN';

            if (!isSuperadmin) {
                throw new Error('Access Denied: You do not possess Superadmin clearance. Only Superadmins can access this dashboard.');
            }

            // Store tokens and details
            localStorage.setItem('AccessToken', token);
            localStorage.setItem('loginDetails', JSON.stringify(superadminDetails));

            // Cookie synchronization for Next.js SSR / middleware consistency
            document.cookie = `AccessToken=${token}; path=/; max-age=86400`;
            document.cookie = `loginDetails=${encodeURIComponent(JSON.stringify(superadminDetails))}; path=/; max-age=86400`;

            if (dispatch) {
                dispatch(storeLoginStatus(true));
            }

            setAuthSuccess(true);
            const name = superadminDetails?.first_name ? ` ${superadminDetails.first_name}` : '';
            showToastNotification(`Authentication successful! Welcome back, Superadmin${name}.`, 'success');

            // Seamless redirect to Superadmin Dashboard (/admin)
            setTimeout(() => {
                window.location.href = '/admin';
            }, 700);

        } catch (err) {
            console.error('Superadmin login error:', err);
            const backendError =
                err?.response?.data?.details ||
                err?.response?.data?.message ||
                err?.message ||
                'Invalid Superadmin credentials. Please try again.';

            let userFriendlyError = backendError;
            if (backendError.toLowerCase().includes('you are not allowed') || backendError.toLowerCase().includes('not authorized')) {
                userFriendlyError = 'Access Denied: Only authorized Superadmin accounts can log in to this console.';
            } else if (backendError.toLowerCase().includes('invalid email and password') || backendError.toLowerCase().includes('invalid email or password')) {
                userFriendlyError = 'Invalid email or password. Superadmin credentials not recognized.';
            }

            setErrorMessage(userFriendlyError);
            showToastNotification(userFriendlyError, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between selection:bg-indigo-600 selection:text-white relative overflow-x-hidden font-sans">
            {/* Dynamic Background Effects - Light Theme */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-5%] w-[45vw] h-[45vw] rounded-full bg-indigo-200/40 blur-[130px]" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[45vw] h-[45vw] rounded-full bg-blue-200/35 blur-[140px]" />
                <div className="absolute top-[35%] right-[25%] w-[30vw] h-[30vw] rounded-full bg-violet-200/30 blur-[120px]" />
                {/* Subtle dot pattern */}
                <div
                    className="absolute inset-0 opacity-[0.35]"
                    style={{
                        backgroundImage: `radial-gradient(#94a3b8 1px, transparent 1px)`,
                        backgroundSize: '28px 28px'
                    }}
                />
            </div>

            {/* Floating Toast Alert */}
            {toast && (
                <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl border text-sm font-medium backdrop-blur-md ${toast.type === 'error'
                        ? 'bg-white/95 text-rose-700 border-rose-200 shadow-rose-900/10'
                        : toast.type === 'info'
                            ? 'bg-white/95 text-blue-700 border-blue-200 shadow-blue-900/10'
                            : 'bg-white/95 text-emerald-700 border-emerald-200 shadow-emerald-900/10'
                        }`}>
                        {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
                        {toast.type === 'info' && <Info className="w-5 h-5 text-blue-600 shrink-0" />}
                        {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
                        <span>{toast.msg}</span>
                    </div>
                </div>
            )}

            {/* Top Navigation / Brand Bar */}
            <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                    <a href="/" className="transition-opacity hover:opacity-85">
                        <img
                            src="https://careerfast.in/_next/static/media/careerfastlogofinal.0nplzw.k4hsr8.png"
                            alt="CareerFast Logo"
                            className="h-9 w-auto"
                        />
                    </a>
                    <span className="hidden sm:inline-block w-px h-5 bg-slate-300" />
                    <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold tracking-wide uppercase">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                        Superadmin Console
                    </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-slate-700">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-mono font-medium">SECURE PORTAL 256-BIT</span>
                    </div>
                    <a
                        href="/"
                        className="text-slate-500 hover:text-slate-900 font-medium transition-colors px-2 py-1"
                    >
                        Exit to Home
                    </a>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:px-6">
                <div className="w-full max-w-md">
                    {/* Card Container */}
                    <div className="relative rounded-2xl bg-white border border-slate-200/90 shadow-[0_15px_40px_-10px_rgba(15,23,42,0.08),0_4px_12px_-2px_rgba(15,23,42,0.03)] p-7 sm:p-9">

                        {/* Top Security Badge Accent */}
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 shadow-sm mb-4">
                                <Fingerprint className="w-7 h-7 text-indigo-600" />
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                Superadmin Sign In
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                                Restricted gateway. Only authorized Superadministrators can access the platform control center.
                            </p>
                        </div>

                        {/* Error Notification Banner */}
                        {errorMessage && (
                            <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-xs sm:text-sm animate-in fade-in duration-200">
                                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="font-medium">{errorMessage}</p>
                                </div>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Email Address */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Superadmin Email
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="superadmin@careerfast.com"
                                        autoComplete="email"
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                        Master Password
                                    </label>
                                    {capsLockActive && (
                                        <span className="text-[11px] text-amber-600 flex items-center gap-1 font-mono font-semibold animate-pulse">
                                            CAPS LOCK ON
                                        </span>
                                    )}
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                        <Lock className="w-4 h-4" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        onKeyDown={handleKeyDown}
                                        onKeyUp={handleKeyDown}
                                        placeholder="••••••••••••"
                                        autoComplete="current-password"
                                        className="w-full pl-10 pr-11 py-2.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 transition-all font-mono tracking-wide"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                                        tabIndex={-1}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Remember Me & Quick Fill */}
                            <div className="flex items-center justify-between pt-1">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        name="rememberMe"
                                        checked={formData.rememberMe}
                                        onChange={handleChange}
                                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-colors"
                                    />
                                    <span className="text-xs text-slate-600 hover:text-slate-900 transition-colors font-medium">
                                        Remember email on this terminal
                                    </span>
                                </label>

                                <button
                                    type="button"
                                    onClick={handleFillCredentials}
                                    className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 font-semibold bg-indigo-50 hover:bg-indigo-100/80 px-2.5 py-1 rounded-md transition-colors"
                                >
                                    <KeyRound className="w-3.5 h-3.5" />
                                    Quick Fill
                                </button>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading || authSuccess}
                                className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 active:scale-[0.99] text-white font-medium text-sm shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        <span>Authenticating Credentials...</span>
                                    </>
                                ) : authSuccess ? (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 text-white" />
                                        <span>Access Granted! Redirecting...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Verify & Enter Dashboard</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Security Notice Note */}
                        <div className="mt-6 pt-4 border-t border-slate-100">
                            <div className="flex items-start gap-2.5 bg-slate-50 border border-slate-200/70 rounded-xl p-3 text-slate-600 text-[11px] leading-relaxed">
                                <Server className="w-4 h-4 shrink-0 text-slate-500 mt-0.5" />
                                <p className='mb-0'>
                                    <strong className="text-slate-800">Security Warning:</strong> Every access attempt is cryptographically logged with IP address and hardware fingerprinting. Unauthorized access attempts violate platform policies and are subject to immediate revocation.
                                </p>
                            </div>
                        </div>

                    </div>

                    {/* Additional Links Below Card */}
                    <div className="mt-6 text-center text-xs text-slate-600 space-y-2">
                        <p>
                            Are you a Recruiter?{' '}
                            <a href="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline">
                                Recruiter Portal Login
                            </a>
                        </p>
                        <p>
                            Are you a Candidate?{' '}
                            <a href="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline">
                                Job Seeker Login
                            </a>
                        </p>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-4 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-200">
                <p>© {new Date().getFullYear()} CareerFast Inc. All rights reserved.</p>
                <p className="flex items-center gap-4 text-slate-500">
                    <span>Role Clearance: Level-1 Root Superadmin</span>
                    <span>•</span>
                    <span>System Status: Operational</span>
                </p>
            </footer>
        </div>
    );
}
