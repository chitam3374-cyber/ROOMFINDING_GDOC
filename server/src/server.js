// server/src/server.js
import express from 'express';
import cors from 'cors';
import { db, initDatabase } from './data/sqlite.js';
import { RoomService } from './services/roomService.js';

const app = express();
const PORT = 5000;

// Khởi tạo bảng và nạp 140 phòng vào SQLite
initDatabase();

app.use(cors());
app.use(express.json());

// 1. Danh sách phòng trống cho thanh Marquee
app.get('/api/rooms/marquee', (req, res) => {
  res.json(RoomService.getMarqueeAvailableRooms());
});

// 2. Bảng ma trận lịch phòng theo ngày cụ thể (4 slot cố định)
app.get('/api/rooms/schedule-matrix', (req, res) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const targetDate = req.query.date || todayStr;
  res.json(RoomService.getScheduleMatrix(targetDate));
});

// 3. Tra cứu trạng thái và chế tài của sinh viên
app.get('/api/students/:id/check', (req, res) => {
  const sId = req.params.id;
  const activeBooking = RoomService.getStudentActiveBooking(sId);
  res.json({
    hasActiveBooking: !!activeBooking,
    booking: activeBooking || null,
    penalties: RoomService.getStudentPenaltyStatus(sId)
  });
});

// 4. Lấy danh sách phòng khả dụng theo quy mô nhóm
app.get('/api/rooms/available', (req, res) => {
  const { date, startTime, endTime, memberCount } = req.query;
  res.json(RoomService.getAvailableRoomsForGroup(date, startTime, endTime, memberCount));
});

// 5. Tạo đơn đặt phòng
app.post('/api/bookings', (req, res) => {
  try {
    const booking = RoomService.createBooking(req.body);
    res.status(201).json({ success: true, booking });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 6. HỦY ĐẶT PHÒNG (TỐI ĐA 3 LẦN / NGÀY)
app.post('/api/bookings/:id/cancel', (req, res) => {
  try {
    const { studentId } = req.body;
    const result = RoomService.cancelBooking(req.params.id, studentId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 7. Xác nhận đã nhận phòng (Check-in)
app.post('/api/bookings/:id/checkin', (req, res) => {
  try {
    res.json({ success: true, booking: RoomService.confirmCheckIn(req.params.id) });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 8. Xác nhận trả phòng (Check-out)
app.post('/api/bookings/:id/checkout', (req, res) => {
  try {
    res.json({ success: true, booking: RoomService.confirmCheckOut(req.params.id) });
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

// 11. Endpoint debug trực tiếp database SQLite
app.get('/api/debug/db', (req, res) => {
  const rooms = db.prepare('SELECT * FROM rooms').all();
  const bookings = db.prepare('SELECT * FROM bookings').all();
  const penalties = db.prepare('SELECT * FROM penalties').all();
  const logs = db.prepare('SELECT * FROM penalty_logs').all();
  res.json({ rooms, bookings, penalties, logs });
});

app.listen(PORT, () => console.log(`>>> BACKEND NODE.JS + SQLITE ĐANG CHẠY: http://localhost:${PORT}`));