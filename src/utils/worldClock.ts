/**
 * City → IANA time zone lookup for the search bar's "time in London"
 * answer. Names are matched case- and accent-insensitively and include
 * the spellings of every UI language, so 「ロンドンの時間」 works too.
 */
interface CityZone {
  /** Canonical English name shown on the card. */
  city: string;
  timeZone: string;
  aliases: string[];
}

const CITIES: CityZone[] = [
  { city: 'UTC', timeZone: 'UTC', aliases: ['utc', 'gmt', 'zulu'] },
  { city: 'London', timeZone: 'Europe/London', aliases: ['ロンドン', '伦敦', '런던', 'londres', 'uk', 'england'] },
  { city: 'Dublin', timeZone: 'Europe/Dublin', aliases: ['ダブリン', '都柏林', '더블린'] },
  { city: 'Lisbon', timeZone: 'Europe/Lisbon', aliases: ['リスボン', '里斯本', '리스본', 'lisboa', 'lissabon'] },
  { city: 'Paris', timeZone: 'Europe/Paris', aliases: ['パリ', '巴黎', '파리', 'france', 'フランス'] },
  { city: 'Berlin', timeZone: 'Europe/Berlin', aliases: ['ベルリン', '柏林', '베를린', 'germany', 'deutschland', 'ドイツ', 'munich', 'münchen', 'frankfurt', 'hamburg'] },
  { city: 'Madrid', timeZone: 'Europe/Madrid', aliases: ['マドリード', '马德里', '마드리드', 'spain', 'españa', 'スペイン', 'barcelona', 'バルセロナ'] },
  { city: 'Rome', timeZone: 'Europe/Rome', aliases: ['ローマ', '罗马', '로마', 'roma', 'rom', 'italy', 'italia', 'イタリア', 'milan', 'milano', 'ミラノ'] },
  { city: 'Amsterdam', timeZone: 'Europe/Amsterdam', aliases: ['アムステルダム', '阿姆斯特丹', '암스테르담', 'netherlands'] },
  { city: 'Brussels', timeZone: 'Europe/Brussels', aliases: ['ブリュッセル', '布鲁塞尔', '브뤼셀', 'bruxelles', 'brüssel'] },
  { city: 'Zurich', timeZone: 'Europe/Zurich', aliases: ['チューリッヒ', '苏黎世', '취리히', 'zürich', 'geneva', 'genève', 'ジュネーブ', 'switzerland'] },
  { city: 'Vienna', timeZone: 'Europe/Vienna', aliases: ['ウィーン', '维也纳', '비엔나', 'wien', 'vienne'] },
  { city: 'Stockholm', timeZone: 'Europe/Stockholm', aliases: ['ストックホルム', '斯德哥尔摩', '스톡홀름', 'sweden'] },
  { city: 'Oslo', timeZone: 'Europe/Oslo', aliases: ['オスロ', '奥斯陆', '오슬로'] },
  { city: 'Copenhagen', timeZone: 'Europe/Copenhagen', aliases: ['コペンハーゲン', '哥本哈根', '코펜하겐', 'københavn', 'kopenhagen'] },
  { city: 'Helsinki', timeZone: 'Europe/Helsinki', aliases: ['ヘルシンキ', '赫尔辛基', '헬싱키'] },
  { city: 'Warsaw', timeZone: 'Europe/Warsaw', aliases: ['ワルシャワ', '华沙', '바르샤바', 'warszawa', 'warschau', 'varsovie'] },
  { city: 'Prague', timeZone: 'Europe/Prague', aliases: ['プラハ', '布拉格', '프라하', 'praha', 'prag'] },
  { city: 'Athens', timeZone: 'Europe/Athens', aliases: ['アテネ', '雅典', '아테네', 'athen', 'atenas', 'athènes'] },
  { city: 'Istanbul', timeZone: 'Europe/Istanbul', aliases: ['イスタンブール', '伊斯坦布尔', '이스탄불', 'turkey', 'türkiye'] },
  { city: 'Kyiv', timeZone: 'Europe/Kyiv', aliases: ['kiev', 'キーウ', 'キエフ', '基辅', '키이우'] },
  { city: 'Moscow', timeZone: 'Europe/Moscow', aliases: ['モスクワ', '莫斯科', '모스크바', 'moskau', 'moscú', 'moscou', 'russia'] },
  { city: 'Cairo', timeZone: 'Africa/Cairo', aliases: ['カイロ', '开罗', '카이로', 'kairo', 'le caire', 'egypt'] },
  { city: 'Johannesburg', timeZone: 'Africa/Johannesburg', aliases: ['ヨハネスブルグ', '约翰内斯堡', '요하네스버그', 'cape town', 'ケープタウン', 'south africa'] },
  { city: 'Nairobi', timeZone: 'Africa/Nairobi', aliases: ['ナイロビ', '内罗毕', '나이로비'] },
  { city: 'Lagos', timeZone: 'Africa/Lagos', aliases: ['ラゴス', '拉各斯', '라고스'] },
  { city: 'Dubai', timeZone: 'Asia/Dubai', aliases: ['ドバイ', '迪拜', '두바이', 'abu dhabi', 'uae'] },
  { city: 'Riyadh', timeZone: 'Asia/Riyadh', aliases: ['リヤド', '利雅得', '리야드', 'saudi arabia'] },
  { city: 'Tehran', timeZone: 'Asia/Tehran', aliases: ['テヘラン', '德黑兰', '테헤란', 'iran'] },
  { city: 'Karachi', timeZone: 'Asia/Karachi', aliases: ['カラチ', '卡拉奇', '카라치', 'pakistan'] },
  { city: 'Delhi', timeZone: 'Asia/Kolkata', aliases: ['new delhi', 'デリー', 'ニューデリー', '德里', '新德里', '델리', 'mumbai', 'ムンバイ', '孟买', '뭄바이', 'bangalore', 'bengaluru', 'kolkata', 'india', 'インド'] },
  { city: 'Dhaka', timeZone: 'Asia/Dhaka', aliases: ['ダッカ', '达卡', '다카'] },
  { city: 'Bangkok', timeZone: 'Asia/Bangkok', aliases: ['バンコク', '曼谷', '방콕', 'thailand', 'タイ', 'hanoi', 'ハノイ', '河内', '하노이', 'ho chi minh', 'ホーチミン', 'vietnam', 'jakarta', 'ジャカルタ', '雅加达', '자카르타'] },
  { city: 'Singapore', timeZone: 'Asia/Singapore', aliases: ['シンガポール', '新加坡', '싱가포르', 'singapur', 'singapour', 'kuala lumpur', 'クアラルンプール', '吉隆坡', '쿠알라룸푸르'] },
  { city: 'Hong Kong', timeZone: 'Asia/Hong_Kong', aliases: ['hongkong', '香港', '홍콩', 'ホンコン', 'macau', 'macao', 'マカオ', '澳门'] },
  { city: 'Shanghai', timeZone: 'Asia/Shanghai', aliases: ['上海', '상하이', 'シャンハイ', 'beijing', 'peking', '北京', 'ペキン', '베이징', 'china', '中国', '중국', 'shenzhen', '深圳', 'guangzhou', '广州', 'chengdu', '成都'] },
  { city: 'Taipei', timeZone: 'Asia/Taipei', aliases: ['台北', '臺北', '타이베이', 'タイペイ', 'taiwan', '台湾', '台灣'] },
  { city: 'Manila', timeZone: 'Asia/Manila', aliases: ['マニラ', '马尼拉', '마닐라', 'philippines'] },
  { city: 'Seoul', timeZone: 'Asia/Seoul', aliases: ['서울', 'ソウル', '首尔', 'korea', 'korea', '한국', '韓国', 'busan', '부산', 'プサン', 'seúl', 'séoul'] },
  { city: 'Tokyo', timeZone: 'Asia/Tokyo', aliases: ['東京', '도쿄', 'とうきょう', 'japan', '日本', '일본', 'osaka', '大阪', '오사카', 'kyoto', '京都', 'nagoya', '名古屋', 'sapporo', '札幌', 'fukuoka', '福岡', 'tokio'] },
  { city: 'Sydney', timeZone: 'Australia/Sydney', aliases: ['シドニー', '悉尼', '시드니', 'melbourne', 'メルボルン', '墨尔本', '멜버른', 'canberra', 'australia', 'オーストラリア'] },
  { city: 'Brisbane', timeZone: 'Australia/Brisbane', aliases: ['ブリスベン', '布里斯班', '브리즈번'] },
  { city: 'Perth', timeZone: 'Australia/Perth', aliases: ['パース', '珀斯', '퍼스'] },
  { city: 'Auckland', timeZone: 'Pacific/Auckland', aliases: ['オークランド', '奥克兰', '오클랜드', 'wellington', 'new zealand', 'ニュージーランド'] },
  { city: 'Honolulu', timeZone: 'Pacific/Honolulu', aliases: ['ホノルル', '檀香山', '호놀룰루', 'hawaii', 'ハワイ', '夏威夷', '하와이'] },
  { city: 'Anchorage', timeZone: 'America/Anchorage', aliases: ['アンカレジ', '安克雷奇', '앵커리지', 'alaska'] },
  { city: 'Los Angeles', timeZone: 'America/Los_Angeles', aliases: ['la', 'ロサンゼルス', 'ロス', '洛杉矶', '로스앤젤레스', 'san francisco', 'サンフランシスコ', '旧金山', '샌프란시스코', 'seattle', 'シアトル', '西雅图', '시애틀', 'las vegas', 'ラスベガス', 'san diego', 'california', 'カリフォルニア', 'portland', 'vancouver', 'バンクーバー', '温哥华', '밴쿠버'] },
  { city: 'Denver', timeZone: 'America/Denver', aliases: ['デンバー', '丹佛', '덴버', 'salt lake city'] },
  { city: 'Phoenix', timeZone: 'America/Phoenix', aliases: ['フェニックス', '凤凰城', '피닉스', 'arizona'] },
  { city: 'Chicago', timeZone: 'America/Chicago', aliases: ['シカゴ', '芝加哥', '시카고', 'houston', 'ヒューストン', 'dallas', 'ダラス', 'austin', 'texas', 'テキサス', 'minneapolis', 'new orleans'] },
  { city: 'New York', timeZone: 'America/New_York', aliases: ['nyc', 'ニューヨーク', '纽约', '뉴욕', 'nueva york', 'boston', 'ボストン', '波士顿', '보스턴', 'washington', 'ワシントン', '华盛顿', '워싱턴', 'miami', 'マイアミ', '迈阿密', '마이애미', 'atlanta', 'アトランタ', 'toronto', 'トロント', '多伦多', '토론토', 'montreal', 'モントリオール', 'philadelphia', 'detroit', 'usa', 'アメリカ', '美国', '미국'] },
  { city: 'Mexico City', timeZone: 'America/Mexico_City', aliases: ['ciudad de méxico', 'cdmx', 'mexico', 'méxico', 'メキシコシティ', 'メキシコ', '墨西哥城', '멕시코시티'] },
  { city: 'Bogotá', timeZone: 'America/Bogota', aliases: ['bogota', 'ボゴタ', '波哥大', '보고타', 'colombia', 'lima', 'リマ', 'quito'] },
  { city: 'São Paulo', timeZone: 'America/Sao_Paulo', aliases: ['sao paulo', 'サンパウロ', '圣保罗', '상파울루', 'rio de janeiro', 'rio', 'リオ', 'リオデジャネイロ', 'brasil', 'brazil', 'ブラジル'] },
  { city: 'Buenos Aires', timeZone: 'America/Argentina/Buenos_Aires', aliases: ['ブエノスアイレス', '布宜诺斯艾利斯', '부에노스아이레스', 'argentina', 'montevideo', 'santiago', 'サンティアゴ'] },
];

/** Lowercase, accents stripped, spaces collapsed. */
function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[\s._-]+/g, ' ')
    .trim();
}

const INDEX = new Map<string, CityZone>();
for (const entry of CITIES) {
  INDEX.set(normalize(entry.city), entry);
  for (const alias of entry.aliases) INDEX.set(normalize(alias), entry);
}

export function findCityTimeZone(name: string): { city: string; timeZone: string } | null {
  const hit = INDEX.get(normalize(name));
  return hit ? { city: hit.city, timeZone: hit.timeZone } : null;
}

/** "14:05", "2026-09-22" and "GMT+1" for `now` in the zone. */
export function formatInTimeZone(now: Date, timeZone: string): { time: string; date: string; offset: string } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZoneName: 'shortOffset',
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || '';
  // en-GB may render midnight as "24"; normalise to 00.
  const hour = get('hour') === '24' ? '00' : get('hour');
  return {
    time: `${hour}:${get('minute')}`,
    date: `${get('year')}-${get('month')}-${get('day')}`,
    // ICU renders zero offset as "GMT" or "GMT+0" depending on version; say "UTC" for both.
    offset: get('timeZoneName').replace('GMT', 'UTC').replace(/^UTC[+-]0$/, '') || 'UTC',
  };
}
