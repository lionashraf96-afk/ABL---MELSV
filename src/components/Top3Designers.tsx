import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Star, ExternalLink, Trophy } from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function Top3Designers() {
  const [designers, setDesigners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'top3Designers'), orderBy('rank', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      const items: any[] = [];
      snap.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setDesigners(items);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading || designers.length === 0) return null;

  return (
    <section className="py-20 relative bg-neutral-900 border-t border-neutral-800 overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none translate-x-1/2 -translate-y-1/2" style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.05) 0%, rgba(0,0,0,0) 70%)' }}></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-medium tracking-wide mb-4 text-sm"
          >
            <Trophy size={16} />
            نخبة الإبداع
          </motion.div>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">أفضل 3 مصممين</h2>
          <p className="text-neutral-400 max-w-2xl mx-auto text-lg">
            المصممين اللي تميزوا بإبداعهم واحترافيتهم العالية.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {designers.slice(0, 3).map((designer, i) => (
            <motion.div
              key={designer.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 relative overflow-hidden group hover:border-amber-500/50 transition-colors"
            >
              <div className="absolute top-0 right-0 p-4">
                <span className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-white shadow-lg ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-neutral-400' : 'bg-amber-700'}`}>
                  {i + 1}
                </span>
              </div>
              <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-2 border-neutral-800 group-hover:border-amber-500 transition-colors">
                <img src={designer.imageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${designer.name}&backgroundColor=059669,0d9488`} alt={designer.name} className="w-full h-full object-cover" />
              </div>
              <h3 className="text-xl font-bold text-center text-white mb-2">{designer.name}</h3>
              {designer.description && (
                <p className="text-sm text-neutral-400 text-center mb-6 line-clamp-2">{designer.description}</p>
              )}
              {designer.channelUrl && (
                <a href={designer.channelUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-amber-500/10 text-amber-500 font-medium hover:bg-amber-500/20 transition-colors">
                  <ExternalLink size={16} />
                  زيارة القناة
                </a>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
