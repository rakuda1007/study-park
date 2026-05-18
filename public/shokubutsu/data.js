/**
 * 植物の育ち方 — 問題データ（空欄は（①）形式）
 */
window.SHOKUBUTSU_QUESTIONS = [
  {
    id: "q01",
    number: 1,
    label: "問1",
    template:
      "春に種をまく植物の代表的なものに「①」と「②」があります。",
    blanks: [
      { marker: "①", answers: ["アサガオ", "あさがお"] },
      { marker: "②", answers: ["ヘチマ", "へちま"] },
    ],
  },
  {
    id: "q02",
    number: 2,
    label: "問2",
    template:
      "アサガオについてです。「①」月ごろ、一晩水につけておいた種をまきます。水につけておくのは、種の皮を柔らかくして芽や根が出やすくするためです。種から芽や根が出てくることを「②」といいます。数日すると、最初の葉が開きます。最初の葉を「③」といいます。",
    blanks: [
      { marker: "①", answers: ["5", "５", "五", "5月"] },
      { marker: "②", answers: ["発芽", "はつが"] },
      { marker: "③", answers: ["子葉", "しょくよう", "しよう"] },
    ],
  },
  {
    id: "q03",
    number: 3,
    label: "問3",
    template:
      "子葉が出てから4-5日すると、子葉とは形や大きさが違う葉（本葉）が出てきます。葉が増えてくるとるつのようなくきがのびてくるので、（①）をたてます。アサガオのつるは、上から見て（②）周りにまきついていきます。",
    blanks: [
      { marker: "①", answers: ["支柱", "しちゅう"] },
      { marker: "②", answers: ["左", "ひだり"] },
    ],
  },
  {
    id: "q04",
    number: 4,
    label: "問4",
    template:
      "植物が花をさかせるのは、種を作って仲間をふやすためです。アサガオの花のつくりは、外側から「①」「②」「③」「④」の順番になっています。",
    blanks: [
      { marker: "①", answers: ["がく"] },
      { marker: "②", answers: ["花びら", "はなびら"] },
      { marker: "③", answers: ["おしべ"] },
      { marker: "④", answers: ["めしべ"] },
    ],
  },
  {
    id: "q05",
    number: 5,
    label: "問5",
    template:
      "おしべの先には「①」という部分があり、ここで「②」が作られます。",
    blanks: [
      { marker: "①", answers: ["やく"] },
      { marker: "②", answers: ["花粉", "かふん"] },
    ],
  },
  {
    id: "q06",
    number: 6,
    label: "問6",
    template:
      "花が開いた後、昆虫によって花粉がめしべの先につくこともあります。このように、花粉がめしべの先につくことを「①」といいます。",
    blanks: [{ marker: "①", answers: ["受粉", "じゅふん"] }],
  },
  {
    id: "q07",
    number: 7,
    label: "問7",
    template:
      "アサガオの花が受粉すると、めしべの根もとの部分である「①」が成長し始め、やがて実になります。はじめ実は「②」色ですが、じゅくすと「③」色になります。じゅくした実の中には3～6個の「④」ができます。",
    blanks: [
      { marker: "①", answers: ["子ぼう", "しぼう"] },
      { marker: "②", answers: ["緑", "みどり"] },
      { marker: "③", answers: ["茶", "ちゃ", "茶色", "ちゃいろ"] },
      { marker: "④", answers: ["種", "たね"] },
    ],
  },
];

window.SHOKUBUTSU_TOTAL = window.SHOKUBUTSU_QUESTIONS.length;
