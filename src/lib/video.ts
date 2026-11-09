// Vídeo por link: reconhece YouTube, Instagram, TikTok e Kick e monta o player embutido.
// O endereço do player é sempre montado por nós (nunca usamos a URL colada direto no iframe).

export type VideoProvider = 'youtube' | 'instagram' | 'tiktok' | 'kick';

export interface VideoEmbed {
  provider: VideoProvider;
  label: string;
  url: string; // link original (normalizado)
  embedUrl?: string; // player embutido, quando suportado
  vertical: boolean; // Shorts, Reels e TikTok são verticais
}

const LABEL: Record<VideoProvider, string> = { youtube: 'YouTube', instagram: 'Instagram', tiktok: 'TikTok', kick: 'Kick' };

export function parseVideoUrl(raw: string): VideoEmbed | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
  const host = u.hostname.replace(/^(www\.|m\.)/, '');
  const parts = u.pathname.split('/').filter(Boolean);
  const id = (v?: string | null) => (v && /^[\w-]{3,64}$/.test(v) ? v : null);
  const make = (provider: VideoProvider, embedUrl: string | undefined, vertical: boolean): VideoEmbed => ({
    provider,
    label: LABEL[provider],
    url: 'https://' + u.host + u.pathname + u.search,
    embedUrl,
    vertical,
  });

  if (host === 'youtube.com' || host === 'youtu.be' || host === 'music.youtube.com') {
    let vid: string | null = null;
    let vertical = false;
    if (host === 'youtu.be') vid = id(parts[0]);
    else if (parts[0] === 'watch') vid = id(u.searchParams.get('v'));
    else if (parts[0] === 'shorts' || parts[0] === 'live' || parts[0] === 'embed') {
      vid = id(parts[1]);
      vertical = parts[0] === 'shorts';
    }
    return vid ? make('youtube', `https://www.youtube-nocookie.com/embed/${vid}`, vertical) : null;
  }
  if (host === 'instagram.com') {
    const kind = parts[0];
    const code = id(parts[1]);
    if ((kind === 'p' || kind === 'reel' || kind === 'reels' || kind === 'tv') && code)
      return make('instagram', `https://www.instagram.com/${kind === 'reels' ? 'reel' : kind}/${code}/embed`, true);
    return null;
  }
  if (host === 'tiktok.com' || host.endsWith('.tiktok.com')) {
    const i = parts.indexOf('video');
    const vid = i >= 0 ? parts[i + 1] : undefined;
    if (vid && /^\d{8,25}$/.test(vid)) return make('tiktok', `https://www.tiktok.com/embed/v2/${vid}`, true);
    // links curtos (vm.tiktok.com) não dão para embutir: viram cartão com link
    return host === 'vm.tiktok.com' || host === 'vt.tiktok.com' ? make('tiktok', undefined, true) : null;
  }
  if (host === 'kick.com') {
    const channel = id(parts[0]);
    if (!channel) return null;
    // canal ao vivo: player embutido; clipes e VODs: cartão com link
    return make('kick', parts.length === 1 ? `https://player.kick.com/${channel}` : undefined, false);
  }
  return null;
}
