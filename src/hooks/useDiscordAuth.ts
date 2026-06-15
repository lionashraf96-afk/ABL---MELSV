import { useState, useEffect } from 'react';

const CLIENT_ID = '1514873566200336464';

export function useDiscordAuth() {
  const [discordUser, setDiscordUser] = useState<any>(null);

  useEffect(() => {
    // 1. Try to load saved user
    const saved = localStorage.getItem('discordUser');
    if (saved) {
      try {
        const user = JSON.parse(saved);
        setDiscordUser(user);
      } catch (e) {}
    }

    // 2. Check hash for access_token if redirect back from Discord
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = fragment.get('access_token');
    if (accessToken) {
      // Clear hash from URL for cleaner look
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      // Fetch user data from Discord
      fetch('https://discord.com/api/users/@me', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })
      .then(res => res.json())
      .then(userData => {
        if (!userData.id) throw new Error('Invalid user data');
        const avatarUrl = userData.avatar 
          ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`
          : `https://cdn.discordapp.com/embed/avatars/${parseInt(userData.discriminator || '0', 10) % 5}.png`;

        const user = {
          id: userData.id,
          username: userData.username,
          global_name: userData.global_name,
          avatar: avatarUrl
        };
        setDiscordUser(user);
        localStorage.setItem('discordUser', JSON.stringify(user));
      })
      .catch(err => {
        console.error("Failed to fetch discord user data", err);
      });
    }

    // 3. Keep old message listener for backward compatibility with oauth_popup if used differently
    const handleMessage = (event: MessageEvent) => {
      if (!event.origin.endsWith('.run.app') && !event.origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const user = event.data.user;
        setDiscordUser(user);
        localStorage.setItem('discordUser', JSON.stringify(user));
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const login = async () => {
    // Navigate directly using Implicit Grant flow
    const redirectUri = window.location.origin;
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'token',
      scope: 'identify'
    });
    
    // Instead of popup, we will redirect the main window, 
    // or we can use popup and poll. Let's redirect main window for simplicity on mobile.
    window.location.href = `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  };

  const logout = () => {
    setDiscordUser(null);
    localStorage.removeItem('discordUser');
  };

  return { discordUser, login, logout, setDiscordUser };
}
