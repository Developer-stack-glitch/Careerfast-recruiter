'use client';
import { getImageUrl } from "../utils/getImageUrl";
import { compressImage } from "../utils/imageCompressor";
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "@/routing-shim";
import SEO from "../Components/SEO/SEO";
import { CommonToaster } from "../Common/CommonToaster";
import { getBlogById, deleteBlog, updateBlog, getBlogs } from "../ApiService/action";
import { Modal, Tooltip } from "antd";
import {
    ClockCircleOutlined,
    LinkedinOutlined,
    TwitterOutlined,
    WhatsAppOutlined,
    SendOutlined,
    GlobalOutlined
} from "@ant-design/icons";

import "../css/Blogs.css";
import Header from "../Header/Header";
import { Edit, Trash } from "lucide-react";
import dynamic from 'next/dynamic';
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";
import { Upload } from "lucide-react";
import logo from "../images/careerfastlogofinal.png";
import Loader from "../Components/Loader";

export default function BlogSingle({ initialData, serverSlug }) {
    const { slug: clientSlug } = useParams();
    const slug = serverSlug || clientSlug;
    const navigate = useNavigate();

    const [blog, setBlog] = useState(initialData || null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [loginDetails, setLoginDetails] = useState(null);
    const [latestBlogs, setLatestBlogs] = useState([]);

    useEffect(() => {
        const stored = localStorage.getItem("loginDetails");
        const token = localStorage.getItem("AccessToken");
        if (stored && token && stored !== "undefined" && stored !== "null") {
            try {
                setLoginDetails(JSON.parse(stored));
            } catch (e) {
                setLoginDetails(null);
            }
        }
    }, []);

    const [form, setForm] = useState({
        blogTitle: "",
        overview: "",
        author: "",
        readingTime: "",
        blogDescription: "",
        blogImage: "",
    });

    const generateSlug = (text) => {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
    };

    // Helper function to clean and process blog content HTML
    const processContent = (html) => {
        if (!html) return "";
        return html
            .replace(/\u00AD/g, '')
            .replace(/\u200B/g, '')
            .replace(/&nbsp;/g, ' ')
            .trim();
    };

    // Reading progress bar logic
    useEffect(() => {
        const updateScrollProgress = () => {
            const currentScrollY = window.scrollY;
            const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = (currentScrollY / totalHeight) * 100;
            setScrollProgress(progress);
        };

        window.addEventListener("scroll", updateScrollProgress);
        return () => window.removeEventListener("scroll", updateScrollProgress);
    }, []);

    // Fetch blog + latest blogs
    const fetchBlog = async () => {
        try {
            const allBlogs = await getBlogs();
            const blogs = allBlogs.data || [];

            // Set latest blogs (sorted by date)
            const sortedLatest = blogs
                .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate))
                .slice(0, 5)
                .map(b => ({ ...b, blogTitle: processContent(b.blogTitle) }));

            setLatestBlogs(sortedLatest);

            // Find blog by slug
            const found = blogs.find(
                (b) => generateSlug(b.blogTitle) === slug
            );

            if (!found) {
                setLoading(false);
                return;
            }

            const res = await getBlogById(found.id);

            setBlog({
                ...res.data,
                blogDescription: processContent(res.data.blogDescription),
                blogTitle: processContent(res.data.blogTitle)
            });
            setForm({
                blogTitle: res.data.blogTitle,
                overview: res.data.overview,
                author: res.data.author,
                readingTime: res.data.readingTime,
                blogDescription: res.data.blogDescription,
                blogImage: res.data.blogImage,
            });

            // Artificial delay to ensure the premium loader is seen and transition is smooth
            setTimeout(() => {
                setLoading(false);
            }, 800);
        } catch (error) {
            console.error("Unable to fetch blog", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (initialData) {
            setBlog({
                ...initialData,
                blogDescription: processContent(initialData.blogDescription),
                blogTitle: processContent(initialData.blogTitle)
            });
            setForm({
                blogTitle: initialData.blogTitle,
                overview: initialData.overview,
                author: initialData.author,
                readingTime: initialData.readingTime,
                blogDescription: initialData.blogDescription,
                blogImage: initialData.blogImage,
            });

            // Artificial delay to ensure the premium loader is seen and transition is smooth
            setTimeout(() => {
                setLoading(false);
            }, 800);
            // Still fetch latest blogs
            const fetchLatest = async () => {
                try {
                    const allBlogs = await getBlogs();
                    const blogs = allBlogs.data || [];
                    const sortedLatest = blogs
                        .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate))
                        .slice(0, 5)
                        .map(b => ({ ...b, blogTitle: processContent(b.blogTitle) }));
                    setLatestBlogs(sortedLatest);
                } catch (e) { }
            };
            fetchLatest();
        } else if (slug) {
            fetchBlog();
        }
    }, [slug, initialData]);

    // Input handler
    const handleInput = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    // Update blog
    const handleUpdate = async () => {
        if (!loginDetails || !blog?.userId || Number(loginDetails.id) !== Number(blog.userId)) {
            CommonToaster("You are not authorized to edit this blog", "error");
            return;
        }
        try {
            await updateBlog(blog.id, { ...form, userId: loginDetails.id });
            CommonToaster("Blog updated successfully! ✨", "success");
            setEditMode(false);
            fetchBlog();
        } catch {
            CommonToaster("Error updating blog", "error");
        }
    };

    // Delete blog
    const handleDelete = async () => {
        const blogId = blog?.id || blog?._id;
        if (!blogId) return CommonToaster("Blog ID not found", "error");

        if (!loginDetails || !blog?.userId || Number(loginDetails.id) !== Number(blog.userId)) {
            CommonToaster("You are not authorized to delete this blog", "error");
            return;
        }

        setDeleteLoading(true);
        console.log("Starting deletion for ID:", blogId);
        try {
            const res = await deleteBlog(blogId, loginDetails.id);
            console.log("Delete response received:", res);

            if (res && (res.status === 200 || res.status === 204)) {
                CommonToaster("Blog deleted successfully 🗑️", "success");
                setIsDeleteModalOpen(false);
                setTimeout(() => {
                    navigate("/blogs");
                }, 1000);
            } else {
                CommonToaster("Unexpected response from server", "error");
            }
        } catch (err) {
            console.error("Delete process failed:", err);
            const errorMsg = err.response?.data?.message || "Failed to delete blog. Please try again.";
            CommonToaster(errorMsg, "error");
        } finally {
            setDeleteLoading(false);
        }
    };





    const shareOnLinkedIn = () => {
        const url = window.location.href;
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    };

    const shareOnTwitter = () => {
        const url = window.location.href;
        const text = `Check out this interesting article: ${blog?.blogTitle}`;
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    };

    const shareOnWhatsApp = () => {
        const url = window.location.href;
        const text = `Check out this interesting article: ${blog?.blogTitle} ${url}`;
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    };

    if (loading) {
        return <Loader />;
    }
    if (!blog) return <div className="singleblog-notfound">Blog not found</div>;

    return (
        <>
            {/* Reading Progress Bar */}
            <div className="reading-progress-bar" style={{ width: `${scrollProgress}%` }}></div>

            {!initialData && (
                <SEO
                    title={blog.blogTitle}
                    description={blog.overview}
                    keywords={`blog, career tips, ${blog.blogTitle.split(' ').join(', ')}, CareerFast`}
                    ogType="article"
                    ogImage={blog.blogImage}
                    structuredData={[
                        {
                            "@context": "https://schema.org",
                            "@type": "BlogPosting",
                            "headline": blog.blogTitle,
                            "description": blog.overview,
                            "image": blog.blogImage,
                            "author": {
                                "@type": "Person",
                                "name": blog.author || "CareerFast Team"
                            },
                            "publisher": {
                                "@type": "Organization",
                                "name": "CareerFast",
                                "logo": {
                                    "@type": "ImageObject",
                                    "url": "https://careerfast.in/logo.png"
                                }
                            },
                            "datePublished": blog.createdDate,
                            "mainEntityOfPage": {
                                "@type": "WebPage",
                                "@id": `https://careerfast.in/blog/${slug}`
                            }
                        }
                    ]}
                />
            )}
            <Header />

            <div className="singleblog-page-wrapper">
                <div className="singleblog-container">
                    <div className="singleblog-layout">

                        {/* ========== LEFT SIDE (MAIN BLOG) ========== */}
                        <div className="singleblog-main">
                            <div className="singleblog-card-premium">

                                {!editMode ? (
                                    <>
                                        {/* Blog Header */}
                                        <div className="singleblog-header-premium">
                                            <nav className="breadcrumb-premium">
                                                <span onClick={() => navigate('/')}>Home</span>
                                                <span className="separator">/</span>
                                                <span onClick={() => navigate('/blogs')}>Blogs</span>
                                                <span className="separator">/</span>
                                                <span className="current">Article</span>
                                            </nav>

                                            <h1 className="singleblog-title-premium">{blog.blogTitle}</h1>

                                            <div className="singleblog-meta-premium">
                                                <div className="author-details">
                                                    <div className="author-avatar-premium">{blog.author?.[0] || 'A'}</div>
                                                    <div className="author-info-text">
                                                        <span className="author-name">{blog.author || "CareerFast Team"}</span>
                                                        <span className="post-date">Published on {new Date(blog.createdDate || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                                    </div>
                                                </div>
                                                <div className="meta-stats">
                                                    <div className="meta-stat-item">
                                                        <ClockCircleOutlined />
                                                        <span>{blog.readingTime || "5 min"} read</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {blog.overview && (
                                            <div className="singleblog-overview-premium">
                                                {blog.overview}
                                            </div>
                                        )}

                                        {/* Actions for Admin (Only owner can edit/delete) */}
                                        {loginDetails && loginDetails.id && blog?.userId && Number(loginDetails.id) === Number(blog.userId) && (
                                            <div className="singleblog-admin-actions">
                                                <Tooltip title="Edit blog">
                                                    <button className="admin-btn edit" onClick={() => setEditMode(true)}>
                                                        <Edit size={16} /> Edit
                                                    </button>
                                                </Tooltip>

                                                <Tooltip title="Delete blog">
                                                    <button className="admin-btn delete" onClick={() => setIsDeleteModalOpen(true)}>
                                                        <Trash size={16} /> Delete
                                                    </button>
                                                </Tooltip>

                                            </div>
                                        )}


                                        {/* Blog Image */}
                                        {blog.blogImage && (
                                            <div className="singleblog-featured-image">
                                                <img
                                                    src={getImageUrl(blog.blogImage)}
                                                    alt={blog.blogTitle}
                                                    className="main-img"
                                                />
                                            </div>
                                        )}

                                        {/* Blog Content */}
                                        <div className="singleblog-content-wrapper">
                                            {/* Sticky Share Sidebar (Inside Content for Desktop) */}
                                            <div className="share-sidebar">
                                                <div className="share-label">SHARE</div>
                                                <div className="share-icons">
                                                    <button onClick={shareOnLinkedIn} className="share-icon linkedin" title="Share on LinkedIn">
                                                        <LinkedinOutlined />
                                                    </button>
                                                    <button onClick={shareOnTwitter} className="share-icon twitter" title="Share on Twitter">
                                                        <TwitterOutlined />
                                                    </button>
                                                    <button onClick={shareOnWhatsApp} className="share-icon whatsapp" title="Share on WhatsApp">
                                                        <WhatsAppOutlined />
                                                    </button>
                                                </div>
                                            </div>

                                            <article className="singleblog-article">
                                                <div
                                                    className="blog-inner-content"
                                                    dangerouslySetInnerHTML={{
                                                        __html: blog.blogDescription,
                                                    }}
                                                />
                                            </article>
                                        </div>

                                        {/* Author Box at End */}
                                        <div className="author-box-footer">
                                            <div className="author-avatar-large">{blog.author?.[0] || 'C'}</div>
                                            <div className="author-bio">
                                                <h4>{blog.author || "CareerFast Team"}</h4>
                                                <p>Passionate about helping individuals find their dream careers and stay updated with the latest industry trends. Follow CareerFast for more career advice and professional insights.</p>
                                                <div className="author-socials">
                                                    <a href="#"><LinkedinOutlined /></a>
                                                    <a href="#"><TwitterOutlined /></a>
                                                    <a href="#"><GlobalOutlined /></a>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Newsletter Signup in Blog */}
                                        <div className="blog-newsletter-card">
                                            <div className="newsletter-icon">
                                                <SendOutlined />
                                            </div>
                                            <div className="newsletter-info">
                                                <h3>Stay updated with CareerFast</h3>
                                                <p>Get the latest career tips, job market insights, and professional growth strategies delivered to your inbox.</p>
                                                <div className="newsletter-inline-form">
                                                    <input type="email" placeholder="Your email address" />
                                                    <button>Subscribe</button>
                                                </div>
                                            </div>
                                        </div>
                                    </>

                                ) : (
                                    <>
                                        {/* EDIT MODE */}
                                        <div className="edit-blog-container">
                                            <h2 className="edit-title">Edit Blog Post</h2>

                                            <div className="edit-grid">
                                                <div className="input-group">
                                                    <label>Blog Title</label>
                                                    <input
                                                        type="text"
                                                        name="blogTitle"
                                                        placeholder="Enter title..."
                                                        className="edit-input"
                                                        value={form.blogTitle}
                                                        onChange={handleInput}
                                                    />
                                                </div>

                                                <div className="input-group">
                                                    <label>Author Name</label>
                                                    <input
                                                        type="text"
                                                        name="author"
                                                        placeholder="Enter author name..."
                                                        className="edit-input"
                                                        value={form.author}
                                                        onChange={handleInput}
                                                    />
                                                </div>

                                                <div className="input-group">
                                                    <label>Reading Time</label>
                                                    <input
                                                        type="text"
                                                        name="readingTime"
                                                        placeholder="e.g. 5 min"
                                                        className="edit-input"
                                                        value={form.readingTime}
                                                        onChange={handleInput}
                                                    />
                                                </div>
                                            </div>

                                            <div className="input-group full">
                                                <label>Short Overview</label>
                                                <textarea
                                                    name="overview"
                                                    placeholder="A brief summary of the blog..."
                                                    className="edit-textarea"
                                                    value={form.overview}
                                                    onChange={handleInput}
                                                />
                                            </div>

                                            <div className="input-group full">
                                                <label>Content</label>
                                                <div className="quill-editor-wrapper">
                                                    <ReactQuill
                                                        value={form.blogDescription}
                                                        onChange={(value) =>
                                                            setForm({ ...form, blogDescription: value })
                                                        }
                                                        theme="snow"
                                                        placeholder="Write your amazing content here..."
                                                    />
                                                </div>
                                            </div>

                                            <div className="input-group full">
                                                <label>Featured Image</label>
                                                <div className="image-upload-zone">
                                                    <button className="upload-trigger">
                                                        <Upload size={20} /> Change Image
                                                        <input
                                                            className="hidden-file-input"
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={async (e) => {
                                                                const file = e.target.files[0];
                                                                if (!file) return;

                                                                try {
                                                                    const compressedBase64 = await compressImage(file, 200);
                                                                    setForm({ ...form, blogImage: compressedBase64 });
                                                                } catch (err) {
                                                                    console.error("Compression error:", err);
                                                                    CommonToaster("Error compressing image. Please try again.", "error");
                                                                }
                                                            }}
                                                        />
                                                    </button>
                                                    {form.blogImage && (
                                                        <div className="image-preview-box">
                                                            <img
                                                                src={getImageUrl(form.blogImage)}
                                                                alt="Preview"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="edit-actions">
                                                <button className="save-btn" onClick={handleUpdate}>
                                                    Save Changes
                                                </button>

                                                <button
                                                    className="cancel-btn"
                                                    onClick={() => setEditMode(false)}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* ========== RIGHT SIDE (STICKY SIDEBAR) ========== */}
                        <aside className="singleblog-sidebar">
                            <div className="sticky-sidebar-content">
                                <div className="sidebar-widget latest-blogs-widget">
                                    <h3 className="widget-title">Latest Articles</h3>
                                    <div className="latest-list">
                                        {latestBlogs.map((item) => (
                                            <div
                                                key={item.id}
                                                className="sidebar-blog-item"
                                                onClick={() =>
                                                    window.open(`/blog/${generateSlug(item.blogTitle)}`, '_blank')
                                                }
                                            >
                                                <div className="item-img">
                                                    <img
                                                        src={getImageUrl(item.blogImage)}
                                                        alt=""
                                                    />
                                                </div>
                                                <div className="item-info">
                                                    <h4 className="item-title">{item.blogTitle}</h4>
                                                    <span className="item-date">
                                                        {new Date(item.createdDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button className="view-all-btn" onClick={() => navigate('/blogs')}>View All Articles</button>
                                </div>

                                <div className="sidebar-widget categories-widget">
                                    <h3 className="widget-title">Top Categories</h3>
                                    <div className="category-list">
                                        <span className="cat-pill">Career Tips</span>
                                        <span className="cat-pill">Interview Prep</span>
                                        <span className="cat-pill">Resume Building</span>
                                        <span className="cat-pill">Industry News</span>
                                        <span className="cat-pill">Skills Development</span>
                                    </div>
                                </div>

                                <div className="sidebar-widget ad-widget">
                                    <div className="sidebar-promo">
                                        <h4>Find Your Next Job</h4>
                                        <p>Explore thousands of job opportunities across top companies.</p>
                                        <button onClick={() => navigate('/jobs')}>Search Jobs</button>
                                    </div>
                                </div>
                            </div>
                        </aside>

                    </div>
                </div>
            </div>
            {/* Delete Confirmation Modal */}
            <Modal
                title="Delete Blog?"
                open={isDeleteModalOpen}
                onOk={handleDelete}
                onCancel={() => setIsDeleteModalOpen(false)}
                okText="Yes, Delete"
                cancelText="Cancel"
                okType="danger"
                centered
                confirmLoading={deleteLoading}
            >
                <p>Are you sure you want to delete this blog? This action cannot be undone.</p>
            </Modal>
        </>
    );
}

