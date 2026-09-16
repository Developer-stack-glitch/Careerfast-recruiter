const fs = require('fs');

const filePath = 'C:\\Users\\dell\\Documents\\Careerfast\\careerfast-frontend\\src\\HR\\PostEdit.jsx';

let content = fs.readFileSync(filePath, 'utf8');

const activeClass = 'flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all duration-200 font-medium text-sm bg-[#5f2eea] text-white border-[#5f2eea] shadow-md';
const inactiveClass = 'flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all duration-200 font-medium text-sm bg-white text-gray-700 border-gray-200 hover:border-[#5f2eea] hover:text-[#5f2eea] hover:bg-[#5f2eea]/5';

const replacements = [
    ['job_nature_button_active', activeClass],
    ['job_nature_button', inactiveClass],
    ['internship_duration_button_active', activeClass],
    ['internship_duration_button', inactiveClass],
    ['weeks_button_active', activeClass],
    ['weeks_button', inactiveClass],
    ['work_type_button_active', activeClass],
    ['work_type_button', inactiveClass],
    ['work_location_button_active', activeClass],
    ['work_location_button', inactiveClass],
    ['experience_required_button_active', activeClass],
    ['experience_required_button', inactiveClass],
    ['fresher_pass_button_active', activeClass],
    ['fresher_pass_button', inactiveClass]
];

for (const [oldClass, newClass] of replacements) {
    const regex1 = new RegExp(`"${oldClass}"`, 'g');
    const regex2 = new RegExp(`'${oldClass}'`, 'g');
    content = content.replace(regex1, `"${newClass}"`);
    content = content.replace(regex2, `"${newClass}"`);
}

const containerReplacements = [
    ['className="job_nature"', 'className="flex flex-wrap gap-3"'],
    ['className="work_type"', 'className="flex flex-wrap gap-3"'],
    ['className="basicdetails_edit"', 'className="space-y-6 max-w-3xl animate-fadeIn"'],
    ['className="salary_details"', 'className="space-y-6 max-w-3xl animate-fadeIn"'],
    ['className="eligibility"', 'className="space-y-6 max-w-3xl animate-fadeIn mt-8"'],
    ['className="experience_required"', 'className="space-y-3"'],
    ['className="other_benifits"', 'className="space-y-4 mt-8"'],
    ['className="account_settings"', 'className="bg-[#5f2eea] hover:bg-[#4d26bd] text-white h-10 px-8 text-base font-medium rounded-lg border-0 shadow-sm"'],
    ['className="form-group"', 'className="mb-5"'],
    ['className="from-group"', 'className="mb-5"']
];

for (const [oldStr, newStr] of containerReplacements) {
    const regex = new RegExp(oldStr.replace(/"/g, '\\"'), 'g');
    content = content.replace(regex, newStr);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated PostEdit.jsx UI classes!');
