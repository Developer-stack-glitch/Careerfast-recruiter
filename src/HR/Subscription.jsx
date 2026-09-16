import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Crown,
    CheckCircle2,
    Zap,
    ArrowRight,
    Clock,
    Lock,
    ShieldCheck,
    Star,
    Send,
    Layers,
    Headphones,
    BarChart2,
    Folder,
    Key,
    Palette,
    RotateCcw
} from 'lucide-react';
import { getBillingPlans } from '../ApiService/action';
import { Spin } from 'antd';
import toast from 'react-hot-toast';

const Subscription = () => {
    const [billingPlans, setBillingPlans] = useState([]);
    const [loadingPlans, setLoadingPlans] = useState(true);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await getBillingPlans(token);
                const plansData = response.data?.data || response.data?.plans || response.data || [];
                setBillingPlans(Array.isArray(plansData) ? plansData : []);
            } catch (error) {
                console.error("Error fetching billing plans:", error);
                toast.error("Failed to load billing plans.");
            } finally {
                setLoadingPlans(false);
            }
        };
        fetchPlans();
    }, []);

    const proFeatures = [
        { icon: Headphones, text: "Priority support" },
        { icon: BarChart2, text: "Advanced analytics" },
        { icon: Folder, text: "Exclusive templates" },
        { icon: Key, text: "Early access to features" },
        { icon: Palette, text: "Custom branding" },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    // Helper to extract a list of features for the plan (mocking if not available)
    const getPlanFeatures = (plan) => {
        if (Array.isArray(plan.features)) return plan.features;
        // Mock features based on plan name if DB doesn't have an array
        if (plan.name.toLowerCase().includes("basic")) {
            return ["Post unlimited jobs", "Basic candidate filtering", "Standard job visibility", "Email notifications"];
        }
        if (plan.name.toLowerCase().includes("premium") || plan.name.toLowerCase().includes("pro")) {
            return ["Everything in Basic", "Featured jobs (Top of listings)", "Priority candidate matching", "Advanced analytics", "Early access to new features"];
        }
        if (plan.name.toLowerCase().includes("bulk")) {
            return ["Everything in Premium", "Bulk job posting", "Dedicated account manager", "Custom branding", "API access"];
        }
        // Fallback
        return ["Post jobs", "Candidate filtering", "Standard visibility"];
    };

    const getPlanIcon = (planName) => {
        const lower = planName.toLowerCase();
        if (lower.includes('basic')) return <Send className="w-6 h-6" />;
        if (lower.includes('premium') || lower.includes('pro')) return <Star className="w-6 h-6" />;
        if (lower.includes('bulk')) return <Layers className="w-6 h-6" />;
        return <Star className="w-6 h-6" />;
    };

    const getPlanIconColor = (planName) => {
        const lower = planName.toLowerCase();
        if (lower.includes('basic')) return "bg-blue-50 text-blue-500";
        if (lower.includes('premium') || lower.includes('pro')) return "bg-orange-50 text-orange-400";
        if (lower.includes('bulk')) return "bg-blue-50 text-[#0A66C2]";
        return "bg-gray-50 text-gray-500";
    };

    return (
        <motion.div
            className="p-6 md:p-10 mx-auto font-sans"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            {/* Header Section */}
            <motion.div variants={itemVariants} className="mb-6 flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                    <Crown className="w-6 h-6" strokeWidth={2.5} />
                </div>
                <div>
                    <h1 className="text-[24px] font-bold text-gray-900 tracking-tight leading-tight mb-1">Careerfast Pro Subscription</h1>
                    <p className="text-gray-500 text-[15px] mb-0">Manage your subscription, billing history, and premium features.</p>
                </div>
            </motion.div>

            {/* Current Status Banner */}
            <motion.div variants={itemVariants} className="mb-10 relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-6 text-white shadow-lg">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-transparent border-[1.5px] border-white/30 rounded-full flex items-center justify-center relative">
                            <div className="absolute inset-2 bg-white/10 rounded-full"></div>
                            <ShieldCheck className="w-8 h-8 text-white z-10" strokeWidth={1.5} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold mb-1 tracking-wide">No Active Subscription</h2>
                            <p className="text-white/80 text-[15px] mb-4">Upgrade to unlock premium features and recruiting tools.</p>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full text-xs font-medium border border-white/10">
                                    <Clock className="w-3.5 h-3.5" /> Cancel anytime
                                </div>
                                <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full text-xs font-medium border border-white/10">
                                    <Lock className="w-3.5 h-3.5" /> Secure payment
                                </div>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => document.getElementById("billing-plans-section")?.scrollIntoView({ behavior: 'smooth' })}
                        className="flex items-center justify-center gap-2 bg-white text-blue-600 px-6 py-2 rounded-full font-bold hover:bg-gray-50 transition-all shadow-md whitespace-nowrap"
                    >
                        <Zap className="w-4 h-4 fill-current" /> Go Pro Now
                    </button>
                </div>
            </motion.div>

            {/* Pro Features */}
            <motion.div variants={itemVariants} className="mb-14">
                <h3 className="text-[13px] font-bold text-gray-500 uppercase tracking-widest mb-4">Pro Features Included</h3>
                <div className="flex flex-wrap gap-3">
                    {proFeatures.map((feature, idx) => {
                        const Icon = feature.icon;
                        return (
                            <div key={idx} className="flex items-center gap-3 bg-white border border-gray-200 px-4 py-2.5 rounded-xl text-[14px] font-semibold text-gray-700">
                                <Icon className="w-5 h-5 text-blue-500" strokeWidth={2} />
                                {feature.text}
                            </div>
                        );
                    })}
                </div>
            </motion.div>

            {/* Dynamic Plans Section */}
            <motion.div variants={itemVariants} id="billing-plans-section" className="mb-12">
                <div className="flex justify-between items-end mb-8">
                    <h3 className="text-[22px] font-bold text-gray-900 mb-0">Available Plans</h3>
                    <div className="flex items-center gap-2 text-[14px] text-gray-500 font-medium">
                        <ShieldCheck className="w-5 h-5 text-green-500" />
                        All plans include <span className="font-semibold text-gray-700">7-day free trial</span>
                    </div>
                </div>

                {loadingPlans ? (
                    <div className="flex items-center justify-center py-20">
                        <Spin size="large" />
                    </div>
                ) : billingPlans.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                        {billingPlans.map((plan) => {
                            const isPro = plan.name.toLowerCase().includes("premium") || plan.name.toLowerCase().includes("pro");
                            const features = getPlanFeatures(plan);

                            return (
                                <motion.div
                                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                                    key={plan.id}
                                    className={`relative bg-white rounded-3xl ${isPro ? 'border-2 border-blue-500 shadow-xl shadow-blue-100/50' : 'border border-gray-200'} p-8 flex flex-col`}
                                >
                                    {isPro && (
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-[10px] font-bold tracking-widest px-6 py-1.5 rounded-b-lg rounded-t-sm uppercase">
                                            Most Popular
                                        </div>
                                    )}

                                    <div className="mb-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${getPlanIconColor(plan.name)}`}>
                                            {getPlanIcon(plan.name)}
                                        </div>
                                        <h4 className="text-[20px] font-bold text-gray-900 mb-2">{plan.name}</h4>
                                        <p className="text-gray-500 text-[14px] leading-relaxed mb-0">
                                            {plan.description || "Perfect for hiring top talent quickly."}
                                        </p>
                                    </div>

                                    <div className="mb-6 flex items-baseline gap-1">
                                        <span className="text-[36px] font-bold text-gray-900 tracking-tight">${plan.monthly_price}</span>
                                        <span className="text-gray-500 text-[14px] font-medium">/month</span>
                                    </div>

                                    <div className="flex-1 mb-8">
                                        <ul className="space-y-4">
                                            {features.map((feature, idx) => (
                                                <li key={idx} className="flex items-start gap-3 text-[14px] text-gray-600 font-medium">
                                                    <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" strokeWidth={2} />
                                                    <span className="leading-tight pt-0.5">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <button className={`w-full py-3.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-[15px] ${isPro ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' : 'bg-white border-2 border-blue-200 hover:border-blue-300 text-blue-600'}`}>
                                        Select {plan.name} <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                                    </button>
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-gray-50 rounded-2xl p-12 text-center border border-gray-100 border-dashed">
                        <p className="text-gray-500">No billing plans currently available.</p>
                    </div>
                )}
            </motion.div>

            {/* Footer Trust Markers */}
            <motion.div variants={itemVariants} className="mt-16 flex flex-col md:flex-row items-center justify-center gap-10 text-[14px] text-gray-500 font-medium border-t border-gray-100 pt-8 pb-4">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-gray-400" />
                    Secure & encrypted payments
                </div>
                <div className="flex items-center gap-2">
                    <RotateCcw className="w-5 h-5 text-gray-400" />
                    Cancel or change anytime
                </div>
                <div className="flex items-center gap-2">
                    <Headphones className="w-5 h-5 text-gray-400" />
                    Need help? <span className="text-blue-600 cursor-pointer hover:underline">Contact support</span>
                </div>
            </motion.div>

        </motion.div>
    );
};

export default Subscription;
