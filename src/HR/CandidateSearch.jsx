'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search, Bookmark, ChevronDown, PlusCircle, MapPin, Check, Briefcase,
  FileText, Sparkles, X, Info,
  Clock, Mic, MicOff, Trash2, ArrowRight, RotateCcw,
  SlidersHorizontal, GraduationCap, Building2, Globe2, AlertCircle
} from 'lucide-react';
import { KeywordsAutocomplete, CheckboxDropdown, TwoPaneIndustryDropdown, CompanySearchDropdown, DegreeMultiSelect } from './CandidateSearchComponents';
import { getCandidateFilterOptionsAPI } from '../ApiService/action';
import { CommonToaster } from '../Common/CommonToaster';

const CandidateSearch = () => {
  const router = useRouter();
  const urlSearchParams = useSearchParams();

  // Unified Search State
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
    activeUpdated: 'All time',
    smartInsights: [],
    gender: [],
    differentlyAbled: [],
    languages: [],
    visaStatus: []
  };

  const [searchParams, setSearchParams] = useState(initialParams);
  const [searchError, setSearchError] = useState('');

  // Tabs & Accordions
  const [activeTab, setActiveTab] = useState('Search form');
  const [rightTab, setRightTab] = useState('Recent searches');
  const [accordions, setAccordions] = useState({
    education: true,
    employment: true,
    insights: true,
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

  useEffect(() => {
    try {
      const savedRecent = localStorage.getItem('careerfast_recent_searches');
      if (savedRecent) setRecentSearches(JSON.parse(savedRecent));

      const savedList = localStorage.getItem('careerfast_saved_searches');
      if (savedList) setSavedSearches(JSON.parse(savedList));
    } catch (e) {
      console.error("Error reading localStorage", e);
    }
  }, []);

  // Pre-fill form if query parameters are present (e.g. clicking "Modify Search" from results)
  useEffect(() => {
    if (!urlSearchParams) return;
    const kw = urlSearchParams.get('keywords') || urlSearchParams.get('search');
    const loc = urlSearchParams.get('location');
    const expMin = urlSearchParams.get('expMin');
    const expMax = urlSearchParams.get('expMax');
    const salaryMin = urlSearchParams.get('salaryMin');
    const salaryMax = urlSearchParams.get('salaryMax');
    const np = urlSearchParams.get('noticePeriod');
    const comp = urlSearchParams.get('company');
    const ind = urlSearchParams.get('industry');
    const ug = urlSearchParams.get('ugQualification');
    const specUG = urlSearchParams.get('specificUG');
    const pg = urlSearchParams.get('pgQualification');
    const specPG = urlSearchParams.get('specificPG');
    const gen = urlSearchParams.get('gender');

    if (kw || loc || expMin || expMax || salaryMin || salaryMax || np || comp || ug || specUG) {
      setSearchParams(prev => ({
        ...prev,
        keywords: kw ? kw.split(/[\s,]+/).map(s => s.trim()).filter(Boolean) : prev.keywords,
        location: loc ? loc.split(',').map(s => s.trim()).filter(Boolean) : prev.location,
        expMin: expMin || prev.expMin,
        expMax: expMax || prev.expMax,
        salaryMin: salaryMin || prev.salaryMin,
        salaryMax: salaryMax || prev.salaryMax,
        noticePeriod: np ? np.split(',').map(s => s.trim()).filter(Boolean) : prev.noticePeriod,
        company: comp ? comp.split(',').map(s => s.trim()).filter(Boolean) : prev.company,
        industry: ind ? ind.split(',').map(s => s.trim()).filter(Boolean) : prev.industry,
        ugQualification: ug || prev.ugQualification,
        specificUG: specUG ? specUG.split(',').map(s => s.trim()).filter(Boolean) : prev.specificUG,
        pgQualification: pg || prev.pgQualification,
        specificPG: specPG ? specPG.split(',').map(s => s.trim()).filter(Boolean) : prev.specificPG,
        gender: gen ? gen.split(',').map(s => s.trim()).filter(Boolean) : prev.gender
      }));
    }
  }, [urlSearchParams]);

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

  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const res = await getCandidateFilterOptionsAPI();
        if (res?.data?.data) {
          setFilterOptions(res.data.data);
        }
      } catch (err) {
        console.error("Error loading filter options:", err);
      }
    };
    loadFilterOptions();
  }, []);

  const toggleAccordion = (name) => {
    setAccordions(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handlePillToggle = (field, value, multi = true) => {
    if (searchError) setSearchError('');
    setSearchParams(prev => {
      const current = prev[field];
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
      if (prev[field].includes(trimmed)) return prev;
      return { ...prev, [field]: [...prev[field], trimmed] };
    });
    clearInputFn('');
  };

  const removeTag = (field, itemToRemove) => {
    setSearchParams(prev => ({
      ...prev,
      [field]: prev[field].filter(item => item !== itemToRemove)
    }));
  };

  // Modern Pill Component
  const Pill = ({ label, field, value, multi = true, isSmart = false }) => {
    const isSelected = multi ? searchParams[field]?.includes(value) : searchParams[field] === value;
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
  const activeFilterCount = [
    searchParams.keywords?.length > 0,
    (searchParams.expMin && searchParams.expMin !== 'Years' && searchParams.expMin !== 'Any') ||
    (searchParams.expMax && searchParams.expMax !== 'Years' && searchParams.expMax !== 'Any'),
    searchParams.location?.length > 0,
    searchParams.preferredLocations?.length > 0,
    (searchParams.salaryMin && searchParams.salaryMin !== 'Lacs' && searchParams.salaryMin !== 'Any') ||
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
  ].filter(Boolean).length;

  // Clear searchError when user adds any criteria
  useEffect(() => {
    if (searchError && activeFilterCount > 0) {
      setSearchError('');
    }
  }, [activeFilterCount, searchError]);

  // Perform Search & Navigation
  const handleSearch = (customParams = null) => {
    const activeData = customParams || searchParams;

    // Validate that at least one keyword or filter is selected
    const hasAnyCriteria = [
      activeData.keywords?.length > 0,
      (activeData.expMin && activeData.expMin !== 'Years' && activeData.expMin !== 'Any') ||
      (activeData.expMax && activeData.expMax !== 'Years' && activeData.expMax !== 'Any'),
      activeData.location?.length > 0,
      activeData.preferredLocations?.length > 0,
      (activeData.salaryMin && activeData.salaryMin !== 'Lacs' && activeData.salaryMin !== 'Any') ||
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
      if (activeTab !== 'Search form') {
        setActiveTab('Search form');
      }
      setTimeout(() => {
        const keywordsEl = document.getElementById('keywords-section');
        if (keywordsEl) {
          keywordsEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
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

    // Persist to recent searches
    const summaryParts = [
      activeData.keywords?.length > 0 ? activeData.keywords.join(', ') : (activeData.designation || 'All Candidates'),
      activeData.location?.length > 0 ? activeData.location.slice(0, 2).join(', ') : null,
      activeData.expMin !== 'Years' ? `${activeData.expMin}+ yrs` : null,
      activeData.noticePeriod?.length > 0 ? activeData.noticePeriod[0] : null
    ].filter(Boolean);

    const newRecent = {
      id: Date.now(),
      title: summaryParts.join(' • '),
      timestamp: 'Just now',
      params: activeData
    };

    const updatedRecent = [newRecent, ...recentSearches.filter(r => r.title !== newRecent.title)].slice(0, 10);
    setRecentSearches(updatedRecent);
    try {
      localStorage.setItem('careerfast_recent_searches', JSON.stringify(updatedRecent));
    } catch (e) { }

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
      localStorage.setItem('careerfast_saved_searches', JSON.stringify(updated));
    } catch (e) { }
    setSaveSearchName('');
    setSaveSearchModal(false);
  };

  const handleDeleteSavedSearch = (id, e) => {
    e.stopPropagation();
    const updated = savedSearches.filter(s => s.id !== id);
    setSavedSearches(updated);
    try {
      localStorage.setItem('careerfast_saved_searches', JSON.stringify(updated));
    } catch (e) { }
  };

  const handleDeleteRecentSearch = (id, e) => {
    if (e) e.stopPropagation();
    const updated = recentSearches.filter(s => s.id !== id);
    setRecentSearches(updated);
    try {
      localStorage.setItem('careerfast_recent_searches', JSON.stringify(updated));
    } catch (e) { }
  };

  const handleClearAllRecentSearches = (e) => {
    if (e) e.stopPropagation();
    setRecentSearches([]);
    try {
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
        if (jdText.includes(s)) extractedKeywords.push(s);
      });

      let expFound = 'Years';
      if (jdText.includes('1 year') || jdText.includes('1+ year')) expFound = '1';
      else if (jdText.includes('2 year') || jdText.includes('2+ year')) expFound = '2';
      else if (jdText.includes('3 year') || jdText.includes('3+ year')) expFound = '3';
      else if (jdText.includes('5 year') || jdText.includes('5+ year')) expFound = '5';

      let locFound = [];
      ['chennai', 'bengaluru', 'bangalore', 'hyderabad', 'mumbai', 'delhi', 'pune'].forEach(loc => {
        if (jdText.includes(loc)) {
          const cap = loc.charAt(0).toUpperCase() + loc.slice(1);
          locFound.push(cap === 'Bangalore' ? 'Bengaluru' : cap);
        }
      });

      setSearchParams(prev => ({
        ...prev,
        keywords: extractedKeywords.slice(0, 5),
        expMin: expFound,
        location: locFound.length > 0 ? locFound : prev.location
      }));

      setIsExtractingJD(false);
      setActiveTab('Search form');
    }, 800);
  };

  // AI Voice Search
  const toggleVoiceListening = () => {
    if (!isListening) {
      setIsListening(true);
      setVoiceTranscript("Listening... Please speak your criteria (e.g. 'Senior React Developers in Chennai with 3 years experience')");

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.lang = 'en-IN';
          recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setVoiceTranscript(transcript);
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-28 text-slate-800 antialiased">

      {/* Top Navigation Header */}
      <div className="bg-white border-b border-slate-200/80 relative z-10 shadow-2xs">
        <div className="max-w-[1440px] mx-auto px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0A66C2] text-white flex items-center justify-center shadow-sm">
              <Search size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[20px] mb-0 font-bold text-slate-900">Candidate Search</h1>
                <span className="bg-blue-50 text-[#0A66C2] text-[11px] font-semibold px-2 py-0.5 rounded-full border border-blue-200/70">
                  Talent Discovery
                </span>
              </div>
              <p className="text-[13px] text-slate-500 mb-0">Filter, source and match verified candidates across tech, design and business domains</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[13px] text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <RotateCcw size={14} /> Reset Filters
              </button>
            )}
            <button
              type="button"
              onClick={() => setSaveSearchModal(true)}
              className="text-[13px] text-[#0A66C2] bg-blue-50 hover:bg-blue-100/80 border-1 border-blue-200/80 font-semibold flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all shadow-2xs"
            >
              <Bookmark size={14} /> Save Search
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 pt-6 flex flex-col lg:flex-row gap-6 items-start">

        {/* Left Column - Main Search Form */}
        <div className="flex-1 w-full bg-white rounded-2xl shadow-xs border border-slate-200/80">

          {/* Tabs Container */}
          <div className="px-6 pt-4 pb-0 border-b border-slate-100 bg-slate-50/40 rounded-t-2xl">
            <div className="flex gap-2">
              {[
                { name: 'Search form', icon: SlidersHorizontal },
                { name: 'Search by Job Description', icon: FileText },
                { name: 'AI Voice Search', icon: Mic, badge: 'AI' }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.name;
                return (
                  <button
                    key={tab.name}
                    type="button"
                    onClick={() => setActiveTab(tab.name)}
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
          <div className="p-8 pb-36 space-y-8">

            {/* TAB 1: Main Search Form */}
            {activeTab === 'Search form' && (
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
                        <select
                          value={searchParams.searchIn}
                          onChange={e => setSearchParams(p => ({ ...p, searchIn: e.target.value }))}
                          className="border border-slate-200 rounded-lg px-2.5 py-1 text-[13px] font-medium text-slate-700 focus:outline-none focus:border-[#0A66C2] bg-white shadow-2xs cursor-pointer"
                        >
                          <option value="Profile">Entire Profile</option>
                          <option value="Resume">Resume Text</option>
                          <option value="Both">Both Profile & Resume</option>
                        </select>
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
                        className="text-[12px] text-slate-500 hover:text-slate-700"
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
                          className="text-[11px] text-slate-400 hover:text-slate-600 font-semibold"
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

                {/* SECTION 2: Experience & Compensation */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[14px] font-bold text-slate-900 flex items-center gap-2">
                      <Briefcase size={16} className="text-[#0A66C2]" /> Experience Level
                    </label>
                    <button
                      type="button"
                      onClick={() => setSearchParams(p => ({ ...p, showMonths: !p.showMonths }))}
                      className="text-[12px] text-[#0A66C2] hover:text-[#004182] font-semibold flex items-center gap-1"
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
                        <select
                          className="flex-1 border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 py-2.5 text-[14px] text-slate-800 focus:outline-none focus:border-[#0A66C2] focus:ring-2 focus:ring-blue-500/15 bg-white cursor-pointer shadow-2xs"
                          value={searchParams.expMin}
                          onChange={e => setSearchParams(p => ({ ...p, expMin: e.target.value }))}
                        >
                          <option value="Years">Any Min Experience</option>
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15].map(n => (
                            <option key={n} value={n}>{n} {n === 1 ? 'Year' : 'Years'}</option>
                          ))}
                        </select>
                        {searchParams.showMonths && (
                          <select
                            className="w-24 border border-slate-200 rounded-xl px-2 py-2 text-[13px] text-slate-700 focus:outline-none focus:border-[#0A66C2] bg-white"
                            value={searchParams.expMonthsMin}
                            onChange={e => setSearchParams(p => ({ ...p, expMonthsMin: e.target.value }))}
                          >
                            {[...Array(12)].map((_, i) => (
                              <option key={i} value={i}>{i} Mos</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-[12px] font-semibold text-slate-500 mb-1.5 block">Maximum Experience</span>
                      <div className="flex gap-2">
                        <select
                          className="flex-1 border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 py-2.5 text-[14px] text-slate-800 focus:outline-none focus:border-[#0A66C2] focus:ring-2 focus:ring-blue-500/15 bg-white cursor-pointer shadow-2xs"
                          value={searchParams.expMax}
                          onChange={e => setSearchParams(p => ({ ...p, expMax: e.target.value }))}
                        >
                          <option value="Years">Any Max Experience</option>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25].map(n => (
                            <option key={n} value={n}>{n} Years</option>
                          ))}
                        </select>
                        {searchParams.showMonths && (
                          <select
                            className="w-24 border border-slate-200 rounded-xl px-2 py-2 text-[13px] text-slate-700 focus:outline-none focus:border-[#0A66C2] bg-white"
                            value={searchParams.expMonthsMax}
                            onChange={e => setSearchParams(p => ({ ...p, expMonthsMax: e.target.value }))}
                          >
                            {[...Array(12)].map((_, i) => (
                              <option key={i} value={i}>{i} Mos</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* SECTION 3: Location & Notice Period */}
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
                        className="text-[12px] text-slate-500 hover:text-slate-700"
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

                {/* SECTION 4: Annual Compensation */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[14px] font-bold text-slate-900 flex items-center gap-2">
                      <span>Annual CTC / Compensation (₹ INR)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setSearchParams(p => ({ ...p, showThousands: !p.showThousands }))}
                      className="text-[12px] text-[#0A66C2] hover:text-[#004182] font-semibold flex items-center gap-1"
                    >
                      <PlusCircle size={13} /> {searchParams.showThousands ? 'Hide Thousands' : 'Specify Thousands'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-[12px] font-semibold text-slate-500 mb-1.5 block">Minimum Salary</span>
                      <div className="flex gap-2">
                        <select
                          value={searchParams.salaryMin}
                          onChange={e => setSearchParams(p => ({ ...p, salaryMin: e.target.value }))}
                          className="flex-1 border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 py-2.5 text-[14px] text-slate-800 focus:outline-none focus:border-[#0A66C2] focus:ring-2 focus:ring-blue-500/15 bg-white cursor-pointer shadow-2xs"
                        >
                          <option value="Lacs">Any Min Salary</option>
                          <option value="Any">0 (Fresher)</option>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20, 25, 30, 40, 50].map(s => (
                            <option key={s} value={s}>{s} Lakhs / year</option>
                          ))}
                        </select>
                        {searchParams.showThousands && (
                          <select
                            value={searchParams.salaryThousandsMin}
                            onChange={e => setSearchParams(p => ({ ...p, salaryThousandsMin: e.target.value }))}
                            className="w-24 border border-slate-200 rounded-xl px-2 py-2 text-[13px] text-slate-700 focus:outline-none focus:border-[#0A66C2] bg-white"
                          >
                            {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90].map(t => (
                              <option key={t} value={t}>{t} K</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-[12px] font-semibold text-slate-500 mb-1.5 block">Maximum Salary</span>
                      <div className="flex gap-2">
                        <select
                          value={searchParams.salaryMax}
                          onChange={e => setSearchParams(p => ({ ...p, salaryMax: e.target.value }))}
                          className="flex-1 border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 py-2.5 text-[14px] text-slate-800 focus:outline-none focus:border-[#0A66C2] focus:ring-2 focus:ring-blue-500/15 bg-white cursor-pointer shadow-2xs"
                        >
                          <option value="Lacs">Any Max Salary</option>
                          <option value="Any">No Upper Limit</option>
                          {[2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20, 25, 30, 40, 50, 75, 100].map(s => (
                            <option key={s} value={s}>{s} Lakhs / year</option>
                          ))}
                        </select>
                        {searchParams.showThousands && (
                          <select
                            value={searchParams.salaryThousandsMax}
                            onChange={e => setSearchParams(p => ({ ...p, salaryThousandsMax: e.target.value }))}
                            className="w-24 border border-slate-200 rounded-xl px-2 py-2 text-[13px] text-slate-700 focus:outline-none focus:border-[#0A66C2] bg-white"
                          >
                            {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90].map(t => (
                              <option key={t} value={t}>{t} K</option>
                            ))}
                          </select>
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
                    Include profiles who haven&apos;t publicly disclosed their current CTC
                  </label>
                </div>

                <hr className="border-slate-100" />

                {/* SECTION 5: Notice Period */}
                <div className="space-y-3">
                  <label className="text-[14px] font-bold text-slate-900 flex items-center gap-2">
                    <Clock size={16} className="text-[#0A66C2]" /> Notice Period & Availability
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Immediate joiner', 'Upto 15 days', 'Upto 30 days', 'Upto 45 days', 'Upto 60 days', 'Upto 90 days', 'Any'].map(np => (
                      <Pill key={np} label={np} field="noticePeriod" value={np} />
                    ))}
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* ACCORDION 1: Education Details */}
                <div className="border border-slate-200/90 rounded-2xl transition-all shadow-2xs bg-white">
                  <div
                    onClick={() => toggleAccordion('education')}
                    className={`bg-slate-50/70 px-4 py-3.5 flex justify-between items-center border-b border-slate-100 cursor-pointer hover:bg-slate-100/60 transition-colors ${accordions.education ? 'rounded-t-2xl' : 'rounded-2xl'
                      }`}
                  >
                    <h3 className="text-[14px] font-bold text-slate-800 flex items-center gap-2.5 mb-0">
                      <GraduationCap size={18} className="text-[#0A66C2]" />
                      <span>Education & Academic Background</span>
                      {(searchParams.ugQualification || searchParams.pgQualification || searchParams.specificUG?.length > 0 || searchParams.specificPG?.length > 0 || searchParams.doctorateQualification?.length > 0) && (
                        <span className="bg-blue-100 text-[#0A66C2] text-[11px] font-bold px-2 py-0.5 rounded-full">
                          Configured
                        </span>
                      )}
                    </h3>
                    <ChevronDown size={18} className={`text-slate-400 transition-transform duration-200 ${accordions.education ? 'rotate-180 text-[#0A66C2]' : ''}`} />
                  </div>

                  {accordions.education && (
                    <div className="p-6 space-y-6 bg-white rounded-b-2xl">
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
                <div className="border border-slate-200/90 rounded-2xl transition-all shadow-2xs bg-white">
                  <div
                    onClick={() => toggleAccordion('employment')}
                    className={`bg-slate-50/70 px-4 py-3.5 flex justify-between items-center border-b border-slate-100 cursor-pointer hover:bg-slate-100/60 transition-colors ${accordions.employment ? 'rounded-t-2xl' : 'rounded-2xl'
                      }`}
                  >
                    <h3 className="text-[14px] font-bold text-slate-800 flex items-center gap-2.5 mb-0">
                      <Building2 size={18} className="text-[#0A66C2]" />
                      <span>Employment details</span>
                      {(searchParams.industry?.length > 0 || searchParams.company?.length > 0 || searchParams.designation) && (
                        <span className="bg-blue-100 text-[#0A66C2] text-[11px] font-bold px-2 py-0.5 rounded-full">
                          Configured
                        </span>
                      )}
                    </h3>
                    <ChevronDown size={18} className={`text-slate-400 transition-transform duration-200 ${accordions.employment ? 'rotate-180 text-[#0A66C2]' : ''}`} />
                  </div>

                  {accordions.employment && (
                    <div className="p-6 space-y-6 bg-white rounded-b-2xl">
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
                          <select
                            value={searchParams.industryMatch}
                            onChange={e => setSearchParams(p => ({ ...p, industryMatch: e.target.value }))}
                            className="text-[13px] text-slate-700 bg-transparent font-medium cursor-pointer focus:outline-none hover:text-[#0A66C2]"
                          >
                            <option value="Current or past industry">Current or past industry</option>
                            <option value="Current industry">Current industry only</option>
                            <option value="Past industry">Past industry only</option>
                          </select>
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
                          <select
                            value={searchParams.companyMatch}
                            onChange={e => setSearchParams(p => ({ ...p, companyMatch: e.target.value }))}
                            className="text-[13px] text-slate-700 bg-transparent font-medium cursor-pointer focus:outline-none hover:text-[#0A66C2]"
                          >
                            <option value="Current employees">Current employees</option>
                            <option value="Past employees">Past employees</option>
                            <option value="All employees">All employees</option>
                          </select>
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
                                  className="text-[11px] text-slate-400 hover:text-slate-600 font-semibold"
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
                      <div className="relative z-10">
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
                          <select
                            value={searchParams.designationMatch}
                            onChange={e => setSearchParams(p => ({ ...p, designationMatch: e.target.value }))}
                            className="text-[13px] text-slate-700 bg-transparent font-medium cursor-pointer focus:outline-none hover:text-[#0A66C2]"
                          >
                            <option value="Current designation">Current designation</option>
                            <option value="Past designation">Past designation</option>
                            <option value="Any designation">Any designation</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ACCORDION 3: Smart Insights & Tags */}
                <div className="border border-slate-200/90 rounded-2xl transition-all shadow-2xs bg-white">
                  <div
                    onClick={() => toggleAccordion('insights')}
                    className={`bg-slate-50/70 px-4 py-3.5 flex justify-between items-center border-b border-slate-100 cursor-pointer hover:bg-slate-100/60 transition-colors ${accordions.insights ? 'rounded-t-2xl' : 'rounded-2xl'
                      }`}
                  >
                    <h3 className="text-[14px] font-bold text-slate-800 flex items-center gap-2.5 mb-0">
                      <Sparkles size={18} className="text-[#0A66C2]" />
                      <span>Smart Talent Insights & Signals</span>
                      {searchParams.smartInsights?.length > 0 && (
                        <span className="bg-blue-100 text-[#0A66C2] text-[11px] font-bold px-2 py-0.5 rounded-full">
                          {searchParams.smartInsights.length} active
                        </span>
                      )}
                    </h3>
                    <ChevronDown size={18} className={`text-slate-400 transition-transform duration-200 ${accordions.insights ? 'rotate-180 text-[#0A66C2]' : ''}`} />
                  </div>

                  {accordions.insights && (
                    <div className="p-6 space-y-5 bg-white rounded-b-2xl">
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

                {/* ACCORDION 4: Diversity, Languages & Additional */}
                <div className="border border-slate-200/90 rounded-2xl transition-all shadow-2xs bg-white">
                  <div
                    onClick={() => toggleAccordion('additional')}
                    className={`bg-slate-50/70 px-4 py-3.5 flex justify-between items-center border-b border-slate-100 cursor-pointer hover:bg-slate-100/60 transition-colors ${accordions.additional ? 'rounded-t-2xl' : 'rounded-2xl'
                      }`}
                  >
                    <h3 className="text-[14px] font-bold text-slate-800 flex items-center gap-2.5 mb-0">
                      <Globe2 size={18} className="text-[#0A66C2]" />
                      <span>Diversity, Languages & Visa Status</span>
                    </h3>
                    <ChevronDown size={18} className={`text-slate-400 transition-transform duration-200 ${accordions.additional ? 'rotate-180 text-[#0A66C2]' : ''}`} />
                  </div>

                  {accordions.additional && (
                    <div className="p-6 space-y-5 bg-white rounded-b-2xl">
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
              </>
            )}

            {/* TAB 2: Search by Job Description */}
            {activeTab === 'Search by Job Description' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50/80 to-blue-50/30 p-4 rounded-2xl border border-blue-100 flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-white text-[#0A66C2] shadow-2xs">
                    <Sparkles size={22} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-slate-900 mb-0.5">AI Job Description Matcher</h3>
                    <p className="text-[13px] text-slate-600 leading-relaxed mb-0">
                      Simply paste your job description below. CareerFast will parse role requirements, key skills, experience level, and locations to find candidates with the highest matching score.
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
            {activeTab === 'AI Voice Search' && (
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
                      onClick={() => handleSearch()}
                      className="px-8 py-3 bg-[#0A66C2] hover:bg-[#004182] text-white font-bold rounded-xl text-[14px] cursor-pointer shadow-md"
                    >
                      Search Candidates Now
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Sticky Bottom Bar */}
          <div className="sticky bottom-0 bg-white border-t border-slate-200/90 p-3 px-8 flex flex-col sm:flex-row justify-between items-center gap-3 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] rounded-b-2xl">
            <div className="flex items-center gap-4 text-[13px] font-medium text-slate-600">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Updated:</span>
                <select
                  value={searchParams.activeUpdated}
                  onChange={e => setSearchParams(p => ({ ...p, activeUpdated: e.target.value }))}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-[13px] font-medium text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="All time">All time</option>
                  <option value="7">In last 7 days</option>
                  <option value="15">In last 15 days</option>
                  <option value="30">In last 30 days</option>
                  <option value="90">In last 3 months</option>
                  <option value="180">In last 6 months</option>
                </select>
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
                onClick={() => handleSearch()}
                className="px-4 py-2.5 bg-[#0A66C2] hover:bg-[#004182] text-white font-medium rounded-xl transition-all text-[14px] cursor-pointer shadow-md hover:shadow-lg flex items-center gap-2 active:scale-98"
              >
                <span>Search Candidates</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Recent Searches & Saved Searches */}
        <div className="w-full lg:w-[360px] shrink-0 bg-white rounded-2xl shadow-xs border border-slate-200/80 p-3 sticky top-[84px] self-start transition-all z-20">
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

          <div className="space-y-2.5 max-h-[calc(100vh-190px)] overflow-y-auto pr-1">
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
                          handleSearch(item.params);
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
                <div className="py-12 text-center text-slate-400 text-[13px]">
                  <Clock size={28} className="mx-auto mb-2 opacity-40" />
                  <p className="font-medium text-slate-500">No recent searches yet</p>
                  <p className="text-[12px] text-slate-400 mt-1">Run a search to see your history here.</p>
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
                        handleSearch(item.params);
                      }
                    }}
                    className="flex justify-between items-start p-3.5 border border-slate-100 hover:border-blue-200 rounded-xl hover:bg-blue-50/40 cursor-pointer transition-all group shadow-2xs"
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
                <div className="py-12 text-center text-slate-400 text-[13px]">
                  <Bookmark size={28} className="mx-auto mb-2 opacity-40" />
                  <p className="font-medium text-slate-500">No saved presets</p>
                  <p className="text-[12px] text-slate-400 mt-1">Click &quot;Save Search&quot; to bookmark any filter combination.</p>
                </div>
              )
            )}
          </div>
        </div>

      </div>

      {/* Save Search Modal */}
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
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-[13px] text-slate-600">
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
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-[13px] font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSearch}
                className="px-5 py-2 bg-[#0A66C2] text-white rounded-xl text-[13px] font-bold hover:bg-[#004182] transition-colors shadow-sm"
              >
                Save Preset
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CandidateSearch;
