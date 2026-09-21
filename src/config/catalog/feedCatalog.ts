import type { PresetLanguage } from '../defaults/regionalPresets';

/**
 * Well-known RSS / Atom feeds per region for the news widget's "pick a
 * feed" list. Only the URL is stored (as `feedUrl`); the category is a
 * key the picker localizes, so the same list serves every UI language.
 *
 * Feeds are third-party endpoints: they live on `optional_host_permissions`
 * and are requested when chosen, exactly like a hand-typed feed URL.
 */
export type FeedCategory = 'general' | 'tech' | 'business' | 'entertainment' | 'sports' | 'science' | 'lifestyle';

export const FEED_CATEGORIES: FeedCategory[] = ['general', 'tech', 'business', 'entertainment', 'sports', 'science', 'lifestyle'];

export interface CatalogFeed {
  id: string;
  title: string;
  url: string;
  category: FeedCategory;
}

type Row = [id: string, title: string, url: string, category: FeedCategory];
const rows = (list: Row[]): CatalogFeed[] => list.map(([id, title, url, category]) => ({ id, title, url, category }));

const FEEDS: Record<PresetLanguage, CatalogFeed[]> = {
  en: rows([
    ['bbc', 'BBC News', 'https://feeds.bbci.co.uk/news/rss.xml', 'general'],
    ['nyt', 'The New York Times', 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml', 'general'],
    ['guardian', 'The Guardian', 'https://www.theguardian.com/international/rss', 'general'],
    ['npr', 'NPR News', 'https://feeds.npr.org/1001/rss.xml', 'general'],
    ['reuters-reddit', 'Reddit · r/worldnews', 'https://www.reddit.com/r/worldnews/.rss', 'general'],
    ['bbc-tech', 'BBC Technology', 'https://feeds.bbci.co.uk/news/technology/rss.xml', 'tech'],
    ['verge', 'The Verge', 'https://www.theverge.com/rss/index.xml', 'tech'],
    ['ars', 'Ars Technica', 'https://feeds.arstechnica.com/arstechnica/index', 'tech'],
    ['wired', 'WIRED', 'https://www.wired.com/feed/rss', 'tech'],
    ['techcrunch', 'TechCrunch', 'https://techcrunch.com/feed/', 'tech'],
    ['hn', 'Hacker News', 'https://news.ycombinator.com/rss', 'tech'],
    ['bbc-business', 'BBC Business', 'https://feeds.bbci.co.uk/news/business/rss.xml', 'business'],
    ['espn', 'ESPN', 'https://www.espn.com/espn/rss/news', 'sports'],
    ['bbc-sport', 'BBC Sport', 'https://feeds.bbci.co.uk/sport/rss.xml', 'sports'],
    ['nasa', 'NASA Breaking News', 'https://www.nasa.gov/rss/dyn/breaking_news.rss', 'science'],
    ['sciencedaily', 'ScienceDaily', 'https://www.sciencedaily.com/rss/all.xml', 'science'],
    ['variety', 'Variety', 'https://variety.com/feed/', 'entertainment'],
    ['lifehacker', 'Lifehacker', 'https://lifehacker.com/feed/rss', 'lifestyle'],
  ]),

  ja: rows([
    ['nhk', 'NHK 主要ニュース', 'https://www3.nhk.or.jp/rss/news/cat0.xml', 'general'],
    ['nhk-society', 'NHK 社会', 'https://www3.nhk.or.jp/rss/news/cat1.xml', 'general'],
    ['nhk-world', 'NHK 国際', 'https://www3.nhk.or.jp/rss/news/cat6.xml', 'general'],
    ['yahoo-top', 'Yahoo!ニュース トピックス', 'https://news.yahoo.co.jp/rss/topics/top-picks.xml', 'general'],
    ['hatena-hot', 'はてなブックマーク 人気エントリー', 'https://b.hatena.ne.jp/hotentry.rss', 'general'],
    ['itmedia-news', 'ITmedia NEWS', 'https://rss.itmedia.co.jp/rss/2.0/news_bursts.xml', 'tech'],
    ['gigazine', 'GIGAZINE', 'https://gigazine.net/news/rss_2.0/', 'tech'],
    ['impress', 'Impress Watch', 'https://www.watch.impress.co.jp/data/rss/1.0/ipw/feed.rdf', 'tech'],
    ['cnet-jp', 'CNET Japan', 'https://feeds.japan.cnet.com/rss/cnet/all.rdf', 'tech'],
    ['publickey', 'Publickey', 'https://www.publickey1.jp/atom.xml', 'tech'],
    ['hatena-it', 'はてなブックマーク テクノロジー', 'https://b.hatena.ne.jp/hotentry/it.rss', 'tech'],
    ['yahoo-it', 'Yahoo!ニュース IT', 'https://news.yahoo.co.jp/rss/topics/it.xml', 'tech'],
    ['qiita', 'Qiita 人気の記事', 'https://qiita.com/popular-items/feed', 'tech'],
    ['nhk-business', 'NHK ビジネス', 'https://www3.nhk.or.jp/rss/news/cat5.xml', 'business'],
    ['yahoo-business', 'Yahoo!ニュース 経済', 'https://news.yahoo.co.jp/rss/topics/business.xml', 'business'],
    ['yahoo-ent', 'Yahoo!ニュース エンタメ', 'https://news.yahoo.co.jp/rss/topics/entertainment.xml', 'entertainment'],
    ['natalie', '音楽ナタリー', 'https://natalie.mu/music/feed/news', 'entertainment'],
    ['famitsu', 'ファミ通.com', 'https://www.famitsu.com/feed/', 'entertainment'],
    ['4gamer', '4Gamer.net', 'https://www.4gamer.net/rss/index.xml', 'entertainment'],
    ['nhk-sports', 'NHK スポーツ', 'https://www3.nhk.or.jp/rss/news/cat7.xml', 'sports'],
    ['yahoo-sports', 'Yahoo!ニュース スポーツ', 'https://news.yahoo.co.jp/rss/topics/sports.xml', 'sports'],
    ['nhk-science', 'NHK 科学・文化', 'https://www3.nhk.or.jp/rss/news/cat3.xml', 'science'],
    ['lifehacker-jp', 'ライフハッカー・ジャパン', 'https://www.lifehacker.jp/feed/index.xml', 'lifestyle'],
    ['rocketnews', 'ロケットニュース24', 'https://rocketnews24.com/feed/', 'lifestyle'],
  ]),

  ko: rows([
    ['yonhap', '연합뉴스 최신', 'https://www.yna.co.kr/rss/news.xml', 'general'],
    ['hani', '한겨레', 'https://www.hani.co.kr/rss/', 'general'],
    ['khan', '경향신문', 'https://www.khan.co.kr/rss/rssdata/total_news.xml', 'general'],
    ['chosun', '조선일보', 'https://www.chosun.com/arc/outboundfeeds/rss/?outputType=xml', 'general'],
    ['donga', '동아일보', 'https://rss.donga.com/total.xml', 'general'],
    ['sbs', 'SBS 뉴스', 'https://news.sbs.co.kr/news/SectionRssFeed.do?sectionId=01&plink=RSSREADER', 'general'],
    ['zdnet-kr', 'ZDNet Korea', 'https://feeds.feedburner.com/zdkorea', 'tech'],
    ['bloter', '블로터', 'https://www.bloter.net/feed', 'tech'],
    ['etnews', '전자신문', 'https://rss.etnews.com/Section901.xml', 'tech'],
    ['mk', '매일경제', 'https://www.mk.co.kr/rss/30000001/', 'business'],
    ['hankyung', '한국경제', 'https://www.hankyung.com/feed/all-news', 'business'],
    ['yonhap-sports', '연합뉴스 스포츠', 'https://www.yna.co.kr/rss/sports.xml', 'sports'],
    ['yonhap-ent', '연합뉴스 연예', 'https://www.yna.co.kr/rss/entertainment.xml', 'entertainment'],
    ['dongascience', '동아사이언스', 'https://www.dongascience.com/rss/news.xml', 'science'],
  ]),

  'zh-CN': rows([
    ['bbc-zh', 'BBC 中文', 'https://feeds.bbci.co.uk/zhongwen/simp/rss.xml', 'general'],
    ['nyt-zh', '纽约时报中文网', 'https://cn.nytimes.com/rss/', 'general'],
    ['dw-zh', '德国之声 中文', 'https://rss.dw.com/rdf/rss-chi-all', 'general'],
    ['zhihu', '知乎每日精选', 'https://www.zhihu.com/rss', 'general'],
    ['sspai', '少数派', 'https://sspai.com/feed', 'tech'],
    ['ifanr', '爱范儿', 'https://www.ifanr.com/feed', 'tech'],
    ['geekpark', '极客公园', 'https://www.geekpark.net/rss', 'tech'],
    ['solidot', 'Solidot 奇客', 'https://www.solidot.org/index.rss', 'tech'],
    ['cnbeta', 'cnBeta', 'https://www.cnbeta.com.tw/backend.php', 'tech'],
    ['36kr', '36氪', 'https://36kr.com/feed', 'business'],
    ['huxiu', '虎嗅', 'https://www.huxiu.com/rss/0.xml', 'business'],
    ['gcores', '机核 GCORES', 'https://www.gcores.com/rss', 'entertainment'],
    ['douban-movie', '豆瓣电影 · 即将上映', 'https://www.douban.com/feed/movie/coming', 'entertainment'],
    ['guokr', '果壳', 'https://www.guokr.com/rss/', 'science'],
  ]),

  es: rows([
    ['elpais', 'El País', 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada', 'general'],
    ['elmundo', 'El Mundo', 'https://e00-elmundo.uecdn.es/elmundo/rss/portada.xml', 'general'],
    ['abc', 'ABC', 'https://www.abc.es/rss/2.0/portada/', 'general'],
    ['lavanguardia', 'La Vanguardia', 'https://www.lavanguardia.com/rss/home.xml', 'general'],
    ['20minutos', '20minutos', 'https://www.20minutos.es/rss/', 'general'],
    ['bbc-mundo', 'BBC Mundo', 'https://feeds.bbci.co.uk/mundo/rss.xml', 'general'],
    ['infobae', 'Infobae', 'https://www.infobae.com/feeds/rss/', 'general'],
    ['clarin', 'Clarín', 'https://www.clarin.com/rss/lo-ultimo/', 'general'],
    ['eluniversal', 'El Universal (México)', 'https://www.eluniversal.com.mx/rss.xml', 'general'],
    ['xataka', 'Xataka', 'https://www.xataka.com/feedburner.xml', 'tech'],
    ['genbeta', 'Genbeta', 'https://www.genbeta.com/feedburner.xml', 'tech'],
    ['hipertextual', 'Hipertextual', 'https://hipertextual.com/feed', 'tech'],
    ['expansion', 'Expansión', 'https://e00-expansion.uecdn.es/rss/portada.xml', 'business'],
    ['marca', 'Marca', 'https://e00-marca.uecdn.es/rss/portada.xml', 'sports'],
    ['as', 'Diario AS', 'https://as.com/rss/tags/ultimas_noticias.xml', 'sports'],
    ['fotogramas', 'Fotogramas', 'https://www.fotogramas.es/rss/all.xml/', 'entertainment'],
    ['muyinteresante', 'Muy Interesante', 'https://www.muyinteresante.com/feed/', 'science'],
  ]),

  fr: rows([
    ['lemonde', 'Le Monde', 'https://www.lemonde.fr/rss/une.xml', 'general'],
    ['lefigaro', 'Le Figaro', 'https://www.lefigaro.fr/rss/figaro_actualites.xml', 'general'],
    ['franceinfo', 'franceinfo', 'https://www.francetvinfo.fr/titres.rss', 'general'],
    ['20minutes', '20 Minutes', 'https://www.20minutes.fr/feeds/rss-une.xml', 'general'],
    ['bfmtv', 'BFMTV', 'https://www.bfmtv.com/rss/news-24-7/', 'general'],
    ['france24', 'France 24', 'https://www.france24.com/fr/rss', 'general'],
    ['courrier', 'Courrier international', 'https://www.courrierinternational.com/feed/all/rss.xml', 'general'],
    ['numerama', 'Numerama', 'https://www.numerama.com/feed/', 'tech'],
    ['01net', '01net', 'https://www.01net.com/feed/', 'tech'],
    ['frandroid', 'Frandroid', 'https://www.frandroid.com/feed', 'tech'],
    ['jdg', 'Journal du Geek', 'https://www.journaldugeek.com/feed/', 'tech'],
    ['lesechos', 'Les Echos', 'https://services.lesechos.fr/rss/les-echos-economie.xml', 'business'],
    ['lequipe', "L'Équipe", 'https://dwh.lequipe.fr/api/edito/rss?path=/', 'sports'],
    ['allocine', 'AlloCiné', 'https://www.allocine.fr/rss/news.xml', 'entertainment'],
    ['konbini', 'Konbini', 'https://www.konbini.com/feed/', 'entertainment'],
    ['sciencesetavenir', 'Sciences et Avenir', 'https://www.sciencesetavenir.fr/rss.xml', 'science'],
  ]),

  de: rows([
    ['tagesschau', 'tagesschau', 'https://www.tagesschau.de/index~rss2.xml', 'general'],
    ['spiegel', 'DER SPIEGEL', 'https://www.spiegel.de/schlagzeilen/index.rss', 'general'],
    ['zeit', 'ZEIT ONLINE', 'https://newsfeed.zeit.de/index', 'general'],
    ['faz', 'FAZ', 'https://www.faz.net/rss/aktuell/', 'general'],
    ['sz', 'Süddeutsche Zeitung', 'https://rss.sueddeutsche.de/rss/Topthemen', 'general'],
    ['ntv', 'n-tv', 'https://www.n-tv.de/rss', 'general'],
    ['dw', 'Deutsche Welle', 'https://rss.dw.com/rdf/rss-de-all', 'general'],
    ['heise', 'heise online', 'https://www.heise.de/rss/heise-atom.xml', 'tech'],
    ['golem', 'Golem.de', 'https://rss.golem.de/rss.php?feed=RSS2.0', 'tech'],
    ['t3n', 't3n', 'https://t3n.de/rss.xml', 'tech'],
    ['netzpolitik', 'netzpolitik.org', 'https://netzpolitik.org/feed/', 'tech'],
    ['chip', 'CHIP', 'https://www.chip.de/rss/rss_topnews.xml', 'tech'],
    ['handelsblatt', 'Handelsblatt', 'https://www.handelsblatt.com/contentexport/feed/schlagzeilen', 'business'],
    ['kicker', 'kicker', 'https://newsfeed.kicker.de/news/aktuell', 'sports'],
    ['sportschau', 'Sportschau', 'https://www.sportschau.de/index~rss2.xml', 'sports'],
    ['spektrum', 'Spektrum der Wissenschaft', 'https://www.spektrum.de/alias/rss/spektrum-de-rss-feed/996406', 'science'],
    ['filmstarts', 'FILMSTARTS', 'https://www.filmstarts.de/rss/news.xml', 'entertainment'],
  ]),
};

export function getFeedCatalog(lang: PresetLanguage): CatalogFeed[] {
  return FEEDS[lang].map((feed) => ({ ...feed }));
}
