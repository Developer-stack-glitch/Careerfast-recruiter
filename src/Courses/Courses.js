'use client';
import React, { useEffect, useState, useMemo } from "react";
import SEO from "../Components/SEO/SEO";
import { getAllCourses } from "../ApiService/action";
import { FaClock, FaExclamationCircle, FaStar, FaUsers, FaGlobe, FaChevronRight, FaTelegramPlane, FaBolt, FaCheck, FaBriefcase, FaPlayCircle } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import "../css/PostCourse.css";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import Link from "next/link";

const testimonials = [
    {
        name: "Alex Rivera",
        role: "Full Stack Developer",
        text: "The web development course was a game-changer for me. The practical projects helped me build a portfolio that landed me my first job at a top tech firm.",
        image: "https://i.pravatar.cc/150?u=alex"
    },
    {
        name: "Sarah Chen",
        role: "Data Scientist",
        text: "Incredible curriculum! The educators explain complex data science concepts with such clarity. I feel much more confident in my analytical skills now.",
        image: "https://i.pravatar.cc/150?u=sarah"
    },
    {
        name: "Jordan Smith",
        role: "Digital Marketer",
        text: "The digital marketing training was very comprehensive. From SEO to social media strategies, it covered everything I needed to know to start my agency.",
        image: "https://i.pravatar.cc/150?u=jordan"
    },
    {
        name: "Maya Patel",
        role: "UI/UX Designer",
        text: "Loved the focus on practical design principles. The mentorship and feedback on my projects were invaluable. Highly recommend for aspiring designers!",
        image: "https://i.pravatar.cc/150?u=maya"
    },
    {
        name: "James Wilson",
        role: "HR Manager",
        text: "The HR management course provided me with the latest industry insights and tools. It's been instrumental in my recent promotion.",
        image: "https://i.pravatar.cc/150?u=james"
    },
    {
        name: "Elena Rodriguez",
        role: "Business Analyst",
        text: "Great experience! The structured approach to problem-solving and the real-world case studies made learning very engaging and effective.",
        image: "https://i.pravatar.cc/150?u=elena"
    },
    {
        name: "David Park",
        role: "Python Developer",
        text: "Python was always intimidating until I took this course. The step-by-step guidance and community support made the learning curve feel smooth.",
        image: "https://i.pravatar.cc/150?u=david"
    },
    {
        name: "Sophie Bennett",
        role: "Marketing Lead",
        text: "The depth of knowledge shared by the instructors is remarkable. This course gave me practical tools I could implement in my job immediately.",
        image: "https://i.pravatar.cc/150?u=sophie"
    },
    {
        name: "Liam O'Connor",
        role: "Software Engineer",
        text: "Highly structured and relevant content. The placement assistance was the cherry on top, helping me navigate my career transition effortlessly.",
        image: "https://i.pravatar.cc/150?u=liam"
    }
];

const TestimonialsColumn = ({ testimonials, duration = 10, className = "" }) => {
    return (
        <div className={`testimonials-col ${className}`}>
            <motion.div
                animate={{ translateY: "-50%" }}
                transition={{
                    duration: duration,
                    repeat: Infinity,
                    ease: "linear",
                    repeatType: "loop",
                }}
                className="testimonials-col-inner"
            >
                {[...new Array(2)].map((_, index) => (
                    <React.Fragment key={index}>
                        {testimonials.map((testimonial, i) => (
                            <div className="testimonial-card" key={i}>
                                <div className="testimonial-text">"{testimonial.text}"</div>
                                <div className="testimonial-user">
                                    <img
                                        src={testimonial.image}
                                        alt={testimonial.name}
                                        className="testimonial-avatar"
                                    />
                                    <div className="testimonial-info">
                                        <div className="testimonial-name">{testimonial.name}</div>
                                        <div className="testimonial-role">{testimonial.role}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </React.Fragment>
                ))}
            </motion.div>
        </div>
    );
};

export default function Courses() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState("All Courses");

    useEffect(() => {
        async function fetchCourses() {
            try {
                const res = await getAllCourses();
                setCourses(res || []);
            } catch (error) {
                console.error("❌ Error fetching courses:", error);
            } finally {
                setTimeout(() => {
                    setLoading(false);
                }, 800);
            }
        }
        fetchCourses();
    }, []);

    const categories = useMemo(() => {
        const cats = ["All Courses", ...new Set(courses.map(c => c.category).filter(Boolean))];
        return cats;
    }, [courses]);

    const filteredCourses = useMemo(() => {
        if (activeCategory === "All Courses") return courses;
        return courses.filter(c => c.category === activeCategory);
    }, [courses, activeCategory]);

    const instructors = [
        {
            name: "Anuj Kalbalia (Ex-IBM)",
            role: "Educator, Web Development",
            details: ["Ex-CodeChef, Internshala", "NIT Durgapur alumnus"],
            exp: "12",
            image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400&h=400&auto=format&fit=crop"
        },
        {
            name: "Tripta Singh (Ex-McKinsey)",
            role: "Educator, Advanced Excel",
            details: ["Ex-Director of Content Development, Knowledge Platform", "LSE Alumna"],
            exp: "11",
            image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&h=400&auto=format&fit=crop"
        },
        {
            name: "Kunal Jain (Ex-Capital One)",
            role: "Educator, Data Science",
            details: ["Ex-Aviva, IIT Bombay alumnus", "Founder of Analytics Vidhya"],
            exp: "15",
            image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&h=400&auto=format&fit=crop"
        },
        {
            name: "Geetika Singh (Ex-HSBC)",
            role: "Educator, Human Resource Management",
            details: ["Ex-Accenture, Google, Uber, & Hero MotoCorp.", "University of Essex alumna"],
            exp: "12",
            image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=400&h=400&auto=format&fit=crop"
        }
    ];

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 100 }
        }
    };

    return (
        <>
            <SEO
                title="Online Courses - Master New Skills for Your Career"
                description="Explore our carefully crafted online courses designed to help you master new skills and advance your career."
                keywords="online courses, career development, professional training"
                ogImage="https://careerfast.in/og-image-courses.jpg"
                twitterImage="https://careerfast.in/twitter-image-courses.jpg"
            />
            <Header />

            <div className="courses-page-v2">
                {/* Hero Section */}
                <div className="courses-hero-v2">
                    <div className="hero-container">
                        <div className="hero-header-text">
                            <motion.h1
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="main-title-new"
                            >
                                Give the <span className="highlight-text">Best Start<svg className="underline-svg" viewBox="0 0 200 20" preserveAspectRatio="none"><path d="M0,15 Q50,5 100,15 T200,15" fill="none" stroke="#5f2eea" strokeWidth="8" strokeLinecap="round" /></svg></span> to your Career
                            </motion.h1>
                        </div>

                        <div className="hero-cta-cards-new">
                            {/* Card 1: Certification Courses */}
                            <div className="hero-card-new blue-theme">
                                <div className="card-content-left">
                                    <div className="card-badge-new blue">MOST POPULAR</div>
                                    <h2>Get certified</h2>
                                    <p className="card-desc">Master in-demand skills with industry-recognized certifications.</p>

                                    <div className="card-tags">
                                        <div className="tag-pill">Web Development <FaChevronRight /></div>
                                        <div className="tag-pill">Python <FaChevronRight /></div>
                                        <div className="tag-pill">Data Science <FaChevronRight /></div>
                                        <div className="tag-pill">Digital Marketing <FaChevronRight /></div>
                                        {/* <div className="tag-pill">Machine Learning <FaChevronRight /></div>
                                        <div className="tag-pill">UI/UX Design <FaChevronRight /></div> */}
                                    </div>

                                    <div className="card-features">
                                        <div className="feature-item"><FaCheck /> 100% Online</div>
                                        <div className="feature-item"><FaCheck /> Certificate Included</div>
                                        <div className="feature-item"><FaCheck /> Practical Projects</div>
                                    </div>

                                    <button className="explore-btn blue-btn">Explore Certification Courses</button>
                                </div>
                                <div className="card-image-right">
                                    <img src="https://training-uploads.internshala.com/homepage/media/new_stt_banner/banner-1920.png?v=v2" alt="Certified Person" />
                                </div>
                            </div>

                            {/* Card 2: Placement Programs */}
                            <div className="hero-card-new yellow-theme">
                                <div className="card-content-left">
                                    <div className="card-badge-new orange">CAREER TRANSFORMATION</div>
                                    <h2>Get hired faster</h2>
                                    <p className="card-desc">Accelerate your career journey with Job-Guaranteed programs.</p>

                                    <div className="card-tags">
                                        <div className="tag-pill">Full Stack Developer <FaChevronRight /></div>
                                        <div className="tag-pill">Data Science <FaChevronRight /></div>
                                        <div className="tag-pill">Digital Marketing <FaChevronRight /></div>
                                        <div className="tag-pill">HR Management <FaChevronRight /></div>
                                        {/* <div className="tag-pill">Business Development <FaChevronRight /></div>
                                        <div className="tag-pill">Product Management <FaChevronRight /></div> */}
                                    </div>

                                    <div className="card-features">
                                        <div className="feature-item"><FaCheck /> Placement Guarantee</div>
                                        <div className="feature-item"><FaCheck /> 1-on-1 Mentorship</div>
                                        <div className="feature-item"><FaCheck /> Mock Interviews</div>
                                    </div>

                                    <button className="explore-btn orange-btn">Explore Career Launchpads</button>
                                </div>
                                <div className="card-image-right">
                                    <img src="https://training-uploads.internshala.com/homepage/media/new_pgc_banner/banner-1920.png?v=v2" alt="Hired Person" />
                                </div>
                            </div>
                        </div>

                        <div className="hiring-banner">
                            <p className="hiring-title">Top companies hiring from us</p>
                            <div className="hiring-logos-container">
                                <div className="hiring-logos">
                                    {/* Original logos */}
                                    <img src="https://upload.wikimedia.org/wikipedia/sco/2/21/Nvidia_logo.svg" alt="Nvidia" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/0/0f/Ola_Cabs_logo.svg" alt="Ola" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg" alt="Paytm" />
                                    <img src="https://training-comp-uploads.internshala.com/homepage/media/top_companies/desktop/redbus.png" alt="redBus" />
                                    <img src="https://training-comp-uploads.internshala.com/homepage/media/top_companies/desktop/deloitte.png" alt="TCS" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" alt="Amazon" />
                                    <img src="https://training-comp-uploads.internshala.com/homepage/media/top_companies/desktop/hcl.png" alt="HCL" />

                                    {/* Duplicate logos for seamless loop */}
                                    <img src="https://upload.wikimedia.org/wikipedia/sco/2/21/Nvidia_logo.svg" alt="Nvidia" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/0/0f/Ola_Cabs_logo.svg" alt="Ola" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg" alt="Paytm" />
                                    <img src="https://training-comp-uploads.internshala.com/homepage/media/top_companies/desktop/redbus.png" alt="redBus" />
                                    <img src="https://training-comp-uploads.internshala.com/homepage/media/top_companies/desktop/deloitte.png" alt="TCS" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" alt="Amazon" />
                                    <img src="https://training-comp-uploads.internshala.com/homepage/media/top_companies/desktop/hcl.png" alt="HCL" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Section */}
                <section className="stats-section">
                    <div className="stats-card1">
                        <div className="stats-left">
                            <span className="blue-indicator"></span>
                            <h2>Giving flight to your ambitions</h2>
                        </div>
                        <div className="stats-mid">
                            <p>Real success requires the right skillset. Through our online courses, you too can give wings to your dreams.</p>
                        </div>
                        <div className="stats-right">
                            {[
                                { icon: <FaUsers />, value: "600K+", label: "Learners" },
                                { icon: <FaPlayCircle />, value: "200M+", label: "Learning Minutes" },
                                { icon: <FaStar />, value: "4.5/5", label: "Average rating" },
                                { icon: <FaBriefcase />, value: "1.3M+", label: "Placements" }
                            ].map((stat, idx) => (
                                <div key={idx} className="stat-block">
                                    <div className="stat-icon">{stat.icon}</div>
                                    <h3>{stat.value}</h3>
                                    <p>{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CV Section */}
                <section className="cv-section">
                    <div className="cv-container">
                        <div className="cv-top-meta">
                            <span className="meta-tag">CERTIFICATION COURSES</span>
                            <span className="meta-duration">4-8 weeks</span>
                        </div>
                        <div className="cv-title-box">
                            <span className="cv-blue-indicator"></span>
                            <h2>Fastest way to build your CV</h2>
                        </div>
                        <div className="cv-perks">
                            <div className="perk"><FaCheck className="check-icon" /> Learn at your own schedule</div>
                            <div className="perk"><FaCheck className="check-icon" /> Practical learning</div>
                            <div className="perk"><FaCheck className="check-icon" /> Industry recognised certificate</div>
                        </div>

                        <div className="namaste-banner-v2">
                            <img src="/namaste.png" alt="" />
                        </div>
                    </div>
                </section>

                <section className="courses-section">
                    <div className="main-content-layout">
                        {/* Sidebar */}
                        <aside className="courses-sidebar">
                            <h3 className="sidebar-title">Categories</h3>
                            <div className="category-list">
                                {categories.map((cat, idx) => (
                                    <button
                                        key={idx}
                                        className={`category-item ${activeCategory === cat ? 'active' : ''}`}
                                        onClick={() => setActiveCategory(cat)}
                                    >
                                        {cat}
                                        {activeCategory === cat && <FaChevronRight className="active-arrow" />}
                                    </button>
                                ))}
                            </div>
                        </aside>

                        {/* Grid Area */}
                        <div className="courses-grid-container">
                            <div className="grid-header">
                                <h2>{activeCategory} ({filteredCourses.length})</h2>
                            </div>

                            {loading ? (
                                <div className="grid-loader">
                                    <div className="spinner"></div>
                                </div>
                            ) : filteredCourses.length === 0 ? (
                                <div className="no-results">
                                    <FaExclamationCircle />
                                    <h3>No courses found in this category</h3>
                                    <p>Try selecting another category or check back later.</p>
                                </div>
                            ) : (
                                <motion.div
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                    className="courses-grid-v2"
                                >
                                    <AnimatePresence mode='popLayout'>
                                        {filteredCourses.map((course, index) => {
                                            const courseContent = typeof course.content === 'string' ? JSON.parse(course.content) : course.content;
                                            const discountedPrice = courseContent?.hero?.prices?.discounted || "3,499";
                                            const originalPrice = courseContent?.hero?.prices?.original || "3,999";

                                            return (
                                                <motion.div
                                                    key={course.id || index}
                                                    variants={itemVariants}
                                                    layout
                                                    className="course-card-v2"
                                                >
                                                    <Link href={`/courses/${course.slug}`} className="card-inner" target="_blank">
                                                        <div className="card-banner">
                                                            {index % 3 === 0 && <div className="new-badge">Newly Updated</div>}
                                                            <img
                                                                src={course.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3'}
                                                                alt={course.title}
                                                            />
                                                        </div>

                                                        <div className="card-body">
                                                            <div className="card-badges-row" style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                                                <div className="badge rating">
                                                                    <FaStar style={{ fontSize: '10px' }} /> 4.5
                                                                </div>
                                                                <div className="badge learners">
                                                                    1,28,094 learners
                                                                </div>
                                                            </div>

                                                            <h3 className="course-name">{course.title}</h3>
                                                            <p className="course-short-desc">
                                                                {course.description?.slice(0, 80)}...
                                                            </p>

                                                            <div className="course-stats">
                                                                <span className="stat">8 weeks</span>
                                                                <span className="stat-separator">•</span>
                                                                <span className="stat">English, हिन्दी</span>
                                                            </div>
                                                        </div>

                                                        <div className="card-footer-v2">
                                                            <div className="know-more">
                                                                Know more <FaChevronRight style={{ fontSize: '10px' }} />
                                                            </div>
                                                        </div>
                                                    </Link>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </section>


                {/* Advantage Section */}
                <section className="advantage-section">
                    <div className="section-container">
                        <div className="advantage-header">
                            <h2><FaTelegramPlane className="plane-icon" /> The CareerFast Trainings advantage</h2>
                            <p>100% online courses led in a dynamic learning environment</p>
                        </div>
                        <div className="advantage-grid">
                            <div className="advantage-item">
                                <div className="adv-icon-box">
                                    <img src="https://img.icons8.com/fluency/96/learning.png" alt="Content" />
                                </div>
                                <h3>Industry grade content</h3>
                                <p>With practical learning</p>
                            </div>
                            <div className="advantage-item">
                                <div className="adv-icon-box">
                                    <img src="https://img.icons8.com/fluency/96/briefcase.png" alt="Placement" />
                                </div>
                                <h3>100% Placement Assistance</h3>
                                <p>To help you launch your career</p>
                            </div>
                            <div className="advantage-item">
                                <div className="adv-icon-box">
                                    <img src="https://img.icons8.com/fluency/96/guarantee.png" alt="Certified" />
                                </div>
                                <h3>Excellence Certified</h3>
                                <p>And recognized by 180K+ companies</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Educators Section */}
                <section className="educators-section">
                    <div className="section-container">
                        <div className="educators-header">
                            <h2><FaBolt className="bolt-icon" /> Meet your super-skilled educators</h2>
                            <p>Our top-notch instructors have years of experience from companies such as Google, IBM, and McKinsey, and more.</p>
                        </div>
                        <div className="educators-slider">
                            {instructors.map((edu, idx) => (
                                <div key={idx} className="educator-card">
                                    <div className="edu-image-box">
                                        <img src={edu.image} alt={edu.name} />
                                    </div>
                                    <div className="edu-info">
                                        <div className="edu-exp-pill">{edu.exp} Years Experience</div>
                                        <h4>{edu.name}</h4>
                                        <p className="edu-role">{edu.role}</p>
                                        <ul className="edu-details">
                                            {edu.details.map((d, i) => <li key={i}>{d}</li>)}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Testimonials Section */}
                <section className="testimonials-section">
                    <div className="testimonials-container">
                        <div className="testimonials-header">
                            <h2>What our learners say</h2>
                            <p>Join thousands of successful professionals who have transformed their careers with CareerFast.</p>
                        </div>
                        <div className="testimonials-grid">
                            <TestimonialsColumn testimonials={testimonials.slice(0, 3)} duration={15} />
                            <TestimonialsColumn testimonials={testimonials.slice(3, 6)} duration={20} className="hidden-sm" />
                            <TestimonialsColumn testimonials={testimonials.slice(6, 9)} duration={18} className="hidden-md" />
                        </div>
                    </div>
                </section>

                {/* Footer CTA Banner */}
                <section className="footer-cta-section">
                    <div className="footer-cta-banner">
                        <div className="cta-left">
                            <h2>Kickstart your career with CareerFast</h2>
                            <p>We'll help you with your confusion about career choices, teach you practical skills and help you land a placement. Join a network of 600K+ learners and #KaroShuruaatYahinSe.</p>
                            <div className="cta-actions">
                                <button className="btn-dark">Certification Courses</button>
                                <button className="btn-white">Career Launchpads</button>
                            </div>
                        </div>
                        <div className="cta-right-img">
                            <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=600&auto=format&fit=crop" alt="Students Learning" />
                        </div>
                    </div>
                </section>
            </div>

            <Footer />

        </>
    );
}
