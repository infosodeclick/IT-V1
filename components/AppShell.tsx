import { Bell, LogOut, Menu, Moon, Search } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { logoutAction } from "@/app/actions";
import { SidebarNav } from "@/components/SidebarNav";
import type { AppUser } from "@/lib/types";

export function AppShell({ user, children }: { user: AppUser; children: ReactNode }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/dashboard" className="brand" aria-label="ITAM Desk dashboard">
          <span className="brand-mark">🖥️</span>
          <span>
            <strong>ITAM Desk</strong>
            <small>v1.1.0 — BUGpairoj</small>
          </span>
        </Link>

        <SidebarNav />

        <div className="sidebar-user">
          <span className="avatar">SA</span>
          <span>
            <strong>{user.fullName}</strong>
            <small>{user.department}</small>
          </span>
        </div>
        <form action={logoutAction}>
          <button className="sidebar-logout" type="submit">
            <LogOut size={16} aria-hidden="true" />
            <span>ออกจากระบบ</span>
          </button>
        </form>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <button className="icon-button" type="button" aria-label="เปิดเมนู">
            <Menu size={20} aria-hidden="true" />
          </button>
          <label className="global-search">
            <Search size={16} aria-hidden="true" />
            <input aria-label="ค้นหา Ticket, Asset, License" placeholder="ค้นหา Ticket, Asset, License..." />
          </label>
          <div className="topbar-actions">
            <button className="icon-button soft" type="button" aria-label="แจ้งเตือน">
              <Bell size={18} aria-hidden="true" />
              <span className="notification-dot" />
            </button>
            <button className="theme-button" type="button" aria-label="สลับโหมดสี">
              <Moon size={16} aria-hidden="true" />
            </button>
            <Link href="/profile" className="profile-chip">
              <span className="avatar small">SA</span>
              <span>
                <strong>{user.fullName}</strong>
                <small>{user.role}</small>
              </span>
            </Link>
          </div>
        </header>
        <main className="content">{children}</main>
        <footer className="app-footer">
          <span>© 2569 BUGpairoj Group • พัฒนาโดย AI Pairoj</span>
          <span>ITAM Desk v1.0.0 — Next.js / PostgreSQL</span>
        </footer>
      </div>
    </div>
  );
}
