// server/src/server.js
import express from 'express';
import cors from 'cors';
import { db, initDatabase } from './data/sqlite.js';
import { RoomService } from './services/roomService.js';
import { AuthService } from './services/authService.js';
import { syncJsonFromSqlite, resetDatabase } from './data/jsonDb.js';

const app = express();
const PORT = 5000;

// Khởi tạo bảng SQLite và đồng bộ dữ liệu ban đầu sang database.json
initDatabase();
syncJsonFromSqlite();

app.use(cors());
app.use(express.json());

// Quản lý thời gian giả lập DevMode trên server để các tiến trình quét ngầm không chạy sai giờ
let activeSimulatedTime = null;
let lastSimulatedTimeUpdated = 0;

// Middleware tự động quét và giải phóng các phòng quá hạn nhận phòng/trả phòng trước mỗi request API
app.use((req, res, next) => {
  try {
    const rawSim = req.headers['x-simulated-time'] || req.query?.simulatedTime || req.body?.simulatedTime;
    if (rawSim === 'REAL_TIME') {
      activeSimulatedTime = null;
      lastSimulatedTimeUpdated = 0;
    } else if (rawSim) {
      activeSimulatedTime = rawSim;
      lastSimulatedTimeUpdated = Date.now();
    } else {
      if (Date.now() - lastSimulatedTimeUpdated > 120000) {
        activeSimulatedTime = null;
      }
    }

    const effectiveTime = (rawSim && rawSim !== 'REAL_TIME')
      ? rawSim
      : ((Date.now() - lastSimulatedTimeUpdated < 120000) ? activeSimulatedTime : null);

    req.effectiveSimulatedTime = effectiveTime;
    RoomService.autoExpireOverdueBookings(effectiveTime);
  } catch (err) {
    console.error('Lỗi khi autoExpireOverdueBookings:', err.message);
  }
  next();
});

// Chạy tác vụ quét định kỳ mỗi 15 giây ngầm trong backend
setInterval(() => {
  try {
    const effectiveTime = (Date.now() - lastSimulatedTimeUpdated < 120000) ? activeSimulatedTime : null;
    RoomService.autoExpireOverdueBookings(effectiveTime);
  } catch (err) {
    console.error('Lỗi interval autoExpireOverdueBookings:', err.message);
  }
}, 15000);

// ==================== AUTHENTICATION (EMAIL IU) ====================

// AUTH 1: Đăng ký tài khoản bằng email sinh viên IU (@student.hcmiu.edu.vn)
app.post('/api/auth/register', (req, res) => {
  try {
    const result = AuthService.register(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// AUTH 2: Đăng nhập tài khoản bằng Email IU hoặc MSSV
app.post('/api/auth/login', (req, res) => {
  try {
    const result = AuthService.login(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// AUTH 3: Danh sách người dùng
app.get('/api/auth/users', (req, res) => {
  res.json(AuthService.getAllUsers());
});

// ==================== ROOM & BOOKING APIs ====================

// 1. Danh sách phòng trống cho thanh Marquee
app.get('/api/rooms/marquee', (req, res) => {
  res.json(RoomService.getMarqueeAvailableRooms(req.effectiveSimulatedTime));
});

// 2. Bảng ma trận lịch phòng theo ngày cụ thể (4 slot cố định)
app.get('/api/rooms/schedule-matrix', (req, res) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const targetDate = req.query.date || todayStr;
  res.json(RoomService.getScheduleMatrix(targetDate, req.effectiveSimulatedTime));
});

// 3. Tra cứu trạng thái và chế tài của sinh viên
app.get('/api/students/:id/check', (req, res) => {
  const sId = req.params.id;
  const activeBooking = RoomService.getStudentActiveBooking(sId, req.effectiveSimulatedTime);
  res.json({
    hasActiveBooking: !!activeBooking,
    booking: activeBooking || null,
    penalties: RoomService.getStudentPenaltyStatus(sId, req.effectiveSimulatedTime)
  });
});

// 4. Lấy danh sách phòng khả dụng theo quy mô nhóm
app.get('/api/rooms/available', (req, res) => {
  const { date, startTime, endTime, memberCount } = req.query;
  res.json(RoomService.getAvailableRoomsForGroup(date, startTime, endTime, memberCount, req.effectiveSimulatedTime));
});

// 5. Tạo đơn đặt phòng
app.post('/api/bookings', (req, res) => {
  try {
    const booking = RoomService.createBooking({ ...req.body, simulatedTime: req.effectiveSimulatedTime });
    res.status(201).json({ success: true, booking });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 6. HỦY ĐẶT PHÒNG (TỐI ĐA 3 LẦN / NGÀY - PHÒNG TƯƠNG LAI QUÁ 3 LẦN CHỈ CẤM 10P KÈM CẢNH CÁO)
app.post('/api/bookings/:id/cancel', (req, res) => {
  try {
    const { studentId } = req.body;
    const result = RoomService.cancelBooking(req.params.id, studentId, req.effectiveSimulatedTime);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 7. Xác nhận đã nhận phòng (Check-in)
app.post('/api/bookings/:id/checkin', (req, res) => {
  try {
    res.json({ success: true, booking: RoomService.confirmCheckIn(req.params.id, req.effectiveSimulatedTime) });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 8. Xác nhận trả phòng (Check-out)
app.post('/api/bookings/:id/checkout', (req, res) => {
  try {
    res.json({ success: true, booking: RoomService.confirmCheckOut(req.params.id, req.effectiveSimulatedTime) });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 9. Xử lý phạt trễ nhận phòng quá 10 phút
app.post('/api/bookings/:id/timeout-noshow', (req, res) => {
  res.json({ success: true, result: RoomService.handleNoShowPenalty(req.params.id) });
});

// 10. Xử lý phạt trễ trả phòng quá 30 phút
app.post('/api/bookings/:id/timeout-latecheckout', (req, res) => {
  res.json({ success: true, result: RoomService.handleLateCheckOutPenalty(req.params.id) });
});

// ==================== ADMIN DEVPAGE APIs ====================

// ADMIN 1: Lấy danh sách tất cả người dùng kèm role và tình trạng chế tài
app.get('/api/admin/users', (req, res) => {
  try {
    res.json(AuthService.getAllUsersWithStatus());
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ADMIN 2: Cấp quyền / Đổi quyền tài khoản (student <-> admin)
app.post('/api/admin/users/:id/role', (req, res) => {
  try {
    const { role } = req.body;
    const result = AuthService.updateUserRole(req.params.id, role);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ADMIN 3: Gỡ ban tài khoản cho sinh viên
app.post('/api/admin/students/:studentId/unban', (req, res) => {
  try {
    const result = RoomService.unbanStudent(req.params.studentId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ADMIN 4: Bảng ma trận lịch phòng chi tiết kèm thông tin Sinh viên đã đặt & Khóa phòng
app.get('/api/admin/schedule-matrix', (req, res) => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    const targetDate = req.query.date || todayStr;
    res.json(RoomService.getScheduleMatrixWithDetails(targetDate, req.effectiveSimulatedTime));
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ADMIN 5: Lấy danh sách các lệnh khóa phòng
app.get('/api/admin/locks', (req, res) => {
  try {
    res.json(RoomService.getAllRoomLocks());
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ADMIN 6: Tạo lệnh khóa phòng mới
app.post('/api/admin/locks', (req, res) => {
  try {
    const result = RoomService.createRoomLock(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ADMIN 7: Mở khóa phòng (Xóa lệnh khóa)
app.delete('/api/admin/locks/:id', (req, res) => {
  try {
    const result = RoomService.deleteRoomLock(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ==================== DEBUG & MAINTENANCE APIs ====================

// 11. Endpoint debug trực tiếp xem toàn bộ Database JSON (đầy đủ Users, Bookings, Penalties, Rooms, Locks)
app.get('/api/debug/db', (req, res) => {
  res.json(syncJsonFromSqlite());
});

// 12. Endpoint Reset sạch Database khi cần
app.post('/api/debug/reset', (req, res) => {
  try {
    const cleanData = resetDatabase();
    res.json({ success: true, message: 'Đã reset toàn bộ danh sách sinh viên & lịch phòng!', data: cleanData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(PORT, () => console.log(`>>> BACKEND NODE.JS + JSON DB ĐANG CHẠY: http://localhost:${PORT}`));
