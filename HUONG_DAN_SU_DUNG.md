# Hướng Dẫn Sử Dụng HR Project

## 📋 Mục Lục
1. [Giới Thiệu](#giới-thiệu)
2. [Vai Trò Người Dùng](#vai-trò-người-dùng)
3. [Các Tính Năng Chính](#các-tính-năng-chính)
4. [Hướng Dẫn Chi Tiết](#hướng-dẫn-chi-tiết)
5. [Cài Đặt & Chạy](#cài-đặt--chạy)
6. [Xử Lý Sự Cố](#xử-lý-sự-cố)

---

## 🎯 Giới Thiệu

**HR Project** là hệ thống quản lý nhân sự tôi toàn diện dành cho doanh nghiệp vừa. Cung cấp các tính năng từ tuyển dụng, quản lý phép năm, chấm công GPS đến tính lương.

### Đặc Điểm Nổi Bật
- ✅ Quản lý nhân viên & tổ chức toàn diện
- ✅ Workflow phee duyệt phép năm (multi-step)
- ✅ Chấm công GPS định vị chính xác
- ✅ Kiểm soát quyền hạn theo vai trò (RBAC)
- ✅ Ghi chép audit đầy đủ mọi hoạt động
- ✅ Ứng dụng mobile (PWA)

---

## 👥 Vai Trò Người Dùng

### Admin
- **Quyền hạn**: Toàn quyền hệ thống
- **Nhiệm vụ**: Tạo/sửa nhân viên, phê duyệt phép, quản lý lương, cấu hình hệ thống
- **Truy cập**: Tất cả tính năng

### HR (Nhân Viên Phòng Nhân Sự)
- **Quyền hạn**: Quản lý nhân sự toàn bộ công ty
- **Nhiệm vụ**: Tuyển dụng, cấp phép, tính lương, báo cáo chấm công
- **Truy cập**: Nhân viên, phép năm, chấm công, tổ chức

### Manager (Trưởng Bộ Phận)
- **Quyền hạn**: Quản lý đội nhóm cấp dưới
- **Nhiệm vụ**: Phê duyệt phép năm, xem hiệu suất nhân viên
- **Truy cập**: Xem nhân viên, phê duyệt phép

### Employee (Nhân Viên Thường)
- **Quyền hạn**: Cơ bản
- **Nhiệm vụ**: Xin phép, chấm công, xem thông tin cá nhân
- **Truy cập**: Profile, xin phép, chấm công

---

## 🎯 Các Tính Năng Chính

| Tính Năng | URL | Ai Dùng | Chức Năng |
|-----------|-----|---------|----------|
| **Nhân viên** | `/employees` | Admin, HR | CRUD nhân viên, quản lý phòng ban, vị trí |
| **Phép năm** | `/leave` | Tất cả | Xin phép, phê duyệt, xem số dư |
| **Chấm công** | `/attendance` | Tất cả | Check-in/out GPS, báo cáo |
| **Tổ chức** | `/departments`, `/positions`, `/branches` | Admin, HR | Cấu hình cơ cấu tổ chức |
| **Ca làm việc** | `/working-shifts` | Admin, HR | Quản lý ca trực, giờ làm |
| **Lịch** | `/calendar` | Admin, HR | Cấu hình ngày lễ, năm làm việc |
| **Offboarding** | `/offboarding` | Admin, HR, Manager | Quản lý từ chức, thu hồi tài sản |
| **Profile** | `/profile` | Tất cả | Xem & cập nhật thông tin cá nhân |

---

## 📖 Hướng Dẫn Chi Tiết

### 1. Quản Lý Nhân Viên

#### ➕ Tạo Nhân Viên Mới
1. Vào menu **Employees** → Click **"Add New Employee"**
2. Điền thông tin:
   - Mã nhân viên (ví dụ: E001)
   - Tên đầy đủ
   - Email (duy nhất trong hệ thống)
   - Mật khẩu lớn nhất 8 ký tự
   - Phòng ban, vị trí, chi nhánh
   - **[MỚI]** Số ngày phép ban đầu (mặc định: 12 ngày)
3. Click **"Create Employee"**

#### ✏️ Sửa Thông Tin Nhân Viên
1. Vào **Employees** → Chọn nhân viên
2. Click **"Edit Profile"** (Admin/HR only)
3. Cập nhật thông tin:
   - Phòng ban, vị trí, trạng thái
   - **[MỚI]** Có thể thay đổi số ngày phép
4. Click **"Save Changes"**

#### 👁️ Xem Chi Tiết Nhân Viên
1. Vào **Employees** → Click vào nhân viên
2. Có 2 tab:
   - **Profile**: Thông tin cơ bản, số dư phép (read-only)
   - **Change History**: Lịch sử sửa đổi

---

### 2. Quản Lý Phép Năm

#### 📝 Xin Phép
1. Vào **Leave** → Click **"New Leave Request"**
2. Điền thông tin:
   - Loại phép (Phép năm, phép ốm, phép không lương)
   - Từ ngày - Đến ngày
   - Lý do xin phép
3. Click **"Submit"** → Gửi phê duyệt

#### ✅ Phê Duyệt Phép (Manager/HR/Admin)
1. Vào **Leave** → Tab **"Pending Approvals"**
2. Click vào yêu cầu phép
3. Chọn:
   - ✅ **Approve** → Xác nhận phê duyệt
   - ❌ **Reject** → Từ chối + nhập lý do
4. Click **"Submit"**

#### 📊 Xem Số Dư Phép
- Khi xem profile nhân viên → Tab **"Profile"** → Xem **"Leave Balance"**
- Hoặc vào **Employees** → Chọn nhân viên → Xem số dư

---

### 3. Chấm Công

#### 🔵 Check-in/Check-out
1. Vào **Attendance**
2. Click **"Check In"** → Cho phép GPS → Hệ thống ghi nhận
3. Cuối ngày click **"Check Out"** → Hoàn thành

#### 📋 Xem Báo Cáo Chấm Công
1. Vào **Attendance** → Tab **"Report"**
2. Lọc theo tháng/nhân viên
3. Xem:
   - Giờ check-in/out
   - Số giờ làm việc
   - Tình trạng đi trể/sớm

---

### 4. Cấu Hình Tổ Chức

#### 🏢 Phòng Ban
- Vào **Departments** → **"Add Department"**
- Điền tên, mã, loại làm việc (FIXED/SHIFT)
- Gán nhân viên vào phòng

#### 👔 Vị Trí
- Vào **Positions** → **"Add Position"**
- Điền tên, mã, số lương (tuỳ chọn)

#### 🌳 Chi Nhánh
- Vào **Branches** → **"Add Branch"**
- Điền tên, GPS vị trí, phạm vi (bán kính)

#### ⏰ Ca Làm Việc
- Vào **Working Shifts** → **"Add Shift"**
- Cấu hình:
  - Giờ bắt đầu/kết thúc
  - Thời gian nghỉ
  - Thời gian cho phép đi trểcó sớm

---

### 5. Offboarding (Từ Chức)
1. Vào **Offboarding** → **"New Resignation"**
2. Chọn nhân viên, ngày cuối cùng làm việc
3. Gửi phê duyệt → Manager/Admin xác nhận
4. HR tạo checklist thu hồi tài sản

---

## ⚙️ Cài Đặt & Chạy

### Yêu Cầu Hệ Thống
- Node.js 18+
- PostgreSQL 13+
- Git

### Cài Đặt Backend
```bash
cd backend
npm install
cp .env.example .env           # Sửa DATABASE_URL, JWT_SECRET
npx prisma migrate deploy      # Cập nhật database
npm run start:dev              # Chạy dev (http://localhost:3001)
```

### Cài Đặt Frontend
```bash
cd frontend
npm install
cp .env.example .env           # Sửa API_URL
npm run dev                    # Chạy dev (http://localhost:3000)
```

### API Documentation
- Swagger API: `http://localhost:3001/api/docs`
- Prisma Studio: `npm run prisma:studio`

---

## 🐛 Xử Lý Sự Cố

### ❌ Lỗi Đăng Nhập
**Triệu chứng**: Không đăng nhập được
**Giải pháp**:
1. Kiểm tra database kết nối: `npx prisma db push`
2. Reset password: Admin đặt mật khẩu mới cho nhân viên
3. Kiểm tra JWT_SECRET trong `.env`

### ❌ GPS Không Hoạt Động
**Triệu chứng**: Chấm công không lưu vị trí
**Giải pháp**:
1. Cho phép quyền vị trí trong browser
2. Kiểm tra HTTPS (một số trình duyệt yêu cầu)
3. Xác nhận vị trị công ty được cấu hình đúng

### ❌ Số Dư Phép Sai
**Triệu chứng**: Hiển thị số phép không chính xác
**Giải pháp**:
1. Admin vào **Edit Employee** → Cập nhật "Initial Leave Balance"
2. Kiểm tra lịch sử phê duyệt phép
3. Liên hệ IT để xử lý lịch sử

### ❌ Không Tạo Nhân Viên
**Triệu chứng**: Lỗi "Email already in use"
**Giải pháp**:
1. Email phải duy nhất → Sử dụng email khác
2. Kiểm tra nhân viên đã tồn tại

---

## 📞 Hỗ Trợ

- **Database**: Prisma Studio `npx prisma studio`
- **API Test**: Postman hoặc curl
- **Log**: Xem file `logs/` hoặc console dev
- **Admin Panel**: `/admin` (nếu có)

---

## 📝 Ghi Chú
- Tất cả hành động được ghi lại trong **Audit Log**
- Backup database định kỳ (tuỳ chọn)
- Cập nhật password mặc định ngay sau khi tạo nhân viên
- Cấu hình GMT/múi giờ trong `.env`

