import Link from "next/link";

import { listRecords } from "@/lib/db";
import { buddhistToday, formatDate, formatMoney, statusTone } from "@/lib/utils";

function MetricCard({
  label,
  value,
  note,
  icon,
  accent
}: {
  label: string;
  value: string;
  note: string;
  icon: string;
  accent: string;
}) {
  return (
    <article className="metric-card" style={{ ["--accent" as string]: accent }}>
      <div className="metric-top">
        <span>{label}</span>
        <span className="metric-icon">{icon}</span>
      </div>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

export async function Dashboard() {
  const [tickets, assets, licenses, subscriptions] = await Promise.all([
    listRecords("tickets"),
    listRecords("assets"),
    listRecords("licenses"),
    listRecords("subscriptions")
  ]);

  const todayTickets = tickets.length;
  const activeAssets = assets.filter((asset) => asset.status === "ใช้งาน").length;
  const freeAssets = assets.filter((asset) => asset.status === "ว่าง").length;
  const expiringLicenses = licenses.filter((license) => license.status === "ใกล้หมด").length;
  const closedTickets = tickets.filter((ticket) => ticket.status === "ปิด" || ticket.status === "แก้แล้ว").length;
  const monthlyCost = subscriptions.reduce((total, item) => total + (item.costMonthly || 0), 0);
  const highRiskAssets = assets.filter((asset) => String(asset.meta.risk || "").includes("สูง"));

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <h1>
            <span>📊</span>
            Dashboard
          </h1>
          <p>ภาพรวมระบบ IT — ข้อมูล Real-time</p>
        </div>
        <span className="date-pill">📅 {buddhistToday()}</span>
      </div>

      <section className="metric-grid" aria-label="KPI summary">
        <MetricCard label="Ticket วันนี้" value={String(todayTickets)} note="▲ 3 เพิ่มจากเมื่อวาน" icon="🎫" accent="#0ea5e9" />
        <MetricCard label="อุปกรณ์ IT" value={String(assets.length)} note={`${activeAssets} กำลังใช้งาน`} icon="💻" accent="#f59e0b" />
        <MetricCard label="License ใกล้หมด" value={`${expiringLicenses} รายการ`} note="⚠ ภายใน 30 วัน" icon="📜" accent="#eab308" />
        <MetricCard label="SLA เดือนนี้" value="100%" note={`✅ ดีเยี่ยม (${closedTickets} ticket ปิดแล้ว)`} icon="📈" accent="#164e63" />
      </section>

      <section className="dashboard-grid">
        <article className="panel trend-panel">
          <div className="panel-head">
            <div>
              <h2>📈 แนวโน้ม Ticket 7 วัน</h2>
              <p>จำนวน Ticket แต่ละวัน</p>
            </div>
            <div className="segmented">
              <button className="selected" type="button">7 วัน</button>
              <button type="button">เดือน</button>
            </div>
          </div>
          <div className="bar-chart" aria-label="Ticket trend">
            {[0, 0, 0, 0, 0, 0, 3].map((value, index) => (
              <div className="bar-column" key={index}>
                <span className="bar-value">{value || ""}</span>
                <span className="bar" style={{ height: `${Math.max(value * 28, 4)}px` }} />
                <small>{["17/06", "18/06", "19/06", "20/06", "21/06", "22/06", "23/06"][index]}</small>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <span><i className="legend-blue" />เปิด</span>
            <span><i className="legend-green" />แก้แล้ว</span>
            <span><i className="legend-gray" />ปิด</span>
          </div>
        </article>

        <article className="panel asset-panel">
          <div className="panel-head">
            <div>
              <h2>💻 สถานะอุปกรณ์</h2>
              <p>แยกตามสถานะทั้งหมด</p>
            </div>
          </div>
          <div className="donut-wrap">
            <div className="donut" style={{ ["--active" as string]: `${(activeAssets / Math.max(assets.length, 1)) * 100}%` }}>
              <strong>{assets.length}</strong>
              <small>ทั้งหมด</small>
            </div>
          </div>
          <div className="status-lines">
            <span><i className="legend-blue" />ใช้งาน <strong>{activeAssets}</strong></span>
            <span><i className="legend-green" />ว่าง <strong>{freeAssets}</strong></span>
          </div>
        </article>
      </section>

      <section className="dashboard-grid lower">
        <article className="panel">
          <div className="panel-head">
            <div>
              <h2>🎫 Ticket ล่าสุด</h2>
              <p>5 รายการล่าสุดของระบบ</p>
            </div>
            <Link href="/tickets">ดูทั้งหมด →</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>เลขที่</th>
                  <th>หัวข้อ</th>
                  <th>ผู้แจ้ง</th>
                  <th>ระดับ</th>
                  <th>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {tickets.slice(0, 5).map((ticket) => (
                  <tr key={ticket.id}>
                    <td className="strong">{ticket.code}</td>
                    <td>
                      <strong>{ticket.title}</strong>
                      <small>{ticket.category}</small>
                    </td>
                    <td>{ticket.owner}</td>
                    <td><span className={`status ${statusTone(ticket.priority)}`}>{ticket.priority}</span></td>
                    <td><span className={`status ${statusTone(ticket.status)}`}>{ticket.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel side-panel">
          <h2>📊 SLA ตามระดับ</h2>
          {["🔴 วิกฤต (0 ticket)", "🟠 สูง (0 ticket)", "🔵 ปกติ (3 ticket)", "🟢 ต่ำ (0 ticket)"].map((item, index) => (
            <div className="progress-row" key={item}>
              <span>{item}</span>
              <strong>{index === 2 ? "100%" : "0%"}</strong>
              <i style={{ width: index === 2 ? "100%" : "0%" }} />
            </div>
          ))}
        </article>
      </section>

      <section className="mini-grid">
        <article className="panel mini-panel">
          <div className="panel-head">
            <h2>📜 License ใกล้หมดอายุ</h2>
            <Link href="/licenses">ดูทั้งหมด →</Link>
          </div>
          {licenses.filter((license) => license.status === "ใกล้หมด").map((license) => (
            <div className="list-line" key={license.id}>
              <span className="line-icon">📜</span>
              <span>
                <strong>{license.title}</strong>
                <small>{license.meta.seatsUsed}/{license.meta.seatsTotal} seats</small>
              </span>
              <strong>{formatDate(license.dueDate)}</strong>
            </div>
          ))}
        </article>

        <article className="panel mini-panel">
          <div className="panel-head">
            <h2>💳 ค่าใช้จ่าย Subscription</h2>
            <Link href="/subscriptions">ดูทั้งหมด →</Link>
          </div>
          <div className="money-hero">{formatMoney(monthlyCost)} <small>/ เดือน</small></div>
          {subscriptions.map((item) => (
            <div className="list-line" key={item.id}>
              <span className="line-icon">☁️</span>
              <span>
                <strong>{item.title}</strong>
                <small>ชำระ {formatDate(item.dueDate)}</small>
              </span>
              <strong>{formatMoney(item.costMonthly)}</strong>
            </div>
          ))}
        </article>

        <article className="panel mini-panel">
          <div className="panel-head">
            <h2>🛡️ อุปกรณ์เสี่ยงสูง</h2>
            <Link href="/assets">ดูทั้งหมด →</Link>
          </div>
          {highRiskAssets.length ? (
            highRiskAssets.map((asset) => (
              <div className="list-line" key={asset.id}>
                <span className="line-icon">⚠️</span>
                <span>
                  <strong>{asset.title}</strong>
                  <small>{asset.code}</small>
                </span>
                <strong>{asset.meta.risk}</strong>
              </div>
            ))
          ) : (
            <p className="empty-note">ไม่มีอุปกรณ์เสี่ยงสูง ✅</p>
          )}
          <div className="ai-note">🤖 AI แนะนำ: มี {expiringLicenses} license ใกล้หมดอายุ — ควรต่ออายุทันที</div>
        </article>
      </section>
    </div>
  );
}
