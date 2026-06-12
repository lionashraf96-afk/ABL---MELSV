import fs from 'fs';

const files = ['src/App.tsx', 'src/AdminDashboard.tsx'];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // App.tsx uses red and orange purely for brand styling
  if (file === 'src/App.tsx') {
    content = content.replace(/red/g, 'emerald');
    content = content.replace(/orange/g, 'teal');
  } 
  
  // AdminDashboard uses red/orange for branding, EXCEPT for rejection/logout buttons
  // So we'll conservatively target the specific branding strings.
  if (file === 'src/AdminDashboard.tsx') {
    content = content.replace(/from-red-500/g, 'from-emerald-500');
    content = content.replace(/from-red-600/g, 'from-emerald-600');
    content = content.replace(/to-orange-500/g, 'to-teal-500');
    content = content.replace(/to-orange-600/g, 'to-teal-600');
    content = content.replace(/text-red-500/g, 'text-emerald-500');
    // activeTab === 'requests' ? 'bg-red-600/10 text-red-500' -> emerald 
    content = content.replace(/bg-red-600\/10 text-red-500/g, 'bg-emerald-600/10 text-emerald-500');
    // focus:border-red-500 focus:ring-red-500
    content = content.replace(/focus:border-red-500/g, 'focus:border-emerald-500');
    content = content.replace(/focus:ring-red-500/g, 'focus:ring-emerald-500');
    // text-red-500 (except "مرفوض" and "تسجيل خروج"? wait, those are specific, logout is text-red-400 and reject is text-neutral-400 with hover but let's check)
    // admin dashboard had: <PenTool size={20} className="text-red-500"/>
    // btn: bg-red-600 hover:bg-red-700
    content = content.replace(/bg-red-600/g, 'bg-emerald-600');
    content = content.replace(/bg-red-700/g, 'bg-emerald-700');
    // requested badge: text-red-500 border-red-500
    content = content.replace(/border-red-500/g, 'border-emerald-500');

    // don't blindly replace all 'red', because "red-500/10" is used for errors / rejection in dashboard.
  }

  fs.writeFileSync(file, content);
}
console.log('Colors replaced successfully!');
