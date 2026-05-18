/**
 * 植物の育ち方 — 問題データ（空欄は（①）形式）
 */
(function () {
  const SPRING_SEED_PLANTS = [
    "アサガオ",
    "あさがお",
    "ヘチマ",
    "へちま",
    "ホウセンカ",
    "ほうせんか",
    "ひまわり",
    "ヒマワリ",
  ];

  const SPRING_BULB_PAIR = [
    "ダリア",
    "だりあ",
    "グラジオラス",
    "ぐらじおらす",
  ];

  const FALL_BULB_PAIR = [
    "チューリップ",
    "ちゅーりっぷ",
    "スイセン",
    "すいせん",
  ];

  window.SHOKUBUTSU_QUESTIONS = [
    {
      id: "q01",
      number: 1,
      label: "問1",
      template:
        "春に種をまく植物の代表的なものに「①」「②」「③」「④」があります。※順不同です",
      blanks: [
        { marker: "①", answers: [...SPRING_SEED_PLANTS] },
        { marker: "②", answers: [...SPRING_SEED_PLANTS] },
        { marker: "③", answers: [...SPRING_SEED_PLANTS] },
        { marker: "④", answers: [...SPRING_SEED_PLANTS] },
      ],
      answerDisplay: [
        { marker: "①", text: "アサガオ" },
        { marker: "②", text: "ヘチマ" },
        { marker: "③", text: "ホウセンカ" },
        { marker: "④", text: "ひまわり" },
      ],
    },
    {
      id: "q08",
      number: 2,
      label: "問2",
      template:
        "ヘチマは5月の初めに種をまきます。6月ごろになると、葉の根もとからばねのような形の「①」がでてきます。「①」がまきついてからだをささえられるように「②」をたてます。",
      blanks: [
        { marker: "①", answers: ["まきひげ", "マキヒゲ"] },
        { marker: "②", answers: ["支柱", "しちゅう"] },
      ],
    },
    {
      id: "q09",
      number: 3,
      label: "問3",
      template:
        "ヘチマは7月ごろから、「①」「②」の2種類の花を咲かせます。「①」には、「③」、花びら、がくがあります。「②」には、「④」、花びら、がくがあります。",
      blanks: [
        { marker: "①", answers: ["お花", "おはな"] },
        { marker: "②", answers: ["め花", "めはな"] },
        { marker: "③", answers: ["おしべ"] },
        { marker: "④", answers: ["めしべ"] },
      ],
    },
    {
      id: "q02",
      number: 4,
      label: "問4",
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
      number: 5,
      label: "問5",
      template:
        "子葉が出てから4-5日すると、子葉とは形や大きさが違う葉（本葉）が出てきます。葉が増えてくるとるつのようなくきがのびてくるので、（①）をたてます。アサガオのつるは、上から見て（②）周りにまきついていきます。",
      blanks: [
        { marker: "①", answers: ["支柱", "しちゅう"] },
        { marker: "②", answers: ["左", "ひだり"] },
      ],
    },
    {
      id: "q04",
      number: 6,
      label: "問6",
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
      number: 7,
      label: "問7",
      template:
        "おしべの先には「①」という部分があり、ここで「②」が作られます。",
      blanks: [
        { marker: "①", answers: ["やく"] },
        { marker: "②", answers: ["花粉", "かふん"] },
      ],
    },
    {
      id: "q06",
      number: 8,
      label: "問8",
      template:
        "花が開いた後、昆虫によって花粉がめしべの先につくこともあります。このように、花粉がめしべの先につくことを「①」といいます。",
      blanks: [{ marker: "①", answers: ["受粉", "じゅふん"] }],
    },
    {
      id: "q07",
      number: 9,
      label: "問9",
      template:
        "アサガオの花が受粉すると、めしべの根もとの部分である「①」が成長し始め、やがて実になります。はじめ実は「②」色ですが、じゅくすと「③」色になります。じゅくした実の中には3～6個の「④」ができます。",
      blanks: [
        { marker: "①", answers: ["子ぼう", "しぼう"] },
        { marker: "②", answers: ["緑", "みどり"] },
        { marker: "③", answers: ["茶", "ちゃ", "茶色", "ちゃいろ"] },
        { marker: "④", answers: ["種", "たね"] },
      ],
    },
    {
      id: "q10",
      number: 10,
      label: "問10",
      template:
        "春に球根を植えて育てるものには、「①」「②」があります。春に植えた球根は夏から秋にかけて花が咲きます。秋に球根を植えて育てるものには「③」「④」があります。秋に植えた球根は春に花を咲かせます。※①②は順不同、③④は順不同",
      blanks: [
        { marker: "①", answers: [...SPRING_BULB_PAIR] },
        { marker: "②", answers: [...SPRING_BULB_PAIR] },
        { marker: "③", answers: [...FALL_BULB_PAIR] },
        { marker: "④", answers: [...FALL_BULB_PAIR] },
      ],
      answerDisplay: [
        { marker: "①", text: "ダリア" },
        { marker: "②", text: "グラジオラス" },
        { marker: "③", text: "チューリップ" },
        { marker: "④", text: "スイセン" },
      ],
    },
  ];
})();

window.SHOKUBUTSU_TOTAL = window.SHOKUBUTSU_QUESTIONS.length;
