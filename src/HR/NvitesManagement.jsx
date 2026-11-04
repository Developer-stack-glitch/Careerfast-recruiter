'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Send, Users, Eye, CheckCircle2, XCircle, Clock,
  Search, RefreshCw, Filter, ArrowUpRight, ChevronRight,
  Briefcase, MapPin, Mail, Phone, ExternalLink, AlertTriangle,
  RotateCcw, Sparkles, Building2, User, X, LayoutGrid, List,
  Calendar, FileText, Check, Plus, ChevronDown, CheckSquare,
  Square, Zap, Info, ArrowRight, ArrowLeft, Bookmark,
  SlidersHorizontal, GraduationCap, Mic, MicOff, Trash2,
  AlertCircle, PlusCircle, Loader2
} from 'lucide-react';
import {
  getRecruiterNvitesAPI,
  resendNviteAPI,
  searchCandidatesAPI,
  getJobPostByUserId,
  getCandidateFilterOptionsAPI,
  saveHrSearch,
  deleteHrSearch,
  clearHrSearches
} from '../ApiService/action';
import { KeywordsAutocomplete, CheckboxDropdown, TwoPaneIndustryDropdown, CompanySearchDropdown, DegreeMultiSelect } from './CandidateSearchComponents';
import NeatSelect from '../Common/NeatSelect';
import { CommonToaster } from '../Common/CommonToaster';
import { getImageUrl } from '../utils/getImageUrl';
import SendNviteModal from '../Components/SendNviteModal';

// Clean location helper (removes stringified array brackets like ["Hyderabad"])
const cleanLocation = (loc) => {
  if (!loc) return '';
  try {
    if (typeof loc === 'string' && (loc.startsWith('[') || loc.startsWith('{'))) {
      const parsed = JSON.parse(loc);
      if (Array.isArray(parsed)) return parsed.filter(Boolean).join(', ');
      return String(parsed);
    }
  } catch (e) { }
  return String(loc).replace(/[\[\]"']/g, '').trim();
};

const ACTIVE_IN_OPTIONS = [
  { label: '3 days', value: '3' },
  { label: '7 days', value: '7' },
  { label: '15 days', value: '15' },
  { label: '30 days', value: '30' },
  { label: '2 months', value: '60' },
  { label: '3 months', value: '90' },
  { label: '6 months', value: '180' },
  { label: 'All time', value: 'All time' }
];

export default function NvitesManagement({ onSelectCandidateForProfile }) {
  const router = useRouter();
  // ── Top-level Tab Mode: 'send' (Naukri Search & Send) | 'manage' (Tracker & Funnel) ──
  const [activeTab, setActiveTab] = useState('send');

  // ── Unified Candidate Search State (Synced with CandidateSearch) ────────
  const initialParams = {
    keywords: [],
    booleanSearch: false,
    searchIn: 'Profile',
    excludeSynonyms: false,
    excludedKeywords: [],
    expMin: 'Years',
    expMax: 'Years',
    expMonthsMin: '0',
    expMonthsMax: '0',
    showMonths: false,
    location: [],
    includeRelocating: false,
    preferredLocations: [],
    salaryMin: 'Lacs',
    salaryMax: 'Lacs',
    salaryThousandsMin: '0',
    salaryThousandsMax: '0',
    showThousands: false,
    includeNotMentionedSalary: true,
    noticePeriod: [],
    withoutNoticePeriod: false,
    servingNoticePeriod: false,
    ugQualification: '',
    specificUG: [],
    pgQualification: '',
    specificPG: [],
    doctorateQualification: [],
    showDoctorate: false,
    industry: [],
    industryMatch: 'Current or past industry',
    company: [],
    companyMatch: 'Current employees',
    excludedCompanies: [],
    designation: '',
    designationMatch: 'Current designation',
    activeUpdated: '180',
    smartInsights: [],
    gender: [],
    differentlyAbled: [],
    languages: [],
    visaStatus: []
  };

  const [searchParams, setSearchParams] = useState(initialParams);

  // Sync params from URL query (if redirected from Candidate Search Results / Modify search)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const kw = urlParams.get('keywords');
      const loc = urlParams.get('location');
      const expMin = urlParams.get('expMin');
      const expMax = urlParams.get('expMax');
      const salMin = urlParams.get('salaryMin');
      const salMax = urlParams.get('salaryMax');
      const actUp = urlParams.get('activeUpdated');
      const jId = urlParams.get('jobId');
      const tab = urlParams.get('tab');

      if (kw || loc || expMin || expMax || salMin || salMax || actUp) {
        setSearchParams(prev => ({
          ...prev,
          keywords: kw ? kw.split(' ').filter(Boolean) : prev.keywords,
          location: loc ? loc.split(',').map(s => s.trim()).filter(Boolean) : prev.location,
          expMin: expMin || prev.expMin,
          expMax: expMax || prev.expMax,
          salaryMin: salMin || prev.salaryMin,
          salaryMax: salMax || prev.salaryMax,
          activeUpdated: actUp || prev.activeUpdated
        }));
      }
      if (jId) setTargetJobId(jId);
      if (tab === 'manage') setActiveTab('manage');
    } catch (e) {
      console.error('Error reading URL params:', e);
    }
  }, []);
  const [searchError, setSearchError] = useState('');

  // Tabs & Accordions inside Search Box
  const [searchTab, setSearchTab] = useState('Search form');
  const [rightTab, setRightTab] = useState('Recent searches');
  const [accordions, setAccordions] = useState({
    education: false,
    employment: false,
    insights: false,
    additional: false
  });

  // Dynamic Add Option States (Tags & Inputs)
  const [showExcludeKeywords, setShowExcludeKeywords] = useState(false);
  const [showPreferredLocationInput, setShowPreferredLocationInput] = useState(false);
  const [preferredLocationInput, setPreferredLocationInput] = useState('');
  const [showExcludeCompanyInput, setShowExcludeCompanyInput] = useState(false);
  const [excludeCompanyInput, setExcludeCompanyInput] = useState('');
  const [languageInput, setLanguageInput] = useState('');

  // JD Search & Voice Search States
  const [jobDescription, setJobDescription] = useState('');
  const [isExtractingJD, setIsExtractingJD] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');

  // Recent & Saved Searches
  const [recentSearches, setRecentSearches] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);
  const [saveSearchModal, setSaveSearchModal] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');

  // Filter Options loaded from Backend API & DB
  const [filterOptions, setFilterOptions] = useState({
    locations: ['Chennai', 'Bengaluru', 'Hyderabad', 'Mumbai', 'Delhi', 'Pune', 'Noida', 'Remote'],
    jobTitles: [],
    companies: [],
    industries: [],
    skills: [],
    courses: [],
    ugDegrees: ['B.Tech', 'B.E.', 'B.Sc', 'B.Com', 'BCA', 'BBA', 'BA', 'B.Pharm', 'MBBS', 'B.Arch', 'B.Design'],
    pgDegrees: ['M.Tech', 'ME', 'MBA', 'MCA', 'M.Sc', 'M.Com', 'MA', 'MS', 'CA (Chartered Accountant)', 'PG Diploma'],
    doctorateDegrees: ['PhD', 'Doctorate', 'Doctor of Science (D.Sc)', 'Doctor of Medicine (M.D.)', 'M.Phil', 'Post-Doctorate'],
    genders: ['Male', 'Female', 'Other']
  });

  // Recruiter's posted jobs for quick pre-fill
  const [postedJobs, setPostedJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  // Search execution & Candidate results
  const [searchingCandidates, setSearchingCandidates] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);
  const [targetJobId, setTargetJobId] = useState('');

  // Send Nvite Modal State
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [candidatesForModal, setCandidatesForModal] = useState([]);

  // ── Manage Sent NVites State ────────────────────────────────────────────
  const [loadingNvites, setLoadingNvites] = useState(false);
  const [nvites, setNvites] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    viewed: 0,
    accepted: 0,
    declined: 0,
    expired: 0
  });
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedMessageModal, setSelectedMessageModal] = useState(null);
  const [resendingId, setResendingId] = useState(null);

  const getLoggedInRecruiterId = () => {
    try {
      if (typeof window === 'undefined') return null;
      const stored = localStorage.getItem('loginDetails');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed?.id || parsed?.user_id || null;
      }
    } catch (e) { }
    return null;
  };

  // Load Recent & Saved searches from localStorage
  useEffect(() => {
    try {
      const recId = getLoggedInRecruiterId();
      if (recId) {
        const savedRecent = localStorage.getItem(`careerfast_recent_searches_${recId}`);
        if (savedRecent) setRecentSearches(JSON.parse(savedRecent));
        else setRecentSearches([]);

        const savedList = localStorage.getItem(`careerfast_saved_searches_${recId}`);
        if (savedList) setSavedSearches(JSON.parse(savedList));
        else setSavedSearches([]);
      } else {
        setRecentSearches([]);
        setSavedSearches([]);
      }
    } catch (e) {
      console.error('Error reading localStorage', e);
    }
  }, []);

  // Filter Options loaded from Backend API
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const res = await getCandidateFilterOptionsAPI();
        if (res?.data?.data) {
          setFilterOptions(res.data.data);
        }
      } catch (err) {
        console.error('Error loading filter options:', err);
      }
    };
    loadFilterOptions();
  }, []);

  // Fetch recruiter's posted jobs for pre-fill suggestions
  useEffect(() => {
    const fetchJobs = async () => {
      setLoadingJobs(true);
      try {
        let recruiterId = null;
        if (typeof window !== 'undefined') {
          const raw = localStorage.getItem('loginDetails');
          if (raw) recruiterId = JSON.parse(raw)?.id;
        }
        const res = await getJobPostByUserId({
          user_id: recruiterId,
          limit: 10,
          page: 1,
          statuses: JSON.stringify(['Active', 'active', 'Pending', 'approved'])
        });
        const jobList = res?.data?.data || res?.data || [];
        setPostedJobs(jobList);
      } catch (err) {
        console.error('Error fetching jobs for pre-fill:', err);
      } finally {
        setLoadingJobs(false);
      }
    };
    fetchJobs();
  }, []);

  // Fetch Sent NVites
  const fetchNvites = useCallback(async () => {
    setLoadingNvites(true);
    try {
      const res = await getRecruiterNvitesAPI({
        status: statusFilter,
        search: searchQuery.trim(),
        page,
        limit: 15
      });

      if (res?.success) {
        setNvites(res.data || []);
        setTotalCount(res.total || 0);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      console.error('Error fetching sent Nvites:', err);
      CommonToaster('Failed to load sent Nvites list', 'error');
    } finally {
      setLoadingNvites(false);
    }
  }, [statusFilter, searchQuery, page]);

  useEffect(() => {
    fetchNvites();
  }, [fetchNvites]);

  // Accordion Toggle
  const toggleAccordion = (name) => {
    setAccordions(prev => ({ ...prev, [name]: !prev[name] }));
  };

  // Pill Selection Toggle
  const handlePillToggle = (field, value, multi = true) => {
    if (searchError) setSearchError('');
    setSearchParams(prev => {
      const current = prev[field] || [];
      if (multi) {
        return {
          ...prev,
          [field]: current.includes(value)
            ? current.filter(item => item !== value)
            : [...current, value]
        };
      } else {
        return { ...prev, [field]: current === value ? '' : value };
      }
    });
  };

  // Tag Helpers
  const addTag = (field, value, clearInputFn) => {
    if (!value || !value.trim()) return;
    if (searchError) setSearchError('');
    const trimmed = value.trim();
    setSearchParams(prev => {
      const current = prev[field] || [];
      if (current.includes(trimmed)) return prev;
      return { ...prev, [field]: [...current, trimmed] };
    });
    clearInputFn('');
  };

  const removeTag = (field, itemToRemove) => {
    setSearchParams(prev => ({
      ...prev,
      [field]: (prev[field] || []).filter(item => item !== itemToRemove)
    }));
  };

  // Pill Component
  const Pill = ({ label, field, value, multi = true, isSmart = false }) => {
    const isSelected = multi ? (searchParams[field] || []).includes(value) : searchParams[field] === value;
    return (
      <button
        type="button"
        onClick={() => handlePillToggle(field, value, multi)}
        className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all border flex items-center gap-1.5 cursor-pointer select-none ${isSelected
          ? 'bg-[#0A66C2] text-white border-[#0A66C2] shadow-xs'
          : 'bg-white text-slate-700 border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/80'
          }`}
      >
        {isSelected && <Check size={13} className="stroke-[2.5]" />}
        <span>{label}</span>
        {isSmart && !isSelected && <PlusCircle size={13} className="text-slate-400" />}
      </button>
    );
  };

  // Count active filters
  const activeFilterCount = useMemo(() => [
    searchParams.keywords?.length > 0,
    (searchParams.expMin && searchParams.expMin !== 'Years' && searchParams.expMin !== 'Any'),
    (searchParams.expMax && searchParams.expMax !== 'Years' && searchParams.expMax !== 'Any'),
    searchParams.location?.length > 0,
    searchParams.preferredLocations?.length > 0,
    (searchParams.salaryMin && searchParams.salaryMin !== 'Lacs' && searchParams.salaryMin !== 'Any'),
    (searchParams.salaryMax && searchParams.salaryMax !== 'Lacs' && searchParams.salaryMax !== 'Any'),
    searchParams.noticePeriod?.length > 0,
    Boolean(searchParams.ugQualification) || searchParams.specificUG?.length > 0,
    Boolean(searchParams.pgQualification) || searchParams.specificPG?.length > 0,
    searchParams.doctorateQualification?.length > 0,
    searchParams.industry?.length > 0,
    searchParams.company?.length > 0,
    searchParams.excludedCompanies?.length > 0,
    Boolean(searchParams.designation && searchParams.designation.trim()),
    searchParams.gender?.length > 0,
    searchParams.differentlyAbled?.length > 0,
    searchParams.languages?.length > 0,
    searchParams.visaStatus?.length > 0,
    searchParams.smartInsights?.length > 0,
    searchParams.excludedKeywords?.length > 0
  ].filter(Boolean).length, [searchParams]);

  useEffect(() => {
    if (searchError && activeFilterCount > 0) {
      setSearchError('');
    }
  }, [activeFilterCount, searchError]);

  // Handle Search Candidates for NVite -> Navigates to Candidate Search Results page
  const handleSearchCandidates = (e, customParams = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const activeData = customParams || searchParams;

    // Validate that at least one keyword or filter is selected
    const hasAnyCriteria = [
      activeData.keywords?.length > 0,
      (activeData.expMin && activeData.expMin !== 'Years' && activeData.expMin !== 'Any'),
      (activeData.expMax && activeData.expMax !== 'Years' && activeData.expMax !== 'Any'),
      activeData.location?.length > 0,
      activeData.preferredLocations?.length > 0,
      (activeData.salaryMin && activeData.salaryMin !== 'Lacs' && activeData.salaryMin !== 'Any'),
      (activeData.salaryMax && activeData.salaryMax !== 'Lacs' && activeData.salaryMax !== 'Any'),
      activeData.noticePeriod?.length > 0,
      Boolean(activeData.ugQualification) || activeData.specificUG?.length > 0,
      Boolean(activeData.pgQualification) || activeData.specificPG?.length > 0,
      activeData.doctorateQualification?.length > 0,
      activeData.industry?.length > 0,
      activeData.company?.length > 0,
      activeData.excludedCompanies?.length > 0,
      Boolean(activeData.designation && activeData.designation.trim()),
      activeData.gender?.length > 0,
      activeData.differentlyAbled?.length > 0,
      activeData.languages?.length > 0,
      activeData.visaStatus?.length > 0,
      activeData.smartInsights?.length > 0,
      activeData.excludedKeywords?.length > 0
    ].some(Boolean);

    if (!hasAnyCriteria) {
      const errorMsg = 'Please enter keywords or select at least one filter before searching.';
      setSearchError(errorMsg);
      CommonToaster(errorMsg, 'warning');
      if (searchTab !== 'Search form') {
        setSearchTab('Search form');
      }
      return;
    }

    setSearchError('');
    const query = new URLSearchParams();

    if (activeData.keywords?.length > 0) query.set('keywords', activeData.keywords.join(' '));
    if (activeData.booleanSearch) query.set('booleanSearch', 'true');
    if (activeData.searchIn && activeData.searchIn !== 'Profile') query.set('searchIn', activeData.searchIn);
    if (activeData.excludeSynonyms) query.set('excludeSynonyms', 'true');
    if (activeData.excludedKeywords?.length > 0) query.set('excludedKeywords', activeData.excludedKeywords.join(','));

    if (activeData.location?.length > 0) query.set('location', activeData.location.join(','));
    if (activeData.includeRelocating) query.set('includeRelocating', 'true');
    if (activeData.preferredLocations?.length > 0) query.set('preferredLocations', activeData.preferredLocations.join(','));

    if (activeData.expMin && activeData.expMin !== 'Years') query.set('expMin', activeData.expMin);
    if (activeData.expMax && activeData.expMax !== 'Years') query.set('expMax', activeData.expMax);
    if (activeData.showMonths) {
      if (activeData.expMonthsMin) query.set('expMonthsMin', activeData.expMonthsMin);
      if (activeData.expMonthsMax) query.set('expMonthsMax', activeData.expMonthsMax);
    }

    if (activeData.salaryMin && activeData.salaryMin !== 'Lacs' && activeData.salaryMin !== 'Any') query.set('salaryMin', activeData.salaryMin);
    if (activeData.salaryMax && activeData.salaryMax !== 'Lacs' && activeData.salaryMax !== 'Any') query.set('salaryMax', activeData.salaryMax);

    if (activeData.noticePeriod?.length > 0) query.set('noticePeriod', activeData.noticePeriod.join(','));
    if (activeData.ugQualification) query.set('ugQualification', activeData.ugQualification);
    if (activeData.specificUG?.length > 0) {
      query.set('specificUG', Array.isArray(activeData.specificUG) ? activeData.specificUG.join(',') : activeData.specificUG);
    }
    if (activeData.pgQualification) query.set('pgQualification', activeData.pgQualification);
    if (activeData.specificPG?.length > 0) {
      query.set('specificPG', Array.isArray(activeData.specificPG) ? activeData.specificPG.join(',') : activeData.specificPG);
    }
    if (activeData.doctorateQualification?.length > 0) {
      query.set('doctorateQualification', Array.isArray(activeData.doctorateQualification) ? activeData.doctorateQualification.join(',') : activeData.doctorateQualification);
    }

    if (activeData.industry?.length > 0) query.set('industry', activeData.industry.join(','));
    if (activeData.company?.length > 0) query.set('company', activeData.company.join(','));
    if (activeData.excludedCompanies?.length > 0) query.set('excludedCompanies', activeData.excludedCompanies.join(','));
    if (activeData.designation) query.set('designation', activeData.designation);

    if (activeData.gender?.length > 0) query.set('gender', activeData.gender.join(','));
    if (activeData.differentlyAbled?.length > 0) query.set('differentlyAbled', activeData.differentlyAbled.join(','));
    if (activeData.languages?.length > 0) query.set('languages', activeData.languages.join(','));
    if (activeData.visaStatus?.length > 0) query.set('visaStatus', activeData.visaStatus.join(','));
    if (activeData.smartInsights?.length > 0) query.set('smartInsights', activeData.smartInsights.join(','));
    if (activeData.activeUpdated && activeData.activeUpdated !== 'All time') query.set('activeUpdated', activeData.activeUpdated);

    // NVite context
    query.set('from', 'nvite');
    if (targetJobId) {
      query.set('jobId', targetJobId);
    }

    // Persist to recent searches
    const summaryParts = [
      activeData.keywords?.length > 0 ? activeData.keywords.join(', ') : (activeData.designation || 'All Candidates'),
      activeData.location?.length > 0 ? activeData.location.slice(0, 2).join(', ') : null,
      (activeData.expMin && activeData.expMin !== 'Years') ? `${activeData.expMin}+ yrs` : null,
      activeData.noticePeriod?.length > 0 ? activeData.noticePeriod[0] : null
    ].filter(Boolean);

    const newRecent = {
      id: Date.now(),
      title: summaryParts.join(' • ') || 'Custom Search',
      timestamp: 'Just now',
      params: activeData
    };

    const updatedRecent = [newRecent, ...recentSearches.filter(r => r.title !== newRecent.title)].slice(0, 10);
    setRecentSearches(updatedRecent);
    try {
      const recId = getLoggedInRecruiterId();
      if (recId) {
        localStorage.setItem(`careerfast_recent_searches_${recId}`, JSON.stringify(updatedRecent));
        saveHrSearch({
          recruiter_id: recId,
          search_type: 'recent',
          query_title: newRecent.title,
          query_params: activeData
        }).catch(() => { });
      }
    } catch (e) { }

    // Navigate cleanly to Candidate Search Results page
    router.push(`/candidate-search/results?${query.toString()}`);
  };

  const handleClearAll = () => {
    setSearchParams(initialParams);
    setShowExcludeKeywords(false);
    setShowPreferredLocationInput(false);
    setShowExcludeCompanyInput(false);
    setPreferredLocationInput('');
    setExcludeCompanyInput('');
    setLanguageInput('');
    setSearchError('');
  };

  // Save Search Preset
  const handleSaveSearch = () => {
    if (!saveSearchName.trim()) return;
    const newSaved = {
      id: Date.now(),
      name: saveSearchName.trim(),
      timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      params: searchParams
    };
    const updated = [newSaved, ...savedSearches];
    setSavedSearches(updated);
    try {
      const recId = getLoggedInRecruiterId();
      if (recId) {
        localStorage.setItem(`careerfast_saved_searches_${recId}`, JSON.stringify(updated));
        saveHrSearch({
          recruiter_id: recId,
          search_type: 'saved',
          query_title: newSaved.name,
          query_params: searchParams
        }).catch(() => { });
      }
    } catch (e) { }
    setSaveSearchName('');
    setSaveSearchModal(false);
    CommonToaster('Search preset saved successfully!', 'success');
  };

  const handleDeleteSavedSearch = (id, e) => {
    if (e) e.stopPropagation();
    const updated = savedSearches.filter(s => s.id !== id);
    setSavedSearches(updated);
    try {
      const recId = getLoggedInRecruiterId();
      if (recId) {
        localStorage.setItem(`careerfast_saved_searches_${recId}`, JSON.stringify(updated));
        deleteHrSearch(id, recId).catch(() => { });
      }
    } catch (e) { }
  };

  const handleDeleteRecentSearch = (id, e) => {
    if (e) e.stopPropagation();
    const updated = recentSearches.filter(s => s.id !== id);
    setRecentSearches(updated);
    try {
      const recId = getLoggedInRecruiterId();
      if (recId) {
        localStorage.setItem(`careerfast_recent_searches_${recId}`, JSON.stringify(updated));
        deleteHrSearch(id, recId).catch(() => { });
      }
    } catch (e) { }
  };

  const handleClearAllRecentSearches = (e) => {
    if (e) e.stopPropagation();
    setRecentSearches([]);
    try {
      const recId = getLoggedInRecruiterId();
      if (recId) {
        localStorage.removeItem(`careerfast_recent_searches_${recId}`);
        clearHrSearches(recId, 'recent').catch(() => { });
      }
      localStorage.removeItem('careerfast_recent_searches');
    } catch (e) { }
  };

  // Job Description Parser
  const handleExtractFromJD = () => {
    if (!jobDescription.trim()) return;
    setIsExtractingJD(true);
    setTimeout(() => {
      const jdText = jobDescription.toLowerCase();
      const extractedKeywords = [];
      const knownSkills = ['react', 'node', 'javascript', 'python', 'java', 'sql', 'mysql', 'mongodb', 'aws', 'html', 'css', 'developer', 'designer', 'support', 'manager', 'lead', 'associate'];

      knownSkills.forEach(s => {
        if (jdText.includes(s)) {
          const cap = s.charAt(0).toUpperCase() + s.slice(1);
          if (!extractedKeywords.includes(cap)) extractedKeywords.push(cap);
        }
      });

      let expFound = 'Years';
      const expMatch = jdText.match(/(\d+)\+?\s*(?:to\s*(\d+))?\s*(?:years?|yrs?)/i);
      if (expMatch) {
        expFound = expMatch[1];
      }

      let locFound = [];
      ['chennai', 'bengaluru', 'bangalore', 'hyderabad', 'mumbai', 'delhi', 'pune'].forEach(city => {
        if (jdText.includes(city)) locFound.push(city.charAt(0).toUpperCase() + city.slice(1));
      });

      const updatedParams = {
        ...searchParams,
        keywords: extractedKeywords.length > 0 ? extractedKeywords : searchParams.keywords,
        expMin: expFound !== 'Years' ? expFound : searchParams.expMin,
        location: locFound.length > 0 ? locFound : searchParams.location
      };

      setSearchParams(updatedParams);
      setIsExtractingJD(false);
      setSearchTab('Search form');
      CommonToaster(`Extracted ${extractedKeywords.length} skills from JD`, 'success');
      handleSearchCandidates(null, updatedParams);
    }, 1200);
  };

  // Voice Search Handler
  const toggleVoiceListening = () => {
    if (!isListening) {
      setIsListening(true);
      setVoiceTranscript("Listening to your voice...");

      const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.lang = 'en-IN';
          recognition.interimResults = false;
          recognition.maxAlternatives = 1;

          recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setVoiceTranscript(`"${transcript}"`);
            parseVoiceQuery(transcript);
            setIsListening(false);
          };

          recognition.onerror = () => {
            setIsListening(false);
          };

          recognition.start();
          return;
        } catch (err) {
          console.warn("Speech recognition error:", err);
        }
      }

      setTimeout(() => {
        const simulated = "React developer in Chennai with 2 years experience";
        setVoiceTranscript(`"${simulated}"`);
        parseVoiceQuery(simulated);
        setIsListening(false);
      }, 2400);
    } else {
      setIsListening(false);
    }
  };

  const parseVoiceQuery = (text) => {
    const lower = text.toLowerCase();
    let kw = [];
    if (lower.includes('react')) kw.push('React');
    if (lower.includes('python')) kw.push('Python');
    if (lower.includes('developer')) kw.push('Developer');
    if (lower.includes('associate')) kw.push('Associate');
    if (lower.includes('designer')) kw.push('Designer');

    let exp = 'Years';
    if (lower.includes('1 year')) exp = '1';
    if (lower.includes('2 year')) exp = '2';
    if (lower.includes('3 year')) exp = '3';
    if (lower.includes('5 year')) exp = '5';

    let locs = [];
    ['chennai', 'bengaluru', 'bangalore', 'hyderabad', 'mumbai', 'delhi', 'pune'].forEach(city => {
      if (lower.includes(city)) locs.push(city.charAt(0).toUpperCase() + city.slice(1));
    });

    setSearchParams(prev => ({
      ...prev,
      keywords: kw.length > 0 ? kw : prev.keywords,
      expMin: exp !== 'Years' ? exp : prev.expMin,
      location: locs.length > 0 ? locs : prev.location
    }));
  };

  // Pre-fill search details from a posted job
  const handlePreFillJob = (job) => {
    if (!job) return;
    const kw = [];
    if (job.job_title || job.title) kw.push(job.job_title || job.title);
    const cleanSkills = typeof job.skills === 'string'
      ? job.skills.split(',').map(s => s.trim()).filter(Boolean)
      : Array.isArray(job.skills)
        ? job.skills
        : [];
    cleanSkills.forEach(s => {
      if (!kw.includes(s)) kw.push(s);
    });

    const loc = cleanLocation(job.location || job.job_location || '');
    const locArray = loc ? loc.split(',').map(s => s.trim()).filter(Boolean) : [];

    setSearchParams(prev => ({
      ...prev,
      keywords: kw,
      expMin: job.experience_min ?? job.min_experience ?? '0',
      expMax: job.experience_max ?? job.max_experience ?? 'Years',
      location: locArray.length > 0 ? locArray : prev.location
    }));
    setSearchTab('Search form');
    setTargetJobId(String(job.id));
    CommonToaster(`Pre-filled search details from "${job.job_title || job.title}"`, 'success');
  };

  // Pre-fill search details from recent Nvites
  const handlePreFillNvite = (nvite) => {
    if (!nvite) return;
    const kw = nvite.job_title ? [nvite.job_title] : [];
    const loc = cleanLocation(nvite.job_location || '');
    const locArray = loc ? loc.split(',').map(s => s.trim()).filter(Boolean) : [];

    setSearchParams(prev => ({
      ...prev,
      keywords: kw.length > 0 ? kw : prev.keywords,
      location: locArray.length > 0 ? locArray : prev.location
    }));
    setSearchTab('Search form');
    if (nvite.job_id) setTargetJobId(String(nvite.job_id));
    CommonToaster(`Pre-filled search details from "${nvite.job_title}"`, 'success');
  };

  // Pre-fill from fallback mock list if empty
  const handlePreFillMock = (mock) => {
    setSearchParams(prev => ({
      ...prev,
      keywords: mock.title ? [mock.title] : prev.keywords,
      expMin: mock.expMin || '0',
      expMax: mock.expMax || 'Years',
      location: mock.location ? [mock.location] : prev.location
    }));
    setSearchTab('Search form');
    CommonToaster(`Pre-filled search details for "${mock.title}"`, 'success');
  };

  // Candidate Selection Handling
  const handleToggleSelectCandidate = (candId) => {
    setSelectedCandidateIds(prev =>
      prev.includes(candId) ? prev.filter(id => id !== candId) : [...prev, candId]
    );
  };

  const handleSelectAllCandidates = () => {
    if (candidates.length === 0) return;
    if (selectedCandidateIds.length === candidates.length) {
      setSelectedCandidateIds([]);
    } else {
      setSelectedCandidateIds(candidates.map(c => c.id || c.user_id));
    }
  };

  // Open Send Modal for selected candidates
  const handleOpenSendModal = (targetCandidates) => {
    if (!targetCandidates || targetCandidates.length === 0) {
      CommonToaster('Please select at least one candidate to invite.', 'warning');
      return;
    }
    setCandidatesForModal(targetCandidates);
    setSendModalOpen(true);
  };

  const handleResend = async (nviteId) => {
    setResendingId(nviteId);
    try {
      const res = await resendNviteAPI(nviteId);
      CommonToaster(res?.message || 'Nvite resent successfully!', 'success');
      fetchNvites();
    } catch (err) {
      console.error('Error resending Nvite:', err);
      CommonToaster(err?.response?.data?.message || 'Failed to resend Nvite', 'error');
    } finally {
      setResendingId(null);
    }
  };

  const conversionRate = stats.total > 0
    ? Math.round((stats.accepted / stats.total) * 100)
    : 0;

  const activeInLabel = useMemo(() => {
    const val = searchParams.activeUpdated || '180';
    const found = ACTIVE_IN_OPTIONS.find(o => o.value === val);
    return found ? found.label : `${val} days`;
  }, [searchParams.activeUpdated]);

  // Selected candidates objects
  const selectedCandidatesList = useMemo(() => {
    return candidates.filter(c => selectedCandidateIds.includes(c.id || c.user_id));
  }, [candidates, selectedCandidateIds]);

  return (
    <div className="space-y-6 text-slate-800" style={{ fontFamily: "var(--font-geist), 'Geist', sans-serif" }}>

      {/* ── Top Level Tabs: Naukri Resdex Header ────────────────────── */}
      <div className="border-b border-slate-200/90 pb-0 mb-2">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-[#0A66C2] border border-blue-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0A66C2] animate-pulse" />
                Candidate Outreach
              </span>
              <span className="text-[12px] font-normal text-slate-400">
                Resdex Direct Invitations
              </span>
            </div>
            <h1 className="text-2xl sm:text-[25px] font-semibold tracking-tight text-slate-900 mb-0">
              Candidate Nvites
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={fetchNvites}
              title="Refresh invitations data"
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-[#0A66C2] hover:border-blue-200 transition-all shadow-2xs cursor-pointer"
            >
              <RefreshCw size={15} className={loadingNvites ? 'animate-spin text-[#0A66C2]' : ''} />
            </button>
            {activeTab === 'manage' && (
              <button
                type="button"
                onClick={() => setActiveTab('send')}
                className="px-3.5 py-2 rounded-xl bg-[#0A66C2] hover:bg-[#084e96] text-white font-medium text-[13px] shadow-2xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={15} />
                <span>Search & Send NVite</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab navigation pills */}
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('send')}
            className={`pb-3 text-[14px] transition-all cursor-pointer relative font-medium ${activeTab === 'send'
              ? 'text-[#0A66C2] font-semibold'
              : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            <span>Send NVite</span>
            {activeTab === 'send' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0A66C2] rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manage')}
            className={`pb-3 text-[14px] transition-all cursor-pointer relative font-medium flex items-center gap-2 ${activeTab === 'manage'
              ? 'text-[#0A66C2] font-semibold'
              : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            <span>Manage Sent NVites</span>
            {stats.total > 0 && (
              <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-medium ${activeTab === 'manage' ? 'bg-blue-100 text-[#0A66C2]' : 'bg-slate-100 text-slate-600'
                }`}>
                {stats.total}
              </span>
            )}
            {activeTab === 'manage' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0A66C2] rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 1: SEND NVITE (Naukri-Style Search & Select Candidate) ── */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'send' && (
        <div className="space-y-6 pb-24 sm:pb-32">

          {/* Top Search Card Header */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0A66C2] text-white flex items-center justify-center shadow-sm">
                <Search size={20} className="stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-[19px] sm:text-[20px] mb-0 font-semibold text-slate-900 tracking-tight">
                    Candidate Search for NVite
                  </h2>
                  <span className="bg-blue-50 text-[#0A66C2] text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-blue-200/70">
                    Talent Discovery
                  </span>
                </div>
                <p className="text-[13px] text-slate-500 mb-0">
                  Filter, source and match verified candidates across tech, design and business domains to send NVites
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center">
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-[13px] text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <RotateCcw size={14} />
                  <span>Reset Filters</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSaveSearchModal(true)}
                className="text-[13px] text-[#0A66C2] bg-blue-50 hover:bg-blue-100/80 border border-blue-200/80 font-semibold flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all shadow-2xs cursor-pointer"
              >
                <Bookmark size={14} />
                <span>Save Search</span>
              </button>
            </div>
          </div>

          {/* Main 2-Column Search Layout */}
          <div className="flex flex-col lg:flex-row gap-6 items-start">

            {/* Left Column - Main Search Form & Accordions */}
            <div className="flex-1 w-full space-y-4">

              {/* Main Search Parameters Card */}
              <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-visible relative">

                {/* Tabs Container */}
                <div className="px-6 pt-4 pb-0 border-b border-slate-100 bg-slate-50/40 rounded-t-2xl">
                  <div className="flex gap-2">
                    {[
                      { name: 'Search form', icon: SlidersHorizontal },
                      { name: 'Search by Job Description', icon: FileText },
                      { name: 'AI Voice Search', icon: Mic, badge: 'AI' }
                    ].map(tab => {
                      const Icon = tab.icon;
                      const isActive = searchTab === tab.name;
                      return (
                        <button
                          key={tab.name}
                          type="button"
                          onClick={() => setSearchTab(tab.name)}
                          className={`px-4 py-2.5 rounded-t-xl text-[13px] font-semibold transition-all relative flex items-center gap-2 cursor-pointer border-t border-x ${isActive
                            ? 'bg-white text-[#0A66C2] border-slate-200/80 shadow-xs z-10'
                            : 'bg-transparent text-slate-500 border-transparent hover:text-slate-800'
                            }`}
                        >
                          <Icon size={15} className={isActive ? 'text-[#0A66C2]' : 'text-slate-400'} />
                          <span>{tab.name}</span>
                          {tab.badge && (
                            <span className="bg-[#0A66C2] text-white text-[10px] px-1.5 py-0.2 rounded font-bold">
                              {tab.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Form Content */}
                <div className="p-6 sm:p-8 space-y-7">

                  {/* TAB 1: Main Search Form */}
                  {searchTab === 'Search form' && (
                    <>
                      {/* SECTION 1: Keywords & Search Targets */}
                      <div id="keywords-section" className="space-y-4 scroll-mt-28">
                        {searchError && (
                          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[13px] font-semibold animate-in fade-in slide-in-from-top-1 duration-200 shadow-2xs">
                            <AlertCircle size={18} className="shrink-0 text-rose-600" />
                            <span className="flex-1">{searchError}</span>
                            <button
                              type="button"
                              onClick={() => setSearchError('')}
                              className="text-rose-400 hover:text-rose-600 p-0.5 rounded cursor-pointer transition-colors"
                            >
                              <X size={15} />
                            </button>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <label className="text-[14px] font-bold text-slate-900 flex items-center gap-2">
                            <span>Keywords & Core Skills</span>
                            <span className="text-rose-500">*</span>
                            {searchError && (
                              <span className="text-[11px] font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">
                                Please enter keywords or pick a filter
                              </span>
                            )}
                          </label>
                          <div className="flex items-center gap-4 text-[13px] text-slate-600">
                            <label
                              onClick={() => setSearchParams(p => ({ ...p, booleanSearch: !p.booleanSearch }))}
                              className="flex items-center gap-2 cursor-pointer select-none"
                            >
                              <div className={`w-8 h-4 rounded-full flex items-center p-0.5 transition-colors ${searchParams.booleanSearch ? 'bg-[#0A66C2]' : 'bg-slate-300'}`}>
                                <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${searchParams.booleanSearch ? 'translate-x-4' : 'translate-x-0'}`} />
                              </div>
                              <span className="font-medium text-slate-700">Boolean Search</span>
                            </label>
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-500">In:</span>
                              <NeatSelect
                                value={searchParams.searchIn}
                                onChange={(val) => setSearchParams(p => ({ ...p, searchIn: val }))}
                                size="sm"
                                options={[
                                  { value: 'Profile', label: 'Entire Profile' },
                                  { value: 'Resume', label: 'Resume Text' },
                                  { value: 'Both', label: 'Both Profile & Resume' },
                                ]}
                                minWidth="140px"
                              />
                            </div>
                          </div>
                        </div>

                        <KeywordsAutocomplete
                          selectedTags={searchParams.keywords}
                          onChange={tags => {
                            setSearchParams(p => ({ ...p, keywords: tags }));
                            if (searchError) setSearchError('');
                          }}
                          hasError={Boolean(searchError)}
                          placeholder="Enter keywords e.g. React, Node.js, Python, Product Designer, Chennai..."
                          suggestions={['React', 'Node.js', 'Python', 'Java', 'Data Science', 'Angular', 'Vue.js', 'SQL', 'AWS', 'DevOps', 'Product Manager']}
                        />

                        {/* Synonyms & Exclusions */}
                        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                          <label
                            onClick={() => setSearchParams(p => ({ ...p, excludeSynonyms: !p.excludeSynonyms }))}
                            className="flex items-center gap-2 cursor-pointer text-[13px] text-slate-600 select-none hover:text-slate-900"
                          >
                            <div className={`w-8 h-4 rounded-full flex items-center p-0.5 transition-colors ${searchParams.excludeSynonyms ? 'bg-[#0A66C2]' : 'bg-slate-300'}`}>
                              <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${searchParams.excludeSynonyms ? 'translate-x-4' : 'translate-x-0'}`} />
                            </div>
                            <span className="font-medium">Exclude synonyms</span>
                            <Info size={13} className="text-slate-400" />
                          </label>

                          {!showExcludeKeywords ? (
                            <button
                              type="button"
                              onClick={() => setShowExcludeKeywords(true)}
                              className="text-[13px] text-[#0A66C2] hover:text-[#004182] flex items-center gap-1 font-semibold cursor-pointer"
                            >
                              <PlusCircle size={14} /> Add keywords to exclude
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setShowExcludeKeywords(false)}
                              className="text-[12px] text-slate-500 hover:text-slate-700 cursor-pointer"
                            >
                              Hide excluded keywords
                            </button>
                          )}
                        </div>

                        {showExcludeKeywords && (
                          <div className="bg-rose-50/40 border border-rose-200/70 p-3.5 rounded-xl space-y-2 animate-in fade-in duration-150">
                            <div className="flex justify-between items-center">
                              <span className="text-[12px] font-bold text-rose-800 flex items-center gap-1.5">
                                <X size={13} /> Excluded Keywords (Profiles with these terms won&apos;t appear)
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowExcludeKeywords(false)}
                                className="text-[11px] text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
                              >
                                Close
                              </button>
                            </div>
                            <KeywordsAutocomplete
                              selectedTags={searchParams.excludedKeywords}
                              onChange={tags => setSearchParams(p => ({ ...p, excludedKeywords: tags }))}
                              placeholder="Type keyword to exclude and press Enter..."
                              suggestions={['Intern', 'Trainee', 'Consultant', 'Junior', 'Freelancer']}
                              isExclude={true}
                            />
                          </div>
                        )}
                      </div>

                      <hr className="border-slate-100" />

                      {/* SECTION 2: Experience Level */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="text-[14px] font-bold text-slate-900 flex items-center gap-2">
                            <Briefcase size={16} className="text-[#0A66C2]" /> Experience Level
                          </label>
                          <button
                            type="button"
                            onClick={() => setSearchParams(p => ({ ...p, showMonths: !p.showMonths }))}
                            className="text-[12px] text-[#0A66C2] hover:text-[#004182] font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <PlusCircle size={13} /> {searchParams.showMonths ? 'Hide Months' : 'Specify Months'}
                          </button>
                        </div>

                        {/* Quick Preset Buttons */}
                        <div className="flex flex-wrap gap-2">
                          <span className="text-[12px] text-slate-400 font-medium self-center mr-1">Quick presets:</span>
                          {[
                            { label: 'Fresher', min: '0', max: '1' },
                            { label: '1 - 3 Yrs', min: '1', max: '3' },
                            { label: '3 - 5 Yrs', min: '3', max: '5' },
                            { label: '5 - 8 Yrs', min: '5', max: '8' },
                            { label: '8+ Yrs', min: '8', max: '15' }
                          ].map(preset => {
                            const isPresetActive = searchParams.expMin === preset.min && searchParams.expMax === preset.max;
                            return (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() => setSearchParams(p => ({
                                  ...p,
                                  expMin: isPresetActive ? 'Years' : preset.min,
                                  expMax: isPresetActive ? 'Years' : preset.max
                                }))}
                                className={`px-3 py-1 rounded-lg text-[12px] font-semibold border transition-all cursor-pointer ${isPresetActive
                                  ? 'bg-blue-50 border-blue-300 text-[#0A66C2]'
                                  : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100'
                                  }`}
                              >
                                {preset.label}
                              </button>
                            );
                          })}
                        </div>

                        {/* Custom Min - Max Dropdowns */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <span className="text-[12px] font-semibold text-slate-500 mb-1.5 block">Minimum Experience</span>
                            <div className="flex gap-2">
                              <NeatSelect
                                className="flex-1"
                                value={searchParams.expMin}
                                onChange={(val) => setSearchParams(p => ({ ...p, expMin: val }))}
                                options={[
                                  { value: 'Years', label: 'Any Min Experience' },
                                  ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15].map(n => ({
                                    value: n,
                                    label: `${n} ${n === 1 ? 'Year' : 'Years'}`
                                  }))
                                ]}
                              />
                              {searchParams.showMonths && (
                                <NeatSelect
                                  className="w-28"
                                  value={searchParams.expMonthsMin}
                                  onChange={(val) => setSearchParams(p => ({ ...p, expMonthsMin: val }))}
                                  options={[...Array(12)].map((_, i) => ({
                                    value: i,
                                    label: `${i} Mos`
                                  }))}
                                />
                              )}
                            </div>
                          </div>

                          <div>
                            <span className="text-[12px] font-semibold text-slate-500 mb-1.5 block">Maximum Experience</span>
                            <div className="flex gap-2">
                              <NeatSelect
                                className="flex-1"
                                value={searchParams.expMax}
                                onChange={(val) => setSearchParams(p => ({ ...p, expMax: val }))}
                                options={[
                                  { value: 'Years', label: 'Any Max Experience' },
                                  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25].map(n => ({
                                    value: n,
                                    label: `${n} Years`
                                  }))
                                ]}
                              />
                              {searchParams.showMonths && (
                                <NeatSelect
                                  className="w-28"
                                  value={searchParams.expMonthsMax}
                                  onChange={(val) => setSearchParams(p => ({ ...p, expMonthsMax: val }))}
                                  options={[...Array(12)].map((_, i) => ({
                                    value: i,
                                    label: `${i} Mos`
                                  }))}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <hr className="border-slate-100" />

                      {/* SECTION 3: Location & Preferences */}
                      <div className="space-y-4">
                        <label className="text-[14px] font-bold text-slate-900 flex items-center gap-2">
                          <MapPin size={16} className="text-[#0A66C2]" /> Location & Preferences
                        </label>

                        <div className="z-40 relative">
                          <CheckboxDropdown
                            selectedOptions={searchParams.location}
                            onChange={opts => setSearchParams(p => ({ ...p, location: opts }))}
                            placeholder="Select target cities e.g. Chennai, Bengaluru, Hyderabad..."
                            labelTitle="Major Hubs"
                            options={['Ahmedabad', 'Bengaluru', 'Chennai', 'Delhi NCR', 'Gurugram', 'Hyderabad', 'Kolkata', 'Mumbai', 'Noida', 'Pune', 'Remote']}
                          />
                        </div>

                        {/* Popular City Quick Badges */}
                        <div className="flex flex-wrap gap-1.5 items-center">
                          <span className="text-[12px] text-slate-400 font-medium mr-1">Popular hubs:</span>
                          {['Chennai', 'Bengaluru', 'Hyderabad', 'Pune', 'Mumbai', 'Remote'].map(city => {
                            const isSelected = searchParams.location.includes(city);
                            return (
                              <button
                                key={city}
                                type="button"
                                onClick={() => {
                                  setSearchParams(p => ({
                                    ...p,
                                    location: isSelected ? p.location.filter(c => c !== city) : [...p.location, city]
                                  }));
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[12px] font-medium border transition-colors cursor-pointer ${isSelected
                                  ? 'bg-blue-50 border-blue-300 text-[#0A66C2] font-semibold'
                                  : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100'
                                  }`}
                              >
                                {city}
                              </button>
                            );
                          })}
                        </div>

                        {/* Relocation & Preferred Location */}
                        <div className="flex flex-wrap items-center gap-6 pt-1">
                          <label
                            onClick={() => setSearchParams(p => ({ ...p, includeRelocating: !p.includeRelocating }))}
                            className="flex items-center gap-2 cursor-pointer text-[13px] text-slate-700 font-medium select-none hover:text-slate-900"
                          >
                            <div className={`w-8 h-4 rounded-full flex items-center p-0.5 transition-colors ${searchParams.includeRelocating ? 'bg-[#0A66C2]' : 'bg-slate-300'}`}>
                              <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${searchParams.includeRelocating ? 'translate-x-4' : 'translate-x-0'}`} />
                            </div>
                            Include candidates willing to relocate
                          </label>

                          {!showPreferredLocationInput ? (
                            <button
                              type="button"
                              onClick={() => setShowPreferredLocationInput(true)}
                              className="text-[13px] text-[#0A66C2] hover:text-[#004182] flex items-center gap-1 font-semibold cursor-pointer"
                            >
                              <PlusCircle size={14} /> Add preferred locations
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setShowPreferredLocationInput(false)}
                              className="text-[12px] text-slate-500 hover:text-slate-700 cursor-pointer"
                            >
                              Hide preferred locations
                            </button>
                          )}
                        </div>

                        {showPreferredLocationInput && (
                          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Type preferred location (e.g. Coimbatore, Kochi) and press Enter"
                                value={preferredLocationInput}
                                onChange={e => setPreferredLocationInput(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addTag('preferredLocations', preferredLocationInput, setPreferredLocationInput);
                                  }
                                }}
                                className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-[13px] focus:outline-none focus:border-[#0A66C2]"
                              />
                              <button
                                type="button"
                                onClick={() => addTag('preferredLocations', preferredLocationInput, setPreferredLocationInput)}
                                className="px-4 py-1.5 bg-[#0A66C2] text-white text-[13px] font-semibold rounded-lg hover:bg-[#004182] cursor-pointer"
                              >
                                Add
                              </button>
                            </div>
                            {searchParams.preferredLocations.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {searchParams.preferredLocations.map(loc => (
                                  <span key={loc} className="bg-white text-[#0A66C2] border border-blue-200 text-[12px] px-2.5 py-0.5 rounded-full flex items-center gap-1.5 font-medium shadow-2xs">
                                    {loc}
                                    <X size={12} className="cursor-pointer hover:text-rose-600" onClick={() => removeTag('preferredLocations', loc)} />
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <hr className="border-slate-100" />

                      {/* SECTION 4: Annual CTC */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="text-[14px] font-bold text-slate-900 flex items-center gap-2">
                            <span>Annual CTC / Compensation (₹ INR)</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => setSearchParams(p => ({ ...p, showThousands: !p.showThousands }))}
                            className="text-[12px] text-[#0A66C2] hover:text-[#004182] font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <PlusCircle size={13} /> {searchParams.showThousands ? 'Hide Thousands' : 'Specify Thousands'}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <span className="text-[12px] font-semibold text-slate-500 mb-1.5 block">Minimum Salary</span>
                            <div className="flex gap-2">
                              <NeatSelect
                                className="flex-1"
                                value={searchParams.salaryMin}
                                onChange={(val) => setSearchParams(p => ({ ...p, salaryMin: val }))}
                                options={[
                                  { value: 'Lacs', label: 'Any Min Salary' },
                                  { value: 'Any', label: '0 (Fresher)' },
                                  ...[1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20, 25, 30, 40, 50].map(s => ({
                                    value: s,
                                    label: `${s} Lakhs / year`
                                  }))
                                ]}
                              />
                              {searchParams.showThousands && (
                                <NeatSelect
                                  className="w-28"
                                  value={searchParams.salaryThousandsMin}
                                  onChange={(val) => setSearchParams(p => ({ ...p, salaryThousandsMin: val }))}
                                  options={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90].map(t => ({
                                    value: t,
                                    label: `${t} K`
                                  }))}
                                />
                              )}
                            </div>
                          </div>

                          <div>
                            <span className="text-[12px] font-semibold text-slate-500 mb-1.5 block">Maximum Salary</span>
                            <div className="flex gap-2">
                              <NeatSelect
                                className="flex-1"
                                value={searchParams.salaryMax}
                                onChange={(val) => setSearchParams(p => ({ ...p, salaryMax: val }))}
                                options={[
                                  { value: 'Lacs', label: 'Any Max Salary' },
                                  { value: 'Any', label: 'No Upper Limit' },
                                  ...[2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20, 25, 30, 40, 50, 75, 100].map(s => ({
                                    value: s,
                                    label: `${s} Lakhs / year`
                                  }))
                                ]}
                              />
                              {searchParams.showThousands && (
                                <NeatSelect
                                  className="w-28"
                                  value={searchParams.salaryThousandsMax}
                                  onChange={(val) => setSearchParams(p => ({ ...p, salaryThousandsMax: val }))}
                                  options={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90].map(t => ({
                                    value: t,
                                    label: `${t} K`
                                  }))}
                                />
                              )}
                            </div>
                          </div>
                        </div>

                        <label
                          onClick={() => setSearchParams(p => ({ ...p, includeNotMentionedSalary: !p.includeNotMentionedSalary }))}
                          className="flex items-center gap-2 cursor-pointer text-[13px] text-slate-600 font-medium select-none hover:text-slate-900"
                        >
                          <div className={`w-8 h-4 rounded-full flex items-center p-0.5 transition-colors ${searchParams.includeNotMentionedSalary ? 'bg-[#0A66C2]' : 'bg-slate-300'}`}>
                            <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${searchParams.includeNotMentionedSalary ? 'translate-x-4' : 'translate-x-0'}`} />
                          </div>
                          Include profiles who have not mentioned current salary
                        </label>
                      </div>

                      <hr className="border-slate-100" />

                      {/* SECTION 5: Notice Period */}
                      <div className="space-y-3">
                        <label className="text-[14px] font-semibold text-slate-700 block">
                          Notice period
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {['Immediate joiner', 'Upto 15 days', 'Upto 30 days', 'Upto 45 days', 'Upto 60 days', 'Upto 90 days', 'Any'].map(np => (
                            <Pill key={np} label={np} field="noticePeriod" value={np} />
                          ))}
                        </div>

                        {/* Include candidates toggles */}
                        <div className="flex flex-wrap items-center gap-5 pt-1 text-[13px] text-slate-600 font-medium">
                          <span className="text-slate-500">Include candidates:</span>
                          <label
                            onClick={() => setSearchParams(p => ({ ...p, withoutNoticePeriod: !p.withoutNoticePeriod }))}
                            className="flex items-center gap-2 cursor-pointer select-none hover:text-slate-900"
                          >
                            <div className={`w-8 h-4 rounded-full flex items-center p-0.5 transition-colors ${searchParams.withoutNoticePeriod ? 'bg-[#0A66C2]' : 'bg-slate-300'}`}>
                              <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${searchParams.withoutNoticePeriod ? 'translate-x-4' : 'translate-x-0'}`} />
                            </div>
                            <span>Without notice period</span>
                          </label>
                          <label
                            onClick={() => setSearchParams(p => ({ ...p, servingNoticePeriod: !p.servingNoticePeriod }))}
                            className="flex items-center gap-2 cursor-pointer select-none hover:text-slate-900"
                          >
                            <div className={`w-8 h-4 rounded-full flex items-center p-0.5 transition-colors ${searchParams.servingNoticePeriod ? 'bg-[#0A66C2]' : 'bg-slate-300'}`}>
                              <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${searchParams.servingNoticePeriod ? 'translate-x-4' : 'translate-x-0'}`} />
                            </div>
                            <span>Serving notice period</span>
                          </label>
                        </div>
                      </div>
                    </>
                  )}

                  {/* TAB 2: Search by Job Description */}
                  {searchTab === 'Search by Job Description' && (
                    <div className="space-y-6">
                      <div className="bg-gradient-to-r from-blue-50/80 to-blue-50/30 p-4 rounded-2xl border border-blue-100 flex items-start gap-4">
                        <div className="p-2.5 rounded-xl bg-white text-[#0A66C2] shadow-2xs">
                          <Sparkles size={22} className="stroke-[2.5]" />
                        </div>
                        <div>
                          <h3 className="text-[16px] font-semibold text-slate-900 mb-0.5">AI Job Description Matcher</h3>
                          <p className="text-[13px] text-slate-600 leading-relaxed mb-0">
                            Simply paste your job description below. CareerFast will parse role requirements, key skills, experience level, and locations to find candidates with the highest matching score to send NVites.
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[14px] font-bold text-slate-900 mb-2">Paste Full Job Description</label>
                        <textarea
                          rows={9}
                          placeholder="e.g. We are looking for a Senior React Developer with 3+ years experience in building high scale web applications, proficiency with TypeScript, Redux, Tailwind and Node.js. Location: Chennai / Hybrid..."
                          value={jobDescription}
                          onChange={e => setJobDescription(e.target.value)}
                          className="w-full border border-slate-200 hover:border-slate-300 rounded-2xl p-4 text-[14px] focus:outline-none focus:border-[#0A66C2] focus:ring-2 focus:ring-blue-500/15 transition-all leading-relaxed text-slate-800 shadow-2xs font-sans"
                        />
                      </div>

                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setJobDescription('')}
                          className="px-5 py-2.5 text-slate-500 hover:text-slate-800 text-[13px] font-semibold cursor-pointer rounded-xl hover:bg-slate-100 transition-colors"
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          disabled={isExtractingJD || !jobDescription.trim()}
                          onClick={handleExtractFromJD}
                          className={`px-4 py-2.5 bg-[#0A66C2] hover:bg-[#004182] text-white font-medium rounded-xl text-[14px] flex items-center gap-2 cursor-pointer transition-all shadow-md hover:shadow-lg ${(!jobDescription.trim() || isExtractingJD) ? 'opacity-60 cursor-not-allowed' : ''
                            }`}
                        >
                          {isExtractingJD ? (
                            <>Analyzing & Parsing JD...</>
                          ) : (
                            <>Extract & Match Candidates <ArrowRight size={16} /></>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: AI Voice Search */}
                  {searchTab === 'AI Voice Search' && (
                    <div className="py-10 text-center space-y-6 max-w-xl mx-auto">
                      <div
                        className={`w-24 h-24 mx-auto rounded-3xl flex items-center justify-center text-white shadow-xl cursor-pointer transform hover:scale-105 transition-all ${isListening
                          ? 'bg-gradient-to-tr from-rose-600 to-amber-500 animate-pulse'
                          : 'bg-[#0A66C2] hover:bg-[#004182]'
                          }`}
                        onClick={toggleVoiceListening}
                      >
                        {isListening ? (
                          <MicOff size={36} className="text-white" />
                        ) : (
                          <Mic size={36} />
                        )}
                      </div>

                      <div>
                        <h2 className="text-[18px] font-bold text-slate-900 mb-1">
                          {isListening ? "Listening to your speech..." : "Tap the mic to start Voice Search"}
                        </h2>
                        <p className="text-[13px] text-slate-500 max-w-md mx-auto">
                          Speak naturally. For example: <span className="text-[#0A66C2] font-medium">&quot;Find React developers in Chennai with 2 years experience&quot;</span>
                        </p>
                      </div>

                      {voiceTranscript && (
                        <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-100 text-blue-950 font-medium text-[14px]">
                          {voiceTranscript}
                        </div>
                      )}

                      <div className="flex flex-wrap justify-center gap-2 pt-2">
                        <span className="text-[12px] text-slate-400 font-semibold w-full mb-1">Try quick prompts:</span>
                        {[
                          "Fullstack React developer in Bengaluru 3 years",
                          "Fresher Computer Science in Chennai",
                          "Python Data Analyst Immediate Joiner"
                        ].map(prompt => (
                          <button
                            key={prompt}
                            type="button"
                            onClick={() => {
                              setVoiceTranscript(`"${prompt}"`);
                              parseVoiceQuery(prompt);
                            }}
                            className="text-[12px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full cursor-pointer transition-colors font-medium"
                          >
                            &ldquo;{prompt}&rdquo;
                          </button>
                        ))}
                      </div>

                      {searchParams.keywords?.length > 0 && (
                        <div className="pt-4 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={handleSearchCandidates}
                            className="px-8 py-3 bg-[#0A66C2] hover:bg-[#004182] text-white font-bold rounded-xl text-[14px] cursor-pointer shadow-md"
                          >
                            Search Candidates Now
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>

              {/* SEPARATE ACCORDION BOXES */}
              {searchTab === 'Search form' && (
                <div className="space-y-3.5">

                  {/* ACCORDION 1: Education Details */}
                  <div className={`bg-white rounded-2xl shadow-xs border border-slate-200/80 transition-all ${accordions.education ? 'overflow-visible z-20' : 'overflow-hidden'}`}>
                    <div
                      onClick={() => toggleAccordion('education')}
                      className="p-3 sm:p-5 flex justify-between items-center cursor-pointer hover:bg-slate-50/60 transition-colors select-none"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                          <GraduationCap size={18} />
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-[16px] font-semibold text-slate-900">Education details</span>
                          {(searchParams.ugQualification || searchParams.pgQualification || searchParams.specificUG?.length > 0 || searchParams.specificPG?.length > 0 || searchParams.doctorateQualification?.length > 0) && (
                            <span className="bg-blue-100 text-[#0A66C2] text-[11px] font-bold px-2 py-0.5 rounded-full">
                              Configured
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronDown size={18} className={`text-slate-400 transition-transform duration-200 ${accordions.education ? 'rotate-180 text-slate-700' : ''}`} />
                    </div>

                    {accordions.education && (
                      <div className="p-6 pt-3 border-t border-slate-100 space-y-6 bg-white rounded-b-2xl">
                        <div>
                          <label className="block text-[13px] font-semibold text-slate-700 mb-2">Undergraduate Qualification (UG)</label>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <Pill label="Any UG Degree" field="ugQualification" value="Any UG" multi={false} />
                            <Pill label="Specific Degree" field="ugQualification" value="Specific UG" multi={false} />
                            <Pill label="No UG Degree" field="ugQualification" value="No UG" multi={false} />
                          </div>
                          {searchParams.ugQualification === 'Specific UG' && (
                            <div className="mt-2">
                              <DegreeMultiSelect
                                selectedDegrees={Array.isArray(searchParams.specificUG) ? searchParams.specificUG : (searchParams.specificUG ? [searchParams.specificUG] : [])}
                                onChange={(degs) => setSearchParams(p => ({ ...p, specificUG: degs }))}
                                availableDegrees={filterOptions.ugDegrees && filterOptions.ugDegrees.length > 0 ? filterOptions.ugDegrees : ['B.Tech', 'B.E.', 'B.Sc', 'B.Com', 'BCA', 'MBBS', 'BBA', 'BA', 'B.Pharm', 'B.Arch', 'B.Design']}
                                popularDegrees={['B.Tech', 'B.E.', 'B.Sc', 'B.Com', 'BCA', 'MBBS']}
                                placeholder="Search all degrees or type custom..."
                              />
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-[13px] font-semibold text-slate-700 mb-2">Postgraduate Qualification (PG)</label>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <Pill label="Any PG Degree" field="pgQualification" value="Any PG" multi={false} />
                            <Pill label="Specific PG Degree" field="pgQualification" value="Specific PG" multi={false} />
                            <Pill label="No PG Degree" field="pgQualification" value="No PG" multi={false} />
                          </div>
                          {searchParams.pgQualification === 'Specific PG' && (
                            <div className="mt-2">
                              <DegreeMultiSelect
                                selectedDegrees={Array.isArray(searchParams.specificPG) ? searchParams.specificPG : (searchParams.specificPG ? [searchParams.specificPG] : [])}
                                onChange={(degs) => setSearchParams(p => ({ ...p, specificPG: degs }))}
                                availableDegrees={filterOptions.pgDegrees && filterOptions.pgDegrees.length > 0 ? filterOptions.pgDegrees : ['M.Tech', 'ME', 'MBA', 'MCA', 'M.Sc', 'M.Com', 'MA', 'MS', 'CA (Chartered Accountant)', 'PG Diploma']}
                                popularDegrees={['M.Tech', 'MBA', 'MCA', 'M.Sc', 'MS']}
                                placeholder="Search all PG degrees or type custom..."
                              />
                            </div>
                          )}
                        </div>

                        {/* Doctorate Qualification */}
                        {!searchParams.showDoctorate ? (
                          <button
                            type="button"
                            onClick={() => setSearchParams(p => ({ ...p, showDoctorate: true }))}
                            className="text-[13px] text-[#0A66C2] hover:text-[#004182] flex items-center gap-1 font-semibold cursor-pointer"
                          >
                            <PlusCircle size={14} /> Add Doctorate / Ph.D qualification
                          </button>
                        ) : (
                          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-[13px] font-bold text-slate-900">Doctorate Qualification</span>
                              <button
                                type="button"
                                onClick={() => setSearchParams(p => ({ ...p, showDoctorate: false, doctorateQualification: [] }))}
                                className="text-[11px] text-slate-500 hover:text-rose-600 font-semibold cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                            <DegreeMultiSelect
                              selectedDegrees={Array.isArray(searchParams.doctorateQualification) ? searchParams.doctorateQualification : (searchParams.doctorateQualification ? [searchParams.doctorateQualification] : [])}
                              onChange={(degs) => setSearchParams(p => ({ ...p, doctorateQualification: degs }))}
                              availableDegrees={filterOptions.doctorateDegrees && filterOptions.doctorateDegrees.length > 0 ? filterOptions.doctorateDegrees : ['Ph.D.', 'Doctorate', 'Doctor of Science (D.Sc)', 'Doctor of Medicine (M.D.)', 'M.Phil', 'Post-Doctorate']}
                              popularDegrees={['Ph.D.', 'Doctorate', 'Doctor of Science (D.Sc)', 'Doctor of Medicine (M.D.)']}
                              placeholder="Search or add doctorate..."
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ACCORDION 2: Employment Details */}
                  <div className={`bg-white rounded-2xl shadow-xs border border-slate-200/80 transition-all ${accordions.employment ? 'overflow-visible z-20' : 'overflow-hidden'}`}>
                    <div
                      onClick={() => toggleAccordion('employment')}
                      className="p-3 sm:p-5 flex justify-between items-center cursor-pointer hover:bg-slate-50/60 transition-colors select-none"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                          <Briefcase size={18} />
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-[16px] font-semibold text-slate-900">Employment details</span>
                          {(searchParams.industry?.length > 0 || searchParams.company?.length > 0 || searchParams.designation) && (
                            <span className="bg-blue-100 text-[#0A66C2] text-[11px] font-bold px-2 py-0.5 rounded-full">
                              Configured
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronDown size={18} className={`text-slate-400 transition-transform duration-200 ${accordions.employment ? 'rotate-180 text-slate-700' : ''}`} />
                    </div>

                    {accordions.employment && (
                      <div className="p-6 pt-3 border-t border-slate-100 space-y-6 bg-white rounded-b-2xl">
                        {/* Industry */}
                        <div className="relative">
                          <label className="block text-[14px] font-medium text-slate-700 mb-1.5">Industry</label>
                          <TwoPaneIndustryDropdown
                            selectedIndustries={searchParams.industry}
                            onChange={inds => setSearchParams(p => ({ ...p, industry: inds }))}
                            placeholder="Enter industry"
                            industries={filterOptions.industries}
                          />
                          <div className="flex items-center gap-1.5 mt-2 text-[13px] text-slate-600">
                            <span>Include:</span>
                            <NeatSelect
                              value={searchParams.industryMatch}
                              onChange={(val) => setSearchParams(p => ({ ...p, industryMatch: val }))}
                              size="inline"
                              options={[
                                { value: 'Current or past industry', label: 'Current or past industry' },
                                { value: 'Current industry', label: 'Current industry only' },
                                { value: 'Past industry', label: 'Past industry only' },
                              ]}
                            />
                          </div>
                        </div>

                        {/* Company */}
                        <div className="relative">
                          <label className="block text-[14px] font-medium text-slate-700 mb-1.5">Company</label>
                          <CompanySearchDropdown
                            selectedOptions={searchParams.company}
                            onChange={opts => setSearchParams(p => ({ ...p, company: opts }))}
                            placeholder="Search candidate company name..."
                            registeredCompanies={filterOptions.companies}
                          />
                          <div className="flex items-center gap-1.5 mt-2 text-[13px] text-slate-600">
                            <span>Include:</span>
                            <NeatSelect
                              value={searchParams.companyMatch}
                              onChange={(val) => setSearchParams(p => ({ ...p, companyMatch: val }))}
                              size="inline"
                              options={[
                                { value: 'Current employees', label: 'Current employees' },
                                { value: 'Past employees', label: 'Past employees' },
                                { value: 'All employees', label: 'All employees' },
                              ]}
                            />
                          </div>

                          {/* Add Company to Exclude */}
                          <div className="mt-3">
                            {!showExcludeCompanyInput ? (
                              <button
                                type="button"
                                onClick={() => setShowExcludeCompanyInput(true)}
                                className="text-[13px] text-[#0A66C2] hover:underline flex items-center gap-1 font-medium cursor-pointer"
                              >
                                <PlusCircle size={14} /> Add company to exclude from search
                              </button>
                            ) : (
                              <div className="bg-rose-50/40 border border-rose-200/70 p-3 rounded-xl space-y-2 mt-1.5">
                                <div className="flex justify-between items-center">
                                  <span className="text-[12px] font-bold text-rose-800">Excluded Companies</span>
                                  <button
                                    type="button"
                                    onClick={() => setShowExcludeCompanyInput(false)}
                                    className="text-[11px] text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
                                  >
                                    Close
                                  </button>
                                </div>
                                <CompanySearchDropdown
                                  selectedOptions={searchParams.excludedCompanies}
                                  onChange={opts => setSearchParams(p => ({ ...p, excludedCompanies: opts }))}
                                  placeholder="Search candidate company to exclude..."
                                  registeredCompanies={filterOptions.companies}
                                  isExclude={true}
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Designation */}
                        <div className="relative">
                          <label className="block text-[14px] font-medium text-slate-700 mb-1.5">Designation</label>
                          <input
                            type="text"
                            placeholder="Enter designation (e.g. Software Engineer, Team Lead, Manager)"
                            value={searchParams.designation}
                            onChange={e => setSearchParams(p => ({ ...p, designation: e.target.value }))}
                            className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-[14px] text-slate-800 focus:border-[#0A66C2] focus:outline-none min-h-[46px]"
                          />
                          <div className="flex items-center gap-1.5 mt-2 text-[13px] text-slate-600">
                            <span>Match in:</span>
                            <NeatSelect
                              value={searchParams.designationMatch}
                              onChange={(val) => setSearchParams(p => ({ ...p, designationMatch: val }))}
                              size="inline"
                              options={[
                                { value: 'Current designation', label: 'Current designation' },
                                { value: 'Past designation', label: 'Past designation' },
                                { value: 'Any designation', label: 'Any designation' },
                              ]}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ACCORDION 3: Smart Insights */}
                  <div className={`bg-white rounded-2xl shadow-xs border border-slate-200/80 transition-all ${accordions.insights ? 'overflow-visible z-20' : 'overflow-hidden'}`}>
                    <div
                      onClick={() => toggleAccordion('insights')}
                      className="p-3 sm:p-5 flex justify-between items-center cursor-pointer hover:bg-slate-50/60 transition-colors select-none"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                          <Sparkles size={18} />
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-[16px] font-semibold text-slate-900">Smart insights</span>
                          {searchParams.smartInsights?.length > 0 && (
                            <span className="bg-blue-100 text-[#0A66C2] text-[11px] font-bold px-2 py-0.5 rounded-full">
                              {searchParams.smartInsights.length} active
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronDown size={18} className={`text-slate-400 transition-transform duration-200 ${accordions.insights ? 'rotate-180 text-slate-700' : ''}`} />
                    </div>

                    {accordions.insights && (
                      <div className="p-6 pt-3 border-t border-slate-100 space-y-5 bg-white rounded-b-2xl">
                        <div>
                          <label className="block text-[13px] font-semibold text-slate-700 mb-2">Academic & Pedigree Signals</label>
                          <div className="flex flex-wrap gap-2">
                            <Pill label="Tier 1 / Prestigious College" field="smartInsights" value="Prestigious College" isSmart={true} />
                            <Pill label="Top 100 Engineering Institutions" field="smartInsights" value="Top 100 Engg" isSmart={true} />
                            <Pill label="Top 100 Business Schools" field="smartInsights" value="Top 100 MBA" isSmart={true} />
                            <Pill label="Fast-track Ph.D graduate" field="smartInsights" value="Fast PhD" isSmart={true} />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[13px] font-semibold text-slate-700 mb-2">Growth & Startup Trajectory</label>
                          <div className="flex flex-wrap gap-2">
                            <Pill label="Startup Experience" field="smartInsights" value="Startup Exp" isSmart={true} />
                            <Pill label="Promoted at current employer" field="smartInsights" value="Promoted" isSmart={true} />
                            <Pill label="Founder / Co-founder background" field="smartInsights" value="Founder Exp" isSmart={true} />
                            <Pill label="Early employee (<50 headcount)" field="smartInsights" value="Early Employee" isSmart={true} />
                            <Pill label="Published Portfolio / GitHub" field="smartInsights" value="Portfolio" isSmart={true} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ACCORDION 4: Additional Details */}
                  <div className={`bg-white rounded-2xl shadow-xs border border-slate-200/80 transition-all ${accordions.additional ? 'overflow-visible z-20' : 'overflow-hidden'}`}>
                    <div
                      onClick={() => toggleAccordion('additional')}
                      className="p-3 sm:p-5 flex justify-between items-center cursor-pointer hover:bg-slate-50/60 transition-colors select-none"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                          <FileText size={18} />
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-[16px] font-semibold text-slate-900">Additional details</span>
                        </div>
                      </div>
                      <ChevronDown size={18} className={`text-slate-400 transition-transform duration-200 ${accordions.additional ? 'rotate-180 text-slate-700' : ''}`} />
                    </div>

                    {accordions.additional && (
                      <div className="p-6 pt-3 border-t border-slate-100 space-y-5 bg-white rounded-b-2xl">
                        <div>
                          <label className="block text-[13px] font-semibold text-slate-700 mb-2">Candidate Gender</label>
                          <div className="flex gap-2">
                            <Pill label="Male Candidates" field="gender" value="Male" isSmart={true} />
                            <Pill label="Female Candidates" field="gender" value="Female" isSmart={true} />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[13px] font-semibold text-slate-700 mb-2">Differently Abled Inclusivity</label>
                          <div className="flex gap-2">
                            <Pill label="Developmental" field="differentlyAbled" value="Developmental" isSmart={true} />
                            <Pill label="Mental" field="differentlyAbled" value="Mental" isSmart={true} />
                            <Pill label="Physical" field="differentlyAbled" value="Physical" isSmart={true} />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Languages Known</label>
                          <div className="flex gap-2 mb-2">
                            <input
                              type="text"
                              placeholder="Add language e.g. English, Hindi, Tamil, German..."
                              value={languageInput}
                              onChange={e => setLanguageInput(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addTag('languages', languageInput, setLanguageInput);
                                }
                              }}
                              className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2 text-[13px] focus:border-[#0A66C2] focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => addTag('languages', languageInput, setLanguageInput)}
                              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[13px] font-semibold rounded-xl cursor-pointer transition-colors"
                            >
                              Add
                            </button>
                          </div>
                          {searchParams.languages.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {searchParams.languages.map(lang => (
                                <span key={lang} className="bg-blue-50 text-[#0A66C2] border border-blue-200 text-[12px] px-2.5 py-0.5 rounded-full flex items-center gap-1 font-medium">
                                  {lang}
                                  <X size={12} className="cursor-pointer hover:text-[#004182]" onClick={() => removeTag('languages', lang)} />
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-[13px] font-semibold text-slate-700 mb-2">Visa & Work Authorization</label>
                          <div className="flex flex-wrap gap-2">
                            <Pill label="H1 Visa" field="visaStatus" value="H1" isSmart={true} />
                            <Pill label="L1 Visa" field="visaStatus" value="L1" isSmart={true} />
                            <Pill label="TN Permit" field="visaStatus" value="TN" isSmart={true} />
                            <Pill label="Green Card" field="visaStatus" value="GreenCard" isSmart={true} />
                            <Pill label="US Citizen" field="visaStatus" value="USCitizen" isSmart={true} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* Sticky Bottom Bar */}
              <div
                style={{ zIndex: 40 }}
                className="sticky bottom-4 bg-white/95 backdrop-blur-md border border-slate-200/90 p-3 px-6 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-3 z-40 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl"
              >
                <div className="flex items-center gap-4 text-[13px] font-medium text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-medium text-[13px]">Active in:</span>
                    <NeatSelect
                      value={searchParams.activeUpdated || '180'}
                      onChange={(val) => setSearchParams(p => ({ ...p, activeUpdated: val }))}
                      size="sm"
                      options={[
                        { value: '3', label: '3 days' },
                        { value: '7', label: '7 days' },
                        { value: '15', label: '15 days' },
                        { value: '30', label: '30 days' },
                        { value: '60', label: '2 months' },
                        { value: '90', label: '3 months' },
                        { value: '180', label: '6 months' },
                        { value: 'All time', label: 'All time' },
                      ]}
                      buttonClassName="bg-slate-50 border-slate-200"
                    />
                  </div>

                  {activeFilterCount > 0 && (
                    <span className="text-[12px] text-[#0A66C2] font-semibold bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/60">
                      {activeFilterCount} filter criteria set
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end flex-wrap">
                  {searchError && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[12px] font-bold animate-in fade-in">
                      <AlertCircle size={15} className="text-rose-600 shrink-0" />
                      <span>Choose any one filter or enter keywords to search</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-[13px] font-semibold text-slate-500 hover:text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                  <button
                    type="button"
                    onClick={handleSearchCandidates}
                    className="px-5 py-2.5 bg-[#0A66C2] hover:bg-[#004182] text-white font-medium rounded-xl transition-all text-[14px] cursor-pointer shadow-md hover:shadow-lg flex items-center gap-2 active:scale-98"
                  >
                    <span>Search Candidates</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>

            </div>

            {/* Right Column - Recent Searches, Saved Presets & Pre-Fill Shortcuts */}
            <div className="w-full lg:w-[360px] shrink-0 space-y-5 lg:sticky lg:top-[84px] self-start z-20">

              {/* Box 1: Recent Searches & Saved Presets Tabbed Card */}
              <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4">
                <div className="flex gap-2 p-1 bg-slate-100/80 rounded-xl mb-4">
                  {[
                    { id: 'Recent searches', label: 'Recent', icon: Clock },
                    { id: 'Saved searches', label: 'Saved Presets', icon: Bookmark }
                  ].map(tab => {
                    const Icon = tab.icon;
                    const isActive = rightTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setRightTab(tab.id)}
                        className={`flex-1 py-2 text-[12px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${isActive
                          ? 'bg-white text-[#0A66C2] shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                          }`}
                      >
                        <Icon size={14} className={isActive ? 'text-[#0A66C2]' : 'text-slate-400'} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {rightTab === 'Recent searches' ? (
                    recentSearches.length > 0 ? (
                      <>
                        <div className="flex items-center justify-between pb-1 px-1 mb-1">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            History ({recentSearches.length})
                          </span>
                          <button
                            type="button"
                            onClick={handleClearAllRecentSearches}
                            className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Clear all recent search history"
                          >
                            Clear all
                          </button>
                        </div>
                        {recentSearches.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => {
                              if (item.params) {
                                setSearchParams(item.params);
                                handleSearchCandidates(null, item.params);
                              }
                            }}
                            className="p-2.5 border border-slate-100 hover:border-blue-200 rounded-xl hover:bg-blue-50/40 cursor-pointer transition-all group shadow-2xs relative"
                          >
                            <div className="flex items-start gap-2.5">
                              <Search size={15} className="text-slate-400 group-hover:text-[#0A66C2] mt-0.5 shrink-0" />
                              <div className="flex-1 min-w-0 pr-1">
                                <p className="text-[13px] font-bold text-slate-800 group-hover:text-[#0A66C2] leading-snug line-clamp-2 mb-0">
                                  {item.title}
                                </p>
                                <span className="text-[11px] text-slate-400 mt-1 block font-medium">
                                  {item.timestamp}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0 mt-0.5">
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteRecentSearch(item.id, e)}
                                  className="text-slate-300 hover:text-rose-600 p-1 transition-colors rounded hover:bg-rose-50"
                                  title="Delete recent search"
                                  aria-label="Delete"
                                >
                                  <Trash2 size={13} />
                                </button>
                                <ArrowRight size={14} className="text-slate-300 group-hover:text-[#0A66C2] transition-transform group-hover:translate-x-0.5" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="py-8 text-center text-slate-400 text-[13px]">
                        <Clock size={24} className="mx-auto mb-2 opacity-40" />
                        <p className="font-medium text-slate-500 mb-0">No recent searches yet</p>
                        <p className="text-[12px] text-slate-400 mt-1 mb-0">Run a search to see your history here.</p>
                      </div>
                    )
                  ) : (
                    savedSearches.length > 0 ? (
                      savedSearches.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            if (item.params) {
                              setSearchParams(item.params);
                              handleSearchCandidates(null, item.params);
                            }
                          }}
                          className="flex justify-between items-start p-3 border border-slate-100 hover:border-blue-200 rounded-xl hover:bg-blue-50/40 cursor-pointer transition-all group shadow-2xs"
                        >
                          <div className="flex gap-2.5 min-w-0 flex-1">
                            <Bookmark size={15} className="text-[#0A66C2] mt-0.5 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-[13px] font-bold text-slate-800 group-hover:text-[#0A66C2] truncate mb-0">
                                {item.name}
                              </p>
                              <span className="text-[11px] text-slate-400 block mt-0.5 font-medium">{item.timestamp}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteSavedSearch(item.id, e)}
                            className="text-slate-300 hover:text-rose-600 p-1 transition-colors rounded hover:bg-rose-50"
                            title="Delete saved preset"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-slate-400 text-[13px]">
                        <Bookmark size={24} className="mx-auto mb-2 opacity-40" />
                        <p className="font-medium text-slate-500 mb-0">No saved presets</p>
                        <p className="text-[12px] text-slate-400 mt-1 mb-0">Click &quot;Save Search&quot; to bookmark any filter combination.</p>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Box 2: Use your recent NVites */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h4 className="text-[14px] font-semibold text-slate-900 mb-0">
                    Use your recent NVites
                  </h4>
                  <Zap size={16} className="text-amber-500" />
                </div>
                <div className="mt-3 space-y-3">
                  {nvites.length > 0 ? (
                    nvites.slice(0, 3).map(n => (
                      <div key={n.id} className="p-2.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                        <div className="text-[13px] font-semibold text-slate-800 line-clamp-1 mb-0.5">
                          {n.job_title}
                        </div>
                        <div className="text-[11.5px] text-slate-500 line-clamp-1 mb-2">
                          {cleanLocation(n.job_location || 'India')}
                        </div>
                        <button
                          type="button"
                          onClick={() => handlePreFillNvite(n)}
                          className="text-[12px] text-[#0A66C2] hover:text-[#084e96] font-medium hover:underline cursor-pointer block"
                        >
                          Pre-fill search details
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50">
                      <div className="text-[13px] font-semibold text-slate-800 line-clamp-1 mb-0.5">
                        Walk-in || Trainee Test Engineering
                      </div>
                      <div className="text-[11.5px] text-slate-500 mb-2">
                        India
                      </div>
                      <button
                        type="button"
                        onClick={() => handlePreFillMock({
                          title: 'Trainee Test Engineering',
                          expMin: '0',
                          expMax: '1',
                          location: 'Chennai'
                        })}
                        className="text-[12px] text-[#0A66C2] hover:text-[#084e96] font-medium hover:underline cursor-pointer block"
                      >
                        Pre-fill search details
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Box 3: Use your recently posted jobs */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h4 className="text-[14px] font-semibold text-slate-900 mb-0">
                    Use your recently posted jobs
                  </h4>
                  <Building2 size={16} className="text-slate-400" />
                </div>
                <div className="mt-3 space-y-3">
                  {loadingJobs ? (
                    <div className="py-4 text-center text-slate-400 text-xs">
                      <Loader2 size={16} className="animate-spin inline mr-1" />
                      Loading jobs...
                    </div>
                  ) : postedJobs.length > 0 ? (
                    postedJobs.slice(0, 4).map(job => (
                      <div key={job.id} className="p-2.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                        <div className="text-[13px] font-semibold text-slate-800 line-clamp-1 mb-0.5">
                          {job.job_title || job.title}
                        </div>
                        <div className="text-[11.5px] text-slate-500 line-clamp-1 mb-2">
                          {(job.experience_min ?? job.min_experience ?? 0)}-{(job.experience_max ?? job.max_experience ?? 3)} yrs | {cleanLocation(job.location || job.job_location || 'Any location')}
                        </div>
                        <button
                          type="button"
                          onClick={() => handlePreFillJob(job)}
                          className="text-[12px] text-[#0A66C2] hover:text-[#084e96] font-medium hover:underline cursor-pointer block"
                        >
                          Pre-fill search details
                        </button>
                      </div>
                    ))
                  ) : (
                    [
                      { title: 'React.js Developer', exp: '0-3 yrs', loc: 'Any location', expMin: '0', expMax: '3' },
                      { title: 'Fullstack Developer', exp: '0-3 yrs', loc: 'Any location', expMin: '0', expMax: '3' },
                      { title: 'Walk-in || Trainee Test Engineering', exp: '0-3 yrs', loc: 'Any location', expMin: '0', expMax: '3' },
                      { title: 'C Developer', exp: '0-3 yrs', loc: 'Any location', expMin: '0', expMax: '3' }
                    ].map((m, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50">
                        <div className="text-[13px] font-semibold text-slate-800 line-clamp-1 mb-0.5">
                          {m.title}
                        </div>
                        <div className="text-[11.5px] text-slate-500 mb-2">
                          {m.exp} | {m.loc}
                        </div>
                        <button
                          type="button"
                          onClick={() => handlePreFillMock(m)}
                          className="text-[12px] text-[#0A66C2] hover:text-[#084e96] font-medium hover:underline cursor-pointer block"
                        >
                          Pre-fill search details
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 2: MANAGE SENT NVITES (Tracking Funnel & History) ─────── */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'manage' && (
        <div className="space-y-6">

          {/* Unified Executive Engagement & Funnel Metric Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 sm:px-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send size={15} className="text-[#0A66C2]" />
                <h3 className="text-[13.5px] font-semibold text-slate-900 tracking-tight mb-0">
                  Engagement & Conversion Funnel
                </h3>
              </div>
              <div className="text-[12px] text-slate-500 font-normal flex items-center gap-2">
                <span>Overall Conversion:</span>
                <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  {conversionRate}%
                </span>
              </div>
            </div>

            {/* Metric Segments Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 bg-white">

              {/* Total Sent */}
              <button
                type="button"
                onClick={() => { setStatusFilter('all'); setPage(1); }}
                className={`p-4 text-left transition-all hover:bg-slate-50/80 cursor-pointer flex flex-col justify-between ${statusFilter === 'all' ? 'bg-blue-50/40' : ''
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-medium text-slate-700">Total Nvites</span>
                  <div className="w-6 h-6 rounded-md bg-blue-50 text-[#0A66C2] flex items-center justify-center">
                    <Send size={12} />
                  </div>
                </div>
                <div>
                  <div className="text-xl font-semibold text-slate-900">{stats.total}</div>
                  <div className="text-[11px] text-slate-400 font-normal mt-0.5">Invitations Sent</div>
                </div>
              </button>

              {/* Pending Response */}
              <button
                type="button"
                onClick={() => { setStatusFilter('pending'); setPage(1); }}
                className={`p-4 text-left transition-all hover:bg-slate-50/80 cursor-pointer flex flex-col justify-between ${statusFilter === 'pending' ? 'bg-amber-50/40' : ''
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-medium text-slate-700">Awaiting Reply</span>
                  <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Clock size={12} />
                  </div>
                </div>
                <div>
                  <div className="text-xl font-semibold text-slate-800">{stats.pending}</div>
                  <div className="text-[11px] text-slate-400 font-normal mt-0.5">Pending Action</div>
                </div>
              </button>

              {/* Viewed by Talent */}
              <button
                type="button"
                onClick={() => { setStatusFilter('viewed'); setPage(1); }}
                className={`p-4 text-left transition-all hover:bg-slate-50/80 cursor-pointer flex flex-col justify-between ${statusFilter === 'viewed' ? 'bg-sky-50/40' : ''
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-medium text-slate-700">Viewed</span>
                  <div className="w-6 h-6 rounded-md bg-sky-50 text-sky-600 flex items-center justify-center">
                    <Eye size={12} />
                  </div>
                </div>
                <div>
                  <div className="text-xl font-semibold text-slate-800">{stats.viewed}</div>
                  <div className="text-[11px] text-slate-400 font-normal mt-0.5">Opened by Candidate</div>
                </div>
              </button>

              {/* Accepted */}
              <button
                type="button"
                onClick={() => { setStatusFilter('accepted'); setPage(1); }}
                className={`p-4 text-left transition-all hover:bg-slate-50/80 cursor-pointer flex flex-col justify-between ${statusFilter === 'accepted' ? 'bg-emerald-50/40' : ''
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-medium text-slate-700">Accepted</span>
                  <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 size={12} />
                  </div>
                </div>
                <div>
                  <div className="text-xl font-semibold text-emerald-600">{stats.accepted}</div>
                  <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Applied to Job</div>
                </div>
              </button>

              {/* Declined */}
              <button
                type="button"
                onClick={() => { setStatusFilter('declined'); setPage(1); }}
                className={`p-4 text-left transition-all hover:bg-slate-50/80 cursor-pointer flex flex-col justify-between ${statusFilter === 'declined' ? 'bg-rose-50/40' : ''
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-medium text-slate-700">Declined</span>
                  <div className="w-6 h-6 rounded-md bg-rose-50 text-rose-500 flex items-center justify-center">
                    <XCircle size={12} />
                  </div>
                </div>
                <div>
                  <div className="text-xl font-semibold text-slate-800">{stats.declined}</div>
                  <div className="text-[11px] text-slate-400 font-normal mt-0.5">Passed by Candidate</div>
                </div>
              </button>

              {/* Expired */}
              <button
                type="button"
                onClick={() => { setStatusFilter('expired'); setPage(1); }}
                className={`p-4 text-left transition-all hover:bg-slate-50/80 cursor-pointer flex flex-col justify-between ${statusFilter === 'expired' ? 'bg-slate-50' : ''
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-medium text-slate-700">Expired</span>
                  <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-500 flex items-center justify-center">
                    <AlertTriangle size={12} />
                  </div>
                </div>
                <div>
                  <div className="text-xl font-semibold text-slate-700">{stats.expired}</div>
                  <div className="text-[11px] text-slate-400 font-normal mt-0.5">Past Expiry Date</div>
                </div>
              </button>

            </div>
          </div>

          {/* Filter Toolbar & Search Bar */}
          <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3">

            {/* Status Segmented Tabs */}
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100/70 rounded-xl w-full lg:w-auto">
              {[
                { id: 'all', label: 'All Nvites', count: stats.total },
                { id: 'pending', label: 'Pending', count: stats.pending },
                { id: 'viewed', label: 'Viewed', count: stats.viewed },
                { id: 'accepted', label: 'Accepted', count: stats.accepted },
                { id: 'declined', label: 'Declined', count: stats.declined },
                { id: 'expired', label: 'Expired', count: stats.expired }
              ].map((tab) => {
                const isActive = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setStatusFilter(tab.id);
                      setPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[12.5px] transition-all cursor-pointer flex items-center gap-1.5 ${isActive
                      ? 'bg-white text-[#0A66C2] font-semibold shadow-2xs border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900 font-normal hover:bg-white/50'
                      }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-[10.5px] px-1.5 py-0.2 rounded-full font-medium ${isActive ? 'bg-blue-50 text-[#0A66C2]' : 'bg-slate-200/70 text-slate-500'
                      }`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right Search Input & View Mode Switcher */}
            <div className="flex items-center gap-2.5 w-full lg:w-auto justify-between lg:justify-end">
              <div className="relative flex-1 lg:w-72">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search candidate or job title..."
                  className="w-full pl-9 pr-8 py-1.5 bg-slate-50/70 border border-slate-200 rounded-xl text-[12.5px] font-normal text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/15 outline-none transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* View Mode Toggle: Cards vs Table */}
              <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200/70 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  title="Card list view"
                  className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1 ${viewMode === 'cards'
                    ? 'bg-white text-[#0A66C2] shadow-2xs font-medium'
                    : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  title="Table grid view"
                  className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1 ${viewMode === 'table'
                    ? 'bg-white text-[#0A66C2] shadow-2xs font-medium'
                    : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                  <List size={14} />
                </button>
              </div>
            </div>

          </div>

          {/* Sent NVites List Content */}
          {loadingNvites ? (
            <div className="bg-white rounded-2xl p-16 border border-slate-200/80 text-center space-y-3">
              <RefreshCw size={24} className="animate-spin text-[#0A66C2] mx-auto" />
              <p className="text-[13.5px] text-slate-500 font-normal mb-0">Loading candidate invitations...</p>
            </div>
          ) : nvites.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 border border-slate-200/80 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0A66C2] flex items-center justify-center mx-auto">
                <Send size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-slate-900 mb-0">No candidate Nvites found</h3>
                <p className="text-[13px] text-slate-500 font-normal max-w-md mx-auto">
                  {statusFilter !== 'all'
                    ? `There are currently no candidate invitations with status "${statusFilter}".`
                    : "You haven't sent any direct job invitations yet. Search candidates and dispatch invitations to start connecting."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('send')}
                className="px-4 py-2 rounded-xl bg-[#0A66C2] hover:bg-[#084e96] text-white font-medium text-[13px] shadow-2xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={15} />
                <span>Search & Send First Nvite</span>
              </button>
            </div>
          ) : viewMode === 'cards' ? (
            /* Cards View */
            <div className="grid grid-cols-1 gap-3">
              {nvites.map((nvite) => {
                const avatar = getImageUrl(nvite.candidate_avatar || nvite.profile_picture || nvite.avatar);
                const isExpired = nvite.status === 'expired' || (nvite.expires_at && new Date(nvite.expires_at) < new Date() && nvite.status === 'pending');

                return (
                  <div
                    key={nvite.id}
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 hover:border-slate-300 transition-all shadow-xs hover:shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    {/* Left: Avatar + Candidate & Job Details */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <div className="w-9 h-9 min-w-[36px] max-w-[36px] rounded-full overflow-hidden bg-slate-100 border border-slate-200/80 shrink-0 flex items-center justify-center">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt={nvite.candidate_name || 'Candidate'}
                            className="w-full h-full object-cover"
                            style={{ width: '36px', height: '36px', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling && (e.target.nextSibling.style.display = 'flex');
                            }}
                          />
                        ) : null}
                        <span
                          className={`text-[12px] font-semibold text-slate-600 ${avatar ? 'hidden' : 'flex'
                            } items-center justify-center w-full h-full`}
                        >
                          {(nvite.candidate_name || 'C').slice(0, 2).toUpperCase()}
                        </span>
                      </div>

                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-[14px] font-semibold text-slate-900 tracking-tight mb-0 truncate">
                            {nvite.candidate_name}
                          </h4>
                          <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            Job
                          </span>
                        </div>

                        <div className="text-[13px] text-slate-700 font-medium flex items-center gap-1.5 flex-wrap">
                          <Briefcase size={13} className="text-slate-400 shrink-0" />
                          <span className="truncate">{nvite.job_title}</span>
                          {nvite.company_name && (
                            <>
                              <span className="text-slate-300">·</span>
                              <span className="text-slate-500 font-normal">{nvite.company_name}</span>
                            </>
                          )}
                          {cleanLocation(nvite.job_location) && (
                            <>
                              <span className="text-slate-300">·</span>
                              <span className="text-slate-500 font-normal">{cleanLocation(nvite.job_location)}</span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-[12px] text-slate-500 font-normal flex-wrap pt-0.5">
                          {nvite.candidate_email && (
                            <span className="inline-flex items-center gap-1 truncate max-w-[220px]">
                              <Mail size={12} className="text-slate-400 shrink-0" />
                              {nvite.candidate_email}
                            </span>
                          )}
                          {nvite.candidate_phone && (
                            <span className="inline-flex items-center gap-1">
                              <Phone size={12} className="text-slate-400 shrink-0" />
                              {nvite.candidate_phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Sent Date & Expiry */}
                    <div className="text-[12px] text-slate-500 font-normal shrink-0 space-y-0.5 pl-12 md:pl-0">
                      <div>Sent: <span className="font-medium text-slate-700">{nvite.created_at ? new Date(nvite.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}</span></div>
                      {nvite.expires_at && (
                        <div className="text-[11px] text-slate-400">
                          Valid till {new Date(nvite.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      )}
                    </div>

                    {/* Right: Status Pill & Action Buttons */}
                    <div className="flex items-center gap-2.5 self-end md:self-center shrink-0 pl-12 md:pl-0">
                      {/* Status Badges */}
                      {nvite.status === 'viewed' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium bg-sky-50 text-sky-700 border border-sky-200/60">
                          <Eye size={12} />
                          <span>Viewed by Candidate</span>
                        </span>
                      ) : nvite.status === 'accepted' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          <CheckCircle2 size={12} />
                          <span>Accepted / Applied</span>
                        </span>
                      ) : nvite.status === 'declined' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium bg-rose-50 text-rose-700 border border-rose-200/60">
                          <XCircle size={12} />
                          <span>Declined</span>
                        </span>
                      ) : isExpired ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          <Clock size={12} />
                          <span>Expired</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
                          <Clock size={12} />
                          <span>Pending Response</span>
                        </span>
                      )}

                      {/* View Note Modal Trigger */}
                      <button
                        type="button"
                        onClick={() => setSelectedMessageModal(nvite)}
                        title="View invitation note sent to candidate"
                        className="px-2.5 py-1 rounded-lg border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 text-[11.5px] font-medium transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <FileText size={12} />
                        <span>View Note</span>
                      </button>

                      {/* Resend Action for expired or pending */}
                      {(isExpired || nvite.status === 'pending') && (
                        <button
                          type="button"
                          disabled={resendingId === nvite.id}
                          onClick={() => handleResend(nvite.id)}
                          title="Resend invitation email"
                          className="p-1.5 rounded-lg border border-slate-200 hover:border-blue-200 text-slate-600 hover:text-[#0A66C2] bg-white hover:bg-blue-50 text-xs transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <RotateCcw size={13} className={resendingId === nvite.id ? 'animate-spin text-[#0A66C2]' : ''} />
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[13px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-5">Candidate</th>
                      <th className="py-3 px-5">Job Opportunity</th>
                      <th className="py-3 px-5">Sent & Validity</th>
                      <th className="py-3 px-5">Status</th>
                      <th className="py-3 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-normal">
                    {nvites.map((nvite) => {
                      const isExpired = nvite.status === 'expired' || (nvite.expires_at && new Date(nvite.expires_at) < new Date() && nvite.status === 'pending');
                      return (
                        <tr key={nvite.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-5">
                            <div className="font-semibold text-slate-900">{nvite.candidate_name}</div>
                            <div className="text-[11.5px] text-slate-500 font-normal">{nvite.candidate_email}</div>
                          </td>
                          <td className="py-3.5 px-5">
                            <div className="font-medium text-slate-800">{nvite.job_title}</div>
                            <div className="text-[11.5px] text-slate-500 font-normal">{cleanLocation(nvite.job_location) || nvite.company_name}</div>
                          </td>
                          <td className="py-3.5 px-5 text-[12px] text-slate-600">
                            <div>{nvite.created_at ? new Date(nvite.created_at).toLocaleDateString() : '—'}</div>
                            {nvite.expires_at && (
                              <div className="text-[11px] text-slate-400">Till {new Date(nvite.expires_at).toLocaleDateString()}</div>
                            )}
                          </td>
                          <td className="py-3.5 px-5">
                            {nvite.status === 'viewed' ? (
                              <span className="text-[11px] font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200/60">
                                Viewed
                              </span>
                            ) : nvite.status === 'accepted' ? (
                              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                                Applied
                              </span>
                            ) : nvite.status === 'declined' ? (
                              <span className="text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/60">
                                Declined
                              </span>
                            ) : isExpired ? (
                              <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                Expired
                              </span>
                            ) : (
                              <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedMessageModal(nvite)}
                                className="px-2 py-1 rounded-md text-[11px] font-medium border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                              >
                                Note
                              </button>
                              {(isExpired || nvite.status === 'pending') && (
                                <button
                                  type="button"
                                  onClick={() => handleResend(nvite.id)}
                                  className="p-1 rounded-md text-slate-500 hover:text-[#0A66C2] hover:bg-blue-50 cursor-pointer"
                                  title="Resend invitation"
                                >
                                  <RotateCcw size={12} className={resendingId === nvite.id ? 'animate-spin text-[#0A66C2]' : ''} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalCount > 15 && (
            <div className="flex items-center justify-between text-[12.5px] text-slate-500 font-normal pt-2">
              <span>
                Showing {((page - 1) * 15) + 1} - {Math.min(page * 15, totalCount)} of {totalCount} invitations
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium text-[12px] disabled:opacity-40 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page * 15 >= totalCount}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium text-[12px] disabled:opacity-40 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ── Message Note Modal Preview ─────────────────────────────── */}
      {selectedMessageModal && (
        <div style={{ marginTop: 0 }} className="fixed mt-0 inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-lg w-full shadow-2xl border border-slate-200/90 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-medium uppercase tracking-wider text-[#0A66C2]">
                  {selectedMessageModal.status === 'declined' ? 'Invitation Note & Decline Feedback' : 'Sent Invitation Note'}
                </span>
                <h3 className="text-[16px] font-semibold text-slate-900 mt-0.5 mb-0">
                  {selectedMessageModal.subject}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMessageModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Candidate Decline Reason & Notes (When Declined) */}
            {selectedMessageModal.status === 'declined' && (
              <div className="p-4 bg-rose-50/90 rounded-xl border border-rose-200 text-[13px] text-slate-800 space-y-2.5">
                <div className="flex items-center gap-1.5 text-rose-700 font-semibold text-[13px]">
                  <XCircle size={15} />
                  <span>Candidate Declined this Opportunity</span>
                  {selectedMessageModal.responded_at && (
                    <span className="text-[11.5px] font-normal text-slate-500 ml-auto">
                      {new Date(selectedMessageModal.responded_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div>
                  <span className="font-semibold text-slate-700 text-[12px] block">Primary Decline Reason:</span>
                  <span className="inline-block mt-0.5 px-2.5 py-0.5 bg-white border border-rose-200 rounded-md text-[12.5px] font-medium text-rose-800">
                    {selectedMessageModal.decline_reason || 'Currently not looking for a job change'}
                  </span>
                </div>
                {selectedMessageModal.decline_note && (
                  <div className="pt-1">
                    <span className="font-semibold text-slate-700 text-[12px] block">Candidate Feedback / Note:</span>
                    <p className="mt-0.5 text-[12.5px] italic text-slate-700 bg-white/80 p-2.5 rounded-lg border border-rose-100 whitespace-pre-wrap">
                      "{selectedMessageModal.decline_note}"
                    </p>
                  </div>
                )}
              </div>
            )}

            <div>
              {selectedMessageModal.status === 'declined' && (
                <span className="text-[11.5px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Original Sent Message:
                </span>
              )}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/70 text-[13px] leading-relaxed text-slate-700 whitespace-pre-wrap max-h-56 overflow-y-auto font-normal">
                {selectedMessageModal.message || '(No custom message body was provided)'}
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between text-[12px] text-slate-500 font-normal">
              <span>Recipient: <span className="font-medium text-slate-800">{selectedMessageModal.candidate_name}</span></span>
              <button
                type="button"
                onClick={() => setSelectedMessageModal(null)}
                className="px-4 py-2 bg-[#0A66C2] hover:bg-[#084e96] text-white font-medium rounded-xl text-[12.5px] cursor-pointer transition-colors shadow-2xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Send Nvite Modal for Candidate(s) ─────────────────────── */}
      <SendNviteModal
        isOpen={sendModalOpen}
        onClose={() => setSendModalOpen(false)}
        candidates={candidatesForModal}
        initialJobId={targetJobId}
        onSuccess={() => {
          setSelectedCandidateIds([]);
          fetchNvites();
          CommonToaster('NVites sent successfully! Track responses in Manage Sent NVites.', 'success');
        }}
      />

      {/* ── Save Search Modal ─────────────────────────────────────── */}
      {saveSearchModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200/80">
            <div className="flex justify-between items-center">
              <h3 className="text-[16px] font-bold text-slate-900 flex items-center gap-2">
                <Bookmark size={18} className="text-[#0A66C2]" /> Save Search Preset
              </h3>
              <button
                type="button"
                onClick={() => setSaveSearchModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-[13px] text-slate-600 mb-0">
              Save your current search filters under a quick preset name to rerun it anytime with a single click:
            </p>
            <input
              type="text"
              placeholder="e.g. Senior Fullstack Devs - Chennai / Bengaluru"
              value={saveSearchName}
              onChange={e => setSaveSearchName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveSearch()}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-[14px] focus:outline-none focus:border-[#0A66C2] focus:ring-2 focus:ring-blue-500/15"
              autoFocus
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSaveSearchModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-[13px] font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSearch}
                className="px-5 py-2 bg-[#0A66C2] text-white rounded-xl text-[13px] font-bold hover:bg-[#004182] transition-colors shadow-sm cursor-pointer"
              >
                Save Preset
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
