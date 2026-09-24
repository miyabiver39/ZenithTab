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

### 日本語版

```text
ZenithTab は、新しいタブを「自分専用の作業台」に変えるダッシュボードです。

ドラッグ＆ドロップで置いたウィジェットと選んだ壁紙が、タブを開くたびにそのまま迎えてくれます。設定はすべてお使いのパソコンの中に保存され、アカウント登録は必要ありません。

■ 自由なグリッド配置
ウィジェットは好きな位置へドラッグでき、四隅をつかんでサイズも変更できます。画面幅に応じたブレークポイントを備えているため、ノートPCでも外部ディスプレイでも配置が崩れません。

■ 複数ページのワークスペース
ウィジェットとレイアウトをページ単位で分けて管理できます。用途別にページを追加し、タブをクリックするだけで切り替え、ダブルクリックで名前を変更できます。既存の配置はそのまま最初のページとして引き継がれます。

■ ショートカットとアプリドロワー
よく使うサイトをタイルとして登録し、ワンクリックで開けます。アプリドロワーでは登録済みのサイトをカテゴリ（AI・開発・メディア・仕事効率化など）で絞り込み、名前で検索して素早く目的の項目にたどり着けます。

■ クイックドック
画面下部（または上部）に常時表示される最小限のショートカットバーです。表示するリンクは自由に追加・削除・並べ替えでき、アイコンは用意されたセットまたは絵文字から選べます。

■ 統合検索バー
主要なWeb検索、コードリポジトリ検索、動画検索、AIアシスタントなどの検索先をワンクリックで切り替えられます。検索先は「カタログから追加」で一覧から選ぶだけで増やせます。カタログはWeb検索・AIアシスタント・動画・ショッピング・地図と辞書・開発者向け・SNSに分かれ、地域ごとによく使われる検索先も収録しています。カタログにない検索先も、名前と検索用URLを入力すれば追加できます。既定の検索先は★で選び、使わない検索先は一覧から取り除けます（標準搭載の検索先もカタログからいつでも戻せます）。キーボードの「/」キーを押すと、どこにいても検索欄にカーソルが移動します。計算式（120*1.1）、パーセント、単位換算（10 km to mi）、進数変換、サイコロ、コイントス、乱数、候補からの選択、指定日までの日数などは、検索する前にその場で答えが表示されます。

■ キーボードショートカット
好きなリンクにキーの組み合わせを割り当てておけば、キーボードだけで瞬時に開けます。組み込みのショートカット（検索欄へ移動、ページ切り替え、元に戻す／やり直す）は設定画面で一覧できます。

■ ブックマークエクスプローラー
Chrome に保存済みのブックマークをそのまま表示します。フォルダの階層をたどり、パンくずで戻り、名前で絞り込めます。アイコンは Chrome 内部のキャッシュから取得するため、外部のアイコンサービスにアドレスが送信されることはありません。

■ RSS / ニュースフィード
キーワードを入力するだけでニュースの一覧を購読できます。お好みのRSS/Atomフィードを追加することもでき、その際は対象サイトへのアクセス許可を Chrome がその都度確認します（許可した配信元にしかアクセスしません）。取得結果はバックグラウンドで更新されるので、タブを開いた瞬間に記事が並びます。

■ 天気
都市名を入力するか、「現在地を検出」をクリックして現在地から設定できます。気温・体感温度・風速・湿度に加えて、今日から3日先までの予報を表示します。位置情報を読み取るのはボタンを押したときだけで、バックグラウンドで取得することはありません。

■ ポモドーロタイマーとToDo
25分の集中と休憩のサイクルを管理するタイマーと、チェックボックス式のToDoリストを備えています。

■ 複数ページのメモ
自動保存されるメモ欄はページ（タブ）で分けられるので、用途ごとに書き分けて管理できます。

■ QRコード生成
URL・電話番号・任意のテキストをその場でQRコードに変換できます。生成はすべて端末内で完結し、画像として保存したり、変換前の文字列をコピーしたりできます。

■ クイックアクセス
Chrome が把握している「よく見るサイト」と「最近閉じたタブ」を新しいタブに表示し、ワンクリックで開いたり、閉じたタブをその場で復元したりできます。必要な権限はこのウィジェットを追加したときにだけ求められ、一覧は表示のたびに読み取るだけで、保存も外部送信もしません。

■ カウントダウン
誕生日・旅行・試験・締切など、名前と日付を入れるだけで「あと何日」を表示します。毎年繰り返す記念日にも対応します。

■ 習慣トラッカー
「水を飲む」「運動する」のような日課を毎日チェックし、連続日数と直近 7 日の達成状況を表示します。

■ カレンダー
お使いのカレンダーサービスが発行する iCal（.ics）リンクを貼ると、今日から数日先までの予定を日付ごとに一覧します。複数のカレンダーを色分けでき、終日・繰り返しの予定にも対応します。リンク先へのアクセスは RSS と同様、追加した時点で Chrome がその都度確認します。

■ 誤操作からの復元
削除や配置の変更はすべて直後に「元に戻す」（Ctrl+Z）で取り消せます。削除したウィジェットとページは 30 日間ごみ箱に残り、リセットやインポートの前にはダッシュボード全体のバックアップが自動で保存されます。

■ ダイナミック壁紙とグラスモフィズム
宇宙・自然・ミニマル・建築・抽象・サイバーパンクの各コレクション、グラデーションプリセット、手持ちの画像アップロードから選べます。すりガラスのぼかし量、明るさ、暗色オーバーレイの濃さはスライダーで調整できます。「時間帯で変える」をオンにすると、朝・昼・夕方・夜で壁紙と雰囲気が自動的に切り替わります。明るい壁紙では、壁紙の上に直接置かれた文字が自動で暗い色に変わり、読みやすさを保ちます。

■ 多言語対応
日本語、英語、中国語（簡体字）、スペイン語、フランス語、ドイツ語、韓国語のインターフェースに対応しています。

■ ローカルファースト
レイアウト、メモ、設定はすべてお使いのパソコンの chrome.storage.local に保存されます。ZenithTab には独自のサーバーがなく、アクセス解析も広告もトラッカーもありません。外部への通信は、天気の取得（選択した地点の座標）、ニュースとRSSの取得、ユーザーが追加したカレンダー（iCal）の取得、壁紙画像の読み込みに限られます。詳細はプライバシーポリシーをご覧ください。

設定はJSONとして書き出し・読み込みができるので、別のパソコンへ持ち運ぶこともバックアップすることもできます。

オープンソース（MITライセンス）です:
https://github.com/miyabiver39/ZenithTab
```

### 英語版

```text
ZenithTab turns the new tab page into a workspace you actually arrange yourself.

The widgets you place and the wallpaper you choose are waiting every time you open a tab. Everything is stored on your own computer, and there is no account to create.

■ A grid you arrange
Drag widgets anywhere and grab a corner to resize them. Responsive breakpoints keep your layout intact whether you are on a laptop screen or an external display.

■ Multiple pages
Split your widgets and layout across separate pages. Add a page for each purpose, switch with a click, rename with a double-click. Your existing layout carries over as the first page automatically.

■ Shortcuts and an app drawer
Pin the sites you use most as tiles and open them in one click. The app drawer filters your saved sites by category (AI, development, media, productivity and more) and searches them by name.

■ Quick Dock
A minimal shortcut bar that stays visible at the bottom (or top) of the screen. Add, remove, and reorder its links freely, and pick an icon from a curated set or type your own emoji.

■ Unified search bar
Switch in one click between web search, code repository search, video search, AI assistants and more. Adding a destination is as simple as picking it from the built-in catalog, organised into web search, AI assistants, video, shopping, maps and reference, developer tools and social, with regional options for every language. Anything not in the catalog can still be added with a name and a search URL. Star the one you want as the default and remove any you don't use — built-in engines come back from the catalog anytime. Press "/" anywhere on the page to jump straight into the search field. Type a calculation (120*1.1), a percentage, a unit conversion (10 km to mi), a number base, a dice roll, a coin flip, a random number, a list to pick from, or a date, and the answer appears inline before you search.

■ Keyboard shortcuts
Bind any link to a key combo and open it instantly without touching the mouse. The built-in shortcuts (jump to search, switch pages, undo/redo) are listed in the settings.

■ Bookmark explorer
Browse the bookmarks already in Chrome. Walk into folders, step back through breadcrumbs, and filter by name. Site icons come from Chrome's own local cache, so the addresses of your bookmarks never reach an outside icon service.

■ RSS and news feeds
Type a keyword to follow a news topic, or add your own RSS/Atom feed. When you add one, Chrome asks your permission for that specific site — ZenithTab only ever reaches the feeds you approve. Articles refresh in the background so the list is already populated when the tab opens.

■ Weather
Set a city by name, or click "Detect current location". You get temperature, feels-like, wind speed, humidity, and the forecast for today plus the next three days. Location is read only when you press the button, never in the background.

■ Pomodoro timer and to-do list
A 25-minute focus and break cycle, plus a checkbox list for the day's tasks.

■ Notes with multiple pages
The auto-saving notes widget now holds several pages (tabs), so you can keep different notes for different things.

■ QR code generator
Turn a URL, phone number, or any text into a scannable QR code on the spot. Everything is generated locally — download it as an image or copy the source text.

■ Quick Access
See the sites Chrome already ranks as most visited and the tabs you closed recently, open them in one click, or restore a closed tab right where it was. The permissions involved are requested only when you add this widget; the lists are read each time they are shown and are never stored or sent anywhere.

■ Countdown
Give it a name and a date and it shows how many days are left until a birthday, a trip, an exam or a deadline. Yearly anniversaries repeat automatically.

■ Habit tracker
Tick off daily habits such as "drink water" or "exercise" and watch the streak and the last seven days at a glance.

■ Calendar
Paste the iCal (.ics) link your calendar service provides and the widget lists the coming days' events grouped by day. Several calendars can be shown side by side in different colours, with all-day and recurring events supported. As with feeds, Chrome asks for permission for that specific address when you add it.

■ Undo, trash and backups
Every delete and layout change can be undone right away (Ctrl+Z). Deleted widgets and pages stay in a trash for 30 days, and a backup of the whole dashboard is taken automatically before a reset or an import.

■ Dynamic wallpapers and glassmorphism
Choose from curated collections (cosmos, nature, minimal, architecture, abstract, cyberpunk), gradient presets, or upload your own image. Sliders control backdrop blur, brightness, and the darkening overlay. Turn on the time-of-day mode and the wallpaper and mood shift automatically through morning, day, sunset and night. On a light wallpaper, text placed directly on it switches to a dark colour so it stays readable.

■ Available in seven languages
English, Japanese, Simplified Chinese, Spanish, French, German, and Korean.

■ Local-first
Your layout, notes, and settings live in chrome.storage.local on your machine. ZenithTab has no backend of its own, no analytics, no ads, and no trackers. Its only outbound requests are fetching weather for the location you chose, fetching the news, feeds and calendars (iCal) you configured, and loading wallpaper images. The privacy policy spells this out in full.

Export your setup as JSON to back it up or move it to another computer.

Open source under the MIT license:
https://github.com/miyabiver39/ZenithTab
```

### スペイン語版（Español）

```text
ZenithTab convierte la página de nueva pestaña en un espacio de trabajo que organizas tú mismo.

Los widgets que colocas y el fondo que eliges te esperan cada vez que abres una pestaña. Todo se guarda en tu propio ordenador y no hace falta crear ninguna cuenta.

■ Una cuadrícula que organizas tú
Arrastra los widgets a donde quieras y ajusta su tamaño desde las esquinas. Los puntos de ruptura adaptables mantienen intacta tu disposición tanto en la pantalla de un portátil como en un monitor externo.

■ Varias páginas
Reparte tus widgets y tu disposición en páginas independientes. Añade una página para cada propósito, cambia entre ellas con un clic y cambia el nombre con doble clic. Tu disposición actual pasa a ser automáticamente la primera página.

■ Accesos directos y cajón de aplicaciones
Fija como mosaicos los sitios que más usas y ábrelos con un clic. El cajón de aplicaciones filtra tus sitios guardados por categoría (IA, desarrollo, medios, productividad y más) y los busca por nombre.

■ Dock rápido
Una barra de accesos mínima que permanece visible en la parte inferior (o superior) de la pantalla. Añade, elimina y reordena sus enlaces libremente, y elige un icono de un conjunto seleccionado o escribe tu propio emoji.

■ Barra de búsqueda unificada
Cambia con un clic entre búsqueda web, búsqueda en repositorios de código, búsqueda de vídeos, asistentes de IA y más. Para añadir un destino basta con elegirlo del catálogo integrado, organizado en búsqueda web, asistentes de IA, vídeo, compras, mapas y consulta, desarrolladores y redes sociales, con opciones regionales para cada idioma. Lo que no esté en el catálogo se puede añadir igualmente con un nombre y una URL de búsqueda. Marca con la estrella el que quieras usar por defecto y quita los que no uses: los integrados se recuperan desde el catálogo cuando quieras. Pulsa «/» en cualquier momento para saltar directamente al campo de búsqueda. Escribe un cálculo (120*1.1), un porcentaje, una conversión de unidades (10 km to mi), un cambio de base numérica, una tirada de dados, cara o cruz, un número aleatorio, una lista entre la que elegir o una fecha, y la respuesta aparece al instante antes de buscar.

■ Atajos de teclado
Asigna cualquier enlace a una combinación de teclas y ábrelo al instante sin tocar el ratón. Los atajos integrados (ir a la búsqueda, cambiar de página, deshacer/rehacer) se listan en los ajustes.

■ Explorador de marcadores
Navega por los marcadores que ya tienes en Chrome. Entra en las carpetas, retrocede con las migas de pan y filtra por nombre. Los iconos de los sitios provienen de la caché local del propio Chrome, así que las direcciones de tus marcadores nunca llegan a un servicio de iconos externo.

■ RSS y noticias
Escribe una palabra clave para seguir un tema de actualidad, o añade tu propio feed RSS/Atom. Cuando añades uno, Chrome te pide permiso para ese sitio concreto: ZenithTab solo accede a los feeds que tú apruebas. Los artículos se actualizan en segundo plano, de modo que la lista ya está lista cuando abres la pestaña.

■ El tiempo
Elige una ciudad por su nombre o pulsa «Detectar ubicación actual». Verás temperatura, sensación térmica, velocidad del viento, humedad y la previsión de hoy y de los tres días siguientes. La ubicación solo se consulta cuando pulsas el botón, nunca en segundo plano.

■ Temporizador Pomodoro y lista de tareas
Un ciclo de concentración y descanso de 25 minutos, junto con una lista de tareas con casillas de verificación.

■ Notas con varias páginas
El widget de notas autoguardadas ahora admite varias páginas (pestañas), para que puedas llevar notas distintas para cosas distintas.

■ Generador de códigos QR
Convierte al instante una URL, un número de teléfono o cualquier texto en un código QR escaneable. Todo se genera localmente: descárgalo como imagen o copia el texto de origen.

■ Acceso rápido
Muestra los sitios que Chrome ya considera más visitados y las pestañas que cerraste hace poco; ábrelos con un clic o restaura una pestaña cerrada justo donde estaba. Los permisos necesarios se piden solo al añadir este widget; las listas se leen cada vez que se muestran y nunca se guardan ni se envían.

■ Cuenta atrás
Ponle un nombre y una fecha y verás cuántos días faltan para un cumpleaños, un viaje, un examen o una fecha límite. Los aniversarios anuales se repiten solos.

■ Hábitos
Marca hábitos diarios como «beber agua» o «hacer ejercicio» y sigue la racha y los últimos siete días de un vistazo.

■ Calendario
Pega el enlace iCal (.ics) que ofrece tu servicio de calendario y el widget lista los eventos de los próximos días agrupados por día. Puedes mostrar varios calendarios con colores distintos, con eventos de todo el día y repetitivos. Igual que con los feeds, Chrome te pide permiso para esa dirección concreta al añadirla.

■ Deshacer, papelera y copias de seguridad
Cada borrado y cada cambio de disposición se puede deshacer al momento (Ctrl+Z). Los widgets y páginas borrados permanecen 30 días en una papelera, y antes de un reinicio o una importación se guarda automáticamente una copia de todo el panel.

■ Fondos dinámicos y glassmorphism
Elige entre colecciones seleccionadas (cosmos, naturaleza, minimalismo, arquitectura, abstracto, cyberpunk), degradados predefinidos o sube tu propia imagen. Los controles deslizantes ajustan el desenfoque del fondo, el brillo y la capa de oscurecimiento. Activa el modo según la hora del día y el fondo y el ambiente cambian solos por la mañana, el día, el atardecer y la noche. Sobre un fondo claro, el texto colocado directamente encima pasa a un color oscuro para seguir siendo legible.

■ Disponible en siete idiomas
Español, inglés, japonés, chino simplificado, francés, alemán y coreano.

■ Prioridad a lo local
Tu disposición, tus notas y tus ajustes viven en chrome.storage.local, en tu máquina. ZenithTab no tiene servidor propio, ni analíticas, ni anuncios, ni rastreadores. Sus únicas conexiones salientes son obtener el tiempo de la ubicación que elegiste, obtener las noticias, los feeds y los calendarios (iCal) que configuraste, y cargar las imágenes de fondo. La política de privacidad lo detalla por completo.

Exporta tu configuración en JSON para hacer una copia de seguridad o llevarla a otro ordenador.

Código abierto con licencia MIT:
https://github.com/miyabiver39/ZenithTab
```

### ドイツ語版（Deutsch）

```text
ZenithTab macht aus dem Neuer-Tab-Bildschirm eine Arbeitsfläche, die du selbst einrichtest.

Die Widgets, die du platzierst, und das Hintergrundbild, das du wählst, erwarten dich bei jedem neuen Tab. Alles wird auf deinem eigenen Rechner gespeichert, und ein Konto brauchst du nicht.

■ Ein Raster, das du selbst anordnest
Zieh Widgets an eine beliebige Stelle und fass eine Ecke an, um die Größe zu ändern. Responsive Breakpoints halten dein Layout zusammen – auf dem Notebook-Bildschirm ebenso wie am externen Monitor.

■ Mehrere Seiten
Verteile deine Widgets und dein Layout auf eigene Seiten. Füge für jeden Zweck eine Seite hinzu, wechsle mit einem Klick und benenne sie per Doppelklick um. Dein bisheriges Layout wird automatisch zur ersten Seite.

■ Verknüpfungen und App-Schublade
Hefte die Seiten, die du am häufigsten brauchst, als Kacheln an und öffne sie mit einem Klick. Die App-Schublade filtert deine gespeicherten Seiten nach Kategorie (KI, Entwicklung, Medien, Produktivität und mehr) und durchsucht sie nach Namen.

■ Schnellzugriffs-Dock
Eine minimalistische Verknüpfungsleiste, die dauerhaft am unteren (oder oberen) Bildschirmrand sichtbar bleibt. Füge Links frei hinzu, entferne sie oder ordne sie neu an, und wähle ein Symbol aus einer kuratierten Auswahl oder gib ein eigenes Emoji ein.

■ Vereinheitlichte Suchleiste
Wechsle mit einem Klick zwischen Websuche, Suche in Code-Repositorys, Videosuche, KI-Assistenten und mehr. Neue Suchziele wählst du einfach aus dem eingebauten Katalog – gegliedert in Websuche, KI-Assistenten, Video, Shopping, Karten & Nachschlagen, Entwickler und Social Media, mit regionalen Angeboten für jede Sprache. Was nicht im Katalog steht, fügst du weiterhin mit einem Namen und einer Such-URL hinzu. Markiere deine Standardsuche mit dem Stern und entferne, was du nicht brauchst – voreingestellte Suchmaschinen holst du jederzeit aus dem Katalog zurück. Drück „/“ an beliebiger Stelle, um direkt ins Suchfeld zu springen. Tipp eine Rechnung (120*1.1), einen Prozentsatz, eine Einheitenumrechnung (10 km to mi), eine Zahlenbasis, einen Würfelwurf, einen Münzwurf, eine Zufallszahl, eine Auswahlliste oder ein Datum ein – die Antwort erscheint direkt, noch vor der Suche.

■ Tastenkombinationen
Verknüpfe einen beliebigen Link mit einer Tastenkombination und öffne ihn sofort, ganz ohne Maus. Die eingebauten Kombinationen (zur Suche springen, Seite wechseln, Rückgängig/Wiederholen) sind in den Einstellungen aufgelistet.

■ Lesezeichen-Explorer
Durchstöbere die Lesezeichen, die bereits in Chrome liegen. Geh in Ordner hinein, über den Brotkrumenpfad wieder zurück, und filtere nach Namen. Die Website-Symbole stammen aus Chromes eigenem lokalem Cache – die Adressen deiner Lesezeichen erreichen also nie einen externen Icon-Dienst.

■ RSS- und Nachrichten-Feeds
Gib ein Stichwort ein, um ein Nachrichtenthema zu verfolgen, oder füge deinen eigenen RSS/Atom-Feed hinzu. Fügst du einen hinzu, fragt Chrome dich um Erlaubnis für genau diese Seite – ZenithTab greift ausschließlich auf die Feeds zu, die du freigegeben hast. Artikel werden im Hintergrund aktualisiert, sodass die Liste beim Öffnen des Tabs bereits gefüllt ist.

■ Wetter
Leg eine Stadt über ihren Namen fest oder klick auf „Aktuellen Standort ermitteln“. Du bekommst Temperatur, gefühlte Temperatur, Windgeschwindigkeit, Luftfeuchtigkeit und die Vorhersage für heute und die nächsten drei Tage. Der Standort wird nur beim Klick auf den Button gelesen, nie im Hintergrund.

■ Pomodoro-Timer und To-do-Liste
Ein Zyklus aus 25 Minuten Fokus und Pause, dazu eine Checkliste für die Aufgaben des Tages.

■ Notizen mit mehreren Seiten
Das automatisch speichernde Notizen-Widget bietet jetzt mehrere Seiten (Tabs), sodass du für unterschiedliche Dinge getrennte Notizen führen kannst.

■ QR-Code-Generator
Verwandle eine URL, eine Telefonnummer oder beliebigen Text sofort in einen scanbaren QR-Code. Alles wird lokal erzeugt – lade ihn als Bild herunter oder kopiere den Ausgangstext.

■ Schnellzugriff
Zeigt die Seiten, die Chrome bereits als meistbesucht führt, und die zuletzt geschlossenen Tabs – zum Öffnen per Klick oder um einen geschlossenen Tab genau dort wiederherzustellen, wo er war. Die nötigen Berechtigungen werden erst angefragt, wenn du dieses Widget hinzufügst; die Listen werden bei jeder Anzeige neu gelesen und nie gespeichert oder gesendet.

■ Countdown
Name und Datum eingeben – schon siehst du, wie viele Tage bis zum Geburtstag, zur Reise, zur Prüfung oder zur Frist bleiben. Jährliche Jahrestage wiederholen sich automatisch.

■ Gewohnheiten
Hake tägliche Gewohnheiten wie „Wasser trinken“ oder „Sport“ ab und behalte Serie und die letzten sieben Tage im Blick.

■ Kalender
Füge den iCal-Link (.ics) deines Kalenderdienstes ein, und das Widget listet die Termine der nächsten Tage nach Tagen gruppiert. Mehrere Kalender lassen sich farblich getrennt nebeneinander zeigen, ganztägige und wiederkehrende Termine eingeschlossen. Wie bei Feeds fragt Chrome beim Hinzufügen um Erlaubnis für genau diese Adresse.

■ Rückgängig, Papierkorb und Sicherungen
Jedes Löschen und jede Layout-Änderung lässt sich sofort rückgängig machen (Strg+Z). Gelöschte Widgets und Seiten bleiben 30 Tage im Papierkorb, und vor einem Zurücksetzen oder Import wird automatisch das ganze Dashboard gesichert.

■ Dynamische Hintergründe und Glasoptik
Wähle aus kuratierten Sammlungen (Weltall, Natur, Minimal, Architektur, Abstrakt, Cyberpunk), aus Verlaufsvorlagen oder lade dein eigenes Bild hoch. Schieberegler steuern Unschärfe, Helligkeit und die Abdunklung des Hintergrunds. Mit dem Tageszeit-Modus wechseln Hintergrund und Stimmung automatisch zwischen Morgen, Tag, Abend und Nacht. Auf hellen Hintergründen wird direkt darauf liegender Text automatisch dunkel und bleibt lesbar.

■ In sieben Sprachen verfügbar
Deutsch, Englisch, Japanisch, vereinfachtes Chinesisch, Spanisch, Französisch und Koreanisch.

■ Local-First
Dein Layout, deine Notizen und deine Einstellungen liegen in chrome.storage.local auf deinem Rechner. ZenithTab hat kein eigenes Backend, keine Analyse, keine Werbung und keine Tracker. Die einzigen ausgehenden Anfragen holen das Wetter für den von dir gewählten Ort, die von dir eingerichteten Nachrichten, Feeds und Kalender (iCal) sowie die Hintergrundbilder. Die Datenschutzerklärung führt das vollständig aus.

Exportiere deine Einrichtung als JSON, um sie zu sichern oder auf einen anderen Rechner mitzunehmen.

Open Source unter der MIT-Lizenz:
https://github.com/miyabiver39/ZenithTab
```

### フランス語版（Français）

```text
ZenithTab transforme la page « nouvel onglet » en un plan de travail que vous agencez vous-même.

Les widgets que vous placez et le fond d'écran que vous choisissez vous attendent à chaque ouverture d'onglet. Tout est enregistré sur votre propre ordinateur, et aucun compte n'est nécessaire.

■ Une grille que vous agencez
Faites glisser les widgets où vous voulez et attrapez un coin pour les redimensionner. Les points de rupture adaptatifs préservent votre disposition, aussi bien sur l'écran d'un portable que sur un moniteur externe.

■ Plusieurs pages
Répartissez vos widgets et votre disposition sur des pages distinctes. Ajoutez une page par usage, changez d'un clic, renommez par double-clic. Votre disposition actuelle devient automatiquement la première page.

■ Raccourcis et tiroir d'applications
Épinglez sous forme de tuiles les sites que vous utilisez le plus et ouvrez-les d'un clic. Le tiroir d'applications filtre vos sites enregistrés par catégorie (IA, développement, médias, productivité et plus) et les recherche par nom.

■ Dock rapide
Une barre de raccourcis minimale qui reste visible en bas (ou en haut) de l'écran. Ajoutez, supprimez et réorganisez ses liens librement, et choisissez une icône dans une sélection ou saisissez votre propre emoji.

■ Barre de recherche unifiée
Basculez d'un clic entre recherche web, recherche dans les dépôts de code, recherche vidéo, assistants IA et plus encore. Pour ajouter une destination, il suffit de la choisir dans le catalogue intégré, organisé en recherche web, assistants IA, vidéo, shopping, cartes et références, développeurs et réseaux sociaux, avec des choix régionaux pour chaque langue. Ce qui n'y figure pas peut toujours être ajouté avec un nom et une URL de recherche. Marquez d'une étoile le moteur par défaut et retirez ceux que vous n'utilisez pas : les moteurs prédéfinis se récupèrent à tout moment depuis le catalogue. Appuyez sur « / » n'importe où pour placer directement le curseur dans le champ de recherche. Saisissez un calcul (120*1.1), un pourcentage, une conversion d'unités (10 km to mi), une base numérique, un lancer de dés, un pile ou face, un nombre aléatoire, une liste où choisir ou une date : la réponse s'affiche sur place, avant même de lancer la recherche.

■ Raccourcis clavier
Associez n'importe quel lien à une combinaison de touches et ouvrez-le instantanément sans toucher la souris. Les raccourcis intégrés (aller à la recherche, changer de page, annuler/rétablir) sont listés dans les réglages.

■ Explorateur de favoris
Parcourez les favoris déjà présents dans Chrome. Entrez dans les dossiers, revenez en arrière par le fil d'Ariane, filtrez par nom. Les icônes des sites proviennent du cache local de Chrome : les adresses de vos favoris n'atteignent donc jamais un service d'icônes externe.

■ Flux RSS et actualités
Saisissez un mot-clé pour suivre un sujet d'actualité, ou ajoutez votre propre flux RSS/Atom. Lorsque vous en ajoutez un, Chrome vous demande l'autorisation pour ce site précis : ZenithTab n'accède qu'aux flux que vous avez approuvés. Les articles se rafraîchissent en arrière-plan, si bien que la liste est déjà remplie à l'ouverture de l'onglet.

■ Météo
Choisissez une ville par son nom, ou cliquez sur « Détecter la position actuelle ». Vous obtenez la température, la température ressentie, la vitesse du vent, l'humidité et les prévisions pour aujourd'hui et les trois jours suivants. La position n'est lue qu'au moment où vous appuyez sur le bouton, jamais en arrière-plan.

■ Minuteur Pomodoro et liste de tâches
Un cycle de 25 minutes de concentration et de pause, accompagné d'une liste à cocher pour les tâches du jour.

■ Notes multi-pages
Le widget de notes à sauvegarde automatique gère désormais plusieurs pages (onglets), pour tenir des notes séparées selon vos besoins.

■ Générateur de code QR
Transformez instantanément une URL, un numéro de téléphone ou un texte quelconque en code QR scannable. Tout est généré localement : téléchargez-le en image ou copiez le texte source.

■ Accès rapide
Affiche les sites que Chrome classe déjà comme les plus visités et les onglets fermés récemment, pour les ouvrir d'un clic ou restaurer un onglet fermé exactement là où il était. Les autorisations nécessaires ne sont demandées qu'à l'ajout de ce widget ; les listes sont relues à chaque affichage et ne sont jamais enregistrées ni envoyées.

■ Compte à rebours
Donnez un nom et une date, et le widget affiche le nombre de jours restants avant un anniversaire, un voyage, un examen ou une échéance. Les anniversaires annuels se répètent automatiquement.

■ Habitudes
Cochez des habitudes quotidiennes comme « boire de l'eau » ou « faire du sport » et suivez la série et les sept derniers jours d'un coup d'œil.

■ Calendrier
Collez le lien iCal (.ics) fourni par votre service d'agenda et le widget liste les événements des prochains jours, regroupés par jour. Plusieurs agendas peuvent s'afficher côte à côte dans des couleurs différentes, événements sur la journée entière et récurrents compris. Comme pour les flux, Chrome demande l'autorisation pour cette adresse précise au moment de l'ajout.

■ Annulation, corbeille et sauvegardes
Chaque suppression et chaque changement de disposition peut être annulé aussitôt (Ctrl+Z). Les widgets et pages supprimés restent 30 jours dans une corbeille, et une sauvegarde de tout le tableau de bord est faite automatiquement avant une réinitialisation ou un import.

■ Fonds dynamiques et effet verre dépoli
Choisissez parmi des collections sélectionnées (cosmos, nature, minimal, architecture, abstrait, cyberpunk), des dégradés prédéfinis, ou importez votre propre image. Des curseurs règlent le flou de l'arrière-plan, la luminosité et le voile sombre. Activez le mode selon l'heure et le fond ainsi que l'ambiance évoluent d'eux-mêmes entre le matin, la journée, le coucher du soleil et la nuit. Sur un fond clair, le texte posé directement dessus passe en couleur sombre pour rester lisible.

■ Disponible en sept langues
Français, anglais, japonais, chinois simplifié, espagnol, allemand et coréen.

■ Priorité au local
Votre disposition, vos notes et vos réglages résident dans chrome.storage.local, sur votre machine. ZenithTab n'a pas de serveur propre, pas d'analytique, pas de publicité, pas de traceurs. Ses seules requêtes sortantes servent à récupérer la météo du lieu que vous avez choisi, les actualités, les flux et les calendriers (iCal) que vous avez configurés, et les images de fond. La politique de confidentialité le détaille intégralement.

Exportez votre configuration en JSON pour la sauvegarder ou l'emporter sur un autre ordinateur.

Open source sous licence MIT :
https://github.com/miyabiver39/ZenithTab
```

### 韓国語版（한국어）

```text
ZenithTab은 새 탭 페이지를 직접 꾸미는 작업 공간으로 바꿔줍니다.

직접 배치한 위젯과 고른 배경화면이 탭을 열 때마다 그대로 맞아줍니다. 모든 설정은 사용자의 컴퓨터 안에 저장되며, 계정을 만들 필요가 없습니다.

■ 직접 배치하는 그리드
위젯을 원하는 위치로 끌어다 놓고, 모서리를 잡아 크기를 조절하세요. 화면 폭에 맞춘 반응형 브레이크포인트를 갖추고 있어 노트북 화면에서도 외장 모니터에서도 배치가 흐트러지지 않습니다.

■ 여러 개의 페이지
위젯과 레이아웃을 페이지별로 나누어 관리할 수 있습니다. 용도에 맞게 페이지를 추가하고, 클릭으로 전환하고, 더블클릭으로 이름을 바꿀 수 있습니다. 기존 배치는 그대로 첫 번째 페이지로 이어집니다.

■ 바로가기와 앱 서랍
자주 쓰는 사이트를 타일로 등록해 한 번의 클릭으로 엽니다. 앱 서랍에서는 등록한 사이트를 카테고리(AI, 개발, 미디어, 생산성 등)로 좁히고 이름으로 검색할 수 있습니다.

■ 퀵 도크
화면 하단(또는 상단)에 항상 표시되는 간단한 바로가기 바입니다. 표시할 링크를 자유롭게 추가·삭제·정렬할 수 있고, 아이콘은 준비된 세트에서 고르거나 이모지로 직접 지정할 수 있습니다.

■ 통합 검색창
일반 웹 검색, 코드 저장소 검색, 동영상 검색, AI 어시스턴트 등의 검색 대상을 한 번의 클릭으로 전환합니다. 검색 대상은 「카탈로그에서 추가」에서 고르기만 하면 늘릴 수 있습니다. 카탈로그는 웹 검색·AI 어시스턴트·동영상·쇼핑·지도와 사전·개발자·SNS로 나뉘어 있으며, 지역별로 자주 쓰이는 검색 대상도 담고 있습니다. 카탈로그에 없는 검색 대상도 이름과 검색 URL만 입력하면 추가할 수 있습니다. 별표로 기본 검색 대상을 고르고, 사용하지 않는 것은 목록에서 제거할 수 있습니다(기본 제공 검색 대상도 카탈로그에서 언제든 되돌릴 수 있습니다). 페이지 어디서든 「/」 키를 누르면 곧바로 검색창으로 커서가 이동합니다. 계산식(120*1.1), 백분율, 단위 변환(10 km to mi), 진수 변환, 주사위, 동전 던지기, 난수, 후보 중 고르기, 특정 날짜까지의 일수를 입력하면 검색하기 전에 답이 바로 표시됩니다.

■ 키보드 단축키
원하는 링크에 키 조합을 지정해두면 마우스 없이 즉시 열 수 있습니다. 기본 제공 단축키(검색창으로 이동, 페이지 전환, 실행 취소/다시 실행)는 설정 화면에서 한눈에 볼 수 있습니다.

■ 북마크 탐색기
Chrome에 이미 저장된 북마크를 그대로 표시합니다. 폴더 계층을 따라 들어가고, 이동 경로로 되돌아오고, 이름으로 걸러낼 수 있습니다. 사이트 아이콘은 Chrome 자체의 로컬 캐시에서 가져오므로 북마크 주소가 외부 아이콘 서비스로 전달되지 않습니다.

■ RSS 및 뉴스 피드
키워드를 입력해 뉴스 주제를 구독하거나, 원하는 RSS/Atom 피드를 직접 추가할 수 있습니다. 피드를 추가하면 Chrome이 해당 사이트에 대한 권한을 그때마다 확인합니다. ZenithTab은 승인한 피드에만 접근합니다. 기사 목록은 백그라운드에서 갱신되므로 탭을 여는 순간 이미 채워져 있습니다.

■ 날씨
도시 이름을 입력하거나 「현재 위치 감지」를 눌러 설정합니다. 기온, 체감온도, 풍속, 습도와 함께 오늘부터 사흘 뒤까지의 예보를 표시합니다. 위치 정보는 버튼을 눌렀을 때만 읽으며, 백그라운드에서 가져오지 않습니다.

■ 뽀모도로 타이머와 할 일 목록
25분 집중과 휴식 주기를 관리하는 타이머, 그리고 체크박스 방식의 할 일 목록을 갖추고 있습니다.

■ 여러 페이지로 관리하는 메모
자동 저장되는 메모 위젯이 이제 여러 페이지(탭)를 지원해, 용도별로 메모를 나누어 관리할 수 있습니다.

■ QR 코드 생성
URL, 전화번호, 원하는 텍스트를 즉시 스캔 가능한 QR 코드로 변환합니다. 모든 생성은 기기 안에서 이루어지며, 이미지로 저장하거나 변환 전 텍스트를 복사할 수 있습니다.

■ 빠른 액세스
Chrome이 이미 파악하고 있는 「자주 방문한 사이트」와 「최근 닫은 탭」을 새 탭에 표시해, 한 번의 클릭으로 열거나 닫은 탭을 제자리에 복원할 수 있습니다. 필요한 권한은 이 위젯을 추가할 때만 요청되며, 목록은 표시할 때마다 읽기만 할 뿐 저장하거나 외부로 보내지 않습니다.

■ 카운트다운
이름과 날짜만 입력하면 생일, 여행, 시험, 마감까지 며칠 남았는지 표시합니다. 매년 반복되는 기념일도 지원합니다.

■ 습관 트래커
「물 마시기」「운동하기」 같은 일과를 매일 체크하고, 연속 일수와 최근 7일의 달성 현황을 한눈에 봅니다.

■ 캘린더
사용 중인 캘린더 서비스가 제공하는 iCal(.ics) 링크를 붙여넣으면 오늘부터 며칠간의 일정을 날짜별로 보여줍니다. 여러 캘린더를 색으로 구분해 함께 표시할 수 있고, 종일·반복 일정도 지원합니다. 피드와 마찬가지로 링크를 추가할 때 Chrome이 해당 주소에 대한 권한을 확인합니다.

■ 실행 취소, 휴지통, 백업
모든 삭제와 배치 변경은 직후에 실행 취소(Ctrl+Z)할 수 있습니다. 삭제한 위젯과 페이지는 30일 동안 휴지통에 남고, 초기화나 가져오기 전에는 대시보드 전체 백업이 자동으로 저장됩니다.

■ 다이내믹 배경화면과 글래스모피즘
엄선된 컬렉션(우주, 자연, 미니멀, 건축, 추상, 사이버펑크), 그러데이션 프리셋, 직접 올린 이미지 중에서 고를 수 있습니다. 슬라이더로 배경 흐림 정도, 밝기, 어두운 오버레이 농도를 조절합니다. 시간대 모드를 켜면 아침·낮·저녁·밤에 맞춰 배경화면과 분위기가 자동으로 바뀝니다. 밝은 배경화면에서는 배경 위에 직접 놓인 글자가 자동으로 어두운 색으로 바뀌어 읽기 쉬운 상태를 유지합니다.

■ 7개 언어 지원
한국어, 영어, 일본어, 중국어 간체, 스페인어, 프랑스어, 독일어를 지원합니다.

■ 로컬 우선
배치, 메모, 설정은 모두 사용자 기기의 chrome.storage.local에 저장됩니다. ZenithTab은 자체 서버가 없고 분석 도구도, 광고도, 트래커도 없습니다. 외부 통신은 선택한 지점의 날씨 가져오기, 설정한 뉴스·피드·캘린더(iCal) 가져오기, 배경 이미지 불러오기로 한정됩니다. 자세한 내용은 개인정보처리방침을 참고하세요.

설정을 JSON으로 내보내고 불러올 수 있어 백업하거나 다른 컴퓨터로 옮길 수 있습니다.

MIT 라이선스 오픈소스:
https://github.com/miyabiver39/ZenithTab
```

### 中国語簡体字版（简体中文）

```text
ZenithTab 把新标签页变成一块由你自己布置的工作台。

你摆好的组件和挑选的壁纸，会在每次打开标签页时原样迎接你。所有设置都保存在你自己的电脑里，无需注册账号。

■ 自由布置的网格
把组件拖到任意位置，抓住四角即可调整大小。内置随屏幕宽度变化的响应式断点，无论是笔记本屏幕还是外接显示器，布局都不会错乱。

■ 多页面工作区
可以把组件和布局拆分到多个独立页面中管理。按用途添加页面，点击即可切换，双击可重命名。现有布局会自动成为第一个页面。

■ 快捷方式与应用抽屉
把常用网站添加为磁贴，一次点击即可打开。应用抽屉可按分类（AI、开发、媒体、效率等）筛选已添加的网站，也能按名称搜索。

■ 快捷坞
始终显示在屏幕底部（或顶部）的极简快捷栏。可以自由添加、删除、重新排序其中的链接，图标可从预设集合中选择，也可以直接输入表情符号。

■ 聚合搜索栏
一次点击即可在通用网页搜索、代码仓库搜索、视频搜索、AI 助手等搜索目标之间切换。只需在「从目录添加」中挑选，就能添加新的搜索目标。目录分为网页搜索、AI 助手、视频、购物、地图与词典、开发者、社交等类别，并收录了各地区常用的搜索目标。目录中没有的，也可以填写名称和搜索 URL 自行添加。用星标选择默认搜索引擎，不用的可以从列表中移除（内置的搜索引擎也随时可以从目录中恢复）。在页面任意位置按下「/」键，光标会立刻跳到搜索框。输入算式（120*1.1）、百分比、单位换算（10 km to mi）、进制转换、掷骰子、抛硬币、随机数、从候选中选一个，或某个日期，答案会在搜索前直接显示出来。

■ 键盘快捷键
为任意链接绑定按键组合，无需使用鼠标即可瞬间打开。内置快捷键（跳到搜索框、切换页面、撤销/重做）可在设置中查看。

■ 书签浏览器
直接显示 Chrome 中已有的书签。可以逐层进入文件夹、通过面包屑返回、按名称筛选。网站图标取自 Chrome 自身的本地缓存，因此你的书签地址不会发送给任何第三方图标服务。

■ RSS 与新闻订阅
输入关键词即可订阅新闻话题，也可以添加自己的 RSS/Atom 订阅源。添加时，Chrome 会就该站点单独询问你的授权，ZenithTab 只会访问你已批准的订阅源。文章在后台自动刷新，打开标签页的瞬间列表就已就绪。

■ 天气
输入城市名称，或点击「检测当前位置」来设置。除气温、体感温度、风速、湿度外，还会显示从今天起未来三天的预报。位置信息仅在你点击按钮时读取，绝不会在后台获取。

■ 番茄钟与待办清单
管理 25 分钟专注与休息循环的计时器，以及带复选框的待办清单。

■ 多页面便签
自动保存的便签组件现在支持多个页面（标签页），可以按用途分开记录。

■ 生成二维码
即时将网址、电话号码或任意文本转换为可扫描的二维码。全部在本地生成，可保存为图片，也可复制转换前的文本。

■ 快速访问
在新标签页中显示 Chrome 已记录的「常访问网站」和「最近关闭的标签页」，一键打开，或把关闭的标签页原地恢复。相关权限只在添加此组件时申请；列表在每次显示时读取，绝不保存或对外发送。

■ 倒计时
只需填写名称和日期，即可显示距离生日、旅行、考试或截止日期还有几天。每年重复的纪念日也支持。

■ 习惯打卡
每天勾选「喝水」「运动」之类的习惯，一眼看到连续天数和最近七天的完成情况。

■ 日历
粘贴你所用日历服务提供的 iCal（.ics）链接，组件会按天列出近几天的日程。可以用不同颜色同时显示多个日历，支持全天和重复日程。与订阅源一样，添加时 Chrome 会就该地址询问你的授权。

■ 撤销、回收站与备份
所有删除和布局更改都可以立即撤销（Ctrl+Z）。删除的组件和页面会在回收站保留 30 天，重置或导入前会自动备份整个仪表盘。

■ 动态壁纸与毛玻璃质感
可从精选图集（宇宙、自然、极简、建筑、抽象、赛博朋克）、渐变预设或自行上传的图片中选择。滑块可调节背景模糊程度、亮度和暗色遮罩浓度。开启按时段切换后，壁纸和氛围会随早晨、白天、傍晚、夜晚自动变化。在浅色壁纸上，直接位于壁纸之上的文字会自动变为深色，保持清晰可读。

■ 支持七种语言
简体中文、英语、日语、西班牙语、法语、德语、韩语。

■ 本地优先
布局、笔记和设置全部保存在你设备上的 chrome.storage.local 中。ZenithTab 没有自己的服务器，没有统计分析，没有广告，没有跟踪器。对外通信仅限于获取你所选地点的天气、获取你配置的新闻、订阅源与日历（iCal），以及加载壁纸图片。详情请参阅隐私权政策。

设置可导出为 JSON，方便备份或迁移到另一台电脑。

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
ユーザーが設定したウィジェットの配置レイアウト、外観テーマ、壁紙設定、メモとToDoリスト、登録したショートカット情報、およびRSSと天気のキャッシュを、ブラウザ内（chrome.storage.local）に保存・永続化するため。外部サーバーへは一切送信しません。
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
