import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Settings, 
  Bell, 
  Search, 
  Menu, 
  LogOut, 
  Save,
  LogIn,
  PenTool,
  Inbox,
  CheckCircle,
  XCircle,
  Clock,
  Video,
  Image as ImageIcon,
  Trash2,
  Plus,
  Play,
  Edit2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSettings } from './hooks/useSettings';
import { auth, db } from './lib/firebase';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';

interface JoinRequest {
  id: string;
  name: string;
  tiktokUsername: string;
  since: string;
  reason: string;
  status: string;
  createdAt: any;
  image?: string;
}

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'requests' | 'settings' | 'tiktok' | 'designers'>('requests');
  
  const { settings, saveSettings, isLoaded } = useSettings();
  const [formSettings, setFormSettings] = useState(settings);
  const [isSaved, setIsSaved] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [tiktokPosts, setTiktokPosts] = useState<any[]>([]);
  const [designers, setDesigners] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    // Fetch Requests
    const qReq = query(collection(db, 'joinRequests'), orderBy('createdAt', 'desc'));
    const unsubReq = onSnapshot(qReq, (snap) => {
      const items: any[] = [];
      snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
      setRequests(items);
    }, (error) => console.log("Req error", error));

    // Fetch TikTok Posts
    const qTT = query(collection(db, 'tiktokPosts'), orderBy('createdAt', 'desc'));
    const unsubTT = onSnapshot(qTT, (snap) => {
      const items: any[] = [];
      snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
      setTiktokPosts(items);
    }, (error) => console.log("TT error", error));

    // Fetch Designers
    const unsubDes = onSnapshot(collection(db, 'designers'), (snap) => {
      const items: any[] = [];
      snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
      setDesigners(items);
    }, (error) => console.log("Des error", error));
    
    return () => {
      unsubReq();
      unsubTT();
      unsubDes();
    };
  }, [user]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
  };

  useEffect(() => {
    if (isLoaded) {
      setFormSettings(settings);
    }
  }, [isLoaded, settings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("الرجاء تسجيل الدخول أولاً لحفظ البيانات");
      return;
    }
    const success = await saveSettings(formSettings);
    if (success) {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormSettings({ ...formSettings, [e.target.name]: e.target.value });
  };

  const updateRequestStatus = async (request: JoinRequest, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'joinRequests', request.id), { status });
      if (status === 'approved') {
        const _designersCount = designers.length; // From state
        let profileLink = '';
        if (request.tiktokUsername) {
          const username = request.tiktokUsername.startsWith('@') ? request.tiktokUsername : `@${request.tiktokUsername}`;
          profileLink = `https://www.tiktok.com/${username}`;
        }
        await addDoc(collection(db, 'designers'), {
          name: request.name,
          role: 'عضو جديد',
          specialty: 'مصمم',
          description: request.reason || '',
          bestVideoUrl: profileLink,
          image: request.image || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=60', // Add a default just in case
          order: _designersCount,
          isOnline: true
        });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("حدث خطأ أثناء تحديث حالة الطلب");
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans flex flex-col md:flex-row rtl" dir="rtl">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 w-64 h-screen bg-neutral-900 border-l border-neutral-800 z-50
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
            <PenTool size={20} className="text-emerald-500"/>
            3MR Admin
          </Link>
        </div>

        <nav className="p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('requests')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${activeTab === 'requests' ? 'bg-emerald-600/10 text-emerald-500' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
          >
            <div className="flex items-center gap-3">
              <Inbox size={20} />
              <span className="font-medium">طلبات الانضمام</span>
            </div>
            {pendingRequests.length > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {pendingRequests.length}
              </span>
            )}
          </button>
          
          <button 
            onClick={() => setActiveTab('designers')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'designers' ? 'bg-emerald-600/10 text-emerald-500' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
          >
            <Users size={20} />
            <span className="font-medium">أحسن المصممين</span>
          </button>

          <button 
            onClick={() => setActiveTab('tiktok')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'tiktok' ? 'bg-emerald-600/10 text-emerald-500' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
          >
            <Video size={20} />
            <span className="font-medium">تيك توك تريند</span>
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-emerald-600/10 text-emerald-500' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
          >
            <Settings size={20} />
            <span className="font-medium">الإعدادات العرض</span>
          </button>
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-neutral-800">
          <Link to="/" className="flex items-center gap-3 px-4 py-3 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors">
            <LogOut size={20} />
            <span className="font-medium">العودة للموقع</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="h-16 bg-neutral-900/50 backdrop-blur-sm border-b border-neutral-800 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2 text-neutral-400 hover:text-white"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-sm text-neutral-300">
                  {user.email}
                </div>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="User" className="h-8 w-8 rounded-full border border-neutral-700" referrerPolicy="no-referrer" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                )}
                <button 
                  onClick={handleLogout}
                  className="text-red-400 hover:text-red-300 transition-colors bg-red-500/10 p-2 rounded-lg"
                  title="تسجيل الخروج"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
              >
                <LogIn size={16} />
                تسجيل الدخول
              </button>
            )}
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto">
          {!user ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <PenTool size={64} className="text-neutral-800 mb-6" />
              <h2 className="text-2xl font-bold text-white mb-2">لوحة التحكم مقفولة</h2>
              <p className="text-neutral-400 mb-6">سجل دخول عشان تشوف الطلبات وتقدر تتحكم في الموقع.</p>
              <button 
                onClick={handleLogin}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <LogIn size={20} />
                تسجيل الدخول باستخدام جوجل
              </button>
            </div>
          ) : activeTab === 'requests' ? (
            <div className="max-w-5xl">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">طلبات الانضمام {pendingRequests.length > 0 && <span className="text-emerald-500">({pendingRequests.length} جديد)</span>}</h1>
                <p className="text-neutral-400">راجع الطلبات واختار المصممين اللي هيكملوا معانا.</p>
              </div>

              {requests.length === 0 ? (
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center">
                  <Inbox size={48} className="mx-auto text-neutral-600 mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">مفيش طلبات لسة</h3>
                  <p className="text-neutral-400">أي حد هيطلب ينضم هيظهرلك هنا على طول.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map(request => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={request.id} 
                      className={`bg-neutral-900 border ${request.status === 'pending' ? 'border-emerald-500/30' : 'border-neutral-800'} rounded-xl p-6 transition-colors`}
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-white">{request.name}</h3>
                            {request.tiktokUsername && (
                              <span className="text-sm text-neutral-400 border border-neutral-700 bg-neutral-800 rounded px-2 py-0.5" dir="ltr">
                                {request.tiktokUsername}
                              </span>
                            )}
                            <span className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1
                              ${request.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 
                                request.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' : 
                                'bg-neutral-800 text-neutral-400'}`}
                            >
                              {request.status === 'pending' && <><Clock size={12}/> قيد الانتظار</>}
                              {request.status === 'approved' && <><CheckCircle size={12}/> مقبول</>}
                              {request.status === 'rejected' && <><XCircle size={12}/> مرفوض</>}
                            </span>
                          </div>
                          
                          <div className="mb-4">
                            <span className="text-xs text-neutral-500 font-bold uppercase tracking-wider block mb-1">يتابع عمر من</span>
                            <p className="text-neutral-300 font-medium">{request.since}</p>
                          </div>
                          
                          <div>
                            <span className="text-xs text-neutral-500 font-bold uppercase tracking-wider block mb-1">سبب الانضمام والمميزات</span>
                            <p className="text-neutral-300 leading-relaxed bg-neutral-950 p-4 rounded-lg border border-neutral-800 whitespace-pre-wrap">{request.reason}</p>
                          </div>
                        </div>
                        
                        {request.status === 'pending' && (
                          <div className="flex gap-2 items-center flex-row md:flex-col md:w-32 shrink-0">
                            <button 
                              onClick={() => updateRequestStatus(request, 'approved')}
                              className="flex-1 w-full bg-emerald-600/20 hover:bg-emerald-600 text-emerald-500 hover:text-white border border-emerald-600/30 font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                              <CheckCircle size={18} />
                              قبول
                            </button>
                            <button 
                              onClick={() => updateRequestStatus(request, 'rejected')}
                              className="flex-1 w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white border border-neutral-700 font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                              <XCircle size={18} />
                              رفض
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'settings' ? (
            <div className="max-w-3xl">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">إعدادات الموقع المباشر 🌍</h1>
                <p className="text-neutral-400">تحديث روابط وسائل التواصل للموقع (عشان لو هتحطها بعدين).</p>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                <form onSubmit={handleSaveSettings} className="space-y-6">
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white border-b border-neutral-800 pb-2">المحتوى والهوية</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-1">صورة خلفية الموقع (رفع من الجهاز)</label>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const img = new Image();
                            img.onload = () => {
                              const canvas = document.createElement('canvas');
                              const MAX_WIDTH = 1920;
                              const MAX_HEIGHT = 1080;
                              let width = img.width;
                              let height = img.height;
                              if (width > height) {
                                if (width > MAX_WIDTH) {
                                  height *= MAX_WIDTH / width;
                                  width = MAX_WIDTH;
                                }
                              } else {
                                if (height > MAX_HEIGHT) {
                                  width *= MAX_HEIGHT / height;
                                  height = MAX_HEIGHT;
                                }
                              }
                              canvas.width = width;
                              canvas.height = height;
                              const ctx = canvas.getContext('2d');
                              ctx?.drawImage(img, 0, 0, width, height);
                              setFormSettings({...formSettings, heroBackground: canvas.toDataURL('image/jpeg', 0.7)});
                            };
                            img.src = event.target?.result as string;
                          };
                          reader.readAsDataURL(file);
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                      />
                      {formSettings.heroBackground && formSettings.heroBackground.startsWith('data:image') && (
                        <div className="mt-2 text-xs text-emerald-500">تم تحديد الصورة بنجاح</div>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-1">هاشتاج التيك توك الرئيسي</label>
                      <input 
                        type="text" 
                        name="mainHashtag"
                        value={formSettings.mainHashtag || ''}
                        onChange={handleChange}
                        placeholder="#هاشتاج_المصممين"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <h3 className="text-lg font-bold text-white border-b border-neutral-800 pb-2">الروابط</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-1">رابط Discord</label>
                      <input 
                        type="url" 
                        name="discordLink"
                        value={formSettings.discordLink}
                        onChange={handleChange}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                        dir="ltr"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-1">رابط TikTok</label>
                      <input 
                        type="url" 
                        name="tiktokLink"
                        value={formSettings.tiktokLink}
                        onChange={handleChange}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                        dir="ltr"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-1">رابط Instagram</label>
                      <input 
                        type="url" 
                        name="instagramLink"
                        value={formSettings.instagramLink}
                        onChange={handleChange}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-800 pt-6">
                    {isSaved && <span className="text-emerald-500 text-sm font-medium mr-auto">تم الحفظ بنجاح!</span>}
                    <button 
                      type="submit"
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      <Save size={20} />
                      حفظ التغييرات
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : activeTab === 'designers' ? (
            <DesignersTab designers={designers} />
          ) : (
            <TiktokTab posts={tiktokPosts} />
          )}
        </div>
      </main>
    </div>
  );
}

function DesignersTab({ designers }: { designers: any[] }) {
  const [formData, setFormData] = useState({ name: '', role: '', specialty: '', description: '', bestVideoUrl: '', image: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'designers', editingId), formData);
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'designers'), {
          ...formData,
          order: designers.length,
          isOnline: true
        });
      }
      setFormData({ name: '', role: '', specialty: '', description: '', bestVideoUrl: '', image: '' });
    } catch (err) {
      alert('حدث خطأ');
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('تأكيد الحذف؟')) {
      await deleteDoc(doc(db, 'designers', id));
    }
  };

  const handleEdit = (d: any) => {
    setEditingId(d.id);
    setFormData({
      name: d.name || '',
      role: d.role || '',
      specialty: d.specialty || '',
      description: d.description || '',
      bestVideoUrl: d.bestVideoUrl || '',
      image: d.image || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-5xl">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">إدارة أحسن 10 مصممين</h1>
          <p className="text-neutral-400">تحكم ببيانات المصممين، الوصف، وأحسن فيديو لكل مصمم.</p>
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">{editingId ? 'تعديل بيانات المصمم' : 'إضافة مصمم جديد'}</h3>
          {editingId && (
            <button 
              onClick={() => { setEditingId(null); setFormData({ name: '', role: '', specialty: '', description: '', bestVideoUrl: '', image: '' }); }}
              className="text-neutral-400 hover:text-white text-sm"
            >
              إلغاء التعديل
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input required type="text" placeholder="الاسم" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white" />
          <input required type="text" placeholder="المسمى (مثال: 3D Artist)" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white" />
          <input required type="text" placeholder="التخصص بالعربي" value={formData.specialty} onChange={e => setFormData({...formData, specialty: e.target.value})} className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white" />
          <input type="url" dir="ltr" placeholder="رابط أحسن فيديو (TikTok, Instagram...)" value={formData.bestVideoUrl} onChange={e => setFormData({...formData, bestVideoUrl: e.target.value})} className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white" />
          <textarea placeholder="وصف المصمم (مثال: سرعة في الرد، تنزيل سريع، محتوى كوميدي...)" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="md:col-span-2 bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white h-24 resize-none" />
          
          <div className="flex flex-col md:col-span-2">
            <label className="text-sm text-neutral-400 mb-1">صورة المصمم (رفع)</label>
            <input 
              required={!formData.image} 
              type="file" 
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                  const img = new Image();
                  img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const SIZE = 400; // Force aspect ratio for circular images
                    let width = img.width;
                    let height = img.height;
                    let size = Math.min(width, height);
                    let offsetX = (width - size) / 2;
                    let offsetY = (height - size) / 2;

                    canvas.width = SIZE;
                    canvas.height = SIZE;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, offsetX, offsetY, size, size, 0, 0, SIZE, SIZE);
                    setFormData({...formData, image: canvas.toDataURL('image/jpeg', 0.8)});
                  };
                  img.src = event.target?.result as string;
                };
                reader.readAsDataURL(file);
              }}
              className="bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white text-sm" 
            />
            {formData.image && <div className="text-xs text-emerald-500 mt-1">تم إرفاق الصورة {(formData.image.length > 200 && !formData.image.startsWith('http')) ? '(مرفوعة محلياً)' : ''}</div>}
          </div>
          <button disabled={submitting} type="submit" className="md:col-span-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium p-3 rounded-lg flex items-center justify-center gap-2 mt-2">
            {editingId ? <><Save size={18} /> حفظ التعديلات</> : <><Plus size={18} /> إضافة المصمم</>}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {designers.map(d => (
          <div key={d.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col gap-3 relative group">
            <div className="flex items-center gap-3">
              <img src={d.image} alt={d.name} className="w-12 h-12 rounded-full object-cover" />
              <div>
                <h4 className="font-bold text-white text-sm">{d.name}</h4>
                <p className="text-xs text-neutral-400">{d.role}</p>
              </div>
            </div>
            {(d.description || d.bestVideoUrl) && (
              <div className="pt-3 border-t border-neutral-800/50">
                {d.description && <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed mb-2">{d.description}</p>}
                {d.bestVideoUrl && <a href={d.bestVideoUrl} target="_blank" rel="noreferrer" className="text-xs text-teal-400 hover:text-teal-300 inline-flex items-center gap-1"><Play size={10} /> عرض أفضل فيديو</a>}
              </div>
            )}
            <div className="absolute top-3 left-3 flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-neutral-900/80 p-1 rounded-lg backdrop-blur-sm">
              <button onClick={() => handleEdit(d)} className="text-emerald-500 hover:bg-emerald-500/20 p-1.5 rounded-lg border border-transparent hover:border-emerald-500/30">
                <Edit2 size={14} />
              </button>
              <button onClick={() => handleDelete(d.id)} className="text-red-500 hover:bg-red-500/20 p-1.5 rounded-lg border border-transparent hover:border-red-500/30">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TiktokTab({ posts }: { posts: any[] }) {
  const [formData, setFormData] = useState({ designerName: '', videoUrl: '', coverImageUrl: '', views: 0, isReal: true });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'tiktokPosts'), {
        ...formData,
        createdAt: serverTimestamp()
      });
      setFormData({ designerName: '', videoUrl: '', coverImageUrl: '', views: 0, isReal: true });
    } catch (err) {
      alert('حدث خطأ');
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('تأكيد الحذف؟')) {
      await deleteDoc(doc(db, 'tiktokPosts', id));
    }
  };

  const handleSyncTikTok = async () => {
    try {
      setSubmitting(true);
      const res = await fetch('/api/tiktok-hashtag');
      if (!res.ok) {
        setSubmitting(false);
        const errData = await res.json();
        alert('حدث خطأ أثناء المزامنة: ' + (errData.message || res.statusText) + '\n\nملاحظة: لكي تعمل المزامنة التلقائية للفيديوهات والمشاهدات الحقيقية، يجب إضافة RAPIDAPI_KEY في إعدادات البيئة (Secrets).');
        return;
      }
      const data = await res.json();
      const videos = data.videos || [];
      let added = 0;
      
      const existingUrls = new Set(posts.map(p => p.videoUrl));
      
      for (const video of videos) {
        if (!existingUrls.has(video.videoUrl)) {
          await addDoc(collection(db, 'tiktokPosts'), {
            designerName: video.authorName || 'مصمم مجهول',
            videoUrl: video.videoUrl,
            coverImageUrl: video.coverImageUrl || '',
            views: video.views || 0,
            isReal: true,
            createdAt: serverTimestamp()
          });
          added++;
        }
      }
      setSubmitting(false);
      alert(added > 0 ? `تم مزامنة ${added} فيديوهات جديدة بنجاح!` : 'تمت المزامنة، لا توجد فيديوهات جديدة.');
    } catch (err) {
      setSubmitting(false);
      alert('فشل في الاتصال بمزود الخدمة (API)');
    }
  };

  return (
    <div className="max-w-5xl">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">إدارة تيك توك تريند</h1>
          <p className="text-neutral-400">وثق فيديوهات المصممين اللي نزلت على الهاشتاج.</p>
        </div>
        <button 
          onClick={handleSyncTikTok}
          disabled={submitting}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
        >
          {submitting ? 'جاري المزامنة...' : 'مزامنة الهاشتاج التلقائية'}
        </button>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 mb-8">
        <h3 className="text-lg font-bold text-white mb-4">إضافة فيديو جديد</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input required type="text" placeholder="اسم المصمم" value={formData.designerName} onChange={e => setFormData({...formData, designerName: e.target.value})} className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white" />
          <input required type="url" dir="ltr" placeholder="رابط الفيديو على تيك توك" value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})} className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white" />
          
          <div className="flex flex-col">
            <label className="text-sm text-neutral-400 mb-1">صورة الغلاف (اختياري - رفع)</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                  const img = new Image();
                  img.onload = () => {
                    const canvas = document.createElement('canvas');
                    // Typical TikTok cover ratio 9:16
                    const widthPattern = 360;
                    const heightPattern = 640;
                    
                    let width = img.width;
                    let height = img.height;
                    let ratio = Math.max(widthPattern / width, heightPattern / height);
                    
                    canvas.width = widthPattern;
                    canvas.height = heightPattern;
                    const ctx = canvas.getContext('2d');
                    
                    let drawWidth = width * ratio;
                    let drawHeight = height * ratio;
                    let offsetX = (widthPattern - drawWidth) / 2;
                    let offsetY = (heightPattern - drawHeight) / 2;
                    
                    ctx?.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
                    setFormData({...formData, coverImageUrl: canvas.toDataURL('image/jpeg', 0.7)});
                  };
                  img.src = event.target?.result as string;
                };
                reader.readAsDataURL(file);
              }}
              className="bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white text-sm" 
            />
            {formData.coverImageUrl && <div className="text-xs text-emerald-500 mt-1">تم إرفاق صورة الغلاف</div>}
          </div>

          <input required type="number" placeholder="عدد المشاهدات" value={formData.views || ''} onChange={e => setFormData({...formData, views: parseInt(e.target.value) || 0})} className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white" />
          
          <label className="flex items-center gap-3 text-white cursor-pointer select-none bg-neutral-950 border border-neutral-800 rounded-lg p-3">
            <input type="checkbox" checked={formData.isReal} onChange={e => setFormData({...formData, isReal: e.target.checked})} className="w-5 h-5 accent-emerald-500" />
            المشاهدات حقيقية وتم تقييمها
          </label>
          
          <button disabled={submitting} type="submit" className="md:col-span-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium p-3 rounded-lg flex items-center justify-center gap-2">
            <Plus size={18} /> إضافة الفيديو
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.map(p => (
          <div key={p.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col gap-2 relative group overflow-hidden">
            <h4 className="font-bold text-white">{p.designerName}</h4>
            <div className="flex items-center justify-between text-sm text-neutral-400">
              <span>{p.views.toLocaleString('ar-EG')} مشاهدة</span>
              <span className={p.isReal ? 'text-emerald-500' : 'text-red-500'}>{p.isReal ? 'حقيقي' : 'فيك'}</span>
            </div>
            {p.coverImageUrl && <img src={p.coverImageUrl} className="mt-2 w-full h-32 object-cover rounded-lg opacity-50" />}
            
            <button onClick={() => handleDelete(p.id)} className="absolute top-2 left-2 text-red-500 bg-neutral-900/80 hover:bg-red-500/20 p-2 rounded-lg md:opacity-0 md:group-hover:opacity-100 transition-opacity backdrop-blur-sm border border-transparent hover:border-red-500/30">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
