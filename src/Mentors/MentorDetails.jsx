'use client';
import React, { useEffect, useState } from 'react';
import SEO from '../Components/SEO/SEO';
import { useParams } from '@/routing-shim';
import { Modal } from 'antd';
import mentor1 from "../images/Ankit-Sharma.jpg";
import mentor2 from "../images/priya.jpg";
import mentor3 from "../images/rahul.jpg";
import mentor4 from "../images/sneha.jpg";
import mentor5 from "../images/vikram.jpg";
import mentor6 from "../images/aditi.jpg";
import mentor8 from "../images/nisha.jpg";
import mentor9 from "../images/arjun.jpg";
import Header from '../Header/Header';
import { getImageUrl } from "../utils/getImageUrl";

export const mentorsData = [
    {
        id: 1,
        name: "Ankit Sharma",
        title: "Senior Software Engineer",
        company: "Google",
        image: mentor1,
        rating: "4.9",
        reviews: "120",
        about:
            "I am a Senior Software Engineer at Google with over 8 years of experience designing scalable distributed systems and mentoring 100+ candidates. I can help you with System Design, DSA, interview preparation, and long-term career planning.",
        experience: [
            { role: "Senior Software Engineer", company: "Google", duration: "2020 - Present" },
            { role: "Software Engineer", company: "Microsoft", duration: "2017 - 2020" },
            { role: "SDE I", company: "Adobe", duration: "2015 - 2017" }
        ],
        price: "₹1500",
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
        about:
            "Product Manager at Microsoft with deep experience in product strategy, user research, and cross-functional leadership. I mentor aspiring PMs with resume review, mock interviews, and case study preparation.",
        experience: [
            { role: "Product Manager", company: "Microsoft", duration: "2019 - Present" },
            { role: "Associate Product Manager", company: "Flipkart", duration: "2017 - 2019" }
        ],
        price: "₹2000",
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
        about:
            "Data Scientist at Amazon with expertise in Machine Learning, Python, and statistical modeling. I help mentees transition into data roles with end-to-end ML project guidance and interview training.",
        experience: [
            { role: "Data Scientist", company: "Amazon", duration: "2020 - Present" },
            { role: "Machine Learning Engineer", company: "Paytm", duration: "2018 - 2020" }
        ],
        price: "₹1800",
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
        about:
            "UX Designer at Airbnb with expertise in user research, design systems, and portfolio storytelling. I guide designers on building strong portfolios and preparing for design interviews.",
        experience: [
            { role: "UX Designer", company: "Airbnb", duration: "2021 - Present" },
            { role: "Product Designer", company: "Swiggy", duration: "2018 - 2021" }
        ],
        price: "₹1600",
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
        about:
            "Backend Engineering Lead at Netflix working on high-scale microservices architecture. I help developers master backend fundamentals, system design, and scalable architecture.",
        experience: [
            { role: "Backend Lead", company: "Netflix", duration: "2020 - Present" },
            { role: "Senior Backend Engineer", company: "Uber", duration: "2017 - 2020" },
            { role: "Software Engineer", company: "Infosys", duration: "2014 - 2017" }
        ],
        price: "₹2200",
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
        about:
            "Marketing Head at Spotify with expertise in digital advertising, brand strategy, and audience growth. I help mentees craft strong marketing careers and improve their branding skills.",
        experience: [
            { role: "Marketing Head", company: "Spotify", duration: "2021 - Present" },
            { role: "Senior Marketing Manager", company: "Zomato", duration: "2018 - 2021" }
        ],
        price: "₹1500",
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
        about:
            "Investment Banker at J.P. Morgan specializing in M&A, valuations, and financial modeling. I assist students and professionals preparing for finance roles and top-tier bank interviews.",
        experience: [
            { role: "Investment Banker", company: "J.P. Morgan", duration: "2019 - Present" },
            { role: "Financial Analyst", company: "Deloitte", duration: "2016 - 2019" }
        ],
        price: "₹2500",
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
        about:
            "HR Director at Tata Sons with extensive experience in leadership hiring, culture building, and interview coaching. I help candidates with mock interviews and career acceleration.",
        experience: [
            { role: "HR Director", company: "Tata Sons", duration: "2018 - Present" },
            { role: "HR Manager", company: "Mahindra", duration: "2014 - 2018" }
        ],
        price: "₹1400",
        skills: ["HR", "Interview Prep", "Leadership"]
    },

    {
        id: 9,
        name: "Nisha Patel",
        title: "HR Director",
        company: "Tata Sons",
        image: mentor9,
        rating: "5.0",
        reviews: "110",
        about:
            "HR Director with deep experience in talent development, interview frameworks, and leadership mentoring. I can help professionals grow faster through structured learning.",
        experience: [
            { role: "HR Director", company: "Tata Sons", duration: "2018 - Present" },
            { role: "Talent Lead", company: "Infosys", duration: "2012 - 2018" }
        ],
        price: "₹1400",
        skills: ["HR", "Interview Prep", "Leadership"]
    }
];


const MentorDetails = () => {
    const { id } = useParams();
    const [mentor, setMentor] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        userName: '',
        userEmail: '',
        phoneNumber: '',
        message: ''
    });

    useEffect(() => {
        const foundMentor = mentorsData.find(m => m.id === parseInt(id));
        setMentor(foundMentor);
    }, [id]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { sendMentorQuery } = await import('../ApiService/action');

            const payload = {
                userName: formData.userName,
                userEmail: formData.userEmail,
                phoneNumber: formData.phoneNumber,
                message: formData.message,
                mentorName: mentor.name,
                mentorTitle: mentor.title,
                mentorCompany: mentor.company
            };

            const response = await sendMentorQuery(payload);

            if (response.status === 200) {
                Modal.success({
                    title: 'Query Sent Successfully!',
                    content: 'Your query has been submitted successfully. We will contact you soon.',
                    centered: true,
                    onOk: () => {
                        window.location.reload();
                    }
                });
                setShowPopup(false);
                setFormData({ userName: '', userEmail: '', phoneNumber: '', message: '' });
            }
        } catch (error) {
            console.error('Query submission error:', error);
            Modal.error({
                title: 'Submission Failed',
                content: error.response?.data?.error || 'Something went wrong. Please try again.',
                centered: true,
            });
        } finally {
            setLoading(false);
        }
    };

    if (!mentor) return <div className="mentor-loading">Loading...</div>;

    return (
        <div className="mentor-page">
            <Header />
            <SEO
                title={`${mentor.name} - ${mentor.title} at ${mentor.company}`}
                description={`Book a 1:1 mentorship session with ${mentor.name}, ${mentor.title} at ${mentor.company}. ${mentor.about}`}
                keywords={`${mentor.name}, ${mentor.title}, ${mentor.company}, mentorship, career guidance, ${mentor.skills.join(', ')}, CareerFast`}
                ogType="profile"
                ogImage={getImageUrl(mentor.image)}
                twitterCard="summary"
                structuredData={[
                    {
                        "@context": "https://schema.org",
                        "@type": "Person",
                        "name": mentor.name,
                        "jobTitle": mentor.title,
                        "worksFor": {
                            "@type": "Organization",
                            "name": mentor.company
                        },
                        "description": mentor.about,
                        "image": getImageUrl(mentor.image),
                        "url": `https://careerfast.in/mentor/${mentor.id}`,
                        "aggregateRating": {
                            "@type": "AggregateRating",
                            "ratingValue": mentor.rating,
                            "reviewCount": mentor.reviews
                        },
                        "offers": {
                            "@type": "Offer",
                            "price": mentor.price.replace('₹', ''),
                            "priceCurrency": "INR",
                            "description": "1:1 Mentorship Session"
                        }
                    }
                ]}
            />

            {/* HERO SECTION */}
            <div className="mentor-hero">
                <div className="mentor-hero-overlay"></div>

                <div className="mentor-card1">
                    <img src={getImageUrl(mentor.image)} alt={mentor.name} className="mentor-avatar" />

                    <div className="mentor-head-info">
                        <h1>{mentor.name}</h1>
                        <p className="mentor-role">
                            {mentor.title} at <span>{mentor.company}</span>
                        </p>

                        <div className="mentor-rating-pill">
                            ⭐ {mentor.rating} ({mentor.reviews} Reviews)
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="mentor-layout">

                <div className="mentor-left">
                    <div className="mentor-box">
                        <h2>About</h2>
                        <p>{mentor.about}</p>
                    </div>

                    <div className="mentor-box">
                        <h2>Experience</h2>

                        <div className="timeline">
                            {mentor.experience.map((exp, index) => (
                                <div key={index} className="timeline-row">
                                    <div className="dot"></div>
                                    <div>
                                        <h4>{exp.role}</h4>
                                        <p>{exp.company} • {exp.duration}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT CARD */}
                <div className="mentor-right">
                    <div className="mentor-book">
                        <div className="mentor-price">
                            {mentor.price} <span>/ session</span>
                        </div>

                        <button onClick={() => setShowPopup(true)} className="btn-main">Book Now</button>
                        <button className="btn-ghost" onClick={() => setShowPopup(true)}>
                            Send Query
                        </button>
                    </div>
                </div>

            </div>
            {showPopup && (
                <div className="popup-overlay" onClick={() => setShowPopup(false)}>
                    <div className="popup-box" onClick={e => e.stopPropagation()}>

                        <button className="popup-close" onClick={() => setShowPopup(false)}>✕</button>

                        <h2>Send Your Query</h2>

                        <form className="popup-form" onSubmit={handleSubmit}>
                            <input
                                type="text"
                                name="userName"
                                placeholder="Your Name"
                                value={formData.userName}
                                onChange={handleInputChange}
                                disabled={loading}
                                required
                            />
                            <input
                                type="email"
                                name="userEmail"
                                placeholder="Your Email"
                                value={formData.userEmail}
                                onChange={handleInputChange}
                                disabled={loading}
                                required
                            />
                            <input
                                type="tel"
                                name="phoneNumber"
                                placeholder="Your Phone Number (Optional)"
                                value={formData.phoneNumber}
                                onChange={handleInputChange}
                                disabled={loading}
                                pattern="[0-9]{10,15}"
                                title="Please enter a valid phone number (10-15 digits)"
                            />
                            <textarea
                                name="message"
                                placeholder="Your Message"
                                rows="4"
                                value={formData.message}
                                onChange={handleInputChange}
                                disabled={loading}
                                required
                            ></textarea>

                            <button type="submit" className="popup-submit" disabled={loading}>
                                {loading ? 'Sending...' : 'Send Message'}
                            </button>
                        </form>

                    </div>
                </div>
            )}

        </div>
    );
};

export default MentorDetails;


