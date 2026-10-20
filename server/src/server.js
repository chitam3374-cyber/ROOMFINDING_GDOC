// server/src/server.js
import express from 'express';
import cors from 'cors';
import { DB } from './data/database.js';
import { RoomService } from './services/roomService.js';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get('/api/rooms/marquee', (req, res) => res.json(RoomService.getMarqueeAvailableRooms()));

app.get('/api/rooms/schedule-matrix', (req, res) => {
  const sampleRooms = ['A1.101', 'A1.102', 'A2.205', 'LA1.301', 'A1.103', 'A2.104', 'Lib.01'];
  const slots = ['08:00 - 10:00', '10:00 - 12:00', '13:00 - 15:00', '15:00 - 17:00'];
  const matrix = sampleRooms.map(roomId => {
    const row = { roomId, slots: {} };
    slots.forEach(slot => {
      const [start] = slot.split(' - ');
      const isBooked = DB.bookings.some(b => b.roomId === roomId && b.startTime === start) ||
                       DB.schedules.some(s => s.roomId === roomId && s.startTime === start);
      row.slots[slot] = isBooked ? 'Đã đặt' : 'Trống';
    });
    return row;
  });
  res.json(matrix);
});

app.get('/api/students/:id/check', (req, res) => {
  const sId = req.params.id;
  res.json({
    hasActiveBooking: !!RoomService.getStudentActiveBooking(sId),
    booking: RoomService.getStudentActiveBooking(sId) || null,
    penalties: RoomService.getStudentPenaltyStatus(sId)
  });
});

app.get('/api/rooms/available', (req, res) => {
  const { date, startTime, endTime, memberCount } = req.query;
  res.json(RoomService.getAvailableRoomsForGroup(date, startTime, endTime, memberCount));
});

app.post('/api/bookings', (req, res) => {
  try {
    const booking = RoomService.createBooking(req.body);
    res.status(201).json({ success: true, booking });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.post('/api/bookings/:id/checkin', (req, res) => {
  try {
    res.json({ success: true, booking: RoomService.confirmCheckIn(req.params.id) });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.post('/api/bookings/:id/checkout', (req, res) => {
  try {
    res.json({ success: true, booking: RoomService.confirmCheckOut(req.params.id) });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.post('/api/bookings/:id/timeout-noshow', (req, res) => {
  res.json({ success: true, result: RoomService.handleNoShowPenalty(req.params.id) });
});

app.post('/api/bookings/:id/timeout-latecheckout', (req, res) => {
  res.json({ success: true, result: RoomService.handleLateCheckOutPenalty(req.params.id) });
});

app.listen(PORT, () => console.log(`>>> BACKEND NODE.JS ĐANG CHẠY: http://localhost:${PORT}`));