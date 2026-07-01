import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Plus, Trash2, Save, Trophy } from 'lucide-react';

export function Top3DesignersTab() {
  const [designers, setDesigners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'top3Designers'), (snap) => {
      const items: any[] = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() }));
      setDesigners(items.sort((a, b) => (a.rank || 0) - (b.rank || 0)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleAdd = () => {
    if (designers.length >= 3) {
      alert('لا يمكنك إضافة أكثر من 3 مصممين.');
      return;
    }
    const newId = Date.now().toString();
    setDoc(doc(db, 'top3Designers', newId), {
      name: '',
      channelUrl: '',
      imageUrl: '',
      description: '',
      rank: designers.length + 1
    });
  };

  const handleUpdate = (id: string, field: string, value: any) => {
    setDoc(doc(db, 'top3Designers', id), { [field]: value }, { merge: true });
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المصمم؟')) {
      deleteDoc(doc(db, 'top3Designers', id));
    }
  };

  if (loading) return <div className="text-white p-6">جاري التحميل...</div>;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <Trophy className="text-amber-500" />
            إدارة أفضل 3 مصممين
          </h2>
          <p className="text-neutral-400">أضف روابط قنوات المصممين وصورهم ليظهروا في الصفحة الرئيسية.</p>
        </div>
        <button
          onClick={handleAdd}
          disabled={designers.length >= 3}
          className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          إضافة مصمم
        </button>
      </div>

      <div className="space-y-6">
        {designers.map((designer, idx) => (
          <div key={designer.id} className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 relative">
            <div className="absolute top-0 right-0 bg-neutral-800 text-neutral-300 w-8 h-8 flex items-center justify-center rounded-bl-xl rounded-tr-xl font-bold">
              {idx + 1}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                <label className="block text-sm text-neutral-400 mb-1">اسم المصمم</label>
                <input
                  type="text"
                  value={designer.name || ''}
                  onChange={(e) => handleUpdate(designer.id, 'name', e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2.5 text-white"
                  placeholder="مثال: عمر الإبداع"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">رابط القناة (يوتيوب/تيك توك)</label>
                <input
                  type="text"
                  value={designer.channelUrl || ''}
                  onChange={(e) => handleUpdate(designer.id, 'channelUrl', e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2.5 text-white"
                  placeholder="https://..."
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">رابط الصورة (اختياري)</label>
                <input
                  type="text"
                  value={designer.imageUrl || ''}
                  onChange={(e) => handleUpdate(designer.id, 'imageUrl', e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2.5 text-white"
                  placeholder="رابط مباشر للصورة"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">الترتيب (1-3)</label>
                <input
                  type="number"
                  value={designer.rank || ''}
                  onChange={(e) => handleUpdate(designer.id, 'rank', parseInt(e.target.value))}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2.5 text-white"
                  min="1"
                  max="3"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => handleDelete(designer.id)}
                className="text-red-500 hover:text-red-400 flex items-center gap-1 text-sm bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20"
              >
                <Trash2 size={16} />
                حذف
              </button>
            </div>
          </div>
        ))}

        {designers.length === 0 && (
          <div className="text-center py-12 bg-neutral-950 rounded-xl border border-neutral-800 border-dashed">
            <Trophy size={48} className="mx-auto text-neutral-700 mb-4" />
            <p className="text-neutral-500">لا يوجد مصممين مضافين حالياً.</p>
          </div>
        )}
      </div>
    </div>
  );
}
