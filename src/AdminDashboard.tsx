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
  Edit2,
  BarChart,
  Activity,
  DollarSign
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSettings } from './hooks/useSettings';
import { db } from './lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, getDocs, where } from 'firebase/firestore';

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
  const [activeTab, setActiveTab] = useState<'requests' | 'settings' | 'tiktok' | 'designers' | 'video_analysis' | 'hashtag_designers' | 'staff' | 'clips'>('requests');
  
  const { settings, saveSettings, isLoaded } = useSettings();
  const [formSettings, setFormSettings] = useState(settings);
  const [isSaved, setIsSaved] = useState(false);
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [tiktokPosts, setTiktokPosts] = useState<any[]>([]);
  const [designers, setDesigners] = useState<any[]>([]);
  const [siteVisits, setSiteVisits] = useState(0);

  const [staffList, setStaffList] = useState<any[]>([]);
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const [editingStaff, setEditingStaff] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('adminUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      setUserRole(null);
      setIsCheckingRole(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    
    // Check role
    setIsCheckingRole(true);
    if (user.email === 'mohamed55tin@gmail.com') {
       setUserRole('owner');
       setIsCheckingRole(false);
    } else {
       import('firebase/firestore').then(({ collection, query, where, getDocs }) => {
          const q = query(collection(db, 'staff'), where('email', '==', user.email));
          getDocs(q).then((snap) => {
             if (!snap.empty) {
                setUserRole(snap.docs[0].data().role);
             } else {
                setUserRole(null);
             }
             setIsCheckingRole(false);
          });
       });
    }

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

    // Fetch Visits Count
    const unsubVisits = onSnapshot(doc(db, 'stats', 'visits'), (docSnap) => {
      if (docSnap.exists()) {
        setSiteVisits(docSnap.data().views || 0);
      }
    }, (error) => console.log("Visits error", error));

    let unsubStaff = () => {};
    let unsubLogs = () => {};

    if (user.email === 'mohamed55tin@gmail.com') {
      unsubStaff = onSnapshot(collection(db, 'staff'), (snap) => {
        const items: any[] = [];
        snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
        setStaffList(items);
      });
      unsubLogs = onSnapshot(query(collection(db, 'adminLogs'), orderBy('loginAt', 'desc')), (snap) => {
        const items: any[] = [];
        snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
        setAdminLogs(items);
      });
    }
    
    return () => {
      unsubReq();
      unsubTT();
      unsubDes();
      unsubVisits();
      unsubStaff();
      unsubLogs();
    };
  }, [user]);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError('');
    if (!loginEmail || !loginPassword) {
       setLoginError('الرجاء إدخال الإيميل والباسورد');
       return;
    }
    
    let loggedInUser = null;
    if (loginEmail === 'mohamed55tin@gmail.com' && loginPassword === 'admin123') {
       loggedInUser = { email: loginEmail };
    } else {
      try {
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const q = query(collection(db, 'staff'), where('email', '==', loginEmail), where('password', '==', loginPassword));
        const snap = await getDocs(q);
        if (!snap.empty) {
           loggedInUser = { email: loginEmail };
        } else {
           setLoginError('الإيميل أو الباسورد غلط');
           return;
        }
      } catch (error) {
        console.error("Login failed", error);
        setLoginError('حصل مشكلة في تسجيل الدخول');
        return;
      }
    }

    if (loggedInUser) {
       setUser(loggedInUser);
       localStorage.setItem('adminUser', JSON.stringify(loggedInUser));
       try {
         const docRef = await addDoc(collection(db, 'adminLogs'), {
           email: loggedInUser.email,
           loginAt: serverTimestamp(),
           logoutAt: null
         });
         localStorage.setItem('adminSessionId', docRef.id);
       } catch (err) {
         console.error('Failed to log admin session', err);
       }
    }
  };

  const handleLogout = async () => {
    const sessionId = localStorage.getItem('adminSessionId');
    if (sessionId) {
      try {
        await updateDoc(doc(db, 'adminLogs', sessionId), {
          logoutAt: serverTimestamp()
        });
        localStorage.removeItem('adminSessionId');
      } catch (err) {
        console.error('Failed to update log', err);
      }
    }
    setUser(null);
    setUserRole(null);
    localStorage.removeItem('adminUser');
  };

  useEffect(() => {
    if (isLoaded) {
      setFormSettings(settings);
    }
  }, [isLoaded, settings]);

  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('مراجعة التقديمات');
  const [isAddingStaff, setIsAddingStaff] = useState(false);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffEmail || !newStaffPassword) return;
    setIsAddingStaff(true);
    try {
      await addDoc(collection(db, 'staff'), {
        email: newStaffEmail,
        password: newStaffPassword,
        role: newStaffRole,
        addedAt: serverTimestamp()
      });
      setNewStaffEmail('');
      setNewStaffPassword('');
      alert('تم إضافة الفريق بنجاح');
    } catch (e) {
      console.error(e);
      alert('حصل مشكلة في الإضافة');
    }
    setIsAddingStaff(false);
  };

  const handleRemoveStaff = async (id: string) => {
    if (!confirm('متأكد إنك عايز تحذف الشخص ده من الفريق؟')) return;
    try {
      await deleteDoc(doc(db, 'staff', id));
    } catch (e) {
      console.error(e);
      alert('حصل مشكلة في الحذف');
    }
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    try {
      await updateDoc(doc(db, 'staff', editingStaff.id), {
        email: editingStaff.email,
        password: editingStaff.password,
        role: editingStaff.role
      });
      setEditingStaff(null);
      alert('تم التعديل بنجاح');
    } catch (e) {
      console.error(e);
      alert('حصل مشكلة في التعديل');
    }
  };

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
    let value = e.target.value;
    if (e.target.name === 'kickUsername') {
      try {
        if (value.includes('kick.com/')) {
          value = value.split('kick.com/')[1].split('/')[0].split('?')[0];
        }
      } catch (err) {}
    }
    setFormSettings({ ...formSettings, [e.target.name]: value });
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
          {(userRole === 'owner' || userRole === 'كو اونر' || userRole === 'تيم ستاف' || userRole === 'مراجعة التقديمات') && (
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
          )}
          
          {(userRole === 'owner' || userRole === 'كو اونر' || userRole === 'تيم ستاف') && (
            <>
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
                onClick={() => setActiveTab('video_analysis')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'video_analysis' ? 'bg-emerald-600/10 text-emerald-500' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
              >
                <Activity size={20} />
                <span className="font-medium">تحليل الفيديوهات</span>
              </button>

              <button 
                onClick={() => setActiveTab('hashtag_designers')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'hashtag_designers' ? 'bg-emerald-600/10 text-emerald-500' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
              >
                <Users size={20} />
                <span className="font-medium">ملفات المصممين</span>
              </button>

              <button 
                onClick={() => setActiveTab('clips')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'clips' ? 'bg-emerald-600/10 text-emerald-500' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
              >
                <Video size={20} />
                <span className="font-medium">إدارة الكليبات</span>
              </button>
            </>
          )}

          {userRole === 'owner' && (
            <button 
              onClick={() => setActiveTab('staff')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'staff' ? 'bg-emerald-600/10 text-emerald-500' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
            >
              <Users size={20} />
              <span className="font-medium">صلاحيات وفريق العمل</span>
            </button>
          )}

          {(userRole === 'owner' || userRole === 'كو اونر') && (
            <button 
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-emerald-600/10 text-emerald-500' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
            >
              <Settings size={20} />
              <span className="font-medium">الإعدادات العرض</span>
            </button>
          )}
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
            {user && (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-sm text-neutral-300">
                  {user.email}
                </div>
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                <button 
                  onClick={handleLogout}
                  className="text-red-400 hover:text-red-300 transition-colors bg-red-500/10 p-2 rounded-lg"
                  title="تسجيل الخروج"
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto">
          {!user ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <PenTool size={64} className="text-emerald-500 mb-6" />
              <h2 className="text-2xl font-bold text-white mb-2">لوحة التحكم مقفولة</h2>
              <p className="text-neutral-400 mb-8 max-w-sm">سجل دخول عشان تشوف الطلبات وتقدر تتحكم في الموقع.</p>
              
              <form onSubmit={handleLogin} className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
                {loginError && (
                  <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg mb-4 text-sm">
                    {loginError}
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-right text-sm font-medium text-neutral-400 mb-2">الإيميل</label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                    dir="ltr"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-right text-sm font-medium text-neutral-400 mb-2">الباسورد</label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                    dir="ltr"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  <LogIn size={20} />
                  تسجيل الدخول
                </button>
              </form>
            </div>
          ) : isCheckingRole ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <span className="animate-pulse text-emerald-500">جاري التحقق من الصلاحيات...</span>
            </div>
          ) : !userRole ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <XCircle size={64} className="text-red-500 mb-6" />
              <h2 className="text-2xl font-bold text-white mb-2">غير مصرح لك بالدخول</h2>
              <p className="text-neutral-400 mb-6">الحساب اللي دخلت بيه ملوش صلاحيات للوحة التحكم. ارجع للأونر عشان يديك صلاحية.</p>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-6 py-3 rounded-lg font-medium transition-colors border border-neutral-700"
              >
                <LogOut size={20} />
                تسجيل الخروج
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
          ) : activeTab === 'staff' && userRole === 'owner' ? (
            <div className="max-w-4xl">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">فريق العمل والصلاحيات</h1>
                <p className="text-neutral-400">ضيف فريق العمل عشان يقدروا يشاركوا في إدارة الموقع.</p>
              </div>

              <form onSubmit={handleAddStaff} className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 mb-8 flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-sm font-medium text-neutral-400 mb-2">إيميل الشخص</label>
                  <input
                    type="email"
                    required
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                    dir="ltr"
                  />
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-sm font-medium text-neutral-400 mb-2">الباسورد (كلمة المرور)</label>
                  <input
                    type="text"
                    required
                    value={newStaffPassword}
                    onChange={(e) => setNewStaffPassword(e.target.value)}
                    placeholder="******"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                    dir="ltr"
                  />
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-sm font-medium text-neutral-400 mb-2">الصلاحية</label>
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="تيم ستاف">تيم ستاف (Staff)</option>
                    <option value="مراجعة التقديمات">مراجعة التقديمات</option>
                    <option value="كو اونر">كو اونر (Co-Owner)</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={isAddingStaff}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus size={20} />
                  إضافة
                </button>
              </form>

              <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                <table className="w-full text-right">
                  <thead>
                    <tr className="bg-neutral-950/50 border-b border-neutral-800">
                      <th className="px-6 py-4 text-sm font-bold text-neutral-400">الإيميل</th>
                      <th className="px-6 py-4 text-sm font-bold text-neutral-400">الصلاحية</th>
                      <th className="px-6 py-4 text-sm font-bold text-neutral-400 w-24">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    <tr className="hover:bg-neutral-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-emerald-400 font-bold block" dir="ltr">mohamed55tin@gmail.com</span>
                        <span className="text-xs text-neutral-500">الأونر الأساسي</span>
                      </td>
                      <td className="px-6 py-4 text-emerald-400">Owner</td>
                      <td className="px-6 py-4">
                        <span className="text-neutral-500">-</span>
                      </td>
                    </tr>
                    {staffList.map(staff => (
                      <tr key={staff.id} className="hover:bg-neutral-800/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-white" dir="ltr">{staff.email}</td>
                        <td className="px-6 py-4 text-emerald-400">{staff.role}</td>
                        <td className="px-6 py-4 flex gap-2">
                          <button
                            onClick={() => setEditingStaff(staff)}
                            className="text-blue-500 hover:text-blue-400 p-2 hover:bg-blue-500/10 rounded-lg transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleRemoveStaff(staff.id)}
                            className="text-red-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {staffList.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-center text-neutral-500">مفيش أي فريق متضاف للأسف.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {adminLogs.length > 0 && (
                <div className="mt-12 bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                  <div className="p-6 border-b border-neutral-800 flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-bold text-white mb-2">سجل نشاط الإدارة</h2>
                      <p className="text-neutral-400">تابع كل دخول وخروج من لوحة التحكم بالتاريخ والساعة.</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-neutral-950/50 border-b border-neutral-800">
                          <th className="px-6 py-4 text-sm font-bold text-neutral-400">الإيميل</th>
                          <th className="px-6 py-4 text-sm font-bold text-neutral-400">تسجيل الدخول</th>
                          <th className="px-6 py-4 text-sm font-bold text-neutral-400">تسجيل الخروج</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800">
                        {adminLogs.map((log, idx) => {
                          const loginStr = log.loginAt 
                            ? (log.loginAt.toDate?.() || new Date(log.loginAt)).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })
                            : '-';
                          const logoutStr = log.logoutAt 
                            ? (log.logoutAt.toDate?.() || new Date(log.logoutAt)).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })
                            : 'أونلاين الآن';

                          return (
                            <tr key={log.id || idx} className="hover:bg-neutral-800/50 transition-colors">
                              <td className="px-6 py-4 font-medium text-white" dir="ltr">{log.email}</td>
                              <td className="px-6 py-4 text-neutral-300" dir="ltr">{loginStr}</td>
                              <td className="px-6 py-4 text-neutral-400" dir="ltr">
                                {!log.logoutAt ? (
                                  <span className="text-emerald-500 flex items-center gap-1 justify-end"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> {logoutStr}</span>
                                ) : logoutStr}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
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
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-1">يوزر حساب Kick (للايف)</label>
                      <input 
                        type="text" 
                        name="kickUsername"
                        value={formSettings.kickUsername || ''}
                        onChange={handleChange}
                        placeholder="username"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                        dir="ltr"
                      />
                      <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                        عشان الميزة دي تشتغل <span className="text-emerald-400 font-bold">أوتوماتيك لوحدها بدون تدخل منك</span> وتجيب بيانات الاستريمر الحقيقية (الصورة واللايف)، 
                        لازم تضيف مفتاح <span className="text-white bg-neutral-800 px-1 rounded">SCRAPERAPI_KEY</span> في إعدادات البيئة (Secrets).<br/>
                        تقدر تعمله مجاناً من <a href="https://www.scraperapi.com/" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">موقع ScraperAPI</a> (بيديك 5000 طلب مجاني). لو معملتوش، غالباً هيقرا أوفلاين بسبب حماية كلاود فلير.
                      </p>
                    </div>

                    <div className="bg-neutral-800/30 border border-neutral-800 rounded-xl p-4 mt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-white">تفعيل البث المباشر يدويًا</p>
                          <p className="text-xs text-neutral-400">لو فعلت ده هيظهر دايماً إنه لايف بالبيانات دي</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" name="kickLiveOverride" checked={formSettings.kickLiveOverride || false} onChange={e => setFormSettings({...formSettings, kickLiveOverride: e.target.checked})} className="sr-only peer" />
                          <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                      </div>

                      {formSettings.kickLiveOverride && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-neutral-800">
                           <div>
                              <label className="block text-sm font-medium text-neutral-400 mb-1">عنوان البث</label>
                              <input 
                                type="text" 
                                name="kickLiveTitle"
                                value={formSettings.kickLiveTitle || ''}
                                onChange={handleChange}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                              />
                           </div>
                           <div>
                              <label className="block text-sm font-medium text-neutral-400 mb-1">عدد المشاهدين (تقريبي)</label>
                              <input 
                                type="number" 
                                name="kickLiveViewers"
                                value={formSettings.kickLiveViewers || 0}
                                onChange={handleChange}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                                dir="ltr"
                              />
                           </div>
                           <div>
                              <label className="block text-sm font-medium text-neutral-400 mb-1">الكاتيجري (الفئة)</label>
                              <input 
                                type="text" 
                                name="kickLiveCategory"
                                value={formSettings.kickLiveCategory || ''}
                                onChange={handleChange}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                              />
                           </div>
                        </div>
                      )}
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
                      <label className="block text-sm font-medium text-neutral-300 mb-1">رابط WhatsApp</label>
                      <input 
                        type="url" 
                        name="whatsappLink"
                        value={formSettings.whatsappLink || ''}
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
          ) : activeTab === 'video_analysis' ? (
            <VideoAnalysisTab posts={tiktokPosts} />
          ) : activeTab === 'hashtag_designers' ? (
            <HashtagDesignersTab posts={tiktokPosts} />
          ) : activeTab === 'clips' ? (
            <KickClipsTab />
          ) : (
            <TiktokTab posts={tiktokPosts} />
          )}
        </div>
      </main>

      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-white mb-6">تعديل بيانات الحساب</h2>
            <form onSubmit={handleUpdateStaff} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">الإيميل</label>
                <input
                  type="email"
                  value={editingStaff.email}
                  disabled
                  className="w-full bg-neutral-950/50 border border-neutral-800 rounded-lg px-4 py-2.5 text-neutral-500 cursor-not-allowed"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">الباسورد الجديد</label>
                <input
                  type="text"
                  value={editingStaff.password || ''}
                  onChange={e => setEditingStaff({...editingStaff, password: e.target.value})}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  dir="ltr"
                  placeholder="******"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">الصلاحية</label>
                <select
                  value={editingStaff.role}
                  onChange={e => setEditingStaff({...editingStaff, role: e.target.value})}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="تيم ستاف">تيم ستاف (Staff)</option>
                  <option value="مراجعة التقديمات">مراجعة التقديمات</option>
                  <option value="كو اونر">كو اونر (Co-Owner)</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end mt-8">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-6 py-2.5 rounded-lg text-white hover:bg-neutral-800 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
        const contentType = res.headers.get("content-type");
        let errMsg = res.statusText;
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const errData = await res.json();
          errMsg = errData.message || errMsg;
        }
        alert('حدث خطأ أثناء المزامنة: ' + errMsg + '\n\nملاحظة: لكي تعمل المزامنة التلقائية للفيديوهات والمشاهدات الحقيقية، تأكد من إعدادات الـ API.');
        return;
      }
      
      const contentType = res.headers.get("content-type");
      if (!contentType || contentType.indexOf("application/json") === -1) {
        setSubmitting(false);
        alert('خطأ: الخادم لم يرسل بيانات بتنسيق JSON.');
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
            {p.coverImageUrl && <img src={p.coverImageUrl} className="mt-2 w-full h-32 object-cover rounded-lg opacity-50" alt="" />}
            
            <button onClick={() => handleDelete(p.id)} className="absolute top-2 left-2 text-red-500 bg-neutral-900/80 hover:bg-red-500/20 p-2 rounded-lg md:opacity-0 md:group-hover:opacity-100 transition-opacity backdrop-blur-sm border border-transparent hover:border-red-500/30">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function VideoAnalysisTab({ posts }: { posts: any[] }) {
  const sortedPosts = [...posts].sort((a, b) => (b.views || 0) - (a.views || 0));

  const analyzeVideo = (views: number, likes: number, comments: number = 0, shares: number = 0) => {
    if (views < 500) return { status: 'قيد التقييم (مشاهدات قليلة)', color: 'text-neutral-400', bg: 'bg-neutral-500/10' };
    
    // Total engagement: Likes + Comments + Shares
    const engagements = likes + (comments * 2) + (shares * 3); // Weight comments and shares higher
    const ratio = engagements / Math.max(1, views);
    
    if (ratio >= 0.08) return { status: 'حقيقي (تفاعل ممتاز)', color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
    if (ratio >= 0.03) return { status: 'حقيقي (تفاعل جيد)', color: 'text-blue-500', bg: 'bg-blue-500/10' };
    if (ratio >= 0.005) return { status: 'مشاهدات عادية (تفاعل ضعيف)', color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
    
    // Only extremely low engagement (less than 0.5%) is flagged as fake
    return { status: 'مشاهدات وهمية (فيك ⚠️)', color: 'text-red-500', bg: 'bg-red-500/10' };
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">تحليل جودة المشاهدات 📊</h1>
          <p className="text-neutral-400">تحليل الفيديوهات لمعرفة إن كانت المشاهدات حقيقية أم وهمية بناءً على نسبة التفاعل (اللايكات/المشاهدات).</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sortedPosts.map(post => {
          const analysis = analyzeVideo(post.views || 0, post.likes || 0, post.comments || 0, post.shares || 0);
          
          return (
            <div key={post.id} className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex flex-col md:flex-row items-center gap-6">
              <div className="w-full md:w-32 h-20 bg-neutral-800 rounded overflow-hidden flex-shrink-0 relative">
                {post.coverImageUrl ? (
                  <img src={post.coverImageUrl} className="w-full h-full object-cover" alt="cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-600 border border-neutral-700">
                     <Video size={24} />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <a href={post.videoUrl} target="_blank" rel="noreferrer" className="text-white font-bold truncate hover:text-emerald-400 transition-colors mb-1 inline-block" dir="ltr">
                  @{post.uniqueId || post.designerName || 'User'}
                </a>
                <div className="flex flex-wrap gap-4 text-sm text-neutral-400">
                  <span className="flex items-center gap-1">المشاهدات: <strong className="text-white">{(post.views || 0).toLocaleString('ar-EG')}</strong></span>
                  <span className="flex items-center gap-1">اللايكات: <strong className="text-white">{(post.likes || 0).toLocaleString('ar-EG')}</strong></span>
                  {(post.views || 0) > 0 && (
                    <span className="flex items-center gap-1" dir="ltr">نسبة التفاعل: <strong className="text-white">{(((post.likes || 0) / post.views) * 100).toFixed(1)}%</strong></span>
                  )}
                </div>
              </div>
              
              <div className="flex-shrink-0 w-full md:w-auto text-center md:text-left mt-4 md:mt-0">
                <div className={`inline-flex items-center px-4 py-2 rounded-lg font-bold text-sm ${analysis.bg} ${analysis.color}`}>
                  {analysis.status}
                </div>
              </div>
            </div>
          );
        })}
        {sortedPosts.length === 0 && (
          <div className="text-center text-neutral-500 py-12">
            لا توجد فيديوهات للتحليل
          </div>
        )}
      </div>
    </div>
  );
}

function KickClipsTab() {
  const [clips, setClips] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'kickClips'), (snap) => {
      const items: any[] = [];
      snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
      setClips(items.sort((a, b) => b.createdAt?.toMillis?.() - a.createdAt?.toMillis?.() || 0));
    });
    return () => unsub();
  }, []);

  const handleAddClip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newUrl) return;
    setIsAdding(true);
    try {
      await addDoc(collection(db, 'kickClips'), {
        title: newTitle,
        url: newUrl,
        createdAt: serverTimestamp()
      });
      setNewTitle('');
      setNewUrl('');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الكليب؟')) {
      await import('firebase/firestore').then(({ doc, deleteDoc }) => {
        deleteDoc(doc(db, 'kickClips', id));
      });
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">كليبات بث Kick 🎬</h1>
        <p className="text-neutral-400">ضيف الكليبات الحلوة من البث هنا عشان المصممين ينزلوها ويصمموها.</p>
      </div>

      <form onSubmit={handleAddClip} className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">عنوان الكليب</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="وصف أو عنوان الكليب..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">رابط الكليب</label>
            <input
              type="url"
              required
              value={newUrl}
              onChange={e => setNewUrl(e.target.value)}
              placeholder="https://kick.com/username/clip/..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none"
              dir="ltr"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isAdding}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
          >
            <Plus size={20} />
            إضافة كليب
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {clips.map(clip => (
          <div key={clip.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white mb-2">{clip.title}</h3>
              <a href={clip.url} target="_blank" rel="noreferrer" className="text-sm text-emerald-500 hover:underline break-all inline-block mb-4" dir="ltr">{clip.url}</a>
            </div>
            <div className="flex justify-end border-t border-neutral-800 pt-3">
              <button
                onClick={() => handleDelete(clip.id)}
                className="text-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded text-sm font-medium transition-colors"
              >
                حذف
              </button>
            </div>
          </div>
        ))}
        {clips.length === 0 && (
          <div className="col-span-full py-12 text-center text-neutral-500 bg-neutral-900/50 rounded-xl border border-neutral-800 border-dashed">
            مفيش كليبات مضافة لحد دلوقتي
          </div>
        )}
      </div>
    </div>
  );
}

function HashtagDesignersTab({ posts }: { posts: any[] }) {
  const [selectedDesigner, setSelectedDesigner] = useState<any>(null);

  const analyzeVideo = (views: number, likes: number) => {
    if (!views || views < 100) return 'real';
    const ratio = likes / Math.max(1, views);
    if (ratio < 0.01) return 'fake'; // Less than 1% engagement is considered fake
    return 'real';
  };

  if (selectedDesigner) {
    const designerPosts = posts.filter(p => (p.uniqueId || p.designerName) === selectedDesigner.id);

    return (
      <div className="space-y-6 max-w-6xl">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setSelectedDesigner(null)} className="text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded-lg transition-colors font-medium text-sm border border-neutral-700">
            العودة للقائمة
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">ملف المصمم: {selectedDesigner.name}</h1>
            <p className="text-neutral-400">{designerPosts.length} فيديوهات من الهاشتاج</p>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl mb-6 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-right">
          <img src={selectedDesigner.image} alt={selectedDesigner.name} className="w-24 h-24 rounded-full border-4 border-neutral-800 object-cover" />
          <div>
            <h2 className="text-xl font-bold text-white">{selectedDesigner.name}</h2>
            <p className="text-neutral-400 mt-1" dir="ltr">@{selectedDesigner.id}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-3">
               <span className="text-sm bg-neutral-800 px-3 py-1 rounded-full text-emerald-400 font-bold border border-emerald-500/20">فيديوهات: {designerPosts.length}</span>
               <span className="text-sm bg-neutral-800 px-3 py-1 rounded-full text-teal-400 font-bold border border-teal-500/20">إجمالي المشاهدات: {selectedDesigner.totalViews.toLocaleString('ar-EG')}</span>
            </div>
          </div>
        </div>

        <h3 className="text-xl font-bold text-white mb-4">كل فيديوهات المصمم</h3>
        {designerPosts.length === 0 ? (
           <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center text-neutral-400">
             لا توجد فيديوهات حالياً لهذا المصمم
           </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {designerPosts.map(post => {
              const isFake = analyzeVideo(post.views, post.likes) === 'fake';
              
              return (
                <div key={post.id} className={`relative bg-neutral-900 border ${isFake ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'border-neutral-800'} rounded-xl overflow-hidden group hover:border-emerald-500 transition-colors`}>
                  <div className="aspect-[9/16] relative bg-neutral-800">
                     {post.coverImageUrl ? (
                       <img src={post.coverImageUrl} className="w-full h-full object-cover" alt="" />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center text-neutral-600"><Video size={32} /></div>
                     )}
                     <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent opacity-90" />
                     
                     {isFake && (
                       <div className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-red-900/50 z-10 border border-red-400/50">
                          <XCircle size={12} /> مشاهدات فيك
                       </div>
                     )}

                     <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                       <div className="flex justify-between items-center text-sm mb-3">
                         <span className="bg-neutral-900/80 backdrop-blur-sm text-white px-2 py-1 rounded border border-neutral-700 font-bold flex items-center gap-1.5 text-xs">
                           <Play size={12} className="fill-emerald-400 text-emerald-400" /> {(post.views || 0).toLocaleString('ar-EG')}
                         </span>
                         <span className={`px-2 py-1 rounded text-xs font-bold border ${isFake ? 'bg-red-500/20 text-red-500 border-red-500/30' : 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30'}`} dir="ltr">
                           {(((post.likes || 0) / Math.max(1, post.views || 1)) * 100).toFixed(1)}% <span className="opacity-70 font-normal">تفاعل</span>
                         </span>
                       </div>
                       <a href={post.videoUrl} target="_blank" rel="noreferrer" className="block w-full text-center py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors text-sm shadow-lg shadow-emerald-900/50">
                         فتح في تيك توك
                       </a>
                     </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Extract unique designers
  const m = new Map();
  posts.forEach(p => {
    const dId = p.uniqueId || p.designerName || 'unknown';
    if (!m.has(dId)) {
      m.set(dId, {
        id: dId,
        name: p.designerName || dId,
        image: p.authorAvatar && p.authorAvatar.startsWith('http') 
          ? p.authorAvatar 
          : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(p.designerName || dId)}&backgroundColor=059669,0d9488&textColor=ffffff`,
        postCount: 0,
        totalViews: 0
      });
    }
    const d = m.get(dId);
    d.postCount += 1;
    d.totalViews += (p.views || 0);

    // Update avatar if we get a better one
    if (p.authorAvatar && p.authorAvatar.startsWith('http') && (!d.image || d.image.includes('dicebear'))) {
       d.image = p.authorAvatar;
    }
  });

  const designers = Array.from(m.values()).sort((a, b) => b.postCount - a.postCount);

  return (
    <div className="space-y-6 max-w-6xl">
       <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">مصممي الهاشتاج 👥</h1>
          <p className="text-neutral-400">هنا بيظهر كل المصممين اللي نزلوا فيديوهات بالهاشتاج، وتقدر تدخل على ملف كل واحد تشوف فيديوهاته والتفاعل بتاعه.</p>
        </div>
      </div>
      
      {designers.length === 0 ? (
         <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center text-neutral-400">
           مفيش أي بيانات لمصممين حالياً
         </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {designers.map(d => (
            <button 
              key={d.id}
              onClick={() => setSelectedDesigner(d)}
              className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-emerald-500/50 p-6 rounded-xl text-center transition-all group shadow-sm flex flex-col items-center"
            >
              <div className="w-20 h-20 rounded-full overflow-hidden mb-4 border-2 border-neutral-700 group-hover:border-emerald-500 transition-colors shadow-md relative">
                 <img src={d.image} alt={d.name} className="w-full h-full object-cover" />
                 <div className="absolute inset-0 border border-black/10 rounded-full" />
              </div>
              <h3 className="text-white font-bold truncate mb-1 w-full">{d.name}</h3>
              <p className="text-neutral-500 text-xs mb-4 truncate w-full" dir="ltr">@{d.id}</p>
              <div className="flex justify-center gap-2 w-full mt-auto">
                <span className="bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 px-3 py-1.5 text-xs rounded-lg w-full flex justify-center items-center gap-2">
                  <Video size={14} /> فيديوهات: {d.postCount}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
