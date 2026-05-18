/**
 * 月の動き — 問題データ（空欄は（①）形式）
 */
window.TSUKI_QUESTIONS = [
  {
    id: "q01",
    label: "問題1",
    template:
      "月は球の形をした星で、主に（①）でできています。月の表面には、明るく見える部分と暗く見える部分があります。",
    blanks: [{ marker: "①", answers: ["岩石", "がんせき"] }],
  },
  {
    id: "q02",
    label: "問題2",
    template: "明るく見える部分は（②）と呼ばれます。",
    blanks: [{ marker: "②", answers: ["陸", "高地", "りく", "こうち"] }],
  },
  {
    id: "q03",
    label: "問題3",
    template: "月の表面にあるくぼみは（③）と呼ばれます。",
    blanks: [{ marker: "③", answers: ["クレーター", "くれーたー"] }],
  },
  {
    id: "q04",
    label: "問題4",
    template: "暗く見える部分は（④）と呼ばれます。",
    blanks: [{ marker: "④", answers: ["海", "うみ"] }],
  },
  {
    id: "q05",
    label: "問題5",
    template:
      "地球から見える月の形は、毎日少しずつ変わってきています。この月の形の変化を（⑤）といいます。",
    blanks: [{ marker: "⑤", answers: ["月の満ち欠け", "満ち欠け", "つきのみちがけ"] }],
  },
  {
    id: "q06",
    label: "問題6〜8",
    template:
      "月は新月→三日月→（⑥）→（⑦）→（⑧）のように満ち欠けを繰り返します。",
    blanks: [
      { marker: "⑥", answers: ["上げんの月", "上弦の月", "じょうげんのつき"] },
      { marker: "⑦", answers: ["満月", "まんげつ"] },
      { marker: "⑧", answers: ["下げんの月", "下弦の月", "げげんのつき"] },
    ],
  },
  {
    id: "q09",
    label: "問題9",
    template: "月の満ち欠けの周期は約（⑨）日です。",
    blanks: [
      {
        marker: "⑨",
        answers: ["30", "30日", "約30日", "三十", "三十日", "約三十日"],
      },
    ],
  },
  {
    id: "q10",
    label: "問題10〜11",
    template:
      "下げんの月は（⑩）側が光っている状態で（⑪）側からかけていきます。",
    blanks: [
      { marker: "⑩", answers: ["左", "ひだり"] },
      { marker: "⑪", answers: ["右", "みぎ"] },
    ],
  },
  {
    id: "q11",
    label: "問題12〜13",
    template:
      "上げんの月は（⑫）側が光っている状態で（⑬）側から満ちていきます。",
    blanks: [
      { marker: "⑫", answers: ["右", "みぎ"] },
      { marker: "⑬", answers: ["右", "みぎ"] },
    ],
  },
];

window.TSUKI_TOTAL = window.TSUKI_QUESTIONS.length;
