// server/src/services/roomService.js
import { DB } from '../data/database.js';

const toMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

const checkOverlap = (startA, endA, startB, endB) => {
  return toMinutes(startA) < toMinutes(endB) && toMinutes(endA) > toMinutes(startB);
};

export const RoomService = {
  getStudentPenaltyStatus(studentId) {
    const student = DB.penalties[studentId];
    if (!student) return { canBook: true, violations: [] };
    if (student.isBannedPermanent) {
      return { canBook: false, reason: 'MSSV đã bị KHÓA VĨNH VIỄN do vi phạm nhiều lần.', violations: student.logs };
    }
    if (student.banUntil && new Date(student.banUntil) > new Date()) {
      return { canBook: false, reason: `MSSV đang bị tạm khóa đến ${new Date(student.banUntil).toLocaleDateString('vi-VN')}.`, violations: student.logs };
    }
    return { canBook: true, violations: student.logs || [] };
  },

  getStudentActiveBooking(studentId) {
    return DB.bookings.find(b => 
      (b.studentId === studentId || b.studentEmail?.toLowerCase() === studentId.toLowerCase()) && 
      (b.status === 'BOOKED' || b.status === 'CHECKED_IN')
    );
  },

  getMarqueeAvailableRooms() {
    return DB.rooms.filter(r => {
      const isBooked = DB.bookings.some(b => b.roomId === r.id && (b.status === 'BOOKED' || b.status === 'CHECKED_IN'));
      return !isBooked;
    });
  },

  getAvailableRoomsForGroup(date, startTime, endTime, memberCount) {
    const count = parseInt(memberCount) || 1;
    const sorted = [...DB.rooms].sort((a, b) => {
      if (a.building !== b.building) return a.building.localeCompare(b.building);
      return a.floor - b.floor;
    });

    const available = sorted.filter(room => {
      if (date && startTime && endTime) {
        const hasTkb = DB.schedules.some(s => s.roomId === room.id && s.date === date && checkOverlap(startTime, endTime, s.startTime, s.endTime));
        if (hasTkb) return false;
        const hasBooking = DB.bookings.some(b => b.roomId === room.id && b.date === date && b.status !== 'CANCELLED' && checkOverlap(startTime, endTime, b.startTime, b.endTime));
        if (hasBooking) return false;
      }
      return true;
    });

    return available.sort((a, b) => Math.abs(a.capacity - count) - Math.abs(b.capacity - count));
  },

  createBooking({ studentId, studentEmail, roomId, date, startTime, endTime, memberCount }) {
    const penaltyCheck = this.getStudentPenaltyStatus(studentId);
    if (!penaltyCheck.canBook) throw new Error(penaltyCheck.reason);

    const existing = this.getStudentActiveBooking(studentId);
    if (existing) throw new Error('Sinh viên này hiện đã có phòng đang hoạt động!');

    const newBooking = {
      id: 'BK' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      studentId,
      studentEmail: studentEmail || `${studentId}@student.hcmiu.edu.vn`,
      roomId,
      date: date || new Date().toISOString().split('T')[0],
      startTime,
      endTime,
      memberCount: parseInt(memberCount) || 1,
      status: 'BOOKED',
      createdAt: new Date().toISOString()
    };

    DB.bookings.push(newBooking);
    return newBooking;
  },

  confirmCheckIn(bookingId) {
    const b = DB.bookings.find(x => x.id === bookingId);
    if (!b) throw new Error('Không tìm thấy phòng!');
    b.status = 'CHECKED_IN';
    return b;
  },

  confirmCheckOut(bookingId) {
    const b = DB.bookings.find(x => x.id === bookingId);
    if (!b) throw new Error('Không tìm thấy phòng!');
    b.status = 'COMPLETED';
    return b;
  },

  handleNoShowPenalty(bookingId) {
    const b = DB.bookings.find(x => x.id === bookingId);
    if (!b) return;
    b.status = 'CANCELLED';
    const sId = b.studentId;
    if (!DB.penalties[sId]) DB.penalties[sId] = { noShowCount: 0, lateCheckoutCount: 0, logs: [], banUntil: null, isBannedPermanent: false };
    const p = DB.penalties[sId];
    p.noShowCount += 1;
    const now = new Date();
    let desc = '';
    if (p.noShowCount === 1) desc = `[Lần 1] Cảnh cáo: Không bấm nhận phòng ${b.roomId} sau 10 phút.`;
    else if (p.noShowCount === 2) {
      p.banUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      desc = `[Lần 2] Khóa tài khoản 30 ngày: Không nhận phòng ${b.roomId} sau 10 phút.`;
    } else {
      p.isBannedPermanent = true;
      desc = `[Lần 3] CẤM VĨNH VIỄN: Vi phạm không nhận phòng quá 3 lần.`;
    }
    p.logs.push({ date: new Date().toLocaleString('vi-VN'), reason: desc });
    return { booking: b, penalty: p };
  },

  handleLateCheckOutPenalty(bookingId) {
    const b = DB.bookings.find(x => x.id === bookingId);
    if (!b) return;
    b.status = 'COMPLETED';
    const sId = b.studentId;
    if (!DB.penalties[sId]) DB.penalties[sId] = { noShowCount: 0, lateCheckoutCount: 0, logs: [], banUntil: null, isBannedPermanent: false };
    const p = DB.penalties[sId];
    p.lateCheckoutCount += 1;
    const now = new Date();
    let desc = '';
    if (p.lateCheckoutCount === 1) desc = `[Lần 1] Cảnh cáo: Không bấm trả phòng ${b.roomId} đúng hạn.`;
    else if (p.lateCheckoutCount === 2) {
      p.banUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      desc = `[Lần 2] Khóa 7 ngày: Trễ hạn trả phòng ${b.roomId}.`;
    } else if (p.lateCheckoutCount === 3) {
      p.banUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      desc = `[Lần 3] Khóa 30 ngày: Trễ hạn trả phòng ${b.roomId}.`;
    } else {
      p.isBannedPermanent = true;
      desc = `[Lần 4] CẤM VĨNH VIỄN: Vi phạm trả phòng trễ hạn quá 4 lần.`;
    }
    p.logs.push({ date: new Date().toLocaleString('vi-VN'), reason: desc });
    return { booking: b, penalty: p };
  }
};