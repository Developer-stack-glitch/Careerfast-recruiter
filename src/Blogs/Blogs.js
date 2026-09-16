'use client';
import { getImageUrl } from "../utils/getImageUrl";
import { useEffect, useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import SEO from "../Components/SEO/SEO";
import { getBlogs } from "../ApiService/action";
import { Card, Col, Row, Skeleton, Input, Tag, Empty, Pagination } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../Header/Header";
import { useNavigate } from "@/routing-shim";
import { SearchOutlined, ClockCircleOutlined, ArrowRightOutlined, TagOutlined } from "@ant-design/icons";
import "../css/Blogs.css";

export default function Blogs() {
    const navigate = useNavigate();
    const [blogTips, setBlogTips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 9;

    const categories = ["All", "Career Advice", "Interview Tips", "Job Search", "Resumes", "Workplace"];

    useEffect(() => {
        loadBlogsForTips();
    }, []);

    const generateSlug = (text) => {
        return text
            ?.toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
    };

    const loadBlogsForTips = async () => {
        try {
            setLoading(true);
            const res = await getBlogs();
            const blogs = res.data || [];
            setBlogTips(blogs);
        } catch (error) {
            console.error("Error fetching blog tips:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredBlogs = useMemo(() => {
        const filtered = blogTips.filter(blog => {
            const matchesSearch = blog.blogTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                blog.overview?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === "All" || blog.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
        // Reset to page 1 when filters change
        return filtered;
    }, [blogTips, searchTerm, selectedCategory]);

    // Handle filter changes to reset page
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedCategory]);

    const paginatedBlogs = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return filteredBlogs.slice(startIndex, startIndex + pageSize);
    }, [filteredBlogs, currentPage]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 500, behavior: 'smooth' });
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="blogs-page-wrapper">
            <SEO
                title="Career Insights, Tips & Strategies | CareerFast"
                description="Stay updated with the latest career insights, job search strategies, interview tips, and professional development advice. Expert guidance to boost your career growth."
                keywords="career blogs, job search tips, interview preparation, career advice, professional development, career growth, job hunting strategies, resume tips, CareerFast blogs"
                ogImage="https://careerfast.in/og-image-blogs.jpg"
                breadcrumbSchema={[
                    { name: "Home", item: "/" },
                    { name: "Blogs", item: "/blogs" }
                ]}
            />

            <Header />

            {/* Premium Hero Section */}
            <section className="blogs-hero">
                <div className="hero-overlay"></div>
                <motion.div
                    className="hero-content"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <Tag className="hero-badge">OUR JOURNAL</Tag>
                    <h1>Elevate Your <span>Career Journey</span></h1>
                    <p>Expert insights, industry trends, and strategic advice to help you navigate your professional path with confidence.</p>

                    <div className="search-container">
                        <Input
                            placeholder="Search articles, tips, or guides..."
                            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="hero-search-input"
                            allowClear
                        />
                    </div>

                    <div className="category-filter">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* Main Content Section */}
            <div className="blogs-main-container">
                <div id="ourblogs" className="blogs-grid-section">
                    <Row gutter={[32, 32]}>
                        {loading ? (
                            [...Array(6)].map((_, i) => (
                                <Col xs={24} sm={12} lg={8} key={i}>
                                    <div className="skeleton-card">
                                        <Skeleton.Image active className="skeleton-img" />
                                        <Skeleton active title={{ width: "80%" }} paragraph={{ rows: 3 }} />
                                    </div>
                                </Col>
                            ))
                        ) : paginatedBlogs.length === 0 ? (
                            <Col span={24}>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="empty-blogs-state"
                                >
                                    <Empty
                                        description={
                                            <div className="empty-desc">
                                                <h3>No articles found</h3>
                                                <p>We couldn't find any blogs matching your search or filters.</p>
                                                <button onClick={() => { setSearchTerm(""); setSelectedCategory("All"); }} className="reset-btn">
                                                    Reset Filters
                                                </button>
                                            </div>
                                        }
                                    />
                                </motion.div>
                            </Col>
                        ) : (
                            <AnimatePresence mode="popLayout">
                                {paginatedBlogs.map((tip, index) => (
                                    <Col xs={24} sm={12} lg={8} key={tip.id || index}>
                                        <motion.div
                                            variants={cardVariants}
                                            initial="hidden"
                                            animate="visible"
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ duration: 0.4, delay: index * 0.05 }}
                                            whileHover={{ y: -8 }}
                                            className="blog-card-outer"
                                        >
                                            <Card
                                                onClick={() => window.open(`/blog/${generateSlug(tip.blogTitle)}`, '_blank')}
                                                className="premium-blog-card"
                                                cover={
                                                    <div className="blog-image-wrapper">
                                                        <img
                                                            alt={tip.blogTitle}
                                                            src={getImageUrl(tip.blogImage)}
                                                            loading="lazy"
                                                        />
                                                        <div className="blog-category-tag">
                                                            {tip.category || "Career"}
                                                        </div>
                                                    </div>
                                                }
                                                variant="borderless"
                                            >
                                                <div className="blog-card-body">
                                                    <div className="blog-meta">
                                                        <span className="blog-date">
                                                            <ClockCircleOutlined /> {new Date(tip.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </span>
                                                        <span className="blog-read-time">
                                                            {tip.readingTime || "5 min read"}
                                                        </span>
                                                    </div>
                                                    <h3 className="blog-title-text">{tip.blogTitle}</h3>
                                                    <p className="blog-excerpt">
                                                        {tip.overview?.length > 120
                                                            ? tip.overview.slice(0, 120) + "..."
                                                            : tip.overview}
                                                    </p>
                                                    <div className="blog-card-footer">
                                                        <span className="author-info">
                                                            <div className="author-avatar">{tip.author?.[0] || 'C'}</div>
                                                            <span>By {tip.author || "CareerFast Team"}</span>
                                                        </span>
                                                        <div className="read-more-link">
                                                            <span>Continue Reading</span>
                                                            <ArrowRightOutlined className="arrow-icon" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    </Col>
                                ))}
                            </AnimatePresence>
                        )}
                    </Row>

                    {/* Pagination */}
                    {!loading && filteredBlogs.length > pageSize && (
                        <div className="blogs-pagination-wrapper">
                            <Pagination
                                current={currentPage}
                                pageSize={pageSize}
                                total={filteredBlogs.length}
                                onChange={handlePageChange}
                                showSizeChanger={false}
                                className="premium-pagination"
                            />
                        </div>
                    )}
                </div>

                {/* Newsletter Section */}
                <motion.section
                    className="newsletter-cta"
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <div className="newsletter-content">
                        <h2>Stay Ahead of the Curve</h2>
                        <p>Get the latest career hacks and job market insights delivered directly to your inbox.</p>
                        <div className="subscribe-form">
                            <Input placeholder="Enter your email address" className="subscribe-input" />
                            <button className="subscribe-btn">Subscribe Now</button>
                        </div>
                    </div>
                </motion.section>
            </div>

            <footer className="blogs-footer">
                <p>© {new Date().getFullYear()} CareerFast. All rights reserved. Empowering careers globally.</p>
            </footer>
        </div>
    );
}



