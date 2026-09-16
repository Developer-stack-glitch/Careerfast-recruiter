const fs = require('fs');
const path = 'c:\\Users\\dell\\Documents\\Careerfast\\careerfast-frontend\\src\\HR\\PostInternship.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add specificStartDate state
const stateTarget = `    const [internshipStartWithin, setInternshipStartWithin] = useState("0-1 month");\r\n    const [lastDateToApply, setLastDateToApply] = useState(null);`;
const stateTargetN = `    const [internshipStartWithin, setInternshipStartWithin] = useState("0-1 month");\n    const [lastDateToApply, setLastDateToApply] = useState(null);`;

const stateReplacement = `    const [internshipStartWithin, setInternshipStartWithin] = useState("0-1 month");
    const [specificStartDate, setSpecificStartDate] = useState(null);
    const [lastDateToApply, setLastDateToApply] = useState(null);`;

if (content.includes(stateTarget)) {
    content = content.replace(stateTarget, stateReplacement);
} else if (content.includes(stateTargetN)) {
    content = content.replace(stateTargetN, stateReplacement);
} else {
    // maybe already added?
}

// 2. Fix the UI block
// First let's extract the exact block to replace. We can use a regex because the content is unique.
const uiRegex = /<div>\s*<label className="block text-\[14px\] font-bold text-\[#374151\] mb-2">When would the internship start\?<\/label>[\s\S]*?\{internshipStart === 'specific' && \([\s\S]*?<\/div>\s*\)\}/m;

const newUIBlock = `<div>
                                <label className="block text-[15px] text-[#374151] mb-2">When would the internship start?</label>
                                <div className="flex gap-4">
                                    <button
                                        onClick={(e) => { e.preventDefault(); setInternshipStart('specific'); }}
                                        className={\`px-6 py-2 rounded-full border text-[14px] font-medium transition-all \${internshipStart === 'specific' ? 'border-[#0A66C2] text-[#0A66C2] bg-white' : 'border-[#d1d5db] text-[#4b5563] bg-white'}\`}
                                    >
                                        On a specific date
                                    </button>
                                    <button
                                        onClick={(e) => { e.preventDefault(); setInternshipStart('no_specific'); }}
                                        className={\`px-6 py-2 rounded-full border text-[14px] font-medium transition-all \${internshipStart === 'no_specific' ? 'border-[#0A66C2] text-[#0A66C2] bg-white' : 'border-[#d1d5db] text-[#4b5563] bg-white'}\`}
                                    >
                                        No specific start date
                                    </button>
                                </div>
                            </div>

                            {internshipStart === 'no_specific' && (
                                <div>
                                    <label className="block text-[15px] text-[#374151] mb-2 mt-2">Internship will start within</label>
                                    <div className="flex gap-4">
                                        {['0-1 month', '1-3 months', '3-6 months'].map((opt) => (
                                            <button
                                                key={opt}
                                                onClick={(e) => { e.preventDefault(); setInternshipStartWithin(opt); }}
                                                className={\`px-6 py-2 rounded-full border text-[14px] font-medium transition-all \${internshipStartWithin === opt ? 'border-[#0A66C2] text-[#0A66C2] bg-white' : 'border-[#d1d5db] text-[#4b5563] bg-white'}\`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {internshipStart === 'specific' && (
                                <div>
                                    <label className="block text-[15px] text-[#374151] mb-2 mt-2">Please specify the start date</label>
                                    <DatePicker 
                                        size="large"
                                        placeholder="Select date"
                                        className="w-full custom-department-select" 
                                        onChange={(date, dateString) => setSpecificStartDate(dateString)} 
                                    />
                                </div>
                            )}`;

if (uiRegex.test(content)) {
    content = content.replace(uiRegex, newUIBlock);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Successfully fixed start date UI!");
} else {
    console.log("Could not find the UI block with regex.");
}
