const fs = require('fs');
const path = require('path');
const file = path.join('c:\\Users\\ricod\\Documents\\Planta y Raiz Ltda', '.env');

try {
  let buf = fs.readFileSync(file);
  let str = buf.toString('utf16le');
  
  if (!str.includes('=') && buf.toString('utf8').includes('=')) {
     str = buf.toString('utf8');
     str = str.replace(/\0/g, '');
  } else {
     str = str.replace(/\0/g, '');
  }

  const lines = str.split(/\r?\n/).filter(line => line.trim() !== '');
  fs.writeFileSync(file, lines.join('\n'), 'utf8');
  console.log('Successfully fixed .env encoding');
} catch (e) {
  console.error(e);
}
