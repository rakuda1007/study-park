import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-foreground text-3xl font-semibold tracking-tight">
        Study Park
      </h1>
      <p className="text-foreground/80">
        学習用 Web アプリの入口です。九九の練習は下のボタンからどうぞ。
      </p>
      <Link
        href="/kuku"
        className="bg-foreground text-background inline-flex w-fit items-center justify-center rounded-xl px-6 py-3 text-lg font-semibold no-underline transition-opacity hover:opacity-90"
      >
        九九パークをはじめる
      </Link>
    </main>
  );
}
