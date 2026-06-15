import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import axios from 'axios';
import admin from 'firebase-admin';

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  // OAuth endpoints for Discord
  app.get('/api/auth/discord/url', (req, res) => {
    const redirectUri = req.query.redirectUri as string;
    const clientId = process.env.DISCORD_CLIENT_ID;
    
    if (!clientId) {
      return res.status(500).json({ error: 'Missing DISCORD_CLIENT_ID' });
    }
    
    if (!redirectUri) {
      return res.status(400).json({ error: 'Missing redirect_uri parameter' });
    }

    const state = Buffer.from(JSON.stringify({ redirectUri })).toString('base64');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'identify',
      state: state
    });

    res.json({ url: `https://discord.com/api/oauth2/authorize?${params.toString()}` });
  });

  app.get(['/api/auth/discord/callback', '/api/auth/discord/callback/'], async (req, res) => {
    const { code, state } = req.query;
    const clientId = process.env.DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;
    
    let redirectUri = '';
    try {
      if (state) {
        const stateObj = JSON.parse(Buffer.from(state as string, 'base64').toString('utf-8'));
        redirectUri = stateObj.redirectUri;
      }
    } catch (e) {
      console.error("Failed to parse state", e);
    }
    
    if (!redirectUri) {
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      redirectUri = `${protocol}://${host}/api/auth/discord/callback`;
    }

    if (!clientId || !clientSecret) {
      return res.status(500).send('Missing Discord OAuth credentials.');
    }

    try {
      const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: redirectUri
      }).toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const { access_token } = tokenResponse.data;

      const userResponse = await axios.get('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${access_token}` }
      });

      const userData = userResponse.data;
      const avatarUrl = userData.avatar 
        ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`
        : `https://cdn.discordapp.com/embed/avatars/${parseInt(userData.discriminator || '0', 10) % 5}.png`;

      const discordUser = {
        id: userData.id,
        username: userData.username,
        global_name: userData.global_name,
        avatar: avatarUrl
      };

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', user: ${JSON.stringify(discordUser)} }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error("Discord Auth Error:", error.response?.data || error.message);
      res.status(500).send('Authentication failed.');
    }
  });

  // API Route to fetch hashtag videos from a TikTok API provider

  // We use RapidAPI TikTok Scraper as an example, since official API is closed.
  app.get('/api/tiktok-hashtag', async (req, res) => {
    try {
      // Using tikwm.com free API endpoint
      const response = await axios.get('https://www.tikwm.com/api/feed/search', {
        params: {
          keywords: 'خرطوم_دوشا',
          count: 20
        }
      });

      const data = response.data?.data;
      const videos = data?.videos || data || [];
      
      const formattedVideos = Array.isArray(videos) ? videos.map((v: any) => ({
        tiktokId: v.video_id,
        authorName: v.author?.nickname || v.author?.unique_id || 'Unknown',
        authorAvatar: v.author?.avatar || v.author?.avatar_thumb || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + (v.author?.unique_id || 'user'),
        uniqueId: v.author?.unique_id || 'user',
        videoUrl: `https://www.tiktok.com/@${v.author?.unique_id || 'user'}/video/${v.video_id}`,
        coverImageUrl: v.cover || v.origin_cover || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=60',
        views: v.play_count || 0,
        likes: v.digg_count || 0,
        createdAt: v.create_time ? new Date(v.create_time * 1000).toISOString() : new Date().toISOString()
      })) : [];

      res.json({ videos: formattedVideos });
    } catch (error: any) {
      console.error("TikTok API Error:", error.message);
      
      // Fallback to mock data if key is invalid, rate limited, or any error
      return res.json({ 
        videos: [
            {
              tiktokId: '72000000001',
              authorName: 'مصمم سوداني',
              videoUrl: 'https://v16-webapp-prime.tiktok.com/video/mock1', // Need a valid looking URL for testing
              coverImageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=60',
              views: 15400,
              likes: 1200,
              createdAt: new Date().toISOString()
            },
            {
              tiktokId: '72000000002',
              authorName: 'عمر ديزاين',
              videoUrl: 'https://v16-webapp-prime.tiktok.com/video/mock2',
              coverImageUrl: 'https://images.unsplash.com/photo-1616423640778-28d1b53229bd?w=400&q=60',
              views: 8200,
              likes: 430,
              createdAt: new Date().toISOString()
            }
          ]
        });
    }
  });

  app.get('/api/kick-status/:username', async (req, res) => {
    try {
      const username = req.params.username;
      const scraperApiKey = process.env.SCRAPERAPI_KEY;
      if (!username) return res.status(400).json({ error: 'Username required' });
      
      let apiUrl = `https://kick.com/api/v1/channels/${username}`;
      if (scraperApiKey) {
         // Use ScraperAPI to bypass Cloudflare
         apiUrl = `http://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(apiUrl)}`;
      }

      const response = await axios.get(apiUrl, {
        headers: scraperApiKey ? {} : {
           'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
           'Accept': 'application/json'
        }
      });
      const data = response.data;
      
      if (data && data.livestream) {
        res.json({ live: true, viewers: data.livestream.viewer_count, category: data.livestream.categories?.[0]?.name, title: data.livestream.session_title, thumbnail: data.livestream.thumbnail?.url, user: { avatar: data.user?.profile_pic } });
      } else {
        res.json({ live: false, user: { avatar: data?.user?.profile_pic }});
      }
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
         return res.status(200).json({ live: false, user: { avatar: '' } });
      }
      console.error("Kick API Error:", error.message);
      // Determine if it was a 403 Forbidden
      if (error.response && (error.response.status === 403 || error.response.status === 503)) {
         return res.status(403).json({ live: false, error: 'cloudflare_blocked', message: 'Kick blocked the request. Needs proxy.' });
      }
      res.status(500).json({ live: false, error: 'fetch_failed', message: error.message });
    }
  });

  app.get('/api/kick-clips/:username', async (req, res) => {
    try {
      const username = req.params.username;
      const scraperApiKey = process.env.SCRAPERAPI_KEY;
      if (!username) return res.status(400).json({ error: 'Username required' });
      
      let apiUrl = `https://kick.com/api/v2/channels/${username}/clips`;
      if (scraperApiKey) {
         apiUrl = `http://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(apiUrl)}`;
      }

      const response = await axios.get(apiUrl, {
        headers: scraperApiKey ? {} : {
           'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
           'Accept': 'application/json'
        }
      });
      res.json(response.data);
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
         return res.status(200).json({ clips: [] });
      }
      console.error("Kick Clips API Error:", error.message);
      if (error.response && (error.response.status === 403 || error.response.status === 503)) {
         return res.status(403).json({ error: 'cloudflare_blocked', message: 'Kick blocked the request. Needs proxy.' });
      }
      res.status(500).json({ error: 'fetch_failed', message: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
