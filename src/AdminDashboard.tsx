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
  DollarSign,
  Star,
  AlertTriangle,
  Trophy
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

import { Top3DesignersTab } from './components/Top3DesignersTab';

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'requests' | 'settings' | 'tiktok' | 'designers' | 'video_analysis' | 'hashtag_designers' | 'staff' | 'top3_designers'>('requests');
  
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

  const [dashboardSearchQuery, setDashboardSearchQuery] = useState('');
  
  // Requests Filtering
  const filteredRequests = requests.filter(r => !dashboardSearchQuery || JSON.stringify(r).toLowerCase().includes(dashboardSearchQuery.toLowerCase()));
  const pendingRequests = filteredRequests.filter(r => r.status === 'pending');

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
                <span className="font-medium">تحليل المصممين</span>
              </button>

              <button 
                onClick={() => setActiveTab('top3_designers')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'top3_designers' ? 'bg-amber-500/10 text-amber-500' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
              >
                <Trophy size={20} />
                <span className="font-medium">أفضل 3 مصممين</span>
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
              <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-2">طلبات الانضمام {pendingRequests.length > 0 && <span className="text-emerald-500">({pendingRequests.length} جديد)</span>}</h1>
                  <p className="text-neutral-400">راجع الطلبات واختار المصممين اللي هيكملوا معانا.</p>
                </div>
                <div className="w-full md:w-auto relative">
                  <input 
                    type="text" 
                    placeholder="ابحث في الطلبات..." 
                    value={dashboardSearchQuery}
                    onChange={(e) => setDashboardSearchQuery(e.target.value)}
                    className="w-full md:w-80 bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {requests.length === 0 ? (
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center">
                  <Inbox size={48} className="mx-auto text-neutral-600 mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">مفيش طلبات لسة</h3>
                  <p className="text-neutral-400">أي حد هيطلب ينضم هيظهرلك هنا على طول.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRequests.map(request => (
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

                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-1">رابط Facebook</label>
                      <input 
                        type="url" 
                        name="facebookLink"
                        value={formSettings.facebookLink || ''}
                        onChange={handleChange}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                        dir="ltr"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-1">رابط YouTube</label>
                      <input 
                        type="url" 
                        name="youtubeLink"
                        value={formSettings.youtubeLink || ''}
                        onChange={handleChange}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                        dir="ltr"
                      />
                    </div>
                  
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-1">معرف تطبيق ديسكورد (Discord Client ID)</label>
                      <input 
                        type="text" 
                        name="discordClientId"
                        value={formSettings.discordClientId || ''}
                        onChange={handleChange}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                        dir="ltr"
                      />
                      <p className="text-xs text-neutral-500 mt-2">قم بوضع Client ID الخاص بتطبيقك. لا تنسى إضافة روابط الموقع <code>{window.location.origin}</code> في إعدادات Redirect URIs في Discord Developer Portal.</p>
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
            <DesignersAnalyticsTab posts={tiktokPosts} />
          ) : activeTab === 'top3_designers' ? (
            <Top3DesignersTab />
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
  const [searchQuery, setSearchQuery] = useState('');
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
        {designers.filter(d => !searchQuery || JSON.stringify(d).toLowerCase().includes(searchQuery.toLowerCase())).map(d => (
          <div key={d.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col gap-3 relative group">
            <div className="flex items-center gap-3">
              <img referrerPolicy="no-referrer" src={d.image} alt={d.name} onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(d.name || 'User')}&backgroundColor=059669,0d9488&textColor=ffffff`; }} className="w-12 h-12 rounded-full object-cover" />
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
  const [searchQuery, setSearchQuery] = useState('');
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
            authorAvatar: video.authorAvatar || '',
            uniqueId: video.uniqueId || '',
            videoUrl: video.videoUrl,
            coverImageUrl: video.coverImageUrl || '',
            views: video.views || 0,
            likes: video.likes || 0,
            comments: video.comments || 0,
            shares: video.shares || 0,
            downloads: video.downloads || 0,
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

      <div className="mb-4">
        <input 
          type="text" 
          placeholder="ابحث..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.filter(p => !searchQuery || JSON.stringify(p).toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
          <div key={p.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col gap-2 relative group overflow-hidden">
            <h4 className="font-bold text-white">{p.designerName}</h4>
            <div className="flex items-center justify-between text-sm text-neutral-400">
              <span>{p.views.toLocaleString('ar-EG')} مشاهدة</span>
              <span className={p.isReal ? 'text-emerald-500' : 'text-red-500'}>{p.isReal ? 'حقيقي' : 'فيك'}</span>
            </div>
            {p.coverImageUrl && <img referrerPolicy="no-referrer" src={p.coverImageUrl} onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop'; }} className="mt-2 w-full h-32 object-cover rounded-lg opacity-50" alt="" />}
            
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
                  <img referrerPolicy="no-referrer" src={post.coverImageUrl} onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop'; }} className="w-full h-full object-cover" alt="cover" />
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

function DesignersAnalyticsTab({ posts }: { posts: any[] }) {
  const [selectedDesigner, setSelectedDesigner] = useState<any>(null);

  // Group designers
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
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        bestVideo: null,
        exploreCount: 0
      });
    }
    const d = m.get(dId);
    d.postCount += 1;
    d.totalViews += (p.views || 0);
    d.totalLikes += (p.likes || 0);
    d.totalComments += (p.comments || 0);
    d.totalShares += (p.shares || 0);

    // Check if video is in explore (e.g. > 10000 views)
    if (p.views >= 10000) {
       d.exploreCount += 1;
    }

    // Best Video logic
    if (!d.bestVideo || (p.views || 0) > (d.bestVideo.views || 0)) {
       d.bestVideo = p;
    }

    if (p.authorAvatar && p.authorAvatar.startsWith('http') && (!d.image || d.image.includes('dicebear'))) {
       d.image = p.authorAvatar;
    }
  });

  const designers = Array.from(m.values()).sort((a, b) => b.totalViews - a.totalViews); // Sort by total views initially

  if (selectedDesigner) {
    const designerPosts = posts.filter(p => (p.uniqueId || p.designerName) === selectedDesigner.id)
       .sort((a, b) => (b.views || 0) - (a.views || 0));

    return (
      <div className="space-y-6 max-w-6xl">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setSelectedDesigner(null)} className="text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded-lg transition-colors font-medium text-sm border border-neutral-700">
            العودة للتحليل
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">تحليل المصمم: {selectedDesigner.name}</h1>
            <p className="text-neutral-400">{designerPosts.length} منشورات محملة</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
           <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl text-center">
             <div className="text-neutral-400 text-sm mb-1">إجمالي المشاهدات</div>
             <div className="text-2xl font-bold text-emerald-400">{selectedDesigner.totalViews.toLocaleString('ar-EG')}</div>
           </div>
           <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl text-center">
             <div className="text-neutral-400 text-sm mb-1">إجمالي اللايكات</div>
             <div className="text-2xl font-bold text-red-400">{selectedDesigner.totalLikes.toLocaleString('ar-EG')}</div>
           </div>
           <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl text-center">
             <div className="text-neutral-400 text-sm mb-1">التعليقات والمشاركات</div>
             <div className="text-2xl font-bold text-blue-400">{(selectedDesigner.totalComments + selectedDesigner.totalShares).toLocaleString('ar-EG')}</div>
           </div>
           <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl text-center">
             <div className="text-neutral-400 text-sm mb-1">فيديوهات الإكسبلور</div>
             <div className="text-2xl font-bold text-yellow-400">{selectedDesigner.exploreCount}</div>
           </div>
        </div>

        <h3 className="text-xl font-bold text-white mb-4">أفضل الفيديوهات (الترتيب حسب المشاهدات)</h3>
        {designerPosts.length === 0 ? (
           <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center text-neutral-400">
             لا توجد فيديوهات حالياً لهذا المصمم
           </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {designerPosts.map((post: any) => {
              return (
                <div key={post.id} className="relative bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden group hover:border-emerald-500 transition-colors">
                  <div className="aspect-[9/16] relative bg-neutral-800">
                     {post.coverImageUrl ? (
                       <img referrerPolicy="no-referrer" src={post.coverImageUrl} onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop'; }} className="w-full h-full object-cover" alt="" />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center text-neutral-600"><Video size={32} /></div>
                     )}
                     <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent opacity-90" />
                     
                     <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                       <div className="flex flex-wrap justify-between items-center text-sm mb-3 gap-2">
                         <span className="bg-neutral-900/80 backdrop-blur-sm text-white px-2 py-1 rounded border border-neutral-700 font-bold flex items-center gap-1.5 text-xs">
                           <Play size={12} className="fill-emerald-400 text-emerald-400" /> {(post.views || 0).toLocaleString('ar-EG')}
                         </span>
                         <span className="bg-neutral-900/80 backdrop-blur-sm text-white px-2 py-1 rounded border border-neutral-700 font-bold flex items-center gap-1.5 text-xs text-red-400">
                            ❤ {(post.likes || 0).toLocaleString('ar-EG')}
                         </span>
                         <span className="bg-neutral-900/80 backdrop-blur-sm text-white px-2 py-1 rounded border border-neutral-700 font-bold flex items-center gap-1.5 text-xs text-blue-400">
                            💬 {(post.comments || 0).toLocaleString('ar-EG')}
                         </span>
                       </div>
                       <a href={post.videoUrl} target="_blank" rel="noreferrer" className="block w-full text-center py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors text-sm shadow-lg shadow-emerald-900/50">
                         عرض في تيك توك
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

  return (
    <div className="space-y-6 max-w-6xl">
       <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">تحليل أداء المصممين 📈</h1>
          <p className="text-neutral-400">نظام تحليل شامل لجميع المصممين، المشاهدات، اللايكات، التعليقات، والإكسبلور.</p>
        </div>
      </div>

      {designers.length === 0 ? (
         <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center text-neutral-400">
           مفيش أي بيانات لمصممين حالياً للتحليل
         </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="bg-neutral-950 border-b border-neutral-800 text-neutral-400">
                  <th className="p-4 font-medium">المصمم</th>
                  <th className="p-4 font-medium">المنشورات</th>
                  <th className="p-4 font-medium">المشاهدات</th>
                  <th className="p-4 font-medium">اللايكات</th>
                  <th className="p-4 font-medium">التعليقات</th>
                  <th className="p-4 font-medium">الإكسبلور</th>
                  <th className="p-4 font-medium">الأفضل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {designers.map(d => (
                  <tr key={d.id} className="hover:bg-neutral-800/50 transition-colors group cursor-pointer" onClick={() => setSelectedDesigner(d)}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                         <img referrerPolicy="no-referrer" src={d.image} onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(d.name || 'User')}&backgroundColor=059669,0d9488&textColor=ffffff`; }} className="w-10 h-10 rounded-full object-cover border border-neutral-700" alt="" />
                         <div>
                           <div className="font-bold text-white group-hover:text-emerald-400 transition-colors">{d.name}</div>
                           <div className="text-xs text-neutral-500" dir="ltr">@{d.id}</div>
                         </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="bg-neutral-800 px-2.5 py-1 rounded text-white font-medium">{d.postCount}</span>
                    </td>
                    <td className="p-4">
                       <div className="font-bold text-emerald-400 flex items-center gap-1.5"><Play size={14} /> {d.totalViews.toLocaleString('ar-EG')}</div>
                    </td>
                    <td className="p-4 text-red-400 font-bold">
                       {d.totalLikes.toLocaleString('ar-EG')}
                    </td>
                    <td className="p-4 text-blue-400 font-bold">
                       {d.totalComments.toLocaleString('ar-EG')}
                    </td>
                    <td className="p-4">
                       {d.exploreCount > 0 ? (
                         <span className="bg-yellow-500/10 text-yellow-500 font-bold px-2.5 py-1 rounded flex items-center gap-1 w-max">
                           <Star size={12} className="fill-yellow-500" /> {d.exploreCount}
                         </span>
                       ) : <span className="text-neutral-600">-</span>}
                    </td>
                    <td className="p-4">
                       {d.bestVideo && (
                         <div className="text-xs text-neutral-400">
                           <div className="text-white font-bold mb-1">{(d.bestVideo.views || 0).toLocaleString('ar-EG')} مشاهدة</div>
                         </div>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
