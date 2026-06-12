import { motion, AnimatePresence } from 'motion/react';
import { PenTool, X, Send, Image as ImageIcon, Video, Layers, Users, Zap, Star, TrendingUp, Play } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AdminDashboard from './AdminDashboard';
import { db } from './lib/firebase';
import { useSettings } from './hooks/useSettings';
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

function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
              <PenTool size={24} className="text-emerald-500"/>
              3mr5rtoum
            </span>
          </div>
          
          <div className="hidden md:block">
            <div className="ms-10 flex items-baseline space-x-4 space-x-reverse">
              <a href="#hero" className="hover:text-emerald-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">الرئيسية</a>
              <a href="#top-designers" className="hover:text-emerald-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">أحسن المصممين</a>
              <a href="#gallery" className="hover:text-emerald-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">معرض الأعمال</a>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function JoinModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    tiktokUsername: '',
    since: '',
    reason: '',
    image: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [discordUser, setDiscordUser] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('discordUser');
    if (saved) {
      try {
        const user = JSON.parse(saved);
        setDiscordUser(user);
        setFormData(prev => ({ ...prev, name: user.global_name || user.username, image: user.avatar }));
      } catch (e) {}
    }

    const handleMessage = (event: MessageEvent) => {
      // Allow localhost or .run.app origin
      if (!event.origin.endsWith('.run.app') && !event.origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const user = event.data.user;
        setDiscordUser(user);
        localStorage.setItem('discordUser', JSON.stringify(user));
        setFormData(prev => ({ ...prev, name: user.global_name || user.username, image: user.avatar }));
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleDiscordLogin = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/discord/url');
      if (!response.ok) throw new Error('Failed to get auth URL');
      const { url } = await response.json();
      window.open(url, 'oauth_popup', 'width=600,height=700');
    } catch (error) {
      console.error('OAuth error:', error);
      alert("مشكلة في الاتصال بالديسكورد");
    }
  };

  const handleLogoutDiscord = (e: React.MouseEvent) => {
    e.preventDefault();
    setDiscordUser(null);
    localStorage.removeItem('discordUser');
    setFormData(prev => ({ ...prev, name: '', image: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.image) {
      alert("لازم تختار صورة أو تسجل بالديسكورد");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'joinRequests'), {
        ...formData,
        status: 'pending',
        discordId: discordUser?.id || null, // save discord info if available
        createdAt: serverTimestamp()
      });
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
                        <img src={discordUser.avatar} alt="Discord Avatar" className="w-12 h-12 rounded-full border border-indigo-500" />
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

                  {!discordUser && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-neutral-300 mb-2">الاسم / اسم الشهرة</label>
                        <input 
                          required={!discordUser}
                          type="text" 
                          value={formData.name}
                          onChange={e => setFormData({...formData, name: e.target.value})}
                          placeholder="اسمك إيه يا فنان؟"
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-neutral-600"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-neutral-300 mb-2">صورة شخصية (لو تم قبولك هتظهر في الموقع)</label>
                        <input 
                          type="file" 
                          accept="image/*"
                          required={!discordUser}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const img = new Image();
                              img.onload = () => {
                                const canvas = document.createElement('canvas');
                                const SIZE = 400; // circular profile picture size
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
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-500/10 file:text-emerald-500 hover:file:bg-emerald-500/20"
                        />
                        {formData.image && !discordUser && <div className="text-xs text-emerald-500 mt-2">تم تجهيز الصورة للملف الشخصي</div>}
                      </div>
                    </>
                  )}

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
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Hero({ heroBackground, mainHashtag }: { heroBackground?: string, mainHashtag?: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-teal-600/10 rounded-full blur-[150px] mix-blend-screen pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center text-white">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="max-w-4xl mx-auto"
        >
          <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900/80 border border-neutral-800 text-emerald-400 font-medium tracking-wide mb-8">
            <Star size={16} className="fill-emerald-400" />
            <span>نخبة مصممين الجرافيك</span>
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
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xl hover:scale-105 transition-transform flex items-center justify-center gap-3 shadow-xl shadow-emerald-900/20"
            >
              طلب انضمام
              <Zap size={24} className="fill-white/20" />
            </button>
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

      <JoinModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
}

const topDesigners = [
  {
    name: "أحمد الفن",
    role: "Visual Artist",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=60",
    specialty: "دمج احترافي"
  },
  {
    name: "خالد ديزاينر",
    role: "UI/UX Designer",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=60",
    specialty: "واجهات مواقع"
  },
  {
    name: "سارة كرييتف",
    role: "Brand Identity",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=60",
    specialty: "هويات بصرية"
  },
  {
    name: "محمد موشن",
    role: "Motion Grahic",
    image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=60",
    specialty: "تحريك احترافي"
  },
  {
    name: "نورهان جرافيك",
    role: "Illustrator",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&auto=format&fit=crop&q=60",
    specialty: "رسم رقمي"
  },
  {
    name: "عمر ديزاين",
    role: "3D Artist",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=60",
    specialty: "تصميم 3D"
  },
  {
    name: "ياسمين آرت",
    role: "Typographer",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=60",
    specialty: "تايبوجرافي"
  },
  {
    name: "محمود فيجوال",
    role: "VFX Artist",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=60",
    specialty: "مؤثرات بصرية"
  }
];

function TopDesigners() {
  const [onlineCount, setOnlineCount] = useState(142);
  const [designers, setDesigners] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'designers'), (snap) => {
      const items: any[] = [];
      snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
      setDesigners(items.length > 0 ? items : topDesigners);
    }, (error) => console.log("Des error", error));
    return () => unsub();
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
    <section id="top-designers" className="py-24 relative bg-neutral-950">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
      
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
          {designers.slice(0, 10).map((designer, idx) => (
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
                  <img 
                    src={designer.image} 
                    alt={designer.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-neutral-950/20 group-hover:bg-neutral-950/0 transition-colors"></div>
                </div>
              </div>

              <h4 className="text-lg font-bold text-white mb-1 truncate text-center w-full">{designer.name}</h4>
              <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1 px-2 py-0.5 bg-emerald-500/10 rounded-full inline-block">{designer.specialty}</p>
              <p className="text-neutral-500 text-xs mt-1">{designer.role}</p>
              
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
          ))}
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

function Gallery() {
  return (
    <section id="gallery" className="py-32 relative bg-neutral-900 border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div>
            <h2 className="text-sm font-bold text-teal-500 tracking-widest uppercase mb-3">Portfolio</h2>
            <h3 className="text-4xl md:text-5xl font-extrabold text-white">إبداعات المصممين</h3>
          </div>
          <p className="text-neutral-400 max-w-md text-lg leading-relaxed">
            مجموعة من أقوى التصميمات والأعمال الفنية اللي نفذها فريق مصممين عمر خرطوم بإبداع ودقة عالية.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-2xl overflow-hidden bg-neutral-800 aspect-square relative group cursor-pointer ${i === 1 || i === 4 ? 'md:col-span-2 aspect-auto border-2 border-transparent hover:border-emerald-500/50 transition-colors' : ''}`}
            >
              <img 
                src={`https://images.unsplash.com/photo-${1550000000000 + i * 100000}?w=800&auto=format&fit=crop&q=80`} 
                alt="Artwork" 
                className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-neutral-950/0 group-hover:bg-neutral-950/40 transition-colors duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-4 group-hover:translate-y-0 text-white flex items-center gap-2 font-bold text-lg">
                  <ImageIcon size={24} />
                  عرض العمل
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const growthData = [
  { month: 'يناير', designers: 12 },
  { month: 'فبراير', designers: 18 },
  { month: 'مارس', designers: 29 },
  { month: 'أبريل', designers: 45 },
  { month: 'مايو', designers: 68 },
  { month: 'يونيو', designers: 104 },
];

function CommunityStats() {
  return (
    <section className="py-32 relative bg-neutral-950 border-t border-neutral-900 overflow-hidden">
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none translate-x-1/2 -translate-y-1/2"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium tracking-wide mb-4 text-sm"
          >
            <TrendingUp size={16} />
            إحصائيات المجتمع
          </motion.div>
          <h3 className="text-4xl md:text-5xl font-extrabold text-white mb-4">نمو مستمر للمبدعين</h3>
          <p className="text-neutral-400 max-w-2xl mx-auto text-lg">
            مجتمعنا بيكبر كل يوم، ومصممين أكتر بينضموا عشان نرفع مستوى الإبداع ونتبادل الخبرات. 
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-t-2xl"></div>
          <div className="h-[400px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDesigners" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  stroke="#525252" 
                  tick={{ fill: '#737373' }} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis 
                  stroke="#525252" 
                  tick={{ fill: '#737373' }} 
                  tickLine={false} 
                  axisLine={false} 
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#171717', 
                    borderColor: '#262626', 
                    borderRadius: '0.75rem',
                    color: '#e5e5e5',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                  }}
                  itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                  labelStyle={{ color: '#a3a3a3', marginBottom: '0.5rem', textAlign: 'right' }}
                  cursor={{ stroke: '#262626', strokeWidth: 1, strokeDasharray: '5 5' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="designers" 
                  name="المصممين الجدد"
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorDesigners)" 
                  activeDot={{ r: 6, fill: '#10b981', stroke: '#064e3b', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function TikTokTracker({ mainHashtag }: { mainHashtag?: string }) {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'tiktokPosts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: any[] = [];
      snapshot.forEach(doc => {
        fetched.push({ id: doc.id, ...doc.data() });
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

        {posts.length === 0 ? (
          <div className="text-center py-20 bg-neutral-950 rounded-2xl border border-neutral-800">
             <p className="text-neutral-500 text-lg">لسة مفيش فيديوهات متوثقة على الهاشتاج... كن أول من يشارك!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {posts.map((post, idx) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden hover:border-emerald-500/50 transition-colors group"
              >
                <div className="aspect-[9/16] bg-neutral-900 relative overflow-hidden">
                  {post.coverImageUrl ? (
                    <img src={post.coverImageUrl} alt="TikTok Cover" className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-neutral-800">
                      <Video size={48} />
                    </div>
                  )}
                  
                  {/* Status Overlay */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    {post.isReal ? (
                      <span className="bg-emerald-500/90 backdrop-blur text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-lg">
                        <Zap size={12} /> مشاهدات حقيقية
                      </span>
                    ) : (
                      <span className="bg-red-500/90 backdrop-blur text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-lg">
                        <X size={12} /> مشاهدات فيك
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-black/60 to-transparent pt-12 pb-4 px-4">
                    <h4 className="text-white font-bold text-lg leading-tight mb-1">{post.designerName}</h4>
                    <div className="flex items-center gap-2 text-neutral-300 text-sm font-medium">
                      <Users size={14} className="text-emerald-400" />
                      <span dir="ltr">{post.views?.toLocaleString('ar-EG') || '0'}</span>
                    </div>
                  </div>
                </div>
                
                <a href={post.videoUrl} target="_blank" rel="noopener noreferrer" className="block w-full text-center py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-medium transition-colors text-sm">
                  شاهد الفيديو الأصلي
                </a>
              </motion.div>
            ))}
          </div>
        )}
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
        <p className="text-neutral-600 text-sm">
          مكان الإبداع والمصممين المحترفين. كل الحقوق محفوظة.
        </p>
      </div>
    </footer>
  );
}

export function LandingPage() {
  const { settings } = useSettings();
  
  return (
    <div className="font-sans overflow-x-hidden selection:bg-emerald-500/30 selection:text-white bg-neutral-950 text-neutral-200" dir="rtl">
      <Navbar />
      <Hero heroBackground={settings.heroBackground} mainHashtag={settings.mainHashtag} />
      <TopDesigners />
      <TikTokTracker mainHashtag={settings.mainHashtag} />
      <Gallery />
      <CommunityStats />
      <Footer />
    </div>
  );
}

import { AutoTikTokSync } from './components/AutoTikTokSync';

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
