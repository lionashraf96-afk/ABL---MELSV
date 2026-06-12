import fs from 'fs';
const fsPath = 'src/App.tsx';
let content = fs.readFileSync(fsPath, 'utf8');
content = content.replace(/requiemerald/g, 'required');
fs.writeFileSync(fsPath, content);
console.log('Fixed required typo');
