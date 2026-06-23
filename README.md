# IT V1

ระบบ ITAM Desk สำหรับจัดการ Service Desk, IT Assets, License, Vendor, Credential Vault, Reports และผู้ใช้งาน

## Local

```bash
npm.cmd install
npm.cmd run dev
```

เปิด `http://localhost:3000` แล้วเข้าสู่ระบบด้วย:

- Username: `admin`
- Password: `Admin@1234`

ถ้าไม่มี `DATABASE_URL` ระบบจะใช้ `data/local-db.json` สำหรับทดสอบในเครื่อง

## Railway

ตั้งค่า environment variables:

- `DATABASE_URL` จาก Railway PostgreSQL
- `SESSION_SECRET` เป็นค่ายาวแบบสุ่ม
- `APP_URL` เป็น production URL

คำสั่ง deploy ใช้ `npm run build` และ `npm run start` ตาม `railway.json`
