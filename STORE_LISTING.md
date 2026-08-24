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
  ウィジェットを自由に配置できる新しいタブのダッシュボード。ブックマーク、RSS、天気、ダイナミック壁紙に対応。
  ```
- **英語 (en)**:
  ```text
  A customizable new tab dashboard with drag-and-drop widgets, bookmarks, RSS feeds, weather and dynamic wallpapers.
  ```
- **スペイン語 (es)**:
  ```text
  Panel de nueva pestaña personalizable con widgets arrastrables, marcadores, RSS, clima y fondos dinámicos.
  ```
- **ドイツ語 (de)**:
  ```text
  Anpassbares Neuer-Tab-Dashboard mit verschiebbaren Widgets, Lesezeichen, RSS-Feeds, Wetter und dynamischen Hintergründen.
  ```
- **フランス語 (fr)**:
  ```text
  Tableau de bord personnalisable pour le nouvel onglet : widgets, favoris, flux RSS, météo et fonds dynamiques.
  ```
- **韓国語 (ko)**:
  ```text
  위젯을 자유롭게 배치하는 새 탭 대시보드. 북마크, RSS 피드, 날씨, 다이내믹 배경화면을 지원합니다.
  ```
- **中国語簡体字 (zh_CN)**:
  ```text
  可自由拖放组件的新标签页仪表板，支持书签、RSS 订阅、天气和动态壁纸。
  ```

---

## 2. 詳細な説明（Detailed Description）

### 日本語版

```text
ZenithTab は、新しいタブを「自分専用の作業台」に変えるダッシュボードです。

ドラッグ＆ドロップで置いたウィジェットと選んだ壁紙が、タブを開くたびにそのまま迎えてくれます。設定はすべてお使いのパソコンの中に保存され、アカウント登録は必要ありません。

■ 自由なグリッド配置
ウィジェットは好きな位置へドラッグでき、四隅をつかんでサイズも変更できます。画面幅に応じたブレークポイントを備えているため、ノートPCでも外部ディスプレイでも配置が崩れません。

■ ショートカットとアプリドロワー
よく使うサイトをタイルとして登録し、ワンクリックで開けます。アプリドロワーでは登録済みのサイトをカテゴリ（AI・開発・メディア・仕事効率化など）で絞り込み、名前で検索して素早く目的の項目にたどり着けます。

■ 統合検索バー
主要なWeb検索、コードリポジトリ検索、動画検索、AIチャットの入力先をワンクリックで切り替えられます。キーボードの「/」キーを押すと、どこにいても検索欄にカーソルが移動します。

■ ブックマークエクスプローラー
Chrome に保存済みのブックマークをそのまま表示します。フォルダの階層をたどり、パンくずで戻り、名前で絞り込めます。アイコンは Chrome 内部のキャッシュから取得するため、外部のアイコンサービスにアドレスが送信されることはありません。

■ RSS / ニュースフィード
キーワードを入力するだけでニュースの一覧を購読できます。お好みのRSS/Atomフィードを追加することもでき、その際は対象サイトへのアクセス許可を Chrome がその都度確認します（許可した配信元にしかアクセスしません）。取得結果はバックグラウンドで更新されるので、タブを開いた瞬間に記事が並びます。

■ 天気
都市名を入力するか、「現在地を検出」をクリックして現在地から設定できます。気温・体感温度・風速・湿度に加えて、今日から3日先までの予報を表示します。位置情報を読み取るのはボタンを押したときだけで、バックグラウンドで取得することはありません。

■ ポモドーロタイマーとToDo
25分の集中と休憩のサイクルを管理するタイマーと、チェックボックス式のToDoリストを備えています。

■ ダイナミック壁紙とグラスモフィズム
宇宙・自然・ミニマル・建築・抽象・サイバーパンクの各コレクション、グラデーションプリセット、手持ちの画像アップロードから選べます。すりガラスのぼかし量、明るさ、暗色オーバーレイの濃さはスライダーで調整できます。

■ 多言語対応
日本語、英語、中国語（簡体字）、スペイン語、フランス語、ドイツ語、韓国語のインターフェースに対応しています。

■ ローカルファースト
レイアウト、メモ、設定はすべてお使いのパソコンの chrome.storage.local に保存されます。ZenithTab には独自のサーバーがなく、アクセス解析も広告もトラッカーもありません。外部への通信は、天気の取得（選択した地点の座標）、ニュースとRSSの取得、壁紙画像の読み込みに限られます。詳細はプライバシーポリシーをご覧ください。

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

■ Shortcuts and an app drawer
Pin the sites you use most as tiles and open them in one click. The app drawer filters your saved sites by category (AI, development, media, productivity and more) and searches them by name.

■ Unified search bar
Switch in one click between general web search, code repository search, video search, and an AI chat prompt. Press "/" anywhere on the page to jump straight into the search field.

■ Bookmark explorer
Browse the bookmarks already in Chrome. Walk into folders, step back through breadcrumbs, and filter by name. Site icons come from Chrome's own local cache, so the addresses of your bookmarks never reach an outside icon service.

■ RSS and news feeds
Type a keyword to follow a news topic, or add your own RSS/Atom feed. When you add one, Chrome asks your permission for that specific site — ZenithTab only ever reaches the feeds you approve. Articles refresh in the background so the list is already populated when the tab opens.

■ Weather
Set a city by name, or click "Detect current location". You get temperature, feels-like, wind speed, humidity, and the forecast for today plus the next three days. Location is read only when you press the button, never in the background.

■ Pomodoro timer and to-do list
A 25-minute focus and break cycle, plus a checkbox list for the day's tasks.

■ Dynamic wallpapers and glassmorphism
Choose from curated collections (cosmos, nature, minimal, architecture, abstract, cyberpunk), gradient presets, or upload your own image. Sliders control backdrop blur, brightness, and the darkening overlay.

■ Available in seven languages
English, Japanese, Simplified Chinese, Spanish, French, German, and Korean.

■ Local-first
Your layout, notes, and settings live in chrome.storage.local on your machine. ZenithTab has no backend of its own, no analytics, no ads, and no trackers. Its only outbound requests are fetching weather for the location you chose, fetching the news and feeds you configured, and loading wallpaper images. The privacy policy spells this out in full.

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


■ Accesos directos y cajón de aplicaciones

Fija como mosaicos los sitios que más usas y ábrelos con un clic. El cajón de aplicaciones filtra tus sitios guardados por categoría (IA, desarrollo, medios, productividad y más) y los busca por nombre.


■ Barra de búsqueda unificada

Cambia con un clic entre búsqueda web general, búsqueda en repositorios de código, búsqueda de vídeos y una consulta de chat con IA. Pulsa «/» en cualquier momento para saltar directamente al campo de búsqueda.


■ Explorador de marcadores

Navega por los marcadores que ya tienes en Chrome. Entra en las carpetas, retrocede con las migas de pan y filtra por nombre. Los iconos de los sitios provienen de la caché local del propio Chrome, así que las direcciones de tus marcadores nunca llegan a un servicio de iconos externo.


■ RSS y noticias

Escribe una palabra clave para seguir un tema de actualidad, o añade tu propio feed RSS/Atom. Cuando añades uno, Chrome te pide permiso para ese sitio concreto: ZenithTab solo accede a los feeds que tú apruebas. Los artículos se actualizan en segundo plano, de modo que la lista ya está lista cuando abres la pestaña.


■ El tiempo

Elige una ciudad por su nombre o pulsa «Detectar ubicación actual». Verás temperatura, sensación térmica, velocidad del viento, humedad y la previsión de hoy y de los tres días siguientes. La ubicación solo se consulta cuando pulsas el botón, nunca en segundo plano.


■ Temporizador Pomodoro y lista de tareas

Un ciclo de concentración y descanso de 25 minutos, junto con una lista de tareas con casillas de verificación.


■ Fondos dinámicos y glassmorphism

Elige entre colecciones seleccionadas (cosmos, naturaleza, minimalismo, arquitectura, abstracto, cyberpunk), degradados predefinidos o sube tu propia imagen. Los controles deslizantes ajustan el desenfoque del fondo, el brillo y la capa de oscurecimiento.


■ Disponible en siete idiomas

Español, inglés, japonés, chino simplificado, francés, alemán y coreano.


■ Prioridad a lo local

Tu disposición, tus notas y tus ajustes viven en chrome.storage.local, en tu máquina. ZenithTab no tiene servidor propio, ni analíticas, ni anuncios, ni rastreadores. Sus únicas conexiones salientes son obtener el tiempo de la ubicación que elegiste, obtener las noticias y los feeds que configuraste, y cargar las imágenes de fondo. La política de privacidad lo detalla por completo.


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


■ Verknüpfungen und App-Schublade

Hefte die Seiten, die du am häufigsten brauchst, als Kacheln an und öffne sie mit einem Klick. Die App-Schublade filtert deine gespeicherten Seiten nach Kategorie (KI, Entwicklung, Medien, Produktivität und mehr) und durchsucht sie nach Namen.


■ Vereinheitlichte Suchleiste

Wechsle mit einem Klick zwischen allgemeiner Websuche, Suche in Code-Repositorys, Videosuche und einer KI-Chat-Eingabe. Drück „/“ an beliebiger Stelle, um direkt ins Suchfeld zu springen.


■ Lesezeichen-Explorer

Durchstöbere die Lesezeichen, die bereits in Chrome liegen. Geh in Ordner hinein, über den Brotkrumenpfad wieder zurück, und filtere nach Namen. Die Website-Symbole stammen aus Chromes eigenem lokalem Cache – die Adressen deiner Lesezeichen erreichen also nie einen externen Icon-Dienst.


■ RSS- und Nachrichten-Feeds

Gib ein Stichwort ein, um ein Nachrichtenthema zu verfolgen, oder füge deinen eigenen RSS/Atom-Feed hinzu. Fügst du einen hinzu, fragt Chrome dich um Erlaubnis für genau diese Seite – ZenithTab greift ausschließlich auf die Feeds zu, die du freigegeben hast. Artikel werden im Hintergrund aktualisiert, sodass die Liste beim Öffnen des Tabs bereits gefüllt ist.


■ Wetter

Leg eine Stadt über ihren Namen fest oder klick auf „Aktuellen Standort ermitteln“. Du bekommst Temperatur, gefühlte Temperatur, Windgeschwindigkeit, Luftfeuchtigkeit und die Vorhersage für heute und die nächsten drei Tage. Der Standort wird nur beim Klick auf den Button gelesen, nie im Hintergrund.


■ Pomodoro-Timer und To-do-Liste

Ein Zyklus aus 25 Minuten Fokus und Pause, dazu eine Checkliste für die Aufgaben des Tages.


■ Dynamische Hintergründe und Glasoptik

Wähle aus kuratierten Sammlungen (Weltall, Natur, Minimal, Architektur, Abstrakt, Cyberpunk), aus Verlaufsvorlagen oder lade dein eigenes Bild hoch. Schieberegler steuern Unschärfe, Helligkeit und die Abdunklung des Hintergrunds.


■ In sieben Sprachen verfügbar

Deutsch, Englisch, Japanisch, vereinfachtes Chinesisch, Spanisch, Französisch und Koreanisch.


■ Local-First

Dein Layout, deine Notizen und deine Einstellungen liegen in chrome.storage.local auf deinem Rechner. ZenithTab hat kein eigenes Backend, keine Analyse, keine Werbung und keine Tracker. Die einzigen ausgehenden Anfragen holen das Wetter für den von dir gewählten Ort, die von dir eingerichteten Nachrichten und Feeds sowie die Hintergrundbilder. Die Datenschutzerklärung führt das vollständig aus.


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


■ Raccourcis et tiroir d'applications

Épinglez sous forme de tuiles les sites que vous utilisez le plus et ouvrez-les d'un clic. Le tiroir d'applications filtre vos sites enregistrés par catégorie (IA, développement, médias, productivité et plus) et les recherche par nom.


■ Barre de recherche unifiée

Basculez d'un clic entre recherche web générale, recherche dans les dépôts de code, recherche vidéo et invite de chat IA. Appuyez sur « / » n'importe où pour placer directement le curseur dans le champ de recherche.


■ Explorateur de favoris

Parcourez les favoris déjà présents dans Chrome. Entrez dans les dossiers, revenez en arrière par le fil d'Ariane, filtrez par nom. Les icônes des sites proviennent du cache local de Chrome : les adresses de vos favoris n'atteignent donc jamais un service d'icônes externe.


■ Flux RSS et actualités

Saisissez un mot-clé pour suivre un sujet d'actualité, ou ajoutez votre propre flux RSS/Atom. Lorsque vous en ajoutez un, Chrome vous demande l'autorisation pour ce site précis : ZenithTab n'accède qu'aux flux que vous avez approuvés. Les articles se rafraîchissent en arrière-plan, si bien que la liste est déjà remplie à l'ouverture de l'onglet.


■ Météo

Choisissez une ville par son nom, ou cliquez sur « Détecter la position actuelle ». Vous obtenez la température, la température ressentie, la vitesse du vent, l'humidité et les prévisions pour aujourd'hui et les trois jours suivants. La position n'est lue qu'au moment où vous appuyez sur le bouton, jamais en arrière-plan.


■ Minuteur Pomodoro et liste de tâches

Un cycle de 25 minutes de concentration et de pause, accompagné d'une liste à cocher pour les tâches du jour.


■ Fonds dynamiques et effet verre dépoli

Choisissez parmi des collections sélectionnées (cosmos, nature, minimal, architecture, abstrait, cyberpunk), des dégradés prédéfinis, ou importez votre propre image. Des curseurs règlent le flou de l'arrière-plan, la luminosité et le voile sombre.


■ Disponible en sept langues

Français, anglais, japonais, chinois simplifié, espagnol, allemand et coréen.


■ Priorité au local

Votre disposition, vos notes et vos réglages résident dans chrome.storage.local, sur votre machine. ZenithTab n'a pas de serveur propre, pas d'analytique, pas de publicité, pas de traceurs. Ses seules requêtes sortantes servent à récupérer la météo du lieu que vous avez choisi, les actualités et les flux que vous avez configurés, et les images de fond. La politique de confidentialité le détaille intégralement.


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


■ 바로가기와 앱 서랍

자주 쓰는 사이트를 타일로 등록해 한 번의 클릭으로 엽니다. 앱 서랍에서는 등록한 사이트를 카테고리(AI, 개발, 미디어, 생산성 등)로 좁히고 이름으로 검색할 수 있습니다.


■ 통합 검색창

일반 웹 검색, 코드 저장소 검색, 동영상 검색, AI 채팅 입력창을 한 번의 클릭으로 전환합니다. 페이지 어디서든 「/」 키를 누르면 곧바로 검색창으로 커서가 이동합니다.


■ 북마크 탐색기

Chrome에 이미 저장된 북마크를 그대로 표시합니다. 폴더 계층을 따라 들어가고, 이동 경로로 되돌아오고, 이름으로 걸러낼 수 있습니다. 사이트 아이콘은 Chrome 자체의 로컬 캐시에서 가져오므로 북마크 주소가 외부 아이콘 서비스로 전달되지 않습니다.


■ RSS 및 뉴스 피드

키워드를 입력해 뉴스 주제를 구독하거나, 원하는 RSS/Atom 피드를 직접 추가할 수 있습니다. 피드를 추가하면 Chrome이 해당 사이트에 대한 권한을 그때마다 확인합니다. ZenithTab은 승인한 피드에만 접근합니다. 기사 목록은 백그라운드에서 갱신되므로 탭을 여는 순간 이미 채워져 있습니다.


■ 날씨

도시 이름을 입력하거나 「현재 위치 감지」를 눌러 설정합니다. 기온, 체감온도, 풍속, 습도와 함께 오늘부터 사흘 뒤까지의 예보를 표시합니다. 위치 정보는 버튼을 눌렀을 때만 읽으며, 백그라운드에서 가져오지 않습니다.


■ 뽀모도로 타이머와 할 일 목록

25분 집중과 휴식 주기를 관리하는 타이머, 그리고 체크박스 방식의 할 일 목록을 갖추고 있습니다.


■ 다이내믹 배경화면과 글래스모피즘

엄선된 컬렉션(우주, 자연, 미니멀, 건축, 추상, 사이버펑크), 그러데이션 프리셋, 직접 올린 이미지 중에서 고를 수 있습니다. 슬라이더로 배경 흐림 정도, 밝기, 어두운 오버레이 농도를 조절합니다.


■ 7개 언어 지원

한국어, 영어, 일본어, 중국어 간체, 스페인어, 프랑스어, 독일어를 지원합니다.


■ 로컬 우선

배치, 메모, 설정은 모두 사용자 기기의 chrome.storage.local에 저장됩니다. ZenithTab은 자체 서버가 없고 분석 도구도, 광고도, 트래커도 없습니다. 외부 통신은 선택한 지점의 날씨 가져오기, 설정한 뉴스와 피드 가져오기, 배경 이미지 불러오기로 한정됩니다. 자세한 내용은 개인정보처리방침을 참고하세요.


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


■ 快捷方式与应用抽屉

把常用网站添加为磁贴，一次点击即可打开。应用抽屉可按分类（AI、开发、媒体、效率等）筛选已添加的网站，也能按名称搜索。


■ 聚合搜索栏

一次点击即可在通用网页搜索、代码仓库搜索、视频搜索和 AI 对话输入之间切换。在页面任意位置按下「/」键，光标会立刻跳到搜索框。


■ 书签浏览器

直接显示 Chrome 中已有的书签。可以逐层进入文件夹、通过面包屑返回、按名称筛选。网站图标取自 Chrome 自身的本地缓存，因此你的书签地址不会发送给任何第三方图标服务。


■ RSS 与新闻订阅

输入关键词即可订阅新闻话题，也可以添加自己的 RSS/Atom 订阅源。添加时，Chrome 会就该站点单独询问你的授权，ZenithTab 只会访问你已批准的订阅源。文章在后台自动刷新，打开标签页的瞬间列表就已就绪。


■ 天气

输入城市名称，或点击「检测当前位置」来设置。除气温、体感温度、风速、湿度外，还会显示从今天起未来三天的预报。位置信息仅在你点击按钮时读取，绝不会在后台获取。


■ 番茄钟与待办清单

管理 25 分钟专注与休息循环的计时器，以及带复选框的待办清单。


■ 动态壁纸与毛玻璃质感

可从精选图集（宇宙、自然、极简、建筑、抽象、赛博朋克）、渐变预设或自行上传的图片中选择。滑块可调节背景模糊程度、亮度和暗色遮罩浓度。


■ 支持七种语言

简体中文、英语、日语、西班牙语、法语、德语、韩语。


■ 本地优先

布局、笔记和设置全部保存在你设备上的 chrome.storage.local 中。ZenithTab 没有自己的服务器，没有统计分析，没有广告，没有跟踪器。对外通信仅限于获取你所选地点的天气、获取你配置的新闻与订阅源，以及加载壁纸图片。详情请参阅隐私权政策。


设置可导出为 JSON，方便备份或迁移到另一台电脑。

基于 MIT 许可证开源：
https://github.com/miyabiver39/ZenithTab
```

---

## 3. 単一用途の説明（Single Purpose Description）

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
| ウェブ閲覧履歴 | 収集しない |
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
- [ ] `geolocation` を含む全権限の正当化理由を入力した
- [ ] スクリーンショットが現在のUIと一致している
- [ ] `manifest.json` と `package.json` のバージョンが一致している
