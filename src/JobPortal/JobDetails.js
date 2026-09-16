'use client';
import React, { useState, useEffect } from "react";
import { useParams } from "@/routing-shim";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { getImageUrl } from "../utils/getImageUrl";
import {
  Row,
  Col,
  Collapse,
  Input,
  Drawer,
  message,
  Tooltip,
  Button,
  Skeleton
} from "antd";
import {
  FaMapMarkerAlt,
  FaHeart,
  FaCheckCircle,
  FaRegHeart,
} from "react-icons/fa";
import {
  MinusCircleFilled,
  PlusCircleFilled,
} from "@ant-design/icons";
import { IoIosShareAlt } from "react-icons/io";
import { MdOutlineWorkOutline, MdOutlineAccessTime, MdOutlineLocationOn, MdOutlinePhone } from "react-icons/md";
import { CommonToaster } from "../Common/CommonToaster";
import {
  applyForJob,
  checkIsJobApplied,
  checkIsJobSaved,
  getJobPosts,
  saveJobPost,
  getSavedJobs,
  removeSavedJobs,
  getAllCourses
} from "../ApiService/action";
import Header from "../Header/Header";
import SEO from "../Components/SEO/SEO";
import "../css/JobFilter.css";
import "../css/ProfileDetailsPage.css";
import "../css/naukri-job-details.css";
import logo from "../images/careerfastlogofinal.png";

const generateSlug = (text = "") =>
  String(text).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const getCurrencySymbol = (currencyCode) => {
  const currencyMap = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'AUD': 'A$',
    'CAD': 'C$',
  };
  return currencyMap[currencyCode] || currencyCode;
};

// Helper function to clean and process job description HTML
const processDescription = (html) => {
  if (!html) return "";
  return html
    .replace(/\u00AD/g, '')
    .replace(/\u200B/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
};

const transformJob = (job) => {
  if (!job) return null;
  const postedDate = new Date(job.created_at);
  const today = new Date();
  const timeDiff = today - postedDate;
  const daysPassed = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

  const totalActiveDays = 355;
  const daysLeft = totalActiveDays - daysPassed;
  const isClosedVal = job.is_closed && typeof job.is_closed === 'object' && job.is_closed.data ? job.is_closed.data[0] : job.is_closed;
  const isExpired = daysLeft < 0 || isClosedVal == 1;

  return {
    id: job.id,
    title: job.job_title,
    company: job.company_name,
    logo: job.company_logo,
    company_description: processDescription(job.company_description || job.about_us),
    created_date: job.created_at,
    job_description: processDescription(job.job_description),
    seo_description: job.seo_description,
    benefits: job.benefits,
    openings: job.openings,
    applicantsCount: job.applicants_count || 0,
    job_category: job.job_category,
    postedDate,
    working_days: job.working_days,
    daysLeft: isExpired ? "Expired" : `${daysLeft} days left`,
    level: job.experience_type,
    salary: (() => {
      if (String(job.hide_salary) === "true" || job.hide_salary === true || job.hide_salary === 1) return "Not Disclosed";
      if (!["Fixed", "Range", "Total CTC", "Fixed + Variable"].includes(job.salary_type)) return "Negotiable";

      const minNum = Number(job.min_salary);
      const maxNum = Number(job.max_salary);

      const isMinValid = !isNaN(minNum) && minNum > 0;
      const isMaxValid = !isNaN(maxNum) && maxNum > 0;

      if (!isMinValid && !isMaxValid) return "Not Disclosed";

      const sym = getCurrencySymbol(job.currency);
      const isMonthly = job.salary_duration?.toLowerCase() === "monthly";

      const formatVal = (val) => {
        if (!val) return "N/A";
        if (isMonthly || job.currency !== "INR") return Number(val).toLocaleString('en-IN');
        if (val >= 100000) {
          const lacs = val / 100000;
          return Number.isInteger(lacs) ? lacs.toString() : lacs.toFixed(2).replace(/\.00$/, '');
        }
        return Number(val).toLocaleString('en-IN');
      };

      const getSuffix = (val) => {
        if (isMonthly) return "Per Month";
        if (job.currency === "INR" && val >= 100000) return "LPA";
        return "LPA";
      };

      if (job.salary_type === "Fixed") {
        if (!isMinValid) return "Not Disclosed";
        return `${sym}${formatVal(minNum)} ${getSuffix(minNum)}`;
      } else {
        if (!isMinValid && !isMaxValid) return "Not Disclosed";
        if (isMinValid && !isMaxValid) return `${sym}${formatVal(minNum)} ${getSuffix(minNum)}`;
        if (!isMinValid && isMaxValid) return `Upto ${sym}${formatVal(maxNum)} ${getSuffix(maxNum)}`;

        const suffix = getSuffix(maxNum);
        return `${sym}${formatVal(minNum)} - ${formatVal(maxNum)} ${suffix}`;
      }
    })(),
    location: (() => {
      let cleanLoc = "";
      try {
        if (Array.isArray(job.work_location)) {
          cleanLoc = job.work_location.join(", ").trim();
        } else if (typeof job.work_location === 'string') {
          try {
            const parsed = JSON.parse(job.work_location);
            cleanLoc = Array.isArray(parsed) ? parsed.join(", ").trim() : String(parsed).trim();
          } catch {
            cleanLoc = job.work_location.trim();
          }
        }
      } catch (err) {
        cleanLoc = String(job.work_location || "").trim();
      }

      const wpType = typeof job.workplace_type === 'string' ? job.workplace_type.trim() : "";

      if (wpType && cleanLoc && cleanLoc !== "Pan India") return `${wpType} • ${cleanLoc}`;
      if (wpType && (cleanLoc === "Pan India" || cleanLoc === "")) return `${wpType} • Pan India`;
      if (wpType) return wpType;
      if (cleanLoc) return cleanLoc;
      return "Location not specified";
    })(),
    diversity_hiring: job.diversity_hiring,
    type: job.job_nature,
    premium: true,
    urgent: false,
    skills: job.skills,
    eligibility: Array.isArray(job.experience_required) ? job.experience_required.join(", ") : (job.experience_required || ""),
    status: isExpired ? "Expired" : "Live",
    raw_location: job.work_location,
    raw_workplace_type: job.workplace_type,
    raw_experience_required: job.experience_required,
    questions: job.questions?.map((q) => q.question) || [],
    questions_with_ids:
      job.questions?.map((q) => ({
        id: q.id,
        question: q.question,
        isrequired: q.isrequired,
      })) || [],
    role: job.role,
    industry: job.industry,
    employment_type: job.employment_type,
    willing_to_relocate: job.willing_to_relocate,
    hybrid_policy: job.hybrid_policy,
    hide_salary: job.hide_salary,
    variable_amount: job.variable_amount,
    bonus_amount: job.bonus_amount,
    duration_period: job.duration_period,
    salary_type: job.salary_type,
    educational_qualification: job.educational_qualification,
    candidate_industry: job.candidate_industry,
    languages: job.languages,
    is_walk_in: job.is_walk_in,
    walk_in_start_date: job.walk_in_start_date,
    walk_in_end_date: job.walk_in_end_date,
    walk_in_start_time: job.walk_in_start_time,
    walk_in_end_time: job.walk_in_end_time,
    recruiter_name: job.recruiter_name,
    mobile_number: job.mobile_number,
    venue_address: job.venue_address,
    google_maps_url: job.google_maps_url,
    team_members: typeof job.team_members === 'string' ? JSON.parse(job.team_members) : job.team_members,
    apply_link: job.apply_link,
  };
};

export default function JobDetails({ initialData, serverSlug }) {
  const [postDetails, setPostDetails] = useState(initialData ? [transformJob(initialData)] : []);
  const [backendJobs, setBackendJobs] = useState(initialData ? [initialData] : []);
  const [appliedDates, setAppliedDates] = useState({});
  const [openApplyNow, setOpenApplyNow] = useState(false);
  const [answers, setAnswers] = useState("");
  const [loginUserId, setLoginUserId] = useState(null);
  const [isApplied, setIsApplied] = useState({});
  const [isSaved, setIsSaved] = useState({});
  const [wishlistedJobs, setWishlistedJobs] = useState({});
  const [savedJobMap, setSavedJobMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [sidebarLoading, setSidebarLoading] = useState(true);
  const [relatedJobs, setRelatedJobs] = useState([]);
  const [courses, setCourses] = useState([]);

  const { slug: clientSlug } = useParams();
  const searchParams = useSearchParams();
  const isPreview = searchParams?.get('preview') === 'true';
  const slug = serverSlug || clientSlug;
  const jobId = slug?.split("-").pop();

  useEffect(() => {
    if (initialData) {
      const transformed = transformJob(initialData);
      setPostDetails([transformed]);
      setBackendJobs([initialData]);
      // Artificial delay to ensure the premium loader is seen and transition is smooth
      const timer = setTimeout(() => {
        setLoading(false);
      }, 800);
      return () => clearTimeout(timer);
    } else if (jobId !== undefined && jobId !== null && jobId !== '') {
      fetchJobs(jobId);
    }
  }, [jobId, initialData]);

  // Separate effect to handle application status once user ID is loaded
  useEffect(() => {
    if (jobId && loginUserId) {
      checkIsJobAppliedData(jobId);
    }
  }, [jobId, loginUserId]);

  useEffect(() => {
    try {
      const storedAppliedDates = localStorage.getItem("appliedDates");
      if (storedAppliedDates) {
        setAppliedDates(JSON.parse(storedAppliedDates));
      }
    } catch (error) {
      console.error("Error loading applied dates from localStorage", error);
    }
  }, []);

  useEffect(() => {
    async function fetchSidebarData() {
      setSidebarLoading(true);
      try {
        const [jobsRes, coursesRes] = await Promise.all([
          getJobPosts({}),
          getAllCourses()
        ]);

        if (jobsRes?.data?.data?.data) {
          const allJobs = jobsRes.data.data.data;
          // exclude current job if jobId exists
          const filteredJobs = allJobs.filter(j => j.id.toString() !== String(jobId));
          // shuffle or just take first 4
          setRelatedJobs(filteredJobs.slice(0, 4).map(transformJob));
        }

        if (coursesRes) {
          setCourses(coursesRes.slice(0, 3));
        }
      } catch (error) {
        console.error("Error fetching sidebar data:", error);
      } finally {
        setSidebarLoading(false);
      }
    }
    fetchSidebarData();
  }, [jobId]);

  useEffect(() => {
    localStorage.setItem("appliedDates", JSON.stringify(appliedDates));
  }, [appliedDates]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("loginDetails");
      const token = localStorage.getItem("AccessToken");
      if (stored && token) {
        const loginDetails = JSON.parse(stored);
        setLoginUserId(loginDetails.id);
      } else {
        setLoginUserId(null);
      }
    } catch (error) {
      console.error("Invalid JSON in localStorage", error);
    }
  }, []);

  const fetchJobs = async (postId) => {
    setLoading(true);
    setPostDetails([]);
    const payload = (postId !== undefined && postId !== null && postId !== '') ? { id: postId } : {};
    if (isPreview) payload.preview = true;

    try {
      const response = await getJobPosts(payload);
      const jobs = response?.data?.data?.data;

      if (Array.isArray(jobs)) {
        setBackendJobs(jobs);
        if (postId !== undefined && postId !== null && postId !== '') {
          const selectedJob = jobs.find(job => job.id.toString() === postId);
          if (selectedJob) {
            try {
              const transformed = transformJob(selectedJob);
              setPostDetails([transformed]);
            } catch (err) {
              console.error("Error transforming job details:", err);
              message.error("Failed to process job details");
            }
          }
        }
      }
    } catch (error) {
      console.error("getJobPosts error:", error);
      message.error("Failed to fetch job details");
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 300);
    }
  };

  const checkIsJobAppliedData = async (postId) => {
    if (!loginUserId || !postId) return;
    const payload = { user_id: loginUserId, job_post_id: postId };
    try {
      const response = await checkIsJobApplied(payload);
      setIsApplied((prev) => ({ ...prev, [postId]: response?.data?.data || false }));
    } catch (error) {
      setIsApplied((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const applyForJobData = async () => {
    const token = localStorage.getItem("AccessToken");
    if (!token) {
      CommonToaster("Please login before applying.", "error");
      return;
    }
    const jobId = postDetails[0]?.id;
    const questionsWithIds = postDetails[0]?.questions_with_ids || [];
    const missingRequired = questionsWithIds.some((q, index) => q.isrequired && !answers[index]?.trim());
    if (missingRequired) {
      CommonToaster("Please answer all required questions before applying.", "warning");
      return;
    }
    const structuredAnswers = questionsWithIds.map((q, index) => ({ questionId: q.id, answer: answers[index] || "" }));
    const payload = { postId: jobId, userId: loginUserId, answers: structuredAnswers };
    try {
      const response = await applyForJob(payload, token);
      CommonToaster("Application submitted successfully! 🚀", "success");
      setIsApplied((prev) => ({ ...prev, [jobId]: true }));
      const appliedDate = response.data.appliedJob.created_at;
      setAppliedDates((prev) => ({ ...prev, [jobId]: appliedDate }));
      setOpenApplyNow(false);
    } catch (error) {
      CommonToaster("Error while applying. Please try again.", "error");
    }
  };

  const showDrawer = () => {
    if (postDetails[0]?.apply_link) {
      window.open(postDetails[0].apply_link, '_blank');
      return;
    }
    if (postDetails[0]?.questions?.length > 0) {
      setOpenApplyNow(true);
      CommonToaster("Please complete the screening questions", "info");
    } else {
      applyForJobData();
    }
  };

  const onClose = () => {
    setOpenApplyNow(false);
    setAnswers("");
  };

  const checkIsJobSavedData = async (postId) => {
    if (!loginUserId || !postId) return;
    const payload = { user_id: loginUserId, job_post_id: postId };
    try {
      const response = await checkIsJobSaved(payload);
      setIsSaved((prev) => ({ ...prev, [postId]: response?.data?.data || false }));
    } catch (error) {
      setIsSaved((prev) => ({ ...prev, [postId]: false }));
    }
  };

  useEffect(() => {
    if (postDetails.length > 0) {
      const jobId = postDetails[0]?.id;
      if (jobId) checkIsJobSavedData(jobId);
    }
  }, [postDetails]);

  const handleWishlistToggle = async (jobId) => {
    if (!loginUserId) {
      CommonToaster("Please login to add wishlist", "error");
      return;
    }
    try {
      const isWishlisted = !wishlistedJobs[jobId];
      setWishlistedJobs((prev) => {
        const updated = { ...prev, [jobId]: isWishlisted };
        localStorage.setItem("wishlist", JSON.stringify(updated));
        return updated;
      });
      if (isWishlisted) {
        await saveJobPostData(jobId);
        CommonToaster("Added to wishlist ❤️", "success");
      } else {
        await removeSavedJobsData(jobId);
        CommonToaster("Removed from wishlist 💔", "error");
      }
      setIsSaved((prev) => ({ ...prev, [jobId]: !prev[jobId] }));
      await getSavedJobsData();
    } catch (error) {
      setWishlistedJobs((prev) => {
        const updated = { ...prev, [jobId]: !prev[jobId] };
        localStorage.setItem("wishlist", JSON.stringify(updated));
        return updated;
      });
      const errorMsg = error?.response?.status === 401 ? "Please login to add wishlist" : "Failed to update wishlist";
      CommonToaster(errorMsg, "error");
    }
  };

  const saveJobPostData = async (jobId) => {
    if (!loginUserId || !jobId) return;
    const payload = { user_id: loginUserId, job_post_id: jobId };
    try {
      return await saveJobPost(payload);
    } catch (error) {
      throw error;
    }
  };

  const getSavedJobsData = async () => {
    try {
      const response = await getSavedJobs({ user_id: loginUserId });
      const savedJobs = response?.data?.data || [];
      const jobMap = {};
      savedJobs.forEach((job) => { jobMap[job.job_post_id] = job.id; });
      setSavedJobMap(jobMap);
    } catch (error) {
      console.log("Get saved job error", error);
    }
  };

  const removeSavedJobsData = async (jobId) => {
    try {
      const savedJobId = savedJobMap[jobId];
      if (!savedJobId) throw new Error("Saved job ID not found");
      return await removeSavedJobs({ id: savedJobId });
    } catch (error) {
      throw error;
    }
  };

  const handleShare = (job) => {
    const safeSlug = (val) => {
      if (!val) return "";
      if (Array.isArray(val)) return generateSlug(val.join(" "));
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return generateSlug(parsed.join(" "));
        return generateSlug(parsed);
      } catch { return generateSlug(val); }
    };
    const jobNature = generateSlug(job.type || "");
    const jobTitle = generateSlug(job.title || "");
    const companyName = generateSlug(job.company || "");
    const locationSlug = safeSlug(job.raw_location);
    const workplaceType = generateSlug(job.raw_workplace_type || "");
    const experienceType = generateSlug(job.level || "");
    const experienceRequired = safeSlug(job.raw_experience_required);
    let basePath = "/job-details";
    if (job.type === "Internship") basePath = "/internship-details";
    if (job.type === "Scholarship") basePath = "/scholarship-details";
    const jobLink = `${window.location.origin}${basePath}/${jobNature}-${jobTitle}-${companyName}-${locationSlug}-${workplaceType}-${experienceType}-${experienceRequired}-${job.id}`;
    if (navigator.share) {
      navigator.share({ title: job.title, text: `Check out this job at ${job.company}!`, url: jobLink }).catch((err) => console.error("Share failed:", err));
    } else {
      navigator.clipboard.writeText(jobLink).then(() => { alert("Job link copied to clipboard!"); });
    }
  };

  const items = [
    { key: "1", label: "How do I apply for this job?", children: (<p>To apply, click on the <b>Apply Now</b> button on this page. If the employer has added screening questions, you will be asked to answer them before submitting your application. Once submitted, your profile will be shared directly with the recruiter.</p>) },
    { key: "2", label: "Do I need to be logged in to apply?", children: (<p>Yes. You must be logged in to apply for any job. Logging in allows recruiters to view your profile, track your application status, and contact you if you are shortlisted.</p>) },
    { key: "3", label: "Can I apply for the same job more than once?", children: (<p>No. Each candidate can apply only once for a job. If you have already applied, the <b>Apply Now</b> button will be disabled and marked as <b>Applied</b>.</p>) },
    { key: "4", label: "How can I check if my application was submitted successfully?", children: (<p>Once your application is submitted, you will see an <b>Applied</b> badge on the job page. You can also track all your applications from the <b> My Applications</b> section in your dashboard.</p>) },
    { key: "5", label: "What does ‘Saved Job’ or ‘Wishlist’ mean?", children: (<p>Saving a job allows you to bookmark it for later review. Saved jobs can be accessed anytime from your <b>Saved Jobs</b> section without having to search again.</p>) },
    { key: "6", label: "Who can see my application details?", children: (<p>Only the employer who posted the job can view your application details, including your profile information and answers to screening questions. Your data is kept secure and confidential.</p>) },
    { key: "7", label: "What happens after I apply?", children: (<p>After applying, your profile is reviewed by the recruiter. If shortlisted, they may contact you via email or phone for further steps such as interviews or assessments.</p>) },
    { key: "8", label: "Can I edit my answers after applying?", children: (<p>No. Once an application is submitted, answers cannot be edited. Please review all your responses carefully before submitting.</p>) },
    { key: "9", label: "What does ‘Expired’ job status mean?", children: (<p>An <b>Expired</b> status means the application deadline has passed and the job is no longer accepting applications. You can still view the job details but cannot apply.</p>) },
    { key: "10", label: "Is applying for jobs on CareerFast free?", children: (<p>Yes. Applying for jobs on CareerFast is completely free for candidates. There are no hidden charges for job applications.</p>) },
  ];

  if (loading) {
    return (
      <>
        <Header />
        <main className="njd-page-wrapper">
          <div className="njd-container">
            <Row gutter={24}>
              <Col lg={17} md={24}>
                <div className="njd-header-card" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, paddingRight: '20px' }}>
                      <Skeleton.Input active size="large" style={{ width: '60%', height: '32px', marginBottom: '16px' }} />
                      <br />
                      <Skeleton.Input active size="small" style={{ width: '40%', marginBottom: '24px' }} />
                      <div className="njd-header-stats" style={{ display: 'flex', gap: '20px', borderBottom: '1px solid var(--njd-border)', paddingBottom: '20px' }}>
                        <Skeleton.Input active size="small" style={{ width: '100px' }} />
                        <Skeleton.Input active size="small" style={{ width: '120px' }} />
                        <Skeleton.Input active size="small" style={{ width: '150px' }} />
                      </div>
                      <div className="njd-header-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
                        <Skeleton.Input active size="small" style={{ width: '250px' }} />
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <Skeleton.Button active shape="round" style={{ width: '120px', height: '40px' }} />
                          <Skeleton.Button active shape="round" style={{ width: '100px', height: '40px' }} />
                        </div>
                      </div>
                    </div>
                    <Skeleton.Avatar active shape="square" size={80} style={{ borderRadius: '8px' }} />
                  </div>
                </div>

                <div className="njd-main-card">
                  <Skeleton title active paragraph={{ rows: 8, width: ['100%', '100%', '100%', '90%', '85%', '95%', '80%', '60%'] }} />
                  <br />
                  <br />
                  <Skeleton title active paragraph={{ rows: 4, width: ['40%', '50%', '40%', '60%'] }} />
                </div>
              </Col>

              <Col lg={7} md={24}>
                <div className="njd-sidebar-sticky">
                  <div className="njd-sidebar-card">
                    <Skeleton title active paragraph={{ rows: 4 }} />
                  </div>
                  <div className="njd-sidebar-card" style={{ marginTop: '16px' }}>
                    <Skeleton title active paragraph={{ rows: 4 }} />
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </main>
      </>
    );
  }


  const job = postDetails[0];

  return (
    <>
      {!initialData && job && (
        <SEO
          title={`${job.title} - ${job.location} - ${job.company} - ${job.eligibility}`}
          description={`${job.seo_description || (job.job_description ? job.job_description.replace(/<[^>]*>?/gm, ' ').substring(0, 160).trim() : `Job opportunities for ${job.title} at ${job.company}`)} - ${job.location} - ${job.eligibility}`}
          ogType="article"
          ogImage={job.logo}
          breadcrumbSchema={[
            { name: "Home", item: "/" },
            { name: job.type === "Internship" ? "Internships" : "Jobs", item: job.type === "Internship" ? "/internship-filter" : "/jobs" },
            { name: job.title, item: typeof window !== 'undefined' ? window.location.pathname : "" }
          ]}
          structuredData={[
            {
              "@context": "https://schema.org/",
              "@type": "JobPosting",
              "title": job.title,
              "description": job.job_description,
              "identifier": { "@type": "PropertyValue", "name": job.company, "value": job.id },
              "datePosted": job.created_date,
              "validThrough": new Date(new Date(job.created_date).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              "employmentType": job.type === "Full Time" ? "FULL_TIME" : "PART_TIME",
              "hiringOrganization": { "@type": "Organization", "name": job.company, "sameAs": "https://careerfast.in", "logo": job.logo },
              "jobLocation": { "@type": "Place", "address": { "@type": "PostalAddress", "addressLocality": job.location, "addressCountry": "IN" } },
              "baseSalary": { "@type": "MonetaryAmount", "currency": "INR", "value": { "@type": "QuantitativeValue", "value": job.salary, "unitText": job.salary_duration?.toLowerCase() === "monthly" ? "MONTH" : "YEAR" } }
            }
          ]}
        />
      )}

      <Header />

      <main className="njd-page-wrapper">
        <div className="njd-container">
          <Row gutter={24}>
            {/* Left Column */}
            <Col lg={17} md={24}>
              {job && (
                <>
                  <div className="njd-header-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <h1 className="njd-job-title">{job.title}</h1>
                        <a href="#" className="njd-company-link">{job.company}</a>

                        <div className="njd-header-stats" style={job.is_walk_in ? { borderBottom: 'none', paddingBottom: '10px' } : {}}>
                          <div className="njd-stat-item">
                            <MdOutlineWorkOutline className="njd-stat-icon" />
                            <span>{job.eligibility || "0-2 years"}</span>
                          </div>
                          <div className="njd-stat-sep"></div>
                          <div className="njd-stat-item">
                            <span>{job.salary || "Not Disclosed"}</span>
                          </div>
                          <div className="njd-stat-sep"></div>
                          <div className="njd-stat-item">
                            <MdOutlineLocationOn className="njd-stat-icon" />
                            <span>{job.location}</span>
                          </div>
                        </div>
                      </div>
                      {job.logo && (
                        <div className="njd-header-logo-wrapper">
                          <img src={getImageUrl(job.logo)} alt={job.company} className="njd-header-logo" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
                        </div>
                      )}
                    </div>

                    {Boolean(job.is_walk_in) && (
                      <div className="njd-header-walk-in">
                        <h3 className="njd-walk-in-title">Time and Venue</h3>

                        {(job.walk_in_start_date || job.walk_in_start_time) && (
                          <div className="njd-walk-in-row">
                            <MdOutlineAccessTime className="njd-walk-in-row-icon" />
                            <span>
                              {job.walk_in_start_date && new Date(job.walk_in_start_date).toLocaleDateString("en-GB", { day: 'numeric', month: 'long' })}
                              {job.walk_in_end_date && ` - ${new Date(job.walk_in_end_date).toLocaleDateString("en-GB", { day: 'numeric', month: 'long' })}`}
                              {job.walk_in_start_date && job.walk_in_start_time && ` , `}
                              {job.walk_in_start_time && `${job.walk_in_start_time}`}
                              {job.walk_in_end_time && ` - ${job.walk_in_end_time}`}
                            </span>
                          </div>
                        )}

                        {job.venue_address && (
                          <div className="njd-walk-in-row">
                            <MdOutlineLocationOn className="njd-walk-in-row-icon" />
                            <span>{job.venue_address}</span>
                          </div>
                        )}

                        {(job.recruiter_name || job.mobile_number) && (
                          <div className="njd-walk-in-row">
                            <MdOutlinePhone className="njd-walk-in-row-icon" />
                            <span>Contact - {job.recruiter_name || "HR"} {job.mobile_number && `( ${job.mobile_number} )`}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="njd-header-footer" style={job.is_walk_in ? { borderTop: '1px solid var(--njd-border)', paddingTop: '20px', marginTop: '15px' } : {}}>
                      <div className="njd-post-details">
                        <span>Posted: <strong>{job.daysLeft === "Expired" ? "Expired" : job.created_date ? formatDistanceToNow(new Date(job.created_date), { addSuffix: true }) : "Few days ago"}</strong></span>
                        <span>Openings: <strong>{job.openings || 1}</strong></span>
                        <span>Applicants: <strong>{job.applicantsCount}</strong></span>
                      </div>
                      <div className="njd-action-btns">
                        <Tooltip title={job.status === "Expired" ? "This job has expired and is no longer accepting applications." : isApplied[job.id] ? `Applied on ${new Date(appliedDates[job.id]).toLocaleDateString("en-GB")}` : "Apply for this job"}>
                          <button className="njd-apply-btn" onClick={showDrawer} disabled={job.status === "Expired" || isApplied[job.id]} style={job.status === "Expired" ? { cursor: 'not-allowed', opacity: 0.6, background: '#a0a0a0', borderColor: '#a0a0a0' } : {}}>
                            {job.status === "Expired" ? (
                              <span>Expired</span>
                            ) : isApplied[job.id] ? (
                              <span>Applied</span>
                            ) : job.apply_link ? "Apply on Employer Site" : "Apply"}
                          </button>
                        </Tooltip>
                        <Tooltip title={isSaved[job.id] ? "Unsave this job" : "Save this job"}>
                          <button className="njd-save-btn" onClick={() => handleWishlistToggle(job.id)}>
                            {isSaved[job.id] ? <FaHeart style={{ color: '#ff4d4f' }} /> : <FaRegHeart />}
                            {isSaved[job.id] ? "Saved" : "Save"}
                          </button>
                        </Tooltip>
                        <Tooltip title="Share this job">
                          <button className="njd-save-btn" onClick={() => handleShare(job)}>
                            <IoIosShareAlt />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  </div>

                  <div className="njd-main-card">
                    <h2 className="njd-section-title">Job description:</h2>
                    <div className="njd-jd-text" dangerouslySetInnerHTML={{ __html: job.job_description }} />
                    <h3 className="njd-section-title" style={{ marginTop: '30px' }}>Job Details</h3>
                    <div className="njd-role-details">
                      {job.role && <div className="njd-role-item"><span className="njd-role-label">Role:</span><span className="njd-role-value">{job.role}</span></div>}
                      {job.industry && <div className="njd-role-item"><span className="njd-role-label">Industry Type:</span><span className="njd-role-value">{job.industry}</span></div>}
                      {job.job_category && <div className="njd-role-item"><span className="njd-role-label">Department:</span>
                        <div className="njd-skills-container" style={{ marginTop: '4px', gap: '6px' }}>
                          {(Array.isArray(job.job_category) ? job.job_category : [job.job_category]).map((item, index) => (
                            <span key={index} className="njd-skill-tag" style={{ padding: '4px 12px', fontSize: '12px' }}>{String(item).trim()}</span>
                          ))}
                        </div>
                      </div>}
                      {job.employment_type && <div className="njd-role-item"><span className="njd-role-label">Employment Type:</span><span className="njd-role-value">{job.employment_type}</span></div>}
                      {job.type && <div className="njd-role-item"><span className="njd-role-label">Job Nature:</span><span className="njd-role-value">{job.type}</span></div>}
                      {Boolean(job.duration_period) && job.duration_period !== "Permanent" && job.duration_period !== "0" && <div className="njd-role-item"><span className="njd-role-label">Duration:</span><span className="njd-role-value">{job.duration_period}</span></div>}
                      {Boolean(job.working_days) && job.working_days !== "0" && <div className="njd-role-item"><span className="njd-role-label">Working Days:</span><span className="njd-role-value">{job.working_days}</span></div>}
                      {Boolean(job.willing_to_relocate) && <div className="njd-role-item"><span className="njd-role-label">Willing to Relocate:</span><span className="njd-role-value">Yes</span></div>}
                      {job.raw_workplace_type === "Hybrid" && job.hybrid_policy && <div className="njd-role-item"><span className="njd-role-label">Hybrid Policy:</span><span className="njd-role-value">{job.hybrid_policy}</span></div>}
                      {job.diversity_hiring && job.diversity_hiring.length > 0 && <div className="njd-role-item"><span className="njd-role-label">Diversity Hiring:</span><span className="njd-role-value">{Array.isArray(job.diversity_hiring) ? job.diversity_hiring.join(", ") : job.diversity_hiring}</span></div>}
                      {job.educational_qualification && job.educational_qualification.length > 0 && <div className="njd-role-item" style={{ gridColumn: '1 / -1' }}><span className="njd-role-label">Education:</span>
                        <div className="njd-skills-container" style={{ marginTop: '4px', gap: '6px' }}>
                          {(Array.isArray(job.educational_qualification) ? job.educational_qualification : [job.educational_qualification]).map((item, index) => (
                            <span key={index} className="njd-skill-tag" style={{ padding: '4px 12px', fontSize: '12px' }}>{String(item).trim()}</span>
                          ))}
                        </div>
                      </div>}
                      {job.languages && job.languages.length > 0 && <div className="njd-role-item" style={{ gridColumn: '1 / -1' }}><span className="njd-role-label">Languages Known:</span>
                        <div className="njd-skills-container" style={{ marginTop: '4px', gap: '6px' }}>
                          {(Array.isArray(job.languages) ? job.languages : [job.languages]).map((item, index) => (
                            <span key={index} className="njd-skill-tag" style={{ padding: '4px 12px', fontSize: '12px' }}>{String(item).trim()}</span>
                          ))}
                        </div>
                      </div>}
                      {job.candidate_industry && job.candidate_industry.length > 0 && <div className="njd-role-item" style={{ gridColumn: '1 / -1' }}><span className="njd-role-label">Candidate Industry:</span>
                        <div className="njd-skills-container" style={{ marginTop: '4px', gap: '6px' }}>
                          {(Array.isArray(job.candidate_industry) ? job.candidate_industry : [job.candidate_industry]).map((item, index) => (
                            <span key={index} className="njd-skill-tag" style={{ padding: '4px 12px', fontSize: '12px' }}>{String(item).trim()}</span>
                          ))}
                        </div>
                      </div>}
                      {job.variable_amount && <div className="njd-role-item"><span className="njd-role-label">Variable Component:</span><span className="njd-role-value">{job.variable_amount}</span></div>}
                      {job.bonus_amount && <div className="njd-role-item"><span className="njd-role-label">Bonus/Perks:</span><span className="njd-role-value">{job.bonus_amount}</span></div>}
                    </div>
                    {job.skills && job.skills.length > 0 && (
                      <div className="njd-key-skills" style={{ marginTop: '30px' }}>
                        <h3 className="njd-section-title">Key Skills</h3>
                        <div className="njd-skills-container">
                          {(Array.isArray(job.skills) ? job.skills : job.skills.split(',')).map((skill, index) => (
                            <span key={index} className="njd-skill-tag">{String(skill).trim()}</span>
                          ))}
                        </div>
                      </div>
                    )}


                  </div>


                  <div>
                    <div className="njd-sidebar-card">
                      <h3 className="njd-sidebar-title">About Company</h3>
                      {job?.logo && <img src={getImageUrl(job.logo)} alt={job.company} className="njd-sidebar-logo" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />}
                      {job?.company && <div className="njd-company-name">{job.company}</div>}
                      <div className="njd-company-desc">{job?.company_description || job?.about_us ? <span dangerouslySetInnerHTML={{ __html: job.company_description || job.about_us }}></span> : `${job?.company ? job.company + " " : ""}is a global leader in digital transformation, providing a range of services from consulting to technology solutions.`}</div>
                      <a href="#" style={{ color: '#5f2eea', fontWeight: '600', fontSize: '13px' }}>Company Info</a>
                    </div>
                    {job.benefits && job.benefits.length > 0 && (
                      <div className="njd-sidebar-card" style={{ background: '#fdfaff' }}>
                        <h3 className="njd-sidebar-title">Job Benefits</h3>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          {Array.isArray(job.benefits) ? job.benefits.map((benefit, index) => (
                            <div key={index} className="njd-stat-item" style={{ fontSize: '14px', alignItems: 'center' }}>
                              <FaCheckCircle style={{ color: '#52c41a', marginRight: '5px' }} /> {benefit}
                            </div>
                          )) : (
                            <div className="njd-stat-item" style={{ fontSize: '14px', alignItems: 'center' }}>
                              <FaCheckCircle style={{ color: '#52c41a', marginRight: '5px' }} /> {job.benefits}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="njd-sidebar-card">
                      <h3 className="njd-sidebar-title">Beware of Impostors!</h3>
                      <div className="njd-company-desc">Careerfast never charges candidates any fee to apply for jobs, attend interviews, receive an offer, or secure employment. If anyone asks you for money, bank details, OTPs, or other sensitive information in exchange for a job opportunity, do not make any payment or share your details. It may be a scam. If you receive a suspicious request, please report it to Careerfast immediately.</div>
                    </div>
                  </div>

                  <div className="njd-main-card">
                    <h2 className="njd-section-title">FAQs & Discussions</h2>
                    <Collapse items={items} expandIconPosition="end" bordered={false} style={{ background: "transparent" }}
                      expandIcon={({ isActive }) => isActive ? (<MinusCircleFilled style={{ color: "#5f2eea", fontSize: "18px" }} />) : (<PlusCircleFilled style={{ color: "#5f2eea", fontSize: "18px" }} />)}
                    />
                  </div>
                </>
              )}
            </Col>

            {/* Right Column */}
            <Col lg={7} md={24}>
              <div className="njd-sidebar-sticky">
                {sidebarLoading ? (
                  <>
                    <div className="njd-sidebar-card">
                      <Skeleton title active paragraph={{ rows: 4 }} />
                    </div>
                    <div className="njd-sidebar-card" style={{ marginTop: '16px' }}>
                      <Skeleton title active paragraph={{ rows: 4 }} />
                    </div>
                  </>
                ) : (
                  <>
                    {relatedJobs.length > 0 && (
                      <div className="njd-sidebar-card">
                    <h3 className="njd-sidebar-title">Related Jobs</h3>
                    <div className="njd-related-list">
                      {relatedJobs.map((rJob, idx) => {
                        const safeSlug = (val) => {
                          if (!val) return "";
                          if (Array.isArray(val)) return generateSlug(val.join(" "));
                          try {
                            const parsed = JSON.parse(val);
                            if (Array.isArray(parsed)) return generateSlug(parsed.join(" "));
                            return generateSlug(parsed);
                          } catch { return generateSlug(val); }
                        };
                        const jobNature = generateSlug(rJob.type || "");
                        const jobTitle = generateSlug(rJob.title || "");
                        const companyName = generateSlug(rJob.company || "");
                        const locationSlug = safeSlug(rJob.raw_location);
                        const workplaceType = generateSlug(rJob.raw_workplace_type || "");
                        const experienceType = generateSlug(rJob.level || "");
                        const experienceRequired = safeSlug(rJob.raw_experience_required);

                        let basePath = "/job-details";
                        if (rJob.type === "Internship") basePath = "/internship-details";
                        if (rJob.type === "Scholarship") basePath = "/scholarship-details";

                        const jobLink = `${basePath}/${jobNature}-${jobTitle}-${companyName}-${locationSlug}-${workplaceType}-${experienceType}-${experienceRequired}-${rJob.id}`;

                        return (
                          <a href={jobLink} key={idx} className="njd-related-item">
                            {rJob.logo ? (
                              <img src={getImageUrl(rJob.logo)} alt={rJob.company} className="njd-related-logo" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
                            ) : (
                              <div className="njd-related-logo-placeholder">{rJob.company ? rJob.company.charAt(0) : "C"}</div>
                            )}
                            <div className="njd-related-info">
                              <h4 className="njd-related-title">{rJob.title}</h4>
                              <div className="njd-related-company">{rJob.company}</div>
                              <div className="njd-related-loc"><FaMapMarkerAlt /> {rJob.location}</div>
                            </div>
                          </a>
                        )
                      })}
                    </div>
                  </div>
                )}

                {courses.length > 0 && (
                  <div className="njd-sidebar-card" style={{ marginTop: '16px' }}>
                    <h3 className="njd-sidebar-title">Recommended Courses</h3>
                    <div className="njd-related-list">
                      {courses.map((course, idx) => {
                        const courseLink = `/courses-details/${generateSlug(course.course_title)}-${course.id}`;
                        return (
                          <a href={courseLink} key={idx} className="njd-related-item njd-course-item">
                            {course.cover_image ? (
                              <img src={getImageUrl(course.cover_image)} alt={course.course_title} className="njd-course-img" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
                            ) : (
                              <div className="njd-course-img-placeholder"><MdOutlineWorkOutline /></div>
                            )}
                            <div className="njd-related-info">
                              <h4 className="njd-related-title" style={{ whiteSpace: 'normal', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{course.course_title}</h4>
                              {course.level && <div className="njd-related-company">{course.level}</div>}
                              <div className="njd-related-loc" style={{ color: '#5f2eea', fontWeight: 600 }}>Explore Course &rarr;</div>
                            </div>
                          </a>
                        )
                      })}
                    </div>
                  </div>
                )}
                  </>
                )}
              </div>
            </Col>
          </Row>
        </div>
      </main>

      <Drawer title="Apply for Job" placement="right" onClose={onClose} open={openApplyNow} width={400}>
        {job?.questions_with_ids?.map((q, index) => (
          <div key={q.id ? `q-${q.id}-${index}` : index} style={{ marginBottom: 20 }}>
            <p style={{ fontWeight: 600 }}>{q.question} {q.isrequired && <span style={{ color: "red" }}>*</span>}</p>
            <Input.TextArea rows={4} value={answers[index]} onChange={(e) => { const newAnswers = { ...answers }; newAnswers[index] = e.target.value; setAnswers(newAnswers); }} placeholder="Your answer..." />
          </div>
        ))}
        <Button type="primary" block size="large" onClick={applyForJobData} style={{ marginTop: 20, background: '#5f2eea' }}>Submit Application</Button>
      </Drawer>
    </>
  );
}
