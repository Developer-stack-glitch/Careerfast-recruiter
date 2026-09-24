'use client';
import React, { useEffect, useState } from "react";
import {
  Form,
  Steps,
  Divider,
  Card,
  Typography,
  Button,
  Avatar,
  Progress,
  Modal,
  Checkbox,
  message,
  Input,
  Tag,
  Upload,
  DatePicker,
  Select,
} from "antd";
import {
  UserOutlined,
  SolutionOutlined,
  CreditCardOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  ArrowRightOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { IoMdAdd } from "react-icons/io";
import { Country, State, City } from "country-state-city";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import "../css/ProfileDetailsPage.css";
import { MdDeleteForever } from "react-icons/md";
import CommonInputField from "../Common/CommonInputField";
import CommonSelectField from "../Common/CommonSelectField";
import CommonTextArea from "../Common/CommonTextArea";
import { IoIosMale } from "react-icons/io";
import { IoFemaleOutline } from "react-icons/io5";
import { FaBuildingUser } from "react-icons/fa6";
import { LuGraduationCap } from "react-icons/lu";
import { GiOfficeChair } from "react-icons/gi";
import { GiNewShoot } from "react-icons/gi";
import { LiaSchoolSolid } from "react-icons/lia";
import { useNavigate } from "@/routing-shim";
import { PiGenderTransgender } from "react-icons/pi";
import { PiGenderIntersex } from "react-icons/pi";
import { PiGenderNonbinary } from "react-icons/pi";
import { MdNotInterested } from "react-icons/md";
import {
  emailValidator,
  nameValidator,
  pincodeValidator,
  selectValidator,
  userTypeValidator,
  phoneValidation,
  genderValidator,
} from "../Common/Validation";
import {
  getCourses,
  getGenderData,
  getUserTypeData,
  insertProfileData,
  verifyEmail,
  verifyOtp,
} from "../ApiService/action";

const { Title, Text } = Typography;

dayjs.extend(customParseFormat);

const ProfileDetails = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(25);
  const [fname, setFname] = useState("");
  const [fnameError, setFnameError] = useState("");
  const [lname, setLname] = useState("");
  const [lnameError, setLnameError] = useState("");
  const [emailVerified, setEmailVerified] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [number, setNumber] = useState("");
  const [numberError, setNumberError] = useState("");
  const [pincode, setPincode] = useState("");
  const [pincodeError, setPincodeError] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [countryList, setCountryList] = useState([]);
  const [country, setCountry] = useState([]);
  const [countryError, setCountryError] = useState("");
  const [countryId, setCountryId] = useState(null);
  const [state, setState] = useState("");
  const [stateError, setStateError] = useState("");
  const [stateList, setStateList] = useState([]);
  const [city, setCity] = useState("");
  const [cityError, setCityError] = useState("");
  const [cityList, setCityList] = useState([]);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [address, setAddress] = useState("");
  const [addressError, setAddressError] = useState("");
  const [open, setOpen] = useState(false);
  const [editPhoto, setEditPhoto] = useState("");
  const [editPhotoError, setEditPhotoError] = useState("");
  const [activeButton, setActiveButton] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [resume, setResume] = useState("");
  const [resumeError, setResumeError] = useState("");
  const [gender, setGender] = useState("");
  const [genderError, setGenderError] = useState("");
  const [userTypeactiveButton, setUserTypeActiveButton] = useState(null);
  const [userType, setUserType] = useState("");
  const [userTypeData, setUserTypeData] = useState([]);
  const [userTypeError, setUserTypeError] = useState("");
  const [course, setCourse] = useState(null);
  const [courseError, setCourseError] = useState("");
  const [courseOptions, setCourseOptions] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [fresherCourse, setFresherCourse] = useState("");
  const [fresherCourseError, setFresherCourseError] = useState("");
  const [fresherCourseOptions, setFresherCourseOptions] = useState([]);
  const [fresherStartDate, setFresherStartDate] = useState("");
  const [fresherStartDateError, setFresherStartDateError] = useState("");
  const [fresherEndtDate, setFresherEndDate] = useState("");
  const [fresherEndDateError, setFresherEndDateError] = useState("");
  const [fresherCustomSkill, setFresherCustomSkill] = useState("");

  // 2
  const [selectExperienceType, setSelectExperienceType] = useState("");
  const [selectExperienceTypeError, setSelectExperienceTypeError] =
    useState("");
  const [totalYearsExperience, setTotalYearsExperience] = useState("");
  const [totalYearsExperienceError, setTotalYearsExperienceError] =
    useState("");
  const [totalMonthsExperience, setTotalMonthsExperience] = useState("");
  const [totalMonthsExperienceError, setTotalMonthsExperienceError] =
    useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobTitleError, setJobTitleError] = useState("");

  const [experienceType, setExperienceType] = useState(null);
  const [otp, setOtp] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpError, setOtpError] = useState(null);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [skillsError, setSkillsError] = useState(null);
  const [startDateError, setStartDateError] = useState("");
  const [endDateError, setEndDateError] = useState("");
  const [loginUserId, setLoginUserId] = useState(null);
  const [loading, setLoading] = React.useState(false);
  const [genderOptions, setGenderOptions] = useState([]);
  
  // New Filter Fields
  const [languages, setLanguages] = useState([]);
  const [visaStatus, setVisaStatus] = useState(null);
  const [preferredJobType, setPreferredJobType] = useState([]);
  const [dob, setDob] = useState(null);
  const [companyHeadcount, setCompanyHeadcount] = useState(null);

  // add company
  const [companies, setCompanies] = useState([
    {
      id: Date.now(),
      jobTitle: "",
      companyName: "",
      designation: "",
      workingStartDate: "Select Date",
      workingEndDate: "Select Date",
      customSkill: "",
      skills: [],
      currentlyWorking: false,
      jobTitleError: "",
      companyNameError: "",
      designationError: "",
      workingStartDateError: "",
      workingEndDateError: "",
      skillsError: "", // 👈 New
    },
  ]);

  const handleAddCompany = () => {
    setCompanies([
      ...companies,
      {
        id: Date.now(),
        jobTitle: "",
        companyName: "",
        designation: "",
        workingStartDate: "",
        workingEndDate: "",
        customSkill: "",
        currentlyWorking: false,
        skills: [],
      },
    ]);
  };

  const handleCompanyFields = (index, fieldName, value) => {
    const updateDatas = [...companies];

    // For skills, we need to handle both direct value setting (from onChange) and event objects
    if (fieldName === "customSkill") {
      updateDatas[index][fieldName] = value.target ? value.target.value : value;
    } else {
      updateDatas[index][fieldName] = value;
    }

    // Rest of your validation logic...
    if (fieldName === "jobTitle") {
      updateDatas[index].jobTitleError = nameValidator(value);
    }

    if (fieldName === "companyName") {
      updateDatas[index].companyNameError = nameValidator(value);
    }

    if (fieldName === "designation") {
      updateDatas[index].designationError = nameValidator(value);
    }

    if (fieldName === "workingStartDate") {
      updateDatas[index].workingStartDateError = selectValidator(value);
    }

    if (fieldName === "workingEndDate") {
      updateDatas[index].workingEndDateError = selectValidator(value);
    }

    if (fieldName === "currentlyWorking") {
      if (updateDatas[index].currentlyWorking === true) {
        updateDatas[index].workingEndDate = "";
        updateDatas[index].workingEndDateError = "";
      }
    }

    setCompanies(updateDatas);
  };

  const handleDeleteCompany = (index) => {
    if (companies.length === 1) return;
    let data = [...companies];
    data.splice(index, 1);
    setCompanies(data);
  };

  const handleRemoveSkill = (companyIndex, skillToRemove) => {
    const updatedCompanies = [...companies];
    updatedCompanies[companyIndex].skills = updatedCompanies[companyIndex].skills.filter(
      (skill) => skill !== skillToRemove
    );
    setCompanies(updatedCompanies);
  };


  const handleCustomSkillAdd = (index) => {
    const trimmed = companies[index].customSkill?.trim();

    if (
      trimmed &&
      !((companies[index].skills || []).some(
        (skill) => skill.toLowerCase() === trimmed.toLowerCase()
      ))
    ) {
      const updatedCompanies = [...companies];
      updatedCompanies[index].skills = [...(updatedCompanies[index].skills || []), trimmed];
      updatedCompanies[index].customSkill = "";
      setCompanies(updatedCompanies);
    }
  };

  //

  useEffect(() => {
    setCountryList(Country.getAllCountries());
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("loginDetails");
      if (stored) {
        const loginDetails = JSON.parse(stored);
        setLoginUserId(loginDetails.id);
        setFname(loginDetails.first_name);
        setLname(loginDetails.last_name);
        setEmail(loginDetails.email);
        setNumber(loginDetails.phone);
      }
    } catch (error) {
      console.error("Invalid JSON in localStorage", error);
    }
  }, []);

  useEffect(() => {
    getUserTypeDataType();
  }, []);

  const getUserTypeDataType = async () => {
    try {
      const response = await getUserTypeData();
      setUserTypeData(response?.data?.data || []);
      console.log("getUserTypeData", response);
    } catch (error) {
      console.log("getUserTypeData", error);
    } finally {
      setTimeout(() => {
        getGenderDataType();
      }, 300);
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
        getCourseData();
      }, 300);
    }
  };

  const getCourseData = async () => {
    try {
      const response = await getCourses();
      setCourseOptions(response?.data?.data || []);
      setFresherCourse(response?.data?.data || []);
      setFresherCourseOptions(response?.data?.data || []);
    } catch (error) {
      console.log("getCourses", error);
    }
  };

  const handleCountryChange = (countryCode) => {
    const country = countryList.find((c) => c.isoCode === countryCode);
    setCountryId(country);
    setSelectedState(null);
    setSelectedCity(null);

    const states = State.getStatesOfCountry(countryCode);
    setStateList(states);
    setCityList([]); // Clear city list

    form.setFieldsValue({
      country: countryCode,
      state: undefined,
      city: undefined,
    });
  };

  const yearOptions = Array.from({ length: 2025 - 1990 + 1 }, (_, i) => {
    const year = (1990 + i).toString();
    return { label: year, value: year };
  });

  const FresherYearOptions = Array.from({ length: 2025 - 1990 + 1 }, (_, i) => {
    const FreshYear = (1990 + i).toString();
    return { label: FreshYear, value: FreshYear };
  });

  const workingComapanyYearOptions = Array.from(
    { length: 2025 - 1990 + 1 },
    (_, i) => {
      const FreshYear = (1990 + i).toString();
      return { label: FreshYear, value: FreshYear };
    }
  );

  const startYearOptions = yearOptions;
  const endYearOptions = yearOptions;

  const FresherStartYearOptions = FresherYearOptions;
  const fresherEndYearOptions = FresherYearOptions;

  const workingStartYearOptions = workingComapanyYearOptions;
  const workingEndYearOptions = workingComapanyYearOptions;

  const handleStateChange = (stateName) => {
    const state = stateList.find((s) => s.name === stateName);
    setSelectedState(state);
    form.setFieldsValue({ state: stateName, city: undefined });

    if (countryId && state) {
      const cities = City.getCitiesOfState(countryId.isoCode, state.isoCode);

      const cityOptions = cities.map((city) => ({
        label: city.name,
        value: city.name,
      }));

      setCityList(cityOptions);
      setSelectedCity(null);
    }
  };

  const handleCityChange = (cityName) => {
    setSelectedCity(cityName);
    form.setFieldsValue({ city: cityName });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      const reader = new FileReader();

      reader.onloadend = () => {
        const base64String = reader.result;
        setProfileImage(base64String); // This could be used for preview or sending to backend
      };

      reader.readAsDataURL(file);
    }
  };

  const fileValidator = (file) => {
    if (!file) return "Photo is required";
    if (!file.type.startsWith("image/")) return "Only image files are allowed";
    return "";
  };

  const resumeValidator = (file) => {
    if (!file) return "Resume is required";
    if (file.type !== "application/pdf" && file.type !== "application/msword" && file.type !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return "Only PDF and Word files are allowed";
    if (file.size > 5 * 1024 * 1024) return "File must be smaller than 5MB";
    return "";
  };

  const handleResumeChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResumeFile(file);
      setResumeError(resumeValidator(file));
      const reader = new FileReader();
      reader.onloadend = () => {
        setResume(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setResumeFile(null);
      setResume("");
      setResumeError("Resume is required");
    }
  };

  const handAvatarClick = () => {
    if (profileImage) setIsModalVisible(true);
  };

  const handleExperienceTypeChange = (value) => setExperienceType(value);

  const handleModalClose = () => {
    setOpen(false);
  };

  const handleButtonClick = (buttonId) => {
    setActiveButton(buttonId);
    setGender(buttonId);
    setGenderError("");
  };

  const handleUserTypeClick = (buttonId) => {
    setUserTypeActiveButton((prev) => buttonId);
  };

  const [Class, setClass] = useState(null);
  const handleClassClick = (buttonId) => {
    setClass((prev) => buttonId);
  };

  const nextStep = (e) => {
    e.preventDefault();

    if (currentStep === 0) {
      ProfileInfoValidate();
    } else if (currentStep === 1) {
      ProfessionalInfoValidate();
    }
  };

  const ProfileInfoValidate = () => {
    const fnameValidate = nameValidator(fname);
    const lnameValidate = nameValidator(lname);
    const emailValidate = emailValidator(email);
    const phoneValidate = phoneValidation(number);
    const pincodeValidate = pincodeValidator(pincode);
    const countryValidate = selectValidator(countryId);
    const stateValidate = selectValidator(state);
    const cityValidate = selectValidator(city);
    const addressValidate = selectValidator(address);
    const editPhotoValidate = fileValidator(editPhoto);
    const genderValidate = genderValidator(gender);
    const userTypeValidate = userTypeValidator(userType);
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
    const resumeValidate = resumeValidator(resumeFile);

    setFnameError(fnameValidate);
    setLnameError(lnameValidate);
    setEmailError(emailValidate);
    setNumberError(phoneValidate);
    setPincodeError(pincodeValidate);
    setCountryError(countryValidate);
    setStateError(stateValidate);
    setCityError(cityValidate);
    setAddressError(addressValidate);
    setEditPhotoError(editPhotoValidate);
    setUserTypeError(userTypeValidate);
    setGenderError(genderValidate);
    setCourseError(courseValidate);
    setStartDateError(startDateValidate);
    setEndDateError(endDateValidate);
    setFresherCourseError(fresherCourseValidate);
    setFresherStartDateError(fresherStartDateValidate);
    setFresherEndDateError(fresherEndtDateValidate);
    setResumeError(resumeValidate);

    console.log(userType);

    if (
      fnameValidate ||
      lnameValidate ||
      emailValidate ||
      phoneValidate ||
      pincodeValidate ||
      countryValidate ||
      stateValidate ||
      cityValidate ||
      addressValidate ||
      genderValidate ||
      editPhotoValidate ||
      userTypeValidate ||
      courseValidate ||
      startDateValidate ||
      fresherCourseValidate ||
      fresherStartDateValidate ||
      fresherEndtDateValidate ||
      resumeValidate
    ) {
      message.error("Please fill all fields correctly before proceeding.");
      return;
    } else {
      setCurrentStep(1);
      setProgress(25);
    }
  };

  const ProfessionalInfoValidate = () => {
    let skillsValidate = "";
    const selectExperienceTypeValidate = selectValidator(selectExperienceType);
    setSelectExperienceTypeError(selectExperienceTypeValidate);

    let experienceErrors = false;

    if (selectExperienceType === "Experience") {
      const companiesWithoutSkills = companies.filter(
        (c) => !c.skills || c.skills.length === 0
      );

      if (companiesWithoutSkills.length > 0) {
        skillsValidate = "Skills are required for each company";
      }

      setSkillsError(skillsValidate);

      const totalYearsExperienceValidate = selectValidator(totalYearsExperience);
      const totalMonthsExperienceValidate = selectValidator(totalMonthsExperience);
      const jobTitleValidate = nameValidator(jobTitle);

      setTotalYearsExperienceError(totalYearsExperienceValidate);
      setTotalMonthsExperienceError(totalMonthsExperienceValidate);
      setJobTitleError(jobTitleValidate);

      const validateCompanyFields = companies.map((item) => ({
        ...item,
        jobTitleError: nameValidator(item.jobTitle),
        companyNameError: nameValidator(item.companyName),
        designationError: nameValidator(item.designation),
        workingStartDateError: selectValidator(item.workingStartDate),
        workingEndDateError:
          item.currentlyWorking === true ? "" : selectValidator(item.workingEndDate),
      }));

      setCompanies(validateCompanyFields);

      validateCompanyFields.forEach((err) => {
        if (
          err.jobTitleError ||
          err.companyNameError ||
          err.designationError ||
          err.workingStartDateError ||
          err.workingEndDateError
        ) {
          experienceErrors = true;
        }
      });

      if (
        selectExperienceTypeValidate ||
        totalYearsExperienceValidate ||
        totalMonthsExperienceValidate ||
        skillsValidate ||
        experienceErrors
      ) {
        message.error("Please fill all fields correctly before proceeding.");
        return;
      }
    } else {
      // ✅ Fresher case
      setSkillsError(""); // clear old error
      if (selectExperienceTypeValidate) {
        message.error("Please fill all fields correctly before proceeding.");
        return;
      }
    }

    if (selectExperienceType === "Fresher") {
      if (!selectedSkills || selectedSkills.length === 0) {
        setSkillsError(" Please add at least one skill");
        message.error(" Please add at least one skill before proceeding.");
        return;
      }
    }


    setCurrentStep(2);
    setProgress(50);
  };


  const doneProfile = async () => {
    const professional =
      selectExperienceType === "Experience"
        ? companies.map((company) => ({
          job_title: company.jobTitle,
          company_name: company.companyName,
          designation: company.designation,
          start_date: company.workingStartDate || null,
          end_date: company.workingEndDate || null,
          currently_working: company.currentlyWorking,
          skills: company.skills,
        }))
        : [
          {
            job_title: "Fresher",
            company_name: "",
            designation: "",
            start_date: null,
            end_date: null,
            currently_working: false,
            skills: selectedSkills,
          },
        ];


    const payload = {
      profile_image: profileImage,
      user_id: loginUserId,
      country: country,
      state: state,
      city: city,
      pincode: pincode,
      address: address,
      experince_type: selectExperienceType,
      total_years: totalYearsExperience,
      total_months: totalMonthsExperience,
      gender: gender,
      professional,
      user_type:
        userType === 1
          ? "College Student"
          : userType === 2
            ? "Professional"
            : userType === 3
              ? "School Student"
              : userType === 4
                ? "Fresher"
                : "",
      is_email_verified: "verified",
      ...(userType === 1 && {
        course: courseOptions.find((item) => item.id === course)?.name || "",
        start_year: startDate,
        end_year: endDate,
      }),
      ...(userType === 4 && {
        course:
          FresherYearOptions.find((item) => item.id === fresherCourse)?.name ||
          "",
        start_year: fresherStartDate,
        end_year: fresherEndtDate,
      }),

      ...(userType === 3 && {
        classes: Class,
      }),
      resume: resume,
      languages: languages.length > 0 ? languages : null,
      visa_status: visaStatus,
      preferred_job_type: preferredJobType.length > 0 ? preferredJobType : null,
      dob: dob ? dob.format("YYYY-MM-DD") : null,
      company_headcount: companyHeadcount,
    };

    try {
      console.log("Submitting payload:", payload);
      const response = await insertProfileData(payload);
      console.log("my profile", response);
      message.success("Profile inserted successfully!");
      setProgress(100);
      setCurrentStep(3);
    } catch (error) {
      console.log("my profile error", error);
      if (error?.response?.data?.message) {
        if (error?.response?.data?.required) {
          message.error(
            `Missing fields: ${error.response.data.required.join(", ")}`
          );
        } else {
          message.error(error.response.data.message);
        }
      } else {
        message.error("Fill all the required fields");
      }
    }
  };

  // verify email

  const verifyEmailData = async () => {
    const verifyEmailLoad = {
      email: email,
    };

    try {
      setOtpSending(true);
      setOtpError(null);
      setOtp("");
      const response = await verifyEmail(verifyEmailLoad);
      console.log("verify email", response);
      message.success(response?.data?.message);
      setProgress(50);
    } catch (error) {
      console.log("verify email error", error);
      message.error(error?.data?.message);
    } finally {
      setOtpSending(false);
      setOpen(true);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    try {
      const payload = {
        email: email,
        otp: otp,
      };
      setLoading(true);
      const res = await verifyOtp(payload);
      if (res?.data?.message) {
        message.success("OTP verified");
        setTimeout(() => {
          setOpen(false);
        }, 500);
        setProgress(75);
        setEmailVerified("Verified");
        // setCurrentStep(3);
      } else {
        message.error(res?.data?.message || "Invalid OTP");
      }
    } catch (err) {
      console.error(err);
      setEmailVerified("Not Verified");
      message.error("Error verifying OTP");
    } finally {
      setLoading(false);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setProgress(progress - 25);
    }
  };

  const stepItems = [
    {
      title: "Personal Info",
      description: "Add your personal details",
      icon: <UserOutlined />,
      content: (
        <div className="step-content">
          <Card className="premium-card">
            <div className="avatar-section">
              <Avatar
                onClick={handAvatarClick}
                size={80}
                src={profileImage || null}
                icon={!profileImage && <UserOutlined />}
                className="profile-avatar"
              />
              <label className="image_upload" htmlFor="upload-input">
                <input
                  id="upload-input"
                  type="file"
                  accept="image/*"
                  style={{ display: "block" }}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      handleImageChange(e);
                      setEditPhoto(file);
                      setEditPhotoError("");
                    } else {
                      setEditPhoto(null);
                      setEditPhotoError(e);
                    }
                  }}
                />
              </label>
              <div style={{ position: "relative" }}>
                <Button
                  type="primary"
                  shape="round"
                  icon={<EditOutlined />}
                  className="edit-btn"
                >
                  Edit Photo
                </Button>
                {editPhotoError && (
                  <div
                    className="error-message"
                    style={{
                      color: "red",
                      top: "35px",
                      textAlign: "center",
                      position: "absolute",
                    }}
                  >
                    {editPhotoError}
                  </div>
                )}
              </div>

              <Modal
                open={isModalVisible}
                footer={null}
                onCancel={() => setIsModalVisible(false)}
                centered
                style={{ textAlign: "center", padding: 0 }}
              >
                <img
                  src={profileImage}
                  alt="Profile Zoomed"
                  style={{ width: "100%", maxWidth: "400px", margin: "auto" }}
                />
              </Modal>
            </div>
            <div className="form-section">
              <div className="form-row">
                <div className="form-group">
                  <CommonInputField
                    name="firstName"
                    label="First Name"
                    mandatory={true}
                    placeholder="Enter your first name"
                    type="text"
                    value={fname}
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
                    name={"Last Name"}
                    label="Last Name"
                    mandatory={true}
                    value={lname}
                    placeholder={"Enter your last name"}
                    type={"text"}
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
              <div className="form-group">
                <CommonInputField
                  name={"Email"}
                  label="Email Address"
                  mandatory={true}
                  placeholder={"Enter your email"}
                  type={"email"}
                  value={email}
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
                  name={"Phone number"}
                  label="Phone Number"
                  mandatory={true}
                  placeholder={"Enter your phone number"}
                  type={"tel"}
                  value={number}
                  onChange={(e) => {
                    setNumber(e.target.value);
                    setNumberError(phoneValidation(e.target.value));
                  }}
                  readOnly={true}
                  disabled={true}
                  error={numberError}
                />
              </div>

              <div className="form-group">
                <Form.Item
                  layout="vertical"
                  label={<span style={{ fontWeight: 500 }}>Upload Resume <span style={{ color: "red" }}>*</span></span>}
                  validateStatus={resumeError ? "error" : ""}
                  help={resumeError}
                  required
                >
                  <div
                    style={{
                      border: "1px dashed #d9d9d9",
                      borderRadius: 12,
                      padding: 24,
                      textAlign: "center",
                      backgroundColor: "#fcfcff",
                      transition: "all 0.3s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#b388ff";
                      e.currentTarget.style.backgroundColor = "#fff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#d9d9d9";
                      e.currentTarget.style.backgroundColor = "#fcfcff";
                    }}
                  >
                    <Upload
                      name="resume"
                      showUploadList={false}
                      accept=".doc,.docx,.pdf"
                      maxCount={1}
                      beforeUpload={(file) => {
                        handleResumeChange({ target: { files: [file] } });
                        return false;
                      }}
                    >
                      <Button
                        style={{ background: "#5f2eea", borderRadius: "8px", boxShadow: "0 2px 4px rgba(95, 46, 234, 0.2)" }}
                        icon={<UploadOutlined />}
                        type="primary"
                      >
                        {resumeFile ? "Replace Resume" : "Click to Upload Resume"}
                      </Button>
                      <div style={{ marginTop: 12 }}>
                        <Text type="secondary" style={{ fontSize: "13px" }}>
                          Supported file formats: DOC, DOCX, PDF. Max size: 5MB.
                        </Text>
                      </div>
                    </Upload>
                    {resumeFile && (
                      <div style={{ marginTop: 16 }}>
                        <Text strong style={{ color: "#5f2eea" }}>Selected File: </Text>
                        <Text>{resumeFile.name}</Text>
                      </div>
                    )}
                  </div>
                </Form.Item>
              </div>

              <div style={{ marginTop: "20px" }} className="form-group">
                <Form.Item
                  layout="vertical"
                  label={<span style={{ fontWeight: 500 }}>Gender</span>}
                  required
                >
                  <div>
                    <div className="job_nature">
                      {genderOptions.map((item) => {
                        return (
                          <button
                            key={item.name}
                            type="button"
                            className={
                              activeButton === item.name
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
                  </div>
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
                      {userTypeData.map((item) => {
                        return (
                          <button
                            key={item.id}
                            type="button"
                            className={
                              userTypeactiveButton === item.id
                                ? "job_nature_button_active"
                                : "job_nature_button"
                            }
                            onClick={() => {
                              handleUserTypeClick(item.id);
                              setUserType(item.id);
                              // setUserTypeData(item.id);
                              setUserTypeError(selectValidator(item.name));
                            }}
                          >
                            {item.id === 1 ? (
                              <LuGraduationCap />
                            ) : item.id === 2 ? (
                              <GiOfficeChair />
                            ) : item.id === 3 ? (
                              <FaBuildingUser />
                            ) : item.id === 4 ? (
                              <GiNewShoot />
                            ) : (
                              ""
                            )}{" "}
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
                {userTypeactiveButton === 1 && (
                  <>
                    <div style={{ marginTop: 15 }} className="form-group">
                      <CommonSelectField
                        label="Course"
                        disabled={false}
                        name="course"
                        mandatory={true}
                        placeholder="Select Course"
                        showSearch={true}
                        value={course}
                        options={courseOptions}
                        onChange={(value) => {
                          setCourse(value);
                          setCourseError(selectValidator(value));
                        }}
                        error={courseError}
                      />
                    </div>

                    <div style={{ alignItems: "center" }} className="form-row">
                      <div className="form-group">
                        <CommonSelectField
                          value={startDate}
                          options={startYearOptions}
                          label="Start Year"
                          name="startyear"
                          placeholder="Start Year"
                          onChange={(value) => {
                            setStartDate(value);

                            if (!value || value.trim() === "") {
                              setStartDateError(" is required");
                            } else {
                              setStartDateError("");
                            }
                          }}
                          error={startDateError}
                        />
                      </div>

                      <div className="form-group">
                        <CommonSelectField
                          value={endDate}
                          options={endYearOptions}
                          label="End Year"
                          name="endyear"
                          placeholder="End Year"
                          onChange={(value) => {
                            setEndDate(value);

                            if (!value || value.trim() === "") {
                              setEndDateError(" is required");
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

                {userTypeactiveButton === 4 && (
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

                    <div style={{ alignItems: "center" }} className="form-row">
                      <div className="form-group">
                        <CommonSelectField
                          value={fresherStartDate}
                          options={FresherStartYearOptions}
                          label="Start Year"
                          name="startyear"
                          placeholder="Start Year"
                          onChange={(value) => {
                            setFresherStartDate(value);

                            if (!value || value.trim() === "") {
                              setFresherStartDateError(" is required");
                            } else {
                              setFresherStartDateError("");
                            }
                          }}
                          error={fresherStartDateError}
                        />
                      </div>

                      <div className="form-group">
                        <CommonSelectField
                          value={fresherEndtDate}
                          options={fresherEndYearOptions}
                          label="End Year"
                          name="endyear"
                          placeholder="End Year"
                          onChange={(value) => {
                            setFresherEndDate(value);

                            if (!value || value.trim() === "") {
                              setFresherEndDateError(" is required");
                            } else {
                              setFresherEndDateError("");
                            }
                          }}
                          error={fresherEndDateError}
                        />
                      </div>
                    </div>
                  </>
                )}

                {userTypeactiveButton === 3 && (
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

              <div style={{ marginTop: 15 }} className="form-row">
                <div className="form-group">
                  <CommonSelectField
                    label="Country"
                    name="country"
                    value={country}
                    mandatory={true}
                    placeholder="Select Country"
                    options={countryList.map((country) => ({
                      label: country.name,
                      value: country.isoCode,
                    }))}
                    showSearch={true}
                    onChange={(value) => {
                      handleCountryChange(value);
                      setCountry(value);
                      setCountryError(selectValidator(value));
                    }}
                    error={countryError}
                  />
                </div>
                <div className="form-group">
                  <CommonSelectField
                    label="State"
                    name="state"
                    value={state}
                    disabled={!countryId}
                    mandatory={true}
                    placeholder="Select State"
                    options={stateList.map((state) => ({
                      label: state.name,
                      value: state.name,
                    }))}
                    onChange={(value) => {
                      handleStateChange(value);
                      setState(value);
                      setStateError(selectValidator(value));
                    }}
                    showSearch={true}
                    error={stateError}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <CommonSelectField
                    label="City"
                    name="city"
                    value={city}
                    mandatory={true}
                    placeholder="Select City"
                    options={cityList}
                    onChange={(value) => {
                      handleCityChange(value);
                      setCity(value);
                      setCityError(selectValidator(value));
                    }}
                    showSearch={true}
                    error={cityError}
                  />
                </div>

                <div className="form-group">
                  <CommonInputField
                    name={"Pincode"}
                    label="Pincode"
                    value={pincode}
                    mandatory={true}
                    placeholder={"Enter your pincode"}
                    type={"number"}
                    onChange={(e) => {
                      setPincode(e.target.value);
                      setPincodeError(pincodeValidator(e.target.value));
                    }}
                    error={pincodeError}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <Form.Item label={<span style={{ fontWeight: 600 }}>Date of Birth</span>} style={{ marginBottom: 0 }}>
                    <DatePicker 
                      style={{ width: '100%', height: 42, borderRadius: 8 }}
                      value={dob}
                      onChange={(date) => setDob(date)}
                    />
                  </Form.Item>
                </div>
                <div className="form-group">
                  <Form.Item label={<span style={{ fontWeight: 600 }}>Visa Status</span>} style={{ marginBottom: 0 }}>
                    <Select
                      style={{ width: '100%', height: 42 }}
                      placeholder="Select Visa Status"
                      value={visaStatus}
                      onChange={setVisaStatus}
                      options={[
                        { label: 'Citizen / Permanent Resident', value: 'Citizen / Permanent Resident' },
                        { label: 'Work Permit / H1B', value: 'Work Permit / H1B' },
                        { label: 'Student Visa (OPT/CPT)', value: 'Student Visa (OPT/CPT)' },
                        { label: 'Requires Sponsorship', value: 'Requires Sponsorship' },
                        { label: 'Not Specified', value: 'Not Specified' }
                      ]}
                    />
                  </Form.Item>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <Form.Item label={<span style={{ fontWeight: 600 }}>Languages Spoken</span>} style={{ marginBottom: 0 }}>
                    <Select
                      mode="multiple"
                      style={{ width: '100%' }}
                      placeholder="Select Languages"
                      value={languages}
                      onChange={setLanguages}
                      options={[
                        'English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam',
                        'Marathi', 'Bengali', 'Gujarati', 'Punjabi', 'French', 'German',
                        'Spanish', 'Japanese'
                      ].map(l => ({ label: l, value: l }))}
                    />
                  </Form.Item>
                </div>
                <div className="form-group">
                  <Form.Item label={<span style={{ fontWeight: 600 }}>Preferred Job Type</span>} style={{ marginBottom: 0 }}>
                    <Select
                      mode="multiple"
                      style={{ width: '100%' }}
                      placeholder="Select Job Types"
                      value={preferredJobType}
                      onChange={setPreferredJobType}
                      options={[
                        'Permanent / Full Time', 'Contract / C2H', 'Freelance / Consultant',
                        'Internship', 'Work from Home / Remote', 'Part Time'
                      ].map(j => ({ label: j, value: j }))}
                    />
                  </Form.Item>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <Form.Item label={<span style={{ fontWeight: 600 }}>Preferred Company Size</span>} style={{ marginBottom: 0 }}>
                    <Select
                      style={{ width: '100%', height: 42 }}
                      placeholder="Select Company Headcount"
                      value={companyHeadcount}
                      onChange={setCompanyHeadcount}
                      options={[
                        '1-10 employees', '11-50 employees', '51-200 employees',
                        '201-500 employees', '501-1,000 employees', '1,001-5,000 employees',
                        '5,001-10,000 employees', '10,000+ employees'
                      ].map(h => ({ label: h, value: h }))}
                    />
                  </Form.Item>
                </div>
                <div className="form-group">
                  {/* Empty group for spacing */}
                </div>
              </div>

              <div className="form-group">
                <CommonTextArea
                  label={"Address"}
                  name={"address"}
                  value={address}
                  rows={4}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setAddressError(selectValidator(e.target.value));
                  }}
                  placeholder={"Enter Your Address"}
                  mandatory={true}
                  error={addressError}
                />
              </div>
            </div>
          </Card>
        </div>
      ),
    },
    {
      title: "Professional Info",
      description: "Add your professional details",
      icon: <SolutionOutlined />,
      content: (
        <div className="step-content">
          <Card className="premium-card">
            <div className="form-section">
              <div style={{ marginBottom: 20 }} className="form-group">
                <CommonSelectField
                  label="Fresher / Experience"
                  name="fresherexperience"
                  value={selectExperienceType}
                  mandatory={true}
                  placeholder="Select Experience"
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
                  }}
                  showSearch={true}
                  error={selectExperienceTypeError}
                />
              </div>
              {experienceType === "Experience" && (
                <div className="forexprience">
                  <div className="form-row">
                    <div className="form-group">
                      <CommonSelectField
                        label=" Total Years of Experience"
                        name="totalexperience"
                        value={totalYearsExperience}
                        mandatory={true}
                        placeholder="Select Experience"
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
                        value={totalMonthsExperience}
                        mandatory={true}
                        placeholder="Select Experience"
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
                  </div>
                  {companies.map((company, index) => (
                    <div className="add-company-section" key={index}>
                      <div style={{ display: "flex", justifyContent: "end" }}>
                        {index == 0 ? (
                          ""
                        ) : (
                          <MdDeleteForever
                            onClick={() => handleDeleteCompany(index)}
                            name={["companies", index, "job-delete"]}
                            className="job-delete"
                          />
                        )}
                      </div>

                      <div className="form-group">
                        <CommonInputField
                          name={"Job title"}
                          label="Job Title"
                          mandatory={true}
                          value={company.jobTitle}
                          placeholder={"Software Engineer"}
                          type={"text"}
                          onChange={(e) =>
                            handleCompanyFields(
                              index,
                              "jobTitle",
                              e.target.value
                            )
                          }
                          error={company.jobTitleError}
                        />
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <CommonInputField
                            label=" Company name"
                            mandatory={true}
                            placeholder={"Tech Corp Inc."}
                            value={company.companyName}
                            error={company.companyNameError}
                            onChange={(e) =>
                              handleCompanyFields(
                                index,
                                "companyName",
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div className="form-group">
                          <CommonInputField
                            label=" Designation"
                            mandatory={true}
                            placeholder={"Enter your designation"}
                            value={company.designation}
                            error={company.designationError}
                            onChange={(e) =>
                              handleCompanyFields(
                                index,
                                "designation",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="from-group">
                          <CommonSelectField
                            label="Start Date"
                            options={workingStartYearOptions}
                            value={company.workingStartDate}
                            error={company.workingStartDateError}
                            onChange={(value) =>
                              handleCompanyFields(
                                index,
                                "workingStartDate",
                                value
                              )
                            }
                          />
                        </div>
                        <div className="from-group">
                          <CommonSelectField
                            label="End Date"
                            options={workingEndYearOptions}
                            value={company.workingEndDate}
                            error={company.workingEndDateError}
                            onChange={(value) =>
                              handleCompanyFields(
                                index,
                                "workingEndDate",
                                value
                              )
                            }
                            disabled={
                              company.currentlyWorking === true ? true : false
                            }
                          />
                        </div>
                      </div>
                      <div
                        style={{ marginTop: 15 }}
                        className="professional-checkbox"
                      >
                        <Checkbox
                          checked={company.currentlyWorking}
                          onChange={(e) =>
                            handleCompanyFields(
                              index,
                              "currentlyWorking",
                              e.target.checked
                            )
                          }
                        >
                          Currently Working?
                        </Checkbox>
                      </div>

                      <div className="form-group">
                        <div style={{ marginTop: 8, marginBottom: 0 }}>
                          {(company.skills || []).map((skill) => (
                            <Tag
                              key={skill}
                              closable
                              onClose={() => handleRemoveSkill(index, skill)}
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
                          onPressEnter={() => handleCustomSkillAdd(index)}
                          value={company.customSkill || ""}
                          name={"customSkill"}
                          onChange={(e) =>
                            handleCompanyFields(index, "customSkill", e)
                          }
                          mandatory={true}
                          placeholder={
                            "List your skills here, showcasing what you excel at."
                          }
                          error={skillsError}
                        />
                      </div>
                    </div>
                  ))}

                  <div
                    style={{ display: "flex", justifyContent: "end", marginTop: "30px" }}
                    className=""
                  >
                    <Button onClick={handleAddCompany} className="add-btn">
                      Add More Company <IoMdAdd className="add-icon" />
                    </Button>
                  </div>
                </div>
              )}
              {experienceType === "Fresher" && (
                <div className="fresher-skills-section">
                  <div className="form-group">
                    <div style={{ marginTop: 8, marginBottom: 0 }}>
                      {selectedSkills.map((skill) => (
                        <Tag
                          key={skill}
                          closable
                          onClose={() =>
                            setSelectedSkills((prev) =>
                              prev.filter((s) => s !== skill)
                            )
                          }
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
                      value={fresherCustomSkill}
                      placeholder={"List your skills here, showcasing what you excel at."}
                      mandatory={true}
                      onChange={(e) => setFresherCustomSkill(e.target.value)}
                      onPressEnter={(e) => {
                        const trimmed = fresherCustomSkill.trim();
                        if (
                          trimmed &&
                          !selectedSkills.some(
                            (skill) => skill.toLowerCase() === trimmed.toLowerCase()
                          )
                        ) {
                          setSelectedSkills([...selectedSkills, trimmed]);
                        }
                        setFresherCustomSkill(""); // clear input after adding
                      }}
                      error={skillsError}
                    />

                  </div>
                </div>
              )}

            </div>
          </Card>
        </div>
      ),
    },
    {
      title: "Verification",
      description: "Verify your identity",
      icon: <CreditCardOutlined />,
      content: (
        <div className="step-content">
          <Card className="premium-card">
            <div className="verification-section">
              <div
                className="verification-item"
                style={{ display: "flex", alignItems: "center", gap: 12 }}
              >
                {emailVerified === "Verified" ? (
                  <CheckCircleOutlined
                    style={{ color: "green", fontSize: 20 }}
                  />
                ) : (
                  <CloseCircleOutlined
                    style={{
                      color: emailVerified ? "red" : "gray",
                      fontSize: 20,
                    }}
                  />
                )}
                <Text strong>Email Verification</Text>
                <Text
                  type={
                    emailVerified === "Verified"
                      ? "success"
                      : emailVerified
                        ? "danger"
                        : "secondary"
                  }
                  style={{ marginLeft: "auto" }}
                >
                  {emailVerified || "Not Verified"}
                </Text>
                {emailVerified === "Verified" ? (
                  <Button
                    type="primary"
                    size="large"
                    onClick={doneProfile}
                    className="nav-btn next-btn"
                    loading={otpSending}
                  >
                    Update Profile
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    size="large"
                    onClick={verifyEmailData}
                    className="nav-btn next-btn"
                    loading={otpSending}
                  >
                    Verify Email
                  </Button>
                )}
              </div>
              <Divider />
              {/* <div
                className="verification-item"
                style={{ display: "flex", alignItems: "center", gap: 12 }}
              >
                {numberVerified === "Verified" ? (
                  <CheckCircleOutlined
                    style={{ color: "green", fontSize: 20 }}
                  />
                ) : (
                  <CloseCircleOutlined
                    style={{
                      color:
                        numberVerified &&
                        numberVerified !== "Pending Verification"
                          ? "red"
                          : "gray",
                      fontSize: 20,
                    }}
                  />
                )}
                <Text strong>Phone Verification</Text>
                <Text
                  type={
                    numberVerified === "Verified"
                      ? "success"
                      : numberVerified === "Pending Verification"
                      ? "warning"
                      : numberVerified
                      ? "danger"
                      : "secondary"
                  }
                  style={{ marginLeft: "auto" }}
                >
                  {numberVerified || "Not Checked"}
                </Text>
              </div> */}
            </div>
          </Card>
        </div>
      ),
    },
    {
      title: "Completion",
      description: "Profile setup complete",
      icon: <CheckCircleOutlined />,
      content: (
        <div className="step-content">
          <Card className="premium-card completion-card">
            <div className="completion-content">
              <CheckCircleOutlined className="success-icon" />
              <Title level={3}>Profile Setup Complete!</Title>
              <Text type="secondary">
                Your profile has been successfully set up. You can now access
                all features.
              </Text>
              <Button
                onClick={() => {
                  navigate("/candidate-profile/mainprofile");
                }}
                type="primary"
                size="large"
                className="dashboard-btn"
              >
                Go to Dashboard <ArrowRightOutlined />
              </Button>
            </div>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div className="profile-details-container">
      <div className="profile-header">
        <Title onClick={doneProfile} level={2}>Complete Your Profile</Title>
        <Text type="secondary">
          Follow these steps to set up your professional profile
        </Text>
      </div>

      <div className="progress-container">
        <Progress
          percent={progress}
          strokeColor={progress === 100 ? "#52c41a" : "#8d3ffb"}
          showInfo={false}
        />
        <Text strong>{progress}% Complete</Text>
      </div>
      <Form
        form={form}
        layout="vertical"
        name="multi-step-form"
        className="multi-step-form"
      >
        <Steps
          current={currentStep}
          items={stepItems.map((item) => ({
            title: item.title,
            description: item.description,
            icon: item.icon,
          }))}
          className="premium-steps"
        />

        <Divider className="section-divider" />

        <div className="step-content-container">
          {stepItems[currentStep].content}
        </div>

        <div className="navigation-buttons">
          {(currentStep === 1 || currentStep === 2) && (
            <Button
              size="large"
              onClick={prevStep}
              className="nav-btn prev-btn"
            >
              Back
            </Button>
          )}

          {currentStep === 2 ? (
            ""
          ) : currentStep < stepItems.length - 1 ? (
            <Button
              type="primary"
              size="large"
              onClick={nextStep}
              className="nav-btn next-btn"
            >
              Next Step
            </Button>
          ) : null}
        </div>
        <Modal
          title="Forgot Password"
          open={open}
          onCancel={handleModalClose}
          footer={null}
        >
          <>
            <Typography.Title level={5}>Enter OTP</Typography.Title>
            <Input.OTP value={otp} onChange={(val) => setOtp(val)} />
            <br></br>
            <div style={{ textAlign: "start" }}>
              <Button
                style={{ marginTop: 20 }}
                className="sendOtp"
                type="primary"
                loading={loading}
                onClick={handleVerifyOtp}
              >
                Verify OTP
              </Button>
            </div>
          </>
        </Modal>
      </Form>
    </div>
  );
};

export default ProfileDetails;


