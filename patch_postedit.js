const fs = require('fs');
let postingCode = fs.readFileSync('src/HR/Posting.jsx', 'utf8');

// Replace createJobPost with updateJobPosting
postingCode = postingCode.replace(/createJobPost/g, 'updateJobPosting');
if (!postingCode.includes('getJobPosts')) {
  postingCode = postingCode.replace('import {\n    updateJobPosting,', 'import {\n    updateJobPosting,\n    getJobPosts,');
}

// Add useParams import
postingCode = postingCode.replace('import { useNavigate } from "@/routing-shim";', 'import { useNavigate, useParams } from "@/routing-shim";');

// Change function name
postingCode = postingCode.replace('export default function Posting() {', 'export default function PostEdit() {\n    const { id } = useParams();');

// Inject useEffect for fetching and populating data
const fetchEffect = `
    useEffect(() => {
        if (id) {
            fetchJobDetails(id);
        }
    }, [id]);

    const fetchJobDetails = async (jobId) => {
        try {
            setPageLoading(true);
            const response = await getJobPosts({ id: jobId });
            const jobs = response?.data?.data?.data || [];
            const job = jobs.find(j => j.id.toString() === jobId);
            
            if (job) {
                setCompanyName(job.company_name || "");
                setLogoUrl(job.company_logo || null);
                setJobTitle(job.job_title || "");
                setRole(job.role || "");
                setIndustry(job.industry || "");
                setEmploymentType(job.employment_type || "Full Time, Permanent");
                setWillingToRelocate(job.willing_to_relocate || false);
                setHybridPolicy(job.hybrid_policy || "");
                setWorkMode(job.workplace_type === "In Office" ? "In office" : (job.workplace_type === "Hybrid" ? "Hybrid" : "Work from home"));
                
                if (job.job_category) {
                    const cats = Array.isArray(job.job_category) ? job.job_category : [job.job_category];
                    if (cats.length > 0) setDepartment(cats[0]);
                }
                
                setSkillsRequired(job.skills || []);
                
                if (job.experience_type === "Fresher") {
                    setFreshersAllowed(true);
                } else {
                    setFreshersAllowed(false);
                    const expReq = Array.isArray(job.experience_required) ? job.experience_required[0] : job.experience_required;
                    if (expReq && expReq.includes("-")) {
                        const parts = expReq.split("-");
                        if (parts.length === 2) {
                            setMinExp(parseInt(parts[0]));
                            setMaxExp(parseInt(parts[1].replace(" Years", "")));
                        }
                    } else {
                        setExperienceRequired(expReq || "");
                    }
                }
                
                setSalaryType(job.salary_type || "Total CTC");
                setHideSalary(job.hide_salary || false);
                setCurrency(job.currency || "INR");
                setSalaryMin(job.min_salary || null);
                setSalaryMax(job.max_salary || null);
                setFixedFormat(job.fixed_format || "Annually");
                setVariableAmount(job.variable_amount || "");
                setVariableFormat(job.variable_format || "Annually");
                if (job.bonus_amount) {
                    setShowBonus(true);
                    setBonusAmount(job.bonus_amount);
                    setBonusFormat(job.bonus_format || "Annually");
                }
                setSalaryDuration(job.salary_duration || "Annual");
                
                if (job.diversity_hiring && job.diversity_hiring.length > 0) {
                    const div = Array.isArray(job.diversity_hiring) ? job.diversity_hiring[0] : job.diversity_hiring;
                    if (div === "Male") setGenderPreference("Male");
                    else if (div === "Female") setGenderPreference("Female");
                    else setGenderPreference("Any");
                }
                
                setSelectedBenefits(job.benefits || []);
                setJobOpenings(job.openings || 1);
                setWorkingDaysName(job.working_days || "");
                if (job.job_description) {
                    setValue(job.job_description);
                }
                setSeoDescription(job.seo_description || "");
                if (job.questions) {
                    setPostQuestions(job.questions);
                }
            }
        } catch (error) {
            console.error("Error fetching job:", error);
            // toast.error("Failed to load job details");
        } finally {
            setPageLoading(false);
        }
    };
`;

postingCode = postingCode.replace('const handleCompanySearch', fetchEffect + '\\n    const handleCompanySearch');

// Add job_post_id to payload
postingCode = postingCode.replace('user_id: getUserDetails.id,', 'user_id: getUserDetails.id,\n            job_post_id: id,');

fs.writeFileSync('src/HR/PostEdit.jsx', postingCode);
console.log('patched PostEdit.jsx');
