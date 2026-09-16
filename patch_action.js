const fs = require('fs');
const file = 'src/ApiService/action.js';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('updateJobPosting')) {
  const updateApi = `
export const updateJobPosting = async (payload) => {
  try {
    const token = localStorage.getItem("AccessToken");
    if (!token) throw new Error("No AccessToken found");
    const response = await instance.put("/updateJobPosting", payload, {
      headers: { Authorization: \`Bearer \${token}\` },
    });
    return response;
  } catch (error) {
    throw error;
  }
};
`;
  content = content + '\n' + updateApi;
  fs.writeFileSync(file, content);
  console.log('patched action.js');
} else {
  console.log('already patched');
}
