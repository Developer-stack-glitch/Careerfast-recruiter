'use client';
import React, { useState } from "react";
import {
    Form,
    Input,
    Button,
    Select,
    Upload,
    message,
    InputNumber,
    Space,
    Tag,
    Card,
    Row,
    Col,
    Divider,
    Steps,
    Typography,
    Avatar,
    Tooltip,
    Alert
} from "antd";
import {
    UploadOutlined,
    PlusOutlined,
    InfoCircleOutlined,
    RocketOutlined,
    TeamOutlined,
    TrophyOutlined,
    SafetyCertificateOutlined,
    GlobalOutlined,
} from "@ant-design/icons";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { createEvent } from "../ApiService/action";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";

const { Title, Text } = Typography;
const { Option } = Select;

export default function PostEvents() {
    const [form] = Form.useForm();
    const [about, setAbout] = useState("");
    const [participationType, setParticipationType] = useState("Individual");
    const [eligibilityList, setEligibilityList] = useState([]);
    const [eligibilityInput, setEligibilityInput] = useState("");
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [base64Logo, setBase64Logo] = useState("");

    const steps = [
        { title: "Basic Info", icon: <InfoCircleOutlined style={{ color: "#5f2eea" }} /> },
        { title: "Details", icon: <RocketOutlined style={{ color: "#5f2eea" }} /> },
        { title: "Participation", icon: <TeamOutlined style={{ color: "#5f2eea" }} /> },
        { title: "Prizes", icon: <TrophyOutlined style={{ color: "#5f2eea" }} /> }
    ];

    const handleAddEligibility = () => {
        if (!eligibilityInput.trim()) return;
        setEligibilityList([...eligibilityList, eligibilityInput.trim()]);
        setEligibilityInput("");
    };

    const handleRemoveEligibility = (item) => {
        setEligibilityList(eligibilityList.filter((el) => el !== item));
    };

    const handleFileChange = async (info) => {
        const uploadedFile = info.fileList[0]?.originFileObj;
        if (uploadedFile) {
            const reader = new FileReader();
            reader.onload = () => {
                setBase64Logo(reader.result); // result will be base64 data URL
            };
            reader.readAsDataURL(uploadedFile);
            setFile(uploadedFile);
        } else {
            setFile(null);
            setBase64Logo("");
        }
    };

    const onFinish = async (values) => {
        try {
            setLoading(true);

            const payload = {
                title: values.title || "",
                type: values.type || "",
                category: values.category || "",
                about: about || "",
                mode: values.mode || "",
                participationType: values.participationType || "",
                memberLimit: values.participationType === "Team" ? values.memberLimit || "" : null,
                eligibility: eligibilityList || [],
                winnerPrize: values.winnerPrize || "",
                runnerPrize: values.runnerPrize || "",
                logo: base64Logo, // ✅ send base64 string here
            };

            console.log("📦 Payload sending to backend:", payload);

            const res = await createEvent(payload);

            if (res.data.success) {
                message.success("🎉 Event created successfully!");
                form.resetFields();
                setAbout("");
                setEligibilityList([]);
                setBase64Logo("");
                setFile(null);
                setCurrentStep(0);
            }
        } catch (error) {
            console.error("❌ Error:", error);
            message.error("❌ Error creating opportunity!");
        } finally {
            setLoading(false);
        }
    };



    const nextStep = async () => {
        try {
            const values = await form.getFieldsValue();

            if (currentStep === 0) {
                if (!values.title || values.title.trim() === "") {
                    return message.error("Please enter the opportunity title!");
                }
                if (!values.type) {
                    return message.error("Please select the opportunity type!");
                }
                if (!values.category) {
                    return message.error("Please select the opportunity category!");
                }
                if (!file) {
                    return message.error("Please upload an event logo!");
                }
            } else if (currentStep === 1) {
                if (!about || about.trim() === "") {
                    return message.error("Please provide details about the opportunity!");
                }
                if (!values.mode) {
                    return message.error("Please select the opportunity mode!");
                }
            } else if (currentStep === 2) {
                if (!values.participationType) {
                    return message.error("Please select the participation type!");
                }
                if (participationType === "Team" && !values.memberLimit) {
                    return message.error("Please specify the team member limit!");
                }
            }

            // ✅ Move to next step if all required fields are filled
            setCurrentStep(currentStep + 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (err) {
            console.warn("Validation failed:", err);
        }
    };


    const handlePublish = async () => {
        try {
            const allValues = await form.validateFields([
                "title",
                "type",
                "category",
                "mode",
                "participationType",
                "memberLimit",
                "winnerPrize",
                "runnerPrize",
            ]);

            const fullValues = {
                ...allValues,
                about,
                eligibility: eligibilityList,
                participationType,
            };

            if (!file) {
                message.error("Please upload an event logo!");
                return;
            }

            if (!about || about.trim() === "") {
                message.error("Please add a description for the opportunity!");
                return;
            }

            await onFinish(fullValues);
        } catch (err) {
            console.warn("Validation failed:", err);
        }
    };


    const prevStep = () => {
        setCurrentStep(currentStep - 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const uploadProps = {
        beforeUpload: () => false,
        onChange: handleFileChange,
        maxCount: 1,
        showUploadList: false
    };

    return (
        <>
            <Header />

            <div style={{
                maxWidth: 1200,
                margin: "40px auto",
                padding: "0 20px"
            }}>
                {/* Header Section */}
                <div style={{ textAlign: "center", marginBottom: 40 }}>
                    <Title level={1} style={{
                        color: "#1890ff",
                        marginBottom: 8,
                        fontWeight: 700,
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent"
                    }}>
                        Create New Event
                    </Title>
                    <Text type="secondary" style={{ fontSize: 16 }}>
                        Share amazing opportunities with the community and reach talented individuals
                    </Text>
                </div>

                {/* Progress Steps */}
                <Card
                    style={{
                        marginBottom: 32,
                        borderRadius: 16,
                        boxShadow: "rgb(65 18 255 / 12%) 0px 4px 12px"
                    }}
                >
                    <Steps className="post_events_steps" current={currentStep} size="small">
                        {steps.map((step, index) => (
                            <Steps.Step
                                key={index}
                                title={step.title}
                                icon={step.icon}
                            />
                        ))}
                    </Steps>
                </Card>

                {/* Main Form Card */}
                <Card
                    style={{
                        borderRadius: 20,
                        boxShadow: "rgb(66 19 255 / 15%) 0px 8px 32px",
                        border: "1px solid #f0f0f0",
                        overflow: "hidden"
                    }}
                >
                    <Form className="post_events_form"
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        style={{ padding: 40 }}
                    >
                        {/* Step 1: Basic Information */}
                        {currentStep === 0 && (
                            <div>
                                <Title level={3} style={{ marginBottom: 32, color: "#1a1a1a" }}>
                                    <InfoCircleOutlined style={{ marginRight: 12, color: "#5f2eea" }} />
                                    Basic Information
                                </Title>

                                <Row gutter={[32, 0]}>
                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            style={{ marginBottom: 20 }}
                                            name="title"
                                            label={
                                                <span style={{ fontWeight: 600, fontSize: 14 }}>
                                                    Event Title
                                                </span>
                                            }
                                            rules={[{ required: true, message: "Please enter a title" }]}
                                        >
                                            <Input
                                                size="large"
                                                placeholder="Enter opportunity title"
                                                style={{ borderRadius: 8 }}
                                            />
                                        </Form.Item>
                                        <div style={{ marginBottom: 20 }}>
                                            <Form.Item
                                                name="type"
                                                label={<span style={{ fontWeight: 600, fontSize: 14 }}>Event Type</span>}
                                                rules={[{ required: true, message: "Please select type" }]}
                                            >
                                                <Select
                                                    mode="tags"
                                                    size="large"
                                                    placeholder="Select or type opportunity type"
                                                    optionFilterProp="children"
                                                    showSearch
                                                    style={{ borderRadius: 8, border: "1px solid #d9d9d9", padding: "5px 8px" }}
                                                    popupRender={(menu) => (
                                                        <>
                                                            {menu}
                                                            <div
                                                                style={{
                                                                    display: "flex",
                                                                    justifyContent: "center",
                                                                    padding: "8px",
                                                                    cursor: "pointer",
                                                                    borderTop: "1px solid #f0f0f0",
                                                                    color: "#5f2eea",
                                                                    fontWeight: 500,
                                                                }}
                                                            >
                                                                + Add to new type
                                                            </div>
                                                        </>
                                                    )}
                                                >
                                                    <Option value="Conference">Conference</Option>
                                                    <Option value="Hackathon">Hackathon</Option>
                                                    <Option value="Competition">Competition</Option>
                                                    <Option value="Scholarship">Scholarship</Option>
                                                    <Option value="Workshop">Workshop</Option>
                                                    <Option value="Internship">Internship</Option>
                                                </Select>
                                            </Form.Item>

                                        </div>

                                        <div style={{ marginTop: 20 }}>
                                            <Form.Item
                                                name="category"
                                                label={<span style={{ fontWeight: 600, fontSize: 14 }}>Event Category</span>}
                                                rules={[{ required: true, message: "Please select category" }]}
                                            >
                                                <Select
                                                    mode="tags"
                                                    size="large"
                                                    placeholder="Select or type category"
                                                    optionFilterProp="children"
                                                    showSearch
                                                    style={{ borderRadius: 8, border: "1px solid #d9d9d9", padding: "5px 8px" }}
                                                    popupRender={(menu) => (
                                                        <>
                                                            {menu}
                                                            <div
                                                                style={{
                                                                    display: "flex",
                                                                    justifyContent: "center",
                                                                    padding: "8px",
                                                                    cursor: "pointer",
                                                                    borderTop: "1px solid #f0f0f0",
                                                                    color: "#5f2eea",
                                                                    fontWeight: 500,
                                                                }}
                                                            >
                                                                + Add to new category
                                                            </div>
                                                        </>
                                                    )}
                                                >
                                                    <Option value="Technology">Technology</Option>
                                                    <Option value="Arts">Arts</Option>
                                                    <Option value="Science">Science</Option>
                                                    <Option value="Business">Business</Option>
                                                    <Option value="Sports">Sports</Option>
                                                    <Option value="Education">Education</Option>
                                                </Select>
                                            </Form.Item>
                                        </div>
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label={
                                                <span style={{ fontWeight: 600, fontSize: 14 }}>
                                                    Event Logo
                                                    <Tooltip title="Recommended: 500x500px, PNG/JPG format">
                                                        <InfoCircleOutlined style={{ marginLeft: 8, color: "#999" }} />
                                                    </Tooltip>
                                                </span>
                                            }
                                            required
                                        >
                                            <Upload {...uploadProps}>
                                                <div
                                                    style={{
                                                        border: "2px dashed #d9d9d9",
                                                        borderRadius: 12,
                                                        padding: 40,
                                                        textAlign: "center",
                                                        cursor: "pointer",
                                                        transition: "all 0.3s",
                                                        background: file ? "#f6ffed" : "#fafafa"
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.borderColor = "#5f2eea";
                                                        e.currentTarget.style.background = "#5f2eea1a";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.borderColor = "#d9d9d9";
                                                        e.currentTarget.style.background = file ? "#f6ffed" : "#fafafa";
                                                    }}
                                                >
                                                    {file ? (
                                                        <div>
                                                            <Avatar
                                                                src={URL.createObjectURL(file)}
                                                                size={80}
                                                                style={{ borderRadius: 8 }}
                                                            />
                                                            <div style={{ marginTop: 12 }}>
                                                                <Text type="success">✓ Logo Selected</Text>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <UploadOutlined style={{ fontSize: 32, color: "#999", marginBottom: 12 }} />
                                                            <div>
                                                                <Text>Click or drag to upload logo</Text>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </Upload>
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </div>
                        )}

                        {/* Step 2: Details */}
                        {currentStep === 1 && (
                            <div>
                                <Title level={3} style={{ marginBottom: 32, color: "#1a1a1a" }}>
                                    <RocketOutlined style={{ marginRight: 12, color: "#1890ff" }} />
                                    Event Details
                                </Title>

                                <Row gutter={[32, 0]}>
                                    <Col xs={24}>
                                        <Form.Item
                                            style={{ marginBottom: 20 }}
                                            label={
                                                <span style={{ fontWeight: 600, fontSize: 14 }}>
                                                    About the Event
                                                </span>
                                            }
                                            required
                                        >
                                            <div style={{
                                                borderRadius: 8,
                                                overflow: "hidden",
                                            }}>
                                                <ReactQuill
                                                    theme="snow"
                                                    value={about}
                                                    onChange={setAbout}
                                                    style={{ border: "none" }}
                                                    modules={{
                                                        toolbar: [
                                                            [{ 'header': [1, 2, 3, false] }],
                                                            ['bold', 'italic', 'underline', 'strike'],
                                                            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                                            ['link', 'image'],
                                                            ['clean']
                                                        ]
                                                    }}
                                                />
                                            </div>
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            name="mode"
                                            label={
                                                <span style={{ fontWeight: 600, fontSize: 14 }}>
                                                    <GlobalOutlined style={{ marginRight: 8 }} />
                                                    Event Mode
                                                </span>
                                            }
                                            rules={[{ required: true, message: "Please select mode" }]}
                                        >
                                            <Select
                                                size="large"
                                                placeholder="Select mode"
                                                style={{ borderRadius: 8, border: "1px solid #d9d9d9", padding: "0px 8px" }}
                                            >
                                                <Option value="Online">🌐 Online</Option>
                                                <Option value="Offline">🏢 Offline</Option>
                                                <Option value="Hybrid">🔀 Hybrid</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </div>
                        )}

                        {/* Step 3: Participation */}
                        {currentStep === 2 && (
                            <div>
                                <Title level={3} style={{ marginBottom: 32, color: "#1a1a1a" }}>
                                    <TeamOutlined style={{ marginRight: 12, color: "#1890ff" }} />
                                    Participation Details
                                </Title>

                                <Row gutter={[32, 0]}>
                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            style={{ marginBottom: 20 }}
                                            name="participationType"
                                            label={
                                                <span style={{ fontWeight: 600, fontSize: 14 }}>
                                                    Participation Type
                                                </span>
                                            }
                                            rules={[{ required: true, message: "Select participation type" }]}
                                        >
                                            <Select
                                                size="large"
                                                placeholder="Select type"
                                                onChange={(value) => setParticipationType(value)}
                                                style={{ borderRadius: 8, border: "1px solid #d9d9d9", padding: "0px 8px" }}
                                            >
                                                <Option value="Individual">👤 Individual</Option>
                                                <Option value="Team">👥 Team</Option>
                                            </Select>
                                        </Form.Item>

                                        {participationType === "Team" && (
                                            <Form.Item
                                                name="memberLimit"
                                                label={
                                                    <span style={{ fontWeight: 600, fontSize: 14 }}>
                                                        Team Member Limit
                                                    </span>
                                                }
                                                rules={[{ required: true, message: "Enter member limit" }]}
                                            >
                                                <InputNumber
                                                    min={1}
                                                    size="large"
                                                    placeholder="Number of members allowed"
                                                    style={{ width: "100%", borderRadius: 8 }}
                                                />
                                            </Form.Item>
                                        )}
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label={
                                                <span style={{ fontWeight: 600, fontSize: 14 }}>
                                                    <SafetyCertificateOutlined style={{ marginRight: 8 }} />
                                                    Eligibility Criteria
                                                </span>
                                            }
                                        >
                                            <Space.Compact style={{ width: "100%" }}>
                                                <Input
                                                    size="large"
                                                    placeholder="Add eligibility criteria"
                                                    value={eligibilityInput}
                                                    onChange={(e) => setEligibilityInput(e.target.value)}
                                                    onPressEnter={handleAddEligibility}
                                                    style={{ borderRadius: "8px 0 0 8px" }}
                                                />
                                                <Button
                                                    type="primary"
                                                    icon={<PlusOutlined />}
                                                    onClick={handleAddEligibility}
                                                    style={{ borderRadius: "0 8px 8px 0", background: "#5f2eea", height: 47 }}
                                                >
                                                    Add
                                                </Button>
                                            </Space.Compact>

                                            <div style={{ marginTop: 16, minHeight: 40 }}>
                                                {eligibilityList.map((item, index) => (
                                                    <Tag
                                                        key={index}
                                                        closable
                                                        onClose={() => handleRemoveEligibility(item)}
                                                        color="purple"
                                                        style={{
                                                            marginBottom: 8,
                                                            padding: "4px 8px",
                                                            borderRadius: 6,
                                                            fontSize: 13
                                                        }}
                                                    >
                                                        {item}
                                                    </Tag>
                                                ))}
                                            </div>
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </div>
                        )}

                        {/* Step 4: Prizes */}
                        {currentStep === 3 && (
                            <div>
                                <Title level={3} style={{ marginBottom: 32, color: "#1a1a1a" }}>
                                    <TrophyOutlined style={{ marginRight: 12, color: "#1890ff" }} />
                                    Prize Information
                                </Title>

                                <Alert
                                    message="Prize information helps attract more participants"
                                    description="Be clear about what winners can expect to receive"
                                    type="info"
                                    showIcon
                                    style={{ marginBottom: 24, borderRadius: 8 }}
                                />

                                <Row gutter={[32, 0]}>
                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            name="winnerPrize"
                                            label={
                                                <span style={{ fontWeight: 600, fontSize: 14 }}>
                                                    🥇 Winner Prize
                                                </span>
                                            }
                                        >
                                            <Input
                                                size="large"
                                                placeholder="e.g., $1000 cash prize, Certificates, Internship opportunity"
                                                style={{ borderRadius: 8 }}
                                            />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            name="runnerPrize"
                                            label={
                                                <span style={{ fontWeight: 600, fontSize: 14 }}>
                                                    🥈 Runner-up Prize
                                                </span>
                                            }
                                        >
                                            <Input
                                                size="large"
                                                placeholder="e.g., $500 cash prize, Swag kits, Mentorship"
                                                style={{ borderRadius: 8 }}
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <Divider />
                        <Row justify="space-between" style={{ marginTop: 32 }}>
                            <Col>
                                {currentStep > 0 && (
                                    <Button
                                        size="large"
                                        onClick={prevStep}
                                        style={{
                                            padding: "0 32px",
                                            borderRadius: 8,
                                            height: 40
                                        }}
                                    >
                                        ← Previous
                                    </Button>
                                )}
                            </Col>
                            <Col>
                                {currentStep < steps.length - 1 ? (
                                    <Button
                                        type="primary"
                                        size="large"
                                        onClick={nextStep}
                                        style={{
                                            padding: "0 32px",
                                            borderRadius: 8,
                                            height: 40,
                                            border: "none",
                                            background: "linear-gradient(135deg,#7f5af0,#5f2eea 50%,#4b1ea0)",
                                            color: "#fff"
                                        }}
                                    >
                                        Next
                                    </Button>
                                ) : (
                                    <Button
                                        type="primary"
                                        size="large"
                                        loading={loading}
                                        onClick={handlePublish} // ✅ manual submit handler
                                        style={{
                                            padding: "0 40px",
                                            borderRadius: 8,
                                            height: 40,
                                            background: "linear-gradient(135deg, #52c41a 0%, #1890ff 100%)",
                                            border: "none",
                                            fontWeight: 600
                                        }}
                                    >
                                        🚀 Publish Event
                                    </Button>
                                )}

                            </Col>
                        </Row>
                    </Form>
                </Card>

                {/* Tips Section */}
                <Card
                    style={{
                        marginTop: 34,
                        borderRadius: 16,
                        background: "linear-gradient(135deg, rgb(247 245 250) 0%, rgb(207 191 255) 100%)",
                        border: "none"
                    }}
                >
                    <Row gutter={[24, 0]} align="middle">
                        <Col xs={24} md={16}>
                            <Title level={4} style={{ margin: 0, color: "#2c3e50" }}>
                                💡 Pro Tips for Better Engagement
                            </Title>
                            <Text type="secondary" style={{ fontSize: 14 }}>
                                • Use high-quality images • Be clear about deadlines • Highlight key benefits •
                                Specify required skills • Include contact information
                            </Text>
                        </Col>
                        <Col xs={24} md={8} style={{ textAlign: "right" }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                Need help? Contact support
                            </Text>
                        </Col>
                    </Row>
                </Card>
            </div>
            <Footer />
        </>

    );
}
