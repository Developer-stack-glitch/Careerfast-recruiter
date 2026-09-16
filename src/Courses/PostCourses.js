'use client';
import React, { useState, useEffect } from "react";
import Header from "../Header/Header";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaPlus, FaTrash, FaSave, FaImage, FaLayerGroup, FaEdit, FaTimes, FaExternalLinkAlt } from "react-icons/fa";
import toast from 'react-hot-toast';
import { App } from "antd";
import { compressImage } from "../utils/imageCompressor";
import "../css/PostCourses.css";
import Loader from "../Components/Loader";
import { getImageUrl, getPlaceholderSvg } from "../utils/getImageUrl";
import dynamic from 'next/dynamic';
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";

const quillModules = {
    toolbar: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link', 'clean']
    ]
};

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
        ]
    }
};

export default function PostCourses() {
    const { modal } = App.useApp();
    const router = useRouter();
    const [courses, setCourses] = useState([]);
    const [formMode, setFormMode] = useState("list"); // "list", "create", "edit"
    const [currentCourseId, setCurrentCourseId] = useState(null);
    const [courseData, setCourseData] = useState(INITIAL_FORM_STATE);
    const [loading, setLoading] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    useEffect(() => {
        // Protection: Only admin (role_id 1) can access this page
        const stored = localStorage.getItem("loginDetails");
        if (stored) {
            try {
                const loginDetails = JSON.parse(stored);
                // Allow both Admins (1) and Recruiters (3)
                if (loginDetails.role_id !== 1 && loginDetails.role_id !== 3) {
                    toast.error("Access denied. Authorized personnel only.");
                    router.push("/");
                }
            } catch (err) {
                toast.error("Please Login to Post Course");
                setTimeout(() => {
                    router.push(`/login`);
                }, 200);
            }
        } else {
            toast.error("Please Login to Post Course");
            setTimeout(() => {
                router.push(`/login`);
            }, 200);
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
            setTimeout(() => {
                setLoading(false);
            }, 800);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCourseData(prev => {
            const newState = { ...prev, [name]: value };
            // Auto-generate slug from title if slug is currently empty or was just auto-generated
            if (name === "title" && (!prev.slug || prev.slug === prev.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))) {
                newState.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            }
            return newState;
        });
    };

    const handleContentChange = (e) => {
        const { name, value } = e.target;
        setCourseData(prev => ({
            ...prev,
            content: {
                ...prev.content,
                [name]: value
            }
        }));
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

    const addListItem = (section, item) => {
        setCourseData(prev => ({
            ...prev,
            content: {
                ...prev.content,
                [section]: [...(prev.content[section] || []), item]
            }
        }));
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
        e.preventDefault();
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
                setTimeout(() => setFormMode("list"), 1500);
            } else {
                toast.error(data.error || "Failed to save course");
            }
        } catch (err) {
            toast.error("Connection error");
        } finally {
            setTimeout(() => {
                setLoading(false);
            }, 800);
        }
    };

    const handleEdit = (course) => {
        const cContent = course.content || INITIAL_FORM_STATE.content;
        if (typeof cContent.tools === 'string') {
            cContent.tools = cContent.tools.split(",").map(s => ({ name: s.trim(), logo: "" })).filter(t => t.name);
        } else if (Array.isArray(cContent.tools)) {
            // Map any raw strings to objects for uniform UI handling
            cContent.tools = cContent.tools.map(t => typeof t === 'string' ? { name: t, logo: "" } : t);
        }

        setCourseData({
            ...course,
            imageBase64: course.image, // Map DB 'image' to form 'imageBase64'
            content: cContent
        });
        setCurrentCourseId(course.id);
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
        setFormMode("create");
    };

    return (
        <div className="post-courses-page">
            {loading && <Loader />}
            <Header />
            <div className="cms-container">
                <div className="cms-header">
                    <h1><FaLayerGroup /> Course Management</h1>
                    <p>{formMode === "list" ? "Manage your course offerings" : "Build your premium course page"}</p>
                </div>

                {formMode === "list" ? (
                    <div className="courses-list-view">
                        <div className="list-actions">
                            <button className="add-new-btn" onClick={resetForm}>
                                <FaPlus /> Add New Course
                            </button>
                        </div>
                        <div className="courses-grid">
                            {courses.length > 0 ? courses.map(course => (
                                <div key={course.id} className="course-admin-card">
                                    <Link href={`/courses/${course.slug}`} className="course-card-link">
                                        <div className="course-card-img">
                                            <img src={getImageUrl(course.image) || getPlaceholderSvg("No Image", 300, 150)} alt={course.title} onError={(e) => { e.target.onerror = null; e.target.src = getPlaceholderSvg("No Image", 300, 150); }} />
                                        </div>
                                    </Link>
                                    <div className="course-card-info">
                                        <Link href={`/courses/${course.slug}`} className="course-card-title-link">
                                            <h3>{course.title}</h3>
                                        </Link>
                                        <span className="course-card-slug">/{course.slug}</span>
                                        <div className="course-card-btns">
                                            <button className="btn-edit" onClick={() => handleEdit(course)}><FaEdit /> Edit</button>
                                            <button className="btn-delete" onClick={() => handleDelete(course.id)}><FaTrash /> Delete</button>
                                            <Link href={`/courses/${course.slug}`} className="btn-view">
                                                <FaExternalLinkAlt /> View
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="no-courses">No courses found. Add your first course!</div>
                            )}
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="cms-form">
                        <div className="form-sticky-header">
                            <button type="button" className="back-btn" onClick={() => setFormMode("list")}>
                                <FaTimes /> Cancel
                            </button>
                            <h2>{formMode === "create" ? "New Course" : "Edit Course"}</h2>
                            <button type="submit" className="save-btn-small" disabled={loading}>
                                <FaSave /> {loading ? "..." : "Save"}
                            </button>
                        </div>

                        {/* General Information */}
                        <div className="cms-section-card">
                            <h3>General Information</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Course Title</label>
                                    <input name="title" value={courseData.title} onChange={handleInputChange} placeholder="e.g. Full Stack Web Development" required />
                                </div>
                                <div className="form-group">
                                    <label>Slug (URL)</label>
                                    <input name="slug" value={courseData.slug} onChange={handleInputChange} placeholder="e.g. web-dev-launchpad" required />
                                </div>
                                <div className="form-group">
                                    <label>Category</label>
                                    <input name="category" value={courseData.category} onChange={handleInputChange} placeholder="e.g. Development" />
                                </div>
                            </div>
                            <div className="form-group full-width">
                                <label>Short Description (SEO)</label>
                                <textarea placeholder="Enter Short description" name="description" value={courseData.description} onChange={handleInputChange} rows="3"></textarea>
                            </div>
                            <div className="form-group">
                                <label>Featured Image</label>
                                <div className="image-upload-wrapper">
                                    <input type="file" onChange={handleImageUpload} accept="image/*" id="img-upload" hidden />
                                    <label htmlFor="img-upload" className="upload-btn">
                                        <FaImage /> {courseData.imageBase64 ? "Change Image" : "Upload Image"}
                                    </label>
                                    {courseData.imageBase64 && <img src={courseData.imageBase64} alt="Preview" className="img-preview" />}
                                </div>
                            </div>
                        </div>

                        {/* About Course CMS */}
                        <div className="cms-section-card">
                            <h3>About Course</h3>
                            <div className="form-group full-width">
                                <label>Description</label>
                                <ReactQuill
                                    theme="snow"
                                    modules={quillModules}
                                    value={courseData.content.aboutCourse?.description || ""} 
                                    onChange={(val) => setCourseData({
                                        ...courseData, 
                                        content: {
                                            ...courseData.content, 
                                            aboutCourse: { ...(courseData.content.aboutCourse || {}), description: val }
                                        }
                                    })} 
                                />
                            </div>
                            <div className="form-group full-width">
                                <label>Training Highlights</label>
                                <div className="dynamic-list">
                                    {(courseData.content.aboutCourse?.highlights || []).map((h, i) => (
                                        <div key={i} className="list-item-row" style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                            <input 
                                                style={{ flex: 1 }}
                                                placeholder="e.g. Hands-on learning using real-world data sets" 
                                                value={h} 
                                                onChange={(e) => {
                                                    const newHighlights = [...(courseData.content.aboutCourse?.highlights || [])];
                                                    newHighlights[i] = e.target.value;
                                                    setCourseData({
                                                        ...courseData, 
                                                        content: {
                                                            ...courseData.content, 
                                                            aboutCourse: { ...(courseData.content.aboutCourse || {}), highlights: newHighlights }
                                                        }
                                                    });
                                                }} 
                                            />
                                            <button type="button" onClick={() => {
                                                const newHighlights = [...(courseData.content.aboutCourse?.highlights || [])];
                                                newHighlights.splice(i, 1);
                                                setCourseData({
                                                    ...courseData, 
                                                    content: {
                                                        ...courseData.content, 
                                                        aboutCourse: { ...(courseData.content.aboutCourse || {}), highlights: newHighlights }
                                                    }
                                                });
                                            }} className="delete-btn"><FaTrash /></button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => {
                                        const newHighlights = [...(courseData.content.aboutCourse?.highlights || [])];
                                        newHighlights.push("");
                                        setCourseData({
                                            ...courseData, 
                                            content: {
                                                ...courseData.content, 
                                                aboutCourse: { ...(courseData.content.aboutCourse || {}), highlights: newHighlights }
                                            }
                                        });
                                    }} className="add-btn"><FaPlus /> Add Highlight</button>
                                </div>
                            </div>
                        </div>

                        {/* Batches CMS */}
                        <div className="cms-section-card">
                            <h3>Upcoming Batches</h3>
                            <div className="dynamic-list">
                                {(Array.isArray(courseData.content.batches) ? courseData.content.batches : []).map((b, i) => (
                                    <div key={i} className="list-item-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                                        <input type="date" value={b.date} onChange={(e) => {
                                            const newBatches = [...(Array.isArray(courseData.content.batches) ? courseData.content.batches : [])];
                                            newBatches[i] = { ...newBatches[i], date: e.target.value };
                                            setCourseData(prev => ({ ...prev, content: { ...prev.content, batches: newBatches } }));
                                        }} />
                                        <select value={b.type} onChange={(e) => {
                                            const newBatches = [...(Array.isArray(courseData.content.batches) ? courseData.content.batches : [])];
                                            newBatches[i] = { ...newBatches[i], type: e.target.value };
                                            setCourseData(prev => ({ ...prev, content: { ...prev.content, batches: newBatches } }));
                                        }} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
                                            <option value="">Select Type</option>
                                            <option value="Weekend">Weekend</option>
                                            <option value="Weekday">Weekday</option>
                                        </select>
                                        <input placeholder="Days (e.g. SAT - SUN)" value={b.days} onChange={(e) => {
                                            const newBatches = [...(Array.isArray(courseData.content.batches) ? courseData.content.batches : [])];
                                            newBatches[i] = { ...newBatches[i], days: e.target.value };
                                            setCourseData(prev => ({ ...prev, content: { ...prev.content, batches: newBatches } }));
                                        }} />
                                        <input placeholder="Time Slot" value={b.slot} onChange={(e) => {
                                            const newBatches = [...(Array.isArray(courseData.content.batches) ? courseData.content.batches : [])];
                                            newBatches[i] = { ...newBatches[i], slot: e.target.value };
                                            setCourseData(prev => ({ ...prev, content: { ...prev.content, batches: newBatches } }));
                                        }} />
                                        <button type="button" onClick={() => {
                                            const newBatches = [...(Array.isArray(courseData.content.batches) ? courseData.content.batches : [])];
                                            newBatches.splice(i, 1);
                                            setCourseData(prev => ({ ...prev, content: { ...prev.content, batches: newBatches } }));
                                        }} className="delete-btn"><FaTrash /></button>
                                    </div>
                                ))}
                                <button type="button" onClick={() => {
                                    const newBatches = [...(Array.isArray(courseData.content.batches) ? courseData.content.batches : [])];
                                    newBatches.push({ date: "", type: "Weekend", days: "", slot: "" });
                                    setCourseData(prev => ({ ...prev, content: { ...prev.content, batches: newBatches } }));
                                }} className="add-btn" style={{ marginTop: '10px' }}><FaPlus /> Add Batch</button>
                            </div>
                        </div>

                        {/* Hero / Pricing Section CMS */}
                        <div className="cms-section-card">
                            <h3>Pricing & Hero Data</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Original Price (₹)</label>
                                    <input placeholder="Enter Original Price" name="original" value={courseData.content.hero?.prices?.original || ""} onChange={handlePriceChange} />
                                </div>
                                <div className="form-group">
                                    <label>Discounted Price (₹)</label>
                                    <input placeholder="Enter Discounted Price" name="discounted" value={courseData.content.hero?.prices?.discounted || ""} onChange={handlePriceChange} />
                                </div>
                                <div className="form-group">
                                    <label>Offer Expiry</label>
                                    <input placeholder="Enter Offer Expiry" name="expiry" value={courseData.content.hero?.prices?.expiry || ""} onChange={handlePriceChange} />
                                </div>
                            </div>

                            <div className="form-grid" style={{ marginTop: '20px' }}>
                                <div className="form-group">
                                    <label>Overall Rating</label>
                                    <input placeholder="e.g. 4.5" name="overall" value={courseData.content.hero?.ratings?.overall || ""} onChange={(e) => {
                                        setCourseData(prev => ({ ...prev, content: { ...prev.content, hero: { ...prev.content.hero, ratings: { ...prev.content.hero?.ratings, overall: e.target.value } } } }));
                                    }} />
                                </div>
                                <div className="form-group">
                                    <label>Google Rating</label>
                                    <input placeholder="e.g. 4.7/5" name="google" value={courseData.content.hero?.ratings?.google || ""} onChange={(e) => {
                                        setCourseData(prev => ({ ...prev, content: { ...prev.content, hero: { ...prev.content.hero, ratings: { ...prev.content.hero?.ratings, google: e.target.value } } } }));
                                    }} />
                                </div>
                                <div className="form-group">
                                    <label>Course Report Rating</label>
                                    <input placeholder="e.g. 4.8/5" name="courseReport" value={courseData.content.hero?.ratings?.courseReport || ""} onChange={(e) => {
                                        setCourseData(prev => ({ ...prev, content: { ...prev.content, hero: { ...prev.content.hero, ratings: { ...prev.content.hero?.ratings, courseReport: e.target.value } } } }));
                                    }} />
                                </div>
                                <div className="form-group">
                                    <label>SwitchUp Rating</label>
                                    <input placeholder="e.g. 4.8/5" name="switchUp" value={courseData.content.hero?.ratings?.switchUp || ""} onChange={(e) => {
                                        setCourseData(prev => ({ ...prev, content: { ...prev.content, hero: { ...prev.content.hero, ratings: { ...prev.content.hero?.ratings, switchUp: e.target.value } } } }));
                                    }} />
                                </div>
                            </div>

                            <div className="form-grid" style={{ marginTop: '20px' }}>
                                <div className="form-group">
                                    <label>Hiring Crops</label>
                                    <input placeholder="e.g. 100+ Companies" name="hiringPartners" value={courseData.content.hero?.stats?.hiringPartners || ""} onChange={(e) => {
                                        setCourseData(prev => ({ ...prev, content: { ...prev.content, hero: { ...prev.content.hero, stats: { ...prev.content.hero?.stats, hiringPartners: e.target.value } } } }));
                                    }} />
                                </div>
                                <div className="form-group">
                                    <label>Live Projects</label>
                                    <input placeholder="e.g. 3 Projects" name="liveProjects" value={courseData.content.hero?.stats?.liveProjects || ""} onChange={(e) => {
                                        setCourseData(prev => ({ ...prev, content: { ...prev.content, hero: { ...prev.content.hero, stats: { ...prev.content.hero?.stats, liveProjects: e.target.value } } } }));
                                    }} />
                                </div>
                                <div className="form-group">
                                    <label>3 Certification</label>
                                    <input placeholder="e.g. Guaranteed" name="certificationPass" value={courseData.content.hero?.stats?.certificationPass || ""} onChange={(e) => {
                                        setCourseData(prev => ({ ...prev, content: { ...prev.content, hero: { ...prev.content.hero, stats: { ...prev.content.hero?.stats, certificationPass: e.target.value } } } }));
                                    }} />
                                </div>
                                <div className="form-group">
                                    <label>Training Format</label>
                                    <input placeholder="e.g. Live Online" name="trainingFormat" value={courseData.content.hero?.stats?.trainingFormat || ""} onChange={(e) => {
                                        setCourseData(prev => ({ ...prev, content: { ...prev.content, hero: { ...prev.content.hero, stats: { ...prev.content.hero?.stats, trainingFormat: e.target.value } } } }));
                                    }} />
                                </div>
                            </div>

                            <div className="dynamic-list" style={{ marginTop: '20px' }}>
                                <label>Hero Highlights (Checkmarks)</label>
                                {(courseData.content.hero?.highlights || []).map((h, i) => (
                                    <div key={i} className="list-item-row">
                                        <input placeholder="Text (e.g. Build modern websites from scratch)" value={h.text} onChange={(e) => {
                                            const newH = [...(courseData.content.hero.highlights || [])];
                                            newH[i].text = e.target.value;
                                            setCourseData(prev => ({ ...prev, content: { ...prev.content, hero: { ...prev.content.hero, highlights: newH } } }));
                                        }} />
                                        <input placeholder="Subtext (e.g. using the latest AI tools)" value={h.subtext} onChange={(e) => {
                                            const newH = [...(courseData.content.hero.highlights || [])];
                                            newH[i].subtext = e.target.value;
                                            setCourseData(prev => ({ ...prev, content: { ...prev.content, hero: { ...prev.content.hero, highlights: newH } } }));
                                        }} />
                                        <button type="button" onClick={() => {
                                            const newH = (courseData.content.hero.highlights || []).filter((_, idx) => idx !== i);
                                            setCourseData(prev => ({ ...prev, content: { ...prev.content, hero: { ...prev.content.hero, highlights: newH } } }));
                                        }} className="delete-btn"><FaTrash /></button>
                                    </div>
                                ))}
                                <button type="button" onClick={() => {
                                    setCourseData(prev => ({
                                        ...prev,
                                        content: {
                                            ...prev.content,
                                            hero: {
                                                ...prev.content.hero,
                                                highlights: [...(prev.content.hero?.highlights || []), { text: "", subtext: "" }]
                                            }
                                        }
                                    }));
                                }} className="add-btn"><FaPlus /> Add Highlight</button>
                            </div>
                        </div>

                        {/* Curriculum CMS */}
                        <div className="cms-section-card">
                            <h3>Curriculum / Modules</h3>
                            <div className="form-group full-width" style={{ marginBottom: '20px' }}>
                                <label>Curriculum Heading</label>
                                <input 
                                    placeholder="e.g. Curriculum & Projects" 
                                    value={courseData.content.curriculumHeading || ""} 
                                    onChange={(e) => setCourseData(prev => ({ ...prev, content: { ...prev.content, curriculumHeading: e.target.value } }))} 
                                />
                            </div>
                            <div className="form-group full-width" style={{ marginBottom: '20px' }}>
                                <label>Curriculum Description</label>
                                <textarea 
                                    placeholder="e.g. Explore the modules and hands-on projects that make our curriculum comprehensive and industry-relevant." 
                                    value={courseData.content.curriculumDescription || ""} 
                                    onChange={(e) => setCourseData(prev => ({ ...prev, content: { ...prev.content, curriculumDescription: e.target.value } }))} 
                                    rows="2"
                                ></textarea>
                            </div>
                            <div className="dynamic-list">
                                {(courseData.content.curriculum || []).map((m, i) => (
                                    <div key={i} className="list-item-block">
                                        <div className="block-header">
                                            <span>Module {i + 1}</span>
                                            <button type="button" onClick={() => removeListItem("curriculum", i)} className="delete-btn"><FaTrash /></button>
                                        </div>
                                        <input placeholder="Module Title" value={m.title} onChange={(e) => updateListItem("curriculum", i, "title", e.target.value)} />
                                        <div style={{ marginTop: '10px' }}>
                                            <ReactQuill
                                                theme="snow"
                                                value={m.content}
                                                onChange={(val) => updateListItem("curriculum", i, "content", val)}
                                                placeholder="Module Content (Use formatting tools above)"
                                            />
                                        </div>
                                    </div>
                                ))}
                                <button type="button" onClick={() => addListItem("curriculum", { title: "", content: "" })} className="add-btn"><FaPlus /> Add Module</button>
                            </div>
                        </div>

                        {/* Industry Projects CMS */}
                        <div className="cms-section-card">
                            <h3>Industry Projects</h3>
                            <div className="form-group full-width" style={{ marginBottom: '20px' }}>
                                <label>Projects Heading</label>
                                <input 
                                    placeholder="e.g. Hands-On Industry Projects" 
                                    value={courseData.content.projectsHeading || ""} 
                                    onChange={(e) => setCourseData(prev => ({ ...prev, content: { ...prev.content, projectsHeading: e.target.value } }))} 
                                />
                            </div>
                            <div className="form-group full-width" style={{ marginBottom: '20px' }}>
                                <label>Projects Description</label>
                                <textarea 
                                    placeholder="e.g. Gain practical experience by building real-world applications using industry-standard tools and technologies." 
                                    value={courseData.content.projectsDescription || ""} 
                                    onChange={(e) => setCourseData(prev => ({ ...prev, content: { ...prev.content, projectsDescription: e.target.value } }))} 
                                    rows="2"
                                ></textarea>
                            </div>
                            <div className="dynamic-list">
                                {(courseData.content.projects || []).map((p, i) => (
                                    <div key={i} className="list-item-block">
                                        <div className="block-header">
                                            <span>Project {i + 1}</span>
                                            <button type="button" onClick={() => removeListItem("projects", i)} className="delete-btn"><FaTrash /></button>
                                        </div>
                                        <input placeholder="Project Title" value={p.title || ""} onChange={(e) => updateListItem("projects", i, "title", e.target.value)} />
                                        <textarea placeholder="Project Description" value={p.desc || ""} onChange={(e) => updateListItem("projects", i, "desc", e.target.value)} rows="3" style={{ marginTop: '10px' }}></textarea>
                                        <input placeholder="Technologies (comma separated, e.g., AWS Kinesis, DynamoDB, Lambda)" value={Array.isArray(p.tech) ? p.tech.join(', ') : (p.tech || "")} onChange={(e) => updateListItem("projects", i, "tech", e.target.value)} style={{ marginTop: '10px' }} />
                                    </div>
                                ))}
                                <button type="button" onClick={() => addListItem("projects", { title: "", desc: "", tech: "" })} className="add-btn"><FaPlus /> Add Project</button>
                            </div>
                        </div>

                        {/* Career Opportunities CMS */}
                        <div className="cms-section-card">
                            <h3>Career Opportunities & Salary</h3>
                            <div className="form-group full-width" style={{ marginBottom: '20px' }}>
                                <label>Career Section Heading</label>
                                <input 
                                    placeholder="e.g. Career Opportunities & Salary" 
                                    value={courseData.content.careerSection?.title || ""} 
                                    onChange={(e) => setCourseData(prev => ({ ...prev, content: { ...prev.content, careerSection: { ...(prev.content.careerSection || {}), title: e.target.value } } }))} 
                                />
                            </div>
                            <div className="form-group full-width" style={{ marginBottom: '20px' }}>
                                <label>Career Section Description</label>
                                <textarea 
                                    placeholder="e.g. The {courseData.title} Course Program covers industry-standard tools..." 
                                    value={courseData.content.careerSection?.description || ""} 
                                    onChange={(e) => setCourseData(prev => ({ ...prev, content: { ...prev.content, careerSection: { ...(prev.content.careerSection || {}), description: e.target.value } } }))} 
                                    rows="3"
                                ></textarea>
                                <small style={{ color: '#64748b' }}>Use <b>{`{courseData.title}`}</b> to dynamically insert the course title in the description.</small>
                            </div>

                            <div className="dynamic-list">
                                <label>Career Roles</label>
                                {(courseData.content.careerSection?.roles || []).map((r, i) => (
                                    <div key={i} className="list-item-block" style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                                        <div className="block-header">
                                            <span>Role {i + 1}</span>
                                            <button type="button" onClick={() => {
                                                const newRoles = (courseData.content.careerSection?.roles || []).filter((_, idx) => idx !== i);
                                                setCourseData(prev => ({ ...prev, content: { ...prev.content, careerSection: { ...(prev.content.careerSection || {}), roles: newRoles } } }));
                                            }} className="delete-btn"><FaTrash /></button>
                                        </div>
                                        <div className="form-group full-width">
                                            <label>Role Title</label>
                                            <input value={r.title} onChange={(e) => {
                                                const newRoles = [...(courseData.content.careerSection?.roles || [])];
                                                newRoles[i].title = e.target.value;
                                                setCourseData(prev => ({ ...prev, content: { ...prev.content, careerSection: { ...(prev.content.careerSection || {}), roles: newRoles } } }));
                                            }} placeholder="e.g. Cloud Computing Architect" />
                                        </div>
                                        <div className="form-grid">
                                            <div className="form-group">
                                                <label>Min Salary</label>
                                                <input value={r.minSalary} onChange={(e) => {
                                                    const newRoles = [...(courseData.content.careerSection?.roles || [])];
                                                    newRoles[i].minSalary = e.target.value;
                                                    setCourseData(prev => ({ ...prev, content: { ...prev.content, careerSection: { ...(prev.content.careerSection || {}), roles: newRoles } } }));
                                                }} placeholder="8L" />
                                            </div>
                                            <div className="form-group">
                                                <label>Avg Salary</label>
                                                <input value={r.avgSalary} onChange={(e) => {
                                                    const newRoles = [...(courseData.content.careerSection?.roles || [])];
                                                    newRoles[i].avgSalary = e.target.value;
                                                    setCourseData(prev => ({ ...prev, content: { ...prev.content, careerSection: { ...(prev.content.careerSection || {}), roles: newRoles } } }));
                                                }} placeholder="12L" />
                                            </div>
                                            <div className="form-group">
                                                <label>Max Salary</label>
                                                <input value={r.maxSalary} onChange={(e) => {
                                                    const newRoles = [...(courseData.content.careerSection?.roles || [])];
                                                    newRoles[i].maxSalary = e.target.value;
                                                    setCourseData(prev => ({ ...prev, content: { ...prev.content, careerSection: { ...(prev.content.careerSection || {}), roles: newRoles } } }));
                                                }} placeholder="22L" />
                                            </div>
                                        </div>

                                        <div className="dynamic-list" style={{ marginTop: '15px' }}>
                                            <label>Top Recruiting Companies</label>
                                            {(r.companies || []).map((comp, compIdx) => (
                                                <div key={compIdx} className="list-item-row" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '10px', alignItems: 'center' }}>
                                                    <input placeholder="Company Name" value={comp.name} onChange={(e) => {
                                                        const newRoles = [...(courseData.content.careerSection?.roles || [])];
                                                        newRoles[i].companies[compIdx].name = e.target.value;
                                                        setCourseData(prev => ({ ...prev, content: { ...prev.content, careerSection: { ...(prev.content.careerSection || {}), roles: newRoles } } }));
                                                    }} />
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <input type="file" accept="image/*" onChange={async (e) => {
                                                            const file = e.target.files[0];
                                                            if (file) {
                                                                try {
                                                                    const compressed = await compressImage(file, 100);
                                                                    const newRoles = [...(courseData.content.careerSection?.roles || [])];
                                                                    newRoles[i].companies[compIdx].logo = compressed;
                                                                    setCourseData(prev => ({ ...prev, content: { ...prev.content, careerSection: { ...(prev.content.careerSection || {}), roles: newRoles } } }));
                                                                } catch (err) {
                                                                    console.error("Error compressing logo:", err);
                                                                    toast.error("Failed to compress logo");
                                                                }
                                                            }
                                                        }} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', width: '100%' }} />
                                                        {comp.logo && (
                                                            <div style={{ width: '40px', height: '40px', flexShrink: 0, borderRadius: '4px', overflow: 'hidden', border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
                                                                <img src={comp.logo.startsWith('http') ? comp.logo : comp.logo} alt="logo preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button type="button" onClick={() => {
                                                        const newRoles = [...(courseData.content.careerSection?.roles || [])];
                                                        newRoles[i].companies = newRoles[i].companies.filter((_, idx) => idx !== compIdx);
                                                        setCourseData(prev => ({ ...prev, content: { ...prev.content, careerSection: { ...(prev.content.careerSection || {}), roles: newRoles } } }));
                                                    }} className="delete-btn"><FaTrash /></button>
                                                </div>
                                            ))}
                                            <button type="button" onClick={() => {
                                                const newRoles = [...(courseData.content.careerSection?.roles || [])];
                                                newRoles[i].companies.push({ name: "", logo: "" });
                                                setCourseData(prev => ({ ...prev, content: { ...prev.content, careerSection: { ...(prev.content.careerSection || {}), roles: newRoles } } }));
                                            }} className="add-btn"><FaPlus /> Add Company</button>
                                        </div>
                                    </div>
                                ))}
                                <button type="button" onClick={() => {
                                    setCourseData(prev => ({
                                        ...prev,
                                        content: {
                                            ...prev.content,
                                            careerSection: {
                                                ...(prev.content.careerSection || {}),
                                                roles: [...(prev.content.careerSection?.roles || []), { title: "", minSalary: "", avgSalary: "", maxSalary: "", companies: [] }]
                                            }
                                        }
                                    }));
                                }} className="add-btn"><FaPlus /> Add Career Role</button>
                            </div>
                        </div>

                        {/* Skills & Tools CMS */}
                        <div className="cms-section-card">
                            <h3>Skills & Tools</h3>
                            <div className="form-group full-width" style={{ marginBottom: '20px' }}>
                                <label>Skills Section Heading</label>
                                <input 
                                    placeholder="e.g. Core Competencies & Tools" 
                                    value={courseData.content.skillsHeading || ""} 
                                    onChange={(e) => setCourseData(prev => ({ ...prev, content: { ...prev.content, skillsHeading: e.target.value } }))} 
                                />
                            </div>
                            <div className="form-group full-width" style={{ marginBottom: '20px' }}>
                                <label>Skills Section Description</label>
                                <textarea 
                                    placeholder="e.g. Master the industry-standard skills and technologies required..." 
                                    value={courseData.content.skillsDescription || ""} 
                                    onChange={(e) => setCourseData(prev => ({ ...prev, content: { ...prev.content, skillsDescription: e.target.value } }))} 
                                    rows="2"
                                ></textarea>
                                <small style={{ color: '#64748b' }}>Use <b>{`{courseData.title}`}</b> to dynamically insert the course title in the description.</small>
                            </div>
                            <div className="form-group full-width">
                                <label>Tools Covered</label>
                                <div className="dynamic-list" style={{ marginTop: '10px' }}>
                                    {(Array.isArray(courseData.content.tools) ? courseData.content.tools : []).map((t, i) => (
                                        <div key={i} className="list-item-row" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                                            <input placeholder="Tool Name (e.g. Amazon Web Services)" value={t.name || (typeof t === 'string' ? t : "")} onChange={(e) => {
                                                const newTools = [...(Array.isArray(courseData.content.tools) ? courseData.content.tools : [])];
                                                if (typeof newTools[i] === 'string') {
                                                    newTools[i] = { name: e.target.value, logo: "" };
                                                } else {
                                                    newTools[i] = { ...newTools[i], name: e.target.value };
                                                }
                                                setCourseData(prev => ({ ...prev, content: { ...prev.content, tools: newTools } }));
                                            }} />
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <input type="file" accept="image/*" onChange={async (e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        try {
                                                            const compressed = await compressImage(file, 100);
                                                            const newTools = [...(Array.isArray(courseData.content.tools) ? courseData.content.tools : [])];
                                                            if (typeof newTools[i] === 'string') {
                                                                newTools[i] = { name: newTools[i], logo: compressed };
                                                            } else {
                                                                newTools[i] = { ...newTools[i], logo: compressed };
                                                            }
                                                            setCourseData(prev => ({ ...prev, content: { ...prev.content, tools: newTools } }));
                                                        } catch (err) {
                                                            console.error("Error compressing tool logo:", err);
                                                            toast.error("Failed to compress tool logo");
                                                        }
                                                    }
                                                }} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', width: '100%' }} />
                                                {(t.logo) && (
                                                    <div style={{ width: '40px', height: '40px', flexShrink: 0, borderRadius: '4px', overflow: 'hidden', border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
                                                        <img src={t.logo} alt="logo preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                                    </div>
                                                )}
                                            </div>
                                            <button type="button" onClick={() => {
                                                const newTools = [...(Array.isArray(courseData.content.tools) ? courseData.content.tools : [])];
                                                newTools.splice(i, 1);
                                                setCourseData(prev => ({ ...prev, content: { ...prev.content, tools: newTools } }));
                                            }} className="delete-btn"><FaTrash /></button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => {
                                        const newTools = [...(Array.isArray(courseData.content.tools) ? courseData.content.tools : [])];
                                        newTools.push({ name: "", logo: "" });
                                        setCourseData(prev => ({ ...prev, content: { ...prev.content, tools: newTools } }));
                                    }} className="add-btn" style={{ marginTop: '10px' }}><FaPlus /> Add Tool</button>
                                </div>
                            </div>
                        </div>

                        {/* Course FAQs CMS */}
                        <div className="cms-section-card">
                            <h3>Course FAQs</h3>
                            {((courseData.content.faqs && courseData.content.faqs.length > 0) ? courseData.content.faqs : courseData.content.certificationQs || []).map((item, index) => (
                                <div key={index} className="module-edit-box">
                                    <div className="form-group full-width">
                                        <label>Question {index + 1}</label>
                                        <input
                                            type="text"
                                            value={item.q}
                                            onChange={(e) => {
                                                const faqsList = courseData.content.faqs || courseData.content.certificationQs || [];
                                                if (!courseData.content.faqs) {
                                                    setCourseData(prev => ({ ...prev, content: { ...prev.content, faqs: faqsList } }));
                                                }
                                                updateListItem("faqs", index, "q", e.target.value);
                                            }}
                                            placeholder="e.g. What are the prerequisites?"
                                        />
                                    </div>
                                    <div className="form-group full-width">
                                        <label>Answer {index + 1}</label>
                                        <textarea
                                            value={item.a}
                                            onChange={(e) => {
                                                const faqsList = courseData.content.faqs || courseData.content.certificationQs || [];
                                                if (!courseData.content.faqs) {
                                                    setCourseData(prev => ({ ...prev, content: { ...prev.content, faqs: faqsList } }));
                                                }
                                                updateListItem("faqs", index, "a", e.target.value);
                                            }}
                                            rows="2"
                                            placeholder="Answer to the question..."
                                        />
                                    </div>
                                    <button type="button" className="remove-btn" onClick={() => removeListItem("faqs", index)}>
                                        <FaTrash /> Remove FAQ
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                className="add-btn"
                                onClick={() => addListItem("faqs", { q: "", a: "" })}
                            >
                                + Add FAQ
                            </button>
                        </div>

                        <div className="cms-footer-actions">
                            <button type="submit" className="save-btn" disabled={loading}>
                                <FaSave /> {loading ? "Saving..." : "Save Course Content"}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            <style jsx>{`
                .remove-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 16px;
                    background-color: #fee2e2;
                    color: #ef4444;
                    border: 1px solid #fca5a5;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    margin-top: 10px;
                }
                .remove-btn:hover {
                    background-color: #fecaca;
                    color: #dc2626;
                }
                .add-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 10px 20px;
                    background-color: #ecfdf5;
                    color: #059669;
                    border: 1px dashed #6ee7b7;
                    border-radius: 6px;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    margin-top: 15px;
                    width: 100%;
                    justify-content: center;
                }
                .add-btn:hover {
                    background-color: #d1fae5;
                    color: #047857;
                }
                /* Additional generic nice styles for module-edit-box if needed */
                .module-edit-box {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 20px;
                }
            `}</style>
        </div>
    );
}
