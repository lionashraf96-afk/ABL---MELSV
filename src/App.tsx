import { motion, AnimatePresence } from 'motion/react';
import { PenTool, X, Send, Image as ImageIcon, Video, Layers, Users, Zap, Star, TrendingUp, Play, MessageCircle, MessageSquare, CheckCircle, Clock, Search, Download, AlertTriangle, Instagram, Youtube, Facebook } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AdminDashboard from './AdminDashboard';
import { db } from './lib/firebase';
import { useSettings } from './hooks/useSettings';
import { useDiscordAuth } from './hooks/useDiscordAuth';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

function Navbar({ settings }: { settings?: any }) {
  const { discordUser, login, logout } = useDiscordAuth(settings?.discordClientId);

  return (
    <nav className="fixed top-0 w-full z-50 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0 flex items-center gap-6">
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
              <PenTool size={24} className="text-emerald-500"/>
              3mr5rtoum
            </span>
            {discordUser ? (
              <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-full pr-1 pl-3 py-1">
                <img referrerPolicy="no-referrer" src={discordUser.avatar} alt="User" onError={(e) => { e.currentTarget.src = 'https://api.dicebear.com/7.x/initials/svg?seed=U&backgroundColor=059669,0d9488&textColor=ffffff'; }} className="w-8 h-8 rounded-full border border-indigo-500" />
                <span className="text-sm font-semibold text-white">{discordUser.global_name || discordUser.username}</span>
                <button onClick={logout} className="ml-2 text-xs text-red-500 hover:text-red-400 font-medium">تسجيل الخروج</button>
              </div>
            ) : (
              <button onClick={login} className="flex bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs sm:text-sm font-bold py-1.5 px-3 rounded-lg transition-colors items-center gap-2 shadow-lg shadow-indigo-900/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M13.545 2.907a13.227 13.227 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.19 12.19 0 0 0-3.658 0 8.258 8.258 0 0 0-.412-.833.051.051 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.041.041 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032c.001.014.01.028.021.037a13.276 13.276 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019c.308-.42.582-.863.818-1.329a.05.05 0 0 0-.01-.059.051.051 0 0 0-.018-.011 8.875 8.875 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019c.084-.063.168-.129.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.052.052 0 0 1 .053.007c.08.066.164.132.248.195a.051.051 0 0 1-.004.085 8.254 8.254 0 0 1-1.249.594.05.05 0 0 0-.03.03.052.052 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.235 13.235 0 0 0 4.001-2.02.049.049 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.034.034 0 0 0-.02-.019Zm-8.198 7.307c-.789 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612Zm5.316 0c-.788 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612Z"/>
                </svg>
                دخول
              </button>
            )}
          </div>
          
          <div className="hidden md:block">
            <div className="ms-10 flex items-baseline space-x-4 space-x-reverse">
              <a href="#hero" className="hover:text-emerald-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">الرئيسية</a>
              <a href="#top-designers" className="hover:text-emerald-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">أحسن المصممين</a>
              <a href="#support" className="hover:text-emerald-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">الدعم الفني</a>
              <a href="#amr-accounts" className="hover:text-emerald-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">حسابات عمر</a>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function JoinModal({ isOpen, onClose, settings }: { isOpen: boolean, onClose: () => void, settings?: any }) {
  const [formData, setFormData] = useState({
    name: '',
    tiktokUsername: '',
    since: '',
    reason: '',
    image: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { discordUser, login, logout, setDiscordUser } = useDiscordAuth(settings?.discordClientId);

  useEffect(() => {
    if (discordUser && !formData.name) {
       setFormData(prev => ({ ...prev, name: discordUser.global_name || discordUser.username, image: discordUser.avatar }));
    }
  }, [discordUser]);

  const handleDiscordLogin = async (e: React.MouseEvent) => {
    e.preventDefault();
    login();
  };

  const handleLogoutDiscord = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
    setFormData(prev => ({ ...prev, name: '', image: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!discordUser && !formData.image) {
      // Allow them without an image, or they can use discord. But wait, for now let's just let them without image 
      // by not having any check for image, so they just submit. Wait, if we don't have an image at all, it's fine.
    }

    setIsSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, 'joinRequests'), {
        ...formData,
        status: 'pending',
        discordId: discordUser?.id || null, // save discord info if available
        createdAt: serverTimestamp()
      });
      localStorage.setItem('joinRequestId', docRef.id);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
        setFormData({ name: '', tiktokUsername: '', since: '', reason: '', image: '' });
      }, 3000);
    } catch (error) {
      console.error("Error submitting request:", error);
      alert("حدث خطأ أثناء إرسال الطلب. حاول مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-neutral-900 border border-neutral-700/50 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/50">
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                <Zap className="text-emerald-500" />
                طلب انضمام للمصممين
              </h3>
              <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors p-1 bg-neutral-800 rounded-full hover:bg-neutral-700">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 sm:p-8">
              {submitted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Send size={40} />
                  </div>
                  <h4 className="text-2xl font-bold text-white mb-2">تم استلام طلبك يا مبدع!</h4>
                  <p className="text-neutral-400">راجعنا طلبك وهنرد عليك في أقرب وقت.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Discord Login Button */}
                  <div className="bg-neutral-950 p-4 border border-neutral-800 rounded-xl flex flex-col items-center gap-3">
                    {discordUser ? (
                      <div className="flex items-center gap-4 w-full">
                        <img referrerPolicy="no-referrer" src={discordUser.avatar} alt="Discord Avatar" onError={(e) => { e.currentTarget.src = 'https://api.dicebear.com/7.x/initials/svg?seed=U&backgroundColor=059669,0d9488&textColor=ffffff'; }} className="w-12 h-12 rounded-full border border-indigo-500" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold truncate">{discordUser.global_name || discordUser.username}</p>
                          <p className="text-neutral-400 text-xs truncate">تم التسجيل بالديسكورد</p>
                        </div>
                        <button onClick={handleLogoutDiscord} className="text-xs text-red-500 hover:text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">
                          تغيير
                        </button>
                      </div>
                    ) : (
                      <>
                        <button onClick={handleDiscordLogin} className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg flex justify-center items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M13.545 2.907a13.227 13.227 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.19 12.19 0 0 0-3.658 0 8.258 8.258 0 0 0-.412-.833.051.051 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.041.041 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032c.001.014.01.028.021.037a13.276 13.276 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019c.308-.42.582-.863.818-1.329a.05.05 0 0 0-.01-.059.051.051 0 0 0-.018-.011 8.875 8.875 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019c.084-.063.168-.129.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.052.052 0 0 1 .053.007c.08.066.164.132.248.195a.051.051 0 0 1-.004.085 8.254 8.254 0 0 1-1.249.594.05.05 0 0 0-.03.03.052.052 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.235 13.235 0 0 0 4.001-2.02.049.049 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.034.034 0 0 0-.02-.019Zm-8.198 7.307c-.789 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612Zm5.316 0c-.788 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612Z"/>
                          </svg>
                          التسجيل الدخول باستخدام ديسكورد
                        </button>
                        <p className="text-xs text-neutral-500">هيتم إضافة اسمك وصورتك من الديسكورد تلقائياً</p>
                      </>
                    )}
                  </div>

                  {!discordUser ? (
                    <div className="text-center py-6 border-t border-neutral-800">
                      <p className="text-neutral-400">لازم تسجل دخول بالديسكورد الأول عشان تقدر تبعت طلب الانضمام.</p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-neutral-300 mb-2">يوزر التيك توك</label>
                        <input 
                          required
                          type="text" 
                          value={formData.tiktokUsername}
                          onChange={e => setFormData({...formData, tiktokUsername: e.target.value})}
                          placeholder="@username"
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-neutral-600"
                          dir="ltr"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-neutral-300 mb-2">بتتابع عمر من امتى؟</label>
                        <input 
                          required
                          type="text" 
                          value={formData.since}
                          onChange={e => setFormData({...formData, since: e.target.value})}
                          placeholder="سنة، شهر، ولا لسة جديد؟"
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-neutral-600"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-neutral-300 mb-2">ليه عايز تنضم لينا؟ وإيه اللي بيميزك؟</label>
                        <textarea 
                          required
                          value={formData.reason}
                          onChange={e => setFormData({...formData, reason: e.target.value})}
                          placeholder="احكيلنا عن إبداعك وشغفك بالتصميم..."
                          rows={4}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-neutral-600 resize-none"
                        />
                      </div>

                      <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex justify-center items-center gap-2 disabled:opacity-70"
                      >
                        {isSubmitting ? (
                          <span className="animate-pulse">جاري الإرسال...</span>
                        ) : (
                          <>
                            إرسال الطلب
                            <Send size={20} className="rtl:-scale-x-100" />
                          </>
                        )}
                      </button>
                    </>
                  )}
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Hero({ heroBackground, mainHashtag, settings }: { heroBackground?: string, mainHashtag?: string, settings?: any }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [joinStatus, setJoinStatus] = useState<string | null>(null);
  const { discordUser } = useDiscordAuth(settings?.discordClientId);

  useEffect(() => {
    import('firebase/firestore').then(({ doc, query, collection, where, onSnapshot }) => {
      let unsubs: (() => void)[] = [];

      if (discordUser) {
        const q = query(collection(db, 'joinRequests'), where('discordId', '==', discordUser.id));
        const unsubDiscord = onSnapshot(q, (snap) => {
          if (!snap.empty) {
             const latest = snap.docs.sort((a,b) => {
               const aTime = a.data().createdAt?.toMillis ? a.data().createdAt.toMillis() : 0;
               const bTime = b.data().createdAt?.toMillis ? b.data().createdAt.toMillis() : 0;
               return bTime - aTime;
             })[0];
             setJoinStatus(latest?.data()?.status || null);
          } else {
             checkLocalStorageStatus();
          }
        }, (err) => console.error(err));
        unsubs.push(unsubDiscord);
      } else {
        checkLocalStorageStatus();
      }

      function checkLocalStorageStatus() {
         const requestId = localStorage.getItem('joinRequestId');
         if (!requestId) return;
         const unsubLocal = onSnapshot(doc(db, 'joinRequests', requestId), (docSnap) => {
           if (docSnap.exists()) {
             setJoinStatus(docSnap.data().status);
           }
         }, (err) => console.error(err));
         unsubs.push(unsubLocal);
      }

      return () => {
        unsubs.forEach(fn => fn());
      };
    });
  }, [discordUser, isModalOpen]);

  return (
    <section id="hero" className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden min-h-screen flex items-center">
      {heroBackground ? (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-luminosity"
          style={{ backgroundImage: `url(${heroBackground})` }}
        ></div>
      ) : (
        <div className="absolute inset-0 bg-neutral-950"></div>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/50 to-neutral-950"></div>
      
      {/* Decorative blobs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(5,150,105,0.1) 0%, rgba(0,0,0,0) 70%)' }}></div>
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(13,148,136,0.05) 0%, rgba(0,0,0,0) 70%)' }}></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center text-white">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="max-w-4xl mx-auto"
        >
          <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900/80 border border-neutral-800 text-emerald-400 font-medium tracking-wide mb-8">
            <Star size={16} className="fill-emerald-400" />
            <span>نخبة مصممين اديتور</span>
          </motion.div>

          <motion.h1 variants={fadeIn} className="text-5xl md:text-8xl font-extrabold tracking-tighter mb-6 leading-[1.1]">
            <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
              3mr5rtoum
            </span>
          </motion.h1>
          
          <motion.p variants={fadeIn} className="text-xl md:text-2xl text-neutral-400 mb-12 leading-relaxed max-w-2xl mx-auto">
            انضم لأقوى مجتمع مصممين. بنصنع الإبداع، بنطور مهاراتنا، وبنشارك في مشاريع قوية. مكانك هنا لو عندك الشغف والطموح.
          </motion.p>
          
          <motion.div variants={fadeIn} className="flex flex-col sm:flex-row justify-center gap-4">
            {joinStatus === 'approved' ? (
               <div className="px-8 py-4 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/50 font-bold text-xl flex items-center justify-center gap-3">
                 <CheckCircle size={24} />
                 تم القبول في فريق المصممين
               </div>
            ) : joinStatus === 'pending' ? (
               <div className="px-8 py-4 rounded-xl bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 font-bold text-xl flex items-center justify-center gap-3">
                 <Clock size={24} />
                 طلب الانضمام قيد المراجعة
               </div>
            ) : (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xl hover:scale-105 transition-transform flex items-center justify-center gap-3 shadow-xl shadow-emerald-900/20"
              >
                طلب انضمام
                <Zap size={24} className="fill-white/20" />
              </button>
            )}
          </motion.div>

          {mainHashtag && (
            <motion.div variants={fadeIn} className="mt-12 inline-block">
              <span className="text-sm font-medium text-neutral-500 mb-2 block">شاركنا إبداعك على تيك توك:</span>
              <span className="px-4 py-2 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 rounded-lg text-lg font-bold tracking-wider select-all" dir="ltr">
                {mainHashtag}
              </span>
            </motion.div>
          )}
        </motion.div>
      </div>

      <JoinModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} settings={settings} />
    </section>
  );
}

function KickStreamer({ settings }: { settings: any }) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!settings.kickUsername || settings.kickUsername.trim() === '') {
      setLoading(false);
      return;
    }

    if (settings.kickLiveOverride) {
      setStatus({
        live: true,
        title: settings.kickLiveTitle,
        viewers: settings.kickLiveViewers,
        category: settings.kickLiveCategory,
        user: { avatar: '' }
      });
      setLoading(false);
      return;
    }

    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/kick-status/${encodeURIComponent(settings.kickUsername.trim())}`);
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const data = await res.json();
          if (data.error && data.error === 'cloudflare_blocked') {
             console.warn("Kick API blocked by Cloudflare. Provide SCRAPERAPI_KEY in environment variables.");
             setStatus({ live: false, user: { avatar: '' } });
             return;
          }
          if (data.error || (!data.live && !data.user)) {
             setStatus({ live: false, user: { avatar: '' } });
             return;
          }
          setStatus(data);
        } else {
          setStatus({ live: false, user: { avatar: '' } });
        }
      } catch (err) {
         console.error(err);
         setStatus((prev: any) => prev || { live: false, user: { avatar: '' } });
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, [settings.kickUsername, settings.kickLiveOverride, settings.kickLiveTitle, settings.kickLiveViewers, settings.kickLiveCategory]);

  if (!settings.kickUsername) return null;

  return (
    <section className="py-8 bg-neutral-950 px-4 md:px-12 relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-2xl relative overflow-hidden"
        >
          {status?.live && (
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
          )}
          
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-neutral-800 relative flex-shrink-0 bg-neutral-950 flex items-center justify-center">
            {status?.user?.avatar || status?.thumbnail ? (
               <img referrerPolicy="no-referrer" src={status?.user?.avatar || settings?.kickProfileImage || status?.thumbnail} alt="Kick Profile" onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop'; }} className="w-full h-full object-cover" />
            ) : (
               <Video size={32} className="text-neutral-500" />
            )}
            {status?.live && (
              <div className="absolute bottom-0 right-1/2 translate-x-1/2 translate-y-1/4 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400">LIVE</div>
            )}
          </div>
          
          <div className="flex-1 text-center md:text-right">
             <div className="flex flex-col md:flex-row items-center gap-3 mb-2 justify-center md:justify-start">
               <h3 className="text-2xl font-bold text-white uppercase tracking-wider">{settings.kickUsername}</h3>
               {status?.live ? (
                 <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full text-sm font-medium border border-emerald-500/20">
                   <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                   بث مباشر الآن
                 </span>
               ) : (
                 <span className="flex items-center gap-1.5 text-neutral-500 bg-neutral-900 px-3 py-1 rounded-full text-sm font-medium border border-neutral-800">
                   أوفلاين
                 </span>
               )}
             </div>
             {status?.live ? (
               <div>
                  <p className="text-neutral-300 text-lg mb-1">{status.title}</p>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-neutral-400">
                    <span className="flex items-center gap-1.5">
                      <Users size={16} className="text-blue-400" />
                      {status.viewers?.toLocaleString() || 0} مشاهد
                    </span>
                    {status.category && (
                      <span className="flex items-center gap-1.5">
                        <Layers size={16} className="text-purple-400" />
                        {status.category}
                      </span>
                    )}
                  </div>
               </div>
             ) : (
               <p className="text-neutral-400 mt-1">البث مقفول حالياً. تابع الحساب عشان يوصلك إشعار أول ما يفتح.</p>
             )}
          </div>
          
          <div className="flex-shrink-0 mt-4 md:mt-0 w-full md:w-auto">
             <a 
               href={`https://kick.com/${settings.kickUsername}`} 
               target="_blank" 
               rel="noopener noreferrer"
               className="block w-full md:w-auto text-center bg-[#53FC18] hover:bg-[#4be615] text-black font-bold px-8 py-3 rounded-lg transition-transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(83,252,24,0.3)]"
             >
               {status?.live ? 'شاهد البث الآن' : 'زيارة القناة'}
             </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function KickClipsGallery() {
  const [autoClips, setAutoClips] = useState<any[]>([]);
  const { settings } = useSettings();
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    if (settings.kickUsername && settings.kickUsername.trim() !== '') {
        setLoading(true);
        setFetchError(null);
        fetch(`/api/kick-clips/${encodeURIComponent(settings.kickUsername.trim())}`)
          .then(res => res.json())
          .then(data => {
             if (!mounted) return;
             if (data && data.error === 'cloudflare_blocked') {
                setFetchError('تم حظر الاتصال بكيك بسبب الحماية (Cloudflare). يجب إضافة مفتاح ScraperAPI في لوحة التحكم (البيئة) لجلب الكليبات تلقائياً.');
                setAutoClips([]);
             } else if (data && data.clips) {
                const fetchedClips = data.clips.map((c: any) => ({
                   id: c.id,
                   title: c.title,
                   url: c.video_url || c.clip_url,
                   kickUrl: `https://kick.com/${c.channel?.slug || settings.kickUsername}/clips/${c.id}`,
                   thumbnail: c.thumbnail_url,
                   views: c.view_count || c.views,
                   createdAt: new Date(c.created_at) // For sorting
                }));
                setAutoClips(fetchedClips);
             } else {
                setAutoClips([]);
             }
          })
          .catch(err => {
             console.error("Failed to load Kick auto clips:", err);
             if (mounted) {
                setAutoClips([]);
                setFetchError('حدث خطأ أثناء جلب الكليبات التلقائية.');
             }
          })
          .finally(() => {
             if (mounted) setLoading(false);
          });
    } else {
      setAutoClips([]);
    }
    return () => { mounted = false; };
  }, [settings.kickUsername]);

  // Combine and sort clips
  const rawClips = [...autoClips];
  const clips = rawClips.filter(c => c.title?.toLowerCase().includes(searchQuery.toLowerCase()));

  if (rawClips.length === 0 && !loading && !fetchError) return null;

  return (
    <section className="py-24 bg-neutral-900 border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 md:px-12">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-full font-medium mb-6">
            <Video size={18} />
            <span>قسم الكليبات</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white tracking-tight">قسم الكليبات 🎬</h2>
          <p className="text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed mb-8">
            مجموعة من أقوى وأمتع كليبات البث المباشر، جاهزة للتحميل عشان تبدع في تصاميمك.
          </p>

          <div className="max-w-xl mx-auto relative">
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
               <Search size={20} className="text-neutral-500" />
            </div>
            <input 
              type="text" 
              placeholder="ابحث في الكليبات..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-xl py-3 pr-12 pl-4 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </motion.div>

        {loading ? (
           <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
           </div>
        ) : fetchError && rawClips.length === 0 ? (
           <div className="text-center bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-xl max-w-2xl mx-auto">
             <AlertTriangle size={24} className="mx-auto mb-3" />
             <p>{fetchError}</p>
           </div>
        ) : clips.length === 0 && searchQuery ? (
           <div className="text-center text-neutral-500 py-12">
             لا توجد كليبات مطابقة للبحث "{searchQuery}"
           </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clips.map((clip, idx) => (
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              key={clip.id} 
              className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden group hover:border-emerald-500/50 transition-colors"
            >
              <div 
                className="aspect-video bg-neutral-900 relative flex items-center justify-center bg-cover bg-center"
                style={clip.thumbnail ? { backgroundImage: `url(${clip.thumbnail})` } : {}}
              >
                {!clip.thumbnail && <Video size={48} className="text-neutral-700 group-hover:scale-110 transition-transform duration-500" />}
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 to-transparent opacity-80 group-hover:opacity-60 transition-opacity"></div>
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-sm text-neutral-300">
                  <div className="flex items-center gap-2">
                     <Play size={16} className="text-emerald-500" /> كليب
                  </div>
                  {clip.views !== undefined && (
                     <div className="text-xs bg-neutral-950/80 px-2 py-1 rounded-md text-emerald-400">{clip.views} مشاهدة</div>
                  )}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-4 line-clamp-2">{clip.title}</h3>
                
                <div className="space-y-3">
                  <a href={clip.url} target="_blank" rel="noopener noreferrer" className="block w-full text-center bg-neutral-800 hover:bg-neutral-700 text-white font-medium py-2 rounded-lg transition-colors">
                    مشاهدة
                  </a>
                  {clip.url?.toLowerCase().endsWith('.mp4') ? (
                     <a href={clip.url} download target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg transition-colors">
                        <Download size={18} /> تحميل الكليب مباشر
                     </a>
                  ) : (
                     <a href={`https://kick-video.download/?url=${encodeURIComponent(clip.kickUrl || clip.url)}`} target="_blank" rel="noopener noreferrer" title="سيتم تحويلك لأداة تحميل الكليبات (استخدم الرابط المنسوخ إن لزم)" className="flex w-full items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg transition-colors">
                        <Download size={18} /> تحميل الكليب 
                     </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        )}
      </div>
    </section>
  );
}

function TopDesigners() {
  const [onlineCount, setOnlineCount] = useState(142);
  const [designers, setDesigners] = useState<any[]>([]);

  useEffect(() => {
    // We want to fetch BOTH "designers" and "tiktokPosts" to merge them dynamically.
    const unsubDesigners = onSnapshot(collection(db, 'designers'), (snap) => {
      const dbDesigners = new Map();
      snap.forEach(doc => {
        const d = doc.data();
        dbDesigners.set(d.name, { id: doc.id, ...d });
        if (d.role && typeof d.role === 'string' && d.role.startsWith('@')) {
           // Also map by uniqueId (without the @)
           dbDesigners.set(d.role.replace('@', ''), { id: doc.id, ...d });
        }
        if (d.bestVideoUrl && d.bestVideoUrl.includes('@')) {
           // Extract uniqueId from URL if possible
           const match = d.bestVideoUrl.match(/@([a-zA-Z0-9_.-]+)/);
           if (match && match[1]) {
             dbDesigners.set(match[1], { id: doc.id, ...d });
           }
        }
      });

      const q = query(collection(db, 'tiktokPosts'), orderBy('createdAt', 'desc'));
      const unsubTikTok = onSnapshot(q, (ttSnap) => {
        const topMap = new Map();
        
        // 1. First add all official designers mapped by a strong key (name or uniqueId fallback)
        for (const [key, d] of dbDesigners.entries()) {
          const refName = d.name || 'مجهول';
          if (!topMap.has(refName)) {
            topMap.set(refName, {
              id: d.id,
              name: refName,
              image: d.image && d.image.startsWith('http') ? d.image : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(refName)}&backgroundColor=059669,0d9488&textColor=ffffff`,
              postCount: 0,
              views: 0,
              likes: 0,
              bestVideoUrl: d.bestVideoUrl,
              specialty: d.specialty || "مصمم",
              role: d.role || "TikTok Creator",
              description: d.description
            });
          }
        }

        // 2. Add TikTok authors and aggregate stats
        ttSnap.forEach(doc => {
          const post = doc.data();
          const authorKey = post.uniqueId || post.designerName || 'unknown';
          
          let officialDesigner = dbDesigners.get(post.uniqueId) || dbDesigners.get(post.designerName) || dbDesigners.get(authorKey);
          let mappedName = officialDesigner ? officialDesigner.name : authorKey;

          if (!topMap.has(mappedName)) {
            topMap.set(mappedName, {
              id: mappedName,
              name: post.designerName || mappedName,
              image: post.authorAvatar && post.authorAvatar.startsWith('http') 
                ? post.authorAvatar 
                : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(post.designerName || mappedName)}&backgroundColor=059669,0d9488&textColor=ffffff`,
              postCount: 0,
              views: 0,
              likes: 0,
              bestVideoUrl: post.videoUrl,
              specialty: "مشارك فيديوهات",
              role: post.uniqueId ? "@" + post.uniqueId : "TikTok Creator"
            });
          }

          const designer = topMap.get(mappedName);
          designer.postCount += 1;
          designer.views += (post.views || 0);
          designer.likes += (post.likes || 0);

          // Update avatar from tiktok if missing or using generic dicebear/unsplash placeholders
          if (post.authorAvatar && post.authorAvatar.startsWith('http')) {
             if (!designer.image || designer.image.includes('dicebear') || designer.image.includes('unsplash')) {
                 designer.image = post.authorAvatar;
             }
          }
        });

        const sorted = Array.from(topMap.values()).sort((a, b) => b.postCount - a.postCount);
        const uniqueDesigners = [];
        const seenNames = new Set();
        for (const d of sorted) {
          const normName = (d.name || "").toLowerCase().trim();
          if (!seenNames.has(normName)) {
            seenNames.add(normName);
            uniqueDesigners.push(d);
          }
        }
        setDesigners(uniqueDesigners.slice(0, 10));
      }, (error) => console.log("Des error", error));

      return () => unsubTikTok();
    });

    return () => unsubDesigners();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCount(prev => {
        const change = (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 4);
        return Math.max(120, Math.min(180, prev + change));
      });
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="top-designers" className="py-24 relative bg-neutral-950 overflow-hidden">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full overflow-hidden">
        <div className="text-center mb-16">
          <h2 className="text-sm font-bold text-emerald-500 tracking-widest uppercase mb-3">Hall of Fame</h2>
          <h3 className="text-3xl md:text-5xl font-extrabold text-white">احسن 10 مصممين</h3>
          <div className="w-24 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 mx-auto mt-6 rounded-full"></div>
        </div>
        
        <div 
          className="flex overflow-x-auto pb-10 pt-4 gap-6 px-4 md:px-8 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {designers.length === 0 ? (
            <div className="w-full text-center py-10 opacity-60">
              <p className="text-white">جاري جمع أفضل المصممين من الهاشتاج...</p>
            </div>
          ) : (
            designers.slice(0, 10).map((designer, idx) => (
              <motion.div
                key={designer.id || idx}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, type: "spring", stiffness: 100 }}
                className="flex flex-col items-center flex-shrink-0 snap-center min-w-[140px] md:min-w-[180px]"
              >
                <div className="relative group cursor-pointer mb-5">
                {/* TikTok style colorful gradient ring */}
                <div className="absolute -inset-1.5 bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-600 rounded-full blur-[2px] opacity-70 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute -inset-1.5 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-full group-hover:rotate-180 transition-transform duration-700"></div>
                
                <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-neutral-950">
                  <img referrerPolicy="no-referrer" 
                    src={designer.image} 
                    alt={designer.name} 
                    onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(designer.name || 'User')}&backgroundColor=059669,0d9488&textColor=ffffff`; }}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-neutral-950/20 group-hover:bg-neutral-950/0 transition-colors"></div>
                </div>
              </div>

              <h4 className="text-lg font-bold text-white mb-1 truncate text-center w-full">{designer.name}</h4>
              <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1 px-2 py-0.5 bg-emerald-500/10 rounded-full inline-block">{designer.specialty}</p>
              <div className="flex gap-2 items-center mt-1">
                <span className="text-neutral-400 text-xs">{designer.role}</span>
                {designer.postCount !== undefined && (
                  <span className="text-teal-400 text-xs font-bold bg-teal-500/10 px-2 py-0.5 rounded-md">
                    {designer.postCount} فيديوهات
                  </span>
                )}
              </div>
              
              {designer.description && (
                <p className="text-neutral-400 text-[10px] md:text-xs text-center mt-3 max-w-[140px] md:max-w-[180px] line-clamp-3 leading-relaxed">
                  {designer.description}
                </p>
              )}
              
              {designer.bestVideoUrl && (
                <a 
                  href={designer.bestVideoUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="mt-3 text-[10px] md:text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-3 py-1.5 md:px-4 md:py-2 rounded-full inline-flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-900/20 whitespace-nowrap"
                >
                  <Play size={10} className="md:w-3 md:h-3" fill="currentColor" /> عرض الحساب أو الفيديو
                </a>
              )}
            </motion.div>
            ))
          )}
        </div>
        
        <style>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>
    </section>
  );
}

function SupportSection({ settings }: { settings: any }) {
  return (
    <section id="support" className="py-32 relative bg-neutral-900 border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div>
            <h2 className="text-sm font-bold text-teal-500 tracking-widest uppercase mb-3">Support</h2>
            <h3 className="text-4xl md:text-5xl font-extrabold text-white">الدعم الفني</h3>
          </div>
          <p className="text-neutral-400 max-w-md text-lg leading-relaxed">
            عندك استفسار أو مشكلة؟ تواصل مع فريق الدعم الفني، وإحنا دايماً معاك لحلها.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <a
            href={settings.discordLink && settings.discordLink !== '#' ? settings.discordLink : '#'}
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col items-center justify-center p-10 bg-neutral-800/50 hover:bg-[#5865F2]/10 border border-neutral-800 hover:border-[#5865F2]/50 rounded-2xl transition-all"
          >
            <div className="w-20 h-20 bg-neutral-900 group-hover:bg-[#5865F2]/20 text-neutral-400 group-hover:text-[#5865F2] rounded-full flex items-center justify-center mb-6 transition-all duration-300">
              <MessageSquare size={40} />
            </div>
            <h4 className="text-2xl font-bold text-white mb-2">سيرفر الديسكورد</h4>
            <p className="text-neutral-500 text-center">أسرع طريقة للتواصل والنقاش</p>
          </a>

          <a
            href={settings.whatsappLink && settings.whatsappLink !== '#' ? settings.whatsappLink : '#'}
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col items-center justify-center p-10 bg-neutral-800/50 hover:bg-[#25D366]/10 border border-neutral-800 hover:border-[#25D366]/50 rounded-2xl transition-all"
          >
            <div className="w-20 h-20 bg-neutral-900 group-hover:bg-[#25D366]/20 text-neutral-400 group-hover:text-[#25D366] rounded-full flex items-center justify-center mb-6 transition-all duration-300">
              <MessageCircle size={40} />
            </div>
            <h4 className="text-2xl font-bold text-white mb-2">جروب الواتساب</h4>
            <p className="text-neutral-500 text-center">تواصل مباشر وسريع</p>
          </a>
        </div>
      </div>
    </section>
  );
}

function TikTokTracker({ mainHashtag }: { mainHashtag?: string }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'today' | 'week'>('all');
  const [visibleCount, setVisibleCount] = useState(15);

  useEffect(() => {
    const q = query(collection(db, 'tiktokPosts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: any[] = [];
      const seenUrls = new Set();
      snapshot.forEach(doc => {
        const data = doc.data();
        if (!seenUrls.has(data.videoUrl)) {
           seenUrls.add(data.videoUrl);
           fetched.push({ id: doc.id, ...data });
        } else {
           // Delete duplicate from firestore
           import('firebase/firestore').then(({ deleteDoc }) => {
              deleteDoc(doc.ref).catch(console.error);
           });
        }
      });
      setPosts(fetched);
    }, (error) => console.log('Error fetching TikTok posts:', error));
    return () => unsubscribe();
  }, []);

  return (
    <section className="py-24 relative bg-neutral-900 border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div>
            <h2 className="text-sm font-bold text-teal-500 tracking-widest uppercase mb-3">Trending Now</h2>
            <h3 className="text-3xl md:text-5xl font-extrabold text-white flex items-center gap-3">
              تريند تيك توك <Video className="text-emerald-500" size={32} />
            </h3>
          </div>
          <div className="text-right">
            <p className="text-neutral-400 max-w-md text-lg leading-relaxed mb-2">
              تابع أحدث الفيديوهات اللي نزلها المصممين على الهاشتاج بتاعنا وشوف التفاعل الأسطوري.
            </p>
            {mainHashtag && (
              <span className="inline-block px-3 py-1 bg-neutral-800 border border-neutral-700 rounded-lg text-emerald-400 font-bold" dir="ltr">{mainHashtag}</span>
            )}
          </div>
        </div>

        <div className="max-w-3xl mx-auto mb-8 relative">
          <input
            type="text"
            placeholder="ابحث عن فيديو أو اسم المصمم..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 px-4 pl-12 text-white focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
        </div>

        <div className="max-w-3xl mx-auto mb-10 flex flex-wrap gap-3 justify-end">
          <button
            onClick={() => setFilterCategory('week')}
            className={`px-6 py-2 rounded-full font-medium transition-colors ${filterCategory === 'week' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white border border-neutral-700'}`}
          >
            فيديوهات آخر 7 أيام
          </button>
          <button
            onClick={() => setFilterCategory('today')}
            className={`px-6 py-2 rounded-full font-medium transition-colors ${filterCategory === 'today' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white border border-neutral-700'}`}
          >
            فيديوهات آخر اليوم
          </button>
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-6 py-2 rounded-full font-medium transition-colors ${filterCategory === 'all' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white border border-neutral-700'}`}
          >
            الكل
          </button>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-20 bg-neutral-950 rounded-2xl border border-neutral-800">
             <p className="text-neutral-500 text-lg">لسة مفيش فيديوهات متوثقة على الهاشتاج... كن أول من يشارك!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 max-w-3xl mx-auto">
            {posts
              .filter(post => {
                 const searchLower = searchTerm.toLowerCase();
                 const matchesSearch = (post.designerName || '').toLowerCase().includes(searchLower) ||
                        (post.authorName || '').toLowerCase().includes(searchLower) ||
                        (post.description || '').toLowerCase().includes(searchLower);
                        
                 let matchesCategory = true;
                 if (filterCategory !== 'all' && post.createdAt) {
                   const postDate = post.createdAt?.toDate?.() || new Date(post.createdAt);
                   const now = new Date();
                   const diffTime = Math.abs(now.getTime() - postDate.getTime());
                   const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                   
                   if (filterCategory === 'today') {
                     matchesCategory = diffDays <= 1;
                   } else if (filterCategory === 'week') {
                     matchesCategory = diffDays <= 7;
                   }
                 }
                 
                 return matchesSearch && matchesCategory;
              })
              .slice(0, visibleCount)
              .map((post, idx) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden hover:border-emerald-500/50 transition-colors flex flex-row items-center p-4 group gap-4"
              >
                <div className="w-24 h-36 sm:w-32 sm:h-48 bg-neutral-900 relative overflow-hidden rounded-xl shrink-0">
                  {post.coverImageUrl ? (
                    <img referrerPolicy="no-referrer" src={post.coverImageUrl} alt="TikTok Cover" onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop'; }} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-neutral-800">
                      <Video size={32} />
                    </div>
                  )}
                  {post.isReal && (
                    <div className="absolute top-2 right-2 bg-emerald-500/90 backdrop-blur text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center shadow-lg">
                      <Zap size={10} className="mr-0.5" /> حقيقي
                    </div>
                  )}
                  {!post.isReal && post.hasOwnProperty('isReal') && (
                    <div className="absolute top-2 right-2 bg-red-500/90 backdrop-blur text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center shadow-lg">
                      <X size={10} className="mr-0.5" /> فيك
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0 py-2 flex flex-col justify-between h-full">
                  <div>
                    <h4 className="text-white font-bold text-lg leading-tight mb-2 truncate">{post.designerName || post.authorName}</h4>
                    <div className="flex items-center gap-4 text-neutral-400 text-sm font-medium mb-4">
                      <div className="flex items-center gap-1">
                        <Users size={16} className="text-emerald-400" />
                        <span dir="ltr">{post.views?.toLocaleString('ar-EG') || '0'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap size={16} className="text-emerald-400" />
                        <span dir="ltr">{post.likes?.toLocaleString('ar-EG') || '0'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <a href={post.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-auto text-center px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-medium transition-colors text-sm rounded-lg self-start">
                    شاهد الفيديو الأصلي
                  </a>
                </div>
              </motion.div>
            ))}
            
            {posts.filter(post => {
                 const searchLower = searchTerm.toLowerCase();
                 return (post.designerName || '').toLowerCase().includes(searchLower) ||
                        (post.authorName || '').toLowerCase().includes(searchLower) ||
                        (post.description || '').toLowerCase().includes(searchLower);
              }).length > visibleCount && (
              <button 
                onClick={() => setVisibleCount(prev => prev + 15)}
                className="mt-6 w-full py-4 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl transition-colors font-bold border border-neutral-700"
              >
                عرض المزيد
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function AmrAccounts({ settings }: { settings: any }) {
  const accounts = [
    { name: 'تيك توك', icon: <Video size={24} />, url: settings?.tiktokLink || '#', color: 'bg-neutral-900 hover:bg-black', border: 'border-neutral-800' },
    { name: 'انستجرام', icon: <Instagram size={24} />, url: settings?.instagramLink || '#', color: 'bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 hover:opacity-90', border: 'border-pink-500/30' },
    { name: 'فيسبوك', icon: <Facebook size={24} />, url: settings?.facebookLink || '#', color: 'bg-blue-600 hover:bg-blue-700', border: 'border-blue-500/30' },
    { name: 'يوتيوب', icon: <Youtube size={24} />, url: settings?.youtubeLink || '#', color: 'bg-red-600 hover:bg-red-700', border: 'border-red-500/30' },
    { name: 'ديسكورد', icon: <MessageSquare size={24} />, url: settings?.discordLink || '#', color: 'bg-[#5865F2] hover:bg-[#4752C4]', border: 'border-[#5865F2]/30' },
  ];

  return (
    <section id="official-links" className="py-20 relative z-20 bg-[#0a0a0a] border-t border-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 relative">
          <h2 className="text-3xl md:text-5xl font-black text-neutral-100 mb-4 tracking-tight">
            حسابات عمر الرسمية
          </h2>
          <div className="w-24 h-1 bg-emerald-500 mx-auto rounded-full"></div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 max-w-5xl mx-auto">
          {accounts.map((acc, i) => (
            <div 
              key={i} 
              onClick={() => acc.url !== '#' && window.open(acc.url, '_blank')}
              className={`cursor-pointer flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border ${acc.border} ${acc.color} text-white transition-transform hover:-translate-y-1 shadow-xl`}
            >
              {acc.icon}
              <span className="font-bold text-sm md:text-base">{acc.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-neutral-950 py-12 border-t border-neutral-900 text-center relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold text-white mb-4 flex items-center justify-center gap-3">
          <PenTool size={28} className="text-emerald-500"/>
          3MR Design
        </h2>
        <p className="text-neutral-500 mb-6 font-medium">
          مصممين عمر خرطوم المنفايخ © {new Date().getFullYear()}
        </p>
        <p className="text-neutral-600 text-sm mb-2">
          مكان الإبداع والمصممين المحترفين. كل الحقوق محفوظة.
        </p>
        <p className="text-emerald-500/80 font-mono text-xs opacity-80" dir="ltr">
          hamoweller
        </p>
      </div>
    </footer>
  );
}

export function LandingPage() {
  const { settings } = useSettings();
  
  useEffect(() => {
    const hasViewed = sessionStorage.getItem('hasViewedVisits');
    if (!hasViewed) {
      import('firebase/firestore').then(({ doc, setDoc, increment }) => {
        setDoc(doc(db, 'stats', 'visits'), { views: increment(1) }, { merge: true })
          .then(() => sessionStorage.setItem('hasViewedVisits', 'true'))
          .catch(err => console.log('Visit tracking failed:', err));
      });
    }
  }, []);

  return (
    <div className="font-sans overflow-x-hidden selection:bg-emerald-500/30 selection:text-white bg-neutral-950 text-neutral-200" dir="rtl">
      <Navbar settings={settings} />
      <Hero heroBackground={settings.heroBackground} mainHashtag={settings.mainHashtag} settings={settings} />
      <KickStreamer settings={settings} />
      <TopDesigners />
      <Top3Designers />
      <TikTokTracker mainHashtag={settings.mainHashtag} />
      <KickClipsGallery />
      <SupportSection settings={settings} />
      <AmrAccounts settings={settings} />
      <Footer />
    </div>
  );
}

import { AutoTikTokSync } from './components/AutoTikTokSync';
import { Top3Designers } from './components/Top3Designers';

export default function App() {
  return (
    <BrowserRouter>
      <AutoTikTokSync />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/txablmelsv" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
