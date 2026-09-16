const fs = require('fs');
const path = 'c:\\Users\\dell\\Documents\\Careerfast\\careerfast-frontend\\src\\HR\\PostInternship.jsx';
let content = fs.readFileSync(path, 'utf8');

const targetPayload = `            stipend_type: stipendOffered,
            stipend_amount: stipendAmount,
            internship_start_type: internshipStart,
            internship_start_date: internshipStart === 'specific' ? specificStartDate : internshipStartWithin,
            last_date_to_apply: lastDateToApply
        }`;

const targetPayloadN = `            stipend_type: stipendOffered,
            stipend_amount: stipendAmount,
            internship_start_type: internshipStart,
            internship_start_date: internshipStart === 'specific' ? specificStartDate : internshipStartWithin,
            last_date_to_apply: lastDateToApply\n        }`;

const targetPayloadR = `            stipend_type: stipendOffered,\r\n            stipend_amount: stipendAmount,\r\n            internship_start_type: internshipStart,\r\n            internship_start_date: internshipStart === 'specific' ? specificStartDate : internshipStartWithin,\r\n            last_date_to_apply: lastDateToApply\r\n        }`;

const newPayloadFields = `            stipend_type: stipendOffered,
            stipend_amount: stipendAmount,
            internship_start_type: internshipStart,
            internship_start_date: internshipStart === 'specific' ? specificStartDate : internshipStartWithin,
            last_date_to_apply: lastDateToApply,
            locality: locality,
            internship_perks: internshipPerks
        }`;

if (content.includes(targetPayloadR)) {
    content = content.replace(targetPayloadR, newPayloadFields);
} else if (content.includes(targetPayloadN)) {
    content = content.replace(targetPayloadN, newPayloadFields);
} else if (content.includes(targetPayload)) {
    content = content.replace(targetPayload, newPayloadFields);
}

fs.writeFileSync(path, content, 'utf8');
console.log("Successfully added locality and internshipPerks to payload!");
