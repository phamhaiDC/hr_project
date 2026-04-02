# Claude Code Prompt — WFM Mobile App (Phần Mobile)

## Bối cảnh

Bạn đang phát triển module **Mobile App** cho hệ thống **Workforce Management (WFM)** của Dcorp.

- **Công ty**: ~150 nhân viên, 2 chi nhánh (HCM, HN)
- **Stack giả định**: React Native (Expo) + TypeScript + REST API
- **Backend**: đã có sẵn các API endpoint cho Attendance, Leave, Shift, Location, Employee

---

## Nhiệm vụ: Implement Mobile App — WFM

### 1. Check-in / Check-out Screen

Xây dựng màn hình chấm công với các yêu cầu:

- **1-click check-in**: nút lớn, rõ ràng, phân biệt trạng thái In / Out
- Hiển thị **GPS hiện tại** (lat/lng) và **tên địa điểm** gần nhất
- Hiển thị **khoảng cách** từ vị trí hiện tại đến địa điểm làm việc (đơn vị: mét)
- Hiển thị **ca làm việc** đang áp dụng (Shift name, giờ bắt đầu/kết thúc)
- Nếu **ngoài office**: bắt buộc chọn **Task / SO** trước khi check-in
- Validation trước khi gửi:
  - GPS distance ≤ radius của location → cho phép
  - GPS distance > radius → cảnh báo, hỏi xác nhận hoặc chặn (theo config)
  - Phát hiện **Fake GPS** → chặn và hiển thị lỗi
  - **Device binding**: kiểm tra DeviceID có khớp không

**Anti-cheating layers:**
```
GPS Validation     → so sánh tọa độ với location radius
Device Binding     → lưu DeviceID lần đầu, check mỗi lần check-in
Fake GPS Detection → detect mock location (Android/iOS flag)
Selfie             → optional, có thể bật/tắt theo config
```

**API calls:**
```
POST /attendance/checkin
  body: { employee_id, time, type: "IN"|"OUT", gps: {lat, lng}, device_id, task_id? }

GET /locations
  → trả về list location, GPS, radius

GET /shifts/current?employee_id=xxx
  → ca làm việc hiện tại
```

---

### 2. Leave Request Screen

Màn hình tạo đơn xin nghỉ:

- Form fields:
  - **Loại nghỉ**: Annual / Sick / Unpaid / Other (dropdown)
  - **Từ ngày / Đến ngày**: date picker
  - **Lý do**: text area (bắt buộc)
  - **File đính kèm**: upload ảnh hoặc PDF (optional, max 5MB)
- Validate: to_date ≥ from_date, reason không được trống
- Hiển thị **số ngày phép còn lại** (Leave Balance) real-time
- Sau khi submit: chuyển về màn hình danh sách, hiển thị trạng thái `PENDING`

**API calls:**
```
POST /leaves
  body: { employee_id, type, from_date, to_date, reason, attachment? }

GET /leaves/balance?employee_id=xxx
  → { annual: 5, sick: 3, ... }
```

---

### 3. Attendance Adjustment Screen

Màn hình chấm công bổ sung (khi quên check-in/out):

- Chọn **ngày** cần điều chỉnh (không chọn ngày tương lai)
- Chọn **loại**: Check-in / Check-out
- Nhập **giờ** thực tế
- Nhập **lý do** (bắt buộc)
- Sau khi submit: theo dõi trạng thái `PENDING / APPROVED / REJECTED`
- Nếu bị **REJECTED**: hiển thị lý do từ chối

**API calls:**
```
POST /attendance/adjustment
  body: { employee_id, date, type: "IN"|"OUT", time, reason }

GET /attendance/adjustments?employee_id=xxx
  → list adjustments với status
```

---

### 4. Dashboard Screen (Home)

Màn hình tổng quan tháng hiện tại:

- **Tổng công**: số ngày/buổi đã làm trong tháng
- **Số lần đi trễ**: late count
- **Số ngày phép còn lại**: leave balance (Annual)
- **Trạng thái hôm nay**: đã check-in chưa, ca hiện tại
- **Quick action**: nút Check-in nhanh ngay từ Dashboard
- **Lịch mini**: hiển thị tháng hiện tại, tô màu các ngày:
  - Xanh lá: đi đủ
  - Đỏ: vắng / thiếu check-out
  - Vàng: đi trễ
  - Xám: ngày nghỉ / holiday

**API calls:**
```
GET /attendance/summary?employee_id=xxx&month=2026-04
  → { total_days, late_count, absent_count }

GET /leaves/balance?employee_id=xxx

GET /attendance/calendar?employee_id=xxx&month=2026-04
  → list ngày với status
```

---

## Cấu trúc thư mục đề xuất

```
mobile/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          # Dashboard
│   │   ├── checkin.tsx        # Check-in / Check-out
│   │   ├── leave.tsx          # Leave list + tạo mới
│   │   └── profile.tsx        # Thông tin cá nhân
│   └── _layout.tsx
├── components/
│   ├── CheckinButton.tsx
│   ├── GPSStatus.tsx
│   ├── LeaveForm.tsx
│   ├── AdjustmentForm.tsx
│   ├── AttendanceCalendar.tsx
│   └── DashboardStats.tsx
├── hooks/
│   ├── useLocation.ts         # GPS hook
│   ├── useAttendance.ts
│   └── useLeave.ts
├── services/
│   ├── api.ts                 # axios instance + interceptors
│   ├── attendance.service.ts
│   ├── leave.service.ts
│   └── location.service.ts
├── utils/
│   ├── fakeGpsDetect.ts       # detect mock location
│   ├── deviceId.ts            # get & store device ID
│   └── distance.ts            # haversine formula
└── types/
    ├── attendance.types.ts
    ├── leave.types.ts
    └── shift.types.ts
```

---

## Quy tắc kỹ thuật

1. **TypeScript strict mode** — không dùng `any`
2. **Error handling** đầy đủ: network error, GPS permission denied, device binding fail
3. **Offline support**: cache trạng thái check-in cuối cùng, queue request khi mất mạng
4. **Loading states** cho mọi API call
5. **Không hardcode** URL, đặt trong `constants/config.ts`
6. Tất cả text UI bằng **tiếng Việt**

---

## Thứ tự implement

1. `utils/distance.ts` — haversine GPS distance
2. `utils/fakeGpsDetect.ts` — mock location detection
3. `utils/deviceId.ts` — device binding
4. `services/api.ts` — base API client
5. `hooks/useLocation.ts` — GPS hook
6. `components/GPSStatus.tsx` — hiển thị GPS info
7. `components/CheckinButton.tsx` — nút check-in chính
8. `app/(tabs)/checkin.tsx` — màn hình check-in đầy đủ
9. `components/DashboardStats.tsx` — thống kê Dashboard
10. `app/(tabs)/index.tsx` — Dashboard screen
11. `components/LeaveForm.tsx` + `app/(tabs)/leave.tsx` — Leave module
12. `components/AdjustmentForm.tsx` — Attendance Adjustment

---

## Lưu ý đặc biệt

- **Employee Type `CC` (Call Center)**: rule OT khác với Office — mobile app chỉ cần hiển thị đúng ca được phân công, logic tính toán do backend xử lý
- **Ngoài office check-in**: `task_id` là bắt buộc → show Task/SO picker trước khi submit
- **Không check-out**: backend sẽ flag — mobile app cần hiển thị cảnh báo ngày hôm sau
- Radius validation hiển thị bằng màu: xanh (trong vùng) / đỏ (ngoài vùng)
