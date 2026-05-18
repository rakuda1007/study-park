import Link from "next/link";

type MenuItem = {
  label: string;
  href?: string;
  ready: boolean;
};

type SubjectMenu = {
  subject: string;
  items: MenuItem[];
};

const subjectMenus: SubjectMenu[] = [
  {
    subject: "算数",
    items: [
      { label: "九九", href: "/kuku/", ready: true },
      {
        label: "いろいろな三角形の性質",
        href: "/sankaku/",
        ready: true,
      },
    ],
  },
  {
    subject: "社会",
    items: [
      { label: "県庁所在地", href: "/kencho/", ready: true },
      { label: "雪の多い地域の特色", href: "/yukichiiki/", ready: true },
    ],
  },
  {
    subject: "理科",
    items: [
      { label: "月の動き", href: "/tsuki/", ready: true },
      { label: "植物の育ち方", href: "/shokubutsu/", ready: true },
    ],
  },
];

function MenuItemButton({ item }: { item: MenuItem }) {
  const inner = (
    <>
      <span className="menu-item-label">{item.label}</span>
      {item.ready ? (
        <span className="menu-item-arrow" aria-hidden="true">
          →
        </span>
      ) : (
        <span className="menu-item-badge">工事中</span>
      )}
    </>
  );

  if (item.ready && item.href) {
    return (
      <Link href={item.href} className="menu-item menu-item--active">
        {inner}
      </Link>
    );
  }

  return (
    <span className="menu-item menu-item--disabled" aria-disabled="true">
      {inner}
    </span>
  );
}

function SubjectSection({ group }: { group: SubjectMenu }) {
  const readyCount = group.items.filter((item) => item.ready).length;

  if (group.items.length === 1) {
    return (
      <section className="home-subject" aria-labelledby={`subject-${group.subject}`}>
        <h2 id={`subject-${group.subject}`} className="home-subject-name">
          {group.subject}
        </h2>
        <ul className="home-item-list">
          <li>
            <MenuItemButton item={group.items[0]} />
          </li>
        </ul>
      </section>
    );
  }

  return (
    <details className="home-subject home-subject-dropdown">
      <summary className="home-subject-dropdown-trigger">
        <span id={`subject-${group.subject}`} className="home-subject-name">
          {group.subject}
        </span>
        <span className="home-subject-dropdown-meta">
          <span className="home-subject-dropdown-count">{readyCount}件</span>
          <span className="home-subject-dropdown-chevron" aria-hidden="true" />
        </span>
      </summary>
      <ul
        className="home-item-list home-subject-dropdown-panel"
        aria-labelledby={`subject-${group.subject}`}
      >
        {group.items.map((item) => (
          <li key={`${group.subject}-${item.label}`}>
            <MenuItemButton item={item} />
          </li>
        ))}
      </ul>
    </details>
  );
}

export default function Home() {
  return (
    <main className="home">
      <div className="home-caution" aria-hidden="true" />
      <div className="home-inner">
        <header className="home-header">
          <div className="home-brand">
            <div className="home-logo-wrap">
              <img
                src="/study-park-logo.png?v=8"
                alt=""
                width={68}
                height={68}
                className="home-logo"
                decoding="async"
              />
            </div>
            <div className="home-title-block">
              <p className="home-renovation-badge">
                <span aria-hidden="true">🚧</span> 改装中
              </p>
              <h1 className="home-title">Study Park</h1>
              <p className="home-lead">
                公園を少しずつ改装しています。できたエリアから遊んでね。
              </p>
            </div>
          </div>
        </header>

        <nav className="home-nav" aria-label="学習メニュー">
          <div className="home-subject-list">
            {subjectMenus.map((group) => (
              <SubjectSection key={group.subject} group={group} />
            ))}
          </div>
        </nav>
      </div>
    </main>
  );
}
