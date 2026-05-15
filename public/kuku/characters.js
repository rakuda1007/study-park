/**
 * 九九アプリ — キャラクター定義（画像は public 直下の PNG を参照）
 * index.html から /kuku/ で開く想定のため image は ../<file>.png
 */
window.KUKU_CHARACTERS = [
  {
    id: "orange",
    name: "みかんぼうや",
    emoji: "🍊",
    image: "../orange.png",
    traits: "明るい、太陽みたい",
    phrases: ["やったね！", "あったかい気持ち！"],
    fx3: "fx-orange-peel",
    fx10: "fx-orange-juice",
    fx20: "fx-orange-sun",
  },
  {
    id: "dog",
    name: "ぽちまる",
    emoji: "🐶",
    image: "../dog.png",
    traits: "元気、励まし上手",
    phrases: ["やったね！", "いけるいける！"],
    fx3: "fx-dog-tail",
    fx10: "fx-dog-bone",
    fx20: "fx-dog-stars",
  },
  {
    id: "cat",
    name: "みけにゃん",
    emoji: "🐱",
    image: "../cat.png",
    traits: "ツンデレ",
    phrases: ["べ、別にすごいなんて…", "…でもやるじゃん"],
    fx3: "fx-cat-heart-tail",
    fx10: "fx-cat-paw",
    fx20: "fx-cat-mega-heart",
  },
  {
    id: "tofu",
    name: "とうふさん",
    emoji: "🧊",
    image: "../tofu.png",
    traits: "メンタル豆腐、応援は全力",
    phrases: ["ふるふる…でも大丈夫！"],
    fx3: "fx-tofu-shake",
    fx10: "fx-tofu-negi",
    fx20: "fx-tofu-gold",
  },
  {
    id: "apple",
    name: "りんごっち",
    emoji: "🍎",
    image: "../apple.png",
    traits: "まじめ、努力家",
    phrases: ["すばらしいです！", "その調子です！"],
    fx3: "fx-apple-leaf",
    fx10: "fx-apple-scent",
    fx20: "fx-apple-gold",
  },
  {
    id: "panda",
    name: "ぱんだるま",
    emoji: "🐼",
    image: "../panda.png",
    traits: "おっとり、優しい",
    phrases: ["すごいねぇ〜", "ゆっくりでいいよ〜"],
    fx3: "fx-panda-bounce",
    fx10: "fx-panda-bamboo",
    fx20: "fx-panda-firework",
  },
];

/** レベルアップ時の自動ローテーション順（先頭が初期デフォルト） */
window.KUKU_CHAR_ROSTER_IDS = [
  "orange",
  "dog",
  "cat",
  "tofu",
  "apple",
  "panda",
];
