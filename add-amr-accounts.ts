import fs from "fs";

let content = fs.readFileSync("src/App.tsx", "utf8");

const amrAccountsCode = `function AmrAccounts({ settings }: { settings: any }) {
  const accounts = [
    { name: 'TikTok', icon: <Video size={24} />, url: settings?.tiktokLink || '#', color: 'bg-black hover:bg-neutral-900', border: 'border-neutral-800' },
    { name: 'Instagram', icon: <Instagram size={24} />, url: settings?.instagramLink || '#', color: 'bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 hover:opacity-90', border: 'border-pink-500/30' },
    { name: 'Facebook', icon: <Facebook size={24} />, url: settings?.facebookLink || '#', color: 'bg-blue-600 hover:bg-blue-700', border: 'border-blue-500/30' },
    { name: 'YouTube', icon: <Youtube size={24} />, url: settings?.youtubeLink || '#', color: 'bg-red-600 hover:bg-red-700', border: 'border-red-500/30' },
  ];

  return (
    <section id="amr-accounts" className="py-20 relative z-20 bg-neutral-950 border-t border-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 relative">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
            حسابات عمر الرسمية
          </h2>
          <div className="w-24 h-1 bg-emerald-500 mx-auto rounded-full"></div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto">
          {accounts.map((acc, i) => (
            <a 
              key={i} 
              href={acc.url} 
              target="_blank" 
              rel="noreferrer"
              className={\`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border \${acc.border} \${acc.color} text-white transition-transform hover:-translate-y-1 shadow-xl\`}
            >
              {acc.icon}
              <span className="font-bold text-sm md:text-base">{acc.name}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

`;

content = content.replace("function Footer() {", amrAccountsCode + "function Footer() {");

fs.writeFileSync("src/App.tsx", content);
