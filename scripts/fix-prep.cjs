const fs = require('fs');
let c = fs.readFileSync('scripts/prepare-campaign-2.cjs', 'utf8');
c = c.replace("import fs from 'fs';", "const fs = require('fs');");
c = c.replace("import path from 'path';", "const path = require('path');");
fs.writeFileSync('scripts/prepare-campaign-2.cjs', c);
