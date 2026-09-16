import { DockItem } from '../../types/settings';
import { ShortcutItem } from '../../types/widget';

/**
 * First-run Dock and Shortcut presets per dashboard language.
 *
 * The sites people open every day differ a lot by country — Yahoo! JAPAN
 * and Rakuten in Japan, Naver and Coupang in Korea, Bilibili and Taobao in
 * China — so a single global list either feels foreign or wastes slots.
 * Each preset targets the everyday 20s–30s user of that region (streaming,
 * social, shopping, AI, mail/maps), not developers.
 *
 * Only ever consulted when there is nothing saved yet (fresh install) or on
 * an explicit "reset to defaults"; existing users' items are never touched.
 * Unknown languages fall back to the global (`en`) preset.
 */

export type PresetLanguage = 'en' | 'ja' | 'ko' | 'zh-CN' | 'es' | 'fr' | 'de';

interface RegionalPreset {
  dock: DockItem[];
  shortcuts: ShortcutItem[];
  /** Default weather location for the region's largest city. */
  weather: { city: string; latitude: number; longitude: number };
}

const dock = (id: string, label: string, url: string, icon: string): DockItem => ({
  id: `dock-${id}`,
  label,
  url,
  icon,
  openInNewTab: true,
});

const app = (id: string, title: string, url: string, category: string): ShortcutItem => ({
  id: `app-${id}`,
  title,
  url,
  category,
});

const PRESETS: Record<PresetLanguage, RegionalPreset> = {
  en: {
    dock: [
      dock('google', 'Google', 'https://google.com', 'globe'),
      dock('youtube', 'YouTube', 'https://youtube.com', 'video'),
      dock('amazon', 'Amazon', 'https://www.amazon.com', 'cart'),
      dock('chatgpt', 'ChatGPT', 'https://chatgpt.com', 'sparkles'),
      dock('maps', 'Google Maps', 'https://maps.google.com', 'map'),
      dock('wikipedia', 'Wikipedia', 'https://www.wikipedia.org', 'book'),
    ],
    shortcuts: [
      app('google', 'Google', 'https://google.com', 'Everyday'),
      app('youtube', 'YouTube', 'https://youtube.com', 'Entertainment'),
      app('chatgpt', 'ChatGPT', 'https://chatgpt.com', 'AI & Tools'),
      app('amazon', 'Amazon', 'https://www.amazon.com', 'Shopping'),
      app('reddit', 'Reddit', 'https://reddit.com', 'Social'),
      app('instagram', 'Instagram', 'https://instagram.com', 'Social'),
      app('twitter', 'X (Twitter)', 'https://x.com', 'Social'),
      app('netflix', 'Netflix', 'https://netflix.com', 'Entertainment'),
      app('spotify', 'Spotify', 'https://open.spotify.com', 'Entertainment'),
      app('gmail', 'Gmail', 'https://mail.google.com', 'Everyday'),
      app('maps', 'Google Maps', 'https://maps.google.com', 'Everyday'),
      app('wikipedia', 'Wikipedia', 'https://www.wikipedia.org', 'Everyday'),
    ],
    weather: { city: 'New York', latitude: 40.7128, longitude: -74.006 },
  },

  ja: {
    dock: [
      dock('google', 'Google', 'https://google.com', 'globe'),
      dock('youtube', 'YouTube', 'https://youtube.com', 'video'),
      dock('twitter', 'X (Twitter)', 'https://x.com', 'chat'),
      dock('yahoo-jp', 'Yahoo! JAPAN', 'https://www.yahoo.co.jp', 'news'),
      dock('amazon-jp', 'Amazon', 'https://www.amazon.co.jp', 'cart'),
      dock('chatgpt', 'ChatGPT', 'https://chatgpt.com', 'sparkles'),
    ],
    shortcuts: [
      app('google', 'Google', 'https://google.com', '仕事・日常'),
      app('youtube', 'YouTube', 'https://youtube.com', 'SNS・動画'),
      app('twitter', 'X (Twitter)', 'https://x.com', 'SNS・動画'),
      app('yahoo-jp', 'Yahoo! JAPAN', 'https://www.yahoo.co.jp', '仕事・日常'),
      app('amazon-jp', 'Amazon', 'https://www.amazon.co.jp', 'ショッピング'),
      app('rakuten', '楽天市場', 'https://www.rakuten.co.jp', 'ショッピング'),
      app('instagram', 'Instagram', 'https://instagram.com', 'SNS・動画'),
      app('chatgpt', 'ChatGPT', 'https://chatgpt.com', 'AI・ツール'),
      app('gmail', 'Gmail', 'https://mail.google.com', '仕事・日常'),
      app('maps', 'Google マップ', 'https://maps.google.com', '仕事・日常'),
      app('spotify', 'Spotify', 'https://open.spotify.com', 'エンタメ'),
      app('netflix', 'Netflix', 'https://netflix.com', 'エンタメ'),
    ],
    weather: { city: 'Tokyo', latitude: 35.6762, longitude: 139.6503 },
  },

  ko: {
    dock: [
      dock('naver', 'Naver', 'https://www.naver.com', 'globe'),
      dock('youtube', 'YouTube', 'https://youtube.com', 'video'),
      dock('coupang', 'Coupang', 'https://www.coupang.com', 'cart'),
      dock('chatgpt', 'ChatGPT', 'https://chatgpt.com', 'sparkles'),
      dock('instagram', 'Instagram', 'https://instagram.com', 'camera'),
      dock('google', 'Google', 'https://google.com', 'compass'),
    ],
    shortcuts: [
      app('naver', 'Naver', 'https://www.naver.com', '일상'),
      app('youtube', 'YouTube', 'https://youtube.com', 'SNS·동영상'),
      app('coupang', 'Coupang', 'https://www.coupang.com', '쇼핑'),
      app('daum', 'Daum (Kakao)', 'https://www.daum.net', '일상'),
      app('chatgpt', 'ChatGPT', 'https://chatgpt.com', 'AI·도구'),
      app('instagram', 'Instagram', 'https://instagram.com', 'SNS·동영상'),
      app('twitter', 'X (Twitter)', 'https://x.com', 'SNS·동영상'),
      app('netflix', 'Netflix', 'https://netflix.com', '엔터테인먼트'),
      app('spotify', 'Spotify', 'https://open.spotify.com', '엔터테인먼트'),
      app('gmail', 'Gmail', 'https://mail.google.com', '일상'),
      app('baemin', '배달의민족', 'https://www.baemin.com', '일상'),
      app('musinsa', 'Musinsa', 'https://www.musinsa.com', '쇼핑'),
    ],
    weather: { city: 'Seoul', latitude: 37.5665, longitude: 126.978 },
  },

  'zh-CN': {
    dock: [
      dock('bilibili', 'Bilibili', 'https://www.bilibili.com', 'tv'),
      dock('youtube', 'YouTube', 'https://youtube.com', 'video'),
      dock('baidu', 'Baidu', 'https://www.baidu.com', 'globe'),
      dock('taobao', 'Taobao', 'https://www.taobao.com', 'cart'),
      dock('xiaohongshu', 'Xiaohongshu', 'https://www.xiaohongshu.com', 'book'),
      dock('chatgpt', 'ChatGPT', 'https://chatgpt.com', 'sparkles'),
    ],
    shortcuts: [
      app('bilibili', 'Bilibili', 'https://www.bilibili.com', '社交·视频'),
      app('youtube', 'YouTube', 'https://youtube.com', '社交·视频'),
      app('baidu', '百度', 'https://www.baidu.com', '日常'),
      app('weibo', '微博', 'https://weibo.com', '社交·视频'),
      app('xiaohongshu', '小红书', 'https://www.xiaohongshu.com', '社交·视频'),
      app('taobao', '淘宝', 'https://www.taobao.com', '购物'),
      app('jd', '京东', 'https://www.jd.com', '购物'),
      app('zhihu', '知乎', 'https://www.zhihu.com', '日常'),
      app('chatgpt', 'ChatGPT', 'https://chatgpt.com', 'AI·工具'),
      app('gmail', 'Gmail', 'https://mail.google.com', '日常'),
      app('spotify', 'Spotify', 'https://open.spotify.com', '娱乐'),
      app('netflix', 'Netflix', 'https://netflix.com', '娱乐'),
    ],
    weather: { city: 'Shanghai', latitude: 31.2304, longitude: 121.4737 },
  },

  es: {
    dock: [
      dock('google', 'Google', 'https://google.com', 'globe'),
      dock('youtube', 'YouTube', 'https://youtube.com', 'video'),
      dock('amazon-es', 'Amazon', 'https://www.amazon.es', 'cart'),
      dock('chatgpt', 'ChatGPT', 'https://chatgpt.com', 'sparkles'),
      dock('maps', 'Google Maps', 'https://maps.google.com', 'map'),
      dock('wikipedia', 'Wikipedia', 'https://es.wikipedia.org', 'book'),
    ],
    shortcuts: [
      app('google', 'Google', 'https://google.com', 'Día a día'),
      app('youtube', 'YouTube', 'https://youtube.com', 'Redes y vídeo'),
      app('chatgpt', 'ChatGPT', 'https://chatgpt.com', 'IA y herramientas'),
      app('amazon-es', 'Amazon', 'https://www.amazon.es', 'Compras'),
      app('elpais', 'El País', 'https://elpais.com', 'Noticias'),
      app('marca', 'Marca', 'https://www.marca.com', 'Noticias'),
      app('instagram', 'Instagram', 'https://instagram.com', 'Redes y vídeo'),
      app('twitter', 'X (Twitter)', 'https://x.com', 'Redes y vídeo'),
      app('netflix', 'Netflix', 'https://netflix.com', 'Entretenimiento'),
      app('spotify', 'Spotify', 'https://open.spotify.com', 'Entretenimiento'),
      app('gmail', 'Gmail', 'https://mail.google.com', 'Día a día'),
      app('wallapop', 'Wallapop', 'https://es.wallapop.com', 'Compras'),
    ],
    weather: { city: 'Madrid', latitude: 40.4168, longitude: -3.7038 },
  },

  fr: {
    dock: [
      dock('google', 'Google', 'https://google.com', 'globe'),
      dock('youtube', 'YouTube', 'https://youtube.com', 'video'),
      dock('amazon-fr', 'Amazon', 'https://www.amazon.fr', 'cart'),
      dock('chatgpt', 'ChatGPT', 'https://chatgpt.com', 'sparkles'),
      dock('maps', 'Google Maps', 'https://maps.google.com', 'map'),
      dock('wikipedia', 'Wikipédia', 'https://fr.wikipedia.org', 'book'),
    ],
    shortcuts: [
      app('google', 'Google', 'https://google.com', 'Quotidien'),
      app('youtube', 'YouTube', 'https://youtube.com', 'Réseaux et vidéo'),
      app('chatgpt', 'ChatGPT', 'https://chatgpt.com', 'IA et outils'),
      app('amazon-fr', 'Amazon', 'https://www.amazon.fr', 'Shopping'),
      app('lemonde', 'Le Monde', 'https://www.lemonde.fr', 'Actualités'),
      app('leboncoin', 'Leboncoin', 'https://www.leboncoin.fr', 'Shopping'),
      app('instagram', 'Instagram', 'https://instagram.com', 'Réseaux et vidéo'),
      app('twitter', 'X (Twitter)', 'https://x.com', 'Réseaux et vidéo'),
      app('netflix', 'Netflix', 'https://netflix.com', 'Divertissement'),
      app('spotify', 'Spotify', 'https://open.spotify.com', 'Divertissement'),
      app('gmail', 'Gmail', 'https://mail.google.com', 'Quotidien'),
      app('deezer', 'Deezer', 'https://www.deezer.com', 'Divertissement'),
    ],
    weather: { city: 'Paris', latitude: 48.8566, longitude: 2.3522 },
  },

  de: {
    dock: [
      dock('google', 'Google', 'https://google.com', 'globe'),
      dock('youtube', 'YouTube', 'https://youtube.com', 'video'),
      dock('amazon-de', 'Amazon', 'https://www.amazon.de', 'cart'),
      dock('chatgpt', 'ChatGPT', 'https://chatgpt.com', 'sparkles'),
      dock('maps', 'Google Maps', 'https://maps.google.com', 'map'),
      dock('wikipedia', 'Wikipedia', 'https://de.wikipedia.org', 'book'),
    ],
    shortcuts: [
      app('google', 'Google', 'https://google.com', 'Alltag'),
      app('youtube', 'YouTube', 'https://youtube.com', 'Social & Video'),
      app('chatgpt', 'ChatGPT', 'https://chatgpt.com', 'KI & Tools'),
      app('amazon-de', 'Amazon', 'https://www.amazon.de', 'Shopping'),
      app('spiegel', 'DER SPIEGEL', 'https://www.spiegel.de', 'Nachrichten'),
      app('kleinanzeigen', 'Kleinanzeigen', 'https://www.kleinanzeigen.de', 'Shopping'),
      app('instagram', 'Instagram', 'https://instagram.com', 'Social & Video'),
      app('twitter', 'X (Twitter)', 'https://x.com', 'Social & Video'),
      app('netflix', 'Netflix', 'https://netflix.com', 'Unterhaltung'),
      app('spotify', 'Spotify', 'https://open.spotify.com', 'Unterhaltung'),
      app('gmail', 'Gmail', 'https://mail.google.com', 'Alltag'),
      app('bahn', 'Deutsche Bahn', 'https://www.bahn.de', 'Alltag'),
    ],
    weather: { city: 'Berlin', latitude: 52.52, longitude: 13.405 },
  },
};

/** Maps any language code the app might hand us onto a preset key. */
export function resolvePresetLanguage(lang?: string): PresetLanguage {
  if (!lang) return 'en';
  if (lang === 'zh' || lang.startsWith('zh-')) return 'zh-CN';
  const base = lang.split('-')[0];
  return (['en', 'ja', 'ko', 'es', 'fr', 'de'] as const).includes(base as any) ? (base as PresetLanguage) : 'en';
}

// Fresh copies every call so callers can't mutate the shared tables.
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

export function getRegionalDockItems(lang?: string): DockItem[] {
  return clone(PRESETS[resolvePresetLanguage(lang)].dock);
}

export function getRegionalShortcuts(lang?: string): ShortcutItem[] {
  return clone(PRESETS[resolvePresetLanguage(lang)].shortcuts);
}

export function getRegionalWeatherDefault(lang?: string): RegionalPreset['weather'] {
  return clone(PRESETS[resolvePresetLanguage(lang)].weather);
}
