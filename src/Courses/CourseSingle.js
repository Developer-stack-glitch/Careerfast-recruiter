'use client';
import React, { useState } from "react";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import "../css/CourseSingle.css";
import Link from "next/link";
import { getAllCourses } from "../ApiService/action";
import {
    FaCheckCircle,
    FaRocket,
    FaLaptopCode,
    FaUserTie,
    FaWhatsapp,
    FaBriefcase,
    FaChartLine,
    FaShieldAlt,
    FaStar,
    FaChevronDown,
    FaAward,
    FaRegCalendarAlt,
    FaRegClock,
    FaVideo,
    FaDownload,
    FaPlus,
    FaMinus,
    FaMicrosoft,
    FaCloud,
    FaDocker,
    FaHome,
    FaRobot,
    FaPhoneAlt,
    FaCode,
    FaChevronLeft,
    FaChevronRight
} from "react-icons/fa";
import {
    SiAmazonwebservices, SiGooglecloud, SiTerraform, SiKubernetes,
    SiAnsible, SiJenkins, SiChef, SiVmware, SiDigitalocean, SiAlibabacloud,
    SiGit, SiGithub, SiPostman, SiReact, SiNodedotjs,
    SiMongodb, SiExpress, SiTailwindcss, SiJest
} from "react-icons/si";
import { VscCode } from "react-icons/vsc";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import SEO from "../Components/SEO/SEO";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
export default function CourseSingle() {
    const params = useParams();
    const { slug } = params;
    const [activeModule, setActiveModule] = useState(0);
    const [activeDesignation, setActiveDesignation] = useState(0);
    const [activeReviewTab, setActiveReviewTab] = useState('All');
    const [openFaqIndex, setOpenFaqIndex] = useState(null);
    const [activeCertIndex, setActiveCertIndex] = useState(0);
    const [activeNavSection, setActiveNavSection] = useState('');
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [visibleReviews, setVisibleReviews] = useState(1);
    const [visibleModules, setVisibleModules] = useState(10);
    const [showFullAbout, setShowFullAbout] = useState(false);

    // Enquiry popup state
    const [showEnquiryPopup, setShowEnquiryPopup] = useState(false);
    const [enquiryLoading, setEnquiryLoading] = useState(false);
    const [enquiryFormData, setEnquiryFormData] = useState({
        userName: '',
        userEmail: '',
        phoneNumber: '',
        message: '',
        trainingMode: 'Training Mode'
    });

    const handleEnquiryInputChange = (e) => {
        const { name, value } = e.target;
        setEnquiryFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleEnquirySubmit = async (e) => {
        e.preventDefault();
        setEnquiryLoading(true);
        // Simulate API submission
        setTimeout(() => {
            setEnquiryLoading(false);
            setShowEnquiryPopup(false);
            setEnquiryFormData({ userName: '', userEmail: '', phoneNumber: '', message: '', trainingMode: 'Training Mode' });
            alert("Enquiry Sent Successfully! We will contact you soon.");
        }, 1000);
    };

    const certifications = [
        {
            title: "Placement Complete Certification",
            subtitle: "Industry recognized certificate",
            image: "https://www.learnovita.com/wp-content/uploads/2026/05/careerfast-certificate-new.jpeg"
        },
        {
            title: "Course Completion Certificate",
            subtitle: "Validates your skill acquisition",
            image: "https://www.learnovita.com/wp-content/uploads/2026/05/qubinex-certificate-new.jpeg"
        },
        {
            title: "Project Excellence Award",
            subtitle: "For outstanding capstone project",
            image: "https://www.learnovita.com/wp-content/uploads/2020/09/gb_certificate.jpg"
        }
    ];

    const [courseData, setCourseData] = useState(null);
    const [relatedCourses, setRelatedCourses] = useState([]);
    const [allCoursesList, setAllCoursesList] = useState([]);
    const [loading, setLoading] = useState(true);


    React.useEffect(() => {
        const interval = setInterval(() => {
            setActiveCertIndex((prev) => (prev + 1) % certifications.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [certifications.length]);

    React.useEffect(() => {
        const sections = document.querySelectorAll('section[id]');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setActiveNavSection(entry.target.id);
                }
            });
        }, { rootMargin: '-100px 0px -40% 0px' });

        sections.forEach(section => observer.observe(section));

        return () => {
            sections.forEach(section => observer.unobserve(section));
        };
    }, [loading]);

    React.useEffect(() => {
        const fetchCourse = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/courses/${slug}`);
                if (response.ok) {
                    const data = await response.json();
                    setCourseData(data);

                    try {
                        const allCourses = await getAllCourses();
                        if (allCourses && allCourses.length > 0) {
                            setAllCoursesList(allCourses);
                            // Find courses in same category or just first 3 excluding current
                            const filtered = allCourses.filter(c => c.slug !== slug).slice(0, 3);
                            setRelatedCourses(filtered);
                        }
                    } catch (e) {
                        console.error("Error fetching related courses", e);
                    }
                } else {
                    console.error("Failed to fetch course");
                }
            } catch (err) {
                console.error("Error fetching course:", err);
            } finally {
                // Artificial delay for smooth transition
                setTimeout(() => {
                    setLoading(false);
                }, 800);
            }
        };

        if (slug) fetchCourse();
    }, [slug]);

    if (loading) {
        return null;
    }

    if (!courseData) {
        return <div className="not-found" style={{ padding: '100px', textAlign: 'center' }}>Course not found.</div>;
    }

    const defaultCareerRoles = [
        {
            id: 'architect',
            title: 'Cloud Computing Architect',
            minSalary: '8L',
            avgSalary: '12L',
            maxSalary: '22L',
            companies: [
                { name: 'Accenture', logo: 'https://upload.wikimedia.org/wikipedia/commons/c/cd/Accenture.svg' },
                { name: 'IBM', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg' },
                { name: 'Amazon', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg' },
                { name: 'American Express', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg' }
            ]
        },
        {
            id: 'security',
            title: 'Cloud Security Engineer',
            minSalary: '7L',
            avgSalary: '10L',
            maxSalary: '18L',
            companies: [
                { name: 'Microsoft', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg' },
                { name: 'Google', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg' },
                { name: 'Adobe', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Adobe_Systems_logo_and_wordmark.svg' },
                { name: 'Salesforce', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg' }
            ]
        },
        {
            id: 'software',
            title: 'Cloud Software Engineer',
            minSalary: '6L',
            avgSalary: '9L',
            maxSalary: '16L',
            companies: [
                { name: 'TCS', logo: 'https://www.learnovita.com/wp-content/uploads/2025/01/tcsacte.png' },
                { name: 'Infosys', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Infosys_logo.svg' },
                { name: 'Wipro', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Wipro_Primary_Logo_Color_RGB.svg' },
                { name: 'Oracle', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/50/Oracle_logo.svg' }
            ]
        },
        {
            id: 'network',
            title: 'Cloud Network Engineer',
            minSalary: '5L',
            avgSalary: '8L',
            maxSalary: '14L',
            companies: [
                { name: 'Dell', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/18/Dell_logo_2016.svg' },
                { name: 'HP', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/ad/HP_logo_2012.svg' },
                { name: 'IBM', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg' },
                { name: 'Microsoft', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg' }
            ]
        }
    ];

    const content = courseData.content || {};
    let careerBenefitsData = content.careerSection?.roles && content.careerSection.roles.length > 0 ? content.careerSection.roles : defaultCareerRoles;

    const hero = content.hero || {};
    const prices = hero.prices || { original: courseData.originalPrice, discounted: courseData.discountedPrice, expiry: courseData.offerExpiry };

    const getRoleIcon = (iconName) => {
        const icons = {
            'FaLaptopCode': <FaLaptopCode />,
            'SiReact': <SiReact />,
            'FaDocker': <FaDocker />,
            'FaCode': <FaCode />,
            'SiNodedotjs': <SiNodedotjs />,
            'SiMongodb': <SiMongodb />,
            'FaCheckCircle': <FaCheckCircle />,
            'FaBriefcase': <FaBriefcase />,
            'FaUserTie': <FaUserTie />,
            'FaCloud': <FaCloud />
        };
        return icons[iconName] || <FaUserTie />;
    };

    const successStoriesList = [
        {
            name: "Sowmiya",
            image: "https://www.learnovita.com/wp-content/uploads/2025/03/003-sowmiya.jpg",
            logo: "https://www.learnovita.com/wp-content/uploads/2025/01/tech.png",
            altLogo: "Tech Mahindra"
        },
        {
            name: "Rajkumar",
            image: "https://www.learnovita.com/wp-content/uploads/2025/05/02-Rajkumar-smallpic.jpg",
            logo: "https://www.learnovita.com/wp-content/uploads/2025/01/wipro.png",
            altLogo: "Wipro"
        },
        {
            name: "Thon",
            image: "https://www.learnovita.com/wp-content/uploads/2025/05/01-Thon-smallpic.jpg",
            logo: "https://www.learnovita.com/wp-content/uploads/2025/01/tech.png",
            altLogo: "Tech Mahindra"
        },
        {
            name: "Lavanya",
            image: "https://www.learnovita.com/wp-content/uploads/2025/03/002-lavanya.jpg",
            logo: "https://www.learnovita.com/wp-content/uploads/2025/01/zoho.png",
            altLogo: "Zoho"
        },
        {
            name: "Karthik",
            image: "/krithi.jpeg",
            logo: "https://www.learnovita.com/wp-content/uploads/2025/01/tcsacte.png",
            altLogo: "TCS"
        },
        {
            name: "Priya",
            image: "/oviya.jpeg",
            logo: "https://www.learnovita.com/wp-content/uploads/2025/01/wipro.png",
            altLogo: "Wipro"
        },
        {
            name: "Thon",
            image: "/charu.jpeg",
            logo: "https://www.learnovita.com/wp-content/uploads/2025/01/tech.png",
            altLogo: "Tech Mahindra"
        },
    ];

    const successStorySliderSettings = {
        dots: false,
        infinite: true,
        speed: 500,
        slidesToShow: 4,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 3000,
        arrows: false,
        responsive: [
            { breakpoint: 1024, settings: { slidesToShow: 3 } },
            { breakpoint: 768, settings: { slidesToShow: 2 } },
            { breakpoint: 480, settings: { slidesToShow: 1 } }
        ]
    };

    const trainingModeOptions = (
        <>
            <option value="Training Mode" disabled hidden>Training Mode</option>
            <optgroup label="Online Training">
                <option value="online">Yes, I'm Interested in Online Training</option>
            </optgroup>
            <optgroup label="Classroom Training">
                <option value="" disabled style={{ fontWeight: 'bold', color: '#000' }}># Chennai</option>
                <option value="velachery">&nbsp;&nbsp;&nbsp;Velachery</option>
                <option value="anna_nagar">&nbsp;&nbsp;&nbsp;Anna Nagar</option>
                <option value="tambaram">&nbsp;&nbsp;&nbsp;Tambaram</option>
                <option value="porur">&nbsp;&nbsp;&nbsp;Porur</option>
                <option value="t_nagar">&nbsp;&nbsp;&nbsp;T Nagar</option>
                <option value="omr">&nbsp;&nbsp;&nbsp;OMR</option>
                <option value="siruseri">&nbsp;&nbsp;&nbsp;Siruseri</option>
                <option value="thiruvanmiyur">&nbsp;&nbsp;&nbsp;Thiruvanmiyur</option>
                <option value="maraimalai_nagar">&nbsp;&nbsp;&nbsp;Maraimalai Nagar</option>

                <option value="" disabled style={{ fontWeight: 'bold', color: '#000' }}># Bangalore</option>
                <option value="electronic_city">&nbsp;&nbsp;&nbsp;Electronic City</option>
                <option value="btm_layout">&nbsp;&nbsp;&nbsp;BTM Layout</option>
                <option value="marathahalli">&nbsp;&nbsp;&nbsp;Marathahalli</option>
                <option value="hebbal">&nbsp;&nbsp;&nbsp;Hebbal</option>
                <option value="rajaji_nagar">&nbsp;&nbsp;&nbsp;Rajaji Nagar</option>
                <option value="jayanagar">&nbsp;&nbsp;&nbsp;Jayanagar</option>
                <option value="kalyan_nagar">&nbsp;&nbsp;&nbsp;Kalyan Nagar</option>
                <option value="indira_nagar">&nbsp;&nbsp;&nbsp;Indira Nagar</option>
                <option value="hsr_layout">&nbsp;&nbsp;&nbsp;HSR Layout</option>

                <option value="" disabled style={{ fontWeight: 'bold', color: '#000' }}># Others</option>
            </optgroup>
            <optgroup label="Corporate Training">
                <option value="corporate">Yes, We're Interested in Corporate Training</option>
            </optgroup>
        </>
    );
    const sanitizeHtml = (html) => {
        if (!html) return "";
        return html.replace(/&nbsp;|\u00A0/g, " ");
    };

    return (
        <>
            <SEO
                title={`${courseData.title} - CareerFast Courses`}
                description={courseData.description}
            />
            <Header />

            <div className="course-single-page">
                {/* Hero Section */}
                <div className="course-hero">
                    <div className="hero-background-overlay"></div>
                    <div className="hero-content-flex">
                        <div className="hero-left">
                            <div className="course-breadcrumbs">
                                Home » <span style={{ color: "#fff" }}>{courseData.category || "Cloud Computing"}</span> » <span style={{ color: "#f97316" }}>{courseData.title || "Cloud Computing Online Course"}</span>
                            </div>

                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                {courseData.title || "Cloud Computing Online Course"}
                            </motion.h1>

                            <div className="hero-ratings-row">
                                <span className="rating-score">({hero?.ratings?.overall || "4.5"})</span>
                                <div className="rating-stars">
                                    <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                                </div>
                                <span className="rating-separator">|</span>
                                <div className="rating-platform">
                                    <img src="https://www.learnovita.com/wp-content/uploads/2025/03/icons8-google-23.png" alt="Google" className="rating-icon-g" />
                                    <span>{hero?.ratings?.google || "4.7/5"}</span>
                                </div>
                                <div className="rating-platform">
                                    <div className="rating-icon-circle course-report-circle">
                                        <img src="https://www.learnovita.com/wp-content/uploads/2025/03/CR_Logo_Circle-1.png" alt="Course Report" className="rating-icon-su" />
                                    </div>
                                    <span>{hero?.ratings?.courseReport || "4.8/5"}</span>
                                </div>
                                <div className="rating-platform">
                                    <div className="rating-icon-circle switchup-circle">
                                        <img src="https://www.learnovita.com/wp-content/uploads/2025/03/switchup.png" alt="SwitchUp" className="rating-icon-su" />
                                    </div>
                                    <span>{hero?.ratings?.switchUp || "4.8/5"}</span>
                                </div>
                            </div>

                            <div className="hero-highlights-list">
                                {hero?.highlights?.length > 0 ? hero.highlights.map((h, i) => (
                                    <div key={i} className="highlight-row">
                                        <svg className="highlight-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        <span>{h.text} {h.subtext && <span className="highlight-yellow">{h.subtext}</span>}</span>
                                    </div>
                                )) : (
                                    <>
                                        <div className="highlight-row">
                                            <svg className="highlight-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                            <span>Enroll in the <span className="highlight-yellow">Best Cloud Computing Online Training</span> to Gain Expertise in Leading Cloud Platforms and Services.</span>
                                        </div>
                                        <div className="highlight-row">
                                            <svg className="highlight-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                            <span>Flexible Learning Formats: Weekday, Weekend, and Fast-Track Online Batches Available.</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="hero-stats-grid">
                                <div className="stat-column">
                                    <div className="stat-icon-wrapper duration-icon">
                                        <FaUserTie />
                                    </div>
                                    <div className="stat-content">
                                        <div className="stat-title">Hiring Crop</div>
                                        <div className="stat-value">{hero?.stats?.hiringPartners || "100+ Companies"}</div>
                                    </div>
                                </div>
                                <div className="stat-column">
                                    <div className="stat-icon-wrapper project-icon">
                                        <FaLaptopCode />
                                    </div>
                                    <div className="stat-content">
                                        <div className="stat-title">LMS</div>
                                        <div className="stat-value">{hero?.stats?.liveProjects || "3 Projects"}</div>
                                    </div>
                                </div>
                                <div className="stat-column">
                                    <div className="stat-icon-wrapper cert-icon">
                                        <FaAward />
                                    </div>
                                    <div className="stat-content">
                                        <div className="stat-title">3 Certification</div>
                                        <div className="stat-value">{hero?.stats?.certificationPass || "Guaranteed"}</div>
                                    </div>
                                </div>
                                <div className="stat-column">
                                    <div className="stat-icon-wrapper format-icon">
                                        <FaVideo />
                                    </div>
                                    <div className="stat-content">
                                        <div className="stat-title">Training Format</div>
                                        <div className="stat-value">{hero?.stats?.trainingFormat || "Live Online"}</div>
                                    </div>
                                </div>
                            </div>


                            <div className="hero-action-buttons" style={{ marginTop: '30px', alignItems: 'center' }}>
                                <button onClick={() => setShowEnquiryPopup(true)} className="btn-call-orange">
                                    <FaPhoneAlt className="phone-icon" /> Request A Call Back
                                </button>
                                <a href="tel:+919345045466" className="btn-phone-white">
                                    <FaPhoneAlt className="phone-icon" /> <span>93450 45466</span>
                                </a>
                                <a href="https://wa.me/919345045466" className="whatsapp-blink-icon" target="_blank" rel="noopener noreferrer" title="Chat on WhatsApp">
                                    <FaWhatsapp />
                                </a>
                            </div>
                        </div>

                        <div className="hero-right">
                            <div className="counselling-form-card">
                                <div className="counselling-form-header">
                                    <h3>Book A Free Counselling Session</h3>
                                </div>
                                <div className="counselling-form-body">
                                    <div className="form-group-compact">
                                        <input type="text" placeholder="Your Name" />
                                    </div>
                                    <div className="form-group-compact">
                                        <input type="email" placeholder="Your Email" />
                                    </div>
                                    <div className="form-row-compact">
                                        <div className="form-group-compact">
                                            <input type="tel" placeholder="Mobile Number" />
                                        </div>
                                        <div className="form-group-compact">
                                            <select defaultValue="Training Mode">
                                                {trainingModeOptions}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group-compact">
                                        <input type="text" placeholder="Course Interested In" />
                                    </div>
                                    <div className="form-group-compact">
                                        <textarea placeholder="Message" rows="2"></textarea>
                                    </div>
                                    <button className="counselling-submit-btn">
                                        SUBMIT <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                                {prices?.discounted && (
                                    <div className="offer-card" style={{ marginTop: '15px', padding: '12px 16px', borderRadius: '10px' }}>
                                        <div className="offer-icon-wrapper" style={{ width: '42px', height: '42px' }}>
                                            <span className="offer-icon" style={{ fontSize: '14px' }}>₹</span>
                                        </div>
                                        <div className="offer-text">
                                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                                <strong style={{ fontSize: '20px', letterSpacing: '0px' }}>₹{prices.discounted}</strong>
                                                {prices.original && (
                                                    <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '13px' }}>
                                                        ₹{prices.original}
                                                    </span>
                                                )}
                                            </div>
                                            {prices.expiry && (
                                                <span style={{ display: 'block', fontSize: '12px', color: '#fcd34d', marginTop: '4px', fontWeight: '500', letterSpacing: '0.5px' }}>
                                                    ⏳ Offer Valid till {prices.expiry}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sticky Section Navigation */}
                <div className="course-sticky-nav">
                    <div className="course-sticky-nav-container">
                        <a href="#curriculum" className={`sticky-nav-link ${activeNavSection === 'curriculum' ? 'active' : ''}`}>Curriculum</a>
                        <a href="#projects" className={`sticky-nav-link ${activeNavSection === 'projects' ? 'active' : ''}`}>Projects</a>
                        <a href="#skills" className={`sticky-nav-link ${activeNavSection === 'skills' ? 'active' : ''}`}>Top Skills</a>
                        <a href="#learn" className={`sticky-nav-link ${activeNavSection === 'learn' ? 'active' : ''}`}>Salary Trends</a>
                        <a href="#certification" className={`sticky-nav-link ${activeNavSection === 'certification' ? 'active' : ''}`}>Certification</a>
                        <a href="#batches" className={`sticky-nav-link ${activeNavSection === 'batches' ? 'active' : ''}`}>Batches</a>
                        <a href="#reviews" className={`sticky-nav-link ${activeNavSection === 'reviews' ? 'active' : ''}`}>Recently Placed</a>
                        <a href="#faq" className={`sticky-nav-link ${activeNavSection === 'faq' ? 'active' : ''}`}>FAQ</a>
                        <button className="enroll-btn-sticky" onClick={() => setShowEnquiryPopup(true)}>Enroll Now</button>
                    </div>
                </div>

                {/* Curriculum & Projects Redesign - Professional Trustable Layout */}
                <section className="curriculum-section-redesigned" id="curriculum">
                    <div className="curriculum-bg-pattern"></div>
                    <div className="reviews-pro-heading-wrapper" style={{ position: 'relative', zIndex: 2 }}>
                        <h2 className="reviews-pro-title">
                            {content.curriculumHeading ? (
                                (() => {
                                    const words = content.curriculumHeading.trim().split(' ');
                                    if (words.length > 1) {
                                        const lastWord = words.pop();
                                        return <>{words.join(' ')} <span className="highlight-gradient1">{lastWord}</span></>;
                                    }
                                    return <>{content.curriculumHeading}</>;
                                })()
                            ) : (
                                <>Curriculum & <span className="highlight-gradient1">Projects</span></>
                            )}
                        </h2>
                        <p className="reviews-pro-subtitle">{content.curriculumDescription || "Learn through a structured curriculum designed with hands-on projects, real-world case studies, and expert mentorship to become job-ready."}</p>
                    </div>

                    <div className="curriculum-redesigned-layout">
                        <div className="curriculum-left-column">
                            <div className="curriculum-course-header">
                                <h3 className="course-subtitle-heading">{courseData.title || "AWS Certified Solutions Architect – Associate Training Program"}</h3>
                                <div className="course-duration-badge">
                                    <FaBriefcase /> 100% Placement Assistance
                                </div>
                            </div>
                            <div className="timeline-modules-list">
                                <div className="timeline-line"></div>
                                {(content.curriculum || [
                                    { title: "Introduction to Cloud Computing", content: "Basics of cloud architecture and AWS global infrastructure." },
                                    { title: "Amazon EC2 and Amazon EBS", content: "Compute scaling, storage options, and EC2 instance types." },
                                    { title: "Amazon Storage Services S3 (Simple Storage Services)", content: "Simple Storage Service details, versioning, and lifecycle policies." },
                                    { title: "Cloud Watch & SNS", content: "Monitoring metrics, setting alarms, and notifications." },
                                    { title: "Scaling and Load Distribution in AWS", content: "Auto-scaling groups, Elastic Load Balancing, and Route 53." }
                                ]).slice(0, visibleModules).map((module, index) => (
                                    <div key={index} className="timeline-module-item">
                                        <div className="timeline-dot">
                                            <div className="timeline-dot-inner"></div>
                                        </div>
                                        <button
                                            className={`timeline-module-btn ${activeModule === index ? 'open' : ''}`}
                                            onClick={() => setActiveModule(activeModule === index ? null : index)}
                                        >
                                            <div className="module-btn-left">
                                                <span className="module-count-badge">{(index + 1).toString().padStart(2, '0')}</span>
                                                <span className="module-title-text">{module.title}</span>
                                            </div>
                                            <span className="module-btn-icon">{activeModule === index ? <FaMinus /> : <FaPlus />}</span>
                                        </button>
                                        <AnimatePresence>
                                            {activeModule === index && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="timeline-module-content"
                                                >
                                                    <div className="module-content-inner">
                                                        <div className="module-content-text module-rich-text" dangerouslySetInnerHTML={{ __html: sanitizeHtml(module.content) || "" }} />
                                                        <div className="module-content-features">
                                                            <span><FaCheckCircle className="check" /> Hands-on Lab</span>
                                                            <span><FaCheckCircle className="check" /> Assignments</span>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>
                            {((content.curriculum || []).length > visibleModules || (!content.curriculum && 5 > visibleModules)) && (
                                <div className="more-lessons-btn-wrapper">
                                    <button className="more-lessons-btn" onClick={() => setVisibleModules(prev => prev + 10)}>View All Modules <FaChevronDown style={{ fontSize: '12px' }} /></button>
                                </div>
                            )}
                        </div>

                        <div className="curriculum-right-column">
                            <div className="trustable-provider-card">
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
                                    <div className="trust-shield-icon-wrapper" style={{ margin: 0, flexShrink: 0 }}>
                                        <FaAward className="trust-shield-icon" />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                                        <h3 className="trust-card-main-title" style={{ margin: '0 0 6px 0' }}>Industry Recognized</h3>
                                        <p className="trust-card-subtitle" style={{ margin: 0 }}>Stand out with three industry-recognized certificates valued by top employers.</p>
                                    </div>
                                </div>

                                <div className="provider-cards-container" style={{ padding: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <h4 className="provider-section-title" style={{ textAlign: 'center', marginBottom: '15px' }}>Our Certifications</h4>
                                    <div className="certificate-slider-small" style={{ width: '100%', maxWidth: '280px', textAlign: 'center' }}>
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={activeCertIndex}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <img
                                                    src={certifications[activeCertIndex].image}
                                                    alt={certifications[activeCertIndex].title}
                                                    style={{ width: '100%', height: '200px', objectFit: 'contain', borderRadius: '8px', marginBottom: '12px' }}
                                                />
                                                <h5 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{certifications[activeCertIndex].title}</h5>
                                                <p style={{ margin: '0', fontSize: '12px', color: '#64748b' }}>{certifications[activeCertIndex].subtitle}</p>
                                            </motion.div>
                                        </AnimatePresence>
                                        <div className="cert-slider-dots" style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '16px' }}>
                                            {certifications.map((_, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => setActiveCertIndex(idx)}
                                                    style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: idx === activeCertIndex ? '#ff6e00' : '#cbd5e1', cursor: 'pointer', transition: 'background-color 0.3s' }}
                                                ></div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="trust-features-list">
                                    <div className="trust-feature-item">
                                        <FaCheckCircle className="check-icon-green" /> <span>100% Placement Assistance</span>
                                    </div>
                                    <div className="trust-feature-item">
                                        <FaCheckCircle className="check-icon-green" /> <span>Live Projects & Case Studies</span>
                                    </div>
                                    <div className="trust-feature-item">
                                        <FaCheckCircle className="check-icon-green" /> <span>LMS Access Lifetime</span>
                                    </div>
                                    <div className="trust-feature-item">
                                        <FaCheckCircle className="check-icon-green" /> <span>3 Certifications Guaranteed</span>
                                    </div>
                                </div>

                                <div className="provider-action-section">
                                    <button onClick={() => setShowEnquiryPopup(true)} className="download-curriculum-btn-trust">
                                        <FaDownload className="download-icon" /> Download Full Curriculum
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* real succes stories */}
                <section className="success-stories-section">
                    <div className="container">
                        <div className="stories-content">
                            {/* Left Side: Title Area */}
                            <div className="title-area">
                                <div className="real-text-wrapper">
                                    <h1 className="real-text">REAL</h1>
                                    <div className="stars-icon">
                                        <img src="https://www.learnovita.com/wp-content/uploads/2026/01/start.webp" alt="start" />
                                    </div>
                                </div>
                                <div className="subtitle-bar">
                                    <span>STORIES</span>
                                    <span>SUCCESS</span>
                                    <span>INSPIRATION</span>
                                </div>
                            </div>

                            {/* Right Side: Cards Slider */}
                            <div className="cards-slider-container" style={{ width: '100%', maxWidth: '850px', minWidth: '0' }}>
                                <Slider {...successStorySliderSettings}>
                                    {successStoriesList.map((story, index) => (
                                        <div key={index} style={{ padding: '30px 15px 20px 15px' }}>
                                            <div className="story-card" style={{ margin: '0 auto' }}>
                                                <div className="badge">CAREER<br />UPGRADE</div>
                                                <div className="profile-image">
                                                    <img src={story.image} alt={story.name} />
                                                </div>
                                                <h3 className="name">{story.name}</h3>
                                                <div className="company-logo">
                                                    <span className="logo-text"><img src={story.logo} alt={story.altLogo} /></span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </Slider>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Industry Projects Corporate Redesign */}
                <section className="industry-projects-corporate" id="projects">
                    <div className="projects-corp-container">
                        <div className="projects-corp-header">
                            <h2 className="projects-corp-title">
                                {content.projectsHeading ? (
                                    (() => {
                                        const words = content.projectsHeading.trim().split(' ');
                                        if (words.length > 2) {
                                            const lastTwo = words.splice(-2).join(' ');
                                            return <>{words.join(' ')} <span className="highlight-gradient1">{lastTwo}</span></>;
                                        } else if (words.length > 1) {
                                            const lastWord = words.pop();
                                            return <>{words.join(' ')} <span className="highlight-gradient1">{lastWord}</span></>;
                                        }
                                        return <>{content.projectsHeading}</>;
                                    })()
                                ) : (
                                    <>Hands-On <span className="highlight-gradient1">Industry Projects</span></>
                                )}
                            </h2>
                            <p className="projects-corp-subtitle">{content.projectsDescription || "Gain practical experience by building real-world applications using industry-standard tools and technologies."}</p>
                        </div>

                        {(() => {
                            const projectsList = content?.projects || [
                                {
                                    title: "Real-Time Stock Market Analysis",
                                    desc: "Create a real-time stock market analytics system with DynamoDB, Lambda and AWS Kinesis. Utilise Amazon QuickSight to visualize trends, store insights in S3 and process real time stock data streams. For tracking systems and alarms, use CloudWatch.",
                                    tech: ["AWS Kinesis", "DynamoDB", "Lambda"]
                                },
                                {
                                    title: "IoT Smart Home Automation",
                                    desc: "Create a remote-control smart home system with AWS IoT Core, Lambda, and DynamoDB. Send alerts via social media, store data in S3, and use AWS Analytics to examine usage trends. Use CloudWatch to keep an eye on device health for dependability.",
                                    tech: ["AWS IoT Core", "Lambda", "DynamoDB"]
                                },
                                {
                                    title: "AI-Powered Chatbot on AWS",
                                    desc: "Create a chatbot for real-time consumer interactions with Amazon Lex, Lambda and DynamoDB. Connect AWS Polly for text to speech and S3 for data storage. Use API Gateway for deployment and CloudWatch for performance monitoring and optimisation.",
                                    tech: ["Amazon Lex", "Lambda", "AWS Polly"]
                                }
                            ];

                            const CustomPrevArrow = ({ onClick }) => (
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '-20px',
                                        transform: 'translateY(-50%)',
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        backgroundColor: '#ffffff',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        zIndex: 10
                                    }}
                                    onClick={onClick}
                                >
                                    <FaChevronLeft style={{ color: '#8b5cf6', fontSize: '16px' }} />
                                </div>
                            );

                            const CustomNextArrow = ({ onClick }) => (
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '50%',
                                        right: '-20px',
                                        transform: 'translateY(-50%)',
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        backgroundColor: '#ffffff',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        zIndex: 10
                                    }}
                                    onClick={onClick}
                                >
                                    <FaChevronRight style={{ color: '#8b5cf6', fontSize: '16px' }} />
                                </div>
                            );

                            const sliderSettings = {
                                dots: true,
                                infinite: projectsList.length > 3,
                                speed: 500,
                                slidesToShow: 3,
                                slidesToScroll: 1,
                                nextArrow: <CustomNextArrow />,
                                prevArrow: <CustomPrevArrow />,
                                responsive: [
                                    { breakpoint: 1024, settings: { slidesToShow: 2, slidesToScroll: 1 } },
                                    { breakpoint: 768, settings: { slidesToShow: 1, slidesToScroll: 1 } }
                                ]
                            };

                            const renderProject = (project, idx) => {
                                const icons = [<FaChartLine />, <FaHome />, <FaRobot />, <FaCode />, <FaCloud />];
                                const icon = icons[idx % icons.length];
                                return (
                                    <div key={idx} className="project-slide-wrapper">
                                        <div className="project-card-corp" style={{ height: '100%', margin: 0 }}>
                                            <div className="project-card-corp-inner" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                                <div className="project-corp-header">
                                                    <div className="project-corp-icon">
                                                        {icon}
                                                    </div>
                                                    <div className="project-corp-badge">Project {idx + 1}</div>
                                                </div>
                                                <div className="project-corp-content" style={{ flexGrow: 1 }}>
                                                    <h3 className="project-corp-title">{project.title}</h3>
                                                    <p className="project-corp-desc">{project.desc}</p>
                                                </div>
                                                <div className="project-corp-footer">
                                                    <div className="project-corp-tech">
                                                        {(project.tech || []).map((t, i) => (
                                                            <span key={i} className="corp-tech-tag">{t}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            };

                            if (projectsList.length <= 3) {
                                return (
                                    <div className="projects-corp-grid">
                                        {projectsList.map((project, idx) => {
                                            const icons = [<FaChartLine />, <FaHome />, <FaRobot />, <FaCode />, <FaCloud />];
                                            const icon = icons[idx % icons.length];
                                            return (
                                                <div key={idx} className="project-card-corp">
                                                    <div className="project-card-corp-inner">
                                                        <div className="project-corp-header">
                                                            <div className="project-corp-icon">
                                                                {icon}
                                                            </div>
                                                            <div className="project-corp-badge">Project {idx + 1}</div>
                                                        </div>
                                                        <div className="project-corp-content">
                                                            <h3 className="project-corp-title">{project.title}</h3>
                                                            <p className="project-corp-desc">{project.desc}</p>
                                                        </div>
                                                        <div className="project-corp-footer">
                                                            <div className="project-corp-tech">
                                                                {(project.tech || []).map((t, i) => (
                                                                    <span key={i} className="corp-tech-tag">{t}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            }

                            return (
                                <div className="projects-slider-container" style={{ position: 'relative', margin: '0 20px', paddingBottom: '30px' }}>
                                    <style>{`
                                        .projects-slider-container .slick-list {
                                            padding: 20px 0 !important;
                                            margin: -20px 0 !important;
                                        }
                                        .projects-slider-container .slick-track {
                                            display: flex !important;
                                        }
                                        .projects-slider-container .slick-slide {
                                            height: inherit !important;
                                            display: flex !important;
                                            justify-content: center;
                                        }
                                        .projects-slider-container .slick-slide > div {
                                            width: 100%;
                                            display: flex;
                                            padding: 0 15px;
                                            box-sizing: border-box;
                                        }
                                        .projects-slider-container .project-slide-wrapper {
                                            flex: 1;
                                            display: flex;
                                            flex-direction: column;
                                        }
                                    `}</style>
                                    <Slider {...sliderSettings}>
                                        {projectsList.map(renderProject)}
                                    </Slider>
                                </div>
                            );
                        })()}
                    </div>
                </section>

                {/* Skills and Tools UI Redesign - Corporate Trustable */}
                <section className="skills-tools-corporate" id="skills">
                    <div className="skills-corp-container">
                        <div className="skills-corp-header">
                            <h2 className="corp-section-title">
                                {content.skillsHeading ? (
                                    (() => {
                                        const words = content.skillsHeading.trim().split(' ');
                                        if (words.length > 1) {
                                            const lastWord = words.pop();
                                            return <>{words.join(' ')} <span className="highlight-gradient1">{lastWord}</span></>;
                                        }
                                        return <>{content.skillsHeading}</>;
                                    })()
                                ) : (
                                    <>Core Competencies & <span className="highlight-gradient1">Tools</span></>
                                )}
                            </h2>
                            <p className="corp-section-subtitle">
                                {content.skillsDescription ? (
                                    content.skillsDescription.replace(/{courseData\.title}/g, courseData.title || "professional")
                                ) : (
                                    `Master the industry-standard skills and technologies required by top employers globally to become a proficient ${courseData.title || "professional"}.`
                                )}
                            </p>
                        </div>

                        <div className="skills-corp-layout single-column-layout">
                            <div className="skills-corp-right full-width-panel">
                                <h3 className="corp-subheading center-subheading"><FaLaptopCode className="heading-icon-blue" /> Tools & Platforms Covered</h3>
                                <motion.div
                                    className="corp-tools-panel"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                >
                                    <div className="corp-tools-flex">
                                        {(content.tools && content.tools.length > 0 ? content.tools : [
                                            "Amazon Web Services", "Google Cloud Platform", "Microsoft Azure", "Terraform",
                                            "Kubernetes", "Docker", "Ansible", "Jenkins", "Chef", "VMware", "IBM Cloud", "DigitalOcean", "Alibaba Cloud"
                                        ]).map((toolItem, index) => {
                                            const toolName = typeof toolItem === 'string' ? toolItem : (toolItem.name || "");
                                            const toolLogo = typeof toolItem === 'object' && toolItem.logo ? toolItem.logo : null;

                                            const name = toolName.toLowerCase();
                                            let icon = <div className="tool-dot-blue"></div>;

                                            if (toolLogo) {
                                                icon = <img src={toolLogo} alt={toolName} className="tool-logo-icon" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />;
                                            } else {
                                                if (name.includes('amazon') || name.includes('aws')) icon = <SiAmazonwebservices className="tool-logo-icon" style={{ color: '#FF9900' }} />;
                                                else if (name.includes('google') || name.includes('gcp')) icon = <SiGooglecloud className="tool-logo-icon" style={{ color: '#4285F4' }} />;
                                                else if (name.includes('azure') || name.includes('microsoft')) icon = <FaMicrosoft className="tool-logo-icon" style={{ color: '#00A4EF' }} />;
                                                else if (name.includes('terraform')) icon = <SiTerraform className="tool-logo-icon" style={{ color: '#7B42BC' }} />;
                                                else if (name.includes('kubernetes')) icon = <SiKubernetes className="tool-logo-icon" style={{ color: '#326CE5' }} />;
                                                else if (name.includes('docker')) icon = <FaDocker className="tool-logo-icon" style={{ color: '#2496ED' }} />;
                                                else if (name.includes('ansible')) icon = <SiAnsible className="tool-logo-icon" style={{ color: '#EE0000' }} />;
                                                else if (name.includes('jenkins')) icon = <SiJenkins className="tool-logo-icon" style={{ color: '#D24939' }} />;
                                                else if (name.includes('chef')) icon = <SiChef className="tool-logo-icon" style={{ color: '#F09820' }} />;
                                                else if (name.includes('vmware')) icon = <SiVmware className="tool-logo-icon" style={{ color: '#607078' }} />;
                                                else if (name.includes('ibm')) icon = <FaCloud className="tool-logo-icon" style={{ color: '#052FAD' }} />;
                                                else if (name.includes('digitalocean')) icon = <SiDigitalocean className="tool-logo-icon" style={{ color: '#0080FF' }} />;
                                                else if (name.includes('alibaba')) icon = <SiAlibabacloud className="tool-logo-icon" style={{ color: '#FF6A00' }} />;
                                                else if (name.includes('vs code') || name.includes('visual studio code')) icon = <VscCode className="tool-logo-icon" style={{ color: '#007ACC' }} />;
                                                else if (name.includes('github')) icon = <SiGithub className="tool-logo-icon" style={{ color: '#181717' }} />;
                                                else if (name.includes('git')) icon = <SiGit className="tool-logo-icon" style={{ color: '#F05032' }} />;
                                                else if (name.includes('postman')) icon = <SiPostman className="tool-logo-icon" style={{ color: '#FF6C37' }} />;
                                                else if (name.includes('react')) icon = <SiReact className="tool-logo-icon" style={{ color: '#61DAFB' }} />;
                                                else if (name.includes('node')) icon = <SiNodedotjs className="tool-logo-icon" style={{ color: '#339933' }} />;
                                                else if (name.includes('mongo')) icon = <SiMongodb className="tool-logo-icon" style={{ color: '#47A248' }} />;
                                                else if (name.includes('express')) icon = <SiExpress className="tool-logo-icon" style={{ color: '#000000' }} />;
                                                else if (name.includes('tailwind')) icon = <SiTailwindcss className="tool-logo-icon" style={{ color: '#06B6D4' }} />;
                                                else if (name.includes('jest')) icon = <SiJest className="tool-logo-icon" style={{ color: '#C21325' }} />;
                                            }

                                            return (
                                                <div key={index} className="corp-tool-badge">
                                                    {icon}
                                                    {toolName}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="corp-trust-banner">
                                        <FaShieldAlt className="trust-icon-shield" />
                                        <span>Curriculum aligned with official industry certification standards.</span>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* About Course Section */}
                <section className="about-course-section">
                    <div className="about-course-container">
                        <div className="about-course-left">
                            <h2 className="about-course-title">
                                About the <span className="highlight-gradient1">{courseData.title || "Data Analyst"}</span>
                            </h2>
                            <div className="about-course-title-underline"></div>

                            {content.aboutCourse?.description ? (
                                <div
                                    className={`about-course-desc-html ${showFullAbout ? '' : 'collapsed'}`}
                                    style={{ marginBottom: showFullAbout ? '24px' : '8px' }}
                                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.aboutCourse.description) }}
                                />
                            ) : (
                                <p className="about-course-desc" style={{ marginBottom: showFullAbout ? '24px' : '8px' }}>
                                    Our {courseData.title || "Data Analyst"} Online Course in India is tailored to students, freshers, job aspirants, and working professionals who wish to develop themselves in the field from scratch.
                                    {showFullAbout && (
                                        <>
                                            {" "}This practical Training concentrates on learning real-life skills which are required to be possessed by an aspiring professional. You will be trained in handling real-world scenarios, and deriving relevant insights which will contribute to organizational growth. This program ensures practical learning through projects and other activities guided by professional trainers.
                                        </>
                                    )}
                                </p>
                            )}

                            {showFullAbout && (
                                <>
                                    <h3 className="about-course-highlights-title">Training Highlights</h3>
                                    <ul className="about-course-highlights-list">
                                        {content.aboutCourse?.highlights && content.aboutCourse.highlights.length > 0 ? (
                                            content.aboutCourse.highlights.map((highlight, index) => (
                                                <li key={index}>{highlight}</li>
                                            ))
                                        ) : (
                                            <>
                                                <li>Up-to-date training materials according to current industry trends</li>
                                                <li>Live interactive online sessions with skilled trainers</li>
                                                <li>Hands-on learning using real-world data sets</li>
                                                <li>Project-based training and assignments</li>
                                                <li>Skills training in essential tools and platforms</li>
                                                <li>Practical reporting and hands-on experience</li>
                                                <li>Support to prepare resume</li>
                                            </>
                                        )}
                                    </ul>
                                </>
                            )}

                            <button
                                onClick={() => setShowFullAbout(!showFullAbout)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#ea580c',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    padding: '0',
                                    marginBottom: '24px',
                                    fontSize: '15px'
                                }}
                            >
                                {showFullAbout ? 'Show Less -' : 'Show More +'}
                            </button>

                            <div className="about-course-buttons">
                                <button className="btn-download-curriculum-about" onClick={() => window.open(content.syllabusPdf || '#', '_blank')}>Download Curriculum</button>
                                <button className="btn-talk-counsellor-about" onClick={() => setShowEnquiryPopup(true)}>Talk to Counsellor</button>
                            </div>
                        </div>

                        <div className="about-course-right">
                            <div className="about-course-card">
                                <h4 className="about-card-title">What You Get</h4>
                                <ul className="about-card-list">
                                    <li>Live Instructor Led Classes</li>
                                    <li>Recorded Lectures for Revision</li>
                                    <li>Practical assignments</li>
                                    <li>Sessions for Clarifying Doubts</li>
                                    <li>Help in Creating Resume</li>
                                    <li>Assistance in Preparing for Interview</li>
                                    <li>Case Studies from Industry</li>
                                    <li>Assistance in Certification</li>
                                </ul>
                            </div>

                            <div className="about-course-card">
                                <h4 className="about-card-title">Course Design & Approved By</h4>
                                <div className="about-card-logos">
                                    <img src="/favicon.png" alt="Nasscom" className="nasscom-logo" />
                                    <span className="logo-text">Careerfast</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Course Benefits UI Redesign */}
                <section className="course-benefits-pro-v2" id="learn">
                    <div className="benefits-v2-container">
                        <div className="benefits-v2-header">
                            <h2>
                                {content.careerSection?.title ? (
                                    (() => {
                                        const words = content.careerSection.title.trim().split(' ');
                                        if (words.length > 1) {
                                            const secondWord = words[1];
                                            return (
                                                <>
                                                    {words[0]} <span className="highlight-gradient">{secondWord}</span> {words.slice(2).join(' ')}
                                                </>
                                            );
                                        }
                                        return <>{content.careerSection.title}</>;
                                    })()
                                ) : (
                                    <>Career <span className="highlight-gradient">Opportunities</span> & Salary</>
                                )}
                            </h2>
                            <p className="benefits-v2-desc">
                                {content.careerSection?.description ? (
                                    content.careerSection.description.replace(/{courseData\.title}/g, courseData.title || "Certification")
                                ) : (
                                    `The ${courseData.title || "Certification"} Course Program covers industry-standard tools and technologies with hands-on training. Gain real-world experience through industry projects and a ${courseData.title || "Certification"} Internship, enhancing your practical skills. With 100% ${courseData.title || "Certification"} Placement support and flexible course fees, explore top career opportunities in leading IT firms.`
                                )}
                            </p>
                        </div>

                        <div className="benefits-v2-layout">
                            <div className="benefits-v2-sidebar">
                                {careerBenefitsData.map((item, index) => (
                                    <div
                                        key={index}
                                        className={`benefit-tab ${activeDesignation === index ? 'active' : ''}`}
                                        onClick={() => setActiveDesignation(index)}
                                    >
                                        <span className="benefit-tab-icon">{getRoleIcon(item.icon)}</span>
                                        <span className="benefit-tab-title">{item.title}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="benefits-v2-content">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeDesignation}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.3 }}
                                        className="benefits-v2-content-inner"
                                    >
                                        <div className="salary-card-modern">
                                            <h3 className="content-section-title"><FaChartLine className="title-icon" /> Salary Expectations</h3>
                                            <div className="modern-chart-container">
                                                <div className="modern-bar-group">
                                                    <div className="modern-bar-label">Min</div>
                                                    <div className="modern-bar-wrapper">
                                                        <motion.div initial={{ height: 0 }} animate={{ height: '40%' }} className="modern-bar min-bg"></motion.div>
                                                    </div>
                                                    <div className="modern-bar-value">{careerBenefitsData[activeDesignation].minSalary}</div>
                                                </div>
                                                <div className="modern-bar-group">
                                                    <div className="modern-bar-label">Average</div>
                                                    <div className="modern-bar-wrapper">
                                                        <motion.div initial={{ height: 0 }} animate={{ height: '80%' }} className="modern-bar avg-bg"></motion.div>
                                                    </div>
                                                    <div className="modern-bar-value highlight">{careerBenefitsData[activeDesignation].avgSalary}</div>
                                                </div>
                                                <div className="modern-bar-group">
                                                    <div className="modern-bar-label">Max</div>
                                                    <div className="modern-bar-wrapper">
                                                        <motion.div initial={{ height: 0 }} animate={{ height: '100%' }} className="modern-bar max-bg"></motion.div>
                                                    </div>
                                                    <div className="modern-bar-value">{careerBenefitsData[activeDesignation].maxSalary}</div>
                                                </div>
                                                <div className="chart-grid-lines">
                                                    <div className="grid-line"></div>
                                                    <div className="grid-line"></div>
                                                    <div className="grid-line"></div>
                                                    <div className="grid-line"></div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="companies-card-modern">
                                            <h3 className="content-section-title"><FaBriefcase className="title-icon" /> Top Recruiting Companies</h3>
                                            <div className="modern-company-grid">
                                                {careerBenefitsData[activeDesignation].companies.map((company, i) => (
                                                    <div key={i} className="modern-company-logo">
                                                        {company.logo ? <img src={company.logo} alt={company.name} /> : <span className="company-name-fallback">{company.name}</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Why Learn at Careerfast Section */}
                <section className="why-learn-section" id="why-learn">
                    <div className="why-learn-container">
                        <div className="why-learn-header">
                            <h2>Why Learn at <span style={{ color: '#ff6e00' }}>Careerfast?</span></h2>
                            <p className="why-learn-subtitle">
                                Empowering students across various fields with branches in Velachery, Anna Nagar, T Nagar, Tambaram, Thoraipakkam (OMR), Porur, and Pallikaranai, we help you enhance your skills and provide unlimited placement support until you land your dream job. Ready to learn and make an impact?
                            </p>
                        </div>

                        <div className="why-learn-content">
                            <div className="why-learn-images">
                                <div className="image-grid-why">
                                    <div className="img-box img-1">
                                        <img src="https://www.acte.in/wp-content/uploads/2026/07/course-guid-2.jpeg" alt="Live Classroom" />
                                        <div className="img-caption">Live Classroom Sessions</div>
                                    </div>
                                    <div className="img-box img-2">
                                        <img src="https://www.acte.in/wp-content/uploads/2026/05/certificate-provide.jpeg" alt="Hands-on Projects" />
                                        <div className="img-caption">Hands-on Projects</div>
                                    </div>
                                    <div className="img-box img-3">
                                        <img src="https://www.learnovita.com/wp-content/uploads/2026/08/course_new.jpeg" alt="Placement Sessions" />
                                        <div className="img-caption">Free Placement Sessions</div>
                                    </div>
                                </div>
                            </div>

                            <div className="why-learn-features">
                                <div className="feature-card-why">
                                    <div className="f-icon-wrap bg-orange-light">
                                        <FaUserTie className="f-icon text-orange" />
                                    </div>
                                    <div className="f-content">
                                        <h4>Industry Expert Trainer</h4>
                                        <p>Learn directly from seasoned professionals with years of real-world experience. Get personalized guidance and insights into industry best practices.</p>
                                        <span className="f-badge badge-orange">Expert Led</span>
                                    </div>
                                </div>

                                <div className="feature-card-why">
                                    <div className="f-icon-wrap bg-purple-light">
                                        <FaCode className="f-icon text-purple" />
                                    </div>
                                    <div className="f-content">
                                        <h4>Hands On Project</h4>
                                        <p>Build real-world applications to solidify your knowledge and gain practical experience. Enhance your portfolio with industry-standard projects.</p>
                                        <span className="f-badge badge-purple">Practical</span>
                                    </div>
                                </div>

                                <div className="feature-card-why">
                                    <div className="f-icon-wrap bg-blue-light">
                                        <FaLaptopCode className="f-icon text-blue" />
                                    </div>
                                    <div className="f-content">
                                        <h4>LMS Self Learning Platform</h4>
                                        <p>Access our advanced platform anytime for recorded sessions, assignments, and materials. Learn at your own pace with our 24/7 available portal.</p>
                                        <span className="f-badge badge-blue">24/7 Access</span>
                                    </div>
                                </div>

                                <div className="feature-card-why">
                                    <div className="f-icon-wrap bg-orange-light">
                                        <FaRocket className="f-icon text-orange" />
                                    </div>
                                    <div className="f-content">
                                        <h4>Placement Preparation</h4>
                                        <p>Receive comprehensive support for resume building, mock interviews, and technical rounds. Land your dream job with our dedicated placement assistance.</p>
                                        <span className="f-badge badge-orange">Job Ready</span>
                                    </div>
                                </div>

                                <div className="feature-card-why">
                                    <div className="f-icon-wrap bg-green-light">
                                        <FaChartLine className="f-icon text-green" />
                                    </div>
                                    <div className="f-content">
                                        <h4>Free Aptitude, Skill Training</h4>
                                        <p>Develop strong logical reasoning and communication skills crucial for interviews. Elevate your employability with our complementary training sessions.</p>
                                        <span className="f-badge badge-green">Skill Boost</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="why-learn-actions">
                            <a href="tel:+919345045466" className="btn-phone-white">
                                <FaPhoneAlt className="phone-icon" /> <span>+91 93450 45466</span>
                            </a>
                            <a href="https://wa.me/919345045466" className="whatsapp-blink-icon" target="_blank" rel="noopener noreferrer" title="Chat on WhatsApp">
                                <FaWhatsapp />
                            </a>
                            <button onClick={() => setShowEnquiryPopup(true)} className="btn-call-orange">
                                <FaPhoneAlt className="phone-icon" /> Request A Call Back
                            </button>
                        </div>
                    </div>
                </section>

                {/* Certification Showcase Section */}
                <section className="cert-showcase-section" id="certification">
                    <div className="cert-showcase-container">
                        <div className="cert-showcase-left">
                            <h2 className="cert-showcase-title">
                                Showcase your Course Completion<br />
                                <span className='highlight-gradient'>Certificate to Recruiters</span>
                            </h2>

                            <ul className="cert-showcase-features">
                                <li>
                                    <FaCheckCircle className="cert-check-icon" />
                                    <span>Training Certificate is Govern By 12 Global Associations.</span>
                                </li>
                                <li>
                                    <FaCheckCircle className="cert-check-icon" />
                                    <span>Training Certificate is Powered by "Wipro DICE ID"</span>
                                </li>
                                <li>
                                    <FaCheckCircle className="cert-check-icon" />
                                    <span>Training Certificate is Powered by "Verifiable Skill Credentials"</span>
                                </li>
                            </ul>

                            <div className="cert-collab-section">
                                <div className="cert-collab-header">
                                    <span className="cert-collab-text">in Collaboration with</span>
                                    <div className="cert-collab-line"></div>
                                </div>
                                <div className="cert-collab-logos">
                                    <div className="collab-logo-wrapper">
                                        <img src="https://www.acte.in/wp-content/uploads/2020/02/acte-logo.png" alt="ACTE" />
                                    </div>
                                    <div className="collab-logo-wrapper1">
                                        <img src="https://qubinex.com/wp-content/uploads/2025/01/q-logo.png" alt="Qubinex" />
                                    </div>
                                    <div className="collab-logo-wrapper1">
                                        <img src="https://www.linkplux.com/wp-content/uploads/2023/11/cropped-Linkplux-Chennai.png" alt="LINKPLUX" />
                                    </div>
                                </div>
                            </div>

                            <div className="cert-showcase-actions">
                                <button onClick={() => setShowEnquiryPopup(true)} className="cert-btn-primary">Get In Touch</button>
                                <button onClick={() => setShowEnquiryPopup(true)} className="cert-btn-secondary">Get a Sample Certificate</button>
                            </div>
                        </div>

                        <div className="cert-showcase-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div className="cert-image-wrapper">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeCertIndex}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <img
                                            src={certifications[activeCertIndex].image}
                                            alt={certifications[activeCertIndex].title}
                                            className="cert-showcase-img"
                                        />
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                            <div className="cert-slider-dots" style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
                                {certifications.map((_, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => setActiveCertIndex(idx)}
                                        style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: idx === activeCertIndex ? '#ff0000' : '#cbd5e1', cursor: 'pointer', transition: 'background-color 0.3s' }}
                                    ></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Upcoming Batches & Pricing Section */}
                <section className="batch-pro-section" id="batches">
                    <div className="batch-pro-container">
                        <div className="batch-pro-heading-wrapper">
                            <h2 className="reviews-pro-title">Upcoming <span className="highlight-gradient1">Batches & Pricing</span></h2>
                            <p className="reviews-pro-subtitle">Choose a schedule that fits your lifestyle. Limited seats available per batch.</p>
                        </div>

                        <div className="batch-pro-card">
                            <div className="batch-pro-left">
                                <div className="batch-pro-header">
                                    <div className="batch-duration-badge">
                                        <FaRegClock className="b-icon" /> Careefast Quality Learning Experience
                                    </div>
                                </div>
                                <div className="batch-list-pro">
                                    {(content.batches && content.batches.length > 0 ? content.batches : [
                                        { date: '2026-06-13', type: 'Weekend', days: 'SAT - SUN', slot: 'Mor | Aft | Eve - Slot' },
                                        { date: '2026-06-15', type: 'Weekday', days: 'MON - FRI', slot: 'Mor | Aft | Eve - Slot' },
                                        { date: '2026-06-10', type: 'Weekday', days: 'MON - FRI', slot: 'Mor | Aft | Eve - Slot' }
                                    ]).map((batch, idx) => {
                                        // Formatting the date
                                        const d = new Date(batch.date);
                                        const formattedDate = isNaN(d.getTime()) ? batch.date : `${d.getDate()}-${d.toLocaleString('default', { month: 'short' })}-${d.getFullYear()}`;
                                        return (
                                            <div className="batch-item-pro" key={idx}>
                                                <div className="batch-date-col">
                                                    <FaRegCalendarAlt className="b-icon-sm" /> <span>{formattedDate}*</span>
                                                </div>
                                                <div className="batch-divider">|</div>
                                                <div className="batch-type-col">
                                                    <span className={`b-type-badge ${batch.type?.toLowerCase()}`}>{batch.type}</span>
                                                </div>
                                                <div className="batch-divider">|</div>
                                                <div className="batch-days-col">{batch.days}</div>
                                                <div className="batch-divider">|</div>
                                                <div className="batch-slot-col">{batch.slot}</div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="batch-pro-right">
                                <div className="bp-price-header">Course Price :</div>
                                <div className="bp-region-badge">For Indian</div>
                                <div className="bp-price-original">₹ {content.hero?.prices?.original || "17,700"}</div>
                                <div className="bp-price-discounted">₹ {content.hero?.prices?.discounted || "15,930"}</div>
                                <div className="bp-discount-tag">
                                    {(() => {
                                        const origStr = content.hero?.prices?.original || "17700";
                                        const discStr = content.hero?.prices?.discounted || "15930";
                                        const orig = parseInt(origStr.toString().replace(/,/g, ''));
                                        const disc = parseInt(discStr.toString().replace(/,/g, ''));
                                        if (orig > disc && orig > 0) {
                                            const pct = Math.round(((orig - disc) / orig) * 100);
                                            return `${pct}% OFF, Save ₹ ${orig - disc}`;
                                        }
                                        return "10 % OFF, Save ₹ 1770";
                                    })()}
                                </div>

                                <div className="bp-timer-box">
                                    <FaRegClock className="bp-timer-icon" /> Expires in: <strong>{content.hero?.prices?.expiry || "00D : 06H : 48M : 42S"}</strong>
                                </div>

                                <button onClick={() => setShowEnquiryPopup(true)} className="bp-enroll-btn">
                                    ENROLL NOW
                                </button>
                                <div className="bp-indicative-text">
                                    Program fees are indicative only. <a href="#">*Know more</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Hiring Partners Redesign V2 */}
                <section className="partners-pro-v2" id="partners">
                    <div className="partners-v2-container">
                        <div className="partners-v2-header">
                            <h2 className="partners-v2-title">Our Hiring <span className="highlight-gradient1">Partners</span></h2>
                            <p className="partners-v2-subtitle">Join the ranks of our alumni working at top global technology companies.</p>
                        </div>

                        <div className="partners-v2-marquee-wrapper">
                            <div className="partners-v2-marquee">
                                <div className="partners-v2-marquee-content">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" alt="Microsoft" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg" alt="IBM" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" alt="Amazon" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" alt="Google" />
                                    <img src="https://cdn.brandfetch.io/idssig0_jY/theme/dark/logo.svg?c=1bxid64Mup7aczewSAYMX&t=1687855848599" alt="Zoho" />
                                    <img src="https://www.learnovita.com/wp-content/uploads/2025/01/tcsacte.png" alt="TCS" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/1/18/Dell_logo_2016.svg" alt="Dell" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/a/ad/HP_logo_2012.svg" alt="HP" />
                                </div>
                                <div className="partners-v2-marquee-content">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" alt="Microsoft" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg" alt="IBM" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" alt="Amazon" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" alt="Google" />
                                    <img src="https://cdn.brandfetch.io/idssig0_jY/theme/dark/logo.svg?c=1bxid64Mup7aczewSAYMX&t=1687855848599" alt="Zoho" />
                                    <img src="https://www.learnovita.com/wp-content/uploads/2025/01/tcsacte.png" alt="TCS" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/1/18/Dell_logo_2016.svg" alt="Dell" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/a/ad/HP_logo_2012.svg" alt="HP" />
                                </div>
                            </div>

                            <div className="partners-v2-marquee reverse">
                                <div className="partners-v2-marquee-content">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/50/Oracle_logo.svg" alt="Oracle" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/9/9d/Capgemini_201x_logo.svg" alt="Capgemini" />
                                    <img src="https://www.learnovita.com/wp-content/uploads/2025/01/tech.png" alt="Tech Mahindra" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/a/a0/Wipro_Primary_Logo_Color_RGB.svg" alt="Wipro" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/7/7b/Adobe_Systems_logo_and_wordmark.svg" alt="Adobe" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/9/95/Infosys_logo.svg" alt="Infosys" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/c/cd/Accenture.svg" alt="Accenture" />
                                </div>
                                <div className="partners-v2-marquee-content">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/50/Oracle_logo.svg" alt="Oracle" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/9/9d/Capgemini_201x_logo.svg" alt="Capgemini" />
                                    <img src="https://www.learnovita.com/wp-content/uploads/2025/01/tech.png" alt="Tech Mahindra" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/a/a0/Wipro_Primary_Logo_Color_RGB.svg" alt="Wipro" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/7/7b/Adobe_Systems_logo_and_wordmark.svg" alt="Adobe" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/9/95/Infosys_logo.svg" alt="Infosys" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/c/cd/Accenture.svg" alt="Accenture" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Not Just Studying Section - Simple & Neat */}
                <section className="njs-section-neat" id="more">
                    <div className="njs-container-neat">
                        <div className="njs-content-left-neat">
                            <h2 className="njs-heading-neat">
                                Transform Your Career,<br />
                                <span className="highlight-gradient1">No Matter Where You Start</span>
                            </h2>
                            <p className="njs-description-neat">
                                Whether you're a fresher, a non-IT graduate, returning after a career break, or aiming for a higher salary, our industry-focused training, mentorship, and placement support help you achieve your career goals faster.
                            </p>

                            <div className="njs-features-grid-neat">
                                {[
                                    { icon: <FaBriefcase />, title: "Career Gap to IT", desc: "Bridge your career gap and confidently enter the tech industry." },
                                    { icon: <FaRocket />, title: "Non IT to IT", desc: "Seamlessly transition from a non-technical background to IT." },
                                    { icon: <FaLaptopCode />, title: "Fresher to IT", desc: "Kickstart your career with expert training and placement support." },
                                    { icon: <FaShieldAlt />, title: "Less Than 60%", desc: "Get hired based on your skills, irrespective of academic scores." },
                                    { icon: <FaAward />, title: "Above 12 LPA", desc: "Unlock premium opportunities and secure high-paying tech roles." },
                                    { icon: <FaChartLine />, title: "Exp to High Pay", desc: "Leverage your experience for significant salary hikes in top MNCs." }
                                ].map((feature, idx) => (
                                    <div key={idx} className="njs-feature-card-neat">
                                        <div className="njs-feature-icon-neat">
                                            {feature.icon}
                                        </div>
                                        <div className="njs-feature-text-neat">
                                            <h3>{feature.title}</h3>
                                            <p>{feature.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="njs-content-right-neat">
                            <div className="njs-marquee-wrapper-neat">
                                <div className="njs-marquee-track-neat">
                                    {[1, 2].map((trackIdx) => (
                                        <div key={trackIdx} className="njs-marquee-slide-neat">
                                            <div className="njs-slide-poster">
                                                <img src="https://www.learnovita.com/wp-content/uploads/2026/01/Trilochana.jpg" alt="Trilochana Review Poster" />
                                            </div>
                                            <div className="njs-slide-poster">
                                                <img src="https://www.learnovita.com/wp-content/uploads/2026/01/Tharun-kumar-.jpg" alt="Tharun Kumar Review Poster" />
                                            </div>
                                            <div className="njs-slide-poster">
                                                <img src="https://www.learnovita.com/wp-content/uploads/2026/01/Shanmathi-.jpg" alt="Thon Review Poster" />
                                            </div>
                                            <div className="njs-slide-poster">
                                                <img src="https://www.learnovita.com/wp-content/uploads/2026/01/Kundala-Venkat.jpg" alt="Lavanya Review Poster" />
                                            </div>
                                            <div className="njs-slide-poster">
                                                <img src="https://www.learnovita.com/wp-content/uploads/2026/01/krithika.jpg" alt="Pooja Review Poster" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="njs-marquee-track-neat reverse">
                                    {[1, 2].map((trackIdx) => (
                                        <div key={trackIdx} className="njs-marquee-slide-neat">
                                            <div className="njs-slide-poster">
                                                <img src="https://www.learnovita.com/wp-content/uploads/2026/01/Rajkumar.jpg" alt="Pooja Review Poster" />
                                            </div>
                                            <div className="njs-slide-poster">
                                                <img src="https://www.learnovita.com/wp-content/uploads/2026/01/Thon.jpg" alt="Lavanya Review Poster" />
                                            </div>
                                            <div className="njs-slide-poster">
                                                <img src="https://www.learnovita.com/wp-content/uploads/2026/01/Lavanya.jpg" alt="Thon Review Poster" />
                                            </div>
                                            <div className="njs-slide-poster">
                                                <img src="https://www.learnovita.com/wp-content/uploads/2026/01/Sowmiya.jpg" alt="Tharun Kumar Review Poster" />
                                            </div>
                                            <div className="njs-slide-poster">
                                                <img src="https://www.learnovita.com/wp-content/uploads/2026/01/Trilochana.jpg" alt="Trilochana Review Poster" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Comparison Section */}
                <section className="comparison-pro-section-v2" id="comparison">
                    <div className="comparison-pro-container-v2">
                        <div className="comparison-header-v2">
                            <h2 className="comparison-title-v2">Why learn with <span className="highlight-gradient1">CareerFast?</span></h2>
                            <p className="comparison-subtitle-v2">Compare our features against standard learning platforms and see why we are the preferred choice for career transformation.</p>
                        </div>

                        <div className="comparison-table-wrapper-v2">
                            <div className="comparison-table-v2">
                                <div className="c-row-v2 c-header-row-v2">
                                    <div className="c-col-v2 c-benefits-v2">Benefits</div>
                                    <div className="c-col-v2 c-highlight-v2">
                                        <div className="c-highlight-header-v2">
                                            <span className="c-logo-text-v2">CareerFast</span>
                                            <div className="c-badge-v2">Recommended</div>
                                        </div>
                                    </div>
                                    <div className="c-col-v2 c-other-v2">Other Platforms</div>
                                    <div className="c-col-v2 c-other-v2">YouTube</div>
                                </div>
                                {[
                                    { name: "Government certified by NSDC", yt: false },
                                    { name: "Free placement assistance", yt: false },
                                    { name: "3x visibility in recruiter searches", yt: false },
                                    { name: "Direct interview invites", yt: false },
                                    { name: "Industry-ready curriculum & projects", yt: false },
                                    { name: "Real time doubt resolution", yt: false },
                                    { name: "Multi language support", yt: false },
                                    { name: "Trusted by 4 Million+ learners", other: "-", yt: "-" }
                                ].map((item, index) => (
                                    <div key={index} className="c-row-v2">
                                        <div className="c-col-v2 c-benefits-v2">{item.name}</div>
                                        <div className="c-col-v2 c-highlight-v2">
                                            <div className="c-icon-check-v2">
                                                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                                            </div>
                                        </div>
                                        <div className="c-col-v2 c-other-v2">
                                            {item.other === "-" ? <span className="c-dash-v2">-</span> : <div className="c-icon-cross-v2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M15 9l-6 6M9 9l6 6" /></svg></div>}
                                        </div>
                                        <div className="c-col-v2 c-other-v2">
                                            {item.yt === "-" ? <span className="c-dash-v2">-</span> : <div className="c-icon-cross-v2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M15 9l-6 6M9 9l6 6" /></svg></div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Real Stories Slider */}
                <section className="reviews-pro-section" id="reviews">
                    <div className="reviews-pro-container">
                        <div className="reviews-pro-heading-wrapper">
                            <h2 className="reviews-pro-title">What Our <span className="highlight-gradient1">Learners</span> Say</h2>
                            <p className="reviews-pro-subtitle">Hear from our alumni who have successfully transformed their careers through our comprehensive training programs.</p>
                        </div>

                        <div className="reviews-tabs-header-wrapper">
                            <div className="reviews-tabs-header">
                                {['All', 'Career Gap to IT', 'Freshers to IT', 'Non-IT to IT'].map(tab => (
                                    <button
                                        key={tab}
                                        className={`review-tab-btn ${activeReviewTab === tab ? 'active' : ''}`}
                                        onClick={() => {
                                            setActiveReviewTab(tab);
                                            setVisibleReviews(1);
                                        }}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="video-reviews-grid-wrapper">
                            <div className="video-reviews-static-grid">
                                {(() => {
                                    const stories = [
                                        { name: "CHARUMATHI", course: "DATA ANALYTICS", lpa: "4 LPA", img: "https://www.learnovita.com/wp-content/uploads/2026/06/DHINAKARAN.png", category: "Freshers to IT" },
                                        { name: "ASHOK", course: "DATA SCIENTIST", lpa: "3.5 LPA", img: "https://www.learnovita.com/wp-content/uploads/2026/06/DEVIPRIYA.png", category: "Freshers to IT" },
                                        { name: "KAMALESH", course: "CLOUD ENGINEER", lpa: "4.5 LPA", img: "https://www.learnovita.com/wp-content/uploads/2026/06/DIWAKAR.png", category: "Freshers to IT" },
                                        { name: "VIJAY", course: "SOFTWARE TESTING", lpa: "6 LPA", img: "https://www.learnovita.com/wp-content/uploads/2026/06/ADHAVAN.png", category: "Career Gap to IT" },
                                        { name: "MANIKANDAN", course: "DATA SCIENCE", lpa: "4 LPA", img: "https://www.learnovita.com/wp-content/uploads/2026/06/GANESH-RAJ.png", category: "Career Gap to IT" },
                                        { name: "OVIYASHREE", course: "DATA ANALYTICS", lpa: "5 LPA", img: "https://www.learnovita.com/wp-content/uploads/2026/06/NIRMAL.png", category: "Non-IT to IT" },
                                        { name: "RANJITH", course: "DATA ANALYST", lpa: "5 LPA", img: "https://www.learnovita.com/wp-content/uploads/2026/06/DHINAKARAN.png", category: "Non-IT to IT" },
                                        { name: "SABARI", course: "JAVA DEVELOPER", lpa: "12 LPA", img: "https://www.learnovita.com/wp-content/uploads/2026/06/DEVIPRIYA.png", category: "Career Gap to IT" }
                                    ];
                                    const filteredStories = stories.filter(story => activeReviewTab === 'All' || story.category === activeReviewTab);

                                    const rowChunks = [];
                                    for (let i = 0; i < filteredStories.length; i += 4) {
                                        rowChunks.push(filteredStories.slice(i, i + 4));
                                    }

                                    return (
                                        <>
                                            {rowChunks.slice(0, visibleReviews).map((chunk, rowIdx) => (
                                                <div key={rowIdx} className="video-reviews-marquee-container" style={{ marginBottom: rowIdx < visibleReviews - 1 ? '30px' : '0' }}>
                                                    <div className="video-reviews-marquee-track">
                                                        {[1, 2, 3, 4].map((trackIdx) => (
                                                            <div key={trackIdx} className="video-reviews-marquee-slide">
                                                                {chunk.map((story, i) => (
                                                                    <div key={i} className="video-grid-card">
                                                                        <img src={story.img} alt={story.name} className="video-grid-bg" />
                                                                        <div className="video-grid-overlay"></div>
                                                                        <div className="video-grid-category">{story.category.toUpperCase()}</div>
                                                                        <div className="video-grid-play" onClick={() => setSelectedVideo(story)} style={{ cursor: 'pointer' }}>
                                                                            <div className="yt-play-btn">
                                                                                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                                                                            </div>
                                                                        </div>
                                                                        <div className="video-grid-info">
                                                                            <div className="vg-name">{story.name}</div>
                                                                            <div className="vg-course">{story.course}</div>
                                                                            <div className="vg-lpa">{story.lpa}</div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}

                                            {filteredStories.length === 0 && (
                                                <div className="placeholder-tab-content-pro" style={{ width: '100%', minWidth: '300px' }}>
                                                    {activeReviewTab} content coming soon.
                                                </div>
                                            )}

                                            <div className="reviews-view-more-container">
                                                {visibleReviews < rowChunks.length ? (
                                                    <button onClick={() => setVisibleReviews(prev => prev + 1)} className="reviews-view-more-btn" style={{ cursor: 'pointer' }}>
                                                        Load More
                                                    </button>
                                                ) : (
                                                    <a href="https://www.acte.in/placed-students-list" target="_blank" rel="noopener noreferrer" className="reviews-view-more-btn">
                                                        View More
                                                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '8px' }}>
                                                            <path d="M5 12h14"></path>
                                                            <path d="M12 5l7 7-7 7"></path>
                                                        </svg>
                                                    </a>
                                                )}
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="section-card custom-faq-section" id="faq">
                    <h2 className="custom-faq-title"> {courseData.title || "Certification"} <span className="highlight-gradient1">FAQs</span></h2>

                    <div className="custom-faq-list">
                        {((content.faqs && content.faqs.length > 0) ? content.faqs : (content.certificationQs && content.certificationQs.length > 0) ? content.certificationQs : [
                            { q: "What is Web Development?", a: "Web development is the work involved in developing a website for the Internet or an intranet. It can range from developing a simple single static page to complex web applications." },
                            { q: "What are the 3 types of Web Development?", a: "The three main types are Front-end (client-side), Back-end (server-side), and Full-stack (both client and server) development." },
                            { q: "What are the 3 programming languages on which web development is dependent?", a: "The core technologies of the web are HTML (structure), CSS (styling), and JavaScript (interactivity and logic)." },
                            { q: "What is the difference between a front end, back end, and full stack web developer?", a: "Front-end developers build what users see, back-end developers build the infrastructure that powers it, and full-stack developers do both." },
                            { q: "What are the jobs you can opt for after learning web development?", a: "You can work as a Front-end Developer, Back-end Developer, Full-stack Developer, UI/UX Developer, or Web Designer." },
                            { q: "Is 3 months enough to learn web development?", a: "Yes, 3 months is enough to learn the basics of HTML, CSS, and JavaScript to start building simple projects, though mastering it takes more time." }
                        ]).map((item, i) => (
                            <div key={i} className={`custom-faq-item ${openFaqIndex === i ? 'open' : ''}`}>
                                <div
                                    className="custom-faq-question"
                                    onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                                >
                                    <div className="custom-faq-q-content">
                                        <span className="q-icon">Q.</span>
                                        <span className="q-text">{item.q}</span>
                                    </div>
                                    <div className="custom-faq-chevron">
                                        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="6 9 12 15 18 9"></polyline>
                                        </svg>
                                    </div>
                                </div>
                                <div className="custom-faq-answer">
                                    <div className="custom-faq-answer-inner">
                                        <span className="a-icon">A.</span>
                                        <span className="a-text">{item.a}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="promo-banner-section">
                    <div className="promo-banner-container">
                        <div className="promo-banner-left">
                            <div className="promo-guarantee-pill">
                                100% JOB GUARANTEE
                            </div>
                            <h2 className="promo-heading">
                                Global Quality Training<br />
                                <span className="promo-highlight">At The Lowest Fees & Expert Trainer</span>
                            </h2>
                            <div className="promo-flags-wrapper">
                                <span className="promo-flags-text">AVAILABLE IN:</span>
                                <div className="promo-flags-icons">
                                    <img src="https://flagcdn.com/w160/in.png" alt="India" title="India" className="flag-icon" />
                                    <img src="https://flagcdn.com/w160/ca.png" alt="Canada" title="Canada" className="flag-icon" />
                                    <img src="https://flagcdn.com/w160/us.png" alt="USA" title="USA" className="flag-icon" />
                                    <img src="https://flagcdn.com/w160/sg.png" alt="Singapore" title="Singapore" className="flag-icon" />
                                    <img src="https://flagcdn.com/w160/ae.png" alt="UAE" title="UAE" className="flag-icon" />
                                    <img src="https://flagcdn.com/w160/au.png" alt="Australia" title="Australia" className="flag-icon" />
                                    <img src="https://flagcdn.com/w160/eu.png" alt="Europe" title="Europe" className="flag-icon" />
                                    <img src="https://flagcdn.com/w160/de.png" alt="Germany" title="Germany" className="flag-icon" />
                                </div>
                            </div>
                        </div>
                        <div className="promo-banner-right">
                            <div className="promo-enquiry-card">
                                <div className="promo-enquiry-text">Need custom pricing?</div>
                                <div className="promo-enquiry-actions">
                                    <button className="promo-enquiry-btn" onClick={() => setShowEnquiryPopup(true)}>ENQUIRY NOW</button>
                                    <a href="https://wa.me/919711526942" className="promo-whatsapp-btn" target="_blank" rel="noopener noreferrer">
                                        <FaWhatsapp className="promo-wa-icon" />
                                    </a>
                                </div>
                                <div className="promo-enquiry-rating">
                                    <div className="promo-stars">
                                        <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                                    </div>
                                    <span className="promo-rating-text">4.9/5 from 50k+ students</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Theme Tags Section */}
                <section className="theme-tags-section">
                    <div className="theme-tags-container">

                        <div className="theme-tags-category">
                            <h3 className="theme-tags-title">Recommended Job Courses</h3>
                            <div className="theme-tags-inline-list">
                                {[
                                    { name: 'Full Stack Developer Training', url: 'https://www.acte.in/full-stack-developer-training' },
                                    { name: 'Data Analytics Course', url: 'https://www.acte.in/data-analytics-training-course' },
                                    { name: 'Software Testing Course', url: 'https://www.acte.in/software-testing-training-course' },
                                    { name: 'Data Science Course', url: 'https://www.acte.in/data-science-course-training' },
                                    { name: 'Cloud Computing Certification Course', url: 'https://www.acte.in/cloud-computing-certification-course' },
                                    { name: 'Digital Marketing Training', url: 'https://www.acte.in/digital-marketing-training' },
                                    { name: 'Java Training', url: 'https://www.acte.in/java-training' },
                                    { name: 'Python Training Course', url: 'https://www.acte.in/python-training-course' },
                                    { name: 'Gen AI Course', url: 'https://www.acte.in/gen-ai-course' }
                                ].map((course, idx, arr) => (
                                    <React.Fragment key={course.name}>
                                        <a href={course.url} target="_blank" rel="noopener noreferrer" className="tag-inline">{course.name}</a>
                                        {idx < arr.length - 1 && <span className="tag-separator">|</span>}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>

                        <div className="theme-tags-category">
                            <h3 className="theme-tags-title">Trending Courses</h3>
                            <div className="theme-tags-inline-list">
                                {[
                                    { name: 'Artificial Intelligence', url: 'https://www.acte.in/artificial-intelligence-course' },
                                    { name: 'Salesforce', url: 'https://www.acte.in/salesforce-training' },
                                    { name: 'Power BI', url: 'https://www.acte.in/power-bi-training' },
                                    { name: 'Microsoft Azure', url: 'https://www.acte.in/microsoft-azure-training' },
                                    { name: 'PMP', url: 'https://www.acte.in/pmp-certification-training' },
                                    { name: 'Cyber Security', url: 'https://www.acte.in/cyber-security-online-training' },
                                    { name: 'Cloud Computing', url: 'https://www.acte.in/cloud-computing-certification-course' },
                                    { name: 'Data Analytics', url: 'https://www.acte.in/data-analytics-training-course' },
                                    { name: 'Scrum Master', url: 'https://www.acte.in/scrum-master-online-training' },
                                    { name: 'Workday', url: 'https://www.acte.in/workday-training' },
                                    { name: 'Full Stack', url: 'https://www.acte.in/full-stack-developer-training' },
                                    { name: 'Data Science', url: 'https://www.acte.in/data-science-course-training' },
                                    { name: 'Dot Net', url: 'https://www.acte.in/dot-net-online-course' },
                                    { name: 'Java', url: 'https://www.acte.in/java-training' },
                                    { name: 'Software Testing', url: 'https://www.acte.in/software-testing-training-course' },
                                    { name: 'Ethical Hacking', url: 'https://www.acte.in/ethical-hacking-course' },
                                    { name: 'Devops', url: 'https://www.acte.in/devops-online-training' },
                                    { name: 'Python', url: 'https://www.acte.in/python-training-course' },
                                    { name: 'AWS', url: 'https://www.acte.in/aws-certification-training' },
                                    { name: 'Digital Marketing', url: 'https://www.acte.in/digital-marketing-training' },
                                    { name: 'Selenium', url: 'https://www.acte.in/selenium-certification-training' },
                                    { name: 'Gen AI', url: 'https://www.acte.in/gen-ai-course' }
                                ].map((course, idx, arr) => (
                                    <React.Fragment key={course.name}>
                                        <a href={course.url} target="_blank" rel="noopener noreferrer" className="tag-inline">{course.name}</a>
                                        {idx < arr.length - 1 && <span className="tag-separator">|</span>}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>

                        {/* <div className="theme-tags-category">
                            <h3 className="theme-tags-title">Find {courseData.title || "AWS"} Training Courses in Other Cities</h3>
                            <div className="other-cities-chips">
                                {['Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Coimbatore'].map((city, index) => (
                                    <Link href="#" key={index} className="city-chip" onClick={(e) => e.preventDefault()}>
                                        {courseData.title || "AWS"} Training in {city}
                                    </Link>
                                ))}
                            </div>
                        </div> */}

                        <div className="theme-tags-category">
                            <h3 className="theme-tags-title">Job Opportunities</h3>
                            <div className="theme-tags-pills">
                                {careerBenefitsData && careerBenefitsData.length > 0 ? (
                                    careerBenefitsData.map((role) => (
                                        <Link href={`/jobs?q=${encodeURIComponent(role.title)}`} key={role.id || role.title} className="tag-pill">{role.title}</Link>
                                    ))
                                ) : (
                                    ['Cloud Computing Architect', 'Cloud Security Engineer', 'Cloud Software Engineer', 'Cloud Network Engineer'].map(tag => (
                                        <Link href={`/jobs?q=${encodeURIComponent(tag)}`} key={tag} className="tag-pill">{tag}</Link>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                </section>

            </div>

            {/* Video Popup Modal */}
            <AnimatePresence>
                {selectedVideo && (
                    <motion.div
                        className="video-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedVideo(null)}
                    >
                        <motion.div
                            className="video-modal-content"
                            initial={{ scale: 0.8, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button className="video-modal-close" onClick={() => setSelectedVideo(null)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                            <div className="video-modal-iframe-container">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                                    title="Student Testimonial"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen>
                                </iframe>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Enquiry Popup Modal */}
            {showEnquiryPopup && (
                <div className="popup-overlay" onClick={() => setShowEnquiryPopup(false)}>
                    <div className="popup-box" onClick={e => e.stopPropagation()}>
                        <button className="popup-close" onClick={() => setShowEnquiryPopup(false)}>✕</button>
                        <h2>Send Your Enquiry</h2>
                        <form className="popup-form" onSubmit={handleEnquirySubmit}>
                            <input
                                type="text"
                                name="userName"
                                placeholder="Your Name"
                                value={enquiryFormData.userName}
                                onChange={handleEnquiryInputChange}
                                disabled={enquiryLoading}
                                required
                            />
                            <input
                                type="email"
                                name="userEmail"
                                placeholder="Your Email"
                                value={enquiryFormData.userEmail}
                                onChange={handleEnquiryInputChange}
                                disabled={enquiryLoading}
                                required
                            />
                            <input
                                type="tel"
                                name="phoneNumber"
                                placeholder="Your Phone Number (Optional)"
                                value={enquiryFormData.phoneNumber}
                                onChange={handleEnquiryInputChange}
                                disabled={enquiryLoading}
                                pattern="[0-9]{10,15}"
                                title="Please enter a valid phone number (10-15 digits)"
                            />
                            <select
                                name="trainingMode"
                                value={enquiryFormData.trainingMode}
                                onChange={handleEnquiryInputChange}
                                disabled={enquiryLoading}
                                required
                            >
                                {trainingModeOptions}
                            </select>
                            <textarea
                                name="message"
                                placeholder="Your Message"
                                rows="4"
                                value={enquiryFormData.message}
                                onChange={handleEnquiryInputChange}
                                disabled={enquiryLoading}
                                required
                            ></textarea>
                            <button type="submit" className="popup-submit" disabled={enquiryLoading}>
                                {enquiryLoading ? 'Sending...' : 'Send Message'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <Footer />

            {/* Inline styles for quick fixes/specific tweaks not in CSS file */}
            <style jsx>{`
        .hero-subtitle {
          font-size: 18px;
          color: #555;
          max-width: 800px;
          margin-bottom: 30px;
        }
        .download-syllabus-btn {
          background: #fff;
          border: 1.5px solid var(--internshala-blue);
          color: var(--internshala-blue);
          padding: 12px 24px;
          border-radius: 6px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .download-syllabus-btn:hover {
          background-color: #ff7300;
          color: white;
          border-color: #ff7300;
        }
      `}</style>
        </>
    );
}
