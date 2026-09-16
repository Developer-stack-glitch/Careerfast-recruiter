const fs = require('fs');
const content = fs.readFileSync('src/JobPortal/PostJobs.js', 'utf8');

function checkBalance(tagOpen, tagClose) {
    const openCount = (content.match(new RegExp(tagOpen, 'g')) || []).length;
    const closeCount = (content.match(new RegExp(tagClose, 'g')) || []).length;
    console.log(`${tagOpen}: ${openCount}, ${tagClose}: ${closeCount}`);
    if (openCount !== closeCount) {
        console.log(`Mismatch in ${tagOpen}/${tagClose}!`);
    }
}

checkBalance('<Form\\\\s', '</Form>');
checkBalance('<Col\\\\s', '</Col>');
checkBalance('<Row\\\\s', '</Row>');
checkBalance('<div\\\\s', '</div>');
checkBalance('<section\\\\s', '</section>');
