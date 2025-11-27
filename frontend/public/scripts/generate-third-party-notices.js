// docs/scripts/generate-third-party-notices.js
const fs = require('fs');

const rawData = fs.readFileSync('third-party-licenses.json');
const jsonData = JSON.parse(rawData);

let output = `# 📦 Third-Party Notices\n\nThis project includes third-party packages listed below:\n\n`;

for (const [pkg, data] of Object.entries(jsonData)) {
  output += `---\n`;
  output += `### ${pkg}\n`;
  output += `- **License**: ${data.licenses}\n`;
  if (data.publisher) output += `- **Author**: ${data.publisher}\n`;
  if (data.repository)
    output += `- **Repository**: ${data.repository}\n`;
  if (data.email) output += `- **Contact**: ${data.email}\n`;
  output += `\n`;
}

fs.writeFileSync('THIRD-PARTY-NOTICES.md', output);
console.log('✅ THIRD-PARTY-NOTICES.md generated.');
