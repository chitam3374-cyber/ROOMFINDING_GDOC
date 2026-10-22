// server/src/services/roomService.js
import { db } from '../data/sqlite.js';

const toMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

export const RoomService = {
  // 1. Kiểm tra trạng thái chế tài & phạt của sinh viên
  getStudentPenaltyStatus(studentId) {
    const student = db.prepare('SELECT * FROM penalties WHERE studentId = ?').get(studentId);
    if (!student) return { canBook: true, violations: [] };

    const logs = db.prepare('SELECT date, reason FROM penalty_logs WHERE studentId = ? ORDER BY id DESC').all(studentId);

    if (student.isBannedPermanent) {
      return { canBook: false, reason: 'MSSV đã bị KHÓA VĨNH VIỄN do vi phạm nhiều lần.', violations: logs };
    }

    if (student.banUntil && new Date(student.banUntil) > new Date()) {
      return { 
        canBook: false, 
        reason: `MSSV đang bị tạm khóa đến ${new Date(student.banUntil).toLocaleDateString('vi-VN')}.`, 
        violations: logs 
      };
    }

    return { canBook: true, violations: logs || [] };
  },

  // 2. Lấy đơn đặt phòng đang active của sinh viên
  getStudentActiveBooking(studentId) {
    return db.prepare(`
      SELECT * FROM bookings 
      WHERE (studentId = ? OR LOWER(studentEmail) = LOWER(?)) 
        AND status IN ('BOOKED', 'CHECKED_IN')
      LIMIT 1
    `).get(studentId, studentId);
  },

  // 3. Lấy phòng trống cho băng chuyền Marquee
  getMarqueeAvailableRooms() {
    return db.prepare(`
      SELECT * FROM rooms 
      WHERE id NOT IN (
        SELECT roomId FROM bookings WHERE status IN ('BOOKED', 'CHECKED_IN')
      )
    `).all();
  },

  // 4. Lấy ma trận 140 phòng theo ngày được chọn
  getScheduleMatrix(targetDate) {
    const allRooms = db.prepare('SELECT id FROM rooms ORDER BY id ASC').all();
    const bookings = db.prepare(`
      SELECT roomId, startTime, endTime 
      FROM bookings 
      WHERE date = ? AND status != 'CANCELLED'
    `).all(targetDate);

    const slotsConfig = [
      { label: '08:00 - 10:00', start: '08:00', end: '10:00' },
      { label: '10:00 - 12:00', start: '10:00', end: '12:00' },
      { label: '13:00 - 15:00', start: '13:00', end: '15:00' },
      { label: '15:00 - 17:00', start: '15:00', end: '17:00' }
    ];

    return allRooms.map(({ id: roomId }) => {
      const row = { roomId, slots: {} };

      slotsConfig.forEach(slot => {
        const slotStartMins = toMinutes(slot.start);
        const slotEndMins = toMinutes(slot.end);

        const isBooked = bookings.some(b => {
          if (b.roomId !== roomId) return false;
          return toMinutes(b.startTime) < slotEndMins && toMinutes(b.endTime) > slotStartMins;
        });

        row.slots[slot.label] = isBooked ? 'Đã đặt' : 'Trống';
      });

      return row;
    });
  },

  // 5. Lấy danh sách phòng khả dụng theo nhóm và sắp xếp theo độ lệch dung lượng
  getAvailableRoomsForGroup(date, startTime, endTime, memberCount) {
    const count = parseInt(memberCount) || 1;
    let available = db.prepare('SELECT * FROM rooms').all();

    if (date && startTime && endTime) {
      const startMins = toMinutes(startTime);
      const endMins = toMinutes(endTime);

      const conflicts = db.prepare(`
        SELECT roomId, startTime, endTime FROM bookings 
        WHERE date = ? AND status != 'CANCELLED'
      `).all(date);

      available = available.filter(room => {
        const hasConflict = conflicts.some(b => 
          b.roomId === room.id && 
          toMinutes(b.startTime) < endMins && 
          toMinutes(b.endTime) > startMins
        );
        return !hasConflict;
      });
    }

    return available.sort((a, b) => Math.abs(a.capacity - count) - Math.abs(b.capacity - count));
  },

  // 6. Tạo đơn đặt phòng
  createBooking({ studentId, studentEmail, roomId, date, startTime, endTime, memberCount }) {
    // 1. Kiểm tra trạng thái chế tài của sinh viên
    const penaltyCheck = this.getStudentPenaltyStatus(studentId);
    if (!penaltyCheck.canBook) throw new Error(penaltyCheck.reason);

    // 2. Kiểm tra xem sinh viên đã có phòng đang hoạt động chưa
    const existing = this.getStudentActiveBooking(studentId);
    if (existing) throw new Error('Sinh viên này hiện đã có phòng đang hoạt động!');

    // 3. Khóa cứng khung giờ vận hành từ 08:00 đến 17:00
    if (startTime < '08:00') {
      throw new Error('Hệ thống chỉ mở cửa từ 08:00 sáng! Không được đặt sớm hơn.');
    }
    if (endTime > '17:00') {
      throw new Error('Hệ thống kết thúc lúc 17:00 chiều! Không được đặt sau 17:00.');
    }
    if (startTime >= endTime) {
      throw new Error('Giờ kết thúc phải sau giờ bắt đầu!');
    }

    // 4. Kiểm tra thời lượng tối thiểu 60 phút
    const startMins = toMinutes(startTime);
    const endMins = toMinutes(endTime);
    if (endMins - startMins < 60) {
      throw new Error('Chưa đủ thời gian tối thiểu! Thời gian mượn phòng phải từ 60 phút trở lên.');
    }

    // 5. Kiểm tra giờ quá khứ trong cùng ngày
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    const bookingDate = date || todayStr;

    if (bookingDate === todayStr && startTime < currentTimeStr) {
      throw new Error(`ERROR ${currentTimeStr}, vui lòng chọn khung giờ sau thời điểm này.`);
    }

    // 6. Kiểm tra va chạm lịch phòng trong SQLite
    const activeBookings = db.prepare(`
      SELECT startTime, endTime FROM bookings 
      WHERE roomId = ? AND date = ? AND status != 'CANCELLED'
    `).all(roomId, bookingDate);

    const isConflict = activeBookings.some(b => 
      toMinutes(b.startTime) < endMins && toMinutes(b.endTime) > startMins
    );

    if (isConflict) {
      throw new Error(`Phòng ${roomId} đã có người đặt trong khung giờ ${startTime} - ${endTime}!`);
    }

    // 7. Lưu đơn đặt phòng mới vào SQLite
    const newBooking = {
      id: 'BK' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      studentId,
      studentEmail: studentEmail || `${studentId}@student.hcmiu.edu.vn`,
      roomId,
      date: bookingDate,
      startTime,
      endTime,
      memberCount: parseInt(memberCount) || 1,
      status: 'BOOKED',
      createdAt: new Date().toISOString()
    };

    const insertStmt = db.prepare(`
      INSERT INTO bookings (id, studentId, studentEmail, roomId, date, startTime, endTime, memberCount, status, createdAt)
      VALUES (@id, @studentId, @studentEmail, @roomId, @date, @startTime, @endTime, @memberCount, @status, @createdAt)
    `);
    insertStmt.run(newBooking);

    return newBooking;
  },

  // 7. Xác nhận nhận phòng
  confirmCheckIn(bookingId) {
    const b = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    if (!b) throw new Error('Không tìm thấy phòng!');

    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = b.startTime.split(':').map(Number);
    const startMins = startH * 60 + startM;

    if (currentMins < startMins - 10) {
      const waitMins = (startMins - 10) - currentMins;
      throw new Error(`Chưa đến giờ nhận phòng! Nút sẽ kích hoạt trước giờ bắt đầu 10 phút (còn ${waitMins} phút nữa).`);
    }

    if (currentMins > startMins + 10) {
      throw new Error('Đã quá thời hạn 10 phút nhận phòng đầu giờ!');
    }

    db.prepare("UPDATE bookings SET status = 'CHECKED_IN' WHERE id = ?").run(bookingId);
    b.status = 'CHECKED_IN';
    return b;
  },

  // 8. Xác nhận trả phòng
  confirmCheckOut(bookingId) {
    const b = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    if (!b) throw new Error('Không tìm thấy phòng!');

    if (b.status !== 'CHECKED_IN') {
      throw new Error('Bạn chưa bấm xác nhận nhận phòng nên không thể bấm trả phòng!');
    }

    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const [endH, endM] = b.endTime.split(':').map(Number);
    const endMins = endH * 60 + endM;

    if (currentMins < endMins) {
      const remainingMins = endMins - currentMins;
      throw new Error(`Chưa đến giờ trả phòng! Nút sẽ kích hoạt khi kết thúc ca lúc ${b.endTime} (còn ${remainingMins} phút).`);
    }

    if (currentMins > endMins + 30) {
      throw new Error('Đã quá thời hạn 30 phút trả phòng!');
    }

    db.prepare("UPDATE bookings SET status = 'COMPLETED' WHERE id = ?").run(bookingId);
    b.status = 'COMPLETED';
    return b;
  },

  // 9. Xử lý phạt vi phạm No-Show
  handleNoShowPenalty(bookingId) {
    const b = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    if (!b) return;

    db.prepare("UPDATE bookings SET status = 'CANCELLED' WHERE id = ?").run(bookingId);
    const sId = b.studentId;

    let p = db.prepare('SELECT * FROM penalties WHERE studentId = ?').get(sId);
    if (!p) {
      db.prepare(`
        INSERT INTO penalties (studentId, noShowCount, lateCheckoutCount, banUntil, isBannedPermanent)
        VALUES (?, 0, 0, NULL, 0)
      `).run(sId);
      p = { studentId: sId, noShowCount: 0, lateCheckoutCount: 0, banUntil: null, isBannedPermanent: 0 };
    }

    const newNoShow = p.noShowCount + 1;
    const now = new Date();
    let desc = '';
    let banUntil = p.banUntil;
    let isBannedPermanent = p.isBannedPermanent;

    if (newNoShow === 1) {
      desc = `[Lần 1] Cảnh cáo: Không bấm nhận phòng ${b.roomId} sau 10 phút.`;
    } else if (newNoShow === 2) {
      banUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      desc = `[Lần 2] Khóa tài khoản 30 ngày: Không nhận phòng ${b.roomId} sau 10 phút.`;
    } else {
      isBannedPermanent = 1;
      desc = `[Lần 3] CẤM VĨNH VIỄN: Vi phạm không nhận phòng quá 3 lần.`;
    }

    db.prepare(`
      UPDATE penalties 
      SET noShowCount = ?, banUntil = ?, isBannedPermanent = ? 
      WHERE studentId = ?
    `).run(newNoShow, banUntil, isBannedPermanent, sId);

    db.prepare(`
      INSERT INTO penalty_logs (studentId, date, reason)
      VALUES (?, ?, ?)
    `).run(sId, new Date().toLocaleString('vi-VN'), desc);

    return { booking: { ...b, status: 'CANCELLED' } };
  },

  // 10. Xử lý phạt vi phạm trả phòng trễ
  handleLateCheckOutPenalty(bookingId) {
    const b = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    if (!b) return;

    db.prepare("UPDATE bookings SET status = 'COMPLETED' WHERE id = ?").run(bookingId);
    const sId = b.studentId;

    let p = db.prepare('SELECT * FROM penalties WHERE studentId = ?').get(sId);
    if (!p) {
      db.prepare(`
        INSERT INTO penalties (studentId, noShowCount, lateCheckoutCount, banUntil, isBannedPermanent)
        VALUES (?, 0, 0, NULL, 0)
      `).run(sId);
      p = { studentId: sId, noShowCount: 0, lateCheckoutCount: 0, banUntil: null, isBannedPermanent: 0 };
    }

    const newLate = p.lateCheckoutCount + 1;
    const now = new Date();
    let desc = '';
    let banUntil = p.banUntil;
    let isBannedPermanent = p.isBannedPermanent;

    if (newLate === 1) {
      desc = `[Lần 1] Cảnh cáo: Không bấm trả phòng ${b.roomId} đúng hạn.`;
    } else if (newLate === 2) {
      banUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      desc = `[Lần 2] Khóa 7 ngày: Trễ hạn trả phòng ${b.roomId}.`;
    } else if (newLate === 3) {
      banUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      desc = `[Lần 3] Khóa 30 ngày: Trễ hạn trả phòng ${b.roomId}.`;
    } else {
      isBannedPermanent = 1;
      desc = `[Lần 4] CẤM VĨNH VIỄN: Vi phạm trả phòng trễ hạn quá 4 lần.`;
    }

    db.prepare(`
      UPDATE penalties 
      SET lateCheckoutCount = ?, banUntil = ?, isBannedPermanent = ? 
      WHERE studentId = ?
    `).run(newLate, banUntil, isBannedPermanent, sId);

    db.prepare(`
      INSERT INTO penalty_logs (studentId, date, reason)
      VALUES (?, ?, ?)
    `).run(sId, new Date().toLocaleString('vi-VN'), desc);

    return { booking: { ...b, status: 'COMPLETED' } };
  }
};