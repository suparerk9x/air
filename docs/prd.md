# Air — Product Requirements Document (PRD)

## 1. Vision

**Air** เป็นส่วนหนึ่งของ **The End-to-End Scalable Co-Hosting System** — ระบบที่เปลี่ยน local hosts และ community homestays ให้เป็นธุรกิจที่ scalable ได้

> Transforming Local & Community Stays into Scalable Businesses

ดู [system-overview.md](system-overview.md) สำหรับ vision diagram ฉบับเต็ม

## 2. Problem Statement

Co-hosts ที่จัดการหลาย properties พร้อมกันเผชิญปัญหา:

- **ไม่มี central view** — ต้องเช็ค Airbnb, Booking.com แยกกัน
- **Inventory ไม่มีระบบ** — ไม่รู้ว่าของหมดเมื่อไหร่ ซื้อซ้ำ/ขาด
- **Housekeeping วุ่นวาย** — ไม่รู้ว่าวันนี้ต้องทำความสะอาดห้องไหน
- **ข้อมูลไม่แยก tenant** — ถ้าจ้าง co-host เพิ่ม แต่ละคนเห็นข้อมูลทุก property

## 3. Target User

| Persona | Description |
|---------|-------------|
| **Co-host หลัก** | จัดการ 3-20 properties, ต้องการ overview ทั้งหมดในที่เดียว |
| **Co-host ย่อย** | ดูแลเฉพาะ properties ที่ได้รับมอบหมาย |
| **เจ้าของที่พัก** | ต้องการเห็น booking calendar และ performance ของ property ตัวเอง |

## 4. Success Metrics (จาก Pilot)

| Metric | Target | Pilot Result |
|--------|--------|-------------|
| Occupancy rate | > 60% | 70% avg. |
| Operation cost | ลด 10% | ลด 15% |
| Guest rating | > 4.8/5 | 4.97/5 |
| Owner dependency | ลดลง | Less |
| Quality | Standardized | Standardized |

## 5. Feature Scope

### Phase 1: Pre-Stay & Setup — ✅ Done

| Feature | Description | Status |
|---------|-------------|--------|
| Property Management | CRUD properties พร้อม platform tag (Airbnb/Booking), สี, ที่อยู่ | ✅ |
| iCal Sync | Import bookings จาก Airbnb/Booking.com ผ่าน iCal URL | ✅ |
| Multi-tenant Auth | JWT sessions, แต่ละ user เห็นเฉพาะ properties ของตัวเอง | ✅ |
| Login / Register | Email + password, bcrypt hashing | ✅ |

### Phase 2: During Stay & Operations — ✅ Done

| Feature | Description | Status |
|---------|-------------|--------|
| Calendar View (Monthly) | Grid view แสดง bookings ทุก property พร้อม color coding | ✅ |
| Timeline View | Gantt-style view แสดง bookings แนวนอน | ✅ |
| Booking Management | สร้าง/แก้ไข/ลบ booking, เปลี่ยน status (Confirmed → Checked-in → Checked-out) | ✅ |
| Today Panel | แสดง check-in/check-out/cleaning วันนี้ | ✅ |
| Stats Bar | Occupancy rate, booked nights, avg stay, property count | ✅ |
| Notifications | แจ้ง check-in/check-out ของวันพรุ่งนี้ | ✅ |
| Inventory Master Catalog | รายการสินค้ากลาง 5 หมวด (Linen, Amenity, Equipment, Consumable, Maintenance) | ✅ |
| Stock per Property | จำนวน stock แยกตาม property | ✅ |
| Auto-deduct on Checkout | หักจำนวนอัตโนมัติตาม `usagePerCheckout` เมื่อ guest checkout | ✅ |
| Low Stock Alerts | แจ้งเตือนเมื่อ stock ต่ำกว่า `minStock` | ✅ |
| Stock Audit Log | บันทึกทุกการเคลื่อนไหว (Restock, Use, Adjustment, Transfer) | ✅ |
| Stock Counter | หน้า POS-style สำหรับนับ stock จริง (Restock mode / Count mode) | ✅ |
| Item Setup | CRUD inventory items พร้อม upload รูป, ตั้ง threshold | ✅ |
| Maintenance Tasks | สร้าง/ติดตาม งานซ่อม พร้อม priority, assignee, cost | ✅ |
| Housekeeping Tasks | Task อัตโนมัติเมื่อ guest checkout, assign แม่บ้าน | ✅ |
| Image Upload | Upload รูปสินค้าสำหรับ inventory items | ✅ |
| Sync Button | Manual sync iCal พร้อมแสดง last sync time | ✅ |

### Phase 3: Post-Stay & Growth — 🔲 Planned

| Feature | Description | Status |
|---------|-------------|--------|
| Reputation Engine | จัดการรีวิว, ระบบ repeat booking | 🔲 |
| Smart Communication | Chatbot สำหรับแขก (multi-language) | 🔲 |
| Performance Reports | รายงานผลการดำเนินงานให้เจ้าของ | 🔲 |
| SOP Documentation | เอกสาร Standard Operating Procedures | 🔲 |
| Digital Local Guide | คู่มือท้องถิ่นสำหรับแขก | 🔲 |

## 6. User Flows

### Flow 1: Login → Dashboard
```
Register/Login → Dashboard (Calendar) → เห็นเฉพาะ properties ของตัวเอง
```

### Flow 2: เพิ่ม Property + Sync
```
กด + Property → กรอกชื่อ, ที่อยู่, iCal URL → Save
→ กด Sync → Import bookings จาก iCal → แสดงบน Calendar
```

### Flow 3: จัดการ Inventory
```
Inventory → Items → เพิ่มสินค้า (ชื่อ, หมวด, unit, minStock)
→ Counter → เลือก Property → นับ stock → Submit
→ Overview → ดู low stock alerts, stock history
```

### Flow 4: Housekeeping
```
Guest checkout → ระบบสร้าง Housekeeping Task อัตโนมัติ
→ Assign แม่บ้าน → Mark as Completed
→ Auto-deduct consumables จาก stock
```

## 7. Non-Functional Requirements

| Requirement | Spec |
|-------------|------|
| Auth | JWT with HttpOnly cookies, 7-day expiry |
| Multi-tenant | ทุก query filter ด้วย userId, verify ownership ก่อน CRUD |
| Performance | PM2 zero-downtime reload, Next.js static optimization |
| SSL | Wildcard cert *.lightepic.com ผ่าน Cloudflare |
| Backup | Database backup script พร้อม 7-day retention |
| Monitoring | Health check endpoint, PM2 logs, monitor script |

## 8. API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/auth/me` | Current user profile |

### Properties
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/properties` | List user's properties + bookings |
| POST | `/api/properties` | Create property |
| GET | `/api/properties/[id]` | Get property detail |
| PUT | `/api/properties/[id]` | Update property |
| DELETE | `/api/properties/[id]` | Delete property + bookings |
| POST | `/api/properties/[id]/sync` | Sync iCal feed |

### Bookings
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/bookings` | List bookings (filter: from, to, propertyId) |
| POST | `/api/bookings` | Create manual booking |
| PATCH | `/api/bookings/[id]` | Update booking status/notes |
| DELETE | `/api/bookings/[id]` | Delete booking |

### Inventory
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/inventory/items` | List items + stock per property |
| POST | `/api/inventory/items` | Create item |
| PUT | `/api/inventory/items/[id]` | Update item |
| DELETE | `/api/inventory/items/[id]` | Delete item |
| POST | `/api/inventory/stock` | Log stock movement |
| GET | `/api/inventory/stock` | Get stock logs |
| GET | `/api/inventory/today` | Today's dashboard data |
| GET | `/api/inventory/maintenance` | List maintenance tasks |
| POST | `/api/inventory/maintenance` | Create task |
| PATCH | `/api/inventory/maintenance/[id]` | Update task |
| DELETE | `/api/inventory/maintenance/[id]` | Delete task |
| POST | `/api/inventory/seed` | Seed demo inventory data |

### Utilities
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/upload` | Upload image file |
| POST | `/api/seed` | Seed full demo data |
