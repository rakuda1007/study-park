import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-foreground text-3xl font-semibold tracking-tight">
        Study Park
      </h1>
      <p className="text-foreground/80">
        学習用 Web アプリの入口です。メニューから学習を選んでください。
      </p>
      <nav className="flex flex-col gap-3" aria-label="学習メニュー">
        <Link
          href="/kuku/"
          className="bg-foreground text-background inline-flex w-fit items-center justify-center rounded-xl px-6 py-3 text-lg font-semibold no-underline transition-opacity hover:opacity-90"
        >
          九九パーク
        </Link>
        <Link
          href="/kencho/"
          className="border-foreground/20 text-foreground inline-flex w-fit items-center justify-center rounded-xl border-2 bg-transparent px-6 py-3 text-lg font-semibold no-underline transition-opacity hover:opacity-90"
        >
          県庁所在地
        </Link>
      </nav>
    </main>
  );
}
