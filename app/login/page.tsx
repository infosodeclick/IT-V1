import { Monitor, Unlock } from "lucide-react";
import { redirect } from "next/navigation";

import { loginAction } from "@/app/actions";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const params = await searchParams;
  const hasError = params.error === "invalid";

  return (
    <main className="login-page">
      <section className="login-info">
        <div className="login-logo">🖥️</div>
        <h1>ITAM Desk</h1>
        <p>ระบบจัดการสินทรัพย์ IT และ Service Desk สำหรับองค์กรไทย</p>
        <div className="feature-list">
          <span>🎫 Service Desk & Helpdesk</span>
          <span>💻 ทะเบียนอุปกรณ์ IT</span>
          <span>📜 License Management</span>
          <span>🔐 Credential Vault</span>
          <span>📊 Dashboard & Reports</span>
        </div>
      </section>
      <section className="login-card" aria-label="เข้าสู่ระบบ">
        <div className="login-card-brand">
          <span>
            <Monitor size={28} aria-hidden="true" />
          </span>
          <div>
            <strong>ITAM Desk</strong>
            <small>IT Service & Asset Control Center</small>
          </div>
        </div>
        <h2>เข้าสู่ระบบ</h2>
        <p>กรอก Username และ Password เพื่อใช้งาน</p>
        {hasError ? <div className="notice bad">Username หรือ Password ไม่ถูกต้อง</div> : null}
        <form action={loginAction} className="login-form">
          <label>
            <span>Username หรือ Email</span>
            <input aria-label="Username หรือ Email" name="login" placeholder="username หรือ email@domain.com" autoComplete="username" defaultValue="admin" required />
          </label>
          <label>
            <span>Password</span>
            <input aria-label="Password" name="password" placeholder="••••••••" type="password" autoComplete="current-password" defaultValue="Admin@1234" required />
          </label>
          <button className="button primary full" type="submit">
            <Unlock size={16} aria-hidden="true" />
            เข้าสู่ระบบ
          </button>
        </form>
        <footer>
          <span>© 2569 BUGpairoj Group • พัฒนาโดย AI Pairoj</span>
          <span>ITAM Desk v1.0.0 — Next.js / PostgreSQL</span>
        </footer>
      </section>
    </main>
  );
}
