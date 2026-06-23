import type { FieldDefinition, ModuleDefinition } from "@/lib/types";

const priorityOptions = ["ต่ำ", "ปกติ", "สูง", "วิกฤต"];
const statusOptions = ["เปิด", "กำลังดำเนินการ", "รออนุมัติ", "อนุมัติแล้ว", "แก้แล้ว", "ปิด"];
const departmentOptions = ["IT Department", "HR", "Finance", "Operations", "Marketing", "All"];

const quickFilters: FieldDefinition[] = [
  { name: "q", label: "ค้นหา", type: "text", placeholder: "ค้นหาเลข, ชื่อ, ผู้แจ้ง..." },
  { name: "status", label: "สถานะ", type: "select", options: ["ทั้งหมด", ...statusOptions] },
  { name: "priority", label: "ระดับ", type: "select", options: ["ทั้งหมด", ...priorityOptions] }
];

const ticketFields: FieldDefinition[] = [
  { name: "title", label: "หัวข้อปัญหา *", type: "text", required: true, placeholder: "เช่น คอมพิวเตอร์ค้าง, อินเทอร์เน็ตขัดข้อง", target: "title" },
  { name: "description", label: "อธิบายรายละเอียด *", type: "textarea", required: true, placeholder: "เกิดขึ้นเมื่อไร ทำอะไรอยู่ Error message คืออะไร", target: "description" },
  { name: "category", label: "ประเภทปัญหา *", type: "select", required: true, options: ["แจ้งซ่อมอุปกรณ์", "Network", "Software", "Account", "อื่นๆ"], target: "category" },
  { name: "priority", label: "ระดับความเร่งด่วน", type: "select", options: priorityOptions, target: "priority" },
  { name: "owner", label: "ผู้แจ้ง", type: "text", placeholder: "ชื่อผู้แจ้ง", target: "owner" },
  { name: "department", label: "แผนก", type: "select", options: departmentOptions, target: "department" },
  { name: "asset", label: "เลือกอุปกรณ์", type: "text", placeholder: "Asset Tag หรือชื่อเครื่อง" }
];

const assetFields: FieldDefinition[] = [
  { name: "title", label: "ชื่ออุปกรณ์ *", type: "text", required: true, placeholder: "Notebook Dell Latitude 7440", target: "title" },
  { name: "category", label: "ประเภท", type: "select", options: ["Notebook", "Desktop", "Monitor", "Network", "Printer", "Accessory"], target: "category" },
  { name: "serial", label: "Serial No.", type: "text", placeholder: "SN..." },
  { name: "model", label: "Model", type: "text", placeholder: "รุ่นอุปกรณ์" },
  { name: "owner", label: "ผู้ถือครอง", type: "text", placeholder: "ชื่อผู้ใช้หรือคลังอุปกรณ์", target: "owner" },
  { name: "department", label: "แผนก", type: "select", options: departmentOptions, target: "department" },
  { name: "status", label: "สถานะ", type: "select", options: ["ใช้งาน", "ว่าง", "ซ่อม", "จำหน่าย"], target: "status" },
  { name: "dueDate", label: "หมดประกัน", type: "date", target: "dueDate" },
  { name: "risk", label: "Risk", type: "select", options: ["ต่ำ", "ปานกลาง", "สูง"] }
];

const licenseFields: FieldDefinition[] = [
  { name: "title", label: "Software *", type: "text", required: true, placeholder: "Office 2024", target: "title" },
  { name: "category", label: "ประเภท", type: "select", options: ["Per seat", "Subscription", "Per device", "Open source"], target: "category" },
  { name: "vendor", label: "Vendor", type: "text", placeholder: "Microsoft, Adobe" },
  { name: "seatsUsed", label: "Seats ใช้", type: "number", placeholder: "0" },
  { name: "seatsTotal", label: "Seats ทั้งหมด", type: "number", placeholder: "10" },
  { name: "dueDate", label: "วันหมดอายุ", type: "date", target: "dueDate" },
  { name: "costMonthly", label: "ค่าใช้จ่าย/เดือน", type: "number", target: "costMonthly" },
  { name: "status", label: "สถานะ", type: "select", options: ["ใช้งาน", "ใกล้หมด", "หมดอายุ", "ยกเลิก"], target: "status" }
];

const vendorFields: FieldDefinition[] = [
  { name: "title", label: "ชื่อบริษัท/ผู้ขาย *", type: "text", required: true, placeholder: "ชื่อบริษัทหรือผู้ขาย", target: "title" },
  { name: "category", label: "ประเภท", type: "select", options: ["Software", "Hardware", "Infrastructure", "Service", "Other"], target: "category" },
  { name: "taxId", label: "เลขที่ผู้เสียภาษี", type: "text", placeholder: "13 หลัก" },
  { name: "owner", label: "ชื่อผู้ติดต่อ", type: "text", placeholder: "ชื่อ-นามสกุล", target: "owner" },
  { name: "phone", label: "เบอร์โทร", type: "text", placeholder: "0X-XXXX-XXXX" },
  { name: "email", label: "Email", type: "email", placeholder: "sales@vendor.com" },
  { name: "website", label: "Website", type: "text", placeholder: "https://www.vendor.com" },
  { name: "dueDate", label: "วันหมดสัญญา", type: "date", target: "dueDate" },
  { name: "description", label: "หมายเหตุเพิ่มเติม", type: "textarea", target: "description" }
];

export const navGroups = [
  {
    title: "ภาพรวม",
    icon: "📊",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "🏠" },
      { href: "/calendar", label: "ปฏิทิน IT", icon: "📅" }
    ]
  },
  {
    title: "Service Desk",
    icon: "🎫",
    items: [
      { href: "/tickets", label: "Ticket ทั้งหมด", icon: "🎫", badge: "3" },
      { href: "/tickets/new", label: "แจ้งปัญหาใหม่", icon: "➕" },
      { href: "/service-requests", label: "Service Request", icon: "📋" },
      { href: "/access-requests", label: "Access Request", icon: "🔑" },
      { href: "/pm-calendar", label: "PM Calendar", icon: "🔧" }
    ]
  },
  {
    title: "Asset Management",
    icon: "💻",
    items: [
      { href: "/assets", label: "ทะเบียนอุปกรณ์", icon: "💻" },
      { href: "/checkout", label: "รับ-คืนอุปกรณ์", icon: "📦" },
      { href: "/asset-requests", label: "คำขออุปกรณ์", icon: "📝" },
      { href: "/qr-scanner", label: "QR Scanner", icon: "📷" },
      { href: "/asset-audit", label: "ตรวจนับทรัพย์สิน", icon: "📊" }
    ]
  },
  {
    title: "License & Cost",
    icon: "📜",
    items: [
      { href: "/licenses", label: "License Software", icon: "📜", badge: "2 ใกล้หมด" },
      { href: "/subscriptions", label: "Subscription", icon: "💳" },
      { href: "/budget", label: "Budget Forecast", icon: "💰" },
      { href: "/licenses/by-asset", label: "License ต่อเครื่อง", icon: "🖥️" }
    ]
  },
  {
    title: "Vendor",
    icon: "🏢",
    items: [
      { href: "/vendors", label: "ผู้ขายทั้งหมด", icon: "🏢" },
      { href: "/vendors/new", label: "เพิ่มผู้ขาย", icon: "➕" }
    ]
  },
  {
    title: "Security",
    icon: "🔐",
    items: [
      { href: "/vault", label: "Credential Vault", icon: "🔐" },
      { href: "/audit-log", label: "Audit Log", icon: "📋" }
    ]
  },
  {
    title: "HR",
    icon: "👥",
    items: [{ href: "/offboarding", label: "Offboarding", icon: "👋" }]
  },
  {
    title: "ระบบ",
    icon: "⚙️",
    items: [
      { href: "/knowledge-base", label: "Knowledge Base", icon: "📚" },
      { href: "/reports", label: "รายงาน", icon: "📈" },
      { href: "/users", label: "ผู้ใช้งาน", icon: "👥" },
      { href: "/settings", label: "ตั้งค่าระบบ", icon: "⚙️" }
    ]
  }
];

export const modules: ModuleDefinition[] = [
  {
    id: "calendar",
    path: "/calendar",
    icon: "📅",
    title: "ปฏิทิน IT",
    subtitle: "รวมกำหนด PM, License, Subscription และ Ticket ที่ต้องติดตาม",
    group: "ภาพรวม",
    special: "calendar",
    primaryAction: "เพิ่มเหตุการณ์"
  },
  {
    id: "tickets",
    path: "/tickets",
    icon: "🎫",
    title: "Service Ticket",
    subtitle: "รับแจ้งปัญหา ติดตาม SLA และสถานะการแก้ไข",
    group: "Service Desk",
    primaryAction: "แจ้งปัญหาใหม่",
    createTitle: "แจ้งปัญหาใหม่",
    defaultStatus: "เปิด",
    codePrefix: "TKT",
    filters: quickFilters,
    createFields: ticketFields,
    columns: [
      { key: "code", label: "เลขที่", tone: "strong" },
      { key: "title", label: "หัวข้อปัญหา", tone: "strong" },
      { key: "owner", label: "ผู้แจ้ง" },
      { key: "meta.assignee", label: "รับผิดชอบ" },
      { key: "priority", label: "ระดับ", tone: "status" },
      { key: "meta.sla", label: "SLA" },
      { key: "status", label: "สถานะ", tone: "status" }
    ]
  },
  {
    id: "tickets",
    path: "/tickets/new",
    icon: "➕",
    title: "แจ้งปัญหาใหม่",
    subtitle: "สร้าง Ticket พร้อมรายละเอียด อุปกรณ์ และระดับความเร่งด่วน",
    group: "Service Desk",
    createTitle: "ฟอร์มแจ้งปัญหา",
    defaultStatus: "เปิด",
    codePrefix: "TKT",
    createFields: ticketFields
  },
  {
    id: "service-requests",
    path: "/service-requests",
    icon: "📋",
    title: "Service Request",
    subtitle: "คำขอบริการ IT ที่ไม่ใช่งานซ่อม เช่น software, cloud, email",
    group: "Service Desk",
    primaryAction: "ยื่นคำขอใหม่",
    defaultStatus: "รออนุมัติ",
    codePrefix: "SR",
    filters: quickFilters,
    createFields: [
      { name: "title", label: "หัวข้อคำขอ *", type: "text", required: true, target: "title" },
      { name: "description", label: "รายละเอียดคำขอ", type: "textarea", target: "description" },
      { name: "category", label: "ประเภท", type: "select", options: ["Software", "Hardware", "Cloud", "Account"], target: "category" },
      { name: "owner", label: "ผู้ขอ", type: "text", target: "owner" },
      { name: "department", label: "แผนก", type: "select", options: departmentOptions, target: "department" }
    ],
    columns: [
      { key: "code", label: "เลขที่", tone: "strong" },
      { key: "title", label: "หัวข้อคำขอ", tone: "strong" },
      { key: "category", label: "ประเภท" },
      { key: "owner", label: "ผู้ขอ" },
      { key: "meta.assignee", label: "ผู้รับผิดชอบ" },
      { key: "status", label: "สถานะ", tone: "status" },
      { key: "meta.requestDate", label: "วันที่ขอ", tone: "date" }
    ]
  },
  {
    id: "access-requests",
    path: "/access-requests",
    icon: "🔑",
    title: "Access Request",
    subtitle: "ขอสิทธิ์ระบบ โฟลเดอร์ VPN และทรัพยากรสำคัญ",
    group: "Service Desk",
    primaryAction: "ขอสิทธิ์ใหม่",
    defaultStatus: "รออนุมัติ",
    codePrefix: "AR",
    filters: quickFilters,
    createFields: [
      { name: "title", label: "ระบบ/ทรัพยากร *", type: "text", required: true, target: "title" },
      { name: "description", label: "เหตุผล", type: "textarea", target: "description" },
      { name: "permission", label: "ระดับสิทธิ์", type: "text", placeholder: "Read only, Admin, VPN" },
      { name: "owner", label: "ผู้ขอ", type: "text", target: "owner" },
      { name: "department", label: "แผนก", type: "select", options: departmentOptions, target: "department" },
      { name: "dueDate", label: "สิ้นสุดสิทธิ์", type: "date", target: "dueDate" }
    ],
    columns: [
      { key: "code", label: "#", tone: "strong" },
      { key: "owner", label: "ผู้ขอ" },
      { key: "title", label: "ระบบ/ทรัพยากร", tone: "strong" },
      { key: "meta.permission", label: "ระดับสิทธิ์" },
      { key: "dueDate", label: "ระยะเวลา", tone: "date" },
      { key: "status", label: "สถานะ", tone: "status" },
      { key: "createdAt", label: "วันที่ขอ", tone: "date" }
    ]
  },
  {
    id: "pm-calendar",
    path: "/pm-calendar",
    icon: "🔧",
    title: "PM Calendar",
    subtitle: "แผนบำรุงรักษาเชิงป้องกันและงานประจำของ IT",
    group: "Service Desk",
    primaryAction: "เพิ่ม PM",
    defaultStatus: "วางแผน",
    codePrefix: "PM",
    createFields: [
      { name: "title", label: "ชื่องาน PM *", type: "text", required: true, target: "title" },
      { name: "asset", label: "อุปกรณ์", type: "text" },
      { name: "category", label: "ความถี่", type: "select", options: ["weekly", "monthly", "quarterly", "yearly"], target: "category" },
      { name: "dueDate", label: "กำหนดครั้งถัดไป", type: "date", target: "dueDate" },
      { name: "owner", label: "ผู้รับผิดชอบ", type: "text", target: "owner" },
      { name: "color", label: "สี", type: "color" },
      { name: "description", label: "รายละเอียด", type: "textarea", target: "description" }
    ],
    columns: [
      { key: "title", label: "ชื่องาน PM", tone: "strong" },
      { key: "meta.asset", label: "อุปกรณ์" },
      { key: "category", label: "ความถี่" },
      { key: "dueDate", label: "กำหนดวัน", tone: "date" },
      { key: "meta.lastDone", label: "ทำล่าสุด" },
      { key: "owner", label: "ผู้รับผิดชอบ" }
    ]
  },
  {
    id: "assets",
    path: "/assets",
    icon: "💻",
    title: "ทะเบียนอุปกรณ์ IT",
    subtitle: "Asset register, serial, warranty, risk และผู้ถือครอง",
    group: "Asset Management",
    primaryAction: "เพิ่มอุปกรณ์",
    defaultStatus: "ใช้งาน",
    codePrefix: "IT",
    filters: [
      { name: "q", label: "ค้นหา", type: "text", placeholder: "ค้นหา Asset Tag, ชื่อ, Serial, Model..." },
      { name: "status", label: "สถานะ", type: "select", options: ["ทั้งหมด", "ใช้งาน", "ว่าง", "ซ่อม", "จำหน่าย"] },
      { name: "category", label: "ประเภท", type: "select", options: ["ทั้งหมด", "Notebook", "Desktop", "Monitor", "Network", "Printer"] }
    ],
    createFields: assetFields,
    columns: [
      { key: "code", label: "Asset Tag", tone: "strong" },
      { key: "title", label: "ชื่ออุปกรณ์", tone: "strong" },
      { key: "category", label: "ประเภท" },
      { key: "meta.serial", label: "Serial No." },
      { key: "owner", label: "ผู้ถือครอง" },
      { key: "department", label: "แผนก" },
      { key: "status", label: "สถานะ", tone: "status" },
      { key: "meta.warranty", label: "Warranty" },
      { key: "meta.risk", label: "Risk", tone: "status" }
    ]
  },
  {
    id: "checkout",
    path: "/checkout",
    icon: "📦",
    title: "รับ-คืนอุปกรณ์",
    subtitle: "บันทึกการยืม คืน และสภาพอุปกรณ์",
    group: "Asset Management",
    primaryAction: "Checkout อุปกรณ์",
    defaultStatus: "ยืมอยู่",
    codePrefix: "CO",
    filters: [{ name: "q", label: "ค้นหา", type: "text", placeholder: "ค้นหา Asset Tag, ชื่อ, ผู้รับ..." }],
    createFields: [
      { name: "title", label: "รายการยืม *", type: "text", required: true, target: "title" },
      { name: "assetTag", label: "Asset Tag", type: "text", placeholder: "IT-2569-00001" },
      { name: "owner", label: "ผู้รับอุปกรณ์", type: "text", target: "owner" },
      { name: "dueDate", label: "กำหนดคืน", type: "date", target: "dueDate" },
      { name: "condition", label: "สภาพเมื่อรับ", type: "text" },
      { name: "description", label: "หมายเหตุ", type: "textarea", target: "description" }
    ],
    columns: [
      { key: "title", label: "อุปกรณ์", tone: "strong" },
      { key: "owner", label: "ผู้รับอุปกรณ์" },
      { key: "createdAt", label: "วันที่รับ", tone: "date" },
      { key: "dueDate", label: "กำหนดคืน", tone: "date" },
      { key: "meta.condition", label: "สภาพเมื่อรับ" },
      { key: "status", label: "สถานะ", tone: "status" }
    ]
  },
  {
    id: "asset-requests",
    path: "/asset-requests",
    icon: "📝",
    title: "คำขออุปกรณ์",
    subtitle: "รับคำขอและจัดสรรอุปกรณ์ให้ผู้ใช้งาน",
    group: "Asset Management",
    primaryAction: "ยื่นคำขอใหม่",
    defaultStatus: "รอจัดสรร",
    codePrefix: "REQ-ASSET",
    createFields: [
      { name: "title", label: "ประเภทอุปกรณ์ที่ต้องการ *", type: "text", required: true, target: "title" },
      { name: "description", label: "เหตุผลที่ขอ *", type: "textarea", required: true, target: "description" },
      { name: "priority", label: "ระดับความเร่งด่วน", type: "select", options: priorityOptions, target: "priority" },
      { name: "owner", label: "ผู้ขอ", type: "text", target: "owner" },
      { name: "department", label: "แผนก", type: "select", options: departmentOptions, target: "department" }
    ],
    columns: [
      { key: "code", label: "#", tone: "strong" },
      { key: "owner", label: "ผู้ขอ" },
      { key: "category", label: "ประเภทที่ขอ" },
      { key: "description", label: "เหตุผล" },
      { key: "priority", label: "ระดับ", tone: "status" },
      { key: "status", label: "สถานะ", tone: "status" },
      { key: "meta.assignedAsset", label: "อุปกรณ์ที่ได้รับ" }
    ]
  },
  {
    id: "qr-scanner",
    path: "/qr-scanner",
    icon: "📷",
    title: "QR Scanner",
    subtitle: "ค้นหา Asset Tag จาก QR หรือกรอกเลขอุปกรณ์",
    group: "Asset Management",
    special: "qr"
  },
  {
    id: "asset-audit",
    path: "/asset-audit",
    icon: "📊",
    title: "ตรวจนับทรัพย์สิน",
    subtitle: "สร้างรอบตรวจนับและติดตามความครบถ้วนของสินทรัพย์",
    group: "Asset Management",
    primaryAction: "เริ่มตรวจนับใหม่",
    defaultStatus: "กำลังตรวจ",
    codePrefix: "AUDIT",
    createFields: [
      { name: "title", label: "ชื่อรอบตรวจนับ *", type: "text", required: true, target: "title" },
      { name: "category", label: "พื้นที่/สาขา", type: "text", target: "category" },
      { name: "owner", label: "ผู้รับผิดชอบ", type: "text", target: "owner" },
      { name: "dueDate", label: "กำหนดเสร็จ", type: "date", target: "dueDate" },
      { name: "description", label: "รายละเอียด", type: "textarea", target: "description" }
    ],
    columns: [
      { key: "code", label: "รอบตรวจ" },
      { key: "title", label: "ชื่อรอบ", tone: "strong" },
      { key: "category", label: "พื้นที่" },
      { key: "owner", label: "ผู้รับผิดชอบ" },
      { key: "meta.progress", label: "ความคืบหน้า" },
      { key: "status", label: "สถานะ", tone: "status" }
    ]
  },
  {
    id: "licenses",
    path: "/licenses",
    icon: "📜",
    title: "License Software",
    subtitle: "บริหาร software license, seats, วันหมดอายุ และค่าใช้จ่าย",
    group: "License & Cost",
    primaryAction: "เพิ่ม License",
    defaultStatus: "ใช้งาน",
    codePrefix: "LIC",
    filters: [
      { name: "q", label: "ค้นหา", type: "text", placeholder: "ค้นหาชื่อ Software..." },
      { name: "status", label: "สถานะ", type: "select", options: ["ทั้งหมด", "ใช้งาน", "ใกล้หมด", "หมดอายุ", "ยกเลิก"] }
    ],
    createFields: licenseFields,
    columns: [
      { key: "title", label: "Software", tone: "strong" },
      { key: "category", label: "ประเภท" },
      { key: "meta.vendor", label: "Vendor" },
      { key: "meta.seatsUsed", label: "Seats ใช้" },
      { key: "dueDate", label: "หมดอายุ", tone: "date" },
      { key: "costMonthly", label: "ค่าใช้จ่าย", tone: "money" },
      { key: "status", label: "สถานะ", tone: "status" }
    ]
  },
  {
    id: "subscriptions",
    path: "/subscriptions",
    icon: "💳",
    title: "Subscription",
    subtitle: "ติดตามค่าบริการรายเดือน รอบชำระ และ auto-renew",
    group: "License & Cost",
    primaryAction: "เพิ่ม Subscription",
    defaultStatus: "ใช้งาน",
    codePrefix: "SUB",
    createFields: [
      { name: "title", label: "ชื่อบริการ *", type: "text", required: true, target: "title" },
      { name: "category", label: "ประเภท", type: "select", options: ["Cloud", "Infrastructure", "Software", "Other"], target: "category" },
      { name: "cycle", label: "รอบชำระ", type: "select", options: ["monthly", "quarterly", "yearly"] },
      { name: "costMonthly", label: "ค่าบริการ/เดือน", type: "number", target: "costMonthly" },
      { name: "dueDate", label: "ชำระถัดไป", type: "date", target: "dueDate" },
      { name: "autoRenew", label: "Auto-renew", type: "checkbox" }
    ],
    columns: [
      { key: "title", label: "ชื่อบริการ", tone: "strong" },
      { key: "category", label: "ประเภท" },
      { key: "meta.cycle", label: "รอบชำระ" },
      { key: "costMonthly", label: "ค่าบริการ/เดือน", tone: "money" },
      { key: "dueDate", label: "ชำระถัดไป", tone: "date" },
      { key: "meta.autoRenew", label: "Auto-renew" },
      { key: "status", label: "สถานะ", tone: "status" }
    ]
  },
  {
    id: "budget",
    path: "/budget",
    icon: "💰",
    title: "Budget Forecast",
    subtitle: "มองค่าใช้จ่ายรายเดือน รายปี และหมวดงบ IT",
    group: "License & Cost",
    columns: [
      { key: "title", label: "ชื่อ", tone: "strong" },
      { key: "category", label: "หมวด" },
      { key: "meta.vendor", label: "Vendor" },
      { key: "status", label: "รอบชำระ" },
      { key: "costMonthly", label: "ค่าใช้จ่าย/เดือน", tone: "money" },
      { key: "meta.annual", label: "ค่าใช้จ่าย/ปี", tone: "money" }
    ]
  },
  {
    id: "licenses",
    path: "/licenses/by-asset",
    icon: "🖥️",
    title: "License ต่อเครื่อง",
    subtitle: "ดู license ที่ผูกกับอุปกรณ์แต่ละเครื่อง",
    group: "License & Cost",
    columns: [
      { key: "code", label: "Asset Tag", tone: "strong" },
      { key: "title", label: "ชื่อเครื่อง", tone: "strong" },
      { key: "department", label: "แผนก / ผู้ถือครอง" },
      { key: "status", label: "สถานะ", tone: "status" },
      { key: "meta.seatsUsed", label: "License ที่ Assign" },
      { key: "costMonthly", label: "ค่าใช้จ่าย", tone: "money" }
    ]
  },
  {
    id: "vendors",
    path: "/vendors",
    icon: "🏢",
    title: "จัดการผู้ขาย",
    subtitle: "ข้อมูลผู้ขาย ผู้ติดต่อ สัญญา และสถานะการใช้งาน",
    group: "Vendor",
    primaryAction: "เพิ่มผู้ขาย",
    defaultStatus: "active",
    codePrefix: "VEN",
    filters: [
      { name: "q", label: "ค้นหา", type: "text", placeholder: "ค้นหาชื่อ, ผู้ติดต่อ, Email..." },
      { name: "category", label: "ประเภท", type: "select", options: ["ทั้งหมด", "Software", "Hardware", "Infrastructure", "Service"] }
    ],
    createFields: vendorFields,
    columns: [
      { key: "title", label: "ผู้ขาย", tone: "strong" },
      { key: "category", label: "ประเภท" },
      { key: "owner", label: "ผู้ติดต่อ" },
      { key: "meta.email", label: "Email" },
      { key: "dueDate", label: "หมดสัญญา", tone: "date" },
      { key: "status", label: "สถานะ", tone: "status" }
    ]
  },
  {
    id: "vendors",
    path: "/vendors/new",
    icon: "➕",
    title: "เพิ่มผู้ขาย",
    subtitle: "บันทึก vendor พร้อมผู้ติดต่อและเงื่อนไขสัญญา",
    group: "Vendor",
    createTitle: "ข้อมูลผู้ขาย",
    defaultStatus: "active",
    codePrefix: "VEN",
    createFields: vendorFields
  },
  {
    id: "vault",
    path: "/vault",
    icon: "🔐",
    title: "Credential Vault",
    subtitle: "เก็บรายการ credential สำคัญพร้อมระดับสิทธิ์และรอบหมุนเวียน",
    group: "Security",
    primaryAction: "เพิ่ม Credential",
    defaultStatus: "restricted",
    codePrefix: "VAULT",
    createFields: [
      { name: "title", label: "ชื่อ / คำอธิบาย *", type: "text", required: true, target: "title" },
      { name: "username", label: "Username", type: "text" },
      { name: "passwordHint", label: "Password", type: "password", placeholder: "เก็บแบบซ่อนในระบบจริง" },
      { name: "url", label: "URL / Host", type: "text" },
      { name: "category", label: "ประเภท", type: "select", options: ["Database", "Network", "Server", "SaaS", "Other"], target: "category" },
      { name: "accessLevel", label: "Access Level", type: "select", options: ["super_admin", "admin", "it_only", "shared"] },
      { name: "rotationDays", label: "หมุนเวียนทุก (วัน)", type: "number" },
      { name: "description", label: "หมายเหตุ", type: "textarea", target: "description" }
    ],
    columns: [
      { key: "title", label: "ชื่อ / ประเภท", tone: "strong" },
      { key: "meta.username", label: "Username" },
      { key: "meta.url", label: "URL / Host" },
      { key: "meta.passwordHint", label: "Password" },
      { key: "dueDate", label: "หมุนเวียน", tone: "date" },
      { key: "meta.accessLevel", label: "Access" },
      { key: "owner", label: "เพิ่มโดย" }
    ]
  },
  {
    id: "audit-log",
    path: "/audit-log",
    icon: "📋",
    title: "Audit Log",
    subtitle: "ตรวจสอบการเข้าสู่ระบบและกิจกรรมสำคัญ",
    group: "Security",
    columns: [
      { key: "createdAt", label: "เวลา", tone: "date" },
      { key: "owner", label: "ผู้ดำเนินการ" },
      { key: "category", label: "Module" },
      { key: "title", label: "Action", tone: "strong" },
      { key: "code", label: "ID" },
      { key: "meta.ipAddress", label: "IP Address" }
    ]
  },
  {
    id: "offboarding",
    path: "/offboarding",
    icon: "👋",
    title: "Offboarding",
    subtitle: "เก็บคืนอุปกรณ์ ปิดสิทธิ์ และบันทึก checklist พนักงานออก",
    group: "HR",
    primaryAction: "สร้าง Offboarding",
    defaultStatus: "รอดำเนินการ",
    codePrefix: "OFF",
    createFields: [
      { name: "title", label: "ชื่อรายการ *", type: "text", required: true, target: "title" },
      { name: "owner", label: "พนักงาน / ผู้ประสานงาน", type: "text", target: "owner" },
      { name: "department", label: "แผนก", type: "select", options: departmentOptions, target: "department" },
      { name: "dueDate", label: "วันสิ้นสุดงาน", type: "date", target: "dueDate" },
      { name: "description", label: "รายละเอียด", type: "textarea", target: "description" }
    ],
    columns: [
      { key: "code", label: "เลขที่" },
      { key: "title", label: "รายการ", tone: "strong" },
      { key: "owner", label: "ผู้เกี่ยวข้อง" },
      { key: "meta.assetsReturn", label: "คืนอุปกรณ์" },
      { key: "meta.accessRevoke", label: "ปิดสิทธิ์" },
      { key: "dueDate", label: "กำหนด", tone: "date" },
      { key: "status", label: "สถานะ", tone: "status" }
    ]
  },
  {
    id: "knowledge-base",
    path: "/knowledge-base",
    icon: "📚",
    title: "Knowledge Base",
    subtitle: "บทความวิธีแก้ปัญหาและคู่มือสำหรับผู้ใช้",
    group: "ระบบ",
    primaryAction: "เขียนบทความ",
    defaultStatus: "draft",
    codePrefix: "KB",
    createFields: [
      { name: "title", label: "ชื่อบทความ *", type: "text", required: true, target: "title" },
      { name: "category", label: "หมวด", type: "select", options: ["Service Desk", "Network", "Software", "Security"], target: "category" },
      { name: "tags", label: "Tags", type: "text", placeholder: "ticket, vpn" },
      { name: "description", label: "เนื้อหา", type: "textarea", target: "description" },
      { name: "status", label: "สถานะ", type: "select", options: ["draft", "published"], target: "status" }
    ],
    columns: [
      { key: "code", label: "เลขที่" },
      { key: "title", label: "บทความ", tone: "strong" },
      { key: "category", label: "หมวด" },
      { key: "meta.tags", label: "Tags" },
      { key: "meta.views", label: "Views" },
      { key: "status", label: "สถานะ", tone: "status" }
    ]
  },
  {
    id: "reports",
    path: "/reports",
    icon: "📈",
    title: "รายงาน",
    subtitle: "ส่งออกข้อมูล Asset, Ticket, License และสรุปผู้บริหาร",
    group: "ระบบ",
    special: "reports"
  },
  {
    id: "users",
    path: "/users",
    icon: "👥",
    title: "จัดการผู้ใช้งาน",
    subtitle: "บัญชีผู้ใช้ Role แผนก และสถานะการใช้งาน",
    group: "ระบบ",
    primaryAction: "เพิ่มผู้ใช้",
    defaultStatus: "active",
    codePrefix: "USR",
    createFields: [
      { name: "title", label: "ชื่อ-นามสกุล *", type: "text", required: true, target: "title" },
      { name: "owner", label: "Username *", type: "text", required: true, target: "owner" },
      { name: "email", label: "Email *", type: "email", required: true },
      { name: "password", label: "รหัสผ่านเริ่มต้น *", type: "password", required: true },
      { name: "phone", label: "เบอร์โทร", type: "text" },
      { name: "category", label: "Role", type: "select", options: ["super_admin", "admin", "it_staff", "user"], target: "category" },
      { name: "department", label: "แผนก", type: "select", options: departmentOptions, target: "department" }
    ],
    columns: [
      { key: "title", label: "ผู้ใช้", tone: "strong" },
      { key: "owner", label: "Username" },
      { key: "meta.email", label: "Email" },
      { key: "category", label: "Role", tone: "status" },
      { key: "department", label: "แผนก" },
      { key: "meta.lastLogin", label: "เข้าล่าสุด" },
      { key: "status", label: "สถานะ", tone: "status" }
    ]
  },
  {
    id: "settings",
    path: "/settings",
    icon: "⚙️",
    title: "ตั้งค่าระบบ",
    subtitle: "ชื่อระบบ SLA notification และข้อจำกัด upload",
    group: "ระบบ",
    special: "settings",
    createFields: [
      { name: "title", label: "ชื่อระบบ", type: "text", target: "title" },
      { name: "company", label: "ชื่อองค์กร", type: "text" },
      { name: "companyEmail", label: "Email องค์กร", type: "email" },
      { name: "companyPhone", label: "โทรศัพท์องค์กร", type: "text" },
      { name: "lowSla", label: "ต่ำ (Low)", type: "number" },
      { name: "mediumSla", label: "ปกติ (Medium)", type: "number" },
      { name: "highSla", label: "สูง (High)", type: "number" },
      { name: "criticalSla", label: "วิกฤต (Critical)", type: "number" },
      { name: "itemsPerPage", label: "รายการต่อหน้า", type: "number" },
      { name: "maxUploadMb", label: "ขนาด Upload สูงสุด (MB)", type: "number" }
    ]
  },
  {
    id: "profile",
    path: "/profile",
    icon: "SA",
    title: "โปรไฟล์ของฉัน",
    subtitle: "ข้อมูลส่วนตัวและการเปลี่ยนรหัสผ่าน",
    group: "ระบบ",
    special: "profile",
    createFields: [
      { name: "title", label: "ชื่อ-นามสกุล *", type: "text", required: true, target: "title" },
      { name: "email", label: "Email", type: "email" },
      { name: "phone", label: "เบอร์โทร", type: "text" },
      { name: "lineUserId", label: "LINE User ID", type: "text" },
      { name: "password", label: "Password ใหม่", type: "password" }
    ]
  }
];

export function getModuleByPath(path: string) {
  return modules.find((module) => module.path === path);
}

export function getModuleFromSlug(slug?: string[]) {
  const path = `/${(slug || []).join("/")}`.replace(/\/$/, "") || "/dashboard";
  return getModuleByPath(path);
}
