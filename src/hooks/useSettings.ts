import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export interface SiteSettings {
  discordLink: string;
  whatsappLink: string;
  tiktokLink: string;
  instagramLink: string;
  emailSupport: string;
  supportPhone: string;
  supportUsername: string;
  heroBackground?: string;
  mainHashtag?: string;
  kickUsername?: string;
  kickLiveOverride?: boolean;
  kickLiveTitle?: string;
  kickLiveViewers?: number;
  kickLiveCategory?: string;
}

const defaultSettings: SiteSettings = {
  discordLink: '#',
  whatsappLink: '#',
  tiktokLink: '#',
  instagramLink: '#',
  emailSupport: 'support@abl-melsv.com',
  supportPhone: '+201508539885',
  supportUsername: '',
  heroBackground: '',
  mainHashtag: '#خرطوم_دوشا',
  kickUsername: '',
  kickLiveOverride: false,
  kickLiveTitle: 'بث مباشر',
  kickLiveViewers: 0,
  kickLiveCategory: 'Just Chatting'
};

export function useSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const docRef = doc(db, 'settings', 'main');
    
    // Subscribe to real-time changes
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as SiteSettings;
        setSettings({ ...defaultSettings, ...data });
      } else {
        // If it doesn't exist, use default
        setSettings(defaultSettings);
      }
      setIsLoaded(true);
    }, (error) => {
      console.error("Error fetching settings:", error);
      setIsLoaded(true);
    });

    return () => unsubscribe();
  }, []);

  const saveSettings = async (newSettings: SiteSettings) => {
    try {
      const docRef = doc(db, 'settings', 'main');
      await setDoc(docRef, newSettings);
      return true;
    } catch (error) {
      console.error("Error saving settings:", error);
      return false;
    }
  };

  return { settings, saveSettings, isLoaded };
}

