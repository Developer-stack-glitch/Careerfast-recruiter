const fs = require('fs');

const filePath = 'C:\\Users\\dell\\Documents\\Careerfast\\careerfast-frontend\\src\\HR\\PostEdit.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix the missing div in case "process"
const processCaseTarget = `      case "process":
        return (
          <>
              <Form.Item
                layout="vertical"
                label={<span style={{ fontWeight: 500 }}>Job Nature </span>}`;

const processCaseReplacement = `      case "process":
        return (
          <>
            <div style={{ marginTop: 15 }} className="mb-5">
              <Form.Item
                layout="vertical"
                label={<span style={{ fontWeight: 500 }}>Job Nature </span>}`;

content = content.replace(processCaseTarget, processCaseReplacement);

// 2. Remove the old duplicate case "additionalinformation"
// I will find the last occurrence of `case "additionalinformation":` and remove it and everything up to `default:`
const lastAdditionalCaseIndex = content.lastIndexOf('case "additionalinformation":');
const defaultCaseIndex = content.lastIndexOf('default:');

if (lastAdditionalCaseIndex > -1 && defaultCaseIndex > -1 && lastAdditionalCaseIndex < defaultCaseIndex) {
    // Only remove if it looks like the second instance (which is near the end, right before default:)
    const firstAdditionalCaseIndex = content.indexOf('case "additionalinformation":');
    if (firstAdditionalCaseIndex !== lastAdditionalCaseIndex) {
        // We have a duplicate!
        content = content.substring(0, lastAdditionalCaseIndex) + content.substring(defaultCaseIndex);
    }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("File fixed successfully");
