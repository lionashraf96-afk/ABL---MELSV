import { useEffect } from 'react';
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy, limit, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function AutoTikTokSync() {
  useEffect(() => {
    const syncTikTokHashTag = async () => {
      try {
        // 1. Check if we synced recently (e.g., within 1 hour)
        const syncDocRef = doc(db, 'system', 'lastTikTokSync');
        const syncDoc = await getDoc(syncDocRef);
        
        const now = Date.now();
        if (syncDoc.exists()) {
          const lastSync = syncDoc.data().timestamp;
          if (now - lastSync < 3600000) {
            // Synced less than an hour ago
            return;
          }
        }

        // 2. Fetch from our API route
        const res = await fetch('/api/tiktok-hashtag');
        if (!res.ok) {
          console.warn("TikTok Sync skipped:", await res.text());
          return;
        }

        const data = await res.json();
        const videos = data.videos || [];

        // 3. For each video, add it if it doesn't exist
        const q = query(collection(db, 'tiktokPosts'), orderBy('createdAt', 'desc'), limit(50));
        const snapshot = await getDocs(q);
        const existingUrls = new Set();
        snapshot.forEach(d => {
          existingUrls.add(d.data().videoUrl);
        });

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
          }
        }

        // 4. Update sync timestamp
        await setDoc(syncDocRef, { timestamp: now }, { merge: true });

      } catch (err) {
        console.error("Auto TikTok Sync Error:", err);
      }
    };

    syncTikTokHashTag();
    
    // Check every hour
    const interval = setInterval(syncTikTokHashTag, 3600000);
    return () => clearInterval(interval);
  }, []);

  return null;
}
