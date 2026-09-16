'use client';
import React, { useState, useEffect } from 'react';
import {
    Layers, Save, Loader2, CheckCircle, Search,
    ToggleLeft, ToggleRight, KeyRound, Globe, Cloud
} from 'lucide-react';
import { getIntegrations, updateIntegrations } from '../ApiService/action';

const PROVIDER_ICONS = {
    'Google Auth': <Globe className="w-6 h-6 text-blue-500" />,
    'Razorpay': <KeyRound className="w-6 h-6 text-indigo-500" />,
    'AWS S3': <Cloud className="w-6 h-6 text-orange-500" />
};

export default function Integration() {
    const [integrations, setIntegrations] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [changedSettings, setChangedSettings] = useState({}); // Keep track of changes

    useEffect(() => {
        fetchIntegrations();
    }, []);

    const fetchIntegrations = async () => {
        setIsLoading(true);
        try {
            const res = await getIntegrations();
            if (res?.data?.success) {
                setIntegrations(res.data.data);
            }
        } catch (error) {
            console.error("Failed to load integrations", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSettingChange = (provider, key, value, isEnabled = null) => {
        setIntegrations(prev => {
            const newIntegrations = { ...prev };
            const providerGroup = [...newIntegrations[provider]];
            const index = providerGroup.findIndex(s => s.integration_key === key);

            if (index !== -1) {
                if (value !== null) {
                    providerGroup[index].integration_value = value;
                }
                if (isEnabled !== null) {
                    // Update all keys in this provider to share the same is_enabled status
                    providerGroup.forEach(s => s.is_enabled = isEnabled);
                }
                newIntegrations[provider] = providerGroup;
            }
            return newIntegrations;
        });

        // Record changes
        setChangedSettings(prev => {
            const updated = { ...prev };
            const setting = integrations[provider].find(s => s.integration_key === key);
            updated[key] = {
                integration_key: key,
                integration_value: value !== null ? value : setting.integration_value,
                is_enabled: isEnabled !== null ? isEnabled : setting.is_enabled
            };

            // If toggled, mark all keys for this provider as changed
            if (isEnabled !== null) {
                integrations[provider].forEach(s => {
                    updated[s.integration_key] = {
                        integration_key: s.integration_key,
                        integration_value: (s.integration_key === key && value !== null) ? value : s.integration_value,
                        is_enabled: isEnabled
                    };
                });
            }

            return updated;
        });
    };

    const handleSave = async () => {
        const updates = Object.values(changedSettings);
        if (updates.length === 0) return;

        setIsSaving(true);
        setSuccessMessage('');

        try {
            const res = await updateIntegrations({ updates });
            if (res?.data?.success) {
                setSuccessMessage('Integrations updated successfully!');
                setChangedSettings({});
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (error) {
            console.error("Failed to save integrations", error);
        } finally {
            setIsSaving(false);
        }
    };

    const filteredProviders = Object.keys(integrations).filter(provider =>
        provider.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="p-8 max-w-5xl mx-auto space-y-8 animate-pulse">
                <div className="h-10 bg-gray-200 rounded-lg w-1/3"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white border border-slate-100 rounded-2xl p-6 h-64"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1200px] w-full animate-in fade-in duration-300 min-h-full">
            {/* Header Section */}
            <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                                <Layers className="w-5 h-5" />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Integrations</h1>
                        </div>
                        <p className="text-[15px] text-slate-500 ml-1">Manage third-party APIs and connected services.</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search integrations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[14px] text-slate-700 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
                            />
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || Object.keys(changedSettings).length === 0}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-[14px] transition-all shadow-sm ${Object.keys(changedSettings).length > 0
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-500/20 hover:shadow-lg active:scale-95'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                }`}
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Success Toast */}
            {successMessage && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-3 rounded-xl shadow-lg shadow-emerald-500/10 flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        <span className="font-medium text-[14px]">{successMessage}</span>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="w-full">
                {filteredProviders.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 border-dashed">
                        <Layers className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-700 mb-1">No integrations found</h3>
                        <p className="text-slate-500 text-[14px]">Try adjusting your search criteria.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {filteredProviders.map(provider => {
                            const keys = integrations[provider];
                            const isEnabled = keys[0]?.is_enabled === 1 || keys[0]?.is_enabled === true;
                            const Icon = PROVIDER_ICONS[provider] || <Layers className="w-6 h-6 text-slate-500" />;

                            return (
                                <div key={provider} className={`bg-white rounded-2xl ${isEnabled ? 'border-indigo-100 ring-4 ring-indigo-50/50' : 'border-slate-100'} p-7 transition-all duration-300`}>
                                    <div className="flex items-start justify-between mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isEnabled ? 'bg-indigo-50' : 'bg-slate-50'}`}>
                                                {Icon}
                                            </div>
                                            <div>
                                                <h2 className="text-[18px] font-bold text-slate-900 mb-2">{provider}</h2>
                                                <p className="text-[13px] font-medium text-slate-500 flex items-center gap-2 mb-0">
                                                    Status:
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${isEnabled ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${isEnabled ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                                        {isEnabled ? 'Active' : 'Disabled'}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleSettingChange(provider, keys[0].integration_key, null, !isEnabled)}
                                            className="text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none"
                                        >
                                            {isEnabled ? <ToggleRight className="w-10 h-10 text-indigo-500" strokeWidth={1.5} /> : <ToggleLeft className="w-10 h-10" strokeWidth={1.5} />}
                                        </button>
                                    </div>

                                    <div className={`space-y-4 transition-all duration-300 ${isEnabled ? 'opacity-100' : 'opacity-50 grayscale pointer-events-none'}`}>
                                        {keys.map((setting) => (
                                            <div key={setting.integration_key} className="space-y-1.5">
                                                <label className="text-[13px] font-semibold text-slate-700 ml-1">
                                                    {setting.label}
                                                </label>
                                                <div className="relative group">
                                                    <input
                                                        type={setting.input_type === 'password' ? 'password' : 'text'}
                                                        value={setting.integration_value}
                                                        onChange={(e) => handleSettingChange(provider, setting.integration_key, e.target.value, null)}
                                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all font-mono"
                                                        placeholder={`Enter ${setting.label}`}
                                                        autoComplete="off"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
