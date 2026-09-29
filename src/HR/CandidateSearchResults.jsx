'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search, X, MapPin, Briefcase, ChevronDown, Phone, Mail,
  MessageSquare, FileText, Bookmark, Link as LinkIcon, Download, Users as UsersIcon, Send,
  SlidersHorizontal, CheckCircle2, ArrowRight, ArrowLeft, MoreVertical,
  Star, Check, Folder, Heart, Plus, Layers, GraduationCap, Sparkles, Copy, Clock, ExternalLink,
  Calendar, LayoutGrid, List, Crown, Lock, Loader2
} from 'lucide-react';
import {
  searchCandidatesAPI, getCandidateFilterOptionsAPI,
  saveCandidateHR, removeSavedCandidateHR, getSavedCandidatesHR,
  getCandidateFoldersAPI, addCandidatesToFolderAPI, updateFolderCandidateStageAPI,
  saveHrSearch, getMySubscription, consumeResumeViewAPI, consumeResumeDownloadAPI,
  sendCandidateEmailAPI
} from '../ApiService/action';

import { CommonToaster } from '../Common/CommonToaster';
import CommonLoader from '../Common/CommonLoader';
import { getImageUrl } from '../utils/getImageUrl';
import { downloadResumeFile, viewResumeFile } from '../utils/downloadResume';
import CandidateFilterSidebar from './CandidateFilterSidebar';

// Helper to escape regex special characters
const escapeRegExp = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Helper to highlight matching keywords with yellow highlight
const highlightKeywords = (text, keywordList = []) => {
  if (!text || typeof text !== 'string') return text;
  if (!keywordList || keywordList.length === 0) return text;

  const validTokens = keywordList
    .map(t => (typeof t === 'string' ? t.trim() : ''))
    .filter(t => t.length > 0);

  if (validTokens.length === 0) return text;

  const sortedTokens = Array.from(new Set(validTokens)).sort((a, b) => b.length - a.length);

  try {
    const pattern = sortedTokens.map(escapeRegExp).join('|');
    const regex = new RegExp(`(${pattern})`, 'gi');
    const parts = text.split(regex);

    if (parts.length <= 1) return text;

    const tokenLookup = new Set(sortedTokens.map(t => t.toLowerCase()));

    return parts.map((part, idx) => {
      if (tokenLookup.has(part.toLowerCase())) {
        return (
          <mark
            key={idx}
            className="bg-yellow-200 text-slate-900 font-semibold px-0.5 py-0.5 rounded-xs not-italic"
            style={{
              backgroundColor: '#fef08a',
              color: '#0f172a',
              padding: '1px 3px',
              borderRadius: '3px',
              fontWeight: 600,
              boxDecorationBreak: 'clone',
              WebkitBoxDecorationBreak: 'clone'
            }}
          >
            {part}
          </mark>
        );
      }
      return part;
    });
  } catch (err) {
    return text;
  }
};

// Helper to parse, flatten, and separate all comma-separated skills into clean individual tags
export const parseSkillsList = (rawSkills) => {
  if (!rawSkills) return [];
  let list = [];
  if (Array.isArray(rawSkills)) {
    list = rawSkills.flatMap(s => (typeof s === 'string' && s.includes(',')) ? s.split(',') : s);
  } else if (typeof rawSkills === 'string') {
    try {
      const parsed = JSON.parse(rawSkills);
      if (Array.isArray(parsed)) {
        list = parsed.flatMap(s => (typeof s === 'string' && s.includes(',')) ? s.split(',') : s);
      } else {
        list = String(rawSkills).split(',');
      }
    } catch {
      list = rawSkills.split(',');
    }
  }
  return Array.from(new Set(
    list
      .map(s => String(s || '').replace(/[\[\]'"]+/g, '').trim())
      .filter(Boolean)
  ));
};

// Helper to generate page numbers with ellipsis
const getPageNumbers = (currentPage, totalPages) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages = [];
  pages.push(1);

  if (currentPage > 3) {
    pages.push('...');
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (currentPage < totalPages - 2) {
    pages.push('...');
  }

  pages.push(totalPages);
  return pages;
};

// Stage options and metadata matching Manage-Folder & Applicants
const STAGE_OPTIONS = [
  { key: 'prospect', label: 'Prospect', color: '#0A66C2', bg: '#eff6ff', border: '#bfdbfe' },
  { key: 'applied', label: 'Job Applicant', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  { key: 'shortlisted', label: 'Shortlisted', color: '#b45309', bg: '#fef3c7', border: '#fde68a' },
  { key: 'interviewed', label: 'Interviewed', color: '#0284c7', bg: '#e0f2fe', border: '#bae6fd' },
  { key: 'hired', label: 'Hired', color: '#047857', bg: '#ecfdf5', border: '#a7f3d0' },
  { key: 'rejected', label: 'Rejected', color: '#be123c', bg: '#fff1f2', border: '#fecdd3' },
];

const getStageMeta = (stageKey) => {
  let key = (stageKey || 'prospect').toLowerCase().trim();
  if (key === 'applicant' || key === 'job applicant') key = 'applied';
  if (key === 'selected') key = 'hired';
  return (
    STAGE_OPTIONS.find((s) => s.key === key) || {
      key,
      label: stageKey ? stageKey.charAt(0).toUpperCase() + stageKey.slice(1) : 'Prospect',
      color: '#047857',
      bg: '#ecfdf5',
      border: '#a7f3d0'
    }
  );
};

const formatShortDate = (dateStr) => {
  if (!dateStr) return '10 Sept 2026';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const day = d.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch (_) {
    return String(dateStr);
  }
};

const CandidateSearchResults = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Parse initial URL query parameters
  const getArrayParam = (key) => {
    const val = searchParams.get(key);
    if (!val) return [];
    return val.split(',').map(s => s.trim()).filter(Boolean);
  };

  const initialKeywords = searchParams.get('keywords') || searchParams.get('search') || '';
  const initialLocation = getArrayParam('location');
  const initialNoticePeriod = getArrayParam('noticePeriod');
  const initialGender = getArrayParam('gender');
  const initialEducation = Array.from(new Set([
    ...getArrayParam('education'),
    ...getArrayParam('specificUG'),
    ...getArrayParam('specificPG'),
    ...getArrayParam('doctorateQualification'),
    ...(searchParams.get('ugQualification') && searchParams.get('ugQualification') !== 'No UG' ? [searchParams.get('ugQualification')] : []),
    ...(searchParams.get('pgQualification') && searchParams.get('pgQualification') !== 'No PG' ? [searchParams.get('pgQualification')] : [])
  ]));
  const initialCompany = getArrayParam('company');
  const initialSkills = getArrayParam('skills');
  const initialExpMin = searchParams.get('expMin') || '';
  const initialExpMax = searchParams.get('expMax') || '';
  const initialSalaryMin = searchParams.get('salaryMin') || '';
  const initialSalaryMax = searchParams.get('salaryMax') || '';
  const initialActiveUpdated = searchParams.get('activeUpdated') || 'All time';
  const initialSortBy = searchParams.get('sortBy') || 'Relevance';
  const initialKeywordMatch = searchParams.get('keywordMatch') || 'any';

  // Active Filters State
  const [filters, setFilters] = useState({
    keywords: initialKeywords,
    keywordMatch: initialKeywordMatch,
    keywordWithinResults: '',
    location: initialLocation,
    noticePeriod: initialNoticePeriod,
    gender: initialGender,
    education: initialEducation,
    ugQualification: searchParams.get('ugQualification') || '',
    courses: getArrayParam('courses'),
    institutes: getArrayParam('institutes'),
    passingYearFrom: searchParams.get('passingYearFrom') || '',
    passingYearTo: searchParams.get('passingYearTo') || '',
    pgQualification: searchParams.get('pgQualification') || '',
    doctorateQualification: searchParams.get('doctorateQualification') || '',
    company: initialCompany,
    skills: initialSkills,
    experienceMin: initialExpMin,
    experienceMax: initialExpMax,
    salaryMin: initialSalaryMin,
    salaryMax: initialSalaryMax,
    salaryNotMentioned: searchParams.get('salaryNotMentioned') !== null ? searchParams.get('salaryNotMentioned') === 'true' : true,
    salaryThousandMin: searchParams.get('salaryThousandMin') || '',
    salaryThousandMax: searchParams.get('salaryThousandMax') || '',
    activeUpdated: initialActiveUpdated,
    candidateStatus: searchParams.get('candidateStatus') || 'Active / Updated',
    timePeriod: searchParams.get('timePeriod') || 'In last 12 months',
    industry: getArrayParam('industry'),
    designation: getArrayParam('designation'),
    smartInsights: getArrayParam('smartInsights'),
    differentlyAbled: getArrayParam('differentlyAbled'),
    languages: getArrayParam('languages'),
    companyHeadcount: getArrayParam('companyHeadcount'),
    visaStatus: getArrayParam('visaStatus'),
    hideProfiles: getArrayParam('hideProfiles'),
    showOnly: getArrayParam('showOnly'),
    jobType: getArrayParam('jobType'),
    companyFunding: getArrayParam('companyFunding'),
    ageMin: searchParams.get('ageMin') || '',
    ageMax: searchParams.get('ageMax') || '',
    excludeSynonyms: searchParams.get('excludeSynonyms') === 'true',
    includeRelocating: searchParams.get('includeRelocating') === 'true',
    preferredLocations: getArrayParam('preferredLocations'),
    expMonthsMin: searchParams.get('expMonthsMin') || '',
    expMonthsMax: searchParams.get('expMonthsMax') || '',
    page: 1,
    limit: parseInt(searchParams.get('limit'), 10) || 40,
    sortBy: initialSortBy
  });

  // Local Search Input state for debouncing
  const [searchInput, setSearchInput] = useState(initialKeywords);

  // Candidates & Pagination State
  const [candidates, setCandidates] = useState([]);
  const [totalCandidates, setTotalCandidates] = useState(0);
  const [totalAllEmployees, setTotalAllEmployees] = useState(0);
  const [totalActiveEmployees, setTotalActiveEmployees] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Available Filter Options from Backend
  const [filterOptions, setFilterOptions] = useState({
    locations: ['Chennai', 'Bengaluru', 'Hyderabad', 'Mumbai', 'Delhi NCR', 'Pune', 'Noida', 'Kolkata', 'Remote', 'Gurgaon', 'Ahmedabad'],
    skills: ['React', 'Node.js', 'Python', 'SQL', 'JavaScript', 'HTML5', 'CSS3', 'MongoDB', 'AWS', 'TypeScript', 'Java'],
    jobTitles: ['Software Developer', 'Frontend Developer', 'Technical Support', 'Associate', 'Fullstack Engineer'],
    companies: ['ACTE Technologies', 'Markerz Global', 'Learnovita', 'TCS', 'Infosys', 'Wipro', 'Accenture', 'Cognizant', 'HCLTech', 'Amazon'],
    industries: ['IT Services & Consulting', 'Software Product', 'Financial Services', 'Banking', 'Healthcare & Life Sciences', 'Education / EdTech', 'Manufacturing', 'Recruitment / Staffing', 'Internet / E-Commerce', 'Telecom'],
    designations: ['Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Team Lead', 'Engineering Manager', 'Product Manager', 'QA Engineer', 'DevOps Engineer', 'Data Scientist'],
    courses: ['B.Tech / B.E.', 'B.Sc', 'BCA', 'B.Com', 'M.Tech / M.E.', 'MBA / PGDM', 'MCA', 'Doctorate / Ph.D', 'Any UG', 'Any PG'],
    genders: ['Male', 'Female', 'Other'],
    noticePeriods: ['Any', '15 Days or less', '1 Month', '2 Months', '3 Months', 'More than 3 Months', 'Serving notice period'],
    smartInsights: ['Premium Institutes (IIT/IIM/NIT)', 'Top Tier Companies', 'High Performer / Star Candidate', 'Recently Promoted', 'Active in Last 7 Days', 'Verified Phone & Email'],
    differentlyAbled: ['Locomotor Disability', 'Visual Impairment', 'Hearing Impairment', 'Speech and Language Disability', 'Intellectual Disability', 'Any Disability'],
    languages: ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Marathi', 'Bengali', 'Gujarati', 'French', 'German'],
    companyHeadcounts: ['1-10 employees', '11-50 employees', '51-200 employees', '201-500 employees', '501-1,000 employees', '1,001-5,000 employees', '5,001-10,000 employees', '10,000+ employees'],
    visaStatuses: ['Citizen / Permanent Resident', 'Work Permit / H1B', 'Student Visa (OPT/CPT)', 'Requires Sponsorship', 'Not Specified'],
    hideProfiles: ['Already viewed profiles', 'Already contacted / emailed', 'Saved to any project / folder', 'Profiles with incomplete resumes', 'Inactive for > 6 months'],
    showOnly: ['Verified Mobile Number', 'Verified Email Address', 'Resume Available to Download', 'Immediate Joiners', 'Open to Remote Work'],
    jobTypes: ['Permanent / Full Time', 'Contract / C2H', 'Freelance / Consultant', 'Internship', 'Work from Home / Remote'],
    companyFundings: ['Seed / Angel', 'Series A', 'Series B', 'Series C+', 'Public Listed', 'Bootstrapped / Profitable']
  });

  // Accordion Expand/Collapse States (19 Categories matching sidebar screenshot)
  const [openAccordions, setOpenAccordions] = useState({
    location: false,
    experience: false,
    noticePeriod: false,
    salary: false,
    gender: false,
    education: false,
    industry: false,
    company: false,
    designation: false,
    smartInsights: false,
    differentlyAbled: false,
    languages: false,
    companyHeadcount: false,
    visaStatus: false,
    hideProfiles: false,
    showOnly: false,
    jobType: false,
    companyFunding: false,
    age: false
  });

  // Local Search within Accordion Options
  const [locSearch, setLocSearch] = useState('');
  const [skillSearch, setSkillSearch] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [eduSearch, setEduSearch] = useState('');
  const [indSearch, setIndSearch] = useState('');
  const [desigSearch, setDesigSearch] = useState('');
  const [langSearch, setLangSearch] = useState('');

  // Interactive UI States
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [unmaskedPhones, setUnmaskedPhones] = useState({});
  const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);
  const [savedCandidateIds, setSavedCandidateIds] = useState([]);
  const [resumeModalCandidate, setResumeModalCandidate] = useState(null);
  const [previewImageModal, setPreviewImageModal] = useState(null);
  const [contactModal, setContactModal] = useState(null);
  const [contactMessage, setContactMessage] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [saveSearchModal, setSaveSearchModal] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');
  // Folder Modal States
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [folderSearchInput, setFolderSearchInput] = useState('');
  const [foldersList, setFoldersList] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [folderLoading, setFolderLoading] = useState(false);
  const [candidateCountLimit, setCandidateCountLimit] = useState(3);
  const [showFolderDropdown, setShowFolderDropdown] = useState(false);
  const [expandedSkillsMap, setExpandedSkillsMap] = useState({});
  const [expandedAboutMap, setExpandedAboutMap] = useState({});
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [comparedCandidates, setComparedCandidates] = useState([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  // Saved in Folders Popover state
  const [activeSavedPopoverId, setActiveSavedPopoverId] = useState(null);
  const [activeStagePopoverId, setActiveStagePopoverId] = useState(null);

  // Subscription Quota State
  const [subscription, setSubscription] = useState(null);
  const [unlockedCandidateIds, setUnlockedCandidateIds] = useState(new Set());
  const [downloadedCandidateIds, setDownloadedCandidateIds] = useState(new Set());
  const [quotaLimitModal, setQuotaLimitModal] = useState(null);

  const planTitle = subscription?.plan?.name || subscription?.plan_name || 'Basic';
  const resumeViewLimit = subscription?.limits?.resume_view_limit ?? subscription?.limits?.resume_views_limit ?? 50;
  const resumeViewsUsed = subscription?.usage?.resume_views_used ?? 0;
  const resumeViewsRemaining = subscription?.usage?.resume_views_remaining ?? Math.max(0, resumeViewLimit - resumeViewsUsed);

  const resumeDownloadLimit = subscription?.limits?.resume_download_limit ?? subscription?.limits?.resume_downloads_limit ?? 10;
  const resumeDownloadsUsed = subscription?.usage?.resume_downloads_used ?? 0;
  const resumeDownloadsRemaining = subscription?.usage?.resume_downloads_remaining ?? Math.max(0, resumeDownloadLimit - resumeDownloadsUsed);

  // Candidate Contact privilege from subscription plan / features
  const canContactCandidates = useMemo(() => {
    if (!subscription) return true;
    if (subscription?.permissions?.candidate_contact !== undefined) {
      return Boolean(subscription.permissions.candidate_contact);
    }
    if (subscription?.features?.candidate_contact !== undefined) {
      return Boolean(subscription.features.candidate_contact);
    }
    if (subscription?.candidate_contact !== undefined) {
      return Boolean(subscription.candidate_contact);
    }
    return true;
  }, [subscription]);

  const triggerLockedContactModal = (channelName = 'messages') => {
    setQuotaLimitModal({
      type: 'contact',
      title: 'Direct Messaging Restricted',
      message: `Sending direct ${channelName} to candidates is not included in your ${planTitle} Plan. Upgrade your subscription plan to send direct Emails and WhatsApp messages.`
    });
  };

  const fetchSubscriptionData = async () => {
    try {
      const res = await getMySubscription();
      if (res && res.success && res.data) {
        setSubscription(res.data);
        if (Array.isArray(res.data.viewed_candidate_ids)) {
          setUnlockedCandidateIds(new Set(res.data.viewed_candidate_ids.map(Number)));
        }
        if (Array.isArray(res.data.downloaded_candidate_ids)) {
          setDownloadedCandidateIds(new Set(res.data.downloaded_candidate_ids.map(Number)));
        }
      }
    } catch (err) {
      console.warn("Could not fetch recruiter subscription:", err?.message);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const handleOpenCandidateProfile = async (candidate) => {
    if (!candidate || !candidate.id) {
      setResumeModalCandidate(candidate);
      return;
    }

    const candId = Number(candidate.id);

    // If already unlocked in active subscription, open directly
    if (unlockedCandidateIds.has(candId)) {
      setResumeModalCandidate(candidate);
      return;
    }

    // Check if views limit reached
    if (subscription && resumeViewsRemaining <= 0) {
      setQuotaLimitModal({
        type: 'view',
        title: 'Resume View Limit Reached',
        message: `You have used all ${resumeViewLimit} candidate resume views included in your ${planTitle} Plan. Please upgrade your subscription plan to unlock and view more candidates.`
      });
      return;
    }

    try {
      const res = await consumeResumeViewAPI(candId);
      if (res && res.success) {
        if (!res.already_unlocked) {
          setUnlockedCandidateIds(prev => new Set(prev).add(candId));
          setSubscription(prev => {
            if (!prev) return prev;
            const updatedUsed = (prev.usage?.resume_views_used || 0) + 1;
            const updatedRem = Math.max(0, (prev.limits?.resume_view_limit || resumeViewLimit) - updatedUsed);
            return {
              ...prev,
              usage: {
                ...prev.usage,
                resume_views_used: updatedUsed,
                resume_views_remaining: updatedRem
              }
            };
          });
          const leftCount = res.remaining !== undefined ? res.remaining : Math.max(0, resumeViewsRemaining - 1);
          CommonToaster(`Candidate profile unlocked! (${leftCount} views remaining)`, 'success');
        }
        setResumeModalCandidate(candidate);
      }
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.limit_reached) {
        setQuotaLimitModal({
          type: 'view',
          title: err.response.data.message || 'Resume View Limit Reached',
          message: err.response.data.details || `You have reached your limit of ${resumeViewLimit} resume views on the ${planTitle} Plan. Please upgrade to continue viewing candidates.`
        });
      } else {
        CommonToaster(err.response?.data?.message || 'Could not verify resume view quota', 'error');
        setResumeModalCandidate(candidate);
      }
    }
  };

  const handleDownloadResume = async (candidate) => {
    if (!candidate || !candidate.resume) {
      CommonToaster('No resume document attached to this candidate.', 'error');
      return;
    }

    const candId = Number(candidate.id);

    // If already downloaded in this billing cycle, download directly without re-consuming quota
    if (downloadedCandidateIds.has(candId)) {
      downloadResumeFile(
        candidate.resume,
        `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim()
      );
      return;
    }

    // Check if downloads limit reached
    if (subscription && resumeDownloadsRemaining <= 0) {
      setQuotaLimitModal({
        type: 'download',
        title: 'Resume Download Limit Reached',
        message: `You have used all ${resumeDownloadLimit} resume downloads included in your ${planTitle} Plan. Please upgrade your subscription plan to download more resumes.`
      });
      return;
    }

    try {
      const res = await consumeResumeDownloadAPI(candId);
      if (res && res.success) {
        if (!res.already_unlocked) {
          setDownloadedCandidateIds(prev => new Set(prev).add(candId));
          setSubscription(prev => {
            if (!prev) return prev;
            const updatedUsed = (prev.usage?.resume_downloads_used || 0) + 1;
            const updatedRem = Math.max(0, (prev.limits?.resume_download_limit || resumeDownloadLimit) - updatedUsed);
            return {
              ...prev,
              usage: {
                ...prev.usage,
                resume_downloads_used: updatedUsed,
                resume_downloads_remaining: updatedRem
              }
            };
          });
          const leftCount = res.remaining !== undefined ? res.remaining : Math.max(0, resumeDownloadsRemaining - 1);
          CommonToaster(`Resume downloaded! (${leftCount} downloads remaining)`, 'success');
        }
        downloadResumeFile(
          candidate.resume,
          `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim()
        );
      }
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.limit_reached) {
        setQuotaLimitModal({
          type: 'download',
          title: err.response.data.message || 'Resume Download Limit Reached',
          message: err.response.data.details || `You have reached your limit of ${resumeDownloadLimit} resume downloads on the ${planTitle} Plan. Please upgrade to continue downloading resumes.`
        });
      } else {
        CommonToaster(err.response?.data?.message || 'Could not verify resume download quota', 'error');
      }
    }
  };


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
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  const handleCopyText = (text, fieldName) => {
    if (!text) return;
    try {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
      CommonToaster(`${fieldName} copied to clipboard!`, 'success');
    } catch (e) {
      CommonToaster('Failed to copy to clipboard', 'error');
    }
  };

  const toggleExpandSkills = (id) => {
    setExpandedSkillsMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleExpandAbout = (id) => {
    setExpandedAboutMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Extract active search keywords for dynamic highlighting
  const activeKeywords = useMemo(() => {
    const terms = new Set();

    const addTerms = (input) => {
      if (!input) return;
      if (Array.isArray(input)) {
        input.forEach(item => addTerms(item));
        return;
      }
      if (typeof input !== 'string') return;

      const commaParts = input.split(/[,]+/);
      commaParts.forEach(part => {
        const trimmed = part.trim();
        if (!trimmed) return;

        // If it's a multi-word phrase (e.g. "Full Stack Developer"), add the whole phrase
        if (trimmed.includes(' ')) {
          terms.add(trimmed);
        }

        // Also add each individual word (e.g. "React", "Node.js", "Sales")
        const words = trimmed.split(/\s+/);
        words.forEach(w => {
          const clean = w.trim();
          if (clean.length >= 2 || /^[a-zA-Z]$/.test(clean)) {
            terms.add(clean);
          }
        });
      });
    };

    addTerms(filters.keywords);
    addTerms(filters.keywordWithinResults);
    if (Array.isArray(filters.skills)) {
      filters.skills.forEach(s => addTerms(s));
    }

    return Array.from(terms);
  }, [filters.keywords, filters.keywordWithinResults, filters.skills]);

  // Quick renderer for highlighting keywords in candidate card texts
  const renderHighlightedText = useCallback((text) => {
    return highlightKeywords(text, activeKeywords);
  }, [activeKeywords]);

  // Modify Search & View All States
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [showViewAll, setShowViewAll] = useState(false);
  const [modifyForm, setModifyForm] = useState({
    keywords: '',
    keywordMatch: 'any',
    location: [],
    experienceMin: '',
    experienceMax: '',
    salaryMin: '',
    salaryMax: '',
    noticePeriod: []
  });
  const [modifyCustomLoc, setModifyCustomLoc] = useState('');

  // Load Saved Candidates from Database
  useEffect(() => {
    const loadSavedCandidates = async () => {
      try {
        const res = await getSavedCandidatesHR();
        if (res?.data?.success && Array.isArray(res.data.data)) {
          setSavedCandidateIds(res.data.data.map(c => c.id));
        }
      } catch (e) {
        // Fallback: try localStorage for unauthenticated users
        try {
          const saved = localStorage.getItem('careerfast_saved_candidate_ids');
          if (saved) setSavedCandidateIds(JSON.parse(saved));
        } catch (_) { }
      }
      try {
        const fRes = await getCandidateFoldersAPI();
        if (fRes?.data?.success && Array.isArray(fRes.data.data)) {
          setFoldersList(fRes.data.data);
        }
      } catch (_) { }
    };
    loadSavedCandidates();
  }, []);

  // Fetch Available Filter Options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await getCandidateFilterOptionsAPI();
        if (res?.data?.data) {
          const toStringArray = (arr, fallback = []) => {
            if (!arr || !Array.isArray(arr) || arr.length === 0) return fallback;
            return arr.map(item => {
              if (typeof item === 'object' && item !== null) {
                return (item.category || item.name || item.title || item.label || item.value || item.industry || item.location || '').trim();
              }
              return String(item || '').trim();
            }).filter(Boolean);
          };

          setFilterOptions(prev => ({
            ...prev,
            locations: toStringArray(res.data.data.locations, prev.locations),
            skills: toStringArray(res.data.data.skills, prev.skills),
            jobTitles: toStringArray(res.data.data.jobTitles, prev.jobTitles),
            companies: toStringArray(res.data.data.companies, prev.companies),
            industries: toStringArray(res.data.data.industries, prev.industries),
            courses: toStringArray(res.data.data.courses, prev.courses),
            genders: toStringArray(res.data.data.genders, prev.genders)
          }));
        }
      } catch (err) {
        console.error("Error fetching options", err);
      }
    };
    fetchOptions();
  }, []);

  // Fetch Candidates from Backend with Active Filters
  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      const searchTerms = [filters.keywords, filters.keywordWithinResults].filter(Boolean).join(' ').trim();

      // Convert timePeriod to days count or timeframe
      let activeUpdatedParam = '';
      if (filters.timePeriod && filters.timePeriod !== 'All time') {
        activeUpdatedParam = filters.timePeriod;
      } else if (filters.activeUpdated && filters.activeUpdated !== 'All time') {
        activeUpdatedParam = filters.activeUpdated;
      }

      const payload = {
        search: searchTerms,
        keywordMatch: filters.keywordMatch || 'any',
        location: Array.isArray(filters.location) ? filters.location.join(',') : (filters.location || ''),
        skills: Array.isArray(filters.skills) ? filters.skills.join(',') : (filters.skills || ''),
        gender: Array.isArray(filters.gender) ? filters.gender.join(',') : (filters.gender || ''),
        education: Array.isArray(filters.education) ? filters.education.join(',') : (filters.education || ''),
        courses: Array.isArray(filters.courses) ? filters.courses.join(',') : (filters.courses || ''),
        ugQualification: filters.ugQualification || '',
        institutes: Array.isArray(filters.institutes) ? filters.institutes.join(',') : (filters.institutes || ''),
        passingYearFrom: filters.passingYearFrom || '',
        passingYearTo: filters.passingYearTo || '',
        pgQualification: filters.pgQualification || '',
        doctorateQualification: filters.doctorateQualification || '',
        company: Array.isArray(filters.company) ? filters.company.join(',') : (filters.company || ''),
        experienceMin: filters.experienceMin,
        experienceMax: filters.experienceMax,
        expMonthsMin: filters.expMonthsMin || '',
        expMonthsMax: filters.expMonthsMax || '',
        salaryMin: filters.salaryMin,
        salaryMax: filters.salaryMax,
        salaryThousandMin: filters.salaryThousandMin || '',
        salaryThousandMax: filters.salaryThousandMax || '',
        salaryNotMentioned: filters.salaryNotMentioned !== false,
        activeUpdated: activeUpdatedParam,
        timePeriod: filters.timePeriod || '',
        status: filters.candidateStatus || '',
        candidateStatus: filters.candidateStatus || '',
        noticePeriod: Array.isArray(filters.noticePeriod) ? filters.noticePeriod.join(',') : (filters.noticePeriod || ''),
        industry: Array.isArray(filters.industry) ? filters.industry.join(',') : (filters.industry || ''),
        designation: Array.isArray(filters.designation) ? filters.designation.join(',') : (filters.designation || ''),
        languages: Array.isArray(filters.languages) ? filters.languages.join(',') : (filters.languages || ''),
        jobType: Array.isArray(filters.jobType) ? filters.jobType.join(',') : (filters.jobType || ''),
        includeRelocating: filters.includeRelocating ? 'true' : 'false',
        preferredLocations: Array.isArray(filters.preferredLocations) ? filters.preferredLocations.join(',') : (filters.preferredLocations || ''),
        sortBy: filters.sortBy || 'Relevance',
        page: filters.page,
        limit: filters.limit
      };

      const res = await searchCandidatesAPI(payload);
      if (res?.data?.data) {
        let fetchedList = res.data.data.candidates || [];

        // Client-side Notice Period filter if applicable
        if (filters.noticePeriod.length > 0 && !filters.noticePeriod.includes('Any')) {
          fetchedList = fetchedList.filter(c => {
            if (!c.notice_period) return true;
            return filters.noticePeriod.some(np => c.notice_period.toLowerCase().includes(np.toLowerCase()));
          });
        }

        setCandidates(fetchedList);
        const countFromApi = res.data.data.total ?? res.data.data.pagination?.total ?? res.data.data.totalCandidates;
        const total = typeof countFromApi === 'number' ? countFromApi : fetchedList.length;

        const pagesFromApi = res.data.data.totalPages ?? res.data.data.pagination?.totalPages;
        const calcPages = Math.max(1, Math.ceil(total / (filters.limit || 10)));
        const totalP = typeof pagesFromApi === 'number' && pagesFromApi > 0 ? pagesFromApi : calcPages;

        setTotalCandidates(total);
        setTotalPages(totalP);
        if (res.data.data.totalAllEmployees !== undefined) {
          setTotalAllEmployees(res.data.data.totalAllEmployees);
        }
        if (res.data.data.totalActiveEmployees !== undefined) {
          setTotalActiveEmployees(res.data.data.totalActiveEmployees);
        }
      }
    } catch (err) {
      console.error("Error searching candidates", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  // Toggle Filters
  const handleToggleArrayFilter = (field, item) => {
    setFilters(prev => {
      const arr = Array.isArray(prev[field]) ? prev[field] : [];
      const exists = arr.includes(item);
      const updated = exists ? arr.filter(i => i !== item) : [...arr, item];
      return { ...prev, [field]: updated, page: 1 };
    });
  };

  const handlePageChange = (newPage) => {
    const targetPage = Math.max(1, Math.min(Number(newPage) || 1, totalPages));
    setFilters(prev => ({ ...prev, page: targetPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSetFilter = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: field === 'page' ? Number(value) : 1
    }));
  };

  // Debounce searchInput updating filters.keywords
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== (filters.keywords || '')) {
        handleSetFilter('keywords', searchInput);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Keep searchInput in sync if filters.keywords changes externally
  useEffect(() => {
    if ((filters.keywords || '') !== searchInput) {
      setSearchInput(filters.keywords || '');
    }
  }, [filters.keywords]);

  const handleClearField = (field) => {
    setFilters(prev => ({
      ...prev,
      [field]: Array.isArray(prev[field]) ? [] : '',
      page: 1
    }));
  };

  const handleAddCustomFilter = (field, value, clearSearchFn) => {
    const trimmed = (value || '').trim();
    if (!trimmed) return;

    // Add to filterOptions list if not present so it renders as a checkbox
    setFilterOptions(prev => {
      const fieldKey =
        field === 'education' ? 'courses' :
          field === 'skills' ? 'skills' :
            field === 'location' ? 'locations' :
              field === 'company' ? 'companies' :
                field === 'industry' ? 'industries' :
                  field === 'designation' ? 'designations' :
                    field === 'languages' ? 'languages' : field;
      const currentList = prev[fieldKey] || [];
      if (!currentList.includes(trimmed)) {
        return {
          ...prev,
          [fieldKey]: [trimmed, ...currentList]
        };
      }
      return prev;
    });

    // Add to active filters
    setFilters(prev => {
      const current = prev[field] || [];
      if (!current.includes(trimmed)) {
        return {
          ...prev,
          [field]: [...current, trimmed],
          page: 1
        };
      }
      return prev;
    });

    if (clearSearchFn) clearSearchFn('');
  };

  const handleClearAll = () => {
    setFilters({
      keywords: '',
      keywordMatch: 'any',
      keywordWithinResults: '',
      location: [],
      noticePeriod: [],
      gender: [],
      education: [],
      ugQualification: '',
      courses: [],
      institutes: [],
      passingYearFrom: '',
      passingYearTo: '',
      pgQualification: '',
      doctorateQualification: '',
      company: [],
      skills: [],
      experienceMin: '',
      experienceMax: '',
      salaryMin: '',
      salaryMax: '',
      salaryThousandMin: '',
      salaryThousandMax: '',
      salaryNotMentioned: true,
      activeUpdated: 'All time',
      candidateStatus: 'Active / Updated',
      timePeriod: 'In last 12 months',
      industry: [],
      designation: [],
      smartInsights: [],
      differentlyAbled: [],
      languages: [],
      companyHeadcount: [],
      visaStatus: [],
      hideProfiles: [],
      showOnly: [],
      jobType: [],
      companyFunding: [],
      ageMin: '',
      ageMax: '',
      excludeSynonyms: false,
      includeRelocating: false,
      preferredLocations: [],
      expMonthsMin: '',
      expMonthsMax: '',
      page: 1,
      limit: 40,
      sortBy: 'Relevance'
    });
    setSearchInput('');
  };

  const toggleAccordion = (name) => {
    setOpenAccordions(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleToggleUnmaskPhone = async (candidate) => {
    if (!candidate || !candidate.id) return;
    const candId = Number(candidate.id);
    const currentlyUnmasked = unmaskedPhones[candId] !== undefined ? unmaskedPhones[candId] : unlockedCandidateIds.has(candId);

    // If currently unmasked and clicking "Hide", simply hide
    if (currentlyUnmasked) {
      setUnmaskedPhones(prev => ({ ...prev, [candId]: false }));
      return;
    }

    // If candidate is already unlocked in this subscription, unmask directly without consuming view quota
    if (unlockedCandidateIds.has(candId)) {
      setUnmaskedPhones(prev => ({ ...prev, [candId]: true }));
      return;
    }

    // Check if view limit reached
    if (subscription && resumeViewsRemaining <= 0) {
      setQuotaLimitModal({
        type: 'view',
        title: 'Resume View Limit Reached',
        message: `You have used all ${resumeViewLimit} candidate resume views included in your ${planTitle} Plan. Please upgrade your subscription plan to reveal candidate contact numbers.`
      });
      return;
    }

    try {
      const res = await consumeResumeViewAPI(candId);
      if (res && res.success) {
        if (!res.already_unlocked) {
          setUnlockedCandidateIds(prev => new Set(prev).add(candId));
          setSubscription(prev => {
            if (!prev) return prev;
            const updatedUsed = (prev.usage?.resume_views_used || 0) + 1;
            const updatedRem = Math.max(0, (prev.limits?.resume_view_limit || resumeViewLimit) - updatedUsed);
            return {
              ...prev,
              usage: {
                ...prev.usage,
                resume_views_used: updatedUsed,
                resume_views_remaining: updatedRem
              }
            };
          });
          const leftCount = res.remaining !== undefined ? res.remaining : Math.max(0, resumeViewsRemaining - 1);
          CommonToaster(`Contact number revealed! (${leftCount} views remaining)`, 'success');
        }
        setUnmaskedPhones(prev => ({ ...prev, [candId]: true }));
      }
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.limit_reached) {
        setQuotaLimitModal({
          type: 'view',
          title: err.response.data.message || 'Resume View Limit Reached',
          message: err.response.data.details || `You have reached your limit of ${resumeViewLimit} resume views on the ${planTitle} Plan. Please upgrade to continue viewing candidate contacts.`
        });
      } else {
        CommonToaster(err.response?.data?.message || 'Could not verify resume view quota', 'error');
      }
    }
  };


  const handleToggleCandidateSelect = (candidateId) => {
    setSelectedCandidateIds(prev =>
      prev.includes(candidateId) ? prev.filter(id => id !== candidateId) : [...prev, candidateId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCandidateIds.length === candidates.length) {
      setSelectedCandidateIds([]);
    } else {
      setSelectedCandidateIds(candidates.map(c => c.id));
    }
  };

  const toggleSaveCandidate = async (candidateId, silent = false) => {
    const isSaved = savedCandidateIds.includes(candidateId);
    // Optimistic update
    const updated = isSaved
      ? savedCandidateIds.filter(id => id !== candidateId)
      : [...savedCandidateIds, candidateId];
    setSavedCandidateIds(updated);
    try {
      if (isSaved) {
        await removeSavedCandidateHR(candidateId);
        if (!silent) CommonToaster('Candidate removed from saved', 'info');
      } else {
        await saveCandidateHR({ candidate_id: candidateId });
        if (!silent) CommonToaster('Candidate saved successfully', 'success');
      }
      try {
        localStorage.setItem('careerfast_saved_candidate_ids', JSON.stringify(updated));
      } catch (_) { }
    } catch (e) {
      // Revert on error
      setSavedCandidateIds(savedCandidateIds);
      CommonToaster('Failed to update saved candidate', 'error');
    }
  };

  const handleOpenModifySearch = () => {
    setModifyForm({
      keywords: filters.keywords,
      keywordMatch: filters.keywordMatch || 'any',
      location: [...filters.location],
      experienceMin: filters.experienceMin,
      experienceMax: filters.experienceMax,
      salaryMin: filters.salaryMin,
      salaryMax: filters.salaryMax,
      noticePeriod: [...filters.noticePeriod]
    });
    setModifyCustomLoc('');
    setShowModifyModal(true);
  };

  const handleApplyModifySearch = (e) => {
    if (e) e.preventDefault();
    setFilters(prev => ({
      ...prev,
      keywords: modifyForm.keywords,
      keywordMatch: modifyForm.keywordMatch,
      location: modifyForm.location,
      experienceMin: modifyForm.experienceMin,
      experienceMax: modifyForm.experienceMax,
      salaryMin: modifyForm.salaryMin,
      salaryMax: modifyForm.salaryMax,
      noticePeriod: modifyForm.noticePeriod,
      page: 1
    }));

    // Reflect changes in browser URL
    const query = new URLSearchParams();
    if (modifyForm.keywords) query.set('keywords', modifyForm.keywords);
    if (modifyForm.keywordMatch && modifyForm.keywordMatch !== 'any') query.set('keywordMatch', modifyForm.keywordMatch);
    if (modifyForm.location.length > 0) query.set('location', modifyForm.location.join(','));
    if (modifyForm.experienceMin) query.set('expMin', modifyForm.experienceMin);
    if (modifyForm.experienceMax) query.set('expMax', modifyForm.experienceMax);
    if (modifyForm.salaryMin) query.set('salaryMin', modifyForm.salaryMin);
    if (modifyForm.salaryMax) query.set('salaryMax', modifyForm.salaryMax);
    if (modifyForm.noticePeriod.length > 0) query.set('noticePeriod', modifyForm.noticePeriod.join(','));
    if (filters.sortBy) query.set('sortBy', filters.sortBy);

    window.history.replaceState(null, '', `/recruiter/candidate-search/results?${query.toString()}`);
    setShowModifyModal(false);
  };

  const handleOpenFullSearchForm = () => {
    const query = new URLSearchParams();
    const kw = modifyForm.keywords || filters.keywords;
    if (kw) query.set('keywords', kw);
    const match = modifyForm.keywordMatch || filters.keywordMatch;
    if (match && match !== 'any') query.set('keywordMatch', match);
    const loc = modifyForm.location?.length > 0 ? modifyForm.location : filters.location;
    if (loc.length > 0) query.set('location', loc.join(','));
    if (filters.skills.length > 0) query.set('skills', filters.skills.join(','));
    if (filters.company.length > 0) query.set('company', filters.company.join(','));
    if (filters.education.length > 0) query.set('education', filters.education.join(','));
    const expMin = modifyForm.experienceMin || filters.experienceMin;
    const expMax = modifyForm.experienceMax || filters.experienceMax;
    if (expMin) query.set('expMin', expMin);
    if (expMax) query.set('expMax', expMax);
    const salMin = modifyForm.salaryMin || filters.salaryMin;
    const salMax = modifyForm.salaryMax || filters.salaryMax;
    if (salMin) query.set('salaryMin', salMin);
    if (salMax) query.set('salaryMax', salMax);
    const np = modifyForm.noticePeriod?.length > 0 ? modifyForm.noticePeriod : filters.noticePeriod;
    if (np.length > 0) query.set('noticePeriod', np.join(','));
    if (filters.gender.length > 0) query.set('gender', filters.gender.join(','));

    router.push(`/recruiter/candidate-search?${query.toString()}`);
  };

  const handleToggleModifyLocation = (loc) => {
    setModifyForm(prev => {
      const exists = prev.location.includes(loc);
      return {
        ...prev,
        location: exists ? prev.location.filter(l => l !== loc) : [...prev.location, loc]
      };
    });
  };

  const handleAddCustomModifyLocation = () => {
    const trimmed = modifyCustomLoc.trim();
    if (!trimmed) return;
    setModifyForm(prev => {
      if (!prev.location.includes(trimmed)) {
        return { ...prev, location: [...prev.location, trimmed] };
      }
      return prev;
    });
    setModifyCustomLoc('');
  };

  const handleToggleModifyNotice = (np) => {
    setModifyForm(prev => {
      const exists = prev.noticePeriod.includes(np);
      return {
        ...prev,
        noticePeriod: exists ? prev.noticePeriod.filter(n => n !== np) : [...prev.noticePeriod, np]
      };
    });
  };

  const handleSaveSearch = () => {
    if (!saveSearchName.trim()) return;
    const newSaved = {
      id: Date.now(),
      name: saveSearchName.trim(),
      timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      params: filters
    };
    try {
      let recId = null;
      const stored = localStorage.getItem('loginDetails');
      if (stored) {
        const parsed = JSON.parse(stored);
        recId = parsed?.id || parsed?.user_id;
      }

      if (recId) {
        const key = `careerfast_saved_searches_${recId}`;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        const updated = [newSaved, ...existing];
        localStorage.setItem(key, JSON.stringify(updated));
        saveHrSearch({
          recruiter_id: recId,
          search_type: 'saved',
          query_title: newSaved.name,
          query_params: filters
        }).catch(() => { });
      }
    } catch (e) { }
    setSaveSearchName('');
    setSaveSearchModal(false);
  };

  // ─── Bulk Save to Folder Handlers ──────────────────────────────────────────
  const handleOpenFolderModal = async () => {
    // Default count to selected count or candidate count (up to 250)
    const count = selectedCandidateIds.length > 0
      ? selectedCandidateIds.length
      : Math.min(candidates.length, 250);
    setCandidateCountLimit(count > 0 ? count : 3);
    setFolderSearchInput('');
    setSelectedFolder(null);
    setShowFolderDropdown(false);
    setFolderModalOpen(true);

    // Fetch existing recruiter folders from DB
    try {
      setFolderLoading(true);
      const res = await getCandidateFoldersAPI();
      if (res?.data?.success && Array.isArray(res.data.data)) {
        setFoldersList(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching folders:", err);
    } finally {
      setFolderLoading(false);
    }
  };

  const handleSaveToFolder = async () => {
    const folderName = selectedFolder?.name || folderSearchInput.trim();
    if (!folderName) {
      CommonToaster("Please select or enter a folder name", "warning");
      return;
    }

    // Determine candidates to save:
    // If user has checked candidates, use checked candidates (up to limit).
    // Otherwise, use the first N candidates from the search results!
    let targetIds = [];
    if (selectedCandidateIds.length > 0) {
      targetIds = selectedCandidateIds.slice(0, candidateCountLimit);
    } else {
      targetIds = candidates.slice(0, candidateCountLimit).map(c => c.id);
    }

    if (targetIds.length === 0) {
      CommonToaster("No candidates available to save", "warning");
      return;
    }

    try {
      setFolderLoading(true);
      const folderIdentifier = selectedFolder?.id || folderName;
      const res = await addCandidatesToFolderAPI(folderIdentifier, targetIds);
      if (res?.data?.alreadyExists || res?.data?.success === false) {
        CommonToaster(res?.data?.message || "Candidate(s) already exist in this folder! Duplicate addition is restricted.", "warning");
        return;
      }
      if (res?.data?.success) {
        setSavedCandidateIds(prev => Array.from(new Set([...prev, ...targetIds])));
        setCandidates(prev =>
          prev.map(c => {
            if (targetIds.includes(c.id)) {
              const currentFolders = Array.isArray(c.saved_in_folders) ? c.saved_in_folders : [];
              const exists = currentFolders.some(f => f.folder_name?.toLowerCase() === folderName.toLowerCase());
              const updatedFolders = exists ? currentFolders : [
                ...currentFolders,
                {
                  folder_id: selectedFolder?.id,
                  folder_name: folderName,
                  stage: 'prospect',
                  saved_at: new Date().toISOString(),
                  saved_by: 'You'
                }
              ];
              return {
                ...c,
                is_saved: true,
                saved_in_folders: updatedFolders
              };
            }
            return c;
          })
        );
        CommonToaster(res.data?.message || `Successfully saved ${targetIds.length} candidate(s) to folder "${folderName}"! 📁`, "success");
        setFolderModalOpen(false);
      } else {
        CommonToaster(res?.data?.message || "Failed to save candidates to folder", "error");
      }
    } catch (err) {
      console.error("Error saving candidates to folder:", err);
      CommonToaster(err?.response?.data?.message || "Failed to save candidates to folder", "error");
    } finally {
      setFolderLoading(false);
    }
  };

  const handleOpenFolderModalForCandidate = (cand) => {
    setSelectedCandidateIds([cand.id]);
    setCandidateCountLimit(1);
    setFolderSearchInput('');
    setSelectedFolder(null);
    setShowFolderDropdown(false);
    setFolderModalOpen(true);
    getCandidateFoldersAPI()
      .then(res => {
        if (res?.data?.success && Array.isArray(res.data.data)) {
          setFoldersList(res.data.data);
        }
      })
      .catch(() => { });
  };

  const handleUpdateCandidateStage = async (candidate, newStage) => {
    try {
      const folders = Array.isArray(candidate.saved_in_folders) ? candidate.saved_in_folders : [];
      if (folders.length > 0) {
        await Promise.all(
          folders.map(f => updateFolderCandidateStageAPI(f.folder_id, candidate.id, newStage).catch(() => { }))
        );
      }
      setCandidates(prev =>
        prev.map(c => {
          if (c.id === candidate.id) {
            const updatedFolders = (c.saved_in_folders || []).map(f => ({ ...f, stage: newStage }));
            return {
              ...c,
              primary_stage: newStage,
              saved_in_folders: updatedFolders
            };
          }
          return c;
        })
      );
      CommonToaster(`Stage updated to ${newStage.toUpperCase()}`, 'success');
      setActiveStagePopoverId(null);
    } catch (err) {
      console.error("Failed to update candidate stage:", err);
      CommonToaster("Failed to update candidate stage", "error");
    }
  };

  const getCandidateFolders = useCallback((cand) => {
    const list = Array.isArray(cand?.saved_in_folders) ? [...cand.saved_in_folders] : [];
    if (Array.isArray(foldersList) && foldersList.length > 0 && cand?.id) {
      foldersList.forEach(f => {
        if (Array.isArray(f.candidate_ids) && f.candidate_ids.includes(Number(cand.id))) {
          const exists = list.some(item => item.folder_id === f.id || item.folder_name?.toLowerCase() === f.name?.toLowerCase());
          if (!exists) {
            list.push({
              folder_id: f.id,
              folder_name: f.name,
              stage: cand.primary_stage || 'prospect',
              saved_at: f.updated_at || f.created_at || new Date().toISOString(),
              saved_by: 'Santhosh'
            });
          }
        }
      });
    }
    return list;
  }, [foldersList]);

  // Close more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (moreMenuOpen && !e.target.closest('#more-menu-container')) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [moreMenuOpen]);

  // Add to Compare handler (max 5 candidates)
  const handleAddToCompare = () => {
    let toAdd = [];
    if (selectedCandidateIds.length > 0) {
      toAdd = candidates.filter(c => selectedCandidateIds.includes(c.id));
    } else if (candidates.length > 0) {
      toAdd = [candidates[0]];
    }

    if (toAdd.length === 0) {
      CommonToaster('No candidates available to compare', 'warning');
      setMoreMenuOpen(false);
      return;
    }

    setComparedCandidates(prev => {
      const existingIds = new Set(prev.map(c => c.id));
      const newlyAdded = toAdd.filter(c => !existingIds.has(c.id));
      const combined = [...prev, ...newlyAdded].slice(0, 5);
      if (combined.length === prev.length && newlyAdded.length === 0) {
        CommonToaster('Candidate(s) already in compare list', 'info');
      } else {
        CommonToaster(`Added to compare (${combined.length}/5 candidates)`, 'success');
      }
      return combined;
    });
    setMoreMenuOpen(false);
  };

  // Open Compare Modal handler
  const handleOpenCompareModal = () => {
    if (comparedCandidates.length >= 2) {
      setCompareModalOpen(true);
    } else if (selectedCandidateIds.length >= 2) {
      const selected = candidates.filter(c => selectedCandidateIds.includes(c.id)).slice(0, 5);
      setComparedCandidates(selected);
      setCompareModalOpen(true);
    } else if (candidates.length >= 2) {
      setComparedCandidates(candidates.slice(0, Math.min(candidates.length, 3)));
      setCompareModalOpen(true);
    } else {
      CommonToaster('Please select at least 2 candidates to compare', 'warning');
    }
    setMoreMenuOpen(false);
  };

  // Bulk Favourite handler
  const handleBulkFavourite = async () => {
    const targetIds = selectedCandidateIds.length > 0
      ? selectedCandidateIds
      : candidates.slice(0, 1).map(c => c.id);

    if (targetIds.length === 0) {
      CommonToaster('No candidates available to favourite', 'warning');
      setMoreMenuOpen(false);
      return;
    }

    let count = 0;
    for (const id of targetIds) {
      if (!savedCandidateIds.includes(id)) {
        await toggleSaveCandidate(id, true);
        count++;
      }
    }
    CommonToaster(`${targetIds.length} candidate(s) added to favourites! ♡`, 'success');
    setMoreMenuOpen(false);
  };

  // Add to Pipeline handler
  const handleAddToPipeline = () => {
    const count = selectedCandidateIds.length > 0 ? selectedCandidateIds.length : (candidates.length > 0 ? 1 : 0);
    if (count === 0) {
      CommonToaster('No candidates selected to add to pipeline', 'warning');
      return;
    }
    CommonToaster(`Added ${count} candidate(s) to recruitment pipeline! 👥`, 'success');
  };

  // Applied Filters Badges List
  const appliedFiltersList = useMemo(() => {
    const list = [];
    if (filters.keywords) list.push({ key: 'keywords', label: `Keyword: ${filters.keywords}`, clear: () => handleSetFilter('keywords', '') });
    if (filters.keywordWithinResults) list.push({ key: 'kwRes', label: `Within results: ${filters.keywordWithinResults}`, clear: () => handleSetFilter('keywordWithinResults', '') });

    if (filters.candidateStatus && filters.candidateStatus !== 'Active / Updated' && filters.candidateStatus !== 'All candidates') {
      list.push({ key: 'candStatus', label: `Status: ${filters.candidateStatus}`, clear: () => handleSetFilter('candidateStatus', 'Active / Updated') });
    }

    if (filters.timePeriod && filters.timePeriod !== 'All time' && filters.timePeriod !== 'In last 12 months') {
      list.push({ key: 'timePeriod', label: `Time: ${filters.timePeriod}`, clear: () => handleSetFilter('timePeriod', 'All time') });
    }

    filters.location.forEach(loc => {
      list.push({ key: `loc-${loc}`, label: loc, clear: () => handleToggleArrayFilter('location', loc) });
    });

    if (filters.includeRelocating) {
      list.push({ key: 'includeRelocating', label: 'Include Relocating', clear: () => handleSetFilter('includeRelocating', false) });
    }

    filters.preferredLocations?.forEach(pl => {
      list.push({ key: `pl-${pl}`, label: `Pref: ${pl}`, clear: () => handleToggleArrayFilter('preferredLocations', pl) });
    });

    if (filters.experienceMin || filters.experienceMax || filters.expMonthsMin || filters.expMonthsMax) {
      const minYears = filters.experienceMin || '0';
      const minMonths = filters.expMonthsMin ? ` ${filters.expMonthsMin}m` : '';
      const min = `${minYears}y${minMonths}`;
      const maxYears = filters.experienceMax ? `${filters.experienceMax}y` : '+';
      const maxMonths = filters.expMonthsMax ? ` ${filters.expMonthsMax}m` : '';
      const max = `${maxYears}${maxMonths}`;
      list.push({
        key: 'exp',
        label: `Exp: ${min} - ${max}`,
        clear: () => {
          handleSetFilter('experienceMin', '');
          handleSetFilter('experienceMax', '');
          handleSetFilter('expMonthsMin', '');
          handleSetFilter('expMonthsMax', '');
        }
      });
    }

    filters.noticePeriod.forEach(np => {
      list.push({ key: `np-${np}`, label: np, clear: () => handleToggleArrayFilter('noticePeriod', np) });
    });

    filters.gender.forEach(g => {
      list.push({ key: `g-${g}`, label: `${g} only`, clear: () => handleToggleArrayFilter('gender', g) });
    });

    if (filters.ugQualification) {
      list.push({ key: 'ug', label: `UG: ${filters.ugQualification}`, clear: () => handleSetFilter('ugQualification', '') });
    }

    (filters.courses || []).forEach(c => {
      list.push({
        key: `course-${c}`,
        label: `Course: ${c}`,
        clear: () => {
          const updated = (filters.courses || []).filter(item => item !== c);
          handleSetFilter('courses', updated);
          handleSetFilter('education', updated);
        }
      });
    });

    (filters.institutes || []).forEach(inst => {
      list.push({
        key: `inst-${inst}`,
        label: `Institute: ${inst}`,
        clear: () => {
          const updated = (filters.institutes || []).filter(item => item !== inst);
          handleSetFilter('institutes', updated);
        }
      });
    });

    if (filters.passingYearFrom || filters.passingYearTo) {
      list.push({
        key: 'passingYear',
        label: `Passing: ${filters.passingYearFrom || 'Any'} - ${filters.passingYearTo || 'Any'}`,
        clear: () => {
          handleSetFilter('passingYearFrom', '');
          handleSetFilter('passingYearTo', '');
        }
      });
    }

    if (filters.pgQualification) {
      list.push({ key: 'pg', label: `PG: ${filters.pgQualification}`, clear: () => handleSetFilter('pgQualification', '') });
    }

    if (filters.doctorateQualification) {
      list.push({ key: 'doc', label: `Doctorate: ${filters.doctorateQualification}`, clear: () => handleSetFilter('doctorateQualification', '') });
    }

    (filters.education || []).filter(e => !(filters.courses || []).includes(e)).forEach(edu => {
      list.push({ key: `edu-${edu}`, label: edu, clear: () => handleToggleArrayFilter('education', edu) });
    });

    filters.company.forEach(c => {
      list.push({ key: `c-${c}`, label: c, clear: () => handleToggleArrayFilter('company', c) });
    });

    filters.skills.forEach(s => {
      list.push({ key: `s-${s}`, label: s, clear: () => handleToggleArrayFilter('skills', s) });
    });

    if (filters.salaryMin || filters.salaryMax || filters.salaryThousandMin || filters.salaryThousandMax) {
      const minThous = filters.salaryThousandMin ? `.${String(filters.salaryThousandMin).padStart(2, '0')}` : '';
      const maxThous = filters.salaryThousandMax ? `.${String(filters.salaryThousandMax).padStart(2, '0')}` : '';
      const minStr = (filters.salaryMin || filters.salaryThousandMin) ? `${filters.salaryMin || 0}${minThous}L` : '0L';
      const maxStr = (filters.salaryMax || filters.salaryThousandMax) ? `${filters.salaryMax || 0}${maxThous}L` : 'Any';
      list.push({
        key: 'salary',
        label: `CTC: ${minStr} - ${maxStr}`,
        clear: () => {
          handleSetFilter('salaryMin', '');
          handleSetFilter('salaryMax', '');
          handleSetFilter('salaryThousandMin', '');
          handleSetFilter('salaryThousandMax', '');
        }
      });
    }

    filters.industry?.forEach(ind => {
      list.push({ key: `ind-${ind}`, label: ind, clear: () => handleToggleArrayFilter('industry', ind) });
    });

    filters.designation?.forEach(desig => {
      list.push({ key: `desig-${desig}`, label: desig, clear: () => handleToggleArrayFilter('designation', desig) });
    });

    filters.smartInsights?.forEach(si => {
      list.push({ key: `si-${si}`, label: `Insight: ${si}`, clear: () => handleToggleArrayFilter('smartInsights', si) });
    });

    filters.differentlyAbled?.forEach(da => {
      list.push({ key: `da-${da}`, label: da, clear: () => handleToggleArrayFilter('differentlyAbled', da) });
    });

    filters.languages?.forEach(lang => {
      list.push({ key: `lang-${lang}`, label: lang, clear: () => handleToggleArrayFilter('languages', lang) });
    });

    filters.companyHeadcount?.forEach(ch => {
      list.push({ key: `ch-${ch}`, label: `Size: ${ch}`, clear: () => handleToggleArrayFilter('companyHeadcount', ch) });
    });

    filters.visaStatus?.forEach(vs => {
      list.push({ key: `vs-${vs}`, label: vs, clear: () => handleToggleArrayFilter('visaStatus', vs) });
    });

    filters.showOnly?.forEach(so => {
      list.push({ key: `so-${so}`, label: so, clear: () => handleToggleArrayFilter('showOnly', so) });
    });

    filters.jobType?.forEach(jt => {
      list.push({ key: `jt-${jt}`, label: jt, clear: () => handleToggleArrayFilter('jobType', jt) });
    });

    filters.companyFunding?.forEach(cf => {
      list.push({ key: `cf-${cf}`, label: cf, clear: () => handleToggleArrayFilter('companyFunding', cf) });
    });

    if (filters.ageMin || filters.ageMax) {
      list.push({ key: 'age', label: `Age: ${filters.ageMin || 18} - ${filters.ageMax || 60}`, clear: () => { handleSetFilter('ageMin', ''); handleSetFilter('ageMax', ''); } });
    }

    return list;
  }, [filters]);

  // Render "Saved ^" popover showing folders list matching user requirement
  const renderSavedPopover = (candidate, candFolders) => {
    return (
      <div className="inline-flex items-center ml-1">
        {/* "Saved v" Popover */}
        <div className="relative" data-popover-wrapper="saved">
          <button
            type="button"
            data-popover-trigger="saved"
            onClick={(e) => {
              e.stopPropagation();
              setActiveSavedPopoverId(activeSavedPopoverId === candidate.id ? null : candidate.id);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-blue-50 text-[#0A66C2] hover:bg-blue-100 transition-colors cursor-pointer border-1 border-blue-100/80 shadow-2xs"
          >
            <span>Saved</span>
            <ChevronDown
              className={`h-3 w-3 transition-transform duration-150 ${activeSavedPopoverId === candidate.id ? 'rotate-180' : ''}`}
            />
          </button>

          {activeSavedPopoverId === candidate.id && (
            <div
              data-popover-content="saved"
              onClick={(e) => e.stopPropagation()}
              className="absolute left-0 top-full mt-2 w-[310px] sm:w-[320px] rounded-2xl bg-white p-3.5 shadow-2xl border border-slate-200 z-50 text-left animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5">
                <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                  SAVED IN FOLDERS
                </span>
                <button
                  type="button"
                  onClick={() => setActiveSavedPopoverId(null)}
                  className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md cursor-pointer transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {candFolders.length > 0 ? (
                  candFolders.map((sf, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-slate-200 bg-white p-3 text-xs space-y-1 hover:border-slate-300 transition-colors shadow-2xs"
                    >
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <Folder className="h-3.5 w-3.5 text-[#0A66C2] shrink-0" />
                        <span>Folder Name:</span>
                        <span className="text-[#0A66C2] font-bold">
                          {sf.folder_name}
                        </span>
                      </div>
                      <div className="text-[11.5px] text-slate-500">
                        Saved by{' '}
                        <span className="font-bold text-slate-800">
                          {sf.saved_by || 'Recruiter'}
                        </span>{' '}
                        on{' '}
                        <span className="text-slate-600 font-medium">
                          {formatShortDate(sf.saved_at)}
                        </span>
                      </div>
                      <div className="text-[11.5px] text-slate-500">
                        Status -{' '}
                        <span className="font-bold text-slate-800">
                          {getStageMeta(sf.stage || candidate.primary_stage).label}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs text-center text-slate-500">
                    <p className="mb-2 text-[12px]">Candidate is saved in your shortlist.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSavedPopoverId(null);
                        handleOpenFolderModalForCandidate(candidate);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0A66C2] text-white font-bold text-xs hover:bg-[#004182] transition-colors cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
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
                      handleOpenFolderModalForCandidate(candidate);
                    }}
                    className="w-full text-left px-2 py-1 text-xs font-bold text-[#0A66C2] hover:bg-blue-50 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Save to Another Folder</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleSendContactMessage = async () => {
    if (!canContactCandidates) {
      setContactModal(null);
      triggerLockedContactModal(contactModal?.type || 'Email');
      return;
    }

    if (!contactMessage || !contactMessage.trim()) {
      CommonToaster('Please write a message content.', 'warning');
      return;
    }

    if (contactModal?.type === 'Email') {
      try {
        setSendingEmail(true);
        const res = await sendCandidateEmailAPI({
          candidates: contactModal.candidates,
          message: contactMessage.trim(),
          subject: emailSubject.trim() || undefined
        });
        CommonToaster(res.message || `Email sent successfully to ${contactModal.candidates.length} candidate(s)!`, 'success');
        setContactModal(null);
        setContactMessage('');
        setEmailSubject('');
      } catch (err) {
        console.error("Failed to send candidate email:", err);
        CommonToaster(err.response?.data?.message || 'Failed to send email. Please check candidate email address.', 'error');
      } finally {
        setSendingEmail(false);
      }
    } else if (contactModal?.type === 'WhatsApp') {
      contactModal.candidates.forEach((cand, idx) => {
        const ph = cand.phone || '';
        if (ph) {
          setTimeout(() => {
            window.open(`https://wa.me/${ph.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(contactMessage.trim())}`, '_blank');
          }, idx * 400);
        }
      });
      CommonToaster(`Opening WhatsApp for candidate(s)...`, 'info');
      setContactModal(null);
      setContactMessage('');
    } else {
      CommonToaster(`Message queued via ${contactModal?.type || 'outreach'} for ${contactModal?.candidates?.length || 0} candidate(s)!`, 'success');
      setContactModal(null);
      setContactMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-24 text-slate-800 antialiased">

      {/* Top Banner (Search Summary Bar) */}
      <div className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 py-3.5 px-6 sticky top-[67px] z-20 shadow-2xs">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5 text-[13px] text-slate-600 relative">
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) {
                  router.back();
                } else {
                  router.push('/candidate-search');
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-[#0A66C2] border border-slate-200 hover:border-blue-200 rounded-xl font-semibold text-[12.5px] transition-all cursor-pointer shadow-2xs mr-1"
              title="Back to Candidate Search"
            >
              <ArrowLeft size={14} className="text-slate-600" />
              <span>Back</span>
            </button>

            <span className="font-semibold text-slate-600">
              You searched for
            </span>
            {filters.keywords ? (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-[#0A66C2] rounded-full font-bold border border-blue-200/70 shadow-2xs">
                <Star size={11} className="fill-[#0A66C2] text-[#0A66C2]" /> {filters.keywords}
              </span>
            ) : (
              <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full font-semibold border border-slate-200">
                All Candidate Profiles
              </span>
            )}

            {/* View all ⌵ Dropdown Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowViewAll(prev => !prev)}
                className="flex items-center gap-1 text-[13px] font-medium text-slate-600 hover:text-slate-900 cursor-pointer px-1 py-0.5 rounded transition-colors"
              >
                <span>View all</span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${showViewAll ? 'rotate-180 text-[#0A66C2]' : ''}`} />
              </button>

              {/* View all popover */}
              {showViewAll && (
                <div className="absolute left-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 text-[12px] space-y-2.5 animate-in fade-in duration-100">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-900 text-[13px]">Active Search Summary</span>
                    <button onClick={() => setShowViewAll(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="space-y-1.5 text-slate-600">
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-500">Keywords:</span>
                      <span className="font-semibold text-slate-800 text-right max-w-[180px] truncate">{filters.keywords || 'None'} ({filters.keywordMatch === 'all' ? 'All words' : 'Any word'})</span>
                    </div>
                    {filters.location.length > 0 && (
                      <div className="flex justify-between">
                        <span className="font-medium text-slate-500">Location:</span>
                        <span className="font-semibold text-slate-800 text-right max-w-[180px] truncate">{filters.location.join(', ')}</span>
                      </div>
                    )}
                    {(filters.experienceMin || filters.experienceMax) && (
                      <div className="flex justify-between">
                        <span className="font-medium text-slate-500">Experience:</span>
                        <span className="font-semibold text-slate-800">{filters.experienceMin || 0} - {filters.experienceMax ? `${filters.experienceMax} Yrs` : 'Any'}</span>
                      </div>
                    )}
                    {filters.noticePeriod.length > 0 && (
                      <div className="flex justify-between">
                        <span className="font-medium text-slate-500">Notice:</span>
                        <span className="font-semibold text-slate-800 text-right max-w-[180px] truncate">{filters.noticePeriod.join(', ')}</span>
                      </div>
                    )}
                    {filters.skills.length > 0 && (
                      <div className="flex justify-between">
                        <span className="font-medium text-slate-500">Skills:</span>
                        <span className="font-semibold text-slate-800 text-right max-w-[180px] truncate">{filters.skills.join(', ')}</span>
                      </div>
                    )}
                    {filters.company.length > 0 && (
                      <div className="flex justify-between">
                        <span className="font-medium text-slate-500">Company:</span>
                        <span className="font-semibold text-slate-800 text-right max-w-[180px] truncate">{filters.company.join(', ')}</span>
                      </div>
                    )}
                    {filters.education.length > 0 && (
                      <div className="flex justify-between">
                        <span className="font-medium text-slate-500">Education:</span>
                        <span className="font-semibold text-slate-800 text-right max-w-[180px] truncate">{filters.education.join(', ')}</span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => { setShowViewAll(false); handleOpenModifySearch(); }}
                    className="w-full mt-2 py-2 text-center text-[12px] font-bold text-[#0A66C2] hover:text-[#004182] bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer border border-blue-200/60"
                  >
                    Modify Search Parameters
                  </button>
                </div>
              )}
            </div>

            {/* Modify search option link */}
            <button
              type="button"
              onClick={handleOpenModifySearch}
              className="text-[#0A66C2] font-semibold hover:text-[#004182] hover:underline flex items-center gap-1 cursor-pointer transition-colors text-[13px] ml-1"
            >
              <SlidersHorizontal size={13} /> Modify search
            </button>

            <span className="text-slate-300">|</span>

            <button
              onClick={handleClearAll}
              className="text-slate-500 hover:text-slate-800 font-semibold cursor-pointer transition-colors"
            >
              Reset All
            </button>
          </div>

          <button
            onClick={() => setSaveSearchModal(true)}
            className="flex items-center gap-1.5 text-[13px] text-[#0A66C2] bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 font-bold px-4 py-1.5 rounded-xl transition-all shadow-2xs shrink-0 cursor-pointer"
          >
            <Bookmark size={14} className="text-[#0A66C2]" /> Save search
          </button>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 pt-6 flex flex-col lg:flex-row gap-6 items-start">

        {/* Left Sidebar - Dynamic Filters Panel */}
        <CandidateFilterSidebar
          filters={filters}
          filterOptions={filterOptions}
          openAccordions={openAccordions}
          toggleAccordion={toggleAccordion}
          handleToggleArrayFilter={handleToggleArrayFilter}
          handleSetFilter={handleSetFilter}
          handleClearAll={handleClearAll}
          handleAddCustomFilter={handleAddCustomFilter}
          appliedFiltersList={appliedFiltersList}
          fetchCandidates={fetchCandidates}
          locSearch={locSearch}
          setLocSearch={setLocSearch}
          eduSearch={eduSearch}
          setEduSearch={setEduSearch}
          indSearch={indSearch}
          setIndSearch={setIndSearch}
          companySearch={companySearch}
          setCompanySearch={setCompanySearch}
          desigSearch={desigSearch}
          setDesigSearch={setDesigSearch}
          langSearch={langSearch}
          setLangSearch={setLangSearch}
        />

        {/* Right Area - Results Feed & Controls */}
        <div className="flex-1 min-w-0 w-full space-y-4">

          {/* 1. Header Row: Candidates 14 | Subtitle | Add Candidate */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-[26px] font-semibold text-slate-900 tracking-tight mb-0">
                  Candidates
                </h1>
                <span className="bg-slate-100 text-slate-600 text-[13px] font-semibold px-2.5 py-0.5 rounded-full">
                  {totalCandidates > 0 ? totalCandidates : candidates.length}
                </span>
              </div>
              <p className="text-[14px] text-slate-500 mt-1 mb-0 font-normal">
                Manage and track your candidates in one place
              </p>
            </div>
          </div>

          {/* 2. Search & Controls Bar */}
          <div className="flex flex-wrap items-center gap-2.5 py-1 mt-0">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, skills, company..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleSetFilter('keywords', searchInput);
                  }
                }}
                className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2]/20 shadow-2xs transition-all"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    handleSetFilter('keywords', '');
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Candidate Status Dropdown */}
            <div className="relative inline-flex items-center">
              <select
                value={filters.candidateStatus || 'Active / Updated'}
                onChange={e => handleSetFilter('candidateStatus', e.target.value)}
                className="appearance-none bg-white border border-slate-200 hover:border-slate-300 pl-3.5 pr-8 py-2 rounded-xl text-[13px] font-medium text-slate-700 cursor-pointer focus:outline-none focus:border-[#0A66C2] shadow-2xs transition-all"
              >
                <option value="Active / Updated">Active / Updated</option>
                <option value="All candidates">All candidates</option>
                <option value="Active only">Active only</option>
                <option value="Inactive only">Inactive only</option>
                <option value="Recently updated">Recently updated</option>
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2.5 text-slate-500" />
            </div>

            {/* Time Period Dropdown */}
            <div className="relative inline-flex items-center">
              <Calendar size={14} className="pointer-events-none absolute left-3 text-slate-500" />
              <select
                value={filters.timePeriod || 'In last 12 months'}
                onChange={e => handleSetFilter('timePeriod', e.target.value)}
                className="appearance-none bg-white border border-slate-200 hover:border-slate-300 pl-8 pr-8 py-2 rounded-xl text-[13px] font-medium text-slate-700 cursor-pointer focus:outline-none focus:border-[#0A66C2] shadow-2xs transition-all"
              >
                <option value="In last 7 days">In last 7 days</option>
                <option value="In last 1 month">In last 1 month</option>
                <option value="In last 3 months">In last 3 months</option>
                <option value="In last 6 months">In last 6 months</option>
                <option value="In last 12 months">In last 12 months</option>
                <option value="In last 1 year">In last 1 year</option>
                <option value="All time">All time</option>
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2.5 text-slate-500" />
            </div>

            {/* Sort By Dropdown */}
            <div className="relative inline-flex items-center">
              <select
                value={filters.sortBy || 'Relevance'}
                onChange={e => handleSetFilter('sortBy', e.target.value)}
                className="appearance-none bg-white border border-slate-200 hover:border-slate-300 pl-3.5 pr-8 py-2 rounded-xl text-[13px] font-medium text-slate-700 cursor-pointer focus:outline-none focus:border-[#0A66C2] shadow-2xs transition-all"
              >
                <option value="Relevance">Sort by: Relevance</option>
                <option value="Newest">Sort by: Newest</option>
                <option value="Oldest">Sort by: Oldest</option>
                <option value="Experience (High to Low)">Sort by: Exp (High to Low)</option>
                <option value="Experience (Low to High)">Sort by: Exp (Low to High)</option>
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2.5 text-slate-500" />
            </div>

            {/* Per Page Dropdown */}
            <div className="relative inline-flex items-center">
              <select
                value={filters.limit || 40}
                onChange={e => {
                  handleSetFilter('limit', parseInt(e.target.value, 10));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="appearance-none bg-white border border-slate-200 hover:border-slate-300 pl-3.5 pr-8 py-2 rounded-xl text-[13px] font-medium text-slate-700 cursor-pointer focus:outline-none focus:border-[#0A66C2] shadow-2xs transition-all"
              >
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={40}>40 per page</option>
                <option value={100}>100 per page</option>
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2.5 text-slate-500" />
            </div>

            {/* List / Grid View Mode Toggles */}
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'list'
                  ? 'bg-[#0A66C2] text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                title="List View"
              >
                <List size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'grid'
                  ? 'bg-[#0A66C2] text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                title="Grid View"
              >
                <LayoutGrid size={16} />
              </button>
            </div>
          </div>

          {/* Recruiter Real-Time Hiring Quota Bar */}
          <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-white border border-blue-100/90 rounded-2xl px-4 py-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-[11px] shadow-2xs">
                <Crown size={13} />
                <span>{planTitle} Plan</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Resume Views:</span>
                <span className="font-bold text-slate-800 bg-white border border-slate-200/80 px-2 py-0.5 rounded-md">
                  {resumeViewsUsed} / {resumeViewLimit}
                </span>
                <span className={`font-semibold ${resumeViewsRemaining > 5 ? 'text-emerald-600' : resumeViewsRemaining > 0 ? 'text-amber-600' : 'text-rose-600'}`}>
                  ({resumeViewsRemaining} left)
                </span>
              </div>

              <div className="hidden sm:block text-slate-300">|</div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Resume Downloads:</span>
                <span className="font-bold text-slate-800 bg-white border border-slate-200/80 px-2 py-0.5 rounded-md">
                  {resumeDownloadsUsed} / {resumeDownloadLimit}
                </span>
                <span className={`font-semibold ${resumeDownloadsRemaining > 2 ? 'text-emerald-600' : resumeDownloadsRemaining > 0 ? 'text-amber-600' : 'text-rose-600'}`}>
                  ({resumeDownloadsRemaining} left)
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push('/billing')}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-white hover:bg-blue-50 text-[#0A66C2] border border-blue-200 font-semibold text-[11.5px] transition-all shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <span>Upgrade Plan</span>
              <ArrowRight size={12} />
            </button>
          </div>

          {/* 3. Unified Selection & Action Toolbar */}
          <div className="bg-white rounded-2xl px-4 py-3 shadow-sm flex flex-wrap items-center justify-between gap-3">
            {/* Left: Checkbox + Selected Count */}
            <div
              onClick={handleSelectAll}
              className="flex items-center gap-2.5 cursor-pointer select-none group"
            >
              <div
                className={`w-5 h-5 rounded flex items-center justify-center transition-all ${candidates.length > 0 && selectedCandidateIds.length === candidates.length
                  ? 'bg-[#0A66C2] text-white shadow-xs'
                  : selectedCandidateIds.length > 0
                    ? 'bg-[#0A66C2] text-white shadow-xs'
                    : 'border-2 border-slate-300 bg-white group-hover:border-[#0A66C2]'
                  }`}
              >
                {selectedCandidateIds.length > 0 && (
                  <Check size={13} className="text-white stroke-[3]" />
                )}
              </div>
              <span className="text-[14px] font-semibold text-slate-900">
                {selectedCandidateIds.length > 0
                  ? `${selectedCandidateIds.length} selected`
                  : 'Select all'}
              </span>
            </div>

            {/* Right: Email | WhatsApp | SMS | Save to folder | Add to pipeline | More */}
            <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
              {/* Email */}
              <button
                type="button"
                onClick={() => {
                  if (!canContactCandidates) {
                    triggerLockedContactModal('Email');
                    return;
                  }
                  const targetList = selectedCandidateIds.length > 0
                    ? candidates.filter(c => selectedCandidateIds.includes(c.id))
                    : candidates;
                  setContactModal({ type: 'Email', candidates: targetList });
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer shadow-2xs ${!canContactCandidates
                  ? 'bg-slate-100 hover:bg-slate-200/80 text-slate-500 border border-slate-200'
                  : 'bg-blue-50/80 hover:bg-blue-100 text-[#0A66C2] border-1 border-blue-200/80'
                  }`}
                title={!canContactCandidates ? 'Direct candidate email is locked on your plan. Click to upgrade.' : 'Email candidates'}
              >
                {!canContactCandidates ? <Lock size={13} className="text-slate-500" /> : <Mail size={14} className="text-[#0A66C2]" />}
                <span>Email</span>
              </button>

              {/* WhatsApp */}
              <button
                type="button"
                onClick={() => {
                  if (!canContactCandidates) {
                    triggerLockedContactModal('WhatsApp');
                    return;
                  }
                  const targetList = selectedCandidateIds.length > 0
                    ? candidates.filter(c => selectedCandidateIds.includes(c.id))
                    : candidates;
                  setContactModal({ type: 'WhatsApp', candidates: targetList });
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer shadow-2xs ${!canContactCandidates
                  ? 'bg-slate-100 hover:bg-slate-200/80 text-slate-500 border border-slate-200'
                  : 'bg-emerald-50/80 hover:bg-emerald-100 text-emerald-700 border-1 border-emerald-200/80'
                  }`}
                title={!canContactCandidates ? 'Direct candidate WhatsApp is locked on your plan. Click to upgrade.' : 'WhatsApp candidates'}
              >
                {!canContactCandidates ? <Lock size={13} className="text-slate-500" /> : <MessageSquare size={14} className="text-emerald-600" />}
                <span>WhatsApp</span>
              </button>

              {/* SMS */}
              <button
                type="button"
                onClick={() => {
                  if (!canContactCandidates) {
                    triggerLockedContactModal('SMS');
                    return;
                  }
                  const targetList = selectedCandidateIds.length > 0
                    ? candidates.filter(c => selectedCandidateIds.includes(c.id))
                    : candidates;
                  setContactModal({ type: 'SMS', candidates: targetList });
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer shadow-2xs ${!canContactCandidates
                  ? 'bg-slate-100 hover:bg-slate-200/80 text-slate-500 border border-slate-200'
                  : 'bg-purple-50/80 hover:bg-purple-100 text-purple-700 border-1 border-purple-200/80'
                  }`}
                title={!canContactCandidates ? 'Direct candidate SMS is locked on your plan. Click to upgrade.' : 'SMS candidates'}
              >
                {!canContactCandidates ? <Lock size={13} className="text-slate-500" /> : <MessageSquare size={14} className="text-purple-600" />}
                <span>SMS</span>
              </button>

              {/* Save to folder */}
              <button
                type="button"
                onClick={handleOpenFolderModal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-medium transition-colors cursor-pointer shadow-2xs"
              >
                <Folder size={14} className="text-slate-600" />
                <span>Save to folder</span>
              </button>

              {/* Three dots menu */}
              <div className="relative" id="more-menu-container">
                <button
                  type="button"
                  onClick={() => setMoreMenuOpen(prev => !prev)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-medium transition-colors cursor-pointer shadow-2xs"
                  title="More actions"
                >
                  <MoreVertical size={14} className="text-slate-600" />
                  <span>More</span>
                </button>

                {moreMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <button
                      type="button"
                      onClick={handleAddToCompare}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-start gap-3 transition-colors cursor-pointer group"
                    >
                      <Plus size={16} className="text-slate-600 group-hover:text-slate-900 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-[13px] font-semibold text-slate-800 group-hover:text-slate-900">Add to Compare</div>
                        <div className="text-[11px] text-slate-400">You can add upto 5 candidates</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenCompareModal}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 transition-colors cursor-pointer group"
                    >
                      <Layers size={15} className="text-slate-600 group-hover:text-slate-900 shrink-0" />
                      <span className="text-[13px] font-medium text-slate-700 group-hover:text-slate-900">Compare Profiles</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleBulkFavourite}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 transition-colors cursor-pointer group"
                    >
                      <Heart size={15} className="text-slate-600 group-hover:text-rose-500 shrink-0" />
                      <span className="text-[13px] font-medium text-slate-700 group-hover:text-slate-900">Favourite</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4. Candidates Feed (List / Grid) */}
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}>
            {loading ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-500 font-medium shadow-2xs col-span-full">
                <CommonLoader fullScreen={false} text="Matching & Scoring Candidates..." />
              </div>
            ) : candidates.length > 0 ? (
              candidates.map((candidate, cardIdx) => {
                const isSelected = selectedCandidateIds.includes(candidate.id);
                const isSaved = savedCandidateIds.includes(candidate.id);
                const isUnmasked = unmaskedPhones[candidate.id] !== undefined
                  ? Boolean(unmaskedPhones[candidate.id])
                  : unlockedCandidateIds.has(Number(candidate.id));
                const candFolders = getCandidateFolders(candidate);
                const isCandidateSaved = isSaved || candFolders.length > 0 || !!candidate.is_saved;
                const primaryStage = candidate.primary_stage || candFolders[0]?.stage || 'prospect';
                const currentStageMeta = getStageMeta(primaryStage);

                // Dynamic gradients for fallback avatar
                const avatarGradients = [
                  'from-[#0A66C2] to-blue-600',
                  'from-sky-500 to-blue-700',
                  'from-rose-400 to-pink-500',
                  'from-emerald-500 to-teal-600',
                  'from-amber-500 to-orange-500',
                  'from-cyan-500 to-blue-600'
                ];
                const avatarGrad = avatarGradients[cardIdx % avatarGradients.length];

                // Candidate Name
                const candidateName = `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim() || 'Candidate Profile';
                const initials = `${candidate.first_name?.[0] || 'C'}${candidate.last_name?.[0] || ''}`.toUpperCase();

                // Helper to sanitize strings from "null", "undefined", etc.
                const cleanText = (val) => {
                  if (!val) return null;
                  const str = String(val).trim();
                  if (str === '' || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined' || str === '--' || str === 'N/A') return null;
                  return str;
                };

                // Role & Company
                const jobTitle = cleanText(candidate.current_job_title) || cleanText(candidate.past_job_title) || cleanText(candidate.designation) || 'Candidate';
                const companyName = cleanText(candidate.current_company) || cleanText(candidate.past_company) || cleanText(candidate.organization) || null;

                // Experience text
                const expDisplay = candidate.experience_years !== undefined && candidate.experience_years !== null
                  ? `${candidate.experience_years} Years ${candidate.experience_months || 0} Months`
                  : (candidate.experience_display || 'N/A');

                // Location display
                const locDisplay = candidate.location || candidate.current_location || 'N/A';

                // Profile Image check
                const rawImg = candidate.profile_image || candidate.profile_picture || candidate.photo || candidate.avatar || candidate.image;
                const candidateImgUrl = rawImg ? getImageUrl(rawImg) : null;

                // Skills array fallback - parse and split comma-separated skills into clean individual items
                const rawSkillsList = parseSkillsList(candidate.skills);
                // Prioritize matched skills to appear first in top preview pills, followed by other skills
                const skillsList = activeKeywords.length > 0
                  ? [
                    ...rawSkillsList.filter(s => activeKeywords.some(kw => s.toLowerCase().includes(kw.toLowerCase()))),
                    ...rawSkillsList.filter(s => !activeKeywords.some(kw => s.toLowerCase().includes(kw.toLowerCase())))
                  ]
                  : rawSkillsList;

                // AI About / Summary Quote
                const aboutSummary = candidate.about || "N/A";

                // Past Employment / Company
                const rawPastExp = cleanText(candidate.past_experience_display);
                const rawPastComp = cleanText(candidate.past_company);
                const rawPastTitle = cleanText(candidate.past_job_title);
                const rawCurrComp = cleanText(candidate.current_company);
                const rawCurrTitle = cleanText(candidate.current_job_title);
                const rawPrevComp = cleanText(candidate.previous_company);
                const rawPrevTitle = cleanText(candidate.previous_job_title);
                const rawOrg = cleanText(candidate.organization);

                let pastDisplay = rawPastExp;
                if (!pastDisplay) {
                  if (rawPastTitle && rawPastComp) {
                    pastDisplay = `${rawPastTitle} at ${rawPastComp}`;
                  } else if (rawPastComp) {
                    pastDisplay = rawPastComp;
                  } else if (rawPrevTitle && rawPrevComp) {
                    pastDisplay = `${rawPrevTitle} at ${rawPrevComp}`;
                  } else if (rawPrevComp) {
                    pastDisplay = rawPrevComp;
                  } else if (rawCurrTitle && rawCurrComp) {
                    pastDisplay = `${rawCurrTitle} at ${rawCurrComp}`;
                  } else if (rawCurrComp) {
                    pastDisplay = rawCurrComp;
                  } else if (rawOrg) {
                    pastDisplay = rawOrg;
                  } else {
                    pastDisplay = '--';
                  }
                }
                if (typeof pastDisplay === 'string') {
                  pastDisplay = pastDisplay.replace(/\bat null\b/gi, '').replace(/\bnull at\b/gi, '').replace(/\bnull\b/gi, '').trim();
                  if (!pastDisplay || pastDisplay === 'at') {
                    pastDisplay = rawCurrComp || rawPastComp || rawOrg || '--';
                  }
                }

                // Education Display
                let eduDisplay = cleanText(candidate.education_display);
                if (!eduDisplay && candidate.education) {
                  if (typeof candidate.education === 'string') {
                    eduDisplay = cleanText(candidate.education);
                  } else if (typeof candidate.education === 'object') {
                    const { qualification, course, specialization, college } = candidate.education;
                    const parts = [];
                    const deg = cleanText(course) || cleanText(qualification);
                    if (deg) parts.push(cleanText(specialization) ? `${deg} (${cleanText(specialization)})` : deg);
                    if (cleanText(college)) parts.push(cleanText(college));
                    eduDisplay = parts.join(' • ') || null;
                  }
                }
                if (eduDisplay) {
                  eduDisplay = eduDisplay
                    .replace(/^Undergraduate\s*-\s*/i, '')
                    .replace(/^Graduation\s*-\s*/i, '')
                    .replace(/^Postgraduate\s*-\s*/i, '');
                }
                if (!eduDisplay) {
                  if (cleanText(candidate.course)) {
                    eduDisplay = cleanText(candidate.course) + (cleanText(candidate.class) ? ` (${cleanText(candidate.class)})` : '');
                    if (cleanText(candidate.organization)) eduDisplay += ` • ${cleanText(candidate.organization)}`;
                  } else if (cleanText(candidate.class)) {
                    eduDisplay = cleanText(candidate.class);
                  } else {
                    eduDisplay = '--';
                  }
                }

                // Preferred Location
                let prefLocationsRaw = candidate.preferred_locations;
                if (!prefLocationsRaw && candidate.preferred_job_type) {
                  try {
                    const parsedP = typeof candidate.preferred_job_type === 'string' ? JSON.parse(candidate.preferred_job_type) : candidate.preferred_job_type;
                    prefLocationsRaw = parsedP?.preferredLocations || parsedP?.preferred_locations;
                  } catch (_) { }
                }
                const prefLocsArray = Array.isArray(prefLocationsRaw)
                  ? prefLocationsRaw
                  : (typeof prefLocationsRaw === 'string' ? prefLocationsRaw.split(',').map(s => s.trim()).filter(Boolean) : []);

                const cleanPrefLocs = prefLocsArray.map(l => l.replace(/, India$/i, '').trim()).filter(l => cleanText(l));
                const prefLocDisplay = cleanPrefLocs.length > 0
                  ? (cleanPrefLocs.length > 3
                    ? `${cleanPrefLocs.slice(0, 3).join(', ')} (+${cleanPrefLocs.length - 3} more)`
                    : cleanPrefLocs.join(', '))
                  : (cleanText(candidate.location) ? cleanText(candidate.location).split(',')[0] : '--');
                const prefLocTooltip = cleanPrefLocs.length > 0 ? cleanPrefLocs.join(', ') : 'Not specified';

                // Notice Period
                let noticePeriodRaw = cleanText(candidate.notice_period);
                if (!noticePeriodRaw && candidate.preferred_job_type) {
                  try {
                    const parsedP = typeof candidate.preferred_job_type === 'string' ? JSON.parse(candidate.preferred_job_type) : candidate.preferred_job_type;
                    noticePeriodRaw = cleanText(parsedP?.noticePeriod || parsedP?.notice_period);
                  } catch (_) { }
                }
                const hasNoticePeriod = Boolean(noticePeriodRaw);
                const noticePeriodDisplay = hasNoticePeriod ? noticePeriodRaw : '--';

                // Expected Salary
                let expectedSalaryRaw = cleanText(candidate.expected_salary);
                if (!expectedSalaryRaw && candidate.preferred_job_type) {
                  try {
                    const parsedP = typeof candidate.preferred_job_type === 'string' ? JSON.parse(candidate.preferred_job_type) : candidate.preferred_job_type;
                    expectedSalaryRaw = cleanText(parsedP?.expectedSalary || parsedP?.expected_salary);
                  } catch (_) { }
                }
                const hasExpectedSalary = Boolean(expectedSalaryRaw);
                let expectedSalaryDisplay = '--';
                if (hasExpectedSalary) {
                  const s = expectedSalaryRaw;
                  expectedSalaryDisplay = (s.startsWith('₹') || s.toLowerCase().includes('inr') || s.toLowerCase().includes('rs')) ? s : `₹ ${s}`;
                }

                return viewMode === 'grid' ? (
                  /* ================= GRID CARD VIEW ================= */
                  <div
                    key={candidate.id}
                    className={`bg-white rounded-2xl border transition-all p-4 shadow-2xs hover:shadow-md flex flex-col justify-between gap-3.5 ${isSelected ? 'border-[#0A66C2] ring-2 ring-[#0A66C2]/10 bg-blue-50/10' : 'border-slate-200/90 hover:border-slate-300'
                      }`}
                  >
                    <div>
                      {/* Top Row: Checkbox, Avatar, Name + Verified Badge, Bookmark, View Profile */}
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          {/* Checkbox */}
                          <div className="pt-1 shrink-0">
                            <div
                              onClick={() => handleToggleCandidateSelect(candidate.id)}
                              className={`w-5 h-5 rounded flex items-center justify-center transition-all cursor-pointer ${isSelected ? 'bg-[#0A66C2] text-white shadow-xs' : 'border-2 border-slate-300 bg-white hover:border-[#0A66C2]'
                                }`}
                            >
                              {isSelected && <Check size={13} className="text-white stroke-[3]" />}
                            </div>
                          </div>

                          {/* Avatar */}
                          <div
                            onClick={() => handleOpenCandidateProfile(candidate)}
                            className="relative shrink-0 cursor-pointer group"
                            style={{ width: '46px', height: '46px', minWidth: '46px', minHeight: '46px' }}
                          >
                            <div
                              className="w-11.5 h-11.5 rounded-full border border-slate-200 bg-white p-0.5 flex items-center justify-center overflow-hidden shadow-xs group-hover:ring-2 group-hover:ring-[#0A66C2] transition-all"
                              style={{ width: '46px', height: '46px', minWidth: '46px', minHeight: '46px' }}
                            >
                              {candidateImgUrl ? (
                                <img
                                  src={candidateImgUrl}
                                  alt={candidateName}
                                  className="w-full h-full rounded-full object-cover"
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div
                                style={{ display: candidateImgUrl ? 'none' : 'flex', width: '100%', height: '100%' }}
                                className={`w-full h-full rounded-full bg-gradient-to-tr ${avatarGrad} text-white items-center justify-center font-bold text-[14px] tracking-wider`}
                              >
                                {initials}
                              </div>
                            </div>
                            <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white absolute bottom-0 right-0 shadow-2xs" />
                          </div>

                          {/* Name + Verified */}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <h2
                                onClick={() => handleOpenCandidateProfile(candidate)}
                                className="text-[15.5px] font-semibold text-slate-900 hover:text-[#0A66C2] cursor-pointer tracking-tight mb-0 truncate transition-colors"
                              >
                                {renderHighlightedText(candidateName)}
                              </h2>
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/90 text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0 select-none">
                                <CheckCircle2 size={10} className="text-emerald-600 fill-emerald-100" />
                                <span>Verified</span>
                              </span>
                              {isCandidateSaved && renderSavedPopover(candidate, candFolders)}
                            </div>

                            <div className="text-[12.5px] text-slate-600 font-medium mt-0.5 truncate">
                              <span>{renderHighlightedText(jobTitle)}</span>
                              {companyName && (
                                <span className="text-slate-500"> at <span className="text-[#0A66C2] font-semibold hover:underline cursor-pointer">{renderHighlightedText(companyName)}</span></span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Top Right Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {unlockedCandidateIds.has(Number(candidate.id)) && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md inline-flex items-center gap-0.5" title="Profile already unlocked">
                              <CheckCircle2 size={10} className="text-emerald-600" /> Viewed
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => toggleSaveCandidate(candidate.id)}
                            className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${isCandidateSaved
                              ? 'bg-blue-50 border-blue-200 text-[#0A66C2]'
                              : 'bg-white border-slate-200 text-slate-500 hover:text-[#0A66C2] hover:bg-slate-50'
                              }`}
                            title={isCandidateSaved ? "Remove from saved" : "Save candidate"}
                          >
                            <Bookmark size={13} className={isCandidateSaved ? "fill-[#0A66C2]" : ""} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenCandidateProfile(candidate)}
                            className="bg-[#0A66C2] hover:bg-[#004182] text-white text-[11.5px] font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-2xs transition-all cursor-pointer shrink-0"
                          >
                            <span>Profile</span>
                            <ArrowRight size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Location & Experience */}
                      <div className="flex flex-wrap items-center gap-3 text-[12px] text-slate-500 font-normal mt-2.5">
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                          <MapPin size={12} className="text-[#0A66C2]" /> {locDisplay}
                        </span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <Briefcase size={12} className="text-slate-400" /> {expDisplay}
                        </span>
                      </div>

                      {/* Candidate Key Details in Grid View */}
                      <div className="space-y-1 mt-2.5 pt-2 border-t border-slate-100 text-[11.5px]">
                        <div className="flex items-baseline gap-2">
                          <span className="w-20 shrink-0 text-slate-400 font-medium text-[11px]">Past:</span>
                          <span className={`font-medium truncate ${pastDisplay !== '--' ? 'text-slate-800' : 'text-slate-400'}`} title={pastDisplay}>
                            {renderHighlightedText(pastDisplay)}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="w-20 shrink-0 text-slate-400 font-medium text-[11px]">Pref. loc:</span>
                          <span className={`font-medium truncate ${prefLocDisplay !== '--' ? 'text-slate-800' : 'text-slate-400'}`} title={prefLocTooltip}>
                            {renderHighlightedText(prefLocDisplay)}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="w-20 shrink-0 text-slate-400 font-medium text-[11px]">Education:</span>
                          <span className={`font-medium truncate ${eduDisplay !== '--' ? 'text-slate-800' : 'text-slate-400'}`} title={eduDisplay}>
                            {renderHighlightedText(eduDisplay)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 pt-0.5 text-[11px]">
                          <div className="flex items-baseline gap-1">
                            <span className="text-slate-400 font-medium text-[11px]">Notice:</span>
                            <span className={`font-semibold ${hasNoticePeriod ? 'text-slate-800' : 'text-slate-400'}`}>{noticePeriodDisplay}</span>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-slate-400 font-medium text-[11px]">Exp. salary:</span>
                            <span className={`font-semibold ${hasExpectedSalary ? 'text-slate-800' : 'text-slate-400'}`}>{expectedSalaryDisplay}</span>
                          </div>
                        </div>
                      </div>

                      {/* Skills Pills */}
                      {skillsList.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                          {(expandedSkillsMap[candidate.id] ? skillsList : skillsList.slice(0, 4)).map((skill, sIdx) => {
                            const isSkillMatched = activeKeywords.length > 0 && activeKeywords.some(kw => skill.toLowerCase().includes(kw.toLowerCase()));
                            return (
                              <span
                                key={sIdx}
                                onClick={() => handleToggleArrayFilter('skills', skill)}
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium cursor-pointer transition-all border ${isSkillMatched
                                  ? 'bg-blue-50 text-[#0A66C2] border-blue-200/90 font-semibold shadow-2xs'
                                  : 'bg-slate-100 text-slate-700 border-transparent hover:bg-slate-200'
                                  }`}
                              >
                                {renderHighlightedText(skill)}
                              </span>
                            );
                          })}
                          {skillsList.length > 4 && (
                            <button
                              type="button"
                              onClick={() => toggleExpandSkills(candidate.id)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10.5px] font-medium px-2 py-0.5 rounded-full cursor-pointer transition-colors"
                            >
                              {expandedSkillsMap[candidate.id] ? 'Show less' : `+${skillsList.length - 4} more`}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Summary Quote */}
                      <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-2.5 text-[11.5px] text-slate-600 leading-relaxed mt-2.5">
                        <p className={`italic mb-0 ${expandedAboutMap[candidate.id] ? '' : 'line-clamp-2'}`}>
                          &ldquo;{renderHighlightedText(aboutSummary)}&rdquo;
                        </p>
                        <button
                          type="button"
                          onClick={() => toggleExpandAbout(candidate.id)}
                          className="text-[#0A66C2] hover:text-[#004182] font-semibold text-[11px] hover:underline cursor-pointer inline-flex items-center gap-0.5 mt-1"
                        >
                          <span>{expandedAboutMap[candidate.id] ? 'Show less' : 'Show full summary'}</span>
                          <ChevronDown size={11} className={expandedAboutMap[candidate.id] ? 'rotate-180' : ''} />
                        </button>
                      </div>
                    </div>

                    {/* Bottom Bar in Grid Mode */}
                    <div className="border-t border-slate-100 pt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11.5px]">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <span>#{candidate.id}</span>
                        <span>•</span>
                        <span>2 days ago</span>
                        <span>•</span>
                        <span className="text-emerald-600 font-semibold">Active</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (!canContactCandidates) {
                              triggerLockedContactModal('Email');
                              return;
                            }
                            setContactModal({ type: 'Email', candidates: [candidate] });
                          }}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${!canContactCandidates
                            ? 'bg-slate-100 hover:bg-slate-200/80 text-slate-500 border border-slate-200'
                            : 'bg-white hover:bg-blue-50 border border-slate-200 text-[#0A66C2]'
                            }`}
                          title={!canContactCandidates ? 'Candidate email is locked on your plan. Click to upgrade.' : 'Email'}
                        >
                          {!canContactCandidates && <Lock size={11} className="text-slate-500" />}
                          Email
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!canContactCandidates) {
                              triggerLockedContactModal('WhatsApp');
                              return;
                            }
                            if (candidate.phone) {
                              window.open(`https://wa.me/${candidate.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${candidate.first_name}, I saw your profile on CareerFast.`)}`, '_blank');
                            } else {
                              setContactModal({ type: 'WhatsApp', candidates: [candidate] });
                            }
                          }}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${!canContactCandidates
                            ? 'bg-slate-100 hover:bg-slate-200/80 text-slate-500 border border-slate-200'
                            : 'bg-emerald-50/60 hover:bg-emerald-100 border border-emerald-200 text-emerald-700'
                            }`}
                          title={!canContactCandidates ? 'Candidate WhatsApp is locked on your plan. Click to upgrade.' : 'WhatsApp'}
                        >
                          {!canContactCandidates && <Lock size={11} className="text-slate-500" />}
                          WhatsApp
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ================= LIST CARD VIEW ================= */
                  <div
                    key={candidate.id}
                    className={`bg-white rounded-2xl transition-all p-4 shadow-sm ${isSelected ? 'border-[#0A66C2] ring-2 ring-[#0A66C2]/10 bg-blue-50/10' : ''
                      }`}
                  >
                    {/* Top / Main Card Info */}
                    <div className="flex flex-col xl:flex-row items-start justify-between gap-5">

                      {/* Left: Checkbox + Avatar + Primary Info + Skills */}
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        {/* Checkbox */}
                        <div className="pt-1 shrink-0">
                          <div
                            onClick={() => handleToggleCandidateSelect(candidate.id)}
                            className={`w-5 h-5 rounded flex items-center justify-center transition-all cursor-pointer ${isSelected ? 'bg-[#0A66C2] text-white shadow-xs' : 'border-2 border-slate-300 bg-white hover:border-[#0A66C2]'
                              }`}
                          >
                            {isSelected && <Check size={13} className="text-white stroke-[3]" />}
                          </div>
                        </div>

                        {/* Circular Avatar / Company Logo with Online Status Dot */}
                        <div
                          onClick={() => handleOpenCandidateProfile(candidate)}
                          className="relative shrink-0 cursor-pointer group w-14 h-14"
                          style={{ width: '56px', height: '56px', minWidth: '56px', minHeight: '56px' }}
                        >
                          <div
                            className="w-14 h-14 rounded-full border border-slate-200 bg-white p-0.5 flex items-center justify-center overflow-hidden shadow-xs group-hover:ring-2 group-hover:ring-[#0A66C2] transition-all"
                            style={{ width: '56px', height: '56px', minWidth: '56px', minHeight: '56px' }}
                          >
                            {candidateImgUrl ? (
                              <img
                                src={candidateImgUrl}
                                alt={candidateName}
                                className="w-full h-full rounded-full object-cover"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div
                              style={{ display: candidateImgUrl ? 'none' : 'flex', width: '100%', height: '100%' }}
                              className={`w-full h-full rounded-full bg-gradient-to-tr ${avatarGrad} text-white items-center justify-center font-bold text-[15px] tracking-wider`}
                            >
                              {initials}
                            </div>
                          </div>
                          <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white absolute bottom-0 right-0 shadow-2xs" />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          {/* Name + Verified Badge */}
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h2
                              onClick={() => handleOpenCandidateProfile(candidate)}
                              className="text-[17.5px] font-semibold text-slate-900 hover:text-[#0A66C2] cursor-pointer tracking-tight mb-0 transition-colors"
                            >
                              {renderHighlightedText(candidateName)}
                            </h2>

                            <span className="bg-emerald-50 text-emerald-700 text-[11.5px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 select-none">
                              <CheckCircle2 size={12} className="text-emerald-600 fill-emerald-100" />
                              <span>Verified</span>
                            </span>

                            {isCandidateSaved && renderSavedPopover(candidate, candFolders)}
                          </div>

                          {/* Role and Company */}
                          <div className="text-[13.5px] text-slate-700 font-medium mb-1">
                            <span>{renderHighlightedText(jobTitle)}</span>
                            {companyName && (
                              <span className="text-slate-600">
                                {' '}at <span className="text-[#0A66C2] font-semibold hover:underline cursor-pointer">{renderHighlightedText(companyName)}</span>
                              </span>
                            )}
                          </div>

                          {/* Location and Experience */}
                          <div className="flex flex-wrap items-center gap-4 text-[12.5px] text-slate-500 mb-2 font-normal">
                            <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                              <MapPin size={13.5} className="text-[#0A66C2]" /> {locDisplay}
                            </span>
                            <span className="flex items-center gap-1.5 text-slate-500">
                              <Briefcase size={13.5} className="text-slate-400" /> {expDisplay}
                            </span>
                          </div>

                          {/* Candidate Details: Past, Pref. location, Education, Notice period, Expected salary */}
                          <div className="space-y-1.5 my-2.5 text-[12.5px]">
                            {/* Past */}
                            <div className="flex items-baseline gap-2">
                              <span className="w-28 shrink-0 text-slate-400 font-medium text-[12px]">Past:</span>
                              <span className={`font-medium ${pastDisplay !== '--' ? 'text-slate-800' : 'text-slate-400'}`}>
                                {renderHighlightedText(pastDisplay)}
                              </span>
                            </div>

                            {/* Pref. location */}
                            <div className="flex items-baseline gap-2">
                              <span className="w-28 shrink-0 text-slate-400 font-medium text-[12px]">Pref. location:</span>
                              <span className={`font-medium ${prefLocDisplay !== '--' ? 'text-slate-800' : 'text-slate-400'}`} title={prefLocTooltip}>
                                {renderHighlightedText(prefLocDisplay)}
                              </span>
                            </div>

                            {/* Education */}
                            <div className="flex items-baseline gap-2">
                              <span className="w-28 shrink-0 text-slate-400 font-medium text-[12px]">Education:</span>
                              <span className={`font-medium ${eduDisplay !== '--' ? 'text-slate-800' : 'text-slate-400'}`} title={eduDisplay}>
                                {renderHighlightedText(eduDisplay)}
                              </span>
                            </div>

                            {/* Notice period & Expected salary */}
                            <div className="flex flex-wrap items-baseline gap-x-10 gap-y-1.5">
                              <div className="flex items-baseline gap-2">
                                <span className="w-28 shrink-0 text-slate-400 font-medium text-[12px]">Notice period:</span>
                                <span className={`font-semibold ${hasNoticePeriod ? 'text-slate-800' : 'text-slate-400'}`}>
                                  {noticePeriodDisplay}
                                </span>
                              </div>

                              <div className="flex items-baseline gap-2">
                                <span className="text-slate-400 font-medium text-[12px]">Expected salary:</span>
                                <span className={`font-semibold ${hasExpectedSalary ? 'text-slate-800' : 'text-slate-400'}`}>
                                  {expectedSalaryDisplay}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Skills Pills */}
                          {skillsList.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5">
                              {(expandedSkillsMap[candidate.id] ? skillsList : skillsList.slice(0, 4)).map((skill, sIdx) => {
                                const isSkillMatched = activeKeywords.length > 0 && activeKeywords.some(kw => skill.toLowerCase().includes(kw.toLowerCase()));
                                return (
                                  <span
                                    key={sIdx}
                                    onClick={() => handleToggleArrayFilter('skills', skill)}
                                    className={`px-3 py-1 rounded-full text-[12px] font-medium cursor-pointer transition-all border ${isSkillMatched
                                      ? 'bg-blue-50 text-[#0A66C2] border-blue-200/90 font-semibold shadow-2xs'
                                      : 'bg-slate-100 text-slate-700 border-transparent hover:bg-slate-200'
                                      }`}
                                    title="Click to filter by this skill"
                                  >
                                    {renderHighlightedText(skill)}
                                  </span>
                                );
                              })}

                              {skillsList.length > 4 && (
                                <button
                                  type="button"
                                  onClick={() => toggleExpandSkills(candidate.id)}
                                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12px] font-medium px-3 py-1 rounded-full cursor-pointer transition-colors"
                                >
                                  {expandedSkillsMap[candidate.id] ? 'Show less' : `+${skillsList.length - 4} more`}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions Row + AI Summary Quote */}
                      <div className="w-full xl:w-[340px] flex flex-col justify-between shrink-0">
                        {/* Top Action Row: Bookmark + View Profile */}
                        <div className="flex items-center justify-end gap-2 mb-2">
                          {unlockedCandidateIds.has(Number(candidate.id)) && (
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border-1 border-emerald-200 px-2 py-1 rounded-xl inline-flex items-center gap-1 shadow-2xs" title="Candidate profile already viewed and unlocked">
                              <CheckCircle2 size={12} className="text-emerald-600" /> Viewed
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => toggleSaveCandidate(candidate.id)}
                            className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${isCandidateSaved
                              ? 'bg-blue-50 border-blue-200 text-[#0A66C2]'
                              : 'bg-white border-slate-200 text-slate-500 hover:text-[#0A66C2] hover:bg-slate-50'
                              }`}
                            title={isCandidateSaved ? "Remove from saved" : "Save candidate"}
                          >
                            <Bookmark size={16} className={isCandidateSaved ? "fill-[#0A66C2]" : ""} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenCandidateProfile(candidate)}
                            className="bg-[#0A66C2] hover:bg-[#004182] text-white text-[13.5px] font-medium px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                          >
                            <span>View Profile</span>
                            <ArrowRight size={15} />
                          </button>
                        </div>

                        {/* Middle: Italic Summary Quote */}
                        <div className="text-[12px] text-slate-600 leading-relaxed text-left">
                          <p className={`italic mb-0 ${expandedAboutMap[candidate.id] ? '' : 'line-clamp-2'}`}>
                            &ldquo;{renderHighlightedText(aboutSummary)}&rdquo;
                          </p>
                          <button
                            type="button"
                            onClick={() => toggleExpandAbout(candidate.id)}
                            className="text-[#0A66C2] hover:text-[#004182] font-semibold text-[12px] hover:underline cursor-pointer inline-flex items-center gap-1 mt-1"
                          >
                            <span>{expandedAboutMap[candidate.id] ? 'Show less' : 'Show full summary'}</span>
                            <ChevronDown size={13} className={expandedAboutMap[candidate.id] ? 'rotate-180' : ''} />
                          </button>
                        </div>
                      </div>

                    </div>

                    {/* Bottom Footer / Metadata Bar */}
                    <div className="border-t border-slate-100 pt-3 mt-3 flex flex-wrap items-center justify-between gap-3 text-[12px]">
                      {/* Left Info: ID, Registered, Last Active, Source, Active Badge */}
                      <div className="flex flex-wrap items-center gap-4 text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <FileText size={13} className="text-slate-400" />
                          <span>Candidate ID</span>
                          <span className="font-semibold text-slate-800">#{candidate.id}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-400" />
                          <span>Registered</span>
                          <span className="font-semibold text-slate-800">
                            {new Date(candidate.created_date || '2026-09-12').toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Clock size={13} className="text-slate-400" />
                          <span>Last Active</span>
                          <span className="font-semibold text-slate-800">2 days ago</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Briefcase size={13} className="text-slate-400" />
                          <span>Source</span>
                          <span className="font-semibold text-slate-800">{candidate.source || 'Website'}</span>
                        </div>

                        <div className="bg-emerald-50 text-emerald-700 text-[11.5px] font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 select-none">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>Active Candidate</span>
                        </div>
                      </div>

                      {/* Right Contact Actions: Phone Pill, Email, WhatsApp */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Phone Pill */}
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[12px] text-slate-700 font-semibold shadow-2xs">
                          <Phone size={12.5} className="text-[#0A66C2]" />
                          <span>
                            {isUnmasked
                              ? (candidate.phone_code ? `${candidate.phone_code} ${candidate.phone}` : candidate.phone)
                              : `+91-${candidate.phone ? candidate.phone.slice(0, 3) : '638'}******`}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleUnmaskPhone(candidate)}
                            className="text-[#0A66C2] font-bold hover:underline cursor-pointer ml-1 text-[11.5px]"
                          >
                            {isUnmasked ? "Hide" : "Show"}
                          </button>
                        </div>

                        {/* Email Button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (!canContactCandidates) {
                              triggerLockedContactModal('Email');
                              return;
                            }
                            setContactModal({ type: 'Email', candidates: [candidate] });
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-colors shadow-2xs cursor-pointer ${!canContactCandidates
                            ? 'bg-slate-100 hover:bg-slate-200/80 text-slate-500 border border-slate-200'
                            : 'bg-white hover:bg-blue-50 border-1 border-slate-200 hover:border-blue-200 text-[#0A66C2]'
                            }`}
                          title={!canContactCandidates ? 'Candidate email is locked on your plan. Click to upgrade.' : 'Email candidate'}
                        >
                          {!canContactCandidates ? <Lock size={12} className="text-slate-500" /> : <Mail size={13} className="text-[#0A66C2]" />}
                          <span>Email</span>
                        </button>

                        {/* WhatsApp Button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (!canContactCandidates) {
                              triggerLockedContactModal('WhatsApp');
                              return;
                            }
                            if (candidate.phone) {
                              window.open(`https://wa.me/${candidate.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${candidate.first_name}, I saw your profile on CareerFast and would like to discuss an opportunity.`)}`, '_blank');
                            } else {
                              setContactModal({ type: 'WhatsApp', candidates: [candidate] });
                            }
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-colors shadow-2xs cursor-pointer ${!canContactCandidates
                            ? 'bg-slate-100 hover:bg-slate-200/80 text-slate-500 border border-slate-200'
                            : 'bg-emerald-50/60 hover:bg-emerald-100 border-1 border-emerald-200 text-emerald-700'
                            }`}
                          title={!canContactCandidates ? 'Candidate WhatsApp is locked on your plan. Click to upgrade.' : 'WhatsApp candidate'}
                        >
                          {!canContactCandidates ? <Lock size={12} className="text-slate-500" /> : <MessageSquare size={13} className="text-emerald-600" />}
                          <span>WhatsApp</span>
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center shadow-2xs col-span-full">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#0A66C2]">
                  <Search size={30} className="stroke-[2.5]" />
                </div>
                <h3 className="text-[18px] font-bold text-slate-900 mb-1">No Matching Candidates Found</h3>
                <p className="text-[13px] text-slate-500 max-w-md mx-auto mb-2 leading-relaxed">
                  We couldn&apos;t find candidates matching your exact criteria. Try broadening your keywords or removing some location / experience constraints.
                </p>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-6 py-2.5 bg-[#0A66C2] hover:bg-[#004182] text-white font-medium rounded-xl text-[13px] cursor-pointer shadow-sm transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>

          {/* Bottom Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200/90 px-5 py-3 shadow-2xs text-[13px] mt-4">
              <span className="text-slate-500">
                Showing Page <span className="font-semibold text-slate-800">{filters.page}</span> of <span className="font-semibold text-slate-800">{totalPages}</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={filters.page <= 1}
                  onClick={() => handlePageChange(filters.page - 1)}
                  className={`px-3 py-1.5 rounded-lg font-semibold border transition-all cursor-pointer ${filters.page <= 1
                    ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                >
                  Previous
                </button>
                {getPageNumbers(filters.page, totalPages).map((item, idx) => {
                  if (item === '...') {
                    return <span key={`btm-el-${idx}`} className="px-2 text-slate-400">…</span>;
                  }
                  const isActive = filters.page === item;
                  return (
                    <button
                      key={`btm-pg-${item}`}
                      type="button"
                      onClick={() => handlePageChange(item)}
                      className={`w-8 h-8 rounded-lg font-semibold text-[13px] transition-all cursor-pointer ${isActive
                        ? 'bg-[#0A66C2] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                      {item}
                    </button>
                  );
                })}
                <button
                  type="button"
                  disabled={filters.page >= totalPages}
                  onClick={() => handlePageChange(filters.page + 1)}
                  className={`px-3 py-1.5 rounded-lg font-semibold border transition-all cursor-pointer ${filters.page >= totalPages
                    ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modern Trending Candidate Profile Modal */}
      {resumeModalCandidate && (
        <div
          onClick={() => setResumeModalCandidate(null)}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-5 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col border border-slate-200/80 overflow-hidden animate-in zoom-in-95 duration-200"
          >
            {/* Hero Header Banner */}
            <div className="relative bg-gradient-to-r from-slate-900 via-[#0B2545] to-[#0A66C2] px-6 pt-6 pb-4 text-white shrink-0 overflow-hidden">
              {/* Background ambient lighting */}
              <div className="absolute -top-10 -right-10 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 left-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

              {/* Action Buttons Top Right: Save + Close */}
              <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                <button
                  type="button"
                  onClick={() => toggleSaveCandidate(resumeModalCandidate.id)}
                  className={`p-2 rounded-xl backdrop-blur-md transition-all cursor-pointer ${savedCandidateIds.includes(resumeModalCandidate.id)
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                    : 'bg-white/10 text-white/80 hover:text-white hover:bg-white/20 border border-white/10'
                    }`}
                  title={savedCandidateIds.includes(resumeModalCandidate.id) ? "Remove from saved" : "Save candidate"}
                >
                  <Heart size={16} className={savedCandidateIds.includes(resumeModalCandidate.id) ? "fill-rose-500 text-rose-400" : ""} />
                </button>
                <button
                  type="button"
                  onClick={() => setResumeModalCandidate(null)}
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/25 border border-white/10 text-white flex items-center justify-center transition-all cursor-pointer"
                  title="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Profile Avatar & Primary Info */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 relative z-0 pr-16 sm:pr-24">
                {(() => {
                  const modalRawImg = resumeModalCandidate.profile_image || resumeModalCandidate.profile_picture || resumeModalCandidate.photo || resumeModalCandidate.avatar || resumeModalCandidate.image;
                  const modalImgUrl = modalRawImg ? getImageUrl(modalRawImg) : null;
                  const initials = `${resumeModalCandidate.first_name?.[0] || 'C'}${resumeModalCandidate.last_name?.[0] || ''}`.toUpperCase();

                  return (
                    <div className="relative shrink-0">
                      {modalImgUrl ? (
                        <img
                          src={modalImgUrl}
                          alt="Profile"
                          onClick={() => {
                            setPreviewImageModal({
                              url: modalImgUrl,
                              title: `${resumeModalCandidate.first_name || ''} ${resumeModalCandidate.last_name || ''}`.trim(),
                              subtitle: resumeModalCandidate.current_job_title || 'Candidate Profile'
                            });
                          }}
                          className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white/20 shadow-xl cursor-pointer hover:scale-102 transition-transform bg-white"
                          style={{ width: '80px', height: '80px', minWidth: '80px', minHeight: '80px', objectFit: 'cover' }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.nextSibling) {
                              e.currentTarget.nextSibling.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div
                        style={{ display: modalImgUrl ? 'none' : 'flex', width: '80px', height: '80px' }}
                        className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#0A66C2] to-blue-500 ring-4 ring-white/20 shadow-xl text-white items-center justify-center font-bold text-2xl tracking-wider select-none"
                      >
                        {initials}
                      </div>
                      <span className="w-4 h-4 rounded-full bg-emerald-400 border-2 border-slate-900 absolute -bottom-1 -right-1 shadow-sm" title="Active Candidate" />
                    </div>
                  );
                })()}

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight mb-0">
                      {renderHighlightedText(`${resumeModalCandidate.first_name || ''} ${resumeModalCandidate.last_name || ''}`.trim())}
                    </h2>
                    <span className="inline-flex items-center gap-1 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 size={12} className="text-emerald-400" /> Verified
                    </span>
                  </div>

                  <p className="text-[13.5px] text-blue-100 font-medium mt-1 mb-2">
                    {renderHighlightedText(resumeModalCandidate.current_job_title || 'Software Professional')}
                    {resumeModalCandidate.current_company && (
                      <span className="text-blue-200/90 font-normal"> at <strong className="text-white font-semibold">{renderHighlightedText(resumeModalCandidate.current_company)}</strong></span>
                    )}
                  </p>

                  {/* Metadata Chips */}
                  <div className="flex flex-wrap items-center gap-2 text-[12px]">
                    <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2.5 py-0.8 rounded-lg text-white/90">
                      <MapPin size={12} className="text-sky-300" />
                      {resumeModalCandidate.location || resumeModalCandidate.current_location || 'India'}
                    </span>

                    <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2.5 py-0.8 rounded-lg text-white/90">
                      <Briefcase size={12} className="text-amber-300" />
                      {resumeModalCandidate.experience_years !== undefined && resumeModalCandidate.experience_years !== null
                        ? `${resumeModalCandidate.experience_years}y ${resumeModalCandidate.experience_months || 0}m Exp`
                        : (resumeModalCandidate.experience_display || 'Experience on request')}
                    </span>

                    {resumeModalCandidate.notice_period && (
                      <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2.5 py-0.8 rounded-lg text-white/90 border border-white/10">
                        <Clock size={12} className="text-emerald-300" />
                        {resumeModalCandidate.notice_period}
                      </span>
                    )}

                    {(resumeModalCandidate.expected_salary || resumeModalCandidate.current_salary) && (
                      <span className="inline-flex items-center gap-1 bg-white/10 backdrop-blur-md px-2.5 py-0.8 rounded-lg text-white/90 border border-white/10 font-medium">
                        <span className="text-amber-300 font-bold">₹</span>
                        {resumeModalCandidate.expected_salary || resumeModalCandidate.current_salary}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto bg-slate-50/50 flex-1">
              {/* Section 1: Contact & Verification Details */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[14px] font-semibold text-slate-900 tracking-tight flex items-center gap-2 mb-0">
                    <span className="w-2 h-2 rounded-full bg-[#0A66C2]" />
                    Contact & Verification Details
                  </h4>
                  <span className="text-[11.5px] text-slate-400 font-medium">Quick copy & direct contact</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Email */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-blue-300 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0A66C2] flex items-center justify-center shrink-0">
                        <Mail size={18} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[14px] font-semibold text-slate-500">Email Address</span>
                        <a
                          href={`mailto:${resumeModalCandidate.email}`}
                          className="text-[13px] font-semibold text-slate-800 hover:text-[#0A66C2] truncate block"
                          title={resumeModalCandidate.email}
                        >
                          {resumeModalCandidate.email || 'Not specified'}
                        </a>
                      </div>
                    </div>
                    {resumeModalCandidate.email && (
                      <button
                        type="button"
                        onClick={() => handleCopyText(resumeModalCandidate.email, 'Email')}
                        className="text-slate-400 hover:text-[#0A66C2] p-1.5 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors shrink-0"
                        title="Copy Email"
                      >
                        {copiedField === 'Email' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      </button>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-emerald-300 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Phone size={18} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[14px] font-semibold text-slate-500">Phone Number</span>
                        <a
                          href={`tel:${resumeModalCandidate.phone}`}
                          className="text-[13px] font-semibold text-slate-800 hover:text-emerald-600 truncate block"
                        >
                          {resumeModalCandidate.phone || 'Available upon request'}
                        </a>
                      </div>
                    </div>
                    {resumeModalCandidate.phone && (
                      <button
                        type="button"
                        onClick={() => handleCopyText(resumeModalCandidate.phone, 'Phone')}
                        className="text-slate-400 hover:text-emerald-600 p-1.5 rounded-lg hover:bg-emerald-50 cursor-pointer transition-colors shrink-0"
                        title="Copy Phone"
                      >
                        {copiedField === 'Phone' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      </button>
                    )}
                  </div>

                  {/* Current Location */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <span className="text-[14px] font-semibold text-slate-500">Current Location</span><br />
                      <span className="text-[13px] font-semibold text-slate-800">
                        {resumeModalCandidate.location || resumeModalCandidate.current_location || 'Not specified'}
                      </span>
                    </div>
                  </div>

                  {/* Total Experience */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <Briefcase size={18} />
                    </div>
                    <div>
                      <span className="text-[14px] font-semibold text-slate-500">Total Experience</span><br />
                      <span className="text-[13px] font-semibold text-slate-800">
                        {resumeModalCandidate.experience_years !== undefined && resumeModalCandidate.experience_years !== null
                          ? `${resumeModalCandidate.experience_years} Years ${resumeModalCandidate.experience_months || 0} Months`
                          : (resumeModalCandidate.experience_display || 'Not specified')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Professional Summary */}
              {resumeModalCandidate.about && (
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#0A66C2]" />
                    <h4 className="text-[14px] font-semibold text-slate-900 tracking-tight flex items-center gap-1.5 mb-0">
                      <Sparkles size={15} className="text-amber-500" />
                      Professional Summary
                    </h4>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-2xs border-l-4 border-l-[#0A66C2]">
                    <p className="text-[13.5px] text-slate-700 leading-relaxed mb-0 font-normal">
                      {renderHighlightedText(resumeModalCandidate.about)}
                    </p>
                  </div>
                </div>
              )}

              {/* Section 3: Core Skills & Competencies */}
              {parseSkillsList(resumeModalCandidate.skills).length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#0A66C2]" />
                      <h4 className="text-[14px] font-semibold text-slate-900 tracking-tight mb-0">
                        Core Skills & Competencies
                      </h4>
                    </div>
                    <span className="text-[11.5px] font-semibold text-[#0A66C2] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                      {parseSkillsList(resumeModalCandidate.skills).length} Skills
                    </span>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-2xs">
                    <div className="flex flex-wrap gap-2">
                      {parseSkillsList(resumeModalCandidate.skills).map((s, i) => {
                        const isMatch = activeKeywords.length > 0 && activeKeywords.some(kw => s.toLowerCase().includes(kw.toLowerCase()));
                        return (
                          <span
                            key={i}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all shadow-2xs ${isMatch
                              ? 'bg-amber-50 text-amber-900 border border-amber-300 ring-1 ring-amber-300/40'
                              : 'bg-slate-50 text-slate-700 border border-slate-200/90 hover:border-blue-300 hover:bg-blue-50/50 hover:text-[#0A66C2]'
                              }`}
                          >
                            {isMatch && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                            {renderHighlightedText(s)}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Section 4: Academic Qualifications */}
              {resumeModalCandidate.education && (
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#0A66C2]" />
                    <h4 className="text-[14px] font-semibold text-slate-900 tracking-tight flex items-center gap-1.5 mb-0">
                      <GraduationCap size={16} className="text-[#0A66C2]" />
                      Academic Qualifications
                    </h4>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-[14.5px]">
                          {renderHighlightedText(resumeModalCandidate.education.course || resumeModalCandidate.course || 'Degree / Diploma')}
                        </span>
                      </div>
                      {resumeModalCandidate.education.college && (
                        <p className="text-slate-600 text-[13px] mb-0 font-medium">
                          {renderHighlightedText(resumeModalCandidate.education.college)}
                        </p>
                      )}
                    </div>

                    {resumeModalCandidate.education.cgpa && (
                      <div className="shrink-0">
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-bold px-3 py-1 rounded-xl text-[12px]">
                          CGPA / Score: {resumeModalCandidate.education.cgpa}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Section 5: Resume File Document */}
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="w-2 h-2 rounded-full bg-[#0A66C2]" />
                  <h4 className="text-[14px] font-semibold text-slate-900 tracking-tight flex items-center gap-1.5 mb-0">
                    <FileText size={16} className="text-[#0A66C2]" />
                    Resume File Document
                  </h4>
                </div>

                {resumeModalCandidate.resume && resumeModalCandidate.resume !== 'Resume' ? (
                  <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/50 border border-blue-200/90 p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-[#0A66C2] text-white flex items-center justify-center shrink-0 shadow-sm">
                        <FileText size={22} />
                      </div>
                      <div>
                        <span className="text-[13.5px] font-bold text-slate-900 block">
                          {`${resumeModalCandidate.first_name || 'Candidate'}_Resume.pdf`}
                        </span>
                        <span className="text-[11.5px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                          <CheckCircle2 size={12} /> Verified Resume Document
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => viewResumeFile(resumeModalCandidate.resume)}
                        className="px-3.5 py-2 bg-white text-[#0A66C2] hover:bg-blue-50 border border-blue-200 text-[12.5px] font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                      >
                        <ExternalLink size={14} /> View
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadResume(resumeModalCandidate)}
                        className="px-4 py-2 bg-[#0A66C2] hover:bg-[#004182] text-white text-[12.5px] font-medium rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-98"
                      >
                        <Download size={14} /> Download PDF
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 text-slate-500 text-[12.5px] flex items-center gap-2.5 shadow-2xs">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span>Resume file parsed directly into verified candidate profile data above.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Sticky Modern Footer */}
            <div className="px-6 py-4 bg-white border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
              {/* Quick Communication Options */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!canContactCandidates) {
                      triggerLockedContactModal('WhatsApp');
                      return;
                    }
                    setContactModal({ type: 'WhatsApp', candidates: [resumeModalCandidate] });
                    setResumeModalCandidate(null);
                  }}
                  className={`px-3.5 py-2 font-semibold text-[12.5px] rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border shadow-2xs ${!canContactCandidates
                    ? 'bg-slate-100 hover:bg-slate-200/80 text-slate-500 border-slate-200'
                    : 'bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 border-emerald-200/60'
                    }`}
                  title={!canContactCandidates ? 'WhatsApp outreach is locked on your plan. Click to upgrade.' : 'WhatsApp'}
                >
                  {!canContactCandidates ? <Lock size={13} className="text-slate-500" /> : <MessageSquare size={14} className="text-emerald-600" />}
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!canContactCandidates) {
                      triggerLockedContactModal('SMS');
                      return;
                    }
                    setContactModal({ type: 'SMS', candidates: [resumeModalCandidate] });
                    setResumeModalCandidate(null);
                  }}
                  className={`px-3.5 py-2 font-semibold text-[12.5px] rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border shadow-2xs ${!canContactCandidates
                    ? 'bg-slate-100 hover:bg-slate-200/80 text-slate-500 border-slate-200'
                    : 'bg-sky-50 hover:bg-sky-100/80 text-sky-700 border-sky-200/60'
                    }`}
                  title={!canContactCandidates ? 'SMS outreach is locked on your plan. Click to upgrade.' : 'SMS'}
                >
                  {!canContactCandidates ? <Lock size={13} className="text-slate-500" /> : <MessageSquare size={14} className="text-sky-600" />}
                  <span>SMS</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setResumeModalCandidate(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold text-[13px] cursor-pointer transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!canContactCandidates) {
                      triggerLockedContactModal('Email / Direct Contact');
                      return;
                    }
                    setContactModal({ type: 'Email', candidates: [resumeModalCandidate] });
                    setResumeModalCandidate(null);
                  }}
                  className={`px-6 py-2 font-medium rounded-xl text-[13px] cursor-pointer shadow-sm hover:shadow transition-all flex items-center gap-2 active:scale-98 ${!canContactCandidates
                    ? 'bg-slate-200 hover:bg-slate-300 text-slate-600'
                    : 'bg-[#0A66C2] hover:bg-[#004182] text-white'
                    }`}
                >
                  {!canContactCandidates ? <Lock size={14} className="text-slate-500" /> : <Mail size={15} />}
                  <span>{!canContactCandidates ? 'Contact Locked' : 'Contact Candidate'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact / Message Modal */}
      {contactModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200/80">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-[16px] font-bold text-slate-900 flex items-center gap-2">
                <Send size={18} className="text-[#0A66C2]" />
                Send {contactModal.type} to {contactModal.candidates.length} Candidate(s)
              </h3>
              <button
                onClick={() => {
                  setContactModal(null);
                  setEmailSubject('');
                  setContactMessage('');
                }}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Recipients</label>
              <div className="max-h-24 overflow-y-auto flex flex-wrap gap-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                {contactModal.candidates.map(c => (
                  <span key={c.id} className="text-[12px] bg-white border border-slate-200 px-2.5 py-0.5 rounded-lg font-medium text-slate-800 shadow-2xs">
                    {c.first_name} {c.last_name} ({c.email || c.phone || `#${c.id}`})
                  </span>
                ))}
              </div>
            </div>

            {contactModal.type === 'Email' && (
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Subject (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Exciting Career Opportunity on CareerFast"
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-[13px] text-slate-800 focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/15 focus:outline-none shadow-2xs"
                />
              </div>
            )}

            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Message Content</label>
              <textarea
                rows={4}
                placeholder={`Write your ${contactModal.type} message to the candidate(s)...`}
                value={contactMessage}
                onChange={e => setContactMessage(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-3.5 text-[13px] text-slate-800 focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/15 focus:outline-none shadow-2xs"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                disabled={sendingEmail}
                onClick={() => {
                  setContactModal(null);
                  setEmailSubject('');
                  setContactMessage('');
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold text-[13px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={sendingEmail}
                onClick={handleSendContactMessage}
                className="px-6 py-2 bg-[#0A66C2] hover:bg-[#004182] text-white font-medium rounded-xl text-[13px] shadow-sm transition-colors flex items-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {sendingEmail ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending Email...</span>
                  </>
                ) : (
                  <span>Send {contactModal.type}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Search Modal */}
      {saveSearchModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200/80">
            <div className="flex justify-between items-center">
              <h3 className="text-[16px] font-bold text-slate-900 flex items-center gap-2">
                <Bookmark size={18} className="text-[#0A66C2]" /> Save Search Preset
              </h3>
              <button onClick={() => setSaveSearchModal(false)} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <p className="text-[13px] text-slate-600">
              Save these applied filters to rerun with a single click in the future:
            </p>
            <input
              type="text"
              placeholder="e.g. React Developers in Chennai"
              value={saveSearchName}
              onChange={e => setSaveSearchName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveSearch()}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-[14px] focus:outline-none focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/15"
              autoFocus
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSaveSearchModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-[13px] font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSearch}
                className="px-5 py-2 bg-[#0A66C2] text-white rounded-xl text-[13px] font-bold hover:bg-[#004182] shadow-sm transition-colors"
              >
                Save Preset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Save to Folder Modal - Exact Match to User Mockup */}
      {folderModalOpen && (
        <div
          onClick={() => setFolderModalOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-[460px] w-full border border-slate-200/90 overflow-hidden animate-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-[17px] font-bold text-slate-900 mb-0">Bulk Save to Folder</h3>
              <button
                type="button"
                onClick={() => setFolderModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-3 space-y-5">
              {/* Card 1: Add Candidates to Folder */}
              <div className="bg-[#F8FAFC] rounded-2xl p-3 border border-slate-100 space-y-2.5">
                <label className="block text-[13px] font-bold text-slate-800">
                  Add Candidates to Folder <span className="text-rose-500">*</span>
                </label>
                <p className="text-[12px] text-slate-500 mb-2">
                  You can add upto 250 candidates
                </p>

                {/* Non-editable Count Pill */}
                <div>
                  <span className="inline-flex items-center justify-center min-w-[70px] px-4 py-1.5 bg-white border border-slate-200/90 rounded-full font-bold text-slate-800 text-[14px] shadow-2xs select-none">
                    {candidateCountLimit}
                  </span>
                </div>

                <p className="text-[11.5px] text-slate-400 font-normal mb-0 pt-1">
                  First set of searched profiles will be saved to the folder
                </p>
              </div>

              {/* Folder Selector Input */}
              <div className="space-y-1.5 relative">
                <label className="block text-[13px] font-bold text-slate-800">
                  Select Folder <span className="text-rose-500">*</span>
                </label>

                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Type to search/create folder"
                    value={folderSearchInput}
                    onChange={(e) => {
                      setFolderSearchInput(e.target.value);
                      setSelectedFolder(null);
                      setShowFolderDropdown(true);
                    }}
                    onFocus={() => setShowFolderDropdown(true)}
                    className="w-full pl-10 pr-20 py-2.5 bg-white border border-slate-300 rounded-xl text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/15"
                  />
                  {folderSearchInput.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        const trimmed = folderSearchInput.trim();
                        if (trimmed) {
                          setSelectedFolder({ name: trimmed });
                          setShowFolderDropdown(false);
                        }
                      }}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#0A66C2] hover:text-[#004182] font-semibold text-[12.5px] cursor-pointer"
                    >
                      Create
                    </button>
                  )}
                </div>

                {/* Dropdown list of existing recruiter folders */}
                {showFolderDropdown && foldersList.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-30 max-h-44 overflow-y-auto p-1 text-[13px]">
                    {foldersList
                      .filter(f => f.name.toLowerCase().includes(folderSearchInput.toLowerCase()))
                      .map((f) => (
                        <div
                          key={f.id}
                          onClick={() => {
                            setSelectedFolder(f);
                            setFolderSearchInput(f.name);
                            setShowFolderDropdown(false);
                          }}
                          className="px-3 py-2 hover:bg-blue-50 text-slate-700 hover:text-[#0A66C2] rounded-lg cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <span className="font-medium">{f.name}</span>
                          <span className="text-[11px] text-slate-400 font-normal">
                            {f.candidate_count || 0} candidate{f.candidate_count === 1 ? '' : 's'}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-white">
              <button
                type="button"
                onClick={() => setFolderModalOpen(false)}
                className="px-5 py-2 text-[#0A66C2] hover:text-[#004182] hover:bg-slate-50 font-semibold text-[13.5px] rounded-xl cursor-pointer transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={folderLoading || (!selectedFolder && !folderSearchInput.trim())}
                onClick={handleSaveToFolder}
                className={`px-6 py-2.5 font-bold text-[13.5px] rounded-full transition-all shadow-sm flex items-center gap-1.5 ${(!selectedFolder && !folderSearchInput.trim()) || folderLoading
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-[#0A66C2] hover:bg-[#004182] active:scale-98 text-white cursor-pointer'
                  }`}
              >
                {folderLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Start saving</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modify Search Modal */}
      {showModifyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-7 border border-slate-200/80 max-h-[90vh] overflow-y-auto space-y-5">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-[17px] font-bold text-slate-900 flex items-center gap-2">
                  <SlidersHorizontal size={19} className="text-[#0A66C2]" />
                  Modify Search Criteria
                </h3>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  Refine keywords, matching mode, and primary filters without starting over.
                </p>
              </div>
              <button
                onClick={() => setShowModifyModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Keywords & Match Mode */}
            <div className="space-y-2.5">
              <label className="block text-[13px] font-bold text-slate-700">
                Keywords <span className="text-slate-400 font-normal">(Skills, designations, or search terms)</span>
              </label>
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. React Node.js Sales, Fullstack Developer..."
                  value={modifyForm.keywords}
                  onChange={e => setModifyForm(prev => ({ ...prev, keywords: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-medium text-slate-800 focus:bg-white focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/15 focus:outline-none transition-all"
                  autoFocus
                />
              </div>

              {/* Keyword Matching Options (Any word vs All words) */}
              <div className="pt-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Keyword Match Rule:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModifyForm(prev => ({ ...prev, keywordMatch: 'any' }))}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${modifyForm.keywordMatch === 'any'
                      ? 'bg-blue-50/90 border-blue-300 ring-1 ring-[#0A66C2]/30'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`text-[12px] font-bold ${modifyForm.keywordMatch === 'any' ? 'text-blue-900' : 'text-slate-700'}`}>
                        Match ANY of the words (OR)
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-[#0A66C2]">
                        Default
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Finds candidates matching at least one term (e.g. React or Node.js or Sales).
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModifyForm(prev => ({ ...prev, keywordMatch: 'all' }))}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${modifyForm.keywordMatch === 'all'
                      ? 'bg-blue-50/90 border-blue-300 ring-1 ring-[#0A66C2]/30'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`text-[12px] font-bold ${modifyForm.keywordMatch === 'all' ? 'text-blue-900' : 'text-slate-700'}`}>
                        Match ALL of the words (AND)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Candidates must match every single keyword typed in the box.
                    </p>
                  </button>
                </div>
              </div>
            </div>

            {/* Experience Range */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-[13px] font-bold text-slate-700">Total Experience (Years)</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] text-slate-400 font-medium block mb-1">Minimum</span>
                  <select
                    value={modifyForm.experienceMin}
                    onChange={e => setModifyForm(prev => ({ ...prev, experienceMin: e.target.value }))}
                    className="w-full text-[13px] bg-slate-50 border border-slate-200 rounded-xl p-2 focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                  >
                    <option value="">0 Years (Any / Fresher)</option>
                    {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15].map(y => (
                      <option key={y} value={y}>{y} Years</option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-medium block mb-1">Maximum</span>
                  <select
                    value={modifyForm.experienceMax}
                    onChange={e => setModifyForm(prev => ({ ...prev, experienceMax: e.target.value }))}
                    className="w-full text-[13px] bg-slate-50 border border-slate-200 rounded-xl p-2 focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                  >
                    <option value="">Any Experience</option>
                    {[1, 2, 3, 5, 7, 10, 15, 20, 25].map(y => (
                      <option key={y} value={y}>{y} Years</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Target Locations */}
            <div className="space-y-2 pt-1">
              <label className="block text-[13px] font-bold text-slate-700">Candidate Location</label>

              {/* Selected location tags */}
              {modifyForm.location.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-1">
                  {modifyForm.location.map(loc => (
                    <span key={loc} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-[#0A66C2] text-[12px] font-bold rounded-lg border border-blue-200/60">
                      <MapPin size={11} />
                      <span>{loc}</span>
                      <X
                        size={12}
                        className="text-blue-400 hover:text-rose-600 cursor-pointer ml-1"
                        onClick={() => handleToggleModifyLocation(loc)}
                      />
                    </span>
                  ))}
                </div>
              )}

              {/* Quick toggle popular locations */}
              <div className="flex flex-wrap gap-1.5">
                {['Chennai', 'Bengaluru', 'Hyderabad', 'Mumbai', 'Delhi NCR', 'Pune', 'Remote'].map(city => {
                  const selected = modifyForm.location.includes(city);
                  return (
                    <button
                      key={city}
                      type="button"
                      onClick={() => handleToggleModifyLocation(city)}
                      className={`text-[12px] px-2.5 py-1 rounded-lg border font-medium cursor-pointer transition-colors ${selected
                        ? 'bg-[#0A66C2] text-white border-[#0A66C2] shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                    >
                      {selected ? `✓ ${city}` : `+ ${city}`}
                    </button>
                  );
                })}
              </div>

              {/* Add Custom Location Input */}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Type any other location..."
                  value={modifyCustomLoc}
                  onChange={e => setModifyCustomLoc(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomModifyLocation();
                    }
                  }}
                  className="flex-1 text-[12px] px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCustomModifyLocation}
                  className="px-3 py-1.5 text-[12px] font-bold bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#0A66C2] border border-slate-200 rounded-xl cursor-pointer transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Notice Period */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-[13px] font-bold text-slate-700">Notice Period</label>
              <div className="flex flex-wrap gap-1.5">
                {['Immediate joiner', 'Upto 15 days', 'Upto 30 days', 'Upto 60 days', 'Upto 90 days'].map(np => {
                  const selected = modifyForm.noticePeriod.includes(np);
                  return (
                    <button
                      key={np}
                      type="button"
                      onClick={() => handleToggleModifyNotice(np)}
                      className={`text-[12px] px-2.5 py-1 rounded-lg border font-medium cursor-pointer transition-colors ${selected
                        ? 'bg-[#0A66C2] text-white border-[#0A66C2] shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                    >
                      {selected ? `✓ ${np}` : np}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleOpenFullSearchForm}
                className="text-[13px] font-bold text-[#0A66C2] hover:text-[#004182] flex items-center gap-1.5 hover:underline cursor-pointer py-1"
              >
                <SlidersHorizontal size={14} />
                <span>Open Full Search Form (All 50+ Filters)</span>
                <ArrowRight size={13} />
              </button>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setShowModifyModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-[13px] font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyModifySearch}
                  className="px-6 py-2 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-xl text-[13px] font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Search size={14} />
                  <span>Apply & Search</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Preview Popup Modal */}
      {previewImageModal && (
        <div
          onClick={() => setPreviewImageModal(null)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="rounded-3xl max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95 duration-200"
          >
            {/* Header with Title and Close */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewImageModal(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Centered Large Image */}
            <div className="flex items-center justify-center rounded-2xl overflow-hidden min-h-[280px]">
              <img
                src={previewImageModal.url}
                alt={previewImageModal.title || 'Profile Photo'}
                className="max-h-[60vh] max-w-full rounded-2xl object-contain shadow-md"
              />
            </div>
          </div>
        </div>
      )}

      {/* Candidate Compare Modal */}
      {compareModalOpen && (
        <div
          onClick={() => setCompareModalOpen(false)}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0A66C2] flex items-center justify-center">
                  <Layers size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-0">Compare Candidate Profiles</h3>
                  <p className="text-[12px] text-slate-500 mb-0">Comparing {comparedCandidates.length} candidate(s)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCompareModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-200/60 cursor-pointer transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content / Comparison Grid */}
            <div className="overflow-x-auto p-6 flex-1">
              {comparedCandidates.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <p className="font-semibold text-slate-700">No candidates in comparison</p>
                  <p className="text-[13px] text-slate-400 mt-1">Select candidates and choose &quot;Add to Compare&quot; from the menu.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 min-w-[600px]">
                  {comparedCandidates.map((cand, idx) => {
                    const rawImg = cand.profile_image || cand.profile_picture || cand.photo || cand.avatar || cand.image;
                    const candImgUrl = rawImg ? getImageUrl(rawImg) : null;
                    const initials = `${cand.first_name?.[0] || 'C'}${cand.last_name?.[0] || ''}`.toUpperCase();

                    return (
                      <div key={cand.id || idx} className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-4 flex flex-col justify-between space-y-4">
                        {/* Top: Remove button + Avatar + Name */}
                        <div>
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => setComparedCandidates(prev => prev.filter(c => c.id !== cand.id))}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 cursor-pointer transition-colors text-[11px]"
                              title="Remove from comparison"
                            >
                              <X size={14} />
                            </button>
                          </div>

                          <div className="text-center -mt-2">
                            {candImgUrl ? (
                              <img
                                src={candImgUrl}
                                alt={cand.first_name || 'Candidate'}
                                className="w-14 h-14 rounded-full object-cover mx-auto border-2 border-white shadow-sm"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-full bg-[#0A66C2] text-white flex items-center justify-center font-bold text-lg mx-auto shadow-sm">
                                {initials}
                              </div>
                            )}
                            <h4 className="text-[15px] font-bold text-slate-900 mt-2 mb-0">
                              {`${cand.first_name || ''} ${cand.last_name || ''}`.trim() || 'Candidate'}
                            </h4>
                            <p className="text-[12px] text-slate-500 font-medium mt-0.5 line-clamp-1 mb-0">
                              {cand.current_job_title || 'Software Professional'}
                            </p>
                            {cand.current_company && (
                              <p className="text-[11px] text-slate-400 mb-0 font-normal">at {cand.current_company}</p>
                            )}
                          </div>
                        </div>

                        {/* Details Comparison Rows */}
                        <div className="space-y-2.5 text-[12px] border-t border-slate-200/60 pt-3">
                          <div className="flex justify-between items-center text-slate-600">
                            <span className="text-slate-400">Experience:</span>
                            <span className="font-semibold text-slate-800">
                              {cand.experience_years !== undefined && cand.experience_years !== null
                                ? `${cand.experience_years}y ${cand.experience_months || 0}m`
                                : (cand.experience_display || '2 Years')}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-slate-600">
                            <span className="text-slate-400">Notice Period:</span>
                            <span className="font-semibold text-slate-800">
                              {cand.notice_period || '30 Days'}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-slate-600">
                            <span className="text-slate-400">Location:</span>
                            <span className="font-semibold text-slate-800 line-clamp-1 text-right">
                              {cand.location || cand.current_location || 'Bengaluru'}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-slate-600">
                            <span className="text-slate-400">Salary:</span>
                            <span className="font-semibold text-slate-800">
                              {cand.expected_salary || cand.current_salary || 'Competitive'}
                            </span>
                          </div>

                          {/* Key Skills */}
                          <div className="pt-1">
                            <span className="text-[11px] text-slate-400 block mb-1">Key Skills:</span>
                            <div className="flex flex-wrap gap-1">
                              {parseSkillsList(cand.skills).slice(0, 4).map((s, sIdx) => (
                                <span key={sIdx} className="px-1.5 py-0.5 rounded bg-white text-slate-700 text-[10px] font-medium border border-slate-200">
                                  {s}
                                </span>
                              ))}
                              {parseSkillsList(cand.skills).length === 0 && (
                                <span className="text-[11px] text-slate-400 italic">Not specified</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="pt-2 border-t border-slate-200/60 flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              handleOpenCandidateProfile(cand);
                            }}
                            className="flex-1 py-1.5 bg-blue-50 hover:bg-[#0A66C2] text-[#0A66C2] hover:text-white rounded-xl text-[11px] font-bold transition-all cursor-pointer text-center"
                          >
                            View Profile
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[12px] text-slate-500">
              <span>You can compare up to 5 candidate profiles simultaneously.</span>
              <button
                type="button"
                onClick={() => setCompareModalOpen(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-semibold cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Quota Limit Modal */}
      {quotaLimitModal && (
        <div
          onClick={() => setQuotaLimitModal(null)}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 text-center space-y-4 border border-slate-200/80 animate-in zoom-in-95 duration-200"
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border-1 border-amber-200 flex items-center justify-center mx-auto shadow-xs">
              {quotaLimitModal.type === 'contact' ? <Lock size={30} className="text-amber-600" /> : <Crown size={32} />}
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-900 mb-0">
                {quotaLimitModal.title || 'Plan Limit Reached'}
              </h3>
              <p className="text-[13px] text-slate-600 leading-relaxed mb-0">
                {quotaLimitModal.message}
              </p>
            </div>

            {quotaLimitModal.type === 'contact' ? (
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 flex items-center justify-around">
                <div>
                  <span className="text-slate-400 block text-[11px] mb-0.5">Feature</span>
                  <span className="font-bold text-slate-800 text-[13px]">Candidate Contact</span>
                </div>
                <div className="w-px h-6 bg-slate-200" />
                <div>
                  <span className="text-slate-400 block text-[11px] mb-0.5">Status</span>
                  <span className="font-bold text-amber-600 text-[13px] flex items-center gap-1 justify-center">
                    <Lock size={12} /> Locked
                  </span>
                </div>
                <div className="w-px h-6 bg-slate-200" />
                <div>
                  <span className="text-slate-400 block text-[11px] mb-0.5">Current Plan</span>
                  <span className="font-bold text-[#0A66C2] text-[13px]">{planTitle}</span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 flex items-center justify-around">
                <div>
                  <span className="text-slate-400 block text-[11px] mb-0.5">Views Left</span>
                  <span className="font-bold text-slate-800 text-[13px]">{resumeViewsRemaining}</span>
                </div>
                <div className="w-px h-6 bg-slate-200" />
                <div>
                  <span className="text-slate-400 block text-[11px] mb-0.5">Downloads Left</span>
                  <span className="font-bold text-slate-800 text-[13px]">{resumeDownloadsRemaining}</span>
                </div>
                <div className="w-px h-6 bg-slate-200" />
                <div>
                  <span className="text-slate-400 block text-[11px] mb-0.5">Active Plan</span>
                  <span className="font-bold text-[#0A66C2] text-[13px]">{planTitle}</span>
                </div>
              </div>
            )}

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setQuotaLimitModal(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 font-medium text-slate-600 text-sm hover:bg-slate-50 cursor-pointer transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuotaLimitModal(null);
                  router.push('/billing');
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#0A66C2] hover:bg-[#004182] font-medium text-white text-sm shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
              >
                <Crown size={14} /> Upgrade Plan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CandidateSearchResults;

