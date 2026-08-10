const { spawn } = require('child_process');
const path = require('path');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const USER_DATA_DIR = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data');

console.log("🚀 Iniciando Chrome com Remote Debugging em http://127.0.0.1:9222...");

const chromeProcess = spawn(CHROME_PATH, [
  '--remote-debugging-port=9222',
  'https://web.whatsapp.com'
], { detached: true, stdio: 'ignore' });

chromeProcess.unref();
console.log("✅ Chrome iniciado com porta 9222 ativa!");
