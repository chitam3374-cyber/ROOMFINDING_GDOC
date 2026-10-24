// server/src/services/roomService.js
import { db } from '../data/sqlite.js';
import { syncJsonFromSqlite } from '../data/jsonDb.js';

const toMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

const toTimeStr = (totalMinutes) => {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

// Lấy số phút hiện tại (theo giờ giả lập nếu hợp lệ, hoặc theo giờ thực máy chủ)
const getEffectiveMins = (simulatedTime) => {
  if (simulatedTime && simulatedTime !== 'REAL_TIME') {
    return toMinutes(simulatedTime);
  }
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

// Hàm chuẩn hóa MSSV: Cắt khoảng trắng thừa và viết in hoa toàn bộ
const normalizeStudentId = (id) => {
  if (!id) return '';
  return id.trim().toUpperCase();
};

export const RoomService = {
  // 1. Kiểm tra trạng thái chế tài & phạt của sinh viên
  getStudentPenaltyStatus(studentId, simulatedTime) {
    const sId = normalizeStudentId(studentId);
    const student = db.prepare('SELECT * FROM penalties WHERE UPPER(studentId) = ?').get(sId);
    if (!student) return { canBook: true, violations: [] };

    const logs = db.prepare('SELECT date, reason FROM penalty_logs WHERE UPPER(studentId) = ? ORDER BY id DESC').all(sId);

    if (student.isBannedPermanent) {
      return { canBook: false, reason: 'MSSV đã bị KHÓA VĨNH VIỄN do vi phạm nhiều lần.', violations: logs };
    }

    const now = new Date();
    if (simulatedTime && simulatedTime !== 'REAL_TIME') {
      const [sh, sm] = simulatedTime.split(':').map(Number);
      now.setHours(sh, sm, 0, 0);
    }

    if (student.banUntil && new Date(student.banUntil) > now) {
      const banDate = new Date(student.banUntil);
      const remainingMs = banDate.getTime() - now.getTime();
      const remainingMins = Math.ceil(remainingMs / 60000);
      let banMessage;
      if (remainingMins <= 60) {
        const timeStr = banDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        banMessage = `MSSV đang bị tạm khóa đặt phòng trong ${remainingMins} phút (mở lại lúc ${timeStr}).`;
      } else {
        banMessage = `MSSV đang bị tạm khóa đến ${banDate.toLocaleString('vi-VN')}.`;
      }

      return { 
        canBook: false, 
        reason: banMessage, 
        violations: logs 
      };
    }

    return { canBook: true, violations: logs || [] };
  },

  // 2. Lấy đơn đặt phòng đang active của sinh viên
  getStudentActiveBooking(studentId, simulatedTime) {
    this.autoExpireOverdueBookings(simulatedTime);
    const sId = normalizeStudentId(studentId);
    return db.prepare(`
      SELECT * FROM bookings 
      WHERE (UPPER(studentId) = ? OR UPPER(studentEmail) LIKE ?) 
        AND status IN ('BOOKED', 'CHECKED_IN')
      LIMIT 1
    `).get(sId, `${sId}%`);
  },

  // 3. Lấy phòng trống cho băng chuyền Marquee (loại trừ phòng đang mượn và phòng bị khóa)
  getMarqueeAvailableRooms(simulatedTime) {
    this.autoExpireOverdueBookings(simulatedTime);
    return db.prepare(`
      SELECT * FROM rooms 
      WHERE id NOT IN (
        SELECT roomId FROM bookings WHERE status IN ('BOOKED', 'CHECKED_IN')
      )
      AND id NOT IN (
        SELECT roomId FROM room_locks WHERE lockType = 'PERMANENT'
      )
    `).all();
  },

  // 4. Lấy dữ liệu Dải thời gian (Timeline) cho 122 phòng theo ngày được chọn
  getScheduleMatrix(targetDate, simulatedTime) {
    this.autoExpireOverdueBookings(simulatedTime);
    const allRooms = db.prepare('SELECT id FROM rooms ORDER BY id ASC').all();
    const bookings = db.prepare(`
      SELECT roomId, startTime, endTime 
      FROM bookings 
      WHERE date = ? AND status != 'CANCELLED'
    `).all(targetDate);

    return allRooms.map(({ id: roomId }) => {
      const roomBookings = bookings
        .filter(b => b.roomId === roomId)
        .map(b => ({
          startTime: b.startTime,
          endTime: b.endTime
        }));

      return {
        roomId,
        bookings: roomBookings
      };
    });
  },

  // 5. Lấy danh sách phòng khả dụng theo nhóm và sắp xếp theo độ lệch dung lượng (loại trừ phòng bị khóa)
  getAvailableRoomsForGroup(date, startTime, endTime, memberCount, simulatedTime) {
    this.autoExpireOverdueBookings(simulatedTime);
    const count = parseInt(memberCount) || 1;
    let available = db.prepare('SELECT * FROM rooms').all();

    // Lọc bỏ phòng bị khóa vĩnh viễn (PERMANENT)
    const permanentLocks = db.prepare("SELECT roomId FROM room_locks WHERE lockType = 'PERMANENT'").all();
    const permLockedSet = new Set(permanentLocks.map(l => l.roomId));
    available = available.filter(r => !permLockedSet.has(r.id));

    if (date && startTime && endTime) {
      const startMins = toMinutes(startTime);
      const endMins = toMinutes(endTime);

      const conflicts = db.prepare(`
        SELECT roomId, startTime, endTime FROM bookings 
        WHERE date = ? AND status != 'CANCELLED'
      `).all(date);

      const slotLocks = db.prepare(`
        SELECT roomId, startTime, endTime FROM room_locks
        WHERE lockType = 'TIME_SLOT' AND date = ?
      `).all(date);

      available = available.filter(room => {
        const hasBookingConflict = conflicts.some(b => 
          b.roomId === room.id && 
          toMinutes(b.startTime) < endMins && 
          toMinutes(b.endTime) > startMins
        );
        const hasLockConflict = slotLocks.some(l => 
          l.roomId === room.id && 
          toMinutes(l.startTime) < endMins && 
          toMinutes(l.endTime) > startMins
        );
        return !hasBookingConflict && !hasLockConflict;
      });
    }

    return available.sort((a, b) => Math.abs(a.capacity - count) - Math.abs(b.capacity - count));
  },

  // 6. Tạo đơn đặt phòng
  createBooking({ studentId, studentEmail, roomId, date, startTime, endTime, memberCount, simulatedTime }) {
    const sId = normalizeStudentId(studentId);

    // 1. Kiểm tra trạng thái chế tài của sinh viên
    const penaltyCheck = this.getStudentPenaltyStatus(sId, simulatedTime);
    if (!penaltyCheck.canBook) throw new Error(penaltyCheck.reason);

    // 2. Kiểm tra xem sinh viên đã có phòng đang hoạt động chưa
    const existing = this.getStudentActiveBooking(sId, simulatedTime);
    if (existing) throw new Error('Sinh viên này hiện đã có phòng đang hoạt động!');

    if (startTime < '08:00') {
      throw new Error('Hệ thống chỉ mở cửa từ 08:00 sáng! Không được đặt sớm hơn.');
    }
    if (endTime > '17:00') {
      throw new Error('Hệ thống kết thúc lúc 17:00 chiều! Không được đặt sau 17:00.');
    }
    if (startTime >= endTime) {
      throw new Error('Giờ kết thúc phải sau giờ bắt đầu!');
    }

    const startMins = toMinutes(startTime);
    const endMins = toMinutes(endTime);
    if (endMins - startMins < 60) {
      throw new Error('Chưa đủ thời gian tối thiểu! Thời gian mượn phòng phải từ 60 phút trở lên.');
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const defaultTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    const currentTimeStr = (simulatedTime && simulatedTime !== 'REAL_TIME') ? simulatedTime.slice(0, 5) : defaultTimeStr;

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    const bookingDate = date || todayStr;

    if (bookingDate === todayStr && startTime < currentTimeStr) {
      throw new Error(`Không thể đặt giờ quá khứ! Giờ hiện tại là ${currentTimeStr}, vui lòng chọn khung giờ sau thời điểm này.`);
    }

    // 3. Kiểm tra khóa phòng (Room Locks do Admin thiết lập)
    const activeLocks = db.prepare(`
      SELECT * FROM room_locks 
      WHERE roomId = ? AND (
        lockType = 'PERMANENT' OR 
        (lockType = 'TIME_SLOT' AND date = ?)
      )
    `).all(roomId, bookingDate);

    for (const lock of activeLocks) {
      if (lock.lockType === 'PERMANENT') {
        throw new Error(`Phòng ${roomId} hiện đang bị khóa tạm ngưng sử dụng${lock.reason ? ` (${lock.reason})` : ''}!`);
      }
      if (lock.lockType === 'TIME_SLOT') {
        const lockStartMins = toMinutes(lock.startTime);
        const lockEndMins = toMinutes(lock.endTime);
        if (startMins < lockEndMins && endMins > lockStartMins) {
          throw new Error(`Phòng ${roomId} đã bị khóa trong khung giờ ${lock.startTime} - ${lock.endTime}${lock.reason ? ` (${lock.reason})` : ''}!`);
        }
      }
    }

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

    // Chuẩn hóa email
    const emailToSave = studentEmail 
      ? studentEmail.trim().toLowerCase() 
      : `${sId.toLowerCase()}@student.hcmiu.edu.vn`;

    const newBooking = {
      id: 'BK' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      studentId: sId,
      studentEmail: emailToSave,
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
    syncJsonFromSqlite();

    return newBooking;
  },

  // 7. HỦY ĐẶT PHÒNG
  cancelBooking(bookingId, studentId, simulatedTime) {
    const b = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    if (!b) throw new Error('Không tìm thấy thông tin đơn đặt phòng!');

    if (b.status !== 'BOOKED') {
      throw new Error('Chỉ có thể hủy phòng khi ở trạng thái ĐÃ ĐẶT (chưa nhận phòng)!');
    }

    const now = new Date();
    if (simulatedTime && simulatedTime !== 'REAL_TIME') {
      const [sh, sm] = simulatedTime.split(':').map(Number);
      now.setHours(sh, sm, 0, 0);
    }

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    const isFutureBooking = b.date > todayStr;

    const d = now.getDate();
    const m = now.getMonth() + 1;
    const y = now.getFullYear();
    const pat1 = `%${d}/${m}/${y}%`;
    const pat2 = `%${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}%`;
    const targetStudent = normalizeStudentId(studentId || b.studentId);

    // Đếm số lần sinh viên đã bấm hủy trong ngày hôm nay từ nhật ký penalty_logs
    const countRow = db.prepare(`
      SELECT COUNT(*) as cancelCount 
      FROM penalty_logs 
      WHERE UPPER(studentId) = ? 
        AND reason LIKE '%Hủy đặt phòng%' 
        AND (date LIKE ? OR date LIKE ?)
    `).get(targetStudent, pat1, pat2);

    const currentCancelCount = countRow.cancelCount;

    let p = db.prepare('SELECT * FROM penalties WHERE UPPER(studentId) = ?').get(targetStudent);
    if (!p) {
      db.prepare(`
        INSERT INTO penalties (studentId, noShowCount, lateCheckoutCount, banUntil, isBannedPermanent)
        VALUES (?, 0, 0, NULL, 0)
      `).run(targetStudent);
      p = { studentId: targetStudent, noShowCount: 0, lateCheckoutCount: 0, banUntil: null, isBannedPermanent: 0 };
    }

    // Xử lý khi đã quá 3 lần hủy trong ngày (Từ lần thứ 4 trở đi)
    if (currentCancelCount >= 3) {
      db.prepare("UPDATE bookings SET status = 'CANCELLED' WHERE id = ?").run(bookingId);

      const banUntilDate = new Date(now.getTime() + 10 * 60 * 1000);
      if (!p.banUntil || new Date(p.banUntil) < banUntilDate) {
        db.prepare('UPDATE penalties SET banUntil = ? WHERE UPPER(studentId) = ?')
          .run(banUntilDate.toISOString(), targetStudent);
      }

      const nowStr = now.toLocaleString('vi-VN');
      const roomTypeLabel = isFutureBooking ? ' tương lai' : '';
      const desc = `[Cảnh cáo] Hủy đặt phòng${roomTypeLabel} ${b.roomId} quá 3 lần/ngày: Tạm cấm đặt phòng 10 phút.`;
      db.prepare(`
        INSERT INTO penalty_logs (studentId, date, reason)
        VALUES (?, ?, ?)
      `).run(targetStudent, nowStr, desc);

      syncJsonFromSqlite();
      const banUntilTimeStr = banUntilDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      return { 
        success: true, 
        remainingCancels: 0,
        isWarning: true,
        penaltyType: 'TEMPORARY_BAN_10M',
        message: `Đã hủy phòng! Cảnh cáo: Do bạn đã hủy phòng quá 3 lần trong ngày, bạn bị tạm khóa quyền đặt phòng 10 phút (mở lại lúc ${banUntilTimeStr}).`
      };
    }

    // Nếu chưa vượt quá 3 lần (Lần 1, 2, 3): Cho phép hủy bình thường
    db.prepare("UPDATE bookings SET status = 'CANCELLED' WHERE id = ?").run(bookingId);

    const newCancelCount = currentCancelCount + 1;
    const nowStr = now.toLocaleString('vi-VN');
    const roomTypeLabel = isFutureBooking ? 'tương lai ' : '';

    db.prepare(`
      INSERT INTO penalty_logs (studentId, date, reason)
      VALUES (?, ?, ?)
    `).run(
      targetStudent, 
      nowStr, 
      `Hủy đặt phòng ${roomTypeLabel}${b.roomId} (Lần ${newCancelCount}/3 trong ngày)`
    );

    syncJsonFromSqlite();
    return { 
      success: true, 
      remainingCancels: 3 - newCancelCount,
      isWarning: false,
      message: `Hủy thành công! Bạn còn ${3 - newCancelCount} lần hủy hôm nay.`
    };
  },

  // 8. Xác nhận nhận phòng
  confirmCheckIn(bookingId, simulatedTime) {
    const b = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    if (!b) throw new Error('Không tìm thấy phòng!');

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    if (b.date > todayStr) {
      throw new Error(`Chưa đến ngày nhận phòng! Lịch hẹn của bạn là ngày ${b.date}.`);
    }
    if (b.date < todayStr) {
      throw new Error(`Đơn đặt phòng này thuộc ngày ${b.date} đã quá hạn nhận phòng!`);
    }

    const currentMins = getEffectiveMins(simulatedTime);
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
    syncJsonFromSqlite();
    return b;
  },

  // 9. Xác nhận trả phòng
  confirmCheckOut(bookingId, simulatedTime) {
    const b = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    if (!b) throw new Error('Không tìm thấy phòng!');

    if (b.status !== 'CHECKED_IN') {
      throw new Error('Bạn chưa bấm xác nhận nhận phòng nên không thể bấm trả phòng!');
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    if (b.date > todayStr) {
      throw new Error(`Chưa đến ngày trả phòng! Lịch hẹn của bạn là ngày ${b.date}.`);
    }

    const currentMins = getEffectiveMins(simulatedTime);
    const [endH, endM] = b.endTime.split(':').map(Number);
    const endMins = endH * 60 + endM;

    // Bảo hiểm trả phòng: 30 phút trước giờ trả và 30 phút sau giờ trả [endTime - 30, endTime + 30]
    if (b.date === todayStr && currentMins < endMins - 30) {
      const remainingMins = (endMins - 30) - currentMins;
      const openTimeStr = toTimeStr(endMins - 30);
      throw new Error(`Chưa đến giờ trả phòng! Nút sẽ kích hoạt trước giờ kết thúc 30 phút lúc ${openTimeStr} (còn ${remainingMins} phút).`);
    }

    if (b.date === todayStr && currentMins > endMins + 30) {
      throw new Error('Đã quá thời hạn 30 phút trả phòng!');
    }

    db.prepare("UPDATE bookings SET status = 'COMPLETED' WHERE id = ?").run(bookingId);
    b.status = 'COMPLETED';
    syncJsonFromSqlite();
    return b;
  },

  // 9b. Tự động kiểm tra và giải phóng các phòng quá hạn nhận phòng (+10p) hoặc quá hạn trả phòng (+30p)
  autoExpireOverdueBookings(simulatedTime) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    const currentMins = getEffectiveMins(simulatedTime);

    const activeBookings = db.prepare("SELECT * FROM bookings WHERE status IN ('BOOKED', 'CHECKED_IN')").all();
    if (!activeBookings || activeBookings.length === 0) return 0;

    let expiredCount = 0;
    for (const b of activeBookings) {
      const isPastDate = b.date < todayStr;
      const isToday = b.date === todayStr;

      if (b.status === 'BOOKED') {
        const startMins = toMinutes(b.startTime);
        // Quá hạn nhận phòng 10 phút
        const isOverdue = isPastDate || (isToday && currentMins > (startMins + 10));
        if (isOverdue) {
          this.handleNoShowPenalty(b.id);
          expiredCount++;
        }
      } else if (b.status === 'CHECKED_IN') {
        const endMins = toMinutes(b.endTime);
        // Quá hạn trả phòng 30 phút
        const isOverdue = isPastDate || (isToday && currentMins > (endMins + 30));
        if (isOverdue) {
          this.handleLateCheckOutPenalty(b.id);
          expiredCount++;
        }
      }
    }

    return expiredCount;
  },

  // 10. Xử lý phạt vi phạm No-Show
  handleNoShowPenalty(bookingId) {
    const b = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    if (!b || b.status === 'CANCELLED') return;

    db.prepare("UPDATE bookings SET status = 'CANCELLED' WHERE id = ?").run(bookingId);
    const sId = normalizeStudentId(b.studentId);

    let p = db.prepare('SELECT * FROM penalties WHERE UPPER(studentId) = ?').get(sId);
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
      banUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      desc = `[Lần 1] Khóa 7 ngày: Không bấm nhận phòng ${b.roomId} sau 10 phút.`;
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
      WHERE UPPER(studentId) = ?
    `).run(newNoShow, banUntil, isBannedPermanent, sId);

    db.prepare(`
      INSERT INTO penalty_logs (studentId, date, reason)
      VALUES (?, ?, ?)
    `).run(sId, new Date().toLocaleString('vi-VN'), desc);

    syncJsonFromSqlite();
    return { booking: { ...b, status: 'CANCELLED' } };
  },

  // 11. Xử lý phạt vi phạm trả phòng trễ
  handleLateCheckOutPenalty(bookingId) {
    const b = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    if (!b || b.status === 'COMPLETED' || b.status === 'CANCELLED') return;

    db.prepare("UPDATE bookings SET status = 'COMPLETED' WHERE id = ?").run(bookingId);
    const sId = normalizeStudentId(b.studentId);

    let p = db.prepare('SELECT * FROM penalties WHERE UPPER(studentId) = ?').get(sId);
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
      WHERE UPPER(studentId) = ?
    `).run(newLate, banUntil, isBannedPermanent, sId);

    db.prepare(`
      INSERT INTO penalty_logs (studentId, date, reason)
      VALUES (?, ?, ?)
    `).run(sId, new Date().toLocaleString('vi-VN'), desc);

    syncJsonFromSqlite();
    return { booking: { ...b, status: 'COMPLETED' } };
  },

  // 12. Lấy dữ liệu Timeline chi tiết kèm thông tin Sinh viên đã đặt & Khóa phòng (Dành cho Admin Devpage)
  getScheduleMatrixWithDetails(targetDate, simulatedTime) {
    this.autoExpireOverdueBookings(simulatedTime);
    const allRooms = db.prepare('SELECT id, name, category, building, floor, capacity FROM rooms ORDER BY id ASC').all();

    const bookings = db.prepare(`
      SELECT b.id, b.roomId, b.studentId, b.studentEmail, b.startTime, b.endTime, b.memberCount, b.status,
             u.fullName
      FROM bookings b
      LEFT JOIN users u ON UPPER(b.studentId) = UPPER(u.studentId)
      WHERE b.date = ? AND b.status != 'CANCELLED'
      ORDER BY b.startTime ASC
    `).all(targetDate);

    const locks = db.prepare(`
      SELECT * FROM room_locks 
      WHERE lockType = 'PERMANENT' OR (lockType = 'TIME_SLOT' AND date = ?)
      ORDER BY startTime ASC
    `).all(targetDate);

    return allRooms.map(room => {
      const roomBookings = bookings.filter(b => b.roomId === room.id);
      const roomLocks = locks.filter(l => l.roomId === room.id);

      return {
        ...room,
        roomId: room.id,
        bookings: roomBookings,
        locks: roomLocks,
        isPermanentlyLocked: roomLocks.some(l => l.lockType === 'PERMANENT')
      };
    });
  },

  // 13. Lấy tất cả lệnh khóa phòng hiện tại
  getAllRoomLocks() {
    return db.prepare(`
      SELECT rl.*, r.name as roomName, r.category as roomCategory, r.building, r.floor, r.capacity
      FROM room_locks rl
      LEFT JOIN rooms r ON rl.roomId = r.id
      ORDER BY rl.lockedAt DESC
    `).all();
  },

  // 14. Tạo lệnh khóa phòng mới (PERMANENT hoặc TIME_SLOT)
  createRoomLock({ roomId, lockType, date, startTime, endTime, reason, lockedBy }) {
    const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);
    if (!room) throw new Error(`Không tìm thấy phòng ${roomId}!`);

    if (!['PERMANENT', 'TIME_SLOT'].includes(lockType)) {
      throw new Error('Loại khóa phòng không hợp lệ!');
    }

    if (lockType === 'TIME_SLOT') {
      if (!date || !startTime || !endTime) {
        throw new Error('Khóa theo khung giờ bắt buộc phải có Ngày, Giờ bắt đầu và Giờ kết thúc!');
      }
      if (startTime >= endTime) {
        throw new Error('Giờ kết thúc phải lớn hơn giờ bắt đầu!');
      }
    }

    const id = `LOCK_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const lockedAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO room_locks (id, roomId, lockType, date, startTime, endTime, reason, lockedAt, lockedBy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      roomId,
      lockType,
      lockType === 'TIME_SLOT' ? date : null,
      lockType === 'TIME_SLOT' ? startTime : null,
      lockType === 'TIME_SLOT' ? endTime : null,
      reason || 'Bảo trì phòng',
      lockedAt,
      lockedBy || 'Admin'
    );

    syncJsonFromSqlite();
    return {
      success: true,
      id,
      message: `Đã khóa thành công phòng ${roomId} (${lockType === 'PERMANENT' ? 'Vô thời hạn' : `${date} ${startTime}-${endTime}`})!`
    };
  },

  // 15. Mở khóa phòng (Xóa lệnh khóa)
  deleteRoomLock(lockId) {
    const lock = db.prepare('SELECT * FROM room_locks WHERE id = ?').get(lockId);
    if (!lock) throw new Error('Không tìm thấy lệnh khóa phòng!');

    db.prepare('DELETE FROM room_locks WHERE id = ?').run(lockId);
    syncJsonFromSqlite();
    return {
      success: true,
      message: `Đã mở khóa thành công phòng ${lock.roomId}!`
    };
  },

  // 16. Gỡ ban cho tài khoản sinh viên
  unbanStudent(studentId) {
    const sId = normalizeStudentId(studentId);
    const p = db.prepare('SELECT * FROM penalties WHERE UPPER(studentId) = ?').get(sId);
    if (!p) {
      throw new Error(`Không tìm thấy thông tin sinh viên ${sId}!`);
    }

    db.prepare(`
      UPDATE penalties 
      SET banUntil = NULL, isBannedPermanent = 0
      WHERE UPPER(studentId) = ?
    `).run(sId);

    db.prepare(`
      INSERT INTO penalty_logs (studentId, date, reason)
      VALUES (?, ?, ?)
    `).run(sId, new Date().toLocaleString('vi-VN'), '[Admin Devpage] Đã mở khóa/gỡ ban tài khoản.');

    syncJsonFromSqlite();
    return {
      success: true,
      message: `Đã gỡ ban thành công cho sinh viên ${sId}!`
    };
  }
};
