const fs = require('fs');
const path = 'c:\\Users\\dell\\Documents\\Careerfast\\careerfast-frontend\\src\\HR\\PostInternship.jsx';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// Find the damaged area - line 551 (0-indexed 550) starts "const getDurationTypesData"
// We need to replace from line 551 through line 556 (the broken area)
// with the correct functions

const replacementBlock = `    const getDurationTypesData = async () => {
        try {
            const response = await getDurationTypes();
            setInternshipDurationTypeData(response?.data?.data || []);
        } catch (error) { console.log(error); }
    };

    const getDurationData = async (durationId) => {
        try {
            const response = await getDuration({ duration_type_id: durationId });
            setIntershipDuration(response?.data?.data || []);
        } catch (error) { console.log(error); }
    };

    const getWorkPlaceLocationData = async () => {
        try {
            const response = await getWorkPlaceLocation();
            setWorkplaceLocation(response?.data?.data || []);
        } catch (error) { console.log(error); }
    };

    // Form Navigation
    const handleNext = () => {
        // Form validation
        if (currentStep === 0) {
            const jobTitleValidate = nameValidator(jobTitle);

            let minExpErr = "";
            let maxExpErr = "";
            let salMinErr = "";
            let salMaxErr = "";

            // Experience and salary validations only apply to regular jobs, not internships
            const isInternship = STEPS.some(s => s.title === 'Internship details');
            if (!isInternship) {
                if (!freshersAllowed) {
                    if (minExp === null) minExpErr = "Please select minimum experience";
                    if (maxExp === null) maxExpErr = "Please select maximum experience";
                    if (minExp !== null && maxExp !== null && minExp > maxExp) maxExpErr = "Max must be greater than Min";
                }

                if (!hideSalary) {
                    if (salaryMin !== null && salaryMin !== "" && salaryMin < 5000) salMinErr = "Minimum monthly salary must be greater than ₹5,000";
                    if (salaryMin !== null && salaryMin !== "" && salaryMax !== null && salaryMax !== "" && salaryMin > salaryMax) salMaxErr = "Max salary must be greater than Min";
                }
            }

            setJobTitleError(jobTitleValidate);
            setMinExpError(minExpErr);
            setMaxExpError(maxExpErr);
            setSalaryMinError(salMinErr);
            setSalaryMaxError(salMaxErr);

            if (jobTitleValidate || minExpErr || maxExpErr || salMinErr || salMaxErr) return;
        }

        if (!completedSteps.includes(currentStep)) {
            setCompletedSteps([...completedSteps, currentStep]);
        }
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
            window.scrollTo(0, 0);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
            window.scrollTo(0, 0);
        } else {
            navigate(-1);
        }
    };

    // UI Helpers
    const toggleBenefitSelection = (key) => {
        setSelectedBenefits((prevSelected) =>
            prevSelected.includes(key)
                ? prevSelected.filter((item) => item !== key)
                : [...prevSelected, key]
        );
    };`;

// Find line 550 (0-indexed) which is "    const getDurationTypesData = async () => {"
// And line 555 (0-indexed) which is "    };"  - the end of the broken toggleBenefitSelection
// We need to replace lines 550-555 (0-indexed) = lines 551-556 (1-indexed)

let startIdx = -1;
let endIdx = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const getDurationTypesData = async ()') && startIdx === -1) {
        startIdx = i;
    }
    // Find the toggleLanguageSelection - the broken area ends right before it
    if (lines[i].includes('const toggleLanguageSelection = (key)') && startIdx !== -1) {
        endIdx = i;
        break;
    }
}

if (startIdx !== -1 && endIdx !== -1) {
    console.log(`Replacing lines ${startIdx + 1} to ${endIdx} (0-indexed: ${startIdx} to ${endIdx - 1})`);
    console.log(`Original content being replaced:`);
    for (let i = startIdx; i < endIdx; i++) {
        console.log(`  ${i + 1}: ${lines[i].trimEnd()}`);
    }
    
    const newLines = replacementBlock.split('\n').map(l => l + '\r');
    lines.splice(startIdx, endIdx - startIdx, ...newLines);
    
    fs.writeFileSync(path, lines.join('\n'), 'utf8');
    console.log('\nSuccessfully restored all functions!');
} else {
    console.log(`Could not find markers. startIdx=${startIdx}, endIdx=${endIdx}`);
}
