import fs from 'fs';

const content = fs.readFileSync('src/App.tsx', 'utf8');

// Insert lazy import
const lazyImportStr = `const MonitoramentoCSI = lazyWithRecovery(() => import("./pages/MonitoramentoCSI"), { sourceRef: "/monitoramento" });\n`;
const importIndex = content.indexOf('const Loading = () => (');
let newContent = content.slice(0, importIndex) + lazyImportStr + content.slice(importIndex);

// Insert route
const routeStr = `                <Route path="/monitoramento" element={<MonitoramentoCSI />} />\n`;
const routeIndex = newContent.indexOf('<Route path="/monitoramento-saude"');
if (routeIndex !== -1) {
  newContent = newContent.slice(0, routeIndex) + routeStr + newContent.slice(routeIndex);
} else {
  // fallback
  const fallbackIndex = newContent.indexOf('<Route path="/telemedicina"');
  newContent = newContent.slice(0, fallbackIndex) + routeStr + newContent.slice(fallbackIndex);
}

fs.writeFileSync('src/App.tsx', newContent, 'utf8');
console.log('App.tsx patched successfully');
