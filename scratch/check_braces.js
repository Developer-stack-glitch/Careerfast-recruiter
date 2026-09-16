const fs = require('fs');
const content = fs.readFileSync('src/css/ProfileDetailsPage.css', 'utf8');
const openBraces = (content.match(/\{/g) || []).length;
const closeBraces = (content.match(/\}/g) || []).length;
console.log(`Open: ${openBraces}, Close: ${closeBraces}`);
if (openBraces !== closeBraces) {
    console.log('Braces are UNBALANCED!');
} else {
    console.log('Braces are balanced.');
}
