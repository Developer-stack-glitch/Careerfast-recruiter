const fs = require('fs');
const path = 'c:\\Users\\dell\\Documents\\Careerfast\\careerfast-frontend\\src\\HR\\PostInternship.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Ensure states exist for Locality and Perks
const stateInjection = `    const [locality, setLocality] = useState("");\r\n    const [internshipPerks, setInternshipPerks] = useState([]);`;
const stateInjectionN = `    const [locality, setLocality] = useState("");\n    const [internshipPerks, setInternshipPerks] = useState([]);`;

const stateTarget = `    const [specificStartDate, setSpecificStartDate] = useState(null);`;
if (!content.includes('const [locality, setLocality] = useState("");')) {
    if (content.includes(stateTarget)) {
        content = content.replace(stateTarget, stateTarget + '\r\n' + stateInjection);
    }
}

// 2. We need to grab the block from "Work mode" to "No. of vacancies for this job" in Step 1.
// Let's use regex to find the start and end of this block.
const workModeRegex = /<div>\s*<label className="block text-\[14px\] font-bold text-\[#374151\] mb-2">Work mode<\/label>[\s\S]*?<label className="block text-\[15px\] font-semibold text-gray-700 mb-2">No\. of vacancies for this job<\/label>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/m;

const match = content.match(workModeRegex);

if (match) {
    let blockToMove = match[0];
    
    // Remove the block from Step 1
    content = content.replace(blockToMove, '');
    
    // Modify the block according to the new requirements
    
    // Change "Job location (max. 9)" to "Internship location"
    blockToMove = blockToMove.replace('Job location (max. 9)', 'Internship location');
    
    // Insert Locality after the location section. The location section ends with the checkbox label.
    const localityUI = `
                            <div>
                                <label className="block text-[14px] font-bold text-[#374151] mb-2 mt-4">Locality <span className="text-gray-400 font-normal">(Optional)</span></label>
                                <input
                                    type="text"
                                    value={locality}
                                    onChange={(e) => setLocality(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-[#0A66C2] outline-none text-[15px]"
                                    placeholder="Search and add localities"
                                />
                            </div>`;
                            
    blockToMove = blockToMove.replace('</label>\r\n                            </div>', '</label>\r\n                            </div>' + localityUI);
    blockToMove = blockToMove.replace('</label>\n                            </div>', '</label>\n                            </div>' + localityUI);
    
    // Insert Perks and benefits after Your industry
    const perksUI = `
                            <div>
                                <label className="block text-[14px] font-bold text-[#374151] mb-2 mt-4">Perks and benefits <span className="text-gray-400 font-normal">(Optional)</span></label>
                                <Select
                                    mode="tags"
                                    className="w-full custom-benefits-select"
                                    size="large"
                                    placeholder="Mention the benefits the company offers to the interns"
                                    value={internshipPerks}
                                    onChange={setInternshipPerks}
                                    options={[]}
                                    open={false}
                                />
                                <div className="mt-2">
                                    <p className="text-[13px] text-[#0e2c53] mb-2 font-medium">Suggestions</p>
                                    <div className="flex flex-wrap gap-2.5">
                                        {["Certificate", "Flexible hours", "Letter of recommendation", "Job offer", "Report to founder", "College credits"].map(perk => (
                                            <button
                                                key={perk}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (!internshipPerks.includes(perk)) setInternshipPerks([...internshipPerks, perk]);
                                                }}
                                                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-dashed border-gray-300 text-gray-600 bg-white hover:border-[#0A66C2] hover:text-[#0A66C2] transition-colors text-[14px]"
                                            >
                                                <PlusOutlined className="text-[12px]" /> {perk}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>`;
                            
    const industryEndStr = '/>\r\n                            </div>';
    const industryEndStrN = '/>\n                            </div>';
    
    if (blockToMove.includes(industryEndStr)) {
        blockToMove = blockToMove.replace(industryEndStr, industryEndStr + perksUI);
    } else if (blockToMove.includes(industryEndStrN)) {
        blockToMove = blockToMove.replace(industryEndStrN, industryEndStrN + perksUI);
    }
    
    // Change No. of vacancies text
    blockToMove = blockToMove.replace('No. of vacancies for this job', 'No. of vacancies for this internship');
    
    // Now we need to append this modified block to the end of Step 0.
    // The end of Step 0 is marked by:
    // onChange={(date, dateString) => setLastDateToApply(dateString)} 
    // />
    // </div>
    // </div>
    // </motion.div>
    
    const endOfStep0Regex = /(<DatePicker[\s\S]*?onChange=\{\(date, dateString\) => setLastDateToApply\(dateString\)\}[\s\S]*?\/>\s*<\/div>)/m;
    
    if (endOfStep0Regex.test(content)) {
        content = content.replace(endOfStep0Regex, '$1\\n\\n' + blockToMove);
        fs.writeFileSync(path, content, 'utf8');
        console.log("Successfully moved Work mode and added Locality/Perks to Step 0!");
    } else {
        console.log("Could not find the end of Step 0.");
    }
    
} else {
    console.log("Could not find the Work mode block in Step 1.");
}
