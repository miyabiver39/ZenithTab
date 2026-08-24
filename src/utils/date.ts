export function getIntlLocale(langCode?: string): string | undefined {
  if (!langCode || langCode === 'auto') return undefined;
  const map: Record<string, string> = {
    ja: 'ja-JP',
    en: 'en-US',
    'zh-CN': 'zh-CN',
    zh: 'zh-CN',
    es: 'es-ES',
    fr: 'fr-FR',
    de: 'de-DE',
    ko: 'ko-KR',
  };
  return map[langCode] || langCode;
}

export function formatTime(
  date: Date,
  is24Hour = true,
  showSeconds = true,
  timezone?: string,
  locale?: string
): string {
  const intlLocale = getIntlLocale(locale);
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    second: showSeconds ? '2-digit' : undefined,
    hour12: !is24Hour,
    timeZone: timezone || undefined,
  };
  return new Intl.DateTimeFormat(intlLocale, options).format(date);
}

export function formatDate(date: Date, timezone?: string, locale?: string): string {
  const intlLocale = getIntlLocale(locale);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: timezone || undefined,
  };
  return new Intl.DateTimeFormat(intlLocale, options).format(date);
}

export function formatRelativeTime(dateStringOrTimestamp?: string | number): string {
  if (!dateStringOrTimestamp) return '';
  const date = new Date(dateStringOrTimestamp);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  }
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
