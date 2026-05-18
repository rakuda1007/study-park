import Image from "next/image";
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
    items: [{ label: "九九", href: "/kuku/", ready: true }],
  },
  {
    subject: "社会",
    items: [{ label: "県庁所在地", href: "/kencho/", ready: true }],
  },
  {
    subject: "理科",
    items: [{ label: "月の動き", href: "/tsuki/", ready: true }],
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

export default function Home() {
  return (
    <main className="home">
      <div className="home-caution" aria-hidden="true" />
      <div className="home-inner">
        <header className="home-header">
          <div className="home-brand">
            <Image
              src="/study-park.png"
              alt=""
              width={72}
              height={72}
              className="home-logo"
              priority
            />
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
          <ul className="home-subject-list">
            {subjectMenus.map((group) => (
              <li key={group.subject} className="home-subject">
                <h2 className="home-subject-name">{group.subject}</h2>
                <ul className="home-item-list">
                  {group.items.map((item) => (
                    <li key={`${group.subject}-${item.label}`}>
                      <MenuItemButton item={item} />
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </main>
  );
}
