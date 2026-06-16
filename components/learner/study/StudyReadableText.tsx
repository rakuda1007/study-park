/** ページ番号など英数字の詰まりを抑える表示用 */

const ALNUM_RUN = /([0-9A-Za-z][0-9A-Za-z.\-–—~〜]*)/g;

export function StudyReadableText({ text }: { text: string }) {
  const parts = text.split(ALNUM_RUN);
  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null;
        if (/^[0-9A-Za-z]/.test(part)) {
          return (
            <span key={`${index}-${part}`} className="study-alnum-text">
              {part}
            </span>
          );
        }
        return <span key={`${index}-${part}`}>{part}</span>;
      })}
    </>
  );
}
