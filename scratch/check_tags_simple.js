const fs = require('fs');
const content = fs.readFileSync('src/JobPortal/PostJobs.js', 'utf8');

function countOccurrences(subStr) {
    let count = 0;
    let pos = content.indexOf(subStr);
    while (pos !== -1) {
        count++;
        pos = content.indexOf(subStr, pos + 1);
    }
    return count;
}

const formOpen = countOccurrences('<Form');
const formClose = countOccurrences('</Form>');
const colOpen = countOccurrences('<Col');
const colClose = countOccurrences('</Col>');
const rowOpen = countOccurrences('<Row');
const rowClose = countOccurrences('</Row>');
const divOpen = countOccurrences('<div');
const divClose = countOccurrences('</div>');

console.log(`Form: ${formOpen} / ${formClose}`);
console.log(`Col: ${colOpen} / ${colClose}`);
console.log(`Row: ${rowOpen} / ${rowClose}`);
console.log(`div: ${divOpen} / ${divClose}`);
