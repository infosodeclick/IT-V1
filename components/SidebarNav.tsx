"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navGroups } from "@/lib/definitions";
import { cx } from "@/lib/utils";

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="sidebar-nav" aria-label="Main navigation">
      {navGroups.map((group) => (
        <section className="nav-section" key={group.title}>
          <div className="nav-section-title">
            <span>{group.icon}</span>
            <span>{group.title}</span>
            <span className="nav-caret">▾</span>
          </div>
          <div className="nav-items">
            {group.items.map((item) => {
              const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
              return (
                <Link href={item.href} className={cx("nav-item", active && "active")} key={item.href}>
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                  {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </nav>
  );
}
