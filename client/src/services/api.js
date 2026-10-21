const API_BASE = 'http://localhost:5000/api';

export const api = {
  // Lấy danh sách phòng marquee chạy ngang
  getMarqueeRooms: async () => {
    const res = await fetch(`${API_BASE}/rooms/marquee`);
    return res.json();
  },

  // Lấy ma trận lịch phòng 140 phòng
  getScheduleMatrix: async () => {
    const res = await fetch(`${API_BASE}/rooms/schedule-matrix`);
    return res.json();
  },

  // Lấy phòng khả dụng theo số người
  getAvailableRooms: async (memberCount) => {
    const res = await fetch(`${API_BASE}/rooms/available?memberCount=${memberCount || 1}`);
    return res.json();
  },

  // Kiểm tra sinh viên & trạng thái đặt phòng
  checkStudent: async (studentId) => {
    const res = await fetch(`${API_BASE}/students/${studentId.trim()}/check`);
    return res.json();
  },

  // Tạo đơn đặt phòng
  createBooking: async (payload) => {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Đặt phòng thất bại');
    return data;
  },

  // Mốc 1: Điểm danh nhận phòng
  checkIn: async (bookingId) => {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}/checkin`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Check-in thất bại');
    return data;
  },

  // Mốc 2: Điểm danh trả phòng
  checkOut: async (bookingId) => {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}/checkout`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Check-out thất bại');
    return data;
  },

  // Test vi phạm
  timeoutNoShow: async (bookingId) => {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}/timeout-noshow`, { method: 'POST' });
    return res.json();
  },

  timeoutLateCheckout: async (bookingId) => {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}/timeout-latecheckout`, { method: 'POST' });
    return res.json();
  }
};