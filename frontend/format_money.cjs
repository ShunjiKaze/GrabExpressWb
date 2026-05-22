const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src');

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      walk(path.join(dir, file), fileList);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

const files = walk(dir);
let changedFiles = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace {amount} with {Number(amount).toFixed(2)} if it doesn't already have toFixed or toLocaleString
  // We need to be careful with expressions like Math.round(...)
  content = content.replace(/₱\{([^}]+)\}/g, (match, p1) => {
    if (p1.includes('.toFixed') || p1.includes('.toLocaleString')) return match;
    return `₱{Number(${p1.trim()}).toFixed(2)}`;
  });

  // Replace ${amount} inside template strings
  content = content.replace(/₱\$\{([^}]+)\}/g, (match, p1) => {
    if (p1.includes('.toFixed') || p1.includes('.toLocaleString')) return match;
    return `₱\${Number(${p1.trim()}).toFixed(2)}`;
  });

  // Replace hardcoded values like ₱0 -> ₱0.00
  // Handle specific cases
  content = content.replace(/₱0(?!\.)/g, '₱0.00');
  content = content.replace(/₱500(?!\.)/g, '₱500.00');
  content = content.replace(/₱10,000(?!\.)/g, '₱10,000.00');
  content = content.replace(/₱3,000(?!\.)/g, '₱3,000.00');
  content = content.replace(/₱60(?!\.)/g, '₱60.00');
  content = content.replace(/₱250(?!\.)/g, '₱250.00');

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
    changedFiles++;
  }
}
console.log(`Updated ${changedFiles} files.`);
