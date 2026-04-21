# POS-Style Inventory Design Reference

> สรุปจาก molly-balls project (backoffice-app + pos-app) — ใช้เป็น reference สำหรับออกแบบ Air inventory

---

## 1. ภาพรวมระบบ

Molly-balls แบ่ง inventory ออกเป็น 2 app ที่ทำงานร่วมกัน:

| App | ใช้โดย | หน้าที่หลัก |
|-----|--------|-------------|
| **backoffice-app** | Manager / HQ | Master data, Central stock, Branch overview (matrix), Reports |
| **pos-app** | Staff / Cashier | Stock count, Receive stock, PO request, Daily operations |

### หลักการออกแบบที่สำคัญ
- **Backoffice** = ดูภาพรวม, ตั้งค่า, approve
- **POS** = ทำงานจริง, touch-friendly, ใช้ง่าย, ทำงาน offline ได้

---

## 2. Backoffice — Inventory Management

### 2.1 Branch Inventory (Matrix View)

ดู stock ทุก branch ในหน้าเดียว แบบ spreadsheet:

```
┌─────────────────┬──────────┬──────────┬──────────┐
│ Branch \ Item   │ ผ้าขนหนู  │ แชมพู     │ สบู่      │
├─────────────────┼──────────┼──────────┼──────────┤
│ สาขา A          │    12    │    0     │    5     │
│ สาขา B          │    24    │    —     │   16     │
└─────────────────┴──────────┴──────────┴──────────┘
```

**สิ่งที่ทำได้:**
- Toggle Matrix / List view
- Filter: branch, category, stock status, search
- คลิก cell → EditQuantityDialog → แก้จำนวนได้ทันที (UPSERT)
- Color coding: เขียว=ปกติ, เหลือง=ใกล้หมด, แดง=หมด, เทา=ไม่ได้ใช้
- Sticky header/column สำหรับ scroll ตาราง matrix ใหญ่ๆ
- Summary cards: Total items, Low stock, Out of stock, Not used

### 2.2 Central Stock (Warehouse)

จัดการคลังกลาง แบบ 4 tabs:

| Tab | หน้าที่ |
|-----|---------|
| Stock List | Card grid แสดง item + รูป + status + ปุ่ม Receive/Adjust/Movements |
| Receive | Form รับสินค้าเข้า: item, qty, cost, supplier, batch, expiry |
| Movements | ตาราง audit trail: before/after qty, movement type, created by |
| Alerts | Low stock + Out of stock alerts พร้อมปุ่ม action |

**Movement Types:**
- `receive` — รับเข้า
- `ship` — จัดส่ง
- `adjustment` — ปรับปรุง (damage, lost, return)
- `transfer_in` / `transfer_out` — โอนระหว่าง branch
- `initial` — ตั้งต้น

### 2.3 Product Settings (Master Data)

- CRUD stock items: name, SKU, category, unit, cost
- Dual unit system: Primary unit + Secondary unit + conversion rate
  - เช่น 1 กล่อง = 24 ชิ้น (rate = 24)
- Weighted Average Cost (WACC) tracking
- Price history popup
- Image upload
- Toggle track_stock on/off

### 2.4 Stock Count Report

- Variance analysis: counted vs expected
- Filter by date range, branch, category
- High variance items highlighted

---

## 3. POS App — Touch-First Inventory

### 3.1 Layout หน้าหลัก POS (ขายของ)

```
┌──────────────────────────────────────────────────────┐
│                    Header Bar                         │
├────────────┬────────────┬────────────────────────────┤
│  MENU GRID │ ORDER LIST │  CUSTOMER + REWARDS        │
│  (flex: 5) │ (flex: 3)  │  (flex: 3)                │
│            │            │                            │
│  3-col     │  compact   │  NumPad ค้นหาเบอร์           │
│  card grid │  qty ±     │  แสดง points               │
│  tap=add   │            │  rewards list              │
│            │  [ชำระเงิน]  │                            │
└────────────┴────────────┴────────────────────────────┘
```

**UX Pattern สำคัญ:**
- แตะ item = เพิ่มเข้า cart (qty+1 อัตโนมัติ)
- แตะซ้ำ = เพิ่ม qty
- ปุ่มใหญ่ (h-16, text-lg) สำหรับ touch
- `active:scale-95` + `touch-manipulation` ทุกปุ่ม
- Keyboard shortcuts: 0-9, Backspace, Enter, Escape

### 3.2 Inventory Page — 6 Tabs

```
[สต๊อก] [นับ] [สั่งซื้อ] [รายการ] [รับสินค้า] [อุปกรณ์]
```

#### Tab: สต๊อก (Current Stock)

```
┌────────────────────┬──────────────┐
│  TABLE (left)      │ SUMMARY (R)  │
│  Search + Filter   │ Total items  │
│  Item | Qty | Min  │ Low stock    │
│  Status badges     │ Out of stock │
│                    │ Total value  │
└────────────────────┴──────────────┘
```

#### Tab: นับ (Stock Count) ⭐ สำคัญมาก

**Split-screen design — ซ้ายเลือก ขวานับ:**

```
┌─────────────────┬──────────────────────┐
│  ITEMS GRID     │  COUNTED LIST        │
│  (2/5 width)    │  (3/5 width)         │
│                 │                      │
│  [Category A]   │  Progress: ████░ 80% │
│  ┌──┐ ┌──┐     │                      │
│  │🧴│ │🧹│     │  ผ้าขนหนู    12  (10)  │
│  └──┘ └──┘     │  แชมพู       5   (5)   │
│                 │  สบู่        8   (6)   │
│  [Category B]   │         [+] [-]      │
│  ┌──┐ ┌──┐     │                      │
│  │🪣│ │🧽│     │  variance highlight   │
│  └──┘ └──┘     │                      │
│                 │  [ส่งผลนับ]            │
└─────────────────┴──────────────────────┘
```

**Flow การนับ stock:**
1. ซ้าย: แสดง grid items แบ่งตาม category
2. แตะ item = เพิ่มเข้ารายการนับ (qty+1 ทุกครั้งที่แตะ)
3. ขวา: แสดงรายการที่นับแล้ว + expected qty + variance
4. ปุ่ม +/- ปรับจำนวนละเอียด
5. Progress bar แสดง % ที่นับแล้ว
6. ปุ่ม "ส่งผลนับ" enable เมื่อนับครบทุก item
7. Submit → อัพเดท inventory + สร้าง movement records

**ทำไมถึงใช้ง่าย:**
- แตะ = นับ (intuitive เหมือนกดเครื่องนับ)
- เห็น variance ทันที (counted vs expected)
- Progress bar บังคับนับครบ
- ไม่ต้อง type ตัวเลข — แตะซ้ำได้

#### Tab: รับสินค้า (Stock Receive)

UI เหมือน Stock Count — split screen:
- ซ้าย: เลือก items ที่จะรับ
- ขวา: ปรับจำนวน + submit
- สร้าง movement record อัตโนมัติ

#### Tab: สั่งซื้อ (Purchase Orders)

- สร้าง PO draft → submit ไป HQ
- HQ approve ใน backoffice
- รับของตาม PO ที่ approved
- Status flow: draft → pending → approved → shipped → completed

---

## 4. Data Model ที่น่าสนใจ

### Stock Status Logic
```
null qty        → "Not Used" (ไม่ได้ใช้งาน)
qty = 0         → "Out of Stock" (หมด)
0 < qty ≤ min   → "Low Stock" (ใกล้หมด)
qty > min       → "In Stock" (ปกติ)
qty > max       → "Overstocked" (เกิน) — central stock only
```

### Movement Audit Trail
ทุกการเปลี่ยนแปลง stock สร้าง record:
```
{
  stock_item_id, movement_type,
  quantity_before, quantity_after,
  reference_type, reference_id,   // link ไป PO, booking, etc.
  unit_cost, supplier_name,
  batch_number, expiry_date,
  created_by, created_at
}
```

### Dual Unit System
```
primary_unit: "กล่อง"     (หน่วยนับ)
secondary_unit: "ชิ้น"    (หน่วยย่อย)
conversion_rate: 24       (1 กล่อง = 24 ชิ้น)
```

---

## 5. Tech Patterns

### Touch-Friendly CSS
```css
/* ปุ่มใหญ่ กดง่าย */
.touch-btn {
  @apply h-16 text-lg active:scale-95 
         transition-transform touch-manipulation;
}

/* Card กดได้ มี feedback */
.touch-card {
  @apply rounded-xl shadow-md hover:shadow-xl 
         active:scale-95 transition-all 
         touch-manipulation;
}
```

### State Management
- **Zustand** — order/cart state (client-only, fast)
- **React Query** — server state (inventory, stock)
  - `staleTime: 30s` for inventory
  - Invalidation on mutation
- **Local state** — UI (modals, filters, search)

### Offline Support (POS)
- IndexedDB + AES encryption สำหรับ orders
- Background Sync API sync เมื่อ online
- PWA (Service Worker + Workbox)

### API Pattern (Supabase RPC)
```typescript
// Atomic operations ใช้ RPC functions
supabase.rpc('complete_stock_count', {
  p_branch_id, p_staff_id,
  p_items: [{ stock_item_id, expected_quantity, counted_quantity }]
});

supabase.rpc('receive_stock', {
  p_branch_id, p_stock_item_id, p_quantity, p_staff_id
});
```

---

## 6. สิ่งที่ Air ควรนำมาใช้

### ✅ ควรนำมาใช้แน่นอน
1. **Stock Count แบบ tap-to-count** — UX ดีมาก เหมาะกับการนับของใน property
2. **Split-screen layout** (ซ้ายเลือก ขวาจัดการ) — ใช้ได้กับ stock count + restock
3. **Movement audit trail** — ทุก stock change มี record (Air มีแล้วแต่ต้องปรับให้ครบ)
4. **Status color coding** — เขียว/เหลือง/แดง ดูง่าย
5. **Progress tracking** — นับครบถึง submit ได้
6. **Category grouping** — จัดกลุ่ม items ตาม category

### ⚠️ ปรับให้เหมาะกับ Air
- Air ไม่มี branch → ใช้ **Property** แทน (เหมือน branch)
- Air ไม่ต้องขายของ → ไม่ต้องมี cart/payment
- Air เน้น **checkout deduction** → auto-deduct เมื่อ guest check-out
- Air ต้องเชื่อมกับ **Booking** → stock ลดตาม booking ไม่ใช่ตาม order

### ❌ ไม่จำเป็นสำหรับ Air (ตอนนี้)
- Offline mode / PWA
- NumPad payment
- Customer loyalty / rewards
- Barcode scanning
- Weighted average cost
- Purchase Orders (อาจเพิ่มทีหลัง)

---

## 7. Proposed Air Inventory UX Flow

### Dashboard → Inventory → Stock Counter (POS-style)

```
┌─────────────────┬──────────────────────┐
│  ITEMS GRID     │  COUNT/RESTOCK LIST  │
│  (by category)  │                      │
│                 │  Property: [Villa A] │
│  [ผ้าเช็ดตัว]    │                      │
│  [หมอน]         │  ผ้าเช็ดตัว   ████  8  │
│  [แชมพู]        │  หมอน        ███░  3  │
│  [สบู่]          │  แชมพู       ██░░  2  │
│                 │                      │
│  tap = +1       │  [+] [-] per item   │
│                 │                      │
│                 │  Mode: [นับ] [เติม]   │
│                 │  [บันทึก]              │
└─────────────────┴──────────────────────┘
```

**2 Modes:**
1. **นับ (Count)** — นับ stock จริง → compare กับในระบบ → adjust
2. **เติม (Restock)** — เพิ่ม stock เข้า property → สร้าง RESTOCK movement

ทั้ง 2 modes ใช้ UI เดียวกัน แค่ behavior ต่างกัน
