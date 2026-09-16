'use client';
import { getImageUrl } from "../utils/getImageUrl";

import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import SEO from "../Components/SEO/SEO";
import { Typography, Row, Col, Card, Button, Input, Select, Tag, Avatar, Badge, Space } from "antd";
import { motion } from "framer-motion";
import {
    SearchOutlined,
    TrophyOutlined,
    ClockCircleOutlined,
    UserOutlined,
    ArrowRightOutlined,
    FireOutlined,
    StarOutlined,
    TeamOutlined
} from "@ant-design/icons";
import { Modal, Form } from "antd";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import "./Competitions.css";
import ParticlesBg from "particles-bg";
import { useNavigate } from "@/routing-shim";


const { Title, Text, Paragraph } = Typography;

// Mock Data
const activeCompetitions = [
    {
        id: 1,
        title: "Google Code Jam 2025",
        organizer: "Google",
        image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/1200px-Google_%22G%22_logo.svg.png",
        category: "Coding",
        prizePool: "$100,000",
        timeLeft: "7 Days Left",
        participants: 18000,
        tags: ["Algorithms", "Data Structures", "C++", "Python"],
        status: "Live",
    },
    {
        id: 2,
        title: "UI/UX Design Hackathon",
        organizer: "Adobe",
        image: "https://images.unsplash.com/photo-1559028012-481c04fa702d?w=1200&q=80",
        logo: "https://static.cdnlogo.com/logos/a/90/adobe.png",
        category: "Design",
        prizePool: "$25,000",
        timeLeft: "15 Days Left",
        participants: 6200,
        tags: ["Figma", "UX Research", "Design Systems"],
        status: "Upcoming",
    },
    {
        id: 3,
        title: "AI & Data Science Challenge",
        organizer: "Kaggle",
        image: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=1200&q=80",
        logo: "https://images.icon-icons.com/2699/PNG/512/kaggle_logo_icon_168473.png",
        category: "Data Science",
        prizePool: "$50,000",
        timeLeft: "3 Days Left",
        participants: 24000,
        tags: ["Machine Learning", "Python", "AI"],
        status: "Ending Soon",
    },
    {
        id: 4,
        title: "Ethereum Web3 Hackathon",
        organizer: "Ethereum Foundation",
        image: "https://images.unsplash.com/photo-1660030584437-10c529d4a6cb?q=80&w=1323&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        logo: "https://images.seeklogo.com/logo-png/52/2/ethereum-foundation-logo-png_seeklogo-522381.png",
        category: "Blockchain",
        prizePool: "$150,000",
        timeLeft: "21 Days Left",
        participants: 4300,
        tags: ["Solidity", "Web3", "Smart Contracts"],
        status: "Live",
    },
    {
        id: 5,
        title: "Frontend Masters Challenge",
        organizer: "Frontend Masters",
        image: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=1200&q=80",
        logo: "https://avatars.githubusercontent.com/u/5613852?s=280&v=4",
        category: "Coding",
        prizePool: "$20,000",
        timeLeft: "10 Days Left",
        participants: 5200,
        tags: ["React", "JavaScript", "Performance"],
        status: "Live",
    },
    {
        id: 6,
        title: "Cyber Security CTF 2025",
        organizer: "Hack The Box",
        image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&q=80",
        logo: "https://roanokeinfosec.com/wp-content/uploads/2019/07/hacktheboxlogo.jpg?w=676",
        category: "Security",
        prizePool: "$60,000",
        timeLeft: "1 Month Left",
        participants: 8900,
        tags: ["CTF", "Ethical Hacking", "Network Security"],
        status: "Upcoming",
    },
];

const categories = ["All", "Coding", "Design", "Data Science", "Blockchain", "Security"];

const CompetitionsLandingPage = () => {
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");

    const [modalType, setModalType] = useState(null);
    const [activeCompetition, setActiveCompetition] = useState(null);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const openModal = (type, competition = null) => {
        setModalType(type);
        setActiveCompetition(competition);
        form.resetFields();
    };

    const closeModal = () => {
        setModalType(null);
        setActiveCompetition(null);
        form.resetFields();
        setLoading(false);
    };


    const filteredCompetitions = activeCompetitions.filter(comp => {
        const matchCategory = selectedCategory === "All" || comp.category === selectedCategory;
        const matchSearch = comp.title.toLowerCase().includes(searchTerm.toLowerCase());
        return matchCategory && matchSearch;
    });

    const fadeInUp = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };

    return (
        <div className="competitions-page">
            <SEO
                title="Coding Competitions & Hackathons - Challenge Yourself"
                description="Compete with the best minds globally. Join coding competitions, hackathons, and challenges from top companies. Showcase your skills, solve real-world problems, and win exciting prizes up to $500k+."
                keywords="coding competitions, hackathons, programming challenges, tech competitions, coding contests, developer challenges, algorithm competitions, data science challenges, design hackathons, blockchain hackathons, CareerFast"
                ogImage="https://careerfast.in/og-image-competitions.jpg"
                twitterImage="https://careerfast.in/twitter-image-competitions.jpg"
                breadcrumbSchema={[
                    { name: "Home", item: "/" },
                    { name: "Competitions", item: "/competitions" }
                ]}
                structuredData={[
                    {
                        "@context": "https://schema.org",
                        "@type": "WebPage",
                        "name": "Coding Competitions & Hackathons - CareerFast",
                        "url": "https://careerfast.in/competitions",
                        "description": "Compete with the best minds globally. Join coding competitions, hackathons, and challenges from top companies."
                    },
                    {
                        "@context": "https://schema.org",
                        "@type": "ItemList",
                        "name": "Active Competitions",
                        "description": "Browse active coding competitions and hackathons",
                        "numberOfItems": activeCompetitions.length,
                        "itemListElement": activeCompetitions.map((comp, index) => ({
                            "@type": "Event",
                            "position": index + 1,
                            "name": comp.title,
                            "organizer": {
                                "@type": "Organization",
                                "name": comp.organizer
                            },
                            "offers": {
                                "@type": "Offer",
                                "price": comp.prizePool,
                                "priceCurrency": "USD"
                            }
                        }))
                    }
                ]}
            />

            <Header />

            {/* Hero Section */}
            <section className="comp-hero-section">
                <ParticlesBg type="cobweb" bg={true} color="#ffffff" num={30} />
                <div className="hero-overlay"></div>
                <div className="hero-content">
                    <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
                        <Title level={1} className="hero-title1">
                            Challenge. Check. <span className="highlight-text">Conquer.</span>
                        </Title>
                        <Paragraph className="hero-subtitle1">
                            Compete with the best minds globally. Showcase your skills, solve real-world problems, and win exciting rewards.
                        </Paragraph>
                        <Space size="large" className="compet-btn-space">
                            <Button type="primary" size="large" className="explore-btn" onClick={() => {
                                if (typeof window !== "undefined") {
                                    document.getElementById('competitions-list')?.scrollIntoView({ behavior: 'smooth' });
                                }
                            }}>
                                Explore Competitions
                            </Button>
                            <Button ghost size="large" className="host-btn" onClick={() => openModal("host")}>
                                Host a Competition
                            </Button>
                        </Space>
                    </motion.div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="comp-stats-section">
                <div className="container">
                    <Row gutter={[24, 24]} justify="center">
                        <Col xs={12} sm={6}>
                            <div className="stat-item1">
                                <TrophyOutlined className="stat-icon1" />
                                <h3>$500k+</h3>
                                <p>Prizes Won</p>
                            </div>
                        </Col>
                        <Col xs={12} sm={6}>
                            <div className="stat-item1">
                                <UserOutlined className="stat-icon1" />
                                <h3>50k+</h3>
                                <p>Participants</p>
                            </div>
                        </Col>
                        <Col xs={12} sm={6}>
                            <div className="stat-item1">
                                <FireOutlined className="stat-icon1" />
                                <h3>120+</h3>
                                <p>Challenges Hosted</p>
                            </div>
                        </Col>
                        <Col xs={12} sm={6}>
                            <div className="stat-item1">
                                <StarOutlined className="stat-icon1" />
                                <h3>4.8/5</h3>
                                <p>User Rating</p>
                            </div>
                        </Col>
                    </Row>
                </div>
            </section>

            {/* Filters & Search */}
            <section className="comp-filter-section" id="competitions-list">
                <div className="container">
                    <Row gutter={[16, 16]} align="middle" justify="space-between">
                        <Col xs={24} md={12}>
                            <div className="category-tabs">
                                {categories.map(cat => (
                                    <span
                                        key={cat}
                                        className={`category-tab ${selectedCategory === cat ? 'active' : ''}`}
                                        onClick={() => setSelectedCategory(cat)}
                                    >
                                        {cat}
                                    </span>
                                ))}
                            </div>
                        </Col>
                        <Col xs={24} md={8}>
                            <Input
                                placeholder="Search competitions..."
                                prefix={<SearchOutlined />}
                                className="search-input"
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </Col>
                    </Row>
                </div>
            </section>

            {/* Competitions Grid */}
            <section className="comp-list-section">
                <div className="container">
                    <Row gutter={[24, 24]}>
                        {filteredCompetitions.length > 0 ? (
                            filteredCompetitions.map((comp) => (
                                <Col xs={24} sm={12} lg={8} key={comp.id}>
                                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
                                        <Card
                                            hoverable
                                            className="competition-card"
                                            cover={
                                                <div className="card-cover">
                                                    <img alt={comp.title} src={getImageUrl(comp.image)} />
                                                    <div className="status-badge1">
                                                        <Badge status={comp.status === 'Live' ? 'processing' : comp.status === 'Upcoming' ? 'default' : 'error'} />
                                                        {comp.status}
                                                    </div>
                                                    <div className="time-left-badge">
                                                        <ClockCircleOutlined /> {comp.timeLeft}
                                                    </div>
                                                </div>
                                            }
                                        >
                                            <div className="card-header1">
                                                <Avatar src={getImageUrl(comp.logo)} size="large" className="organizer-logo" />
                                                <div className="organizer-info">
                                                    <Text className="organizer-name">{comp.organizer}</Text>
                                                    <Title level={4} className="comp-title">{comp.title}</Title>
                                                </div>
                                            </div>

                                            <div className="card-tags">
                                                {comp.tags.map(tag => <Tag key={tag} color="geekblue">{tag}</Tag>)}
                                            </div>

                                            <div className="card-meta">
                                                <div className="meta-item">
                                                    <TrophyOutlined className="meta-icon1 gold" />
                                                    <Text strong>{comp.prizePool}</Text>
                                                </div>
                                                <div className="meta-item">
                                                    <TeamOutlined className="meta-icon1" />
                                                    <Text>{comp.participants} Enrolled</Text>
                                                </div>
                                            </div>

                                            <Button
                                                type="primary"
                                                block
                                                className="join-btn"
                                                icon={<ArrowRightOutlined />}
                                                onClick={() => openModal("register", comp)}
                                            >
                                                Register Now
                                            </Button>
                                        </Card>
                                    </motion.div>
                                </Col>
                            ))
                        ) : (
                            <Col span={24}>
                                <div className="no-data">
                                    <Title level={3}>No competitions found</Title>
                                    <Text>Try adjusting your filters or search criteria.</Text>
                                </div>
                            </Col>
                        )}
                    </Row>
                </div>
            </section>

            {/* Featured / Call to Action */}
            <section className="comp-cta-section">
                <div className="container">
                    <div className="cta-box">
                        <Row align="middle" gutter={[32, 32]}>
                            <Col xs={24} md={14}>
                                <Title level={2} style={{ color: '#fff' }}>Not ready to compete yet?</Title>
                                <Paragraph style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px' }}>
                                    Check out our practice arena where you can solve problems at your own pace, learn new skills, and prepare for the big leagues.
                                </Paragraph>
                                <Button size="large" className="practice-btn" onClick={() => navigate("/")}>
                                    Explore More
                                </Button>
                            </Col>
                            <Col xs={24} md={10} style={{ textAlign: 'center' }}>
                                <img src="https://cdni.iconscout.com/illustration/premium/thumb/programmer-working-on-laptop-illustration-download-in-svg-png-gif-file-formats--coding-job-company-business-activities-pack-illustrations-2912061.png" alt="Practice" className="cta-image" />
                            </Col>
                        </Row>
                    </div>
                </div>
                <Modal
                    open={!!modalType}
                    onCancel={closeModal}
                    footer={null}
                    centered
                    width={520}
                    className="premium-modal"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        {/* HOST COMPETITION */}
                        {modalType === "host" && (
                            <>
                                <Title level={3}>🚀 Host a Competition</Title>
                                <Text type="secondary">Create challenges and engage top talent</Text>

                                <Form layout="vertical" style={{ marginTop: 20 }}>
                                    <Form.Item label="Organization Name" required style={{ marginBottom: 16 }}>
                                        <Input placeholder="Your company or community name" />
                                    </Form.Item>

                                    <Form.Item label="Competition Title" required style={{ marginBottom: 16 }}>
                                        <Input placeholder="Eg: AI Innovation Hackathon" />
                                    </Form.Item>

                                    <Form.Item label="Category" required style={{ marginBottom: 16 }}>
                                        <Select placeholder="Select category" classNames={{ popup: { root: 'premium-dropdown' } }}>
                                            {categories.filter(c => c !== "All").map(cat => (
                                                <Select.Option key={cat} value={cat}>{cat}</Select.Option>
                                            ))}
                                        </Select>
                                    </Form.Item>

                                    <Form.Item label="Contact Email" required style={{ marginBottom: 16 }}>
                                        <Input type="email" placeholder="email@example.com" />
                                    </Form.Item>

                                    <Button type="primary" block size="large">
                                        Submit Request
                                    </Button>
                                </Form>
                            </>
                        )}

                        {/* REGISTER */}
                        {modalType === "register" && (
                            <>
                                <Title level={3}>🏆 Register for Competition</Title>
                                <Text type="secondary">{activeCompetition?.title}</Text>

                                <Form
                                    form={form}
                                    layout="vertical"
                                    style={{ marginTop: 20 }}
                                    onFinish={async (values) => {
                                        try {
                                            setLoading(true);
                                            const { sendCompetitionRegistration } = await import('../ApiService/action');

                                            const payload = {
                                                fullName: values.fullName,
                                                email: values.email,
                                                phoneNumber: values.phoneNumber,
                                                skillLevel: values.skillLevel,
                                                competitionTitle: activeCompetition?.title,
                                                competitionOrganizer: activeCompetition?.organizer
                                            };

                                            const response = await sendCompetitionRegistration(payload);

                                            if (response.status === 200) {
                                                Modal.success({
                                                    title: 'Registration Successful!',
                                                    content: 'Your registration has been submitted successfully. We will contact you soon.',
                                                    centered: true,
                                                    onOk: () => {
                                                        if (typeof window !== "undefined") {
                                                            window.location.reload();
                                                        }
                                                    }
                                                });
                                                closeModal();
                                            }
                                        } catch (error) {
                                            console.error('Registration error:', error);
                                            Modal.error({
                                                title: 'Registration Failed',
                                                content: error.response?.data?.error || 'Something went wrong. Please try again.',
                                                centered: true,
                                            });
                                        } finally {
                                            setLoading(false);
                                        }
                                    }}
                                >
                                    <Form.Item
                                        label="Full Name"
                                        name="fullName"
                                        rules={[{ required: true, message: 'Please enter your full name' }]}
                                        style={{ marginBottom: 16 }}
                                    >
                                        <Input placeholder="Your full name" disabled={loading} />
                                    </Form.Item>

                                    <Form.Item
                                        label="Email Address"
                                        name="email"
                                        rules={[
                                            { required: true, message: 'Please enter your email' },
                                            { type: 'email', message: 'Please enter a valid email' }
                                        ]}
                                        style={{ marginBottom: 16 }}
                                    >
                                        <Input type="email" placeholder="you@example.com" disabled={loading} />
                                    </Form.Item>

                                    <Form.Item
                                        label="Phone Number"
                                        name="phoneNumber"
                                        rules={[
                                            { pattern: /^[0-9]{10,15}$/, message: 'Please enter a valid phone number (10-15 digits)' }
                                        ]}
                                        style={{ marginBottom: 16 }}
                                    >
                                        <Input placeholder="Your phone number" disabled={loading} />
                                    </Form.Item>

                                    <Form.Item
                                        label="Skill Level"
                                        name="skillLevel"
                                        style={{ marginBottom: 16 }}
                                    >
                                        <Select placeholder="Select your level" classNames={{ popup: { root: 'premium-dropdown' } }} disabled={loading}>
                                            <Select.Option value="Beginner">Beginner</Select.Option>
                                            <Select.Option value="Intermediate">Intermediate</Select.Option>
                                            <Select.Option value="Advanced">Advanced</Select.Option>
                                        </Select>
                                    </Form.Item>

                                    <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                                        {loading ? 'Submitting...' : 'Confirm Registration'}
                                    </Button>
                                </Form>
                            </>
                        )}

                        {/* PRACTICE */}
                        {modalType === "practice" && (
                            <>
                                <Title level={3}>🎯 Practice Arena</Title>
                                <Text type="secondary">
                                    Sharpen your skills before competing
                                </Text>

                                <Form layout="vertical" style={{ marginTop: 20 }}>
                                    <Form.Item label="Choose Skill" style={{ marginBottom: 16 }}>
                                        <Select placeholder="Select skill to practice" classNames={{ popup: { root: 'premium-dropdown' } }}>
                                            <Select.Option value="DSA">DSA</Select.Option>
                                            <Select.Option value="Frontend">Frontend</Select.Option>
                                            <Select.Option value="Backend">Backend</Select.Option>
                                            <Select.Option value="AI / ML">AI / ML</Select.Option>
                                            <Select.Option value="Cyber Security">Cyber Security</Select.Option>
                                        </Select>
                                    </Form.Item>

                                    <Button type="primary" block size="large">
                                        Start Practice
                                    </Button>
                                </Form>
                            </>
                        )}
                    </motion.div>
                </Modal>
            </section>
            <Footer />
        </div>
    );
};

export default CompetitionsLandingPage;


