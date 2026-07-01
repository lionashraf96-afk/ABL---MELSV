import { useEffect } from 'react';
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy, limit, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function AutoTikTokSync() {
  useEffect(() => {
    const syncTikTokHashTag = async () => {
      try {
        const syncDocRef = doc(db, 'system', 'lastTikTokSync');
        const syncDoc = await getDoc(syncDocRef);
        
        const now = Date.now();
        if (syncDoc.exists()) {
          const lastSync = syncDoc.data().timestamp;
          if (now - lastSync < 60000) {
            // Synced less than 1 min ago
            return;
          }
        }

        // 2. Fetch from our API route
        const res = await fetch('/api/tiktok-hashtag');
        if (!res.ok) {
          console.warn("TikTok Sync skipped, status:", res.status);
          return;
        }
        
        const contentType = res.headers.get("content-type");
        if (!contentType || contentType.indexOf("application/json") === -1) {
          console.warn("TikTok Sync skipped: received non-JSON");
          return;
        }

        const data = await res.json();
        const videos = data.videos || [];

        // 3. For each video, add it if it doesn't exist AND delete old posts (> 8 days)
        const q = query(collection(db, 'tiktokPosts'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const existingUrls = new Set();
        
        const EIGHT_DAYS_MS = 8 * 24 * 60 * 60 * 1000;
        
        snapshot.forEach(d => {
          const postData = d.data();
          let isOld = false;
          
          if (postData.createdAt) {
             const createdAtMs = typeof postData.createdAt.toMillis === 'function' 
                ? postData.createdAt.toMillis() 
                : new Date(postData.createdAt).getTime();
             if (now - createdAtMs > EIGHT_DAYS_MS) {
                isOld = true;
             }
          }

          // Delete mock data, missing avatar data, or videos older than 8 days
          if (postData.videoUrl === 'https://v16-webapp-prime.tiktok.com/video/mock1' || postData.authorName === 'مصمم سوداني' || !postData.authorAvatar || isOld) {
             import('firebase/firestore').then(({ deleteDoc }) => {
              deleteDoc(d.ref).catch(console.error);
             });
          } else {
             existingUrls.add(postData.videoUrl);
          }
        });

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
