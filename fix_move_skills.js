const fs = require('fs');
const path = 'c:\\Users\\dell\\Documents\\Careerfast\\careerfast-frontend\\src\\HR\\PostInternship.jsx';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// Find the skills block in Step 0 (around lines 1274-1328)
// It starts with the empty lines + <div> containing "Add skills"
// and ends before </div> </motion.div> ); case 1:

let skillsStartIdx = -1;
let skillsEndIdx = -1;

for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.includes('Add skills') && trimmed.includes('label')) {
        // Go back to find the opening <div> 
        for (let j = i - 1; j >= i - 5; j--) {
            if (lines[j].trim() === '<div>') {
                skillsStartIdx = j;
                break;
            }
        }
        // Go forward to find the closing </div> of this entire block
        let depth = 0;
        for (let j = skillsStartIdx; j < lines.length; j++) {
            const t = lines[j];
            const opens = (t.match(/<div/g) || []).length;
            const closes = (t.match(/<\/div>/g) || []).length;
            depth += opens - closes;
            if (depth === 0) {
                skillsEndIdx = j;
                break;
            }
        }
        break;
    }
}

if (skillsStartIdx === -1 || skillsEndIdx === -1) {
    console.log('Could not find skills block');
    process.exit(1);
}

console.log(`Skills block found: lines ${skillsStartIdx + 1} to ${skillsEndIdx + 1}`);
console.log(`First line: ${lines[skillsStartIdx].trim()}`);
console.log(`Last line: ${lines[skillsEndIdx].trim()}`);

// Extract the skills block
const skillsBlock = lines.slice(skillsStartIdx, skillsEndIdx + 1);

// Remove the skills block from Step 0 (also remove the blank lines before it)
let removeStart = skillsStartIdx;
// Check for blank lines before
while (removeStart > 0 && lines[removeStart - 1].trim() === '') {
    removeStart--;
}
lines.splice(removeStart, (skillsEndIdx + 1) - removeStart);

// Now find the insertion point in Step 1 - right after the <div className="space-y-6"> inside case 1
// After removal, line numbers shifted. Find "Candidate preferences" and insert after the space-y-6 div
let insertIdx = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Candidate preferences') && lines[i].includes('h2')) {
        // Find the next <div className="space-y-6"> 
        for (let j = i; j < i + 5; j++) {
            if (lines[j].includes('space-y-6')) {
                insertIdx = j + 1; // Insert right after this line
                break;
            }
        }
        break;
    }
}

if (insertIdx === -1) {
    console.log('Could not find insertion point in Step 1');
    process.exit(1);
}

console.log(`Inserting skills block at line ${insertIdx + 1}`);

// Insert the skills block + a blank line
lines.splice(insertIdx, 0, '', ...skillsBlock, '');

fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('Successfully moved skills to Step 1 (Candidate preferences)!');
