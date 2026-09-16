import React, { useState, useEffect } from 'react';
import {
    Briefcase,
    Star,
    Zap,
    Edit2,
    Save,
    X,
    CheckCircle2,
    Loader2,
    Info,
    Flame
} from 'lucide-react';
import { getBillingPlans, updateBillingPlan } from '../ApiService/action';

export default function BillingPlan() {
    const [plans, setPlans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingPlan, setEditingPlan] = useState(null);
    const [editForm, setEditForm] = useState({ monthlyPrice: 0, annualPrice: 0 });
    const [toast, setToast] = useState(false);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('AccessToken');
            const response = await getBillingPlans(token);
            if (response?.data?.success) {
                const mappedPlans = response.data.data.map(plan => {
                    let iconComponent;
                    let colorName = 'blue';

                    if (plan.icon === 'Star' || plan.name.includes('Premium')) {
                        colorName = 'orange';
                        iconComponent = <Star className="w-5 h-5 text-orange-500" strokeWidth={2} />;
                    } else if (plan.icon === 'Zap' || plan.name.includes('Bulk')) {
                        colorName = 'purple';
                        iconComponent = <Zap className="w-5 h-5 text-purple-500" strokeWidth={2} />;
                    } else {
                        colorName = 'blue';
                        iconComponent = <Briefcase className="w-5 h-5 text-blue-500" strokeWidth={2} />;
                    }

                    return {
                        id: plan.plan_id,
                        name: plan.name,
                        description: plan.description,
                        monthlyPrice: plan.monthly_price,
                        annualPrice: plan.annual_price,
                        icon: iconComponent,
                        color: colorName
                    };
                });
                setPlans(mappedPlans);
            }
        } catch (error) {
            console.error("Failed to fetch billing plans:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditClick = (plan) => {
        setEditingPlan(plan.id);
        setEditForm({
            monthlyPrice: plan.monthlyPrice,
            annualPrice: plan.annualPrice
        });
    };

    const handleCancel = () => {
        setEditingPlan(null);
    };

    const handleSave = async (id) => {
        try {
            const token = localStorage.getItem('AccessToken');
            const payload = {
                plan_id: id,
                monthly_price: editForm.monthlyPrice,
                annual_price: editForm.annualPrice
            };
            const response = await updateBillingPlan(payload, token);

            if (response?.data?.success) {
                setPlans(plans.map(p =>
                    p.id === id
                        ? { ...p, monthlyPrice: editForm.monthlyPrice, annualPrice: editForm.annualPrice }
                        : p
                ));
                setEditingPlan(null);

                setToast(true);
                setTimeout(() => setToast(false), 3000);
            } else {
                console.error("Failed to update plan");
            }
        } catch (error) {
            console.error("Error updating plan:", error);
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-[1200px] w-full animate-in fade-in duration-300 p-4">
                {/* Header Skeleton */}
                <div className="mb-8">
                    <div className="h-[28px] w-64 bg-slate-200 rounded-lg animate-pulse mb-2"></div>
                    <div className="h-[20px] w-80 bg-slate-100 rounded-lg animate-pulse"></div>
                </div>

                {/* Plans List Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((item) => (
                        <div key={item} className="relative bg-white rounded-2xl p-6">
                            <div className="flex gap-3 items-start mb-4">
                                <div className="w-12 h-12 rounded-xl bg-slate-100 animate-pulse shrink-0"></div>
                                <div className="pt-0.5 space-y-2 w-full">
                                    <div className="h-5 w-3/4 bg-slate-200 rounded animate-pulse"></div>
                                    <div className="h-3 w-full bg-slate-100 rounded animate-pulse mt-2"></div>
                                    <div className="h-3 w-4/5 bg-slate-100 rounded animate-pulse"></div>
                                </div>
                            </div>

                            <div className="border-t border-gray-50 pt-6 space-y-6">
                                <div>
                                    <div className="h-3 w-28 bg-slate-200 rounded animate-pulse mb-3"></div>
                                    <div className="h-7 w-24 bg-slate-200 rounded animate-pulse"></div>
                                </div>

                                <div>
                                    <div className="h-3 w-28 bg-slate-200 rounded animate-pulse mb-3"></div>
                                    <div className="h-6 w-20 bg-slate-200 rounded animate-pulse"></div>
                                </div>
                            </div>

                            <div className="mt-8">
                                <div className="h-10 w-full bg-slate-100 rounded-lg animate-pulse"></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Info Alert Skeleton */}
                <div className="mt-8 bg-slate-50 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-slate-200 animate-pulse shrink-0"></div>
                    <div className="space-y-1.5 w-full">
                        <div className="h-4 w-72 bg-slate-200 rounded animate-pulse"></div>
                        <div className="h-3 w-56 bg-slate-200 rounded animate-pulse"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1200px] w-full animate-in fade-in duration-300 p-4">
            {/* Header Section */}
            <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-[22px] font-bold text-slate-900 tracking-tight mb-1">Manage Billing Plans</h1>
                    <p className="text-[14px] text-slate-500 mb-0">Configure pricing for employer job posting plans.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[13px] font-medium transition-colors shadow-sm">
                    <span className="text-lg leading-none mb-0.5">+</span> Add Plan
                </button>
            </div>

            {/* Plans List */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => {
                    const isEditing = editingPlan === plan.id;
                    const isPremium = plan.name.includes('Premium') || plan.color === 'orange';

                    return (
                        <div
                            key={plan.id}
                            className={`relative bg-white rounded-2xl p-6 transition-all duration-200 ${isPremium ? 'border-orange-200' : 'border-gray-100'
                                }`}
                        >
                            {isPremium && (
                                <div className="absolute -top-3 right-6 bg-orange-50 border-1 border-orange-200 text-orange-600 text-[11px] font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                                    <Flame className="w-3.5 h-3.5" /> Most Popular
                                </div>
                            )}

                            <div className="flex gap-3 items-start mb-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-${plan.color}-50`}>
                                    {plan.icon}
                                </div>
                                <div className="pt-0.5">
                                    <h3 className="text-[20px] font-bold text-slate-900">{plan.name}</h3>
                                    <p className="text-[13px] text-slate-500 mt-1 leading-snug mb-0">{plan.description}</p>
                                </div>
                            </div>

                            <div className="border-t border-gray-50 pt-6 space-y-6">
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Monthly Price (₹)</label>
                                    {isEditing ? (
                                        <input
                                            type="number"
                                            value={editForm.monthlyPrice}
                                            onChange={(e) => setEditForm({ ...editForm, monthlyPrice: Number(e.target.value) })}
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                                        />
                                    ) : (
                                        <div className="text-[20px] font-bold text-slate-900">
                                            ₹{plan.monthlyPrice.toLocaleString()}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Annual Price (₹)</label>
                                    {isEditing ? (
                                        <input
                                            type="number"
                                            value={editForm.annualPrice}
                                            onChange={(e) => setEditForm({ ...editForm, annualPrice: Number(e.target.value) })}
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                                        />
                                    ) : (
                                        <div className="text-[18px] font-bold text-slate-900">
                                            ₹{plan.annualPrice.toLocaleString()}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-8 flex gap-3">
                                {isEditing ? (
                                    <>
                                        <button
                                            onClick={handleCancel}
                                            className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <X className="w-4 h-4" /> Cancel
                                        </button>
                                        <button
                                            onClick={() => handleSave(plan.id)}
                                            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Save className="w-4 h-4" /> Save
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => handleEditClick(plan)}
                                        className={`w-full px-4 py-2.5 text-[13px] font-medium bg-${plan.color}-50 text-${plan.color}-600 rounded-lg hover:bg-${plan.color}-100 transition-colors flex items-center justify-center gap-2`}
                                    >
                                        <Edit2 className="w-4 h-4" /> Edit Pricing
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Info Alert */}
            <div className="mt-8 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 flex items-center gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div>
                    <p className="text-[13px] font-medium text-slate-900 mb-0">Prices are displayed to employers during checkout.</p>
                    <p className="text-[13px] text-slate-500 mt-0.5 mb-0">You can update these prices anytime.</p>
                </div>
            </div>

            {/* Success Toast */}
            {toast && (
                <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <span className="text-sm font-medium">Pricing updated successfully</span>
                </div>
            )}
        </div>
    );
}
