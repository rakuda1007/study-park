/**
 * 静的 /sankaku/ と Firestore レッスンの比較
 * node scripts/compare-sankaku-lesson.mjs [slug]
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const projectId = "study-park-fb726";
const slugArg = process.argv[2];

function loadStaticSankaku() {
  const html = readFileSync(join(root, "public/sankaku/index.html"), "utf8");
  const sections = [];
  const h2Re = /<h2 id="heading-(\d+)">([^<]+)<\/h2>/g;
  let m;
  while ((m = h2Re.exec(html)) !== null) {
    sections.push({ index: Number(m[1]), heading: m[2].trim() });
  }
  const introMatch = html.match(/<p class="lesson-intro">([\s\S]*?)<\/p>/);
  const intro = introMatch
    ? introMatch[1].replace(/<[^>]+>/g, "").trim()
    : "";
  const toc = [];
  const tocRe = /<li><a href="#section-(\d+)">([^<]+)<\/a><\/li>/g;
  while ((m = tocRe.exec(html)) !== null) {
    toc.push({ index: Number(m[1]), heading: m[2].trim() });
  }
  return { intro, toc, sections, href: "/sankaku/" };
}

function firestoreValue(v) {
  if (v == null) return undefined;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("booleanValue" in v) return v.booleanValue;
  if ("arrayValue" in v) return (v.arrayValue.values ?? []).map(firestoreValue);
  if ("mapValue" in v) {
    const o = {};
    for (const [k, val] of Object.entries(v.mapValue.fields ?? {})) {
      o[k] = firestoreValue(val);
    }
    return o;
  }
  return undefined;
}

async function runQuery(body) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json();
}

async function fetchPublishedLessons() {
  const data = await runQuery({
    structuredQuery: {
      from: [{ collectionId: "contents" }],
      where: {
        compositeFilter: {
          op: "AND",
          filters: [
            {
              fieldFilter: {
                field: { fieldPath: "type" },
                op: "EQUAL",
                value: { stringValue: "lesson" },
              },
            },
            {
              fieldFilter: {
                field: { fieldPath: "status" },
                op: "EQUAL",
                value: { stringValue: "published" },
              },
            },
          ],
        },
      },
    },
  });
  return (data ?? [])
    .filter((r) => r.document)
    .map((r) => {
      const f = r.document.fields ?? {};
      const lesson = firestoreValue(f.lesson);
      return {
        id: r.document.name.split("/").pop(),
        title: firestoreValue(f.title) ?? "",
        slug: firestoreValue(f.slug) ?? "",
        intro: firestoreValue(f.intro) ?? "",
        sections: lesson?.sections ?? [],
      };
    });
}

async function fetchBySlug(slug) {
  const data = await runQuery({
    structuredQuery: {
      from: [{ collectionId: "contents" }],
      where: {
        compositeFilter: {
          op: "AND",
          filters: [
            {
              fieldFilter: {
                field: { fieldPath: "slug" },
                op: "EQUAL",
                value: { stringValue: slug },
              },
            },
            {
              fieldFilter: {
                field: { fieldPath: "type" },
                op: "EQUAL",
                value: { stringValue: "lesson" },
              },
            },
          ],
        },
      },
    },
  });
  const rows = (data ?? []).filter((r) => r.document);
  if (!rows.length) return null;
  const f = rows[0].document.fields ?? {};
  const lesson = firestoreValue(f.lesson);
  return {
    id: rows[0].document.name.split("/").pop(),
    title: firestoreValue(f.title) ?? "",
    slug: firestoreValue(f.slug) ?? "",
    status: firestoreValue(f.status) ?? "",
    intro: firestoreValue(f.intro) ?? "",
    sections: lesson?.sections ?? [],
  };
}

function stripHtml(s) {
  return String(s ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sectionSummary(sec) {
  const blocks = sec.blocks ?? [];
  const texts = blocks.map((b) => {
    if (b.kind === "html") return `[HTML] ${stripHtml(b.html).slice(0, 120)}`;
    if (b.kind === "paragraph") return stripHtml(b.text).slice(0, 120);
    if (b.kind === "image") return `[画像] ${b.src ?? ""}`;
    return "";
  });
  return texts.filter(Boolean).join(" | ");
}

function extractLinksFromLesson(lesson) {
  const links = [];
  for (const sec of lesson.sections ?? []) {
    for (const b of sec.blocks ?? []) {
      if (b.kind === "html") {
        const re = /href=["']([^"']+)["']/g;
        let m;
        while ((m = re.exec(b.html ?? "")) !== null) links.push(m[1]);
      }
      const t = b.text ?? "";
      const re2 = /href=["']([^"']+)["']/g;
      let m;
      while ((m = re2.exec(t)) !== null) links.push(m[1]);
    }
  }
  return links;
}

function compare(staticData, lesson) {
  const diffs = [];
  const links = extractLinksFromLesson(lesson);

  if (!links.some((h) => h.includes("/sankaku"))) {
    diffs.push(`レッスンに /sankaku/ へのリンクがありません: ${links.join(", ") || "(なし)"}`);
  }

  const fsSections = (lesson.sections ?? []).map((s) => ({
    id: s.id,
    heading: String(s.heading ?? "").trim(),
    body: sectionSummary(s),
  }));

  if (fsSections.length === 1 && /はじめに|intro/i.test(fsSections[0].heading)) {
    diffs.push(
      `レッスンは「${fsSections[0].heading}」1セクションのみ（本文はラッパー）。静的アプリは ${staticData.sections.length} セクションの読み物。`,
    );
  }

  const staticHeadings = staticData.sections.map((s) => s.heading);
  const fsHeadings = fsSections.map((s) => s.heading);
  const missingInLesson = staticHeadings.filter(
    (h) => !fsHeadings.some((fh) => fh.includes(h.slice(0, 8)) || h.includes(fh.slice(0, 8))),
  );
  if (missingInLesson.length && fsSections.length > 1) {
    diffs.push(`レッスンにない静的見出し: ${missingInLesson.join(" / ")}`);
  }

  return { diffs, links, fsSections };
}

const staticData = loadStaticSankaku();
console.log("=== 静的アプリ /sankaku/ ===");
console.log(`種類: 読み物（HTML まとめページ）`);
console.log(`導入: ${staticData.intro.slice(0, 80)}…`);
console.log(`セクション数: ${staticData.sections.length}`);
staticData.sections.forEach((s) => console.log(`  ${s.index}. ${s.heading}`));

let lesson = null;
if (slugArg) {
  lesson = await fetchBySlug(slugArg);
} else {
  const lessons = await fetchPublishedLessons();
  const hits = lessons.filter(
    (l) =>
      /三角形|sankaku/i.test(l.title) ||
      /sankaku/i.test(l.slug) ||
      extractLinksFromLesson(l).some((h) => h.includes("sankaku")),
  );
  if (hits.length === 1) lesson = hits[0];
  else if (hits.length > 1) {
    console.log("\n候補が複数あります。slug を指定してください:");
    hits.forEach((l) => console.log(` - ${l.slug} | ${l.title}`));
    process.exit(0);
  } else lesson = lessons.find((l) => /sankaku-link/i.test(l.slug)) ?? hits[0];
}

if (!lesson) {
  console.log("\n=== Firestore レッスン ===");
  console.log("三角形関連の公開レッスンが見つかりません。");
  const all = await fetchPublishedLessons();
  all
    .filter((l) => /三角|sankaku/i.test(l.title + l.slug))
    .forEach((l) => console.log(` - ${l.slug} | ${l.title} | ${l.sections.length} セクション`));
  process.exit(0);
}

console.log(`\n=== Firestore レッスン: ${lesson.title} (slug=${lesson.slug}) ===`);
console.log(`intro: ${stripHtml(lesson.intro).slice(0, 100) || "(なし)"}`);
console.log(`セクション数: ${lesson.sections.length}`);
lesson.sections.forEach((s, i) => {
  console.log(`  ${i + 1}. ${s.heading} — ${sectionSummary(s).slice(0, 100)}`);
});

const { diffs, links } = compare(staticData, lesson);
console.log("\n=== 比較 ===");
console.log(`リンク: ${links.join(", ") || "(なし)"}`);
if (diffs.length === 0) {
  console.log("設計どおり: レッスンは静的まとめ (/sankaku/) への入口、本文は静的アプリ側。");
} else {
  console.log("相違点:");
  diffs.forEach((d) => console.log(` - ${d}`));
}
