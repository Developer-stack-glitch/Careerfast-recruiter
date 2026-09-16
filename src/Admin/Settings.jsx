import React, { useState, useEffect } from 'react';
import {
    Settings as SettingsIcon, Save, Loader2, CheckCircle2, Shield, Info,
    Building2, Mail, Phone, Globe, Link, Share2, Monitor
} from 'lucide-react';
import { getSettings, updateSettings } from '../ApiService/action';

export default function Settings() {
    const [settings, setSettings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(null); // stores the groupName currently saving
    const [toast, setToast] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setIsLoading(true);
            const response = await getSettings();
            if (response?.data?.success) {
                setSettings(response.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch settings:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSettingChange = (settingKey, newValue) => {
        setSettings(prevSettings =>
            prevSettings.map(setting =>
                setting.settingKey === settingKey
                    ? { ...setting, settingValue: newValue }
                    : setting
            )
        );
    };

    const handleSave = async (groupName) => {
        try {
            setIsSaving(groupName);
            const groupSettings = settings.filter(s => s.settingGroup === groupName);
            const payload = {
                settings: groupSettings.map(s => ({
                    settingKey: s.settingKey,
                    settingValue: s.settingValue
                }))
            };

            const response = await updateSettings(payload);
            if (response?.data?.success) {
                setToast(true);
                setTimeout(() => setToast(false), 3000);
            }
        } catch (error) {
            console.error("Error saving settings:", error);
        } finally {
            setIsSaving(null);
        }
    };

    const groupedSettings = settings.reduce((acc, curr) => {
        if (!acc[curr.settingGroup]) acc[curr.settingGroup] = [];
        acc[curr.settingGroup].push(curr);
        return acc;
    }, {});

    const getGroupInfo = (groupName) => {
        switch (groupName) {
            case 'Platform':
                return { icon: Shield, subtitle: "Manage basic platform configuration and maintenance." };
            case 'Contact':
                return { icon: Mail, subtitle: "Manage support email and contact phone number." };
            case 'Social':
                return { icon: Share2, subtitle: "Manage your social media links and profiles." };
            default:
                return { icon: SettingsIcon, subtitle: `Manage ${groupName.toLowerCase()} configuration and settings.` };
        }
    };

    const getFieldInfo = (key) => {
        switch (key) {
            case 'platform_name': return { icon: Building2, subtitle: "This name will be shown across the platform." };
            case 'maintenance_mode': return { icon: null, subtitle: "Enable to put the platform in maintenance mode." };
            case 'support_email': return { icon: Mail, subtitle: "This email will be used for all support communication." };
            case 'contact_phone': return { icon: Phone, subtitle: "This phone number will be shown on the platform." };
            case 'facebook_url': return { icon: Globe, subtitle: "Enter your Facebook page URL.", iconClass: "text-blue-600" };
            case 'linkedin_url': return { icon: Link, subtitle: "Enter your LinkedIn company page URL.", iconClass: "text-blue-700" };
            default: return { icon: null, subtitle: "" };
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-[1200px] w-full animate-in fade-in duration-300 p-8 bg-gray-50/30 min-h-full">
                {/* Header Skeleton */}
                <div className="mb-10 flex items-center justify-between">
                    <div className="flex gap-4 items-start">
                        <div className="w-12 h-12 rounded-xl bg-slate-200 animate-pulse shrink-0"></div>
                        <div className="py-1">
                            <div className="h-[24px] w-48 bg-slate-200 rounded-md animate-pulse mb-2"></div>
                            <div className="h-[14px] w-80 bg-slate-100 rounded-md animate-pulse"></div>
                        </div>
                    </div>
                </div>

                {/* Group Cards Skeleton */}
                <div className="space-y-6">
                    {[1, 2, 3].map((item) => (
                        <div key={item} className="bg-white rounded-xl overflow-hidden">
                            <div className="px-6 py-5 flex items-start justify-between">
                                <div className="flex gap-4 items-center">
                                    <div className="w-10 h-10 rounded-lg bg-slate-100 animate-pulse shrink-0"></div>
                                    <div className="py-0.5">
                                        <div className="h-[16px] w-32 bg-slate-200 rounded animate-pulse mb-2"></div>
                                        <div className="h-[12px] w-64 bg-slate-100 rounded animate-pulse"></div>
                                    </div>
                                </div>
                                <div className="w-[120px] h-[36px] bg-slate-100 rounded-md animate-pulse mt-1"></div>
                            </div>
                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                {[1, 2].map((field) => (
                                    <div key={field} className="space-y-3">
                                        <div className="h-[14px] w-24 bg-slate-200 rounded animate-pulse"></div>
                                        <div className="h-[42px] w-full bg-slate-100 rounded-lg animate-pulse"></div>
                                        <div className="h-[12px] w-48 bg-slate-50 rounded animate-pulse"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1200px] w-full animate-in fade-in duration-300 p-8 bg-gray-50/30 min-h-full">
            {/* Header Section */}
            <div className="mb-10 flex items-center justify-between">
                <div className="flex gap-4 items-start">
                    <div className="w-12 h-12 rounded-xl bg-[#f0f0ff] flex items-center justify-center shrink-0">
                        <SettingsIcon className="w-6 h-6 text-[#5451e1]" />
                    </div>
                    <div>
                        <h1 className="text-[24px] font-bold text-slate-900 tracking-tight mb-1">Platform Settings</h1>
                        <p className="text-[14px] text-slate-500 mb-0">Configure global platform settings, contact information, and more.</p>
                    </div>
                </div>
            </div>

            {/* Settings Groups */}
            <div className="space-y-6">
                {['Platform', 'Contact', 'Social'].map((groupName) => {
                    const groupSettings = groupedSettings[groupName];
                    if (!groupSettings) return null;
                    const { icon: GroupIcon, subtitle: groupSubtitle } = getGroupInfo(groupName);

                    return (
                        <div key={groupName} className="bg-white rounded-xl overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between">
                                <div className="flex gap-4 items-center">
                                    <div className="w-10 h-10 rounded-lg bg-[#f0f0ff] flex items-center justify-center shrink-0">
                                        <GroupIcon className="w-5 h-5 text-[#5451e1]" />
                                    </div>
                                    <div>
                                        <h3 className="text-[16px] font-bold text-slate-900 leading-tight">
                                            {groupName} Settings
                                        </h3>
                                        <p className="text-[13px] text-slate-500 mt-1 mb-0">{groupSubtitle}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleSave(groupName)}
                                    disabled={isSaving === groupName}
                                    className="px-4 py-2 text-[13px] font-medium text-white bg-[#5451e1] rounded-md hover:bg-[#4338ca] transition-colors flex items-center gap-2 disabled:opacity-70 mt-1 shadow-sm"
                                >
                                    {isSaving === groupName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save Changes
                                </button>
                            </div>

                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                {groupSettings.map((setting) => {
                                    const { icon: FieldIcon, subtitle: fieldSubtitle, iconClass = "text-gray-500" } = getFieldInfo(setting.settingKey);

                                    return (
                                        <div key={setting.settingKey} className="space-y-2">
                                            <label className="text-[13px] font-bold text-slate-900 block mb-3">
                                                {setting.label}
                                            </label>

                                            {setting.settingType === 'text' && (
                                                <div className="space-y-2">
                                                    <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white focus-within:ring-2 focus-within:ring-[#5451e1]/20 focus-within:border-[#5451e1] transition-all">
                                                        {FieldIcon && (
                                                            <div className="w-12 flex items-center justify-center bg-gray-50 border-r border-gray-200 shrink-0">
                                                                <FieldIcon className={`w-4 h-4 ${iconClass}`} />
                                                            </div>
                                                        )}
                                                        <input
                                                            type="text"
                                                            value={setting.settingValue}
                                                            onChange={(e) => handleSettingChange(setting.settingKey, e.target.value)}
                                                            className="flex-1 w-full px-2.5 py-2.5 text-[14px] text-slate-900 focus:outline-none bg-transparent"
                                                            placeholder={`Enter ${setting.label.toLowerCase()}`}
                                                        />
                                                    </div>
                                                    {fieldSubtitle && <p className="text-[12px] text-gray-500 font-medium">{fieldSubtitle}</p>}
                                                </div>
                                            )}

                                            {setting.settingType === 'boolean' && (
                                                <div className="space-y-2">
                                                    <label className="relative inline-flex items-center cursor-pointer mt-1">
                                                        <input
                                                            type="checkbox"
                                                            className="sr-only peer"
                                                            checked={setting.settingValue === true || setting.settingValue === 'true'}
                                                            onChange={(e) => handleSettingChange(setting.settingKey, e.target.checked)}
                                                        />
                                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#5451e1]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5451e1]"></div>
                                                        <span className="ml-3 text-[14px] font-bold text-slate-900">
                                                            {setting.settingValue === true || setting.settingValue === 'true' ? 'Enabled' : 'Disabled'}
                                                        </span>
                                                    </label>
                                                    {fieldSubtitle && <p className="text-[12px] text-gray-500 font-medium mt-2">{fieldSubtitle}</p>}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    );
                })}

                {Object.keys(groupedSettings).length === 0 && !isLoading && (
                    <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-12 text-center">
                        <Info className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                        <h3 className="text-[16px] font-bold text-slate-700">No settings found</h3>
                        <p className="text-[14px] text-slate-500 mt-1">Global settings have not been configured yet.</p>
                    </div>
                )}
            </div>

            {/* Note Section */}
            {!isLoading && Object.keys(groupedSettings).length > 0 && (
                <div className="mt-8 bg-[#f5f5ff] rounded-xl p-4 flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-white border border-[#5451e1]/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Info className="w-4 h-4 text-[#5451e1]" />
                    </div>
                    <div>
                        <h4 className="text-[14px] font-bold text-slate-900 mb-0.5">Note</h4>
                        <p className="text-[13px] text-slate-600 mb-0">Make sure to click "Save Changes" after updating any information.</p>
                    </div>
                </div>
            )}

            {/* Success Toast */}
            {toast && (
                <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 z-50">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <span className="text-sm font-medium">Settings updated successfully</span>
                </div>
            )}
        </div>
    );
}
