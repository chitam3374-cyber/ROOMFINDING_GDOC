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
    // 1. Kiểm tra trạng thái phạt của sinh viên
    const penaltyCheck = this.getStudentPenaltyStatus(studentId);
    if (!penaltyCheck.canBook) throw new Error(penaltyCheck.reason);

    // 2. Kiểm tra xem sinh viên đã có phòng đang hoạt động chưa
    const existing = this.getStudentActiveBooking(studentId);
    if (existing) throw new Error('Sinh viên này hiện đã có phòng đang hoạt động!');
    
    const startMins = toMinutes(startTime);
    const endMins = toMinutes(endTime);
    const duration = endMins - startMins;

    if (duration < 60) {
    throw new Error('Chưa đủ thời gian tối thiểu! Thời gian mượn phòng phải từ 60 phút trở lên.');
    }

    // 3. KIỂM TRA RÀNG BUỘC THỜI GIAN THỰC TẾ
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    
    // Lấy ngày hôm nay theo giờ địa phương (YYYY-MM-DD)
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    const bookingDate = date || todayStr;

    // Không cho đặt phòng trong ngày nếu đã sau 17:00
    if (bookingDate === todayStr && currentHour >= 17) {
      throw new Error('Hệ thống đã đóng cổng đặt phòng sau 17:00. Vui lòng quay lại vào ngày mai!');
    }

    // Không cho đặt lùi về khung giờ quá khứ
    if (bookingDate === todayStr && startTime < currentTimeStr) {
      throw new Error(`ERROR ${currentTimeStr}, vui lòng chọn khung giờ sau thời điểm này.`);
    }

    // Giới hạn giờ hoạt động từ 08:00 đến 17:00
    if (startTime < '08:00' || endTime > '17:00' || startTime >= endTime) {
      throw new Error('Khung giờ mượn phòng hợp lệ là từ 08:00 đến 17:00 và giờ kết thúc phải sau giờ bắt đầu!');
    }

    // 4. Kiểm tra va chạm lịch của phòng được chọn
    const hasConflict = DB.bookings.some(b => 
      b.roomId === roomId && 
      b.date === bookingDate && 
      b.status !== 'CANCELLED' && 
      checkOverlap(startTime, endTime, b.startTime, b.endTime)
    ) || DB.schedules.some(s => 
      s.roomId === roomId && 
      s.date === bookingDate && 
      checkOverlap(startTime, endTime, s.startTime, s.endTime)
    );

    if (hasConflict) {
      throw new Error(`Phòng ${roomId} đã có lịch đặt hoặc lịch học trong khung giờ ${startTime} - ${endTime}!`);
    }

    // 5. Tạo đơn đặt mới
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

    DB.bookings.push(newBooking);
    return newBooking;
  },

  confirmCheckIn(bookingId) {
    const b = DB.bookings.find(x => x.id === bookingId);
    if (!b) throw new Error('Không tìm thấy phòng!');

    // Tính thời gian hiện tại ra phút
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    // Giờ bắt đầu của phòng (VD: 08:00 -> 480 phút)
    const [startH, startM] = b.startTime.split(':').map(Number);
    const startMins = startH * 60 + startM;

    // Cửa sổ nhận phòng: Trước 10 phút (startMins - 10) đến trễ tối đa 10 phút (startMins + 10)
    if (currentMins < startMins - 10) {
      const waitMins = (startMins - 10) - currentMins;
      throw new Error(`Chưa đến giờ nhận phòng! Nút sẽ kích hoạt trước giờ bắt đầu 10 phút (còn ${waitMins} phút nữa).`);
    }

    if (currentMins > startMins + 10) {
      throw new Error('Đã quá thời hạn 10 phút nhận phòng đầu giờ!');
    }

    b.status = 'CHECKED_IN';
    return b;
  },

  confirmCheckOut(bookingId) {
    const b = DB.bookings.find(x => x.id === bookingId);
    if (!b) throw new Error('Không tìm thấy phòng!');

    if (b.status !== 'CHECKED_IN') {
      throw new Error('Bạn chưa bấm xác nhận nhận phòng nên không thể bấm trả phòng!');
    }

    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    // Giờ kết thúc của phòng (VD: 11:00 -> 660 phút)
    const [endH, endM] = b.endTime.split(':').map(Number);
    const endMins = endH * 60 + endM;

    // Cửa sổ trả phòng: Từ giờ kết thúc (endMins) đến tối đa 30 phút sau (endMins + 30)
    if (currentMins < endMins) {
      const remainingMins = endMins - currentMins;
      throw new Error(`Chưa đến giờ trả phòng! Nút sẽ kích hoạt khi kết thúc ca lúc ${b.endTime} (còn ${remainingMins} phút).`);
    }

    if (currentMins > endMins + 30) {
      throw new Error('Đã quá thời hạn 30 phút trả phòng!');
    }

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