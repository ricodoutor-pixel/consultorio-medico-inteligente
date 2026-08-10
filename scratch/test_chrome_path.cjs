const fs = require('fs');

const paths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
];

for (const p of paths) {
  if (fs.existsSync(p)) {
    console.log("CHROME_FOUND:", p);
  }
}
