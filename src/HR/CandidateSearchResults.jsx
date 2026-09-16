'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search, X, MapPin, Briefcase, ChevronDown,
  ChevronLeft, ChevronRight, GraduationCap, Phone, Mail,
  MessageSquare, FileText, Bookmark, Link as LinkIcon,
  Filter, Download, Users as UsersIcon, Send,
  SlidersHorizontal, CheckCircle2, ArrowRight, ArrowLeft, Plus,
  Calendar, UserCheck, MoreVertical,
  Star
} from 'lucide-react';
import {
  searchCandidatesAPI, getCandidateFilterOptionsAPI,
  saveCandidateHR, removeSavedCandidateHR, getSavedCandidatesHR,
  getCandidateFoldersAPI, addCandidatesToFolderAPI
} from '../ApiService/action';
import { CommonToaster } from '../Common/CommonToaster';
import { getImageUrl } from '../utils/getImageUrl';
import { downloadResumeFile, viewResumeFile } from '../utils/downloadResume';

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
    ...(searchParams.get('ugQualification') && searchParams.get('ugQualification') !== 'Specific UG' && searchParams.get('ugQualification') !== 'No UG' ? [searchParams.get('ugQualification')] : []),
    ...(searchParams.get('pgQualification') && searchParams.get('pgQualification') !== 'Specific PG' && searchParams.get('pgQualification') !== 'No PG' ? [searchParams.get('pgQualification')] : [])
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
    company: initialCompany,
    skills: initialSkills,
    experienceMin: initialExpMin,
    experienceMax: initialExpMax,
    salaryMin: initialSalaryMin,
    salaryMax: initialSalaryMax,
    activeUpdated: initialActiveUpdated,
    page: 1,
    limit: 10,
    sortBy: initialSortBy
  });

  // Candidates & Pagination State
  const [candidates, setCandidates] = useState([]);
  const [totalCandidates, setTotalCandidates] = useState(0);
  const [totalAllEmployees, setTotalAllEmployees] = useState(0);
  const [totalActiveEmployees, setTotalActiveEmployees] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Available Filter Options from Backend
  const [filterOptions, setFilterOptions] = useState({
    locations: ['Chennai', 'Bengaluru', 'Hyderabad', 'Mumbai', 'Delhi NCR', 'Pune', 'Noida', 'Remote'],
    skills: ['React', 'Node.js', 'Python', 'SQL', 'JavaScript', 'HTML5', 'CSS3', 'MongoDB', 'AWS', 'TypeScript', 'Java'],
    jobTitles: ['Software Developer', 'Frontend Developer', 'Technical Support', 'Associate', 'Fullstack Engineer'],
    companies: ['ACTE Technologies', 'Markerz Global', 'Learnovita', 'TCS', 'Infosys', 'Wipro', 'Accenture'],
    industries: [],
    courses: ['B.Tech', 'B.E.', 'MBA', 'MBBS', 'MCA', 'B.Sc', 'B.Com', 'M.Tech', 'Any UG', 'Any PG'],
    genders: ['Male', 'Female']
  });

  // Accordion Expand/Collapse States
  const [openAccordions, setOpenAccordions] = useState({
    location: true,
    experience: true,
    noticePeriod: true,
    salary: false,
    gender: false,
    education: false,
    skills: true,
    company: false
  });

  // Local Search within Accordion Options
  const [locSearch, setLocSearch] = useState('');
  const [skillSearch, setSkillSearch] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [eduSearch, setEduSearch] = useState('');

  // Interactive UI States
  const [unmaskedPhones, setUnmaskedPhones] = useState({});
  const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);
  const [savedCandidateIds, setSavedCandidateIds] = useState([]);
  const [resumeModalCandidate, setResumeModalCandidate] = useState(null);
  const [previewImageModal, setPreviewImageModal] = useState(null);
  const [contactModal, setContactModal] = useState(null);
  const [contactMessage, setContactMessage] = useState('');
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
    };
    loadSavedCandidates();
  }, []);

  // Fetch Available Filter Options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await getCandidateFilterOptionsAPI();
        if (res?.data?.data) {
          setFilterOptions(prev => ({
            locations: res.data.data.locations?.length ? res.data.data.locations : prev.locations,
            skills: res.data.data.skills?.length ? res.data.data.skills : prev.skills,
            jobTitles: res.data.data.jobTitles?.length ? res.data.data.jobTitles : prev.jobTitles,
            companies: res.data.data.companies?.length ? res.data.data.companies : prev.companies,
            industries: res.data.data.industries?.length ? res.data.data.industries : prev.industries,
            courses: res.data.data.courses?.length ? res.data.data.courses : prev.courses,
            genders: res.data.data.genders?.length ? res.data.data.genders : prev.genders
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

      const payload = {
        search: searchTerms,
        keywordMatch: filters.keywordMatch || 'any',
        location: filters.location.join(','),
        skills: filters.skills.join(','),
        gender: filters.gender.join(','),
        education: filters.education.join(','),
        company: filters.company.join(','),
        experienceMin: filters.experienceMin,
        experienceMax: filters.experienceMax,
        salaryMin: filters.salaryMin,
        salaryMax: filters.salaryMax,
        activeUpdated: filters.activeUpdated !== 'All time' ? filters.activeUpdated : '',
        sortBy: filters.sortBy,
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
      const exists = prev[field].includes(item);
      const updated = exists ? prev[field].filter(i => i !== item) : [...prev[field], item];
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
      const fieldKey = field === 'education' ? 'courses' : (field === 'skills' ? 'skills' : (field === 'location' ? 'locations' : (field === 'company' ? 'companies' : field)));
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
      keywordWithinResults: '',
      location: [],
      noticePeriod: [],
      gender: [],
      education: [],
      company: [],
      skills: [],
      experienceMin: '',
      experienceMax: '',
      salaryMin: '',
      salaryMax: '',
      activeUpdated: 'All time',
      page: 1,
      limit: 10,
      sortBy: 'Relevance'
    });
  };

  const toggleAccordion = (name) => {
    setOpenAccordions(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const toggleUnmaskPhone = (candidateId) => {
    setUnmaskedPhones(prev => ({ ...prev, [candidateId]: !prev[candidateId] }));
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
      const existing = JSON.parse(localStorage.getItem('careerfast_saved_searches') || '[]');
      const updated = [newSaved, ...existing];
      localStorage.setItem('careerfast_saved_searches', JSON.stringify(updated));
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

  // Applied Filters Badges List
  const appliedFiltersList = useMemo(() => {
    const list = [];
    if (filters.keywords) list.push({ key: 'keywords', label: filters.keywords, clear: () => handleSetFilter('keywords', '') });
    if (filters.keywordWithinResults) list.push({ key: 'kwRes', label: filters.keywordWithinResults, clear: () => handleSetFilter('keywordWithinResults', '') });

    filters.location.forEach(loc => {
      list.push({ key: `loc-${loc}`, label: loc, clear: () => handleToggleArrayFilter('location', loc) });
    });

    if (filters.experienceMin || filters.experienceMax) {
      const min = filters.experienceMin || '0';
      const max = filters.experienceMax ? `${filters.experienceMax} yrs` : '+ yrs';
      list.push({ key: 'exp', label: `Exp: ${min} - ${max}`, clear: () => { handleSetFilter('experienceMin', ''); handleSetFilter('experienceMax', ''); } });
    }

    filters.noticePeriod.forEach(np => {
      list.push({ key: `np-${np}`, label: np, clear: () => handleToggleArrayFilter('noticePeriod', np) });
    });

    filters.gender.forEach(g => {
      list.push({ key: `g-${g}`, label: `${g} only`, clear: () => handleToggleArrayFilter('gender', g) });
    });

    filters.education.forEach(edu => {
      list.push({ key: `edu-${edu}`, label: edu, clear: () => handleToggleArrayFilter('education', edu) });
    });

    filters.company.forEach(c => {
      list.push({ key: `c-${c}`, label: c, clear: () => handleToggleArrayFilter('company', c) });
    });

    filters.skills.forEach(s => {
      list.push({ key: `s-${s}`, label: s, clear: () => handleToggleArrayFilter('skills', s) });
    });

    if (filters.salaryMin || filters.salaryMax) {
      list.push({ key: 'salary', label: `CTC: ${filters.salaryMin || 0}L - ${filters.salaryMax || 'Any'}L`, clear: () => { handleSetFilter('salaryMin', ''); handleSetFilter('salaryMax', ''); } });
    }

    return list;
  }, [filters]);

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
        <div className="w-full lg:w-[300px] shrink-0 bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4 sticky top-20 max-h-[calc(100vh-100px)] overflow-y-auto hidden lg:block">

          <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
            <h2 className="text-[15px] font-bold text-slate-900 flex items-center gap-2 mb-0">
              <Filter size={16} className="text-[#0A66C2]" /> Filter Candidates
            </h2>
            {appliedFiltersList.length > 0 && (
              <button
                onClick={handleClearAll}
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
                  <span key={pill.key} className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50/80 hover:bg-blue-100 text-[#0A66C2] text-[12px] font-semibold rounded-lg border border-blue-200/60 transition-colors">
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

          {/* Find Keywords Within Results */}
          <div className="mb-4 pt-3 border-t border-slate-100">
            <label className="block text-[12px] font-bold text-slate-700 mb-2">Search Within Results</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by keyword, skill, or role..."
                value={filters.keywordWithinResults}
                onChange={e => handleSetFilter('keywordWithinResults', e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-[13px] text-slate-800 focus:outline-none focus:border-[#0A66C2] focus:ring-2 focus:ring-blue-500/15 transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* ACCORDION 1: Location */}
          <div className="py-3 border-t border-slate-100">
            <div
              onClick={() => toggleAccordion('location')}
              className="flex justify-between items-center cursor-pointer py-1 select-none group"
            >
              <h3 className="text-[13px] font-bold text-slate-800 flex items-center gap-1.5 group-hover:text-[#0A66C2] transition-colors">
                <span>Location</span>
                {filters.location.length > 0 && (
                  <span className="bg-blue-100 text-[#0A66C2] text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {filters.location.length}
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2">
                {filters.location.length > 0 && (
                  <span onClick={(e) => { e.stopPropagation(); handleClearField('location'); }} className="text-[11px] text-slate-400 hover:text-rose-600 font-semibold">
                    Clear
                  </span>
                )}
                <ChevronDown size={15} className={`text-slate-400 transition-transform ${openAccordions.location ? 'rotate-180 text-[#0A66C2]' : ''}`} />
              </div>
            </div>

            {openAccordions.location && (
              <div className="mt-2 space-y-1.5 max-h-52 overflow-y-auto pr-1">
                <div className="relative mb-1.5">
                  <input
                    type="text"
                    placeholder="Search locations..."
                    value={locSearch}
                    onChange={e => setLocSearch(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && locSearch.trim()) {
                        e.preventDefault();
                        handleAddCustomFilter('location', locSearch.trim(), setLocSearch);
                      }
                    }}
                    className="w-full pl-2.5 pr-7 py-1.5 text-[12px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0A66C2] focus:bg-white"
                  />
                  {locSearch.trim() && (
                    <button
                      type="button"
                      onClick={() => handleAddCustomFilter('location', locSearch.trim(), setLocSearch)}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-[#0A66C2] hover:text-[#004182] rounded cursor-pointer"
                      title="Add as location filter"
                    >
                      <Plus size={14} />
                    </button>
                  )}
                </div>

                {/* Dynamic Add Option Button if user typed custom location */}
                {locSearch.trim() && !filterOptions.locations.some(l => l.toLowerCase() === locSearch.trim().toLowerCase()) && (
                  <button
                    type="button"
                    onClick={() => handleAddCustomFilter('location', locSearch.trim(), setLocSearch)}
                    className="w-full flex items-center gap-1.5 px-2.5 py-1.5 mb-1.5 text-[12px] font-semibold text-[#0A66C2] bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-lg transition-colors cursor-pointer text-left shadow-2xs"
                  >
                    <Plus size={13} className="shrink-0 text-[#0A66C2]" />
                    <span className="truncate">Add &quot;{locSearch.trim()}&quot; as filter</span>
                  </button>
                )}

                {filterOptions.locations
                  .filter(loc => loc.toLowerCase().includes(locSearch.toLowerCase()))
                  .map(loc => {
                    const checked = filters.location.includes(loc);
                    return (
                      <label key={loc} className="flex items-center gap-2.5 text-[13px] text-slate-700 hover:text-slate-900 cursor-pointer select-none py-0.5">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleArrayFilter('location', loc)}
                          className="w-4 h-4 rounded border-slate-300 text-[#0A66C2] accent-[#0A66C2] focus:ring-blue-500 cursor-pointer"
                        />
                        <span className={checked ? 'font-bold text-[#0A66C2]' : ''}>{loc}</span>
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
                  <span onClick={(e) => { e.stopPropagation(); handleClearField('skills'); }} className="text-[11px] text-slate-400 hover:text-rose-600 font-semibold">
                    Clear
                  </span>
                )}
                <ChevronDown size={15} className={`text-slate-400 transition-transform ${openAccordions.skills ? 'rotate-180 text-[#0A66C2]' : ''}`} />
              </div>
            </div>

            {openAccordions.skills && (
              <div className="mt-2 space-y-1.5 max-h-52 overflow-y-auto pr-1">
                <div className="relative mb-1.5">
                  <input
                    type="text"
                    placeholder="Search skills..."
                    value={skillSearch}
                    onChange={e => setSkillSearch(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && skillSearch.trim()) {
                        e.preventDefault();
                        handleAddCustomFilter('skills', skillSearch.trim(), setSkillSearch);
                      }
                    }}
                    className="w-full pl-2.5 pr-7 py-1.5 text-[12px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0A66C2] focus:bg-white"
                  />
                  {skillSearch.trim() && (
                    <button
                      type="button"
                      onClick={() => handleAddCustomFilter('skills', skillSearch.trim(), setSkillSearch)}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-[#0A66C2] hover:text-[#004182] rounded cursor-pointer"
                      title="Add as skill filter"
                    >
                      <Plus size={14} />
                    </button>
                  )}
                </div>

                {/* Dynamic Add Option Button if user typed custom skill */}
                {skillSearch.trim() && !filterOptions.skills.some(s => s.toLowerCase() === skillSearch.trim().toLowerCase()) && (
                  <button
                    type="button"
                    onClick={() => handleAddCustomFilter('skills', skillSearch.trim(), setSkillSearch)}
                    className="w-full flex items-center gap-1.5 px-2.5 py-1.5 mb-1.5 text-[12px] font-semibold text-[#0A66C2] bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-lg transition-colors cursor-pointer text-left shadow-2xs"
                  >
                    <Plus size={13} className="shrink-0 text-[#0A66C2]" />
                    <span className="truncate">Add &quot;{skillSearch.trim()}&quot; as filter</span>
                  </button>
                )}

                {filterOptions.skills
                  .filter(s => s.toLowerCase().includes(skillSearch.toLowerCase()))
                  .slice(0, 30)
                  .map(s => {
                    const checked = filters.skills.includes(s);
                    return (
                      <label key={s} className="flex items-center gap-2.5 text-[13px] text-slate-700 hover:text-slate-900 cursor-pointer select-none py-0.5">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleArrayFilter('skills', s)}
                          className="w-4 h-4 rounded border-slate-300 text-[#0A66C2] accent-[#0A66C2] focus:ring-blue-500 cursor-pointer"
                        />
                        <span className={checked ? 'font-bold text-[#0A66C2]' : ''}>{s}</span>
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
                <span>Experience</span>
                {(filters.experienceMin || filters.experienceMax) && (
                  <span className="bg-blue-100 text-[#0A66C2] text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    Set
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2">
                {(filters.experienceMin || filters.experienceMax) && (
                  <span onClick={(e) => { e.stopPropagation(); handleSetFilter('experienceMin', ''); handleSetFilter('experienceMax', ''); }} className="text-[11px] text-slate-400 hover:text-rose-600 font-semibold">
                    Clear
                  </span>
                )}
                <ChevronDown size={15} className={`text-slate-400 transition-transform ${openAccordions.experience ? 'rotate-180 text-[#0A66C2]' : ''}`} />
              </div>
            </div>

            {openAccordions.experience && (
              <div className="mt-2 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[11px] text-slate-500 font-semibold block mb-1">Min (Years)</span>
                    <select
                      value={filters.experienceMin}
                      onChange={e => handleSetFilter('experienceMin', e.target.value)}
                      className="w-full text-[12px] bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus:border-[#0A66C2]"
                    >
                      <option value="">0 (Any)</option>
                      {[1, 2, 3, 5, 8, 10].map(y => (
                        <option key={y} value={y}>{y} Yrs</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-semibold block mb-1">Max (Years)</span>
                    <select
                      value={filters.experienceMax}
                      onChange={e => handleSetFilter('experienceMax', e.target.value)}
                      className="w-full text-[12px] bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus:border-[#0A66C2]"
                    >
                      <option value="">Any</option>
                      {[1, 2, 3, 5, 8, 10, 15, 20].map(y => (
                        <option key={y} value={y}>{y} Yrs</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Quick Experience Presets */}
                <div className="space-y-1 pt-1">
                  {[
                    { label: 'Freshers (0 - 1 yr)', min: '0', max: '1' },
                    { label: 'Junior (1 - 3 yrs)', min: '1', max: '3' },
                    { label: 'Mid-Level (3 - 5 yrs)', min: '3', max: '5' },
                    { label: 'Senior (5 - 8 yrs)', min: '5', max: '8' },
                    { label: 'Lead / Principal (8+ yrs)', min: '8', max: '' }
                  ].map(p => {
                    const active = filters.experienceMin === p.min && filters.experienceMax === p.max;
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => {
                          if (active) {
                            handleSetFilter('experienceMin', '');
                            handleSetFilter('experienceMax', '');
                          } else {
                            handleSetFilter('experienceMin', p.min);
                            handleSetFilter('experienceMax', p.max);
                          }
                        }}
                        className={`w-full text-left px-2 py-1 text-[12px] rounded-md transition-colors ${active ? 'bg-blue-50 text-[#0A66C2] font-bold' : 'hover:bg-slate-50 text-slate-600'
                          }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ACCORDION 4: Notice Period */}
          <div className="py-3 border-t border-slate-100">
            <div
              onClick={() => toggleAccordion('noticePeriod')}
              className="flex justify-between items-center cursor-pointer py-1 select-none group"
            >
              <h3 className="text-[13px] font-bold text-slate-800 flex items-center gap-1.5 group-hover:text-[#0A66C2] transition-colors">
                <span>Notice Period</span>
                {filters.noticePeriod.length > 0 && (
                  <span className="bg-blue-100 text-[#0A66C2] text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {filters.noticePeriod.length}
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2">
                {filters.noticePeriod.length > 0 && (
                  <span onClick={(e) => { e.stopPropagation(); handleClearField('noticePeriod'); }} className="text-[11px] text-slate-400 hover:text-rose-600 font-semibold">
                    Clear
                  </span>
                )}
                <ChevronDown size={15} className={`text-slate-400 transition-transform ${openAccordions.noticePeriod ? 'rotate-180 text-[#0A66C2]' : ''}`} />
              </div>
            </div>

            {openAccordions.noticePeriod && (
              <div className="mt-2 space-y-1">
                {['Immediate joiner', 'Upto 15 days', 'Upto 30 days', 'Upto 60 days', 'Upto 90 days'].map(np => {
                  const checked = filters.noticePeriod.includes(np);
                  return (
                    <label key={np} className="flex items-center gap-2.5 text-[13px] text-slate-700 hover:text-slate-900 cursor-pointer select-none py-0.5">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleArrayFilter('noticePeriod', np)}
                        className="w-4 h-4 rounded border-slate-300 text-[#0A66C2] accent-[#0A66C2] focus:ring-[#0A66C2] cursor-pointer"
                      />
                      <span className={checked ? 'font-bold text-[#0A66C2]' : ''}>{np}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* ACCORDION 5: Company */}
          <div className="py-3 border-t border-slate-100">
            <div
              onClick={() => toggleAccordion('company')}
              className="flex justify-between items-center cursor-pointer py-1 select-none group"
            >
              <h3 className="text-[13px] font-bold text-slate-800 flex items-center gap-1.5 group-hover:text-[#0A66C2] transition-colors">
                <span>Current / Past Company</span>
                {filters.company.length > 0 && (
                  <span className="bg-blue-100 text-[#0A66C2] text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {filters.company.length}
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2">
                {filters.company.length > 0 && (
                  <span onClick={(e) => { e.stopPropagation(); handleClearField('company'); }} className="text-[11px] text-slate-400 hover:text-rose-600 font-semibold">
                    Clear
                  </span>
                )}
                <ChevronDown size={15} className={`text-slate-400 transition-transform ${openAccordions.company ? 'rotate-180 text-[#0A66C2]' : ''}`} />
              </div>
            </div>

            {openAccordions.company && (
              <div className="mt-2 space-y-1.5 max-h-52 overflow-y-auto pr-1">
                <div className="relative mb-1.5">
                  <input
                    type="text"
                    placeholder="Filter or add company..."
                    value={companySearch}
                    onChange={e => setCompanySearch(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && companySearch.trim()) {
                        e.preventDefault();
                        handleAddCustomFilter('company', companySearch.trim(), setCompanySearch);
                      }
                    }}
                    className="w-full pl-2.5 pr-7 py-1 text-[12px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0A66C2] focus:bg-white"
                  />
                  {companySearch.trim() && (
                    <button
                      type="button"
                      onClick={() => handleAddCustomFilter('company', companySearch.trim(), setCompanySearch)}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-[#0A66C2] hover:text-[#004182] rounded cursor-pointer"
                      title="Add as company filter"
                    >
                      <Plus size={14} />
                    </button>
                  )}
                </div>

                {/* Dynamic Add Option Button if user typed custom company */}
                {companySearch.trim() && !filterOptions.companies.some(c => c.toLowerCase() === companySearch.trim().toLowerCase()) && (
                  <button
                    type="button"
                    onClick={() => handleAddCustomFilter('company', companySearch.trim(), setCompanySearch)}
                    className="w-full flex items-center gap-1.5 px-2.5 py-1.5 mb-1.5 text-[12px] font-semibold text-[#0A66C2] bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-lg transition-colors cursor-pointer text-left shadow-2xs"
                  >
                    <Plus size={13} className="shrink-0 text-[#0A66C2]" />
                    <span className="truncate">Add &quot;{companySearch.trim()}&quot; as filter</span>
                  </button>
                )}

                {filterOptions.companies
                  .filter(c => c.toLowerCase().includes(companySearch.toLowerCase()))
                  .map(c => {
                    const checked = filters.company.includes(c);
                    return (
                      <label key={c} className="flex items-center gap-2.5 text-[13px] text-slate-700 hover:text-slate-900 cursor-pointer select-none py-0.5">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleArrayFilter('company', c)}
                          className="w-4 h-4 rounded border-slate-300 text-[#0A66C2] accent-[#0A66C2] focus:ring-[#0A66C2] cursor-pointer"
                        />
                        <span className={checked ? 'font-bold text-[#0A66C2]' : ''}>{c}</span>
                      </label>
                    );
                  })}
              </div>
            )}
          </div>

          {/* ACCORDION 6: Education */}
          <div className="py-3 border-t border-slate-100">
            <div
              onClick={() => toggleAccordion('education')}
              className="flex justify-between items-center cursor-pointer py-1 select-none group"
            >
              <h3 className="text-[13px] font-bold text-slate-800 flex items-center gap-1.5 group-hover:text-[#0A66C2] transition-colors">
                <span>Education</span>
                {filters.education.length > 0 && (
                  <span className="bg-blue-100 text-[#0A66C2] text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {filters.education.length}
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2">
                {filters.education.length > 0 && (
                  <span onClick={(e) => { e.stopPropagation(); handleClearField('education'); }} className="text-[11px] text-slate-400 hover:text-rose-600 font-semibold">
                    Clear
                  </span>
                )}
                <ChevronDown size={15} className={`text-slate-400 transition-transform ${openAccordions.education ? 'rotate-180 text-[#0A66C2]' : ''}`} />
              </div>
            </div>

            {openAccordions.education && (
              <div className="mt-2 space-y-1.5 max-h-52 overflow-y-auto pr-1">
                <div className="relative mb-1.5">
                  <input
                    type="text"
                    placeholder="Filter or add degree/course..."
                    value={eduSearch}
                    onChange={e => setEduSearch(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && eduSearch.trim()) {
                        e.preventDefault();
                        handleAddCustomFilter('education', eduSearch.trim(), setEduSearch);
                      }
                    }}
                    className="w-full pl-2.5 pr-7 py-1 text-[12px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0A66C2] focus:bg-white"
                  />
                  {eduSearch.trim() && (
                    <button
                      type="button"
                      onClick={() => handleAddCustomFilter('education', eduSearch.trim(), setEduSearch)}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-[#0A66C2] hover:text-[#004182] rounded cursor-pointer"
                      title="Add as education filter"
                    >
                      <Plus size={14} />
                    </button>
                  )}
                </div>

                {/* Dynamic Add Option Button if user typed custom degree */}
                {eduSearch.trim() && !filterOptions.courses.some(c => c.toLowerCase() === eduSearch.trim().toLowerCase()) && (
                  <button
                    type="button"
                    onClick={() => handleAddCustomFilter('education', eduSearch.trim(), setEduSearch)}
                    className="w-full flex items-center gap-1.5 px-2.5 py-1.5 mb-1.5 text-[12px] font-semibold text-[#0A66C2] bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-lg transition-colors cursor-pointer text-left shadow-2xs"
                  >
                    <Plus size={13} className="shrink-0 text-[#0A66C2]" />
                    <span className="truncate">Add &quot;{eduSearch.trim()}&quot; as filter</span>
                  </button>
                )}

                {filterOptions.courses
                  .filter(edu => edu.toLowerCase().includes(eduSearch.toLowerCase()))
                  .map(edu => {
                    const checked = filters.education.includes(edu);
                    return (
                      <label key={edu} className="flex items-center gap-2.5 text-[13px] text-slate-700 hover:text-slate-900 cursor-pointer select-none py-0.5">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleArrayFilter('education', edu)}
                          className="w-4 h-4 rounded border-slate-300 text-[#0A66C2] accent-[#0A66C2] focus:ring-[#0A66C2] cursor-pointer"
                        />
                        <span className={checked ? 'font-bold text-[#0A66C2]' : ''}>{edu}</span>
                      </label>
                    );
                  })}
              </div>
            )}
          </div>

          {/* ACCORDION 7: Gender */}
          <div className="py-3 border-t border-slate-100">
            <div
              onClick={() => toggleAccordion('gender')}
              className="flex justify-between items-center cursor-pointer py-1 select-none group"
            >
              <h3 className="text-[13px] font-bold text-slate-800 flex items-center gap-1.5 group-hover:text-[#0A66C2] transition-colors">
                <span>Gender Inclusivity</span>
                {filters.gender.length > 0 && (
                  <span className="bg-blue-100 text-[#0A66C2] text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {filters.gender.length}
                  </span>
                )}
              </h3>
              <ChevronDown size={15} className={`text-slate-400 transition-transform ${openAccordions.gender ? 'rotate-180 text-[#0A66C2]' : ''}`} />
            </div>

            {openAccordions.gender && (
              <div className="mt-2 space-y-1">
                {['Male', 'Female'].map(g => {
                  const checked = filters.gender.includes(g);
                  return (
                    <label key={g} className="flex items-center gap-2.5 text-[13px] text-slate-700 hover:text-slate-900 cursor-pointer select-none py-0.5">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleArrayFilter('gender', g)}
                        className="w-4 h-4 rounded border-slate-300 text-[#0A66C2] accent-[#0A66C2] focus:ring-[#0A66C2] cursor-pointer"
                      />
                      <span className={checked ? 'font-bold text-[#0A66C2]' : ''}>{g} candidates</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Apply Filters Button matching mockup */}
          <div className="pt-2 border-t border-slate-100 mt-2">
            <button
              type="button"
              onClick={fetchCandidates}
              className="w-full bg-[#0A66C2] hover:bg-[#004182] active:bg-[#003366] text-white font-medium text-[13.5px] py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Filter size={15} /> Apply Filters
            </button>
          </div>

        </div>

        {/* Right Area - Results Feed & Controls */}
        <div className="flex-1 min-w-0 w-full space-y-4">

          {/* Top Header: Total Candidates & 4 Horizontal Stat Cards */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
                {totalCandidates} Candidates Found
              </h1>
              <p className="text-[13px] text-slate-500 font-normal mb-0">
                Based on your search for {filters.keywords ? `"${filters.keywords}"` : 'All profiles'}
                {totalAllEmployees > 0 && totalAllEmployees !== totalCandidates && (
                  <span className="text-slate-400 ml-1">
                    (out of {totalAllEmployees} total registered employees)
                  </span>
                )}
              </p>
            </div>

            {/* 4 Stat Cards */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Card 1: Total Employees */}
              <div className="bg-white rounded-2xl border border-slate-200/90 py-2.5 px-4 flex items-center gap-3 shadow-2xs min-w-[135px]">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0A66C2] flex items-center justify-center shrink-0">
                  <UsersIcon size={18} />
                </div>
                <div>
                  <div className="text-[16px] font-bold text-slate-900 leading-none">
                    {totalAllEmployees > 0 ? totalAllEmployees : totalCandidates}
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium mt-0.5">Total Employees</div>
                </div>
              </div>

              {/* Card 2: Active */}
              <div className="bg-white rounded-2xl border border-slate-200/90 py-2.5 px-4 flex items-center gap-3 shadow-2xs min-w-[115px]">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>
                <div>
                  <div className="text-[16px] font-bold text-slate-900 leading-none">
                    {totalActiveEmployees > 0 ? totalActiveEmployees : totalCandidates}
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium mt-0.5">Active</div>
                </div>
              </div>

              {/* Card 3: Available */}
              <div className="bg-white rounded-2xl border border-slate-200/90 py-2.5 px-4 flex items-center gap-3 shadow-2xs min-w-[115px]">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                  <UserCheck size={18} />
                </div>
                <div>
                  <div className="text-[16px] font-bold text-slate-900 leading-none">
                    {Math.max(1, Math.min(totalCandidates, Math.round(totalCandidates * 0.6)))}
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium mt-0.5">Available</div>
                </div>
              </div>

              {/* Card 4: Saved */}
              <div className="bg-white rounded-2xl border border-slate-200/90 py-2.5 px-4 flex items-center gap-3 shadow-2xs min-w-[115px]">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0A66C2] flex items-center justify-center shrink-0">
                  <Bookmark size={18} />
                </div>
                <div>
                  <div className="text-[16px] font-bold text-slate-900 leading-none">{savedCandidateIds.length}</div>
                  <div className="text-[11px] text-slate-400 font-medium mt-0.5">Saved</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Toolbar: Select All + Bulk Actions + Sort/Page Limit */}
          <div className="bg-white rounded-2xl border border-slate-200/90 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            {/* Left: Select all checkbox */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2.5 text-[13px] font-medium text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={candidates.length > 0 && selectedCandidateIds.length === candidates.length}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-slate-300 text-[#0A66C2] accent-[#0A66C2] focus:ring-[#0A66C2] cursor-pointer"
                />
                <span>Select all candidates</span>
              </label>

              {/* Bulk action buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const targetList = selectedCandidateIds.length > 0
                      ? candidates.filter(c => selectedCandidateIds.includes(c.id))
                      : candidates;
                    setContactModal({ type: 'Email', candidates: targetList });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-50/60 text-slate-700 hover:text-[#0A66C2] border border-slate-200 rounded-xl text-[12px] font-semibold transition-all cursor-pointer shadow-2xs"
                >
                  <Mail size={14} className="text-[#0A66C2]" /> Email
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const targetList = selectedCandidateIds.length > 0
                      ? candidates.filter(c => selectedCandidateIds.includes(c.id))
                      : candidates;
                    setContactModal({ type: 'WhatsApp', candidates: targetList });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50/60 text-slate-700 hover:text-emerald-700 border border-slate-200 rounded-xl text-[12px] font-semibold transition-all cursor-pointer shadow-2xs"
                >
                  <MessageSquare size={14} className="text-emerald-600" /> WhatsApp
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const targetList = selectedCandidateIds.length > 0
                      ? candidates.filter(c => selectedCandidateIds.includes(c.id))
                      : candidates;
                    setContactModal({ type: 'SMS', candidates: targetList });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-50/60 text-slate-700 hover:text-[#0A66C2] border border-slate-200 rounded-xl text-[12px] font-semibold transition-all cursor-pointer shadow-2xs"
                >
                  <MessageSquare size={14} className="text-[#0A66C2]" /> SMS
                </button>

                <button
                  type="button"
                  onClick={handleOpenFolderModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-amber-50/60 text-slate-700 hover:text-amber-700 border border-slate-200 rounded-xl text-[12px] font-semibold transition-all cursor-pointer shadow-2xs"
                >
                  <Bookmark size={14} className="text-amber-600" /> Add to Folder
                </button>
              </div>
            </div>

            {/* Right: Sort & Page Limit dropdowns */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-[13px] text-slate-600">
                <span className="text-slate-500 font-medium">Sort by</span>
                <select
                  value={filters.sortBy}
                  onChange={e => handleSetFilter('sortBy', e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-[12px] font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="Relevance">Best Match</option>
                  <option value="Newest">Newest First</option>
                  <option value="Oldest">Oldest First</option>
                  <option value="Experience (High to Low)">Exp: High to Low</option>
                  <option value="Experience (Low to High)">Exp: Low to High</option>
                  <option value="Name A-Z">Name (A-Z)</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-[13px] text-slate-600">
                <span className="text-slate-500 font-medium">Show</span>
                <select
                  value={filters.limit}
                  onChange={e => handleSetFilter('limit', parseInt(e.target.value, 10))}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-[12px] font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value={10}>10 / page</option>
                  <option value={20}>20 / page</option>
                  <option value={40}>40 / page</option>
                </select>
              </div>
            </div>
          </div>

          {/* Candidates Feed */}
          <div className="space-y-4">
            {loading ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center text-slate-500 font-medium shadow-2xs">
                <div className="w-9 h-9 border-3 border-[#0A66C2] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-[15px] font-bold text-slate-800">Matching & Scoring Candidates...</p>
                <p className="text-[13px] text-slate-400 mt-1">Applying real-time filters across candidate profiles and resumes</p>
              </div>
            ) : candidates.length > 0 ? (
              candidates.map((candidate, cardIdx) => {
                const isSelected = selectedCandidateIds.includes(candidate.id);
                const isSaved = savedCandidateIds.includes(candidate.id);
                const isUnmasked = unmaskedPhones[candidate.id];

                // Dynamic gradient for avatar to match diverse colors in screenshot
                const avatarGradients = [
                  'from-[#0A66C2] to-blue-600',
                  'from-sky-500 to-blue-700',
                  'from-rose-400 to-pink-500',
                  'from-emerald-500 to-teal-600',
                  'from-amber-500 to-orange-500',
                  'from-cyan-500 to-blue-600'
                ];
                const avatarGrad = avatarGradients[cardIdx % avatarGradients.length];

                // Initials
                const initials = `${candidate.first_name?.[0] || 'C'}${candidate.last_name?.[0] || ''}`.toUpperCase();

                // Experience text formatted like "2 Years 7 Months"
                const expDisplay = candidate.experience_years !== undefined && candidate.experience_years !== null
                  ? `${candidate.experience_years} Years ${candidate.experience_months || 0} Months`
                  : (candidate.experience_display || '2 Years');

                // Location display
                const locDisplay = candidate.location || (candidate.current_location ? candidate.current_location : 'Bangalore, Karnataka');

                // Profile Image check
                const rawImg = candidate.profile_image || candidate.profile_picture || candidate.photo || candidate.avatar || candidate.image;
                const candidateImgUrl = rawImg ? getImageUrl(rawImg) : null;

                return (
                  <div
                    key={candidate.id}
                    className={`bg-white rounded-2xl border transition-all p-4 shadow-2xs hover:shadow-md ${isSelected ? 'border-[#0A66C2] ring-2 ring-[#0A66C2]/10 bg-blue-50/10' : 'border-slate-200/90 hover:border-slate-300'
                      }`}
                  >
                    <div className="flex flex-col lg:flex-row items-start justify-between gap-6">

                      {/* Left: Checkbox + Avatar + Details + Skills */}
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        {/* Checkbox */}
                        <div className="pt-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleCandidateSelect(candidate.id)}
                            className="w-4 h-4 rounded border-slate-300 text-[#0A66C2] accent-[#0A66C2] focus:ring-[#0A66C2] cursor-pointer"
                          />
                        </div>

                        {/* Circular Avatar with Active Dot */}
                        <div
                          onClick={() => {
                            if (candidateImgUrl) {
                              setPreviewImageModal({
                                url: candidateImgUrl,
                                title: `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim(),
                                subtitle: candidate.current_job_title || 'Candidate Profile'
                              });
                            } else {
                              setResumeModalCandidate(candidate);
                            }
                          }}
                          className="relative shrink-0 cursor-pointer group"
                          title={candidateImgUrl ? "Click to view photo" : "Click to view profile"}
                        >
                          {candidateImgUrl ? (
                            <img
                              src={candidateImgUrl}
                              alt={`${candidate.first_name || ''} ${candidate.last_name || ''}`}
                              className="w-12 h-12 rounded-full object-cover shadow-sm border border-slate-200 group-hover:ring-2 group-hover:ring-[#0A66C2] transition-all"
                              onError={(e) => {
                                // Hide broken image so fallback initials or background shows cleanly
                                e.currentTarget.style.display = 'none';
                                if (e.currentTarget.nextSibling) {
                                  e.currentTarget.nextSibling.style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          <div
                            style={{ display: candidateImgUrl ? 'none' : 'flex' }}
                            className={`w-12 h-12 rounded-full bg-gradient-to-tr ${avatarGrad} text-white items-center justify-center font-bold text-[15px] shadow-sm tracking-wider group-hover:ring-2 group-hover:ring-[#0A66C2] transition-all`}
                          >
                            {initials}
                          </div>
                          <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white absolute bottom-0 right-0" />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          {/* Name + Verified / Available Badge */}
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h2
                              onClick={() => setResumeModalCandidate(candidate)}
                              className="text-[17px] font-bold text-slate-900 hover:text-[#0A66C2] cursor-pointer tracking-tight mb-0"
                            >
                              {renderHighlightedText(`${candidate.first_name || ''} ${candidate.last_name || ''}`.trim())}
                            </h2>

                            {/* Badge */}
                            {cardIdx % 3 === 2 ? (
                              <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-700 border border-sky-200/80 rounded-full px-2.5 py-0.5 text-[11px] font-semibold">
                                <UserCheck size={11} className="text-sky-600" /> Available
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full px-2.5 py-0.5 text-[11px] font-semibold">
                                <CheckCircle2 size={11} className="text-emerald-600" /> Verified
                              </span>
                            )}
                          </div>

                          {/* Role and Company */}
                          <div className="text-[13px] text-slate-700 font-medium mb-1.5">
                            {candidate.current_job_title ? (
                              <>
                                <span>{renderHighlightedText(candidate.current_job_title)}</span>
                                {candidate.current_company && (
                                  <span className="text-slate-500"> at <span className="font-semibold text-slate-800">{renderHighlightedText(candidate.current_company)}</span></span>
                                )}
                              </>
                            ) : (
                              <span>Software Developer at ACTE Technologies</span>
                            )}
                          </div>

                          {/* Location and Experience Row */}
                          <div className="flex flex-wrap items-center gap-4 text-[12px] text-slate-500 mb-3 font-normal">
                            <span className="flex items-center gap-1 text-slate-600 font-medium">
                              <MapPin size={13} className="text-[#0A66C2]" /> {locDisplay}
                            </span>
                            <span className="flex items-center gap-1 text-slate-500">
                              <Briefcase size={13} className="text-slate-400" /> {expDisplay}
                            </span>
                          </div>

                          {/* Skills Pills */}
                          {candidate.skills && candidate.skills.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5">
                              {(expandedSkillsMap[candidate.id] ? candidate.skills : candidate.skills.slice(0, 6)).map((skill, sIdx) => {
                                const isSkillMatched = activeKeywords.length > 0 && activeKeywords.some(kw => skill.toLowerCase().includes(kw.toLowerCase()));
                                return (
                                  <span
                                    key={sIdx}
                                    onClick={() => handleToggleArrayFilter('skills', skill)}
                                    className={`px-2.5 py-1 rounded-lg text-[12px] cursor-pointer transition-all border ${isSkillMatched
                                      ? 'bg-blue-50 text-[#0A66C2] border-blue-200/90 font-semibold shadow-2xs'
                                      : 'bg-slate-50 text-slate-600 border-slate-200/80 font-normal hover:bg-blue-50 hover:text-[#0A66C2]'
                                      }`}
                                    title="Click to filter by this skill"
                                  >
                                    {renderHighlightedText(skill)}
                                  </span>
                                );
                              })}

                              {candidate.skills.length > 6 && (
                                <button
                                  type="button"
                                  onClick={() => toggleExpandSkills(candidate.id)}
                                  className="text-[#0A66C2] hover:text-[#004182] text-[12px] font-semibold cursor-pointer hover:underline px-1 py-0.5 transition-colors"
                                >
                                  {expandedSkillsMap[candidate.id]
                                    ? 'Show less'
                                    : `+${candidate.skills.length - 6} more`}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Star + View Profile, Summary Quote, Phone/Email/WhatsApp */}
                      <div className="w-full lg:w-[360px] flex flex-col justify-between gap-3 shrink-0">
                        {/* Top Action Row: Star + More + View Profile */}
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => toggleSaveCandidate(candidate.id)}
                            className={`p-1.5 rounded-lg cursor-pointer transition-colors ${isSaved
                              ? 'text-[#0A66C2] bg-blue-50 hover:bg-blue-100'
                              : 'text-slate-400 hover:text-[#0A66C2] hover:bg-slate-100'
                              }`}
                            title={isSaved ? "Remove from saved" : "Save candidate"}
                          >
                            <Bookmark
                              size={18}
                              className={isSaved ? "text-[#0A66C2] fill-[#0A66C2]" : "text-slate-400"}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() => setResumeModalCandidate(candidate)}
                            className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                            title="More options"
                          >
                            <MoreVertical size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setResumeModalCandidate(candidate)}
                            className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0A66C2] bg-blue-50/70 hover:bg-blue-100/80 border border-blue-200/80 px-3 py-1.5 rounded-xl cursor-pointer transition-all shadow-2xs"
                          >
                            <FileText size={13} className="text-[#0A66C2]" /> View Profile
                          </button>
                        </div>

                        {/* Middle: Italic Summary Quote */}
                        <div className="text-[12px] text-slate-600 leading-relaxed">
                          <p className={`italic mb-0 ${expandedAboutMap[candidate.id] ? '' : 'line-clamp-2'}`}>
                            &ldquo;{renderHighlightedText(candidate.about || 'Frontend / Full Stack Developer with experience in building responsive, scalable, and user-friendly web applications...')}&rdquo;
                          </p>
                          <button
                            type="button"
                            onClick={() => toggleExpandAbout(candidate.id)}
                            className="text-[#0A66C2] hover:text-[#004182] font-semibold text-[11.5px] hover:underline cursor-pointer inline-flex items-center gap-1 mt-0.5"
                          >
                            <span>{expandedAboutMap[candidate.id] ? 'Show less' : 'Show full summary'}</span>
                            <ArrowRight size={11} />
                          </button>
                        </div>

                        {/* Bottom: Phone Pill + Email Button + WhatsApp Button */}
                        <div className="flex flex-wrap items-center gap-1 pt-1">
                          {/* Phone pill */}
                          <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[12px] text-slate-700 font-medium">
                            <Phone size={12} className="text-emerald-600 shrink-0" />
                            <span>
                              {isUnmasked
                                ? (candidate.phone_code ? `${candidate.phone_code} ${candidate.phone}` : candidate.phone)
                                : `+91-${candidate.phone ? candidate.phone.slice(0, 3) : '658'}******`}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleUnmaskPhone(candidate.id)}
                              className="text-[#0A66C2] font-bold hover:underline cursor-pointer ml-1 text-[11px]"
                            >
                              {isUnmasked ? "Hide" : "Show"}
                            </button>
                          </div>

                          {/* Email button */}
                          <button
                            type="button"
                            onClick={() => setContactModal({ type: 'Email', candidates: [candidate] })}
                            className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-700 cursor-pointer shadow-2xs transition-colors"
                          >
                            <Mail size={13} className="text-[#0A66C2]" /> Email
                          </button>

                          {/* WhatsApp button */}
                          {candidate.phone ? (
                            <a
                              href={`https://wa.me/${candidate.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${candidate.first_name}, I saw your profile on CareerFast and would like to discuss an opportunity.`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="whatsapp-btn flex items-center gap-1.5 px-3 py-1 bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200 !text-emerald-800 hover:!text-emerald-900 rounded-lg text-[12px] font-semibold cursor-pointer shadow-2xs transition-colors !no-underline hover:!no-underline"
                              style={{ textDecoration: 'none', color: '#047857' }}
                            >
                              <MessageSquare size={13} className="text-emerald-600" />
                              <span className="!text-emerald-800 hover:!text-emerald-900">WhatsApp</span>
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setContactModal({ type: 'WhatsApp', candidates: [candidate] })}
                              className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-lg text-[12px] font-semibold cursor-pointer shadow-2xs transition-colors"
                            >
                              <MessageSquare size={13} className="text-emerald-600" /> WhatsApp
                            </button>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Bottom Footer Bar */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-[11.5px] text-slate-400">
                      <div className="flex flex-wrap items-center gap-4">
                        <span>Candidate ID: #{candidate.id}</span>
                        <span>Registered: {new Date(candidate.created_date || '2026-08-10').toLocaleDateString()}</span>
                        <span>Last Active: 2 days ago</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-[12px]">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> Active Candidate
                      </div>
                    </div>

                  </div>
                );
              })
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center shadow-2xs">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#0A66C2]">
                  <Search size={30} className="stroke-[2.5]" />
                </div>
                <h3 className="text-[18px] font-bold text-slate-900 mb-1">No Matching Candidates Found</h3>
                <p className="text-[13px] text-slate-500 max-w-md mx-auto mb-5 leading-relaxed">
                  We couldn&apos;t find candidates matching your exact criteria. Try broadening your keywords or removing some location / experience constraints.
                </p>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-6 py-2.5 bg-[#0A66C2] hover:bg-[#004182] text-white font-bold rounded-xl text-[13px] cursor-pointer shadow-sm transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>

          {/* Dynamic Pagination Bar as per API */}
          {totalCandidates > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/90 px-5 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xs mt-6 mb-10">
              {/* Left Info: Showing X to Y of Z candidates / employees */}
              <div className="text-[13px] text-slate-600 font-medium text-center md:text-left">
                Showing{' '}
                <span className="font-bold text-slate-900">
                  {Math.min((filters.page - 1) * filters.limit + 1, totalCandidates)}
                </span>
                {' '}-{' '}
                <span className="font-bold text-slate-900">
                  {Math.min(filters.page * filters.limit, totalCandidates)}
                </span>
                {' '}of{' '}
                <span className="font-bold text-[#0A66C2]">
                  {totalCandidates}
                </span>
                {' '}Candidates / Employees
                {totalPages > 1 && (
                  <span className="text-slate-400 text-[12px] ml-1.5 font-normal">
                    (Page {filters.page} of {totalPages})
                  </span>
                )}
              </div>

              {/* Center: Pagination Controls */}
              <div className="flex items-center gap-1.5">
                {/* Previous Page Button */}
                <button
                  type="button"
                  disabled={filters.page <= 1}
                  onClick={() => handlePageChange(filters.page - 1)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[13px] font-semibold border transition-all ${
                    filters.page <= 1
                      ? 'border-slate-200 text-slate-300 bg-slate-50 cursor-not-allowed'
                      : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 cursor-pointer shadow-2xs'
                  }`}
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>

                {/* Page Number Buttons with Smart Ellipsis */}
                <div className="flex items-center gap-1">
                  {getPageNumbers(filters.page, totalPages).map((item, idx) => {
                    if (item === '...') {
                      return (
                        <span key={`ellipsis-${idx}`} className="px-2 py-1 text-slate-400 text-[13px] select-none font-bold">
                          ...
                        </span>
                      );
                    }
                    const pageNum = item;
                    const isActive = filters.page === pageNum;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-9 h-9 rounded-xl text-[13px] font-bold flex items-center justify-center transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#0A66C2] text-white shadow-xs'
                            : 'text-slate-700 hover:bg-slate-100 border border-transparent hover:border-slate-200'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                {/* Next Page Button */}
                <button
                  type="button"
                  disabled={filters.page >= totalPages}
                  onClick={() => handlePageChange(filters.page + 1)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[13px] font-semibold border transition-all ${
                    filters.page >= totalPages
                      ? 'border-slate-200 text-slate-300 bg-slate-50 cursor-not-allowed'
                      : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 cursor-pointer shadow-2xs'
                  }`}
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Right: Items per page selector */}
              <div className="flex items-center gap-2 text-[13px] text-slate-600">
                <span className="text-slate-500 font-medium">Per page:</span>
                <select
                  value={filters.limit}
                  onChange={(e) => {
                    handleSetFilter('limit', parseInt(e.target.value, 10));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-[13px] font-semibold text-slate-700 focus:outline-none focus:border-[#0A66C2] cursor-pointer shadow-2xs"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={40}>40</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Resume Preview Modal */}
      {resumeModalCandidate && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto space-y-6 border border-slate-200/80">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div className="flex items-center gap-4">
                {(() => {
                  const modalRawImg = resumeModalCandidate.profile_image || resumeModalCandidate.profile_picture || resumeModalCandidate.photo || resumeModalCandidate.avatar || resumeModalCandidate.image;
                  const modalImgUrl = modalRawImg ? getImageUrl(modalRawImg) : null;
                  return (
                    <div
                      onClick={() => {
                        if (modalImgUrl) {
                          setPreviewImageModal({
                            url: modalImgUrl,
                            title: `${resumeModalCandidate.first_name || ''} ${resumeModalCandidate.last_name || ''}`.trim(),
                            subtitle: resumeModalCandidate.current_job_title || 'Candidate Profile'
                          });
                        }
                      }}
                      className={`relative shrink-0 ${modalImgUrl ? 'cursor-pointer group' : ''}`}
                      title={modalImgUrl ? "Click to view full photo" : ""}
                    >
                      {modalImgUrl ? (
                        <img
                          src={modalImgUrl}
                          alt="Profile"
                          className="w-14 h-14 rounded-2xl object-cover shadow-sm border border-slate-200 group-hover:ring-2 group-hover:ring-[#0A66C2] transition-all"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.nextSibling) {
                              e.currentTarget.nextSibling.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div
                        style={{ display: modalImgUrl ? 'none' : 'flex' }}
                        className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0A66C2] to-blue-600 text-white items-center justify-center font-bold text-xl shadow-sm"
                      >
                        {resumeModalCandidate.first_name?.[0]}{resumeModalCandidate.last_name?.[0]}
                      </div>
                    </div>
                  );
                })()}
                <div>
                  <h2 className="text-[20px] font-bold text-slate-900 tracking-tight">
                    {renderHighlightedText(`${resumeModalCandidate.first_name || ''} ${resumeModalCandidate.last_name || ''}`.trim())}
                  </h2>
                  <p className="text-[13px] text-slate-500 mb-0">
                    {renderHighlightedText(resumeModalCandidate.current_job_title || 'Candidate Profile')} • {resumeModalCandidate.location || 'India'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setResumeModalCandidate(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Candidate Details Content */}
            <div className="space-y-5 text-[14px]">
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Contact & Verification Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700 bg-slate-50 p-4 rounded-2xl text-[13px] border border-slate-100">
                  <div><strong className="text-slate-500 block text-[11px] uppercase">Email</strong> {resumeModalCandidate.email}</div>
                  <div><strong className="text-slate-500 block text-[11px] uppercase">Phone</strong> {resumeModalCandidate.phone || 'Not available'}</div>
                  <div><strong className="text-slate-500 block text-[11px] uppercase">Current Location</strong> {resumeModalCandidate.location || 'Not specified'}</div>
                  <div><strong className="text-slate-500 block text-[11px] uppercase">Experience</strong> {resumeModalCandidate.experience_display}</div>
                </div>
              </div>

              {resumeModalCandidate.about && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Professional Summary</h4>
                  <p className="text-slate-600 leading-relaxed text-[13px] bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    {renderHighlightedText(resumeModalCandidate.about)}
                  </p>
                </div>
              )}

              {resumeModalCandidate.skills?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Core Skills & Competencies</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {resumeModalCandidate.skills.map((s, i) => {
                      const isMatch = activeKeywords.length > 0 && activeKeywords.some(kw => s.toLowerCase().includes(kw.toLowerCase()));
                      return (
                        <span
                          key={i}
                          className={`px-3 py-1 rounded-full text-[12px] font-semibold border ${isMatch
                            ? 'bg-amber-50 text-slate-900 border-amber-300 shadow-2xs'
                            : 'bg-blue-50 text-[#0A66C2] border border-blue-200/70'
                            }`}
                        >
                          {renderHighlightedText(s)}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {resumeModalCandidate.education && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-1.5">Academic Qualifications</h4>
                  <div className="bg-slate-50 p-4 rounded-2xl text-[13px] space-y-1 text-slate-700 border border-slate-100">
                    <p className="font-bold text-slate-900">{renderHighlightedText(resumeModalCandidate.education.course || resumeModalCandidate.course)}</p>
                    {resumeModalCandidate.education.college && <p className="text-slate-600">{renderHighlightedText(resumeModalCandidate.education.college)}</p>}
                    {resumeModalCandidate.education.cgpa && <p className="text-slate-500 text-[12px]">CGPA / Percentage: {resumeModalCandidate.education.cgpa}</p>}
                  </div>
                </div>
              )}

              {/* Resume File Status */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Resume File Document</h4>
                {resumeModalCandidate.resume && resumeModalCandidate.resume !== 'Resume' ? (
                  <div className="flex items-center justify-between bg-blue-50/70 border border-blue-200/80 p-4 rounded-2xl">
                    <div className="flex items-center gap-3 text-blue-950 text-[13px] font-bold">
                      <FileText size={20} className="text-[#0A66C2]" />
                      Candidate Resume Attachment
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => viewResumeFile(resumeModalCandidate.resume)}
                        className="px-3.5 py-2 bg-white text-[#0A66C2] border border-blue-200 hover:border-[#0A66C2] hover:bg-blue-50 text-[12px] font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                        title="View Resume in new tab"
                      >
                        <FileText size={14} /> View
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadResumeFile(
                          resumeModalCandidate.resume,
                          `${resumeModalCandidate.first_name || ''} ${resumeModalCandidate.last_name || ''}`.trim()
                        )}
                        className="px-4 py-2 bg-[#0A66C2] text-white text-[12px] font-bold rounded-xl hover:bg-[#004182] flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                        title="Download Resume PDF"
                      >
                        <Download size={14} /> Download PDF
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[13px] text-slate-400 italic bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    Resume file parsed directly into verified candidate profile data above.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setResumeModalCandidate(null)}
                className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold text-[13px] cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setContactModal({ type: 'Email', candidates: [resumeModalCandidate] });
                  setResumeModalCandidate(null);
                }}
                className="px-6 py-2 bg-[#0A66C2] hover:bg-[#004182] text-white font-bold rounded-xl text-[13px] cursor-pointer shadow-sm transition-colors"
              >
                Contact Candidate
              </button>
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
              <button onClick={() => setContactModal(null)} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg">
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
                onClick={() => setContactModal(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold text-[13px]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert(`Message sent via ${contactModal.type} to ${contactModal.candidates.length} candidate(s)!`);
                  setContactModal(null);
                  setContactMessage('');
                }}
                className="px-6 py-2 bg-[#0A66C2] hover:bg-[#004182] text-white font-bold rounded-xl text-[13px] shadow-sm transition-colors"
              >
                Send {contactModal.type}
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

    </div>
  );
};

export default CandidateSearchResults;

