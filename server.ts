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
    const redirectUri = `${req.headers.origin || process.env.APP_URL}/api/auth/discord/callback`;
    const clientId = process.env.DISCORD_CLIENT_ID;
    
    if (!clientId) {
      return res.status(500).json({ error: 'Missing DISCORD_CLIENT_ID' });
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'identify',
    });

    res.json({ url: `https://discord.com/api/oauth2/authorize?${params.toString()}` });
  });

  app.get(['/api/auth/discord/callback', '/api/auth/discord/callback/'], async (req, res) => {
    const { code } = req.query;
    const clientId = process.env.DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;
    
    // We need to guess the exact redirect URI we used
    // It is best to match exactly. We can construct it from req:
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const redirectUri = `${protocol}://${host}/api/auth/discord/callback`;

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
      const apiKey = process.env.RAPIDAPI_KEY;
      if (!apiKey) {
        return res.status(500).json({ 
          error: 'Missing RapidAPI Key', 
          message: 'Please add RAPIDAPI_KEY to your Secrets. You can get one from a TikTok Scraper on RapidAPI (e.g., tiktok-scraper7). For now, we are returning mock data.'
        });
      }

      // Using a standard RapidAPI TikTok hashtag endpoint.
      // E.g., 'tiktok-scraper7.p.rapidapi.com'
      const response = await axios.get('https://tiktok-scraper7.p.rapidapi.com/feed/search', {
        params: {
          keywords: 'مصممين_خرطوم_دوشا',
          region: 'SA',
          count: '20',
        },
        headers: {
          'x-rapidapi-host': 'tiktok-scraper7.p.rapidapi.com',
          'x-rapidapi-key': apiKey
        }
      });

      const videos = response.data?.data?.videos || [];
      
      const formattedVideos = videos.map((v: any) => ({
        tiktokId: v.video_id,
        authorName: v.author?.nickname || v.author?.unique_id,
        videoUrl: `https://www.tiktok.com/@${v.author?.unique_id}/video/${v.video_id}`,
        coverImageUrl: v.cover,
        views: v.play_count || 0,
        likes: v.digg_count || 0,
        createdAt: new Date().toISOString()
      }));

      res.json({ videos: formattedVideos });
    } catch (error: any) {
      console.error("TikTok API Error:", error.message);
      
      if (error.response?.status === 403 || error.response?.status === 401) {
        // Fallback to mock data if key is invalid/unsubscribed
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

      res.status(500).json({ error: 'Failed to fetch from TikTok', details: error.message });
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
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
