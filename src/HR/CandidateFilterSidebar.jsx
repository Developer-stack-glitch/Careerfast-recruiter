'use client';
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Filter, Search, Sparkles, Info, Plus, Check, X, Loader2, ChevronDown } from 'lucide-react';
import { City, State } from 'country-state-city';

// Pre-indexed Indian cities for 0ms proper location lookups
let indianCitiesCache = null;
const getCachedIndianCities = () => {
  if (!indianCitiesCache) {
    try {
      const states = State.getStatesOfCountry('IN');
      const stateMap = {};
      states.forEach(s => { stateMap[s.isoCode] = s.name; });
      const cities = City.getCitiesOfCountry('IN');
      indianCitiesCache = cities.map(c => {
        const stateName = stateMap[c.stateCode] || '';
        return {
          name: c.name,
          displayName: stateName ? `${c.name}, ${stateName}` : c.name
        };
      });
    } catch (_) {
      indianCitiesCache = [];
    }
  }
  return indianCitiesCache;
};

export const TOP_CITIES = [
  'Ahmedabad',
  'Bengaluru',
  'Chennai',
  'Delhi',
  'Hyderabad',
  'Kolkata',
  'Mumbai',
  'Pune',
  'Noida',
  'Gurgaon',
  'Chandigarh',
  'Jaipur',
  'Kochi',
  'Indore',
  'Coimbatore',
  'United Arab Emirates',
  'Singapore',
  'Remote'
];

export const SUGGESTED_LOCATIONS = [
  { name: 'Bengaluru', count: '60,000+' },
  { name: 'Hyderabad', count: '45,000+' },
  { name: 'Pune', count: '40,000+' },
  { name: 'Chennai', count: '30,000+' },
  { name: 'Delhi', count: '20,000+' },
  { name: 'Mumbai', count: '15,000+' },
  { name: 'Noida', count: '10,000+' },
  { name: 'United Arab Emirates', count: '9,591' },
  { name: 'Singapore', count: '9,187' }
];

export const DEFAULT_FILTER_OPTIONS = {
  locations: [
    'Chennai', 'Bengaluru', 'Hyderabad', 'Mumbai', 'Delhi NCR', 'Pune',
    'Noida', 'Kolkata', 'Remote', 'Gurgaon', 'Ahmedabad', 'Coimbatore',
    'Jaipur', 'Chandigarh', 'Kochi', 'Indore'
  ],
  noticePeriods: [
    'Any', '15 Days or less', '1 Month', '2 Months', '3 Months',
    'More than 3 Months', 'Serving notice period'
  ],
  genders: ['Male', 'Female', 'Other'],
  courses: [
    'B.Tech / B.E.', 'B.Sc', 'BCA', 'B.Com', 'BBA', 'BA',
    'M.Tech / M.E.', 'MBA / PGDM', 'MCA', 'M.Sc', 'M.Com',
    'Doctorate / Ph.D', 'Diploma', 'Any Graduate', 'Any Postgraduate'
  ],
  industries: [
    'IT Services & Consulting', 'Software Product', 'Financial Services',
    'Banking', 'Healthcare & Life Sciences', 'Education / EdTech',
    'Manufacturing', 'Recruitment / Staffing', 'Internet / E-Commerce',
    'Telecom', 'Automotive', 'Media & Entertainment', 'Retail', 'Real Estate'
  ],
  companies: [
    'Tata Consultancy Services (TCS)', 'Infosys', 'Wipro', 'Accenture',
    'Cognizant', 'HCLTech', 'Amazon', 'Microsoft', 'Google', 'IBM',
    'Tech Mahindra', 'Capgemini', 'Deloitte', 'Learnovita',
    'ACTE Technologies', 'Markerz Global'
  ],
  designations: [
    'Software Engineer', 'Frontend Developer', 'Backend Developer',
    'Full Stack Developer', 'Team Lead', 'Engineering Manager',
    'Product Manager', 'QA Engineer', 'DevOps Engineer', 'Data Scientist',
    'UI/UX Designer', 'Business Analyst', 'Technical Lead', 'Solution Architect'
  ],
  smartInsights: [
    'Premium Institutes (IIT/IIM/NIT)', 'Top Tier Companies',
    'High Performer / Star Candidate', 'Recently Promoted',
    'Active in Last 7 Days', 'Verified Phone & Email',
    'Open to Immediate Relocation', 'Multiple Offers in Hand'
  ],
  differentlyAbled: [
    'Locomotor Disability', 'Visual Impairment', 'Hearing Impairment',
    'Speech and Language Disability', 'Intellectual Disability',
    'Mental Illness', 'Multiple Disabilities', 'Any Disability'
  ],
  languages: [
    'English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam',
    'Marathi', 'Bengali', 'Gujarati', 'Punjabi', 'French', 'German',
    'Spanish', 'Japanese'
  ],
  companyHeadcounts: [
    '1-10 employees', '11-50 employees', '51-200 employees',
    '201-500 employees', '501-1,000 employees', '1,001-5,000 employees',
    '5,001-10,000 employees', '10,000+ employees'
  ],
  visaStatuses: [
    'Citizen / Permanent Resident', 'Work Permit / H1B',
    'Student Visa (OPT/CPT)', 'Requires Sponsorship', 'Not Specified'
  ],
  hideProfiles: [
    'Already viewed profiles', 'Already contacted / emailed',
    'Saved to any project / folder', 'Profiles with incomplete resumes',
    'Inactive for > 6 months'
  ],
  showOnly: [
    'Verified Mobile Number', 'Verified Email Address',
    'Resume Available to Download', 'Immediate Joiners',
    'Open to Remote Work', 'Willing to Relocate'
  ],
  jobTypes: [
    'Permanent / Full Time', 'Contract / C2H', 'Freelance / Consultant',
    'Internship', 'Work from Home / Remote', 'Part Time'
  ],
  companyFundings: [
    'Seed / Angel', 'Series A', 'Series B', 'Series C+',
    'Public Listed', 'Bootstrapped / Profitable'
  ]
};

export const COURSE_CATEGORIES = [
  {
    category: 'Diploma',
    count: 36,
    specializations: ['Architecture', 'Hotel Management', 'Other Diploma', 'Mechanical', 'Civil', 'Electrical', 'Electronics', 'Computers', 'Graphic / Web Design', 'Automobile']
  },
  {
    category: 'Aviation',
    count: 4,
    specializations: ['Cabin Crew / Air Hostess', 'Commercial Pilot', 'Aviation Management', 'Ground Operations']
  },
  {
    category: 'Bachelor of Arts (B.A)',
    count: 26,
    specializations: ['English', 'Economics', 'Psychology', 'Political Science', 'Sociology', 'Journalism / Mass Comm', 'History', 'Philosophy']
  },
  {
    category: 'Bachelor of Architecture (B.Arch)',
    count: 1,
    specializations: ['Architecture', 'Landscape Architecture', 'Interior Design']
  },
  {
    category: 'Bachelor of Commerce (B.Com)',
    count: 15,
    specializations: ['Commerce', 'Accounting & Finance', 'Banking & Insurance', 'Financial Markets', 'Taxation', 'E-Commerce']
  },
  {
    category: 'Bachelor of Science (B.Sc)',
    count: 45,
    specializations: ['Computer Science', 'Information Technology', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Nursing', 'Agriculture', 'Bio-Technology']
  },
  {
    category: 'Bachelor of Technology/Engineering (B.Tech/B.E.)',
    count: 78,
    specializations: ['Computer Science', 'Information Technology', 'Electronics/Telecommunication', 'Mechanical', 'Civil', 'Electrical', 'Chemical', 'Biotechnology', 'Automobile']
  },
  {
    category: 'BCA (Bachelor of Computer Applications)',
    count: 32,
    specializations: ['Computer Applications', 'Cloud Computing', 'Data Science', 'Web Development', 'Cyber Security']
  },
  {
    category: 'BBA / BMS',
    count: 22,
    specializations: ['Marketing', 'Finance', 'Human Resources', 'Operations', 'International Business']
  },
  {
    category: 'Bachelor of Hotel Management (BHM)',
    count: 8,
    specializations: ['Hospitality Management', 'Culinary Arts', 'Food & Beverage', 'Front Office Operations']
  },
  {
    category: 'Bachelor of Pharmacy (B.Pharm)',
    count: 12,
    specializations: ['Pharmacy', 'Pharmaceutical Chemistry', 'Pharmacology']
  },
  {
    category: 'Bachelor of Education (B.Ed)',
    count: 14,
    specializations: ['Education', 'Special Education', 'Physical Education']
  },
  {
    category: 'LLB (Law)',
    count: 10,
    specializations: ['Corporate Law', 'Criminal Law', 'Civil Law', 'Cyber Law']
  },
  {
    category: 'Other Graduate',
    count: 18,
    specializations: ['Other Graduate Degree', 'Vocational Studies', 'General Studies']
  }
];

export const TOP_INSTITUTES = [
  'IIT (Indian Institute of Technology)',
  'NIT (National Institute of Technology)',
  'BITS Pilani',
  'Delhi University (DU)',
  'Anna University',
  'Mumbai University',
  'VIT (Vellore Institute of Technology)',
  'SRM Institute of Science and Technology',
  'Manipal Academy of Higher Education',
  'Symbiosis International University',
  'Christ University, Bangalore',
  'Amity University',
  'Jadavpur University',
  'Thapar Institute of Engineering and Technology'
];

// Custom inline dropdown select (replaces native <select>)
const CustomSelect = ({ value, onChange, options, placeholder = 'Select', className = '' }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const selectedLabel = options.find(o => String(o.value) === String(value))?.label || '';
  const filtered = search
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="w-full flex items-center justify-between bg-white border border-slate-300 hover:border-slate-400 pl-3 pr-2 py-[7px] rounded-lg text-[13px] text-slate-600 focus:outline-none focus:border-[#0A66C2] shadow-2xs transition-all cursor-pointer text-left"
      >
        <span className={selectedLabel ? 'text-slate-800' : 'text-slate-400'}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown size={14} className={`text-slate-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          {options.length > 8 && (
            <div className="p-1.5 border-b border-slate-100">
              <input
                type="text"
                autoFocus
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full px-2 py-1 text-[12px] bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-[#0A66C2]"
              />
            </div>
          )}
          <div className="max-h-[180px] overflow-y-auto p-1">
            {filtered.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(String(opt.value));
                  setOpen(false);
                  setSearch('');
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-md text-[12.5px] cursor-pointer transition-colors ${
                  String(value) === String(opt.value)
                    ? 'bg-[#EFF6FF] text-[#0A66C2] font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="text-[12px] text-slate-400 text-center py-2">No results</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const CandidateFilterSidebar = ({
  filters = {},
  filterOptions = {},
  openAccordions = {},
  toggleAccordion = () => { },
  handleToggleArrayFilter = () => { },
  handleSetFilter = () => { },
  handleClearAll = () => { },
  handleAddCustomFilter = () => { },
  appliedFiltersList = [],
  fetchCandidates = () => { },
  locSearch = '',
  setLocSearch = () => { },
  eduSearch = '',
  setEduSearch = () => { },
  indSearch = '',
  setIndSearch = () => { },
  companySearch = '',
  setCompanySearch = () => { },
  desigSearch = '',
  setDesigSearch = () => { },
  langSearch = '',
  setLangSearch = () => { }
}) => {
  // Helper to extract clean string array with fallbacks
  const getSafeList = (key) => {
    const list = filterOptions?.[key];
    if (Array.isArray(list) && list.length > 0) {
      const mapped = list.map(item => {
        if (typeof item === 'object' && item !== null) {
          return (item.category || item.name || item.industry || item.title || item.label || item.value || '').trim();
        }
        return String(item || '').trim();
      }).filter(Boolean);
      if (mapped.length > 0) return mapped;
    }
    return DEFAULT_FILTER_OPTIONS[key] || [];
  };

  const safeLocations = useMemo(() => getSafeList('locations'), [filterOptions?.locations]);
  const safeNoticePeriods = useMemo(() => getSafeList('noticePeriods'), [filterOptions?.noticePeriods]);
  const safeCourses = useMemo(() => getSafeList('courses'), [filterOptions?.courses]);
  const safeIndustries = useMemo(() => getSafeList('industries'), [filterOptions?.industries]);
  const safeCompanies = useMemo(() => getSafeList('companies'), [filterOptions?.companies]);
  const safeDesignations = useMemo(() => getSafeList('designations'), [filterOptions?.designations]);
  const safeSmartInsights = useMemo(() => getSafeList('smartInsights'), [filterOptions?.smartInsights]);
  const safeDifferentlyAbled = useMemo(() => getSafeList('differentlyAbled'), [filterOptions?.differentlyAbled]);
  const safeLanguages = useMemo(() => getSafeList('languages'), [filterOptions?.languages]);
  const safeCompanyHeadcounts = useMemo(() => getSafeList('companyHeadcounts'), [filterOptions?.companyHeadcounts]);
  const safeVisaStatuses = useMemo(() => getSafeList('visaStatuses'), [filterOptions?.visaStatuses]);
  const safeHideProfiles = useMemo(() => getSafeList('hideProfiles'), [filterOptions?.hideProfiles]);
  const safeShowOnly = useMemo(() => getSafeList('showOnly'), [filterOptions?.showOnly]);
  const safeJobTypes = useMemo(() => getSafeList('jobTypes'), [filterOptions?.jobTypes]);
  const safeCompanyFundings = useMemo(() => getSafeList('companyFundings'), [filterOptions?.companyFundings]);

  // Location popover and preferred location states
  const [locModalOpen, setLocModalOpen] = useState(false);
  const [locPopupSearch, setLocPopupSearch] = useState('');
  const [popupPos, setPopupPos] = useState({ top: 120, left: 100, width: 350 });
  const [showPreferredLoc, setShowPreferredLoc] = useState(false);
  const [prefLocInput, setPrefLocInput] = useState('');
  const [showExpMonths, setShowExpMonths] = useState(Boolean(filters.expMonthsMin || filters.expMonthsMax));
  const [showSalaryThousand, setShowSalaryThousand] = useState(Boolean(filters.salaryThousandMin || filters.salaryThousandMax));
  const locInputRef = useRef(null);

  // Education Course Popover & Institute states
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [courseModalSearch, setCourseModalSearch] = useState('');
  const [activeCourseCat, setActiveCourseCat] = useState('Diploma');
  const [coursePopupPos, setCoursePopupPos] = useState({ top: 220, left: 100, width: 440 });
  const courseInputRef = useRef(null);

  const [instDropdownOpen, setInstDropdownOpen] = useState(false);
  const [instSearch, setInstSearch] = useState('');
  const instInputRef = useRef(null);
  const [showDoctorate, setShowDoctorate] = useState(Boolean(filters.doctorateQualification));

  const updateCoursePopupPosition = () => {
    if (courseInputRef.current) {
      const rect = courseInputRef.current.getBoundingClientRect();
      const popupWidth = Math.min(460, window.innerWidth - 32);
      const idealTop = Math.max(16, Math.min(window.innerHeight - 380, rect.top - 20));
      const idealLeft = Math.max(16, Math.min(rect.left, window.innerWidth - popupWidth - 16));
      setCoursePopupPos({
        top: idealTop,
        left: idealLeft,
        width: popupWidth
      });
    }
  };

  useEffect(() => {
    if (courseModalOpen) {
      updateCoursePopupPosition();
      const handleReposition = () => updateCoursePopupPosition();
      window.addEventListener('resize', handleReposition);
      window.addEventListener('scroll', handleReposition, true);
      return () => {
        window.removeEventListener('resize', handleReposition);
        window.removeEventListener('scroll', handleReposition, true);
      };
    }
  }, [courseModalOpen]);

  const handleToggleCourse = (courseName) => {
    const current = Array.isArray(filters.courses) ? filters.courses : [];
    const exists = current.includes(courseName);
    const updated = exists ? current.filter(c => c !== courseName) : [...current, courseName];
    handleSetFilter('courses', updated);
    handleSetFilter('education', updated);
  };

  const handleToggleSelectAllCategory = (cat) => {
    const current = Array.isArray(filters.courses) ? [...filters.courses] : [];
    const specs = cat?.specializations || [];
    const allSelected = specs.length > 0 && specs.every(s => current.includes(s));
    if (allSelected) {
      const updated = current.filter(c => !specs.includes(c));
      handleSetFilter('courses', updated);
      handleSetFilter('education', updated);
    } else {
      const set = new Set([...current, ...specs]);
      const updated = Array.from(set);
      handleSetFilter('courses', updated);
      handleSetFilter('education', updated);
    }
  };

  const filteredCourseCategories = useMemo(() => {
    const q = courseModalSearch.trim().toLowerCase();
    if (!q) return COURSE_CATEGORIES;
    return COURSE_CATEGORIES.map(cat => {
      const catMatch = cat.category.toLowerCase().includes(q);
      const matchingSpecs = cat.specializations.filter(s => s.toLowerCase().includes(q));
      if (catMatch || matchingSpecs.length > 0) {
        return {
          ...cat,
          specializations: catMatch ? cat.specializations : matchingSpecs
        };
      }
      return null;
    }).filter(Boolean);
  }, [courseModalSearch]);

  const currentCategory = useMemo(() => {
    return filteredCourseCategories.find(c => c.category === activeCourseCat) || filteredCourseCategories[0] || COURSE_CATEGORIES[0];
  }, [filteredCourseCategories, activeCourseCat]);

  const hasActiveEducation = Boolean(
    filters.ugQualification ||
    (filters.courses && filters.courses.length > 0) ||
    (filters.education && filters.education.length > 0) ||
    (filters.institutes && filters.institutes.length > 0) ||
    filters.passingYearFrom ||
    filters.passingYearTo ||
    filters.pgQualification ||
    filters.doctorateQualification
  );

  useEffect(() => {
    if (filters.salaryThousandMin || filters.salaryThousandMax) {
      setShowSalaryThousand(true);
    }
  }, [filters.salaryThousandMin, filters.salaryThousandMax]);

  useEffect(() => {
    if (filters.expMonthsMin || filters.expMonthsMax) {
      setShowExpMonths(true);
    }
  }, [filters.expMonthsMin, filters.expMonthsMax]);

  // Close institute dropdown on outside click
  useEffect(() => {
    if (!instDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (instInputRef.current && !instInputRef.current.contains(e.target)) {
        setInstDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [instDropdownOpen]);

  const updatePopupPosition = () => {
    if (locInputRef.current) {
      const rect = locInputRef.current.getBoundingClientRect();
      const popupWidth = Math.min(360, window.innerWidth - 32);
      const idealTop = Math.max(16, Math.min(window.innerHeight - 380, rect.top - 36));
      const idealLeft = Math.max(16, Math.min(rect.left, window.innerWidth - popupWidth - 16));
      setPopupPos({
        top: idealTop,
        left: idealLeft,
        width: popupWidth
      });
    }
  };

  useEffect(() => {
    if (locModalOpen) {
      updatePopupPosition();
      const handleReposition = () => updatePopupPosition();
      window.addEventListener('resize', handleReposition);
      window.addEventListener('scroll', handleReposition, true);
      return () => {
        window.removeEventListener('resize', handleReposition);
        window.removeEventListener('scroll', handleReposition, true);
      };
    }
  }, [locModalOpen]);

  const [apiSuggestions, setApiSuggestions] = useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);

  // Pure curated Top Cities (NO recent search locations stored here)
  const topCities = TOP_CITIES;

  // Search proper locations using Google Places API and country-state-city
  useEffect(() => {
    const query = locPopupSearch.trim();
    if (!query) {
      setApiSuggestions([]);
      setIsSearchingLocation(false);
      return;
    }

    setIsSearchingLocation(true);
    const timer = setTimeout(() => {
      searchLocalProperLocations(query);
    }, 100);

    return () => clearTimeout(timer);
  }, [locPopupSearch]);

  const searchLocalProperLocations = (query) => {
    try {
      const q = query.toLowerCase();
      // First check top cities
      const topMatches = TOP_CITIES.filter(c => c.toLowerCase().includes(q)).map(c => ({
        name: c,
        displayName: c
      }));

      // Check comprehensive country-state-city database
      const allIn = getCachedIndianCities();
      const inMatches = allIn
        .filter(c => c.name.toLowerCase().includes(q) || c.displayName.toLowerCase().includes(q))
        .slice(0, 15);

      const seen = new Set(topMatches.map(m => m.name.toLowerCase()));
      const merged = [...topMatches];
      inMatches.forEach(item => {
        if (!seen.has(item.name.toLowerCase())) {
          seen.add(item.name.toLowerCase());
          merged.push(item);
        }
      });

      // Global check if under 5 matches and query is at least 3 chars
      if (merged.length < 5 && query.length >= 3) {
        try {
          const globalCities = City.getAllCities();
          for (let i = 0; i < globalCities.length && merged.length < 15; i++) {
            const gc = globalCities[i];
            if (gc.name.toLowerCase().startsWith(q) && !seen.has(gc.name.toLowerCase())) {
              seen.add(gc.name.toLowerCase());
              merged.push({
                name: gc.name,
                displayName: `${gc.name}, ${gc.countryCode}`
              });
            }
          }
        } catch (_) {}
      }

      setApiSuggestions(merged);
    } catch (_) {
      setApiSuggestions([]);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  return (
    <div className="w-full lg:w-[285px] shrink-0 bg-white rounded-xl shadow-xs p-4 sticky top-20 max-h-[calc(100vh-90px)] overflow-y-auto hidden lg:block select-none">

      {/* 1. Header: Filters */}
      <div className="flex items-center justify-between pb-3">
        <h2 className="text-[15px] font-bold text-slate-900 flex items-center gap-2 mb-0">
          <Filter size={16} className="text-slate-700" />
          <span>Filters</span>
        </h2>
      </div>

      {/* Applied Filters Tags */}
      {appliedFiltersList.length > 0 && (
        <div className="pb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-semibold text-slate-800">
              {appliedFiltersList.length} Filter{appliedFiltersList.length !== 1 ? 's' : ''} Applied
            </span>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[12px] font-semibold text-[#0A66C2] hover:text-[#004182] cursor-pointer"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {appliedFiltersList.slice(0, 8).map(pill => (
              <span
                key={pill.key}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11.5px] font-medium bg-[#EFF6FF] text-[#0A66C2] border border-[#93C5FD] transition-all hover:bg-blue-100"
              >
                {pill.label}
                <X
                  size={12}
                  onClick={pill.clear}
                  className="text-[#0A66C2] hover:text-rose-500 cursor-pointer shrink-0"
                />
              </span>
            ))}
            {appliedFiltersList.length > 8 && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11.5px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                +{appliedFiltersList.length - 8} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* 2. Find keywords within results */}
      <div className="pb-3 pt-1">
        <label className="block text-[13px] font-medium text-slate-700 mb-2">
          Find keywords within results
        </label>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Enter keywords here"
            value={filters.keywordWithinResults || ''}
            onChange={e => handleSetFilter('keywordWithinResults', e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0A66C2] focus:ring-1 focus:ring-blue-500/20 transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* ACCORDION 1: Location */}
      <div className="border-t border-slate-200/80 my-3">
        <div onClick={() => toggleAccordion('location')} className="w-full flex items-center justify-between pt-3 pb-1 px-0.5 text-left group cursor-pointer">
          <div
            className="flex items-center gap-1.5 text-[14px] font-medium text-slate-800 hover:text-[#0A66C2] cursor-pointer"
          >
            <span>Location</span>
            {filters.location?.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-[17px] h-[17px] px-1 text-[10px] font-bold text-white bg-[#0A66C2] rounded-full">
                {filters.location.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {(filters.location?.length > 0 || filters.preferredLocations?.length > 0) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSetFilter('location', []);
                  handleSetFilter('preferredLocations', []);
                }}
                className="text-[12px] text-[#0A66C2] hover:text-[#004182] font-medium hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
            <div
              className="text-slate-500 font-light text-[17px] leading-none select-none hover:text-[#0A66C2] cursor-pointer"
            >
              {openAccordions.location ? '−' : '+'}
            </div>
          </div>
        </div>

        {openAccordions.location && (
          <div className="pb-3 pt-2">
            {/* Sub-label: Current location */}
            <div className="text-[13px] font-medium text-slate-800 mb-1.5">
              Current location
            </div>

            {/* Input Trigger Box */}
            <div
              ref={locInputRef}
              onClick={() => {
                updatePopupPosition();
                setLocModalOpen(true);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 bg-white border border-slate-300 hover:border-slate-400 rounded-lg cursor-pointer transition-all shadow-2xs group"
            >
              <Search size={15} className="text-slate-400 shrink-0 group-hover:text-slate-600 transition-colors" />
              <span className="text-[13px] text-slate-400 select-none truncate">
                Enter current location
              </span>
            </div>

            {/* Selected Location Chips */}
            {filters.location?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {filters.location.map(loc => (
                  <span
                    key={loc}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] font-medium bg-blue-50 text-[#0A66C2] border border-blue-200 shadow-2xs"
                  >
                    <span>{loc}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleArrayFilter('location', loc);
                      }}
                      className="hover:text-blue-900 cursor-pointer p-0.5"
                      title={`Remove ${loc}`}
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Toggle Switch: Include relocating candidates */}
            <div
              onClick={() => handleSetFilter('includeRelocating', !filters.includeRelocating)}
              className="flex items-center gap-2.5 pt-3 cursor-pointer select-none group"
            >
              <div className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors duration-200 shrink-0 ${
                filters.includeRelocating ? 'bg-[#181d2f] justify-end' : 'bg-slate-300 justify-start'
              }`}>
                <div className="w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center shadow-xs">
                  {filters.includeRelocating && (
                    <Check size={9} className="text-[#181d2f] stroke-[3]" />
                  )}
                </div>
              </div>
              <span className="text-[12.5px] text-slate-700 font-medium group-hover:text-slate-900 transition-colors">
                Include relocating candidates
              </span>
            </div>

            {/* Suggested Section */}
            <div className="text-[13px] font-medium text-slate-800 pt-3.5 pb-1.5">
              Suggested
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_LOCATIONS.map(item => {
                const isSelected = filters.location?.includes(item.name);
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => handleToggleArrayFilter('location', item.name)}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[12px] transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-blue-50 border-[#0A66C2] text-[#0A66C2] font-semibold shadow-2xs'
                        : 'bg-white border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-800 font-normal'
                    }`}
                  >
                    <span className="font-medium">{item.name}</span>
                    <span className={isSelected ? 'text-[#0A66C2]/70 text-[11px]' : 'text-slate-400 text-[11px]'}>
                      ({item.count})
                    </span>
                    {isSelected && <Check size={11} className="ml-0.5 text-[#0A66C2]" />}
                  </button>
                );
              })}
            </div>

            {/* Add different preferred location */}
            <button
              type="button"
              onClick={() => setShowPreferredLoc(p => !p)}
              className="text-[12px] text-slate-500 hover:text-[#0A66C2] underline cursor-pointer pt-3 text-left block transition-colors"
            >
              {showPreferredLoc ? 'Hide preferred location' : 'Add different preferred location'}
            </button>

            {showPreferredLoc && (
              <div className="pt-2 space-y-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 mt-2">
                <div className="text-[11.5px] font-semibold text-slate-700">Preferred Locations</div>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="e.g. Coimbatore, Kochi..."
                    value={prefLocInput}
                    onChange={e => setPrefLocInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (prefLocInput.trim()) {
                          handleAddCustomFilter('preferredLocations', prefLocInput.trim(), setPrefLocInput);
                        }
                      }
                    }}
                    className="flex-1 px-2.5 py-1 text-[12px] bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#0A66C2]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (prefLocInput.trim()) {
                        handleAddCustomFilter('preferredLocations', prefLocInput.trim(), setPrefLocInput);
                      }
                    }}
                    className="px-2.5 py-1 text-[11.5px] font-bold text-white bg-[#0A66C2] rounded-lg hover:bg-[#004182] cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                {filters.preferredLocations?.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {filters.preferredLocations.map(pl => (
                      <span key={pl} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-white text-slate-700 border border-slate-200">
                        {pl}
                        <button
                          type="button"
                          onClick={() => handleToggleArrayFilter('preferredLocations', pl)}
                          className="hover:text-rose-600 cursor-pointer"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ACCORDION 2: Experience (yrs) */}
      <div className="border-t border-slate-200/80 my-3">
        <div onClick={() => toggleAccordion('experience')} className="w-full flex items-center justify-between pt-3 pb-1 px-0.5 text-left group cursor-pointer">
          <div
            className="flex items-center gap-1.5 text-[14px] font-medium text-slate-800 hover:text-[#0A66C2] cursor-pointer"
          >
            <span>Experience (yrs)</span>
          </div>
          <div className="flex items-center gap-3">
            {Boolean(filters.experienceMin || filters.experienceMax || filters.expMonthsMin || filters.expMonthsMax) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSetFilter('experienceMin', '');
                  handleSetFilter('experienceMax', '');
                  handleSetFilter('expMonthsMin', '');
                  handleSetFilter('expMonthsMax', '');
                }}
                className="text-[12px] text-[#0A66C2] hover:text-[#004182] font-medium hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
            <div
              className="text-slate-500 font-light text-[17px] leading-none select-none hover:text-[#0A66C2] cursor-pointer"
            >
              {openAccordions.experience ? '−' : '+'}
            </div>
          </div>
        </div>
        {openAccordions.experience && (
          <div className="pb-3 pt-2">
            {/* Minimum */}
            <div className="text-[13px] font-medium text-slate-800 mb-1.5">
              Minimum
            </div>

            {!showExpMonths ? (
              <div className="mb-3">
                <CustomSelect
                  value={filters.experienceMin ?? ''}
                  onChange={v => handleSetFilter('experienceMin', v)}
                  placeholder="Years"
                  options={[{ value: '', label: 'Years' }, ...[...Array(31)].map((_, i) => ({ value: String(i), label: `${i} ${i === 1 ? 'Year' : 'Years'}` }))]}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-3">
                <CustomSelect
                  value={filters.experienceMin ?? ''}
                  onChange={v => handleSetFilter('experienceMin', v)}
                  placeholder="Years"
                  className="w-1/2"
                  options={[{ value: '', label: 'Years' }, ...[...Array(31)].map((_, i) => ({ value: String(i), label: `${i} ${i === 1 ? 'Year' : 'Years'}` }))]}
                />
                <CustomSelect
                  value={filters.expMonthsMin ?? ''}
                  onChange={v => handleSetFilter('expMonthsMin', v)}
                  placeholder="Months"
                  className="w-1/2"
                  options={[{ value: '', label: 'Months' }, ...[...Array(12)].map((_, i) => ({ value: String(i), label: `${i} ${i === 1 ? 'Month' : 'Months'}` }))]}
                />
              </div>
            )}

            {/* Maximum */}
            <div className="text-[13px] font-medium text-slate-800 mb-1.5">
              Maximum
            </div>

            {!showExpMonths ? (
              <div className="mb-3">
                <CustomSelect
                  value={filters.experienceMax ?? ''}
                  onChange={v => handleSetFilter('experienceMax', v)}
                  placeholder="Years"
                  options={[{ value: '', label: 'Years' }, ...[...Array(31)].map((_, i) => ({ value: String(i), label: `${i} ${i === 1 ? 'Year' : 'Years'}` }))]}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-3">
                <CustomSelect
                  value={filters.experienceMax ?? ''}
                  onChange={v => handleSetFilter('experienceMax', v)}
                  placeholder="Years"
                  className="w-1/2"
                  options={[{ value: '', label: 'Years' }, ...[...Array(31)].map((_, i) => ({ value: String(i), label: `${i} ${i === 1 ? 'Year' : 'Years'}` }))]}
                />
                <CustomSelect
                  value={filters.expMonthsMax ?? ''}
                  onChange={v => handleSetFilter('expMonthsMax', v)}
                  placeholder="Months"
                  className="w-1/2"
                  options={[{ value: '', label: 'Months' }, ...[...Array(12)].map((_, i) => ({ value: String(i), label: `${i} ${i === 1 ? 'Month' : 'Months'}` }))]}
                />
              </div>
            )}

            {/* Add / Hide Months Toggle Link */}
            <button
              type="button"
              onClick={() => setShowExpMonths(prev => !prev)}
              className="text-[12px] text-slate-800 hover:text-[#0A66C2] underline cursor-pointer pt-1 block text-left font-medium transition-colors"
            >
              {showExpMonths ? 'Hide Months' : 'Add Months'}
            </button>
          </div>
        )}
      </div>

      {/* ACCORDION 3: Notice period */}
      <div className="border-t border-slate-200/80 my-3">
        <div onClick={() => toggleAccordion('noticePeriod')} className="w-full flex items-center justify-between pt-3 pb-1 px-0.5 text-left group cursor-pointer">
          <div
            className="flex items-center gap-1.5 text-[14px] font-medium text-slate-800 hover:text-[#0A66C2] cursor-pointer"
          >
            <span>Notice period</span>
            {filters.noticePeriod?.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-[17px] h-[17px] px-1 text-[10px] font-bold text-white bg-[#0A66C2] rounded-full">
                {filters.noticePeriod.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {filters.noticePeriod?.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSetFilter('noticePeriod', []);
                }}
                className="text-[12px] text-[#0A66C2] hover:text-[#004182] font-medium hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
            <div
              className="text-slate-500 font-light text-[17px] leading-none select-none hover:text-[#0A66C2] cursor-pointer"
            >
              {openAccordions.noticePeriod ? '−' : '+'}
            </div>
          </div>
        </div>
        {openAccordions.noticePeriod && (
          <div className="pb-3 pt-1 space-y-1">
            {safeNoticePeriods.map(np => {
              const checked = filters.noticePeriod?.includes(np);
              return (
                <label key={np} className="flex items-center gap-2 text-[12.5px] text-slate-700 hover:text-slate-900 cursor-pointer select-none py-0.5">
                  <input
                    type="checkbox"
                    checked={!!checked}
                    onChange={() => handleToggleArrayFilter('noticePeriod', np)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-[#0A66C2] accent-[#0A66C2] focus:ring-[#0A66C2] cursor-pointer"
                  />
                  <span className={checked ? 'font-semibold text-[#0A66C2]' : ''}>{np}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* ACCORDION 4: Annual Salary */}
      <div className="border-t border-slate-200/80 my-3">
        <div onClick={() => toggleAccordion('salary')} className="w-full flex items-center justify-between pt-3 pb-1 px-0.5 text-left group cursor-pointer">
          <div
            className="flex items-center gap-1.5 text-[14px] font-medium text-slate-800 hover:text-[#0A66C2] cursor-pointer"
          >
            <span>Annual Salary</span>
          </div>
          <div className="flex items-center gap-3">
            {Boolean(filters.salaryMin || filters.salaryMax || filters.salaryThousandMin || filters.salaryThousandMax) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSetFilter('salaryMin', '');
                  handleSetFilter('salaryMax', '');
                  handleSetFilter('salaryThousandMin', '');
                  handleSetFilter('salaryThousandMax', '');
                }}
                className="text-[12px] text-[#0A66C2] hover:text-[#004182] font-medium hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
            <div
              className="text-slate-500 font-light text-[17px] leading-none select-none hover:text-[#0A66C2] cursor-pointer"
            >
              {openAccordions.salary ? '−' : '+'}
            </div>
          </div>
        </div>
        {openAccordions.salary && (
          <div className="pb-3 pt-2">
            {/* Minimum */}
            <div className="text-[13px] font-medium text-slate-800 mb-1.5">
              Minimum
            </div>

            {!showSalaryThousand ? (
              <div className="mb-3">
                <CustomSelect
                  value={filters.salaryMin ?? ''}
                  onChange={v => handleSetFilter('salaryMin', v)}
                  placeholder="Lacs"
                  options={[{ value: '', label: 'Lacs' }, ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 24, 26, 28, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100].map(val => ({ value: String(val), label: `${val} ${val === 1 ? 'Lac' : 'Lacs'}` }))]}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-3">
                <CustomSelect
                  value={filters.salaryMin ?? ''}
                  onChange={v => handleSetFilter('salaryMin', v)}
                  placeholder="Lacs"
                  className="w-1/2"
                  options={[{ value: '', label: 'Lacs' }, ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 24, 26, 28, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100].map(val => ({ value: String(val), label: `${val} ${val === 1 ? 'Lac' : 'Lacs'}` }))]}
                />
                <CustomSelect
                  value={filters.salaryThousandMin ?? ''}
                  onChange={v => handleSetFilter('salaryThousandMin', v)}
                  placeholder="Thousand"
                  className="w-1/2"
                  options={[{ value: '', label: 'Thousand' }, ...[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95].map(val => ({ value: String(val), label: `${val} Thousand` }))]}
                />
              </div>
            )}

            {/* Maximum */}
            <div className="text-[13px] font-medium text-slate-800 mb-1.5">
              Maximum
            </div>

            {!showSalaryThousand ? (
              <div className="mb-3">
                <CustomSelect
                  value={filters.salaryMax ?? ''}
                  onChange={v => handleSetFilter('salaryMax', v)}
                  placeholder="Lacs"
                  options={[{ value: '', label: 'Lacs' }, ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 24, 26, 28, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100].map(val => ({ value: String(val), label: `${val} ${val === 1 ? 'Lac' : 'Lacs'}` }))]}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-3">
                <CustomSelect
                  value={filters.salaryMax ?? ''}
                  onChange={v => handleSetFilter('salaryMax', v)}
                  placeholder="Lacs"
                  className="w-1/2"
                  options={[{ value: '', label: 'Lacs' }, ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 24, 26, 28, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100].map(val => ({ value: String(val), label: `${val} ${val === 1 ? 'Lac' : 'Lacs'}` }))]}
                />
                <CustomSelect
                  value={filters.salaryThousandMax ?? ''}
                  onChange={v => handleSetFilter('salaryThousandMax', v)}
                  placeholder="Thousand"
                  className="w-1/2"
                  options={[{ value: '', label: 'Thousand' }, ...[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95].map(val => ({ value: String(val), label: `${val} Thousand` }))]}
                />
              </div>
            )}

            {/* Add Thousand Link (shown when single, hidden when split like screenshot) */}
            {!showSalaryThousand ? (
              <button
                type="button"
                onClick={() => setShowSalaryThousand(true)}
                className="text-[12px] text-slate-800 hover:text-[#0A66C2] underline cursor-pointer pt-0.5 block text-left font-medium transition-colors"
              >
                Add Thousand
              </button>
            ) : null}

            {/* Toggle Switch: Include profiles who have not mentioned current salary */}
            <div
              onClick={() => handleSetFilter('salaryNotMentioned', filters.salaryNotMentioned === false ? true : false)}
              className="flex items-start gap-2.5 pt-3.5 cursor-pointer select-none group"
            >
              <div className={`w-8 h-[18px] flex items-center rounded-full p-0.5 transition-colors duration-200 shrink-0 mt-0.5 ${
                filters.salaryNotMentioned !== false ? 'bg-[#181d2f] justify-end' : 'bg-slate-300 justify-start'
              }`}>
                <div className="w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center shadow-xs">
                  {filters.salaryNotMentioned !== false && (
                    <Check size={9} className="text-[#181d2f] stroke-[3]" />
                  )}
                </div>
              </div>
              <span className="text-[12px] text-slate-700 font-medium group-hover:text-slate-900 transition-colors leading-snug">
                Include profiles who have not mentioned current salary
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ACCORDION 5: Gender */}
      <div className="border-t border-slate-200/80 my-3">
        <div onClick={() => toggleAccordion('gender')} className="w-full flex items-center justify-between pt-3 pb-1 px-0.5 text-left group cursor-pointer">
          <div
            className="flex items-center gap-1.5 text-[14px] font-medium text-slate-800 hover:text-[#0A66C2] cursor-pointer"
          >
            <span>Gender</span>
            {filters.gender?.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-[17px] h-[17px] px-1 text-[10px] font-bold text-white bg-[#0A66C2] rounded-full">
                {filters.gender.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {filters.gender?.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSetFilter('gender', []);
                }}
                className="text-[12px] text-[#0A66C2] hover:text-[#004182] font-medium hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
            <div
              className="text-slate-500 font-light text-[17px] leading-none select-none hover:text-[#0A66C2] cursor-pointer"
            >
              {openAccordions.gender ? '−' : '+'}
            </div>
          </div>
        </div>
        {openAccordions.gender && (
          <div className="pb-3 pt-1 space-y-1">
            {['Male', 'Female', 'Other'].map(g => {
              const checked = filters.gender?.includes(g);
              return (
                <label key={g} className="flex items-center gap-2 text-[12.5px] text-slate-700 hover:text-slate-900 cursor-pointer select-none py-0.5">
                  <input
                    type="checkbox"
                    checked={!!checked}
                    onChange={() => handleToggleArrayFilter('gender', g)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-[#0A66C2] accent-[#0A66C2] focus:ring-[#0A66C2] cursor-pointer"
                  />
                  <span className={checked ? 'font-semibold text-[#0A66C2]' : ''}>{g}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* ACCORDION 6: Education */}
      <div className="border-t border-slate-200/80 my-3">
        <div onClick={() => toggleAccordion('education')} className="w-full flex items-center justify-between pt-3 pb-1 px-0.5 text-left group cursor-pointer">
          <div
            className="flex items-center gap-1.5 text-[14px] font-medium text-slate-800 hover:text-[#0A66C2] cursor-pointer"
          >
            <span>Education</span>
          </div>
          <div className="flex items-center gap-3">
            {hasActiveEducation && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSetFilter('ugQualification', '');
                  handleSetFilter('courses', []);
                  handleSetFilter('education', []);
                  handleSetFilter('institutes', []);
                  handleSetFilter('passingYearFrom', '');
                  handleSetFilter('passingYearTo', '');
                  handleSetFilter('pgQualification', '');
                  handleSetFilter('doctorateQualification', '');
                }}
                className="text-[12px] text-[#0A66C2] hover:text-[#004182] font-medium hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
            <div
              className="text-slate-500 font-light text-[17px] leading-none select-none hover:text-[#0A66C2] cursor-pointer"
            >
              {openAccordions.education ? '−' : '+'}
            </div>
          </div>
        </div>

        {openAccordions.education && (
          <div className="pb-3 pt-2">
            {/* Under graduation qualification */}
            <div className="text-[13px] font-medium text-slate-800 mb-2">
              Under graduation qualification
            </div>

            <div className="flex items-center gap-2 flex-wrap mb-2">
              {['Any UG', 'Specific UG', 'No UG'].map(ug => {
                const isSelected = filters.ugQualification === ug;
                return (
                  <button
                    key={ug}
                    type="button"
                    onClick={() => handleSetFilter('ugQualification', isSelected ? '' : ug)}
                    className={`px-3 py-1 text-[12px] rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'font-semibold text-[#004182] bg-[#EFF6FF] border border-[#93C5FD]'
                        : 'font-medium text-slate-700 bg-white border border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <span>{ug}</span>
                    {isSelected && (
                      <X
                        size={11}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetFilter('ugQualification', '');
                        }}
                        className="text-[#004182] hover:text-rose-600 cursor-pointer"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Note when "No UG" is selected (Screenshot 3) */}
            {(filters.ugQualification === 'No UG') ? (
              <p className="text-[12px] text-slate-500 mt-2.5 leading-normal">
                Candidates whose highest education qualification is 10th, 12th only
              </p>
            ) : (
              <>
                {/* Course Input */}
                <div className="mt-3">
                  <div className="text-[13px] font-medium text-slate-800 mb-1.5">
                    Course
                  </div>
                  <div
                    ref={courseInputRef}
                    onClick={() => setCourseModalOpen(true)}
                    className="relative cursor-pointer group"
                  >
                    <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-slate-600" />
                    <input
                      type="text"
                      readOnly
                      placeholder="Select Courses"
                      value={
                        (filters.courses && filters.courses.length > 0)
                          ? `${filters.courses.length} course${filters.courses.length === 1 ? '' : 's'} selected`
                          : ''
                      }
                      className="w-full bg-white border border-slate-300 hover:border-slate-400 pl-8 pr-8 py-2 rounded-lg text-[13px] text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#0A66C2] shadow-2xs transition-all cursor-pointer truncate"
                    />
                    {(filters.courses && filters.courses.length > 0) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetFilter('courses', []);
                          handleSetFilter('education', []);
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                        title="Clear courses"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  {/* Selected course tags preview */}
                  {(filters.courses && filters.courses.length > 0) && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {filters.courses.slice(0, 3).map(c => (
                        <span key={c} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#EFF6FF] text-[#004182] border border-[#93C5FD]">
                          <span className="truncate max-w-[130px]">{c}</span>
                          <button
                            type="button"
                            onClick={() => handleToggleCourse(c)}
                            className="hover:text-rose-600 cursor-pointer"
                          >
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                      {filters.courses.length > 3 && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10.5px] font-medium bg-slate-100 text-slate-600">
                          +{filters.courses.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Institute Input */}
                <div className="mt-3 relative" ref={instInputRef}>
                  <div className="text-[13px] font-medium text-slate-800 mb-1.5">
                    Institute
                  </div>
                  <div className="relative">
                    <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Select Institutes"
                      value={instSearch}
                      onChange={e => {
                        setInstSearch(e.target.value);
                        setInstDropdownOpen(true);
                      }}
                      onFocus={() => setInstDropdownOpen(true)}
                      className="w-full bg-white border border-slate-300 hover:border-slate-400 pl-8 pr-3 py-2 rounded-lg text-[13px] text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#0A66C2] shadow-2xs transition-all"
                    />
                  </div>

                  {/* Institute Suggestions Dropdown */}
                  {instDropdownOpen && (
                    <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto p-1 text-[12.5px]">
                      {TOP_INSTITUTES
                        .filter(inst => inst.toLowerCase().includes(instSearch.toLowerCase()))
                        .map(inst => {
                          const isChecked = (filters.institutes || []).includes(inst);
                          return (
                            <div
                              key={inst}
                              onClick={() => {
                                const current = Array.isArray(filters.institutes) ? filters.institutes : [];
                                const updated = isChecked ? current.filter(i => i !== inst) : [...current, inst];
                                handleSetFilter('institutes', updated);
                                setInstSearch('');
                                setInstDropdownOpen(false);
                              }}
                              className={`px-3 py-1.5 rounded-md cursor-pointer flex items-center justify-between ${
                                isChecked ? 'bg-[#EFF6FF] text-[#004182] font-semibold' : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <span>{inst}</span>
                              {isChecked && <Check size={13} className="text-[#004182]" />}
                            </div>
                          );
                        })}
                    </div>
                  )}

                  {/* Selected Institutes badges */}
                  {(filters.institutes && filters.institutes.length > 0) && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {filters.institutes.map(inst => (
                        <span key={inst} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#EFF6FF] text-[#004182] border border-[#93C5FD]">
                          <span className="truncate max-w-[140px]">{inst}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = filters.institutes.filter(i => i !== inst);
                              handleSetFilter('institutes', updated);
                            }}
                            className="hover:text-rose-600 cursor-pointer"
                          >
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Passing Year */}
                <div className="mt-3">
                  <div className="text-[13px] font-medium text-slate-800 mb-1.5">
                    Passing Year
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <CustomSelect
                      value={filters.passingYearFrom || ''}
                      onChange={v => handleSetFilter('passingYearFrom', v)}
                      placeholder="From"
                      className="w-1/2"
                      options={[{ value: '', label: 'From' }, ...Array.from({ length: 45 }, (_, i) => ({ value: String(2028 - i), label: String(2028 - i) }))]}
                    />
                    <CustomSelect
                      value={filters.passingYearTo || ''}
                      onChange={v => handleSetFilter('passingYearTo', v)}
                      placeholder="To"
                      className="w-1/2"
                      options={[{ value: '', label: 'To' }, ...Array.from({ length: 45 }, (_, i) => ({ value: String(2028 - i), label: String(2028 - i) }))]}
                    />
                  </div>
                </div>

                {/* Post graduation qualification */}
                <div className="mt-4">
                  <div className="text-[13px] font-medium text-slate-800 mb-2">
                    Post graduation qualification
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    {['Any PG', 'Specific PG', 'No PG'].map(pg => {
                      const isSelected = filters.pgQualification === pg;
                      return (
                        <button
                          key={pg}
                          type="button"
                          onClick={() => handleSetFilter('pgQualification', isSelected ? '' : pg)}
                          className={`px-3 py-1 text-[12px] rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'font-semibold text-[#004182] bg-[#EFF6FF] border border-[#93C5FD]'
                              : 'font-medium text-slate-700 bg-white border border-slate-300 hover:border-slate-400'
                          }`}
                        >
                          <span>{pg}</span>
                          {isSelected && (
                            <X
                              size={11}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetFilter('pgQualification', '');
                              }}
                              className="text-[#004182] hover:text-rose-600 cursor-pointer"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* + Add Doctorate qualification */}
                <div className="pt-1">
                  {!showDoctorate ? (
                    <button
                      type="button"
                      onClick={() => setShowDoctorate(true)}
                      className="text-[12px] text-slate-800 hover:text-[#0A66C2] underline cursor-pointer pt-1 block text-left font-medium transition-colors"
                    >
                      + Add Doctorate qualification
                    </button>
                  ) : (
                    <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[12px] font-medium text-slate-700">Doctorate qualification</span>
                        <button
                          type="button"
                          onClick={() => {
                            setShowDoctorate(false);
                            handleSetFilter('doctorateQualification', '');
                          }}
                          className="text-[11px] text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          Hide
                        </button>
                      </div>
                      <div className="flex gap-2">
                        {['PhD / Doctorate', 'Any Doctorate', 'No Doctorate'].map(doc => {
                          const isSelected = filters.doctorateQualification === doc;
                          return (
                            <button
                              key={doc}
                              type="button"
                              onClick={() => handleSetFilter('doctorateQualification', isSelected ? '' : doc)}
                              className={`px-2 py-0.5 text-[11px] rounded-full transition-all cursor-pointer ${
                                isSelected
                                  ? 'font-semibold text-[#004182] bg-[#EFF6FF] border border-[#93C5FD]'
                                  : 'font-medium text-slate-700 bg-white border border-slate-300'
                              }`}
                            >
                              {doc}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ACCORDION 7: Industry */}
      <div className="border-t border-slate-200/80 my-3">
        <div onClick={() => toggleAccordion('industry')} className="w-full flex items-center justify-between pt-3 pb-1 px-0.5 text-left group cursor-pointer">
          <div
            className="flex items-center gap-1.5 text-[14px] font-medium text-slate-800 hover:text-[#0A66C2] cursor-pointer"
          >
            <span>Industry</span>
            {filters.industry?.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-[17px] h-[17px] px-1 text-[10px] font-bold text-white bg-[#0A66C2] rounded-full">
                {filters.industry.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {filters.industry?.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSetFilter('industry', []);
                }}
                className="text-[12px] text-[#0A66C2] hover:text-[#004182] font-medium hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
            <div
              className="text-slate-500 font-light text-[17px] leading-none select-none hover:text-[#0A66C2] cursor-pointer"
            >
              {openAccordions.industry ? '−' : '+'}
            </div>
          </div>
        </div>
        {openAccordions.industry && (
          <div className="pb-3 pt-1 space-y-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search industry..."
                value={indSearch}
                onChange={e => setIndSearch(e.target.value)}
                className="w-full pl-8 pr-2 py-1 text-[12px] bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-[#0A66C2] focus:bg-white"
              />
            </div>
            <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
              {safeIndustries
                .filter(indName => indName.toLowerCase().includes((indSearch || '').toLowerCase()))
                .map(indName => {
                  const checked = filters.industry?.includes(indName);
                  return (
                    <label key={indName} className="flex items-center gap-2 text-[12.5px] text-slate-700 hover:text-slate-900 cursor-pointer select-none py-0.5">
                      <input
                        type="checkbox"
                        checked={!!checked}
                        onChange={() => handleToggleArrayFilter('industry', indName)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-[#0A66C2] accent-[#0A66C2] focus:ring-[#0A66C2] cursor-pointer"
                      />
                      <span className={checked ? 'font-semibold text-[#0A66C2]' : ''}>{indName}</span>
                    </label>
                  );
                })}
            </div>
            {indSearch && !safeIndustries.some(i => i.toLowerCase() === indSearch.toLowerCase()) && (
              <button
                type="button"
                onClick={() => handleAddCustomFilter('industry', indSearch, setIndSearch)}
                className="w-full text-left text-[11.5px] text-[#0A66C2] font-semibold hover:underline pt-1 flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} /> Add "{indSearch}"
              </button>
            )}
          </div>
        )}
      </div>

      {/* ACCORDION 8: Company */}
      <div className="border-t border-slate-200/80 my-3">
        <div onClick={() => toggleAccordion('company')} className="w-full flex items-center justify-between pt-3 pb-1 px-0.5 text-left group cursor-pointer">
          <div
            className="flex items-center gap-1.5 text-[14px] font-medium text-slate-800 hover:text-[#0A66C2] cursor-pointer"
          >
            <span>Company</span>
            {filters.company?.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-[17px] h-[17px] px-1 text-[10px] font-bold text-white bg-[#0A66C2] rounded-full">
                {filters.company.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {filters.company?.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSetFilter('company', []);
                }}
                className="text-[12px] text-[#0A66C2] hover:text-[#004182] font-medium hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
            <div
              className="text-slate-500 font-light text-[17px] leading-none select-none hover:text-[#0A66C2] cursor-pointer"
            >
              {openAccordions.company ? '−' : '+'}
            </div>
          </div>
        </div>
        {openAccordions.company && (
          <div className="pb-3 pt-1 space-y-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search company..."
                value={companySearch}
                onChange={e => setCompanySearch(e.target.value)}
                className="w-full pl-8 pr-2 py-1 text-[12px] bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-[#0A66C2] focus:bg-white"
              />
            </div>
            <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
              {safeCompanies
                .filter(c => c.toLowerCase().includes((companySearch || '').toLowerCase()))
                .map(comp => {
                  const checked = filters.company?.includes(comp);
                  return (
                    <label key={comp} className="flex items-center gap-2 text-[12.5px] text-slate-700 hover:text-slate-900 cursor-pointer select-none py-0.5">
                      <input
                        type="checkbox"
                        checked={!!checked}
                        onChange={() => handleToggleArrayFilter('company', comp)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-[#0A66C2] accent-[#0A66C2] focus:ring-[#0A66C2] cursor-pointer"
                      />
                      <span className={checked ? 'font-semibold text-[#0A66C2]' : ''}>{comp}</span>
                    </label>
                  );
                })}
            </div>
            {companySearch && !safeCompanies.some(c => c.toLowerCase() === companySearch.toLowerCase()) && (
              <button
                type="button"
                onClick={() => handleAddCustomFilter('company', companySearch, setCompanySearch)}
                className="w-full text-left text-[11.5px] text-[#0A66C2] font-semibold hover:underline pt-1 flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} /> Add "{companySearch}"
              </button>
            )}
          </div>
        )}
      </div>

      {/* ACCORDION 9: Designation */}
      <div className="border-t border-slate-200/80 my-3">
        <div onClick={() => toggleAccordion('designation')} className="w-full flex items-center justify-between pt-3 pb-1 px-0.5 text-left group cursor-pointer">
          <div
            className="flex items-center gap-1.5 text-[14px] font-medium text-slate-800 hover:text-[#0A66C2] cursor-pointer"
          >
            <span>Designation</span>
            {filters.designation?.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-[17px] h-[17px] px-1 text-[10px] font-bold text-white bg-[#0A66C2] rounded-full">
                {filters.designation.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {filters.designation?.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSetFilter('designation', []);
                }}
                className="text-[12px] text-[#0A66C2] hover:text-[#004182] font-medium hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
            <div
              className="text-slate-500 font-light text-[17px] leading-none select-none hover:text-[#0A66C2] cursor-pointer"
            >
              {openAccordions.designation ? '−' : '+'}
            </div>
          </div>
        </div>
        {openAccordions.designation && (
          <div className="pb-3 pt-1 space-y-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search designation..."
                value={desigSearch}
                onChange={e => setDesigSearch(e.target.value)}
                className="w-full pl-8 pr-2 py-1 text-[12px] bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-[#0A66C2] focus:bg-white"
              />
            </div>
            <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
              {safeDesignations
                .filter(d => d.toLowerCase().includes((desigSearch || '').toLowerCase()))
                .map(desig => {
                  const checked = filters.designation?.includes(desig);
                  return (
                    <label key={desig} className="flex items-center gap-2 text-[12.5px] text-slate-700 hover:text-slate-900 cursor-pointer select-none py-0.5">
                      <input
                        type="checkbox"
                        checked={!!checked}
                        onChange={() => handleToggleArrayFilter('designation', desig)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-[#0A66C2] accent-[#0A66C2] focus:ring-[#0A66C2] cursor-pointer"
                      />
                      <span className={checked ? 'font-semibold text-[#0A66C2]' : ''}>{desig}</span>
                    </label>
                  );
                })}
            </div>
            {desigSearch && !safeDesignations.some(d => d.toLowerCase() === desigSearch.toLowerCase()) && (
              <button
                type="button"
                onClick={() => handleAddCustomFilter('designation', desigSearch, setDesigSearch)}
                className="w-full text-left text-[11.5px] text-[#0A66C2] font-semibold hover:underline pt-1 flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} /> Add "{desigSearch}"
              </button>
            )}
          </div>
        )}
      </div>


      {/* ACCORDION 12: Language */}
      <div className="border-t border-slate-200/80 my-3">
        <div onClick={() => toggleAccordion('languages')} className="w-full flex items-center justify-between pt-3 pb-1 px-0.5 text-left group cursor-pointer">
          <div
            className="flex items-center gap-1.5 text-[14px] font-medium text-slate-800 hover:text-[#0A66C2] cursor-pointer"
          >
            <span>Language</span>
            {filters.languages?.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-[17px] h-[17px] px-1 text-[10px] font-bold text-white bg-[#0A66C2] rounded-full">
                {filters.languages.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {filters.languages?.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSetFilter('languages', []);
                }}
                className="text-[12px] text-[#0A66C2] hover:text-[#004182] font-medium hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
            <div
              className="text-slate-500 font-light text-[17px] leading-none select-none hover:text-[#0A66C2] cursor-pointer"
            >
              {openAccordions.languages ? '−' : '+'}
            </div>
          </div>
        </div>
        {openAccordions.languages && (
          <div className="pb-3 pt-1 space-y-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search language..."
                value={langSearch}
                onChange={e => setLangSearch(e.target.value)}
                className="w-full pl-8 pr-2 py-1 text-[12px] bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-[#0A66C2] focus:bg-white"
              />
            </div>
            <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
              {safeLanguages
                .filter(lang => lang.toLowerCase().includes((langSearch || '').toLowerCase()))
                .map(lang => {
                  const checked = filters.languages?.includes(lang);
                  return (
                    <label key={lang} className="flex items-center gap-2 text-[12.5px] text-slate-700 hover:text-slate-900 cursor-pointer select-none py-0.5">
                      <input
                        type="checkbox"
                        checked={!!checked}
                        onChange={() => handleToggleArrayFilter('languages', lang)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-[#0A66C2] accent-[#0A66C2] focus:ring-[#0A66C2] cursor-pointer"
                      />
                      <span className={checked ? 'font-semibold text-[#0A66C2]' : ''}>{lang}</span>
                    </label>
                  );
                })}
            </div>
            {langSearch && !safeLanguages.some(l => l.toLowerCase() === langSearch.toLowerCase()) && (
              <button
                type="button"
                onClick={() => handleAddCustomFilter('languages', langSearch, setLangSearch)}
                className="w-full text-left text-[11.5px] text-[#0A66C2] font-semibold hover:underline pt-1 flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} /> Add "{langSearch}"
              </button>
            )}
          </div>
        )}
      </div>

      {/* ACCORDION 13: Company headcount */}
      <div className="border-t border-slate-200/80 my-3">
        <div onClick={() => toggleAccordion('companyHeadcount')} className="w-full flex items-center justify-between pt-3 pb-1 px-0.5 text-left group cursor-pointer">
          <div
            className="flex items-center gap-1.5 text-[14px] font-medium text-slate-800 hover:text-[#0A66C2] cursor-pointer"
          >
            <span>Company headcount</span>
            {filters.companyHeadcount?.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-[17px] h-[17px] px-1 text-[10px] font-bold text-white bg-[#0A66C2] rounded-full">
                {filters.companyHeadcount.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {filters.companyHeadcount?.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSetFilter('companyHeadcount', []);
                }}
                className="text-[12px] text-[#0A66C2] hover:text-[#004182] font-medium hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
            <div
              className="text-slate-500 font-light text-[17px] leading-none select-none hover:text-[#0A66C2] cursor-pointer"
            >
              {openAccordions.companyHeadcount ? '−' : '+'}
            </div>
          </div>
        </div>
        {openAccordions.companyHeadcount && (
          <div className="pb-3 pt-1 space-y-1">
            {safeCompanyHeadcounts.map(ch => {
              const checked = filters.companyHeadcount?.includes(ch);
              return (
                <label key={ch} className="flex items-center gap-2 text-[12.5px] text-slate-700 hover:text-slate-900 cursor-pointer select-none py-0.5">
                  <input
                    type="checkbox"
                    checked={!!checked}
                    onChange={() => handleToggleArrayFilter('companyHeadcount', ch)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-[#0A66C2] accent-[#0A66C2] focus:ring-[#0A66C2] cursor-pointer"
                  />
                  <span className={checked ? 'font-semibold text-[#0A66C2]' : ''}>{ch}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* ACCORDION 14: Visa status */}
      <div className="border-t border-slate-200/80 my-3">
        <div onClick={() => toggleAccordion('visaStatus')} className="w-full flex items-center justify-between pt-3 pb-1 px-0.5 text-left group cursor-pointer">
          <div
            className="flex items-center gap-1.5 text-[14px] font-medium text-slate-800 hover:text-[#0A66C2] cursor-pointer"
          >
            <span>Visa status</span>
            {filters.visaStatus?.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-[17px] h-[17px] px-1 text-[10px] font-bold text-white bg-[#0A66C2] rounded-full">
                {filters.visaStatus.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {filters.visaStatus?.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSetFilter('visaStatus', []);
                }}
                className="text-[12px] text-[#0A66C2] hover:text-[#004182] font-medium hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
            <div
              className="text-slate-500 font-light text-[17px] leading-none select-none hover:text-[#0A66C2] cursor-pointer"
            >
              {openAccordions.visaStatus ? '−' : '+'}
            </div>
          </div>
        </div>
        {openAccordions.visaStatus && (
          <div className="pb-3 pt-1 space-y-1">
            {safeVisaStatuses.map(vs => {
              const checked = filters.visaStatus?.includes(vs);
              return (
                <label key={vs} className="flex items-center gap-2 text-[12.5px] text-slate-700 hover:text-slate-900 cursor-pointer select-none py-0.5">
                  <input
                    type="checkbox"
                    checked={!!checked}
                    onChange={() => handleToggleArrayFilter('visaStatus', vs)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-[#0A66C2] accent-[#0A66C2] focus:ring-[#0A66C2] cursor-pointer"
                  />
                  <span className={checked ? 'font-semibold text-[#0A66C2]' : ''}>{vs}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* ACCORDION 15: Hide profiles that are */}
      <div className="border-t border-slate-200/80 my-3">
        <div onClick={() => toggleAccordion('hideProfiles')} className="w-full flex items-center justify-between pt-3 pb-1 px-0.5 text-left group cursor-pointer">
          <div
            className="flex items-center gap-1.5 text-[14px] font-medium text-slate-800 hover:text-[#0A66C2] cursor-pointer"
          >
            <span>Hide profiles that are</span>
            {filters.hideProfiles?.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-[17px] h-[17px] px-1 text-[10px] font-bold text-white bg-[#0A66C2] rounded-full">
                {filters.hideProfiles.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {filters.hideProfiles?.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSetFilter('hideProfiles', []);
                }}
                className="text-[12px] text-[#0A66C2] hover:text-[#004182] font-medium hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
            <div
              className="text-slate-500 font-light text-[17px] leading-none select-none hover:text-[#0A66C2] cursor-pointer"
            >
              {openAccordions.hideProfiles ? '−' : '+'}
            </div>
          </div>
        </div>
        {openAccordions.hideProfiles && (
          <div className="pb-3 pt-1 space-y-1">
            {safeHideProfiles.map(hp => {
              const checked = filters.hideProfiles?.includes(hp);
              return (
                <label key={hp} className="flex items-center gap-2 text-[12.5px] text-slate-700 hover:text-slate-900 cursor-pointer select-none py-0.5">
                  <input
                    type="checkbox"
                    checked={!!checked}
                    onChange={() => handleToggleArrayFilter('hideProfiles', hp)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-[#0A66C2] accent-[#0A66C2] focus:ring-[#0A66C2] cursor-pointer"
                  />
                  <span className={checked ? 'font-semibold text-[#0A66C2]' : ''}>{hp}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* ACCORDION 16: Show only */}
      <div className="border-t border-slate-200/80 my-3">
        <div onClick={() => toggleAccordion('showOnly')} className="w-full flex items-center justify-between pt-3 pb-1 px-0.5 text-left group cursor-pointer">
          <div
            className="flex items-center gap-1.5 text-[14px] font-medium text-slate-800 hover:text-[#0A66C2] cursor-pointer"
          >
            <span>Show only</span>
            {filters.showOnly?.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-[17px] h-[17px] px-1 text-[10px] font-bold text-white bg-[#0A66C2] rounded-full">
                {filters.showOnly.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {filters.showOnly?.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSetFilter('showOnly', []);
                }}
                className="text-[12px] text-[#0A66C2] hover:text-[#004182] font-medium hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
            <div
              className="text-slate-500 font-light text-[17px] leading-none select-none hover:text-[#0A66C2] cursor-pointer"
            >
              {openAccordions.showOnly ? '−' : '+'}
            </div>
          </div>
        </div>
        {openAccordions.showOnly && (
          <div className="pb-3 pt-1 space-y-1">
            {safeShowOnly.map(so => {
              const checked = filters.showOnly?.includes(so);
              return (
                <label key={so} className="flex items-center gap-2 text-[12.5px] text-slate-700 hover:text-slate-900 cursor-pointer select-none py-0.5">
                  <input
                    type="checkbox"
                    checked={!!checked}
                    onChange={() => handleToggleArrayFilter('showOnly', so)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-[#0A66C2] accent-[#0A66C2] focus:ring-[#0A66C2] cursor-pointer"
                  />
                  <span className={checked ? 'font-semibold text-[#0A66C2]' : ''}>{so}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* ACCORDION 17: Job type */}
      <div className="border-t border-slate-200/80 my-3">
        <div onClick={() => toggleAccordion('jobType')} className="w-full flex items-center justify-between pt-3 pb-1 px-0.5 text-left group cursor-pointer">
          <div
            className="flex items-center gap-1.5 text-[14px] font-medium text-slate-800 hover:text-[#0A66C2] cursor-pointer"
          >
            <span>Job type</span>
            {filters.jobType?.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-[17px] h-[17px] px-1 text-[10px] font-bold text-white bg-[#0A66C2] rounded-full">
                {filters.jobType.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {filters.jobType?.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSetFilter('jobType', []);
                }}
                className="text-[12px] text-[#0A66C2] hover:text-[#004182] font-medium hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
            <div
              className="text-slate-500 font-light text-[17px] leading-none select-none hover:text-[#0A66C2] cursor-pointer"
            >
              {openAccordions.jobType ? '−' : '+'}
            </div>
          </div>
        </div>
        {openAccordions.jobType && (
          <div className="pb-3 pt-1 space-y-1">
            {safeJobTypes.map(jt => {
              const checked = filters.jobType?.includes(jt);
              return (
                <label key={jt} className="flex items-center gap-2 text-[12.5px] text-slate-700 hover:text-slate-900 cursor-pointer select-none py-0.5">
                  <input
                    type="checkbox"
                    checked={!!checked}
                    onChange={() => handleToggleArrayFilter('jobType', jt)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-[#0A66C2] accent-[#0A66C2] focus:ring-[#0A66C2] cursor-pointer"
                  />
                  <span className={checked ? 'font-semibold text-[#0A66C2]' : ''}>{jt}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>


      {/* ACCORDION 19: Age */}
      <div className="border-t border-slate-200/80 my-3">
        <div onClick={() => toggleAccordion('age')} className="w-full flex items-center justify-between pt-3 pb-1 px-0.5 text-left group cursor-pointer">
          <div
            className="flex items-center gap-1.5 text-[14px] font-medium text-slate-800 hover:text-[#0A66C2] cursor-pointer"
          >
            <span>Age</span>
            {(filters.ageMin || filters.ageMax) && (
              <span className="inline-flex items-center justify-center min-w-[17px] h-[17px] px-1 text-[10px] font-bold text-white bg-[#0A66C2] rounded-full">
                1
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {(filters.ageMin || filters.ageMax) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSetFilter('ageMin', '');
                  handleSetFilter('ageMax', '');
                }}
                className="text-[12px] text-[#0A66C2] hover:text-[#004182] font-medium hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
            <div
              className="text-slate-500 font-light text-[17px] leading-none select-none hover:text-[#0A66C2] cursor-pointer"
            >
              {openAccordions.age ? '−' : '+'}
            </div>
          </div>
        </div>
        {openAccordions.age && (
          <div className="pb-3 pt-1 space-y-2">
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="18"
                max="65"
                placeholder="Min (18)"
                value={filters.ageMin || ''}
                onChange={e => handleSetFilter('ageMin', e.target.value)}
                className="w-1/2 px-2 py-1 text-[12px] bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-[#0A66C2]"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="number"
                min="18"
                max="65"
                placeholder="Max (60)"
                value={filters.ageMax || ''}
                onChange={e => handleSetFilter('ageMax', e.target.value)}
                className="w-1/2 px-2 py-1 text-[12px] bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-[#0A66C2]"
              />
            </div>
            <div className="flex flex-wrap gap-1 pt-1">
              {[
                { label: '18-25', min: '18', max: '25' },
                { label: '26-32', min: '26', max: '32' },
                { label: '33-40', min: '33', max: '40' },
                { label: '40+', min: '40', max: '' }
              ].map(p => {
                const active = String(filters.ageMin) === p.min && String(filters.ageMax) === p.max;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      if (active) {
                        handleSetFilter('ageMin', '');
                        handleSetFilter('ageMax', '');
                      } else {
                        handleSetFilter('ageMin', p.min);
                        handleSetFilter('ageMax', p.max);
                      }
                    }}
                    className={`px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors cursor-pointer ${active ? 'bg-[#0A66C2] text-white border-[#0A66C2]' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
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

      {/* Apply Filters Button */}
      <div className="pt-2.5 border-t border-slate-100 mt-2">
        <button
          type="button"
          onClick={fetchCandidates}
          className="w-full bg-[#0A66C2] hover:bg-[#004182] active:bg-[#003366] text-white font-medium text-[13px] py-2 px-3 rounded-xl flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
        >
          <Filter size={14} /> Apply Filters
        </button>
      </div>

      {/* Floating "Current location" Popover Modal (Image 2) */}
      {locModalOpen && typeof document !== 'undefined' && createPortal(
        <>
          <div
            className="fixed inset-0 z-[9998] bg-black/15 transition-opacity"
            onClick={() => setLocModalOpen(false)}
          />
          <div
            style={{
              top: `${popupPos.top}px`,
              left: `${popupPos.left}px`,
              width: `${popupPos.width}px`
            }}
            className="fixed z-[9999] bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            {/* Header: Title + Close Button */}
            <div className="flex items-center justify-between pb-3">
              <h3 className="text-[15px] font-bold text-slate-800">Current location</h3>
              <button
                type="button"
                onClick={() => setLocModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 cursor-pointer transition-colors"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Enter current location"
                value={locPopupSearch}
                onChange={e => setLocPopupSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0A66C2] focus:ring-1 focus:ring-blue-500/20 shadow-2xs"
              />
            </div>

            {/* Header label */}
            <div className="text-[12px] font-bold text-slate-500 mb-2">
              {locPopupSearch.trim() ? 'Matching Locations' : 'In Top Cities'}
            </div>

            {/* Scrollable List */}
            <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
              {!locPopupSearch.trim() ? (
                // Pure curated Top Cities (No recent searches, No raw DB profile strings)
                topCities.map(city => {
                  const isChecked = filters.location?.includes(city);
                  return (
                    <label
                      key={city}
                      className="flex items-center gap-2.5 text-[13.5px] text-slate-700 hover:text-slate-900 cursor-pointer select-none py-0.5 group"
                    >
                      <input
                        type="checkbox"
                        checked={!!isChecked}
                        onChange={() => handleToggleArrayFilter('location', city)}
                        className="w-4 h-4 rounded border-slate-300 text-[#0A66C2] accent-[#0A66C2] focus:ring-[#0A66C2] cursor-pointer"
                      />
                      <span className={`${isChecked ? 'font-semibold text-[#0A66C2]' : 'group-hover:text-slate-900'}`}>
                        {city}
                      </span>
                    </label>
                  );
                })
              ) : (
                // Third-Party Location Suggestions
                <>
                  {isSearchingLocation && (
                    <div className="flex items-center justify-center gap-2 text-[12.5px] text-slate-400 py-3">
                      <Loader2 size={14} className="animate-spin text-[#0A66C2]" />
                      <span>Searching proper locations...</span>
                    </div>
                  )}

                  {!isSearchingLocation && apiSuggestions.length === 0 && (
                    <div className="text-[12.5px] text-slate-400 py-3 text-center">
                      No locations found for "{locPopupSearch}"
                    </div>
                  )}

                  {apiSuggestions.map(loc => {
                    const isChecked = filters.location?.includes(loc.name);
                    return (
                      <label
                        key={loc.displayName}
                        className="flex items-center gap-2.5 text-[13.5px] text-slate-700 hover:text-slate-900 cursor-pointer select-none py-0.5 group"
                      >
                        <input
                          type="checkbox"
                          checked={!!isChecked}
                          onChange={() => handleToggleArrayFilter('location', loc.name)}
                          className="w-4 h-4 rounded border-slate-300 text-[#0A66C2] accent-[#0A66C2] focus:ring-[#0A66C2] cursor-pointer shrink-0"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className={`truncate ${isChecked ? 'font-semibold text-[#0A66C2]' : 'group-hover:text-slate-900'}`}>
                            {loc.name}
                          </span>
                          {loc.displayName !== loc.name && (
                            <span className="text-[11px] text-slate-400 truncate leading-tight">
                              {loc.displayName}
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Floating "Courses" Popover Modal (Screenshot 2) */}
      {courseModalOpen && typeof document !== 'undefined' && createPortal(
        <>
          <div
            className="fixed inset-0 z-[9998] bg-black/20 transition-opacity"
            onClick={() => setCourseModalOpen(false)}
          />
          <div
            style={{
              top: `${coursePopupPos.top}px`,
              left: `${coursePopupPos.left}px`,
              width: `${coursePopupPos.width}px`
            }}
            className="fixed z-[9999] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            {/* Header: Title + Close Button */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
              <h3 className="text-[14px] font-semibold text-slate-800">Courses</h3>
              <button
                type="button"
                onClick={() => setCourseModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 cursor-pointer transition-colors"
                title="Close"
              >
                <X size={15} />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-2.5 border-b border-slate-100">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search"
                  value={courseModalSearch}
                  onChange={e => setCourseModalSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-md text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0A66C2]"
                />
              </div>
            </div>

            {/* Two-Column Layout */}
            <div className="flex divide-x divide-slate-200 min-h-[240px] max-h-[290px]">
              {/* Left Column: Degrees with counts */}
              <div className="w-[48%] overflow-y-auto py-1">
                {filteredCourseCategories.map(cat => {
                  const isActive = (currentCategory?.category === cat.category);
                  const selectedCountInCat = cat.specializations.filter(s => (filters.courses || []).includes(s)).length;
                  return (
                    <div
                      key={cat.category}
                      onClick={() => setActiveCourseCat(cat.category)}
                      className={`px-3 py-2 text-[12.5px] cursor-pointer transition-colors flex items-center justify-between ${
                        isActive
                          ? 'bg-[#EFF6FF] text-slate-900 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate pr-1">{cat.category} ({cat.count})</span>
                      {selectedCountInCat > 0 && (
                        <span className="min-w-[17px] h-[17px] px-1 text-[10px] font-bold text-white bg-[#0A66C2] rounded-full flex items-center justify-center shrink-0">
                          {selectedCountInCat}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Specializations */}
              <div className="w-[52%] overflow-y-auto p-2.5 space-y-1.5">
                {currentCategory && (
                  <>
                    <label className="flex items-center gap-2 text-[12.5px] text-slate-800 font-medium cursor-pointer pb-1 border-b border-slate-100">
                      <input
                        type="checkbox"
                        checked={Boolean(currentCategory.specializations.length > 0 && currentCategory.specializations.every(s => (filters.courses || []).includes(s)))}
                        onChange={() => handleToggleSelectAllCategory(currentCategory)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-[#0A66C2] accent-[#0A66C2] focus:ring-[#0A66C2] cursor-pointer"
                      />
                      <span>Select all</span>
                    </label>

                    {currentCategory.specializations.map(spec => {
                      const checked = (filters.courses || []).includes(spec);
                      return (
                        <label
                          key={spec}
                          className="flex items-center gap-2 text-[12.5px] text-slate-700 hover:text-slate-900 cursor-pointer select-none py-0.5"
                        >
                          <input
                            type="checkbox"
                            checked={!!checked}
                            onChange={() => handleToggleCourse(spec)}
                            className="w-3.5 h-3.5 rounded border-slate-300 text-[#0A66C2] accent-[#0A66C2] focus:ring-[#0A66C2] cursor-pointer shrink-0"
                          />
                          <span className={checked ? 'font-semibold text-[#0A66C2]' : ''}>{spec}</span>
                        </label>
                      );
                    })}
                  </>
                )}
              </div>
            </div>

            {/* Done / Apply footer */}
            <div className="p-2 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <span className="text-[11.5px] text-slate-500 font-medium">
                {(filters.courses || []).length} course{(filters.courses || []).length === 1 ? '' : 's'} selected
              </span>
              <button
                type="button"
                onClick={() => setCourseModalOpen(false)}
                className="px-3 py-1 bg-[#0A66C2] hover:bg-[#004182] text-white text-[12px] font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </>,
        document.body
      )}

    </div>
  );
};

export default CandidateFilterSidebar;
