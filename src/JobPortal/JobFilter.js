'use client';
// src/pages/JobFilter.jsx
import React, { useEffect, useMemo, useState } from "react";

import {
  Row,
  Col,
  Card,
  Space,
  Button,
  Radio,
  Checkbox,
  Skeleton,
  Drawer,
  Empty,
  Modal,
} from "antd";
import { getImageUrl } from "../utils/getImageUrl";
import {
  ClockCircleOutlined,
  ThunderboltFilled,
  WalletOutlined,
  FileTextOutlined,
  SyncOutlined,
  LeftOutlined,
  RightOutlined,
  CodeOutlined,
  DesktopOutlined,
  DatabaseOutlined,
  RocketOutlined,
  MobileOutlined,
  CloudServerOutlined,
  BarChartOutlined,
  FormatPainterOutlined,
  GlobalOutlined,
  BulbOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate, useParams } from "@/routing-shim";

import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import CommonSelectField from "../Common/CommonSelectField";
import SEO from "../Components/SEO/SEO";

import { getAllCourses, getJobCategoryData, getJobPosts, getUniqueCompanies } from "../ApiService/action";

import { FaMapMarkerAlt } from "react-icons/fa";
import { CgWorkAlt } from "react-icons/cg";
import { BiCategoryAlt } from "react-icons/bi";

import cities from "cities-list";
import "../css/JobFilter.css";
import "../css/naukri-ui-styles.css";

const generateSlug = (text = "") =>
  String(text).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// Helper function to convert currency code to symbol
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

const isClient = typeof window !== "undefined";

const currentPath = isClient ? window.location.pathname : "";
const currentOrigin = isClient ? window.location.origin : "";

const workTypes = ["In Office", "On Field", "Work From Home"];
const jobNature = ["Job", "Internship", "Scholarship"];

export default function JobFilter() {
  const navigate = useNavigate();
  const location = useLocation();
  const { filterSlug } = useParams();
  const [courses, setCourses] = useState([]);
  const [categorySearch, setCategorySearch] = useState("");
  const lastSlugRef = React.useRef(""); // Track the last filterSlug for reset logic
  /** -------------------- STATE -------------------- **/
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Data
  const [jobs, setJobs] = useState([]);
  const [activeJob, setActiveJob] = useState(null);
  const fetchRequestId = React.useRef(0);
  const skipUrlSyncRef = React.useRef(false);
  const [jobCategoryOptions, setJobCategoryOptions] = useState([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalJobs, setTotalJobs] = useState(0);

  // Filters
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [selectedWorkingDays, setSelectedWorkingDays] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedSort, setSelectedSort] = useState(null);
  const [selectedUserType, setSelectedUserType] = useState("");
  const [jobNatureSelected, setJobNatureSelected] = useState(
    isClient && window.location.pathname.includes("/internship") ? "Internship" :
      isClient && window.location.pathname.includes("/scholarship") ? "Scholarship" : "Job"
  );
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [tempSelectedLocations, setTempSelectedLocations] = useState([]);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [tempSelectedCategories, setTempSelectedCategories] = useState([]);
  const [modalCategorySearch, setModalCategorySearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [companySearch, setCompanySearch] = useState("");

  // Derived
  const [allCities, setAllCities] = useState([]);

  /** -------------------- EFFECTS -------------------- **/


  useEffect(() => {
    fetchCourses();
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await getUniqueCompanies();
      const raw = res?.data?.data || [];
      setCompanyOptions(raw.map(name => ({ label: name, value: name })));
    } catch (err) {
      console.log("Error loading companies:", err);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await getAllCourses();
      setCourses(res);
    } catch (error) {
      console.log("Error loading courses:", error);
    }
  };

  // Cities
  useEffect(() => {
    const mapped = Object.keys(cities).map((city) => ({
      value: city,
      label: city,
      country: cities[city].country,
    }));

    // Add "Pan India" at the top
    setAllCities([
      { value: "Pan India", label: "Pan India" },
      ...mapped
    ]);
  }, []);


  // Categories (with custom merge preserved)
  useEffect(() => {
    (async () => {
      try {
        const res = await getJobCategoryData({ min_jobs: 4 });
        const rawBackend = res?.data?.data || [];
        const uniqueNames = [...new Set(rawBackend.map(item => item?.category_name).filter(Boolean))];
        const backend = uniqueNames.map(name => ({ label: name, value: name }));

        backend.sort((a, b) =>
          String(a.label).localeCompare(String(b.label), "en", { sensitivity: "base" })
        );

        setJobCategoryOptions(backend);
      } catch {
        // silent
      }
    })();
  }, []);

  // 1. URL --> State (Standardized parsing)
  useEffect(() => {
    if (skipUrlSyncRef.current) {
      skipUrlSyncRef.current = false;
      return;
    }
    let nature = "Job";
    let locations = [];
    let categories = [];
    let types = [];
    let userType = "";

    // Parse Nature
    if (location.pathname.includes("/internship")) nature = "Internship";
    else if (location.pathname.includes("/scholarship")) nature = "Scholarship";

    // NEW: Parse Query Parameters (Multi-filter support)
    const queryParams = new URLSearchParams(location.search);
    const qLocations = [...queryParams.getAll('l'), ...queryParams.getAll('location')];
    const qCategories = queryParams.getAll('c');
    const qCompanies = queryParams.getAll('co');
    const qExperience = queryParams.get('experience');
    const qSearch = queryParams.get('q');
    const qNature = queryParams.get('job_nature');

    if (qNature && jobNature.includes(qNature)) nature = qNature;
    if (qLocations.length > 0) locations = qLocations;
    if (qCategories.length > 0) categories = qCategories;
    if (qSearch && qSearch !== searchTerm) setSearchTerm(qSearch);

    if (qExperience !== null) {
      const expVal = parseInt(qExperience);
      if (expVal === 0) userType = "Fresher";
      else if (expVal > 0) userType = "Experienced";
    }

    let companiesParsed = [];
    if (qCompanies.length > 0) companiesParsed = qCompanies;
    else if (qSearch) {
      // If q matches a company name exactly, we could also consider it a company filter
      // but for now let's keep it separate or handle it in backend
    }

    // Parse Slug
    if (filterSlug) {
      const cityMap = {
        "bangalore": "Bangalore", "delhi": "Delhi", "hyderabad": "Hyderabad",
        "gurgaon": "Gurgaon", "kolkata": "Kolkata", "mumbai": "Mumbai", "chennai": "Chennai"
      };

      if (filterSlug === "work-from-home") {
        types = ["Work From Home"];
      } else if (cityMap[filterSlug.toLowerCase()]) {
        // Direct city slug: /jobs/bangalore → Bangalore
        const cityVal = allCities.find(c => c.value.toLowerCase() === filterSlug.toLowerCase())?.value || cityMap[filterSlug.toLowerCase()];
        if (cityVal && !locations.includes(cityVal)) locations.push(cityVal);
      } else if (filterSlug.includes("-in-")) {
        // Legacy slug: /jobs/jobs-in-bangalore → Bangalore
        const parts = filterSlug.split("-in-");
        const cityKey = parts[parts.length - 1];
        const cityVal = allCities.find(c => c.value.toLowerCase() === cityKey)?.value || cityMap[cityKey];
        if (cityVal && !locations.includes(cityVal)) locations.push(cityVal);
      } else if (filterSlug === "fresher-jobs" || filterSlug.startsWith("fresher-jobs-in-")) {
        userType = "Fresher";
        if (filterSlug.includes("-in-")) {
          const cityKey = filterSlug.split("-in-")[1];
          const cityVal = allCities.find(c => c.value.toLowerCase() === cityKey)?.value || cityMap[cityKey];
          if (cityVal && !locations.includes(cityVal)) locations.push(cityVal);
        }
      } else if (filterSlug === "experienced-jobs") {
        userType = "Experienced";
      } else if (filterSlug === "college-students-jobs") {
        userType = "College Students";
      } else if (filterSlug.endsWith("-jobs")) {
        const catKey = filterSlug.replace("-jobs", "");
        if (catKey === "it") { if (!categories.includes("IT & Software")) categories.push("IT & Software"); }
        else if (catKey === "fresher") userType = "Fresher";
        else if (catKey === "full-stack-development") { if (!categories.includes("Full Stack Development")) categories.push("Full Stack Development"); }
        else if (catKey === "devops-cloud-computing") { if (!categories.includes("DevOps & Cloud Computing")) categories.push("DevOps & Cloud Computing"); }
        else if (catKey === "data-science-analytics") { if (!categories.includes("Data Science & Analytics")) categories.push("Data Science & Analytics"); }
        else if (catKey === "frontend-development") { if (!categories.includes("Frontend Development")) categories.push("Frontend Development"); }
        else if (catKey === "hr-analytics") { if (!categories.includes("HR Analytics")) categories.push("HR Analytics"); }
        else if (catKey === "software-development") { if (!categories.includes("Software Development")) categories.push("Software Development"); }
        else if (catKey === "ui-ux-design") { if (!categories.includes("UI/UX Design")) categories.push("UI/UX Design"); }
        else {
          const matched = jobCategoryOptions.find(c => generateSlug(c.value) === catKey);
          if (matched && !categories.includes(matched.value)) categories.push(matched.value);
        }
      } else {
        // Try matching as a city from the full cities list
        const cityVal = allCities.find(c => c.value.toLowerCase() === filterSlug.toLowerCase())?.value;
        if (cityVal && !locations.includes(cityVal)) locations.push(cityVal);
      }
    }

    // Update states from parsed URL values
    const isFirstTime = lastSlugRef.current === "";
    const urlChanged = lastSlugRef.current !== (filterSlug || location.pathname + location.search);

    const needsResolution = filterSlug && (
      (filterSlug.endsWith("-jobs") && selectedCategories.length === 0 && jobCategoryOptions.length > 0) ||
      (!filterSlug.includes("-jobs") && selectedLocations.length === 0 && allCities.length > 0)
    );

    if (isFirstTime || urlChanged || needsResolution) {
      if (jobNatureSelected !== nature) setJobNatureSelected(nature);

      // Locations
      if (locations.length > 0) {
        if (JSON.stringify(selectedLocations) !== JSON.stringify(locations)) setSelectedLocations(locations);
      } else if (filterSlug || location.search) {
        // Only clear if slug/query implies we should
        if (!filterSlug && !location.search.includes('l=')) setSelectedLocations([]);
      }

      // Categories
      if (categories.length > 0) {
        if (JSON.stringify(selectedCategories) !== JSON.stringify(categories)) setSelectedCategories(categories);
      } else if (filterSlug || location.search) {
        if (!filterSlug && !location.search.includes('c=')) setSelectedCategories([]);
      }

      if (types.length > 0) {
        if (JSON.stringify(selectedTypes) !== JSON.stringify(types)) setSelectedTypes(types);
      } else if (!filterSlug && !location.search.includes('types=')) {
        if (selectedTypes.length > 0) setSelectedTypes([]);
      }

      if (userType && selectedUserType !== userType) setSelectedUserType(userType);
      else if (!filterSlug && selectedUserType !== "") setSelectedUserType("");

      if (JSON.stringify(selectedCompanies) !== JSON.stringify(companiesParsed)) setSelectedCompanies(companiesParsed);

      if (isFirstTime || lastSlugRef.current.split("/")[1] !== location.pathname.split("/")[1]) {
        setSelectedStatus("");
        setSelectedWorkingDays("");
        setSelectedSort(null);
      }
      lastSlugRef.current = filterSlug || location.pathname + location.search;
    }
  }, [filterSlug, location.pathname, location.search, allCities, jobCategoryOptions, selectedCategories.length, selectedLocations.length]);

  // 2. State --> URL Sync
  const syncFilterUrl = (overrides = {}) => {
    const nature = overrides.hasOwnProperty('nature') ? overrides.nature : jobNatureSelected;
    const locations = overrides.hasOwnProperty('locations') ? overrides.locations : selectedLocations;
    const categories = overrides.hasOwnProperty('categories') ? overrides.categories : selectedCategories;
    const types = overrides.hasOwnProperty('types') ? overrides.types : selectedTypes;
    const userType = overrides.hasOwnProperty('userType') ? overrides.userType : selectedUserType;
    const companies = overrides.hasOwnProperty('companies') ? overrides.companies : selectedCompanies;

    const baseMap = { "Job": "jobs", "Internship": "internships", "Scholarship": "scholarship" };
    const base = baseMap[nature] || "jobs";

    let slug = "";
    const topCities = ["Bangalore", "Delhi", "Hyderabad", "Gurgaon", "Kolkata", "Mumbai", "Chennai"];

    const prefixMap = { "Job": "jobs-in-", "Internship": "internships-in-", "Scholarship": "scholarships-in-" };
    const prefix = prefixMap[nature] || "jobs-in-";

    // Hierarchy of Slugs (Priority: UserType > WorkMode > Location > Category)
    if (userType === "Fresher") {
      if (locations.length === 1 && topCities.includes(locations[0])) slug = `fresher-jobs-in-${generateSlug(locations[0])}`;
      else slug = "fresher-jobs";
    } else if (userType === "Experienced") slug = "experienced-jobs";
    else if (userType === "College Students") slug = "college-students-jobs";
    else if (types.includes("Work From Home") && types.length === 1) slug = "work-from-home";
    else if (locations.length === 1 && topCities.includes(locations[0])) slug = `${prefix}${generateSlug(locations[0])}`;
    else if (categories.length === 1) slug = `${generateSlug(categories[0])}-jobs`;

    // Handle Query Params for Multi-select
    const queryParams = new URLSearchParams();

    // If multiple locations or single but not top city, use query param
    if (locations.length > 1) {
      locations.forEach(l => queryParams.append('l', l));
    } else if (locations.length === 1 && !slug.includes(generateSlug(locations[0]))) {
      queryParams.append('l', locations[0]);
    }

    // If multiple categories or single but no slug, use query param
    if (categories.length > 1) {
      categories.forEach(c => queryParams.append('c', c));
    } else if (categories.length === 1 && !slug.includes("-jobs")) {
      queryParams.append('c', categories[0]);
    }

    if (companies.length > 0) {
      companies.forEach(co => queryParams.append('co', co));
    }

    if (searchTerm) {
      queryParams.append('q', searchTerm);
    }

    const qStr = queryParams.toString() ? `?${queryParams.toString()}` : "";
    const targetUrl = slug ? `/${base}/${slug}${qStr}` : `/${base}${qStr}`;

    if (location.pathname + location.search !== targetUrl) {
      skipUrlSyncRef.current = true;
      lastSlugRef.current = slug || targetUrl;
      navigate(targetUrl, { replace: true });
    }
  };

  // Fetch jobs when filters change (reset to page 1) with DEBOUNCE
  useEffect(() => {
    if (!jobNatureSelected) return;

    // Set loading immediately to show skeleton before debounce starts
    setLoading(true);
    setJobs([]);

    // Use a timeout to debounce rapid filter changes
    const timer = setTimeout(() => {
      fetchJobs(1, true);
    }, 400); // 400ms debounce

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedCategories.join("|"),
    selectedTypes.join("|"),
    selectedLocations.join("|"),
    selectedWorkingDays,
    selectedStatus,
    selectedSort,
    jobNatureSelected,
    selectedUserType,
    searchTerm,
    selectedCompanies.join("|"),
  ]);


  // Infinite scroll listener
  useEffect(() => {
    const handleScroll = () => {
      if (loading || loadingMore || !hasMore) return;

      const scrollTop =
        typeof window !== "undefined"
          ? window.pageYOffset || document.documentElement.scrollTop
          : 0;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;

      // Trigger when user is 300px from bottom
      if (scrollTop + clientHeight >= scrollHeight - 300) {
        loadMoreJobs();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, loadingMore, hasMore, page]);

  /** -------------------- HELPERS -------------------- **/
  function jobNatureOptionsToKey(opts) {
    return opts.map((o) => o.value).join("|");
  }

  const payload = useMemo(
    () => {
      const p = {};
      if (selectedCategories.length > 0) p.job_categories = selectedCategories;
      if (selectedTypes.length > 0) p.workplace_type = selectedTypes;
      if (selectedLocations.length > 0) p.work_location = selectedLocations;
      if (selectedWorkingDays) p.working_days = selectedWorkingDays;
      if (selectedStatus) p.status = selectedStatus;
      if (jobNatureSelected) p.job_nature = jobNatureSelected;
      if (selectedUserType) p.experience_type = selectedUserType;
      if (searchTerm) p.searchTerm = searchTerm;
      if (selectedCompanies.length > 0) p.companies = selectedCompanies;
      if (selectedSort === "highToLow") p.salary_sort = "high_to_low";
      else if (selectedSort === "lowToHigh") p.salary_sort = "low_to_high";
      return p;
    },
    [
      selectedCategories,
      selectedTypes,
      selectedLocations,
      selectedWorkingDays,
      selectedStatus,
      jobNatureSelected,
      selectedUserType,
      selectedSort,
    ]
  );

  const filteredCategoryOptions = useMemo(() => {
    return jobCategoryOptions.filter((item) =>
      item.label.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [jobCategoryOptions, categorySearch]);

  // Derived lists for Sidebar to show selected items correctly
  const displayLocations = useMemo(() => {
    const top = allCities.slice(0, 5).map(c => c.value);
    const combined = [...new Set([...top, ...selectedLocations])];
    return combined.map(val => {
      const city = allCities.find(c => c.value === val);
      return { value: val, label: city ? city.label : val };
    });
  }, [allCities, selectedLocations]);

  const displayCategories = useMemo(() => {
    if (categorySearch) {
      // When searching, show results + already selected items
      const combined = [...selectedCategories, ...filteredCategoryOptions.map(o => o.value)];
      const unique = [...new Set(combined)].slice(0, 15);
      return unique.map(val => {
        const cat = jobCategoryOptions.find(c => c.value === val);
        return { value: val, label: cat ? cat.label : val };
      });
    }
    const top = jobCategoryOptions.slice(0, 7).map(c => c.value);
    const combined = [...new Set([...top, ...selectedCategories])];
    return combined.map(val => {
      const cat = jobCategoryOptions.find(c => c.value === val);
      return { value: val, label: cat ? cat.label : val };
    });
  }, [jobCategoryOptions, selectedCategories, categorySearch, filteredCategoryOptions]);

  const displayCompanies = useMemo(() => {
    const combined = [...new Set([...selectedCompanies, ...companyOptions.map(o => o.value).slice(0, 5)])];
    return combined.map(val => {
      const co = companyOptions.find(o => o.value === val);
      return { value: val, label: co ? co.label : val };
    });
  }, [companyOptions, selectedCompanies]);


  const transformJob = (job) => {
    const postedDate = new Date(job.created_at);
    const today = new Date();
    const daysPassed = Math.floor((today - postedDate) / (1000 * 60 * 60 * 24));
    const totalActiveDays = 355;
    const daysLeft = totalActiveDays - daysPassed;

    const safeQs = Array.isArray(job?.questions) ? job.questions : [];

    return {
      id: job.id,
      title: job.job_title,
      company: job.company_name,
      logo: job.company_logo,
      job_description: job.job_description,
      date_posted: job.date_posted,
      working_days: job.working_days,
      daysLeft: daysLeft >= 0 ? `${daysLeft} days left` : "Expired",
      level: job.experience_type,
      salary:
        job.salary_type === "Fixed"
          ? (!job.min_salary || String(job.min_salary) === "0") ? "Not Disclosed" : `${getCurrencySymbol(job.currency)} ${job.min_salary || "N/A"} ${job.salary_duration?.toLowerCase() === "monthly" ? "Per Month" : "LPA"}`
          : job.salary_type === "Range"
            ? ((!job.min_salary || String(job.min_salary) === "0") && (!job.max_salary || String(job.max_salary) === "0")) ? "Not Disclosed" : `${getCurrencySymbol(job.currency)} ${job.min_salary || "N/A"} - ${job.max_salary || "N/A"} ${job.salary_duration?.toLowerCase() === "monthly" ? "Per Month" : "LPA"}`
            : "Not Disclosed",
      location: Array.isArray(job.work_location) ? job.work_location.join(", ") : job.work_location,
      diversity_hiring: job.diversity_hiring || [],
      job_category: job.job_category,
      type: job.job_nature,
      openings: job.openings,
      benefits: job.benefits || [],
      skills: job.skills || [],
      eligibility: job.experience_required?.join(", "),
      status: daysLeft >= 0 ? "Live" : "Expired",
      // keeping questions mapping harmlessly, though not used in UI now
      raw_location: job.work_location,
      raw_workplace_type: job.workplace_type,
      raw_experience_required: job.experience_required,
      questions: safeQs.map((q) => q?.question || ""),
      questions_with_ids: safeQs.map((q) => ({
        id: q?.id || null,
        question: q?.question || "",
        isrequired: !!q?.isrequired,
      })),
    };
  };

  const fetchJobs = async (passedPage = 1, isReset = false) => {
    if (isReset) {
      setLoading(true);
      setJobs([]);
      setPage(1);
    } else {
      setLoadingMore(true);
    }

    const requestId = ++fetchRequestId.current;

    try {
      const paginatedPayload = {
        ...payload,
        page: passedPage,
        limit: 20,
      };

      const res = await getJobPosts(paginatedPayload);
      if (requestId !== fetchRequestId.current) return;

      const raw = res?.data?.data?.data || [];
      const meta = res?.data?.data?.meta || {};
      const hasMoreOnBackend = meta.hasMore || false;
      const backendTotal = meta.total || 0;

      const transformedBatch = raw.map(transformJob);

      if (isReset) {
        setJobs(transformedBatch);
        setActiveJob(transformedBatch[0] || null);
        setTotalJobs(backendTotal);
      } else {
        setJobs((prevJobs) => {
          const combined = [...prevJobs, ...transformedBatch];
          // Deduplicate by ID
          const uniqueList = Array.from(new Map(combined.map(item => [item.id, item])).values());
          return uniqueList;
        });
        setTotalJobs(backendTotal);
      }

      setHasMore(hasMoreOnBackend);
      setPage(passedPage);

    } catch (err) {
      console.error("Fetch jobs error:", err);
      if (isReset) {
        setJobs([]);
        setTotalJobs(0);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreJobs = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchJobs(nextPage, false);
    }
  };

  const getFilterTitle = () => {
    const natureSuffix = jobNatureSelected === "Job" ? "Jobs" : jobNatureSelected === "Internship" ? "Internships" : jobNatureSelected === "Scholarship" ? "Scholarships" : "Opportunities";

    // Slug based titles
    if (filterSlug) {
      if (filterSlug === "work-from-home") return `Work From Home ${natureSuffix}`;
      if (filterSlug.includes("bangalore")) return `${natureSuffix} in Bangalore`;
      if (filterSlug.includes("delhi")) return `${natureSuffix} in Delhi`;
      if (filterSlug.includes("hyderabad")) return `${natureSuffix} in Hyderabad`;
      if (filterSlug.includes("gurgaon")) return `${natureSuffix} in Gurgaon`;
      if (filterSlug.includes("kolkata")) return `${natureSuffix} in Kolkata`;
      if (filterSlug.includes("mumbai")) return `${natureSuffix} in Mumbai`;
      if (filterSlug.includes("chennai")) return `${natureSuffix} in Chennai`;
      if (filterSlug === "it-jobs") return `IT & Software ${natureSuffix}`;
      if (filterSlug === "marketing-jobs") return `Marketing ${natureSuffix}`;
      if (filterSlug === "fresher-jobs") return `Fresher ${natureSuffix}`;
    }

    // State based fallbacks
    if (selectedLocations.length === 1) return `${natureSuffix} in ${selectedLocations[0]}`;
    if (selectedCategories.length === 1) return `${selectedCategories[0]} ${natureSuffix}`;
    if (jobNatureSelected) {
      const plural = jobNatureSelected === "Job" ? "Jobs" : jobNatureSelected === "Internship" ? "Internships" : "Scholarships";
      let title = `${jobNatureSelected} Opportunities`;
      if (selectedLocations.length === 1) {
        title += ` in ${selectedLocations[0]}`;
      }
      return title;
    }

    return `Latest ${natureSuffix}`;
  };

  /** -------------------- SIDEBAR FILTER UI (UNCHANGED) -------------------- **/
  const FilterSidebar = (
    <div className="naukri-sidebar">
      <div className="naukri-filter-card">
        <div className="naukri-filter-title">
          <span>Filters</span>
          <Button
            type="link"
            size="small"
            style={{ padding: 0, color: "var(--naukri-primary)" }}
            onClick={() => {
              setSelectedCategories([]);
              setSelectedTypes([]);
              setSelectedLocations([]);
              setSelectedWorkingDays("");
              setSelectedStatus("");
              setSelectedSort(null);
              setSelectedUserType("");
              setSelectedCompanies([]);
              lastSlugRef.current = ""; // Reset slug tracking
              const baseMap = { "Job": "jobs", "Internship": "internship", "Scholarship": "scholarship" };
              const base = baseMap[jobNatureSelected] || "jobs";
              navigate(`/${base}`, { replace: true });
            }}
          >
            Reset All
          </Button>
        </div>

        {/* Post Type */}
        <div className="naukri-filter-group">
          <h4 className="naukri-filter-group-title">
            Post Type
            <SyncOutlined style={{ fontSize: 10, color: "#8292b4" }} />
          </h4>
          <Radio.Group
            value={jobNatureSelected}
            onChange={(e) => {
              setJobNatureSelected(e.target.value);
              syncFilterUrl({ nature: e.target.value });
            }}
            style={{ width: "100%" }}
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              {jobNature.map((t) => (
                <Radio key={t} value={t} className="naukri-filter-item">
                  <span className="naukri-checkbox-label">{t}</span>
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        </div>

        {/* Location */}
        <div className="naukri-filter-group">
          <h4 className="naukri-filter-group-title">
            Location
            <SyncOutlined style={{ fontSize: 10, color: "#8292b4" }} rotate={180} />
          </h4>
          <Checkbox.Group
            value={selectedLocations}
            onChange={(v) => { setSelectedLocations(v); syncFilterUrl({ locations: v }); }}
            style={{ width: "100%" }}
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              {displayLocations.map((city) => (
                <Checkbox key={city.value} value={city.value} className="naukri-filter-item">
                  <span className="naukri-checkbox-label">{city.label}</span>
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
          <span
            className="naukri-view-more"
            onClick={() => {
              setTempSelectedLocations(selectedLocations);
              setLocationModalVisible(true);
            }}
          >
            View More
          </span>
        </div>

        {/* Work Mode */}
        <div className="naukri-filter-group">
          <h4 className="naukri-filter-group-title">
            Work Mode
            <SyncOutlined style={{ fontSize: 10, color: "#8292b4" }} />
          </h4>
          <Checkbox.Group
            value={selectedTypes}
            onChange={(v) => { setSelectedTypes(v); syncFilterUrl({ types: v }); }}
            style={{ width: "100%" }}
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              {workTypes.map((t) => (
                <Checkbox key={t} value={t} className="naukri-filter-item">
                  <span className="naukri-checkbox-label">{t}</span>
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        </div>

        {/* User Type */}
        <div className="naukri-filter-group">
          <h4 className="naukri-filter-group-title">Experience Level</h4>
          <Radio.Group
            value={selectedUserType}
            onChange={(e) => { setSelectedUserType(e.target.value); syncFilterUrl({ userType: e.target.value }); }}
            style={{ width: "100%" }}
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              <Radio value="Fresher" className="naukri-filter-item">
                <span className="naukri-checkbox-label">Fresher</span>
              </Radio>
              <Radio value="Experienced" className="naukri-filter-item">
                <span className="naukri-checkbox-label">Experienced</span>
              </Radio>
              <Radio value="College Students" className="naukri-filter-item">
                <span className="naukri-checkbox-label">College Students</span>
              </Radio>
            </Space>
          </Radio.Group>
        </div>

        {/* Company */}
        <div className="naukri-filter-group">
          <h4 className="naukri-filter-group-title">Company</h4>
          <Checkbox.Group
            value={selectedCompanies}
            onChange={(v) => { setSelectedCompanies(v); syncFilterUrl({ companies: v }); }}
            style={{ width: "100%" }}
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              {displayCompanies.map((co) => (
                <Checkbox key={co.value} value={co.value} className="naukri-filter-item">
                  <span className="naukri-checkbox-label">{co.label}</span>
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        </div>

        {/* Category */}
        <div className="naukri-filter-group">
          <h4 className="naukri-filter-group-title">Industry / Category</h4>
          <input
            type="text"
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
            placeholder="Search categories..."
            className="category-search-input"
            style={{ width: "100%", marginBottom: 10, padding: "6px 10px", borderRadius: 4, border: "1px solid #ddd" }}
          />
          <div>
            <Checkbox.Group
              value={selectedCategories}
              onChange={(v) => { setSelectedCategories(v); syncFilterUrl({ categories: v }); }}
              style={{ width: "100%" }}
            >
              <Space direction="vertical" style={{ width: "100%" }}>
                {displayCategories.map((opt) => (
                  <Checkbox key={opt.value} value={opt.value} className="naukri-filter-item">
                    <span className="naukri-checkbox-label">{opt.label}</span>
                  </Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
          </div>

          <span
            className="naukri-view-more"
            onClick={() => {
              setTempSelectedCategories(selectedCategories);
              setModalCategorySearch("");
              setCategoryModalVisible(true);
            }}
          >
            View More
          </span>
        </div>

        {/* Salary Sort */}
        <div className="naukri-filter-group">
          <h4 className="naukri-filter-group-title">Salary Range</h4>
          <CommonSelectField
            placeholder="Sort by Salary"
            value={selectedSort}
            onChange={(v) => { setSelectedSort(v); syncFilterUrl(); }}
            options={[
              { label: "High to Low", value: "highToLow" },
              { label: "Low to High", value: "lowToHigh" },
            ]}
            style={{ width: "100%" }}
          />
        </div>
      </div>
    </div>
  );

  /** -------------------- COMPONENTS -------------------- **/
  const TopRolesCarousel = () => {
    const roles = [
      { name: "Software Development", icon: <CodeOutlined /> },
      { name: "Frontend Development", icon: <DesktopOutlined /> },
      { name: "Backend Development", icon: <DatabaseOutlined /> },
      { name: "Full Stack Development", icon: <RocketOutlined /> },
      { name: "Mobile App Development", icon: <MobileOutlined /> },
      { name: "DevOps & Cloud Computing", icon: <CloudServerOutlined /> },
      { name: "Data Science & Analytics", icon: <BarChartOutlined /> },
      { name: "UI / UX", icon: <FormatPainterOutlined /> },
      { name: "Digital Marketing", icon: <GlobalOutlined /> },
      { name: "Marketing", icon: <BulbOutlined /> }
    ];

    const scrollRef = React.useRef(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);

    const handleScroll = () => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setShowLeftArrow(scrollLeft > 20);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
      }
    };

    const scroll = (direction) => {
      if (scrollRef.current) {
        const { clientWidth } = scrollRef.current;
        const scrollAmount = clientWidth * 0.6;
        const scrollTo = direction === 'left'
          ? scrollRef.current.scrollLeft - scrollAmount
          : scrollRef.current.scrollLeft + scrollAmount;

        scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
      }
    };

    return (
      <div className="naukri-top-roles-wrapper">
        <AnimatePresence>
          {showLeftArrow && (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="naukri-carousel-nav prev"
              onClick={() => scroll('left')}
            >
              <LeftOutlined />
            </motion.button>
          )}
        </AnimatePresence>

        <div
          className="naukri-top-roles-scroll"
          ref={scrollRef}
          onScroll={handleScroll}
        >
          {roles.map((role, idx) => (
            <motion.div
              key={role.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`naukri-role-card ${selectedCategories.includes(role.name) ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategories(prev => {
                  const isSelected = prev.includes(role.name);
                  const newCats = isSelected ? prev.filter(c => c !== role.name) : [...prev, role.name];
                  syncFilterUrl({ categories: newCats });
                  return newCats;
                });
              }}
            >
              <span className="naukri-role-icon">{role.icon}</span>
              <span className="naukri-role-name">{role.name}</span>
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {showRightArrow && (
            <motion.button
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="naukri-carousel-nav next"
              onClick={() => scroll('right')}
            >
              <RightOutlined />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    );
  };

  /** -------------------- JOB CARD (BRAND NEW UNIQUE CLASSES) -------------------- **/
  const JobCard = ({ job }) => (
    <div
      className="naukri-job-card"
      onClick={() => {
        const safeSlug = (val) => {
          if (!val) return "";
          if (Array.isArray(val)) return generateSlug(val.join(" "));
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) return generateSlug(parsed.join(" "));
            return generateSlug(parsed);
          } catch {
            return generateSlug(val);
          }
        };

        const jobNature = generateSlug(job.type || "");
        const jobTitle = generateSlug(job.title || "");
        const companyName = generateSlug(job.company || "");
        const locationSlug = safeSlug(job.raw_location);
        const workplaceType = generateSlug(job.raw_workplace_type || "");
        const experienceType = generateSlug(job.level || "");
        const experienceRequired = safeSlug(job.raw_experience_required);

        let basePath = "";
        if (job.type === "Job") basePath = "/job-details";
        else if (job.type === "Internship") basePath = "/internship-details";
        else if (job.type === "Scholarship") basePath = "/scholarship-details";

        const finalUrl = `${basePath}/${jobNature}-${jobTitle}-${companyName}-${locationSlug}-${workplaceType}-${experienceType}-${experienceRequired}-${job.id}`;
        window.open(finalUrl, "_blank");
      }}
    >
      <div className="naukri-job-header">
        <div style={{ flex: 1, paddingRight: '12px' }}>
          <h3 className="naukri-job-title">{job.title}</h3>
          <div className="naukri-company-info">
            <span className="naukri-company-name">{job.company}</span>
            <div className="naukri-company-rating">
              <ThunderboltFilled className="naukri-star-icon" />
              <span>4.2</span>
              <span className="naukri-meta-separator"></span>
              <span className="naukri-review-count">1.2k+ Reviews</span>
            </div>
          </div>
        </div>
        <div className="naukri-logo-container">
          <img src={getImageUrl(job.logo)} alt={job.company} className="naukri-company-logo" />
        </div>
      </div>

      <div className="naukri-job-meta">
        <div className="naukri-meta-item">
          <CgWorkAlt className="naukri-meta-icon" />
          <span>{job.level}</span>
        </div>
        <span className="naukri-meta-separator"></span>
        <div className="naukri-meta-item">
          <WalletOutlined className="naukri-meta-icon" />
          <span>{job.salary}</span>
        </div>
        <span className="naukri-meta-separator"></span>
        <div className="naukri-meta-item">
          <FaMapMarkerAlt className="naukri-meta-icon" />
          <span>{job.location}</span>
        </div>
      </div>

      <div className="naukri-job-description">
        <FileTextOutlined className="naukri-desc-icon" />
        <span>
          {(() => {
            if (!job.job_description) return "No description available";

            // 1. Helper to decode common HTML entities
            const decode = (str) => str
              .replace(/&amp;/g, "&")
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">")
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'")
              .replace(/&nbsp;/g, " ");

            // 2. Try to extract the first few bullet points for a structured look
            const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
            let match;
            const points = [];
            while ((match = liRegex.exec(job.job_description)) !== null && points.length < 2) {
              const pointText = match[1].replace(/<\/?[^>]+(>|$)/g, " ").trim();
              if (pointText) points.push(decode(pointText));
            }

            if (points.length > 0) {
              return points.join(". ") + "...";
            }

            // 3. Fallback to cleaned paragraph text
            let cleanText = job.job_description.replace(/<\/?[^>]+(>|$)/g, " ");
            cleanText = decode(cleanText);
            cleanText = cleanText.replace(/\s+/g, " ").trim();

            // Remove redundant "Job description" or "Role & responsibilities" prefix
            const lower = cleanText.toLowerCase();
            if (lower.startsWith("job description")) cleanText = cleanText.substring(15).trim();
            else if (lower.startsWith("role & responsibilities")) cleanText = cleanText.substring(23).trim();
            else if (lower.startsWith("role and responsibilities")) cleanText = cleanText.substring(25).trim();

            // Capitalize and truncate
            cleanText = cleanText.charAt(0).toUpperCase() + cleanText.slice(1);
            return cleanText.substring(0, 150) + "...";
          })()}
        </span>
      </div>

      <div className="naukri-skills-list">
        {job.skills.slice(0, 5).map((skill, index) => (
          <React.Fragment key={skill}>
            <span>{skill}</span>
            {index < 4 && index < job.skills.length - 1 && <span className="naukri-skill-dot">·</span>}
          </React.Fragment>
        ))}
        {job.skills.length > 5 && (
          <>
            <span className="naukri-skill-dot">·</span>
            <span>+{job.skills.length - 5} more</span>
          </>
        )}
      </div>

      <div className="naukri-job-footer">
        <div className="naukri-posted-time">
          <span>Posted: {job.date_posted || "Just now"}</span>
        </div>
        <div className="naukri-save-container">
          <ClockCircleOutlined />
          <span>Save Job</span>
        </div>
      </div>
    </div>
  );

  /** -------------------- SKELETONS -------------------- **/
  const FullPageSkeleton = () => (
    <div className="naukri-layout-container">
      <Row gutter={[24, 24]} className="container-fluid" justify="center" style={{ maxWidth: '1300px', margin: '0 auto' }}>
        {/* Sidebar Skeleton */}
        <Col xs={0} md={6} lg={5} xl={6}>
          <div className="naukri-sidebar-wrapper">
            <Card className="naukri-filter-card" style={{ border: 'none' }}>
              <Skeleton active paragraph={{ rows: 2 }} />
              <div style={{ marginTop: '30px' }}>
                <Skeleton active paragraph={{ rows: 4 }} title={false} />
              </div>
              <div style={{ marginTop: '30px' }}>
                <Skeleton active paragraph={{ rows: 4 }} title={false} />
              </div>
            </Card>
          </div>
        </Col>

        {/* Main Content Skeleton */}
        <Col xs={24} md={18} lg={13} xl={13}>
          <div className="naukri-top-roles-section" style={{ height: '60px', marginBottom: '24px' }}>
            <Skeleton.Button active block style={{ height: '52px', borderRadius: '12px' }} />
          </div>
          <div className="naukri-results-info">
            <Skeleton.Button active size="large" style={{ width: 250, marginBottom: 20 }} />
          </div>
          <Space direction="vertical" size={24} style={{ width: "100%" }}>
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="naukri-job-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <Skeleton.Avatar active size="large" shape="square" style={{ width: 50, height: 50 }} />
                  <div style={{ flex: 1 }}>
                    <Skeleton active paragraph={{ rows: 2 }} />
                  </div>
                </div>
                <div style={{ marginTop: '20px' }}>
                  <Skeleton active paragraph={{ rows: 1 }} title={false} />
                </div>
              </Card>
            ))}
          </Space>
        </Col>

        {/* Right Promo Skeleton */}
        <Col xs={0} lg={5} xl={5}>
          <Card className="naukri-promo-card" style={{ border: 'none' }}>
            <Skeleton active paragraph={{ rows: 3 }} />
          </Card>
          <Card className="naukri-promo-card" style={{ border: 'none', marginTop: '20px' }}>
            <Skeleton active paragraph={{ rows: 3 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );


  /** -------------------- RENDER -------------------- **/
  return (
    <>

      <SEO
        title={getFilterTitle()}
        description={`Explore the latest ${totalJobs} ${getFilterTitle()} available on CareerFast. ${selectedLocations.length > 0 ? `Connecting top talent with leading companies in ${selectedLocations.join(", ")}.` : "Find jobs, internships, and scholarships with top companies across India."
          }`}
        breadcrumbSchema={[
          { name: "Home", item: "/" },
          { name: jobNatureSelected === "Internship" ? "Internships" : "Jobs", item: currentPath }
        ]}
        structuredData={[
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "numberOfItems": jobs.length,
            "itemListElement": jobs.map((job, index) => ({
              "@type": "ListItem",
              "position": index + 1,
              "url": `${currentOrigin}/job-details/${generateSlug(job.type)}-${generateSlug(job.title)}-${generateSlug(job.company)}-${generateSlug(job.raw_location)}-${generateSlug(job.raw_workplace_type)}-${generateSlug(job.level)}-${generateSlug(job.raw_experience_required)}-${job.id}`
            }))
          }
        ]}
      />
      <Header />

      {loading && jobs.length === 0 ? (
        <FullPageSkeleton />
      ) : (
        <div className="naukri-layout-container">
          <div className="naukri-content-wrapper" style={{ maxWidth: '1500px', margin: '0 auto', padding: '0 40px' }}>
            <Row gutter={[40, 24]}>
              {/* Left Sidebar */}
              <Col xs={0} md={7} lg={6} xl={5}>
                <div className="naukri-sidebar-sticky">
                  {FilterSidebar}
                </div>
              </Col>


              {/* Center Content (Job List) */}
              <Col xs={24} md={17} lg={13} xl={14}>
                {/* Top Roles Carousel (Naukri style) */}
                <TopRolesCarousel />

                {/* Top Results Header */}
                <div className="naukri-results-info">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: '16px' }}>
                    <h2 className="naukri-results-count">
                      {`${totalJobs} ${getFilterTitle()}`}
                    </h2>
                    <div className="naukri-sort-container" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--naukri-text-tertiary)' }}>Sort by:</span>
                      <Button
                        type="text"
                        size="small"
                        style={{ fontWeight: selectedSort ? 700 : 400, color: selectedSort ? 'var(--naukri-primary)' : 'inherit' }}
                        onClick={() => setSelectedSort(selectedSort === 'highToLow' ? 'lowToHigh' : 'highToLow')}
                      >
                        Salary {selectedSort === 'highToLow' ? '↓' : selectedSort === 'lowToHigh' ? '↑' : ''}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="naukri-job-list-wrapper" style={{ position: 'relative', minHeight: '400px' }}>
                  {/* No overlay here, skeleton will show instead */}


                  {jobs.length === 0 && !loading ? (
                    <Card style={{ borderRadius: 12, textAlign: "center", padding: "60px 40px" }}>
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={<span style={{ fontSize: '16px', color: 'var(--naukri-text-secondary)' }}>No jobs found matching your criteria.</span>}
                      >
                        <Button
                          type="primary"
                          className="naukri-apply-btn"
                          onClick={() => {
                            setSelectedCategories([]);
                            setSelectedTypes([]);
                            setSelectedLocations([]);
                            setSelectedWorkingDays("");
                            setSelectedStatus("");
                            setSelectedSort(null);
                            setSelectedUserType("");
                            const baseMap = { "Job": "jobs", "Internship": "internship", "Scholarship": "scholarship" };
                            const base = baseMap[jobNatureSelected] || "jobs";
                            navigate(`/${base}`, { replace: true });
                          }}
                        >
                          Clear All Filters
                        </Button>
                      </Empty>
                    </Card>
                  ) : (
                    <div className={`naukri-job-list ${loading ? 'naukri-job-list-loading' : ''}`}>
                      {jobs.map((job) => (
                        <JobCard key={job.id} job={job} />
                      ))}

                      {loadingMore && (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                          <Card className="naukri-job-card" style={{ padding: '24px' }}>
                            <Skeleton active avatar paragraph={{ rows: 2 }} />
                          </Card>
                        </div>
                      )}

                      {!hasMore && jobs.length > 0 && (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--naukri-text-tertiary)', fontSize: '14px' }}>
                          <p>You've reached the end of the results. Try adjusting your filters for more options.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Col>

              {/* Right Sidebar (Promo / Ads) */}
              <Col xs={0} lg={5} xl={5}>
                <div className="naukri-promo-sticky">
                  <div className="naukri-promo-card">
                    <h4 className="naukri-promo-title">See 20+ jobs in your preferred location</h4>
                    <p style={{ fontSize: "13px", color: "var(--naukri-text-secondary)", lineHeight: '1.4' }}>Get better results by updating your profile details.</p>
                    <a href="/candidate-profile/mainprofile" className="naukri-promo-link">Update Profile</a>
                  </div>

                  <div className="naukri-promo-card" style={{ background: "linear-gradient(135deg, #fff5f5 0%, #fff 100%)" }}>
                    <h4 className="naukri-promo-title">Premium Services</h4>
                    <p style={{ fontSize: "13px", color: "var(--naukri-text-secondary)", lineHeight: '1.4' }}>Boost your job search with Careerfast Professional services.</p>
                    <a href="/services" className="naukri-promo-link">Explore Services</a>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </div>
      )}




      {/* Mobile Filters Drawer */}
      <Drawer
        width={320}
        title="Filters"
        onClose={() => setMobileFilterOpen(false)}
        open={mobileFilterOpen}
        className="header-drawer"
      >
        {FilterSidebar}
      </Drawer>

      {/* Location Selection Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingRight: '20px' }}>
            <span style={{ fontSize: '18px', fontWeight: 700, padding: '8px 0' }}>Location</span>
            <Button
              type="link"
              size="small"
              className="naukri-clear-all-link"
              onClick={() => setTempSelectedLocations([])}
              style={{ fontWeight: 600 }}
            >
              Clear All
            </Button>
          </div>
        }
        open={locationModalVisible}
        onCancel={() => setLocationModalVisible(false)}
        footer={null}
        width={850}
        closeIcon={<span style={{ fontSize: '18px' }}>×</span>}
        className="naukri-location-modal"
      >
        <div className="naukri-modal-content">
          <div className="naukri-location-grid">
            {[
              { label: "Bengaluru", value: "Bangalore", count: 14798 },
              { label: "Hyderabad", value: "Hyderabad", count: 7750 },
              { label: "Pune", value: "Pune", count: 5441 },
              { label: "Chennai", value: "Chennai", count: 3784 },
              { label: "Delhi / NCR", value: "Delhi", count: 3737 },
              { label: "Mumbai (All Areas)", value: "Mumbai", count: 2827 },
              { label: "Mumbai", value: "Mumbai", count: 1897 },
              { label: "Gurugram", value: "Gurgaon", count: 1544 },
              { label: "Noida", value: "Noida", count: 1105 },
              { label: "Kolkata", value: "Kolkata", count: 1001 },
              { label: "Ahmedabad", value: "Ahmedabad", count: 807 },
              { label: "Navi Mumbai", value: "Navi Mumbai", count: 445 },
              { label: "New Delhi", value: "New Delhi", count: 442 },
              { label: "Indore", value: "Indore", count: 387 },
              { label: "Kochi", value: "Kochi", count: 245 },
              { label: "Bhubaneswar", value: "Bhubaneswar", count: 219 },
              { label: "India", value: "India", count: 218 },
              { label: "Coimbatore", value: "Coimbatore", count: 191 },
              { label: "Thiruvananthapuram", value: "Thiruvananthapuram", count: 136 },
              { label: "Jaipur", value: "Jaipur", count: 123 },
              { label: "Nagpur", value: "Nagpur", count: 9 },
              { label: "Dubai", value: "Dubai", count: 92 },
              { label: "Bangalore", value: "Bangalore", count: 85 },
              { label: "Thane", value: "Thane", count: 89 },
              { label: "Chandigarh", value: "Chandigarh", count: 75 },
            ].map((loc) => (
              <div key={loc.label} className="naukri-modal-item">
                <Checkbox
                  checked={tempSelectedLocations.includes(loc.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setTempSelectedLocations([...tempSelectedLocations, loc.value]);
                    } else {
                      setTempSelectedLocations(tempSelectedLocations.filter(item => item !== loc.value));
                    }
                  }}
                >
                  <span className="naukri-modal-label">
                    {loc.label} <span className="naukri-modal-count">({loc.count})</span>
                  </span>
                </Checkbox>
              </div>
            ))}
          </div>

          <div className="naukri-modal-footer">
            <div className="naukri-modal-scrollbar"></div>
            <Button
              type="primary"
              className="naukri-apply-btn"
              onClick={() => {
                setSelectedLocations(tempSelectedLocations);
                syncFilterUrl({ locations: tempSelectedLocations });
                setLocationModalVisible(false);
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      </Modal>

      {/* Category Selection Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingRight: '20px' }}>
            <span style={{ fontSize: '18px', fontWeight: 700, padding: '8px 0' }}>Industry / Category</span>
            <Button
              type="link"
              size="small"
              className="naukri-clear-all-link"
              onClick={() => setTempSelectedCategories([])}
              style={{ fontWeight: 600 }}
            >
              Clear All
            </Button>
          </div>
        }
        open={categoryModalVisible}
        onCancel={() => setCategoryModalVisible(false)}
        footer={null}
        width={900}
        closeIcon={<span style={{ fontSize: '18px' }}>×</span>}
        className="naukri-location-modal"
      >
        <div className="naukri-modal-content">
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              value={modalCategorySearch}
              onChange={(e) => setModalCategorySearch(e.target.value)}
              placeholder="Search industries / categories..."
              className="category-search-input"
              style={{ width: "100%", padding: "10px 15px", borderRadius: "30px", border: "1px solid #ddd", fontSize: "14px", outline: "none" }}
            />
          </div>

          <div className="naukri-location-grid">
            {jobCategoryOptions
              .filter(opt => opt.label.toLowerCase().includes(modalCategorySearch.toLowerCase()))
              .map((opt) => (
                <div key={opt.value} className="naukri-modal-item">
                  <Checkbox
                    checked={tempSelectedCategories.includes(opt.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setTempSelectedCategories([...tempSelectedCategories, opt.value]);
                      } else {
                        setTempSelectedCategories(tempSelectedCategories.filter(item => item !== opt.value));
                      }
                    }}
                  >
                    <span className="naukri-modal-label">{opt.label}</span>
                  </Checkbox>
                </div>
              ))}
          </div>

          <div className="naukri-modal-footer">
            <div className="naukri-modal-scrollbar"></div>
            <Button
              type="primary"
              className="naukri-apply-btn"
              onClick={() => {
                setSelectedCategories(tempSelectedCategories);
                syncFilterUrl({ categories: tempSelectedCategories });
                setCategoryModalVisible(false);
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      </Modal>

      <Footer />
    </>
  );
}


