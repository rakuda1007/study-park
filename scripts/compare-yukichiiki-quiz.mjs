/**
 * Firestore quiz (much-snow) の確認（静的 /yukichiiki/ は削除済み）
 * node scripts/compare-yukichiiki-quiz.mjs
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const projectId = "study-park-fb726";
const FS_SLUG = process.argv[2] ?? "much-snow";

function fv(v) {
  if (!v) return undefined;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("booleanValue" in v) return v.booleanValue;
  if ("arrayValue" in v) return (v.arrayValue.values ?? []).map(fv);
  if ("mapValue" in v) {
    const o = {};
    for (const [k, val] of Object.entries(v.mapValue.fields ?? {})) o[k] = fv(val);
    return o;
  }
  return undefined;
}

function mapQuizRow(row) {
  const f = row.document.fields ?? {};
  return {
    title: fv(f.title) ?? "",
    slug: fv(f.slug) ?? "",
    status: fv(f.status) ?? "",
    intro: fv(f.intro) ?? "",
    quizKind: fv(f.quiz)?.quizKind ?? "",
    questions: fv(f.quiz)?.questions ?? [],
  };
}

async function runQuery(body) {
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json();
}

async function fetchQuiz(slug) {
  const data = await runQuery({
    structuredQuery: {
      from: [{ collectionId: "contents" }],
      where: {
        fieldFilter: {
          field: { fieldPath: "status" },
          op: "EQUAL",
          value: { stringValue: "published" },
        },
      },
    },
  });
  const rows = (data ?? []).filter((r) => r.document).map(mapQuizRow);
  return rows.find((r) => r.slug === slug && r.questions?.length) ?? null;
}

function loadStaticQuestions() {
  const src = readFileSync(join(root, "public/yukichiiki/data.js"), "utf8");
  const m = src.match(/window\.YUKICHIIKI_QUESTIONS\s*=\s*(\[[\s\S]*?\]);/);
  if (!m) throw new Error("YUKICHIIKI_QUESTIONS not found");
  return JSON.parse(
    m[1]
      .replace(/(\w+):/g, '"$1":')
      .replace(/'/g, '"')
      .replace(/,\s*]/g, "]")
      .replace(/,\s*}/g, "}"),
  );
}

/** data.js は JS オブジェクトなので eval で読む（ローカル信頼ファイルのみ） */
function loadStaticQuestionsSafe() {
  const path = join(root, "public/yukichiiki/data.js");
  try {
    readFileSync(path);
  } catch {
    return null;
  }
  const src = readFileSync(path, "utf8");
  const win = {};
  const fn = new Function("window", `${src}\nreturn window.YUKICHIIKI_QUESTIONS;`);
  return fn(win);
}

function normalizeText(s) {
  return String(s ?? "")
    .replace(/\s+/g, "")
    .replace(/[（]/g, "(")
    .replace(/[）]/g, ")");
}

function markerSortKey(marker) {
  const order = "①②③④⑤⑥⑦⑧⑨⑩";
  return order.indexOf(marker);
}

function compareAnswerSets(staticBlanks, fsBlanks) {
  const diffs = [];
  const sm = new Map(
    (staticBlanks ?? []).map((b) => [
      b.marker,
      [...new Set((b.answers ?? []).map((a) => String(a).trim().toLowerCase()))],
    ]),
  );
  const fm = new Map(
    (fsBlanks ?? []).map((b) => [
      b.marker,
      [...new Set((b.answers ?? []).map((a) => String(a).trim().toLowerCase()))],
    ]),
  );
  for (const [marker, sAns] of sm) {
    const fAns = fm.get(marker);
    if (!fAns) {
      diffs.push(`空欄${marker}: Firestore に無し`);
      continue;
    }
    const onlyS = sAns.filter((a) => !fAns.includes(a));
    const onlyF = fAns.filter((a) => !sAns.includes(a));
    if (onlyS.length || onlyF.length) {
      diffs.push(
        `空欄${marker}: 静的=[${sAns.join(" / ")}] | FS=[${fAns.join(" / ")}]`,
      );
    }
  }
  for (const marker of fm.keys()) {
    if (!sm.has(marker)) diffs.push(`空欄${marker}: 静的に無し`);
  }
  return diffs;
}

const staticQs = loadStaticQuestionsSafe();
const fsQuiz = await fetchQuiz(FS_SLUG);

if (!fsQuiz) {
  console.error(`Firestore quiz slug=${FS_SLUG} が見つかりません`);
  process.exit(1);
}

if (!staticQs) {
  console.log("静的 /yukichiiki/ は削除済み。Firestore quiz のみ表示します。\n");
}

const staticIntro =
  "ここでは、新潟県を中心とした雪の多い地域の気候、くらし、産業について学びます。";

console.log("=== 概要 ===\n");
console.log("| 項目 | 静的アプリ `/yukichiiki/` | Firestore quiz `/play?slug=much-snow` |");
console.log("|------|---------------------------|--------------------------------------|");
console.log(`| 種類 | 空欄クイズ（独自 HTML/JS） | 空欄クイズ（Next.js QuizShell） |`);
console.log(`| 問題数 | ${staticQs?.length ?? "—"} | ${fsQuiz.questions.length} |`);
console.log(`| 公開 | manifest + legacyContents | status=${fsQuiz.status} |`);
console.log(`| 導入文 | index.html「はじめに」 | intro フィールド |`);

const introOk =
  normalizeText(fsQuiz.intro).includes(normalizeText(staticIntro.slice(0, 20)));
console.log(`| 導入文の一致 | ${staticIntro.slice(0, 30)}… | ${introOk ? "ほぼ同一" : "差異あり"} |`);

console.log("\n=== 機能・UI の違い ===\n");
console.log("- **静的**: localStorage（苦手・マスター）、出題形式セレクト、キャラ演出、PWA");
console.log("- **quiz**: Firestore 進捗は別（学習者アカウント連携）、管理画面で編集可");
console.log("- **URL**: `/yukichiiki/` vs `/play?slug=much-snow`");
console.log("- **トップ**: 社会科目に静的行が manifest 登録。quiz は contents 公開で別行");

console.log("\n=== 問題ごと（本文 template・正答） ===\n");

const summaryDiffs = [];
const staticLen = staticQs?.length ?? 0;
for (let i = 0; i < Math.max(staticLen, fsQuiz.questions.length); i++) {
  const s = staticQs?.[i];
  const f = fsQuiz.questions[i];
  const n = i + 1;
  console.log(`#### 問${n}`);

  if (!s) {
    console.log("- 静的: **なし**");
    summaryDiffs.push(`問${n}: 静的に無し`);
    continue;
  }
  if (!f) {
    console.log("- Firestore: **なし**");
    summaryDiffs.push(`問${n}: Firestoreに無し`);
    continue;
  }

  const sTpl = s.template ?? "";
  const fTpl = f.template ?? "";
  const tplMatch = normalizeText(sTpl) === normalizeText(fTpl);

  console.log(`- ラベル: 静的=${s.label} / FS=${f.label}`);
  console.log(`- 本文: ${tplMatch ? "**一致**" : "**差異あり**"}`);
  if (!tplMatch) {
    console.log(`  - 静的: ${sTpl.slice(0, 120)}${sTpl.length > 120 ? "…" : ""}`);
    console.log(`  - FS:   ${fTpl.slice(0, 120)}${fTpl.length > 120 ? "…" : ""}`);
    summaryDiffs.push(`問${n}: 本文テンプレート差異`);
  }

  const blankDiffs = compareAnswerSets(s.blanks, f.blanks);
  if (blankDiffs.length) {
    console.log("- 正答:");
    blankDiffs.forEach((d) => console.log(`  - ${d}`));
    summaryDiffs.push(...blankDiffs.map((d) => `問${n}: ${d}`));
  } else {
    console.log(`- 正答: **一致**（空欄 ${s.blanks?.length ?? 0} か所）`);
  }

  const sBlocks = s.blocks?.length ?? 0;
  const fBlocks = f.blocks?.length ?? 0;
  if (sBlocks || fBlocks) {
    console.log(`- 追加ブロック: 静的=${sBlocks} / FS=${fBlocks}`);
    if (sBlocks !== fBlocks) summaryDiffs.push(`問${n}: blocks 数差 (${sBlocks} vs ${fBlocks})`);
  }
  console.log("");
}

console.log("=== 結論 ===\n");
if (summaryDiffs.length === 0) {
  console.log(
    "10問の **template と正答は静的 data.js と Firestore much-snow で一致** しています。",
  );
  console.log(
    "違いは主に **配信経路**（静的 Hosting vs /play）と **管理・進捗** です。",
  );
} else {
  console.log("相違点:");
  summaryDiffs.forEach((d) => console.log(`- ${d}`));
}
