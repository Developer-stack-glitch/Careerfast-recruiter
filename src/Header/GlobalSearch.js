'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, X, MapPin, Briefcase, GraduationCap, Laptop, BookOpen } from 'lucide-react';
import { useNavigate } from "@/routing-shim";
import { searchByKeyword } from "../ApiService/action";
import { getImageUrl, getPlaceholderSvg } from "../utils/getImageUrl";

const GlobalSearch = ({ smartNavigate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [category, setCategory] = useState('Internships');
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const modalRef = useRef(null);
  const navigate = useNavigate();

  const categories = [
    { id: 'Internships', icon: <Briefcase size={16} /> },
    { id: 'Jobs', icon: <Briefcase size={16} /> },
    { id: 'Courses', icon: <BookOpen size={16} /> },
    { id: 'Workshops', icon: <Laptop size={16} /> },
    { id: 'Mentorships', icon: <GraduationCap size={16} /> }
  ];

  const popularCities = ['Chennai', 'Delhi', 'Bangalore', 'Mumbai', 'Hyderabad', 'Kolkata'];
  const popularCategories = ['Big brands', 'Work from home', 'Part-time', 'MBA', 'Engineering', 'Media', 'Design', 'Data Science'];

  // Prevent scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isModalOpen]);

  const handleSearch = async (value) => {
    setSearchValue(value);
    if (!value) {
      setSuggestions([]);
      return;
    }
    await handleSearchWithCategory(value, category);
  };

  const handleSearchWithCategory = async (value, selectedCategory) => {
    try {
      setLoading(true);
      const payload = { searchTerm: value, category: selectedCategory };
      const response = await searchByKeyword(payload);
      setSuggestions(response?.data?.data || []);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSuggestion = (item) => {
    if (category === 'Courses' || item.job_nature === 'Course') {
      smartNavigate(`/courses/${item.slug}`);
      setIsModalOpen(false);
      setSearchValue('');
      return;
    }

    const generateSlug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const jobNature = generateSlug(item.job_nature || "");
    const jobTitle = generateSlug(item.job_title || "");
    const companyName = generateSlug(item.company_name || "");
    const finalUrl = `/job-details/${jobNature}-${jobTitle}-${companyName}-${item.id}`;

    smartNavigate(finalUrl);
    setIsModalOpen(false);
    setSearchValue('');
  };

  return (
    <div className="global-search-container">
      {/* Trigger Search Bar in Header */}
      <div className="header-search-trigger exact-ui-search" onClick={() => setIsModalOpen(true)}>
        <div className="search-input-mock">
          <Search size={18} className="search-icon" />
          <span className="placeholder-text">Search jobs, skills, companies...</span>
        </div>
        <div className="search-divider"></div>
        <div className="location-mock">
          <MapPin size={18} className="location-icon" />
          <span className="placeholder-text">Location</span>
          <ChevronDown size={16} className="chevron-icon" />
        </div>
        <button className="search-btn-exact">Search</button>
      </div>

      {/* Full Page Search Modal */}
      {isModalOpen && (
        <div className="search-modal-overlay">
          <div className="search-modal-content" ref={modalRef}>
            <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
              <X size={24} />
            </button>

            <div className="modal-search-box">
              <div className="category-selector" onClick={() => setShowCategoryMenu(!showCategoryMenu)}>
                <span>{category}</span>
                <ChevronDown size={16} className={showCategoryMenu ? 'rotate' : ''} />

                {showCategoryMenu && (
                  <div className="category-dropdown">
                    {categories.map((cat) => (
                      <div
                        key={cat.id}
                        className={`category-item ${category === cat.id ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCategory(cat.id);
                          setShowCategoryMenu(false);
                          // Re-trigger search with new category if search value exists
                          if (searchValue) {
                             handleSearchWithCategory(searchValue, cat.id);
                          }
                        }}
                      >
                        {cat.icon}
                        <span>{cat.id}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="search-input-section">
                <Search size={22} className="search-icon" />
                <input
                  type="text"
                  placeholder={`Search ${category.toLowerCase()} here...`}
                  autoFocus
                  value={searchValue}
                  onChange={(e) => handleSearch(e.target.value)}
                />
                {searchValue && (
                  <X
                    size={18}
                    className="clear-icon"
                    onClick={() => {
                      setSearchValue('');
                      setSuggestions([]);
                    }}
                  />
                )}
              </div>
            </div>

            <div className="modal-results-area">
              {searchValue.length > 0 ? (
                <div className="suggestions-list">
                  {loading ? (
                    <div className="search-loading">Searching...</div>
                  ) : suggestions.length > 0 ? (
                    suggestions.map((item) => (
                      <div key={item.id} className="suggestion-item" onClick={() => handleSelectSuggestion(item)}>
                        <div className="item-logo">
                          <img src={getImageUrl(item.company_logo)} alt={item.company_name} onError={(e) => { e.target.onerror = null; e.target.src = getPlaceholderSvg("Logo", 40, 40); }} />
                        </div>
                        <div className="item-info">
                          <div className="item-title">{item.job_title}</div>
                          <div className="item-company">
                            {category === 'Courses' ? "CareerFast Academy" : item.company_name}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-results">No results found for "{searchValue}"</div>
                  )}
                </div>
              ) : (
                <div className="overlay-content">
                  <div className="overlay-section">
                    <h4>POPULAR CITIES</h4>
                    <div className="tags-container">
                      {popularCities.map(city => (
                        <span key={city} className="search-tag" onClick={() => {
                          smartNavigate(`/jobs/jobs-in-${city.toLowerCase()}`);
                          setIsModalOpen(false);
                        }}>{city}</span>
                      ))}
                    </div>
                  </div>

                  <div className="overlay-section">
                    <h4>POPULAR CATEGORIES</h4>
                    <div className="tags-container">
                      {popularCategories.map(cat => (
                        <span key={cat} className="search-tag" onClick={() => {
                          smartNavigate(`/jobs/${cat.toLowerCase().replace(/\s+/g, '-')}-jobs`);
                          setIsModalOpen(false);
                        }}>{cat}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
