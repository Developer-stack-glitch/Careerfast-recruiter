'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X, Briefcase, MapPin, Sparkles, Send, CheckCircle2,
  Calendar, Clock, User, ChevronDown, AlertCircle, ShieldCheck,
  Check, Phone, Mail, Building2, Flame, Search
} from 'lucide-react';
import { getJobPostByUserId, sendNvitesAPI } from '../ApiService/action';
import { CommonToaster } from '../Common/CommonToaster';
import { getImageUrl } from '../utils/getImageUrl';

const TEMPLATES = [
  {
    id: 'standard',
    name: 'Direct Job Invitation',
    badge: 'Popular',
    subject: '⚡ Career Opportunity: {job_title} at {company_name}',
    message: `Hi {candidate_name},

We reviewed your profile on CareerFast and were impressed by your background and skills. We are currently hiring for the role of {job_title} at {company_name} in {location}, and we think your profile could be a fantastic match for our team.

We would love to invite you to review this opportunity and apply. Please accept this invitation to express your interest, and our hiring team will get in touch with you shortly.

Best regards,
Hiring Team at {company_name}`
  },
  {
    id: 'fast_track',
    name: 'Immediate Fast-Track Hiring',
    badge: 'Urgent',
    subject: '⚡ Fast-Track Interview Invite: {job_title} at {company_name}',
    message: `Hi {candidate_name},

Your qualifications and expertise strongly align with our immediate opening for {job_title} at {company_name}. 

We are actively scheduling interviews this week and would like to fast-track your candidacy. If you are open to exploring this role, please accept this Nvite to confirm your interest so we can connect right away.

Looking forward to your response!

Best regards,
Hiring Team at {company_name}`
  },
  {
    id: 'high_match',
    name: 'High-Match Profile Outreach',
    badge: 'High Match',
    subject: '🎯 You are a Top Match for {job_title} at {company_name}',
    message: `Hi {candidate_name},

Our recruitment team identified your profile as a top match for our open position: {job_title}. We value your experience and believe your skillset will enable you to make a meaningful impact at {company_name}.

Please take a moment to review the role details and accept this Nvite if you are interested. We would be delighted to consider your application.

Warm regards,
Hiring Team at {company_name}`
  },
  {
    id: 'custom',
    name: 'Custom Note',
    badge: 'Blank',
    subject: '⚡ Invitation to Apply: {job_title} at {company_name}',
    message: ''
  }
];

// Clean location helper (removes stringified array brackets like ["Bangalore","Chennai"])
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

export default function SendNviteModal({
  isOpen,
  onClose,
  candidates = [],
  onSuccess,
  initialJobId
}) {
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [isJobDropdownOpen, setIsJobDropdownOpen] = useState(false);
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const jobDropdownRef = useRef(null);
  const jobSearchInputRef = useRef(null);

  // Close dropdown on outside click & autofocus search input
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (jobDropdownRef.current && !jobDropdownRef.current.contains(e.target)) {
        setIsJobDropdownOpen(false);
      }
    };
    if (isJobDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => {
        if (jobSearchInputRef.current) jobSearchInputRef.current.focus();
      }, 50);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isJobDropdownOpen]);

  const [selectedTemplateId, setSelectedTemplateId] = useState('standard');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [validityDays, setValidityDays] = useState(14);
  const [shareContact, setShareContact] = useState(true);
  const [sending, setSending] = useState(false);

  // Get current recruiter profile from localStorage
  const currentRecruiter = useMemo(() => {
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('loginDetails');
        if (raw) return JSON.parse(raw);
      }
    } catch (e) {}
    return null;
  }, []);

  // Fetch recruiter's active jobs
  useEffect(() => {
    if (!isOpen) return;

    const fetchJobs = async () => {
      setLoadingJobs(true);
      try {
        const recruiterId = currentRecruiter?.id;
        const res = await getJobPostByUserId({
          user_id: recruiterId,
          limit: 100,
          page: 1,
          statuses: JSON.stringify(['Active', 'active', 'Pending', 'approved'])
        });

        const jobList = res?.data?.data || res?.data || [];
        // Filter out closed jobs
        const activeOnly = jobList.filter(j => !j.is_closed || j.is_closed === 0 || j.is_closed === false);
        setJobs(activeOnly.length > 0 ? activeOnly : jobList);

        if (initialJobId && jobList.some(j => String(j.id) === String(initialJobId))) {
          setSelectedJobId(String(initialJobId));
        } else if (activeOnly.length > 0) {
          setSelectedJobId(String(activeOnly[0].id));
        } else if (jobList.length > 0) {
          setSelectedJobId(String(jobList[0].id));
        }
      } catch (err) {
        console.error('Error fetching recruiter jobs:', err);
        message?.error?.('Failed to fetch active jobs') || CommonToaster('Failed to load active jobs', 'error');
      } finally {
        setLoadingJobs(false);
      }
    };

    fetchJobs();
  }, [isOpen, currentRecruiter]);

  // Selected job object
  const selectedJob = useMemo(() => {
    if (!selectedJobId || jobs.length === 0) return null;
    return jobs.find(j => String(j.id) === String(selectedJobId)) || null;
  }, [selectedJobId, jobs]);

  // Filtered jobs matching real-time search query
  const filteredJobs = useMemo(() => {
    if (!jobSearchQuery.trim()) return jobs;
    const query = jobSearchQuery.toLowerCase().trim();
    return jobs.filter(job => {
      const title = (job.job_title || job.title || '').toLowerCase();
      const company = (job.company_name || '').toLowerCase();
      const location = cleanLocation(job.work_location || job.location || '').toLowerCase();
      const nature = (job.job_nature || '').toLowerCase();
      const workplace = (job.workplace_type || '').toLowerCase();
      return title.includes(query) || company.includes(query) || location.includes(query) || nature.includes(query) || workplace.includes(query);
    });
  }, [jobs, jobSearchQuery]);

  // Handle template change
  useEffect(() => {
    const tmpl = TEMPLATES.find(t => t.id === selectedTemplateId) || TEMPLATES[0];
    const company = selectedJob?.company_name || currentRecruiter?.company_name || currentRecruiter?.organization || 'Our Company';
    const title = selectedJob?.job_title || 'Open Position';
    const location = selectedJob?.work_location || 'our offices';

    // Representative candidate name for preview
    const sampleCandName = candidates.length === 1
      ? (candidates[0].first_name || candidates[0].name || 'Candidate')
      : (candidates[0]?.first_name || '{candidate_name}');

    const filledSubject = tmpl.subject
      .replace(/{job_title}/gi, title)
      .replace(/{company_name}/gi, company)
      .replace(/{candidate_name}/gi, sampleCandName);

    const filledMessage = tmpl.message
      .replace(/{job_title}/gi, title)
      .replace(/{company_name}/gi, company)
      .replace(/{location}/gi, location)
      .replace(/{candidate_name}/gi, sampleCandName);

    setSubject(filledSubject);
    setMessage(filledMessage);
  }, [selectedTemplateId, selectedJob, candidates, currentRecruiter]);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!selectedJobId) {
      CommonToaster('Please select a job for this Nvite.', 'warning');
      return;
    }
    if (candidates.length === 0) {
      CommonToaster('No candidates selected.', 'warning');
      return;
    }
    if (!subject.trim()) {
      CommonToaster('Please enter an invitation subject.', 'warning');
      return;
    }

    setSending(true);
    try {
      const candidateIds = candidates.map(c => c.id || c.key).filter(Boolean);

      const payload = {
        jobId: Number(selectedJobId),
        candidateIds,
        subject: subject.trim(),
        message: message.trim(),
        templateType: selectedTemplateId,
        shareContact: shareContact ? 1 : 0,
        validityDays: Number(validityDays) || 14
      };

      const res = await sendNvitesAPI(payload);

      CommonToaster(
        res?.message || `Successfully sent Nvite to ${candidateIds.length} candidate(s)!`,
        'success'
      );

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error sending Nvites:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to send Nvite. Please try again.';
      CommonToaster(errMsg, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-xl border border-slate-200/90 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800"
        style={{ fontFamily: "var(--font-geist), 'Geist', sans-serif" }}
      >
        {/* Header with clean brand theme */}
        <div className="bg-[#0A66C2] px-5 py-3.5 text-white flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
              <Send size={15} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[16px] font-semibold tracking-tight text-white mb-0">
                  Send Candidate Nvite
                </h3>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-white/20 text-white">
                  {candidates.length} Candidate{candidates.length > 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-[12px] text-blue-100 font-normal mt-0.5 mb-0">
                Directly invite candidates to apply for your active job posting.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-[13px]">
          
          {/* Selected Candidates Pills */}
          <div>
            <label className="block text-[11.5px] font-medium uppercase tracking-wider text-slate-500 mb-1.5">
              Recipient Candidates ({candidates.length})
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto p-2 bg-slate-50 border border-slate-200/70 rounded-xl">
              {candidates.map((c, i) => {
                const name = c.name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || `Candidate #${c.id}`;
                return (
                  <div
                    key={c.id || i}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[12px] font-medium text-slate-700"
                  >
                    <div className="w-5 h-5 rounded-full bg-blue-50 text-[#0A66C2] flex items-center justify-center text-[10px] font-medium shrink-0">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <span>{name}</span>
                    {c.email && (
                      <span className="text-[11px] text-slate-400 font-normal">
                        ({c.email})
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 1: Select Active Job */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11.5px] font-medium uppercase tracking-wider text-slate-600">
                1. Select Active Job <span className="text-red-500">*</span>
              </label>
              {loadingJobs && (
                <span className="text-[11px] text-[#0A66C2] font-normal animate-pulse">
                  Loading jobs...
                </span>
              )}
            </div>

            <div className="relative" ref={jobDropdownRef}>
              {/* Searchable Select Trigger Button */}
              <button
                type="button"
                disabled={loadingJobs || jobs.length === 0}
                onClick={() => setIsJobDropdownOpen(prev => !prev)}
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-left text-[13px] transition-all flex items-center justify-between gap-2 cursor-pointer shadow-2xs ${
                  isJobDropdownOpen
                    ? 'border-[#0A66C2] ring-2 ring-[#0A66C2]/15'
                    : 'border-slate-300 hover:border-slate-400'
                } ${loadingJobs || jobs.length === 0 ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <Briefcase size={15} className="text-[#0A66C2] shrink-0" />
                  {selectedJob ? (
                    <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
                      <span className="font-semibold text-slate-900 truncate">
                        {selectedJob.job_title}
                      </span>
                      <span className="text-slate-400 text-[12px] shrink-0">—</span>
                      <span className="text-slate-600 text-[12.5px] truncate">
                        {selectedJob.company_name || 'My Company'}
                      </span>
                      {selectedJob.work_location && (
                        <span className="text-slate-400 text-[11.5px] shrink-0 truncate">
                          ({cleanLocation(selectedJob.work_location)})
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-400 font-normal">
                      {jobs.length === 0 ? 'No active jobs found - Please post a job first' : 'Search & select an active job...'}
                    </span>
                  )}
                </div>
                <ChevronDown
                  size={16}
                  className={`text-slate-400 transition-transform duration-200 shrink-0 ${
                    isJobDropdownOpen ? 'rotate-180 text-[#0A66C2]' : ''
                  }`}
                />
              </button>

              {/* Searchable Dropdown Popup */}
              {isJobDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in duration-100">
                  {/* Search Bar inside Dropdown */}
                  <div className="p-2 border-b border-slate-100 bg-slate-50/70 flex items-center gap-2">
                    <Search size={14} className="text-slate-400 shrink-0 ml-1.5" />
                    <input
                      ref={jobSearchInputRef}
                      type="text"
                      value={jobSearchQuery}
                      onChange={(e) => setJobSearchQuery(e.target.value)}
                      placeholder="Search jobs by title, company, or location..."
                      className="w-full bg-transparent text-[12.5px] text-slate-800 placeholder-slate-400 focus:outline-none py-0.5"
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setIsJobDropdownOpen(false);
                        }
                      }}
                    />
                    {jobSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setJobSearchQuery('')}
                        className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  {/* Scrollable Job List */}
                  <div className="max-h-60 overflow-y-auto p-1 divide-y divide-slate-50">
                    {filteredJobs.length === 0 ? (
                      <div className="py-6 text-center text-slate-400 text-[12px]">
                        No active jobs matching &quot;{jobSearchQuery}&quot;
                      </div>
                    ) : (
                      filteredJobs.map((job) => {
                        const isSelected = String(job.id) === String(selectedJobId);
                        const locClean = cleanLocation(job.work_location || job.location || '');
                        return (
                          <div
                            key={job.id}
                            onClick={() => {
                              setSelectedJobId(String(job.id));
                              setIsJobDropdownOpen(false);
                              setJobSearchQuery('');
                            }}
                            className={`p-2.5 rounded-lg cursor-pointer transition-colors flex items-start justify-between gap-3 ${
                              isSelected
                                ? 'bg-blue-50/90 text-[#0A66C2]'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[13px] font-semibold ${isSelected ? 'text-[#0A66C2]' : 'text-slate-900'}`}>
                                  {job.job_title}
                                </span>
                                {job.job_nature && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                                    {job.job_nature}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11.5px] text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="font-medium text-slate-600">
                                  {job.company_name || 'My Company'}
                                </span>
                                {locClean && (
                                  <>
                                    <span className="text-slate-300">•</span>
                                    <span className="flex items-center gap-1">
                                      <MapPin size={11} className="text-slate-400" />
                                      {locClean}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            {isSelected && (
                              <Check size={16} className="text-[#0A66C2] shrink-0 mt-0.5" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Dropdown Footer */}
                  <div className="px-3 py-1.5 bg-slate-50/80 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between items-center font-normal">
                    <span>{filteredJobs.length} active job{filteredJobs.length !== 1 ? 's' : ''} available</span>
                    <span className="text-[10px] text-slate-400">Esc to close</span>
                  </div>
                </div>
              )}
            </div>

            {/* Selected Job Mini Preview Card */}
            {selectedJob && (
              <div className="mt-2 p-3 bg-slate-50/80 border border-slate-200/70 rounded-xl flex flex-col gap-1.5">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-[13.5px] font-medium text-slate-900 mb-0.5">
                      {selectedJob.job_title}
                    </h4>
                    <span className="text-[11.5px] font-normal text-slate-500 flex items-center gap-1.5">
                      <Building2 size={12} className="text-slate-400" />
                      {selectedJob.company_name || 'Verified Employer'}
                    </span>
                  </div>
                  <span className="text-[10.5px] font-normal px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/60">
                    {selectedJob.job_nature || 'Full Time'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-[11.5px] text-slate-500 font-normal pt-1 border-t border-slate-200/60">
                  <span className="flex items-center gap-1">
                    <MapPin size={11} className="text-slate-400" />
                    {selectedJob.work_location || 'Not Specified'}
                    {selectedJob.workplace_type ? ` (${selectedJob.workplace_type})` : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase size={11} className="text-slate-400" />
                    Exp: {selectedJob.experience_required || 'Open to All'}
                  </span>
                  {(selectedJob.min_salary || selectedJob.max_salary) && (
                    <span className="font-medium text-emerald-700">
                      💰 {selectedJob.currency || '₹'}{selectedJob.min_salary || 0} - {selectedJob.max_salary || 0} {selectedJob.salary_type || ''}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Choose Template */}
          <div>
            <label className="block text-[11.5px] font-medium uppercase tracking-wider text-slate-600 mb-1.5">
              2. Choose Invitation Template
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TEMPLATES.map((tmpl) => {
                const isSelected = selectedTemplateId === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => setSelectedTemplateId(tmpl.id)}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#0A66C2] bg-blue-50/60 text-[#0A66C2] ring-1 ring-[#0A66C2]'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-[12px] font-medium line-clamp-1">
                      {tmpl.name}
                    </span>
                    <span
                      className={`text-[9.5px] font-medium px-1.5 py-0.2 rounded mt-1.5 w-fit ${
                        isSelected
                          ? 'bg-[#0A66C2] text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {tmpl.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Subject & Message Body */}
          <div className="space-y-2.5">
            <div>
              <label className="block text-[11.5px] font-medium uppercase tracking-wider text-slate-600 mb-1">
                Invitation Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Opportunity: Senior Developer"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 text-[13px] font-normal focus:ring-2 focus:ring-[#0A66C2]/15 focus:border-[#0A66C2] outline-none transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11.5px] font-medium uppercase tracking-wider text-slate-600">
                  Personalized Message to Candidate
                </label>
                <span className="text-[11px] text-slate-400 font-normal">
                  {message.length} characters
                </span>
              </div>
              <textarea
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your invitation note or edit the template..."
                className="w-full p-3 bg-white border border-slate-200 rounded-lg text-slate-800 text-[13px] font-normal leading-relaxed focus:ring-2 focus:ring-[#0A66C2]/15 focus:border-[#0A66C2] outline-none transition-all resize-none"
              />
              <p className="text-[11px] text-slate-400 mt-1 mb-0 font-normal">
                Tip: Dynamic placeholders supported: <code className="text-[#0A66C2] bg-blue-50 px-1 py-0.5 rounded">&#123;candidate_name&#125;</code> and <code className="text-[#0A66C2] bg-blue-50 px-1 py-0.5 rounded">&#123;job_title&#125;</code>.
              </p>
            </div>
          </div>

          {/* Step 4: Validity & Contact Share Settings */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* Validity Dropdown */}
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-[#0A66C2]" />
              <span className="text-[12px] font-medium text-slate-700">Expires in:</span>
              <select
                value={validityDays}
                onChange={(e) => setValidityDays(Number(e.target.value))}
                className="px-2 py-1 bg-white border border-slate-200 rounded-md text-[12px] font-normal text-slate-800 focus:ring-2 focus:ring-[#0A66C2]/15 focus:border-[#0A66C2] outline-none cursor-pointer"
              >
                <option value={7}>7 Days</option>
                <option value={14}>14 Days (Recommended)</option>
                <option value={30}>30 Days</option>
              </select>
            </div>

            {/* Share Recruiter Contact Toggle */}
            <label className="flex items-center gap-2 text-[12px] font-normal text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={shareContact}
                onChange={(e) => setShareContact(e.target.checked)}
                className="w-3.5 h-3.5 accent-[#0A66C2] rounded border-slate-300 focus:ring-[#0A66C2]/20 cursor-pointer"
              />
              <span>Share my direct recruiter contact (Email/Phone)</span>
            </label>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-200/80 flex items-center justify-between shrink-0">
          <div className="text-[11.5px] text-slate-400 hidden sm:block font-normal">
            Candidates receive an email with 1-click apply.
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={sending}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-medium text-[12.5px] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || jobs.length === 0}
              className="px-4 py-1.5 rounded-lg bg-[#0A66C2] hover:bg-[#084e96] text-white font-medium text-[12.5px] shadow-2xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {sending ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send size={13} />
                  <span>Send Nvite ({candidates.length})</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

