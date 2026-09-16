'use client';
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import SEO from '../Components/SEO/SEO';
import './Mentors.css';
import "../css/LandingPage.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useNavigate } from '@/routing-shim';
import { FaLaptopCode, FaChartLine, FaPaintBrush, FaBullhorn, FaUserTie, FaRocket } from 'react-icons/fa';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import { getImageUrl } from "../utils/getImageUrl";
import bannerImage from '../images/mentors-banner.png';
import need_content_img from "../images/need_guidence.webp";
import { motion } from "framer-motion";
import { Col, Row, Typography } from "antd";
import Slider from "react-slick";
import logo1 from "../images/logo1.svg";
import logo2 from "../images/logo2.svg";
import logo3 from "../images/logo3.svg";
import logo4 from "../images/logo4.svg";
import logo5 from "../images/flipcart.webp";
import logo6 from "../images/samsung-8.svg";
import logo7 from "../images/tata-1.svg";
import logo8 from "../images/tesla-pure.svg";
import logo9 from "../images/amazon.svg";
import logo10 from "../images/hundai.png";
import logo11 from "../images/apple.png";
import logo12 from "../images/hp.webp";
import logo13 from "../images/facebook.webp";
import { Spin } from "antd";
import mentor1 from "../images/Ankit-Sharma.jpg";
import mentor2 from "../images/priya.jpg";
import mentor3 from "../images/rahul.jpg";
import mentor4 from "../images/sneha.jpg";
import mentor5 from "../images/vikram.jpg";
import mentor6 from "../images/aditi.jpg";
import mentor8 from "../images/nisha.jpg";
import mentor9 from "../images/arjun.jpg";
const { Text } = Typography;

// Dummy Data
const mentorsData = [
    {
        id: 1,
        name: "Ankit Sharma",
        title: "Senior Software Engineer",
        company: "Google",
        image: mentor1,
        rating: "4.9",
        reviews: "120",
        skills: ["React", "System Design", "Career Guidance"]
    },
    {
        id: 2,
        name: "Priya V",
        title: "Product Manager",
        company: "Microsoft",
        image: mentor2,
        rating: "5.0",
        reviews: "85",
        skills: ["Product Strategy", "Interview Prep", "Resume Review"]
    },
    {
        id: 3,
        name: "Rahul Verma",
        title: "Data Scientist",
        company: "Amazon",
        image: mentor3,
        rating: "4.8",
        reviews: "200+",
        skills: ["Python", "Machine Learning", "Data Analysis"]
    },
    {
        id: 4,
        name: "Sneha Gupta",
        title: "UX Designer",
        company: "Airbnb",
        image: mentor4,
        rating: "4.9",
        reviews: "95",
        skills: ["UI/UX", "Portfolio Review", "Design Thinking"]
    },
    {
        id: 5,
        name: "Vikram Singh",
        title: "Backend Lead",
        company: "Netflix",
        image: mentor5,
        rating: "5.0",
        reviews: "150",
        skills: ["Node.js", "Microservices", "Scalability"]
    },
    {
        id: 6,
        name: "Aditi Rao",
        title: "Marketing Head",
        company: "Spotify",
        image: mentor6,
        rating: "4.7",
        reviews: "60",
        skills: ["Digital Marketing", "Brand Strategy", "Networking"]
    },
    {
        id: 7,
        name: "Karan Johar",
        title: "Investment Banker",
        company: "J.P. Morgan",
        image: "https://randomuser.me/api/portraits/men/45.jpg",
        rating: "4.8",
        reviews: "45",
        skills: ["Finance", "Mergers", "Valuation"]
    },
    {
        id: 8,
        name: "Nisha Patel",
        title: "HR Director",
        company: "Tata Sons",
        image: mentor8,
        rating: "5.0",
        reviews: "110",
        skills: ["HR", "Interview Prep", "Leadership"]
    },
    {
        id: 9,
        name: "Arjun Mehta",
        title: "AI Research Engineer",
        company: "OpenAI",
        image: mentor9,
        rating: "4.9",
        reviews: "130",
        skills: ["Deep Learning", "NLP", "Research Papers"]
    }
];

const companiesSettings = {
    dots: false,
    infinite: true,
    arrows: false,
    autoplay: true,
    speed: 6000,
    autoplaySpeed: 0,
    cssEase: "linear",
    slidesToShow: 9,
    slidesToScroll: 1,
    swipeToSlide: true,
    responsive: [
        { breakpoint: 1200, settings: { slidesToShow: 4 } },
        { breakpoint: 768, settings: { slidesToShow: 2 } },
        { breakpoint: 480, settings: { slidesToShow: 1 } },
    ],
};

const companies = [
    { id: 1, logo: logo1 },
    { id: 2, logo: logo2 },
    { id: 3, logo: logo3 },
    { id: 4, logo: logo4 },
    { id: 5, logo: logo5 },
    { id: 6, logo: logo6 },
    { id: 7, logo: logo7 },
    { id: 8, logo: logo8 },
    { id: 9, logo: logo9 },
    { id: 10, logo: logo10 },
    { id: 11, logo: logo11 },
    { id: 12, logo: logo12 },
    { id: 13, logo: logo13 },
];

const loopedCompanies = [...companies, ...companies];

// Variants for reusability
const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: (i = 1) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: i * 0.2,
            duration: 0.4,
            ease: "easeOut",
        },
    }),
};

const categories = [
    { name: "Engineering", icon: <FaLaptopCode />, count: "450+ Mentors" },
    { name: "Product", icon: <FaRocket />, count: "200+ Mentors" },
    { name: "Design", icon: <FaPaintBrush />, count: "150+ Mentors" },
    { name: "Marketing", icon: <FaBullhorn />, count: "120+ Mentors" },
    { name: "Data Science", icon: <FaChartLine />, count: "180+ Mentors" },
    { name: "Leadership", icon: <FaUserTie />, count: "100+ Mentors" },
];

const MentorList = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(false);
    }, []);

    // ✅ Loader overlay
    if (loading) {
        return (
            <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                background: "#fff",
            }}>
                <div style={{ textAlign: "center" }}>
                    <Spin size="large" />
                    <div style={{ marginTop: 16, color: "#666" }}>Loading mentors...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="mentors-page-container">
            <SEO
                title="Expert Mentorship - Career Guidance & Interview Prep"
                description="Book 1:1 mentorship sessions with industry leaders from top companies. Get expert guidance on interview prep, career growth, and skill building from 500+ verified mentors."
                keywords="mentorship, career mentors, industry experts, 1:1 sessions, career guidance, interview preparation, skill development, professional mentors, top companies, career growth, CareerFast"
                ogImage="https://careerfast.in/og-image-mentors.jpg"
                twitterImage="https://careerfast.in/twitter-image-mentors.jpg"
                structuredData={[
                    {
                        "@context": "https://schema.org",
                        "@type": "ItemList",
                        "name": "Top Mentors",
                        "description": "Industry experts from top companies available for 1:1 mentorship",
                        "numberOfItems": mentorsData.length,
                        "itemListElement": mentorsData.map((mentor, index) => ({
                            "@type": "Person",
                            "position": index + 1,
                            "name": mentor.name,
                            "jobTitle": mentor.title,
                            "worksFor": {
                                "@type": "Organization",
                                "name": mentor.company
                            },
                            "url": `https://careerfast.in/mentor/${mentor.id}`
                        }))
                    }
                ]}
            />
            <Header />
            {/* 1. Hero Section */}
            <section className="mentor-hero-section">
                <div className="hero-content-wrapper">
                    <div className="hero-left">
                        <h1 className="hero-title">
                            Master Your Career with <br />
                            <span>Expert Mentorship</span>
                        </h1>
                        <p className="hero-subtitle">
                            Book 1:1 sessions with industry leaders from top companies.
                            Get guidance on interview prep, career growth, and skill building.
                        </p>
                        <div className="hero-btns">
                            <button className="btn-primary" onClick={() => {
                                if (typeof window !== "undefined") {
                                    document.getElementById('mentors-grid')?.scrollIntoView({ behavior: 'smooth' });
                                }
                            }}>Find a Mentor</button>
                            <button className="btn-secondary2">Be a Mentor</button>
                        </div>
                    </div>

                    <div className="hero-right">
                        <div className="hero-image-wrapper">
                            {/* Using a high quality Unsplash image for professional look */}
                            <img
                                src={getImageUrl(bannerImage)}
                                alt="Mentorship"
                                className="hero-img"
                            />

                            {/* Floating Stats */}
                            <div className="floating-card top-right">
                                <div className="fc-icon">⭐</div>
                                <div>
                                    <h4 style={{ margin: 0 }}>4.9/5</h4>
                                    <span style={{ fontSize: '0.8rem', color: '#666' }}>Avg Rating</span>
                                </div>
                            </div>

                            <div className="floating-card bottom-left">
                                <div className="fc-icon">💼</div>
                                <div>
                                    <h4 style={{ margin: 0 }}>500+</h4>
                                    <span style={{ fontSize: '0.8rem', color: '#666' }}>Top Mentors</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Stats Section */}
            <section className="stats-section">
                <div className="stats-grid">
                    <div className="stat-box">
                        <h3>20k+</h3>
                        <p>Sessions Booked</p>
                    </div>
                    <div className="stat-box">
                        <h3>1500+</h3>
                        <p>Active Mentors</p>
                    </div>
                    <div className="stat-box">
                        <h3>96%</h3>
                        <p>Success Rate</p>
                    </div>
                    <div className="stat-box">
                        <h3>50+</h3>
                        <p>Countries</p>
                    </div>
                </div>
            </section>

            {/* 3. Categories Section */}
            <section className="section-container">
                <div className="section-heading">
                    <h2>Explore by Domain</h2>
                    <p style={{ color: '#666', marginTop: '10px' }}>Find mentors specialized in your field</p>
                </div>

                <div className="categories-grid">
                    {categories.map((cat, idx) => (
                        <div key={idx} className="category-card">
                            <div className="cat-icon">{cat.icon}</div>
                            <h4>{cat.name}</h4>
                            <span style={{ fontSize: '0.85rem', color: '#888', marginTop: '5px', display: 'block' }}>{cat.count}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* 4. Mentors Grid Section (The Core Feature) */}
            <section className="mentors-preview-section" id="mentors-grid">
                <div className="mentors-container">
                    <div className="section-heading">
                        <h2>Top Rated Mentors</h2>
                        <p style={{ color: '#666', marginTop: '10px' }}>Learn from the best in the industry</p>
                    </div>

                    <div className="mentors-grid">
                        {mentorsData.map((mentor) => (
                            <div
                                key={mentor.id}
                                className="mentor-card"
                                onClick={() => navigate(`/mentor/${mentor.id}`)}
                            >
                                <div className="mentor-card-header"></div>
                                <div className="mentor-image-container">
                                    <img src={getImageUrl(mentor.image)} alt={mentor.name} className="mentor-image" />
                                </div>
                                <div className="mentor-info">
                                    <h3 className="mentor-name">{mentor.name}</h3>
                                    <p className="mentor-title">{mentor.title}</p>
                                    <p className="mentor-company">@ {mentor.company}</p>

                                    <div className="mentor-stats">
                                        <div className="stat-item">
                                            <span className="stat-value1">⭐ {mentor.rating}</span>
                                            <span className="stat-label">Rating</span>
                                        </div>
                                        <div className="stat-item1">
                                            <span className="stat-status">Available</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-value1">{mentor.reviews}</span>
                                            <span className="stat-label">Reviews</span>
                                        </div>
                                    </div>

                                    <div className="mentor-skills">
                                        {mentor.skills.map((skill, index) => (
                                            <span key={index} className="skill-tag">{skill}</span>
                                        ))}
                                    </div>

                                    <button className="view-profile-btn">View Profile</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Need Guidence */}
            <motion.div
                className="need_guidence"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
            >
                <Row
                    className="need_guidence_row"
                    style={{
                        background:
                            "linear-gradient(90deg, rgb(217 186 255) 0%, rgb(255, 255, 255) 100%)",
                        borderRadius: "30px",
                    }}
                >
                    <Col
                        style={{
                            overflow: "hidden",
                            borderRadius: "30px 0 0 30px",
                            border: "1px solid #ddd",
                            borderRight: "none",
                        }}
                        lg={10}
                        md={12}
                        xs={24}
                        sm={24}
                    >
                        <div className="need_content_img"><img src={getImageUrl(need_content_img)} alt="Need guidance illustration"></img></div>
                    </Col>

                    <Col
                        style={{
                            textAlign: "left",
                            borderRadius: "0px 30px 30px 0px",
                            border: "1px solid #ddd",
                            borderLeft: "none",
                            placeContent: "center",
                        }}
                        lg={14}
                        md={12}
                        xs={24}
                        sm={24}
                    >
                        <div> <Text className="need_guidence_text">Need Guidence?</Text> <h1 className="need_guidence_title"> Get Winning Tips From <span>Top Mentors</span></h1> </div>
                    </Col>
                </Row>
            </motion.div>
            {/*  */}

            {/* 5. How It Works Section */}
            <section className="section-container steps-section">
                <div className="section-heading">
                    <h2>How It Works</h2>
                    <p>Your path to career success in 3 simple steps</p>
                </div>

                <div className="steps-grid">
                    <div className="step-card">
                        <div className="step-number">1</div>
                        <h3>Find a Mentor</h3>
                        <p>Browse our extensive list of mentors from top companies and filter by your specific needs.</p>
                    </div>
                    <div className="step-card">
                        <div className="step-number">2</div>
                        <h3>Book a Session</h3>
                        <p>Choose a time that works for you and the mentor. Our booking process is seamless and quick.</p>
                    </div>
                    <div className="step-card">
                        <div className="step-number">3</div>
                        <h3>Accelerate Growth</h3>
                        <p>Get personalized guidance, mock interviews, and career advice to reach your goals faster.</p>
                    </div>
                </div>
            </section>

            {/* top companies */}
            <div className="top_companies">
                <motion.div
                    className="elite-title-wrapper"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    <h2 className="elite-title" style={{ fontSize: '2rem', fontWeight: '600' }}>
                        <span className="elite-title-text">
                            Top Companies Hiring on CareerFast
                        </span>
                    </h2>
                </motion.div>

                <Slider {...companiesSettings} className="elite-job-carousel">
                    {loopedCompanies.map((company, index) => (
                        <motion.div
                            key={`${company.id}-${index}`}
                            className="elite-job-slide"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            custom={index}
                        >
                            <motion.div whileHover={{ scale: 1.05 }}>
                                <img
                                    src={getImageUrl(company.logo)}
                                    alt={`Company ${company.id}`}
                                    className="elite-compay_icons-company-logo"
                                />
                            </motion.div>
                        </motion.div>
                    ))}
                </Slider>
            </div>
            {/*  */}

            {/* 6. CTA Section */}
            <section className="cta-section">
                <div className="cta-content">
                    <h2>Ready to supercharge your career?</h2>
                    <p>Join thousands of mentee's who have successfully transitioned into their dream roles.</p>
                    <button onClick={() => navigate('/')} className="btn-white">Get Started Today</button>
                </div>
            </section>
            <Footer />
        </div>
    );
};

export default MentorList;


