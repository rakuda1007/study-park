import type { ContentManifest } from "./types";

export type HomeMenuItem = {
  label: string;
  href?: string;
  ready: boolean;
};

export type HomeSubjectMenu = {
  subject: string;
  items: HomeMenuItem[];
};

export function manifestToHomeMenus(manifest: ContentManifest): HomeSubjectMenu[] {
  return [...manifest.subjects]
    .sort((a, b) => a.order - b.order)
    .map((s) => ({
      subject: s.name,
      items: s.items.map((item) => ({
        label: item.label,
        href: item.href,
        ready: item.ready,
      })),
    }));
}
