// server/src/server.js
import express from 'express';
import cors from 'cors';
import { DB } from './data/database.js';
import { RoomService } from './services/roomService.js';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Thuật toán kiểm tra 2 khoảng thời gian có giao nhau không
const isOverlapping = (startA, endA, startB, endB) => {
  return startA < endB && endA > startB;
};

// 1. Danh sách phòng trống cho thanh Marquee
app.get('/api/rooms/marquee', (req, res) => {
  res.json(RoomService.getMarqueeAvailableRooms());
});

// 2. Bảng ma trận lịch phòng toàn bộ khuôn viên theo 4 slot cố định
app.get('/api/rooms/schedule-matrix', (req, res) => {
  // Lấy toàn bộ danh sách phòng từ DB thay vì chỉ 7 phòng mẫu
  const allRooms = DB.rooms.map(r => r.id);

  const slotsConfig = [
    { label: '08:00 - 10:00', start: '08:00', end: '10:00' },
    { label: '10:00 - 12:00', start: '10:00', end: '12:00' },
    { label: '13:00 - 15:00', start: '13:00', end: '15:00' },
    { label: '15:00 - 17:00', start: '15:00', end: '17:00' }
  ];

  const matrix = allRooms.map(roomId => {
    const row = { roomId, slots: {} };

    slotsConfig.forEach(slot => {
      // Kiểm tra xem phòng có bị trùng đơn đặt còn hiệu lực không
      const hasBooking = DB.bookings.some(b => 
        b.roomId === roomId && 
        b.status !== 'CANCELLED' && 
        isOverlapping(b.startTime, b.endTime, slot.start, slot.end)
      );

      // Kiểm tra xem phòng có bị trùng lịch học (TKB) không
      const hasSchedule = DB.schedules.some(s => 
        s.roomId === roomId && 
        isOverlapping(s.startTime, s.endTime, slot.start, slot.end)
      );

      row.slots[slot.label] = (hasBooking || hasSchedule) ? 'Đã đặt' : 'Trống';
    });

    return row;
  });

  res.json(matrix);
});

// 3. Tra cứu trạng thái và chế tài của sinh viên
app.get('/api/students/:id/check', (req, res) => {
  const sId = req.params.id;
  res.json({
    hasActiveBooking: !!RoomService.getStudentActiveBooking(sId),
    booking: RoomService.getStudentActiveBooking(sId) || null,
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

// 6. Xác nhận đã nhận phòng (Check-in)
app.post('/api/bookings/:id/checkin', (req, res) => {
  try {
    res.json({ success: true, booking: RoomService.confirmCheckIn(req.params.id) });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 7. Xác nhận trả phòng (Check-out)
app.post('/api/bookings/:id/checkout', (req, res) => {
  try {
    res.json({ success: true, booking: RoomService.confirmCheckOut(req.params.id) });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 8. Xử lý phạt trễ nhận phòng quá 10 phút
app.post('/api/bookings/:id/timeout-noshow', (req, res) => {
  res.json({ success: true, result: RoomService.handleNoShowPenalty(req.params.id) });
});

// 9. Xử lý phạt trễ trả phòng quá 30 phút
app.post('/api/bookings/:id/timeout-latecheckout', (req, res) => {
  res.json({ success: true, result: RoomService.handleLateCheckOutPenalty(req.params.id) });
});

// 10. Endpoint kiểm tra trực quan toàn bộ Database trong RAM
app.get('/api/debug/db', (req, res) => {
  res.json(DB);
});

app.listen(PORT, () => console.log(`>>> BACKEND NODE.JS ĐANG CHẠY: http://localhost:${PORT}`));