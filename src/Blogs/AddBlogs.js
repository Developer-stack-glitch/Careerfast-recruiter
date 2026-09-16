'use client';
import { getImageUrl } from "../utils/getImageUrl";
import { compressImage } from "../utils/imageCompressor";
import React, { useState } from "react";
import { CommonToaster } from "../Common/CommonToaster";
import { addBlog } from "../ApiService/action";
import dynamic from 'next/dynamic';
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";
import "../css/Blogs.css";
import { Upload } from "lucide-react";
import Header from "../Header/Header";
export default function AddBlogs() {
    const [form, setForm] = useState({
        blogTitle: "",
        overview: "",
        author: "",
        readingTime: "",
        blogDescription: "",
        blogImage: "",
    });
    const [loading, setLoading] = useState(false);

    const handleInput = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleDescriptionChange = (value) => {
        setForm({ ...form, blogDescription: value });
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const compressedBase64 = await compressImage(file, 200);
            setForm({ ...form, blogImage: compressedBase64 });
        } catch (err) {
            console.error("Compression error:", err);
            CommonToaster("Error compressing image. Please try again.", "error");
        }
    };


    const handleSubmit = async () => {
        if (!form.blogTitle || !form.blogDescription || !form.blogImage || !form.overview) {
            return CommonToaster("Please fill all required fields (*)", "warning");
        }

        const loginDetails = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem("loginDetails")) : null;
        const userId = loginDetails?.id;

        if (!userId) {
            return CommonToaster("User session not found. Please login again.", "error");
        }

        setLoading(true);
        try {
            const res = await addBlog({ ...form, userId });
            if (res.status === 200) {
                CommonToaster("Blog added successfully! 🚀", "success");
                setForm({
                    blogTitle: "",
                    overview: "",
                    author: "",
                    readingTime: "",
                    blogDescription: "",
                    blogImage: "",
                });

                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                CommonToaster(res.data?.message || "Error adding blog", "error");
            }
        } catch (err) {
            console.error("Add Blog Error:", err);
            CommonToaster(err.response?.data?.message || "Error adding blog. Please try again.", "error");
        } finally {
            setLoading(false);
        }
    };


    return (
        <>
            <Header />
            <div className="addblog-container">
                <div className="addblog-card">
                    <h1 className="addblog-title">Create a New Post</h1>

                    <div className="addblog-grid">
                        <input
                            type="text"
                            name="blogTitle"
                            placeholder="Blog Title *"
                            className="addblog-input"
                            value={form.blogTitle}
                            onChange={handleInput}
                        />

                        <input
                            type="text"
                            name="author"
                            placeholder="Author Name"
                            className="addblog-input"
                            value={form.author}
                            onChange={handleInput}
                        />

                        <input
                            type="text"
                            name="readingTime"
                            placeholder="Reading Time (e.g., 3 min)"
                            className="addblog-input"
                            value={form.readingTime}
                            onChange={handleInput}
                        />
                    </div>

                    <div style={{ marginBottom: 25 }}>
                        <textarea
                            name="overview"
                            placeholder="Short Overview * (Appears on blog cards)"
                            className="addblog-input"
                            style={{ minHeight: "100px", resize: "vertical" }}
                            value={form.overview}
                            onChange={handleInput}
                        />
                    </div>

                    <div className="addblog-editor">
                        <ReactQuill
                            value={form.blogDescription}
                            onChange={handleDescriptionChange}
                            theme="snow"
                            placeholder="Write your blog content here... *"
                        />
                    </div>

                    <div style={{ marginTop: 20 }}>
                        <label className="addblog-upload-label">Featured Image *</label>
                        <div className="addblog-file-input">
                            <Upload size={20} /> 
                            <span>{form.blogImage ? "Change Image" : "Upload Image"}</span>
                            <input
                                className="upload_blog_img"
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                            />
                        </div>
                    </div>

                    {form.blogImage && (
                        <div className="preview-container">
                            <label className="addblog-upload-label">Preview</label>
                            <img
                                src={getImageUrl(form.blogImage)}
                                alt="Preview"
                                className="addblog-preview"
                            />
                        </div>
                    )}

                    <button 
                        className="addblog-btn" 
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? "Posting Blog..." : "Publish Blog Post"}
                    </button>
                </div>
            </div>
        </>
    );
}

