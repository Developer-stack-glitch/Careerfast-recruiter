'use client';
import { getImageUrl } from "../utils/getImageUrl";
import { compressImage } from "../utils/imageCompressor";
import React, { StrictMode, useEffect, useRef, useState } from "react";
import {
  Row,
  Col,
  Button,
  Modal,
  Typography,
  Form,
  Input,
  Select,
  Switch,
  InputNumber,
  Space,
  Tag,
  Divider,
  Card,
  message,
  Drawer,
  Checkbox,
  Upload,
  Alert,
} from "antd";
import {
  LineChartOutlined,
  MedicineBoxOutlined,
  CarOutlined,
  CoffeeOutlined,
  UploadOutlined,
  DeleteOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { HiMiniComputerDesktop } from "react-icons/hi2";
import { IoMdAdd } from "react-icons/io";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { MdOutlineEventNote } from "react-icons/md";
import { MdDeleteForever } from "react-icons/md";
import { TbContract } from "react-icons/tb";
import { PiOfficeChairLight } from "react-icons/pi";
import { FaPersonCircleExclamation } from "react-icons/fa6";
import { FaBusinessTime } from "react-icons/fa";
import { MdFileDownloadDone } from "react-icons/md";
import { LuLocateFixed } from "react-icons/lu";
import { RiEqualizerLine } from "react-icons/ri";
import { FaAngleUp } from "react-icons/fa";
import { FaAngleDown } from "react-icons/fa";
import { FaHeartCircleCheck } from "react-icons/fa6";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import CommonInputField from "../Common/CommonInputField";
import "../css/ProfileDetailsPage.css";
import CommonSelectField from "../Common/CommonSelectField";
import { nameValidator, selectValidator } from "../Common/Validation";
import { useNavigate } from "@/routing-shim";
import dummyLogo from "../images/dummy_img.jpg";
import {
  getBenifitsData,
  getDuration,
  getDurationTypes,
  getEligibilityData,
  getGenderData,
  getJobNature,
  getSalaryData,
  getWorkPlaceLocation,
  getWorkPlaceType,
  getYears,
  getSkillsData,
  getJobCategoryData,
  createJobPost
} from "../ApiService/action";
import Header from "../Header/Header";
import currencySymbol from "currency-symbols";
import currencyCodes from "currency-codes";
import Footer from "../Footer/Footer";
import cities from "cities-list";

const getCurrencySymbol = (code) => {
  try {
    const symbol = currencySymbol(code);
    return symbol && symbol !== 'undefined' ? symbol : code;
  } catch (e) {
    return code;
  }
};
const { Option } = Select;
const DEFAULT_CONTENT = `
  <p><strong>About the Opportunity:</strong></p>
  <ul>
    <li></li>
    <li></li>
  </ul>
  <p style="margin-top: 30px;"><strong>Responsibilities of the Candidate:</strong></p>
  <ul>
    <li></li>
    <li></li>
  </ul>
  <p><strong>Requirements:</strong></p>
  <ul>
    <li></li>
    <li></li>
  </ul>
`

export default function PostJobs() {
  const [jobNatureId, setJobNatureId] = useState(null);
  const [workTypeActiveButton, setWorkTypeActiveButton] = useState(null);
  const [workLocationActiveButton, setWorkLocationActiveButton] =
    useState(null);
  const { Text } = Typography;
  const [experienceRequiredActiveButton, setExperienceRequiredActiveButton] =
    useState(null);
  const [selectedFresherPass, setSelectedFresherPass] = useState([]);
  const [experienceRequired, setExperienceRequired] = useState("");
  const [salaryTypeActiveButton, setSalaryTypeActiveButton] = useState(null);
  const [diversityenabled, setDiversityEnabled] = useState(true);
  const [genderselected, setGenderSelected] = useState([]);
  const [showMore, setShowMore] = useState(false);
  const [selectedBenefits, setSelectedBenefits] = useState([]);
  //
  const [companyName, setCompanyName] = useState("");
  const [companyNameError, setCompanyNameError] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobTitleError, setJobTitleError] = useState("");
  const [jobNatureError, setJobNatureError] = useState("");
  const [jobNatureOptions, setJobNatureOptions] = useState([]);
  const [jobInternshipDuration, setJobInternshipDuration] = useState("");
  const [jobInternshipDurationError, setJobInternshipDurationError] =
    useState("");
  const [internshipDurationTypeData, setInternshipDurationTypeData] = useState(
    []
  );
  const [internShipDuration, setIntershipDuration] = useState([]);
  const [selectedDurationId, setSelectedDurationId] = useState(null);
  const [workplaceType, setWorkplaceType] = useState("");
  const [workplaceTypeError, setWorkplaceTypeError] = useState("");
  const [workplaceTypeData, setWorkplaceTypeData] = useState([]);
  const [workplaceLocation, setWorkplaceLocation] = useState([]);
  const [jobCategory, setJobCategory] = useState([]);
  const [jobCategoryError, setJobCategoryError] = useState("");
  const [jobCategoryOptions, setJobCategoryOptions] = useState([]);
  const [skillsRequired, setSkillsRequired] = useState([]);
  const [skillsRequiredError, setSkillsRequiredError] = useState("");
  const [skillsRequiredOptions, setSkillsRequiredOption] = useState([]);
  const [salaryDetails, setSalaryDetails] = useState("");
  const [salaryDetailsError, setSalaryDetailsError] = useState("");
  const [eligibility, setEligibility] = useState("");
  const [eligibilityError, setEligibilityError] = useState("");
  const [eligibilityData, setEligibilityData] = useState([]);
  const [eligibilityYear, setEligibilityYear] = useState("");
  const [eligibilityYearData, setEligibilityYearData] = useState([]);
  const [workLocation, setWorkLocation] = useState("");
  const [workLocationError, setWorkLocationError] = useState("");
  const [specificLocation, setSpecificLocation] = useState([]);
  // const [specificLocationName, setSpecificLocationName] = useState("");
  const [otherBenifits, setOtherBenifits] = useState([]);
  const [gender, setGender] = useState([]);
  const [salaryData, setSalaryData] = useState([]);
  // salary
  const [currency, setCurrency] = useState("INR");
  const [fixedSalary, setFixedSalary] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [jobOpenings, setJobOpenings] = useState("");
  const [jobOpeningsError, setJobOpeningsError] = useState("");
  const [workingDays, setWorkingDays] = useState("");
  const [workingDaysName, setWorkingDaysName] = useState("");
  const [workingDaysError, setWorkingDaysError] = useState("");
  const [salaryDuration, setSalaryDuration] = useState("Annual");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoDescriptionError, setSeoDescriptionError] = useState("");
  const MAX_LENGTH = 300000;
  const [value, setValue] = useState(DEFAULT_CONTENT);

  const [workLocationOption, setWorkLocationOption] = useState([]);
  const [openQuestionModal, setOpenQuestionModal] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [logoUrl, setLogoUrl] = useState(dummyLogo);
  const quillRef = useRef(null);
  // const [logoFile, setLogoFile] = useState(null);
  const [questions, setQuestions] = useState([
    {
      id: Date.now(),
      question: "",
      error: "",
      isrequired: false,
    },
  ]);

  useEffect(() => {
    loadCitiesAPI();
  }, []);

  const loadCitiesAPI = () => {
    const allCities = Object.keys(cities).map((city) => ({
      label: city,
      value: city,
      country: cities[city].country,
    }));

    setWorkLocationOption(allCities); // ✅ replace your previous city list
  };


  const navigate = useNavigate();
  const now = new Date();
  const fetchDateTime =
    now.toLocaleDateString("en-CA") +
    " " +
    now.toLocaleTimeString("en-GB", { hour12: false });

  const workingDaysOptions = [
    { value: "6 Working Days", label: "6 Working Days" },
    { value: "5 Working Days", label: "5 Working Days" },
  ];

  useEffect(() => {
    const stored = localStorage.getItem("loginDetails");
    const token = localStorage.getItem("AccessToken");
    if (!stored || !token) {
      navigate("/login");
      message.error("Please login to access this page.");
    } else {
      const details = JSON.parse(stored);
      if (details.role_id === 2) {
        navigate("/");
        message.error("Candidates are not allowed to post jobs.");
      }
    }
  }, [navigate]);

  useEffect(() => {
    document.title = "CareerFast | Post Jobs";
  }, []);

  useEffect(() => {
    if (jobNatureId === 3) {
      // Reset hidden fields when Scholarship is selected
      setWorkplaceType("");
      setWorkTypeActiveButton(null);
      setJobCategory([]);
      setSkillsRequired([]);
      setJobOpenings("");
      setWorkingDays("");
      setSalaryDetails("");
      setSalaryTypeActiveButton(null);
      setSelectedBenefits([]);
      setSalaryMin("");
      setSalaryMax("");
      setFixedSalary("");
    }
  }, [jobNatureId]);


  useEffect(() => {
    getJobNatureData();
  }, []);


  const getJobNatureData = async () => {
    try {
      const response = await getJobNature();
      console.log(response);
      setJobNatureOptions(response?.data?.data || []);
    } catch (error) {
      console.log("job nature error", error);
    } finally {
      setTimeout(() => {
        getWorkPlaceTypeData();
      }, 300);
    }
  };

  const getWorkPlaceTypeData = async () => {
    try {
      const response = await getWorkPlaceType();
      setWorkplaceTypeData(response?.data?.data || []);
      console.log("workplace type", response);
    } catch (error) {
      console.log("workplace type", error);
    } finally {
      getBenifitsDataType();
    }
  };

  const getBenifitsDataType = async () => {
    try {
      const response = await getBenifitsData();
      setOtherBenifits(response?.data?.data || []);
      console.log("Benifits data", response);
    } catch (error) {
      console.log("Benifits data", error);
    } finally {
      getGenderDataType();
    }
  };

  const getGenderDataType = async () => {
    try {
      const response = await getGenderData();
      setGender(response?.data?.data || []);
      console.log("gender", response);
    } catch (error) {
      console.log("gender error", error);
    } finally {
      setTimeout(() => {
        getEligibilityDataTypes();
      }, 300);
    }
  };

  const getEligibilityDataTypes = async () => {
    try {
      const response = await getEligibilityData();
      setEligibilityData(response?.data?.data || []);
      console.log("Eligibility data", response);
    } catch (error) {
      console.log("Eligibility data error", error);
    } finally {
      setTimeout(() => {
        getSalaryDataType();
      }, 300);
    }
  };

  const getSalaryDataType = async () => {
    try {
      const response = await getSalaryData();
      setSalaryData(response?.data?.data || []);
      console.log("Salary data", response);
    } catch (error) {
      console.log("Salary data error", error);
    } finally {
      setTimeout(() => {
        getYearsData();
      }, 300);
    }
  };

  const getYearsData = async () => {
    try {
      const response = await getYears();
      setEligibilityYearData(response?.data?.data || []);
      console.log("years", response);
    } catch (error) {
      console.log("years error", error);
    } finally {
      setTimeout(() => {
        getSkillsDataType();
      }, 300);
    }
  };

  const getSkillsDataType = async () => {
    try {
      const response = await getSkillsData();
      const formattedOptions =
        response?.data?.data?.map((skill) => ({
          label: skill.name,
          value: skill.name,
        })) || [];
      setSkillsRequiredOption(formattedOptions);
    } catch (error) {
      console.log("skills error", error);
    } finally {
      setTimeout(() => {
        getJobCategoryDataTypes();
      }, 300);
    }
  };

  const getJobCategoryDataTypes = async () => {
    try {
      const response = await getJobCategoryData();
      const jobCategoryFormatted =
        response?.data?.data?.map((jobCategory) => ({
          label: jobCategory.category_name,
          value: jobCategory.category_name,
        })) || [];
      setJobCategoryOptions(jobCategoryFormatted);
      console.log("Job Category", response);
    } catch (error) {
      console.log("job cattt error", error);
    }
  };

  //onclick functions
  const getDurationTypesData = async () => {
    try {
      const response = await getDurationTypes();
      setInternshipDurationTypeData(response?.data?.data || []);
      console.log("Duration type", response);
    } catch (error) {
      console.log("duration type", error);
    } finally {
      setTimeout(() => { }, 300);
    }
  };

  const getWorkPlaceLocationData = async () => {
    try {
      const response = await getWorkPlaceLocation();
      setWorkplaceLocation(response?.data?.data || []);
      console.log("workplace location", response);
    } catch (error) {
      console.log("workplace location", error);
    }
  };

  const getDurationData = async (durationId) => {
    const payload = {
      duration_type_id: durationId,
    };
    try {
      const response = await getDuration(payload);
      setIntershipDuration(response?.data?.data || []);
      console.log("duration typesss", response);
    } catch (error) {
      console.log("duration errorss", error);
    }
  };

  const toggleBenefitSelection = (key) => {
    setSelectedBenefits((prevSelected) =>
      prevSelected.includes(key)
        ? prevSelected.filter((item) => item !== key)
        : [...prevSelected, key]
    );
  };

  const handleTagClick = (id) => {
    setGenderSelected((prevSelected) => {
      if (prevSelected.includes(id)) {
        return prevSelected.filter((gid) => gid !== id); // remove if already selected
      } else {
        return [...prevSelected, id]; // add if not selected
      }
    });
  };

  const visibleBenefits = showMore ? otherBenifits : otherBenifits.slice(0, 4);

  const handleChange = (content, delta, source, editor) => {
    const textLength = editor.getText().trim().length;

    if (textLength > MAX_LENGTH) return;

    setValue(content);
  };


  const generateWithAI = () => {
    // Replace this with actual AI call
    const aiContent = `
      <p><strong>About the Opportunity:</strong></p>
      <ul><li>Work in a dynamic, collaborative team environment</li><li>Opportunity to influence product roadmap</li></ul>
      <p><strong>Responsibilities of the Candidate:</strong></p>
      <ul><li>Lead feature development and deployment</li><li>Collaborate cross-functionally with designers and PMs</li></ul>
      <p><strong>Requirements:</strong></p>
      <ul><li>3+ years of React development experience</li><li>Good understanding of RESTful APIs and UI/UX principles</li></ul>
    `;
    setValue(aiContent);
  };

  const handleCheckValidation = async (e) => {
    e.preventDefault();
    // setIsLoading(true);

    const companyNameValidate = nameValidator(companyName);
    const jobTitleValidate = nameValidator(jobTitle);
    const jobNatureValidate = selectValidator(jobNatureId);
    const workplaceTypeValidate =
      jobNatureId === 3 ? "" : selectValidator(workplaceType);
    const jobCategoryValidate =
      jobNatureId === 3 ? "" : selectValidator(jobCategory);
    const skillsRequiredValidate =
      jobNatureId === 3 ? "" : selectValidator(skillsRequired);
    const salaryDetailsValidate =
      jobNatureId === 3 ? "" : selectValidator(salaryDetails);
    const jobInternshipDurationValidate =
      jobNatureId === "Internship"
        ? selectValidator(jobInternshipDuration)
        : "";
    const eligibilityValidate = selectValidator(eligibility);
    const workLocationValidate = selectValidator(workLocation);
    const jobOpeningsValidate =
      jobNatureId === 3 ? "" : selectValidator(jobOpenings);
    const workingDaysValidate =
      jobNatureId === 3 ? "" : selectValidator(workingDays);
    const seoDescriptionValidate = nameValidator(seoDescription);

    // Set all error states
    setCompanyNameError(companyNameValidate);
    setJobTitleError(jobTitleValidate);
    setJobNatureError(jobNatureValidate);
    setWorkplaceTypeError(workplaceTypeValidate);
    setJobCategoryError(jobCategoryValidate);
    setSkillsRequiredError(skillsRequiredValidate);
    setSalaryDetailsError(salaryDetailsValidate);
    setJobInternshipDurationError(jobInternshipDurationValidate);
    setEligibilityError(eligibilityValidate);
    setWorkLocationError(workLocationValidate);
    setJobOpeningsError(jobOpeningsValidate);
    setWorkingDaysError(workingDaysValidate);
    setSeoDescriptionError(seoDescriptionValidate);

    // Validation check
    const hasPostJobError = [
      companyNameValidate,
      jobTitleValidate,
      jobNatureValidate,
      workplaceTypeValidate,
      jobCategoryValidate,
      skillsRequiredValidate,
      salaryDetailsValidate,
      ...(jobNatureId === "Internship" ? [jobInternshipDurationValidate] : []),
      eligibilityValidate,
      jobOpeningsValidate,
      workingDaysValidate,
      seoDescriptionValidate,
    ].some((val) => val !== "");

    if (hasPostJobError) {
      console.log("error publish the post");
      message.error("Please fill all fields correctly before proceeding.");
      setOpenQuestionModal(false);
      return;
    } else {
      setOpenQuestionModal(true);
    }

    if (salaryDetails === 2) {
      if (!salaryMin || !salaryMax) {
        message.error("Please enter both minimum and maximum salary.");
        return;
      }

      if (Number(salaryMax) <= Number(salaryMin)) {
        message.error("Maximum salary must be greater than minimum salary.");
        return;
      }
    }
  };

  const handleOk = () => {
    setConfirmLoading(true);
    setTimeout(() => {
      setOpenQuestionModal(false);
      setConfirmLoading(false);
      setOpenDrawer(true);
    }, 2000);
  };

  const onClose = () => {
    setOpenQuestionModal(false);
    setOpenDrawer(false);
  };

  const handleAddQuestions = () => {
    setQuestions([
      ...questions,
      {
        id: Date.now(),
        question: "",
        isrequired: false,
        error: "",
      },
    ]);
  };

  const handleQuestionChange = (index, fieldName, value) => {
    const updated = [...questions];
    updated[index][fieldName] = value;

    if (fieldName === "question" && value.trim() !== "") {
      updated[index].error = "";
    }

    setQuestions(updated);
  };

  const handleRemoveQuestion = (id) => {
    if (questions.length === 1) return;
    setQuestions((prevQuestions) => prevQuestions.filter((q) => q.id !== id));
  };

  const generatePayload = () => {
    const getUserDetails =
      typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("loginDetails") || "{}")
        : {};

    const getDurationName = internShipDuration.find(
      (f) => f.id === selectedDurationId
    );

    const allBenefitsData = otherBenifits
      .filter((b) => selectedBenefits.includes(b.id))
      .map((b) => b.name);

    const allDiversity = gender
      .filter((d) => genderselected.includes(d.id))
      .map((d) => d.name);

    console.log(allDiversity);

    return {
      user_id: getUserDetails.id,
      company_name: companyName,
      company_logo: logoUrl,
      job_title: jobTitle,
      job_nature:
        jobNatureId === 1
          ? "Job"
          : jobNatureId === 2
            ? "Internship"
            : jobNatureId === 3
              ? "Scholarship"
              : "",
      duration_period:
        jobNatureId === 1
          ? "Permanent"
          : jobNatureId === 2
            ? getDurationName.duration
            : jobNatureId === 3
              ? "Scholarship"
              : "",
      workplace_type:
        workplaceType === 1
          ? "In Office"
          : workplaceType === 2
            ? "Work From Home"
            : workplaceType === 3
              ? "On Field"
              : "",
      work_location:
        workLocation === 1
          ? specificLocation
          : workLocation === 2
            ? "Pan India"
            : "",
      job_category: jobCategory,
      skills: skillsRequired,
      experience_type:
        eligibility === 1 ? "Fresher" : eligibility === 2 ? "Experienced" : eligibility === 3 ? "College Students" : "",
      experience_required:
        eligibility === 1
          ? selectedFresherPass
          : eligibility === 2
            ? experienceRequired
            : "",
      salary_type:
        salaryDetails === 1 ? "Fixed" : salaryDetails === 2 ? "Range" : "",
      currency: currency,
      min_salary: salaryDetails === 1 ? fixedSalary : salaryMin,
      max_salary: salaryDetails === 2 ? salaryMax : null,
      salary_duration: salaryDuration,
      diversity_hiring: allDiversity,
      benefits: allBenefitsData,
      created_at: fetchDateTime,
      openings: jobOpenings,
      working_days: workingDaysName,
      job_description: value,
      seo_description: seoDescription,
    };
  };

  const validateQuestions = () => {
    const updated = questions.map((q) => {
      if (!q.question.trim()) {
        return { ...q, error: "This question is invalid." };
      }
      return { ...q, error: "" };
    });

    setQuestions(updated);
    return updated.every((q) => !q.error);
  };


  // Publish job post
  const publish = async (payload) => {
    try {
      setIsLoading(true); // start loader immediately
      console.log("📤 Sending job post payload:", payload);
      const response = await createJobPost(payload);
      message.success("Posted Successfully.");
      navigate("/");
    } catch (error) {
      console.error("❌ Error posting job:", error);

      const errorMessage = error.response?.data?.details ||
        error.response?.data?.message ||
        error.message ||
        "Failed to post job. Please try again.";

      message.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };


  // Publish with questions
  const handlePublishPostWithQuestions = async () => {
    const isValid = validateQuestions();
    if (!isValid) {
      message.error("Please fix all question errors before publishing.");
      return;
    }

    const payload = {
      ...generatePayload(),
      questions: questions,
    };

    await publish(payload);
  };

  // Publish without questions
  const handlePublishPostWithoutQuestions = async () => {
    const payload = {
      ...generatePayload(),
      questions: [],
    };
    console.log("job posted", payload);

    await publish(payload);
  };

  const handleFresherPassClick = (item) => {
    const allYears = eligibilityYearData
      .filter((i) => i.year !== "All")
      .map((i) => i.year);

    if (item.year === "All") {
      if (selectedFresherPass.length === allYears.length) {
        setSelectedFresherPass([]);
      } else {
        setSelectedFresherPass(allYears);
      }
    } else {
      if (selectedFresherPass.includes(item.year)) {
        setSelectedFresherPass((prev) =>
          prev.filter((year) => year !== item.year)
        );
      } else {
        setSelectedFresherPass((prev) => [...prev, item.year]);
      }
    }
  };

  return (
    <>
      <Header />
      <div className="container">
        <section className="post_jobs_section">
          <Row>
            <Col lg={13} md={13} sm={24} xs={24}>
              <div style={{ textAlign: "left" }}>
                <h3 style={{ fontSize: 20 }}>{jobNatureId === 3 ? "Post New Scholarship" : "Post New Job"}</h3>
              </div>
              <Form layout="vertical">

                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginBottom: 40,
                    position: "relative",
                  }}
                >
                  <div
                    className="logo-upload-container"
                    style={{
                      textAlign: "center",
                      position: "relative",
                      transition: "all 0.3s ease",
                    }}
                  >
                    <div
                      style={{
                        width: 110,
                        height: 110,
                        margin: "0 auto",
                        borderRadius: 80,
                        border: "1px dashed #d9d9d9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                        position: "relative",
                        background: logoUrl ? "transparent" : "#fafafa",
                        transition:
                          "all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1)",
                      }}
                    >
                      {logoUrl ? (
                        <img
                          src={getImageUrl(logoUrl)}
                          alt="Company Logo"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            transition: "transform 0.3s ease",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.transform = "scale(1.05)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.transform = "scale(1)")
                          }
                        />
                      ) : (
                        <div
                          style={{
                            color: "#8c8c8c",
                            fontSize: 14,
                            padding: 20,
                          }}
                        >
                          <UploadOutlined
                            style={{ fontSize: 24, marginBottom: 8 }}
                          />
                          <div>Company Logo</div>
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        marginTop: 20,
                        display: "flex",
                        justifyContent: "center",
                        gap: 12,
                      }}
                    >
                      <Upload
                        showUploadList={false}
                        beforeUpload={async (file) => {
                          const isImage = file.type.startsWith("image/");
                          if (!isImage) {
                            message.error("Only image files are allowed");
                            return false;
                          }
                          try {
                            const compressedBase64 = await compressImage(file, 200);
                            setLogoUrl(compressedBase64);
                          } catch (err) {
                            console.error("Logo compression error:", err);
                            message.error("Error compressing logo. Please try again.");
                          }
                          return false;
                        }}
                      >
                        <Button
                          type={logoUrl ? "default" : "primary"}
                          icon={<UploadOutlined />}
                          className="uploadNew_profile"
                          shape="round"
                          style={{
                            minWidth: 140,
                            height: 36,
                            fontWeight: 500,
                            letterSpacing: 0.2,
                            boxShadow: logoUrl
                              ? "none"
                              : "0 2px 8px rgba(0, 85, 255, 0.2)",
                          }}
                        >
                          {logoUrl ? "Change Logo" : "Upload Logo"}
                        </Button>
                      </Upload>

                      {logoUrl && (
                        <Button
                          danger
                          type="text"
                          icon={<DeleteOutlined />}
                          shape="round"
                          style={{
                            height: 36,
                            fontWeight: 500,
                            letterSpacing: 0.2,
                          }}
                          onClick={() => {
                            setLogoUrl(null);
                            // setLogoFile(null);
                          }}
                        >
                          Remove
                        </Button>
                      )}
                    </div>

                    {logoUrl && (
                      <>
                        <div
                          style={{
                            position: "absolute",
                            top: -10,
                            right: -10,
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            background: "rgb(0 179 5)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontSize: 12,
                            boxShadow: "0 2px 8px rgba(24, 144, 255, 0.3)",
                          }}
                        >
                          <CheckOutlined />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: 15, marginBottom: 15 }} className="form-group">
                  <Form.Item
                    layout="vertical"
                    label={<span style={{ fontWeight: 500 }}>Post Nature </span>}
                    name="jobnature"
                  >
                    <div>
                      <div style={{ marginBottom: 0 }} className="job_nature">
                        {jobNatureOptions.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className={jobNatureId === item.id ? "job_nature_button_active" : "job_nature_button"}
                            onClick={() => {
                              if (item.id === jobNatureId) return;
                              setJobNatureId(item.id);
                              setJobNatureError("");
                              if (item.id === 2) getDurationTypesData();
                              else setInternshipDurationTypeData([]);
                            }}
                          >
                            {item.id === 1 ? <HiMiniComputerDesktop /> : item.id === 2 ? <MdOutlineEventNote /> : <TbContract />}{" "}
                            {item.name}
                          </button>
                        ))}
                      </div>
                      {jobNatureError && (
                        <div style={{ color: "red", marginTop: 6, fontSize: 13 }}>
                          {jobNatureError}
                        </div>
                      )}
                    </div>
                  </Form.Item>
                </div>
                {/*  */}

                <div style={{ margin: "18px 0px" }}>
                  <CommonInputField
                    name={"Company name"}
                    label={jobNatureId === 3 ? ("Scholarship Providing Organization") : (
                      "Hiring Company"
                    )}
                    mandatory={true}
                    placeholder={"Enter your company name"}
                    type={"text"}
                    value={companyName}
                    onChange={(e) => {
                      setCompanyName(e.target.value);
                      setCompanyNameError(nameValidator(e.target.value));
                    }}
                    error={companyNameError}
                  />
                </div>


                <div style={{ margin: "18px 0px" }} className="form-group">
                  <CommonInputField
                    name={"Job title"}
                    label={jobNatureId === 3 ? ("Scholarship Name") : (
                      "Job Title / Role"
                    )}
                    mandatory={true}
                    placeholder={"Enter your job title"}
                    type={"text"}
                    value={jobTitle}
                    onChange={(e) => {
                      setJobTitle(e.target.value);
                      setJobTitleError(nameValidator(e.target.value));
                    }}
                    error={jobTitleError}
                  />
                </div>

                <div style={{ marginBottom: 18 }} className="form-group">
                  <CommonInputField
                    name={"Job description"}
                    label={"Job Description"}
                    mandatory={true}
                    placeholder={"Enter job description for SEO purpose"}
                    type={"textarea"}
                    value={seoDescription}
                    onChange={(e) => {
                      setSeoDescription(e.target.value);
                      setSeoDescriptionError(nameValidator(e.target.value));
                    }}
                    error={seoDescriptionError}
                  />
                </div>
                {jobNatureId === 2 && (
                  <div style={{ marginTop: 15, marginBottom: 0 }} className="form-group">
                    <Form.Item
                      layout="vertical"
                      label={
                        <span style={{ fontWeight: 500 }}>
                          Internships Duration
                        </span>
                      }
                      name="internship_duration"
                    >
                      <div>
                        <div className="job_nature">
                          {internshipDurationTypeData.map((item) => {
                            return (
                              <button
                                key={item.id}
                                type="button"
                                className={
                                  jobInternshipDuration === item.id
                                    ? "internship_duration_button_active"
                                    : "internship_duration_button"
                                }
                                onClick={() => {
                                  getDurationData(item.id);
                                  setJobInternshipDuration(item.id);
                                  setJobInternshipDurationError("");
                                }}
                              >
                                {item.name === "In Weeks" ? (
                                  <HiMiniComputerDesktop />
                                ) : (
                                  <HiMiniComputerDesktop />
                                )}{" "}
                                {item.name}
                              </button>
                            );
                          })}
                        </div>
                        {jobInternshipDurationError && (
                          <div
                            className="error-message"
                            style={{ color: "red", marginTop: "8px" }}
                          >
                            {"Internship" + jobInternshipDurationError}
                          </div>
                        )}
                      </div>
                    </Form.Item>
                  </div>
                )}
                {jobNatureId === 2 && (
                  <div style={{ marginTop: 15 }} className="form-group">

                    <div className="job_nature">
                      {internShipDuration.map((item) => {
                        return (
                          <button
                            type="button"
                            key={item.id}
                            className={
                              selectedDurationId === item.id
                                ? "weeks_button_active"
                                : "weeks_button"
                            }
                            onClick={() => {
                              // setWeeksActiveButton(item.id);
                              setSelectedDurationId(item.id);
                            }}
                          >
                            {item.duration}
                          </button>
                        );
                      })}
                    </div>

                  </div>
                )}
                {jobNatureId !== 3 && (
                  <div style={{ marginTop: 0 }} className="form-group">
                    <div className="job_nature">
                      <Form.Item
                        layout="vertical"
                        name={"workplaceType"}
                        label={<span style={{ fontWeight: 500 }}>Workplace Type</span>}
                        style={{ marginBottom: "0px" }}
                      >
                        <div>
                          <div className="work_type">
                            {workplaceTypeData.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                className={
                                  workTypeActiveButton === item.id
                                    ? "work_type_button_active"
                                    : "work_type_button"
                                }
                                onClick={() => {
                                  if (item.id === 3 || item.id === 1) getWorkPlaceLocationData();
                                  else setWorkplaceLocation([]);
                                  setWorkTypeActiveButton(item.id);
                                  setWorkplaceType(item.id);
                                  setWorkplaceTypeError("");
                                }}
                              >
                                <PiOfficeChairLight /> {item.name}
                              </button>
                            ))}
                          </div>
                          {workplaceTypeError && (
                            <div
                              className="error-message"
                              style={{ color: "red", marginTop: "8px", fontSize: 13 }}
                            >
                              {workplaceTypeError}
                            </div>
                          )}
                        </div>
                      </Form.Item>
                    </div>
                  </div>
                )}


                <div style={{ marginTop: 15 }} className="form-group">
                  {workTypeActiveButton === 3 || workTypeActiveButton === 1 ? (
                    <Form.Item
                      layout="vertical"
                      label={
                        <span style={{ fontWeight: 500 }}>Work Location</span>
                      }
                      name="worklocation"
                    >
                      <div>
                        <div className="job_nature">
                          {workplaceLocation.map((item) => {
                            return (
                              <button
                                key={item.id}
                                type="button"
                                className={
                                  workLocationActiveButton === item.id
                                    ? "work_location_button_active"
                                    : "work_location_button"
                                }
                                onClick={() => {
                                  setWorkLocationActiveButton(item.id);
                                  setWorkLocation(item.id);
                                  setWorkLocationError("");
                                }}
                              >
                                <PiOfficeChairLight /> {item.name}
                              </button>
                            );
                          })}
                        </div>
                        {workLocationError && (
                          <div
                            className="error-message"
                            style={{ color: "red", marginTop: "8px" }}
                          >
                            {"Work location" + workLocationError}
                          </div>
                        )}

                        {workLocationActiveButton === 1 ? (
                          <>
                            <p style={{ fontSize: 15, marginTop: "20px", marginBottom: "15px", fontWeight: 500, color: "#333", marginBottom: 5 }}><span style={{ color: "red" }}>*</span> Select Location</p>
                            <Select
                              mode="multiple"
                              className="ant-select ant-select-in-form-item premium-input main_select"
                              style={{ width: "100%" }}
                              showSearch={true}
                              placeholder={"Select multiple locations"}
                              value={specificLocation}
                              onChange={(value) => {
                                setSpecificLocation(value);
                              }}
                              options={workLocationOption}
                              filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                              }
                            />
                          </>
                        ) : null}
                      </div>
                    </Form.Item>
                  ) : null}
                </div>
                {/*  */}

                {/* Job category */}

                <div style={{ marginTop: 18, marginBottom: 7 }} className="form-group">
                  <p style={{ fontSize: 15, fontWeight: 500, color: "#333", marginBottom: 5 }}><span style={{ color: "red" }}>*</span> Select Category</p>
                  <Select
                    mode="tags"
                    className="ant-select ant-select-in-form-item premium-input main_select"
                    showSearch
                    placeholder="Select or add multiple categories"
                    value={jobCategory}
                    style={{ width: "100%", marginBottom: 15 }}
                    options={jobCategoryOptions}
                    onChange={(value) => {
                      setJobCategory(value);
                      // Add new custom categories to options visually
                      const newCategories = value.filter(
                        (v) => !jobCategoryOptions.some((opt) => opt.value === v)
                      );
                      if (newCategories.length > 0) {
                        const newOptions = newCategories.map((cat) => ({
                          label: cat,
                          value: cat,
                        }));
                        setJobCategoryOptions((prev) => [...prev, ...newOptions]);
                      }

                      if (setJobCategoryError) {
                        setJobCategoryError(value.length > 0 ? "" : "Please select category");
                      }
                    }}
                  />

                  {jobNatureId !== 3 && (
                    <>
                      <p style={{ fontSize: 15, fontWeight: 500, color: "#333", marginBottom: 5 }}><span style={{ color: "red" }}>*</span> Skills Required</p>
                      <Select
                        className="ant-select ant-select-in-form-item premium-input main_select"
                        mode="tags"
                        showSearch
                        value={skillsRequired}
                        placeholder="Select or add skills"
                        style={{ width: "100%", marginBottom: 10 }}
                        options={skillsRequiredOptions}
                        onChange={(value) => {
                          setSkillsRequired(value);
                          const newOnes = value.filter(
                            (v) => !skillsRequiredOptions.some((opt) => opt.value === v)
                          );
                          if (newOnes.length > 0) {
                            const newOptions = newOnes.map((item) => ({
                              label: item,
                              value: item
                            }));
                            setSkillsRequiredOption((prev) => [...prev, ...newOptions]);
                          }
                          setSkillsRequiredError(selectValidator(value));
                        }}
                      />
                    </>
                  )}
                </div>


                {/* Openings */}
                {jobNatureId !== 3 && (
                  <div style={{ marginTop: 18, marginBottom: 18 }} className="form-group">
                    <CommonInputField
                      name={"Job Openings"}
                      label="Job Openings"
                      mandatory={true}
                      placeholder={"No.of openings"}
                      type={"text"}
                      value={jobOpenings}
                      onChange={(e) => {
                        setJobOpenings(e.target.value);
                        setJobOpeningsError(selectValidator(e.target.value));
                      }}
                      error={jobOpeningsError}
                    />
                  </div>
                )}

                {/* working days */}
                {jobNatureId !== 3 && (
                  <div style={{ marginTop: 18, marginBottom: 18 }} className="form-group">
                    <CommonSelectField
                      label={"Working Days"}
                      showSearch={true}
                      value={workingDays}
                      mandatory={true}
                      name={"working_days"}
                      placeholder={"Choose working days"}
                      options={workingDaysOptions}
                      onChange={(value) => {
                        setWorkingDays(value);
                        setWorkingDaysName(value);
                        setWorkingDaysError(selectValidator(value));
                      }}
                      error={workingDaysError}
                    />
                  </div>
                )}

                <div className="eligibility">
                  <h4>{jobNatureId === 3 ? ("Scholarship Eligibility") : "Eligibility"}</h4>
                  <p>
                    Add the eligibility criteria to better filter the candidates.
                  </p>

                  <div className="experience_required">
                    <p>
                      <span style={{ color: "red" }}>*</span> Experience Required
                      (In Years)
                    </p>
                    <div className="job_nature">
                      {eligibilityData.map((item) => {
                        return (
                          <button
                            key={item.id}
                            type="button"
                            className={
                              experienceRequiredActiveButton === item.id
                                ? "experience_required_button_active"
                                : "experience_required_button"
                            }
                            onClick={() => {
                              setExperienceRequiredActiveButton(item.id);
                              setEligibility(item.id);
                              setEligibilityError("");
                            }}
                          >
                            <FaPersonCircleExclamation /> {item.name}
                          </button>
                        );
                      })}
                    </div>
                    {eligibilityError && (
                      <div
                        className="error-message"
                        style={{ color: "red", marginTop: "8px", fontSize: 13 }}
                      >
                        {eligibilityError}
                      </div>
                    )}
                  </div>

                  <div className="experience_required">
                    {experienceRequiredActiveButton === 1 ? (
                      <>
                        <p>Experience Required (In Years)</p>
                        <div className="job_nature">
                          {eligibilityYearData.map((item) => {
                            const isSelected =
                              item.year === "All"
                                ? selectedFresherPass.length ===
                                eligibilityYearData.filter(
                                  (i) => i.year !== "All"
                                ).length
                                : selectedFresherPass.includes(item.year);

                            return (
                              <button
                                key={item.id}
                                className={
                                  isSelected
                                    ? "fresher_pass_button_active"
                                    : "fresher_pass_button"
                                }
                                onClick={() => {
                                  handleFresherPassClick(item);
                                  setEligibilityYear(item.id);
                                }}
                              >
                                {item.year === "All" ? (
                                  <MdFileDownloadDone />
                                ) : (
                                  <FaBusinessTime />
                                )}{" "}
                                {item.year}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    ) : null}

                    {experienceRequiredActiveButton === 2 ? (
                      <>
                        <div className="">
                          <CommonInputField
                            name={"Experience"}
                            label="Experience required"
                            onChange={(e) => {
                              setExperienceRequired(e.target.value);
                            }}
                            mandatory={false}
                            placeholder={"Enter your Experience"}
                            type={"text"}
                          />
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>

                {jobNatureId !== 3 && (
                  <div className="salary_details">
                    <h4>Salary Details</h4>
                    <p>
                      Add compensation details to filter better candidates and speed
                      up the sourcing process.
                    </p>
                    <Form.Item
                      layout="vertical"
                      label={
                        <h5>
                          <span style={{ color: "red" }}>*</span> Salary Type{" "}
                        </h5>
                      }
                      name="salarytype"
                    >
                      <div>
                        <Alert
                          className="alert_message"
                          banner
                          message={`Enter ${salaryDuration} Salary`}
                        />
                        <div style={{ marginTop: 15, marginBottom: 15 }} className="salary_duration_toggle">
                          <div className="job_nature">
                            {["Annual", "Monthly"].map((type) => (
                              <button
                                key={type}
                                type="button"
                                className={salaryDuration === type ? "job_nature_button_active" : "job_nature_button"}
                                onClick={() => setSalaryDuration(type)}
                              >
                                {type} Salary
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="job_nature">
                          {salaryData.map((item) => {
                            return (
                              <button
                                key={item.id}
                                className={
                                  salaryTypeActiveButton === item.id
                                    ? "experience_required_button_active"
                                    : "experience_required_button"
                                }
                                onClick={() => {
                                  setSalaryTypeActiveButton(item.id);
                                  setSalaryDetails(item.id);
                                  setSalaryDetailsError(selectValidator(item.name));
                                }}
                              >
                                {item.id === 1 ? (
                                  <LuLocateFixed />
                                ) : item.id === 2 ? (
                                  <RiEqualizerLine />
                                ) : (
                                  <TbContract />
                                )}{" "}
                                {item.name}
                              </button>
                            );
                          })}
                        </div>
                        {salaryDetailsError && (
                          <div
                            className="error-message"
                            style={{ color: "red", marginTop: "8px", fontSize: 13 }}
                          >
                            {salaryDetailsError}
                          </div>
                        )}
                      </div>
                    </Form.Item>

                    {salaryTypeActiveButton === 1 && (
                      <div className="salary_details_inner">
                        <h5>Salary Figure</h5>
                        <p>
                          The salary on the job page will be shown in {salaryDuration.toLowerCase()} only.
                        </p>
                        <div className="job_nature">
                          <Select
                            showSearch
                            virtual={false}
                            value={currency}
                            onChange={(code) => setCurrency(code)}
                            optionLabelProp="label"
                            style={{ width: 150 }}
                          >
                            {currencyCodes.codes().map((code) => (
                              <Option key={code} value={code} label={`${getCurrencySymbol(code)} ${code}`}>
                                {`${getCurrencySymbol(code)} - ${code}`}
                              </Option>
                            ))}
                          </Select>
                          <Input
                            style={{ width: "60%" }}
                            value={fixedSalary}
                            onChange={(e) => setFixedSalary(e.target.value)}
                            placeholder="Enter amount"
                          />
                        </div>
                      </div>
                    )}

                    {salaryTypeActiveButton === 2 && (
                      <div className="salary_details_inner">
                        <h5>Salary Figure</h5>
                        <p>
                          The salary on the job page will be shown in {salaryDuration.toLowerCase()} only.
                        </p>
                        <div className="job_nature">
                          <Select
                            showSearch
                            virtual={false}
                            value={currency}
                            onChange={(code) => setCurrency(code)}
                            optionLabelProp="label"
                            style={{ width: 150 }}
                          >
                            {currencyCodes.codes().map((code) => (
                              <Option key={code} value={code} label={`${getCurrencySymbol(code)} ${code}`}>
                                {`${getCurrencySymbol(code)} - ${code}`}
                              </Option>
                            ))}
                          </Select>

                          <InputNumber
                            value={salaryMin}
                            onChange={(value) => setSalaryMin(value)}
                            placeholder="Min"
                            min={0}
                            style={{
                              width: "30%",
                              height: 45,
                              placeContent: "center",
                              textAlign: "center",
                            }}
                          />

                          <InputNumber
                            value={salaryMax}
                            onChange={(value) => setSalaryMax(value)}
                            placeholder="Max"
                            min={0}
                            style={{
                              width: "30%",
                              height: 45,
                              placeContent: "center",
                              textAlign: "center",
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div
                  className="diversity_options"
                  style={{
                    background: "#f8f9fa",
                    padding: 16,
                    borderRadius: 8,
                    border: "1px solid #e0e0e0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <Text strong>{jobNatureId === 3 ? ("Scholarship as per Diversity") : "Diversity Hiring"}</Text>
                    <Switch
                      checked={diversityenabled}
                      onChange={setDiversityEnabled}
                    />
                  </div>
                  <Divider style={{ margin: "8px 0px 15px 0" }} />
                  {diversityenabled && (
                    <Space wrap>
                      {gender.map((item) => (
                        <Tag.CheckableTag
                          key={item.id}
                          checked={genderselected.includes(item.id)}
                          onChange={() => handleTagClick(item.id)}
                          style={{
                            border: "1px dashed #ccc",
                            borderRadius: 8,
                            padding: "4px 12px",
                          }}
                        >
                          {item.name}
                        </Tag.CheckableTag>
                      ))}
                    </Space>
                  )}
                </div>

                {jobNatureId !== 3 && (
                  <div className="other_benifits">
                    <div className="job_nature">
                      <Text strong>Other Benefits</Text>
                      <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
                        {visibleBenefits.map((item) => (
                          <Col key={item.id}>
                            <Card
                              hoverable
                              onClick={() => {
                                toggleBenefitSelection(item.id);
                              }}
                              style={{
                                width: 140,
                                textAlign: "center",
                                border: selectedBenefits.includes(item.id)
                                  ? "2px dashed #6a00ff"
                                  : "1px dashed #ccc",
                                background: selectedBenefits.includes(item.id)
                                  ? "#6a00ff14"
                                  : "#fff",
                                borderRadius: 8,
                              }}
                            >
                              <div style={{ fontSize: 24, marginBottom: 4 }}>
                                {item.id === 1 ? (
                                  <LineChartOutlined />
                                ) : item.id === 2 ? (
                                  <MedicineBoxOutlined />
                                ) : item.id === 3 ? (
                                  <CarOutlined />
                                ) : item.id === 4 ? (
                                  <CoffeeOutlined />
                                ) : null}
                              </div>
                              <Text>{item.name}</Text>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                      <Button
                        type="link"
                        onClick={() => setShowMore(!showMore)}
                        style={{ marginTop: 12, color: "#6a00ff" }}
                      >
                        {showMore ? (
                          <>
                            View Less <FaAngleUp />
                          </>
                        ) : (
                          <>
                            View More <FaAngleDown />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                      marginTop: 28,
                    }}
                  >
                    <label style={{ fontWeight: "bold" }}>{jobNatureId === 3 ? ("Scholarship Description") : "Job Description"}</label>
                    <button
                      onClick={generateWithAI}
                      style={{
                        backgroundColor: "#6a00ff",
                        padding: "6px 12px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        color: "#fff",
                        border: "none",
                      }}
                    >
                      🧠 Generate with AI
                    </button>
                  </div>
                  <ReactQuill
                    value={value}
                    onChange={handleChange}
                    modules={{
                      toolbar: [
                        ["bold", "italic", "underline", "strike"],
                        [{ list: "ordered" }],
                        ["link", "image"],
                        ["clean"],
                      ],
                    }}
                    formats={[
                      "header",
                      "font",
                      "size",
                      "bold",
                      "italic",
                      "underline",
                      "strike",
                      "blockquote",
                      "list",
                      "indent",
                      "link",
                      "image",
                      "video",
                      "color",
                    ]}
                    style={{ height: "300px", marginBottom: "8px" }}
                  />
                  <div
                    style={{
                      textAlign: "right",
                      fontSize: 12,
                      color:
                        value.replace(/<[^>]+>/g, "").length >= MAX_LENGTH
                          ? "red"
                          : "gray",
                    }}
                  >
                    {value.replace(/<[^>]+>/g, "").length}/{MAX_LENGTH}
                  </div>
                </div>

                <div className="job_posting_submit">
                  <div style={{ justifyContent: "end" }} className="button-group">
                    <button
                      onClick={handleCheckValidation}
                      className="primary-btn"
                    >
                      <span>Save</span>
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M5 12H19M19 12L12 5M19 12L12 19"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>

                    <Modal
                      className="premium-question-modal"
                      open={openQuestionModal}
                      title={
                        <div className="premium-modal-header">
                          <div className="header-icon-container">
                            <QuestionCircleOutlined className="header-icon" />
                          </div>
                          <span className="header-title">
                            Want to add questions on your post
                          </span>
                        </div>
                      }
                      onOk={handleOk}
                      closable={false}
                      confirmLoading={confirmLoading}
                      onCancel={handlePublishPostWithoutQuestions}
                      okText="Yes, Add Questions"
                      cancelText="Publish Without Questions"
                      maskClosable={false}
                      width={560}
                      centered
                      footer={
                        <div className="premium-modal-footer">
                          <Button
                            key="publish"
                            onClick={handlePublishPostWithoutQuestions}
                            className="premium-cancel-btn"
                            size="large"
                            loading={isLoading} // ✅ Add loading here
                          >
                            {isLoading ? "Publishing..." : "Publish Without Questions"}
                          </Button>
                          <Button
                            key="add"
                            type="primary"
                            onClick={handleOk}
                            loading={confirmLoading}
                            className="premium-confirm-btn"
                            size="large"
                          >
                            {confirmLoading ? (
                              <>
                                <span className="btn-loading-text">Adding</span>
                                <span className="btn-loading-dots"></span>
                              </>
                            ) : (
                              "Yes, Add Questions"
                            )}
                          </Button>
                        </div>
                      }

                    >
                      <div className="premium-modal-content">
                        <p className="premium-modal-description">
                          Adding interactive questions can increase engagement by
                          up to 300%. Would you like to include some questions
                          with your post?
                        </p>
                      </div>
                    </Modal>

                    <Drawer
                      title="Question Manager"
                      closable={{ "aria-label": "Close Button" }}
                      onClose={onClose}
                      open={openDrawer}
                      width={600}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "24px",
                        }}
                      >
                        {questions.map((q, index) => (
                          <div
                            key={q.id}
                            style={{
                              position: "relative",
                              padding: "12px 20px 10px 20px",
                              borderRadius: "8px",
                              border: "1px solid #f0f0f0",
                              boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
                              transition: "all 0.3s ease",
                              background: "#fff",
                              ":hover": {
                                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                              },
                            }}
                          >
                            <CommonInputField
                              name={"question" + index}
                              label={`Question ${index + 1}`}
                              placeholder="e.g. What is your current location?"
                              type="text"
                              value={q.question}
                              onChange={(e) => {
                                handleQuestionChange(
                                  index,
                                  "question",
                                  e.target.value
                                );
                              }}
                              inputStyle={{
                                padding: "12px 16px",
                                borderRadius: "6px",
                                border: "1px solid #d9d9d9",
                              }}
                              labelStyle={{
                                fontWeight: 500,
                                marginBottom: "8px",
                                color: "#1d1d1d",
                              }}
                            />
                            {q.error && (
                              <div
                                style={{
                                  color: "#ff4d4f",
                                  marginTop: "6px",
                                  fontSize: "13px",
                                }}
                              >
                                {q.error}
                              </div>
                            )}

                            <Checkbox
                              style={{ marginTop: 10 }}
                              checked={q.isrequired}
                              onChange={(e) =>
                                handleQuestionChange(
                                  index,
                                  "isrequired",
                                  e.target.checked
                                )
                              }
                            >
                              Is Required
                            </Checkbox>

                            {index !== 0 && (
                              <Button
                                type="text"
                                danger
                                icon={
                                  <MdDeleteForever style={{ fontSize: "18px" }} />
                                }
                                onClick={() => handleRemoveQuestion(q.id)}
                                style={{
                                  position: "absolute",
                                  top: "16px",
                                  right: "16px",
                                  padding: "4px",
                                  color: "#ff4d4f",
                                  ":hover": {
                                    background: "#fff2f0",
                                  },
                                }}
                              />
                            )}
                          </div>
                        ))}

                        <Button
                          onClick={handleAddQuestions}
                          type="primary"
                          className=""
                          ghost
                          icon={<IoMdAdd style={{ fontSize: "18px" }} />}
                          style={{
                            alignSelf: "flex-end",
                            padding: "8px 16px",
                            height: "auto",
                            borderStyle: "dashed",
                            borderWidth: "1.5px",
                            borderRadius: "6px",
                            fontWeight: 500,
                            color: "#6a00ff",
                            borderColor: "#6a00ff",
                          }}
                        >
                          Add New Question
                        </Button>
                      </div>
                      <Button
                        onClick={handlePublishPostWithQuestions}
                        style={{
                          padding: "10px 15px",
                          backgroundColor: "#6900ad",
                          border: "none",
                          color: "#fff",
                          fontSize: 16,
                          display: "flex",
                          alignItems: "center",
                        }}
                        className="add_question"
                        loading={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <span className="btn-loading-text">Publishing</span>
                            <span className="btn-loading-dots"></span>
                          </>
                        ) : (
                          <>
                            <span>Publish</span>
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M5 12H19M19 12L12 5M19 12L12 19"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              ></path>
                            </svg>
                          </>
                        )}
                      </Button>
                    </Drawer>
                  </div>
                </div>
              </Form>
            </Col>
            <Col className="guideline_right" lg={11} md={11} sm={24} xs={24}>
              <div className="guidelines">
                <h5>Job Posting Best Practices</h5>
                <h3>Create an effective job posting</h3>
                <ul>
                  <li>
                    <FaHeartCircleCheck className="heart_icon" />
                    Use specific, industry-standard job titles to improve search
                    visibility.
                  </li>
                  <li>
                    <FaHeartCircleCheck className="heart_icon" />
                    Provide a clear and detailed job description with
                    responsibilities, requirements, and benefits.
                  </li>
                  <li>
                    <FaHeartCircleCheck className="heart_icon" />
                    Select the most accurate job category to reach the right
                    candidates.
                  </li>
                  <li>
                    <FaHeartCircleCheck className="heart_icon" />
                    Be transparent about salary ranges to attract qualified
                    applicants.
                  </li>
                </ul>
              </div>

              <div className="guidelines">
                <h5>Company Information</h5>
                <h3>Make your company stand out</h3>
                <ul>
                  <li>
                    <FaHeartCircleCheck className="heart_icon" />
                    Upload a high-quality company logo to increase recognition.
                  </li>
                  <li>
                    <FaHeartCircleCheck className="heart_icon" />
                    Clearly describe your company culture and values in the job
                    description.
                  </li>
                  <li>
                    <FaHeartCircleCheck className="heart_icon" />
                    Highlight unique benefits and perks your company offers.
                  </li>
                </ul>
              </div>

              <div className="guidelines">
                <h5>Application Process</h5>
                <h3>Streamline candidate selection</h3>
                <ul>
                  <li>
                    <FaHeartCircleCheck className="heart_icon" />
                    Set clear eligibility criteria to filter unsuitable
                    applicants.
                  </li>
                  <li>
                    <FaHeartCircleCheck className="heart_icon" />
                    Consider adding screening questions to identify top
                    candidates faster.
                  </li>
                  <li>
                    <FaHeartCircleCheck className="heart_icon" />
                    Specify the hiring timeline and next steps in the process.
                  </li>
                </ul>
              </div>

              <div className="guidelines">
                <h5>Legal Compliance</h5>
                <h3>Ensure your posting meets guidelines</h3>
                <ul>
                  <li>
                    <FaHeartCircleCheck className="heart_icon" />
                    Avoid discriminatory language related to age, gender,
                    religion, or ethnicity.
                  </li>
                  <li>
                    <FaHeartCircleCheck className="heart_icon" />
                    Clearly state whether the position is remote, hybrid, or
                    on-site.
                  </li>
                  <li>
                    <FaHeartCircleCheck className="heart_icon" />
                    Ensure salary information complies with local wage
                    transparency laws.
                  </li>
                </ul>
              </div>

              <div className="guidelines">
                <h5>Support</h5>
                <h3>Need assistance with your job posting?</h3>
                <ul>
                  <li>
                    <FaHeartCircleCheck className="heart_icon" />
                    Contact our support team at support@careerfast.com
                  </li>
                  <li>
                    <a style={{ color: "#6a00ff" }} href="/contact">
                      Get in touch with us here
                    </a>
                  </li>
                  <li>
                    <FaHeartCircleCheck className="heart_icon" />
                    Check our FAQ section for common questions about job
                    postings
                  </li>
                </ul>
              </div>
            </Col>
          </Row>
        </section>
      </div>
      <Footer />
    </>
  );
}
