'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, X, MapPin, Briefcase, ChevronDown, ChevronRight,
  GraduationCap, Phone, Mail, MessageSquare, FileText, Bookmark,
  Filter, Download, Users as UsersIcon, Send, CheckCircle2,
  ArrowLeft, Plus, Calendar, UserCheck, MoreVertical, ExternalLink,
  Share2, Check, Sparkles, HelpCircle, Eye, RefreshCw,
  Folder, FolderPlus, AlertTriangle
} from 'lucide-react';
import {
  FiFolder,
  FiPlus,
  FiSearch,
  FiMail,
  FiDownload,
  FiX,
  FiCheck,
  FiBriefcase,
  FiStar,
  FiFileText,
  FiChevronDown,
  FiPhone,
  FiMessageSquare,
  FiMapPin,
  FiAward
} from 'react-icons/fi';
import { FaWhatsapp, FaLinkedin } from 'react-icons/fa';
import {
  getJobAppliedCandidates,
  updateJobStatus,
  saveCandidateHR,
  removeSavedCandidateHR,
  getSavedCandidatesHR,
  getCandidateFoldersAPI,
  addCandidatesToFolderAPI
} from '../ApiService/action';
import { CommonToaster } from '../Common/CommonToaster';
import { getImageUrl } from '../utils/getImageUrl';
import { downloadResumeFile } from '../utils/downloadResume';

// Helper to escape regex special characters
const escapeRegExp = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Helper to highlight matching keywords
const highlightKeywords = (text, keywordList = []) => {
  if (!text || typeof text !== 'string') return text;
  if (!keywordList || keywordList.length === 0) return text;

  const validKeywords = keywordList
    .map(k => (typeof k === 'string' ? k.trim() : ''))
    .filter(k => k.length > 0);

  if (validKeywords.length === 0) return text;

  try {
    const pattern = new RegExp(`(${validKeywords.map(escapeRegExp).join('|')})`, 'gi');
    const parts = text.split(pattern);

    return parts.map((part, i) => {
      const isMatch = validKeywords.some(kw => kw.toLowerCase() === part.toLowerCase());
      if (isMatch) {
        return (
          <mark key={i} className="bg-amber-200/90 text-amber-950 font-bold px-1 py-0.5 rounded-sm">
            {part}
          </mark>
        );
      }
      return part;
    });
  } catch (e) {
    return text;
  }
};

// Parse skills safely into an array of strings
const parseSkills = (skills) => {
  if (!skills) return [];
  if (Array.isArray(skills)) return skills.filter(Boolean).map(String);
  if (typeof skills === 'string') {
    try {
      const parsed = JSON.parse(skills);
      if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String);
    } catch (_) {
      return skills.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  return [];
};

// Stage options and metadata matching Manage-Folder employee card
const STAGE_OPTIONS = [
  { key: 'applied', label: 'Job Applicant', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  { key: 'shortlisted', label: 'Shortlisted', color: '#b45309', bg: '#fef3c7', border: '#fde68a' },
  { key: 'interviewed', label: 'Interviewed', color: '#0284c7', bg: '#e0f2fe', border: '#bae6fd' },
  { key: 'hired', label: 'Hired', color: '#047857', bg: '#ecfdf5', border: '#a7f3d0' },
  { key: 'rejected', label: 'Rejected', color: '#be123c', bg: '#fff1f2', border: '#fecdd3' },
];

const getStageMeta = (stageKey) => {
  let key = (stageKey || 'applied').toLowerCase().trim();
  if (key === 'applicant' || key === 'prospect' || key === 'job applicant') key = 'applied';
  if (key === 'selected') key = 'hired';
  return (
    STAGE_OPTIONS.find((s) => s.key === key) || {
      key,
      label: stageKey === 'prospect' ? 'Job Applicant' : (stageKey ? stageKey.charAt(0).toUpperCase() + stageKey.slice(1) : 'Job Applicant'),
      color: '#1d4ed8',
      bg: '#eff6ff',
      border: '#bfdbfe'
    }
  );
};

const getStageMetaLabel = (stageKey) => {
  return getStageMeta(stageKey).label;
};

// Format experience duration: e.g. "1 yr 2 mos"
const formatDuration = (startDate, endDate, currentlyWorking) => {
  if (!startDate) return '';
  const start = new Date(startDate);
  if (isNaN(start.getTime())) return '';
  const end = currentlyWorking || !endDate ? new Date() : new Date(endDate);
  const totalMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (totalMonths <= 0) return '1 mo';
  const yrs = Math.floor(totalMonths / 12);
  const mos = totalMonths % 12;
  if (yrs > 0 && mos > 0) return `${yrs} yr ${mos} mos`;
  if (yrs > 0) return `${yrs} yr${yrs > 1 ? 's' : ''}`;
  return `${mos} mo${mos > 1 ? 's' : ''}`;
};

const formatShortDate = (dateStr) => {
  if (!dateStr) return '10 Sept 2026';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Recent';
  const day = d.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

export default function Applicants({ jobId }) {
  const router = useRouter();

  // Core Data States
  const [loading, setLoading] = useState(true);
  const [jobData, setJobData] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [savedCandidateIds, setSavedCandidateIds] = useState([]);

  // Active Stage Tab: 'all' | 'applied' | 'shortlisted' | 'hired' | 'rejected'
  const [activeTab, setActiveTab] = useState('all');
  // Sub-filter under tab: 'all' | 'matching' | 'non_matching' | 'fresher' | 'experienced' | 'saved'
  const [subFilter, setSubFilter] = useState('all');

  // Sidebar Filter States (matching CandidateSearchResults Filter design)
  const [filters, setFilters] = useState({
    searchWithin: '',
    locations: [],
    skills: [],
    experienceLevels: [],
    educations: [],
    genders: [],
    showOnly: {
      topApplicant: false,
      hasResume: false,
      savedOnly: false
    }
  });

  // Local search inputs for sidebar accordions
  const [locSearch, setLocSearch] = useState('');
  const [skillSearch, setSkillSearch] = useState('');
  const [eduSearch, setEduSearch] = useState('');

  // Accordion open/close state
  const [openAccordions, setOpenAccordions] = useState({
    location: true,
    skills: true,
    experience: true,
    education: false,
    gender: false
  });

  // Interactive UI states
  const [selectedIds, setSelectedIds] = useState([]);
  const [unmaskedPhones, setUnmaskedPhones] = useState({});
  const [expandedAboutMap, setExpandedAboutMap] = useState({});
  const [expandedSkillsMap, setExpandedSkillsMap] = useState({});
  const [expandedQuestionsMap, setExpandedQuestionsMap] = useState({});
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [activeStagePopoverId, setActiveStagePopoverId] = useState(null);
  const [activeMoveDropdownId, setActiveMoveDropdownId] = useState(null);
  const [favouriteCandidates, setFavouriteCandidates] = useState({});

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'relevance' | 'experience' | 'name'
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [resumeModalApplicant, setResumeModalApplicant] = useState(null);
  const [contactModalApplicant, setContactModalApplicant] = useState(null);
  const [contactMessage, setContactMessage] = useState('');

  // Save to Folder Modal states
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [folderTargetCandidates, setFolderTargetCandidates] = useState([]);
  const [foldersList, setFoldersList] = useState([]);
  const [folderSearchInput, setFolderSearchInput] = useState('');
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [folderLoading, setFolderLoading] = useState(false);
  const [savingToFolder, setSavingToFolder] = useState(false);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [activeSavedPopoverId, setActiveSavedPopoverId] = useState(null);

  // Close interactive popovers on click outside
  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (
        e.target.closest('[data-popover-wrapper]') ||
        e.target.closest('[data-popover-trigger]') ||
        e.target.closest('[data-popover-content]')
      ) {
        return;
      }
      setActiveSavedPopoverId(null);
      setActiveStagePopoverId(null);
      setActiveMoveDropdownId(null);
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  // Load favourite candidates from localStorage
  useEffect(() => {
    try {
      const favs = localStorage.getItem('careerfast_fav_candidates');
      if (favs) setFavouriteCandidates(JSON.parse(favs));
    } catch (_) { }
  }, []);

  const handleToggleFavourite = (candId) => {
    setFavouriteCandidates(prev => {
      const next = { ...prev, [candId]: !prev[candId] };
      try {
        localStorage.setItem('careerfast_fav_candidates', JSON.stringify(next));
      } catch (_) { }
      return next;
    });
  };

  const handleQuickMoveToFolder = async (app, targetFolderId) => {
    try {
      const res = await addCandidatesToFolderAPI(targetFolderId, [app.id]);
      if (res?.data?.alreadyExists || res?.data?.success === false) {
        CommonToaster(res?.data?.message || 'Candidate is already present in that folder!', 'warning');
        return;
      }
      if (res?.data?.success) {
        const folderName = foldersList.find(f => f.id === targetFolderId)?.name || 'Folder';
        CommonToaster(`Candidate added to "${folderName}"`, 'success');
        fetchRecruiterFolders();
        fetchApplicantsData();
      }
    } catch (err) {
      console.error('Failed to add candidate to folder:', err);
      CommonToaster('Failed to add candidate to folder', 'error');
    }
  };

  // Fetch folders for this recruiter
  const fetchRecruiterFolders = useCallback(async () => {
    try {
      setFolderLoading(true);
      const res = await getCandidateFoldersAPI();
      if (res?.data?.success && Array.isArray(res.data.data)) {
        setFoldersList(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load folders:', err);
    } finally {
      setFolderLoading(false);
    }
  }, []);

  // Compute all folders a candidate is saved in (combining candidate's saved_in_folders and recruiter's foldersList)
  const getCandidateFolders = useCallback((app) => {
    const list = Array.isArray(app?.saved_in_folders) ? [...app.saved_in_folders] : [];
    if (Array.isArray(foldersList) && foldersList.length > 0 && app?.id) {
      foldersList.forEach(f => {
        if (Array.isArray(f.candidate_ids) && f.candidate_ids.includes(Number(app.id))) {
          const exists = list.some(item => item.folder_id === f.id || item.folder_name?.toLowerCase() === f.name?.toLowerCase());
          if (!exists) {
            list.push({
              folder_id: f.id,
              folder_name: f.name,
              stage: app.status || 'applicant',
              saved_at: f.updated_at || f.created_at || new Date().toISOString(),
              saved_by: 'Recruiter'
            });
          }
        }
      });
    }
    return list;
  }, [foldersList]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Fetch Applicants & Saved Candidates
  // ─────────────────────────────────────────────────────────────────────────────
  const fetchApplicantsData = useCallback(async () => {
    if (!jobId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await getJobAppliedCandidates({ post_id: jobId });
      const jobItem = res?.data?.data?.[0] || null;
      setJobData(jobItem);

      const rawUsers = jobItem?.users || [];
      // Deduplicate candidates by user id / applied_jobs_id to prevent duplicate candidate cards or React key collisions
      const seenCandIds = new Set();
      const uniqueRawUsers = [];
      for (const cand of rawUsers) {
        const candKey = cand.id !== undefined && cand.id !== null ? cand.id : cand.applied_jobs_id;
        if (candKey === undefined || candKey === null || !seenCandIds.has(candKey)) {
          if (candKey !== undefined && candKey !== null) seenCandIds.add(candKey);
          uniqueRawUsers.push(cand);
        }
      }

      const parsedApplicants = uniqueRawUsers.map((cand, idx) => {
        const skillsList = parseSkills(cand.skills);
        const expYears = Number(cand.total_years) || 0;
        const expMonths = Number(cand.total_months) || 0;
        const isFresher = cand.experince_type === 'Fresher' || (expYears === 0 && expMonths === 0);

        let expDisplay = 'Fresher';
        if (!isFresher) {
          expDisplay = `${expYears} Yrs${expMonths ? ` ${expMonths} Mos` : ''}`;
        }

        const appliedId = cand.applied_jobs_id || cand.applied_job_id || cand.application_id || cand.applied_id || cand.id;
        const candJobTitle = cand.job_title || cand.designation || (isFresher ? 'Fresher' : (jobItem?.job_title || 'Software Developer'));
        const candCompany = cand.company_name || cand.company || cand.current_company || '';
        const candSalary = cand.expected_salary || cand.salary || cand.annual_salary || '₹ 6 - 8 Lacs PA';
        const candNotice = cand.notice_period || '15 Days or less';

        return {
          id: cand.id ?? (idx + 1),
          applied_jobs_id: appliedId,
          first_name: cand.first_name || '',
          last_name: cand.last_name || '',
          name: `${cand.first_name || ''} ${cand.last_name || ''}`.trim() || 'Candidate',
          role: jobItem?.job_title || 'Applicant',
          job_title: candJobTitle,
          company_name: candCompany,
          salary: candSalary,
          expected_salary: candSalary,
          notice_period: candNotice,
          start_date: cand.start_date || '',
          end_date: cand.end_date || '',
          currently_working: cand.currently_working || false,
          college: cand.college || cand.university || cand.institute || '',
          avatar: cand.image || null,
          email: cand.email || '',
          phone: cand.phone ? `${cand.phone_code || '+91'} ${cand.phone}`.trim() : '',
          rawPhone: cand.phone || '',
          location: cand.location || 'India',
          total_years: expYears,
          total_months: expMonths,
          experince_type: cand.experince_type || (isFresher ? 'Fresher' : 'Experienced'),
          experienceDisplay: expDisplay,
          isFresher,
          skills: skillsList,
          resume: cand.resume || null,
          about: cand.about || '',
          gender: cand.gender || 'Not specified',
          course: cand.course || cand.education || '',
          education: cand.education || cand.course || '',
          status: (cand.status || 'applied').toLowerCase().trim(),
          applied_date: cand.applied_date,
          saved_in_folders: Array.isArray(cand.saved_in_folders) ? cand.saved_in_folders : [],
          social_links: cand.social_links || {},
          linkedin_url: cand.linkedin_url || cand.social_links?.linkedin || '',
          candidateAnswers: cand.candidateAnswersForRecruiterQuestions || []
        };
      });

      setApplicants(parsedApplicants);
    } catch (err) {
      console.error('Error fetching applicants:', err);
      CommonToaster('Failed to load applicants', 'error');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  // Load Saved Candidates for current recruiter
  const loadSavedCandidates = useCallback(async () => {
    try {
      const res = await getSavedCandidatesHR();
      if (res?.data?.success && Array.isArray(res.data.data)) {
        setSavedCandidateIds(res.data.data.map(c => c.id));
      }
    } catch (e) {
      try {
        const saved = localStorage.getItem('careerfast_saved_candidate_ids');
        if (saved) setSavedCandidateIds(JSON.parse(saved));
      } catch (_) { }
    }
  }, []);

  useEffect(() => {
    fetchApplicantsData();
    loadSavedCandidates();
    fetchRecruiterFolders();
  }, [fetchApplicantsData, loadSavedCandidates, fetchRecruiterFolders]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Dynamic Available Options Extracted from Real Applicants
  // ─────────────────────────────────────────────────────────────────────────────
  const jobRequiredSkills = useMemo(() => {
    if (!jobData?.skills) return [];
    return parseSkills(jobData.skills).map(s => s.toLowerCase());
  }, [jobData]);

  const availableLocations = useMemo(() => {
    const map = {};
    applicants.forEach(app => {
      const loc = app.location?.trim();
      if (loc && loc !== 'Not specified' && loc !== 'Location Not Specified') {
        map[loc] = (map[loc] || 0) + 1;
      }
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [applicants]);

  const availableSkills = useMemo(() => {
    const map = {};
    applicants.forEach(app => {
      app.skills.forEach(skill => {
        const s = skill.trim();
        if (s) map[s] = (map[s] || 0) + 1;
      });
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [applicants]);

  const availableEducations = useMemo(() => {
    const map = {};
    applicants.forEach(app => {
      const edu = app.course?.trim();
      if (edu && edu !== 'Not specified') {
        map[edu] = (map[edu] || 0) + 1;
      }
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [applicants]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Stage Counts for Top Tabs
  // ─────────────────────────────────────────────────────────────────────────────
  const stageCounts = useMemo(() => {
    const counts = {
      all: applicants.length,
      applied: 0,
      shortlisted: 0,
      hired: 0,
      rejected: 0
    };
    applicants.forEach(app => {
      if (counts[app.status] !== undefined) {
        counts[app.status]++;
      } else {
        counts.applied++;
      }
    });
    return counts;
  }, [applicants]);

  // Sub-filter counts under currently active stage tab
  const subFilterCounts = useMemo(() => {
    const pool = activeTab === 'all'
      ? applicants
      : applicants.filter(app => app.status === activeTab);

    let matching = 0;
    let nonMatching = 0;
    let fresher = 0;
    let experienced = 0;
    let saved = 0;

    pool.forEach(app => {
      const hasMatch = jobRequiredSkills.length > 0 && app.skills.some(s =>
        jobRequiredSkills.includes(s.toLowerCase())
      );
      if (hasMatch) matching++;
      else nonMatching++;

      if (app.isFresher) fresher++;
      else experienced++;

      if (savedCandidateIds.includes(app.id)) saved++;
    });

    return {
      all: pool.length,
      matching,
      nonMatching,
      fresher,
      experienced,
      saved
    };
  }, [applicants, activeTab, jobRequiredSkills, savedCandidateIds]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Filter & Search Logic
  // ─────────────────────────────────────────────────────────────────────────────
  const filteredApplicants = useMemo(() => {
    return applicants.filter(app => {
      // 1. Stage Tab Filter
      if (activeTab !== 'all' && app.status !== activeTab) {
        return false;
      }

      // 2. Sub-pill filter
      if (subFilter === 'matching') {
        const hasMatch = jobRequiredSkills.length > 0 && app.skills.some(s =>
          jobRequiredSkills.includes(s.toLowerCase())
        );
        if (!hasMatch) return false;
      } else if (subFilter === 'non_matching') {
        const hasMatch = jobRequiredSkills.length > 0 && app.skills.some(s =>
          jobRequiredSkills.includes(s.toLowerCase())
        );
        if (hasMatch) return false;
      } else if (subFilter === 'fresher') {
        if (!app.isFresher) return false;
      } else if (subFilter === 'experienced') {
        if (app.isFresher) return false;
      } else if (subFilter === 'saved') {
        if (!savedCandidateIds.includes(app.id)) return false;
      }

      // 3. Search within results query
      if (filters.searchWithin.trim()) {
        const q = filters.searchWithin.toLowerCase().trim();
        const inName = app.name.toLowerCase().includes(q);
        const inRole = app.role.toLowerCase().includes(q);
        const inLocation = app.location.toLowerCase().includes(q);
        const inEmail = app.email.toLowerCase().includes(q);
        const inPhone = app.rawPhone.toLowerCase().includes(q);
        const inCourse = app.course.toLowerCase().includes(q);
        const inAbout = app.about.toLowerCase().includes(q);
        const inSkills = app.skills.some(s => s.toLowerCase().includes(q));

        if (!inName && !inRole && !inLocation && !inEmail && !inPhone && !inCourse && !inAbout && !inSkills) {
          return false;
        }
      }

      // 4. Location Filter
      if (filters.locations.length > 0) {
        if (!filters.locations.some(l => l.toLowerCase() === app.location.toLowerCase())) {
          return false;
        }
      }

      // 5. Skills Filter (Match any selected skill)
      if (filters.skills.length > 0) {
        const appSkillsLower = app.skills.map(s => s.toLowerCase());
        const hasSkill = filters.skills.some(sk => appSkillsLower.includes(sk.toLowerCase()));
        if (!hasSkill) return false;
      }

      // 6. Experience Level Brackets
      if (filters.experienceLevels.length > 0) {
        const yrs = app.total_years;
        const matchesExp = filters.experienceLevels.some(lvl => {
          if (lvl === 'Fresher') return app.isFresher;
          if (lvl === '0-1 Years') return !app.isFresher && yrs <= 1;
          if (lvl === '1-3 Years') return yrs >= 1 && yrs <= 3;
          if (lvl === '3-5 Years') return yrs >= 3 && yrs <= 5;
          if (lvl === '5+ Years') return yrs > 5;
          return false;
        });
        if (!matchesExp) return false;
      }

      // 7. Education Filter
      if (filters.educations.length > 0) {
        if (!filters.educations.some(edu => app.course.toLowerCase().includes(edu.toLowerCase()))) {
          return false;
        }
      }

      // 8. Gender Filter
      if (filters.genders.length > 0) {
        if (!filters.genders.some(g => g.toLowerCase() === app.gender.toLowerCase())) {
          return false;
        }
      }

      // 9. Show Only Toggles
      if (filters.showOnly.hasResume && !app.resume) return false;
      if (filters.showOnly.savedOnly && !savedCandidateIds.includes(app.id)) return false;
      if (filters.showOnly.topApplicant && app.total_years < 2 && app.skills.length < 3) return false;

      return true;
    });
  }, [applicants, activeTab, subFilter, filters, jobRequiredSkills, savedCandidateIds]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Sorting
  // ─────────────────────────────────────────────────────────────────────────────
  const sortedApplicants = useMemo(() => {
    const list = [...filteredApplicants];

    list.sort((a, b) => {
      if (sortBy === 'newest') {
        const dateA = new Date(a.applied_date).getTime() || 0;
        const dateB = new Date(b.applied_date).getTime() || 0;
        return dateB - dateA;
      }
      if (sortBy === 'oldest') {
        const dateA = new Date(a.applied_date).getTime() || 0;
        const dateB = new Date(b.applied_date).getTime() || 0;
        return dateA - dateB;
      }
      if (sortBy === 'experience') {
        return (b.total_years * 12 + b.total_months) - (a.total_years * 12 + a.total_months);
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'relevance') {
        const matchCountA = a.skills.filter(s => jobRequiredSkills.includes(s.toLowerCase())).length;
        const matchCountB = b.skills.filter(s => jobRequiredSkills.includes(s.toLowerCase())).length;
        return matchCountB - matchCountA;
      }
      return 0;
    });

    return list;
  }, [filteredApplicants, sortBy, jobRequiredSkills]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Pagination
  // ─────────────────────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(sortedApplicants.length / pageSize));
  const paginatedApplicants = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedApplicants.slice(start, start + pageSize);
  }, [sortedApplicants, currentPage, pageSize]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, subFilter, filters, sortBy, pageSize]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Actions: Stage Update, Save Candidate, Selection
  // ─────────────────────────────────────────────────────────────────────────────
  const handleStageChange = async (appOrId, newStatus) => {
    let appliedJobsId = null;
    let candidateId = null;

    if (typeof appOrId === 'object' && appOrId !== null) {
      appliedJobsId = appOrId.applied_jobs_id || appOrId.id;
      candidateId = appOrId.id;
    } else {
      appliedJobsId = appOrId;
      const found = applicants.find(a => a.applied_jobs_id === appOrId || a.id === appOrId);
      candidateId = found?.id;
    }

    if (!appliedJobsId && !candidateId) return;
    setUpdatingStatusId(appliedJobsId || candidateId);
    try {
      await updateJobStatus({
        applied_jobs_id: appliedJobsId,
        applied_job_id: appliedJobsId,
        post_id: jobId,
        candidate_id: candidateId,
        user_id: candidateId,
        status: newStatus
      });
      setApplicants(prev =>
        prev.map(a =>
          (a.applied_jobs_id === appliedJobsId || a.id === candidateId) ? { ...a, status: newStatus } : a
        )
      );
      CommonToaster(`Stage updated to ${newStatus.toUpperCase()}`, 'success');
    } catch (err) {
      console.error('Failed to update stage:', err);
      CommonToaster('Failed to update status', 'error');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Dynamic Folder Handlers (Save Candidate in Folder)
  // ─────────────────────────────────────────────────────────────────────────────
  // Check if candidate is already present in a folder
  const isCandidateInFolder = useCallback((folder) => {
    if (!folder || folderTargetCandidates.length !== 1) return false;
    const targetCand = folderTargetCandidates[0];
    const targetId = Number(targetCand?.id);
    const inCandidateIds = Array.isArray(folder?.candidate_ids) && folder.candidate_ids.includes(targetId);
    const inCandSavedFolders = Array.isArray(targetCand?.saved_in_folders) &&
      targetCand.saved_in_folders.some(sf => sf.folder_id === folder.id || sf.folder_name?.trim().toLowerCase() === folder.name?.trim().toLowerCase());
    return inCandidateIds || inCandSavedFolders;
  }, [folderTargetCandidates]);

  const handleOpenFolderModalForCandidate = (cand) => {
    setFolderTargetCandidates([cand]);
    setFolderSearchInput('');
    setSelectedFolder(null);
    setShowNewFolderInput(false);
    setNewFolderName('');
    setFolderModalOpen(true);
    fetchRecruiterFolders();
  };

  const handleOpenFolderModalForBulk = () => {
    if (selectedIds.length === 0) {
      CommonToaster('Please select at least one candidate', 'warning');
      return;
    }
    const selectedApplicants = applicants.filter(a => selectedIds.includes(a.id));
    setFolderTargetCandidates(selectedApplicants);
    setFolderSearchInput('');
    setSelectedFolder(null);
    setShowNewFolderInput(false);
    setNewFolderName('');
    setFolderModalOpen(true);
    fetchRecruiterFolders();
  };

  const handleSaveToFolder = async () => {
    const chosenFolderName = selectedFolder?.name || folderSearchInput.trim() || newFolderName.trim();
    if (!chosenFolderName && !selectedFolder?.id) {
      CommonToaster('Please select an existing folder or enter a folder name', 'warning');
      return;
    }

    if (folderTargetCandidates.length === 0) {
      CommonToaster('No candidates selected to save', 'warning');
      return;
    }

    // Client-side quick restriction check for single candidate
    if (folderTargetCandidates.length === 1 && selectedFolder) {
      const candName = folderTargetCandidates[0]?.name || 'Candidate';
      if (isCandidateInFolder(selectedFolder)) {
        CommonToaster(`Candidate "${candName}" is already present in folder "${selectedFolder.name}"! Duplicate addition is restricted.`, 'warning');
        return;
      }
    }

    const targetIds = folderTargetCandidates.map(c => c.id);
    const folderIdentifier = selectedFolder?.id || chosenFolderName;
    const stage = folderTargetCandidates[0]?.status || 'prospect';

    try {
      setSavingToFolder(true);
      const res = await addCandidatesToFolderAPI(folderIdentifier, targetIds, stage);

      if (res?.data?.alreadyExists || res?.data?.success === false) {
        CommonToaster(res?.data?.message || 'Candidate is already in this folder! Duplicate addition is restricted.', 'warning');
        return;
      }

      if (res?.data?.success) {
        // Also ensure candidate is tracked in general saved candidates pool
        await Promise.all(
          folderTargetCandidates.map(c =>
            saveCandidateHR({
              candidate_id: c.id,
              applied_jobs_id: c.applied_jobs_id || c.id
            }).catch(() => { })
          )
        );

        const updatedSaved = Array.from(new Set([...savedCandidateIds, ...targetIds]));
        setSavedCandidateIds(updatedSaved);
        try {
          localStorage.setItem('careerfast_saved_candidate_ids', JSON.stringify(updatedSaved));
        } catch (_) { }

        const finalFolderName = res.data.data?.folderName || chosenFolderName;
        const finalFolderId = res.data.data?.folderId || selectedFolder?.id;
        const candLabel = folderTargetCandidates.length === 1
          ? (folderTargetCandidates[0].name || 'Candidate')
          : `${folderTargetCandidates.length} candidate(s)`;

        // Immediately update applicants state with this folder entry
        const newFolderEntry = {
          folder_id: finalFolderId,
          folder_name: finalFolderName,
          stage: stage,
          saved_at: new Date().toISOString(),
          saved_by: 'You'
        };

        setApplicants(prev =>
          prev.map(app => {
            if (targetIds.includes(app.id)) {
              const currentFolders = Array.isArray(app.saved_in_folders) ? app.saved_in_folders : [];
              const exists = currentFolders.some(f => f.folder_id === finalFolderId || f.folder_name === finalFolderName);
              return {
                ...app,
                saved_in_folders: exists ? currentFolders : [...currentFolders, newFolderEntry]
              };
            }
            return app;
          })
        );

        CommonToaster(res.data?.message || `Saved ${candLabel} to folder "${finalFolderName}" successfully! 📁`, 'success');
        setFolderModalOpen(false);
        if (selectedIds.length > 0) {
          setSelectedIds([]);
        }
        fetchRecruiterFolders();
      } else {
        CommonToaster(res?.data?.message || 'Failed to save candidates to folder', 'error');
      }
    } catch (err) {
      console.error('Error saving candidates to folder:', err);
      CommonToaster(err?.response?.data?.message || 'Failed to save candidate to folder', 'error');
    } finally {
      setSavingToFolder(false);
    }
  };

  const handleRemoveFromSaved = async (candidateId) => {
    try {
      await removeSavedCandidateHR(candidateId);
      const updated = savedCandidateIds.filter(id => id !== candidateId);
      setSavedCandidateIds(updated);
      try {
        localStorage.setItem('careerfast_saved_candidate_ids', JSON.stringify(updated));
      } catch (_) { }
      CommonToaster('Candidate removed from saved', 'info');
      setFolderModalOpen(false);
    } catch (err) {
      console.error('Failed to remove saved candidate:', err);
      CommonToaster('Failed to remove candidate from saved', 'error');
    }
  };

  // Filter existing folders based on search input
  const filteredExistingFolders = useMemo(() => {
    if (!folderSearchInput.trim()) return foldersList;
    const q = folderSearchInput.toLowerCase().trim();
    return foldersList.filter(f => (f.name || '').toLowerCase().includes(q));
  }, [foldersList, folderSearchInput]);

  const handleToggleSaveCandidate = async (candidateId, appliedJobsId) => {
    const cand = applicants.find(a => a.id === candidateId) || { id: candidateId, applied_jobs_id: appliedJobsId };
    handleOpenFolderModalForCandidate(cand);
  };

  // Bulk Selection
  const isAllPageSelected = paginatedApplicants.length > 0 &&
    paginatedApplicants.every(app => selectedIds.includes(app.id));

  const handleToggleSelectAll = () => {
    if (isAllPageSelected) {
      const pageIds = paginatedApplicants.map(a => a.id);
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      const pageIds = paginatedApplicants.map(a => a.id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleToggleSelectOne = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Bulk Stage Update
  const handleBulkStageChange = async (newStatus) => {
    if (selectedIds.length === 0) return;
    const selectedApplicants = applicants.filter(a => selectedIds.includes(a.id));

    try {
      await Promise.all(
        selectedApplicants.map(a =>
          updateJobStatus({
            applied_jobs_id: a.applied_jobs_id || a.id,
            applied_job_id: a.applied_jobs_id || a.id,
            post_id: jobId,
            candidate_id: a.id,
            user_id: a.id,
            status: newStatus
          })
        )
      );
      setApplicants(prev =>
        prev.map(a => (selectedIds.includes(a.id) ? { ...a, status: newStatus } : a))
      );
      CommonToaster(`Updated ${selectedIds.length} candidate(s) to ${newStatus}`, 'success');
      setSelectedIds([]);
    } catch (e) {
      console.error('Bulk stage update error:', e);
      CommonToaster('Failed to update some candidates', 'error');
    }
  };

  // Bulk Save opens the folder modal
  const handleBulkSave = () => {
    handleOpenFolderModalForBulk();
  };

  // Export to XLS / CSV
  const handleExportCSV = () => {
    if (filteredApplicants.length === 0) {
      CommonToaster('No applicants to export', 'info');
      return;
    }

    const headers = ['Candidate ID', 'Name', 'Email', 'Phone', 'Stage', 'Experience', 'Education', 'Location', 'Skills', 'Applied Date'];
    const rows = filteredApplicants.map(app => [
      app.id,
      `"${app.name.replace(/"/g, '""')}"`,
      `"${app.email}"`,
      `"${app.phone}"`,
      `"${app.status}"`,
      `"${app.experienceDisplay}"`,
      `"${app.course}"`,
      `"${app.location}"`,
      `"${app.skills.join(', ')}"`,
      `"${app.applied_date ? new Date(app.applied_date).toLocaleDateString() : ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Applicants_${(jobData?.job_title || 'Job').replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    CommonToaster('Applicants list exported as CSV', 'success');
  };

  // Share Job Link
  const handleShareJob = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      CommonToaster('Applicant folder link copied to clipboard!', 'success');
    }
  };

  // Unmask Phone
  const toggleUnmaskPhone = (id) => {
    setUnmaskedPhones(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Accordion Toggle
  const toggleAccordion = (name) => {
    setOpenAccordions(prev => ({ ...prev, [name]: !prev[name] }));
  };

  // Clear All Filters
  const handleClearAllFilters = () => {
    setFilters({
      searchWithin: '',
      locations: [],
      skills: [],
      experienceLevels: [],
      educations: [],
      genders: [],
      showOnly: { topApplicant: false, hasResume: false, savedOnly: false }
    });
    setSubFilter('all');
    setLocSearch('');
    setSkillSearch('');
    setEduSearch('');
    CommonToaster('All filters cleared', 'info');
  };

  // Helper for applied filter chips
  const appliedFiltersList = useMemo(() => {
    const list = [];
    if (filters.searchWithin.trim()) {
      list.push({
        key: 'searchWithin',
        label: `Search: "${filters.searchWithin}"`,
        clear: () => setFilters(f => ({ ...f, searchWithin: '' }))
      });
    }
    filters.locations.forEach(loc => {
      list.push({
        key: `loc_${loc}`,
        label: loc,
        clear: () => setFilters(f => ({ ...f, locations: f.locations.filter(l => l !== loc) }))
      });
    });
    filters.skills.forEach(skill => {
      list.push({
        key: `skill_${skill}`,
        label: skill,
        clear: () => setFilters(f => ({ ...f, skills: f.skills.filter(s => s !== skill) }))
      });
    });
    filters.experienceLevels.forEach(exp => {
      list.push({
        key: `exp_${exp}`,
        label: exp,
        clear: () => setFilters(f => ({ ...f, experienceLevels: f.experienceLevels.filter(e => e !== exp) }))
      });
    });
    filters.educations.forEach(edu => {
      list.push({
        key: `edu_${edu}`,
        label: edu,
        clear: () => setFilters(f => ({ ...f, educations: f.educations.filter(e => e !== edu) }))
      });
    });
    filters.genders.forEach(gen => {
      list.push({
        key: `gen_${gen}`,
        label: gen,
        clear: () => setFilters(f => ({ ...f, genders: f.genders.filter(g => g !== gen) }))
      });
    });
    if (filters.showOnly.hasResume) {
      list.push({
        key: 'hasResume',
        label: 'Has Resume',
        clear: () => setFilters(f => ({ ...f, showOnly: { ...f.showOnly, hasResume: false } }))
      });
    }
    if (filters.showOnly.savedOnly) {
      list.push({
        key: 'savedOnly',
        label: 'Saved Candidate',
        clear: () => setFilters(f => ({ ...f, showOnly: { ...f.showOnly, savedOnly: false } }))
      });
    }
    if (filters.showOnly.topApplicant) {
      list.push({
        key: 'topApplicant',
        label: 'Top Applicant',
        clear: () => setFilters(f => ({ ...f, showOnly: { ...f.showOnly, topApplicant: false } }))
      });
    }
    return list;
  }, [filters]);

  // Stage Badge Styles
  const getStageBadge = (stage) => {
    switch (stage) {
      case 'shortlisted':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'hired':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'applied':
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen text-slate-800 pb-20">

      {/* ──────────────────────────────────────────────────────────────────────────
          TOP NAV & APPLICANT FOLDER HEADER (FOUNDIT STYLE)
      ────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200/80 shadow-2xs sticky top-0 z-30">
        <div className="max-w-[1440px] mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

            {/* Left: Back Arrow + Title + Metadata */}
            <div className="flex items-start gap-3.5">
              <button
                type="button"
                onClick={() => router.back()}
                className="mt-0.5 w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-[#0A66C2] hover:bg-blue-50/50 hover:border-blue-200 transition-all cursor-pointer shrink-0"
                title="Back to My Jobs"
              >
                <ArrowLeft size={18} />
              </button>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-[20px] md:text-[22px] font-bold text-slate-900 tracking-tight leading-tight mb-0">
                    {jobData?.job_title || 'Job Applications'}
                  </h1>
                  <span className="text-[14px] font-bold text-[#0A66C2] bg-blue-50 border border-blue-200/70 px-2.5 py-0.5 rounded-full">
                    ({applicants.length} candidates)
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[12px] text-slate-500 mt-1 flex-wrap">
                  {jobData?.company_name && (
                    <span className="font-semibold text-slate-700">{jobData.company_name}</span>
                  )}
                  {jobData?.recruiter_name && (
                    <>
                      <span>•</span>
                      <span>Owner: <strong className="text-slate-700 font-semibold">{jobData.recruiter_name}</strong></span>
                    </>
                  )}
                  <span>•</span>
                  <span>
                    Posted: {jobData?.created_at ? new Date(jobData.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
                  </span>
                  {jobData?.openings && (
                    <>
                      <span>•</span>
                      <span className="text-slate-600 font-medium">{jobData.openings} Openings</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Actions (Share + Export XLS) */}
            <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
              <button
                type="button"
                onClick={handleShareJob}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 px-3.5 py-2 rounded-xl transition-all shadow-2xs cursor-pointer"
              >
                <Share2 size={15} className="text-slate-500" />
                <span>Share folder</span>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-white bg-[#0A66C2] hover:bg-[#004182] px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow cursor-pointer"
              >
                <Download size={15} />
                <span>Download XLS</span>
              </button>
            </div>
          </div>

          {/* ──────────────────────────────────────────────────────────────────────────
              FOUNDIT STAGE TABS BAR
          ────────────────────────────────────────────────────────────────────────── */}
          <div className="flex items-center gap-2 mt-4 border-b border-slate-100 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'All Applicants', count: stageCounts.all },
              { id: 'applied', label: 'Applied', count: stageCounts.applied },
              { id: 'shortlisted', label: 'Shortlisted', count: stageCounts.shortlisted },
              { id: 'hired', label: 'Hired / Selected', count: stageCounts.hired },
              { id: 'rejected', label: 'Rejected', count: stageCounts.rejected },
            ].map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSubFilter('all');
                  }}
                  className={`flex items-center gap-2 pb-3 px-3 text-[14px] font-semibold transition-all border-b-2 whitespace-nowrap cursor-pointer ${isActive
                    ? 'text-[#0A66C2] border-[#0A66C2] font-bold'
                    : 'text-slate-500 border-transparent hover:text-slate-800 hover:border-slate-300'
                    }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${isActive ? 'bg-blue-100 text-[#0A66C2]' : 'bg-slate-100 text-slate-500'
                    }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ──────────────────────────────────────────────────────────────────────────
              SUB-PILLS UNDER ACTIVE TAB (Matching, Fresher, Saved, etc.)
          ────────────────────────────────────────────────────────────────────────── */}
          <div className="flex items-center gap-2 pt-3 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'All', count: subFilterCounts.all },
              { id: 'matching', label: 'Matching applicant', count: subFilterCounts.matching },
              { id: 'non_matching', label: 'Non matching', count: subFilterCounts.nonMatching },
              { id: 'fresher', label: 'Fresher', count: subFilterCounts.fresher },
              { id: 'experienced', label: 'Experienced', count: subFilterCounts.experienced },
              { id: 'saved', label: 'Saved', count: subFilterCounts.saved },
            ].map(sub => {
              const isSelected = subFilter === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSubFilter(sub.id)}
                  className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap border ${isSelected
                    ? 'bg-[#0A66C2] text-white border-[#0A66C2] shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                >
                  <span>{sub.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                    {sub.count}
                  </span>
                </button>
              );
            })}
          </div>

        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          MAIN 2-COLUMN LAYOUT: FILTERS SIDEBAR + CANDIDATE FEED
      ────────────────────────────────────────────────────────────────────────── */}
      <div className="max-w-[1440px] mx-auto px-6 pt-6 flex flex-col lg:flex-row gap-6 items-start">

        {/* ──────────────────────────────────────────────────────────────────────────
            LEFT SIDEBAR: FILTER CANDIDATES PANEL (Exact Design from CandidateSearchResults)
        ────────────────────────────────────────────────────────────────────────── */}
        <div className="w-full lg:w-[300px] shrink-0 bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4 sticky top-20 max-h-[calc(100vh-100px)] overflow-y-auto hidden lg:block">

          <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
            <h2 className="text-[15px] font-bold text-slate-900 flex items-center gap-2 mb-0">
              <Filter size={16} className="text-[#0A66C2]" /> Filter Candidates
            </h2>
            {(appliedFiltersList.length > 0 || subFilter !== 'all') && (
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="text-[12px] font-semibold text-[#0A66C2] hover:text-[#004182] cursor-pointer"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Applied Filter Chips */}
          <div className="mb-4">
            {appliedFiltersList.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {appliedFiltersList.map(pill => (
                  <span
                    key={pill.key}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50/80 hover:bg-blue-100 text-[#0A66C2] text-[12px] font-semibold rounded-lg border border-blue-200/60 transition-colors"
                  >
                    <span>{pill.label}</span>
                    <X
                      size={12}
                      className="text-[#0A66C2] hover:text-rose-600 cursor-pointer"
                      onClick={pill.clear}
                    />
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-slate-400 italic mb-0">No specific filters active</p>
            )}
          </div>

          {/* Search Within Results */}
          <div className="mb-4 pt-3 border-t border-slate-100">
            <label className="block text-[12px] font-bold text-slate-700 mb-2">Search Within Results</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, skill, role, phone..."
                value={filters.searchWithin}
                onChange={e => setFilters(f => ({ ...f, searchWithin: e.target.value }))}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-[13px] text-slate-800 focus:outline-none focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/15 transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* SHOW ONLY TOGGLES */}
          <div className="py-3 border-t border-slate-100 space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Show Only</label>
            <label className="flex items-center justify-between text-[13px] font-medium text-slate-700 cursor-pointer hover:text-slate-900 select-none">
              <span>Top / Verified Applicant</span>
              <input
                type="checkbox"
                checked={filters.showOnly.topApplicant}
                onChange={e => setFilters(f => ({ ...f, showOnly: { ...f.showOnly, topApplicant: e.target.checked } }))}
                className="w-4 h-4 rounded border-slate-300 text-[#0A66C2] accent-[#0A66C2] cursor-pointer"
              />
            </label>
            <label className="flex items-center justify-between text-[13px] font-medium text-slate-700 cursor-pointer hover:text-slate-900 select-none">
              <span>Has Resume Attached</span>
              <input
                type="checkbox"
                checked={filters.showOnly.hasResume}
                onChange={e => setFilters(f => ({ ...f, showOnly: { ...f.showOnly, hasResume: e.target.checked } }))}
                className="w-4 h-4 rounded border-slate-300 text-[#0A66C2] accent-[#0A66C2] cursor-pointer"
              />
            </label>
            <label className="flex items-center justify-between text-[13px] font-medium text-slate-700 cursor-pointer hover:text-slate-900 select-none">
              <span>Saved Candidates</span>
              <input
                type="checkbox"
                checked={filters.showOnly.savedOnly}
                onChange={e => setFilters(f => ({ ...f, showOnly: { ...f.showOnly, savedOnly: e.target.checked } }))}
                className="w-4 h-4 rounded border-slate-300 text-[#0A66C2] accent-[#0A66C2] cursor-pointer"
              />
            </label>
          </div>

          {/* ACCORDION 1: Location */}
          <div className="py-3 border-t border-slate-100">
            <div
              onClick={() => toggleAccordion('location')}
              className="flex justify-between items-center cursor-pointer py-1 select-none group"
            >
              <h3 className="text-[13px] font-bold text-slate-800 flex items-center gap-1.5 group-hover:text-[#0A66C2] transition-colors">
                <span>Location</span>
                {filters.locations.length > 0 && (
                  <span className="bg-blue-100 text-[#0A66C2] text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {filters.locations.length}
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2">
                {filters.locations.length > 0 && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setFilters(f => ({ ...f, locations: [] }));
                    }}
                    className="text-[11px] text-slate-400 hover:text-rose-600 font-semibold cursor-pointer"
                  >
                    Clear
                  </span>
                )}
                <ChevronDown
                  size={15}
                  className={`text-slate-400 transition-transform ${openAccordions.location ? 'rotate-180 text-[#0A66C2]' : ''}`}
                />
              </div>
            </div>

            {openAccordions.location && (
              <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {availableLocations.length > 4 && (
                  <div className="relative mb-2">
                    <input
                      type="text"
                      placeholder="Search locations..."
                      value={locSearch}
                      onChange={e => setLocSearch(e.target.value)}
                      className="w-full px-2.5 py-1 text-[12px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0A66C2]"
                    />
                  </div>
                )}
                {availableLocations
                  .filter(([loc]) => !locSearch.trim() || loc.toLowerCase().includes(locSearch.toLowerCase()))
                  .map(([loc, count]) => {
                    const checked = filters.locations.includes(loc);
                    return (
                      <label key={loc} className="flex items-center justify-between text-[12px] text-slate-700 hover:text-slate-900 cursor-pointer select-none py-0.5">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setFilters(f => ({
                                ...f,
                                locations: checked ? f.locations.filter(l => l !== loc) : [...f.locations, loc]
                              }));
                            }}
                            className="w-3.5 h-3.5 rounded border-slate-300 text-[#0A66C2] accent-[#0A66C2] cursor-pointer"
                          />
                          <span className="truncate max-w-[180px]">{loc}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-semibold">{count}</span>
                      </label>
                    );
                  })}
              </div>
            )}
          </div>

          {/* ACCORDION 2: Key Skills */}
          <div className="py-3 border-t border-slate-100">
            <div
              onClick={() => toggleAccordion('skills')}
              className="flex justify-between items-center cursor-pointer py-1 select-none group"
            >
              <h3 className="text-[13px] font-bold text-slate-800 flex items-center gap-1.5 group-hover:text-[#0A66C2] transition-colors">
                <span>Key Skills</span>
                {filters.skills.length > 0 && (
                  <span className="bg-blue-100 text-[#0A66C2] text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {filters.skills.length}
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2">
                {filters.skills.length > 0 && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setFilters(f => ({ ...f, skills: [] }));
                    }}
                    className="text-[11px] text-slate-400 hover:text-rose-600 font-semibold cursor-pointer"
                  >
                    Clear
                  </span>
                )}
                <ChevronDown
                  size={15}
                  className={`text-slate-400 transition-transform ${openAccordions.skills ? 'rotate-180 text-[#0A66C2]' : ''}`}
                />
              </div>
            </div>

            {openAccordions.skills && (
              <div className="mt-2 space-y-1.5 max-h-52 overflow-y-auto pr-1">
                <div className="relative mb-2">
                  <input
                    type="text"
                    placeholder="Search skills..."
                    value={skillSearch}
                    onChange={e => setSkillSearch(e.target.value)}
                    className="w-full px-2.5 py-1 text-[12px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0A66C2]"
                  />
                </div>
                {availableSkills
                  .filter(([skill]) => !skillSearch.trim() || skill.toLowerCase().includes(skillSearch.toLowerCase()))
                  .slice(0, 15)
                  .map(([skill, count]) => {
                    const checked = filters.skills.includes(skill);
                    const isJobRequired = jobRequiredSkills.includes(skill.toLowerCase());
                    return (
                      <label key={skill} className="flex items-center justify-between text-[12px] text-slate-700 hover:text-slate-900 cursor-pointer select-none py-0.5">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setFilters(f => ({
                                ...f,
                                skills: checked ? f.skills.filter(s => s !== skill) : [...f.skills, skill]
                              }));
                            }}
                            className="w-3.5 h-3.5 rounded border-slate-300 text-[#0A66C2] accent-[#0A66C2] cursor-pointer"
                          />
                          <span className={`truncate max-w-[180px] ${isJobRequired ? 'font-bold text-[#0A66C2]' : ''}`}>
                            {skill}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-semibold">{count}</span>
                      </label>
                    );
                  })}
              </div>
            )}
          </div>

          {/* ACCORDION 3: Experience */}
          <div className="py-3 border-t border-slate-100">
            <div
              onClick={() => toggleAccordion('experience')}
              className="flex justify-between items-center cursor-pointer py-1 select-none group"
            >
              <h3 className="text-[13px] font-bold text-slate-800 flex items-center gap-1.5 group-hover:text-[#0A66C2] transition-colors">
                <span>Experience Level</span>
                {filters.experienceLevels.length > 0 && (
                  <span className="bg-blue-100 text-[#0A66C2] text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {filters.experienceLevels.length}
                  </span>
                )}
              </h3>
              <ChevronDown
                size={15}
                className={`text-slate-400 transition-transform ${openAccordions.experience ? 'rotate-180 text-[#0A66C2]' : ''}`}
              />
            </div>

            {openAccordions.experience && (
              <div className="mt-2 space-y-1.5">
                {['Fresher', '0-1 Years', '1-3 Years', '3-5 Years', '5+ Years'].map(lvl => {
                  const checked = filters.experienceLevels.includes(lvl);
                  return (
                    <label key={lvl} className="flex items-center gap-2 text-[12px] text-slate-700 hover:text-slate-900 cursor-pointer select-none py-0.5">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setFilters(f => ({
                            ...f,
                            experienceLevels: checked
                              ? f.experienceLevels.filter(e => e !== lvl)
                              : [...f.experienceLevels, lvl]
                          }));
                        }}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-[#0A66C2] accent-[#0A66C2] cursor-pointer"
                      />
                      <span>{lvl}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* ACCORDION 4: Education */}
          {availableEducations.length > 0 && (
            <div className="py-3 border-t border-slate-100">
              <div
                onClick={() => toggleAccordion('education')}
                className="flex justify-between items-center cursor-pointer py-1 select-none group"
              >
                <h3 className="text-[13px] font-bold text-slate-800 flex items-center gap-1.5 group-hover:text-[#0A66C2] transition-colors">
                  <span>Education / Course</span>
                  {filters.educations.length > 0 && (
                    <span className="bg-blue-100 text-[#0A66C2] text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                      {filters.educations.length}
                    </span>
                  )}
                </h3>
                <ChevronDown
                  size={15}
                  className={`text-slate-400 transition-transform ${openAccordions.education ? 'rotate-180 text-[#0A66C2]' : ''}`}
                />
              </div>

              {openAccordions.education && (
                <div className="mt-2 space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {availableEducations.map(([edu, count]) => {
                    const checked = filters.educations.includes(edu);
                    return (
                      <label key={edu} className="flex items-center justify-between text-[12px] text-slate-700 hover:text-slate-900 cursor-pointer select-none py-0.5">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setFilters(f => ({
                                ...f,
                                educations: checked ? f.educations.filter(e => e !== edu) : [...f.educations, edu]
                              }));
                            }}
                            className="w-3.5 h-3.5 rounded border-slate-300 text-[#0A66C2] accent-[#0A66C2] cursor-pointer"
                          />
                          <span className="truncate max-w-[180px]">{edu}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-semibold">{count}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ACCORDION 5: Gender */}
          <div className="py-3 border-t border-slate-100">
            <div
              onClick={() => toggleAccordion('gender')}
              className="flex justify-between items-center cursor-pointer py-1 select-none group"
            >
              <h3 className="text-[13px] font-bold text-slate-800 flex items-center gap-1.5 group-hover:text-[#0A66C2] transition-colors">
                <span>Gender</span>
              </h3>
              <ChevronDown
                size={15}
                className={`text-slate-400 transition-transform ${openAccordions.gender ? 'rotate-180 text-[#0A66C2]' : ''}`}
              />
            </div>

            {openAccordions.gender && (
              <div className="mt-2 space-y-1.5">
                {['Male', 'Female'].map(gen => {
                  const checked = filters.genders.includes(gen);
                  return (
                    <label key={gen} className="flex items-center gap-2 text-[12px] text-slate-700 hover:text-slate-900 cursor-pointer select-none py-0.5">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setFilters(f => ({
                            ...f,
                            genders: checked ? f.genders.filter(g => g !== gen) : [...f.genders, gen]
                          }));
                        }}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-[#0A66C2] accent-[#0A66C2] cursor-pointer"
                      />
                      <span>{gen}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* ──────────────────────────────────────────────────────────────────────────
            RIGHT COLUMN: APPLICANTS FEED & CONTROLS
        ────────────────────────────────────────────────────────────────────────── */}
        <div className="flex-1 w-full space-y-4">

          {/* Action Toolbar: Select All + Bulk Actions + Sort/Page Limit */}
          <div className="bg-white rounded-2xl border border-slate-200/90 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">

            {/* Left: Select all checkbox & selection badge */}
            <div className="flex items-center gap-3 flex-wrap">
              <label className="flex items-center gap-2.5 text-[13px] font-semibold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAllPageSelected}
                  onChange={handleToggleSelectAll}
                  className="w-4 h-4 rounded border-slate-300 text-[#0A66C2] accent-[#0A66C2] cursor-pointer"
                />
                <span>
                  {selectedIds.length > 0 ? (
                    <strong className="text-[#0A66C2]">{selectedIds.length} profiles selected</strong>
                  ) : (
                    'Select all on page'
                  )}
                </span>
              </label>

              {/* Bulk Action Buttons (Visible when candidates are selected) */}
              {selectedIds.length > 0 && (
                <div className="flex items-center gap-2 pl-3 border-l border-slate-200 flex-wrap">
                  {/* Stage Dropdown */}
                  <div className="relative group">
                    <button
                      type="button"
                      className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl cursor-pointer"
                    >
                      <span>Move Stage</span>
                      <ChevronDown size={13} />
                    </button>
                    <div className="absolute left-0 mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 hidden group-hover:block z-40">
                      <button
                        type="button"
                        onClick={() => handleBulkStageChange('applied')}
                        className="w-full text-left px-2.5 py-1 text-[12px] rounded-lg hover:bg-blue-50 text-blue-700 font-medium"
                      >
                        Applied
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBulkStageChange('shortlisted')}
                        className="w-full text-left px-2.5 py-1 text-[12px] rounded-lg hover:bg-amber-50 text-amber-700 font-medium"
                      >
                        Shortlisted
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBulkStageChange('hired')}
                        className="w-full text-left px-2.5 py-1 text-[12px] rounded-lg hover:bg-emerald-50 text-emerald-700 font-medium"
                      >
                        Hired / Selected
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBulkStageChange('rejected')}
                        className="w-full text-left px-2.5 py-1 text-[12px] rounded-lg hover:bg-rose-50 text-rose-700 font-medium"
                      >
                        Rejected
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleBulkSave}
                    className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0A66C2] bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
                  >
                    <Bookmark size={13} />
                    <span>Save to Folder</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const emails = applicants
                        .filter(a => selectedIds.includes(a.id) && a.email)
                        .map(a => a.email);
                      if (emails.length > 0) {
                        window.location.href = `mailto:${emails.join(',')}`;
                      } else {
                        CommonToaster('No email addresses available for selected applicants', 'info');
                      }
                    }}
                    className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
                  >
                    <Mail size={13} />
                    <span>Email</span>
                  </button>
                </div>
              )}
            </div>

            {/* Right: Sort By + Show Per Page + Pagination Controls */}
            <div className="flex items-center gap-3 text-[12px] text-slate-500 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-600">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[12px] font-bold text-slate-800 focus:outline-none focus:border-[#0A66C2] cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="relevance">Best Match</option>
                  <option value="experience">Experience</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-600">Show:</span>
                <select
                  value={pageSize}
                  onChange={e => setPageSize(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[12px] font-bold text-slate-800 focus:outline-none focus:border-[#0A66C2] cursor-pointer"
                >
                  <option value={10}>10 / page</option>
                  <option value={20}>20 / page</option>
                  <option value={50}>50 / page</option>
                </select>
              </div>

              {/* Quick Pagination */}
              <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="p-1 rounded-md text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  &lt;
                </button>
                <span className="font-bold text-slate-800 px-1">{currentPage}</span>
                <span>/</span>
                <span>{totalPages}</span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="p-1 rounded-md text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  &gt;
                </button>
              </div>
            </div>

          </div>

          {/* ──────────────────────────────────────────────────────────────────────────
              CANDIDATES FEED (FOUNDIT CARD STYLE)
          ────────────────────────────────────────────────────────────────────────── */}
          <div className="space-y-4">
            {loading ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center text-slate-500 font-medium shadow-2xs">
                <div className="w-9 h-9 border-4 border-[#0A66C2] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-[15px] font-bold text-slate-800">Loading Job Applicants...</p>
                <p className="text-[13px] text-slate-400 mt-1">Retrieving candidate profiles, applications, and screening data</p>
              </div>
            ) : paginatedApplicants.length > 0 ? (
              paginatedApplicants.map((app, cardIdx) => {
                const isSelected = selectedIds.includes(app.id);
                const isSaved = savedCandidateIds.includes(app.id);
                const isPhoneRevealed = unmaskedPhones[app.id];
                const isAboutExpanded = expandedAboutMap[app.id];
                const areSkillsExpanded = expandedSkillsMap[app.id];
                const areQuestionsExpanded = expandedQuestionsMap[app.id];
                const candFolders = getCandidateFolders(app);
                const isCandidateSavedAnywhere = isSaved || candFolders.length > 0;

                // Vibrant Avatar Gradients
                const gradients = [
                  'from-[#0A66C2] to-blue-700',
                  'from-blue-600 to-sky-600',
                  'from-emerald-500 to-teal-600',
                  'from-amber-500 to-orange-500',
                  'from-rose-500 to-pink-600',
                  'from-cyan-500 to-blue-600'
                ];
                const grad = gradients[cardIdx % gradients.length];
                const initials = `${app.first_name?.[0] || 'C'}${app.last_name?.[0] || ''}`.toUpperCase();

                // Search keywords for highlighting
                const highlightWords = [
                  filters.searchWithin.trim(),
                  ...filters.skills,
                  ...jobRequiredSkills
                ].filter(Boolean);

                const currentStageMeta = getStageMeta(app.status);
                const candidateSkills = Array.isArray(app.skills) ? app.skills : [];
                const skillsToDisplay = areSkillsExpanded ? candidateSkills : candidateSkills.slice(0, 5);
                const hasMoreSkills = candidateSkills.length > 5;

                return (
                  <div
                    key={`applicant-${app.id ?? 'item'}-${app.applied_jobs_id ?? cardIdx}`}
                    className={`relative rounded-2xl border bg-white p-4 shadow-2xs hover:border-[#cbd5e1] hover:shadow-xs transition-all space-y-3 ${isSelected ? 'border-[#0A66C2] ring-2 ring-[#0A66C2]/15' : 'border-slate-200/90'
                      }`}
                  >
                    {/* ── TOP ROW: Checkbox, Avatar, Name, "Saved v" Popover, "Stage: [Name] v" Popover, LinkedIn & Resume ── */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(app.id)}
                          className="h-4 w-4 rounded text-[#0A66C2] focus:ring-[#0A66C2] border-slate-300 cursor-pointer accent-[#0A66C2]"
                        />

                        {/* Avatar & Name */}
                        <div className="flex items-center gap-2.5">
                          {app.avatar ? (
                            <img
                              src={getImageUrl(app.avatar, initials)}
                              alt={app.name}
                              className="h-9 w-9 shrink-0 rounded-xl object-cover border border-slate-200 shadow-2xs"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(app.name)}&background=eff6ff&color=0A66C2&bold=true`;
                              }}
                            />
                          ) : (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-bold text-[#0A66C2] text-sm shadow-2xs">
                              {app.name ? app.name.charAt(0).toUpperCase() : 'C'}
                            </div>
                          )}

                          <span
                            onClick={() => setResumeModalApplicant(app)}
                            className="text-[15.5px] font-semibold text-slate-900 hover:text-[#0A66C2] transition-colors cursor-pointer"
                          >
                            {highlightKeywords(app.name, highlightWords)}
                          </span>
                        </div>

                        {/* "Saved v" Popover */}
                        <div className="relative" data-popover-wrapper="saved">
                          <button
                            type="button"
                            data-popover-trigger="saved"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveSavedPopoverId(activeSavedPopoverId === app.id ? null : app.id);
                              setActiveStagePopoverId(null);
                              setActiveMoveDropdownId(null);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-[#0A66C2] hover:bg-blue-100 transition-colors cursor-pointer"
                          >
                            <span>Saved</span>
                            <FiChevronDown
                              className={`h-3 w-3 transition-transform duration-150 ${activeSavedPopoverId === app.id ? 'rotate-180' : ''}`}
                            />
                          </button>

                          {activeSavedPopoverId === app.id && (
                            <div
                              data-popover-content="saved"
                              onClick={(e) => e.stopPropagation()}
                              className="absolute left-0 top-full mt-2 w-[300px] sm:w-[300px] rounded-2xl bg-white p-3.5 shadow-2xl border border-slate-200 z-50 text-left animate-in fade-in zoom-in-95 duration-150"
                            >
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5">
                                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                  Saved in Folders
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setActiveSavedPopoverId(null)}
                                  className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md cursor-pointer"
                                >
                                  <FiX className="h-3.5 w-3.5" />
                                </button>
                              </div>

                              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                {candFolders.length > 0 ? (
                                  candFolders.map((sf, idx) => (
                                    <div
                                      key={idx}
                                      className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-xs space-y-1 hover:bg-slate-100/70 transition-colors"
                                    >
                                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                                        <FiFolder className="h-3.5 w-3.5 text-[#0A66C2]" />
                                        <span>Folder Name:</span>
                                        <span className="text-[#0A66C2] font-bold">
                                          {sf.folder_name}
                                        </span>
                                      </div>
                                      <div className="text-[11.5px] text-slate-500">
                                        Saved by{' '}
                                        <span className="font-semibold text-slate-700">
                                          {sf.saved_by || 'Recruiter'}
                                        </span>{' '}
                                        on{' '}
                                        <span className="font-medium text-slate-700">
                                          {formatShortDate(sf.saved_at)}
                                        </span>
                                      </div>
                                      <div className="text-[11.5px] text-slate-500">
                                        Status -{' '}
                                        <span className="font-semibold text-slate-800">
                                          {getStageMeta(sf.stage || app.status).label}
                                        </span>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs text-center text-slate-500">
                                    <p className="mb-2 text-[12px]">Candidate is not saved in any folders yet.</p>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveSavedPopoverId(null);
                                        handleOpenFolderModalForCandidate(app);
                                      }}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0A66C2] text-white font-bold text-xs hover:bg-[#004182] transition-colors cursor-pointer"
                                    >
                                      <FiPlus className="h-3.5 w-3.5" />
                                      <span>Save to Folder</span>
                                    </button>
                                  </div>
                                )}
                              </div>

                              {candFolders.length > 0 && (
                                <div className="border-t border-slate-100 pt-2 mt-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveSavedPopoverId(null);
                                      handleOpenFolderModalForCandidate(app);
                                    }}
                                    className="w-full text-left px-2 py-1 text-xs font-bold text-[#0A66C2] hover:bg-blue-50 rounded-lg flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <FiPlus className="h-3.5 w-3.5" />
                                    <span>Save to Another Folder</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* "Stage: [Stage Name] v" Popover */}
                        <div className="relative" data-popover-wrapper="stage">
                          <button
                            type="button"
                            data-popover-trigger="stage"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveStagePopoverId(activeStagePopoverId === app.id ? null : app.id);
                              setActiveSavedPopoverId(null);
                              setActiveMoveDropdownId(null);
                            }}
                            style={{
                              color: currentStageMeta.color,
                              backgroundColor: currentStageMeta.bg,
                              borderColor: currentStageMeta.border
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs hover:opacity-90"
                          >
                            <span>Stage: {currentStageMeta.label}</span>
                            <FiChevronDown
                              className={`h-3 w-3 transition-transform duration-150 ${activeStagePopoverId === app.id ? 'rotate-180' : ''}`}
                            />
                          </button>

                          {activeStagePopoverId === app.id && (
                            <div
                              data-popover-content="stage"
                              onClick={(e) => e.stopPropagation()}
                              className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 w-64 rounded-2xl bg-white p-3.5 shadow-2xl border border-slate-200 z-50 text-left animate-in fade-in zoom-in-95 duration-150"
                            >
                              <div className="border-b border-slate-100 pb-2.5 mb-2.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-900">
                                    Stage : <span style={{ color: currentStageMeta.color }}>{currentStageMeta.label}</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setActiveStagePopoverId(null)}
                                    className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                                  >
                                    <FiX className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-1 mb-0">
                                  Applied on:{' '}
                                  <span className="font-semibold text-slate-700">
                                    {formatShortDate(app.applied_date)}
                                  </span>
                                </p>
                              </div>

                              <div className="space-y-1">
                                {STAGE_OPTIONS.map((st) => {
                                  const isCurrent = (app.status || 'applied').toLowerCase() === st.key;
                                  return (
                                    <button
                                      key={st.key}
                                      type="button"
                                      disabled={updatingStatusId === (app.applied_jobs_id || app.id)}
                                      onClick={() => {
                                        handleStageChange(app, st.key);
                                        setActiveStagePopoverId(null);
                                      }}
                                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${isCurrent
                                        ? 'bg-slate-100 text-slate-900 shadow-2xs'
                                        : 'hover:bg-slate-50 text-slate-700'
                                        }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span
                                          className="h-2.5 w-2.5 rounded-full"
                                          style={{ backgroundColor: st.color }}
                                        />
                                        <span style={{ color: st.color }}>{st.label}</span>
                                      </div>
                                      {isCurrent && <FiCheck className="h-3.5 w-3.5 text-slate-700 stroke-[3]" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: LinkedIn & Resume */}
                      <div className="flex items-center gap-2">
                        {app.linkedin_url && (
                          <a
                            href={app.linkedin_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-sky-700 hover:bg-sky-50 transition-colors shadow-2xs no-underline"
                          >
                            <FaLinkedin className="h-3.5 w-3.5 text-sky-600" />
                            <span>LinkedIn</span>
                          </a>
                        )}
                        {app.resume ? (
                          <button
                            type="button"
                            onClick={() => setResumeModalApplicant(app)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:text-[#0A66C2] hover:border-[#0A66C2] transition-colors shadow-2xs no-underline cursor-pointer"
                          >
                            <FiDownload className="h-3.5 w-3.5" />
                            <span>Resume</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No resume attached</span>
                        )}
                      </div>
                    </div>

                    {/* ── ROW 1: Key Metrics (Exp, Salary, Notice Period) ── */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
                      <div className="flex items-center gap-1.5">
                        <FiBriefcase className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-800">
                          {app.experienceDisplay || (app.total_years ? `${app.total_years} Yrs` : 'Fresher')}
                        </span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-slate-800">
                          {app.expected_salary || app.salary || '₹ 6 - 8 Lacs PA'}
                        </span>
                      </div>
                      <span>•</span>
                      <span className="rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-[11px] font-semibold">
                        {app.notice_period || '15 Days or less'}
                      </span>
                    </div>

                    {/* ── ROW 2: Current Designation & Company + Applied Role ── */}
                    <div className="text-xs text-slate-700 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <div>
                        <span className="font-semibold text-slate-900">
                          {app.job_title || app.designation || (app.isFresher ? 'Fresher' : 'Software Developer')}
                        </span>
                        {app.company_name && (
                          <>
                            {' '}at <span className="font-bold text-[#1e2238]">{app.company_name}</span>
                          </>
                        )}
                        <span className="text-slate-400 ml-1.5 font-medium">
                          {app.start_date
                            ? `(${formatDuration(app.start_date, app.end_date, app.currently_working)})`
                            : (app.total_years > 0 ? `(${app.total_years} yr${app.total_years > 1 ? 's' : ''}${app.total_months ? ` ${app.total_months} mos` : ''})` : '(1 yr 2 mos)')}
                        </span>
                      </div>
                      {app.role && (
                        <div className="text-slate-500">
                          • Applied role: <span className="font-semibold text-slate-900">{app.role}</span>
                        </div>
                      )}
                    </div>

                    {/* ── ROW 3: Key Skills ── */}
                    {candidateSkills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[11.5px] font-bold text-slate-500 mr-1">Key Skills:</span>
                        {skillsToDisplay.map((s, idx) => {
                          const isMatching = jobRequiredSkills.includes(s.toLowerCase());
                          return (
                            <span
                              key={idx}
                              className={`rounded-lg px-2 py-0.5 text-[11.5px] font-medium transition-colors ${isMatching
                                ? 'bg-blue-50 text-[#0A66C2] border border-blue-200/80 font-semibold'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                              {highlightKeywords(s, highlightWords)}
                            </span>
                          );
                        })}
                        {hasMoreSkills && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedSkillsMap((prev) => ({
                                ...prev,
                                [app.id]: !prev[app.id]
                              }))
                            }
                            className="rounded-lg bg-blue-50 text-[#0A66C2] px-2 py-0.5 text-[11px] font-bold hover:bg-blue-100 transition-colors cursor-pointer"
                          >
                            {areSkillsExpanded ? 'Show Less' : `+${candidateSkills.length - 5} More`}
                          </button>
                        )}
                      </div>
                    )}

                    {/* ── ROW 4: Education ── */}
                    {(app.course || app.education || app.college) && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <FiAward className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>
                          <span className="font-semibold text-slate-800">
                            {app.course || app.education || 'Graduate'}
                          </span>
                          {app.college && ` • ${app.college}`}
                          {app.end_date && ` (${String(app.end_date).slice(0, 4)})`}
                        </span>
                      </div>
                    )}

                    {/* ── ROW 5: Location ── */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <FiMapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{highlightKeywords(app.location || 'India', highlightWords)}</span>
                    </div>

                    {/* ── ROW 6: Screening Questionnaire Answers (Foundit Accordion) ── */}
                    {app.candidateAnswers?.length > 0 && (
                      <div className="pt-0.5">
                        <button
                          type="button"
                          onClick={() => setExpandedQuestionsMap((prev) => ({ ...prev, [app.id]: !prev[app.id] }))}
                          className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#0A66C2] hover:text-[#004182] cursor-pointer"
                        >
                          <HelpCircle size={13} />
                          <span>Screening Answers ({app.candidateAnswers.length})</span>
                          <FiChevronDown
                            className={`h-3 w-3 transition-transform duration-150 ${areQuestionsExpanded ? 'rotate-180' : ''}`}
                          />
                        </button>

                        {areQuestionsExpanded && (
                          <div className="mt-2 space-y-2 bg-slate-50/90 rounded-xl p-3 border border-slate-200/80 animate-in fade-in duration-150">
                            {app.candidateAnswers.map((qa, qIdx) => (
                              <div key={qIdx} className="text-[12px] mb-3">
                                <p className="font-bold text-slate-800 mb-0.5">Q: {qa.question}</p>
                                <p className="text-slate-600 pl-3 border-l-2 border-[#0A66C2] mt-0.5 mb-0">A: {qa.answer}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── ROW 7: Professional Summary ── */}
                    <div className="pt-0.5">
                      {app.about ? (
                        <div className="rounded-xl bg-slate-50/90 border border-slate-200/70 p-2.5 text-xs text-slate-700 leading-relaxed shadow-2xs">
                          <div className="flex items-start gap-2">
                            <FiFileText className="h-3.5 w-3.5 text-[#0A66C2] shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <span className="font-bold text-slate-900 mr-1.5 not-italic">Summary:</span>
                              <span className={`italic text-slate-600 ${isAboutExpanded ? '' : 'line-clamp-2'}`}>
                                &ldquo;{highlightKeywords(app.about, highlightWords)}&rdquo;
                              </span>
                              {app.about.length > 130 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedAboutMap((prev) => ({
                                      ...prev,
                                      [app.id]: !prev[app.id]
                                    }))
                                  }
                                  className="text-[#0A66C2] hover:text-[#004182] font-bold text-[11px] ml-1.5 hover:underline cursor-pointer inline-flex items-center gap-0.5 not-italic"
                                >
                                  <span>{isAboutExpanded ? 'Show less' : 'Show full summary'}</span>
                                  <FiChevronDown
                                    className={`h-3 w-3 inline transition-transform duration-150 ${isAboutExpanded ? 'rotate-180' : ''}`}
                                  />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl bg-slate-50/40 border border-dashed border-slate-200 px-2.5 py-1.5 text-[11.5px] text-slate-400 italic flex items-center gap-1.5">
                          <FiFileText className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>Candidate has not provided a summary statement</span>
                        </div>
                      )}
                    </div>

                    {/* ── BOTTOM ACTION BAR: View Number, Comment, Move to, Favourite, Quick Comms ── */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs">
                      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                        {/* View Number Button */}
                        <button
                          type="button"
                          onClick={() => toggleUnmaskPhone(app.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#0A66C2] hover:bg-blue-100 transition-colors cursor-pointer"
                        >
                          <FiPhone className="h-3.5 w-3.5" />
                          <span>
                            {isPhoneRevealed
                              ? (app.phone || app.rawPhone || 'Not Available')
                              : 'View Number'}
                          </span>
                        </button>

                        {/* Comment Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setContactModalApplicant(app);
                            setContactMessage('');
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <FiMessageSquare className="h-3.5 w-3.5" />
                          <span>Comment</span>
                        </button>

                        {/* Move to Dropdown */}
                        <div className="relative" data-popover-wrapper="move">
                          <button
                            type="button"
                            data-popover-trigger="move"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMoveDropdownId(activeMoveDropdownId === app.id ? null : app.id);
                              setActiveSavedPopoverId(null);
                              setActiveStagePopoverId(null);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <FiFolder className="h-3.5 w-3.5" />
                            <span>Move to</span>
                            <FiChevronDown
                              className={`h-3 w-3 transition-transform duration-150 ${activeMoveDropdownId === app.id ? 'rotate-180' : ''}`}
                            />
                          </button>

                          {activeMoveDropdownId === app.id && (
                            <div
                              data-popover-content="move"
                              onClick={(e) => e.stopPropagation()}
                              className="absolute left-0 bottom-full mb-1.5 w-56 rounded-xl bg-white p-2 shadow-2xl border border-slate-200 z-50 text-left animate-in fade-in zoom-in-95 duration-150"
                            >
                              <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                Select Destination Folder
                              </div>
                              <div className="max-h-48 overflow-y-auto space-y-0.5">
                                {foldersList && foldersList.length > 0 ? (
                                  foldersList.map((f) => (
                                    <button
                                      key={f.id}
                                      type="button"
                                      onClick={() => {
                                        handleQuickMoveToFolder(app, f.id);
                                        setActiveMoveDropdownId(null);
                                      }}
                                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-[#0A66C2] flex items-center justify-between gap-1.5 truncate cursor-pointer transition-colors"
                                    >
                                      <div className="flex items-center gap-1.5 truncate">
                                        <FiFolder className="h-3.5 w-3.5 shrink-0 text-[#0A66C2]" />
                                        <span className="truncate">{f.name}</span>
                                      </div>
                                      {f.candidate_count !== undefined && (
                                        <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                                          ({f.candidate_count})
                                        </span>
                                      )}
                                    </button>
                                  ))
                                ) : (
                                  <p className="px-2 py-2 text-xs text-slate-400 italic text-center">No folders found</p>
                                )}
                              </div>
                              <div className="border-t border-slate-100 pt-1.5 mt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMoveDropdownId(null);
                                    handleOpenFolderModalForCandidate(app);
                                  }}
                                  className="w-full text-left px-2.5 py-1 text-xs font-bold text-[#0A66C2] hover:bg-blue-50 rounded-lg flex items-center gap-1.5 cursor-pointer"
                                >
                                  <FiPlus className="h-3.5 w-3.5" />
                                  <span>Create New Folder</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Quick Comms (Email, WhatsApp, SMS) */}
                      <div className="flex items-center gap-2">
                        {app.email && (
                          <button
                            type="button"
                            onClick={() => {
                              setContactModalApplicant(app);
                              setContactMessage(`Hello ${app.name},\n\nWe reviewed your application for the ${app.role} role at ${jobData?.company_name || 'Careerfast'} and would like to discuss next steps.\n\nBest regards,\n${jobData?.recruiter_name || 'Recruitment Team'}`);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#0A66C2] hover:bg-blue-100 transition-colors cursor-pointer"
                            title={`Email ${app.email}`}
                          >
                            <FiMail className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {app.rawPhone && (
                          <a
                            href={`https://wa.me/${app.rawPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${app.name}, this is regarding your application for ${app.role} on Careerfast.`)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                            title="Chat on WhatsApp"
                          >
                            <FaWhatsapp className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {app.rawPhone && (
                          <button
                            type="button"
                            onClick={() => {
                              setContactModalApplicant(app);
                              setContactMessage(`Hello ${app.name}, this is regarding your application.`);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
                            title="Send Message"
                          >
                            <FiMessageSquare className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              /* EMPTY STATE */
              <div className="bg-white rounded-2xl border border-slate-200/90 p-16 text-center shadow-2xs">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#0A66C2] flex items-center justify-center mx-auto mb-4 border border-blue-100">
                  <UsersIcon size={32} />
                </div>
                <h3 className="text-[18px] font-bold text-slate-900">No applicants match your current filters</h3>
                <p className="text-[13px] text-slate-500 max-w-md mx-auto mt-1.5">
                  Try adjusting or clearing some of your sidebar filters, or reset the sub-pills to see all registered candidates for this job post.
                </p>
                <div className="mt-5 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleClearAllFilters}
                    className="px-4 py-2 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-xl text-[13px] font-semibold transition-all shadow-sm cursor-pointer"
                  >
                    Clear All Filters
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push(`/recruiter/candidate-search`)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[13px] font-semibold transition-all cursor-pointer"
                  >
                    Search Candidates Database
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ──────────────────────────────────────────────────────────────────────────
              BOTTOM PAGINATION BAR
          ────────────────────────────────────────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="bg-white rounded-2xl border border-slate-200/90 px-5 py-3 flex items-center justify-between shadow-2xs text-[13px]">
              <span className="text-slate-500">
                Showing <strong className="text-slate-800 font-bold">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
                <strong className="text-slate-800 font-bold">{Math.min(currentPage * pageSize, sortedApplicants.length)}</strong> of{' '}
                <strong className="text-slate-800 font-bold">{sortedApplicants.length}</strong> applicants
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium cursor-pointer"
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((p, idx, arr) => (
                    <React.Fragment key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="px-1 text-slate-400">...</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(p)}
                        className={`w-8 h-8 rounded-xl font-bold text-[12px] transition-all cursor-pointer ${currentPage === p
                          ? 'bg-[#0A66C2] text-white shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
                          }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  ))}

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          MODAL: RESUME PREVIEW & DOWNLOAD
      ────────────────────────────────────────────────────────────────────────── */}
      {resumeModalApplicant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0A66C2] flex items-center justify-center font-bold">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-[17px] font-bold text-slate-900 mb-0">
                    {resumeModalApplicant.name}&apos;s Resume
                  </h3>
                  <p className="text-[12px] text-slate-400 mb-0">
                    Applied for {resumeModalApplicant.role} • {resumeModalApplicant.location}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {resumeModalApplicant.resume && (
                  <button
                    type="button"
                    onClick={() => downloadResumeFile(resumeModalApplicant.resume, resumeModalApplicant.name)}
                    className="flex items-center gap-1.5 text-[13px] font-semibold !text-white hover:!text-white bg-[#0A66C2] hover:bg-[#004182] px-3.5 py-1.5 rounded-xl transition-all shadow-2xs cursor-pointer"
                  >
                    <Download size={14} />
                    <span className="!text-white">Download PDF</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setResumeModalApplicant(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              {resumeModalApplicant.resume ? (
                <div className="h-[600px] w-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-inner">
                  <iframe
                    src={`${resumeModalApplicant.resume}#toolbar=1`}
                    title="Candidate Resume"
                    className="w-full h-full border-0"
                  />
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                  <FileText size={40} className="text-slate-300 mx-auto mb-3" />
                  <h4 className="text-[16px] font-bold text-slate-800">No Resume File Uploaded</h4>
                  <p className="text-[13px] text-slate-500 mt-1 max-w-sm mx-auto">
                    This candidate did not attach a PDF resume. Review their candidate profile details and skills below.
                  </p>
                  <div className="mt-6 text-left max-w-2xl mx-auto bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-[13px]">
                    <p><strong>Name:</strong> {resumeModalApplicant.name}</p>
                    <p><strong>Email:</strong> {resumeModalApplicant.email}</p>
                    <p><strong>Phone:</strong> {resumeModalApplicant.phone}</p>
                    <p><strong>Experience:</strong> {resumeModalApplicant.experienceDisplay}</p>
                    <p><strong>Skills:</strong> {resumeModalApplicant.skills.join(', ')}</p>
                    <p><strong>About:</strong> {resumeModalApplicant.about || 'N/A'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          MODAL: CONTACT CANDIDATE
      ────────────────────────────────────────────────────────────────────────── */}
      {contactModalApplicant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0A66C2] flex items-center justify-center font-bold">
                  <Mail size={18} />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-slate-900">
                    Email {contactModalApplicant.name}
                  </h3>
                  <p className="text-[12px] text-slate-400 mb-0">
                    To: {contactModalApplicant.email || 'No email provided'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setContactModalApplicant(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1.5">Message</label>
                <textarea
                  rows={6}
                  value={contactMessage}
                  onChange={e => setContactMessage(e.target.value)}
                  placeholder="Write your email or message..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-800 focus:outline-none focus:border-[#0A66C2] focus:bg-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setContactModalApplicant(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-[13px] font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (contactModalApplicant.email) {
                      window.location.href = `mailto:${contactModalApplicant.email}?subject=${encodeURIComponent(`Update on your application for ${contactModalApplicant.role}`)}&body=${encodeURIComponent(contactMessage)}`;
                      CommonToaster('Opening your email client...', 'success');
                      setContactModalApplicant(null);
                    } else {
                      CommonToaster('Candidate email not available', 'error');
                    }
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0A66C2] hover:bg-[#004182] text-white text-[13px] font-semibold shadow-sm cursor-pointer"
                >
                  <Send size={14} />
                  <span>Send Email</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save to Folder Modal */}
      {folderModalOpen && (
        <div
          onClick={() => setFolderModalOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-[500px] w-full border border-slate-200/90 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0A66C2] flex items-center justify-center">
                  <FolderPlus size={20} />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-slate-900 leading-tight mb-0">
                    Save Candidate to Folder
                  </h3>
                  <p className="text-[12px] text-slate-500 mt-0.5 mb-0">
                    {folderTargetCandidates.length === 1
                      ? `Choose an existing folder for ${folderTargetCandidates[0]?.name || 'candidate'}`
                      : `Choose an existing folder for ${folderTargetCandidates.length} selected candidates`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFolderModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Search or Create Folder Input */}
              <div className="space-y-1.5">
                <label className="block text-[12.5px] font-bold text-slate-700">
                  Select or Search Folder <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search existing folder or type new folder..."
                    value={folderSearchInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFolderSearchInput(val);
                      const exact = foldersList.find(
                        f => f.name.toLowerCase() === val.trim().toLowerCase()
                      );
                      setSelectedFolder(exact || (val.trim() ? { name: val.trim(), isNew: true } : null));
                    }}
                    className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/15 transition-all"
                  />
                  {folderSearchInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setFolderSearchInput('');
                        setSelectedFolder(null);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Dynamic Existing Folders List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[12px] font-semibold text-slate-500">
                  <span>Existing Folders ({filteredExistingFolders.length})</span>
                  {folderLoading && (
                    <span className="flex items-center gap-1 text-[#0A66C2]">
                      <RefreshCw size={12} className="animate-spin" /> Loading...
                    </span>
                  )}
                </div>

                {folderLoading ? (
                  <div className="py-8 text-center text-slate-400 text-[13px] flex flex-col items-center gap-2">
                    <RefreshCw size={20} className="animate-spin text-[#0A66C2]" />
                    <span>Fetching your existing folders...</span>
                  </div>
                ) : filteredExistingFolders.length > 0 ? (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {filteredExistingFolders.map((f) => {
                      const isSelected = selectedFolder?.id === f.id;
                      const isAlreadyInThisFolder = isCandidateInFolder(f);
                      const targetCandName = folderTargetCandidates[0]?.name || 'Candidate';

                      return (
                        <div
                          key={f.id}
                          onClick={() => {
                            setSelectedFolder(f);
                            setFolderSearchInput(f.name);
                            if (isAlreadyInThisFolder) {
                              CommonToaster(`Candidate "${targetCandName}" is already in "${f.name}"! Duplicate addition is restricted.`, 'warning');
                            }
                          }}
                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${isSelected
                            ? isAlreadyInThisFolder
                              ? 'border-amber-400 bg-amber-50/70 ring-2 ring-amber-400/30 shadow-xs'
                              : 'border-[#0A66C2] bg-blue-50/70 ring-2 ring-[#0A66C2]/20 shadow-xs'
                            : isAlreadyInThisFolder
                              ? 'border-amber-200/90 bg-amber-50/30 hover:bg-amber-50/60'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 bg-white'
                            }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isSelected
                                ? isAlreadyInThisFolder
                                  ? 'bg-amber-500 text-white shadow-2xs'
                                  : 'bg-[#0A66C2] text-white shadow-2xs'
                                : isAlreadyInThisFolder
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-blue-50 text-[#0A66C2]'
                                }`}
                            >
                              <Folder size={15} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className={`text-[13.5px] mb-0 font-bold truncate ${isSelected ? (isAlreadyInThisFolder ? 'text-amber-950' : 'text-blue-950') : 'text-slate-800'
                                  }`}>
                                  {f.name}
                                </p>
                                {isAlreadyInThisFolder && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300/80 shrink-0 inline-flex items-center gap-1">
                                    <span>Already in folder</span>
                                  </span>
                                )}
                              </div>
                              {f.linked_job_title && (
                                <p className="text-[11px] text-slate-400 truncate">
                                  Linked: {f.linked_job_title}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              {f.candidate_count || 0} candidate{f.candidate_count === 1 ? '' : 's'}
                            </span>
                            <div
                              className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected
                                ? isAlreadyInThisFolder
                                  ? 'border-amber-500 bg-amber-500 text-white'
                                  : 'border-[#0A66C2] bg-[#0A66C2] text-white'
                                : 'border-slate-300 bg-white'
                                }`}
                            >
                              {isSelected && <Check size={12} strokeWidth={3} />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
                    <p className="text-[12.5px] text-slate-500">
                      {folderSearchInput.trim()
                        ? `No existing folder named "${folderSearchInput}"`
                        : "You don't have any folders created yet."}
                    </p>
                    {folderSearchInput.trim() && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFolder({ name: folderSearchInput.trim(), isNew: true });
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#0A66C2] text-[12px] font-bold rounded-lg cursor-pointer transition-colors"
                      >
                        <Plus size={13} />
                        <span>Create folder "{folderSearchInput.trim()}" and save</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Warning notice if selected folder already has this candidate */}
                {folderTargetCandidates.length === 1 && selectedFolder && isCandidateInFolder(selectedFolder) && (
                  <div className="p-3 bg-amber-50 border border-amber-200/90 rounded-xl flex items-center gap-2.5 text-amber-900 text-[12.5px] animate-in fade-in duration-150">
                    <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <AlertTriangle size={14} />
                    </div>
                    <div className="flex-1 leading-snug">
                      <span className="font-bold">{folderTargetCandidates[0]?.name || 'Candidate'}</span> is already saved in folder <span className="font-bold">"{selectedFolder.name}"</span>. Duplicate addition is restricted.
                    </div>
                  </div>
                )}

                {/* Quick Add New Folder Button/Form */}
                {!folderSearchInput.trim() && filteredExistingFolders.length > 0 && (
                  <div className="pt-3 mt-3 border-t border-slate-100">
                    {!showNewFolderInput ? (
                      <button
                        type="button"
                        onClick={() => setShowNewFolderInput(true)}
                        className="text-[12.5px] font-bold text-[#0A66C2] hover:text-[#004182] flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>Create a new folder</span>
                      </button>
                    ) : (
                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          placeholder="Type new folder name..."
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          className="flex-1 text-[13px] px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const trimmed = newFolderName.trim();
                            if (!trimmed) {
                              CommonToaster('Please enter a folder name', 'warning');
                              return;
                            }
                            setSelectedFolder({ name: trimmed, isNew: true });
                            setFolderSearchInput(trimmed);
                            setShowNewFolderInput(false);
                          }}
                          className="px-3.5 py-1 text-[12px] font-medium bg-[#0A66C2] hover:bg-[#004182] text-white rounded-xl cursor-pointer transition-colors"
                        >
                          Select
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowNewFolderInput(false);
                            setNewFolderName('');
                          }}
                          className="px-2 text-slate-400 hover:text-slate-600 text-[12px] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div>
                {folderTargetCandidates.length === 1 && savedCandidateIds.includes(folderTargetCandidates[0]?.id) && (
                  <button
                    type="button"
                    onClick={() => handleRemoveFromSaved(folderTargetCandidates[0]?.id)}
                    className="text-[12px] font-semibold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                  >
                    Remove from Saved
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setFolderModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-200/60 rounded-xl text-[13px] font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>

                {(() => {
                  const isSelectedDuplicate = folderTargetCandidates.length === 1 && selectedFolder && isCandidateInFolder(selectedFolder);
                  const isSaveDisabled = savingToFolder || (!selectedFolder && !folderSearchInput.trim() && !newFolderName.trim()) || isSelectedDuplicate;

                  return (
                    <button
                      type="button"
                      disabled={isSaveDisabled}
                      onClick={handleSaveToFolder}
                      className={`px-5 py-2 rounded-xl text-[13px] font-semibold shadow-sm transition-all flex items-center gap-2 ${isSaveDisabled
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-[#0A66C2] hover:bg-[#004182] text-white cursor-pointer active:scale-98'
                        }`}
                    >
                      {savingToFolder ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : isSelectedDuplicate ? (
                        <>
                          <AlertTriangle size={14} className="text-amber-500" />
                          <span>Already in Folder</span>
                        </>
                      ) : (
                        <>
                          <Bookmark size={14} className="fill-white" />
                          <span>
                            Save to {selectedFolder?.name || folderSearchInput.trim() || newFolderName.trim() || 'Folder'}
                          </span>
                        </>
                      )}
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
