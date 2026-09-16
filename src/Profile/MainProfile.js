import React, { useState, useEffect } from "react";
import {
  Layout,
  Menu,
  Progress,
  Card,
  Avatar,
  Button,
  Space,
  Divider,
  Tag,
  Tooltip,
  Drawer,
  Upload,
  Typography,
  Form,
  Row,
  Col,
  message,
  Checkbox,
  Popconfirm,
  Empty,
  Skeleton,
  Dropdown,
  Modal,
  Alert,
} from "antd";
import { Check, Clock, Briefcase, FileText, Award } from "lucide-react";
import {
  EditOutlined,
  CheckCircleFilled,
  PlusOutlined,
  UploadOutlined,
  CalendarOutlined,
  BgColorsOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import { IoIosMale } from "react-icons/io";
import { IoFemaleOutline } from "react-icons/io5";
import { LuGraduationCap } from "react-icons/lu";
import { GiOfficeChair } from "react-icons/gi";
import { PiStudent } from "react-icons/pi";
import { GiNewShoot } from "react-icons/gi";
import { FiEdit } from "react-icons/fi";
import { FaUserPen } from "react-icons/fa6";

import "../css/Profile.css";
import "../css/ProfileDetailsPage.css";
import { FaFacebookF, FaTwitter } from "react-icons/fa";
import { FiBriefcase, FiCalendar, FiPlusCircle, FiFolder } from "react-icons/fi";
import { FaInstagram } from "react-icons/fa";
import { MdDeleteForever } from "react-icons/md";
import { FaBehance } from "react-icons/fa";
import { FaLinkedinIn } from "react-icons/fa";
import { FaDribbble } from "react-icons/fa";
import { PiGenderTransgender } from "react-icons/pi";
import { PiGenderIntersex } from "react-icons/pi";
import { PiGenderNonbinary } from "react-icons/pi";
import { MdNotInterested } from "react-icons/md";
import { HiMiniXMark } from "react-icons/hi2";
import { MdEdit } from "react-icons/md";
import { IoLocationSharp } from "react-icons/io5";

import { LiaSchoolSolid } from "react-icons/lia";
import { MdFileDownloadDone } from "react-icons/md";

import "react-calendar-heatmap/dist/styles.css";
import { motion } from "framer-motion";
import CommonInputField from "../Common/CommonInputField";
import CommonSelectField from "../Common/CommonSelectField";
import {
  MdSchool,
  MdOutlineSchool,
  MdMenuBook,
  MdStarOutline,
  MdLocationCity,
  MdDateRange,
  MdEventAvailable,
  MdCategory,
  MdPercent,
  MdOutlineCalculate,
  MdConfirmationNumber,
  MdSwapHoriz,
  MdOutlineWorkHistory,
} from "react-icons/md";
import CommonTextArea from "../Common/CommonTextArea";
import {
  descriptionValidator,
  emailValidator,
  genderValidator,
  nameValidator,
  phoneValidation,
  selectValidator,
  userTypeValidator,
} from "../Common/Validation";
import CommonDatePicker from "../Common/CommonDatePicker";
import Header from "../Header/Header";
import {
  dailyStreak,
  deleteEducation,
  deleteExperience,
  deleteProject,
  getColleges,
  getCourses,
  getCourseType,
  getDailyStreak,
  getGenderData,
  getQualification,
  getSpecialization,
  getUserProfile,
  getUserTypeData,
  insertEducation,
  insertExperience,
  insertProjects,
  updateAbout,
  updateBasicDetails,
  updateBanner,
  updateEducation,
  updateExperience,
  updateProfileImage,
  updateProject,
  updateResume,
  updateSkills,
  updateSocialLinks,
} from "../ApiService/action";
import { useNavigate } from "@/routing-shim";
import { TbShare3 } from "react-icons/tb";
import { format, subDays, parseISO } from "date-fns";
import CalendarHeatmap from "react-calendar-heatmap";

const { Title, Text } = Typography;

const { Content } = Layout;
const { Meta } = Card;

const items = [
  { key: "basic", label: "Basic Details" },
  { key: "resume", label: "Resume" },
  { key: "about", label: "About" },
  { key: "skills", label: "Skills" },
  { key: "education", label: "Education" },
  { key: "experience", label: "Work Experience" },
  { key: "projects", label: "Projects" },
  { key: "sociallinks", label: "Social Links" },
];

const suggestions = [
  "Deep Learning",
  "Tone of Voice",
  "CRM Proficiency",
  "E-Discovery",
  "Embedded Programming",
  "GDPR Compliance",
  "Medical Malpractice",
  "Remote Access",
  "Education Law",
  "Substance Designer",
];

const yearOptions = Array.from({ length: 2025 - 1990 + 1 }, (_, i) => {
  const year = (1990 + i).toString();
  return { label: year, value: year };
});

const workingYearOptions = Array.from({ length: 2025 - 1990 + 1 }, (_, i) => {
  const workingYear = (1990 + i).toString();
  return { label: workingYear, value: workingYear };
});

const FresherYearOptions = Array.from({ length: 2025 - 1990 + 1 }, (_, i) => {
  const FreshYear = (1990 + i).toString();
  return { label: FreshYear, value: FreshYear };
});

const startYearOptions = yearOptions;
const endYearOptions = yearOptions;

const fresherStartYearOptions = FresherYearOptions;
const fresherEndYearOptions = FresherYearOptions;

const workingStartDateOptions = workingYearOptions;
const workingEndDateOptions = workingYearOptions;

export default function MainProfile() {
  const [activeTab, setActiveTab] = useState("basic");
  const [aboutText, setAboutText] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [customSkill, setCustomSkill] = useState("");
  const [activeButton, setActiveButton] = useState(null);
  const [genderActiveButton, setGenderActiveButton] = useState(null);
  const [userTypeactiveButton, setUserTypeActiveButton] = useState(null);
  const defaultAvatar =
    "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
  const [profileImage, setProfileImage] = useState(null);
  const [lateral, setLateral] = useState(null);

  //
  const [form] = Form.useForm();
  const [fname, setFname] = useState("");
  const [fnameError, setFnameError] = useState("");
  const [lname, setLname] = useState("");
  const [lnameError, setLnameError] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneNumberError, setPhoneNumberError] = useState("");
  const [gender, setGender] = useState("");
  const [genderOptions, setGenderOptions] = useState([]);
  const [genderError, setGenderError] = useState("");
  const [userType, setUserType] = useState("");
  const [userTypeName, setUserTypeName] = useState([]);
  const [userTypeError, setUserTypeError] = useState("");
  const [course, setCourse] = useState(null);
  const [courseOptions, setCourseOptions] = useState([]);
  const [courseError, setCourseError] = useState("");
  const [location, setLocation] = useState("");
  const [locationError, setLocationError] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startDateError, setStartDateError] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endDateError, setEndDateError] = useState("");
  const [fresherCourse, setFresherCourse] = useState("");
  const [fresherCourseError, setFresherCourseError] = useState("");
  const [fresherCourseOptions, setFresherCourseOptions] = useState([]);
  const [fresherStartDate, setFresherStartDate] = useState("");
  const [fresherStartDateError, setFresherStartDateError] = useState("");
  const [fresherEndtDate, setFresherEndDate] = useState("");
  const [fresherEndDateError, setFresherEndDateError] = useState("");
  const [loginUserId, setLoginUserId] = useState(null);
  const [roleId, setRoleId] = useState(null);
  const [organizationName, setOrganisationName] = useState("");
  const [organizationNameType, setOrganizationType] = useState("");
  const [resumeError, setResumeError] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [createdAt, setCreatedAt] = useState("");

  //
  const [showEducationForm, setShowEducationForm] = useState(true);
  const [qualificaton, setQualification] = useState("");
  const [qualificationOptions, setQualificationOptions] = useState([]);
  const [qualificatonError, setQualificationError] = useState("");
  const [educationCourse, setEducationCourse] = useState("");
  const [educationCourseOptions, setEducationCourseOptions] = useState([]);
  const [educationCourseError, setEducationCourseError] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [specializationOptions, setSpecializationOptions] = useState([]);
  const [specializationError, setSpecializationError] = useState("");
  const [educationCollege, setEducationCollege] = useState("");
  const [collageOptions, setCollageOptions] = useState([]);
  const [collageError, setCollageError] = useState("");
  const [courseType, setCourseType] = useState("");
  const [courseTypeOptions, setCourseTypeOptions] = useState([]);
  const [courseTypeError, setCourseTypeError] = useState("");
  const [percentage, setPercentage] = useState("");
  const [cgpa, setCgpa] = useState("");
  const [educationStartDate, setEducationStartDate] = useState("");
  const [educationStartDateError, setEducationStartDateError] = useState("");
  const [educationEndDate, setEducationEndDate] = useState("");
  const [educationEndDateError, setEducationEndDateError] = useState("");
  const [aboutTextNew, setAboutTextNew] = useState("");
  const [aboutTextError, setAboutTextError] = useState("");
  //
  const [designationError, setDesignationError] = useState("");
  const [employmentTypeError, setEmploymentTypeError] = useState("");
  const [workExpStartDateError, setWorkExpStartDateError] = useState("");
  const [workExpEndDateError, setWorkExpEndDateError] = useState("");
  const [workExpLocationError, setWorkExpLocationError] = useState("");
  const [resumeFile, setResumeFile] = useState(null);

  // work exp
  const [selectExperienceType, setSelectExperienceType] = useState("");
  const [selectExperienceTypeError, setSelectExperienceTypeError] =
    useState("");
  const [experienceData, setExperienceData] = useState(null);
  const [showWorkExpForm, setShowWorkExpForm] = useState(true);
  const [experienceType, setExperienceType] = useState(null);
  const [totalYearsExperience, setTotalYearsExperience] = useState("");
  const [totalYearsExperienceError, setTotalYearsExperienceError] =
    useState("");
  const [totalMonthsExperience, setTotalMonthsExperience] = useState("");
  const [totalMonthsExperienceError, setTotalMonthsExperienceError] =
    useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobTitleError, setJobTitleError] = useState("");
  const [editingCompanyId, setEditingCompanyId] = useState(null);

  //
  const [companyName, setCompanyName] = useState("");
  const [companyNameError, setCompanyNameError] = useState("");
  const [project, setProject] = useState("");
  const [projectError, setProjectError] = useState("");
  const [projectType, setProjectType] = useState("");
  const [projectTypeError, setProjectTypeError] = useState("");
  const [projectStartDate, setProjectStartDate] = useState("");
  const [projectStartDateError, setProjectStartDateError] = useState("");
  const [projectEndDate, setProjectEndDate] = useState("");
  const [projectEndDateError, setProjectEndDateError] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectDescriptionError, setProjectDescriptionError] = useState("");
  const [projectsList, setProjectsList] = useState([]);
  const [showForm, setShowForm] = useState(true);
  const [rollNumber, setRollNumber] = useState("");
  const [educationData, setEducationData] = useState(null);
  const [projectData, setProjectData] = useState(null);
  const [aboutData, setAboutData] = useState(null);
  const [isResume, setIsResume] = useState("");
  const [isSkills, setIsSkills] = useState([]);
  const [isWorkExp, setIsWorkExp] = useState("");
  const [isAbout, setIsAbout] = useState("");
  const [isEducation, setIsEducation] = useState([]);
  const [isProjects, setIsProjects] = useState([]);
  const [isSocialLinks, setIsSocialLinks] = useState({});
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [userProfileLoading, setUserProfileLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [companies, setCompanies] = useState([
    {
      id: Date.now(),
      isNew: true,
      jobTitle: "",
      workingCompanyName: "",
      designation: "",
      workingStartDate: "",
      workingEndDate: "",
      currentlyWorking: false,
      jobTitleError: "",
      workingCompanyNameError: "",
      designationError: "",
      workingStartDateError: "",
      workingEndDateError: "",
    },
  ]);

  const [bannerStyle, setBannerStyle] = useState({
    backgroundColor: "#481eaf",
    backgroundImage: "none",
  });

  const [isColorModalVisible, setColorModalVisible] = useState(false);
  const [isImageModalVisible, setImageModalVisible] = useState(false);
  const [tempColor, setTempColor] = useState("#481eaf");
  const [tempImage, setTempImage] = useState(null);

  // active streak

  const [streakData, setStreakData] = useState([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const today = new Date();

  // Update the getClassForValue function
  const getClassForValue = (value) => {
    if (!value || value.count === 0) return "color-empty";
    const dateFormatted = format(new Date(), "yyyy-MM-dd");
    if (value.date === dateFormatted) {
      return "color-today";
    }
    if (value.count === 1) return "color-scale-1";
    if (value.count === 2) return "color-scale-2";
    if (value.count === 3) return "color-scale-3";
    return "color-scale-4";
  };

  useEffect(() => {
    getDailyStreakData();
  }, [loginUserId])

  const getDailyStreakData = async () => {
    const payload = {
      user_id: loginUserId
    }

    try {
      const response = await getDailyStreak(payload);
      console.log("getDailyStreak", response)
    } catch (error) {
      console.log("getDailyStreak", error)
    }
  }



  useEffect(() => {
    if (loginUserId !== null && loginUserId !== undefined) {
      dailyStreakData();
    }
  }, [loginUserId]);

  const dailyStreakData = async () => {
    setIsLoading(true);
    const payload = { user_id: loginUserId };

    try {
      const response = await dailyStreak(payload);
      console.log("dailyStreak", response);

      if (response?.data) {
        const transformedData = response.data.history.map((item) => ({
          date: item.usage_date,
          streak: item.streak,
        }));

        setStreakData(transformedData);
        setCurrentStreak(response.data.currentStreak || 0);
        setMaxStreak(response.data.maxStreak || 0);
      }
    } catch (error) {
      console.error("dailyStreak error", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update the LegendBox and StreakBox components
  const LegendBox = ({ color, label }) => (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div
        style={{
          width: "12px",
          height: "12px",
          borderRadius: "50%",
          background: color,
        }}
      />
      <span style={{ color: "#475569", fontSize: "0.85rem", fontWeight: 500 }}>
        {label}
      </span>
    </div>
  );

  const StreakBox = ({ label, value, color }) => (
    <div
      style={{
        textAlign: "center",
        padding: "12px",
        background: "#fdfdff",
        border: "1px solid #f0f0f5",
        borderRadius: "12px",
        minWidth: "120px",
      }}
    >
      <div style={{ color: "#334155", fontSize: "0.9rem", fontWeight: 600 }}>
        {label}
      </div>
      <div
        style={{ color, fontSize: "18px", fontWeight: 700, marginTop: "0px" }}
      >
        {value} {value === 1 ? "Day" : "Days"}
      </div>
    </div>
  );
  //////////////

  const handleMenuClick = ({ key }) => {
    if (key === "color") {
      setColorModalVisible(true);
    } else if (key === "image") {
      setImageModalVisible(true);
    }
  };
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const menuItems = [
    {
      key: "color",
      icon: <BgColorsOutlined style={{ color: "#5f2eea", fontSize: "16px" }} />,
      label: <span style={{ fontWeight: 500 }}>Change Background Color</span>,
      style: {
        padding: "10px 16px",
        margin: "4px 8px",
        borderRadius: "8px",
      },
    },
    {
      type: "divider",
      style: { margin: "4px 0" },
    },
    {
      key: "image",
      icon: <PictureOutlined style={{ color: "#5f2eea", fontSize: "16px" }} />,
      label: <span style={{ fontWeight: 500 }}>Change Background Image</span>,
      style: {
        padding: "10px 16px",
        margin: "4px 8px",
        borderRadius: "8px",
      },
    },
  ];

  //
  const [customSkillError, setCustomSkillError] = useState("");

  useEffect(() => {
    document.title = "CareerFast | Profile Details";
    getGenderDataType();
  }, []);

  useEffect(() => {
    if (loginUserId !== null && loginUserId !== undefined) {
      getUserProfileData();
      // updateProfileImageData();
    }
  }, [loginUserId]);

  // QUALIFICATION
  useEffect(() => {
    getQualificationData();
  }, []);

  const getQualificationData = async () => {
    try {
      const response = await getQualification();
      console.log("getQualification", response);
      setQualificationOptions(response?.data?.data || []);
    } catch (error) {
      console.log("getQualification error", error);
    } finally {
      setTimeout(() => {
        getCourseData();
      }, 300);
    }
  };
  //

  // EDUCATION COURSE
  const getCourseData = async () => {
    try {
      const response = await getCourses();
      setEducationCourseOptions(response?.data?.data || []);
      setCourseOptions(response?.data?.data || []);
      setFresherCourseOptions(response?.data?.data || []);
    } catch (error) {
      console.log("getCourseData error", error);
    } finally {
      getSpecializationData();
    }
  };

  // SPECIFICATION

  const getSpecializationData = async () => {
    try {
      const response = await getSpecialization();
      setSpecializationOptions(response?.data?.data || []);
      console.log("getSpecializationData", response);
    } catch (error) {
      console.log("getSpecializationData error", error);
    } finally {
      getCollegesData();
    }
  };

  // EDUCATION COLLAGES
  const getCollegesData = async () => {
    try {
      const response = await getColleges();
      setCollageOptions(response?.data?.data || []);
    } catch (error) {
      console.log("getCollegesData error", error);
    } finally {
      setTimeout(() => {
        getCourseTypeData();
      }, 300);
    }
  };

  // COURSE TYPE
  const getCourseTypeData = async () => {
    try {
      const response = await getCourseType();
      const courseTypes = response?.data?.data || [];

      const mappedOptions = courseTypes.map((item) => ({
        label: item,
        value: item,
      }));

      setCourseTypeOptions(mappedOptions);
    } catch (error) {
      console.log("getCourseTypeData error", error);
    }
  };

  // DELETE EDUCATION
  const handleDeleteEducation = async () => {
    if (!educationData) {
      message.error("No education data to delete.");
      return;
    }

    const payload = {
      id: educationData.id,
      user_id: loginUserId,
    };

    try {
      const response = await deleteEducation(payload);
      console.log("deleteEducation", response);
      message.success("Education deleted successfully.");
      setShowEducationForm(true);
      setQualification("");
      setEducationCourse("");
      setSpecialization("");
      setEducationCollege("");
      setEducationStartDate("");
      setEducationEndDate("");
      setCourseType("");
      setPercentage("");
      setCgpa("");
      setRollNumber("");
      setLateral(false);
      getUserProfileData();
    } catch (error) {
      console.error("Error deleting education:", error);
      message.error("Failed to delete education.");
    }
  };

  const getUserProfileData = async () => {
    const payload = {
      user_id: loginUserId,
    };

    try {
      const response = await getUserProfile(payload);
      console.log("getUserProfilegetUserProfile", response);
      const image = response?.data?.data?.profile_image || "";
      setProfileImage(image || defaultAvatar);

      // Set banner style from response
      setBannerStyle({
        backgroundColor: response?.data?.data?.banner_color || "#481eaf",
        backgroundImage: response?.data?.data?.banner_image
          ? `url(${response.data.data.banner_image})`
          : "none",
      });
      setIsResume(response?.data?.data?.resume || "");
      setIsSkills(response?.data?.data?.skills || []);
      setIsWorkExp(response?.data?.data?.experince_type || "");
      setIsAbout(response?.data?.data?.about || "");
      setIsEducation(response?.data?.data?.education || []);
      setIsProjects(response?.data?.data?.projects || []);
      setTotalYearsExperience(
        response?.data?.data?.total_years
          ? `${response.data.data.total_years}`
          : ""
      );
      setTotalMonthsExperience(
        response?.data?.data?.total_months
          ? `${response.data.data.total_months}`
          : ""
      );


      setLocation(response?.data?.data?.location || "N/A");
      const fetchedLinks = response?.data?.data?.social_links || {};
      setSocialLinks({
        Linkedin: fetchedLinks.linkedin || "",
        Facebook: fetchedLinks.facebook || "",
        Instagram: fetchedLinks.instagram || "",
        Twitter: fetchedLinks.twitter || "",
        Dribbble: fetchedLinks.dribble || "",
        Behance: fetchedLinks.behance || "",
      });
      setIsSocialLinks(fetchedLinks);

      const fetchSkills = response?.data?.data?.skills || [];
      setSelectedSkills(Array.isArray(fetchSkills) ? fetchSkills : []);
      setIsSkills(fetchSkills);
      setCreatedAt(response?.data?.data?.created_date || "");

      if (response?.data?.data) {
        const profile = response.data.data;
        setUserType(profile.user_type || "");
        setGender(profile.gender || "");
        setExperienceType(profile.experince_type || "");
        setUserTypeActiveButton(profile.user_type || "");
        setGenderActiveButton(profile.gender || "");



        // Handle education
        if (profile.education && profile.education.length > 0) {
          const edu = profile.education[0];
          setEducationData(edu);
          setQualification(edu.qualification || "");
          setEducationCourse(edu.course || "");
          setSpecialization(edu.specialization || "");
          setEducationCollege(edu.college || "");
          setEducationStartDate(edu.start_date);
          setEducationEndDate(edu.end_date);
          setCourseType(edu.course_type);
          setPercentage(edu.percentage);
          setCgpa(edu.cgpa);
          setRollNumber(edu.roll_number);
          setLateral(edu.lateral_entry);
          setShowEducationForm(false);
        } else {
          setEducationData(null);
          setShowEducationForm(true);
        }

        // Handle about
        if (profile.about) {
          setAboutTextNew(profile.about || "");
          setAboutData(profile.about);
        } else {
          setAboutData(null);
        }

        // Handle projects
        if (profile.projects && profile.projects.length > 0) {
          const proj = profile.projects[0];
          setProjectData(proj);
          setCompanyName(proj.company_name || "");
          setProject(proj.project_title || "");
          setProjectType(proj.project_type || "");
          setActiveButton(proj.project_type || "");
          setProjectStartDate(proj.start_date || "");
          setProjectEndDate(proj.end_date || "");
          setProjectDescription(proj.description);
          setProjectsList(profile.projects);
          setShowForm(false);
        } else {
          setProjectData(null);
          setProjectsList([]);
          setShowForm(true);
        }

        // Handle experience
        if (
          response?.data?.data?.professional &&
          response.data.data.professional.length > 0
        ) {
          const professionalData = response.data.data.professional;
          setExperienceType(profile.experince_type || "");
          setLocation(profile.location || "");

          // Map all experiences to companies state
          const mappedCompanies = professionalData.map((exp) => ({
            id: exp.id,
            jobTitle: exp.job_title || "",
            workingCompanyName: exp.company_name || "",
            designation: exp.designation || "",
            workingStartDate: exp.start_date || "",
            workingEndDate: exp.currently_working ? "" : exp.end_date || "",
            currentlyWorking: !!exp.currently_working,
            isNew: false,
          }));

          setCompanies(mappedCompanies);
          setExperienceData(mappedCompanies[0]?.jobTitle || "");
          setShowWorkExpForm(false);
        } else {
          setExperienceData(null);
          setCompanies([
            {
              id: Date.now(),
              isNew: true,
              jobTitle: "",
              workingCompanyName: "",
              designation: "",
              workingStartDate: "",
              workingEndDate: "",
              currentlyWorking: false,
            },
          ]);
          setShowWorkExpForm(true);
        }
      }
    } catch (error) {
      console.log("getuserprofile error", error);
      setShowEducationForm(true);
      setShowWorkExpForm(true);
      setShowForm(true);
    } finally {
      setTimeout(() => {
        setUserProfileLoading(false);
      }, 1000);
    }
  };

  const getGenderDataType = async () => {
    try {
      const response = await getGenderData();
      setGenderOptions(response?.data?.data || []);
      console.log("gender", response);
    } catch (error) {
      console.log("gender error", error);
    } finally {
      setTimeout(() => {
        getUserTypeDataOptions();
      }, 300);
    }
  };

  const getUserTypeDataOptions = async () => {
    try {
      const response = await getUserTypeData();
      setUserTypeName(response?.data?.data || []);
      console.log("userType", response);
    } catch (error) {
      console.log("usertype", error);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const fnameValidate = nameValidator(fname);
    const lnameValidate = nameValidator(lname);
    const emailValidate = emailValidator(email);
    const phoneValidate = phoneValidation(phoneNumber);
    const genderValidate = genderValidator(gender);
    const userTypeValidate = userTypeValidator(userType);
    const locationValidate = nameValidator(location);
    const courseValidate =
      userType === "College Student" ? selectValidator(course) : "";
    const startDateValidate =
      userType === "College Student" ? selectValidator(startDate) : "";
    const endDateValidate =
      userType === "College Student" ? selectValidator(endDate) : "";

    const fresherCourseValidate =
      userType === "Fresher" ? selectValidator(fresherCourse) : "";
    const fresherStartDateValidate =
      userType === "Fresher" ? selectValidator(fresherStartDate) : "";
    const fresherEndtDateValidate =
      userType === "Fresher" ? selectValidator(fresherEndtDate) : "";

    const selectExperienceTypeValidate = selectValidator(selectExperienceType);

    setSelectExperienceTypeError(selectExperienceTypeValidate);

    let totalYearsExperienceValidate = "";
    let totalMonthsExperienceValidate = "";

    totalYearsExperienceValidate = selectValidator(totalYearsExperience);
    totalMonthsExperienceValidate = selectValidator(totalMonthsExperience);

    setTotalYearsExperienceError(totalYearsExperienceValidate);
    setTotalMonthsExperienceError(totalMonthsExperienceValidate);

    setFnameError(fnameValidate);
    setLnameError(lnameValidate);
    setEmailError(emailValidate);
    setPhoneNumberError(phoneValidate);
    setGenderError(genderValidate);
    setUserTypeError(userTypeValidate);
    setLocationError(locationValidate);
    setCourseError(courseValidate);
    setStartDateError(startDateValidate);
    setEndDateError(endDateValidate);
    setFresherCourseError(fresherCourseValidate);
    setFresherStartDateError(fresherStartDateValidate);
    setFresherEndDateError(fresherEndtDateValidate);

    const hasErrors = [
      fnameValidate,
      lnameValidate,
      emailValidate,
      phoneValidate,
      genderValidate,
      userTypeValidate,
      locationValidate,
      selectExperienceTypeValidate,

      ...(userType === "College Student"
        ? [courseValidate, startDateValidate, endDateValidate]
        : []),
      ...(userType === "Fresher"
        ? [
          fresherCourseValidate,
          fresherStartDateValidate,
          fresherEndtDateValidate,
        ]
        : []),
    ].some((val) => val !== "");

    if (hasErrors) {
      message.error("Please fill all fields correctly before proceeding.");
      return;
    }

    const payload = {
      first_name: fname,
      last_name: lname,
      gender: gender,
      user_type: userType,
      ...(userType === "College Student" && {
        course: courseOptions.find((item) => item.id === course)?.name || "",
        start_year: startDate,
        end_year: endDate,
      }),
      ...(userType === "Fresher" && {
        course: fresherCourseOptions.find((item) => item.id === fresherCourse)?.name || "",
        start_year: fresherStartDate,
        end_year: fresherEndtDate,
      }),
      location: location,
      experince_type: selectExperienceType,
      total_years: totalYearsExperience,
      total_months: totalMonthsExperience,
      ...(userType === "School Student" && {
        classes: Class,
      }),

      user_id: loginUserId,
    };
    try {
      const response = await updateBasicDetails(payload);
      console.log("Saving user data:", response);
      message.success("Profile details saved successfully.");
      getUserProfileData();
      resetFormFields();
    } catch (error) {
      console.log("Saving user data:", error);
    }
  };

  //

  const yearOptions = Array.from({ length: 2025 - 1990 + 1 }, (_, i) => {
    const year = (1990 + i).toString();
    return { label: year, value: year };
  });

  const educationStartDateOptions = yearOptions;
  const educationEndDateOptions = yearOptions;

  const handleExperienceTypeChange = (value) => setExperienceType(value);

  const handleAddCompany = () => {
    setEditingCompanyId(null);
    setShowWorkExpForm(true);
    setCompanies([
      ...companies,
      {
        id: Date.now(),
        isNew: true,
        jobTitle: "",
        workingCompanyName: "",
        designation: "",
        workingStartDate: "",
        workingEndDate: "",
        currentlyWorking: false,
        jobTitleError: "",
        workingCompanyNameError: "",
        designationError: "",
        workingStartDateError: "",
        workingEndDateError: "",
      },
    ]);
  };

  const handleEducationDiscard = () => {
    setShowEducationForm(false);
  };

  const handleEducationSave = async (e) => {
    e.preventDefault();

    const qualificatonValidate = selectValidator(qualificaton);
    const educationCourseValidate = selectValidator(educationCourse);
    const specializationValidate = selectValidator(specialization);
    const collageValidate = selectValidator(educationCollege);
    const courseTypeValidate = selectValidator(courseType);
    const educationStartDateValidate = selectValidator(educationStartDate);
    const educationEndDateValidate = selectValidator(educationEndDate);

    setQualificationError(qualificatonValidate);
    setEducationCourseError(educationCourseValidate);
    setSpecializationError(specializationValidate);
    setCollageError(collageValidate);
    setCourseTypeError(courseTypeValidate);
    setEducationStartDateError(educationStartDateValidate);
    setEducationEndDateError(educationEndDateValidate);

    const hasEducationErrors = [
      qualificatonValidate,
      educationCourseValidate,
      specializationValidate,
      collageValidate,
      courseTypeValidate,
      educationStartDateValidate,
      educationEndDateValidate,
    ].some((val) => val !== "");

    if (hasEducationErrors) {
      message.error("Please fill all fields correctly before proceeding.");
      return;
    }

    const payload = {
      id: educationData?.id,
      user_id: loginUserId,
      qualification:
        qualificationOptions.find((item) => item.id === qualificaton)?.name ||
        "",
      course:
        educationCourseOptions.find((item) => item.id === educationCourse)
          ?.name || "",
      specialization:
        specializationOptions.find((item) => item.id === specialization)
          ?.name || "",
      college:
        collageOptions.find((item) => item.id === educationCollege)?.name || "",
      start_date: educationStartDate,
      end_date: educationEndDate,
      course_type: courseType,
      percentage: percentage,
      cgpa: cgpa,
      roll_number: rollNumber,
      lateral_entry: lateral,
    };

    try {
      if (educationData) {
        const response = await updateEducation(payload);
        message.success("Education updated successfully.");
      } else {
        const response = await insertEducation(payload);
        message.success("Education added successfully.");
      }
      setShowEducationForm(false);
      getUserProfileData();
    } catch (error) {
      console.error("Education save/update failed:", error);
      message.error("Failed to save education data.");
    }
  };

  const handleDeleteCompanyWork = async (companyId) => {
    try {
      await deleteExperience({ id: companyId, user_id: loginUserId });

      const updatedCompanies = companies.filter(
        (company) => company.id !== companyId
      );
      setCompanies(updatedCompanies);
      message.success("Experience deleted successfully");
      getUserProfileData();

      if (updatedCompanies.length === 0) {
        setShowWorkExpForm(true);
        setCompanies([
          {
            id: Date.now(),
            isNew: true,
            jobTitle: "",
            workingCompanyName: "",
            designation: "",
            workingStartDate: "",
            workingEndDate: "",
            currentlyWorking: false,
            jobTitleError: "",
            workingCompanyNameError: "",
            designationError: "",
            workingStartDateError: "",
            workingEndDateError: "",
          },
        ]);
      }
    } catch (error) {
      console.error("Error deleting experience:", error);
      message.error("Failed to delete experience");
    }
  };

  const handleWorkDiscard = () => {
    setShowWorkExpForm(false);
    setEditingCompanyId(null);

    setCompanies((prev) => prev.filter((company) => !company.isNew));
  };

  const handleWorkExpSave = async (e) => {
    e.preventDefault();

    let experienceErrors = false;
    const updatedCompanies = [...companies];

    updatedCompanies.forEach((company) => {
      company.jobTitleError = nameValidator(company.jobTitle);
      company.workingCompanyNameError = nameValidator(
        company.workingCompanyName
      );
      company.designationError = nameValidator(company.designation);
      company.workingStartDateError = selectValidator(company.workingStartDate);
      company.workingEndDateError = company.currentlyWorking
        ? ""
        : selectValidator(company.workingEndDate);

      if (
        company.jobTitleError ||
        company.workingCompanyNameError ||
        company.designationError ||
        company.workingStartDateError ||
        company.workingEndDateError
      ) {
        experienceErrors = true;
      }
    });

    setCompanies(updatedCompanies);

    if (experienceErrors) {
      message.error("Please fill all fields correctly before proceeding.");
      return;
    }

    try {
      if (editingCompanyId === null) {
        const newCompany = companies.find((c) => c.isNew);

        const payload = {
          user_id: loginUserId,
          experiences: [
            {
              job_title: newCompany.jobTitle,
              company_name: newCompany.workingCompanyName,
              designation: newCompany.designation,
              start_date: newCompany.workingStartDate,
              end_date: newCompany.currentlyWorking ? null : newCompany.workingEndDate,
              currently_working: newCompany.currentlyWorking ? 1 : 0,
            },
          ],
        };

        const response = await insertExperience(payload);

        const finalCompanies = companies.map((c) =>
          c.isNew ? { ...c, id: response.data.id || Date.now(), isNew: false } : c
        );

        // ✅ Add immediately to state
        const savedCompany = {
          ...newCompany,
          id: response.data.id || Date.now(),
          isNew: false,
        };

        setCompanies((prev) => [...prev.filter((c) => !c.isNew), savedCompany]);
        message.success("Experience added successfully");
        getUserProfileData();

      } else {
        const companyToUpdate = companies.find(
          (company) => company.id === editingCompanyId
        );

        const payload = {
          id: editingCompanyId,
          job_title: companyToUpdate.jobTitle,
          company_name: companyToUpdate.workingCompanyName,
          designation: companyToUpdate.designation,
          start_date: companyToUpdate.workingStartDate,
          end_date: companyToUpdate.currentlyWorking
            ? null
            : companyToUpdate.workingEndDate,
          currently_working: companyToUpdate.currentlyWorking ? 1 : 0,
          user_id: loginUserId,
        };

        await updateExperience(payload);
        message.success("Experience updated successfully");
        getUserProfileData();
      }

      setShowWorkExpForm(false);
      setEditingCompanyId(null);
    } catch (error) {
      console.error("Experience save error", error);
      message.error("Failed to save experience");
    }
  };

  const handleProjectDiscard = () => {
    setShowForm(false);
  };

  const handleProjectSave = async (e) => {
    e.preventDefault();

    // 🔍 Run validations
    const projectCompanyNameValidate = nameValidator(companyName);
    const projectValidate = nameValidator(project);
    const projectTypeValidate = selectValidator(projectType);
    const projectStartDateValidate = selectValidator(projectStartDate);
    const projectEndDateValidate = selectValidator(projectEndDate);
    const projectDescriptionValidate = descriptionValidator(projectDescription);

    // 🔁 Set validation errors to state
    setCompanyNameError(projectCompanyNameValidate);
    setProjectError(projectValidate);
    setProjectTypeError(projectTypeValidate);
    setProjectStartDateError(projectStartDateValidate);
    setProjectEndDateError(projectEndDateValidate);
    setProjectDescriptionError(projectDescriptionValidate);

    const hasProjectError = [
      projectCompanyNameValidate,
      projectValidate,
      projectTypeValidate,
      projectStartDateValidate,
      projectEndDateValidate,
      projectDescriptionValidate,
    ].some((val) => val !== "");

    if (hasProjectError) {
      message.error("Please fill all fields correctly before proceeding.");
      return;
    }

    // ✅ Construct payload
    const payload = {
      ...(projectData?.id && { id: projectData.id }), // only include id if editing
      user_id: loginUserId,
      company_name: companyName,
      job_title: jobTitle,
      project_title: project,
      project_type: projectType,
      start_date: formatDateTime(projectStartDate),
      end_date: formatDateTime(projectEndDate),
      description: projectDescription,
    };

    try {
      if (projectData) {
        const response = await updateProject(payload);
        console.log("updateProjects", response);
        message.success("Project updated successfully.");
        getUserProfileData();

        const updatedList = projectsList.map((item) =>
          item.id === projectData.id ? payload : item
        );
        setProjectsList(updatedList);
      } else {
        const response = await insertProjects(payload);
        console.log("insertProjects", response);
        message.success("Project added successfully.");
        getUserProfileData();

        const newProject = response?.data?.data;

        if (newProject?.id) {
          setProjectsList([...projectsList, newProject]);
        } else {
          getUserProfileData();
        }
      }

      // ✅ Reset state after save
      setProjectData(null);
      setCompanyName("");
      setProject("");
      setProjectType("");
      setProjectStartDate("");
      setProjectEndDate("");
      setProjectDescription("");
      setActiveButton(""); // clear active button style
      setGenderActiveButton("")
      setShowForm(false);
    } catch (error) {
      console.error("project error", error);
      message.error("Failed to save project");
    }
  };

  const handleAddNewProject = () => {
    setProjectData(null);
    setShowForm(true);
    setCompanyName("");
    setProject("");
    setProjectStartDate("");
    setProjectEndDate("");
    setProjectType("");
    setProjectDescription("");
    setActiveButton("");
  };

  const handleDeleteCompany = async (id) => {
    if (!id) {
      message.error("No project ID to delete.");
      return;
    }

    const payload = {
      id,
      user_id: loginUserId,
    };

    try {
      const response = await deleteProject(payload);
      console.log("deleteProject", response);
      message.success("Project deleted successfully.");
      getUserProfileData();

      const updatedList = projectsList.filter((item) => item.id !== id);
      setProjectsList(updatedList);

      if (updatedList.length === 0) {
        handleAddNewProject();
      } else {
        setShowForm(false);
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      message.error("Failed to delete project.");
    }
  };

  const handleAboutSave = async (e) => {
    e.preventDefault();

    const aboutTextValidate = descriptionValidator(aboutTextNew);

    setAboutTextError(aboutTextValidate);

    const hasAboutError = [aboutTextValidate].some((val) => val !== "");

    if (hasAboutError) {
      return;
    }

    const payload = {
      about: aboutTextNew,
      id: loginUserId,
    };

    try {
      const response = await updateAbout(payload);
      console.log("updateAbout", response);
      setAboutText(response?.data?.data || []);
      resetFormFields();
      message.success("About details saved successfully");
      getUserProfileData();
    } catch (error) {
      setAboutTextError(aboutTextValidate);
    }
  };

  const handleBeforeUpload = (file) => {
    const isValidType = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ].includes(file.type);
    const isLt10MB = file.size / 1024 / 1024 < 10;

    if (!isValidType) {
      message.error("Only DOC, DOCX, or PDF files are allowed!");
      return Upload.LIST_IGNORE;
    }

    if (!isLt10MB) {
      message.error("File must be smaller than 10MB!");
      return Upload.LIST_IGNORE;
    }
    setResumeError("");
    setResumeFile(file);
    return false;
  };

  const handleSkillsSave = async (e) => {
    e.preventDefault();

    const customskillValidate = nameValidator(customSkill);

    if (selectedSkills.length === 0 && customSkill.trim() === "") {
      setCustomSkillError(customskillValidate);
      message.warning("Please add at least one skill.");
      return;
    }

    const finalSkills = [
      ...selectedSkills,
      ...(customSkill.trim() ? [customSkill.trim()] : []),
    ];

    const payload = {
      skills: finalSkills,
      user_id: loginUserId,
    };

    try {
      const response = await updateSkills(payload);
      console.log("Skills updated successfully", response);

      const updatedSkills = response?.data?.data;
      setSelectedSkills(
        Array.isArray(updatedSkills) ? updatedSkills : finalSkills
      );
      message.success("Skills saved successfully.");
      getUserProfileData();
    } catch (error) {
      console.error("Error updating skills:", error);
      setCustomSkillError(customskillValidate);
      return;
    }

    resetFormFields();
    setCustomSkill("");
    setCustomSkillError("");
  };

  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file); // Reads file as Base64
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileSave = async () => {
    if (!resumeFile) {
      setResumeError("Please upload a valid resume before saving.");
      return;
    }

    try {
      const base64Resume = await getBase64(resumeFile);
      const payload = {
        resume: base64Resume,
        id: loginUserId,
      };

      const response = await updateResume(payload);
      console.log("updateResume", response);

      resetFormFields();
      setResumeError("");
      getUserProfileData();
      message.success("Resume saved successfully!");
    } catch (error) {
      console.error("Base64 conversion or upload failed:", error);
      setResumeError("Something went wrong while saving resume.");
    }
  };

  const socialIcons = [
    { key: "linkedin", icon: <FaLinkedinIn />, color: "#0077B5" },
    { key: "facebook", icon: <FaFacebookF />, color: "#3b5998" },
    { key: "instagram", icon: <FaInstagram />, color: "#E1306C" },
    { key: "behance", icon: <FaBehance />, color: "#1769ff" },
    { key: "twitter", icon: <FaTwitter />, color: "#17aaffff" },
    { key: "dribble", icon: <FaDribbble />, color: "#ea4c89" },
  ];

  const [socialLinks, setSocialLinks] = useState({
    Linkedin: "",
    Facebook: "",
    Instagram: "",
    Twitter: "",
    Dribbble: "",
    Behance: "",
  });

  const [socialLinkErrors, setSocialLinkErrors] = useState({
    Linkedin: "",
    Facebook: "",
    Instagram: "",
    Twitter: "",
    Dribbble: "",
    Behance: "",
  });

  const urlPattern = /^(https?:\/\/)?([\w\d-]+\.)+[\w-]{2,}(\/.*)?$/;
  const handleSocialLinksSave = (platform, value) => {
    setSocialLinks((prev) => ({
      ...prev,
      [platform]: value,
    }));

    // Validation on change
    setSocialLinkErrors((prev) => ({
      ...prev,
      [platform]:
        value.trim() === ""
          ? " field is required"
          : !urlPattern.test(value)
            ? " Invalid URL"
            : "",
    }));
  };

  //

  const handleAddSocialLinks = async () => {
    let hasErrors = false;
    const newErrors = {};

    Object.entries(socialLinks).forEach(([platform, link]) => {
      if (link.trim() !== "" && !urlPattern.test(link)) {
        newErrors[platform] = "Invalid URL";
        hasErrors = true;
      }
    });

    setSocialLinkErrors((prev) => ({ ...prev, ...newErrors }));

    if (hasErrors) {
      message.error("Please correct the errors before saving.");
      return;
    }

    const hasAnyLink = Object.values(socialLinks).some(
      (val) => val.trim() !== ""
    );
    if (!hasAnyLink) {
      message.warning("Please enter at least one social link.");
      return;
    }

    const payload = {
      linkedin: socialLinks["Linkedin"] || "",
      facebook: socialLinks["Facebook"] || "",
      instagram: socialLinks["Instagram"] || "",
      twitter: socialLinks["Twitter"] || "",
      dribble: socialLinks["Dribbble"] || "",
      behance: socialLinks["Behance"] || "",
      user_id: loginUserId,
    };

    try {
      const response = await updateSocialLinks(payload);
      console.log("social links", response);
      getUserProfileData();
      message.success("Social links saved successfully!");
      resetFormFields();
    } catch (error) {
      message.error("Failed to save social links.");
    }
  };

  const handleLateralTypeChange = (value) => {
    setLateral(value);
    console.log("Selected Lateral Entry Option:", value);
  };

  const formatDateTime = (date) => {
    return new Date(date).toISOString().slice(0, 19).replace("T", " "); // 'YYYY-MM-DD HH:MM:SS'
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem("loginDetails");
      if (stored) {
        const loginDetails = JSON.parse(stored);
        setRoleId(loginDetails.role_id);
        setLoginUserId(loginDetails.id);
        setFname(loginDetails.first_name);
        setLname(loginDetails.last_name);
        setEmail(loginDetails.email);
        setPhoneNumber(loginDetails.phone);
        setOrganisationName(loginDetails.organization);
        setOrganizationType(loginDetails.organization_type);
      }
      console.log("stored", stored);
    } catch (error) {
      console.error("Invalid JSON in localStorage", error);
    } finally {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 700);

      return () => clearTimeout(timer);
    }
  }, []);

  const [open, setOpen] = useState(false);
  const showDrawer = () => {
    setOpen(true);
  };

  const resetFormFields = () => {
    // Errors
    setFnameError("");
    setLnameError("");
    setEmailError("");
    setPhoneNumberError("");
    setGenderError("");
    setUserTypeError("");
    setLocationError("");
    setCourseError("");
    setStartDateError("");
    setEndDateError("");
    setFresherCourseError("");
    setFresherStartDateError("");
    setFresherEndDateError("");
    setQualificationError("");
    setEducationCourseError("");
    setSpecializationError("");
    setCollageError("");
    setResumeError("");
    setCourseTypeError("");
    setEducationStartDateError("");
    setEducationEndDateError("");
    setDesignationError("");
    setEmploymentTypeError("");
    setSelectExperienceTypeError("");
    setTotalYearsExperienceError("");
    setTotalMonthsExperienceError("");
    setJobTitleError("");
    setWorkExpStartDateError("");
    setWorkExpEndDateError("");
    setWorkExpLocationError("");
    setProjectError("");
    setProjectTypeError("");
    setProjectStartDateError("");
    setProjectEndDateError("");
    setProjectDescriptionError("");
    setCustomSkillError("");
    setAboutTextError("");
    setOpen(false);
  };

  const handleAddSkill = (skill) => {
    if (!selectedSkills.includes(skill)) {
      setSelectedSkills([...selectedSkills, skill]);
      setCustomSkillError("");
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSelectedSkills(
      selectedSkills.filter((skill) => skill !== skillToRemove)
    );
  };

  const handleCustomSkillAdd = () => {
    const trimmed = customSkill.trim();

    if (!trimmed) {
      setCustomSkillError("Please enter a skill before adding.");
      return;
    }

    if (selectedSkills.includes(trimmed)) {
      setCustomSkillError("Skill already added.");
      return;
    }

    setSelectedSkills((prev) => [...prev, trimmed]);
    setCustomSkill("");
    setCustomSkillError("");
  };

  const handleButtonClick = (buttonId) => {
    setGenderActiveButton(buttonId);
    setGender(buttonId);
    setGenderError("");
  };

  const handleProjectTypeClick = (type) => {
    setActiveButton(type);
    setProjectType(type);
    setProjectTypeError("");
  };

  const handleUserTypeClick = (buttonId) => {
    setUserTypeActiveButton(buttonId);

    // Reset only the fields that are dependent on user type
    form.resetFields([
      "course",
      "startyear",
      "endyear",
      "course1",
      "class"
    ]);

    // Also clear local states if you’re still using them
    setCourse("");
    setFresherCourse("");
    setStartDate("");
    setEndDate("");
    setFresherStartDate("");
    setFresherEndDate("");
    setClass("");
  };


  const [Class, setClass] = useState(null);
  const handleClassClick = (buttonId) => {
    setClass((prev) => buttonId);
  };

  const handleUpload = async (info) => {
    const file = info.file.originFileObj || info.file;

    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();

      reader.onloadend = async () => {
        const imageDataUrl = reader.result;
        setProfileImage(imageDataUrl);
        message.success("Profile image updated!");

        const payload = {
          user_id: loginUserId,
          profile_image: imageDataUrl,
        };

        try {
          const response = await updateProfileImage(payload);
          console.log("Profile updated:", response);
          getUserProfileData();

          // Hard refresh the page
          window.location.reload();
        } catch (error) {
          console.error("Failed to update profile:", error);
        }
      };

      reader.readAsDataURL(file);
    } else {
      message.error("Please upload a valid image file");
    }
  };

  const [profileStats, setProfileStats] = useState({
    completionPercentage: 0,
    lastUpdated: "",
    jobPreferences: [],
    applicationStats: {
      jobsThisMonth: 0,
      interviewsScheduled: 0,
    },
  });

  const style = {
    "project-card": {
      background: "#fff",
      padding: "10px 24px",
      borderRadius: 12,
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    },
  }

  useEffect(() => {
    // Calculate profile completion percentage
    const calculateCompletion = () => {
      const sections = [
        isAbout,
        isResume,
        isSkills.length > 0,
        isWorkExp,
        isEducation.length > 0,
        isProjects.length > 0,
        Object.values(isSocialLinks).some((link) => link),
      ];

      const completedSections = sections.filter(Boolean).length;
      const percentage = Math.round(
        (completedSections / sections.length) * 100
      );

      // ⭐ Save the correct new value
      localStorage.setItem("profileProgress", percentage);

      return percentage;
    };

    // Extract job preferences
    const extractJobPreferences = () => {
      const preferences = [];

      if (userTypeactiveButton) preferences.push(userTypeactiveButton);
      if (location) preferences.push(location);

      return preferences;
    };

    const completion = calculateCompletion();

    // Set final stats
    setProfileStats({
      completionPercentage: completion,
      lastUpdated: createdAt || new Date().toISOString(),
      jobPreferences: extractJobPreferences(),
      applicationStats: {
        jobsThisMonth: 0,
        interviewsScheduled: 0,
      },
    });
  }, [
    isAbout,
    isResume,
    isSkills,
    isWorkExp,
    isEducation,
    isProjects,
    isSocialLinks,
    userTypeactiveButton,
    location,
    createdAt
  ]);



  // --- Tab Content Components ---
  const TabContent = {
    basic: () => (
      <Form
        layout="vertical"
        name="multi-step-form"
        className="multi-step-form"
        form={form}
      >
        {detailsLoading ? (
          <Skeleton active />
        ) : (
          <div>
            <div className="form-row">
              <div className="form-group">
                <CommonInputField
                  label="First Name"
                  mandatory={true}
                  value={fname}
                  placeholder="Enter your first name"
                  onChange={(e) => {
                    setFname(e.target.value);
                    setFnameError(nameValidator(e.target.value));
                  }}
                  readOnly={true}
                  disabled={true}
                  error={fnameError}
                />
              </div>
              <div className="form-group">
                <CommonInputField
                  label="Last Name"
                  mandatory={true}
                  value={lname}
                  placeholder="Enter your Last Name"
                  type="text"
                  onChange={(e) => {
                    setLname(e.target.value);
                    setLnameError(nameValidator(e.target.value));
                  }}
                  readOnly={true}
                  disabled={true}
                  error={lnameError}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <CommonInputField
                  name="email"
                  label="Email"
                  mandatory={true}
                  value={email}
                  placeholder="Enter your Email"
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError(emailValidator(e.target.value));
                  }}
                  readOnly={true}
                  disabled={true}
                  error={emailError}
                />
              </div>
              <div className="form-group">
                <CommonInputField
                  name="Mobile"
                  label="Mobile"
                  mandatory={true}
                  value={phoneNumber}
                  placeholder="Enter your mobile"
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    setPhoneNumberError(phoneValidation(e.target.value));
                  }}
                  readOnly={true}
                  disabled={true}
                  error={phoneNumberError}
                />
              </div>
            </div>

            <div className="form-group">
              <Form.Item
                layout="vertical"
                label={<span style={{ fontWeight: 500 }}>Gender</span>}
                required
              >
                <div className="job_nature">
                  {genderOptions.map((item) => {
                    return (
                      <button
                        key={item.id || item.name}
                        type="button"
                        className={
                          genderActiveButton === item.name
                            ? "job_nature_button_active"
                            : "job_nature_button"
                        }
                        onClick={() => {
                          handleButtonClick(item.name);
                          setGender(item.name);
                          setGenderError("");
                        }}
                      >
                        {item.name === "Male" ? (
                          <IoIosMale />
                        ) : item.name === "Female" ? (
                          <IoFemaleOutline />
                        ) : item.name === "Transgender" ? (
                          <PiGenderTransgender />
                        ) : item.name === "Intersex" ? (
                          <PiGenderIntersex />
                        ) : item.name === "Non-binary" ? (
                          <PiGenderNonbinary />
                        ) : item.name === "Others" ? (
                          <MdNotInterested />
                        ) : (
                          ""
                        )}{" "}
                        {item.name}
                      </button>
                    );
                  })}
                </div>

                {genderError && (
                  <div style={{ color: "red", marginTop: 6, fontSize: 13 }}>
                    {genderError}
                  </div>
                )}
              </Form.Item>
            </div>

            <div style={{ marginTop: 15 }} className="form-group">
              <Form.Item
                layout="vertical"
                label={<span style={{ fontWeight: 500 }}>User Type </span>}
                name="usertype"
                rules={[
                  {
                    required: true,
                    message: "Please Select your User Type ",
                  },
                ]}
              >
                <div>
                  <div className="job_nature">
                    {userTypeName.map((item) => {
                      return (
                        <button
                          key={item.id || item.name}
                          type="button"
                          className={
                            userTypeactiveButton === item.name
                              ? "job_nature_button_active"
                              : "job_nature_button"
                          }
                          onClick={() => {
                            handleUserTypeClick(item.name);
                            setUserType(item.name);
                            setUserTypeError("");
                          }}
                        >
                          {item.name === "College Student" ? (
                            <LuGraduationCap />
                          ) : item.name === "Professional" ? (
                            <GiOfficeChair />
                          ) : item.name === "School Student" ? (
                            <PiStudent />
                          ) : item.name === "Fresher" ? (
                            <GiNewShoot />
                          ) : (
                            ""
                          )}
                          {item.name}
                        </button>
                      );
                    })}
                  </div>
                  {userTypeError && (
                    <div style={{ color: "red", marginTop: 6, fontSize: 13 }}>
                      {userTypeError}
                    </div>
                  )}
                </div>
              </Form.Item>
            </div>

            <div className="">
              {userTypeactiveButton === "College Student" && (
                <>
                  <div style={{ marginTop: 15 }} className="form-group">
                    <CommonSelectField
                      label="Course"
                      disabled={false}
                      name="course"
                      mandatory={true}
                      placeholder="Select Course"
                      value={course}
                      showSearch={true}
                      options={courseOptions}
                      onChange={(value) => {
                        setCourse(value);
                        setCourseError(selectValidator(value));
                      }}
                      error={courseError}
                    />
                  </div>

                  <div
                    className="form-row"
                    style={{
                      display: "flex",
                      gap: "16px",
                      alignItems: "center",
                    }}
                  >
                    <div className="form-group" style={{ flex: 1 }}>
                      <CommonSelectField
                        value={startDate}
                        label="Start Year"
                        mandatory={true}
                        name="startyear"
                        placeholder="Start Year"
                        options={startYearOptions}
                        onChange={(value) => {
                          setStartDate(value);

                          if (!value || value.trim() === "") {
                            setStartDateError("Start year is required");
                          } else {
                            setStartDateError("");
                          }

                          if (endDate && parseInt(value) > parseInt(endDate)) {
                            setEndDateError(
                              " must be after start year"
                            );
                          } else {
                            setEndDateError("");
                          }
                        }}
                        error={startDateError}
                      />
                    </div>

                    <div className="form-group" style={{ flex: 1 }}>
                      <CommonSelectField
                        value={endDate}
                        label="End Year"
                        name="endyear"
                        placeholder="End Year"
                        mandatory={true}
                        options={endYearOptions}
                        onChange={(value) => {
                          setEndDate(value);

                          if (!value || value.trim() === "") {
                            setEndDateError("End year is required");
                          } else if (
                            startDate &&
                            parseInt(value) < parseInt(startDate)
                          ) {
                            setEndDateError(
                              " must be after start year"
                            );
                          } else {
                            setEndDateError("");
                          }
                        }}
                        error={endDateError}
                      />
                    </div>
                  </div>
                </>
              )}

              {userTypeactiveButton === "Fresher" && (
                <>
                  <div style={{ marginTop: 15 }} className="form-group">
                    <CommonSelectField
                      label="Course"
                      disabled={false}
                      name="course1"
                      mandatory={true}
                      placeholder="Select Course"
                      showSearch={true}
                      value={fresherCourse}
                      options={fresherCourseOptions}
                      onChange={(value) => {
                        setFresherCourse(value);
                        setFresherCourseError(selectValidator(value));
                      }}
                      error={fresherCourseError}
                    />
                  </div>

                  {/*  */}

                  <div
                    className="form-row"
                    style={{
                      display: "flex",
                      gap: "16px",
                      alignItems: "center",
                    }}
                  >
                    <div className="form-group" style={{ flex: 1 }}>
                      <CommonSelectField
                        value={fresherStartDate}
                        label="Start Year"
                        name="startyear"
                        placeholder="Start Year"
                        options={fresherStartYearOptions}
                        onChange={(value) => {
                          setFresherStartDate(value);

                          if (!value || value.trim() === "") {
                            setFresherStartDateError("Start year is required");
                          } else {
                            setFresherStartDateError("");
                          }

                          if (endDate && parseInt(value) > parseInt(endDate)) {
                            setFresherEndDateError(
                              " must be after start year"
                            );
                          } else {
                            setFresherEndDateError("");
                          }
                        }}
                        error={fresherStartDateError}
                      />
                    </div>

                    <div className="form-group" style={{ flex: 1 }}>
                      <CommonSelectField
                        label="End Year"
                        name="endyear"
                        placeholder="End Year"
                        value={fresherEndtDate}
                        options={fresherEndYearOptions}
                        onChange={(value) => {
                          setFresherEndDate(value);

                          if (!value || value.trim() === "") {
                            setFresherEndDateError("End year is required");
                          } else if (
                            startDate &&
                            parseInt(value) < parseInt(startDate)
                          ) {
                            setFresherEndDateError(
                              " must be after start year"
                            );
                          } else {
                            setFresherEndDateError("");
                          }
                        }}
                        error={fresherEndDateError} // fixed
                      />
                    </div>
                  </div>
                </>
              )}

              {userTypeactiveButton === "School Student" && (
                <>
                  <Form.Item
                    style={{ marginTop: 15 }}
                    layout="vertical"
                    label={<span style={{ fontWeight: 500 }}>Class</span>}
                    name="usertype"
                    rules={[
                      {
                        required: true,
                        message: "Please Select your Class",
                      },
                    ]}
                  >
                    <div className="job_nature">
                      <button
                        type="button"
                        className={
                          Class === "1"
                            ? "job_nature_button_active"
                            : "job_nature_button"
                        }
                        onClick={() => handleClassClick("1")}
                      >
                        <LiaSchoolSolid /> 1
                      </button>

                      <button
                        type="button"
                        className={
                          Class === "2"
                            ? "job_nature_button_active"
                            : "job_nature_button"
                        }
                        onClick={() => handleClassClick("2")}
                      >
                        <LiaSchoolSolid /> 2
                      </button>

                      <button
                        type="button"
                        className={
                          Class === "3"
                            ? "job_nature_button_active"
                            : "job_nature_button"
                        }
                        onClick={() => handleClassClick("3")}
                      >
                        <LiaSchoolSolid /> 3
                      </button>

                      <button
                        type="button"
                        className={
                          Class === "4"
                            ? "job_nature_button_active"
                            : "job_nature_button"
                        }
                        onClick={() => handleClassClick("4")}
                      >
                        <LiaSchoolSolid /> 4
                      </button>

                      <button
                        type="button"
                        className={
                          Class === "5"
                            ? "job_nature_button_active"
                            : "job_nature_button"
                        }
                        onClick={() => handleClassClick("5")}
                      >
                        <LiaSchoolSolid /> 5
                      </button>

                      <button
                        type="button"
                        className={
                          Class === "6"
                            ? "job_nature_button_active"
                            : "job_nature_button"
                        }
                        onClick={() => handleClassClick("6")}
                      >
                        <LiaSchoolSolid /> 6
                      </button>

                      <button
                        type="button"
                        className={
                          Class === "7"
                            ? "job_nature_button_active"
                            : "job_nature_button"
                        }
                        onClick={() => handleClassClick("7")}
                      >
                        <LiaSchoolSolid /> 7
                      </button>

                      <button
                        type="button"
                        className={
                          Class === "8"
                            ? "job_nature_button_active"
                            : "job_nature_button"
                        }
                        onClick={() => handleClassClick("8")}
                      >
                        <LiaSchoolSolid /> 8
                      </button>

                      <button
                        type="button"
                        className={
                          Class === "9"
                            ? "job_nature_button_active"
                            : "job_nature_button"
                        }
                        onClick={() => handleClassClick("9")}
                      >
                        <LiaSchoolSolid /> 9
                      </button>

                      <button
                        type="button"
                        className={
                          Class === "10"
                            ? "job_nature_button_active"
                            : "job_nature_button"
                        }
                        onClick={() => handleClassClick("10")}
                      >
                        <LiaSchoolSolid /> 10
                      </button>

                      <button
                        type="button"
                        className={
                          Class === "11"
                            ? "job_nature_button_active"
                            : "job_nature_button"
                        }
                        onClick={() => handleClassClick("11")}
                      >
                        <LiaSchoolSolid /> 11
                      </button>

                      <button
                        type="button"
                        className={
                          Class === "12"
                            ? "job_nature_button_active"
                            : "job_nature_button"
                        }
                        onClick={() => handleClassClick("12")}
                      >
                        <LiaSchoolSolid /> 12
                      </button>
                    </div>
                  </Form.Item>
                </>
              )}
            </div>

            <div style={{ marginTop: 20 }} className="form-group">
              <CommonSelectField
                label="Fresher / Experience"
                name="fresherexperience"
                mandatory={true}
                placeholder="Select Experience"
                value={selectExperienceType}
                options={[
                  {
                    value: "Fresher",
                    label: "Fresher",
                  },
                  {
                    value: "Experience",
                    label: "Experience",
                  },
                ]}
                onChange={(value) => {
                  handleExperienceTypeChange(value);
                  setSelectExperienceType(value);
                  setSelectExperienceTypeError(selectValidator(value));
                  setTotalYearsExperience("")
                  setTotalMonthsExperience("")
                }}
                showSearch={true}
                error={selectExperienceTypeError}
              />
            </div>

            <div className="form-row">
              {experienceType === "Experience" && (
                <>
                  <div className="form-group">
                    <CommonSelectField
                      label="Total Years of Experience"
                      name="totalexperience"
                      mandatory={true}
                      placeholder="Select Experience"
                      value={totalYearsExperience}
                      options={[
                        {
                          value: "0 Years",
                          label: "0 Years",
                        },
                        {
                          value: "1 Years",
                          label: "1 Years",
                        },
                        {
                          value: "2 Years",
                          label: "2 Years",
                        },
                        {
                          value: "3 Years",
                          label: "3 Years",
                        },
                        {
                          value: "4 Years",
                          label: "4 Years",
                        },
                        {
                          value: "5 Years",
                          label: "5 Years",
                        },
                        {
                          value: "6 Years",
                          label: "6 Years",
                        },
                        {
                          value: "7 Years",
                          label: "7 Years",
                        },
                        {
                          value: "8 Years",
                          label: "8 Years",
                        },
                        {
                          value: "9 Years",
                          label: "9 Years",
                        },
                        {
                          value: "10 Years",
                          label: "10 Years",
                        },
                        {
                          value: "11 Years",
                          label: "11 Years",
                        },
                      ]}
                      showSearch={true}
                      onChange={(value) => {
                        setTotalYearsExperience(value);
                        setTotalYearsExperienceError(selectValidator(value));
                      }}
                      error={totalYearsExperienceError}
                    />
                  </div>
                  <div className="form-group">
                    <CommonSelectField
                      label="Total Months of Experience"
                      name="experiencemonth"
                      mandatory={true}
                      placeholder="Select Experience"
                      value={totalMonthsExperience}
                      options={[
                        {
                          value: "0 Month",
                          label: "0 Month",
                        },
                        {
                          value: "1 Month",
                          label: "1 Month",
                        },
                        {
                          value: "2 Months",
                          label: "2 Months",
                        },
                        {
                          value: "3 Months",
                          label: "3 Months",
                        },
                        {
                          value: "4 Months",
                          label: "4 Months",
                        },
                        {
                          value: "5 Months",
                          label: "5 Months",
                        },
                        {
                          value: "6 Months",
                          label: "6 Months",
                        },
                        {
                          value: "7 Months",
                          label: "7 Months",
                        },
                        {
                          value: "8 Months",
                          label: "8 Months",
                        },
                        {
                          value: "9 Months",
                          label: "9 Months",
                        },
                        {
                          value: "10 Months",
                          label: "10 Months",
                        },
                        {
                          value: "11 Months",
                          label: "11 Months",
                        },
                        {
                          value: "12 Months",
                          label: "12 Months",
                        },
                      ]}
                      onChange={(value) => {
                        setTotalMonthsExperience(value);
                        setTotalMonthsExperienceError(selectValidator(value));
                      }}
                      showSearch={true}
                      error={totalMonthsExperienceError}
                    />
                  </div>
                </>
              )}
            </div>

            <div style={{ marginTop: 0 }} className="form-group">
              <CommonInputField
                name="location"
                label="Location"
                mandatory={true}
                value={location}
                placeholder="Enter your Location"
                type="text"
                onChange={(e) => {
                  setLocation(e.target.value);
                  setLocationError(nameValidator(e.target.value));
                }}
                error={locationError}
              />
            </div>
            <div style={{ textAlign: "-webkit-right" }} className="save_btn">
              <Button
                type="primary"
                size="large"
                onClick={handleSave}
                className="nav-btn next-btn"
              >
                <MdFileDownloadDone style={{ fontSize: 22 }} />
                Update
              </Button>
            </div>
          </div>
        )}
      </Form>
    ),

    resume: () => (
      <>
        {detailsLoading ? (
          <Skeleton active />
        ) : (
          <div>
            <Title level={4}>Resume</Title>
            <Text type="secondary">
              Remember that one pager that highlights how amazing you are? Time
              to let employers notice your potential through it.
            </Text>

            {/* Show uploaded resume if available */}
            {isResume && (
              <div
                style={{
                  border: "1px solid #e8e8e8",
                  borderRadius: 8,
                  padding: "16px 24px",
                  marginTop: 24,
                  backgroundColor: "#f9f9f9",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <FileText
                    style={{
                      color: "#5f2eea",
                      fontSize: 24,
                      marginRight: 12,
                    }}
                  />
                  <div>
                    <Text strong>Current Resume</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Uploaded resume is ready for employers to view
                    </Text>
                  </div>
                </div>
                <Button
                  style={{ background: "#5f2eea", boxShadow: "none", color: "#fff" }}
                  onClick={() => {
                    if (isResume.startsWith("http")) {
                      window.open(isResume, "_blank");
                    } else if (isResume.startsWith("data:application/pdf")) {
                      const win = window.open("", "_blank");
                      win.document.write(`
                        <iframe 
                          width="100%" 
                          height="100%" 
                          src="${isResume}" 
                          frameborder="0"
                        ></iframe>
                      `);
                    } else {
                      const a = document.createElement("a");
                      a.href = isResume;
                      a.download = "resume.pdf";
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }
                  }}
                >
                  View Resume
                </Button>
              </div>
            )}

            <div
              style={{
                border: "1px dashed #d9d9d9",
                borderRadius: 8,
                padding: 32,
                textAlign: "center",
                marginTop: 24,
              }}
            >
              <Upload
                name="resume"
                showUploadList={false}
                accept=".doc,.docx,.pdf"
                maxCount={1}
                beforeUpload={handleBeforeUpload}
              >
                <Button
                  style={{ background: "#5f2eea" }}
                  icon={<UploadOutlined />}
                  type="primary"
                >
                  {isResume ? "Upload New Resume" : "Upload Resume"}
                </Button>
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">
                    Supported file formats: DOC, DOCX, PDF. File size limit: 10
                    MB.
                  </Text>
                </div>
              </Upload>

              {resumeFile && (
                <div style={{ marginTop: 16 }}>
                  <Text strong>Selected File: </Text>
                  <Text>{resumeFile.name}</Text>
                </div>
              )}

              {resumeError && (
                <div style={{ marginTop: 8 }}>
                  <Text type="danger" style={{ color: "red" }}>
                    {resumeError}
                  </Text>
                </div>
              )}

              <div style={{ textAlign: "right", marginTop: 24 }}>
                <Button
                  type="primary"
                  style={{ background: "#5f2eea" }}
                  onClick={handleFileSave}
                >
                  {isResume ? "Replace Resume" : "Save Resume"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </>
    ),

    about: () => (
      <div
        style={{
          background: "#fff",
          borderRadius: 8,
          padding: 24,
          boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
        }}
      >
        {detailsLoading ? (
          <Skeleton active />
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center" }}>
              <CheckCircleFilled style={{ color: "#00c853", marginRight: 8 }} />
              <Title level={4} style={{ margin: 0 }}>
                About
              </Title>
            </div>

            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12, color: "#888" }}>
                About gives you a chance to showcase your personality, skills,
                and aspirations. Use this space to tell your story, highlight
                your achievements, and share what makes you unique.
              </div>
            </div>

            <CommonTextArea
              style={{ height: 280 }}
              mandatory={true}
              rows={6}
              label={"About"}
              value={aboutTextNew}
              onChange={(e) => {
                setAboutTextNew(e.target.value);
                setAboutTextError(descriptionValidator(e.target.value));
              }}
              error={aboutTextError}
            />

            <div style={{ textAlign: "-webkit-right" }} className="save_btn">
              <Button
                type="primary"
                size="large"
                onClick={handleAboutSave}
                className="nav-btn next-btn"
              >
                <MdFileDownloadDone style={{ fontSize: 22 }} />
                {aboutData ? "Update" : "Save"}
              </Button>
            </div>
          </>
        )}
      </div>
    ),

    skills: () => (
      <>
        {detailsLoading ? (
          <Skeleton active />
        ) : (
          <div
            className="drawer_skills"
            style={{
              background: "#fff",
              borderRadius: 8,
              padding: 24,
              boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <CheckCircleFilled style={{ color: "#00c853", marginRight: 8 }} />
              <Title level={4} style={{ margin: 0 }}>
                Skills
              </Title>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text strong>Suggestions</Text>
              <div style={{ marginTop: 12 }}>
                {suggestions.map((skill) => (
                  <Tag
                    key={skill}
                    style={{
                      borderStyle: "dashed",
                      marginBottom: 8,
                      borderRadius: 50,
                      cursor: "pointer",
                      fontSize: 13,
                      padding: "7px 10px",
                    }}
                    onClick={() => handleAddSkill(skill)}
                  >
                    {skill}
                  </Tag>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ marginTop: 8, marginBottom: 12 }}>
                {selectedSkills.map((skill) => (
                  <Tag
                    key={skill}
                    closable
                    onClose={() => handleRemoveSkill(skill)}
                    style={{
                      marginBottom: 15,
                      fontSize: 14,
                      padding: "5px 10px",
                      border: "none",
                      backgroundColor: "#e9e0fe",
                      color: "#5f2eea",
                      borderRadius: 50,
                    }}
                  >
                    {skill}
                  </Tag>
                ))}
              </div>

              <CommonInputField
                label={"Skills"}
                onPressEnter={handleCustomSkillAdd}
                value={customSkill}
                name={"Skills"}
                onChange={(e) => {
                  setCustomSkill(e.target.value);
                  if (customSkillError) setCustomSkillError("");
                }}
                mandatory={true}
                placeholder={
                  "List your skills here, showcasing what you excel at."
                }
                error={customSkillError}
              />
              <Alert
                style={{
                  marginTop: 15,
                  marginBottom: 20,
                  fontSize: 12,
                  border: "none",
                  display: "inline-flex",
                }}
                message="Click “Add Skill” to update and display your competencies."
                type="warning"
                showIcon
              /><br></br>
              <Button
                type="primary"
                style={{
                  marginTop: 4,
                  background:
                    "linear-gradient(135deg, #7f5af0 0%, #5f2eea 100%)",
                }}
                onClick={handleSkillsSave}
              >
                Add Skill
              </Button>
            </div>
          </div>
        )}
      </>
    ),

    education: () => (
      <>
        {detailsLoading ? (
          <Skeleton active />
        ) : (
          <div>
            {showEducationForm && (
              <>
                <div className="form-group">
                  <CommonSelectField
                    label={"Qualification"}
                    name={"qualificaton"}
                    placeholder={"Select Qualification"}
                    value={qualificaton}
                    mandatory={true}
                    showSearch={true}
                    optionFilterProp={"lable"}
                    options={qualificationOptions}
                    onChange={(value) => {
                      setQualification(value);
                      setQualificationError(selectValidator(value));
                    }}
                    error={qualificatonError}
                  />
                </div>

                <div className="form-group">
                  <div className="form-group">
                    <CommonSelectField
                      label={"Course"}
                      name={"course"}
                      placeholder={"Select Course"}
                      mandatory={true}
                      showSearch={true}
                      optionFilterProp={"lable"}
                      value={educationCourse}
                      options={educationCourseOptions}
                      onChange={(value) => {
                        setEducationCourse(value);
                        setEducationCourseError(selectValidator(value));
                      }}
                      error={educationCourseError}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <CommonSelectField
                    label={"Specialization"}
                    name={"specialization"}
                    placeholder={"Select Specialization"}
                    mandatory={true}
                    value={specialization}
                    showSearch={true}
                    optionFilterProp={"lable"}
                    options={specializationOptions}
                    onChange={(value) => {
                      setSpecialization(value);
                      setSpecializationError(selectValidator(value));
                    }}
                    error={specializationError}
                  />
                </div>

                <div className="form-group">
                  <CommonSelectField
                    label={"Collage"}
                    name={"Collage"}
                    placeholder={"Select Collage"}
                    mandatory={true}
                    value={educationCollege}
                    showSearch={true}
                    optionFilterProp={"lable"}
                    options={collageOptions}
                    onChange={(value) => {
                      setEducationCollege(value);
                      setCollageError(selectValidator(value));
                    }}
                    error={collageError}
                  />
                </div>

                <div
                  style={{ alignItems: "center", marginTop: 10 }}
                  className="form-row"
                >
                  <div className="form-group">
                    <CommonSelectField
                      value={educationStartDate}
                      options={educationStartDateOptions}
                      label="Start Year"
                      name="startyear"
                      mandatory={true}
                      placeholder="Start Year"
                      onChange={(value) => {
                        setEducationStartDate(value);

                        if (!value || value.trim() === "") {
                          setEducationStartDateError(" is required");
                        } else {
                          setEducationStartDateError("");
                        }
                      }}
                      error={educationStartDateError}
                    />
                  </div>

                  <div className="form-group">
                    <CommonSelectField
                      value={educationEndDate}
                      options={educationEndDateOptions}
                      mandatory={true}
                      label="End Year"
                      name="endyear"
                      placeholder="End Year"
                      onChange={(value) => {
                        setEducationEndDate(value);

                        if (!value || value.trim() === "") {
                          setEducationEndDateError(" is required");
                        } else {
                          setEducationEndDateError("");
                        }
                      }}
                      error={educationEndDateError}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <CommonSelectField
                    label={"Course type"}
                    name={"coursetype"}
                    placeholder={"Select Course type"}
                    mandatory={true}
                    showSearch={true}
                    optionFilterProp={"lable"}
                    value={courseType}
                    options={courseTypeOptions}
                    onChange={(value) => {
                      setCourseType(value);
                      setCourseTypeError(selectValidator(value));
                    }}
                    error={courseTypeError}
                  />
                </div>

                <Row style={{ alignItems: "end", gap: 20 }}>
                  <Col lg={11}>
                    <div className="form-group">
                      <CommonInputField
                        name="percentage"
                        label="Percentage"
                        placeholder="Percentage"
                        type="text"
                        value={percentage}
                        onChange={(e) => {
                          setPercentage(e.target.value);
                        }}
                      />
                    </div>
                  </Col>
                  <Col lg={11}>
                    <div className="form-group">
                      <CommonInputField
                        name="cgpa"
                        label="CGPA"
                        placeholder="CGPA"
                        type="text"
                        value={cgpa}
                        onChange={(e) => {
                          setCgpa(e.target.value);
                        }}
                      />
                    </div>
                  </Col>
                </Row>

                <Row style={{ gap: 20, marginTop: 30 }}>
                  <Col lg={11}>
                    <div className="form-group">
                      <CommonInputField
                        name="rollnumber"
                        label="Roll Number"
                        placeholder="Roll Number"
                        type="number"
                        value={rollNumber}
                        onChange={(e) => {
                          setRollNumber(e.target.value);
                        }}
                      />
                    </div>
                  </Col>
                  <Col lg={11}>
                    <div className="form-group">
                      <CommonSelectField
                        label="Are you a Lateral Entry Student?"
                        name="lateralstudent"
                        placeholder="Lateral Entry"
                        showSearch={true}
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                        ]}
                        value={lateral}
                        optionFilterProp="label"
                        onChange={handleLateralTypeChange}
                      />
                    </div>
                  </Col>
                </Row>
                <div style={{ marginTop: 25 }} className="form-row">
                  <div style={{ textAlign: "left" }} className="save_btn">
                    {educationData ? (
                      <Button
                        type="danger"
                        size="large"
                        onClick={handleEducationDiscard}
                        className="nav-btn discard-btn"
                      >
                        Discard
                        <HiMiniXMark style={{ fontSize: 22 }} />
                      </Button>
                    ) : null}
                  </div>

                  <div
                    style={{ textAlign: "-webkit-right" }}
                    className="save_btn"
                  >
                    <Button
                      type="primary"
                      size="large"
                      onClick={handleEducationSave}
                      className="nav-btn next-btn"
                    >
                      <MdFileDownloadDone
                        style={{ fontSize: 22, marginRight: 6 }}
                      />
                      {educationData ? "Update" : "Save"}
                    </Button>
                  </div>
                </div>
              </>
            )}

            {!showEducationForm && (
              <div className="education-details-container">
                <div className="education-header">
                  <div className="header-contents">
                    <div className="header-icons">
                      <MdSchool className="icon" />
                    </div>
                    <h3 className="header-titles">Education Details</h3>
                  </div>
                </div>

                <div className="education-content">
                  <Row gutter={[24, 30]}>
                    {[
                      {
                        label: "Qualification",
                        value: qualificaton,
                        icon: <MdOutlineSchool />,
                      },
                      {
                        label: "Course",
                        value: educationCourse,
                        icon: <MdMenuBook />,
                      },
                      {
                        label: "Specialization",
                        value: specialization,
                        icon: <MdStarOutline />,
                      },

                      {
                        label: "College/University",
                        value: educationCollege,
                        icon: <MdLocationCity />,
                      },
                      {
                        label: "Start Year",
                        value: educationStartDate,
                        icon: <MdDateRange />,
                      },
                      {
                        label: "End Year",
                        value: educationEndDate,
                        icon: <MdEventAvailable />,
                      },
                      {
                        label: "Course Type",
                        value: courseType,
                        icon: <MdCategory />,
                      },
                      {
                        label: "Percentage",
                        value: percentage || "N/A",
                        icon: <MdPercent />,
                      },
                      {
                        label: "CGPA",
                        value: cgpa || "N/A",
                        icon: <MdOutlineCalculate />,
                      },
                      {
                        label: "Roll Number",
                        value: rollNumber || "N/A",
                        icon: <MdConfirmationNumber />,
                      },
                      {
                        label: "Lateral Entry",
                        value: lateral || "N/A",
                        icon: <MdSwapHoriz />,
                      },
                    ].map((item, index) => (
                      <Col xs={24} sm={12} key={index}>
                        <div className="education-detail-item">
                          <div className="detail-icons">{item.icon}</div>
                          <div className="detail-content">
                            <div className="detail-label">{item.label}</div>
                            <div className="detail-value">
                              {item.value || "-"}
                            </div>
                          </div>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </div>

                {/* Premium footer */}
                <div className="education-footer">
                  <Popconfirm
                    title="Are you sure you want to delete your Education?"
                    onConfirm={handleDeleteEducation}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button
                      type="primary"
                      danger
                      icon={<MdDeleteForever className="button-icon" />}
                      className="delete-button"
                    >
                      Delete Education
                    </Button>
                  </Popconfirm>

                  <Button
                    type="primary"
                    icon={<MdEdit className="button-icon" />}
                    onClick={() => {
                      setShowEducationForm(true);
                    }}
                    className="edit-button"
                  >
                    Edit Education
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </>
    ),

    experience: () => (
      <>
        {detailsLoading ? (
          <Skeleton active />
        ) : (
          <div>
            {showWorkExpForm && (
              <>
                <div className="forexprience">
                  {companies.map(
                    (company, index) =>
                      (editingCompanyId === null ||
                        company.id === editingCompanyId) && (
                        <div key={company.id} className="add-company-section">
                          <div className="form-group">
                            <CommonInputField
                              label="Company name"
                              mandatory={true}
                              placeholder="Tech Corp Inc."
                              value={company.workingCompanyName}
                              error={company.workingCompanyNameError}
                              onChange={(e) => {
                                const updatedCompanies = [...companies];
                                updatedCompanies[index].workingCompanyName =
                                  e.target.value;
                                updatedCompanies[
                                  index
                                ].workingCompanyNameError = nameValidator(
                                  e.target.value
                                );
                                setCompanies(updatedCompanies);
                              }}
                            />
                          </div>

                          <div className="form-row">
                            <div className="form-group">
                              <CommonInputField
                                label="Job Title"
                                mandatory={true}
                                placeholder="Software Engineer"
                                value={company.jobTitle}
                                error={company.jobTitleError}
                                onChange={(e) => {
                                  const updatedCompanies = [...companies];
                                  updatedCompanies[index].jobTitle =
                                    e.target.value;
                                  updatedCompanies[index].jobTitleError =
                                    nameValidator(e.target.value);
                                  setCompanies(updatedCompanies);
                                }}
                              />
                            </div>
                            <div className="form-group">
                              <CommonInputField
                                label="Designation"
                                mandatory={true}
                                placeholder="Senior Developer"
                                value={company.designation}
                                error={company.designationError}
                                onChange={(e) => {
                                  const updatedCompanies = [...companies];
                                  updatedCompanies[index].designation =
                                    e.target.value;
                                  updatedCompanies[index].designationError =
                                    nameValidator(e.target.value);
                                  setCompanies(updatedCompanies);
                                }}
                              />
                            </div>
                          </div>

                          <div className="form-row">
                            <div className="form-group">
                              <CommonSelectField
                                label="Start Year"
                                name="startYear"
                                placeholder="Select Start Year"
                                mandatory={true}
                                value={company.workingStartDate}
                                options={workingStartDateOptions}
                                error={company.workingStartDateError}
                                onChange={(value) => {
                                  const updatedCompanies = [...companies];
                                  updatedCompanies[index].workingStartDate =
                                    value;
                                  updatedCompanies[
                                    index
                                  ].workingStartDateError =
                                    selectValidator(value);
                                  setCompanies(updatedCompanies);
                                }}
                              />
                            </div>
                            <div className="form-group">
                              <CommonSelectField
                                label="End Year"
                                name="endYear"
                                placeholder="Select End Year"
                                mandatory={true}
                                value={company.workingEndDate}
                                options={workingEndDateOptions}
                                error={company.workingEndDateError}
                                onChange={(value) => {
                                  const updatedCompanies = [...companies];
                                  updatedCompanies[index].workingEndDate =
                                    value;
                                  updatedCompanies[index].workingEndDateError =
                                    selectValidator(value);
                                  setCompanies(updatedCompanies);
                                }}
                                disabled={company.currentlyWorking}
                              />
                            </div>
                          </div>

                          <div className="form-row">
                            <Checkbox
                              checked={company.currentlyWorking}
                              onChange={(e) => {
                                const updatedCompanies = [...companies];
                                updatedCompanies[index].currentlyWorking =
                                  e.target.checked;
                                if (e.target.checked) {
                                  updatedCompanies[index].workingEndDate = "";
                                  updatedCompanies[index].workingEndDateError =
                                    "";
                                }
                                setCompanies(updatedCompanies);
                              }}
                            >
                              Currently Working Here
                            </Checkbox>
                          </div>

                          <div
                            style={{ marginTop: 15, marginBottom: 20 }}
                            className="form-row"
                          >
                            <div
                              style={{ textAlign: "left" }}
                              className="save_btn"
                            >
                              <Button
                                type="danger"
                                size="large"
                                onClick={handleWorkDiscard}
                                className="nav-btn discard-btn"
                              >
                                Discard
                                <HiMiniXMark style={{ fontSize: 22 }} />
                              </Button>
                            </div>
                            <div
                              style={{ textAlign: "-webkit-right" }}
                              className="save_btn"
                            >
                              <Button
                                type="primary"
                                size="large"
                                onClick={handleWorkExpSave}
                                className="nav-btn next-btn"
                              >
                                {company.isNew ? "Save" : "Update"}
                                <MdFileDownloadDone style={{ fontSize: 22 }} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                  )}
                </div>
              </>
            )}

            {!showWorkExpForm && (
              <div className="experience-preview">
                {companies.length > 0 ? (
                  <>
                    <div className="experience-summary-card">
                      <div className="summary-header">
                        <h3>
                          <GiOfficeChair /> Experience Summary
                        </h3>
                      </div>
                      <div className="summary-grid">
                        {[
                          {
                            label: "Experience Type",
                            value: experienceType,
                            icon: <MdOutlineSchool />,
                          },
                          ...(isWorkExp !== "Fresher"
                            ? [
                              {
                                label: "Years of Experience",
                                value: totalYearsExperience,
                                icon: <MdMenuBook />,
                              },
                              {
                                label: "Months of Experience",
                                value: totalMonthsExperience,
                                icon: <MdLocationCity />,
                              },
                            ]
                            : []),
                          {
                            label: "Location",
                            value: location,
                            icon: <IoLocationSharp />,
                          },
                        ].map((item, index) => (
                          <div className="summary-item" key={index}>
                            <div className="icon-wrapper">{item.icon}</div>
                            <div>
                              <div className="item-label">{item.label}</div>
                              <div className="item-value">{item.value || "-"}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>

                    {companies.map((company) => (
                      <motion.div
                        key={company.id}
                        style={{ background: "#fff", border: "1px solid #0000000d" }}
                        className="project-card"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          duration: 0.6,
                          delay: 0.05,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        whileHover={{
                          y: -6,
                          transition: { duration: 0.3 },
                        }}
                      >
                        <div className="card-content">
                          <div style={{ display: "flex" }} className="card-header">
                            <span
                              className={
                                company.currentlyWorking
                                  ? "currently-working-badge"
                                  : "project-type-badge"
                              }
                            >
                              {company.currentlyWorking
                                ? "Currently Working"
                                : "Past Role"}
                            </span>
                            <div className="card-actions">
                              <button
                                onClick={() => {
                                  setEditingCompanyId(company.id);
                                  setShowWorkExpForm(true);
                                }}
                                className="icon-btn edit-btn"
                              >
                                <FiEdit size={16} />
                              </button>
                            </div>
                          </div>

                          <h3 style={{ color: "#000" }} className="project-title">
                            {company.jobTitle || "Job Title"}
                          </h3>

                          <div className="project-meta">
                            <div style={{ color: "#2a2a2a" }} className="meta-item company">
                              <FiBriefcase className="meta-icon" />
                              <span>
                                {company.workingCompanyName || "Company Name"}
                              </span>
                            </div>
                            <div style={{ color: "#2a2a2a" }} className="meta-item timeline">
                              <MdOutlineWorkHistory className="meta-icon" />
                              <span>
                                {company.workingStartDate || "Start"} —{" "}
                                {company.currentlyWorking
                                  ? "Present"
                                  : company.workingEndDate || "End"}
                              </span>
                            </div>
                          </div>

                          <div className="project-description">
                            <p>
                              <span style={{ color: "#5f2eea" }}>
                                Designation:
                              </span>{" "}
                              {company.designation || "Designation"}
                            </p>
                          </div>

                          <div className="card-footer">
                            <Popconfirm
                              title="Delete this experience?"
                              onConfirm={() =>
                                handleDeleteCompanyWork(company.id)
                              }
                              okText="Yes"
                              cancelText="No"
                            >
                              <button className="icon-btn delete-btn">
                                <MdDeleteForever size={18} />
                              </button>
                            </Popconfirm>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </>
                ) : (
                  <div style={{ textAlign: "center" }} className="empty-state">
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <span style={{ color: "#666", fontSize: "1rem" }}>
                          No work experience added yet
                        </span>
                      }
                    />
                    <Button
                      type="primary"
                      onClick={() => {
                        setShowWorkExpForm(true);
                        setCompanies([
                          {
                            id: Date.now(),
                            isNew: true,
                            jobTitle: "",
                            workingCompanyName: "",
                            designation: "",
                            workingStartDate: "",
                            workingEndDate: "",
                            currentlyWorking: false,
                          },
                        ]);
                      }}
                      style={{ marginTop: 16, background: "rgb(95, 46, 234)" }}
                    >
                      Add Work Experience
                    </Button>
                  </div>
                )}

                {companies.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "end",
                      marginTop: 20,
                    }}
                  >
                    <Button
                      className="add-company-btn"
                      type="primary"
                      onClick={handleAddCompany}
                      icon={<PlusOutlined />}
                    >
                      Add Company
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </>
    ),

    projects: () => (
      <>
        {detailsLoading ? (
          <Skeleton active />
        ) : (
          <div>
            <div>
              {projectsList.length > 0 && !showForm ? (
                <>
                  <div className="projects-container">
                    <div className="projects-header">
                      <Button
                        type="text"
                        onClick={handleAddNewProject}
                        className="add-project-btn"
                        icon={<FiPlusCircle />}
                      >
                        Add New Project
                      </Button>
                      <div className="projects-header-decoration"></div>
                    </div>

                    <div className="projects-mosaic">
                      {projectsList.map((proj, idx) => (
                        <motion.div
                          key={idx}
                          className="project-card"
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            duration: 0.6,
                            delay: idx * 0.05,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          whileHover={{
                            y: -6,
                            transition: { duration: 0.3 },
                          }}
                        >
                          <div className="card-glow"></div>
                          <div className="card-content">
                            <div style={{ display: "flex" }} className="card-header">
                              <span className="project-type-badge">
                                {proj.project_type}
                                <span className="badge-accent"></span>
                              </span>
                              <div className="card-actions">
                                <button
                                  className="icon-btn edit-btn"
                                  onClick={() => {
                                    setProjectData(proj);
                                    setShowForm(true);
                                  }}
                                >
                                  <FiEdit size={16} />
                                </button>
                              </div>
                            </div>

                            <h3 className="project-title">
                              <span className="title-text">
                                {proj.project_title}
                              </span>
                              <span className="title-underline"></span>
                            </h3>

                            <div className="project-meta">
                              <div className="meta-item company">
                                <FiBriefcase className="meta-icon" />
                                <span>{proj.company_name}</span>
                              </div>
                              <div className="meta-item timeline">
                                <FiCalendar className="meta-icon" />
                                <span>
                                  {proj.start_date} — {proj.end_date}
                                </span>
                              </div>
                            </div>

                            <div className="project-description">
                              <p>{proj.description}</p>
                            </div>

                            <div className="card-footer">
                              <Popconfirm
                                title="Delete this project?"
                                onConfirm={() => handleDeleteCompany(proj.id)}
                                okText="Confirm"
                                cancelText="Cancel"
                              >
                                <button className="icon-btn delete-btn">
                                  <MdDeleteForever size={18} />
                                </button>
                              </Popconfirm>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                showForm && (
                  <div>
                    <div>
                      {
                        <>
                          <div className="form-group">
                            <CommonInputField
                              name="companyName"
                              label="Company Name"
                              mandatory={true}
                              placeholder="Company Name"
                              type="text"
                              value={companyName}
                              onChange={(e) => {
                                setCompanyName(e.target.value);
                                setCompanyNameError(
                                  nameValidator(e.target.value)
                                );
                              }}
                              error={companyNameError}
                            />
                          </div>

                          <div className="form-group">
                            <CommonInputField
                              name="projectname"
                              label="Project Name"
                              mandatory={true}
                              placeholder="Project Name"
                              type="text"
                              value={project}
                              onChange={(e) => {
                                setProject(e.target.value);
                                setProjectError(nameValidator(e.target.value));
                              }}
                              error={projectError}
                            />
                          </div>

                          <div className="form-group">
                            <div className="commoninputfield">
                              <div className="input-label-row">
                                <p className="input-label">
                                  <span className="required-mark">*</span>
                                  Project Type
                                </p>
                              </div>
                              <div className="job_nature">
                                <button
                                  type="button"
                                  className={
                                    activeButton === "Full Time"
                                      ? "job_nature_button_active"
                                      : "job_nature_button"
                                  }
                                  onClick={() => {
                                    handleProjectTypeClick("Full Time");
                                    setProjectType("Full Time");
                                    setProjectTypeError("");
                                  }}
                                >
                                  Full Time
                                </button>

                                <button
                                  type="button"
                                  className={
                                    activeButton === "Part Time"
                                      ? "job_nature_button_active"
                                      : "job_nature_button"
                                  }
                                  onClick={() => {
                                    handleProjectTypeClick("Part Time");
                                    setProjectType("Part Time");
                                    setProjectTypeError("");
                                  }}
                                >
                                  Part Time
                                </button>

                                <button
                                  type="button"
                                  className={
                                    activeButton === "Freelance"
                                      ? "job_nature_button_active"
                                      : "job_nature_button"
                                  }
                                  onClick={() => {
                                    handleProjectTypeClick("Freelance");
                                    setProjectType("Freelance");
                                    setProjectTypeError("");
                                  }}
                                >
                                  Freelance
                                </button>
                              </div>
                              <div
                                className={
                                  projectTypeError
                                    ? "show-premium-input-error"
                                    : "hide-premium-input-error"
                                }
                              >
                                {projectTypeError && (
                                  <p className="premium-error-text">
                                    Project type {projectTypeError}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div
                            style={{ alignItems: "center", marginTop: 15 }}
                            className="form-row"
                          >
                            <div className="form-group">
                              <CommonDatePicker
                                value={projectStartDate}
                                label="Start Date"
                                name="enddate"
                                placeholder="Start Date"
                                onChange={(value) => {
                                  setProjectStartDate(value);

                                  if (!value || value.trim() === "") {
                                    setProjectStartDateError(" is required");
                                  } else {
                                    setProjectStartDateError("");
                                  }
                                }}
                                error={projectStartDateError}
                              />
                            </div>

                            <div className="form-group">
                              <CommonDatePicker
                                value={projectEndDate}
                                label="End Date"
                                name="enddate"
                                placeholder="End Date"
                                onChange={(value) => {
                                  setProjectEndDate(value);

                                  if (!value || value.trim() === "") {
                                    setProjectEndDateError(" is required");
                                  } else {
                                    setProjectEndDateError("");
                                  }
                                }}
                                error={projectEndDateError}
                              />
                            </div>
                          </div>

                          <div className="form-group">
                            <CommonTextArea
                              label={"Project Description"}
                              placeholder={"Enter your description"}
                              mandatory={true}
                              name={"description"}
                              value={projectDescription}
                              onChange={(e) => {
                                setProjectDescription(e.target.value);
                                setProjectDescriptionError(
                                  descriptionValidator(e.target.value)
                                );
                              }}
                              error={projectDescriptionError}
                            />
                          </div>
                          <div className="form-row">
                            <div
                              style={{ textAlign: "left" }}
                              className="save_btn"
                            >
                              <Button
                                type="danger"
                                size="large"
                                onClick={handleProjectDiscard}
                                className="nav-btn discard-btn"
                              >
                                Discard
                                <HiMiniXMark style={{ fontSize: 22 }} />
                              </Button>
                            </div>
                            <div
                              style={{ textAlign: "-webkit-right" }}
                              className="save_btn"
                            >
                              <Button
                                type="primary"
                                size="large"
                                onClick={handleProjectSave}
                                className="nav-btn next-btn"
                              >
                                {projectData ? "Update" : "Save"}
                              </Button>
                            </div>
                          </div>
                        </>
                      }
                    </div>
                  </div>
                )
              )}

              {/* ✅ When all projects are deleted, show this as fallback */}
              {projectsList.length === 0 && !showForm && (
                <div style={{ marginTop: 20 }}>
                  <Button type="dashed" onClick={handleAddNewProject}>
                    + Add Project
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </>
    ),

    sociallinks: () => (
      <>
        {detailsLoading ? (
          <Skeleton active />
        ) : (
          <div>
            <div style={{ alignItems: "end" }} className="form-row">
              <div className="form-group">
                <CommonInputField
                  name="Linkedin"
                  label="Linkedin"
                  placeholder="Add link"
                  type="text"
                  value={socialLinks.Linkedin}
                  onChange={(e) =>
                    handleSocialLinksSave("Linkedin", e.target.value)
                  }
                  error={socialLinkErrors.Linkedin}
                />
              </div>
              <div className="form-group">
                <CommonInputField
                  name="Facebook"
                  label="Facebook"
                  placeholder="Add link"
                  type="text"
                  value={socialLinks.Facebook}
                  onChange={(e) =>
                    handleSocialLinksSave("Facebook", e.target.value)
                  }
                  error={socialLinkErrors.Facebook}
                />
              </div>
            </div>

            <div
              style={{ alignItems: "end", marginTop: 20 }}
              className="form-row"
            >
              <div className="form-group">
                <CommonInputField
                  name="Instagram"
                  label="Instagram"
                  placeholder="Add link"
                  type="text"
                  value={socialLinks.Instagram}
                  onChange={(e) =>
                    handleSocialLinksSave("Instagram", e.target.value)
                  }
                  error={socialLinkErrors.Instagram}
                />
              </div>
              <div className="form-group">
                <CommonInputField
                  name="Twitter"
                  label="Twitter"
                  placeholder="Add link"
                  type="text"
                  value={socialLinks.Twitter}
                  error={socialLinkErrors.Twitter}
                  onChange={(e) =>
                    handleSocialLinksSave("Twitter", e.target.value)
                  }
                />
              </div>
            </div>

            <div
              style={{ alignItems: "end", marginTop: 20 }}
              className="form-row"
            >
              <div className="form-group">
                <CommonInputField
                  name="Dribbble"
                  label="Dribbble"
                  placeholder="Add link"
                  type="text"
                  value={socialLinks.Dribbble}
                  error={socialLinkErrors.Dribbble}
                  onChange={(e) =>
                    handleSocialLinksSave("Dribbble", e.target.value)
                  }
                />
              </div>
              <div className="form-group">
                <CommonInputField
                  name="Behance"
                  label="Behance"
                  placeholder="Add link"
                  type="text"
                  value={socialLinks.Behance}
                  error={socialLinkErrors.Behance}
                  onChange={(e) =>
                    handleSocialLinksSave("Behance", e.target.value)
                  }
                />
              </div>
            </div>

            <div
              style={{ textAlign: "-webkit-right", marginTop: 20 }}
              className="save_btn"
            >
              <Button
                type="primary"
                size="large"
                className="nav-btn next-btn"
                onClick={handleAddSocialLinks}
              >
                Save Links
              </Button>
            </div>
          </div>
        )}
      </>
    ),
  };
  //////////////////////////////////////////////////
  return (
    <>
      <div
        className="profile-banner"
        style={{
          ...bannerStyle,
          position: 'relative',
          borderRadius: "16px",
          background: "linear-gradient(135deg, #4c11f7 0%, #764cff 100%)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "32px 40px",
          marginBottom: "24px",
          overflow: "hidden"
        }}
      >
        {/* Background Decorative Circles */}
        <div style={{ position: "absolute", right: "-10%", top: "-50%", width: "400px", height: "400px", borderRadius: "50%", background: "#6e1bff" }}></div>
        <div style={{ position: "absolute", right: "15%", bottom: "-40%", width: "250px", height: "250px", borderRadius: "50%", background: "rgba(255,255,255,0.08)" }}></div>

        {/* Edit Background trigger */}
        <div style={{ position: "absolute", top: "16px", right: "16px", zIndex: 10 }}>
          <Dropdown
            menu={{
              items: menuItems,
              onClick: handleMenuClick,
              style: { borderRadius: "12px", minWidth: "220px" },
            }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Button
              shape="circle"
              icon={<EditOutlined style={{ color: "#fff" }} />}
              style={{ background: "rgba(255,255,255,0.2)", border: "none" }}
            />
          </Dropdown>
        </div>

        {/* Modals from original */}
        <Modal
          style={{ zIndex: 1999 }}
          title={<span style={{ fontWeight: 500 }}>Customize Background Color</span>}
          open={isColorModalVisible}
          onOk={async () => {
            const payload = { user_id: loginUserId, banner_color: tempColor, banner_image: null };
            try { await updateBanner(payload); setBannerStyle({ backgroundColor: tempColor, backgroundImage: "none" }); setColorModalVisible(false); } catch (e) { }
          }}
          onCancel={() => setColorModalVisible(false)}
        >
          <input type="color" value={tempColor} onChange={(e) => setTempColor(e.target.value)} />
        </Modal>

        <Modal
          title={<span style={{ fontWeight: 500 }}>Upload Background Image</span>}
          open={isImageModalVisible}
          onOk={async () => {
            if (tempImage) {
              const payload = { user_id: loginUserId, banner_color: null, banner_image: tempImage };
              try { await updateBanner(payload); setBannerStyle({ backgroundImage: `url(${tempImage})`, backgroundColor: "transparent" }); setImageModalVisible(false); } catch (e) { }
            }
          }}
          onCancel={() => { setTempImage(null); setImageModalVisible(false); }}
        >
          <Upload.Dragger accept="image/*" beforeUpload={(f) => { const r = new FileReader(); r.onload = (e) => setTempImage(e.target.result); r.readAsDataURL(f); return false; }}>
            Click or drag file to this area
          </Upload.Dragger>
        </Modal>

        {/* Profile Info */}
        <div style={{ display: "flex", alignItems: "center", gap: "24px", zIndex: 1 }}>
          <div style={{ position: "relative" }}>
            <Avatar size={120} src={profileImage || defaultAvatar} style={{ border: "4px solid rgba(255,255,255,0.2)", background: "#fff" }} />
            <Upload showUploadList={false} beforeUpload={() => false} onChange={handleUpload}>
              <Button icon={<UploadOutlined />} size="small" style={{ position: "absolute", bottom: 4, right: 4, borderRadius: "50%" }} />
            </Upload>
          </div>
          <div>
            <h2 style={{ color: "#fff", margin: "0 0 4px 0", fontSize: "28px", display: "flex", alignItems: "center", gap: "8px" }}>
              {fname} {lname}
              <CheckCircleFilled style={{ color: "#fff", fontSize: "20px" }} />
            </h2>
            <p style={{ color: "rgba(255,255,255,0.9)", margin: "0 0 10px 0", fontSize: "15px" }}>{email}</p>
            <div style={{ display: "flex", gap: "24px", color: "#d8d8d8ff", fontSize: "14px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><IoLocationSharp size={18} /> {location || "Chennai, India"}</span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><CalendarOutlined size={18} /> Member since {createdAt ? new Date(createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : "Sep 2024"}</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div style={{ zIndex: 1 }}>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => { setActiveTab("basic"); showDrawer(); setLoading(true); setTimeout(() => setLoading(false), 700); }}
            style={{
              background: "#fff",
              color: "#5f2eea",
              border: "none",
              borderRadius: "24px",
              padding: "8px 24px",
              fontWeight: 600,
              height: "40px"
            }}
          >
            Edit Profile
          </Button>
        </div>
      </div>

      <Content className="profile-main-content">
        <div className="profile-page-details">
          <div
            className="hide-scrollbar profile-grid-layout"
            style={{
              flex: 1,
              overflowY: "auto",
              height: "100vh",
              gap: "24px"
            }}
          >
            {/* Left Column */}
            <div className="profile-left-column" style={{ flex: "0 0 63%" }}>
              <div className="profile-sections">
                <Card
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="section-icon-container"><FaUserPen /></div>
                      <span>About Me</span>
                    </div>
                  }
                  extra={
                    <Button onClick={() => { setActiveTab("about"); showDrawer(); setLoading(true); setTimeout(() => setLoading(false), 700); }} className="update-action-btn">
                      <FiEdit /> {isAbout ? 'Update About' : 'Add About'}
                    </Button>
                  }
                  className="profile-section-card-updated" styles={{ header: { borderBottom: 'none' }, body: { paddingTop: 0 } }}>
                  {userProfileLoading ? (
                    <Skeleton active />
                  ) : (
                    <>
                      <p style={{ color: '#64748b', margin: 0, fontSize: "13px", marginBottom: "16px" }}>
                        An introduction to who I am and what I bring to the table!
                      </p>
                      {isAbout && (
                        <>
                          <p style={{ display: "-webkit-box", WebkitLineClamp: expanded ? "unset" : 4, WebkitBoxOrient: "vertical", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "pre-line", marginBottom: 0, color: '#64748b' }}>
                            {isAbout}
                          </p>
                          <Button type="link" onClick={() => setExpanded(!expanded)} style={{ paddingLeft: 0, color: "#5f2eea", textDecoration: "none", fontSize: "13px", marginTop: "8px" }}>
                            {expanded ? "Show Less ∧" : "Show More ∨"}
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </Card>
              </div>

              {/* Resume upload Sections */}
              <div className="profile-sections">
                <Card
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="section-icon-container"><FileText size={16} /></div>
                      <span>Resume</span>
                    </div>
                  }
                  extra={
                    <Button onClick={() => { setActiveTab("resume"); showDrawer(); setLoading(true); setTimeout(() => setLoading(false), 700); }} style={{ background: '#5f2eea', color: '#fff', border: 'none', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <PlusOutlined /> {isResume ? 'Replace Resume' : 'Add Resume'}
                    </Button>
                  }
                  className="profile-section-card-updated" styles={{ header: { borderBottom: 'none' }, body: { paddingTop: 0 } }}>
                  <p style={{ color: '#64748b', margin: 0, fontSize: "13px" }}>
                    Adding your Resume helps you to tell who you are and what makes you different to employers and recruiters.
                  </p>

                  {userProfileLoading ? (
                    <Skeleton active paragraph={{ rows: 1 }} />
                  ) : (
                    <>
                      {isResume && (
                        <div style={{ border: "1px solid #f0f0f0", borderRadius: 8, padding: "12px 16px", marginTop: 16, backgroundColor: "#fafafa", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center" }}>
                            <FileText style={{ color: "#5f2eea", fontSize: 24, marginRight: 12 }} />
                            <div>
                              <Text strong>Current Resume</Text>
                              <br />
                              <Text type="secondary" style={{ fontSize: 12 }}>Uploaded resume is ready for employers to view</Text>
                            </div>
                          </div>
                          <Button style={{ background: "#f3efff", color: "#5f2eea", border: "none" }} size="small" onClick={() => {
                            if (isResume.startsWith("http")) { window.open(isResume, "_blank"); } else if (isResume.startsWith("data:application/pdf")) { const win = window.open("", "_blank"); win.document.write(`<iframe width="100%" height="100%" src="${isResume}" frameborder="0"></iframe>`); } else { const a = document.createElement("a"); a.href = isResume; a.download = "resume.pdf"; document.body.appendChild(a); a.click(); document.body.removeChild(a); }
                          }}>
                            View Resume
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </Card>
              </div>

              {/* Skills Sections */}
              <div className="profile-sections">
                <Card
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="section-icon-container" style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>&lt;/&gt;</div>
                      <span>Skills</span>
                    </div>
                  }
                  extra={
                    <Button onClick={() => { setActiveTab("skills"); showDrawer(); setLoading(true); setTimeout(() => setLoading(false), 700); }} className="update-action-btn">
                      <FiEdit /> {isSkills && isSkills.length > 0 ? 'Update Skills' : 'Add Skills'}
                    </Button>
                  }
                  className="profile-section-card-updated" styles={{ header: { borderBottom: 'none' }, body: { paddingTop: 0 } }}>
                  <p style={{ color: '#64748b', margin: 0, fontSize: "13px" }}>
                    Craft an engaging story in your bio and make meaningful connections!
                  </p>
                  {userProfileLoading ? (
                    <Skeleton active />
                  ) : (
                    <div style={{ marginTop: 12 }}>
                      {isSkills && isSkills.length > 0 && (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {isSkills.slice(0, 5).map((skill, index) => (
                            <Tag key={index} style={{ color: "#5f2eea", background: "#f3efff", border: "none", fontSize: 13, fontWeight: "500", padding: "4px 12px", borderRadius: "16px", margin: 0 }}>
                              {skill}
                            </Tag>
                          ))}
                          {isSkills.length > 5 && (
                            <Tag style={{ color: "#5f2eea", background: "#f3efff", border: "none", fontSize: 13, fontWeight: "500", padding: "4px 12px", borderRadius: "16px", margin: 0 }}>
                              +{isSkills.length - 5} more
                            </Tag>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              </div>

              {/* Work Experience Sections */}
              <div className="profile-sections">
                <Card
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="section-icon-container"><FiBriefcase size={16} /></div>
                      <span>Work Experience</span>
                    </div>
                  }
                  extra={
                    <Button onClick={() => { setActiveTab("experience"); showDrawer(); setLoading(true); setTimeout(() => setLoading(false), 700); }} style={{ background: '#5f2eea', color: '#fff', border: 'none', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <PlusOutlined /> Add Experience
                    </Button>
                  }
                  className="profile-section-card-updated" styles={{ header: { borderBottom: 'none' }, body: { paddingTop: 0 } }}>
                  <p style={{ color: '#64748b', margin: 0, fontSize: "13px" }}>
                    Narrate your professional journey and fast-track your way to new career heights!
                  </p>
                  {userProfileLoading ? (
                    <Skeleton active />
                  ) : (
                    <div className="work-experience-section" style={{ marginTop: 16 }}>
                      {companies.length > 0 && isWorkExp ? (
                        <div className="experience-timeline">
                          {companies.map((company, index) => (
                            <div key={company.id || index} className="experience-card" style={{ padding: "16px", border: "1px solid #f0f0f0", borderRadius: "8px", marginBottom: "12px", background: "#fafafa" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div>
                                  <h3 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: "600", color: "#1e293b" }}>
                                    {company.workingCompanyName || "Not specified"}
                                  </h3>
                                  <p style={{ margin: "0 0 8px", fontSize: "13px", color: "#64748b" }}>
                                    {company.jobTitle || "Not specified"}
                                  </p>
                                  <div style={{ fontSize: "12px", color: "#64748b", display: "flex", gap: "16px" }}>
                                    <span>{company.workingStartDate || "Not specified"} - {company.workingEndDate || "Present"}</span>
                                  </div>
                                </div>
                                <div style={{ width: 40, height: 40, borderRadius: "8px", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", color: "#64748b" }}>
                                  {company.workingCompanyName?.charAt(0).toUpperCase() || "C"}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ padding: "16px", border: "1px dashed #d9d9d9", borderRadius: "8px", background: "#fafafa", marginTop: "16px" }}>
                          <h4 style={{ margin: "0 0 4px", fontSize: "14px", color: "#1e293b" }}>Not specified</h4>
                          <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>Add your work experience to highlight your professional background.</p>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              </div>

              {/* Profile Sections */}
              <div style={{ marginTop: 25 }} className="profile-sections">
                {/* Education Section */}

                <Card
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="section-icon-container"><LuGraduationCap size={16} /></div>
                      <span>Education</span>
                    </div>
                  }
                  extra={
                    <Button onClick={() => { setActiveTab("education"); showDrawer(); setLoading(true); setTimeout(() => setLoading(false), 700); }} style={{ background: '#5f2eea', color: '#fff', border: 'none', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <PlusOutlined /> Add Education
                    </Button>
                  }
                  className="profile-section-card-updated" styles={{ header: { borderBottom: 'none' }, body: { paddingTop: 0 } }}>
                  <p style={{ color: '#64748b', margin: 0, fontSize: "13px", marginBottom: "16px" }}>
                    Showcase your academic journey and open doors to your dream career opportunities!
                  </p>
                      {userProfileLoading ? (
                        <Skeleton active />
                      ) : (
                        <>
                          {isEducation && isEducation.length > 0 ? (
                            <div className="education-section">
                              <div className="education-grid">
                                {isEducation.map((edu, index) => (
                                  <div key={index} className="education-card" style={{ position: "relative" }}>
                                    <button
                                      className="icon-btn edit-btn"
                                      style={{ position: "absolute", top: 16, right: 16 }}
                                      onClick={() => {
                                        setActiveTab("education");
                                        showDrawer();
                                        setEducationData(edu);
                                      }}
                                    >
                                      <FiEdit size={16} />
                                    </button>
                                    <div className="education-header1">
                                      <div className="education-icon">
                                        <svg
                                          width="24"
                                          height="24"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          xmlns="http://www.w3.org/2000/svg"
                                        >
                                          <path
                                            d="M22 10V16M22 10L12 5L2 10L12 15L22 10Z"
                                            stroke="#5f2eea"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                          <path
                                            d="M6 12V16C6 16.8 6.93333 17.6 8 18L12 20L16 18C17.0667 17.6 18 16.8 18 16V12"
                                            stroke="#5f2eea"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                        </svg>
                                      </div>
                                      <div className="education-titles">
                                        <h3 className="education-degree">
                                          {edu.qualification || "Not specified"}
                                          <br></br>
                                          {edu.specialization && (
                                            <span className="education-specialization">
                                              {edu.specialization}
                                            </span>
                                          )}
                                        </h3>
                                        <p className="education-institution">
                                          {edu.college || "Not specified"}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="education-details">
                                      <div className="detail-row">
                                        <svg
                                          className="detail-icon"
                                          width="16"
                                          height="16"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          xmlns="http://www.w3.org/2000/svg"
                                        >
                                          <path
                                            d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                                            stroke="#5f2eea"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                          <path
                                            d="M12 6V12L16 14"
                                            stroke="#5f2eea"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                        </svg>
                                        <span>
                                          {educationStartDate || "Not specified"}{" "}
                                          - {educationEndDate || "Present"}
                                        </span>
                                      </div>

                                      {edu.course && (
                                        <div className="detail-row">
                                          <svg
                                            className="detail-icon"
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                          >
                                            <path
                                              d="M19 21V5C19 3.89543 18.1046 3 17 3H7C5.89543 3 5 3.89543 5 5V21M19 21L21 21M19 21H14M5 21L3 21M5 21H10M9 6.99998H10M9 11H10M14 6.99998H15M14 11H15"
                                              stroke="#5f2eea"
                                              strokeWidth="2"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                            />
                                          </svg>
                                          <span>{edu.course}</span>
                                        </div>
                                      )}

                                      {edu.grade && (
                                        <div className="detail-row">
                                          <svg
                                            className="detail-icon"
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                          >
                                            <path
                                              d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z"
                                              stroke="#5f2eea"
                                              strokeWidth="2"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                            />
                                            <path
                                              d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z"
                                              stroke="#5f2eea"
                                              strokeWidth="2"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                            />
                                          </svg>
                                          <span>Grade: {edu.grade}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>

                            </div>
                          ) : (
                            <div className="empty-state education-empty">
                              <div className="empty-illustration">
                                <svg
                                  width="120"
                                  height="120"
                                  viewBox="0 0 200 200"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M50 75L100 50L150 75V125L100 150L50 125V75Z"
                                    stroke="#5f2eea"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <path
                                    d="M50 75L100 100L150 75M100 100V150"
                                    stroke="#5f2eea"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <path
                                    d="M75 62.5L100 75L125 62.5"
                                    stroke="#5f2eea"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </div>
                              <h3 className="empty-title">
                                No Education Added Yet
                              </h3>
                              <p className="empty-description">
                                Showcase your academic achievements by adding your
                                education history. This helps employers understand
                                your qualifications.
                              </p>
                            </div>
                          )}
                        </>
                      )}
                </Card>
              </div>

              <div style={{ marginTop: 25 }} className="profile-sections">
                {/* Projects Section */}

                <Card
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="section-icon-container"><FiFolder size={16} /></div>
                      <span>Projects</span>
                    </div>
                  }
                  extra={
                    <Button onClick={() => { setActiveTab("projects"); showDrawer(); setLoading(true); setTimeout(() => setLoading(false), 700); }} style={{ background: '#5f2eea', color: '#fff', border: 'none', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <PlusOutlined /> Add Project
                    </Button>
                  }
                  className="profile-section-card-updated profile_result" styles={{ header: { borderBottom: 'none' }, body: { paddingTop: 0 } }}>
                  <p style={{ color: '#64748b', margin: 0, fontSize: "13px", marginBottom: "16px" }}>
                    Unveil your projects to the world and pave your path to professional greatness!
                  </p>
                      {userProfileLoading ? (
                        <Skeleton active />
                      ) : (
                        <>
                          {isProjects && isProjects.length > 0 ? (
                            <div className="projects-section">
                              <div className="projects-grid">
                                {isProjects.map((projects, index) => (
                                  <motion.div
                                    key={index}
                                    className="project-card"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                      duration: 0.3,
                                      delay: index * 0.1,
                                    }}
                                  >
                                    <button
                                      className="icon-btn edit-btn"
                                      style={{ position: "absolute", top: 16, right: 16, zIndex: 10 }}
                                      onClick={() => {
                                        setActiveTab("projects");
                                        showDrawer();
                                        setProjectData(projects);
                                      }}
                                    >
                                      <FiEdit size={16} />
                                    </button>
                                    <div className="project-header">
                                      <div className="project-icon">
                                        <svg
                                          width="24"
                                          height="24"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                        >
                                          <path
                                            d="M3 9L12 3L21 9V19L12 23L3 19V9Z"
                                            stroke="#5f2eea"
                                            strokeWidth="2"
                                          />
                                          <path
                                            d="M3 9L12 13L21 9M12 13V23"
                                            stroke="#5f2eea"
                                            strokeWidth="2"
                                          />
                                        </svg>
                                      </div>
                                      <h3 className="project-title">
                                        {projects.project_title ||
                                          "Untitled Project"}
                                        <span className="project-status-badge">
                                          {projects.current
                                            ? "Ongoing"
                                            : "Completed"}
                                        </span>
                                      </h3>
                                    </div>

                                    <div className="project-meta">
                                      <div className="project-date">
                                        <CalendarOutlined
                                          style={{ color: "#5f2eea" }}
                                        />
                                        <span>
                                          {projects.start_date || "Not specified"}{" "}
                                          - {projects.end_date || "Present"}
                                        </span>
                                      </div>
                                    </div>

                                    <p className="project-description">
                                      {projects.description ||
                                        "No description provided."}
                                    </p>
                                  </motion.div>
                                ))}
                              </div>

                            </div>
                          ) : (
                            <motion.div
                              className="empty-state projects-empty"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.5 }}
                            >
                              <div className="empty-illustration">
                                <svg
                                  width="100"
                                  height="100"
                                  viewBox="0 0 200 200"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <defs>
                                    <linearGradient
                                      id="projectGradient"
                                      x1="0%"
                                      y1="0%"
                                      x2="100%"
                                      y2="100%"
                                    >
                                      <stop offset="0%" stopColor="#5f2eea" />
                                      <stop offset="100%" stopColor="#8a63f7" />
                                    </linearGradient>
                                  </defs>
                                  <path
                                    d="M50 75L100 50L150 75V125L100 150L50 125V75Z"
                                    stroke="url(#projectGradient)"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <path
                                    d="M50 75L100 100L150 75M100 100V150"
                                    stroke="url(#projectGradient)"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <path
                                    d="M75 62.5L100 75L125 62.5"
                                    stroke="url(#projectGradient)"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </div>
                              <h3 className="empty-title">
                                Your Project Showcase Awaits
                              </h3>
                              <p className="empty-description">
                                Transform your portfolio with stunning project
                                displays. Highlight your work with rich details,
                                technologies used, and impressive visuals to
                                captivate your audience.
                              </p>
                            </motion.div>
                          )}
                        </>
                      )}
                </Card>
              </div>

              <div style={{ marginTop: 25 }} className="profile-sections">
                {/* Social Links Section */}
                <div className="profile-section-card userprofile_cards">
                  <div className="skills_card">
                    <div style={{ textAlign: "left" }}>
                      <h3>Social Links</h3>
                    </div>
                  </div>
                  {userProfileLoading ? (
                    <Skeleton active />
                  ) : (
                    <>
                      <div className="userprofile_social">
                        {socialIcons.map(({ key, icon, color }) => {
                          const link = isSocialLinks?.[key] || null;

                          return link ? (
                            <a
                              key={key}
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="social-icon active"
                              style={{ backgroundColor: color }}
                            >
                              {icon}
                            </a>
                          ) : (
                            <Tooltip key={key} title="Not yet added">
                              <div className="social-icon inactive">{icon}</div>
                            </Tooltip>
                          );
                        })}
                      </div>
                      <Button
                        onClick={() => {
                          setActiveTab("sociallinks");
                          showDrawer();
                          setLoading(true);
                          const timer = setTimeout(() => {
                            setLoading(false);
                          }, 700);

                          return () => clearTimeout(timer);
                        }}
                        style={{
                          color: "#5f2eea",
                          paddingLeft: 0,
                          paddingTop: 10,
                        }}
                        type="link"
                      >
                        <PlusOutlined />
                        Update Links
                      </Button>
                    </>
                  )}

                  <Divider />
                </div>
              </div>

            </div> {/* End of Left Column */}

            {/* Right Column */}
            <div className="profile-right-column" style={{ flex: "0 0 37%", display: "flex", flexDirection: "column", gap: "24px", position: "sticky", top: "0px", alignSelf: "flex-start" }}>
              {/* Profile Overview */}
              <div
                className="profile-section-card-updated"
                style={{
                  background: "#fff",
                  padding: "24px",
                }}
              >
                <h3 style={{ margin: "0 0 20px 0", fontSize: "18px", fontWeight: 700, color: "#1e293b" }}>Profile Overview</h3>

                <div style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <Award size={16} color="#40c463" />
                    <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>Profile Completion</span>
                  </div>
                  <Progress percent={profileStats.completionPercentage} strokeColor="#40c463" showInfo={false} size="small" />
                  <span style={{ fontSize: "0.8rem", color: "#40c463", fontWeight: 500 }}>{profileStats.completionPercentage}% complete</span>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <Clock size={16} color="#5f2eea" />
                    <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>Last Updated</span>
                  </div>
                  <span style={{ fontSize: "0.85rem", color: "#666", paddingLeft: "24px" }}>{createdAt ? new Date(createdAt).toLocaleDateString('en-GB') : "02/09/2026"}</span>
                </div>

                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="#5f2eea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="#5f2eea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>User Details</span>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#666", paddingLeft: "24px", display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div style={{ display: "flex", gap: "4px" }}><Check size={14} color="#5f2eea" /> Experience: {totalYearsExperience ? `${totalYearsExperience} Years ${totalMonthsExperience} Months` : "Fresher"}</div>
                    <div style={{ display: "flex", gap: "4px" }}><Check size={14} color="#5f2eea" /> Location: {location || "Not specified"}</div>
                  </div>
                </div>
              </div>

              {/* Activity Streak Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="streak-container profile-section-card-updated"
                style={{
                  background: "#fff",
                  padding: "24px",
                  marginBottom: "32px",
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "16px",
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "#1e293b",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span>🔥</span>
                    Activity Streak
                  </h3>
                </div>

                {/* Heatmap */}
                {isLoading ? (
                  <div
                    style={{
                      height: "160px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div className="loading-pulse" />
                  </div>
                ) : (
                  <motion.div
                    className="streak-values"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    style={{ marginBottom: "16px" }}
                  >
                    <CalendarHeatmap
                      startDate={subDays(today, 365)}
                      endDate={today}
                      values={streakData}
                      classForValue={getClassForValue}
                      showWeekdayLabels={true}
                      gutterSize={2}
                      monthLabels={[
                        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
                      ]}
                      weekdayLabels={[
                        "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
                      ]}
                      titleForValue={(value) => {
                        if (!value || !value.date) return "No activities";

                        const date = format(
                          parseISO(value.date),
                          "MMMM d, yyyy"
                        );
                        const streakText = value.streak
                          ? `${value.streak} Day${value.streak > 0 ? "s" : ""
                          } Streak`
                          : "No Streak";

                        return `${date} | ${streakText}`;
                      }}
                    />
                  </motion.div>
                )}

                {/* Legend */}
                <div style={{ display: "flex", gap: "16px", marginBottom: "24px", paddingLeft: "4px" }}>
                  <LegendBox color="#5f2eea" label="Active days" />
                  <LegendBox color="#ebedf0" label="No activity" />
                </div>

                {/* Streak Info */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "16px",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <StreakBox
                      label="Current Streak"
                      value={currentStreak}
                      color="#5f2eea"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <StreakBox
                      label="Max Streak"
                      value={maxStreak}
                      color="#5f2eea"
                    />
                  </div>
                </div>
              </motion.div>

            </div> {/* End of Right Column */}

          </div> {/* End of profile-grid-layout */}

          {/* Drawer */}
          <Drawer
            title={null}
            placement="right"
            onClose={resetFormFields}
            open={open}
            width={1100}
            className="user_details_drawer"
          >
            {loading ? (
              <Skeleton active />
            ) : (
              <>
                <div style={{ display: "flex", gap: 0 }}>
                  {/* Sidebar */}
                  <div
                    style={{
                      width: 340,
                      background: "#f9f9f9",
                      padding: 20,
                      borderRight: "1px solid #eee",
                    }}
                  >
                    <div style={{ marginBottom: 24 }}>
                      <Text strong>Enhance your Profile</Text>
                      <Text
                        type="secondary"
                        style={{ display: "block", marginTop: 4 }}
                      >
                        Stay ahead of the competition by regularly
                        updating your profile.
                      </Text>
                      <Progress
                        percent={78}
                        size="small"
                        style={{ marginTop: 8 }}
                      />
                    </div>
                    <Menu
                      mode="vertical"
                      selectedKeys={[activeTab]}
                      onClick={(e) => {
                        setActiveTab(e.key);
                        setDetailsLoading(true);
                        const timer = setTimeout(() => {
                          setDetailsLoading(false);
                        }, 700);

                        return () => clearTimeout(timer);
                      }}
                      items={items}
                    />
                  </div>

                  {/* Dynamic Content */}
                  <div
                    style={{
                      flex: 1,
                      padding: 30,
                      height: 700,
                      overflowY: "scroll",
                      scrollbarWidth: "none",
                      msOverflowStyle: "none",
                    }}
                    className="hide-scrollbar"
                  >
                    {TabContent[activeTab] ? (
                      TabContent[activeTab]()
                    ) : (
                      <p>Section not found</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </Drawer>

        </div>
      </Content>
    </>
  );
}
