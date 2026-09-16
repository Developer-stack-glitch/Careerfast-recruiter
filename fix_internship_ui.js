const fs = require('fs');
const path = 'c:\\Users\\dell\\Documents\\Careerfast\\careerfast-frontend\\src\\HR\\PostInternship.jsx';
let content = fs.readFileSync(path, 'utf8');

// The chunk we want to MOVE from step 0
const startIndex = content.indexOf('                            <div>\r\n                                <label className="block text-[14px] font-bold text-[#374151] mb-2">Employment type</label>');
const endIndexStr = '                                    </button>\r\n                                </div>\r\n                            </div>\r\n\r\n\r\n                        </div>';
const endIndex = content.indexOf(endIndexStr, startIndex);

if (startIndex === -1 || endIndex === -1) {
    console.log("Could not find start or end index for chunk to move");
    // Fallback: try with \n instead of \r\n
    const startIndexN = content.indexOf('                            <div>\n                                <label className="block text-[14px] font-bold text-[#374151] mb-2">Employment type</label>');
    const endIndexStrN = '                                    </button>\n                                </div>\n                            </div>\n\n\n                        </div>';
    const endIndexN = content.indexOf(endIndexStrN, startIndexN);
    if (startIndexN !== -1 && endIndexN !== -1) {
        processChunk(startIndexN, endIndexN, endIndexStrN.length);
    } else {
        console.log("Still could not find with \\n");
    }
} else {
    processChunk(startIndex, endIndex, endIndexStr.length);
}

function processChunk(start, end, endLength) {
    const originalChunk = content.substring(start, end + endLength);
    // Remove "Employment type" from the chunk since we don't want it in step 1 anymore (replaced by internship type)
    // Actually, let's just keep Employment type in step 0, wait! 
    // The design for step 1 was: Work mode, Location, Industry, Vacancies.
    // So let's split the chunk to drop Employment type.
    
    // We will just replace originalChunk with new fields in Step 0.
    const step0NewFields = `
                            <div>
                                <label className="block text-[14px] font-bold text-[#374151] mb-2">Role <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={jobTitle} 
                                    onChange={(e) => setJobTitle(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-[#0A66C2] outline-none text-[15px]"
                                    placeholder="e.g. Frontend Developer"
                                />
                            </div>

                            <div>
                                <label className="block text-[14px] font-bold text-[#374151] mb-2">Internship type</label>
                                <div className="flex gap-4">
                                    {['Full time', 'Part time'].map(type => (
                                        <button
                                            key={type}
                                            onClick={(e) => { e.preventDefault(); setEmploymentType(type); }}
                                            className={\`px-6 py-2 rounded-full border text-[14px] font-medium transition-all \${employmentType === type ? 'border-[#0A66C2] text-[#0A66C2] bg-white' : 'border-[#d1d5db] text-[#4b5563] bg-white'}\`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[14px] font-bold text-[#374151] mb-2">Internship duration</label>
                                <Select
                                    className="w-full custom-department-select"
                                    size="large"
                                    placeholder="Select Duration"
                                    value={jobInternshipDuration}
                                    onChange={setJobInternshipDuration}
                                    options={[1,2,3,4,5,6].map(m => ({ label: m + " Months", value: m + " Months" }))}
                                />
                            </div>

                            <div>
                                <label className="block text-[14px] font-bold text-[#374151] mb-2">When would the internship start?</label>
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

                            {internshipStart === 'specific' && (
                                <div>
                                    <label className="block text-[14px] font-bold text-[#374151] mb-2">Internship will start within</label>
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

                            <div>
                                <label className="block text-[14px] font-bold text-[#374151] mb-2">Are you offering a stipend with the internship?</label>
                                <div className="flex gap-4 mb-4">
                                    <button
                                        onClick={(e) => { e.preventDefault(); setStipendOffered('Yes'); }}
                                        className={\`px-6 py-2 rounded-full border text-[14px] font-medium transition-all \${stipendOffered === 'Yes' ? 'border-[#0A66C2] text-[#0A66C2] bg-white' : 'border-[#d1d5db] text-[#4b5563] bg-white'}\`}
                                    >
                                        Yes
                                    </button>
                                    <button
                                        onClick={(e) => { e.preventDefault(); setStipendOffered('No'); }}
                                        className={\`px-6 py-2 rounded-full border text-[14px] font-medium transition-all \${stipendOffered === 'No' ? 'border-[#0A66C2] text-[#0A66C2] bg-white' : 'border-[#d1d5db] text-[#4b5563] bg-white'}\`}
                                    >
                                        No
                                    </button>
                                </div>
                                
                                {stipendOffered === 'Yes' && (
                                    <div className="flex items-center gap-4 border border-gray-300 rounded-lg px-3 py-2.5 max-w-sm focus-within:border-[#0A66C2]">
                                        <span className="text-gray-500">₹</span>
                                        <input 
                                            type="number" 
                                            placeholder="e.g. 7000" 
                                            className="outline-none w-full text-[15px]"
                                            value={stipendAmount}
                                            onChange={(e) => setStipendAmount(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-[14px] font-bold text-[#374151] mb-2">Last date to apply <span className="text-gray-400 font-normal">(Optional)</span></label>
                                <DatePicker 
                                    size="large"
                                    className="w-full max-w-sm custom-department-select" 
                                    onChange={(date, dateString) => setLastDateToApply(dateString)} 
                                />
                            </div>
                        </div>`;
    
    // Replace originalChunk in content with step0NewFields
    content = content.replace(originalChunk, step0NewFields);
    
    // Extract Work mode, Job location, Your industry, Vacancies from originalChunk
    // Work mode starts at "                            <div>\\r?\\n                                <label className="block text-\\[14px\\] font-bold text-\\[#374151\\] mb-2">Work mode</label>"
    const workModeStartIndex = originalChunk.indexOf('                            <div>\r\n                                <label className="block text-[14px] font-bold text-[#374151] mb-2">Work mode</label>') !== -1 
        ? originalChunk.indexOf('                            <div>\r\n                                <label className="block text-[14px] font-bold text-[#374151] mb-2">Work mode</label>')
        : originalChunk.indexOf('                            <div>\n                                <label className="block text-[14px] font-bold text-[#374151] mb-2">Work mode</label>');
        
    let fieldsForStep1 = "";
    if (workModeStartIndex !== -1) {
        fieldsForStep1 = originalChunk.substring(workModeStartIndex, originalChunk.length - 28); // remove the trailing </div> of step 0
    }
    
    // Insert fieldsForStep1 into Step 1, right after Candidate preferences
    const step1Marker = '<h2 className="text-2xl font-semibold text-gray-900">Candidate preferences</h2>\r\n                        </div>\r\n\r\n                        <div className="space-y-6">';
    const step1MarkerN = '<h2 className="text-2xl font-semibold text-gray-900">Candidate preferences</h2>\n                        </div>\n\n                        <div className="space-y-6">';
    
    if (content.includes(step1Marker)) {
        content = content.replace(step1Marker, step1Marker + '\r\n' + fieldsForStep1);
        fs.writeFileSync(path, content, 'utf8');
        console.log("Successfully replaced steps (CRLF)!");
    } else if (content.includes(step1MarkerN)) {
        content = content.replace(step1MarkerN, step1MarkerN + '\n' + fieldsForStep1);
        fs.writeFileSync(path, content, 'utf8');
        console.log("Successfully replaced steps (LF)!");
    } else {
        console.log("Could not find Candidate preferences marker to inject Step 1 fields");
    }
}
