const fs = require('fs');
const path = 'c:\\Users\\dell\\Documents\\Careerfast\\careerfast-frontend\\src\\HR\\PostInternship.jsx';
let content = fs.readFileSync(path, 'utf8');

const targetPayload = `            apply_link: isExternalApply ? applyLink : null,
            about_company: isExternalApply ? aboutCompany : null
        }`;

const targetPayloadN = `            apply_link: isExternalApply ? applyLink : null,
            about_company: isExternalApply ? aboutCompany : null\n        }`;

const targetPayloadR = `            apply_link: isExternalApply ? applyLink : null,\r\n            about_company: isExternalApply ? aboutCompany : null\r\n        }`;

const newPayloadFields = `            apply_link: isExternalApply ? applyLink : null,
            about_company: isExternalApply ? aboutCompany : null,
            stipend_type: stipendOffered,
            stipend_amount: stipendAmount,
            internship_start_type: internshipStart,
            internship_start_date: internshipStart === 'specific' ? specificStartDate : internshipStartWithin,
            last_date_to_apply: lastDateToApply
        }`;

if (content.includes(targetPayloadR)) {
    content = content.replace(targetPayloadR, newPayloadFields);
} else if (content.includes(targetPayloadN)) {
    content = content.replace(targetPayloadN, newPayloadFields);
} else if (content.includes(targetPayload)) {
    content = content.replace(targetPayload, newPayloadFields);
}

fs.writeFileSync(path, content, 'utf8');
console.log("Successfully added fields to payload!");
