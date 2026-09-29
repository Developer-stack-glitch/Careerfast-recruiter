'use client';
import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
    Select,
    Switch,
    InputNumber,
    AutoComplete,
    Checkbox,
    Dropdown,
    Modal,
    DatePicker,
    TimePicker,
    Upload
} from "antd";
import toast from "react-hot-toast";
import CommonLoader from "../Common/CommonLoader";
import {
    DeleteOutlined,
    PlusOutlined,
    MinusOutlined,
    CheckOutlined,
    CloseOutlined,
    EnvironmentOutlined,
    MoreOutlined,
    LeftOutlined,
    RightOutlined,
    EditOutlined,
    DownOutlined,
    CopyOutlined,
    InfoCircleOutlined,
    CloudUploadOutlined
} from "@ant-design/icons";
import {
    CircleDollarSign,
    ArrowLeft,
    AlertTriangle,
    Crown,
    ExternalLink,
    CheckCircle2
} from 'lucide-react';
import "react-quill-new/dist/quill.snow.css";
import { nameValidator } from "../Common/Validation";
import { useNavigate, useSearchParams } from "@/routing-shim";
import dummyLogo from "../images/dummy_img.jpg";
import currencySymbol from "currency-symbols";
import cities from "cities-list";
import { motion, AnimatePresence } from "framer-motion";
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
    createJobPost,
    getQualification,
    getSpecialization,
    getVenues,
    addVenue,
    getTeamMembers,
    addTeamMember,
    getMySubscription
} from "../ApiService/action";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

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
`;

const BASE_STEPS = [
    { id: 0, title: "Job details" },
    { id: 1, title: "Preferred candidate details" },
    { id: 2, title: "Job description" },
    { id: 3, title: "Screening questions" },
    { id: 4, title: "Advanced options" }
];

const ROOT_EDUCATION = [
    { id: 'Graduation Not Required', title: 'Graduation Not Required', showCheckbox: false, hasChildren: false },
    { id: 'Graduate', title: 'Graduate', showCheckbox: false, hasChildren: true },
    { id: 'Postgraduate', title: 'Postgraduate', showCheckbox: false, hasChildren: true },
    { id: 'Doctoral/Ph.D', title: 'Doctoral/Ph.D', showCheckbox: false, hasChildren: true }
];

const LEVEL2_EDUCATION = {
    'Doctoral/Ph.D': [
        { id: 'Any Doctorate', title: 'Any Doctorate', hasChildren: false },
        { id: 'Ph.D/Doctorate', title: 'Ph.D/Doctorate', hasChildren: true },
        { id: 'MPHIL', title: 'MPHIL', hasChildren: true },
        { id: 'DrNB', title: 'DrNB', hasChildren: true },
        { id: 'Doctorate Not Required', title: 'Doctorate Not Required', hasChildren: false },
        { id: 'Other Doctorate', title: 'Other Doctorate', hasChildren: false },
    ],
    'Postgraduate': [
        { id: 'Any Postgraduate', title: 'Any Postgraduate', hasChildren: false },
        { id: 'MBA/PGDM', title: 'MBA/PGDM', hasChildren: true },
        { id: 'M.Tech', title: 'M.Tech', hasChildren: true },
        { id: 'MS/M.Sc(Science)', title: 'MS/M.Sc(Science)', hasChildren: true },
        { id: 'MCA', title: 'MCA', hasChildren: true },
        { id: 'M.Com', title: 'M.Com', hasChildren: true },
    ],
    'Graduate': [
        { id: 'Any Graduate', title: 'Any Graduate', hasChildren: false },
        { id: 'B.Tech/B.E.', title: 'B.Tech / B.E.', hasChildren: true },
        { id: 'B.Com', title: 'B.Com', hasChildren: true },
        { id: 'B.Sc', title: 'B.Sc', hasChildren: true },
        { id: 'B.A', title: 'B.A - Bachelor of Arts', hasChildren: true },
        { id: 'Diploma', title: 'Diploma', hasChildren: true },
    ]
};

const groupedBenefits = [
    {
        label: 'OFFICE PERKS',
        options: [
            { label: 'Sports for women', value: 'Sports for women' },
            { label: 'Assistive technologies', value: 'Assistive technologies' },
            { label: 'Accessible workspace', value: 'Accessible workspace' },
            { label: 'Special parking for expecting mothers', value: 'Special parking for expecting mothers' },
            { label: 'Free snacks', value: 'Free snacks' },
        ],
    },
    {
        label: 'HEALTH AND WELLNESS',
        options: [
            { label: 'Health insurance', value: 'Health insurance' },
            { label: 'Gym membership', value: 'Gym membership' },
        ]
    }
];

const salaryBracketOptions = (() => {
    const options = [];
    for (let i = 10000; i <= 90000; i += 10000) {
        options.push({ value: i, label: i.toLocaleString('en-IN') });
    }
    for (let i = 1; i <= 99; i++) {
        options.push({ value: i * 100000, label: `${i} lac${i > 1 ? 's' : ''}` });
        if (i < 20) {
            options.push({ value: i * 100000 + 50000, label: `${i}.5 lacs` });
        }
    }
    return options;
})();

export default function Posting() {
    const navigate = useNavigate();
    const searchParams = useSearchParams();
    const editJobId = searchParams?.get('id');

    useEffect(() => {
        if (editJobId) {
            navigate(`/edit-job/${editJobId}`, { replace: true });
        }
    }, [editJobId, navigate]);

    // Multi-step form state
    const [currentStep, setCurrentStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState([]);

    // Subscription & Quota state
    const [subscription, setSubscription] = useState(null);
    const [quotaLoading, setQuotaLoading] = useState(true);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [limitModalMessage, setLimitModalMessage] = useState("");

    const activeJobsLimit = subscription?.limits?.active_job_limit ?? subscription?.usage?.active_job_limit ?? 0;
    const activeJobsCount = subscription?.usage?.active_jobs_count ?? 0;
    const pendingJobsCount = subscription?.usage?.pending_jobs_count ?? 0;
    const activeJobsRemaining = subscription?.usage?.active_jobs_remaining ?? Math.max(0, activeJobsLimit - activeJobsCount);
    const jobPostsLimit = subscription?.limits?.job_post_limit ?? subscription?.usage?.job_posts_limit ?? 0;
    const jobPostsUsed = subscription?.usage?.job_posts_used ?? 0;
    const jobPostsRemaining = subscription?.usage?.job_posts_remaining ?? Math.max(0, jobPostsLimit - jobPostsUsed);
    const isSubRecruiter = Boolean(subscription?.is_sub_recruiter || subscription?.usage?.is_sub_recruiter || subscription?.permissions?.can_manage_team === false);
    const isCompanyLimitReached = Boolean(subscription?.company_limit_reached || subscription?.can_post_jobs === false || subscription?.permissions?.can_post_jobs === false);
    const isActiveLimitReached = !quotaLoading && subscription && (activeJobsRemaining <= 0 || (isSubRecruiter && isCompanyLimitReached));
    const isMonthlyLimitReached = !quotaLoading && subscription && ((jobPostsLimit > 0 && jobPostsRemaining <= 0) || (isSubRecruiter && isCompanyLimitReached));
    const isLimitReached = isActiveLimitReached || isMonthlyLimitReached || isCompanyLimitReached;
    const planName = subscription?.plan?.name || subscription?.plan_name || 'Basic';

    // --- State Variables ---
    const [jobNatureId, setJobNatureId] = useState(null);
    const [workTypeActiveButton, setWorkTypeActiveButton] = useState(null);
    const [workLocationActiveButton, setWorkLocationActiveButton] = useState(null);
    const [experienceRequiredActiveButton, setExperienceRequiredActiveButton] = useState(null);
    const [selectedFresherPass, setSelectedFresherPass] = useState([]);
    const [experienceRequired, setExperienceRequired] = useState("");
    const [salaryTypeActiveButton, setSalaryTypeActiveButton] = useState(null);
    const [diversityenabled, setDiversityEnabled] = useState(true);
    const [genderselected, setGenderSelected] = useState([]);
    const [showMore, setShowMore] = useState(false);
    const [selectedBenefits, setSelectedBenefits] = useState([]);
    const [isQuestionModalVisible, setIsQuestionModalVisible] = useState(false);
    const [currentEditingQuestion, setCurrentEditingQuestion] = useState(null);

    // New UI states based on screenshots
    const [postingAs, setPostingAs] = useState("Company/Business");
    const [department, setDepartment] = useState(null);
    const [minExp, setMinExp] = useState(null);
    const [maxExp, setMaxExp] = useState(null);
    const [freshersAllowed, setFreshersAllowed] = useState(false);
    const [languages, setLanguages] = useState([]);
    const [educationalDegree, setEducationalDegree] = useState([]);
    const [educationalQualificationError, setEducationalQualificationError] = useState("");
    const [educationalQualificationOptions, setEducationalQualificationOptions] = useState([]);
    const [specializationData, setSpecializationData] = useState([]);

    // Advanced options states
    const [isWalkIn, setIsWalkIn] = useState(false);
    const [walkInStartDate, setWalkInStartDate] = useState(null);
    const [walkInEndDate, setWalkInEndDate] = useState(null);
    const [walkInTiming, setWalkInTiming] = useState(null);
    const [recruiterName, setRecruiterName] = useState("");
    const [mobileNumber, setMobileNumber] = useState("");
    const [venueAddress, setVenueAddress] = useState("");
    const [googleMapsUrl, setGoogleMapsUrl] = useState("");
    const [emailSummaryType, setEmailSummaryType] = useState("As a daily summary");
    const [eduMenuStack, setEduMenuStack] = useState([]);
    const [eduDropdownOpen, setEduDropdownOpen] = useState(false);
    const [candidateIndustry, setCandidateIndustry] = useState([]);
    const [genderPreference, setGenderPreference] = useState("Any");
    const [specificCity, setSpecificCity] = useState([]);
    const [venuesList, setVenuesList] = useState([]);
    const [isVenueModalVisible, setIsVenueModalVisible] = useState(false);
    const [newVenueAddress, setNewVenueAddress] = useState("");
    const [newVenueUrl, setNewVenueUrl] = useState("");

    // Team members states
    const [teamMembers, setTeamMembers] = useState([]);
    const [isMemberModalVisible, setIsMemberModalVisible] = useState(false);
    const [newMemberEmail, setNewMemberEmail] = useState("");

    // External apply options
    const [isExternalApply, setIsExternalApply] = useState(false);
    const STEPS = BASE_STEPS.filter(step => !(isExternalApply && step.id === 3));
    const [applyLink, setApplyLink] = useState("");

    // Form fields
    const [companyName, setCompanyName] = useState("");
    const [companyNameError, setCompanyNameError] = useState("");
    const [jobTitle, setJobTitle] = useState("");
    const [jobTitleError, setJobTitleError] = useState("");
    const [jobNatureError, setJobNatureError] = useState("");
    const [jobNatureOptions, setJobNatureOptions] = useState([]);
    const [jobInternshipDuration, setJobInternshipDuration] = useState("");
    const [jobInternshipDurationError, setJobInternshipDurationError] = useState("");
    const [internshipDurationTypeData, setInternshipDurationTypeData] = useState([]);
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
    const [otherBenifits, setOtherBenifits] = useState([]);
    const [gender, setGender] = useState([]);
    const [salaryData, setSalaryData] = useState([]);

    // Salary specifics
    const [currency, setCurrency] = useState("INR");
    const [fixedSalary, setFixedSalary] = useState("");
    const [salaryMin, setSalaryMin] = useState("");
    const [salaryMax, setSalaryMax] = useState("");
    const [salaryMinError, setSalaryMinError] = useState("");
    const [salaryMaxError, setSalaryMaxError] = useState("");
    const [salaryNotDisclosed, setSalaryNotDisclosed] = useState(false);
    const [salaryType, setSalaryType] = useState("Total CTC");
    const [hideSalary, setHideSalary] = useState(false);
    const [willingToRelocate, setWillingToRelocate] = useState(false);
    const [workMode, setWorkMode] = useState("In office");
    const [role, setRole] = useState("");
    const [industry, setIndustry] = useState("");
    const [employmentType, setEmploymentType] = useState("Full Time, Permanent");
    const [jobOpenings, setJobOpenings] = useState(3);
    const [hybridPolicy, setHybridPolicy] = useState("");
    const [showHybridPolicyInput, setShowHybridPolicyInput] = useState(false);
    const [fixedFormat, setFixedFormat] = useState("Annually");
    const [variableFormat, setVariableFormat] = useState("Annually");
    const [variableAmount, setVariableAmount] = useState("");
    const [showBonus, setShowBonus] = useState(false);
    const [bonusAmount, setBonusAmount] = useState("");
    const [bonusFormat, setBonusFormat] = useState("Annually");

    const employmentTypeOptions = [
        { value: "Full Time, Permanent", label: "Full Time, Permanent" },
        { value: "Part Time", label: "Part Time" },
        { value: "Contract", label: "Contract" },
        { value: "Freelance", label: "Freelance" }
    ];

    const industryOptions = [
        "Accounting", "Airlines/Aviation", "Alternative Dispute Resolution", "Alternative Medicine", "Animation", "Apparel & Fashion", "Architecture & Planning", "Arts and Crafts", "Automotive", "Aviation & Aerospace", "Banking", "Biotechnology", "Broadcast Media", "Building Materials", "Business Supplies and Equipment", "Capital Markets", "Chemicals", "Civic & Social Organization", "Civil Engineering", "Commercial Real Estate", "Computer & Network Security", "Computer Games", "Computer Hardware", "Computer Networking", "Computer Software", "Construction", "Consumer Electronics", "Consumer Goods", "Consumer Services", "Cosmetics", "Dairy", "Defense & Space", "Design", "E-Learning", "Education Management", "Electrical/Electronic Manufacturing", "Entertainment", "Environmental Services", "Events Services", "Executive Office", "Facilities Services", "Farming", "Financial Services", "Fine Art", "Fishery", "Food & Beverages", "Food Production", "Fund-Raising", "Furniture", "Gambling & Casinos", "Glass, Ceramics & Concrete", "Government Administration", "Government Relations", "Graphic Design", "Health, Wellness and Fitness", "Higher Education", "Hospital & Health Care", "Hospitality", "Human Resources", "Import and Export", "Individual & Family Services", "Industrial Automation", "Information Services", "Information Technology and Services", "Insurance", "International Affairs", "International Trade and Development", "Internet", "Investment Banking", "Investment Management", "Judiciary", "Law Enforcement", "Law Practice", "Legal Services", "Legislative Office", "Leisure, Travel & Tourism", "Libraries", "Logistics and Supply Chain", "Luxury Goods & Jewelry", "Machinery", "Management Consulting", "Maritime", "Market Research", "Marketing and Advertising", "Mechanical or Industrial Engineering", "Media Production", "Medical Devices", "Medical Practice", "Mental Health Care", "Military", "Mining & Metals", "Motion Pictures and Film", "Museums and Institutions", "Music", "Nanotechnology", "Newspapers", "Non-Profit Organization Management", "Oil & Energy", "Online Media", "Outsourcing/Offshoring", "Package/Freight Delivery", "Packaging and Containers", "Paper & Forest Products", "Performing Arts", "Pharmaceuticals", "Philanthropy", "Photography", "Plastics", "Political Organization", "Primary/Secondary Education", "Printing", "Professional Training & Coaching", "Program Development", "Public Policy", "Public Relations and Communications", "Public Safety", "Publishing", "Railroad Manufacture", "Ranching", "Real Estate", "Recreational Facilities and Services", "Religious Institutions", "Renewables & Environment", "Research", "Restaurants", "Retail", "Security and Investigations", "Semiconductors", "Shipbuilding", "Sporting Goods", "Sports", "Staffing and Recruiting", "Supermarkets", "Telecommunications", "Textiles", "Think Tanks", "Tobacco", "Translation and Localization", "Transportation/Trucking/Railroad", "Utilities", "Venture Capital & Private Equity", "Veterinary", "Warehousing", "Wholesale", "Wine and Spirits", "Wireless", "Writing and Editing"
    ].map(ind => ({ value: ind, label: ind }));
    const [workingDays, setWorkingDays] = useState(null);
    const [workingDaysName, setWorkingDaysName] = useState("");
    const [workingDaysError, setWorkingDaysError] = useState("");
    const [salaryDuration, setSalaryDuration] = useState("Annual");
    const [seoDescription, setSeoDescription] = useState("");
    const [seoDescriptionError, setSeoDescriptionError] = useState("");
    const [postQuestions, setPostQuestions] = useState([]);

    const [value, setValue] = useState(DEFAULT_CONTENT);
    const [workLocationOption, setWorkLocationOption] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [logoUrl, setLogoUrl] = useState(null);
    const [aboutCompany, setAboutCompany] = useState("");
    const quillRef = useRef(null);
    const [pageLoading, setPageLoading] = useState(true);

    const handleImageChange = (info) => {
        const file = info.file.originFileObj || info.file;
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoUrl(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Error states for Step 0 Validation
    const [minExpError, setMinExpError] = useState("");
    const [maxExpError, setMaxExpError] = useState("");

    const MAX_LENGTH = 300000;

    const workingDaysOptions = [
        { value: "6 Working Days", label: "6 Working Days" },
        { value: "5 Working Days", label: "5 Working Days" },
    ];

    const popularLanguages = ["English", "Hindi", "Marathi", "Tamil", "Telugu", "Bengali", "Kannada", "Punjabi", "Gujarati", "Malayalam"];
    const suggestedBenefits = ["Office cab/shuttle", "Food allowance", "Health insurance", "Annual bonus", "Provident fund"];

    const [companyOptions, setCompanyOptions] = useState([]);
    const [jobTitleOptions, setJobTitleOptions] = useState([]);
    const [companySearchTimeout, setCompanySearchTimeout] = useState(null);
    const [jobTitleSearchTimeout, setJobTitleSearchTimeout] = useState(null);

    const handleCompanySearch = (value) => {
        if (companySearchTimeout) clearTimeout(companySearchTimeout);
        if (!value) {
            setCompanyOptions([]);
            return;
        }
        setCompanySearchTimeout(setTimeout(async () => {
            try {
                const res = await fetch(`https://autocomplete.clearbit.com/v1/companies/suggest?query=${value}`);
                if (res.ok) {
                    const data = await res.json();
                    setCompanyOptions(data.map(item => ({ value: item.name })));
                }
            } catch (e) {
                setCompanyOptions([]);
            }
        }, 300));
    };

    const handleJobTitleSearch = (value) => {
        if (jobTitleSearchTimeout) clearTimeout(jobTitleSearchTimeout);
        if (!value) {
            setJobTitleOptions([]);
            return;
        }
        setJobTitleSearchTimeout(setTimeout(async () => {
            try {
                const res = await fetch(`https://api.datamuse.com/sug?s=${value}`);
                if (res.ok) {
                    const data = await res.json();
                    const titles = data.map(item => {
                        const titleCased = item.word.replace(/\b\w/g, l => l.toUpperCase());
                        return { value: titleCased };
                    });
                    setJobTitleOptions(titles);
                }
            } catch (e) {
                setJobTitleOptions([]);
            }
        }, 300));
    };

    // Initialize API calls
    useEffect(() => {
        loadCitiesAPI();
        getJobNatureData();
        fetchVenues();
        fetchTeamMembersData();
        fetchSubscriptionQuota();
    }, []);

    const fetchSubscriptionQuota = async () => {
        try {
            setQuotaLoading(true);
            const subRes = await getMySubscription();
            if (subRes && subRes.success && subRes.data) {
                setSubscription(subRes.data);
            }
        } catch (error) {
            console.warn("Could not fetch recruiter subscription:", error?.message);
        } finally {
            setQuotaLoading(false);
        }
    };

    const fetchVenues = async () => {
        try {
            const response = await getVenues();
            if (response?.data?.data) {
                setVenuesList(response.data.data);
            }
        } catch (error) { console.error("Error fetching venues", error); }
    };

    const fetchTeamMembersData = async () => {
        try {
            const response = await getTeamMembers();
            if (response?.data?.data) {
                setTeamMembers(response.data.data);
            }
        } catch (error) { console.error("Error fetching team members", error); }
    };

    const loadCitiesAPI = () => {
        const allCities = Object.keys(cities).map((city) => ({
            label: city,
            value: city,
            state: cities[city].country === 'IN' ? 'India' : cities[city].country,
            country: cities[city].country,
        }));
        // Ensure some top Indian cities are at the top for the example UI
        const topMetros = ["Ahmedabad", "Bengaluru", "Chennai", "Hyderabad", "Kolkata", "Pune", "Mumbai", "Delhi"].map(city => ({
            label: city,
            value: city,
            state: 'India',
            country: 'IN',
            isTop: true
        }));

        const rest = allCities.filter(c => !topMetros.find(t => t.value === c.value));
        setWorkLocationOption([...topMetros, ...rest]);
    };

    const getJobNatureData = async () => {
        try {
            const response = await getJobNature();
            setJobNatureOptions(response?.data?.data || []);
            // set default
            if (response?.data?.data?.length > 0) setJobNatureId(response.data.data[0].id);
        } catch (error) { console.log("job nature error", error); }
        finally { setTimeout(() => { getWorkPlaceTypeData(); }, 300); }
    };

    const getWorkPlaceTypeData = async () => {
        try {
            const response = await getWorkPlaceType();
            setWorkplaceTypeData(response?.data?.data || []);
            if (response?.data?.data?.length > 0) {
                setWorkplaceType(response.data.data[0].id);
                setWorkTypeActiveButton(response.data.data[0].id);
            }
        } catch (error) { console.log(error); }
        finally { getBenifitsDataType(); }
    };

    const getBenifitsDataType = async () => {
        try {
            const response = await getBenifitsData();
            setOtherBenifits(response?.data?.data || []);
        } catch (error) { console.log(error); }
        finally { getGenderDataType(); }
    };

    const getGenderDataType = async () => {
        try {
            const response = await getGenderData();
            setGender(response?.data?.data || []);
        } catch (error) { console.log(error); }
        finally { setTimeout(() => { getEligibilityDataTypes(); }, 300); }
    };

    const getEligibilityDataTypes = async () => {
        try {
            const response = await getEligibilityData();
            setEligibilityData(response?.data?.data || []);
            if (response?.data?.data?.length > 0) {
                setEligibility(response.data.data[0].id);
                setExperienceRequiredActiveButton(response.data.data[0].id);
            }
        } catch (error) { console.log(error); }
        finally { setTimeout(() => { getSalaryDataType(); }, 300); }
    };

    const getSalaryDataType = async () => {
        try {
            const response = await getSalaryData();
            setSalaryData(response?.data?.data || []);
            if (response?.data?.data?.length > 0) {
                setSalaryDetails(response.data.data[0].id);
                setSalaryTypeActiveButton(response.data.data[0].id);
            }
        } catch (error) { console.log(error); }
        finally { setTimeout(() => { getYearsData(); }, 300); }
    };

    const getYearsData = async () => {
        try {
            const response = await getYears();
            setEligibilityYearData(response?.data?.data || []);
        } catch (error) { console.log(error); }
        finally { setTimeout(() => { getSkillsDataType(); }, 300); }
    };

    const getSkillsDataType = async () => {
        try {
            const response = await getSkillsData();
            const formattedOptions = response?.data?.data?.map((skill) => ({
                label: skill.name, value: skill.name,
            })) || [];
            setSkillsRequiredOption(formattedOptions);
        } catch (error) { console.log(error); }
        finally { setTimeout(() => { getJobCategoryDataTypes(); }, 300); }
    };

    const getJobCategoryDataTypes = async () => {
        try {
            const response = await getJobCategoryData();
            const jobCategoryFormatted = response?.data?.data?.map((cat) => ({
                label: cat.category_name, value: cat.category_name,
            })) || [];

            const uniqueCategories = Array.from(new Map(jobCategoryFormatted.map(item => [item.value, item])).values());
            setJobCategoryOptions(uniqueCategories);
        } catch (error) { console.log(error); }
        finally { setTimeout(() => { getEducationData(); }, 300); }
    };

    const getEducationData = async () => {
        try {
            const response = await getQualification();
            const formattedOptions = response?.data?.data?.map((edu) => ({
                label: edu.name, value: edu.name,
            })) || [];
            setEducationalQualificationOptions(formattedOptions);

            const specRes = await getSpecialization();
            const formattedSpecs = specRes?.data?.data?.map((s) => ({
                id: s.name, title: s.name, hasChildren: false
            })) || [];
            setSpecializationData(formattedSpecs);
        } catch (error) { console.log(error); }
        finally { setPageLoading(false); }
    };

    const getDurationTypesData = async () => {
        try {
            const response = await getDurationTypes();
            setInternshipDurationTypeData(response?.data?.data || []);
        } catch (error) { console.log(error); }
    };

    const getDurationData = async (durationId) => {
        try {
            const response = await getDuration({ duration_type_id: durationId });
            setIntershipDuration(response?.data?.data || []);
        } catch (error) { console.log(error); }
    };

    const getWorkPlaceLocationData = async () => {
        try {
            const response = await getWorkPlaceLocation();
            setWorkplaceLocation(response?.data?.data || []);
        } catch (error) { console.log(error); }
    };

    // Form Navigation
    const handleNext = () => {
        // Form validation
        if (currentStep === 0) {
            const jobTitleValidate = nameValidator(jobTitle);

            let minExpErr = "";
            let maxExpErr = "";
            if (!freshersAllowed) {
                if (minExp === null) minExpErr = "Please select minimum experience";
                if (maxExp === null) maxExpErr = "Please select maximum experience";
                if (minExp !== null && maxExp !== null && minExp > maxExp) maxExpErr = "Max must be greater than Min";
            }

            let salMinErr = "";
            let salMaxErr = "";
            if (!hideSalary) {
                if (salaryMin !== null && salaryMin !== "" && salaryMin < 5000) salMinErr = "Minimum monthly salary must be greater than ₹5,000";
                if (salaryMin !== null && salaryMin !== "" && salaryMax !== null && salaryMax !== "" && salaryMin > salaryMax) salMaxErr = "Max salary must be greater than Min";
            }

            setJobTitleError(jobTitleValidate);
            setMinExpError(minExpErr);
            setMaxExpError(maxExpErr);
            setSalaryMinError(salMinErr);
            setSalaryMaxError(salMaxErr);

            if (jobTitleValidate || minExpErr || maxExpErr || salMinErr || salMaxErr) return;
        }

        if (!completedSteps.includes(currentStep)) {
            setCompletedSteps([...completedSteps, currentStep]);
        }
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
            window.scrollTo(0, 0);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
            window.scrollTo(0, 0);
        } else {
            navigate(-1);
        }
    };

    // UI Helpers
    const toggleBenefitSelection = (key) => {
        setSelectedBenefits((prevSelected) =>
            prevSelected.includes(key)
                ? prevSelected.filter((item) => item !== key)
                : [...prevSelected, key]
        );
    };

    const toggleLanguageSelection = (key) => {
        setLanguages((prev) =>
            prev.includes(key)
                ? prev.filter((item) => item !== key)
                : [...prev, key]
        );
    };

    const handleAddQuestion = () => {
        setCurrentEditingQuestion({
            index: postQuestions.length,
            data: { question: "", isrequired: 1, type: "Short answer", options: ["Option 1", "Option 2"] }
        });
        setIsQuestionModalVisible(true);
    };

    const handleAddSuggestedQuestion = (text) => {
        setPostQuestions([...postQuestions, { question: text, isrequired: 1, type: "Short answer", options: [] }]);
    }

    const handleUpdateQuestion = (index, field, value) => {
        const updated = [...postQuestions];
        updated[index][field] = value;
        setPostQuestions(updated);
    };

    const handleRemoveQuestion = (index) => {
        const updated = postQuestions.filter((_, i) => i !== index);
        setPostQuestions(updated);
    };

    const updateCurrentEditingQuestion = (field, value) => {
        if (!currentEditingQuestion) return;
        setCurrentEditingQuestion({
            ...currentEditingQuestion,
            data: {
                ...currentEditingQuestion.data,
                [field]: value
            }
        });
    };

    const handlePublishPost = async () => {
        // Validation logic for final step
        const getUserDetails = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("loginDetails") || "{}") : {};
        const now = new Date();
        const fetchDateTime = now.toLocaleDateString("en-CA") + " " + now.toLocaleTimeString("en-GB", { hour12: false });

        const getDurationName = internShipDuration.find((f) => f.id === selectedDurationId);
        const allBenefitsData = selectedBenefits;

        // Map UI state to payload
        const expReq = freshersAllowed ? ["All"] : (minExp && maxExp ? `${minExp}-${maxExp} Years` : experienceRequired);

        let mappedGender = [];
        if (genderPreference === 'Male') mappedGender = ['Male'];
        else if (genderPreference === 'Female') mappedGender = ['Female'];
        else mappedGender = gender.map(g => g.name);

        const payload = {
            user_id: getUserDetails.id,
            company_name: companyName,
            company_logo: logoUrl || dummyLogo,
            job_title: jobTitle,
            job_nature: jobNatureId === 1 ? "Job" : jobNatureId === 2 ? "Internship" : jobNatureId === 3 ? "Scholarship" : "Job",
            duration_period: jobNatureId === 1 ? "Permanent" : jobNatureId === 2 ? getDurationName?.duration : jobNatureId === 3 ? "Scholarship" : "Permanent",
            workplace_type: workMode === "In office" ? "In Office" : workMode === "Hybrid" ? "Hybrid" : "Work From Home",
            role: role,
            industry: industry,
            employment_type: employmentType,
            willing_to_relocate: willingToRelocate,
            hybrid_policy: workMode === "Hybrid" ? hybridPolicy : "",
            work_location: specificCity ? specificCity : (specificLocation.length > 0 ? specificLocation : "Pan India"),
            job_category: department ? [department] : jobCategory,
            skills: skillsRequired,
            experience_type: freshersAllowed ? "Fresher" : "Experienced",
            experience_required: expReq,
            salary_type: salaryType,
            hide_salary: hideSalary,
            currency: currency,
            min_salary: salaryMin,
            max_salary: salaryMax,
            fixed_format: fixedFormat,
            variable_amount: variableAmount,
            variable_format: variableFormat,
            bonus_amount: showBonus ? bonusAmount : "",
            bonus_format: showBonus ? bonusFormat : "",
            salary_duration: salaryDuration,
            diversity_hiring: mappedGender,
            benefits: allBenefitsData,
            educational_qualification: educationalDegree,
            candidate_industry: candidateIndustry,
            created_at: fetchDateTime,
            openings: jobOpenings,
            working_days: workingDaysName,
            job_description: value,
            seo_description: seoDescription,
            questions: isExternalApply ? [] : postQuestions.filter(q => q.question.trim() !== ""),
            languages: languages,
            is_walk_in: isWalkIn,
            walk_in_start_date: walkInStartDate ? walkInStartDate.format("YYYY-MM-DD") : null,
            walk_in_end_date: walkInEndDate ? walkInEndDate.format("YYYY-MM-DD") : null,
            walk_in_start_time: walkInTiming ? walkInTiming[0]?.format("HH:mm") : null,
            walk_in_end_time: walkInTiming ? walkInTiming[1]?.format("HH:mm") : null,
            recruiter_name: recruiterName,
            mobile_number: mobileNumber,
            venue_address: venueAddress,
            google_maps_url: googleMapsUrl,
            team_members: teamMembers,
            apply_link: isExternalApply ? applyLink : null,
            about_company: isExternalApply ? aboutCompany : null
        };

        // Quota check before submitting
        if (subscription) {
            const activeLimit = subscription?.limits?.active_job_limit ?? subscription?.usage?.active_job_limit ?? 0;
            const activeRem = subscription?.usage?.active_jobs_remaining ?? Math.max(0, activeLimit - (subscription?.usage?.active_jobs_count ?? 0));
            const postLimit = subscription?.limits?.job_post_limit ?? subscription?.usage?.job_posts_limit ?? 0;
            const postRem = subscription?.usage?.job_posts_remaining ?? Math.max(0, postLimit - (subscription?.usage?.job_posts_used ?? 0));
            const planTitle = subscription?.plan?.name || subscription?.plan_name || 'Basic';

            if (isSubRecruiter && (isCompanyLimitReached || activeRem <= 0 || postRem <= 0)) {
                setLimitModalMessage(subscription?.limit_reason || "Your company has reached its subscription plan job limit. Contact your primary recruiter to upgrade the plan or close an existing active job.");
                setShowLimitModal(true);
                return;
            }

            if (activeRem <= 0) {
                setLimitModalMessage(`You have reached your maximum active job limit (${activeLimit}) on the ${planTitle} Plan. To publish this job, please close an existing active job from your dashboard or upgrade your plan.`);
                setShowLimitModal(true);
                return;
            }

            if (postLimit > 0 && postRem <= 0) {
                setLimitModalMessage(`You have used all ${postLimit} monthly job posts available on the ${planTitle} Plan. Please upgrade your subscription plan to post more jobs.`);
                setShowLimitModal(true);
                return;
            }
        }

        try {
            setIsLoading(true);
            await createJobPost(payload);
            toast.success("Job Posted Successfully.");
            navigate("/my-jobs");
        } catch (error) {
            console.error("Error posting job:", error);
            const errorDetails = error.response?.data?.details || error.response?.data?.message || "";
            if (
                error.response?.status === 403 ||
                errorDetails.toLowerCase().includes("limit") ||
                errorDetails.toLowerCase().includes("quota") ||
                errorDetails.toLowerCase().includes("subscription") ||
                errorDetails.toLowerCase().includes("active job")
            ) {
                setLimitModalMessage(errorDetails || "You have reached your active job posting quota limit. Close an existing job or upgrade your plan.");
                setShowLimitModal(true);
            } else {
                toast.error(errorDetails || "Failed to post job.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (content, delta, source, editor) => {
        const textLength = editor.getText().trim().length;
        if (textLength > MAX_LENGTH) return;
        setValue(content);
    };

    const formatLac = (val) => {
        if (!val) return "0";
        const inLacs = val / 100000;
        return Number(inLacs.toFixed(2)).toString();
    };

    if (pageLoading) {
        return <CommonLoader fullScreen={true} text="Loading Job Editor..." />;
    }

    const handleSaveNewVenue = async () => {
        if (!newVenueAddress.trim()) {
            toast.error("Please enter a venue address");
            return;
        }
        try {
            const res = await addVenue({ address: newVenueAddress, url: newVenueUrl });
            if (res.data?.success) {
                toast.success("Venue saved successfully");
                setVenueAddress(newVenueAddress);
                setGoogleMapsUrl(newVenueUrl);
                setIsVenueModalVisible(false);
                setNewVenueAddress("");
                setNewVenueUrl("");
                fetchVenues(); // refresh the list
            }
        } catch (error) {
            toast.error("Failed to save venue");
            console.error(error);
        }
    };

    const handleSaveNewMember = async () => {
        if (!newMemberEmail.trim()) {
            toast.error("Please enter an email");
            return;
        }
        try {
            const res = await addTeamMember({ email: newMemberEmail });
            if (res.data?.success) {
                toast.success("Member added successfully");
                setIsMemberModalVisible(false);
                setNewMemberEmail("");
                fetchTeamMembersData(); // refresh the list
            }
        } catch (error) {
            toast.error("Failed to add member");
            console.error(error);
        }
    };

    const venueMenuItems = venuesList.map((v) => ({
        key: v.id.toString(),
        label: <div className="max-w-[280px] truncate text-[14px] text-gray-700 py-1" title={v.address}>{v.address}</div>,
        onClick: () => {
            setVenueAddress(v.address);
            setGoogleMapsUrl(v.url || "");
        }
    }));
    venueMenuItems.push({
        key: 'add_new',
        label: <div className="text-[#0A66C2] font-semibold py-1">+ Add new venue</div>,
        onClick: () => setIsVenueModalVisible(true)
    });

    const renderStepContent = () => {
        const stepId = STEPS[currentStep]?.id;
        switch (stepId) {
            case 0:
                return (
                    <motion.div
                        key="step0"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8 max-w-3xl"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <h2 className="text-[22px] font-bold text-[#1f2937]">Job details</h2>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[14px] font-bold text-[#374151] mb-2">How should candidates apply?</label>
                                <div className="flex gap-4 mb-3">
                                    <button
                                        onClick={() => setIsExternalApply(false)}
                                        className={`px-4 py-2 rounded-full border text-[14px] font-medium transition-all ${!isExternalApply ? 'border-[#0A66C2] text-[#0A66C2] bg-blue-50' : 'border-gray-300 text-gray-600 hover:border-gray-400 bg-white'}`}
                                    >
                                        Apply directly on Careerfast
                                    </button>
                                    <button
                                        onClick={() => setIsExternalApply(true)}
                                        className={`px-4 py-2 rounded-full border text-[14px] font-medium transition-all ${isExternalApply ? 'border-[#0A66C2] text-[#0A66C2] bg-blue-50' : 'border-gray-300 text-gray-600 hover:border-gray-400 bg-white'}`}
                                    >
                                        Apply via external website link
                                    </button>
                                </div>
                                {isExternalApply && (
                                    <div className="mt-2">
                                        <input
                                            type="text"
                                            value={applyLink}
                                            onChange={(e) => setApplyLink(e.target.value)}
                                            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-[#0A66C2] outline-none text-[15px] text-gray-800 bg-white mb-4"
                                            placeholder="Enter the URL where candidates can apply"
                                        />

                                        <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                                            <h3 className="text-[14px] font-bold text-[#374151] mb-3">External Job Details</h3>

                                            <div className="mb-4">
                                                <label className="block text-[13px] font-medium text-gray-700 mb-2">Company Name (Optional)</label>
                                                <input
                                                    type="text"
                                                    value={companyName}
                                                    onChange={(e) => setCompanyName(e.target.value)}
                                                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-[#0A66C2] outline-none text-[14px] text-gray-800 bg-white"
                                                    placeholder="Enter company name"
                                                />
                                            </div>

                                            <div className="mb-4">
                                                <label className="block text-[13px] font-medium text-gray-700 mb-2">Company Logo (Optional)</label>
                                                <div className="hr-upload-box text-center p-4 border-2 border-dashed border-gray-300 rounded-lg bg-white">
                                                    <Upload.Dragger
                                                        accept="image/*"
                                                        showUploadList={false}
                                                        onChange={(info) => handleImageChange(info)}
                                                    >
                                                        {logoUrl ? (
                                                            <img src={logoUrl} alt="logo" style={{ maxHeight: "100px", maxWidth: "100%", objectFit: "contain", margin: "0 auto" }} />
                                                        ) : (
                                                            <div className="text-gray-500 cursor-pointer">
                                                                <CloudUploadOutlined style={{ fontSize: '24px' }} />
                                                                <p className="mt-2">Click or drag file to this area to upload</p>
                                                            </div>
                                                        )}
                                                    </Upload.Dragger>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-[13px] font-medium text-gray-700 mb-2">About Company (Optional)</label>
                                                <textarea
                                                    value={aboutCompany}
                                                    onChange={(e) => setAboutCompany(e.target.value)}
                                                    rows={4}
                                                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-[#0A66C2] outline-none text-[14px] text-gray-800 bg-white"
                                                    placeholder="Enter details about the company..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-[14px] font-bold text-[#374151] mb-2">Job title <span className="text-red-500">*</span></label>
                                <AutoComplete
                                    options={jobTitleOptions}
                                    style={{ width: '100%', height: '44px' }}
                                    value={jobTitle}
                                    onSearch={handleJobTitleSearch}
                                    onChange={(val) => {
                                        setJobTitle(val);
                                        setJobTitleError(nameValidator(val));
                                    }}
                                >
                                    <input
                                        type="text"
                                        className={`w-full px-3 py-2.5 rounded-lg border ${jobTitleError ? 'border-red-500' : 'border-gray-300 focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2]'} outline-none text-[15px] text-gray-800 bg-white`}
                                        placeholder="Enter job title"
                                    />
                                </AutoComplete>
                                {jobTitleError && <p className="text-red-500 text-xs mt-1 mb-0">{jobTitleError}</p>}
                            </div>

                            <div>
                                <label className="block text-[14px] font-bold text-[#374151] mb-2">Department</label>
                                <Select
                                    showSearch
                                    className="w-full custom-department-select"
                                    size="large"
                                    placeholder="Select Department"
                                    value={department}
                                    onChange={setDepartment}
                                    options={jobCategoryOptions}
                                    filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                                    virtual={false}
                                />
                                <style>{`
                                    .custom-department-select .ant-select-selector {
                                        border-radius: 8px !important;
                                    }
                                    .custom-department-select .ant-select-item-option-selected {
                                        background-color: #EAF3FC !important;
                                    }
                                `}</style>
                            </div>

                            <div>
                                <label className="block text-[14px] font-bold text-[#374151] mb-2">Employment type</label>
                                <Select
                                    className="w-full custom-department-select"
                                    size="large"
                                    placeholder="Select Employment Type"
                                    value={employmentType}
                                    onChange={setEmploymentType}
                                    options={employmentTypeOptions}
                                />
                            </div>

                            <div>
                                <label className="block text-[14px] font-bold text-[#374151] mb-2">Work mode</label>
                                <div className="flex flex-col gap-2">
                                    <div className="flex flex-wrap gap-3">
                                        {["In office", "Hybrid", "Remote"].map(mode => (
                                            <button
                                                key={mode}
                                                onClick={() => {
                                                    setWorkMode(mode);
                                                    if (mode !== "Hybrid") {
                                                        setShowHybridPolicyInput(false);
                                                        setHybridPolicy("");
                                                    }
                                                }}
                                                className={`px-6 py-2 rounded-full border text-[14px] font-medium transition-all ${workMode === mode ? 'border-[#0A66C2] text-[#0A66C2] bg-white' : 'border-[#d1d5db] text-[#4b5563] hover:border-gray-400 bg-white'}`}
                                            >
                                                {mode}
                                            </button>
                                        ))}
                                    </div>
                                    {workMode === "Hybrid" && (
                                        <div className="mt-1">
                                            {!showHybridPolicyInput ? (
                                                <button
                                                    className="text-[#0A66C2] text-[15px] font-medium flex items-center hover:underline"
                                                    onClick={() => setShowHybridPolicyInput(true)}
                                                >
                                                    <PlusOutlined className="text-[12px] mr-1.5" /> Define your hybrid policy
                                                </button>
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={hybridPolicy}
                                                    onChange={(e) => setHybridPolicy(e.target.value)}
                                                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-[#0A66C2] outline-none text-[15px] text-gray-800 bg-white"
                                                    placeholder="e.g. 3 days a week in office, / 10 days in a month etc."
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[14px] font-bold text-[#374151] mb-2">Job location (max. 9)</label>
                                <Select
                                    mode="multiple"
                                    showSearch
                                    className="w-full custom-benefits-select"
                                    size="large"
                                    placeholder="Add more locations"
                                    value={specificCity}
                                    onChange={setSpecificCity}
                                    options={workLocationOption}
                                    menuItemSelectedIcon={null}
                                    filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                                    tagRender={(props) => {
                                        const { label, closable, onClose } = props;
                                        return (
                                            <span
                                                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                                className="inline-flex items-center gap-1.5 px-2 py-1 my-1 mr-1.5 rounded-full border border-[#0A66C2] text-[#0A66C2] bg-white text-[14px]"
                                            >
                                                {label}
                                                {closable && <CloseOutlined onClick={onClose} className="text-[12px] cursor-pointer text-gray-400 hover:text-[#0A66C2]" />}
                                            </span>
                                        );
                                    }}
                                    optionRender={(option) => {
                                        const isSelected = specificCity.includes(option.value);
                                        return (
                                            <div className={`flex justify-between items-center w-full px-1 py-0.5 ${isSelected ? 'font-medium' : ''}`}>
                                                <div className="flex items-start gap-2 py-1">
                                                    <EnvironmentOutlined className={`mt-1 ${isSelected ? 'text-[#0A66C2]' : 'text-gray-400'}`} />
                                                    <div className="flex flex-col">
                                                        <span className={`text-[15px] ${isSelected ? 'text-gray-900' : 'text-gray-800'}`}>{option.data.label}</span>
                                                        <span className={`text-[12px] ${isSelected ? 'text-[#0A66C2]' : 'text-gray-500'}`}>{option.data.state}</span>
                                                    </div>
                                                </div>
                                                {isSelected && <CheckOutlined className="text-[#0A66C2] font-bold text-[14px]" />}
                                            </div>
                                        );
                                    }}
                                />
                                <label className="flex items-center gap-2 cursor-pointer w-max mt-3">
                                    <input
                                        type="checkbox"
                                        checked={willingToRelocate}
                                        onChange={(e) => setWillingToRelocate(e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 text-[#0A66C2] focus:ring-[#0A66C2]"
                                    />
                                    <span className="text-[14px] text-gray-600">Include candidates willing to relocate to above location(s)</span>
                                </label>
                            </div>

                            <div>
                                <label className="block text-[15px] font-semibold text-gray-700 mb-2">Work experience <span className="text-red-500">*</span></label>
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="flex-1">
                                        <Select
                                            className={`w-full custom-select-border ${minExpError ? 'border-red-500' : ''}`}
                                            size="large"
                                            placeholder="Min year"
                                            value={minExp}
                                            onChange={(val) => {
                                                setMinExp(val);
                                                setMinExpError("");
                                                if (maxExp !== null && val > maxExp) {
                                                    setMaxExpError("Max must be greater than Min");
                                                } else {
                                                    setMaxExpError("");
                                                }
                                            }}
                                            options={Array.from({ length: 16 }, (_, i) => ({ label: `${i} year${i !== 1 ? 's' : ''}`, value: i }))}
                                            disabled={freshersAllowed}
                                        />
                                        {minExpError && <p className="text-red-500 text-xs mt-1 mb-0">{minExpError}</p>}
                                    </div>
                                    <span className="text-gray-500 text-sm mt-2.5">to</span>
                                    <div className="flex-1">
                                        <Select
                                            className={`w-full custom-select-border ${maxExpError ? 'border-red-500' : ''}`}
                                            size="large"
                                            placeholder="Max exp."
                                            value={maxExp}
                                            onChange={(val) => {
                                                setMaxExp(val);
                                                setMaxExpError("");
                                                if (minExp !== null && minExp > val) {
                                                    setMaxExpError("Max must be greater than Min");
                                                } else {
                                                    setMaxExpError("");
                                                }
                                            }}
                                            options={Array.from({ length: 16 }, (_, i) => ({ label: `${i} year${i !== 1 ? 's' : ''}`, value: i }))}
                                            disabled={freshersAllowed}
                                        />
                                        {maxExpError && <p className="text-red-500 text-xs mt-1 mb-0">{maxExpError}</p>}
                                    </div>
                                </div>
                                <style>{`
                                    .custom-select-border.border-red-500 .ant-select-selector {
                                        border-color: #ef4444 !important;
                                    }
                                    .ant-select-single.ant-select-lg {
                                        font-size: 16px;
                                        height: 46px;
                                    }
                                    .custom-benefits-select .ant-select-selector {
                                        padding-left: 12px !important;
                                        padding-right: 12px !important;
                                        padding-top: 4px !important;
                                        padding-bottom: 4px !important;
                                    }
                                `}</style>
                                <label className="flex items-center gap-2 cursor-pointer w-max">
                                    <input
                                        type="checkbox"
                                        checked={freshersAllowed}
                                        onChange={(e) => setFreshersAllowed(e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 text-[#0A66C2] focus:ring-[#0A66C2]"
                                    />
                                    <span className="text-[14px] text-gray-600">Freshers can also apply</span>
                                </label>
                            </div>

                            <div>
                                <label className="block text-[15px] font-medium text-[#0e2c53] mb-2">Salary type</label>
                                <div className="flex flex-wrap gap-3 mb-3">
                                    {["Total CTC", "Fixed + Variable"].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setSalaryType(type)}
                                            className={`px-[18px] py-[6px] rounded-full border-1 text-[14px] transition-all ${salaryType === type ? 'border-[#0A66C2] text-[#0A66C2] bg-white' : 'border-[#d9d9d9] text-gray-600 hover:border-[#b3b3b3] bg-white'}`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>

                                {salaryType === "Total CTC" ? (
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-3">
                                            <Select
                                                value={currency}
                                                onChange={setCurrency}
                                                size="large"
                                                options={[
                                                    { value: 'INR', label: '₹' },
                                                    { value: 'USD', label: '$' }
                                                ]}
                                                className="w-[70px] custom-department-select"

                                            />
                                            <div className="flex-1">
                                                <Select
                                                    size="large"
                                                    value={salaryMin || undefined}
                                                    onChange={(val) => {
                                                        setSalaryMin(val);
                                                        if (salaryMax !== null && val > salaryMax) setSalaryMaxError("Max must be > Min");
                                                        else setSalaryMaxError("");
                                                    }}

                                                    className={`w-full custom-department-select ${salaryMinError ? '!border-red-500' : ''}`}
                                                    placeholder="Min"
                                                    options={salaryBracketOptions}
                                                    showSearch
                                                />
                                            </div>
                                            <span className="text-gray-500 text-sm">to</span>
                                            <div className="flex-1">
                                                <Select
                                                    size="large"
                                                    value={salaryMax || undefined}
                                                    onChange={(val) => {
                                                        setSalaryMax(val);
                                                        if (salaryMin !== null && val < salaryMin) setSalaryMaxError("Max must be > Min");
                                                        else setSalaryMaxError("");
                                                    }}

                                                    className={`w-full custom-department-select ${salaryMaxError ? '!border-red-500' : ''}`}
                                                    placeholder="Max"
                                                    options={salaryBracketOptions}
                                                    showSearch
                                                />
                                            </div>
                                        </div>
                                        {(salaryMinError || salaryMaxError) && <p className="text-red-500 text-xs">{salaryMinError || salaryMaxError}</p>}
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-6">
                                        {/* Fixed Salary */}
                                        <div className="flex flex-col gap-2">
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="text-[15px] text-[#0e2c53]">Fixed salary</label>
                                                <div className="flex bg-[#f3f4f6] rounded-full p-[3px] border border-[#e5e7eb]">
                                                    <button onClick={() => setFixedFormat("Annually")} className={`px-4 py-1 text-[13px] rounded-full transition-all ${fixedFormat === "Annually" ? 'bg-white shadow-sm font-medium text-gray-900 border border-[#e5e7eb]' : 'text-gray-600 hover:text-gray-800'}`}>Annually</button>
                                                    <button onClick={() => setFixedFormat("Monthly")} className={`px-4 py-1 text-[13px] rounded-full transition-all ${fixedFormat === "Monthly" ? 'bg-white shadow-sm font-medium text-gray-900 border border-[#e5e7eb]' : 'text-gray-600 hover:text-gray-800'}`}>Monthly</button>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Select value={currency} onChange={setCurrency} size="large" options={[{ value: 'INR', label: '₹' }, { value: 'USD', label: '$' }]} className="w-[70px] custom-department-select" />
                                                <div className="flex-1">
                                                    <Select
                                                        size="large"
                                                        value={salaryMin || undefined}
                                                        onChange={(val) => {
                                                            setSalaryMin(val);
                                                            if (salaryMax !== null && val > salaryMax) setSalaryMaxError("Max must be > Min");
                                                            else setSalaryMaxError("");
                                                        }}

                                                        className={`w-full custom-department-select ${salaryMinError ? '!border-red-500' : ''}`}
                                                        placeholder="Min"
                                                        options={salaryBracketOptions}
                                                        showSearch
                                                    />
                                                </div>
                                                <span className="text-gray-500 text-sm">to</span>
                                                <div className="flex-1">
                                                    <Select
                                                        size="large"
                                                        value={salaryMax || undefined}
                                                        onChange={(val) => {
                                                            setSalaryMax(val);
                                                            if (salaryMin !== null && val < salaryMin) setSalaryMaxError("Max must be > Min");
                                                            else setSalaryMaxError("");
                                                        }}

                                                        className={`w-full custom-department-select ${salaryMaxError ? '!border-red-500' : ''}`}
                                                        placeholder="Max"
                                                        options={salaryBracketOptions}
                                                        showSearch
                                                    />
                                                </div>
                                            </div>
                                            {(salaryMinError || salaryMaxError) && <p className="text-red-500 text-xs">{salaryMinError || salaryMaxError}</p>}
                                        </div>

                                        {/* Variable */}
                                        <div className="flex flex-col gap-2">
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="text-[15px] text-[#0e2c53]">Variable</label>
                                                <div className="flex bg-[#f3f4f6] rounded-full p-[3px] border border-[#e5e7eb]">
                                                    <button onClick={() => setVariableFormat("Annually")} className={`px-4 py-1 text-[13px] rounded-full transition-all ${variableFormat === "Annually" ? 'bg-white shadow-sm font-medium text-gray-900 border border-[#e5e7eb]' : 'text-gray-600 hover:text-gray-800'}`}>Annually</button>
                                                    <button onClick={() => setVariableFormat("Monthly")} className={`px-4 py-1 text-[13px] rounded-full transition-all ${variableFormat === "Monthly" ? 'bg-white shadow-sm font-medium text-gray-900 border border-[#e5e7eb]' : 'text-gray-600 hover:text-gray-800'}`}>Monthly</button>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-[70px] h-[40px] border border-[#d9d9d9] bg-white rounded-lg flex items-center justify-center text-gray-500 text-[14px]">
                                                    {currency === 'INR' ? '₹' : '$'}
                                                </div>
                                                <div className="flex-1">
                                                    <InputNumber
                                                        size="large"
                                                        value={variableAmount}
                                                        onChange={setVariableAmount}

                                                        className="w-full rounded-lg custom-salary-input"
                                                        placeholder="Variable amount"
                                                        formatter={(value) => value ? new Intl.NumberFormat('en-IN').format(value) : ''}
                                                        parser={(value) => value?.replace(/,/g, '')}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bonus */}
                                        {!showBonus ? (
                                            <div>
                                                <button onClick={() => setShowBonus(true)} className="text-[#0A66C2] font-medium flex items-center hover:underline text-[15px]">
                                                    <PlusOutlined className="text-[12px] mr-1.5" /> Add bonus
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-2">
                                                <div className="flex justify-between items-center mb-1">
                                                    <label className="text-[15px] text-[#0e2c53] flex items-center gap-2">
                                                        Bonus
                                                        <CloseOutlined className="text-gray-400 hover:text-red-500 cursor-pointer text-[12px]" onClick={() => { setShowBonus(false); setBonusAmount(""); }} />
                                                    </label>
                                                    <div className="flex bg-[#f3f4f6] rounded-full p-[3px] border border-[#e5e7eb]">
                                                        <button onClick={() => setBonusFormat("Annually")} className={`px-4 py-1 text-[13px] rounded-full transition-all ${bonusFormat === "Annually" ? 'bg-white shadow-sm font-medium text-gray-900 border border-[#e5e7eb]' : 'text-gray-600 hover:text-gray-800'}`}>Annually</button>
                                                        <button onClick={() => setBonusFormat("Monthly")} className={`px-4 py-1 text-[13px] rounded-full transition-all ${bonusFormat === "Monthly" ? 'bg-white shadow-sm font-medium text-gray-900 border border-[#e5e7eb]' : 'text-gray-600 hover:text-gray-800'}`}>Monthly</button>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-[70px] h-[40px] border border-[#d9d9d9] bg-white rounded-lg flex items-center justify-center text-gray-500 text-[14px]">
                                                        {currency === 'INR' ? '₹' : '$'}
                                                    </div>
                                                    <div className="flex-1">
                                                        <InputNumber
                                                            size="large"
                                                            value={bonusAmount}
                                                            onChange={setBonusAmount}

                                                            className="w-full rounded-lg custom-salary-input"
                                                            placeholder="Bonus amount"
                                                            formatter={(value) => value ? new Intl.NumberFormat('en-IN').format(value) : ''}
                                                            parser={(value) => value?.replace(/,/g, '')}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Salary breakup box */}
                                        {(salaryMin || salaryMax || variableAmount || bonusAmount) && (
                                            <div className="bg-gradient-to-br from-blue-50/80 via-blue-50/50 to-sky-50/40 border border-blue-100 rounded-xl p-6 mt-0 shadow-sm">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-[#0A66C2]">
                                                        <CircleDollarSign size={18} />
                                                    </div>
                                                    <h4 className="text-slate-900 font-semibold text-[16px]">Salary Breakup Overview</h4>
                                                </div>

                                                {/* Breakup rows */}
                                                <div className="space-y-3 mb-4">
                                                    <div className="flex justify-between items-center bg-white/60 p-3 rounded-lg">
                                                        <span className="text-slate-700 font-medium text-[14px]">Fixed Salary (Annually)</span>
                                                        <span className="text-gray-900 font-semibold text-[14px]">
                                                            {(() => {
                                                                const sMin = (salaryMin || 0) * (fixedFormat === "Monthly" ? 12 : 1);
                                                                const sMax = (salaryMax || 0) * (fixedFormat === "Monthly" ? 12 : 1);
                                                                if (!sMin && !sMax) return "-";
                                                                if (!sMax) return `${currency === 'INR' ? '₹' : '$'} ${formatLac(sMin)} Lac${sMin > 100000 ? 's' : ''}`;
                                                                return `${currency === 'INR' ? '₹' : '$'} ${formatLac(sMin)} - ${formatLac(sMax)} Lac${sMax > 100000 ? 's' : ''}`;
                                                            })()}
                                                        </span>
                                                    </div>
                                                    {variableAmount && (
                                                        <div className="flex justify-between items-center bg-white/60 p-3 rounded-lg">
                                                            <span className="text-slate-700 font-medium text-[14px]">Variable (Annually)</span>
                                                            <span className="text-gray-900 font-semibold text-[14px]">
                                                                {currency === 'INR' ? '₹' : '$'} {new Intl.NumberFormat('en-IN').format(variableAmount * (variableFormat === "Monthly" ? 12 : 1))}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {showBonus && bonusAmount && (
                                                        <div className="flex justify-between items-center bg-white/60 p-3 rounded-lg">
                                                            <span className="text-slate-700 font-medium text-[14px]">Bonus (Annually)</span>
                                                            <span className="text-gray-900 font-semibold text-[14px]">
                                                                {currency === 'INR' ? '₹' : '$'} {new Intl.NumberFormat('en-IN').format(bonusAmount * (bonusFormat === "Monthly" ? 12 : 1))}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="border-t border-blue-200/60 pt-4 space-y-3">
                                                    <div className="flex justify-between items-center px-2">
                                                        <span className="text-slate-900 font-medium text-[14px]">Total Monthly CTC</span>
                                                        <span className="text-[#0A66C2] font-bold text-[15px]">
                                                            {(() => {
                                                                const sMin = (salaryMin || 0) / (fixedFormat === "Annually" ? 12 : 1);
                                                                const sMax = (salaryMax || 0) / (fixedFormat === "Annually" ? 12 : 1);
                                                                const varM = (variableAmount || 0) / (variableFormat === "Annually" ? 12 : 1);
                                                                const bonM = (showBonus && bonusAmount ? bonusAmount : 0) / (bonusFormat === "Annually" ? 12 : 1);

                                                                const minCTC = sMin + varM + bonM;
                                                                const maxCTC = (sMax || sMin) + varM + bonM;

                                                                if (!minCTC && !maxCTC) return "-";
                                                                if (minCTC === maxCTC) return `${currency === 'INR' ? '₹' : '$'} ${new Intl.NumberFormat('en-IN').format(Math.round(minCTC))}`;
                                                                return `${currency === 'INR' ? '₹' : '$'} ${new Intl.NumberFormat('en-IN').format(Math.round(minCTC))} - ${new Intl.NumberFormat('en-IN').format(Math.round(maxCTC))}`;
                                                            })()}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center px-2">
                                                        <span className="text-slate-900 font-medium text-[14px]">Total Yearly CTC</span>
                                                        <span className="text-[#0A66C2] font-bold text-[15px]">
                                                            {(() => {
                                                                const sMin = (salaryMin || 0) * (fixedFormat === "Monthly" ? 12 : 1);
                                                                const sMax = (salaryMax || 0) * (fixedFormat === "Monthly" ? 12 : 1);
                                                                const varA = (variableAmount || 0) * (variableFormat === "Monthly" ? 12 : 1);
                                                                const bonA = (showBonus && bonusAmount ? bonusAmount : 0) * (bonusFormat === "Monthly" ? 12 : 1);

                                                                const minCTC = sMin + varA + bonA;
                                                                const maxCTC = (sMax || sMin) + varA + bonA;

                                                                if (!minCTC && !maxCTC) return "-";
                                                                if (minCTC === maxCTC) return `${currency === 'INR' ? '₹' : '$'} ${formatLac(minCTC)} Lac${minCTC > 100000 ? 's' : ''}`;
                                                                return `${currency === 'INR' ? '₹' : '$'} ${formatLac(minCTC)} - ${formatLac(maxCTC)} Lac${maxCTC > 100000 ? 's' : ''}`;
                                                            })()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <label className="flex items-center gap-2 cursor-pointer w-max mt-3">
                                    <input
                                        type="checkbox"
                                        checked={hideSalary}
                                        onChange={(e) => setHideSalary(e.target.checked)}
                                        className="w-4 h-4 rounded border-[#d9d9d9] text-[#0A66C2] focus:ring-[#0A66C2]"
                                    />
                                    <span className="text-[14px] text-[#0e2c53]">Hide salary details from candidates</span>
                                </label>
                            </div>

                            <div>
                                <label className="block text-[15px] font-semibold text-gray-700 mb-2">Your industry</label>
                                <AutoComplete
                                    className="w-full custom-department-select"
                                    size="large"
                                    placeholder="Select or enter industry"
                                    value={industry}
                                    onChange={setIndustry}
                                    options={industryOptions.filter(opt => opt.label.toLowerCase().includes((industry || "").toLowerCase()))}
                                />
                            </div>

                            <div>
                                <label className="block text-[15px] font-semibold text-gray-700 mb-2">No. of vacancies for this job</label>
                                <div className="flex items-center gap-2">
                                    <button
                                        className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                                        onClick={() => setJobOpenings(Math.max(1, (parseInt(jobOpenings) || 0) - 1))}
                                    >
                                        <MinusOutlined className="text-[12px]" />
                                    </button>
                                    <input
                                        type="number"
                                        value={jobOpenings}
                                        onChange={(e) => setJobOpenings(e.target.value)}
                                        className="w-16 h-10 text-center border border-gray-300 rounded-lg outline-none focus:border-[#0A66C2] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <button
                                        className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                                        onClick={() => setJobOpenings((parseInt(jobOpenings) || 0) + 1)}
                                    >
                                        <PlusOutlined className="text-[12px]" />
                                    </button>
                                </div>
                            </div>


                        </div>
                    </motion.div>
                );
            case 1:
                return (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8 max-w-2xl"
                    >
                        <div className="flex items-center gap-4 mb-2">
                            <h2 className="text-2xl font-semibold text-gray-900">Candidate preferences</h2>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[15px] font-semibold text-[#0e2c53] mb-2">Add skills</label>
                                <Select
                                    mode="tags"
                                    className="w-full custom-benefits-select"
                                    size="large"
                                    showSearch
                                    placeholder="Type skill"
                                    value={skillsRequired}
                                    options={skillsRequiredOptions}
                                    onChange={setSkillsRequired}
                                    menuItemSelectedIcon={null}
                                    tagRender={(props) => {
                                        const { label, closable, onClose } = props;
                                        return (
                                            <span
                                                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 my-1 mr-2 rounded-full border border-[#0A66C2] text-[#0A66C2] bg-white text-[14px]"
                                            >
                                                ★ {label}
                                                {closable && <CloseOutlined onClick={onClose} className="text-[10px] ml-1 cursor-pointer text-gray-400 hover:text-[#0A66C2]" />}
                                            </span>
                                        );
                                    }}
                                    optionRender={(option) => {
                                        const isSelected = skillsRequired.includes(option.value);
                                        return (
                                            <div className={`flex justify-between items-center w-full px-1 py-0.5 ${isSelected ? 'font-medium' : ''}`}>
                                                <span className={`text-[15px] ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>{option.label}</span>
                                                {isSelected && <CheckOutlined className="text-[#0A66C2] font-bold text-[14px]" />}
                                            </div>
                                        );
                                    }}
                                />
                                <div className="mt-2">
                                    <p className="text-[13px] text-[#0e2c53] mb-2 font-medium">Suggestions</p>
                                    <div className="flex flex-wrap gap-2.5">
                                        {["WAN", "Firewall", "Wireless", "Modem", "Switching", "VLAN", "CCNA", "Cisco"].map(skill => (
                                            <button
                                                key={skill}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (!skillsRequired.includes(skill)) setSkillsRequired([...skillsRequired, skill]);
                                                }}
                                                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-dashed border-gray-300 text-gray-600 bg-white hover:border-[#0A66C2] hover:text-[#0A66C2] transition-colors text-[14px]"
                                            >
                                                <PlusOutlined className="text-[12px]" /> {skill}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[15px] font-semibold text-[#0e2c53] mb-2">Educational qualification</label>
                                <Select
                                    mode="tags"
                                    className={`w-full custom-benefits-select ${educationalQualificationError ? '!border-red-600' : ''}`}
                                    size="large"
                                    placeholder="Add more education"
                                    value={educationalDegree}
                                    open={eduDropdownOpen}
                                    onOpenChange={(visible) => {
                                        setEduDropdownOpen(visible);
                                        if (!visible) setTimeout(() => setEduMenuStack([]), 300);
                                    }}
                                    onChange={(val) => {
                                        setEducationalDegree(val);
                                        if (val.length > 0) setEducationalQualificationError("");
                                    }}
                                    popupRender={() => {
                                        const currentLevel = eduMenuStack.length === 0 ? 'root' : eduMenuStack[eduMenuStack.length - 1].id;
                                        let currentItems = [];
                                        if (currentLevel === 'root') currentItems = ROOT_EDUCATION;
                                        else if (LEVEL2_EDUCATION[currentLevel]) currentItems = LEVEL2_EDUCATION[currentLevel];
                                        else currentItems = specializationData;

                                        return (
                                            <div className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col w-full">
                                                {eduMenuStack.length > 0 && (
                                                    <div
                                                        className="flex items-center gap-3 px-4 py-3 bg-[#f0f5fa] cursor-pointer text-[#0e2c53] font-medium border-b border-gray-200 hover:bg-[#e6f0f9] transition-colors"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setEduMenuStack(prev => prev.slice(0, -1));
                                                        }}
                                                    >
                                                        <LeftOutlined className="text-[12px]" />
                                                        {eduMenuStack[eduMenuStack.length - 1].title}
                                                    </div>
                                                )}
                                                <div className="overflow-y-auto max-h-[300px] py-1">
                                                    {currentItems.map(item => {
                                                        const isSelected = educationalDegree.includes(item.title);
                                                        return (
                                                            <div
                                                                key={item.title}
                                                                className="flex items-center justify-between px-4 py-2.5 hover:bg-blue-50 cursor-pointer group"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    if (item.hasChildren) {
                                                                        setEduMenuStack([...eduMenuStack, item]);
                                                                    } else {
                                                                        if (isSelected) setEducationalDegree(educationalDegree.filter(val => val !== item.title));
                                                                        else {
                                                                            setEducationalDegree([...educationalDegree, item.title]);
                                                                            if (educationalQualificationError) setEducationalQualificationError("");
                                                                        }
                                                                    }
                                                                }}
                                                            >
                                                                <div className="flex items-center gap-3 flex-1">
                                                                    {item.showCheckbox !== false && (
                                                                        <Checkbox
                                                                            checked={isSelected}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                if (isSelected) setEducationalDegree(educationalDegree.filter(val => val !== item.title));
                                                                                else {
                                                                                    setEducationalDegree([...educationalDegree, item.title]);
                                                                                    if (educationalQualificationError) setEducationalQualificationError("");
                                                                                }
                                                                            }}
                                                                        />
                                                                    )}
                                                                    <span className={`text-[14px] ${isSelected ? 'text-[#0A66C2] font-medium' : 'text-gray-700 group-hover:text-gray-900'}`}>
                                                                        {item.title}
                                                                    </span>
                                                                </div>
                                                                {item.hasChildren && (
                                                                    <RightOutlined
                                                                        className="text-gray-400 text-[12px] p-1 group-hover:text-[#0A66C2]"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setEduMenuStack([...eduMenuStack, item]);
                                                                        }}
                                                                    />
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    }}
                                    menuItemSelectedIcon={null}
                                    tagRender={(props) => {
                                        const { label, closable, onClose } = props;
                                        return (
                                            <span
                                                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 my-1 mr-2 rounded-full border border-[#0A66C2] text-[#0A66C2] bg-white text-[14px]"
                                            >
                                                {label}
                                                {closable && <CloseOutlined onClick={onClose} className="text-[10px] ml-1 cursor-pointer text-gray-400 hover:text-[#0A66C2]" />}
                                            </span>
                                        );
                                    }}
                                />
                                {educationalQualificationError && <p className="text-red-700 text-[13px] mt-1 mb-0">{educationalQualificationError}</p>}
                            </div>

                            <div>
                                <label className="block text-[15px] font-semibold text-[#0e2c53] mb-2">Candidate's industry you are looking to hire from <span className="text-gray-400 font-normal">(Optional)</span></label>
                                <Select
                                    mode="multiple"
                                    className="w-full custom-benefits-select"
                                    size="large"
                                    placeholder="Select the industry you're looking to hire from"
                                    value={candidateIndustry}
                                    onChange={setCandidateIndustry}
                                    options={industryOptions}
                                    showSearch
                                    menuItemSelectedIcon={null}
                                    tagRender={(props) => {
                                        const { label, closable, onClose } = props;
                                        return (
                                            <span
                                                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 my-1 mr-2 rounded-full border border-[#0A66C2] text-[#0A66C2] bg-white text-[14px]"
                                            >
                                                {label}
                                                {closable && <CloseOutlined onClick={onClose} className="text-[10px] ml-1 cursor-pointer text-gray-400 hover:text-[#0A66C2]" />}
                                            </span>
                                        );
                                    }}
                                    optionRender={(option) => {
                                        const isSelected = candidateIndustry.includes(option.value);
                                        return (
                                            <div className={`flex justify-between items-center w-full px-1 py-0.5 ${isSelected ? 'font-medium' : ''}`}>
                                                <span className={`text-[15px] ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>{option.label}</span>
                                                {isSelected && <CheckOutlined className="text-[#0A66C2] font-bold text-[14px]" />}
                                            </div>
                                        );
                                    }}
                                />
                            </div>
                            <style>{`
                                .custom-benefits-select .ant-select-selector {
                                    padding: 4px 8px !important;
                                    border-radius: 8px !important;
                                }
                                .custom-benefits-select .ant-select-item-option-selected {
                                    background-color: #EAF3FC !important;
                                }
                                .custom-benefits-select .ant-select-item-group {
                                    font-size: 11px;
                                    color: #8c8c8c;
                                    text-transform: uppercase;
                                    letter-spacing: 0.5px;
                                    font-weight: 500;
                                    padding-left: 12px;
                                }
                            `}</style>
                        </div>
                    </motion.div>
                );
            case 3:
                return (
                    <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8 max-w-2xl"
                    >
                        <div className="flex items-center gap-4 mb-2">
                            <h2 className="text-2xl font-semibold text-gray-900">Screening questions</h2>
                        </div>

                        <div className="space-y-4">
                            {postQuestions.map((q, index) => (
                                <div key={index} className="bg-white border border-gray-100 rounded-lg p-3 shadow-sm relative group flex justify-between items-center">
                                    <div className="flex-1 flex items-center gap-2">
                                        <span className="text-[#0e2c53] font-medium text-[15px]">{index + 1}.</span>
                                        <span className="text-[15px] text-[#0e2c53] font-medium flex-1">
                                            {q.question || "Enter your question here..."}
                                        </span>
                                        {q.isrequired === 1 && <span className="text-[14px] text-gray-500 whitespace-nowrap font-normal">(Mandatory)</span>}
                                    </div>
                                    <Dropdown
                                        menu={{
                                            items: [
                                                {
                                                    key: 'edit', label: 'Edit', icon: <EditOutlined />, onClick: () => {
                                                        setCurrentEditingQuestion({
                                                            index,
                                                            data: {
                                                                question: q.question || '',
                                                                isrequired: q.isrequired || 0,
                                                                type: q.type || 'Short answer',
                                                                options: q.options || ['Option 1', 'Option 2']
                                                            }
                                                        });
                                                        setIsQuestionModalVisible(true);
                                                    }
                                                },
                                                { key: 'delete', label: 'Delete', icon: <DeleteOutlined />, danger: true, onClick: () => handleRemoveQuestion(index) }
                                            ]
                                        }}
                                        trigger={['click']}
                                        placement="bottomRight"
                                    >
                                        <button className="text-gray-600 p-1 hover:bg-gray-100 rounded cursor-pointer">
                                            <MoreOutlined className="text-[18px]" />
                                        </button>
                                    </Dropdown>
                                </div>
                            ))}

                            <button
                                onClick={handleAddQuestion}
                                className="w-full py-2 rounded-lg border border-[#0A66C2] text-[#0A66C2] font-semibold text-[15px] hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 mt-3"
                            >
                                <PlusOutlined /> Add a question
                            </button>

                            <div className="pt-4">
                                <p className="text-[15px] text-[#0e2c53] mb-4">Suggested questions:</p>
                                <div className="flex flex-col gap-3 items-start">
                                    {["What is your expected CTC in Lacs per annum?", "What is your notice period?", "How many years of experience do you have in LAN?", "Are you currently residing in Ahmedabad or willing to relocate to Ahmedabad?"].map((sq, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleAddSuggestedQuestion(sq)}
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-dashed border-gray-300 text-gray-500 text-[14px] hover:border-[#0A66C2] hover:text-[#0A66C2] transition-colors bg-white"
                                        >
                                            <PlusOutlined className="text-[12px]" /> {sq}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );
            case 2:
                return (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8 max-w-3xl"
                    >
                        <div className="flex items-center gap-4 mb-2">
                            <h2 className="text-2xl font-semibold text-gray-900">Job description & Preferences</h2>
                        </div>

                        <div>
                            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                                <ReactQuill
                                    ref={quillRef}
                                    theme="snow"
                                    value={value}
                                    onChange={handleChange}
                                    modules={{
                                        toolbar: [
                                            [{ 'header': [1, 2, 3, false] }],
                                            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                                            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                            ['link'],
                                            ['clean']
                                        ]
                                    }}
                                    formats={[
                                        'header',
                                        'bold', 'italic', 'underline', 'strike', 'blockquote',
                                        'list',
                                        'link'
                                    ]}
                                    style={{ height: '400px', border: 'none' }}
                                />
                            </div>
                            <style>{`
                                .ql-toolbar { border: none !important; border-bottom: 1px solid #e5e7eb !important; background: #f9fafb; border-radius: 8px 8px 0 0; }
                                .ql-container { border: none !important; height: 400px; font-family: inherit; font-size: 15px;}
                            `}</style>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[15px] font-semibold text-gray-700 mb-2">Gender preference</label>
                                <div className="flex flex-wrap gap-2">
                                    {["Any", "Male", "Female"].map(g => (
                                        <button
                                            key={g}
                                            onClick={() => setGenderPreference(g)}
                                            className={`px-4 py-2 rounded-full border-1 text-sm font-medium transition-all ${genderPreference === g ? 'border-[#0A66C2] text-[#0A66C2] bg-blue-50/50' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[15px] font-semibold text-gray-700 mb-3">Languages known <span className="text-gray-400 font-normal">(Optional)</span></label>
                                <div className="flex flex-wrap gap-2">
                                    {popularLanguages.map(lang => (
                                        <button
                                            key={lang}
                                            onClick={() => toggleLanguageSelection(lang)}
                                            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border-1 text-sm transition-all ${languages.includes(lang) ? 'border-[#0A66C2] text-[#0A66C2] bg-white' : 'border-gray-300 text-gray-600 hover:border-gray-400 bg-white'}`}
                                        >
                                            {languages.includes(lang) ? <CheckOutlined className="text-[12px]" /> : <PlusOutlined className="text-[12px]" />}
                                            {lang}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="">
                                <label className="block text-[15px] font-semibold text-gray-700 mb-2">Perks and benefits <span className="text-gray-400 font-normal">(Optional)</span></label>
                                <Select
                                    mode="multiple"
                                    allowClear
                                    className="w-full custom-benefits-select"
                                    size="large"
                                    placeholder="Search for perks and benefits"
                                    value={selectedBenefits}
                                    onChange={(val) => setSelectedBenefits(val)}
                                    options={groupedBenefits}
                                    menuItemSelectedIcon={null}
                                    tagRender={(props) => {
                                        const { label, closable, onClose } = props;
                                        return (
                                            <span
                                                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                                className="inline-flex items-center gap-1.5 px-3 py-1 my-1 mr-1.5 rounded-full border border-[#0A66C2] text-[#0A66C2] bg-white text-[14px]"
                                            >
                                                {label}
                                                {closable && <CloseOutlined onClick={onClose} className="text-[12px] cursor-pointer text-gray-400 hover:text-[#0A66C2]" />}
                                            </span>
                                        );
                                    }}
                                    optionRender={(option) => {
                                        const isSelected = selectedBenefits.includes(option.value);
                                        return (
                                            <div className={`flex justify-between items-center w-full px-1 py-0.5 ${isSelected ? 'font-medium' : ''}`}>
                                                <span className={`text-[15px] ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>{option.label}</span>
                                                <Checkbox checked={isSelected} className="pointer-events-none" />
                                            </div>
                                        );
                                    }}
                                />
                                <div className="mt-2">
                                    <p className="text-[14px] text-gray-600 mb-2">Suggestions</p>
                                    <div className="flex flex-wrap gap-2">
                                        {suggestedBenefits.map((benefit, i) => (
                                            <button
                                                key={i}
                                                onClick={() => {
                                                    if (!selectedBenefits.includes(benefit)) {
                                                        setSelectedBenefits([...selectedBenefits, benefit]);
                                                    }
                                                }}
                                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 text-gray-700 text-[14px] hover:border-gray-300 transition-colors bg-white"
                                            >
                                                <PlusOutlined className="text-[12px] text-gray-500" />
                                                {benefit}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <style>{`
                                .custom-benefits-select .ant-select-selector {
                                    padding: 4px 8px !important;
                                    border-radius: 8px !important;
                                }
                            `}</style>
                    </motion.div>
                );
            case 4:
                return (
                    <motion.div
                        key="step4"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8 max-w-2xl"
                    >
                        <div className="bg-white">
                            <label className="block text-[15px] font-semibold text-[#0e2c53] mb-3">Is this a walk-in job?</label>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setIsWalkIn(true)}
                                    className={`px-6 py-1.5 rounded-full border text-[14px] font-medium transition-colors ${isWalkIn
                                        ? 'border-[#0A66C2] text-[#0A66C2] bg-[#f0f5fa]'
                                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                                        }`}
                                >
                                    Yes
                                </button>
                                <button
                                    onClick={() => setIsWalkIn(false)}
                                    className={`px-6 py-1.5 rounded-full border text-[14px] font-medium transition-colors ${!isWalkIn
                                        ? 'border-[#0A66C2] text-[#0A66C2] bg-[#f0f5fa]'
                                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                                        }`}
                                >
                                    No
                                </button>
                            </div>
                        </div>

                        {isWalkIn && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-6 overflow-hidden"
                            >
                                <div>
                                    <label className="block text-[14px] font-medium text-[#0e2c53] mb-2">Walk-in duration</label>
                                    <div className="flex items-center gap-4">
                                        <DatePicker
                                            className="w-48 py-2.5 rounded-lg border-gray-300 focus:border-[#0A66C2]"
                                            placeholder="Choose start date"
                                            onChange={(date) => setWalkInStartDate(date)}
                                        />
                                        <span className="text-gray-500 text-[14px]">to</span>
                                        <DatePicker
                                            className="w-48 py-2.5 rounded-lg border-gray-300 focus:border-[#0A66C2]"
                                            placeholder="Choose end date"
                                            onChange={(date) => setWalkInEndDate(date)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[14px] font-medium text-[#0e2c53] mb-2">Walk-in timing</label>
                                    <TimePicker.RangePicker
                                        use12Hours
                                        format="h:mm a"
                                        className="w-full max-w-md py-2.5 rounded-lg border-gray-300 focus:border-[#0A66C2]"
                                        onChange={(times) => setWalkInTiming(times)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-[14px] font-medium text-[#0e2c53] mb-2">Contact details</label>
                                    <div className="flex items-center gap-4 max-w-md mb-2">
                                        <input
                                            type="text"
                                            placeholder="Recruiter name (if available)"
                                            className="w-1/2 px-3 py-2.5 rounded-lg border border-gray-300 focus:border-[#0A66C2] outline-none text-[14px]"
                                            value={recruiterName}
                                            onChange={(e) => setRecruiterName(e.target.value)}
                                        />
                                        <div className="w-1/2 flex items-center border border-gray-300 rounded-lg focus-within:border-[#0A66C2] overflow-hidden bg-white">
                                            <span className="px-3 py-2.5 bg-gray-50 text-gray-500 border-r border-gray-300 text-[14px]">+91</span>
                                            <input
                                                type="text"
                                                placeholder="Mobile number"
                                                className="w-full px-3 py-2.5 outline-none text-[14px]"
                                                value={mobileNumber}
                                                onChange={(e) => setMobileNumber(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <p className="text-gray-500 text-[13px] flex items-center gap-1 mt-2">
                                        <InfoCircleOutlined className="text-[12px]" /> This will be visible to candidates
                                    </p>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between max-w-md mb-2">
                                        <label className="block text-[14px] font-medium text-[#0e2c53]">Venue address</label>
                                        <Dropdown
                                            menu={{ items: venueMenuItems }}
                                            trigger={['click']}
                                            placement="bottomRight"
                                        >
                                            <button className="text-[#0A66C2] text-[13px] hover:underline flex items-center gap-1">
                                                Select a previous venue <DownOutlined className="text-[10px]" />
                                            </button>
                                        </Dropdown>
                                    </div>
                                    <div className="max-w-md border border-gray-200 rounded-lg overflow-hidden bg-white">
                                        <div className="p-3 border-b border-gray-100">
                                            <textarea
                                                className="w-full text-[14px] text-gray-800 outline-none resize-none bg-transparent placeholder-gray-400"
                                                rows={2}
                                                placeholder="Type address here..."
                                                value={venueAddress}
                                                onChange={(e) => setVenueAddress(e.target.value)}
                                            />
                                        </div>
                                        <div className="p-3 bg-white">
                                            <label className="block text-[14px] font-medium text-[#0e2c53] mb-1">Google Maps URL</label>
                                            <input
                                                type="text"
                                                className="w-full text-[13px] text-gray-500 outline-none bg-transparent placeholder-gray-400"
                                                placeholder="Google Maps URL of venue"
                                                value={googleMapsUrl}
                                                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        <div className="pt-2">
                            <label className="block text-[15px] font-semibold text-[#0e2c53] mb-3">Collaborate with team members to manage responses</label>
                            <div className="border border-gray-200 rounded-lg p-3 max-w-2xl bg-white text-left">
                                <div className="flex flex-wrap items-center gap-3 mb-6">
                                    {teamMembers.map((member) => (
                                        <div key={member.id} className="inline-flex items-center gap-2 bg-[#f0f5fa] rounded-full pl-2 pr-4 py-1.5">
                                            <div className="w-7 h-7 rounded-full bg-[#d0e5ff] text-[#0A66C2] flex items-center justify-center text-[11px] font-semibold">
                                                {member.email.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-[14px] text-gray-700 font-medium">{member.email}</span>
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <button
                                        onClick={() => setIsMemberModalVisible(true)}
                                        className="text-gray-400 font-medium text-[14px] hover:text-[#0A66C2] transition-colors"
                                    >
                                        Add members
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans flex flex-col">
            {/* Top Navigation */}
            <div className="w-full bg-white border-b border-gray-100 px-6 py-6 lg:px-12 shrink-0 hidden md:block">
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center gap-3 mb-6">
                        <button
                            type="button"
                            onClick={() => {
                                if (typeof window !== 'undefined' && window.history.length > 1) {
                                    navigate(-1);
                                } else {
                                    navigate('/my-jobs');
                                }
                            }}
                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 transition-all shadow-xs active:scale-95 cursor-pointer"
                            title="Go back"
                            aria-label="Back"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <h1 className="text-[22px] mb-0 font-bold text-gray-900 tracking-tight">Post a job</h1>
                        {subscription && (
                            <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold ${activeJobsRemaining <= 0
                                ? 'bg-amber-50 text-amber-800 border-1 border-amber-200'
                                : 'bg-blue-50 text-[#0A66C2] border-1 border-blue-100'
                                }`}>
                                <span>Active: {activeJobsCount}/{activeJobsLimit}</span>
                                {activeJobsRemaining <= 0 ? (
                                    <span className="text-[10px] font-bold uppercase bg-amber-200/80 px-1.5 py-0.5 rounded text-amber-900">0 Free</span>
                                ) : (
                                    <span className="text-gray-500 font-normal">({activeJobsRemaining} left)</span>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center w-full">
                        {STEPS.map((step, idx) => {
                            const isActive = currentStep === idx;
                            const isCompleted = completedSteps.includes(idx);
                            const isLast = idx === STEPS.length - 1;

                            return (
                                <div
                                    key={step.id}
                                    className={`flex items-center cursor-pointer group opacity-100 ${!isLast ? 'flex-1' : ''}`}
                                    onClick={() => {
                                        if (isCompleted || isActive) setCurrentStep(idx);
                                    }}
                                >
                                    <div className="flex items-center">
                                        {(isActive || isCompleted) ? (
                                            <div className="w-6 h-6 rounded-full bg-[#0A66C2] flex items-center justify-center relative z-10 border border-[#0A66C2]">
                                                <CheckOutlined className="text-white text-[12px] font-bold" />
                                            </div>
                                        ) : (
                                            <div className="w-6 h-6 rounded-full border border-gray-300 bg-white relative z-10 group-hover:border-gray-400 transition-colors" />
                                        )}
                                        <h3 className={`ml-3 text-[14px] mb-0 whitespace-nowrap transition-colors ${isActive ? 'text-[#0A66C2] font-semibold' : 'text-[#9ca3af] font-medium group-hover:text-gray-700'}`}>
                                            {step.title}
                                        </h3>
                                    </div>

                                    {!isLast && (
                                        <div className={`flex-1 h-[1px] mx-4 transition-colors ${isCompleted ? 'bg-[#0A66C2]' : 'bg-gray-200'}`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Mobile Header (Fallback) */}
            <div className="md:hidden p-4 border-b border-gray-200 flex flex-col gap-2 bg-white">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                if (typeof window !== 'undefined' && window.history.length > 1) {
                                    navigate(-1);
                                } else {
                                    navigate('/my-jobs');
                                }
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95"
                            title="Go back"
                            aria-label="Back"
                        >
                            <ArrowLeft size={16} />
                        </button>
                        <h1 className="text-lg font-bold text-gray-900 mb-0 flex items-center gap-1.5">
                            Post a job <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] rounded">Free</span>
                        </h1>
                    </div>
                    <span className="text-sm font-medium text-gray-500">Step {currentStep + 1} of {STEPS.length}</span>
                </div>
                <h3 className="text-[#0A66C2] font-semibold text-sm">{STEPS[currentStep].title}</h3>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-white">
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 md:p-6 w-full max-w-5xl mx-auto pb-32">
                        {/* Proactive Quota Warning Banner */}
                        {isLimitReached && (
                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-1 border-amber-200/80 rounded-2xl p-3 md:p-4 mb-6 shadow-sm">
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                    <div className="flex items-start gap-3.5">
                                        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5 md:mt-0">
                                            <AlertTriangle size={20} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="font-bold text-gray-900 text-sm mb-0">
                                                    {isSubRecruiter && isCompanyLimitReached
                                                        ? `Company Plan Limit Reached (Active Slots & Monthly Posts Exhausted)`
                                                        : isActiveLimitReached
                                                            ? `Active Job Limit Reached (${activeJobsCount}/${activeJobsLimit} Slots Used${pendingJobsCount > 0 ? `, ${pendingJobsCount} Pending Review` : ''})`
                                                            : `Monthly Posting Limit Reached (${jobPostsUsed}/${jobPostsLimit} Posts Used)`}
                                                </h4>
                                                <span className="px-2 py-0.5 bg-amber-200/70 text-amber-900 text-[11px] font-bold rounded-full">{planName} Plan</span>
                                            </div>
                                            <p className="text-xs text-gray-600 mt-1 mb-0 leading-relaxed">
                                                {isSubRecruiter
                                                    ? `Your organization's subscription plan has filled all available active job slots or monthly postings. As a sub-recruiter, you cannot publish new jobs until your primary recruiter closes an active job or upgrades the plan.`
                                                    : isActiveLimitReached
                                                        ? `You currently have 0 active job slots available. You can fill out this job now, but to publish it, please either close an existing job from your dashboard or upgrade your plan.`
                                                        : `You have used all ${jobPostsLimit} monthly job posts included in your ${planName} Plan. Please upgrade your subscription plan to post additional jobs.`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
                                        {isSubRecruiter ? (
                                            <button
                                                type="button"
                                                onClick={() => navigate('/overview')}
                                                className="text-xs font-semibold px-3.5 py-2 border border-gray-300 rounded-xl hover:bg-white text-gray-700 transition shadow-xs"
                                            >
                                                Back to Dashboard
                                            </button>
                                        ) : (
                                            <>
                                                {isActiveLimitReached && (
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate('/my-jobs')}
                                                        className="text-xs font-semibold px-3.5 py-2 border border-gray-300 rounded-xl hover:bg-white text-gray-700 transition shadow-xs"
                                                    >
                                                        Manage Active Jobs
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => navigate('/subscription')}
                                                    className="text-xs font-medium px-3.5 py-2 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-xl transition flex items-center gap-1.5 shadow-sm"
                                                >
                                                    <Crown size={14} /> Upgrade Plan
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        <AnimatePresence mode="wait">
                            {renderStepContent()}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="border-t border-gray-100 bg-white p-4 md:px-10 lg:px-16 flex items-center justify-between sticky bottom-0 z-50">
                    <button
                        onClick={handleBack}
                        className="px-6 py-2.5 rounded-full font-medium text-[14px] transition-colors text-gray-600 hover:bg-gray-100"
                    >
                        Back
                    </button>

                    {currentStep < STEPS.length - 1 ? (
                        <button
                            onClick={handleNext}
                            className="bg-[#0A66C2] hover:bg-[#004182] text-white px-8 py-2.5 rounded-full font-medium text-[14px] transition shadow-sm"
                        >
                            Save & Next
                        </button>
                    ) : (
                        <div className="flex items-center gap-3">
                            {activeJobsRemaining <= 0 && (
                                <span className="text-xs text-amber-700 font-medium hidden sm:inline-flex items-center gap-1">
                                    <AlertTriangle size={14} /> 0 active slots available
                                </span>
                            )}
                            <button
                                onClick={handlePublishPost}
                                disabled={isLoading || (isSubRecruiter && isLimitReached)}
                                className="bg-[#0A66C2] hover:bg-[#004182] text-white px-8 py-2.5 rounded-full font-semibold text-sm transition shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : null}
                                {isLoading ? 'Publishing...' : (isSubRecruiter && isLimitReached ? "Publish Job (Quota Full)" : "Publish Job")}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <Modal
                open={isQuestionModalVisible}
                onCancel={() => setIsQuestionModalVisible(false)}
                footer={null}
                width={700}
                closeIcon={<CloseOutlined className="text-gray-500 text-lg" />}
                // title={
                //     <div className="flex items-center justify-between w-full pr-8">
                //         <h2 className="text-xl font-semibold text-gray-900">Add questions</h2>
                //         <button className="text-[#0A66C2] text-[15px] font-medium hover:underline">
                //             Select saved templates <DownOutlined className="text-[12px] ml-1" />
                //         </button>
                //     </div>
                // }
                className="question-modal"
            >
                {currentEditingQuestion && (
                    <div className="border border-gray-200 rounded-lg p-6 mt-4 relative">
                        <h3 className="text-[#0e2c53] font-semibold text-[15px] mb-4">Question {currentEditingQuestion.index + 1}</h3>

                        <div className="flex items-center gap-4 mb-6">
                            <input
                                type="text"
                                value={currentEditingQuestion.data.question}
                                onChange={(e) => updateCurrentEditingQuestion('question', e.target.value)}
                                className="flex-1 px-3 py-2.5 rounded-md border border-gray-300 focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2] outline-none text-[15px]"
                                placeholder="Type your question here"
                            />
                            <div className="flex items-center gap-2 shrink-0">
                                <Switch
                                    checked={currentEditingQuestion.data.isrequired === 1}
                                    onChange={(checked) => updateCurrentEditingQuestion('isrequired', checked ? 1 : 0)}
                                />
                                <span className="text-gray-600 text-[15px]">Mandatory</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 mb-6">
                            <span className="text-gray-500 text-[14px]">Question type:</span>
                            <div className="flex gap-2">
                                {['Single choice', 'Multiple choice', 'Short answer'].map(type => {
                                    const isSelected = currentEditingQuestion.data.type === type;
                                    return (
                                        <button
                                            key={type}
                                            onClick={() => updateCurrentEditingQuestion('type', type)}
                                            className={`px-4 py-1.5 rounded-full text-[14px] transition-all ${isSelected
                                                ? 'border border-[#0A66C2] bg-[#f0f5fa] text-[#0A66C2]'
                                                : 'border border-dashed border-gray-300 text-gray-700 hover:border-gray-400'
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {currentEditingQuestion.data.type === 'Short answer' ? (
                            <div className="mb-6">
                                <div className="w-full px-4 py-3.5 rounded-md border border-gray-200 bg-gray-50 text-gray-400 text-[14px] cursor-not-allowed">
                                    To be answered by the candidates
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 mb-6">
                                {(currentEditingQuestion.data.options || []).map((opt, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        {currentEditingQuestion.data.type === 'Single choice' ? (
                                            <div className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0"></div>
                                        ) : (
                                            <div className="w-4 h-4 rounded-[3px] border-2 border-gray-300 shrink-0"></div>
                                        )}
                                        <input
                                            type="text"
                                            value={opt}
                                            onChange={(e) => {
                                                const newOpts = [...currentEditingQuestion.data.options];
                                                newOpts[i] = e.target.value;
                                                updateCurrentEditingQuestion('options', newOpts);
                                            }}
                                            className="w-[300px] px-3 py-2 rounded-md border border-gray-300 focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2] outline-none text-[14px]"
                                            placeholder={`Option ${i + 1}`}
                                        />
                                    </div>
                                ))}
                                <button
                                    onClick={() => {
                                        const newOpts = [...(currentEditingQuestion.data.options || []), ''];
                                        updateCurrentEditingQuestion('options', newOpts);
                                    }}
                                    className="text-[#0A66C2] text-[14px] font-semibold hover:underline mt-2 inline-flex items-center gap-1"
                                >
                                    + Add another option
                                </button>
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-6 pt-4 border-t border-gray-100 mt-4">
                            <button
                                onClick={() => {
                                    const duplicated = { ...currentEditingQuestion.data };
                                    setPostQuestions([...postQuestions, duplicated]);
                                    setIsQuestionModalVisible(false);
                                }}
                                className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-[14px]"
                            >
                                <CopyOutlined className="text-[16px] opacity-70" /> Duplicate
                            </button>
                            <button
                                onClick={() => {
                                    setIsQuestionModalVisible(false);
                                }}
                                className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-[14px]"
                            >
                                <DeleteOutlined className="text-[16px] opacity-70" /> Remove
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex justify-end mt-6">
                    <button
                        onClick={() => {
                            const newQ = [...postQuestions];
                            newQ[currentEditingQuestion.index] = currentEditingQuestion.data;
                            setPostQuestions(newQ);
                            setIsQuestionModalVisible(false);
                        }}
                        className="px-6 py-2 bg-[#0A66C2] text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
                    >
                        Save Question
                    </button>
                </div>
            </Modal>

            <Modal
                title="Add New Venue"
                open={isVenueModalVisible}
                onCancel={() => setIsVenueModalVisible(false)}
                footer={[
                    <button
                        key="cancel"
                        onClick={() => setIsVenueModalVisible(false)}
                        className="px-4 py-2 border border-gray-300 rounded-full font-medium text-gray-700 hover:bg-gray-50 mr-2"
                    >
                        Cancel
                    </button>,
                    <button
                        key="save"
                        onClick={handleSaveNewVenue}
                        className="px-4 py-2 bg-[#0A66C2] text-white rounded-full font-medium hover:bg-blue-700"
                    >
                        Save
                    </button>
                ]}
            >
                <div className="space-y-4 mt-4">
                    <div>
                        <label className="block text-[14px] font-medium text-[#0e2c53] mb-1">Venue Address</label>
                        <textarea
                            value={newVenueAddress}
                            onChange={(e) => setNewVenueAddress(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2 focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2] outline-none"
                            rows={3}
                            placeholder="Enter full venue address"
                        />
                    </div>
                    <div>
                        <label className="block text-[14px] font-medium text-[#0e2c53] mb-1">Google Maps URL (Optional)</label>
                        <input
                            type="text"
                            value={newVenueUrl}
                            onChange={(e) => setNewVenueUrl(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2 focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2] outline-none"
                            placeholder="https://maps.google.com/..."
                        />
                    </div>
                </div>
            </Modal>

            <Modal
                title="Add Team Member"
                open={isMemberModalVisible}
                onCancel={() => setIsMemberModalVisible(false)}
                footer={[
                    <button
                        key="cancel"
                        onClick={() => setIsMemberModalVisible(false)}
                        className="px-4 py-2 border border-gray-300 rounded-full font-medium text-gray-700 hover:bg-gray-50 mr-2"
                    >
                        Cancel
                    </button>,
                    <button
                        key="save"
                        onClick={handleSaveNewMember}
                        className="px-4 py-2 bg-[#0A66C2] text-white rounded-full font-medium hover:bg-blue-700"
                    >
                        Save
                    </button>
                ]}
            >
                <div className="space-y-4 mt-4">
                    <div>
                        <label className="block text-[14px] font-medium text-[#0e2c53] mb-1">Email Address</label>
                        <input
                            type="email"
                            value={newMemberEmail}
                            onChange={(e) => setNewMemberEmail(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2 focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2] outline-none"
                            placeholder="colleague@company.com"
                        />
                    </div>
                </div>
            </Modal>

            {/* Hiring Quota / Plan Limit Modal */}
            <Modal
                open={showLimitModal}
                onCancel={() => setShowLimitModal(false)}
                footer={null}
                centered
                width={480}
            >
                <div className="p-0 text-center">
                    <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Hiring Quota Limit Reached</h3>
                    <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                        {limitModalMessage || `You have reached your maximum active job limit (${activeJobsLimit}). Close an existing job or upgrade your subscription plan to publish more jobs.`}
                    </p>

                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-left mb-6 space-y-2.5">
                        <div className="flex items-center justify-between text-xs text-gray-600">
                            <span>Current Plan</span>
                            <span className="font-semibold text-gray-900">{planName} Plan</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-600">
                            <span>Active Jobs on Portal</span>
                            <span className={`font-semibold ${activeJobsRemaining <= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                {activeJobsCount} / {activeJobsLimit} ({activeJobsRemaining} {activeJobsRemaining === 1 ? 'slot' : 'slots'} available)
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-600">
                            <span>Monthly Posts Used</span>
                            <span className={`font-semibold ${jobPostsRemaining <= 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                {jobPostsUsed} / {jobPostsLimit} ({jobPostsRemaining} left)
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2.5">
                        {isSubRecruiter ? (
                            <button
                                onClick={() => {
                                    setShowLimitModal(false);
                                    navigate('/overview');
                                }}
                                className="w-full py-2.5 px-4 bg-[#0A66C2] hover:bg-[#004182] text-white font-medium text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
                            >
                                Return to Dashboard
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => {
                                        setShowLimitModal(false);
                                        navigate('/subscription');
                                    }}
                                    className="w-full py-2.5 px-4 bg-[#0A66C2] hover:bg-[#004182] text-white font-medium text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
                                >
                                    <Crown size={16} /> Upgrade Subscription Plan
                                </button>
                                {activeJobsRemaining <= 0 && (
                                    <button
                                        onClick={() => {
                                            setShowLimitModal(false);
                                            navigate('/my-jobs');
                                        }}
                                        className="w-full py-2.5 px-4 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-sm rounded-xl transition"
                                    >
                                        Manage & Close Active Jobs
                                    </button>
                                )}
                            </>
                        )}
                        <button
                            onClick={() => setShowLimitModal(false)}
                            className="w-full py-1.5 text-gray-400 hover:text-gray-600 text-xs font-medium transition"
                        >
                            Keep Editing Draft
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
