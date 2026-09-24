# Chrome Web Store 掲載情報（Store Listing）

Chrome Web Store デベロッパーダッシュボードの各入力欄に貼り付けるテキスト集です。
このファイルが掲載文の正本であり、ダッシュボード側を直接編集した場合は必ずここへ反映してください。

## 記載時の原則

過去に「キーワードスパム（Yellow Argon）」で否認された経緯があるため、以下を厳守します。

1. **ブランド名・サービス名を列挙しない。** 対応先は「主要なWeb検索エンジン」「動画検索」
   のように *機能* で記述します。アプリ内UIに固有名を表示することはポリシー違反では
   ありませんが、掲載文（メタデータ）に並べることは違反にあたります。
2. **実装にない機能を書かない。** 「誤解を生じさせるメタデータ」も同じスパム条項の対象です。
   掲載文を更新するときは、必ず該当機能がコードに存在することを確認してください。
3. **プライバシーに関する断言を正確に保つ。** ZenithTab は天気表示のために座標を外部APIへ
   送信します。「外部への送信は一切ない」という書き方はできません。

---

## 1. 基本情報（Basic Info）

- **アイテム名（Title）**: `ZenithTab - New Tab Dashboard`
  - manifest では `_locales/*/messages.json` の `extName` から供給されます。
    ダッシュボード側の表示名もこれに合わせてください。
- **カテゴリ**: 仕事効率化（Productivity）
- **プライバシーポリシーURL**: `https://github.com/miyabiver39/ZenithTab/blob/main/PRIVACY.md`

### 短い説明（Summary / 132文字以内）

`public/_locales/<locale>/messages.json` の `extDescription` と同一の文言です。
どちらかを変更したら必ずもう一方も揃えてください（`npm run verify` が文字数超過を検知します）。

- **日本語 (ja)**:
  ```text
  ウィジェットを自由に配置できる新しいタブ。ブックマーク、ニュース、天気、カレンダー、習慣トラッカー、ダイナミック壁紙に対応。
  ```
- **英語 (en)**:
  ```text
  A customizable new tab dashboard: drag-and-drop widgets, bookmarks, news, weather, calendar, habits and dynamic wallpapers.
  ```
- **スペイン語 (es)**:
  ```text
  Panel de nueva pestaña personalizable: widgets, marcadores, noticias, clima, calendario, hábitos y fondos dinámicos.
  ```
- **ドイツ語 (de)**:
  ```text
  Anpassbares Neuer-Tab-Dashboard: Widgets, Lesezeichen, Nachrichten, Wetter, Kalender, Gewohnheiten und dynamische Hintergründe.
  ```
- **フランス語 (fr)**:
  ```text
  Nouvel onglet personnalisable : widgets, favoris, actualités, météo, calendrier, habitudes et fonds d'écran dynamiques.
  ```
- **韓国語 (ko)**:
  ```text
  위젯을 자유롭게 배치하는 새 탭 대시보드. 북마크, 뉴스, 날씨, 캘린더, 습관 트래커, 다이내믹 배경화면을 지원합니다.
  ```
- **中国語簡体字 (zh_CN)**:
  ```text
  可自由拖放组件的新标签页仪表板，支持书签、新闻、天气、日历、习惯打卡和动态壁纸。
  ```

---

## 2. 詳細な説明（Detailed Description）

各言語とも同じ構成です（導入 → 始め方 → 画面の組み立て → 検索 → サイトへの移動 → ウィジェット → 安心して使える仕組み → 外観 → プライバシー）。
機能を足したら全言語の同じ位置に追記し、サービス名は並べずに機能で書いてください（冒頭の原則 1）。

### 日本語版

```text
ZenithTab は、新しいタブを「自分専用の作業台」に変えるダッシュボードです。

検索バー、よく使うサイト、天気、ニュース、予定、タスク、メモ。毎日見るものを 1 枚の画面に並べておけば、タブを開くたびにそのまま迎えてくれます。設定はお使いのパソコンの中に保存され、アカウント登録は必要ありません。

■ 3 つの質問ですぐ使える
初めて開いたときは「言語と地域」「興味のあるジャンル」「使い道」を選ぶだけで、地域に合ったよく使うサイト、ニュースのトピック、ウィジェットの構成がそろいます。どの質問もスキップでき、あとからすべて変更できます。設定画面からいつでもやり直せます（実行前に自動でバックアップします）。

■ 自由なグリッドと複数ページ
ウィジェットは好きな位置へドラッグでき、四隅をつかんでサイズも変えられます。ノートPCでも外部ディスプレイでも配置が崩れません。ウィジェットはページに分けて管理でき、空のページ、今のページの複製、テンプレート（仕事・学習・ニュース・ミニマル）から追加できます。ページはクリックまたは Ctrl+Alt+←/→ で切り替えます。

■ 統合検索バー
Web検索、コードリポジトリ検索、動画検索、AIアシスタントなどの検索先をワンクリックで切り替えられます。検索先は「カタログから追加」で選ぶだけで増やせます。カタログはWeb検索・AIアシスタント・動画・ショッピング・地図と辞書・開発者向け・SNSに分かれ、地域ごとによく使われる検索先も収録しています。カタログにない検索先も、名前と検索用URLを入力すれば追加できます。既定の検索先は★で選び、使わないものは一覧から外せます。キーボードの「/」キーで、どこからでも検索欄に移動します。

■ 検索バーのスマート回答
検索する前に、その場で答えが表示されます。計算（120*1.1）、パーセント、単位換算（10 km to mi）、進数変換、サイコロ、コイントス、乱数、候補からの選択、指定日までの日数、○日後の日付、曜日、世界の都市の現在時刻に対応しています。検索欄に「?」と入力すると入力例の一覧が出ます。

■ ショートカット、クイックドック、アプリドロワー
よく使うサイトをタイルとして並べ、ワンクリックで開けます。追加は、地域ごとのサイトカタログから選ぶ、Chrome のブックマークや「よく見るサイト」から取り込む、リンクをドラッグ＆ドロップする、のいずれでも行えます。画面の下（または上）には常に表示されるクイックドックを置け、アプリドロワーでは登録したサイトをカテゴリで絞り込んだり名前で検索したりできます。

■ キーボードショートカット
好きなリンクにキーの組み合わせを割り当てれば、マウスを使わずに開けます。組み込みのショートカット（検索欄へ移動、ページ切り替え、元に戻す／やり直す）は設定画面で一覧できます。

■ 今日のまとめ
画面上部に、未完了のタスク、今日の予定、いちばん近いカウントダウンを 1 行で表示します。

■ ウィジェット
・ブックマーク：Chrome のブックマークをフォルダをたどって表示し、名前で絞り込めます
・ニュース / RSS：トピックやキーワードでニュースを購読。地域ごとのフィードカタログから選ぶことも、お好みの RSS/Atom フィードを追加することもできます
・天気：都市名または「現在地を検出」で設定。気温・体感温度・風速・湿度と 3 日先までの予報
・カレンダー：お使いのカレンダーサービスの iCal（.ics）リンクから、今日から数日先までの予定を表示。複数カレンダーの色分け、終日・繰り返しの予定に対応
・タスク管理：チェックボックス式の ToDo リスト
・クイックメモ：自動保存されるメモ。ページ（タブ）で書き分けられます
・集中タイマー：25 分の集中と休憩を繰り返すポモドーロタイマー
・習慣トラッカー：毎日の習慣をチェックし、連続日数と直近 7 日の達成状況を表示
・カウントダウン：誕生日・旅行・試験・締切まであと何日か。毎年の記念日も繰り返し表示
・クイックアクセス：「よく見るサイト」と「最近閉じたタブ」をワンクリックで開く／復元
・時計：デジタル・アナログ・ミニマルの 3 スタイル。タイムゾーンも指定できます
・QR コード：URL・電話番号・テキストをその場で QR コードに変換（端末内で生成）
・Web 埋め込み：埋め込み表示に対応した Web ページをウィジェットとして表示

■ 誤操作からの復元
削除や配置の変更は、直後に「元に戻す」（Ctrl+Z）で取り消せます。削除したウィジェットとページは 30 日間ごみ箱に残り、リセットやインポートの前にはダッシュボード全体のバックアップを自動で保存します。

■ 構成の共有と持ち運び
今のページの構成を短い「共有コード」や QR コードにして、ほかの人や別のパソコンに渡せます。メモ・タスク・習慣の記録・カレンダーのリンク・カウントダウン・天気の位置は含まれません。設定全体は JSON として書き出し・読み込みができます。

■ 設定の同期（任意）
オンにすると、外観・ドック・キーボードショートカットを、同じアカウントでログインした Chrome の間で揃えられます。Chrome 自身のアカウント同期を使うため、開発者のサーバーは経由しません。既定はオフで、ウィジェットやメモなどの中身は同期されません。

■ ダイナミック壁紙とガラスの質感
宇宙・自然・ミニマル・建築・抽象・サイバーパンクのコレクション、グラデーション、手持ちの画像から選べます。すりガラスのぼかし、明るさ、暗さはスライダーで調整でき、「時間帯で変える」をオンにすると朝・昼・夕方・夜で壁紙が自動で切り替わります。明るい壁紙の上では文字が自動で暗い色になり、読みやすさを保ちます。

■ 7 つの言語
日本語、英語、中国語（簡体字）、スペイン語、フランス語、ドイツ語、韓国語に対応しています。

■ ローカルファースト
レイアウト、メモ、設定はお使いのパソコンの chrome.storage.local に保存されます。ZenithTab には独自のサーバーがなく、アクセス解析も広告もトラッカーもありません。外部への通信は、天気の取得（選んだ地点の座標）と地名の変換、ニュース・RSS・カレンダー（iCal）の取得、壁紙画像の読み込み、Web 埋め込みで指定したページの表示に限られます。任意の設定同期を使う場合は、その内容が Chrome のアカウント同期を通ります。詳細はプライバシーポリシーをご覧ください。

オープンソース（MIT ライセンス）です:
https://github.com/miyabiver39/ZenithTab
```

### 英語版

```text
ZenithTab turns the new tab page into a workspace you arrange yourself.

Search, your favourite sites, weather, news, today's events, tasks and notes — put the things you check every day on one screen, and they are waiting every time you open a tab. Everything is stored on your own computer, and there is no account to create.

■ Ready in three questions
The first time you open it, pick your language and region, the topics you care about, and what the tab is for. ZenithTab then lays out popular sites for your region, news on your topics and a set of widgets to match. Every question can be skipped, everything can be changed later, and you can run the setup again from the settings (a backup is taken first).

■ A free grid, on as many pages as you like
Drag widgets anywhere and grab a corner to resize them; the layout holds on a laptop screen and on an external monitor alike. Split widgets across pages — start one empty, duplicate the current page, or pick a template (Work, Study, News, Minimal) — and switch with a click or Ctrl+Alt+←/→.

■ Unified search bar
Switch in one click between web search, code repository search, video search, AI assistants and more. Adding a destination is as simple as picking it from the built-in catalog, organised into web search, AI assistants, video, shopping, maps and reference, developer tools and social, with regional options for every language. Anything not in the catalog can still be added with a name and a search URL. Star the one you want as the default and remove the ones you don't use. Press "/" anywhere to jump into the search field.

■ Smart answers in the search bar
Get the answer before you even search: calculations (120*1.1), percentages, unit conversions (10 km to mi), number bases, dice, coin flips, random numbers, picking from a list, days until a date, the date some days from now, the day of the week, and the current time in cities around the world. Type "?" to see examples.

■ Shortcuts, Quick Dock and App Drawer
Keep the sites you use most as tiles and open them in one click. Add them from a regional site catalog, import them from your Chrome bookmarks or most-visited sites, or simply drag a link in. A Quick Dock stays visible at the bottom (or top) of the screen, and the App Drawer filters your saved sites by category and searches them by name.

■ Keyboard shortcuts
Bind any link to a key combination and open it without touching the mouse. The built-in shortcuts (jump to search, switch pages, undo/redo) are listed in the settings.

■ Today at a glance
A single line at the top shows your open tasks, today's events and the nearest countdown.

■ Widgets
- Bookmarks: browse your Chrome bookmarks folder by folder and filter them by name
- News / RSS: follow news by topic or keyword, pick feeds from a regional catalog, or add any RSS/Atom feed
- Weather: set a city by name or detect your location; temperature, feels-like, wind, humidity and a three-day forecast
- Calendar: paste the iCal (.ics) link from your calendar service to see the coming days' events, with several colour-coded calendars and all-day and recurring events
- Tasks: a simple checklist
- Quick notes: auto-saving notes, split into pages (tabs)
- Focus timer: a Pomodoro cycle of 25-minute focus sessions and breaks
- Habit tracker: tick off daily habits and see your streak and the last seven days
- Countdown: days left until a birthday, a trip, an exam or a deadline, with yearly repeats
- Quick Access: open your most-visited sites or restore recently closed tabs in one click
- Clock: digital, analog or minimal, in any time zone
- QR code: turn a URL, phone number or text into a QR code, generated on your device
- Web embed: show a web page that allows embedding as a widget

■ Undo, trash and backups
Every delete and layout change can be undone right away (Ctrl+Z). Deleted widgets and pages stay in the trash for 30 days, and a backup of the whole dashboard is taken automatically before a reset or an import.

■ Share and move your setup
Turn the current page's layout into a short share code or a QR code to hand to someone else or another computer. Notes, tasks, habit history, calendar links, countdowns and your weather location are left out. The full configuration can be exported to and imported from JSON.

■ Optional settings sync
Turn it on to keep your appearance, Dock and keyboard shortcuts the same on every Chrome signed in to your account. It uses Chrome's own account sync, never a server of ours. It is off by default, and widgets, notes and other content are never synced.

■ Dynamic wallpapers and a glass look
Choose from curated collections (cosmos, nature, minimal, architecture, abstract, cyberpunk), gradients or your own image. Sliders set the blur, brightness and dimming, and the time-of-day mode changes the wallpaper through morning, day, sunset and night. On a light wallpaper, text switches to a dark colour so it stays readable.

■ Seven languages
English, Japanese, Simplified Chinese, Spanish, French, German and Korean.

■ Local-first
Your layout, notes and settings live in chrome.storage.local on your machine. ZenithTab has no backend of its own, no analytics, no ads and no trackers. Its only outbound requests fetch the weather for the location you chose and its place name, the news, feeds and calendars (iCal) you set up, and wallpaper images, plus loading the pages you embed. If you turn on the optional settings sync, that data travels through Chrome's account sync. The privacy policy spells this out in full.

Open source under the MIT license:
https://github.com/miyabiver39/ZenithTab
```

### スペイン語版（Español）

```text
ZenithTab convierte la página de nueva pestaña en un espacio de trabajo que organizas tú mismo.

Búsqueda, tus sitios favoritos, el tiempo, noticias, los eventos del día, tareas y notas: coloca en una sola pantalla lo que consultas a diario y te estará esperando cada vez que abras una pestaña. Todo se guarda en tu propio ordenador y no hace falta crear ninguna cuenta.

■ Listo en tres preguntas
La primera vez que lo abres, elige idioma y región, los temas que te interesan y para qué usarás la pestaña. ZenithTab prepara sitios populares de tu región, noticias sobre tus temas y un conjunto de widgets a juego. Puedes saltar cualquier pregunta, cambiarlo todo después y repetir la configuración desde los ajustes (antes se guarda una copia de seguridad).

■ Una cuadrícula libre, en tantas páginas como quieras
Arrastra los widgets a donde quieras y ajusta su tamaño desde las esquinas; la disposición se mantiene tanto en un portátil como en un monitor externo. Reparte los widgets en páginas —vacía, duplicando la actual o a partir de una plantilla (Trabajo, Estudio, Noticias, Minimalista)— y cambia entre ellas con un clic o con Ctrl+Alt+←/→.

■ Barra de búsqueda unificada
Cambia con un clic entre búsqueda web, búsqueda en repositorios de código, búsqueda de vídeos, asistentes de IA y más. Para añadir un destino basta con elegirlo del catálogo integrado, organizado en búsqueda web, asistentes de IA, vídeo, compras, mapas y consulta, desarrolladores y redes sociales, con opciones regionales para cada idioma. Lo que no esté en el catálogo se puede añadir con un nombre y una URL de búsqueda. Marca con la estrella el predeterminado y quita los que no uses. Pulsa «/» en cualquier lugar para ir al campo de búsqueda.

■ Respuestas rápidas en la barra de búsqueda
Obtén la respuesta antes de buscar: cálculos (120*1.1), porcentajes, conversión de unidades (10 km to mi), bases numéricas, dados, cara o cruz, números aleatorios, elegir de una lista, días hasta una fecha, la fecha dentro de unos días, el día de la semana y la hora actual en ciudades de todo el mundo. Escribe «?» para ver ejemplos.

■ Accesos directos, Dock rápido y cajón de aplicaciones
Guarda como mosaicos los sitios que más usas y ábrelos con un clic. Añádelos desde un catálogo de sitios por región, impórtalos de tus marcadores de Chrome o de los sitios más visitados, o simplemente arrastra un enlace. Un Dock rápido permanece visible abajo (o arriba) de la pantalla, y el cajón de aplicaciones filtra tus sitios por categoría y los busca por nombre.

■ Atajos de teclado
Asigna cualquier enlace a una combinación de teclas y ábrelo sin tocar el ratón. Los atajos integrados (ir a la búsqueda, cambiar de página, deshacer/rehacer) se listan en los ajustes.

■ Tu día de un vistazo
Una línea en la parte superior muestra las tareas pendientes, los eventos de hoy y la cuenta atrás más próxima.

■ Widgets
- Marcadores: recorre tus marcadores de Chrome carpeta a carpeta y fíltralos por nombre
- Noticias / RSS: sigue noticias por tema o palabra clave, elige feeds de un catálogo por región o añade cualquier feed RSS/Atom
- El tiempo: elige una ciudad o detecta tu ubicación; temperatura, sensación térmica, viento, humedad y previsión a tres días
- Calendario: pega el enlace iCal (.ics) de tu servicio de calendario para ver los eventos de los próximos días, con varios calendarios por colores y eventos de todo el día y periódicos
- Tareas: una lista de verificación sencilla
- Notas rápidas: notas que se guardan solas, divididas en páginas (pestañas)
- Temporizador de concentración: ciclos Pomodoro de 25 minutos de concentración y descansos
- Hábitos: marca tus hábitos diarios y sigue tu racha y los últimos siete días
- Cuenta atrás: días que faltan para un cumpleaños, un viaje, un examen o una fecha límite, con repetición anual
- Acceso rápido: abre los sitios más visitados o restaura pestañas cerradas con un clic
- Reloj: digital, analógico o minimalista, en cualquier zona horaria
- Código QR: convierte una URL, un teléfono o un texto en un código QR generado en tu dispositivo
- Web incrustada: muestra como widget una página web que permita incrustarse

■ Deshacer, papelera y copias de seguridad
Cada borrado y cambio de disposición se puede deshacer al momento (Ctrl+Z). Los widgets y páginas borrados permanecen 30 días en la papelera, y antes de un reinicio o una importación se guarda automáticamente una copia de todo el panel.

■ Comparte y lleva tu configuración
Convierte la disposición de la página actual en un código corto o un código QR para dárselo a otra persona u otro ordenador. No incluye notas, tareas, historial de hábitos, enlaces de calendario, cuentas atrás ni la ubicación del tiempo. La configuración completa se puede exportar e importar en JSON.

■ Sincronización opcional de ajustes
Actívala para mantener igual el aspecto, el Dock y los atajos de teclado en todos los Chrome con tu cuenta. Usa la propia sincronización de cuenta de Chrome, nunca un servidor nuestro. Viene desactivada, y los widgets, notas y demás contenido nunca se sincronizan.

■ Fondos dinámicos y efecto cristal
Elige entre colecciones seleccionadas (cosmos, naturaleza, minimalismo, arquitectura, abstracto, cyberpunk), degradados o tu propia imagen. Los controles ajustan el desenfoque, el brillo y el oscurecimiento, y el modo según la hora cambia el fondo por la mañana, el día, el atardecer y la noche. Sobre un fondo claro, el texto pasa a un color oscuro para seguir siendo legible.

■ Siete idiomas
Español, inglés, japonés, chino simplificado, francés, alemán y coreano.

■ Prioridad a lo local
Tu disposición, tus notas y tus ajustes viven en chrome.storage.local, en tu máquina. ZenithTab no tiene servidor propio, ni analíticas, ni anuncios, ni rastreadores. Sus únicas conexiones salientes obtienen el tiempo de la ubicación que elegiste y su nombre, las noticias, los feeds y los calendarios (iCal) que configuraste y las imágenes de fondo, además de cargar las páginas que incrustes. Si activas la sincronización opcional, esos datos viajan por la sincronización de cuenta de Chrome. La política de privacidad lo detalla por completo.

Código abierto con licencia MIT:
https://github.com/miyabiver39/ZenithTab
```

### ドイツ語版（Deutsch）

```text
ZenithTab macht aus dem Neuer-Tab-Bildschirm eine Arbeitsfläche, die du selbst einrichtest.

Suche, deine Lieblingsseiten, Wetter, Nachrichten, heutige Termine, Aufgaben und Notizen – leg alles, was du täglich brauchst, auf einen Bildschirm, und es wartet bei jedem neuen Tab auf dich. Alles wird auf deinem eigenen Rechner gespeichert, und ein Konto brauchst du nicht.

■ In drei Fragen startklar
Beim ersten Öffnen wählst du Sprache und Region, deine Interessen und wofür du den Tab nutzt. ZenithTab stellt daraufhin beliebte Seiten deiner Region, Nachrichten zu deinen Themen und passende Widgets zusammen. Jede Frage lässt sich überspringen, alles später ändern, und die Einrichtung kannst du in den Einstellungen wiederholen (vorher wird eine Sicherung angelegt).

■ Ein freies Raster auf beliebig vielen Seiten
Zieh Widgets an jede Stelle und fass eine Ecke an, um die Größe zu ändern; das Layout hält auf dem Notebook wie am externen Monitor. Verteile Widgets auf Seiten – leer, als Kopie der aktuellen Seite oder aus einer Vorlage (Arbeit, Lernen, Nachrichten, Minimal) – und wechsle per Klick oder mit Strg+Alt+←/→.

■ Vereinheitlichte Suchleiste
Wechsle mit einem Klick zwischen Websuche, Suche in Code-Repositorys, Videosuche, KI-Assistenten und mehr. Neue Suchziele wählst du einfach aus dem eingebauten Katalog – gegliedert in Websuche, KI-Assistenten, Video, Shopping, Karten & Nachschlagen, Entwickler und Social Media, mit regionalen Angeboten für jede Sprache. Was nicht im Katalog steht, fügst du mit einem Namen und einer Such-URL hinzu. Markiere deine Standardsuche mit dem Stern und entferne, was du nicht brauchst. Drück „/“ an beliebiger Stelle, um ins Suchfeld zu springen.

■ Schnelle Antworten in der Suchleiste
Die Antwort erscheint, bevor du suchst: Rechnungen (120*1.1), Prozente, Einheitenumrechnung (10 km to mi), Zahlenbasen, Würfel, Münzwurf, Zufallszahlen, Auswahl aus einer Liste, Tage bis zu einem Datum, das Datum in einigen Tagen, der Wochentag und die aktuelle Uhrzeit in Städten weltweit. Tipp „?“ ein, um Beispiele zu sehen.

■ Verknüpfungen, Schnellzugriffs-Dock und App-Schublade
Leg deine meistgenutzten Seiten als Kacheln ab und öffne sie mit einem Klick. Füge sie aus einem regionalen Seitenkatalog hinzu, übernimm sie aus deinen Chrome-Lesezeichen oder meistbesuchten Seiten oder zieh einfach einen Link hinein. Ein Dock bleibt am unteren (oder oberen) Bildschirmrand sichtbar, und die App-Schublade filtert deine Seiten nach Kategorie und durchsucht sie nach Namen.

■ Tastenkombinationen
Verknüpfe einen beliebigen Link mit einer Tastenkombination und öffne ihn ganz ohne Maus. Die eingebauten Kombinationen (zur Suche springen, Seite wechseln, Rückgängig/Wiederholen) sind in den Einstellungen aufgelistet.

■ Dein Tag auf einen Blick
Eine Zeile oben zeigt offene Aufgaben, heutige Termine und den nächsten Countdown.

■ Widgets
- Lesezeichen: deine Chrome-Lesezeichen Ordner für Ordner durchstöbern und nach Namen filtern
- Nachrichten / RSS: Nachrichten nach Thema oder Stichwort verfolgen, Feeds aus einem regionalen Katalog wählen oder beliebige RSS/Atom-Feeds hinzufügen
- Wetter: Stadt eingeben oder Standort ermitteln; Temperatur, gefühlte Temperatur, Wind, Luftfeuchtigkeit und Drei-Tage-Vorhersage
- Kalender: den iCal-Link (.ics) deines Kalenderdienstes einfügen und die Termine der nächsten Tage sehen – mit mehreren farbigen Kalendern sowie ganztägigen und wiederkehrenden Terminen
- Aufgaben: eine einfache Checkliste
- Schnellnotizen: automatisch gespeicherte Notizen, auf Seiten (Tabs) verteilt
- Fokus-Timer: Pomodoro-Zyklen aus 25 Minuten Fokus und Pausen
- Gewohnheiten: tägliche Gewohnheiten abhaken, Serie und die letzten sieben Tage im Blick
- Countdown: Tage bis zum Geburtstag, zur Reise, zur Prüfung oder zur Frist, auch jährlich wiederkehrend
- Schnellzugriff: meistbesuchte Seiten öffnen oder zuletzt geschlossene Tabs mit einem Klick wiederherstellen
- Uhr: digital, analog oder minimal, in jeder Zeitzone
- QR-Code: eine URL, Telefonnummer oder einen Text auf dem Gerät in einen QR-Code verwandeln
- Web-Einbettung: eine Webseite, die das Einbetten erlaubt, als Widget anzeigen

■ Rückgängig, Papierkorb und Sicherungen
Jedes Löschen und jede Layout-Änderung lässt sich sofort rückgängig machen (Strg+Z). Gelöschte Widgets und Seiten bleiben 30 Tage im Papierkorb, und vor einem Zurücksetzen oder Import wird automatisch das ganze Dashboard gesichert.

■ Einrichtung teilen und mitnehmen
Mach aus dem Layout der aktuellen Seite einen kurzen Freigabecode oder QR-Code für andere oder für einen anderen Rechner. Notizen, Aufgaben, Gewohnheitsverlauf, Kalenderlinks, Countdowns und dein Wetterstandort bleiben außen vor. Die gesamte Konfiguration lässt sich als JSON exportieren und importieren.

■ Optionale Einstellungssynchronisierung
Schalte sie ein, damit Aussehen, Dock und Tastenkombinationen in jedem Chrome mit deinem Konto gleich sind. Sie nutzt Chromes eigene Kontosynchronisierung, nie einen Server von uns. Sie ist standardmäßig aus, und Widgets, Notizen und andere Inhalte werden nie synchronisiert.

■ Dynamische Hintergründe und Glasoptik
Wähle aus kuratierten Sammlungen (Weltall, Natur, Minimal, Architektur, Abstrakt, Cyberpunk), Verläufen oder deinem eigenen Bild. Schieberegler steuern Unschärfe, Helligkeit und Abdunklung, und der Tageszeit-Modus wechselt den Hintergrund zwischen Morgen, Tag, Abend und Nacht. Auf hellen Hintergründen wird Text automatisch dunkel und bleibt lesbar.

■ Sieben Sprachen
Deutsch, Englisch, Japanisch, vereinfachtes Chinesisch, Spanisch, Französisch und Koreanisch.

■ Local-First
Dein Layout, deine Notizen und deine Einstellungen liegen in chrome.storage.local auf deinem Rechner. ZenithTab hat kein eigenes Backend, keine Analyse, keine Werbung und keine Tracker. Die einzigen ausgehenden Anfragen holen das Wetter und den Ortsnamen für den gewählten Ort, die eingerichteten Nachrichten, Feeds und Kalender (iCal) und die Hintergrundbilder und laden die Seiten, die du einbettest. Wenn du die optionale Synchronisierung einschaltest, laufen diese Daten über Chromes Kontosynchronisierung. Die Datenschutzerklärung führt das vollständig aus.

Open Source unter der MIT-Lizenz:
https://github.com/miyabiver39/ZenithTab
```

### フランス語版（Français）

```text
ZenithTab transforme la page « nouvel onglet » en un plan de travail que vous agencez vous-même.

Recherche, sites favoris, météo, actualités, événements du jour, tâches et notes : rassemblez sur un seul écran ce que vous consultez chaque jour, et tout vous attend à chaque nouvel onglet. Tout est enregistré sur votre propre ordinateur, et aucun compte n'est nécessaire.

■ Prêt en trois questions
À la première ouverture, choisissez votre langue et votre région, vos centres d'intérêt et l'usage de l'onglet. ZenithTab prépare alors les sites populaires de votre région, l'actualité de vos sujets et un ensemble de widgets adapté. Chaque question peut être passée, tout peut être modifié ensuite, et la configuration peut être relancée depuis les réglages (une sauvegarde est faite avant).

■ Une grille libre, sur autant de pages que vous voulez
Faites glisser les widgets où vous voulez et attrapez un coin pour les redimensionner ; la disposition tient sur un portable comme sur un moniteur externe. Répartissez les widgets sur des pages — vide, copie de la page actuelle ou modèle (Travail, Études, Actualités, Minimal) — et passez de l'une à l'autre d'un clic ou avec Ctrl+Alt+←/→.

■ Barre de recherche unifiée
Basculez d'un clic entre recherche web, recherche dans les dépôts de code, recherche vidéo, assistants IA et plus encore. Pour ajouter une destination, il suffit de la choisir dans le catalogue intégré, organisé en recherche web, assistants IA, vidéo, shopping, cartes et références, développeurs et réseaux sociaux, avec des choix régionaux pour chaque langue. Ce qui n'y figure pas peut être ajouté avec un nom et une URL de recherche. Marquez d'une étoile le moteur par défaut et retirez ceux que vous n'utilisez pas. Appuyez sur « / » n'importe où pour aller au champ de recherche.

■ Réponses instantanées dans la barre de recherche
La réponse s'affiche avant même de chercher : calculs (120*1.1), pourcentages, conversions d'unités (10 km to mi), bases numériques, dés, pile ou face, nombres aléatoires, choix dans une liste, jours restants avant une date, date dans quelques jours, jour de la semaine et heure actuelle dans les villes du monde. Tapez « ? » pour voir des exemples.

■ Raccourcis, Dock rapide et tiroir d'applications
Gardez vos sites les plus utilisés sous forme de tuiles et ouvrez-les d'un clic. Ajoutez-les depuis un catalogue de sites par région, importez-les de vos favoris Chrome ou des sites les plus visités, ou faites simplement glisser un lien. Un Dock reste visible en bas (ou en haut) de l'écran, et le tiroir d'applications filtre vos sites par catégorie et les recherche par nom.

■ Raccourcis clavier
Associez n'importe quel lien à une combinaison de touches et ouvrez-le sans toucher la souris. Les raccourcis intégrés (aller à la recherche, changer de page, annuler/rétablir) sont listés dans les réglages.

■ Votre journée en un coup d'œil
Une ligne en haut de l'écran affiche les tâches en cours, les événements du jour et le compte à rebours le plus proche.

■ Widgets
- Favoris : parcourez vos favoris Chrome dossier par dossier et filtrez-les par nom
- Actualités / RSS : suivez l'actualité par sujet ou mot-clé, choisissez des flux dans un catalogue par région ou ajoutez n'importe quel flux RSS/Atom
- Météo : saisissez une ville ou détectez votre position ; température, ressenti, vent, humidité et prévisions à trois jours
- Calendrier : collez le lien iCal (.ics) de votre service d'agenda pour voir les événements des prochains jours, avec plusieurs agendas en couleurs et les événements sur la journée ou récurrents
- Tâches : une liste à cocher toute simple
- Notes rapides : des notes enregistrées automatiquement, réparties en pages (onglets)
- Minuteur de concentration : des cycles Pomodoro de 25 minutes de concentration et de pauses
- Habitudes : cochez vos habitudes quotidiennes et suivez votre série et les sept derniers jours
- Compte à rebours : les jours restants avant un anniversaire, un voyage, un examen ou une échéance, avec répétition annuelle
- Accès rapide : ouvrez les sites les plus visités ou restaurez les onglets fermés récemment d'un clic
- Horloge : numérique, analogique ou minimaliste, dans n'importe quel fuseau horaire
- Code QR : transformez une URL, un numéro ou un texte en code QR généré sur votre appareil
- Page web intégrée : affichez comme widget une page web qui autorise l'intégration

■ Annulation, corbeille et sauvegardes
Chaque suppression et chaque changement de disposition peut être annulé aussitôt (Ctrl+Z). Les widgets et pages supprimés restent 30 jours dans la corbeille, et une sauvegarde de tout le tableau de bord est faite automatiquement avant une réinitialisation ou un import.

■ Partager et emporter votre configuration
Transformez la disposition de la page actuelle en un code de partage court ou un code QR à transmettre à quelqu'un ou à un autre ordinateur. Les notes, tâches, historiques d'habitudes, liens d'agenda, comptes à rebours et la position météo n'y figurent pas. La configuration complète s'exporte et s'importe en JSON.

■ Synchronisation facultative des réglages
Activez-la pour garder l'apparence, le Dock et les raccourcis clavier identiques sur chaque Chrome connecté à votre compte. Elle passe par la synchronisation de compte de Chrome, jamais par un serveur à nous. Elle est désactivée par défaut, et les widgets, notes et autres contenus ne sont jamais synchronisés.

■ Fonds dynamiques et effet verre dépoli
Choisissez parmi des collections sélectionnées (cosmos, nature, minimal, architecture, abstrait, cyberpunk), des dégradés ou votre propre image. Des curseurs règlent le flou, la luminosité et l'assombrissement, et le mode selon l'heure change le fond entre le matin, la journée, le coucher du soleil et la nuit. Sur un fond clair, le texte passe en couleur sombre pour rester lisible.

■ Sept langues
Français, anglais, japonais, chinois simplifié, espagnol, allemand et coréen.

■ Priorité au local
Votre disposition, vos notes et vos réglages résident dans chrome.storage.local, sur votre machine. ZenithTab n'a pas de serveur propre, pas d'analytique, pas de publicité, pas de traceurs. Ses seules requêtes sortantes récupèrent la météo du lieu choisi et son nom, les actualités, flux et calendriers (iCal) que vous avez configurés et les images de fond, et chargent les pages que vous intégrez. Si vous activez la synchronisation facultative, ces données passent par la synchronisation de compte de Chrome. La politique de confidentialité le détaille intégralement.

Open source sous licence MIT :
https://github.com/miyabiver39/ZenithTab
```

### 韓国語版（한국어）

```text
ZenithTab은 새 탭 페이지를 직접 꾸미는 작업 공간으로 바꿔줍니다.

검색, 자주 가는 사이트, 날씨, 뉴스, 오늘의 일정, 할 일, 메모. 매일 보는 것들을 한 화면에 모아두면 탭을 열 때마다 그대로 맞아줍니다. 모든 설정은 사용자의 컴퓨터 안에 저장되며, 계정을 만들 필요가 없습니다.

■ 질문 3개로 바로 시작
처음 열면 「언어와 지역」「관심 분야」「사용 목적」만 고르면 됩니다. 지역에 맞는 자주 쓰는 사이트, 관심 주제의 뉴스, 그에 맞는 위젯 구성이 준비됩니다. 모든 질문은 건너뛸 수 있고 나중에 전부 바꿀 수 있으며, 설정에서 언제든 다시 실행할 수 있습니다(실행 전에 자동으로 백업합니다).

■ 자유로운 그리드와 여러 페이지
위젯을 원하는 위치로 끌어다 놓고, 모서리를 잡아 크기를 조절하세요. 노트북 화면에서도 외장 모니터에서도 배치가 흐트러지지 않습니다. 위젯은 페이지로 나눠 관리할 수 있으며, 빈 페이지, 현재 페이지 복제, 템플릿(업무·학습·뉴스·미니멀)으로 추가할 수 있습니다. 페이지는 클릭하거나 Ctrl+Alt+←/→로 전환합니다.

■ 통합 검색창
웹 검색, 코드 저장소 검색, 동영상 검색, AI 어시스턴트 등의 검색 대상을 한 번의 클릭으로 전환합니다. 검색 대상은 「카탈로그에서 추가」에서 고르기만 하면 늘릴 수 있습니다. 카탈로그는 웹 검색·AI 어시스턴트·동영상·쇼핑·지도와 사전·개발자·SNS로 나뉘어 있으며, 지역별로 자주 쓰이는 검색 대상도 담고 있습니다. 카탈로그에 없는 검색 대상도 이름과 검색 URL만 입력하면 추가할 수 있습니다. 별표로 기본 검색 대상을 고르고, 사용하지 않는 것은 목록에서 뺄 수 있습니다. 페이지 어디서든 「/」 키를 누르면 검색창으로 이동합니다.

■ 검색창의 스마트 답변
검색하기 전에 그 자리에서 답이 표시됩니다. 계산(120*1.1), 백분율, 단위 변환(10 km to mi), 진수 변환, 주사위, 동전 던지기, 난수, 후보 중 고르기, 특정 날짜까지의 일수, ○일 후의 날짜, 요일, 세계 도시의 현재 시각을 지원합니다. 검색창에 「?」를 입력하면 입력 예시가 나옵니다.

■ 바로가기, 퀵 도크, 앱 서랍
자주 쓰는 사이트를 타일로 두고 한 번의 클릭으로 엽니다. 지역별 사이트 카탈로그에서 고르거나, Chrome 북마크나 「자주 방문한 사이트」에서 가져오거나, 링크를 끌어다 놓아 추가할 수 있습니다. 화면 하단(또는 상단)에는 항상 표시되는 퀵 도크를 둘 수 있고, 앱 서랍에서는 등록한 사이트를 카테고리로 좁히거나 이름으로 검색할 수 있습니다.

■ 키보드 단축키
원하는 링크에 키 조합을 지정해두면 마우스 없이 열 수 있습니다. 기본 제공 단축키(검색창으로 이동, 페이지 전환, 실행 취소/다시 실행)는 설정 화면에서 한눈에 볼 수 있습니다.

■ 오늘 한눈에 보기
화면 위쪽 한 줄에 남은 할 일, 오늘의 일정, 가장 가까운 카운트다운을 표시합니다.

■ 위젯
・북마크: Chrome 북마크를 폴더별로 살펴보고 이름으로 걸러냅니다
・뉴스 / RSS: 주제나 키워드로 뉴스를 구독하고, 지역별 피드 카탈로그에서 고르거나 원하는 RSS/Atom 피드를 추가합니다
・날씨: 도시 이름 입력 또는 「현재 위치 감지」로 설정. 기온, 체감온도, 풍속, 습도와 3일 예보
・캘린더: 사용 중인 캘린더 서비스의 iCal(.ics) 링크로 오늘부터 며칠간의 일정을 표시. 여러 캘린더 색 구분, 종일·반복 일정 지원
・할 일 관리: 체크박스 방식의 할 일 목록
・빠른 메모: 자동 저장되는 메모. 페이지(탭)로 나눠 쓸 수 있습니다
・집중 타이머: 25분 집중과 휴식을 반복하는 뽀모도로 타이머
・습관 트래커: 매일의 습관을 체크하고 연속 일수와 최근 7일 달성 현황을 표시
・카운트다운: 생일, 여행, 시험, 마감까지 남은 날짜. 매년 반복되는 기념일도 지원
・빠른 액세스: 「자주 방문한 사이트」와 「최근 닫은 탭」을 한 번의 클릭으로 열기/복원
・시계: 디지털·아날로그·미니멀 3가지 스타일, 시간대 지정 가능
・QR 코드: URL, 전화번호, 텍스트를 기기 안에서 QR 코드로 변환
・웹 임베드: 임베드를 허용하는 웹 페이지를 위젯으로 표시

■ 실행 취소, 휴지통, 백업
모든 삭제와 배치 변경은 직후에 실행 취소(Ctrl+Z)할 수 있습니다. 삭제한 위젯과 페이지는 30일 동안 휴지통에 남고, 초기화나 가져오기 전에는 대시보드 전체 백업이 자동으로 저장됩니다.

■ 구성 공유와 이동
현재 페이지의 구성을 짧은 「공유 코드」나 QR 코드로 만들어 다른 사람이나 다른 컴퓨터에 전달할 수 있습니다. 메모, 할 일, 습관 기록, 캘린더 링크, 카운트다운, 날씨 위치는 포함되지 않습니다. 전체 설정은 JSON으로 내보내고 불러올 수 있습니다.

■ 설정 동기화(선택)
켜면 외관, 도크, 키보드 단축키를 같은 계정으로 로그인한 Chrome 사이에서 똑같이 맞춥니다. Chrome 자체의 계정 동기화를 사용하므로 개발자의 서버를 거치지 않습니다. 기본값은 꺼져 있으며, 위젯과 메모 등의 내용은 동기화되지 않습니다.

■ 다이내믹 배경화면과 유리 질감
우주, 자연, 미니멀, 건축, 추상, 사이버펑크 컬렉션, 그러데이션, 직접 올린 이미지 중에서 고를 수 있습니다. 슬라이더로 흐림, 밝기, 어둡기를 조절하고, 시간대 모드를 켜면 아침·낮·저녁·밤에 맞춰 배경화면이 자동으로 바뀝니다. 밝은 배경화면 위에서는 글자가 자동으로 어두운 색이 되어 읽기 쉽게 유지됩니다.

■ 7개 언어
한국어, 영어, 일본어, 중국어 간체, 스페인어, 프랑스어, 독일어를 지원합니다.

■ 로컬 우선
배치, 메모, 설정은 사용자 기기의 chrome.storage.local에 저장됩니다. ZenithTab은 자체 서버가 없고 분석 도구도, 광고도, 트래커도 없습니다. 외부 통신은 선택한 지점의 날씨와 지명 가져오기, 설정한 뉴스·RSS·캘린더(iCal) 가져오기, 배경 이미지 불러오기, 웹 임베드로 지정한 페이지 표시로 한정됩니다. 선택 사항인 설정 동기화를 켜면 그 내용은 Chrome의 계정 동기화를 거칩니다. 자세한 내용은 개인정보처리방침을 참고하세요.

MIT 라이선스 오픈소스:
https://github.com/miyabiver39/ZenithTab
```

### 中国語簡体字版（简体中文）

```text
ZenithTab 把新标签页变成一块由你自己布置的工作台。

搜索、常用网站、天气、新闻、今天的日程、待办和便签——把每天要看的东西放在同一个屏幕上，每次打开标签页它们都在那里等你。所有设置都保存在你自己的电脑里，无需注册账号。

■ 回答 3 个问题即可开始
第一次打开时，只需选择「语言和地区」「感兴趣的领域」「用途」，就会为你准备好本地区的常用网站、相关主题的新闻和合适的组件布局。每个问题都可以跳过，之后也都能修改，还可以在设置中随时重新运行（运行前会自动备份）。

■ 自由的网格与多个页面
把组件拖到任意位置，抓住四角即可调整大小，无论是笔记本屏幕还是外接显示器，布局都不会错乱。组件可以分到多个页面中管理，可以新建空白页、复制当前页，或从模板（工作、学习、新闻、极简）添加。点击或按 Ctrl+Alt+←/→ 即可切换页面。

■ 聚合搜索栏
一次点击即可在网页搜索、代码仓库搜索、视频搜索、AI 助手等搜索目标之间切换。只需在「从目录添加」中挑选，就能添加新的搜索目标。目录分为网页搜索、AI 助手、视频、购物、地图与词典、开发者、社交等类别，并收录了各地区常用的搜索目标。目录中没有的，也可以填写名称和搜索 URL 自行添加。用星标选择默认搜索引擎，不用的可以从列表中移除。在页面任意位置按下「/」键即可跳到搜索框。

■ 搜索栏的智能回答
在搜索之前就能直接看到答案：计算（120*1.1）、百分比、单位换算（10 km to mi）、进制转换、掷骰子、抛硬币、随机数、从候选中选一个、距某日还有几天、几天后的日期、星期几，以及世界各城市的当前时间。在搜索框输入「?」即可查看示例。

■ 快捷方式、快捷坞与应用抽屉
把常用网站放成磁贴，一次点击即可打开。可以从各地区的网站目录中挑选，从 Chrome 书签或「常访问网站」导入，也可以直接把链接拖进来。屏幕底部（或顶部）可以放一个始终显示的快捷坞，应用抽屉则可按分类筛选、按名称搜索已添加的网站。

■ 键盘快捷键
为任意链接绑定按键组合，无需鼠标即可打开。内置快捷键（跳到搜索框、切换页面、撤销/重做）可在设置中查看。

■ 今天一览
屏幕顶部用一行显示未完成的待办、今天的日程和最近的倒计时。

■ 组件
・书签：按文件夹浏览 Chrome 书签，并按名称筛选
・新闻 / RSS：按主题或关键词订阅新闻，可从各地区的订阅源目录中挑选，也可添加任意 RSS/Atom 订阅源
・天气：输入城市名或「检测当前位置」来设置；显示气温、体感温度、风速、湿度和三天预报
・日历：粘贴你所用日历服务的 iCal（.ics）链接，显示近几天的日程；支持多个日历分色显示、全天和重复日程
・待办事项：带复选框的待办清单
・快速便签：自动保存的便签，可按页面（标签页）分开记录
・专注计时器：25 分钟专注与休息循环的番茄钟
・习惯打卡：每天勾选习惯，查看连续天数和最近七天的完成情况
・倒计时：距离生日、旅行、考试或截止日期还有几天，支持每年重复的纪念日
・快速访问：一键打开「常访问网站」或恢复「最近关闭的标签页」
・时钟：数字、模拟、极简三种样式，可指定时区
・二维码：在本机把网址、电话号码或文本转换为二维码
・网页嵌入：把允许嵌入的网页作为组件显示

■ 撤销、回收站与备份
所有删除和布局更改都可以立即撤销（Ctrl+Z）。删除的组件和页面会在回收站保留 30 天，重置或导入前会自动备份整个仪表盘。

■ 分享与迁移布局
可以把当前页面的布局变成简短的「分享码」或二维码，交给别人或另一台电脑。便签、待办、习惯记录、日历链接、倒计时和天气位置都不包含在内。全部设置可导出和导入为 JSON。

■ 设置同步（可选）
开启后，外观、快捷坞和键盘快捷键会在登录同一账号的 Chrome 之间保持一致。它使用 Chrome 自身的账号同步，不经过开发者的服务器。默认关闭，组件和便签等内容不会同步。

■ 动态壁纸与毛玻璃质感
可从精选图集（宇宙、自然、极简、建筑、抽象、赛博朋克）、渐变或自己上传的图片中选择。滑块可调节模糊、亮度和暗度，开启按时段切换后，壁纸会随早晨、白天、傍晚、夜晚自动变化。在浅色壁纸上，文字会自动变为深色，保持清晰可读。

■ 支持七种语言
简体中文、英语、日语、西班牙语、法语、德语、韩语。

■ 本地优先
布局、便签和设置保存在你设备上的 chrome.storage.local 中。ZenithTab 没有自己的服务器，没有统计分析，没有广告，没有跟踪器。对外通信仅限于获取所选地点的天气和地名、获取你设置的新闻、RSS 与日历（iCal）、加载壁纸图片，以及显示你在网页嵌入中指定的页面。开启可选的设置同步时，这部分内容会通过 Chrome 的账号同步传输。详情请参阅隐私权政策。

基于 MIT 许可证开源：
https://github.com/miyabiver39/ZenithTab
```

---

## 3. 単一用途の説明（Single Purpose Description）

デベロッパーダッシュボードには日本語版を貼り付けます（英語版は参考）。

### 日本語版

```text
ZenithTab の唯一の目的は、Chrome の「新しいタブ」ページを、ユーザー自身が配置したダッシュボードに置き換えることです。ウィジェット（時計・天気・ブックマーク・ニュース・タスク・メモ・カレンダーなど）、ショートカット、検索バー、壁紙といったすべての機能は、その 1 ページを表示するためだけに存在します。この拡張機能は、ユーザーが閲覧する Web サイトにスクリプトを挿入したり、表示中のページを改変したりすることはなく、自身の新しいタブページの外では一切動作しません。
```

### 英語版（参考）

```text
ZenithTab replaces Chrome's new tab page with a single, user-arranged dashboard. Every feature — widgets, bookmarks, feeds, weather, shortcuts, wallpapers — exists to render that one page. The extension does not inject scripts into websites, modify pages you visit, or run anywhere outside its own new tab page.
```

---

## 4. 権限の正当化理由（Permission Justifications）

ダッシュボードの各権限欄に、以下をそのまま貼り付けます。

### `storage が必要な理由`
```text
ユーザーが設定したウィジェットの配置レイアウト、外観テーマ、壁紙設定、メモとToDoリスト、登録したショートカット情報、およびRSSと天気のキャッシュを、ブラウザ内（chrome.storage.local）に保存・永続化するため。また、ユーザーが「設定の同期」をオンにした場合（既定はオフ）に限り、外観設定・ドック・キーボードショートカットだけを chrome.storage.sync（Chrome 自身のアカウント同期）に保存し、同じアカウントの Chrome 間で揃えます。ウィジェット・メモ・タスクなどの内容は同期しません。開発者のサーバーへは一切送信しません。
```

### `bookmarks が必要な理由`
```text
ブックマークウィジェットにおいて、ユーザーのChromeブックマークおよびフォルダ階層を読み込み、新しいタブ画面から直接閲覧・検索・アクセスできるようにするため。ブックマークはローカルで描画するのみで、送信も変更も行いません。
```

### `alarms が必要な理由`
```text
ユーザーが登録したRSSフィードおよびニュース記事を、指定された更新間隔（例: 30分ごと）でバックグラウンドから定期的に同期・更新するため。新しいタブを開いた時点で最新の記事が表示されるようにします。
```

### `favicon が必要な理由`
```text
ブックマークウィジェットおよびアプリドロワー/ショートカットにおいて、各Webサイトのファビコン（アイコン画像）を表示して視認性を高めるため。取得元はChrome自身のローカルファビコンキャッシュのみです。第三者のファビコンサービスを使わないことで、ユーザーのブックマークのアドレスが外部サーバーへ送信されるのを防いでいます。
```

### `geolocation が必要な理由`
```text
天気ウィジェットの「現在地を検出」ボタンをユーザーがクリックしたときにのみ座標を1回取得します。用途はその地点の天気予報の取得と、ウィジェットに表示する地名への変換の2点のみです。バックグラウンドや起動時に取得することはなく、代わりに都市名を手入力して設定することもできます。取得した座標は端末内にのみ保存し、第三者へ販売・移転しません。
```

### `unlimitedStorage が必要な理由`
```text
ユーザーがアップロードした壁紙画像（数MBになることがあります）と、RSS・ニュース・天気のキャッシュを chrome.storage.local に保存する際、既定の 10MB 上限に達して保存が黙って失敗し、レイアウトや設定が消えるのを防ぐため。保存先はユーザー自身のブラウザプロファイル内のみで、この権限によって新たに読み取れるデータはなく、外部への送信も行いません。
```

### `topSites が必要な理由`
```text
optional_permissions として宣言し、ユーザーが「クイックアクセス」ウィジェットを追加した時点で chrome.permissions.request() により初めて要求します。用途は、Chrome が既に「よく訪れるサイト」として保持している一覧（既定 8 件）をウィジェットにワンクリックのショートカットとして表示することのみです。取得した一覧は表示のたびに読み取るだけで、保存も外部送信もしません。ウィジェットを使わないユーザーには要求されません。
```

### `tabs が必要な理由`
```text
optional_permissions として宣言し、`sessions` と併せて、ユーザーが「クイックアクセス」ウィジェットで「最近閉じたタブ」を表示しようとした時点で chrome.permissions.request() により初めて要求します。Chrome は `tabs` 権限が無いと chrome.sessions.getRecentlyClosed() の結果からタブの URL とタイトルを省略するため、閉じたタブを一覧に表示するのに必要です。用途はその一覧の表示のみで、開いているタブの列挙・監視、閲覧履歴の保存、外部への送信は行いません。「よく見るサイト」だけを使うユーザーには要求されません。
```

### `sessions が必要な理由`
```text
optional_permissions として宣言し、ユーザーが「クイックアクセス」ウィジェットを追加した時点で chrome.permissions.request() により初めて要求します。用途は、最近閉じたタブの一覧を新しいタブ画面に表示し、クリックで chrome.sessions.restore() により復元できるようにすることの 2 点のみです。一覧は表示のたびに読み取るだけで、閲覧履歴として保存したり外部へ送信したりすることはありません。ウィジェットを使わないユーザーには要求されません。
```

### `ホスト権限が必要な理由`

任意のRSSフィードを **host_permissions の理由として書かないこと。**
それらは `optional_host_permissions` 側で都度要求する設計であり、
常時アクセスを要求していると誤解されると審査が長引きます。

```text
天気ウィジェットの気象データ取得（api.open-meteo.com）、都市名検索（geocoding-api.open-meteo.com）、「現在地を検出」時に座標を地名へ変換する処理（nominatim.openstreetmap.org）、ニュースウィジェットのキーワード記事取得（news.google.com）、内蔵壁紙画像の読み込み（images.unsplash.com）のために必要です。

ユーザーが独自に追加するRSS/Atomフィードは host_permissions には含めていません。optional_host_permissions として宣言し、ユーザーがフィードを追加した時点で chrome.permissions.request() により該当オリジン1件のみを都度要求します。ユーザーが許可したフィード以外へは一切アクセスしません。
```

---

## 5. データ利用に関する申告（Data Usage Disclosures）

デベロッパーダッシュボードの「プライバシーへの取り組み」で選択する内容です。

| 項目 | 回答 |
| --- | --- |
| 個人を特定できる情報 | 収集しない |
| 健康情報 | 収集しない |
| 財務情報 | 収集しない |
| 認証情報 | 収集しない |
| 個人の通信内容 | 収集しない |
| **位置情報** | **収集する（端末内のみ）** — 天気の表示のためにユーザーが明示的に要求した場合に限り座標を取得し、端末内に保存する。第三者へ販売・移転しない |
| ウェブ閲覧履歴 | 収集しない — クイックアクセスの「最近閉じたタブ」は任意権限で一覧を端末内に表示するだけで、保存・集計・送信は行わない |
| ユーザーのアクティビティ | 収集しない |
| ウェブサイトのコンテンツ | 収集しない |

3つの確認事項には、いずれも「はい（遵守する）」を選択します。

- 取り扱うユーザーデータを、承認された用途以外に使用または譲渡していない
- ユーザーデータを、その主要な用途と無関係な第三者に販売していない
- ユーザーデータを、信用力の判断や融資目的で使用または譲渡していない

---

## 6. 再申請前チェックリスト

- [ ] `npm run build && npm run verify` が成功する
- [ ] 掲載文にブランド名の羅列がない
- [ ] 掲載文に書いた機能がすべて実装されている
- [ ] プライバシーポリシーURLが公開状態で開ける
- [ ] `geolocation` `unlimitedStorage` と任意権限 `topSites` `sessions` `tabs` を含む全権限の正当化理由を入力した
- [ ] スクリーンショットが現在のUIと一致している
- [ ] `manifest.json` と `package.json` のバージョンが一致している
