import Link from "next/link";

export function ShellBrandLink({ href }: { href: string }) {
  return (
    <Link href={href} className="shell-brand-link">
      Study Park
    </Link>
  );
}
