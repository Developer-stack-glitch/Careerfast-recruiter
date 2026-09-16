const fs = require('fs');
const path = 'c:\\Users\\dell\\Documents\\Careerfast\\careerfast-frontend\\src\\HR\\PostInternship.jsx';

let content = fs.readFileSync(path, 'utf8');
let lines = content.split('\n');

// verify if line 1071 is indeed `                            <div>`
if (lines[1071].includes('<div>') && lines[1072].includes('Work experience')) {
    // Delete lines 1071 to 1417 (index 1071 to 1417)
    // Actually, wait, line 1072 was '<div>' so index 1071 is '<div>'
    lines.splice(1071, 1417 - 1071 + 1);
    fs.writeFileSync(path, lines.join('\n'), 'utf8');
    console.log("Deleted lines successfully!");
} else {
    console.log("Line 1072 didn't match. Found:", lines[1071]);
    console.log("Line 1073:", lines[1072]);
}
