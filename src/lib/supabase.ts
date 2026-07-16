import { createClient } from '@supabase/supabase-js';

// Ключи берутся из .env.local (локально) и из Vercel → Settings → Environment Variables (на проде).
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Понятная ошибка вместо «белого экрана», если ключи забыли вставить.
if (!url || !anonKey) {
  throw new Error(
    'Нет ключей Supabase. Скопируй .env.example → .env.local и вставь VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY.',
  );
}

// Old email/OAuth links can leave an expired implicit-flow token in the hash.
// Remove it before GoTrue initializes so it cannot replace a valid local session.
if (typeof window !== 'undefined' && window.location.hash) {
  const authHash = new URLSearchParams(window.location.hash.slice(1));
  const expiresAt = Number(authHash.get('expires_at'));
  if (authHash.has('access_token') && Number.isFinite(expiresAt) && expiresAt * 1000 <= Date.now()) {
    window.history.replaceState(null, document.title, `${window.location.pathname}${window.location.search}`);
  }
}

export const supabase = createClient(url, anonKey);
