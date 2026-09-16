import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, Star, ChevronDown, ChevronRight, Check, Building, Globe, Loader2, Plus, GraduationCap } from 'lucide-react';
import { lookupCompaniesAPI } from '../ApiService/action';

// 1. Keywords Autocomplete (Tags Inside Input with Attached Dropdown)
export const KeywordsAutocomplete = ({ 
  selectedTags = [], 
  onChange, 
  placeholder, 
  suggestions = [], 
  isExclude = false,
  hasError = false
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      if (!selectedTags.includes(inputValue.trim())) {
        onChange([...selectedTags, inputValue.trim()]);
      }
      setInputValue('');
      setIsOpen(false);
    } else if (e.key === 'Backspace' && !inputValue && selectedTags.length > 0) {
      onChange(selectedTags.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove) => {
    onChange(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const filteredSuggestions = suggestions.filter(s => 
    s.toLowerCase().includes(inputValue.toLowerCase()) && !selectedTags.includes(s)
  ).slice(0, 10);

  const showDropdown = isOpen && (inputValue.trim() || filteredSuggestions.length > 0);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div 
        className={`flex flex-wrap items-center gap-2 w-full px-3.5 py-2 border bg-white transition-all min-h-[46px] cursor-text ${
          hasError
            ? 'rounded-lg border-rose-500 ring-2 ring-rose-200'
            : showDropdown 
              ? 'rounded-t-lg rounded-b-none border-[#0A66C2] ring-1 ring-[#0A66C2]' 
              : 'rounded-lg border-slate-300 hover:border-slate-400 focus-within:border-[#0A66C2] focus-within:ring-1 focus-within:ring-[#0A66C2]'
        }`}
        onClick={() => setIsOpen(true)}
      >
        <Search size={16} className={`${hasError ? 'text-rose-500' : 'text-slate-400'} shrink-0`} />
        
        {selectedTags.map((tag, index) => (
          <div 
            key={index} 
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] font-medium transition-colors ${
              isExclude
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-blue-50 text-[#0A66C2] border border-blue-200'
            }`}
          >
            {!isExclude && <Star size={11} className="fill-[#0A66C2] text-[#0A66C2] shrink-0" />}
            <span>{tag}</span>
            <button 
              type="button" 
              onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
              className="rounded-full p-0.5 hover:bg-black/10 text-current transition-colors ml-0.5"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={selectedTags.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[140px] bg-transparent outline-none text-[14px] text-slate-800 placeholder:text-slate-400 py-1"
        />

        {(inputValue || selectedTags.length > 0) && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setInputValue('');
              if (!inputValue && selectedTags.length > 0) {
                onChange([]);
              }
            }}
            className="text-slate-400 hover:text-slate-600 p-0.5"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute z-50 w-full left-0 top-full bg-white border border-t-0 border-[#0A66C2] rounded-b-lg shadow-xl max-h-56 overflow-y-auto">
          {filteredSuggestions.length > 0 ? (
            filteredSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-[14px] text-slate-800 flex items-center justify-between"
                onClick={() => {
                  onChange([...selectedTags, suggestion]);
                  setInputValue('');
                  setIsOpen(false);
                }}
              >
                <span>{suggestion}</span>
              </div>
            ))
          ) : inputValue.trim() ? (
            <div 
              className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-[14px] text-slate-800 flex items-center justify-between"
              onClick={() => {
                onChange([...selectedTags, inputValue.trim()]);
                setInputValue('');
                setIsOpen(false);
              }}
            >
              <span>Add &quot;{inputValue.trim()}&quot;</span>
              <span className="text-[12px] text-slate-400 font-medium">Press Enter</span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

// 2. Checkbox Dropdown (Current location, Company)
export const CheckboxDropdown = ({ 
  options = [], 
  selectedOptions = [], 
  onChange, 
  placeholder,
  labelTitle
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option) => {
    if (selectedOptions.includes(option)) {
      onChange(selectedOptions.filter(o => o !== option));
    } else {
      onChange([...selectedOptions, option]);
    }
  };

  const filteredOptions = options.filter(o => 
    o.toLowerCase().includes(inputValue.toLowerCase())
  );

  const [openUpwards, setOpenUpwards] = useState(false);

  useEffect(() => {
    if (isOpen && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 300 && rect.top > 250) {
        setOpenUpwards(true);
      } else {
        setOpenUpwards(false);
      }
    }
  }, [isOpen]);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div 
        className={`flex items-center gap-2 w-full px-3.5 py-2.5 border bg-white transition-colors cursor-text min-h-[46px] ${
          isOpen
            ? openUpwards
              ? 'rounded-b-lg rounded-t-none border-[#0A66C2] ring-1 ring-[#0A66C2]'
              : 'rounded-t-lg rounded-b-none border-[#0A66C2] ring-1 ring-[#0A66C2]'
            : 'rounded-lg border-slate-300 hover:border-slate-400 focus-within:border-[#0A66C2] focus-within:ring-1 focus-within:ring-[#0A66C2]'
        }`}
        onClick={() => setIsOpen(true)}
      >
        <Search size={16} className="text-slate-400 shrink-0 ml-0.5" />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          placeholder={selectedOptions.length > 0 ? `${selectedOptions.length} selected (${selectedOptions.slice(0, 2).join(', ')}${selectedOptions.length > 2 ? '...' : ''})` : placeholder}
          className="flex-1 min-w-0 bg-transparent outline-none text-[14px] text-slate-800 placeholder:text-slate-400"
        />
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-[#0A66C2]' : ''}`} />
      </div>

      {isOpen && (
        <div 
          className={`absolute z-50 w-full left-0 bg-white border border-[#0A66C2] shadow-2xl max-h-60 overflow-y-auto flex flex-col ${
            openUpwards
              ? 'bottom-full mb-0 border-b-0 rounded-t-lg'
              : 'top-full mt-0 border-t-0 rounded-b-lg'
          }`}
        >
          {labelTitle && (
            <div className="px-4 pt-2.5 pb-1.5 text-[13px] font-semibold text-slate-500 bg-white sticky top-0 z-10 border-b border-slate-100 flex justify-between items-center">
              <span>{labelTitle}</span>
              {selectedOptions.length > 0 && (
                <button 
                  type="button" 
                  onClick={() => onChange([])} 
                  className="text-xs text-[#0A66C2] hover:underline font-normal"
                >
                  Clear ({selectedOptions.length})
                </button>
              )}
            </div>
          )}

          <div className="p-2 space-y-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => {
                const isChecked = selectedOptions.includes(option);
                return (
                  <label 
                    key={index} 
                    className="flex items-center gap-3 px-2 py-1.5 hover:bg-slate-50 cursor-pointer rounded select-none"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleOption(option)}
                      className="w-4 h-4 rounded border-slate-300 text-[#0A66C2] accent-[#0A66C2] focus:ring-[#0A66C2] cursor-pointer"
                    />
                    <span className={`text-[14px] ${isChecked ? 'text-slate-900 font-medium' : 'text-slate-700'}`}>
                      {option}
                    </span>
                  </label>
                );
              })
            ) : inputValue.trim() ? (
              <div 
                className="px-3 py-2 text-[14px] text-[#0A66C2] hover:bg-blue-50 rounded cursor-pointer"
                onClick={() => {
                  toggleOption(inputValue.trim());
                  setInputValue('');
                }}
              >
                Add &quot;{inputValue.trim()}&quot;
              </div>
            ) : (
              <div className="px-3 py-3 text-center text-[13px] text-slate-400">No options found</div>
            )}
          </div>
        </div>
      )}

      {/* Visible Selected Option Tags */}
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-2">
          {selectedOptions.map(opt => (
            <span
              key={opt}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200/80 text-[12px] font-medium text-[#0A66C2] shadow-2xs group hover:bg-blue-100/80 transition-colors"
            >
              <span>{opt}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleOption(opt);
                }}
                className="text-blue-400 hover:text-[#0A66C2] rounded p-0.5 cursor-pointer"
                title={`Remove ${opt}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          {selectedOptions.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange([]);
              }}
              className="text-[11px] text-slate-400 hover:text-rose-600 font-semibold px-2 py-1 self-center cursor-pointer transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// 3. Complete Global Industry Taxonomy (Covering all industry types)
export const ALL_INDUSTRY_VERTICALS = [
  {
    category: "BPM / ITES",
    count: 7,
    subcategories: ["Analytics / KPO / Research", "BPM / BPO", "Customer Experience & Support", "Financial Process Outsourcing", "Technical Support & Helpdesk", "Data Annotation & AI Labeling", "Medical Transcription"]
  },
  {
    category: "IT Services & Consulting",
    count: 7,
    subcategories: ["Software Services", "Cloud Consulting", "Systems Integration", "Managed IT Services", "Cybersecurity Consulting", "ERP & CRM Implementation", "Quality Assurance & Testing"]
  },
  {
    category: "Software Product & SaaS",
    count: 9,
    subcategories: ["Enterprise SaaS", "B2B Applications", "B2C Mobile & Web Apps", "Cloud Platforms", "Developer Tools", "Productivity Software", "FinTech Platforms", "EdTech Platforms", "HRTech Platforms"]
  },
  {
    category: "Technology & Emerging Tech",
    count: 9,
    subcategories: ["AI / Machine Learning", "Generative AI & LLMs", "Data Science & Big Data", "Cloud Architecture & DevOps", "Cybersecurity & InfoSec", "Blockchain & Web3", "AR / VR Development", "Robotics & Automation", "IoT & Connected Devices"]
  },
  {
    category: "Hardware & Semiconductors",
    count: 7,
    subcategories: ["VLSI & Chip Design", "Embedded Systems", "Hardware Design", "Semiconductor Fabrication", "ASIC / FPGA Development", "PCB Design", "Microelectronics"]
  },
  {
    category: "Electronics & Electrical Manufacturing",
    count: 7,
    subcategories: ["Consumer Electronics", "Industrial Electronics", "Power Electronics", "Smart Appliances", "Automation Systems", "Electrical Equipment", "Semiconductor Devices"]
  },
  {
    category: "Banking & Financial Services",
    count: 10,
    subcategories: ["FinTech & Digital Payments", "Commercial & Retail Banking", "Investment Banking", "Wealth Management & Private Banking", "Insurance (Life, General, Health)", "NBFC & Microfinance", "Asset Management", "Risk Management & Compliance", "Credit & Lending", "Stock Broking & Trading"]
  },
  {
    category: "Healthcare & Hospitals",
    count: 7,
    subcategories: ["Hospitals & Healthcare Centers", "Physicians & Surgeons", "Nursing & Patient Care", "Medical Diagnostics & Pathology", "Telemedicine & Digital Health", "Healthcare Administration", "Medical Devices & Equipment"]
  },
  {
    category: "Pharmaceuticals & Biotechnology",
    count: 6,
    subcategories: ["Drug Discovery & Development", "Clinical Research (CRO)", "Formulation & Manufacturing", "Regulatory Affairs & QA", "Biotechnology & Genomics", "API & Bulk Drugs"]
  },
  {
    category: "E-Commerce & Retail",
    count: 7,
    subcategories: ["Online Marketplaces & D2C", "Retail Store Operations", "Quick Commerce & Delivery", "Category Management & Merchandising", "Fashion & Apparel", "Consumer Electronics Retail", "Supermarkets & FMCG Retail"]
  },
  {
    category: "Consumer Goods & FMCG",
    count: 5,
    subcategories: ["Packaged Foods & Beverages", "Personal Care & Cosmetics", "Household Cleaning Products", "Consumer Durables", "Brand Marketing & Distribution"]
  },
  {
    category: "Automotive & Transportation",
    count: 6,
    subcategories: ["Automobile OEMs", "Electric Vehicles (EV) & Battery Tech", "Auto Components & Parts", "Autonomous Driving Systems", "Two-Wheelers & Commercial Vehicles", "Fleet Management"]
  },
  {
    category: "Engineering, Manufacturing & Industrial",
    count: 6,
    subcategories: ["Heavy Machinery & Equipment", "Mechanical & Plant Engineering", "Precision Tooling & Fabrication", "Process Manufacturing", "Industrial Automation & PLC", "Metallurgy & Steel"]
  },
  {
    category: "Telecommunications & Networking",
    count: 5,
    subcategories: ["5G / 4G Telecom Service Providers", "Optical Fiber & Network Infrastructure", "Network Engineering & RF", "Satellite Communications", "Unified Communications & VoIP"]
  },
  {
    category: "Education, EdTech & Academia",
    count: 6,
    subcategories: ["EdTech & Online Learning Platforms", "Higher Education & Universities", "K-12 Schools & Institutes", "Vocational & Skill Training", "Corporate Training & Coaching", "Academic Research"]
  },
  {
    category: "Media, Entertainment & Gaming",
    count: 7,
    subcategories: ["Digital Media & Publishing", "Film & TV Production", "OTT & Streaming Platforms", "Video Game Development", "Animation & VFX", "Advertising & Creative Agencies", "Public Relations (PR)"]
  },
  {
    category: "Construction, Real Estate & Architecture",
    count: 6,
    subcategories: ["Architecture & Interior Design", "Residential Real Estate", "Commercial Real Estate", "Civil Engineering & Infrastructure", "Property & Facility Management", "Urban Planning"]
  },
  {
    category: "Logistics, Supply Chain & Warehousing",
    count: 5,
    subcategories: ["3PL & 4PL Logistics", "Freight Forwarding & Cargo", "Warehousing & Cold Chain", "Port & Marine Shipping", "Express Courier & Last-Mile Delivery"]
  },
  {
    category: "Energy, Power, Oil & Gas",
    count: 5,
    subcategories: ["Renewable Energy (Solar & Wind)", "Oil & Gas Exploration (Upstream)", "Petroleum Refining & Petrochemicals", "Power Generation & Grid Distribution", "CleanTech & Sustainability"]
  },
  {
    category: "Aerospace & Aviation",
    count: 5,
    subcategories: ["Commercial Aviation & Airlines", "Aircraft Maintenance (MRO)", "Aerospace Engineering", "Space Technology & Satellites", "Airport Operations & Ground Handling"]
  },
  {
    category: "Hospitality, Travel & Tourism",
    count: 5,
    subcategories: ["Hotels, Resorts & Hospitality", "Travel Agencies & Tour Operators", "Aviation Hospitality", "Food & Beverage (F&B) / Restaurants", "Events & Conferences (MICE)"]
  },
  {
    category: "Professional Consulting & Legal",
    count: 5,
    subcategories: ["Strategy & Management Consulting", "Legal Practices & Law Firms", "Corporate Taxation & Auditing", "HR & Executive Recruitment", "Intellectual Property (IP) & Patents"]
  },
  {
    category: "Agriculture, Dairy & Food Processing",
    count: 5,
    subcategories: ["AgriTech & Smart Farming", "Crop Protection & Fertilizers", "Dairy & Livestock Farming", "Food Processing & Cold Storage", "Organic Agriculture"]
  },
  {
    category: "Government, Defense & Non-Profit",
    count: 5,
    subcategories: ["Public Sector Undertakings (PSU)", "Defense & Military Equipment", "Non-Governmental Organizations (NGO)", "Foundations & Social Impact", "Regulatory & Standards Bodies"]
  }
];

export const TwoPaneIndustryDropdown = ({ 
  selectedIndustries = [], 
  onChange, 
  placeholder,
  industries = []
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const effectiveIndustries = industries && industries.length > 0 ? industries : ALL_INDUSTRY_VERTICALS;
  const [activeCategory, setActiveCategory] = useState(effectiveIndustries[0] || ALL_INDUSTRY_VERTICALS[0]);
  const [categorySearch, setCategorySearch] = useState('');
  const [subcategorySearch, setSubcategorySearch] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (effectiveIndustries.length > 0 && (!activeCategory || !effectiveIndustries.some(c => c.category === activeCategory.category))) {
      setActiveCategory(effectiveIndustries[0]);
    }
  }, [effectiveIndustries]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSubcategory = (sub) => {
    if (selectedIndustries.includes(sub)) {
      onChange(selectedIndustries.filter(i => i !== sub));
    } else {
      onChange([...selectedIndustries, sub]);
    }
  };

  const handleToggleCategory = (cat) => {
    const subs = cat.subcategories || [];
    const allSelected = subs.every(sub => selectedIndustries.includes(sub));
    
    if (allSelected) {
      onChange(selectedIndustries.filter(i => !subs.includes(i)));
    } else {
      const newSelected = [...selectedIndustries];
      subs.forEach(sub => {
        if (!newSelected.includes(sub)) newSelected.push(sub);
      });
      onChange(newSelected);
    }
  };

  const isCategoryFullySelected = (cat) => {
    const subs = cat.subcategories || [];
    return subs.length > 0 && subs.every(sub => selectedIndustries.includes(sub));
  };

  const isCategoryPartiallySelected = (cat) => {
    const subs = cat.subcategories || [];
    return subs.some(sub => selectedIndustries.includes(sub)) && !isCategoryFullySelected(cat);
  };

  const currentSubs = activeCategory?.subcategories || [];
  const isAllActiveSelected = currentSubs.length > 0 && currentSubs.every(sub => selectedIndustries.includes(sub));

  const [openUpwards, setOpenUpwards] = useState(false);

  useEffect(() => {
    if (isOpen && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 380 && rect.top > 300) {
        setOpenUpwards(true);
      } else {
        setOpenUpwards(false);
      }
    }
  }, [isOpen]);

  // Filter categories by categorySearch
  const filteredCategories = effectiveIndustries.filter(ind =>
    ind.category.toLowerCase().includes(categorySearch.toLowerCase()) ||
    (ind.subcategories && ind.subcategories.some(s => s.toLowerCase().includes(categorySearch.toLowerCase())))
  );

  // Filter active subcategories by subcategorySearch
  const filteredSubcategories = currentSubs.filter(sub =>
    sub.toLowerCase().includes(subcategorySearch.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div 
        className={`w-full px-3.5 py-2.5 border bg-white transition-colors cursor-pointer flex justify-between items-center min-h-[46px] ${
          isOpen
            ? openUpwards
              ? 'rounded-b-lg rounded-t-none border-[#0A66C2] ring-1 ring-[#0A66C2]'
              : 'rounded-t-lg rounded-b-none border-[#0A66C2] ring-1 ring-[#0A66C2]'
            : 'rounded-lg border-slate-300 hover:border-slate-400 focus-within:border-[#0A66C2]'
        }`}
        onClick={() => setIsOpen(prev => !prev)}
      >
        {selectedIndustries.length > 0 ? (
          <div className="flex items-center justify-between w-full pr-2">
            <span className="text-slate-900 font-medium text-[14px] truncate">
              {selectedIndustries.length} Industries selected ({selectedIndustries.slice(0, 2).join(', ')}{selectedIndustries.length > 2 ? '...' : ''})
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange([]);
              }}
              className="text-xs text-slate-400 hover:text-rose-600 ml-2 shrink-0 p-1"
              title="Clear all industries"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <span className="text-slate-400 text-[14px]">{placeholder || 'Enter industry'}</span>
        )}
        <ChevronDown size={16} className={`text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-[#0A66C2]' : ''}`} />
      </div>

      {isOpen && (
        <div 
          className={`absolute z-50 w-full left-0 bg-white border border-[#0A66C2] shadow-2xl overflow-hidden flex flex-col ${
            openUpwards
              ? 'bottom-full mb-0 border-b-0 rounded-t-lg'
              : 'top-full mt-0 border-t-0 rounded-b-lg'
          }`}
        >
          <div className="flex h-72 border-b border-slate-200">
            
            {/* Left Pane - Categories with Search, Checkbox & Chevron */}
            <div className="w-1/2 border-r border-slate-200 flex flex-col bg-white">
              {/* Category Search */}
              <div className="p-2 border-b border-slate-100 bg-slate-50/70">
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={categorySearch}
                    onChange={e => setCategorySearch(e.target.value)}
                    placeholder="Search industries..."
                    className="w-full pl-8 pr-2.5 py-1.5 text-[12px] bg-white border border-slate-200 rounded-md focus:outline-none focus:border-[#0A66C2]"
                    onClick={e => e.stopPropagation()}
                  />
                  {categorySearch && (
                    <button
                      type="button"
                      onClick={() => setCategorySearch('')}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Category List */}
              <div className="flex-1 overflow-y-auto p-1">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((ind, idx) => {
                    const isActive = activeCategory?.category === ind.category;
                    const fullySelected = isCategoryFullySelected(ind);
                    const partiallySelected = isCategoryPartiallySelected(ind);
                    const selectedSubsCount = (ind.subcategories || []).filter(s => selectedIndustries.includes(s)).length;

                    return (
                      <div 
                        key={idx}
                        onClick={() => setActiveCategory(ind)}
                        className={`flex items-center justify-between px-3 py-2 cursor-pointer rounded text-[13px] transition-colors ${
                          isActive 
                            ? 'bg-blue-50 text-[#0A66C2] font-medium' 
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <label 
                          className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={fullySelected}
                            ref={el => {
                              if (el) el.indeterminate = partiallySelected;
                            }}
                            onChange={() => handleToggleCategory(ind)}
                            className="w-4 h-4 rounded border-slate-300 text-[#0A66C2] accent-[#0A66C2] focus:ring-[#0A66C2] cursor-pointer"
                          />
                          <span className="truncate">{ind.category}</span>
                          <span className="text-[11px] text-slate-400 shrink-0 font-normal">
                            ({selectedSubsCount > 0 ? `${selectedSubsCount}/` : ''}{ind.count || ind.subcategories?.length || 0})
                          </span>
                        </label>
                        <ChevronRight size={14} className={`shrink-0 ml-1 ${isActive ? 'text-[#0A66C2]' : 'text-slate-300'}`} />
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-[12px] text-slate-400">No industry categories found</div>
                )}
              </div>
            </div>

            {/* Right Pane - Subcategories with Filter */}
            <div className="w-1/2 flex flex-col bg-white">
              {/* Subcategory Search */}
              <div className="p-2 border-b border-slate-100 bg-slate-50/70">
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={subcategorySearch}
                    onChange={e => setSubcategorySearch(e.target.value)}
                    placeholder={`Filter in ${activeCategory?.category || 'selected'}...`}
                    className="w-full pl-8 pr-2.5 py-1.5 text-[12px] bg-white border border-slate-200 rounded-md focus:outline-none focus:border-[#0A66C2]"
                    onClick={e => e.stopPropagation()}
                  />
                  {subcategorySearch && (
                    <button
                      type="button"
                      onClick={() => setSubcategorySearch('')}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Subcategories List */}
              <div className="flex-1 overflow-y-auto p-2">
                {!subcategorySearch && activeCategory && (
                  <label className="flex items-center gap-2.5 px-2 py-2 hover:bg-slate-50 cursor-pointer rounded mb-1 select-none border-b border-slate-100 pb-2">
                    <input
                      type="checkbox"
                      checked={isAllActiveSelected}
                      onChange={() => handleToggleCategory(activeCategory)}
                      className="w-4 h-4 rounded border-slate-300 text-[#0A66C2] accent-[#0A66C2] focus:ring-[#0A66C2] cursor-pointer"
                    />
                    <span className="text-[13px] text-slate-900 font-semibold">Select All ({currentSubs.length})</span>
                  </label>
                )}

                {filteredSubcategories.length > 0 ? (
                  filteredSubcategories.map((sub, idx) => {
                    const isSelected = selectedIndustries.includes(sub);
                    return (
                      <label 
                        key={idx} 
                        className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-slate-50 cursor-pointer rounded select-none"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSubcategory(sub)}
                          className="w-4 h-4 rounded border-slate-300 text-[#0A66C2] accent-[#0A66C2] focus:ring-[#0A66C2] cursor-pointer"
                        />
                        <span className={`text-[13px] ${isSelected ? 'text-slate-900 font-medium' : 'text-slate-700'}`}>{sub}</span>
                      </label>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-[12px] text-slate-400">No subcategories match filter</div>
                )}
              </div>
            </div>

          </div>

          {/* Footer with selection summary */}
          <div className="px-3.5 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[12px]">
            <span className="text-slate-600 font-medium">
              {selectedIndustries.length} {selectedIndustries.length === 1 ? 'industry' : 'industries'} selected
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 bg-[#0A66C2] hover:bg-[#004182] text-white font-semibold rounded text-[12px] transition-colors"
            >
              Done
            </button>
          </div>

        </div>
      )}

      {/* Visible Selected Industry Option Tags */}
      {selectedIndustries.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-2">
          {selectedIndustries.map(ind => (
            <span
              key={ind}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-[12px] font-medium text-[#0A66C2] shadow-2xs group hover:bg-blue-100/80 transition-colors"
            >
              <span>{ind}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSubcategory(ind);
                }}
                className="text-blue-400 hover:text-[#0A66C2] rounded p-0.5 cursor-pointer"
                title={`Remove ${ind}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          {selectedIndustries.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange([]);
              }}
              className="text-[11px] text-slate-400 hover:text-rose-600 font-semibold px-2 py-1 self-center cursor-pointer transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// 4. Company Search Dropdown with Registered Companies & Internet Lookup API
export const CompanySearchDropdown = ({
  selectedOptions = [],
  onChange,
  placeholder = "Search candidate company name...",
  registeredCompanies = [],
  isExclude = false
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [apiResults, setApiResults] = useState([]);
  const [isSearchingAPI, setIsSearchingAPI] = useState(false);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced query to backend companies-lookup (merging registered companies + Clearbit internet API)
  useEffect(() => {
    if (!inputValue.trim() || inputValue.trim().length < 2) {
      setApiResults([]);
      setIsSearchingAPI(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setIsSearchingAPI(true);
      try {
        const res = await lookupCompaniesAPI(inputValue.trim());
        if (res?.data?.data && Array.isArray(res.data.data)) {
          setApiResults(res.data.data);
        }
      } catch (err) {
        // Fall back to local search
      } finally {
        setIsSearchingAPI(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputValue]);

  // Combined options:
  // 1. If searching, show local matches + internet API results (deduplicated)
  // 2. If empty, show first 40 registered companies
  const displayItems = useMemo(() => {
    const query = inputValue.trim().toLowerCase();
    const seenNames = new Set();
    const items = [];

    // Add API results if present
    if (apiResults && apiResults.length > 0) {
      apiResults.forEach(item => {
        const lower = item.name.toLowerCase();
        if (!seenNames.has(lower)) {
          seenNames.add(lower);
          items.push(item);
        }
      });
    }

    // Filter registered companies locally
    const filteredRegistered = registeredCompanies.filter(c => 
      !query || c.toLowerCase().includes(query)
    );

    filteredRegistered.slice(0, 30).forEach(name => {
      const lower = name.toLowerCase();
      if (!seenNames.has(lower)) {
        seenNames.add(lower);
        items.push({
          name,
          domain: null,
          logo: null,
          isRegistered: true,
          source: "Careerfast Registered"
        });
      }
    });

    return items;
  }, [inputValue, registeredCompanies, apiResults]);

  const toggleOption = (companyName) => {
    const trimmed = companyName.trim();
    if (!trimmed) return;
    if (selectedOptions.includes(trimmed)) {
      onChange(selectedOptions.filter(c => c !== trimmed));
    } else {
      onChange([...selectedOptions, trimmed]);
    }
  };

  const [openUpwards, setOpenUpwards] = useState(false);

  useEffect(() => {
    if (isOpen && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 350 && rect.top > 280) {
        setOpenUpwards(true);
      } else {
        setOpenUpwards(false);
      }
    }
  }, [isOpen]);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div 
        className={`flex items-center gap-2 w-full px-3.5 py-2.5 border bg-white transition-colors cursor-text min-h-[46px] ${
          isOpen
            ? openUpwards
              ? 'rounded-b-lg rounded-t-none border-[#0A66C2] ring-1 ring-[#0A66C2]'
              : 'rounded-t-lg rounded-b-none border-[#0A66C2] ring-1 ring-[#0A66C2]'
            : isExclude 
              ? 'rounded-lg border-rose-300 hover:border-rose-400 focus-within:border-rose-600 focus-within:ring-1 focus-within:ring-rose-600'
              : 'rounded-lg border-slate-300 hover:border-slate-400 focus-within:border-[#0A66C2] focus-within:ring-1 focus-within:ring-[#0A66C2]'
        }`}
        onClick={() => setIsOpen(true)}
      >
        <Search size={16} className="text-slate-400 shrink-0 ml-0.5" />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          placeholder={
            selectedOptions.length > 0
              ? `${selectedOptions.length} ${selectedOptions.length === 1 ? 'company' : 'companies'} selected (${selectedOptions.slice(0, 2).join(', ')}${selectedOptions.length > 2 ? '...' : ''})`
              : placeholder
          }
          className="flex-1 min-w-0 bg-transparent outline-none text-[14px] text-slate-800 placeholder:text-slate-400"
        />
        {isSearchingAPI && (
          <Loader2 size={15} className="animate-spin text-[#0A66C2] shrink-0" />
        )}
        <ChevronDown size={16} className={`text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-[#0A66C2]' : ''}`} />
      </div>

      {isOpen && (
        <div 
          className={`absolute z-50 w-full left-0 bg-white border border-[#0A66C2] shadow-2xl max-h-72 overflow-y-auto flex flex-col ${
            openUpwards
              ? 'bottom-full mb-0 border-b-0 rounded-t-lg'
              : 'top-full mt-0 border-t-0 rounded-b-lg'
          }`}
        >
          {/* Header */}
          <div className="px-3.5 py-2 text-[12px] font-semibold text-slate-500 bg-slate-50 border-b border-slate-100 flex justify-between items-center sticky top-0 z-10">
            <span className="flex items-center gap-1.5">
              <Building size={13} className="text-[#0A66C2]" />
              <span>Registered & Global Companies</span>
            </span>
            {selectedOptions.length > 0 && (
              <button 
                type="button" 
                onClick={() => onChange([])} 
                className="text-xs text-[#0A66C2] hover:underline font-normal cursor-pointer"
              >
                Clear all ({selectedOptions.length})
              </button>
            )}
          </div>

          {/* List */}
          <div className="p-1.5 space-y-0.5">
            {displayItems.length > 0 ? (
              displayItems.map((item, idx) => {
                const isChecked = selectedOptions.includes(item.name);
                return (
                  <label
                    key={idx}
                    className={`flex items-center gap-2.5 px-2.5 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors ${
                      isChecked ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleOption(item.name)}
                      className="w-4 h-4 rounded border-slate-300 text-[#0A66C2] accent-[#0A66C2] focus:ring-[#0A66C2] cursor-pointer shrink-0"
                    />

                    {/* Logo or Initial Avatar */}
                    {item.logo ? (
                      <img 
                        src={item.logo} 
                        alt="" 
                        className="w-5 h-5 rounded object-contain bg-white shrink-0 border border-slate-100"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <span className="w-5 h-5 rounded bg-blue-50 text-[#0A66C2] font-bold text-[10px] flex items-center justify-center shrink-0 border border-blue-100 uppercase">
                        {item.name.charAt(0)}
                      </span>
                    )}

                    {/* Name and Domain */}
                    <div className="flex-1 min-w-0 flex items-center gap-1.5">
                      <span className={`text-[13px] truncate ${isChecked ? 'text-[#0A66C2] font-semibold' : 'text-slate-800'}`}>
                        {item.name}
                      </span>
                      {item.domain && (
                        <span className="text-[11px] text-slate-400 truncate">
                          ({item.domain})
                        </span>
                      )}
                    </div>

                    {/* Source Badge */}
                    {item.isRegistered ? (
                      <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                        Registered
                      </span>
                    ) : (
                      <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-medium flex items-center gap-1">
                        <Globe size={9} /> Web
                      </span>
                    )}
                  </label>
                );
              })
            ) : null}

            {/* If user typed a custom company name not yet in list */}
            {inputValue.trim() && !displayItems.some(i => i.name.toLowerCase() === inputValue.trim().toLowerCase()) && (
              <div
                className="flex items-center gap-2 px-3 py-2 text-[13px] text-[#0A66C2] hover:bg-blue-50 rounded-lg cursor-pointer font-medium mt-1 border-t border-slate-100"
                onClick={() => {
                  toggleOption(inputValue.trim());
                  setInputValue('');
                }}
              >
                <Plus size={14} />
                <span>Add &quot;{inputValue.trim()}&quot; as company filter</span>
              </div>
            )}

            {displayItems.length === 0 && !inputValue.trim() && (
              <div className="px-3 py-4 text-center text-[13px] text-slate-400">
                Type company name to search registered & internet companies...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Visible Selected Company Option Tags */}
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-2">
          {selectedOptions.map(comp => (
            <span
              key={comp}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-medium shadow-2xs group transition-colors ${
                isExclude
                  ? 'bg-rose-50 border border-rose-200/80 text-rose-800 hover:bg-rose-100/80'
                  : 'bg-blue-50 border border-blue-200/80 text-[#0A66C2] hover:bg-blue-100/80'
              }`}
            >
              <Building size={11} className={isExclude ? 'text-rose-500' : 'text-[#0A66C2]'} />
              <span>{comp}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleOption(comp);
                }}
                className={`${isExclude ? 'text-rose-400 hover:text-rose-800' : 'text-blue-400 hover:text-[#0A66C2]'} rounded p-0.5 cursor-pointer`}
                title={`Remove ${comp}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          {selectedOptions.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange([]);
              }}
              className="text-[11px] text-slate-400 hover:text-rose-600 font-semibold px-2 py-1 self-center cursor-pointer transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// 5. Dynamic Degree MultiSelect Component
export const DegreeMultiSelect = ({
  selectedDegrees = [],
  onChange,
  availableDegrees = [],
  popularDegrees = [],
  placeholder = "Search or type degree..."
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showAllChips, setShowAllChips] = useState(false);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDegree = (deg) => {
    const trimmed = deg.trim();
    if (!trimmed) return;
    if (selectedDegrees.includes(trimmed)) {
      onChange(selectedDegrees.filter(d => d !== trimmed));
    } else {
      onChange([...selectedDegrees, trimmed]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        toggleDegree(inputValue.trim());
        setInputValue('');
        setIsOpen(false);
      }
    }
  };

  // Filter available degrees matching search input
  const filteredDegrees = useMemo(() => {
    const clean = inputValue.trim().toLowerCase();
    if (!clean) return availableDegrees;
    return availableDegrees.filter(d => d.toLowerCase().includes(clean));
  }, [availableDegrees, inputValue]);

  // Remaining degrees not in popular list
  const remainingDegrees = useMemo(() => {
    return availableDegrees.filter(d => !popularDegrees.includes(d));
  }, [availableDegrees, popularDegrees]);

  return (
    <div className="space-y-2.5" ref={wrapperRef}>
      {/* Container matching screenshot */}
      <div className="flex flex-wrap gap-2 items-center bg-slate-50/70 p-3 rounded-xl border border-slate-200/90 relative">
        {/* Popular Quick-Select Degree Chips (Multi-Select) */}
        {popularDegrees.map(deg => {
          const isSelected = selectedDegrees.includes(deg);
          return (
            <button
              key={deg}
              type="button"
              onClick={() => toggleDegree(deg)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold border cursor-pointer transition-all flex items-center gap-1.5 select-none ${
                isSelected
                  ? 'bg-[#0A66C2] border-[#0A66C2] text-white shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {isSelected && <Check size={13} className="stroke-[2.5]" />}
              <span>{deg}</span>
            </button>
          );
        })}

        {/* Searchable input with autocomplete inside container */}
        <div className="relative min-w-[200px] flex-1">
          <div className="relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={inputValue}
              onFocus={() => setIsOpen(true)}
              onChange={e => {
                setInputValue(e.target.value);
                if (!isOpen) setIsOpen(true);
              }}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-1.5 pr-7 text-[12px] border border-slate-300 rounded-lg bg-white focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2] focus:outline-none placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={() => {
                setIsOpen(!isOpen);
                inputRef.current?.focus();
              }}
              className="absolute right-2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
              tabIndex={-1}
            >
              <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180 text-[#0A66C2]' : ''}`} />
            </button>
          </div>

          {/* Autocomplete Dropdown */}
          {isOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-full min-w-[260px] max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-1.5">
              <div className="px-2.5 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center border-b border-slate-100 mb-1">
                <span>Available Degrees ({filteredDegrees.length})</span>
                {inputValue && <span className="text-[10px] text-slate-400">Press Enter to add</span>}
              </div>

              {filteredDegrees.length > 0 ? (
                filteredDegrees.map(deg => {
                  const isSelected = selectedDegrees.includes(deg);
                  return (
                    <div
                      key={deg}
                      onClick={() => {
                        toggleDegree(deg);
                        setInputValue('');
                      }}
                      className={`flex items-center justify-between px-3 py-1.5 text-[12px] rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50 text-[#0A66C2] font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{deg}</span>
                      {isSelected ? (
                        <Check size={14} className="text-[#0A66C2] stroke-[2.5]" />
                      ) : (
                        <Plus size={13} className="text-slate-400" />
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="px-3 py-2 text-[12px] text-slate-500 text-center">
                  No matching degrees found
                </div>
              )}

              {/* Custom Degree Addition */}
              {inputValue.trim() && !availableDegrees.some(d => d.toLowerCase() === inputValue.trim().toLowerCase()) && (
                <div
                  onClick={() => {
                    toggleDegree(inputValue.trim());
                    setInputValue('');
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium text-[#0A66C2] hover:bg-blue-50 rounded-lg cursor-pointer border-t border-slate-100 mt-1"
                >
                  <Plus size={14} />
                  <span>Add &quot;{inputValue.trim()}&quot; as degree</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* View all degrees toggle */}
        {remainingDegrees.length > 0 && (
          <button
            type="button"
            onClick={() => setShowAllChips(!showAllChips)}
            className="text-[11px] text-[#0A66C2] hover:text-[#004182] font-semibold px-2 py-1 rounded-md hover:bg-blue-50 transition-colors cursor-pointer"
          >
            {showAllChips ? 'Show less' : `+ ${remainingDegrees.length} more degrees`}
          </button>
        )}
      </div>

      {/* Expanded view for all fetched remaining degrees */}
      {showAllChips && remainingDegrees.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 max-h-40 overflow-y-auto">
          {remainingDegrees.map(deg => {
            const isSelected = selectedDegrees.includes(deg);
            return (
              <button
                key={deg}
                type="button"
                onClick={() => toggleDegree(deg)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border cursor-pointer transition-all flex items-center gap-1 ${
                  isSelected
                    ? 'bg-[#0A66C2] border-[#0A66C2] text-white font-semibold'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-white'
                }`}
              >
                {isSelected && <Check size={11} className="stroke-[2.5]" />}
                <span>{deg}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Removable Selected Degree Tags */}
      {selectedDegrees.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center pt-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mr-1">
            Selected ({selectedDegrees.length}):
          </span>
          {selectedDegrees.map(deg => (
            <span
              key={deg}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-semibold bg-blue-50 border border-blue-200 text-[#0A66C2] shadow-2xs group transition-colors"
            >
              <GraduationCap size={13} className="text-[#0A66C2]" />
              <span>{deg}</span>
              <button
                type="button"
                onClick={() => toggleDegree(deg)}
                className="text-blue-400 hover:text-[#0A66C2] rounded p-0.5 cursor-pointer transition-colors"
                title={`Remove ${deg}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          {selectedDegrees.length > 1 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-[11px] text-slate-400 hover:text-rose-600 font-semibold px-2 py-1 cursor-pointer transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
};


