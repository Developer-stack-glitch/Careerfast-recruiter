'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FiFolder,
  FiPlus,
  FiSearch,
  FiMoreVertical,
  FiMail,
  FiDownload,
  FiTrash2,
  FiEdit2,
  FiArchive,
  FiX,
  FiCheck,
  FiUsers,
  FiBriefcase,
  FiShare2,
  FiStar,
  FiCalendar,
  FiFileText,
  FiUserCheck,
  FiUserX,
  FiSend,
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiChevronUp,
  FiGrid,
  FiList,
  FiPhone,
  FiMessageSquare,
  FiFilter,
  FiArrowLeft,
  FiTag,
  FiMapPin,
  FiAward,
  FiSliders
} from 'react-icons/fi';
import { FaWhatsapp, FaLinkedin } from 'react-icons/fa';
import {
  getCandidateFoldersAPI,
  createCandidateFolderAPI,
  updateCandidateFolderAPI,
  deleteCandidateFolderAPI,
  getFolderCandidatesAPI,
  updateFolderCandidateStageAPI,
  removeCandidateFromFolderAPI,
  addCandidatesToFolderAPI,
  getJobPostByUserId
} from '../ApiService/action';
import { CommonToaster } from '../Common/CommonToaster';
import Link from 'next/link';
import { getImageUrl } from '../utils/getImageUrl';
import { downloadResumeFile } from '../utils/downloadResume';

export default function FolderManagement() {
  // Tabs: 'personal' | 'with_job' | 'shared_with_you' | 'shared_by_you' | 'default' | 'archived'
  const [activeTab, setActiveTab] = useState('personal');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('active'); // 'active' | 'name' | 'candidates'
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState([]);
  const [allFolders, setAllFolders] = useState([]);
  const [tabCounts, setTabCounts] = useState({
    personal: 0,
    with_job: 0,
    shared: 0,
    default: 0,
    archived: 0,
    all: 0
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Recruiter Details & Posted Jobs
  const [recruiterDetails, setRecruiterDetails] = useState(null);
  const [postedJobs, setPostedJobs] = useState([]);

  // Create / Edit Folder Modal
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [folderForm, setFolderForm] = useState({
    name: '',
    job_id: '',
    folder_type: 'personal',
    color: 'blue',
    description: ''
  });
  const [savingFolder, setSavingFolder] = useState(false);

  // Active 3-dots Dropdown Menu
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  // Candidate Details Pipeline View State
  const [selectedFolderForDrawer, setSelectedFolderForDrawer] = useState(null);
  const [drawerCandidates, setDrawerCandidates] = useState([]);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerStageFilter, setDrawerStageFilter] = useState('all');
  const [drawerSearch, setDrawerSearch] = useState('');

  // Pipeline Filter States (Matching Candidate Search Page)
  const [pipelineTab, setPipelineTab] = useState('all'); // 'all' | 'prospect' | 'applicant' | 'interviewed' | 'rejected' | 'hired'
  const [pipelineSubPill, setPipelineSubPill] = useState('all'); // 'all' | 'shortlisted' | 'contacted' | 'responded'
  const [pipelineSearch, setPipelineSearch] = useState('');
  const [pipelineProfileType, setPipelineProfileType] = useState('all'); // 'all' | 'registered' | 'sourced'
  const [pipelineNonExported, setPipelineNonExported] = useState(false);
  const [pipelineSort, setPipelineSort] = useState('recent'); // 'recent' | 'exp_desc' | 'exp_asc' | 'name_asc'

  // Dynamic Multi-Select Filters
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [selectedExperiences, setSelectedExperiences] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedNoticePeriods, setSelectedNoticePeriods] = useState([]);
  const [selectedEducations, setSelectedEducations] = useState([]);
  const [selectedPipelineCandidateIds, setSelectedPipelineCandidateIds] = useState([]);

  // Accordion Expand/Collapse States
  const [pipelineAccordions, setPipelineAccordions] = useState({
    location: true,
    experience: true,
    skills: true,
    notice: true,
    education: false
  });

  // Interactive Popover States
  const [activeSavedPopoverId, setActiveSavedPopoverId] = useState(null);
  const [activeStagePopoverId, setActiveStagePopoverId] = useState(null);
  const [activeMoveDropdownId, setActiveMoveDropdownId] = useState(null);
  const [isBulkMoveOpen, setIsBulkMoveOpen] = useState(false);
  const [unmaskedPhones, setUnmaskedPhones] = useState({});
  const [expandedSkillsMap, setExpandedSkillsMap] = useState({});
  const [expandedAboutMap, setExpandedAboutMap] = useState({});

  // Recruiter Note / Comment Modal
  const [commentModalCandidate, setCommentModalCandidate] = useState(null);
  const [candidateCommentText, setCandidateCommentText] = useState('');
  const [commentsMap, setCommentsMap] = useState({});

  // Send Email Modal
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailTargetFolder, setEmailTargetFolder] = useState(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailStageFilter, setEmailStageFilter] = useState('all');
  const [sendingEmail, setSendingEmail] = useState(false);

  // Photo Preview Modal
  const [previewImageModal, setPreviewImageModal] = useState(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load Recruiter Details
  useEffect(() => {
    try {
      const stored = localStorage.getItem('loginDetails');
      if (stored) {
        setRecruiterDetails(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading login details:', e);
    }
  }, []);

  // Fetch Recruiter Jobs for Linking
  useEffect(() => {
    const fetchJobs = async () => {
      if (!recruiterDetails?.id) return;
      try {
        const res = await getJobPostByUserId({
          user_id: recruiterDetails.id,
          limit: 100,
          page: 1
        });
        if (res?.data?.data) {
          setPostedJobs(res.data.data);
        }
      } catch (e) {
        console.error('Error fetching jobs:', e);
      }
    };
    fetchJobs();
  }, [recruiterDetails]);

  // Fetch Folders from Backend
  const fetchFolders = async () => {
    try {
      setLoading(true);
      const res = await getCandidateFoldersAPI({
        tab: activeTab === 'shared_with_you' || activeTab === 'shared_by_you' ? 'shared' : activeTab,
        search: searchQuery
      });
      if (res?.data?.success) {
        setFolders(res.data.data || []);
        if (res.data.tabCounts) {
          setTabCounts(res.data.tabCounts);
        }
      }
      // Also fetch allFolders for Move To dropdowns
      const resAll = await getCandidateFoldersAPI({ tab: 'all' });
      if (resAll?.data?.success) {
        setAllFolders(resAll.data.data || []);
      }
    } catch (err) {
      console.error('Error loading folders:', err);
      CommonToaster('Failed to load folders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, [activeTab]);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFolders();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Open Candidate Pipeline View
  const openFolderDrawer = async (folder, initialStage = 'all') => {
    setSelectedFolderForDrawer(folder);
    const validInitialStage = ['all', 'prospect', 'applicant', 'interviewed', 'hired', 'rejected'].includes(initialStage)
      ? initialStage
      : 'all';
    setDrawerStageFilter(validInitialStage);
    setDrawerSearch('');
    setPipelineTab(validInitialStage);
    setPipelineSubPill('all');
    setPipelineSearch('');
    setPipelineProfileType('all');
    setPipelineNonExported(false);
    setSelectedLocations([]);
    setSelectedExperiences([]);
    setSelectedSkills([]);
    setSelectedNoticePeriods([]);
    setSelectedEducations([]);
    setSelectedPipelineCandidateIds([]);
    setActiveSavedPopoverId(null);
    setActiveStagePopoverId(null);
    setActiveMoveDropdownId(null);
    setIsBulkMoveOpen(false);

    try {
      setDrawerLoading(true);
      const res = await getFolderCandidatesAPI(folder.id, { stage: 'all' });
      if (res?.data?.success) {
        setDrawerCandidates(res.data.data || []);
        if (res.data.folder) {
          setSelectedFolderForDrawer((prev) => ({ ...(prev || folder), ...res.data.folder }));
        }
      }
    } catch (err) {
      console.error('Error loading folder candidates:', err);
      CommonToaster('Failed to load candidates', 'error');
    } finally {
      setDrawerLoading(false);
    }
  };

  // Update Candidate Stage inside Drawer
  const handleUpdateCandidateStage = async (candidateId, newStage) => {
    if (!selectedFolderForDrawer) return;
    try {
      const res = await updateFolderCandidateStageAPI(
        selectedFolderForDrawer.id,
        candidateId,
        newStage
      );
      if (res?.data?.success) {
        CommonToaster(`Moved candidate to ${newStage.toUpperCase()}`, 'success');
        setDrawerCandidates((prev) =>
          prev.map((c) => (c.id === candidateId ? { ...c, stage: newStage } : c))
        );
        fetchFolders();
      }
    } catch (err) {
      console.error('Error updating stage:', err);
      CommonToaster('Failed to update stage', 'error');
    }
  };

  // Helper to extract candidate phone
  const getCandidatePhone = (cand) => {
    return cand?.phone || cand?.mobile_no || cand?.contact_no || '';
  };

  // Helper to format candidate phone with country code
  const formatCandidatePhone = (cand) => {
    const num = getCandidatePhone(cand);
    if (!num) return 'Not Available';
    const code = cand?.phone_code ? `${cand.phone_code} ` : '+91 ';
    if (String(num).startsWith('+')) return num;
    return `${code}${num}`;
  };

  // Export Candidates to CSV
  const handleExportCSV = async (folder) => {
    try {
      const res = await getFolderCandidatesAPI(folder.id, { stage: 'all' });
      const candidates = res?.data?.data || [];
      if (candidates.length === 0) {
        CommonToaster(`No candidates found in "${folder.name}" to export`, 'info');
        return;
      }

      const headers = ['Name', 'Email', 'Phone', 'Role', 'Company', 'Experience', 'Stage', 'Location', 'Skills', 'Summary'];
      const rows = candidates.map((c) => [
        `"${c.name || ''}"`,
        `"${c.email || ''}"`,
        `"${formatCandidatePhone(c)}"`,
        `"${c.job_title || ''}"`,
        `"${c.company_name || ''}"`,
        `"${c.experience_display || c.total_years || ''}"`,
        `"${getStageMeta(c.stage).label}"`,
        `"${c.location || ''}"`,
        `"${(c.skills || []).join(', ')}"`,
        `"${(c.about || '').replace(/"/g, '""')}"`
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `${folder.name.replace(/\s+/g, '_')}_candidates.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      CommonToaster(`Exported ${candidates.length} candidate(s) to CSV`, 'success');
    } catch (err) {
      console.error('Error exporting CSV:', err);
      CommonToaster('Failed to export candidates', 'error');
    }
  };

  // Save / Update Folder
  const handleSaveFolder = async (e) => {
    e.preventDefault();
    if (!folderForm.name.trim()) {
      CommonToaster('Please enter a folder name', 'warning');
      return;
    }
    try {
      setSavingFolder(true);
      if (editingFolder) {
        const res = await updateCandidateFolderAPI(editingFolder.id, folderForm);
        if (res?.data?.success) {
          CommonToaster(`Folder "${folderForm.name}" updated`, 'success');
          setIsFolderModalOpen(false);
          setEditingFolder(null);
          fetchFolders();
        }
      } else {
        const res = await createCandidateFolderAPI(folderForm);
        if (res?.data?.success) {
          CommonToaster(`Folder "${folderForm.name}" created`, 'success');
          setIsFolderModalOpen(false);
          setFolderForm({
            name: '',
            job_id: '',
            folder_type: 'personal',
            color: 'blue',
            description: ''
          });
          fetchFolders();
        }
      }
    } catch (err) {
      console.error('Error saving folder:', err);
      CommonToaster(err?.response?.data?.message || 'Failed to save folder', 'error');
    } finally {
      setSavingFolder(false);
    }
  };

  // Delete Folder
  const handleDeleteFolder = async (folder) => {
    if (!window.confirm(`Delete folder "${folder.name}"? Candidates will remain safe in your pool.`)) return;
    try {
      const res = await deleteCandidateFolderAPI(folder.id);
      if (res?.data?.success) {
        CommonToaster(`Folder "${folder.name}" deleted`, 'info');
        setOpenMenuId(null);
        fetchFolders();
      }
    } catch (err) {
      console.error('Error deleting folder:', err);
      CommonToaster('Failed to delete folder', 'error');
    }
  };

  // Toggle Archive
  const handleToggleArchive = async (folder) => {
    const newStatus = folder.is_archived ? 0 : 1;
    try {
      const res = await updateCandidateFolderAPI(folder.id, { is_archived: newStatus });
      if (res?.data?.success) {
        CommonToaster(newStatus ? 'Folder archived' : 'Folder restored', 'success');
        setOpenMenuId(null);
        fetchFolders();
      }
    } catch (err) {
      console.error('Error updating archive status:', err);
      CommonToaster('Failed to archive folder', 'error');
    }
  };

  // Open Edit Modal
  const openEditModal = (folder) => {
    setEditingFolder(folder);
    setFolderForm({
      name: folder.name || '',
      job_id: folder.job_id || '',
      folder_type: folder.folder_type || 'personal',
      color: folder.color || 'blue',
      description: folder.description || ''
    });
    setOpenMenuId(null);
    setIsFolderModalOpen(true);
  };

  // Open Email Campaign Modal
  const openEmailModal = (folder) => {
    setEmailTargetFolder(folder);
    setEmailStageFilter('all');
    setEmailSubject(`Exciting Opportunity: ${folder.linked_job_title || folder.name}`);
    setEmailBody(
      `Hi {Candidate_Name},\n\nWe reviewed your profile on CareerFast and believe you would be an excellent match for our team.\n\nWe would love to connect for a quick discussion regarding this role.\n\nBest regards,\n${recruiterDetails?.first_name || 'Hiring Team'}`
    );
    setEmailModalOpen(true);
    setOpenMenuId(null);
  };

  // Send Email Handler
  const handleSendEmail = (e) => {
    e.preventDefault();
    if (!emailSubject.trim() || !emailBody.trim()) {
      CommonToaster('Please enter subject and message', 'warning');
      return;
    }
    setSendingEmail(true);
    setTimeout(() => {
      setSendingEmail(false);
      setEmailModalOpen(false);
      CommonToaster(`Email campaign successfully queued for "${emailTargetFolder?.name}"!`, 'success');
    }, 800);
  };

  // Format Date & Time exactly like screenshot: "09 Sept 2026, 06:16 pm"
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '09 Sept 2026, 06:16 pm';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? String(hours).padStart(2, '0') : '12';
    return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
  };

  // Sort Folders
  const sortedFolders = useMemo(() => {
    const list = [...folders];
    if (sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'candidates') {
      list.sort((a, b) => (b.candidate_count || 0) - (a.candidate_count || 0));
    } else {
      list.sort(
        (a, b) =>
          new Date(b.last_active || b.updated_at || b.created_at) -
          new Date(a.last_active || a.updated_at || a.created_at)
      );
    }
    return list;
  }, [folders, sortBy]);

  // Paginated Folders
  const paginatedFolders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedFolders.slice(start, start + itemsPerPage);
  }, [sortedFolders, currentPage]);

  const totalPages = Math.max(1, Math.ceil(sortedFolders.length / itemsPerPage));

  // Close interactive popovers on global click outside
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
      setIsBulkMoveOpen(false);
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  // Stage Options & Colors (Matching Screenshot 1 & 3)
  const STAGE_OPTIONS = [
    { key: 'prospect', label: 'Prospect', color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0' },
    { key: 'applicant', label: 'Job Applicant', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
    { key: 'interviewed', label: 'Interviewed', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
    { key: 'hired', label: 'Hired', color: '#059669', bg: '#ecfdf5', border: '#6ee7b7' },
    { key: 'rejected', label: 'Rejected', color: '#e11d48', bg: '#fff1f2', border: '#fecdd3' },
  ];

  const getStageMeta = (stageKey) => {
    let key = (stageKey || 'applicant').toLowerCase().trim();
    if (key === 'job_applicant' || key === 'job applicant') key = 'applicant';
    return (
      STAGE_OPTIONS.find((s) => s.key === key) || {
        key,
        label: stageKey ? (stageKey.charAt(0).toUpperCase() + stageKey.slice(1)) : 'Job Applicant',
        color: '#0284c7',
        bg: '#f0f9ff',
        border: '#bae6fd'
      }
    );
  };

  // Format short date: e.g. "10 Sept 2026"
  const formatShortDate = (dateStr) => {
    if (!dateStr) return '10 Sept 2026';
    const d = new Date(dateStr);
    const day = d.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  // Format experience duration: e.g. "1 yr 4 mos"
  const formatDuration = (startDate, endDate, currentlyWorking) => {
    if (!startDate) return '';
    const start = new Date(startDate);
    const end = currentlyWorking || !endDate ? new Date() : new Date(endDate);
    const totalMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (totalMonths <= 0) return '1 mo';
    const yrs = Math.floor(totalMonths / 12);
    const mos = totalMonths % 12;
    if (yrs > 0 && mos > 0) return `${yrs} yr ${mos} mos`;
    if (yrs > 0) return `${yrs} yr${yrs > 1 ? 's' : ''}`;
    return `${mos} mo${mos > 1 ? 's' : ''}`;
  };

  // Toggle Accordion State
  const toggleAccordion = (key) => {
    setPipelineAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Toggle Unmask Phone
  const toggleUnmaskPhone = (candidateId) => {
    setUnmaskedPhones((prev) => ({ ...prev, [candidateId]: !prev[candidateId] }));
  };

  // Share Folder Link
  const handleShareFolder = (folder) => {
    if (!folder) return;
    const shareUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/recruiter/manage-folder?folder=${folder.id}`
      : '';
    if (navigator.clipboard && shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      CommonToaster('Folder share link copied to clipboard!', 'success');
    } else {
      CommonToaster(`Folder: ${folder.name}`, 'info');
    }
  };

  // Toggle Multi-Select Array Filter Helper
  const toggleArrayFilter = (setter, currentArr, value) => {
    if (currentArr.includes(value)) {
      setter(currentArr.filter((item) => item !== value));
    } else {
      setter([...currentArr, value]);
    }
  };

  // Clear All Pipeline Filters
  const handleClearPipelineFilters = () => {
    setPipelineSearch('');
    setPipelineProfileType('all');
    setPipelineNonExported(false);
    setSelectedLocations([]);
    setSelectedExperiences([]);
    setSelectedSkills([]);
    setSelectedNoticePeriods([]);
    setSelectedEducations([]);
  };

  // Filter Drawer Candidates (for fallback)
  const filteredDrawerCandidates = useMemo(() => {
    return drawerCandidates.filter((cand) => {
      const matchesStage =
        drawerStageFilter === 'all' || (cand.stage || 'prospect') === drawerStageFilter;
      const q = drawerSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (cand.name && cand.name.toLowerCase().includes(q)) ||
        (cand.email && cand.email.toLowerCase().includes(q)) ||
        (cand.job_title && cand.job_title.toLowerCase().includes(q));
      return matchesStage && matchesSearch;
    });
  }, [drawerCandidates, drawerStageFilter, drawerSearch]);

  // Extract Filter Options dynamically from folder candidates
  const filterOptions = useMemo(() => {
    const locMap = {};
    const skillMap = {};
    const eduMap = {};

    drawerCandidates.forEach((c) => {
      if (c.location) {
        const l = c.location.trim();
        locMap[l] = (locMap[l] || 0) + 1;
      }
      if (Array.isArray(c.skills)) {
        c.skills.forEach((s) => {
          if (s && typeof s === 'string') {
            const trimmed = s.trim();
            skillMap[trimmed] = (skillMap[trimmed] || 0) + 1;
          }
        });
      }
      const edu = c.course || c.education;
      if (edu) {
        const e = edu.trim();
        eduMap[e] = (eduMap[e] || 0) + 1;
      }
    });

    return {
      locations: Object.keys(locMap).sort(),
      locMap,
      skills: Object.keys(skillMap).sort((a, b) => skillMap[b] - skillMap[a]),
      skillMap,
      educations: Object.keys(eduMap).sort(),
      eduMap
    };
  }, [drawerCandidates]);

  // Stage tab & sub-pill counts
  const pipelineCounts = useMemo(() => {
    const all = drawerCandidates.length;
    const prospect = drawerCandidates.filter((c) => (c.stage || '').toLowerCase().trim() === 'prospect').length;
    const applicant = drawerCandidates.filter((c) => {
      const s = (c.stage || 'applicant').toLowerCase().trim();
      return s === 'applicant' || s === 'job_applicant' || s === 'job applicant';
    }).length;
    const interviewed = drawerCandidates.filter((c) => (c.stage || '').toLowerCase().trim() === 'interviewed').length;
    const hired = drawerCandidates.filter((c) => (c.stage || '').toLowerCase().trim() === 'hired').length;
    const rejected = drawerCandidates.filter((c) => (c.stage || '').toLowerCase().trim() === 'rejected').length;

    // Sub counts for current pipelineTab
    const currentTabCandidates = pipelineTab === 'all'
      ? drawerCandidates
      : drawerCandidates.filter((c) => {
        const s = (c.stage || 'applicant').toLowerCase().trim();
        const norm = (s === 'job_applicant' || s === 'job applicant') ? 'applicant' : s;
        return norm === pipelineTab;
      });

    const shortlisted = currentTabCandidates.filter((c) => (c.sub_stage || '').toLowerCase() === 'shortlisted' || c.is_shortlisted).length;
    const contacted = currentTabCandidates.filter((c) => (c.sub_stage || '').toLowerCase() === 'contacted' || c.is_contacted).length;
    const responded = currentTabCandidates.filter((c) => (c.sub_stage || '').toLowerCase() === 'responded' || c.is_responded).length;

    return {
      all,
      prospect,
      applicant,
      interviewed,
      hired,
      rejected,
      subAll: currentTabCandidates.length,
      shortlisted,
      contacted,
      responded
    };
  }, [drawerCandidates, pipelineTab]);

  // Filtered and Sorted Candidates for Pipeline
  const filteredPipelineCandidates = useMemo(() => {
    return drawerCandidates.filter((c) => {
      const rawStage = (c.stage || 'applicant').toLowerCase().trim();
      const stage = (rawStage === 'job_applicant' || rawStage === 'job applicant')
        ? 'applicant'
        : rawStage;

      // 1. Stage Tab
      if (pipelineTab !== 'all' && stage !== pipelineTab) {
        return false;
      }

      // 2. Sub-stage Pill
      if (pipelineSubPill !== 'all') {
        const sub = (c.sub_stage || '').toLowerCase();
        if (pipelineSubPill === 'shortlisted' && !c.is_shortlisted && sub !== 'shortlisted') return false;
        if (pipelineSubPill === 'contacted' && !c.is_contacted && sub !== 'contacted') return false;
        if (pipelineSubPill === 'responded' && !c.is_responded && sub !== 'responded') return false;
      }

      // 3. Search Bar Filter
      if (pipelineSearch.trim()) {
        const q = pipelineSearch.toLowerCase().trim();
        const inName = (c.name || '').toLowerCase().includes(q);
        const inEmail = (c.email || '').toLowerCase().includes(q);
        const inTitle = (c.job_title || c.designation || '').toLowerCase().includes(q);
        const inCompany = (c.company_name || '').toLowerCase().includes(q);
        const inPhone = getCandidatePhone(c).replace(/\D/g, '').includes(q);
        const inSkills = Array.isArray(c.skills) && c.skills.some((s) => s.toLowerCase().includes(q));
        const inLoc = (c.location || '').toLowerCase().includes(q);
        const inAbout = (c.about || '').toLowerCase().includes(q);
        if (!inName && !inEmail && !inTitle && !inCompany && !inPhone && !inSkills && !inLoc && !inAbout) {
          return false;
        }
      }

      // 4. Profiles Type: All | Registered | Sourced
      if (pipelineProfileType === 'registered' && c.source === 'sourced') return false;
      if (pipelineProfileType === 'sourced' && c.source !== 'sourced') return false;

      // 5. Show only non-exported
      if (pipelineNonExported && c.is_exported) return false;

      // 6. Location Filter
      if (selectedLocations.length > 0) {
        if (!c.location || !selectedLocations.includes(c.location.trim())) return false;
      }

      // 7. Experience Filter
      if (selectedExperiences.length > 0) {
        const expYears = parseFloat(c.total_years || c.experience || 0);
        const matchesExp = selectedExperiences.some((range) => {
          if (range === '0-1') return expYears <= 1;
          if (range === '1-3') return expYears > 1 && expYears <= 3;
          if (range === '3-5') return expYears > 3 && expYears <= 5;
          if (range === '5-8') return expYears > 5 && expYears <= 8;
          if (range === '8+') return expYears > 8;
          return false;
        });
        if (!matchesExp) return false;
      }

      // 8. Skills Filter
      if (selectedSkills.length > 0) {
        const candidateSkills = Array.isArray(c.skills) ? c.skills.map((s) => s.toLowerCase()) : [];
        const hasSkill = selectedSkills.some((s) => candidateSkills.includes(s.toLowerCase()));
        if (!hasSkill) return false;
      }

      // 9. Notice Period Filter
      if (selectedNoticePeriods.length > 0) {
        const np = (c.notice_period || '15 Days or less').toLowerCase();
        const matchesNotice = selectedNoticePeriods.some((opt) => np.includes(opt.toLowerCase()));
        if (!matchesNotice) return false;
      }

      // 10. Education Filter
      if (selectedEducations.length > 0) {
        const edu = (c.course || c.education || '').toLowerCase();
        const matchesEdu = selectedEducations.some((e) => edu.includes(e.toLowerCase()));
        if (!matchesEdu) return false;
      }

      return true;
    }).sort((a, b) => {
      if (pipelineSort === 'exp_desc') {
        return (parseFloat(b.total_years || b.experience || 0)) - (parseFloat(a.total_years || a.experience || 0));
      }
      if (pipelineSort === 'exp_asc') {
        return (parseFloat(a.total_years || a.experience || 0)) - (parseFloat(b.total_years || b.experience || 0));
      }
      if (pipelineSort === 'name_asc') {
        return (a.name || '').localeCompare(b.name || '');
      }
      // default: recent activity
      return new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0);
    });
  }, [
    drawerCandidates,
    pipelineTab,
    pipelineSubPill,
    pipelineSearch,
    pipelineProfileType,
    pipelineNonExported,
    selectedLocations,
    selectedExperiences,
    selectedSkills,
    selectedNoticePeriods,
    selectedEducations,
    pipelineSort
  ]);

  // Bulk Selection Handlers
  const handleToggleSelectAll = () => {
    if (selectedPipelineCandidateIds.length === filteredPipelineCandidates.length) {
      setSelectedPipelineCandidateIds([]);
    } else {
      setSelectedPipelineCandidateIds(filteredPipelineCandidates.map((c) => c.id));
    }
  };

  const handleToggleCandidateSelection = (candId) => {
    setSelectedPipelineCandidateIds((prev) =>
      prev.includes(candId) ? prev.filter((id) => id !== candId) : [...prev, candId]
    );
  };

  // Bulk Move to Folder
  const handleBulkMove = async (targetFolderId) => {
    if (selectedPipelineCandidateIds.length === 0) {
      CommonToaster('Please select at least one candidate', 'warning');
      return;
    }
    const targetFolder = (allFolders.length > 0 ? allFolders : folders).find((f) => f.id === targetFolderId);
    try {
      const res = await addCandidatesToFolderAPI(targetFolderId, selectedPipelineCandidateIds);
      if (res?.data?.alreadyExists || res?.data?.success === false) {
        CommonToaster(res?.data?.message || 'Candidate(s) already exist in that folder!', 'warning');
        return;
      }
      if (res?.data?.success) {
        if (selectedFolderForDrawer?.id) {
          await Promise.allSettled(
            selectedPipelineCandidateIds.map((cId) =>
              removeCandidateFromFolderAPI(selectedFolderForDrawer.id, cId)
            )
          );
        }
        CommonToaster(res?.data?.message || `Moved ${selectedPipelineCandidateIds.length} candidate(s) to "${targetFolder?.name || 'Folder'}"`, 'success');
        setIsBulkMoveOpen(false);
        setDrawerCandidates((prev) =>
          prev.filter((c) => !selectedPipelineCandidateIds.includes(c.id))
        );
        setSelectedPipelineCandidateIds([]);
        fetchFolders();
      }
    } catch (err) {
      console.error('Error moving candidates:', err);
      CommonToaster('Failed to move candidates', 'error');
    }
  };

  // Bulk Reject Candidates
  const handleBulkReject = async () => {
    if (selectedPipelineCandidateIds.length === 0) {
      CommonToaster('Please select at least one candidate to reject', 'warning');
      return;
    }
    if (!window.confirm(`Reject ${selectedPipelineCandidateIds.length} selected candidate(s)?`)) return;
    try {
      await Promise.all(
        selectedPipelineCandidateIds.map((id) =>
          updateFolderCandidateStageAPI(selectedFolderForDrawer.id, id, 'rejected')
        )
      );
      CommonToaster(`Marked ${selectedPipelineCandidateIds.length} candidate(s) as Rejected`, 'info');
      setDrawerCandidates((prev) =>
        prev.map((c) => (selectedPipelineCandidateIds.includes(c.id) ? { ...c, stage: 'rejected' } : c))
      );
      setSelectedPipelineCandidateIds([]);
      fetchFolders();
    } catch (err) {
      console.error('Error rejecting candidates:', err);
      CommonToaster('Failed to reject candidates', 'error');
    }
  };

  // Single Move to Folder
  const handleSingleMove = async (candidateId, targetFolderId) => {
    const targetFolder = (allFolders.length > 0 ? allFolders : folders).find((f) => f.id === targetFolderId);
    try {
      const res = await addCandidatesToFolderAPI(targetFolderId, [candidateId]);
      if (res?.data?.alreadyExists || res?.data?.success === false) {
        CommonToaster(res?.data?.message || 'Candidate is already in that folder!', 'warning');
        return;
      }
      if (res?.data?.success) {
        if (selectedFolderForDrawer?.id) {
          try {
            await removeCandidateFromFolderAPI(selectedFolderForDrawer.id, candidateId);
          } catch (removeErr) {
            console.warn('Candidate added to target folder but removing from source failed:', removeErr);
          }
        }
        CommonToaster(`Candidate moved to "${targetFolder?.name || 'Folder'}"`, 'success');
        setActiveMoveDropdownId(null);
        setDrawerCandidates((prev) => prev.filter((c) => c.id !== candidateId));
        setSelectedPipelineCandidateIds((prev) => prev.filter((id) => id !== candidateId));
        fetchFolders();
      }
    } catch (err) {
      console.error('Error moving candidate:', err);
      CommonToaster('Failed to move candidate', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8faff] pb-20 font-sans text-slate-800">
      {selectedFolderForDrawer ? (
        /* ═════════════════════════════════════════════════════════════════════
            FULL FOLDER PIPELINE VIEW (MATCHING CANDIDATE SEARCH & SCREENSHOTS)
            ═════════════════════════════════════════════════════════════════════ */
        <div className="mx-auto max-w-[1540px] px-4 sm:px-6 lg:px-8 pt-6">
          {/* 1. Header (Screenshot 3) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3.5">
              <button
                onClick={() => setSelectedFolderForDrawer(null)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
              >
                <FiArrowLeft className="h-4 w-4 text-[#0A66C2]" />
                <span>Back to Folders</span>
              </button>

              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-bold text-[#1e2238] tracking-tight mb-0">
                    {selectedFolderForDrawer.name}
                  </h1>
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-[#0A66C2]">
                    {drawerCandidates.length} {drawerCandidates.length === 1 ? 'candidate' : 'candidates'}
                  </span>
                  {selectedFolderForDrawer.linked_job_title && (
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
                      {selectedFolderForDrawer.linked_job_title}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500 mb-0">
                  Created by{' '}
                  <span className="font-semibold text-slate-700">
                    {selectedFolderForDrawer.owner_name || recruiterDetails?.first_name || 'Recruiter'}
                  </span>{' '}
                  • Last active on{' '}
                  <span className="font-medium text-slate-700">
                    {formatDateTime(selectedFolderForDrawer.last_active)}
                  </span>
                </p>
              </div>
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => handleShareFolder(selectedFolderForDrawer)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
              >
                <FiShare2 className="h-3.5 w-3.5 text-slate-500" />
                <span>Share folder</span>
              </button>

              <button
                onClick={() => handleExportCSV(selectedFolderForDrawer)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
              >
                <FiDownload className="h-3.5 w-3.5 text-slate-500" />
                <span>Download XLS</span>
              </button>

              <button
                onClick={() => openEmailModal(selectedFolderForDrawer)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0A66C2] hover:bg-[#004182] px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all cursor-pointer"
              >
                <FiMail className="h-3.5 w-3.5" />
                <span>Send Email</span>
              </button>
            </div>
          </div>

          {/* 2-Column: Left Sidebar Filters + Right Pipeline */}
          <div className="mt-6 flex flex-col lg:flex-row items-start gap-6">

            {/* ─── LEFT SIDEBAR: FILTERS (Matching Candidate Search Page) ─── */}
            <div className="w-full lg:w-[290px] shrink-0 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs lg:sticky lg:top-20 max-h-[calc(100vh-100px)] overflow-y-auto">
              {/* Sidebar Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-0">
                  <FiFilter className="h-4 w-4 text-[#0A66C2]" />
                  <span>Filter Candidates</span>
                </h3>
                {(pipelineSearch || pipelineNonExported || pipelineProfileType !== 'all' || selectedLocations.length > 0 || selectedExperiences.length > 0 || selectedSkills.length > 0 || selectedNoticePeriods.length > 0 || selectedEducations.length > 0) && (
                  <button
                    onClick={handleClearPipelineFilters}
                    className="text-xs font-bold text-[#0A66C2] hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Active Filter Chips */}
              {(selectedLocations.length > 0 || selectedExperiences.length > 0 || selectedSkills.length > 0 || selectedNoticePeriods.length > 0 || selectedEducations.length > 0) && (
                <div className="mb-4 flex flex-wrap gap-1.5 pb-3 border-b border-slate-100">
                  {selectedLocations.map((loc) => (
                    <span
                      key={loc}
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-[#0A66C2]"
                    >
                      <span>{loc}</span>
                      <FiX
                        className="h-3 w-3 cursor-pointer hover:text-rose-600"
                        onClick={() => toggleArrayFilter(setSelectedLocations, selectedLocations, loc)}
                      />
                    </span>
                  ))}
                  {selectedExperiences.map((exp) => (
                    <span
                      key={exp}
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-[#0A66C2]"
                    >
                      <span>{exp} yrs</span>
                      <FiX
                        className="h-3 w-3 cursor-pointer hover:text-rose-600"
                        onClick={() => toggleArrayFilter(setSelectedExperiences, selectedExperiences, exp)}
                      />
                    </span>
                  ))}
                  {selectedSkills.map((sk) => (
                    <span
                      key={sk}
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-[#0A66C2]"
                    >
                      <span>{sk}</span>
                      <FiX
                        className="h-3 w-3 cursor-pointer hover:text-rose-600"
                        onClick={() => toggleArrayFilter(setSelectedSkills, selectedSkills, sk)}
                      />
                    </span>
                  ))}
                  {selectedNoticePeriods.map((np) => (
                    <span
                      key={np}
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-[#0A66C2]"
                    >
                      <span>{np}</span>
                      <FiX
                        className="h-3 w-3 cursor-pointer hover:text-rose-600"
                        onClick={() => toggleArrayFilter(setSelectedNoticePeriods, selectedNoticePeriods, np)}
                      />
                    </span>
                  ))}
                  {selectedEducations.map((ed) => (
                    <span
                      key={ed}
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-[#0A66C2]"
                    >
                      <span>{ed}</span>
                      <FiX
                        className="h-3 w-3 cursor-pointer hover:text-rose-600"
                        onClick={() => toggleArrayFilter(setSelectedEducations, selectedEducations, ed)}
                      />
                    </span>
                  ))}
                </div>
              )}

              {/* 1. Search Box (Screenshot 3) */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Search
                </label>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
                  <input
                    type="text"
                    placeholder="Name, company, title, phone..."
                    value={pipelineSearch}
                    onChange={(e) => setPipelineSearch(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-8 pr-7 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#0A66C2] transition-all"
                  />
                  {pipelineSearch && (
                    <button
                      onClick={() => setPipelineSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <FiX className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* 4. ACCORDION 1: Location */}
              <div className="py-2.5 border-b border-slate-100">
                <div
                  onClick={() => toggleAccordion('location')}
                  className="flex items-center justify-between cursor-pointer py-1 select-none group"
                >
                  <span className="text-xs font-semibold text-slate-800 group-hover:text-[#0A66C2] transition-colors flex items-center gap-1.5">
                    <FiMapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>Location</span>
                    {selectedLocations.length > 0 && (
                      <span className="rounded-full bg-blue-100 text-[#0A66C2] px-1.5 py-0.2 text-[10px] font-semibold">
                        {selectedLocations.length}
                      </span>
                    )}
                  </span>
                  {pipelineAccordions.location ? (
                    <FiChevronUp className="h-3.5 w-3.5 text-slate-400" />
                  ) : (
                    <FiChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  )}
                </div>
                {pipelineAccordions.location && (
                  <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {filterOptions.locations.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">No locations found</p>
                    ) : (
                      filterOptions.locations.map((loc) => (
                        <label
                          key={loc}
                          className="flex items-center justify-between text-xs text-slate-700 hover:text-[#0A66C2] cursor-pointer py-0.5"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedLocations.includes(loc)}
                              onChange={() => toggleArrayFilter(setSelectedLocations, selectedLocations, loc)}
                              className="h-3.5 w-3.5 rounded text-[#0A66C2] focus:ring-[#0A66C2] border-slate-300 cursor-pointer"
                            />
                            <span className="truncate max-w-[170px]">{loc}</span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-medium">
                            ({filterOptions.locMap[loc] || 0})
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* 5. ACCORDION 2: Experience */}
              <div className="py-2.5 border-b border-slate-100">
                <div
                  onClick={() => toggleAccordion('experience')}
                  className="flex items-center justify-between cursor-pointer py-1 select-none group"
                >
                  <span className="text-xs font-semibold text-slate-800 group-hover:text-[#0A66C2] transition-colors flex items-center gap-1.5">
                    <FiBriefcase className="h-3.5 w-3.5 text-slate-400" />
                    <span>Experience</span>
                    {selectedExperiences.length > 0 && (
                      <span className="rounded-full bg-blue-100 text-[#0A66C2] px-1.5 py-0.2 text-[10px] font-bold">
                        {selectedExperiences.length}
                      </span>
                    )}
                  </span>
                  {pipelineAccordions.experience ? (
                    <FiChevronUp className="h-3.5 w-3.5 text-slate-400" />
                  ) : (
                    <FiChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  )}
                </div>
                {pipelineAccordions.experience && (
                  <div className="mt-2 space-y-1.5">
                    {[
                      { id: '0-1', label: '0 - 1 Years' },
                      { id: '1-3', label: '1 - 3 Years' },
                      { id: '3-5', label: '3 - 5 Years' },
                      { id: '5-8', label: '5 - 8 Years' },
                      { id: '8+', label: '8+ Years' },
                    ].map((exp) => (
                      <label
                        key={exp.id}
                        className="flex items-center justify-between text-xs text-slate-700 hover:text-[#0A66C2] cursor-pointer py-0.5"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedExperiences.includes(exp.id)}
                            onChange={() => toggleArrayFilter(setSelectedExperiences, selectedExperiences, exp.id)}
                            className="h-3.5 w-3.5 rounded text-[#0A66C2] focus:ring-[#0A66C2] border-slate-300 cursor-pointer"
                          />
                          <span>{exp.label}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* 6. ACCORDION 3: Key Skills */}
              <div className="py-2.5 border-b border-slate-100">
                <div
                  onClick={() => toggleAccordion('skills')}
                  className="flex items-center justify-between cursor-pointer py-1 select-none group"
                >
                  <span className="text-xs font-semibold text-slate-800 group-hover:text-[#0A66C2] transition-colors flex items-center gap-1.5">
                    <FiTag className="h-3.5 w-3.5 text-slate-400" />
                    <span>Key Skills</span>
                    {selectedSkills.length > 0 && (
                      <span className="rounded-full bg-blue-100 text-[#0A66C2] px-1.5 py-0.2 text-[10px] font-bold">
                        {selectedSkills.length}
                      </span>
                    )}
                  </span>
                  {pipelineAccordions.skills ? (
                    <FiChevronUp className="h-3.5 w-3.5 text-slate-400" />
                  ) : (
                    <FiChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  )}
                </div>
                {pipelineAccordions.skills && (
                  <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {filterOptions.skills.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">No skills found</p>
                    ) : (
                      filterOptions.skills.map((sk) => (
                        <label
                          key={sk}
                          className="flex items-center justify-between text-xs text-slate-700 hover:text-[#0A66C2] cursor-pointer py-0.5"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedSkills.includes(sk)}
                              onChange={() => toggleArrayFilter(setSelectedSkills, selectedSkills, sk)}
                              className="h-3.5 w-3.5 rounded text-[#0A66C2] focus:ring-[#0A66C2] border-slate-300 cursor-pointer"
                            />
                            <span className="truncate max-w-[170px]">{sk}</span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-medium">
                            ({filterOptions.skillMap[sk] || 0})
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* 7. ACCORDION 4: Notice Period */}
              <div className="py-2.5 border-b border-slate-100">
                <div
                  onClick={() => toggleAccordion('notice')}
                  className="flex items-center justify-between cursor-pointer py-1 select-none group"
                >
                  <span className="text-xs font-semibold text-slate-800 group-hover:text-[#0A66C2] transition-colors flex items-center gap-1.5">
                    <FiCalendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>Notice Period</span>
                    {selectedNoticePeriods.length > 0 && (
                      <span className="rounded-full bg-blue-100 text-[#0A66C2] px-1.5 py-0.2 text-[10px] font-bold">
                        {selectedNoticePeriods.length}
                      </span>
                    )}
                  </span>
                  {pipelineAccordions.notice ? (
                    <FiChevronUp className="h-3.5 w-3.5 text-slate-400" />
                  ) : (
                    <FiChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  )}
                </div>
                {pipelineAccordions.notice && (
                  <div className="mt-2 space-y-1.5">
                    {[
                      { id: '15 Days', label: '15 Days or less' },
                      { id: '30 Days', label: '30 Days / 1 Month' },
                      { id: '60 Days', label: '60 Days / 2 Months' },
                      { id: '90 Days', label: '90 Days / 3 Months' },
                    ].map((np) => (
                      <label
                        key={np.id}
                        className="flex items-center justify-between text-xs text-slate-700 hover:text-[#0A66C2] cursor-pointer py-0.5"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedNoticePeriods.includes(np.id)}
                            onChange={() => toggleArrayFilter(setSelectedNoticePeriods, selectedNoticePeriods, np.id)}
                            className="h-3.5 w-3.5 rounded text-[#0A66C2] focus:ring-[#0A66C2] border-slate-300 cursor-pointer"
                          />
                          <span>{np.label}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* 8. ACCORDION 5: Education */}
              <div className="py-2.5">
                <div
                  onClick={() => toggleAccordion('education')}
                  className="flex items-center justify-between cursor-pointer py-1 select-none group"
                >
                  <span className="text-xs font-semibold text-slate-800 group-hover:text-[#0A66C2] transition-colors flex items-center gap-1.5">
                    <FiAward className="h-3.5 w-3.5 text-slate-400" />
                    <span>Education</span>
                    {selectedEducations.length > 0 && (
                      <span className="rounded-full bg-blue-100 text-[#0A66C2] px-1.5 py-0.2 text-[10px] font-bold">
                        {selectedEducations.length}
                      </span>
                    )}
                  </span>
                  {pipelineAccordions.education ? (
                    <FiChevronUp className="h-3.5 w-3.5 text-slate-400" />
                  ) : (
                    <FiChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  )}
                </div>
                {pipelineAccordions.education && (
                  <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {filterOptions.educations.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">No education records found</p>
                    ) : (
                      filterOptions.educations.map((ed) => (
                        <label
                          key={ed}
                          className="flex items-center justify-between text-xs text-slate-700 hover:text-[#0A66C2] cursor-pointer py-0.5"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedEducations.includes(ed)}
                              onChange={() => toggleArrayFilter(setSelectedEducations, selectedEducations, ed)}
                              className="h-3.5 w-3.5 rounded text-[#0A66C2] focus:ring-[#0A66C2] border-slate-300 cursor-pointer"
                            />
                            <span className="truncate max-w-[170px]">{ed}</span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-medium">
                            ({filterOptions.eduMap[ed] || 0})
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* ─── RIGHT AREA: PIPELINE TABS, SUB-PILLS, TOOLBAR & CARDS ─── */}
            <div className="flex-1 min-w-0 w-full space-y-4">

              {/* 1. Four Large Stage Tabs (Screenshot 3) */}
              <div className="flex items-center border-b border-slate-200 overflow-x-auto scrollbar-none bg-white rounded-2xl px-2 shadow-2xs">
                {[
                  { id: 'all', label: 'All Candidates', count: pipelineCounts.all },
                  ...(pipelineCounts.prospect > 0 || pipelineTab === 'prospect'
                    ? [{ id: 'prospect', label: 'Prospect', count: pipelineCounts.prospect }]
                    : []),
                  { id: 'applicant', label: 'Job applicant', count: pipelineCounts.applicant },
                  { id: 'interviewed', label: 'Interviewed', count: pipelineCounts.interviewed },
                  { id: 'hired', label: 'Hired candidate', count: pipelineCounts.hired },
                  { id: 'rejected', label: 'Rejected candidate', count: pipelineCounts.rejected },
                ].map((tab) => {
                  const isActive = pipelineTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setPipelineTab(tab.id);
                        setPipelineSubPill('all');
                      }}
                      className={`relative flex items-center gap-2 px-4 py-3.5 text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${isActive ? 'text-[#0A66C2]' : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${isActive ? 'bg-blue-50 text-[#0A66C2]' : 'bg-slate-100 text-slate-500'
                          }`}
                      >
                        {tab.count}
                      </span>
                      {isActive && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0A66C2] rounded-t-full" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* 2. Sub-stage Pills (Screenshot 3) */}
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
                {[
                  { id: 'all', label: 'All', count: pipelineCounts.subAll },
                  { id: 'shortlisted', label: 'Shortlisted', count: pipelineCounts.shortlisted },
                  { id: 'contacted', label: 'Contacted', count: pipelineCounts.contacted },
                  { id: 'responded', label: 'Responded', count: pipelineCounts.responded },
                ].map((pill) => {
                  const isActive = pipelineSubPill === pill.id;
                  return (
                    <button
                      key={pill.id}
                      onClick={() => setPipelineSubPill(pill.id)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${isActive
                        ? 'bg-[#0A66C2] text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                      <span>{pill.label}</span>
                      <span className={isActive ? 'opacity-80' : 'text-slate-400'}>
                        ({pill.count})
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* 3. Bulk Action Toolbar (Screenshot 3) */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl p-3 px-4 border border-slate-200/80 shadow-2xs">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={
                        filteredPipelineCandidates.length > 0 &&
                        selectedPipelineCandidateIds.length === filteredPipelineCandidates.length
                      }
                      onChange={handleToggleSelectAll}
                      className="h-4 w-4 rounded text-[#0A66C2] focus:ring-[#0A66C2] border-slate-300 cursor-pointer"
                    />
                    <span>Select all ({filteredPipelineCandidates.length})</span>
                  </label>

                  <div className="h-4 w-px bg-slate-200 hidden sm:block" />

                  <div className="flex items-center gap-2">
                    <button
                      disabled={selectedPipelineCandidateIds.length === 0}
                      onClick={() => openEmailModal(selectedFolderForDrawer)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                    >
                      <FiMail className="h-3.5 w-3.5 text-[#0A66C2]" />
                      <span>Email</span>
                    </button>

                    <div className="relative" data-popover-wrapper="bulk-move">
                      <button
                        data-popover-trigger="bulk-move"
                        disabled={selectedPipelineCandidateIds.length === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsBulkMoveOpen(!isBulkMoveOpen);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                      >
                        <FiFolder className="h-3.5 w-3.5 text-[#0A66C2]" />
                        <span>Move to</span>
                        <FiChevronDown className={`h-3 w-3 transition-transform ${isBulkMoveOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isBulkMoveOpen && (
                        <div
                          data-popover-content="bulk-move"
                          onClick={(e) => e.stopPropagation()}
                          className="absolute left-0 top-full mt-1.5 w-56 rounded-xl bg-white p-2 shadow-2xl border border-slate-200 z-50 text-left animate-fadeIn"
                        >
                          <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Move to Folder
                          </div>
                          <div className="max-h-48 overflow-y-auto space-y-0.5">
                            {(allFolders.length > 0 ? allFolders : folders)
                              .filter((f) => f.id !== selectedFolderForDrawer.id)
                              .map((f) => (
                                <button
                                  key={f.id}
                                  onClick={() => handleBulkMove(f.id)}
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
                              ))}
                            {(allFolders.length > 0 ? allFolders : folders).filter((f) => f.id !== selectedFolderForDrawer.id).length === 0 && (
                              <p className="px-2 py-2 text-xs text-slate-400 italic text-center">No other folders found</p>
                            )}
                          </div>
                          <div className="border-t border-slate-100 pt-1.5 mt-1">
                            <button
                              onClick={() => {
                                setIsBulkMoveOpen(false);
                                setEditingFolder(null);
                                setFolderForm({ name: '', job_id: '', folder_type: 'personal', color: 'blue', description: '' });
                                setIsFolderModalOpen(true);
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

                    <button
                      disabled={selectedPipelineCandidateIds.length === 0}
                      onClick={handleBulkReject}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-white text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                    >
                      <FiTrash2 className="h-3.5 w-3.5" />
                      <span>Reject profile</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-500">
                    Showing <span className="text-slate-800 font-bold">{filteredPipelineCandidates.length}</span> Candidates
                  </span>
                  <select
                    value={pipelineSort}
                    onChange={(e) => setPipelineSort(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#0A66C2] cursor-pointer"
                  >
                    <option value="recent">Recent Activity</option>
                    <option value="exp_desc">Exp: High to Low</option>
                    <option value="exp_asc">Exp: Low to High</option>
                    <option value="name_asc">Name: A to Z</option>
                  </select>
                </div>
              </div>

              {/* 4. Candidate Cards (Screenshots 1, 2, 3) */}
              <div className="space-y-3.5">
                {drawerLoading ? (
                  <div className="rounded-2xl bg-white p-16 text-center shadow-xs border border-slate-200">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#0A66C2] border-t-transparent" />
                    <p className="mt-2 text-xs text-slate-500 font-medium">Loading candidate pipeline...</p>
                  </div>
                ) : filteredPipelineCandidates.length === 0 ? (
                  <div className="rounded-2xl bg-white p-16 text-center shadow-xs border border-slate-200">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#0A66C2]">
                      <FiUsers className="h-7 w-7" />
                    </div>
                    <h4 className="mt-3 text-base font-semibold text-slate-800">No candidates found</h4>
                    <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                      {pipelineSearch || selectedLocations.length > 0 || selectedSkills.length > 0
                        ? 'No candidate matches the selected filters in this stage.'
                        : 'There are no candidates in this pipeline stage yet.'}
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <button
                        onClick={handleClearPipelineFilters}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        Reset Filters
                      </button>
                      <Link
                        href="/candidate-search"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#0A66C2] px-4 py-2 text-xs font-medium text-white shadow-xs hover:bg-[#004182] no-underline"
                      >
                        <FiSearch className="h-3.5 w-3.5" />
                        <span>Search Candidates</span>
                      </Link>
                    </div>
                  </div>
                ) : (
                  filteredPipelineCandidates.map((c) => {
                    const currentStageMeta = getStageMeta(c.stage);
                    const candidateSkills = Array.isArray(c.skills) ? c.skills : [];
                    const isExpandedSkills = expandedSkillsMap[c.id];
                    const skillsToDisplay = isExpandedSkills ? candidateSkills : candidateSkills.slice(0, 5);
                    const hasMoreSkills = candidateSkills.length > 5;

                    const rawImg = c.profile_image || c.profile_picture || c.photo || c.avatar || c.image;
                    const candidateImgUrl = rawImg ? getImageUrl(rawImg) : null;
                    const candidateInitial = c.name ? c.name.charAt(0).toUpperCase() : 'C';

                    return (
                      <div
                        key={c.id}
                        className="relative rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs hover:border-[#cbd5e1] hover:shadow-xs transition-all space-y-3"
                      >
                        {/* ── TOP ROW: Checkbox, Name, "Saved v" Popover, "Stage: [Name] v" Popover ── */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedPipelineCandidateIds.includes(c.id)}
                              onChange={() => handleToggleCandidateSelection(c.id)}
                              className="h-4 w-4 rounded text-[#0A66C2] focus:ring-[#0A66C2] border-slate-300 cursor-pointer"
                            />
                            <div className="flex items-center gap-2.5">
                              {candidateImgUrl ? (
                                <div
                                  onClick={() => setPreviewImageModal({
                                    url: candidateImgUrl,
                                    title: c.name || 'Candidate'
                                  })}
                                  className="relative shrink-0 cursor-pointer group"
                                  title="Click to view photo"
                                >
                                  <img
                                    src={candidateImgUrl}
                                    alt={c.name || 'Candidate'}
                                    className="h-9 w-9 shrink-0 rounded-xl object-cover border border-slate-200 shadow-2xs group-hover:ring-2 group-hover:ring-[#0A66C2] transition-all"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      if (e.currentTarget.nextElementSibling) {
                                        e.currentTarget.nextElementSibling.style.display = 'flex';
                                      }
                                    }}
                                  />
                                  <div
                                    style={{ display: 'none' }}
                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-bold text-[#0A66C2] text-sm shadow-2xs"
                                  >
                                    {candidateInitial}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-bold text-[#0A66C2] text-sm shadow-2xs">
                                  {candidateInitial}
                                </div>
                              )}
                              <span className="text-[15.5px] font-semibold text-slate-900 hover:text-[#0A66C2] transition-colors">
                                {c.name || 'Candidate'}
                              </span>
                            </div>

                            {/* "Saved v" Popover (Screenshot 2) */}
                            <div className="relative" data-popover-wrapper="saved">
                              <button
                                data-popover-trigger="saved"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveSavedPopoverId(activeSavedPopoverId === c.id ? null : c.id);
                                  setActiveStagePopoverId(null);
                                  setActiveMoveDropdownId(null);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-[#0A66C2] hover:bg-blue-100 transition-colors cursor-pointer"
                              >
                                <span>Saved</span>
                                <FiChevronDown
                                  className={`h-3 w-3 transition-transform ${activeSavedPopoverId === c.id ? 'rotate-180' : ''
                                    }`}
                                />
                              </button>

                              {activeSavedPopoverId === c.id && (
                                <div
                                  data-popover-content="saved"
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute left-0 top-full mt-2 w-76 sm:w-80 rounded-2xl bg-white p-3 shadow-2xl border border-slate-200 z-50 text-left animate-fadeIn"
                                >
                                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                                    <span className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
                                      Saved in Folders
                                    </span>
                                    <button
                                      onClick={() => setActiveSavedPopoverId(null)}
                                      className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md cursor-pointer"
                                    >
                                      <FiX className="h-3.5 w-3.5" />
                                    </button>
                                  </div>

                                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                                    {Array.isArray(c.saved_in_folders) && c.saved_in_folders.length > 0 ? (
                                      c.saved_in_folders.map((sf, idx) => (
                                        <div
                                          key={idx}
                                          className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-xs space-y-1 hover:bg-slate-100/70 transition-colors"
                                        >
                                          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                                            <FiFolder className="h-3.5 w-3.5 text-[#0A66C2]" />
                                            <span>Folder Name:</span>
                                            <span className="text-[#0A66C2]">
                                              {sf.folder_name || selectedFolderForDrawer?.name}
                                            </span>
                                          </div>
                                          <div className="text-[11.5px] text-slate-500">
                                            Saved by{' '}
                                            <span className="font-semibold text-slate-700">
                                              {sf.recruiter_name || recruiterDetails?.first_name || 'Recruiter'}
                                            </span>{' '}
                                            on{' '}
                                            <span className="font-medium text-slate-700">
                                              {formatShortDate(sf.created_at || c.created_at)}
                                            </span>
                                          </div>
                                          <div className="text-[11.5px] text-slate-500">
                                            Status -{' '}
                                            <span className="font-semibold text-slate-800">
                                              {getStageMeta(sf.stage || c.stage).label}
                                            </span>
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-xs space-y-1">
                                        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                                          <FiFolder className="h-3.5 w-3.5 text-[#0A66C2]" />
                                          <span>Folder Name:</span>
                                          <span className="text-[#0A66C2]">{selectedFolderForDrawer?.name}</span>
                                        </div>
                                        <div className="text-[11.5px] text-slate-500">
                                          Saved by{' '}
                                          <span className="font-semibold text-slate-700">
                                            {recruiterDetails?.first_name || 'Recruiter'}
                                          </span>{' '}
                                          on{' '}
                                          <span className="font-medium text-slate-700">
                                            {formatShortDate(c.created_at)}
                                          </span>
                                        </div>
                                        <div className="text-[11.5px] text-slate-500">
                                          Status -{' '}
                                          <span className="font-semibold text-slate-800">
                                            {getStageMeta(c.stage).label}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* "Stage: [Stage Name] v" Popover (Screenshot 1) */}
                            <div className="relative" data-popover-wrapper="stage">
                              <button
                                data-popover-trigger="stage"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveStagePopoverId(activeStagePopoverId === c.id ? null : c.id);
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
                                  className={`h-3 w-3 transition-transform ${activeStagePopoverId === c.id ? 'rotate-180' : ''
                                    }`}
                                />
                              </button>

                              {activeStagePopoverId === c.id && (
                                <div
                                  data-popover-content="stage"
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 w-64 rounded-2xl bg-white p-3.5 shadow-2xl border border-slate-200 z-50 text-left animate-fadeIn"
                                >
                                  {/* Header from Screenshot 1 */}
                                  <div className="border-b border-slate-100 pb-2.5 mb-2.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-slate-900">
                                        Stage : <span style={{ color: currentStageMeta.color }}>{currentStageMeta.label}</span>
                                      </span>
                                      <button
                                        onClick={() => setActiveStagePopoverId(null)}
                                        className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                                      >
                                        <FiX className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-1 mb-0">
                                      By recruiter on:{' '}
                                      <span className="font-semibold text-slate-700">
                                        {formatShortDate(c.updated_at || c.created_at)}
                                      </span>
                                    </p>
                                  </div>

                                  {/* Stage Options */}
                                  <div className="space-y-1">
                                    {STAGE_OPTIONS.map((st) => {
                                      const isCurrent = (c.stage || 'prospect').toLowerCase() === st.key;
                                      return (
                                        <button
                                          key={st.key}
                                          onClick={() => {
                                            handleUpdateCandidateStage(c.id, st.key);
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

                          {/* Right links on card top row: LinkedIn & Resume */}
                          <div className="flex items-center gap-2">
                            {c.linkedin_url && (
                              <a
                                href={c.linkedin_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-sky-700 hover:bg-sky-50 transition-colors shadow-2xs no-underline"
                              >
                                <FaLinkedin className="h-3.5 w-3.5 text-sky-600" />
                                <span>LinkedIn</span>
                              </a>
                            )}
                            {c.resume && (
                              <button
                                type="button"
                                onClick={() => downloadResumeFile(c.resume, c.name)}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:text-[#0A66C2] hover:border-[#0A66C2] transition-colors shadow-2xs cursor-pointer"
                              >
                                <FiDownload className="h-3.5 w-3.5" />
                                <span>Resume</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* ── ROW 1: Key Metrics (Exp, Salary, Notice Period) ── */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
                          <div className="flex items-center gap-1.5">
                            <FiBriefcase className="h-3.5 w-3.5 text-slate-400" />
                            <span className="font-semibold text-slate-800">
                              {c.experience_display || (c.total_years ? `${c.total_years} Yrs` : 'Fresher')}
                            </span>
                          </div>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-slate-800">
                              {c.expected_salary || c.salary || '₹ 6 - 8 Lacs PA'}
                            </span>
                          </div>
                          <span>•</span>
                          <span className="rounded-full bg-emerald-50 text-emerald-700 border-1 border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold">
                            {c.notice_period || '15 Days or less'}
                          </span>
                        </div>

                        {/* ── ROW 2: Current Designation & Company ── */}
                        <div className="text-xs text-slate-700">
                          <span className="font-semibold text-slate-900">
                            {c.job_title || c.designation || 'Professional'}
                          </span>
                          {c.company_name && (
                            <>
                              {' '}at <span className="font-bold text-[#1e2238]">{c.company_name}</span>
                            </>
                          )}
                          <span className="text-slate-400 ml-1.5 font-medium">
                            {c.start_date
                              ? `(${formatDuration(c.start_date, c.end_date, c.currently_working)})`
                              : '(1 yr 2 mos)'}
                          </span>
                        </div>

                        {/* ── ROW 3: Key Skills ── */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span className="text-[11.5px] font-bold text-slate-500 mr-1">Key Skills:</span>
                          {skillsToDisplay.map((s, idx) => (
                            <span
                              key={idx}
                              className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11.5px] font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                            >
                              {s}
                            </span>
                          ))}
                          {hasMoreSkills && (
                            <button
                              onClick={() =>
                                setExpandedSkillsMap((prev) => ({
                                  ...prev,
                                  [c.id]: !prev[c.id]
                                }))
                              }
                              className="rounded-lg bg-blue-50 text-[#0A66C2] px-2 py-0.5 text-[11px] font-bold hover:bg-blue-100 transition-colors cursor-pointer"
                            >
                              {isExpandedSkills ? 'Show Less' : `+${candidateSkills.length - 5} More`}
                            </button>
                          )}
                        </div>

                        {/* ── ROW 4: Education ── */}
                        {(c.course || c.education || c.college) && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <FiAward className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>
                              <span className="font-semibold text-slate-800">
                                {c.course || c.education || 'Graduate'}
                              </span>
                              {c.college && ` • ${c.college}`}
                              {c.end_date && ` (${c.end_date.slice(0, 4)})`}
                            </span>
                          </div>
                        )}

                        {/* ── ROW 5: Location ── */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <FiMapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{c.location || 'India'}</span>
                        </div>

                        {/* ── ROW 6: Professional Summary ── */}
                        <div className="pt-0.5">
                          {c.about ? (
                            <div className="rounded-xl bg-slate-50/90 border border-slate-200/70 p-2.5 text-xs text-slate-700 leading-relaxed shadow-2xs">
                              <div className="flex items-start gap-2">
                                <FiFileText className="h-3.5 w-3.5 text-[#0A66C2] shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <span className="font-bold text-slate-900 mr-1.5 not-italic">Summary:</span>
                                  <span className={`italic text-slate-600 ${expandedAboutMap[c.id] ? '' : 'line-clamp-2'}`}>
                                    &ldquo;{c.about}&rdquo;
                                  </span>
                                  {c.about.length > 130 && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setExpandedAboutMap((prev) => ({
                                          ...prev,
                                          [c.id]: !prev[c.id]
                                        }))
                                      }
                                      className="text-[#0A66C2] hover:text-[#004182] font-bold text-[11px] ml-1.5 hover:underline cursor-pointer inline-flex items-center gap-0.5 not-italic"
                                    >
                                      <span>{expandedAboutMap[c.id] ? 'Show less' : 'Show full summary'}</span>
                                      <FiChevronDown
                                        className={`h-3 w-3 inline transition-transform ${expandedAboutMap[c.id] ? 'rotate-180' : ''}`}
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
                          <div className="flex items-center gap-3">
                            {/* View Number Button */}
                            <button
                              onClick={() => toggleUnmaskPhone(c.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#0A66C2] hover:bg-blue-100 transition-colors cursor-pointer"
                            >
                              <FiPhone className="h-3.5 w-3.5" />
                              <span>{unmaskedPhones[c.id] ? formatCandidatePhone(c) : 'View Number'}</span>
                            </button>

                            {/* Comment Button */}
                            <button
                              onClick={() => {
                                setCommentModalCandidate(c);
                                setCandidateCommentText('');
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <FiMessageSquare className="h-3.5 w-3.5" />
                              <span>Comment {commentsMap[c.id]?.length ? `(${commentsMap[c.id].length})` : ''}</span>
                            </button>

                            {/* Move to Dropdown */}
                            <div className="relative" data-popover-wrapper="move">
                              <button
                                data-popover-trigger="move"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMoveDropdownId(activeMoveDropdownId === c.id ? null : c.id);
                                  setActiveSavedPopoverId(null);
                                  setActiveStagePopoverId(null);
                                }}
                                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                              >
                                <FiFolder className="h-3.5 w-3.5" />
                                <span>Move to</span>
                                <FiChevronDown className={`h-3 w-3 transition-transform ${activeMoveDropdownId === c.id ? 'rotate-180' : ''}`} />
                              </button>
                              {activeMoveDropdownId === c.id && (
                                <div
                                  data-popover-content="move"
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute left-0 bottom-full mb-1.5 w-56 rounded-xl bg-white p-2 shadow-2xl border border-slate-200 z-50 text-left animate-fadeIn"
                                >
                                  <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    Select Destination Folder
                                  </div>
                                  <div className="max-h-48 overflow-y-auto space-y-0.5">
                                    {(allFolders.length > 0 ? allFolders : folders)
                                      .filter((f) => f.id !== selectedFolderForDrawer.id)
                                      .map((f) => (
                                        <button
                                          key={f.id}
                                          onClick={() => handleSingleMove(c.id, f.id)}
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
                                      ))}
                                    {(allFolders.length > 0 ? allFolders : folders).filter((f) => f.id !== selectedFolderForDrawer.id).length === 0 && (
                                      <p className="px-2 py-2 text-xs text-slate-400 italic text-center">No other folders found</p>
                                    )}
                                  </div>
                                  <div className="border-t border-slate-100 pt-1.5 mt-1">
                                    <button
                                      onClick={() => {
                                        setActiveMoveDropdownId(null);
                                        setEditingFolder(null);
                                        setFolderForm({ name: '', job_id: '', folder_type: 'personal', color: 'blue', description: '' });
                                        setIsFolderModalOpen(true);
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
                            {c.email && (
                              <a
                                href={`mailto:${c.email}`}
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#0A66C2] hover:bg-blue-100 transition-colors"
                                title={`Email ${c.email}`}
                              >
                                <FiMail className="h-3.5 w-3.5" />
                              </a>
                            )}
                            {getCandidatePhone(c) && (
                              <a
                                href={`https://wa.me/${getCandidatePhone(c).replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                title="WhatsApp Candidate"
                              >
                                <FaWhatsapp className="h-3.5 w-3.5" />
                              </a>
                            )}
                            {getCandidatePhone(c) && (
                              <a
                                href={`sms:${getCandidatePhone(c).replace(/[^0-9]/g, '')}`}
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                title="Send SMS"
                              >
                                <FiMessageSquare className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>

          </div>

        </div>
      ) : (
        <div className="mx-auto px-18 sm:px-32 lg:px-18 pt-8">

          {/* ── Top Header Section (Exact Match to Reference UI) ───────────── */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6">
            <div className="flex items-center gap-4">
              {/* Top Left Big Folder Icon Box */}
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#0A66C2] shadow-xs">
                <FiFolder className="h-7 w-7 fill-current" />
              </div>

              <div>
                <h1 className="text-[26px] font-semibold tracking-tight text-[#1e2238] mb-0">
                  Folder management
                </h1>
                <p className="mt-0.5 text-[14px] text-[#64748b] mb-0">
                  Organize your campaigns and keep your recruitment pipeline in one place.
                </p>
              </div>
            </div>

            {/* Top Right Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setEditingFolder(null);
                  setFolderForm({
                    name: '',
                    job_id: '',
                    folder_type: 'personal',
                    color: 'blue',
                    description: ''
                  });
                  setIsFolderModalOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-[14px] font-medium text-[#0A66C2] shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
              >
                <FiPlus className="h-4 w-4 stroke-[2.5]" />
                <span>Create Folder</span>
              </button>

              <Link
                href="/post-job"
                className="inline-flex items-center gap-2 rounded-xl bg-[#0A66C2] hover:bg-[#004182] px-6 py-2.5 text-[14px] font-medium text-white shadow-sm transition-all no-underline"
              >
                <FiSend className="h-4 w-4" />
                <span>Post a Job</span>
              </Link>
            </div>
          </div>

          {/* ── Category Tabs Bar with Exact Icons & Bottom Line ───────────── */}
          <div className="border-b border-slate-200/90 flex items-center gap-7 overflow-x-auto scrollbar-none text-[14px] pt-1">
            {[
              { id: 'personal', label: 'Personal Folders', count: tabCounts.personal, icon: FiFolder },
              { id: 'with_job', label: 'Folders with job', count: tabCounts.with_job, icon: FiBriefcase },
              { id: 'archived', label: 'Archived folders', count: tabCounts.archived, icon: FiArchive },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`flex items-center gap-2 whitespace-nowrap pb-3.5 pt-1 font-semibold transition-all relative cursor-pointer ${isActive
                    ? 'text-[#0A66C2]'
                    : 'text-[#64748b] hover:text-[#1e2238]'
                    }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-[#0A66C2] fill-[#0A66C2]/10' : 'text-[#8592a6]'}`} />
                  <span>{tab.label}</span>
                  <span className={isActive ? 'text-[#0A66C2] font-bold' : 'text-[#64748b]'}>
                    ({tab.count})
                  </span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0A66C2] rounded-t-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* ── White Main Card Container ──────────────────────────────────── */}
          <div className="mt-7 rounded-2xl bg-white p-4 sm:p-6 shadow-xs border border-slate-200/80">

            {/* Controls Bar: Search on Left, Sort & View Mode on Right */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
              {/* Search Input */}
              <div className="relative w-full sm:w-80">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
                <input
                  type="text"
                  placeholder="Search folders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-8 text-[13.5px] text-slate-800 placeholder-[#94a3b8] focus:border-[#0A66C2] focus:outline-none focus:ring-1 focus:ring-[#0A66C2]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <FiX className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Right Controls: Sort & Dual View */}
              <div className="flex items-center gap-3">
                {/* Sort Pill Dropdown */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-4 pr-9 text-[13.5px] font-bold text-[#1e2238] shadow-2xs hover:bg-slate-50 cursor-pointer focus:border-[#0A66C2] focus:outline-none"
                  >
                    <option value="active">Last Active</option>
                    <option value="name">Name (A-Z)</option>
                    <option value="candidates">Candidate Count</option>
                  </select>
                  <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                </div>

                {/* View Toggle */}
                <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`rounded-lg p-2 transition-colors cursor-pointer ${viewMode === 'list'
                      ? 'bg-blue-50 text-[#0A66C2]'
                      : 'text-slate-400 hover:text-slate-700'
                      }`}
                    title="Table / List View"
                  >
                    <FiList className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`rounded-lg p-2 transition-colors cursor-pointer ${viewMode === 'grid'
                      ? 'bg-blue-50 text-[#0A66C2]'
                      : 'text-slate-400 hover:text-slate-700'
                      }`}
                    title="Grid Cards View"
                  >
                    <FiGrid className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* ── Table Header Bar ────────────────────────────────────────── */}
            <div className="overflow-x-auto pb-1">
              <div className="min-w-[1100px]">
                <div className="rounded-xl bg-[#f8fafd] px-6 py-3 text-[13px] font-bold text-[#64748b] flex items-center justify-between">
                  <div className="w-[300px] shrink-0">Folder</div>
                  <div className="flex-1 text-center font-bold px-4">Candidate pipeline</div>
                  <div className="w-[160px] shrink-0 text-center font-bold">Campaigns</div>
                  <div className="w-[100px] shrink-0 text-right font-bold pr-2">Actions</div>
                </div>

                {/* ── Table Rows / Folder Cards ───────────────────────────────── */}
                <div className="mt-3 space-y-3">
                  {loading ? (
                    <div className="py-20 text-center">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#0A66C2] border-t-transparent"></div>
                      <p className="mt-3 text-xs font-medium text-slate-500">Loading folders...</p>
                    </div>
                  ) : paginatedFolders.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#0A66C2]">
                        <FiFolder className="h-7 w-7" />
                      </div>
                      <h4 className="mt-3.5 text-[16px] font-bold text-[#1e2238]">
                        {searchQuery ? `No folders matching "${searchQuery}"` : 'No folders found'}
                      </h4>
                      <p className="mt-1 text-xs text-[#64748b] mb-0">
                        {searchQuery
                          ? 'Try clearing the search query or changing tabs.'
                          : 'Create your first candidate folder to start managing pipelines.'}
                      </p>
                      <button
                        onClick={() => {
                          setEditingFolder(null);
                          setFolderForm({
                            name: '',
                            job_id: '',
                            folder_type: 'personal',
                            color: 'blue',
                            description: ''
                          });
                          setIsFolderModalOpen(true);
                        }}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#0A66C2] px-4 py-2 text-xs font-medium text-white shadow-xs hover:bg-[#004182]"
                      >
                        <FiPlus className="h-4 w-4" />
                        <span>Create Folder</span>
                      </button>
                    </div>
                  ) : (
                    paginatedFolders.map((folder, idx) => {
                      const total = Number(folder.candidate_count) || 0;
                      const prospect = Number(folder.prospect_count) || 0;
                      const applicant = Number(folder.applicant_count) || 0;
                      const interviewed = Number(folder.interviewed_count) || 0;

                      const hired = Number(folder.hired_count) || 0;
                      const rejected = Number(folder.rejected_count) || 0;

                      const prospectPct = total > 0 ? Math.round((prospect / total) * 100) : 0;
                      const applicantPct = total > 0 ? Math.round((applicant / total) * 100) : 0;
                      const interviewedPct = total > 0 ? Math.round((interviewed / total) * 100) : 0;
                      const hiredPct = total > 0 ? Math.round((hired / total) * 100) : 0;
                      const rejectedPct = total > 0 ? Math.round((rejected / total) * 100) : 0;

                      // Build dynamic pipeline stages array for this folder
                      const pipelineStages = [
                        {
                          key: 'all',
                          label: 'Total',
                          count: total,
                          pct: null,
                          icon: FiUsers,
                          bg: 'bg-blue-50',
                          text: 'text-[#0A66C2]',
                          badgeBg: '',
                          badgeText: '',
                          alwaysShow: true,
                        },
                        {
                          key: 'prospect',
                          label: 'Prospect',
                          count: prospect,
                          pct: prospectPct,
                          icon: FiUserCheck,
                          bg: 'bg-[#dcfce7]',
                          text: 'text-[#10b981]',
                          badgeBg: 'bg-[#dcfce7]',
                          badgeText: 'text-[#10b981]',
                          // show if has prospects, or if total is 0 or no other stages yet
                          alwaysShow: prospect > 0 || (applicant === 0 && interviewed === 0 && hired === 0 && rejected === 0),
                        },
                        {
                          key: 'applicant',
                          label: 'Job Applicants',
                          count: applicant,
                          pct: applicantPct,
                          icon: FiFileText,
                          bg: 'bg-[#e0f2fe]',
                          text: 'text-[#0284c7]',
                          badgeBg: 'bg-[#e0f2fe]',
                          badgeText: 'text-[#0284c7]',
                          alwaysShow: applicant > 0 || !!folder.linked_job_title,
                        },
                        {
                          key: 'interviewed',
                          label: 'Interviewed',
                          count: interviewed,
                          pct: interviewedPct,
                          icon: FiCalendar,
                          bg: 'bg-[#ffedd5]',
                          text: 'text-[#f97316]',
                          badgeBg: 'bg-[#ffedd5]',
                          badgeText: 'text-[#f97316]',
                          alwaysShow: interviewed > 0 || (hired === 0 && rejected === 0),
                        },
                        ...(hired > 0 ? [{
                          key: 'hired',
                          label: 'Hired',
                          count: hired,
                          pct: hiredPct,
                          icon: FiAward,
                          bg: 'bg-[#ecfdf5]',
                          text: 'text-[#059669]',
                          badgeBg: 'bg-[#d1fae5]',
                          badgeText: 'text-[#059669]',
                          alwaysShow: true,
                        }] : []),
                        ...(rejected > 0 ? [{
                          key: 'rejected',
                          label: 'Rejected',
                          count: rejected,
                          pct: rejectedPct,
                          icon: FiUserX,
                          bg: 'bg-[#fff1f2]',
                          text: 'text-[#e11d48]',
                          badgeBg: 'bg-[#ffe4e6]',
                          badgeText: 'text-[#e11d48]',
                          alwaysShow: true,
                        }] : [])
                      ].filter((st) => st.alwaysShow || st.count > 0);

                      // Alternating icon styling like in screenshot (blue tones)
                      const isBlue = idx % 2 === 1;
                      const iconBoxClass = isBlue
                        ? 'bg-[#e0f2fe] text-[#0284c7]'
                        : 'bg-blue-50 text-[#0A66C2]';

                      return (
                        <div
                          key={folder.id}
                          className="rounded-2xl border border-slate-200/90 bg-white px-6 py-4 shadow-2xs hover:border-[#cbd5e1] hover:shadow-xs transition-all flex items-center justify-between gap-4"
                        >
                          {/* 1. Folder Details Column */}
                          <div className="w-[300px] shrink-0 flex items-start gap-3.5">
                            {/* Folder Icon Box */}
                            <div
                              onClick={() => openFolderDrawer(folder, 'all')}
                              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconBoxClass} cursor-pointer hover:scale-105 transition-transform`}
                            >
                              <FiFolder className="h-6 w-6 fill-current" />
                            </div>

                            {/* Title, Description & Last Active */}
                            <div className="min-w-0 flex-1">
                              <button
                                onClick={() => openFolderDrawer(folder, 'all')}
                                className="text-left font-bold text-[#1e2238] hover:text-[#0A66C2] text-[15.5px] cursor-pointer hover:underline block truncate max-w-full"
                              >
                                {folder.name}
                              </button>

                              <p className="text-[12.5px] text-[#64748b] line-clamp-1 mt-0.5 font-normal mb-0">
                                {folder.description ||
                                  (folder.linked_job_title
                                    ? `Manage candidates and track hiring progress for ${folder.linked_job_title} roles.`
                                    : 'Organize and manage your candidates for future opportunities.')}
                              </p>

                              <div className="mt-1 flex items-center gap-1.5 text-[11.5px] text-[#94a3b8] font-medium whitespace-nowrap">
                                <FiCalendar className="h-3.5 w-3.5 text-[#94a3b8]" />
                                <span>Last Active: {formatDateTime(folder.last_active)}</span>
                              </div>
                            </div>
                          </div>

                          {/* 2. Candidate Pipeline Box Column (Dynamic Interactive Stages - Single Line) */}
                          <div className="flex-1 flex items-center justify-center px-2 min-w-0">
                            <div className="flex items-center justify-center gap-3 xl:gap-5 rounded-2xl px-2 py-1 transition-all max-w-full flex-nowrap overflow-x-auto scrollbar-none">
                              {pipelineStages.map((stage) => {
                                const StageIcon = stage.icon;
                                return (
                                  <div
                                    key={stage.key}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openFolderDrawer(folder, stage.key);
                                    }}
                                    title={`View ${stage.count} ${stage.label} candidate${stage.count === 1 ? '' : 's'}`}
                                    className="flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer rounded-xl px-2 py-1 hover:bg-slate-50 hover:shadow-2xs transition-all group"
                                  >
                                    <div
                                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${stage.bg} ${stage.text} group-hover:scale-105 transition-transform`}
                                    >
                                      <StageIcon className="h-4 w-4" />
                                    </div>
                                    <div className="text-left">
                                      <div className="flex items-center gap-1.5 leading-none">
                                        <span className="text-[14px] font-extrabold text-[#1e2238] group-hover:text-[#0A66C2] transition-colors">
                                          {stage.count}
                                        </span>
                                        {stage.pct !== null && total > 0 && (
                                          <span
                                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${stage.badgeBg} ${stage.badgeText}`}
                                          >
                                            {stage.pct}%
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[11px] text-[#8592a6] font-medium mt-1">
                                        {stage.label}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* 3. Campaigns Column: "Send Email" Blue Pill Button */}
                          <div className="w-[160px] shrink-0 flex items-center justify-center">
                            <button
                              onClick={() => openEmailModal(folder)}
                              className="inline-flex items-center gap-2 rounded-xl bg-blue-50 hover:bg-blue-100 px-4 py-2 text-[13.5px] font-bold text-[#0A66C2] transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                            >
                              <FiMail className="h-4 w-4" />
                              <span>Send Email</span>
                            </button>
                          </div>

                          {/* 4. Actions Column: Tray Download + 3-dots in Rounded White Boxes */}
                          <div className="w-[100px] shrink-0 flex items-center justify-end gap-2 pr-2">
                            {/* Download Tray Icon */}
                            <button
                              onClick={() => handleExportCSV(folder)}
                              title="Download Candidates CSV"
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-[#0A66C2] hover:border-[#0A66C2] shadow-2xs transition-all cursor-pointer shrink-0"
                            >
                              <FiDownload className="h-4 w-4" />
                            </button>

                            {/* Three Dots Menu */}
                            <div
                              className="relative shrink-0"
                              ref={openMenuId === folder.id ? menuRef : null}
                            >
                              <button
                                onClick={() =>
                                  setOpenMenuId(openMenuId === folder.id ? null : folder.id)
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800 shadow-2xs transition-all cursor-pointer"
                              >
                                <FiMoreVertical className="h-4 w-4" />
                              </button>

                              {openMenuId === folder.id && (
                                <div className="absolute right-0 z-30 mt-1 w-44 rounded-xl border border-slate-100 bg-white py-1 shadow-lg text-left">
                                  <button
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      openFolderDrawer(folder);
                                    }}
                                    className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                  >
                                    <FiUsers className="h-3.5 w-3.5 text-slate-400" />
                                    <span>View Candidates</span>
                                  </button>

                                  <button
                                    onClick={() => openEditModal(folder)}
                                    className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                  >
                                    <FiEdit2 className="h-3.5 w-3.5 text-slate-400" />
                                    <span>Edit Folder</span>
                                  </button>

                                  <button
                                    onClick={() => handleToggleArchive(folder)}
                                    className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                  >
                                    <FiArchive className="h-3.5 w-3.5 text-slate-400" />
                                    <span>{folder.is_archived ? 'Unarchive' : 'Archive'}</span>
                                  </button>

                                  <div className="my-1 border-t border-slate-100"></div>

                                  <button
                                    onClick={() => handleDeleteFolder(folder)}
                                    className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                                  >
                                    <FiTrash2 className="h-3.5 w-3.5 text-rose-500" />
                                    <span>Delete Folder</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* ── Bottom Pagination Bar (Exact to Reference UI) ───────────── */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-4 text-[13px] text-[#64748b]">
              <div>
                Showing {paginatedFolders.length} of {sortedFolders.length} folders
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  <FiChevronLeft className="h-4 w-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    onClick={() => setCurrentPage(pg)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-all ${currentPage === pg
                      ? 'bg-[#0A66C2] text-white shadow-2xs'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    {pg}
                  </button>
                ))}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  <FiChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          RECRUITER NOTE / COMMENT MODAL
          ═════════════════════════════════════════════════════════════════════ */}
      {commentModalCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                {(() => {
                  const modalRawImg = commentModalCandidate.profile_image || commentModalCandidate.profile_picture || commentModalCandidate.photo || commentModalCandidate.avatar || commentModalCandidate.image;
                  const modalImgUrl = modalRawImg ? getImageUrl(modalRawImg) : null;
                  const modalInit = commentModalCandidate.name ? commentModalCandidate.name.charAt(0).toUpperCase() : 'C';
                  return modalImgUrl ? (
                    <img
                      src={modalImgUrl}
                      alt={commentModalCandidate.name}
                      className="h-8 w-8 shrink-0 rounded-xl object-cover border border-slate-200 shadow-2xs"
                    />
                  ) : (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0A66C2] font-bold text-xs shadow-2xs">
                      {modalInit}
                    </div>
                  );
                })()}
                <h3 className="text-base font-bold text-slate-900 mb-0">
                  Notes on {commentModalCandidate.name}
                </h3>
              </div>
              <button
                onClick={() => setCommentModalCandidate(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {/* Existing notes */}
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {(commentsMap[commentModalCandidate.id] || []).length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2 text-center">No notes added for this candidate yet.</p>
                ) : (
                  commentsMap[commentModalCandidate.id].map((note, idx) => (
                    <div key={idx} className="rounded-xl bg-slate-50 p-3 text-xs text-slate-700 border border-slate-100">
                      <p className="mb-1 leading-relaxed">{note.text}</p>
                      <span className="text-[10px] text-slate-400 font-medium">{note.date}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Add new note input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Add Note
                </label>
                <textarea
                  rows={3}
                  placeholder="Type evaluation notes or feedback..."
                  value={candidateCommentText}
                  onChange={(e) => setCandidateCommentText(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#0A66C2]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCommentModalCandidate(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!candidateCommentText.trim()) return;
                    const newNote = {
                      text: candidateCommentText.trim(),
                      date: new Date().toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    };
                    setCommentsMap((prev) => ({
                      ...prev,
                      [commentModalCandidate.id]: [...(prev[commentModalCandidate.id] || []), newNote]
                    }));
                    setCandidateCommentText('');
                    CommonToaster('Note added successfully', 'success');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0A66C2] hover:bg-[#004182] cursor-pointer"
                >
                  Save Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          CREATE / EDIT FOLDER MODAL
          ═════════════════════════════════════════════════════════════════════ */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <h3 className="text-lg font-bold text-slate-900 mb-0">
                {editingFolder ? 'Edit Folder' : 'Create New Folder'}
              </h3>
              <button
                onClick={() => setIsFolderModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFolder} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Folder Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. React Node, Digital Marketing"
                  value={folderForm.name}
                  onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#0A66C2] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Link with Job Post <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <select
                  value={folderForm.job_id || ''}
                  onChange={(e) =>
                    setFolderForm({
                      ...folderForm,
                      job_id: e.target.value,
                      folder_type: e.target.value ? 'job' : folderForm.folder_type
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700 focus:border-[#0A66C2] focus:outline-none"
                >
                  <option value="">No linked job (General folder)</option>
                  {postedJobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.job_title} ({job.company_name || 'Job'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Folder Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'personal', label: 'Personal' },
                    { id: 'shared', label: 'Shared' },
                    { id: 'default', label: 'Default' },
                  ].map((t) => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setFolderForm({ ...folderForm, folder_type: t.id })}
                      className={`rounded-xl border py-2 text-xs font-bold ${folderForm.folder_type === t.id
                        ? 'border-[#0A66C2] bg-blue-50 text-[#0A66C2]'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Manage candidates and track hiring progress for React Node roles."
                  value={folderForm.description}
                  onChange={(e) => setFolderForm({ ...folderForm, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-[#0A66C2] focus:outline-none"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFolderModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingFolder}
                  className="rounded-xl bg-[#0A66C2] px-6 py-2 text-sm font-medium text-white shadow-xs hover:bg-[#004182] disabled:opacity-50"
                >
                  {savingFolder ? 'Saving...' : editingFolder ? 'Update' : 'Create Folder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          SEND CAMPAIGN / EMAIL MODAL
          ═════════════════════════════════════════════════════════════════════ */}
      {emailModalOpen && emailTargetFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-[#0A66C2]">
                  <FiMail className="h-4 w-4" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Send Email to "{emailTargetFolder.name}"
                </h3>
              </div>
              <button
                onClick={() => setEmailModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSendEmail} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Stage</label>
                <select
                  value={emailStageFilter}
                  onChange={(e) => setEmailStageFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-700 focus:border-[#0A66C2] focus:outline-none"
                >
                  <option value="all" style={{ color: '#334155', backgroundColor: '#ffffff' }} className="text-slate-700 font-semibold">
                    All Candidates ({emailTargetFolder.candidate_count || 0})
                  </option>
                  <option value="prospect" style={{ color: '#475569', backgroundColor: '#ffffff' }} className="text-slate-600 font-semibold">
                    Prospects Only ({emailTargetFolder.prospect_count || 0})
                  </option>
                  <option value="applicant" style={{ color: '#1d4ed8', backgroundColor: '#ffffff' }} className="text-blue-700 font-semibold">
                    Job Applicants Only ({emailTargetFolder.applicant_count || 0})
                  </option>
                  <option value="interviewed" style={{ color: '#0284c7', backgroundColor: '#ffffff' }} className="text-sky-700 font-semibold">
                    Interviewed Only ({emailTargetFolder.interviewed_count || 0})
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-[#0A66C2] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Message</label>
                <textarea
                  rows={6}
                  required
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-[#0A66C2] focus:outline-none font-sans"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEmailModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="rounded-xl bg-[#0A66C2] px-6 py-2 text-sm font-bold text-white shadow-xs hover:bg-[#004182] disabled:opacity-50"
                >
                  {sendingEmail ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Candidate Profile Photo Preview Modal */}
      {previewImageModal && (
        <div
          onClick={() => setPreviewImageModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-slate-100 animate-fadeIn space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 mb-0">
                {previewImageModal.title || 'Profile Photo'}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewImageModal(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center justify-center rounded-xl overflow-hidden min-h-[260px] bg-slate-50 border border-slate-100">
              <img
                src={previewImageModal.url}
                alt={previewImageModal.title || 'Profile Photo'}
                className="max-h-[60vh] max-w-full rounded-lg object-contain shadow-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
