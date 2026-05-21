import type { LessonBlock } from "@/lib/content/types";
import { lessonBlockKey } from "@/lib/content/lesson-render";
import { RichTextContent } from "@/lib/content/rich-text-react";

type Props = {
  sectionId: string;
  blocks: LessonBlock[];
};

export function LessonBlocks({ sectionId, blocks }: Props) {
  return (
    <>
      {blocks.map((b, i) => {
        const key = lessonBlockKey(sectionId, i, b);
        if (b.kind === "html") {
          return (
            <div
              key={key}
              className="lesson-html"
              dangerouslySetInnerHTML={{ __html: b.html }}
            />
          );
        }
        if (b.kind === "image") {
          return (
            <figure key={key} className="lesson-figure">
              <img src={b.src} alt={b.alt ?? ""} className="lesson-figure-img" loading="lazy" />
              {b.caption ? (
                <figcaption className="lesson-figure-caption">{b.caption}</figcaption>
              ) : null}
            </figure>
          );
        }
        return <RichTextContent key={key} text={b.text} paragraphClass="lesson-body" />;
      })}
    </>
  );
}
