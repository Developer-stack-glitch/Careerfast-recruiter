const fs = require('fs');
const path = 'c:\\Users\\dell\\Documents\\Careerfast\\careerfast-frontend\\src\\HR\\PostInternship.jsx';

let content = fs.readFileSync(path, 'utf8');

// 1. Add state variables for internship
const stateVarInjection = `
    const [stipendOffered, setStipendOffered] = useState("Yes");
    const [stipendAmount, setStipendAmount] = useState("");
    const [internshipStart, setInternshipStart] = useState("specific");
    const [internshipStartWithin, setInternshipStartWithin] = useState("0-1 month");
    const [lastDateToApply, setLastDateToApply] = useState(null);
`;
content = content.replace('const [isExternalApply, setIsExternalApply] = useState(false);', 'const [isExternalApply, setIsExternalApply] = useState(false);' + stateVarInjection);

// 2. Update Payload
const payloadInjection = `
            stipend_type: stipendOffered,
            stipend_amount: stipendAmount,
            internship_start_type: internshipStart,
            internship_start_date: internshipStartWithin,
            last_date_to_apply: lastDateToApply,
`;
content = content.replace('workplace_type: workMode,', 'workplace_type: workMode,' + payloadInjection);

// 3. UI Changes - Step 0: Replace Compensation with Stipend, and add Start Date logic
// Let's find the Compensation section in Step 0.
const compensationRegex = /<div className="mb-6">\s*<p className="font-semibold mb-2">Compensation<\/p>[\s\S]*?(?=<\/div>\s*<\/div>\s*<\/div>\s*\{step === 1)/;

const newStipendUI = `
                        <div className="mb-6">
                            <p className="font-semibold mb-2">When would the internship start?</p>
                            <div className="flex gap-4">
                                <button
                                    className={\`px-4 py-2 border rounded-full \${internshipStart === 'specific' ? 'bg-[#f1f6ff] text-[#2272e7] border-[#2272e7]' : 'bg-white'}\`}
                                    onClick={() => setInternshipStart('specific')}
                                >
                                    On a specific date
                                </button>
                                <button
                                    className={\`px-4 py-2 border rounded-full \${internshipStart === 'no_specific' ? 'bg-[#f1f6ff] text-[#2272e7] border-[#2272e7]' : 'bg-white'}\`}
                                    onClick={() => setInternshipStart('no_specific')}
                                >
                                    No specific start date
                                </button>
                            </div>
                        </div>

                        {internshipStart === 'specific' && (
                            <div className="mb-6">
                                <p className="font-semibold mb-2">Internship will start within</p>
                                <div className="flex gap-4">
                                    {['0-1 month', '1-3 months', '3-6 months'].map((opt) => (
                                        <button
                                            key={opt}
                                            className={\`px-4 py-2 border rounded-full \${internshipStartWithin === opt ? 'bg-[#f1f6ff] text-[#2272e7] border-[#2272e7]' : 'bg-white'}\`}
                                            onClick={() => setInternshipStartWithin(opt)}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mb-6">
                            <p className="font-semibold mb-2">Are you offering a stipend with the internship?</p>
                            <div className="flex gap-4 mb-4">
                                <button
                                    className={\`px-4 py-2 border rounded-full \${stipendOffered === 'Yes' ? 'bg-[#f1f6ff] text-[#2272e7] border-[#2272e7]' : 'bg-white'}\`}
                                    onClick={() => setStipendOffered('Yes')}
                                >
                                    Yes
                                </button>
                                <button
                                    className={\`px-4 py-2 border rounded-full \${stipendOffered === 'No' ? 'bg-[#f1f6ff] text-[#2272e7] border-[#2272e7]' : 'bg-white'}\`}
                                    onClick={() => setStipendOffered('No')}
                                >
                                    No
                                </button>
                            </div>
                            
                            {stipendOffered === 'Yes' && (
                                <div className="flex items-center gap-4 border rounded p-2 max-w-sm">
                                    <span className="text-gray-500">₹</span>
                                    <input 
                                        type="number" 
                                        placeholder="7,000" 
                                        className="outline-none w-full"
                                        value={stipendAmount}
                                        onChange={(e) => setStipendAmount(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="mb-6">
                            <p className="font-semibold mb-2">Last date to apply <span className="text-gray-400 font-normal">(Optional)</span></p>
                            <DatePicker 
                                className="w-full max-w-sm" 
                                onChange={(date, dateString) => setLastDateToApply(dateString)} 
                            />
                        </div>
`;

content = content.replace(compensationRegex, newStipendUI + '\n</div>\n                            </div>\n                        </div>');

// 4. Step 1: Remove Experience Section completely.
const experienceRegex = /<div className="mb-6">\s*<p className="font-semibold mb-2">\s*Experience\s*<\/p>[\s\S]*?(?=<\/div>\s*<div className="mb-6">\s*<p className="font-semibold mb-2">\s*Work mode)/;
content = content.replace(experienceRegex, "");

fs.writeFileSync(path, content, 'utf8');
console.log("PostInternship.jsx updated successfully");
