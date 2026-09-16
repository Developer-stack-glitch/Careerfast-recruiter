'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from 'react-hot-toast';
import { App } from "antd";
import dynamic from 'next/dynamic';
import {
    Plus,
    Trash2,
    Save,
    Image as ImageIcon,
    Edit,
    X,
    ExternalLink,
    Check,
    ArrowLeft,
    ArrowRight,
    BookOpen,
    Search,
    Calendar,
    Star,
    Award,
    Briefcase,
    Clock,
    DollarSign,
    UploadCloud,
    HelpCircle,
    Building,
    Code,
    Sparkles,
    CheckCircle2
} from "lucide-react";
import { compressImage } from "../utils/imageCompressor";
import Loader from "../Components/Loader";
import { getImageUrl, getPlaceholderSvg } from "../utils/getImageUrl";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";

const quillModules = {
    toolbar: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['link', 'clean']
    ]
};

const STEPS = [
    { id: 0, title: "Hero & Overview" },
    { id: 1, title: "Curriculum & Projects" },
    { id: 2, title: "Skills & Tools" },
    { id: 3, title: "About & Career" },
    { id: 4, title: "Batches & FAQs" }
];

const INITIAL_FORM_STATE = {
    title: "",
    slug: "",
    category: "",
    description: "",
    enrollmentCount: "",
    imageBase64: "",
    content: {
        duration: "",
        hero: {
            ratings: {
                overall: "",
                google: "",
                courseReport: "",
                switchUp: ""
            },
            stats: {
                hiringPartners: "",
                liveProjects: "",
                certificationPass: "",
                trainingFormat: ""
            },
            highlights: [
                { text: "", subtext: "" }
            ],
            prices: {
                original: "",
                discounted: "",
                expiry: ""
            }
        },
        aboutCourse: {
            description: "",
            highlights: []
        },
        batches: [
            { date: "", type: "Weekend", days: "", slot: "" }
        ],
        skills: [],
        tools: [],
        curriculumHeading: "",
        curriculumDescription: "",
        projectsHeading: "",
        projectsDescription: "",
        skillsHeading: "",
        skillsDescription: "",
        curriculum: [
            { title: "", content: "" }
        ],
        projects: [
            { title: "", desc: "", tech: "" }
        ],
        careerSection: {
            title: "",
            description: "",
            roles: [
                {
                    title: "",
                    minSalary: "",
                    avgSalary: "",
                    maxSalary: "",
                    companies: [
                        { name: "", logo: "" }
                    ]
                }
            ]
        },
        certificationQs: [
            { q: "", a: "" }
        ],
        faqs: [
            { q: "", a: "" }
        ]
    }
};

export default function PostCourse() {
    const { modal } = App.useApp();
    const router = useRouter();
    const [courses, setCourses] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [formMode, setFormMode] = useState("list"); // "list", "create", "edit"
    const [currentStep, setCurrentStep] = useState(0);
    const [currentCourseId, setCurrentCourseId] = useState(null);
    const [courseData, setCourseData] = useState(INITIAL_FORM_STATE);
    const [loading, setLoading] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:3001';

    useEffect(() => {
        const stored = localStorage.getItem("loginDetails");
        if (stored) {
            try {
                const loginDetails = JSON.parse(stored);
                if (loginDetails.role_id !== 1 && loginDetails.role_id !== 3) {
                    toast.error("Access denied. Authorized personnel only.");
                    router.push("/");
                }
            } catch (err) {
                toast.error("Please Login to Post Course");
                setTimeout(() => router.push(`/login`), 200);
            }
        } else {
            toast.error("Please Login to Post Course");
            setTimeout(() => router.push(`/login`), 200);
        }

        fetchCourses();
    }, [router]);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/courses`);
            if (response.ok) {
                const data = await response.json();
                setCourses(data);
            }
        } catch (err) {
            console.error("Error fetching courses:", err);
        } finally {
            setTimeout(() => setLoading(false), 500);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCourseData(prev => {
            const newState = { ...prev, [name]: value };
            if (name === "title" && (!prev.slug || prev.slug === prev.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))) {
                newState.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            }
            return newState;
        });
    };

    const handlePriceChange = (e) => {
        const { name, value } = e.target;
        setCourseData(prev => ({
            ...prev,
            content: {
                ...prev.content,
                hero: {
                    ...prev.content.hero,
                    prices: { ...prev.content.hero.prices, [name]: value }
                }
            }
        }));
    };

    const scrollToNewItem = (id) => {
        setTimeout(() => {
            const el = document.getElementById(id);
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                el.classList.add("ring-2", "ring-[#0A66C2]/60", "transition-all", "duration-500");
                setTimeout(() => {
                    el.classList.remove("ring-2", "ring-[#0A66C2]/60");
                }, 1200);

                const input = el.querySelector("input:not([type=file]):not([type=hidden]), textarea");
                if (input) {
                    input.focus({ preventScroll: true });
                }
            }
        }, 80);
    };

    const addListItem = (section, item) => {
        setCourseData(prev => {
            const currentList = prev.content?.[section]
                ? prev.content[section]
                : (section === "faqs" ? (prev.content?.certificationQs || []) : []);
            return {
                ...prev,
                content: {
                    ...prev.content,
                    [section]: [...currentList, item]
                }
            };
        });
    };

    const removeListItem = (section, index) => {
        setCourseData(prev => ({
            ...prev,
            content: {
                ...prev.content,
                [section]: (prev.content[section] || []).filter((_, i) => i !== index)
            }
        }));
    };

    const updateListItem = (section, index, field, value) => {
        setCourseData(prev => {
            const newList = [...(prev.content[section] || [])];
            if (newList[index]) {
                newList[index] = { ...newList[index], [field]: value };
            }
            return {
                ...prev,
                content: { ...prev.content, [section]: newList }
            };
        });
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const compressed = await compressImage(file, 150);
                setCourseData(prev => ({ ...prev, imageBase64: compressed }));
            } catch (err) {
                console.error("Error compressing image:", err);
                toast.error("Failed to compress image");
            }
        }
    };

    const handleSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        setLoading(true);

        const url = formMode === "edit" ? `${API_URL}/api/courses/${currentCourseId}` : `${API_URL}/api/courses`;
        const method = formMode === "edit" ? "PUT" : "POST";

        const payload = JSON.parse(JSON.stringify(courseData));
        if (typeof payload.content?.skills === 'string') {
            payload.content.skills = payload.content.skills.split(",").map(s => s.trim()).filter(Boolean);
        }
        if (Array.isArray(payload.content?.projects)) {
            payload.content.projects = payload.content.projects.map(p => ({
                ...p,
                tech: typeof p.tech === 'string' ? p.tech.split(",").map(t => t.trim()).filter(Boolean) : p.tech
            }));
        }

        try {
            const response = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(`Course ${formMode === "edit" ? "updated" : "created"} successfully!`);
                fetchCourses();
                setTimeout(() => setFormMode("list"), 1200);
            } else {
                toast.error(data.error || "Failed to save course");
            }
        } catch (err) {
            toast.error("Connection error");
        } finally {
            setTimeout(() => setLoading(false), 500);
        }
    };

    const handleEdit = (course) => {
        const cContent = course.content ? JSON.parse(JSON.stringify(course.content)) : JSON.parse(JSON.stringify(INITIAL_FORM_STATE.content));

        // Normalize tools
        if (typeof cContent.tools === 'string') {
            cContent.tools = cContent.tools.split(",").map(s => ({ name: s.trim(), logo: "" })).filter(t => t.name);
        } else if (Array.isArray(cContent.tools)) {
            cContent.tools = cContent.tools.map(t => typeof t === 'string' ? { name: t, logo: "" } : (t || { name: "", logo: "" }));
        } else {
            cContent.tools = [];
        }

        // Normalize careerSection & roles
        if (!cContent.careerSection) {
            cContent.careerSection = { title: "", description: "", roles: [] };
        }
        if (Array.isArray(cContent.careerSection.roles)) {
            cContent.careerSection.roles = cContent.careerSection.roles.map(r => ({
                ...r,
                companies: Array.isArray(r.companies)
                    ? r.companies.map(comp => typeof comp === 'string' ? { name: comp, logo: "" } : (comp || { name: "", logo: "" }))
                    : []
            }));
        } else {
            cContent.careerSection.roles = [];
        }

        // Normalize batches
        if (!Array.isArray(cContent.batches)) {
            cContent.batches = [];
        }

        // Normalize curriculum
        if (!Array.isArray(cContent.curriculum)) {
            cContent.curriculum = [];
        }

        // Normalize projects
        if (!Array.isArray(cContent.projects)) {
            cContent.projects = [];
        }

        // Normalize FAQs
        const rawFaqs = (cContent.faqs && cContent.faqs.length > 0) ? cContent.faqs : (cContent.certificationQs || []);
        cContent.faqs = Array.isArray(rawFaqs) ? rawFaqs.map(f => ({
            q: f?.q || f?.question || "",
            a: f?.a || f?.answer || ""
        })) : [];

        setCourseData({
            ...course,
            imageBase64: course.image || "",
            content: cContent
        });
        setCurrentCourseId(course.id);
        setCurrentStep(0);
        setFormMode("edit");
    };

    const handleDelete = (id) => {
        modal.confirm({
            title: "Delete Course",
            content: "Are you sure you want to delete this course? This action cannot be undone.",
            okText: "Yes, Delete",
            okType: "danger",
            cancelText: "No, Keep it",
            centered: true,
            onOk: async () => {
                try {
                    const response = await fetch(`${API_URL}/api/courses/${id}`, { method: "DELETE" });
                    if (response.ok) {
                        toast.success("Course deleted successfully");
                        fetchCourses();
                    } else {
                        toast.error("Failed to delete course");
                    }
                } catch (err) {
                    toast.error("Connection error");
                    console.error("Error deleting course:", err);
                }
            }
        });
    };

    const resetForm = () => {
        setCourseData(INITIAL_FORM_STATE);
        setCurrentStep(0);
        setFormMode("create");
    };

    const filteredCourses = courses.filter(c =>
        (c.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.category || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.slug || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ==========================================
    // STEP 0: Hero & Overview
    // ==========================================
    const renderStep0 = () => (
        <div className="space-y-6">
            {/* General Information */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-xs space-y-6">
                <div>
                    <h2 className="text-[18px] font-bold text-[#1f2937] flex items-center gap-2 mb-1">
                        <BookOpen size={20} className="text-[#0A66C2]" />
                        General Information
                    </h2>
                    <p className="text-[13px] text-gray-500 mb-0">Set up the primary course title, URL slug, category, and display image.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                    <div className="md:col-span-2">
                        <label className="block text-[14px] font-bold text-[#374151] mb-1.5">
                            Course Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={courseData.title}
                            onChange={handleInputChange}
                            placeholder="e.g. Full Stack Web Development Mastery"
                            required
                            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2] outline-none text-[14px] text-gray-800 bg-white transition"
                        />
                    </div>

                    <div>
                        <label className="block text-[14px] font-bold text-[#374151] mb-1.5">
                            Slug (URL Path) <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center rounded-lg border border-gray-300 focus-within:border-[#0A66C2] focus-within:ring-1 focus-within:ring-[#0A66C2] bg-white overflow-hidden">
                            <span className="px-3 py-2.5 bg-gray-50 text-gray-400 text-[13px] border-r border-gray-200 select-none">/courses/</span>
                            <input
                                type="text"
                                name="slug"
                                value={courseData.slug}
                                onChange={handleInputChange}
                                placeholder="full-stack-web-dev"
                                required
                                className="w-full px-3 py-2.5 outline-none text-[14px] text-gray-800 bg-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[14px] font-bold text-[#374151] mb-1.5">Category</label>
                        <input
                            type="text"
                            name="category"
                            value={courseData.category}
                            onChange={handleInputChange}
                            placeholder="e.g. Web Development, Cloud, AI & ML"
                            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2] outline-none text-[14px] text-gray-800 bg-white transition"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-[14px] font-bold text-[#374151] mb-1.5">Short Description (SEO)</label>
                        <textarea
                            name="description"
                            value={courseData.description}
                            onChange={handleInputChange}
                            rows={3}
                            placeholder="Brief summary of the course for search engines, cards, and preview shares..."
                            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2] outline-none text-[14px] text-gray-800 bg-white transition resize-y"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-[14px] font-bold text-[#374151] mb-1.5">Featured Course Image</label>
                        <div className="border-2 border-dashed border-gray-300 hover:border-[#0A66C2] rounded-xl p-6 bg-gray-50/60 hover:bg-blue-50/20 transition-all text-center relative group">
                            <input
                                type="file"
                                onChange={handleImageUpload}
                                accept="image/*"
                                id="img-upload-input"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            {courseData.imageBase64 ? (
                                <div className="flex flex-col items-center gap-3">
                                    <img
                                        src={courseData.imageBase64}
                                        alt="Course Preview"
                                        className="max-h-48 rounded-lg object-contain border border-gray-200 shadow-xs"
                                    />
                                    <span className="text-[13px] font-semibold text-[#0A66C2] group-hover:underline">
                                        Click or drop a new file to change image
                                    </span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0A66C2] flex items-center justify-center group-hover:scale-105 transition-transform">
                                        <UploadCloud size={24} />
                                    </div>
                                    <p className="text-[14px] font-semibold text-gray-700 mb-0">Click to upload or drag & drop</p>
                                    <p className="text-[12px] text-gray-400 mb-0">PNG, JPG, WEBP (auto-compressed)</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Pricing & Offer Details */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-xs space-y-6">
                <div>
                    <h2 className="text-[18px] font-bold text-[#1f2937] flex items-center gap-2 mb-1">
                        <DollarSign size={20} className="text-[#0A66C2]" />
                        Hero Pricing & Offer Details
                    </h2>
                    <p className="text-[13px] text-gray-500 mb-0">Set up base and discounted pricing along with promotional validity shown in the hero header.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                        <label className="block text-[14px] font-bold text-[#374151] mb-1.5">Original Price (₹)</label>
                        <input
                            type="text"
                            placeholder="e.g. 45000"
                            name="original"
                            value={courseData.content?.hero?.prices?.original || ""}
                            onChange={handlePriceChange}
                            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2] outline-none text-[14px] text-gray-800 bg-white"
                        />
                    </div>
                    <div>
                        <label className="block text-[14px] font-bold text-[#374151] mb-1.5">Discounted Price (₹)</label>
                        <input
                            type="text"
                            placeholder="e.g. 29999"
                            name="discounted"
                            value={courseData.content?.hero?.prices?.discounted || ""}
                            onChange={handlePriceChange}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-[#0A66C2] outline-none text-[14px] text-gray-800 bg-white"
                        />
                    </div>
                    <div>
                        <label className="block text-[14px] font-bold text-[#374151] mb-1.5">Offer Expiry</label>
                        <input
                            type="text"
                            placeholder="e.g. Limited Time Offer"
                            name="expiry"
                            value={courseData.content?.hero?.prices?.expiry || ""}
                            onChange={handlePriceChange}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-[#0A66C2] outline-none text-[14px] text-gray-800 bg-white"
                        />
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-[15px] font-bold text-[#374151] mb-3 flex items-center gap-1.5">
                        <Star size={17} className="text-amber-500" />
                        External Platform Ratings
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-500 mb-1">Overall Rating</label>
                            <input
                                type="text"
                                placeholder="4.8/5"
                                value={courseData.content?.hero?.ratings?.overall || ""}
                                onChange={(e) => setCourseData(prev => ({
                                    ...prev,
                                    content: {
                                        ...prev.content,
                                        hero: {
                                            ...(prev.content?.hero || {}),
                                            ratings: { ...(prev.content?.hero?.ratings || {}), overall: e.target.value }
                                        }
                                    }
                                }))}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-[#0A66C2] outline-none text-[13px] bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-500 mb-1">Google Rating</label>
                            <input
                                type="text"
                                placeholder="4.9/5"
                                value={courseData.content?.hero?.ratings?.google || ""}
                                onChange={(e) => setCourseData(prev => ({
                                    ...prev,
                                    content: {
                                        ...prev.content,
                                        hero: {
                                            ...(prev.content?.hero || {}),
                                            ratings: { ...(prev.content?.hero?.ratings || {}), google: e.target.value }
                                        }
                                    }
                                }))}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-[#0A66C2] outline-none text-[13px] bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-500 mb-1">Course Report</label>
                            <input
                                type="text"
                                placeholder="4.8/5"
                                value={courseData.content?.hero?.ratings?.courseReport || ""}
                                onChange={(e) => setCourseData(prev => ({
                                    ...prev,
                                    content: {
                                        ...prev.content,
                                        hero: {
                                            ...(prev.content?.hero || {}),
                                            ratings: { ...(prev.content?.hero?.ratings || {}), courseReport: e.target.value }
                                        }
                                    }
                                }))}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-[#0A66C2] outline-none text-[13px] bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-500 mb-1">SwitchUp</label>
                            <input
                                type="text"
                                placeholder="4.8/5"
                                value={courseData.content?.hero?.ratings?.switchUp || ""}
                                onChange={(e) => setCourseData(prev => ({
                                    ...prev,
                                    content: {
                                        ...prev.content,
                                        hero: {
                                            ...(prev.content?.hero || {}),
                                            ratings: { ...(prev.content?.hero?.ratings || {}), switchUp: e.target.value }
                                        }
                                    }
                                }))}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-[#0A66C2] outline-none text-[13px] bg-white"
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-[15px] font-bold text-[#374151] mb-3 flex items-center gap-1.5">
                        <Award size={17} className="text-[#0A66C2]" />
                        Key Highlights & Metrics
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-500 mb-1">Hiring Partners</label>
                            <input
                                type="text"
                                placeholder="e.g. 100+ Companies"
                                value={courseData.content?.hero?.stats?.hiringPartners || ""}
                                onChange={(e) => setCourseData(prev => ({
                                    ...prev,
                                    content: {
                                        ...prev.content,
                                        hero: {
                                            ...(prev.content?.hero || {}),
                                            stats: { ...(prev.content?.hero?.stats || {}), hiringPartners: e.target.value }
                                        }
                                    }
                                }))}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-[#0A66C2] outline-none text-[13px] bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-500 mb-1">Live Projects</label>
                            <input
                                type="text"
                                placeholder="e.g. 5+ Capstones"
                                value={courseData.content?.hero?.stats?.liveProjects || ""}
                                onChange={(e) => setCourseData(prev => ({
                                    ...prev,
                                    content: {
                                        ...prev.content,
                                        hero: {
                                            ...(prev.content?.hero || {}),
                                            stats: { ...(prev.content?.hero?.stats || {}), liveProjects: e.target.value }
                                        }
                                    }
                                }))}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-[#0A66C2] outline-none text-[13px] bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-500 mb-1">Certification Pass</label>
                            <input
                                type="text"
                                placeholder="e.g. Guaranteed"
                                value={courseData.content?.hero?.stats?.certificationPass || ""}
                                onChange={(e) => setCourseData(prev => ({
                                    ...prev,
                                    content: {
                                        ...prev.content,
                                        hero: {
                                            ...(prev.content?.hero || {}),
                                            stats: { ...(prev.content?.hero?.stats || {}), certificationPass: e.target.value }
                                        }
                                    }
                                }))}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-[#0A66C2] outline-none text-[13px] bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-500 mb-1">Training Format</label>
                            <input
                                type="text"
                                placeholder="e.g. Live Online"
                                value={courseData.content?.hero?.stats?.trainingFormat || ""}
                                onChange={(e) => setCourseData(prev => ({
                                    ...prev,
                                    content: {
                                        ...prev.content,
                                        hero: {
                                            ...(prev.content?.hero || {}),
                                            stats: { ...(prev.content?.hero?.stats || {}), trainingFormat: e.target.value }
                                        }
                                    }
                                }))}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-[#0A66C2] outline-none text-[13px] bg-white"
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <label className="block text-[14px] font-bold text-[#374151] mb-0">Hero Highlights (Checkmark list)</label>
                        <button
                            type="button"
                            onClick={() => {
                                const newHighlights = [...(courseData.content?.hero?.highlights || [])];
                                const newIndex = newHighlights.length;
                                setCourseData(prev => ({
                                    ...prev,
                                    content: {
                                        ...prev.content,
                                        hero: {
                                            ...(prev.content?.hero || {}),
                                            highlights: [...(prev.content?.hero?.highlights || []), { text: "", subtext: "" }]
                                        }
                                    }
                                }));
                                scrollToNewItem(`hero-highlight-${newIndex}`);
                            }}
                            className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#0A66C2] hover:underline cursor-pointer"
                        >
                            <Plus size={15} /> Add Highlight
                        </button>
                    </div>

                    <div className="space-y-3">
                        {(courseData.content?.hero?.highlights || []).map((h, i) => (
                            <div key={i} id={`hero-highlight-${i}`} className="flex flex-col sm:flex-row items-center gap-2.5 p-3 rounded-xl border border-gray-200 bg-gray-50/40">
                                <input
                                    type="text"
                                    placeholder="Title (e.g. Industry Accredited Certificate)"
                                    value={h.text || ""}
                                    onChange={(e) => {
                                        const newH = [...(courseData.content?.hero?.highlights || [])];
                                        newH[i].text = e.target.value;
                                        setCourseData(prev => ({ ...prev, content: { ...prev.content, hero: { ...(prev.content?.hero || {}), highlights: newH } } }));
                                    }}
                                    className="flex-1 w-full px-3.5 py-2 rounded-lg border border-gray-300 focus:border-[#0A66C2] outline-none text-[13.5px] bg-white"
                                />
                                <input
                                    type="text"
                                    placeholder="Subtext (e.g. Recognized across top tech firms)"
                                    value={h.subtext || ""}
                                    onChange={(e) => {
                                        const newH = [...(courseData.content?.hero?.highlights || [])];
                                        newH[i].subtext = e.target.value;
                                        setCourseData(prev => ({ ...prev, content: { ...prev.content, hero: { ...(prev.content?.hero || {}), highlights: newH } } }));
                                    }}
                                    className="flex-1 w-full px-3.5 py-2 rounded-lg border border-gray-300 focus:border-[#0A66C2] outline-none text-[13.5px] bg-white"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newH = (courseData.content?.hero?.highlights || []).filter((_, idx) => idx !== i);
                                        setCourseData(prev => ({ ...prev, content: { ...prev.content, hero: { ...(prev.content?.hero || {}), highlights: newH } } }));
                                    }}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                                    title="Remove"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    // ==========================================
    // STEP 1: Curriculum & Projects
    // ==========================================
    const renderStep1 = () => (
        <div className="space-y-6">
            {/* Curriculum Modules */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-[18px] font-bold text-[#1f2937] flex items-center gap-2 mb-1">
                            <BookOpen size={20} className="text-[#0A66C2]" />
                            Curriculum & Syllabus
                        </h2>
                        <p className="text-[13px] text-gray-500 mb-0">Build the step-by-step module breakdown for the curriculum.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            const newIndex = (courseData.content?.curriculum || []).length;
                            addListItem("curriculum", { title: "", content: "" });
                            scrollToNewItem(`curriculum-module-${newIndex}`);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#0A66C2] text-[#0A66C2] bg-blue-50/50 hover:bg-blue-50 font-semibold text-[13px] transition-colors cursor-pointer"
                    >
                        <Plus size={15} /> Add Module
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[14px] font-bold text-[#374151] mb-1.5">Curriculum Section Heading</label>
                        <input
                            type="text"
                            placeholder="e.g. Course Curriculum & Modules"
                            value={courseData.content?.curriculumHeading || ""}
                            onChange={(e) => setCourseData(prev => ({ ...prev, content: { ...prev.content, curriculumHeading: e.target.value } }))}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-[#0A66C2] outline-none text-[14px] bg-white"
                        />
                    </div>
                    <div>
                        <label className="block text-[14px] font-bold text-[#374151] mb-1.5">Curriculum Section Subtitle</label>
                        <input
                            type="text"
                            placeholder="e.g. Master modern fundamentals through hands-on learning"
                            value={courseData.content?.curriculumDescription || ""}
                            onChange={(e) => setCourseData(prev => ({ ...prev, content: { ...prev.content, curriculumDescription: e.target.value } }))}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-[#0A66C2] outline-none text-[14px] bg-white"
                        />
                    </div>
                </div>

                <div className="space-y-4 pt-2">
                    {(courseData.content?.curriculum || []).map((m, i) => (
                        <div key={i} id={`curriculum-module-${i}`} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[13px] font-bold text-[#0A66C2] uppercase tracking-wider">Module {i + 1}</span>
                                <button
                                    type="button"
                                    onClick={() => removeListItem("curriculum", i)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                    title="Remove module"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <input
                                type="text"
                                placeholder="Module Title (e.g. Frontend Architecture with Next.js)"
                                value={m.title || ""}
                                onChange={(e) => updateListItem("curriculum", i, "title", e.target.value)}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-[#0A66C2] outline-none text-[14px] font-medium bg-white"
                            />
                            <div className="rounded-lg border border-gray-300 overflow-hidden bg-white">
                                <ReactQuill
                                    theme="snow"
                                    value={m.content || ""}
                                    onChange={(val) => updateListItem("curriculum", i, "content", val)}
                                    placeholder="Module syllabus, topics covered, and assignments..."
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Industry Projects */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-[18px] font-bold text-[#1f2937] flex items-center gap-2 mb-1">
                            <Code size={20} className="text-[#0A66C2]" />
                            Industry Capstone Projects
                        </h2>
                        <p className="text-[13px] text-gray-500 mb-0">Showcase hands-on real world applications students will construct.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            const newIndex = (courseData.content?.projects || []).length;
                            addListItem("projects", { title: "", desc: "", tech: "" });
                            scrollToNewItem(`project-item-${newIndex}`);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#0A66C2] text-[#0A66C2] bg-blue-50/50 hover:bg-blue-50 font-semibold text-[13px] transition-colors cursor-pointer"
                    >
                        <Plus size={15} /> Add Project
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[14px] font-bold text-[#374151] mb-1.5">Projects Heading</label>
                        <input
                            type="text"
                            placeholder="e.g. Real-World Hands-On Projects"
                            value={courseData.content?.projectsHeading || ""}
                            onChange={(e) => setCourseData(prev => ({ ...prev, content: { ...prev.content, projectsHeading: e.target.value } }))}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-[#0A66C2] outline-none text-[14px] bg-white"
                        />
                    </div>
                    <div>
                        <label className="block text-[14px] font-bold text-[#374151] mb-1.5">Projects Subtitle</label>
                        <input
                            type="text"
                            placeholder="e.g. Build production-grade software using enterprise standards"
                            value={courseData.content?.projectsDescription || ""}
                            onChange={(e) => setCourseData(prev => ({ ...prev, content: { ...prev.content, projectsDescription: e.target.value } }))}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-[#0A66C2] outline-none text-[14px] bg-white"
                        />
                    </div>
                </div>

                <div className="space-y-4 pt-2">
                    {(courseData.content?.projects || []).map((p, i) => (
                        <div key={i} id={`project-item-${i}`} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[13px] font-bold text-[#0A66C2] uppercase tracking-wider">Project {i + 1}</span>
                                <button
                                    type="button"
                                    onClick={() => removeListItem("projects", i)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                    title="Remove project"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <input
                                type="text"
                                placeholder="Project Title (e.g. E-Commerce Microservices Engine)"
                                value={p.title || ""}
                                onChange={(e) => updateListItem("projects", i, "title", e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-[#0A66C2] outline-none text-[14px] font-medium bg-white"
                            />
                            <textarea
                                placeholder="Detailed overview of what students build in this project..."
                                value={p.desc || ""}
                                onChange={(e) => updateListItem("projects", i, "desc", e.target.value)}
                                rows={2}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-[#0A66C2] outline-none text-[13.5px] bg-white resize-y"
                            />
                            <input
                                type="text"
                                placeholder="Tech stack (comma-separated, e.g. React, Node.js, Redis, Docker)"
                                value={Array.isArray(p.tech) ? p.tech.join(', ') : (p.tech || "")}
                                onChange={(e) => updateListItem("projects", i, "tech", e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-[#0A66C2] outline-none text-[13.5px] bg-white"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    // ==========================================
    // STEP 2: Skills & Tools
    // ==========================================
    const renderStep2 = () => (
        <div className="space-y-6">
            {/* Skills & Tools Covered */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-[18px] font-bold text-[#1f2937] flex items-center gap-2 mb-1">
                            <Code size={20} className="text-[#0A66C2]" />
                            Skills & Tools Covered
                        </h2>
                        <p className="text-[13px] text-gray-500 mb-0">Display technologies, frameworks, and software mastered in this course.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            const newTools = [...(Array.isArray(courseData.content?.tools) ? courseData.content.tools : [])];
                            const newIndex = newTools.length;
                            newTools.push({ name: "", logo: "" });
                            setCourseData(prev => ({ ...prev, content: { ...prev.content, tools: newTools } }));
                            scrollToNewItem(`tool-item-${newIndex}`);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#0A66C2] text-[#0A66C2] bg-blue-50/50 hover:bg-blue-50 font-semibold text-[13px] transition-colors cursor-pointer"
                    >
                        <Plus size={15} /> Add Tool
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[14px] font-bold text-[#374151] mb-1.5">Skills Section Heading</label>
                        <input
                            type="text"
                            placeholder="e.g. Tools & Technologies Covered"
                            value={courseData.content?.skillsHeading || ""}
                            onChange={(e) => setCourseData(prev => ({ ...prev, content: { ...prev.content, skillsHeading: e.target.value } }))}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-[#0A66C2] outline-none text-[14px] bg-white"
                        />
                    </div>
                    <div>
                        <label className="block text-[14px] font-bold text-[#374151] mb-1.5">Skills Section Subtitle</label>
                        <input
                            type="text"
                            placeholder="e.g. Master industry-standard platforms used globally"
                            value={courseData.content?.skillsDescription || ""}
                            onChange={(e) => setCourseData(prev => ({ ...prev, content: { ...prev.content, skillsDescription: e.target.value } }))}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-[#0A66C2] outline-none text-[14px] bg-white"
                        />
                    </div>
                </div>

                <div className="space-y-3 pt-2">
                    {(Array.isArray(courseData.content?.tools) ? courseData.content.tools : []).map((t, i) => (
                        <div key={i} id={`tool-item-${i}`} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50/50">
                            <input
                                type="text"
                                placeholder="Tool Name (e.g. AWS, Docker, Kubernetes, Figma)"
                                value={t.name || (typeof t === 'string' ? t : "")}
                                onChange={(e) => {
                                    const newTools = [...(Array.isArray(courseData.content?.tools) ? courseData.content.tools : [])];
                                    if (typeof newTools[i] === 'string') {
                                        newTools[i] = { name: e.target.value, logo: "" };
                                    } else {
                                        newTools[i] = { ...newTools[i], name: e.target.value };
                                    }
                                    setCourseData(prev => ({ ...prev, content: { ...prev.content, tools: newTools } }));
                                }}
                                className="flex-1 px-3.5 py-2 rounded-lg border border-gray-300 focus:border-[#0A66C2] outline-none text-[13.5px] bg-white"
                            />
                            <div className="flex items-center gap-2">
                                <label className="px-3.5 py-2 bg-white border border-gray-300 hover:border-[#0A66C2] text-gray-700 rounded-lg text-xs font-semibold cursor-pointer transition">
                                    Upload Logo
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={async (e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                try {
                                                    const compressed = await compressImage(file, 80);
                                                    const newTools = [...(Array.isArray(courseData.content?.tools) ? courseData.content.tools : [])];
                                                    const currName = typeof newTools[i] === 'string' ? newTools[i] : (newTools[i]?.name || "");
                                                    newTools[i] = { name: currName, logo: compressed };
                                                    setCourseData(prev => ({ ...prev, content: { ...prev.content, tools: newTools } }));
                                                } catch (err) {
                                                    toast.error("Failed to compress logo");
                                                }
                                            }
                                        }}
                                    />
                                </label>
                                {t.logo && (
                                    <img src={t.logo} alt="tool logo" className="w-8 h-8 rounded object-contain border border-gray-200 p-0.5 bg-white" />
                                )}
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newTools = (Array.isArray(courseData.content?.tools) ? courseData.content.tools : []).filter((_, idx) => idx !== i);
                                        setCourseData(prev => ({ ...prev, content: { ...prev.content, tools: newTools } }));
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                    title="Remove tool"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    // ==========================================
    // STEP 3: About & Career
    // ==========================================
    const renderStep3 = () => (
        <div className="space-y-6">
            {/* About Course */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-xs space-y-6">
                <div>
                    <h2 className="text-[18px] font-bold text-[#1f2937] flex items-center gap-2 mb-1">
                        <Sparkles size={20} className="text-[#0A66C2]" />
                        About Course
                    </h2>
                    <p className="text-[13px] text-gray-500 mb-0">Provide in-depth information and highlights about what makes this program unique.</p>
                </div>

                <div>
                    <label className="block text-[14px] font-bold text-[#374151] mb-2">Detailed Course Description</label>
                    <div className="rounded-lg border border-gray-300 overflow-hidden bg-white">
                        <ReactQuill
                            theme="snow"
                            modules={quillModules}
                            value={courseData.content?.aboutCourse?.description || ""}
                            onChange={(val) => setCourseData({
                                ...courseData,
                                content: {
                                    ...courseData.content,
                                    aboutCourse: { ...(courseData.content?.aboutCourse || {}), description: val }
                                }
                            })}
                            placeholder="Write comprehensive course details, outcomes, and objectives..."
                        />
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-3">
                        <label className="block text-[14px] font-bold text-[#374151] mb-0">Training Highlights</label>
                        <button
                            type="button"
                            onClick={() => {
                                const newHighlights = [...(courseData.content?.aboutCourse?.highlights || [])];
                                const newIndex = newHighlights.length;
                                newHighlights.push("");
                                setCourseData({
                                    ...courseData,
                                    content: {
                                        ...courseData.content,
                                        aboutCourse: { ...(courseData.content?.aboutCourse || {}), highlights: newHighlights }
                                    }
                                });
                                scrollToNewItem(`about-highlight-${newIndex}`);
                            }}
                            className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#0A66C2] hover:underline cursor-pointer"
                        >
                            <Plus size={15} /> Add Highlight
                        </button>
                    </div>

                    <div className="space-y-3">
                        {(courseData.content?.aboutCourse?.highlights || []).map((h, i) => (
                            <div key={i} id={`about-highlight-${i}`} className="flex items-center gap-2.5">
                                <span className="text-[13px] font-semibold text-gray-400 w-6 text-center">{i + 1}.</span>
                                <input
                                    type="text"
                                    placeholder="e.g. Hands-on learning using real-world enterprise datasets"
                                    value={h}
                                    onChange={(e) => {
                                        const newHighlights = [...(courseData.content?.aboutCourse?.highlights || [])];
                                        newHighlights[i] = e.target.value;
                                        setCourseData({
                                            ...courseData,
                                            content: {
                                                ...courseData.content,
                                                aboutCourse: { ...(courseData.content?.aboutCourse || {}), highlights: newHighlights }
                                            }
                                        });
                                    }}
                                    className="flex-1 px-3 py-2.5 rounded-lg border border-gray-300 focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2] outline-none text-[14px] text-gray-800 bg-white"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newHighlights = [...(courseData.content?.aboutCourse?.highlights || [])];
                                        newHighlights.splice(i, 1);
                                        setCourseData({
                                            ...courseData,
                                            content: {
                                                ...courseData.content,
                                                aboutCourse: { ...(courseData.content?.aboutCourse || {}), highlights: newHighlights }
                                            }
                                        });
                                    }}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                    title="Remove highlight"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Career Opportunities & Salary */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-[18px] font-bold text-[#1f2937] flex items-center gap-2 mb-1">
                            <Briefcase size={20} className="text-[#0A66C2]" />
                            Career Opportunities & Salary
                        </h2>
                        <p className="text-[13px] text-gray-500 mb-0">Outline high-demand roles, expected salary bands, and hiring firms.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            const newIndex = (courseData.content?.careerSection?.roles || []).length;
                            setCourseData(prev => ({
                                ...prev,
                                content: {
                                    ...prev.content,
                                    careerSection: {
                                        ...(prev.content?.careerSection || {}),
                                        roles: [...(prev.content?.careerSection?.roles || []), { title: "", minSalary: "", avgSalary: "", maxSalary: "", companies: [] }]
                                    }
                                }
                            }));
                            scrollToNewItem(`career-role-${newIndex}`);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#0A66C2] text-[#0A66C2] bg-blue-50/50 hover:bg-blue-50 font-semibold text-[13px] transition-colors cursor-pointer"
                    >
                        <Plus size={15} /> Add Role
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[14px] font-bold text-[#374151] mb-1.5">Career Section Heading</label>
                        <input
                            type="text"
                            placeholder="e.g. Career Opportunities & Compensation"
                            value={courseData.content?.careerSection?.title || ""}
                            onChange={(e) => setCourseData(prev => ({ ...prev, content: { ...prev.content, careerSection: { ...(prev.content?.careerSection || {}), title: e.target.value } } }))}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-[#0A66C2] outline-none text-[14px] bg-white"
                        />
                    </div>
                    <div>
                        <label className="block text-[14px] font-bold text-[#374151] mb-1.5">Career Section Description</label>
                        <input
                            type="text"
                            placeholder="e.g. This course unlocks high-growth career opportunities"
                            value={courseData.content?.careerSection?.description || ""}
                            onChange={(e) => setCourseData(prev => ({ ...prev, content: { ...prev.content, careerSection: { ...(prev.content?.careerSection || {}), description: e.target.value } } }))}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-[#0A66C2] outline-none text-[14px] bg-white"
                        />
                    </div>
                </div>

                <div className="space-y-5 pt-2">
                    {(courseData.content?.careerSection?.roles || []).map((r, i) => (
                        <div key={i} id={`career-role-${i}`} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[13px] font-bold text-[#0A66C2] uppercase tracking-wider">Career Role {i + 1}</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newRoles = (courseData.content?.careerSection?.roles || []).filter((_, idx) => idx !== i);
                                        setCourseData(prev => ({ ...prev, content: { ...prev.content, careerSection: { ...(prev.content?.careerSection || {}), roles: newRoles } } }));
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                    title="Remove role"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                <div className="sm:col-span-1">
                                    <label className="block text-[12px] font-semibold text-gray-600 mb-1">Role Title</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Lead Architect"
                                        value={r.title || ""}
                                        onChange={(e) => {
                                            const newRoles = [...(courseData.content?.careerSection?.roles || [])];
                                            newRoles[i] = { ...newRoles[i], title: e.target.value };
                                            setCourseData(prev => ({ ...prev, content: { ...prev.content, careerSection: { ...(prev.content?.careerSection || {}), roles: newRoles } } }));
                                        }}
                                        className="w-full px-3.5 py-2 rounded-lg border border-gray-300 focus:border-[#0A66C2] outline-none text-[13.5px] bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[12px] font-semibold text-gray-600 mb-1">Min Salary</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 8L"
                                        value={r.minSalary || ""}
                                        onChange={(e) => {
                                            const newRoles = [...(courseData.content?.careerSection?.roles || [])];
                                            newRoles[i] = { ...newRoles[i], minSalary: e.target.value };
                                            setCourseData(prev => ({ ...prev, content: { ...prev.content, careerSection: { ...(prev.content?.careerSection || {}), roles: newRoles } } }));
                                        }}
                                        className="w-full px-3.5 py-2 rounded-lg border border-gray-300 focus:border-[#0A66C2] outline-none text-[13.5px] bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[12px] font-semibold text-gray-600 mb-1">Avg Salary</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 15L"
                                        value={r.avgSalary || ""}
                                        onChange={(e) => {
                                            const newRoles = [...(courseData.content?.careerSection?.roles || [])];
                                            newRoles[i] = { ...newRoles[i], avgSalary: e.target.value };
                                            setCourseData(prev => ({ ...prev, content: { ...prev.content, careerSection: { ...(prev.content?.careerSection || {}), roles: newRoles } } }));
                                        }}
                                        className="w-full px-3.5 py-2 rounded-lg border border-gray-300 focus:border-[#0A66C2] outline-none text-[13.5px] bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[12px] font-semibold text-gray-600 mb-1">Max Salary</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 28L"
                                        value={r.maxSalary || ""}
                                        onChange={(e) => {
                                            const newRoles = [...(courseData.content?.careerSection?.roles || [])];
                                            newRoles[i] = { ...newRoles[i], maxSalary: e.target.value };
                                            setCourseData(prev => ({ ...prev, content: { ...prev.content, careerSection: { ...(prev.content?.careerSection || {}), roles: newRoles } } }));
                                        }}
                                        className="w-full px-3.5 py-2 rounded-lg border border-gray-300 focus:border-[#0A66C2] outline-none text-[13.5px] bg-white"
                                    />
                                </div>
                            </div>

                            {/* Companies */}
                            <div className="pt-2 border-t border-gray-200">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[12.5px] font-bold text-gray-700">Recruiting Companies for this Role</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newRoles = [...(courseData.content?.careerSection?.roles || [])];
                                            const currCompanies = Array.isArray(newRoles[i].companies) ? [...newRoles[i].companies] : [];
                                            const newCompIndex = currCompanies.length;
                                            currCompanies.push({ name: "", logo: "" });
                                            newRoles[i] = { ...newRoles[i], companies: currCompanies };
                                            setCourseData(prev => ({ ...prev, content: { ...prev.content, careerSection: { ...(prev.content?.careerSection || {}), roles: newRoles } } }));
                                            scrollToNewItem(`role-${i}-company-${newCompIndex}`);
                                        }}
                                        className="text-[12px] font-semibold text-[#0A66C2] hover:underline cursor-pointer"
                                    >
                                        + Add Company
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {(Array.isArray(r.companies) ? r.companies : []).map((comp, compIdx) => {
                                        const compName = typeof comp === 'string' ? comp : (comp?.name || "");
                                        const compLogo = typeof comp === 'object' ? (comp?.logo || "") : "";

                                        return (
                                            <div key={compIdx} id={`role-${i}-company-${compIdx}`} className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-gray-200">
                                                <input
                                                    type="text"
                                                    placeholder="Company Name (e.g. Microsoft, Google)"
                                                    value={compName}
                                                    onChange={(e) => {
                                                        const newRoles = [...(courseData.content?.careerSection?.roles || [])];
                                                        const currCompanies = [...(Array.isArray(newRoles[i].companies) ? newRoles[i].companies : [])];
                                                        currCompanies[compIdx] = { name: e.target.value, logo: compLogo };
                                                        newRoles[i] = { ...newRoles[i], companies: currCompanies };
                                                        setCourseData(prev => ({ ...prev, content: { ...prev.content, careerSection: { ...(prev.content?.careerSection || {}), roles: newRoles } } }));
                                                    }}
                                                    className="flex-1 px-3 py-1.5 text-[13px] rounded border border-gray-300 outline-none"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <label className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-semibold cursor-pointer transition">
                                                        Upload Logo
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={async (e) => {
                                                                const file = e.target.files[0];
                                                                if (file) {
                                                                    try {
                                                                        const compressed = await compressImage(file, 100);
                                                                        const newRoles = [...(courseData.content?.careerSection?.roles || [])];
                                                                        const currCompanies = [...(Array.isArray(newRoles[i].companies) ? newRoles[i].companies : [])];
                                                                        currCompanies[compIdx] = { name: compName, logo: compressed };
                                                                        newRoles[i] = { ...newRoles[i], companies: currCompanies };
                                                                        setCourseData(prev => ({ ...prev, content: { ...prev.content, careerSection: { ...(prev.content?.careerSection || {}), roles: newRoles } } }));
                                                                    } catch (err) {
                                                                        toast.error("Failed to compress logo");
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                    </label>
                                                    {compLogo && (
                                                        <img src={compLogo} alt="logo" className="w-8 h-8 rounded object-contain border border-gray-200 p-0.5" />
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newRoles = [...(courseData.content?.careerSection?.roles || [])];
                                                            const currCompanies = [...(Array.isArray(newRoles[i].companies) ? newRoles[i].companies : [])].filter((_, idx) => idx !== compIdx);
                                                            newRoles[i] = { ...newRoles[i], companies: currCompanies };
                                                            setCourseData(prev => ({ ...prev, content: { ...prev.content, careerSection: { ...(prev.content?.careerSection || {}), roles: newRoles } } }));
                                                        }}
                                                        className="p-1 text-gray-400 hover:text-red-500 rounded"
                                                    >
                                                        <X size={15} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    // ==========================================
    // STEP 4: Batches & FAQs
    // ==========================================
    const renderStep4 = () => (
        <div className="space-y-6">
            {/* Upcoming Batches */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-[18px] font-bold text-[#1f2937] flex items-center gap-2 mb-1">
                            <Calendar size={20} className="text-[#0A66C2]" />
                            Upcoming Batches
                        </h2>
                        <p className="text-[13px] text-gray-500 mb-0">Configure dates and schedules for prospective students.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            const newBatches = [...(Array.isArray(courseData.content?.batches) ? courseData.content.batches : [])];
                            const newIndex = newBatches.length;
                            newBatches.push({ date: "", type: "Weekend", days: "", slot: "" });
                            setCourseData(prev => ({ ...prev, content: { ...prev.content, batches: newBatches } }));
                            scrollToNewItem(`batch-item-${newIndex}`);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#0A66C2] text-[#0A66C2] bg-blue-50/50 hover:bg-blue-50 font-semibold text-[13px] transition-colors cursor-pointer"
                    >
                        <Plus size={15} /> Add Batch
                    </button>
                </div>

                <div className="space-y-3">
                    {(Array.isArray(courseData.content?.batches) ? courseData.content.batches : []).map((b, i) => (
                        <div key={i} id={`batch-item-${i}`} className="p-4 rounded-xl border border-gray-200 bg-gray-50/40 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center relative group">
                            <div>
                                <label className="block text-[12px] font-semibold text-gray-500 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    value={b.date || ""}
                                    onChange={(e) => {
                                        const newBatches = [...(Array.isArray(courseData.content?.batches) ? courseData.content.batches : [])];
                                        newBatches[i] = { ...newBatches[i], date: e.target.value };
                                        setCourseData(prev => ({ ...prev, content: { ...prev.content, batches: newBatches } }));
                                    }}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-[#0A66C2] outline-none text-[13px] bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-[12px] font-semibold text-gray-500 mb-1">Batch Type</label>
                                <select
                                    value={b.type || "Weekend"}
                                    onChange={(e) => {
                                        const newBatches = [...(Array.isArray(courseData.content?.batches) ? courseData.content.batches : [])];
                                        newBatches[i] = { ...newBatches[i], type: e.target.value };
                                        setCourseData(prev => ({ ...prev, content: { ...prev.content, batches: newBatches } }));
                                    }}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-[#0A66C2] outline-none text-[13px] bg-white"
                                >
                                    <option value="Weekend">Weekend</option>
                                    <option value="Weekday">Weekday</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[12px] font-semibold text-gray-500 mb-1">Days</label>
                                <input
                                    type="text"
                                    placeholder="e.g. SAT - SUN"
                                    value={b.days || ""}
                                    onChange={(e) => {
                                        const newBatches = [...(Array.isArray(courseData.content?.batches) ? courseData.content.batches : [])];
                                        newBatches[i] = { ...newBatches[i], days: e.target.value };
                                        setCourseData(prev => ({ ...prev, content: { ...prev.content, batches: newBatches } }));
                                    }}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-[#0A66C2] outline-none text-[13px] bg-white"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex-1">
                                    <label className="block text-[12px] font-semibold text-gray-500 mb-1">Time Slot</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 10:00 AM - 01:00 PM"
                                        value={b.slot || ""}
                                        onChange={(e) => {
                                            const newBatches = [...(Array.isArray(courseData.content?.batches) ? courseData.content.batches : [])];
                                            newBatches[i] = { ...newBatches[i], slot: e.target.value };
                                            setCourseData(prev => ({ ...prev, content: { ...prev.content, batches: newBatches } }));
                                        }}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-[#0A66C2] outline-none text-[13px] bg-white"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newBatches = [...(Array.isArray(courseData.content?.batches) ? courseData.content.batches : [])];
                                        newBatches.splice(i, 1);
                                        setCourseData(prev => ({ ...prev, content: { ...prev.content, batches: newBatches } }));
                                    }}
                                    className="mt-5 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                    title="Remove batch"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Course FAQs */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-[18px] font-bold text-[#1f2937] flex items-center gap-2 mb-1">
                            <HelpCircle size={20} className="text-[#0A66C2]" />
                            Frequently Asked Questions (FAQs)
                        </h2>
                        <p className="text-[13px] text-gray-500 mb-0">Address common applicant queries regarding eligibility, fees, and placement.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            const currentFaqs = (courseData.content?.faqs && courseData.content?.faqs.length > 0) ? courseData.content.faqs : (courseData.content?.certificationQs || []);
                            const newIndex = currentFaqs.length;
                            addListItem("faqs", { q: "", a: "" });
                            scrollToNewItem(`faq-item-${newIndex}`);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#0A66C2] text-[#0A66C2] bg-blue-50/50 hover:bg-blue-50 font-semibold text-[13px] transition-colors cursor-pointer"
                    >
                        <Plus size={15} /> Add FAQ
                    </button>
                </div>

                <div className="space-y-4 pt-2">
                    {((courseData.content?.faqs && courseData.content?.faqs.length > 0) ? courseData.content.faqs : courseData.content?.certificationQs || []).map((item, index) => (
                        <div key={index} id={`faq-item-${index}`} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[12.5px] font-bold text-[#0A66C2]">Question {index + 1}</span>
                                <button
                                    type="button"
                                    onClick={() => removeListItem("faqs", index)}
                                    className="p-1 text-gray-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <input
                                type="text"
                                value={item.q || item.question || ""}
                                onChange={(e) => {
                                    const faqsList = courseData.content?.faqs || courseData.content?.certificationQs || [];
                                    if (!courseData.content?.faqs) {
                                        setCourseData(prev => ({ ...prev, content: { ...prev.content, faqs: faqsList } }));
                                    }
                                    updateListItem("faqs", index, "q", e.target.value);
                                }}
                                placeholder="e.g. What are the prerequisites to enroll in this course?"
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-[#0A66C2] outline-none text-[13.5px] font-medium bg-white"
                            />
                            <textarea
                                value={item.a || item.answer || ""}
                                onChange={(e) => {
                                    const faqsList = courseData.content?.faqs || courseData.content?.certificationQs || [];
                                    if (!courseData.content?.faqs) {
                                        setCourseData(prev => ({ ...prev, content: { ...prev.content, faqs: faqsList } }));
                                    }
                                    updateListItem("faqs", index, "a", e.target.value);
                                }}
                                rows={2}
                                placeholder="Answer details..."
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-[#0A66C2] outline-none text-[13.5px] bg-white resize-y"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderCurrentStepContent = () => {
        switch (currentStep) {
            case 0: return renderStep0();
            case 1: return renderStep1();
            case 2: return renderStep2();
            case 3: return renderStep3();
            case 4: return renderStep4();
            default: return renderStep0();
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/60 font-sans flex flex-col">
            {loading && <Loader />}

            {formMode === "list" ? (
                /* ========================================================================= */
                /* LIST VIEW: HR Dashboard Aesthetic                                         */
                /* ========================================================================= */
                <div className="w-full max-w-6xl mx-auto p-6 md:p-10 space-y-6">
                    {/* Header & Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-[22px] font-bold text-gray-900 tracking-tight mb-0">Course Offerings</h1>
                                <span className="px-2.5 py-0.5 bg-blue-50 text-[#0A66C2] text-[12px] font-bold rounded-full border border-blue-200/60">
                                    {courses.length} {courses.length === 1 ? 'Course' : 'Courses'}
                                </span>
                            </div>
                            <p className="text-[13px] text-gray-500 mt-1 mb-0">Manage your course catalog, curriculum, batches, and candidate training pages.</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="bg-[#0A66C2] hover:bg-[#004182] text-white px-5 py-2.5 rounded-full font-semibold text-[14px] shadow-sm flex items-center gap-2 cursor-pointer transition"
                            >
                                <Plus size={18} /> Add New Course
                            </button>
                        </div>
                    </div>

                    {/* Search & Filter bar */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search courses by title, slug, or category..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[13.5px] outline-none focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2] shadow-2xs"
                            />
                        </div>
                    </div>

                    {/* Course Cards Grid */}
                    {filteredCourses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredCourses.map(course => {
                                const originalPrice = course.content?.hero?.prices?.original;
                                const discountedPrice = course.content?.hero?.prices?.discounted;
                                const modulesCount = Array.isArray(course.content?.curriculum) ? course.content.curriculum.length : 0;
                                const batchesCount = Array.isArray(course.content?.batches) ? course.content.batches.length : 0;

                                return (
                                    <div key={course.id} className="bg-white rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col group">
                                        <div className="relative h-44 w-full bg-slate-100 overflow-hidden border-b border-gray-100">
                                            <img
                                                src={getImageUrl(course.image) || getPlaceholderSvg("Careerfast Course", 400, 200)}
                                                alt={course.title}
                                                onError={(e) => { e.target.onerror = null; e.target.src = getPlaceholderSvg("Course Image", 400, 200); }}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                            {course.category && (
                                                <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/95 backdrop-blur-xs text-[#0A66C2] text-[11px] font-bold rounded-md shadow-xs">
                                                    {course.category}
                                                </span>
                                            )}
                                        </div>

                                        <div className="p-3 flex-1 flex flex-col justify-between space-y-4">
                                            <div>
                                                <h3 className="text-[16px] font-bold text-gray-900 group-hover:text-[#0A66C2] transition-colors line-clamp-1 mb-1">
                                                    {course.title}
                                                </h3>
                                                <p className="text-xs text-gray-400 font-mono mb-2 truncate">/courses/{course.slug}</p>
                                                {course.description && (
                                                    <p className="text-[13px] text-gray-500 line-clamp-2 mb-0">
                                                        {course.description}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                                                <span className="font-semibold text-gray-900">
                                                    {discountedPrice ? `₹${discountedPrice}` : (originalPrice ? `₹${originalPrice}` : 'Free')}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    {modulesCount > 0 && <span>{modulesCount} modules</span>}
                                                    {batchesCount > 0 && <span>• {batchesCount} batches</span>}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleEdit(course)}
                                                        className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#0A66C2] text-[12.5px] font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                                                    >
                                                        <Edit size={14} /> Edit
                                                    </button>
                                                    <Link
                                                        href={`/courses/${course.slug}`}
                                                        target="_blank"
                                                        className="px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 text-[12.5px] font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer no-underline"
                                                    >
                                                        <ExternalLink size={13} /> View
                                                    </Link>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(course.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                                    title="Delete course"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center shadow-xs">
                            <div className="w-14 h-14 bg-blue-50 text-[#0A66C2] rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <BookOpen size={28} />
                            </div>
                            <h3 className="text-[17px] font-bold text-gray-800 mb-1">No courses found</h3>
                            <p className="text-[13.5px] text-gray-500 max-w-sm mx-auto mb-5">
                                {searchTerm ? "No courses matched your search criteria. Try a different query." : "You haven't posted any courses yet. Create your first course offering."}
                            </p>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="bg-[#0A66C2] hover:bg-[#004182] text-white px-6 py-2.5 rounded-full font-semibold text-[14px] shadow-sm inline-flex items-center gap-2 cursor-pointer transition"
                            >
                                <Plus size={16} /> Post First Course
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                /* ========================================================================= */
                /* FORM VIEW: HR Stepper Design Theme                                        */
                /* ========================================================================= */
                <div className="flex-1 flex flex-col">
                    {/* Top Navigation Stepper */}
                    <div className="w-full bg-white border-b border-gray-100 px-6 py-4 lg:px-12 shrink-0">
                        <div className="max-w-5xl mx-auto">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormMode("list")}
                                        className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors cursor-pointer"
                                        title="Back to Courses"
                                    >
                                        <ArrowLeft size={18} />
                                    </button>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h1 className="text-[20px] font-bold text-gray-900 tracking-tight mb-0">
                                                {formMode === "create" ? "Post a New Course" : "Edit Course"}
                                            </h1>
                                            <span className="px-2.5 py-0.5 bg-blue-50 text-[#0A66C2] border border-blue-200/60 text-[11px] font-bold rounded-full">
                                                HR Theme
                                            </span>
                                        </div>
                                        <p className="text-[12.5px] text-gray-500 mb-0 mt-2">
                                            Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].title}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormMode("list")}
                                    className="text-gray-500 hover:text-gray-800 text-[13px] font-semibold flex items-center gap-1.5 cursor-pointer"
                                >
                                    <X size={16} /> Cancel
                                </button>
                            </div>

                            {/* Stepper Steps */}
                            <div className="flex items-center w-full overflow-x-auto pb-1 no-scrollbar">
                                {STEPS.map((step, idx) => {
                                    const isActive = currentStep === idx;
                                    const isCompleted = currentStep > idx;
                                    const isLast = idx === STEPS.length - 1;

                                    return (
                                        <div
                                            key={step.id}
                                            className={`flex items-center cursor-pointer group ${!isLast ? 'flex-1' : ''}`}
                                            onClick={() => setCurrentStep(idx)}
                                        >
                                            <div className="flex items-center">
                                                {(isActive || isCompleted) ? (
                                                    <div className="w-6 h-6 rounded-full bg-[#0A66C2] flex items-center justify-center relative z-10 border border-[#0A66C2] text-white shrink-0">
                                                        {isCompleted ? <Check size={13} className="stroke-[3]" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                                                    </div>
                                                ) : (
                                                    <div className="w-6 h-6 rounded-full border border-gray-300 bg-white relative z-10 group-hover:border-gray-400 text-gray-400 flex items-center justify-center text-xs font-bold shrink-0">
                                                        {idx + 1}
                                                    </div>
                                                )}
                                                <span className={`ml-2.5 text-[13px] whitespace-nowrap transition-colors ${isActive ? 'text-[#0A66C2] font-bold' : 'text-gray-400 font-medium group-hover:text-gray-700'}`}>
                                                    {step.title}
                                                </span>
                                            </div>

                                            {!isLast && (
                                                <div className={`flex-1 h-[1px] mx-3 transition-colors min-w-[20px] ${isCompleted ? 'bg-[#0A66C2]' : 'bg-gray-200'}`} />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Step Body */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-8">
                        <div className="max-w-5xl mx-auto pb-28">
                            {renderCurrentStepContent()}
                        </div>
                    </div>

                    {/* Sticky Bottom Action Bar */}
                    <div className="border-t border-gray-200 bg-white p-4 md:px-10 lg:px-16 flex items-center justify-between sticky bottom-0 z-40 shadow-xs">
                        <button
                            type="button"
                            onClick={() => {
                                if (currentStep > 0) setCurrentStep(currentStep - 1);
                                else setFormMode("list");
                            }}
                            className="px-6 py-2.5 rounded-full font-medium text-[14px] text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                            {currentStep === 0 ? "Back to List" : "Back"}
                        </button>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                                className="px-6 py-2.5 rounded-full font-medium text-[14px] text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                                Save Draft
                            </button>

                            {currentStep < STEPS.length - 1 ? (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setCurrentStep(prev => prev + 1);
                                    }}
                                    className="bg-[#0A66C2] hover:bg-[#004182] text-white px-8 py-2.5 rounded-full font-semibold text-[14px] transition shadow-sm flex items-center gap-2 cursor-pointer"
                                >
                                    <span>Next Step</span>
                                    <ArrowRight size={16} />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="bg-[#0A66C2] hover:bg-[#004182] text-white px-8 py-2.5 rounded-full font-medium text-[14px] transition shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 size={18} />
                                            <span>{formMode === "edit" ? "Update Course" : "Publish Course"}</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
