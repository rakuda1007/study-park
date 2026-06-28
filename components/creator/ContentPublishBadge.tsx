import { publishBadgeInfo } from "@/lib/content/publish-status";
import type { ContentStatus } from "@/lib/content/types";

type Props = {
  status: ContentStatus;
};

export function ContentPublishBadge({ status }: Props) {
  const { label, className } = publishBadgeInfo(status);
  return (
    <span className={className} aria-label={`公開状態: ${label}`}>
      {label}
    </span>
  );
}
